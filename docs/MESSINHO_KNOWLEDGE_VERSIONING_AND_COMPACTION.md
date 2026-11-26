# MESSINHO — Knowledge Versioning, Improvement and Storage Compaction

**Status:** Accepted architecture requirement; implementation not yet claimed  
**Date:** 2026-11-27  
**Scope:** myScoutingDatabase / MESSINHO, STAGING only

## 1. Product rule

MESSINHO must improve knowledge quality without growing an uncontrolled archive of duplicate or obsolete knowledge. It must not create endless copies, repeated summaries, or unbounded derivative artifacts. The objective is a compact, current, evidence-backed knowledge base.

## 2. Separate immutable facts from replaceable methods

- **Durable knowledge:** verified facts, definitions, foundational principles, source provenance, uncertainty and essential historical evidence must not be silently discarded.
- **Replaceable knowledge products:** explanations, procedures, scoring models, formulas, heuristics, prompts, algorithms and analysis methods may be superseded when a challenger is demonstrably better.
- **Historical trace:** retain only the minimum version metadata, decision rationale, content hash, evaluation evidence, source provenance and rollback pointer needed to explain or reverse a change. Do not retain every intermediate draft or every repeated generation.

## 3. Canonical identity and deduplication

1. Every knowledge item or method has a stable canonical key and a defined scope (domain, task, population/context, input assumptions).
2. Normalize content and compare canonical key, content fingerprint and semantic similarity before creating a new record.
3. If materially equivalent, merge genuinely new evidence into the existing canonical item; do not create a second copy.
4. If a proposal changes the method or conclusion materially, create a temporary challenger proposal, not another active knowledge item.
5. Candidate, rejected, superseded and temporary artifacts must have explicit retention limits and lifecycle states. No uncontrolled permanent candidate backlog.

## 4. Evidence-based challenger evaluation

A new variant is not "better" merely because it is newer, longer, more confident, or produced by MESSINHO itself. Compare old and new versions against the same frozen benchmark and representative edge cases.

Evaluation dimensions:
- factual and mathematical correctness;
- source quality, rights and independent corroboration;
- predictive or task performance on held-out cases where applicable;
- robustness, calibration and uncertainty;
- security, privacy, authorization and tenant isolation;
- latency, compute, storage and maintenance cost;
- explainability and reproducibility;
- regression impact on existing use cases.

A challenger must meet all critical safety/factual gates and improve a predeclared quality objective without unacceptable regressions. Store benchmark version, test inputs/outputs or privacy-safe references, metrics, reviewer and decision rationale. Avoid retaining unnecessary raw personal/player data in benchmarks.

## 5. Controlled promotion / replacement

- Low-risk content corrections may be proposed automatically, but promotion must follow the configured approval policy.
- Changes to scouting ratings, player assessments, financial/risk models, permissions, security, data schemas or externally visible decisions require explicit authorized Admin approval.
- Promotion must be atomic: activate the new version and mark the old version superseded in one transaction, preserving the prior version pointer and a minimal audit record.
- Never delete the last known-good version before the replacement is verified.
- Run the full relevant regression suite and domain-specific acceptance tests before promotion.
- If health checks or post-promotion monitoring fail, rollback atomically to the previous known-good version.
- No self-modification of code, guardrails, permissions, deployment configuration or production systems is authorized by this knowledge policy.

## 6. Storage and lifecycle controls

- Store one active canonical version per key/scope unless a justified parallel variant is explicitly required (e.g. distinct population or protocol).
- Store evidence references and compact independent summaries, not copied source corpora or repeated generated documents.
- Apply configurable quotas and TTLs to unapproved drafts, duplicate candidates, failed experiments and temporary evaluation artifacts.
- Keep an append-only minimal audit trail only for consequential decisions; do not treat append-only as permission to preserve every generated draft.
- Track storage bytes, active item count, duplicate rate, candidate age, superseded versions and evaluation cost. Alert on growth thresholds.
- Retention/deletion rules must preserve legally required provenance and auditability while removing unnecessary payloads; no user/player/scouting record is deleted by this knowledge compaction process.

## 7. Required implementation sequence

1. Inspect the existing Supabase schema, RPCs and RLS policies for concepts, versions, conflicts and reviews.
2. Map current behavior and identify whether version history is append-only, how supersession works, and whether promotion can be transactional.
3. Design migrations only if necessary; review blast radius and keep them staging-only.
4. Implement deterministic canonical identity, duplicate detection, challenger proposals, benchmark evaluation, promotion and rollback.
5. Add tests for duplicate submissions, equivalent evidence merge, genuinely improved challenger, false improvement, regression, concurrent promotion, rollback, authorization and tenant isolation.
6. Add storage quotas/TTL and metrics; prove that repeated identical learning does not increase active record count.
7. Run CI and deploy to dedicated STAGING; validate with synthetic data before any production discussion.

## 8. Current boundary and status

This document is an accepted product requirement, not a claim that the replacement engine already exists. Current storeMessinhoKnowledgeConcept behavior records a differing proposal as an open conflict for manual review; it does not automatically replace the active concept. The existing domain knowledge store upserts by content fingerprint, which can still allow multiple fingerprints for similar content. These behaviors must be reconciled through a tested canonical lifecycle rather than bypassing it.

No Supabase schema or data change, source-rights allowlist change, knowledge import, activation, production deployment or code-execution/self-modification capability is authorized by this requirement. All implementation remains STAGING-only.

## 9. Protected operational records and Admin authority

This knowledge lifecycle applies only to MESSINHO's own governed knowledge artifacts. It must never be interpreted as permission to alter operational player or scout records.

- MESSINHO has read/analyze/propose authority only for player records and registered scout accounts.
- It may inspect existing player values and validate them for plausibility, consistency, completeness, contradictions, outliers and freshness.
- When it discovers or receives new player values, it may validate provenance and source rights, compare them with stored values, recalculate metrics, re-analyze and re-assess the player, and produce an evidence-backed proposed update. It must not write the new values into the player record.
- MESSINHO must never create, edit, delete, approve/release, activate/deactivate, lock/unlock or change permissions for a player record or registered scout account.
- The Admin remains the sole final authority for protected player/scout data and account operations. Automated confidence, model output, scheduled work or an agent plan is never Admin approval.
- Enforce this at server/API/service/database/RLS boundaries with least-privilege read-only access. Prompts and UI restrictions alone are insufficient. Proposals must remain separate from source records and pending until an authenticated, authorized Admin explicitly approves and applies them through an audited workflow.
- No indirect bypass through tools, generic CRUD endpoints, background jobs, RPCs, service-role credentials, retries, learning or compaction.
- Required tests: direct and indirect write/delete/approval denial for MESSINHO; allowed read and analysis; proposal separation; Admin-only application; forged-role and cross-tenant denial; audit verification.
- This requirement is accepted but not yet implemented/verified. It does not authorize any database migration or data write. It does not restrict separately governed updates to MESSINHO's own knowledge artifacts.
