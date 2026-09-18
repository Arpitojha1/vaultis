# VAULTIS Demo Runbook

This guide explains how to run the end-to-end demo of VAULTIS locally, producing the evidence captured in the `evidence/` directory.

## Prerequisites
1. Python 3.10+
2. PostgreSQL 14+ (or SQLite for dev testing)
3. Node.js & npm (for frontend)

## 1. Environment Setup

Copy `.env.example` to `.env` in both `backend` and `frontend`.
In `backend/.env`, set the demo mode flags:
```env
ENABLE_TAMPER_DEMO_ENDPOINT=true
DEMO_CAPTURE_LLM_REQUEST=true
```

*(Note: These flags must be `false` in production.)*

## 2. Reset Database & Seed Fixture

To start from a clean state (WARNING: Destroys all data):
```bash
cd backend
DEMO_MODE=1 ./../scripts/reset_demo_db.sh --yes
# Or on Windows:
# $env:DEMO_MODE="1"; .\scripts\reset_demo_db.ps1 -Yes
```

This creates the default demo accounts (`officer_demo`, `defense_demo`, `newuser_demo`).

Next, seed the specific demo case containing the canary string `ZZ-CANARY-7731`:
```bash
python ../scripts/seed_demo_case.py
```

## 3. Start Backend

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## 4. Run Automated Demo Verification

In a separate terminal, run the demo harness:
```bash
python ../scripts/demo_verify.py
```

This script will automatically:
1. Log in as an Investigator and Defense Lawyer.
2. Ask the same query and verify Defense receives fewer chunks.
3. Attempt a prompt injection query and verify the canary string is NOT leaked.
4. Verify the audit chain is valid.
5. Tamper with an audit record and verify the chain fails exactly at that record.
6. Verify `newuser_demo` cannot access the case.

All JSON evidence is saved into the `evidence/` directory.

## 5. View Frontend Demo (Optional)

Start the Vite frontend:
```bash
cd frontend
npm install
npm run dev
```

Navigate to `http://localhost:5173`. The "Tamper payload" button will be visible in the Audit Log screen automatically because the backend `ENABLE_TAMPER_DEMO_ENDPOINT` is true.
