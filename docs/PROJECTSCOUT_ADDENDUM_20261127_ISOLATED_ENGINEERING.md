# MESSINHO Engineering Sandbox — Addendum 2026-11-27

## Accepted direction

The owner confirmed the next major engineering step:
- isolated temporary programming environment;
- real language compilers and test tools;
- automated diagnose → develop → test → compare → improve loop;
- durable programming memory backed by evidence;
- administrator-controlled promotion into the actual project.

## First implementation increment

Added:
- `.github/sandbox/Dockerfile`: dedicated multi-language compiler/tooling image.
- `.github/workflows/messinho-isolated-engineering.yml`: GitHub Actions runner for the exact feature-branch candidate SHA.
- `docs/MESSINHO_ISOLATED_ENGINEERING_SANDBOX.md`: security boundary, toolchain scope and remaining work.

The workflow downloads dependencies on the host with npm lifecycle scripts disabled, then executes project tests/build and compiler smoke checks in a network-disabled, unprivileged, resource-limited Docker container. The source and dependency mounts are read-only; only ephemeral tmpfs paths are writable. The workflow receives read-only repository permission and no application secrets.

## Explicit limitations

This is the first isolated validation runner, not yet a fully autonomous live coding agent. It does not yet accept jobs from the running MESSINHO service, apply model-generated patches, perform iterative repair, store durable engineering evidence in Supabase, or create review branches. .NET SDK is not yet part of the tool image. SQL has client availability only, not a disposable database integration test. These limitations must remain visible in product status.

## Safety and release state

- Branch: `feature/messinho-unified-ai-integration`
- Production `main`: untouched.
- Render STAGING: no deployment triggered.
- Supabase: no schema or data changes.
- The new workflow must complete successfully against its exact commit before this increment is called verified.
- Any future code transfer remains behind explicit administrator approval.
