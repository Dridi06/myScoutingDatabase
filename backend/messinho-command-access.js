/**
 * Central guard for commands that alter MESSINHO, its operating state, or
 * platform-wide configuration. Ordinary scouting requests remain available.
 * This complements (never replaces) Admin-only API authorization.
 */
const TARGET = String.raw\`(?:messinho|myki|my\\s*ki|ki|system|plattform|agent|wissensbasis|wissensnetz|wissen|modell|lernmodell|programmiersandbox|autonomie|entwicklung|betriebsmodus|systemkonfiguration|systemregeln|kernregeln|modellgewichte|modellversion|wissensfreigabe|rollen\\s+und\\s+rechte|berechtigungen|admin.?einstellungen|agentensteuerung)\`;
const ACTION = String.raw\`(?:stoppe|pausiere|starte|aktiviere|deaktiviere|konfiguriere|konfigurier|ändere|aendere|verändere|veraendere|setze|schalte|entwickle|trainiere|lerne|importiere|einspiele|integriere|installiere|deinstalliere|lösche|loesche|gib(?:\\s+\\w+){0,5}\\s+frei|freigeben|übernimm|uebernimm)\`;
const TARGET_ACTION = new RegExp(String.raw\`\\b\${TARGET}\\b.{0,70}\\b\${ACTION}\\b\`, 'i');
const ACTION_TARGET = new RegExp(String.raw\`\\b\${ACTION}\\b.{0,70}\\b\${TARGET}\\b\`, 'i');

const clean = value => typeof value === 'string'
  ? value.normalize('NFKC').replace(/[\\u0000-\\u001f\\u007f]/g, ' ').trim().slice(0, 1200)
  : '';

export function isMessinhoAdminOnlyCommand(value) {
  const message = clean(value);
  if (!message) return false;
  return TARGET_ACTION.test(message) || ACTION_TARGET.test(message);
}
