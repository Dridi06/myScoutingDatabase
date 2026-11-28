import React,{useEffect,useRef,useState} from 'react';
import {BrainCircuit,Send,Sparkles,LoaderCircle} from 'lucide-react';
import './myki-chat.css';

const timestampNow=()=>new Date().toISOString();
const formatTimestamp=value=>value&&Number.isFinite(Date.parse(value))?new Intl.DateTimeFormat('de-DE',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Berlin'}).format(new Date(value)):'--:--';
const welcome={id:'welcome',role:'assistant',timestamp:timestampNow(),persisted:false,text:'Hallo! Hier bin ich direkt in myKI. Du kannst mit mir über meine Entwicklung, meine Lernfortschritte, Verbesserungsvorschläge und die KI-Tickets sprechen. Ich erkläre dir meine Arbeit verständlich und sage offen, wenn ich etwas nicht sicher weiß.'};

export default function MyKiChat({supabase}){
 const [messages,setMessages]=useState([welcome]);
 const [conversationId,setConversationId]=useState(null);
 const [errorAt,setErrorAt]=useState(null);
 const [draft,setDraft]=useState('');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [status,setStatus]=useState({scheduler_enabled:false,last_run:null,run_state:'paused',autonomy_mode:'paused'});
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
  const restore=async()=>{
   try{
    const {data:{session}}=await supabase.auth.getSession();
    if(!session?.access_token)return;
    const response=await fetch('/api/agent/conversation',{headers:{Authorization:'Bearer '+session.access_token},cache:'no-store'});
    const payload=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(payload.error||'Gesprächsverlauf nicht verfügbar.');
    if(!active)return;
    setConversationId(payload.conversation_id||null);
    if(Array.isArray(payload.messages)&&payload.messages.length)setMessages(payload.messages.map(item=>({
      id:item.id,role:item.role,text:item.text,timestamp:item.created_at||item.output_generated_at||null,persisted:true,
      serverReceivedAt:item.server_received_at||null,clientSubmittedAt:item.client_submitted_at||null,
      generatedAt:item.output_generated_at||null
    })));
   }catch(err){if(active){setError(err.message||'Gesprächsverlauf konnte nicht geladen werden.');setErrorAt(timestampNow());}}
  };
  refresh();restore();const timer=setInterval(refresh,30000);
  return()=>{active=false;clearInterval(timer)};
 },[supabase]);

 async function sendMessage(event){
  event?.preventDefault();
  const value=draft.trim();
  const statusQuestion=/\b(woran arbeitest du|was arbeitest du gerade|was machst du gerade|aktueller arbeitsstand|was ist dein status|arbeitest du gerade)\b/i.test(value);
  if(!value||(busy&&!statusQuestion))return;
  const alreadyBusy=busy,clientSubmittedAt=timestampNow(),userMessageId='u-'+Date.now();
  setDraft('');setError('');setErrorAt(null);
  const history=messages.slice(-20).map(item=>({role:item.role,text:item.text}));
  setMessages(prev=>[...prev,{id:userMessageId,role:'user',timestamp:clientSubmittedAt,clientSubmittedAt,persisted:false,text:value}]);
  if(!alreadyBusy)setBusy(true);
  try{
   const {data:{session}}=await supabase.auth.getSession();
   if(!session?.access_token)throw new Error('Deine Admin-Sitzung ist abgelaufen. Bitte melde dich erneut an.');
   const response=await fetch('/api/agent/chat',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},body:JSON.stringify({message:value,history,conversation_id:conversationId,client_submitted_at:clientSubmittedAt})});
   const payload=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(payload.error||'MESSINHO konnte nicht antworten.');
   const times=payload.timestamps||{};
   setConversationId(payload.conversation_id||conversationId);
   setMessages(prev=>[...prev.map(item=>item.id===userMessageId?{...item,timestamp:times.input_persisted_at||item.timestamp,persisted:!!times.input_persisted_at,serverReceivedAt:times.server_received_at||null,clientSubmittedAt:times.client_submitted_at||clientSubmittedAt}:item),
    {id:'a-'+Date.now(),role:'assistant',timestamp:times.output_persisted_at||times.output_generated_at||payload.server_timestamp||null,persisted:!!times.output_persisted_at,
     generatedAt:times.output_generated_at||payload.server_timestamp||null,text:payload.reply||'Ich habe deine Nachricht verarbeitet.'}]);
  }catch(err){setError(err.message||'Die Verbindung zu MESSINHO ist fehlgeschlagen.');setErrorAt(timestampNow());setDraft(value);}
  finally{if(!alreadyBusy)setBusy(false);}
 }

 const schedulerRunning=status.last_run?.status==='running'||status.run_state==='running';
 const operatingMode=status.control?.mode||status.autonomy_mode||'paused';
 const mode=busy?'working':schedulerRunning?'learning':operatingMode==='developing'?'learning':operatingMode==='working'?'working':'paused';
 const label=mode==='working'?'MESSINHO arbeitet gerade':mode==='learning'?'MESSINHO entwickelt sich autonom weiter':'MESSINHO ist pausiert';
 return <section className="myki-chat panel" aria-label="Direkter Chat mit MESSINHO">
  <div className="myki-chat-header">
   <div className="myki-chat-title"><span className="myki-eyebrow">DIREKTE KOMMUNIKATION</span><h2><BrainCircuit size={20}/> myKI Chat</h2><p>Direkte Unterhaltung mit MESSINHO.</p></div>
   <div><div className={'myki-agent-state '+mode} role="status" aria-live="polite"><i/>{label}</div><small className="myki-chat-timestamp">Status aktualisiert: {formatTimestamp(status.generated_at||status.server_timestamp)}</small></div>
  </div>
  <div className="myki-chat-messages" ref={messagesRef} aria-live="polite">
   {messages.map(item=><article key={item.id} className={'myki-chat-message '+item.role}><div className="myki-chat-avatar">{item.role==='assistant'?<BrainCircuit size={16}/>:<span>DU</span>}</div><div className="myki-chat-bubble"><small>{item.role==='assistant'?'MESSINHO':'DU'}</small><p>{item.text}</p><time className="myki-chat-timestamp" dateTime={item.timestamp||undefined}>{formatTimestamp(item.timestamp)}</time></div></article>)}
   {busy&&<div className="myki-chat-thinking"><LoaderCircle className="myki-chat-spin" size={16}/> MESSINHO denkt nach und prüft deine Anfrage …</div>}
  </div>
  {error&&<p className="myki-chat-error" role="alert">{error}<time className="myki-chat-timestamp" dateTime={errorAt||undefined}>Fehlerzeitpunkt · {formatTimestamp(errorAt)}</time></p>}
  <form className="myki-chat-composer" onSubmit={sendMessage}><textarea rows={2} maxLength={1200} value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Schreibe MESSINHO eine Nachricht …" aria-label="Nachricht an MESSINHO"/><button type="submit" disabled={(busy&&!/\b(woran arbeitest du|was arbeitest du gerade|was machst du gerade|aktueller arbeitsstand|was ist dein status|arbeitest du gerade)\b/i.test(draft))||!draft.trim()} aria-label="Nachricht senden"><Send size={17}/></button></form>
  <small className="myki-chat-footnote"><Sparkles size={12}/> MESSINHO nutzt denselben Agenten und dieselbe Wissensbasis wie im übrigen System. Ein Ticket wird nur bei einer konkreten, geprüften Verbesserung erstellt.</small>
 </section>;
}
