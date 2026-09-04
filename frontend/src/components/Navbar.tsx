import { Activity, Layers, Lock, LogOut, Shield, FolderPlus, Sun, Moon } from 'lucide-react';
import type { ApiCase, User } from '../types';

export function Navbar({ user, screen, currentCase, onNavigate, onLogout, isDarkMode, onToggleDark }: {
  user: User;
  screen: string;
  currentCase: ApiCase | null;
  onNavigate: (screen: 'dashboard' | 'chat' | 'audit' | 'prepare') => void;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleDark: () => void;
}) {
  const label = user.role.replaceAll('_', ' ');
  const navBtn = (active: boolean) =>
    `rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
      active
        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
    }`;

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 font-bold text-slate-900 dark:text-white"
        >
          <span className="rounded-lg bg-slate-900 dark:bg-blue-600 p-2 text-white">
            <Shield className="w-5" strokeWidth={1.5} />
          </span>
          VAULTIS
        </button>

        {/* Nav links */}
        <nav className="flex gap-1">
          <button onClick={() => onNavigate('prepare')} className={navBtn(screen === 'prepare')}>
            <FolderPlus className="mr-1.5 inline w-4" strokeWidth={1.5} />Prepare Workspace
          </button>
          <button onClick={() => onNavigate('dashboard')} className={navBtn(screen === 'dashboard' || screen === 'documents')}>
            <Layers className="mr-1.5 inline w-4" strokeWidth={1.5} />Cases
          </button>
          {currentCase && (
            <button onClick={() => onNavigate('chat')} className={navBtn(screen === 'chat' || screen === 'doc-chat')}>
              <Lock className="mr-1.5 inline w-4" strokeWidth={1.5} />Assistant
            </button>
          )}
          <button onClick={() => onNavigate('audit')} className={navBtn(screen === 'audit')}>
            <Activity className="mr-1.5 inline w-4" strokeWidth={1.5} />Audit
          </button>
        </nav>

        {/* Right side: user info + dark toggle + logout */}
        <div className="flex items-center gap-2">
          <span className="hidden text-right text-xs sm:block">
            <strong className="block text-slate-900 dark:text-white">{user.username}</strong>
            <span className="capitalize text-slate-500 dark:text-slate-400">{label}</span>
          </span>

          {/* Dark mode toggle */}
          <button
            onClick={onToggleDark}
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className="rounded-full p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={onLogout}
            title="Log out"
            className="rounded-md p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <LogOut className="w-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </header>
  );
}
