# PROJECTSCOUT Addendum — MESSINHO Programming Languages

Date: 2026-11-27  
Project: myScoutingDatabase / MESSINHO  
Scope: feature branch only; STAGING-only policy remains unchanged.

## Implemented

- Added `backend/messinho-programming-languages.js` with a versioned curriculum (`1.0.0`) for 11 language/tooling areas:
  1. JavaScript and TypeScript
  2. Python
  3. SQL / PostgreSQL
  4. HTML and CSS
  5. Java
  6. C# / .NET
  7. Go
  8. Rust
  9. C / C++
  10. PHP
  11. Bash / Shell
- Each profile contains domains, language-specific concepts, relevant tooling and a practical mastery criterion.
- The curriculum covers type systems, runtime and memory models, concurrency, packages/builds, testing, debugging and security risks where relevant.
- Integrated the profiles into `buildMessinhoProgrammingLearningContext()` in `backend/messinho-programming-learning.js`; the programming curriculum version is now `1.2.0`.
- Wired the same context into the existing `/api/agent/chat` system prompt only when a signed-in Admin asks a programming/software-development question. Scout requests never receive this programming context. This lets the existing MESSINHO conversation use the language knowledge without creating a second agent.
- MESSINHO's existing engineering reviewer receives this expanded context automatically through the existing learning-context builder. No separate agent or provider was added.
- Added regression tests for all 11 profiles, minimum concept/tool coverage, versioning and deterministic context generation.
- Added the detailed curriculum reference at `docs/MESSINHO_PROGRAMMING_LANGUAGE_CURRICULUM.md`.

## Learning order

Project-relevant technologies are prioritized first: JavaScript/TypeScript, Python, SQL, HTML/CSS. Java and C# follow for typed enterprise backends; Go and Rust for concurrency/system services; C/C++, PHP and Bash cover systems, web ecosystems and automation.

## Safety and truthfulness

- This is persistent, version-controlled knowledge injected into MESSINHO's reasoning context. It is not model-weight training.
- The profiles are a structured foundation, not proof that MESSINHO has achieved expert practical mastery of every language.
- New material must be checked for source, author, date/version, license, relevance, accuracy and contradictions; only reviewed and admin-approved material becomes verified knowledge.
- Code execution, patch application, merge and deployment remain outside autonomous permissions.
- No player/scout data, database schema, RLS, auth, roles, production or `main` were changed.

## Verification state

- Code and test files have been committed to `feature/messinho-unified-ai-integration`.
- Latest code commit at this checkpoint: `1673a4a1f278909da2b363c9cf9c17028ea2d2f4`.
- GitHub combined commit status currently returns no status entries. Therefore CI execution/result is not yet confirmed.
- No Render STAGING deployment was triggered for this curriculum change. Do not treat the new language curriculum as live until CI is green and the exact commit is deployed and checked on STAGING.
- Next: confirm CI on the branch HEAD; if green, manually deploy that exact HEAD to Render STAGING; then verify MESSINHO's effective language context in an authenticated Admin session. Production remains untouched.
