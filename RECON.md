# RECON.md — Phase 0 Reconnaissance

Date: 2026-09-19T02:57 UTC+05:30  
Branch: `fix/demo-blockers`  
Commit: (pre-change baseline on main)

---

## 1. `compute_hash` — definition, signature, callers

**Definition:** `backend/app/audit.py:L11-25`

```python
def compute_hash(
    event_type: str,
    actor_user_id: int | None,
    payload: dict,
    prev_hash: str,
    timestamp: str,        # ← 5th argument, expects str
) -> str:
```

**Signature:** 5 positional arguments: `(event_type, actor_user_id, payload, prev_hash, timestamp)`.

**Callers (2):**
1. `append_record` at `audit.py:L38` — passes `timestamp_str` (a Python `datetime.now(tz).isoformat()` string).
2. `verify_chain` at `audit.py:L48` — passes `record.timestamp` (the value read back from PostgreSQL `String(100)` column).

**Stale test signature:** `backend/tests/test_security_contract.py:L7,L12` — tests pass a `datetime` object (not a string) as the 5th argument. Since `compute_hash` concatenates `timestamp` with `+`, passing a `datetime` calls `datetime.__str__()` which produces `"2026-09-03 00:00:00+00:00"` — a different format than `datetime.isoformat()` which produces `"2026-09-03T00:00:00+00:00"`. The tests do not crash but they exercise a code path that never occurs at runtime. They are technically "passing" but test the wrong thing.

---

## 2. Audit hash input: insert time vs verify time

**Insert (append_record, audit.py:L28-41):**
```
timestamp_str = datetime.now(timezone.utc).isoformat()  # e.g. "2026-09-19T02:50:12.123456+00:00"
```
This Python-generated string is:
- Stored as the AuditChain.timestamp column value (`String(100)`)
- Passed to `compute_hash(... , timestamp_str)` to produce `record_hash`

**Verify (verify_chain, audit.py:L44-52):**
```
record.timestamp   # value read back from PostgreSQL String(100) column
```
Passed to `compute_hash(... , record.timestamp)`.

**Analysis:** The `timestamp` column is `sa.String(100)` in both the model (`models.py:L57`) and the migration (`0001_initial_schema.py:L28`). PostgreSQL stores and returns the exact string. There is **no server_default** on this column — the value is set entirely in Python.

**Conclusion:** The timestamp survives the DB round trip unchanged. No mismatch here.

**The `payload` column** is `sa.JSON()` (migration L28) / `mapped_column(JSON)` (models.py:L56). PostgreSQL stores this as JSONB internally (the default for `sa.JSON()` on PostgreSQL). JSONB **reorders keys** and **normalizes whitespace**. 

At insert time: `json.dumps(payload, sort_keys=True, separators=(",", ":"))` produces a canonical string.  
At verify time: `record.payload` is a Python dict deserialized from JSONB, and `json.dumps(record.payload, sort_keys=True, separators=(",", ":"))` re-serializes it.

**Key risk:** JSONB normalization can change key order, but `sort_keys=True` handles that. However, JSONB can also normalize integer types (e.g., `1` vs `1.0`) or unicode escapes differently. The current payloads use simple strings and ints, so this should not be an issue in practice.

**Likely root cause of record-1 failure:** The `actor_user_id` field. At insert time, `str(actor_user_id)` converts the Python int (e.g., `1`) to `"1"`. At verify time, `record.actor_user_id` is read from a `ForeignKey("users.user_id")` column with `Mapped[int | None]`. SQLAlchemy returns this as a Python `int`, so `str(record.actor_user_id)` also produces `"1"`. This should match.

**WAIT — actual root cause identified:** Looking more carefully at the JSON column. The `sa.JSON()` type in SQLAlchemy on PostgreSQL **does NOT guarantee JSONB** — it depends on the dialect. With `psycopg` (which this project uses), `sa.JSON()` maps to PostgreSQL's `json` type (text-based), not `jsonb`. The `json` type preserves exact text. However, the model uses `mapped_column(JSON)` which may behave differently from the migration's `sa.JSON()`.

