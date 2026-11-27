/**
 * Central guard for commands that alter MESSINHO, its operating state, or
 * platform-wide configuration. Ordinary scouting requests remain available.
 * This complements (never replaces) Admin-only API authorization.
 */
const TARGET_ACTION = /\b(?:messinho|myki|my\s*ki|ki|system|plattform|agent|wissensbasis|wissensnetz|modell|lernmodell|programmiersandbox|autonomie)\b.{0,70}\b(?:stoppe|pausiere|starte|aktiviere|deaktiviere|konfiguriere|konfigurier|ändere|aendere|verändere|veraendere|setze|schalte|entwickle|trainiere|lerne|importiere|integriere|installiere|deinstalliere|lösche|loesche|gib\s+frei|freigeben|übernimm|uebernimm)\b/i;
const ACTION_TARGET = /\b(?:stoppe|pausiere|starte|aktiviere|deaktiviere|konfiguriere|konfigurier|ändere|aendere|verändere|veraendere|setze|schalte|entwickle|trainiere|lerne|importiere|integriere|installiere|deinstalliere|lösche|loesche|gib\s+frei|freigeben|übernimm|uebernimm)\b.{0,70}\b(?:messinho|myki|my\s*ki|ki|system|plattform|agent|wissensbasis|wissensnetz|modell|lernmodell|programmiersandbox|autonomie)\b/i;
const PROTECTED_TOPIC = /\b(?:betriebsmodus|autonome?\s+entwicklung|systemkonfiguration|systemregeln|kernregeln|modellgewichte|modellversion|wissensfreigabe|wissen\s+(?:importieren|einspielen|freigeben|aktivieren)|rollen\s+und\s+rechte|berechtigungen|admin.?einstellungen|agentensteuerung|programmier.?sandbox|code\s+(?:integrieren|übernehmen|uebernehmen)|systemdiagnose\s+(?:starten|ändern|aendern))\b/i;

const clean = value => typeof value === 'string'
  ? value.normalize('NFKC').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 1200)
  : '';

export function isMessinhoAdminOnlyCommand(value) {
  const message = clean(value);
  if (!message) return false;
  return TARGET_ACTION.test(message) || ACTION_TARGET.test(message) || PROTECTED_TOPIC.test(message);
}
