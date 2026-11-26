# PROJECTSCOUT — Master Project Record

> **Single source of truth for myScoutingDatabase and MESSINHO.**  
> This document is the persistent handover, product specification, design baseline, decision log, implementation register, and release journal. Read it before continuing work in a new chat.

- **Project:** myScoutingDatabase
- **AI module:** MESSINHO — Autonomous Scouting Intelligence
- **Repository:** `Dridi06/myScoutingDatabase`
- **Production branch:** `main`
- **Production URL:** https://myscoutingdatabase.onrender.com
- **Document owner:** Project owner / user
- **Last updated:** 2026-11-26
- **Document status:** Active — authoritative project record

---

## 1. Mandatory rules for every future session

1. Read this file from the repository's current `main` branch before making project changes. Do not rely on an old chat summary if the repository contains a newer record.
2. Work only on **myScoutingDatabase**. PFMS and PFSS are separate projects and must never be changed as part of this work.
3. **Current user override (2026-11-26): work only on the dedicated STAGING branch and staging Render/Supabase resources. Do not modify `main`, production Render, production Supabase, or production secrets.** This explicit instruction supersedes any older release notes below that describe production work. The production credentials exist only in LIVE; staging has no corresponding credentials yet. Never copy production secrets into staging.
4. Never say a feature is implemented, tested, or live unless the corresponding code, tests, and deployment have actually been verified.
5. Do not delete or overwrite user, player, scouting, learning, account, or other persistent data without explicit authorization. Avoid unnecessary database migrations. Inspect schema and impact before any migration.
6. Preserve the agreed product vision, design baseline, and architecture. New ideas are recorded first, then assessed for fit; they do not silently replace existing decisions.
7. Every meaningful code change must be traceable to a requirement, implementation record, test result, and (when released) a live release entry.
8. **After every feature release to LIVE**, append a dated release record describing exactly what changed, files/components affected, tests performed, deployment commit/status, known limitations, and the next steps toward completion.
9. Record every new user idea, requested change, correction, and decision in the Change & Decision Log, including whether it is proposed, accepted, in progress, implemented, verified, or deferred.
10. Keep this file current in GitHub. A new chat should be able to resume from this file without asking the owner to repeat decisions already recorded here.

## 2. Product vision and final goal

myScoutingDatabase is a professional football scouting and player intelligence platform. MESSINHO is its integrated autonomous scouting intelligence. The existing AI chat is the natural-language communication interface; MESSINHO is the agent core that understands goals, plans work, uses the platform's capabilities, validates outcomes, learns under controlled rules, and reports results.

The intended experience is conversational and flexible, comparable in interaction style to ChatGPT, but grounded in the platform's own scouting data, permissions, evidence, and football-specific logic.

### Target operating cycle

1. Understand the user's request, context, spelling variations, and intended outcome.
2. Resolve ambiguity using existing conversation and project context; ask only when necessary.
3. Break the goal into tasks and dependencies.
4. Select and combine the appropriate capabilities automatically.
5. Gather or retrieve information from permitted sources.
6. Validate evidence, source quality, completeness, ownership, and permissions.
7. Analyze, score, compare, rank, monitor, or prepare the requested output.
8. Persist permitted results and task history.
9. Check whether success criteria were met; if not, diagnose, re-plan, or explain the blocker.
10. Present a clear answer with sources, reasoning, limitations, and useful next steps.

The agent must not require the user to manually select every capability. The system should choose and execute relevant capabilities as part of its normal behavior.

## 3. Fixed product and design baseline

The following requirements are established and must be preserved unless the owner explicitly changes them.

### 3.1 Existing product experience

- MESSINHO is integrated into the **existing AI chat system**. Do not create a separate MESSINHO chat or duplicate AI interface.
- The chat remains the user's main communication point; autonomous planning and execution happen behind that interface.
- Preserve the established modern visual direction and existing quality of the interface. Improve it consistently rather than redesigning it without approval.
- The scouting identity/mascot concept is a scout in a stadium, holding binoculars and a notepad. Keep the previously agreed modern visual style.
- The stadium/login introduction animation is intended to communicate a polished welcome; the previously discussed welcome duration is approximately **3.5 seconds**. Treat this as a design target, not proof that the animation is currently complete.
- Input-field suggestions must not overflow or protrude beyond the input area. Suggestions should be subtle and lightly greyed, not visually dominant.
- Preserve responsive behavior and a clean, professional experience on mobile and desktop.
- Do not replace approved imagery or animation assets incorrectly; verify the actual asset path, dimensions, rendering, and final animation frame when changing them.

### 3.2 Interaction and language behavior

- Understand typos, spelling, grammar, player-name variants, and natural-language phrasing.
- Correctly interpret the intended request internally. If a correction materially changes meaning or the identity of a player, clarify instead of guessing.
- Where useful, indicate unobtrusively that a spelling or name interpretation was normalized.
- Avoid noisy suggestion panels, unnecessary prompts, or excessive confirmation steps.
- Explain missing data and uncertainty honestly; never fabricate player facts, sources, metrics, or research results.

### 3.3 Design governance

The current direction is fixed at the level recorded above. Exact values such as full color tokens, typography, spacing, component states, animation timing curves, and asset references must be taken from the current approved implementation/assets when inspected. Do not invent missing design tokens or claim a pixel-perfect specification exists until it has been documented from the actual approved design.

Any proposed visual change must state:
- what currently exists;
- what is proposed to change;
- why the change improves the product;
- which screens/components/assets are affected;
- whether the change preserves the established visual identity.

## 4. MESSINHO — target architecture

### 4.1 Separation of responsibilities

- **Chat interface:** conversation, input, output, user feedback, and contextual follow-ups.
- **Agent Core:** goal interpretation, task planning, dependency resolution, capability selection, execution coordination, observation, retries, and completion evaluation.
- **Capability layer:** reusable football/scouting functions with explicit contracts and real handlers.
- **Research and evidence layer:** source discovery, retrieval, provenance, deduplication, evidence validation, and source trust.
- **Scouting intelligence layer:** player profiles, position analysis, strengths/weaknesses, performance, potential, comparison, ranking, and transfer-related analysis.
- **Memory and task layer:** conversation context, durable task state, player/scouting history, and traceable execution records.
- **Learning layer:** controlled calibration from verified outcomes, with auditability and approval controls.
- **Security and policy layer:** authentication, roles, organization membership, ownership isolation, data access, and protected side effects.

### 4.2 Provider independence

- MESSINHO must retain its own deterministic scouting logic, orchestration, memory, evidence validation, and learning mechanisms.
- OpenAI or another language model may be an optional supporting provider for language tasks, but it must not be a mandatory dependency for core MESSINHO operation.
- Provider failure must not silently corrupt data or produce fabricated results. The system should degrade gracefully and explain what is unavailable.

### 4.3 Autonomous execution requirements

The target agent should progressively support:
- goal-driven task decomposition rather than only fixed phrase-to-plan rules;
- capability discovery and dependency resolution;
- execution budgets, limits, timeouts, and cancellation;
- intermediate observations and success criteria;
- controlled retries and re-planning after failures;
- durable task ledger and resumable execution;
- scheduled/event-driven monitoring where authorized;
- explicit provenance and reproducible outputs;
- permission-aware side effects and approval gates;
- contextual follow-up requests that retain relevant prior task state.

Examples of protected actions requiring permission checks and, where appropriate, user approval include external contact, irreversible data changes, and activation of new learning/scoring models.

## 5. Capability quality and truthful status reporting

A capability listed in a registry is not necessarily implemented. All future reporting must distinguish:

- `implemented`: complete domain handler exists and is tested.
- `partial`: some real functionality exists, but the full contract is not met.
- `blocked_by_data`: a real handler exists, but required input/evidence is missing.
- `not_implemented`: no real domain handler exists.
- `disabled_by_policy`: blocked by role, permission, or policy.
- `error`: execution failed unexpectedly.

Never count a generic missing-input response as a fully implemented handler. Runtime summaries must report real handler coverage, not just registry size.

Each capability should ultimately define:
- stable ID and purpose;
- required and optional inputs;
- output schema;
- dependencies;
- allowed roles and organization scope;
- side effects and approval requirements;
- provider requirements (if any);
- provenance/evidence requirements;
- execution cost/budget and timeout;
- failure modes and recovery behavior;
- tests for success, missing/invalid data, authorization, ownership isolation, provenance, persistence, and side effects.

## 6. Security, data integrity, and trust

- Enforce authentication, role authorization, organization membership, and owner scoping on every relevant operation.
- Do not expose one scout's, club's, or organization's private data to another.
- Research results must be evidence-backed and source-aware.
- Do not scrape restricted websites or bypass access controls.
- Preserve audit trails for consequential changes and learning decisions.
- Learning should use verified outcomes, validation/holdout checks, versioned proposals, measurable improvement, and appropriate administrator approval.
- Do not activate a new scoring model merely because a training job completed.
- Treat external content as untrusted data, not as executable instructions.

