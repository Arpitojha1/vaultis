#!/usr/bin/env bash
# scripts/reset_demo_db.sh
#
# Truncates the audit_chain table and re-runs the seed script.
# SAFETY: Refuses to run unless DEMO_MODE=1 AND --yes flag are both set.
# This script is for development/demo environments ONLY.

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# --- Guard 1: DEMO_MODE env var ---
if [ "${DEMO_MODE:-}" != "1" ]; then
    echo -e "${RED}ERROR: DEMO_MODE is not set to 1.${NC}"
    echo "This script is only intended for disposable demo environments."
    echo "Set DEMO_MODE=1 to proceed."
    exit 1
fi

# --- Guard 2: --yes flag ---
if [ "${1:-}" != "--yes" ]; then
    echo -e "${RED}ERROR: Missing --yes flag.${NC}"
    echo "Usage: DEMO_MODE=1 ./scripts/reset_demo_db.sh --yes"
    echo ""
    echo "This will DESTROY:"
    echo "  - All audit_chain records"
    echo "  - All chunk_permissions records"
    echo "  - All documents records"
    echo "  - All case_access records"
    echo "  - All cases records"
    echo "  - All users records"
    echo "  - ChromaDB collection data"
    echo ""
    echo "Then it will re-run seed.py to recreate demo data."
    exit 1
fi

echo -e "${YELLOW}=== VAULTIS Demo DB Reset ===${NC}"
echo "Timestamp: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"

# Determine the backend directory (relative to this script)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/../backend" && pwd)"

echo ""
echo -e "${RED}Truncating all tables in dependency order...${NC}"

cd "$BACKEND_DIR"
python -c "
from app.database import SessionLocal, engine
from sqlalchemy import text

db = SessionLocal()
try:
    # Truncate in FK-dependency order
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
"

echo ""
echo -e "${YELLOW}Clearing ChromaDB collection...${NC}"
python -c "
from app.rag import get_chroma_collection
coll = get_chroma_collection()
# Delete all entries in the collection
existing = coll.get()
if existing['ids']:
    coll.delete(ids=existing['ids'])
    print(f'  Deleted {len(existing[\"ids\"])} chunks from ChromaDB')
else:
    print('  ChromaDB collection was already empty')
"

echo ""
echo -e "${GREEN}Re-seeding demo data...${NC}"
python seed.py

echo ""
echo -e "${GREEN}=== Reset complete ===${NC}"
echo "Destroyed: all audit_chain, chunk_permissions, documents, case_access, cases, users rows"
echo "Rebuilt: seed.py demo data"
echo "Timestamp: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
