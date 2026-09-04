import { useState } from 'react'; 
import { Activity, ArrowRight, FolderLock, Search } from 'lucide-react'; 
import type { ApiCase, User } from '../types';

export function CaseDashboard({ cases, user, onSelect, onAudit }: { cases:ApiCase[]; user:User; onSelect:(item:ApiCase)=>void; onAudit:()=>void }) { 
  const [query,setQuery]=useState(''); 
  const visible=cases.filter(c=>(c.case_number+c.title).toLowerCase().includes(query.toLowerCase())); 
  
  return (
    <div className="mx-auto max-w-7xl p-6">
      <section className="flex flex-wrap justify-between gap-4 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 transition-colors">
        <div>
          <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Authenticated operator</p>
          <h1 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
            {user.username} <span className="ml-2 text-sm font-medium text-blue-700 dark:text-blue-400">{user.role.replaceAll('_',' ')}</span>
          </h1>
        </div>
        <button onClick={onAudit} className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <Activity className="mr-1 inline w-4"/>Audit chain
        </button>
      </section>
      
      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Accessible case vaults</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Data is scoped by your active server session.</p>
        </div>
        <label className="relative">
          <Search className="absolute left-3 top-3 w-4 text-slate-400"/>
          <input 
            value={query} 
            onChange={e=>setQuery(e.target.value)} 
            placeholder="Search cases" 
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
          />
        </label>
      </div>
      
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {visible.map(item => (
          <button 
            key={item.case_id} 
            onClick={()=>onSelect(item)} 
            className="group rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 text-left hover:border-blue-500 hover:shadow dark:hover:border-blue-500 transition-all"
          >
            <FolderLock className="text-blue-700 dark:text-blue-400"/>
            <p className="mt-4 font-mono text-xs font-bold text-blue-700 dark:text-blue-400">{item.case_number}</p>
            <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{item.title}</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{item.status}</p>
            <span className="mt-5 block text-sm font-bold text-blue-700 dark:text-blue-400 group-hover:underline">
              View documents <ArrowRight className="inline w-4"/>
            </span>
          </button>
        ))}
      </div>
      
      {!visible.length && <p className="mt-8 text-center text-slate-500 dark:text-slate-400">No accessible cases match your search.</p>}
    </div>
  );
}
