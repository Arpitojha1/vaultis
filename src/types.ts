export type Role = 'Investigating Officer' | 'Prosecutor' | 'Defense Lawyer' | 'Judge';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  badgeNumber: string;
  clearanceLevel: string;
}

export type CaseStatus = 'Under Investigation' | 'In Trial' | 'Pre-Trial Discovery' | 'Grand Jury Review';

export type CaseClassification = 
  | 'Classified // Law Enforcement Strict'
  | 'Restricted Evidentiary Vault'
  | 'Judicial Chamber Seal'
  | 'Rule 16 Discovery Protected';

export interface CaseDocument {
  id: string;
  name: string;
  type: 'PDF' | 'Wiretap Audio' | 'Financial Ledger' | 'Forensic Report' | 'Affidavit';
  size: string;
  uploadedAt: string;
  clearanceRequired: Role[];
  chunkCount: number;
  hash: string;
}

export interface CaseItem {
  id: string;
  caseNumber: string;
  title: string;
  court: string;
  status: CaseStatus;
  classification: CaseClassification;
  leadInvestigator: string;
  prosecutor: string;
  defenseCounsel: string;
  presidingJudge: string;
  summary: string;
  documentsCount: number;
  chunksCount: number;
  documents: CaseDocument[];
  demoPrompts: string[];
}

export type ChunkStatus = 'AUTHORIZED' | 'FILTERED';

export interface RetrievedChunk {
  id: string;
  sourceDoc: string;
  pageNumber: number;
  classification: string;
  clearanceLevel: string;
  snippet: string;
  status: ChunkStatus;
  withheldReason?: string;
  hash: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  caseId: string;
  roleAtTime: Role;
  attachment?: {
    name: string;
    size: string;
    type: string;
    chunksCreated: number;
    hash: string;
  };
  chunks?: RetrievedChunk[];
  isJailbreakAttempt?: boolean;
  modelNotice?: string;
}

export type AuditEventType = 
  | 'auth_login'
  | 'evidentiary_query'
  | 'document_ingest'
  | 'disclosure_filter_applied'
  | 'chain_verified'
  | 'role_switch';

export interface AuditRecord {
  id: string;
  blockNumber: number;
  timestamp: string;
  actor: string;
  actorRole: Role;
  eventType: AuditEventType;
  actionSummary: string;
  resourceId: string;
  hash: string;
  prevHash: string;
  isTampered?: boolean;
  tamperedPayload?: string;
}
