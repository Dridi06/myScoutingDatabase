import React,{useCallback,useEffect,useMemo,useState} from 'react';
import {Activity,Clock3,ShieldCheck,Code2,RefreshCw,CalendarClock,BrainCircuit,AlertTriangle,CheckCircle2,PauseCircle,ArrowRight} from 'lucide-react';

const MODE_LABELS={paused:'Pausiert',working:'Wartet auf Admin-Auftrag',developing:'Autonome Entwicklung freigegeben'};
const RUN_LABELS={paused:'Keine autonome Entwicklung',working:'Wartet auf einen Auftrag',developing:'Entwicklungsmodus freigegeben',running:'Aktiver Arbeitsschritt'};
const SANDBOX_LABELS={disabled:'Nicht freigegeben',credential_missing:'Zugangsdaten fehlen',configured_not_yet_end_to_end_verified:'Konfiguriert – Praxistest offen'};
const formatDate=value=>value?new Date(value).toLocaleString('de-DE',{dateStyle:'medium',timeStyle:'short'}):'Noch kein Zeitstempel';
const explainRun=run=>({running:'Ein gespeicherter Arbeitsschritt ist aktuell als laufend markiert.',paused:'Die autonome Entwicklung ist pausiert. Der Chat kann davon unabhängig erreichbar bleiben.',working:'MESSINHO wartet auf einen konkreten Auftrag des Administrators.',developing:'Der Entwicklungsmodus ist freigegeben. Ob gerade tatsächlich ein Prüflauf läuft, zeigen die gespeicherten Laufdaten.'}[run]||'Der Betriebszustand konnte nicht eindeutig zugeordnet werden.');

function buildPlan(status){
 const plan=[];
 const mode=status?.autonomy_mode||'paused';
 const sandbox=status?.sandbox?.state||'disabled';
 const last=status?.last_run;
 if(mode!=='developing'){
  plan.push({title:'Entwicklungsfreigabe abwarten',why:'Der aktuelle Betriebsmodus erlaubt keine autonome Entwicklungsprüfung. Damit werden Änderungen nicht ohne die vorgesehene Admin-Freigabe gestartet.',state:'blocked'});
 }else if(!status?.scheduler_enabled){
  plan.push({title:'Voraussetzungen für den automatischen Prüflauf prüfen',why:'Der Entwicklungsmodus allein startet keine sichere Programmierarbeit. Zeitfenster, STAGING-Bindung und technische Freigaben müssen ebenfalls erfüllt sein.',state:'pending'});
 }else{
  plan.push({title:'Nächste autonome Entwicklungsprüfung',why:'Innerhalb des freigegebenen Zeitfensters wird nach einer konkreten, messbar nützlichen Verbesserung gesucht. Ohne belegbaren Nutzen soll kein Ticket entstehen.',state:'scheduled'});
 }
 if(sandbox==='disabled'){
  plan.push({title:'Isolierte Programmierumgebung freigeben',why:'Ohne ausdrücklich aktivierte STAGING-Sandbox darf MESSINHO keine Kandidatenänderung ausführen.',state:'blocked'});
 }else if(sandbox==='credential_missing'){
  plan.push({title:'STAGING-Sandbox-Zugang konfigurieren',why:'Der notwendige GitHub-Zugang fehlt. Ohne ihn kann kein isolierter Kandidatentest gestartet werden.',state:'pending'});
 }else{
  plan.push({title:'Echten Sandbox-Test samt Rückmeldung nachweisen',why:'Eine Konfiguration ist noch kein erfolgreicher Compilerlauf. Erst ein protokollierter Kandidatentest mit Ergebnis-Callback liefert einen belastbaren Nachweis.',state:'pending'});
 }
 if(last?.status==='failed'){
  plan.push({title:'Letzten Prüffehler untersuchen',why:'Der letzte gespeicherte Lauf enthält einen Fehlercode. Dieser muss vor einem erneuten Versuch geklärt werden.',state:'attention'});
 }else if(last?.status==='no_improvement'){
  plan.push({title:'Weitere Verbesserung nur bei belastbarem Nutzen vorschlagen',why:'Der letzte Lauf hat keine ausreichend belegte Verbesserung gefunden. Ein leeres oder spekulatives Ticket wird bewusst vermieden.',state:'complete'});
 }else if(last?.status==='ticket_created'){
  plan.push({title:'Admin-Prüfung des Verbesserungstickets',why:'Ein Vorschlag wird zunächst verständlich erklärt und geprüft. Eine automatische Übernahme in das laufende System ist nicht vorgesehen.',state:'pending'});
 }
 return plan;
}

