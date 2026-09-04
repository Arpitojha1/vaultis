from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import Response, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import io
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session
from .audit import append_record, verify_chain
from .auth import create_token, current_user, password_hash
from .config import get_settings
from .database import get_db
from .models import AuditChain, Case, CaseAccess, ChunkPermission, Document, User
import hashlib
from pathlib import Path
from .rag import (
    decrypt_from_disk,
    get_allowed_chunk_ids,
    ingest_document,
    retrieve_answer,
)

app = FastAPI(title="VAULTIS API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origin_regex=".*", allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.on_event("startup")
async def preload_model():
    import httpx, asyncio
    settings = get_settings()
    async def _ping():
        try:
            async with httpx.AsyncClient(timeout=120) as client:
                await client.post(
                    f"{settings.ollama_base_url.rstrip('/')}/api/generate",
                    json={"model": settings.ollama_model, "keep_alive": -1}
                )
        except Exception as e:
            print(f"Failed to preload model: {e}")
    asyncio.create_task(_ping())


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=1, max_length=200)


class AnswerRequest(BaseModel):
    case_id: int
    question: str = Field(min_length=1, max_length=5000)
    document_id: int | None = None


class CreateCaseRequest(BaseModel):
    case_number: str = Field(min_length=1, max_length=80)
    title: str = Field(min_length=1, max_length=255)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/auth/login")
def login(request: LoginRequest, db: Session = Depends(get_db)) -> dict:
    user = db.scalar(select(User).where(User.username == request.username))
    if not user or not password_hash.verify(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    append_record(db, "auth_login", user.user_id, {"username": user.username, "role": user.role})
    db.commit()
    return {"token": create_token(user), "user": {"user_id": user.user_id, "username": user.username, "role": user.role}}


@app.get("/cases")
def list_cases(user: User = Depends(current_user), db: Session = Depends(get_db)) -> list[dict]:
    cases = db.scalars(select(Case).join(CaseAccess).where(CaseAccess.user_id == user.user_id).order_by(Case.case_id)).all()
    return [{"case_id": case.case_id, "case_number": case.case_number, "title": case.title, "status": case.status} for case in cases]


@app.post("/cases")
def create_case(request: CreateCaseRequest, user: User = Depends(current_user), db: Session = Depends(get_db)) -> dict:
    if db.scalar(select(Case).where(Case.case_number == request.case_number)):
        raise HTTPException(status_code=409, detail="Case number already exists")
    case = Case(case_number=request.case_number, title=request.title, status="under_investigation")
    db.add(case)
    db.flush()
    db.add(CaseAccess(case_id=case.case_id, user_id=user.user_id))
    append_record(db, "case_created", user.user_id, {"case_id": case.case_id, "case_number": case.case_number})
    db.commit()
    return {"case_id": case.case_id, "case_number": case.case_number, "title": case.title, "status": case.status}


@app.get("/cases/{case_id}/documents")
def list_documents(case_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)) -> list[dict]:
    permitted = db.scalar(select(CaseAccess).where(CaseAccess.case_id == case_id, CaseAccess.user_id == user.user_id))
    if not permitted:
        raise HTTPException(status_code=403, detail="No access to this case")
    docs = db.scalars(select(Document).where(Document.case_id == case_id).order_by(Document.document_id)).all()
    return [{"id": str(doc.document_id), "document_id": doc.document_id, "filename": doc.filename} for doc in docs]


@app.post("/cases/{case_id}/documents")
async def upload_document(case_id: int, file: UploadFile = File(...), sensitivity_level: str = Form("case_team"), disclosed_to_defense: bool = Form(False), user: User = Depends(current_user), db: Session = Depends(get_db)) -> dict:
    permitted = db.scalar(select(CaseAccess).where(CaseAccess.case_id == case_id, CaseAccess.user_id == user.user_id))
    if not permitted:
        raise HTTPException(status_code=403, detail="No access to this case")
    if sensitivity_level not in {"public", "case_team", "sealed"}:
        raise HTTPException(status_code=422, detail="Invalid sensitivity_level")
    document, chunks_created = await ingest_document(db, case_id, file, sensitivity_level, disclosed_to_defense)
    append_record(db, "document_ingest", user.user_id, {"case_id": case_id, "document_id": document.document_id, "filename": document.filename, "chunks_created": chunks_created})
    db.commit()
    return {"document_id": document.document_id, "filename": document.filename, "chunks_created": chunks_created}


