import React,{useCallback,useEffect,useState} from 'react';
import {Search,BrainCircuit,Save,RefreshCw,ExternalLink,ShieldCheck,AlertTriangle,Star,Users,Activity,Clock3} from 'lucide-react';
import './playerSearch.css';

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
 const [discoveryFilters,setDiscoveryFilters]=useState({ageMin:'18',ageMax:'23'});
 const [discoveryBusy,setDiscoveryBusy]=useState(false);
 const [discoveryResult,setDiscoveryResult]=useState(null);

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

 async function discoverTalents(){
  if(discoveryBusy)return;
  setDiscoveryBusy(true);setError('');setDiscoveryResult(null);setResult(null);
  try{
   const {data:{session}}=await supabase.auth.getSession();
   if(!session?.access_token)throw new Error('Sitzung abgelaufen. Bitte neu anmelden.');
   const ageMin=Number(discoveryFilters.ageMin),ageMax=Number(discoveryFilters.ageMax);
   if(!Number.isInteger(ageMin)||!Number.isInteger(ageMax)||ageMin<16||ageMax>30||ageMin>ageMax)throw new Error('Bitte einen gültigen Altersbereich zwischen 16 und 30 Jahren wählen.');
   const response=await fetch('/api/asi/player-search',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},body:JSON.stringify({mode:'discover',filters:{...filters,ageMin,ageMax}})});
   const payload=await response.json();
   if(!response.ok)throw new Error(payload.error||'Die globale KI-Suche ist fehlgeschlagen.');
   setDiscoveryResult(payload);await loadCandidates();
   onNotice((payload.saved_count||0)+' neue Talente als Kandidaten gespeichert · '+(payload.duplicate_count||0)+' Dubletten übersprungen.');
  }catch(e){setError(e.message||'Globale Recherche fehlgeschlagen.');}
  finally{setDiscoveryBusy(false);}
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
   <div className="ps-discovery-panel">
    <div><span className="ps-discovery-kicker">GLOBAL TALENT DISCOVERY</span><h3>15 Nachwuchstalente weltweit finden</h3><p>Die KI durchsucht mehrere Quellen, gleicht die Belege ab und speichert neue Treffer direkt als Kandidaten – nicht in den offiziellen Spielerkatalog.</p></div>
    <div className="ps-discovery-controls">
     <label>Alter von<input type="number" min="16" max="30" value={discoveryFilters.ageMin} onChange={e=>setDiscoveryFilters(f=>({...f,ageMin:e.target.value}))}/></label>
     <label>Alter bis<input type="number" min="16" max="30" value={discoveryFilters.ageMax} onChange={e=>setDiscoveryFilters(f=>({...f,ageMax:e.target.value}))}/></label>
     <button type="button" onClick={discoverTalents} disabled={discoveryBusy||busy}>{discoveryBusy?<><RefreshCw className="ps-spin" size={16}/> 15 Talente werden gesucht…</>:<><BrainCircuit size={16}/> KI-Suche starten & Kandidaten speichern</>}</button>
    </div>
   </div>
  </section>
  {error&&<div className="ps-error"><AlertTriangle size={17}/>{error}</div>}
  {(busy||discoveryBusy)&&<section className="ps-loading"><BrainCircuit size={28}/><strong>{discoveryBusy?'Die KI sucht weltweit nach Nachwuchstalenten …':'Die KI recherchiert und gleicht Quellen ab …'}</strong><span>Identität · Leistungsdaten · Spielstil · Quellenabgleich</span></section>}
  {discoveryResult&&<section className="ps-result ps-discovery-result">
   <div className="ps-result-head"><div><span>GLOBAL DISCOVERY · {discoveryResult.provider?.search||'Tavily'} + {discoveryResult.provider?.analysis||'OpenAI'}</span><h2>{discoveryResult.candidates?.length||0} Talente gefunden</h2><p>{discoveryResult.saved_count||0} neu gespeichert · {discoveryResult.duplicate_count||0} Dubletten übersprungen · {discoveryResult.source_count||0} Quellen ausgewertet</p></div><div className="ps-verdict review">{discoveryResult.underfilled?'Auswahl unvollständig':'Kandidaten gespeichert'}</div></div>
   {discoveryResult.underfilled&&<div className="ps-warning"><AlertTriangle size={17}/> Es wurden weniger als 15 Spieler mit belastbaren Quellenbelegen gefunden. Das System ergänzt keine erfundenen Namen.</div>}
   <div className="ps-discovery-grid">{(discoveryResult.candidates||[]).map((p,i)=><article key={p.name+'-'+i} className="ps-discovery-player">
    <div className="ps-discovery-player-head"><span>{String(i+1).padStart(2,'0')}</span><div><strong>{p.name}</strong><small>{[p.birthYear,p.nationality,p.currentClub,(p.positions||[]).join(', ')].filter(Boolean).join(' · ')}</small></div><b className={p.saved?'is-saved':'is-duplicate'}>{p.saved?'GESPEICHERT':p.duplicate?'BEREITS VORHANDEN':'PRÜFEN'}</b></div>
    <p>{p.analysis?.analysis||'Noch keine ausführliche textliche Bewertung aus den Quellen.'}</p>
    <div className="ps-discovery-facts"><div><small>Stärken</small><span>{(p.analysis?.strengths||[]).join(' · ')||'Nicht ausreichend belegt'}</span></div><div><small>Entwicklungsfelder</small><span>{(p.analysis?.development_areas||[]).join(' · ')||'Weitere Sichtung erforderlich'}</span></div><div><small>Leistungsdaten</small><span>{Object.keys(p.analysis?.performance_metrics||{}).length?JSON.stringify(p.analysis.performance_metrics):'Keine belastbaren Kennzahlen übermittelt'}</span></div><div><small>Empfehlung</small><span>{p.analysis?.recommendation?.label||'Prüfung erforderlich'} · {p.analysis?.recommendation?.reason||'Quellen prüfen'}</span></div></div>
    <div className="ps-source-list"><h3>Belege ({(p.sources||[]).length})</h3>{(p.sources||[]).map((s,j)=><a href={s.url} target="_blank" rel="noreferrer" key={s.url||j}><span><strong>{s.title||s.publisher||s.url}</strong><small>{s.publisher||'Quelle'} · {s.published_date||'Datum nicht angegeben'}</small></span><ExternalLink size={14}/></a>)}</div>
   </article>)}</div>
   <p className="ps-disclaimer">Alle Spieler wurden im Kandidatenbereich gespeichert. Eine Talentbewertung wird nur aus belegten Leistungsdaten abgeleitet; die KI-Recherche ersetzt keine persönliche Sichtung. Gesundheitsdaten und Verletzungsinformationen sind nicht Teil dieser Analyse.</p>
  </section>}
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
   <div className="ps-source-list"><h3>Quellen und Aktualität ({list(result.sources).length})</h3>{list(result.sources).map((s,i)=><a href={s.url} target="_blank" rel="noreferrer" key={i}><span><strong>{s.title||s.publisher||s.url}</strong><small>{s.publisher||'Quelle'} · {s.published_date||'Datum nicht angegeben'} · {s.relevance||'Kontextquelle'}</small></span><ExternalLink size={15}/></a>)}</div>
   <div className="ps-actions"><button onClick={saveCandidate} disabled={saving||saved}>{saved?'In Kandidatenliste gespeichert':saving?'Speichert…':<><Save size={16}/> Als Kandidat speichern</>}</button><small>Der reguläre Spielerbestand wird dadurch nicht automatisch verändert.</small></div>
   <p className="ps-disclaimer">{a.limitations||'Die Bewertung ist eine KI-gestützte Voranalyse. Sie ersetzt keine persönliche Sichtung. Nicht belegte Angaben werden als unbekannt behandelt.'}</p>
  </section>}
  <section className="ps-candidates"><div className="ps-section-heading"><div><span>SCOUTING-PIPELINE</span><h2>Gespeicherte Kandidaten</h2></div><button onClick={loadCandidates} disabled={busy}><RefreshCw size={15}/> Aktualisieren</button></div>
   {!candidates.length?<p className="ps-empty">Noch keine Kandidaten gespeichert.</p>:<div className="ps-candidate-list">{candidates.map(c=><article key={c.id}><div><strong>{c.player_name}</strong><small>{[c.current_club,c.birth_year,c.positions?.join(', ')].filter(Boolean).join(' · ')}</small><small>{c.recommendation} · {new Date(c.researched_at).toLocaleDateString('de-DE')}</small></div><span>{c.status}</span>{c.status!=='dismissed'&&<button onClick={()=>dismissCandidate(c.id)}>Verwerfen</button>}</article>)}</div>}
  </section>
 </div>;
}