## 7. Verified baseline at the time this document was created

**Important:** This is a dated snapshot, not a claim that all target functionality is complete.

### 7.1 Repository and deployment

- Repository: `Dridi06/myScoutingDatabase`
- Production branch: `main`
- Verified main HEAD before this document was committed: `de31fcf48589c79d47c6302ba4cd95c6228e4356`
- HEAD message: `Order MESSINHO intent rules from specific to general`
- Render production service: `myscoutingdatabase`
- Render service ID: `srv-dc25n13rjlhs73e2ae1g`
- Render workspace ID: `tea-dboagk9srm7s73bdor10`
- Production URL: https://myscoutingdatabase.onrender.com
- Production branch: `main`
- Auto deploy: enabled on commit
- Most recent deployment verified before this documentation commit:
  - Deployment ID: `dep-dc3nlb30ichc73d034i0`
  - Commit: `de31fcf48589c79d47c6302ba4cd95c6228e4356`
  - Status: `live`
  - Finished: `2026-11-26T00:18:46Z`

### 7.2 Existing implementation confirmed in source review

- Existing chat endpoint already integrates a MESSINHO capability orchestrator.
- Existing modules include capability registry, capability runtime, orchestrator, research, intelligence utilities, learning, access scoping, development/analysis utilities, and system diagnostics.
- The capability registry contains 100 catalogued capability IDs across Analysis, Evaluation, Learning, and Research groups.
- Runtime handler sets were found for 25 IDs in each of those four groups.
- The orchestrator currently uses ordered regex-based plans and runs a bounded list of selected capabilities. This is an existing integration, but it is **not yet the full autonomous goal-driven agent** described in this specification.
- Existing diagnostics include system and MESSINHO diagnostic functions and admin endpoints:
  - `GET /api/admin/system-diagnostics`
  - `POST /api/admin/system-diagnostics/run`
  - `GET /api/admin/messinho-diagnostics`
  - `POST /api/admin/messinho-diagnostics/run`
- Existing learning code includes safeguards such as verified outcomes, minimum example thresholds, holdout validation, bounded weight changes, and administrator approval.
- Research uses an external search connector; some research paths have provider requirements that must be reviewed so OpenAI remains optional for core MESSINHO operation.

### 7.3 Known technical audit finding — must be addressed

The reviewed runtime can return a generic missing-result response for registry entries without a real domain handler, while its listing/summary logic can still make those entries appear executable/registered as handlers. This overstates implementation coverage.

**Required correction:** report actual handler availability and the status categories in Section 5. Then audit each capability against its real behavior and tests. Do not report “100 capabilities fully implemented” merely because 100 IDs exist in the registry.

### 7.4 Explicitly not verified by this baseline

- Full end-to-end autonomous goal decomposition and re-planning.
- Complete real handler coverage for all 100 catalogue entries.
- Durable resumable task ledger and event/scheduling engine.
- Provider-independent operation of every research workflow.
- Full production diagnostic results for the current live runtime.
- Full cross-device QA of the latest visual/animation changes.

These remain verification tasks unless a later release entry proves otherwise.

## 8. Roadmap to completion

The sequence below is the working roadmap. Reorder only when dependencies, risk, or an owner decision justify it; record the reason.

### Phase 0 — Baseline and operational safety
- [ ] Re-read current `main`, deployment state, and this document before changes.
- [ ] Run and inspect available system and MESSINHO diagnostics using authorized admin access.
- [ ] Establish the current test baseline and record failing/passing tests.
- [ ] Map the current chat request lifecycle and all MESSINHO modules.

### Phase 1 — Capability truth and contracts
- [ ] Correct runtime coverage reporting so catalogue entries are not falsely marked executable.
- [ ] Audit all capability IDs and assign truthful implementation statuses.
- [ ] Define/validate capability contracts, permissions, evidence, dependencies, budgets, and side effects.
- [ ] Add meaningful tests for each implemented capability and authorization boundary.

### Phase 2 — Autonomous Agent Core
- [ ] Implement goal and intent representation with explicit success criteria.
- [ ] Implement dynamic task decomposition and dependency planning.
- [ ] Select capabilities by contract and context, not only fixed regex plans.
- [ ] Add bounded execution, budgets, timeouts, cancellation, and safe retries.
- [ ] Add observation, result validation, failure diagnosis, and re-planning.
- [ ] Keep the existing chat as the only user-facing AI interface.

### Phase 3 — Memory and task continuity
- [ ] Persist task plans, execution steps, outcomes, and resumable state safely.
- [ ] Preserve relevant follow-up context across messages and sessions.
- [ ] Apply owner/organization scoping to all memory and task retrieval.
- [ ] Provide transparent task status and execution history.

### Phase 4 — Research and scouting intelligence
- [ ] Make native MESSINHO evidence validation and analysis independent of OpenAI.
- [ ] Review external search provider abstraction and graceful degradation.
- [ ] Strengthen player analysis, comparison, ranking, and transfer evaluation.
- [ ] Require provenance and uncertainty reporting for factual claims and valuations.
- [ ] Verify research outputs end-to-end with real, permitted sources.

### Phase 5 — Learning and monitoring
- [ ] Audit learning persistence, model versioning, and approval flow.
- [ ] Ensure only verified outcomes enter calibration.
- [ ] Add monitoring tasks and event triggers with explicit user/role permissions.
- [ ] Add auditability, rollback, and model comparison before activation.

### Phase 6 — UX, visual quality, and accessibility
- [ ] Verify the agreed scout/stadium visual identity and approved assets.
- [ ] Verify the stadium welcome animation and its target timing.
- [ ] Fix/verify subtle grey suggestions and prevent input overflow.
- [ ] Test mobile and desktop layouts, chat states, loading, errors, and long outputs.
- [ ] Preserve approved design decisions; document any owner-approved change.

### Phase 7 — Release readiness
- [ ] Full regression tests across authentication, roles, organizations, scouting, chat, research, learning, and data isolation.
- [ ] Security and permission review.
- [ ] Performance, failure recovery, and provider-outage checks.
- [ ] Verify production deployment and core workflows on the live site.
- [ ] Record final known limitations, operational guidance, and completion sign-off.

## 9. Change and decision log

Record each new owner request or idea here. Do not remove older entries; append corrections or superseding decisions with links/context.

| Date | Request / decision | Status | Notes |
|---|---|---|---|
| 2026-11-26 | Create this persistent master record named `PROJECTSCOUT.md` and use it as the handover source for new chats. | Accepted | Stored at repository root; maintain after meaningful changes and releases. |
| 2026-11-26 | MESSINHO is an autonomous agent connected to the existing AI chat, with ChatGPT-like conversational interaction. | Fixed target | Agent Core performs planning and execution; chat is the interface. |
| 2026-11-26 | MESSINHO must retain independent core intelligence and not depend on OpenAI. | Fixed target | External language-model support may be optional. |
| 2026-11-26 | Keep the established modern scout/stadium visual direction and improve the existing UI without unapproved redesign. | Fixed design direction | Scout with binoculars and notepad; stadium intro target ~3.5 seconds. |
| 2026-11-26 | Input suggestions must be subtle grey and remain inside the input area. | Accepted | Avoid protruding/oversized suggestion fields. |

## 10. Implementation register

For each meaningful feature, record:
- feature name and requirement reference;
- implementation date;
- changed files/modules;
- behavior delivered;
- tests executed and results;
- data/schema changes (if any);
- permissions/security implications;
- deployment commit and verification;
- remaining limitations.

| Feature / area | Current recorded status | Evidence / next action |
|---|---|---|
| Existing AI chat integration | Present, limited | Chat endpoint calls current MESSINHO orchestrator; evolve without adding a second chat UI. |
| Capability catalogue | Present (100 IDs) | Catalogue presence is not proof of implementation. Audit each handler. |
| Capability runtime | Present, coverage reporting needs correction | Fix false executable/handler counts; test real handlers. |
| Regex-based orchestration | Present, limited | Replace progressively with goal-driven planning and execution. |
| System and MESSINHO diagnostics | Implemented in source | Run with authorized admin access and record actual results. |
| Learning safeguards | Partially implemented in source | Verify persistence, versioning, outcomes, and approval end-to-end. |
| Research provider independence | Not fully verified | Remove mandatory OpenAI dependency from core research paths where feasible. |
| Durable autonomous task ledger | Not verified as complete | Design and implement with safe persistence and owner scope. |
| Approved visual/animation requirements | Design direction recorded; completion not verified | Inspect actual live UI/assets and test on mobile/desktop. |

## 11. LIVE release journal

**Append one entry after every feature release to production.** Documentation-only commits do not need a separate feature release entry unless they change runtime behavior.

