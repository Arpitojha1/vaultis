# VAULTIS (Secure Case Document Vault)
**Smart India Hackathon (SIH26190)**

VAULTIS is a highly secure, cryptographically auditable Document Vault and AI Assistant designed for the justice administration system. It solves the critical problem of **data exfiltration, LLM hallucination, and prompt injection** in legal contexts by implementing **Pre-Retrieval Role-Based Access Control (RBAC)**. 

Unlike traditional wrappers that simply ask an LLM to "keep a secret," VAULTIS mathematically and structurally excludes unauthorized evidence from the LLM's context window before inference ever occurs. The LLM cannot leak what it has never seen.

---

## 🔒 Highest Security Measure: Local LLM Support
> **Note:** This `main` branch utilizes the **Groq API** for high-speed demonstration and cloud deployment. 
> 
> **For the highest security measure** (e.g., air-gapped, zero-trust deployments where sensitive evidentiary data cannot legally leave the premises), **please switch to the local LLM branch**. That branch replaces cloud API calls with a completely localized **Ollama** pipeline, ensuring 100% of data processing remains on bare-metal infrastructure.

---

## ✨ Core Features

### 1. Provable Chain of Custody & Tamper Evidence
Every operational lifecycle event (logins, logouts, case creation, document ingestion, and evidentiary queries) is recorded in an immutable audit trail.
- **SHA-256 Hash Chaining:** Each record incorporates the hash of its predecessor.
- **Cryptographic Verification:** A dedicated verification endpoint allows digital forensic examiners to mathematically prove the integrity of the chain. Any unauthorized database modification instantly breaks the chain and exposes the tampered record.

### 2. Pre-Retrieval RAG RBAC (Role-Based Access Control)
Integration between PostgreSQL relational logic and ChromaDB vector filtering guarantees that users only chat with evidence they are authorized to see.
- **Investigating Officers / Prosecutors:** Can view `public` and `case_team` evidence.
- **Defense Lawyers:** Can only view `public` evidence, plus specific `case_team` chunks explicitly marked as `disclosed_to_defense`.
- **Absolute Exclusion:** `sealed` chunks (e.g., protected witness identities) are mathematically excluded from all RAG contexts, completely nullifying prompt injection attempts (OWASP LLM01).

### 3. Enterprise-Grade Security Controls
- **Encryption at Rest:** All uploaded evidence is encrypted on disk using **AES-256-GCM**.
- **Strict Upload Validation:** Magic byte validation strictly enforces that only legitimate PDF (`%PDF`), PNG (`\x89PNG`), and JPEG (`\xff\xd8\xff`) files are processed, mitigating malicious payload uploads.
- **Stateful JWT Revocation:** JSON Web Tokens utilize UUID `jti` claims and are explicitly blacklisted in the database upon logout to prevent token reuse.
- **Login Rate Limiting:** In-memory rate limiting protects against brute-force authentication attacks.

---

## 🛠 Tech Stack

**Backend**
- **Framework:** FastAPI (Python 3.10+)
- **Database:** PostgreSQL (production) / SQLite (local testing) via SQLAlchemy
- **Vector Store:** ChromaDB
- **LLM Integration:** Groq SDK (Main) / Ollama (Local Security Branch)
- **Security:** pwdlib (Argon2id password hashing), PyJWT, cryptography (AES-256-GCM)

**Frontend**
- **Framework:** React + TypeScript + Vite
- **Styling:** Tailwind CSS + Lucide Icons

---

## 🚀 Quick Start (Demo Mode)

We have provided a completely automated setup script to run the 5-step verification demo locally.

### Prerequisites
- Python 3.10+
- Node.js & npm 

### 1. Environment Setup
Create the environment files from the provided examples:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2. Run the Demo Setup
This will initialize a local SQLite database, flush existing data, and seed it with a synthetic demo case (Case #DEMO-2026-0001) containing a canary string (`ZZ-CANARY-7731`).

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Seed the database
./scripts/reset_demo_db.sh --yes  # On Windows: .\scripts\reset_demo_db.ps1 -Yes
python scripts/seed_demo_case.py
```

### 3. Start the Services
**Backend:**
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### 4. Verification Harness
Run the automated evidence capture harness to mathematically prove the security constraints (filters undisclosed chunks for Defense, prevents Prompt Injection, detects Audit Tampering):
```bash
python scripts/demo_verify.py
```
*(Results are saved to the `evidence/` directory).*

---

## 📖 Documentation
- **[DEMO_RUNBOOK.md](./DEMO_RUNBOOK.md)** - Detailed instructions for executing the demo.
- **[DEMO_EVIDENCE.md](./DEMO_EVIDENCE.md)** - Mathematical and structural verification of the platform's security claims.
- **[VAULTIS_Technical_Audit.docx](./VAULTIS_Technical_Audit.docx)** - Full architectural security audit.

---
*Built for SIH26190*
