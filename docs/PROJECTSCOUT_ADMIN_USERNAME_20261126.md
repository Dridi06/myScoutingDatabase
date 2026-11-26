# PROJECTSCOUT Addendum — Admin username updated — 2026-11-26

- Scope: staging only, Supabase project ref `nwqwnrhupbyhshsprxjt`.
- Target account: `a.dridi06@web.de`, UUID `be1755ae-d2cf-45ad-b536-0f90d0874609`.
- User confirmed successful login to the staging application before this change.
- Updated the exact matching admin profile username from `a.dridi06-be1755ae` to `Admin`.
- The case-insensitive unique username index was present; update was guarded against collision and succeeded.
- Verified returned profile: username `Admin`, role `admin`, approved `true`, approval_status `approved`.
- Email and password were not changed. No auth user was recreated.
- Production resources and data untouched; Render auto-deploy remains disabled.
- Next: user should sign out and sign back in with username `Admin` and the same password, to verify the login lookup resolves the new username. Existing session may remain valid until sign-out.
