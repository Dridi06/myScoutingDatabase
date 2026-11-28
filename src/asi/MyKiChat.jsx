import React,{useEffect,useRef,useState} from 'react';
import {Activity,BrainCircuit,LoaderCircle,PauseCircle,Send,ShieldCheck,Sparkles,TrendingUp} from 'lucide-react';
import './myki-chat.css';

const timestampNow=()=>new Date().toISOString();
const formatTimestamp=value=>new Intl.DateTimeFormat('de-DE',{dateStyle:'short',timeStyle:'medium',timeZone:'Europe/Berlin'}).format(new Date(value));
const welcome={id:'welcome',role:'assistant',timestamp:timestampNow(),text:'Hallo! Hier bin ich direkt in myKI. Du kannst mit mir über meine Entwicklung, meine Lernfortschritte, Verbesserungsvorschläge und die KI-Tickets sprechen. Ich erkläre dir meine Arbeit verständlich und sage offen, wenn ich etwas nicht sicher weiß.'};

export default function MyKiChat({supabase}){
 const [messages,setMessages]=useState([welcome]);
 const [draft,setDraft]=useState('');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [status,setStatus]=useState({scheduler_enabled:false,last_run:null,run_state:'paused',autonomy_mode:'paused'});
 const [controlBusy,setControlBusy]=useState(false);
 const [diagnosticBusy,setDiagnosticBusy]=useState(false);
 const messagesRef=useRef(null);

 useEffect(()=>{const el=messagesRef.current;if(el)el.scrollTop=el.scrollHeight;},[messages,busy]);
 async function refreshStatus(){
  try{
   const {data:{session}}=await supabase.auth.getSession();
   if(!session?.access_token)throw new Error('Sitzung nicht verfügbar');
   const response=await fetch('/api/admin/myki/status',{headers:{Authorization:'Bearer '+session.access_token},cache:'no-store'});
   const payload=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(payload.error||'Status nicht verfügbar');
   setStatus(payload);
  }catch{setStatus(current=>({...current,status_unavailable:true}));}
 }
 useEffect(()=>{
  let active=true;
  const refresh=async()=>{
   if(!active)return;
   await refreshStatus();
  };
  refresh();const timer=setInterval(refresh,30000);
  return()=>{active=false;clearInterval(timer)};
 },[supabase]);

 async function changeControl(action,mode){
  if(controlBusy)return;
  setControlBusy(true);setError('');
  try{
   const {data:{session}}=await supabase.auth.getSession();
   if(!session?.access_token)throw new Error('Deine Admin-Sitzung ist abgelaufen.');
   const response=await fetch('/api/admin/myki/control',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},
    body:JSON.stringify(action==='stop'?{action}:{action:'set_mode',mode})});
   const payload=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(payload.error||'Die Steuerung konnte nicht gespeichert werden.');
   await refreshStatus();
  }catch(err){setError(err.message||'Die Steuerung ist fehlgeschlagen.');}
  finally{setControlBusy(false);}
 }


 async function runDiagnostic(){
  if(diagnosticBusy)return;
  setDiagnosticBusy(true);setError('');
  try{
   const {data:{session}}=await supabase.auth.getSession();
   if(!session?.access_token)throw new Error('Deine Admin-Sitzung ist abgelaufen. Bitte melde dich erneut an.');
   const response=await fetch('/api/admin/messinho-diagnostics/run',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token}});
   const payload=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(payload.error||payload.detail||'Die MESSINHO-Diagnose konnte nicht ausgeführt werden.');
   const checks=Array.isArray(payload.checks)?payload.checks:[];
   const failed=checks.filter(item=>item.ok===false);
   const passed=payload.summary?.passed??checks.length-failed.length;
   const total=payload.summary?.total??checks.length;
   const details=failed.slice(0,5).map((item,index)=>(index+1)+'. '+(item.name||'Prüfung')+': '+(item.detail||'Keine Detailbeschreibung verfügbar.')).join('\n');
   const summary='Diagnose abgeschlossen und gespeichert.\nErgebnis: '+(payload.status||'unbekannt').toUpperCase()+' · '+passed+'/'+total+' Prüfungen bestanden · '+failed.length+' Auffälligkeiten.'+(details?'\n\nGefundene Auffälligkeiten:\n'+details:failed.length>5?'\n\nWeitere Auffälligkeiten stehen im Diagnose-Center.':'\n\nKeine Fehler gefunden.');
   setMessages(prev=>[...prev,{id:'diag-'+(payload.id||Date.now()),role:'assistant',timestamp:timestampNow(),text:summary}]);
  }catch(err){setError(err.message||'Die MESSINHO-Diagnose ist fehlgeschlagen.');}
  finally{setDiagnosticBusy(false);}
 }

 async function sendMessage(event){
  event?.preventDefault();
  const value=draft.trim();
  const statusQuestion=/\b(woran arbeitest du|was arbeitest du gerade|was machst du gerade|aktueller arbeitsstand|was ist dein status|arbeitest du gerade)\b/i.test(value);
  if(!value||(busy&&!statusQuestion))return;
  const alreadyBusy=busy;
  setDraft('');setError('');
  const history=messages.slice(-20).map(item=>({role:item.role,text:item.text}));
  setMessages(prev=>[...prev,{id:'u-'+Date.now(),role:'user',timestamp:timestampNow(),text:value}]);
  if(!alreadyBusy)setBusy(true);
  try{
   const {data:{session}}=await supabase.auth.getSession();
   if(!session?.access_token)throw new Error('Deine Admin-Sitzung ist abgelaufen. Bitte melde dich erneut an.');
   const response=await fetch('/api/agent/chat',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},body:JSON.stringify({message:value,history})});
   const payload=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(payload.error||'MESSINHO konnte nicht antworten.');
   setMessages(prev=>[...prev,{id:'a-'+Date.now(),role:'assistant',timestamp:timestampNow(),text:payload.reply||'Ich habe deine Nachricht verarbeitet.'}]);
  }catch(err){setError(err.message||'Die Verbindung zu MESSINHO ist fehlgeschlagen.');setDraft(value);}
  finally{if(!alreadyBusy)setBusy(false);}
 }

 const schedulerRunning=status.last_run?.status==='running'||status.run_state==='running';
 const operatingMode=status.control?.mode||status.autonomy_mode||'paused';
 const mode=busy?'working':schedulerRunning?'learning':operatingMode==='developing'?'learning':operatingMode==='working'?'working':'paused';
 const label=mode==='working'?'MESSINHO arbeitet gerade':mode==='learning'?'MESSINHO entwickelt sich autonom weiter':'MESSINHO ist pausiert';
 const lastRun=status.last_run;
 return <section className="myki-chat panel" aria-label="Direkter Chat mit MESSINHO">
  <div className="myki-chat-header">
   <div className="myki-chat-title"><span className="myki-eyebrow">DIREKTE KOMMUNIKATION</span><h2><BrainCircuit size={20}/> Sprich mit MESSINHO</h2><p>Ein Gespräch auf Augenhöhe – mit dem Wissen und den Fähigkeiten des bestehenden MESSINHO-Agenten.</p></div>
   <div className={'myki-agent-state '+mode} role="status" aria-live="polite"><i/>{label}</div>
  </div>
  <div className="myki-chat-messages" ref={messagesRef} aria-live="polite">
   {messages.map(item=><article key={item.id} className={'myki-chat-message '+item.role}><div className="myki-chat-avatar">{item.role==='assistant'?<BrainCircuit size={16}/>:<span>DU</span>}</div><div className="myki-chat-bubble"><small>{item.role==='assistant'?'MESSINHO':'DU'}</small><p>{item.text}</p><time className="myki-chat-timestamp" dateTime={item.timestamp||undefined}>{item.timestamp?formatTimestamp(item.timestamp):formatTimestamp(timestampNow())}</time></div></article>)}
   {busy&&<div className="myki-chat-thinking"><LoaderCircle className="myki-chat-spin" size={16}/> MESSINHO denkt nach und prüft deine Anfrage …</div>}
  </div>
  {error&&<p className="myki-chat-error" role="alert">{error}</p>}
  <form className="myki-chat-composer" onSubmit={sendMessage}><textarea rows={2} maxLength={1200} value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Schreibe MESSINHO eine Nachricht …" aria-label="Nachricht an MESSINHO"/><button type="submit" disabled={(busy&&!/\b(woran arbeitest du|was arbeitest du gerade|was machst du gerade|aktueller arbeitsstand|was ist dein status|arbeitest du gerade)\b/i.test(draft))||!draft.trim()} aria-label="Nachricht senden"><Send size={17}/></button></form>
  <small className="myki-chat-footnote"><Sparkles size={12}/> MESSINHO nutzt denselben Agenten und dieselbe Wissensbasis wie im übrigen System. Ein Ticket wird nur bei einer konkreten, geprüften Verbesserung erstellt.</small>
 </section>;
}
