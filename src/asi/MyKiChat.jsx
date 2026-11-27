import React,{useEffect,useRef,useState} from 'react';
import {Activity,BrainCircuit,LoaderCircle,PauseCircle,Send,Sparkles,TrendingUp} from 'lucide-react';
import './myki-chat.css';

const welcome={id:'welcome',role:'assistant',text:'Hallo! Hier bin ich direkt in myKI. Du kannst mit mir über meine Entwicklung, meine Lernfortschritte, Verbesserungsvorschläge und die KI-Tickets sprechen. Ich erkläre dir meine Arbeit verständlich und sage offen, wenn ich etwas nicht sicher weiß.'};

export default function MyKiChat({supabase}){
 const [messages,setMessages]=useState([welcome]);
 const [draft,setDraft]=useState('');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [status,setStatus]=useState({scheduler_enabled:false,last_run:null,run_state:'paused'});
 const messagesRef=useRef(null);

 useEffect(()=>{const el=messagesRef.current;if(el)el.scrollTop=el.scrollHeight;},[messages,busy]);
 useEffect(()=>{
  let active=true;
  const refresh=async()=>{
   try{
    const {data:{session}}=await supabase.auth.getSession();
    if(!session?.access_token)throw new Error('Sitzung nicht verfügbar');
    const response=await fetch('/api/admin/myki/status',{headers:{Authorization:'Bearer '+session.access_token},cache:'no-store'});
    const payload=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(payload.error||'Status nicht verfügbar');
    if(active)setStatus(payload);
   }catch{if(active)setStatus(current=>({...current,status_unavailable:true}));}
  };
  refresh();const timer=setInterval(refresh,15000);
  return()=>{active=false;clearInterval(timer)};
 },[supabase]);

 async function sendMessage(event){
  event?.preventDefault();
  const value=draft.trim();
  if(!value||busy)return;
  setDraft('');setError('');
  const history=messages.slice(-20).map(item=>({role:item.role,text:item.text}));
  setMessages(prev=>[...prev,{id:'u-'+Date.now(),role:'user',text:value}]);
  setBusy(true);
  try{
   const {data:{session}}=await supabase.auth.getSession();
   if(!session?.access_token)throw new Error('Deine Admin-Sitzung ist abgelaufen. Bitte melde dich erneut an.');
   const response=await fetch('/api/agent/chat',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},body:JSON.stringify({message:value,history})});
   const payload=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(payload.error||'MESSINHO konnte nicht antworten.');
   setMessages(prev=>[...prev,{id:'a-'+Date.now(),role:'assistant',text:payload.reply||'Ich habe deine Nachricht verarbeitet.'}]);
  }catch(err){setError(err.message||'Die Verbindung zu MESSINHO ist fehlgeschlagen.');setDraft(value);}
  finally{setBusy(false);}
 }

 const schedulerRunning=status.last_run?.status==='running'||status.run_state==='running';
 const mode=busy?'working':schedulerRunning?'learning':'paused';
 const label=mode==='working'?'MESSINHO arbeitet gerade an deiner Anfrage':mode==='learning'?'MESSINHO führt eine autonome Selbstprüfung durch':'MESSINHO ist pausiert und wartet auf den nächsten Auftrag';
 const lastRun=status.last_run;
 return <section className="myki-chat panel" aria-label="Direkter Chat mit MESSINHO">
  <div className="myki-chat-header">
   <div className="myki-chat-title"><span className="myki-eyebrow">DIREKTE KOMMUNIKATION</span><h2><BrainCircuit size={20}/> Sprich mit MESSINHO</h2><p>Ein Gespräch auf Augenhöhe – mit dem Wissen und den Fähigkeiten des bestehenden MESSINHO-Agenten.</p></div>
   <div className={'myki-agent-state '+mode} role="status" aria-live="polite"><i/>{label}</div>
  </div>
  <div className="myki-agent-meta">
   <span><Activity size={14}/> Selbstprüfung: {status.scheduler_enabled?'aktiviert':'derzeit deaktiviert'}</span>
   <span>Autonomie: {status.autonomy_mode==='bounded_admin_review'?'begrenzter Admin-Prüfmodus':'interaktiver Modus'}</span>
   <span>Programmier-Sandbox: {status.sandbox?.state==='configured_not_yet_end_to_end_verified'?'Zugangsdaten konfiguriert – E2E-Prüfung offen':status.sandbox?.state==='credential_missing'?'GitHub-Zugangsdaten fehlen':'derzeit gesperrt'}</span>
   <span><PauseCircle size={14}/> Geplanter Rhythmus: täglich 20:00 Uhr (Berlin)</span>
   <span>Letzte Prüfung: {lastRun?.finished_at?new Date(lastRun.finished_at).toLocaleString('de-DE'):lastRun?.started_at?new Date(lastRun.started_at).toLocaleString('de-DE'):'Noch kein Lauf gespeichert'}</span>
   {lastRun?.status&&<span>Ergebnis: {({ticket_created:'Ticket erstellt',no_improvement:'Keine sichere Verbesserung gefunden',duplicate:'Vorschlag bereits vorhanden',failed:'Prüfung fehlgeschlagen',running:'Läuft'})[lastRun.status]||lastRun.status}</span>}
  </div>
  {status.maturity&&<section className="myki-maturity" aria-label="MESSINHO Entwicklungsstand">
   <div className="myki-maturity-header">
    <div><span className="myki-eyebrow">ENTWICKLUNGSSTAND</span><h3><TrendingUp size={17}/> MESSINHO-Reifegrad</h3></div>
    <div className="myki-maturity-score"><strong>{status.maturity.score}</strong><span>/ 100</span></div>
   </div>
   <div className="myki-maturity-level"><b>{status.maturity.level}</b><span>Nachweisbasierte Einstufung</span></div>
   <div className="myki-maturity-track" role="progressbar" aria-label="MESSINHO Reifegrad" aria-valuemin="0" aria-valuemax="100" aria-valuenow={status.maturity.score}><span style={{width:Math.max(0,Math.min(100,status.maturity.score))+'%'}}/></div>
   <p className="myki-maturity-policy">{status.maturity.score_policy}</p>
   <details className="myki-maturity-details">
    <summary>Bewertung der Entwicklungsbereiche anzeigen</summary>
    <div className="myki-maturity-pillars">
     {status.maturity.pillars?.map(item=><div className="myki-maturity-pillar" key={item.id}>
      <div><b>{item.label}</b><strong>{item.points}/{item.maximum}</strong></div>
      <div className="myki-maturity-mini-track"><span style={{width:Math.max(0,Math.min(100,item.points/item.maximum*100))+'%'}}/></div>
      <p>{item.evidence}</p><small>Nächster Schritt: {item.next}</small>
     </div>)}
    </div>
   </details>
   <div className="myki-maturity-next"><b>Nächste Entwicklungsschritte</b><ol>{status.maturity.next_milestones?.slice(0,3).map((item,index)=><li key={index}>{item}</li>)}</ol></div>
  </section>}
  <div className="myki-chat-messages" ref={messagesRef} aria-live="polite">
   {messages.map(item=><article key={item.id} className={'myki-chat-message '+item.role}><div className="myki-chat-avatar">{item.role==='assistant'?<BrainCircuit size={16}/>:<span>DU</span>}</div><div className="myki-chat-bubble"><small>{item.role==='assistant'?'MESSINHO':'DU'}</small><p>{item.text}</p></div></article>)}
   {busy&&<div className="myki-chat-thinking"><LoaderCircle className="myki-chat-spin" size={16}/> MESSINHO denkt nach und prüft deine Anfrage …</div>}
  </div>
  {error&&<p className="myki-chat-error" role="alert">{error}</p>}
  <form className="myki-chat-composer" onSubmit={sendMessage}><textarea rows={2} maxLength={1200} value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Schreibe MESSINHO eine Nachricht …" aria-label="Nachricht an MESSINHO" disabled={busy}/><button type="submit" disabled={busy||!draft.trim()} aria-label="Nachricht senden"><Send size={17}/></button></form>
  <small className="myki-chat-footnote"><Sparkles size={12}/> MESSINHO nutzt denselben Agenten und dieselbe Wissensbasis wie im übrigen System. Ein Ticket wird nur bei einer konkreten, geprüften Verbesserung erstellt.</small>
 </section>;
}
