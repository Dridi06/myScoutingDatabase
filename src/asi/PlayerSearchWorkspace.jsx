import React,{useCallback,useEffect,useState} from 'react';
import {Search,BrainCircuit,Save,RefreshCw,ExternalLink,ShieldCheck,AlertTriangle,Star,Users,Activity,Clock3} from 'lucide-react';
import './playerSearch.css';
import './marketValue.css';

const pct=n=>n===null||n===undefined||n===''?'Nicht bewertet':Number.isFinite(Number(n))?Math.round(Number(n)*100)+'%':'Nicht bewertet';
const list=v=>Array.isArray(v)?v:[];
export default function PlayerSearchWorkspace({supabase,profile,admin=false,onNotice=()=>{}}){
 const [query,setQuery]=useState('');
 const [filters,setFilters]=useState({position:'',yearFrom:'',yearTo:'',nationality:''});
 const [busy,setBusy]=useState(false);
 const [result,setResult]=useState(null);
 const [error,setError]=useState('');
 const [candidates,setCandidates]=useState([]);
 const [saving,setSaving]=useState(false);
 const [saved,setSaved]=useState(false);
 const [marketInputs,setMarketInputs]=useState({age:'',position:'',minutesLast12Months:'',performanceScore:'',contractYears:'',comparables:'[]'});
 const [marketValue,setMarketValue]=useState(null);
 const [marketBusy,setMarketBusy]=useState(false);
 const [marketError,setMarketError]=useState('');

 const loadCandidates=useCallback(async()=>{
  if(!supabase||!profile?.id)return;
  const {data,error}=await supabase.from('asi_player_candidates').select('id,player_name,birth_year,nationality,current_club,positions,recommendation,status,identity_confidence,researched_at,created_at').order('created_at',{ascending:false}).limit(50);
  if(error){onNotice('Kandidatenliste konnte nicht geladen werden: '+error.message);return;}
  setCandidates(data||[]);
 },[supabase,profile?.id,onNotice]);
 useEffect(()=>{loadCandidates();},[loadCandidates]);

 async function searchPlayer(e){
  e.preventDefault();if(!query.trim()||busy)return;
  setBusy(true);setError('');setResult(null);setSaved(false);
  try{
   const {data:{session}}=await supabase.auth.getSession();
   if(!session?.access_token)throw new Error('Sitzung abgelaufen. Bitte neu anmelden.');
   const response=await fetch('/api/asi/player-search',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},body:JSON.stringify({query:query.trim(),filters})});
   const payload=await response.json();
   if(!response.ok)throw new Error(payload.error||'Die Spielersuche ist fehlgeschlagen.');
   setResult(payload);
  }catch(e){setError(e.message||'Recherche fehlgeschlagen.');}
  finally{setBusy(false);}
 }


 async function calculateMarketValue(){
  if(marketBusy)return;
  setMarketBusy(true);setMarketError('');setMarketValue(null);
  try{
   const comparables=JSON.parse(marketInputs.comparables||'[]');
   if(!Array.isArray(comparables))throw new Error('Vergleichsdaten müssen ein JSON-Array sein.');
   const {data:{session}}=await supabase.auth.getSession();
   if(!session?.access_token)throw new Error('Sitzung abgelaufen. Bitte neu anmelden.');
   const response=await fetch('/api/asi/market-value/estimate',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},body:JSON.stringify({player:{age:Number(marketInputs.age),position:marketInputs.position,minutesLast12Months:Number(marketInputs.minutesLast12Months),performanceScore:Number(marketInputs.performanceScore),contractYears:marketInputs.contractYears===''?null:Number(marketInputs.contractYears)},comparables})});
   const payload=await response.json();
   if(!response.ok)throw new Error(payload.error||'Marktwertberechnung fehlgeschlagen.');
   setMarketValue(payload.valuation);
  }catch(e){setMarketError(e.message||'Marktwertberechnung fehlgeschlagen.');}
  finally{setMarketBusy(false);}
 }

 async function saveCandidate(){
  if(!result?.analysis||saving||saved)return;
  setSaving(true);
  const a=result.analysis;
  const {error}=await supabase.from('asi_player_candidates').insert({
   owner_id:profile.id,created_by:profile.id,player_name:a.player?.name||query.trim(),
   birth_year:a.player?.birth_year||null,nationality:a.player?.nationality||null,
   current_club:a.player?.current_club||null,positions:list(a.player?.positions),
   search_query:query.trim(),analysis:a,sources:list(result.sources),
   recommendation:['priority','watchlist','review','reject'].includes(a.recommendation?.level)?a.recommendation.level:'review',
   identity_confidence:Number.isFinite(Number(a.player?.identity_confidence))?Number(a.player.identity_confidence):null,
   researched_at:new Date().toISOString()
  });
  if(error)onNotice('Kandidat konnte nicht gespeichert werden: '+error.message);
  else{setSaved(true);onNotice('Spieler wurde in deiner Kandidatenliste gespeichert.');await loadCandidates();}
  setSaving(false);
 }

 async function dismissCandidate(id){
  const {error}=await supabase.from('asi_player_candidates').update({status:'dismissed',updated_at:new Date().toISOString()}).eq('id',id);
  if(error)onNotice('Kandidat konnte nicht entfernt werden: '+error.message);else await loadCandidates();
 }
 const a=result?.analysis;
 return <div className="player-search-workspace">
  <section className="ps-hero"><div className="ps-mark"><BrainCircuit size={26}/></div><div><span>ADAPTIVE SCOUTING INTELLIGENCE</span><h1>KI-Spielersuche</h1><p>Spieler finden, Quellen prüfen, analysieren und als Scouting-Kandidaten vormerken.</p></div></section>
  <section className="ps-search-card">
   <form onSubmit={searchPlayer}>
    <label className="ps-query"><Search size={19}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Spieler suchen, z. B. Lionel Messi" maxLength={180}/><button disabled={busy||!query.trim()}>{busy?<><RefreshCw className="ps-spin" size={16}/> Recherche läuft</>:<><Search size={16}/> KI-Suche starten</>}</button></label>
    <div className="ps-filters">
     <label>Position<input value={filters.position} onChange={e=>setFilters(f=>({...f,position:e.target.value}))} placeholder="z. B. Flügel"/></label>
     <label>Jahrgang von<input type="number" min="1900" max="2100" value={filters.yearFrom} onChange={e=>setFilters(f=>({...f,yearFrom:e.target.value}))}/></label>
     <label>Jahrgang bis<input type="number" min="1900" max="2100" value={filters.yearTo} onChange={e=>setFilters(f=>({...f,yearTo:e.target.value}))}/></label>
     <label>Nationalität<input value={filters.nationality} onChange={e=>setFilters(f=>({...f,nationality:e.target.value}))} placeholder="Optional"/></label>
    </div>
   </form>
   <p className="ps-privacy"><ShieldCheck size={14}/> Es werden nur die Suchangaben übertragen, nicht deine internen Scout-Notizen oder privaten Spielerdaten.</p>
  </section>
  {error&&<div className="ps-error"><AlertTriangle size={17}/>{error}</div>}
  {busy&&<section className="ps-loading"><BrainCircuit size={28}/><strong>Die KI recherchiert und gleicht Quellen ab …</strong><span>Identität · Leistungsdaten · Transfers · Vertragsmeldungen · Verletzungsberichte</span></section>}
  {a&&<section className="ps-result">
   <div className="ps-result-head"><div><span>RECHERCHEERGEBNIS</span><h2>{a.player?.name||query}</h2><p>{[a.player?.current_club,a.player?.nationality,a.player?.birth_year,a.player?.positions?.join(', ')].filter(Boolean).join(' · ')}</p></div><div className={'ps-verdict '+(a.recommendation?.level||'review')}>{a.recommendation?.label||'Prüfung erforderlich'}</div></div>
   {a.identity?.ambiguity&&<div className="ps-warning"><AlertTriangle size={17}/>{a.identity.ambiguity}</div>}
   <div className="ps-metrics">
    <article><small>Technische Qualität</small><strong>{pct(a.ratings?.technical?.score)}</strong></article>
    <article><small>Taktische Qualität</small><strong>{pct(a.ratings?.tactical?.score)}</strong></article>
    <article><small>Athletisches Profil</small><strong>{pct(a.ratings?.athletic?.score)}</strong></article>
    <article><small>Datenvertrauen</small><strong>{pct(a.data_quality?.confidence)}</strong></article>
   </div>
   <div className="ps-columns">
    <article><h3><Star size={16}/> Stärken</h3>{list(a.strengths).length?list(a.strengths).map((x,i)=><p key={i}>{x}</p>):<p>Keine belastbaren Angaben.</p>}</article>
    <article><h3><Activity size={16}/> Entwicklungsfelder</h3>{list(a.development_areas).length?list(a.development_areas).map((x,i)=><p key={i}>{x}</p>):<p>Keine belastbaren Angaben.</p>}</article>
    <article><h3><AlertTriangle size={16}/> Risiken und offene Punkte</h3>{list(a.risks).length?list(a.risks).map((x,i)=><p key={i}>{x}</p>):<p>Keine verifizierten Risiken gemeldet. Das ist kein Gesundheitsattest.</p>}</article>
    <article><h3><Users size={16}/> Scouting-Empfehlung</h3><p>{a.recommendation?.reason||'Noch keine belastbare Empfehlung.'}</p><small>{a.recommendation?.next_step||'Weitere Beobachtung erforderlich.'}</small></article>
   </div>

   <section className="ps-market-value">
    <div className="ps-section-heading"><div><span>ASI VALUATION ENGINE · BASELINE 0.1.0</span><h2>Eigene ASI-Marktwertindikation</h2></div><strong>Unabhängig von Transfermarkt</strong></div>
    <p>Die Berechnung nutzt ausschließlich deine strukturierten Leistungsdaten und verifizierte Vergleichstransaktionen. Ohne mindestens drei belegte Vergleiche gibt ASI bewusst keinen Geldwert aus.</p>
    <div className="ps-market-grid">
     <label>Alter<input type="number" min="15" max="50" value={marketInputs.age} onChange={e=>setMarketInputs(v=>({...v,age:e.target.value}))} placeholder={a.player?.birth_year?String(new Date().getFullYear()-a.player.birth_year):'Jahre'}/></label>
     <label>Position / Rolle<input value={marketInputs.position} onChange={e=>setMarketInputs(v=>({...v,position:e.target.value}))} placeholder="z. B. Flügelstürmer"/></label>
     <label>Minuten letzte 12 Monate<input type="number" min="0" value={marketInputs.minutesLast12Months} onChange={e=>setMarketInputs(v=>({...v,minutesLast12Months:e.target.value}))} placeholder="Minuten"/></label>
     <label>Leistungsindex<input type="number" min="0" max="100" value={marketInputs.performanceScore} onChange={e=>setMarketInputs(v=>({...v,performanceScore:e.target.value}))} placeholder="0–100, belegt"/></label>
     <label>Vertragsjahre verbleibend<input type="number" min="0" max="10" step=".5" value={marketInputs.contractYears} onChange={e=>setMarketInputs(v=>({...v,contractYears:e.target.value}))} placeholder="Optional"/></label>
    </div>
    <label className="ps-comparables">Verifizierte Vergleichstransaktionen (JSON)
     <textarea rows="5" value={marketInputs.comparables} onChange={e=>setMarketInputs(v=>({...v,comparables:e.target.value}))} spellCheck="false"/>
    </label>
    <small>Jeder Vergleich benötigt playerName, sourceName (muss im ASI-Quellenregister freigegeben sein), feeEur, sourceUrl, eventDate und similarity (0.5–1). Der Server prüft die Quelle auf approved_public, Zweck market_value, kommerzielle Nutzung und Speicherung. verified wird ausschließlich serverseitig gesetzt.</small>
    {marketError&&<div className="ps-error">{marketError}</div>}
    <button className="ps-market-button" onClick={calculateMarketValue} disabled={marketBusy}>{marketBusy?'Berechnung läuft …':'ASI-Marktwert berechnen'}</button>
    {marketValue&&<div className="ps-market-output">
     {marketValue.status==='estimated'?<><div className="ps-market-number">{new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(marketValue.pointEstimate)}</div><strong>{new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(marketValue.intervalLow)} – {new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(marketValue.intervalHigh)}</strong><p>Datenvertrauen: {marketValue.confidence} ({marketValue.confidenceScore} %) · Vergleiche: {marketValue.comparablesUsed} · {marketValue.modelVersion}</p><div className="ps-market-factors">{marketValue.factors.map(f=><span key={f.name}>{f.name}: {f.impactPercent>0?'+':''}{f.impactPercent}%</span>)}</div></>:<><strong>Keine belastbare Wertangabe möglich</strong><p>Es fehlen: {(marketValue.missing||[]).join(', ')}</p></>}
     <ul>{(marketValue.limitations||[]).map((item,i)=><li key={i}>{item}</li>)}</ul>
    </div>}
   </section>
   <div className="ps-source-list"><h3>Quellen und Aktualität ({list(result.sources).length})</h3>{list(result.sources).map((s,i)=><a href={s.url} target="_blank" rel="noreferrer" key={i}><span><strong>{s.title||s.publisher||s.url}</strong><small>{s.publisher||'Quelle'} · {s.published_date||'Datum nicht angegeben'} · {s.relevance||'Kontextquelle'}</small></span><ExternalLink size={15}/></a>)}</div>
   <div className="ps-actions"><button onClick={saveCandidate} disabled={saving||saved}>{saved?'In Kandidatenliste gespeichert':saving?'Speichert…':<><Save size={16}/> Als Kandidat speichern</>}</button><small>Der reguläre Spielerbestand wird dadurch nicht automatisch verändert.</small></div>
   <p className="ps-disclaimer">{a.limitations||'Die Bewertung ist eine KI-gestützte Voranalyse. Sie ersetzt keine persönliche Sichtung. Nicht belegte Angaben werden als unbekannt behandelt.'}</p>
  </section>}
  <section className="ps-candidates"><div className="ps-section-heading"><div><span>SCOUTING-PIPELINE</span><h2>Gespeicherte Kandidaten</h2></div><button onClick={loadCandidates} disabled={busy}><RefreshCw size={15}/> Aktualisieren</button></div>
   {!candidates.length?<p className="ps-empty">Noch keine Kandidaten gespeichert.</p>:<div className="ps-candidate-list">{candidates.map(c=><article key={c.id}><div><strong>{c.player_name}</strong><small>{[c.current_club,c.birth_year,c.positions?.join(', ')].filter(Boolean).join(' · ')}</small><small>{c.recommendation} · {new Date(c.researched_at).toLocaleDateString('de-DE')}</small></div><span>{c.status}</span>{c.status!=='dismissed'&&<button onClick={()=>dismissCandidate(c.id)}>Verwerfen</button>}</article>)}</div>}
  </section>
 </div>;
}
