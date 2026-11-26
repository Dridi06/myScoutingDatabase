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

## Source register — quarantined candidates and individually approved works

| Source ID | Work / source | Domain | Evidence currently located | Open rights checks / permitted processing | Status |
|---|---|---|---|---|---|
| `candidate_nist_sp800_30r1` | NIST SP 800-30 Rev. 1 — *Guide for Conducting Risk Assessments* (2012) | Risk management | NIST identifies the final work, authoring group, date and DOI. NIST states its own publications are public domain and not subject to US copyright. | Confirm international rights position for commercial use from Germany; verify no third-party material in the exact edition; record exact download/processing conditions and attribution. | `quarantined` |
| `candidate_nist_sp800_37r2` | NIST SP 800-37 Rev. 2 — *Risk Management Framework for Information Systems and Organizations* (2018) | Risk management / governance | NIST identifies the final work, authoring group, date and DOI. NIST's general copyright statement applies to NIST-authored publications, subject to work-specific notices. | Confirm international rights position; inspect exact final PDF for third-party material and notices; document commercial AI/TDM and adaptation assessment. | `quarantined` |
| `candidate_nist_sp1314` | NIST SP 1314 — *NIST Risk Management Framework (RMF) Small Enterprise Quick Start Guide* (2024) | Risk management / SMEs | Listed by NIST as a final RMF publication. NIST's general copyright statement says unmarked NIST information is public information and may be distributed/copied. | Confirm exact work authorship and notices; inspect third-party elements; resolve international rights and document AI/TDM/adaptation basis. | `quarantined` |
| `candidate_sec_investor_intro` | Investor.gov — *Introduction to Investing* (web educational resource) | Banking / financial markets / risk literacy | SEC FAQ says government-created content on sec.gov and EDGAR public filing content are free to access and reuse. | Confirm this exact page is government-created; exclude third-party graphics/material; record page version/date and permitted extraction/storage. It is a web resource, not a book and must not be counted as a specialist work unless the source policy allows it. | `quarantined` |
| `candidate_pmc_oa_article_pool` | PubMed Central Open Access Subset (discovery pool only; not an individual work) | Medicine / biology / sports science | PMC states licence terms vary by article; only the designated PMC Cloud, OAI-PMH, E-Utilities and BioC routes may be used for automated retrieval. | Select each article individually; verify its own licence, copyright holder, commercial/derivative rights, AI/TDM basis and third-party figure/table rights. Never treat the whole subset as one blanket licence. | `discovery_only` |

| `candidate_openintro_statistics` | OpenIntro Statistics (exact current edition and per-file licence must be confirmed) | Statistics / probability | The exact *Introduction to Modern Statistics* 2e page identifies CC BY-SA 3.0 (US) for that work. However, OpenIntro's current Terms of Use contain a separate automated AI/ML access clause, including a stated equity-option compensation term for automated content access to train AI/ML systems. The licence and website access terms therefore require legal review before any automated ingestion. | Confirm the exact work and third-party material, and obtain legal review of the current automated AI/ML access clause before any automated access. Do not assume the CC BY-SA licence alone resolves the website's separate access terms. | `quarantined` |
| `candidate_openstax_statistics_2020` | OpenStax / Texas Education Agency — *Statistics* (Illowsky & Dean, 2020) | Statistics / probability | The exact preface states CC BY 4.0 for the book text, but explicitly prohibits LLM training or ingestion into generative-AI offerings without OpenStax's prior written permission; some art is separately permissioned or third-party. | **Not eligible without written permission** explicitly covering AI ingestion/TDM and the intended commercial knowledge-base use; separately assess TEA attribution, third-party artwork and commercial components. This is a concrete example that a permissive CC licence does not override a separate AI-ingestion restriction. | `quarantined` |
| `candidate_plos_ccby_tdm_pool` | PLOS article collection (discovery pool only; each article must be selected individually) | Biology / medicine / health / sports-science evidence | PLOS states articles may be mined, reused and shared by anyone, anywhere, for any purpose; standard PLOS articles use CC BY or a comparable permissive licence. | Do not bulk-download the 5GB corpus. Retrieve only individually selected articles via DOI/API or permitted JATS routes; verify each article's exact licence, author/rightsholder, third-party figures/supplements and retraction/correction status. The pool is not an individual work and is not yet in the permanent allowlist. | `discovery_only` |

