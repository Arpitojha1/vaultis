import { useState } from 'react';
import { Role, User, CaseItem, AuditRecord } from './types';
import { MOCK_USERS, MOCK_CASES, INITIAL_AUDIT_LOGS } from './mockData';
import { Navbar } from './components/Navbar';
import { LandingAuth } from './components/LandingAuth';
import { CaseDashboard } from './components/CaseDashboard';
import { ChatScreen } from './components/ChatScreen';
import { AuditLogScreen } from './components/AuditLogScreen';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS['Prosecutor']);
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'chat' | 'audit'>('dashboard');
  const [currentCase, setCurrentCase] = useState<CaseItem | null>(MOCK_CASES[0]);
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>(INITIAL_AUDIT_LOGS);
  const [isTampered, setIsTampered] = useState<boolean>(false);

  // Login handler
  const handleLogin = (role: Role, customName?: string) => {
    const baseUser = MOCK_USERS[role];
    const userToSet: User = customName
      ? { ...baseUser, name: customName }
      : baseUser;

    setCurrentUser(userToSet);
    setIsAuthenticated(true);
    setCurrentScreen('dashboard');

    // Add audit log for login
    handleAddAuditRecord({
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actor: userToSet.name,
      actorRole: role,
      eventType: 'auth_login',
      actionSummary: `Session initiated as ${role}. Clearance: ${userToSet.clearanceLevel}.`,
      resourceId: `AUTH_TOKEN_${Date.now().toString().slice(-4)}`,
    });
  };

  // Logout handler
  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentScreen('dashboard');
  };

  // Live Role Switch Handler (Key to hackathon contrast demo!)
  const handleRoleSwitch = (newRole: Role) => {
    const newUser = MOCK_USERS[newRole];
    setCurrentUser(newUser);

    handleAddAuditRecord({
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actor: newUser.name,
      actorRole: newRole,
      eventType: 'role_switch',
      actionSummary: `Live persona switched to ${newRole}. Active clearance updated to ${newUser.clearanceLevel}.`,
      resourceId: `RBAC_SESSION_SWITCH`,
    });
  };

  // Select a case and enter investigation assistant
  const handleSelectCase = (caseItem: CaseItem) => {
    setCurrentCase(caseItem);
    setCurrentScreen('chat');
  };

  // Add a block to the cryptographic audit chain
  const handleAddAuditRecord = (recordData: Omit<AuditRecord, 'id' | 'blockNumber' | 'hash' | 'prevHash'>) => {
    setAuditRecords((prev) => {
      const lastRecord = prev[prev.length - 1];
      const newBlockNumber = (lastRecord?.blockNumber || 0) + 1;
      const prevHash = lastRecord?.hash || '0000000000000000000000000000000000000000000000000000000000000000';

      // Generate realistic deterministic hash
      const rawString = `${newBlockNumber}-${recordData.timestamp}-${recordData.actor}-${recordData.actionSummary}-${prevHash}`;
      let hashNum = 0;
      for (let i = 0; i < rawString.length; i++) {
        hashNum = (hashNum << 5) - hashNum + rawString.charCodeAt(i);
        hashNum |= 0;
      }
      const hex = Math.abs(hashNum).toString(16).padStart(8, '0');
      const mockSha256 = `0000${hex}${hex}${hex}${hex}${hex}${hex}${hex}`.slice(0, 64);

      const newRecord: AuditRecord = {
        ...recordData,
        id: `aud-${Date.now()}`,
        blockNumber: newBlockNumber,
        hash: mockSha256,
        prevHash,
      };

      return [...prev, newRecord];
    });
  };

  // Toggle Tamper simulation for Act 3
  const handleToggleTamper = () => {
    setIsTampered((prev) => !prev);
  };

  // If not authenticated, render the landing page with mock auth
  if (!isAuthenticated) {
    return <LandingAuth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Persistent Top Navigation */}
      <Navbar
        currentUser={currentUser}
        currentScreen={currentScreen}
        currentCase={currentCase}
        onNavigate={(screen) => setCurrentScreen(screen)}
        onRoleSwitch={handleRoleSwitch}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="grow">
        {currentScreen === 'dashboard' && (
          <CaseDashboard
            cases={MOCK_CASES}
            currentUser={currentUser}
            onSelectCase={handleSelectCase}
            onOpenAudit={() => setCurrentScreen('audit')}
          />
        )}

        {currentScreen === 'chat' && currentCase && (
          <ChatScreen
            currentCase={currentCase}
            currentUser={currentUser}
            onRoleSwitch={handleRoleSwitch}
            onAddAuditRecord={handleAddAuditRecord}
          />
        )}

        {currentScreen === 'audit' && (
          <AuditLogScreen
            records={auditRecords}
            onToggleTamper={handleToggleTamper}
            isTampered={isTampered}
          />
        )}
      </main>
    </div>
  );
}
