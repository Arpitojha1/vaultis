from datetime import datetime, timezone
from app.audit import GENESIS_HASH, compute_hash


def test_hash_is_deterministic_for_reordered_payload_keys():
    timestamp = datetime(2026, 9, 3, tzinfo=timezone.utc)
    assert compute_hash("test_event", 1, {"b": 2, "a": 1}, GENESIS_HASH, timestamp) == compute_hash("test_event", 1, {"a": 1, "b": 2}, GENESIS_HASH, timestamp)


def test_hash_changes_when_payload_changes():
    timestamp = datetime(2026, 9, 3, tzinfo=timezone.utc)
    assert compute_hash("test_event", 1, {"event": "query"}, GENESIS_HASH, timestamp) != compute_hash("test_event", 1, {"event": "tampered"}, GENESIS_HASH, timestamp)
