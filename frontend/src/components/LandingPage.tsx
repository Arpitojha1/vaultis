import { Shield, Lock, Search, FileText, CheckCircle2, Sun, Moon } from 'lucide-react';
import { Button } from './ui/Button';

export function LandingPage({ onLoginClick, isDarkMode, onToggleDark }: {
  onLoginClick: () => void;
  isDarkMode: boolean;
  onToggleDark: () => void;
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors">
      {/* Navigation */}
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors sticky top-0 z-20">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-3 text-slate-900 dark:text-white">
            <span className="rounded-lg bg-slate-900 dark:bg-blue-600 p-2 text-white">
              <Shield className="h-5 w-5" strokeWidth={1.5} />
            </span>
            <span className="font-bold tracking-wide text-lg">VAULTIS</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Dark mode toggle */}
            <button
              onClick={onToggleDark}
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="rounded-full p-2.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200"
            >
              {isDarkMode
                ? <Sun className="h-4 w-4" />
                : <Moon className="h-4 w-4" />
              }
            </button>
            <Button variant="primary" size="sm" onClick={onLoginClick}>Access Vault</Button>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative px-6 py-24 sm:py-36 lg:px-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex rounded-full px-4 py-1.5 text-sm font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 ring-1 ring-inset ring-blue-700/20 dark:ring-blue-400/30">
              Smart India Hackathon 2026 · SIH26190 · MHA
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-6xl text-balance leading-tight">
              Secure Digital Document Management System
            </h1>
            <p className="mt-8 text-lg leading-8 text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              A tamper-proof digital repository for sensitive legal records, powered by 100% locally hosted AI — zero data exfiltration, complete chain of custody.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-4">
              <button
                onClick={onLoginClick}
                className="rounded-lg bg-slate-900 dark:bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white hover:bg-slate-700 dark:hover:bg-blue-500 shadow-lg shadow-slate-900/20 dark:shadow-blue-900/40 transition-all duration-200 hover:scale-105"
              >
                Authenticate Identity →
              </button>
            </div>
          </div>
        </section>

        {/* Core Capabilities */}
        <section className="py-24 sm:py-32 px-6 lg:px-8 mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Core Capabilities</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Architected to the rigorous demands of law enforcement and judicial bodies per MHA guidelines.</p>
          </div>
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                icon: <Lock className="h-6 w-6" strokeWidth={1.5} />,
                title: 'Role-Based Access Control',
                desc: 'Tight permission layers for investigating officers, prosecutors, defense lawyers, and judges. The AI query engine automatically filters results based on your authorization level.',
              },
              {
                icon: <Search className="h-6 w-6" strokeWidth={1.5} />,
                title: 'Air-Gapped AI Search',
                desc: 'Powered by local DeepSeek-R1 via Ollama — intelligent semantic search over encrypted evidence without sending any classified data to third-party cloud servers.',
              },
              {
                icon: <Shield className="h-6 w-6" strokeWidth={1.5} />,
                title: 'Tamper Evidence & Audit',
                desc: 'Immutable cryptographically hashed audit ledgers tracking every upload, access, and AI query, maintaining an unbroken and verifiable chain of custody.',
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="group">
                <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 mb-6 transition-all duration-200 group-hover:scale-110">
                  {icon}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">{title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Security Architecture */}
        <section className="bg-slate-900 dark:bg-slate-950 border-t border-slate-800 py-24 sm:py-32 px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-white">Military-Grade, Air-Gapped Architecture</h2>
                <p className="mt-6 text-lg text-slate-300 leading-relaxed">
                  Vaultis runs entirely on your infrastructure. Documents are encrypted at rest with AES-256-GCM, and the full AI inference stack (DeepSeek-R1 via Ollama + Docker) operates with no internet dependency.
                </p>
                <div className="mt-8 grid grid-cols-2 gap-3">
                  {['AES-256-GCM Encryption', 'Zero Data Exfiltration', 'Blockchain-inspired Ledger', 'DeepSeek-R1 Local AI', 'RBAC with RAG filtering', 'Indian Evidence Act compliant'].map(f => (
                    <div key={f} className="flex items-center gap-3 text-slate-300">
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-500" />
                      <span className="text-sm">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-slate-800 dark:bg-slate-900 p-10 rounded-2xl border border-slate-700">
                <blockquote className="text-slate-200 text-lg leading-relaxed font-medium italic">
                  "By keeping the AI model entirely local via Docker and Ollama, we guarantee adherence to the Indian Evidence Act regarding digital privacy — no third-party APIs ever process unencrypted data."
                </blockquote>
                <div className="mt-6 flex items-center gap-4">
                  <div className="h-10 w-10 bg-blue-600 flex items-center justify-center rounded-full">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-semibold">Legal Compliance</div>
                    <div className="text-slate-400 text-sm">Data Localization & Privacy Architecture</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-10 px-6 lg:px-8 text-sm text-slate-500 dark:text-slate-400 transition-colors">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white">
            <span className="rounded-md bg-slate-900 dark:bg-blue-600 p-1.5 text-white">
              <Shield className="h-4 w-4" />
            </span>
            <span className="font-bold">VAULTIS · SIH26190</span>
          </div>
          <p>© {new Date().getFullYear()} Vaultis. Ministry of Home Affairs · Smart India Hackathon 2026.</p>
        </div>
      </footer>
    </div>
  );
}
