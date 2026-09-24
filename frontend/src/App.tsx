import { useEffect, useState } from 'react';
import { api, setAuthToken, setUnauthorizedHandler } from './api/client';
import type { ApiCase, User } from './types';
import { LandingAuth } from './components/LandingAuth';
import { Navbar } from './components/Navbar';
import { CaseDashboard } from './components/CaseDashboard';
import { ChatScreen } from './components/ChatScreen';
import { AuditLogScreen } from './components/AuditLogScreen';
import { PrepareWorkspace } from './components/PrepareWorkspace';
import { DocumentList } from './components/DocumentList';
import { DocumentViewer } from './DocumentViewer';
import { LandingPage } from './components/LandingPage';

type Screen = 'dashboard' | 'chat' | 'audit' | 'prepare' | 'documents' | 'doc-chat';

const SESSION_KEY = 'vaultis-session';

function saveSession(token: string, user: User) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify({ token, user })); } catch { /* noop */ }
}
function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch { /* noop */ }
}
function loadSession(): { token: string; user: User } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { token: string; user: User };
  } catch { return null; }
}

export default function App() {
  // Rehydrate from localStorage synchronously so there's no flash
  const savedSession = loadSession();

  const [user, setUser] = useState<User | null>(savedSession?.user ?? null);
  const [cases, setCases] = useState<ApiCase[]>([]);
  const [caseItem, setCaseItem] = useState<ApiCase | null>(null);
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [docId, setDocId] = useState<string | null>(null);
  const [docFilename, setDocFilename] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [sessionRestored, setSessionRestored] = useState(false);

  // ── Dark mode: stored in localStorage, default = LIGHT ──────────────────
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('vaultis-theme');
      return stored === 'dark';
    } catch {
      return false;
    }
  });

  const toggleDark = () =>
    setIsDarkMode(prev => {
      const next = !prev;
      try { localStorage.setItem('vaultis-theme', next ? 'dark' : 'light'); } catch { /* noop */ }
      return next;
    });
  // ────────────────────────────────────────────────────────────────────────

  const logout = () => {
    clearSession();
    setAuthToken(null); setUser(null); setCases([]); setCaseItem(null);
    setScreen('dashboard'); setDocId(null); setDocFilename(null); setShowLogin(false);
  };

  useEffect(() => { setUnauthorizedHandler(logout); return () => setUnauthorizedHandler(null); }, []);

  const refreshCases = async () => {
    setLoading(true); setError('');
    try { const result = await api.getCases(); setCases(result); return result as ApiCase[]; }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to load cases'); return []; }
    finally { setLoading(false); }
  };

  // Restore session on mount: set token in API client and re-fetch cases
  useEffect(() => {
    if (savedSession) {
      setAuthToken(savedSession.token);
      // Fetch cases in background; if token is expired the 401 handler will logout
      refreshCases().finally(() => setSessionRestored(true));
    } else {
      setSessionRestored(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (username: string, password: string, challengeToken?: string, mfaCode?: string) => {
    setError('');
    try {
      let result;
      if (challengeToken && mfaCode) {
        result = await api.verifyMfa(challengeToken, mfaCode);
      } else {
        result = await api.login(username, password);
        if (result.mfa_required) {
          return { mfaRequired: true, challengeToken: result.challenge_token };
        }
      }
      setAuthToken(result.token);
      setUser(result.user);
      saveSession(result.token, result.user);
      const loaded = await refreshCases();
      setScreen(loaded.length ? 'dashboard' : 'prepare');
      return { mfaRequired: false };
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
      throw e;
    }
  };

  // ── The 'dark' class lives on this wrapper div — no DOM hacks needed ────
  // Tailwind's @custom-variant dark (&:is(.dark *)) targets descendants of .dark

  // Don't render anything until we've attempted session restore — avoids flash-of-landing
  if (!sessionRestored) {
    return (
      <div className={isDarkMode ? 'dark' : ''}>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-slate-600 dark:border-slate-700 dark:border-t-slate-300 animate-spin" />
            <p className="text-sm text-slate-400 dark:text-slate-500">Restoring session…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      {!user && !showLogin && (
        <LandingPage onLoginClick={() => setShowLogin(true)} isDarkMode={isDarkMode} onToggleDark={toggleDark} />
      )}
      {!user && showLogin && (
        <LandingAuth onLogin={login} error={error} onBack={() => setShowLogin(false)} isDarkMode={isDarkMode} onToggleDark={toggleDark} />
      )}
      {user && (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
          <Navbar user={user} screen={screen} currentCase={caseItem} onNavigate={setScreen} onLogout={logout} isDarkMode={isDarkMode} onToggleDark={toggleDark} />
          {loading && <p className="text-center p-3 text-sm text-slate-500 dark:text-slate-400">Loading vault data…</p>}
          {error && <p className="mx-auto mt-4 max-w-6xl rounded border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">{error}</p>}
          <main>
            {screen === 'prepare' && <PrepareWorkspace onReady={async item => { const loaded = await refreshCases(); setCases(loaded); setCaseItem(item); setScreen('dashboard'); }} />}
            {screen === 'dashboard' && <CaseDashboard cases={cases} user={user} onSelect={item => { setCaseItem(item); setScreen('documents'); }} onAudit={() => setScreen('audit')} onCaseDeleted={(id) => setCases(prev => prev.filter(c => c.case_id !== id))} />}
            {screen === 'chat' && caseItem && <ChatScreen caseItem={caseItem} user={user} />}
            {screen === 'audit' && <AuditLogScreen />}
            {screen === 'documents' && caseItem && <DocumentList caseId={caseItem.case_id} onViewDoc={(id) => setDocId(id)} onOpenDocChat={(id, name) => { setDocId(id); setDocFilename(name); setScreen('doc-chat'); }} />}
            {screen === 'doc-chat' && caseItem && <ChatScreen caseItem={caseItem} user={user} documentId={docId || undefined} documentFilename={docFilename || undefined} />}
          </main>
          {docId && screen === 'documents' && <DocumentViewer documentId={docId} onClose={() => setDocId(null)} />}
        </div>
      )}
    </div>
  );
}
