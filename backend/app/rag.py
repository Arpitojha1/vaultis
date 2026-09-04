"""Ingestion and retrieval. PostgreSQL decides permissions before Chroma is queried."""
import base64
import os
from pathlib import Path
from uuid import uuid4
import httpx
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from fastapi import HTTPException, UploadFile
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sqlalchemy import or_, select
from sqlalchemy.orm import Session
from .config import get_settings
from .models import ChunkPermission, Document


def get_chroma_collection():
    # pyrefly: ignore [missing-import]
    import chromadb
    settings = get_settings()
    settings.chroma_path.mkdir(parents=True, exist_ok=True)
    client = chromadb.PersistentClient(path=str(settings.chroma_path))
    return client.get_or_create_collection("vaultis_chunks")


def get_allowed_chunk_ids(db: Session, case_id: int, user_role: str) -> list[str]:
    """Permission truth is freshly selected from PostgreSQL for every query."""
    permitted_team_roles = ("investigating_officer", "prosecutor", "judge")
    policy = [ChunkPermission.sensitivity_level == "public"]
    if user_role in permitted_team_roles:
        policy.append(ChunkPermission.sensitivity_level.in_(("public", "case_team")))
    if user_role == "defense_lawyer":
        policy.append(ChunkPermission.disclosed_to_defense.is_(True))
    return list(db.scalars(select(ChunkPermission.chunk_id).where(ChunkPermission.case_id == case_id, or_(*policy))).all())


def _aes_key() -> bytes:
    key = base64.b64decode(get_settings().aes_256_key_b64)
    if len(key) != 32:
        raise RuntimeError("AES_256_KEY_B64 must decode to exactly 32 bytes")
    return key


