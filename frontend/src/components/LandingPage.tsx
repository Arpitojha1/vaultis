import { Shield, ChevronRight, Scale, Clock, BookOpen, UserCheck } from 'lucide-react';
import { Button } from './ui/Button';

export function LandingPage({ onLoginClick }: { onLoginClick: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-slate-200">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-3 text-slate-900">
            <Shield className="h-6 w-6" strokeWidth={2} />
            <span className="font-semibold tracking-wide text-lg">VAULTIS ADVISORY</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#services" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hidden sm:block">Practice Areas</a>
            <a href="#credentials" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hidden sm:block">Credentials</a>
            <Button variant="ghost" onClick={onLoginClick} size="sm">Client Portal</Button>
            <Button variant="primary" size="sm">Schedule Consultation</Button>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative px-6 py-24 sm:py-32 lg:px-8 bg-white border-b border-slate-200">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-6xl text-balance">
              Strategic legal counsel for complex enterprise challenges
            </h1>
            <p className="mt-8 text-lg leading-8 text-slate-600 font-medium max-w-2xl mx-auto">
              Delivering rigorous, objective analysis and defensible strategies for regulatory compliance, corporate structuring, and risk management.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button variant="primary" size="lg">
                Schedule a consultation
              </Button>
            </div>
          </div>
        </section>

        {/* Practice Areas (Services) */}
        <section id="services" className="py-24 sm:py-32 px-6 lg:px-8 mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Practice Areas</h2>
            <p className="mt-4 text-slate-600">Specialized advisory services tailored for institutional clients.</p>
          </div>
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-slate-100 text-slate-900 mb-6">
                <Scale className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">[Regulatory Compliance]</h3>
              <p className="text-slate-600 leading-relaxed">[Placeholder copy: Strategic guidance on navigating evolving regulatory landscapes, ensuring robust adherence to statutory requirements while maintaining operational agility.]</p>
            </div>
            <div>
              <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-slate-100 text-slate-900 mb-6">
                <BookOpen className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">[Corporate Structuring]</h3>
              <p className="text-slate-600 leading-relaxed">[Placeholder copy: Advisory on entity formation, mergers, and acquisitions. We provide comprehensive due diligence and risk assessment for complex transactions.]</p>
            </div>
            <div>
              <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-slate-100 text-slate-900 mb-6">
                <Shield className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">[Information Governance]</h3>
              <p className="text-slate-600 leading-relaxed">[Placeholder copy: Counsel on data privacy, security policies, and cryptographic audits to ensure secure handling of privileged information.]</p>
            </div>
          </div>
        </section>

        {/* Credentials / Trust */}
        <section id="credentials" className="bg-slate-900 py-24 sm:py-32 px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-white">Experience you can trust</h2>
                <p className="mt-6 text-lg text-slate-300 leading-relaxed">
                  [Placeholder copy: Our partners bring decades of experience from top-tier firms and regulatory agencies. We combine deep legal expertise with a nuanced understanding of modern technological and financial ecosystems.]
                </p>
                <div className="mt-8 flex gap-4">
                  <div className="flex items-center gap-2 text-slate-300">
                    <UserCheck className="h-5 w-5 text-slate-400" />
                    <span>[Chambers Ranked]</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Clock className="h-5 w-5 text-slate-400" />
                    <span>[20+ Years Experience]</span>
                  </div>
                </div>
              </div>
              <div className="bg-slate-800 p-10 rounded-xl border border-slate-700">
                <blockquote className="text-slate-200 text-lg leading-relaxed font-medium">
                  "[Placeholder copy: Vaultis Advisory provided indispensable counsel during our recent acquisition. Their ability to distill complex regulatory requirements into actionable strategy is unmatched.]"
                </blockquote>
                <div className="mt-6 flex items-center gap-4">
                  <div className="h-12 w-12 bg-slate-700 rounded-full"></div>
                  <div>
                    <div className="text-white font-medium">[Client Name]</div>
                    <div className="text-slate-400 text-sm">[General Counsel, Fortune 500 Firm]</div>
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
              <span className="font-semibold">VAULTIS ADVISORY</span>
            </div>
            <p className="max-w-xs leading-relaxed">
              [Placeholder contact info: 123 Legal Plaza, Suite 400<br/>New York, NY 10001<br/>contact@vaultisadvisory.com]
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Firm</h4>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-slate-900">About</a></li>
              <li><a href="#" className="hover:text-slate-900">Practice Areas</a></li>
              <li><a href="#" className="hover:text-slate-900">Attorneys</a></li>
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
          <p>[Placeholder disclaimer: The information on this website is for general information purposes only. Nothing on this site should be taken as legal advice for any individual case or situation.]</p>
          <p className="mt-4">&copy; {new Date().getFullYear()} Vaultis Advisory. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
