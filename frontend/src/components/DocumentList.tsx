import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { FileText, MessageSquare, Eye, Clock, ShieldAlert } from 'lucide-react';

type Document = { 
  id: string; 
  filename: string;
  created_at?: string;
  sensitivity_breakdown?: Record<string, number>;
};

export function DocumentList({ caseId, onOpenDocChat, onViewDoc }: {
  caseId: number;
  onOpenDocChat: (docId: string, filename: string) => void;
  onViewDoc: (docId: string) => void;
}) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    api.getDocuments(caseId)
      .then((res: Document[]) => { if (mounted) { setDocuments(res); setLoading(false); } })
      .catch((err: Error) => { if (mounted) { setError(err.message || 'Failed to load documents'); setLoading(false); } });
    return () => { mounted = false; };
  }, [caseId]);

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-6">Case Documents</h2>

      {loading && <p className="text-slate-500 dark:text-slate-400">Loading documents…</p>}
      {error && <p className="text-red-600 dark:text-red-400">{error}</p>}
      {!loading && !error && documents.length === 0 && (
        <p className="text-slate-500 dark:text-slate-400">No documents found for this case.</p>
      )}

      {!loading && documents.length > 0 && (
        <div className="flex flex-col gap-3">
          {documents.map(doc => (
            <div
              key={doc.id}
              className="flex flex-col gap-4 p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 transition-colors hover:border-slate-300 dark:hover:border-slate-600"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <FileText className="text-slate-500 dark:text-slate-400 w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
                    <span className="font-semibold text-base text-slate-900 dark:text-white">{doc.filename}</span>
                  </div>
                  {doc.created_at && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      Ingested {new Date(doc.created_at).toLocaleString()}
                    </div>
                  )}
                  {doc.sensitivity_breakdown && Object.keys(doc.sensitivity_breakdown).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {Object.entries(doc.sensitivity_breakdown).map(([level, count]) => (
                        <span key={level} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 capitalize">
                          <ShieldAlert className="w-3 h-3" />
                          {level.replace('_', ' ')}: {count} chunk{count !== 1 ? 's' : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onViewDoc(doc.id)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    <Eye className="w-4 h-4" strokeWidth={1.5} /> View
                  </button>
                  <button
                    onClick={() => onOpenDocChat(doc.id, doc.filename)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-slate-900 dark:bg-blue-600 rounded-lg hover:bg-slate-800 dark:hover:bg-blue-500 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" strokeWidth={1.5} /> Chat about this
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
