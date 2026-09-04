import { useEffect, useState } from 'react';
import { api, setAuthToken, setUnauthorizedHandler } from './api/client';
import type { ApiCase, User } from './types';
import { LandingAuth } from './components/LandingAuth'; import { Navbar } from './components/Navbar'; import { CaseDashboard } from './components/CaseDashboard'; import { ChatScreen } from './components/ChatScreen'; import { AuditLogScreen } from './components/AuditLogScreen'; import { PrepareWorkspace } from './components/PrepareWorkspace';
type Screen = 'dashboard' | 'chat' | 'audit' | 'prepare';
export default function App() {
  const [user, setUser] = useState<User | null>(null); const [cases, setCases] = useState<ApiCase[]>([]); const [caseItem, setCaseItem] = useState<ApiCase | null>(null); const [screen, setScreen] = useState<Screen>('dashboard'); const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  const logout = () => { setAuthToken(null); setUser(null); setCases([]); setCaseItem(null); setScreen('dashboard'); };
  useEffect(() => { setUnauthorizedHandler(logout); return () => setUnauthorizedHandler(null); }, []);
  const refreshCases = async () => { setLoading(true); setError(''); try { const result = await api.getCases(); setCases(result); return result as ApiCase[]; } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load cases'); return []; } finally { setLoading(false); } };
  const login = async (username: string, password: string) => { setError(''); const result = await api.login(username, password); setAuthToken(result.token); setUser(result.user); const loaded = await refreshCases(); setScreen(loaded.length ? 'dashboard' : 'prepare'); };
  if (!user) return <LandingAuth onLogin={login} error={error} />;
  return <div className="min-h-screen bg-slate-50 text-slate-900"><Navbar user={user} screen={screen} currentCase={caseItem} onNavigate={setScreen} onLogout={logout}/>{loading && <p className="text-center p-3 text-sm text-slate-500">Loading vault data…</p>}{error && <p className="mx-auto mt-4 max-w-6xl rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}<main>{screen === 'prepare' && <PrepareWorkspace onReady={async item => { const loaded = await refreshCases(); setCases(loaded); setCaseItem(item); setScreen('dashboard'); }}/>} {screen === 'dashboard' && <CaseDashboard cases={cases} user={user} onSelect={item=>{setCaseItem(item);setScreen('chat');}} onAudit={()=>setScreen('audit')}/>} {screen === 'chat' && caseItem && <ChatScreen caseItem={caseItem} user={user}/>} {screen === 'audit' && <AuditLogScreen/>}</main></div>;
}
