"""Idempotent demo data. Run after `alembic upgrade head` from backend/.

Passwords: investigator-demo, prosecutor-demo, defense-demo, judge-demo.
"""
from sqlalchemy import select
from app.audit import append_record
from app.auth import password_hash
from app.database import SessionLocal
from app.models import AuditChain, Case, CaseAccess, ChunkPermission, Document, User
from app.rag import get_chroma_collection

USERS = [
    ("investigator", "investigator-demo", "investigating_officer"),
    ("prosecutor", "prosecutor-demo", "prosecutor"),
    ("defense", "defense-demo", "defense_lawyer"),
    ("judge", "judge-demo", "judge"),
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
    db = SessionLocal()
    try:
        users: dict[str, User] = {}
        for username, password, role in USERS:
            user = db.scalar(select(User).where(User.username == username))
            if not user:
                user = User(username=username, password_hash=password_hash.hash(password), role=role)
                db.add(user)
                db.flush()
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
        if not db.scalar(select(User).limit(1)):
            raise RuntimeError("Seed user creation failed")
        if not db.scalar(select(AuditChain.record_id).limit(1)):
            append_record(db, "seed_initialized", users["judge"].user_id, {"cases": len(CASES), "purpose": "demo fixture initialization"})
        db.commit()
        print("Seed complete. Re-running is safe.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
