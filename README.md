# Vaultis - Secure Digital Document Management System

![Vaultis](https://img.shields.io/badge/Status-Active-brightgreen) ![License](https://img.shields.io/badge/License-MIT-blue) ![SIH](https://img.shields.io/badge/SIH-2026-orange)

A highly secure, tamper-proof digital repository tailored for managing sensitive legal records, case files, and investigative documents for law enforcement and judicial bodies.

This repository was built specifically to address the **Smart India Hackathon (SIH) 2026 Problem Statement SIH26190**.

---

## Branch: `devansh-backend` (Local Air-Gapped AI Implementation)

This branch represents the **highest security tier** implementation of Vaultis.

While the `main` branch utilises [Groq](https://groq.com/) for cloud-based AI inference, this branch swaps out third-party cloud dependencies in favour of a **100% local, self-hosted AI pipeline using Ollama and Qwen3:8B**.

### Why is this implementation better for SIH26190?
Legal and investigative documents are highly classified. Uploading sensitive evidence (e.g., crime scene reports, witness testimonies) to cloud AI providers like Groq or OpenAI poses a significant data privacy risk and violates data localisation laws.

By utilising **Local Ollama with Qwen3:8B via Docker**:
1. **Zero Data Exfiltration:** Your data never leaves your infrastructure.
2. **Air-gapped Ready:** The entire application (Frontend, Backend, Database, and AI) can run on an isolated network without internet access.
3. **Optimised Inference:** A zero-wait preloading mechanism in the FastAPI backend keeps the Qwen3:8B model active in GPU VRAM, ensuring instant AI chat responses without cold-start delays. Chain-of-thought ("thinking") mode is disabled for RAG queries, cutting response latency significantly.
4. **Extended Context Window:** The model is loaded with a **16k token context window** (`num_ctx: 16384`), enabling it to reason over much larger evidence chunks in a single pass.
5. **Absolute Legal Compliance:** Guaranteed adherence to the Indian Evidence Act regarding digital privacy, as no third-party APIs process the unencrypted data.

### 🔄 Latest Updates (devansh-backend)

| Update | Detail |
|--------|--------|
| **AI Model** | Switched from `deepseek-r1:8b` → **`qwen3:8b`** |
| **Thinking disabled** | `"think": false` passed to Ollama API — faster RAG responses |
| **16k context window** | `"options": {"num_ctx": 16384}` on all Ollama calls |
| **Session persistence** | Auth token + user stored in `localStorage`; page refresh no longer logs the user out |
| **Docker project fix** | Added `name: vaultis` to `docker-compose.yml`; orphan `backend-*` containers removed |
| **Audit log refresh** | Refresh button uses `requestAnimationFrame`-driven smooth rotation + 600 ms minimum spin; Verify Integrity button width never shifts |
| **Audit log UX** | "✓ Refreshed / Updated HH:MM:SS" timestamp feedback; loading skeleton on initial fetch |

---

## Alignment with SIH26190 Deliverables

Our solution directly addresses all core challenges outlined by the Ministry of Home Affairs (MHA):

### 1. Role-Based Access Control (RBAC)
A strict permission structure is enforced at every layer. Users are assigned specific roles (`Investigating Officer`, `Prosecutor`, `Defense Lawyer`, `Judge`). When a document is queried via the AI assistant, the RAG pipeline automatically filters semantic chunks — ensuring that a Defense Lawyer cannot extract information classified strictly for the "Case Team".

### 2. Data Security & Encryption
- **At Rest:** Every document uploaded is encrypted using **AES-256-GCM** before being written to disk.
- **In Transit:** Secure API communication via Bearer token authentication.
- Even if a bad actor gains access to the underlying server storage, the raw files remain completely unreadable without the cryptographic key.

### 3. Tamper Evidence & Audit Trails
Vaultis implements a cryptographic, blockchain-inspired audit ledger.
- Every critical action (login, document ingest, evidentiary query, view access) generates an immutable log entry.
- Each log entry is cryptographically hashed, containing the hash of the *previous* log entry.
- The built-in **Verify Chain** tool instantly detects if any record was tampered with, deleted, or altered — maintaining a pristine Chain of Custody.

### 4. Smart Search & Indexing (AI)
Powered by **ChromaDB** and the local **Qwen3:8B** model, documents are chunked, embedded, and indexed. Users can chat directly with their case vault. The AI retrieves semantic matches and synthesises answers — vastly accelerating the legal review process.

---

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS (Dark Mode native)
- **Backend:** FastAPI (Python), SQLAlchemy
- **Database:** PostgreSQL (Relational), ChromaDB (Vector Embeddings)
- **AI Engine:** Ollama (`qwen3:8b`) — local, no-cloud, 16k context, thinking disabled
- **Infrastructure:** Docker Compose (project name locked as `vaultis`)

---

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for frontend development)
- [Ollama](https://ollama.com/) installed and running locally
- At least 6 GB of free VRAM (for Qwen3:8B)

### 0. Pull the AI model
```bash
ollama pull qwen3:8b
```

### 1. Start the Backend Infrastructure
The backend is fully containerised. Spin it up from the `backend/` directory:
```bash
cd backend
docker compose up -d --build
```
On startup, FastAPI automatically pings Ollama to preload `qwen3:8b` into VRAM with `keep_alive: -1` (permanent), `think: false`, and `num_ctx: 16384`.

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
The frontend runs on **http://localhost:5173** and proxies API calls to **http://localhost:8000**.

### 3. Demo Accounts
The database seeds automatically with the following accounts:

| Role | Username | Password |
|------|----------|----------|
| Investigating Officer | `investigator` | `investigator-demo` |
| Prosecutor | `prosecutor` | `prosecutor-demo` |
| Defense Lawyer | `defense` | `defense-demo` |
| Judge | `judge` | `judge-demo` |

> TOTP secrets are printed to the Docker logs on first seed if MFA is enabled.

---

## UI/UX Features
- **Dark Mode Native:** Low-strain dark theme built natively into Tailwind — designed for long investigation sessions.
- **Session Persistence:** Logging in persists across browser refreshes. The session is only cleared on explicit logout or token expiry.
- **Instant AI Chat:** Ultra-fast local inference with no cold-start (model kept in VRAM).
- **Inline Document Viewer:** Securely stream and view decrypted PDFs directly in the browser without downloading to local storage.
- **Live Audit Log:** Real-time cryptographic audit chain with smooth animated refresh, integrity verification, and tamper demonstration mode.
