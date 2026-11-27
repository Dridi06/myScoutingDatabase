/**
 * Central guard for commands that alter MESSINHO, its operating state, or
 * platform-wide configuration. Ordinary scouting requests remain available.
 * This complements (never replaces) Admin-only API authorization.
 */
const TARGET = "(?:messinho|myki|my\\s*ki|ki|system|plattform|agent|wissensbasis|wissensnetz|wissen|modell|lernmodell|programmiersandbox|autonomie|entwicklung|betriebsmodus|systemkonfiguration|systemregeln|kernregeln|modellgewichte|modellversion|wissensfreigabe|rollen\\s+und\\s+rechte|berechtigungen|admin.?einstellungen|agentensteuerung)";
const ACTION = "(?:stoppe|pausiere|starte|aktiviere|deaktiviere|konfiguriere|konfigurier|ändere|aendere|verändere|veraendere|setze|schalte|entwickle|trainiere|lerne|importiere|einspiele|integriere|installiere|deinstalliere|lösche|loesche|gib(?:\\s+\\w+){0,5}\\s+frei|freigeben|übernimm|uebernimm)";
const targetFirst = new RegExp('\\b' + TARGET + '\\b.{0,70}\\b' + ACTION + '\\b', 'i');
const actionFirst = new RegExp('\\b' + ACTION + '\\b.{0,70}\\b' + TARGET + '\\b', 'i');

const clean = value => typeof value === 'string'
  ? value.normalize('NFKC').toLocaleLowerCase('de-DE').replace(/[ä]/g, 'ae').replace(/[ö]/g, 'oe').replace(/[ü]/g, 'ue').replace(/ß/g, 'ss').replace(/[\x00-\x1f\x7f]/g, ' ').trim().slice(0, 1200)
  : '';

export function isMessinhoAdminOnlyCommand(value) {
  const message = clean(value);
  if (!message) return false;
  return targetFirst.test(message) || actionFirst.test(message);
}
