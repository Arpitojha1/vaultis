import { useState, type FormEvent } from 'react';
import { LockKeyhole, Shield, ArrowLeft, Sun, Moon } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

export function LandingAuth({ onLogin, error, onBack, isDarkMode, onToggleDark }: {
  onLogin: (username: string, password: string) => Promise<void>;
  error: string;
  onBack: () => void;
  isDarkMode: boolean;
  onToggleDark: () => void;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try { await onLogin(username, password); } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to home
        </button>
        <button
          onClick={onToggleDark}
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          className="rounded-full p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200"
        >
          {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      {/* Login card */}
      <div className="grid place-items-center p-4 min-h-[calc(100vh-64px)]">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-8 shadow-2xl dark:shadow-slate-950 transition-colors">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <span className="rounded-xl bg-slate-900 dark:bg-blue-600 p-2.5 text-white">
                <Shield className="w-5 h-5" strokeWidth={1.5} />
              </span>
              <span className="font-bold tracking-wide text-xl text-slate-900 dark:text-white">VAULTIS</span>
            </div>

            {/* Heading */}
            <div className="flex items-center gap-2.5 mb-1">
              <LockKeyhole className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" strokeWidth={1.5} />
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Secure Access</h1>
            </div>
            <p className="mt-1 text-slate-500 dark:text-slate-400 text-sm">
              Authenticate your identity to access the case vault.
            </p>

            <form onSubmit={submit} className="mt-8 space-y-5">
              {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700/50">
                  {error}
                </div>
              )}
              <Input
                label="Username"
                required
                autoComplete="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
              <Input
                label="Password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-lg bg-slate-900 dark:bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-slate-700 dark:hover:bg-blue-500 disabled:opacity-50 transition-all duration-200 shadow-md"
                >
                  {busy ? 'Authenticating…' : 'Sign in to Vault'}
                </button>
              </div>
            </form>

            <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
              SIH26190 · Ministry of Home Affairs
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
