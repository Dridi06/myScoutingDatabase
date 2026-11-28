# MESSINHO — Knowledge Foundation and Autonomous Expansion

Status: Implemented foundation schema and retrieval wiring on STAGING branch; knowledge content ingestion remains gated.
Date: 2026-11-26
Repository: Dridi06/myScoutingDatabase
Branch: feature/messinho-conversation-engine
Environment: dedicated STAGING only

## Owner requirements (fixed)
- Build the foundation before expanding specialist knowledge; later learning must build on the existing foundations rather than replace them.
- Preserve knowledge permanently and retrieve it automatically across relevant MESSINHO capabilities.
- Store compact, independently worded knowledge only. Do not archive complete books, PDFs, full-text dumps or unnecessary media.
- Use sources only where the exact work's rights permit automated processing, AI/TDM, adaptation and commercial use. Free-to-read is not proof of reuse permission.
- Keep risk management, banking and financial markets as first-class domains alongside mathematics, statistics, physics, biology, medicine, sports science, football and computer science.
- Detect gaps, research, compare, connect and improve knowledge autonomously, but never silently overwrite conflicting facts or alter active scoring/model weights without governance.

## Domain map and learning progression

Every domain uses four linked levels: foundational → intermediate → advanced → specialist. A higher-level concept must point to a parent concept or explicit prerequisite concepts.

| Domain | Foundational → specialist coverage |
|---|---|
| Mathematics | Arithmetic, fractions, ratios, algebra and geometry → functions, equations and trigonometry → calculus, linear algebra, optimization → numerical methods and mathematical modelling |
| Statistics | Data types, descriptive statistics and probability → distributions, sampling and inference → regression, Bayesian methods, time series and uncertainty → calibration, causal inference and forecasting validation |
| Physics | Units, vectors, motion and forces → energy, momentum, pressure and fluids → electricity, waves and rotational mechanics → biomechanics and applied modelling |
| Chemistry | Matter, atoms, elements and the periodic table → bonding, reactions, acids/bases and stoichiometry → thermochemistry, kinetics and equilibrium → analytical, organic and biochemical applications |
| Biology | Cells, genetics and basic physiology → organ systems, metabolism and homeostasis → adaptation, neuromuscular and molecular mechanisms → performance biology and evidence synthesis |
| Medicine | Anatomy, physiology and medical terminology → common conditions and injury mechanisms → orthopaedics, sports medicine and rehabilitation → guideline appraisal and safe return-to-sport evidence (not autonomous diagnosis or clearance) |
| Ethics | Moral concepts, duties, consequences and rights → deontology, consequentialism and virtue ethics → research, medical and professional ethics → AI ethics, fairness, accountability and applied case analysis |
| Sports science | Training principles and fitness components → physiology, biomechanics and load → periodization, performance testing and recovery → integrated athlete development and injury-risk evidence |
| Football | Laws, roles, positions and basic tactics → technical/tactical principles and match analysis → positional models, team structures and development → scouting intelligence, player projection and competition context |
| Computer science / AI | Data structures, algorithms and databases → software design, APIs and security → machine learning, NLP and retrieval → agent planning, evaluation, governance and reliability |
| Risk management | Risk vocabulary, likelihood, impact and controls → risk registers and qualitative assessment → quantitative risk, VaR, expected shortfall, stress/scenario tests → model risk, portfolio/enterprise risk and governance |
| Banking | Bank balance sheets and core products → deposits, lending, credit and liquidity → capital, funding, interest-rate and operational risk → prudential regulation, stress testing and systemic risk |
| Financial markets | Market participants, instruments and price formation → equities, bonds, funds and order books → derivatives, volatility, liquidity and portfolio theory → market microstructure, risk-adjusted forecasting and valuation |
| General / cross-domain | Critical thinking, source literacy and units → causal links and comparison → integrated models and uncertainty → cross-domain synthesis and hypothesis testing |

This is the coverage map, not a claim that all subjects have already been populated or verified.

## Data architecture

- messinho_knowledge_concepts: compact concept records, domain, topic, title, definition, level/type, parent, prerequisites, formula/variables, applicability, limitations, claims, sources, rights, evidence grade, confidence, status, version and review dates.
- messinho_knowledge_links: typed prerequisite, related, extends, contradicts, applies-to and derived-from links.
- messinho_knowledge_versions: append-only snapshots with change reason and actor.
- Existing messinho_domain_knowledge: retained as the legacy flat permanent knowledge layer; do not create another flat replacement.
- Existing messinho_knowledge_memory: separate owner-scoped, short-lived answer/research cache. It is not the canonical concept graph and is not neural model training.

