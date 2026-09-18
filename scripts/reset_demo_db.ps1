# scripts/reset_demo_db.ps1
#
# Truncates audit_chain + all demo tables and re-runs seed.py.
# SAFETY: Refuses to run unless DEMO_MODE=1 AND -Yes switch are both set.
# For development/demo environments ONLY.

param(
    [switch]$Yes
)

$ErrorActionPreference = "Stop"

# --- Guard 1: DEMO_MODE env var ---
if ($env:DEMO_MODE -ne "1") {
    Write-Host "ERROR: DEMO_MODE is not set to 1." -ForegroundColor Red
    Write-Host "This script is only intended for disposable demo environments."
    Write-Host "Set `$env:DEMO_MODE='1'` to proceed."
    exit 1
}

# --- Guard 2: -Yes switch ---
if (-not $Yes) {
    Write-Host "ERROR: Missing -Yes flag." -ForegroundColor Red
    Write-Host "Usage: `$env:DEMO_MODE='1'; .\scripts\reset_demo_db.ps1 -Yes"
    Write-Host ""
    Write-Host "This will DESTROY:"
    Write-Host "  - All audit_chain records"
    Write-Host "  - All chunk_permissions records"
    Write-Host "  - All documents records"
    Write-Host "  - All case_access records"
    Write-Host "  - All cases records"
    Write-Host "  - All users records"
    Write-Host "  - ChromaDB collection data"
    Write-Host ""
    Write-Host "Then it will re-run seed.py to recreate demo data."
    exit 1
}

Write-Host "=== VAULTIS Demo DB Reset ===" -ForegroundColor Yellow
Write-Host "Timestamp: $((Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ'))"

$backendDir = Join-Path $PSScriptRoot "..\backend"
Push-Location $backendDir

$pythonExe = Join-Path $PSScriptRoot "..\backend\venv\Scripts\python.exe"
if (-not (Test-Path $pythonExe)) {
    $pythonExe = "python"
}

try {
    Write-Host "`nTruncating all tables in dependency order..." -ForegroundColor Red
    & $pythonExe -c @"
from app.database import SessionLocal
from app.models import Base
from sqlalchemy import text

db = SessionLocal()
try:
    Base.metadata.create_all(db.bind)
    tables = ['audit_chain', 'chunk_permissions', 'documents', 'case_access', 'cases', 'users']
    
    is_sqlite = db.bind.dialect.name == 'sqlite'
    if is_sqlite:
        db.execute(text('PRAGMA foreign_keys = OFF;'))
        
    for table in tables:
        if is_sqlite:
            db.execute(text(f'DELETE FROM {table}'))
        else:
            db.execute(text(f'TRUNCATE TABLE {table} CASCADE'))
        print(f'  Cleared: {table}')
        
    if is_sqlite:
        db.execute(text('PRAGMA foreign_keys = ON;'))
        
    db.commit()
    print('All tables cleared.')
finally:
    db.close()
"@

    Write-Host "`nClearing ChromaDB collection..." -ForegroundColor Yellow
    & $pythonExe -c @"
from app.rag import get_chroma_collection
coll = get_chroma_collection()
existing = coll.get()
if existing['ids']:
    coll.delete(ids=existing['ids'])
    print(f'  Deleted {len(existing["ids"])} chunks from ChromaDB')
else:
    print('  ChromaDB collection was already empty')
"@

    Write-Host "`nRe-seeding demo data..." -ForegroundColor Green
    & $pythonExe seed.py

    Write-Host "`n=== Reset complete ===" -ForegroundColor Green
    Write-Host "Destroyed: all audit_chain, chunk_permissions, documents, case_access, cases, users rows"
    Write-Host "Rebuilt: seed.py demo data"
    Write-Host "Timestamp: $((Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ'))"
} finally {
    Pop-Location
}
