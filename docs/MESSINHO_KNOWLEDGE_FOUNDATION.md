# MESSINHO — Knowledge Foundation and Autonomous Expansion

Status: Implemented foundation schema and retrieval wiring on STAGING branch; knowledge content ingestion remains gated.
Date: 2026-11-26
Repository: Dridi06/myScoutingDatabase
Branch: feature/messinho-unified-ai-integration
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
| Biology | Cells, genetics and basic physiology → organ systems, metabolism and homeostasis → adaptation, neuromuscular and molecular mechanisms → performance biology and evidence synthesis |
| Medicine | Anatomy, physiology and medical terminology → common conditions and injury mechanisms → orthopaedics, sports medicine and rehabilitation → guideline appraisal and safe return-to-sport evidence (not autonomous diagnosis or clearance) |
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

- backend/messinho-rights-registry.js still has 0 approved sources.
- The existing source register has 5 candidate/source-pool entries, all quarantined or discovery-only; 0 approved works.
- STAGING canonical domain knowledge and answer-memory tables currently contain 0 rows.
- Therefore no bulk knowledge ingestion is enabled yet. This is deliberate: no source is to be admitted on the basis of being free to read alone.
- Next legal research task: work-level review for mathematics, physics, biology, statistics, football/sports science, medicine, risk management, banking and financial markets, with Germany-based commercial use considered. If rights remain unclear, retain quarantine.

## Implemented in this milestone

- Added STAGING migration 20261126182955_messinho_knowledge_hierarchy.sql (applied as migration 20261126182955_messinho_knowledge_hierarchy).
- Added graph schema, typed relations and immutable version snapshots.
- Added backend/messinho-knowledge-graph.js with level/type validation, rights allowlist enforcement, two independent source-domain requirement, compact payloads, candidate-only insertion, conflict refusal, version snapshotting and active-only retrieval.
- Connected graph retrieval to the existing POST /api/agent/chat flow and passed retrieved concepts to the scouting agent input and conversational context.
- The general-research path now creates a foundational concept candidate only when the question is a foundation-style query, source claims are corroborated, and each source URL resolves through the reviewed rights allowlist. Provider-supplied license flags are ignored. The current empty allowlist intentionally prevents all candidate persistence.
- Source URL permission matching enforces exact HTTPS origin and path boundaries, preventing lookalike hosts or prefix confusion.
- The capability runtime merges active graph concepts with legacy verified knowledge for relevant explanations. Scoring/model-weight functions remain isolated so reference knowledge cannot silently alter numerical ratings or weights.
- Updated the capability runtime to merge active graph concepts with the legacy rights-verified knowledge context for relevant explanations across the capability handlers. Scoring/model-weight functions remain protected: reference knowledge cannot alter numerical scores or weights.
- Added tests/messinho-knowledge-graph.test.js for level/link contracts, invalid rights, prerequisite validation and fail-closed storage behavior.
- The graph remains empty until rights-cleared source material is reviewed. No books/PDFs were imported and no model weights or scoring rules were changed.

## Verification still required
- Complete CI on the latest feature commit.
- Inspect and correct any test/syntax issues reported by CI.
- Test actual authenticated chat retrieval and capability context on STAGING.
- Add a governed admin approval/promotion workflow and explicit conflict review.
- Complete work-level rights review before seeding the first concepts.
- Do not manually deploy until CI passes; STAGING auto-deploy is disabled. Production and main remain untouched.
