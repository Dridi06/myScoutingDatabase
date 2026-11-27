/**
 * Central guard for commands that alter MESSINHO, its operating state, or
 * platform-wide configuration. Ordinary scouting requests remain available.
 * This is an intent guard in addition to the Admin-only API middleware.
 */
const TARGET = String.raw`(?:messinho|myki|my\s*ki|ki|system|plattform|agent|wissensbasis|wissensnetz|modell|lernmodell|programmiersandbox|autonomie)`;
const ACTION = String.raw`(?:stoppe|pausiere|starte|aktiviere|deaktiviere|konfiguriere|konfigurier|ändere|aendere|verändere|veraendere|setze|schalte|entwickle|trainiere|lerne|importiere|integriere|installiere|deinstalliere|lösche|loesche|setze\s+zurück|setze\s+zurueck|gib\s+frei|freigeben|übernimm|uebernimm|ändere|aendere)`;
const PROTECTED_TOPIC = /\b(?:betriebsmodus|autonome?\s+entwicklung|systemkonfiguration|systemregeln|kernregeln|modellgewichte|modellversion|wissensfreigabe|wissen\s+(?:importieren|einspielen|freigeben|aktivieren)|rollen\s+und\s+rechte|berechtigungen|admin.?einstellungen|agentensteuerung|programmier.?sandbox|code\s+(?:integrieren|übernehmen|uebernehmen)|systemdiagnose\s+(?:starten|ändern|aendern))\b/i;

const clean = value => typeof value === 'string'
  ? value.normalize('NFKC').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 1200)
  : '';

export function isMessinhoAdminOnlyCommand(value) {
  const message = clean(value);
  if (!message) return false;
  const targetFirst = new RegExp(String.raw`\\b${TARGET}\\b.{0,70}\\b${ACTION}\\b`, 'i');
  const actionFirst = new RegExp(String.raw`\\b${ACTION}\\b.{0,70}\\b${TARGET}\\b`, 'i');
  return targetFirst.test(message) || actionFirst.test(message) || PROTECTED_TOPIC.test(message);
}
