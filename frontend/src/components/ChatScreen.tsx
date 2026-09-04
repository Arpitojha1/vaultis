import { useState, type FormEvent } from 'react'; 
import { Lock, Send, ShieldCheck } from 'lucide-react'; 
import type { ApiCase, ApiChunk, User } from '../types'; 
import { api } from '../api/client';
import ReactMarkdown from 'react-markdown';

type Result={answer:string;authorized_chunks:ApiChunk[];filtered_chunks:ApiChunk[]};

export function ChatScreen({caseItem,user,documentId,documentFilename}:{caseItem:ApiCase;user:User;documentId?:string;documentFilename?:string}) { 
  const [question,setQuestion]=useState('');
  const [result,setResult]=useState<Result|null>(null);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  
  const ask=async(e:FormEvent)=>{
    e.preventDefault();
    if(!question.trim())return;
    setBusy(true);
    setError('');
    try{
      setResult(await api.answerQuery(caseItem.case_id,question,documentId))
    }catch(e){
      setError(e instanceof Error?e.message:'Query failed')
    }finally{
      setBusy(false)
    }
  }; 
  
  return (
    <div className="mx-auto grid max-w-7xl gap-6 p-6 lg:grid-cols-[1fr_360px]">
      <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 transition-colors">
        <p className="text-xs font-bold uppercase text-blue-700 dark:text-blue-400">{caseItem.case_number}</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{caseItem.title}{documentFilename ? ` - Chatting about ${documentFilename}` : ''}</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Querying as {user.role.replaceAll('_',' ')}.</p>
        <form onSubmit={ask} className="mt-6 flex gap-2">
          <input 
            value={question} 
            onChange={e=>setQuestion(e.target.value)} 
            placeholder="Ask a question about case evidence…" 
            className="grow rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
          />
          <button type="submit" disabled={busy} className="rounded-lg bg-blue-700 px-4 flex items-center gap-2 text-white hover:bg-blue-800 disabled:opacity-50 transition-colors">
            {busy ? <span className="animate-pulse">Thinking...</span> : <Send className="w-5"/>}
          </button>
        </form>
        {error && <p className="mt-4 text-sm text-red-700 dark:text-red-400">{error}</p>}
        {result && (
          <article className="mt-6 rounded-xl border border-blue-100 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-900/20 p-5 transition-colors">
            <p className="text-xs font-bold uppercase text-blue-700 dark:text-blue-400">Server response</p>
            <div className="mt-2 text-sm leading-6 text-slate-900 dark:text-slate-200 prose prose-slate prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{result.answer}</ReactMarkdown>
            </div>
          </article>
        )}
      </section>
      
      <aside className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 transition-colors">
        <h2 className="flex gap-2 font-bold text-slate-900 dark:text-white">
          <ShieldCheck className="w-5 text-emerald-600 dark:text-emerald-500"/>
          Retrieval gateway
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Real authorization results from the backend.</p>
        
        {result && (
          <>
            <h3 className="mt-5 text-xs font-bold text-emerald-700 dark:text-emerald-500">AUTHORIZED ({result.authorized_chunks.length})</h3>
            {result.authorized_chunks.map(c=>(
              <div key={c.chunk_id} className="mt-2 rounded border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-900/20 p-2 text-xs transition-colors">
                <b className="text-slate-900 dark:text-slate-200">{c.sensitivity_level}</b>
                <p className="mt-1 text-slate-700 dark:text-slate-300">{c.text}</p>
              </div>
            ))}
            
            <h3 className="mt-5 flex gap-1 text-xs font-bold text-rose-700 dark:text-rose-500">
              <Lock className="w-4"/>FILTERED ({result.filtered_chunks.length})
            </h3>
            {result.filtered_chunks.map(c=>(
              <div key={c.chunk_id} className="mt-2 rounded border border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-900/20 p-2 text-xs transition-colors">
                <b className="text-slate-900 dark:text-slate-200">{c.sensitivity_level}</b>
                <p className="mt-1 text-slate-700 dark:text-slate-300">{c.reason}</p>
              </div>
            ))}
          </>
        )}
      </aside>
    </div>
  );
}
