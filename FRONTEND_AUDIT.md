# VAULTIS Frontend Audit

Audit date: 2026-09-03. Scope: every file under `src/`, plus frontend configuration relevant to runtime and dependencies. This is an audit-only pass; no application code was changed.

## 1. Inventory table

There is no router library or route configuration. `App.tsx` selects among three in-memory screens with `currentScreen` (`dashboard`, `chat`, `audit`), while login is rendered by the `isAuthenticated` boolean [src/App.tsx:11-16](src/App.tsx#L11-L16), [src/App.tsx:101-144](src/App.tsx#L101-L144).

| Screen / component | File path | Renders? | Data source | State management | Classification and notes |
|---|---|---:|---|---|---|
| Application shell / screen switcher | `src/App.tsx` | Yes, entry component | `MOCK_USERS`, `MOCK_CASES`, `INITIAL_AUDIT_LOGS`; no fetch | React `useState` in component | **MOCKED.** Provides an in-memory auth flag, selected user/case, audit records, and tamper flag. All dashboard cases are passed without role filtering [src/App.tsx:11-16](src/App.tsx#L11-L16), [src/App.tsx:120-143](src/App.tsx#L120-L143). |
| Login / landing | `src/components/LandingAuth.tsx` | Yes before `isAuthenticated` | `MOCK_USERS`; form values only | React `useState` | **MOCKED.** Submission calls the parent callback directly and neither validates credentials nor requests a token [src/components/LandingAuth.tsx:11-27](src/components/LandingAuth.tsx#L11-L27). |
| Navigation / live role selector | `src/components/Navbar.tsx` | Yes after login | `MOCK_USERS`; parent props | React `useState` for menu | **MOCKED.** Role switch calls a parent state setter, not a credential refresh or role-scoped backend request [src/components/Navbar.tsx:145-181](src/components/Navbar.tsx#L145-L181). |
| Case dashboard / case list | `src/components/CaseDashboard.tsx` | Yes on `dashboard` | Parent receives full `MOCK_CASES` | React `useState` for search/status filters | **MOCKED.** Search and status filter work locally, but the role affects only clearance copy/theme; `filteredCases` never examines `currentUser.role` [src/components/CaseDashboard.tsx:33-40](src/components/CaseDashboard.tsx#L33-L40), [src/components/CaseDashboard.tsx:57-82](src/components/CaseDashboard.tsx#L57-L82). |
| Chat / case evidence workspace | `src/components/ChatScreen.tsx` | Yes on `chat` with a selected case | `getMockAnswer`, case props, local message state | React `useState`, `useRef`, `useEffect` | **MOCKED.** Question handling deliberately waits, then calls `getMockAnswer`; no answer endpoint exists [src/components/ChatScreen.tsx:83-144](src/components/ChatScreen.tsx#L83-L144). |
| Upload modal within chat | `src/components/ChatScreen.tsx` | Yes after clicking upload | Fixed filename `<select>` and hardcoded metadata/hash | React `useState` | **STUBBED.** It has no `<input type="file">`, `FormData`, or upload request; it simulates three timed phases and adds a local chat/audit entry [src/components/ChatScreen.tsx:146-189](src/components/ChatScreen.tsx#L146-L189), [src/components/ChatScreen.tsx:554-589](src/components/ChatScreen.tsx#L554-L589). |
| Retrieval debug panel | `src/components/DebugPanel.tsx` | Yes for assistant messages that carry `chunks` | `RetrievedChunk[]` supplied from mock answer | React `useState` for expand/collapse | **MOCKED.** It genuinely separates locally supplied chunk objects into authorized and filtered lists [src/components/DebugPanel.tsx:23-27](src/components/DebugPanel.tsx#L23-L27), but the data is synthetic. Labels meet the intended visual split [src/components/DebugPanel.tsx:99-106](src/components/DebugPanel.tsx#L99-L106), [src/components/DebugPanel.tsx:151-158](src/components/DebugPanel.tsx#L151-L158). |
| Cross-role comparison modal | `src/components/RoleComparisonModal.tsx` | Yes when opened from chat | Calls `getMockAnswer` three times | React `useState` | **MOCKED.** It visualizes role contrast, but generates all three results client-side from the same fixture function [src/components/RoleComparisonModal.tsx:42-47](src/components/RoleComparisonModal.tsx#L42-L47). |
| Audit log viewer / chain verification | `src/components/AuditLogScreen.tsx` | Yes on `audit` | `INITIAL_AUDIT_LOGS` plus session-local audit additions | React `useState` | **MOCKED.** The verifier waits 900 ms and reports solely from `isTampered`; it neither sends `/verify-chain` nor recomputes/validates hashes [src/components/AuditLogScreen.tsx:45-66](src/components/AuditLogScreen.tsx#L45-L66). |
| Message formatter | `src/components/FormattedMessageText.tsx` | Yes from chat and comparison output | Text prop | None | **MOCKED support component.** Presentation-only formatting for mock assistant text. |
| Domain model declarations | `src/types.ts` | N/A (type-only) | None | None | **N/A support file.** Defines display-oriented role labels and simulated `RetrievedChunk`/`AuditRecord` shapes [src/types.ts:1-11](src/types.ts#L1-L11), [src/types.ts:50-103](src/types.ts#L50-L103). |
| Fixture data and answer generator | `src/mockData.ts` | N/A (imported) | Hardcoded users, cases, answers, audit records | None | **MOCKED support file.** `getMockAnswer(caseId, question, role)` is the source of chat answers/chunks [src/mockData.ts:233-237](src/mockData.ts#L233-L237); audit seed data is fixed [src/mockData.ts:829-902](src/mockData.ts#L829-L902). |
| React mount | `src/main.tsx` | Yes | None | None | **REAL bootstrap only.** Mounts `App`; it does not add data/auth integration [src/main.tsx:1-10](src/main.tsx#L1-L10). |
| Global styling | `src/index.css` | Yes | None | None | **N/A support file.** Tailwind import/theme and scrollbar styles only [src/index.css:1-22](src/index.css#L1-L22). |

### Authentication and authorization

Authentication is a fake in-memory gate. Login maps a selected display role to `MOCK_USERS`, sets `isAuthenticated` to true, and appends a local audit record; no password is checked, JWT is issued, token is stored, request header is added, or session survives a refresh [src/App.tsx:18-38](src/App.tsx#L18-L38), [src/App.tsx:40-44](src/App.tsx#L40-L44). No `localStorage`, `sessionStorage`, `fetch`, Axios, or other HTTP client call appears in the audited source.

All four requested concepts exist only as title-cased UI roles: `Investigating Officer`, `Prosecutor`, `Defense Lawyer`, and `Judge` [src/types.ts:1](src/types.ts#L1). The active role does change the mock answer and mock chunk lists because it is passed into `getMockAnswer` [src/components/ChatScreen.tsx:113-125](src/components/ChatScreen.tsx#L113-L125). That is a useful visual demo, but it is not backend enforcement: full sensitive fixture content and the role-selection mechanism are shipped to and executable by the browser. The case list is especially cosmetic: every role receives the same `MOCK_CASES` array from `App` [src/App.tsx:120-126](src/App.tsx#L120-L126), and dashboard filtering does not use role [src/components/CaseDashboard.tsx:33-40](src/components/CaseDashboard.tsx#L33-L40).

### API/service layer and backend contract

There is no API client, base URL, endpoint constant, HTTP request, or service directory under `src/`. The only environment variables documented are `GEMINI_API_KEY` and `APP_URL`, and neither is read by the frontend source [`.env.example`:1-9](.env.example#L1-L9). The README retains generic AI Studio/Gemini setup instructions [README.md:5-20](README.md#L5-L20), while no `@google/genai` import is present. Consequently, this code does not currently assert a FastAPI base URL, custom-JWT token format, or any endpoint contract.

### Dependencies: observed use versus installed

| Package | Observed status |
|---|---|
| `react`, `react-dom` | Used by application mount/components [src/main.tsx:1-9](src/main.tsx#L1-L9). |
| `lucide-react` | Used across visual components, e.g. chat imports [src/components/ChatScreen.tsx:1-25](src/components/ChatScreen.tsx#L1-L25). |
| `vite`, `@vitejs/plugin-react`, `@tailwindcss/vite`, `tailwindcss` | Used by build/styling configuration [vite.config.ts:1-8](vite.config.ts#L1-L8), [src/index.css:1](src/index.css#L1). `vite` and `tailwindcss` are each listed in both dependency classes in `package.json` [package.json:14-33](package.json#L14-L33). |
| `typescript` | Used by the TypeScript project configuration and `lint` script [package.json:7-10](package.json#L7-L10), [tsconfig.json:1-25](tsconfig.json#L1-L25). |
| `@google/genai`, `express`, `dotenv`, `motion`, `@types/node`, `@types/express`, `autoprefixer`, `esbuild`, `tsx` | Installed but no imports/references were found in `src/` or `vite.config.ts`; no Express server file exists. Treat as unused until a server/build workflow proves otherwise [package.json:14-33](package.json#L14-L33). |

No `TODO`, `FIXME`, or commented-out auth/permission/API branches were found. The comments that mention the debug panel, simulated upload, role switching, and tamper demo explicitly describe demo behavior rather than deferred integration [src/App.tsx:46-47](src/App.tsx#L46-L47), [src/components/ChatScreen.tsx:146](src/components/ChatScreen.tsx#L146), [src/components/AuditLogScreen.tsx:164](src/components/AuditLogScreen.tsx#L164).

## 2. MVP coverage table

| Required surface | Status | Evidence-based justification |
|---|---|---|
| 1. Login | **MOCKED** | Role selector does reach subsequent local state and changes the mock chat generator, but submit only calls `onLogin`; there is no credential/JWT/API flow [src/components/LandingAuth.tsx:17-27](src/components/LandingAuth.tsx#L17-L27), [src/App.tsx:18-27](src/App.tsx#L18-L27). The role is not propagated in any request because no request exists. |
| 2. Case/document upload | **STUBBED** | The modal offers four fixed filenames in a select and runs timed UI steps; no chosen file is available to upload and no endpoint is called [src/components/ChatScreen.tsx:146-189](src/components/ChatScreen.tsx#L146-L189), [src/components/ChatScreen.tsx:554-589](src/components/ChatScreen.tsx#L554-L589). |
| 3. Chat with debug panel | **MOCKED — CRITICAL GAP** | Chat works visually and the debug component clearly renders authorized vs. filtered chunks, but its answer/chunks come from `getMockAnswer` after staged delays, not from permission-filtered backend results [src/components/ChatScreen.tsx:103-125](src/components/ChatScreen.tsx#L103-L125), [src/components/DebugPanel.tsx:99-158](src/components/DebugPanel.tsx#L99-L158). The cross-role difference is therefore client-side theater. |
| 4. Audit log viewer | **MOCKED — CRITICAL GAP** | Seeded/local audit rows, visible hash snippets, verify button, and tamper control exist [src/mockData.ts:829-902](src/mockData.ts#L829-L902), [src/components/AuditLogScreen.tsx:119-161](src/components/AuditLogScreen.tsx#L119-L161), [src/components/AuditLogScreen.tsx:164-215](src/components/AuditLogScreen.tsx#L164-L215). Verification is determined by a boolean and hardcodes block 5, so it is not `/verify-chain` or cryptographic verification [src/components/AuditLogScreen.tsx:45-66](src/components/AuditLogScreen.tsx#L45-L66). |
| 5. Case list/dashboard | **MOCKED** | A complete local case grid exists, but all roles receive the same fixture array and only client-side search/status filtering runs [src/App.tsx:120-126](src/App.tsx#L120-L126), [src/components/CaseDashboard.tsx:33-40](src/components/CaseDashboard.tsx#L33-L40). |

## 3. Critical gaps

1. **Act 1 / Act 2: no backend security boundary is visible.** The centerpiece screen has the right UI, but role-specific answers and disclosures are generated from a client bundle fixture (`getMockAnswer`), not `allowed_chunk_ids` or a backend result. A user can inspect or alter this logic, and a judge cannot verify that the model received only authorized context [src/components/ChatScreen.tsx:113-125](src/components/ChatScreen.tsx#L113-L125), [src/mockData.ts:233-237](src/mockData.ts#L233-L237).
2. **Login cannot demonstrate custom JWT + FastAPI middleware.** It issues no token and makes no authenticated request. Switching roles in navbar also directly substitutes a fixture user, which is incompatible with a meaningful access-control demonstration [src/App.tsx:47-59](src/App.tsx#L47-L59).
3. **Case visibility is not permission-checked.** The dashboard shows the same four cases to every user. This fails the demo's first-screen proof of granular access [src/App.tsx:120-126](src/App.tsx#L120-L126).
4. **Document upload is not a real upload.** There is no file control, `FormData`, endpoint, or refreshed case/document state; the success indication only adds a local message and audit row [src/components/ChatScreen.tsx:164-189](src/components/ChatScreen.tsx#L164-L189).
5. **Act 3 verification is predetermined.** The verifier ignores record hashes and always labels block 5 broken when the toggled boolean is true. The displayed alteration is also conditional rendering, not persisted record corruption [src/components/AuditLogScreen.tsx:54-65](src/components/AuditLogScreen.tsx#L54-L65), [src/components/AuditLogScreen.tsx:272-348](src/components/AuditLogScreen.tsx#L272-L348).
6. **Contract risk.** No integration exists to compare against the guide's Section 5.2/4.2 payloads. In particular, `RetrievedChunk` expects rich objects and local `status`, while the target state describes deriving UI lists from `allowed_chunk_ids` versus all case chunks [src/types.ts:50-62](src/types.ts#L50-L62). The adapter must be designed once the actual response is supplied; do not assume this mock shape is compatible.

## 4. Quick wins

These are visually close but require replacing fixtures with network calls. Endpoint paths below are the integration targets to confirm with the backend team; only `answer_query` is named in the supplied MVP brief, so the other paths are proposed REST names rather than observed frontend/backend contracts.

| Surface | Replace | Required integration call |
|---|---|---|
| Login | `onLogin(selectedRole, name)` and `MOCK_USERS` | `POST /auth/login` with credentials/role, store returned custom JWT in memory, and attach `Authorization: Bearer <jwt>` thereafter. |
| Dashboard | `cases={MOCK_CASES}` | `GET /cases` with the JWT; render only server-returned cases and refresh it after login/role change. |
| Chat/debug | `getMockAnswer(currentCase.id, query, currentUser.role)` | `POST /answer_query` with `{ case_id, question }` and JWT. Map the response's answer plus `allowed_chunk_ids` and all case chunks into the two debug lists; do not send a client-selected role as authorization. |
| Upload | timed `handleSimulateUpload` | `POST /cases/{caseId}/documents` using `FormData` and JWT, then refresh `GET /cases/{caseId}` or consume the returned document. |
| Audit | local `INITIAL_AUDIT_LOGS` and boolean verifier | `GET /audit-events`, `POST /verify-chain`, and a debug-only backend tamper endpoint such as `POST /audit-events/{id}/tamper` if the backend team authorizes it. Render the verifier's actual validity, checked count, and break record. |

## 5. Rebuild-from-scratch candidates

No screen needs a visual rewrite: the dashboard, chat, debug panel, and audit layout are substantial and can be retained.

- **Replace rather than patch the data/auth layer.** There is no existing client/service abstraction to extend; create one integration boundary and remove the app's direct imports of `mockData` rather than incrementally hiding fixtures [src/App.tsx:2-3](src/App.tsx#L2-L3), [src/components/ChatScreen.tsx:27](src/components/ChatScreen.tsx#L27).
- **Replace the upload handler.** It is intentionally a simulation and has no reusable file abstraction, so a real multipart upload flow is faster and safer than trying to retrofit its staged timers [src/components/ChatScreen.tsx:146-162](src/components/ChatScreen.tsx#L146-L162).
- **Replace the chain verification behavior.** Retain the audit screen UI, but delete the `isTampered`-driven result logic and make the server result authoritative [src/components/AuditLogScreen.tsx:45-66](src/components/AuditLogScreen.tsx#L45-L66).

## 6. Estimated hours to demo-ready

Assumption: backend endpoints from Sections 5.2 and 4.2 are deployed, documented, CORS-enabled for this client, and return stable demo seed data. Estimate includes frontend integration, loading/error states, and a manual three-act rehearsal; it excludes backend implementation.

| Work item | Estimate |
|---|---:|
| Create API client, JWT session handling, and response adapters | 3–4 h |
| Login and role/session behavior | 2–3 h |
| Server-filtered case dashboard | 2–3 h |
| Multipart upload and document/case refresh | 4–6 h |
| `answer_query` integration, role comparison re-query, and authoritative debug mapping | 7–10 h |
| Audit event feed, `/verify-chain`, server tamper-demo integration | 5–7 h |
| Demo hardening, error/empty states, and end-to-end rehearsal | 3–4 h |
| **Total** | **26–37 h** |

### Verification note

`npm run lint` could not execute in this checkout because `tsc` is not available on PATH (`'tsc' is not recognized`), so this audit does not claim a successful TypeScript build. The failure is environmental/dependency-install related, not an audit finding about application behavior.
