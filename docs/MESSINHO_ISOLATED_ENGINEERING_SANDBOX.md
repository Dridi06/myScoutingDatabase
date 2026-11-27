# MESSINHO isolated engineering sandbox

## Purpose

MESSINHO has a disposable software-engineering workspace separated from the Render application process, production data and application credentials. The sandbox is a validation boundary, not an autonomous production deployment mechanism.

## Current architecture

1. The Admin-only myKI ticket flow can submit a bounded candidate diff for isolated validation. The live autonomous agent is not permitted to submit arbitrary code or bypass the Admin review boundary.
2. The backend binds each job to a ticket ID, exact feature-branch source SHA, patch SHA-256 and unique job ID. It rejects stale source revisions, malformed jobs and patches outside the fixed allowlist.
3. GitHub Actions checks out the exact source SHA. Workflow-dispatch payload validation checks the branch, source revision, ticket/job identities, patch size, allowed paths and patch hash.
4. The runner copies source and dependencies into a disposable workspace. It applies the patch only there, never to the repository checkout or running Render application.
5. The baseline and candidate each run the project build. The package build runs the Node test suite, backend syntax checks and Vite production build. Changed files additionally receive language-specific checks where supported.
6. The workflow returns bounded evidence through a GitHub OIDC-authenticated callback. The staging backend verifies the GitHub Actions identity and binds the result to the source SHA, run ID and attempt before persisting it.
7. Admin review remains separate. Integration into the project branch and deployment are not automatic; the integration endpoint currently fails closed.

## Execution boundary

- The Docker container has no network, secrets, GitHub token, Render/Supabase credentials or writable repository mount.
- Source and dependency mounts are read-only.
- Only ephemeral `/work` and `/tmp` tmpfs mounts are writable; they have execution enabled for native toolchain libraries.
- The container runs as an unprivileged user with dropped Linux capabilities, no-new-privileges, read-only root filesystem, 3 GiB memory limit, 2 CPU limit and 128 process limit.
- Docker execution is bounded by a 15-minute timeout; the GitHub job has a 30-minute timeout.
- Host dependency installation disables lifecycle scripts. Candidate code is executed only inside the isolated container.
- GitHub Actions workflow permissions are read-only for repository contents plus OIDC identity issuance for the staging evidence callback. Checkout credentials are not persisted.
- Workflow runs are restricted to the MESSINHO feature branch and approved pull-request head branch. Arbitrary fork branches are not executed.
- The runner does not push, create branches, open pull requests, deploy, or write to application databases.

## Toolchain

The image includes Node.js, TypeScript, Python/pytest, Java/JDK/Maven, Go, Rust/Cargo, C/C++ compilers, PHP/PHPUnit/Composer, Bash/ShellCheck, PostgreSQL tools, HTML validator, Stylelint and .NET SDK.

A tool being installed is not proof that every language has full project-level test coverage. SQL files are not automatically executed against production or staging; database changes require a separate disposable schema fixture and explicit validation. The runner's current general project test/build path is the repository's npm build script, which runs the project tests, backend syntax checks and Vite production build.

## Verified baseline result — 2026-11-27

- Source commit: `bd45f706d04f85f7b0ee95ac00445c23d4ff5646`.
- GitHub Actions isolated job: successful.
- Project tests: **466 passed, 0 failed**.
- Vite production build: successful; 1,640 modules transformed.
- Toolchain smoke checks: successful for the installed toolchain.
- Disposable PostgreSQL engineering-memory contract: successful; duplicate evidence was recognized and the contract assertion passed.
- Sandbox outcome: `toolchain_smoke_passed`.

This run validated the baseline project and toolchain. It did **not** submit a real candidate patch through the Admin ticket endpoint. Therefore it is not proof of a complete live ticket-to-callback end-to-end run.

## Implemented but not yet end-to-end verified

1. Admin-only sandbox dispatch from an eligible myKI ticket, with a fixed file allowlist and pinned source revision.
2. Candidate patch application in a disposable workspace, candidate build/test execution and changed-file language checks.
3. OIDC-authenticated evidence callback and durable engineering-result persistence.
4. Admin review surfaces and a fail-closed integration endpoint.

These paths exist in code, but the current baseline run did not exercise a real dispatched candidate. The complete staging round trip still needs an authenticated Admin test using a harmless, intentionally small candidate patch, followed by verification of the persisted job, callback evidence, ticket event and Scout denial.

## Not yet implemented or not yet proven

1. Repeated autonomous repair iterations (diagnose → propose → patch → test → compare → refine) with strict iteration and resource budgets.
2. A robust baseline-versus-candidate quality comparison beyond successful build/test completion. Domain-specific metrics and regression thresholds must be defined per patch.
3. A complete live staging round trip from Admin ticket dispatch through GitHub workflow, OIDC callback and durable evidence record.
4. Automatic candidate retry/repair orchestration. No unbounded loops are allowed.
5. Independent security review and full authorization/tenant-isolation E2E tests for the complete myKI workflow.
6. Full end-to-end tests for the Admin UI, Scout privilege denial and ticket lifecycle.
7. Toolchain image digest pinning and durable storage of the exact image digest, command manifest and artifact hashes in every engineering record.

## Promotion policy

A successful sandbox run is evidence for the exact source SHA and patch SHA only. It is not permission to modify the running application. A candidate must be presented to an administrator with its diff, test evidence, limitations and rollback plan. Only an explicit Admin decision may authorize the next integration step. Staging deployment remains separate and manually controlled. Production remains protected.
