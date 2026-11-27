/**
 * MESSINHO language curriculum — versioned, reusable language-specific foundations.
 * These profiles define what the agent must understand and verify; they do not claim model-weight training.
 */
export const MESSINHO_PROGRAMMING_LANGUAGES_VERSION = '1.0.0';

export const MESSINHO_PROGRAMMING_LANGUAGES = Object.freeze([
  {
    id: 'javascript-typescript', name: 'JavaScript und TypeScript', priority: 1,
    domains: ['Frontend', 'Backend', 'APIs', 'asynchrone Anwendungen'],
    concepts: [
      'Primitive und Referenztypen, Scope, Closures, Hoisting, Prototypen und Module',
      'Promises, async/await, Event Loop, Microtasks, Streams und Fehlerweitergabe',
      'TypeScript: Structural Typing, Interfaces, Generics, Narrowing, unknown statt any und Compileroptionen',
      'Node.js: ESM/CommonJS, npm, package-lock, Prozessmodell, Buffer, Streams und sichere Umgebungsvariablen',
      'Browser: DOM, Events, Fetch, Storage-Grenzen, CSP und sichere Ausgabe',
      'React: Komponenten, Props, State, Hooks, Effects, kontrollierte Formulare und Rendering',
      'Tests mit Node Test Runner/Jest/Vitest, Mocking, Integrationstests und asynchrone Race-Tests',
      'Sicherheit: XSS, Prototype Pollution, ReDoS, unsichere Deserialisierung, SSRF und Dependency Supply Chain'
    ],
    tools: ['Node.js', 'npm', 'TypeScript', 'Vite', 'React', 'Vitest'],
    mastery: 'Kann asynchrone Datenflüsse und Typgrenzen erklären, sichere APIs implementieren und reproduzierbare Tests schreiben.'
  },
  {
    id: 'python', name: 'Python', priority: 2,
    domains: ['Backend', 'Datenanalyse', 'Automatisierung', 'KI/ML'],
    concepts: [
      'Objekte, Namespaces, Mutability, Iterables, Iteratoren, Generatoren und Comprehensions',
      'Funktionen, Decorators, Context Manager, Exceptions und Typannotationen',
      'Klassen, Dataclasses, Protocols, Vererbung und Komposition',
      'asyncio, async/await, Tasks, Threads, Prozesse und GIL-Grundlagen',
      'Pakete, virtuelle Umgebungen, pyproject.toml, pip und reproduzierbare Abhängigkeiten',
      'HTTP-APIs mit FastAPI/Flask, Validierung, Serialisierung und Datenbanktransaktionen',
      'pytest, Fixtures, Parametrisierung, Mocks, Property-based Tests und Coverage',
      'Sicherheit: SQL-Injection, Pickle-Risiken, Path Traversal, Command Injection, Secrets und Dependency Pinning'
    ],
    tools: ['CPython', 'venv', 'pip', 'pytest', 'FastAPI', 'Flask', 'mypy'],
    mastery: 'Kann Python-Code idiomatisch strukturieren, APIs validieren, Fehler testen und Nebenläufigkeit passend auswählen.'
  },
  {
    id: 'sql', name: 'SQL und relationale Datenbanken', priority: 3,
    domains: ['Datenmodellierung', 'PostgreSQL', 'Datenintegrität', 'Berichte'],
    concepts: [
      'SELECT, WHERE, JOIN, GROUP BY, HAVING, CTEs, Window Functions und NULL-Semantik',
      'Primär-/Fremdschlüssel, Constraints, Normalisierung und bewusst begründete Denormalisierung',
      'Transaktionen, ACID, Isolation Levels, Locks, Deadlocks und MVCC',
      'Indizes, EXPLAIN/ANALYZE, Query-Pläne, N+1-Probleme und Pagination',
      'DDL/DML, sichere Migrationen, Expand-and-Contract und Rückwärtskompatibilität',
      'PostgreSQL: JSONB, Arrays, Schemas, Rollen, Grants und Funktionen',
      'Row Level Security, Policies, SECURITY DEFINER, search_path und minimale Rechte',
      'Sicherheit: parametrisierte Abfragen, Least Privilege, Datenminimierung und Backup/Restore'
    ],
    tools: ['PostgreSQL', 'psql', 'EXPLAIN ANALYZE', 'Supabase'],
    mastery: 'Kann Datenmodelle und Abfragen korrekt gestalten, Transaktionsrisiken erklären und RLS/Grants sicher prüfen.'
  },
  {
    id: 'html-css', name: 'HTML und CSS', priority: 4,
    domains: ['Web-Oberflächen', 'Accessibility', 'Responsive Design'],
    concepts: [
      'Semantisches HTML, Dokumentstruktur, Formulare, Labels und native Validierung',
      'CSS-Kaskade, Spezifität, Vererbung, Box Model und Formatting Contexts',
      'Flexbox, Grid, Positionierung, Container Queries und responsive Breakpoints',
      'Design Tokens, Custom Properties, Wartbarkeit und reduzierte Motion',
      'Accessibility: Tastaturbedienung, Fokus, Kontrast, ARIA nur bei Bedarf und Screenreader',
      'Performance: kritisches CSS, Font Loading, Bildgrößen und Layout Shift',
      'Sichere Ausgabe, CSP, Formularschutz und keine vertraulichen Daten im DOM'
    ],
    tools: ['Browser DevTools', 'Lighthouse', 'axe'],
    mastery: 'Kann robuste, responsive und barrierearme Oberflächen ohne unnötige ARIA- oder CSS-Hacks bauen.'
  },
  {
    id: 'java', name: 'Java', priority: 5,
    domains: ['Backend', 'Enterprise', 'Services'],
    concepts: [
      'JVM, Bytecode, Garbage Collection, Klassen, Interfaces und Packages',
      'Generics, Collections, Streams, Optionals und Exceptions',
      'Concurrency: Threads, Executors, Synchronization, volatile und CompletableFuture',
      'JDBC, Transaktionen, Connection Pools und sichere Prepared Statements',
      'Spring Boot: Dependency Injection, Controller, Services, Validation und Security',
      'JUnit, Mockito, Integrationstests und Testcontainers',
      'Sicherheit: Deserialization, Injection, SSRF, Dependency Management und Secrets'
    ],
    tools: ['JDK', 'Maven', 'Gradle', 'JUnit', 'Spring Boot'],
    mastery: 'Kann JVM-Laufzeit, objektorientierte Strukturen und sichere transaktionale Services erklären und testen.'
  },
  {
    id: 'csharp-dotnet', name: 'C# und .NET', priority: 6,
    domains: ['Backend', 'Enterprise', 'Desktop', 'Cloud Services'],
    concepts: [
      'Value/Reference Types, Records, Nullable Reference Types und Pattern Matching',
      'LINQ, Generics, Delegates, Events und async/await',
      'Task, CancellationToken, Thread Safety und ConfigureAwait-Kontext',
      'ASP.NET Core: Middleware, Dependency Injection, Routing und Model Validation',
      'Entity Framework Core, Tracking, Migrations, Transactions und SQL-Performance',
      'xUnit/NUnit, Moq und Integrationstests',
      'Sicherheit: AuthN/AuthZ, CSRF, XSS, Secrets, SSRF und sichere Konfiguration'
    ],
    tools: ['.NET SDK', 'NuGet', 'ASP.NET Core', 'EF Core', 'xUnit'],
    mastery: 'Kann asynchrone .NET-Services und Datenzugriffe robust, testbar und sicher gestalten.'
  },
  {
    id: 'go', name: 'Go', priority: 7,
    domains: ['Backend', 'Netzwerkdienste', 'Cloud Infrastruktur'],
    concepts: [
      'Packages, Interfaces, Structs, Methods und Composition',
      'Slices, Maps, Pointers, Zero Values und Escape Analysis',
      'Goroutines, Channels, Select, Context und Cancellation',
      'Fehlerwerte, Wrapping, Defer, Panic und Recover',
      'HTTP-Server, Middleware, JSON und Datenbankzugriffe',
      'go test, Race Detector, Fuzzing und Benchmarks',
      'Sicherheit: Input Limits, Timeouts, TLS, SSRF und sichere Fehlerausgaben'
    ],
    tools: ['Go toolchain', 'go test', 'go vet', 'staticcheck'],
    mastery: 'Kann nebenläufige Go-Programme ohne Leaks und Data Races entwickeln und mit Race Detector prüfen.'
  },
  {
    id: 'rust', name: 'Rust', priority: 8,
    domains: ['Systemnahe Software', 'Performance', 'sichere Services'],
    concepts: [
      'Ownership, Borrowing, Lifetimes und Referenzregeln',
      'Structs, Enums, Pattern Matching und Traits',
      'Result, Option, Fehlerweitergabe und Panic-Grenzen',
      'Generics, Iterators, Traits und Cargo',
      'Send/Sync, Threads, Async Runtime und Shared State',
      'Unit-, Integration-, Doc-Tests und Clippy',
      'Unsafe Rust, FFI und Abhängigkeitsprüfung als explizite Risikobereiche'
    ],
    tools: ['rustc', 'Cargo', 'Clippy', 'rustfmt'],
    mastery: 'Kann Ownership- und Typregeln nutzen, um Speicher- und Nebenläufigkeitsfehler systematisch zu vermeiden.'
  },
  {
    id: 'cpp-c', name: 'C und C++', priority: 9,
    domains: ['Systemprogrammierung', 'Embedded', 'Performance'],
    concepts: [
      'Speichermodell, Stack/Heap, Pointer, Referenzen und Lebensdauer',
      'Undefined Behavior, Buffer Overflows, Integer Overflow und Alignment',
      'C++ RAII, Smart Pointer, Move Semantics, Templates und STL',
      'C-Header, Compilation, Linking, ABI und Build-Systeme',
      'Threads, Atomics, Mutexes und Data Races',
      'Sanitizer, Valgrind, Unit- und Fuzz-Tests',
      'Sicherheit: Bounds Checking, sichere APIs, Sanitizer und minimale unsafe Bereiche'
    ],
    tools: ['GCC', 'Clang', 'CMake', 'AddressSanitizer', 'UBSan'],
    mastery: 'Kann Speicherlebensdauer und Undefined Behavior erkennen und mit Sanitizern abgesicherte Änderungen planen.'
  },
  {
    id: 'php', name: 'PHP', priority: 10,
    domains: ['Backend', 'Web-Anwendungen', 'CMS'],
    concepts: [
      'Typen, Arrays, Namespaces, Composer und Autoloading',
      'OOP, Interfaces, Traits, Exceptions und Dependency Injection',
      'HTTP Request Lifecycle, Sessions, Cookies und sichere Konfiguration',
      'PDO, Prepared Statements, Transaktionen und ORM-Grundlagen',
      'Laravel/Symfony: Routing, Middleware, Validation und Services',
      'PHPUnit, Integrationstests und statische Analyse',
      'Sicherheit: SQL-Injection, XSS, CSRF, Session Fixation, File Uploads und Path Traversal'
    ],
    tools: ['PHP', 'Composer', 'PHPUnit', 'PHPStan', 'Laravel', 'Symfony'],
    mastery: 'Kann Web-Request-Flows sicher implementieren und Eingaben, Sessions und Datenbankzugriffe schützen.'
  },
  {
    id: 'bash-shell', name: 'Bash und Shell-Scripting', priority: 11,
    domains: ['Entwicklerwerkzeuge', 'CI/CD', 'Betriebsautomatisierung'],
    concepts: [
      'Quoting, Expansion, Globbing, Exit Codes und sichere Variablenbehandlung',
      'Pipelines, stdin/stdout/stderr, Redirection und Prozesssignale',
      'set -euo pipefail mit bewusstem Fehlerhandling und ShellCheck',
      'Temporäre Dateien, Trap, Cleanup und idempotente Skripte',
      'Sichere Argumentübergabe ohne eval und ohne unsichere String-Kommandos',
      'CI-Workflows, Umgebungsvariablen und Secret Masking',
      'Keine ungeprüften Remote-Skripte, destruktiven Befehle oder Produktionsaktionen'
    ],
    tools: ['Bash', 'ShellCheck', 'shfmt'],
    mastery: 'Kann kleine idempotente Automatisierungen mit sicherem Quoting, Fehlerbehandlung und klaren Grenzen schreiben.'
  }
]);

