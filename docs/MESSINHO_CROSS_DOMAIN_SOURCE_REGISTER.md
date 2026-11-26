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

| `candidate_openintro_statistics` | OpenIntro Statistics (exact current edition and per-file licence must be confirmed) | Statistics / probability | The exact *Introduction to Modern Statistics* 2e page identifies CC BY-SA 3.0 (US) for that work. However, OpenIntro's current Terms of Use contain a separate automated AI/ML access clause, including a stated equity-option compensation term for automated content access to train AI/ML systems. The licence and website access terms therefore require legal review before any automated ingestion. | Confirm the exact work and third-party material, and obtain legal review of the current automated AI/ML access clause before any automated access. Do not assume the CC BY-SA licence alone resolves the website's separate access terms. | `quarantined` |
| `candidate_openstax_statistics_2020` | OpenStax / Texas Education Agency — *Statistics* (Illowsky & Dean, 2020) | Statistics / probability | The exact preface states CC BY 4.0 for the book text, but explicitly prohibits LLM training or ingestion into generative-AI offerings without OpenStax's prior written permission; some art is separately permissioned or third-party. | **Not eligible without written permission** explicitly covering AI ingestion/TDM and the intended commercial knowledge-base use; separately assess TEA attribution, third-party artwork and commercial components. This is a concrete example that a permissive CC licence does not override a separate AI-ingestion restriction. | `quarantined` |
| `candidate_plos_ccby_tdm_pool` | PLOS article collection (discovery pool only; each article must be selected individually) | Biology / medicine / health / sports-science evidence | PLOS states articles may be mined, reused and shared by anyone, anywhere, for any purpose; standard PLOS articles use CC BY or a comparable permissive licence. | Do not bulk-download the 5GB corpus. Retrieve only individually selected articles via DOI/API or permitted JATS routes; verify each article's exact licence, author/rightsholder, third-party figures/supplements and retraction/correction status. The pool is not an individual work and is not yet in the permanent allowlist. | `discovery_only` |
| `candidate_openstax_textbook_library` | OpenStax textbook library (source family only) | Mathematics / physics / biology | OpenStax's general library default is CC BY-NC-SA 4.0 and excludes commercial reuse; individual works may differ, but exact work-level terms and AI ingestion notices must be inspected. | Not eligible under current default terms. Could only be reconsidered after written permission explicitly covering commercial AI/agent knowledge-base use and derivative processing. | `rejected_under_current_default_terms` |

| `candidate_grinstead_snell_probability` | Grinstead & Snell, *Introduction to Probability* (Dartmouth/CHANCE GNU version; exact GNU FDL edition) | Probability, statistics, Markov chains | The authors' official Dartmouth/CHANCE page states the GNU version is freely redistributable under GNU FDL; the published GNU PDF notice identifies GNU FDL with no Invariant Sections, Front-Cover Texts or Back-Cover Texts. GNU FDL 1.3 explicitly permits commercial copying and modification but applies copyleft to modified versions. | Candidate for a carefully isolated, compact, independently worded probability curriculum. Legal review must determine whether stored concept records constitute modified/adapted portions and, if so, what GNU FDL share-alike obligations apply. Preserve attribution and exact version provenance. | `quarantined` |
| `excluded_book_of_proof` | Richard Hammack, *Book of Proof* (official author edition) | Mathematics / proof foundations | The author's official page states the licence forbids commercial use and altering content except for personal use; a mirrored PDF identifies CC BY-NC-ND 4.0. | Excluded under current default terms: non-commercial and no-derivatives are incompatible with the intended commercial, transformed knowledge pipeline. | `rejected_under_current_terms` |
| `excluded_mit_6042j` | MIT OpenCourseWare 6.042J *Mathematics for Computer Science* (Spring 2019 course) | Mathematics / discrete math / probability | MIT's official course page states CC BY-NC-SA, which limits use to non-commercial purposes. | Excluded under current default terms for the commercial platform. Do not ingest unless written permission changes those terms. | `rejected_under_current_terms` |

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
- OpenIntro official resource licence: https://openintro.org/license/
- OpenStax official licensing and commercial-use restriction: https://help.openstax.org/s/article/Licensing-information-of-OpenStax-textbooks
- OpenStax commercial / AI project reuse request: https://riceuniversity.tfaforms.net/52
- OpenStax *Statistics* exact work and AI-ingestion notice: https://openstax.org/books/statistics/pages/preface
- PLOS TDM policy: https://plos.org/text-and-data-mining/
- PLOS article licence and copyright policy: https://journals.plos.org/plosone/s/licenses-and-copyright
- PLOS TDM/API technical access guidance: https://api.plos.org/text-and-data-mining.html
- Dartmouth/CHANCE GNU FDL edition of Introduction to Probability: https://chance.dartmouth.edu/Doob/probability_book/book.html
- Official GNU FDL 1.3 text (commercial reuse and copyleft conditions): https://www.gnu.org/licenses/fdl-1.3.html
- Richard Hammack official Book of Proof licensing notice: https://richardhammack.github.io/BookOfProof/index.html
- MIT OCW 6.042J official licence notice: https://openlearninglibrary.mit.edu/courses/course-v1:OCW+6.042J+2T2019/about

## Current decision

- Approved works: **0**.
- Candidate works/resources recorded here: **10** (PMC, OpenStax and MIT OCW are source pools/families, not individual works).
- Entries permitted in the permanent knowledge allowlist: **0**. OpenIntro and the Grinstead/Snell GNU FDL version remain quarantined pending exact work-level/copy-left review; OpenStax, Book of Proof and MIT 6.042J are excluded under their current default terms.
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
