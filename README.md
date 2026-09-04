# Vaultis - Secure Digital Document Management System

![Vaultis](https://img.shields.io/badge/Status-Active-brightgreen) ![License](https://img.shields.io/badge/License-MIT-blue) ![SIH](https://img.shields.io/badge/SIH-2026-orange)

A highly secure, tamper-proof digital repository tailored for managing sensitive legal records, case files, and investigative documents for law enforcement and judicial bodies. 

This repository was built specifically to address the **Smart India Hackathon (SIH) 2026 Problem Statement SIH26190**.

---

## 🔒 Branch: `devansh-backend` (Local Air-Gapped AI Implementation)

This branch represents the **highest security tier** implementation of Vaultis. 

While the `main` branch utilizes [Groq](https://groq.com/) for cloud-based AI inference, this branch swaps out third-party cloud dependencies in favor of a **100% local, self-hosted AI pipeline using Ollama and DeepSeek-R1:8B**. 

### Why is this implementation better for SIH26190?
Legal and investigative documents are highly classified. Uploading sensitive evidence (e.g., crime scene reports, witness testimonies) to cloud AI providers like Groq or OpenAI poses a significant data privacy risk and violates data localization laws. 

By utilizing **Local Ollama with DeepSeek-R1 via Docker**:
1. **Zero Data Exfiltration:** Your data never leaves your infrastructure. 
2. **Air-gapped Ready:** The entire application (Frontend, Backend, Database, and AI) can run on an isolated network without internet access.
3. **Optimized Inference:** We implemented a zero-wait preloading mechanism in the FastAPI backend that continuously keeps the 4.7GB DeepSeek model active in GPU VRAM, ensuring instant AI chat responses without the cold-start delays normally associated with local LLMs.
4. **Absolute Legal Compliance:** Guaranteed adherence to the Indian Evidence Act regarding digital privacy, as no third-party APIs process the unencrypted data.

---

## Alignment with SIH26190 Deliverables

Our solution directly addresses all core challenges outlined by the Ministry of Home Affairs (MHA):

### 1. Role-Based Access Control (RBAC)
We implemented a strict permission structure out-of-the-box. Users are assigned specific roles (`Investigating Officer`, `Prosecutor`, `Defense Lawyer`, `Judge`). When a document is queried using our AI assistant, the RAG (Retrieval-Augmented Generation) pipeline automatically filters the semantic chunks—ensuring that a Defense Lawyer, for instance, cannot use AI to extract information from a document classified strictly for the "Case Team".

### 2. Data Security & Encryption
- **At Rest:** Every document uploaded is encrypted using **AES-256-GCM** before being written to disk. 
- **In Transit:** Secure API communication via Bearer token authentication. 
- Even if a bad actor gains access to the underlying server storage, the raw PDF files remain completely unreadable without the cryptographic key.

### 3. Tamper Evidence & Audit Trails
Vaultis implements a cryptographic, blockchain-inspired audit ledger. 
- Every critical action (login, document ingest, evidentiary query, view access) generates an immutable log entry.
- Each log entry is cryptographically hashed, containing the hash of the *previous* log entry.
- The system features a built-in "Verify Chain" tool that can instantly detect if an administrator or hacker attempted to tamper with, delete, or alter past system records, thereby maintaining a pristine Chain of Custody.

### 4. Smart Search & Indexing (AI)
Powered by **ChromaDB** and our local **DeepSeek-R1** model, documents are chunked, embedded, and indexed. Users can chat directly with their case vault. The AI rapidly analyzes the encrypted PDFs, retrieves exact semantic matches, and synthesizes answers with citations—vastly accelerating the legal review process.

---

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS (with fully integrated Dark Mode)
- **Backend:** FastAPI (Python), SQLAlchemy
- **Database:** PostgreSQL (Relational Data), ChromaDB (Vector Embeddings)
- **AI Engine:** Ollama (`deepseek-r1:8b`)
- **Infrastructure:** Docker Compose

---

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js (for frontend development)
- At least 8GB of GPU VRAM (for running DeepSeek-R1 locally)

### 1. Start the Backend Infrastructure
The backend is completely containerized. Simply spin it up using Docker:
```bash
cd backend
docker-compose up -d --build
```
*Note: Upon startup, the FastAPI server will automatically send a request to your local Ollama instance to preload the `deepseek-r1:8b` model into your VRAM.*

### 2. Start the Frontend
The frontend runs via Vite:
```bash
cd frontend
npm install
npm run dev
```

### 3. Demo Accounts
The database automatically seeds with the following demo accounts so you can test the RBAC features immediately:

| Role | Username | Password |
|------|----------|----------|
| Investigating Officer | `investigator` | `investigator-demo` |
| Prosecutor | `prosecutor` | `prosecutor-demo` |
| Defense Lawyer | `defense` | `defense-demo` |
| Judge | `judge` | `judge-demo` |

---

##  UI/UX Features
- **Dark Mode Native:** Designed specifically for investigators and lawyers looking at screens for extended hours. The UI features a sleek, low-strain dark mode built natively into Tailwind.
- **Instant AI Chat:** "Thinking..." animations and ultra-fast local inference.
- **Inline Document Viewer:** Securely stream and view decrypted PDFs directly in the browser without downloading them to local, potentially unsecure devices.
