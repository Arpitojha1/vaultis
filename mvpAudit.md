# VAULTIS MVP Audit — Verified Against Code

> Audit date: 2026-09-04 · Audited commit: HEAD on `main`
> Method: every file read in full, code paths traced end-to-end, no item marked DONE on the strength of a variable name or comment alone.

---

## Backend Checklist

| # | Deliverable | Status | Evidence |
|---|---|---|---|
| B1 | Postgres schema: `users`, `cases`, `case_access`, `documents`, `chunk_permissions`, `audit_chain` | **DONE** | All 6 tables defined in [models.py](file:///c:/Users/Arpit/vaultis/backend/app/models.py) (L7–L57) with correct columns/FKs. Alembic migration [0001_initial_schema.py](file:///c:/Users/Arpit/vaultis/backend/alembic/versions/0001_initial_schema.py) mirrors them. |
| B2 | `POST /auth/login` — real credential check, JWT issuance, role from DB | **DONE** | [main.py:L39-46](file:///c:/Users/Arpit/vaultis/backend/app/main.py#L39-L46): queries `User` by username, verifies via `password_hash.verify()`. [auth.py:L15-18](file:///c:/Users/Arpit/vaultis/backend/app/auth.py#L15-L18): `create_token()` reads `user.role` from DB record only. |
| B3 | Demo accounts sourced from env vars in seed script | **MISSING** | [seed.py:L12-17](file:///c:/Users/Arpit/vaultis/backend/seed.py#L12-L17): all 4 demo accounts are **hardcoded tuples** (`"investigator"`, `"investigator-demo"`, etc.). The `DEMO_*` env vars in [.env.example:L84-107](file:///c:/Users/Arpit/vaultis/backend/.env.example#L84-L107) are completely ignored. |
| B4 | `GET /cases` — filtered by real permission | **DONE** | [main.py:L49-52](file:///c:/Users/Arpit/vaultis/backend/app/main.py#L49-L52): joins `Case` with `CaseAccess` filtering on `user_id`. |
| B5 | `POST /cases` — creates case + `case_access` for creator | **DONE** | [main.py:L55-65](file:///c:/Users/Arpit/vaultis/backend/app/main.py#L55-L65): creates `Case`, then `CaseAccess(case_id, user.user_id)`, then audit record. |
| B6 | `POST /cases/{id}/documents` — full ingestion pipeline | **DONE** | [main.py:L68-78](file:///c:/Users/Arpit/vaultis/backend/app/main.py#L68-L78) → [rag.py:L82-97](file:///c:/Users/Arpit/vaultis/backend/app/rag.py#L82-L97): reads bytes → `extract_text()` (PyPDF fallback to pytesseract OCR, L48-79) → `RecursiveCharacterTextSplitter` (L92) → Chroma `upsert` (L95) → `ChunkPermission` rows (L96) → `encrypt_to_disk` with real `AESGCM` (L42-45) → audit record (L76). |
| B7 | `get_allowed_chunk_ids` per spec | **DONE** | [rag.py:L24-32](file:///c:/Users/Arpit/vaultis/backend/app/rag.py#L24-L32): fresh SQL query every call, role-conditional policy (`public` / `case_team` / `disclosed_to_defense`), no caching. |
| B8 | `POST /answer_query` — two-step query | **DONE** | [main.py:L81-89](file:///c:/Users/Arpit/vaultis/backend/app/main.py#L81-L89) → [rag.py:L114-128](file:///c:/Users/Arpit/vaultis/backend/app/rag.py#L114-L128): Step 1 — Postgres `get_allowed_chunk_ids`. Step 2 — Chroma `.query()` with `{"$in": allowed_ids}`. Returns `authorized_chunks` (with text) and `filtered_chunks` (metadata + reason only, no leaked text). |
| B9 | `POST /answer_query` optional `document_id` scoping | **MISSING** | [main.py:L24-27](file:///c:/Users/Arpit/vaultis/backend/app/main.py#L24-L27): `AnswerRequest` has only `case_id` and `question` — no `document_id` field. [rag.py `retrieve_answer`](file:///c:/Users/Arpit/vaultis/backend/app/rag.py#L114) has no document_id filter path. |
| B10 | Hash chain: `compute_hash` / `append_record` per spec | **PARTIAL** | [audit.py:L17-28](file:///c:/Users/Arpit/vaultis/backend/app/audit.py#L17-L28): `append_record` correctly chains from prev record. **But** `compute_hash` hashes only `payload + prev_hash + timestamp` — it **omits `event_type` and `actor_user_id`** from the hash material, contrary to the spec which requires `action + entity_type + entity_id + user_id + timestamp`. |
| B11 | `GET /audit-events` | **DONE** | [main.py:L109-112](file:///c:/Users/Arpit/vaultis/backend/app/main.py#L109-L112): returns all `AuditChain` records ordered by `record_id`. |
| B12 | `POST /verify-chain` — recomputes, not stored boolean | **DONE** | [main.py:L115-118](file:///c:/Users/Arpit/vaultis/backend/app/main.py#L115-L118) → [audit.py:L31-39](file:///c:/Users/Arpit/vaultis/backend/app/audit.py#L31-L39): iterates all records, recomputes each hash from predecessor, compares against stored `prev_hash` and `record_hash`. |
| B13 | `POST /audit-events/{id}/tamper` — gated behind env var | **DONE** | [main.py:L121-130](file:///c:/Users/Arpit/vaultis/backend/app/main.py#L121-L130): checks `get_settings().enable_tamper_demo_endpoint`, raises `HTTPException(404)` when false. Mutates payload when true. |
| B14 | `GET /documents/{id}/encryption-status` | **DONE** | [main.py:L92-106](file:///c:/Users/Arpit/vaultis/backend/app/main.py#L92-L106): reads encrypted bytes, verifies not plaintext `%PDF-`, returns algorithm + SHA-256 hash of ciphertext. |
| B15 | `GET /documents/{id}/view` — chunk-coverage gated, decrypt, audit | **MISSING** | Endpoint does **not exist** anywhere in [main.py](file:///c:/Users/Arpit/vaultis/backend/app/main.py). No decryption-for-viewing code. |
| B16 | CORS configured for real frontend origin | **DONE** | [main.py:L16](file:///c:/Users/Arpit/vaultis/backend/app/main.py#L16): `allow_origins=get_settings().cors_origin_list`. [config.py:L11](file:///c:/Users/Arpit/vaultis/backend/app/config.py#L11) + [.env:L4](file:///c:/Users/Arpit/vaultis/backend/.env#L4): `CORS_ORIGINS=http://localhost:3000`. Not a wildcard. |
| B17 | `.env` fully populated, no hardcoded secrets in source | **PARTIAL** | [.env](file:///c:/Users/Arpit/vaultis/backend/.env) has 10 vars vs [.env.example](file:///c:/Users/Arpit/vaultis/backend/.env.example)'s 30+ (missing `APP_ENV`, `POSTGRES_*`, `CHUNK_*`, `STORAGE_DIR`, `MAX_UPLOAD_SIZE_MB`, `OCR_*`, `SEED_ON_STARTUP`, all `DEMO_*` vars, etc.). Worse, [config.py:L9](file:///c:/Users/Arpit/vaultis/backend/app/config.py#L9) hardcodes `jwt_secret = "development-only-change-me"` and [config.py:L14](file:///c:/Users/Arpit/vaultis/backend/app/config.py#L14) hardcodes `aes_256_key_b64 = "MDEyMzQ1Njc..."` as Python defaults. [seed.py:L12-17](file:///c:/Users/Arpit/vaultis/backend/seed.py#L12-L17) hardcodes demo passwords. |

---

## Frontend Checklist

| # | Deliverable | Status | Evidence |
|---|---|---|---|
| F1 | `mockData.ts` and all mock imports deleted | **DONE** | No `mockData.ts` or mock files exist in `src/`. Grep for `mock`, `fixture`, `simulate`, `fake`, `setTimeout` across all `.ts`/`.tsx` returns zero hits. |
| F2 | API client layer, JWT, single `BASE_URL` from env | **DONE** | [client.ts:L1](file:///c:/Users/Arpit/vaultis/frontend/src/api/client.ts#L1): `BASE_URL` from `import.meta.env.VITE_API_BASE_URL`. [L14](file:///c:/Users/Arpit/vaultis/frontend/src/api/client.ts#L14): `Authorization: Bearer ${authToken}`. All API calls route through centralized `request()`. |
| F3 | Login → real `/auth/login`, token stored, role from server | **DONE** | [LandingAuth.tsx](file:///c:/Users/Arpit/vaultis/frontend/src/components/LandingAuth.tsx) calls `api.login()` → [client.ts:L27](file:///c:/Users/Arpit/vaultis/frontend/src/api/client.ts#L27). [App.tsx:L11](file:///c:/Users/Arpit/vaultis/frontend/src/App.tsx#L11): stores token via `setAuthToken`, sets user from `result.user` (server payload). |
| F4 | Role switching removed or is genuine re-login | **DONE** | [App.tsx:L8](file:///c:/Users/Arpit/vaultis/frontend/src/App.tsx#L8): only a `logout()` function exists — clears token, forces login screen. No role-switcher UI anywhere. |
| F5 | `GET /cases` routes to Prepare Workspace or Dashboard | **DONE** | [App.tsx:L11](file:///c:/Users/Arpit/vaultis/frontend/src/App.tsx#L11): after login, calls `refreshCases()` → `api.getCases()`. Routes to `'prepare'` if `loaded.length === 0`, else `'dashboard'`. |
| F6 | Prepare Workspace: real case creation → `POST /cases` | **DONE** | [PrepareWorkspace.tsx:L10](file:///c:/Users/Arpit/vaultis/frontend/src/components/PrepareWorkspace.tsx#L10): form calls `api.createCase()` → [client.ts:L29](file:///c:/Users/Arpit/vaultis/frontend/src/api/client.ts#L29). |
| F7 | Real file upload with `<input type="file">`, multipart POST | **DONE** | [PrepareWorkspace.tsx:L18](file:///c:/Users/Arpit/vaultis/frontend/src/components/PrepareWorkspace.tsx#L18): `<input type="file" accept=".pdf" multiple>`. [L13](file:///c:/Users/Arpit/vaultis/frontend/src/components/PrepareWorkspace.tsx#L13): calls `api.uploadDocument()` → [client.ts:L30-34](file:///c:/Users/Arpit/vaultis/frontend/src/api/client.ts#L30-L34): `FormData` POST. Status is driven by server response, not `setTimeout`. |
| F8 | Sensitivity-level picker at upload time | **DONE** | [PrepareWorkspace.tsx:L18](file:///c:/Users/Arpit/vaultis/frontend/src/components/PrepareWorkspace.tsx#L18): `<select>` with options `public`, `case_team`, `sealed`. [L13](file:///c:/Users/Arpit/vaultis/frontend/src/components/PrepareWorkspace.tsx#L13): passed as `item.sensitivity` to `api.uploadDocument()`. |
| F9 | "Verify Encryption" UI → `GET /documents/{id}/encryption-status` | **DONE** | [PrepareWorkspace.tsx:L14](file:///c:/Users/Arpit/vaultis/frontend/src/components/PrepareWorkspace.tsx#L14): `verify()` calls `api.getEncryptionStatus(item.documentId)`. Renders algorithm + hash. |
| F10 | Chat wired to real `POST /answer_query` with debug panel | **DONE** | [ChatScreen.tsx:L3](file:///c:/Users/Arpit/vaultis/frontend/src/components/ChatScreen.tsx#L3): `api.answerQuery(caseItem.case_id, question)`. Side panel renders `authorized_chunks` (with text) and `filtered_chunks` (with sensitivity + reason). |
| F11 | Document list per case with View + Chat actions | **MISSING** | No document-list component exists. [CaseDashboard.tsx](file:///c:/Users/Arpit/vaultis/frontend/src/components/CaseDashboard.tsx) lists **cases** only — clicking a case goes straight to `ChatScreen`. No per-case document listing, no View/Chat-about-this actions. |
| F12 | Document viewer — blob fetch, 403 with chunk counts, URL revoke | **MISSING** | No document viewer component exists anywhere in `src/`. [client.ts](file:///c:/Users/Arpit/vaultis/frontend/src/api/client.ts) has no endpoint for `/documents/{id}/view`. |
| F13 | Document-scoped chat passes `document_id` | **MISSING** | [ChatScreen.tsx](file:///c:/Users/Arpit/vaultis/frontend/src/components/ChatScreen.tsx): `answerQuery` signature is `(caseId, question)` — no `document_id` parameter. [client.ts:L35](file:///c:/Users/Arpit/vaultis/frontend/src/api/client.ts#L35): same — only `case_id` and `question`. |
| F14 | Audit log — real `GET /audit-events` + `POST /verify-chain` | **DONE** | [AuditLogScreen.tsx](file:///c:/Users/Arpit/vaultis/frontend/src/components/AuditLogScreen.tsx): calls `api.getAuditEvents()` on mount, `api.verifyChain()` on button click, renders validity result with record count and break point. |
| F15 | Tamper-demo trigger gated behind `VITE_ENABLE_TAMPER_DEMO` | **PARTIAL** | [AuditLogScreen.tsx](file:///c:/Users/Arpit/vaultis/frontend/src/components/AuditLogScreen.tsx): the tamper button calls the real backend endpoint (`api.tamperEvent(id)`), **but it renders unconditionally** on every audit record — there is no `import.meta.env.VITE_ENABLE_TAMPER_DEMO` check gating visibility. |
| F16 | No `setTimeout`/mock/fixture/simulate remnants | **DONE** | Exhaustive grep across all `src/` `.ts`/`.tsx` files for `setTimeout`, `mock`, `fixture`, `simulate`, `fake` → zero matches. |

---

## Honest Summary

> **VAULTIS is roughly 75% of a working demo.** The core permission-gated RAG pipeline (ingest → chunk → embed → permission-filtered retrieval → audit) is fully operational end-to-end for **case-level queries**. Authentication, case management, upload with encryption verification, the audit chain with tamper detection, and all their corresponding frontend screens are real and connected to the real backend.
>
> **What's missing is the entire "Phase 3" document layer.** There is no way to list documents within a case, view a document (the backend endpoint doesn't exist), or chat about a specific document. The backend's hash chain omits `event_type` and `actor_user_id` from the hash material (weaker than spec). Demo account credentials are hardcoded in source instead of read from env vars. The tamper-demo button renders unconditionally instead of being gated by an env var. Secrets (`jwt_secret`, `aes_256_key`) have hardcoded fallback defaults in `config.py`.
>
> If you ran the three-act demo script today: **Act 1 (login + permission-scoped query) would work. Act 2 (tamper + verify chain) would work but the tamper button is always visible. Act 3 (view a document, chat about a specific document) would fail entirely — the endpoints and UI don't exist.**

---

## Prioritized MISSING / PARTIAL Items

| Priority | ID | What's Wrong |
|---|---|---|
| 1 | **B15** | `GET /documents/{id}/view` endpoint entirely missing — blocks the entire document-viewing demo |
| 2 | **B9** | `POST /answer_query` lacks `document_id` scoping — blocks document-scoped chat |
| 3 | **F11** | No document list UI per case — the entry point to viewing and document-scoped chat |
| 4 | **F12** | No document viewer component — no blob fetch, no 403 handling, no URL revocation |
| 5 | **F13** | Chat has no `document_id` parameter — can't do document-scoped queries |
| 6 | **B10** | Hash chain `compute_hash` omits `event_type` + `actor_user_id` from hash material |
| 7 | **B3** | `seed.py` hardcodes demo accounts instead of reading `DEMO_*` env vars |
| 8 | **B17** | Secrets hardcoded as Python defaults in `config.py`; `.env` missing 20+ vars from `.env.example` |
| 9 | **F15** | Tamper button renders unconditionally — needs `VITE_ENABLE_TAMPER_DEMO` gating |