@app.post("/answer_query")
async def answer_query(request: AnswerRequest, user: User = Depends(current_user), db: Session = Depends(get_db)) -> dict:
    permitted = db.scalar(select(CaseAccess).where(CaseAccess.case_id == request.case_id, CaseAccess.user_id == user.user_id))
    if not permitted:
        raise HTTPException(status_code=403, detail="No access to this case")

    if request.document_id is not None:
        document = db.get(Document, request.document_id)
        if not document or document.case_id != request.case_id:
            raise HTTPException(status_code=404, detail="Document not found in this case")
            
    answer, authorized, filtered, allowed_ids = await retrieve_answer(db, request.case_id, user.role, request.question, request.document_id)
    append_record(db, "evidentiary_query", user.user_id, {"case_id": request.case_id, "question": request.question, "chunks_used": allowed_ids})
    db.commit()
    return {"answer": answer, "authorized_chunks": authorized, "filtered_chunks": filtered}


@app.get("/documents/{document_id}/encryption-status")
def encryption_status(document_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)) -> dict:
    document = db.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    permitted = db.scalar(select(CaseAccess).where(CaseAccess.case_id == document.case_id, CaseAccess.user_id == user.user_id))
    if not permitted:
        raise HTTPException(status_code=403, detail="No access to this document")
    path = Path(document.encrypted_path)
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Encrypted document file not found")
    encrypted_data = path.read_bytes()
    if len(encrypted_data) < 13 or encrypted_data.startswith(b"%PDF-"):
        raise HTTPException(status_code=500, detail="Document encryption integrity check failed")
    return {"document_id": document.document_id, "encrypted": True, "algorithm": "AES-256-GCM", "encrypted_file_hash_sha256": hashlib.sha256(encrypted_data).hexdigest(), "original_filename": document.filename}

@app.get("/documents/{document_id}/view")
def view_document(
    document_id: int,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
) -> StreamingResponse:

    # 1. Check whether the document exists
    document = db.get(Document, document_id)

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found",
        )

    # 2. Check whether the user can access the case
    case_access = db.scalar(
        select(CaseAccess).where(
            CaseAccess.case_id == document.case_id,
            CaseAccess.user_id == user.user_id,
        )
    )

    if not case_access:
        raise HTTPException(
            status_code=403,
            detail={
                "message": "No access to this case",
                "document_id": document_id,
            },
        )

    # 3. Get every chunk belonging to this document
    document_chunks = db.scalars(
        select(ChunkPermission).where(
            ChunkPermission.document_id == document_id
        )
    ).all()

    total_chunks = len(document_chunks)

    # 4. Get the chunks this user's role is allowed to access
    allowed_chunk_ids = set(
        get_allowed_chunk_ids(
            db,
            document.case_id,
            user.role,
        )
    )

    authorized_chunks = sum(
        1
        for chunk in document_chunks
        if chunk.chunk_id in allowed_chunk_ids
    )

    denied_chunks = total_chunks - authorized_chunks

    # 5. The entire document can only be served
    # if every chunk is authorized
    if total_chunks == 0 or authorized_chunks != total_chunks:
        append_record(db, "document_view_denied", user.user_id, {"document_id": document_id})
        db.commit()
        raise HTTPException(
            status_code=403,
            detail={
                "message": "You do not have permission to view the complete document",
                "document_id": document_id,
                "total_chunks": total_chunks,
                "authorized_chunks": authorized_chunks,
                "denied_chunks": denied_chunks,
            },
        )

    # 6. Find the encrypted document
    encrypted_path = Path(document.encrypted_path)

    if not encrypted_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Encrypted document file not found",
        )

    # 7. Decrypt the document
    try:
        document_data = decrypt_from_disk(encrypted_path)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Failed to decrypt document",
        ) from exc

    # 8. Confirm this feature is serving a PDF
    if not document_data.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=415,
            detail="Document is not a PDF",
        )

    # 9. Return PDF for inline browser viewing
    append_record(db, "document_view_granted", user.user_id, {"document_id": document_id})
    db.commit()

    return StreamingResponse(
        io.BytesIO(document_data),
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'inline; filename="{document.filename}"'
            )
        },
    )

@app.get("/audit-events")
def audit_events(user: User = Depends(current_user), db: Session = Depends(get_db)) -> list[dict]:
    records = db.scalars(select(AuditChain).order_by(AuditChain.record_id)).all()
    return [{"record_id": r.record_id, "event_type": r.event_type, "actor_user_id": r.actor_user_id, "payload": r.payload, "timestamp": r.timestamp, "prev_hash": r.prev_hash, "record_hash": r.record_hash} for r in records]


@app.post("/verify-chain")
def verify(user: User = Depends(current_user), db: Session = Depends(get_db)) -> dict:
    valid, records_checked, broken_at_record = verify_chain(db)
    return {"valid": valid, "records_checked": records_checked, "broken_at_record": broken_at_record}


@app.post("/audit-events/{record_id}/tamper")
def tamper(record_id: int, db: Session = Depends(get_db)) -> dict:
    if not get_settings().enable_tamper_demo_endpoint:
        raise HTTPException(status_code=404, detail="Not found")
    record = db.get(AuditChain, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Audit record not found")
    record.payload = {**record.payload, "demo_tampered": True}
    db.commit()
    return {"record_id": record_id, "tampered": True}