Actually, the more likely issue: looking at `seed.py:L127-129`, when `users` exists but there are no audit records, it creates the first record:
```python
append_record(db, "seed_initialized", first_user.user_id, {"cases": len(CASES), "purpose": "demo fixture initialization"})
```
The `len(CASES)` is `3` (a Python int). When this goes through JSON → DB → JSON round-trip, `3` should remain `3`. 

Let me re-examine: **The actual chain only has ONE record after seeding** (the `seed_initialized` event). The chain verification at record 1 checks `record.prev_hash != expected_prev`. For record 1, `expected_prev` = `GENESIS_HASH` = `"0" * 64`. At insert time, `prev_hash` = `GENESIS_HASH` because `previous` is `None` (no previous record). This should match.

**Revised hypothesis:** The breakage is likely caused by `sa.JSON()` vs JSONB normalization of the payload dict. Need to test empirically.

---

## 3. Genesis / first-record prev_hash handling

`audit.py:L8`: `GENESIS_HASH = "0" * 64` (64 zeros)

`append_record` (L29-30):
```python
previous = db.scalar(select(AuditChain).order_by(AuditChain.record_id.desc()).limit(1))
prev_hash = previous.record_hash if previous else GENESIS_HASH
```

`verify_chain` (L45):
```python
expected_prev = GENESIS_HASH
```

**Consistent.** Both use the same `GENESIS_HASH` constant.

Note: `.env.example:L62` has `AUDIT_CHAIN_GENESIS_HASH=GENESIS` but this env var is **never read by the code**. The code hardcodes `"0" * 64`. This is a documentation-code disagreement. **Code wins.**

---

## 4. Seed script analysis

**File:** `backend/seed.py`

**Env vars read:**
- `DEMO_ACCOUNTS_ENABLED` (default `"true"`)
- `DEMO_{IO,PROSECUTOR,DEFENSE,JUDGE,NEWUSER}_USERNAME` (defaults: `investigator`, `prosecutor`, `defense`, `judge`, `newuser_demo`)
- `DEMO_{IO,PROSECUTOR,DEFENSE,JUDGE,NEWUSER}_PASSWORD` (defaults: hardcoded legacy values)

**newuser_demo IS created** (contrary to the reported blocker). It is defined at `seed.py:L38`:
```python
("NEWUSER", "newuser_demo", "ChangeMe_New_2026!", "investigating_officer"),
```

It IS created along with all other users at L70-78. However, it is **excluded from case access** at L96-98:
```python
newuser_username = _get_env("DEMO_NEWUSER_USERNAME", "newuser_demo")
for username, user in users.items():
    if username == newuser_username:
        continue  # ← skips case access for newuser
```

**So newuser_demo exists but has no case access.** This is by design — the `.env.example:L102-106` describes it as a "fresh/empty vault" demo login. The "blocker" may have been a reporting error, or the seed was never run with the NEWUSER env vars.

**Password hashing:** Uses `pwdlib` with `PasswordHash.recommended()` (`auth.py:L11`). The `requirements.txt` specifies `pwdlib[argon2]==0.2.1`, so this uses Argon2id. ✓

**Prints passwords:** `seed.py:L78` prints passwords: `print(f"Created demo user: {username} | Password: {password} | TOTP Secret: {totp_secret}")`. This violates the requirement "Do not print passwords."

---

## 5. Permission decision: `get_allowed_chunk_ids`

**File:** `backend/app/rag.py:L26-34`

