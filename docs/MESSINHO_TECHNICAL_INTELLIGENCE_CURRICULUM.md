# MESSINHO – Technical Intelligence Curriculum v1.0

**Status:** versioned curriculum and knowledge-candidate preparation; not yet activated in the trusted knowledge graph.  
**Target domain:** `computer_science`  
**Purpose:** give MESSINHO transferable computer-science and software-engineering competence before granting it any autonomous code-execution or self-modification capability.

## 1. Design decision

MESSINHO must learn software development as a general discipline, not merely memorize commands for this repository. It must be able to explain concepts, reason about trade-offs, design solutions, write code, inspect existing code, test hypotheses, debug failures, and communicate uncertainty.

Knowledge acquisition and code execution are separate capabilities:
- **Knowledge capability:** understand, retrieve, connect, explain and apply technical concepts.
- **Engineering capability:** plan changes, produce code, tests and migration proposals.
- **Execution capability:** run tools, alter files, deploy or change infrastructure. This remains separately permissioned and is not enabled by this curriculum.

## 2. Learning sequence

### Level 0 – Computer and computational foundations
1. Computer systems: CPU, memory, storage, processes, operating systems, files, permissions and environment variables.
2. Computational thinking: decomposition, abstraction, pattern recognition, algorithms and invariants.
3. Data representation: binary, text encoding, Unicode, numbers, floating-point limits, dates and time zones.
4. Networking basics: DNS, IP, TCP, TLS, HTTP, request/response, status codes and latency.

**Mastery evidence:** explain a web request from browser to server and back; distinguish source code, process, memory and persistent storage.

### Level 1 – Programming fundamentals
5. Syntax, values, types, variables, expressions and operators.
6. Control flow: conditions, loops, branching and early returns.
7. Functions: parameters, return values, scope, pure functions and side effects.
8. Data structures: arrays/lists, maps/dictionaries, sets, stacks, queues, trees and graphs.
9. Algorithms: searching, sorting, recursion, iteration and time/space complexity.
10. Error handling: exceptions, validation, failure modes, logging and defensive programming.
11. Paradigms: procedural, object-oriented and functional programming; composition and modularity.

**Mastery evidence:** implement the same small task in Python and JavaScript, explain complexity and write tests for normal, boundary and invalid inputs.

### Level 2 – Core languages and web platform
12. Python: syntax, collections, functions, modules, classes, exceptions, virtual environments and package management.
13. JavaScript: values, scope, closures, objects, arrays, promises, async/await, modules and runtime behavior.
14. TypeScript: static typing, interfaces, unions, generics, narrowing and safe API contracts.
15. SQL and PostgreSQL: relational modeling, keys, constraints, joins, transactions, indexes, query plans and migrations.
16. Web platform: semantic HTML, CSS layout/responsiveness, browser events, accessibility and HTTP APIs.
17. React: components, props, state, effects, rendering and component boundaries.
18. Node.js and backend services: event loop, modules, Express routing, middleware, validation and service boundaries.

**Mastery evidence:** design and explain a typed API, persist validated data in PostgreSQL, and build a small responsive UI that consumes the API.

### Level 3 – Professional software engineering
19. Git: commits, branches, diffs, merges, conflicts, tags, revert and release history.
20. Architecture: separation of concerns, layering, dependency direction, cohesion, coupling, modularity and trade-offs.
21. API design: resource modeling, HTTP methods, idempotency, pagination, rate limiting, versioning and error contracts.
22. Testing: unit, integration, contract, end-to-end, regression and property-based testing; fixtures, mocks and test isolation.
23. Debugging: reproduce, isolate, form hypotheses, inspect evidence, minimize a failing case, fix root cause and prevent regression.
24. Code review: correctness, readability, maintainability, security, performance and backward compatibility.
25. Documentation: architecture decision records, API contracts, runbooks, changelogs and reproducible incident notes.
26. Performance: profiling, algorithmic cost, caching, database query efficiency and measurement before optimization.

**Mastery evidence:** trace a bug to its root cause, add a regression test, justify the patch and document deployment/rollback.

### Level 4 – Data, security and operations
27. Data engineering: schemas, normalization, integrity, ETL/ELT, provenance, lineage and data quality.
28. Security foundations: threat modeling, least privilege, authentication vs authorization, secrets, encryption and secure defaults.
29. Web security: injection, XSS, CSRF, SSRF, broken access control, session handling and dependency risks.
30. PostgreSQL/Supabase security: RLS, grants, policies, service-role isolation, migrations and safe privileged functions.
31. CI/CD: automated checks, reproducible builds, artifact promotion, staging, approvals and rollback.
32. Operations: structured logs, metrics, traces, health checks, alerts, backups, disaster recovery and incident response.
33. Supply-chain security: dependency pinning, lockfiles, provenance, vulnerability review and controlled upgrades.

**Mastery evidence:** identify trust boundaries, explain an RLS policy, design a least-privilege change and prepare a tested staging-only release with rollback steps.

