# MESSINHO Admin myKI — Engineering Proposal Inbox

Status: accepted product requirement; implementation pending.
Target: staging only, branch `feature/messinho-unified-ai-integration`.
Owner decision: only an authenticated, approved Admin may view or decide on engineering tickets.

## 1. Purpose

Add a dedicated **myKI** workspace to the existing Admin area. It is the controlled inbox for improvements MESSINHO has independently designed and evaluated. It is not a general chat, Scout support queue, or player/scouting ticket system.

MESSINHO may create a ticket only when it has a concrete, reviewable improvement proposal. It must not create placeholder tickets, duplicate tickets for the same proposal, or tickets merely to report routine work.

## 2. Ticket content

Each ticket has a server-generated immutable ID, e.g. `MYKI-2026-000001`, plus:
- concise title and creation timestamp;
- plain-language explanation: what was improved, what problem it solves, and what changes for the user/system;
- technical detail: affected files/components, bounded diff/artifact reference and proposal fingerprint;
- why MESSINHO believes it is better, with baseline and candidate benchmark IDs;
- test results, including tests actually run, counts, build result, security review, tenant-isolation review and resource budget;
- known risks, limitations, dependencies and rollback plan;
- lifecycle status and append-only status/error history;
- source commit and staging validation/deployment evidence where applicable.

Do not expose secrets, credentials, private player/scout records or unnecessary personal data in ticket content. The copy payload must be sanitized.

## 3. Ticket lifecycle

Allowed states:
- `submitted`: proposal ticket created;
- `reviewing`: Admin has opened/reviewed it;
- `ready_for_staging`: proposal passed deterministic proposal validation and all required independent gates;
- `integrating`: Admin explicitly selected Integrate; isolated staging process started;
- `integration_failed`: a test/build/security/deploy/health step failed; include safe, human-readable error and diagnostic reference;
- `integrated`: integration and required verification completed successfully;
- `deleted`: Admin explicitly selected Delete; preserve minimal audit tombstone (do not erase audit evidence).

Transitions must be server-validated and atomic. Duplicate clicks/retries must be idempotent. A ticket must never become `integrated` merely because a job was queued or a deployment was requested.

## 4. Admin UI

Add **myKI** as a distinct item in the Admin navigation, visually consistent with the current black/gold design and responsive on mobile.

Inbox:
- list tickets newest first;
- show ticket ID, title, creation date, status and a compact verification indicator;
- empty state explains that MESSINHO has not submitted a verified improvement proposal yet;
- only approved Admins can load this page or its API.

Ticket detail:
- readable plain-language explanation first;
- expandable technical details, tests, risks and rollback;
- prominent **Kopieren** action copies the complete sanitized review packet, including ticket ID, proposal/diff, test evidence, risk notes and hashes; show success/failure feedback;
- **Integrieren** and **Löschen** actions, with clear confirmation for destructive/long-running actions;
- visible timeline of status changes and errors.

## 5. Integration semantics and safety

The Integrate button is an Admin authorization to begin a controlled integration workflow, not permission for MESSINHO to bypass engineering controls.

Required sequence:
1. Re-authenticate/check approved Admin and verify ticket ownership/scope.
2. Revalidate ticket fingerprint and protected-path policy.
3. Apply only in a disposable isolated workspace derived from the approved staging branch snapshot.
4. No production credentials, Supabase service-role secrets, Render secrets or player/scout mutation routes in the workspace.
5. Run allowlisted tests/build/security/tenant-isolation/resource checks in a sandbox with no network by default and strict budgets.
6. On any failure: preserve current staging version, record safe error details, mark `integration_failed`, and offer a retry only after correction/review.
7. On success: create a separately traceable staging change; require deployment approval/normal staging deployment procedure; verify exact commit, health and smoke tests.
8. Mark `integrated` only after successful staging verification. Production remains untouched and requires separate explicit authorization.

Until the isolated executor and security boundary are proven, the button must not execute patches or claim success. It may report that integration is blocked pending the safe executor. Do not fake an integration by only changing the ticket status.

## 6. Delete semantics

Delete is Admin-only and removes the ticket from the active inbox. Keep a minimal immutable audit tombstone with ticket ID, actor, timestamp, action and proposal fingerprint; do not retain secrets or unnecessary copied diff content. Deletion must not delete source code, knowledge, player data, scout accounts or other records.

## 7. Error and success reporting

Errors must be persisted with a stable error code, stage, timestamp and safe user-facing German explanation. Never expose stack traces, secrets, environment values or raw provider responses to the UI. Admin diagnostics may reference a protected server-side log ID.

Success notification appears only after tests and staging health checks pass. Include the ticket ID, integrated version/commit, tests and verification time. If only CI passed but no staging deploy/health verification occurred, report **CI erfolgreich — noch nicht integriert**.

## 8. Backend and database requirements

- Separate myKI engineering tickets from Scout support tickets and player/scouting records.
- Use dedicated tables or a similarly isolated store for tickets and append-only events; no player/scout table reuse.
- Enforce approved-Admin authorization server-side on list/detail/copy payload/action endpoints. UI hiding is not authorization.
- Ticket creation is service-to-service only from a trusted MESSINHO proposal pipeline; clients cannot forge a ticket as MESSINHO.
- Generate IDs server-side; enforce unique proposal fingerprint/idempotency key to prevent duplicate tickets.
- Validate all fields, bound diff sizes, sanitize output, and treat ticket text/diffs as untrusted content.
- Store no secrets. Restrict artifact access. Add retention limits for rejected/expired drafts while preserving audit events.
- No database migration until schema, RLS, service-role paths, backup and rollback are reviewed. No migration or data write is authorized by this specification.

## 9. Acceptance tests

1. Scout and unauthenticated users cannot discover, list, read, create, copy or mutate myKI tickets.
2. Non-approved Admin cannot use any endpoint.
3. Approved Admin can list and inspect tickets and copy a sanitized packet.
4. MESSINHO cannot create empty, duplicate, forged or unvalidated tickets.
5. ID is unique, immutable and server-generated.
6. Invalid status transitions and forged client-side success are rejected.
7. Delete requires Admin authorization and preserves the audit tombstone.
8. Integrate rejects stale fingerprints, protected files, migrations, secrets, unsafe commands and network access.
9. Sandbox test/build/security/tenant-isolation failure records a safe error and never marks integrated.
10. A successful staging integration records exact commit, test evidence, deployment and health verification before success notification.
11. Player/scout data, roles, permissions, security controls, knowledge rights registry and production remain unchanged.
12. Copy action works on desktop/mobile and provides visible success/failure feedback.
13. UI follows current black/gold styling and responsive layout; no new duplicate chat or ticket system.

## 10. Implementation sequence

A. Inspect current Admin navigation, auth middleware, existing ticket patterns and current staging branch head.
B. Implement dedicated ticket domain model, validation, idempotency and audit lifecycle with unit tests.
C. Implement server-side Admin endpoints and authorization tests.
D. Implement myKI Admin UI and copy/status/error interactions.
E. Integrate trusted proposal submission from the proposal gate, without enabling patch execution.
F. Build isolated staging executor only after security review; connect Integrate only when executor passes acceptance tests.
G. Run full CI; manually deploy staging only with explicit approval; verify exact deployed commit and health.
H. Update PROJECTSCOUT.md after each meaningful milestone.

No production/main/PFMS/PFSS changes, no Supabase writes/migrations, no Render deployment, no autonomous patch execution, and no changes to guardrails are authorized by this specification.
