"""initial VAULTIS schema

Revision ID: 0001
Revises:
Create Date: 2026-09-03
"""
from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table("users", sa.Column("user_id", sa.Integer(), primary_key=True), sa.Column("username", sa.String(100), nullable=False), sa.Column("password_hash", sa.String(255), nullable=False), sa.Column("role", sa.String(40), nullable=False), sa.Column("mfa_enabled", sa.Boolean(), server_default=sa.false(), nullable=False), sa.Column("totp_secret", sa.String(100), nullable=True), sa.UniqueConstraint("username"))
    op.create_index("ix_users_username", "users", ["username"])
    op.create_index("ix_users_role", "users", ["role"])
    op.create_table("cases", sa.Column("case_id", sa.Integer(), primary_key=True), sa.Column("case_number", sa.String(80), nullable=False), sa.Column("title", sa.String(255), nullable=False), sa.Column("status", sa.String(80), nullable=False), sa.UniqueConstraint("case_number"))
    op.create_table("case_access", sa.Column("access_id", sa.Integer(), primary_key=True), sa.Column("case_id", sa.Integer(), sa.ForeignKey("cases.case_id", ondelete="CASCADE"), nullable=False), sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False), sa.UniqueConstraint("case_id", "user_id", name="uq_case_access"))
    op.create_index("ix_case_access_case_id", "case_access", ["case_id"])
    op.create_index("ix_case_access_user_id", "case_access", ["user_id"])
    op.create_table("documents", sa.Column("document_id", sa.Integer(), primary_key=True), sa.Column("case_id", sa.Integer(), sa.ForeignKey("cases.case_id", ondelete="CASCADE"), nullable=False), sa.Column("filename", sa.String(255), nullable=False), sa.Column("encrypted_path", sa.String(500), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False))
    op.create_index("ix_documents_case_id", "documents", ["case_id"])
    op.create_table("chunk_permissions", sa.Column("chunk_id", sa.String(160), primary_key=True), sa.Column("case_id", sa.Integer(), sa.ForeignKey("cases.case_id", ondelete="CASCADE"), nullable=False), sa.Column("document_id", sa.Integer(), sa.ForeignKey("documents.document_id", ondelete="CASCADE"), nullable=False), sa.Column("sensitivity_level", sa.String(40), nullable=False), sa.Column("disclosed_to_defense", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.create_index("ix_chunk_permissions_case_id", "chunk_permissions", ["case_id"])
    op.create_index("ix_chunk_permissions_document_id", "chunk_permissions", ["document_id"])
    op.create_table("audit_chain", sa.Column("record_id", sa.Integer(), primary_key=True), sa.Column("event_type", sa.String(80), nullable=False), sa.Column("actor_user_id", sa.Integer(), sa.ForeignKey("users.user_id"), nullable=True), sa.Column("payload", sa.JSON(), nullable=False), sa.Column("timestamp", sa.String(100), nullable=False), sa.Column("prev_hash", sa.String(64), nullable=False), sa.Column("record_hash", sa.String(64), nullable=False), sa.UniqueConstraint("record_hash"))

def downgrade() -> None:
    op.drop_table("audit_chain")
    op.drop_table("chunk_permissions")
    op.drop_table("documents")
    op.drop_table("case_access")
    op.drop_table("cases")
    op.drop_table("users")
