const PILLARS = Object.freeze([
  { id:'agent_core', label:'Agentenkern', points:8, maximum:10, status:'teilweise_nachgewiesen', evidence:'Agent-Core, Zielplanung, Capability-Orchestrierung und Ergebnisvalidierung sind vorhanden.', next:'Mehrstufige Aufgaben Ende-zu-Ende mit echten Rollen und Daten testen.' },
  { id:'autonomy', label:'Autonomie', points:5, maximum:10, status:'begrenzt', evidence:'MESSINHO plant und führt freigegebene Analysen aus; geschützte Aktionen bleiben gesperrt.', next:'Kontrollierte Hintergrundfortsetzung, Fehlerwiederaufnahme und Admin-Gates vollständig beweisen.' },
  { id:'scouting', label:'Scouting-Intelligenz', points:7, maximum:15, status:'teilweise_nachgewiesen', evidence:'100 Capability-IDs und Runtime-Handler; nicht jede Funktion besitzt bereits spezialisierte Datenlogik.', next:'Reale historische Spieler- und Mannschaftsdaten mit Herkunft und Vollständigkeit prüfen.' },
  { id:'research', label:'Recherche & Markt', points:5, maximum:10, status:'teilweise_nachgewiesen', evidence:'Quellenbasierte Spieler- und Marktwertrecherche mit Vergleichs- und Quellenfiltern.', next:'Quellenabdeckung, Aktualität, Rechte und Recherchequalität breiter validieren.' },
  { id:'forecasting', label:'Prognosen', points:6, maximum:20, status:'algorithmen_getestet_live_daten_offen', evidence:'12-Monats-Trendprojektion, historische Transfer-Kohortenrate, Erfolgs-Kohortenrate und Marktwert-Trend sind implementiert; die Forecast-Tests bestehen. Reale, verifizierte Staging-Historien fehlen noch und die Raten sind nicht kalibriert.', next:'Reale, verifizierte Spieler-, Vertrags-, Transfer- und Marktwertverläufe einspeisen; Prognosen über Zeit gegen tatsächliche Ergebnisse kalibrieren.' },
  { id:'knowledge', label:'Wissen & Lernen', points:5, maximum:10, status:'teilweise_nachgewiesen', evidence:'Versioniertes Wissen, Quellen-/Rechteprüfung und freigabepflichtige Lernspeicherung sind vorhanden.', next:'Fachwissen systematisch importieren, verifizieren, versionieren und abrufbar machen.' },
  { id:'engineering', label:'Eigenständige Entwicklung', points:3, maximum:15, status:'nicht_freigeschaltet', evidence:'Vorschlags- und Sandbox-Bausteine existieren; die automatische Ausführung ist noch nicht erfolgreich Ende-zu-Ende bewiesen.', next:'Sandbox-Baseline reparieren, echte isolierte Job-Ausführung und Ergebnisrückgabe verifizieren.' },
  { id:'security', label:'Sicherheit & Kontrolle', points:3, maximum:5, status:'teilweise_nachgewiesen', evidence:'Rollenprüfung, Allowlist, getrennte Freigaben und serverseitige Sicherheitsgrenzen sind angelegt.', next:'Adversariale Rollen-, Mandanten-, Prompt-Injection- und Sandbox-Tests vollständig bestehen.' },
  { id:'operations', label:'Tests & Betrieb', points:4, maximum:5, status:'teilweise_nachgewiesen', evidence:'383 Node-Tests, Backend-Syntaxprüfung, Staging-CI und Health-Smoke-Test waren auf dem dokumentierten Commit erfolgreich; Sandbox-Workflow war dort fehlgeschlagen.', next:'Neuen Forecast- und Sandbox-Stand vollständig testen und exakt auf STAGING verifizieren.' }
]);

const LEVELS = Object.freeze([
  { min:0, max:19, label:'Anfänger-Agent' },
  { min:20, max:39, label:'Verbesserter Agent' },
  { min:40, max:59, label:'Erweiterter Agent' },
  { min:60, max:79, label:'Super Agent' },
  { min:80, max:99, label:'High-Level Premium Agent – im Ausbau' },
  { min:100, max:100, label:'High-Level Premium Agent' }
]);

export function buildMessinhoMaturityReport() {
  const score=PILLARS.reduce((sum,p)=>sum+p.points,0);
  const maximum=PILLARS.reduce((sum,p)=>sum+p.maximum,0);
  const level=LEVELS.find(item=>score>=item.min&&score<=item.max)||LEVELS[0];
  return {
    score, maximum, percentage:Math.round(score/maximum*100), level:level.label,
    scale:LEVELS.map(({min,max,label})=>({min,max,label})),
    pillars:PILLARS.map(item=>({...item})),
    verified_snapshot:'2026-11-27',
    basis_commit:'659b9c0ca62eb677f2fb80ac7a094869b52ddc9e',
    score_policy:'Punkte werden nur nach überprüfbarer Implementierung, bestandenen Tests und – wo erforderlich – erfolgreicher Staging-Verifikation erhöht. Vorhandene Funktionsnamen oder Katalogeinträge allein reichen nicht.',
    release_gate:'100 Punkte und LIVE-Freigabe erst nach bestandenen Prognose-, Autonomie-, Sicherheits-, Sandbox-, Rollen- und Betriebsprüfungen.',
    next_milestones:[
      'Neue Spielerentwicklungs-, Transfer- und Marktwertprognosen testen und kalibrieren.',
      'Isolierte Sandbox-Baseline und Kandidatenlauf erfolgreich abschließen.',
      'Autonome Arbeitszyklen mit dauerhaftem Laufprotokoll und Admin-Freigaben Ende-zu-Ende prüfen.',
      'Sicherheits- und Mandantentrennung adversarial testen.',
      'Staging-Abnahme und anschließend separat freigegebene Produktionsfreigabe.'
    ]
  };
}
