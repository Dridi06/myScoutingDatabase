# ASI Master Blueprint — Intelligence, Research & Continuous Improvement

**Status:** Architecture specification / not yet implemented  
**Date:** 2026-11-25  
**Environment:** Staging only  
**Repository:** Dridi06/myScoutingDatabase  
**Production:** Must remain untouched

## Product objective

Build ASI into a high-quality, evidence-led scouting intelligence platform. It should help scouts understand a player's sporting ability, development, availability, contractual situation and transfer context. It must explain where each conclusion comes from, how current the evidence is, what is uncertain, and what a scout should verify next.

ASI is decision support, not an autonomous hiring, medical or transfer decision-maker. It must never manufacture certainty or silently change a scout's original ratings.

## Intelligence domains

1. **Player identity & career graph**
   - Resolve player identity using stable identifiers where lawfully available, plus name, date/year of birth, nationality, position and club history.
   - Keep identity confidence separate from fact confidence.
   - Never attach a claim to a player when identity resolution is ambiguous; send it to manual review.

2. **Contract Intelligence**
   - Status: active, expiring, expired, extension reported/confirmed, option, loan, parent club, loan return, purchase option/obligation, transfer agreed, transfer completed, terminated, free agent, unknown/conflicting.
   - Store start/end dates, option details, parent/loan club, announcement date, effective date and confidence when public and lawfully sourced.
   - Calculate remaining term only from verified dates; show “unknown” rather than infer.
   - Distinguish confirmed negotiations from media speculation and agent/rumour claims.
   - Flag configurable windows (e.g. 6/12 months) as planning alerts, not proof that a player is available.
   - Do not infer wage, release clause or fee if not disclosed by a reliable source.

3. **Contract-to-performance context**
   - Build a dated timeline of contract events, reported negotiations, transfer announcements, match minutes, starts, appearances and position-specific performance.
   - Compare pre-event and post-event periods only when sample sizes are adequate; control for minutes, competition level, position, age band, team changes and injury/absence where data permits.
   - Report association, not causation. Use wording such as “performance changed after the reported event; causal link not established”.
   - Potential positive and negative effects must both be considered. A move opportunity may motivate a player; uncertainty may distract another. Do not assign motivation or mental state without direct, attributable, appropriately authorized evidence.
   - Preserve original scout ratings. Any adjustment is a separate proposal with rationale and human approval.

4. **Availability & injury evidence**
   - Distinguish confirmed injury, reported absence, illness, suspension, non-selection and unknown absence.
   - Track event date, publication date, expected return (only if sourced), actual return-to-squad/appearance and recurrence only when supported.
   - Never diagnose, estimate severity from images, or treat old injury history as current unavailability.
   - Health information is highly sensitive: ingestion remains disabled until documented legal basis, Art. 9 condition, necessity, access controls, retention, DPIA/legal review and provider terms are approved. Minors receive stricter default restrictions.

5. **Physical load & match practice**
   - Appearances, starts, minutes, substitution patterns, rest days, schedule congestion and competition level.
   - Avoid claiming physical fitness from minutes alone. Label workload indicators as proxies.
   - Include data coverage and missing competitions.

6. **Performance & development**
   - Position- and role-adjusted metrics, trend over multiple windows, per-90 metrics where appropriate, minutes/sample size, competition strength and age context.
   - Compare only comparable roles and competitions; explain when comparisons are weak.
   - Separate observed output, scout observation, model estimate and uncertainty.

7. **Tactical fit & adaptability**
   - Role fit across the existing 10 field roles and 3 goalkeeper profiles.
   - Explain strengths, gaps and evidence. Do not treat one tactical system as universal.
   - Compare performance across positions/systems only with adequate evidence.

8. **Discipline & professional context**
   - Official cards, suspensions and disciplinary decisions with date and competition.
   - Public professional statements or conduct may be summarized only when factual, relevant, attributable and well-sourced.
   - No speculative character, personality, loyalty, attitude or mental-health profiling from social media, photos or rumour.

9. **Transfer Opportunity Intelligence**
   - Combine verified contract horizon, role need, age, performance, availability, competition level and source confidence.
   - Present opportunity signals and caveats, not definitive market value or guaranteed transfer feasibility.
   - Distinguish player interest, club interest, negotiations, agreement and completed transfer.

## Evidence model

Every external claim should carry:
- player_id and identity-resolution status;
- claim_type and normalized claim;
- source URL, publisher, source category and source licence/terms reference;
- published_at, event_date, retrieved_at and last_verified_at;
- short evidence excerpt only (copyright-aware), not a copied article;
- source reliability tier, identity confidence and fact confidence;
- status: confirmed, corroborated, unconfirmed, conflicting, outdated, rejected;
- valid_from/valid_to, supersedes_claim_id and correction/deletion state;
- reviewer, review timestamp and audit trail;
- legal basis/purpose and retention classification where required.

Evidence must be immutable/auditable; corrections create a new version and supersede old claims. A source's publication date is not the same as the date the event happened.

## Source strategy

