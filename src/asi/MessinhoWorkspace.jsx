import React,{useEffect,useRef,useState} from 'react';
import {BrainCircuit,Send,Mic,MicOff,Volume2,VolumeX,ShieldCheck,Database,Search,Users,MessageCircle,Clock3,LoaderCircle} from 'lucide-react';
import './messinho.css';

const suggestions=[
  'Gib mir eine Übersicht über meinen Datenbestand.',
  'Zeige meine gespeicherten Kandidaten.',
  'Vergleiche meine Kandidaten und erstelle eine Rangliste.',
  'Suche Spieler Müller.'
];
export default function MessinhoWorkspace({supabase,profile,onNotice=()=>{},compact=false}){
  const [messages,setMessages]=useState([{id:'welcome',role:'assistant',text:'Hallo! Ich bin Messinho, dein Scouting-Agent. Ich kann zunächst deinen Datenbestand auswerten, gespeicherte Kandidaten anzeigen und Spieler im vorhandenen Katalog suchen. Meine autonomen Recherche- und Lernmodule werden schrittweise integriert.'}]);
  const [draft,setDraft]=useState('');
  const [busy,setBusy]=useState(false);
  const [listening,setListening]=useState(false);
  const [voiceOutput,setVoiceOutput]=useState(true);
  const [voiceAvailable,setVoiceAvailable]=useState(false);
  const [error,setError]=useState('');
  const [feedbackDrafts,setFeedbackDrafts]=useState({});
  const [feedbackBusy,setFeedbackBusy]=useState('');
  const endRef=useRef(null);
  const recognitionRef=useRef(null);
  useEffect(()=>{
    const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
    setVoiceAvailable(Boolean(SpeechRecognition));
    if(!SpeechRecognition)return;
    const recognition=new SpeechRecognition();
    recognition.lang='de-DE';recognition.interimResults=false;recognition.maxAlternatives=1;
    recognition.onresult=e=>{const transcript=e.results?.[0]?.[0]?.transcript||'';setDraft(v=>v? v+' '+transcript:transcript);setListening(false);};
    recognition.onerror=()=>setListening(false);
    recognition.onend=()=>setListening(false);
    recognitionRef.current=recognition;
    return()=>{try{recognition.stop()}catch{};recognitionRef.current=null};
  },[]);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:'smooth',block:'end'});},[messages,busy]);
  function speak(text){
    if(!voiceOutput||!('speechSynthesis' in window))return;
    window.speechSynthesis.cancel();
    const utterance=new SpeechSynthesisUtterance(text);
    utterance.lang='de-DE';utterance.rate=1;window.speechSynthesis.speak(utterance);
  }
  async function send(text=draft){
    const value=String(text||'').trim();
    if(!value||busy)return;
    setDraft('');setError('');
    setMessages(prev=>[...prev,{id:'u-'+Date.now(),role:'user',text:value}]);
    setBusy(true);
    try{
      const {data:{session}}=await supabase.auth.getSession();
      if(!session?.access_token)throw new Error('Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.');
      const response=await fetch('/api/agent/chat',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},body:JSON.stringify({message:value,history:messages.map(m=>({role:m.role,text:m.text})).slice(-10)})});
      const payload=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(payload.error||'Messinho konnte nicht antworten.');
      const next={id:'a-'+Date.now(),role:'assistant',text:payload.reply||'Ich habe die Anfrage verarbeitet.',intent:payload.intent,items:Array.isArray(payload.items)?payload.items:[],metrics:payload.metrics||null};
      setMessages(prev=>[...prev,next]);speak(next.text);
    }catch(e){setError(e.message||'Verbindung zu Messinho fehlgeschlagen.');}
    finally{setBusy(false);}
  }
  function toggleMic(){
    const recognition=recognitionRef.current;
    if(!recognition){setError('Sprach-zu-Text wird von diesem Browser nicht unterstützt. Du kannst Messinho weiterhin per Texteingabe nutzen.');return;}
    if(listening){recognition.stop();setListening(false);return;}
    setError('');
    try{recognition.start();setListening(true);}catch{setListening(false);setError('Das Mikrofon konnte nicht gestartet werden. Bitte prüfe die Browserberechtigung.');}
  }

  async function submitFeedback(item){
    const id=String(item?.id||'');
    const draft=feedbackDrafts[id]||{};
    const dimensionScores=Object.fromEntries(['technical','tactical','athletic','mental','goalkeeping'].filter(key=>draft[key]!==undefined&&draft[key]!=='' ).map(key=>[key,Number(draft[key])]));
    if(!id){setError('Für diesen Eintrag fehlt eine gespeicherte Kandidaten-ID.');return;}
    if(dimensionScores && Object.keys(dimensionScores).length<2){setError('Bitte mindestens zwei Leistungsdimensionen bewerten.');return;}
    if(draft.target_score===''||draft.target_score===undefined||!Number.isFinite(Number(draft.target_score))){setError('Bitte eine Gesamtbewertung zwischen 0 und 100 angeben.');return;}
    setFeedbackBusy(id);setError('');
    try{
      const {data:{session}}=await supabase.auth.getSession();
      if(!session?.access_token)throw new Error('Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.');
      const response=await fetch('/api/messinho/feedback',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},body:JSON.stringify({candidate_id:id,player_id:String(item.player_id||item.name||item.player_name||id),target_score:Number(draft.target_score),dimension_scores:dimensionScores,comment:draft.comment||''})});
      const payload=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(payload.error||'Feedback konnte nicht gespeichert werden.');
      setFeedbackDrafts(prev=>({...prev,[id]:{}}));
      setMessages(prev=>[...prev,{id:'feedback-'+Date.now(),role:'assistant',text:'Danke. Deine Bewertung wurde als Scout-Feedback gespeichert. Sie fließt erst nach ausreichender Datenmenge in eine geprüfte Modell-Evaluation ein.'}]);
    }catch(e){setError(e.message||'Feedback konnte nicht gespeichert werden.');}
    finally{setFeedbackBusy('');}
  }
  function setFeedbackValue(id,key,value){setFeedbackDrafts(prev=>({...prev,[id]:{...(prev[id]||{}),[key]:value}}));}

  function renderItems(items){
    if(!items?.length)return null;
    return <div className="messinho-results">{items.map((item,index)=><article key={String(item.id||item.name||index)} className="messinho-result-row"><div className="messinho-result-icon"><Users size={16}/></div><div className="messinho-result-copy"><strong>{index+1}. {item.name||item.player_name||'Unbenannter Eintrag'}</strong><span>{[item.club||item.current_club||item.currentClub,item.year||item.birth_year||item.birthYear,item.positions?.join(', '),item.analysis?.fit_score!==null&&item.analysis?.fit_score!==undefined?'Fit '+item.analysis.fit_score+'/100':null,item.kind,item.analysis?.recommendation?.label||item.recommendation?.label||item.recommendation].filter(Boolean).join(' · ')}</span>{item.messinho_rating&&<small>{item.messinho_rating.score===null?'MESSINHO-Score: nicht ausreichend belegt':'MESSINHO-Score: '+item.messinho_rating.score+'/100'} · Datenabdeckung {item.messinho_rating.evidence_coverage}% · {item.messinho_rating.confidence}</small>}{item.analysis?.analysis&&<small>{item.analysis.analysis}</small>}{item.sources?.map(source=><a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.publisher||source.title||'Quelle öffnen'}</a>)}{item.id&&<details className="messinho-feedback"><summary>Scout-Bewertung abgeben</summary><div className="messinho-feedback-grid"><label>Gesamtbewertung (0–100)<input type="number" min="0" max="100" value={feedbackDrafts[String(item.id)]?.target_score??''} onChange={e=>setFeedbackValue(String(item.id),'target_score',e.target.value)}/></label>{[['technical','Technik'],['tactical','Taktik'],['athletic','Athletik'],['mental','Mental'],['goalkeeping','Torwart']].map(([key,label])=><label key={key}>{label}<input type="number" min="0" max="100" value={feedbackDrafts[String(item.id)]?.[key]??''} onChange={e=>setFeedbackValue(String(item.id),key,e.target.value)}/></label>)}</div><button type="button" disabled={feedbackBusy===String(item.id)} onClick={()=>submitFeedback(item)}>{feedbackBusy===String(item.id)?'Speichert …':'Bewertung speichern'}</button></details>}</div></article>)}</div>;
  }
  return <div className="messinho-workspace">
    {!compact&&<header className="messinho-hero"><div className="messinho-emblem"><BrainCircuit size={29}/></div><div className="messinho-hero-copy"><span>MYSCOUTINGDATABASE · KI-ASSISTENT</span><h1>Messinho</h1><p>Dein persönlicher Scouting-Agent</p></div><div className="messinho-status"><i/> Modul geladen</div></header>}
    {!compact&&<section className="messinho-overview">
      <div><Database size={18}/><span><strong>Datenbankzugriff</strong><small>Authentifiziert und benutzerbezogen</small></span></div>
      <div><Clock3 size={18}/><span><strong>Rechercheplan</strong><small>Täglich um 20:00 Uhr · noch nicht aktiviert</small></span></div>
      <div><ShieldCheck size={18}/><span><strong>Arbeitsmodus</strong><small>Nur lesende Datenbankabfragen</small></span></div>
    </section>}
    <section className="messinho-chat-card">
      <div className="messinho-chat-heading"><div><span>SCOUTING CONVERSATION</span><h2>Sprich mit Messinho</h2></div><button type="button" className="messinho-voice-toggle" onClick={()=>{setVoiceOutput(v=>!v);if(voiceOutput&&'speechSynthesis'in window)window.speechSynthesis.cancel();}} title={voiceOutput?'Sprachausgabe ausschalten':'Sprachausgabe einschalten'}>{voiceOutput?<Volume2 size={17}/>:<VolumeX size={17}/>}<span>{voiceOutput?'Sprache an':'Sprache aus'}</span></button></div>
      <div className="messinho-messages" aria-live="polite">
        {messages.map(message=><article key={message.id} className={'messinho-message '+message.role}><div className="messinho-avatar">{message.role==='assistant'?<BrainCircuit size={17}/>:<MessageCircle size={16}/>}</div><div className="messinho-bubble"><small>{message.role==='assistant'?'MESSINHO':'DU'}</small><p>{message.text}</p>{message.metrics&&<div className="messinho-metrics"><span>{message.metrics.players} Spieler im Katalog</span><span>{message.metrics.candidates} eigene Kandidaten</span></div>}{renderItems(message.items)}</div></article>)}
        {busy&&<div className="messinho-thinking"><LoaderCircle className="messinho-spin" size={17}/> Messinho verarbeitet deine Anfrage …</div>}
        <div ref={endRef}/>
      </div>
      {error&&<p className="messinho-error" role="alert">{error}</p>}
      <div className="messinho-suggestions">{suggestions.map(s=><button type="button" key={s} disabled={busy} onClick={()=>send(s)}>{s}</button>)}</div>
      <form className="messinho-composer" onSubmit={e=>{e.preventDefault();send();}}>
        <button type="button" className={'messinho-mic '+(listening?'active':'')} onClick={toggleMic} aria-label={listening?'Aufnahme beenden':'Spracheingabe starten'} title={voiceAvailable?'Spracheingabe': 'Spracherkennung in diesem Browser nicht verfügbar'}>{listening?<MicOff size={19}/>:<Mic size={19}/>}</button>
        <input value={draft} onChange={e=>setDraft(e.target.value)} placeholder={listening?'Ich höre zu …':'Schreibe oder sprich mit Messinho …'} maxLength={1200} aria-label="Nachricht an Messinho"/>
        <button type="submit" className="messinho-send" disabled={busy||!draft.trim()} aria-label="Nachricht senden"><Send size={18}/></button>
      </form>
      <p className="messinho-footnote">Sprachfunktionen hängen vom Browser ab. Mikrofonzugriff wird nur nach deiner Aktivierung angefragt.</p>
    </section>
    {!compact&&<aside className="messinho-roadmap"><strong>Ausbaustufen</strong><span><b>Jetzt:</b> Datenbankabfragen und Chatoberfläche</span><span><b>Als Nächstes:</b> eigene Rechercheplanung und rechtlich freigegebene Quellen</span><span><b>Danach:</b> tägliche Hintergrundaktualisierung und kontrollierte Modellverbesserung</span></aside>}
  </div>;
}