```python
def get_allowed_chunk_ids(db: Session, case_id: int, user_role: str) -> list[str]:
    permitted_team_roles = ("investigating_officer", "prosecutor", "judge")
    policy = [ChunkPermission.sensitivity_level == "public"]
    if user_role in permitted_team_roles:
        policy.append(ChunkPermission.sensitivity_level.in_(("public", "case_team")))
    if user_role == "defense_lawyer":
        policy.append(ChunkPermission.disclosed_to_defense.is_(True))
    return list(db.scalars(
        select(ChunkPermission.chunk_id).where(
            ChunkPermission.case_id == case_id,
            or_(*policy)
        )
    ).all())
```

**Bug in the policy:** For investigators/prosecutors/judges, the policy becomes:
```
OR(sensitivity_level == "public", sensitivity_level IN ("public", "case_team"))
```
The first condition is redundant (public is already in the IN clause). But functionally this returns public + case_team. Correct for the stated policy.

For defense_lawyer, the policy becomes:
```
OR(sensitivity_level == "public", disclosed_to_defense == True)
```
This means defense gets ALL public chunks PLUS any chunk (regardless of sensitivity) where `disclosed_to_defense=True`. A sealed chunk with `disclosed_to_defense=True` WOULD be returned to defense. This matches the concern in the claims register about sealed+disclosed precedence.

**Chroma `$in` filter** built at `rag.py:L154`:
```python
where_clause = {"$and": [{"case_id": case_id}, {"chunk_id": {"$in": allowed_ids}}]}
```

**LLM prompt** assembled at `rag.py:L122-123`:
```python
context = "\n\n".join(f"[{i + 1}] {text}" for i, text in enumerate(authorized_text))
prompt = f"Answer the legal case question using only this evidence context. If insufficient, say so.\n\nEvidence context:\n{context}\n\nQuestion: {question}"
```

Only authorized chunk texts are placed in the prompt. No secrecy instruction is used.

---

## 6. Ingestion: chunk_permissions assignment

**File:** `rag.py:L116`
```python
db.add_all([ChunkPermission(
    chunk_id=chunk_id, case_id=case_id, document_id=document.document_id,
    sensitivity_level=sensitivity_level,  # ← from upload form
    disclosed_to_defense=disclosed_to_defense  # ← from upload form
) for chunk_id in ids])
```

**Confirmed:** Ingestion copies the **upload-level** `sensitivity_level` and `disclosed_to_defense` to EVERY chunk from that document. There is no per-chunk classification.

---

## 7. `chunks_used` in audit payload

**File:** `main.py:L155`
```python
append_record(db, "evidentiary_query", user.user_id, {
    "case_id": request.case_id,
    "question": request.question,
    "chunks_used": allowed_ids  # ← ALL allowed candidate IDs, not the retrieved subset
})
```

`allowed_ids` comes from `retrieve_answer` return value at L154, which is the full `get_allowed_chunk_ids()` result (rag.py:L138, L168). The actual retrieved chunks (top-k from Chroma) are in the `authorized` variable, but only `allowed_ids` is logged.

**Conclusion:** `chunks_used` logs ALL allowed candidate IDs, NOT the chunks actually placed in the LLM prompt. This needs to be changed per the spec.

---

## 8. Tamper endpoint gating

**Backend:** `main.py:L302-311`
```python
@app.post("/audit-events/{record_id}/tamper")
def tamper(record_id: int, db: Session = Depends(get_db)) -> dict:
    if not get_settings().enable_tamper_demo_endpoint:
        raise HTTPException(status_code=404, detail="Not found")
```
- Gated by `enable_tamper_demo_endpoint` config setting (default `False`, `config.py:L22`)
- Returns 404 (not 403) when disabled — pretends endpoint doesn't exist
- No authentication required (`user` is not a dependency) — anyone can tamper if the flag is on

**Frontend:** `AuditLogScreen.tsx:L141`
```tsx
{import.meta.env.VITE_ENABLE_TAMPER_DEMO === 'true' && (
    <button onClick={()=>tamper(record.record_id)} ...>Tamper payload</button>
)}
```
- Uses `VITE_ENABLE_TAMPER_DEMO` env var (build-time Vite env)
- Currently `frontend/.env:L2` sets `VITE_ENABLE_TAMPER_DEMO=true`
- This is a **client-side build-time** check, NOT a runtime check from the backend

