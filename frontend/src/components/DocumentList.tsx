import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { FileText, MessageSquare, Eye } from 'lucide-react';

type Document = {
  id: string;
  filename: string;
  created_at?: string | null;
  sensitivity_breakdown?: Record<string, number>;
};

export function DocumentList({ caseId, onOpenDocChat, onViewDoc }: { caseId: number; onOpenDocChat: (docId: string, filename: string) => void; onViewDoc: (docId: string) => void }) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    api.getDocuments(caseId)
      .then((res: Document[]) => {
        if (mounted) {
          setDocuments(res);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (mounted) {
          setError(err.message || 'Failed to load documents');
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, [caseId]);

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-6">Case Documents</h2>
      {loading && <p className="text-slate-500">Loading documents...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && documents.length === 0 && (
        <p className="text-slate-500">No documents found for this case.</p>
      )}
      {!loading && documents.length > 0 && (
        <div className="flex flex-col gap-4">
          {documents.map(doc => (
            <div key={doc.id} className="flex flex-col gap-4 p-4 bg-white rounded-xl border border-slate-200 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <FileText className="text-slate-700" strokeWidth={1.5} />
                  <span className="font-medium text-slate-900">{doc.filename}</span>
                </div>
                {doc.created_at && (
                  <div className="text-xs text-slate-500">
                    Added: {new Date(doc.created_at).toLocaleString()}
                  </div>
                )}
                {doc.sensitivity_breakdown && Object.keys(doc.sensitivity_breakdown).length > 0 && (
                  <div className="flex gap-2 mt-1">
                    {Object.entries(doc.sensitivity_breakdown).map(([level, count]) => (
                      <span key={level} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {level}: {count} chunks
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onViewDoc(doc.id)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
                >
                  <Eye className="w-4 h-4" strokeWidth={1.5} /> Open
                </button>
                <button
                  onClick={() => onOpenDocChat(doc.id, doc.filename)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" strokeWidth={1.5} /> Ask about this document
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
