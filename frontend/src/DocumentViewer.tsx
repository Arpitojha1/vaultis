import { useEffect, useState } from 'react';
import { api } from './api/client';
import { X, AlertCircle } from 'lucide-react';

export function DocumentViewer({ documentId, onClose }: { documentId: string; onClose?: () => void }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState<{ accessibleChunks: number; totalChunks: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let url: string | null = null;

    api.getDocumentView(documentId)
      .then(async (response) => {
        if (!mounted) return;
        if (response.ok) {
          const rawBlob = await response.blob();
          const blob = new Blob([rawBlob], { type: 'application/pdf' });
          url = URL.createObjectURL(blob);
          if (mounted) { setBlobUrl(url); setLoading(false); }
          else { URL.revokeObjectURL(url); }
        } else if (response.status === 403) {
          const data = await response.json();
          if (mounted) {
            setAccessDenied({ accessibleChunks: data.accessibleChunks, totalChunks: data.totalChunks });
            setLoading(false);
          }
        } else {
          throw new Error(`Failed to load document: ${response.status}`);
        }
      })
      .catch((err) => {
        if (mounted) { setError(err.message || 'Error loading document'); setLoading(false); }
      });

    return () => { mounted = false; if (url) URL.revokeObjectURL(url); };
  }, [documentId]);

  return (
    /* Overlay */
    <div className="fixed inset-0 z-50 flex flex-col bg-black/70 dark:bg-black/80 p-4 sm:p-8 backdrop-blur-sm">
      {/* Modal shell */}
      <div className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 shadow-2xl transition-colors">

        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 px-5 py-4 bg-slate-50 dark:bg-slate-800/80 transition-colors">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Document Viewer</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </header>

        {/* Body */}
        <div className="relative flex-1 bg-slate-100 dark:bg-slate-950 p-4 flex items-center justify-center transition-colors">
          {loading && (
            <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Loading document…</p>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center text-red-600 dark:text-red-400 p-8 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800/60 max-w-sm text-center">
              <AlertCircle className="w-10 h-10 mb-3" />
              <p className="font-semibold">{error}</p>
            </div>
          )}

          {accessDenied && (
            <div className="flex flex-col items-center justify-center p-10 bg-rose-50 dark:bg-rose-900/20 rounded-2xl border border-rose-200 dark:border-rose-800/60 max-w-sm text-center">
              <AlertCircle className="w-12 h-12 mb-4 text-rose-500 dark:text-rose-400" />
              <h3 className="text-xl font-bold mb-2 text-rose-800 dark:text-rose-300">Access Denied</h3>
              <p className="font-medium text-rose-700 dark:text-rose-400">
                You have access to {accessDenied.accessibleChunks} of {accessDenied.totalChunks} chunks.
              </p>
              <p className="mt-3 text-sm text-rose-600 dark:text-rose-500">
                Insufficient permissions to view this document completely.
              </p>
            </div>
          )}

          {blobUrl && (
            <iframe
              src={blobUrl}
              className="h-full w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white shadow-sm"
              title="Document content"
            />
          )}
        </div>
      </div>
    </div>
  );
}
