# Network, Offline & Error Handling Audit Report

**Date:** 2026-06-14
**Scope:** 16 files across `app/`, `src/providers/`, `src/hooks/`, `src/lib/`, `src/components/`

---

## A. Network Error Handling

| # | Issue | Location | Severity |
|---|-------|----------|----------|
| N-1 | **No request timeout configuration** — `fetch()` calls in `api()` have no `AbortController`/timeout. A hung server will block indefinitely. | `AuthProvider.tsx:320` | HIGH |
| N-2 | **No retry logic for failed requests** — All API calls fail on first error. No exponential backoff or retry mechanism exists. | All screens | HIGH |
| N-3 | **No HTTP status-specific handling beyond 401** — 403, 404, 503 are all collapsed into a generic error parse. No differentiated UX (e.g., "server unavailable" vs "not found"). | `AuthProvider.tsx:328` | MEDIUM |
| N-4 | **Silent error swallowing in `triggerTranscription`/`triggerAnalysis`** — Uses fake `setTimeout` instead of actual API calls, showing false success messages. | `consultations.tsx:647-668` | HIGH |
| N-5 | **No global error logging/reporting** — Errors are only `console.warn`'d or shown in UI. No Sentry/Datadog/error-boundary integration. | All files | MEDIUM |
| N-6 | **`loadLogs` in consultations has no try/catch at call site** — `loadLogs` defines without try/catch inside; the catch wraps the caller but any error in `setSelectedLog` would be unhandled. | `consultations.tsx:242` | LOW |

## B. Authentication & Session

| # | Issue | Location | Severity |
|---|-------|----------|----------|
| A-1 | **Token refresh race condition on boot** — If multiple components mount simultaneously during boot, each may trigger independent refresh calls. Only `refreshPromiseRef` deduplicates runtime refreshes, not boot-time refreshes. | `AuthProvider.tsx:218-235` | MEDIUM |
| A-2 | **No auto-logout on persistent 401** — After one refresh retry fails, the token is cleared. But if the API returns 401 on the *second* attempt, there's no redirect/logout — the user sees a generic error. | `AuthProvider.tsx:321-326` | HIGH |
| A-3 | **JWT expiry checked with 5-minute buffer only at boot** — No proactive background refresh before expiry during long sessions. If user is active > access token lifetime (2h), requests will fail. | `AuthProvider.tsx:214` | HIGH |
| A-4 | **Refresh token sent as plain JSON body** — Not an httpOnly cookie. Stored in sessionStorage (better than localStorage, but still XSS-accessible). | `storage.ts:82`, `AuthProvider.tsx:279` | MEDIUM |
| A-5 | **`accessToken!` non-null assertion on file downloads** — If token is null (race during logout), `getFileDownloadUrl` will crash. | Multiple files | MEDIUM |
| A-6 | **Token in URL query parameter for downloads and WebSocket** — `getFileDownloadUrl` and WS URL expose JWT in URL, which may be logged by proxies/browsers. | `config.ts:26`, `useWebSocket.ts:61` | MEDIUM |

## C. Offline Behavior

| # | Issue | Location | Severity |
|---|-------|----------|----------|
| O-1 | **No offline detection (NetInfo)** — Zero usage of `@react-native-community/netinfo` or `navigator.onLine`. App makes no attempt to detect connectivity. | All files | HIGH |
| O-2 | **No offline state UI indicator** — Users have no visual cue when they're offline. Failed requests show generic error messages. | All screens | HIGH |
| O-3 | **No cached data display when offline** — Data fetched from API is stored only in React state. No local cache (AsyncStorage/MMKV) for offline fallback. | All screens | HIGH |
| O-4 | **No offline queue for pending actions** — Upload, status updates, comments, and messages are not queued when offline. They simply fail. | `consultations.tsx`, `lecturer-dashboard.tsx` | HIGH |
| O-5 | **No graceful degradation** — File uploads, AI chat, transcription, and WebSocket connections all fail silently or with unhelpful error messages when offline. | All screens | MEDIUM |

## D. WebSocket Reliability

| # | Issue | Location | Severity |
|---|-------|----------|----------|
| W-1 | **No heartbeat/ping mechanism** — WebSocket connections have no keepalive. Silent connection drops (common on mobile networks) will not be detected. | `useWebSocket.ts` | HIGH |
| W-2 | **No connection state management exposed** — Consumers cannot check if WS is connected, reconnecting, or failed. No visual indicator of real-time status. | `useWebSocket.ts:120` | MEDIUM |
| W-3 | **No message retry on send failure** — Outbound messages (subscribe, etc.) have no confirmation or retry. If `socket.send()` fails, it's silently lost. | `useWebSocket.ts:69` | MEDIUM |
| W-4 | **`lecturer-dashboard.tsx` uses raw WebSocket** — Creates its own `new WebSocket()` instead of using the `useWebSocket` hook. No reconnection logic, no exponential backoff. | `lecturer-dashboard.tsx:226-343` | HIGH |
| W-5 | **WS reconnection has max 30s delay but no max attempt limit** — Will retry forever, potentially wasting resources if the server is permanently down. | `useWebSocket.ts:92` | LOW |
| W-6 | **No connection timeout** — If WebSocket `onopen` never fires, the connection hangs indefinitely. | `useWebSocket.ts` | MEDIUM |
| W-7 | **Room resubscription needed after reconnect** — On reconnect, rooms are resubscribed via `onopen`, but if rooms change during disconnect, stale rooms may be subscribed. | `useWebSocket.ts:65-71` | LOW |

