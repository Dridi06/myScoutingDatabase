# Project checkpoint — 2026-11-28: session continuity and concise chat timestamps

## Scope
- Repository: `Dridi06/myScoutingDatabase`
- Branch: `feature/messinho-conversation-engine`
- Target: STAGING only
- Production: unchanged

## Changes
1. The main Supabase client now explicitly enables `persistSession`, `autoRefreshToken`, and `detectSessionInUrl` without changing the existing Supabase storage key.
2. On browser focus and when the document becomes visible again, the app re-reads the existing Supabase session and restores the authenticated user state. It does not interpret an arbitrary empty session read as a logout.
3. Session restoration uses an auth-event revision guard so an older asynchronous session read cannot overwrite a newer sign-in/sign-out event.
4. App state is cleared on the explicit `SIGNED_OUT` event; password recovery retains its dedicated flow.
5. The primary MESSINHO conversation and the myKI chat now show one timestamp per message, in 24-hour `HH:mm` format using the `Europe/Berlin` timezone. Date text and technical timestamp labels (client sent, server receipt, persisted/generated status) are no longer rendered beside each message. Timestamp data remains stored for audit and persistence.

## Regression coverage
- Updated `tests/myki-timestamp-coverage.test.js` for the one-clock-time display.
- Added `tests/session-persistence.test.js` for persisted auth configuration, focus/visibility restoration, and stale-read protection.

## Validation / deployment
- CI runs started for each file commit and the latest branch commit. Record final Node test, backend syntax, production build and isolated sandbox conclusions here after the workflows complete.
- Render staging deployment must be triggered only after successful validation because the service has auto-deploy disabled.
- Do not deploy to Production.
