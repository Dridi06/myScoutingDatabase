# PROJECTSCOUT — Master Project Record

> **Single source of truth for myScoutingDatabase and MESSINHO.**  
> This document is the persistent handover, product specification, design baseline, decision log, implementation register, and release journal. Read it before continuing work in a new chat.

- **Project:** myScoutingDatabase
- **AI module:** MESSINHO — Autonomous Scouting Intelligence
- **Repository:** `Dridi06/myScoutingDatabase`
- **Production branch:** `main`
- **Production URL:** https://myscoutingdatabase.onrender.com
- **Document owner:** Project owner / user
- **Last updated:** 2026-11-28
- **Document status:** Active — authoritative project record

---

## 1. Mandatory rules for every future session

1. Read this file from the repository's current `main` branch before making project changes. Do not rely on an old chat summary if the repository contains a newer record.
2. Work only on **myScoutingDatabase**. PFMS and PFSS are separate projects and must never be changed as part of this work.
3. **Current explicit operating boundary: staging only.** Keep production (`main`, production Render service and production Supabase) untouched unless the owner explicitly authorizes a production release in the current conversation. A branch commit is not a staging deployment; verify the exact Render service, branch, deployment commit and health before saying a change is live.
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
- [ ] Ensure only verified outcomes enter calibration.- [ ] Add monitoring tasks and event triggers with explicit user/role permissions.
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

## 13. Unified AI integration decision — 2026-11-26

**Owner instruction:** inspect the AI currently operating in the LIVE product and combine it with the independently developed MESSINHO agent. Do not replace either system.

### Verified existing LIVE AI path (source inspection, not a new live test)
The current `main` implementation contains a single `/api/agent/chat` route that already combines:
- deterministic MESSINHO request interpretation, typo correction and conversation follow-up handling;
- the ASI player-search/research pipeline and source-backed player research;
- MESSINHO's independent player scoring, 100-capability registry, planning and runtime;
- an optional OpenAI conversational/research provider fallback using the configured server-side model;
- authenticated user/role checks and owner-scoped access to the player's own records;
- a provider-independent MESSINHO response path when OpenAI is not configured or unavailable.

**Preservation rule:** the existing chat endpoint, conversational behavior, ASI search, research providers, evidence constraints, deterministic scoring and learning remain the foundation. OpenAI is a supporting language/research provider, not the MESSINHO agent identity or its learning engine.

### Integration now implemented on the isolated feature branch
- Added `backend/messinho-agent-core.js`, a bounded plan → execute → validate state machine.
- Connected the existing automatic capability execution path in `backend/server.js` to this agent core.
- Preserved the existing `/api/agent/chat` route and all preceding special paths (scouting search, player follow-ups, comparison, summaries, candidate retrieval and OpenAI conversational fallback).
- The integrated path reports agent lifecycle phase, validation, next action, retry/re-plan status and agent-core version alongside existing orchestration output.
- Execution remains provider-independent; no active model weights are changed by ordinary chat execution.
- Added agent-core unit tests. Their execution status must be confirmed by CI before release.
- No production deployment, production database write, model activation or migration was performed by this integration.

### Unified target architecture
1. **Existing chat / language layer:** preserve current conversation and optional provider-backed natural-language responses.
2. **MESSINHO agent core:** interpret the goal, create a bounded plan, coordinate execution, validate outputs and decide whether to ask, retry, resume or report.
3. **Existing ASI and MESSINHO specialists:** use the existing scouting search, evidence/research, scoring, analysis, capability runtime and learning modules.
4. **Shared security boundary:** authenticate once per request, retain role checks and owner/organization scoping for every data operation.
5. **Shared memory/task continuity:** bring the existing staging memory and task-ledger work across selectively only after schema, ownership, retention and failure-recovery review; do not copy a divergent branch wholesale.
6. **Controlled learning:** only verified outcomes can inform proposals; candidate models remain inactive until evaluation and authorized approval.

### Design baseline audit — screens and behavior to preserve
- **Login / entry:** approved stadium backdrop and football-scout visual identity; preserve the intended approximately 3.5-second welcome sequence only where current assets/code support it.
- **Global shell:** navy/silver visual language, consistent typography/spacing, brand mark, sidebar and persistent system status.
- **Dashboard:** existing dashboard hierarchy, status cards and responsive tile arrangement.
- **Player search and ASI:** existing search filters, player result presentation, candidate/research evidence and ASI workspace.
- **MESSINHO:** existing chat as the sole conversation surface; no duplicate chat; preserve subdued composer, natural input, result cards and separate diagnostic/history areas.
- **System diagnostics:** existing system status, diagnostic cards, details, retained history and MESSINHO quality diagnostics.
- **Responsive/mobile:** preserve the existing iPhone/mobile navigation, compact cards, readable spacing and desktop behavior.
- **Assets:** do not replace the stadium/mascot/celebration assets without checking exact paths, dimensions and rendered result.

This is a preservation inventory, not a claim that every visual state has passed a fresh pixel-level or device-level regression test. Exact CSS tokens and asset references remain governed by the checked-in implementation.

### Branch / release state
- Integration branch: `feature/messinho-unified-ai-integration` (created from current `main`).
- Base commit: `fa0d4dfbdd779f280bb3caf44c6cc70be8dcb5b6`.
- New production deployment: **not performed**.
- Staging deployment: **not performed**; Render staging still needs its branch/service mapping checked before deployment.
- Current release gate: CI tests/build, security review of memory/task integration, staging deployment and end-to-end checks of conversation + research + agent execution + provider outage fallback.
- Do not merge to `main` or deploy to production without explicit owner approval.

### Change & Decision Log — 2026-11-26
- Accepted: retain the existing LIVE AI path and integrate the independently developed MESSINHO agent core around its capability execution path.
- Accepted: preserve the entire established design baseline; improve without replacing approved screens/assets.
- In progress: selective integration of durable memory/task ledger and verified live-data context after schema and authorization review.
- Not authorized: production deployment, production database changes, wholesale merge of the divergent staging branch, or automatic activation of a learned model.


---

## 14. Release-candidate checkpoint — 2026-11-26

**Owner objective:** prepare the advanced Staging system so it can later be promoted to LIVE safely, while preserving the existing LIVE AI and all approved product behavior.

### Candidate
- Branch: `feature/messinho-unified-ai-integration`
- Pull request: [#47](https://github.com/Dridi06/myScoutingDatabase/pull/47)
- Candidate HEAD at checkpoint: `1b69a0bd0b0ed67c9d2db7da87f85e7c52df4441`
- Base: `main` at `fa0d4dfbdd779f280bb3caf44c6cc70be8dcb5b6`
- PR remains draft/open; not merged.
- GitHub Actions MESSINHO Node tests run `45746920376` was still installing dependencies at checkpoint; no passing test result may be claimed yet.

### Work completed in this checkpoint
- Preserved the existing LIVE `/api/agent/chat` and specialist execution path while integrating the bounded MESSINHO Agent Core.
- Added agent-core unit tests.
- Added the staging memory/traces migration and task-ledger migration definitions to the candidate for review and reproducibility.
- Added `docs/RELEASE_PROMOTION.md` with a controlled Staging→LIVE promotion process, security boundaries, CI, database rehearsal, E2E acceptance, backup and rollback gates.
- Updated PR #47 to clearly distinguish included migration definitions from the still-pending full memory/task runtime integration.

### Not yet completed / release blockers
- Full selective integration of staging memory persistence, task ledger, streaming recovery and safe task resume into the current LIVE codebase.
- Review and selective integration of the separate live-data-context work.
- CI test and production build pass on the final candidate SHA.
- RLS / cross-user isolation / safe-resume and idempotency tests.
- Exact candidate deployed and verified on staging Render service.
- E2E acceptance of existing chat, ASI, capabilities, provider fallback, interrupted tasks and mobile UI.
- Backup/restore and rollback rehearsal.

### Environment safety
- Work in this checkpoint changed GitHub feature branch/PR only.
- No Render service branch or deployment changed.
- No Supabase project was migrated by these commits.
- No production service, production database, production secret or active model weight was changed.
- Continue staging-only. Never merge to `main` or deploy production without explicit owner approval in the current conversation.

### Next action
Wait for the current CI run, inspect the staging agent helper/route and main route side by side, then selectively integrate memory/task recovery into the candidate without replacing the current main server or approved frontend. Only after CI and security checks pass should the staging Render service be pointed to this candidate branch.


---

## 15. Unified AI / task continuity checkpoint — 2026-11-26

### Implemented on the release candidate
- Preserved the current main-branch chat route and its existing ASI, deterministic scoring, learning and conversational fallback paths.
- Added a separate asynchronous capability runner for bounded execution budgets and awaited per-capability checkpoint callbacks. The original synchronous `runMessinhoCapabilityPlan` API remains intact for existing consumers.
- Integrated owner-scoped MESSINHO memory read/write and execution trace persistence into the existing automatic capability path.
- Added bounded context reuse for the previously selected player when no new player name is supplied; access remains scoped through `scopeMessinhoOwner`.
- Added server-managed task ledger helpers for creation, checkpointing, finalization and bounded context storage.
- Added authenticated task listing and task-resume endpoints. Task reads and updates are constrained by both task ID and authenticated owner ID; resume uses a conditional status claim to prevent concurrent replay.
- Retained bounded source context (title, URL, publisher, date and excerpt) and claims for resumable tasks. Stored context is size-limited; previous capability results remain untrusted context and are not promoted to evidence.
- Included the staging-only memory/trace and task-ledger migration definitions in this candidate and documented the Staging→LIVE promotion process.

### Automated verification
Candidate SHA: `c25a724dc64135d889ca99bde03a3721d0a2c57c`

All three GitHub Actions workflows completed successfully on this exact SHA:
- MESSINHO Node tests: success — run `45747384840`
- MESSINHO validation (unit tests + frontend build): success — run `45747384905`
- ASI quality checks (tests + frontend build): success — run `45747384870`

This is automated CI evidence only. It is not a substitute for a deployed staging E2E test or security review against the live staging database.

### Deployment and release state
- PR #47 remains open and draft; not merged.
- Staging Render service remains configured to `feature/messinho-agent-workspace` with auto-deploy off. This candidate has **not** been deployed.
- The last staging runtime audit reported missing Supabase service-role credentials in Render. Recheck the staging service configuration and startup logs before deployment; configure the staging-only key directly in Render, never in Git or chat.
- No staging database migration was executed by this candidate's commits; migration definitions are versioned for review.
- Production Render, production Supabase, production secrets and active model weights remain untouched.

### Remaining acceptance gates
1. Review task-resume behavior for idempotency, expiration, stale leases and safe retry of partially completed work.
2. Verify RLS and cross-user isolation with two separate staging test accounts.
3. Verify memory, trace and task persistence against the staging Supabase project.
4. Configure the missing staging-only service-role secret in Render and verify the startup DB check.
5. Deploy this exact candidate SHA to the staging service and run authenticated E2E tests for login, chat, ASI, capability execution, task interruption/resume, provider fallback and mobile UI.
6. Only after all gates pass, prepare a production PR from the verified candidate and obtain explicit production-release approval.

**Do not merge PR #47 or deploy production automatically.** The candidate is CI-green and functionally integrated at code level, but staging deployment and E2E acceptance are still pending.

---

## 16. Stale task lease safety hardening — 2026-11-26

- Reviewed the task-resume route and found that an expired `running` lease was not handled. A process crash could leave a task permanently marked as running.
- Added an owner- and task-scoped conditional update for expired leases. A stale run is moved to `failed`, its lease is cleared, and a review-required error is recorded.
- Deliberately do **not** replay stale work automatically: a capability may have completed an external side effect immediately before its last persisted checkpoint. Automatic replay could duplicate that side effect.
- Active, non-expired runs remain protected; concurrent stale recovery is guarded by the conditional `status='running'` and `lease_until <= now` update.
- This is a safety quarantine, not a full exactly-once execution guarantee. Before enabling automatic recovery, capability-level idempotency keys and side-effect classification must be implemented and tested.
- Code change commit: `9dc97876532ecced908625afb9750b281ac50638` on `feature/messinho-unified-ai-integration`.
- CI for this new commit must complete before it is considered verified. Staging deployment, DB migration and all production actions remain unperformed.


---

## 17. Candidate CI and Staging deployment audit — 2026-11-26

### Candidate verification
- Candidate branch: `feature/messinho-unified-ai-integration`.
- Candidate SHA reviewed: `2e606b4a554ed9de1954500da7a4030893323ff2`.
- PR #47 remains open, draft, unmerged; base is `main`.
- GitHub Actions on the exact candidate SHA all completed successfully:
  - `validate`: success — job `139667760568`.
  - `test`: success — job `139667760395`.
  - `test-and-build`: success — job `139667760113`.
- This confirms automated checks/build only; authenticated staging E2E and database isolation tests remain outstanding.

### Staging Render audit
- Staging service: `myscoutingdatabase-messinho-staging` (`srv-dc3chlqjnfac73acd6ig`).
- URL: https://myscoutingdatabase-messinho-staging.onrender.com
- Current configured branch: `feature/messinho-agent-workspace` (not the candidate branch).
- Auto-deploy remains disabled.
- Most recent successful deployment: `dep-dc3pnoui0phs7386bvg0`, commit `e9e5157abf38b9f98514a5020bf910bfbb7fbeb0`, completed `2026-11-26T02:39:49Z`.
- That deployed commit is not the candidate SHA. Therefore the candidate is **not yet deployed to Staging**.
- The available Render connection exposes service inspection, deploy and environment-variable operations, but no direct service-branch update operation. Do not repoint or overwrite the divergent old branch, and do not trigger a deployment of it as a substitute.
- No staging migration was applied during this audit. Production Render and production Supabase remain untouched.

### Next safe action
1. Change the Staging Render service's Git branch to `feature/messinho-unified-ai-integration` through the Render service settings (preserve all existing environment variables; do not replace them).
2. Keep auto-deploy disabled; verify the selected branch and exact candidate SHA before triggering a Staging-only deployment.
3. Verify health/startup logs and then execute authenticated E2E checks for chat, ASI, capability execution, memory/task persistence, owner isolation, resume safety, provider fallback and mobile UI.
4. Review and apply the two versioned MESSINHO migrations to the Staging Supabase project only after schema/RLS review and backup.
5. Keep PR #47 unmerged and production untouched until all gates pass and the owner explicitly authorizes promotion.

## Checkpoint – 2026-11-26 – MESSINHO backend syntax repair and Staging startup

- Environment: Staging only. Production branch `main` and production Render service were not changed.
- Branch: `feature/messinho-unified-ai-integration`
- Repair commit: `fb2a1a8a1b9b94fbee462c2656da6d05a3a17b2a`
- Root cause: a second, incomplete registration of `GET /api/messinho/capabilities` appeared immediately before the `/api/agent/chat` limiter. The original complete, admin-protected catalogue route already existed earlier in the file. The duplicate incomplete route was removed; the original route and intervening backend endpoints were preserved.
- Validation: MESSINHO backend syntax workflow passed; MESSINHO Node tests passed; MESSINHO validation passed; ASI quality checks passed.
- Render Staging deployment: `dep-dc3qh3ei0phs7388kdu0` – status `live`; build succeeded; application started and logged `myScoutingDatabase API listening on 10000`.
- Supabase Staging connectivity: Data API returned HTTP 200.
- Important runtime observation: startup diagnostics reported `TAVILY_API_KEY=false` and `OPENAI_API_KEY=false`. The backend process is live, but provider-backed research/conversational fallback cannot be considered operational until the corresponding Staging environment configuration is verified. Do not expose or request secret values in chat; inspect environment-variable presence through Render's secure settings.
- Remaining verification: authenticated smoke test of `/api/agent/chat` and `/api/messinho/capabilities`, provider configuration check, then controlled AI-agent behavior tests. No production promotion or PR merge authorized.

## Checkpoint – 2026-11-26 – Staging health smoke test

- Added `.github/workflows/staging-health-smoke.yml` on the candidate branch. It probes the public Staging `/api/health` endpoint from a GitHub-hosted runner and fails if HTTP health or database readiness is not OK.
- First smoke run: `45749868929` – success.
- Observed response: HTTP 200, `ok=true`, database `ok`, authentication `ready`, MESSINHO core `provider_independent`.
- Remaining provider readiness: `externalResearch=not_configured` and `optionalAiAnalysis=not_configured`. Render startup diagnostics independently reported `TAVILY_API_KEY=false` and `OPENAI_API_KEY=false`. Do not assume previously supplied credentials are present under the exact environment variable names read by this Staging service. Render connector does not expose secret values; never print them. Confirm presence securely in the Staging service's environment settings or align variable names without disclosing values.
- Authenticated admin-only route checks and a real interactive AI-agent conversation are still pending; no admin access token or login session was available to this automated run. Do not create or reset user credentials as a workaround.
- Staging remains live. Production untouched; PR #47 remains unmerged.



## 2026-11-26 – MESSINHO-Chat: Scrollbarkeit langer Verläufe
- Nutzerfehler: Bei langen Chatverläufen ließ sich der Nachrichtenbereich nicht zuverlässig scrollen.
- Ursache in der Oberfläche: Der Nachrichtencontainer hatte Höhenbegrenzungen, aber keine explizite eigene vertikale Scroll-Konfiguration; außerdem fehlten Touch-Scrolling- und Overscroll-Regeln.
- Korrektur in `src/asi/messinho.css`:
  - Chatkarte als flex-column mit `min-height: 0`.
  - Nachrichtenbereich als eigener flexibler Scrollcontainer mit `overflow-y: auto`, `overflow-x: hidden`, `min-height: 0`.
  - Touch-Scrolling für iOS/Android (`-webkit-overflow-scrolling: touch`, `touch-action: pan-y`).
  - `overscroll-behavior-y: contain`, stabile Scrollbar-Spalte und nicht schrumpfende Nachrichten.
  - Mobile Maximalhöhe bleibt responsiv bei 58vh.
- Commit: `0de1b32d1328f3ff208eaea64d65852815ab3c73`
- Branch: `feature/messinho-unified-ai-integration`
- Ausschließlich Staging-Kandidat. Production `main` unverändert; PR #47 nicht gemergt.
- Nächster Schritt: Frontend-Build/CI prüfen, anschließend Staging manuell deployen (Render autoDeploy ist deaktiviert) und Scrollen mit langem Verlauf auf Desktop und iPhone verifizieren.

---

## 2026-11-26 — U19 scouting clarification regression

- **User-observed defect:** MESSINHO asked for birth year and position after receiving a complete request for three U19 midfielders from Germany.
- **Root cause confirmed in code:** `parseMessinhoScoutingRequest` only recognized explicit four-digit birth years and narrow midfield position labels; it did not interpret U-age groups or the generic position group “Mittelfeldspieler”. The request parser also treated target league as mandatory even when the user described a broad performance level.
- **Changes on staging candidate branch:**
  - Recognize U-age groups (e.g. U19) as sufficient age criteria without demanding an exact birth year.
  - Recognize “Mittelfeldspieler” / “Mittelfeld” / “Midfielder” as a broad position group and match central, defensive, and attacking midfield roles.
  - Parse German number words (including “drei”) for requested candidate counts.
  - Treat target league as optional context; do not block broad scouting tasks with an unnecessary level question.
  - Map U19 to the current scouting search age band (16–18) when no exact birth year is supplied.
  - Add regression tests for the exact user prompt, broad midfield matching, and U19 without birth year.
- **Files changed:** `backend/messinho-validation.js`, `backend/server.js`, `tests/messinho-validation.test.js`.
- **Commits so far:** parser `4a763cb78bd71f7179b075d102aebba7d092093c`; server `82e901006972b05d74dc93ee23e3b3bbc0a80e11`; regression tests `a74c5d7de54af046812a408b32f0f18b79224c7b`; parser regex correction `3c8f1e1333d11321a97e642cd8265d85a637894f`.
- **Validation:** first CI attempt exposed two failing new regression tests caused by over-escaped regex literals and an unchanged narrow position/quantity regex. Those were corrected in the latest parser commit. A fresh full test run is still required; do not report this fix as verified until it passes.
- **Release boundary:** staging candidate branch only. Production branch, production Render, and production Supabase untouched. Do not deploy until tests pass.
- **Next:** run full MESSINHO tests and build, inspect all results, then deploy only to the designated staging Render service and verify the exact deployment SHA and health.

---

## 2026-11-26 — MESSINHO natural conversation and provider error handling

- **User request:** Make MESSINHO behave naturally in everyday conversation (e.g. hello ↔ hello, “how are you?” ↔ “I'm well, thank you, and you?”), and integrate everyday conversational behavior as a normal capability.- **Observed production-like Staging failure:** The global player-selection call reached OpenAI but returned HTTP 429 with `insufficient_quota` / `credit_balance_exhausted`. Tavily and OpenAI credentials were detected by the Staging process; provider billing quota, not request parsing, blocked analysis.
- **Implemented on Staging candidate branch:**
  - Added provider failure classifier distinguishing exhausted quota, invalid API key, rate limit, temporary provider outage, and generic provider errors.
  - Discovery endpoint now returns a clear, safe German user-facing message and stable error code rather than the generic “global player selection” message.
  - Added provider-independent natural small-talk handling for greetings, “Wie geht's?”, thanks, and farewells. It executes before scouting intent parsing and does not consume model/API credits.
  - Everyday non-small-talk conversation continues through the existing conversational model path when available; scouting and factual research remain evidence-based and are not fabricated by the small-talk shortcut.
  - Added unit tests for greeting flow, how-are-you, thanks/goodbye, ordinary messages not swallowed, and provider failure distinctions.
- **Files changed:** `backend/messinho-conversation.js`, `backend/server.js`, `tests/messinho-conversation.test.js`.
- **Commits:** helper `0724f2a7f3de4cbcb359882e3f6b216dc8c22def`; server integration `1653bcf6dba39a33ddebee9f1258e8f8e62c8947`; tests `1e79947be49b548fbd151cd1bafffbf2d5530cba`.
- **Release boundary:** candidate branch only. No deployment yet. Production untouched.
- **Next:** run full tests, backend syntax and frontend build; inspect failures; deploy only to Staging when all gates pass. After deployment test “Hallo”, “Wie geht's?” and the quota-error message. General everyday Q&A still relies on the existing provider conversation path; the new deterministic local layer covers common social exchanges.

### Deployment result — 2026-11-26 04:12 UTC

- Corrected Unicode/punctuation normalization in `backend/messinho-conversation.js`; regression tests now pass.
- Latest checks on commit `e8c50cd73df80eded041b1b8d85764618a13a80d`:
  - MESSINHO backend syntax — success (run 45753592808)
  - MESSINHO Node tests — success (run 45753592864)
  - ASI quality checks / frontend build — success (run 45753592776)
- Render Staging deploy `dep-dc3r306c6qcc73blp3a0` reached status `live` at 2026-11-26 04:12:17 UTC on exact commit `e8c50cd`.
- Production untouched. Open PR #47 remains draft/unmerged.
- Remaining validation: authenticated UI test “Hallo” → greeting; “Wie geht’s?” → natural reply; quota-exhausted discovery → clear user-facing explanation. Full autonomous scouting remains blocked until OpenAI API quota is replenished.

---

## 2026-11-26 — Expand MESSINHO into a natural everyday conversation agent

- **Source:** User-uploaded Word specification (4 pages), fully reviewed.
- **Requirements extracted:** intent recognition for greeting, how-are-you, thanks, goodbye, apology, coffee/breaks, weekend/football small talk, and bot identity; varied response pools; time/day-aware wording; avoid immediate repeated replies; route normal scouting work to the existing scouting agent.
- **Implemented on candidate branch:**
  - Replaced the small fixed greeting shortcuts with a modular social intent engine in `backend/messinho-conversation.js`.
  - Added all eight intent groups from the document and natural German variants/normalization.
  - Added time-of-day greeting and weekday-aware weekend/football phrasing.
  - Added recent assistant-history awareness to avoid repeating the same reply in the current conversation.
  - Protected scouting/work requests from social interception so normal player searches and analysis continue through the existing MESSINHO/ASI path.
  - Bot identity answers explicitly state that MESSINHO is an AI; no false human identity.
  - Connected the engine to the existing authenticated `/api/agent/chat` route; no separate chat or new UI.
  - Expanded tests in `tests/messinho-conversation.test.js` to cover all intents, repetition avoidance, work routing and provider error classification.
- **Files:** `backend/messinho-conversation.js`, `backend/server.js`, `tests/messinho-conversation.test.js`.
- **Current head:** `1d132747ada1f1fef1091a1147e935839eeaf2b1`.
- **Staging health smoke:** passed (run `45754793292`). Full test/syntax/build CI for this exact commit is still to be confirmed.
- **Release boundary:** not yet deployed. Production untouched. PR #47 remains draft/unmerged.
- **Next:** verify all CI checks; fix any failures; then manually deploy only to the Staging Render service and verify the exact deployed commit. Authenticated in-app tests still required.

### Implementation follow-up — social engine wired to chat

- Updated `backend/server.js` so the existing authenticated MESSINHO chat passes recent conversation history into `getMessinhoSocialReply`.
- Normalized German umlauts and ß, including variants such as “Wie geht’s?”, “Tschüss”, “Dankeschön”, and “müde”.
- Corrected intent detection to avoid intercepting explicit scouting/work requests.
- Latest code head: `dd545fbc35d97ce4eeb06a84384e31a57f75fcaf`.
- Tests were expanded, but automated Node/syntax/build results for this exact head have not yet been returned by GitHub Actions. Staging deployment is therefore pending verification; do not claim live yet.

### Verification update — 2026-11-26

- Fixed a flaky case-sensitive assertion in `tests/messinho-conversation.test.js`; the social reply pool legitimately contains “Immer gern!” and the assertion now accepts case variants.
- Exact code commit `8d28ec5df4e06855279f04b6264ff0059091335c` passed:
  - MESSINHO Node tests — run 45754963679
  - MESSINHO backend syntax (including `node --check backend/server.js` and `npm test`) — run 45754963508
  - ASI quality checks / frontend build — run 45754963515
  - MESSINHO validation — run 45754963454
  - Staging health smoke — run 45754963477
- All five checks are green. Manual Staging deployment is the next step; verify exact deployed SHA before announcing LIVE.

---

## 2026-11-26 — U-19 hyphenated age-group parser correction

- **User-observed regression:** The exact chat input `Suche drei U-19 Mittelfeldspieler aus Deutschland` still triggered a clarification asking for birth year or age group.
- **Root cause:** `backend/messinho-validation.js` matched `U19` and `U 19` but not the hyphenated form `U-19`.
- **Fix:** Age-group parser now accepts optional whitespace or hyphen between U and the age number and normalizes all forms to `U19`.
- **Regression coverage:** Added a test that runs the same complete request with `U19`, `U-19`, and `U 19`, asserting quantity=3, ageGroup=U19, position=Mittelfeldspieler, region=deutschland, and no missing criteria.
- **Files:** `backend/messinho-validation.js`, `tests/messinho-validation.test.js`.
- **Code commits:** parser `f234d1f1a3528e8182e776da0be7a6c6624d2920`; tests `4062245ce17962d727bc096d9aae5eea3e8c9f96`.
- **Status:** Not deployed. Waiting for CI on the latest branch head. Production untouched.

---

## 2026-11-26 — Autonomous question resolution and live system clock

- **User requirement:** MESSINHO should not be limited to known commands. For unfamiliar questions it should inspect context, identify what is needed, use an appropriate source/tool, verify the result, and answer logically; it should ask a follow-up only if required. Example: “Wie spät ist es?” must be answered from the live clock (the user gave 05:31 as an example), not guessed from model training.
- **Implemented:**
  - Added provider-independent `resolveMessinhoLiveQuestion` in `backend/messinho-conversation.js`.
  - Added authoritative runtime clock resolution for current time, date/day, and combined date/time questions using `Intl.DateTimeFormat` with the explicit `Europe/Berlin` time zone. It returns the verified timestamp and tool provenance.
  - Routed live time/date questions in the existing authenticated `/api/agent/chat` path before social small talk and before the LLM fallback. These answers do not consume OpenAI quota and do not depend on model memory.
  - Strengthened the conversation system instruction: treat all messages as possible questions/tasks, inspect context and available tools first, use live runtime data for current facts, research and validate evidence when supported, separate fact/inference/uncertainty, and ask only necessary clarifying questions. No fabricated tool results.
  - Added regression tests proving a UTC clock at 2026-11-26 04:31 returns 05:31 in Berlin, date/day and combined queries work, and unrelated questions are not falsely answered by the clock resolver.
- **Files:** `backend/messinho-conversation.js`, `backend/server.js`, `tests/messinho-conversation.test.js`.
- **Current code commits:** live resolver `f3e2802a5f0a8c05f509aea685bf20e269b1d5d4`; chat integration `b624ca3d95587927f5d4b9d77637e20063ecc600`; tests `abd3a013fe939ca48ed96b9a7d4773ab94fd7a64`.
- **Status:** Candidate branch only; automated CI results for current head have not yet been returned. No deployment performed. Production untouched.
- **Next:** confirm exact PR head and CI, inspect any failures, then manually deploy to Staging only and verify exact Render commit. Continue expanding the tool resolver registry only for tools with authoritative sources; unknown/unverifiable questions must be researched or transparently clarified, never guessed.

### CI failure corrections — 2026-11-26

- Inspected the four failed workflow logs on head `d7c35a801f2335fef2784aebf193cfb4fcdf0c48`; failures reduced to two implementation defects exposed by tests:
  1. Live clock/date intent regexes were double-escaped, so the resolver returned `null` for ordinary questions such as “Wie spät ist es?”.
  2. Candidate-count regex allowed a U-age token only with optional whitespace, not a hyphen; “drei U-19-Mittelfeldspieler” therefore defaulted to 10.
- Fixed the live time/date regex literals in `backend/messinho-conversation.js` (commit `1a69f9f4de41331343b277da62c36df26d5ad279`).
- Fixed the quantity lookahead to accept U-age notation with whitespace or hyphen in `backend/messinho-validation.js` (commit `32daabc9b1e92308ff263e16cb6c644e079f7ac1`).
- Both changes are isolated and covered by the existing regression tests for Berlin time/date and U19/U-19/U 19 count=3.
- **Status:** Waiting for CI results on the latest head. No deployment until all required checks pass. Production untouched.


---

## 2026-11-26 — Controlled MESSINHO knowledge-gap and capability evolution foundation

- **Source requirement:** User-provided 15-page Word document describes unknown-question detection, new capability development, durable knowledge, versioned upgrades, regression testing, and feedback-based self-improvement.
- **Architecture decision:** Adopt the evolutionary loop, but do not copy the supplied Python/LangGraph code verbatim. Its dynamic `exec`/module-import approach and incomplete sandbox are not an acceptable security boundary for a multi-user web service.
- **Implemented on the Staging candidate branch:**
  - Added `backend/messinho-evolution.js` with explicit knowledge-gap classification, bounded/sanitized declarative proposals, version metadata, approved-example matching, and a promotion gate.
  - Proposal operations are restricted to a reviewed allowlist (`system_clock`, `calendar_date`, `basic_arithmetic`, `unit_conversion`). Arbitrary Python/JavaScript source is rejected and never evaluated.
  - Protected side-effect/sensitive requests are marked for human review rather than being converted into autonomous executable capabilities.
  - Promotion requires valid schema, at least two test cases, passing regression tests, and an explicit approver. Candidate proposals are not automatically executable.
  - Integrated knowledge-gap metadata into the existing `backend/messinho-agent-core.js` no-plan outcome and pass the original user goal from the chat route.
  - Added tests for gap detection, protected requests, schema validation, executable-code rejection, test/approval gates, approved-example reuse, and agent-core reporting.
- **Files:** `backend/messinho-evolution.js`, `backend/messinho-agent-core.js`, `backend/server.js`, `tests/messinho-evolution.test.js`, `tests/messinho-agent-core.test.js`.
- **Initial CI findings:** First test run exposed regex escaping and missing original-goal propagation. Both root causes were corrected and a new CI run was triggered. The exact latest commit must pass all required checks before Staging deployment.
- **Current intended boundary:** Staging candidate branch only; no Render deployment, no Supabase migration applied, no Production changes, no PR merge.
- **Not yet complete:** Durable database storage for evolution proposals/approved capability versions, runtime execution adapters for newly approved declarative operations, semantic embedding retrieval, automatic candidate generation from provider/tool research, user-feedback ingestion, and end-to-end chat integration of unknown-question fallback. The current code is a secure foundation, not the complete self-evolving agent.
- **Next:** Verify latest CI; correct failures; then implement owner-/admin-scoped persistence and safe reviewed operation handlers. Deploy only after all required tests and staging migration review are complete.


### Regression correction — 2026-11-26

- Re-inspected the failing CI logs on head `052562b015fc588a776dbad70bfd1c5f8ca5e613`. The remaining failure was the new knowledge-gap test invoking the agent core without a user goal; an empty input is correctly not classified as a knowledge gap.
- Updated `tests/messinho-agent-core.test.js` to provide a concrete unknown tactical question. Commit: `c58997f59c8eca0deac76b12d8ce00a9a54210e3`.
- On that exact commit, MESSINHO backend syntax, MESSINHO Node tests, ASI quality checks, and Staging health smoke test are green. MESSINHO validation is still running at the time of this checkpoint; do not infer full CI completion until it returns.
- No deployment, migration application, merge, or Production changes. Staging remains the only intended target.


## 2026-11-26 — Agent-Core Ergebnisvalidierung korrigiert und STAGING aktualisiert

### Ausgangspunkt
- Fortsetzung nach dem vorherigen Checkpoint zur kontrollierten MESSINHO-Evolution und Wissenslückenbehandlung.
- Maßgeblicher Render-STAGING-Service: `myscoutingdatabase-messinho-staging`, ID `srv-dc3chlqjnfac73acd6ig`.
- Der tatsächlich konfigurierte Render-Branch ist `feature/messinho-unified-ai-integration`; ältere Checkpoints mit `feature/messinho-agent-workspace` sind für den aktuellen STAGING-Service nicht maßgeblich.
- Render Auto-Deploy bleibt deaktiviert. Änderungen wurden ausschließlich auf dem oben genannten Entwicklungsbranch vorgenommen.

### Fehlerkorrektur
- Datei: `backend/messinho-agent-core.js`.
- Commit: `8129091c3c413512944291a2b619280834d0e374`.
- Befund: `validateMessinhoAgentRun` erfasste fehlende Ergebnisse geplanter Capability-Schritte in `missing_results`, bezog diese aber nicht in `valid` ein. Ein unvollständiger Plan konnte dadurch fälschlich als gültig ausgewiesen werden.
- Korrektur: `valid` ist jetzt nur wahr, wenn auch `missingResults.length === 0` gilt.
- Regressionstest in `tests/messinho-agent-core.test.js`: Ein Plan mit zwei erwarteten Fähigkeiten und nur einem zurückgegebenen Ergebnis muss `valid === false` liefern.
- Test-Commit: `82b126e342989c91f4af19eeb0b8956692c592b3`.

### CI-Nachweise für Commit `82b126e342989c91f4af19eeb0b8956692c592b3`
- MESSINHO Node tests: Run `45759958645`, erfolgreich; **136/136 Tests bestanden**, 0 fehlgeschlagen.
- MESSINHO validation: Run `45759958520`, erfolgreich; **136/136 Tests bestanden** und Frontend-Build erfolgreich.
- ASI quality checks: Run `45759958579`, erfolgreich; **136/136 Tests bestanden** und Frontend-Build erfolgreich.
- MESSINHO backend syntax: Run `45759958571`, erfolgreich.
- Staging health smoke: Run `45759958586`, erfolgreich; HTTP 200, `ok=true`, Datenbank `ok`, Authentifizierung `ready`, MESSINHO-Core `provider_independent`, externe Recherche `ready`, optionale KI-Analyse `ready`. Dieser Smoke-Test lief vor dem neuen Render-Deploy gegen den zuvor laufenden STAGING-Code.

### Render STAGING Deploy
- Deployment: `dep-dc3rv8rl550s73fe3qk0`.
- Exakter Code-Commit: `82b126e342989c91f4af19eeb0b8956692c592b3`.
- Status: `live`; Render Event `deploy_ended / succeeded` um `2026-11-26T05:12:40Z`.
- Build erfolgreich; Prozess `npm start` / `node backend/server.js` gestartet; API meldete Listening auf Port 10000.
- Frische Runtime-Logs bestätigen: STAGING-Supabase-Server-Secret vorhanden (neuer Secret-Key-Typ), Supabase Data API HTTP 200, Tavily=true, OpenAI=true.
- Diese Statusmeldungen bestätigen Konfiguration und Prozessstart, nicht die vollständige Auth-/Chat-/Task-E2E-Funktion.

### Daten- und Sicherheitsauswirkung
- Keine Supabase-Migration, keine SQL-Schreiboperation und keine Änderung an Datenbanktabellen.
- Keine Nutzer-, Scout-, Spieler-, Memory-, Trace-, Task- oder Lerndaten verändert.
- Keine Modellgewichte geändert und kein automatisches Training ausgeführt.
- Produktion `main`, LIVE-Render und Produktions-Supabase unverändert.
- PFMS/PFSS nicht berührt.

### Noch offene Verifikation / nächster Schritt
1. Nach diesem Dokumentations-Checkpoint den GitHub Actions Staging health smoke erneut ausführen lassen, damit HTTP 200 / Datenbank `ok` ausdrücklich gegen den neuen Deploy `dep-dc3rv8rl550s73fe3qk0` bestätigt wird.
2. Danach mit freigegebenen, ausschließlich im STAGING angelegten Testkonten Login, Rollen, Scout-Owner-Isolation und Spielerzugriffe testen.
3. MESSINHO-Chat E2E prüfen: Begrüßung, Live-Uhrzeit Europe/Berlin, normale unbekannte Frage, Knowledge-Gap-Antwort, Capability-Auswahl und provider/quota Fehlerbehandlung.
4. Memory-/Trace-/Task-Ledger-Persistenz, SSE-Unterbrechung, Resume, Lease-Ablauf, Idempotenz und Cross-User-Denial prüfen.
5. Keine Produktionspromotion oder Merge-Freigabe aus diesem Checkpoint ableiten.



## 2026-11-26 — Sichere MESSINHO-Task-Wiederaufnahme und Persistenzbestätigung

### Befund und Korrektur
- Zusätzlicher Audit des Task-Ledgers zeigte, dass `GET /api/agent/tasks` abgelaufene `running`-Leases bisher auf `partial` setzte. Damit konnte die anschließende Resume-Route einen möglicherweise bereits teilweise wirksamen Lauf erneut ausführen, obwohl ihr eigener Sicherheitszweig abgelaufene Läufe korrekt quarantänisierte.
- Neue Datei: `backend/messinho-task-policy.js`.
  - Einheitliche Lease-Ablaufprüfung.
  - Einheitliche Quarantäne-Aktualisierung: `status=failed`, `lease_until=null`, erklärender `last_error`.
  - Bestätigung, dass eine Datenbankänderung tatsächlich genau die erwartete Task-ID zurückgegeben hat.
- `backend/server.js`:
  - Abgelaufene Tasks werden bereits beim Listen als `failed` quarantänisiert und bleiben im Aufgabenstatus sichtbar; sie werden nicht in `partial` zurückgestuft.
  - Resume verwendet dieselbe Lease-Policy und denselben Quarantänegrund.
  - Checkpoint- und Finalisierungsupdates verwenden jetzt `.select('id').maybeSingle()` und melden Erfolg nur, wenn genau die erwartete Task-Zeile tatsächlich aktualisiert wurde.
- Neue Tests: `tests/messinho-task-policy.test.js` — Ablaufzeit, aktive/fehlende Lease, Quarantäne-Patch und bestätigte Task-ID.
- Commits: Policy-Modul `124cf5efc04792d167dd963cf38e0a44bc012b96`; Serverintegration `e7ee6adc4dc7fd9cfa2c35e8b44656d85c907c34`; Tests `eb9173027477f27141db50149f9d776160a16fdc`.

### CI und Render STAGING
- Exakter Code-/Test-Commit: `eb9173027477f27141db50149f9d776160a16fdc`.
- MESSINHO Node tests: Run `45760237377` — **140/140 bestanden**, 0 fehlgeschlagen.
- MESSINHO validation: Run `45760237464` — Tests und Frontend-Build erfolgreich.
- ASI quality checks: Run `45760237296` — Tests und Frontend-Build erfolgreich.
- MESSINHO backend syntax: Run `45760237334` — erfolgreich.
- Staging health smoke: Run `45760237347` — erfolgreich; vor dem neuen Deploy ausgeführt.
- Render STAGING Deployment: `dep-dc3s0e56e07s73ddqh9g`, exakter Commit `eb9173027477f27141db50149f9d776160a16fdc`, Status `live`; Render meldete `deploy_ended / succeeded` um `2026-11-26T05:15:03Z`.
- Frische Runtime-Logs bestätigen API-Start auf Port 10000, STAGING-Supabase-Secret vorhanden, Supabase Data API HTTP 200, Tavily=true und OpenAI=true.

### Read-only STAGING-Dateninventur
- Projekt `myScoutingDatabase-staging`, Ref `nwqwnrhupbyhshsprxjt`.
- `profiles`: 1 Profil, Rolle Admin, approved=true.
- `players`, `asi_player_candidates`, `messinho_agent_memory`, `messinho_agent_traces`, `messinho_agent_tasks`: jeweils 0 Datensätze.
- Die fünf genannten Tabellen haben RLS aktiviert; die Task-Tabelle erlaubt den Status `failed`.
- Es wurden ausschließlich SELECT-/Inventurabfragen ausgeführt. Keine Zeile, kein Schema und keine Migration geändert.

### Auswirkungen und Grenzen
- Keine Datenbankmigration und keine Datenänderung.
- Keine Nutzer-, Scout-, Spieler-, Memory-, Trace-, Task- oder Lerndaten geschrieben.
- Keine Modellgewichte verändert; kein Training ausgeführt.
- Produktionsbranch `main`, LIVE-Render, Produktions-Supabase und PFMS/PFSS unverändert.
- PR #47 bleibt Draft und ungemergt; keine Produktionspromotion.

### Nächster Schritt
1. Authentifizierte STAGING-E2E mit einem ausdrücklich dafür vorgesehenen Test-Scout-Konto durchführen; aktuell ist im Staging nur ein genehmigtes Admin-Profil vorhanden.
2. Memory-/Trace-/Task-Schreibvorgänge, Task-Resume, abgelaufene Lease, parallelen Resume-Claim und Cross-Owner-Zugriff mit zwei getrennten Konten prüfen.
3. MESSINHO-Chat auf dem aktuell live geschalteten STAGING-Commit testen: normale Frage, Knowledge-Gap, Live-Uhrzeit, Recherche mit Quellen, Provider-Ausfall und Kontingentfehler.
4. Erst nach diesen E2E-/Sicherheitsnachweisen den Status der betroffenen Fähigkeiten erhöhen. Keine Live- oder Produktionsfreigabe aus diesem Checkpoint ableiten.



## 2026-11-26 — Evidence-first allgemeine Wissensrecherche (STAGING-Entwicklung)

**Owner request:** MESSINHO soll unbekannte Fragen erkennen, selbst recherchieren, Quellen gegeneinander prüfen, logisch antworten und sein Wissen kontrolliert erweitern.

**Implemented on the staging branch (not yet deployed):**
- Added `backend/messinho-general-research.js`.
- General question detection routes eligible unknown knowledge questions into a dedicated research path after existing live-time, small-talk, scouting, player-research and capability flows.
- Tavily search results are normalized to HTTPS sources, deduplicated, and filtered to exclude FUSSBALL.DE.
- A response requires at least two substantial sources from at least two distinct domains. Otherwise MESSINHO explicitly reports insufficient evidence.
- OpenAI is optional and only used to synthesize the supplied evidence. The generated claims are accepted only when they cite URLs in the retrieved source allowlist. If synthesis is unavailable or invalid, a deterministic source digest is returned.
- Search content is treated as untrusted data; no instructions in retrieved pages are executed.
- Added `tests/messinho-general-research.test.js` for question routing, source normalization, independent-domain checks, missing provider configuration, source-only fallback, and non-question bypass.
- Updated `backend/server.js` to route eligible general questions through the new research module.
- No Supabase writes, migrations, new user accounts, or persistent general-knowledge storage were performed. Existing `messinho_agent_memory` fields do not currently define a reviewed knowledge-base contract; automatic persistence is therefore deferred until schema and RLS ownership are explicitly verified.
- No model weights, capability code, or active learning model are modified by research results.

**Commits:**
- `836d92191469128de04dd59fbcf3de72aa1eeec8` — add general research module
- `a938a396e60b6345cf6ed79dbf543dee8b93ea2a` — integrate research route in server
- `c7bb52699f15ab860af497d17a88c3ccaad2193d` — add research tests

**Verification / release status:**
- Static source review completed.
- GitHub combined status returned no status checks for the latest test commit; no successful CI result has yet been confirmed for this change.
- This change has **not** been deployed to Render STAGING and is not live.
- Production branch, production Render service, and production Supabase remain untouched.
**Next steps:**
1. Run the new and full Node test suite plus backend syntax check in CI.
2. Fix any failures before deployment.
3. Verify the staging Render service is still pinned to `feature/messinho-unified-ai-integration`, then deploy only that service.
4. Run staging health and authenticated end-to-end tests with a permitted test account.
5. Design a separate owner-scoped knowledge store with explicit provenance, freshness, review state, retention limits, and RLS before any durable general-knowledge learning is enabled.


### STAGING deployment verification — 2026-11-26

- Render service: `myscoutingdatabase-messinho-staging` (`srv-dc3chlqjnfac73acd6ig`).
- Configured branch verified: `feature/messinho-unified-ai-integration`; auto-deploy remains disabled.
- Deployed commit: `023a176c4107a29f33b3cb1e5da15cfcc171f722`.
- Render deployment: `dep-dc3s45h7lnhs73elqnq0`, status **live**, completed `2026-11-26T05:23:03Z`.
- Build command completed successfully; Vite reported 1,636 modules transformed and build completed.
- Runtime log confirms `node backend/server.js` started and API is listening on port 10000.
- Runtime log confirms Tavily and OpenAI configuration are present (secret values were not exposed) and Supabase Data API returned HTTP 200.
- Local isolated test execution of the six new general-research tests: **6/6 passed**.
- Full repository Node suite was not rerun in this verification; GitHub combined status did not report checks for the tested commit. Authenticated end-to-end chat test was not possible because no dedicated staging Scout test account was confirmed.
- The deployment is **STAGING only**. Production remains unchanged.


### Evidence validation hardening — 2026-11-26

Before the next staging deployment, the general research path was hardened:
- Unicode-aware German/English normalization was corrected for source text and question matching.
- Synthesized claims must cite only retrieved URLs **and** overlap with at least three meaningful terms in the cited source excerpt (minimum 35% lexical overlap).
- The user-visible synthesized answer is assembled from accepted claims, not from the model's free-form answer field. If no claim passes, MESSINHO falls back to the deterministic source digest.
- Added a regression test for accepting a source-supported claim and rejecting an unrelated claim.
- Focused local check for the claim-support rule: 2/2 passed.
- These checks are a conservative lexical support filter, not a semantic proof of truth; human review and stronger evidence evaluation remain necessary.


### Final hardened STAGING deployment — 2026-11-26

- Final source branch head deployed: `426e545cc3a0f045680163430d7ccd8eb30c06cf`.
- Render deployment: `dep-dc3s4q61egvs73ejlv80`, status **live**, completed `2026-11-26T05:24:26Z`.
- Build succeeded; the Node server started successfully, reported API listening on port 10000, and Supabase Data API returned HTTP 200.
- Runtime confirms Tavily and OpenAI are configured on STAGING.
- This final deployment includes the hardened Unicode normalization and source-overlap claim filter.
- The latest source code is deployed on STAGING only. No production promotion, branch merge, database migration, or data write was performed.
- Full Node regression suite and authenticated E2E question/answer test remain outstanding.


## 2026-11-26 — Owner-scoped MESSINHO knowledge memory

**Requirement:** MESSINHO should remember source-backed general knowledge across conversations without mixing users' information or treating retrieval memory as neural model training.

**Database / STAGING:**
- Inspected the existing `messinho_agent_memory` schema and ASI evidence schema. The former is limited to player context/preferences; the ASI evidence schema requires a player ID. Neither is suitable for general knowledge memory.
- Added `public.messinho_knowledge_memory` in STAGING project ref `nwqwnrhupbyhshsprxjt`.
- Migration source: `supabase/migrations/20261126190000_messinho_knowledge_memory.sql`.
- Columns retain owner, normalized question fingerprint, answer, answer mode, supported claims, source URLs/publishers/excerpts, evidence summary, verification status, source/domain counts, verification and expiry timestamps, access count.
- RLS enabled. Authenticated policies restrict SELECT/INSERT/UPDATE/DELETE to `auth.uid() = owner_id`.
- Anonymous access revoked. Explicit authenticated and service_role grants restricted to SELECT/INSERT/UPDATE/DELETE only (no TRUNCATE/REFERENCES/TRIGGER).
- Schema, RLS policies, and grants were verified through read-only inspection after DDL. Table currently has **0 rows**; no user or knowledge records were seeded.
- Security Advisor did not report the new table as missing RLS policy. It reported an unrelated pre-existing policy gap on `messinho_diagnostic_runs` and leaked-password protection disabled; neither was changed here.

**Backend integration:**
- Added `backend/messinho-knowledge-memory.js`.
- Added exact normalized-question SHA-256 fingerprinting.
- Lookup is explicitly scoped by authenticated `owner_id`, exact fingerprint, `corroborated` state, and unexpired timestamp.
- Only stores completed research with at least two substantial HTTPS source excerpts from two distinct domains. Personal/private markers and email/phone-like identifiers are excluded from persistence.
- Records expire after 14 days; retrieval increments hit count without extending evidence verification/expiry.
- Upsert confirms returned row ID; database errors fail soft so chat can still answer without persistent memory.
- Integrated into `POST /api/agent/chat`: owner-scoped memory lookup first, fresh research on miss, then source-backed persistence.
- Reused answers include their source metadata and are labelled as corroborated (not human-reviewed). No code, capabilities, or model weights self-modify.

**Tests:**
- Added `tests/messinho-knowledge-memory.test.js` (7 cases).
- Isolated Node.js execution of the knowledge-memory module/test harness: **7/7 passed**.
- Full repository Node suite and complete authenticated end-to-end chat test have not yet been confirmed.
- GitHub Actions combined status did not return checks for the latest feature commit.

**Commits (staging branch):**
- `1982630934535d7c9cada3c53adb1195c627316d` — migration source
- `adb5d15fcf62e531abc46c7f16474d2ec5bb1fb7` — tighten grants
- `ddc244806fbe27a433bf521c85b73d8f9882006e` — memory module
- `b3214001433e2dbaee3dc29278a2f2fceddb8ea2` — chat integration
- `ff9c331caa18c8d032e2301018e1092fdcc7e2d6` — tests
- `f5dc8c03f807079f2b4805dedc3d96feb60a84ac` — storage failure semantics

**Deployment:** Pending. Do not describe this milestone as live until the staging deployment commit and runtime are verified. Production is untouched.


### Deployment verification — owner-scoped knowledge memory (2026-11-26)

- Render STAGING service confirmed on branch `feature/messinho-unified-ai-integration`.
- Runtime commit `e8f1c8e12889fe4454c262297b8f59146cf00cda`; deployment `dep-dc3s6puc6qcc73bosk8g`; Render status `live`, deploy-ended event `2026-11-26T05:28:41Z`.
- Build succeeded. Runtime started `node backend/server.js`, API listened on port 10000, Supabase Data API returned HTTP 200, and Tavily/OpenAI configuration was detected.
- The new knowledge-memory table exists on STAGING, RLS is enabled, four owner policies are present, anonymous grants are absent, and only CRUD privileges are granted to authenticated/service_role. Row count remains zero.
- Seven isolated knowledge-memory tests passed locally; the full repository suite and authenticated live chat test are not yet verified.
- The staging deployment includes the memory lookup/write integration. It is not yet proven through a real authenticated user conversation because no staging test account has been authorized/created.
- Production remains untouched; PR #47 remains Draft and unmerged.


## 2026-11-26 — MESSINHO mathematics, scouting probability and physics

**Owner requirement:** MESSINHO must independently calculate basic and advanced mathematics, probability/statistics for scouting, and physics formulas. Calculations must be reproducible and must not depend on an LLM doing arithmetic.

**Implementation on the STAGING feature branch:**
- Added `backend/messinho-math.js`, a deterministic calculation module with a restricted arithmetic parser. It does not use `eval`, `Function`, or execute user-supplied code.
- Integrated the calculation module into `POST /api/agent/chat` immediately after live-question/small-talk handling and before general LLM fallback. The user does not select a tool; MESSINHO recognizes supported calculation questions and invokes the engine automatically.
- Basic arithmetic supports addition, subtraction, multiplication, division, parentheses, powers and modulo, with division-by-zero and invalid-input handling.
- Added percentage calculations, fractions, and proportional rule-of-three calculations.
- Probability/statistics currently include exact/at-least/at-most binomial probabilities, Poisson probabilities, Bayes updates, 95% Wilson confidence intervals, hypergeometric probabilities (sampling without replacement), cumulative normal-distribution probabilities, z-scores, and combinations/binomial coefficients.
- Physics currently includes Newton's second law, average speed, acceleration, kinetic and potential energy, mechanical work, power, density, pressure, momentum, Hooke's law, Ohm's law, electrical power, wave speed, circle circumference and circle area.
- Results return a formula, calculation steps, units, and relevant assumptions. Probability results explicitly distinguish an observed statistical rate from a guaranteed individual player outcome.
- Added `tests/messinho-math.test.js` for arithmetic, percentages, fractions, rule of three, binomial/Poisson/Bayes/Wilson calculations, and physics formula cases.
- The math engine returns a clarification result when a calculation is recognized but required parameters are missing; unsupported non-math messages continue through the existing chat path.

**Knowledge memory improvement:**
- Exact normalized-question matching remains the first lookup.
- Added owner-scoped high-confidence lexical paraphrase retrieval over at most 40 recent, unexpired, corroborated records.
- Candidate matching requires at least three meaningful shared terms, high overlap/containment, and no detected polarity/negation conflict. Near-ties are rejected rather than guessed.
- Retrieval still filters by the authenticated owner, corroborated status, and expiry. Similarity matching does not extend the verification timestamp or expiry.
- Chat response metadata distinguishes exact reuse from high-confidence lexical reuse.
- Added regression tests for positive paraphrase matching and superficially similar but different/contrasting questions.

**Source head deployed to STAGING:** `2c828e68624d36ce5e663becc75bb48ee6ff1c3f`.

**Verification and release status:**
- Test cases have been added, but the complete repository Node test suite has **not yet been executed** on this branch.
- Updated `.github/workflows/messinho-tests.yml` to run the full Node test suite and backend syntax checks on pushes to the active feature branch and pull requests to `main`. The GitHub workflow/status connector returned no workflow runs or combined checks at the time of this checkpoint; execution remains unverified.
- Render STAGING has **not yet been redeployed** with the mathematics and paraphrase changes. Do not call these features live until the exact deployed commit is verified.
- No new Supabase schema or data migration was required for these code changes.
- Production branch, production Render service, production Supabase and PR merge state remain untouched. PR #47 remains Draft/unmerged.

**Known limitations / next steps:**
1. Validate all new math tests and run the full existing Node suite plus backend syntax checks.
2. Expand physics/statistics coverage after test validation (e.g. normal distribution, hypergeometric probability, confidence calibration, additional mechanics/electrical formulas).
3. Add scouting-specific interpretation using real verified player/event denominators; never infer an individual player's success probability from a small or biased sample.
4. Consider semantic/embedding retrieval only after the conservative lexical approach is validated; do not serve uncertain memory matches.
5. Deploy only the verified feature branch to the dedicated STAGING Render service and perform authenticated chat checks. Keep production unchanged.


**Checkpoint update:** CI workflow definition is now committed on the feature branch. Latest code is still pending validation and staging deployment; no production change was made.


### MESSINHO mathematics and knowledge retrieval — STAGING deployment verification (2026-11-26)

- STAGING service: `myscoutingdatabase-messinho-staging` (`srv-dc3chlqjnfac73acd6ig`), branch `feature/messinho-unified-ai-integration`, auto-deploy disabled.
- Deployed commit: `2c828e68624d36ce5e663becc75bb48ee6ff1c3f`.
- Render deployment: `dep-dc3sbdk9v7es73d4nd5g`, status **live**, finished `2026-11-26T05:38:34.254Z`. The earlier `76d1832` deployment is superseded by this expanded probability build.
- Build command now gates deployment on `npm test`, backend JavaScript syntax checks, and `vite build`.
- Full Node suite after initial math integration: **166 passed, 0 failed**. After adding normal/hypergeometric/combinatorics dispatch, final full Node suite: **169 passed, 0 failed**. New math tests cover arithmetic/parentheses, percentages, fractions, rule of three, binomial, Poisson, Bayes, Wilson intervals, normal distribution, hypergeometric probability, combinations, and physics formula families.
- Backend syntax check completed successfully; Vite build succeeded with 1,636 modules transformed.
- Runtime logs confirm `node backend/server.js` started, API listening on port 10000, Supabase Data API HTTP 200, and configured Tavily/OpenAI presence (no secret values logged).
- The deterministic math module and conservative paraphrase retrieval are therefore **deployed to STAGING**. They have not yet been verified through an authenticated human chat session; no Scout/Admin test credentials were used or created.
- Production Render service, production Supabase, and `main` were not modified. PR #47 remains Draft, open, and unmerged.

- One intermediate deployment attempt exposed three missing dispatch cases for the added normal/hypergeometric/combinatorics tests; these were corrected before the final deployment. Final build/test gate passed all 169 tests.

## 2026-11-26 — Comprehensive STAGING test pass and security hardening

**Owner instruction:** Continue the existing myScoutingDatabase/MESSINHO project from its current state. Work only on dedicated STAGING. Record all work and test results in this master file so a new chat can resume without losing context.

### Exact scope
- Repository: `Dridi06/myScoutingDatabase`.
- Active development branch: `feature/messinho-unified-ai-integration`.
- STAGING Render service: `myscoutingdatabase-messinho-staging` (`srv-dc3chlqjnfac73acd6ig`), URL https://myscoutingdatabase-messinho-staging.onrender.com.
- STAGING Supabase project ref: `nwqwnrhupbyhshsprxjt`.
- PR #47 remains Draft/open/unmerged.
- Production Render service: `myscoutingdatabase` (`srv-dc25n13rjlhs73e2ae1g`), URL https://myscoutingdatabase.onrender.com.
- PFMS/PFSS are unrelated and must not be modified.

### Verified automated test and deployment results
- Latest feature-branch CI commit tested: `1c5bfbfb351a65e8285e73d2b561578c55077c0c`.
- MESSINHO Node tests workflow run `45765883276`: **success**; all workflow steps completed, including install, full Node tests and backend syntax.
- MESSINHO validation workflow run `45765883304`: **success**; unit tests and frontend build completed.
- ASI quality checks workflow run `45765883266`: **success**; ASI unit tests and frontend build completed.
- Backend syntax workflow run `45765883315`: **success**.
- STAGING health smoke test workflow run `45765883273`: **success**.
- Previously verified full Node suite: **169 passed, 0 failed**.
- Previously verified Vite build: successful, 1,636 modules transformed.
- STAGING Render runtime logs confirm Node API listening on port 10000, Supabase Data API HTTP 200, Tavily configured and OpenAI configured (no secret values disclosed).
- Persisted MESSINHO diagnostics: **healthy, 9 passed, 0 failed, 0 warnings**, completed 2026-11-26 06:05:11 UTC.
- Persisted system diagnostics: **healthy, 46 passed, 0 failed, 0 warnings**, latest stored run 2026-11-26 03:49:36 UTC.
- Scout3 profile verified in STAGING database: `role=scout`, `approved=true`, `approval_status=approved`.
- The knowledge-memory table exists with owner-scoped RLS; row count is currently 0. No knowledge records were seeded.
- A real authenticated Scout3 chat E2E test has **not** been completed by the assistant. Do not claim it has. It requires the user's existing logged-in browser session; never request or store a password, bearer token or JWT.

### STAGING database changes made during this pass
All the following were applied only to STAGING Supabase project `nwqwnrhupbyhshsprxjt`, and source migrations were committed to the active feature branch:

1. `supabase/migrations/20261126210000_staging_security_performance_hardening.sql`
   - Revoke all table privileges on `messinho_diagnostic_runs` from PUBLIC, anon and authenticated.
   - Retain backend CRUD for service_role only.
   - Add missing FK indexes for `asi_model_versions.approved_by`, `messinho_diagnostic_runs.actor_profile_id`, and `system_diagnostic_runs.actor_profile_id`.
   - Optimize two admin-only RLS policies on `system_diagnostic_runs` to use `(select auth.uid())`.
2. `supabase/migrations/20261126211000_fix_admin_login_diagnostic_source.sql`
   - Fix `system_diagnostic_runs_triggered_by_check` to allow the actual source `admin_login` alongside `automatic`, `admin`, and `deployment`.
   - This was prompted by Render logs showing admin-login diagnostic persistence failing due to the constraint.
3. `supabase/migrations/20261126212000_harden_system_diagnostic_table_grants.sql`
   - Revoke broad default table grants from PUBLIC, anon and authenticated on `system_diagnostic_runs`.
   - Grant authenticated only SELECT/INSERT (still subject to admin-only RLS policies).
   - Retain backend CRUD for service_role.
   - Explicitly remove TRUNCATE/DELETE from browser roles; TRUNCATE bypasses RLS.

### Scout approval fix carried forward
- Earlier STAGING migration `20261126200000_fix_admin_scout_approval_rls.sql` changed `admin_set_scout_approval` to a narrowly scoped SECURITY DEFINER function.
- Function validates `auth.uid()` and `private.is_admin()`, uses empty search_path, changes only scout approval fields, and is not executable by anon/PUBLIC.
- Scout3 now verified approved in STAGING as described above.

### Security advisor findings and remaining action
- Supabase Auth leaked-password protection is still disabled. This is an Auth dashboard/configuration setting and was **not** changed by SQL. Enable it in STAGING Auth password/security settings before release.
- The SECURITY DEFINER warning for `admin_set_scout_approval` is intentional and narrowly constrained by the admin check.
- `messinho_diagnostic_runs` has RLS enabled with no browser policies intentionally; browser roles have no table privileges, only backend service_role may access it.
- Supabase flagged 31 unused indexes. Do not drop these without workload evidence; most are on new/empty tables. Three missing FK indexes were added.
- The full authenticated Scout3 login/chat test, calculation routing, unknown-question research and persistent memory reuse remain unverified until exercised from the user's real authenticated session.

### Production branch/deploy recovery incident — transparently recorded
- During this test pass, one migration source file was accidentally created on `main` instead of the feature branch. This was an operator error.
- The `main` ref was immediately force-reset with an expected-SHA guard to its exact prior commit `fa0d4dfbdd779f280bb3caf44c6cc70be8dcb5b6`.
- Render production auto-deploy had already begun for the temporary commit. It briefly deployed that commit, which contained only a migration source file; no application source, production database schema or production data was changed.
- After `main` was restored, Render redeployed the prior commit. Recovery deployment `dep-dc3soico3iic73cbldog` was verified **live**, completed 2026-11-26 06:06:56 UTC.
- Production runtime logs confirm the API started and the production Supabase Data API returned HTTP 200.
- Current GitHub `main` HEAD was verified back at `fa0d4dfbdd779f280bb3caf44c6cc70be8dcb5b6`.
- Production Supabase was never modified.
- Do not merge PR #47 or promote STAGING. Continue on feature branch and dedicated STAGING only.

### Current STAGING application release state
- STAGING app deployment remains `2c828e68624d36ce5e663becc75bb48ee6ff1c3f`, deployment `dep-dc3sbdk9v7es73d4nd5g`, verified live.
- Latest changes in this test pass were database migrations and documentation; no STAGING application-code deployment was needed.
- Render STAGING auto-deploy remains disabled.
- PR #47 remains Draft and unmerged.

### Next actions
1. Continue reading this `PROJECTSCOUT.md` before any further project work.
2. Enable leaked-password protection in STAGING Supabase Auth configuration.
3. Have the owner sign in as Scout3 on STAGING and perform authenticated E2E checks:
   - ordinary question and current time;
   - arithmetic and percentage;
   - binomial/Poisson/Bayes/scouting probability;
   - physics formula;
   - unknown knowledge question with at least two independent sources;
   - exact and paraphrase knowledge-memory reuse after a source-backed answer is persisted;
   - missing parameters, provider failure, invalid input and safe fallback;
   - verify Scout role permissions and cross-owner data isolation.
4. Inspect each chat result and backend logs; record screenshots/results without exposing secrets.
5. Re-run diagnostics after Auth setting is enabled.
6. Keep production and PFMS/PFSS untouched. Do not merge PR #47 or claim production readiness until authenticated E2E and security follow-up are complete.

**Persistent test checkpoint file:** `docs/STAGING_TEST_CHECKPOINT_20261126.md` (feature branch). This detailed master record is authoritative for continuation; the checkpoint file contains the test matrix and incident timeline.


## 2026-11-26 — Responsive UX and interaction-stability pass (STAGING)

**Owner request:** Make the complete STAGING site work cleanly on phones and desktop; prevent screens/dashboard tiles from jumping or shifting after clicks; group and size all tiles sensibly on mobile; remove unnecessary non-AI and duplicate page functions.

**Scope and safety:**
- Repository: `Dridi06/myScoutingDatabase`.
- Branch: `feature/messinho-unified-ai-integration`.
- Target: dedicated Render STAGING service `myscoutingdatabase-messinho-staging` (`srv-dc3chlqjnfac73acd6ig`).
- STAGING Supabase ref: `nwqwnrhupbyhshsprxjt`.
- Production `main`, production Render, production Supabase, PFMS and PFSS remain out of scope and unchanged.
- STAGING auto-deploy is disabled; any release must be manually triggered and verified.

**Source audit:**
- Reviewed the current React app navigation, dashboard, global stylesheet, ASI workspace, MESSINHO workspace and existing help guide.
- Confirmed the top-level pages represent distinct workflows: player create/edit/search/database, player analysis/ASI, MESSINHO talent search/chat, scout administration, system diagnostics, deletion audit, and support/ticket messaging.
- No redundant top-level workflow was proven safe to delete. These functions have distinct user and security purposes, so they were retained rather than risking loss of scouting/admin capability.
- The help guide is explanatory content, not a second AI agent; it was retained.
- Identified interaction movement from global button hover transforms and specific dashboard tile hover transforms, plus smooth document scrolling and several conflicting late-stage responsive overrides.

**Implemented — `src/styles.css`:**
- Disabled smooth scrolling for the workspace so navigation/focus changes do not animate the page unexpectedly.
- Reserved scrollbar gutter to reduce horizontal layout shifts when page content height changes.
- Kept the workspace header sticky with a stable background while scrolling.
- Removed translate transforms from button hover/focus/active states and dashboard action/metric/position tiles; retained non-positional feedback such as color, border and shadow changes.
- Stabilized dashboard minimum height and constrained grid children to prevent content overflow.
- Reworked mobile dashboard metrics to use responsive auto-fit columns and a single column when the screen is too narrow.
- Grouped foot-preference tiles and position groups vertically on mobile; improved chip wrapping and touch target height.
- Improved safe-area handling, narrow-screen typography, form widths, player facts/rating layouts, table horizontal scrolling, and MESSINHO composer/message wrapping.
- Added responsive breakpoints for <=1100, <=760, <=520 and <=380 CSS pixels.
- Kept existing product visual identity; no database or persistent user data was changed.

**Regression coverage:**
- Added `tests/responsive-layout.test.js` to guard against reintroducing smooth scrolling, button/tile translation, poor mobile dashboard grid behavior, safe-area regressions, and a non-sticky workspace header.
- The Render STAGING service was confirmed on the correct feature branch with auto-deploy disabled.
- GitHub Actions did not return push-triggered workflow runs for the commits; full `npm test` and `vite build` must be verified through the manual STAGING build before calling this change deployed.

**UI cleanup decision:**
- No unique non-AI workflow was removed in this pass because current source review did not establish any as redundant or obsolete. The request to remove duplicates is accepted; further deletion requires identifying actual duplicated controls/flows with evidence, not deleting essential player, scout, support or audit functionality by guesswork.
- No authenticated cross-device browser session or screenshot automation was available during this pass. Responsive CSS regression checks and the STAGING build are the next verification gates.

**Commits:**
- `3fe77909e3f76fb36965673a3d36e5ff1d319bd4` — responsive CSS and interaction stability.
- `a7c55a30845939bb90bb649f50f5121f3c487c7d` — responsive regression tests.

**Deployment status at checkpoint:** Code committed to the STAGING feature branch. Render STAGING manual deployment and build verification are pending. Do not call it live until the exact deployment commit is confirmed live and health is checked.


### Responsive UX pass — STAGING build and deployment verification (2026-11-26)

- Render STAGING service: `myscoutingdatabase-messinho-staging` (`srv-dc3chlqjnfac73acd6ig`).
- Manual deployment: `dep-dc3stkp7lnhs73eo1hu0`.
- Deployed commit: `69cf085aae71b4de5b7c0c0afc16e4ac19910d3e`.
- Render deployment status: **live**, finished `2026-11-26T06:17:26.097Z`.
- Render build executed `npm run build`: **174 tests passed, 0 failed** (169 existing + 5 responsive layout regression tests); backend syntax checks passed; Vite transformed 1,636 modules and completed the build successfully.
- Runtime started `node backend/server.js`, API listened on port 10000, and STAGING Supabase Data API returned HTTP 200. Render confirmed the service live at the dedicated STAGING URL.
- No database migrations or persistent user/player/scout data changes were made.
- No authenticated browser screenshot/visual QA was available; CSS regression tests and deployment health are verified, but exact rendering/scroll behavior on physical iPhone/Android/desktop browsers still requires interactive visual confirmation.
- Production `main`, production Render, production Supabase, PFMS and PFSS remain unchanged. STAGING auto-deploy remains disabled; PR #47 remains Draft/unmerged.


## 2026-11-26 — MESSINHO chat viewport/zoom correction (STAGING)

**User report:** After typing/sending a message in the MESSINHO chat, the page visually distorts and changes size.

**Root-cause findings:**
- MESSINHO's message list had several competing min-height/max-height declarations across the component stylesheet and global responsive stylesheet.
- The chat card did not have a definite block size, so its flex child could participate in page-height changes as messages accumulated.
- The chat input was explicitly set to 13px in the component stylesheet. On iOS Safari, focusing an input below 16px triggers automatic page zoom, which matches the reported visual resizing when tapping/typing in the chat.
- The previous auto-scroll only changes the message list's own scrollTop; it does not call document scrollIntoView. The primary fixes therefore target input auto-zoom and layout sizing rather than removing conversation auto-scroll.

**Implemented:**
- src/asi/messinho.css: fixed desktop chat card height to a bounded responsive range (480–680px), and mobile height to a stable 560px (540px at <=380px).
- Message list now uses the remaining fixed flex area (height:0; flex:1 1 0; min-height:0) and scrolls internally, rather than expanding the outer page.
- Composer is a non-shrinking fixed row; message bubbles are constrained to the available width and can wrap long content.
- Disabled scroll anchoring and smooth scrolling inside the chat to prevent browser-driven jumps.
- Set the MESSINHO composer input to 16px (including mobile, with !important) to prevent iOS Safari's focus-triggered automatic zoom.
- Added two regression tests to tests/responsive-layout.test.js for the fixed chat viewport/internal scroll and iOS 16px input size.

**Commits:**
- 17fd7791ee092f619956b524a95e40939515f1b1 — chat layout/scroll/input sizing.
- ed494c5a8b2c4f3ad71a17f2c49d96399d115441 — regression tests.

**Verification status:** Changes are committed on feature/messinho-unified-ai-integration. The STAGING build/deployment must be run and verified before calling this correction live. Production and PFMS/PFSS remain untouched.


### MESSINHO chat correction — STAGING build and deployment verified
- Render deployment: dep-dc42g2t6e07s73dvpkeg.
- Deployed commit: 11347b7a3b4398555526a0a785b1abf65db3c0a4.
- Status: **live**, finished 2026-11-26T12:38:07.513Z.
- Build tests: **176 passed, 0 failed** (including the two new chat viewport/iOS input tests); Vite build completed successfully in 2.68s.
- Runtime: Node API listening on port 10000; STAGING Supabase Data API returned HTTP 200.
- STAGING service remains on feature/messinho-unified-ai-integration with auto-deploy disabled. Production and PFMS/PFSS remain untouched.
- Remaining verification: owner must confirm on the physical iPhone that focusing/typing/sending in MESSINHO no longer triggers visual zoom or outer page resizing. Automated tests prove CSS contracts and deployment health, not device-specific Safari rendering.


## 2026-11-26 — MESSINHO screenshot-driven answer correctness and formatting fix (STAGING)

**User-provided iPhone screenshot findings:**
- MESSINHO displayed the literal characters `\\n` in a calculation response instead of readable line breaks.
- A bare scouting year range `2004-2006` was incorrectly intercepted by the deterministic arithmetic parser and returned as subtraction (`-2`).
- The chat frame itself appears bounded in this screenshot; this report exposed response-format and intent-routing defects in addition to the earlier iOS viewport concern.

**Implemented on `feature/messinho-unified-ai-integration`:**
- `backend/messinho-math.js`: a bare four-digit year range (hyphen, en dash or em dash) is no longer treated as arithmetic. Explicitly requested arithmetic such as `Berechne 2004-2006` remains valid.
- `backend/server.js`: calculation replies now contain actual newline characters rather than literal backslash-n sequences.
- `src/asi/messinho.css`: chat message paragraphs use `white-space:pre-line` so multiline responses remain readable.
- `tests/messinho-math.test.js`: regression tests for bare year ranges and explicit subtraction.
- `tests/responsive-layout.test.js`: regression test for multiline chat formatting.

**Commits (feature branch only):**
- `d1a4f7569e4189bccaa7bea3d14b8588b8df02fb` — year-range guard initial implementation.
- `5430641b4aa283daa38710b21517e43e538e5bab` — actual newline formatting in calculation replies.
- `09bb10901c638c178ca664884dc273c5f5668516` — preserve multiline text in chat bubbles.
- `81fb04b87a6dec84df5c24783bdbe84a2ea091e5` — correct regex source for year-range guard.
- `7a66e1732d45e7a65025e04e679b47556a80113e` — math regression tests.
- `34ad2add7ea49ee8311f6c21c62c608693c63c65` — chat formatting regression test.

**Deployment status at checkpoint:** Code is committed to the STAGING feature branch. Render build and deployment are pending. Do not call the fix live until the exact deployed commit is verified live and the health check succeeds. Production, PFMS/PFSS and production Supabase remain untouched. STAGING auto-deploy remains disabled.


## 2026-11-26 — MESSINHO conversation continuity and birth-year context (STAGING)

**Owner request:** MESSINHO must remember the preceding conversation so a short follow-up such as `2004-2006` is interpreted in the context of a discussion about player birth years/year groups, rather than as arithmetic subtraction or as an isolated phrase.

**Implemented on the STAGING feature branch:**
- Increased the recent conversation window passed by the chat UI from 10 to 20 messages.
- Increased backend history sanitization to retain the latest 20 safe user/assistant messages.
- Increased the scouting dialog parser and general OpenAI conversational context to use up to 20 recent messages.
- The scouting parser now recognizes a terse year or year-range follow-up when the recent conversation discussed `Jahrgang`, `Geburtsjahr`, `Geburtsjahrgang`, `Geburtsdatum` or `Altersklasse`.
- In that case, it carries the prior user context into the parser without automatically launching a scouting search merely because the user clarified a year.
- A subsequent explicit scouting request can reuse the recently discussed birth-year criteria.
- Added `tests/messinho-context.test.js` covering contextual year ranges, carry-forward into a new scouting request, and the 20-message history limit.
- Existing deterministic math guard still distinguishes a bare year range from explicitly requested arithmetic.

**Commits:**
- `a830a04d32d980c69f9b7a8a011d35c4efabb9ce` — retain 20 safe chat messages.
- `d0bbd6531bcba88c4dd6bdb70f0a01246b327006` — contextual year follow-ups in scouting parser.
- `31a4fa59a385c35f5234b2252eb53556ffcab054` — 20-message context for general AI fallback.
- `7d062dd7bdc2d949c70f0e65445c724d265330d6` — send 20 recent messages from chat UI.
- `827e740daf6fddadbd3412356f03a683eb6bb1bd` — contextual continuity regression tests.

**Deployment status:** Source changes are committed to `feature/messinho-unified-ai-integration`. STAGING build/deploy and test verification are pending. Do not call this live until Render reports the exact current commit live. Production, PFMS/PFSS and production Supabase remain untouched. STAGING auto-deploy remains disabled.


**Build feedback and test correction (2026-11-26):**
- First manual STAGING build for the context-continuity pass exposed two test expectation issues (not a production code/runtime failure): the test's previous assistant line accidentally matched the existing explicit pending-question flow, and the existing sanitizer test still expected the former 10-message limit.
- Corrected the scenario so it tests a non-pending conversational year clarification, and updated the sanitizer test to expect all 13 valid messages from its 13-message fixture under the new 20-message cap.
- The first build therefore failed (179 passed, 2 failed). A corrected build is required; do not treat the context-continuity change as live until that build succeeds.
- Follow-up test commits: `af1088f51634de7f389866f0f8ba810b83a31efa`, `f3c40ec646d7c02458347cbdcf70174e3ac24195`.


**Second build feedback (2026-11-26):**
- The sanitizer expectation now passes. One context test still used an assistant sentence containing the explicit pending clarification keyword `Geburtsjahrgang`, correctly activating the pre-existing clarification flow.
- Adjusted the fixture's assistant response to a neutral acknowledgement so the test isolates a terse follow-up without an outstanding clarification. No production behavior was weakened.
- Test fixture correction: `92e347c46d7247c628fd176c8bd4fb1963d2fdf4`. The second build also failed; next build is required before release.


### MESSINHO conversation continuity — STAGING deployment verified (2026-11-26)
- Render deployment: `dep-dc436rui0phs739171d0`.
- Deployed commit: `5c47a6090bbeebff8a4c65a87403a37babf427a7`.
- Status: **live**, finished `2026-11-26T13:26:47.149873Z`.
- Build: **181 tests passed, 0 failed**; backend syntax checks passed; Vite transformed 1,636 modules and built successfully.
- Runtime: `node backend/server.js` started, API listening on port 10000; Supabase credentials detected and research providers configured.
- The context test suite confirms a terse `2004-2006` follow-up after a birth-year discussion is treated as context, not subtraction; an explicit later scouting request reuses the year range; latest 20 messages are retained.
- The screenshot-driven answer formatting and bare-year-range arithmetic correction are included in the deployed commit.
- This is a code-level and automated regression verification. A real authenticated Scout3 chat session still needs to confirm natural-language behavior from the user's browser.
- Production Render, production `main`, production Supabase, PFMS and PFSS remain untouched. STAGING auto-deploy remains disabled; PR #47 remains Draft/unmerged.

## 2026-11-26 — MESSINHO Mathematics & Physics Intelligence, first interpretation layer (STAGING)

**Owner instruction:** Continue the existing deterministic mathematics/physics engine and progress from formula-only inputs toward understanding natural-language word problems.

**Implemented on `feature/messinho-unified-ai-integration`:**
- Added a deterministic German-language physics quantity extractor for distance and time in natural sentences.
- Supports distance conversion into SI metres for km, m, cm and mm; time conversion into SI seconds for hours, minutes and seconds.
- A natural-language average-speed problem now extracts known values, identifies the unknown (speed), applies (v=s/t), shows substitution steps, and returns both m/s and km/h.
- Example covered by regression test: “Ein Fußballer läuft 100 Meter in 12 Sekunden. Wie schnell ist er?” -> 8.33333333 m/s = 30 km/h.
- Added finite-result validation in the shared result constructor so Infinity/NaN cannot be reported as a completed calculation.
- Added explicit zero-current validation for Ohm's law to avoid division by zero.
- Added regression tests for natural-language speed, unit conversion, Ohm's law zero current, and non-finite results.

**Limitations retained deliberately:**
- This is a first rule-based interpretation layer, not unrestricted natural-language understanding.
- Unit parsing currently covers distance/time for average speed only; no general dimensional-analysis framework or arbitrary unit conversion yet.
- Other formula families still require the existing explicit parameter notation unless separately interpreted.
- No neural model weights are trained or changed; this is deterministic software capability growth.

**Verification:** Source/test changes committed to STAGING feature branch. Run the complete test/build pipeline and manually deploy the exact commit to Render STAGING before calling it live. Do not enable auto-deploy. Production, production Supabase, PFMS and PFSS remain untouched.

### Mathematics & Physics Intelligence — STAGING deployment verified (2026-11-26)

- Render STAGING deployment: `dep-dc43hes9v7es73dot5t0`.
- Deployed commit: `855a0b49a061699d159b9ee6a76b3fa8390ff50d`.
- Render status: **live**, completed `2026-11-26T13:49:17.656Z`.
- Build/test verification: **185 tests passed, 0 failed**; Vite transformed 1,636 modules and completed the production build.
- Runtime: `node backend/server.js` started, API listening on port 10000; STAGING Supabase Data API returned HTTP 200; Tavily and OpenAI provider configuration detected.
- Added regression coverage for German natural-language speed problems, SI conversion from kilometres/minutes, zero-current Ohm validation, and non-finite arithmetic results.
- The first two deployment attempts failed due to syntax/patch-fragment errors in the new parser. These were corrected; the final deployment above is the verified successful build. The failed deployments did not replace the previously live service.
- STAGING auto-deploy remains disabled. Production `main`, production Render, production Supabase, PFMS and PFSS remain untouched.
- Remaining scope: broaden the natural-language interpreter to more physics formula families, add general dimensional analysis/unit compatibility, validate physical domains across all formulas, and expand mathematics (algebra, geometry, calculus). The present speed interpreter is a focused deterministic first step, not unrestricted natural-language understanding.


### 2026-11-26 — Autonomous mathematical and physical performance intelligence

**Owner decision:** Mathematics and physics are not standalone user-selectable functions. They must be integrated into MESSINHO's autonomous agent behavior and invoked automatically when relevant.

**Implementation on staging feature branch:**
- Added `backend/messinho-performance-intelligence.js`.
- Integrated it directly into `backend/messinho-agent-core.js`; every accepted agent cycle now performs the assessment automatically, without a separate user toggle or capability selection.
- The resulting intelligence is passed into the capability execution context as `_messinho_autonomous_performance_intelligence` and attached to the agent run for response formatting/audit.
- `backend/messinho-orchestrator.js` formats explicit measured and derived findings in the normal MESSINHO response.
- Added `tests/messinho-performance-intelligence.test.js`.

**Current measured/derived scope:**
- 10 m and 30 m sprint average speed from explicitly supplied sprint times.
- Explicit top speed, vertical jump, ball speed.
- Explicit pass completion, duel success and dribbling success rates.
- Ball kinetic energy only when both explicit ball mass and ball speed are supplied.
- Each result is classified as measured or derived, includes units/formula/basis, and states interpretation limits.

**Scientific and governance safeguards:**
- No invented or imputed measurements.
- No conversion of average sprint speed into top speed.
- No inference of stamina or injury risk from speed/jump data.
- No global player rating without age-, position-, league- and sample-appropriate comparison cohorts and approved weighting.
- No source data writes and no automatic model-weight changes.
- Unsupported units/values are not promoted to findings.

**Verification status:** Code and regression tests committed to the staging feature branch. Runtime test suite, build, Render staging deployment and live verification are still pending; do not describe this feature as live until the exact deployment commit is confirmed. Production `main`, production Render/Supabase, PFMS and PFSS remain untouched.


## 2026-11-26 — Autonomous Agent Core 2.0 foundation (STAGING; verification pending)

**Owner request:** Implement the autonomous-agent improvements discussed in the conversation, including goal planning, automatic tool selection, execution observation, error recovery, persistent task continuity, self-improvement safeguards, and football intelligence. Work remains restricted to `feature/messinho-unified-ai-integration` and the dedicated STAGING service.

**Changes committed:**
- Added `backend/messinho-autonomy.js` with a provider-independent goal contract, autonomous plan construction through the existing capability catalogue/dependency resolver, protected-side-effect approval detection, execution observation, bounded JSON task checkpoint creation, and strict owner/organization resume-scope validation.
- Integrated autonomous goal interpretation and observation into `backend/messinho-agent-core.js`; the core can now derive a plan when no caller-supplied plan exists, emits trace events for planning/observation, exposes the goal contract and observation, and chooses a next action from observed missing inputs/errors/deferred steps.
- Routed the normal chat orchestration path through the autonomy supervisor in `backend/server.js`; the API response now exposes the goal contract and observation alongside the existing task checkpoint.
- Added `tests/messinho-autonomy.test.js` for autonomous plan creation, goal contracts, protected-action approval, observation states, checkpoint owner/organization isolation, completed-task resume prevention, and empty-goal rejection.

**Existing foundations reused rather than duplicated:**
- The repository already contains an owner-scoped `messinho_agent_tasks` ledger, per-step checkpoint writes, lease handling, stale-task quarantine, a user task-list endpoint, and an explicit resume endpoint.
- Existing verified knowledge memory, research evidence checks, learning safeguards, role restrictions, and the autonomous performance-intelligence module remain in place.
- The current task resume mechanism is still explicit/user-triggered; a background worker that autonomously resumes tasks is not yet enabled or verified.
- The new checkpoint constructor is a bounded serialization/ownership contract; it does not replace the existing database ledger or silently persist data by itself.
- The current planner still relies on the reviewed capability vocabulary/catalogue and dependency resolver. This is a safer autonomous supervisor around the current planner, not unrestricted semantic planning.
- Error recovery remains bounded; the current retry behavior does not constitute general-purpose root-cause repair or automatic source-code modification.
- External contact, destructive data changes, model-weight activation, and consequential actions remain behind human approval and role checks.

**Verification status:** Source and test changes are committed to the STAGING feature branch. Full `npm test`, backend syntax checks, Vite build, Render manual deployment, and exact live-commit verification are pending. Do not report this implementation as live until those checks pass. No production or PFMS/PFSS resources were changed.


### Autonomous Agent Core 2.0 foundation — STAGING build and deployment verified (2026-11-26)

- Render deployment: `dep-dc443fmq1p3s73cs1jbg`.
- Deployed application commit: `1197dcc886c8fe2373b033e3ad46825976fe5c6e`.
- Status: **live**, finished `2026-11-26T14:27:45.163634Z`.
- Build: **198 tests passed, 0 failed**; backend syntax checks and Vite build succeeded.
- Runtime: API listening on port 10000; STAGING Supabase Data API returned HTTP 200; Tavily and OpenAI provider configuration detected.
- The first build exposed defects in goal sanitization/checkpoint tests; the control-character expression and checkpoint byte counting were corrected, then the full successful build above verified the fix.
- The application commit includes the autonomy supervisor, core integration, server chat-path integration, persisted goal criteria in the existing task ledger, and the new regression suite.
- The following are **not yet implemented or enabled by this release**: autonomous background worker/scheduler, general-purpose semantic planning beyond the reviewed capability catalogue, multi-round root-cause re-planning beyond bounded retries, and a fully integrated automatic improvement/test/release pipeline. Existing task resumption remains explicit; consequential changes remain approval-gated.
- STAGING auto-deploy remains disabled. Production `main`, production Render, production Supabase, PFMS and PFSS remain untouched.

---

## 2026-11-26 — Development checkpoint: safe task-resume policy

- **Scope:** myScoutingDatabase / MESSINHO, feature branch only.
- **Implemented:** `backend/messinho-task-policy.js` now provides a conservative resume gate, explicit per-task opt-in enforcement, capability read-only classification enforcement, expiry and attempt-limit checks, retry-backoff checks, and capped exponential retry-delay calculation.
- **Tests:** `tests/messinho-task-policy.test.js` expanded from 4 to 7 tests. Isolated Node test run: 7 passed, 0 failed.
- **Safety decisions:** tasks are not background-resumable unless `autonomous_resume_enabled === true`; only queued/partial tasks can pass the policy; each pending capability must be explicitly classified `read_only`; running/expired leases are not reclaimed by this policy; max attempts defaults to 4.
- **Not yet implemented:** atomic database claim RPC, durable retry metadata columns, worker polling/lifecycle, capability safety registry, and wiring from the server to the worker. The policy functions are groundwork only; no automatic execution has been enabled.
- **Deployment:** not deployed. No Render service, Supabase project, production branch, or production data was changed.
- **Next step:** design and test an atomic STAGING-only task-claim migration, after confirming the task table schema and migration history; then implement a worker that consumes only explicitly opted-in, read-only tasks.

---

## 2026-11-26 — Development checkpoint: atomic task claim on STAGING

- **Database:** applied migration `messinho_atomic_task_claim` to STAGING Supabase project `nwqwnrhupbyhshsprxjt` only.
- **Schema additions:** `autonomous_resume_enabled BOOLEAN NOT NULL DEFAULT false`, `next_retry_at`, `claimed_by`, and `lease_token`. Existing task count was zero at inspection; no task was opted in.
- **Concurrency:** added `public.claim_next_messinho_agent_task(text)`, which claims one eligible queued/partial task with `FOR UPDATE SKIP LOCKED`, creates a unique lease token, increments attempts, and sets a two-minute lease. It only considers explicitly opted-in, unexpired tasks with fewer than four attempts and a due retry time.
- **Security:** SECURITY DEFINER with empty search_path; execution revoked from PUBLIC/anon/authenticated and granted only to service_role. Verified privileges: anon=false, authenticated=false, service_role=true.
- **Repository migration:** `supabase/migrations/20261126200000_messinho_atomic_task_claim.sql` committed on `feature/messinho-unified-ai-integration`.
- **CI for commit `b09ddb19422bb1656b618fee1786ffab4efb84bc`:** MESSINHO Node tests passed; backend syntax checks passed; STAGING health smoke test passed. Workflow runs: 45842070880, 45842070806, 45842070932.
- **Important limitation:** this is the atomic claim primitive only. No background worker, task opt-in UI/API, execution/resume loop, lease renewal, or lease-token guarded finalization has been connected yet. No existing task can be picked up by the new function unless explicitly opted in.
- **Release:** no Render deployment was triggered. STAGING Render auto-deploy remains disabled. Production, main, production Supabase, PFMS and PFSS remain untouched.
- **Next:** implement an explicit owner-authorized opt-in path, strict read-only capability allowlist, lease-token guarded worker lifecycle, bounded retry/failure handling and tests; only then enable worker in STAGING behind a dedicated environment flag.
## 2026-11-26 — MESSINHO worker implementation checkpoint

- Added `backend/messinho-background-worker.js`: explicitly gated to Render, the exact configured staging service ID, an explicit enable flag, and Supabase service credentials. Production service IDs cannot pass the staging equality check.
- Atomic RPC claim is used; only tasks with `autonomous_resume_enabled=true` are claimable. Execution is restricted to a small, explicit read-only capability allowlist.
- Task completion, retry and rejection writes are owner-scoped and additionally require the exact worker claim and lease token. Retry uses capped exponential backoff and four-attempt ceiling. User-input gaps move to `waiting_for_input`.
- Added authenticated owner-only endpoint `POST /api/messinho/tasks/:taskId/autonomous-resume`; it rejects unsafe capabilities, expired tasks, invalid states and exhausted attempts before explicit opt-in.
- Worker is started at server boot but remains disabled unless all staging env gates are set. SIGTERM/SIGINT stop it.
- Added `tests/messinho-background-worker.test.js` covering staging gate, explicit opt-in, read-only allowlist, lease-token completion and unsafe-task rejection.
- Commits: worker `02dfff83d923cac8225e45a8ad6ae71bfa733243`; tests `3aadc41e7847b9209eb4123e63960d2ece98d601`; server integration `f67648f274c945227dca606080767b2780350fcb`.
- **Not yet live:** no Render environment flag has been enabled and no deployment has been triggered. Keep auto-deploy disabled. Next: run CI/build, configure only STAGING `MESSINHO_AUTONOMY_WORKER_ENABLED=true` and `MESSINHO_STAGING_RENDER_SERVICE_ID=srv-dc3chlqjnfac73acd6ig`, manually deploy STAGING, verify health and worker startup. Production and all PFMS/PFSS systems untouched.
- **Validation correction:** first CI pass exposed three issues in worker tests: the claimed row is in status `running`, while the generic resume policy expects `queued/partial`. Worker validation now adapts only a claimed row with a lease token for the policy check. Corrected run `45842726513`: all 206 tests passed and backend syntax checks passed.
- **STAGING deployment:** Render deploy `dep-dc44dp61egvs73fa83ng` is LIVE, commit `cf235b2c0a725c865e5b16486ab0023d7e6ea8ec`, finished `2026-11-26T14:49:45.995747Z`. Build reported 206 tests passed, 0 failed; Vite build succeeded; Supabase Data API returned HTTP 200 after startup.
- **Worker staging gate:** set only on STAGING: `MESSINHO_AUTONOMY_WORKER_ENABLED=true`, `MESSINHO_STAGING_RENDER_SERVICE_ID=srv-dc3chlqjnfac73acd6ig`. The service auto-deploy setting remains disabled. Render environment update caused the expected staging deploy.
- No task has yet been explicitly opted in, so the worker has no task to execute. No production, main, production database, PFMS or PFSS changes.
## 2026-11-26 — Integration of bounded Scout self-reflection and quality memory

### Audit findings against supplied Python architecture
- No parallel SQLite memory was added. The project already has owner-scoped Supabase knowledge memory (messinho-knowledge-memory.js) with source provenance, HTTPS validation, independent-domain requirements, expiry, and similarity safeguards.
- No second Tavily/OpenAI research client was added. Existing messinho-general-research.js and messinho-research.js already own web search and evidence synthesis.
- No duplicate learning engine was added. Existing messinho-learning.js only proposes calibration from admin-verified outcomes and requires approval before activation; critic feedback is not treated as ground-truth football outcome data.
- Existing task/core/orchestrator code already has bounded capability steps, execution budgets, provenance validation, retry limits and task checkpointing. The new three-pass limit is scoped to answer drafting/critique, not a second agent execution loop.
- The supplied Python's excluded_domains and score > 0.5 are not portable as-is: current Tavily general search returns a different source shape and current source-quality logic is already centralized. The implementation uses existing HTTPS/source normalization and a targeted denylist for links instead of introducing an incompatible parallel filter.

### Implemented on STAGING feature branch
- Added backend/messinho-quality-control.js: separate Scout and Critic system prompts, hard maximum of 3 draft/review iterations, best-draft fallback, JSON critic response validation, fail-closed behavior when critic provider is unavailable, maximum 3 Markdown links, HTTPS/allowlisted-source enforcement, and rejection of raw/unapproved links.
- Integrated the critic loop into general evidence research and external player-profile research. Player profile synthesis now requires cited fact records and independent critic approval; otherwise MESSINHO returns the source list with needs_review and no unapproved profile.
- Critic feedback is supplied to each subsequent draft. If a later draft-generation call fails, the best prior reviewed candidate is retained; provider unavailability stops repeated calls.
- Durable knowledge memory now requires quality_control.passed === true in addition to the existing two-domain/source evidence gates. Unreviewed drafts and source-only digests are not stored as corroborated memory.
- Research API response now exposes the quality-control outcome for transparent UI reporting.
- Added tests/messinho-quality-control.test.js for 3-iteration cap, early stop on approval, link validation, deterministic evidence gate, and critic provider failure.
- Updated knowledge-memory tests to require critic approval.

### Not claimed / remaining
- This is persistent retrieval memory and reviewed quality feedback, not model-weight training or autonomous self-modification.
- Critic is a second model call using the configured OpenAI endpoint/model; it is not an independent external fact database. Deterministic source/URL gates remain authoritative.
- The quality loop currently wraps external general research and player-profile synthesis. Internal deterministic scoring capabilities remain validated by their existing runtime, provenance and test gates rather than sending every numerical operation through a language-model critic.
- CI and STAGING deployment for these latest changes are pending. Do not claim this release is live until the Render build (which runs npm test, backend syntax checks and Vite build) succeeds and the exact deployed commit is verified.
- No Supabase schema change was required. Production/main, production Supabase, PFMS and PFSS remain untouched.
- **First build attempt:** Render build for commit 103b9f6d05c1a6da5b7dd6e161ece8e15a0cee49 correctly blocked deployment: 210/211 tests passed. The failing regression exposed a best-draft tie-break defect: an equally scored later critic-approved draft did not replace the earlier failed draft.
- **Correction:** quality loop now always prefers a critic-approved candidate over any failed candidate, even at an equal score. Added diagnostic assertion context to the test. The failed build did not replace the currently live STAGING release; no production impact.
- **Next:** rerun full STAGING build on the corrected branch tip, then verify deployed SHA and live status.
- **Final STAGING verification:** deployment dep-dc44mjnf3r2c73a9ica0 is LIVE, finished 2026-11-26T15:08:40.953402Z, exact application commit 9984a8d742f3481843d48c192b307a88a598ea16. Render service remains autoDeploy=no; startup log confirms API listening on port 10000 and Supabase Data API HTTP 200.
- **Build gate:** full Node suite 211 passed / 0 failed; backend JavaScript syntax checks passed (the build proceeded to Vite); Vite transformed 1,636 modules and built successfully. The preceding failed build was not promoted.
- The quality loop is now live on STAGING for general evidence research and external player-profile synthesis. The existing worker remains gated on STAGING and only executes explicitly opted-in allowlisted read-only tasks.
- PR #47 remains Draft/open/unmerged. Production/main and production Supabase, PFMS/PFSS remain untouched. No new Supabase migration was needed.


## 2026-11-26 — UX checkpoint: MESSINHO chat first, help consolidated

### Owner request and accepted UX decision
- Move the MESSINHO AI-agent conversation from the bottom of the workspace to the top, immediately after the existing MESSINHO hero/header.
- Bundle supporting explanations, learning/calibration tools, development-cycle controls, autonomous-mode explanation, overview/status information and roadmap into one compact, collapsible section titled **“Hilfe, Erklärungen & Agentenfunktionen”**.
- Keep the chat as the primary interaction point. Supporting material must not compete visually with the conversation or make the page feel overloaded.
- The help bundle is collapsed by default and can be expanded when needed. No existing learning, development, permission or role-gated functionality was removed.

### Implementation
- Updated `src/asi/MessinhoWorkspace.jsx`: moved the existing chat card directly below the hero and grouped all supporting panels and the roadmap inside one native collapsible `details` section.
- Updated `src/asi/messinho.css`: added responsive styling for the grouped help panel, summary row and expand/collapse indicator.
- Existing chat logic, API requests, message history, learning controls, development controls and role checks were preserved; this is a presentation/layout change only.
- Commits:
  - Chat moved / panels grouped: `cd18b18f56e9c3fc423bcaea7b5699fee07aec29`
  - Consolidated help panel styling: `5269d447cd5179e31382d917e5e143b28a05c32b`

### Verification and release status
- Source updates are committed to `feature/messinho-unified-ai-integration`.
- **Not yet verified by CI/build or deployed to STAGING.** Do not tell the owner the visual change is live until the frontend build, full test suite, exact Render deployment commit and live status are checked.
- STAGING Render auto-deploy remains disabled; do not enable it. A manual STAGING deployment is required after validation.
- PR #47 remains Draft/open/unmerged unless a fresh GitHub check proves otherwise.
- Production `main`, production Render, production Supabase, PFMS and PFSS remain untouched.

### Next steps
1. Run the complete Node test suite, backend syntax checks and Vite production build on the current branch tip.
2. Inspect the rendered workspace on desktop and mobile: chat must appear first; help content must be collapsed initially and expand cleanly without overflow.
3. If checks pass, manually deploy only the dedicated STAGING Render service and verify the exact deployed SHA and health.
4. Resume the next planned development task: integrate real scout/user feedback into the existing role-scoped, auditable learning flow. Separate general satisfaction feedback from factual corrections; only verified corrections/outcomes may create learning proposals, and model activation remains approval-gated.


### Final verification — UX change deployed to STAGING (2026-11-26)
- Latest feature branch / PR #47 head: `90a9d0532f6c4304f2c95c759fafd4b4b6b1ce42`.
- GitHub Actions for this exact SHA: `test` **success**, `backend-syntax` **success**.
- Render manual deployment: `dep-dc44rheq1p3s73cu5rog`, status **live**, finished `2026-11-26T15:19:08.289376Z`.
- Render build: successful; Vite 7.3.8 transformed 1,636 modules and completed production build successfully.
- Runtime startup verified: `myScoutingDatabase API listening on 10000`; STAGING Supabase Data API returned HTTP 200.
- Exact deployed application commit: `90a9d0532f6c4304f2c95c759fafd4b4b6b1ce42`.
- Render service inspection confirms `autoDeploy=no`, branch `feature/messinho-unified-ai-integration`, URL `https://myscoutingdatabase-messinho-staging.onrender.com`.
- **The chat-first layout and consolidated help bundle are now deployed on STAGING.** Browser-level visual QA on the owner's device remains outstanding; verify desktop/mobile appearance and accordion behavior before treating visual acceptance as complete.
- Production `main`, production Render, production Supabase, PFMS and PFSS remain untouched. PR #47 remains Draft/open/unmerged.


## 2026-11-26 — MESSINHO Feedback Intelligence Foundation (STAGING only)

### Starting point and scope
- Continued from the documented chat-first UX checkpoint; no project restart or replacement of existing MESSINHO learning modules.
- Working branch: `feature/messinho-unified-ai-integration`.
- Previous verified chat-first release remains commit `90a9d0532f6c4304f2c95c759fafd4b4b6b1ce42`, Render deployment `dep-dc44rheq1p3s73cu5rog`.
- Dedicated Supabase project confirmed by live project metadata: `myScoutingDatabase-staging`, ref `nwqwnrhupbyhshsprxjt`, region `eu-central-1`, healthy.
- Render STAGING auto-deploy remains disabled. No new Render deployment was triggered by this work. Production/main, production Supabase, PFMS and PFSS were not accessed or changed.

### Existing architecture audit
- Existing deterministic player scoring and explainable assessments remain in `messinho-engine.js` and `messinho-intelligence.js`.
- Existing bounded Scout/Critic loop remains in `messinho-quality-control.js`; it handles evidence/answer quality and up to three correction passes.
- Existing supervised calibration remains in `messinho-learning.js`; it trains only on admin-verified 12-month outcomes with at least 30 examples, 10 unique players, a 20% player holdout, minimum 1-point MAE improvement and bounded weight changes.
- Existing owner-scoped, source-provenance knowledge memory remains in `messinho-knowledge-memory.js`; it is retrieval memory, not model-weight training.
- Existing ASI tables are reused for calibration, prediction outcomes, training runs and model versioning. No duplicate player-learning or model-weight tables were introduced.
- Direct STAGING database inspection found the frontend was calling `asi_review_scout_calibration` and `asi_review_model_candidate`, but neither RPC existed in the deployed database. The UI actions were therefore not backed by functioning database procedures.

### Implemented feedback foundation
- Added `backend/messinho-feedback.js` with bounded input normalization, category validation, rating validation, capability identifier allowlisting, HTTPS evidence validation and explicit review-state contracts.
- Added `tests/messinho-feedback.test.js` covering valid ratings, invalid context/ranges, required factual-correction detail, bounded capability IDs, HTTPS verification and separation from outcome training.
- Added authenticated, rate-limited server endpoints:
  - `POST /api/messinho/feedback` — saves one feedback record per user/assistant-message pair.
  - `GET /api/messinho/feedback` — administrator-only review queue.
  - `POST /api/messinho/feedback/:feedbackId/review` — administrator-only atomic review transition.
  - `POST /api/messinho/calibration/:recordId/review` — server-mediated existing calibration review.
  - `POST /api/messinho/models/:modelVersionId/review` — server-mediated model candidate approval/rejection.
- Added quiet thumbs-up/down controls to actual MESSINHO chat replies. Negative feedback can be categorized as answer-quality, factual correction, bug report or feature request, with optional/required explanation as appropriate.
- Added an administrator feedback queue inside the existing collapsed help bundle. Factual corrections can only be marked verified with an HTTPS evidence URL and an administrator review.
- Feedback is a separate quality signal. It is NOT inserted into `asi_scout_calibration_records`, `asi_prediction_outcomes` or training datasets. It does not change model weights, agent instructions or the knowledge memory automatically.
- Added append-only `messinho_feedback_reviews` history. The review function serializes state transitions and writes the review event in the same transaction.

### STAGING database migrations applied
- `20261126153903_messinho_feedback_intelligence` — created `messinho_feedback` and `messinho_feedback_reviews`, enabled RLS, added server-only grants, and created the three atomic admin review functions.
- `20261126153929_messinho_feedback_audit_hardening` — removed UPDATE/DELETE/TRUNCATE rights from the service role on the audit-history table and indexed reviewer foreign keys.
- Both applied successfully to Supabase STAGING and reconciled to matching migration filenames in the repository.
- Verified: both new tables exist, RLS is enabled, both tables currently contain zero rows, and the three review functions are executable by `service_role` only (not `anon` or `authenticated`).
- Verified: `messinho_feedback_reviews` has only SELECT/INSERT grants for `service_role`; no UPDATE/DELETE/TRUNCATE grant remains. No direct Data API access is granted to end users.
- Supabase performance advisor no longer reports unindexed foreign keys for the new feedback tables. Its remaining unused-index notices are expected before feedback data accumulates.
- Existing unrelated security advisor findings remain: RLS without policies on `messinho_diagnostic_runs`, authenticated execution of the pre-existing `admin_set_scout_approval` SECURITY DEFINER function, and disabled leaked-password protection. These were not changed as part of this feedback task.

### Current validation and release gate
- Source files and migration files are committed to the feature branch; latest branch commit at this checkpoint is to be re-read before the next operation.
- Database migration application and schema/privilege introspection succeeded on STAGING.
- Unit tests have been added but the complete Node test suite, backend syntax checks and Vite production build have NOT yet been verified for the new code.
- No Render deployment has been triggered. Do not describe the feedback UI/API as live until build gates pass, the manual STAGING deploy is live on the exact intended SHA, and authenticated Scout/Admin smoke tests succeed.
- Existing STAGING Render auto-deploy remains disabled. Production remains untouched.

### Next steps
1. Run `npm test`, all backend `node --check` checks and the Vite production build on the current branch tip.
2. Fix any test, syntax or build regressions before deployment.
3. Manually deploy only the dedicated STAGING Render service after successful validation; verify exact deployed SHA and health.
4. Run authenticated smoke tests: Scout positive rating, negative rating, factual correction, duplicate submission, non-admin review denial, Admin queue, evidence-required verification, immutable review history, calibration verification and atomic model approval/rejection.
5. Only after measured data exists, design a separate quality-metrics stage. Do not convert ratings or unverified corrections into player outcomes or model training.
6. Keep PR #47 Draft/open/unmerged unless explicitly approved. Never deploy to production from this branch.


### Post-build verification — 2026-11-26 15:41 UTC
- Render STAGING manual deployment `dep-dc456161egvs73fc80ig` completed with status `live`.
- Deployed commit: `7b152409dd0bea3f259e8e3491b9cc85b87a9d8c` on `feature/messinho-unified-ai-integration`.
- Build command completed successfully: `npm install --no-audit --no-fund && npm run build`.
- Complete Node test suite: **217 passed, 0 failed, 0 cancelled, 0 skipped**.
- Backend syntax gate passed: `find backend -maxdepth 1 -type f -name '*.js' -print0 | xargs -0 -n1 node --check`.
- Vite production build passed: **1,636 modules transformed**, production assets generated.
- Runtime startup confirmed: `myScoutingDatabase API listening on 10000`; staging Supabase service credentials detected and Supabase Data API returned HTTP 200.
- Render auto-deploy remains disabled. No production or PFMS/PFSS deployment was triggered.
- Authenticated UI/API end-to-end tests still require a controlled Scout/Admin login session; no credentials were created, exposed or reused during this run. Therefore the feature is deployed to STAGING, but the feedback submission and administrator review flow is not yet declared end-to-end accepted.
- The only commits after the deployed SHA in this checkpoint are documentation updates; no runtime code change is pending deployment.


### Follow-up quality-signal hardening — 2026-11-26
- Staging audit confirmed the only currently provisioned profiles are one approved admin and one approved scout; the existing authenticated MESSINHO guard intentionally admits only these two roles. No additional test accounts or credentials were created.
- Found a semantic issue in the first feedback implementation: factual corrections, bug reports and feature requests could carry a numerical rating. This risked mixing qualitative corrections with answer-quality metrics.
- Fixed the contract: only `quality_rating` may carry a 1–5 rating; other feedback categories must store `rating = null`.
- Updated chat submission so factual corrections/bug reports/feature requests send a null rating.
- Tightened `isMessinhoFeedbackEligibleForQualityMetrics` so only explicitly categorized `quality_rating` records can enter answer-quality metrics. This helper does not enable model training.
- Added unit regression coverage for the category/rating boundary.
- Applied STAGING migration `20261126161000_messinho_feedback_signal_semantics`; live catalog confirms the check constraint `messinho_feedback_rating_type_semantics` is installed.
- Render manual deployment for SHA `ab909ea784a10e0e2d4e594ad77b7c42b7d2d925`: build event reports `succeeded`; the `npm run build` script executes the full Node test suite, backend syntax checks and Vite build. Deployment rollout status was still `update_in_progress` at the last poll; do not call the new runtime version live until Render reports `live` and a matching `deploy_ended/succeeded` event.
- Authenticated Scout/Admin end-to-end submission and review tests remain outstanding; no credentials were accessed or generated.
- Production, PFMS/PFSS and the main branch remain untouched; staging auto-deploy remains disabled.

### Immediate next action
1. Confirm Render deployment `dep-dc45838u01pc73etpvmg` reaches `live` on SHA `ab909ea784a10e0e2d4e594ad77b7c42b7d2d925`.
2. With the user's controlled Scout/Admin sessions, run the positive rating, negative rating, correction, duplicate, admin queue, role denial, HTTPS evidence and immutable audit smoke tests.
3. Record results and only then begin quality-metric aggregation. No automatic self-training from ratings or unverified feedback.


### Deployment confirmation — feedback signal semantics — 2026-11-26 15:46 UTC
- Render deployment `dep-dc45838u01pc73etpvmg` reached status `live` with a matching `deploy_ended: succeeded` event.
- Exact deployed runtime commit: `ab909ea784a10e0e2d4e594ad77b7c42b7d2d925`.
- Render application logs confirmed: `Your service is live` and primary staging URL is available.
- Build event: `succeeded`. The service build command invokes `npm run build`, which runs `npm test`, backend JavaScript syntax checks and `vite build` before deployment.
- Latest GitHub branch head after this documentation checkpoint: `034cfa0e43fb4c093d8deb0f7e76349542364188`; the only commit after the deployed runtime SHA is this documentation checkpoint, not a runtime code change.
- STAGING only; auto-deploy remains off. Production, PFMS/PFSS and main remain untouched.


### MESSINHO Quality Intelligence — STAGING release — 2026-11-26 15:52 UTC

#### Implemented
- Added `backend/messinho-quality-intelligence.js`: deterministic and privacy-preserving aggregation of feedback. It returns counts, 1–5 rating distribution, average and low-rating rate, confidence by sample size, 30-day trend comparison, group summaries by capability, intent, engine version and model version, and recurring feedback themes.
- Added conservative improvement hypotheses: at least 5 reviewed low ratings in a capability/intent group, at least 3 admin-verified factual corrections in a group, or at least 3 reviewed repeated theme matches. Hypotheses are bounded, sorted by priority and explicitly non-causal.
- Ratings count only after admin review (`reviewed` / `applied`). Factual corrections count only after verification (`verified` / `applied`). Bug reports and feature requests count only after review (`reviewed` / `applied`). Pending and rejected signals are excluded from quality calculations.
- Capability IDs are all attributed (not just the first one). If no capability is attached, grouping falls back to intent.
- No raw question, answer, comment, user ID or personal information is returned in the aggregate report.
- Added `GET /api/messinho/quality-intelligence`: authenticated, approved-admin-only, rate-limited to 20 requests/hour, server-side query limited to the latest 1,000 feedback records.
- Added a compact administrator-only Quality Intelligence panel inside the existing collapsed Help / Explanations bundle. It shows metrics, confidence, trend, rating distribution, capability performance, themes and hypotheses.
- No database migration required. The implementation reuses the existing feedback and append-only review ledger.

#### Tests and deployment
- Added `tests/messinho-quality-intelligence.test.js` for reviewed-only aggregation, verified corrections, minimum sample thresholds, privacy of aggregate output, bounded record count, multi-capability attribution and engine/model version segmentation.
- Render STAGING deployment `dep-dc45b6kipgvc738m8gl0` reached `live` on runtime SHA `76d39c4ed34fc16e8cc3700f09bd19d4c096f9a7` at 2026-11-26 15:52 UTC.
- Full Node test suite: **225 passed, 0 failed**.
- Backend JavaScript syntax checks passed as part of the configured build; Vite production build succeeded with **1,636 modules transformed**.
- Runtime logs confirm `myScoutingDatabase API listening on 10000`.
- Render STAGING auto-deploy remains disabled. No production/PFMS/PFSS deployment or database change.

#### Governance and remaining validation
- Quality feedback is not player outcome data and is not included in supervised weight training.
- The quality-intelligence module never changes prompts, agent capabilities, memory, knowledge or model weights. It creates reviewable hypotheses only.
- There are currently no user-generated feedback records in STAGING; the panel will therefore show an empty/insufficient-sample state until real reviewed feedback is collected. No synthetic feedback was inserted.
- Authenticated Scout/Admin end-to-end testing is still pending a controlled login session. Validate Scout rating and correction submission, duplicate rejection, non-admin denial, admin queue/review, HTTPS evidence requirement and audit-history immutability. Then load the Quality Intelligence panel and confirm it counts only eligible reviewed records.
- PR #47 remains Draft/open/unmerged. The latest runtime code is live on STAGING; subsequent commits are documentation only.

#### Next development step
1. Complete the authenticated Scout/Admin smoke tests with the user's own controlled sessions.
2. Collect real reviewed feedback and evaluate whether the initial thresholds produce useful, stable patterns.
3. Add a human-approved hypothesis lifecycle (accepted / rejected / test-created / validated) before allowing any quality hypothesis to influence Critic checks or capability behavior.
4. Keep automatic prompt, capability and model changes disabled until a hypothesis has a regression test, measurable before/after result and explicit admin approval.


### Additional governance hardening — factual-correction apply gate — 2026-11-26
- Review-state audit found that the prior SQL review RPC allowed a factual correction to transition from `reviewed` directly to `applied`, bypassing the evidence-backed `verified` state.
- Added and applied STAGING migration `20261126170000_messinho_feedback_apply_gate`.
- New transition rule: factual corrections can be marked `applied` only after their status is `verified`; verification still requires an HTTPS evidence URL. Other feedback categories can be applied only after review.
- Live database catalog confirms the updated RPC contains the explicit `factual_correction_must_be_verified_before_apply` gate. RPC execution remains service_role-only (anon=false, authenticated=false, service_role=true).
- This is a database-only hardening migration; no runtime code change or redeploy was required. Runtime remains live on `76d39c4ed34fc16e8cc3700f09bd19d4c096f9a7`.
- STAGING currently contains no generated feedback records. No synthetic rows were added.

## 2026-11-26 – MESSINHO Improvement Hypothesis Governance

- Added persistent lifecycle for quality-intelligence hypotheses in staging:
  - proposed → accepted → test_created → validated
  - alternative terminal paths: rejected and rolled_back
- New tables: messinho_improvement_hypotheses and append-only messinho_improvement_hypothesis_events.
- New RPC: asi_transition_messinho_hypothesis; every transition independently verifies an approved admin profile and writes the state change plus audit event in one transaction.
- API:
  - GET /api/messinho/improvement-hypotheses
  - POST /api/messinho/improvement-hypotheses
  - POST /api/messinho/improvement-hypotheses/:hypothesisId/transition
- Validation requires a concrete test plan before test_created, and HTTPS evidence plus passed=true and a meaningful evaluation summary before validated.
- Rejected/rolled-back proposals cannot be reopened through the transition API. Runtime prompts, capabilities, knowledge memory and model weights are not changed by this lifecycle.
- Admin quality panel supports taking a proposal into review, accepting/rejecting it, recording a test plan, validating a test report, and rolling back.
- Added unit tests for payload validation, lifecycle transitions, test-plan requirements and validation evidence.
- Staging migration applied; table access and RPC grants verified: anon/authenticated denied, service_role allowed.
- Supabase advisors show no new RLS finding for the two governance tables. Existing unrelated findings remain: messinho_diagnostic_runs without an RLS policy, admin_set_scout_approval executable by authenticated as SECURITY DEFINER, and leaked-password protection disabled. These were not modified in this milestone.
- Runtime deployment is pending workspace confirmation; Render auto-deploy remains disabled.


## 2026-11-26 – MESSINHO chat reliability and scouting-intent regression fixes

### User-observed failures addressed
- The owner reported that MESSINHO interpreted the bare year range 2004-2006 as subtraction, forgot a scouting request after asking for the country/league, and sent an irrelevant general web search for a conversational complaint.
- The owner also reported premature message submission on iPhone. The chat composer was changed in the prior UI patch to a multiline textarea; Enter inserts a line break and only the explicit send button submits. Failed sends preserve the draft.

### Runtime changes in this milestone
- Reordered the /api/agent/chat decision path so a pending scouting dialog is resolved before deterministic arithmetic. A year range in a scouting conversation is therefore interpreted as a birth-year filter, not subtraction.
- Expanded pending-clarification detection to include the actual assistant wording used in the chat: “Land bzw. Liga-Standort” and “Damit ich die Suche sauber eingrenzen kann …”.
- Added recognition of natural-language ages such as “21-jährigen” / “21 Jahre alt”.
- Added “6er” / “Sechser” as a specific defensive-midfielder role, taking precedence over the broader word “Mittelfeldspieler”.
- Added “deutsch” as a Germany alias.
- Age-based discovery now supplies a 21–21 age filter and derives a cautious birth-year window. The user-facing response explicitly states that exact age still requires a complete date of birth; a birth year alone is not treated as proof of exact age.
- Fixed discovery's null birth-year handling. JavaScript Number(null) === 0 previously caused missing birth-year bounds to be interpreted as year zero instead of being derived from the requested age group.
- Added a conversational-intent guard so complaints/questions about restarting, interrupted work, or premature sending are not routed to external general-knowledge web search.

### Regression coverage
- Added tests for the exact user scenario: 21-year-old, left-footed midfielder who can play as a No. 6, clarification “Deutschland 3 Liga oder Regionalliga”, preserving age/role/location/league context.
- Added tests for the German adjective “deutsch” and for preventing conversational complaints from triggering general web research.
- Existing deterministic-math tests already cover that a bare 2004-2006 range is not arithmetic; chat routing now ensures the scouting parser gets first opportunity to interpret the range.

### Release gate / known limitations
- Changes are committed to feature/messinho-unified-ai-integration.
- Full Node test suite, backend syntax checks, Vite build, and manual STAGING deployment must pass before this runtime change is described as live.
- The scouting discovery source pipeline still requires independent review for result relevance and source-to-player identity evidence. This patch fixes intent/context routing; it does not claim that the external candidate research is fully reliable.
- Authenticated Scout/Admin smoke tests remain pending a user-controlled login session.
- STAGING only. Production/main, PFMS/PFSS and production Supabase remain untouched. Render auto-deploy remains disabled. PR #47 remains Draft/open/unmerged.


### STAGING deployment verification — scouting intent/context fixes — 2026-11-26 16:54 UTC
- Render deployment: dep-dc468cnlk1mc739oe8c0
- Exact deployed commit: 267d3e72938770b8206886902ca37976adda190c
- Render build event: succeeded; deployment event: succeeded; final status: live.
- Full Node test suite: **234 passed, 0 failed, 0 cancelled, 0 skipped**.
- Regression tests confirm the 21-year-old defensive-midfielder request survives the “Land bzw. Liga-Standort” clarification, “deutsch” resolves to Germany, and conversational complaints are excluded from external general research.
- Backend syntax validation and Vite production build completed successfully; Vite transformed 1,636 modules and reported “built”.
- This is a STAGING release only. Render auto-deploy remains disabled. Production/main and production Supabase remain untouched. PFMS/PFSS remain untouched. PR #47 remains Draft/open/unmerged.
- Remaining validation: owner should test the exact multi-turn scouting flow in the live STAGING UI. External candidate discovery quality still needs separate source-relevance and identity verification work; this release does not claim that candidate research is fully reliable.


### Additional scouting requirement — preferred foot — 2026-11-26
- Extended natural-language scouting parsing to recognize left-footed, right-footed and two-footed player requirements, including German adjective inflections such as “linksfüßigen”.
- “6er” / “Sechser” remains a specific defensive-midfielder requirement even when the user also says “Mittelfeldspieler”.
- The preferred-foot criterion is forwarded into the discovery request and search focus.
- The research model is instructed to return a preferred foot only when the supplied sources explicitly support it. The deterministic evidence gate rejects candidates whose requested foot is missing or contradictory; an unsupported foot is never inferred from a player's position or nationality.
- The candidate analysis now retains the evidence-backed preferred-foot value for downstream display and audit.
- Added regression coverage for parsing and evidence matching of left/right/two-footed descriptions.
- No schema migration is required; the value is retained in the existing candidate analysis JSON.
- Full build/test gate and manual STAGING deployment are pending for this addition. Production remains untouched; auto-deploy remains disabled.


#### Preferred-foot filter — STAGING verification — 2026-11-26 16:58 UTC
- Render deployment dep-dc46a5mq1p3s73d24jc0 reached live; exact deployed SHA: e66fd682b5807a0e1830fbeb183871f0456fd812.
- Full Node suite: **235 passed, 0 failed, 0 cancelled, 0 skipped**.
- Backend JavaScript syntax checks passed and Vite production build completed successfully (1,636 modules transformed).
- The discovery pipeline now filters out candidates whose left/right/two-footed preference is not explicitly supported by the supplied source evidence.
- The user should test the original requirement again in STAGING. Exact-age verification still requires a full date of birth; birth-year-only sources are reported with that limitation.
- STAGING only; auto-deploy disabled. Production/main and PFMS/PFSS untouched. PR #47 remains Draft/open/unmerged.


## 2026-11-26 – Scouting preference fidelity: nationality and league alternatives

- Distinguished nationality preference from geographic scouting location. “Am besten deutsch” now records German nationality preference; it no longer silently forces the player's current club to be in Germany. A later explicit “Deutschland” answer remains the location filter.
- The nationality criterion is passed through the chat-to-discovery request and is enforced after the candidate nationality has been independently supported by source evidence. Missing or contradictory nationality evidence excludes the candidate when a nationality is required.
- Country/nationality aliases are canonicalized before comparison (e.g. deutsch / German / Deutschland).
- Multiple league choices are preserved rather than only taking the first regex match. “3. Liga oder Regionalliga” is retained as both alternatives in the requested target-level field and in the research focus.
- The previously added preferred-foot criterion remains source-evidence gated; it is not inferred from position.
- Added regression tests for nationality-vs-location separation, alias matching, and multi-league alternatives.
- Initial build attempts exposed an outdated regression expectation that treated the adjective “deutsch” as a Germany location filter. The intended behavior is to keep nationality and location separate; the test now asserts that distinction. The failed attempts did not replace the previously live STAGING deployment.
- Release gate: latest branch tip must pass the complete Node suite, backend syntax checks and Vite build before the next manual STAGING deploy. Production/main and PFMS/PFSS remain untouched; auto-deploy stays disabled; PR #47 stays Draft/open/unmerged.


## 2026-11-26 – Time-sensitive research freshness gate

- Added explicit detection of time-sensitive general questions (e.g. aktuell, heute, derzeit, neueste, live, 2026).
- For time-sensitive questions, the evidence gate now requires at least two substantial sources from two independent domains with explicit publication dates no older than 90 days.
- Old, undated or otherwise insufficient current sources are returned as insufficient evidence. MESSINHO does not ask the synthesis model to turn stale results into a current answer.
- Stable knowledge questions retain the existing cross-domain evidence requirement without an unnecessary 90-day freshness constraint.
- Freshness metadata is exposed in the evidence assessment: fresh/stale/undated counts, independent fresh domains, freshness status and limitations.
- Because owner-scoped knowledge memory already requires evidence.can_answer=true and passed quality control, stale current-event results are automatically excluded from persistent memory.
- Added unit and integration tests for current source thresholds, stale/undated source rejection, stable knowledge behavior, and early return before synthesis.
- No schema migration. No prompts, agent capabilities or model weights are automatically changed by this evidence gate.
- Release pending full test/syntax/build gate and manual STAGING deploy. Production remains untouched; Render auto-deploy remains disabled; PR #47 remains Draft/open/unmerged.


#### STAGING release verification — freshness-aware research — 2026-11-26 17:05 UTC
- Render deployment `dep-dc46dgu1egvs73ffla9g` reached `live` on runtime SHA `e849a6da25e51b9b2da074e91c7da2a6b6b83ccd`.
- Complete Node suite: **241 passed, 0 failed, 0 cancelled, 0 skipped**.
- Backend syntax checks passed and Vite production build completed successfully (1,636 modules transformed).
- Render logs confirm the service is live at the dedicated STAGING URL. Render configuration confirms `autoDeploy=no` and `autoDeployTrigger=off`.
- Production/main, production Supabase and PFMS/PFSS remain untouched. PR #47 remains Draft/open/unmerged.


## 2026-11-26 – Claim-level independent corroboration

- Strengthened general research beyond the global “two sources / two domains” threshold: every synthesized factual claim must now be supported independently by at least two cited source URLs from at least two distinct publisher domains.
- Every cited source must independently pass the deterministic text-overlap support check for that claim. One relevant source plus one unrelated citation no longer passes.
- Duplicate URLs and multiple URLs from the same publisher do not count as independent corroboration.
- The synthesis instructions explicitly require two independent citations per claim; unsupported or single-source claims are discarded and cannot pass the answer quality loop.
- This further protects owner-scoped knowledge memory because only answers that pass the evidence and quality gates are eligible for persistence.
- Added regression tests for valid two-domain corroboration, single-source rejection, same-domain rejection and unrelated-source rejection.
- No schema migration and no automatic changes to model weights or agent behavior beyond stricter evidence acceptance. Full tests/build and manual STAGING deployment are pending.


#### STAGING release verification — claim-level corroboration — 2026-11-26 17:07 UTC
- Render deployment `dep-dc46ebec6qcc73cksv90` reached `live` on runtime SHA `9a03e5beb45f6542ea058ecd62f514c0fbf74391`.
- Complete Node suite: **244 passed, 0 failed, 0 cancelled, 0 skipped**.
- Backend syntax checks passed; Vite production build completed successfully (1,636 modules transformed).
- Manual STAGING deployment only. Render auto-deploy remains disabled.
- Production/main, production Supabase and PFMS/PFSS remain untouched. PR #47 remains Draft/open/unmerged.


## 2026-11-26 – Freshness-bounded knowledge memory

- Closed a cache-expiry edge case: a current-events answer could previously remain in the 14-day owner-scoped cache after its oldest supporting source crossed the 90-day freshness limit.
- Time-sensitive knowledge is now persistable only when its evidence explicitly records the freshness gate as passed, with at least two fresh sources from two independent domains.
- Its memory expiry is the earlier of the normal 14-day cache TTL or the 90-day freshness deadline of its oldest dated supporting source.
- Missing freshness metadata, insufficient dates or an already-expired freshness window fail closed; the answer is not stored as durable knowledge.
- Stable, non-time-sensitive knowledge keeps the existing 14-day cache TTL.
- Added regression tests for the shortened expiry boundary and rejection of current knowledge without explicit freshness evidence.
- No migration required; the existing owner scoping, provenance and verified-only memory rules remain intact. Full test/build and manual STAGING deploy pending.


#### STAGING release verification — freshness-bounded memory — 2026-11-26 17:09 UTC
- Render deployment `dep-dc46f23l550s738b7dm0` reached `live` on runtime SHA `dd64766562ee1e25ccbe6f6a5917fe52deeb9751`.
- Complete Node suite: **246 passed, 0 failed, 0 cancelled, 0 skipped**.
- Backend syntax checks passed; Vite production build completed successfully (1,636 modules transformed).
- STAGING only; auto-deploy disabled. Production/main, production Supabase and PFMS/PFSS untouched. PR #47 remains Draft/open/unmerged.


## 2026-11-26 – Implicit freshness detection for dynamic football facts

- Extended time-sensitive intent detection beyond explicit words such as “aktuell” or “heute”.
- Questions such as “Wer trainiert Borussia Dortmund?”, current squad/roster requests, table standings, fixtures and transfer news now require fresh dated sources even when the user does not explicitly say “current”.
- Explicit historical framing and past-tense questions tied to a year are excluded from the current-information gate.
- Added tests for implicit dynamic questions, educational questions about coaching, and historical questions.
- The same 90-day freshness gate and freshness-bounded memory expiry apply; no extra persistence or automatic model changes.
- Full test/build and manual STAGING deployment pending.


#### STAGING release verification — implicit freshness detection — 2026-11-26 17:10 UTC
- Render deployment `dep-dc46fqtg1s2s73dfcqng` reached `live` on runtime SHA `5c46e5b36bc8dcf22b41162ea26b1e25147d0700`.
- Complete Node suite: **248 passed, 0 failed, 0 cancelled, 0 skipped**.
- Backend syntax checks passed; Vite production build completed successfully (1,636 modules transformed).
- STAGING only; auto-deploy disabled. Production/main, production Supabase and PFMS/PFSS untouched. PR #47 remains Draft/open/unmerged.


## 2026-11-26 – Freshness classes for dynamic football knowledge and graceful provider failure

- Tightened current-information windows by topic: live standings, fixtures, results and day-specific/live questions require sources no older than 7 days; coach, squad, transfer, market-value and injury status questions require sources no older than 30 days; other explicitly time-sensitive general topics retain 90 days.
- The evidence assessment exposes the selected freshness window. Historical questions remain exempt from current-source requirements.
- Owner-scoped knowledge memory now expires dynamic football answers according to the evidence freshness window, rather than always using the general 90-day deadline; the standard 14-day cache TTL still applies as the upper bound.
- If the independent search provider fails or times out, the chat now returns a clear, user-friendly limited-research response rather than an unhelpful server error. It does not fall back to invented current facts.
- Added regression tests for 7/30/90-day topic windows, rejecting two-week-old standings sources, and seven-day memory expiry.
- No schema migration. No changes to the separate player scouting evidence pipeline, model weights or production.
- Release gate: full Node test suite, backend syntax checks, Vite build, then manual STAGING deployment only. Render auto-deploy remains disabled; PR #47 remains Draft/open/unmerged.


- First release attempt exposed three outdated/incomplete regression assertions after the stricter topic windows were introduced (coach-source fixture still used a 42-day-old source, missing helper import, and an old generic 90-day wording assertion). These were test-fixture issues; the implementation was retained and the tests corrected. The failed build did not replace the prior live STAGING deployment.

- Second release attempt isolated one missing wording variant in the 30-day coach freshness classifier (`trainiert`); the classifier now recognizes direct German verb phrasing. No code was deployed from either failed build.


## 2026-11-26 — Owner directive: free and legal medical knowledge integration

- Owner explicitly requires all external literature and resources to be free and legally reusable. No paid books/services, paywall circumvention, or content with unclear rights.
- New implementation plan: `docs/MESSINHO_FREE_LEGAL_MEDICAL_KNOWLEDGE_PLAN.md`.
- Target is at least 100 individually rights-checked medical/scientific reference works, covering sports medicine, orthopaedics/traumatology, general medicine/internal medicine, anatomy, biomechanics, physiology, neurology, rehabilitation, cardiology, nutrition, sleep and prevention. The 100 is a target, not permission to include unverified works.
- Mandatory per-work rights metadata: rights holder, exact license/version, automated download and processing permission, AI/TDM/embedding/retrieval suitability, commercial-use permission, derivative/adaptation rules, attribution, third-party media exceptions, source URL and review date.
- Key legal findings: NCBI Bookshelf rights vary by work; US government authorship may indicate public domain but third-party content can be excluded. OpenStax Anatomy & Physiology 2e explicitly disallows LLM ingestion without prior written permission and is excluded until permission exists. WHO publications since 2016 are generally CC BY-NC-SA 3.0 IGO and are not assumed suitable for a commercial product. MSD Manuals content is not reusable merely because it is free to read.
- Preferred source classes: verified public-domain works, CC0, and CC BY with source-specific AI/TDM, commercial, attribution and third-party rights checked. NC and ND works are excluded from ingestion by default unless a specific documented permission and legal review permits the exact use.
- Medical content must be a central, automatically used evidence/knowledge layer, not 100 user-selectable capabilities. It must preserve chapter/section provenance, license, edition/date, evidence quality, contradictions and review/expiry metadata.
- Medical outputs must be separated from player talent scores. MESSINHO may explain evidence and general prevention/fitness information but must not claim diagnoses, issue individual medical clearance, independently decide return-to-play, prescribe treatment, or process special-category health data without a documented legal basis and privacy review.
- Parallel workstream: audit every one of the 100 existing capability IDs against real specialist behavior, automatic chat selection, execution, validation, authorization, data/provider dependencies and meaningful tests. Generic fallback handlers do not count as complete integration. The runtime's current completion_verified_count is 0; catalogue/handler presence is not proof of end-to-end completion.
- No medical books have yet been imported and no medical knowledge database or migration has been deployed. This checkpoint records scope, constraints and verified licensing findings only.
- Work remains restricted to feature/messinho-unified-ai-integration and dedicated STAGING. Production/main, PFMS/PFSS and PR #47 merge state remain untouched; Render auto-deploy remains disabled.
- Research sources: NCBI Bookshelf Copyright Notice (https://www.ncbi.nlm.nih.gov/sites/books/about/copyright/); NCBI Bookshelf FAQ (https://www.ncbi.nlm.nih.gov/sites/books/NBK45610/); OpenStax A&P 2e reuse terms (https://openstax.org/books/anatomy-and-physiology-2e/pages/preface); WHO Open Access Policy (https://www.who.int/about/policies/publishing/open-access); MSD Manual FAQ (https://www.msdmanuals.com/professional/resourcespages/faqs); Open Textbook Library FAQ (https://open.umn.edu/opentextbooks/faq); NLM Sports Medicine collection guidelines (https://www.ncbi.nlm.nih.gov/books/NBK518802/); PMC Open Access Subset (https://pmc.ncbi.nlm.nih.gov/tools/openftlist/).


## 2026-11-26 — Owner clarification: knowledge extraction, not book imports

- The owner explicitly clarified that MESSINHO must **not import or permanently store full books, PDFs, or book collections**. The purpose of the 100-work target is to use at least 100 individually rights-checked specialist works as external knowledge/reference sources, not to create a local book archive.
- MESSINHO should extract and use compact, independently worded knowledge units: core fact/claim, context, evidence strength and limitations, source/work/section reference, URL, exact license/rights record, edition/version, verification date and review/expiry date.
- Store only the minimum metadata, concise summaries/facts, evidence pointers and legally permitted embeddings needed for retrieval. A summary or embedding is not automatically copyright-safe; every processing, storage, adaptation and AI/TDM use must pass the source-specific rights gate.
- Prefer targeted retrieval of relevant sections over downloading entire works. Where terms permit temporary processing, discard raw files, OCR output and temporary full text after extraction. Do not retain full-text dumps, image/table copies or redundant source files.
- Do not add a separate paid vector database or storage service without explicit cost/architecture review. Prefer existing infrastructure if suitable; implement deduplication, bounded entry size, storage budgets, TTL/review dates and cleanup tests.
- Use compact stored knowledge for stable facts and targeted live research for current or missing facts. Every answer must preserve source provenance and freshness. No automatic medical scoring-weight changes.
- This clarification supersedes any interpretation of the earlier plan that implied permanent storage of the 100 source books. The 100 works are a vetted source base; the stored knowledge layer must remain compact and cost-conscious.
- Updated detailed plan: `docs/MESSINHO_FREE_LEGAL_MEDICAL_KNOWLEDGE_PLAN.md`.
- No code, database schema, storage bucket, migration or deployment has been changed by this clarification. STAGING-only boundaries remain in force; production/main, PFMS/PFSS and PR #47 merge state remain untouched; Render auto-deploy remains disabled.


## 2026-11-26 — Owner directive: permanent, universally applied MESSINHO knowledge

- Owner requires that knowledge MESSINHO has lawfully acquired and sufficiently verified must remain durably available and must not be lost through session expiry, cache eviction, chat closure, or ordinary model/provider changes.
- This is a platform-wide requirement, not only a medical feature. It applies to mathematics, biology, physics, statistics, sports science, medicine, football/scouting, computing and every other supported domain and capability.
- MESSINHO must automatically retrieve and apply relevant retained knowledge in every normal conversation and agent plan; analyze, assess, calculate, explain clearly and create evidence-based forecasts where appropriate. Users must not manually activate separate knowledge functions.
- Retained knowledge must be persistent, versioned, source-attributed and rights-aware. Store provenance, license/permission status, source version/date, confidence, scope, validity/review dates, and links between supporting and contradicting evidence.
- Do not silently overwrite conflicting or corrected knowledge. Preserve historical versions and audit events; mark time-sensitive facts as stale rather than pretending they remain current. Keep private/user-specific memory separate from shared general knowledge.
- "Never lose" is a reliability objective, not an absolute technical guarantee. Implement encrypted backups, integrity checks, stable IDs, regular tested restores, documented RPO/RTO, export/migration capability, deletion protection and recovery from accidental changes. Legal takedown, privacy and retention obligations override unconditional retention; rights-ineligible content must be blocked/removed as required.
- Knowledge storage is distinct from conversation context, cache, search index and model weights. Mentioning something in a chat or training a model does not constitute reliable persistent storage. Use a controlled canonical knowledge store; use models as reasoning interfaces, not as the sole repository.
- Forecasts must expose assumptions, data quality, uncertainty, ranges/scenarios and limitations. Mathematical outputs should use validated deterministic calculations; physics should state units/model assumptions; biology/medicine should distinguish mechanism, evidence and correlation/causation. Do not present probabilistic forecasts as certainties.
- New detailed architecture and storage safeguards are specified in `docs/MESSINHO_FREE_LEGAL_MEDICAL_KNOWLEDGE_PLAN.md`.
- No implementation, database migration, backup configuration or deployment has been performed by recording this decision. Next work: inspect existing knowledge memory, database backup capabilities, permissions and agent routing; design a compact persistent cross-domain knowledge layer that reuses current infrastructure and has no unapproved paid services. Then implement incrementally in STAGING with tests and restore verification.
- Operating boundary unchanged: feature/messinho-unified-ai-integration and dedicated STAGING only; production/main, PFMS/PFSS and PR #47 merge state untouched; Render auto-deploy disabled.


## 2026-11-26 — Owner directive: risk management, banking and stock-market intelligence

- Add risk management and the operating principles of banks, exchanges and financial markets as first-class domains in MESSINHO's permanent cross-domain knowledge architecture.
- Coverage includes enterprise/operational risk, credit and counterparty risk, liquidity/funding risk, market and interest-rate risk, concentration risk, risk appetite/tolerance, controls, residual risk, early-warning indicators and stress testing.
- Banking knowledge includes commercial/central-bank roles, deposits and lending, maturity transformation, net interest margin, credit assessment, collateral, capital/liquidity requirements and payment systems.
- Exchange/market knowledge includes order books, order types, bid/ask and spreads, liquidity, volatility, price discovery, market makers, auctions, indices, trading halts and primary/secondary markets.
- Quantitative methods include time series, return/risk, volatility, correlation/covariance, regression, sensitivity/scenario analysis, Monte Carlo, drawdown, VaR and Expected Shortfall, plus PD/LGD/EAD credit-risk concepts.
- MESSINHO must analyze data quality and horizon, identify exposures/dependencies/concentrations, produce base/upside/downside/stress scenarios, disclose assumptions and uncertainty, backtest where possible, avoid overfitting and explain limitations in plain language.
- Never invent real-time prices, order-book data, bank data or macroeconomic observations. Dynamic market information requires fresh timestamped sources/data; no paid market-data feed or service without explicit cost approval.
- Correlation is not causation; past performance is not a guarantee. VaR is not a worst-case loss and should be complemented by stress analysis/Expected Shortfall. Forecasts are probabilistic ranges/scenarios, not certainties.
- Keep general financial education/analysis distinct from individualized investment advice, credit decisions or regulated financial services. No trade execution or financial account side effects without separate explicit authorization and legal/security review.
- Detailed requirements added to `docs/MESSINHO_FREE_LEGAL_MEDICAL_KNOWLEDGE_PLAN.md`. This is a knowledge-domain and architecture decision only; no financial data feed, paid service, trading integration, code, database migration or deployment was added.
- Continue on feature/messinho-unified-ai-integration and dedicated STAGING only. Production/main, PFMS/PFSS and PR #47 merge state untouched; Render auto-deploy disabled.


## 2026-11-26 — Umsetzungsschritt 1: persistenter domänenübergreifender Wissenskern

- Neue Datei `backend/messinho-domain-knowledge.js`: Domänenklassifizierung und kompakter persistenter Wissensspeicher für Mathematik, Physik, Biologie, Medizin, Risikomanagement, Banken, Finanzmärkte, Statistik, Sportwissenschaft, Fußball, Informatik und allgemeines Wissen.
- Dauerhafte Aufnahme ist fail-closed und nur bei explizit verifiziertem Wiederverwendungsrecht zulässig: Lizenz, Rechteinhaber, HTTPS-Rechtebeleg, AI/TDM, kommerzielle Nutzung und Bearbeitungsrecht müssen dokumentiert sein. Unbekannte Lizenz bedeutet Quarantäne/keine Aufnahme. Quellen-Volltexte/PDFs werden nicht gespeichert.
- Recherche normalisiert bereitgestellte Rechte-Metadaten; der normale Suchanbieter liefert diese nicht automatisch. Daher ist die dauerhafte Aufnahme im Regelfall noch gesperrt, bis der Quellen-/Rechtekatalog die Angaben verlässlich bestätigt. Keine Lizenz wird erfunden.
- Der bestehende MESSINHO-Chat ruft passende Wissenseinträge automatisch ab und verwendet sie bei einem Treffer; vorhandene 14-Tage-Owner-Memory bleibt getrennt davon bestehen.
- Supabase STAGING Migration `20261126230000_messinho_domain_knowledge.sql` angewendet und verifiziert: Tabelle vorhanden, RLS aktiv, service_role SELECT true, authenticated SELECT false, gespeicherte Einträge derzeit 0.
- Tests/Build: **258 passed, 0 failed**; Backend-Syntax und Vite-Build erfolgreich.
- Render STAGING Deployment `dep-dc474gc9v7es73e2msdg` ist **live**, Commit `5db7f60006eda1c1c02e2254b4af22ae43aa73fc`, 2026-11-26 17:54:43 UTC.
- Geänderte Dateien: `backend/messinho-domain-knowledge.js`, `backend/messinho-general-research.js`, `backend/server.js`, `tests/messinho-domain-knowledge.test.js`, `supabase/migrations/20261126230000_messinho_domain_knowledge.sql`.
- Noch offen für das Gesamtziel: 100 Rechte-geprüfte Quellen, Backups/Restore-Tests, capability-weite automatische Wissensübergabe inkl. Mathematik/Physik/Finanzprognosen, Konflikt-/Versionsreview, Forecast Backtesting und authentifizierte End-to-End-Tests. Dieser Zwischenstand ist nicht mit vollständiger Fertigstellung gleichzusetzen.
- Staging-only bleibt verbindlich: Auto-Deploy off; Produktion/main, PFMS/PFSS unberührt; PR #47 Draft/offen/unmerged.


## 2026-11-26 — Umsetzungsschritt 2: Wissensübergabe an den Agent Core und Capability Runtime

- Im automatischen Chat-Agenten wird vor dem Task-Start passendes, dauerhaft gespeichertes Domänenwissen aus Supabase abgerufen und in den Task-Kontext aufgenommen.
- Der Task-Kontext wird mit dem bestehenden Task-Checkpoint gespeichert; fortgesetzte Aufgaben erhalten denselben Wissenskontext, soweit dieser im Checkpoint enthalten ist.
- Die Capability Runtime übernimmt rechtlich verifizierte Einträge nur bei thematischer Relevanz und gibt sie als strukturierten Referenzkontext an passende Ergebnis-/Erklärungsobjekte weiter.
- Strikte Isolation: Medizinisches Wissen wird nicht in Spieler-Scores oder Modellgewichte eingespeist. Medizinische Inhalte sind nur erklärender Referenzkontext für einschlägige Fragestellungen; keine Diagnose oder Return-to-Play-Freigabe.
- Scoring-/Lernfunktionen erhalten keinen Domänenwissens-Override. Es gibt keine automatische Änderung von Spielerbewertungen, Modellgewichten oder Trainingsdaten durch Fachtexte.
- Neue Tests prüfen: Wissen wird bei relevanten Erklärungsfunktionen als Kontext übergeben; medizinisches Wissen beeinflusst keinen Talent-Score; nicht verifizierte Datensätze werden verworfen.
- Render Build: **260 Tests bestanden, 0 fehlgeschlagen**, Backend-Syntax- und Vite-Build erfolgreich. Deployment-ID `dep-dc4772u1egvs73fhsntg` wurde für STAGING gestartet; zum Zeitpunkt dieses Checkpoints war der Deploystatus noch `update_in_progress`, daher nicht als live deklarieren.
- WICHTIG: Diese Integration macht MESSINHO bereit, rechtlich verifizierte Wissenseinträge automatisch in passenden Agent-Aufgaben zu verwenden. Tatsächlicher Quellenimport ist noch NICHT freigegeben: die Wissensdatenbank hat 0 Einträge und es existiert noch kein abgeschlossener Katalog mit 100 einzeln geprüften Fachwerken. Erst nach Rechteprüfung und Einspielung kann der praktische Wissensbetrieb beginnen.
- Weiterhin STAGING-only; Auto-Deploy off; Produktion/main, PFMS/PFSS unberührt; PR #47 Draft/offen/unmerged.


## 2026-11-26 — Umsetzungsschritt 3: Rechte-Allowlist und ehrliche Handler-Klassifizierung

- Neue zentrale Rechte-Allowlist in `backend/messinho-rights-registry.js`. Sie ist absichtlich leer, bis einzelne Werke unabhängig geprüft und freigegeben wurden.
- Der Wissensspeicher akzeptiert Rechteangaben nicht mehr allein aufgrund von Feldern, die ein Rechercheanbieter oder Aufrufer mitsendet. Für eine dauerhafte Aufnahme muss eine passende `source_id` in der intern geprüften Allowlist existieren und Lizenz, Rechteinhaber, Beleg-URL sowie AI/TDM-, kommerzielle und Bearbeitungsrechte exakt übereinstimmen.
- Jede Quellenreferenz muss dieselbe registrierte `source_id` tragen. Unbekannte/ungeprüfte Quellen werden fail-closed abgewiesen.
- Capability-Runtime: Die bisherige Liste markierte pauschal alle 100 IDs als `specialist_logic`, obwohl sechs Fähigkeiten keinen eigenen expliziten Fachzweig besitzen. Die Kennzeichnung wurde anhand tatsächlich vorhandener Handler-Zweige korrigiert. Als generische Fallbacks ausgewiesen: `supervised_learning`, `weight_optimization`, `country_learning`, `talent_pathway_learning`, `breakthrough_learning`, `controlled_self_optimization`.
- `completion_verified_count` bleibt bewusst 0; Dispatch-/Handler-Präsenz ist noch kein End-to-End-Nachweis.
- Diese Änderung ist noch nicht deployed; Tests und Build müssen vor einem manuellen STAGING-Deploy erfolgreich sein.
- Rechtekatalog enthält weiterhin 0 freigegebene Werke. Die 100er-Zielzahl wird nicht künstlich mit ungeprüften Titeln aufgefüllt.
- Grenzen unverändert: Feature-Branch und dediziertes STAGING; keine Produktion/main/PFMS/PFSS-Änderungen; PR #47 Draft/offen/unmerged; Render Auto-Deploy aus.


## 2026-11-26 — Umsetzungsschritt 3: Rechte-Allowlist und ehrliche Capability-Abdeckung — STAGING live

- Commit: `f7ed919c59e062c94283fcce7b11dd7392ea8453`.
- Render STAGING Deployment: `dep-dc47b54ipgvc73bu3pjg`, Status **live**, abgeschlossen `2026-11-26T18:08:55.255865Z`.
- Build-Verifikation: **261 Tests bestanden, 0 fehlgeschlagen**; Vite-Build erfolgreich (`built in 2.24s`); Render meldet `Build successful`.
- Neue Datei `backend/messinho-rights-registry.js`: unabhängige Rechte-Allowlist; aktuell bewusst 0 freigegebene Werke. Provider-/Aufruferfelder allein können kein dauerhaftes Speichern mehr autorisieren.
- `backend/messinho-domain-knowledge.js` verlangt jetzt eine intern registrierte `source_id`, exakte Rechteübereinstimmung und Quellenreferenzen derselben ID. Fehlende oder ungeprüfte Einträge werden abgewiesen.
- Capability Runtime korrigiert: 94/100 Einträge besitzen einen expliziten spezialisierten Handler-Zweig; 6 werden als generischer Fallback ausgewiesen: `supervised_learning`, `weight_optimization`, `country_learning`, `talent_pathway_learning`, `breakthrough_learning`, `controlled_self_optimization`. Alle 100 bleiben dispatch-registriert. E2E-verifizierte Fähigkeiten: weiterhin 0.
- Tests wurden angepasst, damit diese Unterschiede verbindlich und regressionssicher bleiben.
- Zwei Zwischen-Builds schlugen wegen veralteter Erwartungen in Tests fehl; die Fehler wurden analysiert und korrigiert. Der aktuelle Build ist erfolgreich und live.
- Kein Wissensimport: Supabase-Wissensbestand weiterhin 0 Einträge, Allowlist 0. Die eigentliche Wissensaufnahme ist noch nicht freigegeben.
- Grenzen eingehalten: nur `feature/messinho-unified-ai-integration` und dediziertes STAGING; Produktion/main, PFMS/PFSS nicht verändert; PR #47 bleibt Draft/offen/unmerged; Render Auto-Deploy aus.

### Nächste Schritte
1. Quellenkatalog werkweise aufbauen und Rechtebelege prüfen; erst verifizierte Einträge in die Allowlist aufnehmen.
2. Capability-Audit der 94 Spezialhandler: Fachlogik, reale Datenabhängigkeiten, Rollenrechte, Quellen-/Provider-Abhängigkeit, Fehlerfälle und echte automatische Chat-End-to-End-Ausführung nachweisen.
3. Sechs generische Fallbacks einzeln vervollständigen oder als bewusst nicht verfügbar belassen; keine falsche Fertigmeldung.
4. Danach Import-/Extraktionspipeline, Versions-/Konfliktmanagement und Backup/Restore-Tests aufbauen.

- Nachträgliche Härtung im selben Umsetzungsschritt: registrierte Rechte werden zusätzlich an erlaubte HTTPS-Quell-URL-Präfixe gebunden. Eine registrierte Lizenz-ID kann damit nicht für beliebige fremde URLs wiederverwendet werden. Diese URL-Scope-Prüfung ist ebenfalls fail-closed; mangels freigegebener Werke bleibt der Allowlist-Zähler 0.


## 2026-11-26 — Umsetzungsschritt 3a: Rechteprüfung auf Quellen-URL-Bereich begrenzt — STAGING live

- Rechte-Allowlist wurde zusätzlich um erlaubte HTTPS-URL-Präfixe erweitert. Ein Eintrag kann nicht mehr für beliebige externe URLs missbraucht werden; jede gespeicherte Quellenreferenz muss zur registrierten `source_id` und zum erlaubten URL-Bereich gehören.
- Neuer Regressionstest für URL-Scope: unbekannte Quelle und nicht-HTTPS-URL werden abgewiesen.
- Render STAGING Deployment: `dep-dc47bte7bikc738cd860`, Status **live**, Commit `c25c73f778bf7d4dcb8b5c782fa054ade93f8529`, abgeschlossen `2026-11-26T18:10:31.871497Z`.
- Build: **262 Tests bestanden, 0 fehlgeschlagen**; Vite-Build erfolgreich (`built in 2.38s`); Render meldet `Build successful`.
- Weiterhin keine Quellen freigegeben und keine Wissenseinträge importiert. Rechte-Allowlist: 0. Wissensbestand: 0.
- Alle Betriebsgrenzen eingehalten: nur STAGING und Feature-Branch; Produktion/main/PFMS/PFSS unberührt; PR #47 unverändert; Auto-Deploy aus.


## 2026-11-26 — Umsetzungsschritt 3b: sechs vorhandene Lernhandler korrekt als Speziallogik klassifiziert

- **Ausgangsbefund:** Die Runtime-Klassifizierung wies sechs Fähigkeiten weiterhin als generische Fallbacks aus, obwohl `learningHandler()` bereits konkrete, datenabhängige Fachlogik für alle sechs enthält. Die Klassifizierung und die dazugehörigen Tests waren damit veraltet.
- **Betroffene Fähigkeiten:** `supervised_learning`, `weight_optimization`, `country_learning`, `talent_pathway_learning`, `breakthrough_learning`, `controlled_self_optimization`.
- **Korrektur:** Die sechs IDs wurden in `specialistCapabilityIds` aufgenommen. Es wurde keine zweite oder parallele Lernimplementierung angelegt; die bereits vorhandenen Handler werden weiterverwendet.
- **Verhalten/Sicherheitsgrenzen:** Supervised Learning, Weight Optimization und Controlled Self Optimization erzeugen ausschließlich datenbasierte Vorschläge aus verifizierten Outcomes. Sie trainieren nicht automatisch und verändern keine aktiven Modellgewichte; Aktivierung bleibt admin-freigabepflichtig. Country Learning vergleicht verifizierte Outcomes nach Ländern. Talent Pathway und Breakthrough werten verifizierte longitudinale Entwicklungsverläufe aus.
- **Geänderte Dateien:** `backend/messinho-capability-runtime.js`, `tests/messinho-capability-runtime.test.js`, `tests/messinho-orchestrator.test.js`.
- **Commits:** Runtime-Klassifizierung `06379b1dd7d507e3dccaeec58401a60e5cc1cb73`; Laufzeittests `0a3d6a368db6cf503a7105244f2ce1f1c00b7da1`; Orchestrator-Regressionstests `b10c14d228432d8d14d9d7c49bab595cdf6f3ea0`.
- **Erwarteter Coverage-Stand nach Korrektur:** 100/100 dispatch-registriert, 100/100 mit Speziallogik klassifiziert, 0 generische Fallbacks. `completion_verified_count` bleibt unverändert 0; das ist keine Ende-zu-Ende-Fertigmeldung.
- **Tests:** Neue Regressionstests prüfen alle sechs bestehenden Fachpfade mit verifizierten Testeingaben und die Nicht-Mutation aktiver Modellgewichte. Die vollständige Node-Suite wurde über diesen GitHub-Connector noch nicht ausgeführt/verifiziert; CI-Status und Workflow-Runs für Commit `b10c14d` waren bei der Prüfung leer. Daher noch keine Test-Erfolgsmeldung.
- **Daten/Schema:** Keine Migration, keine Supabase-Abfrage oder -Änderung, keine Änderung an Nutzer-, Spieler-, Scout-, Wissens- oder Lerndaten.
- **Deployment:** Kein Render-Deploy ausgelöst. Staging-Bereitstellung muss nach erfolgreicher CI und nach expliziter Auswahl des Render-Workspaces geprüft werden. Produktion/`main`, PFMS/PFSS und PR-Merge blieben unangetastet.
- **Nächste Schritte:** (1) CI für den aktuellen Branch-HEAD nachweisen und Fehler beheben; (2) dedizierten STAGING-Workspace/Service verifizieren und erst nach Freigabe gezielt deployen; (3) 94 bisherige Handler fachlich und datenbezogen auditieren, ohne 100/100 End-to-End zu behaupten; (4) 100 Quellen einzeln auf Werk-, Lizenz-, AI/TDM-, kommerzielle und Bearbeitungsrechte prüfen; nur tatsächlich belegte Werke in die Allowlist aufnehmen; (5) danach Import-/Extraktions-, Versions-/Konflikt- und Backup/Restore-Tests durchführen.



## 2026-11-26 — Umsetzungsschritt 3c: Katalogstatus korrigiert und Quellenregister begonnen

### Capability-Katalog
- Zusätzlicher Auditbefund: 16 Fähigkeiten hatten in `backend/messinho-capabilities.js` den Status `requires_new_integration`, obwohl die Runtime bereits explizite Fachhandler dafür besitzt.
- Diese 16 Einträge wurden in `PARTIAL_IMPLEMENTATIONS` aufgenommen. Sie gelten damit nicht als neu zu implementierende Funktionen, bleiben aber bis zu Datenvertrags- und Ende-zu-Ende-Nachweisen ausdrücklich teilweise/offen.
- Betroffene IDs: `game_intelligence_analysis`, `running_performance_analysis`, `creativity_analysis`, `decision_quality_analysis`, `availability_history_analysis`, `video_event_analysis`, `mental_score`, `coach_fit_score`, `market_value_assessment`, `value_for_money`, `development_projection`, `transfer_priority`, `country_learning`, `availability_outcome_learning`, `video_source_research`, `new_talent_monitoring`.
- Erwartete Katalogzählung nach Korrektur: 100 Einträge; 27 `implemented_existing_core`; 73 `partial_or_requires_validation`; 0 `requires_new_integration`. Die 27 sind keine Behauptung einer vollständigen Ende-zu-Ende-Verifikation; der Runtime-Abschlusszähler bleibt 0.
- Commit Katalogkorrektur: `9774f8121606e41dd7debd7b9154b09f4e839b72`.
- Commit Katalog-Regressionstest: `2b4124ecc5f98ca7bb36e1f48f72459355704bb7`.

### Quellenrechte
- Neues Dokument `docs/MESSINHO_CROSS_DOMAIN_SOURCE_REGISTER.md` angelegt.
- Es enthält fünf initiale Kandidaten/Quellenressourcen aus Risikomanagement, Finanzbildung und Wissenschaftsrecherche. Das PMC-OA-Element ist ausdrücklich nur ein Discovery-Pool, kein einzelnes Werk.
- Alle Einträge bleiben `quarantined` bzw. `discovery_only`, weil insbesondere die internationale kommerzielle AI/TDM-/Bearbeitungsrechtslage und Drittmaterial pro Werk noch geprüft werden muss.
- Freigegebene Werke: 0. Die Allowlist bleibt absichtlich leer; es wurden keine Bücher/PDFs/Volltexte heruntergeladen oder dauerhaft gespeichert.
- Dokument-Commit: `8e849760b0e73dabbfa76a1e38abc2d53f1fd7cb`.

### Gesamtstatus / Verifikation
- Codeklassifizierung: 100/100 Speziallogik, 0 generische Fallbacks; Katalogstatus: 27 bestehende Kernimplementierungen und 73 teilweise/Validierung ausstehend; E2E-Abschlussnachweise: 0.
- Tests wurden ergänzt, aber ein vollständiger CI-Lauf ist über die aktuell verfügbaren GitHub-Status-/Workflow-Abfragen noch nicht nachgewiesen. Leere Statuslisten sind kein erfolgreicher CI-Nachweis.
- Keine Supabase-Migration, keine Datenbankabfrage/-änderung, keine Änderung an Nutzerdaten, Spielerakten, Scoutdaten, Wissensbestand oder Modellgewichten.
- Kein Render-Deploy; PR #47 bleibt Draft/offen/unmerged. Produktion/`main`, PFMS/PFSS bleiben unangetastet.
- Nächste Schritte: CI-Ausführung nachweisen; danach den dedizierten Render-STAGING-Service und Supabase-STAGING-Zugang verifizieren; dann die 100 individuellen Quellenrechte und die 100 Handlerverträge/E2E-Nachweise systematisch vervollständigen.



## 2026-11-26 — MESSINHO hierarchical knowledge foundation (STAGING)

**Owner correction and fixed requirement:** The knowledge foundation was already an agreed project task. Do not restart with generic proposals. MESSINHO must first have reliable fundamentals across the agreed domains, then build intermediate, advanced and specialist knowledge on top of those prerequisites. New learning must be retained, cross-linked and reused automatically. No complete books/PDFs/full-text archives; compact, independently worded facts and concepts only. Sources must be free and legally reusable for AI/TDM, adaptation and commercial use; public readability alone is insufficient.

### Baseline audit
- Existing backend already had a flat canonical table/module (messinho_domain_knowledge), an owner-scoped answer cache (messinho_knowledge_memory), and a separate source-rights allowlist.
- These are different responsibilities. The answer cache is not a structured knowledge base and is not neural model training.
- STAGING table counts before this change: messinho_domain_knowledge = 0; messinho_knowledge_memory = 0.
- backend/messinho-rights-registry.js has 0 approved source entries. At the initial knowledge-foundation baseline the source register had 5 candidate/source-pool entries; it has since been expanded to 14 entries/resources (including OpenIntro Statistics, the Grinstead/Snell GNU FDL probability text, four exact OpenStax CC BY 4.0 works, and explicit OpenStax-default/Book of Proof/MIT OCW exclusions), with 0 approved works.
- No books, PDFs, source full texts or knowledge records were imported. No model weights, player data or scoring rules were changed.

### Implemented on feature/messinho-unified-ai-integration
- Added STAGING migration source supabase/migrations/20261126182955_messinho_knowledge_hierarchy.sql and applied it to STAGING Supabase project nwqwnrhupbyhshsprxjt (recorded migration version 20261126182955, name messinho_knowledge_hierarchy).
- Added 20261126183401_messinho_knowledge_version_append_only.sql and 20261126183459_messinho_knowledge_version_fk_index.sql. Verified privileges: service_role has SELECT/INSERT/UPDATE on concepts and links, SELECT/INSERT only on versions; no DELETE/TRUNCATE rights remain for the permanent knowledge graph.
- Added 20261126183831_messinho_knowledge_review_governance.sql (atomic candidate creation and approved-admin review RPCs), 20261126183838_messinho_knowledge_conflict_review.sql (conflict evidence queue), 20261126183939_messinho_knowledge_review_history_append_only.sql, and 20261126184132_messinho_knowledge_review_fk_indexes.sql. The review ledger is service_role SELECT/INSERT only; conflicts are service_role SELECT/INSERT/UPDATE with DELETE/TRUNCATE revoked. Added 20261126184217_messinho_knowledge_conflict_atomic_quarantine.sql: a conflicting proposal is retained and the currently active concept is atomically quarantined as conflicting with a new immutable version snapshot.
- New tables:
  - messinho_knowledge_concepts: domain/topic/title/definition, four learning levels, concept type, parent/prerequisites, formulas and variables, applicability, limitations, claims, source rights, evidence grade, confidence, candidate/active/conflict/stale/superseded status, version and review dates.
  - messinho_knowledge_links: prerequisite, related, extends, contradicts, applies_to and derived_from relations.
  - messinho_knowledge_versions: append-only version snapshots with reason and actor.
- All three tables have RLS enabled, no browser roles/policies/grants, and service_role-only backend access. STAGING catalog verification confirmed all three tables and RLS; policy_count is 0 by design because browser access is revoked.
- Added backend/messinho-knowledge-graph.js. It validates level/type, requires a parent or prerequisites for non-foundational concepts, verifies each source against the independently reviewed rights allowlist, requires at least two independent source domains and corroborated claims, stores compact concept candidates, records an initial version snapshot, refuses silent overwrites and retrieves only active concepts.
- Updated backend/messinho-general-research.js and backend/messinho-rights-registry.js: external provider license flags are ignored; source rights are attached only from the reviewed allowlist, and HTTPS source URL matching enforces exact origin/path boundaries.
- Connected foundation-style research questions to canonical concept-candidate creation. Only corroborated claims with at least two independent, rights-verified source domains can be persisted; higher-level knowledge waits for prerequisite concepts. With the current allowlist empty, persistence correctly fails closed.
- Added regression tests for provider-rights spoofing, exact URL scope, unreviewed source resolution and graph-backed capability explanations.
- Integrated graph retrieval into POST /api/agent/chat. Retrieved approved concepts are passed to the existing scouting agent input and conversational reasoning context; general questions can use the graph before the older flat knowledge and answer-cache paths.
- Updated backend/messinho-capability-runtime.js to combine active graph concepts with legacy rights-verified knowledge for relevant capability explanations. Scoring/model-weight functions remain isolated from reference knowledge so it cannot silently change numerical ratings or weights.
- Added tests/messinho-knowledge-graph.test.js for learning-level/link contracts, rights refusal, prerequisite validation and fail-closed persistence/retrieval.
- Candidate creation uses the atomic service_role-only RPC so the concept and its first immutable version snapshot are committed together. The approved-admin review RPC records each decision and increments the version. The admin review queue rechecks current source rights, independent source domains and active prerequisites before approval.
- Competing proposals are retained in messinho_knowledge_conflicts for explicit review; no existing concept is silently overwritten. The review ledger is append-only. When a conflict is detected against an active concept, a transaction marks it conflicting and records the new version before it can be retrieved again.
- Added docs/MESSINHO_KNOWLEDGE_FOUNDATION.md with the agreed domain coverage map and data/learning/governance design.

### Domain coverage map
Mathematics; statistics; physics; biology; medicine; sports science; football; computer science/AI; risk management; banking; financial markets; general cross-domain reasoning. Every domain follows foundational → intermediate → advanced → specialist, with explicit prerequisites and cross-domain links. The detailed curriculum map is in docs/MESSINHO_KNOWLEDGE_FOUNDATION.md.



### Verification / release status
- STAGING migration applied; table existence and RLS state verified by read-only SQL.
- GitHub Actions for commit 4593897290a90f0f184127a464549393ac1888ad: Node tests success and backend syntax success. Render build repeated the suite: 274 passed, 0 failed, followed by a successful Vite production build.
- Dedicated Render STAGING deploy dep-dc47rt3en89c73feh6s0 is live on commit 4593897290a90f0f184127a464549393ac1888ad. Service URL: https://myscoutingdatabase-messinho-staging.onrender.com. Startup logs confirm the API is listening and the Supabase Data API returned HTTP 200. Auto-deploy remains disabled.
- Authenticated chat E2E with the owner's existing STAGING session remains outstanding.
- Production main, production Render, production Supabase, PFMS/PFSS and PR merge state remain untouched. PR #47 remains Draft/open/unmerged.

### Remaining steps
1. Finish CI for the latest feature commit and correct any failures.
2. Finish authenticated STAGING tests for the admin review queue and candidate approval API; add explicit resolution actions for retained conflicts.
3. Review individual candidate works across all domains and Germany-based commercial AI/TDM rights. Keep the allowlist empty until work-level rights are proven.
4. Populate the foundational curriculum first, then intermediate/advanced/specialist concepts with sources, formulas, limitations and prerequisites.
5. Verify retrieval through the authenticated chat and real scouting capability execution on STAGING.
6. STAGING is deployed on the verified feature commit. Do not promote production or merge PR #47 without explicit authorization.


## 2026-11-26 — Knowledge ingestion transaction, admin review and conflict queue

### Implemented on STAGING feature branch
- Candidate creation now uses the database transaction `messinho_create_knowledge_candidate`; concept and initial version snapshot commit together or roll back together. The earlier client-side insert/delete compensation was removed because the knowledge graph is deliberately append-only and backend delete privileges are revoked.
- Added shared backend validator `reviewMessinhoKnowledgeConcept`. Admin approval rechecks:
  - authenticated approved admin identity;
  - rights allowlist membership and exact HTTPS source URL scope;
  - at least two independent source domains;
  - corroborated claims;
  - active parent/prerequisite concepts;
  - absence of unresolved open conflicts.
- Admin review route `POST /api/messinho/knowledge/:id/review` calls that shared validator and the atomic database review function. Approval, rejection or conflict marking updates the concept, appends a version snapshot and writes an audit record in one transaction.
- Competing proposals are saved in `messinho_knowledge_conflicts` with compact proposed concept, evidence, and conflict reason; the existing concept is not silently overwritten.
- Admin-only conflict queue and resolution endpoints added:
  - `GET /api/messinho/knowledge-conflicts`
  - `POST /api/messinho/knowledge-conflicts/:id/review`
  - Decisions: reject the proposed alternative or explicitly keep the existing knowledge. Neither path silently changes the existing concept.
- The review ledger `messinho_knowledge_reviews` and version ledger are append-only for service_role. Conflict table permits only SELECT/INSERT/UPDATE for service_role; browser roles have no grants.
- Regression test added for fail-closed admin-review wrapper behavior.
- Updated source register: OpenIntro Statistics is a quarantined CC BY-SA 3.0 candidate (commercial use permitted subject to attribution/share-alike and file-level exceptions); OpenStax's current CC BY-NC-SA default is excluded for commercial use without written permission. U.S. government/NIST candidates remain quarantined pending international rights and third-party content review.
- No source has been added to the allowlist. Allowlist remains 0. No knowledge concept, conflict or review rows were seeded.

### STAGING database verification
- Confirmed `messinho_knowledge_reviews` and `messinho_knowledge_conflicts` exist and have RLS enabled, with zero browser policies (intentional because browser privileges are revoked).
- Verified service_role has INSERT/SELECT only on review ledger; conflicts have INSERT/SELECT/UPDATE and no DELETE/TRUNCATE.
- Verified both security-definer RPC functions exist: `messinho_create_knowledge_candidate`, `messinho_review_knowledge_concept`.
- Counts at verification: concepts 0, links 0, versions 0, conflicts 0, reviews 0.
- No user, player, scout or model-weight data changed.

### Verification and release boundary
- CI workflows are running for the latest feature branch changes; inspect the latest HEAD's Node test and backend syntax results before any deployment. A previous commit's success is not sufficient.
- Render STAGING auto-deploy remains disabled. No new Render deployment was triggered. The current deployed STAGING runtime is not yet proven to contain this knowledge foundation/review endpoint.
- Authenticated admin/scout E2E and conflict queue UI tests remain outstanding.
- Production `main`, production Render, production Supabase, PFMS/PFSS and PR merge state remain untouched. PR #47 remains Draft/open/unmerged.


## 2026-11-26 — Atomic knowledge conflict quarantine and restoration

- Added STAGING migration `20261126184217_messinho_knowledge_conflict_atomic_quarantine.sql`: `messinho_record_knowledge_conflict` records the competing compact proposal and evidence in one transaction. If the existing concept was active, the same transaction moves it to `conflicting`, increments its version and appends a snapshot. Conflicting knowledge is therefore no longer served as active while a material contradiction is unresolved.
- Added STAGING migrations `20261126184436_messinho_knowledge_conflict_resolution.sql` and `20261126184446_messinho_knowledge_conflict_resolution_status_fix.sql`. The conflict record stores the prior concept state. Admin resolution uses `messinho_resolve_knowledge_conflict`; it records reviewer, decision and reason, and restores the prior active/candidate state only after all open conflicts for that concept have been closed. Restoration creates a new immutable version snapshot. A rejected proposal never overwrites the existing definition.
- Updated the conflict-review API to call the atomic RPC rather than directly updating the conflict table.
- Verified in STAGING: prior-state column exists; both conflict RPCs are SECURITY DEFINER and executable only by service_role (plus postgres owner); conflict/review tables retain RLS with no browser policies. No conflict or concept rows were inserted for testing.
- Current knowledge counts remain concepts 0, links 0, versions 0, conflicts 0, reviews 0. Rights allowlist remains empty.
- Latest feature branch HEAD 188a89c98b132de02294e17ae015e34fdf6db191 has successful Node test and backend syntax checks. Its only changes after the deployed code commit are source-register/checkpoint documentation updates.
- Render dedicated STAGING deployment dep-dc47t5vvdc3s73be8km0 is **live** on commit 8e06b553d34b51ca324db8bdd4d85b7f60611d5f. This commit includes the conflict-restoration code and migrations. Render build repeated the suite: 274 passed, 0 failed, then Vite production build succeeded. Startup logs confirm the API is listening and Supabase Data API returned HTTP 200.
- Authenticated admin/scout E2E remains outstanding; build, startup and Supabase connectivity do not prove the protected review/approval routes or actual chat retrieval with a logged-in user.
- No production/main, production Supabase, PFMS/PFSS or PR merge changes. PR #47 remains Draft/open/unmerged.


### Additional source screening
- Added the Dartmouth/CHANCE GNU FDL version of Grinstead and Snell's *Introduction to Probability* as a quarantined probability/statistics candidate. The official source states it is freely redistributable under GNU FDL; GNU FDL 1.3 explicitly permits commercial redistribution and modification but applies copyleft to modified versions. It is not approved for ingestion yet: legal review must determine how the terms apply to compact knowledge records and retain the exact version/licence notice.
- Added explicit exclusions for Richard Hammack's *Book of Proof* (CC BY-NC-ND) and MIT OCW 6.042J (CC BY-NC-SA) because their current terms are incompatible with commercial derivative use.
- Source register now has 14 entries/resources, 0 approved works; allowlist remains 0.


### OpenStax work-level licence exception review
- The OpenStax library-wide current default is CC BY-NC-SA 4.0 and is not suitable for the commercial platform without written permission.
- Exact official PDFs for *College Algebra 2e* (2021), *Introductory Statistics 2e* (2023), *University Physics Volume 1* (2021 PDF) and *Introductory Business Statistics 2e* state CC BY 4.0. These specific works have therefore been added as quarantined candidates, not approved works.
- CC BY 4.0 permits commercial adaptation with attribution, but third-party content, required attribution/change notices and the intended AI/TDM processing must still be checked for each work. No source allowlist entries have been added.
- Source register now contains 14 entries/resources; 0 approved works.


## 2026-11-26 — Conflict-episode restoration hardening and source-rights audit

### Conflict lifecycle correction
- Code review found a multi-conflict edge case: if a second competing proposal arrived while a concept was already quarantined as `conflicting`, the second record could incorrectly save `conflicting` as the prior state. Closing the final conflict could then fail to restore the original `active` or `candidate` state.
- Added migration source `supabase/migrations/20261126184821_messinho_knowledge_conflict_episode_state.sql` and applied it to STAGING (migration version `20261126184821`, name `messinho_knowledge_conflict_episode_state`).
- The conflict RPC now carries forward the original pre-conflict state from the earliest still-open conflict in the same episode. It still locks the concept row, stores the competing proposal atomically and quarantines active knowledge until every open conflict is resolved.
- Ran a STAGING SQL integration test inside a transaction and rolled it back: two simultaneous conflicts against an active concept both retained `previous_concept_status='active'`; resolving the first left the concept `conflicting`; resolving the final conflict restored `active`. No test records remained after rollback.
- Post-test counts: concepts 0, conflicts 0, versions 0, reviews 0. Migration source filename now matches the applied STAGING migration version.

### Rights research — source register
- The source register now contains **16** individually described candidate works/resources; approved works remain **0** and the permanent rights allowlist remains **0**.
- PLOS provides an unusually explicit TDM policy: its articles may be mined, reused and shared by anyone, anywhere, for any purpose. PLOS articles normally use CC BY or a comparable permissive licence. PLOS is recorded only as a discovery pool; every article still needs its own exact licence, rights-holder, third-party figure/supplement, DOI and correction/retraction checks. No bulk corpus download is permitted for this project.
- OpenStax *Statistics* (Illowsky & Dean, 2020) is a work-level exception with CC BY 4.0 text, but the exact preface explicitly prohibits LLM training or ingestion into generative-AI offerings without prior written permission. It remains quarantined; a Creative Commons badge alone is not enough.
- OpenIntro's CC BY-SA terms do not settle the separate current website automated AI/ML access clause. It remains quarantined pending legal review. The Dartmouth/CHANCE GNU FDL probability work remains quarantined pending copyleft/derivative-scope review.
- Four other exact OpenStax works (College Algebra 2e, Introductory Statistics 2e, University Physics Vol. 1, Introductory Business Statistics 2e) have exact CC BY 4.0 notices but remain quarantined until their AI/TDM processing and third-party material are individually cleared.
- No PDF, book, full text, OCR dump, article or bulk corpus was downloaded or stored. No source was added to the rights allowlist.

### STAGING security and verification
- Supabase security advisor findings: seven RLS-enabled MESSINHO/diagnostic tables intentionally have no browser policies because `anon`/`authenticated` grants are revoked; this is consistent with the server-only service-role access design.
- Advisor also reported an unrelated pre-existing `admin_set_scout_approval(uuid,boolean)` SECURITY DEFINER function callable by `authenticated`, and leaked-password protection disabled. These were recorded for a separate security review and were not changed as part of this knowledge task.
- Performance advisor reports unused indexes, including newly created knowledge indexes before any knowledge records exist; none were removed.
- Dedicated Render STAGING service remains `myscoutingdatabase-messinho-staging` (`srv-dc3chlqjnfac73acd6ig`), auto-deploy disabled. Latest confirmed live runtime at this checkpoint is deployment `dep-dc47t5vvdc3s73be8km0`, commit `8e06b553d34b51ca324db8bdd4d85b7f60611d5f`. Server startup and Supabase Data API HTTP 200 were confirmed. Subsequent commits in this checkpoint change documentation/migration source alignment only; latest feature-branch CI must be checked before any further deployment.
- Production `main`, production Render/Supabase, player/scout data, active model weights, PFMS/PFSS and PR merge state remain untouched. PR #47 remains Draft/open/unmerged.

### Next steps
1. Verify Node tests and backend syntax for the latest branch HEAD after the migration filename alignment and source register count correction.
2. Continue exact work-level legal review; do not enable the allowlist until the Germany-based commercial AI/TDM and adaptation rights are documented for each source.
3. Begin the foundational curriculum only after approved works are available; populate atomic concepts with independent corroboration, formulas, limitations, prerequisite links and version provenance.
4. Complete authenticated admin conflict-review and candidate-approval E2E tests, then authenticated chat retrieval and real scouting-capability tests on STAGING.
5. Keep model-weight changes, scoring changes and production promotion behind their existing explicit approval gates.


## 2026-11-26 — First work-level rights approvals and candidate intake

### Rights review
- Reviewed exact OpenStax work/edition notices and the CC BY 4.0 legal deed for four works:
  1. *College Algebra 2e* (2021)
  2. *Introductory Statistics 2e* (2023)
  3. *University Physics Volume 1* (2021 PDF edition)
  4. *Introductory Business Statistics 2e*
- Their exact official PDFs state CC BY 4.0. Creative Commons' official FAQ confirms that CC 4.0 licenses permit private text/data mining, including commercial purposes for non-NC works, subject to license terms. The CC BY 4.0 deed permits commercial adaptation with attribution and indication of changes.
- Added these four exact editions to `backend/messinho-rights-registry.js` with exact PDF/page URL scopes, Rice University as rights holder, CC BY 4.0 licence evidence, AI/TDM/commercial/derivative permissions and required attribution. The registry rejects lookalike hosts, non-HTTPS and URL paths outside the exact approved works.
- OpenStax's library-wide CC BY-NC-SA default remains excluded; only the four exact work-level CC BY 4.0 notices are approved. Third-party figures/images are not reused. The pipeline stores no PDFs or source full text.
- Other sources (OpenIntro CC BY-SA 3.0, Grinstead/Snell GNU FDL, NIST, etc.) remain quarantined pending further licence/compatibility review. The source register currently records 16 resources, of which 4 exact works are permitted.

### Knowledge candidate pipeline
- Updated `backend/messinho-knowledge-graph.js`: a compact candidate can now be stored from one exact rights-cleared source, with license URL, attribution, source edition, URL and change notice preserved.
- Candidates remain inactive and are not used as trusted knowledge. Activation still requires two independent rights-cleared source domains, corroborated claims, active prerequisite concepts, no open conflicts and explicit approved-admin review.
- Added regression tests for exact source URL scope, full rights tuple, single-source candidate provenance and the rule that one-source candidates cannot be promoted.
- No candidate was seeded during this code change; concepts, links, versions, conflicts and reviews remain at 0 until MESSINHO receives a matching foundational research question.

### Verification / deployment
- The rights and graph code changes are committed to the STAGING feature branch. Check CI on the latest HEAD before deployment.
- The currently live STAGING runtime predates these latest rights/candidate changes; manual STAGING deployment is still required after CI passes.
- Production `main`, production Render/Supabase, PFMS/PFSS and PR merge state remain untouched. PR #47 remains Draft/open/unmerged.


## 2026-11-26 — Correction: OpenStax rights retracted; allowlist returned to zero

### Rights correction
- A later audit of the exact OpenStax prefaces found that the earlier four-work approval was incorrect. A Creative Commons label alone did not establish permission for MESSINHO's AI ingestion.
- *College Algebra 2e*, *Introductory Statistics 2e* and *University Physics, Volume 1* state CC BY-NC-SA 4.0 and explicitly prohibit LLM training or ingestion into generative-AI offerings without prior written permission.
- *Introductory Business Statistics* states CC BY 4.0 for the text, but its exact preface separately prohibits LLM training or ingestion into generative-AI offerings without OpenStax permission. CC BY 4.0 does not override that additional restriction.
- Reverted all four OpenStax entries from `backend/messinho-rights-registry.js`. The permanent allowlist is again **0**. Regression tests now explicitly verify that a CC BY label cannot override an AI-ingestion restriction.
- Updated `docs/MESSINHO_CROSS_DOMAIN_SOURCE_REGISTER.md` with the exact preface URLs and corrected licence/AI notices. The register remains 16 works/resources, 0 approved.
- No OpenStax content was fetched into the product, no knowledge records were created, and no PDFs/full text were stored. No model weights, user/player/scout data or scoring rules changed.

### CI correction
- The temporary four-work allowlist commit failed CI: two tests exposed a stale graph expectation and a rights test that assumed a source was approved. The tests were updated to the current one-source quarantined-candidate rule and to require an empty allowlist.
- CI for the latest branch HEAD must be rechecked after the rights retraction and test corrections. No deployment of the temporary four-work allowlist was triggered; the currently deployed STAGING runtime remains the previously verified commit `8e06b553d34b51ca324db8bdd4d85b7f60611d5f`.
- The only acceptable next step for an OpenStax source is written permission explicitly covering commercial AI/TDM, ingestion into MESSINHO, and storage/use of compact derived knowledge records. Otherwise it remains excluded/quarantined.


---

## 2026-11-26 — Verbindlicher Projektcheckpoint: MESSINHO-Wissensgrundlage und nächste Umsetzung

> Dieser Abschnitt ist der aktuelle Übergabestand und hat bei abweichenden älteren Angaben Vorrang. Im nächsten Chat zuerst diesen Abschnitt und anschließend die jeweils genannten Quell-Dateien lesen. Keine bereits erledigte Arbeit wiederholen und nicht neu beginnen.

### 1. Verbindliche Arbeitsrichtlinien des Auftraggebers

- Ausschließlich das Projekt **myScoutingDatabase** und darin das KI-Modul **MESSINHO** bearbeiten. PFMS/PFSS sind ausdrücklich ausgeschlossen.
- Ausschließlich auf dem Feature-Branch `feature/messinho-unified-ai-integration` und dem dedizierten Render-STAGING arbeiten. **Keine Änderungen an `main`, Produktions-Render, Produktions-Supabase, produktiven Scout-/Spielerdaten oder aktiven Produktionsmodellen.**
- PR #47 bleibt Draft/offen und ungemergt. Keine Promotion oder Zusammenführung ohne ausdrückliche Freigabe.
- `PROJECTSCOUT.md` ist das verbindliche, fortlaufend zu pflegende Übergabe- und Projekttagebuch. Nach jedem abgeschlossenen sinnvollen Arbeitsschritt sowie vor Unterbrechungen Änderungen, Tests, Deployments, offene Punkte und den nächsten konkreten Schritt eintragen.
- Vor jeder Fortsetzung zuerst den aktuellen Branch-HEAD, dieses Dokument, CI, Render-STAGING und den betroffenen Code-/Migrationsstand prüfen. Nicht aus älteren Chat-Angaben auf den aktuellen Zustand schließen.
- Keine Behauptung „fertig“, „live“ oder „getestet“, wenn sie nicht durch aktuelle technische Nachweise gedeckt ist. Build/Serverstart ist kein Ersatz für authentifizierte End-to-End-Tests.
- MESSINHO soll eine eigenständige, dauerhaft lernende Wissens- und Scouting-Intelligenz sein. OpenAI darf höchstens ein optionaler Zwischendienst sein; der eigene Wissensspeicher, die Regeln, Retrieval- und Lernprozesse dürfen nicht davon abhängig sein.
- **Keine vollständigen Bücher, PDFs, Artikel, OCR-Dumps oder Bulk-Korpora speichern.** Nur kompaktes, eigenständig formuliertes, atomisiertes Wissen mit Herkunftsnachweis, Definition, Aussagen, Formeln, Grenzen und Beziehungen speichern. Speicher- und Kostenaufwand niedrig halten.
- Nur kostenlose und rechtlich tatsächlich zulässige Quellen verwenden. Öffentliche Abrufbarkeit oder ein CC-Badge allein sind keine ausreichende Rechteprüfung. Für jede Quelle müssen das konkrete Werk/die konkrete Ausgabe, Rechteinhaber, Lizenz, KI-/TDM-Nutzung, kommerzielle Nutzung, Bearbeitung/abgeleitete Zusammenfassungen, Quellenpfad, Attribution und Drittmaterial geprüft werden. Bei Unsicherheit bleibt die Quelle gesperrt.
- Wissen darf nicht verloren gehen: dauerhafte Speicherung, nachvollziehbare Versionen, Historie, Konfliktbehandlung, Sicherung und nachgewiesene Wiederherstellbarkeit sind Pflicht. Niemals still überschreiben.
- Neues Wissen muss auf vorhandenen Grundlagen aufbauen. Fachgebiete werden hierarchisch gegliedert: Grundlagen → Aufbauwissen → fortgeschrittenes Wissen → Spezialwissen. Konzepte, Regeln, Formeln, Methoden, Voraussetzungen und fachübergreifende Beziehungen werden miteinander verknüpft.
- MESSINHO soll Wissenslücken selbst erkennen, recherchieren, Quellen unabhängig prüfen, Aussagen abgleichen, Widersprüche erkennen, verständliche Erklärungen liefern, rechnen, bewerten und begründete Prognosen erstellen. Neue Kandidaten werden nicht automatisch als vertrauenswürdiges Wissen aktiviert.
- Neue Wissensinhalte dürfen nicht stillschweigend numerische Scouting-Ratings, Modellgewichte oder Produktionsentscheidungen verändern. Dafür gelten getrennte Prüf- und Freigabeschritte.

### 2. Bereits erledigt — Wissensarchitektur und Governance

- Hierarchisches Wissensgraph-Schema in STAGING angelegt: Konzepte, Beziehungen/Links, Versionshistorie, Konflikt- und Review-Datensätze.
- Zwölf Wissensbereiche sind im Projekt vorgesehen: Mathematik, Statistik/Wahrscheinlichkeit, Physik, Biologie, Medizin, Sportwissenschaft, Fußballwissenschaft/Scouting, Informatik/KI, Risikomanagement, Bankenwesen, Finanzmärkte/Börse sowie allgemeines/fachübergreifendes Wissen.
- Wissensstufen und Konzepttypen werden validiert; nicht-grundlegende Konzepte benötigen passende Voraussetzungen bzw. Elternkonzepte.
- Kompakte Konzepte enthalten u. a. Definition, Domain, Topic, Level, Typ, Claims, Quellen, Rechte, Konfidenz/Evidenz, Anwendbarkeit, Grenzen und ggf. Formeln.
- Retrieval verwendet aktive Konzepte; Kandidaten sind nicht automatisch für normale Wissensantworten freigegeben.
- Kandidat und erste unveränderbare Versionsaufnahme werden über eine transaktionale Datenbankfunktion atomar angelegt.
- Freigabe/Ablehnung/Konfliktentscheidung erfolgt über Admin-Prüfung. Authentifizierter, freigegebener Admin, Rechte, genaue Quellen-URLs, unabhängige Quellen-Domains, Claim-Korroboration, aktive Voraussetzungen und offene Konflikte werden erneut geprüft.
- Versions- und Review-Historie sind gegen Änderungen/Löschung durch den Backend-Service abgesichert; Browserrollen besitzen keine direkten Tabellenrechte bzw. keine Browser-RLS-Policies.
- Widersprüchliche Vorschläge werden als Konflikt mit Belegen archiviert. Aktives Wissen wird bei einem offenen Widerspruch atomar quarantänisiert. Mehrere Konflikte derselben Konfliktepisode bewahren den ursprünglichen Zustand. Erst nach Abschluss aller offenen Konflikte wird der vorherige aktive/Kandidatenzustand mit einer neuen Version wiederhergestellt.
- Admin-Routen für Kandidaten- und Konfliktprüfung sind implementiert. Die authentifizierten E2E-Tests dieser geschützten Abläufe stehen noch aus.
- Capability-Runtime wurde so erweitert, dass aktives Graphwissen als Erklärungs-/Referenzkontext für relevante Fähigkeiten verfügbar ist. Es darf nicht ungeprüft Ratings oder Modellgewichte verändern.
- Bestehende Antwort-/Frage-Erinnerung und der neue fachliche Wissensgraph sind unterschiedliche Speicherarten; nicht als Ersatz füreinander behandeln.

### 3. Quellenrechte — aktueller korrigierter Stand

- Die frühere vorläufige OpenStax-Freigabe wurde nach Prüfung der konkreten Vorworte zurückgenommen. Alle vier geprüften OpenStax-Werke bleiben ausgeschlossen/quarantänisiert, solange keine schriftliche Erlaubnis für KI-/LLM-Ingestion in das kommerzielle Produkt vorliegt. CC-Badge oder ältere PDF-Lizenzzeile hebt ausdrückliche AI-Ingestion-Beschränkungen nicht auf.
- OpenIntro, Dartmouth/Grinstead-Snell GNU FDL, NIST-Kandidaten und weitere Ressourcen bleiben entsprechend ihrer konkreten Rechte-/Copyleft-/Drittmaterialprüfung gesperrt oder in Quarantäne.
- Neu geprüft und in `backend/messinho-rights-registry.js` exakt zugelassen sind derzeit **zwei einzelne CC BY 4.0 Artikel**:
  1. PLOS ONE: Wiecha et al. (2023), VO₂max prediction models, DOI 10.1371/journal.pone.0280897.
  2. PMC/BioC: Cardiorespiratory-fitness-Arbeit (2022), Quelle PMC11269081.
- Die Freigabe ist werk- und URL-genau; es gibt keine pauschale Freigabe ganzer Portale. Drittmaterial, Attribution und Änderungen müssen beachtet werden. Der Abruf nutzt die zulässigen Artikel-/BioC-Wege. Kein Volltext/PDF wird in MESSINHO gespeichert.
- Das Quellenregister umfasst zuletzt 18 beschriebene Kandidaten/Werke/Ressourcen; davon sind 2 einzelne Artikel für die eng begrenzte Verarbeitung zugelassen. Die übrigen bleiben gesperrt/quarantänisiert. Der Rechtebestand ist vor jeder weiteren Freigabe erneut gegen die aktuelle Registry und die exakten Werkhinweise zu prüfen.

### 4. Neuester Lernschritt im Feature-Branch

- Neu hinzugefügt: `backend/messinho-approved-knowledge-learning.js`.
- Erste eng begrenzte Foundation-Lernstrecke: VO₂max / maximale Sauerstoffaufnahme / kardiorespiratorische Fitness.
- Bei passender Frage ruft der Ablauf die beiden exakt freigegebenen Quellen ab, prüft die unabhängige Korroboration und baut daraus ein kompaktes, eigenständig formuliertes Grundlagenkonzept.
- Das Konzept enthält Anwendungsbezug für Fußball-Scouting und klare Grenzen: Schätzwert ist keine direkte Spiroergometrie, Gleichungen unterscheiden sich nach Population/Test, VO₂max allein bildet Fußballleistung nicht ab und erlaubt keine medizinische Diagnose.
- Speicherung erfolgt nur als **inaktiver Kandidat**. Admin-Freigabe bleibt zwingend. Bei fehlenden Quellen oder nicht ausreichender Korroboration wird nicht gespeichert.
- Der neue Lernpfad ist ein erster begrenzter Prototyp für diesen Themenbereich, **noch kein vollständiger autonomer Importer für alle zwölf Wissensbereiche**.
- Im letzten dokumentierten Datenbankcheckpoint waren Konzepte, Links, Versionen, Konflikte und Reviews jeweils 0. Der neue Commit fügt nur den Lernpfad hinzu; es ist kein erfolgreicher Import eines Wissenskonzepts dokumentiert. Vor Aussagen über aktuelle Zeilenzahlen den STAGING-Status erneut nur lesend prüfen.

### 5. Aktueller GitHub-/CI-/Render-Stand

- Repository: `Dridi06/myScoutingDatabase`.
- Branch: `feature/messinho-unified-ai-integration`.
- Aktueller zuletzt gelesener Branch-HEAD: `a26f23dbbafba4a5f335827da606cfe35f3d37a7` — Commit „Add first corroborated sports-science foundation learning flow“.
- GitHub Checks für diesen HEAD: `backend-syntax` erfolgreich; `test` erfolgreich.
- PR #47: weiterhin offen, Draft, nicht gemergt.
- Render-STAGING: `myscoutingdatabase-messinho-staging`, Service-ID `srv-dc3chlqjnfac73acd6ig`, URL https://myscoutingdatabase-messinho-staging.onrender.com, Auto-Deploy deaktiviert.
- Zuletzt nachweislich live ist Deployment `dep-dc47t5vvdc3s73be8km0`, Commit `8e06b553d34b51ca324db8bdd4d85b7f60611d5f`. Dieses Deployment enthält noch **nicht** den neuesten VO₂max-Lernpfad-Commit `a26f23d...`.
- Für das ältere Live-Deployment wurden Render-Build mit 274 bestandenen Tests/0 Fehlern, Vite-Build, Serverstart und Supabase Data API HTTP 200 nachgewiesen. Das ist kein Nachweis, dass der neueste Branch-HEAD bereits live ist.
- Nächster Deploy darf erst nach erneuter HEAD-/CI-Prüfung erfolgen und ausschließlich auf den dedizierten STAGING-Service. Nach Deploy Live-Commit und Startlogs verifizieren.

### 6. Offene Aufgaben — verbindliche Reihenfolge

1. **Checkpoint und Status zuerst:** Branch-HEAD, CI, PR, STAGING-Deployment und aktuelle STAGING-Schemaversionen prüfen. Nicht mit dem alten Live-Commit verwechseln.
2. **Neuen Lernpfad testen:** Unit-/Integrationstests für VO₂max-Topic-Erkennung, Abruf beider Quellen, Ausfall eines Providers, fehlende Korroboration, falsche/abgelaufene Quelle, kompakte Ausgabe, Kandidatenstatus und keine automatische Aktivierung.
3. **STAGING deployen:** Nur wenn der aktuelle HEAD vollständig grün ist. Danach Render-Deployment muss exakt den geprüften Commit enthalten.
4. **Authentifizierte E2E-Tests:** Admin-Queue, Kandidatenfreigabe/-ablehnung, Konfliktentscheidung/Wiederherstellung und Rollenabgrenzung mit echten STAGING-Admin-/Scout-Sitzungen prüfen. Zusätzlich MESSINHO-Chat mit echter Anmeldung testen.
5. **Erste Kandidatenprüfung:** VO₂max-Kandidat nur durch Admin prüfen; keine manuelle Datenbankmanipulation, um den Freigabeprozess zu umgehen.
6. **Curriculum schrittweise erweitern:** Erst die Grundlagen der Mathematik und Statistik, danach Physik, Biologie, Medizin, Sportwissenschaft und Fußballwissenschaft; anschließend Risikomanagement, Bankenwesen und Finanzmärkte sowie Informatik/KI. Die Reihenfolge darf durch echte fachliche Voraussetzungen angepasst werden. Für jede neue Fachstrecke: genaue Quellenrechte, atomare Konzepte, Claims, Formeln, Grenzen, Abhängigkeiten, unabhängige Korroboration, Tests und Admin-Freigabe.
7. **Autonome Wissenslückenschleife vervollständigen:** Lücken erkennen → Rückfrage stellen, wenn nötig → erlaubte Quellen recherchieren → Belege unabhängig vergleichen → kompakte Konzepte extrahieren → mit bestehendem Graph abgleichen → Konflikte quarantänisieren → Kandidaten versioniert speichern → Admin-Freigabe → aktives Wissen automatisch abrufen und anwenden.
8. **Dauerhaftigkeit nachweisen:** Backup-/Restore-Test der Konzepte, Beziehungen, Versionen, Konflikte und Review-Historie auf STAGING durchführen; nach Restore Zählwerte und Verknüpfungen vergleichen. Erst danach „Wissen kann wiederhergestellt werden“ als nachgewiesen bezeichnen.
9. **Wirkung und Prognosequalität:** Testfälle mit bekannten Ergebnissen, historischen Daten und zeitlich sauberer Trennung aufsetzen. Prognosen müssen Unsicherheit, Datenlücken, Annahmen, Kalibrierung und Grenzen benennen. Risikomanagement-Methoden nicht als unbelegte Gewissheit darstellen.
10. **Alle zwölf Fachbereiche integrieren:** Die Fähigkeiten sollen das Wissen automatisch nutzen, nicht als manuell aktivierbare Einzelfunktionen erscheinen. Die numerische Bewertung bleibt durch nachvollziehbare Regeln und getrennte Freigaben geschützt.
11. **Quellenbasis verbreitern:** Ziel ist ein qualitativ geprüfter Bestand aus 100 einzeln geprüften Werken, nicht 100 bloße Links. Keine Quelle freigeben, um eine Quote zu erfüllen. Keine Volltext-/PDF-Speicherung.
12. **Produktionsreife separat beurteilen:** erst nach bestandenen E2E-, Sicherheits-, Rechte-, Backup-/Restore- und Prognoseprüfungen. Keine Produktionsfreigabe oder PR-Merge ohne ausdrückliche Anweisung.

### 7. Nächster konkreter Arbeitsschritt

Im nächsten Chat direkt mit Punkt 1 und 2 fortfahren: aktuellen Feature-HEAD und CI erneut verifizieren, dann den neuen VO₂max-Lernpfad einschließlich Fehlerfällen testen. Bei grünem Ergebnis nur den geprüften Branch-HEAD nach STAGING deployen und den Admin-/Scout-E2E-Test vorbereiten. Keine neue Wissensarchitektur entwerfen und keine bereits erledigten Tabellen, RPCs oder Konfliktmechanismen erneut bauen.



## 2026-11-26 — First approved scientific sources and foundation learning path

### Exact work-level source approvals
- Added two individually scoped scientific works to `backend/messinho-rights-registry.js`:
  1. Wiecha et al. (2023), *External validation of VO2max prediction models based on recreational and elite endurance athletes*, PLOS ONE 18(1): e0280897, DOI `10.1371/journal.pone.0280897`, CC BY 4.0. PLOS policy confirms author-retained copyright, CC BY 4.0, commercial adaptation with attribution, and explicit TDM permission for any purpose.
  2. LaMonte (2022), *Cardiorespiratory Fitness in the Prevention and Management of Cardiovascular Disease*, PMCID `PMC11269081`, CC BY 4.0. Automated retrieval is constrained to PMC's designated services; the implementation uses the PMC BioC API for the Open Access subset.
- The registry now contains exactly **2** approved source works. Each source URL is exact-work scoped; PLOS DOI query parameters are checked, and the PMC article identity is exact. OpenStax remains excluded/quarantined, and OpenIntro/NIST/Grinstead-Snell remain quarantined.
- Source register: **18** works/resources, **2** approved exact works. No bulk corpus, PDF, figure, table or full article text is stored.

### New permitted retrieval and learning code
- Added `backend/messinho-approved-source-ingestion.js`:
  - PLOS retrieval only through the exact article JATS XML endpoint.
  - PMC retrieval only through the approved BioC JSON endpoint.
  - Extracts short relevant text excerpts in memory, caps output, preserves section and source provenance, and returns `transient_excerpts_only`.
  - It does not expose or persist a full-text field.
- Added `backend/messinho-approved-knowledge-learning.js` as the first domain curriculum adapter. For VO2max/cardiorespiratory-fitness questions, it fetches the two approved works, verifies that both independent domains support the same claim, then creates a compact foundational candidate in `sports_science`.
- The candidate includes a definition, applicability to football scouting, limitations, evidence grade, confidence, two source references, licence/attribution metadata and a stable concept key. It is stored as `candidate`, never auto-activated. Admin approval and all graph governance gates remain mandatory.
- Connected the new learning path to `POST /api/agent/chat`: matching questions first use the approved work-level sources. If the source pair corroborates the concept and the database write is confirmed, MESSINHO explains the result and states that the knowledge remains pending admin approval. Other questions continue through the existing research flow.
- Added tests for exact URL scope, permitted PLOS/PMC retrieval routes, no-network behavior for unapproved sources, excerpt-only output, two-source corroboration and candidate-only persistence.

### Verification and release status
- Feature-branch CI is running for the latest commits; check the final HEAD's Node test and backend syntax outcomes before deployment. An earlier test failure was a too-short negative PMC fixture; the fixture was lengthened. Do not treat a prior commit's result as proof for the latest HEAD.
- The new retrieval/learning path has **not** been deployed to Render STAGING yet, and authenticated chat end-to-end has not been run. No knowledge candidate has been seeded in Supabase by this change; database counts remain 0 until the deployed, authenticated chat path is exercised.
- Dedicated Render STAGING remains the only deployment target; auto-deploy disabled. Production/main, production Supabase, player/scout data, model weights, PFMS/PFSS and PR merge state remain untouched. PR #47 remains Draft/open/unmerged.

### Next steps
1. Fix any CI failures on the latest feature HEAD and rerun both workflows.
2. Deploy only the verified feature commit to the dedicated STAGING Render service.
3. Use an authenticated STAGING admin session to ask a VO2max foundation question; confirm the two permitted endpoints are used, one compact candidate and version snapshot are stored, and no full-text payload is persisted.
4. Test that the candidate is absent from trusted chat retrieval until explicit admin approval, then approve it and verify active retrieval.
5. Extend the same pattern domain by domain only when exact, independently corroborated works with compatible commercial AI/TDM rights are found.


## 2026-11-26 — General autonomous knowledge learning integrated and STAGING live

### Implemented
- Added `backend/messinho-knowledge-learning.js` as the general foundational-question learner for future rights-cleared domains. It runs only on completed, quality-approved, non-time-sensitive research; excludes personal health/context questions; fetches exact approved source material through the allowlisted retrieval module; verifies claims against transient excerpts; and writes only compact claims and metadata through the canonical graph store.
- The VO2max adapter remains the first domain-specific foundation path. It now runs only for general foundational questions or a standalone VO2max query; it rejects player-specific, comparative, calculation and personal questions.
- Both paths use the same graph, candidate-only storage and admin review gates. Source excerpts are used transiently and are never written to the knowledge graph. Exact article URL, licence, rights holder, attribution, TDM evidence URL, retrieval method/endpoint and rights-review date are retained.
- Added tests for general candidate learning, source-retrieval failures, unsupported claims, personal/player-specific exclusions, exact endpoint provenance and candidate-only status.

### Verification
- Latest feature HEAD: `6a76f6be03f39e477f1262707d0921c161311470`.
- GitHub CI: **299 tests passed, 0 failed**; backend syntax check passed.
- Dedicated STAGING Render service: `myscoutingdatabase-messinho-staging` (`srv-dc3chlqjnfac73acd6ig`).
- Latest active deployment: `dep-dc485ff5hvus73dg1svg`, exact commit `6a76f6be03f39e477f1262707d0921c161311470`, status **live**, finished `2026-11-26T19:05:55Z`. A duplicate deployment of the same commit (`dep-dc485f6i0phs739e3r2g`) was superseded/deactivated; no different code was deployed.
- Runtime logs confirm `node backend/server.js` started, API listening on port 10000, Supabase Data API HTTP 200, and configured Tavily/OpenAI presence. No secret values were logged.
- No new migration was required for this application-code deployment. STAGING knowledge concepts, links, versions, conflicts and review rows remain empty until an authenticated learning request is made. No full source text/PDF was imported.
- Authenticated end-to-end chat, candidate review UI and approval/retrieval after activation have **not** yet been exercised. Do not claim the candidate is already stored or active.

### Next exact actions
1. In the owner's authenticated STAGING browser session, ask a general question such as `Was ist VO2max?`. Confirm that both approved PLOS/PMC retrieval endpoints are called and one compact `candidate` plus its version snapshot is written.
2. Confirm the candidate is not returned by trusted active-knowledge retrieval before admin approval; inspect stored source metadata and ensure no excerpt/full-text fields exist.
3. In an approved Admin session, load the knowledge candidate queue, inspect evidence and rights, then approve or reject. Confirm the version/audit record and active retrieval after approval.
4. Test Scout role denial for the admin queue/review endpoints and cross-role isolation.
5. Only after the first domain path passes E2E, begin the next foundational domain using exact work-level rights review. Do not add OpenStax/NC/OpenIntro/NIST/other quarantined works without the required written/verified permissions.
6. Keep production, `main`, production Supabase, PFMS/PFSS and PR merge state untouched. PR #47 remains Draft/open/unmerged.


### Branch-base observation after STAGING release
- At the final checkpoint, GitHub `main` HEAD is `38780d357384c7a2473e16bfabfe949017450042`, commit message `Add bounded independent MESSINHO quality control` (2026-11-26 15:01:11Z), parent `fa0d4dfbdd779f280bb3caf44c6cc70be8dcb5b6`.
- This `main` commit is separate from the STAGING feature work recorded above; no merge, rebase, production deploy or production database change was performed as part of this checkpoint.
- PR #47 remains Draft/open/unmerged. Before any future merge, compare the updated `main` base with the feature branch and resolve conflicts deliberately; do not force-reset or rewrite `main`.


### Final handoff — authenticated E2E still required
- The final live deployment remains `dep-dc485ff5hvus73dg1svg` on code commit `6a76f6be03f39e477f1262707d0921c161311470`; Render reports `live` and the runtime start logs confirm the API listener and live service.
- The latest branch checkpoint before this note is `d3a3e8caaf7cd8107ac64e765b63f8f6b74dfef5`; its documentation-only update has green GitHub checks. Node tests remain 299/299 passing; backend syntax is successful.
- Supabase STAGING remains healthy with 56 recorded migrations and no migration added for this task. The five knowledge graph/review tables remain empty (0 rows each), so there is no candidate to approve yet.
- No authenticated Admin or Scout browser session was available to this execution. Therefore the real authenticated chat, Admin queue approve/reject, Scout 403/tenant-isolation and post-approval retrieval tests have **not** been run. No credentials or session tokens were requested, read, generated or stored; no replacement accounts were created.
- Next action is to run those exact E2E steps using the owner's already-approved STAGING Admin and Scout sessions. Until then, the VO₂max learning code is CI-verified and deployed to STAGING, but its first real candidate creation and approval lifecycle are not yet E2E-verified.
- PR #47 remains open, Draft and unmerged. No merge, rebase, production deployment or production database change was performed.


## 2026-11-26 — Admin knowledge review interface deployed to STAGING

### Implemented
- Added `src/asi/MessinhoKnowledgeReviewPanel.jsx`, mounted only for approved Admin profiles inside the existing collapsed help/agent-functions bundle. Scout accounts do not render this panel.
- The panel loads candidate concepts from the existing admin-only `GET /api/messinho/knowledge-concepts?status=candidate` endpoint and open conflicts from `GET /api/messinho/knowledge-conflicts?status=open`.
- Candidate cards show the compact definition, domain/learning level, confidence/evidence grade, prerequisites, claims, source URLs, licence, rights holder, TDM evidence and retrieval method. No article excerpts/full text are exposed.
- Admin can approve or reject a candidate with an auditable reason. The backend independently rechecks exact source rights, two independent domains, claim corroboration, prerequisites and open conflicts; the UI cannot bypass those gates.
- Conflict cards allow the Admin to confirm the existing concept or reject the competing proposal. The previous concept is restored only after all open conflicts in that episode are resolved.
- The panel is collapsible and responsive; no new standalone navigation section was added, keeping the workspace grouped and uncluttered.

### Verification / deployment
- Latest deployed feature commit: `4155705ba7d52942e7455df6bb644c7040808a7d`.
- GitHub Node tests and backend syntax workflows: **success**.
- Render build: **299 tests passed, 0 failed**; Vite transformed 1,636 modules and built successfully.
- Dedicated STAGING deployment: `dep-dc48781aekrs73cj27mg` (final active rollout; the earlier same-commit rollout was superseded), status **live**, finished `2026-11-26T19:08:55Z`.
- Runtime logs confirm server start, API listening on port 10000 and Supabase Data API HTTP 200.
- The candidate queue and review interface are deployed, but authenticated Admin/Scout UI and API end-to-end tests have not yet been executed. The knowledge tables still contain 0 concepts, 0 conflicts, 0 versions and 0 reviews until the first authenticated learning request.

### Next steps
1. Sign in to the dedicated STAGING app with an approved Admin account and ask MESSINHO `Was ist VO2max?`.
2. Confirm one candidate appears in the Admin knowledge-review panel with exactly two source records and no full-text/excerpt fields.
3. Confirm a Scout account receives 403 from candidate/conflict/review endpoints and cannot see the Admin panel.
4. Approve the candidate as Admin; confirm the version and audit row are appended and active retrieval works in a subsequent chat. Also test rejection and a deliberately conflicting candidate.
5. Expand the same approved-source retrieval pattern to mathematics, statistics, physics, biology, medicine, computer science/AI, risk management, banking and financial markets only when exact rights-cleared works exist.
6. Production/main, production Supabase, player/scout data, model weights, PFMS/PFSS and PR merge state remain untouched. PR #47 remains Draft/open/unmerged.


## 2026-11-26 — VO₂max source-rights expiry guard and E2E gate

### Completed on the feature branch
- Added a mandatory `review_due_at` date to all four currently approved source-rights entries. Current review deadline: `2027-11-26`.
- `verifyMessinhoSourceRights` now fails closed when the review date is invalid, mismatched or expired. The approved retrieval adapter checks this before making a network request.
- The compact source provenance now carries both `reviewed_at` and `review_due_at`; the Admin knowledge review panel displays the review deadline.
- Added regression tests proving that a source remains valid through the due date, becomes invalid after it, and triggers no fetch after expiry.
- Corrected the HTML fixture assertion for the linear-algebra source (matrix/matrices wording). Added timeout and cross-host redirect checks to approved source retrieval.

### CI status
- Verified code commit: `67314ee04e3af960fb488e1cb996b3b7184edd9e`.
- GitHub Node tests: **304 passed, 0 failed**.
- Backend syntax workflow: **success**.
- The latest follow-up branch commits also have successful Node and syntax checks. This documentation entry does not authorize deployment of the additional mathematics sources.

### Deployment and sequencing
- Current live STAGING remains `dep-dc48781aekrs73cj27mg`, deployed code commit `4155705ba7d52942e7455df6bb644c7040808a7d`. It contains the VO₂max foundation path and Admin knowledge-review interface.
- The newer branch-only rights-expiry guard, expanded four-source registry and linear-algebra retrieval additions are **not yet deployed**. Keep them on the feature branch until the VO₂max authenticated E2E gate is completed; do not activate the next domain early.
- Supabase STAGING schema is unchanged; no migration is required for these source-registry and UI changes. Do not manually insert candidate records.

### Immediate next action — authenticated E2E
1. Owner signs in to the dedicated STAGING application using the existing approved Admin account and asks MESSINHO: `Was ist VO2max?`.
2. Verify one compact candidate, two independent VO₂max source records, exact source provenance and no stored excerpts/full text.
3. Verify pending candidates are absent from active retrieval; approve and reject through the Admin knowledge-review panel and verify the audit/version history.
4. Owner signs in with the existing approved Scout account; verify the Admin panel is absent and candidate/conflict/review API routes return 403. Also verify organization and user isolation.
5. Only after those authenticated checks pass may the newer feature-branch rights-expiry and next-domain work be promoted to STAGING.

No Admin/Scout credentials, passwords or session tokens were accessed, generated or stored. Real authenticated E2E remains pending the owner's existing STAGING sessions. PR #47 remains open/Draft/unmerged; `main`, production, production Supabase and PFMS/PFSS remain untouched.


## 2026-11-26 — Branch-only preparation: mathematics foundation source pair

### Rights-cleared source pair added on the feature branch
- Added Ken Kuttler (Lyryx), *A First Course in Linear Algebra*, §2.2 *Multiplication of Matrices*, exact LibreTexts chapter page, CC BY 4.0.
- Added David Austin, *Understanding Linear Algebra*, §2.2 *Matrix multiplication and linear combinations*, exact official HTML page, CC BY 4.0; the official colophon identifies the author and licence.
- Both entries are work/page scoped, carry separate licence/TDM evidence, attribution, a one-year review deadline (`2027-11-26`) and exact retrieval URLs. Only the text of those exact chapter pages may be extracted; no PDFs, diagrams, interactive Sage cells, exercises or third-party media.
- The registry now has **4** approved works: PLOS, PMC BioC, Kuttler and Austin. The source register contains **20** works/resources, 4 approved. OpenStax remains excluded/quarantined.

### Mathematics foundation path prepared — not deployed
- Extended the transient approved-source adapter with exact HTML retrieval for the two linear-algebra pages. It caps excerpts, preserves section and licence provenance, enforces approved host/redirect/time limits and does not persist full text.
- Extended the curated foundation learner with `mathematics.linear_algebra.matrix_multiplication`. It requires the two independent chapter sources to corroborate the dimension rule, then prepares a compact foundational candidate with formula `(AB)_{ij} = Σ A_{ik}B_{kj}`, variables, applicability and limitations.
- The existing VO₂max foundation remains the only deployed learning seed. The mathematics source pair and learner are feature-branch only and must not be deployed until the VO₂max authenticated E2E gate passes.

### Additional STAGING database transaction check
- Executed a temporary candidate-create → admin-approve transaction against STAGING, asserting active status, version increment 1→2, one approval audit row and two append-only version snapshots. The transaction was rolled back.
- Post-rollback counts remain concepts 0, conflicts 0, versions 0, reviews 0. No persistent candidate was inserted by the test.

### Branch verification
- Feature commit `67314ee04e3af960fb488e1cb996b3b7184edd9e`: **304 Node tests passed**, backend syntax success. The later documentation-only source-ID checkpoint is separate.
- No Render deployment was triggered for the mathematics expansion. Current live STAGING remains `dep-dc48781aekrs73cj27mg`, commit `4155705ba7d52942e7455df6bb644c7040808a7d`.
- Immediate gate remains the owner's authenticated VO₂max test, candidate review/approval, Scout 403 and post-approval retrieval. Only after that may the mathematics expansion be promoted to STAGING.
- Production/main, production Supabase, user/player/scout data, model weights, PFMS/PFSS and PR merge state remain untouched; PR #47 remains Draft/open/unmerged.


## 2026-11-26 — Regression beheben: HTML-Quellenpipeline und Foundation-Erkennung

### Fehlerursache und Korrektur
- Ein zwischenzeitlicher CI-Stand enthielt in `tests/messinho-approved-source-ingestion.test.js` einen fehlerhaften Regex-Literal für den HTML-`Accept`-Header. Node brach die Testdatei bereits beim Parsen mit `SyntaxError: Invalid regular expression flags` ab; dadurch schlugen sowohl der Node-Testlauf als auch der Syntax-Workflow fehl.
- Die Header-Prüfung ist jetzt als exakter Stringvergleich formuliert (`text/html,application/xhtml+xml;q=0.9`). Das ist für diesen deterministischen HTTP-Header präziser und vermeidet unnötige Regex-Escaping-Fehler.
- Die VO₂max-Grundlagenerkennung verwendet geprüfte Regex-Literale mit echten Wortgrenzen und Whitespace-Klassen. Regressionstests decken allgemeine Fragen und den Ausschluss spielerbezogener bzw. persönlicher Fragen ab.

### Verifikation
- Aktueller Feature-Branch-HEAD zum Prüfzeitpunkt: `9f64e5af150d3d03c94451fdf6051d34f0e9705d`.
- GitHub Node-Tests: **304 bestanden, 0 fehlgeschlagen**.
- Backend-Syntax-Workflow: **erfolgreich**.
- Der aktuelle Quelltest vergleicht den HTML-`Accept`-Header exakt; die aktuelle Lernlogik und die Foundation-Tests sind auf dem Branch vorhanden.
- Keine erneute Bereitstellung ausgelöst. Der zuvor angestoßene, nicht mehr aktive Render-Deploy `dep-dc484517lnhs73flus40` ist **deactivated**; der dokumentierte aktive STAGING-Stand bleibt unverändert.
- Authentifizierte Admin-/Scout-E2E-Prüfung bleibt weiterhin erforderlich, bevor die neueren Branch-Änderungen nach STAGING übernommen werden. Produktion, `main`, Produktions-Supabase und PFMS/PFSS bleiben unberührt.

### 2026-11-26 — Approved source ingestion hardening before first knowledge import

- **Status:** Code changes committed to the staging feature branch; verification and authenticated staging E2E remain open. No deployment or knowledge import was performed.
- **Branch:** `feature/messinho-unified-ai-integration`
- **Latest code commit:** `42e8e395e3d0eb0e4d60fd50f13fe6c375677c93`
- **Runtime source commit:** `33f271dc8d2e1b03d22ab4027025242b8b41e9ad`
- **Files changed:**
  - `backend/messinho-approved-source-ingestion.js`
  - `tests/messinho-approved-source-ingestion.test.js`
- **Security correction:** Approved-source HTTP retrieval now uses `redirect: 'manual'` and rejects 3xx responses instead of following redirects and only checking the final URL after a redirect has already been followed.
- **Payload protection:** A 2 MB maximum is checked against the declared content length before parsing. XML/HTML are measured in UTF-8 bytes after retrieval; BioC JSON is read as text and size-checked before JSON parsing when the response supports text retrieval. The fallback JSON path is also size-checked.
- **Regression coverage added:** Tests assert manual redirect mode, rejection of redirects (including same-host redirects), and rejection of oversized BioC responses.
- **Existing safeguards re-inspected:** Source allowlist and review deadline checks; two-source corroboration; compact knowledge graph normalization; inactive candidate state; admin-only review endpoints; RLS enabled on the five shared knowledge tables. Staging grants observed for the five knowledge tables were limited to `postgres` and `service_role`; no direct `anon` or `authenticated` table grants were observed.
- **Important distinction:** The source excerpts are transient inputs. The knowledge graph builder whitelists compact concept fields and source provenance; it does not persist the temporary `snippet` field. This was verified in the current implementation and existing learning tests.
- **Staging database:** Knowledge tables exist. This audit did not write to them. No candidate was created and no import was started.
- **CI status:** GitHub combined status and PR-associated workflow lookup returned no checks/runs for the latest commit at the time of this entry. Therefore the new regression tests are not yet reported as executed; do not describe them as passed.
- **Render staging:** Service remains `myscoutingdatabase-messinho-staging`, branch `feature/messinho-unified-ai-integration`, with automatic deploy disabled. The active deployment remains on commit `4155705ba7d52942e7455df6bb644c7040808a7d`; this new branch commit is not deployed.
- **Release boundary:** Production, `main`, and PFMS/PFSS were not changed. No deployment was triggered.
- **Remaining gates before knowledge import:**
  1. Obtain an actual CI/build execution for the latest branch commit and fix any regressions.
  2. Complete authenticated Admin and Scout staging tests for candidate creation, non-visibility before approval, approve/reject audit history, and 403 protection for Scout/admin-only endpoints.
  3. Deploy only to the dedicated staging service after the authentication gate is satisfied, then verify the exact deployed commit and health.
  4. Run a real VO₂max candidate creation and approval cycle; verify persistent provenance, versions, conflicts, and active retrieval.
  5. Only then begin the controlled foundational knowledge import.

## Projektcheckpoint — 2026-11-26 (Fortsetzung nach Quellenpipeline-Härtung)

### Verbindlicher Projektumfang und Arbeitsregeln

- **Projekt:** ausschließlich `myScoutingDatabase`.
- **KI-Modul:** MESSINHO ist ein integriertes, autonom arbeitendes Scouting- und Wissensintelligenz-Modul innerhalb von myScoutingDatabase, nicht das Gesamtprojekt.
- **Arbeitsbranch:** ausschließlich `feature/messinho-unified-ai-integration`.
- **Zielumgebung:** ausschließlich der dedizierte STAGING-Dienst `myscoutingdatabase-messinho-staging` (`srv-dc3chlqjnfac73acd6ig`).
- **STAGING-URL:** `https://myscoutingdatabase-messinho-staging.onrender.com`.
- **Supabase STAGING:** Projekt `myScoutingDatabase-staging`, ID `nwqwnrhupbyhshsprxjt`.
- **Explizite Verbote:** niemals `main`, Produktion, PFMS/PFSS oder PFSS-Staging verändern; niemals mergen oder deployen, sofern nicht ein ausdrücklich dokumentierter Staging-Freigabeschritt erreicht und autorisiert wurde.
- `PROJECTSCOUT.md` ist das führende Projekttagebuch. Vor jeder Fortsetzung den aktuellen Stand und die letzten Einträge lesen. Erledigte Aufgaben nicht wiederholen. Nach jedem abgeschlossenen Arbeitspaket diesen Checkpoint fortschreiben.
- Keine Zugangsdaten, Passwörter oder Session-Tokens im Chat erfragen oder speichern. Authentifizierte Prüfungen nur über eine vom Nutzer bereitgestellte, sichere angemeldete STAGING-Sitzung.
- Ehrlich zwischen Codeänderung, lokalem Test, CI-Nachweis, deployedem Code und authentifiziertem Live-Test unterscheiden. Niemals einen nicht ausgeführten Test als bestanden bezeichnen.

### Zuletzt erledigte Arbeiten

1. Vorherige Regression in der genehmigten Wissensaufnahme behoben:
   - ungültige Regex-Flag-Prüfung für HTML-Accept-Header durch exakten Stringvergleich ersetzt;
   - VO₂max-Erkennung in der Foundation-Erkennung korrigiert/geprüft;
   - bestehende Korrekturen für sichere Matrix-Erkennung, Quellenrechte, Review-Fristen und Wissensfreigabe beibehalten.
2. Vorheriger nachgewiesener CI-Stand auf Commit `c5a676464cb7fa3e86a55013af4bde0067b36400`: 304/304 Node-Tests bestanden, Backend-Syntax erfolgreich, 2/2 Checks erfolgreich. Dieser Nachweis gilt **nicht automatisch** für spätere Commits.
3. Approved-source-Ingestion weiter gehärtet:
   - HTTP-Redirects auf `manual` gestellt und 3xx-Antworten abgewiesen, einschließlich Same-Host-Redirects;
   - maximale Quellantwortgröße von 2 MB ergänzt;
   - deklarierte Content-Length vor Parsing geprüft;
   - XML/HTML anhand UTF-8-Bytegröße begrenzt;
   - BioC JSON nach Möglichkeit als Text eingelesen und vor JSON.parse größenbegrenzt; Fallback-Pfad ebenfalls geprüft;
   - Regressionstests für Redirect-Blockierung und zu große BioC-Antworten ergänzt.
4. Wissensspeicher geprüft:
   - temporäre Quellen-Auszüge werden durch die strukturierte Wissensgraph-Whitelist nicht als dauerhafte Wissensfelder übernommen;
   - fünf Knowledge-Graph-Tabellen haben RLS aktiviert;
   - in der Rechteprüfung wurden keine direkten Tabellenrechte für `anon` oder `authenticated` auf diesen fünf Tabellen festgestellt; `postgres` und `service_role` besitzen die beobachteten Rechte;
   - Admin-only API-Prüfungen sind in den Wissenskonzept-, Review- und Konfliktrouten implementiert.
5. Staging-Wissensbestand read-only geprüft: `messinho_knowledge_concepts`, `messinho_knowledge_versions`, `messinho_knowledge_links`, `messinho_knowledge_conflicts` und `messinho_knowledge_reviews` jeweils 0 Einträge. Kein Wissensimport und keine Kandidatenerstellung durch diese Prüfung.
6. `PROJECTSCOUT.md` um den vorherigen Härtungsbericht ergänzt (Commit `9550c916158235709cf0f4ef732e51aec0721b58`).

### Letzter bekannter Repository-/Deployment-Stand

- Letzter dokumentierter Commit nach Härtung und Dokumentation: `9550c916158235709cf0f4ef732e51aec0721b58`.
- Auf diesem Commit meldeten die abgefragten GitHub-Status- und PR-Workflow-Endpunkte keine Checks bzw. Workflow-Runs. **Daher ist die neue Härtung noch nicht durch einen frischen CI-Lauf nachgewiesen.**
- Letzter bestätigter Render-Live-Deploy ist weiterhin `dep-dc48781aekrs73cj27mg`, Commit `4155705ba7d52942e7455df6bb644c7040808a7d`. Neuere Feature-Branch-Änderungen sind nicht deployed.
- Render Auto-Deploy ist deaktiviert. Das bleibt so.
- Es wurde kein neuer Deploy ausgelöst und die Produktion wurde nicht berührt.

### Aktueller Status: Noch keine Freigabe für den eigentlichen Wissensimport

Die technische Grundlage ist weit fortgeschritten, aber es ist noch nicht nachgewiesen, dass die aktuelle Branch-Version erfolgreich gebaut und auf STAGING authentifiziert end-to-end getestet wurde. Die bisherigen Sicherheitsprüfungen sind keine vollständige Freigabe.

### Geplante nächste Schritte — in genau dieser Reihenfolge

**Schritt 1 — Aktuellen Branch und CI verifizieren**
- Branch-HEAD und Commit-Historie erneut lesen; sicherstellen, dass die Härtungsänderungen und dieser Checkpoint im vereinbarten Branch liegen.
- Einen vollständigen CI-/Build-Lauf für den aktuellen HEAD herbeiführen bzw. den Grund für fehlende Workflow-Runs ermitteln.
- Alle Test-Suiten, Backend-Syntax-/Build-Prüfungen und neuen Regressionstests ausführen lassen; Fehler beheben, bis der aktuelle Commit nachweislich grün ist.
- Keine alten CI-Ergebnisse als Beleg für den aktuellen Commit verwenden.

**Schritt 2 — Authentifizierter STAGING-E2E-Test**
- Nutzer meldet sich selbst in der dedizierten STAGING-App als freigeschalteter Admin an und sendet MESSINHO: `Was ist VO2max?`.
- Verifizieren: genehmigte Quellen, ausreichende unabhängige Belege, Rechte-/Lizenzprüfung, kompakter strukturierter Kandidat, Quellenprovenienz, keine persistierten Originalauszüge.
- Vor Freigabe muss der Kandidat in der aktiven Wissenssuche unsichtbar bleiben.
- Admin genehmigt und lehnt einen Testkandidaten kontrolliert ab; Audit-/Review-Historie und Versionen prüfen.
- Scout-Konto testen: Adminoberfläche und Review-APIs dürfen nicht zugänglich sein; Admin-only Endpunkte müssen 403 liefern. Zusätzlich Nutzer-/Organisationsisolation prüfen.
- Fehlende Browser-Session ist eine externe Voraussetzung. Keine Passwörter oder Tokens im Chat erfragen. Wenn kein sicherer Sessionzugriff besteht, den Nutzer um Durchführung der konkreten UI-Aktion und Rückmeldung/Screenshot bitten.

**Schritt 3 — Staging-Deployment-Gate**
- Erst wenn Schritt 1 und 2 bestanden sind: exakten Branch-HEAD in den dedizierten Render-STAGING-Dienst deployen.
- Vorher Service-ID, Branch-Konfiguration und Auto-Deploy-Off-Status kontrollieren.
- Nach Deploy Commit-SHA, Build-Logs, Health-Endpunkte und Runtime-Fehler prüfen.
- Niemals Produktion, `main` oder PFMS/PFSS anfassen.

**Schritt 4 — Kontrollierter Foundation-Pilot**
- Mit genau einem Grundlagengebiet starten: VO₂max.
- Kandidatenerstellung, Quellenrechte, Belegqualität, Admin-Freigabe, persistente Version, Wissenslinks, Konfliktverhalten und aktive Abfrage nach Freigabe vollständig testen.
- Nachweisen, dass MESSINHO das freigegebene Wissen in einem neuen Gespräch korrekt anwendet, verständlich erklärt, Grenzen nennt und Quellen nachvollziehbar ausweist.
- Bei jedem Fehler Import pausieren, Ursache beheben, Regressionstest ergänzen und Checkpoint aktualisieren.

**Schritt 5 — Erst danach skalierter Wissensaufbau**
- Wissensgebiete hierarchisch und in Abhängigkeiten aufbauen: Grundlagen → spezialisierte Konzepte → Formeln/Methoden → Anwendungsfälle → Prognosen/Risikomanagement.
- Jede Wissenseinheit strukturiert und maschinenlesbar speichern, nicht als PDF-Sammlung oder lose Textdatei.
- Herkunft, Lizenz, Abrufzeit, Prüfstatus, Belege, Konfidenz, Einschränkungen, Versionen und Abhängigkeiten dauerhaft dokumentieren.
- Neues Wissen bleibt Kandidat/inaktiv, bis die vorgesehenen Prüf- und Freigaberegeln bestanden sind.
- Kein ungeprüftes Selbsttraining und keine automatische Aktivierung. Selbstverbesserung nur über nachvollziehbare Hypothesen, Tests, Review und versionierte Freigaben.
- Ziel: dauerhaftes Wissen, das MESSINHO suchen, verknüpfen, anwenden, analysieren, bewerten, Prognosen daraus ableiten und in sachlicher, verständlicher Sprache erklären kann.

### Nächste konkrete Aktion beim Fortsetzen

Zuerst den aktuellen GitHub-Branch-HEAD und die jüngsten CI-Workflows prüfen, ohne bereits erfolgreich erledigte Arbeiten zu wiederholen. Danach die fehlende CI-Ausführung für den neuen Commit klären und die Regressionstests nachweislich laufen lassen. Der Admin-/Scout-E2E-Test bleibt das nächste nicht automatisierbare Gate. Bis beide Gates bestanden sind: kein Wissensimport und kein Deployment.


## Projektcheckpoint — 2026-11-26 (CI-Gate, Promptkorrektur und STAGING-Sicherheitsprüfung)

### Arbeitsregeln bleiben unverändert
- Ausschließlich myScoutingDatabase und feature/messinho-unified-ai-integration.
- Ziel bleibt ausschließlich der dedizierte Render-Dienst myscoutingdatabase-messinho-staging und das Supabase-Projekt nwqwnrhupbyhshsprxjt.
- Kein Push nach main, kein Merge, keine Produktionsänderung, kein PFMS/PFSS-Eingriff.
- Kein Wissensimport und kein Kandidaten-Write vor bestandenem Admin-/Scout-E2E-Gate.
- Keine Passwörter oder Session-Tokens im Chat anfordern.

### In dieser Fortsetzung tatsächlich erledigt

1. **Render-STAGING-Baseline geprüft**
   - Dienst-ID: srv-dc3chlqjnfac73acd6ig.
   - Branch: feature/messinho-unified-ai-integration.
   - Auto-Deploy: deaktiviert (autoDeploy=no, Trigger off).
   - Aktiver Deploy: dep-dc48781aekrs73cj27mg, Commit 4155705ba7d52942e7455df6bb644c7040808a7d, Status live.
   - STAGING-URL: https://myscoutingdatabase-messinho-staging.onrender.com
   - Kein neuer Deploy wurde ausgelöst.

2. **Build- und Regressionsergebnis des aktuell laufenden STAGING-Codes aus den Render-Build-Logs nachgewiesen**
   - Build-Command: npm install --no-audit --no-fund && npm run build.
   - npm run build führt npm test, Backend-node --check für alle Backend-JavaScript-Dateien und anschließend vite build aus.
   - Nachweis im Build des Commits 4155705ba7d52942e7455df6bb644c7040808a7d: **299 Tests bestanden, 0 fehlgeschlagen**; Vite-Build erfolgreich.
   - Weil der Build die Befehle mit && verkettet und Vite erfolgreich gebaut wurde, liefen auch die vorherigen Syntaxprüfungen erfolgreich durch.
   - Dieser Nachweis gilt für den dort gebauten Runtime-Commit, nicht automatisch für die nachfolgenden neuen Commits.

3. **Fehlende dauerhafte GitHub-CI-Konfiguration ergänzt**
   - Neue Datei: .github/workflows/messinho-staging-ci.yml.
   - Workflow läuft bei Push auf den vereinbarten Feature-Branch, bei Pull Requests gegen main und manuell über workflow_dispatch.
   - Prüft mit Node 24: Dependency-Installation und npm run build (Regressionstests, Backend-Syntax und Vite-Build).
   - Commit: 013e2e4512e02404db34e0fcc2ff1fff04b3abf7.
   - **Offen:** Für diesen Workflow-Commit wurde über die verfügbaren Status-/PR-Workflow-Abfragen noch kein frischer GitHub-Check nachgewiesen. Der Render-Build oben ersetzt nicht den Nachweis, dass der neue GitHub-Workflow selbst gestartet und erfolgreich beendet wurde.

4. **Tatsächlichen Promptfehler gefunden und korrigiert**
   - In backend/server.js wurde der Block für freigegebenes hierarchisches MESSINHO-Fachwissen zweimal hintereinander in den Systemprompt eingefügt.
   - Den doppelten Block entfernt. Das spart unnötige Prompt-Tokens und verhindert doppelte Wissenskontext-Wiederholung.
   - Commit: afe255a8d9d4aec0858fa5a69b3a33daf3ee3570.
   - Regressionstest ergänzt: tests/messinho-prompt-context.test.js; er verlangt exakt einen Eintrag des hierarchischen Wissensblocks.
   - Testdatei-Commit: a2550501d007d86018c67af57de009bfae8bd70a.
   - **Offen:** Dieser neue Regressionstest wurde noch nicht in einem Build ausgeführt. Die 299/0 gelten für den älteren Runtime-Commit vor dieser Korrektur.

5. **Supabase-STAGING-Sicherheitsprüfung read-only durchgeführt**
   - Projekt myScoutingDatabase-staging, ID nwqwnrhupbyhshsprxjt, Status ACTIVE_HEALTHY, PostgreSQL 17.12.
   - Die fünf Knowledge-Graph-Tabellen haben RLS aktiviert.
   - Für anon und authenticated wurden auf den geprüften Knowledge-Graph-Tabellen keine direkten Tabellenrechte gefunden; die beobachteten Zugriffsrechte liegen bei service_role (sowie den administrativen Datenbankrollen).
   - Keine RLS-Policies auf diesen Tabellen ist in dieser konkreten Konfiguration nicht automatisch eine Datenfreigabe: Ohne Tabellenrechte für anon/authenticated bleibt direkter API-Zugriff gesperrt. Serverzugriff erfolgt kontrolliert über den Service-Key und die Admin-Prüfungen der App. Keine pauschalen Policies hinzufügen.
   - Supabase Security Advisor meldet sieben Tabellen mit RLS ohne Policies (INFO), eine SECURITY-DEFINER-Funktion admin_set_scout_approval(uuid,boolean) mit EXECUTE-Recht für authenticated (WARN) und deaktivierten Schutz gegen kompromittierte Passwörter (WARN).
   - Die Funktionsdefinition prüft im Funktionskörper auth.uid() und private.is_admin(), bevor sie einen Scout ändert. Das ist ein vorhandener Schutz, ersetzt aber nicht die Prüfung, ob der direkte EXECUTE-Grant noch benötigt wird. Grant nicht unüberlegt entziehen, bevor alle App-Aufrufer geprüft sind.
   - Schutz gegen kompromittierte Passwörter sollte vor breiterem Produktivbetrieb in Supabase Auth aktiviert werden; diese Einstellung wurde hier nicht geändert.
   - Keine Daten, Tabellen, Policies, Rollen oder Migrationen wurden geändert. Keine Wissenseinträge erzeugt.

### Aktueller Stand nach diesen Arbeiten

- **GitHub-Feature-Branch:** letzte von uns erzeugte Commits in Reihenfolge:
  1. 013e2e4512e02404db34e0fcc2ff1fff04b3abf7 — CI-Workflow ergänzt.
  2. afe255a8d9d4aec0858fa5a69b3a33daf3ee3570 — doppelten Wissenskontext im Prompt entfernt.
  3. a2550501d007d86018c67af57de009bfae8bd70a — Regressionstest ergänzt.
- Die neuen Branch-Änderungen sind noch nicht im Render-STAGING deployed.
- GitHub-Statusabfragen liefern bisher keine Checks. Den Workflow-Run für den neuen Commit noch nachweisen.
- Das Supabase-STAGING-Projekt ist gesund; die Wissens-Tabellen sind vorhanden und bleiben unangetastet.
- Die verfügbaren Werkzeuge stellen keine angemeldete Browser-Sitzung des Projektinhabers bereit. Admin-/Scout-E2E-Tests dürfen daher nicht als erledigt behauptet werden.

### Noch offene Freigabeschritte — verbindliche Reihenfolge

1. **GitHub-CI für den aktuellen Feature-Branch-HEAD nachweisen.** Falls der Push-Workflow nicht startet, den Grund ermitteln und den Workflow über GitHub Actions manuell auslösen; nicht mit alten Render-Tests verwechseln.
2. **Neuen Regressionstest und vollständigen Build ausführen.** Bei Fehlern korrigieren und wiederholen, bis der aktuelle Commit grün ist.
3. **Authentifizierter Admin-/Scout-E2E-Test auf STAGING:** Admin fragt 'Was ist VO2max?'; Kandidat, Quellen, Rechte, Belege, Inaktivität vor Freigabe, Admin-Freigabe und Ablehnung samt Review-Historie prüfen; Scout muss Admin-Endpunkte mit 403 nicht erreichen können. Nutzer-/Organisationsisolation ebenfalls prüfen.
4. **Erst danach kontrolliertes STAGING-Deployment** auf den exakt geprüften Feature-Branch-Commit. Vorher Auto-Deploy-off, Dienst-ID und Branch erneut verifizieren. Danach Deploy-Commit, Build, Logs und Health prüfen.
5. **VO2max-Pilot als einzelner Wissensbereich:** Kandidatenerstellung, unabhängige Belege, Rechte, Provenienz, Versionen, Links, Konflikte und aktive Abfrage nach Freigabe testen.
6. Erst wenn der Pilot vollständig bestanden ist, den strukturierten Grundlagenimport beginnen und anschließend die Wissensgebiete hierarchisch erweitern.

### Nächste konkrete Aktion
Zuerst den neuen GitHub-Workflow-Lauf und den aktuellen Branch-HEAD verifizieren. Den Admin-/Scout-E2E-Test nicht umgehen. Bis diese beiden Gates bestanden sind, bleiben STAGING-Deployment und Wissensimport gesperrt.


## Projektcheckpoint — 2026-11-26 (Fehlerdiagnose: MESSINHO verwendet externe Quellen statt Wissensbestand)

### Nutzerbeobachtung / reproduzierter Hinweis
- Nutzer hat auf der STAGING-App die Frage „Was ist VO2max?“ gestellt.
- Screenshot zeigt eine Antwort mit der Formulierung „Ich habe mehrere unabhängige Quellen gefunden“ und externen Verweisen.
- Das ist kein Nachweis für die Wiederverwendung freigegebenen Wissens. Der Screenshot zeigt eine externe Rechercheantwort.

### Read-only-Datenbankprüfung
- Supabase STAGING: nwqwnrhupbyhshsprxjt.
- Zum Prüfzeitpunkt: messinho_knowledge_concepts = 0, messinho_domain_knowledge = 0, messinho_knowledge_reviews = 0, messinho_knowledge_links = 0.
- Damit existiert derzeit kein dauerhaft gespeichertes und freigegebenes Wissen, das MESSINHO für die Antwort hätte abrufen können.
- Keine Datensätze geschrieben oder verändert.

### Gefundene Programmfehler
1. **Einzelbegriff-Suche wurde grundsätzlich verworfen:** Der Ranking-Code des hierarchischen Wissensgraphen und des Domänenwissens verlangte mindestens zwei relevante Tokens. Bei „Was ist VO2max?“ bleibt nach Stopwort-Bereinigung nur „vo2max“ übrig. Selbst ein vorhandener aktiver Eintrag wäre nicht gefunden worden.
2. **Falsche Fachgebietsklassifizierung:** VO2max/maximale Sauerstoffaufnahme wurde nicht zuverlässig der Domäne sports_science zugeordnet. Die Suche konnte daher im falschen Wissensbereich landen.
3. **Stiller Fallback nach fehlgeschlagener Grundlagenaufnahme:** Wenn die spezielle genehmigte Grundlagenpipeline keinen Kandidaten erstellte oder ein Fehler auftrat, fiel der Chat in die allgemeine externe Recherche zurück. Dadurch sah die Antwort wie ein normaler Wissensabruf aus, obwohl kein freigegebener Wissenskandidat gespeichert worden war.

### Korrekturen im Feature-Branch
- Single-term-Retrieval ergänzt: Ein einzelner eindeutiger Fachbegriff darf einen aktiven Wissenseintrag finden; weiterhin nur bei exakter Token-Übereinstimmung und aktivem Status. Mehrwort-Schwellen bleiben unverändert.
- Fachgebietsklassifizierung erweitert: VO2max, VO2 max, maximale Sauerstoffaufnahme, cardiorespiratory fitness und kardiorespiratorische Fitness werden sports_science zugeordnet.
- Fehlerverhalten der Grundlagenpipeline geändert: Ein erkannter Foundation-Topic, dessen Quellenprüfung, Belegprüfung oder Speicherung scheitert, darf nicht stillschweigend durch allgemeine externe Recherche ersetzt werden. MESSINHO meldet stattdessen ausdrücklich, dass der Grundlagenimport blockiert ist und kein freigegebenes Wissen nachgewiesen wurde.
- Bei bereits vorhandenem Kandidaten wird ebenfalls keine parallele externe Ersatzantwort gestartet; der bestehende Freigabestatus muss geprüft werden.
- Ausnahme: Nicht erkannte Foundation-Themen dürfen weiterhin die allgemeine Recherche verwenden. Erfolgreich erstellte Kandidaten werden weiterhin als inaktiv und freigabepflichtig angezeigt.

### Neue Regressionstests
- VO2max wird als sports_science klassifiziert.
- Eine aktive VO2max-Domänenwissenseinheit wird bei „Was ist VO2max?“ mit nur einem Fachbegriff gefunden.
- Ein aktiver VO2max-Eintrag im hierarchischen Wissensgraphen wird mit derselben Ein-Begriff-Frage gefunden.
- Fehlerzustände der genehmigten Grundlagenpipeline blockieren den stillen Fallback zur allgemeinen Recherche.

### Git / Deployment / Teststatus
- Alle Änderungen liegen ausschließlich auf feature/messinho-unified-ai-integration.
- Letzter Commit zum Checkpoint: 8c6eadf0e170894e4477335b7642d4bf9edf1dfe.
- PR #47 bleibt Draft/offen/unmerged.
- GitHub-Statusabfrage und verfügbare PR-Workflow-Abfrage zeigen für diesen Commit noch keine Checks/Runs. Die neuen Tests sind deshalb noch nicht als bestanden zu bezeichnen.
- Render-STAGING läuft weiterhin auf Commit 4155705ba7d52942e7455df6bb644c7040808a7d. Die neuen Korrekturen sind nicht deployed.
- Render Auto-Deploy bleibt deaktiviert. Kein Deploy wurde ausgelöst.
- Produktion, main, PFMS/PFSS und produktive Daten bleiben unangetastet.

### Verbindliche nächste Schritte
1. Vollständigen Node-Testlauf, Syntaxprüfungen und Vite-Build für den aktuellen Feature-Branch-HEAD ausführen; neue Regressionstests müssen nachweislich grün sein.
2. Falls Tests fehlschlagen: korrigieren, Regressionstest beibehalten und erneut vollständig ausführen.
3. Erst nach bestandenem Code-/CI-Gate und dokumentierter Freigabe kontrolliert ausschließlich auf den dedizierten STAGING-Dienst deployen.
4. Danach den VO2max-Admin-Pilot durchführen: Kandidatenerstellung, Rechte, unabhängige Quellen, Inaktivität vor Freigabe, Admin-Freigabe, persistente Version und aktive Abfrage in einem neuen Chat.
5. Scout-Zugriff auf Admin-Review-Funktionen und Organisationsisolation authentifiziert prüfen.
6. Erst wenn der freigegebene VO2max-Eintrag nachweislich ohne externe Ersatzrecherche wiederverwendet wird, ist der erste Grundlagenpilot bestanden und der größere Wissensimport darf beginnen.

### Klare Statusregel
Eine externe Recherche ist kein Wissensimport. Ein Kandidat ist noch kein aktives Wissen. Nur ein dauerhaft gespeicherter, geprüfter, freigegebener und anschließend erfolgreich wiederverwendeter Wissenseintrag zählt als abgeschlossener Grundlagenpilot.


## STAGING deployment checkpoint — 2026-11-26 19:57 UTC

### CI and build evidence
- Current deployed code commit: `330972bc04ed0a283e51020312ea618591fc51e3`.
- GitHub Actions for this commit: Node tests, backend syntax and full production build all completed successfully (3/3 checks).
- Render STAGING build executed the configured `npm run build`: **311 tests passed, 0 failed, 0 cancelled, 0 skipped**; all backend JavaScript syntax checks passed; Vite transformed 1,637 modules and completed the production build.
- Render deployment `dep-dc48tpgu01pc73f7hbdg` completed with status `live` at `2026-11-26T19:57:00Z`.
- Runtime started with `myScoutingDatabase API listening on 10000`; startup log confirms Supabase Data API HTTP 200.
- Dedicated service: `myscoutingdatabase-messinho-staging` (`srv-dc3chlqjnfac73acd6ig`), branch `feature/messinho-unified-ai-integration`, auto-deploy remains disabled. No production service or main branch was deployed.

### STAGING database security and content check
- Read-only inspection confirms RLS enabled on `messinho_knowledge_concepts`, `messinho_knowledge_links`, `messinho_knowledge_versions`, `messinho_knowledge_reviews`, `messinho_knowledge_conflicts` and `messinho_domain_knowledge`.
- Knowledge review/create/conflict RPCs inspected are executable by `service_role`; `anon` and `authenticated` cannot execute them.
- The six knowledge tables remain empty: no concept, domain knowledge, review or link records exist yet. No user or knowledge data was inserted or changed during this checkpoint.
- The independent source-rights registry contains two specifically reviewed VO2max/cardiorespiratory sources: PLOS ONE DOI 10.1371/journal.pone.0280897 and the CC BY 4.0 cardiorespiratory fitness review PMCID PMC11269081. Their reuse rights, exact URL scopes and review dates are recorded in code. A candidate still requires successful retrieval, relevant excerpts, claim corroboration and atomic persistence.

### Remaining verification boundary
- An authenticated Admin chat round-trip, candidate creation from the live providers, Admin approval, and a fresh-chat retrieval of the newly active concept have not yet been executed. No controlled Admin/Scout login session or test credentials were created or used.
- A direct external HTTP probe of `/api/health` was not available from the current execution environment; the service's live deployment state, application startup and Supabase HTTP 200 are confirmed from Render. Do not mark the endpoint probe as passed.
- The knowledge tables are still empty; therefore MESSINHO cannot yet demonstrate reuse of a persisted approved concept. The first VO2max knowledge pilot is prepared but not complete.

### Next required actions
1. In the STAGING app, authenticate as an existing approved Admin and ask a general foundation question: `Was ist VO2max?`. Confirm that the result is a compact inactive candidate, not a claim that active knowledge already exists.
2. In Admin knowledge review, inspect source attribution, two-source corroboration, evidence, rights, definition, limitations and applicability; approve only if all gates pass.
3. Confirm the candidate becomes active with a durable version and an append-only review record; verify no Scout can approve or inspect Admin-only review controls.
4. Start a fresh chat and ask `Was ist VO2max?` again. Confirm the response metadata reports a hierarchical knowledge-graph hit/reuse, with no external research call required for the already-known definition.
5. Verify the record remains available after a service restart and across another Admin/Scout session subject to permissions. Only then mark the pilot passed and begin the staged curriculum import for the next foundational domains.
6. Keep all work on this feature branch and dedicated STAGING. No merge, main, production or PFMS/PFSS changes.

### Release truth
- Code/build gate: passed.
- STAGING deployment: live.
- Database governance: read-only security checks passed.
- VO2max active-knowledge import and authenticated reuse: pending.
- Overall first-knowledge-pilot status: **not yet passed**.


### Additional live STAGING health verification — 2026-11-26 19:58 UTC
- Updated `.github/workflows/staging-health-smoke.yml` so the dedicated STAGING health probe runs on feature-branch pushes, not only when the workflow file itself changes.
- GitHub Actions health run `45887555879` completed successfully against the deployed STAGING URL.
- Exact probe result: HTTP **200**, `ok: true`; database **ok**, authentication **ready**, MESSINHO core **provider_independent**, external research **ready**, optional AI analysis **ready**.
- The workflow commit is `6e4ccc871cda337d44db3a8392e729ac7d14b330`. All four GitHub checks for this branch commit completed successfully: staging health smoke, Node tests, backend syntax and staging branch CI.
- This confirms service health and dependencies, not an authenticated chat conversation or knowledge-record reuse. The knowledge tables remain empty until the Admin starts and approves the VO2max pilot.


## MESSINHO approved-source failure diagnosis and fix — 2026-11-26 20:06 UTC

### User-visible defect
- Admin asked the foundation question `Was ist VO₂max?`; MESSINHO returned `insufficient_approved_sources`.
- This was a real ingestion integration defect, not a missing source-rights approval. The pipeline correctly failed closed and did not persist unverified knowledge.

### Proven root causes from live publisher responses
1. PLOS ONE JATS endpoint returned HTTP 302 with a time-limited signed redirect to the publisher's Cloudflare R2 article object. The ingestion client used `redirect: manual` but rejected all redirects, including this publisher-authorized article delivery.
2. NCBI BioC JSON returned HTTP 200 and a valid payload, but the actual response root is an array of BioC collections. The parser only handled a single collection object / nested object and therefore extracted zero passages.

### Code changes on the staging feature branch
- `backend/messinho-approved-source-ingestion.js`: manually follows a bounded maximum of three HTTPS redirects; only the exact publisher host or source-specific allowlisted mirror host/path is accepted. For the PLOS mirror, the signed AWS query parameters must be present and the object path must match the exact DOI/article object. Cross-host/unapproved redirects still fail closed.
- BioC extraction now normalizes the official array-of-collections response and flattens documents/passages while preserving section provenance.
- `backend/messinho-rights-registry.js`: records the exact PLOS signed object-store redirect host and DOI-specific path. No broad wildcard host or arbitrary redirect was added.
- `backend/server.js`: logs structured source failure statuses for Admin diagnosis and returns clear German user-facing explanations instead of exposing internal status codes in normal chat.
- Tests added for official BioC collection arrays, signed PLOS object-store redirects, and rejection of unresolved/cross-host redirects.
- Dedicated workflow `.github/workflows/messinho-approved-source-probe.yml` now runs the actual production ingestion module against both live publishers (not a simplified duplicate implementation).

### Live source probe evidence
GitHub Action run `45888336042` completed successfully on commit `685cbbc82836b56803c16f1ac3570eac989feaa6`:
- PLOS ONE `plos_one_vo2max_prediction_2023`: completed; 8 compact excerpts extracted.
- PMC `pmc_cardiorespiratory_fitness_2022`: completed; 6 compact excerpts extracted across ABSTRACT, INTRO, FIG and CONCL.
- Both use `transient_excerpts_only`; full article texts are not stored.

### Regression and deployment evidence
- Commit `46c3537cfd5280c9459ef901f8aa1c4f4185d9d8`: Node tests passed; backend syntax passed; full Vite production build passed; STAGING health check HTTP 200 passed; actual approved-source probe passed on the preceding code commit `685cbbc...`.
- Render STAGING deployment `dep-dc4926s9v7es73e7n8og` deployed commit `46c3537...` and reached status `live` at `2026-11-26T20:06:25Z`.
- Dedicated STAGING service only; no production/main/PFMS/PFSS changes.

### Remaining pilot gate (not yet completed)
- The live source ingestion now works, but the actual Admin chat candidate creation, independent claim-corroboration, candidate persistence, Admin approval, and fresh-chat retrieval have not yet been executed.
- Knowledge tables remain unpopulated until a real candidate is created and reviewed. Do not mark the first knowledge pilot passed based only on source retrieval.
- Next action: sign in to STAGING as an existing approved Admin, ask `Was ist VO₂max?`, confirm candidate creation and two-source evidence, approve it in Admin review, then verify retrieval in a fresh chat without external research.
- Preserve all role and organization boundaries; do not seed the database with synthetic test records.


## VO2max candidate verified in STAGING database + UI terminology clarification — 2026-11-26

### Direct database verification
- Supabase project: `myScoutingDatabase-staging` (`nwqwnrhupbyhshsprxjt`).
- Confirmed exactly one row in `public.messinho_knowledge_concepts` for the foundation pilot:
  - ID: `bad81917-fbf7-490d-9bde-ecf227dc6ae7`
  - key: `sports_science.physiology.vo2max`
  - title: `VO₂max (maximale Sauerstoffaufnahme)`
  - status: `candidate` (inactive; not approved)
  - version: 1
  - sources: 2
  - rights status: `verified_permitted`, `ai_tdm=true`
  - created: `2026-11-26 20:13:53+00`
- `messinho_knowledge_concepts` row count is 1; `messinho_knowledge_versions` row count is 1; `messinho_knowledge_reviews` remains 0.
- This proves candidate creation and durable persistence worked. It is not yet approved/active.

### Screenshot interpretation
- The UI text `Noch keine Kandidaten gespeichert.` comes from `src/asi/PlayerSearchWorkspace.jsx`, where the component queries `asi_player_candidates`.
- That is the separate **player scouting pipeline**, not the MESSINHO foundational knowledge candidate queue.
- The knowledge review panel is a separate Admin-only component in `src/asi/MessinhoKnowledgeReviewPanel.jsx`, nested under the collapsed `Hilfe, Erklärungen & Agentenfunktionen` section in `src/asi/MessinhoWorkspace.jsx`. It queries `/api/messinho/knowledge-concepts?status=candidate&limit=50`, which reads the same table where the VO₂max candidate was confirmed.
- No data loss or candidate-persistence defect is indicated by the screenshot. The problem was ambiguous UI terminology.

### UI clarification committed to STAGING feature branch
- Changed player pipeline label to `Gespeicherte Spieler-Kandidaten`.
- Empty state now explains that it contains researched player profiles only and directs Admins to `MESSINHO · Wissensprüfung` for foundational knowledge.
- No database records were changed or deleted.

### Next required validation
- Open `Hilfe, Erklärungen & Agentenfunktionen` in the Admin MESSINHO workspace.
- Open `MESSINHO · Wissensprüfung`; confirm VO₂max appears with status `candidate` and two sources.
- Admin must independently review and explicitly approve or reject it. Do not auto-approve.
- After approval, verify status `active` and test knowledge retrieval in a fresh chat.


## VO2max approval blocked — root cause fixed — 2026-11-26

### User report
- Admin could see the VO2max candidate but approval was rejected.
- API review handler returned `candidate_rights_or_corroboration_incomplete`.

### Proven cause
- `verifyMessinhoSourceRights()` requires the canonical registry field `review_due_at` to be present and exactly match the registry entry.
- `buildMessinhoKnowledgeConcept()` copied `reviewed_at`, but omitted `review_due_at` when creating `rights.source_rights[]`.
- Candidate row therefore contained otherwise valid PLOS ONE + PMC source rights but lacked the deadline field; the approval validator correctly failed closed.
- No source rights were relaxed and no automatic approval was introduced.

### Code fix
- Commit `1a89c309295db69d510197148a54139e04eb990c`: preserve `review_due_at` in every persisted source-rights snapshot.
- Commit `14d09ed8a4fc3bc3e02fc936fb518d84f0c0e971`: regression test verifies both VO2max source-rights snapshots retain their canonical deadline and still pass `verifyMessinhoSourceRights()`.
- GitHub Node regression suite: **314 passed, 0 failed**; backend syntax and STAGING health smoke succeeded.

### Existing STAGING candidate repaired with version history
- Candidate ID `bad81917-fbf7-490d-9bde-ecf227dc6ae7` remains status `candidate` (not approved).
- Added canonical `review_due_at = 2027-11-26` to the two existing source-rights entries, only for the two registered source IDs (PLOS ONE and PMC).
- Created immutable version 2 history entry with reason: missing canonical source-rights review deadline metadata repaired; knowledge content and rights status unchanged.
- SQL result confirmed: version 2, both source-rights entries have review deadline, audit version 2.
- No knowledge content, evidence, or rights status was changed.

### STAGING deployment
- Render service: dedicated MESSINHO STAGING only.
- Deploy ID: `dep-dc49cddg1s2s73dnc0ig`, commit `14d09ed8...`.
- Build and test logs show 314/314 Node tests and successful Vite build. App process started at 20:28:07 UTC. Confirm final Render status/health before calling deployment fully live.
- Production, main, PFMS and PFSS remain untouched.

### Next
1. Confirm Render deploy status is `live` and health endpoint returns 200.
2. Admin refreshes STAGING, opens MESSINHO · Wissensprüfung and approves VO2max with a reason.
3. Verify DB status `active`, review history row and active knowledge retrieval in a fresh chat.
4. Do not approve on behalf of the Admin; do not begin bulk knowledge import until the pilot is proven end-to-end.


## VO2max retrieval and scouting-application verification — 2026-11-26 20:40 UTC

### Existing approved knowledge verified in STAGING
- Supabase candidate `sports_science.physiology.vo2max` is now `active`, version 3.
- Two registered source records and two source-rights snapshots remain attached.
- Rights flags confirmed: `verified_permitted`, `ai_tdm=true`, `commercial_use=true`, `derivative_use=true`.
- Stored content includes the definition, football-scouting applicability, limitations, claims and source provenance.
- Admin review audit is version 3 and remains append-only.

### Retrieval-path review
- General knowledge chat calls `findMessinhoKnowledgeConcepts()` before external general research.
- A matching active concept returns `structured_knowledge_graph_hit` and returns immediately; this path does not call Tavily or the approved-source learning/research path again.
- Player-specific automatic orchestration also queries active structured concepts and passes them into the capability runtime as `_messinho_knowledge_concepts`.
- Capability runtime accepts the knowledge only when its rights flags are verified and source provenance exists; knowledge is passed as reference context for explanations, not as an automatic score or model-weight adjustment.

### Retrieval gap found and fixed
- The old lexical ranking required two overlapping words for longer requests. A longer player-specific request that explicitly named VO2max could fail retrieval even though the active canonical concept existed.
- Ranking now includes canonical `concept_key`, applicability and limitations; a precise concept-key anchor (e.g. `vo2max`) receives a bounded relevance boost and can retrieve the matching concept inside longer scouting requests.
- Sports-science capability relevance filter now recognises VO2max, maximal oxygen uptake, aerobic capacity, endurance and cardiorespiratory fitness.

### Regression tests added
- Canonical VO2max retrieval for longer player-specific requests.
- Approved VO2max concept reaches the relevant holistic scouting explanation.
- The knowledge context is explicitly explanation-only; scoring/model weights are unchanged.
- CPET / estimated-measurement limitations remain available in the explanation context.
- Full automated suite: **316 passed, 0 failed**.
- Backend syntax, Vite production build and CI staging health smoke all succeeded.

### STAGING deployment
- Commit: `1f24d95576579eda0c9e843083a5529d19fb879f`.
- Render deploy: `dep-dc49ht6i0phs739hra40`.
- Dedicated service `myscoutingdatabase-messinho-staging` reached `live` at `2026-11-26T20:39:50Z`.
- No production, main, PFMS or PFSS changes.

### What this proves / what still requires a live authenticated chat
- Proven: active DB record is queryable under the production retrieval filters; ranking regression is covered; application context is passed through the runtime under verified-rights gates; model scores are not modified; automated tests pass.
- Not yet independently proven in this session: a real authenticated Admin chat response from the deployed browser session. The deployment was validated, but this assistant session does not possess the user's browser login/session token and did not impersonate the Admin.
- Next live acceptance test: in a fresh Admin chat ask `Was ist VO2max?`; response must identify reuse of stored knowledge and show no external research intent. Then ask `Wie ordne ich die aerobe Leistungsfähigkeit eines Spielers anhand seiner VO2max ein?`; response must use the stored applicability and limitations, request the measured value/test modality if missing, and never invent a player metric. Confirm returned `knowledge_memory.reused=true` / `structured_knowledge_graph_hit` and relevant sources.
- After the authenticated chat test, run a second question that combines VO2max with a player profile. Only then mark the full end-to-end retrieval-and-application pilot accepted.


## Live-chat acceptance failure analysis and corrections — 2026-11-26 21:50 UTC

### Evidence from Admin staging screenshots
1. A simple VO2max foundation question returned the message that a concept/candidate already existed and asked the Admin to inspect its approval status. This is incorrect for the already-active VO2max v3 concept.
2. A player-specific VO2max question produced irrelevant Wikipedia navigation links (e.g. unrelated article/navigation material) and described them as independent sources. This is an evidence relevance failure, not valid research.

### Backend root-cause handling
- Knowledge graph retrieval now has a canonical exact-key fallback for approved VO2max foundation questions. If normal lexical ranking misses the active concept, it performs a second exact active lookup for `sports_science.physiology.vo2max`, still respecting `knowledge_status='active'` and `valid_until`.
- The fallback is limited to the explicitly recognised VO2max aliases; it does not activate candidates, broaden permissions, or expose unapproved records.
- General web research now filters retrieved sources for topic relevance before evidence assessment, synthesis, or source-digest presentation. VO2max questions require source content about VO2max, maximal oxygen uptake, or cardiorespiratory fitness; unrelated Wikipedia navigation results are excluded.
- Added German/English atmospheric-scattering synonym handling to preserve existing generic science-research behaviour, and ignored generic freshness words in relevance matching.

### Regression and CI
- Added tests for canonical exact-key recovery when broad ranking returns no hit.
- Added tests proving unrelated Wikipedia pages are filtered and a result set containing only unrelated pages fails closed as `no_sources`.
- Full test suite at commit `681ed1c8f356b3c200442c632de3357174dd5e0a`: **319 passed, 0 failed**.
- Backend syntax workflow: success.
- Staging health smoke test: success.
- Combined staging CI/build is still running at the time of this checkpoint; do not mark deployment complete until it passes and Render reports the same commit live.

### Remaining acceptance criteria
- Retest the exact two Admin chat questions after the new staging deployment.
- First question must return `structured_knowledge_graph_hit` and `knowledge_memory.reused=true` for active VO2max v3.
- Second question must apply stored applicability and limitations. If no player measurement is provided, ask for the measured value and test modality; do not fabricate values.
- External research must show only topic-relevant sources. If relevant independent evidence is insufficient, state that clearly instead of showing unrelated links.
- Production remains untouched. Only `feature/messinho-unified-ai-integration` and the dedicated MESSINHO staging service are in scope.


### Final deployment confirmation — 2026-11-26 21:51 UTC
- Latest branch commit: `913837e0e0ef969ee73c252cc50f49a9890c03bc` (includes the tested code commit `681ed1c8f356b3c200442c632de3357174dd5e0a) plus this checkpoint.
- Render staging deployment `dep-dc49msuc6qcc73cthod0`: **LIVE**.
- Render app startup confirmed: `npm start`, `node backend/server.js`, Supabase server credentials present, API listening on port 10000, Tavily and OpenAI configured.
- Latest GitHub checks for the final branch commit: Node tests **success**, backend syntax **success**, staging branch CI/build **success**, staging health smoke test **success**.
- Test count on the exact application-code commit: **319 passed, 0 failed**.
- This is still a code-level correction with automated CI and staging health verification. The two real Admin chat questions have not yet been re-run by the user after this deployment, so end-to-end conversational acceptance remains pending.


## Canonical knowledge chat routing correction — 2026-11-26 21:00 UTC

### Screenshot finding
The Admin retest showed that MESSINHO correctly displayed the interpreted VO2max question but answered with its generic introduction. This is a routing failure: the final conversational fallback was reached instead of the approved knowledge answer. The prior knowledge lookup and source filtering fixes alone were not sufficient.

### Implemented correction
- Added `getMessinhoCanonicalConceptKey()` to the knowledge-graph module. It resolves VO2max aliases including Unicode `VO₂max`, `VO2max`, maximal oxygen uptake, and cardiorespiratory fitness to the canonical key `sports_science.physiology.vo2max`.
- The `/api/agent/chat` route now checks for a canonical foundation topic immediately after live-question and small-talk handling, before scouting intent parsing, player-name extraction, or generic conversation fallback.
- For a matching question, the chat directly retrieves only the active canonical concept through the knowledge graph and returns its stored definition, applicability, formula, limitations, prerequisites and source references.
- If no active approved concept can be retrieved, MESSINHO now returns an explicit knowledge-unavailable response rather than the generic introduction or invented content.
- Added regression coverage for Unicode and German VO2max aliases, and for nonmatching football questions.

### Validation and staging
- Current application code commit: `6eaa27e00051e79cc7f5aeb08d6366ff87501d86` (chat routing and resolver implementation).
- Test-import correction commit: `20dabada8ded780762102cf02eb6aaba103a810e`.
- Latest full test suite: **320 passed, 0 failed**.
- Backend syntax: **success**.
- Combined staging CI/build: **success**.
- Staging health smoke test: **success**.
- Render staging deploy `dep-dc49qm97lnhs73fqeog0`: **LIVE** on commit `20dabada8ded780762102cf02eb6aaba103a810e`.
- Runtime logs confirm API startup, Supabase HTTP 200, Tavily and OpenAI configuration. Production remains untouched.

### Next acceptance test
Re-run the exact question:
`Was ist VO₂max? Erkläre mir den Wert, seine physiologische Bedeutung und seine Grenzen.`
Expected response intent: `structured_knowledge_graph_hit`; expected metadata: `knowledge_memory.reused=true`, kind `hierarchical_knowledge_graph`, canonical VO2max domain. The answer must include the active stored foundation content and its limitations.
Then test a player-specific VO2max application question. If no actual measurement and test protocol are provided, MESSINHO must explain the metric and ask for the missing player measurement instead of inventing a player assessment.


## Runtime failure fix: mixed knowledge field types — 2026-11-26 22:05 CET

### User acceptance-test result
The Admin repeated the canonical VO2max question after the previous routing correction. The UI displayed: "Messinho konnte die Anfrage gerade nicht bearbeiten." Render runtime logs identified the exact exception:
`Messinho agent chat failed: item.applicability.join is not a function`.
This confirms the knowledge route was reached, but response rendering crashed because the stored `applicability` field is a string, not an array.

### Fix applied
- Added `formatMessinhoKnowledgeValue()` in `backend/messinho-knowledge-graph.js` to safely render strings, arrays, numbers, booleans, and structured objects.
- Replaced unsafe `.join()` calls in the canonical knowledge response for applicability, formula, limitations, and prerequisites with the safe formatter.
- Added regression tests covering string, array, object, and null field values.
- No knowledge approval, source-rights, RLS, or production settings were changed.

### Verification
- Current feature-branch HEAD: `a90c8b55551c1583924ebeb49f9c6918826ff600`.
- Node tests: **321 passed, 0 failed** (confirmed in Render build logs).
- Backend syntax: success.
- Staging CI/build: success.
- Staging health smoke test: success.
- Render staging deployment `dep-dc49tegu01pc73fa477g`: **LIVE**, commit matches branch HEAD.
- Production remains untouched.

### Next acceptance test
Repeat the exact Admin prompt:
`Was ist VO₂max? Erkläre mir den Wert, seine physiologische Bedeutung und seine Grenzen.`
Expected: a substantive response built from the approved active knowledge graph record, with no generic greeting and no chat processing error. Confirm that applicability and limitations render even if their stored values have different JSON types. If the response still fails, inspect new Render runtime logs before making another code change.


## Admin acceptance test and knowledge citation UI checkpoint — 2026-11-26 22:18 CET

### User-provided live staging result
The Admin repeated the exact foundation question:
`Was ist VO₂max? Erkläre mir den Wert, seine physiologische Bedeutung und seine Grenzen.`

The supplied screenshot shows a substantive answer body (including the physiological limitation that overall player quality must not be inferred from one fitness metric) and a linked knowledge result named `VO₂max (maximale Sauerstoffaufnahme)`. The result carries the `sports_science · foundational` classification and two source-title links. This is evidence that the canonical knowledge response path is now reached and that the saved foundation entry and its evidence references are being surfaced. It is not yet proof of the full second-stage player-specific application test.

### Additional UI defect identified and fixed
The screenshot showed the knowledge metadata and source links visually concatenated (e.g. the knowledge level immediately followed by source title text). The generic player-result renderer was being reused for a knowledge-graph item, presenting knowledge references with a player icon and inline generic metadata.

Implemented on the feature branch:
- `src/asi/MessinhoWorkspace.jsx`: dedicated renderer for `knowledge-concept-*` items; uses a knowledge/brain icon, separate concept title, distinct domain/level metadata, and a clearly labelled source list. Player result rendering remains unchanged.
- `src/asi/messinho.css`: mobile-friendly spacing, separate metadata pill, readable stacked source links, and safe text wrapping.
- Source links remain ordinary external links and are rendered only when a source URL is present.

### Verified code and CI
- UI implementation commit: `543e1f8d015c5321cf8c9d2c9a0e943631bcedf0`.
- UI styling commit / code deployment target: `cf396444ab831d5c3f41f79aee0e5cab52bb6e0e`.
- Latest feature-branch checks for `cf396444ab831d5c3f41f79aee0e5cab52bb6e0e`: backend syntax **success**, Node tests **success**, staging branch CI/build **success**, staging health smoke test **success**.
- Node suite remains **321 passed, 0 failed**.
- The runtime mixed-field formatter fix remains included in the deployed code ancestor `a90c8b55551c1583924ebeb49f9c6918826ff600`.
- Dedicated staging deployment requested for UI commit: `dep-dc4a3nc9v7es73eahqh0`; deployment status must be confirmed LIVE before this checkpoint is treated as fully deployed.
- No production, `main`, PFMS, or PFSS changes.

### Acceptance status
1. Canonical VO2max intent recognition and knowledge retrieval: **visually confirmed by Admin screenshot**.
2. Stored concept and source references surfaced in the chat: **visually confirmed**.
3. Runtime crash caused by string-valued applicability: **fixed**, with 321 passing tests.
4. Knowledge source-card layout: **fixed in code; staging deployment confirmation pending**.
5. Player-specific application with no measurement supplied: **not yet accepted**. MESSINHO must explain the metric, request the measured VO2max value and test modality, and avoid fabricating a player rating.
6. Full knowledge-ingestion readiness: **not yet declared** until the player-application check, source rendering retest, and final role/data-isolation checks are complete.

### Next work plan (continue, do not repeat completed tasks)
1. Confirm Render deployment `dep-dc4a3nc9v7es73eahqh0` is LIVE on `cf396444ab831d5c3f41f79aee0e5cab52bb6e0e`; verify health and absence of the previous runtime exception.
2. Admin retest the VO2max foundation question once more and verify that the concept, classification, and two source links are visually separated and readable on mobile.
3. Ask a player-specific question without providing a measurement; verify that MESSINHO asks for the actual measurement and test modality and does not invent an assessment.
4. Inspect the exact response metadata and source evidence quality; confirm only active, approved knowledge is reused and source links are relevant.
5. Run final Admin/Scout permission and tenant-isolation regression checks for knowledge read/review; candidates remain inactive until authorised Admin approval.
6. Only after steps 1–5 pass, mark the VO2max pilot acceptance complete and begin the first planned systematic knowledge import. Keep the import limited to the agreed pilot scope, with evidence, source-rights verification, deduplication, conflict handling, versioning, durable storage, and explicit Admin release.
7. Expand to further knowledge domains only after the pilot demonstrates retention, retrieval, explanation, application, and forecast limitations without fabricated evidence.

### Binding project rules reaffirmed
- Project: **myScoutingDatabase** only; MESSINHO is its integrated autonomous scouting-intelligence module, not a separate product.
- Work only on `feature/messinho-unified-ai-integration` and the dedicated MESSINHO STAGING service.
- Never modify production, `main`, PFMS, or PFSS.
- Read this checkpoint and inspect current GitHub/CI/Render state before continuing; do not repeat completed tasks.
- Preserve the established black/navy and gold premium visual design, responsive mobile layout, clear source presentation, and uncluttered workspace.
- No unreviewed knowledge activation, no automatic approval, no unsupported claims of permanent knowledge, and no fabricated sources or player metrics.
- Document every completed change, test, deployment, failure, and next action in this file.


### UI deployment confirmation — 2026-11-26 22:20 CET
- Render deployment `dep-dc4a3nc9v7es73eahqh0` finished with status **LIVE**.
- Deployed code commit: `cf396444ab831d5c3f41f79aee0e5cab52bb6e0e`.
- Render build logs confirm **321 tests, 321 passed, 0 failed**, successful Vite production build, application startup, Supabase HTTP 200, and service live.
- Dedicated MESSINHO staging URL: `https://myscoutingdatabase-messinho-staging.onrender.com`.
- The new knowledge result layout is now deployed to STAGING. Admin visual retest of the separated source list remains outstanding.
- Latest documentation checkpoint commit before this confirmation: `07bb8f9022c04e93b16d399f7558f253391de10e`.


## Admin acceptance test 2 — VO2max transfer/application — 2026-11-26 22:23 CET

### User-provided staging screenshots
The Admin asked:
`Wie kann ich die VO2max eines Fußballspielers für die Leistungsbewertung nutzen? Welche zusätzlichen Informationen benötigst du, um seine Ausdauerleistungsfähigkeit seriös einzuschätzen?`

The screenshots show MESSINHO explicitly stating that it retrieved the approved foundation knowledge from its knowledge network and presenting the saved VO2max definition, application, and limitations. It correctly states that the value must be interpreted together with age, sex, body mass, training status, test procedure, and sport-specific demands. It distinguishes an estimated VO2max from a direct spiroergometry/CPET measurement and warns against inferring overall football, tactical, technical, positional, or health quality from this one value. The approved knowledge concept and two source titles are displayed in the dedicated, readable knowledge card, with the `sports_science · foundational` classification.

### Evaluation
- Foundation retrieval and source-card presentation: **accepted by visual Admin evidence**.
- Basic transfer of the foundation into football-scoping context: **partially demonstrated**. The answer gives relevant application context and limitations.
- Required follow-up behaviour: **not yet accepted**. In the visible answer MESSINHO lists the factors but does not explicitly ask the user for the missing player-specific data (actual measured value, unit, test protocol/modality, date, and relevant context). The test asked which additional information is needed; the answer should close with a concise request for these inputs, or explicitly say it cannot assess a particular player without them.
- No player-specific score or unsupported medical conclusion is visible; this is correct.

### Project status and next actions
1. Do not repeat the already-passed generic VO2max foundation retrieval test.
2. Improve the application response behaviour so that, after explaining the stored foundation, MESSINHO identifies missing inputs and asks a targeted follow-up. Minimum inputs: measured or estimated VO2max value and unit (normally ml/kg/min), measurement method/test protocol (e.g. direct CPET/spiroergometry vs estimate/field test), test date, and relevant age/training/position context. Request only the necessary details; do not demand sensitive health information unrelated to the scouting purpose.
3. Add automated regression tests: a player-application question without a supplied measurement must trigger a clarification request; no player rating may be fabricated; a supplied estimate must remain labelled as estimated; direct CPET must be distinguished from prediction/field-test values; missing age/test context must lower confidence or prompt clarification.
4. Keep answer content grounded in the approved knowledge entry and its cited evidence. Do not silently substitute external search results for the approved stored foundation. External research may supplement only when the user asks for current/additional evidence or the knowledge is insufficient, and must be clearly separated.
5. Re-run staging acceptance on mobile and inspect the complete response and metadata.
6. Then run the final Admin/Scout permission and tenant-isolation tests. Only after these pass may the VO2max pilot be declared complete and the systematic first knowledge import begin.

### Current gate
The knowledge foundation is being retrieved and displayed correctly, and its basic application to football scouting is partly demonstrated. **The pilot is not yet fully accepted** because MESSINHO has not yet shown the required targeted clarification behaviour. No broad knowledge import is authorised yet.

### Rules unchanged
All existing branch, staging-only, security, approval, no-repeat, black/navy-and-gold design, and PROJECTSCOUT documentation requirements remain binding. Production, `main`, PFMS, and PFSS remain untouched.


## MESSINHO VO2max application follow-up — implementation and CI checkpoint — 2026-11-26 22:32 CET

### Implemented on the feature branch
- Added the provider-independent helper `buildMessinhoKnowledgeApplicationFollowUp` in `backend/messinho-conversation.js`.
- Connected the helper to the existing canonical approved-knowledge response path in `backend/server.js`. It runs only when the approved VO2max concept is the matched canonical concept and the question expresses an application/assessment intent.
- The response now keeps the approved knowledge explanation and adds a targeted follow-up rather than merely listing factors.
- Missing information is requested by field: measured VO2max and unit, test modality (direct CPET/spiroergometry vs estimate/field test), measurement date, age, playing position, and training context. Already supplied values/player context are not requested again.
- Direct measurement and estimated/field-test values are explicitly distinguished. If an absolute L/min value is supplied, body mass is identified as needed for relative normalization.
- The helper explicitly prohibits creating a score or inventing a missing VO2max value. A single fitness metric is not converted into an overall, positional, or talent rating.
- Basic definition questions do not trigger an unnecessary follow-up. The helper does not execute a medical diagnosis or ask for unrelated sensitive health information.

### Regression coverage and verification
- Added five targeted tests covering: application clarification, basic-definition non-interception, estimated value classification, direct CPET distinction, and unrelated knowledge-domain isolation.
- The first application implementation commit tested by GitHub Actions was `413882077570878aa52494b0e79c66619ca90b31`; the continuation and exact-age safeguards below supersede it.
- GitHub Actions: all four checks **success** (combined tests/backend syntax/build, dedicated backend syntax, test suite, and health).
- Node suite: **326 passed, 0 failed**.
- Backend JavaScript syntax: passed.
- Vite production build: passed; 1,637 modules transformed.
- Intermediate failures during development (regex escaping and two German inflection variants) were diagnosed from CI logs, corrected on the same feature branch, and are not present in the final tested commit.

### Current staging and database audit
- Dedicated Render service: `myscoutingdatabase-messinho-staging` (`srv-dc3chlqjnfac73acd6ig`), branch `feature/messinho-unified-ai-integration`, auto-deploy disabled.
- Currently deployed version before this follow-up: `cf396444ab831d5c3f41f79aee0e5cab52bb6e0e`, deployment `dep-dc4a3nc9v7es73eahqh0`, status **LIVE**. The new application-follow-up code has not yet been deployed; manual STAGING deployment is required after the documentation checkpoint CI passes.
- Supabase target audited: `myScoutingDatabase-staging` (`nwqwnrhupbyhshsprxjt`), status **ACTIVE_HEALTHY**, region `eu-central-1`. Latest applied migration: `20261126184821_messinho_knowledge_conflict_episode_state`.
- Player-table RLS policies enforce Admin visibility and approved Scout owner-only visibility; UPDATE policies include both USING and WITH CHECK.
- Candidate-table policies enforce owner access or the database's private Admin predicate. MESSINHO agent memory/tasks/traces are owner-scoped or service-mediated. Knowledge review/approval endpoints require an authenticated, approved Admin.
- Seven MESSINHO knowledge/diagnostic tables have RLS enabled, no direct policies, and no anon/authenticated table grants; access is intentionally restricted to the server's service-role path. This explains the informational `rls_enabled_no_policy` advisor finding and is not an open client-access grant.
- The per-user `messinho_knowledge_memory` table has owner-bound authenticated policies (auth.uid() = owner_id).
- Remaining Supabase advisor notices: the legacy `admin_set_scout_approval(uuid,boolean)` SECURITY DEFINER function is executable by authenticated users, but its body checks non-null auth.uid() and `private.is_admin()` before updating; the Auth leaked-password protection setting is disabled. These were audited but not changed as part of this VO2max task.
- No authenticated live Scout/Admin browser session was available in this execution, so end-to-end UI permission tests remain distinct from the static code, CI, RLS, and grants checks.

### Acceptance status and next steps
1. Application clarification logic: **implemented and CI-verified**.
2. Direct CPET versus estimated value handling: **implemented and regression-tested**.
3. Fabricated values/ratings: **explicitly blocked by helper contract and regression-tested**.
4. New application behaviour on Render STAGING: **pending manual deployment and live Admin retest**.
5. Mobile response/source-card visual check: **pending after deployment**.
6. Authenticated Admin/Scout end-to-end and cross-tenant tests: **pending controlled sessions**; database RLS/grants and server role gates have been inspected.
7. VO2max pilot: **not yet fully accepted**. Keep the systematic knowledge import blocked until the live staging response and authenticated role/tenant tests pass.
8. After this documentation commit's CI succeeds, manually deploy only to the dedicated Render STAGING service; verify deployment SHA, LIVE state, health, and runtime logs. Then request the concise Admin application retest and complete the remaining permission/tenant acceptance.

### Safety boundaries reaffirmed
- No Supabase schema/data changes were made during this audit.
- No Render production service, `main`, PFMS, or PFSS was changed.
- The Draft PR remains unmerged. No merge or production release is authorised.
- Continue on `feature/messinho-unified-ai-integration`; retain the black/navy/gold design and all existing approval, provenance, and no-fabrication rules.


### Follow-up continuation and exact-age hardening — 2026-11-26 22:32 CET
- The clarification is now resumable on the immediately following chat turn: only when the latest assistant message is the VO2max clarification and the new user message contains a plausible VO2max data field does the canonical VO2max route reuse the prior user question and approved concept. Unrelated messages are not intercepted.
- Each follow-up answer is checked against the missing fields again; already supplied value, modality, date, age, position, and training context are not asked for again.
- A birth year alone is no longer treated as an exact age because the birthday may not yet have occurred. MESSINHO requests the actual age unless an age value is explicitly supplied.
- When all fields are present, the response is limited to descriptive/methodological context. The active STAGING knowledge graph currently contains one active VO2max concept at foundational level (version 3) and no approved comparative reference dataset. The response therefore explicitly withholds norm ranking, percentile and player score.
- Added regression coverage for birth-year ambiguity and continuation of the user's supplied VO2max data across the next chat turn.
- Latest code commit: `d5c327e3238741016df920f6609cc497fa6ec73f`.
- Latest code CI: all four checks **success**; Node suite **328 passed, 0 failed**; backend syntax passed; Vite production build passed with 1,637 modules transformed.
- At the time of this implementation checkpoint the code was not yet deployed; the manual STAGING deployment is recorded in the deployment confirmation below.
- Next: after the documentation-only commit's CI succeeds, manually deploy the tested feature-branch head to the dedicated STAGING service, verify LIVE SHA/health/logs, then complete the Admin live retest and authenticated Scout/Admin isolation acceptance. The VO2max pilot and systematic knowledge import remain gated until those checks pass.


### Manual STAGING deployment confirmation — 2026-11-26 22:34 CET
- Documentation/branch commit deployed: `fd742a27352d88e9de9b666227761de297c0071e` on `feature/messinho-unified-ai-integration`. It contains the follow-up continuation and exact-age safeguards from code commit `d5c327e3238741016df920f6609cc497fa6ec73f`.
- Render deployment: `dep-dc4ab6t6e07s73ekq74g`.
- Render status: **LIVE**. The prior deployment was deactivated only on this dedicated STAGING service.
- Render build logs confirm **328 tests, 328 passed, 0 failed**, successful Vite production build (1,637 modules transformed), and the Render message **Your service is live**.
- Post-deploy Render error-level log query returned no error entries. Render did not provide request logs in the queried interval; therefore this confirms deployment/startup status, not an authenticated chat acceptance test.
- Dedicated STAGING URL remains: `https://myscoutingdatabase-messinho-staging.onrender.com`.
- Production, `main`, PFMS and PFSS remain untouched.

### Required live Admin acceptance after deployment
1. In the STAGING chat, repeat the player-application question from the preceding acceptance checkpoint. Expected: the approved VO2max explanation is retained and MESSINHO explicitly requests the missing value/unit, test modality, date, age, position and training context.
2. In the immediate next turn, provide clearly labelled test data, for example: `56 ml/kg/min, direkt per CPET am 26.11.2026 gemessen; Spieler 19 Jahre, Mittelfeld, Profi.`
3. Expected continuation: MESSINHO carries forward the previous question, does not ask again for fields already supplied, and reports that only descriptive/methodological context is available. Since the active knowledge graph currently contains foundational VO2max knowledge only and no approved comparative norm dataset, it must not invent a percentile, norm ranking, or player score.
4. Confirm that a reply unrelated to VO2max is not intercepted by the pending clarification logic.
5. Repeat with an approved Scout account and confirm that Scout access is limited to its own player data; verify that only an approved Admin can open the knowledge-review queue or approve/reject knowledge.
6. Record the screenshots/results and then decide whether the VO2max pilot can be accepted. Do not begin the systematic knowledge import until the live follow-up and authenticated role/tenant checks pass.

### Current gate — after deployment
- Application follow-up code, continuation handling, and exact-age safeguard: **implemented, regression-tested, deployed to STAGING**.
- CI: **all four checks green**; Node suite **328/328**; backend syntax and Vite build successful.
- Render: dedicated STAGING deployment **LIVE**.
- Live authenticated Admin/Scout acceptance and cross-tenant UI verification: **still outstanding**.
- VO2max pilot: **not yet fully accepted**.
- Systematic knowledge import: **still blocked pending the acceptance checks above**.


### VO2max continuation routing regression fix — 2026-11-26 22:38 CET
- Re-audited the current canonical knowledge route and the existing follow-up continuation implementation rather than repeating the prior pilot work.
- Found a real second-turn routing defect: the route correctly combined the original VO2max question with the user's newly supplied measurements, but the canonical knowledge lookup still received only the latest short answer (for example, 56 ml/kg/min). That could cause the active VO2max concept not to be found and prevent the promised continuation.
- Fixed the route so the canonical knowledge lookup uses the combined original question plus the new data.
- Added the pure helper buildMessinhoVo2maxApplicationQuery to validate the pending assistant prompt, preserve the prior question and accept only a plausible VO2max data reply. The route uses this helper; unrelated messages are not treated as continuation data.
- Added regression coverage for preserving the original question and rejecting unrelated replies.
- One CI run exposed an invalid regex escape in the new test; corrected it. The following run exposed an unresolved cross-module helper reference; removed that unnecessary dependency because the server route already selects the prior question by canonical VO2max concept. These were fixed before the final green run.
- Latest code commit: 7a86c60ee582ce749f5a1ff571e2f849952280eb.
- Final CI for that code commit: all four checks success (combined regression/syntax/build, dedicated backend syntax, test, health). Node test suite: 329 passed, 0 failed. Backend syntax passed.
- This fixes the continuation lookup path, but it does not constitute live authenticated Admin/Scout acceptance. Do not infer that the VO2max pilot is accepted solely from CI.
- Current dedicated Render STAGING deployment remains dep-dc4ab6t6e07s73ekq74g / commit fd742a27352d88e9de9b666227761de297c0071e; it does not yet contain code commit 7a86c60. Manual deployment of the tested feature-branch head is required after this documentation commit's checks pass.
- Supabase staging audit was read-only. It confirmed player owner/Admin RLS gates and service-mediated access for knowledge-review tables. The Admin knowledge review endpoints enforce approved Admin role checks. Remaining advisor notices (legacy Admin SECURITY DEFINER RPC callable by authenticated but guarded internally; leaked-password protection disabled) remain recorded for separate hardening; no database grants, schema, or data were changed in this task.
- Next: wait for this documentation commit's CI, manually deploy the tested branch head to the dedicated Render STAGING service only, verify the deployed SHA and LIVE status, then complete live Admin/Scout continuation and tenant-isolation acceptance. Keep the VO2max pilot and systematic knowledge import gated until those acceptance checks pass.
- Production, main, PFMS and PFSS remain untouched; no merge or production release is authorised.


### Manual STAGING deployment — VO2max continuation routing — 2026-11-26 22:39 CET
- Manually deployed the tested feature-branch head to the dedicated Render STAGING service only.
- Render deployment: dep-dc4adi17lnhs73fs0e1g.
- Deployed branch commit: 0ca88b161f5cde8bf4b24db23ffdb05186020ab1 (documentation commit containing tested code commit 7a86c60ee582ce749f5a1ff571e2f849952280eb).
- Render deployment status: LIVE; build status succeeded; deploy-ended event confirmed success.
- Build log confirms Node suite 329 passed, 0 failed; Vite production build successful with 1,637 modules transformed.
- Runtime startup log confirms Node API listening on port 10000, Supabase Data API returned HTTP 200, and Render reported “Your service is live”.
- Dedicated STAGING URL: https://myscoutingdatabase-messinho-staging.onrender.com.
- CI for code commit 7a86c60ee582ce749f5a1ff571e2f849952280eb: all four checks success (test, backend syntax, health, combined regression/syntax/build).
- No authenticated Admin or Scout browser session was available to perform the live chat follow-up or cross-tenant UI test. Deployment health is not equivalent to feature acceptance.
- Current gate: continuation routing fix is implemented, regression-tested and LIVE on STAGING; VO2max pilot remains pending live Admin/Scout acceptance, role checks and tenant-isolation tests. Systematic knowledge import remains blocked.
- Production, main, PFMS and PFSS remain untouched. No merge or production release is authorised.



### STAGING incident and runtime fix — 2026-11-26 23:03 CET
- Owner supplied a screenshot of the authenticated Admin chat. The VO2max application question returned the UI error “Messinho konnte die Anfrage gerade nicht bearbeiten.”
- Render application logs identified the exact runtime exception: `Messinho agent chat failed: buildMessinhoVo2maxApplicationQuery is not defined` at 2026-11-26T22:01:25Z.
- Source review confirmed that `backend/server.js` called `buildMessinhoVo2maxApplicationQuery(...)` in the canonical VO2max continuation route but omitted it from the named import from `./messinho-conversation.js`. The helper itself is exported from that module and its unit regression test exists; the missing route-level import was not caught by the existing tests.
- Fixed only the missing named import in `backend/server.js`. No database, schema, permissions, user data, or production resources were changed.
- Fix commit: `56c65555000fa8ccb7b5c3238ea80dd19201aa62` — “Fix missing VO2max continuation helper import”.
- Deployed manually to the dedicated STAGING Render service only:
  - Service: `myscoutingdatabase-messinho-staging` (`srv-dc3chlqjnfac73acd6ig`)
  - Deployment: `dep-dc4aotdg1s2s73dr7e4g`
  - Commit: `56c65555000fa8ccb7b5c3238ea80dd19201aa62`
  - Status: `LIVE`; build succeeded.
  - Build test output: 329 passed, 0 failed; Vite production build succeeded (1,637 modules transformed).
  - Runtime startup: API listening on port 10000; Supabase Data API HTTP 200; Render “Your service is live”.
- The runtime exception was confirmed from the pre-fix log. The post-fix deployment starts successfully. A browser-authenticated repeat of the exact Admin chat request is still required to prove the user-facing route now completes; this environment has no authenticated browser session. Do not claim the VO2max pilot is accepted yet.
- Next acceptance step: owner refreshes the STAGING page (hard reload / reopen), repeats the same Admin question, and shares the reply. If the first turn returns the targeted clarification, supply the requested VO2max data in the next turn to verify continuation. Then complete the Scout and tenant-isolation checks.
- Systematic knowledge import remains blocked until live Admin/Scout acceptance passes. Production, `main`, PFMS and PFSS remain untouched; no merge or production release was made.


### VO2max knowledge retrieval miss after runtime fix — 2026-11-26 23:06 CET
- Owner repeated the Admin chat test after the missing helper import was fixed. The chat route now returns a normal MESSINHO response instead of the previous generic processing error.
- New live result: MESSINHO identifies the question as a foundation question but reports no active approved knowledge entry. This is a retrieval defect, not a missing database record.
- Read-only Supabase inspection of project `nwqwnrhupbyhshsprxjt` confirmed that `messinho_knowledge_concepts` contains the canonical record `sports_science.physiology.vo2max`, status `active`, validity open-ended, confidence 0.880, evidence grade B, two rights-verified sources and one claim corroborated by both sources. No status or data mutation was made.
- Source review found the broad lookup applied a PostgREST validity OR expression and then used a similar expression in the canonical exact-key fallback. The exact canonical fallback should not depend on the broad query's OR filter.
- Changed `backend/messinho-knowledge-graph.js`: canonical fallback now queries the exact active concept key without the broad validity OR expression and enforces `valid_until` in application code. It still requires `knowledge_status='active'`; it does not promote candidates or bypass approval.
- Added regression test in `tests/messinho-knowledge-graph.test.js` to verify that an exact active VO2max concept remains retrievable when the broad query returns no rows.
- Code commit: `263f7d14b2d13e839f331ea8d149390b1f55ade3`.
- Test commit: `63729e3954c3058bfd109780aedbc96ce7009852`.
- Dedicated STAGING deployment triggered for tested branch head: `dep-dc4aqkui0phs739lagkg`, commit `63729e3954c3058bfd109780aedbc96ce7009852`. At time of this note the deployment was still building; verify final status before claiming LIVE.
- Next: verify Render build output and 330-test count; once LIVE, owner repeats the exact Admin question. Expected: MESSINHO retrieves the active VO2max foundation, explains the concept with source evidence, then asks only for player-specific inputs. Continue with the second-turn test data and then Scout/tenant isolation.
- Do not change the active knowledge row, rights, sources, or review status to mask a retrieval problem. Systematic knowledge import and VO2max pilot acceptance remain gated.
- Production, `main`, PFMS and PFSS remain untouched.


### Repeated live VO2max miss — runtime database diagnostics — 2026-11-26
- Owner repeated the Admin test after deployment `63729e3`; the same fallback response persisted.
- Render application logs show two further canonical lookup misses at 22:07:47Z and 22:09:54Z. Therefore the exact-key fallback change alone did not resolve the live issue.
- Read-only SQL still confirms the canonical concept exists in Supabase project ref `nwqwnrhupbyhshsprxjt`; however, the running Render process may be connected to a different Supabase project or the runtime query may return no row due to its effective database context. This has not yet been proven.
- Added privacy-safe runtime diagnostics around the exact-key lookup: number of returned rows, returned knowledge statuses/domains, active-valid boolean, and query error code only. No knowledge text, source content, credentials, user data or IDs are logged.
- Diagnostic commit: `4f7d00920eb6ecdb9dc7137141145011a3bddb62`; STAGING deployment `dep-dc4asoe1egvs73frm670` triggered. Verify build and LIVE state, then reproduce once and inspect the diagnostic log before making further changes.
- Next root-cause branch:
  1. `rows=0`: verify Render's configured Supabase project hostname/ref matches the project where SQL found the concept; never expose secret values. Check server-role grants/RLS only after confirming project identity.
  2. `rows>0`, status not active: inspect the exact returned status and environment/data divergence.
  3. `active_valid=true` but UI still misses: inspect route canonical key filtering and response construction.
- Do not insert, approve, duplicate or modify the VO2max knowledge record to mask this retrieval defect. No production changes. Knowledge import and pilot acceptance remain blocked.


### Admin screenshot reproduced — canonical lookup hardening — 2026-11-26 23:15 CET
- Owner repeated the Admin question after the safe-diagnostic deployment; screenshot confirms the same guarded “no active approved entry” response.
- Render log for this request (22:15:47Z) again shows the canonical VO2max miss. The expected detailed row-count diagnostic was not present in the captured runtime log, so the previous hypothesis about DB project mismatch is not confirmed.
- Source-path review confirms the route requires the exact canonical concept key in the result returned by `findMessinhoKnowledgeConcepts`. To remove dependency on broad lexical ranking, domain filtering, and result limits, canonical concepts are now fetched through an independent exact-key query on every canonical question; only `knowledge_status='active'` records with non-expired validity are promoted to the top of the result list. The ordinary broad query remains for related concepts.
- Added a regression test proving the exact canonical query runs even when broad results already contain a noncanonical row. Existing tests continue to cover exact fallback and Unicode VO₂max matching.
- Code/test commit: `92ff4e8bd3de089d30166dc9c7f42228f0c09651` (includes the unconditional exact-key retrieval patch from `e1205c5`).
- Dedicated STAGING deployment: `dep-dc4b01bl550s738nhlug`, triggered at 22:17:41Z. Verify build/test output and LIVE status before requesting another user test.
- No DB rows, approval states, rights, or source records were modified. No production changes. Pilot acceptance and systematic knowledge import remain blocked until a successful authenticated Admin response and subsequent Scout/tenant isolation checks.


- Deployment verification update: `dep-dc4b01bl550s738nhlug` completed successfully at 22:18:17Z and is `LIVE` on the dedicated STAGING service. Runtime startup banner confirms service live. This deployment includes code/test commit `92ff4e8`; documentation-only follow-up is on branch HEAD.


### Root cause identified — first-turn VO2max query was null — 2026-11-26 23:47 CET
- Owner's latest Admin screenshot again showed the guarded canonical knowledge miss.
- Render runtime log at 22:46:12Z confirms the canonical route returned `miss`. The running service's Supabase startup log identifies the same project host/ref as the project checked read-only in Supabase, ruling out a simple wrong-project URL mismatch.
- Exact source-level root cause found in `backend/server.js`: `buildMessinhoVo2maxApplicationQuery(previousQuestion, reply, latestAssistantText)` intentionally returns `null` on a first-turn question because there is no prior assistant clarification. The route nevertheless passed that nullable continuation-only value into `findMessinhoKnowledgeConcepts`, even when `currentCanonicalConceptKey` had correctly identified the current VO2max question. Thus the canonical matcher inside the knowledge graph received an empty/null query and never ran its exact-key lookup.
- Corrected route flow:
  - Keep `vo2ApplicationContinuationQuery` nullable and use it only to detect a valid second-turn data reply.
  - Set `knowledgeApplicationQuestion = vo2ApplicationContinuationQuery || interpretedMessage`, so a first-turn canonical question is always searched using its own text.
  - Preserve strict continuation gating; unrelated messages are not misclassified as VO2max data replies.
- Fix commit: `4a234660114e8caa23872dd5d135608d0250fdf8`.
- Manual deployment to dedicated STAGING triggered: `dep-dc4bdtlg1s2s73dt5f50` at 22:47:18Z. Verify build and LIVE status, then check runtime canonical lookup diagnostic. No user retest until deployment is LIVE and runtime evidence is checked.
- No Supabase data, knowledge approval, source rights, production, main, PFMS or PFSS changes.


- Deployment verification: `dep-dc4bdtlg1s2s73dt5f50` is `LIVE` (finished 22:47:53Z); build succeeded; runtime started on port 10000 and Supabase Data API returned HTTP 200. The code commit deployed is `4a234660114e8caa23872dd5d135608d0250fdf8`. User-facing retest is now requested; no claim of pilot acceptance until response is verified.


### Definitive VO2max retrieval root cause and fix — 2026-11-26 23:51 CET
- Owner's screenshot at 23:48 CET still showed the canonical knowledge miss. Render runtime diagnostic at 22:48:55Z showed `rows:1`, `domains:["sports_science"]`, but `statuses:["missing"]` and `active_valid:false`.
- This proved the exact database query returned a row, but the status field was not included in the PostgREST `.select(...)` projection. Both the broad and exact projections in `backend/messinho-knowledge-graph.js` omitted `knowledge_status`, while `rank()` and the exact result validation explicitly read `record.knowledge_status === 'active'`. The property was therefore `undefined` and the genuine active row was discarded. This is the definitive cause.
- Fixed both projections by explicitly selecting `knowledge_status`. No database status or permissions were changed; the active concept remains governed by its existing approval.
- Strengthened tests to assert that the broad and exact query projections both include the status field.
- Code commit: `b337b8da8458c5355ad09ab7188f76530382197b`.
- Test commit / deployed feature-branch head: `67f698405b2fe6c0e7a7b9d4758d5bae1bcb0256`.
- Render deployment: `dep-dc4bfad6e07s73eo32ig`, completed successfully and **LIVE** at 22:51:06Z on dedicated STAGING service only.
- Build verification: Node test suite **331 passed, 0 failed**; build output includes successful frontend production build; runtime starts on port 10000 and Supabase Data API responds HTTP 200.
- Next acceptance: owner repeats the canonical VO2max question in authenticated Admin STAGING chat. Expected result is the stored concept explanation and a focused request for missing player-specific test details. Then provide the requested data in the immediate next turn to test continuation. Scout role and tenant isolation acceptance remains required.
- The corrected code is deployed, but the user-facing conversation has not yet been re-tested after this final fix. Do not claim pilot acceptance. Knowledge import stays gated. No production, `main`, PFMS, PFSS, or Supabase data mutations.


### VO2max foundation pilot — first authenticated Admin round successful — 2026-11-26 23:52 CET
- Owner supplied four screenshots from the Admin chat after deployment `67f6984`.
- The exact VO2max foundation retrieval is now successful: MESSINHO explicitly states it retrieved approved foundation knowledge, explains VO2max, provides football-scouting applicability and limitations, asks for the required player-specific inputs (measurement with unit, test method, date, age, position, training status), avoids generating a score, and displays the two stored specialist sources in the knowledge card.
- This confirms the prior status-field projection defect is fixed in the live Admin first-turn path. The first round of the VO2max pilot has passed.
- Screenshot review also identified a presentation defect: literal `\\n\\n` escape sequences were shown in the response instead of line breaks, and array/object knowledge values were concatenated with semicolons. Fixed the canonical response string to use actual newlines and changed structured arrays/objects to readable multiline formatting.
- Added regression expectations for multiline knowledge formatting. Commits: `fa573ce1223aff44a3d78edd3c4539f63f4c8713` (response line breaks), `ff3310e778209fc4bb34846d1fcb75f11bf4b9ea` (formatter), `c632d7dfee9bed5679353143780a7b5eac59d523` (formatter tests).
- Deployment `dep-dc4bh0lg1s2s73dte15g` triggered for STAGING commit `c632d7d`; verify build and LIVE before asking owner to assess presentation.
- Remaining pilot acceptance: verify second-turn follow-up with real player data, then test Scout role and tenant isolation. Do not yet start the systematic knowledge import.
- No production changes and no Supabase knowledge records, rights or approval state modified.


- Formatting cleanup verification: deployment `dep-dc4bh0lg1s2s73dte15g` completed successfully and is **LIVE** on STAGING at 22:54:31Z. Build log confirms **331 tests passed, 0 failed** and Vite production build completed in 2.46s. This deploy includes the actual-newline reply fix and multiline structured-value formatter.


### Quality review — VO2max answer is correct but not yet scout-grade — 2026-11-27
- Owner reviewed the first-turn answer and correctly identified that it is not satisfactory as a practical scouting answer. The screenshots show a definition, one generic applicability sentence, limitations and a request for six inputs; they do not show an evidence-based evaluation framework or actionable interpretation.
- Read-only inspection of the active canonical database record confirms its current evidence base is thin: one broad claim and two sources. The sources are (1) a 2023 validation of prediction models in recreational/elite endurance athletes, and (2) a 2022 clinical cardiovascular-fitness review. They support general VO2max/cardiorespiratory-fitness concepts and caution about prediction methods, but they do not adequately support football-specific positional evaluation or scouting benchmarks.
- Independent research for the football-specific evidence gap identified:
  - Asimakidis et al. (2025), systematic review of aerobic fitness and repeated-sprint testing in elite male soccer: treadmill VO2max median 58.2 mL/kg/min; field tests such as Yo-Yo IR1/IR2 common; 30–15 IFT and submaximal protocols emerging; review notes limitations in reliability/sensitivity and inconsistent elite-player definitions.
  - Slimani et al. (2019), network meta-analysis of 2,385 male soccer players across 16 studies: higher competitive level associated with higher VO2max; position and age effects reported, but substantial heterogeneity and protocol variation require cautious interpretation.
  - Altmann et al. (2020), study of 136 German first-/second-division players: goalkeeper vs outfield differences; no statistically significant differences among outfield positions in the measured lactate-threshold parameters; training should reflect match-running demands.
  - A 2020 professional-football study reported no association between the examined aerobic-fitness measures and game-performance indicators in its small sample (n=16), and concluded that thresholds may be more informative than VO2max alone for some positional comparisons.
- Important exclusion: a frequently surfaced 2018 review on test specificity is marked RETRACTED and must not be used as evidence.
- Required upgrade before this concept can be considered scouting-ready:
  1. Expand the knowledge graph into separately sourced claims: what VO2max measures; direct CPET vs estimated/field values; football-specific reference distributions; role/position context; aerobic thresholds and running economy; intermittent endurance/repeated high-intensity recovery; longitudinal monitoring and measurement error; limits for talent selection.
  2. Attach evidence metadata to every claim (population, sex, age/level, sample size, protocol, study type, publication date, limitations, source URL/license) and distinguish meta-analysis/systematic review from small observational studies.
  3. Never present a study median or position average as a hard selection cutoff. Require comparable cohorts and test protocols; if comparability is absent, state that no valid percentile/rank can be assigned.
  4. Replace the current canned response with a structured scout-grade synthesis: short conclusion; what the value can/cannot say; contextual comparison only where justified; complementary tests; confidence/evidence gaps; practical next steps and focused missing-data questions.
  5. For a player case, request body mass when absolute L/min is supplied, sex/competition level and protocol details where relevant, and test conditions/date. For longitudinal comparisons, require the same protocol and consider normal measurement variability.
  6. Add regression tests for evidence qualification, no invented norm/rank, role-context caution, direct-vs-estimated separation, and useful action recommendations.
- Current state: first-turn canonical retrieval is working on Admin STAGING, but the answer quality is only a foundation-level explanation, not acceptance of the intended autonomous scouting analysis. The second-turn player-data continuation has not yet been tested. Scout role and tenant isolation are still pending. No knowledge record was changed or approved as part of this review; systematic import remains gated.
- Web research sources reviewed for this quality assessment: Asimakidis et al. 2025 (Sports Medicine; https://pmc.ncbi.nlm.nih.gov/articles/PMC12106594/); Slimani et al. 2019 network meta-analysis (https://pmc.ncbi.nlm.nih.gov/articles/PMC6458571/); Altmann et al. 2020 German professional cohort (https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2020.549897/full); professional-player aerobic fitness/game indicator study (https://pmc.ncbi.nlm.nih.gov/articles/PMC7644917/). Retracted 2018 review explicitly excluded.


## Technical Intelligence Foundation — initial implementation — 2026-11-27
- User approved building programming/software-development knowledge before granting MESSINHO any self-modification or code-execution capability.
- Added `docs/MESSINHO_TECHNICAL_INTELLIGENCE_CURRICULUM.md`: seven progressive levels from computational foundations and programming fundamentals through Python/JavaScript/TypeScript/SQL, professional engineering, data/security/operations, AI systems and finally controlled engineering autonomy. It defines mastery evidence, assessment standards, repository-specific synthetic labs and explicit execution/safety gates.
- Added machine-readable candidate package `knowledge-candidates/messinho-technical-intelligence-foundations.v1.json` with 10 original compact concept candidates: computational thinking, algorithms, data structures, Python, JavaScript/TypeScript, relational databases, HTTP/APIs, automated testing, secure software development, and retrieval/RAG/agent architecture.
- All candidate package entries are explicitly `candidate`; source rights are `pending_review`. URLs are references only, no source full text was copied. The package is not imported into Supabase and cannot be treated as trusted/active knowledge until exact-work rights, attribution, AI/TDM, commercial and derivative-use checks pass in the rights registry.
- Expanded `classifyMessinhoKnowledgeDomain` to route common technical terms (Python, JavaScript, TypeScript, SQL/PostgreSQL, Supabase, React, Node.js, APIs, Git/GitHub, debugging, testing, CI/CD, DevOps, security, RAG, embeddings and data structures) to `computer_science`.
- Added `tests/messinho-technical-intelligence.test.js` to cover technical-domain routing and ensure football/sports-science questions retain their dedicated domains.
- Commits: classifier `9e6c01c778065c25f7ab151b30c205a6db20424d`; routing tests `0161414a8ce9bc9770497d87dc865a65c2ec6e50`; curriculum `fe58baf80b86023e204a56f58198cc67dadfb5e3`; candidate package `5c228afee00ab4bb3ebea44ef6b94a7449da5711`.
- Safety boundary: no code-execution agent, self-modification, production access, deployment permission, Supabase data write or knowledge activation has been enabled. The initial package is a versioned curriculum/candidate foundation only.
- Next steps: verify CI; review and register exact source rights; expand candidate coverage into detailed language, algorithms, architecture, testing, database, security and AI concepts; build prerequisite relationships and task-based mastery assessments; only then submit small batches for Admin review and STAGING retrieval tests.
- The VO2max second-turn continuation and Scout/tenant-isolation pilot tests remain open. Technical curriculum preparation does not waive those pilot gates.


- Initial STAGING build for the technical curriculum failed at 332/333 tests: the new domain-routing test exposed an existing German compound-word gap (`Fußballspieler` was not classified as `football`). The technical-language routing test passed.
- Corrected the football classifier to recognize German compounds (Fußballspieler, Spielerprofile, Transfermarkt, Mannschafts- etc.) and added a regression case for Innenverteidiger/Fußball-Scouting. No production or database changes. Follow-up STAGING build required before declaring this implementation deployed.
- Follow-up code commits: `264e96677db7467e79f97b886ec78560547a16ff` (compound-word classifier), `03a5ff480e560ab98aa44a46e6448f55231ae880` (regression test).


- Follow-up STAGING verification: corrected German compound-word routing passed; final build ran **333 tests, 333 passed, 0 failed**; Vite production build succeeded (2.31s); API process started and Supabase Data API returned HTTP 200. Deployment `dep-dc4bn67f3r2c73asr6e0` is **LIVE** at 23:07:41Z. The earlier failed deployment `dep-dc4bmnjl550s738pm710` was superseded; it is not the live version.


## Technical Intelligence Foundation — expanded curriculum and governance — 2026-11-27
- Read the authoritative `main`-branch PROJECTSCOUT before continuing, and preserved the current conversation's explicit staging-only boundary. No production branch, production Render service, or production Supabase data was changed.
- Expanded the technical curriculum from the initial 10 concept candidates to **25 structured concepts** across foundations, programming, languages, databases, web/API design, software engineering, security, operations, AI systems and controlled autonomy.
- Added `knowledge-candidates/messinho-technical-intelligence-foundations.v2.json`: 25 candidate concepts, explicit prerequisite edges, 50 assessment tasks (explanation + transfer per concept), assessment dimensions, critical failure gates and governance restrictions. All 25 remain `candidate`; all referenced source rights remain pending. The package is not imported into Supabase.
- Added `tests/messinho-technical-curriculum-package.test.js` to validate package completeness, unique concept keys, prerequisite resolution, acyclic dependency graph, 50 task mappings, and the non-activation / non-execution guardrails.
- Added `docs/MESSINHO_TECHNICAL_SOURCE_RIGHTS_REVIEW.md` with preliminary work-level findings for 17 distinct source URLs. Python PSF, PostgreSQL, MDN, OWASP and NIST policies have materially different terms; MDN/OWASP ShareAlike and NIST non-US publication rights require special handling. No source was newly allowlisted; the existing four-entry rights registry remains unchanged.
- External official source evidence consulted: Python PSF documentation license; MDN attribution/licensing policy; PostgreSQL license; OWASP ASVS project license; NIST copyright policy and research-library FAQ. Search-result evidence is not treated as legal clearance.
- Supabase read-only inventory: `messinho_knowledge_concepts` has 1 active concept and 0 candidates; `messinho_knowledge_links` has 0 rows; `messinho_knowledge_versions` has 3 rows; `messinho_knowledge_reviews` has 1 row. Migration history includes the existing knowledge hierarchy, append-only version, review governance and conflict-resolution migrations. No schema or data writes were performed.
- Existing review logic requires source-rights verification, at least two independent source domains corroborating a claim, active prerequisites and no open conflict before approval. The new curriculum packages do not meet these gates yet; no attempt was made to bypass them.
- Initial implementation commits: curriculum v2 package `d753daa0d5ea378ebd452b060fc4ede56a3588f0`; package validation tests `5d9c2ca75fff8dd2c26822f90d2b78caf40f4172`; source rights review ledger `344fd174bc385db5bd28b6db501221dc89ac05aa`.
- Next: verify full CI and STAGING build; resolve exact work-level rights for technical sources (including ShareAlike and German/EU TDM position); add only individually cleared works to the registry with exact URL tests; then prepare small candidate batches with at least two independent corroborating sources per claim, prerequisite ordering and Admin review. Only after approval may the concepts be activated and assessed in retrieval/application tests.
- No code-execution agent, self-modification, production access, deployment permission, automatic model training, or modification of guardrails was enabled.
- The VO2max multi-turn application pilot and authenticated Admin/Scout plus tenant-isolation checks remain open; this curriculum work does not waive those release gates.


### Technical Intelligence Foundation v2 — STAGING release confirmation — 2026-11-27
- Render staging deployment: `dep-dc4bp9d6e07s73eosv20`; deployed commit `fb628f7756c1b5f9f36d61d24df64a1cddeef4e8`; final status `live` at 2026-11-26T23:12:09Z.
- Build verification: **337 tests passed, 0 failed**; the four new package tests passed (25 concepts, all prerequisites resolve, no dependency cycles, 50 assessment tasks, all rights pending and no execution/activation).
- Vite build succeeded (2.35s); API process started; Supabase Data API returned HTTP 200; Render reported the staging service live.
- Staging URL: https://myscoutingdatabase-messinho-staging.onrender.com
- No database writes or migrations; active concept count remains 1, candidate count 0, links 0, versions 3, reviews 1. No user/player/scouting data changed.
- This release deploys the application code and versioned curriculum artifacts. It does **not** import the 25 concepts into Supabase, clear source rights, activate new knowledge, or enable a coding agent.
- The prior VO2max authenticated follow-up pilot and Admin/Scout/tenant-isolation tests remain open; no user-session tests are claimed.


## Technical source rights — EU/German TDM framework review — 2026-11-27
- Continued from the existing technical curriculum v2; no restart and no repeated implementation work.
- Re-read the authoritative main-branch PROJECTSCOUT for project boundaries and the current feature-branch checkpoint/rights ledger. Preserved the explicit staging-only rule; no production, main, PFMS/PFSS or Supabase mutation.
- Verified the exact 17 unique URLs referenced by the v2 technical curriculum package. The earlier rights ledger covered source families but had not yet documented the EU/German TDM framework or several content-license distinctions.
- Expanded docs/MESSINHO_TECHNICAL_SOURCE_RIGHTS_REVIEW.md with a dated framework analysis of DSM Directive (EU) 2019/790 Articles 3–4, the limited applicability of AI Act Article 53(1)(c), the distinction between facts and protected expression/database extraction, and the need to record machine-readable rights reservations.
- Added interim source findings: React's own docs repository README identifies submitted react.dev content as CC BY 4.0; the archived TypeScript handbook license cannot automatically be applied to the current migrated handbook; Node.js project MIT licensing does not itself prove the Learn prose license; Git Book exact-edition rights remain unverified. Python/PostgreSQL permissions remain promising but require exact-edition, notice, provenance and TDM checks; MDN and OWASP ShareAlike obligations remain unresolved; NIST non-US/authorship caveats remain unresolved.
- No technical source is newly allowlisted. The four existing rights-registry entries are unchanged. All 17 technical URLs remain pending; no candidate concepts imported or activated.
- Documentation commit: d16618867d2b3fcc04f3fcc01bb9f9e4b3368560.
- This is a legal/technical research record, not a legal opinion or final rights clearance. The candidate package remains blocked from ingestion until exact-work review, rights evidence, independent claim corroboration, prerequisites and Admin approval are complete.
- Next: inspect current source repositories and exact content-license files for Python, PostgreSQL, React, TypeScript, Node.js and Git Book; record exact commit/tag/page snapshots and attribution conditions. Prioritize a narrow, clearly licensed source set and avoid ShareAlike materials unless the distribution implications are resolved. Then build source-specific tests before any allowlist change.


## Accepted requirement — compact, self-improving knowledge lifecycle — 2026-11-27
- Owner explicitly requires MESSINHO not to generate unbounded volumes of duplicate/obsolete knowledge. When a new variant is demonstrably better, it should replace the old active method/version cleanly and reliably rather than accumulate alongside it.
- Accepted distinction: durable verified facts, principles, provenance and uncertainty are preserved; replaceable methods, explanations, procedures, formulas, scoring models and algorithms may be superseded after evidence-based evaluation.
- New architecture specification: docs/MESSINHO_KNOWLEDGE_VERSIONING_AND_COMPACTION.md. It defines canonical identity, deduplication, challenger proposals, frozen benchmark comparison, correctness/security/regression/cost checks, atomic promotion, minimal audit history, rollback, quotas/TTL and storage-growth monitoring.
- Important current-code finding: storeMessinhoKnowledgeConcept currently records materially different proposals as open conflicts for manual review; it does not automatically replace the active concept. storeMessinhoDomainKnowledge upserts by exact content fingerprint, which does not prevent semantically equivalent records with different fingerprints. These are identified gaps, not silently assumed to be solved.
- Next engineering task: inspect Supabase schema, migrations, RPCs and RLS for concepts/versions/conflicts/reviews; design the smallest safe staging-only canonical lifecycle and promotion transaction. Add regression tests for duplicate submissions, evidence merge, challenger quality, false improvements, atomic concurrent promotion, rollback, permissions and tenant isolation. Do not migrate or write to Supabase until this inspection is complete and impact is understood.
- No knowledge is deleted, imported, activated or replaced by this requirement. No production/main/PFMS/PFSS changes, no code execution/self-modification, and no change to rights allowlist or guardrails.
- Documentation commit: 10865b22d079dd7fd752690e3b8a9ea9ce1588d4.


## Accepted requirement — protected player and scout records / Admin authority — 2026-11-27

**Owner decision — binding security and data-governance rule for MESSINHO.**

- MESSINHO is strictly read/analyze/propose for protected operational records. It must never independently create, edit, delete, approve/release, activate, deactivate, lock, unlock, or otherwise change player records or registered scout accounts.
- **Player records:** MESSINHO may read permitted player records and inspect stored values for plausibility, consistency, completeness, contradictions, outliers and freshness. It may calculate analyses and assessments from the existing data.
- **New player values or information:** when MESSINHO independently researches or receives new values, it may validate source rights/provenance, compare the information with the current player record, recalculate metrics, re-analyze and re-assess the player, and explain differences and uncertainty. It must present a proposed update/assessment to an authorized Admin. It must not write those values into the player record itself.
- **Registered scouts:** MESSINHO must not edit scout profile/registration data, change roles or permissions, approve or release registrations, suspend/lock/unlock accounts, or delete scout accounts. These actions remain exclusively under Admin authority.
- **Admin supremacy:** the Admin remains the final decision-maker for protected data and account operations. An analysis, confidence score, automated recommendation, scheduled job, learning process, or autonomous agent plan never constitutes approval.
- **Technical enforcement required:** enforce this boundary server-side, not only in prompts or UI. Use least-privilege read-only access for MESSINHO on player/scout records; deny write/delete/approval mutations at API/service/database/RLS boundaries. Any proposal must be stored separately from the source record (or returned without persistence) and be clearly marked as pending Admin review. Only an authenticated, authorized Admin action may apply an approved change through the existing audited workflow.
- **No indirect bypass:** the same prohibition applies to tools, capability handlers, background jobs, orchestration retries, learning/compaction processes, RPCs and service-role credentials. Do not let MESSINHO invoke a generic update/delete endpoint or inherit broad database credentials.
- **Tests required:** prove that MESSINHO cannot mutate player rows or registered scout accounts through direct API calls, tool calls, RPCs, background execution, cross-tenant attempts or forged Admin context; prove it can read/analyze allowed values and prepare a proposal; prove only an authorized Admin can approve and apply a proposed change; verify audit history and tenant isolation.
- This rule does not prohibit MESSINHO from updating its own permitted knowledge/evidence artifacts under the separately approved knowledge-governance lifecycle. It does not authorize changes to player/scout source records.
- **Status:** accepted requirement, implementation and enforcement not yet verified. Do not claim protected-write prevention is implemented until code, database policies and adversarial tests demonstrate it.



## Technical Intelligence Foundation v2.1 — deeper programming mastery — 2026-11-27
- Continued from the existing 25-concept technical foundation; no restart and no duplicate concept catalogue.
- Expanded the existing 50 learning tasks to **100 assessment tasks**: every one of the 25 concepts now has four distinct evidence types — explain, transfer, diagnose and verify.
- Added an explicit assessment model with six dimensions: conceptual accuracy, transfer/application, fault diagnosis, verification quality, security/reliability, and explanation/uncertainty. Critical correctness or security failures block mastery even if an aggregate score is high.
- Added synthetic debugging and test-design exercises for each concept. They require separating facts from hypotheses, finding root causes from evidence, proposing minimal corrections, testing normal/boundary/invalid cases and never claiming execution that did not occur.
- Updated the candidate package to version 2.1.0. All concepts remain candidate-only; all 17 source URLs remain pending rights review. Nothing was imported into Supabase or activated.
- Reinforced governance: curriculum mastery permits code analysis, drafting, debugging and test design only. It does not enable autonomous execution, self-modification, repository writes, deployment, production access, permission changes or guardrail changes.
- The Admin remains the final authority; MESSINHO's player/scout access remains read/analyze/propose only.
- Next engineering sequence: inspect current hypothesis governance and tool/agent execution boundaries; define a no-side-effect engineering proposal workflow; add synthetic patch/evaluation tests; only later consider isolated sandbox execution with strict budgets and Admin-controlled staging promotion.
- No database schema/data changes, no migrations, no source allowlist changes, no production changes and no deployment were performed in this checkpoint.


### Technical Intelligence Foundation v2.1 — CI correction and verification — 2026-11-27
- The first CI attempt exposed a brittle test assertion: the governance text had been strengthened to say "No autonomous code execution", while the test expected the exact substring "No code execution". The policy itself remained correct; the assertion was corrected to accept the explicit autonomous wording.
- Verified latest feature-branch commit: `f49a6f86fdd1b6c354228432b40b28d5f1744839`.
- GitHub Actions on that exact commit: `messinho-backend-syntax` SUCCESS; `staging-health-smoke` SUCCESS; `messinho-staging-ci` SUCCESS; `messinho-tests` SUCCESS.
- Earlier failed/cancelled runs belong to intermediate commits and are superseded by the successful checks on the latest commit.
- Read-only Supabase inspection confirmed RLS is enabled on `players`, `profiles`, and MESSINHO improvement-hypothesis tables. Current player policies explicitly allow authenticated Admin/approved-Scout operations; MESSINHO hypothesis tables are service_role-only. This is not yet proof that every backend service-role path prevents MESSINHO from mutating player/scout data. That requires code-path and adversarial API/tool tests before any execution capability.
- No migration, database write, source allowlist change, knowledge import/activation, staging deploy or production change was made.
- Next: audit the current improvement-hypothesis lifecycle, all MESSINHO tool/handler write paths, service-role Supabase client usage and protected player/profile routes. Define a proposal-only engineering agent interface and prove it cannot call operational CRUD endpoints. Only after those controls are verified should isolated sandbox execution be considered.


### Controlled engineering proposal gate v1.0 — 2026-11-27
- Audited the current MESSINHO improvement lifecycle. The existing `asi_transition_messinho_hypothesis` RPC locks the target hypothesis row, checks an approved Admin profile, enforces finite state transitions, and writes an immutable event in the same transaction. The HTTP create/transition endpoints also require an approved Admin. This is a governance workflow, not a code-execution engine.
- The current agent core and capability runtime execute bounded in-process analytical functions; the orchestrator records provenance and explicitly treats prior generated results as untrusted context. No repository patch application or shell execution was found in these audited agent/runtime/orchestrator modules.
- Important security caveat: the backend holds a Supabase service-role client. Existing ordinary player/scout CRUD routes are separate operational endpoints, and player/scout write protection for MESSINHO is not proven solely by RLS because service-role access bypasses RLS. This must be enforced at the MESSINHO tool/API boundary and tested adversarially before any code execution capability is enabled.
- Added `backend/messinho-engineering-proposals.js`: a pure, side-effect-free proposal validator and evaluator. It accepts bounded diffs only for non-protected backend/test/docs paths; rejects secrets, environment/network/command execution content, traversal, database migrations and protected agent/auth/access/runtime files; requires tests, a frozen benchmark identity and rollback plan.
- Evaluation requires six gates: unit tests, regression tests, security review, tenant-isolation review, build and resource budget. It rejects missing gates, mismatched benchmark IDs, non-positive claimed improvements, regressions and security findings.
- A passing evaluation still returns `admin_review_and_separate_staging_change`; it cannot apply a patch, execute commands, access the database, authorize deployment or modify production. No integration with the live agent dispatcher has been enabled. This is intentional until isolated execution and protected-data boundaries are proven.
- Added `tests/messinho-engineering-proposals.test.js` covering allowed proposal shape, protected-path rejection, execution/network/environment rejection, size limits, all six evaluation gates, benchmark identity, false improvements, regressions and the non-deployment guarantee.
- No Supabase migration/write, no knowledge import/activation, no source-rights allowlist change, no Render deployment, no production change.
- Next: verify CI on the exact latest commit; fix any failures; then audit all server routes and background workers for indirect MESSINHO-to-CRUD paths and build adversarial tests proving MESSINHO cannot mutate players or registered scout profiles even with the server's service-role client.


### Engineering proposal gate v1.0 — regression correction and CI pass — 2026-11-27
- A first new regression test incorrectly repeated the same diff path nine times while expecting nine distinct changed files. The implementation correctly de-duplicated the path. The test was corrected to generate nine distinct paths; no policy relaxation was made.
- Final CI verified on commit `40af94794f8fc772d192b10a7cf728427874dd1f`: **344 tests passed, 0 failed**; backend syntax check passed; Vite production build succeeded; staging health smoke passed.
- The proposal-only engineering gate remains intentionally disconnected from the live capability dispatcher. This prevents an unreviewed model output from becoming a code-writing or code-execution capability.
- No Render deployment was performed. Staging CI/build validation does not mean the new module is running in staging.
- Next: finish route/background-worker adversarial audit, add explicit MESSINHO actor/capability boundary tests for protected player and scout CRUD, and only then consider a tightly isolated, resource-limited code sandbox. No production deployment or database migration is authorized by this checkpoint.


### Accepted requirement — Admin myKI engineering ticket inbox — 2026-11-27
- Owner requested a dedicated **myKI** area inside the Admin workspace. MESSINHO may submit a ticket only when it has developed a concrete improvement proposal; no routine/status/empty tickets.
- Each ticket must have a server-generated unique KI Ticket ID and explain in simple German what changed, why it is better, and what impact it has. It must also carry a sanitized technical review packet: changed files/diff reference, proposal fingerprint, benchmark baseline/candidate IDs, tests actually run, security/tenant-isolation results, risks, limitations and rollback plan.
- Admin ticket actions: **Kopieren** (complete sanitized packet for independent review by another AI), **Integrieren** (start controlled staging-only integration) and **Löschen** (remove from active inbox while retaining a minimal immutable audit tombstone).
- Status lifecycle and error/success reporting are specified in `docs/MESSINHO_ADMIN_MYKI_TICKETS.md`. Integration cannot be marked successful until exact staging commit, required tests, deployment and health checks are verified. CI-only success must be reported as “CI erfolgreich — noch nicht integriert”.
- Security: separate from Scout support tickets and player/scout records; server-side approved-Admin authorization; trusted MESSINHO-only ticket submission; duplicate prevention; sanitized copy; append-only event history. No secrets or private player/scout data in tickets.
- Integrate must remain blocked until a no-network-by-default, resource-limited sandbox and protected-data boundaries are proven. No self-authorized patch execution, no production deployment, no permissions/guardrail/schema changes.
- Specification committed on the staging feature branch: `9dbe8e1ff9186a93620e0ba210b2c96d5c059afe`.
- **Implementation status:** specification recorded; UI, backend endpoints, persistence and integration executor are not yet implemented. No Supabase migration/write, Render deployment, production change or code execution occurred.
- Next: inspect current Admin navigation and auth patterns on this feature branch; implement dedicated ticket domain + authorization/tests first, then UI; connect proposal gate to ticket submission; keep Integrate disabled until isolated staging execution passes security review.


### Admin myKI — erste technische Umsetzung und CI-Prüfung — 2026-11-27
- Umsetzung ausschließlich auf `feature/messinho-unified-ai-integration`; kein Wechsel auf main und keine Produktionsänderung.
- Admin-Navigation enthält nun einen separaten **myKI**-Bereich im bestehenden schwarzen/goldenen Design. Die Oberfläche umfasst Ticketliste, KI-Ticket-ID, Status, verständliche Erklärung, Begründung, betroffene Dateien, Testnachweise, Risiken, Rollback, Fehleranzeige, Verlauf sowie die Aktionen **Bericht kopieren**, **Integrieren** und **Löschen**. Responsives Layout für schmale Displays ergänzt.
- Neues Domain-Modul `backend/messinho-myki-tickets.js`: Eingabevalidierung, Begrenzung von Diff/Dateien, Ausschluss sensibler Pfade und Schlüssel, serverseitige Ticket-ID, SHA-256-Vorschlagsfingerprint, Statusregeln und sanitisiertes Kopierpaket.
- Neue Tests `tests/messinho-myki-tickets.test.js` decken vollständige/unvollständige Vorschläge, Größenlimits, Secrets, geschützte Pfade, Ticket-ID, Admin-Berechtigung, vorzeitige Integration und Kopierpaket ab.
- Neue Admin-API-Routen: Ticketliste, Detail/Verlauf, Kopierpaket, Löschen (Soft-Delete) und Integrationsanfrage. Admin-Routen verwenden die vorhandene serverseitige Prüfung auf Rolle `admin`, `approved` und `approval_status='approved'`. Interner Vorschlags-Endpunkt ist mit einem separaten `MESSINHO_MYKI_INGEST_SECRET` geschützt, aber noch nicht an den Agenten angeschlossen.
- **Integrate bleibt fail-closed:** Die API antwortet derzeit mit `MYKI_SANDBOX_NOT_READY` und verändert nichts. Kein Patch wird ausgeführt und kein Ticket kann dadurch fälschlich als integriert erscheinen. Isolierter Executor, dessen Security-/Tenant-Isolation-Tests und verifizierter Staging-Deploy sind noch nicht vorhanden.
- SQL-Migration `supabase/migrations/202611270001_messinho_myki_tickets.sql` wurde nur als Entwurf hinzugefügt. Sie wurde **nicht** auf Supabase ausgeführt. Bis zur Migration und zum Setzen des internen Secrets kann die Oberfläche noch keine persistenten Tickets laden/empfangen; sie zeigt in diesem Fall eine verständliche Fehlermeldung.
- GitHub Actions auf exakt aktuellem Code-Commit `45a0685b5137b66b105ac09a08b1019f70763fec`: Node-Tests **349 bestanden, 0 fehlgeschlagen**; Backend-Syntaxprüfung erfolgreich; Staging-Branch-CI inklusive Build erfolgreich; Staging-Health-Smoke erfolgreich. Ein zwischenzeitlicher Fehler durch überescaped Regex-Literale wurde korrigiert und auf dem aktuellen Commit erneut vollständig geprüft.
- Keine Render-Bereitstellung, keine Supabase-Migration oder Datenbankänderung, keine MESSINHO-Live-Anbindung, keine Produktionsänderung.
- Nächste Schritte: (1) Migration/RLS/RPC-Audit und atomare Event-/Statusübergänge finalisieren; (2) nach ausdrücklicher Freigabe Migration nur auf Staging anwenden und internes Secret sicher konfigurieren; (3) MESSINHO-Proposal-Gate mit idempotenter Ticket-Erstellung verbinden; (4) Integration weiter gesperrt lassen, bis isolierter Sandbox-Executor und alle adversarialen Sicherheitsprüfungen bestanden sind; (5) erst danach manuelle Staging-Bereitstellung und End-to-End-Test.


### myKI — Security-Härtung, atomare Auditierung und abschließende CI — 2026-11-27
- Proposal-Dateiprüfung weiter gehärtet: nur `backend/`, `tests/` und `docs/` sind zulässig; zentrale Auth-/Runtime-/Agent-/Rights-/Knowledge-Dateien sind explizit geschützt. Migrationen, Infrastruktur, Deployment, Secrets, Shell-/Prozessausführung, Netzwerkzugriffe und dynamische Codeausführung werden abgewiesen.
- Ticket-Erstellung und Admin-Löschung wurden in der Staging-Migrationsdatei um atomare SQL-Funktionen ergänzt: Ticket und erstes Event entstehen gemeinsam; Soft-Delete und Audit-Event werden in einer Transaktion mit erneuter DB-Prüfung auf freigeschaltete Admin-Rolle gespeichert. Ausführung bleibt ausstehend, bis Migration ausdrücklich auf Staging angewendet wird.
- Server-API verwendet diese RPCs; Admin-Liste/Detail/Kopierpaket bleiben serverseitig auf freigeschaltete Admins beschränkt. Integrationsendpunkt bleibt fail-closed und führt keinerlei Patch-/Shell-/Deployment-Aktion aus.
- Finale CI auf Code-/Migration-Commit `edb9a4ea71006d1cfe0eaef85efaf816b8ff4798`: **349 Tests bestanden, 0 fehlgeschlagen**; Backend-Syntaxprüfung erfolgreich; Staging-Branch-CI/Build erfolgreich; Staging-Health-Smoke erfolgreich. Ein vorheriger Zwischenstand mit fehlerhafter Regex-Syntax wurde behoben und durch den finalen Lauf ersetzt.
- Aktuelle Branch-HEAD nach Code/Migration: `edb9a4ea71006d1cfe0eaef85efaf816b8ff4798`. (Die Projektdatei wird im Anschluss separat aktualisiert.)
- Noch nicht abgeschlossen: Migration ist nur ein Commit-Artefakt und wurde nicht ausgeführt; internes Secret ist nicht konfiguriert; der MESSINHO-Agent ist noch nicht mit dem Ticket-Eingang verbunden; keine Staging-Bereitstellung und kein End-to-End-Test. myKI kann daher noch keine realen Tickets aus MESSINHO empfangen und persistieren.
- Integration bleibt absichtlich blockiert, bis ein separater isolierter Sandbox-Executor ohne Netzwerk/Secrets und mit adversarialen Player-/Scout-/Tenant-Isolation-Tests implementiert und freigegeben ist.
- Keine Supabase-Schreiboperation/Migration, kein Render-Deploy, keine Produktionsänderung und keine MESSINHO-Codeausführung.
- Nächster Schritt: SQL-Migration nochmals fachlich gegen die tatsächlichen Staging-Tabellen/Rollen prüfen; danach separate Freigabe für Staging-Migration und sichere Secret-Konfiguration einholen. Anschließend MESSINHO-Proposal-Gate idempotent anbinden und E2E-Tests durchführen.


### myKI — finale UI-/Copy-Korrektur und CI-Verifikation — 2026-11-27
- Admin myKI-Kopierfunktion um Browser-Fallback für Umgebungen ohne Clipboard API ergänzt; offene Ticketanzahl zählt integrierte/gelöschte Tickets nicht mehr als offen.
- Finaler Code-/Migrationsstand vor dieser Dokumentationsaktualisierung: `41521858dbd3324b386246f85f8af3c8c680dbeb`.
- GitHub Actions auf exakt diesem Commit: **349 Tests bestanden, 0 fehlgeschlagen**; Backend-Syntaxprüfung erfolgreich; Staging-Branch-CI inklusive Produktionsbuild erfolgreich; Staging-Health-Smoke erfolgreich.
- UI, Backend-API, Proposal-Validierung, SQL-Entwurf und atomare Ticket-/Audit-RPCs sind im Feature-Branch vorhanden. Es wurde kein Render-Deploy ausgeführt.
- Verfügbarkeit bleibt von der noch nicht ausgeführten Staging-Migration und dem noch nicht gesetzten `MESSINHO_MYKI_INGEST_SECRET` abhängig. Der Proposal-Eingang ist noch nicht mit dem Live-Agenten verbunden. Integration bleibt gesperrt, bis der Sandbox-Executor unabhängig geprüft und freigegeben ist.


### myKI — Staging-Datenbank aktiviert und Sicherheitsprüfung — 2026-11-27
- Fortsetzung ausschließlich auf `feature/messinho-unified-ai-integration`; Produktion/`main`, PFMS/PFSS und produktive Supabase-Ressourcen blieben unangetastet.
- Die Migration `supabase/migrations/202611270001_messinho_myki_tickets.sql` wurde vor Ausführung gehärtet: beide `SECURITY DEFINER`-Funktionen verwenden jetzt `SET search_path = ''`; alle Tabellen-/Objektbezüge sind schemaqualifiziert. GitHub-Commit der Migration-Härtung: `04e71245f284f18a42f90e50b52979c7145f66f0`.
- Migration `messinho_myki_tickets_20261127` wurde erfolgreich ausschließlich auf Supabase-Projekt `myScoutingDatabase-staging` (`nwqwnrhupbyhshsprxjt`, Frankfurt) angewendet.
- Verifikation: beide myKI-Tabellen vorhanden; RLS aktiviert; weder `anon` noch `authenticated` besitzen direkten SELECT-Zugriff; `service_role` besitzt den benötigten serverseitigen Zugriff. Beide RPCs sind SECURITY DEFINER, für `anon` und `authenticated` nicht ausführbar und nur für `service_role` freigegeben.
- Supabase Security Advisors danach geprüft. Die myKI-Tabellen erscheinen erwartungsgemäß als RLS-aktiv ohne öffentliche Policies. Weiterhin vorhandene, nicht durch myKI verursachte Hinweise: `admin_set_scout_approval` ist für `authenticated` ausführbar (WARN) und Leaked-Password-Protection ist deaktiviert (WARN); diese wurden nicht verändert.
- **MESSINHO↔myKI-Live-Verbindung noch nicht abgeschlossen:** Der interne Ticket-Endpunkt und die Ticketvalidierung existieren, aber `backend/messinho-agent-core.js` ist ausdrücklich read-only und es gibt noch keinen Engineering-Proposal-Producer, der einen echten, getesteten Diff erzeugt und an den Ticket-Eingang übergibt. Keine künstlichen Tickets erzeugen. Das interne Secret `MESSINHO_MYKI_INGEST_SECRET` ist noch nicht gesetzt; deshalb bleibt der interne Eingang geschlossen.
- Render-Staging-Service identifiziert: `myscoutingdatabase-messinho-staging` (`srv-dc3chlqjnfac73acd6ig`), Branch korrekt, Auto-Deploy aus. Kein Render-Deploy durchgeführt. Produktionsservice auf `main` blieb unangetastet.
- Nächste Schritte: (1) kontrollierten Engineering-Proposal-Producer entwerfen, der nur echte, begrenzte Diffs nach sechs unabhängigen Gates übermittelt; (2) Callback/Dispatch im Agent Core ergänzen, ohne Player-/Scout-/Auth-/Knowledge-/Runtime-Schutzpfade freizugeben; (3) adversariale Tests für forged proposals, duplicate fingerprints, role/tenant isolation und service-role access; (4) internes Secret ausschließlich sicher in Render STAGING konfigurieren; (5) CI, manuelles STAGING-Deployment und E2E-Ticketfluss verifizieren. Integrate bleibt fail-closed, bis ein isolierter No-Network-Sandbox-Executor geprüft ist.
- Keine Player-/Scout-Daten geändert, keine Wissensimporte/-aktivierungen, keine Codeausführung durch MESSINHO und keine Produktionsänderung.


### myKI — MESSINHO-Agent-Dispatch angebunden — 2026-11-27
- Neuer In-Process-Bridge-Baustein `backend/messinho-myki-bridge.js`: validiert Engineering-Proposals mit dem bestehenden Proposal-Gate, erzeugt daraus ein revisionsfähiges myKI-Ticket und speichert es über die ausschließlich für `service_role` freigegebene RPC `asi_create_messinho_myki_ticket`. Keine HTTP-Schleife und kein zusätzliches Secret erforderlich.
- `backend/messinho-agent-core.js` dispatcht nach erfolgreicher Agent-Run-Validierung ausschließlich explizite `result.myki_engineering_proposal`-Payloads mit Status `proposal_ready` und ausschließlich bei Rolle `admin`. Scout-Runs, fehlgeschlagene Agent-Validierungen und andere Lern-/Spieler-Proposals werden nicht eingereicht.
- Beide Agent-Ausführungspfade im Server (normaler Chat und Task-Fortsetzung) übergeben die sichere Persistenzfunktion. Die Admin-Antwort enthält `myki_dispatch` (eingereicht, Duplikat, abgelehnt), damit die Aktion nachvollziehbar ist.
- Ticket-Teststatus wird ehrlich als `not_run` gespeichert; das Ticket erklärt, dass kein Code angewendet/ausgeführt wurde und die sechs unabhängigen Qualitätsgates vor einer Staging-Integration noch ausstehen. Doppelte Fingerprints werden durch die DB-Eindeutigkeitsregel abgefangen.
- Neue Tests: nur Admin + `proposal_ready` + explizite Payload dispatchen; Scouts und fehlende Callback-Funktion blockieren; gültige Vorschläge als Review-only Ticket persistieren; unsichere Diffs vor DB-Zugriff ablehnen; Duplikate idempotent melden.
- **Wichtige Grenze / verbleibende Arbeit:** Im aktuellen Capability-Runtime erzeugt noch keine Fähigkeit das spezielle Feld `myki_engineering_proposal` mit einem echten, begrenzten Software-Diff. Die Verbindung/Dispatch-Strecke ist damit programmiert, aber ein autonomer Quellcode-Reviewer/-Vorschlagsgenerator, der konkrete Projektdateien einliest und einen echten Diff erzeugt, fehlt noch. Daher wird derzeit kein künstliches oder inhaltlich erfundenes Ticket erstellt. Die Integrationsausführung bleibt gesperrt.
- Keine Render-Bereitstellung und keine Änderung an `main`/Produktion. Die Staging-Supabase-Migration bleibt wie oben dokumentiert bereits angewendet.


### myKI — Agent-Bridge Regression-Fix und CI-Freigabe — 2026-11-27
- Agent-Bridge verschärft: myKI-Dispatch nur bei vollständig abgeschlossenem Agent-Run (`status=completed`, alle Schritte erledigt), erfolgreicher Agent-Validierung und Admin-Rolle. Partielle/fehlerhafte Runs erzeugen keine Tickets.
- Ein Regressionstest wurde zunächst mit unvollständigem Test-Run-Datensatz ausgeführt und schlug erwartungsgemäß am neuen Completion-Gate fehl; Test-Fixture korrigiert und anschließend auf aktuellem Commit vollständig erneut geprüft.
- Aktueller verifizierter Code-Commit: `13874924c8137b18589763b23fd8bb02892c19b9`.
- GitHub Actions auf genau diesem Commit: **355/355 Node-Tests bestanden**, 0 fehlgeschlagen; Backend-Syntax erfolgreich; Staging-Branch-CI mit Tests, Syntax und Vite-Produktionsbuild erfolgreich; Staging-Health-Smoke erfolgreich.
- Kein automatischer Engineering-Proposal-Producer existiert derzeit: MESSINHO muss zuerst ein echtes Feld `myki_engineering_proposal` mit validem begrenztem Diff erzeugen. Die Agent-Dispatch- und Persistenzverbindung ist vorhanden und getestet, aber aktuell werden daher keine Tickets aus bloßen Lernvorschlägen oder Diagnosen fabriziert.
- Staging-Supabase-Migration ist bereits angewendet und RLS/RPC-Rechte wurden geprüft. Der Bridge verwendet serverseitig die vorhandene `service_role`-Datenbankverbindung und die geschützte RPC; das separate HTTP-Ingest-Secret ist für diesen In-Process-Pfad nicht erforderlich.
- Nächster Schritt: aktuelles Feature-Branch-HEAD manuell auf Render STAGING bereitstellen (Auto-Deploy ist aus), Deployment auf Live-Status/Commit prüfen und anschließend Admin-/Scout-Rollenpfade sowie Chat-Health testen. Danach bleibt die Entwicklung des echten read-only Quellcode-Reviewers/Proposal-Generators und ein kontrollierter E2E-Tickettest offen. Keine Produktion, kein `main`, keine PFSS/PFMS-Änderungen.


### myKI — Autonomer Engineering-Review im Admin-Chat — 2026-11-27
- Neuer read-only Proposal-Producer `backend/messinho-myki-engineer.js`: liest für einen ausdrücklich angeforderten Admin-Selbstcheck eine feste Allowlist nicht geschützter MESSINHO-Module und zugehöriger Tests aus dem aktuellen Feature-Branch-Commit. Der Commit-SHA wird als Benchmark gespeichert.
- Nutzt die versionierte Programmier-Lernbasis von MESSINHO als Prüfraster (Voraussetzungen, Codepfad, belegte Hypothese, Tests, Sicherheitsfolgen); behauptet kein eigenes Modellgewichtetraining.
- Erzeugt maximal einen begrenzten Unified Diff. Vor Ticketanlage werden Dateipfade, Dateiheader, verbotene Datei-/Netzwerk-/Ausführungsoperationen sowie die entfernten Diff-Kontextzeilen gegen den exakt gepinnten Quellcode geprüft. Ein nicht passender oder unsicherer Patch wird verworfen.
- Im vorhandenen Admin-Chat `POST /api/agent/chat` ist ein expliziter Selbstprüfungs-Trigger eingebaut (z. B. „MESSINHO, entwickle eine Verbesserung für dich selbst“ oder „Bitte prüfe das System und optimiere es“). Nur freigeschaltete Admins dürfen den Ablauf starten. Scouts erhalten keine Engineering-Berechtigung.
- Ein valider Vorschlag wird über die interne In-Process-Brücke als myKI-Ticket angelegt. Keine externe HTTP-Schleife, keine Codeausführung, kein Dateischreiben, kein Commit/Merge/Deploy. Tests bleiben ausdrücklich `not_run`; das Ticket kennzeichnet den Vorschlag als Admin-Prüfung. Bei fehlendem nachweisbarem Vorteil wird kein Ticket erzeugt.
- Tests decken Trigger-Erkennung, pinned-source retrieval, Diff-Kontextbindung, fehlende/ungültige Providerantwort, unsichere Patches und No-Proposal-Fall ab.
- Aktueller Feature-Branch-Code-Commit: `aa1c46217115bcc759a851fa3f82aeebeadb78a4`.
- GitHub Actions auf diesem Commit: **365/365 Node-Tests bestanden**, 0 fehlgeschlagen; Backend-Syntax erfolgreich; Staging-Branch-CI mit Regressionstests, Syntax und Vite-Build erfolgreich; Staging-Health-Smoke erfolgreich.
- Supabase-Staging-Migration `messinho_myki_tickets_20261127` ist bereits angewendet; Tabellen/RPCs bleiben mit RLS und minimalen Rechten abgesichert.
- Nächster Schritt: diesen aktuellen Branch-Stand auf Render STAGING bereitstellen und Live-Status/Commit/Startlogs prüfen. Danach einen authentifizierten Admin-Chat-Aufruf mit einem Testkonto ausführen, um zu prüfen, ob der Provider entweder ein echtes, quellengestütztes Ticket oder bewusst keinen Vorschlag zurückgibt. Keine Test-Tickets manuell fabrizieren. Produktion/`main` bleibt unverändert.


### MESSINHO — Programmier-Lernbasis und myKI-Engineering-Reviewer — 2026-11-27
- Neue versionierte Lernbasis `backend/messinho-programming-learning.js`: vier aufeinander aufbauende Stufen (Programmiergrundlagen; Anwendungsentwicklung; Qualität/Sicherheit; Architektur/KI-Systeme). Enthält Voraussetzungen, Lernziele, sichere Engineering-Prinzipien und kleine Praxisbeispiele. Die Lernbasis wird bei jeder technischen Selbstprüfung in den Reviewer-Kontext geladen.
- MESSINHO erhält damit wiederverwendbares, dauerhaft im Repository versioniertes Programmierwissen. Das ist bewusst keine Behauptung, dass eigene Modellgewichte trainiert oder verändert wurden. Bestätigte Erfahrungen dürfen erst nach überprüfbarem Testbeleg und Admin-Review als wiederverwendbares Wissen gelten.
- Neuer Reviewer `backend/messinho-myki-engineer.js`: liest eine feste Allowlist von fünf ungefährlichen Backend-/Testdateien aus einem gepinnten Git-Commit, erstellt höchstens einen begrenzten Vorschlag und lässt keinen Patch ausführen oder anwenden. OpenAI ist vorläufig nur der Text-/Code-Vorschlagsanbieter; MESSINHOs eigene Validierungs-, Berechtigungs- und Ticketlogik bleibt im Projekt.
- Zusätzliche Patch-Prüfung vergleicht entfernte und Kontextzeilen gegen exakt den gepinnten Quellcode. Ein nicht passender/halluzinierter Diff wird abgewiesen, bevor ein Ticket gespeichert wird. Geschützte Dateien, Migrationen, Netzwerk-/Shell-/Secret-Zugriffe und Deployment bleiben gesperrt.
- Im bestehenden Chat-Endpunkt ist die Funktion nur für freigeschaltete Admins erreichbar. Bei einem echten Vorschlag wird über die vorhandene atomare RPC ein myKI-Ticket angelegt; bei fehlender Verbesserung, Providerfehler, unsicherem Patch oder Duplikat wird kein künstliches Ticket erstellt.
- Tests auf Commit `aa1c46217115bcc759a851fa3f82aeebeadb78a4`: **365/365 Node-Tests bestanden**, Backend-Syntax erfolgreich, Staging-Branch-CI erfolgreich und Staging-Health-Smoke erfolgreich.
- Die Codeprüfung führt keine Tests aus; deshalb werden Ticket-Tests ehrlich als `not_run` geführt. Es ist ein Vorschlag-/Review-System, kein autonomer Patch-Executor.
- Noch offen vor produktiver STAGING-Nutzung: Render-Staging-Service auf den geprüften Branch-HEAD manuell deployen (Auto-Deploy ist aus), prüfen, ob `OPENAI_API_KEY` und `OPENAI_MODEL` auf STAGING gesetzt sind, Admin-/Scout-Rollenpfade live testen und ein echtes End-to-End-Ticket erzeugen. Keine Produktion und kein `main`.


### STAGING release — myKI Engineering Review Bridge — 2026-11-27
- Render STAGING service `myscoutingdatabase-messinho-staging` (`srv-dc3chlqjnfac73acd6ig`) wurde manuell bereitgestellt; Deployment `dep-dc4chtuq1p3s73dj661g`, Commit `4d7e458db3c2be5aef21524aa2bf3740f2283ede`, Status `live`.
- Build erfolgreich; App-Startlog: `myScoutingDatabase API listening on 10000`; Supabase Data API HTTP 200; Tavily und OpenAI in STAGING konfiguriert; Render meldet `Your service is live`.
- Der Service bleibt auf `feature/messinho-unified-ai-integration`, Auto-Deploy bleibt deaktiviert. Kein Merge in `main`, kein Produktionsdeploy.
- Staging-Supabase-Kontrolle nach Bereitstellung: myKI-Ticketanzahl 0, Eventanzahl 0. Es wurden bewusst keine künstlichen Testtickets angelegt.
- **Noch offener Live-Test:** authentifizierte Admin-Sitzung im Staging öffnen und im bestehenden MESSINHO-Chat den Selbstprüfungsauftrag auslösen. Erwartete Ergebnisse: entweder ein belegter Vorschlag als myKI-Ticket mit `not_run`-Teststatus oder eine ehrliche Meldung, dass kein hinreichend sicherer Verbesserungsvorschlag gefunden wurde. Der echte Admin-Chat-/Ticket-Ende-zu-Ende-Aufruf wurde mangels Test-Admin-Sitzung noch nicht durchgeführt.
- **Admin-Testadresse:** https://myscoutingdatabase-messinho-staging.onrender.com
- Nächster Schritt: Admin-Test in Staging durchführen, Ticketliste/Kopierfunktion und rollenbasierten Scout-Ausschluss prüfen; anschließend die sechs Qualitätsgates und einen separaten Staging-Integrationsprozess entwickeln. Keine automatische Codeausführung oder Produktion.


### MESSINHO — tägliche autonome Engineering-Prüfung — 2026-11-27
- Neue versionierte Programmier-Lernbasis und Reviewer werden durch einen staging-gesteuerten Tagesprüfer ergänzt: `backend/messinho-engineering-scheduler.js`.
- Der Prüfer wird ausschließlich aktiviert, wenn `MESSINHO_ENGINEERING_AUTOREVIEW_ENABLED=true`, Render STAGING erkannt wird, `RENDER_SERVICE_ID` exakt mit `MESSINHO_STAGING_RENDER_SERVICE_ID` übereinstimmt und die benötigten Provider-/Supabase-Zugangsdaten vorhanden sind. Produktion kann diese Prüfung nicht versehentlich starten.
- Zeitplan: täglich ab 20:00 Uhr Europe/Berlin, geprüft im 15-Minuten-Takt. Ein eindeutiger Datenbankeintrag pro lokalem Kalendertag verhindert doppelte Läufe über mehrere Render-Instanzen oder Neustarts hinweg.
- Ergebniszustände werden dauerhaft gespeichert: `ticket_created`, `no_improvement`, `duplicate` oder `failed`. Nur ein echter, validierter Vorschlag führt zu einem myKI-Ticket. Kein künstliches Ticket bei fehlender Verbesserung.
- Neue Migration `20261127000500_messinho_engineering_review_scheduler.sql` wurde ausschließlich auf Supabase `myScoutingDatabase-staging` (`nwqwnrhupbyhshsprxjt`) angewendet. Tabelle ist RLS-aktiv; `anon` und `authenticated` haben keinen SELECT-Zugriff; `service_role` besitzt die benötigten Rechte. Der Security Advisor meldet für die neue server-only Tabelle erwartungsgemäß nur den INFO-Hinweis „RLS enabled, no policy“.
- Scheduler ist im Serverstart verdrahtet, bleibt aber bis zur expliziten Render-STAGING-Variablenfreigabe deaktiviert. Es wurde noch kein automatischer Tageslauf ausgelöst.
- Regressionstest auf Commit `c07d9e1bc8f7078e339d2dfddf617dfb4ea837ae`: **370/370 Node-Tests bestanden**, 0 fehlgeschlagen; Backend-Syntax- und Staging-CI laufen/werden für diesen Commit abgeschlossen.
- Nächster Schritt: Render-Workspace-Auswahl bestätigen, aktuellen Branch-HEAD manuell auf STAGING bereitstellen, vorhandene Provider-Variablen prüfen, `MESSINHO_ENGINEERING_AUTOREVIEW_ENABLED=true` nur auf STAGING setzen und anschließend Admin-Chat-/myKI-End-to-End-Test sowie Scheduler-Status prüfen. Keine Produktion und kein `main`.


### Korrektur — Scheduler-Freigabe abgeschlossen — 2026-11-27
- Der vorherige Abschnitt „bleibt ... deaktiviert“ beschreibt nur den Zustand vor der anschließenden Render-Umgebungsfreigabe und ist durch diesen Eintrag überholt.
- Die STAGING-Variablen sind jetzt gesetzt und der neue Deploy ist live. Der tägliche Scheduler ist damit ausschließlich im Render-STAGING aktiviert; Produktionsservice und Produktionsumgebung wurden nicht geändert.
- Aktueller Live-Deploy: `dep-dc4cj9mc6qcc73d5jdmg`, Commit `e549edc1c4983720283af5d25bc172fc6fdaf156`. CI: 370/370 Tests, Backend-Syntax und Vite-Build erfolgreich.
- Der Ledger-Eintrag ist noch 0, weil noch kein 20:00-Uhr-Lauf erfolgt ist. Ein authentifizierter Admin-Ende-zu-Ende-Test bleibt offen; es wurde kein künstliches Ticket erzeugt.

### myKI — direkter MESSINHO-Chat und Aktivitätsstatus — 2026-11-27
- Die vorhandene myKI-Ticketoberfläche bleibt bestehen; sie wird nicht durch ein zweites Ticketsystem ersetzt.
- Neue Komponente `src/asi/MyKiChat.jsx` bindet den bestehenden MESSINHO-Agenten direkt im myKI-Adminbereich über denselben authentifizierten `/api/agent/chat`-Endpunkt an. Das Gespräch verwendet dieselbe Agentenlogik und Wissensbasis wie der übrige MESSINHO-Chat; es entsteht kein separater KI-Agent.
- Der Chat zeigt laufende Anfragen als „arbeitet gerade“ an. Die Statusanzeige unterscheidet außerdem eine laufende autonome Engineering-Selbstprüfung von einem pausierten/wartenden Zustand. Die UI behauptet keine kontinuierliche Modellschulung: Modellgewichte werden nicht automatisch verändert.
- Neuer geschützter Admin-Endpunkt `GET /api/admin/myki/status` liefert den Scheduler-Schalter, den Tageszeitplan Europe/Berlin und den letzten gespeicherten Engineering-Review-Status. Der Endpunkt ist read-only und startet keine Prüfung.
- Mobile Darstellung, eigener scrollbarerer Gesprächsbereich, Ladeindikator, Fehleranzeige und Nachrichtenverlauf innerhalb der Sitzung sind umgesetzt.
- Änderungen ausschließlich auf `feature/messinho-unified-ai-integration`; keine Datenmigration, keine Spieler-/Scout-Datenänderung, kein Eingriff in `main` oder Produktion.
- Commit mit Backend-Statusroute: `320f4d001be0e98a86a555bd1d8da1b42606a485`. CI wurde nach dem Commit gestartet; Ergebnis und anschließender STAGING-Deploy müssen vor Live-Bestätigung geprüft werden.
- Offene Verifikation: CI vollständig grün, STAGING auf exakt diesen Branch-HEAD bereitstellen, Statusroute mit Admin-Sitzung prüfen, normalen Chat und Admin-only Schutz Ende-zu-Ende testen.

### myKI Ticketpagination und Programmier-Lernbasis 2026-11-27
- myKI zeigt maximal fünf Engineering-Tickets pro Seite. Ab Ticket sechs erfolgt die Anzeige auf nummerierten Folgeseiten mit Zurück/Weiter, Seitenzahlen und Gesamtzähler. Die Ticketdetails bleiben unabhängig davon im rechten Detailbereich sichtbar.
- Pagination ist clientseitig und ändert weder Ticketdaten noch Reihenfolge/Status in der Datenbank.
- Programmiercurriculum auf Version 1.1.0 erweitert: zusätzliche professionelle Engineering-Stufe mit Fehleranalyse, Code-Review, Threat Modeling, Performance, Nebenläufigkeit, Migrationen, Accessibility, Fuzzing, Observability und Architekturentscheidungen.
- MESSINHO erhält einen verbindlichen achtstufigen Engineering-Arbeitsablauf sowie Qualitäts-Gates für Belegbarkeit, Sicherheit, Wartbarkeit, Performance, Testbarkeit und Rückwärtskompatibilität.
- Konzept für Admin-Wissenszufuhr festgelegt: bereitgestellte Unterlagen zunächst als Quellenmaterial prüfen (Herkunft, Version, Nutzungsrechte, Aktualität, Widersprüche), Konzepte extrahieren, mit bestehendem Wissen abgleichen, versionierten Lernvorschlag erzeugen und erst nach Admin-Freigabe dauerhaft integrieren. Ungeprüftes Material wird nicht automatisch als gesichertes Wissen übernommen.
- Keine automatische Modellgewichtsänderung und keine automatische Code-Anwendung. Engineering-Vorschläge bleiben Vorschläge/Tickets bis zur ausdrücklichen Freigabe.
- Änderungen ausschließlich im Feature-Branch `feature/messinho-unified-ai-integration`; STAGING-only, `main` und Produktion unverändert.
- CI und STAGING-Deploy für den neuen Stand müssen noch vollständig geprüft werden.


---

## 12. IST-Abgleich und verbindlicher Arbeitsplan — 2026-11-27

> Dieser Abschnitt ist ein nachträglicher Statusabgleich zum bisherigen Projektjournal. Frühere Einträge bleiben als historische Nachweise erhalten. Wo frühere Einträge durch spätere Korrekturen überholt wurden, gilt der neuere Eintrag. Nicht erneut als erledigt zählen, was nur geplant, in CI gebaut oder als Migration committet, aber nicht ausgeführt wurde.

### 12.1 Dokumentations- und Quellenstand

- Diese Aktualisierung erfolgt auf `feature/messinho-unified-ai-integration`, nicht auf `main`.
- Die zuletzt gelesene PROJECTSCOUT-Datei hatte den Blob-SHA `4d0312ee5facfb13172a1a97b33d459d1a4f542e` und 3.944 Zeilen.
- Der letzte im unmittelbar vorhergehenden UI-/Backend-Eintrag ausdrücklich benannte Code-Commit ist `320f4d001be0e98a86a555bd1d8da1b42606a485`. Der Eintrag dokumentiert eine neue Admin-Statusroute und den direkten myKI-Chat, weist aber CI- und Staging-Verifikation dafür noch als offen aus.
- Frühere Code-/Migrationsstände sind im Journal mit `41521858dbd3324b386246f85f8af3c8c680dbeb`, `aa1c46217115bcc759a851fa3f82aeebeadb78a4`, `c07d9e1bc8f7078e339d2dfddf617dfb4ea837ae` und weiteren Commits dokumentiert.
- **Wichtige Verifikationsgrenze:** Der aktuelle Branch-HEAD-SHA konnte bei diesem Abgleich nicht unabhängig über eine Branch-Ref-Abfrage bestätigt werden. Die GitHub-Status-/Workflow-Abfrage lieferte für die abgefragten SHAs keine Statusdatensätze. Das ist kein Beleg für fehlgeschlagene CI, aber ebenso wenig ein Beleg für einen grünen aktuellen HEAD. Vor dem nächsten Codeeingriff muss daher der tatsächliche Branch-HEAD und sein CI-Stand erneut ermittelt werden.
- Render-STAGING ist zuletzt für Deployment `dep-dc4chtuq1p3s73dj661g` auf Commit `4d7e458db3c2be5aef21524aa2bf3740f2283ede` als live dokumentiert. Ein späterer Scheduler-Deploy `dep-dc4cj9mc6qcc73d5jdmg` auf `e549edc1c4983720283af5d25bc172fc6fdaf156` ist ebenfalls als live dokumentiert. Der aktuelle Render-Live-Commit nach den späteren UI-/Pagination-Arbeiten ist in den letzten Einträgen nicht abschließend nachgewiesen.
- Staging-URL: https://myscoutingdatabase-messinho-staging.onrender.com
- Produktion bleibt https://myscoutingdatabase.onrender.com und ist ausdrücklich außerhalb des Arbeitsbereichs.

### 12.2 Als umgesetzt dokumentierte Bestandteile

Die folgenden Punkte sind im bisherigen Journal mit konkreten Implementierungs-, Migrations-, Test- oder Deployment-Einträgen beschrieben. Ihr Status ist jeweils so eng zu verstehen wie der vorhandene Nachweis:

**MESSINHO Agent und Wissensgrundlage**
- 100 Capability-IDs in vier Gruppen katalogisiert; Runtime-Handler und Statuswahrheit wurden auditiert und schrittweise korrigiert. Die Kataloggröße allein ist ausdrücklich kein Nachweis, dass alle 100 Fähigkeiten vollständig und produktionsreif sind.
- Zielorientierte Mehrfach-Intent-/Capability-Planung wurde in den Chatfluss integriert; der manuelle Capability-Auswahlweg wurde zurückgenommen.
- Evidence-/Quellenkontext, Qualitätsprüfung und begrenzte Scout/Critic-Schleife sind dokumentiert. Die Qualitätsprüfung ist auf maximal drei Durchläufe begrenzt und fail-closed, wenn die unabhängige Prüfung nicht verfügbar ist.
- Dauerhafte Wissensspeicherung ist an Evidenz- und Qualitätsbedingungen gebunden; ungeprüfte Entwürfe dürfen nicht als bestätigtes Wissen gespeichert werden.
- Programmier-Lernbasis ist versioniert und wurde auf Curriculum 1.1.0 erweitert. Sie umfasst Grundlagen, Anwendungsentwicklung, Qualität/Sicherheit, Architektur/KI-Systeme sowie professionelle Engineering-Themen. Das ist persistentes, versioniertes Wissensmaterial — kein Nachweis für eigenes Modellgewichts-Training.

**myKI und Engineering-Vorschläge**
- Eigener Admin-Bereich myKI im bestehenden Admin-Workspace wurde umgesetzt; er ersetzt weder den vorhandenen MESSINHO-Chat noch den Scout-Support.
- Ticket-Domain, Ticket-ID, Statusregeln, Kopierpaket, Admin-API, Soft-Delete/Audit-Verlauf und UI sind dokumentiert.
- Staging-Migration `messinho_myki_tickets_20261127` wurde laut Journal ausschließlich auf Supabase STAGING angewendet; RLS und serverseitige RPC-Berechtigungen wurden geprüft.
- MESSINHO-Agent-Dispatch zur myKI-In-Process-Bridge wurde implementiert und mit Admin-/Scout-/Proposal-Gates abgesichert.
- Read-only Engineering-Reviewer wurde ergänzt: feste Allowlist, gepinnter Quellcode-Benchmark, begrenzter Diff, Prüfung von Pfaden und Diff-Kontext, keine Dateiänderung, keine Shell-/Netzwerk-/Codeausführung und kein Commit/Deploy durch den Reviewer.
- Ein echtes myKI-Ticket darf nur bei einem konkreten, validierten Verbesserungsvorschlag entstehen. Leere, künstliche oder bloße Status-Tickets sind untersagt.
- Ticket-Tests werden ehrlich als `not_run` geführt, wenn der Reviewer die Tests nicht selbst ausgeführt hat.
- myKI-Ticketpagination (fünf Tickets pro Seite) und Kopier-Fallback sind im letzten dokumentierten UI-Stand enthalten. Die abschließende CI-/STAGING-Verifikation dieses jüngsten UI-Stands ist noch offen.

**Scheduler und Betrieb**
- Täglicher Engineering-Review-Scheduler um 20:00 Uhr Europe/Berlin ist dokumentiert; idempotenter Tages-Ledger verhindert doppelte Läufe.
- Scheduler wurde laut Korrektureintrag ausschließlich auf Render STAGING aktiviert. Der erste erfolgreiche Tageslauf bzw. ein echter Ticket-/No-improvement-Ledger-Eintrag ist im letzten dokumentierten Stand noch nicht nachgewiesen.
- Direkter MESSINHO-Chat im myKI-Bereich und Admin-Statusroute sind implementiert dokumentiert; der End-to-End-Test mit authentifizierter Admin-Sitzung und der Scout-Ausschluss sind noch offen.
- Mobile Darstellung, eigener scrollbarerer Chatbereich, Lade-/Fehlerzustände und Statusanzeige sind im Code-/Dokumentationsstand beschrieben; die vollständige aktuelle Geräte-QA ist nicht nachgewiesen.

### 12.3 Offene Arbeiten — verbindliche Reihenfolge

**P0 — aktuellen IST-Zustand beweisen, bevor weiter programmiert wird**
1. Tatsächlichen HEAD von `feature/messinho-unified-ai-integration` feststellen und mit dem letzten dokumentierten Commit vergleichen.
2. PROJECTSCOUT, GitHub-Dateistand, GitHub Actions und Render-STAGING-Deployment gegeneinander abgleichen.
3. Den exakten Staging-Service, Branch, Deployment-Commit, Build-/Startlogs, Health-Endpunkt und die wirksamen STAGING-Umgebungsvariablen prüfen. Geheimnisse niemals in Logs oder Dokumentation ausgeben.
4. Prüfen, ob der aktuelle Branch-HEAD bereits deployed ist. Falls nicht, nur nach den bestehenden Regeln manuell nach STAGING deployen; niemals Auto-Deploy auf Produktion oder `main` aktivieren.
5. Vorhandene Regressionsergebnisse dem exakten Commit zuordnen. CI-Erfolg eines älteren Commits darf nicht als Testnachweis für einen neueren Commit ausgegeben werden.

**P1 — myKI Ende-zu-Ende abschließen**
1. Authentifizierten Admin-Test im Staging durchführen: normaler Chat, expliziter Engineering-Selbstcheck, Statusroute, Ticketliste, Ticketdetail, vollständige Kopierfunktion und Audit-Verlauf.
2. Einen echten Vorschlag nur dann akzeptieren, wenn der Reviewer einen belegten, begrenzten Diff liefert. Andernfalls muss MESSINHO nachvollziehbar „kein sicherer Verbesserungsvorschlag“ melden und darf kein Ticket anlegen.
3. Scout-/Nicht-Admin-Aufrufe adversarial testen: kein Zugriff auf myKI, keine Ticket-Erstellung, keine Statusdaten und keine Engineering-Funktion.
4. Duplikate, Provider-Ausfall, ungültige Diff-Kontexte, geschützte Dateien, Secret-Muster, Fehlerzustände und Soft-Delete/Audit-Verhalten prüfen.
5. Scheduler-Ledger nach dem 20:00-Lauf prüfen: genau ein Tageslauf, korrekter Zustand (`ticket_created`, `no_improvement`, `duplicate` oder `failed`) und keine künstlichen Tickets.

**P2 — Sicherheitsgrenzen für autonome Entwicklung beweisen**
1. Alle Agent-Tools, Capability-Handler, API-Routen und Background-Worker auf indirekte Wege zu Player-/Scout-CRUD, Auth, Profilen, Organisationen, Secrets und Wissensaktivierung prüfen.
2. Beachten: Supabase `service_role` umgeht RLS. RLS allein beweist daher keine Isolation. Die MESSINHO-Grenze muss serverseitig vor jedem Tool-/API-Aufruf greifen.
3. Adversariale Tests müssen beweisen, dass MESSINHO weder Spielerdaten noch Scout-Profile verändern, fremde Mandantendaten lesen oder geschützte Dateien verändern kann.
4. Bis diese Nachweise bestehen, bleibt jede Ausführung von generiertem Code gesperrt.

**P3 — isolierte Programmierumgebung aufbauen**
1. Separater, kurzlebiger Workspace außerhalb des laufenden App-Prozesses und außerhalb des Produktiv-Deployments.
2. Standardmäßig kein Netzwerk, keine Produktions-/Staging-Secrets, keine Supabase-Zugangsdaten und kein Zugriff auf echte Spieler-/Scout-Daten.
3. Ressourcenlimits für CPU, RAM, Laufzeit, Speicher, Dateigröße, Prozesszahl und Ausgabevolumen; harte Timeouts und zuverlässige Beendigung.
4. Nur explizit freigegebene, synthetische Testdaten und eine eng begrenzte Dateimount-Allowlist.
5. Echte Compiler/Testwerkzeuge je Sprache in fest versionierten Images. Zunächst Python und JavaScript/TypeScript; weitere Sprachen erst nach Bedarf und Sicherheitsprüfung. Compiler-Ausgaben und Exit-Codes müssen maschinenlesbar erfasst werden.
6. Ausführung nur in einer isolierten Sandbox mit restriktiven OS-/Container-Rechten. Kein dynamisches `exec` im Webserver-Prozess und keine vermeintliche Sicherheit allein durch Prompt-Regeln.
7. Jeder Lauf erhält eine unveränderliche Run-ID, Quellcode-/Benchmark-SHA, Toolchain-Versionen, Eingabe-/Ausgabe-Hashes, Zeit-/Ressourcenverbrauch, Exit-Code und Testbericht.
8. Workspace nach Abschluss oder Timeout automatisch vernichten; nur freigegebene, bereinigte Artefakte und Protokolle dauerhaft speichern.

**P4 — kontrollierte automatische Verbesserungsschleife**
1. Fehler erkennen und reproduzierbaren Testfall erstellen.
2. Ursache und Hypothese mit Belegen formulieren.
3. Begrenzte Änderung in isoliertem Workspace erzeugen.
4. Compiler, Unit-, Integrations-, Regression-, Security- und Tenant-Isolation-Tests ausführen.
5. Ergebnis gegen unveränderten Benchmark vergleichen; keine Verbesserung behaupten, wenn sie nicht messbar ist.
6. Bei Fehlern höchstens eine festgelegte Zahl von Reparaturversuchen; danach stoppen und verständlich berichten.
7. Bestes Ergebnis, Fehlschläge und Belege dauerhaft im Run-Ledger speichern.
8. Ausschließlich einen Vorschlag mit Diff, Testergebnissen, Risiken und Rollback an myKI übergeben.
9. Admin prüft und entscheidet. Erst danach darf ein separater, kontrollierter Staging-Integrationsprozess beginnen.
10. Keine Selbstfreigabe, kein automatisches Merge und kein Produktionsdeployment.

**P5 — dauerhaftes Programmiergedächtnis und Lernkontrolle**
- Versionierte Wissenseinträge mit Quelle, Sprache/Version, Voraussetzungen, Beispiel, Testbeleg, Gültigkeitsbereich und Datum speichern.
- Hypothesen, fehlgeschlagene Versuche und bestätigte Erkenntnisse voneinander trennen.
- Nur reproduzierbar bestätigte Erkenntnisse als gesichertes Wissen markieren; widersprüchliche oder veraltete Inhalte versionieren und zur Prüfung markieren.
- Wissen tenant-/rollenbewusst abrufen und gegen Prompt-Injection in externen Quellen schützen.
- Keine automatische Veränderung von Modellgewichten behaupten. Lernen bedeutet hier zunächst kontrollierte Aktualisierung des versionierten Wissens, der Regeln und der geprüften Erfahrungsbasis.

**P6 — Abschlussqualität**
- Vollständige Tests für Admin-/Scout-Rollen, Mandantentrennung, Chat, Research, Learning, myKI, Scheduler, Sandbox und Fehlerwiederherstellung.
- Mobile/Desktop-Regression, Accessibility, Performance und Observability.
- Alle offenen Findings mit Schweregrad, Beleg, Verantwortlichkeit und Status dokumentieren.
- Nach jeder tatsächlichen STAGING-Freigabe Commit, Deployment, Tests, Health und bekannte Grenzen eintragen.
- Produktion bleibt gesperrt, bis der Eigentümer ausdrücklich in einer aktuellen Unterhaltung eine Produktionsfreigabe erteilt.

### 12.4 Arbeitsregeln und Definition of Done

- Arbeitsbranch bleibt `feature/messinho-unified-ai-integration`; ausschließlich STAGING.
- Vor jedem Schreibvorgang Branch-HEAD und Dateiversion frisch lesen. Bei abweichendem SHA Änderungen neu abgleichen, nicht blind überschreiben.
- Keine Migration ohne Schema-/RLS-/RPC-/Rollback-Prüfung und ausdrückliche Staging-Freigabe.
- Keine echten personenbezogenen oder vertraulichen Daten in Sandbox-Testfällen, Tickets, Prompts oder Logs.
- Jede Aufgabe gilt erst als erledigt, wenn Code vorhanden, Tests auf dem konkreten Commit bestanden und — falls Laufzeitverhalten betroffen ist — der exakte STAGING-Deploy live verifiziert wurde.
- Ein erfolgreicher Build ist kein erfolgreicher Funktionstest. Ein CI-Erfolg ist kein Deploy. Ein Deploy ist kein Ende-zu-Ende-Nachweis.
- Bei Unsicherheit Status als `nicht verifiziert` dokumentieren, nicht schätzen.

**Nächster konkreter Arbeitsschritt:** P0 vollständig abschließen. Erst wenn Branch-HEAD, CI und STAGING-Deployment eindeutig übereinstimmen, P1 (Admin-/Scout-Ende-zu-Ende-Test) ausführen. Danach P2 vor P3 — die Sandbox darf nicht vor bewiesenen Daten- und Berechtigungsgrenzen aktiviert werden.


## 13. Admin-Steuerung, kooperativer Stopp und Reifegrad — 2026-11-27

### 13.1 Verbindliche Bedienung im Admin-myKI-Bereich
- Die Reifegradanzeige wird ausschließlich über die geschützte Admin-Statusroute \`/api/admin/myki/status\` geladen. Die Route verlangt einen freigeschalteten Administrator. Die normale Scout-Chatroute gibt keine Reifegrad-, Steuerungs- oder Engineering-Statusdaten aus.
- Die Reifegradskala ist in \`backend/messinho-maturity.js\` definiert:
  - 0–19 Anfänger-Agent
  - 20–39 Verbesserter Agent
  - 40–59 Erweiterter Agent
  - 60–99 Super Agent
  - 100 High-Level Premium Agent (Premium-Stufe wird ausschließlich bei 100/100 vergeben)
- Aktueller nachweisbasierter Wert aus den neun Reifebereichen: **46/100 — Erweiterter Agent**. Das ist der Code-/Teststand, keine Bestätigung des aktuellen Live-Deployments.
- Letzter vollständig bestandener Backend-CI-Lauf zum dokumentierten Prüfzeitpunkt: Commit \`85b5d384fdcc0dc3ddc9950284b797ace89e4892\`, 396 Tests bestanden, 0 fehlgeschlagen. Die Reifegradbewertung bleibt konservativ, bis die Funktionen auf STAGING Ende-zu-Ende geprüft sind.

### 13.2 Betriebsmodi
- \`paused\`: keine autonomen Engineering-Prüfungen starten. Normale direkte Chatfragen und vom Admin angeforderte Analysen bleiben möglich.
- \`working\`: MESSINHO wartet auf konkrete Admin-Aufträge und bearbeitet diese über den bestehenden Agenten.
- \`developing\`: MESSINHO darf die freigegebene technische Selbstprüfung starten. Bei Admin-Aktivierung wird – sofern die explizite STAGING-Umgebungsfreigabe vollständig erfüllt ist – sofort ein Entwicklungsreview angestoßen. Der tägliche Scheduler bleibt auf Europe/Berlin 20:00 und verwendet den idempotenten Tages-Ledger.
- \`stop\`: setzt den Modus auf \`paused\` und setzt \`stop_requested=true\`. Die Agent-Orchestrierung prüft das Signal zwischen einzelnen Fähigkeiten, speichert bereits erledigte Ergebnisse und lässt nicht ausgeführte Fähigkeiten als offen zurück. Ein gestoppter Lauf wird nicht als abgeschlossen ausgegeben; automatische Wiederholungen und myKI-Vorschlagsübergabe werden für diesen Lauf unterdrückt.
- Der Scheduler prüft den Admin-Modus vor dem Start und erneut nach der Vorschlagsgenerierung. Wenn während der Generierung ein Stopp eingeht, wird kein Ticket mehr gespeichert.
- Der Admin kann MESSINHO im Chat fragen: „Woran arbeitest du gerade?“ Die Antwort wird aus dem gespeicherten Task-/Review-Status erzeugt und nennt Auftrag, Status und offene Schritte. Während einer laufenden Anfrage bleibt diese reine Statusfrage im UI absendbar.

### 13.3 Technische Umsetzung
- Frontend: \`src/asi/MyKiChat.jsx\`, \`src/asi/myki-chat.css\`.
- Geschützte API: \`GET /api/admin/myki/status\`, \`POST /api/admin/myki/control\`.
- Statusfrage im Chat: Admin-only Intent \`myki_live_work_status\` in \`backend/server.js\`.
- Dauerhafte Steuerung: vorhandene Tabelle \`public.messinho_agent_control\` auf \`myScoutingDatabase-staging\`; Migration \`20261127011122\` ist in der Staging-Migrationshistorie vorhanden. Die Tabelle war bereits mit \`mode='paused'\` und \`stop_requested=true\` initialisiert. Es wurde keine zweite Steuerungstabelle angelegt.
- Agent-Haltepunkt: \`backend/messinho-orchestrator.js\` prüft \`shouldStop\` vor jedem Fähigkeitsschritt. \`backend/messinho-agent-core.js\` unterdrückt bei Stopp Retry und myKI-Proposal-Dispatch.
- Engineering-Scheduler: \`backend/messinho-engineering-scheduler.js\` respektiert \`paused\`/\`developing\` und den Stop-Flag; der manuelle Start ist nur bei gültigem explizitem STAGING-Gate aktiv.
- Es wurden keine produktiven Daten oder produktiven Deployments verändert.

### 13.4 Testnachweise
- Neue Orchestrator-Regression: kooperativer Stopp lässt nicht ausgeführte Fähigkeiten offen und meldet \`stopped\`.
- Neue Scheduler-Regression: \`paused\` blockiert den autonomen Start; Stopp während der Vorschlagsgenerierung verhindert das Speichern eines myKI-Tickets.
- Admin-Steuerungs- und Statuscode wurde in der Backend-Syntaxprüfung und im vollständigen \`npm test\` des Commit \`85b5d384fdcc0dc3ddc9950284b797ace89e4892\` geprüft.
- Ergebnis: 396 Tests bestanden, 0 fehlgeschlagen.
- Nicht nachgewiesen: Admin-/Scout-Ende-zu-Ende-Tests im Browser, Statusroute auf dem aktuellen Render-STAGING-Deploy, tatsächlicher Stop eines laufenden Render-Prozesses und erneuter Sandbox-Workflow nach der Korrektur \`cp -a\` → \`cp -R\`.

### 13.5 Noch zwingend offen
1. Neueste Feature-Branch-Revision nach den Admin-Control-Änderungen mit Render-STAGING-Deployment vergleichen; nicht auf Basis eines älteren Commits freigeben.
2. Supabase-STAGING-Migrationstabelle und \`messinho_agent_control\`-Row nochmals gegen den aktuellen Code prüfen; die vorhandene Steuerungstabelle verwenden, keine Duplikate anlegen.
3. Auf STAGING als Admin testen: Statusanzeige, 46/100, Pause, Arbeiten, Weiterentwickeln, Statusfrage während eines Laufs und Stop.
4. Als Scout und als nicht freigeschalteter Admin Negativtests durchführen; keine Reifegrad- oder Steuerungsdaten dürfen sichtbar sein.
5. Einen laufenden Agentenauftrag starten, Stop auslösen und beweisen, dass am nächsten sicheren Haltepunkt beendet, der Zwischenstand gespeichert und kein Vorschlag nach dem Stop erzeugt wird.
6. Sandbox-Workflow mit korrigierter Dependency-Kopie erneut ausführen; erst nach erfolgreichem Baseline- und Kandidatenlauf den Engineering-Reifegrad erhöhen.
7. Erst nach erfolgreicher STAGING-Abnahme und ausdrücklicher Eigentümerfreigabe über einen Produktionsstart sprechen.

**Aktueller Betriebszustand der Datenbanksteuerung:** \`paused\`, \`stop_requested=true\`. MESSINHO startet dadurch keine autonome Entwicklungsprüfung, bis ein Administrator in myKI bewusst einen anderen Modus auswählt.


## 14. Verbindlicher Entwicklungs- und Ruheplan — 2026-11-27

Dieser Abschnitt ersetzt für die autonome Engineering-Planung die ältere Angabe „täglich 20:00 Uhr“ aus Abschnitt 13. Alle Zeiten sind lokale Zeit in `Europe/Berlin`, einschließlich Sommer-/Winterzeit.

### 14.1 Zeitfenster
- **03:00–08:00 — morgendliches Entwicklungsfenster:** MESSINHO darf bei Admin-Modus `developing` seine geplante technische Selbstprüfung und Verbesserung durchführen.
- **08:00–10:00 — Pause:** keine autonome Engineering-Arbeit.
- **10:00–23:00 — Tages-/Abendfenster:** autonome Engineering-Arbeit ist bei Admin-Modus `developing` wieder zulässig.
- **23:00–03:00 — Nachtruhe:** keine autonome Engineering-Arbeit.
- Die Fenster werden serverseitig im Scheduler geprüft; die Oberfläche allein ist keine Sicherheitsgrenze.
- Pro Fenster wird aktuell höchstens ein idempotenter Engineering-Review gestartet (maximal zwei Reviews am Kalendertag). Das ist ein geplanter Review-/Verbesserungslauf je Fenster, noch kein nachgewiesener ununterbrochener fünfstündiger Entwicklungsprozess.

### 14.2 Chat bleibt jederzeit verfügbar
- Die Ruhe- und Pausenzeiten sperren ausschließlich autonome Engineering-Arbeit.
- Scouts und Administratoren dürfen MESSINHO weiterhin rund um die Uhr über den normalen Chat ansprechen.
- Normale Fragen, Spieleranalysen und zulässige Benutzeraufträge werden nicht wegen des Entwicklungszeitplans abgeschaltet.
- Reifegrad, interne Steuerung und Engineering-Status bleiben ausschließlich im geschützten Admin-myKI-Bereich sichtbar.

### 14.3 Technische Umsetzung
- Zeitfenster und Berlin-Zeitberechnung: `backend/messinho-engineering-scheduler.js`.
- Idempotenz: je Datum und Fenster (`morning` / `daytime`); Migration `supabase/migrations/20261127200000_messinho_engineering_work_windows.sql` erweitert die Review-Tabelle um `review_slot` und setzt Datum+Fenster als Eindeutigkeit.
- Ein Review, das über das Ende seines Zeitfensters hinausläuft, wird kontrolliert beendet; ein danach erzeugter Vorschlag wird nicht als myKI-Ticket gespeichert.
- Admin-Statusroute liefert Fenster, Ruhezeiten und aktuelle Phase aus.
- Admin-myKI zeigt beide Entwicklungsfenster, beide Ruhezeiten und den Hinweis auf die 24/7-Chat-Erreichbarkeit.
- Der bestehende Admin-Modus und der Stop-Schalter bleiben zusätzliche Bedingungen: außerhalb der Zeitfenster keine autonome Arbeit; innerhalb der Zeitfenster nur bei `developing` und ohne Stop-Anforderung.

### 14.4 Noch offen / nicht als erledigt ausgeben
1. Die neue Supabase-Migration muss vor Aktivierung auf **STAGING** geprüft und angewendet werden; sie wurde nicht auf Produktion angewendet.
2. CI und Scheduler-Tests auf dem neuen Commit ausführen; insbesondere Berlin-Zeit, Sommer-/Winterzeit, beide Fenster, Pausen, Nachtruhe, doppelte Scheduler-Instanzen und Zeitfensterende prüfen.
3. Render-STAGING-Deploy mit genau diesem Commit verifizieren.
4. Im Browser als Admin beide Zeitfenster und den Status testen; als Scout und nicht freigeschalteter Admin bestätigen, dass keine Admin-Steuerung oder Reifegradanzeige sichtbar ist.
5. Den normalen Scout-/Admin-Chat während Pause und Nachtruhe praktisch testen.
6. Derzeit sind maximal zwei geplante Reviews pro Tag vorgesehen. Ein längerer, fortlaufender Entwicklungsprozess mit wiederholten Compiler-/Test-/Verbesserungszyklen über das gesamte Zeitfenster bleibt ein eigener offener Entwicklungsschritt und darf nicht durch die bloße Scheduler-Zeitfensterprüfung als umgesetzt gelten.

**Produktionsschutz:** ausschließlich Feature-Branch und STAGING. Keine Produktionsmigration, kein Produktionsdeploy und keine automatische Integration.


## 15. Prognose-Datenpipeline und autonome Sandbox-Prüfung — 2026-11-27

- MESSINHO lädt für Prognoseaufträge ausschließlich player_id- und owner_id-begrenzte Datensätze aus asi_external_evidence, asi_contract_snapshots, asi_prediction_records und asi_prediction_outcomes.
- Externe Transferhinweise werden nur bei gematchter Identität, confirmed/corroborated verification, approved review, ordinary data classification und approved/not_required legal review berücksichtigt. Abgelaufene Belege werden verworfen.
- Vertrags-Snapshots werden nur verwendet, wenn sie auf einen geprüften und rechtlich freigegebenen Evidence-Datensatz verweisen.
- Spielerentwicklungs- und Marktwertverläufe entstehen nur aus verifizierten Outcomes oder explizit strukturierten, rechtlich freigegebenen Messwerten.
- Erfolgs-/Misserfolgsvergleiche werden nach einer vom Nutzer/Admin festgelegten success_definition getrennt. Ohne Definition gibt MESSINHO keine Erfolgsrate aus.
- Transfer-Szenarien werden qualitativ anhand geprüfter unabhängiger Hinweise und verifizierter aktueller Vertrags-Snapshots ausgegeben. Ohne kalibrierten historischen Datensatz wird keine individuelle Prozentwahrscheinlichkeit behauptet.
- Abgeschlossene zeitgebundene Prognosen werden mit Modellversion, Cutoff, Intervall, Methode und Quellen-IDs in asi_prediction_records gespeichert; identische Metrik-/Horizont-Kombinationen werden sechs Stunden dedupliziert.
- Der vorhandene Zeitplan aus Abschnitt 14 bleibt unverändert. Nach Erzeugung eines echten myKI-Tickets wird der Patch – sofern STAGING-Gate, Arbeitszeitfenster, Admin-Modus und GitHub-Sandbox-Token weiterhin gültig sind – automatisch an die isolierte Sandbox übergeben. Kein Merge, keine automatische Integration und kein Deployment.
- Forecast- und Sandbox-Änderungen sind erst nach erneutem CI-Lauf und vollständigem Sandbox-Baseline-/Kandidatenlauf als verifiziert einzustufen.
- Staging-Datenbankprüfung vom 27.11.2026 zeigte keine Spieler, keine External-Evidence-Einträge, keine Vertrags-Snapshots und keine Prediction-Outcomes. Die Algorithmen können deshalb derzeit nur synthetisch getestet werden; reale Prognosen benötigen verifizierte Verlaufsdaten.
- Die Migrationshistorie enthält 20261127011122 für messinho_agent_control. Die entsprechende SQL-Datei liegt als Source of Truth im Repository. Die frühere asi_core_schema-Migration bleibt ein offener Schema-Drift-Punkt.
- Der aktuelle Zeitplan erlaubt höchstens zwei Reviews pro Tag. Ein fortlaufender mehrstufiger Entwicklungsprozess über das ganze Arbeitszeitfenster bleibt offen und wird nicht als umgesetzt ausgegeben.
- Production bleibt unangetastet. Der Fachwissensimport (Biologie usw.) folgt erst nach erfolgreicher Agenten- und Prognosefreigabe.



## 15. Verbindliche Rollen- und Befehlsgrenze für MESSINHO — 2026-11-27

**Grundsatz:** Scouts dürfen MESSINHO als Scouting-Assistent nutzen, aber keine system- oder MESSINHO-verändernden Verwaltungsbefehle ausführen. Diese Rechte sind ausschließlich freigeschalteten Administratoren vorbehalten.

**Scout darf:** Spieler suchen, recherchieren, vergleichen und analysieren; normale Fragen zu Fußball, Taktik, Training und Scouting stellen; freigegebene Wissenseinträge verwenden; eigene Scout-Aufgaben ausführen.

**Ausschließlich Admin darf:** MESSINHO pausieren, stoppen, starten oder den Betriebs-/Entwicklungsmodus ändern; autonome Entwicklung und Programmier-Sandbox steuern; Code/Systemkonfiguration verändern; Kernwissen importieren, freigeben oder aktivieren; Modellversionen, Modellgewichte, Scoring-Grundlagen, Kernregeln oder Agentenverhalten verändern; Rollen, Berechtigungen und administrative MESSINHO-Funktionen verwalten.

**Technische Durchsetzung:** Die Trennung muss serverseitig erfolgen; UI-Ausblendung allein reicht nicht. Der Chat-Endpunkt prüft Scout-Nachrichten vor dem Routing auf administrative Änderungsabsichten und weist solche Befehle verständlich ab. Direkte Admin-API-Routen benötigen weiterhin eigene serverseitige Admin-Prüfungen. Neue Funktionen sind standardmäßig Admin-only, bis ihre Scout-Freigabe ausdrücklich geprüft wurde. Normale Scout-Fragen und Spieleranalysen bleiben verfügbar.

**Status:** Zentrale Befehlsprüfung im Feature-Branch implementiert; Tests hinzugefügt. Vollständiger End-to-End-Audit aller schreibenden API-Endpunkte/RPCs, CI-Ausführung und STAGING-Browserprüfung sind noch offen. Keine Production-Änderung.

| 2026-11-27 | Scouts dürfen keine wichtigen Befehle geben, die MESSINHO oder das System verändern. | Accepted; server-side guard implemented in feature branch; verification pending | Scout-Chat bleibt für normale Scouting-Aufgaben offen. Systemsteuerung, Kernwissen, Lern-/Modelländerungen, Sandbox und administrative Befehle sind Admin-only. Vollständigen Schreib-Endpunkt-Audit vor STAGING-Freigabe durchführen. |


### 15.1 Prüfstand nach Commit 0559ad94

- 422/422 automatisierte Node-Tests bestanden.
- Backend-JavaScript-Syntaxprüfung bestanden.
- Staging-Branch-CI bestanden.
- Staging-Health-Smoke-Test bestanden.
- Isolierter Engineering-Sandbox-Workflow läuft als Push-Baseline. Da kein validierter Job-Payload über workflow_dispatch übergeben wurde, ist damit noch kein echter Kandidaten-Patch geprüft und kein STAGING-Ergebnis-Callback belegt.
- Render-STAGING ist separat manuell zu deployen; Auto-Deploy ist deaktiviert. Production wurde nicht verändert.


## Checkpoint — 2026-11-27 02:24 CET — verified repository, STAGING and database state

### Binding operating boundary
- Project: `myScoutingDatabase` / MESSINHO only. PFMS/PFSS are excluded.
- Working branch: `feature/messinho-unified-ai-integration`. The dedicated Render STAGING service is configured to this branch; auto-deploy remains disabled.
- Production `main`, production Render and production Supabase are not to be changed. PR #47 remains Draft and unmerged.
- Branch comparison against `main` reports `diverged`, 969 commits ahead and 1 behind. Do not merge or rebase as part of this checkpoint; preserve the isolated STAGING workflow.
- Main HEAD observed during this audit: `38780d357384c7a2473e16bfabfe949017450042`.

### Verified STAGING deployment
- Render service: `myscoutingdatabase-messinho-staging`, ID `srv-dc3chlqjnfac73acd6ig`.
- URL: https://myscoutingdatabase-messinho-staging.onrender.com
- Latest listed deployment: `dep-dc4coauq1p3s73djppfg`.
- Deployed commit: `1fa757abfae08703aa64a315bcbf5ca4907ba516`.
- Render status: `live`, completed `2026-11-27T00:18:23Z`.
- Build logs for this deployment show **370 tests passed, 0 failed**, followed by Vite build success (1,639 modules transformed), successful `npm start`, API listening on port 10000, Supabase Data API HTTP 200, and Tavily/OpenAI configured.
- The current combined GitHub commit-status query returned no status entries and the commit-workflow-runs query returned no runs. Therefore the 370-test claim above is grounded in Render build logs, not a separate GitHub Actions run assertion.
- This verifies the STAGING runtime start and build, not every authenticated UI, Scout/Admin, research, memory, or sandbox workflow.

### Current MESSINHO operating state
- STAGING database `messinho_agent_control` currently reports `mode='paused'`, `stop_requested=true`, with status message that activation requires an administrator.
- The scheduler source defines Europe/Berlin work windows 03:00–08:00 and 10:00–23:00; 08:00–10:00 is a break and 23:00–03:00 is night rest.
- The scheduler is opt-in and requires the explicit STAGING service gate, provider/database configuration and a developing admin control state. Do not claim autonomous scheduled work is running while the global control row is paused.

### Knowledge foundation — live STAGING database observation
- STAGING Supabase project: `nwqwnrhupbyhshsprxjt`.
- Read-only database inspection confirms the knowledge concept, link and version tables exist.
- Current row counts: `messinho_knowledge_concepts=1`, `messinho_knowledge_links=0`, `messinho_knowledge_versions=3`, legacy `messinho_domain_knowledge=0`.
- No broad specialist knowledge import has been completed. The knowledge architecture is present, but the knowledge corpus is not yet populated.
- Engineering ledger counts at audit time: `messinho_engineering_jobs=0`, `messinho_engineering_memory=0`, `messinho_engineering_review_runs=0`, `messinho_myki_tickets=0`.
- These are point-in-time counts; do not infer future activity from them.

### Engineering sandbox and programming intelligence
- Implemented source files include the dedicated compiler image, isolated GitHub Actions workflow, staging dispatcher, GitHub OIDC identity verifier, engineering proposal/memory helpers, and language-aware code intelligence.
- The programming curriculum defines 11 language/tooling areas and is integrated into the existing Admin MESSINHO programming context. This is structured learning content, not proof of expert practical mastery or neural-weight training.
- The isolated runner is designed for a pinned feature-branch SHA, bounded patch/path validation, a non-root network-disabled container, resource limits, evidence callback and Admin review.
- First recorded sandbox baseline was inconclusive because a read-only dependency symlink prevented Vite from resolving Rollup. The dependency copy was changed to a physical copy; the follow-up run is not yet recorded as passed in the sandbox implementation note.
- Required GitHub Actions token and explicit sandbox enablement are documented as not yet configured. Do not claim the automatic sandbox is available to MESSINHO or that candidate patches have been executed successfully.
- A sandbox test result, Admin approval of programming memory, repository integration and STAGING deployment are separate gates.

### myKI and Scout command boundaries
- Source code contains a central command guard for requests that attempt to change MESSINHO, the platform, system configuration, knowledge, model, autonomy or permissions.
- Ticket transitions require an approved Admin; the code currently rejects the `integrating` transition until the isolated executor is authorized and rejects `integrated` unless tests, security, tenant isolation, STAGING deployment and health checks are all verified.
- Ticket proposal creation is connected to a trusted Admin agent result path. The database currently contains zero myKI tickets.
- These source-level safeguards do not replace authenticated adversarial E2E tests for Scout, unapproved Admin and approved Admin roles. Do not report those role tests as complete until executed.

### Concrete blocker found — scheduler/database contract mismatch
- Current scheduler code inserts and reads `review_slot` in `messinho_engineering_review_runs`.
- The live STAGING table currently has no `review_slot` column; its columns are `id, review_date, status, started_at, finished_at, source_sha, ticket_id, error_code, created_at`.
- The branch contains migration `supabase/migrations/20261127200000_messinho_engineering_work_windows.sql`, which adds `review_slot` and replaces date-only uniqueness with date/slot uniqueness. The STAGING migration history does not show this migration as applied.
- Therefore the scheduler's multi-slot idempotency contract is not yet compatible with the current STAGING schema. Do not enable scheduled engineering until the migration is reviewed, applied only to the dedicated STAGING database, and verified with focused tests.
- No migration was applied and no database rows or settings were changed during this audit.

### Supabase advisor observations
- Security advisor reports 12 `RLS enabled / no policy` informational findings on tables intentionally restricted to backend service-role access. Verify grants and API exposure before changing these; do not add broad browser policies just to silence the advisor.
- It also reports a warning for `admin_set_scout_approval` being callable by authenticated users as SECURITY DEFINER, and a warning that leaked-password protection is disabled. The RPC is documented as narrowly scoped with Admin checks; review its grants and function body before any change. Leaked-password protection remains a STAGING Auth configuration follow-up.
- No security setting was changed during this audit.

### Next work — ordered, do not repeat completed tasks
1. Fix the scheduler/database mismatch safely: review migration `20261127200000_messinho_engineering_work_windows.sql`, add/confirm migration tests, apply only to STAGING, verify `review_slot` and unique date/slot behavior. Keep MESSINHO paused until the owner explicitly activates it.
2. Confirm the sandbox follow-up run against the exact candidate SHA; capture its workflow run, job logs and callback evidence. If not passed, diagnose the actual failure before retrying.
3. Configure only the dedicated STAGING sandbox credentials and explicit enablement after security review; never copy production credentials or enable code execution in the API process.
4. Run approved-Admin and Scout role E2E tests for myKI, protected commands, ticket visibility, copy, and status transitions. No Scout may issue platform-changing commands.
5. Complete authenticated STAGING checks for the existing chat, maths, research, memory/task persistence and diagnostics using dedicated test accounts.
6. Only after those gates pass, begin the governed knowledge import using rights-cleared sources and the existing concept/version graph. Do not bulk-import PDFs/books or treat unreviewed candidates as verified knowledge.
7. Re-run full tests, security/advisor review and exact-deployment health checks; update this record after each meaningful milestone.

### Audit scope and non-mutation statement
- Read-only GitHub, Render log/service/deployment and STAGING Supabase inspections were performed.
- No source code, branch ref, PR, Render environment variable, deployment setting, database schema, database row, user/scout/player record or model weight was changed by this audit.
- This checkpoint records observed state; it is not a release, integration approval, production change or declaration of full completion.


## 16. STAGING-Migration für Entwicklungsfenster — 2026-11-27

- Migration 20261127012816_messinho_engineering_work_windows wurde ausschließlich auf dem Supabase-STAGING-Projekt nwqwnrhupbyhshsprxjt angewendet.
- Die Supabase-Migrationshistorie bestätigt Version 20261127012816; review_slot und der eindeutige Index (review_date, review_slot) wurden nach der Migration geprüft. Bestehende Review-Zeilen werden mit legacy erhalten; es wurden keine Review-Daten gelöscht.
- Die ursprüngliche Repository-Datei mit geplantem Zeitstempel 20261127200000 wird auf die tatsächlich registrierte Migrationsversion 20261127012816 umgestellt, damit Git-Datei und Remote-Migrationshistorie synchron bleiben.
- Production wurde nicht verändert.
- Nach der Migration meldet der Supabase-Advisor weiterhin offene, getrennt zu bearbeitende Punkte: eine SECURITY DEFINER-Freigabefunktion ist für authenticated ausführbar; der Schutz vor kompromittierten Passwörtern ist deaktiviert; vier Foreign-Key-Spalten haben keinen unterstützenden Index. Die zwölf RLS-Tabellen ohne Policies sind derzeit bewusst service-role-only und müssen bei einer späteren Änderung erneut geprüft werden.
- MESSINHO bleibt pausiert, bis der GitHub-Sandbox-Token und die STAGING-Sandbox-Freigaben nachgewiesen sind und ein echter Kandidatenlauf samt Rückmeldung erfolgreich war.


## 17. Sprachintelligenz — sechs Sprachprofile — 2026-11-27

### Verbindliche Sprachentscheidung
MESSINHO erhält eine mehrsprachige Sprachintelligenz für:
1. Deutsch (de)
2. Englisch (en)
3. Französisch (fr)
4. Hocharabisch / Modern Standard Arabic (ar)
5. Tunesisch-Arabisch / Derja (ar-tn), sowohl arabische Schrift als auch lateinische Umschrift (Arabizi)
6. Spanisch (es)

Hocharabisch und tunesische Derja sind getrennte Sprachprofile. MESSINHO soll zusätzlich gemischte Nachrichten (Code-Switching), unterschiedliche Schriftsysteme und den Wechsel der Sprache innerhalb eines Gesprächs berücksichtigen.

### Implementierung auf dem Feature-Branch
- Neues Modul: backend/messinho-linguistic-intelligence.js.
- Neue Tests: tests/messinho-linguistic-intelligence.test.js.
- Integration: backend/server.js erzeugt für jede Chatnachricht einen Sprachkontext, gibt eine kompakte Sprachdiagnose als Antwortmetadatum zurück und übergibt dem Chatmodell die Sprachregeln und erkannte Signale.
- Erkannte Signale umfassen unter anderem Frage-/Korrektur-/Übersetzungsabsicht, Verneinung, Unsicherheit, Kontrast, Höflichkeit, Tokenanzahl und Schriftsysteme.
- Der Sprachkontext fordert Antworten grundsätzlich in der Sprache der letzten Nutzernachricht, bewahrt Bedeutungsnuancen und behandelt Dialekt nicht als fehlerhafte Standardsprache.
- Tunisian Derja wird getrennt über arabische Dialektmerkmale und lateinische Arabizi-Ausdrücke erkannt. Bei niedriger Sicherheit wird keine Sprache erzwungen.
- Die Sprachprofile enthalten eine erste strukturierte Grammatik-/Kompetenz-Taxonomie (z. B. deutsche Fälle und Wortstellung, französische Genus-/Kongruenzregeln, arabische Wurzelmuster, tunesische Dialekt- und Arabizi-Erkennung). Das ist eine Grundlage für den weiteren Wissensaufbau, noch kein vollständiges Grammatiklexikon.

### Recht und Datenqualität
- Es wurde kein Duden-Inhalt kopiert oder importiert. Der Duden bleibt eine mögliche Referenz, soweit eine rechtmäßige Nutzung/Lizenz vorliegt.
- Das neue Modul enthält nur eine kleine, selbst formulierte Startmenge an Erkennungsmerkmalen und keine vollständige Wörterbuchdatenbank.
- Sprachdetektion ist ein Hinweis und kein Beweis für die tatsächliche Sprache. Mehrdeutige Kurztexte bleiben bewusst unbestimmt.
- Das Modul übersetzt und korrigiert den Text nicht automatisch und behauptet keine vollständige Sprachbeherrschung.
- Die dauerhafte Grammatik-/Wortschatz-Wissensbasis muss weiter über das bestehende versionierte Wissensgraph-/Rechteverfahren aufgebaut werden: Herkunft, Lizenz, Version, Prüfstatus, Konfidenz und Admin-Freigabe bleiben verpflichtend.

### Verifikation / offene Punkte
- Testfälle wurden für sechs Sprachprofile, tunesisches Arabisch in beiden Schriften, Code-Switching, Mehrdeutigkeit, Gesprächskontinuität und Nuancensignale angelegt.
- Die Tests wurden mit dem Commit noch nicht ausgeführt. Es liegt daher noch kein Testergebnis vor.
- CI, Backend-Syntaxprüfung, STAGING-Deployment und authentifizierte Browser-/Chat-E2E-Prüfung stehen aus.
- Vor STAGING-Freigabe müssen besonders Fehlklassifikationen zwischen Hocharabisch und Derja, kurze Nachrichten, regionale Varianten und mehrsprachige Sätze geprüft werden.
- Der Chat bleibt 24/7 verfügbar; diese Änderung verändert weder den autonomen Entwicklungszeitplan noch die pausierte Engineering-Steuerung.
- Scout/Admin-Rollen und die bestehenden Admin-only Systembefehle werden durch die Sprachdiagnose nicht erweitert.

### Änderungsprotokoll
| 2026-11-27 | MESSINHO soll normale Konversation mit Grammatik- und Wortschatzverständnis in Deutsch, Englisch, Französisch, Arabisch, Tunesisch und Spanisch unterstützen. | In Feature-Branch implementiert; Verifikation offen | Hocharabisch und tunesische Derja getrennt; Derja arabische Schrift und Arabizi; keine Duden-Vollkopie; bestehende Wissensgraph-/Rechte-Governance bleibt maßgeblich. |


## 17. Aktueller STAGING-Release und Freigabestatus — 2026-11-27

- Render-STAGING-Service srv-dc3chlqjnfac73acd6ig ist mit Commit 5c2676a85d5e5f126445bebfc1d7bc775d128cae live; Deployment dep-dc4dvj6c6qcc73d9iucg meldet status live.
- Runtime-Logs bestätigen API-Start, Supabase Data API HTTP 200 sowie konfigurierte Tavily- und OpenAI-Verbindung.
- 422/422 Node-Tests bestanden; Backend-Syntax, Staging-Branch-CI, Health-Smoke und Vite-Produktionsbuild bestanden.
- Supabase-STAGING-Migration 20261127012816_messinho_engineering_work_windows ist angewendet; review_slot und Composite-Unique-Index sind vorhanden.
- messinho_agent_control steht aktuell auf mode=working und stop_requested=false. Der Status lautet: wartet auf konkrete Admin-Aufträge. Das ist manueller Arbeitsmodus, nicht der autonome Entwicklungsmodus developing.
- MESSINHO_SANDBOX_GITHUB_TOKEN und die explizite Sandbox-Freigabe sind laut STAGING-Audit noch nicht konfiguriert. Der Push-Workflow besitzt keinen Kandidaten-Payload; daher liegt noch kein echter Compiler-/Kandidatenlauf mit Ergebnis-Callback vor.
- STAGING enthält derzeit 0 Spieler, 0 External-Evidence-Datensätze, 0 Vertrags-Snapshots, 0 Prognose-Datensätze und 0 verifizierte Prognose-Outcomes; die Sprachwissensbasis enthält 36 Versionszeilen. Die Prognosepipeline ist integriert, aber echte individuelle Prognosen benötigen zuerst Spielerdaten und verifizierte Historien.
- Production wurde nicht verändert. Kein automatisches Merge, keine automatische Integration und kein Production-Deployment.
- Nächster Freigabeschritt: fein granularen GitHub-Token direkt in Render-STAGING als Secret MESSINHO_SANDBOX_GITHUB_TOKEN hinterlegen (nur Repository Dridi06/myScoutingDatabase; Actions write, Contents read), MESSINHO_SANDBOX_ENABLED=true und MESSINHO_STAGING_RENDER_SERVICE_ID=srv-dc3chlqjnfac73acd6ig setzen. Danach echten Kandidatenlauf auslösen, Callback und Audit prüfen und erst anschließend den Admin-Modus auf Weiterentwickeln setzen.



## 18. Sprachwissensbasis — STAGING-Integration und Verifikation — 2026-11-27

### Umgesetzt
- Neue Tabelle `public.messinho_language_knowledge` ausschließlich im Supabase-STAGING-Projekt `nwqwnrhupbyhshsprxjt` angelegt.
- Zugehörige Repository-Migrationen verwenden die tatsächlich in STAGING registrierten Versionsnummern:
  - `20261127013548_messinho_language_knowledge_base.sql`
  - `20261127013559_messinho_language_lexicon_expansion.sql`
- 30 unterschiedliche Einträge über sechs Profile (de, en, fr, ar, ar-tn, es); 36 append-only Versionszeilen. Je Sprache fünf aktuelle Wissenseinträge: drei Grammatik, ein Lexikon, eine Pragmatik. Das Lexikon besitzt Version 1 und Version 2; alte Versionen bleiben erhalten.
- RLS aktiviert. `anon` und `authenticated` besitzen kein SELECT; nur `service_role` besitzt SELECT. Keine Schreibrechte für Scout/Admin-Chatrollen.
- Chatintegration liest aktive Wissenseinträge und übergibt nur passende Sprachgrundlagen an den Dialogkontext.
- Datenbankabfrage wurde an das tatsächliche Schema angepasst: `created_at` statt nicht vorhandener Spalte `updated_at`.
- Sprachdiagnose und Sprachwissen verwenden den ursprünglichen Nachrichtentext. Die deutsche Tippfehlerkorrektur bleibt davon getrennt; der Originaltext wird für Erkennung und Wissenssuche nicht überschrieben. Historische Nutzernachrichten werden nicht mehr pauschal durch den deutschen Korrektor geschickt.
- Fehler bei der Sprachwissensabfrage führen fail-closed zu leerem Wissenskontext; keine erfundenen Einträge.

### Datenbankprüfung
- STAGING-Abfrage bestätigt je Sprache 5 unterschiedliche aktive Einträge und 6 gespeicherte Versionen.
- Insgesamt 30 unterschiedliche Eintragsschlüssel und 36 Versionszeilen.
- Privilegienprüfung bestätigt: anon=false, authenticated=false, service_role=true für SELECT.
- RLS ist aktiv.
- Keine Produktionsdatenbank verändert.

### Tests / CI
- Auf Commit `35c2579807c8e93ded6adaca595a7a5afa6055a5` waren Node-Tests, Backend-Syntax, Staging-Branch-CI und Staging-Health-Smoke erfolgreich.
- Anschließend wurden ein reales Schema-Problem (`updated_at` statt `created_at`) behoben und ein Regressionstest für die Spaltenauswahl ergänzt. Die endgültigen Prüfungen für die nachfolgenden Commits müssen erneut abgewartet und auf dem exakten HEAD bestätigt werden.
- Der isolierte Engineering-Sandbox-Workflow wurde mehrfach durch neue Branch-Commits abgebrochen. Es liegt weiterhin kein Kandidaten-Payload und kein erfolgreicher Compiler-/Kandidatenlauf mit Callback vor.

### Release-Grenzen
- Render-STAGING Auto-Deploy ist deaktiviert. Eine neue Bereitstellung erfolgt erst nach erfolgreicher Prüfung des exakten Branch-HEAD und ausdrücklicher Freigabe.
- MESSINHO bleibt in `messinho_agent_control` pausiert. Keine autonome Entwicklung gestartet.
- Production, main, Produktionsdaten und Produktionsgeheimnisse wurden nicht verändert.
- Diese 30 Einträge sind eine erste Grundlagenbasis, kein vollständiges Wörterbuch und kein Nachweis muttersprachlicher Beherrschung. Ausbau erfolgt stufenweise mit Qualitätsprüfung, regionaler Differenzierung und rechtmäßigen Quellen.


### Ergänzende Prüfung und letzter Code-Stand — 2026-11-27
- Sprachdetektion wurde um kurze Alltagsbegrüßungen erweitert. Neue Regressionstests decken Hallo/Hello/Bonjour/السلام عليكم/Aslema/Hola ab.
- Finaler Sprachcode-Commit: `6b0eddac490c2b09aa301fcb58d75ced20a2ab22`.
- Für diesen exakten Commit sind MESSINHO Node Tests, Backend-Syntaxprüfung und Staging-Health-Smoke erfolgreich. Der kombinierte Staging-Branch-CI-Lauf wurde abgebrochen (nicht als Fehler gewertet); der Produktionsbuild wurde deshalb für diesen exakten Commit nicht bestätigt. Der letzte erfolgreiche Vite-Build liegt auf dem vorherigen Code-Stand; Frontend-Dateien wurden seitdem nicht geändert.
- Die isolierte Engineering-Sandbox hat noch keinen Kandidaten-Payload verarbeitet; ein Sandbox-Compilerergebnis ist nicht nachgewiesen.
- Render-STAGING ist weiterhin auf Auto-Deploy OFF. Letzter erfolgreicher Deploy vor der neuen Korrektur: Commit `35c2579807c8e93ded6adaca595a7a5afa6055a5`. Die Korrektur mit `created_at` und unverändertem Originaltext ist daher noch nicht live.
- Supabase-Kontrollstatus wurde aktuell erneut gelesen: `mode=working`, `stop_requested=false`, Statusmeldung „MESSINHO wartet auf konkrete Admin-Aufträge.“ Keine aktiven Tasks gefunden. Während dieses Arbeitsschritts wurde der Betriebsmodus nicht verändert. Frühere pauschale Dokumentationsangaben „paused“ sind anhand des aktuellen Live-Werts nicht bestätigt und müssen bei der nächsten Betriebsprüfung abgeglichen werden.
- Nächster Schritt bleibt ein gezielter STAGING-Deploy nach Bestätigung des Render-Workspaces, gefolgt von Health-/Runtime- und authentifizierten Chattests. Production bleibt unangetastet.


### 18.1 Migrationshistorie-Hinweis
- Die Remote-Migrationshistorie enthält zusätzlich zwei idempotente Registrierungen mit den Versionen 20261127013647 und 20261127013650, die bei einer erneuten Registrierung derselben Sprachwissensmigrationen entstanden sind.
- Die Tabellenprüfung zeigt weiterhin 30 eindeutige Eintragsschlüssel und 36 Versionszeilen; es wurden keine Wissenseinträge verdoppelt.
- Die ursprünglichen, tatsächlich passenden Repository-Migrationsdateien bleiben 20261127013548 und 20261127013559. Die zusätzlichen Remote-Historieneinträge werden nicht gelöscht; vor einem späteren Supabase-CLI-db-push ist die Migrationshistorie separat abzugleichen.


## 19. myKI MESSINHO-Aktivitätsmonitor — 2026-11-27

### Anforderung und Umsetzung
- Der Admin-Bereich `myKI` zeigt jetzt direkt unter der myKI-Kopfzeile einen eigenen, responsiven Bildschirm **„MESSINHO Aktivitätsmonitor“**.
- Neue Komponente: `src/asi/MyKiActivityMonitor.jsx`.
- Integration: `src/main.jsx`; Gestaltung: `src/styles.css`.
- Der Monitor fragt ausschließlich die bestehende geschützte Statusroute `GET /api/admin/myki/status` ab. Die Route verlangt einen freigeschalteten Admin über `requireApprovedMessinhoAdmin`.
- Aktualisierung nach Öffnen und anschließend alle 30 Sekunden; zusätzlich manuelle Aktualisierung.
- Angezeigt werden Betriebsmodus, tatsächliche Aufgabeninformation (falls gespeichert), letzter Entwicklungsprüflauf, automatische Scheduler-Freigabe, Sandbox-Status und die nächsten zustandsabhängigen Schritte mit verständlicher Begründung.
- Der Monitor ist bewusst **read-only**. Er ändert weder Betriebsmodus noch Aufgaben, Sandbox-Freigaben, Tickets, Daten oder Deployments.
- Der Plan unterscheidet gesperrte, ausstehende, vorgesehene, zu prüfende und abgeschlossene Schritte. Eine bloße Konfiguration wird nicht als erfolgreicher Sandbox-Test ausgegeben.
- Der vereinbarte Rhythmus wird sichtbar dargestellt: 03:00–08:00 Selbstentwicklung, 08:00–10:00 Pause, 10:00–23:00 Tagesphase, 23:00–03:00 Nachtruhe. Der Chat für Admins und Scouts bleibt davon unabhängig erreichbar.
- Die Anzeige behauptet keine laufende autonome Entwicklung, wenn kein entsprechender gespeicherter Arbeitsnachweis vorliegt.

### Tests und Deployment
- Finaler Feature-Branch-Code-Commit: `06989936718ecb5cb853b39a9c8070463d492e93`.
- GitHub Actions, Workflow `MESSINHO staging branch CI`, Run `45924388904`: erfolgreich; Regressionstests, Backend-Syntaxprüfungen und Vite-Produktionsbuild bestanden.
- Render Workspace: `My Workspace`, vom Eigentümer bestätigt.
- Ausschließlich Render-STAGING-Service `srv-dc3chlqjnfac73acd6ig` verwendet; Auto-Deploy bleibt deaktiviert.
- Deployment `dep-dc4e1mtg1s2s73e4luqg`, Commit `06989936718ecb5cb853b39a9c8070463d492e93`, Status `live`, abgeschlossen am `2026-11-27T01:46:53Z`.
- Runtime-Logs bestätigen `npm start`, Backend-Start, Supabase Data API HTTP 200 und Render-Meldung „Your service is live“.
- STAGING-URL: https://myscoutingdatabase-messinho-staging.onrender.com
- Kein Produktionscode, kein Main-Branch, kein Produktions-Render-Service und keine Produktionsdaten wurden in diesem Arbeitsschritt verändert.

### Grenzen und offene Verifikation
- Der Build und der STAGING-Prozessstart sind bestätigt. Ein authentifizierter Browser-/Admin-E2E-Test des neuen Bildschirms wurde in diesem Schritt nicht durchgeführt; hierfür ist eine angemeldete Admin-Sitzung erforderlich.
- Der Statusmonitor liest die bestehenden Statusdaten. Er ersetzt keine fehlende Telemetrie und kann keine nicht gespeicherten Gedanken oder Aktivitäten anzeigen.
- Der isolierte Engineering-Workflow `45924388916` war beim Dokumentationsabschluss noch nicht als erfolgreicher Kandidatenlauf mit Compiler-/Callback-Nachweis bestätigt; die Payload-Vorbereitung wurde übersprungen. Deshalb darf MESSINHO weiterhin nicht als erfolgreich autonom programmierend oder selbstintegrierend bezeichnet werden.
- MESSINHO-Betriebsmodus und Sandbox-Freigabe werden durch den Monitor nicht verändert. Die Entscheidung über Aktivierung und kritische Änderungen bleibt beim Admin.
- Nächster Schritt: mit einem freigeschalteten Admin-Konto auf STAGING anmelden, myKI öffnen und Statusabruf, mobile Darstellung, 30-Sekunden-Aktualisierung sowie Fehlerzustände kontrollieren. Danach die echte Sandbox-Payload-/Compiler-/Callback-Kette separat abschließen.


## 20. Vollausbau MESSINHO Linguistic Intelligence — Owner-Auftrag 2026-11-27

### Verbindlicher Auftrag
Der Eigentümer hat den vollständigen Ausbau der Linguistic Intelligence angeordnet. MESSINHO soll die sechs festgelegten Sprachprofile nicht nur erkennen, sondern im bestehenden Chat aktiv für Sprachverständnis, Bedeutungsanalyse, Antworten, Korrektur, Übersetzung und kontrollierten Wissensaufbau nutzen:
- Deutsch (de)
- Englisch (en)
- Französisch (fr)
- Hocharabisch / Modern Standard Arabic (ar)
- Tunesisches Arabisch / Derja (ar-tn), arabische Schrift und lateinisches Arabizi
- Spanisch (es)

Hocharabisch und tunesische Derja bleiben eigenständige Sprachprofile. Code-Switching und Sprachwechsel innerhalb eines Gesprächs müssen erhalten bleiben. Das Modul muss im bestehenden MESSINHO-Chat genutzt werden; keine zweite Chatoberfläche.

### Ausgangsbefund
- Die bestehende technische Basis umfasst sechs Profile, heuristische Spracherkennung, einfache Gesprächssignale, Kontextkontinuität, Chat-Prompt-Integration und den lesenden Zugriff auf freigegebene Sprachwissenseinträge.
- STAGING-Sprachwissensbasis: 30 unterschiedliche Eintragsschlüssel und 36 append-only Versionszeilen; je Profil fünf aktuelle Einträge. RLS/Grants sind service-role-only für den Runtime-Lesezugriff.
- Die Basis ist ausdrücklich kein vollständiges Wörterbuch, keine vollständige Grammatik, keine eigenständige Übersetzungs-/Korrektur-Engine und kein Beleg muttersprachlicher Kompetenz.
- Die aktuelle Codebasis ist regel-/lexikonbasiert und nutzt zusätzlich den konfigurierten Sprachmodell-Provider für die eigentliche freie Sprachgenerierung. Ein Provider darf nicht als Beweis einer eigenständigen MESSINHO-Sprachfähigkeit ausgegeben werden.
- Letzter dokumentierter Sprachcode-Commit: 6b0eddac490c2b09aa301fcb58d75ced20a2ab22. Die zugehörige spätere Staging-Bereitstellung und die korrigierte DB-Abfrage müssen vor einer neuen Änderung erneut auf exaktem Branch-HEAD und Render-Deploy abgeglichen werden.

### Zielarchitektur und Arbeitspakete
1. **Sprachdetektion und Segmentierung:** robuste Erkennung pro Satz/Abschnitt, Skripterkennung, Arabizi-Normalisierung, Dialekttrennung, Konfidenz- und Mehrdeutigkeitsbehandlung; keine erzwungene Einzelsprache bei gemischten Nachrichten.
2. **Grammatik- und Morphologiegrundlagen:** systematische, versionierte Lehrpläne für alle sechs Profile; Wortarten, Satzbau, Flexion, Zeiten/Aspekte, Kongruenz, Kasus bzw. arabische Morphologie, Orthografie und häufige Fehlerbilder.
3. **Lexikon und Semantik:** umfangreicher, kontextbezogener Wortschatz, Mehrdeutigkeit, Wortfamilien, Kollokationen, Redewendungen, Register, regionale Varianten und fachsprachliche Begriffe; keine unlizenzierte Kopie geschützter Wörterbücher.
4. **Pragmatik und Gesprächsverständnis:** Verneinung, Modalität, Höflichkeit, Ironie, Unsicherheit, Kontrast, indirekte Fragen/Aufforderungen, Bezugnahme und Gesprächskontinuität.
5. **Sprachaktionen:** explizite, zuverlässige Modi für Antworten, Erklären, Übersetzen, Korrigieren und Umformulieren. Originaltext und Bedeutung bleiben erhalten; bei unklarer Quelle/Zielsprache wird gezielt nachgefragt. Übersetzungen werden nicht als extern verifiziert bezeichnet, wenn keine unabhängige Prüfung stattgefunden hat.
6. **Wissenslernen und Governance:** Recherche-/Lernvorschläge mit Herkunft, Lizenz, Version, Konfidenz, Gegenprüfung, Testfällen und Admin-Freigabe. Append-only Versionierung; kein Scout-Schreibzugriff und keine automatische Aktivierung unvalidierter Inhalte.
7. **Qualitätssicherung:** Testkorpus pro Sprache und Variante, Negativ-/Grenzfälle, gemischte Nachrichten, Arabizi-Schreibvarianten, native-speaker review, Regressionstests und dokumentierte Qualitätsmetriken. Keine Native-Level-Aussage ohne unabhängige Evaluation.

### Abnahmekriterien für „vollständig umgesetzt“
- Alle sechs Profile und ihre relevanten Varianten besitzen strukturierte, ausreichend breite Grundlagen in Grammatik, Morphologie, Lexikon, Semantik und Pragmatik.
- Der Chat verwendet die Sprachdiagnose und passende freigegebene Wissensbausteine in sämtlichen relevanten Antwortpfaden, nicht nur im generischen LLM-Fallback.
- Übersetzen, Korrigieren, Erklären und normales Antworten sind getrennt erkennbar und mit Referenzfällen geprüft.
- Dialekt, Arabizi, gemischte Sprache, Verneinung und Bedeutungsnuancen bestehen definierte Regressionstests.
- Wissensupdates sind revisionssicher, lizenzrechtlich zulässig und nur nach Qualitätsprüfung/Admin-Freigabe aktiv.
- CI, Backend-Syntax, Staging-Build, Datenbank-/RLS-Prüfung und authentifizierte Chat-E2E sind für den exakten Release-Commit erfolgreich.
- Muttersprachliche Qualität wird separat ausgewiesen und nur nach unabhängiger Bewertung behauptet.

### Grober Zeitrahmen
Planungsannahme: ca. 4–8 Wochen bis zu einer belastbar geprüften Vollversion, abhängig von Umfang der Sprachkorpora und Verfügbarkeit muttersprachlicher Prüfer. Eine erste erweiterte integrierte Ausbaustufe kann früher auf STAGING getestet werden. Die Schätzung ist kein Fertigstellungsnachweis und wird nach dem ersten vollständigen Audit der Chatpfade und Wissensbasis präzisiert.

### Sicherheits- und Release-Grenzen
- Ausschließlich Branch `feature/messinho-unified-ai-integration` und das dedizierte STAGING-Projekt `nwqwnrhupbyhshsprxjt`.
- Kein Merge nach `main`, kein Production-Deploy und keine Änderung an Produktionsdaten/-secrets.
- Keine Änderung an aktiven Modellgewichten.
- Keine direkte Wissensschreibberechtigung für Scouts oder normale Chatpfade.
- Vor jeder STAGING-Migration Schema, Remote-Migrationshistorie, RLS und Grants prüfen.
- Render Auto-Deploy bleibt deaktiviert; Deployment erst nach CI und expliziter Freigabe.

### Status dieses Auftrags
- **Auftrag:** angenommen und in Arbeit.
- **Code-Vollausbau:** noch nicht begonnen/abgeschlossen; die vorhandene Basis bleibt als Teilimplementierung gekennzeichnet.
- **Datenbank:** keine Änderung in diesem Auftragsschritt.
- **Deployment:** keines ausgelöst.
- **Nächster konkreter Schritt:** exakten Branch-HEAD, aktuellen Render-STAGING-Commit und die Sprachwissensmigrationen erneut abgleichen; danach zuerst alle Chat-Antwortpfade kartieren und die Sprachpipeline so integrieren, dass alle relevanten Antworten dieselbe Sprachrichtlinie verwenden.

## 21. Mehrsprachige Sprachaktionen und Segmentierung — erste integrierte Ausbaustufe 2026-11-27

### Implementiert auf Feature-Branch (noch nicht deployed)
- Linguistic Intelligence auf Version 1.1.0 erweitert.
- Nachrichten werden in bis zu 12 Satz-/Abschnittssegmente zerlegt; Originaltext und erkannte Schriftsysteme je Segment bleiben erhalten.
- Explizite Sprachaktionen werden für Übersetzen, Korrigieren, Erklären und Umformulieren erkannt; normale Nachrichten bleiben im Antwortmodus.
- Zielsprachen-Erkennung ergänzt für Deutsch, Englisch, Französisch, Hocharabisch, tunesische Derja und Spanisch, soweit sie eindeutig benannt sind.
- Häufige Arabizi-Ziffern erhalten eine separate Normalisierungsfunktion; Originaltext wird nicht überschrieben.
- Aktions- und Segmentdiagnose wird in der bestehenden Chatantwort als Metadatum zurückgegeben und steht dem bestehenden System-Prompt über den Sprachkontext zur Verfügung.
- Der bestehende Chat-Systemprompt wurde ausdrücklich erweitert: explizite Sprachaktionen müssen gemäß Aktionsanweisung ausgeführt werden; bei unklarer Zielsprache darf keine Zielsprache erfunden werden.
- Regressionstests für Segmentierung, Sprachaktionen, Zielsprachen, Arabizi und Standard-Antwortmodus ergänzt.

### Grenzen
- Regelbasierte Erkennung ist Routing-Hilfe, kein vollständiges semantisches Verständnis und keine Garantie für korrekte Übersetzung.
- Unklare Zielsprachen bleiben null; bei Bedarf muss MESSINHO nachfragen.
- Arabizi-Normalisierung ersetzt niemals den Originaltext.
- Keine muttersprachliche Evaluation, kein umfassendes Lexikon und keine vollständige Grammatik-/Morphologieabdeckung.
- Keine Datenbankmigration und keine Änderung am Wissensbestand.
- Die erste Build-Prüfung fand einen Unicode-Wortgrenzenfehler bei deutschen Umlaut-Verben (1 Regressionstest rot). Die Erkennung wurde auf Unicode-Zeichenklassen umgestellt.
- Korrigierter STAGING-Build: **436 Tests bestanden, 0 fehlgeschlagen**; anschließend Backend-Syntaxprüfung und Vite-Produktionsbuild erfolgreich (Render Build erfolgreich).
- STAGING-Deployment **live** nach der finalen Prompt-Integration: `dep-dc4e6mk9v7es73em6spg`, deployter Commit `c767f8fc538dd5dfe02a5a1065678bd6ab32e690` (Branch `feature/messinho-unified-ai-integration`). Für diesen Commit erneut **436 Tests bestanden, 0 fehlgeschlagen**, Vite-Build erfolgreich; Backend-Start, Render-Meldung „Your service is live“ und Supabase Data API HTTP 200 in Runtime-Logs bestätigt.
- Kein DB-Schema und kein Sprachwissensbestand wurde verändert. Ein authentifizierter Admin-/Scout-Chat-E2E-Test ist noch offen; daher ist die tatsächliche Antwortqualität in allen sechs Sprachen noch nicht abgenommen.

### Nächster Schritt
- Tests und Backend-Syntax für den exakten Commit ausführen und CI prüfen.
- Erst nach erfolgreicher Prüfung STAGING-Deployment vorbereiten; Auto-Deploy bleibt deaktiviert. Production bleibt unangetastet.


## 22. Admin-Button „Arbeiten“ — Systemfehlersuche und sichere Reparaturprüfung 2026-11-27

### Verhalten
- Der Admin-Button „Arbeiten“ startet innerhalb der festgelegten Berliner Arbeitsfenster (03:00–08:00 und 10:00–23:00 Uhr) einen echten Systemdiagnoselauf.
- MESSINHO führt die vorhandenen MESSINHO-Systemprüfungen aus und speichert den Diagnosebericht dauerhaft in der bestehenden Diagnosehistorie.
- Nur fehlgeschlagene Prüfungen werden an die Engineering-Vorschlagsprüfung übergeben; bestandene Prüfungen werden nicht als Fehler ausgegeben.
- Für einen belegten und sicher behebbaren Codefehler darf MESSINHO höchstens einen begrenzten Patch innerhalb der bestehenden Allowlist erzeugen. Der Vorschlag wird als bestehendes myKI-Ticket mit Ursache, Nutzen, betroffenen Dateien, Testplan und Rollback dokumentiert.
- Wenn ein Ticket angelegt wurde und die Sandbox-Konfiguration vollständig freigegeben ist, wird es automatisch zur isolierten STAGING-Prüfung dispatcht. Der Sandbox-Runner prüft Baseline und Kandidat mit dem vollständigen Projektbuild (Tests, Backend-Syntax und Frontend-Build) und meldet das Ergebnis zurück.
- Wenn keine Fehler gefunden werden, wird ausdrücklich ein gesundes Diagnoseergebnis gespeichert und kein künstliches Ticket erstellt.
- Wenn kein sicherer Patch möglich ist (z. B. geschützte Runtime-/Auth-/RLS-/DB-Datei oder unzureichender Beleg), wird kein unsicherer Code erzeugt. Der Diagnosebefund bleibt erhalten und der Admin erhält eine verständliche Statusmeldung.
- Wenn Fehler gefunden werden, aber kein sicherer Codepatch erstellt werden kann oder die Patchprüfung nicht durchläuft, wird zusätzlich ein Diagnose-Ticket in myKI angelegt. Es enthält die fehlgeschlagenen Prüfungen, die verständliche Fehlerbeschreibung und den Hinweis, dass kein Code geändert wurde. Wiederholte identische Befunde am selben Tag werden über einen Fingerprint nicht als neue Tickets dupliziert.

### Sicherheit und Grenzen
- Der Auslöser ist ausschließlich über requireApprovedMessinhoAdmin erreichbar; Scouts können weder den Button noch den Steuerungsendpunkt zur Systemänderung verwenden.
- Stop/Pause wird vor dem Reparaturvorschlag erneut geprüft; bei Admin-Stopp wird kein Ticket dispatcht.
- Zeitfenster werden vor dem Start und vor dem Sandbox-Dispatch geprüft. Während 08:00–10:00 und 23:00–03:00 findet keine autonome Entwicklungsarbeit statt.
- Der Codepatch wird nicht direkt in den laufenden Prozess geschrieben und nicht automatisch in den STAGING- oder Produktionsbranch übernommen. Die Sandbox prüft den Kandidaten isoliert; die bestehende Admin-Freigabe für eine Integration bleibt erhalten.
- Keine neue Datenbankmigration und keine Änderung an Produktionsdaten oder Produktionsdiensten.
- Ein Diagnosefehler wird nicht automatisch als behoben bezeichnet: erst ein bestandenes Sandbox-Ergebnis belegt, dass der Kandidatenpatch die Projektprüfungen besteht. Nach einer späteren Admin-freigegebenen STAGING-Integration ist zusätzlich der echte Runtime-/Health-Check erforderlich.

### Technische Umsetzung
- buildMessinhoSelfRepairGoal filtert und begrenzt ausschließlich fehlgeschlagene Diagnosebefunde.
- runMessinhoScheduledEngineeringReview unterstützt neben developing jetzt den Admin-Modus working mit einem gezielten Fehlerbehebungsziel; vorhandene Zeitfenster-, Run-Claim-, Stop-, Ticket- und Sandbox-Gates bleiben bestehen.
- POST /api/admin/myki/control startet bei mode=working asynchron runMessinhoSelfRepairCycle; Status und aktueller Arbeitsschritt sind im Admin-Aktivitätsmonitor sichtbar.
- Regressionstests ergänzen die Fehlerfilterung, den Arbeitsmodus und den Stop-Schutz.
- Neues Modul backend/messinho-diagnostic-ticket.js erzeugt und speichert Diagnose-Tickets ohne fingierten Patch; die bestehende myKI-Ticketliste kann sie über dieselbe Tabelle anzeigen. Keine neue DB-Migration erforderlich.

### Abnahme
- Implementiert auf feature/messinho-unified-ai-integration; vor STAGING-Deploy sind CI/Render-Build und Runtime-Logs für den exakten Commit zu prüfen.
- Render-STAGING-Build für den finalen Stand: **443 Tests bestanden, 0 fehlgeschlagen**, Backend-Syntax und Vite-Produktionsbuild erfolgreich.
- STAGING-Deployment **live**: `dep-dc4ebd97lnhs73879bb0`, Commit `4022eadc38ac0a9eb0c9f92b84026f7cbe9153b1`; Runtime-Start, Supabase Data API HTTP 200 und Render-Meldung „Your service is live“ bestätigt.
- Authentifizierter Admin-Klicktest des neuen Ablaufs und negativer Scout-Berechtigungstest stehen noch aus; der tatsächliche Diagnose-/Reparaturlauf wurde noch nicht ausgelöst. Die Sandbox-Konfiguration muss vor einem automatischen Kandidatentest weiterhin vollständig nachgewiesen sein.


## 23. Dynamische Gesamtprüfung und zuverlässiger Admin-Start der Weiterentwicklung — 2026-11-27

### Fehlerursache
- Der bisherige MESSINHO-Diagnoselauf enthielt neun fest programmierte Prüfungen und untersuchte damit nicht dynamisch den gesamten ausgelieferten Projektbestand.
- Der Button „Weiterentwickeln“ rief die Engineering-Prüfung nur auf, wenn `isMessinhoEngineeringAutoReviewEnabled` wahr war. Diese Freigabe verlangt zusätzlich den separaten Scheduler-Schalter. Bei deaktiviertem Scheduler wurde der explizite Admin-Klick gespeichert, aber es startete keine Entwicklungsprüfung.
- Der Admin-Aufruf übergab außerdem `force:true`, obwohl der Scheduler-Parameter zuvor nicht verarbeitet wurde. Ein erneuter Lauf konnte zusätzlich am täglichen Zeitfenster-Claim hängen bleiben.

### Implementiert auf dem Feature-Branch
- Neues read-only Modul `backend/messinho-project-audit.js` untersucht zur Laufzeit die ausgelieferten Bereiche `backend/`, `src/`, `tests/` und `supabase/migrations/`.
- Es inventarisiert Dateien und prüft Quelltext-Lesbarkeit, leere/auffällig große Dateien, relative Modulimporte, direkte Backend-Testzuordnung, Build-/Testskripte, Migrationsbestand und API-Routen. Admin-Routen erhalten zusätzlich eine statische Hinweisprüfung auf unmittelbar erkennbare Schutz-Middleware.
- Der Audit führt ausdrücklich keine Projektdateien, Shell-Befehle, Tests oder Migrationen aus. Er verändert keine Daten und liest keine Secrets. Statische Guard-Hinweise ersetzen keine authentifizierten Berechtigungstests.
- Die dynamischen Audit-Befunde werden an die bestehenden neun MESSINHO-Fachprüfungen angehängt und gemeinsam dauerhaft als Diagnosebericht gespeichert. Die Anzahl der Prüfungen ist damit nicht mehr auf neun begrenzt.
- Fehlgeschlagene Befunde werden für den Reparaturauftrag auf maximal 20 begrenzt und nachvollziehbar übergeben. Diagnose-Tickets können bis zu 20 Befunde aufnehmen; es wird weiterhin kein unsicherer Patch erstellt.
- „Weiterentwickeln“ startet nach einem ausdrücklichen Admin-Klick jetzt eine einmalige Engineering-Prüfung, auch wenn der periodische Scheduler-Schalter ausgeschaltet ist. Der manuelle Lauf erhält einen eigenen eindeutigen Review-Slot, statt mit dem täglichen Automatik-Lauf zu kollidieren.
- Der manuelle Entwicklungsstart bleibt auf das bestätigte STAGING-Render-Service-ID-Paar und die festgelegten Berliner Arbeitsfenster beschränkt. Außerhalb der Arbeitszeit oder außerhalb des STAGING-Dienstes wird der Auftrag mit einer klaren Fehlermeldung abgewiesen.
- Der Admin-Status zeigt während der Entwicklung den laufenden Auftrag; nach Abschluss wird eine verständliche Ergebnismeldung gespeichert. Der Aktivitätsmonitor berücksichtigt den manuell gestarteten Entwicklungsmodus.
- „Arbeiten“ nutzt ebenfalls den eindeutigen manuellen Review-Slot für die Reparaturprüfung. Stop-/Modusprüfung, Ticketfreigabe und Sandbox-Grenzen bleiben erhalten.

### Tests und Nachweise
- Neue Tests für dynamische Projektinventarisierung, Importfehler-Erkennung, Build-/Testskriptprüfung, manuellen Entwicklungsstart, eindeutigen Review-Slot und die STAGING-Sperre.
- GitHub Actions auf Commit `a041bb597784d8fbdc3fd51c672c61d813a7d3a6`: **447 Tests bestanden, 0 fehlgeschlagen**.
- Backend-Syntaxprüfung erfolgreich.
- Vollständiger STAGING-Branch-CI-Workflow inklusive Regressionstests, Backend-Syntax und Vite-Produktionsbuild erfolgreich.
- Render-STAGING-Deployment live: `dep-dc4eg9m1egvs7385t5dg`, deployter Code-/Dokumentationsstand `ea7109db18fa155de0e014ebbabbed638b04066a`; Build erfolgreich, Backend gestartet, Supabase Data API HTTP 200 und Render-Meldung „Your service is live“ am 2026-11-27 um 02:17:50Z. Auto-Deploy bleibt deaktiviert.
- Kein Datenbankschema geändert. Keine Migration ausgeführt. Production und `main` unverändert.

### Verbleibende Grenzen / nächste Schritte
1. Erledigt: Render-STAGING manuell mit dem geprüften Feature-Branch-Stand deployt; Deploy-Commit und Live-Status kontrolliert.
2. Offen: authentifizierten Admin-Klicktest für „Arbeiten“ und „Weiterentwickeln“ durchführen; negativer Scout-Berechtigungstest muss weiterhin bestätigt werden.
3. Echte Diagnosehistorie, dynamische Prüfzahl und Statusmeldungen prüfen.
4. Prüfen, ob der Engineering-Provider auf STAGING verfügbar ist. Bei fehlendem Provider muss der Status den Grund sichtbar nennen; kein stilles Nichtstun.
5. Die dynamische Projektprüfung ist zunächst statische Bestands-/Konsistenzanalyse. Echte Compiler-, Test-, Datenbank- und Runtime-Prüfungen bleiben in der isolierten Sandbox bzw. in kontrollierten Integrationstests; sie werden nicht im laufenden Webserver ausgeführt.
6. Erfolgreiche Kandidaten bleiben bis zur Admin-Freigabe nicht in die laufende STAGING-Anwendung integriert. Production bleibt unangetastet.

## 24. Linguistic Intelligence — Segmentverständnis, Arabizi-Schutz und mehrsprachiger Wissensabruf — 2026-11-27

### Implementiert auf dem Feature-Branch
- `backend/messinho-linguistic-intelligence.js` zunächst auf Version **1.2.0**, danach im Feature-Branch auf **1.3.0** erweitert (zusätzliche Lexikonevidenz für alle sechs Sprachprofile).
- Jede Satz-/Abschnittsgrenze erhält nun eine eigene Sprachdiagnose. Die globale Primärsprache bleibt als vorsichtiger Hinweis bestehen; gemischte Nachrichten werden nicht auf eine Sprache reduziert.
- Arabizi-Normalisierung ersetzt Ziffern nur innerhalb lateinischer Wörter. Freistehende Zahlen, Jahreszahlen, Trikotnummern, Spielstände und Statistiken bleiben unverändert.
- Zielsprachenerkennung erweitert: zusätzliche französische, spanische, arabische und tunesische Formulierungen für die sechs festgelegten Profile.
- Übersetzungsaktionen geben den Originalauftrag mit und kennzeichnen fehlende Zielsprache ausdrücklich als Rückfragebedarf. Es wird keine Zielsprache geraten.
- Pragmatiksignale verwenden Unicode-fähige Worttoken statt ASCII-`\b`-Grenzen. Dadurch werden arabische und tunesische Verneinung, Unsicherheit, Kontrast, Höflichkeit und Frageformen besser erkannt.
- Der bestehende Chat-Prompt erhält zusätzliche Regeln zur segmentweisen Auswertung, zur unveränderten Reihenfolge des Originaltextes und zum Schutz von Zahlen.
- Ein widersprüchlicher Prompt-Satz, der zuvor Deutsch als Gesprächssprache vorgab, wurde entfernt. MESSINHO richtet seine Antwortsprache nun ausdrücklich nach der letzten Nutzernachricht, sofern keine Zielsprache verlangt wird.
- `backend/messinho-language-knowledge.js` auf Version **1.2.0** erweitert: Der Wissensabruf sammelt jetzt die erkannten Sprachprofile aller Nachrichtensegmente und lädt passende aktive Wissenseinträge für jede erkannte Sprache sowie gemeinsame Einträge. Die bisherige Beschränkung auf nur eine globale Primärsprache entfällt.
- Die Wissensbasis bleibt read-only für den Chat. Es gibt weiterhin keine Scout-Schreibrechte und keine automatische Aktivierung neuer Wissensstände.

### Regressionstests und CI-Nachweis
- Neue Tests für segmentweise Mehrsprachigkeit, Arabizi-Zahlenschutz, fehlende Zielsprache, zusätzliche Zielsprachvarianten, arabische Pragmatiksignale und mehrsprachigen Wissensabruf.
- Ein erster CI-Lauf zeigte eine fehlerhafte Escape-Sequenz in einer französischen Höflichkeitsphrase; der Syntaxfehler wurde korrigiert.
- Ein weiterer Test zeigte, dass die kurze französische Beispielphrase nicht genügend eindeutige Evidenz für eine eigene Segmentklassifikation enthielt. Der Test wurde auf einen aussagekräftigeren Satz umgestellt; die Erkennung bleibt konservativ.
- Finaler Linguistic-Code-Commit vor Prompt-Korrektur: `2ff10bcae28589c84d72778b6ec75705cc7feedd`; die Prompt-Korrektur folgt in Commit `784c726e66e6b59aab4256de1080907bec24c717`.
- GitHub Actions: **455 Tests bestanden, 0 fehlgeschlagen**.
- Backend-Syntaxprüfung erfolgreich.
- Vollständiger STAGING-Branch-CI-Build erfolgreich; Vite **1.640 Module** transformiert, Produktionsbuild erfolgreich.
- Staging-Health-Smoke-Workflow erfolgreich. Dieser Health-Check bestätigt nicht, dass die neuen Sprachänderungen bereits auf Render live sind.

### Datenbank und Deployment
- Supabase-STAGING-Projekt `nwqwnrhupbyhshsprxjt`: nach der Erweiterung 60 Versionszeilen und 54 unterschiedliche Sprachwissensschlüssel; je Profil 9 unterschiedliche Einträge (10 Versionszeilen durch vorhandene Versionierung). RLS ist aktiviert. `anon` und `authenticated` haben keinen Lesezugriff; `service_role` hat ausschließlich SELECT, keine INSERT-/UPDATE-/DELETE-Rechte.
- Die neue STAGING-Migration `20261127022717_messinho_language_curriculum_expansion` wurde angewendet und als `supabase/migrations/20261127022717_messinho_language_curriculum_expansion.sql` im Feature-Branch gesichert.
- 24 original erstellte Wissenseinträge ergänzt: je Profil Morphologie, komplexer Satzbau, Semantik/Pragmatik und Fußballfachwortschatz. Alle Einträge sind als `original_authored` versioniert und bleiben über die bestehende Service-Role-Leseschranke geschützt.
- Die neuen Inhalte sind eine interne Grundlagenbasis, keine muttersprachlich zertifizierte Grammatik oder vollständige Wörterbuchabdeckung. Regionale Prüfung bleibt offen.
- Render-STAGING-Service `srv-dc3chlqjnfac73acd6ig` verfolgt weiterhin `feature/messinho-unified-ai-integration`; Auto-Deploy ist deaktiviert.
- Letzter bestätigter Render-LIVE-Commit bleibt `ea7109db18fa155de0e014ebbabbed638b04066a`. Die neuen Sprachänderungen sind daher **noch nicht auf STAGING deployed**.
- Keine Änderung an `main`, Produktion oder PFMS/PFSS.

### Noch offen — ausdrücklich keine Vollabnahme
1. Die Wissensbasis umfasst nach beiden Curriculum-Erweiterungen 78 unterschiedliche Eintragsschlüssel / 84 Versionszeilen über sechs Sprachprofile. Systematische Morphologie, breite Grammatikabdeckung, Bedeutungsfelder, idiomatische Varianten und Fachwortschatz sind noch nicht vollständig aufgebaut.
2. Arabizi-Schreibvarianten und tunesische regionale Varianten benötigen einen größeren, kuratierten Testkorpus.
3. Die Sprachdetektion ist weiterhin heuristisch; sie ist kein vollständiges Sprachmodell und kein Nachweis muttersprachlicher Kompetenz.
4. Übersetzungs- und Korrekturqualität muss pro Sprache mit unabhängigen Referenzfällen und muttersprachlicher Prüfung bewertet werden.
5. Authentifizierte Admin-/Scout-E2E-Tests für die tatsächliche Chatantwort in allen sechs Profilen fehlen noch.
6. Erst nach weiterer Wissensbasis-Erweiterung, vollständiger CI und expliziter Deployment-Freigabe darf der geprüfte Stand auf das dedizierte STAGING ausgerollt werden. Production bleibt gesperrt.

### Nächster Entwicklungsschritt
- Sprachwissensmodell fachlich erweitern: pro Profil strukturierte Morphologie, Satzbau, Flexion, Semantik, Pragmatik, Kollokationen, idiomatische Wendungen, Register und fußballspezifische Terminologie.
- Danach Testkorpus und Retrieval so ausbauen, dass jede Sprache und jedes Segment gezielt mit den passenden, versionierten Wissensbausteinen versorgt wird.
- Lizenz-/Herkunftsmetadaten, Gegenprüfung, Teststatus und Admin-Freigabe bleiben Pflicht; keine ungeprüften Inhalte werden aktiv.
## 25. Linguistic Intelligence — Curriculum v2, Fachsprache und Retrieval-Balance — 2026-11-27

### Implementiert
- Zusätzliche Migration `supabase/migrations/20261127022739_messinho_linguistic_curriculum_v2.sql`; auf dediziertem Supabase-STAGING-Projekt erfolgreich angewendet.
- 24 zusätzliche original erstellte, versionierte Einträge: je sechs Sprachprofile mit Grammatik/komplexen Satzstrukturen, Pragmatik/Register, Fußball- und Scoutingterminologie sowie Dialogklärung.
- Die neue Wissensstruktur enthält Lernziele, typische Fehler, Beispielsätze, Review-Fragen und kontextabhängige Fachbegriffe. Die Einträge sind ausdrücklich Lernmaterial und keine Behauptung vollständiger muttersprachlicher Beherrschung.
- Gesamtbestand nach Datenbankprüfung: **84 Versionszeilen, 78 eindeutige Eintragsschlüssel, sechs Sprachprofile**. Je Profil 13 eindeutige Einträge und 14 Versionszeilen.
- `backend/messinho-language-knowledge.js` Version **1.2.0** indexiert zusätzlich typische Fehler, Lernziele, Review-Fragen und weitere Inhaltsfelder. Leichte Flexionsvarianten werden beim Abruf berücksichtigt.
- Mehrsprachiger Abruf wurde ausbalanciert: bis zu drei Wissenseinträge pro erkannter Sprache, anschließend gemeinsame Wissenseinträge und begrenztes Auffüllen; maximal acht Einträge pro Chatantwort.
- Der Chat-Prompt ordnet Wissenseinträge explizit dem passenden Sprachsegment zu. Wissenseinträge gelten als Daten, nicht als Anweisungen, und dürfen Systemregeln nicht überschreiben.
- Der Datenbankzugriff bleibt streng read-only für die Laufzeit: `anon` und `authenticated` haben keinen SELECT-Zugriff; `service_role` besitzt SELECT, aber keine INSERT-, UPDATE- oder DELETE-Rechte. RLS bleibt aktiviert.

### Tests und Prüfungen
- Zusätzliche Regressionstests für alle sechs Sprachprofile, Fachwortschatz, Flexionsvarianten, Lernmetadaten und balancierten mehrsprachigen Wissensabruf.
- Ein Zwischenlauf fand zwei echte Testlücken (Flexionsabgleich beim Fachbegriff und zusätzliche Spracherkennungsbegriffe). Die Lexikonevidenz und Tokenvarianten wurden erweitert; die Tests wurden danach erneut ausgeführt.
- GitHub Actions auf Commit `a0ddc65c26471cef737e1854139277b593ca0721`: **459 Tests bestanden, 0 fehlgeschlagen**.
- Backend-Syntaxprüfung erfolgreich; vollständiger STAGING-Branch-CI-Build erfolgreich; Staging-Health-Smoke erfolgreich.
- Die isolierte Engineering-Sandbox-Prüfung war zum letzten Statusabruf noch nicht abgeschlossen; daher keine vollständige technische Endabnahme behaupten.

### Deployment-Grenze
- Render-STAGING-Service `srv-dc3chlqjnfac73acd6ig` verfolgt weiterhin den Feature-Branch; Auto-Deploy bleibt deaktiviert.
- Die Sprachänderungen wurden **nicht** auf Render ausgerollt. Letzter bestätigter LIVE-Commit vor diesem Arbeitsblock: `ea7109db18fa155de0e014ebbabbed638b04066a`.
- Keine Änderungen an `main` oder Produktion; keine Produktionsmigration und keine Produktionsdaten angefasst.

### Noch offen
1. Größerer, kuratierter Testkorpus mit muttersprachlicher Prüfung für Deutsch, Englisch, Französisch, Hocharabisch, tunesische Derja (Arabisch und Arabizi) und Spanisch.
2. Breitere Morphologie, Kollokationen, idiomatische Wendungen, regionale Varianten und Registerabdeckung; die aktuelle Basis ist ein strukturierter Anfang, kein vollständiges Wörterbuch.
3. Unabhängige Qualitätsmessung für Übersetzung, Korrektur, Code-Switching und arabisch-tunesische Dialekterkennung.
4. Authentifizierte End-to-End-Tests im tatsächlichen MESSINHO-Chat für Admin und Scout sowie Rollen-/Tenant-Isolation.
5. Deployment auf dediziertes STAGING erst nach Abschluss aller Prüfungen und expliziter Freigabe; Production bleibt gesperrt.
## 26. Intra-sentence Code-Switching und Retrieval-Härtung — 2026-11-27

### Implementiert
- `backend/messinho-linguistic-intelligence.js` Version **1.3.0** segmentiert jetzt nicht nur nach Satzzeichen, sondern erkennt mit lexikalischer Evidenz auch Sprachwechsel innerhalb eines Satzes.
- Unterstützt werden insbesondere Wechsel zwischen den lateinischen Profilen sowie Arabisch/lateinischer Schrift. Mehrdeutige Wörter wie gemeinsam genutzte französisch/tunesische Begriffe werden anhand benachbarter eindeutiger Wörter eingeordnet.
- Originalwortlaut, Reihenfolge und Satzzeichen bleiben beim Segmentieren erhalten; bei unzureichender Evidenz wird nicht künstlich aufgeteilt.
- `backend/messinho-language-knowledge.js` Version **1.2.0** hält den Abruf strikt bei maximal acht Einträgen. Bei mehreren erkannten Sprachen erfolgt eine Round-Robin-Auswahl mit höchstens drei sprachspezifischen Einträgen je Profil; bei einer Sprache werden die acht besten Treffer nicht unnötig auf drei begrenzt.
- Die Wissensausgabe führt jedes Segment mit dem passenden Sprachprofil zusammen; gemeinsame Wissensbausteine können ergänzend einfließen.

### Regression und CI
- Zwei neue Tests prüfen Code-Switching innerhalb eines lateinischen Satzes und innerhalb eines arabisch/englischen Satzes.
- Ein Testlauf deckte auf, dass ein großgeschriebenes erstes Wort und ein mehrdeutiges Wort wie `joueur` die Segmentierung zunächst verhinderten. Die Token-Normalisierung und die kontextgestützte Auflösung mehrdeutiger Wörter wurden korrigiert.
- Aktueller geprüfter Code-Commit: `3831801d32b5084da4e239cd5b47e0d2a3af9558`.
- GitHub Actions: **462 Tests bestanden, 0 fehlgeschlagen**.
- Backend-Syntaxprüfung erfolgreich; vollständiger STAGING-Branch-CI-Workflow mit Regressionstests und Vite-Build erfolgreich; Staging-Health-Smoke erfolgreich.
- Isolierte Engineering-Sandbox-Prüfung war beim letzten Statusabruf noch in der Dependency-Installation. Keine vollständige Sandbox-Endabnahme behaupten.

### Daten- und Deploymentstatus
- Supabase-STAGING bleibt bei **84 Versionszeilen und 78 eindeutigen Eintragsschlüsseln** über sechs Sprachprofile.
- Beide angewendeten Curriculum-Migrationen sind im Feature-Branch nachvollziehbar: `20261127022717_messinho_language_curriculum_expansion.sql` und `20261127022739_messinho_linguistic_curriculum_v2.sql`.
- Render-STAGING wurde für diesen Sprachstand nicht deployed. Auto-Deploy bleibt deaktiviert; letzter bestätigter LIVE-Commit bleibt `ea7109db18fa155de0e014ebbabbed638b04066a`.
- `main`, Produktion und Produktionsdaten bleiben unverändert.

### Weiterhin offen
1. Unabhängige muttersprachliche Qualitätsprüfung aller sechs Profile, besonders tunesische Derja in arabischer Schrift und Arabizi.
2. Größerer Testkorpus für Code-Switching, Dialektvarianten, Höflichkeitsregister, Idiome und fachliche Fußballbegriffe.
3. Authentifizierte Admin-/Scout-End-to-End-Tests sowie Rollen- und Tenant-Isolation im tatsächlichen Chat.
4. Abschluss der isolierten Engineering-Sandbox-Prüfung.
5. STAGING-Deployment erst nach vollständigem Prüfnachweis und ausdrücklicher Freigabe; Production bleibt gesperrt.

## 27. Linguistic Intelligence 1.3.1 und erfolgreiche isolierte Engineering-Sandbox — 2026-11-27

### Sprachverarbeitung und Chat-Integration
- `backend/messinho-linguistic-intelligence.js` ist im Feature-Branch auf Version **1.3.1**.
- Sechs Profile bleiben unterstützt: Deutsch, Englisch, Französisch, Hocharabisch, tunesische Derja (Arabisch und lateinisches Arabizi) und Spanisch.
- Arabizi-Ziffern werden weiterhin nur innerhalb erkannter lateinischer Arabizi-Tokens behandelt. Zahlen, Jahreszahlen, Spielstände, Formationen und Kennungen wie `U19`, `4-3-3` oder `Messi9` bleiben geschützt.
- Die Normalisierung ist bewusst konservativ. Sie ist keine vollständige Arabizi-Transliteration und kein Nachweis muttersprachlicher Beherrschung.
- Die Sprachintelligenz und das freigegebene Sprachwissen sind tatsächlich in die authentifizierte Chat-Route integriert: Kontextaufbau, Wissensabruf, Prompt-Injektion und Antwortmetadaten werden durch Regressionstests geprüft.
- Die Wissensbasis bleibt auf dem zuletzt geprüften Stand bei **84 Versionszeilen / 78 eindeutigen Eintragsschlüsseln** über sechs Profile; sie ist eine intern erstellte Grundlage, kein vollständiges Wörterbuch.

### Build- und Sandbox-Korrektur
- Das Frontend-Buildskript ruft Vite direkt über Node auf, statt einen möglicherweise nicht ausführbaren npm-Binär-Shim zu verwenden.
- Der isolierte Runner stellt im temporären Projektverzeichnis einen ausführbaren Vite-Launcher her. Diese Anpassung betrifft nur die wegwerfbare Sandbox-Kopie.
- Die erste Sandbox-Ausführung scheiterte beim Laden der nativen Rollup-Bibliothek mit `ERR_DLOPEN_FAILED`, weil die temporären Docker-Dateisysteme keine Ausführung erlaubten.
- In `.github/workflows/messinho-isolated-engineering.yml` wurden deshalb die temporären Mounts `/work` und `/tmp` mit `exec` konfiguriert. Die Änderung ist auf den isolierten Container beschränkt.

### Verifizierte Abnahme
- Commit mit Sandbox-Korrektur: `bd45f706d04f85f7b0ee95ac00445c23d4ff5646`.
- GitHub Actions Job **Isolated toolchain and project validation**: erfolgreich abgeschlossen.
- Der Job hat exakt diesen Commit ausgecheckt und die dedizierte Compiler-Image-Erstellung erfolgreich abgeschlossen.
- Regressionstests: **466 bestanden, 0 fehlgeschlagen**.
- Vite-Produktionsbuild: erfolgreich; **1.640 Module** transformiert.
- Toolchain-Smoke-Checks erfolgreich für Node.js, Python, Java, Go, Rust, GCC, Clang, PHP, Composer, Maven, PHPUnit, HTML-Validator, ShellCheck und PostgreSQL.
- Die isolierte PostgreSQL-Prüfung für den Engineering-Memory-Vertrag war erfolgreich; das Ergebnis wurde als `passed` akzeptiert, ein erneuter identischer Eintrag korrekt als Duplikat erkannt und der Vertragstest bestätigte `engineering_memory_contract_ok`.
- Sandbox-Ergebnis: `MESSINHO_SANDBOX_OUTCOME=toolchain_smoke_passed`.
- Die Sandbox hat damit den vorhandenen Projektstand im isolierten Werkzeugcontainer gebaut und geprüft. Das ist noch kein Nachweis, dass MESSINHO bereits beliebige Kandidatenänderungen autonom sicher entwickeln, bewerten und integrieren kann.

### Deployment- und Sicherheitsstatus
- Änderungen liegen auf `feature/messinho-unified-ai-integration`; aktueller bestätigter Branch-HEAD ist `bd45f706d04f85f7b0ee95ac00445c23d4ff5646`.
- Render-STAGING wurde in diesem Arbeitsschritt **nicht deployed**; Auto-Deploy bleibt deaktiviert.
- Supabase-STAGING wurde in diesem Arbeitsschritt nicht verändert; keine Migration ausgeführt.
- `main`, Produktion und Produktionsdaten wurden nicht verändert.
- Keine automatische Übernahme von KI-generiertem Code. Kandidaten bleiben bis zur Prüfung und ausdrücklichen Admin-Freigabe außerhalb der laufenden Anwendung.

### Nächste Schritte
1. Die Engineering-Sandbox nicht nur mit dem Baseline-Projekt, sondern mit einem begrenzten, ausdrücklich freigegebenen Kandidaten-Patch durchlaufen lassen: Patch-Validierung, isolierter Build, Tests, Diff-Prüfung und Ergebnisvergleich.
2. Sicherstellen, dass Fehler, Compiler-Ausgaben, Testresultate und Artefakt-Hashes dauerhaft und nachvollziehbar dem richtigen Ticket, Quell-Commit und Kandidaten zugeordnet werden.
3. Admin-Workflow „Arbeiten“ und „Weiterentwickeln“ auf dem dedizierten STAGING authentifiziert testen; Scout-Negativtest für privilegierte Befehle durchführen.
4. Mehrsprachige Chat-E2E-Tests mit unabhängigen Referenzfällen und muttersprachlicher Prüfung ergänzen.
5. Erst nach vollständigem Nachweis und ausdrücklicher Freigabe auf Render-STAGING deployen. Production bleibt gesperrt.


## 28. Linguistic Intelligence 1.3.2 – Tunisian Derja Erweiterung — 2026-11-27

### Umgesetzte Erweiterungen
- `backend/messinho-linguistic-intelligence.js` auf Version **1.3.2** angehoben.
- Sechs bestehende Sprachprofile unverändert beibehalten: Deutsch, Englisch, Französisch, Hocharabisch, tunesische Derja und Spanisch.
- Tunesische Derja um weitere häufige Varianten in arabischer Schrift und lateinischem Arabizi ergänzt.
- Zusätzliche umgangssprachliche Befehle mit angehängten Pronomen erkannt: erklären, korrigieren und übersetzen.
- Eine tunesische Arabizi-Aufforderung zum Umformulieren ergänzt.
- Regressionstests für neue Dialektvarianten und Befehle ergänzt.
- Unicode-Grenzprüfung korrigiert, damit der Anfang des hocharabischen Verbs „اشرح“ nicht als eigenständiges Derja-Partikel fehlklassifiziert wird.

### Verifikation
- Node-Testworkflow auf Commit `d8e48cf292c6c149de9f2484a2e10ae756a88f43`: erfolgreich.
- Backend-Syntaxprüfung auf demselben Commit: erfolgreich.
- Staging-Branch-CI einschließlich Produktionsbuild: erfolgreich.
- Staging-Health-Smoke-Test: erfolgreich.
- Isolierter Engineering-Sandbox-Workflow war beim letzten Statusabruf noch in Bearbeitung.
- Dokumentation: `docs/MESSINHO_LINGUISTIC_INTELLIGENCE_1_3_2.md`.
- Keine Supabase-Migration ausgeführt; keine Wissensdatensätze hinzugefügt oder aktiviert.
- Render-Staging nicht deployed; `main`, Produktion und Produktionsdaten unverändert.

### Grenzen und nächste Schritte
1. Ausgewogenen Testkorpus für alle sechs Profile mit Dialekten, Code-Switching und kurzen mehrdeutigen Nachrichten aufbauen.
2. Tunesische Derja unabhängig muttersprachlich prüfen lassen.
3. Arabische Konjunktionen und angehängte Pronomen kontextsensitiv erkennen, ohne Originaltexte destruktiv zu normalisieren.
4. Übersetzungsqualität anhand von Bedeutung, Negation, Modalität, Eigennamen, Zahlen und Fußballterminologie messen.
5. Zielsprachen-Erkennung in umgangssprachlichen Formulierungen aller sechs Profile erweitern.
6. Weitere eigenständig verfasste Wissenseinträge versionieren und erst nach Inhaltsprüfung aktivieren.


## 29. Linguistic Intelligence 1.3.3 – Arabische Konjunktionen und Regressionstestkorpus – 2026-11-27

### Implementiert
- Sprachmodul auf Version **1.3.3** angehoben.
- MSA-Erkennung berücksichtigt nun beim Scoring genau ein angehängtes arabisches Konjunktionspräfix: **و** oder **ف**.
- Das Präfix wird nur für die Erkennung berücksichtigt, wenn der verbleibende Token exakt im freigegebenen MSA-Lexikon vorhanden ist.
- Keine destruktive Normalisierung: Originaltoken und Originalnachricht bleiben unverändert.
- Dialektbegriffe wie **فما** bleiben durch den Vorrang exakter Lexikontreffer geschützt.
- Regressionstests ergänzen MSA-Konjunktionen, Abgrenzung zur tunesischen Derja sowie Beispielsätze für alle sechs Profile mit Negation, Unsicherheit und der Kennung **U19**.
- Unsicherheitsmarker erkennen jetzt auch die französische Mehrwortform **peut-être** und die spanische Variante **quizá**.
- Dokumentation: `docs/MESSINHO_LINGUISTIC_INTELLIGENCE_1_3_3.md`.

### Verifikation und Grenzen
- Die Code- und Teständerungen sind auf `feature/messinho-unified-ai-integration`.
- CI für 1.3.3 muss nach den letzten Commits vollständig abgeschlossen sein; bis dahin keine Freigabe als geprüft.
- Auf dem vorherigen Commit 1.3.2 waren Node-Tests, Backend-Syntax, vollständiger Staging-Branch-CI-Build, Staging-Health-Smoke und isolierter Sandbox-Baseline-Lauf erfolgreich.
- Der Sandbox-Baseline-Lauf beweist noch keinen echten Kandidaten-Patch-Dispatch mit OIDC-Callback.
- Keine Supabase-Migration oder Änderung an Sprachwissensdatensätzen.
- Render-STAGING nicht deployed; Auto-Deploy deaktiviert. `main`, Produktion und produktive Daten unverändert.

### Nächste Schritte
1. CI auf dem vollständigen 1.3.3-HEAD auswerten und gegebenenfalls Fehler beheben.
2. Testkorpus für kurze mehrdeutige Äußerungen und realistische Sprachwechsel erweitern.
3. Übersetzungsqualität anhand von Negation, Modalität, Eigennamen, Zahlen und Fußballterminologie messbar prüfen.
4. Umgangssprachliche Zielsprachenbefehle in allen sechs Profilen erweitern.
5. Tunesische Derja unabhängig muttersprachlich prüfen lassen.

## 30. Zielsprachen-Erkennung in sechs Sprachprofilen erweitert – 2026-11-27

### Implementiert
- Übersetzungsziel-Erkennung um umgangssprachliche und flektierte Formen erweitert.
- Erfasst jetzt unter anderem deutsches **„ins Französische“**, englisches **„into Spanish“**, französisches **„en anglais“**, spanisches **„al árabe estándar“**, arabisches **„إلى الألمانية“** und tunesisches Arabizi **„bil anglais“**.
- Regressionstest mit sechs repräsentativen Übersetzungsbefehlen ergänzt.
- Änderungen bleiben innerhalb des Sprachmoduls; keine automatische Übersetzung wird durch bloße Zielerkennung ausgelöst. Die Aktion wird weiterhin nur als Chat-Kontext klassifiziert.

### Verifikation
- Die Zielsprachen-Erweiterung ist committed; der zugehörige CI-Lauf muss vollständig abgeschlossen werden.
- Vorheriger Code-/Teststand hatte 475 bestandene Tests und 0 Fehler; der vollständige Staging-Branch-Build auf Checkpoint `35445ced` war erfolgreich.
- Kein Render-Deployment, keine Supabase-Schreiboperation, keine Änderung an `main` oder Produktion.

### Nächster Schritt
- Neuen CI-Lauf auf dem aktuellen Branch-HEAD prüfen, alle erkannten Fehlfälle beheben und danach eine unabhängige Sprachqualitätsprüfung vorbereiten.

## 31. Sprachpaket 1.3.3 – Regression korrigiert und CI erfolgreich – 2026-11-27

### Korrektur
- Die neue Erkennung von `bil anglais` führte zunächst zu einem veralteten Test, der für denselben tunesischen Arabizi-Satz noch `target_language=null` erwartete.
- Der Test wurde auf das korrekte neue Verhalten umgestellt: `target_language=en`, `requires_clarification=false`.
- Es wurde keine Produktivfunktion zurückgenommen; die Zielsprachen-Erkennung bleibt aktiv.

### Verifikation
- Aktueller geprüfter Code-/Test-Commit: `c1b5009a9c8942d7081ac92729c4f881dc993c29`.
- Node-Tests: **476 bestanden, 0 fehlgeschlagen**.
- Vollständiger Staging-Branch-CI-Workflow einschließlich Vite-Build: erfolgreich.
- Backend-Syntaxprüfung: erfolgreich.
- Staging-Health-Smoke-Test: erfolgreich.
- Isolierte Engineering-Sandbox: zum Checkpoint noch in Bearbeitung; Baseline-Validierung, kein Kandidaten-Patch-Dispatch.

### Sicherheits- und Deploymentstatus
- Alle Änderungen ausschließlich auf `feature/messinho-unified-ai-integration`.
- Render-STAGING nicht deployed; Auto-Deploy bleibt deaktiviert.
- Keine Supabase-Migration oder Wissensdatenbank-Schreiboperation.
- `main`, Produktion und produktive Daten unverändert.

### Nächster Schritt
- Den isolierten Sandbox-Lauf auf dem aktuellen Code-/Teststand abschließen und danach die Sprachqualität weiter mit unabhängigen Referenzsätzen prüfen.


## 21. MESSINHO Linguistic Intelligence 1.3.4 — Arabic orthography robustness — 2026-11-27

### Owner request and scope
- Request: Continue programming and integrating the language system.
- Operating boundary: feature/messinho-unified-ai-integration and the dedicated Render STAGING service only. Production branch, production Render service and production Supabase remain untouched.
- Scope: Improve detection of Arabic-script MSA and Tunisian Derja when users include vowel marks (tashkeel), tatweel, or common Arabic letter variants. This is detection-only normalization, not translation or rewriting.

### Implemented
- backend/messinho-linguistic-intelligence.js
  - Linguistic Intelligence version advanced from 1.3.3 to 1.3.4.
  - Added normalizeMessinhoArabicForAnalysis() for analysis-only normalization: remove Arabic vowel marks and tatweel; normalize common alif, alif-maqsura, waw-hamza and ya-hamza variants.
  - Incoming token matching and the Arabic/Derja lexicons now use the same normalized representation.
  - Tunisian Derja signal detection uses normalized analysis text, reducing false MSA classification for vocalized dialect input.
  - The original message, segment text and action source text remain unchanged.
- tests/messinho-linguistic-intelligence.test.js
  - Updated the expected linguistic-intelligence version.
  - Added four regressions for Arabic orthographic normalization, fully vocalized MSA detection, vocalized Tunisian Derja detection, and original-text preservation.

### Traceability
- Source implementation commits:
  - fbffae1cf8c6eea1264f098ef1ab0cbd88961db7 — Arabic detection-only normalization.
  - faf951f4172157cebbdcc9eddff45f2fed6564dc — normalize Arabic lexicons to match normalized input tokens.
- Test commit:
  - 4b70fba61e23e7c7d83ee915022661022ebc9c00 — add four Arabic normalization regressions.
- Latest implementation commit at checkpoint: faf951f4172157cebbdcc9eddff45f2fed6564dc.

### Verification and limitations
- GitHub workflow configuration was inspected: .github/workflows/messinho-tests.yml runs npm test and backend syntax checks on pushes to this feature branch.
- The automated workflow result for the latest commit has not yet been confirmed.
- Render STAGING is configured with autoDeploy=no; no deployment has been triggered for these commits yet.
- The configured STAGING build command is npm install --no-audit --no-fund && npm run build; the package build script runs npm test, backend syntax checks and the frontend build.
- No database migration, Supabase query/write, player data change, scout data change, user data change, or model-weight change was made.
- No production resource was changed.

### Next steps
1. Run the dedicated STAGING build against the latest feature-branch commit; verify that the full Node suite, syntax checks and frontend build pass.
2. If the build fails, inspect the exact build logs, correct the issue on this feature branch and rerun once the root cause is addressed.
3. Verify Render STAGING reaches live on the exact tested commit.
4. Perform authenticated UI/API checks for Arabic MSA, vocalized Derja, Arabizi, mixed-language input and source-text preservation.
5. Continue with phrase-level semantic interpretation and context-sensitive language switching only after the 1.3.4 regression suite is green.



### First STAGING build feedback and correction — 2026-11-27
- The first STAGING deployment attempt used commit 17f9f0b9ca9a4d15d837188d4e54a844e9c3a22c and failed during the configured npm run build because the new fully vocalized MSA regression returned an ambiguous language result.
- Exact test outcome: 480 tests total, 479 passed, 1 failed. The failing assertion expected ar and received null in tests/messinho-linguistic-intelligence.test.js.
- Root cause: Arabic combining marks were removed after Unicode tokenization, so vowel marks could split a single visible Arabic word into multiple tokens.
- Correction commit: 6dfed8b9ae17822dd4cd5814e8219ab17f2b3e96. Arabic normalization now runs before Unicode tokenization. This changes only analysis tokens; source text remains unchanged.
- The correction has been committed to the STAGING feature branch. A new STAGING build is required before the fix can be considered verified or live.
- No database, Supabase, user, player, scout, learning-data or production changes occurred.



### Successful STAGING verification — 2026-11-27
- Corrected STAGING deployment: dep-dc4nqdh7lnhs73971rig.
- Deployed commit: f02dac306ec682daecd83b6fe739377b3c1ee7af. Render confirmed status live at 2026-11-27T12:53:53.984454Z.
- The configured Render build ran npm run build, which invokes npm test, backend node --check syntax validation and the Vite production build.
- Automated Node test result from Render build logs: 480 tests, 480 passed, 0 failed, 0 skipped. The previously failing fully vocalized MSA regression passed after normalization was moved before tokenization.
- Backend JavaScript syntax validation completed because the build proceeded to Vite.
- Frontend build completed successfully: Vite v7.3.8, built in 2.34 seconds.
- Startup log confirmed: myScoutingDatabase API listening on port 10000.
- The earlier failed deployment dep-dc4npus9v7es73fn6kf0 is retained as a failed attempt and is not treated as the released version.
- STAGING remains configured with autoDeploy disabled. The exact live deployment commit is f02dac306ec682daecd83b6fe739377b3c1ee7af.
- Authenticated browser/UI tests and direct language-chat tests against the live interface have not yet been performed. A successful build and process start do not prove the entire chat path is correct.
- No database or Supabase migration, persistent data change, model-weight change, or production change occurred.

### Status after Linguistic Intelligence 1.3.4 STAGING release
| Area | Status | Next step |
|---|---|---|
| Arabic diacritic/tatweel handling | Implemented and 480/480 suite passed | Validate through authenticated chat |
| Arabic orthographic variants | Implemented for detection-only matching | Expand tests with additional dialect examples |
| Tunisian Derja MSA distinction | Regression-tested in Arabic script and vocalized input | Add broader regional spelling coverage |
| Original-text preservation | Regression-tested | Verify in live chat response flow |
| STAGING deployment | Live on dep-dc4nqdh7lnhs73971rig / commit f02dac3 | Run authenticated end-to-end language checks |
| Production | Untouched | No production deployment authorized |



## 22. Linguistic Intelligence ↔ Language Knowledge retrieval integration — 2026-11-27

### Requirement
Ensure the Arabic orthographic improvements in Linguistic Intelligence 1.3.4 also apply to the knowledge retrieval query path. Detection and retrieval must use compatible normalization while retaining the exact original user text.

### Implemented on the STAGING feature branch
- backend/messinho-language-knowledge.js
  - Knowledge access-layer version advanced from 1.2.0 to 1.2.1.
  - Reuses normalizeMessinhoArabicForAnalysis() from Linguistic Intelligence for query token normalization.
  - Arabic stop words are normalized with the same transformation, avoiding mismatches after alif/hamza and diacritic normalization.
  - Stored knowledge content remains unchanged; normalization is applied only to matching/scoring.
  - Existing access rules remain unchanged: active, first-party authored entries only; no chat/scout write or activation access.
- tests/messinho-language-knowledge.test.js
  - Added regression coverage for fully vocalized MSA knowledge retrieval.
  - Added regression coverage for vocalized Tunisian Derja knowledge retrieval.
  - Updated the expected access-layer version to 1.2.1.

### Traceability
- Implementation commits:
  - 4c0bcf60702267ec3972c4c30c2e2a5639444ca2 — integrate Arabic normalization into knowledge retrieval.
  - ba774394988aaa87afc35503c415ae54783474cf — normalize Arabic stop words.
- Test commit:
  - 48601b44a2f86e640b86033004a8a17473aaa064 — add two Arabic knowledge-retrieval regressions.
- STAGING feature branch only. No production branch or production resource changed.

### Verification state
- Automated tests and Render build for this follow-on change are pending.
- The previous 1.3.4 code release is live in STAGING on deployment dep-dc4nqdh7lnhs73971rig, commit f02dac306ec682daecd83b6fe739377b3c1ee7af.
- The follow-on knowledge-retrieval code has not yet been deployed.
- No Supabase migration or data mutation is required; the change affects query-token matching only.
- Next action: run the full STAGING build and confirm the new tests pass, then deploy and verify the exact commit.



### Successful STAGING verification — knowledge retrieval integration — 2026-11-27
- Render STAGING deployment: dep-dc4nr656e07s73806gtg.
- Deployed commit: fdcd0063b64b9ab1ace07a63d3f37a4d3397f7b3.
- Render confirmed status live at 2026-11-27T12:55:32.126060Z.
- Full automated Node suite: 482 tests, 482 passed, 0 failed, 0 skipped.
- Both new knowledge retrieval regressions passed:
  - Fully vocalized MSA retrieves the matching Arabic knowledge entry.
  - Vocalized Tunisian Derja retrieves the matching Derja knowledge entry.
- Existing integration test passed: the authenticated chat route loads and injects linguistic intelligence and approved language knowledge.
- Backend JavaScript syntax checks completed; frontend Vite build succeeded in 2.41 seconds.
- Runtime startup log confirmed the API listening on port 10000. Supabase Data API returned HTTP 200 during startup.
- No schema or data migration was required; no Supabase write, user/player/scout data change, learning mutation, or model-weight change occurred.
- Production branch, production Render service and production Supabase were not changed.
- Authenticated browser-based conversation tests remain open; automated route coverage is not a substitute for manually testing the deployed UI with a real Admin/Scout session.

### Current language-system status after this slice
| Component | Version | Status |
|---|---:|---|
| Linguistic Intelligence | 1.3.4 | STAGING live; Arabic orthography and vocalized MSA/Derja detection normalized |
| Language Knowledge access | 1.2.1 | STAGING live; Arabic normalization shared by retrieval and stop-word filtering |
| Language profiles | 6 | German, English, French, MSA Arabic, Tunisian Derja/Arabizi, Spanish |
| Automated regression suite | 482 tests | 482 passed, 0 failed |
| Original source preservation | Covered | Normalization is analysis-only; source text remains unchanged |
| Database writes/migrations | None | Existing approved first-party knowledge remains read-only to chat/scout roles |

### Next technical slice
1. Verify live language handling through authenticated Admin and Scout chat sessions using vocalized Arabic, unvocalized Arabic, Tunisian Derja, Arabizi and mixed-language sentences.
2. Add phrase-level intent/semantic matching for Arabic and Derja without replacing the current conservative language-confidence rules.
3. Improve dialect-aware retrieval ranking while preserving the existing eight-entry cap, first-party provenance and role isolation.
4. Extend equivalent orthographic robustness to French/Spanish accent variants and German compound/umlaut variants where tests demonstrate a real retrieval miss.
5. Keep translation quality claims separate from language detection; do not claim verified translation fluency without a separately tested translation provider/benchmark.



## 23. Requested-language-aware knowledge routing — 2026-11-27

### Objective
Separate the language used to write a request from the language whose grammar, vocabulary or pragmatics the user is asking about. Example: an English question about Tunisian Derja must retrieve Derja knowledge, not only English knowledge.

### Implemented on STAGING feature branch
- backend/messinho-language-knowledge.js
  - Access-layer version advanced from 1.2.1 to 1.2.2.
  - Added conservative language-mention recognition for the six supported profiles.
  - Explicit translation target from the linguistic action is included in the requested knowledge languages.
  - Explicit subject-language mentions (for example Modern Standard Arabic, Tunisian Derja, German grammar, French grammar) augment the detected input language.
  - Returns requested_language_ids separately for traceability; language_id continues to represent the detected input language.
  - A nationality adjective by itself (for example “German player”) does not trigger a language pack.
  - Existing eight-entry cap, active first-party-only filter, read-only chat/scout policy and per-language balancing remain in place.
- tests/messinho-language-knowledge.test.js
  - Added four tests: English request for Derja grammar, MSA-vs-Derja comparison, explicit French translation target, and false-positive protection for nationality adjectives.

### Traceability
- Implementation commits:
  - 127dd261a5e08208bf3e82a6f1b333f7ff29a56b — requested-language routing and traceability field.
  - f71ba6383db90735712b61c909404781521782ba — correct regex word boundaries.
- Test commit:
  - a51a64bfd1a1d52293b9f09b40301982d4be6177 — four requested-language routing regressions.
- This is application code only. No Supabase schema/data migration is required.

### Verification state
- The preceding language retrieval release is live in STAGING on dep-dc4nr656e07s73806gtg with 482/482 tests passing.
- This requested-language routing slice is not yet built or deployed.
- Next action: full STAGING build, verify the new routing tests, then deploy the exact branch commit if all checks pass.
- Production remains untouched.



### Successful STAGING verification — requested-language routing — 2026-11-27
- Render STAGING deployment: dep-dc4nsatg1s2s73f5t8gg.
- Deployed commit: 623a72321fe29fbf711816c1b51c0e5a4ef9d768.
- Render confirmed status live at 2026-11-27T12:57:55.940086Z.
- Full automated Node suite: 486 tests, 486 passed, 0 failed, 0 skipped.
- All four new regressions passed: English request for Derja grammar, MSA/Derja comparison, explicit French translation target, and nationality false-positive guard.
- Backend syntax checks completed; Vite production build succeeded in 2.44 seconds.
- Runtime startup log confirmed myScoutingDatabase API listening on port 10000.
- No Supabase schema/data migration or write operation was required. Existing knowledge rows remain unchanged and read-only for chat/scout roles.
- Production branch, Render production service and production Supabase remain untouched.
- Authenticated browser conversation tests are still pending. Automated route and retrieval tests prove the code path with test fixtures, not the full UI experience with real user sessions.

### Status after requested-language routing
| Capability | Status |
|---|---|
| Detect input language | Implemented for six profiles |
| Detect vocalized Arabic and Derja | Implemented; regression-tested |
| Retrieve Arabic knowledge with vocalized input | Implemented; regression-tested |
| Retrieve subject-language knowledge when prompt is in another language | Implemented for explicit language mentions and translation targets |
| Compare MSA and Tunisian Derja from English prompt | Regression-tested |
| Prevent nationality-only false positives | Regression-tested |
| Full Node test suite | 486/486 passed |
| STAGING deployment | Live on dep-dc4nsatg1s2s73f5t8gg |
| Production | Untouched |

### Next step
- Authenticated STAGING chat validation for Admin and Scout using German prompts about Derja, MSA-vs-Derja comparisons, translation requests, Arabizi and mixed-language sentences.
- Then improve phrase-level intent matching and dialect-aware retrieval ranking using the existing approved knowledge corpus, without adding unreviewed external data or changing stored knowledge.
- Keep language identification, subject-language routing, knowledge retrieval and actual translation quality as separate verifiable capabilities.



## 24. Cross-language subject detection for German prompts — 2026-11-27

### Objective
Make subject-language routing work when the scout asks in German (the primary product language) about another language or dialect. Detection must distinguish a language-learning topic from nationality/location references.

### Implemented on STAGING feature branch
- backend/messinho-language-knowledge.js
  - Access-layer version advanced from 1.2.2 to 1.2.3.
  - Added German-language subject aliases for all six profiles: deutsche Grammatik, englische Grammatik, französische Grammatik, spanische Grammatik, Hocharabisch and tunesische Derja.
  - Added French/Spanish/German language-name variants to the explicit subject matcher.
  - Retained conservative phrase matching: a phrase such as “tunesischer Spieler” alone must not load Derja knowledge.
  - Explicit language routing remains separate from input-language detection and actual translation.
- tests/messinho-language-knowledge.test.js
  - Added three regressions covering all six profiles from German prompts, MSA-vs-Tunisian-Arabic comparison, and false-positive nationality protection.

### Traceability
- Implementation commits:
  - d1e16e84960514909cd8cc907ad50001edc1b8ff — expanded language mentions.
  - 8f5ec8cc2b0a2f793a0920c64e2a672b283597e0 — German spelling variants for French.
- Test commit:
  - 2c4c4ebb2b3440e14ce082f17cad25584a231060 — German subject-language regressions.
- No database changes or migrations.

### Verification state
- Previous requested-language routing is live on STAGING, deployment dep-dc4nsatg1s2s73f5t8gg, with 486/486 tests passing.
- This German-prompt enhancement is not yet built or deployed.
- Next: run full STAGING build, confirm all new cases, then deploy the exact branch commit.
- Production remains untouched.



## 25. MESSINHO Linguistic Intelligence 1.3.5 — latest-segment response language — 2026-11-27

### Owner request
- Owner said "Weiter" after the prior 1.3.4 Arabic orthography release.
- Continue language-system implementation on the active STAGING feature branch only. Production remains untouched.

### Implementation
- Updated backend/messinho-linguistic-intelligence.js:
  - Version advanced from 1.3.4 to 1.3.5.
  - Mixed-language analysis retains the aggregate primary language for analysis.
  - Reply/conversation language follows the last confidently detected language segment in the latest user message.
  - Added explicit response_language and latest_segment_language fields.
  - Translation/correction/explanation action context receives the response-language hint.
  - Original segment order and source wording remain unchanged.
- Updated tests/messinho-linguistic-intelligence.test.js:
  - Version assertion advanced to 1.3.5.
  - Added regression for English-to-French switching within one sentence; expected response language is French.
  - Added regression for French greeting followed by English greeting; expected response language is English.

### Traceability
- Implementation commit: 25cf8da89ba25e865a64a0f4efd63640c4f84a3d.
- Regression test commit: f225eb53d695d29d5746502eeb57331fa356dfa4.

### Verification state
- The 1.3.5 source and tests are committed to the active STAGING feature branch.
- Automated tests for 1.3.5 have not yet been executed. Do not treat this version as verified or live until the STAGING build succeeds and the exact deployment commit is confirmed.
- No Supabase migration, persistent knowledge write, player/scout/account data change, or model-weight change was made.
- Production branch, Render production service and production Supabase were not modified.

### Next steps
1. Run the full STAGING build gate (npm test, backend syntax checks, Vite production build).
2. Correct any actual regression before release.
3. Verify exact Render STAGING deployment commit and live status.
4. After the 1.3.5 release is green, expand mixed-language segmentation and phrase-level semantic interpretation.
5. Authenticated live-chat checks remain necessary to prove the chat endpoint uses response_language end to end.



## 26. Verification addendum — requested-language routing 1.2.3 — 2026-11-27

- The German subject-language routing change in section 24 was deployed to Render STAGING as deployment dep-dc4nt46c6qcc73eap670.
- Exact deployed commit at that time: d05be565a9d426aa7a03d18ca2f7090a5b65f8c1.
- Render confirmed status live at 2026-11-27T12:59:34.729638Z.
- Full Node suite at that deployment: 489 tests, 489 passed, 0 failed, 0 skipped.
- New regressions passed for all six subject-language profiles from German prompts, MSA-vs-Tunisian-Arabic comparison and nationality false-positive protection.
- Backend syntax checks and Vite production build passed; Vite completed in 2.44 seconds.
- Runtime startup confirmed the API listening on port 10000.
- This verification applies to language knowledge access version 1.2.3 and Linguistic Intelligence 1.3.4. It does not verify the later 1.3.5 response-language changes.

### Current release alignment
- The latest feature branch now includes Linguistic Intelligence 1.3.5 (commit 25cf8da89ba25e865a64a0f4efd63640c4f84a3d) and its tests (commit f225eb53d695d29d5746502eeb57331fa356dfa4).
- Render STAGING is still on the earlier 1.3.4 deployment until the 1.3.5 build gate below completes.
- Next action: build and test the latest feature-branch state, then deploy that exact commit to STAGING only.



## 27. MESSINHO Linguistic Intelligence 1.3.5 — STAGING release verified — 2026-11-27

- Render STAGING deployment: dep-dc4ntg97lnhs7397cve0.
- Exact deployed commit: 7f5983c54888ae74ce67afeb15e58873c6c54d0a.
- Render status: live; finished at 2026-11-27T13:00:23.144355Z.
- Build gate: 491 Node tests, 491 passed, 0 failed. Backend syntax checks passed. Vite production build succeeded in 2.47 seconds.
- Regression tests confirmed that an intra-sentence English-to-French switch sets French as the latest segment and response language, and that the last language in a multi-sentence greeting controls the response language.
- Runtime startup log confirmed myScoutingDatabase API listening on port 10000.
- No database migration, knowledge-row write, player/scout/account data change, or model-weight change was made.
- Production branch, Render production service and production Supabase remain untouched.

## 28. MESSINHO Linguistic Intelligence 1.3.6 — response metadata integration — 2026-11-27

### Implementation
- backend/messinho-linguistic-intelligence.js:
  - Advanced version from 1.3.5 to 1.3.6.
  - Added buildMessinhoLinguisticResponseMetadata(), a stable client-safe API metadata contract.
  - Contract exposes aggregate primary language separately from response_language, latest_segment_language and conversation_language_hint, while retaining segment/action metadata.
- backend/server.js:
  - Imports the metadata helper.
  - MESSINHO chat API now uses the helper for linguistic_intelligence response metadata, so the selected reply language is visible to the client rather than existing only inside the prompt context.
  - Existing system prompt continues receiving the full linguistic context and approved language knowledge.
- tests/messinho-linguistic-intelligence.test.js:
  - Version assertion advanced to 1.3.6.
  - Added metadata contract coverage and null-context safety.

### Traceability
- Core metadata helper commit: bb30abe414b93594bd4339a91c41e23c922f1157.
- Metadata tests commit: 26d21525892d0931935777b35aa60a52ab5257e9.
- Chat API integration commit: 8bd085bebfdc825690efd49357ccce9f458ba6ce.

### Verification state
- 1.3.5 is verified and live on STAGING as documented in section 27.
- 1.3.6 source, tests and chat API integration are committed to the active STAGING feature branch.
- 1.3.6 has not yet passed the full STAGING build gate and is not yet deployed. Do not describe it as live.
- No Supabase migration or persistent data change is required for this API metadata change.
- Production remains untouched.

### Next steps
1. Run the complete STAGING build gate for 1.3.6 and fix any actual regression.
2. Verify the exact Render STAGING deployment commit/status and startup.
3. Verify the client receives response_language and latest_segment_language in the chat response.
4. Continue phrase-level semantic understanding and dialect-aware context retrieval only after the API contract is verified.
5. Authenticated Admin/Scout chat testing remains outstanding; never request or store credentials in chat.



## 27. Verification addendum — Linguistic Intelligence 1.3.5 — 2026-11-27

### Release verification
- Latest STAGING deployment: dep-dc4ntpirlj7c73e1fnsg.
- Exact live commit: 094ccee77f7b9d347a8206cb7477b277ada986e8.
- Render confirmed status live at 2026-11-27T13:01:23.042062Z.
- The deployed source includes Linguistic Intelligence 1.3.5 and language knowledge access 1.2.3.
- Full automated Node suite: 491 tests, 491 passed, 0 failed, 0 skipped.
- Both 1.3.5 response-language regressions passed:
  - English followed by French within one sentence selects French for the reply.
  - French greeting followed by English greeting selects English for the reply.
- German subject-language routing tests also passed in the same suite.
- Backend JavaScript syntax checks completed; Vite production build succeeded in 2.36 seconds.
- Runtime startup confirmed myScoutingDatabase API listening on port 10000; Supabase Data API returned HTTP 200.
- No Supabase migration or persistent knowledge write; no player/scout/account data change; no model-weight update.
- Production branch, Render production service and production Supabase remain untouched.

### Current verified STAGING baseline
| Layer | Version | Status |
|---|---:|---|
| Linguistic Intelligence | 1.3.5 | Live |
| Language Knowledge access | 1.2.3 | Live |
| Arabic analysis normalization | Included in 1.3.4 | Live |
| Arabic/Derja knowledge retrieval normalization | Included in 1.2.1+ | Live |
| Requested subject-language routing | Included in 1.2.3 | Live |
| Last-confident-segment reply language | Included in 1.3.5 | Regression-tested |
| Automated Node suite | 491 tests | 491 passed, 0 failed |
| Production | — | Untouched |

### Remaining verification boundary
- The successful Render build and route/unit tests do not replace a real authenticated browser conversation with Admin and Scout accounts.
- Next inspect the prompt/chat integration to confirm response_language is actually consumed by the live prompt path, then run the authorized authenticated STAGING chat checks.
- Continue with phrase-level semantics only after this integration boundary is verified.



## 28. Chat-prompt binding for Linguistic Intelligence 1.3.5 — 2026-11-27

### Finding
- The authenticated chat route already built the linguistic context, returned client-safe response metadata and injected the full linguistic context into the OpenAI system prompt.
- The system prompt did not explicitly state that response_language/latest_segment_language must override the aggregate language when a message switches languages mid-sentence. The JSON context was present, but the behavioral priority was underspecified.

### Implemented on STAGING feature branch
- backend/server.js
  - The system prompt now explicitly prioritizes response_language.
  - latest_segment_language is used as the evidence for the final reply language.
  - primary_language and conversation history are fallbacks only when no clear final segment exists.
  - An explicit translation target applies only to the requested translation task and does not silently change later conversation language.
  - The route continues to return buildMessinhoLinguisticResponseMetadata(linguisticContext), including response_language and latest_segment_language.
- tests/messinho-prompt-context.test.js
  - Added a source-level integration regression verifying the prompt priority, latest-segment instruction and response metadata wiring.

### Traceability
- System prompt integration commit: e01b85fb5ba5ca1ac309133b0f88be05cf78445f.
- Regression test commit: fd906b76d7ae4f4be9a3785058c35b27cd2c1356.

### Verification state
- The current live STAGING baseline is deployment dep-dc4ntpirlj7c73e1fnsg, commit 094ccee77f7b9d347a8206cb7477b277ada986e8, with Linguistic Intelligence 1.3.5 and 491/491 tests passing.
- This prompt-binding integration is committed but not yet built or deployed.
- Next action: run the full STAGING build, confirm the new integration test, then deploy the exact tested commit.
- No database migration or persistent knowledge write is required. Production remains untouched.



### First response-language prompt build feedback and test correction — 2026-11-27
- First build attempt for prompt-binding commit f9817630c34035c64549660fb9837b8edd400121 failed in the test suite before deployment. Render deployment dep-dc4nv3uc6qcc73eb0sjg is build_failed; the previous live STAGING deployment remained active.
- The new test “MESSINHO prompt prioritizes the latest detected segment for reply language” passed.
- Root cause: an existing assertion in tests/messinho-prompt-context.test.js still expected the old inline metadata shape linguistic_intelligence:{version:linguisticContext.version}. The actual authenticated route correctly uses buildMessinhoLinguisticResponseMetadata(linguisticContext).
- Corrective test commit: acada315561b7bf2080871e779c644f9067ba537.
  - Updated the route assertion to match the current metadata builder.
  - Added assertions that the response metadata builder exposes response_language and latest_segment_language.
- This was a stale test contract, not a runtime language-processing failure. The failed build did not replace the existing live STAGING deployment.
- No database migration/write, player/scout/account data change, or production change occurred.
- Next: rerun the complete STAGING build on the corrected branch and verify the exact live commit.



### Successful STAGING verification — response-language prompt binding — 2026-11-27
- Render STAGING deployment: dep-dc4nvhbl550s73a2qa20.
- Exact live commit: a11faade62ee198558f9d68a77f3264753828f1b.
- Render confirmed status live at 2026-11-27T13:04:53.63043Z.
- Full automated Node suite: 494 tests, 494 passed, 0 failed, 0 skipped.
- The new prompt-priority regression passed and confirms:
  - response_language has explicit priority in the MESSINHO system prompt.
  - latest_segment_language is identified as the final-segment evidence.
  - The authenticated chat route returns buildMessinhoLinguisticResponseMetadata(linguisticContext).
  - Client-safe metadata includes response_language and latest_segment_language.
- Backend JavaScript syntax checks completed; Vite production build succeeded in 2.30 seconds.
- Runtime startup confirmed the API listening on port 10000; Supabase credentials were present and the server completed startup.
- The earlier failed build dep-dc4nv3uc6qcc73eb0sjg was not deployed; the stale test contract was corrected before the successful release.
- No Supabase migration/write, persistent knowledge mutation, player/scout/account data change or model-weight update occurred.
- Production branch, Render production service and production Supabase remain untouched.

### Verified language-system state
| Capability | Status |
|---|---|
| Linguistic Intelligence 1.3.5 | Live |
| Language Knowledge access 1.2.3 | Live |
| Arabic orthographic analysis and retrieval normalization | Live |
| Requested-language routing from German/English prompts | Live |
| Last confidently detected segment selects reply language | Live and prompt-bound |
| API response exposes response_language and latest_segment_language | Live |
| Automated Node suite | 494/494 passed |
| Authenticated browser conversation | Still requires manual Admin/Scout session validation |

### Next development step
- Add phrase-level semantic intent handling and mixed-language segmentation regression cases, especially Derja/Arabizi embedded in German, French or English.
- Keep detection, response-language selection, subject-language retrieval and translation as separately measured capabilities.
- Do not claim human-level fluency or verified translation quality from deterministic detection tests alone.



## 29. MESSINHO Linguistic Intelligence 1.3.6 — response-language API contract — STAGING verified — 2026-11-27

### Implemented and released
- Language analysis version: 1.3.6.
- The mixed-language response selector is now passed through a stable response metadata helper.
- The authenticated MESSINHO chat route returns:
  - aggregate primary language for analysis;
  - response_language for the actual reply;
  - latest_segment_language and conversation_language_hint;
  - action and original language segments.
- The system prompt explicitly prioritizes response_language and uses latest_segment_language as the fallback. Aggregate primary_language must not override the last confidently detected segment.
- The approved language knowledge retrieval and prompt injection remain in the existing authenticated chat path.
- Original user text and segment order are preserved.

### Traceability
- Metadata helper: bb30abe414b93594bd4339a91c41e23c922f1157.
- Metadata contract tests: 26d21525892d0931935777b35aa60a52ab5257e9.
- Chat API integration: 8bd085bebfdc825690efd49357ccce9f458ba6ce.
- Explicit system-prompt priority: e01b85fb5ba5ca1ac309133b0f88be05cf78445f.
- Prompt/API integration regression tests: acada315561b7bf2080871e779c644f9067ba537.

### Build and deployment verification
- First attempts exposed a stale source-level test assertion that still expected the former inline response metadata object. The actual route had been refactored to use buildMessinhoLinguisticResponseMetadata(). The assertion was updated to test the current API contract; no runtime behavior was weakened.
- Final verified deployment: dep-dc4nvk5vbd1s73br0320.
- Exact deployed commit: a11faade62ee198558f9d68a77f3264753828f1b.
- Render status: live; finished at 2026-11-27T13:05:36.810695Z.
- Full Node suite: 494 tests, 494 passed, 0 failed.
- Backend syntax checks passed; Vite production build succeeded in 2.49 seconds.
- Runtime log confirmed node backend/server.js started and myScoutingDatabase API listening on port 10000.
- A second deployment was created for the same exact commit and also reached live; no code difference between the two deployments.

### Boundaries and remaining verification
- No Supabase migration or persistent language-knowledge write was required.
- No player, scout, account or user data was changed.
- Production branch, production Render service and production Supabase remain untouched.
- Authenticated human Admin/Scout chat acceptance is still pending. Automated tests verify the language selection and API response contract, but not a real signed-in browser conversation.
- Next work: improve phrase-level semantic interpretation and dialect-aware retrieval ranking using only the existing approved corpus; then perform authenticated STAGING chat checks for MSA, Derja, Arabizi, mixed language, translation target and negation/uncertainty preservation.



## 31. Explicit output-language targets for all language actions — 2026-11-27

### Objective
A user may request not only a translation, but also an explanation, correction or rephrasing in a specific language. MESSINHO must honor the requested output language for that task without changing the conversation's default reply language afterward.

### Implemented on STAGING feature branch
- backend/messinho-linguistic-intelligence.js
  - Linguistic Intelligence version advanced from 1.3.6 to 1.3.7.
  - action.target_language now carries an explicit target for translate, explain, correct and rephrase actions.
  - Action instructions distinguish the requested output language from the source language and the default conversation language.
  - Clarification remains required for translation only when no target language can be identified.
- backend/messinho-language-knowledge.js
  - Language Knowledge access version advanced from 1.2.3 to 1.2.4.
  - Requested-language routing now includes explicit target languages for all explicit actions, not only translation.
- tests
  - tests/messinho-linguistic-intelligence.test.js: two regressions for explicit output targets across explain/correct/rephrase and task-scoped target behavior.
  - tests/messinho-language-knowledge.test.js: one regression for retrieving Derja knowledge for an explanation explicitly requested in Tunisian.

### Traceability
- Linguistic action implementation commit: e68ac819672ac5ba2367b0823c97ad199e94a347.
- Knowledge routing implementation commit: 0a1bacf60498b818e16be8ba43e0541d2c9a2db0.
- Linguistic action test commit: 126cad42b9bc9203d4afc6bb40860f72ae79c17e.
- Knowledge retrieval test commit: b44c7d02132bdc3d6ea72a537c54ddb90ee637dd.

### Verification state
- Previous STAGING baseline: Linguistic Intelligence 1.3.6 / Language Knowledge 1.2.3, deployment dep-dc4nvhbl550s73a2qa20, 494/494 tests passed.
- This 1.3.7 / 1.2.4 implementation is committed but not yet built or deployed.
- Next: run full STAGING build, verify all tests, then deploy exact commit to STAGING only.
- No Supabase schema/data migration is required. Production remains untouched.



## 30. MESSINHO Language Knowledge 1.2.5 — phrase-aware and segment-scoped retrieval — 2026-11-27

### Owner continuation
Continue improving the language system after the verified Linguistic Intelligence 1.3.6 release. Use only the existing approved first-party language corpus; do not add unreviewed dictionary content or change persistent knowledge rows.

### Implementation on STAGING feature branch
- backend/messinho-language-knowledge.js:
  - Access-layer version advanced from 1.2.4 to 1.2.5.
  - Ranking now considers exact normalized phrase matches from approved aliases, phrases, term labels/transliterations and example text, in addition to token overlap.
  - Phrase comparison uses the existing detection-only normalization, including Arabic diacritic/tatweel normalization; original user text and stored knowledge are not rewritten.
  - Mixed-language retrieval now scopes token and phrase scoring to the matching detected segment when a confident segment exists.
  - Explicitly requested subject-language retrieval still falls back to the full request when the target language is not the language of the input segment (e.g. an English question about Derja).
  - Shared knowledge continues to use the complete request context.
  - Existing active-only, first-party-authored, append-only and eight-item retrieval limits remain unchanged.
- tests/messinho-language-knowledge.test.js:
  - Updated the knowledge access-layer version assertion.
  - Added regressions for exact Derja phrase aliases, mixed English/French segment isolation, and vocalized Arabic alias retrieval.

### Traceability
- Implementation commit: e81398ebbec8b8edf71d98c533dfc9aae6f13cbd.
- Regression tests commit: 9e0da8eae66b729e18d5df159c8aa8094b240247.

### Verification status
- Linguistic Intelligence 1.3.6 and the chat response-language metadata/prompt integration are live on STAGING as recorded in section 29.
- Language Knowledge 1.2.5 is committed but not yet tested or deployed.
- Next: run full Node tests, backend syntax checks and Vite build. Fix any regression before deployment.
- No Supabase migration or knowledge-row write is part of this code-only change. Production remains untouched.



### First STAGING build feedback — separable German rephrase verb — 2026-11-27
- The first build attempt for Linguistic Intelligence 1.3.7 / Language Knowledge 1.2.4 found one failing new regression before deployment.
- The failing case was “Formuliere das auf Englisch um.”; the action classifier returned answer instead of rephrase because the separable German verb pattern only recognized “formuliere um” with no intervening object.
- The other new cases passed, including explicit Derja explanation knowledge retrieval and task-scoped target language.
- Corrective implementation commit: e0361d66b350e562ec881def2784863fee219545.
  - The rephrase matcher now recognizes the separable verb “formuliere … um” with up to six intervening words.
  - This is a bounded linguistic pattern, not a broad generic match.
- The failed build did not deploy; previous live STAGING remains on the last successful deployment.
- No database write/migration or production change occurred.
- Next: rerun full STAGING build and verify all 497+ tests before release.



### First 1.2.5 build feedback and regression-fixture correction — 2026-11-27
- First STAGING build attempt dep-dc4o0ttg1s2s73f6estg ran 500 tests: 498 passed, 2 failed.
- Failure 1: the knowledge summary test still expected version 1.2.4; corrected to 1.2.5.
- Failure 2: the existing three-language retrieval fixture lacked German vocabulary in its synthetic German knowledge rows. Segment-scoped retrieval correctly refused to use English/French segment tokens for German entries. Added German-specific tokens (Spieler/Liga/bereit) to the German fixture corpus rather than weakening language isolation.
- Correction test commit: 276f8a40601c44f8f48fb894e032be57ec70cf04.
- The phrase-alias, mixed-language segment-isolation and vocalized-Arabic alias regressions all passed in the first run.
- No runtime code change was made in response to these two test failures; both were stale/incomplete test fixtures. The failed build did not replace the current live STAGING version.
- Next: rerun full STAGING build and deploy only after all tests, syntax checks and Vite build pass.



## 31. MESSINHO Language Knowledge 1.2.5 — STAGING release verified — 2026-11-27

- Render STAGING deployment: dep-dc4o1c5g1s2s73f6gar0.
- Exact deployed commit: 2752d22850f8b62b55ec0f60c934747c0f8e6078.
- Render status: live; finished at 2026-11-27T13:08:40.136285Z.
- Full Node suite: 500 tests, 500 passed, 0 failed.
- Backend syntax checks passed; Vite production build succeeded in 2.42 seconds.
- Runtime log confirmed the Node server started and the API listened on port 10000.
- New regressions passed for exact Tunisian Derja phrase aliases, mixed English/French segment isolation, and vocalized Arabic phrase aliases.
- Existing eight-item retrieval cap, active-only filtering, append-only versions, and fail-closed DB behavior remain covered by the full suite.
- No Supabase migration or persistent knowledge write occurred. No player/scout/account data changed. Production remains untouched.

### Next linguistic milestone
- Add explicit, bounded semantic cues for negation scope, qualified evaluations (e.g. “not bad”, “not necessarily”), uncertainty and contrast across all six language profiles.
- These cues must preserve the original wording and clause boundaries. They are evidence hints, not a replacement for full semantic interpretation or human review.
- Add independent cross-language regression cases before deployment.
- Authenticated Admin/Scout chat validation remains open.



## 32. MESSINHO Linguistic Intelligence 1.3.8 — qualified negation and nuance cues — 2026-11-27

### Objective
Add deterministic, bounded semantic cues so MESSINHO does not flatten qualified scouting statements such as “not bad”, “not necessarily ready”, “not enough yet”, or their equivalents in the supported languages.

### Implementation on STAGING feature branch
- backend/messinho-linguistic-intelligence.js:
  - Version advanced from 1.3.7 to 1.3.8.
  - Added phrase-level cue extraction for:
    - not necessarily / nicht unbedingt / pas forcément / no necesariamente / ليس بالضرورة / موش بالضرورة;
    - not yet / noch nicht / pas encore / todavía no / لم ... بعد / مازالش;
    - not bad / nicht schlecht / pas mauvais / no es malo / ليس سيئا / موش خايب;
    - not enough / nicht ausreichend / pas suffisant / no es suficiente / لا يكفي / موش كافي;
    - not only and its supported equivalents;
    - uncertainty and contrast cues across the six profiles.
  - Cues are returned as explicit labels in conversation signals. They do not assign a player rating or override the original phrase.
  - Arabic diacritics and Latin accent normalization are used only for cue detection; source text is preserved.
- tests/messinho-linguistic-intelligence.test.js:
  - Added six-language regression coverage for negation scope, qualified evaluations, uncertainty and contrast.
  - Added source-text preservation coverage.

### Traceability
- Main implementation: 5e94c1fd6ea4eb56d09d759cfa6f5f4252ad262a.
- Regex escaping correction: c792bca737c4d50d3229e0a4721fa3596d8716de.
- Spanish phrase coverage: 64ef109db261e679c04a4f52a02ce86aa95c4e7f.
- Regression tests: 0949facdda4bdbddf3daf389d7e9a49b788b9fef.

### Verification status
- This 1.3.8 code and its tests are committed but not yet run through the complete STAGING build gate.
- Next: run all Node tests, backend syntax checks and Vite build. Correct actual failures before deployment.
- No Supabase migration, language-knowledge row write, player/scout/account change or model-weight change is part of this work.
- Production remains untouched.



## 32. Semantic nuance intelligence 1.3.9 — qualified evaluation and clause cues — 2026-11-27

### Objective
Preserve meaning when a player description contains qualified evaluations, negation, uncertainty or contrast. These are conservative evidence cues, not a sentiment model and not a replacement for full semantic interpretation.

### Implemented on STAGING feature branch
- backend/messinho-linguistic-intelligence.js
  - Version advanced from 1.3.8 to 1.3.9.
  - Exposes negation_scope_cues, qualified_evaluation_cues, uncertainty_cues and contrast_cues.
  - Covers qualified patterns including “not bad”, “not necessarily”, “not yet”, “not enough” and “not only” across supported language variants.
  - Added French “pas mal” and Tunisian Arabizi cues including “mouch khayeb”, “mouch bel dharoura”, “yemken” and “ama”.
  - Existing boolean signals remain backward compatible.
- backend/server.js
  - System prompt now treats semantic cue fields as cautious hints.
  - Explicitly instructs the model to preserve negation, qualification, uncertainty and contrast without inventing a stronger evaluation.
  - Reply language continues to prioritize response_language and the last clear segment.
- tests/messinho-linguistic-intelligence.test.js
  - Added cross-language regressions for qualified evaluation, uncertainty and contrast across all six profiles.
  - Added not-necessarily coverage, Arabizi coverage, direct-negation false-positive protection and metadata propagation coverage.
- tests/messinho-prompt-context.test.js
  - Added prompt-level assertions for all four semantic cue fields and response-language priority.

### Traceability
- Semantic cue implementation commit: f9452d4e71507545ef254a4fbf360ef96e517f41.
- System prompt integration commit: fcdf18c33dde71b40cc16eec56fdb06be495d6b5.
- Prompt regression commit: cf895c015a0d3fed77b5222215708904e42d007b.
- Metadata regression commit: e0bd0e5830406260679336bacf16001eeb0fe256.

### Verification state
- Previous live STAGING baseline: Linguistic Intelligence 1.3.7 / Language Knowledge 1.2.5, deployment dep-dc4o1c5g1s2s73f6gar0, 500/500 tests passed.
- Linguistic Intelligence 1.3.9 and semantic prompt integration are committed but not yet built or deployed.
- Next: full STAGING build, inspect each new semantic regression, then deploy only if all tests, backend syntax checks and Vite build pass.
- No Supabase migration or persistent knowledge write is required. Production remains untouched.



## 33. MESSINHO Linguistic Intelligence 1.3.9 — expanded French and Tunisian Arabizi nuance — 2026-11-27

### Changes since 1.3.8
- Advanced linguistic-intelligence version to 1.3.9.
- Expanded qualified-negation recognition:
  - French "pas mal" is treated as a qualified positive/neutral evaluation, not a plain negative.
  - Tunisian Arabizi variants now include "mouch khayeb" and "mouch bel dharoura".
- Expanded uncertainty recognition to Tunisian Arabizi "yemken", "momken" and "mumkin".
- Expanded contrast recognition to "ama", "walakin" and French/Spanish contrast phrases.
- Added "mouch" to deterministic negation detection.
- Existing Arabic script and source-preservation behavior remains unchanged.

### Tests and traceability
- Source implementation commit: f9452d4e71507545ef254a4fbf360ef96e517f41.
- Six-language and Tunisian Arabizi regression commit: 1d5d93646b8caf554a46912a9c7c8ff513be393b.
- Spanish test fixture correction: 4e014e7d35b3774ee9dc42ac31aa9d170fad52d3.
- Regression cases cover qualified evaluation, uncertainty, contrast, not-necessarily, Arabizi and plain negation without false qualified cues.

### Verification status
- Linguistic Intelligence 1.3.9 is committed but not yet verified by the complete STAGING build.
- Run full Node tests, backend syntax checks and Vite production build. Fix any real regression before release.
- Production remains untouched; no Supabase migration or persistent language-knowledge write is required.



### First 1.3.9 build feedback — preserve “not necessarily bad” nuance — 2026-11-27
- First full STAGING build attempt dep-dc4o3f61egvs7396oa20 ran the new semantic regressions and found two test expectation issues.
- The Tunisian Derja fixture “موش بالضرورة خايب” means “not necessarily bad”; it must not also be asserted as the separate “not bad” cue. The expected cues were corrected to not_necessarily and not_enough only.
- The metadata cue list is a set of independent evidence cues; the test no longer assumes an ordering between not_bad and not_yet.
- Corrective test commit: b2388a0ba76826118ee63f5a016a8e081920824d.
- No semantic implementation was weakened or changed for these test corrections. The failed build did not replace the live STAGING deployment.
- Next: rerun the complete STAGING build and deploy only after all semantic tests, syntax checks and Vite build pass.
- No database write/migration or production change occurred.



### First 1.3.9 STAGING build feedback and corrections — 2026-11-27
- First 1.3.9 build attempt dep-dc4o3jtg1s2s73f6mh5g ran 508 tests: 505 passed, 3 failed.
- Findings:
  1. The existing Derja test uses “موش بالضرورة خايب”; the phrase recognizer initially handled “موش خايب” but not the intervening qualifier.
  2. Arabic negation required an explicit normalized-script boundary fallback so particles such as ليس are recognized reliably without matching substrings inside other words.
  3. A metadata test assumed cue-array order, although the cue labels are semantically an unordered set.
- Corrections:
  - Source commit 9ad60cc74ada8ba87fcd5259103e49e45b91de81 extends the qualified Derja phrase and adds bounded Arabic negation detection.
  - Source commit 264d017a5202efca58182edfa24b1dda642e7fab corrects Unicode letter-class escaping in the Arabic token boundary.
  - The metadata test now compares sorted cue labels, not incidental declaration order.
- The Arabizi-specific, not-necessarily, phrase and source-preservation regressions passed in this first run.
- No database, language knowledge rows, player/scout/account data or production resources were changed.
- Next: rerun the full build gate and deploy only after every test and build stage is green.



### Second 1.3.9 build feedback — normalized Arabic contrast particle — 2026-11-27
- Build attempt dep-dc4o4dbl550s73a3a6h0 reached the semantic regression tests; the remaining failures were both Tunisian Derja contrast assertions.
- Root cause: analysis normalization maps the hamza-bearing particle “أما” to “اما”, while the contrast cue and token list only contained the original spelling.
- Corrective implementation commit: 689c5902ba98fdf3db6ad4a29e9b1c3d17f9c68e.
  - Added the normalized spelling “اما” alongside “أما” in both semantic cue and boolean contrast recognition.
  - Original user text remains unchanged.
- The “not necessarily bad” distinction and cue-order correction are retained; no sentiment shortcut was introduced.
- The failed build did not deploy. Existing live STAGING remains unchanged.
- Next: rerun the complete suite and build after this normalization-alignment fix.
- No database write/migration or production change occurred.



### Second 1.3.9 build feedback and Arabic normalization correction — 2026-11-27
- Second build attempt dep-dc4o4hgu01pc73ep8220 ran 508 tests: 506 passed, 2 failed.
- Remaining findings were caused by the same Arabic normalization boundary:
  - The contrast particle أما is normalized to اما before semantic cue matching; the current branch now recognizes both forms in cue and boolean detection.
  - The Arabic phrase ليس سيئا is normalized to ليس سييا because hamza-on-ya is folded for analysis. The not_bad pattern now matches the normalized form and optional بالضرورة qualifier.
- Source correction commit: 31b62106df927a72dae08d45f568f4505d75acd6.
- The stable metadata cue-order test passed after switching to order-independent comparison.
- Next: rerun the full STAGING build gate. Do not deploy 1.3.9 until all 508 tests and the production frontend build pass.



## 34. MESSINHO Linguistic Intelligence 1.3.9 — semantic nuance cues — STAGING release verified — 2026-11-27

- Render STAGING deployment: dep-dc4o53l6iffs73dcklr0.
- Exact deployed commit: 73b9573d129289e7b6f72c312fe9f7b59d199587.
- Render status: live; finished at 2026-11-27T13:16:58.957230Z.
- Full Node suite: 508 tests, 508 passed, 0 failed.
- Backend syntax checks passed; Vite production build completed successfully and Render reported Build successful.
- Runtime log confirmed npm start and myScoutingDatabase API listening on port 10000.
- Verified regression coverage now includes:
  - German, English, French, Spanish, MSA Arabic and Tunisian Derja;
  - qualified negative/positive evaluation phrases (not bad, pas mal, موش خايب);
  - not-necessarily and not-yet phrases;
  - uncertainty and contrast;
  - Tunisian Arabizi (mouch khayeb, mouch bel dharoura, yemken, ama);
  - normalized Arabic hamza/diacritics and preservation of original source text;
  - metadata publication of semantic cues to the chat response.
- Semantic cue arrays are evidence hints only. They do not create player ratings or replace source wording.
- No database migration, persistent knowledge write, player/scout/account change, or model-weight update occurred.
- Production branch, Render production service and production Supabase remain untouched.

### Next work after 1.3.9
1. Verify authenticated Admin and Scout chat end-to-end on STAGING using representative German, English, French, Spanish, MSA, Derja, Arabizi and mixed-language prompts.
2. Verify the UI consumes response_language and displays semantic cue metadata without exposing internal diagnostics to Scouts.
3. Expand phrase-level idiom and ambiguity handling only from the existing approved language corpus.
4. Keep human review for ambiguous dialect, sarcasm and high-impact scouting interpretations; do not auto-convert semantic cues into ratings.
5. Continue to avoid persistent knowledge changes until rights and quality review are explicitly satisfied.

## 35. MESSINHO Conversational Intelligence 2.0 — durable chat foundation — STAGING only — 2026-11-27

- Work branch: `feature/messinho-conversational-intelligence-2`.
- Base: current deployed STAGING branch `feature/messinho-unified-ai-integration` at commit `6429b055948915c1b40c2b1686f4c98cea1014cd`.
- Production branch and LIVE services were not changed.
- User confirmed the OpenAI connection is already configured. No duplicate provider integration or secret rotation was performed.
- Removed the deterministic small-talk early return from the normal chat path. Greetings and ordinary conversation now reach the existing conversational model instead of being intercepted by canned response templates.
- Improved conversational system instructions: maintain context, answer naturally, ask targeted clarifying questions, preserve linguistic nuance, distinguish evidence from inference, and avoid claiming tool execution that did not happen.
- Provider failures are now surfaced as explicit, classified user-facing responses rather than silently falling back to a generic canned introduction.
- Added authenticated conversation restore endpoint `GET /api/agent/conversation`.
- Chat requests now load their last 20 turns from server-managed, owner-scoped storage; the browser-supplied history is no longer trusted as the source of truth.
- Chat responses persist assistant messages and bounded research context; user messages are persisted before processing.
- The workspace restores the latest conversation after authentication and sends the returned conversation ID on subsequent turns.
- Added STAGING migration `20261127030000_messinho_conversational_memory.sql` and applied it successfully to Supabase project `myScoutingDatabase-staging` (`nwqwnrhupbyhshsprxjt`).
- Added and applied `20261127031000_messinho_conversation_message_fk_index.sql` to cover the message-to-conversation foreign key.
- Tables: `messinho_conversations`, `messinho_conversation_messages`; RLS enabled, direct anon/authenticated grants revoked, service-role access only, owner-scoped backend queries.
- Confirmed both tables exist in the STAGING schema after migration.
- Added regression coverage for safe research-context sanitization. GitHub Actions passed: 509/509 Node tests, backend syntax checks, and the full Vite production build (`MESSINHO staging branch CI`).
- CI workflows were extended to run for this work branch and for pull requests targeting the STAGING integration branch.
- Supabase post-migration advisors: no health findings; the new conversation FK is indexed. The new tables' indexes are currently reported as unused because the tables are still empty. Existing project-wide security warnings remain outside this change; the two new tables each have owner-scoped SELECT policies, RLS enabled, and no direct anon/authenticated grants.
- Not yet complete: end-to-end authenticated Admin/Scout verification, streaming responses, conversation list/new-thread UX, and full runtime confirmation of the connected provider on Render STAGING.
- Next: complete authenticated Admin/Scout and provider runtime verification on STAGING. PR #48 merged into `feature/messinho-unified-ai-integration` as STAGING commit `40c1001e0e66ed7478ecdb3de5cb8cbbaa010d2a`; production/LIVE remain untouched.

## 36. Conversational Intelligence 2.0 — merged to STAGING and health verified — 2026-11-27

- PR #48 merged by squash into `feature/messinho-unified-ai-integration`.
- STAGING integration commit: `40c1001e0e66ed7478ecdb3de5cb8cbbaa010d2a`.
- Post-merge GitHub Actions:
  - MESSINHO Node tests: success.
  - MESSINHO backend syntax: success.
  - MESSINHO staging branch CI (regression suite, backend syntax, Vite production build): success.
  - Staging health smoke test: success.
- Health endpoint result from `https://myscoutingdatabase-messinho-staging.onrender.com/api/health`: HTTP 200, `ok=true`, database `ok`, authentication `ready`, MESSINHO core `provider_independent`, external research `ready`, optional AI analysis `ready`.
- Full regression suite on the feature branch: 509 tests passed, 0 failed.
- The optional AI provider configuration is reported ready by STAGING health; no API key value was exposed or changed.
- Supabase STAGING tables and owner-scoped policies are present; both conversation migrations are applied.
- Remaining verification: one authenticated Admin and one authenticated Scout should each conduct a real multi-turn conversation, refresh/re-login, and confirm that their own history restores without cross-account visibility. Confirm actual OpenAI response generation from a normal chat request. Streaming and multiple named conversations remain later enhancements.
- No production branch, production Supabase project, or LIVE service was modified.


## 37. Conversational Intelligence 2.1 — language-aware UI and role-safe semantic metadata — 2026-11-27

- PR #49 merged by squash into `feature/messinho-unified-ai-integration`.
- Merge commit: `88d5420a6d7a56300725889ef39c169e76e1d7a7`.
- Work branch: `feature/messinho-language-ui-metadata`; final tested head: `5d2e369b95ef9e19889929d3c18f435e2c0801f1`.
- Backend now persists bounded `linguisticIntelligence` metadata in the existing owner-scoped `messinho_conversation_messages.metadata` JSONB column. The metadata omits the potentially large segment payload.
- Conversation restore now restores the linguistic metadata together with the message history.
- Admin responses and restored Admin messages retain the semantic cue metadata for review.
- Scout responses and restored Scout messages receive only the selected response language and primary language label. Semantic cue arrays and diagnostic labels are not exposed to Scout clients.
- Chat UI consumes `response_language`, applies the correct language tag and RTL direction for Arabic/Tunisian Arabic, and displays a simple reply-language label.
- Human-readable semantic hints (Verneinung, eingeschränkte Bewertung, Unsicherheit, Kontrast) are rendered only in the Admin workspace.
- No new migration required; existing JSONB metadata field and its size guard are reused. No player, Scout, account, model-weight, or knowledge rows changed.
- GitHub Actions on the final PR head:
  - Node regression suite: 510/510 passed.
  - Backend JavaScript syntax: passed.
  - Full STAGING CI and Vite production build: passed; 1,640 modules transformed and build completed successfully.
- PR #49 merged only into the STAGING integration branch.
- Render STAGING deployment: `dep-dc4q1isipgvc738i6cgg`, exact deployed commit `9f03f8d29257e0304a3e21d75e865b3f7875881f`, status `live`, completed at `2026-11-27T15:25:39.943Z`.
- Runtime startup confirmed `npm start`, API listening on port 10000, Supabase server credentials present, Supabase Data API HTTP 200, OpenAI configured, Tavily configured, model `gpt-4.1-mini`.
- GitHub Actions for the deployed commit: Node tests, backend syntax, staging health smoke all succeeded; full staging CI (510/510 tests, backend syntax, Vite build) succeeded.
- Render Auto-Deploy remains intentionally disabled; future code changes require explicit STAGING deployment.
- Authenticated Admin/Scout end-to-end verification is still outstanding; no credentials or user session were impersonated. The next user-assisted check is to test Admin and Scout separately, then refresh/re-login and confirm private history restoration.
- Production branch, Render LIVE service, and production Supabase remain untouched.


## 38. Explicit private user memory — routing defect fixed and merged to STAGING — 2026-11-27

- Screenshot test exposed a real intent-routing defect: `Merke dir Staging Alpha` fell through to player research and produced an unrelated external-source response.
- PR #50 merged by squash into the STAGING integration branch. Merge commit: `37e5a7eb41250795ffc7b8b79a10eacf4a44360d`.
- New `backend/messinho-user-memory.js` recognizes explicit German/English remember commands and memory-recall questions.
- Chat route now handles remember/recall before the scouting parser, player-name extraction and external research. A memory instruction can no longer be mistaken for a player-search request.
- Up to 20 bounded notes (max 240 characters each) are stored in the existing owner-scoped `messinho_agent_memory.user_preferences.messinho_notes` JSONB field. No schema migration was needed.
- Notes are scoped to the authenticated owner; Admin and Scout do not share personal notes. Existing user preferences are preserved. Duplicate notes are refreshed and note count is bounded.
- MESSINHO reports success only after the persistent write succeeds; on storage failure it explicitly says the note was not saved.
- Recall questions such as “Welches Testwort habe ich dir genannt?” return the latest saved notes.
- Regression suite: 514/514 passed; backend syntax passed; full Vite production build passed. STAGING health check passed.
- A first test run caught two test/routing-order issues; both were corrected before merge. No failed version was deployed.
- Pending: isolated compiler-image build in the separate engineering workflow; this does not change application runtime. Authenticated Admin/Scout browser verification still requires user sessions.
- Render STAGING deployment completed: `dep-dc4s7v17lnhs739lu740`, exact deployed commit `780ec501e607088e00b1d8b5b5b8d0b8219e2b9d`, status `live`, completed at `2026-11-27T17:55:55Z`. Startup confirmed API listening on port 10000, Supabase HTTP 200, OpenAI and Tavily configured.
- Post-merge checks for the deployed commit: 514/514 tests passed, backend syntax passed, full Vite production build passed, and STAGING health check passed.
- Next: user verifies “Merke dir Staging Alpha” followed by “Welches Testwort habe ich dir genannt?” after a page refresh. Repeat independently as Admin and Scout to verify owner isolation.
- Production/LIVE and production Supabase remain untouched.


## 39. MESSINHO Conversational Intelligence 3.0 — semantic routing and adaptive memory (in development) — 2026-11-27

- User's clarified target: MESSINHO should behave like ChatGPT as a general conversational assistant, not a command parser or a dictionary of exact phrases. It must understand typos, dictation/autocorrect, fragments, context, pronouns, ordinary conversation, topic changes and follow-up questions.
- PR #51 (narrow “Merk die …” phrase patch) was closed as superseded; it is not the intended solution and was not deployed.
- New work branch: `feature/messinho-conversational-intelligence-3`.
- Added `backend/messinho-conversational-intelligence.js`: semantic intent router using structured model output. Intents: conversation, clarify, memory_save, memory_recall, scouting, general_research, engineering. The router is designed to run before fixed feature parsers, so a natural-language message cannot be sent into player research merely because of a phrase/name match.
- Added safe decision validation, bounded context packaging, role/language context, durable-memory extraction and de-duplicating merge (max 50 memories, 320 characters each; only preference/project/stable_fact/active_goal categories, confidence >=0.8). Deterministic privacy filter also blocks obvious sensitive data and credentials.
- Durable memory rules: only supported, useful, non-sensitive information; do not save credentials, secrets, transient chatter, guesses or sensitive personal data. Memory remains in owner-scoped `messinho_agent_memory.user_preferences`; no new database table or migration.
- Integrated semantic routing at the beginning of authenticated chat processing. Conversation and clarification are answered directly; memory save/retrieval is handled by the owner-scoped memory store; only clear scouting/research/engineering intents proceed to their specialized existing routes. Action intents require confidence >=0.72. If the cognitive router fails or returns invalid data, the application fails safely and does not start a search/action.
- Existing Admin/Scout authorization remains authoritative; semantic intent never grants permissions. Scouts cannot run engineering actions.
- Added tests for intent schema validation, context packaging, bounded memory, sensitive-data exclusions, mock model routing and routing order ahead of scouting/research. Latest backend syntax + test workflow: 521/521 tests passed.
- PR #52 merged into the STAGING integration branch by squash. Merge commit: `5b5417fd45ad6f79b1ba553b36db108aa6a5f83e`. CI on feature head `cf85f888501ec3bdd456a26086b5fc472239d258`: 521/521 tests passed, backend syntax passed, Vite production build passed, STAGING branch CI passed.
- Merged to STAGING source branch but not yet deployed to Render. No LIVE/Production code or database has been touched.
- Next: run complete CI and inspect failures; review the cognitive prompt, response language behavior, memory privacy, confidence thresholds and fallback safety. Then open PR into STAGING integration branch. Deploy only after CI passes and user-approved staging rollout.
- Follow-up roadmap: multi-turn conversation summaries beyond 20 turns, memory correction/deletion workflow, retrieval relevance ranking, user-visible memory controls, tool/function selection with permission gates, and evaluation suite for typo/dictation/ambiguous intent cases. Do not claim ChatGPT-level model capability; target equivalent conversational UX using current configured model and specialized MESSINHO tools.


## 40. MESSINHO Conversational Intelligence 3.0 — STAGING deployment verified — 2026-11-27

- PR #52 is merged into the STAGING integration branch; merge commit: `5b5417fd45ad6f79b1ba553b36db108aa6a5f83e`.
- STAGING branch head deployed: `a18563f7bf1a89d2702f55850fe58ef8abc84971`.
- Render STAGING service: `myscoutingdatabase-messinho-staging` (`srv-dc3chlqjnfac73acd6ig`); deployment: `dep-dc4t378u01pc73f9stjg`; status: `live`; finished at `2026-11-27T18:53:56.635Z`.
- Runtime startup confirmed API listening on port 10000, Supabase Data API HTTP 200, OpenAI configured, model `gpt-4.1-mini`.
- CI before deployment: 521/521 tests passed; backend syntax passed; Vite production build passed; STAGING branch CI passed.
- Implemented semantic intent routing for ordinary conversation, clarification, memory save/recall, scouting, general research and engineering. Handles context, typos, dictation/autocorrect, fragments and pronouns; routes before fixed feature parsers.
- Added bounded owner-scoped adaptive memory with privacy filtering and validation. Action intents below confidence 0.72 are blocked/clarified; memory extraction requires confidence >=0.8. Existing role authorization remains authoritative; Scouts cannot run engineering actions.
- No database migration was required for this release. No production branch, LIVE Render service or production Supabase resource was changed.
- **Verification boundary:** deployment and startup are verified. Authenticated browser-level Admin/Scout conversation, memory persistence/recall after refresh, and cross-account isolation have not yet been manually confirmed by the owner.
- Next user-assisted checks on STAGING: (1) “Hallo Messinho, wie geht es dir?” (2) “Merk dir bitte, dass wir gerade die neue Gesprächsintelligenz testen.” (3) “Was hast du dir gemerkt?” (4) “Und was wollten wir damit erreichen?” Then repeat memory isolation separately for Admin and Scout accounts if available.
- Follow-up engineering: expand evaluation for typos/dictation/ambiguous follow-ups; add memory correction/deletion controls and relevance ranking; evaluate long-conversation summarization; verify language-aware responses across German, English, French, Spanish, MSA Arabic, Tunisian Derja and Arabizi. Keep all work STAGING-only and deploy only with explicit approval.


## 41. MESSINHO Multilingual Grammar Engine 0.1.0 — implementation under CI review — 2026-11-27

### Owner request and decision
- Owner explicitly requested a dedicated grammar layer for every supported language profile and approved starting implementation.
- Accepted scope: German, English, French, Spanish, Modern Standard Arabic (MSA), and Tunisian Derja (Arabic script and Arabizi).
- Grammar is a separate, language-specific analysis layer connected to the existing Linguistic Intelligence pipeline. It must not treat Tunisian Derja as incorrect MSA.

### Implementation on isolated STAGING work branch
- Work branch: `feature/messinho-multilingual-grammar`.
- Base integration branch: `feature/messinho-unified-ai-integration`.
- New `backend/messinho-grammar-engine.js` provides bounded, explainable structural analysis: sentence type, article/pronoun/finite-verb/conjunction signals and selected language-specific patterns.
- Existing `backend/messinho-linguistic-intelligence.js` attaches grammar evidence to language analysis and adds prompt policy requiring evidence-based interpretation, preserving source wording, and respecting Derja as its own dialect grammar.
- New `tests/messinho-grammar-engine.test.js` covers the six profiles, selected agreement/negation patterns, safe insufficient-input states and pipeline integration.
- No database migration, persistent language-knowledge write, external dictionary import, model-weight update, player/scout/account change, or production resource change.

### Truthful limitations
- This is an initial deterministic heuristic engine, not a full syntactic parser, complete grammar textbook, or proof of grammatical correctness.
- Findings are evidence hints with bounded confidence. No automatic rewriting/correction is performed.
- More complete coverage requires reviewed examples and language-specific regression suites, especially verb morphology, agreement, tense/aspect, case, word order, dialect variation and code-switching.

### Review and verification
- Pull request: #56 — https://github.com/Dridi06/myScoutingDatabase/pull/56
- Head commit at PR creation: `9ee7757d3365eaa818fa37d3b01edd2d69edb82c`.
- PR targets only `feature/messinho-unified-ai-integration`; it is not merged and not deployed.
- GitHub Actions for Node tests, backend syntax and STAGING branch CI were queued at handover. Record final results before merge.
- Render STAGING auto-deploy is disabled. No deployment has been triggered.
- Production branch `main`, production Render service and production Supabase remain untouched.

### Next steps
1. Inspect all CI results and fix every genuine regression.
2. Expand tests for each grammar family and Arabic/Derja orthographic variants.
3. Review prompt/context size and ensure Admin/Scout output does not leak internal diagnostics.
4. Merge to the STAGING integration branch only after CI passes and the owner approves.
5. Deploy the exact verified commit to the dedicated STAGING Render service only after explicit approval; then verify health and authenticated Admin/Scout behavior.


### CI verification addendum — 2026-11-27
- First test run found one weak Spanish integration fixture: the sample was too short for the conservative six-language detector and correctly returned ambiguous. The test fixture was replaced with an established longer Spanish sample; detection thresholds and production logic were not weakened.
- Final tested code commit: `a53ec1992301018d4954556c88f01495eff37759`.
- GitHub Actions results for that exact code commit:
  - MESSINHO Node tests: success — 531/531 passed, 0 failed.
  - MESSINHO backend syntax: success.
  - MESSINHO staging branch CI: success — regression suite, backend syntax and Vite production build completed successfully.
- The PR remains open and unmerged. Render STAGING has not been redeployed; the current live deployment is unchanged.


### Post-merge STAGING integration checkpoint — 2026-11-27
- PR #56 was squash-merged into `feature/messinho-unified-ai-integration` after CI passed.
- STAGING integration merge commit: `644270a84b7419007c9a7fe6f98e3a6c967246d5`.
- Verified code commit before the documentation-only checkpoint: `a53ec1992301018d4954556c88f01495eff37759`.
- CI for that exact code commit: 531/531 Node tests passed; backend syntax passed; full STAGING branch CI and Vite production build passed.
- Render STAGING service remains on its prior deployment: `dep-dc4t378u01pc73f9stjg`, commit `a18563f7bf1a89d2702f55850fe58ef8abc84971`, status `live`.
- No new Render deployment was triggered. Auto-Deploy remains disabled. The grammar engine is merged to the STAGING source branch but is not yet running in the STAGING web service.
- Production `main`, production Render service and production Supabase remain untouched.
- Next: obtain explicit owner approval for a STAGING-only Render deployment, deploy the exact merged integration commit, then verify health and authenticated Admin/Scout chat behavior. Continue expanding language-specific grammar coverage after runtime verification.


### STAGING deployment completed — 2026-11-27
- Owner approved deployment to the dedicated STAGING Render service only.
- Service: `myscoutingdatabase-messinho-staging` — https://myscoutingdatabase-messinho-staging.onrender.com
- Render deploy: `dep-dc4v78e1egvs73a004ug` — status `live`.
- Deployed integration branch commit: `b0372754a56ddd5b02aa29929d035ad5a2712253` (includes merged grammar engine and checkpoint documentation).
- Build completed successfully; 531/531 automated tests passed in the Render build; Vite production bundle completed; Node API started and logged listening on port 10000; Render reported “Your service is live”. Supabase Data API startup check returned HTTP 200.
- Deployment was manually triggered because Render auto-deploy is disabled. No cache clear was used.
- Production/LIVE service, production branch and production Supabase were not changed.

### Database warning investigated and classified — 2026-11-27
- The earlier `MESSINHO language knowledge lookup unavailable: 42P01` line was emitted by the Render **build/test process**, not evidence of a live application request. It is the expected console warning from the regression test named `database errors fail closed without fabricated entries`, which deliberately injects a fake Supabase error object `{code:'42P01'}` and asserts that the lookup returns `status:'unavailable'` with an empty result.
- Inspected `tests/messinho-language-knowledge.test.js` and confirmed the warning is generated by this explicit negative-path test.
- Independently inspected the dedicated STAGING Supabase project `nwqwnrhupbyhshsprxjt`: `public.messinho_language_knowledge` exists, RLS is enabled, the table contains 84 rows across six language profiles, and the migration history includes the four language knowledge/curriculum migrations.
- A direct read-only SQL verification against STAGING returned `to_regclass('public.messinho_language_knowledge') = messinho_language_knowledge`, `row_count = 84`, `language_count = 6`.
- Per-language read-only breakdown: 14 entries per profile for `de`, `en`, `fr`, `es`, `ar` (MSA), and `ar-tn` (Tunisian Derja); all 14 entries in each profile are active and each profile has all four entry types (`grammar`, `lexicon`, `pragmatics`, `conversation`).
- Conclusion: no missing-table defect has been established. No migration or database modification was necessary or performed. The prior warning must not be treated as a production/runtime incident.
- Deployment remains live. Authenticated Admin/Scout browser-level conversation and retrieval verification is still outstanding. Production/LIVE remains untouched.


## 2026-11-27 — MESSINHO Linguistic Intelligence 1.4.0: Cross-language semantic frames
- Implemented in `backend/messinho-linguistic-intelligence.js` and merged via PR #57 from `feature/messinho-semantic-frames` into `feature/messinho-unified-ai-integration`.
- Version advanced from 1.3.9 to 1.4.0.
- Added bounded, explainable cross-language concept evidence for player readiness, performance quality, development, capability and availability across German, English, French, Spanish, Modern Standard Arabic and Tunisian Derja.
- Added segment-level evidence frames that preserve the original segment text and language boundaries. Negation/qualification, uncertainty and contrast remain separate evidence dimensions; no absolute player verdict is generated from a single cue.
- Exposed `semantic_frames` and `semantic_summary` through the stable linguistic response metadata so downstream chat orchestration can consume the evidence.
- Added explicit limitations: lexical/discourse evidence only; not a full semantic parser, not reference resolution, and not a reliable full clause-level negation-scope parser.
- Regression coverage added for all six language profiles, qualified evaluation and English/French code-switching.
- CI on PR #57: 536/536 Node tests passed; backend syntax and production-build workflow passed; dedicated backend-syntax check passed.
- No database migration or write was needed; the existing 84 language knowledge rows remain unchanged.
- PR #57 merged by squash as commit `22842c9cafd47dbd1f7492e2d98f57e87ba7b1dc` into the STAGING integration branch.
- Render auto-deploy remains disabled. This change is merged to the STAGING source branch but has **not** yet been manually deployed to the STAGING service. Production/LIVE remains untouched.
- Next: deploy this exact integration-branch commit to Render STAGING after deployment authorization, then run authenticated Admin/Scout end-to-end checks for all six profiles, code-switching, negation scope, follow-up clarification, and response-language continuity. Continue by improving clause-level scope and reference resolution only after the current behavior is measured.

## 2026-11-27 — MESSINHO Dialogue Engine 1.0.0 — STAGING feature branch

### Goal
- Strengthen the existing Conversational Intelligence 3.0 without creating a parallel chatbot, second memory store, or replacement for the existing authenticated chat route.
- Preserve the existing semantic cognitive router, owner-scoped conversation history, approved memory store, language intelligence, and Admin/Scout permission enforcement.

### Implementation
- New module: `backend/messinho-dialogue-engine.js`.
- New tests: `tests/messinho-dialogue-engine.test.js`.
- The bounded extractive state builder packages:
  - likely follow-up signals in the current message;
  - whether the last assistant turn appears to contain an unanswered question;
  - a short-answer-to-pending-question signal;
  - the previous user message and previous assistant message;
  - the latest substantive user-goal candidate;
  - up to four recent user-focus messages;
  - the current response-language hint.
- Integrated into `POST /api/agent/chat` by attaching `dialogue_state` to the already-existing linguistic context passed to `classifyMessinhoTurn`.
- Updated the cognitive-router prompt to use these fields only as bounded continuity evidence. It must not treat a candidate referent as a fact; ambiguous references should trigger one focused clarification.
- No new database table, migration, persistent memory behavior, provider call, permission, external action, or model-weight change.

### Safety and limitations
- History remains loaded using the existing authenticated `owner_id` and `conversation_id` filters.
- Only sanitized user/assistant text from the bounded recent history is included; no research-context payload is copied into the dialogue snapshot.
- Dialogue state is transient and extractive. It does not independently resolve pronouns, infer player identity, or authorize actions.
- Admin/Scout authorization remains authoritative; Scout engineering restrictions are unchanged.
- Work branch: `feature/messinho-conversation-engine`.
- PR #58: https://github.com/Dridi06/myScoutingDatabase/pull/58 (draft, targets `feature/messinho-unified-ai-integration`).
- No database changes, Render deployment, production branch changes, LIVE changes, or production Supabase access.
- CI is being rerun after correcting the regression fixture for a new-topic request following an assistant question. Record final results for the exact final PR head before merge.

### Extended-context milestone — long conversations
- Extended the authenticated chat's bounded history window from 20 to 60 messages (up to 30 user/assistant exchanges) while preserving the existing owner/conversation filters.
- Updated `sanitizeMessinhoHistory` with an optional bounded limit (default remains 20 for all existing callers); the chat route explicitly requests 60.
- The Dialogue Engine now keeps the latest 12 turns as recent context and creates a small extractive older-context bundle from the preceding window:
  - up to three older user-goal candidates;
  - up to two historical assistant questions, explicitly labelled historical rather than pending.
- Obvious sensitive older excerpts are excluded from this additional summary. No older messages are promoted to facts or durable memory.
- Added regression coverage for long-history continuity, privacy filtering, bounds and server query integration.
- Final tested code commit: `369996bd901571b7d0e3568dad38f8c973941132`.
- Exact-commit GitHub Actions: Node tests **544/544 passed**; backend syntax + test workflow passed; complete STAGING branch CI passed including Vite production build.
- The later documentation-only commit does not change the tested code.
- PR #58 remains draft and unmerged. No Render deployment or database changes were performed.

### Response-integrity milestone — unverified action claims
- Added `backend/messinho-conversation-response-guard.js` and `tests/messinho-conversation-response-guard.test.js`.
- Ordinary `conversation` replies are checked for empty output and first-person claims that a system mutation (save/create/delete/update/deploy/fix/install/execute, etc.) has already been completed.
- The guard recognizes German, English, French and Spanish action-claim forms and applies sentence-scoped negation checks so statements such as “not deployed yet” are not blocked.
- A blocked reply is replaced with a plain-language response that does not expose internal guard diagnostics. This guard runs only for ordinary conversation replies; verified scouting/research and server-mediated memory/engineering flows retain their existing handling.
- No tool is executed by the guard and no action is ever marked complete by it.
- Final tested code commit: `49f41d614e1da2faac77ef47ef9dabb26fa55e65`.
- Exact-commit CI: **550/550 Node tests passed**; backend syntax passed; full STAGING branch CI passed including Vite production build.
- PR #58 remains draft and unmerged. No Render deployment, database migration, or production/LIVE change.


## 2026-11-27 — MESSINHO Dialogue Engine 1.1.0 — follow-up precision

- Extended `backend/messinho-dialogue-engine.js` with an explicit, bounded `follow_up_signal`: `none`, `discourse_connector`, `referential_question`, `short_reply`, or `pending_question_reply`.
- Reduced false-positive follow-up classification: a generic new question such as “Wie funktioniert das Steuersystem?” is not considered a follow-up merely because it begins with an interrogative or contains a German article.
- Added explicit continuation cues for Spanish inverted question punctuation and Tunisian Derja/Arabizi examples; short acknowledgements are prioritized over overlapping connector cues.
- Added regression tests for new-topic questions, referential follow-ups, short replies, Spanish transitions, and Arabizi cues.
- The signal remains contextual evidence only. It does not resolve a player identity, assert a fact, persist memory, or authorize an action.
- No database changes, migrations, permission changes, external actions, Render deployment, or production changes.
- Final tested code commit: `1ddfde7c59b2bd916c6fe28cf36be95034f74071`; checkpoint commit: `b32492fb2c2044c807e664877479652f783d0ed2` (documentation-only after the tested code).
- GitHub Actions for the checkpoint commit: **553/553 Node tests passed, 0 failed**; backend syntax workflow passed; full STAGING branch CI passed, including the Vite production build (1,640 modules transformed).
- PR #58 remains Draft and unmerged. No Render deployment or database migration was performed.


## 2026-11-27 — MESSINHO Conversation Engine — Block 2: evidence-bounded entity reference resolution

### Scope and implementation
- Added `backend/messinho-entity-resolution.js` (version 1.0.0) as a deterministic, transient resolver connected to the existing Dialogue Engine and cognitive router.
- The resolver distinguishes `player`, `club`, and `team` references and returns explicit `resolved`, `ambiguous`, `unresolved`, or `not_applicable` outcomes with bounded candidates, confidence, evidence labels, and reason codes.
- Candidate sources are restricted to structured research metadata already stored in the authenticated conversation history and the current owner's `active_entities` memory. It does not search arbitrary users, organizations, or global player records.
- Player-to-club/team relations are used only when the relationship is present in structured player metadata.
- Supports bounded reference cues in German, English, French, Spanish, Modern Standard Arabic and Tunisian Derja.
- Ambiguous references such as multiple players or an unclear “der andere” trigger a focused clarification. A contrast can resolve only when exactly one active player and exactly one alternative are grounded.
- Explicitly named multiple players are not treated as an unresolved pronoun. When a pronoun appears alongside another explicit player name, the resolver asks for clarification rather than assuming which player was intended.
- Added safe structured entity metadata to `sanitizeMessinhoHistory`; only allowlisted IDs, names, current club/team relations and entity types are retained. Arbitrary metadata fields are discarded.
- Updated the authenticated chat response context to persist the allowlisted structured entities when present, then attach the transient resolution result to the existing `dialogue_state`.
- Updated the cognitive-router prompt to treat entity resolution as evidence only, never as a verified fact, permission, or action authorization.
- Added a deterministic routing guard: unresolved/ambiguous scouting references cannot silently start a player search.
- Existing owner and conversation filters remain unchanged. The resolver is not a new memory store and does not persist its own output.

### Files changed
- `backend/messinho-entity-resolution.js` — new resolver.
- `tests/messinho-entity-resolution.test.js` — regression tests for unique/multiple/unresolved references, player-to-club relations, explicit names, contrast, five language examples, bounds, sanitizer and owner scope.
- `backend/messinho-engine.js` — allowlisted structured entity metadata in sanitized history.
- `backend/messinho-conversational-intelligence.js` — safe interpretation policy for entity-resolution evidence.
- `backend/server.js` — authenticated chat integration and clarification guard.
- `.github/workflows/messinho-tests.yml` and `.github/workflows/messinho-staging-ci.yml` — include the conversation-engine branch in push CI triggers.

### Checkpoint and verification
- Work branch: `feature/messinho-conversation-engine`.
- PR #58 remains Draft and unmerged; target remains `feature/messinho-unified-ai-integration`.
- Latest resolver logic commit: `01d918d125a0ed5af950f117288ebf17fda6ba2a`.
- Latest regression-test commit: `406c861891de59a169daf5e7314462048318bc80`.
- CI trigger updates: `05596bc37b653c32dc9922fb4efbcf62f37e15e4` and `e6840339a02d099d47e68ef4a10c1c71fe53812f`.
- Earlier Dialogue Engine baseline remains 553/553 tests on commit `b32492fb2c2044c807e664877479652f783d0ed2`; that result does not verify this new block.
- **Current Block 2 CI status: not yet verified.** The GitHub workflow/status lookup has not returned a run for the new head. Do not describe the new tests as passed until a run for the exact final commit is available.
- No Render deployment, no Supabase migration, no database writes, no user/player/scout data changes, no model-weight changes, and no production/LIVE changes.

### Known limitations and next actions
1. The resolver only resolves entities already represented in structured conversation metadata or active owner memory; it does not yet extract arbitrary named entities from free text or independently query the player database.
2. Club/team follow-ups are resolved as references, but a complete club/team research workflow is a separate capability integration.
3. Review the exact latest CI run and fix all failures before marking Block 2 verified.
4. Continue with Block 3 — robust multi-turn conversation state and clarification lifecycle — only after Block 2 passes exact-commit CI.
5. The latest main-branch language-bridge commits are not copied into this feature branch; evaluate and integrate them separately without merging or changing production.


### Block 2 CI verification — 2026-11-27
- Final tested code commit: `c0d7ac126a4df4f2e326c7b3ea608aab6cd89943`.
- GitHub Actions for that exact code commit:
  - MESSINHO Node tests: **564/564 passed, 0 failed**.
  - Backend JavaScript syntax: **success**.
  - Full STAGING branch CI: **success** — regression suite, backend syntax and Vite production build completed; 1,640 modules transformed and build completed in 1.79 seconds.
- The first CI attempt correctly exposed two issues: the accented Spanish pronoun `él` was not matched by JavaScript's ASCII-style word boundary, and an apostrophe in the single-quoted cognitive-router prompt caused a syntax error. Both were corrected; the test was not weakened and the prompt retains the original clarification contract.
- The exact final code commit is verified. The subsequent PROJECTSCOUT documentation checkpoint is documentation-only.
- PR #58 remains Draft, open and unmerged. No Render deployment, Supabase migration, database write, production/LIVE change or model-weight change was performed.
- Next: begin Block 3 only after confirming the PR head and preserving this verified checkpoint.


## 2026-11-27 — Block 3 checkpoint: multi-turn clarification lifecycle

### Implemented on the feature branch
- Extended `backend/messinho-dialogue-engine.js` to version 1.2.0.
- Added bounded pending-question extraction: question text, question kind, and up to four offered options.
- Added `classifyMessinhoClarificationReply` with explicit states: `none`, `likely_answer`, `ambiguous`, `candidate_answer`, and `new_topic`.
- Recognizes exact offered-option answers, numeric answers for suitable question types, short confirmations, short free-text answers and new questions that should not be forced into the previous task.
- Question kinds include player reference, target level, location, age, position, preferred foot, quantity, club/team, choice, yes/no and generic.
- Option matching is intended to support German, English, French, Spanish and Arabic examples; Tunisian Derja remains covered by the broader language cues and needs additional dedicated lifecycle tests.
- Cognitive-router prompt now instructs MESSINHO to preserve the previous goal/filters for likely answers, ask one focused question for ambiguous replies, and avoid forcing new topics into pending tasks. A clarification signal alone never authorizes an action.
- Added regression tests for exact options, age numbers, unlisted options, topic changes, confirmations, multilingual option choices, free text and router policy.

### Files changed
- `backend/messinho-dialogue-engine.js`
- `backend/messinho-conversational-intelligence.js`
- `tests/messinho-dialogue-engine.test.js`

### Save and verification status
- Work branch: `feature/messinho-conversation-engine`.
- PR #58 remains Draft and unmerged.
- Latest Block 3 test commit: `23aa8453a549797390dae95615f8e025a8b80f07`.
- Dialogue Engine implementation commits: `6dd68d35ea3433ed4a622ebd09fe96631d25f84b` and `e0d124dacd21e53fe73428e3b68f911b09df7999`.
- Cognitive-router clarification policy commit: `713c33a50917f3b2d15ce50e7c24397cf4bf304b`.
- **Block 3 initial CI on test commit `23aa8453a549797390dae95615f8e025a8b80f07`: 569/573 tests passed; 4 failed.** The backend syntax check itself passed, but the syntax workflow runs `npm test` afterwards and therefore concluded failure. The full STAGING CI run was cancelled after the test failures. Block 3 is saved but not verified/release-ready. Block 2's 564/564 passing result applies only to its previously verified code commit and must not be attributed to Block 3.
- Four failures are documented for correction: a short acknowledgement (`genau`) was classified as a discourse connector rather than a short reply; offered-option question kind was classified as generic `choice` rather than `location`; an age question was classified as generic rather than `age`; and a long free-text clarification was accepted as a likely short answer rather than a candidate requiring semantic review.
- No Render deployment, Supabase migration, database write, production/LIVE change or model-weight change.

### Next actions
1. Run and inspect CI on the exact current branch head; fix any failures without weakening the tests.
2. Review pending-question extraction for multi-question assistant messages, negated questions and Arabic/Derja option segmentation.
3. Ensure the clarification result is passed through the existing authenticated chat pipeline and used to preserve the actual prior scouting filters; do not silently infer filters that are absent.
4. Add a dedicated Derja clarification-answer test matrix.
5. Update PR #58 and this checkpoint with the exact verified code commit before declaring Block 3 complete.


---

## 16. MESSINHO conversation engine — Block 3 verified checkpoint (2026-11-27)

This entry supersedes the earlier Block 3 status that recorded four failing clarification-lifecycle tests. The four regressions have been corrected and the final branch head has passed the repository CI workflows.

### Block 3 — Multi-turn Clarification Lifecycle 1.2.0

- **Branch:** `feature/messinho-conversation-engine`
- **PR:** #58 — https://github.com/Dridi06/myScoutingDatabase/pull/58
- **PR state:** Open, Draft, unmerged; target branch `feature/messinho-unified-ai-integration`.
- **Final tested code/test commit:** `c7e8fdacdfd74e4a0b8da1d690eb8c8ee479a3b2` (runtime code changes are included in this tested PR head).
- **Final runtime code fix:** `d7c83b75d389ef74b7a97b9e55846624f66a42db`
- **Dialogue-engine code baseline before the final Derja precedence fix:** `b64c7036e0b0ed27d35402291b3efb6a544fddec`
- **Final regression-test commit:** `c7e8fdacdfd74e4a0b8da1d690eb8c8ee479a3b2`
- **Current feature-branch HEAD after documentation-only checkpoint:** `8e28486bcc75ede7c40df85511ffb5f287a76d47`.

### Corrections completed

1. **Short acknowledgements:** exact acknowledgements such as `Genau.` and Tunisian Derja `باهي`, `إي`, and `لا` are classified as `short_reply`, not intercepted by the discourse-connector pattern.
2. **Location questions:** semantic location cues and country choices (including Arabic country names) are classified as `location` before the generic multi-option `choice` fallback.
3. **Age questions:** age-related wording is recognized as `age`, allowing numeric answers such as `21 Jahre` or `20` to be treated as candidate answers to the pending age question.
4. **Long free-text answers:** natural-language answers longer than eight words are held as `candidate_answer` / `free_text` for semantic review rather than being prematurely reduced to `short_value`.
5. **Regression coverage:** added tests for the four original failure modes and Tunisian Derja acknowledgements, location answers and age clarification.

### Final CI verification

All checks below ran against the final PR branch head `c7e8fdacdfd74e4a0b8da1d690eb8c8ee479a3b2`:

- **MESSINHO Node tests:** 578 passed, 0 failed.
- **Backend syntax workflow:** successful; all configured syntax checks and its Node test run passed.
- **Full MESSINHO staging branch CI:** successful.
- **Full regression suite in staging CI:** 578 passed, 0 failed.
- **Vite production build:** successful; 1,640 modules transformed; build completed in 1.80 seconds.

### Safety and release boundary

- No database migration or persistent-data modification.
- No Render deployment or staging/live runtime activation.
- No production branch, production Supabase, or LIVE service changes.
- PR #58 remains Draft and unmerged. Do not merge or deploy without the owner's explicit approval.

### Next development step — Block 4

Continue with end-to-end clarification continuity in the existing authenticated chat pipeline:
1. Trace `dialogueState.continuity.clarification_reply` through the real chat route into the cognitive router and task/scouting parser.
2. Verify that a confirmed clarification answer preserves the previous scouting goal and its already established filters, without inventing missing filters.
3. Verify that ambiguous answers ask one focused question and new-topic messages are not forced into the previous task.
4. Add end-to-end tests for multiple assistant questions, negated questions, option segmentation, Arabic/Derja variants, and owner/conversation isolation.
5. Keep all work on the feature branch; do not merge or deploy without explicit approval.

### New-chat handover

Read this file from the current feature branch and inspect its latest HEAD and PR #58 state before making further changes. Block 3 is verified complete; resume at **Block 4 — end-to-end clarification continuity**.


## 2026-11-27 — Block 4 implementation checkpoint: End-to-End Clarification Continuity

### Verified baseline and findings
- PR #58 is Open, Draft and unmerged; head branch `feature/messinho-conversation-engine`, base `feature/messinho-unified-ai-integration`.
- Exact PR head before Block 4: `b7a49d8684d7d5b4ab82ed2b36b54f56b925ac40`; PR #58 is 74 commits ahead of its integration base and 0 behind.
- Block 3 exact-head CI: Node tests, backend syntax and full STAGING CI all completed successfully.
- The authenticated chat route already attached `dialogue_state` to the cognitive router, but the resulting clarification status was not consumed by the deterministic scouting parser. The parser relied on broad recent user history and a text heuristic for a pending question; it could therefore lose a goal/filter or combine unrelated turns.
- The previous parser call did not have an explicit, typed continuation object, and the router had no auditable task-goal/filter bundle.

### Block 4 implementation added
- Added `backend/messinho-clarification-continuity.js`, a transient, bounded bridge from dialogue-state classification to the existing scouting parser.
- Carries the exact previous scouting goal plus the user's subsequent clarification answers; it does not invent filters.
- Accumulates multiple turns (e.g. original player/position/age goal → country → league) and supplies only the task-scoped user messages to the parser.
- Detects new topics and explicitly supplies no previous parser history, preventing old search filters from leaking into a new task.
- Ambiguous/unlisted answers and long free-text candidate answers are action-blocked until clarified or semantically resolved; negated yes/no questions are conservatively clarified rather than inverted.
- Supports matching Arabic/Tunisian Derja option text from the actual pending question and bounded option segmentation.
- Attaches the continuity result to the existing dialogue state passed to the cognitive router and uses the effective goal/answer context in the real `parseMessinhoScoutingRequest` call.
- Added tests for multiple assistant questions, multi-turn filter retention, new-topic isolation, negated questions, option segmentation, Arabic/Derja, and unrelated task separation.
- No new table, migration, persistent memory, external provider, permission grant, or model-weight change.

### Verification status
- Implementation has been committed to the feature branch only.
- CI results for the new exact commit must be recorded before Block 4 is called complete.
- No Render deployment has been triggered. No LIVE/Production branch, service or database was changed.
- PR #58 remains Draft and unmerged; no merge or deployment without the owner's explicit approval.


### Block 4 — follow-up hardening (2026-11-27)
- Fixed a context-isolation edge case: a newer explicit non-scouting topic (e.g. a tax question) now terminates the search-goal scan instead of allowing an older scouting goal to be reused.
- Corrected the comma/slash option test to exercise the actual pending question and its offered options.
- PR head and feature branch are being reconciled after the latest file commits; do not mark the block complete until the exact current head has green CI and runtime integration tests.

- Re-verified the real chat history loader: it loads the latest 60 messages scoped by both `owner_id` and `conversation_id`, then sanitizes them before the router and continuity bridge receive them.
- Added a regression assertion against that exact history-loader block rather than a different conversation endpoint.


### Block 4 — End-to-End Clarification Continuity: implementation checkpoint (2026-11-27)

#### End-to-end path verified
- The real chat endpoint loads the latest 60 messages from `messinho_conversation_messages`, scoped by both `owner_id` and `conversation_id`, then sanitizes the history before routing.
- `buildMessinhoDialogueState` classifies the current reply against the pending assistant question.
- `buildMessinhoClarificationContinuity` receives the actual interpreted message, scoped conversation history and dialogue state.
- The resulting continuity object is attached to `dialogueState.continuity.clarification_continuity`, which is passed to `classifyMessinhoTurn` as part of `linguistic_context.dialogue_state`.
- On a confirmed clarification reply, the real deterministic scouting parser receives the original task goal plus accumulated answers and only task-scoped user history.
- On a new topic, the parser receives the new message and an empty prior-history context; previous scouting filters are not carried forward.
- Ambiguous or unlisted replies remain action-blocked. The continuity module does not authorize actions or persist untrusted dialogue data as durable memory.

#### Automated regression coverage
- Added unit and composition tests for unique option matching, multiple assistant questions, accumulated filters, unrelated-topic boundaries, negated questions, Arabic/Tunisian Derja, comma/slash option lists, and owner/conversation-scoped history.
- Added a composed end-to-end test that runs the actual dialogue engine → continuity bridge → cognitive-router message builder → scouting parser path.
- Added a new-topic end-to-end test confirming that old scouting country and league filters do not leak into a general question.
- GitHub Actions on exact tested code head `057df8c6e28faee66bf30ca77d4f451340933453`:
  - MESSINHO Node tests: **591/591 passed**, 0 failed.
  - Backend syntax workflow: passed; `server.js`, agent core and orchestrator syntax checks succeeded, including full `npm test`.
  - STAGING branch CI: passed; regression suite, backend syntax and Vite production build succeeded.
- An earlier CI run exposed stale test assumptions about the parser call signature and a missing pending-option handoff for multiple assistant questions. Those issues were fixed; the exact tested head above is green.

#### Remaining release gate
- Block 4's code-level end-to-end path and automated regression suite are green.
- A STAGING runtime smoke test against the deployed authenticated chat endpoint and its real conversation storage remains the final operational verification before declaring Block 4 fully complete.
- No deployment was triggered by this work. LIVE/Production remains untouched. PR #58 remains Draft and unmerged; no merge or deployment without explicit owner approval.


## 21. Owner-approved direction — Universal Conversational Intelligence — 2026-11-27

### Product decision
- **Owner goal:** MESSINHO must feel like a natural two-person conversation. The user should be able to write or ask freely, including statements, follow-ups, disagreement, jokes, ordinary questions, incomplete phrases, typos, and topic changes. The system must not behave primarily like a fixed command parser or form.
- **Accepted architecture direction:** Build a central conversational intelligence core first; connect memory, linguistic intelligence, knowledge retrieval, reasoning, research, scouting capabilities, and autonomous agent execution behind it.
- **Training decision:** Do not block useful conversational capability on training a model from scratch. Use a replaceable capable model provider initially; develop MESSINHO's own memory, knowledge, orchestration, evaluation, and provider abstraction now. Build a controlled training pipeline over time from approved, privacy-safe examples and verified outcomes. Training must be versioned, evaluated against holdout tests, and never auto-promote model weights.
- **Provider independence:** Hosted OpenAI-compatible and self-hosted OpenAI-compatible model endpoints should be configurable. The provider is a language/reasoning motor, not the owner of MESSINHO's permissions, data, evidence, memory policy, or agent actions.
- **Existing work preserved:** Linguistic intelligence, grammar, language knowledge, dialogue state, clarification continuity, entity resolution, memory, capability runtime, research/evidence, and agent orchestration remain components of the target system; they are not replaced by a greeting dictionary or another isolated chat.

### Diagnostic finding
- The 2026-11-27 STAGING chat test reached the API and persisted the message, but the semantic model call returned `provider_error`.
- Render startup logs confirmed `OPENAI_API_KEY` was configured and model name `gpt-4.1-mini` was selected; this does not prove that the key, model entitlement, request format, or provider request was accepted.
- The previous log omitted HTTP status and provider error code, so the exact cause was not observable. The new runtime returns bounded provider status/error codes and server logs record HTTP status plus error code without logging secrets.
- The deterministic greeting shortcut was removed: greetings and all other ordinary messages now use the same conversational model path. A hard-coded greeting response is not considered conversational intelligence.

### Implementation started on `feature/messinho-conversation-engine`
1. Added `backend/messinho-model-runtime.js`:
   - Provider-neutral OpenAI-compatible chat-completions adapter.
   - Configurable `MESSINHO_MODEL_BASE_URL`, `MESSINHO_MODEL_API_KEY`, and `MESSINHO_MODEL_NAME`, with backward-compatible `OPENAI_*` defaults.
   - Supports hosted or self-hosted endpoints using the OpenAI-compatible protocol.
   - Retries with JSON-object response mode only when a provider rejects JSON Schema response format.
   - Bounded failure diagnostics; never returns or logs credentials.
2. Updated `backend/messinho-conversational-intelligence.js`:
   - Uses the provider-neutral runtime instead of a hard-coded OpenAI URL.
   - Natural conversation is explicitly prioritized over command parsing; ordinary statements, opinions, disagreement, jokes, emotion, follow-ups, and topic changes must receive natural responses.
   - Invalid JSON/model output is distinguished from network/provider failures.
3. Updated `backend/server.js`:
   - Reads the new provider configuration variables while preserving existing OpenAI configuration.
   - Removed the special hard-coded greeting bypass; every greeting now reaches the same conversation intelligence path.
   - Provider failure diagnostics include HTTP status and error code, not secret values.
4. Updated `tests/messinho-conversational-intelligence.test.js`:
   - Provider endpoint configuration, local endpoint support, JSON Schema compatibility fallback, safe provider error diagnostics, natural-conversation prompt behavior, and shared greeting path.
   - Existing malformed model-output expectation updated to the explicit `invalid_output` status.

### Roadmap / release gates
1. Complete provider runtime and conversational core tests; verify GitHub CI.
2. Deploy only the tested feature branch to STAGING; verify the exact deployed commit.
3. Diagnose the actual provider rejection from the newly exposed HTTP status/error code; fix the provider configuration or compatibility issue based on evidence, not guesses.
4. Run authenticated conversation smoke tests covering greetings, ordinary statements, follow-up questions, disagreement, topic changes, typos, German/English/French/Arabic/Derja, and general factual questions.
5. Connect grounded knowledge retrieval and permitted research as optional tools selected by the conversational core; keep source provenance and uncertainty visible.
6. Strengthen conversation memory with owner/conversation isolation, bounded context, durable summaries, and explicit privacy controls.
7. Add reasoning/tool orchestration with action permissions, confirmation gates, budgets, timeouts, audit logs, and safe retries.
8. Build the controlled training/evaluation pipeline: approved conversation examples, data cleaning and privacy review, train/validation/holdout splits, baseline comparisons, regression/safety tests, versioned candidate models, and administrator approval before activation.
9. Only later evaluate self-hosted inference and a custom-trained model against quality, latency, operating cost, privacy, and hardware requirements.

### Current status at checkpoint
- Implementation commit: `fc9ef66e573cc502aa6d61ed4b0401de24eef5a3`.
- GitHub Actions on that code commit: MESSINHO Node tests — success (594/594); backend syntax — success; full STAGING branch CI including regression suite and Vite build — success.
- Render STAGING service `myscoutingdatabase-messinho-staging`, service ID `srv-dc3chlqjnfac73acd6ig`, deployment `dep-dc50khm1egvs73a4qcpg`: status `live`, commit `fc9ef66e573cc502aa6d61ed4b0401de24eef5a3`, completed `2026-11-27T22:55:48Z`.
- Runtime start logs confirm `node backend/server.js`, API listening on port 10000, OpenAI model configuration detected, and Supabase Data API HTTP 200.
- **Not yet verified:** an authenticated live chat response through the new provider runtime. The previous test produced `provider_error`; use the newly added HTTP status and provider error code after the owner sends a test message to identify the exact provider-side cause.
- No merge, no production deployment, no Supabase schema migration, no player/user data mutation, and no model training/weight changes were performed by this work.
- Pull Request #58 remains open, Draft, and unmerged.
- No merge, no production deployment, no Supabase schema migration, no player/user data mutation, and no model training/weight changes were performed by this work.
- Pull Request #58 remains open and unmerged.


## 22. Block 2 — Linguistic knowledge integrated into the cognitive turn — 2026-11-27

### Objective
Make the existing approved grammar, vocabulary, pragmatics and conversation knowledge available to the same semantic turn that understands the user's message, rather than loading it only in a legacy response path.

### Implementation
- `backend/messinho-conversational-intelligence.js`
  - `buildMessinhoCognitiveRouterMessages` now accepts `linguisticKnowledgeContext`.
  - Adds a bounded list of up to 8 approved language entries to the cognitive input.
  - Explicitly instructs the model to use entries only when relevant, match each entry to its own language segment, and never transfer grammar or vocabulary between languages.
  - Treats examples as illustrative, not fixed response templates.
- `backend/server.js`
  - Loads language knowledge through the existing first-party, active-entry-only lookup before semantic cognitive routing.
  - Passes the formatted entries into `classifyMessinhoTurn`.
  - Reuses the same lookup result for response metadata; avoids querying the language knowledge base twice in one turn.
- `tests/messinho-conversational-intelligence.test.js`
  - Verifies German and Tunisian Derja entries both reach the same cognitive turn while preserving their language identifiers.
  - Verifies the prompt explicitly prevents cross-language grammar/word transfer.
  - Verifies server ordering: language knowledge is loaded before semantic routing and passed into the cognitive turn.

### CI and code verification
- Tested implementation commit: `3437646ebf0d19524801ad8d7d2df0119c65f36a`.
- MESSINHO Node tests: success.
- Backend syntax: success.
- Full STAGING branch CI including regression suite and Vite production build: success.
- An intermediate test commit `56d27faf` correctly failed because the new regression assertion caught that the language lookup had not yet been moved before routing. The lookup was moved to the correct location; commit `3437646e` passed all three workflows.

### Deployment gate
- Render STAGING deployment `dep-dc50mnt6e07s738vi2ag` is **live** on branch `feature/messinho-conversation-engine`, commit `f078eb7652e6b177b92b4598dcb0dac8328d9f52` (documentation-only commit containing the tested code from `3437646e`). Build succeeded; startup logs confirm API listening, model configuration present, and Supabase Data API HTTP 200.
- No Production deployment, merge, database schema mutation, or model training performed.


## 23. Block 3 — Conversation Evaluation Engine — 2026-11-28

**Status: implemented on the staging feature branch; GitHub Node tests and full STAGING CI succeeded on commit `a1b405b5c9d888fae13ab3058370dc5893cd4216`.**

- Added `backend/messinho-conversation-evaluation.js` with versioned deterministic evaluation of response presence, response-language agreement, retained context markers, required clarification, blocked tool execution, topic reset, and structured language-segment isolation.
- Added synthetic, non-user conversation fixtures in `tests/fixtures/messinho-conversation-evaluation.json` for small talk, follow-up continuity, topic changes, ambiguity, permission restrictions, and multilingual/code-switch handling.
- Added `tests/messinho-conversation-evaluation.test.js` covering the evaluator, fail-closed checks, language segmentation, and recurring-failure summaries.
- Subjective dimensions (naturalness, relevance, coherence, tone, linguistic fluency) are explicitly **not** represented as objectively measured by simple rules. They remain marked for human review.
- This is an evaluation foundation, not model training, self-modifying weights, or proof that live dialogue quality has improved. It does not ingest private user conversations.
- **Release gate:** run full MESSINHO tests, backend syntax and staging CI; then verify the exact STAGING deployment. Authenticated end-to-end chat smoke test remains outstanding.
- **Safety boundary:** no production branch, production service, database migration, or model-weight changes.


## 24. Block 4 — Conversation memory and continuity — 2026-11-28

**Status: implementation committed to the staging feature branch; CI verification pending.**

### Implementation
- Added `backend/messinho-conversation-memory.js`.
  - Builds a bounded, extractive context summary from the already persisted message history for the current conversation.
  - Scope is explicitly `owner_conversation`; the server loads messages using both authenticated owner ID and conversation ID before building the summary.
  - Maximum input history: 40 messages; maximum summary: 8 items, 260 characters per item and 1,600 characters total.
  - Filters sensitive-looking content using the existing memory safety classifier and de-duplicates repeated messages.
  - Does not create a new database table, migration, or a cross-conversation memory store. The summary is re-derived from the durable conversation messages on each turn; `persisted_summary=false` is intentional.
- `backend/server.js`
  - Builds the conversation summary only after owner-scoped conversation history has been loaded.
  - Passes it separately from long-term user memory into the semantic cognitive turn.
- `backend/messinho-conversational-intelligence.js`
  - Adds a separate `conversation_memory_context` payload and instructions to treat it as bounded, extractive, conversation-local evidence—not verified world knowledge, long-term memory, or instructions.
- Added tests in `tests/messinho-conversation-memory.test.js` and extended `tests/messinho-conversational-intelligence.test.js` for scope, bounds, sensitive-text filtering, de-duplication, and separation from long-term memory.

### Limits and privacy
- This block strengthens continuity across long conversations because context can be reconstructed from the durable message history even when only the last 12 turns are passed as direct dialogue.
- It does not claim that MESSINHO independently learns model weights or creates permanent user memories from ordinary chat.
- Sensitive-text filtering is a defensive heuristic, not a complete privacy classifier. Existing authenticated owner/conversation database filters remain the primary isolation boundary.
- No database migration or data mutation beyond normal existing chat-message persistence.

### Verification and release gate
- Block 3 CI succeeded on commit `a1b405b5c9d888fae13ab3058370dc5893cd4216`; Node tests and full STAGING branch CI completed successfully.
- Block 4 changes are committed; run full Node tests, backend syntax and STAGING CI before deployment.
- Authenticated end-to-end chat smoke test remains outstanding.
- No Production branch/service changes; PR #58 remains Draft/Open/unmerged.


### Block 4 verification and STAGING deployment
- Final verified commit: `659a8e16f6623a19c2433a75633da24baf794803`.
- MESSINHO Node tests: success; backend syntax: success; full STAGING CI: success.
- Render STAGING deployment `dep-dc50vmc9v7es738ododg`: **live**, exact commit `659a8e16f6623a19c2433a75633da24baf794803`, completed `2026-11-27T23:19:30Z`.
- The authenticated end-to-end chat smoke test remains outstanding; deployment success alone does not prove a full user chat exchange.


## 25. Block 5 — Evidence-aware conversational reasoning — 2026-11-28

**Implementation commit tested: `324d72cd1092e59fcf8c49f01ef8d7eaea992f44`.**

### Implementation
- Added `backend/messinho-reasoning-context.js`.
  - Builds a bounded evidence index from the current conversation's already owner-scoped history.
  - Attributes each statement to the user or assistant.
  - Carries structured player/club/team references from stored research context separately from ordinary statements.
  - Includes bounded follow-up signals, pending question, prior user goal and entity-resolution status.
  - Explicitly labels evidence policy `attributed_not_verified`; it does not certify claims or infer new facts.
- Updated `backend/server.js` to construct the reasoning context from the current owner-scoped history, dialogue state and grounded entity-resolution result.
- Updated `backend/messinho-conversational-intelligence.js`.
  - Critical integration fix: forwards approved language knowledge, conversation-local memory and reasoning context through `classifyMessinhoTurn` into the actual model request. Previously, server arguments for language/memory context were accepted by the server call but omitted from the classifier signature/forwarding path.
  - Adds explicit reasoning discipline: distinguish user assertions, assistant suggestions, structured research evidence and hypotheses; explain conditional conclusions and assumptions; do not invent player measurements or scouting observations.
  - Tactical examples such as pace vs. recovery runs are framed as hypotheses dependent on role, positioning, anticipation and team structure.
- Added `tests/messinho-reasoning-context.test.js` and an integration test verifying that all three context types reach the same model request.

### Verification
- First regression run exposed a text-normalization regex defect in the new evidence index (it altered names). Fixed before release; the corrected implementation passed Node tests, backend syntax and full STAGING CI.
- Verified test workflows on commit `324d72cd1092e59fcf8c49f01ef8d7eaea992f44`: Node tests success; full STAGING branch CI success.
- Render STAGING deployment `dep-dc511pec6qcc73fal28g` was triggered against the exact tested commit; build succeeded. Deployment rollout was still progressing at checkpoint.
- Authenticated end-to-end chat smoke test remains outstanding. Do not equate unit/CI success with proof of live natural dialogue quality.
- No production branch/service changes, no database migration, no automatic model training or weight modification. PR #58 remains Draft/Open/unmerged.


## 26. Block 6 — Reasoning Validation — 2026-11-28

**Implementation commit tested: `03ecaefd92df74444e23d4352294375b45f80716`.**

### Objective
Add a deterministic validation gate to MESSINHO's actual cognitive model reply path. The gate must prevent unsupported player measurements, reduce overconfident tactical conclusions, and avoid silently resolving ambiguous player references while preserving natural conversation.

### Implementation
- Added `backend/messinho-reasoning-validation.js`:
  - Validates model-generated replies immediately after the structured cognitive decision is parsed and before the decision returns to the authenticated chat route.
  - Rejects sprint-speed and related measurement claims unless the same numeric value and compatible unit exist in structured research evidence.
  - Rejects mismatched numeric values and units.
  - Converts ambiguous/unresolved player references into one focused clarification rather than allowing a guessed player assignment.
  - Requires tactical consequences of a qualitative pace description to be framed as conditional possibilities; unsupported certainty is replaced with a natural, qualified explanation.
  - When a reply is guarded, candidate memory items from that same model decision are discarded.
- Updated `backend/messinho-reasoning-context.js`:
  - Preserves only an allowlist of structured player speed/sprint metrics from existing owner-scoped research context.
  - Reads structured metric fields and profile facts/recent-performance values; free-text conversation statements and arbitrary numeric fields are not treated as metric evidence.
  - Keeps the existing `attributed_not_verified` evidence policy.
- Updated `backend/messinho-conversational-intelligence.js`:
  - Integrates the deterministic validator into `classifyMessinhoTurn`, the existing cognitive model path. No second chatbot or alternate conversation route was created.

### Tests and exact-commit CI
- Added `tests/messinho-reasoning-validation.test.js`.
- Extended `tests/messinho-reasoning-context.test.js`.
- Test cases cover qualitative pace statements, fabricated 32.4 km/h values, exact structured metric matches, mismatched values/units, ambiguous player identity, conditional tactical hypotheses, overconfident tactical assertions, and the actual cognitive classifier integration.
- Exact code commit `03ecaefd92df74444e23d4352294375b45f80716`:
  - MESSINHO Node tests run `46083654075`: **616/616 passed**.
  - MESSINHO backend syntax run `46083654028`: **success**; backend syntax checks and full test suite passed.
  - MESSINHO staging branch CI run `46083654025`: **success**; regression suite, backend syntax checks and Vite production build passed (1,640 modules transformed).
- A Node.js `punycode` deprecation warning and the Vite empty `supabase-vendor` chunk warning were non-fatal; build completed successfully.

### Safety and release status
- Changes are committed only to `feature/messinho-conversation-engine`.
- No database migration, persistent data mutation, provider secret change, model-weight training, automatic learning promotion, or production deployment.
- PR #58 remains Draft, open and unmerged.
- Render STAGING remains on the previously verified code commit `324d72cd1092e59fcf8c49f01ef8d7eaea992f44`; Block 6 has **not** yet been deployed.
- Authenticated live chat acceptance testing remains outstanding. CI validates deterministic behavior and integration, but does not prove end-user conversation quality or authenticated runtime behavior.

### Known limits
- This is a deterministic guard for targeted player metrics, ambiguous identity and pace-related tactical hypotheses, not a universal fact checker for every possible football statement.
- A metric is treated as available evidence only when it is present in the allowlisted structured research profile; ordinary conversation text is never sufficient.
- Further metric types should be added only with explicit schema mappings, source/provenance semantics and regression tests.

### Next release gate
1. Confirm the Render workspace selection before using workspace-scoped logs/deploy actions.
2. Reconfirm PR #58 head and the exact tested code commit.
3. Deploy only the tested commit to the named Render STAGING service.
4. Verify deployment ID/status, deployed SHA, startup logs and staging health.
5. Run authenticated chat acceptance tests for the five core cases; record results separately from CI.
6. Keep PR #58 Draft and unmerged. Production remains untouched.


## 27. Block 7 — Pragmatic Conversational Context — 2026-11-28

**Status: implementation committed to the STAGING feature branch; exact-head CI and runtime acceptance are pending.**

### Objective
Improve the natural two-person conversation experience by giving the existing cognitive router bounded cues for how a message is phrased — for example, a correction, disagreement, opinion, direct question, greeting, thanks, acknowledgement, explicit self-reported feeling, or request. This is a supporting context layer, not a second intent router or chatbot.

### Implementation
- Added `backend/messinho-pragmatic-context.js`:
  - Extracts at most two explicit, bounded conversational cues from the current message.
  - Supports selected German, English, French, Spanish, Arabic and Tunisian Derja surface expressions.
  - Labels cue strength separately from semantic intent confidence.
  - Uses explicit self-report wording before marking an emotion cue; it does not infer hidden emotional states.
  - Returns only fixed cue labels and guidance, not user text as executable instructions.
  - States that cues are weak hints and never facts, permissions, or action authorization.
- Updated `backend/messinho-conversational-intelligence.js`:
  - Passes `pragmatic_context` into the same structured model turn as dialogue, approved language knowledge, conversation memory and reasoning context.
  - Instructs the model to reconsider an answer when the user corrects or disagrees, rather than automatically defending the previous response.
  - Keeps the user's actual message, semantic decision and safety rules authoritative.
- Updated `backend/server.js`:
  - Builds the pragmatic context from the current interpreted message.
  - Passes it through the existing authenticated `POST /api/agent/chat` route.
- Added `tests/messinho-pragmatic-context.test.js`:
  - Covers correction, disagreement, opinions, explicit self-reported feelings, greeting, gratitude, acknowledgement, multilingual question cues, bounded output and integration into the real cognitive model request.
  - Includes a server-wiring regression check for the authenticated chat path.

### Safety and scope
- No new chatbot, conversation endpoint, database table, migration, persistent memory store, external action, permission change, model-weight change or training job.
- Pragmatic cues are transient and are not saved as user facts.
- Pattern matching is intentionally conservative and incomplete; the model must still interpret the full message and dialogue context.
- Subjective response quality still requires human review and authenticated conversation testing.

### Checkpoint
- Work branch: `feature/messinho-conversation-engine`.
- PR #58 remains open, Draft and unmerged.
- Implementation commits are on the feature branch; latest code commit before this documentation update: `ec408c12ba0f7acb35f2d3abe535222a81114079`.
- **Exact-head CI status: pending verification.** The available workflow lookup does not expose push-triggered run IDs; do not mark the new tests as passed until a successful run for the exact current head is verified.
- Render STAGING remains on the previously verified Block 6 deployment commit `f5817aa38fc8f53a3e40fef47524e7eba8c78a7f`. Block 7 has not been deployed.
- Authenticated Admin/Scout end-to-end conversation testing remains outstanding.
- Production branch, production Render service and production database remain untouched.

### Next actions
1. Verify the exact feature-branch head and obtain successful Node tests, backend syntax and full STAGING CI for that head.
2. Deploy only the verified commit to `myscoutingdatabase-messinho-staging` and confirm the exact deployed SHA and startup health.
3. Run authenticated dialogue acceptance tests for correction, disagreement, ordinary statements, new-topic changes, follow-up continuity, explicit emotion, and multilingual/code-switch input.
4. Review false positives and false negatives before expanding cue coverage.
5. Keep PR #58 Draft and unmerged until the owner explicitly authorizes otherwise.


## 28. Block 8 — Conversational Response Intelligence — 2026-11-28

**Status: implementation committed to the STAGING feature branch; exact-head CI and runtime acceptance are pending.**

### Objective
Turn dialogue and pragmatic cues into a useful response structure, so MESSINHO answers the user's actual contribution in context rather than merely classifying the message. The response must remain natural and adaptive, not a rigid template.

### Implementation
- Added `backend/messinho-response-composition.js`:
  - Builds a bounded response-shaping contract for the existing cognitive turn.
  - Distinguishes correction, disagreement, direct questions, opinions, explicit self-reported feelings, pending acknowledgements, follow-up questions, ambiguous clarification and topic changes.
  - For corrections/disagreement: acknowledge, reconsider evidence and reasoning, then correct or explain.
  - For direct questions: answer first, then explain; when it is also a follow-up, preserve references and constraints from the recent exchange.
  - For opinions: engage fairly and separate evidence from interpretation.
  - For explicit feelings: acknowledge only what the user directly stated, without diagnosis or assumptions.
  - For ambiguous clarification: ask one focused question and do not start the dependent task.
  - For new topics: do not carry old task filters forward.
  - Explicitly avoids unnecessary follow-up questions and forced response templates.
- Updated `backend/messinho-conversational-intelligence.js`:
  - Includes `response_composition_context` in the same model request as the actual message, dialogue state, language knowledge, conversation memory, reasoning evidence and pragmatic cues.
  - Adds instructions to treat the response plan as guidance only, never expose it to users, and keep evidence and application safety authoritative.
- Updated `backend/server.js`:
  - Builds the response composition context from the current interpreted message, existing dialogue state, clarification lifecycle and pragmatic context.
  - Passes it through the existing authenticated `POST /api/agent/chat` route.
- Added `tests/messinho-response-composition.test.js`:
  - Covers corrections, disagreement, questions, follow-up questions, opinions, explicit emotion, ambiguous clarification and new-topic boundaries.
  - Verifies that the plan reaches the cognitive model request and that the authenticated chat route constructs and forwards it.

### Safety and scope
- This is response planning guidance, not an independent chatbot or a deterministic answer generator.
- It does not create facts, user memories, permissions, tool calls, or actions.
- The model remains responsible for composing the actual natural-language reply; evidence validation and application role checks remain in force.
- No database migration, persistent data mutation, provider secret change, model-weight training or production deployment.

### Checkpoint (historical snapshot — superseded by Sections 29 and 30)
- The original Block 8 checkpoint preceded the subsequent CI verification and STAGING deployments.
- Current verified implementation, CI and deployment records are maintained in Sections 29 and 30 below.
- PR #58 remains open, Draft and unmerged.
- Authenticated Admin/Scout end-to-end conversation testing remains outstanding.
- Production branch, production Render service and production database remain untouched.


## 29. Block 7/8 verification and pragmatic cue-strength correction — 2026-11-28

### Review finding and correction
- Post-deployment review found a field-name mismatch in `backend/messinho-pragmatic-context.js`: cue construction read `entry.confidence`, while the pattern definitions provide `entry.signal_strength`.
- Corrected the mapping to `signal_strength: entry.signal_strength`; the statement fallback retains an explicit bounded strength of `0.55`.
- Added regression assertions in `tests/messinho-pragmatic-context.test.js` for correction (`0.94`), disagreement (`0.90`), opinion (`0.87`) and explicit emotion (`0.86`).
- Runtime correction commit: `7bbf084871fa5264916d2ed777f2f48739be7c9a`.
- Regression-test commit / exact feature-branch head at verification: `08dd035d2edabebdcf7b8c51a6bfc5527871da98`.

### Exact-head CI
All three workflows completed successfully on exact head `08dd035d2edabebdcf7b8c51a6bfc5527871da98`:
- MESSINHO Node tests: run `46086151986` — success.
- Backend syntax: run `46086152006` — success.
- MESSINHO STAGING branch CI: run `46086151981` — success.
- These results establish automated test/build success for this exact commit; they do not establish authenticated end-to-end dialogue quality.

### STAGING release gate
- Render service verified: `myscoutingdatabase-messinho-staging`, service ID `srv-dc3chlqjnfac73acd6ig`.
- Service branch: `feature/messinho-conversation-engine`; automatic deployment is disabled (`autoDeploy=no`), so deployment must be manually triggered after checks.
- Workspace: `tea-dboagk9srm7s73bdor10`.
- Deployed to STAGING: Render deployment `dep-dc51onmc6qcc73fd44sg`, status **live**, finished `2026-11-28T00:12:59.518506Z`; deployed branch head `c6fbaa3b5cd8c0eafa1c3dcad096d64e80f41a76` (documentation-only commit on top of CI-verified runtime code/test commit `08dd035d2edabebdcf7b8c51a6bfc5527871da98`).
- Authenticated Admin/Scout end-to-end tests remain outstanding, including multi-turn continuity, correction, disagreement, follow-up constraints, ambiguous references, explicit emotion and topic changes.
- PR #58 remains open, Draft and unmerged. Production branch, service and database remain untouched.

### Next actions
1. Trigger the verified feature-branch commit on the named STAGING service only.
2. Confirm deployment is live and reports the expected commit SHA; inspect startup logs and staging health.
3. Run authenticated dialogue acceptance tests and record observed responses separately from automated CI.
4. Continue with the next conversational-engine block only after the staging acceptance baseline is recorded.


### Deployment verification addendum
- Render STAGING deployment `dep-dc51onmc6qcc73fd44sg` completed with status **live** at `2026-11-28T00:12:59.518506Z`.
- Deployed commit: `c6fbaa3b5cd8c0eafa1c3dcad096d64e80f41a76` (documentation-only checkpoint commit); runtime code and tests are the already CI-verified commit `08dd035d2edabebdcf7b8c51a6bfc5527871da98`.
- Render build log: all 630 Node tests passed, 0 failed; Vite production build transformed 1,640 modules and completed successfully.
- Runtime startup log: `npm start` launched `node backend/server.js`; API reported listening on port 10000; Supabase Data API check returned HTTP 200.
- This verifies build, deployment and startup connectivity. It does not replace authenticated Admin/Scout end-to-end conversational acceptance tests.


## 30. Block 9 — Natural Dialogue Intelligence — 2026-11-28

### Objective
Separate semantic intent routing from natural-language response composition. The prior cognitive router returned both the intent decision and the user-facing reply in one constrained JSON-schema completion. Block 9 adds a dedicated free-form response-generation turn for ordinary conversation, so the reply is no longer forced through the router's structured-output format.

### Implementation
- New module: `backend/messinho-natural-conversation.js`.
- New tests: `tests/messinho-natural-conversation.test.js`.
- `backend/server.js` invokes the composer only after the cognitive router has selected `conversation`; scouting, research, memory and engineering routing remain separate.
- The composer uses the existing provider-neutral model runtime and current configured provider/model.
- Natural reply generation uses a plain-text completion at temperature `0.55`, rather than the router's JSON-schema response format.
- The response turn receives the current user message, up to 12 recent speaker-labelled turns, bounded conversation-memory context, detected language segments, approved language knowledge, bounded reasoning evidence, pragmatic cues and response-composition guidance.
- Replies preserve paragraph breaks and multiline formatting.
- If the second completion is unavailable or invalid, the server falls back to the router's already-generated reply. The existing conversation response guard remains the final check before the reply is returned.
- The composer cannot call tools, initiate research, persist memory, alter settings, grant permissions or claim that a system action has been completed.
- The composer prompt explicitly prioritizes natural turn-taking, answering the actual point, following topic changes, considering corrections, avoiding automatic follow-up questions and preserving the user's language/dialect.

### Automated verification
Exact feature-branch head: `d39e8e3a0cb0cf4863ddc7082b0a391693c432ed`.
- MESSINHO Node tests: run `46087356010` — success; **638 tests passed, 0 failed**.
- Backend syntax: run `46087356003` — success.
- Full STAGING branch CI (tests, backend syntax and Vite production build): run `46087355979` — success.
- The dedicated tests cover speaker-labelled history, history bounds, invalid role removal, language-specific knowledge, plain-text completion, provider fallback, JSON-shaped output rejection and paragraph preservation.

### STAGING deployment
- Render service: `myscoutingdatabase-messinho-staging` (`srv-dc3chlqjnfac73acd6ig`).
- Deployment: `dep-dc51sv56e07s7393msng`.
- Status: **live**; finished at `2026-11-28T00:22:00.653231Z`.
- Deployed exact code/test commit: `d39e8e3a0cb0cf4863ddc7082b0a391693c432ed`.
- Render build completed successfully; Vite transformed 1,640 modules.
- Runtime started with `node backend/server.js`; API listened on port 10000 and Supabase Data API returned HTTP 200.
- STAGING URL: https://myscoutingdatabase-messinho-staging.onrender.com

### Limitations and acceptance gate
- This is a separate natural-language generation step, not a new foundation model or model-weight training.
- Ordinary conversation now uses two model completions (semantic routing plus natural response composition). The resulting latency and provider cost must be measured during authenticated testing.
- CI and successful startup do not prove that the live model consistently sounds natural. Authenticated Admin/Scout dialogue tests remain outstanding.
- Required dialogue acceptance: multi-turn follow-up, pronoun/reference continuity, user correction, disagreement, incomplete colloquial sentence, language switch (German/English/French/Arabic/Derja), topic change, direct factual question and provider-failure fallback.
- PR #58 remains open, Draft and unmerged. Production branch, production Render service and production database remain untouched.

### Next action
Test the deployed STAGING conversation with an authenticated Admin or Scout account. Record actual replies and response times before starting Block 10.


## 31. Block 10 — Conversation Continuity and Referent Hints — 2026-11-28

### Objective
Improve natural multi-turn dialogue so short follow-ups, pronouns, corrections and topic changes are interpreted against the correct recent exchange. Avoid solving continuity by blindly replaying old task constraints or treating prior assistant suggestions as user-confirmed facts.

### Implementation on the feature branch
- Added `backend/messinho-conversation-continuity.js`:
  - Builds a bounded extractive context from at most 16 recent speaker-labelled turns.
  - Classifies the current turn as `follow_up`, `correction`, `new_topic` or `standalone`.
  - Detects selected referential expressions and discourse connectors without treating ordinary German articles such as “der/die/den/dem” as pronoun references.
  - Supplies the immediately preceding user topic and assistant contribution as separate candidates with explicit source/authority labels.
  - Filters sensitive historical text and caps candidate counts and text lengths.
  - Explicitly treats assistant content as a hypothesis/question, not proof; corrections invalidate contradicted interpretations; new topics drop prior task constraints.
  - Context is a hint only: it does not resolve player identity, authorize actions, persist memory, or establish facts.
- Updated `backend/server.js` to build this context inside the existing authenticated chat route and pass it to both cognitive routing and natural response composition.
- Updated `backend/messinho-conversational-intelligence.js` and `backend/messinho-natural-conversation.js` to consume the same continuity context.
- Corrected `backend/messinho-conversation-memory.js`: the bounded eight-item conversation context now prioritizes the newest distinct messages while preserving chronological order. Previously the first eight unique items in the 40-message window could crowd out the latest exchange.
- Added `tests/messinho-conversation-continuity.test.js`; extended the conversation-memory and natural-composer tests for recency, topic changes, correction handling, false-positive control and authenticated-route wiring.

### Safety and scope
- No new chatbot or chat endpoint; the existing authenticated chat remains the only user-facing interface.
- No database migration or schema change; no direct persistent data mutation, model training, model-weight update, permission change, or external action.
- Sensitive-text filtering is a defensive heuristic only; owner/conversation-scoped history loading remains the primary isolation boundary.
- The context is extractive and bounded. It does not claim semantic certainty or replace the existing player entity-resolution and clarification systems.

### Verification and deployment status
- Implementation commits (feature branch):
  - `380c4f13249ddb19d4e1558ead224c78ec754620` — continuity module.
  - `43fdbf933f3ef9ad6c6d53127161a2789b51a93c` — initial continuity tests.
  - `33fb8c433e9ccbde1be621922c6a9102851ca802` — recent-first conversation memory.
  - `c4983b78f8c0bf0d05bf566c04b51d13212895e0` — cognitive-router integration.
  - `f6cde5983dda7b0d30caf444b67ddf5d491f3444` — natural composer integration.
  - `f07931beb441edfd7709dbe1d18ba3ec89dbf437` — authenticated chat wiring.
  - `8d29f685e68d05c79fa70ddd6761113c183e59f7` — conversation-memory recency regression test.
  - `27c64320aef4ea7fffd151f7e580f267aa689e5d` — cognitive/server integration tests.
  - `b7d4aa093e59339720ff274107f774a6031c2cd2` — natural composer continuity test.
  - `09374a681c9d064e9e29ee32da27b989dad9562f` — avoid article/pronoun false positives.
  - `bbae88cf7a50f007244a44c4212c3a57c6e267b8` — regression test for false-positive control.
- Exact-head CI for the final implementation commit has **not yet been verified**; the workflow lookup returned no runs/statuses for that commit. Do not mark the tests as passed until a successful exact-head CI run is obtained.
- Render STAGING remains on the previously verified live deployment `dep-dc51sv56e07s7393msng`, runtime commit `d39e8e3a0cb0cf4863ddc7082b0a391693c432ed`. Block 10 has **not** been deployed.
- Authenticated Admin/Scout multi-turn acceptance testing remains outstanding.
- PR #58 remains Draft and unmerged. Production branch, Render service and database remain untouched.

### Next actions
1. Obtain successful Node tests, backend syntax and full STAGING CI for the exact Block 10 feature-branch head.
2. Review any test failures and fix them before deployment.
3. Deploy only the exact CI-verified head to the named STAGING service; confirm deployment SHA, live status and startup health.
4. Test natural multi-turn dialogue with authenticated Admin/Scout accounts, including follow-up references, corrections, topic changes, ambiguous pronouns and preserved/cleared task filters.
5. Measure the additional context and response latency; keep PR #58 Draft and unmerged.


### Block 10 verification addendum — 2026-11-28
- The first exact-head CI exposed three regressions:
  1. The transient continuity filter did not yet recognize the German spelling `Passwort`; the sensitive-text pattern now covers both `Passwort` and `password`.
  2. Existing pragmatic-context and response-composition integration tests asserted the old server argument adjacency; both were updated to verify the additional continuity context argument.
- The corrected implementation is at code/test commit `805a9131b841c922c509962fc8b16c8ef8a8e1d1`.
- Exact-commit GitHub Actions results:
  - MESSINHO Node tests run `46089011829`: **success; 648 passed, 0 failed**.
  - Backend syntax run `46089011768`: **success**.
  - Full STAGING branch CI run `46089011717`: **success**, including regression suite, backend syntax checks and Vite production build.
  - The push-triggered full STAGING CI run `46089007059` also completed successfully on the same code commit.
- These results verify automated tests and build only; authenticated Admin/Scout live dialogue acceptance is still outstanding.
- Render STAGING has not yet been updated. The existing deployment `dep-dc51sv56e07s7393msng` remains the last verified live deployment on runtime commit `d39e8e3a0cb0cf4863ddc7082b0a391693c432ed`.
- The first failing CI runs were `46088875566` (Node tests) and `46088875565` (full STAGING CI); all three identified regressions were corrected before the successful exact-commit runs above.
- No database/schema or user/player data changes. PR #58 remains open, Draft and unmerged; production remains untouched.


### Block 10 STAGING deployment verification — 2026-11-28
- Render service: `myscoutingdatabase-messinho-staging` (`srv-dc3chlqjnfac73acd6ig`); configured branch `feature/messinho-conversation-engine`; automatic deployment remains disabled.
- Exact deployed commit: `7b09843d13a0d2ef2e0bf68643750b98ffd01b88`.
- Render deployment: `dep-dc5262mi0phs73c3vdvg` — status **live**, finished `2026-11-28T00:41:30.058102Z`.
- Render build event: `build_ended / succeeded` at `2026-11-28T00:41:12.482445Z`.
- Render build command ran `npm install --no-audit --no-fund && npm run build`; the build script executes `npm test`, backend `node --check` and Vite production build. The deployment build completed successfully.
- Runtime logs confirmed `node backend/server.js`, API listening on port 10000, and Supabase Data API HTTP 200.
- STAGING URL: https://myscoutingdatabase-messinho-staging.onrender.com
- No production branch/service/database changes; no schema migration or user/player data changes.
- Authenticated Admin/Scout conversation acceptance and latency measurements are still outstanding. Deployment/startup success does not prove subjective dialogue quality.
- PR #58 remains open, Draft and unmerged.


## 32. Block 11 — Long-Horizon Conversation Memory and Active Frame — 2026-11-28

### Ziel
MESSINHO soll den Gesprächsfaden über längere Dialoge halten, ohne alte Aufgaben blind weiterzuführen, Assistentenvorschläge als Nutzerentscheidungen zu speichern oder ungeprüfte Annahmen zu Tatsachen zu machen.

### Implementierung auf dem Feature-Branch
- backend/messinho-conversation-memory.js wurde auf Version 1.1.0 erweitert.
- Das bestehende begrenzte Gesprächsgedächtnis (maximal acht unterschiedliche Nachrichten, maximal 1.600 Zeichen) bleibt erhalten.
- Neu wird pro Chat-Anfrage ein strukturierter, extraktiver active_frame abgeleitet:
  - aktueller Themen-/Zielkandidat mit Quelle und Autorität;
  - expliziter Themenwechsel als Kontextgrenze;
  - Korrektur als vorrangiger Nutzerhinweis, der die widersprochene Interpretation ersetzt;
  - offene Rückfrage mit Status awaiting_user_reply, answer_candidate_received oder needs_clarification;
  - mögliche Referenten getrennt nach Nutzer- und Assistentenquelle;
  - keine automatische Übernahme von Nutzerrestriktionen aus Assistentenvorschlägen.
- Der Frame wird aus dem owner-geprüften Gesprächsverlauf abgeleitet und an den aktuellen Modellturn übergeben. Er wird nicht als neue dauerhafte Datenbank-Memory gespeichert.
- backend/server.js übergibt die aktuelle interpretierte Nachricht, den Dialogzustand und die Kontinuitätshinweise an den bestehenden Memory Builder.
- Die Formatierung gibt den Active Frame zusammen mit den begrenzten jüngsten Nachrichten an Cognitive Routing und Natural Response Composition weiter.

### Sicherheits- und Datenregeln
- Kein Datenbankschema, keine Migration und keine Änderung persistierter Nutzer-, Spieler-, Scout- oder Lerndaten.
- Kein neues globales oder organisationsübergreifendes Gedächtnis; der bestehende owner-/conversation-gefilterte Verlauf bleibt die Quelle.
- Sensible Texte werden vor Aufnahme in den Active Frame gefiltert; die Filterung ist eine defensive Heuristik und kein Ersatz für Zugriffskontrolle.
- Der Active Frame ist pro Anfrage abgeleitet, begrenzt und nicht persistent.
- Bestätigte Nutzerrestriktionen bleiben bis zu einer semantischen Prüfung leer; Vorschläge des Assistenten werden nicht zu Nutzerentscheidungen hochgestuft.
- Ein mehrdeutiger Referent wird nicht durch Memory entschieden. Bei konkurrierenden Kandidaten muss die bestehende Gesprächs-/Entity-Auflösung klären.

### Tests und Verifikation
- Neue Regressionstests decken 20+ Turns, Priorisierung des aktuellen Nutzerziels, Themenwechsel, Korrekturen, offene/mehrdeutige Rückfragen, sensible Inhalte und die Nicht-Persistenz des Active Frames ab.
- Die Änderung ist auf dem Feature-Branch vorbereitet. CI, Backend-Syntax, Build und STAGING-Deployment werden erst nach Ausführung der entsprechenden Prüfungen als bestanden bzw. live dokumentiert.
- Authentifizierte Admin-/Scout-Dialogtests bleiben erforderlich; reine Unit-Tests beweisen nicht die subjektive Natürlichkeit des Gesprächs.

### Nächste Schritte
1. Exakte Feature-Branch-CI für Memory-Tests, vollständige Node-Suite, Backend-Syntax und STAGING-Build ausführen.
2. Fehler beheben und CI erneut auf dem exakten Branch-HEAD prüfen.
3. Nur den CI-geprüften Feature-Branch auf den vereinbarten STAGING-Service deployen und Commit/Status/Health verifizieren.
4. Mit Admin und Scout jeweils längere Dialoge testen: 20+ Turns, Themenwechsel, Korrektur, Rückfrage/Antwort, mehrdeutiges Pronomen.
5. Antwortqualität und Latenz messen; PR #58 Draft/unmerged halten, Produktion unangetastet lassen.


### Block 11 verification addendum — 2026-11-28
- Code/test commit: 4bcd6e759524c602942796158f188958a6667286.
- MESSINHO Node tests: workflow run 46101535357 — success, **653 passed, 0 failed**.
- Backend syntax: workflow run 46101535443 — success.
- Full STAGING branch CI/build: workflow run 46101535355 — success; regression suite, backend syntax and Vite production build completed.
- The initial test iterations exposed an invalid test-file line break and incorrect expectations for formatter output/correction semantics. These were fixed before the successful exact-head checks above.
- No database migration, schema change, user/player/scout data write, persistent memory write, model training, model-weight change or permission change was performed.
- Render STAGING has not yet been updated for Block 11. The previously verified live deployment remains deployment dep-dc5262mi0phs73c3vdvg on runtime commit 7b09843d13a0d2ef2e0bf68643750b98ffd01b88.
- Authenticated Admin/Scout dialogue acceptance and response-latency measurement remain outstanding.
- PR #58 remains open, Draft and unmerged. Production branch, Render production service and production database remain untouched.


### Block 11 STAGING deployment verification — 2026-11-28
- Render STAGING service: myscoutingdatabase-messinho-staging (srv-dc3chlqjnfac73acd6ig); configured branch feature/messinho-conversation-engine; automatic deployment remains disabled.
- Deployed commit: ff6b4e5ab3c0b73a5df0ce53727db3dbd2304e6c.
- Render deployment: dep-dc54csu1egvs73ahn340 — status live, finished 2026-11-28T03:12:26.035054Z.
- Build event: build_ended / succeeded at 2026-11-28T03:12:08.45643Z. The Render build executed npm install --no-audit --no-fund && npm run build; the regression suite and Vite production build completed.
- Runtime logs confirmed npm start, node backend/server.js, API listening on port 10000, Supabase Data API HTTP 200, and Render reported “Your service is live”.
- STAGING URL: https://myscoutingdatabase-messinho-staging.onrender.com
- No database/schema migration or persistent user/player/scout/learning data changes. No model training, model-weight changes, permission changes or external side effects.
- Authenticated Admin/Scout conversation acceptance and latency measurements remain outstanding; successful startup does not prove natural dialogue quality.
- PR #58 remains open, Draft and unmerged. Production branch, Render production service and production database remain untouched.


## 33. Block 12 — Natural Language Understanding and Ambiguity: Phase A — 2026-11-28

### Ziel
Eingaben sollen auch bei Tippfehlern, unvollständigen Formulierungen und mehrsprachigen Nachrichten korrekt verarbeitet werden. Die Normalisierung darf jedoch keine falsche Bedeutung oder einen falschen Spielernamen erzeugen.

### Implementierung
- backend/messinho-input-correction.js akzeptiert nun ein explizites Sprachprofil.
- Das deutsche Korrekturlexikon wird nur auf eindeutig als Deutsch erkannte Nachrichten angewendet.
- Bei gemischten Sprachsegmenten wird die deutsche automatische Korrektur vollständig ausgesetzt; Originaltext und Sprachsegmente bleiben erhalten.
- Nur Korrekturen mit hoher Sicherheit (bekannte Tippfehler und feste Phrase-Korrekturen) werden auf die Nachricht angewendet, die Dialogzustand, semantisches Routing und Parsing erhalten.
- Mittlere Sicherheit wird als Vorschlag gekennzeichnet und verändert den tatsächlich verarbeiteten Originaltext nicht.
- backend/server.js baut zuerst die Sprachdiagnose aus dem unveränderten Nutzereingang. Danach erstellt es input_interpretation mit Originaltext, tatsächlich verwendetem Text, Korrekturstatus, Konfidenz und begrenzten Vorschlägen.
- Der Cognitive Router erhält den sicher normalisierten Text sowie input_interpretation im linguistischen Kontext. Die natürliche Antwortkomposition erhält denselben Kontext.
- Die Router-Regeln untersagen, unsichere Korrekturvorschläge als Tatsachen zu behandeln oder Namen, Zahlen, Zitate und unbekannte Wörter zu erraten.
- Die Dialogzustands-Integration verwendet dieselbe sicher normalisierte Nachricht. Die ursprüngliche Nachricht bleibt als Originalquelle erhalten.

### Regressionstests und Verifikation
- Andere Sprachprofile (Englisch, Französisch, Spanisch, Hocharabisch, tunesische Derja und gemischte Sprache) werden vom deutschen Korrekturlexikon ausgeschlossen.
- Hohe und mittlere Korrektursicherheit werden getrennt geprüft.
- Spielernamen und unbekannte Wörter bleiben erhalten.
- Integrationstests prüfen die Weitergabe von input_interpretation an den Cognitive Router und die tatsächliche Chat-Route.
- Node-Testlauf auf Code-Commit 5fc0cbd50647f4222871723d50b52136a99028d5: **658 bestanden, 0 fehlgeschlagen**.
- Backend-Syntax-/Testworkflow: erfolgreich.
- Vollständiger STAGING-Branch-CI-Lauf einschließlich Vite-Build: erfolgreich.

### Grenzen — Phase A ist kein vollständiger Sprachversteher
- Es wurde kein vollständiges Speech-to-Text-Korrekturmodell entwickelt.
- Es wurden keine neuen Wörterbücher für Englisch, Französisch, Spanisch, Hocharabisch oder tunesische Derja hinzugefügt.
- Grammatik- und Sprachprofile bleiben die bestehende Analysegrundlage; die Korrekturlogik ist weiterhin konservativ.
- Semantische Mehrdeutigkeit und Pronomenauflösung werden weiterhin durch Dialogzustand, Entity Resolution und Modellinterpretation behandelt, nicht durch automatische Rechtschreibkorrektur.
- Noch erforderlich: mehrsprachiger Benchmark mit Umgangssprache, fragmentierten Sätzen, Diktatfehlern, Code-Switching, Namen und konkurrierenden Referenten.

### Sicherheit und Daten
- Keine Datenbankmigration und keine Änderung persistierter Nutzer-, Spieler-, Scout- oder Lerndaten.
- Keine Modellgewichte, kein Training, keine Berechtigungen und keine Produktionsressourcen verändert.
- Änderungen bleiben auf feature/messinho-conversation-engine und STAGING beschränkt.
- PR #58 bleibt Draft und ungemergt.


### Block 12 Phase A STAGING verification — 2026-11-28
- Tested code commit: 5fc0cbd50647f4222871723d50b52136a99028d5 — 658/658 Node tests passed; backend syntax and full STAGING branch CI/Vite build succeeded.
- Deployed commit: 18d81a93adb66f2b55e07984259f12c8f3d775b2.
- Render deployment: dep-dc54ftk9v7es7395f26g — status live, finished 2026-11-28T03:18:53.999979Z.
- Build event succeeded at 2026-11-28T03:18:36.380358Z.
- Runtime confirmed API listening on port 10000, Supabase Data API HTTP 200 and Render “Your service is live”.
- STAGING URL: https://myscoutingdatabase-messinho-staging.onrender.com
- Render automatic deploy remains disabled; only the explicitly verified STAGING service was updated.
- PR #58 remains open, Draft and unmerged. Production remains untouched.


### Block 12 Phase A.1 — conservative language inference for heavily misspelled German
- The correction language is now selected from the current language diagnosis or the recent conversation language hint.
- If the current language is ambiguous, German is inferred only when at least two strong German correction signals (known typo aliases or fixed German phrase corrections) are present.
- One isolated typo is not enough to infer German. A detected non-German or mixed-language segment always blocks the German dictionary.
- Added regression coverage for multiple strong typo signals, a single typo, Derja text and an explicit non-German language.
- Code commit 12d82f5cb94736ee6f0f4673fbbecdf8c1a86a02: Node tests, backend syntax and full STAGING CI/Vite build succeeded.
- This remains a conservative fallback, not general multilingual spell correction.


### Block 12 Phase A.1 STAGING deployment verification — 2026-11-28
- Code commit: 12d82f5cb94736ee6f0f4673fbbecdf8c1a86a02; full Node test, backend syntax and STAGING branch CI/build workflows succeeded.
- Deployed commit: 7a265d57cccee2cbffed48a9e00eec96d2c05f64.
- Render deployment: dep-dc54hie1egvs73ai7b70 — status live, finished 2026-11-28T03:22:23.355940Z.
- Build event succeeded; Vite build completed in 2.27 seconds.
- Runtime confirmed API listening on port 10000, Supabase Data API HTTP 200 and Render “Your service is live”.
- STAGING URL: https://myscoutingdatabase-messinho-staging.onrender.com
- No database migration or persistent user/player/scout/learning data changes. PR #58 remains Draft and unmerged. Production untouched.


## 34. Block 13 — Linguistic Intelligence: Sentence Structure — 2026-11-28

### Ziel
MESSINHO soll nicht nur Sprachprofile und einzelne grammatische Signale erkennen, sondern nachvollziehbare Kandidaten für Satzgrenzen, Satzteile, Subjekt-/Verbbeziehungen und Wortstellungsmerkmale ableiten. Die Analyse bleibt konservativ: Kandidaten sind keine bestätigten grammatischen Abhängigkeiten und führen niemals zu einer automatischen Umschreibung.

### Implementierung auf dem Feature-Branch
- Neu: `backend/messinho-sentence-structure.js` als eigenständige, deterministische und begrenzte Analysekomponente.
- Unterstützt die sechs vorhandenen Profile Deutsch, Englisch, Französisch, Spanisch, Hocharabisch und tunesische Derja.
- Erkennt Satzgrenzen sowie begrenzte Haupt-/Neben-/Koordinationsmarker.
- Liefert Subjekt- und finite Verbkandidaten, zusätzliche Verbkandidaten und vorsichtige Wortstellungsindikatoren.
- Bewahrt Quelltext und Zeichenbereiche; die Originalnachricht wird nicht verändert.
- `backend/messinho-grammar-engine.js` integriert die Satzstrukturanalyse in das bestehende Grammar-Ergebnis und aktualisiert seine Versionsnummer auf 0.2.0.
- Ergänzt Tests in `tests/messinho-sentence-structure.test.js` und erweitert `tests/messinho-grammar-engine.test.js`.

### Grenzen und Qualitätssicherung
- Die Komponente ist ein lexikalischer Heuristik-Parser, kein vollständiger Dependency-/Constituency-Parser.
- Subjekt und Verb sind Kandidaten aus begrenzten Wortlisten; Flexion, unregelmäßige Formen, Ellipsen und freie Wortstellung können unvollständig erkannt werden.
- Ein erkannter Wortstellungshinweis ist kein Urteil über grammatische Richtigkeit.
- Keine Datenbankmigration, keine persistenten Nutzer-/Spieler-/Scout-Datenänderungen, keine Modellgewichtsänderung und keine Produktionsänderung.
- CI, vollständige Tests und Build müssen für den exakten Branch-HEAD noch verifiziert werden. Bis dahin gilt Block 13 als implementiert, aber nicht verifiziert oder live.

### Nächste Schritte
1. Exakten Branch-HEAD und GitHub Actions prüfen; alle Tests, Backend-Syntax und Vite-Build müssen erfolgreich sein.
2. Fehler anhand der tatsächlichen CI-Ausgabe beheben und erneut auf dem exakten HEAD prüfen.
3. Nur nach erfolgreicher Prüfung den ausdrücklich vereinbarten STAGING-Service aktualisieren und Deployment-SHA/Health verifizieren.
4. Mehrsprachige Benchmarkfälle mit realistischen Haupt-/Nebensätzen, Ellipsen, Arabizi, Derja, Code-Switching und mehrdeutiger Wortstellung ergänzen.
5. Danach semantische Rollen und Beziehungen auf Basis verlässlicherer Satzstruktursignale entwickeln.

### Change & Decision Log
| 2026-11-28 | Satzstruktur-Analyse als nächste Linguistic-Intelligence-Stufe integrieren; keine parallele Chatoberfläche und keine automatische Textkorrektur. | In progress | Block 13; Feature-Branch und STAGING-only. |


### Block 13 verification addendum — 2026-11-28
- Corrected two test-discovered implementation defects before acceptance:
  - The language lexicons were initially split with an incorrectly escaped whitespace regular expression; corrected both verb and subject lexicon tokenization.
  - The first CI attempt also exposed an array/Set mismatch; corrected the lexicon lookup contract.
- Exact tested code commit: `8a615ff31a46dcbff44b544eb50ac369aa89f3c8`.
- MESSINHO Node tests: workflow run `46103371667` — **664 passed, 0 failed**.
- Backend syntax: workflow run `46103371701` — **success**.
- Full STAGING branch CI/build: workflow run `46103371703` — **success**, including regression suite, backend syntax checks and Vite production build.
- The successful checks cover the tested code commit above. The subsequent documentation-only commit does not change runtime code.
- Block 13 is **implemented and CI-verified**, but not yet deployed or live. Render STAGING deployment verification is pending.
- No database migration, persistent user/player/scout/learning data change, model training, model-weight update, permission change, or production resource change.
- PR #58 remains Draft and unmerged; production remains untouched.


### Block 13 STAGING deployment verification — 2026-11-28
- Render service: `myscoutingdatabase-messinho-staging` (`srv-dc3chlqjnfac73acd6ig`); configured branch `feature/messinho-conversation-engine`; automatic deployment remains disabled.
- Deployed branch commit: `69acf81a6a4d175acd90bcccb1cb992cb142de74` (documentation-only commit after the tested runtime code commit `8a615ff31a46dcbff44b544eb50ac369aa89f3c8`).
- Runtime code is identical to the exact code commit that passed the 664-test suite, backend syntax and full CI/build checks.
- Render deployment: `dep-dc54nbe1egvs73aiqo8g` — status **live**, finished `2026-11-28T03:34:51.188475Z`.
- Render build succeeded; npm test reported **664 passed, 0 failed**; Vite production build completed successfully.
- Runtime logs confirmed API listening on port 10000, Supabase Data API HTTP 200, and Render reported “Your service is live”.
- STAGING URL: https://myscoutingdatabase-messinho-staging.onrender.com
- No database/schema migration or persistent user/player/scout/learning data changes. No model training, model-weight changes, permission changes or external side effects.
- Authenticated Admin/Scout conversation acceptance remains outstanding. This deployment verifies build/startup and service health, not the quality of real user conversations.
- PR #58 remains open, Draft and unmerged. Production branch, Render production service and production database remain untouched.

## 35. MESSINHO Universal Knowledge Intelligence — owner decision — 2026-11-28

### Verbindliche Produktentscheidung
MESSINHO soll langfristig ein universeller Wissens- und Problemlösungsagent werden. Fußball und Scouting bleiben seine primäre Spezialisierung innerhalb von myScoutingDatabase, sind aber ausdrücklich nicht die Grenze seines allgemeinen Wissens oder seiner Gesprächsfähigkeit. MESSINHO soll auch fachfremde Fragen verständlich beantworten, wissenschaftliche Methoden anwenden, Berechnungen ausführen, Prognosen kritisch bewerten und technische Aufgaben unterstützen können.

Diese Entscheidung ergänzt die bestehende Conversation Engine und die ASI-Scouting-Architektur. Sie ersetzt weder den bestehenden Chat noch die Provider-unabhängige Agent-Core-Vorgabe.

### 35.1 Wissensdomänen — verbindlicher Zielumfang

1. **Biologie und Lebenswissenschaften:** Zellbiologie, Genetik, Evolution, Anatomie, Physiologie, Ökologie, Mikrobiologie und Biochemie.
2. **Physik:** Mechanik, Dynamik, Kinematik, Energie, Thermodynamik, Elektrizität, Magnetismus, Optik, Wellen und Messmethoden.
3. **Chemie:** allgemeine, anorganische und organische Chemie, Reaktionslehre, Stoffmengen, Konzentrationen, Säure-Base-Chemie, Elektrochemie und Biochemie.
4. **Mathematik:** Arithmetik, Algebra, Geometrie, Analysis, lineare Algebra, Differentialgleichungen, numerische Methoden, diskrete Mathematik und Optimierung.
5. **Statistik und Prognosewissenschaft:** deskriptive und inferenzielle Statistik, Wahrscheinlichkeitsrechnung, Bayes-Verfahren, Regression, Zeitreihen, Korrelation, kausale Inferenz, Unsicherheits- und Fehlerrechnung, Simulationen, Monte-Carlo-Verfahren, Modellvalidierung und Backtesting.
6. **Medizin und Gesundheitswissenschaften:** Anatomie, Physiologie, Pathologie, Diagnostik, Pharmakologie, Epidemiologie, Prävention, Rehabilitation und evidenzbasierte Medizin.
7. **Sportwissenschaft und Sportmedizin:** Trainingslehre, Leistungsphysiologie, Biomechanik, Belastungssteuerung, Regeneration, Leistungsdiagnostik, Sporternährung, Sportpsychologie, Verletzungsprävention und Return-to-Play.
8. **Informatik und KI:** Programmierung, Algorithmen, Datenstrukturen, Softwarearchitektur, Datenbanken, Netzwerke, Betriebssysteme, Cybersecurity, Cloud, APIs, Automatisierung, Machine Learning, Deep Learning, NLP, Test- und Qualitätssicherung.
9. **Börse, quantitative Finanzen und Wirtschaft:** Aktien, Anleihen, ETFs, Indizes, Devisen, Rohstoffe, Derivate, Optionen, Futures, Unternehmensanalyse, Bilanzanalyse, Fundamentalanalyse, technische Analyse, Rendite, Zinseszins, Volatilität, Korrelation, Portfolio-Theorie, Risikomanagement, Makroökonomie, quantitative Modelle, Szenarien und Backtesting.
10. **Ethik, Philosophie und Erkenntnistheorie:** Verantwortung, Wissenschaftsethik, Entscheidungslogik, Erkenntnisgrenzen, Argumentationsprüfung und Umgang mit Zielkonflikten.
11. **Ethnologie und Sozialwissenschaften:** Kulturen, Gesellschaften, Verhalten, Psychologie, Soziologie, Kommunikation und interkulturelle Zusammenhänge.
12. **Ingenieurwissenschaften:** Elektrotechnik, Maschinenbau, Mechatronik, Regelungstechnik, Verfahrenstechnik, Materialwissenschaft, Energietechnik, Messtechnik und technische Simulation.
13. **Weitere Grundlagen:** Rechtswissenschaft, Wirtschaftswissenschaft, Geowissenschaften, Klima und Umwelt, Astronomie, Ernährungswissenschaft und Linguistik.

### 35.2 Fachliche Anwendung statt bloßer Wissenssammlung
Das Ziel ist nicht ein Lexikon mit Definitionen. MESSINHO soll passende Methoden auswählen und tatsächlich anwenden können:
- Formeln und Einheiten korrekt auswählen, Berechnungen durchführen und Rechenschritte nachvollziehbar darstellen.
- Datenqualität, Stichprobengröße, Annahmen, Modellgrenzen und mögliche Verzerrungen prüfen.
- Prognosen als Szenarien bzw. Wahrscheinlichkeiten mit Unsicherheitsbereichen ausgeben, niemals als sichere Zukunftsbehauptung.
- Ergebnisse reproduzierbar machen: Eingaben, Methode, Version, Parameter, Datenstand und Ergebnis dokumentieren.
- Fachwissen domänenübergreifend verbinden, aber Fachgrenzen und unzulässige Schlussfolgerungen beachten.
- Bei unzureichenden Daten gezielt nachfragen oder die Aussage begrenzen, statt Lücken zu erfinden.

### 35.3 Zielarchitektur
Die geplante **MESSINHO Knowledge Intelligence** wird als eigener, mit Conversation Engine und Agent Core verbundener Architekturstrang entwickelt:
- **Knowledge Registry / Ontologie:** Domänen, Konzepte, Definitionen, Einheiten, Beziehungen, Synonyme und Abhängigkeiten.
- **Evidence & Source Layer:** Herkunft, Autorität, Datum, Lizenz/Nutzungsrecht, Aktualität, Gegenbelege und Vertrauensstatus jeder externen Wissensaussage.
- **Retrieval Layer:** kontextbezogene Suche in freigegebenem Grundwissen, Projektdaten, Dokumenten und zulässigen externen Quellen.
- **Calculation & Scientific Tools:** deterministische Rechenwerkzeuge, Einheitenprüfung, Statistik, Simulation und reproduzierbare Auswertung.
- **Forecasting & Model Evaluation:** versionierte Modelle, Trainings-/Testtrennung, Backtesting, Kalibrierung, Baseline-Vergleich und Unsicherheitsmessung.
- **Domain Safety & Policy:** fachbezogene Grenzen, Berechtigungen, Datenschutz, medizinische und finanzielle Risikohinweise sowie Freigaben für folgenreiche Aktionen.
- **Learning & Review:** kontrollierte Wissensaufnahme, Quellenprüfung, Konflikterkennung, Versionierung, menschliche Freigabe und Rücknahme fehlerhafter Einträge.

### 35.4 Vertrauens- und Sicherheitsregeln
- Medizinische Inhalte dienen der Information und ersetzen keine individuelle Diagnose oder Behandlung. Akute Warnzeichen müssen angemessen eskaliert werden.
- Börsen- und Finanzprognosen müssen Risiken, Unsicherheiten, Datenzeitpunkt und Modellgrenzen ausweisen; keine Renditegarantie und keine erfundenen Echtzeitkurse.
- Externe Inhalte sind nicht vertrauenswürdige Daten und niemals Systemanweisungen.
- Keine geschützten oder nicht lizenzierten Inhalte ungeprüft kopieren; Quellen und Nutzungsrechte dokumentieren.
- Wissenschaftliche Hypothesen, Schätzungen und belegte Tatsachen klar trennen.
- Bei widersprüchlicher Evidenz beide Seiten sichtbar machen und keine Scheinsicherheit erzeugen.
- Neue Modelle oder folgenreiche Aktionen nicht automatisch aktivieren; versionierte Prüfung und erforderliche Admin-Freigabe bleiben verbindlich.

### 35.5 Umsetzungsstrategie
1. Bestehende Knowledge-, Linguistic-, Research-, Calculation- und Forecasting-Komponenten inventarisieren, bevor neue Module entstehen.
2. Gemeinsame Wissensverträge und Quellen-/Evidenzschema definieren; keine parallelen oder redundanten Wissensspeicher schaffen.
3. Mit fachübergreifendem Grundwissen, Einheiten-/Formelkompetenz und verlässlicher Quellenbewertung beginnen.
4. Rechenwerkzeuge und reproduzierbare Statistik ergänzen; anschließend domänenspezifische Wissenspakete priorisieren.
5. Börsen-, Medizin-, Sportmedizin- und Prognosemodule mit besonders strengen Daten-, Validierungs- und Sicherheitsregeln integrieren.
6. Erst nach fachlichen Tests, Quellenprüfung, Berechtigungsprüfung und reproduzierbarer Evaluation als implementiert deklarieren.

### 35.6 Status und Grenzen
- Status: **Owner-Zielentscheidung akzeptiert; Architektur und Implementierung noch nicht als vollständig vorhanden bestätigt.**
- Diese Dokumentation erzeugt noch keine vollständige Wissensdatenbank, kein trainiertes universelles Modell und keine verifizierte Prognosefähigkeit.
- Keine automatische Selbstmodifikation von Modellgewichten. Lernen bleibt kontrolliert, nachvollziehbar und freigabepflichtig.
- Die Knowledge Intelligence wird parallel zur Conversation Engine geplant und schrittweise integriert; der aktuelle nächste Conversation-Engine-Schritt darf nicht ohne Code-Audit als erledigt übersprungen werden.
- Arbeitsgrenze bleibt Feature-Branch und STAGING-only; Produktion, Produktionsdaten und PFMS/PFSS bleiben unangetastet.

### Change & Decision Log — Ergänzung
| 2026-11-28 | MESSINHO als universellen Wissens- und Problemlösungsagenten mit Biologie, Physik, Chemie, Mathematik, Statistik/Prognosen, Medizin, Sportmedizin, Sportwissenschaft, Informatik/KI, Börse/quantitativen Finanzen, Ethik, Ethnologie, Ingenieur- und weiteren Wissenschaften ausbauen; Fußball/Scouting bleibt Spezialisierung. | Accepted — target architecture | Neuer Knowledge-Intelligence-Strang; evidenzbasiert, rechnerisch anwendbar, risikobewusst und kontrolliert lernend; Feature-Branch/STAGING-only. |

## 36. Block 14 — Semantic Intelligence: Relation Candidates — 2026-11-28

### Ziel
Die vorhandene semantische Analyse erkennt bereits begrenzte Konzepte und Diskursmerkmale. Block 14 ergänzt eine getrennte, nachvollziehbare Ebene, die aus diesen vorhandenen Signalen vorsichtige Beziehungen als Kandidaten ableitet. Es wird kein vollständiges Sprachverständnis behauptet.

### Implementierung auf dem Feature-Branch
- Neu: `backend/messinho-semantic-relations.js`.
- Die Komponente verarbeitet die bestehenden semantischen Frames und erzeugt drei begrenzte Kandidatentypen:
  - `qualification_candidate`: Negations-/Unsicherheitshinweise bei erkannten Konzepten; der genaue Geltungsbereich bleibt ausdrücklich ungeklärt.
  - `contrast_candidate`: expliziter Kontrast zwischen benachbarten semantischen Segmenten.
  - `concept_recurrence_candidate`: wiederkehrende Konzepte als möglicher thematischer Zusammenhang zwischen Segmenten.
- Unbekannte Konzepte werden verworfen; Eingabe und Ausgabe sind auf 12 Frames, 8 Konzepte je Frame und 30 Beziehungen begrenzt.
- `backend/messinho-linguistic-intelligence.js` integriert die Relation Candidates in den Gesprächskontext und in die stabile Chat-Metadatenantwort; Version auf 1.5.0 erhöht.
- Die Gesprächsrichtlinie bezeichnet diese Ausgaben ausdrücklich als begrenzte Kandidaten und untersagt vollständige semantische Parse-Claims, ungelöste Referenzauflösung und unbelegte Kausalität.
- Neue Tests: `tests/messinho-semantic-relations.test.js`; Integrationstests in `tests/messinho-linguistic-intelligence.test.js`.

### Grenzen
- Die Kandidaten beruhen auf vorhandenen lexikalischen und Diskurssignalen. Sie sind keine verifizierten Bedeutungsrelationen.
- Negations- und Unsicherheitsbereich, Pronomen-/Entitätsauflösung, Ironie, implizite Bedeutung und Kausalität werden nicht vollständig erkannt.
- Keine automatische Textumschreibung, keine Modellgewichtsänderung und kein selbstständiges Modelltraining.
- Die neue universelle Wissensarchitektur aus Abschnitt 35 wird dadurch noch nicht als implementiert betrachtet.

### Tests, Build und Deployment
### Verification addendum — 2026-11-28
- Der erste STAGING-Build auf Commit `7e0b223f9243b59b7d42efa2d064c641bd8f659b` deckte einen veralteten Versionserwartungswert in einem bestehenden Metadatentest auf (`1.4.0` statt `1.5.0`). Der Test wurde korrigiert; keine Laufzeitlogik musste dafür zurückgenommen werden.
- Korrigierter exakter Code-/Testcommit: `b4f04768b1e89c04377d71d199053a625d016b13`.
- Render STAGING Build `bld-dc54t7p7lnhs73alda90`: **succeeded**.
- Vollständige Node-Testausgabe: **672 bestanden, 0 fehlgeschlagen**.
- Backend-Syntaxprüfung ist Teil des Render-Buildbefehls und wurde nach der Testsuite ausgeführt; Vite-Produktionsbuild: **erfolgreich**, 1.640 Module transformiert.
- Render-Deployment `dep-dc54t7p7lnhs73alda8g`: Build erfolgreich; Service-Update/LIVE-Bestätigung zum Zeitpunkt dieses Addendums noch in Bearbeitung.
- GitHub Actions Commit-Abfrage lieferte für diesen Commit keine PR-Workflow-Läufe; die hier dokumentierte Test-/Build-Evidenz stammt aus dem exakten Render-Build.
- Implementierungs-/Integrationscommit: `7e0b223f9243b59b7d42efa2d064c641bd8f659b`.
- Render STAGING-Build/Deploy: `dep-dc54smp7lnhs73albhqg` — zum Zeitpunkt dieses Eintrags in Bearbeitung; keine Live-Aussage vor erfolgreicher Abschluss- und Health-Prüfung.
- GitHub Actions Status für diesen Commit: noch kein PR-Workflow-Ergebnis über die verfügbaren Commit-Abfragen sichtbar.
- Vollständige Node-Testzahl, Backend-Syntax, Vite-Build und Live-Status werden erst nach tatsächlichem Abschluss ergänzt.
- Keine Datenbankmigration und keine Änderung persistierter Nutzer-, Spieler-, Scout- oder Lerndaten.
- Ausschließlich `feature/messinho-conversation-engine` und der vereinbarte STAGING-Service; Produktion bleibt unangetastet.

### Nächste Schritte
1. Render-Buildabschluss und Testausgabe prüfen; bei Fehlern anhand des konkreten Logs korrigieren.
2. Exakten deployten Commit und Status `live` bestätigen.
3. STAGING-Health und Laufzeitlogs prüfen.
4. Semantische Fälle mit Mehrdeutigkeit, negierter Bewertung, Unsicherheit, Kontrast, Code-Switching und neutralen Sätzen ergänzen.
5. Danach Block 15 — Intent Intelligence — nur nach Audit der bereits vorhandenen Intent-/Router-Komponenten planen und Überschneidungen vermeiden.

### Block 14 STAGING deployment verification — 2026-11-28
- Render service: `myscoutingdatabase-messinho-staging` (`srv-dc3chlqjnfac73acd6ig`); configured branch `feature/messinho-conversation-engine`; automatic deployment remains disabled.
- Deployed runtime commit: `b4f04768b1e89c04377d71d199053a625d016b13`.
- Render deployment: `dep-dc54t7p7lnhs73alda8g` — status **live**, finished `2026-11-28T03:47:17.854285Z`.
- Render build `bld-dc54t7p7lnhs73alda90`: **succeeded**; npm test **672 passed, 0 failed**; backend syntax checks passed; Vite production build succeeded.
- Runtime logs confirmed `node backend/server.js`, API listening on port 10000, Supabase Data API HTTP 200, and Render reported “Your service is live”.
- STAGING URL: https://myscoutingdatabase-messinho-staging.onrender.com
- The documentation-only follow-up commit is separate from the deployed runtime commit; it does not change application code and was not redeployed.
- No database/schema migration or persistent user/player/scout/learning data changes. No model training, model-weight changes, permission changes or external side effects.
- Authenticated Admin/Scout conversation acceptance remains outstanding; deployment verifies automated tests, build and service startup, not full natural-dialogue quality.
- PR #58 remains open, Draft and unmerged. Production branch, Render production service and production database remain untouched.

## 37. Block 15 — Intent Intelligence: Bounded Intent Evidence — 2026-11-28

### Ziel und Abgrenzung
Block 15 ergänzt die bestehende modellbasierte kognitive Intent-Entscheidung um eine eigenständige, deterministische und begrenzte Evidenzschicht. Die Schicht sammelt sichtbare Handlungs-, Themen- und Gesprächssignale, entscheidet aber nicht selbst über die endgültige Absicht. Damit werden weder der vorhandene Cognitive Router noch Pragmatic Context, Response Composition oder Clarification Continuity dupliziert.

### Implementierung
- Neu: `backend/messinho-intent-intelligence.js`, Version `1.0.0`.
- Neu: `tests/messinho-intent-intelligence.test.js`.
- Die Analyse liefert vorsichtige Kandidaten für:
  - `memory_save` und `memory_recall`,
  - `scouting`,
  - `general_research`,
  - `engineering`,
  - andernfalls den neutralen Gesprächsstandard `conversation`.
- Zusätzlich werden begrenzte Themenhinweise (Fußball, Wissenschaft, Finanzen, Software), Frage-/Handlungsform, mögliche Gesprächsfortsetzung und offene Rückfragen als Metadaten übergeben.
- Mehrere konkurrierende explizite Intent-Kandidaten führen zu `conflicting_candidates` und einer nicht gesetzten Empfehlung.
- Eine noch offene/mehrdeutige Rückfrage führt zu `clarification_pending`; die Schicht erzwingt dann keine neue Aktion.
- Der Text wird auf 1.600 Zeichen begrenzt; Kandidaten und Cue-Listen sind begrenzt.
- Sprachsignale umfassen ausgewählte deutsche, englische, französische, spanische, arabische und tunesisch-derja Formulierungen. Dies ist ein gezielter Cue-Katalog, keine vollständige mehrsprachige Grammatik oder universelle Absichtserkennung.

### Integration
- `backend/server.js` erstellt die Intent-Evidenz nach Dialog-/Klärungskontext und vor dem Cognitive Router.
- `backend/messinho-conversational-intelligence.js` nimmt `intentEvidenceContext` entgegen und übergibt es als `intent_evidence_context` im selben Modellturn.
- Cognitive Router Version auf `1.2.0` erhöht.
- Die Modellrichtlinie behandelt Hinweise ausdrücklich als Kandidaten. Das Modell muss die vollständige Nachricht und den Gesprächskontext interpretieren; ein vorgeschlagener Intent ist keine Entscheidung.
- Rollenmetadaten sind keine Berechtigungen. Die bestehende serverseitige Admin-/Scout-Autorisierung und alle Freigabekontrollen bleiben maßgeblich. Die neue Komponente führt keine Tools aus und speichert keine Daten.

### Test- und Korrekturverlauf
- Die ersten STAGING-Testläufe deckten drei konkrete Integrations-/Erkennungsprobleme auf: bestehende Quelltexttests erwarteten die frühere Argumentreihenfolge, der Scouting-Cue erfasste beschreibende Positionskomposita zunächst nicht, und die Fußball-Domänenerkennung erkannte `Flügelspieler` nicht als Kompositum.
- Diese Punkte wurden korrigiert und erneut gegen den vollständigen Build geprüft.
- Finaler Runtime-/Testcommit: `12830ea3304f5dfa8758153484977508f353fab5`.
- Finaler Render-Build `bld-dc55117f3r2c73di4320`: **succeeded**.
- Node-Testausgabe: **683 bestanden, 0 fehlgeschlagen**.
- Backend-Syntaxprüfung: erfolgreich (Teil des Render-Buildbefehls).
- Vite-Produktionsbuild: erfolgreich.
- Render-Deployment `dep-dc55117f3r2c73di4310`: **live**, abgeschlossen `2026-11-28T03:55:21.837265Z`.
- Laufzeitlogs bestätigten `node backend/server.js`, API auf Port 10000, Supabase Data API HTTP 200 und Render-Meldung `Your service is live`.

### Grenzen und offene Validierung
- Intent-Kandidaten sind lexikalische Evidenz und können bei ungewöhnlicher Formulierung fehlen oder irreführen. Das ist beabsichtigt: sie dürfen nicht selbst Aktionen auslösen.
- Der finale Intent bleibt Aufgabe des Cognitive Routers; niedrige Konfidenz, Mehrdeutigkeit und Berechtigungen werden weiterhin durch die vorhandenen Anwendungskontrollen behandelt.
- Der automatisierte Testlauf belegt Regressionen, Datenfluss und Build. Ein echter, authentifizierter Admin-/Scout-Abnahmetest mit realen Dialogen und Provider bleibt noch durchzuführen.
- Keine DB-Migration, keine Änderungen persistierter Nutzer-/Spieler-/Scoutdaten, keine Modellgewichtsänderung und kein automatisches Training.
- STAGING-only; Produktion bleibt unangetastet.

### Nächster Schritt — Block 16: Context Intelligence
Vor Implementierung die bestehenden Dialogue-, Conversation-Memory-, Continuity-, Entity-Resolution- und Reasoning-Module erneut abgleichen. Block 16 soll einen kompakten, priorisierten Gesprächs-Kontextvertrag bereitstellen, der aktive Absicht, offene Fragen, bestätigte Einschränkungen, Korrekturen und Themenwechsel sauber trennt. Bereits vorhandene Funktionen nicht parallel neu bauen und keine unbestätigten Assistenten-Aussagen als Nutzerfakten speichern.

### Change & Decision Log — Ergänzung
| 2026-11-28 | Intent Intelligence als Evidenzschicht vor dem modellbasierten Cognitive Router ergänzen; keine starre Keyword-Routing-Engine. | Implemented — Block 15 | Kandidaten, Konflikte, Domänenhinweise und Klärungsstatus werden im selben Modellturn übergeben; endgültige Absicht und Autorisierung bleiben getrennt. |


## 38. Block 16 — Context Intelligence: Prioritized Conversation Context — 2026-11-28

### Ziel und Abgrenzung
Block 16 bündelt vorhandene Dialogue-, Clarification-, Conversation-Continuity-, Conversation-Memory-, Entity-Resolution-, Reasoning- und Intent-Evidenz in einen kleinen, priorisierten Kontextvertrag. Die vorhandenen Spezialmodule bleiben für ihre jeweilige Aufgabe zuständig; die neue Schicht dupliziert weder Pronomenauflösung noch Frageklassifikation oder Gedächtnisspeicherung.

### Implementierung
- Neu: `backend/messinho-context-intelligence.js`, Version `1.0.0`.
- Neu: `tests/messinho-context-intelligence.test.js`.
- Kontextpriorität: aktuelle Nutzernachricht, explizite Korrektur/Themenwechsel, offene Klärung, serverseitige Autorisierung, belegte Entity-Auflösung, jüngerer Nutzerkontext, Assistentenbeiträge nur als Hypothese/Frage.
- Trennt Nutzeräußerungen (zugeschrieben, nicht verifiziert) von Assistentenaussagen (niemals Nutzerfakten).
- Führt aktive Themenkandidaten, Intent-Kandidaten, offene Rückfragen, Korrekturen, Themenwechsel, Entity-Mehrdeutigkeit und Antwortkandidaten in einem begrenzten Vertrag zusammen.
- `confirmed_user_constraints` bleibt bewusst leer, solange keine dedizierte Bestätigungsquelle eine Einschränkung explizit bestätigt. Antworten auf Rückfragen bleiben als Kandidaten gekennzeichnet.
- Korrekturen überschreiben nur die widersprochene Interpretation. Bei Themenwechsel werden alte Filter nicht übernommen.
- Die Schicht ist rein ableitend pro Request; keine neue Persistenz, keine DB-Migration, kein Training und keine Modellgewichtsänderung.

### Integration
- `backend/server.js` erstellt den Kontextvertrag nach den vorhandenen Dialog-, Klärungs-, Entity-, Reasoning- und Intent-Komponenten und übergibt ihn im selben Chat-Turn.
- `backend/messinho-conversational-intelligence.js` übergibt `context_intelligence_context` an den Cognitive Router; Version auf `1.3.0` erhöht.
- Der Modellprompt behandelt den Vertrag als beratende Evidenz, nicht als Autorisierung oder verifizierte Wissensquelle.
- Die bestehenden serverseitigen Admin-/Scout-Berechtigungen bleiben unverändert.

### Verifikation und Grenzen
- Neue Tests decken Quellenzuordnung, Korrekturen, Themenwechsel, offene Klärungen, mehrdeutige Entity-Referenzen und Begrenzung ab.
- Die endgültige Testzahl, Syntaxprüfung, Vite-Build und Render-LIVE-Bestätigung werden nach dem STAGING-Build ergänzt.
- Authentifizierte Admin-/Scout-End-to-End-Abnahme bleibt separat erforderlich; ein erfolgreicher Build allein beweist keine menschenähnliche Gesprächsqualität.
- STAGING-only; Produktion bleibt unangetastet.

### Nächster Schritt — Block 17
Vorhandene Antwortkomposition, Reasoning-Validierung, Conversation-Response-Guard und Natural-Conversation-Fallback abgleichen. Darauf aufbauend die semantische Antwortplanung verbessern: direkte Antwort, Begründung, Unsicherheitsmarkierung und eine gezielte Rückfrage — ohne starre Antwortschablonen und ohne erfundene Tatsachen.


### Block 16 STAGING verification addendum — 2026-11-28
- Initial build exposed three stale source-wiring assertions after the new context argument was added to the chat router. The assertions were updated to verify the additional context contract; no runtime behavior was rolled back.
- Final runtime/test commit: `b1906f21ae116b5efcd9ee9508fb0eb5c798a801`.
- Render build: `bld-dc553cuc6qcc73fp15o0` — **succeeded**.
- Full Node test suite: **689 passed, 0 failed**.
- Backend syntax checks completed as part of `npm run build`; Vite production build completed successfully (`built in 2.54s`).
- Render deployment: `dep-dc553cuc6qcc73fp15ng`; service startup logs confirmed `node backend/server.js`, API listening on port 10000, Supabase Data API HTTP 200 and Render `Your service is live`.
- Configured service remains `myscoutingdatabase-messinho-staging`, branch `feature/messinho-conversation-engine`, `autoDeploy: no`; deployment was manually triggered.
- Documentation follow-up is separate from the deployed runtime commit and does not change application code.
- No DB/schema migration, persistent user/player/scout/learning data mutation, model training, model-weight change or permission change. Production remains untouched.
- Authenticated Admin/Scout real-dialogue acceptance remains outstanding; automated tests and service startup do not establish human-level conversation quality.


## 39. Block 17 — Response Intelligence: Semantic Answer Planning — 2026-11-28

### Ziel und Abgrenzung
MESSINHO soll nicht nur Gesprächsabsicht und Kontext erkennen, sondern die Antwort passend planen: direkte Antwort, nachvollziehbare Begründung, ehrliche Unsicherheitsmarkierung und höchstens eine notwendige Rückfrage. Die Planung ist keine starre Vorlage und erzeugt weder Fakten noch Berechtigungen.

### Implementierung
- Neu: `backend/messinho-response-intelligence.js`, Version `1.0.0`.
- Neu: `tests/messinho-response-intelligence.test.js`.
- Antwortziele: direkte Antwort mit Begründung, Korrektur/Einwand neu bewerten, Standpunkt aufnehmen, relevante Unterhaltung fortsetzen, gezielt klären oder natürlich auf einen Gesprächsbeitrag reagieren.
- Evidenzbasis unterscheidet strukturierte Recherchebezüge, bloßen Gesprächskontext und fehlenden bereitgestellten Kontext.
- Unsicherheitsvertrag trennt strukturierte Evidenz, Nutzeraussagen, frühere Assistentenaussagen sowie Schlussfolgerungen/Hypothesen.
- Rückfragenpolitik: maximal eine gezielte Frage und nur, wenn die fehlende Information die Antwort oder den sicheren nächsten Schritt wesentlich verändert.
- Bei Korrekturen muss die vorherige Begründung neu geprüft werden; bei Mehrdeutigkeit wird nicht geraten.
- Keine autonome Recherche, Toolausführung, Berechtigungsänderung, Datenpersistenz oder Trainingsänderung durch dieses Modul.

### Integration
- `backend/server.js` erstellt den Response-Plan im selben Chat-Turn aus Antwortkomposition, Kontextintelligenz, Reasoning-Evidenz, Klärungsstatus und Sprachkontext.
- `backend/messinho-conversational-intelligence.js` übergibt den Plan bereits an den semantischen Router, damit Routing und Antwortziel zusammenpassen; Version auf `1.4.0` erhöht.
- `backend/messinho-natural-conversation.js` erhält denselben Plan für die eigentliche natürlichsprachliche Antwort; Version auf `1.1.0` erhöht.
- Bestehende Reasoning-Validierung und Conversation-Response-Guard bleiben aktiv und werden nicht ersetzt.

### Verifikation und Grenzen
- Neue Tests prüfen Antwortreihenfolge, Korrekturbehandlung, Mehrdeutigkeit, Evidenzklassifikation, Themenwechsel, Begrenzung sowie die Übergabe an beide Modellaufrufe.
- Abschließende Node-Tests, Syntaxprüfung, Vite-Build und Render-STAGING-Deployment werden im Verifikationsnachtrag dokumentiert.
- Ein erfolgreicher Testlauf belegt nicht automatisch natürliche Gesprächsqualität in echten Admin-/Scout-Sitzungen; diese Abnahme bleibt erforderlich.
- STAGING-only; Produktion bleibt unangetastet.


### Block 17 STAGING verification addendum — 2026-11-28
- Final runtime/test commit: `053fd4e26c28e39d665ae3360cef61a97ec1e147`.
- Render build: `bld-dc555l17lnhs73ambc30` — **succeeded**.
- Full Node test suite: **698 passed, 0 failed**.
- Backend syntax checks completed in `npm run build`; Vite production build succeeded (`built in 2.27s`).
- Render deployment: `dep-dc555l17lnhs73ambc1g`; startup confirmed `node backend/server.js`, API listening on port 10000, Supabase Data API HTTP 200 and Render `Your service is live`.
- Service remains STAGING-only on `feature/messinho-conversation-engine`; `autoDeploy: no`, manually deployed.
- No DB/schema migration, persistent user/player/scout/learning data mutation, model training, model-weight change or permission change. Production remains untouched.
- Authenticated Admin/Scout conversation acceptance remains outstanding; build and tests do not establish human-level dialogue quality.
- The initial build found stale source-wiring assertions after the new response-plan argument was inserted; those tests were updated and the final full build passed.


## 40. Block 18 — Reasoning Intelligence: Explainable Problem Planning — 2026-11-28

### Ziel und Abgrenzung
MESSINHO erhält eine allgemeine, begrenzte Reasoning-Planungsschicht. Sie strukturiert mehrteilige Aufgaben, hält einfache Fragen bewusst einfach, erkennt relevante Vergleichs- und Rechenaufgaben und trennt Belege, Nutzeraussagen, frühere Assistentenaussagen, Annahmen, Hypothesen, Unbekanntes und mögliche Widersprüche.
Die Komponente erzeugt eine kurze, nutzerorientierte Begründungsstruktur. Sie speichert oder offenbart keine private interne Gedankenkette, vergibt keine künstlichen Konfidenzwerte und ersetzt keine deterministischen Validierungs- oder Berechtigungskontrollen.

### Implementierung
- Neu: backend/messinho-reasoning-intelligence.js, Version 1.0.0.
- Neu: tests/messinho-reasoning-intelligence.test.js.
- Aufgabenarten: Vergleich, Berechnung, Planung, Verifikation, Erklärung und allgemeine Aufgaben.
- Komplexitätsstufen: simple, multi_part, complex; einfache Anfragen erhalten genau einen Antwortschritt, mehrteilige Aufgaben maximal vier begrenzte Planungsschritte.
- Vergleichsplanung benennt relevante Kriterien wie Kosten, Risiko, Zeit und Qualität, ohne Optionen oder Ergebnisse zu erfinden.
- Rechenplanung prüft Eingaben, Formelannahmen, Einheiten, Arithmetik und Ergebnisinterpretation.
- Evidenz-Ledger trennt verifizierte, ausdrücklich übergebene Evidenz von Nutzerbehauptungen, früheren Assistentenaussagen, Annahmen, Hypothesen, Unbekanntem und Korrektur-/Widerspruchskandidaten.
- Eine Korrektur wird als Prüfauftrag behandelt, nicht als automatischer Beweis, dass eine der Aussagen wahr oder falsch ist.
- Ausgabe ist begrenzt; numerische Konfidenz wird ohne kalibrierte Evidenz ausdrücklich nicht berechnet.

### Integration
- backend/server.js erstellt pro Chat-Turn einen einzigen Reasoning-Plan auf Basis der aktuellen Nachricht, des Gesprächsverlaufs sowie der vorhandenen Reasoning-, Kontext- und Antwortverträge.
- backend/messinho-conversational-intelligence.js erhält reasoning_intelligence_context bereits im semantischen Router-Turn.
- backend/messinho-natural-conversation.js erhält denselben Plan für die eigentliche natürlichsprachliche Antwort.
- Die vorhandene messinho-reasoning-validation.js bleibt als deterministische Schutzschicht erhalten; Block 18 ersetzt sie nicht.
- Keine neue Aktion, Toolausführung, Berechtigung, Persistenz oder Datenbankoperation wird durch die neue Planungsschicht freigegeben.

### Tests
- Mehrteilige Aufgabenzerlegung und Begrenzung.
- Einfache Frage ohne unnötige Zerlegung.
- Rechenplanung mit Einheiten-/Arithmetikprüfung.
- Getrennte Attribution von Nutzer- und Assistentenaussagen.
- Annahmen/Hypothesen getrennt von verifizierter Evidenz.
- Mehrdeutige Referenzen und fehlende strukturierte Evidenz als Unbekanntes.
- Korrekturen als Widerspruchskandidaten statt als Wahrheitsentscheidung.
- Begrenzung, fehlende künstliche Konfidenz sowie ausgewählte mehrsprachige Signale.
- Übergabe desselben Plans an Cognitive Router und Natural Conversation Composer.

### Sicherheits- und Datenumfang
- Keine DB-/Schema-Migration.
- Keine Änderung persistierter Nutzer-, Spieler-, Scout-, Organisations- oder Lerndaten.
- Keine Modellgewichtsänderung und kein automatisches Training.
- Bestehende serverseitige Admin-/Scout-Autorisierung bleibt unverändert.
- STAGING-only; Produktion bleibt unangetastet.

### Verifikation
- Implementierung und Quelltextintegration sind erfolgt.
- Vollständige Node-Tests, Syntaxprüfung, Vite-Build und Render-STAGING-Deployment stehen bis zum Verifikationsnachtrag aus.
- Authentifizierte Admin-/Scout-End-to-End-Abnahme bleibt separat erforderlich.