export function buildMessinhoLanguageLearningContext({maxLanguages=11}={}) {
  return {
    version: MESSINHO_PROGRAMMING_LANGUAGES_VERSION,
    languages: MESSINHO_PROGRAMMING_LANGUAGES
      .slice()
      .sort((a,b)=>a.priority-b.priority)
      .slice(0,Math.max(1,Math.min(11,maxLanguages))),
    cross_language_rules: [
      'Vor einer Lösung Sprache, Version, Runtime, Framework und Zielumgebung anhand des Projekts feststellen; nicht raten.',
      'Syntax allein reicht nicht: Typmodell, Speicher-/Lebensdauer, Nebenläufigkeit, Fehlerbehandlung, Paketverwaltung und Runtime verstehen.',
      'Framework- und API-Versionen anhand vorhandener Lockfiles, offizieller Dokumentation und Quellcode prüfen.',
      'Keine Sprache pauschal als sicherer oder schneller bezeichnen; anhand konkreter Anforderungen und Messungen entscheiden.',
      'Bevorzugt offizielle Sprach- und Framework-Dokumentation; Community-Beiträge nur ergänzend und mit Versionsprüfung.',
      'Beispiele müssen kompilierbar/ausführbar sein, Versionen nennen und positive, negative sowie Grenzfalltests enthalten.',
      'Keine Shell-, Netzwerk-, Datei-, Datenbank- oder Deployment-Aktion aus Codebeispielen ungeprüft ausführen.',
      'Neue Sprachkenntnisse erst nach Quellenprüfung, Testbelegen und Admin-Freigabe dauerhaft als verifiziert markieren.'
    ],
    learning_sequence: [
      'Programmierlogik und Datenstrukturen sprachübergreifend beherrschen.',
      'JavaScript/TypeScript, Python, SQL sowie HTML/CSS vertiefen, weil sie die aktuelle Web-/Backend-/Datenbankarchitektur direkt betreffen.',
      'Java und C# für typisierte Enterprise-Backend-Architekturen erlernen.',
      'Go und Rust für nebenläufige und systemnahe Services verstehen.',
      'C/C++ für Speicher- und Performance-Grundlagen, PHP für Web-Ökosysteme und Bash für sichere Automatisierung erlernen.',
      'Für jede Sprache Wissensstand durch Codeverständnis, kleine Implementierungen, Tests, Debugging und Sicherheitsreviews nachweisen.'
    ]
  };
}
