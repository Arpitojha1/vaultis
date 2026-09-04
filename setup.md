Viewed docker-compose.yml:1-35
Viewed requirements.txt:1-19
Viewed package.json:1-36
Viewed .env.example:1-10
Viewed frontend.env%20%281%29.example:1-13
Ran command: `docker --version; docker compose version; python --version; node --version`
Ran command: `docker ps`
Viewed Dockerfile:1-9
Ran command: `Test-Path frontend\.env; Test-Path backend\.env`

Here is a step-by-step guide to bring up **VAULTIS** locally using Docker Compose for the backend (which packages PostgreSQL, Alembic, Tesseract OCR, Poppler, and the FastAPI service) and Node for the frontend, followed by a manual verification script you can test in person.

---

### Step 1: Frontend Environment File

The backend already has a `.env` in place. In the `frontend` folder, create a `.env` file:

Open PowerShell and run:
```powershell
Set-Content -Path "c:\Users\Arpit\vaultis\frontend\.env" -Value @"
VITE_API_BASE_URL=http://localhost:8000
VITE_ENABLE_TAMPER_DEMO=true
"@
```

---

### Step 2: Start the Backend (Postgres + API)

The backend directory contains a `docker-compose.yml` that automatically:
1. Starts PostgreSQL 16 on port `5432`.
2. Runs Alembic database migrations (`alembic upgrade head`).
3. Seeds the demo cases, users, documents, and chunk permissions (`python seed.py`).
4. Starts the FastAPI server on port `8000`.

In PowerShell:
```powershell
cd c:\Users\Arpit\vaultis\backend
docker compose up --build -d
```

Check the startup logs:
```powershell
docker compose logs -f api
```
*(Press `Ctrl + C` to exit log viewing once you see `Application startup complete` and Uvicorn running on `http://0.0.0.0:8000`)*.

---

### Step 3: Configure Groq API Key

The backend connects to Groq for evidence synthesis. Ensure you have copied `.env.example` to `.env` and populated the `GROQ_API_KEY` variable:

```powershell
# Open backend/.env and set:
GROQ_API_KEY=your_actual_key_here
```
> **Note**: The default model is `llama-3.3-70b-versatile`. Update `GROQ_MODEL` in `backend/.env` if you prefer a different supported model.


Verify the backend is live:
- Visit **[http://localhost:8000/docs](http://localhost:8000/docs)** in your browser to verify the interactive Swagger OpenAPI UI.
- Or check health:
  ```powershell
  curl http://localhost:8000/health
  ```
  *(Should return `{"status":"ok"}`)*

---

### Step 4: Start the Frontend Application

Open a new PowerShell terminal:

```powershell
cd c:\Users\Arpit\vaultis\frontend
npm install
npm run dev
```

Your Vite frontend will start on **[http://localhost:3000](http://localhost:3000)**.

---

### Step 5: Manual In-Person Verification Walkthrough

Follow this 4-part test flow to verify the system end-to-end:

#### Part A: Login & Role Separation
The database was initialized by `seed.py` with 4 demo accounts:
| Role | Username | Password |
|---|---|---|
| Investigating Officer | `investigator` | `investigator-demo` |
| Prosecutor | `prosecutor` | `prosecutor-demo` |
| Defense Lawyer | `defense` | `defense-demo` |
| Judge | `judge` | `judge-demo` |

1. Go to **[http://localhost:3000](http://localhost:3000)**.
2. Sign in as `investigator` / `investigator-demo`.
3. Verify you see the operator banner (`investigator · investigating officer`) and 3 seeded cases:
   - `CR-2026-8841` (*State v. Sterling Financial Syndicate*)
   - `INV-2026-0419` (*Operation Dark Harbor*)
   - `SEC-2026-1102` (*OmniCorp Whistleblower*)

---

#### Part B: The 2-Step Permission-Filtered Chat

1. Click on **CR-2026-8841** (*Open assistant*).
2. Enter the prompt: `Where did the funds transfer go?`
3. Click the **Send** button.
4. Inspect the **Retrieval Gateway** side panel:
   - **Authorized Chunks**: The `public` and `case_team` chunks will show with clear green status (showing account details and Cayman Zenith Trust transfer).
   - **Filtered Chunks**: The `sealed` chunk will be blocked under **FILTERED** with reason *"Not disclosed for the authenticated role"*.
5. Log out (via the top-right button) and sign in as `defense` / `defense-demo`.
6. Open the same case and ask the same question:
   - Notice that `case_team` chunks are now **filtered** out for the defense lawyer because they were not explicitly marked `disclosed_to_defense`.
   - Only `public` / disclosed chunks are available.

---

#### Part C: Tamper-Evident Hash Chain & Verification

1. Click **Audit chain** in the navigation header (or on the dashboard).
2. All actions taken so far (seed creation, logins, evidentiary queries) appear with timestamps, record IDs, and SHA-256 hashes.
3. Click **Verify chain**:
   - The banner will turn green: `Chain valid — N records verified.`
4. Scroll down to any audit record and click **Run enabled tamper demo**:
   - This sends `POST /audit-events/{id}/tamper` to the backend, altering the record payload in the database without recomputing the cryptographic hash.
5. Watch the audit banner immediately transition to red:
   - `Chain broken at record <id>.`
   - Demonstrating that the sequential hash chain detected data tampering.

---

#### Part D: Workspace Creation & Real Document Ingestion

1. Click **Prepare Workspace** in the top navigation.
2. Under **1. Create a case**, enter a new case number (e.g. `TEST-2026-001`) and title (e.g. `Test Evidence Case`), and click **Create case**.
3. Under **2. Upload PDF evidence**, choose any sample PDF from your computer.
4. Select a sensitivity level (`case_team` or `sealed`) from the dropdown.
5. Click **Upload & parse**:
   - The backend runs OCR / PDF parsing, splits text with LangChain, embeds chunks into ChromaDB, and writes an AES-256-GCM encrypted file to disk.
6. Click **Verify encryption**:
   - The client calls `GET /documents/{id}/encryption-status`.
   - The UI confirms the file is stored as `AES-256-GCM` along with its ciphertext SHA-256 hash.
7. Click **Enter Vault** to jump into the newly configured case.

---

### Helpful Reset Commands

- **To reset and re-seed the database cleanly**:
  ```powershell
  cd c:\Users\Arpit\vaultis\backend
  docker compose down -v
  docker compose up --build -d
  ```
- **To stop all services**:
  ```powershell
  cd c:\Users\Arpit\vaultis\backend
  docker compose down
  ```