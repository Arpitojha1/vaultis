import { useState, type FormEvent } from 'react';
import { Lock, Send, ShieldCheck } from 'lucide-react';
import type { ApiCase, ApiChunk, User } from '../types';
import { api } from '../api/client';
import ReactMarkdown from 'react-markdown';

type Result = { answer: string; authorized_chunks: ApiChunk[]; filtered_chunks: ApiChunk[] };

export function ChatScreen({ caseItem, user, documentId, documentFilename }: {
  caseItem: ApiCase;
  user: User;
  documentId?: string;
  documentFilename?: string;
}) {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const ask = async (e: FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setBusy(true); setError('');
    try { setResult(await api.answerQuery(caseItem.case_id, question, documentId)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Query failed'); }
    finally { setBusy(false); }
  };

  const mdComponents = {
    p: ({ ...props }) => <p className="mb-4 last:mb-0 text-slate-900 dark:text-slate-100" {...props} />,
    h1: ({ ...props }) => <h1 className="text-lg font-bold mb-3 mt-4 text-slate-900 dark:text-white" {...props} />,
    h2: ({ ...props }) => <h2 className="text-base font-bold mb-2 mt-4 text-slate-900 dark:text-white" {...props} />,
    h3: ({ ...props }) => <h3 className="text-sm font-bold mb-2 mt-4 text-slate-700 dark:text-slate-300" {...props} />,
    ul: ({ ...props }) => <ul className="list-disc pl-5 mb-4 space-y-1 text-slate-900 dark:text-slate-100" {...props} />,
    ol: ({ ...props }) => <ol className="list-decimal pl-5 mb-4 space-y-1 text-slate-900 dark:text-slate-100" {...props} />,
    li: ({ ...props }) => <li className="text-slate-900 dark:text-slate-100" {...props} />,
    a: ({ ...props }) => <a className="text-blue-600 dark:text-blue-400 underline underline-offset-2" {...props} />,
    blockquote: ({ ...props }) => <blockquote className="border-l-2 border-slate-300 dark:border-slate-600 pl-4 italic text-slate-600 dark:text-slate-400 mb-4" {...props} />,
    code: ({ className, children, ...props }: any) => {
      const isBlock = /language-(\w+)/.exec(className || '');
      return isBlock
        ? <pre className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg overflow-x-auto mb-4 font-mono text-xs text-slate-800 dark:text-slate-200"><code className={className} {...props}>{children}</code></pre>
        : <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-xs text-slate-800 dark:text-slate-200" {...props}>{children}</code>;
    },
  };

  return (
    <div className="mx-auto grid max-w-7xl gap-6 p-6 lg:grid-cols-[1fr_360px]">
      {/* Main chat panel */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 p-6 shadow-sm transition-colors">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{caseItem.case_number}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {caseItem.title}{documentFilename ? ` — ${documentFilename}` : ''}
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Querying as {user.role.replaceAll('_', ' ')}.</p>

        <form onSubmit={ask} className="mt-6 flex gap-3">
          <input
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Ask a question about case evidence…"
            className="grow rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors"
          />
          <button
            disabled={busy}
            className="rounded-lg bg-slate-900 dark:bg-blue-600 px-5 text-white hover:bg-slate-800 dark:hover:bg-blue-500 disabled:opacity-50 transition-colors flex items-center"
          >
            {busy ? <span className="text-xs px-1 animate-pulse">Thinking…</span> : <Send className="w-5" strokeWidth={1.5} />}
          </button>
        </form>

        {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

        {result && (
          <article className="mt-6 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/50 p-6 transition-colors">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">AI Response</p>
            <div className="mt-4 text-sm leading-relaxed">
              <ReactMarkdown components={mdComponents}>{result.answer}</ReactMarkdown>
            </div>
          </article>
        )}
      </section>

      {/* Retrieval gateway sidebar */}
      <aside className="rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 p-6 shadow-sm transition-colors">
        <h2 className="flex gap-2 font-semibold text-slate-900 dark:text-white">
          <ShieldCheck className="w-5 text-emerald-600 dark:text-emerald-500" strokeWidth={1.5} />
          Retrieval gateway
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Real authorization results from the backend.</p>

        {result && (
          <>
            <h3 className="mt-6 text-xs font-bold text-emerald-700 dark:text-emerald-400 tracking-wide uppercase">
              Authorized ({result.authorized_chunks.length})
            </h3>
            {result.authorized_chunks.map(c => (
              <div key={c.chunk_id} className="mt-3 rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-900/20 p-3 text-xs transition-colors">
                <b className="block mb-1 text-emerald-700 dark:text-emerald-400">{c.sensitivity_level}</b>
                <p className="leading-relaxed text-emerald-900 dark:text-emerald-200">{c.text}</p>
              </div>
            ))}

            <h3 className="mt-6 flex items-center gap-1.5 text-xs font-bold text-red-700 dark:text-red-400 tracking-wide uppercase">
              <Lock className="w-4 h-4" strokeWidth={1.5} />Filtered ({result.filtered_chunks.length})
            </h3>
            {result.filtered_chunks.map(c => (
              <div key={c.chunk_id} className="mt-3 rounded-lg border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-900/20 p-3 text-xs transition-colors">
                <b className="block mb-1 text-red-700 dark:text-red-400">{c.sensitivity_level}</b>
                <p className="leading-relaxed text-red-900 dark:text-red-200">{c.reason}</p>
              </div>
            ))}
          </>
        )}
      </aside>
    </div>
  );
}
