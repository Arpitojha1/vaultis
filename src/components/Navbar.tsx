import { useState } from 'react';
import { Shield, Lock, Scale, ChevronDown, Check, LogOut, FileText, Activity, Layers, ArrowLeft } from 'lucide-react';
import { Role, User, CaseItem } from '../types';
import { MOCK_USERS } from '../mockData';

interface NavbarProps {
  currentUser: User;
  currentScreen: 'dashboard' | 'chat' | 'audit';
  currentCase: CaseItem | null;
  onNavigate: (screen: 'dashboard' | 'chat' | 'audit') => void;
  onRoleSwitch: (role: Role) => void;
  onLogout: () => void;
}

export const Navbar = ({
  currentUser,
  currentScreen,
  currentCase,
  onNavigate,
  onRoleSwitch,
  onLogout,
}: NavbarProps) => {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const rolesList: Role[] = ['Prosecutor', 'Defense Lawyer', 'Investigating Officer', 'Judge'];

  const getRoleBadgeColor = (role: Role) => {
    switch (role) {
      case 'Prosecutor':
        return 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-500/20';
      case 'Defense Lawyer':
        return 'bg-amber-50 text-amber-800 border-amber-200 ring-1 ring-amber-500/20';
      case 'Investigating Officer':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/20';
      case 'Judge':
        return 'bg-purple-50 text-purple-700 border-purple-200 ring-1 ring-purple-500/20';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand & Breadcrumb */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center space-x-2.5 focus:outline-hidden group text-left cursor-pointer"
              id="nav-brand-btn"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-700 flex items-center justify-center text-white shadow-sm shadow-blue-500/30 group-hover:bg-blue-800 transition-colors">
                <Shield className="w-5 h-5 fill-blue-500/20 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-lg tracking-tight text-slate-900 group-hover:text-blue-700 transition-colors">
                    VAULTIS
                  </span>
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-600 border border-slate-200">
                    Vault OS
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium leading-none">
                  Permission-Enforced AI
                </span>
              </div>
            </button>

            {/* Case Breadcrumb */}
            {currentCase && currentScreen === 'chat' && (
              <div className="hidden md:flex items-center space-x-2 pl-4 border-l border-slate-200">
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="flex items-center text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors py-1 px-2 rounded-md hover:bg-slate-100"
                  id="nav-back-to-cases-btn"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  All Cases
                </button>
                <span className="text-slate-300">/</span>
                <div className="flex items-center space-x-1.5 bg-slate-100 py-1 px-2.5 rounded-md border border-slate-200/80">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-xs font-semibold text-slate-800">
                    {currentCase.caseNumber}
                  </span>
                  <span className="text-xs text-slate-500 truncate max-w-[160px] lg:max-w-[240px]">
                    — {currentCase.title}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Center: Navigation tabs */}
          <nav className="hidden sm:flex items-center space-x-1">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                currentScreen === 'dashboard'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
              id="nav-tab-cases"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Case Vaults</span>
            </button>

            {currentCase && (
              <button
                onClick={() => onNavigate('chat')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  currentScreen === 'chat'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                id="nav-tab-chat"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Investigation Assistant</span>
              </button>
            )}

            <button
              onClick={() => onNavigate('audit')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                currentScreen === 'audit'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
              id="nav-tab-audit"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Audit Chain</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </button>
          </nav>

          {/* Right: Quick Role Switcher + User Info */}
          <div className="flex items-center space-x-3">
            {/* Live Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all shadow-2xs hover:shadow-xs ${getRoleBadgeColor(
                  currentUser.role
                )}`}
                id="nav-role-switcher-btn"
                title="Switch role live to demonstrate permission boundaries"
              >
                <div className="flex items-center space-x-1.5">
                  <Scale className="w-3.5 h-3.5" />
                  <span className="font-semibold">{currentUser.role}</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 opacity-70 transition-transform ${roleMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {roleMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                  id="nav-role-dropdown-menu"
                >
                  <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Live Role Switcher (Demo Proof)
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Switch active credential to witness real-time RBAC filtering.
                    </p>
                  </div>
                  {rolesList.map((r) => {
                    const isSelected = r === currentUser.role;
                    const u = MOCK_USERS[r];
                    return (
                      <button
                        key={r}
                        onClick={() => {
                          onRoleSwitch(r);
                          setRoleMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                          isSelected ? 'bg-blue-50/60' : ''
                        }`}
                      >
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs font-semibold text-slate-900">
                              {r}
                            </span>
                            {isSelected && (
                              <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.2 rounded-sm">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500">
                            {u.name} • {u.badgeNumber}
                          </span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* User Avatar & Logout */}
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-800 leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {currentUser.badgeNumber}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                title="Logout & return to Auth"
                id="nav-logout-btn"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
