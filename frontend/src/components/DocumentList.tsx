import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { FileText, MessageSquare, Eye } from 'lucide-react';

type Document = {
  id: string;
  filename: string;
};

export function DocumentList({ caseId, onOpenDocChat, onViewDoc }: { caseId: number; onOpenDocChat: (docId: string, filename: string) => void; onViewDoc: (docId: string) => void }) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    // TODO(verify): confirm response shape against backend once available
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
    <div className="mx-auto max-w-5xl p-6 text-slate-900 dark:text-white">
      <h2 className="text-2xl font-bold mb-6">Case Documents</h2>
      {loading && <p className="text-slate-500 dark:text-slate-400">Loading documents...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && documents.length === 0 && (
        <p className="text-slate-500">No documents found for this case.</p>
      )}
      {!loading && documents.length > 0 && (
        <div className="flex flex-col gap-4">
          {documents.map(doc => (
            <div key={doc.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-slate-800 dark:text-slate-200">{doc.filename}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onViewDoc(doc.id)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <Eye className="w-4 h-4" /> View
                </button>
                <button
                  onClick={() => onOpenDocChat(doc.id, doc.filename)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  <MessageSquare className="w-4 h-4" /> Chat about this
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
