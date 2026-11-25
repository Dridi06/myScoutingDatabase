# FUSSBALL.DE authorized integration plan

Status: BLOCKED_PENDING_RIGHTS_AND_API_ACCESS

## Goal
Integrate FUSSBALL.DE as a first-class, auditable source for myScoutingDatabase and MESSINHO, without scraping or bypassing access controls.

## Legal and technical gate
The FUSSBALL.DE imprint states that its amateur-football data originates from DFBnet, identifies DFB GmbH & Co. KG as the database rights holder, restricts ordinary database use to private natural-person use, and reserves commercial text/data mining. DFB terms also prohibit automated data extraction/scraping. Therefore no automated collection, mirroring, bulk import, or production activation may occur until written permission and a documented interface/license are provided.

Official references:
- https://www.fussball.de/imprint
- https://www.dfb.de/nutzungsbedingungen
- https://portal.dfbnet.org/de/funktionen/agb

## Proposed integration shape
1. Provider adapter: `backend/providers/fussball-de.js`
   - only use an endpoint and authentication scheme documented/provided by DFB.
   - no HTML scraping, reverse-engineered private endpoints, browser automation, or credential reuse.
   - fail closed when permission, API base URL, or credentials are absent.
2. Backend ingestion:
   - server-side only; never expose provider credentials to the browser.
   - rate limits, bounded pagination, retries with backoff, request audit.
   - store source URL, provider record ID, retrieved_at, published_at, license scope, and verification status.
3. Data model:
   - separate provider identifiers from internal player IDs.
   - identity matching requires corroborating attributes; ambiguous matches stay pending.
   - preserve provenance and source timestamps; do not overwrite scout notes or verified internal records.
4. MESSINHO:
   - consume only licensed, source-attributed, identity-matched evidence.
   - distinguish official match facts from model interpretation.
   - no automatic learning from imported facts; learning requires verified outcomes under existing gates.
5. UI:
   - show FUSSBALL.DE source badge, last checked timestamp, source link, and evidence confidence.
   - no FUSSBALL.DE data shown as available until the authorization and API gates pass.

## Candidate data scope (subject to DFB license)
- club and team identifiers/names
- competition/league and season
- fixtures, results, match reports
- lineups, substitutions, goals and cards
- squad/player profile fields and player appearances
Only fields explicitly covered by the written license may be ingested or retained. Photos, youth/minor data, and sensitive personal data require separate review and should be excluded by default.

## Activation checklist
- [ ] Written permission from DFB GmbH & Co. KG covering this product and its commercial/scouting use
- [ ] Official API/feed documentation and test credentials
- [ ] Confirmed permitted fields, retention, caching, attribution, display, and deletion rules
- [ ] GDPR/legal review for player data, especially minors and images
- [ ] Adapter contract tests against DFB sandbox/test environment
- [ ] Admin-only pilot with read-only ingestion and audit trail
- [ ] Explicit production enablement after approval

## Current behavior
No FUSSBALL.DE requests are made. This document does not imply an active connection or permission.
