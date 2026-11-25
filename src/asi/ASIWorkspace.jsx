import React,{useEffect,useMemo,useState} from 'react';
import './asi.css';
import {BrainCircuit,Activity,ShieldCheck,RefreshCw,Search,Save,ThumbsUp,ThumbsDown,Info,Database,TrendingUp,Clock3} from 'lucide-react';

const SECTIONS={
  Technik:['Dribbling','Passspiel kurz','Passspiel lang','Beidfüssigkeit','Kopfballspiel','1:1 Offensiv','Ball An/Mitnahme','Erster Kontakt','Repertoire Finten','Variabler Torschuss'],
  Taktik:['1:1 Defensiv','Kreativität','Raumverhalten','Spiel ohne Ball','Anspielbereitschaft','Zweikampf','Umschaltspiel','Handlungsschnelligkeit','Antizipationsfähigkeit','Lösen vom Gegner'],
  Athletik:['Laufbild','Laufaktivität','Körperlichkeit','Antrittsschnelligkeit','Schnelligkeit Distanz','Bewegungsgeschicklichkeit'],
  Mentalität:['Einstellung','Führungsspieler','Kommunikation','Risikofreude','Positive Körpersprache','Teamplayer','Spieleinfluss','Disziplin/Konzentration']
};
const MODEL_VERSION='player_snapshot_baseline@0.1.0';
const safeNumber=v=>{if(v===null||v===undefined||String(v).trim()==='')return null;const n=Number(v);return Number.isInteger(n)&&n>=1&&n<=5?n:null;};
const containsPrivateContact=value=>/(?:[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})|(?:\+?\d[\d\s()./-]{7,}\d)/i.test(String(value||''));
const normalizeRatings=ratings=>Object.fromEntries(Object.values(SECTIONS).flat().map(key=>[key,safeNumber(ratings?.[key])]).filter(([,value])=>value!==null));
function compareObservations(rows){
 const ordered=[...(rows||[])].sort((a,b)=>String(a.observed_on).localeCompare(String(b.observed_on))||String(a.created_at).localeCompare(String(b.created_at)));
 if(ordered.length<2)return null;
 const previous=ordered[ordered.length-2],latest=ordered[ordered.length-1];
 const changes=Object.entries(SECTIONS).map(([section,criteria])=>{
  const items=criteria.map(label=>({label,from:safeNumber(previous.ratings?.[label]),to:safeNumber(latest.ratings?.[label])})).filter(x=>x.from!==null&&x.to!==null).map(x=>({...x,delta:x.to-x.from}));
  const average=items.length?Number((items.reduce((sum,x)=>sum+x.delta,0)/items.length).toFixed(2)):null;
  return {section,items,average};
 });
 const comparable=changes.flatMap(x=>x.items);
 if(!comparable.length)return {previous,latest,changes,comparable:0,average:null,improved:0,declined:0,unchanged:0};
 return {previous,latest,changes,comparable:comparable.length,average:Number((comparable.reduce((sum,x)=>sum+x.delta,0)/comparable.length).toFixed(2)),improved:comparable.filter(x=>x.delta>0).length,declined:comparable.filter(x=>x.delta<0).length,unchanged:comparable.filter(x=>x.delta===0).length};
}
function buildSnapshot(player){
 const ratings=player.ratings&&typeof player.ratings==='object'?player.ratings:{};
 const sections=Object.entries(SECTIONS).map(([name,criteria])=>{
   const entries=criteria.map(label=>({label,value:safeNumber(ratings[label])})).filter(x=>x.value!==null);
   const average=entries.length?Number((entries.reduce((s,x)=>s+x.value,0)/entries.length).toFixed(2)):null;
   return {name,average,count:entries.length,entries};
 });
 const all=sections.flatMap(s=>s.entries);
 const strongest=all.filter(x=>x.value>=4).sort((a,b)=>b.value-a.value).slice(0,5);
 const development=all.filter(x=>x.value<=2).sort((a,b)=>a.value-b.value).slice(0,5);
 const missing=Object.values(SECTIONS).flat().filter(label=>safeNumber(ratings[label])===null);
 const coverage=all.length?Math.round(all.length/Object.values(SECTIONS).flat().length*100):0;
 return {
   title:'Spieler-Snapshot',
   mode:'descriptive_baseline',
   model_version:MODEL_VERSION,
   generated_at:new Date().toISOString(),
   player:{player_id:player.player_id,name:player.name,club:player.club,year:player.year,positions:player.positions||[],foot:player.foot||null},
   sections,strongest,development,coverage,missing_count:missing.length,
   limitations:['Dies ist eine transparente, regelbasierte Bestandsanalyse – kein trainiertes Prognosemodell.','Es wird keine zukünftige Leistung oder ein Marktwert vorhergesagt.','Die Aussagekraft hängt von Vollständigkeit, Aktualität und Vergleichbarkeit der Scoutbewertungen ab.','Private Kontaktdaten werden nicht geladen oder ausgewertet.']
 };
}
export default function ASIWorkspace({supabase,profile,players=[],admin=false,onNotice=()=>{},initialPlayerId=null}){
 const [selectedId,setSelectedId]=useState(initialPlayerId?String(initialPlayerId):'');
 const [analysis,setAnalysis]=useState(null);
 const [history,setHistory]=useState([]);
 const [observations,setObservations]=useState([]);
 const [feedback,setFeedback]=useState('');
 const [feedbackComment,setFeedbackComment]=useState('');
 const [observation,setObservation]=useState('');
 const [observationDate,setObservationDate]=useState(new Date().toISOString().slice(0,10));
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(false);
 const [models,setModels]=useState([]);
 const [externalSources,setExternalSources]=useState([]);
 const [quality,setQuality]=useState({loading:false,observations:0,playersObserved:0,longitudinalPlayers:0,predictions:0,outcomes:0,matchedOutcomes:0,mae:null,evaluations:0,passedEvaluations:0,trainingRuns:0,completeRatings:0});
 const [error,setError]=useState('');
 const [search,setSearch]=useState('');
 const selected=players.find(p=>String(p.player_id)===String(selectedId));
 const evolution=useMemo(()=>compareObservations(observations),[observations]);
 const visiblePlayers=useMemo(()=>players.filter(p=>(p.name+' '+(p.club||'')+' '+(p.positions||[]).join(' ')).toLowerCase().includes(search.toLowerCase())),[players,search]);
 const ratedCount=useMemo(()=>players.filter(p=>p.ratings&&Object.values(p.ratings).some(v=>safeNumber(v)!==null)).length,[players]);
 async function loadMeta(){
   if(!supabase)return;
   setQuality(q=>({...q,loading:true}));
   const [m,s,obs,preds,outcomes,evaluations,runs]=await Promise.all([
     supabase.from('asi_model_versions').select('id,model_key,version,model_family,status,metrics,created_at').order('created_at',{ascending:false}).limit(12),
     admin?supabase.from('asi_external_sources').select('id,source_name,provider,source_type,license_status,last_synced_at').order('created_at',{ascending:false}):Promise.resolve({data:[],error:null}),
     admin?supabase.from('asi_player_observations').select('player_id,observed_on,ratings'):Promise.resolve({data:[],error:null}),
     admin?supabase.from('asi_prediction_records').select('id,target_metric,predicted_value'):Promise.resolve({data:[],error:null}),
     admin?supabase.from('asi_prediction_outcomes').select('prediction_id,observed_metric,observed_value'):Promise.resolve({data:[],error:null}),
     admin?supabase.from('asi_model_evaluations').select('id,passed'):Promise.resolve({data:[],error:null}),
     admin?supabase.from('asi_training_runs').select('id,status'):Promise.resolve({data:[],error:null})
   ]);
   if(!m.error)setModels(m.data||[]);
   if(!s.error)setExternalSources(s.data||[]);
   if(admin){
     const observationRows=obs.error?[]:(obs.data||[]);
     const predictionRows=preds.error?[]:(preds.data||[]);
     const outcomeRows=outcomes.error?[]:(outcomes.data||[]);
     const matched=outcomeRows.map(o=>({outcome:o,prediction:predictionRows.find(p=>p.id===o.prediction_id)})).filter(x=>x.prediction&&x.prediction.target_metric===x.outcome.observed_metric&&x.prediction.predicted_value!==null&&x.prediction.predicted_value!==undefined&&x.outcome.observed_value!==null&&x.outcome.observed_value!==undefined&&Number.isFinite(Number(x.prediction.predicted_value))&&Number.isFinite(Number(x.outcome.observed_value)));
     const mae=matched.length?matched.reduce((sum,x)=>sum+Math.abs(Number(x.prediction.predicted_value)-Number(x.outcome.observed_value)),0)/matched.length:null;
     const byPlayer=new Map();
     observationRows.forEach(o=>{const dates=byPlayer.get(o.player_id)||[];dates.push(new Date(o.observed_on+'T00:00:00Z').getTime());byPlayer.set(o.player_id,dates);});
     const longitudinal=[...byPlayer.values()].filter(ds=>ds.length>=2&&Math.max(...ds)-Math.min(...ds)>=30*86400000).length;
     const completeRatings=observationRows.filter(o=>Object.values(SECTIONS).flat().every(k=>safeNumber((o.ratings||{})[k])!==null)).length;
     setQuality({loading:false,observations:observationRows.length,playersObserved:byPlayer.size,longitudinalPlayers:longitudinal,predictions:predictionRows.length,outcomes:outcomeRows.length,matchedOutcomes:matched.length,mae,evaluations:evaluations.error?0:(evaluations.data||[]).length,passedEvaluations:evaluations.error?0:(evaluations.data||[]).filter(x=>x.passed===true).length,trainingRuns:runs.error?0:(runs.data||[]).length,completeRatings});
   }else setQuality(q=>({...q,loading:false}));
 }
 async function loadObservations(playerId){
   if(!supabase||!playerId)return;
   const {data,error:loadError}=await supabase.from('asi_player_observations').select('id,player_id,observed_on,ratings,observation,source_type,created_at,created_by').eq('player_id',Number(playerId)).order('observed_on',{ascending:false}).order('created_at',{ascending:false}).limit(20);
   if(loadError){setError('ASI-Beobachtungen konnten nicht geladen werden.');setObservations([]);}
   else setObservations(data||[]);
 }
 async function loadHistory(playerId){
   if(!supabase||!playerId)return;
   setLoading(true);setError('');
   const {data,error:loadError}=await supabase.from('asi_player_analyses').select('id,player_id,analysis_type,model_version,analysis_json,created_at,created_by').eq('player_id',Number(playerId)).order('created_at',{ascending:false}).limit(8);
   if(loadError){setError('ASI-Analysen konnten nicht geladen werden. Bitte prüfe, ob die Staging-Migration bereits aktiv ist.');setHistory([]);}
   else setHistory(data||[]);
   setLoading(false);
 }
 useEffect(()=>{loadMeta();},[supabase,admin]);
 useEffect(()=>{if(initialPlayerId)setSelectedId(String(initialPlayerId));},[initialPlayerId]);
 useEffect(()=>{setAnalysis(null);setFeedback('');setFeedbackComment('');setError('');setHistory([]);setObservations([]);if(selectedId){loadHistory(selectedId);loadObservations(selectedId);}},[selectedId]);
 async function runAnalysis(){
   if(!selected||!supabase)return;
   setBusy(true);setError('');setFeedback('');
   try{
     const snapshot=buildSnapshot(selected);
     if(snapshot.coverage===0)throw new Error('Keine gültigen Bewertungen vorhanden. Bitte zuerst mindestens ein Kriterium mit einem ganzzahligen Wert von 1 bis 5 erfassen.');
     const {data,error:saveError}=await supabase.from('asi_player_analyses').insert({
       player_id:selected.player_id,owner_id:selected.owner_id,created_by:profile.id,
       analysis_type:'player_snapshot',model_version:MODEL_VERSION,analysis_json:snapshot,
       input_snapshot:{ratings:normalizeRatings(selected.ratings||{}),rating_scale:'1-5_integer_v1',positions:selected.positions||[],foot:selected.foot||null,year:selected.year||null,observed_on:selected.observed_on||null}
     }).select('id,player_id,analysis_type,model_version,analysis_json,created_at,created_by').single();
     if(saveError)throw saveError;
     setAnalysis(saveError?null: data);
     setHistory(prev=>[data,...prev].slice(0,8));
     onNotice('ASI-Spieler-Snapshot wurde erstellt und gespeichert.');
   }catch(e){setError(e.message||'Analyse konnte nicht gespeichert werden.');}
   finally{setBusy(false);}
 }
 async function saveObservation(e){
   e.preventDefault();if(!selected||!supabase)return;
   if(containsPrivateContact(observation)){setError('Bitte keine E-Mail-Adressen oder Telefonnummern in Beobachtungsnotizen speichern.');return;}
   if(!observationDate||Number.isNaN(Date.parse(observationDate))||observationDate>new Date().toISOString().slice(0,10)){setError('Bitte ein gültiges Beobachtungsdatum bis einschließlich heute auswählen.');return;}
   setBusy(true);setError('');
   try{
     const {error:saveError}=await supabase.from('asi_player_observations').insert({
       player_id:selected.player_id,owner_id:selected.owner_id,created_by:profile.id,
       observed_on:observationDate,ratings:normalizeRatings(selected.ratings||{}),observation:observation.trim()||null,source_type:'internal_scout'
     });
     if(saveError)throw saveError;
     setObservation('');await loadObservations(selectedId);onNotice('Beobachtung wurde in der ASI-Zeitleiste gespeichert.');
   }catch(e){setError(e.message||'Beobachtung konnte nicht gespeichert werden.');}
   finally{setBusy(false);}
 }
 async function sendFeedback(type){
   if(!analysis||!selected)return;
   if(containsPrivateContact(feedbackComment)){setError('Bitte keine E-Mail-Adressen oder Telefonnummern im Feedback speichern.');return;}
   setBusy(true);setError('');
   try{
     const {error:saveError}=await supabase.from('asi_scout_feedback').insert({
       analysis_id:analysis.id,player_id:selected.player_id,owner_id:selected.owner_id,created_by:profile.id,
       feedback_type:type,comment:feedbackComment.trim()||null
     });
     if(saveError)throw saveError;
     setFeedback(type);setFeedbackComment('');onNotice('Dein Feedback wurde für die spätere Qualitätsbewertung gespeichert.');
   }catch(e){setError(e.message||'Feedback konnte nicht gespeichert werden.');}
   finally{setBusy(false);}
 }
 function openHistory(item){setAnalysis(item);}
 return <section className="asi-workspace">
   <div className="asi-hero">
     <div className="asi-hero-mark"><BrainCircuit size={28}/></div>
     <div><span className="asi-eyebrow">ADAPTIVE SCOUTING INTELLIGENCE</span><h1>Scouting Intelligence</h1><p>Analysen, Beobachtungen und Modellqualität – transparent und nachvollziehbar.</p></div>
     <button type="button" className="asi-refresh" onClick={()=>{loadMeta();if(selectedId){loadHistory(selectedId);loadObservations(selectedId);}}} title="Aktualisieren"><RefreshCw size={17}/></button>
   </div>
   <div className="asi-stat-grid">
     <article><span>Spielerprofile</span><strong>{players.length}</strong><small>Im aktuellen Zugriff</small></article>
     <article><span>Mit Bewertungen</span><strong>{ratedCount}</strong><small>Mindestens ein gültiger Wert von 1–5</small></article>
     <article><span>Modellstatus</span><strong>{models.filter(m=>m.status==='active').length}</strong><small>Aktive Modellversionen</small></article>
     <article><span>Externe Quellen</span><strong>{externalSources.filter(s=>s.license_status==='approved').length}</strong><small>Freigegebene Quellen{!admin?' · Admin-Ansicht':''}</small></article>
   </div>
   <div className="asi-notice"><Info size={18}/><div><strong>Transparenter Startmodus</strong><p>Aktuell verfügbar ist eine regelbasierte Spieler-Bestandsanalyse. Echte Entwicklungsprognosen werden erst aktiviert, wenn ausreichend zeitlich dokumentierte Beobachtungen und spätere Ergebnisse vorliegen und ein Modell unabhängige Tests bestanden hat.</p></div></div>
   {error&&<div className="asi-error" role="alert">{error}</div>}
   <div className="asi-grid">
     <section className="asi-panel">
       <div className="asi-panel-heading"><div><span className="asi-eyebrow">PLAYER INTELLIGENCE</span><h2>Spieler auswählen</h2></div><Database size={20}/></div>
       <label className="asi-search"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Name, Verein oder Position suchen"/></label>
       <div className="asi-player-list">{visiblePlayers.map(p=><button type="button" key={p.player_id} className={String(p.player_id)===String(selectedId)?'selected':''} onClick={()=>setSelectedId(String(p.player_id))}><span><strong>{p.name}</strong><small>{p.club||'Verein nicht hinterlegt'} · {(p.positions||[]).join(', ')||'Position offen'}</small></span><span className="asi-player-arrow">›</span></button>)}{visiblePlayers.length===0&&<p className="asi-empty">Keine Spieler im aktuellen Zugriff gefunden.</p>}</div>
       {selected&&<div className="asi-selected-player"><div><strong>{selected.name}</strong><small>Jahrgang {selected.year||'–'} · {selected.foot||'Fuß offen'}</small></div><button type="button" onClick={runAnalysis} disabled={busy||!selected.ratings||!Object.values(selected.ratings).some(v=>safeNumber(v)!==null)}>{busy?'Wird analysiert…':'Snapshot erstellen'}</button></div>}
     </section>
     <section className="asi-panel asi-analysis-panel">
       <div className="asi-panel-heading"><div><span className="asi-eyebrow">PLAYER INTELLIGENCE</span><h2>Analyseergebnis</h2></div><Activity size={20}/></div>
       {!selected?<p className="asi-empty">Wähle links einen Spieler aus, um seine Daten zu analysieren.</p>:!analysis?<div className="asi-empty-state"><BrainCircuit size={34}/><strong>Noch keine Analyse geöffnet</strong><p>Erstelle einen Snapshot, um die vorhandenen Bewertungen transparent auszuwerten.</p></div>:<div className="asi-result">
         <div className="asi-result-top"><div><strong>{analysis.analysis_json?.player?.name||selected.name}</strong><small>{analysis.model_version} · {new Date(analysis.created_at).toLocaleString('de-DE')}</small></div><span className="asi-status">Bestandsanalyse</span></div>
         <div className="asi-coverage"><div><span>Datenabdeckung</span><strong>{analysis.analysis_json?.coverage??0}%</strong></div><div className="asi-progress"><span style={{width:(analysis.analysis_json?.coverage??0)+'%'}}/></div></div>
         <div className="asi-section-scores">{(analysis.analysis_json?.sections||[]).map(s=><article key={s.name}><span>{s.name}</span><strong>{s.average===null?'–':s.average.toFixed(2)}</strong><small>{s.count} Kriterien</small></article>)}</div>
         <div className="asi-findings"><div><strong>Erfasste Stärken</strong>{analysis.analysis_json?.strongest?.length?analysis.analysis_json.strongest.map(x=><span key={x.label}>{x.label} · {x.value}</span>):<small>Keine belastbaren Stärken aus den vorhandenen Werten ableitbar.</small>}</div><div><strong>Entwicklungsfelder</strong>{analysis.analysis_json?.development?.length?analysis.analysis_json.development.map(x=><span key={x.label}>{x.label} · {x.value}</span>):<small>Keine niedrig bewerteten Kriterien vorhanden.</small>}</div></div>
         <ul className="asi-limitations">{(analysis.analysis_json?.limitations||[]).map(x=><li key={x}>{x}</li>)}</ul>
         <div className="asi-feedback"><strong>War diese Auswertung hilfreich und sachlich richtig?</strong><div className="asi-feedback-actions"><button type="button" className={feedback==='correct'?'active':''} onClick={()=>sendFeedback('correct')} disabled={busy}><ThumbsUp size={15}/> Zutreffend</button><button type="button" className={feedback==='partially_correct'?'active':''} onClick={()=>sendFeedback('partially_correct')} disabled={busy}><Activity size={15}/> Teilweise</button><button type="button" className={feedback==='incorrect'?'active':''} onClick={()=>sendFeedback('incorrect')} disabled={busy}><ThumbsDown size={15}/> Nicht zutreffend</button></div><textarea value={feedbackComment} onChange={e=>setFeedbackComment(e.target.value)} maxLength={2000} placeholder="Optional: Was fehlt oder ist falsch?"/>{feedback&&<small>Feedback gespeichert: {feedback}</small>}</div>
       </div>}
     </section>
   </div>
   {selected&&<section className="asi-panel asi-observation-panel">
     <div className="asi-panel-heading"><div><span className="asi-eyebrow">TALENT EVOLUTION</span><h2>Neue Beobachtung dokumentieren</h2></div><Clock3 size={20}/></div>
     <form onSubmit={saveObservation} className="asi-observation-form"><label>Beobachtungsdatum<input type="date" value={observationDate} onChange={e=>setObservationDate(e.target.value)} required/></label><label>Beobachtungsnotiz<textarea value={observation} onChange={e=>setObservation(e.target.value)} maxLength={5000} placeholder="Beobachtbare Spielsituationen, Kontext, Gegnerniveau und konkrete Beispiele – keine privaten Kontaktdaten."/></label><button type="submit" disabled={busy}><Save size={15}/> Beobachtung speichern</button></form>
     <p className="asi-footnote">Die aktuelle Spielerbewertung wird als Snapshot mitgespeichert. Künftige Bewertungen können so zeitlich miteinander verglichen werden.</p>
   </section>}
   {selected&&<section className="asi-panel asi-history-panel"><div className="asi-panel-heading"><div><span className="asi-eyebrow">TALENT EVOLUTION</span><h2>Beobachtungsverlauf</h2></div><Clock3 size={20}/></div>{observations.length===0?<p className="asi-empty">Noch keine Beobachtungen gespeichert. Neue Einträge erscheinen hier chronologisch.</p>:<div className="asi-history-list">{observations.map(o=><article className="asi-observation-entry" key={o.id}><div className="asi-result-top"><strong>{new Date(o.observed_on+'T12:00:00').toLocaleDateString('de-DE')}</strong><small>{o.source_type==='internal_scout'?'Interner Scout':'Quelle: '+o.source_type}</small></div>{o.observation&&<p>{o.observation}</p>}<small>{Object.keys(o.ratings||{}).length} Bewertungsfelder im Snapshot · erfasst {new Date(o.created_at).toLocaleString('de-DE')}</small></article>)}</div>}</section>}
   {selected&&<section className="asi-panel asi-evolution-panel"><div className="asi-panel-heading"><div><span className="asi-eyebrow">TALENT EVOLUTION</span><h2>Entwicklung zwischen Beobachtungen</h2></div><TrendingUp size={20}/></div>{!evolution?<p className="asi-empty">Für einen Vergleich werden mindestens zwei gespeicherte Beobachtungen benötigt.</p>:evolution.comparable===0?<p className="asi-empty">Zwischen den letzten beiden Beobachtungen gibt es keine gemeinsamen gültigen Bewertungskriterien. Ein Vergleich wäre daher nicht belastbar.</p>:<><div className="asi-evolution-meta"><span>Vorher: <strong>{new Date(evolution.previous.observed_on+'T12:00:00').toLocaleDateString('de-DE')}</strong></span><span>Zuletzt: <strong>{new Date(evolution.latest.observed_on+'T12:00:00').toLocaleDateString('de-DE')}</strong></span><span>Verglichene Kriterien: <strong>{evolution.comparable}</strong></span></div><div className="asi-evolution-summary"><article><small>Mittlere Veränderung</small><strong>{evolution.average>0?'+':''}{evolution.average.toFixed(2)}</strong><small>Skalenpunkte · 1 bis 5</small></article><article><small>Verbessert</small><strong>{evolution.improved}</strong><small>Kriterien mit höherem Wert</small></article><article><small>Unverändert</small><strong>{evolution.unchanged}</strong><small>Gleicher Wert</small></article><article><small>Niedriger</small><strong>{evolution.declined}</strong><small>Kriterien mit niedrigerem Wert</small></article></div><div className="asi-evolution-sections">{evolution.changes.filter(s=>s.items.length).map(s=><article key={s.section}><div><strong>{s.section}</strong><span>Ø {s.average>0?'+':''}{s.average.toFixed(2)}</span></div><div className="asi-evolution-criteria">{s.items.map(x=><span key={x.label}>{x.label}<strong className={x.delta>0?'positive':x.delta<0?'negative':'neutral'}>{x.delta>0?'+':''}{x.delta}</strong></span>)}</div></article>)}</div><p className="asi-footnote">Verglichen werden ausschließlich Kriterien, die in beiden letzten Beobachtungen gültige ganzzahlige Werte von 1–5 besitzen. Das ist eine deskriptive Veränderung und kein Beleg für Ursache, Prognose oder objektive Leistungsentwicklung.</p></>}</section>}
   {selected&&<section className="asi-panel asi-history-panel"><div className="asi-panel-heading"><div><span className="asi-eyebrow">MODEL HISTORY</span><h2>Frühere Analysen</h2></div><TrendingUp size={20}/></div>{loading?<p className="asi-empty">Analysen werden geladen…</p>:history.length===0?<p className="asi-empty">Für diesen Spieler gibt es noch keine gespeicherten ASI-Analysen.</p>:<div className="asi-history-list">{history.map(h=><button type="button" key={h.id} className={analysis?.id===h.id?'selected':''} onClick={()=>openHistory(h)}><span><strong>{h.analysis_type}</strong><small>{new Date(h.created_at).toLocaleString('de-DE')}</small></span><span>{h.model_version}</span></button>)}</div>}</section>}
   {admin&&<section className="asi-panel asi-quality-panel">
     <div className="asi-panel-heading"><div><span className="asi-eyebrow">META INTELLIGENCE · QUALITY GATE</span><h2>Daten- und Modellqualität</h2></div><ShieldCheck size={20}/></div>
     <p className="asi-quality-intro">Admin-Übersicht auf Basis der tatsächlich gespeicherten ASI-Datensätze. Interne Mindestschwellen sind konservative Prüfkriterien, keine statistische oder regulatorische Zertifizierung.</p>
     <div className="asi-quality-grid">
       <article><span>Beobachtungen</span><strong>{quality.observations}</strong><small>{quality.playersObserved} Spieler mit mindestens einer Beobachtung</small></article>
       <article><span>Zeitlich vergleichbar</span><strong>{quality.longitudinalPlayers}</strong><small>Spieler mit mindestens 2 Beobachtungen über mindestens 30 Tage</small></article>
       <article><span>Vollständige Ratings</span><strong>{quality.completeRatings}</strong><small>Beobachtungen mit allen {Object.values(SECTIONS).flat().length} Kriterien</small></article>
       <article><span>Prognose-Ergebnisse</span><strong>{quality.matchedOutcomes}</strong><small>Passende Prognose-/Ergebnispaare von {quality.outcomes} Ergebnissen</small></article>
       <article><span>Mittlerer absoluter Fehler</span><strong>{quality.mae===null?"–":quality.mae.toFixed(2)}</strong><small>{quality.mae===null?"Noch nicht berechenbar":"MAE · nur gleiche Metriken, "+quality.matchedOutcomes+" Paare"}</small></article>
       <article><span>Modell-Evaluationen</span><strong>{quality.passedEvaluations}/{quality.evaluations}</strong><small>Bestandene dokumentierte Prüfungen</small></article>
     </div>
     <div className="asi-quality-gates">
       <div><strong>Trainingsdatenbasis</strong><span className={quality.matchedOutcomes>=30&&quality.playersObserved>=10?"ready":"blocked"}>{quality.matchedOutcomes>=30&&quality.playersObserved>=10?"Mindestschwelle erreicht":"Gesperrt · benötigt ≥30 Ergebnispaare und ≥10 Spieler"}</span></div>
       <div><strong>Zeitliche Vergleichbarkeit</strong><span className={quality.longitudinalPlayers>=5?"ready":"blocked"}>{quality.longitudinalPlayers>=5?"Mindestschwelle erreicht":"Gesperrt · benötigt ≥5 Spieler mit ≥2 Beobachtungen über ≥30 Tage"}</span></div>
       <div><strong>Modellfreigabe</strong><span className={quality.passedEvaluations>0&&quality.matchedOutcomes>=30?"ready":"blocked"}>{quality.passedEvaluations>0&&quality.matchedOutcomes>=30?"Evaluation vorhanden – Admin-Prüfung erforderlich":"Gesperrt · bestandene unabhängige Evaluation und ausreichende Ergebnisbasis fehlen"}</span></div>
     </div>
     <p className="asi-footnote">Der MAE wird nur aus Prognosen und später erfassten Ergebnissen derselben Metrik berechnet. Ohne passende Paare bleibt er leer. Kleine Stichproben werden nicht als Leistungsnachweis gewertet. Trainingsläufe bisher: {quality.trainingRuns}. {quality.loading?"Daten werden aktualisiert.":""}</p>
   </section>}
   {admin&&<section className="asi-admin-grid"><section className="asi-panel"><div className="asi-panel-heading"><div><span className="asi-eyebrow">META INTELLIGENCE</span><h2>Modellregister</h2></div><ShieldCheck size={20}/></div>{models.length===0?<p className="asi-empty">Noch keine Modellversionen registriert.</p>:models.map(m=><div className="asi-model-row" key={m.id}><span><strong>{m.model_key} · {m.version}</strong><small>{m.model_family}</small></span><span className={'asi-model-status '+m.status}>{m.status}</span></div>)}</section><section className="asi-panel"><div className="asi-panel-heading"><div><span className="asi-eyebrow">HYBRID DATA</span><h2>Externe Datenquellen</h2></div><Database size={20}/></div>{externalSources.length===0?<p className="asi-empty">Noch keine Datenquelle registriert. Externe Quellen werden erst nach Lizenz- und Datenschutzprüfung freigeschaltet.</p>:externalSources.map(s=><div className="asi-model-row" key={s.id}><span><strong>{s.source_name}</strong><small>{s.provider||s.source_type}</small></span><span className={'asi-model-status '+s.license_status}>{s.license_status}</span></div>)}</section></section>}
 </section>;
}
