# PROJECTSCOUT Addendum — Auth signup trigger fix — 2026-11-26

## Scope and safety
- Project: myScoutingDatabase.
- Branch: `feature/messinho-agent-workspace`.
- Supabase target: dedicated STAGING project `myScoutingDatabase-staging`, ref `nwqwnrhupbyhshsprxjt`.
- Production Supabase `vxtybjaabtfhxfwctnyj`, production Render, `main`, and PFMS/PFSS were not modified.
- Render auto-deploy remains disabled. No Render deploy was triggered.

## User-reported failure
The Supabase Dashboard Auth > Users > Create user form returned:
`Failed to create user: Database error creating new user`
for the intended staging administrator email `a.dridi06@web.de`.

## Root cause confirmed
The `auth.users` INSERT trigger `on_auth_user_created_myscouting_private` invokes `private.handle_new_user()`.
The previous trigger required `new.raw_user_meta_data->>'username'` to be present and match `^[a-zA-Z0-9._-]{3,32}$`.
The Dashboard's Create User form did not provide this metadata, so the trigger raised an exception and rolled back user creation. This is a confirmed implementation mismatch, not a password failure.

## Fix implemented
- Added migration `supabase/migrations/20261126170000_auth_signup_username_fallback.sql`.
- Commit: `9589d02055361e0a0064a5d521ec71fe3b93d6ca`.
- The trigger now preserves a valid supplied username; when absent/invalid it derives a safe username from the email local-part and appends an 8-character UUID suffix, keeping the value within the 32-character constraint.
- The trigger retains SECURITY DEFINER, empty search_path, serialized scout-limit check, pending/unapproved default scout role, and sequence-based scout number.
- No user-controlled metadata can grant admin rights. Admin promotion remains a separate server-side operation after account creation.

## Database application and verification
- Applied migration successfully to staging only via Supabase migration operation.
- Re-read `pg_get_functiondef(private.handle_new_user)`; returned definition contains the fallback logic.
- Staging `public.profiles` count remains 0 after the fix check; no user was created by the migration.
- The user should retry creating the staging account now. Do not repeatedly retry if another error appears; capture the exact message.
- After successful creation, verify matching `auth.users` and `public.profiles` rows, inspect the generated profile, then promote only the exact intended account to admin via a privileged server-side operation. Do not set or handle the user's password through SQL or chat.

## Current status / next step
- Trigger fix: applied and definition verified in staging.
- Admin account: not yet created; no auth user/profile has been created yet.
- Login: not yet testable.
- Next action: user retries Dashboard Auth > Users > Create user for `a.dridi06@web.de`. If successful, verify user/profile linkage and then perform the narrowly scoped admin-role assignment. If it fails, inspect the new exact error before any further change.
- No production resources, credentials, data, or deployments were touched.
