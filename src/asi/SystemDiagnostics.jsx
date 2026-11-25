import React,{useCallback,useEffect,useState} from 'react';
import {Activity,AlertTriangle,CheckCircle2,Clock3,RefreshCw,ShieldCheck,ChevronDown,ChevronUp,Download} from 'lucide-react';
import './systemDiagnostics.css';

const dateTime=value=>value?new Date(value).toLocaleString('de-DE',{dateStyle:'medium',timeStyle:'medium'}):'—';
const labelStatus=status=>status==='healthy'?'Betriebsbereit':status==='warning'?'Hinweise vorhanden':'Kritischer Fehler';
const statusClass=status=>status==='healthy'?'healthy':status==='warning'?'warning':'critical';

export default function SystemDiagnostics({session}){
 const [runs,setRuns]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[expanded,setExpanded]=useState(null);
 const headers={Authorization:'Bearer '+(session?.access_token||'')};
 const load=useCallback(async()=>{if(!session?.access_token)return;setError('');try{const r=await fetch('/api/admin/system-diagnostics?limit=50',{headers});const j=await r.json();if(!r.ok)throw Error(j.error||'Diagnosehistorie konnte nicht geladen werden.');setRuns(j);}catch(e){setError(e.message);}},[session?.access_token]);
 useEffect(()=>{load();},[load]);
 async function run(){if(busy)return;setBusy(true);setError('');try{const r=await fetch('/api/admin/system-diagnostics/run',{method:'POST',headers:{...headers,'Content-Type':'application/json'}});const j=await r.json();if(!r.ok)throw Error(j.error||j.detail||'Diagnose konnte nicht ausgeführt werden.');setRuns(old=>[j,...old.filter(x=>x.id!==j.id)]);setExpanded(j.id);}catch(e){setError(e.message);}finally{setBusy(false);}}
 function exportRun(run){const blob=new Blob([JSON.stringify(run,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='systemdiagnose-'+(run.id||'bericht')+'.json';a.click();URL.revokeObjectURL(url);}
 const latest=runs[0],latestChecks=latest?.checks||[];
 const totalChecks=latest?.summary?.total??latestChecks.length,passed=latest?.summary?.passed??latestChecks.filter(x=>x.ok).length,failed=latest?.summary?.failed??latestChecks.filter(x=>!x.ok).length;
 return <section className="system-diagnostics">
  <div className="sd-hero"><div className="sd-hero-icon"><Activity size={25}/></div><div><span className="sd-eyebrow">ADMINISTRATOR · SYSTEMÜBERWACHUNG</span><h1>Systemdiagnose-Center</h1><p>Technische Prüfungen, Fehlerberichte und dauerhaft gespeicherte Testhistorie für myScoutingDatabase.</p></div><button type="button" onClick={run} disabled={busy}>{busy?<RefreshCw className="sd-spin" size={16}/>:<ShieldCheck size={16}/>} {busy?'Diagnose läuft…':'Diagnose jetzt starten'}</button></div>
  {error&&<div className="sd-error"><AlertTriangle size={18}/><div><strong>Diagnose nicht vollständig verfügbar</strong><p>{error}</p><small>Prüfe insbesondere, ob die Datenbankmigration 018 bereits in Supabase ausgeführt wurde.</small></div></div>}
  <div className="sd-stats">
   <article><span>Letzter Systemstatus</span><strong className={latest?statusClass(latest.status):''}>{latest?labelStatus(latest.status):'Noch nicht geprüft'}</strong><small>{latest?dateTime(latest.finished_at):'Noch kein gespeicherter Lauf'}</small></article>
   <article><span>Prüfungen im letzten Lauf</span><strong>{totalChecks}</strong><small>{passed} bestanden · {failed} Auffälligkeiten</small></article>
   <article><span>Ausführungsdauer</span><strong>{latest?((latest.duration_ms||0)/1000).toFixed(2)+' s':'—'}</strong><small>{latest?.triggered_by==='automatic'?'Automatisch':latest?.triggered_by==='deployment'?'Nach Deployment':latest?'Manuell durch Admin':'Keine Ausführung'}</small></article>
  </div>
  <div className="sd-section-head"><div><span className="sd-eyebrow">LETZTER PRÜFLAUF</span><h2>Prüfergebnisse im Detail</h2></div><button type="button" className="sd-quiet" onClick={load}><RefreshCw size={15}/> Aktualisieren</button></div>
  {!latest?<div className="sd-empty">Noch keine Diagnose vorhanden. Starte eine Prüfung, um den Systemzustand zu erfassen.</div>:<div className="sd-run-card">
   <div className="sd-run-head"><div><strong>{labelStatus(latest.status)}</strong><small>{dateTime(latest.started_at)} · {latest.triggered_by==='automatic'?'Automatischer Systemcheck':latest.triggered_by==='deployment'?'Deployment-Prüfung':'Manuell durch Administrator'}</small></div><button type="button" className="sd-quiet" onClick={()=>exportRun(latest)}><Download size={15}/> Bericht</button></div>
   {latestChecks.map((check,i)=><article className="sd-check" key={i}><div className={'sd-check-icon '+(check.ok?'ok':check.severity==='info'?'info':'fail')}>{check.ok?<CheckCircle2 size={17}/>:check.severity==='info'?<Clock3 size={17}/>:<AlertTriangle size={17}/>}</div><div className="sd-check-main"><strong>{check.name}</strong><small>{check.category} · {dateTime(check.checkedAt)}</small><p>{check.detail}</p>{!check.ok&&check.recommendation&&<div className="sd-recommendation"><strong>Empfohlene Maßnahme</strong><span>{check.recommendation}</span></div>}</div><span className={'sd-check-state '+(check.ok?'ok':check.severity==='info'?'info':'fail')}>{check.ok?'BESTANDEN':check.severity==='info'?'OPTIONAL':'FEHLER'}</span></article>)}
  </div>}
  <div className="sd-section-head"><div><span className="sd-eyebrow">AUDITIERBARE HISTORIE</span><h2>Frühere Diagnoseberichte</h2><p>Die letzten 50 Läufe bleiben nach Abmeldung und Deployment abrufbar.</p></div></div>
  <div className="sd-history">{runs.length===0?<div className="sd-empty">Keine gespeicherten Testläufe.</div>:runs.map(run=><article className="sd-history-item" key={run.id}><button type="button" className="sd-history-toggle" onClick={()=>setExpanded(expanded===run.id?null:run.id)}><span className={'sd-status-dot '+statusClass(run.status)}/><span className="sd-history-copy"><strong>{labelStatus(run.status)}</strong><small>{dateTime(run.finished_at)} · {run.triggered_by==='automatic'?'Automatisch':run.triggered_by==='deployment'?'Deployment':'Admin'} · {run.summary?.passed??0}/{run.summary?.total??0} bestanden</small></span>{expanded===run.id?<ChevronUp size={17}/>:<ChevronDown size={17}/>}</button>{expanded===run.id&&<div className="sd-history-detail"><button type="button" className="sd-quiet" onClick={()=>exportRun(run)}><Download size={14}/> JSON-Bericht exportieren</button>{(run.checks||[]).map((check,i)=><div className="sd-history-check" key={i}><strong>{check.name}</strong><span>{check.ok?'BESTANDEN':check.severity==='info'?'OPTIONAL':'FEHLER'}</span><p>{check.detail}</p>{!check.ok&&check.recommendation&&<div className="sd-recommendation"><strong>Empfohlene Maßnahme</strong><span>{check.recommendation}</span></div>}</div>)}</div>}</article>)}</div>
 </section>;
}
