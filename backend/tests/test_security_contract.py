from datetime import datetime, timezone
from app.audit import GENESIS_HASH, compute_hash


def test_hash_is_deterministic_for_reordered_payload_keys():
    timestamp = datetime(2026, 9, 3, tzinfo=timezone.utc)
    assert compute_hash({"b": 2, "a": 1}, GENESIS_HASH, timestamp) == compute_hash({"a": 1, "b": 2}, GENESIS_HASH, timestamp)


def test_hash_changes_when_payload_changes():
    timestamp = datetime(2026, 9, 3, tzinfo=timezone.utc)
    assert compute_hash({"event": "query"}, GENESIS_HASH, timestamp) != compute_hash({"event": "tampered"}, GENESIS_HASH, timestamp)
