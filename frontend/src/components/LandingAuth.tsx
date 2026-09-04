import { useState, type FormEvent } from 'react'; import { LockKeyhole, Shield, ArrowLeft } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
export function LandingAuth({ onLogin, error, onBack }: { onLogin: (username: string, password: string) => Promise<void>; error: string; onBack: () => void }) {
  const [username,setUsername]=useState(''); const [password,setPassword]=useState(''); const [busy,setBusy]=useState(false); const submit=async(e:FormEvent)=>{e.preventDefault();setBusy(true);try{await onLogin(username,password)}finally{setBusy(false)}}; 
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 grid place-items-center p-4">
      <div className="w-full max-w-md">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </button>
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
          <div className="flex items-center gap-3 text-slate-900 mb-8">
            <Shield className="w-8 h-8" strokeWidth={1.5} />
            <span className="font-semibold tracking-wide text-lg">VAULTIS</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Client Portal</h1>
          <p className="mt-2 text-slate-600">Sign in to access your secure case vault.</p>
          
          <form onSubmit={submit} className="mt-8 space-y-5">
            {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-100">{error}</p>}
            
            <Input 
              label="Username" 
              required 
              autoComplete="username" 
              value={username} 
              onChange={e=>setUsername(e.target.value)} 
            />
            
            <Input 
              label="Password" 
              type="password" 
              required 
              autoComplete="current-password" 
              value={password} 
              onChange={e=>setPassword(e.target.value)} 
            />
            
            <div className="pt-2">
              <Button type="submit" fullWidth disabled={busy}>
                {busy ? 'Signing in…' : 'Sign in'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
