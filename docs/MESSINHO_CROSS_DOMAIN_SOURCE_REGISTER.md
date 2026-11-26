# MESSINHO — Cross-domain source rights register

Stand: 2026-11-26
Project: myScoutingDatabase / MESSINHO
Branch: `feature/messinho-unified-ai-integration`
Environment: dedicated STAGING only

## Purpose and non-negotiable gate

This register tracks individual candidate works and source families for MESSINHO's persistent cross-domain knowledge layer. A source being free to read, hosted by a government agency, or labelled Open Access is **not** enough to enter the permanent knowledge store.

Only a work-level record with verified rights may be added to `backend/messinho-rights-registry.js`. Until then, every candidate below remains quarantined and cannot be used for permanent knowledge ingestion. No source is counted toward the 100-work target until its own record is complete.

The project is Germany-based and may be used commercially. A statement that a US federal work is public domain **in the United States** does not, by itself, establish the full international rights position. This register therefore distinguishes an official US reuse statement from final global clearance.

## Required work-level fields

- Stable `source_id`, exact title, author/agency, edition/revision, publication date and canonical URL/DOI.
- Rights holder and exact licence/status, including the primary rights evidence URL.
- Explicit assessment of automated retrieval, text/data mining, AI processing, summarization/adaptation, embeddings, commercial use and storage.
- Third-party material, images, tables, appendices and attribution requirements.
- Applicable territory/jurisdiction and any unresolved international-law question.
- Retrieval method and source rate limits/terms.
- Reviewer, review date, expiry/review date, decision rationale and status.
- Status values: `candidate`, `quarantined`, `verified_permitted`, `rejected`, `expired`, `revoked`.

## Initial candidate register — not approved for ingestion

| Candidate ID | Work / source | Domain | Evidence currently located | Open rights checks | Status |
|---|---|---|---|---|---|
| `candidate_nist_sp800_30r1` | NIST SP 800-30 Rev. 1 — *Guide for Conducting Risk Assessments* (2012) | Risk management | NIST identifies the final work, authoring group, date and DOI. NIST states its own publications are public domain and not subject to US copyright. | Confirm international rights position for commercial use from Germany; verify no third-party material in the exact edition; record exact download/processing conditions and attribution. | `quarantined` |
| `candidate_nist_sp800_37r2` | NIST SP 800-37 Rev. 2 — *Risk Management Framework for Information Systems and Organizations* (2018) | Risk management / governance | NIST identifies the final work, authoring group, date and DOI. NIST's general copyright statement applies to NIST-authored publications, subject to work-specific notices. | Confirm international rights position; inspect exact final PDF for third-party material and notices; document commercial AI/TDM and adaptation assessment. | `quarantined` |
| `candidate_nist_sp1314` | NIST SP 1314 — *NIST Risk Management Framework (RMF) Small Enterprise Quick Start Guide* (2024) | Risk management / SMEs | Listed by NIST as a final RMF publication. NIST's general copyright statement says unmarked NIST information is public information and may be distributed/copied. | Confirm exact work authorship and notices; inspect third-party elements; resolve international rights and document AI/TDM/adaptation basis. | `quarantined` |
| `candidate_sec_investor_intro` | Investor.gov — *Introduction to Investing* (web educational resource) | Banking / financial markets / risk literacy | SEC FAQ says government-created content on sec.gov and EDGAR public filing content are free to access and reuse. | Confirm this exact page is government-created; exclude third-party graphics/material; record page version/date and permitted extraction/storage. It is a web resource, not a book and must not be counted as a specialist work unless the source policy allows it. | `quarantined` |
| `candidate_pmc_oa_article_pool` | PubMed Central Open Access Subset (discovery pool only; not an individual work) | Medicine / biology / sports science | PMC states licence terms vary by article; only the designated PMC Cloud, OAI-PMH, E-Utilities and BioC routes may be used for automated retrieval. | Select each article individually; verify its own licence, copyright holder, commercial/derivative rights, AI/TDM basis and third-party figure/table rights. Never treat the whole subset as one blanket licence. | `discovery_only` |

## Primary evidence links

- NIST SP 800-30 Rev. 1: https://csrc.nist.gov/pubs/sp/800/30/r1/final
- NIST SP 800-37 Rev. 2: https://csrc.nist.gov/pubs/sp/800/37/r2/final
- NIST RMF publications list (includes SP 1314): https://csrc.nist.gov/Projects/risk-management/publications
- NIST copyright and disclaimers: https://www.nist.gov/copyrights-disclaimers
- NIST RMF FAQ (US copyright status and translation statement): https://csrc.nist.gov/Projects/risk-management/faqs
- SEC webmaster FAQ (government-created content reuse): https://www.sec.gov/about/webmaster-frequently-asked-questions
- Investor.gov Introduction to Investing: https://www.investor.gov/introduction-investing
- PMC Article Datasets / permitted automated retrieval and article-level licence terms: https://pmc.ncbi.nlm.nih.gov/tools/textmining/
- PMC Open Access Subset: https://pmc.ncbi.nlm.nih.gov/tools/openftlist/
- GovInfo public-domain/copyright notice and third-party-material warning: https://www.govinfo.gov/about/policies

## Current decision

- Approved works: **0**.
- Candidate works/resources recorded here: **5** (the PMC entry is a discovery pool, not a work).
- Entries permitted in the permanent knowledge allowlist: **0**.
- No source full text, PDF, OCR output, article, or dataset was downloaded or stored by creating this register.
- No rights are inferred from search snippets alone. Each candidate remains quarantined pending exact work-level review.
- No changes to the Supabase knowledge table, allowlist code, user data, player data, learning history or active model weights.

## Next source-review actions

1. Obtain and inspect the exact official final edition for each candidate.
2. Record work-specific notices, authorship, third-party content and version.
3. Assess international commercial AI/TDM, adaptation and storage rights for the Germany-based product.
4. If any material right is unclear, retain quarantine and seek written permission or exclude the work.
5. Add only individually approved records to the code allowlist, with exact HTTPS source URL prefixes and matching rights evidence.
6. Continue discovery across mathematics, physics, biology, statistics, sports science, medicine, football, computer science, banking, financial markets and risk management until 100 **individually reviewed works** are available. Do not pad the count with portals, websites, or unreviewed articles.
