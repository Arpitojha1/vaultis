import { useState, type FormEvent } from 'react'; 
import { LockKeyhole, Shield, Sun, Moon } from 'lucide-react';

export function LandingAuth({ 
  onLogin, 
  error,
  isDark,
  toggleDark
}: { 
  onLogin: (username: string, password: string) => Promise<void>; 
  error: string;
  isDark?: boolean;
  toggleDark?: () => void;
}) { 
  const [username,setUsername]=useState(''); 
  const [password,setPassword]=useState(''); 
  const [busy,setBusy]=useState(false); 
  
  const submit=async(e:FormEvent)=>{
    e.preventDefault();
    setBusy(true);
    try{
      await onLogin(username,password)
    }finally{
      setBusy(false)
    }
  }; 
  
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white grid place-items-center p-4 transition-colors duration-200 relative">
      {toggleDark && (
        <button 
          onClick={toggleDark} 
          className="absolute top-4 right-4 rounded-full p-2 text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          title="Toggle theme"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      )}
      <div className="grid max-w-5xl gap-10 lg:grid-cols-2">
        <section className="self-center">
          <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
            <Shield className="w-9 h-9"/>
            <span className="font-bold tracking-widest">VAULTIS</span>
          </div>
          <h1 className="mt-6 text-4xl font-bold leading-tight text-slate-900 dark:text-white">
            Permission-checked evidence, before AI sees it.
          </h1>
          <p className="mt-4 text-slate-600 dark:text-slate-400">
            A cryptographically audited case vault with server-enforced retrieval controls.
          </p>
        </section>
        <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 p-7 shadow-2xl transition-colors duration-200">
          <LockKeyhole className="text-blue-600 dark:text-blue-400"/>
          <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Secure vault sign in</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your authenticated server role determines access.</p>
          {error && <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-600 border border-red-200 dark:border-red-900 dark:bg-red-950 dark:text-red-300">{error}</p>}
          <label className="mt-5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Username
            <input required autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400 transition-colors"/>
          </label>
          <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Password
            <input required type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400 transition-colors"/>
          </label>
          <button disabled={busy} className="mt-6 w-full rounded-lg bg-blue-600 p-2.5 font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {busy?'Signing in…':'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