### Level 5 – AI and intelligent systems
34. Mathematical foundations: vectors, matrices, probability, statistics, optimization and numerical stability.
35. Machine learning: supervised/unsupervised learning, train/validation/test splits, leakage, overfitting and calibration.
36. Neural networks: representations, loss functions, gradient descent, embeddings and evaluation.
37. Language models: tokens, context windows, inference, limitations, hallucinations and tool-use boundaries.
38. Retrieval systems: indexing, chunking, embeddings, lexical search, hybrid retrieval, reranking and provenance.
39. RAG and knowledge graphs: entities, relations, canonical concepts, versioning, evidence, conflicts and temporal validity.
40. Agent systems: planning, tool selection, state, memory, orchestration, retries, idempotency and human approval.
41. AI safety and evaluation: prompt injection, untrusted input, data exfiltration, capability boundaries, red-teaming and task-based evaluation.

**Mastery evidence:** design a retrieval pipeline, detect an unsupported answer, trace every claim to evidence and define measurable agent acceptance criteria.

### Level 6 – Controlled engineering autonomy
42. Requirements analysis: clarify intent, constraints, acceptance criteria and non-goals.
43. Change planning: inspect repository state, identify affected components, estimate risk and produce a minimal patch plan.
44. Implementation: edit only approved files/branches, preserve interfaces and keep changes scoped.
45. Verification: run tests, static checks, build, security checks and role/tenant isolation tests.
46. Release discipline: staging-only deployment, health verification, logs, rollback and evidence-based release notes.
47. Self-improvement loop: observe failure → formulate hypothesis → propose change → test in isolation → compare outcome → document → request approval.

**Mastery evidence:** MESSINHO can produce a complete patch proposal with tests and risk analysis, but cannot merge, deploy to production, alter permissions or rewrite its own guardrails without explicit authorization.

## 3. Required response standard for technical questions

Every technical answer should, where relevant:
1. Restate the problem and constraints.
2. Explain the underlying concept in plain language.
3. Show a minimal correct example.
4. Explain why the example works and identify alternatives.
5. Identify edge cases, failure modes and security implications.
6. Propose tests and expected results.
7. State what is unknown or version-dependent.
8. Link claims to current authoritative documentation.

Do not fabricate execution, test results, repository state, APIs or source claims. Distinguish code that was drafted from code that was actually run.

## 4. Assessment model

Each knowledge unit is assessed on five independent dimensions:
- **Conceptual accuracy:** definitions and mental model are correct.
- **Application:** can solve a new problem, not just repeat an example.
- **Verification:** can construct tests and interpret evidence.
- **Security and reliability:** recognizes trust boundaries and failure modes.
- **Explanation:** can communicate the solution at the user's technical level.

A unit is not mastered from one correct answer. Require multiple varied tasks, including at least one transfer task and one error-diagnosis task. Record evidence, version, assessment date and unresolved gaps.

## 5. Repository-specific learning labs

The curriculum will later use isolated, synthetic exercises inspired by the architecture of myScoutingDatabase:
- classify a technical question into `computer_science`;
- explain an Express route and its validation path;
- write a PostgreSQL query against a toy schema;
- reason about RLS using synthetic users and organizations;
- reproduce a missing-field projection bug and add a regression test;
- write a safe Git patch on a temporary branch;
- diagnose a failed CI build from logs;
- create a staging deployment checklist and rollback plan;
- detect a prompt-injection instruction inside untrusted source material.

Real player data, production secrets, production database writes and production deployments are excluded from training labs.

## 6. Source and rights policy

Initial authoritative reference set (reference links only; no full-text copying):
- Python Tutorial: https://docs.python.org/3/tutorial/
- MDN Web technology and JavaScript references: https://developer.mozilla.org/en-US/docs/Web
- TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/intro.html
- PostgreSQL documentation: https://www.postgresql.org/docs/current/
- React documentation: https://react.dev/learn
- Node.js Learn: https://nodejs.org/en/learn
- Git Book: https://git-scm.com/book/en/v2
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- OWASP Cheat Sheet Series: https://cheatsheetseries.owasp.org/
- NIST Secure Software Development Framework (SSDF): https://csrc.nist.gov/Projects/ssdf

**Important:** a public URL does not automatically grant AI training, text/data mining, commercial or derivative-use rights. Before any source-derived content is stored as a permanent knowledge record, verify the exact work/edition, license, attribution, permitted use, retrieval method and review date against the repository rights registry. Until that check passes, records remain local/versioned candidates and are not active trusted knowledge.

## 7. Integration gates

- Gate A: curriculum and concept keys reviewed.
- Gate B: each source's rights verified; compact independent summaries only.
- Gate C: prerequisite graph and claim/source mapping validated.
- Gate D: candidate records pass schema, duplicate, conflict and evidence checks.
- Gate E: Admin review approves records; no automatic activation.
- Gate F: retrieval tests prove concepts are found, explained and applied.
- Gate G: programming mastery tests pass before any code-execution capability is considered.

## 8. Current implementation status

- Curriculum specification: prepared in this versioned document.
- Domain routing: expanded so Python, JavaScript, TypeScript, SQL, PostgreSQL, Supabase, React, Node.js, APIs, Git, testing, DevOps, security, RAG and embeddings route to `computer_science`.
- Regression tests: added for technical terms and preservation of football/sports-science routing.
- Knowledge database: not modified; no candidate was approved or activated.
- Code execution / self-modification: not enabled.
- Next steps: run CI; then create source-rights-reviewed candidate concepts in small batches, add the prerequisite graph, and assess retrieval and application in STAGING.
