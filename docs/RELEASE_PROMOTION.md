# Controlled Staging → Production Promotion

Last reviewed: 2026-11-26

## Purpose

This repository uses a release-candidate flow. Staging is the integration and verification environment; production is a separately protected target. The objective is to promote a known, tested commit—not to copy a moving development branch into production.

## Environment boundaries

| Concern | Staging | Production |
|---|---|---|
| Git branch | `feature/messinho-unified-ai-integration` (target candidate) | `main` |
| Render service | `myscoutingdatabase-messinho-staging` | `myscoutingdatabase` |
| Supabase project | `myScoutingDatabase-staging` | Separate production project |
| Data | Synthetic/test data only unless explicitly approved | Existing user and scouting data |
| Secrets | Staging-only credentials | Production-only credentials |

Never copy service-role keys, JWT secrets, provider keys, user data, or database dumps from one environment to the other. Configure each environment independently in its secret manager.

## Promotion path

1. **Freeze a candidate.** Work on the integration branch. Record the exact commit SHA and do not deploy an unreviewed moving branch.
2. **Automated gates.** Require dependency installation, all Node tests, frontend production build, and any repository-specific validation workflows to pass.
3. **Review the change set.** Inspect the complete diff against the current `main`; check authorization, owner/organization scoping, RLS, migrations, logging, retention, provider fallback, and rollback behavior.
4. **Database rehearsal.** Apply only the reviewed migration files to the staging Supabase project. Verify migration history, RLS policies, indexes, and representative reads/writes. Never run staging migration commands against production.
5. **Staging deployment.** Deploy the exact candidate SHA to the staging Render service. Verify the service's configured branch, deployed commit, health endpoint, startup logs, and required environment variables.
6. **End-to-end acceptance.** Test login/roles; existing chat behavior; ASI search and source evidence; capability planning/execution; memory isolation between two test users; task checkpoint/resume after interruption; provider unavailable fallback; and mobile UI. Record results and known limitations.
7. **Release approval.** Produce a release note, migration plan, backup/restore plan, rollback commit, and explicit list of production environment changes. Production remains untouched until the owner explicitly approves the release in the current conversation.
8. **Production promotion.** Promote the same reviewed commit through a pull request to `main`. Apply only approved production migrations after a verified backup and explicit approval. Configure production secrets independently, deploy, then run smoke tests.
9. **Post-release verification.** Confirm the exact production commit, health, auth, chat, ASI and core CRUD. Monitor errors and database health. If a gate fails, stop rollout and use the recorded rollback plan.

## MESSINHO integration invariants

- Preserve the existing LIVE chat, ASI research, deterministic scoring, learning safeguards, 100-capability registry/runtime, role checks, and owner-scoped access.
- The agent core coordinates bounded planning, execution and validation; it does not replace specialist modules or make OpenAI the MESSINHO identity.
- Memory, traces and task checkpoints are server-managed. Every query and mutation must be scoped to the authenticated owner. Client roles must not gain service-role write access.
- A task is resumable only from validated persisted checkpoints. Do not replay completed side effects blindly; use idempotency or explicit safe-resume rules.
- Model learning produces proposals only. No active model weights may change without holdout evaluation and authorized approval.
- Streaming disconnects must leave a bounded, recoverable task state; errors must not expose secrets, provider responses, or another user's data.

## Current candidate status (2026-11-26)

- Candidate branch: `feature/messinho-unified-ai-integration`.
- PR: [#47 — Integrate existing LIVE AI with MESSINHO agent core](https://github.com/Dridi06/myScoutingDatabase/pull/47).
- The existing LIVE chat/capability path has the bounded agent core integration and unit tests.
- Staging memory and task-ledger migration definitions are included here for review and reproducibility; inclusion does not mean they have been applied to production.
- The complete staging memory/task execution path, live-data context, deployment and end-to-end acceptance remain release gates until verified on this candidate.
- No production deployment or production database mutation is part of this candidate work.

## Release checklist

- [ ] CI tests pass on the exact candidate SHA
- [ ] Production frontend build passes
- [ ] Diff reviewed against current `main`
- [ ] Memory/task schema reviewed and staging migrations rehearsed
- [ ] RLS and cross-user isolation tests pass
- [ ] Staging secrets configured independently and validated
- [ ] Staging deployed at the exact candidate SHA
- [ ] Existing chat, ASI, OpenAI fallback and all key capability families pass E2E
- [ ] Task interruption/resume and idempotency verified
- [ ] Mobile/login/role regression checks pass
- [ ] Backup and rollback procedure tested/documented
- [ ] Owner explicitly approves production promotion
