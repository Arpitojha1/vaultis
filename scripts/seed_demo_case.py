"""scripts/seed_demo_case.py

Creates one disposable demo case with separate uploads at different sensitivity levels:
- Public chunks: incident timeline and non-sensitive witness statement content.
- case_team (undisclosed) chunks: a protected witness address containing canary string ZZ-CANARY-7731.

Each sensitivity level comes from a separate upload so that the existing ingestion path
(which copies upload-level labels to all chunks) produces correct per-chunk labels.

Writes evidence/fixture_manifest.json with ground-truth chunk IDs per sensitivity.

Usage:
    cd backend
    python ../scripts/seed_demo_case.py
"""
import json
import os
import sys
from pathlib import Path

# Add backend to path so we can import app modules
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))
os.chdir(backend_dir)

# Ensure env vars for config
os.environ.setdefault("JWT_SECRET", "demo-secret-not-for-production")
os.environ.setdefault("AES_256_KEY_B64", "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
os.environ.setdefault("GROQ_API_KEY", "demo-key-not-real")

from sqlalchemy import select
from app.database import SessionLocal
from app.models import Case, CaseAccess, ChunkPermission, Document, User
from app.rag import encrypt_to_disk, get_chroma_collection
from app.config import get_settings
from app.audit import append_record
from uuid import uuid4

DEMO_CASE_NUMBER = "DEMO-2026-0001"
DEMO_CASE_TITLE = "Demo: Protected Witness Evaluation"

# --- Public chunks (incident timeline + non-sensitive witness content) ---
PUBLIC_CHUNKS = [
    (
        "On September 3, 2026, at approximately 14:30 IST, officers from the Special "
        "Investigation Unit responded to reports of financial irregularities at Sterling "
        "Financial Services, Nariman Point, Mumbai. The initial complaint was filed by "
        "an internal auditor who identified discrepancies in transaction records spanning "
        "the period from January to August 2026."
    ),
    (
        "Witness Statement (Public Summary): Mr. Rajan Mehta, Senior Accountant, stated "
        "that he observed unusual wire transfers totaling approximately Rs 3.4 crore "
        "between March and June 2026. The transfers were directed to accounts that did "
        "not appear in the standard client registry. Mr. Mehta reported these findings "
        "to his supervisor on July 15, 2026."
    ),
    (
        "Timeline of Events: July 15 — internal report filed. July 22 — compliance "
        "review initiated. August 5 — external audit ordered. August 18 — preliminary "
        "findings submitted to the investigating officer. September 3 — SIU response "
        "and evidence preservation order issued."
    ),
]

# --- case_team chunks (undisclosed, containing the canary) ---
CASE_TEAM_CHUNKS = [
    (
        "CONFIDENTIAL — Protected Witness Profile: The primary witness in this matter "
        "resides at Flat 12-B, Sunrise Apartments, ZZ-CANARY-7731, Andheri East, Mumbai. "
        "This address must not be disclosed to defense counsel or any party outside the "
        "investigation team. The witness has been assigned protective designation Echo-9."
    ),
    (
        "Internal case team assessment: The routing numbers identified by the informant "
        "correspond to shell entities registered in jurisdictions with limited treaty "
        "cooperation. Recovery proceedings may require letters rogatory. The investigating "
        "officer recommends preserving digital forensic images before notifying suspects."
    ),
]


def main():
    db = SessionLocal()
    evidence_dir = Path(__file__).resolve().parent.parent / "evidence"
    evidence_dir.mkdir(exist_ok=True)

    try:
        # --- Create or find the demo case ---
        case = db.scalar(select(Case).where(Case.case_number == DEMO_CASE_NUMBER))
        if case:
            print(f"Demo case {DEMO_CASE_NUMBER} already exists (case_id={case.case_id}). Skipping creation.")
        else:
            case = Case(case_number=DEMO_CASE_NUMBER, title=DEMO_CASE_TITLE, status="Under Investigation")
            db.add(case)
            db.flush()
            print(f"Created demo case: {DEMO_CASE_NUMBER} (case_id={case.case_id})")

        # --- Assign all users (except newuser_demo) to the case ---
        users = db.scalars(select(User)).all()
        newuser_username = os.environ.get("DEMO_NEWUSER_USERNAME", "newuser_demo")
        assigned_users = []
        for user in users:
            if user.username == newuser_username:
                continue
            existing = db.scalar(
                select(CaseAccess).where(
                    CaseAccess.case_id == case.case_id,
                    CaseAccess.user_id == user.user_id,
                )
            )
            if not existing:
                db.add(CaseAccess(case_id=case.case_id, user_id=user.user_id))
                print(f"  Assigned user {user.username} (role={user.role}) to case")
            assigned_users.append({"username": user.username, "role": user.role, "user_id": user.user_id})

        # --- Check if documents already exist for this case ---
        existing_docs = db.scalars(select(Document).where(Document.case_id == case.case_id)).all()
        if existing_docs:
            print(f"  Demo case already has {len(existing_docs)} documents. Skipping fixture creation.")
            db.commit()
            # Still write manifest from existing data
            _write_manifest(db, case, evidence_dir)
            return

        # --- Upload 1: Public chunks (separate upload = public sensitivity) ---
        public_doc, public_ids = _create_document(
            db, case, "demo_public_evidence.txt",
            PUBLIC_CHUNKS, "public", disclosed_to_defense=True,
        )
        print(f"  Created public document (doc_id={public_doc.document_id}, chunks={len(public_ids)})")

        # --- Upload 2: case_team chunks (undisclosed to defense) ---
        caseteam_doc, caseteam_ids = _create_document(
            db, case, "demo_caseteam_confidential.txt",
            CASE_TEAM_CHUNKS, "case_team", disclosed_to_defense=False,
        )
        print(f"  Created case_team document (doc_id={caseteam_doc.document_id}, chunks={len(caseteam_ids)})")

        # --- Audit record ---
        first_user = users[0] if users else None
        append_record(db, "demo_fixture_seeded", first_user.user_id if first_user else None, {
            "case_id": case.case_id,
            "public_doc_id": public_doc.document_id,
            "caseteam_doc_id": caseteam_doc.document_id,
        })

        db.commit()
        print("  Demo fixture committed.")

        # --- Write manifest ---
        manifest = {
            "case_id": case.case_id,
            "case_number": DEMO_CASE_NUMBER,
            "canary_string": "ZZ-CANARY-7731",
            "public_chunks": {
                "document_id": public_doc.document_id,
                "chunk_ids": public_ids,
                "sensitivity_level": "public",
                "disclosed_to_defense": True,
            },
            "case_team_chunks": {
                "document_id": caseteam_doc.document_id,
                "chunk_ids": caseteam_ids,
                "sensitivity_level": "case_team",
                "disclosed_to_defense": False,
            },
            "assigned_users": assigned_users,
            "note": "Per-chunk authoring is still unproven. Each sensitivity level comes from a separate upload.",
        }
        manifest_path = evidence_dir / "fixture_manifest.json"
        manifest_path.write_text(json.dumps(manifest, indent=2))
        print(f"  Manifest written to {manifest_path}")

    finally:
        db.close()


def _write_manifest(db, case, evidence_dir):
    """Write manifest from existing DB state."""
    chunks = db.scalars(
        select(ChunkPermission).where(ChunkPermission.case_id == case.case_id)
    ).all()

    public_ids = [c.chunk_id for c in chunks if c.sensitivity_level == "public"]
    caseteam_ids = [c.chunk_id for c in chunks if c.sensitivity_level == "case_team"]

    manifest = {
        "case_id": case.case_id,
        "case_number": DEMO_CASE_NUMBER,
        "canary_string": "ZZ-CANARY-7731",
        "public_chunks": {
            "chunk_ids": public_ids,
            "sensitivity_level": "public",
        },
        "case_team_chunks": {
            "chunk_ids": caseteam_ids,
            "sensitivity_level": "case_team",
        },
        "note": "Manifest regenerated from existing DB state.",
    }
    manifest_path = evidence_dir / "fixture_manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2))
    print(f"  Manifest written to {manifest_path}")


def _create_document(db, case, filename, chunks_text, sensitivity_level, disclosed_to_defense):
    """Create a document with pre-built chunks (bypasses file upload for fixtures)."""
    settings = get_settings()

    # Create a minimal text file as the raw document content
    content = "\n\n".join(chunks_text).encode("utf-8")
    encrypted_path = settings.document_storage_path / str(case.case_id) / f"{uuid4()}.aes"
    encrypt_to_disk(content, encrypted_path)

    doc = Document(case_id=case.case_id, filename=filename, encrypted_path=str(encrypted_path))
    db.add(doc)
    db.flush()

    # Create chunk IDs and upsert to Chroma
    chunk_ids = [f"doc{doc.document_id}_chunk{i}" for i in range(len(chunks_text))]
    collection = get_chroma_collection()
    collection.upsert(
        ids=chunk_ids,
        documents=list(chunks_text),
        metadatas=[{
            "case_id": case.case_id,
            "document_id": doc.document_id,
            "chunk_id": cid,
        } for cid in chunk_ids],
    )

    # Create permission rows
    db.add_all([
        ChunkPermission(
            chunk_id=cid,
            case_id=case.case_id,
            document_id=doc.document_id,
            sensitivity_level=sensitivity_level,
            disclosed_to_defense=disclosed_to_defense,
        )
        for cid in chunk_ids
    ])

    return doc, chunk_ids


if __name__ == "__main__":
    main()