## E. Data Integrity

| # | Issue | Location | Severity |
|---|-------|----------|----------|
| D-1 | **No optimistic UI updates for status changes** — `updateStatus` does `await api()` then `loadLogs()`, causing a delay. | `consultations.tsx:595` | MEDIUM |
| D-2 | **No rollback on failed optimistic updates** — `handleValidate` optimistically sets status to "Validated" before confirming with server. If server fails, state is stale. | `lecturer-dashboard.tsx:422` | MEDIUM |
| D-3 | **Comment fallback creates local-only comments** — `handleAddComment` adds a local comment with `Date.now()` as ID if API fails. This comment will be lost on refresh. | `consultations.tsx:626-643` | MEDIUM |
| D-4 | **No data validation before submission** — Profile save sends raw state without field validation. AI gateway save has no validation. | `settings/profile.tsx`, `settings/ai-gateway.tsx` | LOW |
| D-5 | **Form state not preserved on error** — Upload form resets files on success without confirmation dialog. | `consultations.tsx:476` | LOW |

## F. Loading States

| # | Issue | Location | Severity |
|---|-------|----------|----------|
| L-1 | **No initial loading skeleton on dashboard** — Shows `StatCard` with "0" values before data loads, which is misleading. | `dashboard.tsx:147-177` | MEDIUM |
| L-2 | **No loading state for `loadLogs` in consultations** — Initial consultation load has no visual loading indicator. | `consultations.tsx:242-248` | MEDIUM |
| L-3 | **No refetch loading indicator** — Pull-to-refresh exists but many screens lack it (e.g., `lecturer-dashboard.tsx`). | `lecturer-dashboard.tsx` | LOW |
| L-4 | **Pagination loading absent** — Lecturer revision pagination has no loading state when changing pages. | `lecturer-dashboard.tsx` | LOW |
| L-5 | **Submit loading properly handled** — Login, register, feedback dispatch, upload, password change all have loading states with disabled buttons. | Multiple files | PASS |

---

## Per-Category Scores (0-10)

| Category | Score | Rationale |
|----------|-------|-----------|
| **A. Network Error Handling** | 4/10 | Basic try/catch present; no timeouts, no retries, no status-specific UX, fake transcription functions |
| **B. Authentication & Session** | 6/10 | JWT refresh with dedup, sessionStorage storage, boot-time proactive refresh — but no background refresh, no auto-logout on repeated 401 |
| **C. Offline Behavior** | 1/10 | Completely absent. No detection, no UI, no cache, no queue |
| **D. WebSocket Reliability** | 4/10 | Hook has exponential backoff reconnection, but raw WS in lecturer-dashboard, no heartbeat, no connection state exposure |
| **E. Data Integrity** | 5/10 | Some optimistic updates (lecturer validate), comment fallback, but no rollback, no pre-submit validation |
| **F. Loading States** | 5/10 | Submit loading handled well; initial data loading skeletons missing, refetch indicators inconsistent |

**Overall: 4.2 / 10**

---

## Prioritized Recommendations

### P0 — Critical (Fix Immediately)

1. **Implement request timeouts** in `AuthProvider.tsx` `api()` — wrap every `fetch()` with `AbortController` + 30s timeout. Prevents indefinite hangs.

2. **Add `NetInfo` offline detection** — Install `@react-native-community/netinfo`, create a global `useOnlineStatus()` hook, and show an offline banner on all screens.

3. **Add background token refresh** — Set a timer in `AuthProvider` to refresh the JWT at `exp - 5min` while the user is active. Prevents mid-session 401 errors.

4. **Fix `lecturer-dashboard.tsx` raw WebSocket** — Replace the manual `new WebSocket()` at line 229 with the existing `useWebSocket` hook to get reconnection logic.

### P1 — High Priority (Next Sprint)

5. **Add retry with exponential backoff** — Create a `fetchWithRetry()` wrapper (2 retries, 1s/2s delays) for non-mutation API calls (GETs).

6. **Implement offline data caching** — Store last-fetched consultation data, stats, and user profile in `AsyncStorage`/`MMKV`. Display cached data with an "offline — showing cached data" banner.

7. **Add WebSocket heartbeat** — Implement a 30s ping/pong mechanism in `useWebSocket.ts`. Detect silent disconnections and trigger reconnection.

8. **Auto-logout on persistent 401** — After the refresh-retry in `api()` fails, call `logout()` to clear state and redirect to login.

### P2 — Medium Priority (Backlog)

9. **Differentiated HTTP error UX** — Map 403 → "Access denied", 404 → "Resource not found", 503 → "Server unavailable" in `parseError()`.

10. **Add error logging service** — Integrate Sentry or a lightweight error reporter in `ErrorBoundary.componentDidCatch` and `api()` catch blocks.

11. **Add rollback on failed optimistic updates** — In `handleValidate`/`handleRejectFix`, save previous state before optimistic update and restore on API failure.

12. **Add initial loading skeletons** — Replace "0" stat values with skeleton loaders while dashboard data loads.

13. **Expose WebSocket connection state** — Return `{ connected, reconnecting }` from `useWebSocket` hook. Show a connection status indicator in the NavBar.

14. **Remove fake transcription/analysis** — `triggerTranscription` and `triggerAnalysis` are `setTimeout` stubs that show false success. Either implement real API calls or disable the buttons.