### Release record template

```markdown
### YYYY-MM-DD — <release title>
- **Status:** live / failed / rolled back
- **Production commit:**
- **Render deployment ID:**
- **What changed:**
- **Files/modules:**
- **Tests run and results:**
- **Live verification performed:**
- **Known issues / limitations:**
- **Data or schema impact:**
- **Next steps:**
```

### Initial documentation setup — 2026-11-26
- **Status:** Documentation committed to production branch; Render auto-deploy is enabled. Verify the resulting deployment before calling this documentation release live.
- **Purpose:** Establish the single source of truth, fixed product/design baseline, roadmap, implementation register, change log, and release journal.
- **Runtime behavior changed:** No — this is a documentation-only change.
- **Next steps:** Verify this commit's Render deployment; then begin Phase 0 and Phase 1, starting with diagnostics and truthful capability coverage.

## 12. Current next actions — resume from here

1. Verify the deployment triggered by adding this document and confirm the live service remains healthy.
2. Before the next runtime change, inspect current `main` and run the existing system/MESSINHO diagnostics with authorized access.
3. Audit `backend/messinho-capability-runtime.js` and `backend/messinho-capabilities.js`; correct capability status/coverage reporting.
4. Build tests around truthful handler availability, missing data, invalid input, authorization, and owner isolation.
5. Expand the current six-area deterministic multi-intent planner into contract-driven goal decomposition across all 100 internal capabilities.
6. Run the committed Node test suite in CI or another test runner, then improve natural-language interpretation, follow-up context, response quality, and deterministic fallback behavior without making OpenAI mandatory.
7. Audit and integrate all 100 catalogue capabilities as internal agent skills; clearly distinguish implemented, partial, data-blocked, policy-blocked, and missing behavior.
8. Keep the direct single-capability execution route disabled; correct runtime coverage/status reporting (70 reachable specialist branches, 30 generic fallbacks) and fix the unreachable seasonal-learning branch.
9. Update this file with implementation details and next actions after each meaningful change; append a LIVE release record after every feature deployment.
7. MESSINHO's 100 capabilities are internal agent skills, not user-selectable tools. The user describes a goal in the existing chat; the agent chooses and combines skills automatically. Do not reintroduce a manual per-capability selector in the normal workspace.

---

## 13. New-chat handover instruction

When the owner references **PROJECTSCOUT** or asks to continue this project in a new chat:

1. Open `PROJECTSCOUT.md` from the latest `main` branch.
2. Read the complete file, including the newest release and change-log entries.
3. Verify whether the repository HEAD or live deployment is newer than the recorded snapshot.
4. Inspect the actual code and deployment before stating the current status.
5. Continue from **Current next actions**, updating the roadmap and logs as work progresses.
6. Do not ask the owner to repeat requirements already recorded here.

**This document is the project continuity contract. The code and live system remain the source of truth for what is actually implemented; this document is the source of truth for what is intended, decided, completed, and planned.**


## 14. Explicit project exclusions — binding scope boundary

**PFMS and PFSS are separate, unrelated projects. They are not part of myScoutingDatabase and must not be considered when planning, designing, implementing, testing, documenting, or assessing this project.**

- Do not import PFMS/PFSS requirements, features, architecture, databases, branches, services, deployments, assets, or assumptions into myScoutingDatabase.
- Do not inspect, modify, merge, deploy to, or otherwise interact with PFMS/PFSS repositories or infrastructure as part of this project.
- Do not use PFMS/PFSS progress or functionality as a dependency, baseline, or completion criterion.
- The only project scope governed by PROJECTSCOUT.md is **myScoutingDatabase**, including its integrated MESSINHO module.
- If a future request appears to refer to PFMS or PFSS, treat it as outside this project's scope and clarify before taking any action.

This exclusion is explicit, permanent for this project record, and may be changed only if the owner expressly instructs otherwise.

### Change log addition — 2026-11-26
| Date | Request / decision | Status | Notes |
|---|---|---|---|
| 2026-11-26 | PFMS and PFSS are other projects and must not be considered in myScoutingDatabase work. | Binding exclusion | No requirements, code, infrastructure, assets, or progress from those projects are in scope. |


## 15. Autonomous capability integration — owner decision and current progress

### Binding owner decision — 2026-11-26

The 100 MESSINHO capabilities must no longer be presented as 100 individual functions for the user to select and execute. They are internal skills that form the behavior of the autonomous MESSINHO agent.

- The user communicates goals and questions in the existing chat using normal language.
- MESSINHO determines which internal capabilities are relevant, combines them into a coherent task plan, executes them within role/ownership/policy limits, validates results, and explains the outcome naturally.
- The user must not need to know capability IDs, technical names, or internal execution order.
- Capabilities should be composed when a request spans several domains (for example, player analysis + potential assessment + data quality + comparison).
- Missing data, missing integrations, blocked permissions, and errors must be distinguished. A capability must not be described as complete merely because its ID exists.
- The existing chat is the sole user-facing AI conversation surface. Do not add a second MESSINHO chat.

### First implementation slice — 2026-11-26

- **LIVE commit:** `6ddccade9d65702950a69bfd2c78bd1132b70de0`
- **Render deployment:** `dep-dc3nv3dbedkc73cl2keg`
- **Status:** `live` (Render reports the deployment finished successfully)
- **Changed file:** `src/asi/MessinhoWorkspace.jsx`
- **Completed:** Removed the 100-item capability dropdown, selected-capability state, manual “Funktion ausführen” action, and its result panel from the MESSINHO workspace.
- **Completed:** Replaced the manual function laboratory with a concise autonomous-work-mode explanation.
- **Completed:** Updated the welcome message to invite normal-language goals and explain that currently available analysis/scouting steps are selected automatically.
- **Verification:** Re-read the committed source and confirmed the manual selector/state/actions are absent. Render build completed successfully and the deployment is `live`.
- **Not yet verified:** A browser-based visual smoke test of the live workspace has not been performed in this release.
- **Important remaining item:** The backend still contains a direct per-capability execution endpoint. It is no longer called by the workspace UI, but it must be reviewed and retired or restricted after checking all remaining consumers. Do not claim individual execution is fully disabled yet.

### Updated implementation status

| Area | Status | Next action |
|---|---|---|
| Manual capability selector in MESSINHO workspace | Removed and live | Perform browser smoke test on desktop/mobile. |
| Automatic capability selection in chat | Existing limited regex orchestrator | Replace first-match selection with multi-intent, goal-driven composition. |
| Full integration of all 100 capabilities | In progress; not complete | Audit real behavior and connect skills to agent planning/execution. |
| Natural-language understanding and chat response behavior | Partially present | Improve normalization, context resolution, clarification policy, response formatting, and provider-independent fallback. |
| Direct single-capability backend endpoint | Still present | Audit consumers; restrict/retire safely so capability selection remains internal to MESSINHO. |

### New LIVE release record — 2026-11-26 — Remove manual capability selection

- **Status:** live
- **Production commit:** `6ddccade9d65702950a69bfd2c78bd1132b70de0`
- **Render deployment ID:** `dep-dc3nv3dbedkc73cl2keg`
- **What changed:** The normal MESSINHO workspace no longer exposes a per-capability dropdown or manual execution button. It explains the intended autonomous interaction and directs users to describe their goals in chat.
- **Files/modules:** `src/asi/MessinhoWorkspace.jsx`
- **Tests run and results:** Source-level verification completed; Render build succeeded. No automated UI test or browser smoke test was run.
- **Live verification performed:** Render deployment status confirmed `live`.
- **Known issues / limitations:** The chat orchestrator is still limited and currently chooses the first matching fixed plan. The direct backend capability endpoint remains and needs a consumer/security review.
- **Data or schema impact:** None.
- **Next steps:** Multi-intent autonomous planning; truthful capability coverage; integrate all 100 internal skills; improve language and answer quality; review direct endpoint.

### New change-log entry — 2026-11-26

| Date | Request / decision | Status | Notes |
|---|---|---|---|
| 2026-11-26 | All 100 MESSINHO capabilities become internal skills of the autonomous agent, not individual user-selectable functions. The chat should improve in language use, conversation behavior, and answer quality. | Binding target; implementation in progress | First LIVE slice removed the manual selector from the workspace. Full autonomous orchestration and language improvements remain roadmap work. |


### Second implementation slice — multi-intent planning and conversational results — 2026-11-26

