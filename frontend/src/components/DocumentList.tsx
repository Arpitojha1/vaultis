import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { FileText, MessageSquare, Eye } from 'lucide-react';

type Document = { id: string; filename: string };

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
              className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 transition-colors hover:border-slate-300 dark:hover:border-slate-600"
            >
              <div className="flex items-center gap-3">
                <FileText className="text-slate-500 dark:text-slate-400 w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
                <span className="font-medium text-slate-900 dark:text-white">{doc.filename}</span>
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
          ))}
        </div>
      )}
    </div>
  );
}