export default function MyKiActivityMonitor({supabase}){
 const [status,setStatus]=useState(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [updatedAt,setUpdatedAt]=useState(null);
 const [refreshing,setRefreshing]=useState(false);
 const load=useCallback(async({silent=false}={})=>{
  if(!supabase){setError('Supabase-Sitzung ist nicht verfügbar.');setLoading(false);return;}
  if(!silent)setRefreshing(true);
  try{
   const {data:{session},error:sessionError}=await supabase.auth.getSession();
   if(sessionError)throw sessionError;
   if(!session?.access_token)throw new Error('Admin-Sitzung abgelaufen. Bitte erneut anmelden.');
   const response=await fetch('/api/admin/myki/status',{cache:'no-store',headers:{Authorization:'Bearer '+session.access_token,'Cache-Control':'no-cache'}});
   const payload=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(payload.error||'Aktivitätsdaten konnten nicht geladen werden.');
   setStatus(payload);setUpdatedAt(new Date().toISOString());setError('');
  }catch(err){setError(err.message||'Aktivitätsdaten sind derzeit nicht verfügbar.');}
  finally{setLoading(false);setRefreshing(false);}
 },[supabase]);
 useEffect(()=>{load();const timer=setInterval(()=>load({silent:true}),30000);return()=>clearInterval(timer);},[load]);
 const plan=useMemo(()=>status?buildPlan(status):[],[status]);
 const mode=status?.autonomy_mode||'unknown';
 const sandboxLabel=SANDBOX_LABELS[status?.sandbox?.state]||'Status unbekannt';
 const phase=status?.schedule?.phase;
 const phaseLabel=phase==='morning'?'Entwicklungsfenster am Morgen':phase==='daytime'?'Entwicklungsfenster am Tag':phase==='break'?'Pause – keine Entwicklungsarbeit':'Nachtruhe – keine Entwicklungsarbeit';
 const currentTask=status?.current_work;
 const run=status?.run_state||mode;
 return <section className="myki-monitor" aria-labelledby="myki-monitor-title">
  <div className="myki-monitor-head">
   <div><span className="myki-eyebrow">LIVE-ÜBERSICHT · ADMIN ONLY</span><h2 id="myki-monitor-title"><Activity size={20}/> MESSINHO Aktivitätsmonitor</h2><p>Was gerade geschieht, was als Nächstes vorgesehen ist und warum dieser Schritt sinnvoll oder noch gesperrt ist.</p></div>
   <button type="button" className="secondary myki-monitor-refresh" onClick={()=>load()} disabled={refreshing}>{refreshing?<span className="myki-monitor-spinner"/>:<RefreshCw size={15}/>} Aktualisieren</button>
  </div>
  {error&&<div className="myki-monitor-error" role="alert"><AlertTriangle size={17}/><span>{error}</span></div>}
  {loading&&!status?<div className="myki-monitor-loading">Aktuelle Aktivitätsdaten werden geladen …</div>:status&&<>
   <div className={'myki-monitor-state '+(run==='running'?'is-running':mode==='developing'?'is-developing':'is-waiting')}>
    <span className="myki-monitor-state-icon">{run==='running'?<Activity/>:mode==='paused'?<PauseCircle/>:<BrainCircuit/>}</span>
    <div><small>AKTUELLER BETRIEBSZUSTAND</small><strong>{run==='running'?'Arbeitsschritt läuft':MODE_LABELS[mode]||'Status unbekannt'}</strong><p>{status.control?.status_message||explainRun(run)}</p></div>
    <span className="myki-monitor-live"><i/>{run==='running'?'Laufend':'Status aus Datenbank'}</span>
   </div>
   <div className="myki-monitor-metrics">
    <article><span><Clock3 size={16}/> Betriebsmodus</span><strong>{MODE_LABELS[mode]||'Unbekannt'}</strong><small>{status.control?.stop_requested?'Stopp angefordert':'Steuerstatus gespeichert'}</small></article>
    <article><span><CalendarClock size={16}/> Automatische Entwicklung</span><strong>{status.scheduler_enabled?'Aktiv':'Nicht aktiv'}</strong><small>{status.schedule?.due?'Zeitfenster ist geöffnet':phaseLabel}</small></article>
    <article><span><Code2 size={16}/> Programmierumgebung</span><strong>{sandboxLabel}</strong><small>{status.sandbox?.github_credential_configured?'GitHub-Zugang erkannt':'Kein bestätigter Sandbox-Zugang'}</small></article>
    <article><span><ShieldCheck size={16}/> Sicherheitsgrenze</span><strong>STAGING only</strong><small>Keine automatische Produktionsänderung</small></article>
   </div>
   <div className="myki-monitor-columns">
    <section className="myki-monitor-panel">
     <div className="myki-monitor-section-title"><h3><Activity size={16}/> Was macht MESSINHO gerade?</h3><span>IST-ZUSTAND</span></div>
     {currentTask?<><strong className="myki-monitor-task-title">{currentTask.goal||'Aufgabe ohne Titel'}</strong><p>{currentTask.status==='running'?'Diese Aufgabe ist als laufend gespeichert.':currentTask.status==='failed'?'Diese Aufgabe ist fehlgeschlagen.':'Letzter gespeicherter Aufgabenstand: '+currentTask.status}</p><small>Zuletzt aktualisiert: {formatDate(currentTask.updated_at)} · Offene Teilschritte: {Number(currentTask.pending_steps)||0}</small>{currentTask.last_error&&<p className="myki-monitor-muted">Letzter Fehler: {currentTask.last_error}</p>}</>:<div className="myki-monitor-empty"><strong>Kein aktiver Arbeitsauftrag nachgewiesen</strong><p>{explainRun(run)} Es wird kein laufender Auftrag angezeigt, solange dafür kein gespeicherter Nachweis vorliegt.</p></div>}
     <div className="myki-monitor-last-run"><small>LETZTER ENTWICKLUNGSLAUF</small><strong>{status.last_run?.status||'Noch kein gespeicherter Lauf'}</strong><span>{status.last_run?formatDate(status.last_run.finished_at||status.last_run.started_at):'Ein Lauf wird hier nach seiner Speicherung angezeigt.'}</span>{status.last_run?.error_code&&<em>Fehlercode: {status.last_run.error_code}</em>}</div>
    </section>
    <section className="myki-monitor-panel">
     <div className="myki-monitor-section-title"><h3><ArrowRight size={16}/> Was ist als Nächstes vorgesehen?</h3><span>PLAN / WARUM</span></div>
     <div className="myki-monitor-plan">{plan.map((item,index)=><article key={item.title}><span className={'myki-monitor-plan-number '+item.state}>{index+1}</span><div><strong>{item.title}</strong><p>{item.why}</p></div><small>{({blocked:'Gesperrt',pending:'Ausstehend',scheduled:'Vorgesehen',attention:'Prüfen',complete:'Erledigt'})[item.state]}</small></article>)}</div>
    </section>
   </div>
   <section className="myki-monitor-schedule">
    <div className="myki-monitor-section-title"><h3><Clock3 size={16}/> Verbindlicher Arbeitsrhythmus</h3><span>EUROPE/BERLIN</span></div>
    <div className="myki-monitor-time-grid"><article><b>03:00–08:00</b><strong>Selbstentwicklung</strong><small>Geplante Entwicklungszeit</small></article><article><b>08:00–10:00</b><strong>Pause</strong><small>Keine Entwicklungsarbeit</small></article><article><b>10:00–23:00</b><strong>Arbeitszeit</strong><small>Geplante Tagesphase</small></article><article><b>23:00–03:00</b><strong>Nachtruhe</strong><small>Keine Entwicklungsarbeit</small></article></div>
    <p className="myki-monitor-footnote">Der Chat für Administratoren und Scouts bleibt unabhängig davon erreichbar. Dieser Zeitplan betrifft die autonome Weiterentwicklung, nicht die Erreichbarkeit des Gesprächsbereichs.</p>
   </section>
   <div className="myki-monitor-footer"><span>Letzte erfolgreiche Statusabfrage: {formatDate(updatedAt)}</span><span>Automatische Aktualisierung alle 30 Sekunden</span></div>
  </>}
 </section>;
}