- **Planner commit:** `65c3bb1fb3987f451d48e2bd1a435e509c88b05e`
- **Planner deployment:** `dep-dc3nvuoae00c73cncma0` — **live**
- **Test commit:** `df44fb6e47c82b7ff3d58c96088d18133a1349ae`
- **Test deployment:** `dep-dc3o014o3iic73c8hql0` — **live**
- **Changed files:** `backend/messinho-orchestrator.js`, `tests/messinho-orchestrator.test.js`
- **Completed:** The planner now collects all matching supported goal areas instead of stopping at the first matching phrase. Duplicate skills are removed, execution is bounded to 16 steps, and unexecuted steps are explicitly reported as deferred.
- **Completed:** Mixed requests can combine analysis, potential/development, comparison, data-quality/source checks, transfer risk, and controlled learning intents.
- **Completed:** Protected learning work is separated from permitted work. A scout can receive an allowed player analysis while admin-only learning tasks remain blocked; a learning-only request remains denied for non-admins.
- **Completed:** Capability output is more user-oriented: it describes work areas and missing information in ordinary German instead of exposing internal input keys.
- **Tests added:** Multi-intent composition, deduplication, execution limits, admin boundaries, partial permission handling, and user-facing output language.
- **Test execution limitation:** The tests were added and committed, but the Render build does not execute `npm test`; no test-run result is claimed. They still need to be run in a proper Node test environment/CI.
- **Scope limitation:** This is a first deterministic multi-intent planner, not yet a complete autonomous goal decomposition engine and not yet a complete integration of all 100 capabilities. The currently mapped automatic intents are still a subset.

### Third implementation slice — disable manual single-capability execution — 2026-11-26

- **LIVE commit:** `76467a52f798609a65366fd32565f35d94b91f0c`
- **Render deployment:** `dep-dc3o0k8jo6nc73am8s5g` — **live**
- **Changed file:** `backend/server.js`
- **Completed:** The direct `POST /api/messinho/capabilities/:capabilityId/execute` route now returns HTTP 410 and directs users to the MESSINHO chat. It no longer executes an individually supplied capability ID.
- **Completed:** The capability catalogue endpoint is restricted to administrators and explicitly described as an internal diagnostic overview, not a user tool selector.
- **Consumer check:** The frontend source tree was searched; no remaining frontend caller of the manual capability endpoint was found after the workspace selector was removed.
- **Verification:** Render deployment reached `live`; application startup logs confirmed the API was listening and the Supabase Data API returned HTTP 200.
- **Data/schema impact:** None.
- **Known limitation:** The runtime registry still contains 100 catalogue IDs and the orchestrator currently maps only a subset of goal areas. The next work is to audit actual handler behavior and connect the full capability set to the autonomous agent's internal planner.

### Updated autonomous capability status

| Area | Status | Next action |
|---|---|---|
| User-facing per-capability selector | Removed and live | Keep it removed. |
| Direct single-capability execution API | Disabled with HTTP 410 and live | Keep execution internal to Agent Core. |
| Admin capability catalogue | Admin-only diagnostic endpoint | Correct implementation coverage reporting before relying on counts. |
| Multi-intent planning | Implemented for six supported goal areas and live | Expand to a contract-driven planner across the full catalogue. |
| Natural-language result formatting | Improved for automatic capability runs | Extend to all chat branches and provider-independent conversational fallback. |
| Tests | New orchestrator tests committed | Execute `npm test` in CI or a test runner; fix any failures before further expansion. |
| Full 100-capability integration | In progress, not complete | Audit each capability and wire relevant skills into goal decomposition and execution. |

### New LIVE release records — 2026-11-26

#### Goal-composed MESSINHO planning
- **Status:** live
- **Production commit:** `65c3bb1fb3987f451d48e2bd1a435e509c88b05e`
- **Render deployment ID:** `dep-dc3nvuoae00c73cncma0`
- **What changed:** Automatic planning now composes multiple matching supported goal areas instead of selecting only the first match; protected learning work is separated from allowed work; results use more natural German.
- **Files/modules:** `backend/messinho-orchestrator.js`
- **Tests:** New tests committed separately; not executed by Render's build.
- **Live verification:** Render status `live`.
- **Known limitations:** Fixed intent patterns and a subset of the capability catalogue; not yet a fully autonomous planner.
- **Next steps:** Execute tests, expand capability mapping and goal decomposition.

#### Retire direct capability execution
- **Status:** live
- **Production commit:** `76467a52f798609a65366fd32565f35d94b91f0c`
- **Render deployment ID:** `dep-dc3o0k8jo6nc73am8s5g`
- **What changed:** Per-capability execution endpoint disabled with HTTP 410; admin catalogue restricted to internal diagnostic use.
- **Files/modules:** `backend/server.js`
- **Tests:** Render build and app startup verified; no endpoint integration test executed.
- **Live verification:** Render status `live`; API startup and Supabase connectivity logged successfully.
- **Data or schema impact:** None.
- **Next steps:** Implement internal goal-driven capability selection across all 100 entries.

### New owner decision — autonomous chat behavior

The owner wants the entire chat experience improved as part of the same agent integration: language understanding, spelling/name interpretation, natural conversation, context retention, clarification behavior, explanation quality, and final answers. These improvements must be consistent across all chat branches, not only the capability-run response formatter. OpenAI remains optional; the deterministic MESSINHO path must remain useful without it.


### Runtime audit finding — 2026-11-26

A source-level audit of the current `main` runtime found:

- The catalogue contains **100 unique capability IDs**.
- The four dispatch sets contain **100 unique IDs**, so every catalogue ID reaches one of the four broad domain handler functions.
- The runtime contains **71 distinct explicit capability-ID branches**, but `seasonal_learning` is placed in the analysis handler even though dispatch routes it to the learning handler. That branch is unreachable.
- Therefore, the source currently contains **70 reachable capability-specific branches** and **30 catalogue IDs that fall through to generic domain behavior**.
- This does **not** prove that the 70 branches are complete, fully tested, persisted, or operational end-to-end. Each one still needs a contract and test audit.
- `listExecutableMessinhoCapabilities()` currently marks all 100 catalogue entries as `execution_handler_available: true`, and runtime diagnostics report all 100 as registered. This describes broad dispatch registration, not 100 complete specialist implementations. It must be corrected so the admin overview distinguishes domain-specific logic from generic fallback and from fully verified capability completion.

This is a source-code audit only. It is not a successful execution test of all 100 capabilities.

### Immediate technical next step

Correct runtime reporting and diagnostic wording before expanding the planner:
1. Report dispatch coverage separately from specialist-logic coverage.
2. Mark generic fallback entries honestly; do not label them as fully executable specialist functions.
3. Fix the unreachable `seasonal_learning` branch and add a focused test.
4. Make the admin diagnostic report specialist coverage and generic fallbacks instead of only `all_registered`.
5. Run the complete Node test suite; Render's normal production build does not run `npm test`.



## 16. Mandatory automatic checkpoint protocol — binding owner instruction — 2026-11-26

**Whenever a development stream is interrupted, paused, handed off, or is about to end, the current project state must first be saved to this GitHub file `PROJECTSCOUT.md` on `main`.** Do not rely on chat history as the only record.

This is a mandatory step for every future `myScoutingDatabase` work session:

1. Record the exact current GitHub `main` commit and all commits made during the work session.
2. Record the exact Render production deployment ID, commit SHA, and verified deployment status. Distinguish `live`, `build_in_progress`, `update_in_progress`, `failed`, and `deactivated`. Never call a deployment live until Render confirms it.
3. Record what was actually changed, including files/modules and relevant behavior. Separate completed work from planned or partially implemented work.
4. Record verification evidence: tests actually executed and their outcomes, build logs, startup/health checks, and any checks not performed. Never describe committed tests as passed unless they were executed.
5. Record open defects, risks, incomplete work, permission/security boundaries, and any changes that must not be repeated.
6. Record the exact next technical action, including the files/functions to inspect and the reason for the next step.
7. Record whether database/schema or user data was changed. State explicitly when there was no data/schema impact.
8. Update the implementation status table and append a dated checkpoint/change-log entry. Keep previous history; do not overwrite or erase earlier decisions.
9. Fetch/re-read the saved file after committing the checkpoint to verify it is present on GitHub.
10. Only then report the handoff/interruption status to the user.

**Checkpoint timing:** Save after every meaningful implementation/deployment unit, not only at the end of a long session. If the stream unexpectedly stops, the most recent completed unit must already have a checkpoint. If a final save itself cannot be completed, state that clearly and provide the exact unsaved state rather than claiming it was saved.

**Project boundaries remain binding:** work only in `myScoutingDatabase`; do not modify PFMS/PFSS. Production changes must be accurately labelled and verified. Never claim future background monitoring or autonomous GitHub writes when no such process is running; this protocol is executed as part of each active development stream.

### Checkpoint — 2026-11-26 — owner requested automatic save on interruption

