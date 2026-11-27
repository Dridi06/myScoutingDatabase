# MESSINHO isolated engineering sandbox

## Purpose

Provide MESSINHO with a disposable software-engineering workspace that is separate from the Render application process and production data. This first increment establishes a real isolated validation runner; it does not yet give the live agent an API to submit arbitrary jobs.

## Execution boundary

- GitHub Actions checks out the exact candidate commit SHA.
- The host downloads dependencies with lifecycle scripts disabled.
- Candidate tests and build scripts execute only inside a dedicated Docker container.
- The container has no network, no secrets, no GitHub token, no Render/Supabase credentials and no persisted writable repository mount.
- Source is mounted read-only; dependencies are mounted read-only.
- The writable work and temporary directories are ephemeral tmpfs mounts.
- The container runs as an unprivileged user with dropped Linux capabilities, no-new-privileges, read-only root filesystem, 3 GiB memory limit, 2 CPU limit, 128 process limit and a 12-minute execution timeout.
- The workflow has read-only GitHub contents permission and checkout credentials are not persisted.
- The workflow is restricted to the MESSINHO feature branch and pull requests whose head branch is that feature branch. It does not run candidate code from arbitrary fork branches.
- It never deploys, pushes, opens a PR, edits project files in Git, or writes to application databases.

## Initial toolchain coverage

The image installs Node.js/npm, TypeScript, Python/pytest, Java/JDK/Maven, Go, Rust/Cargo, C/C++ compilers, PHP/PHPUnit/Composer, Bash/ShellCheck, PostgreSQL client, HTML validator and Stylelint.

The workflow performs toolchain smoke checks plus the existing project test/build pipeline. A tool being installed does not mean every language has full project-level test coverage. .NET SDK is not included in this first image and must be added before claiming C# compilation support. SQL client availability is not a substitute for a safe disposable PostgreSQL test database.

## Not yet implemented

1. Live MESSINHO job submission API with strict schema, authentication and per-job budgets.
2. Per-task workspace creation, source allowlist, archive/path traversal checks and cleanup.
3. Candidate patch application inside the disposable workspace and repeated test/repair iterations.
4. Baseline-versus-candidate result comparison and structured evidence capture.
5. Durable programming-memory ledger with source SHA, toolchain image digest, commands, exit codes, logs, test counts, metrics, reviewer and approval state.
6. Admin approval UI and controlled creation of a review branch/PR. No merge or deployment is automatic.

## Promotion policy

A successful sandbox run is evidence for the exact source SHA only. It is not permission to modify the running application. A proposed change must be presented to an administrator with a unified diff, test evidence, limitations and rollback plan. The owner must explicitly approve any transfer into the project branch. Staging release remains a separate, manually controlled step; production remains protected.