| `approved_plos_one_vo2max_prediction_2023` | Wiecha et al. (2023), *External validation of VO2max prediction models based on recreational and elite endurance athletes*, PLOS ONE 18(1): e0280897, DOI 10.1371/journal.pone.0280897 | Sports science / exercise physiology | Exact article page carries the Creative Commons Attribution licence; PLOS's journal-wide policy identifies CC BY 4.0, authors retain copyright and anyone may reuse/modify article content for any purpose, including commercial, with attribution. PLOS's TDM policy expressly permits mining, reuse and sharing for any purpose. | **Approved for compact text-only extraction**. Use only the exact article JATS XML endpoint; no PDF, figures, tables, supplementary files or bulk corpus. Store only independently worded claims/excerpts with DOI, attribution and change notice. Exact article URL and retrieval route are hard-scoped in the backend allowlist. | `verified_permitted` |
| `approved_pmc_cardiorespiratory_fitness_2022` | LaMonte (2022), *Cardiorespiratory Fitness in the Prevention and Management of Cardiovascular Disease*, PMCID PMC11269081 | Sports science / biology / medicine | Exact article page identifies CC BY 4.0 and author-retained copyright. PMC's developer policy permits automated retrieval only through designated services; the approved retrieval route is the PMC BioC API for the Open Access subset. | **Approved for compact text-only extraction via BioC API only**. Do not scrape the PMC page or use other automated routes. No PDF, figures, tables, supplements or bulk corpus. Store only independently worded claims/excerpts with PMCID, attribution and change notice. | `verified_permitted` |

| `approved_kuttler_matrix_multiplication_2023` | Ken Kuttler (Lyryx), *A First Course in Linear Algebra*, §2.2 Multiplication of Matrices, LibreTexts revision | Mathematics / linear algebra | Exact chapter is marked CC BY 4.0; LibreTexts identifies Ken Kuttler/Lyryx as author/source. LibreTexts terms allow copying and reuse consistent with the content licence. | **Approved for compact text-only extraction** from the exact §2.2 HTML page. Use only this chapter page; no PDF, diagrams, embedded demos, exercises or third-party media. CC BY attribution and changes notice are retained. | `verified_permitted` |
| `approved_austin_matrix_multiplication_2023` | David Austin, *Understanding Linear Algebra*, §2.2 Matrix multiplication and linear combinations, 2023 update | Mathematics / linear algebra | Author's official colophon identifies David Austin and CC BY 4.0; the official site records August 2026 maintenance updates. CC BY 4.0 permits commercial reuse and adaptation with attribution. | **Approved for compact text-only extraction** from the exact official HTML section. Do not retrieve PDFs, interactive diagrams, Sage cells, workbook or third-party media. Retain author, section, licence and changes notice. | `verified_permitted` |
| `candidate_openstax_textbook_library` | OpenStax textbook library (source family only) | Mathematics / physics / biology | OpenStax's general library default is CC BY-NC-SA 4.0 and excludes commercial reuse; individual works may differ, but exact work-level terms and AI ingestion notices must be inspected. | Not eligible under current default terms. Could only be reconsidered after written permission explicitly covering commercial AI/agent knowledge-base use and derivative processing. | `rejected_under_current_default_terms` |

| `candidate_grinstead_snell_probability` | Grinstead & Snell, *Introduction to Probability* (Dartmouth/CHANCE GNU version; exact GNU FDL edition) | Probability, statistics, Markov chains | The authors' official Dartmouth/CHANCE page states the GNU version is freely redistributable under GNU FDL; the published GNU PDF notice identifies GNU FDL with no Invariant Sections, Front-Cover Texts or Back-Cover Texts. GNU FDL 1.3 explicitly permits commercial copying and modification but applies copyleft to modified versions. | Candidate for a carefully isolated, compact, independently worded probability curriculum. Legal review must determine whether stored concept records constitute modified/adapted portions and, if so, what GNU FDL share-alike obligations apply. Preserve attribution and exact version provenance. | `quarantined` |
| `excluded_book_of_proof` | Richard Hammack, *Book of Proof* (official author edition) | Mathematics / proof foundations | The author's official page states the licence forbids commercial use and altering content except for personal use; a mirrored PDF identifies CC BY-NC-ND 4.0. | Excluded under current default terms: non-commercial and no-derivatives are incompatible with the intended commercial, transformed knowledge pipeline. | `rejected_under_current_terms` |
| `excluded_mit_6042j` | MIT OpenCourseWare 6.042J *Mathematics for Computer Science* (Spring 2019 course) | Mathematics / discrete math / probability | MIT's official course page states CC BY-NC-SA, which limits use to non-commercial purposes. | Excluded under current default terms for the commercial platform. Do not ingest unless written permission changes those terms. | `rejected_under_current_terms` |

