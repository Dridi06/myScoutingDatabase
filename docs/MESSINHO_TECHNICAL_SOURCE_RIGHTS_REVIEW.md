# MESSINHO Technical Curriculum — Source Rights Review Ledger

**Review date:** 2026-11-27  
**Status:** research completed at a preliminary level; no new source is approved for permanent knowledge ingestion.  
**Scope:** the 17 distinct URLs referenced by technical curriculum package v2.0.0.

## 1. Decision rule

A public page, open-source project, or permissive software license is not automatically a blanket permission for every use of its documentation in a commercial AI knowledge system. The MESSINHO rights registry requires exact-work/edition provenance, rights holder, license text, attribution, AI/TDM basis, commercial-use basis, derivative-use basis, retrieval method, exact URL scope, review date and expiry.

The existing allowlist has four individually reviewed works, but none is a blanket authorization for the technical sources below. This ledger does not alter the executable allowlist.

## 2. Preliminary source findings

| Source | Official evidence | Preliminary reading | Decision |
|---|---|---|---|
| Python documentation | https://docs.python.org/3/license.html | The PSF License 2.0 covers Python and associated documentation and expressly grants rights to reproduce, analyze, prepare derivative works and otherwise use Python subject to notice conditions. This is a strong permission signal, but the exact documentation edition, relevant third-party material, retention/attribution duties and applicability to the intended AI/TDM ingestion workflow still need exact review. | PENDING — not allowlisted |
| MDN Web Docs | https://developer.mozilla.org/en-US/docs/MDN/Writing_guidelines/Attrib_copyright_license | MDN states prose documentation is generally CC BY-SA 2.5 or later and requires attribution to the specific page and Mozilla Contributors. Reused/adapted material must be shared under the same license. This ShareAlike obligation may be incompatible with how MESSINHO's proprietary knowledge records are distributed or stored unless the derivative-work question and licensing architecture are resolved. Code examples may have different licenses. | PENDING — ShareAlike compatibility review |
| PostgreSQL documentation | https://www.postgresql.org/about/licence/ | The PostgreSQL License grants use, copying, modification and distribution of the software and its documentation for any purpose, subject to notice conditions. This is broad and commercial-friendly, but the exact docs version, any third-party content, and the legal basis for the planned AI/TDM processing still need to be recorded per exact work. | PENDING — exact documentation/AI-TDM review |
| OWASP ASVS | https://owasp.org/projects/ASVS | The project page identifies CC BY-SA 4.0. Attribution and ShareAlike obligations apply. The exact version/repository artifact and compatibility with MESSINHO's distribution model need review. | PENDING — ShareAlike compatibility review |
| NIST SP 800-218 (SSDF) | https://csrc.nist.gov/pubs/sp/800/218/final | NIST states that works created solely by NIST employees are generally not subject to US copyright, but NIST also notes that its publications may be protected outside the US and reuse abroad may require permission. Authorship and third-party material must be checked for the exact publication. | PENDING — German/EU rights and author check |
| NIST AI 100-1 (AI RMF) | https://csrc.nist.gov/pubs/ai/100/1/final | The same NIST caveat applies: verify exact authorship, third-party content and reuse position outside the United States before treating the material as cleared. | PENDING — German/EU rights and author check |
| TypeScript Handbook | https://www.typescriptlang.org/docs/handbook/intro.html | No exact work-level rights evidence was captured in this review. | PENDING — obtain repository/site license and exact edition |
| React Learn documentation | https://react.dev/learn | No exact documentation-content license evidence was captured in this review. The React software license must not be assumed to cover all documentation prose. | PENDING — obtain docs-content license and exact edition |
| Node.js Learn documentation | https://nodejs.org/en/learn | No exact documentation-content license evidence was captured in this review. | PENDING — obtain docs-content license and exact edition |
| Git Book | https://git-scm.com/book/en/v2 | The book has its own content/license history; no current exact edition and reuse scope were verified in this review. | PENDING — verify book edition and license |

## 3. Primary evidence captured

- Python documentation license: https://docs.python.org/3/license.html — PSF License 2.0 text and documentation scope.
- MDN attribution and copyright: https://developer.mozilla.org/en-US/docs/MDN/Writing_guidelines/Attrib_copyright_license — prose CC BY-SA 2.5 or later; attribution and ShareAlike terms.
- PostgreSQL license: https://www.postgresql.org/about/licence/ — documentation included in broad permission grant for any purpose, with notice requirements.
- OWASP ASVS project identity: https://owasp.org/projects/ASVS — project identifies CC BY-SA 4.0.
- NIST copyright policy: https://www.nist.gov/copyrights-disclaimers and https://www.nist.gov/nist-research-library/library-faqs — public-information position and explicit non-US caveat for publications.

## 4. Mandatory clearance checklist for each exact source

1. Identify the exact title, author/rights holder, version/edition, publication date and canonical URL.
2. Capture the license or permission notice that applies to the content itself, not merely the software that renders it.
3. Check AI/TDM and commercial use, including any rights reservation, site terms, robots/access restrictions and jurisdiction-specific restrictions.
4. Identify attribution, notice, change-indication and ShareAlike obligations.
5. Exclude third-party images, code, quotations, embedded works and linked publisher material unless separately cleared.
6. Confirm whether the planned retrieval method (API, official export, HTML or repository checkout) is permitted.
7. Record an independent review, reviewer, date, review expiry and evidence URL.
8. Add an exact source entry to `backend/messinho-rights-registry.js` only after the above checks pass; add tests for the exact URL and rights payload.
9. Do not set `verified_permitted` based on a search snippet or a provider-supplied license claim.
10. Only after at least two independently verified sources support the same material claims may a concept be submitted for Admin approval. Prerequisites must already be active.

## 5. Current operational result

- 17 distinct reference URLs in the technical curriculum package.
- 0 newly cleared sources.
- 0 new technical concepts imported into Supabase.
- 0 new technical concepts activated.
- Existing four-entry rights allowlist unchanged.
- Existing active knowledge and all user/player/scouting data unchanged.
- No schema, grant, RLS, production or environment changes made.

This is a conservative legal and technical gate, not a conclusion that the sources are unusable. It records what is established and what remains to be verified before permanent ingestion.
