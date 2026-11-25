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
  const [messages,setMessages]=useState([{id:'welcome',role:'assistant',text:'Hallo! Ich bin Messinho, dein Scouting-Agent. Ich kann zunächst deinen Datenbestand auswerten, gespeicherte Kandidaten anzeigen und Spieler im vorhandenen Katalog suchen. Deine verifizierten Kalibrierungsdaten helfen, die Bewertungslogik kontrolliert zu verbessern.'}]);
  const [draft,setDraft]=useState('');
  const [busy,setBusy]=useState(false);
  const [listening,setListening]=useState(false);
  const [voiceOutput,setVoiceOutput]=useState(true);
  const [voiceAvailable,setVoiceAvailable]=useState(false);
  const [error,setError]=useState('');
  const [learningPlayers,setLearningPlayers]=useState([]);
  const [selectedLearningPlayer,setSelectedLearningPlayer]=useState('');
  const [outcomeMetric,setOutcomeMetric]=useState('Leistungsniveau nach 12 Monaten');
  const [calibrationDrafts,setCalibrationDrafts]=useState({});
  const [learningData,setLearningData]=useState(null);
  const [learningBusy,setLearningBusy]=useState(false);
  const [learningError,setLearningError]=useState('');
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

  
  async function learningRequest(path,method='GET',body=null){
    const {data:{session}}=await supabase.auth.getSession();
    if(!session?.access_token)throw new Error('Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.');
    const options={method,headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token}};
    if(body!==null)options.body=JSON.stringify(body);
    const response=await fetch(path,options);
    const payload=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(payload.error||'Lernfunktion konnte nicht ausgeführt werden.');
    return payload;
  }
  async function loadLearningStatus(){
    try{
      const [status,players]=await Promise.all([
        learningRequest('/api/messinho/learning/status'),
        learningRequest('/api/messinho/learning/players')
      ]);
      setLearningData(status);setLearningPlayers(players.players||[]);setLearningError('');
    }catch(e){setLearningError(e.message||'Lernstatus nicht verfügbar.');}
  }
  async function saveCalibration(){
    if(!selectedLearningPlayer){setLearningError('Bitte zuerst einen Spieler auswählen.');return;}
    setLearningBusy(true);setLearningError('');
    try{
      const payload=await learningRequest('/api/messinho/calibration','POST',{player_id:Number(selectedLearningPlayer),outcome_metric:outcomeMetric});
      await loadLearningStatus();
      setMessages(prev=>[...prev,{id:'calibration-'+Date.now(),role:'assistant',text:payload.message||'Kalibrierung gespeichert.'}]);
    }catch(e){setLearningError(e.message||'Kalibrierung konnte nicht gespeichert werden.');}
    finally{setLearningBusy(false);}
  }
  async function evaluateLearning(){
    setLearningBusy(true);setLearningError('');
    try{const payload=await learningRequest('/api/messinho/learning/evaluate','POST');await loadLearningStatus();setMessages(prev=>[...prev,{id:'learn-'+Date.now(),role:'assistant',text:payload.message||'Die Lern-Evaluation wurde abgeschlossen.'}]);}
    catch(e){setLearningError(e.message||'Evaluation fehlgeschlagen.');}
    finally{setLearningBusy(false);}
  }
  async function approveLearningModel(id){
    setLearningBusy(true);setLearningError('');
    try{
      const {error}=await supabase.rpc('asi_review_model_candidate',{p_model_version_id:id,p_decision:'approve',p_reason:'MESSINHO-Modell anhand der gespeicherten Holdout-Evaluation geprüft und freigegeben.'});
      if(error)throw new Error(error.message||'Modellfreigabe fehlgeschlagen.');
      await loadLearningStatus();
      setMessages(prev=>[...prev,{id:'approve-'+Date.now(),role:'assistant',text:'Das Modell wurde über die bestehende ASI-Modellverwaltung freigegeben und ist jetzt aktiv.'}]);
    }catch(e){setLearningError(e.message||'Modellfreigabe fehlgeschlagen.');}
    finally{setLearningBusy(false);}
  }
  async function reviewCalibration(id,decision){
    const draft=calibrationDrafts[id]||{};
    setLearningBusy(true);setLearningError('');
    try{
      const {error}=await supabase.rpc('asi_review_scout_calibration',{
        p_record_id:id,p_decision:decision,p_reason:draft.reason||'Ergebnis anhand der dokumentierten Quelle geprüft.',
        p_verified_outcome:decision==='verify'?Number(draft.verified_outcome):null,
        p_observed_on:decision==='verify'?draft.observed_on:null,
        p_source_url:decision==='verify'?draft.source_url:null
      });
      if(error)throw new Error(error.message||'Kalibrierung konnte nicht geprüft werden.');
      await loadLearningStatus();
      setMessages(prev=>[...prev,{id:'cal-review-'+Date.now(),role:'assistant',text:decision==='verify'?'Kalibrierung wurde verifiziert und kann bei der nächsten Evaluation berücksichtigt werden.':'Kalibrierung wurde abgelehnt und wird nicht zum Lernen verwendet.'}]);
    }catch(e){setLearningError(e.message||'Kalibrierung konnte nicht geprüft werden.');}
    finally{setLearningBusy(false);}
  }
  function setCalibrationValue(id,key,value){setCalibrationDrafts(prev=>({...prev,[id]:{...(prev[id]||{}),[key]:value}}));}
  useEffect(()=>{if(profile?.role==='admin'||profile?.role==='scout')loadLearningStatus();},[profile?.role]);
  function renderItems(items){
    if(!items?.length)return null;
    return <div className="messinho-results">{items.map((item,index)=><article key={String(item.id||item.name||index)} className="messinho-result-row"><div className="messinho-result-icon"><Users size={16}/></div><div className="messinho-result-copy"><strong>{index+1}. {item.name||item.player_name||'Unbenannter Eintrag'}</strong><span>{[item.club||item.current_club||item.currentClub,item.year||item.birth_year||item.birthYear,item.positions?.join(', '),item.analysis?.fit_score!==null&&item.analysis?.fit_score!==undefined?'Fit '+item.analysis.fit_score+'/100':null,item.kind,item.analysis?.recommendation?.label||item.recommendation?.label||item.recommendation].filter(Boolean).join(' · ')}</span>{item.messinho_rating&&<small>{item.messinho_rating.score===null?'MESSINHO-Score: nicht ausreichend belegt':'MESSINHO-Score: '+item.messinho_rating.score+'/100'} · Datenabdeckung {item.messinho_rating.evidence_coverage}% · {item.messinho_rating.confidence}</small>}{item.analysis?.analysis&&<small>{item.analysis.analysis}</small>}{item.sources?.map(source=><a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.publisher||source.title||'Quelle öffnen'}</a>)}</div></article>)}</div>;
  }
  return <div className="messinho-workspace">
    {!compact&&<header className="messinho-hero"><div className="messinho-emblem"><BrainCircuit size={29}/></div><div className="messinho-hero-copy"><span>MYSCOUTINGDATABASE · KI-ASSISTENT</span><h1>Messinho</h1><p>Dein persönlicher Scouting-Agent</p></div><div className="messinho-status"><i/> Modul geladen</div></header>}
    {!compact&&<section className="messinho-overview">
      <div><Database size={18}/><span><strong>Datenbankzugriff</strong><small>Authentifiziert und benutzerbezogen</small></span></div>
      <div><Clock3 size={18}/><span><strong>Rechercheplan</strong><small>Täglich um 20:00 Uhr · noch nicht aktiviert</small></span></div>
      <div><ShieldCheck size={18}/><span><strong>Arbeitsmodus</strong><small>Nur lesende Datenbankabfragen</small></span></div>
    </section>}

    <section className="messinho-learning-panel">
      <div className="messinho-learning-summary"><strong>MESSINHO · Lern- und Kalibrierungssystem</strong><small>{learningData?.calibration_count??'–'} Kalibrierungen · {learningData?.active_model?.version?'Aktives Modell '+learningData.active_model.version:'Positions-Basisprofil aktiv'}</small><small>Nur administrativ verifizierte Ergebnisse fließen in neue Modellversionen ein.</small></div>
      <div className="messinho-calibration-entry">
        <label>Spieler auswählen<select value={selectedLearningPlayer} onChange={e=>setSelectedLearningPlayer(e.target.value)}><option value="">Spieler aus deiner Datenbank wählen</option>{learningPlayers.map(player=><option key={player.player_id} value={player.player_id}>{player.name} · {player.positions.join(', ')} · MESSINHO {player.messinho_rating}/100</option>)}</select></label>
        <label>Später überprüfbares Ergebnis<input value={outcomeMetric} onChange={e=>setOutcomeMetric(e.target.value)} maxLength={160} placeholder="z. B. Leistungsniveau nach 12 Monaten"/></label>
        <button type="button" disabled={learningBusy||!selectedLearningPlayer} onClick={saveCalibration}>{learningBusy?'Speichert …':'Kalibrierung erfassen'}</button>
      </div>
      {learningError&&<p role="alert">{learningError}</p>}
      {profile?.role==='admin'&&<div className="messinho-admin-learning">
        <div className="messinho-learning-actions"><strong>Offene Kalibrierungen: {learningData?.pending_calibrations?.length||0}</strong><button type="button" disabled={learningBusy} onClick={evaluateLearning}>{learningBusy?'Prüft …':'Verifizierte Daten evaluieren'}</button></div>
        {learningData?.pending_calibrations?.map(record=><article key={record.id} className="messinho-calibration-review">
          <b>{record.player_name} · {record.outcome_metric}</b><small>MESSINHO-Prognose {record.scout_rating}/100 · {new Date(record.created_at).toLocaleDateString('de-DE')}</small>
          <div className="messinho-review-fields">
            <label>Ergebnis 0–100<input type="number" min="0" max="100" value={calibrationDrafts[record.id]?.verified_outcome??''} onChange={e=>setCalibrationValue(record.id,'verified_outcome',e.target.value)}/></label>
            <label>Beobachtet am<input type="date" value={calibrationDrafts[record.id]?.observed_on??''} onChange={e=>setCalibrationValue(record.id,'observed_on',e.target.value)}/></label>
            <label>HTTPS-Quelle<input type="url" value={calibrationDrafts[record.id]?.source_url??''} onChange={e=>setCalibrationValue(record.id,'source_url',e.target.value)} placeholder="https://…"/></label>
            <label>Prüfgrund<input value={calibrationDrafts[record.id]?.reason??''} onChange={e=>setCalibrationValue(record.id,'reason',e.target.value)} placeholder="Beleg geprüft …"/></label>
          </div>
          <div className="messinho-review-actions"><button type="button" disabled={learningBusy} onClick={()=>reviewCalibration(record.id,'verify')}>Verifizieren</button><button type="button" className="secondary" disabled={learningBusy} onClick={()=>reviewCalibration(record.id,'reject')}>Ablehnen</button></div>
        </article>)}
        {learningData?.proposals?.map(model=><article key={model.id} className="messinho-calibration-review"><b>Modellkandidat {model.version}</b><small>{JSON.stringify(model.metrics?.report||model.metrics||{})}</small><button type="button" disabled={learningBusy} onClick={()=>approveLearningModel(model.id)}>Über ASI-Modellverwaltung freigeben</button></article>)}
      </div>}
    </section>
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
    {!compact&&<aside className="messinho-roadmap"><strong>Ausbaustufen</strong><span><b>Jetzt:</b> Datenbankabfragen und Chatoberfläche</span><span><b>Als Nächstes:</b> eigene Rechercheplanung und rechtlich freigegebene Quellen</span><span><b>Aktiv:</b> Scout-Feedback, Modell-Evaluation und Admin-Freigabe vor Aktivierung</span></aside>}
  </div>;
}