| `candidate_openstax_college_algebra_2e` | OpenStax *College Algebra 2e* (2021 edition) | Mathematics foundations | The official preface identifies CC BY-NC-SA 4.0 and explicitly prohibits LLM training or ingestion into generative-AI offerings without prior written permission; art may have separate third-party rights. | Excluded under current non-commercial and AI-ingestion restrictions. Reconsider only after written permission covering commercial AI/TDM and derivative knowledge-base use. | `rejected_under_current_terms` |
| `candidate_openstax_introductory_statistics_2e` | OpenStax *Introductory Statistics 2e* (2023 edition) | Statistics / probability foundations | The official preface identifies CC BY-NC-SA 4.0 and explicitly prohibits LLM training or ingestion into generative-AI offerings without prior written permission. | Excluded under current non-commercial and AI-ingestion restrictions; require written permission for commercial AI/TDM and derivatives before reconsideration. | `rejected_under_current_terms` |
| `candidate_openstax_university_physics_vol1` | OpenStax *University Physics, Volume 1* (2021 PDF edition) | Physics foundations | The official preface identifies CC BY-NC-SA 4.0, prohibits LLM training or ingestion into generative-AI offerings without prior written permission, and states that OpenStax-owned art is separately limited to non-commercial reuse. | Excluded under current non-commercial and AI-ingestion restrictions; do not ingest text, figures or equations from this work unless written commercial AI/TDM permission is obtained. | `rejected_under_current_terms` |
| `candidate_openstax_business_statistics_2e` | OpenStax *Introductory Business Statistics* (2017 edition) | Statistics / banking / finance foundations | The exact preface identifies CC BY 4.0 for the textbook text, but explicitly prohibits use in LLM training or ingestion into generative-AI offerings without OpenStax's permission. | CC BY 4.0 does not override the additional AI-ingestion notice. Keep quarantined until written permission explicitly covers the intended commercial AI/TDM processing and compact derivative knowledge records. | `quarantined` |

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
- OpenStax College Algebra 2e exact CC BY 4.0 PDF: https://assets.openstax.org/oscms-prodcms/media/documents/College-Algebra-2e-WEB.pdf
- OpenStax Introductory Statistics 2e exact CC BY 4.0 PDF: https://assets.openstax.org/oscms-prodcms/media/documents/Introductory_Statistics_2e_-_WEB.pdf
- OpenStax University Physics Volume 1 exact CC BY 4.0 PDF: https://assets.openstax.org/oscms-prodcms/media/documents/UniversityPhysicsVol1-WEB.pdf
- OpenStax Introductory Business Statistics 2e exact CC BY 4.0 PDF: https://assets.openstax.org/oscms-prodcms/media/documents/Introductory_Business_Statistics_2e_-_WEB.pdf
- Creative Commons official FAQ on commercial text/data mining under CC 4.0: https://creativecommons.org/faq/#can-i-conduct-textdata-mining-on-a-cc-licensed-database
- CC BY 4.0 deed: https://creativecommons.org/licenses/by/4.0/deed.en
- OpenStax *Statistics* exact work and AI-ingestion notice: https://openstax.org/books/statistics/pages/preface
- OpenStax College Algebra 2e exact preface and reuse notice: https://openstax.org/books/college-algebra-2e/pages/preface
- OpenStax Introductory Statistics 2e exact preface and reuse notice: https://openstax.org/books/introductory-statistics-2e/pages/preface
- OpenStax University Physics Volume 1 exact preface and reuse notice: https://openstax.org/books/university-physics-volume-1/pages/preface
- OpenStax Introductory Business Statistics exact preface and AI-ingestion notice: https://openstax.org/books/introductory-business-statistics/pages/preface
- PLOS TDM policy: https://plos.org/text-and-data-mining/
- PLOS article licence and copyright policy: https://journals.plos.org/plosone/s/licenses-and-copyright
- PLOS approved VO2max article: https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0280897
- PLOS approved article JATS XML route: https://journals.plos.org/plosone/article/file?id=10.1371/journal.pone.0280897&type=manuscript
- PMC approved cardiorespiratory fitness article: https://pmc.ncbi.nlm.nih.gov/articles/PMC11269081/
- PMC BioC API route and permitted OA-subset retrieval: https://www.ncbi.nlm.nih.gov/research/bionlp/APIs/BioC-PMC/
- Kuttler exact matrix multiplication chapter (CC BY 4.0): https://math.libretexts.org/Bookshelves/Linear_Algebra/A_First_Course_in_Linear_Algebra_%28Kuttler%29/02%3A_Matrices/2.02%3A_Multiplication_of_Matrices
- Kuttler chapter licence evidence: https://math.libretexts.org/Bookshelves/Linear_Algebra/A_First_Course_in_Linear_Algebra_%28Kuttler%29/02%3A_Matrices
- LibreTexts terms of use: https://libretexts.org/terms-of-use/
- Austin official matrix multiplication section: https://understandinglinearalgebra.org/sec-matrices-lin-combs.html
- Austin official CC BY 4.0 colophon: https://understandinglinearalgebra.org/colophon-1.html
- Creative Commons Attribution 4.0 legal code: https://creativecommons.org/licenses/by/4.0/
- PLOS TDM/API technical access guidance: https://api.plos.org/text-and-data-mining.html
- Dartmouth/CHANCE GNU FDL edition of Introduction to Probability: https://chance.dartmouth.edu/Doob/probability_book/book.html
- Official GNU FDL 1.3 text (commercial reuse and copyleft conditions): https://www.gnu.org/licenses/fdl-1.3.html
- Richard Hammack official Book of Proof licensing notice: https://richardhammack.github.io/BookOfProof/index.html
- MIT OCW 6.042J official licence notice: https://openlearninglibrary.mit.edu/courses/course-v1:OCW+6.042J+2T2019/about

