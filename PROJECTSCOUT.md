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
3. The current operating instruction is to work toward the **production LIVE system** so the owner can see and test changes immediately. Production changes require extra care: inspect current code, understand dependencies, run appropriate tests, deploy, and verify the actual Render deployment before reporting success.
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
8. Keep the direct single-capability execution route disabled; audit and correct truthful runtime coverage/status reporting.
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
