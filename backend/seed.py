"""Idempotent demo data. Run after `alembic upgrade head` from backend/.

Passwords fall back to legacy defaults when DEMO_* env vars are absent.
Set DEMO_ACCOUNTS_ENABLED=false to skip demo user creation entirely.
"""
import logging
import os
from sqlalchemy import select
from app.audit import append_record
from app.auth import password_hash
from app.database import SessionLocal
from app.models import AuditChain, Case, CaseAccess, ChunkPermission, Document, User
from app.rag import get_chroma_collection

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def _get_env(var: str, default: str) -> str:
    """Return os.environ[var], or default with a warning if the var is absent."""
    value = os.environ.get(var)
    if value is None:
        logger.warning("env var %s is not set — falling back to hardcoded default", var)
        return default
    return value


# Build demo account list from env vars, falling back to original hardcoded defaults.
# Each tuple is (username, password, role).
_DEMO_ROLE_KEYS = [
    # (env_prefix,  legacy_username,  legacy_password,   db_role)
    ("IO",         "investigator",   "investigator-demo", "investigating_officer"),
    ("PROSECUTOR", "prosecutor",     "prosecutor-demo",   "prosecutor"),
    ("DEFENSE",    "defense",        "defense-demo",      "defense_lawyer"),
    ("JUDGE",      "judge",          "judge-demo",        "judge"),
]

USERS = [
    (
        _get_env(f"DEMO_{prefix}_USERNAME", legacy_user),
        _get_env(f"DEMO_{prefix}_PASSWORD", legacy_pass),
        role,
    )
    for prefix, legacy_user, legacy_pass, role in _DEMO_ROLE_KEYS
]

CASES = [
    ("CR-2026-8841", "State v. Sterling Financial Syndicate", "In Trial"),
    ("INV-2026-0419", "Operation Dark Harbor", "Under Investigation"),
    ("SEC-2026-1102", "OmniCorp Whistleblower", "Pre-Trial Discovery"),
]
CHUNKS = [
    ("public", True, "A disclosed financial ledger records a $4.2 million transfer to Cayman Zenith Trust."),
    ("case_team", False, "Confidential informant Echo-7 identified the account handler and the off-book routing number."),
    ("sealed", False, "Sealed Title III intercept contains an informant safehouse location and identity."),
]


def main() -> None:
    demo_accounts_enabled = _get_env("DEMO_ACCOUNTS_ENABLED", "true").strip().lower() != "false"

    db = SessionLocal()
    try:
        users: dict[str, User] = {}

        if demo_accounts_enabled:
            for username, password, role in USERS:
                user = db.scalar(select(User).where(User.username == username))
                if not user:
                    user = User(username=username, password_hash=password_hash.hash(password), role=role)
                    db.add(user)
                    db.flush()
                users[username] = user
        else:
            logger.info("DEMO_ACCOUNTS_ENABLED=false — skipping demo user creation")
            # Populate users dict from existing DB rows so case-seeding still works
            for prefix, legacy_user, legacy_pass, role in _DEMO_ROLE_KEYS:
                username = _get_env(f"DEMO_{prefix}_USERNAME", legacy_user)
                user = db.scalar(select(User).where(User.username == username))
                if user:
                    users[username] = user

        for number, title, status in CASES:
            case = db.scalar(select(Case).where(Case.case_number == number))
            if not case:
                case = Case(case_number=number, title=title, status=status)
                db.add(case)
                db.flush()
            for user in users.values():
                if not db.scalar(select(CaseAccess).where(CaseAccess.case_id == case.case_id, CaseAccess.user_id == user.user_id)):
                    db.add(CaseAccess(case_id=case.case_id, user_id=user.user_id))
            if not db.scalar(select(Document).where(Document.case_id == case.case_id)):
                document = Document(case_id=case.case_id, filename="demo_evidence.txt", encrypted_path="seed-data/no-original-file")
                db.add(document)
                db.flush()
                ids = [f"doc{document.document_id}_chunk{index}" for index in range(len(CHUNKS))]
                get_chroma_collection().upsert(ids=ids, documents=[text for _, _, text in CHUNKS], metadatas=[{"case_id": case.case_id, "document_id": document.document_id, "chunk_id": chunk_id} for chunk_id in ids])
                db.add_all([ChunkPermission(chunk_id=chunk_id, case_id=case.case_id, document_id=document.document_id, sensitivity_level=level, disclosed_to_defense=defense) for chunk_id, (level, defense, _) in zip(ids, CHUNKS)])

        if demo_accounts_enabled and not db.scalar(select(User).limit(1)):
            raise RuntimeError("Seed user creation failed")

        if users and not db.scalar(select(AuditChain.record_id).limit(1)):
            first_user = next(iter(users.values()))
            append_record(db, "seed_initialized", first_user.user_id, {"cases": len(CASES), "purpose": "demo fixture initialization"})

        db.commit()
        print("Seed complete. Re-running is safe.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
