import { useEffect, useState } from 'react'; 
import { CheckCircle2, RefreshCw, ShieldAlert, Activity, ArrowDown } from 'lucide-react'; 
import { api } from '../api/client'; 
import type { ApiAuditRecord } from '../types';

export function AuditLogScreen() { 
  const [records,setRecords]=useState<ApiAuditRecord[]>([]);
  const [result,setResult]=useState<{valid:boolean;records_checked:number;broken_at_record:number|null}|null>(null);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  
  const load=async()=>{
    setBusy(true);setError('');
    try{
      const data = await api.getAuditEvents();
      // Ensure data is an array
      setRecords(Array.isArray(data) ? data : (data as any).items || []);
    }catch(e){
      setError(e instanceof Error?e.message:'Unable to load audit events');
    }finally{
      setBusy(false);
    }
  };
  
  useEffect(()=>{void load()},[]);
  
  const verify=async()=>{
    setBusy(true);setError('');
    try{
      const res = await api.verifyChain();
      setResult(res);
      await load();
    }catch(e){
      setError(e instanceof Error?e.message:'Unable to verify chain');
    }finally{
      setBusy(false);
    }
  };
  
  const tamper=async(id:number)=>{
    setBusy(true);setError('');
    try{
      await api.tamperEvent(id);
      await verify();
    }catch(e){
      setError(e instanceof Error?e.message:'Tamper demonstration unavailable');
    }finally{
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 border-b border-slate-200 pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <Activity className="text-slate-400" />
            Cryptographic Audit Chain
          </h1>
          <p className="mt-3 text-base text-slate-500 max-w-xl">
            A verifiable, tamper-evident ledger of all access and modifications within the Vaultis system.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={load} disabled={busy} className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} strokeWidth={1.5}/> Refresh
          </button>
          <button onClick={verify} disabled={busy} className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors flex items-center gap-2">
            Verify integrity
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-8 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-red-500" />
          {error}
        </div>
      )}
      
      {result && (
        <div className={`mb-10 flex items-center gap-3 rounded-lg border p-5 text-sm shadow-sm ${result.valid?'border-emerald-200 bg-emerald-50 text-emerald-900':'border-red-200 bg-red-50 text-red-900'}`}>
          {result.valid ? <CheckCircle2 className="w-6 h-6 text-emerald-600"/> : <ShieldAlert className="w-6 h-6 text-red-600"/>}
          <div>
            <h3 className="font-semibold text-base mb-0.5">{result.valid ? 'Chain integrity verified' : 'Integrity compromise detected'}</h3>
            <p>{result.valid ? `${result.records_checked} consecutive records passed cryptographic validation.` : `Chain broken at record #${result.broken_at_record}. Subsequent records cannot be trusted.`}</p>
          </div>
        </div>
      )}
      
      <div className="relative">
        {/* Timeline line */}
        {records.length > 0 && (
          <div className="absolute left-8 top-4 bottom-4 w-px bg-slate-200 -z-10" />
        )}
        
        <div className="space-y-6">
          {records.map((record, index) => {
            const isCompromised = result && !result.valid && result.broken_at_record !== null && record.record_id >= result.broken_at_record;
            
            return (
              <article key={record.record_id} className="relative flex gap-6">
                <div className="flex-none pt-1">
                  <div className={`w-16 text-right text-xs font-mono font-medium ${isCompromised ? 'text-red-500' : 'text-slate-400'}`}>
                    #{record.record_id}
                  </div>
                </div>
                
                <div className="flex-none pt-1.5 relative">
                  <div className={`w-3 h-3 rounded-full outline outline-4 outline-slate-50 ${isCompromised ? 'bg-red-500' : 'bg-slate-300'}`} />
                </div>
                
                <div className={`flex-1 rounded-xl border p-5 shadow-sm transition-all ${isCompromised ? 'border-red-200 bg-white' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                    <div>
                      <h3 className={`font-semibold text-base capitalize ${isCompromised ? 'text-red-900' : 'text-slate-900'}`}>
                        {record.event_type.replaceAll('_', ' ')}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 font-medium">
                        {new Date(record.timestamp).toLocaleString()} · Actor: {record.actor_user_id ?? 'System'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-[10px] text-slate-400 uppercase tracking-widest mb-1">Record Hash</div>
                      <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">
                        {record.record_hash.slice(0, 24)}...
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 rounded-md p-4 border border-slate-100">
                    <pre className="overflow-x-auto text-xs text-slate-600 font-mono leading-relaxed">
                      {JSON.stringify(record.payload, null, 2)}
                    </pre>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                    <div className="font-mono text-[10px] text-slate-400">
                      Prev: {record.prev_hash === '0000000000000000000000000000000000000000000000000000000000000000' ? 'Genesis' : record.prev_hash.slice(0, 12) + '...'}
                    </div>
                    <button onClick={()=>tamper(record.record_id)} disabled={busy} className="text-xs font-medium text-red-600 hover:text-red-800 transition-colors">
                      Tamper payload
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
          
          {!records.length && !busy && (
            <div className="text-center py-20 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
              <p className="text-slate-500 font-medium">No audit records available in the current ledger.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
