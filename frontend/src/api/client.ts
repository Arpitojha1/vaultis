const BASE_URL = ((import.meta as unknown as { env?: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

let authToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setAuthToken(token: string | null) { authToken = token; }
export function setUnauthorizedHandler(handler: (() => void) | null) { unauthorizedHandler = handler; }

async function request(path: string, options: RequestInit = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...options.headers,
    },
  });
  if (response.status === 401) unauthorizedHandler?.();
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${response.status}`);
  }
  return response.json();
}

async function requestRaw(path: string, options: RequestInit = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...options.headers,
    },
  });
  if (response.status === 401) unauthorizedHandler?.();
  return response;
}

export const api = {
  login: (username: string, password: string) => request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  getCases: () => request('/cases'),
  getDocuments: (caseId: number) => request(`/cases/${caseId}/documents`),
  createCase: (data: { case_number: string; title: string }) => request('/cases', { method: 'POST', body: JSON.stringify(data) }),
  uploadDocument: (caseId: number, file: File, sensitivityLevel?: string) => {
    const form = new FormData(); form.append('file', file);
    if (sensitivityLevel) form.append('sensitivity_level', sensitivityLevel);
    return request(`/cases/${caseId}/documents`, { method: 'POST', body: form });
  },
  // TODO(verify): confirm document_id is honored by BE1:B9 once merged
  answerQuery: (caseId: number, question: string, documentId?: string) => request('/answer_query', { method: 'POST', body: JSON.stringify({ case_id: caseId, question, ...(documentId ? { document_id: documentId } : {}) }) }),
  getAuditEvents: () => request('/audit-events'),
  verifyChain: () => request('/verify-chain', { method: 'POST' }),
  tamperEvent: (recordId: number) => request(`/audit-events/${recordId}/tamper`, { method: 'POST' }),
  getEncryptionStatus: (documentId: number) => request(`/documents/${documentId}/encryption-status`),
  getDocumentView: (documentId: string) => requestRaw(`/documents/${documentId}/view`),
  deleteCase: (caseId: number) => request(`/cases/${caseId}`, { method: 'DELETE' }),
};
