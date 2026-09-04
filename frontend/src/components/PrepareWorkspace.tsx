import { useState, type FormEvent } from 'react';
import { CheckCircle2, FileUp, FolderPlus, LockKeyhole, ShieldCheck } from 'lucide-react';
import { api } from '../api/client';
import type { ApiCase } from '../types';

type Upload = { file: File; sensitivity: string; status: 'pending' | 'uploading' | 'done' | 'error'; message?: string; documentId?: number; chunks?: number; encryption?: { encrypted: boolean; algorithm: string; encrypted_file_hash_sha256: string } };

export function PrepareWorkspace({ onReady }: { onReady: (caseItem: ApiCase) => void }) {
  const [caseNumber, setCaseNumber] = useState(''); const [title, setTitle] = useState(''); const [caseItem, setCaseItem] = useState<ApiCase | null>(null);
  const [uploads, setUploads] = useState<Upload[]>([]); const [error, setError] = useState(''); const [creating, setCreating] = useState(false);
  const create = async (event: FormEvent) => { event.preventDefault(); setCreating(true); setError(''); try { setCaseItem(await api.createCase({ case_number: caseNumber, title })); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to create case'); } finally { setCreating(false); } };
  const chooseFiles = (files: FileList | null) => setUploads(Array.from(files || []).map(file => ({ file, sensitivity: 'case_team', status: 'pending' })));
  const update = (index: number, patch: Partial<Upload>) => setUploads(old => old.map((item, i) => i === index ? { ...item, ...patch } : item));
  const upload = async (index: number) => { if (!caseItem) return; const item = uploads[index]; update(index, { status: 'uploading', message: 'Uploading and parsing…' }); try { const result = await api.uploadDocument(caseItem.case_id, item.file, item.sensitivity); update(index, { status: 'done', documentId: result.document_id, chunks: result.chunks_created, message: `Parsed — ${result.chunks_created} chunks, access-tagged` }); } catch (e) { update(index, { status: 'error', message: e instanceof Error ? e.message : 'Upload failed' }); } };
  const verify = async (index: number) => { const item = uploads[index]; if (!item.documentId) return; update(index, { message: 'Verifying encryption…' }); try { const encryption = await api.getEncryptionStatus(item.documentId); update(index, { encryption, message: encryption.encrypted ? `${encryption.algorithm} encrypted at rest` : 'Encryption check failed' }); } catch (e) { update(index, { status: 'error', message: e instanceof Error ? e.message : 'Verification failed' }); } };
  const ready = uploads.length > 0 && uploads.every(item => item.status === 'done' && item.encryption?.encrypted);
  
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400">First-time vault setup</p>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">Prepare your workspace</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Create a case, upload evidence, and verify encryption before entering the vault.</p>
      </div>
      
      {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/30 dark:text-red-400">{error}</p>}
      
      <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 transition-colors">
        <div className="flex gap-3">
          <FolderPlus className="text-blue-700 dark:text-blue-400"/>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">1. Create a case</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">This grants your authenticated account access to the new case.</p>
          </div>
        </div>
        
        {!caseItem ? (
          <form onSubmit={create} className="mt-5 grid sm:grid-cols-2 gap-3">
            <input required value={caseNumber} onChange={e=>setCaseNumber(e.target.value)} placeholder="Case number" className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"/>
            <input required value={title} onChange={e=>setTitle(e.target.value)} placeholder="Case title" className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"/>
            <button disabled={creating} className="sm:col-span-2 rounded-lg bg-blue-700 hover:bg-blue-800 p-2.5 text-white font-semibold disabled:opacity-50 transition-colors">
              {creating ? 'Creating…' : 'Create case'}
            </button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-emerald-700 dark:text-emerald-500 flex gap-2">
            <CheckCircle2 className="w-5"/>{caseItem.case_number} created
          </p>
        )}
      </section>
      
      {caseItem && (
        <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 transition-colors">
          <div className="flex gap-3">
            <FileUp className="text-blue-700 dark:text-blue-400"/>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">2. Upload PDF evidence</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Each file is parsed and encrypted by the server.</p>
            </div>
          </div>
          <input type="file" accept=".pdf" multiple onChange={e=>chooseFiles(e.target.files)} className="mt-5 block text-sm text-slate-700 dark:text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/40 dark:file:text-blue-400 dark:hover:file:bg-blue-900/60 transition-colors"/>
          
          {uploads.map((item,index)=>(
            <div key={`${item.file.name}-${index}`} className="mt-4 rounded-lg border border-slate-200 dark:border-slate-700 p-4 transition-colors">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <strong className="text-sm text-slate-900 dark:text-white">{item.file.name}</strong>
                  <p className={`text-xs mt-1 ${item.status === 'error' ? 'text-red-700 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>{item.message || 'Ready to upload'}</p>
                </div>
                <select value={item.sensitivity} disabled={item.status !== 'pending'} onChange={e=>update(index,{sensitivity:e.target.value})} className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 text-xs text-slate-900 dark:text-white outline-none transition-colors disabled:opacity-50">
                  <option value="public">public</option>
                  <option value="case_team">case team</option>
                  <option value="sealed">sealed</option>
                </select>
              </div>
              
              {item.status === 'pending' && <button onClick={()=>upload(index)} className="mt-3 rounded bg-slate-900 dark:bg-slate-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors">Upload & parse</button>}
              {item.status === 'done' && !item.encryption && <button onClick={()=>verify(index)} className="mt-3 rounded bg-blue-700 dark:bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-800 dark:hover:bg-blue-700 transition-colors">Verify encryption</button>}
              {item.encryption && <p className="mt-3 flex gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-500"><ShieldCheck className="w-4"/>{item.encryption.algorithm} · {item.encryption.encrypted_file_hash_sha256.slice(0,16)}…</p>}
            </div>
          ))}
        </section>
      )}
      
      {ready && <button onClick={()=>caseItem && onReady(caseItem)} className="w-full rounded-xl bg-emerald-600 dark:bg-emerald-700 hover:bg-emerald-700 dark:hover:bg-emerald-600 p-3 font-bold text-white flex justify-center gap-2 transition-colors"><LockKeyhole className="w-5"/>Enter Vault</button>}
    </div>
  );
}
