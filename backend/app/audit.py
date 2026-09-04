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


# BREAKING CHANGE: This function was previously compute_hash(payload, prev_hash, timestamp)
# and hashed only payload + prev_hash + timestamp. It now includes event_type and
# actor_user_id in the hash material, as required by the spec (action + entity_type +
# entity_id + user_id + timestamp). Any existing AuditChain rows written with the old
# format will fail verify_chain() against this new format. The database must be wiped
# and reseeded (or a migration applied) before verification can pass on existing records.
# The team will coordinate the DB wipe separately — do not run a migration here.
def compute_hash(
    event_type: str,
    actor_user_id: int | None,
    payload: dict,
    prev_hash: str,
    timestamp: datetime,
) -> str:
    material = (
        event_type
        + str(actor_user_id)
        + json.dumps(payload, sort_keys=True, separators=(",", ":"))
        + prev_hash
        + canonical_timestamp(timestamp)
    )
    return hashlib.sha256(material.encode("utf-8")).hexdigest()


def append_record(db: Session, event_type: str, actor_user_id: int | None, payload: dict) -> AuditChain:
    previous = db.scalar(select(AuditChain).order_by(AuditChain.record_id.desc()).limit(1))
    prev_hash = previous.record_hash if previous else GENESIS_HASH
    timestamp = datetime.now(timezone.utc)
    record = AuditChain(
        event_type=event_type,
        actor_user_id=actor_user_id,
        payload=payload,
        timestamp=timestamp,
        prev_hash=prev_hash,
        record_hash=compute_hash(event_type, actor_user_id, payload, prev_hash, timestamp),
    )
    db.add(record)
    return record


def verify_chain(db: Session) -> tuple[bool, int, int | None]:
    expected_prev = GENESIS_HASH
    records = db.scalars(select(AuditChain).order_by(AuditChain.record_id)).all()
    for record in records:
        expected = compute_hash(record.event_type, record.actor_user_id, record.payload, expected_prev, record.timestamp)
        if record.prev_hash != expected_prev or record.record_hash != expected:
            return False, len(records), record.record_id
        expected_prev = record.record_hash
    return True, len(records), None
