# PROJECTSCOUT Addendum — Staging admin account created and promoted — 2026-11-26

## Verification
- Supabase STAGING project: `myScoutingDatabase-staging`, ref `nwqwnrhupbyhshsprxjt`.
- Auth user exists for `a.dridi06@web.de`; confirmed_at is populated (email confirmed).
- Auth user ID: `be1755ae-d2cf-45ad-b536-0f90d0874609`.
- Matching `public.profiles` row exists with same UUID and email.
- Trigger-generated username: `a.dridi06-be1755ae`.
- Initial trigger role was `scout`, `approved=false`, `approval_status=pending`, as designed.
- The exact matching profile was then promoted through privileged SQL to `role=admin`, `approved=true`, `approval_status=approved`.
- Returned row after update confirmed all three admin/approval fields.
- Password was not read, changed, or exposed through SQL or chat.

## Current status
- Staging Auth account: created and email-confirmed.
- Staging profile: correctly linked by UUID.
- Staging admin authorization: assigned and verified.
- Password/login: not independently verified yet; owner must sign in through the staging application using the password set in Supabase Dashboard.
- Production Supabase, production Render, main branch, production secrets, PFMS/PFSS: untouched.
- Render auto-deploy remains disabled; no application deployment triggered.

## Next step
Owner signs in to the staging application. Verify successful authentication, admin workspace access, and admin-only diagnostics. If login fails, capture the exact error; do not reset or replace the password without explicit instruction.