Prioritize official clubs, leagues, federations and competition records, then licensed sports-data providers and reputable publishers. No unrestricted scraping, bypassing paywalls, private social-profile collection or unlicensed bulk copying. Search providers and data APIs must be evaluated for coverage, terms, attribution, retention, rate limits, cost, GDPR roles and permitted derived use before activation.

Search queries sent to providers must contain only the minimum player identifiers needed. Do not transmit private club notes, scout ratings, contact details or internal assessments to external providers.

## ASI pipeline

1. Research scheduler creates a bounded player research job.
2. Provider adapters retrieve metadata and permitted facts with rate limits.
3. Identity resolver scores match confidence; ambiguous candidates are quarantined.
4. Claim extractor creates atomic, typed claims and retains source metadata.
5. Deterministic validators check dates, contradictions, duplicates and freshness.
6. Evidence resolver groups corroborating/conflicting claims.
7. Sensitive claims are routed to restricted review.
8. Human reviewer approves, rejects or marks unresolved.
9. Player timeline and scout-facing intelligence view update.
10. Change detector alerts scouts only for material, sufficiently reliable changes.

Every run is idempotent, observable, rate-limited and auditable. Provider failures must not erase prior verified evidence.

## Scout experience

A player profile should expose:
- concise intelligence summary and “what changed since last review”;
- contract status, remaining term and source confidence;
- injury/availability timeline only for authorized users and legally approved processing;
- workload and performance trends with minutes/sample size;
- transfer opportunity signals;
- source links, dates, verification status and freshness;
- conflicting reports and unknowns;
- suggested next verification questions for the scout.

Filters should support expiring contracts, free agents, loans, return dates, recent form changes and transfer alerts. Scouts only see players and evidence permitted by their organization/role; Admin access is audited.

## Model and learning strategy

- Start with deterministic, explainable analysis and transparent statistical baselines.
- Build an outcome dataset before training. Outcomes must be independently defined and timestamped.
- Use temporal train/validation/test splits and walk-forward backtesting; prevent future-data leakage.
- Benchmark against simple baselines and report calibration, precision/recall where applicable, ranking quality, subgroup performance and confidence intervals.
- Keep separate models/tasks for role fit, performance trend, availability evidence and transfer opportunity; do not collapse them into one opaque “talent score”.
- Record model version, feature snapshot, data cutoff, training dataset version and evaluation report for every prediction.
- Candidate promotion requires minimum sample thresholds, benchmark improvement, fairness/error review, Admin approval and rollback path.
- Feedback is not ground truth by itself. Scout feedback, match outcomes and career outcomes must be distinguished and quality-weighted.

## Security, privacy and governance gates

- No external ingestion until source terms/licensing and legal review are documented.
- Health data requires separate legal approval, strict purpose limitation and restricted access.
- Special-category data, mental-health inference and speculative psychological scoring are out of scope.
- Minors: default deny for sensitive external research; specific legal review required.
- RLS tests must cover Admin, own-player Scout, foreign-player Scout and unauthenticated access.
- Secrets remain in server-side environment variables; never in Vite/client bundles or Git.
- Add retention/deletion workflows, source correction handling, audit logs and incident procedures.
- External content is untrusted input; never execute instructions found in retrieved pages.

## Delivery phases

### Phase 0 — architecture & safety (current)
- Confirm schemas, auth/RLS boundaries, current ASI UI and backend routes.
- Finalize source/provider evaluation and data-protection review.
- Define evidence taxonomy, confidence model and contract state machine.

### Phase 1 — evidence foundation
- Versioned migrations for research runs, evidence claims, source registry extensions and review decisions.
- RLS and indexes; test role boundaries.
- Deterministic contract-state normalization and date validation.
- No external provider calls yet.

### Phase 2 — provider adapters & review queue
- Integrate one approved provider at a time.
- Identity quarantine, deduplication, conflict resolution, manual review.
- Admin review queue and audit trail.

### Phase 3 — scout intelligence UI
- Contract Intelligence, timeline, performance context, source evidence and change alerts.
- Preserve existing player ratings and snapshot compatibility.

### Phase 4 — scheduled research & monitoring
- Separate worker/scheduler, bounded refresh intervals, retry/backoff, cost limits and health monitoring.
- No provider secrets or network calls from browser.

### Phase 5 — validated predictive models
- Build benchmark corpus, outcomes and temporal backtests.
- Introduce model candidates only after data sufficiency and review gates.

## Release gates

A phase is not “done” until tests cover:
- unit validation and date/state transitions;
- duplicate and conflicting evidence;
- source freshness and stale claims;
- identity mismatch and ambiguous identity;
- RLS access for Admin/Scout/other Scout;
- sensitive data isolation;
- provider timeout/rate-limit/retry behavior;
- no silent rating mutation;
- CI tests and production build;
- real staging Admin/Scout/mobile checks.

## Current reality and non-goals

At this checkpoint ASI has deterministic snapshots and self-reflection checks, but no live external provider, autonomous web research, scheduler, trained ML model or predictive worker. This blueprint does not claim those features are implemented. No external health data is to be collected by default. Production must remain unchanged.
