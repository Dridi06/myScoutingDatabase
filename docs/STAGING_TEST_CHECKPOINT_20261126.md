# STAGING test checkpoint — 2026-11-26

## Scope and safety
- Project: `myScoutingDatabase`, integrated MESSINHO.
- STAGING Render service: `myscoutingdatabase-messinho-staging` (`srv-dc3chlqjnfac73acd6ig`).
- STAGING Supabase project: `nwqwnrhupbyhshsprxjt`.
- Working branch: `feature/messinho-unified-ai-integration`.
- PR #47 remains Draft and unmerged.
- No STAGING application-code deployment was made during this test pass; deployed application commit remains `2c828e68624d36ce5e663becc75bb48ee6ff1c3f`.
- All database migrations below were applied only to the dedicated STAGING Supabase project.

## Test results verified
- Latest Node test workflow on feature commit `1c5bfbfb351a65e8285e73d2b561578c55077c0c`: success.
- MESSINHO validation workflow: success (unit tests and frontend build).
- ASI quality checks: success (unit tests and frontend build).
- Backend JavaScript syntax workflow: success.
- Staging health smoke test: success.
- The last deployed Render build logged **169 tests, 169 passed, 0 failed**, followed by a successful Vite build (1,636 modules transformed).
- Render STAGING service is configured on the feature branch, active, with auto-deploy disabled. Its runtime logs show API listening on port 10000, Supabase Data API HTTP 200, and Tavily/OpenAI configured.
- Latest persisted MESSINHO diagnostics: **healthy, 9/9 checks passed, 0 failed, 0 warnings** (2026-11-26 06:05:11 UTC).
- Latest persisted system diagnostics: **healthy, 46/46 checks passed, 0 failed, 0 warnings** (2026-11-26 03:49:36 UTC).
- Scout3 profile is verified as `role=scout`, `approved=true`, `approval_status=approved`.
- Knowledge memory table exists with owner-scoped RLS; current row count is 0. No knowledge rows were seeded.
- No authenticated Scout3 chat E2E test has been performed by the assistant; a valid browser session is required. Never request or store the user's password or JWT.

## Issues found and fixes applied to STAGING
1. `admin_set_scout_approval` was previously blocked by profile RLS. The narrow SECURITY DEFINER RPC was applied earlier; it validates `auth.uid()` and `private.is_admin()`, uses an empty search_path, and changes only Scout approval fields.
2. `messinho_diagnostic_runs` had default API table grants despite RLS being enabled without browser policies. Revoked all privileges from PUBLIC, anon, and authenticated; retained CRUD for service_role only.
3. `system_diagnostic_runs` had default API grants including TRUNCATE/DELETE, which are not protected by RLS. Revoked all privileges from PUBLIC/anon/authenticated, then granted authenticated only SELECT/INSERT (still constrained by admin-only RLS policies); service_role retains backend access.
4. Supabase performance advisor identified missing FK indexes on `asi_model_versions.approved_by`, `messinho_diagnostic_runs.actor_profile_id`, and `system_diagnostic_runs.actor_profile_id`. Added all three indexes.
5. Updated the two system-diagnostic admin RLS policies to use `(select auth.uid())` rather than repeated per-row evaluation.
6. Render logs showed admin-login system diagnostics failing because `system_diagnostic_runs_triggered_by_check` omitted the actual source `admin_login`. Constraint now explicitly permits `automatic`, `admin`, `admin_login`, and `deployment`.

## Remaining security/advisor notes
- Supabase Auth leaked-password protection remains disabled. This is an Auth configuration setting and was not changed by SQL; enable it in STAGING Auth password/security settings before release.
- Supabase flags `admin_set_scout_approval` as SECURITY DEFINER executable by authenticated users. This is intentional for the admin RPC; it is narrowly scoped, validates the caller's admin role, has an empty search_path, and does not grant execution to anon/PUBLIC.
- Supabase reports RLS enabled with no policies for `messinho_diagnostic_runs`. This is intentional: browser roles have no table privileges; only the backend service_role can access it.
- Thirty-one unused indexes are reported. Most are on empty/new tables and should not be dropped without workload evidence; three missing FK indexes were added.
- Full authenticated Scout3 sign-in, chat calculations, unknown-question research, and memory reuse still require a real authenticated browser session.

## Production branch / Render recovery incident
- A migration source file was inadvertently created on `main` instead of the feature branch. This was an operator error.
- `main` was immediately force-reset using an expected-SHA guard to its exact prior commit: `fa0d4dfbdd779f280bb3caf44c6cc70be8dcb5b6`. The file was then correctly added to the feature branch.
- Render production auto-deploy had already started for the temporary main commit. That commit contained only the migration source file; no application source, production database schema, or production data was changed.
- After the branch reset, Render queued a deployment of the restored prior commit. At checkpoint creation, this recovery deployment was still in progress and must be verified live before declaring production fully settled.
- Do not merge PR #47 or promote staging. Continue to keep all subsequent work on the feature branch and STAGING.

## STAGING-only migration source files added during this test pass
- `supabase/migrations/20261126210000_staging_security_performance_hardening.sql`
- `supabase/migrations/20261126211000_fix_admin_login_diagnostic_source.sql`
- `supabase/migrations/20261126212000_harden_system_diagnostic_table_grants.sql`

All three migrations are recorded in the STAGING Supabase migration history. Production Supabase was not modified.