## Current decision

- Approved works: **4 exact CC BY 4.0 works** (one PLOS ONE article, one PMC article retrieved through its permitted BioC API, and two individual linear-algebra chapters). The four OpenStax works previously considered are not approved: three carry CC BY-NC-SA 4.0 and all four have an explicit AI/LLM ingestion restriction without prior written permission.
- Candidate works/resources recorded here: **20** (PMC, OpenStax and MIT OCW are source pools/families; four OpenStax editions are individually scoped works, but none is currently approved).
- Entries permitted in the permanent knowledge allowlist: **4 exact works**. OpenIntro and the Grinstead/Snell GNU FDL version remain quarantined pending exact work-level/copy-left review. OpenStax College Algebra 2e, Introductory Statistics 2e and University Physics Volume 1 are excluded under CC BY-NC-SA 4.0 and explicit AI-ingestion restrictions; Introductory Business Statistics is CC BY 4.0 but still requires written permission for LLM/AI ingestion. The wider OpenStax library default, Book of Proof and MIT 6.042J remain excluded under their current terms.
- No source full text, PDF, OCR output, article, or dataset was downloaded or stored by creating this register.
- No rights are inferred from a CC badge or PDF metadata alone. Exact prefaces and AI-ingestion notices take precedence; all OpenStax titles remain excluded or quarantined until written permission is obtained.
- The permanent code allowlist contains only the four exact works above; all OpenStax entries remain excluded or quarantined. No knowledge rows, user data, player data, learning history or active model weights were changed.

## Next source-review actions

1. Continue obtaining and inspecting exact official editions for the remaining quarantined candidates.
2. Record work-specific notices, authorship, third-party content and version.
3. Assess international commercial AI/TDM, adaptation and storage rights for the Germany-based product.
4. If any material right is unclear, retain quarantine and seek written permission or exclude the work.
5. Add only individually approved records to the code allowlist, with exact HTTPS source URL prefixes and matching rights evidence.
6. Continue discovery across mathematics, physics, biology, statistics, sports science, medicine, football, computer science, banking, financial markets and risk management until 100 **individually reviewed works** are available. Do not pad the count with portals, websites, or unreviewed articles.
