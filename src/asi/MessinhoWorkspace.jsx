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
  const [calibrationDrafts,setCalibrationDrafts]=useState({});
  const [learningData,setLearningData]=useState(null);
  const [learningBusy,setLearningBusy]=useState(false);
  const [learningError,setLearningError]=useState('');
  const [fitFormation,setFitFormation]=useState('4-3-3');
  const [fitRole,setFitRole]=useState('Flügelspieler');
  const [fitAttributes,setFitAttributes]=useState([{name:'Antritt',target:'80'},{name:'Dribbling',target:'80'},{name:'Passspiel',target:'70'}]);
  const [fitResult,setFitResult]=useState(null);
  const [capabilityGroups,setCapabilityGroups]=useState([]);
  const [selectedCapabilityId,setSelectedCapabilityId]=useState('holistic_player_analysis');
  const [capabilityQuery,setCapabilityQuery]=useState('');
  const [capabilityBusy,setCapabilityBusy]=useState(false);
  const [capabilityOutput,setCapabilityOutput]=useState(null);
  const [capabilityError,setCapabilityError]=useState('');
  const [developmentData,setDevelopmentData]=useState(null);
  const [developmentError,setDevelopmentError]=useState('');
  const [developmentBusy,setDevelopmentBusy]=useState(false);
  const [hypotheses,setHypotheses]=useState(null);
  const [outcomeDrafts,setOutcomeDrafts]=useState({});
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
      const payload=await learningRequest('/api/messinho/calibration','POST',{player_id:Number(selectedLearningPlayer)});
      await loadLearningStatus();
      setMessages(prev=>[...prev,{id:'calibration-'+Date.now(),role:'assistant',text:payload.message||'Kalibrierung gespeichert.'}]);
    }catch(e){setLearningError(e.message||'Kalibrierung konnte nicht gespeichert werden.');}
    finally{setLearningBusy(false);}
  }
  function setFitAttribute(index,key,value){setFitAttributes(prev=>prev.map((item,i)=>i===index?{...item,[key]:value}:item));}
  async function evaluateTacticalFit(){
    if(!selectedLearningPlayer){setLearningError('Bitte zuerst einen Spieler auswählen.');return;}
    const requirements=Object.fromEntries(fitAttributes.filter(item=>item.name.trim()&&item.target!==''&&Number.isFinite(Number(item.target))).map(item=>[item.name.trim(),Number(item.target)]));
    if(Object.keys(requirements).length<3){setLearningError('Bitte mindestens drei Attribute mit Zielwerten eintragen.');return;}
    setLearningBusy(true);setLearningError('');setFitResult(null);
    try{
      const payload=await learningRequest('/api/messinho/tactical-fit','POST',{player_id:Number(selectedLearningPlayer),team_profile:{formation:fitFormation,role:fitRole,requirements}});
      setFitResult(payload.tactical_fit);
    }catch(e){setLearningError(e.message||'Taktischer Abgleich fehlgeschlagen.');}
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
  async function loadCapabilities(){
    try{
      const payload=await learningRequest('/api/messinho/capabilities');
      setCapabilityGroups(payload.groups||[]);
      setCapabilityError('');
    }catch(e){setCapabilityError(e.message||'MESSINHO-Funktionskatalog konnte nicht geladen werden.');}
  }
  async function executeCapability(){
    if(!selectedCapabilityId)return;
    setCapabilityBusy(true);setCapabilityError('');setCapabilityOutput(null);
    try{
      const payload=await learningRequest('/api/messinho/capabilities/'+encodeURIComponent(selectedCapabilityId)+'/execute','POST',{
        player_id:selectedLearningPlayer?Number(selectedLearningPlayer):undefined,
        input:{query:capabilityQuery.trim()}
      });
      setCapabilityOutput(payload.output||payload);
    }catch(e){setCapabilityError(e.message||'MESSINHO-Funktion konnte nicht ausgeführt werden.');}
    finally{setCapabilityBusy(false);}
  }
  async function runDevelopmentCycle(){
    if(!selectedLearningPlayer){setDevelopmentError('Bitte zuerst einen Spieler auswählen.');return;}
    setDevelopmentBusy(true);setDevelopmentError('');
    try{
      const analysis=await learningRequest('/api/messinho/development/analyze','POST',{player_id:Number(selectedLearningPlayer)});
      const prediction=await learningRequest('/api/messinho/development/predict','POST',{player_id:Number(selectedLearningPlayer)});
      const audit=await learningRequest('/api/messinho/development/audit');
      setDevelopmentData({analysis,prediction,audit});
    }catch(e){setDevelopmentError(e.message||'MESSINHO-Entwicklungszyklus fehlgeschlagen.');}
    finally{setDevelopmentBusy(false);}
  }
  async function refreshDevelopmentAudit(){
    setDevelopmentBusy(true);setDevelopmentError('');
    try{setDevelopmentData(prev=>({...prev,audit:await learningRequest('/api/messinho/development/audit')}));}
    catch(e){setDevelopmentError(e.message||'Prognosekontrolle konnte nicht geladen werden.');}
    finally{setDevelopmentBusy(false);}
  }
  function setOutcomeDraft(id,key,value){setOutcomeDrafts(prev=>({...prev,[id]:{...(prev[id]||{}),[key]:value}}));}
  async function submitPredictionOutcome(predictionId){
    const draft=outcomeDrafts[predictionId]||{};
    setDevelopmentBusy(true);setDevelopmentError('');
    try{
      await learningRequest('/api/messinho/development/outcomes','POST',{prediction_id:predictionId,observed_value:Number(draft.value),observed_on:draft.date,source_url:draft.source,notes:draft.notes||''});
      await refreshDevelopmentAudit();
    }catch(e){setDevelopmentError(e.message||'Ergebnis konnte nicht gespeichert werden.');}
    finally{setDevelopmentBusy(false);}
  }
  async function verifyPredictionOutcome(outcomeId){
    setDevelopmentBusy(true);setDevelopmentError('');
    try{
      await learningRequest('/api/messinho/development/outcomes/'+encodeURIComponent(outcomeId)+'/verify','POST',{decision:'verify',reason:'Quelle und beobachtetes Ergebnis administrativ geprüft.'});
      await refreshDevelopmentAudit();
    }catch(e){setDevelopmentError(e.message||'Ergebnis konnte nicht verifiziert werden.');}
    finally{setDevelopmentBusy(false);}
  }
  async function createDevelopmentHypotheses(){
    setDevelopmentBusy(true);setDevelopmentError('');
    try{setHypotheses(await learningRequest('/api/messinho/development/hypotheses','POST',{}));}
    catch(e){setDevelopmentError(e.message||'Hypothesen konnten nicht erzeugt werden.');}
    finally{setDevelopmentBusy(false);}
  }
  useEffect(()=>{if(profile?.role==='admin'||profile?.role==='scout'){loadLearningStatus();loadCapabilities();}},[profile?.role]);
  function renderItems(items){
    if(!items?.length)return null;
    return <div className="messinho-results">{items.map((item,index)=><article key={String(item.id||item.name||index)} className="messinho-result-row"><div className="messinho-result-icon"><Users size={16}/></div><div className="messinho-result-copy"><strong>{index+1}. {item.name||item.player_name||'Unbenannter Eintrag'}</strong><span>{[item.club||item.current_club||item.currentClub,item.year||item.birth_year||item.birthYear,item.positions?.join(', '),item.analysis?.fit_score!==null&&item.analysis?.fit_score!==undefined?'Fit '+item.analysis.fit_score+'/100':null,item.analysis?.tactical_fit?.score!==null&&item.analysis?.tactical_fit?.score!==undefined?'Taktischer Fit '+item.analysis.tactical_fit.score+'/100':null,item.kind,item.analysis?.recommendation?.label||item.recommendation?.label||item.recommendation].filter(Boolean).join(' · ')}</span>{item.messinho_rating&&<small>{item.messinho_rating.score===null?'MESSINHO-Score: nicht ausreichend belegt':'MESSINHO-Score: '+item.messinho_rating.score+'/100'} · Datenabdeckung {item.messinho_rating.evidence_coverage}% · {item.messinho_rating.confidence}</small>}{item.analysis?.analysis&&<small>{item.analysis.analysis}</small>}{item.sources?.map(source=><span key={source.url} className="messinho-source-link"><a href={source.url} target="_blank" rel="noreferrer">{source.publisher||source.title||'Quelle öffnen'}</a>{source.quality&&<small>{source.quality.freshness==='fresh'?'Aktualitätsdatum vorhanden':source.quality.freshness==='stale'?'Ältere Quelle':'Datum unbekannt'} · {source.quality.secure_transport?'HTTPS':'nicht sicher'}</small>}</span>)}</div></article>)}</div>;
  }
  return <div className="messinho-workspace">
    {!compact&&<header className="messinho-hero"><div className="messinho-emblem"><BrainCircuit size={29}/></div><div className="messinho-hero-copy"><span>MYSCOUTINGDATABASE · KI-ASSISTENT</span><h1>Messinho</h1><p>Dein persönlicher Scouting-Agent</p></div><div className="messinho-status"><i/> Modul geladen</div></header>}
    {!compact&&<section className="messinho-overview">
      <div><Database size={18}/><span><strong>Datenbankzugriff</strong><small>Authentifiziert und benutzerbezogen</small></span></div>
      <div><Clock3 size={18}/><span><strong>Rechercheplan</strong><small>Täglich um 20:00 Uhr · noch nicht aktiviert</small></span></div>
      <div><ShieldCheck size={18}/><span><strong>Arbeitsmodus</strong><small>Nur lesende Datenbankabfragen</small></span></div>
    </section>}

    <section className="messinho-learning-panel">
      <div className="messinho-learning-summary"><strong>MESSINHO · Lern- und Kalibrierungssystem</strong><small>{learningData?.calibration_count??'–'} Kalibrierungen · {learningData?.active_model?.version?(learningData.active_model.trained?'Gelerntes Modell ':'Deterministisches Basisprofil ')+learningData.active_model.version:'Positions-Basisprofil aktiv'}</small><small>Nur administrativ verifizierte Ergebnisse fließen in neue Modellversionen ein.</small></div>
      <div className="messinho-calibration-entry">
        <label>Spieler auswählen<select value={selectedLearningPlayer} onChange={e=>setSelectedLearningPlayer(e.target.value)}><option value="">Spieler aus deiner Datenbank wählen</option>{learningPlayers.map(player=><option key={player.player_id} value={player.player_id}>{player.name} · {player.positions.join(', ')} · MESSINHO {player.messinho_rating}/100</option>)}</select></label>
        <small className="messinho-metric-label">Einheitliche Messgröße: Leistungsniveau nach 12 Monaten (0–100)</small>
        <button type="button" disabled={learningBusy||!selectedLearningPlayer} onClick={saveCalibration}>{learningBusy?'Speichert …':'Kalibrierung erfassen'}</button>
      </div>
      <div className="messinho-tactical-fit">
        <div><strong>Taktischer Vereinsabgleich</strong><small>Vergleicht echte Spielerwerte mit deinem Anforderungsprofil. Fehlende Werte werden nicht geschätzt.</small></div>
        <div className="messinho-fit-context">
          <label>Spielsystem<select value={fitFormation} onChange={e=>setFitFormation(e.target.value)}><option>4-3-3</option><option>4-2-3-1</option><option>3-5-2</option><option>4-4-2</option><option>3-4-3</option></select></label>
          <label>Rolle<input value={fitRole} onChange={e=>setFitRole(e.target.value)} maxLength={60}/></label>
        </div>
        <div className="messinho-fit-attributes">{fitAttributes.map((item,index)=><div key={index}><label>Attribut<input value={item.name} onChange={e=>setFitAttribute(index,'name',e.target.value)} maxLength={50}/></label><label>Zielwert 0–100<input type="number" min="0" max="100" value={item.target} onChange={e=>setFitAttribute(index,'target',e.target.value)}/></label></div>)}</div>
        <button type="button" disabled={learningBusy||!selectedLearningPlayer} onClick={evaluateTacticalFit}>{learningBusy?'Prüft …':'Taktische Passung prüfen'}</button>
        {fitResult&&<div className="messinho-fit-result"><strong>{fitResult.score===null?'Keine belastbare Bewertung':'Taktischer Fit: '+fitResult.score+'/100'}</strong><small>{fitResult.explanation}</small><small>Datenabdeckung: {fitResult.coverage??0}% · {fitResult.matched_attributes??0}/{fitResult.required_attributes??fitAttributes.length} Attribute · {fitResult.status}</small></div>}
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
    <section className="messinho-development-panel">
      <div className="messinho-learning-summary"><strong>MESSINHO · Entwicklungszyklus</strong><small>Analyse → nachvollziehbare Bewertung → Prognose → verifiziertes Ergebnis → Modellprüfung → Verbesserungshypothese</small><small>Jede Prognose wird mit Modellversion und Datensnapshot gespeichert. Ergebnisse werden erst nach Admin-Prüfung berücksichtigt.</small></div>
      <div className="messinho-development-actions">
        <button type="button" disabled={developmentBusy||!selectedLearningPlayer} onClick={runDevelopmentCycle}>{developmentBusy?'Analysiert …':'Spieler analysieren & Prognose speichern'}</button>
        <button type="button" className="secondary" disabled={developmentBusy} onClick={refreshDevelopmentAudit}>Prognosekontrolle aktualisieren</button>
        {profile?.role==='admin'&&<button type="button" className="secondary" disabled={developmentBusy} onClick={createDevelopmentHypotheses}>Verbesserungshypothesen bilden</button>}
      </div>
      {developmentError&&<p role="alert" className="messinho-error">{developmentError}</p>}
      {developmentData?.analysis&&<div className="messinho-development-result"><strong>Nachvollziehbare Analyse · {developmentData.analysis.analysis?.player?.score??'–'}/100</strong><small>Abdeckung {developmentData.analysis.analysis?.player?.evidence_coverage??0}% · Konfidenz {developmentData.analysis.analysis?.player?.confidence||'–'} · Modell {developmentData.analysis.analysis?.model_version}</small><pre>{JSON.stringify(developmentData.analysis.analysis?.player?.weighted_dimensions||[],null,2)}</pre></div>}
      {developmentData?.prediction?.prediction&&<div className="messinho-development-result"><strong>12-Monats-Prognose gespeichert</strong><small>{developmentData.prediction.prediction.predicted_value}/100 · Intervall {developmentData.prediction.prediction.prediction_interval_low}–{developmentData.prediction.prediction.prediction_interval_high} · {developmentData.prediction.prediction.model_version}</small><small>{developmentData.prediction.warning}</small></div>}
      {developmentData?.audit&&<div className="messinho-development-result"><strong>Prognosekontrolle</strong><small>{developmentData.audit.audit?.verified_pairs||0} verifizierte Vergleiche · MAE {developmentData.audit.audit?.metrics?.mae??'–'} · Bias {developmentData.audit.audit?.metrics?.bias??'–'} · offene Ergebnisse {developmentData.audit.pending_outcomes||0}</small>
        {developmentData.audit.predictions?.slice(0,8).map(prediction=>{
          const outcome=developmentData.audit.outcomes?.find(item=>item.prediction_id===prediction.id);
          const draft=outcomeDrafts[prediction.id]||{};
          return <article key={prediction.id} className="messinho-prediction-row"><b>Prognose {prediction.predicted_value}/100 · {new Date(prediction.created_at).toLocaleDateString('de-DE')}</b><small>{prediction.model_version} · {outcome?('Ergebnis '+outcome.observed_value+'/100 · '+outcome.verification_status):'Noch kein Ergebnis hinterlegt'}</small>
            {!outcome&&<div className="messinho-outcome-fields"><input type="number" min="0" max="100" placeholder="Ergebnis 0–100" value={draft.value||''} onChange={e=>setOutcomeDraft(prediction.id,'value',e.target.value)}/><input type="date" value={draft.date||''} onChange={e=>setOutcomeDraft(prediction.id,'date',e.target.value)}/><input type="url" placeholder="HTTPS-Quelle" value={draft.source||''} onChange={e=>setOutcomeDraft(prediction.id,'source',e.target.value)}/><button type="button" disabled={developmentBusy} onClick={()=>submitPredictionOutcome(prediction.id)}>Ergebnis melden</button></div>}
          </article>;
        })}
        {profile?.role==='admin'&&developmentData.audit.outcomes?.filter(item=>item.verification_status==='pending').map(outcome=><article key={outcome.id} className="messinho-prediction-row"><b>Offene Ergebnisprüfung · {outcome.observed_value}/100</b><small>{outcome.observed_on} · <a href={outcome.verification_source_url} target="_blank" rel="noreferrer">Quelle prüfen</a></small><button type="button" disabled={developmentBusy} onClick={()=>verifyPredictionOutcome(outcome.id)}>Quelle geprüft – verifizieren</button></article>)}
      </div>}
      {hypotheses&&<div className="messinho-development-result"><strong>MESSINHO · Verbesserungshypothesen · {hypotheses.status}</strong><pre>{JSON.stringify(hypotheses.hypotheses||[],null,2)}</pre><small>Keine Hypothese verändert automatisch das aktive Modell.</small></div>}
    </section>
    <section className="messinho-capability-panel">
      <div className="messinho-learning-summary"><strong>MESSINHO · Funktionslabor</strong><small>{capabilityGroups.reduce((sum,group)=>sum+(group.functions?.length||0),0)||100} registrierte Funktionen · vier Kompetenzbereiche · eigene MESSINHO-Runtime</small><small>Wähle eine Funktion. Analyse und Bewertung verwenden den ausgewählten Datenbankspieler; Recherche benötigt einen konkreten Suchbegriff. Lernfunktionen sind Admins vorbehalten.</small></div>
      <div className="messinho-capability-controls">
        <label>Funktion<select value={selectedCapabilityId} onChange={e=>setSelectedCapabilityId(e.target.value)}>{capabilityGroups.map(group=><optgroup key={group.id} label={group.name}>{group.functions.map(fn=><option key={fn.id} value={fn.id}>{fn.name}</option>)}</optgroup>)}</select></label>
        <label>Spieler für Analyse / Bewertung<select value={selectedLearningPlayer} onChange={e=>setSelectedLearningPlayer(e.target.value)}><option value="">Spieler auswählen</option>{learningPlayers.map(player=><option key={player.player_id} value={player.player_id}>{player.name} · {player.positions.join(', ')}</option>)}</select></label>
        <label>Suchbegriff für Recherche<input value={capabilityQuery} onChange={e=>setCapabilityQuery(e.target.value)} placeholder="z. B. U21 Innenverteidiger Senegal" maxLength={400}/></label>
        <button type="button" disabled={capabilityBusy||!selectedCapabilityId} onClick={executeCapability}>{capabilityBusy?'Messinho arbeitet …':'Funktion ausführen'}</button>
      </div>
      {capabilityError&&<p role="alert" className="messinho-error">{capabilityError}</p>}
      {capabilityOutput&&<div className="messinho-capability-result"><strong>{capabilityOutput.name||capabilityOutput.capability_id} · {capabilityOutput.status}</strong><pre>{JSON.stringify(capabilityOutput.result??capabilityOutput,null,2)}</pre></div>}
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
