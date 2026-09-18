"""Comprehensive audit chain tests.

These tests exercise the real DB path (write → commit → read back → verify)
using an in-process SQLite database to isolate from PostgreSQL.

To test against the actual PostgreSQL instance, set TEST_DATABASE_URL.
"""
import json
import os
import pytest
from datetime import datetime, timezone
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

# Ensure a minimal config for imports
os.environ.setdefault("JWT_SECRET", "test-secret-not-for-production")
os.environ.setdefault("AES_256_KEY_B64", "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
os.environ.setdefault("GROQ_API_KEY", "test-key-not-real")

from app.audit import GENESIS_HASH, append_record, compute_hash, verify_chain
from app.database import Base
from app.models import AuditChain, User


@pytest.fixture
def db_session():
    """Create a fresh in-memory SQLite DB for each test."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    TestSession = sessionmaker(bind=engine)
    session = TestSession()
    yield session
    session.close()


@pytest.fixture
def pg_session():
    """Create a session against the real PostgreSQL if TEST_DATABASE_URL is set."""
    url = os.environ.get("TEST_DATABASE_URL")
    if not url:
        pytest.skip("TEST_DATABASE_URL not set; skipping PostgreSQL test")
    engine = create_engine(url)
    Base.metadata.create_all(engine)
    TestSession = sessionmaker(bind=engine)
    session = TestSession()
    # Clean audit_chain table for a fresh start
    session.execute(text("DELETE FROM audit_chain"))
    session.commit()
    yield session
    session.close()


class TestComputeHash:
    """Unit tests for compute_hash (no DB)."""

    def test_deterministic_for_reordered_keys(self):
        ts = datetime.now(timezone.utc).isoformat()
        h1 = compute_hash("test", 1, {"b": 2, "a": 1}, GENESIS_HASH, ts)
        h2 = compute_hash("test", 1, {"a": 1, "b": 2}, GENESIS_HASH, ts)
        assert h1 == h2

    def test_changes_when_payload_changes(self):
        ts = datetime.now(timezone.utc).isoformat()
        h1 = compute_hash("test", 1, {"event": "query"}, GENESIS_HASH, ts)
        h2 = compute_hash("test", 1, {"event": "tampered"}, GENESIS_HASH, ts)
        assert h1 != h2

    def test_changes_when_timestamp_changes(self):
        h1 = compute_hash("test", 1, {}, GENESIS_HASH, "2026-09-19T00:00:00+00:00")
        h2 = compute_hash("test", 1, {}, GENESIS_HASH, "2026-09-19T00:00:01+00:00")
        assert h1 != h2

    def test_none_actor_user_id(self):
        ts = datetime.now(timezone.utc).isoformat()
        h = compute_hash("test", None, {}, GENESIS_HASH, ts)
        assert len(h) == 64  # SHA-256 hex digest

    def test_timestamp_must_be_string(self):
        """The old tests passed a datetime object. Verify that str works correctly."""
        ts_str = "2026-09-03T00:00:00+00:00"
        h = compute_hash("test", 1, {}, GENESIS_HASH, ts_str)
        assert len(h) == 64


class TestChainWithSQLite:
    """Test the chain against SQLite (in-memory). This validates the logic
    independent of PostgreSQL JSON/JSONB normalization."""

    def test_single_record_chain_verifies(self, db_session):
        append_record(db_session, "test_event", None, {"key": "value"})
        db_session.commit()
        valid, count, broken = verify_chain(db_session)
        assert valid is True
        assert count == 1
        assert broken is None

    def test_multi_record_chain_verifies(self, db_session):
        for i in range(5):
            append_record(db_session, f"event_{i}", None, {"index": i})
            db_session.commit()
        valid, count, broken = verify_chain(db_session)
        assert valid is True
        assert count == 5
        assert broken is None

    def test_tampered_payload_detected(self, db_session):
        for i in range(3):
            append_record(db_session, f"event_{i}", None, {"index": i})
            db_session.commit()

        # Tamper record 2 (the middle one)
        records = db_session.query(AuditChain).order_by(AuditChain.record_id).all()
        target = records[1]  # middle record
        target.payload = {**target.payload, "tampered": True}
        db_session.commit()

        valid, count, broken = verify_chain(db_session)
        assert valid is False
        assert broken == target.record_id

    def test_tampered_first_record_detected(self, db_session):
        for i in range(3):
            append_record(db_session, f"event_{i}", None, {"index": i})
            db_session.commit()

        records = db_session.query(AuditChain).order_by(AuditChain.record_id).all()
        target = records[0]
        target.payload = {**target.payload, "tampered": True}
        db_session.commit()

        valid, count, broken = verify_chain(db_session)
        assert valid is False
        assert broken == target.record_id

    def test_tampered_last_record_detected(self, db_session):
        for i in range(3):
            append_record(db_session, f"event_{i}", None, {"index": i})
            db_session.commit()

        records = db_session.query(AuditChain).order_by(AuditChain.record_id).all()
        target = records[-1]
        target.payload = {**target.payload, "tampered": True}
        db_session.commit()

        valid, count, broken = verify_chain(db_session)
        assert valid is False
        assert broken == target.record_id

    def test_deleted_middle_record_detected(self, db_session):
        for i in range(3):
            append_record(db_session, f"event_{i}", None, {"index": i})
            db_session.commit()

        records = db_session.query(AuditChain).order_by(AuditChain.record_id).all()
        db_session.delete(records[1])
        db_session.commit()

        valid, count, broken = verify_chain(db_session)
        assert valid is False
        # After deleting the middle record, the chain should break at record 3
        # because record 3's prev_hash won't match record 1's record_hash
        assert broken == records[2].record_id

    def test_truncated_tail_not_detected(self, db_session):
        """KNOWN LIMITATION: The hash chain alone cannot detect tail truncation.
        Deleting the last N records leaves a valid shorter chain.
        This requires external witnesses (e.g., blockchain anchoring) to detect."""
        for i in range(5):
            append_record(db_session, f"event_{i}", None, {"index": i})
            db_session.commit()

        # Delete last 2 records
        records = db_session.query(AuditChain).order_by(AuditChain.record_id).all()
        db_session.delete(records[-1])
        db_session.delete(records[-2])
        db_session.commit()

        valid, count, broken = verify_chain(db_session)
        # This PASSES — the chain looks valid, just shorter
        assert valid is True
        assert count == 3
        assert broken is None

    def test_empty_chain_verifies(self, db_session):
        valid, count, broken = verify_chain(db_session)
        assert valid is True
        assert count == 0
        assert broken is None


class TestChainWithPostgreSQL:
    """Test the chain against real PostgreSQL.
    
    These tests reproduce the reported record-1 chain failure.
    Run with: TEST_DATABASE_URL=postgresql+psycopg://... pytest -v -k TestChainWithPostgreSQL
    """

    def test_single_record_roundtrip(self, pg_session):
        """The most basic test: insert one record, commit, read back, verify."""
        append_record(pg_session, "test_event", None, {"key": "value"})
        pg_session.commit()

        valid, count, broken = verify_chain(pg_session)
        assert valid is True, f"Chain failed at record {broken}"
        assert count == 1

    def test_multi_record_roundtrip(self, pg_session):
        for i in range(5):
            append_record(pg_session, f"event_{i}", None, {"index": i})
            pg_session.commit()

        valid, count, broken = verify_chain(pg_session)
        assert valid is True, f"Chain failed at record {broken}"
        assert count == 5

    def test_payload_survives_roundtrip(self, pg_session):
        """Test that the payload JSON survives the PostgreSQL round trip
        and produces the same hash."""
        payload = {"case_id": 1, "question": "test?", "chunks_used": ["doc1_chunk0", "doc1_chunk1"]}
        record = append_record(pg_session, "evidentiary_query", 1, payload)
        expected_hash = record.record_hash
        pg_session.commit()

        # Read back
        readback = pg_session.get(AuditChain, record.record_id)
        recomputed = compute_hash(
            readback.event_type,
            readback.actor_user_id,
            readback.payload,
            readback.prev_hash,
            readback.timestamp,
        )
        assert recomputed == expected_hash, (
            f"Hash mismatch after round trip.\n"
            f"  Original payload JSON: {json.dumps(payload, sort_keys=True, separators=(',', ':'))}\n"
            f"  Readback payload JSON: {json.dumps(readback.payload, sort_keys=True, separators=(',', ':'))}\n"
            f"  Original hash: {expected_hash}\n"
            f"  Recomputed hash: {recomputed}"
        )

    def test_tamper_detected_at_exact_record(self, pg_session):
        for i in range(3):
            append_record(pg_session, f"event_{i}", None, {"index": i})
            pg_session.commit()

        records = pg_session.query(AuditChain).order_by(AuditChain.record_id).all()
        target = records[1]
        target.payload = {**target.payload, "tampered": True}
        pg_session.commit()

        valid, count, broken = verify_chain(pg_session)
        assert valid is False
        assert broken == target.record_id
