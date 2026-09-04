import { Activity, Layers, Lock, LogOut, Shield, Sun, Moon } from 'lucide-react';
import type { ApiCase, User } from '../types';

export function Navbar({ 
  user, 
  screen, 
  currentCase, 
  onNavigate, 
  onLogout,
  isDark,
  toggleDark
}: { 
  user: User; 
  screen: string; 
  currentCase: ApiCase | null; 
  onNavigate: (screen: 'dashboard'|'chat'|'audit'|'prepare')=>void; 
  onLogout:()=>void;
  isDark?: boolean;
  toggleDark?: () => void;
}) { 
  const label = user.role.replaceAll('_',' '); 
  
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 transition-colors duration-200">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <button onClick={()=>onNavigate('dashboard')} className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
          <span className="rounded-lg bg-blue-700 p-2 text-white"><Shield className="w-5"/></span>
          VAULTIS
        </button>
        <nav className="flex gap-1">
          <button onClick={()=>onNavigate('dashboard')} className={`rounded px-3 py-2 text-xs font-semibold transition-colors ${screen==='dashboard'?'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400':'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'}`}>
            <Layers className="mr-1 inline w-4"/>Cases
          </button>
          {currentCase && (
            <button onClick={()=>onNavigate('chat')} className={`rounded px-3 py-2 text-xs font-semibold transition-colors ${screen==='chat'?'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400':'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'}`}>
              <Lock className="mr-1 inline w-4"/>Assistant
            </button>
          )}
          <button onClick={()=>onNavigate('audit')} className={`rounded px-3 py-2 text-xs font-semibold transition-colors ${screen==='audit'?'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400':'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'}`}>
            <Activity className="mr-1 inline w-4"/>Audit
          </button>
        </nav>
        <div className="flex items-center gap-3">
          {toggleDark && (
            <button 
              onClick={toggleDark} 
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
              title="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}
          <span className="hidden text-right text-xs sm:block">
            <strong className="block text-slate-900 dark:text-slate-200">{user.username}</strong>
            <span className="capitalize text-slate-500 dark:text-slate-400">{label}</span>
          </span>
          <button onClick={onLogout} title="Log out" className="rounded p-2 text-slate-500 hover:bg-red-50 hover:text-red-700 dark:text-slate-400 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors">
            <LogOut className="w-4"/>
          </button>
        </div>
      </div>
    </header>
  );
}
