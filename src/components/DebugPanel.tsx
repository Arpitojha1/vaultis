import { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  KeyRound, 
  Hash, 
  CheckCircle2, 
  XCircle,
  EyeOff,
  AlertTriangle
} from 'lucide-react';
import { RetrievedChunk, Role } from '../types';

interface DebugPanelProps {
  chunks: RetrievedChunk[];
  role: Role;
  isJailbreakAttempt?: boolean;
}

export const DebugPanel = ({ chunks, role, isJailbreakAttempt }: DebugPanelProps) => {
  const [isOpen, setIsOpen] = useState(true);

  const authorizedChunks = chunks.filter((c) => c.status === 'AUTHORIZED');
  const filteredChunks = chunks.filter((c) => c.status === 'FILTERED');

  return (
    <div className="mt-3 rounded-xl border border-slate-200/90 bg-white shadow-xs overflow-hidden transition-all">
      {/* Header Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/80 transition-colors flex items-center justify-between border-b border-slate-200 cursor-pointer text-left"
        id="debug-panel-toggle"
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
            <KeyRound className="w-3.5 h-3.5 text-blue-600" />
            <span>Evidentiary Retrieval & Clearance Breakdown</span>
          </div>

          <span className="text-slate-300 hidden sm:inline">|</span>

          {/* Quick counters */}
          <div className="flex items-center space-x-1.5 text-[11px] font-semibold">
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>{authorizedChunks.length} Authorized</span>
            </span>

            <span className="px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700 border border-slate-300/80 flex items-center space-x-1">
              <EyeOff className="w-3 h-3 text-slate-500" />
              <span>{filteredChunks.length} Filtered & Withheld</span>
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-1 text-xs text-slate-400 font-medium">
          <span className="hidden sm:inline">{isOpen ? 'Hide Inspection' : 'Inspect Chunks'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Content */}
      {isOpen && (
        <div className="p-4 space-y-4 text-xs bg-slate-50/50">
          {/* Zero Leak Banner */}
          <div className="p-3 rounded-lg bg-blue-50/80 border border-blue-200/80 text-[11px] text-blue-900 flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">
                Vaultis Deterministic Air-Gap Enforcement (Role: {role})
              </p>
              <p className="text-blue-800/80 mt-0.5 leading-relaxed">
                Filtered chunks are physically stripped from the embedding payload before model context injection. 
                The language model cannot disclose, hallucinate, or leak vectors that never entered its context window.
              </p>
            </div>
          </div>

          {/* Judicial Supervisory Notice if Judge */}
          {role === 'Judge' && (
            <div className="p-3 rounded-lg bg-amber-50/90 border border-amber-300/80 text-[11px] text-amber-950 flex items-start space-x-2">
              <KeyRound className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900">
                  Judicial In-Camera Supervisory Inspection Privilege (Hon. Patricia Thornton)
                </p>
                <p className="text-amber-900/85 mt-0.5 leading-relaxed">
                  Pursuant to Fed. R. Crim. P. 16(d)(1), the presiding judge retains supervisory in-camera inspection 
                  access across all sealed grand jury proffer exhibits, informant debrief notes, and wiretap transcripts to balance 
                  adversarial discovery against confidential source safety.
                </p>
              </div>
            </div>
          )}

          {/* AUTHORIZED CHUNKS SECTION (GREEN) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>AUTHORIZED CHUNKS ({authorizedChunks.length}) — Ingested Into AI Context</span>
              </span>
              <span className="text-[10px] text-emerald-600 font-mono font-semibold">Status: Verified Accessible</span>
            </div>

            {authorizedChunks.length === 0 ? (
              <div className="p-3 rounded-lg bg-emerald-50/40 border border-emerald-200/60 text-center text-slate-500 italic text-[11px]">
                0 chunks authorized for this query under current clearance level.
              </div>
            ) : (
              <div className="space-y-2">
                {authorizedChunks.map((chunk) => (
                  <div
                    key={chunk.id}
                    className="p-3 rounded-lg bg-white border-2 border-emerald-300 shadow-xs hover:border-emerald-400 transition-colors space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1 border-b border-emerald-100 pb-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-extrabold text-[10px] uppercase tracking-wider shadow-2xs">
                          AUTHORIZED
                        </span>
                        <span className="font-semibold text-slate-800 flex items-center space-x-1">
                          <FileText className="w-3 h-3 text-emerald-600" />
                          <span>{chunk.sourceDoc}</span>
                        </span>
                        <span className="text-slate-400 text-[10px]">Page {chunk.pageNumber}</span>
                      </div>

                      <div className="flex items-center space-x-2 font-mono text-[10px] text-slate-500">
                        <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">{chunk.clearanceLevel}</span>
                        <span>•</span>
                        <span className="flex items-center">
                          <Hash className="w-3 h-3 mr-0.5 text-slate-400" />
                          {chunk.hash.slice(0, 10)}...
                        </span>
                      </div>
                    </div>

                    <p className="text-slate-800 leading-relaxed font-sans bg-emerald-50/40 p-2.5 rounded-md border border-emerald-100 text-xs">
                      "{chunk.snippet}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* FILTERED - NOT DISCLOSED SECTION (MUTED GREY / RED ACCENT) */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-900 flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-rose-600" />
                <span>FILTERED — NOT DISCLOSED ({filteredChunks.length}) — Blocked at Gateway</span>
              </span>
              <span className="text-[10px] text-rose-700 font-mono font-bold">RBAC Exemption Enforced</span>
            </div>

            {filteredChunks.length === 0 ? (
              <div className="p-3 rounded-lg bg-slate-100/60 border border-slate-200 text-center text-slate-400 italic text-[11px]">
                No restricted chunks withheld for this role ({role} possesses necessary clearance).
              </div>
            ) : (
              <div className="space-y-2">
                {filteredChunks.map((chunk) => (
                  <div
                    key={chunk.id}
                    className="p-3 rounded-lg bg-rose-50/40 border-2 border-dashed border-rose-300 shadow-2xs space-y-2 transition-all hover:bg-rose-50/70"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1 border-b border-rose-200/80 pb-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-extrabold text-[10px] uppercase flex items-center space-x-1 tracking-wider shadow-2xs">
                          <Lock className="w-2.5 h-2.5 text-white" />
                          <span>FILTERED — NOT DISCLOSED</span>
                        </span>
                        <span className="font-semibold text-slate-700 line-through flex items-center space-x-1">
                          <FileText className="w-3 h-3 text-slate-400" />
                          <span>{chunk.sourceDoc}</span>
                        </span>
                        <span className="text-slate-400 text-[10px]">Page {chunk.pageNumber}</span>
                      </div>

                      <div className="flex items-center space-x-2 font-mono text-[10px] text-slate-500">
                        <span className="text-rose-700 font-bold bg-rose-100 px-1.5 py-0.5 rounded border border-rose-200">{chunk.classification}</span>
                        <span>•</span>
                        <span>{chunk.hash.slice(0, 10)}...</span>
                      </div>
                    </div>

                    {/* Snippet with strike-through and reason for withholding */}
                    <div className="p-2.5 rounded-md bg-white/90 border border-rose-200 text-slate-700 font-mono text-[11px] leading-relaxed relative overflow-hidden">
                      <div className="flex items-center space-x-1 text-rose-900 font-bold mb-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span className="text-[11px] uppercase tracking-wide">LEGAL WITHHOLDING JUSTIFICATION:</span>
                      </div>
                      <p className="text-slate-900 font-semibold mb-1.5 font-sans text-xs">
                        {chunk.withheldReason || 'Insufficient clearance under Rule 16 Protective Order.'}
                      </p>
                      <div className="text-slate-400 text-[10px] line-through select-none bg-slate-100 p-1.5 rounded border border-slate-200">
                        {chunk.snippet}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
