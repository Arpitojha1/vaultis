# VAULTIS Team Sprint — Remaining MVP Work

> Based on the [MVP_STATUS.md](file:///C:/Users/Arpit/.gemini/antigravity/brain/4d3718a1-d0c2-4aeb-af8e-fee5ab2bf4c2/MVP_STATUS.md) audit (2026-09-04).
> **9 items** remain: 4 MISSING backend, 3 MISSING frontend, 2 PARTIAL (1 BE, 1 FE).

---

## File Ownership Map (No Two Engineers Touch the Same File)

| File | Owner | Rationale |
|---|---|---|
| `backend/app/main.py` | **BE1** | B9 (add `document_id` to `AnswerRequest`), B15 (new `/documents/{id}/view` endpoint) |
| `backend/app/rag.py` | **BE1** | B9 (add `document_id` filter to `retrieve_answer`) |
| `backend/app/audit.py` | **BE2** | B10 (fix `compute_hash` signature) |
| `backend/app/config.py` | **BE2** | B17 (remove hardcoded secret defaults) |
| `backend/seed.py` | **BE2** | B3 (read env vars instead of hardcoded tuples) |
| `backend/.env` | **BE2** | B17 (populate missing vars) |
| `frontend/src/api/client.ts` | **FE1** | F12 (`viewDocument` blob endpoint), F13 (`document_id` param on `answerQuery`) |
| `frontend/src/components/CaseDashboard.tsx` | **FE1** | F11 (add document list with View/Chat actions) |
| `frontend/src/components/DocumentViewer.tsx` | **FE1** | F12 (**NEW** — blob viewer + 403 handling) |
| `frontend/src/App.tsx` | **FE1** | F11 (add `'documents'` screen routing + `'doc-chat'` screen) |
| `frontend/src/components/ChatScreen.tsx` | **FE1** | F13 (accept + pass `document_id` prop) |
| `frontend/src/components/AuditLogScreen.tsx` | **FE2** | F15 (gate tamper button behind env var) |

---

## Backend Engineer 1 (BE1) — Document View + Scoped Query

> **Branch:** `be1/document-view-and-scoped-query`

| Task ID | Description | Depends on | Est. hours | Definition of done |
|---|---|---|---|---|
| B15 | Implement `GET /documents/{id}/view` in [main.py](file:///c:/Users/Arpit/vaultis/backend/app/main.py) | — | 3h | Endpoint: (1) checks user has `CaseAccess` for the document's case; (2) calls `get_allowed_chunk_ids` to get user's allowed chunks; (3) queries all `ChunkPermission` rows for that document; (4) if user doesn't cover 100% of chunks → 403 with `{ total_chunks, authorized_chunks, denied_chunks }`; (5) if full coverage → decrypt file via `AESGCM` in memory → return `StreamingResponse` with `application/pdf` content type; (6) both grant and denial are audited via `append_record`. Add `decrypt_from_disk()` helper in [rag.py](file:///c:/Users/Arpit/vaultis/backend/app/rag.py). |
| B9 | Add optional `document_id: int | None = None` to `AnswerRequest` in [main.py](file:///c:/Users/Arpit/vaultis/backend/app/main.py), pass it through to `retrieve_answer` in [rag.py](file:///c:/Users/Arpit/vaultis/backend/app/rag.py) | — | 1.5h | When `document_id` is provided: (1) `get_allowed_chunk_ids` result is further filtered to only chunks with matching `document_id`; (2) Chroma query's `where` clause adds `{"document_id": document_id}`; (3) existing case-level behavior unchanged when `document_id` is `None`. |

**Total: ~4.5 hours**

---

## Backend Engineer 2 (BE2) — Hash Chain Fix + Secrets Hygiene

> **Branch:** `be2/hash-chain-and-secrets`

| Task ID | Description | Depends on | Est. hours | Definition of done |
|---|---|---|---|---|
| B10 | Fix `compute_hash()` in [audit.py](file:///c:/Users/Arpit/vaultis/backend/app/audit.py) to include `event_type` and `actor_user_id` in hash material | — | 1h | `compute_hash(event_type, actor_user_id, payload, prev_hash, timestamp)` hashes all 5 fields. `append_record` and `verify_chain` updated to pass the new signature. **Note:** this is a breaking change to the chain format — existing audit records will fail verification. The seed script should be re-run after a DB wipe, or a one-time migration must rehash all existing records. |
| B3 | Refactor [seed.py](file:///c:/Users/Arpit/vaultis/backend/seed.py) to read `DEMO_*` env vars from `.env` | — | 1h | `USERS` list built from `os.environ.get("DEMO_IO_USERNAME", ...)` etc. If any `DEMO_*` var is missing, fall back to the existing defaults but log a warning. `DEMO_ACCOUNTS_ENABLED` env var gates whether seed inserts demo users at all. |
| B17 | Remove hardcoded secret defaults in [config.py](file:///c:/Users/Arpit/vaultis/backend/app/config.py), populate [.env](file:///c:/Users/Arpit/vaultis/backend/.env) | B3 | 1h | `jwt_secret` and `aes_256_key_b64` fields in `Settings` have **no default** (or raise on missing). `.env` file includes all vars from `.env.example` with real-looking placeholder values. No secret string appears as a Python literal. |

**Total: ~3 hours**

---

## Frontend Engineer 1 (FE1) — Document List, Viewer, Scoped Chat

> **Branch:** `fe1/document-layer`

| Task ID | Description | Depends on | Est. hours | Definition of done |
|---|---|---|---|---|
| F11 | Document list per case in [CaseDashboard.tsx](file:///c:/Users/Arpit/vaultis/frontend/src/components/CaseDashboard.tsx) (or a new `DocumentList.tsx`) + routing in [App.tsx](file:///c:/Users/Arpit/vaultis/frontend/src/App.tsx) | — | 2.5h | When a case is selected from the dashboard, show a document list (fetched via a new `GET /cases/{id}/documents` API call or by adding document data to the existing case flow). Each document row has a **View** button and a **Chat about this** button. Add `'documents'` and `'doc-chat'` to the `Screen` union in App.tsx. Add `api.getDocuments(caseId)` to [client.ts](file:///c:/Users/Arpit/vaultis/frontend/src/api/client.ts). |
| F12 | New [DocumentViewer.tsx](file:///c:/Users/Arpit/vaultis/frontend/src/components/DocumentViewer.tsx) component | **BE1:B15** (build now, verify after) | 3h | Fetches `/documents/{id}/view` as a blob (not JSON — use raw `fetch` or add a `requestBlob` variant to the API client). On success: creates `URL.createObjectURL(blob)`, renders in `<iframe>` or `<object>`, revokes URL on unmount/close via `useEffect` cleanup. On 403: parses JSON body, renders "Access denied — you have access to X of Y chunks" message with real counts. Both states are visually distinct. |
| F13 | Document-scoped chat: pass `document_id` to `answerQuery` in [client.ts](file:///c:/Users/Arpit/vaultis/frontend/src/api/client.ts) and [ChatScreen.tsx](file:///c:/Users/Arpit/vaultis/frontend/src/components/ChatScreen.tsx) | **BE1:B9** (build now, verify after) | 1h | `api.answerQuery(caseId, question, documentId?)` sends `document_id` in the request body when present. `ChatScreen` accepts an optional `documentId` prop; when set, the header shows "Chatting about [filename]" and all queries include the document_id. |

**Total: ~6.5 hours**

> [!IMPORTANT]
> **F12 and F13 can be built against the API contract immediately**, but cannot be verified end-to-end until BE1 merges B15 and B9. FE1 should build both, write the UI, and mark them as "ready for integration test" — the actual test happens after sync point 2 (see below).

---

## Frontend Engineer 2 (FE2) — Tamper Demo Gating

> **Branch:** `fe2/tamper-demo-gating`

| Task ID | Description | Depends on | Est. hours | Definition of done |
|---|---|---|---|---|
| F15 | Gate tamper demo button in [AuditLogScreen.tsx](file:///c:/Users/Arpit/vaultis/frontend/src/components/AuditLogScreen.tsx) behind `VITE_ENABLE_TAMPER_DEMO` | — | 0.5h | The "Run enabled tamper demo" button/link on each audit record is wrapped in a conditional: `{import.meta.env.VITE_ENABLE_TAMPER_DEMO === 'true' && <button ...>}`. When the env var is unset or `'false'`, the button does not render. When `'true'`, existing behavior is preserved. Verify with `VITE_ENABLE_TAMPER_DEMO=true` and without it. |

**Total: ~0.5 hours**

> [!TIP]
> FE2 has the lightest load. After merging F15, FE2 should take ownership of the **end-to-end integration test** (see Final Verification below) — they'll be the first person free to run it.

---

## Merge Order

```
1. be2/hash-chain-and-secrets     → main   (no dependencies, pure backend fix)
2. fe2/tamper-demo-gating         → main   (no dependencies, 1 file change)
3. be1/document-view-and-scoped-query → main   (no dependencies on be2)
4. fe1/document-layer             → main   (depends on be1 being merged)
```

> [!WARNING]
> **BE2's hash chain fix (B10) is a chain-format breaking change.** After merging `be2/hash-chain-and-secrets`, the database must be wiped and re-seeded (or a migration script must rehash all existing records). Coordinate this with the team — do it once, before BE1's branch lands, so BE1's new audit records (from B15) use the correct hash format from the start.

---

## Sync Points

### Sync Point 1 — After BE2 + FE2 merge (branches 1 & 2)

> **Who:** All 4 engineers, 15 min
> **When:** After `be2/hash-chain-and-secrets` and `fe2/tamper-demo-gating` land on `main`
> **Action:**
> - Wipe DB, re-run seed with new env-var-based accounts
> - Verify: login with env-var credentials works, chain verifies clean, tamper button is hidden when `VITE_ENABLE_TAMPER_DEMO` is unset
> - Confirm no regressions on existing case/query/audit flow
> - **Both FE1 and BE1 pull `main` into their branches** before continuing

### Sync Point 2 — After BE1 merges (branch 3)

> **Who:** BE1 + FE1, 30 min
> **When:** After `be1/document-view-and-scoped-query` lands on `main`
> **Action:**
> - FE1 pulls `main`, runs integration test of:
>   - `GET /documents/{id}/view` — upload a PDF, verify it returns the decrypted blob; login as a restricted role, verify 403 with real chunk counts
>   - `POST /answer_query` with `document_id` — verify scoped results vs. case-level results
> - If any contract mismatch found, BE1 fixes before FE1 merges

### Sync Point 3 — After FE1 merges (branch 4)

> **Who:** FE2 runs the full end-to-end verification (see below)

---

## Final End-to-End Verification Checklist

**Owner:** Whoever finishes first (expected: FE2 after their 0.5h task).

Run against the fully integrated system (`main` with all 4 branches merged). Every step must use the real running backend + frontend — no curl-only shortcuts.

| # | Step | Expected Result |
|---|---|---|
| 1 | Login as **investigating_officer** (env-var credentials) | Dashboard shows seeded cases |
| 2 | Select a case → document list appears | Documents listed with View + Chat actions |
| 3 | Ask a case-level question in chat | Answer + authorized chunks (public + case_team) + filtered chunks (sealed) shown |
| 4 | Click "Chat about this" on a specific document | Chat screen shows document name, query scoped to that document |
| 5 | Click "View" on a fully-authorized document | PDF renders in viewer |
| 6 | Log out → Login as **defense_lawyer** | Dashboard shows same cases (all users have case_access in seed) |
| 7 | Ask the **same question** as step 3 | Fewer authorized chunks (only public + disclosed_to_defense), more filtered chunks |
| 8 | Click "View" on a document with sealed chunks | 403 screen with "You have access to X of Y chunks" |
| 9 | Navigate to Audit Chain screen | All events listed (logins, queries, view-grant, view-denial) |
| 10 | Click "Verify chain" | "Chain valid — N records verified" |
| 11 | Confirm tamper button is **hidden** (env var is false/unset) | No tamper button visible |
| 12 | Set `VITE_ENABLE_TAMPER_DEMO=true`, rebuild frontend | Tamper button appears on each record |
| 13 | Click tamper on any record | Record payload mutated |
| 14 | Click "Verify chain" again | "Chain broken at record N" with red alert |
| 15 | Upload a new PDF via Prepare Workspace flow | Case created, file uploaded, encryption verified, enter vault |

> [!CAUTION]
> **Do not call the demo "ready" until every row above passes.** If any step fails, file it as a blocking bug, tag the responsible engineer's branch, and re-test after the fix lands.