All three graph tables are RLS-enabled and not exposed to browser roles. No anon/authenticated grants or policies exist; the backend service role is the only access path. Do not add client-side access or public policies.

## Learning and promotion rules

1. Identify a knowledge gap and classify its domain/topic.
2. Find candidate works; inspect the exact edition/page/work and rights notice.
3. Require explicit work-level rights for automated processing, AI/TDM, derivative/adaptation and commercial use. Provider metadata or a search result's license claim is not proof.
4. Extract only short relevant sections where permitted; do not store source full text or PDFs.
5. Create original, compact concept definitions, claims, formulas and limitations with precise source links/sections.
6. Require independent corroboration for factual claims, evidence grading and confidence.
7. Compare against existing concepts, prerequisites, formulas and polarity. Similarity is not proof of equivalence.
8. New knowledge is a candidate by default. Existing concept changes are not overwritten; materially different content returns conflict_requires_review.
9. Only a separate governed approval may activate a candidate or supersede an old version. Record a snapshot and audit reason.
10. Active knowledge is retrieved automatically by the existing chat and passed into scouting-agent context. Retrieval never trains model weights or silently changes player ratings.
11. Set review dates for time-sensitive knowledge; mark stale or conflicting evidence instead of presenting it as certain.

## Current legal/source gate

