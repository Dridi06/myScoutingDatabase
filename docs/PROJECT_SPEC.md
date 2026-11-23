# myScoutingDatabase — Project specification

## Data model from the source PDF
**Master data:** Spielername, Verein, Datum, Dokumentiert, Jahrgang, Spielfuß (Linksfuß/Rechtsfuß), Größe.

**Technik:** Dribbling; Passspiel kurz; Passspiel lang; Beidfüssigkeit; Kopfballspiel; 1:1 Offensiv; Ball An/Mitnahme; Erster Kontakt; Repertoire Finten; Variabler Torschuss.

**Taktik:** 1:1 Defensiv; Kreativität; Raumverhalten; Spiel ohne Ball; Anspielbereitschaft; Zweikampf; Umschaltspiel; Handlungsschnelligkeit; Antizipationsfähigkeit; Lösen vom Gegner.

**Athletik:** Laufbild; Laufaktivität; Körperlichkeit; Antrittsschnelligkeit; Schnelligkeit Distanz; Bewegungsgeschicklichkeit.

**Mentalität:** Einstellung; Führungsspieler; Kommunikation; Risikofreude; Positive Körpersprache; Teamplayer; Spieleinfluss; Disziplin/Konzentration.

Each criterion uses a four-level rating (1–4). Additional details: notes, contract and term, agent and name, categories Eins/Zwei/Drei, positions AV re/li, IV re/li, 6er, 8er, 10er, Flügel re/li, 9er, parents' contact details.

## Roles
- Admin: global read/create/update/delete and Scout approval.
- Scout: own database only, own records only after approval.
- Maximum 15 Scout accounts including pending registrations.

## ID strategy
A global PostgreSQL sequence starts at 1; IDs are never reused after deletion.

## Duplicate control
Case-insensitive unique fingerprint on name + year + club.
