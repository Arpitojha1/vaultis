# VAULTIS backend

The API is deliberately structured so PostgreSQL determines the chunk allow-list on every query. Chroma is queried only with that list, and the LLM receives only Chroma's resulting authorized text.

## Local run

1. Copy `.env.example` to `.env` and set a strong `JWT_SECRET` and a base64-encoded 32-byte `AES_256_KEY_B64`.
2. From the repository root, run `docker compose up --build`.
3. Pull the configured Ollama model once: `docker compose exec ollama ollama pull mistral:7b-instruct-q4_K_M`.

The API applies Alembic migrations and runs the idempotent seed before starting. Demo accounts are documented in `seed.py`; passwords are intentionally development-only.

## Important integration note

`POST /answer_query` uses the locked response fields `answer`, `authorized_chunks`, and `filtered_chunks`. The existing React `RetrievedChunk` type has a different display shape (`id`, `sourceDoc`, `snippet`, `status`), so the frontend should map backend results rather than receive withheld text. Filtered results deliberately contain no `text` field.

Run it in two terminals from `C:\Users\Arpit\vaultis`.

1. Configure the backend:

```powershell
Copy-Item backend\.env.example backend\.env
```

Open `backend\.env` and set secure values for:

```env
JWT_SECRET=your-long-random-secret
AES_256_KEY_B64=your-base64-encoded-32-byte-key
ENABLE_TAMPER_DEMO_ENDPOINT=true
```

Generate an AES-256 key in PowerShell:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

2. Start Docker Desktop, then start the backend stack:

```powershell
docker compose up --build
```

This starts Postgres, Ollama, and FastAPI at `http://localhost:8000`, runs the migration, and seeds demo accounts.

3. Pull the local model once Docker is running:

```powershell
docker compose exec ollama ollama pull mistral:7b-instruct-q4_K_M
```

4. Start the frontend separately:

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`.

Demo credentials:

- `investigator` / `investigator-demo`
- `prosecutor` / `prosecutor-demo`
- `defense` / `defense-demo`
- `judge` / `judge-demo`

The API health check is:

```powershell
Invoke-RestMethod http://localhost:8000/health
```

Note: the React frontend still needs its mock-data calls replaced with these API endpoints before it will use the backend live.
