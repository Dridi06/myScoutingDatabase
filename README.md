# myScoutingDatabase

Professionelles Fußball-Scouting und Spielerverwaltung.

## Architektur
- React + Vite Frontend
- Express API
- Supabase Auth und PostgreSQL
- Row Level Security: Scouts sehen nur ihre eigenen Spieler; Admin sieht alle.
- Neue Scout-Konten bleiben bis zur Admin-Freigabe gesperrt.
- Maximale Anzahl: 15 Scouts.

## Lokale Entwicklung
1. `npm install`
2. `.env.example` nach `.env` kopieren und Werte ergänzen.
3. `npm run dev` startet Vite.
4. `npm start` startet die API (nach `npm run build`).

## Wichtige Umgebungsvariablen
Frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.
Backend: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_INITIAL_PASSWORD`, `APP_ORIGIN`.

**Sicherheit:** Niemals den Supabase Service-Role-Key, JWT-Secret oder echte Admin-Passwörter in GitHub committen. Diese Werte ausschließlich als geheime Environment-Variablen beim Hosting hinterlegen.

## Datenbank
SQL-Migrationen in `supabase/migrations` in numerischer Reihenfolge im Supabase SQL Editor ausführen. Die Migrationen enthalten Profile, Spieler, Rollen, RLS, Scout-Freigabe und Datenvalidierung.

## Deployment
Auf Render als Node Web Service deployen:
- Build: `npm install && npm run build`
- Start: `npm start`
- Region: Frankfurt
- Alle Backend-Geheimnisse im Render-Dashboard hinterlegen.
- `APP_ORIGIN` auf die öffentliche Render-URL setzen.

Admin-Bootstrap legt den Admin anhand von `ADMIN_EMAIL` und `ADMIN_INITIAL_PASSWORD` an, sobald der Backend-Service mit Supabase Service-Role-Key startet. Nach dem ersten Login das initiale Passwort ändern.
