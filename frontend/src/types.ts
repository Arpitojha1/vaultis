export type Role = 'investigating_officer' | 'prosecutor' | 'defense_lawyer' | 'judge';

export interface User { user_id: number; username: string; role: Role; }
export interface ApiCase { case_id: number; case_number: string; title: string; status: string; }
export interface ApiChunk { chunk_id: string; text?: string; document_id?: number; sensitivity_level: string; reason?: string; }
export interface ApiAuditRecord { record_id: number; event_type: string; actor_user_id: number | null; payload: Record<string, unknown>; timestamp: string; prev_hash: string; record_hash: string; }
