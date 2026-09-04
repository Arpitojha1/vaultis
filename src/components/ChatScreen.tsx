import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Paperclip, 
  Plus, 
  Sparkles, 
  ShieldCheck, 
  Lock, 
  Scale, 
  FileText, 
  FolderLock, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ArrowRight,
  Info,
  Loader2,
  X,
  UploadCloud,
  ChevronRight,
  Fingerprint,
  Columns,
  Landmark,
  Shield
} from 'lucide-react';
import { CaseItem, ChatMessage, Role, User, AuditRecord } from '../types';
import { getMockAnswer, MOCK_USERS } from '../mockData';
import { DebugPanel } from './DebugPanel';
import { FormattedMessageText } from './FormattedMessageText';
import { RoleComparisonModal } from './RoleComparisonModal';

interface ChatScreenProps {
  currentCase: CaseItem;
  currentUser: User;
  onRoleSwitch: (role: Role) => void;
  onAddAuditRecord: (record: Omit<AuditRecord, 'id' | 'blockNumber' | 'hash' | 'prevHash'>) => void;
}

export const ChatScreen = ({
  currentCase,
  currentUser,
  onRoleSwitch,
  onAddAuditRecord,
}: ChatScreenProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'assistant',
      text: `Vaultis Case Vault initialized for ${currentCase.caseNumber}: "${currentCase.title}". All evidentiary queries are cryptographically bound to session clearance [${currentUser.clearanceLevel}]. Inquiries will be evaluated against active Rule 16 and Title III sealing orders before model context assembly.`,
      timestamp: 'Just now',
      caseId: currentCase.id,
      roleAtTime: currentUser.role,
      modelNotice: `Active RBAC: ${currentUser.role} • Zero-Leak Gateway Online`,
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingStep, setThinkingStep] = useState('');
  
  // Role comparison modal state
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);

  // File upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('Surveillance_Log_Pier14_Addendum.pdf');

  // Case Documents Drawer toggle
  const [showDocsDrawer, setShowDocsDrawer] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  // Handle Question Submission
  const handleSendQuestion = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isThinking) return;

    setInputQuery('');

    // Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      caseId: currentCase.id,
      roleAtTime: currentUser.role,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    // Simulated Thinking Stages (800ms - 1300ms total)
    setThinkingStep('Evaluating Vaultis RBAC rules & clearance token...');
    await new Promise((r) => setTimeout(r, 380));

    setThinkingStep('Filtering vector index: withholding unpermitted evidentiary chunks...');
    await new Promise((r) => setTimeout(r, 450));

    setThinkingStep('Synthesizing verifiable legal proffer with model enclave...');
    await new Promise((r) => setTimeout(r, 370));

    // Get mock answer
    const answerData = getMockAnswer(currentCase.id, query, currentUser.role);

    const assistantMsg: ChatMessage = {
      id: `asst-${Date.now()}`,
      sender: 'assistant',
      text: answerData.text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      caseId: currentCase.id,
      roleAtTime: currentUser.role,
      chunks: answerData.chunks,
      isJailbreakAttempt: answerData.isJailbreakAttempt,
      modelNotice: answerData.modelNotice,
    };

    setMessages((prev) => [...prev, assistantMsg]);
    setIsThinking(false);
    setThinkingStep('');

    // Log to Cryptographic Audit Chain
    const authorizedCount = answerData.chunks.filter((c) => c.status === 'AUTHORIZED').length;
    const filteredCount = answerData.chunks.filter((c) => c.status === 'FILTERED').length;

    onAddAuditRecord({
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actor: currentUser.name,
      actorRole: currentUser.role,
      eventType: filteredCount > 0 ? 'disclosure_filter_applied' : 'evidentiary_query',
      actionSummary: `Query: "${query.slice(0, 48)}..." evaluated. ${authorizedCount} chunks authorized, ${filteredCount} chunks filtered by RBAC.`,
      resourceId: `${currentCase.caseNumber} / ${answerData.isJailbreakAttempt ? 'ADVERSARIAL_PREVENT' : 'RBAC_EVAL'}`,
    });
  };

  // Simulate Document Upload & Ingestion
  const handleSimulateUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) return;

    setIsUploading(true);
    setUploadStep('Calculating SHA-256 cryptographic digest of document...');
    await new Promise((r) => setTimeout(r, 400));

    setUploadStep('Splitting evidence into 16 semantically indexed vectors...');
    await new Promise((r) => setTimeout(r, 500));

    setUploadStep('Injecting record into tamper-evident Merkle hash chain...');
    await new Promise((r) => setTimeout(r, 450));

    setIsUploading(false);
    setUploadModalOpen(false);

    // Add upload confirmation message to chat
    const uploadMsg: ChatMessage = {
      id: `upload-${Date.now()}`,
      sender: 'system',
      text: `Evidence Ingested: "${selectedFileName}" has been cryptographically cataloged in ${currentCase.caseNumber}. Clearance required: [Investigating Officer, Prosecutor].`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      caseId: currentCase.id,
      roleAtTime: currentUser.role,
      attachment: {
        name: selectedFileName,
        size: '3.8 MB',
        type: 'PDF / Forensic Log',
        chunksCreated: 16,
        hash: 'e4d9b23190abf487e652a1290bb34e819124bc983710feacdb90142718274a12',
      },
    };

    setMessages((prev) => [...prev, uploadMsg]);

    onAddAuditRecord({
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actor: currentUser.name,
      actorRole: currentUser.role,
      eventType: 'document_ingest',
      actionSummary: `Ingested ${selectedFileName} (3.8 MB). 16 chunks sealed into vault.`,
      resourceId: `${currentCase.caseNumber} / ${selectedFileName}`,
    });
  };

  // Determine counterpart role for quick contrast switch
  const counterpartRole: Role = currentUser.role === 'Prosecutor' ? 'Defense Lawyer' : 'Prosecutor';

  const AVAILABLE_ROLES: Array<{ role: Role; label: string; icon: React.ReactNode }> = [
    { role: 'Prosecutor', label: 'Prosecutor', icon: <Scale className="w-3.5 h-3.5" /> },
    { role: 'Defense Lawyer', label: 'Defense Lawyer', icon: <Shield className="w-3.5 h-3.5" /> },
    { role: 'Judge', label: 'Judge', icon: <Landmark className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4 flex flex-col h-[calc(100vh-4.25rem)]">
      {/* Top Banner: Active Case & Live Clearance Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-xs">
            <FolderLock className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                {currentCase.caseNumber}
              </span>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate max-w-[280px] sm:max-w-md">
                {currentCase.title}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Active Persona: <strong className="text-slate-800">{currentUser.name}</strong> •{' '}
              <span className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">{currentUser.clearanceLevel}</span>
            </p>
          </div>
        </div>

        {/* Live Role Switch Contrast & Compare Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
          {/* 3-Role Direct Switcher Pills */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase px-2 hidden sm:inline">
              Role:
            </span>
            {AVAILABLE_ROLES.map((r) => {
              const isActive = currentUser.role === r.role;
              return (
                <button
                  key={r.role}
                  onClick={() => onRoleSwitch(r.role)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                  }`}
                  title={`Switch session to ${r.label}`}
                >
                  {r.icon}
                  <span>{r.label}</span>
                </button>
              );
            })}
          </div>

          {/* Compare 3 Roles Side-by-Side Modal Trigger */}
          <button
            onClick={() => setComparisonModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm cursor-pointer"
            id="chat-compare-roles-btn"
            title="Open side-by-side comparison of Prosecutor vs. Defense vs. Judge"
          >
            <Columns className="w-3.5 h-3.5 text-blue-400" />
            <span>Compare 3 Roles</span>
          </button>

          <button
            onClick={() => setShowDocsDrawer(!showDocsDrawer)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center space-x-1 border border-slate-200 cursor-pointer"
            id="chat-toggle-docs-btn"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>{currentCase.documentsCount} Vault Documents</span>
          </button>
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col grow overflow-hidden relative">
        {/* Case Documents Drawer (Slide down when open) */}
        {showDocsDrawer && (
          <div className="bg-slate-50 border-b border-slate-200 p-4 transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <FolderLock className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Indexed Evidentiary Documents in Vault
                </h3>
              </div>
              <button
                onClick={() => setShowDocsDrawer(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
              {currentCase.documents.map((doc) => {
                const isPermitted = doc.clearanceRequired.includes(currentUser.role);
                return (
                  <div
                    key={doc.id}
                    className={`p-2.5 rounded-xl border text-xs flex items-start justify-between ${
                      isPermitted
                        ? 'bg-white border-slate-200 text-slate-800 shadow-2xs'
                        : 'bg-slate-100/90 border-dashed border-slate-300 text-slate-400'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1.5">
                        <FileText className={`w-3.5 h-3.5 ${isPermitted ? 'text-blue-600' : 'text-slate-400'}`} />
                        <span className={`font-semibold truncate max-w-[150px] ${!isPermitted ? 'line-through' : ''}`}>
                          {doc.name}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center space-x-2 font-mono">
                        <span>{doc.size}</span>
                        <span>•</span>
                        <span>{doc.chunkCount} vectors</span>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase ${
                        isPermitted
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-600 flex items-center space-x-0.5'
                      }`}
                    >
                      {isPermitted ? 'AUTHORIZED' : 'SEALED'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Message Feed */}
        <div className="grow overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.map((msg) => {
            const isAssistant = msg.sender === 'assistant';
            const isUser = msg.sender === 'user';
            const isSystem = msg.sender === 'system';

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <div className="bg-slate-100 border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs flex items-center space-x-2 max-w-lg shadow-2xs">
                    <Fingerprint className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{msg.text}</span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                {/* Sender Header */}
                <div className="flex items-center space-x-2 mb-1 text-[11px] text-slate-400 font-medium px-1">
                  <span className="font-semibold text-slate-700">
                    {isUser ? currentUser.name : 'Vaultis AI Enclave'}
                  </span>
                  <span>•</span>
                  <span className="font-mono">{msg.timestamp}</span>
                  {!isUser && msg.modelNotice && (
                    <>
                      <span>•</span>
                      <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.2 rounded-full border border-blue-200/60">
                        {msg.modelNotice}
                      </span>
                    </>
                  )}
                </div>

                {/* Bubble Container */}
                <div
                  className={`max-w-3xl rounded-2xl p-4 sm:p-5 shadow-xs transition-all ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-xs'
                      : msg.isJailbreakAttempt
                      ? 'bg-amber-50 border-2 border-amber-300 text-slate-900 rounded-tl-xs'
                      : 'bg-white border border-slate-200 text-slate-900 rounded-tl-xs'
                  }`}
                >
                  {/* System refusal banner if jailbreak */}
                  {msg.isJailbreakAttempt && (
                    <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs uppercase tracking-wider mb-2 pb-2 border-b border-amber-200">
                      <Lock className="w-4 h-4 text-amber-700" />
                      <span>Zero-Leak Deterministic Refusal</span>
                    </div>
                  )}

                  {/* Body text: Render assistant messages with FormattedMessageText to make FILTERED - NOT DISCLOSED visually distinct */}
                  {isAssistant ? (
                    <FormattedMessageText text={msg.text} />
                  ) : (
                    <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                      {msg.text}
                    </div>
                  )}

                  {/* Attachment Preview (if any) */}
                  {msg.attachment && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="font-bold">{msg.attachment.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {msg.attachment.size} • {msg.attachment.chunksCreated} vectors • Hash:{' '}
                            {msg.attachment.hash.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                        INGESTED
                      </span>
                    </div>
                  )}

                  {/* Debug Panel (The key visual proof point!) */}
                  {msg.chunks && (
                    <DebugPanel
                      chunks={msg.chunks}
                      role={msg.roleAtTime}
                      isJailbreakAttempt={msg.isJailbreakAttempt}
                    />
                  )}
                </div>
              </div>
            );
          })}

          {/* Thinking State */}
          {isThinking && (
            <div className="flex flex-col items-start space-y-1">
              <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-medium px-1">
                <span className="font-semibold text-slate-700">Vaultis AI Enclave</span>
                <span>•</span>
                <span className="text-blue-600 font-mono animate-pulse">Running RBAC evaluation...</span>
              </div>
              <div className="bg-slate-50 border border-blue-200/80 rounded-2xl rounded-tl-xs p-4 shadow-xs max-w-md space-y-2">
                <div className="flex items-center space-x-2.5 text-xs text-blue-900 font-semibold">
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                  <span>{thinkingStep}</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full w-2/3 animate-pulse"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Demo Prompts Bar (Crucial for stage presentation!) */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 overflow-x-auto">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 shrink-0 flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-blue-600" />
              <span>Demo Presets:</span>
            </span>
            <div className="flex items-center space-x-2 overflow-x-auto pb-0.5">
              {currentCase.demoPrompts.map((prompt, i) => {
                const isJailbreak = prompt.toLowerCase().includes('ignore');
                return (
                  <button
                    key={i}
                    onClick={() => handleSendQuestion(prompt)}
                    disabled={isThinking}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border shadow-2xs cursor-pointer ${
                      isJailbreak
                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border-slate-200'
                    }`}
                    title="Click to run this preset query"
                  >
                    {isJailbreak ? '🚨 Jailbreak Attempt' : prompt.length > 42 ? prompt.slice(0, 42) + '...' : prompt}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chat Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendQuestion();
            }}
            className="flex items-center space-x-2"
          >
            {/* File Upload Button */}
            <button
              type="button"
              onClick={() => setUploadModalOpen(true)}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer shrink-0 border border-slate-200"
              title="Upload new case evidence"
              id="chat-upload-evidence-btn"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </button>

            {/* Text Input */}
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={`Ask a question as ${currentUser.role} (e.g. "What did the confidential informant reveal?")...`}
              disabled={isThinking}
              className="grow bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-colors"
              id="chat-query-input"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputQuery.trim() || isThinking}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all shrink-0 cursor-pointer shadow-xs ${
                inputQuery.trim() && !isThinking
                  ? 'bg-blue-700 hover:bg-blue-800'
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
              id="chat-send-btn"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Upload Simulation Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <UploadCloud className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Ingest Case Evidence</h3>
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSimulateUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Evidence Document
                </label>
                <select
                  value={selectedFileName}
                  onChange={(e) => setSelectedFileName(e.target.value)}
                  disabled={isUploading}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-medium cursor-pointer"
                >
                  <option value="Surveillance_Log_Pier14_Addendum.pdf">
                    Surveillance_Log_Pier14_Addendum.pdf (3.8 MB)
                  </option>
                  <option value="Encrypted_Phone_Extraction_Dump.docx">
                    Encrypted_Phone_Extraction_Dump.docx (12.4 MB)
                  </option>
                  <option value="Grand_Jury_Subpoena_Return_Vol3.pdf">
                    Grand_Jury_Subpoena_Return_Vol3.pdf (8.1 MB)
                  </option>
                  <option value="Forensic_Audio_Enhancement_Report.pdf">
                    Forensic_Audio_Enhancement_Report.pdf (2.2 MB)
                  </option>
                </select>
              </div>

              {/* Drag & Drop mockup */}
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center bg-slate-50/50 space-y-2">
                <FileText className="w-8 h-8 text-blue-500 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">
                  Ready to compute cryptographic Merkle proofs
                </p>
                <p className="text-[11px] text-slate-400">
                  File will be chunked into 16 local vectors and sealed with SHA-256
                </p>
              </div>

              {/* Progress State */}
              {isUploading && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                  <div className="flex items-center space-x-2 text-xs text-blue-900 font-bold">
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    <span>{uploadStep}</span>
                  </div>
                  <div className="w-full bg-blue-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full w-3/4 animate-pulse"></div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  disabled={isUploading}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 shadow-sm cursor-pointer flex items-center space-x-1.5"
                >
                  {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Fingerprint className="w-3.5 h-3.5" />}
                  <span>{isUploading ? 'Ingesting...' : 'Ingest & Hash Document'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Comparison Modal (Side-by-Side 3-Role View) */}
      <RoleComparisonModal
        isOpen={comparisonModalOpen}
        onClose={() => setComparisonModalOpen(false)}
        currentCase={currentCase}
      />
    </div>
  );
};