**Issue:** The frontend checks its own env var independently of the backend's `ENABLE_TAMPER_DEMO_ENDPOINT`. The spec wants the UI to check the backend's demo mode status. Currently they can be out of sync.

---

## 9. LLM provider config and outbound request

**Config:** `config.py:L20-21`
```python
groq_api_key: str = Field(...)
groq_model: str = "llama-3.3-70b-versatile"
```

**Actual .env:** `GROQ_API_KEY = REDACTED_API_KEY` and `GROQ_MODEL=openai/gpt-oss-120b`

**Outbound request built at:** `rag.py:L120-134`
```python
client = AsyncGroq(api_key=settings.groq_api_key, timeout=60.0)
response = await client.chat.completions.create(
    model=settings.groq_model,
    messages=[{"role": "user", "content": prompt}],
    stream=False
)
```

No capture hook exists. The `groq` SDK sends the request directly.

---

## 10. Proposed File Allowlist

### Backend (modify)
- `backend/app/audit.py` — fix hash chain logic
- `backend/app/main.py` — fix chunks_used, add demo-mode endpoint, add capture hook
- `backend/app/rag.py` — add LLM capture hook
- `backend/app/config.py` — add DEMO_CAPTURE config
- `backend/seed.py` — fix password printing, ensure idempotent newuser creation
- `backend/tests/test_security_contract.py` — fix stale tests, add regression tests
- `backend/.env.example` — add newuser and capture placeholders

### Backend (new)
- `backend/tests/test_audit_chain.py` — comprehensive chain tests
- `scripts/reset_demo_db.sh` — DB reset script
- `scripts/seed_demo_case.py` — synthetic demo fixture
- `scripts/demo_verify.py` — demo harness

### Frontend (modify)
- `frontend/src/components/AuditLogScreen.tsx` — tamper button conditional on backend
- `frontend/.env.example` — document VITE_ENABLE_TAMPER_DEMO

### Root (new)
- `RECON.md` — this file
- `evidence/` — captured outputs
- `DEMO_RUNBOOK.md` — runbook
- `DEMO_EVIDENCE.md` — evidence table

### Explicitly NOT on allowlist
- `backend/app/models.py` — no schema changes needed
- `backend/app/database.py` — no changes needed
- `backend/app/auth.py` — no changes needed (JWT revocation is Phase 7)
- `backend/alembic/` — no migration changes needed
- Any frontend component other than AuditLogScreen.tsx

---

## Key Disagreements: Code vs Documents

| Item | Document says | Code does | Resolution |
|------|--------------|-----------|------------|
| Genesis hash | `.env.example`: `AUDIT_CHAIN_GENESIS_HASH=GENESIS` | `audit.py:L8`: `"0" * 64` | Code wins. Env var is unused. |
| Password hashing | `.env.example`: "bcrypt-hashed" | `requirements.txt`: `pwdlib[argon2]` | Code wins. Uses Argon2id. |
| chunks_used | Audit doc implies "retrieved chunks" | `main.py:L155`: logs `allowed_ids` (all candidates) | Code wins. Needs fix. |
| newuser_demo "not created" | User brief says blocker | `seed.py:L38,L70-78`: creates it, just no case access | Code wins. Account exists, just no cases. |
| LLM provider | Audit: Ollama/Mistral; Brief: Groq | Code: Groq SDK | Code wins. |
| Embedding model | Deck: MiniLM | Code: ChromaDB default (no explicit model) | Code wins. No MiniLM configured. |
| Tamper button | "always shown" | `AuditLogScreen.tsx:L141`: checks `VITE_ENABLE_TAMPER_DEMO` | Code wins. Partially gated but via build-time env, not backend. |
