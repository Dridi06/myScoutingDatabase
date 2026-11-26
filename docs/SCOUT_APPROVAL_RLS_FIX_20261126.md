# STAGING-Fix: Scout-Freigabe unter RLS – 26.11.2026

## Ursache
Die Admin-Oberfläche ruft `public.admin_set_scout_approval(uuid, boolean)` auf. Die Funktion war als `SECURITY INVOKER` definiert. Die RLS-Policies auf `public.profiles` erlauben UPDATE nur auf das eigene Profil; eine Admin-UPDATE-Policy für fremde Scout-Profile existiert nicht. Dadurch konnte die RPC trotz korrekter Admin-Prüfung das Scout-Profil nicht aktualisieren.

## Korrektur
- Migration: `20261126200000_fix_admin_scout_approval_rls.sql`
- Funktion ist jetzt `SECURITY DEFINER`, mit leerem `search_path`.
- Die Funktion prüft weiterhin `auth.uid()` und `private.is_admin()`.
- Sie ändert ausschließlich `approved`, `approval_status` und `updated_at`.
- EXECUTE ist für `authenticated` und `service_role` gewährt; `PUBLIC` und `anon` sind widerrufen.
- Keine allgemeine Admin-UPDATE-RLS-Policy wurde hinzugefügt.

## Verifikation
- Migration erfolgreich auf STAGING Supabase Projekt `nwqwnrhupbyhshsprxjt` angewendet.
- Funktion verifiziert: `prosecdef=true`, `search_path=""`.
- Berechtigungen verifiziert: EXECUTE für `authenticated`; kein EXECUTE für `anon` oder `PUBLIC`.
- Scout3 bleibt bis zur expliziten Admin-Aktion `approved=false`, `approval_status=pending`. Es wurde nicht eigenmächtig freigeschaltet.
- Git-Commit auf `feature/messinho-unified-ai-integration`: `0ca5b65166a8a2ff46a93f55f1d9bd786076d56b`.
- Keine Produktionsänderung, kein Merge, keine Promotion.

## Noch offener E2E-Test
Admin soll STAGING neu laden und Scout3 in der Scout-Verwaltung freischalten. Danach Status in der STAGING-Datenbank prüfen und authentifizierte Scout3-Chattests durchführen.