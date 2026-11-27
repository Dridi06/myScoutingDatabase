const PILLARS = Object.freeze([
  { id:'agent_core', label:'Agentenkern', points:8, maximum:10, status:'teilweise_nachgewiesen', evidence:'Agent-Core, Zielplanung, Capability-Orchestrierung und Ergebnisvalidierung sind vorhanden.', next:'Mehrstufige Aufgaben Ende-zu-Ende mit echten Rollen und Daten testen.' },
  { id:'autonomy', label:'Autonomie', points:5, maximum:10, status:'begrenzt', evidence:'Admin-Steuerung mit Pause/Arbeiten/Weiterentwickeln/Stop, Statusabfrage und kooperativen Haltepunkten ist implementiert; automatischer Sandbox-Dispatch ist unit-getestet. Der reale Staging-Ende-zu-Ende-Betrieb ist noch offen.', next:'Admin-/Scout-Rollentrennung und kontrollierten Stopp auf dem laufenden STAGING-Deployment Ende-zu-Ende prüfen.' },
  { id:'scouting', label:'Scouting-Intelligenz', points:7, maximum:15, status:'teilweise_nachgewiesen', evidence:'100 Capability-IDs und Runtime-Handler; nicht jede Funktion besitzt bereits spezialisierte Datenlogik.', next:'Reale historische Spieler- und Mannschaftsdaten mit Herkunft und Vollständigkeit prüfen.' },
  { id:'research', label:'Recherche & Markt', points:5, maximum:10, status:'teilweise_nachgewiesen', evidence:'Quellenbasierte Spieler- und Marktwertrecherche mit Vergleichs- und Quellenfiltern.', next:'Quellenabdeckung, Aktualität, Rechte und Recherchequalität breiter validieren.' },
  { id:'forecasting', label:'Prognosen', points:6, maximum:20, status:'algorithmen_getestet_live_daten_offen', evidence:'12-Monats-Trendprojektion, historische Transfer-Kohortenrate, Erfolgs-Kohortenrate und Marktwert-Trend sind implementiert. Die owner-scoped Datenpipeline und Prognosepersistenz sind integriert; 422 automatisierte Tests bestehen. Reale, verifizierte Staging-Historien fehlen noch und die Raten sind nicht kalibriert.', next:'Reale, verifizierte Spieler-, Vertrags-, Transfer- und Marktwertverläufe einspeisen; Prognosen über Zeit gegen tatsächliche Ergebnisse kalibrieren.' },
  { id:'knowledge', label:'Wissen & Lernen', points:5, maximum:10, status:'teilweise_nachgewiesen', evidence:'Versioniertes Wissen, Quellen-/Rechteprüfung und freigabepflichtige Lernspeicherung sind vorhanden.', next:'Fachwissen systematisch importieren, verifizieren, versionieren und abrufbar machen.' },
  { id:'engineering', label:'Eigenständige Entwicklung', points:3, maximum:15, status:'nicht_freigeschaltet', evidence:'Vorschlags- und Sandbox-Bausteine sowie der automatische Dispatch-Pfad sind implementiert und unit-getestet; ein echter Kandidatenlauf mit Rückmeldung an STAGING ist noch nicht erfolgreich Ende-zu-Ende bewiesen.', next:'Sandbox-Baseline reparieren, echte isolierte Job-Ausführung und Ergebnisrückgabe verifizieren.' },
  { id:'security', label:'Sicherheit & Kontrolle', points:3, maximum:5, status:'teilweise_nachgewiesen', evidence:'Rollenprüfung, Allowlist, getrennte Freigaben und serverseitige Sicherheitsgrenzen sind angelegt.', next:'Adversariale Rollen-, Mandanten-, Prompt-Injection- und Sandbox-Tests vollständig bestehen.' },
  { id:'operations', label:'Tests & Betrieb', points:4, maximum:5, status:'teilweise_nachgewiesen', evidence:'396 Node-Tests und Backend-Syntaxprüfung bestanden auf Commit 85b5d384; der isolierte Sandbox-Workflow war im vorherigen Lauf wegen eines Berechtigungsfehlers bei vite nicht eindeutig. Die Korrektur ist committed, ein neuer Sandbox-Ende-zu-Ende-Lauf steht aus.', next:'Neue Sandbox-Ausführung erneut starten und Laufzeitverhalten auf exakt demselben STAGING-Commit verifizieren.' }
]);

const LEVELS = Object.freeze([
  { min:0, max:19, label:'Anfänger-Agent' },
  { min:20, max:39, label:'Verbesserter Agent' },
  { min:40, max:59, label:'Erweiterter Agent' },
  { min:60, max:99, label:'Super Agent' },
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
    basis_commit:'a1e272da3a32a2cea63cf661b7af1624d9b161d6',
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
