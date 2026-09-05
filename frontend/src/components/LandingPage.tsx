import { Shield, ChevronRight, Scale, Clock, BookOpen, UserCheck, Lock, Activity } from 'lucide-react';
import { Button } from './ui/Button';

export function LandingPage({ onLoginClick }: { onLoginClick: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-slate-200">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-3 text-slate-900">
            <Shield className="h-6 w-6" strokeWidth={2} />
            <span className="font-semibold tracking-wide text-lg">VAULTIS</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hidden sm:block">Features</a>
            <a href="#technology" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hidden sm:block">Technology</a>
            <Button variant="ghost" onClick={onLoginClick} size="sm">Client Portal</Button>
            <Button variant="primary" size="sm" onClick={onLoginClick}>Access Vault</Button>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative px-6 py-24 sm:py-32 lg:px-8 bg-white border-b border-slate-200">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-6xl text-balance">
              Cryptographically secure legal document management
            </h1>
            <p className="mt-8 text-lg leading-8 text-slate-600 font-medium max-w-2xl mx-auto">
              An advanced evidence vault and RAG platform featuring uncompromisable role-based access control and a tamper-evident audit ledger.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button variant="primary" size="lg" onClick={onLoginClick}>
                Enter Secure Portal
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24 sm:py-32 px-6 lg:px-8 mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Platform Features</h2>
            <p className="mt-4 text-slate-600">Built for the strict demands of legal proceedings and evidence synthesis.</p>
          </div>
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-slate-100 text-slate-900 mb-6">
                <Activity className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Cryptographic Audit Chain</h3>
              <p className="text-slate-600 leading-relaxed">A verifiable, tamper-evident ledger of all access and modifications. Cryptographically secure sequential hashes ensure that evidence and queries are never secretly modified.</p>
            </div>
            <div>
              <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-slate-100 text-slate-900 mb-6">
                <Scale className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Role-Based RAG</h3>
              <p className="text-slate-600 leading-relaxed">Context-aware AI assistance explicitly filtered by strict legal roles. Defense lawyers, prosecutors, and judges only see the evidence legally disclosed to them.</p>
            </div>
            <div>
              <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-slate-100 text-slate-900 mb-6">
                <Lock className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Military-Grade Encryption</h3>
              <p className="text-slate-600 leading-relaxed">Evidence is fully encrypted at rest using AES-256-GCM. Documents are decrypted strictly in memory upon authorized viewing, ensuring zero persistent plaintext.</p>
            </div>
          </div>
        </section>

        {/* Technology */}
        <section id="technology" className="bg-slate-900 py-24 sm:py-32 px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-white">Zero-trust evidence management</h2>
                <p className="mt-6 text-lg text-slate-300 leading-relaxed">
                  VAULTIS leverages PostgreSQL, ChromaDB, and powerful LLMs to provide rapid evidence synthesis without compromising confidentiality or the chain of custody.
                </p>
                <div className="mt-8 flex gap-4">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Shield className="h-5 w-5 text-slate-400" />
                    <span>AES-256-GCM Encrypted</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Clock className="h-5 w-5 text-slate-400" />
                    <span>Tamper-Evident Ledger</span>
                  </div>
                </div>
              </div>
              <div className="bg-slate-800 p-10 rounded-xl border border-slate-700">
                <blockquote className="text-slate-200 text-lg leading-relaxed font-medium">
                  "VAULTIS provided indispensable tools during our recent trial. The ability to instantly synthesize thousands of pages of evidence while guaranteeing strict access controls changed our workflow entirely."
                </blockquote>
                <div className="mt-6 flex items-center gap-4">
                  <div className="h-12 w-12 bg-slate-700 rounded-full flex items-center justify-center text-slate-300">
                    <Scale className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-white font-medium">Lead Prosecutor</div>
                    <div className="text-slate-400 text-sm">State v. Sterling</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 px-6 lg:px-8 text-sm text-slate-500">
        <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 text-slate-900 mb-4">
              <Shield className="h-5 w-5" />
              <span className="font-semibold">VAULTIS</span>
            </div>
            <p className="max-w-xs leading-relaxed">
              123 Secure Enclave<br/>Tech District<br/>contact@vaultis.dev
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Product</h4>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-slate-900">About</a></li>
              <li><a href="#features" className="hover:text-slate-900">Features</a></li>
              <li><a href="#" className="hover:text-slate-900">Documentation</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Legal</h4>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-slate-900">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-slate-900">Terms of Service</a></li>
              <li><a href="#" className="hover:text-slate-900">Disclaimer</a></li>
            </ul>
          </div>
        </div>
        <div className="mx-auto max-w-7xl mt-12 pt-8 border-t border-slate-200">
          <p>The VAULTIS software is provided as-is for secure legal document management and demonstration purposes. Consult your IT and compliance departments before deployment.</p>
          <p className="mt-4">&copy; {new Date().getFullYear()} VAULTIS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
