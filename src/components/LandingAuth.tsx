import React, { useState } from 'react';
import { Shield, Lock, Activity, Scale, CheckCircle2, ArrowRight, ShieldCheck, EyeOff, FileKey, Sparkles } from 'lucide-react';
import { Role } from '../types';
import { MOCK_USERS } from '../mockData';

interface LandingAuthProps {
  onLogin: (role: Role, customName?: string) => void;
}

export const LandingAuth = ({ onLogin }: LandingAuthProps) => {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [selectedRole, setSelectedRole] = useState<Role>('Prosecutor');
  const [email, setEmail] = useState('e.sterling@stateattorney.gov');
  const [password, setPassword] = useState('••••••••••••');
  const [name, setName] = useState('ADA Eleanor Sterling');

  const handleRoleChange = (role: Role) => {
    setSelectedRole(role);
    const mockUser = MOCK_USERS[role];
    setEmail(mockUser.email);
    setName(mockUser.name);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(selectedRole, name);
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-500 selection:text-white">
      {/* Top bar branding */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Shield className="w-5 h-5 fill-blue-400/20 stroke-[2.3]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-white">VAULTIS</span>
                <span className="text-[10px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Legal-Tech AI
                </span>
              </div>
              <p className="text-xs text-slate-400">Cryptographically Audited Case Vault</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="hidden sm:inline-flex items-center text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-2"></span>
              Air-Gapped Zero-Leak Node
            </span>
            <button
              onClick={() => onLogin('Prosecutor')}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/30 flex items-center space-x-1.5 cursor-pointer"
              id="landing-instant-demo-btn"
            >
              <span>Instant Demo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero & Auth Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 grow flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Pitch & Value Prop */}
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-blue-950/80 border border-blue-800/60 text-blue-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Built for High-Stakes Evidentiary Proceedings</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                Every answer,{' '}
                <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 via-blue-300 to-indigo-300">
                  permission-checked
                </span>{' '}
                before the AI ever sees it.
              </h1>
              <p className="text-base sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed">
                Vaultis decouples document clearance from model prompts. Confidential informant
                identities, sealed wiretaps, and work-product privileges are filtered deterministically
                at the retrieval gate — preventing AI hallucinations and adversarial leaks.
              </p>
            </div>

            {/* 3-Icon Feature Strip (Mandated by Prompt) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 backdrop-blur-xs space-y-2 hover:border-slate-600 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Scale className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-white">Role-Based Access</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Strict RBAC boundaries: Prosecutors, Defense, and Investigators receive distinct
                  factual contexts from the same vault.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 backdrop-blur-xs space-y-2 hover:border-slate-600 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-white">Tamper-Evident Ledger</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Cryptographic hash chains seal every query, chunk disclosure, and upload with
                  real-time Merkle integrity verification.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 backdrop-blur-xs space-y-2 hover:border-slate-600 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-white">Local AI Enclave</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Zero data leaves the machine. Sensitive grand jury transcripts and witness dossiers
                  remain in your offline vault.
                </p>
              </div>
            </div>

            {/* Fast 1-Click Demo Presets for Hackathon Judges */}
            <div className="pt-2 border-t border-slate-800">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                <span>1-Click Hackathon Presets (Experience the Contrast)</span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  onClick={() => onLogin('Prosecutor')}
                  className="px-3 py-2 rounded-lg bg-blue-900/40 border border-blue-700/60 hover:bg-blue-800/60 text-left transition-all group cursor-pointer"
                  id="preset-prosecutor-btn"
                >
                  <span className="text-[10px] font-mono text-blue-400 block font-bold">L3 CLEARANCE</span>
                  <span className="text-xs font-bold text-white group-hover:text-blue-200">
                    Prosecutor
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">Unsealed wiretaps</span>
                </button>

                <button
                  onClick={() => onLogin('Defense Lawyer')}
                  className="px-3 py-2 rounded-lg bg-amber-950/40 border border-amber-700/60 hover:bg-amber-900/60 text-left transition-all group cursor-pointer"
                  id="preset-defense-btn"
                >
                  <span className="text-[10px] font-mono text-amber-400 block font-bold">L1 RULE 16</span>
                  <span className="text-xs font-bold text-white group-hover:text-amber-200">
                    Defense Lawyer
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">Informants filtered</span>
                </button>

                <button
                  onClick={() => onLogin('Investigating Officer')}
                  className="px-3 py-2 rounded-lg bg-emerald-950/40 border border-emerald-700/60 hover:bg-emerald-900/60 text-left transition-all group cursor-pointer"
                  id="preset-investigator-btn"
                >
                  <span className="text-[10px] font-mono text-emerald-400 block font-bold">L4 SENSITIVE</span>
                  <span className="text-xs font-bold text-white group-hover:text-emerald-200">
                    Investigator
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">Raw police logs</span>
                </button>

                <button
                  onClick={() => onLogin('Judge')}
                  className="px-3 py-2 rounded-lg bg-purple-950/40 border border-purple-700/60 hover:bg-purple-900/60 text-left transition-all group cursor-pointer"
                  id="preset-judge-btn"
                >
                  <span className="text-[10px] font-mono text-purple-400 block font-bold">L5 IN-CAMERA</span>
                  <span className="text-xs font-bold text-white group-hover:text-purple-200">
                    Judge
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">Full court review</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Mock Auth Box */}
          <div className="lg:col-span-5">
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
              <div className="flex items-center justify-between pb-6 border-b border-slate-700/80 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {authMode === 'login' ? 'Secure Vault Sign In' : 'Register Credential'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {authMode === 'login'
                      ? 'Select official role to establish session RBAC'
                      : 'Mock registration for court & defense registry'}
                  </p>
                </div>

                <div className="flex bg-slate-900/80 p-1 rounded-lg border border-slate-700">
                  <button
                    onClick={() => setAuthMode('login')}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                      authMode === 'login'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    id="auth-toggle-login"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => setAuthMode('signup')}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                      authMode === 'signup'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    id="auth-toggle-signup"
                  >
                    Sign Up
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-900/90 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-hidden focus:border-blue-500 transition-colors"
                      placeholder="e.g. ADA Eleanor Sterling"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Institutional Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-hidden focus:border-blue-500 transition-colors"
                    placeholder="name@agency.gov"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Security Passkey / Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-hidden focus:border-blue-500 transition-colors font-mono"
                    placeholder="••••••••••••"
                    required
                  />
                </div>

                {/* Role Selector Dropdown (Mandated by Prompt) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Operational Role (Drives RBAC Filtering)</span>
                    <span className="text-[10px] text-blue-400 font-mono">Demo Determinant</span>
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => handleRoleChange(e.target.value as Role)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-hidden focus:border-blue-500 transition-colors cursor-pointer font-medium"
                    id="auth-role-select"
                  >
                    <option value="Prosecutor">Prosecutor (Full Government Work Product)</option>
                    <option value="Defense Lawyer">Defense Lawyer (Rule 16 Redacted Discovery)</option>
                    <option value="Investigating Officer">Investigating Officer (Law Enforcement Sensitive)</option>
                    <option value="Judge">Judge (In-Camera Comprehensive Oversight)</option>
                  </select>
                </div>

                {/* Role description badge */}
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex items-start space-x-2.5">
                  <FileKey className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-200">
                      Active Clearance:{' '}
                      <span className="text-blue-300 font-mono">{MOCK_USERS[selectedRole].clearanceLevel}</span>
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Session tokens will cryptographically bind to this role for hash-chain auditing.
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 cursor-pointer mt-2"
                  id="auth-submit-btn"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {authMode === 'login' ? `Authenticate as ${selectedRole}` : `Create & Authorize ${selectedRole}`}
                  </span>
                </button>
              </form>

              <div className="mt-4 pt-4 border-t border-slate-700/60 text-center">
                <p className="text-[11px] text-slate-400">
                  Mock authentication for demonstration. No credentials transmitted over the public web.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Vaultis Cryptographic Legal Enclave • Zero-Leak AI Architecture</span>
          <span className="font-mono text-[11px] text-slate-400">
            Hash Ledger: SHA-256 Merkle Chain Active
          </span>
        </div>
      </footer>
    </div>
  );
};
