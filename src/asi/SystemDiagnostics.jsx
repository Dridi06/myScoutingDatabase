import React,{useCallback,useEffect,useState} from 'react';
import {Activity,AlertTriangle,CheckCircle2,Clock3,RefreshCw,ShieldCheck,ChevronDown,ChevronUp,Download} from 'lucide-react';
import './systemDiagnostics.css';
import {supabase} from '../supabaseClient';

const dateTime=value=>value?new Date(value).toLocaleString('de-DE',{dateStyle:'medium',timeStyle:'medium',timeZone:'Europe/Berlin'}):'—';
const labelStatus=status=>status==='healthy'?'Betriebsbereit':status==='warning'?'Hinweise vorhanden':'Kritischer Fehler';
const statusClass=status=>status==='healthy'?'healthy':status==='warning'?'warning':'critical';
// Successful and informational/optional checks are intentionally hidden in the default report view.
const visibleIssues=checks=>(Array.isArray(checks)?checks:[]).filter(check=>!check.ok&&check.severity!=='info');
const guidanceFor=check=>({
 root:check.root_cause||check.detail||'Ursache noch nicht eindeutig bestimmt.',
 impact:check.impact||'Die betroffene Teilfunktion kann eingeschränkt sein. Andere Module sind nicht automatisch betroffen.',
 action:check.next_action||check.recommendation||'Komponente prüfen und nach der Korrektur erneut diagnostizieren.',
 repair:check.repair_class==='admin_approval'?'Admin-Freigabe erforderlich':check.repair_class==='manual'?'Manuelle Prüfung erforderlich':'Sichere automatische Reparatur derzeit nicht verfügbar.'
});
function FindingLocations({check}){
 const findings=Array.isArray(check?.findings)?check.findings:[];
 if(!findings.length)return null;
 return <div className="sd-finding-locations"><strong>Konkrete Fundstellen · {findings.length}</strong>{findings.map((item,index)=><div key={item.finding_id||index}><span>{item.file||'Datei unbekannt'}{item.line?':'+item.line:''}{item.column?':'+item.column:''}</span><code>{item.dependency||item.title||'Fehlerstelle'}</code><small>{item.status==='unverified'?'Statischer Hinweis – noch nicht zur Laufzeit bestätigt':'Befundstatus: '+(item.status||'offen')}</small></div>)}</div>;
}
function DependencyGraphSummary({check}){
 const graph=check?.dependency_graph;
 if(!graph?.metrics)return null;
 const edges=Array.isArray(graph.edges)?graph.edges:[];
 const cycles=Array.isArray(graph.cycles)?graph.cycles:[];
 return <div className="sd-dependency-graph"><strong>Modulgraph · Parser {graph.parser||'unbekannt'}</strong>
  <div className="sd-dependency-metrics"><span>{graph.metrics.nodes??0} Module</span><span>{graph.metrics.edges??0} interne Verbindungen</span><span>{graph.metrics.external_dependencies??0} externe Pakete</span><span>{graph.metrics.cycles??0} Zyklen</span></div>
  {cycles.length>0&&<div className="sd-dependency-cycles">{cycles.slice(0,5).map((cycle,index)=><code key={index}>{Array.isArray(cycle)?cycle.join(' → '):cycle}</code>)}</div>}
  {edges.length>0&&<details><summary>Abhängigkeiten anzeigen ({edges.length})</summary><div className="sd-dependency-edges">{edges.slice(0,16).map((edge,index)=><code key={index}>{edge.from} → {edge.to}{edge.line?':'+edge.line:''}</code>)}{edges.length>16&&<small>Weitere {edges.length-16} Verbindungen sind im vollständigen JSON-Bericht enthalten.</small>}</div></details>}
  {Array.isArray(graph.limitations)&&<small>Begrenzung: {graph.limitations[0]}</small>}
 </div>;
}

