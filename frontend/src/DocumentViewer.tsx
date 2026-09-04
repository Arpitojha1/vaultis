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
          if (mounted) {
            setBlobUrl(url);
            setLoading(false);
          } else {
            URL.revokeObjectURL(url);
          }
        } else if (response.status === 403) {
          // TODO(verify): confirm 403 payload shape against BE1:B15 once merged
          const data = await response.json();
          if (mounted) {
            setAccessDenied({
              accessibleChunks: data.accessibleChunks,
              totalChunks: data.totalChunks
            });
            setLoading(false);
          }
        } else {
          throw new Error(`Failed to load document: ${response.status}`);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message || 'Error loading document');
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [documentId]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/80 p-4 sm:p-8">
      <div className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b px-4 py-3 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">Document Viewer</h2>
          {onClose && (
            <button onClick={onClose} className="rounded-md p-1 hover:bg-slate-200">
              <X className="h-6 w-6 text-slate-600" />
            </button>
          )}
        </header>
        
        <div className="relative flex-1 bg-slate-100 p-4 flex items-center justify-center">
          {loading && (
            <p className="text-slate-500 font-medium">Loading document...</p>
          )}
          
          {error && (
            <div className="flex flex-col items-center justify-center text-red-600 p-6 bg-red-50 rounded-lg border border-red-200">
              <AlertCircle className="w-8 h-8 mb-2" />
              <p className="font-semibold">{error}</p>
            </div>
          )}

          {accessDenied && (
            <div className="flex flex-col items-center justify-center text-rose-700 p-8 bg-rose-50 rounded-xl border border-rose-200 shadow-sm">
              <AlertCircle className="w-12 h-12 mb-4 text-rose-500" />
              <h3 className="text-xl font-bold mb-2">Access Denied</h3>
              <p className="font-medium text-rose-800">
                You have access to {accessDenied.accessibleChunks} of {accessDenied.totalChunks} chunks.
              </p>
              <p className="mt-4 text-sm text-rose-600">
                Insufficient permissions to view this document completely.
              </p>
            </div>
          )}

          {blobUrl && (
            <iframe
              src={blobUrl}
              className="h-full w-full rounded border bg-white shadow-sm"
              title="Document content"
            />
          )}
        </div>
      </div>
    </div>
  );
}