def encrypt_to_disk(data: bytes, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    nonce = os.urandom(12)
    destination.write_bytes(nonce + AESGCM(_aes_key()).encrypt(nonce, data, None))

def decrypt_from_disk(source: Path) -> bytes:
    encrypted_data = source.read_bytes()

    if len(encrypted_data) < 13:
        raise ValueError("Encrypted document is invalid")

    nonce = encrypted_data[:12]
    ciphertext = encrypted_data[12:]

    return AESGCM(_aes_key()).decrypt(
        nonce,
        ciphertext,
        None
    )


def extract_text(filename: str, data: bytes) -> str:
    # Prefer embedded PDF text, then OCR scanned PDFs/images through Tesseract.
    suffix = Path(filename).suffix.lower()
    if suffix == ".pdf":
        try:
            # pyrefly: ignore [missing-import]
            from pypdf import PdfReader
            from io import BytesIO
            text = "\n".join(page.extract_text() or "" for page in PdfReader(BytesIO(data)).pages)
            if text.strip():
                return text
        except Exception:
            pass
        try:
            from io import BytesIO
            # pyrefly: ignore [missing-import]
            from pdf2image import convert_from_bytes
            # pyrefly: ignore [missing-import]
            import pytesseract
            text = "\n".join(pytesseract.image_to_string(page) for page in convert_from_bytes(data))
            if text.strip():
                return text
        except Exception:
            pass
    if suffix in {".png", ".jpg", ".jpeg", ".tif", ".tiff", ".bmp"}:
        try:
            from io import BytesIO
            from PIL import Image
            import pytesseract
            text = pytesseract.image_to_string(Image.open(BytesIO(data)))
            if text.strip():
                return text
        except Exception:
            pass
    return data.decode("utf-8", errors="replace")


async def ingest_document(db: Session, case_id: int, file: UploadFile, sensitivity_level: str, disclosed_to_defense: bool) -> tuple[Document, int]:
    data = await file.read()
    if not data:
        raise HTTPException(status_code=422, detail="Uploaded file is empty")
    filename = Path(file.filename or "upload.bin").name
    encrypted_path = get_settings().document_storage_path / str(case_id) / f"{uuid4()}.aes"
    encrypt_to_disk(data, encrypted_path)
    document = Document(case_id=case_id, filename=filename, encrypted_path=str(encrypted_path))
    db.add(document)
    db.flush()
    chunks = RecursiveCharacterTextSplitter(chunk_size=900, chunk_overlap=120).split_text(extract_text(filename, data))
    chunks = [chunk for chunk in chunks if chunk.strip()] or ["[Document contained no extractable text]"]
    ids = [f"doc{document.document_id}_chunk{index}" for index in range(len(chunks))]
    get_chroma_collection().upsert(ids=ids, documents=chunks, metadatas=[{"case_id": case_id, "document_id": document.document_id, "chunk_id": chunk_id} for chunk_id in ids])
    db.add_all([ChunkPermission(chunk_id=chunk_id, case_id=case_id, document_id=document.document_id, sensitivity_level=sensitivity_level, disclosed_to_defense=disclosed_to_defense) for chunk_id in ids])
    return document, len(ids)


async def answer_with_groq(question: str, authorized_text: list[str]) -> str:
    """The prompt contains only already-authorized retrieval results; no secrecy instruction is used."""
    context = "\n\n".join(f"[{i + 1}] {text}" for i, text in enumerate(authorized_text))
    prompt = f"Answer the legal case question using only this evidence context. If insufficient, say so.\n\nEvidence context:\n{context}\n\nQuestion: {question}"
    settings = get_settings()
    import groq
    from groq import AsyncGroq
    try:
        client = AsyncGroq(api_key=settings.groq_api_key, timeout=60.0)
        response = await client.chat.completions.create(
            model=settings.groq_model,
            messages=[{"role": "user", "content": prompt}],
            stream=False
        )
        return response.choices[0].message.content.strip()
    except groq.GroqError as exc:
        raise HTTPException(status_code=503, detail="Groq API is unavailable or rate limited") from exc


async def retrieve_answer(db: Session, case_id: int, user_role: str, question: str, document_id: int | None = None) -> tuple[str, list[dict], list[dict], list[str]]:
    allowed_ids = get_allowed_chunk_ids(db, case_id, user_role)
    
    query = select(ChunkPermission).where(ChunkPermission.case_id == case_id)
    if document_id is not None:
        query = query.where(ChunkPermission.document_id == document_id)
    all_permissions = db.scalars(query).all()
    
    if document_id is not None:
        valid_chunk_ids = {p.chunk_id for p in all_permissions}
        allowed_ids = [cid for cid in allowed_ids if cid in valid_chunk_ids]

    allowed_set = set(allowed_ids)
    filtered = [{"chunk_id": p.chunk_id, "sensitivity_level": p.sensitivity_level, "reason": "Not disclosed for the authenticated role"} for p in all_permissions if p.chunk_id not in allowed_set]
    if not allowed_ids:
        return "No authorized information is available for this case.", [], filtered, allowed_ids
    # This $in clause is intentionally an intersection with PostgreSQL's freshly computed allow-list.
    where_clause = {"$and": [{"case_id": case_id}, {"chunk_id": {"$in": allowed_ids}}]}
    if document_id is not None:
        where_clause["$and"].append({"document_id": document_id})
        
    result = get_chroma_collection().query(
        query_texts=[question], 
        n_results=min(8, len(allowed_ids)), 
        where=where_clause
    )
    ids = result.get("ids", [[]])[0]
    texts = result.get("documents", [[]])[0]
    metadata = result.get("metadatas", [[]])[0]
    authorized = [{"chunk_id": chunk_id, "text": text, "document_id": item["document_id"], "sensitivity_level": db.get(ChunkPermission, chunk_id).sensitivity_level} for chunk_id, text, item in zip(ids, texts, metadata)]
    answer = await answer_with_groq(question, [chunk["text"] for chunk in authorized])
    return answer, authorized, filtered, allowed_ids