export default function SystemDiagnostics({session}){
 const [runs,setRuns]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[expanded,setExpanded]=useState(null),[historyPage,setHistoryPage]=useState(1);
 const [messinhoRuns,setMessinhoRuns]=useState([]),[messinhoBusy,setMessinhoBusy]=useState(false),[messinhoError,setMessinhoError]=useState(''),[messinhoExpanded,setMessinhoExpanded]=useState(null),[messinhoHistoryPage,setMessinhoHistoryPage]=useState(1),[probeLlm,setProbeLlm]=useState(false);
 async function getAccessToken(forceRefresh=false){
  if(!supabase)throw new Error('Anmeldedienst ist nicht verfügbar.');
  let {data:{session:authSession},error}=await supabase.auth.getSession();
  if(error)throw error;
  const expiresSoon=authSession?.expires_at&&authSession.expires_at*1000<Date.now()+60000;
  if(forceRefresh||!authSession?.access_token||expiresSoon){
   const refreshed=await supabase.auth.refreshSession();
   if(refreshed.error||!refreshed.data?.session?.access_token)throw new Error('Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.');
   authSession=refreshed.data.session;
  }
  if(!authSession?.access_token)throw new Error('Keine gültige Admin-Sitzung gefunden. Bitte erneut anmelden.');
  return authSession.access_token;
 }
 async function apiRequest(path,options={}){
  let token=await getAccessToken(false);
  const send=currentToken=>fetch(path,{...options,cache:'no-store',headers:{...(options.headers||{}),Authorization:'Bearer '+currentToken}});
  let response=await send(token);
  if(response.status===401){
   token=await getAccessToken(true);
   response=await send(token);
  }
  return response;
 }
 const load=useCallback(async()=>{
  if(!session?.user?.id)return;
  setError('');
  try{
   const r=await apiRequest('/api/admin/system-diagnostics?limit=50');
   const j=await r.json().catch(()=>({}));
   if(!r.ok)throw Error(j.error||'Diagnosehistorie konnte nicht geladen werden.');
   setRuns(Array.isArray(j)?j:[]);setHistoryPage(1);
  }catch(e){setError(e.message||'Diagnosehistorie konnte nicht geladen werden.');}
 },[session?.user?.id]);
 useEffect(()=>{load();},[load]);

 const loadMessinho=useCallback(async()=>{
  if(!session?.user?.id)return;
  setMessinhoError('');
  try{
   const r=await apiRequest('/api/admin/messinho-diagnostics?limit=50');
   const j=await r.json().catch(()=>({}));
   if(!r.ok)throw Error(j.error||'MESSINHO-Diagnosehistorie konnte nicht geladen werden.');
   setMessinhoRuns(Array.isArray(j)?j:[]);setMessinhoHistoryPage(1);
  }catch(e){setMessinhoError(e.message||'MESSINHO-Diagnosehistorie konnte nicht geladen werden.');}
 },[session?.user?.id]);
 useEffect(()=>{loadMessinho();},[loadMessinho]);
 async function runMessinho(){
  if(messinhoBusy)return;
  setMessinhoBusy(true);setMessinhoError('');
  try{
   const r=await apiRequest('/api/admin/messinho-diagnostics/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({probe_llm:probeLlm})});
   const j=await r.json().catch(()=>({}));
   if(!r.ok)throw Error(j.error||j.detail||'MESSINHO-Diagnose konnte nicht ausgeführt werden.');
   setMessinhoRuns(old=>[j,...old.filter(item=>item.id!==j.id)].slice(0,50));
   setMessinhoHistoryPage(1);setMessinhoExpanded(j.id);
  }catch(e){setMessinhoError(e.message||'MESSINHO-Diagnose konnte nicht ausgeführt werden.');}
  finally{setMessinhoBusy(false);}
 }

 async function run(){
  if(busy)return;
  setBusy(true);setError('');
  try{
   const r=await apiRequest('/api/admin/system-diagnostics/run',{method:'POST',headers:{'Content-Type':'application/json'}});
   const j=await r.json().catch(()=>({}));
   if(!r.ok)throw Error(j.error||j.detail||'Diagnose konnte nicht ausgeführt werden.');
   setRuns(old=>[j,...old.filter(x=>x.id!==j.id)]);
   setExpanded(j.id);
  }catch(e){setError(e.message||'Diagnose konnte nicht ausgeführt werden.');}
  finally{setBusy(false);}
 }
 function exportRun(run){const blob=new Blob([JSON.stringify(run,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='systemdiagnose-'+(run.id||'bericht')+'.json';a.click();URL.revokeObjectURL(url);}
 const latest=runs[0],latestChecks=latest?.checks||[],latestIssues=visibleIssues(latestChecks);
 const totalChecks=latest?.summary?.total??latestChecks.length,passed=latest?.summary?.passed??latestChecks.filter(x=>x.ok).length,failed=latest?.summary?.failed??latestChecks.filter(x=>!x.ok).length;
 const historyPageSize=5,historyPageCount=Math.max(1,Math.ceil(runs.length/historyPageSize)),visibleRuns=runs.slice((historyPage-1)*historyPageSize,historyPage*historyPageSize);
 return <section className="system-diagnostics">
  <div className="sd-hero"><div className="sd-hero-icon"><Activity size={25}/></div><div><span className="sd-eyebrow">ADMINISTRATOR · SYSTEMÜBERWACHUNG</span><h1>Systemdiagnose-Center</h1><p>Technische Prüfungen, Fehlerberichte und dauerhaft gespeicherte Testhistorie für myScoutingDatabase.</p></div><button type="button" onClick={run} disabled={busy}>{busy?<RefreshCw className="sd-spin" size={16}/>:<ShieldCheck size={16}/>} {busy?'Diagnose läuft…':'Diagnose jetzt starten'}</button></div>
  {error&&<div className="sd-error"><AlertTriangle size={18}/><div><strong>Diagnose nicht vollständig verfügbar</strong><p>{error}</p><small>Bei HTTP 401 bitte erneut anmelden. Ein Hinweis auf Migration 018 erscheint nur, wenn der Server tatsächlich einen Datenbankfehler meldet.</small></div></div>}
  <div className="sd-stats">
   <article><span>Letzter Systemstatus</span><strong className={latest?statusClass(latest.status):''}>{latest?labelStatus(latest.status):'Noch nicht geprüft'}</strong><small>{latest?dateTime(latest.finished_at):'Noch kein gespeicherter Lauf'}</small></article>
   <article><span>Prüfungen im letzten Lauf</span><strong>{totalChecks}</strong><small>{passed} bestanden · {failed} Auffälligkeiten</small></article>
   <article><span>Ausführungsdauer</span><strong>{latest?((latest.duration_ms||0)/1000).toFixed(2)+' s':'—'}</strong><small>{latest?.triggered_by==='automatic'?'Automatisch':latest?.triggered_by==='deployment'?'Nach Deployment':latest?'Manuell durch Admin':'Keine Ausführung'}</small></article>
  </div>
  <div className="sd-section-head"><div><span className="sd-eyebrow">LETZTER PRÜFLAUF</span><h2>Probleme und Fehler</h2></div><button type="button" className="sd-quiet" onClick={load}><RefreshCw size={15}/> Aktualisieren</button></div>
  {!latest?<div className="sd-empty">Noch keine Diagnose vorhanden. Starte eine Prüfung, um den Systemzustand zu erfassen.</div>:latestIssues.length===0?<div className="sd-empty"><CheckCircle2 size={18}/> Keine Probleme oder Fehler gefunden. Alle {totalChecks} Prüfungen sind ohne Auffälligkeiten abgeschlossen.</div>:<div className="sd-run-card">
   <div className="sd-run-head"><div><strong>{latestIssues.length} Auffälligkeit{latestIssues.length===1?'':'en'} gefunden</strong><small>{dateTime(latest.started_at)} · {latest.triggered_by==='automatic'?'Automatischer Systemcheck':latest.triggered_by==='deployment'?'Deployment-Prüfung':'Manuell durch Administrator'}</small></div><button type="button" className="sd-quiet" onClick={()=>exportRun(latest)}><Download size={15}/> Bericht</button></div>
   {latestIssues.map((check,i)=><article className="sd-check" key={i}><div className={'sd-check-icon '+(check.severity==='info'?'info':'fail')}><AlertTriangle size={17}/></div><div className="sd-check-main"><strong>{check.name}</strong><small>{check.category} · {dateTime(check.checkedAt)}</small><p>{check.detail}</p><FindingLocations check={check}/><DependencyGraphSummary check={check}/><div className="sd-diagnosis-grid"><div><strong>Wahrscheinliche Ursache</strong><span>{guidanceFor(check).root}</span></div><div><strong>Auswirkung</strong><span>{guidanceFor(check).impact}</span></div><div><strong>Nächster Schritt</strong><span>{guidanceFor(check).action}</span></div><div><strong>Reparaturweg</strong><span>{guidanceFor(check).repair}</span></div></div></div><span className="sd-check-state fail">{String(check.severity||'error').toUpperCase()==='WARNING'?'WARNUNG':String(check.severity||'error').toUpperCase()==='MEDIUM'?'HINWEIS':'FEHLER'}</span></article>)}
  </div>}
  <div className="sd-section-head"><div><span className="sd-eyebrow">AUDITIERBARE HISTORIE</span><h2>Frühere Diagnoseberichte</h2><p>Je Seite werden fünf Diagnoseberichte angezeigt. Ältere Berichte findest du über die Seitennavigation.</p></div></div>
  <div className="sd-history">{runs.length===0?<div className="sd-empty">Keine gespeicherten Testläufe.</div> :visibleRuns.map(run=><article className="sd-history-item" key={run.id}><button type="button" className="sd-history-toggle" onClick={()=>setExpanded(expanded===run.id?null:run.id)}><span className={'sd-status-dot '+statusClass(run.status)}/><span className="sd-history-copy"><strong>{labelStatus(run.status)}</strong><small>{dateTime(run.finished_at)} · {run.triggered_by==='automatic'?'Automatisch':run.triggered_by==='deployment'?'Deployment':'Admin'} · {run.summary?.passed??0}/{run.summary?.total??0} bestanden · {visibleIssues(run.checks).length} Auffälligkeiten</small></span>{expanded===run.id?<ChevronUp size={17}/>:<ChevronDown size={17}/>}</button>{expanded===run.id&&<div className="sd-history-detail"><button type="button" className="sd-quiet" onClick={()=>exportRun(run)}><Download size={14}/> Vollständigen JSON-Bericht exportieren</button>{visibleIssues(run.checks).length===0?<div className="sd-empty"><CheckCircle2 size={16}/> Keine Probleme oder Fehler in diesem Prüflauf.</div>:visibleIssues(run.checks).map((check,i)=><div className="sd-history-check" key={i}><strong>{check.name}</strong><span>{String(check.severity||'error').toUpperCase()==='WARNING'?'WARNUNG':'FEHLER'}</span><p>{check.detail}</p><FindingLocations check={check}/><DependencyGraphSummary check={check}/><div className="sd-diagnosis-grid"><div><strong>Wahrscheinliche Ursache</strong><span>{guidanceFor(check).root}</span></div><div><strong>Auswirkung</strong><span>{guidanceFor(check).impact}</span></div><div><strong>Nächster Schritt</strong><span>{guidanceFor(check).action}</span></div><div><strong>Reparaturweg</strong><span>{guidanceFor(check).repair}</span></div></div></div>)}</div>}</article>)}</div>
  {runs.length>historyPageSize&&<nav className="sd-pagination" aria-label="Diagnoseberichte-Seiten"><span>Seite {historyPage} von {historyPageCount} · {runs.length} Berichte</span><div><button type="button" className="sd-quiet" disabled={historyPage===1} onClick={()=>{setHistoryPage(p=>Math.max(1,p-1));setExpanded(null);}}>Zurück</button><button type="button" className="sd-quiet" disabled={historyPage===historyPageCount} onClick={()=>{setHistoryPage(p=>Math.min(historyPageCount,p+1));setExpanded(null);}}>Weiter</button></div></nav>}

  <div className="sd-messinho-panel">
   <div className="sd-section-head sd-messinho-head"><div><span className="sd-eyebrow">MESSINHO · UNABHÄNGIGE KI-QUALITÄTSSICHERUNG</span><h2>MESSINHO Diagnoseebene</h2><p>Full-Stack-Prüfung von Code, Tools, LLM-/Sprachbindung, Sandbox, Reasoning und Lernverlauf. Standardlauf bleibt vollständig read-only.</p><label className="sd-llm-probe"><input type="checkbox" checked={probeLlm} onChange={event=>setProbeLlm(event.target.checked)}/> Zusätzlich eine echte, begrenzte LLM-Verbindungs- und JSON-Probe ausführen (externer API-Aufruf, maximal 64 Ausgabetoken).</label></div><button type="button" onClick={runMessinho} disabled={messinhoBusy}>{messinhoBusy?<RefreshCw className="sd-spin" size={15}/>:<ShieldCheck size={15}/>} {messinhoBusy?'MESSINHO wird geprüft…':'MESSINHO prüfen'}</button></div>
   {messinhoError&&<div className="sd-error"><AlertTriangle size={18}/><div><strong>MESSINHO-Diagnose nicht vollständig verfügbar</strong><p>{messinhoError}</p></div></div>}
   {messinhoRuns[0]&&<div className="sd-stats sd-messinho-stats"><article><span>Letzter MESSINHO-Status</span><strong className={statusClass(messinhoRuns[0].status)}>{labelStatus(messinhoRuns[0].status)}</strong><small>{dateTime(messinhoRuns[0].finished_at)}</small></article><article><span>Prüfungen im letzten Lauf</span><strong>{messinhoRuns[0].summary?.total??messinhoRuns[0].checks?.length??0}</strong><small>{messinhoRuns[0].summary?.passed??0} bestanden · {messinhoRuns[0].summary?.failed??0} Auffälligkeiten</small></article><article><span>Ausführungsdauer</span><strong>{(()=>{const r=messinhoRuns[0];const ms=Number.isFinite(Number(r.duration_ms))?Number(r.duration_ms):(r.started_at&&r.finished_at?Math.max(0,new Date(r.finished_at)-new Date(r.started_at)):null);return ms===null?'—':(ms/1000).toFixed(2)+' s';})()}</strong><small>Manuell durch Admin</small></article></div>}
   <div className="sd-section-head"><div><span className="sd-eyebrow">LETZTER MESSINHO-PRÜFLAUF</span><h2>Modell- und Lernqualität</h2></div><button type="button" className="sd-quiet" onClick={loadMessinho}><RefreshCw size={14}/> Aktualisieren</button></div>
   {!messinhoRuns.length?<div className="sd-empty">Noch keine MESSINHO-Diagnose gespeichert. Starte eine eigene Prüfung.</div>:(()=>{const latest=messinhoRuns[0],issues=visibleIssues(latest.checks);return issues.length===0?<div className="sd-empty"><CheckCircle2 size={18}/> Keine kritischen Auffälligkeiten in {latest.summary?.total??latest.checks?.length??0} MESSINHO-Prüfungen.</div>:<div className="sd-run-card"><div className="sd-run-head"><div><strong>{issues.length} Auffälligkeit{issues.length===1?'':'en'} gefunden</strong><small>{dateTime(latest.started_at)} · Eigenständiger MESSINHO-Prüflauf</small></div><button type="button" className="sd-quiet" onClick={()=>exportRun(latest)}><Download size={14}/> Bericht</button></div>{issues.map((check,i)=><article className="sd-check" key={i}><div className="sd-check-icon fail"><AlertTriangle size={17}/></div><div className="sd-check-main"><strong>{check.name}</strong><small>{check.category} · {dateTime(check.checkedAt)}</small><p>{check.detail}</p><FindingLocations check={check}/><DependencyGraphSummary check={check}/><div className="sd-diagnosis-grid"><div><strong>Auswirkung</strong><span>{guidanceFor(check).impact}</span></div><div><strong>Nächster Schritt</strong><span>{guidanceFor(check).action}</span></div></div></div><span className="sd-check-state fail">{String(check.severity||'error').toUpperCase()==='WARNING'?'WARNUNG':'FEHLER'}</span></article>)}</div>;})()}
   <div id="messinho-report-history" className="sd-messinho-history-section"><div className="sd-section-head"><div><span className="sd-eyebrow">SEPARATE AUDIT-HISTORIE</span><h2>MESSINHO-Berichte</h2><p>Maximal 50 gespeicherte Berichte · fünf pro Seite · ältester Bericht wird automatisch entfernt</p></div><button type="button" className="sd-quiet" onClick={loadMessinho}><RefreshCw size={14}/> Aktualisieren</button></div>
   <div className="sd-history">{messinhoRuns.length===0?<div className="sd-empty">Keine MESSINHO-Berichte vorhanden.</div>:messinhoRuns.slice((messinhoHistoryPage-1)*5,messinhoHistoryPage*5).map(run=><article className="sd-history-item" key={run.id}><button type="button" className="sd-history-toggle" onClick={()=>setMessinhoExpanded(messinhoExpanded===run.id?null:run.id)}><span className={'sd-status-dot '+statusClass(run.status)}/><span className="sd-history-copy"><strong>{labelStatus(run.status)} · MESSINHO</strong><small>{dateTime(run.finished_at)} · {run.summary?.passed??0}/{run.summary?.total??0} bestanden · {visibleIssues(run.checks).length} Auffälligkeiten</small></span>{messinhoExpanded===run.id?<ChevronUp size={17}/>:<ChevronDown size={17}/>}</button>{messinhoExpanded===run.id&&<div className="sd-history-detail"><button type="button" className="sd-quiet" onClick={()=>exportRun(run)}><Download size={14}/> Vollständigen JSON-Bericht exportieren</button>{(run.checks||[]).map((check,i)=><div className="sd-history-check" key={i}><strong>{check.name}</strong><span className={check.ok?'sd-ok-text':'sd-fail-text'}>{check.ok?'OK':String(check.severity||'error').toUpperCase()}</span><p>{check.detail}</p><FindingLocations check={check}/><DependencyGraphSummary check={check}/></div>)}</div>}</article>)}</div>
   {messinhoRuns.length>5&&<nav className="sd-pagination" aria-label="MESSINHO-Berichte-Seiten"><span>Seite {messinhoHistoryPage} von {Math.ceil(messinhoRuns.length/5)} · {messinhoRuns.length} Berichte</span><div><button type="button" className="sd-quiet" disabled={messinhoHistoryPage===1} onClick={()=>{setMessinhoHistoryPage(p=>Math.max(1,p-1));setMessinhoExpanded(null);}}>Zurück</button><button type="button" className="sd-quiet" disabled={messinhoHistoryPage===Math.ceil(messinhoRuns.length/5)} onClick={()=>{setMessinhoHistoryPage(p=>Math.min(Math.ceil(messinhoRuns.length/5),p+1));setMessinhoExpanded(null);}}>Weiter</button></div></nav>}
   </div>
  </div>
 </section>;
}
