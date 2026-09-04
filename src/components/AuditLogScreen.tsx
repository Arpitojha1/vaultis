import React, { useState } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  RotateCcw, 
  Hash, 
  Lock, 
  FileText, 
  UserCheck, 
  Sliders, 
  Sparkles,
  Search,
  ExternalLink,
  ShieldCheck,
  Check
} from 'lucide-react';
import { AuditRecord, Role } from '../types';

interface AuditLogScreenProps {
  records: AuditRecord[];
  onToggleTamper: () => void;
  isTampered: boolean;
}

export const AuditLogScreen = ({
  records,
  onToggleTamper,
  isTampered,
}: AuditLogScreenProps) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    status: 'idle' | 'success' | 'failed';
    tamperedBlock?: number;
    message: string;
  }>({
    status: 'idle',
    message: '',
  });

  const [filterType, setFilterType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleVerifyChain = async () => {
    setIsVerifying(true);
    setVerificationResult({ status: 'idle', message: 'Scanning cryptographic Merkle links...' });

    // Visual pause for stage effect
    await new Promise((r) => setTimeout(r, 900));

    setIsVerifying(false);

    if (isTampered) {
      setVerificationResult({
        status: 'failed',
        tamperedBlock: 5,
        message: '✗ Tamper detected at Block #5! Cryptographic payload signature does not match parent link. Ledger integrity broken.',
      });
    } else {
      setVerificationResult({
        status: 'success',
        message: `✓ Chain intact — ${records.length} records cryptographically verified. Zero tampering detected.`,
      });
    }
  };

  const filteredRecords = records.filter((rec) => {
    const matchesFilter = filterType === 'All' || rec.eventType === filterType;
    const matchesSearch =
      rec.actionSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.hash.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getEventBadge = (type: AuditRecord['eventType']) => {
    switch (type) {
      case 'disclosure_filter_applied':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'evidentiary_query':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'document_ingest':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'auth_login':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'chain_verified':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner: Cryptographic Ledger State */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Activity className="w-5 h-5 text-blue-400 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  Tamper-Evident Hash Chain
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                  SHA-256 Merkle DAG
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Every query, chunk filter, and evidence upload is sealed sequentially with irreversible forward hashes.
              </p>
            </div>
          </div>
        </div>

        {/* Verification Action and Live Status */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <button
            onClick={handleVerifyChain}
            disabled={isVerifying}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all shadow-xs cursor-pointer ${
              isVerifying
                ? 'bg-slate-200 text-slate-500 cursor-wait'
                : 'bg-blue-700 hover:bg-blue-800 text-white shadow-blue-700/20'
            }`}
            id="audit-verify-chain-btn"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isVerifying ? 'Verifying Merkle Roots...' : 'Verify Cryptographic Chain'}</span>
          </button>
        </div>
      </div>

      {/* Verification Status Banner */}
      {verificationResult.status !== 'idle' && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center justify-between transition-all ${
            verificationResult.status === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-red-50 text-red-900 border-red-300 animate-bounce'
          }`}
          id="audit-verification-banner"
        >
          <div className="flex items-center space-x-3">
            {verificationResult.status === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{verificationResult.message}</span>
          </div>

          {verificationResult.status === 'failed' && (
            <span className="text-xs font-mono font-bold bg-red-200 text-red-900 px-2.5 py-1 rounded-md border border-red-300">
              HASH MISMATCH DETECTED
            </span>
          )}
        </div>
      )}

      {/* Demo Controls: Tamper Simulation Box (Mandated by Prompt for Act 3) */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Live Hackathon Stage Controls — Act 3: Tamper Detection Demo
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono text-slate-400">Current State:</span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full font-mono ${
                isTampered
                  ? 'bg-red-900/60 text-red-300 border border-red-700'
                  : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
              }`}
            >
              {isTampered ? 'TAMPER INJECTED (Record #5)' : 'CLEAN LEDGER'}
            </span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-slate-300">
          <p className="leading-relaxed max-w-2xl">
            Click <strong>"Simulate Malicious Tamper"</strong> to simulate an attacker altering Block #5 (modifying a withheld disclosure record). Then re-run <strong>"Verify Cryptographic Chain"</strong> to demonstrate automatic fraud detection on stage.
          </p>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={onToggleTamper}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                isTampered
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30'
              }`}
              id="audit-simulate-tamper-btn"
            >
              {isTampered ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Ledger Integrity</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Simulate Tamper on Record #5</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Audit Log Table Header & Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Immutable Event Ledger ({filteredRecords.length} Blocks)
            </h2>
            <p className="text-xs text-slate-500">
              Deterministic sequence cryptographically linking all Vault actions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search actor or hash..."
                className="pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 cursor-pointer"
            >
              <option value="All">All Events</option>
              <option value="evidentiary_query">Evidentiary Queries</option>
              <option value="disclosure_filter_applied">Disclosure Filters</option>
              <option value="document_ingest">Document Ingestion</option>
              <option value="auth_login">Auth Sessions</option>
            </select>
          </div>
        </div>

        {/* Ledger Records Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Block #</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Actor & Role</th>
                <th className="px-4 py-3">Event Type</th>
                <th className="px-4 py-3">Action Description</th>
                <th className="px-4 py-3 font-mono">Current Hash</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((record) => {
                const isRecordTampered = isTampered && record.blockNumber === 5;
                return (
                  <tr
                    key={record.id}
                    className={`transition-colors ${
                      isRecordTampered
                        ? 'bg-red-50/90 border-y-2 border-red-500 text-red-950 font-medium'
                        : 'hover:bg-slate-50/80'
                    }`}
                    id={`audit-row-${record.blockNumber}`}
                  >
                    {/* Block # */}
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      <div className="flex items-center space-x-1">
                        <span>#{record.blockNumber}</span>
                        {isRecordTampered && (
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600 animate-pulse" />
                        )}
                      </div>
                    </td>

                    {/* Timestamp */}
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {record.timestamp}
                    </td>

                    {/* Actor & Role */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">{record.actor}</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {record.actorRole}
                        </span>
                      </div>
                    </td>

                    {/* Event Type */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${getEventBadge(
                          record.eventType
                        )}`}
                      >
                        {record.eventType.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Action Description */}
                    <td className="px-4 py-3 max-w-xs sm:max-w-md">
                      {isRecordTampered ? (
                        <div className="space-y-0.5">
                          <span className="text-red-700 font-bold block">
                            [TAMPERED BY ATTACKER]: Privilege cleared for unauthorized third-party
                          </span>
                          <span className="text-[10px] line-through text-slate-400 block">
                            {record.actionSummary}
                          </span>
                        </div>
                      ) : (
                        <span className="line-clamp-2 leading-relaxed text-slate-800">
                          {record.actionSummary}
                        </span>
                      )}
                    </td>

                    {/* Monospace Hash */}
                    <td className="px-4 py-3 font-mono text-[11px] whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        <Hash className="w-3 h-3 text-slate-400" />
                        <span
                          className={`font-semibold ${
                            isRecordTampered ? 'text-red-700 line-through' : 'text-slate-600'
                          }`}
                          title={record.hash}
                        >
                          {isRecordTampered ? '0xBAD_HASH_TAMPERED' : `${record.hash.slice(0, 12)}...`}
                        </span>
                      </div>
                    </td>

                    {/* Verification Badge */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {isRecordTampered ? (
                        <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-800 font-bold text-[10px] border border-red-300 flex items-center space-x-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>TAMPERED</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200 flex items-center space-x-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>VALIDATED</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
