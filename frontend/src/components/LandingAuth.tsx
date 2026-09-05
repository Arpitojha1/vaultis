import { useState, type FormEvent } from 'react'; import { LockKeyhole, Shield, ArrowLeft } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { api } from '../api/client';

export function LandingAuth({ onLoginSuccess, error, onBack }: { onLoginSuccess: (result: any) => Promise<void>; error: string; onBack: () => void }) {
  const [username,setUsername]=useState(''); 
  const [password,setPassword]=useState(''); 
  const [mfaCode, setMfaCode]=useState('');
  const [challengeToken, setChallengeToken]=useState('');
  const [busy,setBusy]=useState(false); 
  const [localError, setLocalError] = useState('');

  const submit=async(e:FormEvent)=>{
    e.preventDefault();
    setBusy(true);
    setLocalError('');
    try{
      if (challengeToken) {
        const result = await api.verifyMfa(challengeToken, mfaCode);
        await onLoginSuccess(result);
      } else {
        const result = await api.login(username, password);
        if (result.mfa_required) {
          setChallengeToken(result.challenge_token);
        } else {
          await onLoginSuccess(result);
        }
      }
    }catch(err: any){
      setLocalError(err.message || 'Login failed');
    }finally{
      setBusy(false);
    }
  }; 

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
          <h1 className="text-2xl font-semibold tracking-tight">{challengeToken ? 'Two-Factor Authentication' : 'Client Portal'}</h1>
          <p className="mt-2 text-slate-600">{challengeToken ? 'Enter the 6-digit code from your authenticator app.' : 'Sign in to access your secure case vault.'}</p>
          
          <form onSubmit={submit} className="mt-8 space-y-5">
            {(error || localError) && <p className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-100">{error || localError}</p>}
            
            {!challengeToken ? (
              <>
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
              </>
            ) : (
              <Input 
                label="Authentication Code" 
                required 
                autoComplete="one-time-code" 
                value={mfaCode} 
                onChange={e=>setMfaCode(e.target.value)} 
                placeholder="000000"
              />
            )}
            
            <div className="pt-2">
              <Button type="submit" fullWidth disabled={busy}>
                {busy ? (challengeToken ? 'Verifying…' : 'Signing in…') : (challengeToken ? 'Verify Code' : 'Sign in')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