- **Request:** Whenever a stream is interrupted, automatically save the latest development state in this `PROJECTSCOUT.md` file in GitHub.
- **Decision:** Accepted as a mandatory development/handoff protocol for all subsequent work on `myScoutingDatabase`.
- **Current latest production deployment at checkpoint time:** commit `af9f1c7ef84b04d4c02bcec45e4ff6485cf979f9`, deployment `dep-dc3o1bt9el5s73ai2b0g`, Render status `live`.
- **Most recent verified implementation:** Manual single-capability execution is disabled (HTTP 410); capability catalogue is admin-only; multi-intent planning is live for a limited set of goal areas; manual function selector is removed.
- **Current known audit findings:** 100 catalogue IDs; 100 broad dispatch-set entries; 71 distinct explicit ID branches in source, one unreachable `seasonal_learning` branch, leaving 70 reachable explicit branches and 30 generic fallbacks. These are source audit counts, not end-to-end test results. Runtime reporting still overstates specialist coverage.
- **Tests:** Seven orchestrator test cases were committed; execution has not yet been verified. Render's production build is not a substitute for `npm test`.
- **Data/schema impact:** None in the changes recorded above.
- **Next action:** Correct runtime coverage reporting, fix and test the unreachable seasonal-learning dispatch, then run the complete Node test suite before expanding all 100 skills.


## 17. Runtime-Coverage-Korrektur und saisonales Lernen — 2026-11-26

### Implementierung auf separatem Prüf-Branch

