import { useState } from 'react';
import { 
  FolderLock, 
  FileText, 
  ChevronRight, 
  Scale, 
  ShieldAlert, 
  Activity, 
  Search, 
  Sparkles,
  Lock,
  Layers,
  ArrowRight
} from 'lucide-react';
import { CaseItem, CaseStatus, Role, User } from '../types';

interface CaseDashboardProps {
  cases: CaseItem[];
  currentUser: User;
  onSelectCase: (caseItem: CaseItem) => void;
  onOpenAudit: () => void;
}

export const CaseDashboard = ({
  cases,
  currentUser,
  onSelectCase,
  onOpenAudit,
}: CaseDashboardProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.court.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: CaseStatus) => {
    switch (status) {
      case 'In Trial':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Under Investigation':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Pre-Trial Discovery':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Grand Jury Review':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getRoleTheme = (role: Role) => {
    switch (role) {
      case 'Prosecutor':
        return {
          badge: 'bg-blue-100 text-blue-800 border-blue-200',
          desc: 'Unrestricted state work product & Title III intercept clearance active.',
        };
      case 'Defense Lawyer':
        return {
          badge: 'bg-amber-100 text-amber-800 border-amber-200',
          desc: 'Restricted Rule 16 discovery clearance. Confidential informants withheld.',
        };
      case 'Investigating Officer':
        return {
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          desc: 'Law enforcement sensitive access. Surveillance logs & raw evidence unlocked.',
        };
      case 'Judge':
        return {
          badge: 'bg-purple-100 text-purple-800 border-purple-200',
          desc: 'Comprehensive judicial in-camera clearance across all sealed dockets.',
        };
    }
  };

  const roleTheme = getRoleTheme(currentUser.role);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Role & Session Clearance Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
            <Scale className="w-6 h-6 text-blue-400 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900">
                Authenticated Operator: {currentUser.name}
              </h2>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${roleTheme.badge}`}>
                {currentUser.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Clearance: <span className="font-mono text-slate-700 font-semibold">{currentUser.clearanceLevel}</span> — {roleTheme.desc}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button
            onClick={onOpenAudit}
            className="flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer border border-slate-200/80"
            id="dash-view-audit-btn"
          >
            <Activity className="w-3.5 h-3.5 text-slate-500" />
            <span>Audit Hash Chain</span>
          </button>
          <div className="text-right hidden sm:block">
            <span className="text-[11px] text-slate-400 block uppercase font-bold tracking-wider">Node Status</span>
            <span className="text-xs font-mono font-semibold text-emerald-600 flex items-center justify-end">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
              Air-Gapped Local
            </span>
          </div>
        </div>
      </div>

      {/* Header with Case Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Active Case Vaults
            </h1>
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-slate-200 text-slate-700">
              {cases.length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Select a case to query documents with deterministic RBAC query filtering.
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search case # or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 w-48 sm:w-60 shadow-2xs"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden focus:border-blue-500 shadow-2xs cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="In Trial">In Trial</option>
            <option value="Under Investigation">Under Investigation</option>
            <option value="Pre-Trial Discovery">Pre-Trial Discovery</option>
            <option value="Grand Jury Review">Grand Jury Review</option>
          </select>
        </div>
      </div>

      {/* Cases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCases.map((caseItem, idx) => {
          const isPremierDemo = caseItem.id === 'case-01';
          return (
            <div
              key={caseItem.id}
              onClick={() => onSelectCase(caseItem)}
              className={`group bg-white rounded-2xl border transition-all duration-200 p-6 flex flex-col justify-between hover:shadow-lg cursor-pointer relative overflow-hidden ${
                isPremierDemo
                  ? 'border-blue-300 ring-2 ring-blue-500/10 shadow-sm hover:border-blue-500'
                  : 'border-slate-200/90 hover:border-slate-300 shadow-2xs'
              }`}
              id={`case-card-${caseItem.id}`}
            >
              {isPremierDemo && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-xs flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-blue-200" />
                  <span>Primary Hackathon Demo</span>
                </div>
              )}

              <div className="space-y-4">
                {/* Header tags */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="font-mono text-xs font-extrabold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-md">
                    {caseItem.caseNumber}
                  </span>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge(caseItem.status)}`}>
                    {caseItem.status}
                  </span>
                  <span className="text-[10px] font-semibold tracking-tight text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    {caseItem.classification}
                  </span>
                </div>

                {/* Case Title & Summary */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-snug">
                    {caseItem.title}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    {caseItem.court}
                  </p>
                  <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">
                    {caseItem.summary}
                  </p>
                </div>

                {/* Case Key Parties */}
                <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/70 text-[11px] space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Lead Investigator:</span>
                    <span className="text-slate-700 font-semibold">{caseItem.leadInvestigator}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Prosecutor:</span>
                    <span className="text-slate-700 font-semibold">{caseItem.prosecutor}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Defense Counsel:</span>
                    <span className="text-slate-700 font-semibold">{caseItem.defenseCounsel}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Docs Count & Action */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-3 text-xs text-slate-500 font-medium">
                  <div className="flex items-center space-x-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>{caseItem.documentsCount} Evidentiary Files</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>{caseItem.chunksCount} Vectors</span>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-700 group-hover:text-blue-800 transition-colors">
                  <span>Enter Vault</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Demo helper banner */}
      <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="font-medium">
            <strong>Hackathon Demo Tip:</strong> Select <em>State v. Sterling</em> to run the live contrast test between Prosecutor and Defense Lawyer permissions on the offshore wire transfer.
          </span>
        </div>
        <button
          onClick={() => onSelectCase(cases[0])}
          className="shrink-0 px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center space-x-1 cursor-pointer transition-colors shadow-xs"
        >
          <span>Open Demo Case</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