- backend/messinho-rights-registry.js currently contains **2 approved exact scientific works**: Wiecha et al. (2023), PLOS ONE on external validation of VO2max prediction models (CC BY 4.0 with PLOS's explicit TDM/reuse policy), and LaMonte (2022), *Cardiorespiratory Fitness in the Prevention and Management of Cardiovascular Disease* (PMCID PMC11269081, CC BY 4.0; retrieved only through PMC BioC). Both are scoped to exact article identities and approved retrieval methods.
- The source register contains 18 entries/resources and 2 approved works. OpenIntro and Grinstead/Snell remain quarantined; OpenStax is excluded pending written AI permission; NIST and other sources remain quarantined.
- STAGING canonical domain knowledge and answer-memory tables currently contain 0 rows; no source PDF/full text or knowledge concept was imported.
- The VO2max foundation adapter can create a compact candidate only after both approved works are retrieved and independently corroborate the same claim. The general learner can create a candidate from one rights-cleared work when supported by retrieved excerpts, but all candidates remain inactive. Activation requires two independent rights-cleared source domains, corroborated claims, active prerequisites and administrator review.
- Next legal research task: work-level review for mathematics, physics, biology, statistics, football/sports science, medicine, risk management, banking and financial markets, with Germany-based commercial use considered. If rights remain unclear, retain quarantine.

## Implemented in this milestone

- Added STAGING migration 20261126182955_messinho_knowledge_hierarchy.sql (applied as migration 20261126182955_messinho_knowledge_hierarchy).
- Added graph schema, typed relations and immutable version snapshots.
- Added backend/messinho-knowledge-graph.js with level/type validation, rights allowlist enforcement, single-source candidate intake (currently disabled by the empty rights allowlist) with two-independent-source approval gate, compact payloads, candidate-only insertion, conflict refusal, version snapshotting and active-only retrieval.
- Connected graph retrieval to the existing POST /api/agent/chat flow and passed retrieved concepts to the scouting agent input and conversational context.
- The general-research path can create a foundational concept candidate only when the question is a foundation-style query, source claims are corroborated, and at least one source URL resolves through the reviewed rights allowlist. Provider-supplied license flags are ignored. The current allowlist is empty, so ingestion remains blocked. A candidate is not active knowledge; administrator approval requires two independent rights-cleared source domains.
- Source URL permission matching enforces exact HTTPS origin and path boundaries, preventing lookalike hosts or prefix confusion.
- The capability runtime merges active graph concepts with legacy verified knowledge for relevant explanations. Scoring/model-weight functions remain isolated so reference knowledge cannot silently alter numerical ratings or weights.
- Added tests/messinho-knowledge-graph.test.js for level/link contracts, invalid rights, prerequisite validation and fail-closed storage behavior.
- Added an atomic service_role-only candidate creation RPC that writes the candidate and version snapshot in one transaction, plus a SECURITY DEFINER review RPC restricted to service_role and approved admins.
- Added an admin-only review queue/API, an append-only review ledger, and a conflict table that retains competing source-backed proposals instead of silently discarding them. Conflicts require explicit review.
- Conflict recording is atomic: the competing proposal and evidence are retained, the currently active concept is quarantined as conflicting, and a new immutable version snapshot is written in the same database transaction.
- Added append-only privileges for the review ledger and indexed its foreign keys.
- The graph remains empty until an authenticated foundation question completes the approved-source retrieval and candidate write. Two exact scientific works are approved for compact extraction; no books/PDFs were imported and no model weights or scoring rules were changed.

## Verification still required
- Complete CI on the latest feature commit.
- Inspect and correct any test/syntax issues reported by CI.
- Test actual authenticated chat retrieval and capability context on STAGING.
- Build an admin UI for the existing review queue APIs; the backend approval/conflict workflow is implemented.
- Expand work-level rights review to biology, medicine, sports science, football, computer science, risk management, banking and financial markets before ingesting those domains.
- Do not manually deploy until CI passes; STAGING auto-deploy is disabled. Production and main remain untouched.


## Governed ingestion, review and conflict handling (STAGING)

- Candidate concept plus initial version snapshot is written through the transactional database function `messinho_create_knowledge_candidate`; the operation rolls back as one transaction if either insert fails.
- Candidate records remain inactive. Only active concepts are available to normal knowledge retrieval.
- Admin review queue uses `GET /api/messinho/knowledge-concepts` (defaults to candidate records; supports status/domain/limit filters). Admin review uses `POST /api/messinho/knowledge/:id/review`; the backend verifies an authenticated, approved admin and rechecks the source allowlist, exact URL scopes, independent source domains, claim corroboration, active prerequisites and open conflicts before approval.
- Approval/rejection/conflict decisions are written through `messinho_review_knowledge_concept`, which updates the concept, appends a version snapshot and records the reviewer decision atomically.
- Competing source-backed proposals are retained in `messinho_knowledge_conflicts`; they are never silently overwritten. Admin-only routes list and decide open conflicts:
  - `GET /api/messinho/knowledge-conflicts`
  - `POST /api/messinho/knowledge-conflicts/:id/review`
- Conflict decisions are transactional: rejecting the proposed alternative or explicitly retaining the existing knowledge closes the conflict record. If the concept was quarantined as conflicting, its previous state (active or candidate) is restored only after all open conflicts for that concept are closed; the restoration appends a new version snapshot. The proposed concept never overwrites the existing definition.
- The review ledger and version ledger are append-only from the backend role; browser roles have no grants or RLS policies. Conflict creation/quarantine and conflict resolution/state restoration use service_role-only transactional RPCs.

## Initial source-rights screening (26 November 2026)

- OpenIntro's official licensing page says most Statistics textbooks are CC BY-SA 3.0, which permits commercial reuse with attribution and ShareAlike; exceptions and third-party figures/files still require exact edition/file review. It remains quarantined pending that review.
- OpenStax's current textbook library uses CC BY-NC-SA 4.0 by default and disallows commercial use. In addition, book-specific notices explicitly prohibit LLM training/ingestion and use in generative-AI offerings without prior written permission. This separate AI restriction applies even where an older PDF colophon states CC BY 4.0. All OpenStax works are excluded pending written permission.
- Grinstead and Snell's Dartmouth/CHANCE GNU FDL version of *Introduction to Probability* explicitly permits commercial redistribution and modification, but GNU FDL copyleft can apply to adapted versions. It remains quarantined until legal review determines how the share-alike terms apply to compact concepts in this product. The exact GNU version and its no-invariant-sections notice must be retained.
- Book of Proof (CC BY-NC-ND) and MIT OCW 6.042J (CC BY-NC-SA) are excluded under their current non-commercial/no-derivatives terms.
- U.S. federal/NIST works may be public domain in the United States, but official government guidance warns that third-party content may remain protected and that U.S. public-domain status alone does not settle international rights. NIST candidates therefore remain quarantined for the Germany-based product.
- No source was promoted into the rights allowlist. The allowlist remains empty; no source content was imported.


## Approved-source retrieval and first curriculum adapter

- `backend/messinho-approved-source-ingestion.js` retrieves only the exact approved PLOS article through its JATS XML endpoint and the exact PMC article through PMC's BioC JSON endpoint.
- Relevant excerpts are transient, bounded and used only to verify source support. The candidate record stores no excerpt, PDF, full-text, figure or table payload.
- `backend/messinho-approved-knowledge-learning.js` is the first domain adapter for VO2max/cardiorespiratory-fitness foundations. It requires both approved source domains to support the same compact claim and creates a candidate only.
- `backend/messinho-knowledge-learning.js` provides the general foundation-query learning path for other future approved sources; it verifies official excerpts before storing compact claims.
- Both learning paths call the same canonical graph store, preserve exact source/licence/attribution/retrieval metadata, and leave the record inactive until the administrator review workflow approves it.
- The VO2max knowledge is not a player-specific prediction. The PLOS validation paper reports that existing prediction models have only moderate accuracy in its endurance-athlete cohort; direct CPET measurement remains the reference method. MESSINHO must retain these limitations in any scouting explanation.
