import { useState } from 'react';
import { Activity, ArrowRight, FolderLock, Search, Trash2 } from 'lucide-react';
import { api } from '../api/client';
import type { ApiCase, User } from '../types';

export function CaseDashboard({ cases, user, onSelect, onAudit, onCaseDeleted }: {
  cases: ApiCase[];
  user: User;
  onSelect: (item: ApiCase) => void;
  onAudit: () => void;
  onCaseDeleted?: (caseId: number) => void;
}) {
  const [query, setQuery] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const visible = cases.filter(c =>
    (c.case_number + c.title).toLowerCase().includes(query.toLowerCase())
  );

  const handleDelete = async (caseId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmId !== caseId) {
      setConfirmId(caseId);
      return;
    }
    setDeletingId(caseId);
    setConfirmId(null);
    try {
      await api.deleteCase(caseId);
      onCaseDeleted?.(caseId);
    } catch (err) {
      console.error('Delete failed', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* User info header */}
      <section className="flex flex-wrap justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 p-6 shadow-sm transition-colors">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Authenticated operator</p>
          <h1 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
            {user.username}
            <span className="ml-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
              {user.role.replaceAll('_', ' ')}
            </span>
          </h1>
        </div>
        <button
          onClick={onAudit}
          className="rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <Activity className="mr-1.5 inline w-4" strokeWidth={1.5} />Audit chain
        </button>
      </section>

      {/* Cases list */}
      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Accessible case vaults</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Data is scoped by your active server session.</p>
        </div>
        <label className="relative">
          <Search className="absolute left-3 top-2.5 w-4 text-slate-400" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search cases"
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
          />
        </label>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {visible.map(item => (
          <div
            key={item.case_id}
            className="group relative rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 p-6 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md dark:hover:shadow-slate-950 transition-all duration-200"
          >
            {/* Delete button */}
            <button
              onClick={e => handleDelete(item.case_id, e)}
              disabled={deletingId === item.case_id}
              title={confirmId === item.case_id ? 'Click again to confirm delete' : 'Delete case'}
              className={`absolute top-4 right-4 rounded-lg p-1.5 text-xs font-medium transition-all duration-200 opacity-0 group-hover:opacity-100 ${
                confirmId === item.case_id
                  ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 opacity-100 ring-1 ring-red-400'
                  : 'text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
              }`}
            >
              {deletingId === item.case_id
                ? <span className="px-1 text-[10px] animate-pulse">Deleting…</span>
                : confirmId === item.case_id
                  ? <span className="px-1 text-[10px]">Confirm?</span>
                  : <Trash2 className="w-4 h-4" strokeWidth={1.5} />
              }
            </button>

            {/* Card content — clickable */}
            <button
              onClick={() => onSelect(item)}
              className="w-full text-left"
            >
              <FolderLock className="text-slate-600 dark:text-slate-400 w-6 h-6 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" strokeWidth={1.5} />
              <p className="mt-4 font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">{item.case_number}</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 capitalize">{item.status}</p>
              <span className="mt-6 flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                View documents <ArrowRight className="ml-1 w-4 h-4" />
              </span>
            </button>
          </div>
        ))}
      </div>

      {!visible.length && (
        <p className="mt-12 text-center text-slate-500 dark:text-slate-400">No accessible cases match your search.</p>
      )}
    </div>
  );
}
