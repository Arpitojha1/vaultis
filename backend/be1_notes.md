# Backend Engineer 1 (BE1) - Sprint Notes

## Overview
This document outlines the architectural logic and exact code changes made to implement the two missing features from the Phase 3 Document Layer:
1. **Task B15:** The `GET /documents/{id}/view` endpoint for secure, permission-gated document viewing.
2. **Task B9:** Adding optional `document_id` scoping to the `POST /answer_query` RAG pipeline.

---

## 1. Task B15: Secure Document Viewing
### The Logic
When a user requests to view a raw PDF document, we cannot simply serve the file. Vaultis operates on chunk-level permissions, meaning a single document might contain both public information and highly classified secrets (e.g., an undercover informant's identity). 

To solve this securely:
1. **Case-Level Gate:** We first verify the user is assigned to the case.
2. **Chunk-Level Gate:** We query PostgreSQL to determine the user's access rights for *every single chunk* of that specific document.
3. **All-or-Nothing Access:** If the user is missing access to even one chunk, we completely deny the view request (403 Forbidden). We return exactly how many chunks they can and cannot see, so the frontend can display a helpful error message.
4. **In-Memory Decryption:** If they have 100% chunk coverage, we read the AES-GCM encrypted file from the disk. We extract the 12-byte cryptographic nonce, decrypt the ciphertext securely in memory, and stream the raw bytes back to the browser.
5. **Auditing:** Every single decision—whether it's a denial due to missing case access, a denial due to missing chunk access, or a successful grant—is immutably logged to the blockchain-style audit chain.

---

## 2. Task B9: Document-Scoped Queries
### The Logic
Previously, our RAG (Retrieval-Augmented Generation) pipeline pulled context from the entire case. We needed the ability for users to say "Chat about *this specific document*".

To solve this cleanly:
1. **Optional Parameter:** We added an optional `document_id` field to the request payload.
2. **Double-Filtering:** When provided, we narrow down the search in two places:
   - **PostgreSQL (Security):** We filter the user's `allowed_ids` list down to *only* include chunks that belong to that specific document.
   - **ChromaDB (Retrieval):** We append an `$and` filter to the ChromaDB query so the AI only retrieves text from that specific document.
3. **Seamless Fallback:** If no `document_id` is provided, the system ignores the filters and behaves exactly as it did before (case-wide querying).

---

## Exhaustive Changelog

### `app/rag.py`
- **Added `decrypt_from_disk(source: Path) -> bytes`:**
  - Reads raw binary data from the requested filepath.
  - Slices the first 12 bytes to act as the initialization vector (`nonce`).
  - Uses the `cryptography` library's `AESGCM` class to decrypt the remaining ciphertext.
  - Returns the raw, unencrypted bytes.
- **Modified `retrieve_answer`:**
  - Added the optional `document_id: int | None = None` parameter to the function signature.
  - Added a conditional query to filter the PostgreSQL `ChunkPermission` fetch by `document_id` when it is provided.
  - Added a list comprehension to intersect the user's global `allowed_ids` with the document's valid chunk IDs.
  - Dynamically built the ChromaDB `where_clause`. Appended `{"document_id": document_id}` to the `$and` array when a document ID is provided.

### `app/main.py`
- **Imports:** 
  - Added `import io` and `from fastapi.responses import StreamingResponse`.
- **Modified `AnswerRequest` (Pydantic Model):**
  - Added `document_id: int | None = None`.
- **Modified `answer_query` (`POST /answer_query`):**
  - Added strict validation to ensure the provided `document_id` actually exists and belongs to the requested `case_id` (raising a `404` if invalid).
  - Passed `request.document_id` through to the `retrieve_answer` function call.
- **Added `view_document` (`GET /documents/{document_id}/view`):**
  - Added `CaseAccess` database check. If missing, logs a `"document_view_denied"` audit record and raises `403`.
  - Added chunk coverage validation. Calculated `total_chunks` and `authorized_chunks`.
  - If coverage is incomplete, logs a `"document_view_denied"` audit record and raises `403` with the payload: `{total_chunks, authorized_chunks, denied_chunks}`.
  - Implemented the decryption phase by passing the `encrypted_path` to `decrypt_from_disk`.
  - Added a magic-byte validation check (`document_data.startswith(b"%PDF-")`) to ensure we only serve valid PDFs.
  - Logged a `"document_view_granted"` audit record upon success.
  - Returned the decrypted bytes wrapped in a `StreamingResponse(io.BytesIO(document_data))` with the `application/pdf` media type and inline content disposition.
