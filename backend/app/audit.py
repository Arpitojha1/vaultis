from datetime import datetime, timezone
import hashlib
import json
from sqlalchemy import select
from sqlalchemy.orm import Session
from .models import AuditChain

GENESIS_HASH = "0" * 64


def canonical_timestamp(value: datetime) -> str:
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).isoformat()


def compute_hash(payload: dict, prev_hash: str, timestamp: datetime) -> str:
    material = json.dumps(payload, sort_keys=True, separators=(",", ":")) + prev_hash + canonical_timestamp(timestamp)
    return hashlib.sha256(material.encode("utf-8")).hexdigest()


def append_record(db: Session, event_type: str, actor_user_id: int | None, payload: dict) -> AuditChain:
    previous = db.scalar(select(AuditChain).order_by(AuditChain.record_id.desc()).limit(1))
    prev_hash = previous.record_hash if previous else GENESIS_HASH
    timestamp = datetime.now(timezone.utc)
    record = AuditChain(event_type=event_type, actor_user_id=actor_user_id, payload=payload, timestamp=timestamp, prev_hash=prev_hash, record_hash=compute_hash(payload, prev_hash, timestamp))
    db.add(record)
    return record


def verify_chain(db: Session) -> tuple[bool, int, int | None]:
    expected_prev = GENESIS_HASH
    records = db.scalars(select(AuditChain).order_by(AuditChain.record_id)).all()
    for record in records:
        expected = compute_hash(record.payload, expected_prev, record.timestamp)
        if record.prev_hash != expected_prev or record.record_hash != expected:
            return False, len(records), record.record_id
        expected_prev = record.record_hash
    return True, len(records), None