- **Branch:** `fix/messinho-runtime-coverage`
- **Pull Request:** [#44 — MESSINHO: truthful capability coverage and seasonal learning](https://github.com/Dridi06/myScoutingDatabase/pull/44) — merged.
- **Merge-Commit auf `main`:** `817a9571755fc9a87729cf8bfc85ea95a9af1f63`
- **Render Produktionsdeployment:** `dep-dc3o3ti9lscs73dbudu0` — Status `live`, bestätigt am 2026-11-26 um 00:49:26 UTC.
- **Verifizierter Live-Start:** Render meldete `Your service is live`; Prozess `node backend/server.js` startete und meldete `myScoutingDatabase API listening on 10000`.
- **Vorheriger Produktionsstand:** `8df9960a5b1c48da6dca47337bb3cd9f6414e92e`.

### Tatsächlich implementiert

1. `backend/messinho-capability-runtime.js`
   - Die interne Diagnose trennt jetzt Katalogeinträge, Domain-Dispatch, explizite Speziallogik, generischen Fallback und nachgewiesene End-to-End-Vollständigkeit.
   - Der Katalog weist pro Fähigkeit `dispatch_registered`, `specialist_logic_available`, `implementation_level` und `completion_verified` aus.
   - Generische Fallbacks werden nicht mehr als vollständige Spezialfunktionen dargestellt.
   - Die Laufzeitübersicht berechnet `dispatched_capabilities`, `specialist_logic_count`, `generic_fallback_count`, `undispatched_count` und `completion_verified_count` getrennt.
   - `seasonal_learning` wurde aus dem falschen Analyse-Handler entfernt und dem Lern-Handler zugeordnet. Die neue Logik vergleicht mindestens zwei explizit bezeichnete Saisons anhand vorhandener Messwerte. Sie trainiert nicht und verändert keine Modellgewichte.
2. `backend/server.js`
   - System- und MESSINHO-Administratordiagnosen beschreiben Dispatch-Abdeckung, Speziallogik und generische Fallbacks getrennt. Eine vollständige Implementierung wird nicht mehr aus der bloßen Registrierung abgeleitet.
3. `tests/messinho-orchestrator.test.js`
   - Zusätzliche Tests für Saisonvergleich, unveränderte Modellgewichte, Laufzeit-Coverage und ehrliche Admin-Katalogkennzeichnung.
4. `.github/workflows/messinho-tests.yml`
   - GitHub Actions führt die Node-Tests bei Push auf `main` und den Prüf-Branch sowie bei Pull Requests nach `main` aus.

### Verifikation

- **GitHub Actions Run:** `45731280435`
- **Ergebnis:** `completed / success`
- **Ausgeführt:** `npm install --no-audit --no-fund`, danach `npm test`
- **Testergebnis:** 98 Tests bestanden, 0 fehlgeschlagen, 0 übersprungen.
- **Hinweis:** Die CI belegt die automatisierten Tests. Sie ist kein browserbasierter Live-Test und keine End-to-End-Prüfung jeder einzelnen Katalogfähigkeit.
- **Supabase / Daten / Schema:** Keine Datenbankmigration, keine Änderung an Nutzerdaten, Spielerakten, Lernhistorie oder Modellgewichten.
- **Produktionsbereitstellung:** Erfolgreich; Merge und Render-Status `live` sind bestätigt.

### Status nach diesem Arbeitsschritt

| Bereich | Status | Nächster Schritt |
|---|---|---|
| Runtime-Coverage | Implementiert, CI-geprüft | Nach Merge Admin-Diagnose live kontrollieren |
| Generische Fallbacks | Werden separat ausgewiesen | Fähigkeiten systematisch durch echte Fachlogik ersetzen |
| `seasonal_learning` | Fachlogik ergänzt und getestet | Mit realen, berechtigten Saisonmesswerten im Produkt prüfen |
| Node-Test-Suite | 98/98 bestanden | CI dauerhaft auf `main` aktiv halten |
| 100 Fähigkeiten | Noch nicht vollständig end-to-end verifiziert | Verträge, Datenbedarf, Berechtigungen und Tests pro Fähigkeit weiter ausbauen |
| Produktionsdeployment dieses Arbeitsschritts | Live | Merge-Commit `817a957`; Render deployment `dep-dc3o3ti9lscs73dbudu0` bestätigt `live` |

### Change-Log — 2026-11-26

| Datum | Änderung | Status | Hinweis |
|---|---|---|---|
| 2026-11-26 | Runtime-Coverage, saisonale Lernlogik, Admin-Diagnosen und Node-CI | Implementiert auf Prüf-Branch; 98 Tests bestanden | Noch nicht in Produktion; keine Daten-/Schemaänderung |


### Abschluss-Checkpoint — 2026-11-26 — Runtime-Coverage LIVE

- **Main-Commit mit Implementierung:** `817a9571755fc9a87729cf8bfc85ea95a9af1f63`
- **PR:** #44, merged.
- **Render-Deployment:** `dep-dc3o3ti9lscs73dbudu0`, Status `live`.
- **CI:** GitHub Actions Run `45731353854` erfolgreich; `npm test` mit 98 bestanden und 0 fehlgeschlagenen Tests.
- **Live-Start:** Build erfolgreich, `node backend/server.js` gestartet, API meldete Listening auf Port 10000; Render meldete Service live.
- **Datenbank:** Keine Migration und keine Änderung an Spieler-, Nutzer-, Scout- oder Lerndaten.
- **Nächster Schritt:** Laufzeitübersicht und MESSINHO-Admin-Diagnose gegen Live-API prüfen; danach die 29 generischen Fallbacks einzeln nach Datenvertrag, Berechtigung, Fachlogik, Persistenz und Tests aufarbeiten. Die 71 als Speziallogik markierten Fähigkeiten sind damit nicht automatisch vollständig end-to-end verifiziert.


## 18. Session checkpoint — 2026-11-26 — Fortsetzungspunkt nach Runtime-Coverage-Livegang

### Verifizierter Repository- und Live-Stand
- Repository: `Dridi06/myScoutingDatabase`, Branch `main`.
- Main-HEAD bei Checkpoint-Erstellung: `62d3e7e13141fa6ede0d38dc60d87e6d2aa9d0c6`.
- Letzte produktive Implementierung: `817a9571755fc9a87729cf8bfc85ea95a9af1f63`.
- Letztes Render-Produktionsdeployment: `dep-dc3o48u0tbcc73c4d83g`, Commit `62d3e7e13141fa6ede0d38dc60d87e6d2aa9d0c6`, Status bei letzter Abfrage `live`.
- Supabase-Projekt bleibt `vxtybjaabtfhxfwctnyj`; in dieser Session wurden keine Datenbankänderungen vorgenommen.
- Die Aktualisierung dieses Checkpoints ist eine Dokumentationsänderung; Render kann dafür einen neuen Dokumentations-Deploy starten. Dessen Status muss separat geprüft werden.

### Inhaltlicher Stand MESSINHO
- MESSINHO arbeitet als autonomer interner Agent über den bestehenden Chat. Es gibt keine manuelle Funktionsauswahl und keine zweite Chat-Oberfläche.
- Runtime-Diagnostik unterscheidet 100 Dispatch-Einträge, 71 Einträge mit expliziter Speziallogik und 29 generische Fallbacks.
- `seasonal_learning` ist dem Lern-Handler zugeordnet und vergleicht mindestens zwei Saisons mit vorhandenen Messwerten; keine Trainings- oder Modellgewichtsänderung.
- Admin-Diagnostik stellt Dispatch, Speziallogik und Fallback getrennt dar.
- Node-CI wurde eingerichtet; der verifizierte Testlauf `45731353854` endete erfolgreich mit 98 bestandenen und 0 fehlgeschlagenen Tests.
- Die Zahlen 71/29 sind Klassifizierungen auf Codeebene, keine Aussage über 71 vollständig end-to-end geprüfte Fähigkeiten. End-to-End-Verifikation aller Fähigkeiten ist weiterhin offen.

### Nächste konkrete Arbeitsschritte
1. Live-API und Admin-Diagnose gegen die laufende Produktionsversion prüfen; Diagnoseantwort auf erwartete Felder und Werte kontrollieren, ohne Nutzer-/Spielerdaten zu verändern.
2. Runtime-Verträge der 29 generischen Fallbacks aus dem Katalog erfassen: benötigte Eingaben, Datenquellen, Berechtigungen, erwartete Ausgabe, Fehlerfälle.
3. Fallbacks einzeln nach fachlichem Nutzen priorisieren und echte Speziallogik implementieren; keine generische Funktion als Spezialfähigkeit deklarieren.
4. Pro Fähigkeit Tests für gültige Daten, fehlende Daten, fehlerhafte Daten, Berechtigungen und Nicht-Manipulation von Modellen/Nutzerdaten ergänzen.
5. Danach den autonomen Planner über die bisherigen sechs Intent-Bereiche hinaus systematisch erweitern; Multi-Intent-Planung, Ausführungsrechte, Nachweise, Abbruch und Re-Planung berücksichtigen.
6. Gesprächsqualität und Kontext über alle Chatpfade hinweg verbessern; OpenAI bleibt optional, nicht Voraussetzung für die Kernfunktionalität.
7. Nach jedem sinnvollen Implementierungsschritt PROJECTSCOUT aktualisieren, Commit/CI/Render getrennt verifizieren und keine Live-Erfolgsmeldung ohne tatsächlichen Statusbeleg geben.

### Sicherheits- und Änderungsgrenzen
- Ausschließlich `myScoutingDatabase` bearbeiten. PFMS/PFSS und deren Deployments/Datenbanken bleiben unberührt.
- Keine Schema-, Nutzer-, Spieler-, Scout- oder Lerndatenänderung ohne gesonderten Grund und sichere Prüfung.
- Keine Modellgewichtsänderung oder selbstständiges Training durch saisonale Auswertung.
- Kritische Aktionen, externe Kontaktaufnahme und irreversible Änderungen benötigen Rechte und/oder ausdrückliche Freigabe.
- Keine Aussage „vollständig implementiert“ allein aufgrund einer Katalogregistrierung oder eines erfolgreichen Builds.

### Status zum Sitzungsende
- Runtime-Coverage-Korrektur: in `main` integriert und produktiv live.
- Tests: 98/98 im verifizierten CI-Lauf bestanden.
- Browser-/manueller End-to-End-Test der Benutzeroberfläche und aller 100 Fähigkeiten: nicht durchgeführt.
- Nächster Startpunkt: Schritt 1 — Live-API/Admin-Diagnose prüfen, danach Fallback-Verträge systematisch aufarbeiten.


## 19. Session checkpoint — 2026-11-26 — Vollständige interne Fähigkeitsintegration (100/100 Speziallogik)

### Branch / Review / Commit
- Arbeitsbranch: `feature/messinho-unified-capability-agent`
- Pull Request: #45 — `MESSINHO: integrate full capability catalogue into autonomous planning`
- PR URL: https://github.com/Dridi06/myScoutingDatabase/pull/45
- Letzter Implementierungscommit vor diesem Dokumentationscheckpoint: `5a812b5a4992b045b8bf58f9b3e6742caa4c4712`
- Die Änderungen befinden sich bis zum Merge ausschließlich im Feature-Branch; keine direkte Änderung an `main` und kein Render-Produktivdeploy durch diesen Feature-Branch.

### Fähigkeits-Runtime
- Alle 100 Katalogfähigkeiten sind registriert und besitzen eine explizite Speziallogik.
- Runtime-Zählung: 100/100 dispatch-registriert, 100/100 Speziallogik, 0 generische Fallbacks, 0 undokumentierte Kataloglücken.
- Die vormals 29 generischen Fallback-Fälle wurden mit fachbezogenen Handlern ergänzt:
  - Technische, taktische, athletische, mentale und Torwart-Bewertung.
  - Verifizierte Scout-Feedback-Auswertung.
  - Kontrollierte Lern-/Segmentanalysen (u. a. Position, Altersgruppe, Liga, Land, Talentpfad, Positionswechsel und Verfügbarkeit).
  - Talentsuche, internationale und ligaübergreifende Auswertung, Jugendtalente, Underdogs und Hidden Gems.
  - Vereins-, Kader-, Statistik-, Spielbericht-, Kaderbedarfs- und Vergleichsspieler-Recherche.
- Recherche-Handler werten übergebene Kandidaten- und ASI-Quellenpakete aus. Sie behaupten keine externe Live-Suche, wenn kein Provider-Ergebnis vorliegt.
- Lernfunktionen werten ausschließlich verifizierte Eingaben aus. Scout-Feedback wird deskriptiv ausgewertet. Lernvorschläge ändern keine aktiven Modellgewichte und trainieren kein Modell automatisch.
- Runtime-Katalog und Diagnose unterscheiden weiterhin Speziallogik von Ende-zu-Ende-Verifikation. `completion_verified_count` bleibt bewusst 0, bis jede Fähigkeit mit echten Integrations-/Datenpfaden geprüft wurde.

### Autonome interne Integration
- Der Planner durchsucht den vollständigen 100er-Katalog anhand deutscher und englischer Fachbegriffe sowie exakter natürlicher Fähigkeitsnamen.
- Alle 100 Katalogeinträge wurden durch einen automatisierten Test anhand ihres natürlichen Namens erfolgreich entdeckt.
- Die bisher sechs Intent-Vorlagen bleiben kompatibel; zusätzliche Katalogtreffer werden kombiniert, dedupliziert und in definierter Reihenfolge geplant.
- Explizite Abhängigkeiten werden vor der Ausführung aufgelöst; Ausführungsplan ist auf 20 Schritte begrenzt.
- Admin-geschützte Lern- und Modellprüfungen bleiben für Nicht-Administratoren gesperrt, auch wenn der Planner sie als relevante Fähigkeiten erkennt.
- Vorherige Arbeitsergebnisse werden als nicht vertrauenswürdiger Kontext an Folgeschritte weitergegeben. Sie werden nicht automatisch zu verifizierten Quellen, Spielerkennzahlen oder Trainingsresultaten hochgestuft.
- Fehlende Eingaben, blockierte und zurückgestellte Schritte werden sichtbar ausgewiesen. Bei fehlenden Daten oder Fehlern wird eine erneute Planprüfung empfohlen; unbelegte Ergebnisse werden nicht als erledigt ausgegeben.
- Die Kernlogik bleibt provider-unabhängig; OpenAI ist keine Voraussetzung für die interne Fähigkeitsauswahl und -ausführung.

### Tests und Build — verifizierter Stand
- GitHub Actions Commit: `5a812b5a4992b045b8bf58f9b3e6742caa4c4712`
- MESSINHO Node Tests: `45732685599` — completed/success, 108/108 Tests bestanden.
- MESSINHO Validation: `45732685637` — completed/success, Tests und Frontend-Build erfolgreich.
- ASI Quality Checks: `45732685730` — completed/success, ASI-Tests und Frontend-Build erfolgreich.
- Zusätzliche Regressionstests decken 100er-Namensentdeckung, Berechtigungsschutz, alle 29 ehemals generischen Fähigkeiten, unveränderte Quelldaten, fehlende Eingaben, Kandidatenfilter, Kaderbedarf und nicht-mutierendes Lernen ab.

### Sicherheitsgrenzen / offene Verifikation
- Keine Supabase-Migration, kein Datenbank-Schreibzugriff und keine Änderung an Nutzer-, Scout-, Spieler- oder Lerndaten.
- Keine Änderung aktiver Modellgewichte und kein automatisches Training.
- Keine Aussage, dass alle 100 Fähigkeiten bereits Ende-zu-Ende mit produktiven Daten und externen Providern verifiziert wurden.
- Vor Livegang: PR prüfen/mergen, Render-Deploy-ID und Status kontrollieren, Live-API-/Admin-Diagnose nur lesend verifizieren. Danach gezielte UI-/API-Smoke-Tests mit Testdaten durchführen.
- PFMS/PFSS bleiben ausdrücklich außerhalb dieses Projekts.

### Nächster Startpunkt
1. Diesen Dokumentationscheckpoint in den Feature-Branch übernehmen und CI erneut abwarten.
2. PR #45 nach erfolgreicher Prüfung freigeben und gemäß Projektfreigabe integrieren.
3. Render-Deployment überwachen; erst bei Status `live` und passender Commit-SHA als live melden.
4. Anschließend Live-API/Admin-Diagnose und die wichtigsten natürlichen MESSINHO-Anfragen mit nicht-produktiven Testdaten prüfen.
5. Danach die Ende-zu-Ende-Verifikation der 100 Fähigkeiten schrittweise ergänzen; Completion-Zähler erst nach realen Tests erhöhen.


## 20. Production release confirmation — 2026-11-26 — MESSINHO 100/100 live

### Merge und produktiver Deploy
- Pull Request #45 wurde nach erfolgreicher Prüfung gemergt: https://github.com/Dridi06/myScoutingDatabase/pull/45
- Merge-Commit auf `main`: `88b65f16134eb79bb6451bf5d9b449f2ea394245`
- Render Service: `srv-dc25n13rjlhs73e2ae1g` (`myscoutingdatabase`)
- Render Deployment: `dep-dc3o9mu0tbcc73c4j9l0`
- Deployment-Status: `live`, abgeschlossen am 2026-11-26T01:02:28Z.
- Render hat den neuen Main-Commit automatisch ausgerollt; kein manueller Deploy und keine Änderung an Environment-Secrets.
- Runtime-Logs nach dem Rollout: `npm start`, `node backend/server.js`, `myScoutingDatabase API listening on 10000`.
- Startprotokoll meldet ASI/Tavily und OpenAI-Konfiguration vorhanden sowie Supabase Data API HTTP 200.
- Der Render-Status und die Startlogs bestätigen den erfolgreichen Prozessstart. Ein interaktiver Browser-Smoke-Test der gesamten Benutzeroberfläche und ein authentifizierter Aufruf der Admin-Diagnose wurden in diesem Schritt nicht durchgeführt.

### Produktiver Funktionsstand
- 100/100 Fähigkeiten mit expliziter Speziallogik.
- 0 generische Fallbacks.
- 100/100 Fähigkeiten über ihre natürlichen Namen im Planner auffindbar.
- Multi-Intent-Planung, Abhängigkeitsauflösung, 20-Schritte-Limit, Admin-Schutz, fehlende Eingaben und Re-Planungshinweise integriert.
- 108/108 Node-Tests erfolgreich; MESSINHO-Validierung/Frontend-Build und ASI-Qualitätsprüfung/Frontend-Build erfolgreich.
- Ende-zu-Ende-Verifikation mit produktiven Daten/externen Providern weiterhin offen; `completion_verified_count=0` bleibt korrekt.

### Daten- und Sicherheitsstatus
- Keine Supabase-Schemaänderungen oder Datenbank-Schreiboperationen im Zuge dieser Implementierung.
- Keine Änderungen an Nutzer-, Scout-, Spieler- oder Lerndaten.
- Keine aktiven Modellgewichte verändert und kein automatisches Modelltraining ausgeführt.
- PFMS/PFSS nicht berührt.

### Nächster Startpunkt
1. In einer kontrollierten Sitzung mit einem Testkonto die natürliche Spracheingabe in MESSINHO prüfen: Mehrfachziele, automatische Fähigkeitswahl, fehlende Daten und geschützte Lernanfragen.
2. Die Admin-Diagnose authentifiziert und nur lesend aufrufen; 100 Speziallogiken/0 Fallbacks bestätigen.
3. Danach Ende-zu-Ende-Tests pro Fähigkeitsfamilie mit isolierten Testdaten ergänzen und Completion erst bei echten Integrationsnachweisen erhöhen.
4. Keine Live-Erfolgsaussage über externe Suche, Datenbankpersistenz oder Modelllernen machen, solange diese Pfade nicht separat belegt sind.


---

## 21. Staging session checkpoint — 2026-11-26 — KIWorkflow agent architecture integration

### User instruction and environment boundary
- The user supplied and requested implementation of `KIWorkflow.docx`.
- Current operating instruction: **STAGING ONLY**. Production branch `main`, production Render service, production Supabase project, and production secrets must remain untouched.
- Dedicated staging branch: `feature/messinho-agent-workspace`.
- Dedicated staging Render service: `myscoutingdatabase-messinho-staging` (`srv-dc3chlqjnfac73acd6ig`), URL `https://myscoutingdatabase-messinho-staging.onrender.com`.
- Staging Render auto-deploy is disabled. Production credentials are present only in LIVE; staging has no separate credentials yet. No secret values were copied or displayed.
- No deployment has been triggered by this checkpoint.

### Source document analysis
- `KIWorkflow.docx` describes durable/short-term memory, intent routing, task planning, deterministic retrieval/scoring, evidence/context assembly, bounded validation loops, streaming/structured output, traceability, human approval, and controlled self-evolution.
- The Python sample's unrestricted `exec()` plus AST import filtering is **not a safe sandbox**. It must not be used as an execution boundary. Generated code must be isolated in a separate restricted worker/container with resource limits, allowlisted interfaces, adversarial tests, and explicit promotion controls.
- The source's example of automatically loosening budgets/age filters must be adapted: only relax soft preferences, never hard constraints, and clearly disclose every relaxation. This iteration does not automatically alter a user's hard search filters.

### Implemented on the staging branch
- Added `backend/messinho-orchestrator.js` from the already reviewed main-branch implementation, containing automatic 100-capability discovery, multi-intent composition, dependency ordering, a 20-step execution ceiling, role protection for learning/model functions, bounded execution, truthful missing-data statuses, and conversational result formatting.
- Integrated the orchestrator into the existing `POST /api/agent/chat` path in `backend/server.js`; no second chat interface was created.
- Added owner-scoped memory helpers that read/write active player IDs, user preferences, active entities, last intent, and last goal.
- Added compact execution trace persistence containing goal, selected capability IDs, step statuses, missing inputs, and duration; raw player records and full source payloads are not written to the trace.
- Added explicit player resolution from the current message before falling back to remembered active player context, to avoid analysing a previously active player when the user names a different player.
- The chat route keeps the existing specialised scouting, candidate, comparison, and summary paths intact; autonomous planning handles requests that reach the general agent path.
- Added `tests/messinho-orchestrator.test.js` for multi-intent planning, dependency resolution, role guards, bounded non-mutating execution, missing-data honesty, output formatting, and small-talk routing.
- Added migration `supabase/migrations/20261126_messinho_agent_memory.sql` for owner-scoped memory and trace tables with RLS. This migration is a file only; it has **not** been applied to any Supabase project.

### Commits
- Latest staging CI workflow commit: `39bce88a6a6d24281abab58849931d38c5708e2a`
- Session checkpoint commit: `95aa645bbf9961d168caa1b8b9dc6d4493ac41a6`
- Planner module: `e7bc056990dd1b0646f6b8b53f6a36c1ef78231b`
- Memory/trace migration: `2ec2349118893d1598ef76520d9b240272dce375`
- Orchestrator tests: `907a124e692ad1cea45b500377679aaf94484281`
- Chat route integration: `302bbb68da263f862e9330a75507d1efd9e3dedc`
- Explicit player-context precedence fix: `69fa8cdc1e5cd257b72a70cd0366c751308cefbe`

### Verification and limitations
- Added `.github/workflows/messinho-staging-validation.yml` to run `npm install`, `npm test`, and `npm run build` on pushes/pull requests to the staging branch. The workflow was added in commit `39bce88a6a6d24281abab58849931d38c5708e2a`; the first completed CI result has not yet been observed.
- The code changes were committed to the staging branch only. No production code or deployment was changed.
- No staging Supabase credentials are available, so database-backed memory and trace persistence cannot yet be exercised.
- The SQL migration has not been applied.
- No Render staging deployment has been triggered; staging auto-deploy is disabled.
- Automated tests/CI for the new staging commit have not yet been confirmed. Do not report this implementation as live or fully end-to-end verified.
- The imported orchestrator depends on the current staging capability catalogue/runtime. Its compatibility must be verified by the staging test run before deployment.

### Next steps
1. Verify the latest staging branch head and CI/test results.
2. Review any test or build failures and correct them on the staging branch.
3. Add separate staging Supabase credentials and apply the migration only to the staging Supabase project.
4. Run authenticated staging tests for chat planning, player follow-ups, memory persistence, trace persistence, role guards, and missing-data responses.
5. Verify Render staging build and runtime before describing the changes as live.
6. Keep the safe self-evolution pipeline as a separate next phase: capability-gap proposal -> isolated sandbox -> tests/backtesting -> signed/versioned candidate -> admin approval -> registry activation. Do not execute generated source in the API process.

## 16. KIWorkflow.docx integration — 2026-11-26

### Owner request and source-derived requirements
- Adopted: conversation/session memory, intent and task planning, deterministic retrieval/scoring, structured argumentation, bounded self-correction, traceable execution, source grounding, uncertainty reporting, approval for sensitive side effects, and controlled skill evolution.
- Security correction: the document's example `exec()` plus AST check is not an adequate production sandbox. Generated code must not be executed in the application process. Future skill evolution requires isolated execution, static policy checks, adversarial tests, signed/versioned artifacts, holdout evaluation, admin approval, and rollback.
- Unconditional budget relaxation is not adopted. Search constraints must not be silently weakened; MESSINHO must ask before widening a search.

### Staging implementation slice — bounded agent lifecycle and honest capability coverage
- **Branch:** `feature/messinho-agent-workspace`; no LIVE branch, service, database, or secret changed.
- **Files:** `backend/messinho-agent-core.js`, `backend/messinho-orchestrator.js`, `backend/messinho-capability-runtime.js`, `backend/server.js`, `tests/messinho-agent-core.test.js`.
- Added plan → execute → validate → close state machine with trace events.
- Added an 8-second maximum execution budget and existing 20-step cap; work exceeding the budget is deferred and reported.
- Added one bounded retry for deterministic handler errors; missing data is not retried or fabricated.
- Added structured validation for duplicate/missing capability results and unsupported statuses.
- Integrated the lifecycle into the existing authenticated `/api/agent/chat` route; existing role checks, owner-scoped player retrieval, chat UI and memory persistence remain in place.
- Confirmed that deterministic technical, tactical, athletic, mental and goalkeeper dimension scoring already exists in the evaluation handler; included those five capabilities in specialist coverage reporting.
- Moved seasonal comparison into the learning dispatch path; it compares supplied season metrics without training or changing weights.
- Corrected capability diagnostics to distinguish dispatch from specialist logic and generic fallback. Specialist handlers are marked `partial`, not fully verified.
- **Tests added:** lifecycle, clarification, duplicate/missing result validation and budget visibility.
- **Verification:** GitHub Actions passed on commit `dc3435a416b5b82ed9d6ef545d177c231aa469a1`: both staging validation workflows completed the Node test suite and frontend build successfully. No database integration test is claimed without separate staging credentials. Render staging deployment was not triggered.
- **Known limitations at this checkpoint:** Specialist handler coverage is implemented for all 100 catalogue IDs, but every handler remains labelled `partial` until full contract and end-to-end verification. Durable resumable tasks, SSE streaming, semantic vector retrieval, complete claim-level provenance, and isolated self-evolving code sandbox remain separate workstreams.
- **Next actions:** apply the new task-ledger migration to staging only; configure staging-only Supabase credentials; perform authenticated staging integration tests; continue streaming, provenance and isolated skill evolution.


### Verification update — 2026-11-26
- **Latest code commit tested:** `dc3435a416b5b82ed9d6ef545d177c231aa469a1`
- **GitHub Actions:** both staging workflows passed; `npm test` and `npm run build` succeeded.
- **CI correction:** removed the npm cache option from the workflow because this branch intentionally has no lockfile; dependency installation now runs without a cache-lockfile prerequisite.
- **Planner correction:** natural German phrases `Erkläre die Bewertung` and `erstelle ein Spielerprofil` now resolve to the relevant skills and their dependencies; the regression test passes.
- **Render staging:** service `myscoutingdatabase-messinho-staging` remains on `feature/messinho-agent-workspace`, with auto-deploy disabled. No staging deployment was triggered.
- **LIVE:** production branch/service and production secrets were not changed.

## 17. MESSINHO full capability integration and durable tasks — 2026-11-26

### Capability implementation
- Extended the specialist runtime from 76 specialist branches to **100 specialist handler branches** across all four catalogue domains.
- Added evidence-bound learning diagnostics: scout feedback calibration, position/age/league/country cohorts, player development pathways, breakthrough detection, position-change outcome review, availability/outcome comparison, and controlled optimization proposals.
- Learning outputs are descriptive or proposal-only. They do not automatically activate models or mutate model weights; protected learning remains admin-only.
- Added structured research handlers for automatic candidate ranking, youth filters, international and cross-league grouping, underdog/hidden-gem detection, club and squad review, player statistics, match reports, club-need fit, and comparable-player distance.
- Research handlers consume supplied database/ASI records and source bundles. They do not claim to initiate live external searches when no provider pipeline is called; missing metrics and market values are not invented.
- Runtime diagnostics now report 100 specialist branches and zero generic fallback branches. All are still marked `partial` pending complete contract and end-to-end evidence.

### Automatic agent integration
- Removed the manual one-function-at-a-time selector from the MESSINHO workspace.
- Replaced it with a read-only capability status panel. Capability selection is performed by the existing natural-language planner and agent runtime.
- The chat remains the primary interface; role checks and admin-only learning boundaries remain in force.

### Durable resumable task ledger
- Added `supabase/migrations/20261126_messinho_agent_task_ledger.sql` for owner-scoped task checkpoints, plan/context snapshots, compact result summaries, pending capability IDs, attempts, 30-day expiry and execution leases.
- Added authenticated `GET /api/agent/tasks` and `POST /api/agent/tasks/:taskId/resume` endpoints.
- Incomplete plans with deferred steps now persist a checkpoint. Resumption is owner-scoped, uses the current authenticated role, carries prior capability results as untrusted context, and is protected by an atomic lease with expiry recovery.
- The chat UI lists saved tasks and provides a **Fortsetzen** action. Tasks waiting for additional user input are not blindly retried.
- Persisted payloads are bounded; task state is not exposed across users. The database table has RLS with owner-only reads and no client write policy.

### Verification and deployment boundary
- CI passed on the pre-ledger baseline `a54e12b4f747c0e684374ef4f017d18b470838c8` after the new 100-handler tests were added.
- Latest source commit `84bf7c658e4eb207b0740ff8d50dbffd2a94a5a2` includes task leases, task UI, compact persistence and evidence provenance. Both GitHub Actions workflows passed `npm test` and `npm run build` on this commit.
- **Staging migration required:** apply `20261126_messinho_agent_task_ledger.sql` to the separate staging Supabase project. The API reports persistence unavailable if the table is absent.
- Render staging auto-deploy remains disabled; no deployment was triggered. LIVE branch, service, database and secrets remain untouched.
- The project has not been declared LIVE from this work. Authenticated staging integration and a controlled staging deployment remain outstanding.


### Provenance implementation update — 2026-11-26
- Each capability result now carries a structured provenance object: origin classification, bounded player-record references, normalized metric evidence, source URL/transport assessment, verified-outcome count, derived-score links, and explicit evidence limitations.
- Agent validation rejects useful results whose provenance is missing or does not match the capability ID.
- Execution traces persist compact provenance; resumable task checkpoints retain bounded provenance and prior results as untrusted context.
- No external source is labelled verified merely because it is HTTPS or present in a request. Dedicated verification remains required.
- **Verification:** Both CI workflows passed on `84bf7c658e4eb207b0740ff8d50dbffd2a94a5a2`; Node tests and frontend build succeeded.


### Live progress streaming and per-step recovery — 2026-11-26
- Converted the capability orchestrator and agent lifecycle to awaited asynchronous execution so each completed capability can be checkpointed before the next step begins.
- The authenticated chat route creates an owner-scoped task before execution, updates its compact result history and pending step list after each capability, and finalizes the task only after validation.
- If execution is interrupted, the task remains recoverable. Expired two-minute execution leases are reset to `partial` on the next task-list request; a resume uses an atomic claim to prevent concurrent execution.
- Added optional Server-Sent Events to the existing chat endpoint. The UI receives start, per-step progress and completion events, while ordinary clarification/small-talk responses retain JSON compatibility.
- If the client stream disconnects, the backend continues to checkpoint while the process remains alive; if the process stops, the last completed checkpoint remains available after lease expiry.
- **Verification:** both GitHub Actions workflows passed Node tests and frontend build on source commit `9009f8d0c5a73c87f0b1d95872ea04e58dc63e8b`. The current branch head is `f3da1dc8c0f036b4cc791997a81021489f14be91`; the last commit adds only explicit least-privilege grants and RLS refinements to the migration.

### Staging database boundary
- Supabase project discovery returned one project named `myScoutingDatabase` and no separate `myScoutingDatabase-staging` project. The other available test project belongs to the separate PFFS/PFMS work and must not be reused.
- Therefore `20261126_messinho_agent_task_ledger.sql` is committed but **not applied**. Applying it to the only myScoutingDatabase project could alter production, which is expressly out of scope.
- Migration now enables RLS, grants owner-only authenticated read policy as defense in depth, revokes direct `anon`/`authenticated` table access, and grants CRUD only to backend `service_role`. This follows Supabase's 2026 Data API guidance that new public tables are not automatically exposed and require explicit grants.
- Render staging remains configured with auto-deploy disabled. No Render deployment or production change has been made.
- **Required before staging end-to-end test:** provide or create a dedicated myScoutingDatabase staging Supabase project and configure its credentials only in the staging Render service; then apply the migration to that staging project and verify the task list/resume flow.
