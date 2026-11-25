import React,{useEffect,useMemo,useRef,useState} from 'react';
import './asi.css';
import {BrainCircuit,Activity,ShieldCheck,RefreshCw,Search,Save,ThumbsUp,ThumbsDown,Info,Database,TrendingUp,Clock3} from 'lucide-react';
import { reflectOnAssessment } from './selfReflection.js';
import ContractIntelligencePanel from './ContractIntelligencePanel.jsx';
import FunctionGuide from './FunctionGuide.jsx';

const SECTIONS={
  Technik:['Dribbling','Passspiel kurz','Passspiel lang','Beidfüssigkeit','Kopfballspiel','1:1 Offensiv','Ball An/Mitnahme','Erster Kontakt','Repertoire Finten','Variabler Torschuss'],
  Taktik:['1:1 Defensiv','Kreativität','Raumverhalten','Spiel ohne Ball','Anspielbereitschaft','Zweikampf','Umschaltspiel','Handlungsschnelligkeit','Antizipationsfähigkeit','Lösen vom Gegner'],
  Athletik:['Laufbild','Laufaktivität','Körperlichkeit','Antrittsschnelligkeit','Schnelligkeit Distanz','Bewegungsgeschicklichkeit'],
  Mentalität:['Einstellung','Führungsspieler','Kommunikation','Risikofreude','Positive Körpersprache','Teamplayer','Spieleinfluss','Disziplin/Konzentration'],
  Torwart:['Reflexe','Fangsicherheit','Strafraumbeherrschung','Eins-gegen-eins Torwart','Stellungsspiel Torwart','Antizipation Torwart','Flankenbeherrschung','Reboundkontrolle','Spieleröffnung kurz','Spieleröffnung lang','Abwurf und Abstoß','Kommunikation Torwart']
};
const MODEL_VERSION='player_snapshot_baseline@0.1.0';

const ROLE_PROFILES={
 'Innenverteidiger · Aufbauspieler':{group:'Abwehr',criteria:{'Passspiel kurz':2,'Passspiel lang':2,'Erster Kontakt':1.5,'Ball An/Mitnahme':1.5,'Antizipationsfähigkeit':2,'1:1 Defensiv':2,'Kopfballspiel':1,'Raumverhalten':2,'Handlungsschnelligkeit':1.5,'Kommunikation':1}},
 'Innenverteidiger · Zweikampfspieler':{group:'Abwehr',criteria:{'1:1 Defensiv':2,'Zweikampf':2,'Kopfballspiel':2,'Antizipationsfähigkeit':2,'Körperlichkeit':1.5,'Raumverhalten':1.5,'Disziplin/Konzentration':1,'Kommunikation':1}},
 'Außenverteidiger · Klassisch':{group:'Abwehr',criteria:{'Laufaktivität':2,'Schnelligkeit Distanz':1.5,'Antrittsschnelligkeit':1.5,'1:1 Defensiv':2,'Passspiel kurz':1.5,'Spiel ohne Ball':1.5,'Bewegungsgeschicklichkeit':1}},
 'Außenverteidiger · Invers':{group:'Abwehr',criteria:{'Erster Kontakt':2,'Passspiel kurz':2,'Kreativität':1.5,'Raumverhalten':2,'Handlungsschnelligkeit':1.5,'Dribbling':1.5,'Anspielbereitschaft':1.5,'Umschaltspiel':1}},
 'Defensives Mittelfeld · Sechser':{group:'Mittelfeld',criteria:{'Antizipationsfähigkeit':2,'Raumverhalten':2,'Passspiel kurz':2,'Umschaltspiel':1.5,'Zweikampf':1.5,'1:1 Defensiv':1.5,'Handlungsschnelligkeit':1.5,'Anspielbereitschaft':1.5,'Disziplin/Konzentration':1}},
 'Zentrales Mittelfeld · Achter':{group:'Mittelfeld',criteria:{'Laufaktivität':1.5,'Passspiel kurz':1.5,'Passspiel lang':1.5,'Umschaltspiel':1.5,'Raumverhalten':1.5,'Anspielbereitschaft':1.5,'Handlungsschnelligkeit':1.5,'Spieleinfluss':1.5,'Zweikampf':1}},
 'Offensives Mittelfeld · Zehner':{group:'Mittelfeld',criteria:{'Kreativität':2,'Passspiel kurz':1.5,'Erster Kontakt':1.5,'Dribbling':1.5,'Spiel ohne Ball':1.5,'Spieleinfluss':2,'Handlungsschnelligkeit':1.5,'Variabler Torschuss':1}},
 'Flügel · Eins-gegen-eins':{group:'Angriff',criteria:{'Dribbling':2,'1:1 Offensiv':2,'Antrittsschnelligkeit':1.5,'Schnelligkeit Distanz':1.5,'Repertoire Finten':1.5,'Ball An/Mitnahme':1.5,'Variabler Torschuss':1,'Spiel ohne Ball':1}},
 'Stürmer · Tiefenläufer':{group:'Angriff',criteria:{'Antrittsschnelligkeit':2,'Schnelligkeit Distanz':2,'Spiel ohne Ball':2,'Lösen vom Gegner':2,'Variabler Torschuss':1.5,'Erster Kontakt':1,'Handlungsschnelligkeit':1.5,'Laufaktivität':1}},
 'Stürmer · Zielspieler':{group:'Angriff',criteria:{'Körperlichkeit':2,'Kopfballspiel':2,'Ball An/Mitnahme':1.5,'Erster Kontakt':1.5,'Variabler Torschuss':2,'Zweikampf':1.5,'Anspielbereitschaft':1,'Teamplayer':1}},
 'Torwart · Shot-Stopper':{group:'Torwart',criteria:{'Reflexe':2.5,'Fangsicherheit':2,'Eins-gegen-eins Torwart':2,'Stellungsspiel Torwart':2,'Antizipation Torwart':1.5,'Reboundkontrolle':1.5,'Kommunikation Torwart':1,'Strafraumbeherrschung':1}},
 'Torwart · Sweeper-Keeper':{group:'Torwart',criteria:{'Stellungsspiel Torwart':2,'Antizipation Torwart':2,'Reflexe':1.5,'Spieleröffnung kurz':1.5,'Spieleröffnung lang':1.5,'Kommunikation Torwart':1.5,'Strafraumbeherrschung':2,'Eins-gegen-eins Torwart':1}},
 'Torwart · Spielaufbau':{group:'Torwart',criteria:{'Spieleröffnung kurz':2,'Spieleröffnung lang':2,'Abwurf und Abstoß':1.5,'Kommunikation Torwart':1.5,'Stellungsspiel Torwart':1.5,'Antizipation Torwart':1,'Fangsicherheit':1,'Flankenbeherrschung':1}}
};
function scoreRoleFit(ratings,roleName){
 const profile=ROLE_PROFILES[roleName];if(!profile)return null;
 const rows=Object.entries(profile.criteria).map(([label,weight])=>({label,weight,value:safeNumber(ratings?.[label])}));
 const available=rows.filter(x=>x.value!==null),totalWeight=rows.reduce((s,x)=>s+x.weight,0),usedWeight=available.reduce((s,x)=>s+x.weight,0);
 const coverage=totalWeight?Math.round(usedWeight/totalWeight*100):0;
 const weighted=usedWeight?available.reduce((s,x)=>s+x.value*x.weight,0)/usedWeight:null;
 const fit=weighted===null?null:Math.round((weighted-1)/4*100);
 const strengths=available.filter(x=>x.value>=4).sort((a,b)=>b.value-a.value).slice(0,4);
 const gaps=available.filter(x=>x.value<=2).sort((a,b)=>a.value-b.value).slice(0,4);
 const missing=rows.filter(x=>x.value===null).map(x=>x.label);
 return {roleName,group:profile.group,fit,weighted:weighted===null?null:Number(weighted.toFixed(2)),coverage,available:available.length,total:rows.length,strengths,gaps,missing,confidence:coverage>=80?'Gute Datenabdeckung':coverage>=60?'Mittlere Datenabdeckung':coverage>=40?'Begrenzte Datenabdeckung':'Sehr geringe Datenabdeckung'};
}

const safeNumber=v=>{if(v===null||v===undefined||String(v).trim()==='')return null;const n=Number(v);return Number.isInteger(n)&&n>=1&&n<=5?n:null;};
const containsPrivateContact=value=>/(?:[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})|(?:\+?\d[\d\s()./-]{7,}\d)/i.test(String(value||''));
const normalizeRatings=ratings=>Object.fromEntries(Object.values(SECTIONS).flat().map(key=>[key,safeNumber(ratings?.[key])]).filter(([,value])=>value!==null));
const isGoalkeeper=player=>(player?.positions||[]).some(p=>String(p).toLowerCase().includes('torwart'));
function compareObservations(rows){
 const ordered=[...(rows||[])].sort((a,b)=>String(a.observed_on).localeCompare(String(b.observed_on))||String(a.created_at).localeCompare(String(b.created_at)));
 const seen=new Set();
 const distinct=ordered.filter(row=>{
  const snapshot=Object.entries(SECTIONS).flatMap(([,criteria])=>criteria.map(label=>[label,safeNumber(row.ratings?.[label])])).filter(([,value])=>value!==null);
  const key=String(row.observed_on)+'|'+JSON.stringify(snapshot);
  if(seen.has(key))return false;
  seen.add(key);return true;
 });
 const ignoredDuplicates=ordered.length-distinct.length;
 if(distinct.length<2)return {insufficient:true,ignoredDuplicates};
 const previous=distinct[distinct.length-2],latest=distinct[distinct.length-1];
 const changes=Object.entries(SECTIONS).map(([section,criteria])=>{
  const items=criteria.map(label=>({label,from:safeNumber(previous.ratings?.[label]),to:safeNumber(latest.ratings?.[label])})).filter(x=>x.from!==null&&x.to!==null).map(x=>({...x,delta:x.to-x.from}));
  const average=items.length?Number((items.reduce((sum,x)=>sum+x.delta,0)/items.length).toFixed(2)):null;
  return {section,items,average};
 });
 const comparable=changes.flatMap(x=>x.items);
 if(!comparable.length)return {previous,latest,changes,comparable:0,average:null,improved:0,declined:0,unchanged:0,ignoredDuplicates};
 return {previous,latest,changes,comparable:comparable.length,average:Number((comparable.reduce((sum,x)=>sum+x.delta,0)/comparable.length).toFixed(2)),improved:comparable.filter(x=>x.delta>0).length,declined:comparable.filter(x=>x.delta<0).length,unchanged:comparable.filter(x=>x.delta===0).length,ignoredDuplicates};
}
function analyzeLongitudinalTrend(rows){
 const ordered=[...(rows||[])].sort((a,b)=>String(a.observed_on).localeCompare(String(b.observed_on))||String(a.created_at).localeCompare(String(b.created_at)));
 const seen=new Set();
 const distinct=ordered.filter(row=>{
  const vals=normalizeRatings(row.ratings||{});
  const key=String(row.observed_on)+'|'+JSON.stringify(vals);
  if(seen.has(key))return false;seen.add(key);return true;
 });
 if(distinct.length<3)return {ready:false,count:distinct.length,duplicates:ordered.length-distinct.length};
 const first=distinct[0],last=distinct[distinct.length-1];
 const start=Date.parse(first.observed_on+'T00:00:00Z'),end=Date.parse(last.observed_on+'T00:00:00Z');
 const days=Math.round((end-start)/86400000);
 if(!Number.isFinite(days)||days<30)return {ready:false,count:distinct.length,days,duplicates:ordered.length-distinct.length};
 const sections=Object.entries(SECTIONS).map(([section,criteria])=>{
  const metrics=criteria.map(label=>{
   const points=distinct.map(o=>({date:o.observed_on,value:safeNumber(o.ratings?.[label])})).filter(p=>p.value!==null);
   if(points.length<2)return null;
   const delta=points[points.length-1].value-points[0].value;
   const steps=points.slice(1).map((p,i)=>p.value-points[i].value).filter(v=>v!==0);
   const direction=delta===0?'stable':delta>0?'up':'down';
   const consistent=steps.length>0&&steps.every(v=>Math.sign(v)===Math.sign(delta))&&delta!==0;
   return {label,delta,points:points.length,direction,consistent};
  }).filter(Boolean);
  const average=metrics.length?Number((metrics.reduce((s,m)=>s+m.delta,0)/metrics.length).toFixed(2)):null;
  return {section,metrics,average};
 }).filter(s=>s.metrics.length);
 const all=sections.flatMap(s=>s.metrics);
 return {ready:all.length>0,count:distinct.length,days,first,last,duplicates:ordered.length-distinct.length,sections,criteriaCount:all.length,up:all.filter(x=>x.delta>0).length,down:all.filter(x=>x.delta<0).length,stable:all.filter(x=>x.delta===0).length,consistent:all.filter(x=>x.consistent).length};
}
function analyzeScoutAgreement(rows,identityLinks){
 const identityByPlayer=new Map((identityLinks||[]).map(link=>[String(link.player_id),String(link.identity_id)]));
 const observations=(rows||[]).filter(o=>o.created_by&&o.observed_on&&o.ratings&&identityByPlayer.has(String(o.player_id)));
 const groups=new Map();
 observations.forEach(o=>{const key=identityByPlayer.get(String(o.player_id));const list=groups.get(key)||[];list.push(o);groups.set(key,list);});
 const comparisons=[];const pairedPlayers=new Set();const scoutPairs=new Set();
 for(const [playerId,list] of groups){
  const sorted=[...list].sort((a,b)=>String(a.observed_on).localeCompare(String(b.observed_on))||String(a.created_at||'').localeCompare(String(b.created_at||'')));
  for(let i=0;i<sorted.length;i++)for(let j=i+1;j<sorted.length;j++){
   const a=sorted[i],b=sorted[j];if(a.created_by===b.created_by)continue;
   const gap=Math.abs(Date.parse(a.observed_on+'T00:00:00Z')-Date.parse(b.observed_on+'T00:00:00Z'))/86400000;
   if(!Number.isFinite(gap)||gap>14)continue;
   const pair=[String(a.created_by),String(b.created_by)].sort().join('|');
   scoutPairs.add(pair);pairedPlayers.add(playerId);
   for(const key of Object.values(SECTIONS).flat()){
    const av=safeNumber(a.ratings?.[key]),bv=safeNumber(b.ratings?.[key]);
    if(av===null||bv===null)continue;
    comparisons.push({difference:Math.abs(av-bv),withinOne:Math.abs(av-bv)<=1});
   }
  }
 }
 return {comparisons:comparisons.length,pairedPlayers:pairedPlayers.size,scoutPairs:scoutPairs.size,meanAbsoluteDifference:comparisons.length?Number((comparisons.reduce((s,x)=>s+x.difference,0)/comparisons.length).toFixed(2)):null,withinOne:comparisons.length?Math.round(comparisons.filter(x=>x.withinOne).length/comparisons.length*100):null};
}
function buildSnapshot(player){
 const ratings=player.ratings&&typeof player.ratings==='object'?player.ratings:{};
 const sectionEntries=Object.entries(SECTIONS).filter(([name])=>name!=='Torwart'||isGoalkeeper(player));
 const criteriaList=sectionEntries.flatMap(([,criteria])=>criteria);
 const sections=sectionEntries.map(([name,criteria])=>{
   const entries=criteria.map(label=>({label,value:safeNumber(ratings[label])})).filter(x=>x.value!==null);
   const average=entries.length?Number((entries.reduce((s,x)=>s+x.value,0)/entries.length).toFixed(2)):null;
   return {name,average,count:entries.length,entries};
 });
 const all=sections.flatMap(s=>s.entries);
 const strongest=all.filter(x=>x.value>=4).sort((a,b)=>b.value-a.value).slice(0,5);
 const development=all.filter(x=>x.value<=2).sort((a,b)=>a.value-b.value).slice(0,5);
 const missing=criteriaList.filter(label=>safeNumber(ratings[label])===null);
 const coverage=all.length?Math.round(all.length/criteriaList.length*100):0;
 return {
   title:'Spieler-Snapshot',
   mode:'descriptive_baseline',
   model_version:MODEL_VERSION,
   generated_at:new Date().toISOString(),
   player:{player_id:player.player_id,name:player.name,club:player.club,year:player.year,positions:player.positions||[],foot:player.foot||null},
   sections,strongest,development,coverage,missing_count:missing.length,criteria_count:criteriaList.length,
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
 const [savingObservation,setSavingObservation]=useState(false);
 const observationSaveLock=useRef(false);
 const [loading,setLoading]=useState(false);
 const [models,setModels]=useState([]);
 const [identityLinks,setIdentityLinks]=useState([]);
 const [identityStatuses,setIdentityStatuses]=useState([]);
 const [identitySource,setIdentitySource]=useState('');
 const [identityTarget,setIdentityTarget]=useState('');
 const [identityReason,setIdentityReason]=useState('');
 const [identityAudit,setIdentityAudit]=useState([]);
 const [identityBusy,setIdentityBusy]=useState(false);
 const [externalSources,setExternalSources]=useState([]);
 const [quality,setQuality]=useState({loading:false,observations:0,playersObserved:0,longitudinalPlayers:0,predictions:0,outcomes:0,matchedOutcomes:0,mae:null,evaluations:0,passedEvaluations:0,trainingRuns:0,completeRatings:0,scoutAgreement:{comparisons:0,pairedPlayers:0,scoutPairs:0,meanAbsoluteDifference:null,withinOne:null}});
 const [error,setError]=useState('');
 const [accessDiagnostics,setAccessDiagnostics]=useState(null);
 const [diagnosticsBusy,setDiagnosticsBusy]=useState(false);
 const [logicChecksPage,setLogicChecksPage]=useState(1);
 const [accessDiagnosticsPage,setAccessDiagnosticsPage]=useState(1);
 const DIAGNOSTICS_PAGE_SIZE=8;
 const [search,setSearch]=useState('');
 const [selectedRole,setSelectedRole]=useState(Object.keys(ROLE_PROFILES)[0]);
 useEffect(()=>{if(selected)setSelectedRole(isGoalkeeper(selected)?'Torwart · Shot-Stopper':Object.keys(ROLE_PROFILES).find(k=>!k.startsWith('Torwart ·'))||Object.keys(ROLE_PROFILES)[0]);},[selectedId]);
 const selected=players.find(p=>String(p.player_id)===String(selectedId));
 const evolution=useMemo(()=>compareObservations(observations),[observations]);
 const longTrend=useMemo(()=>analyzeLongitudinalTrend(observations),[observations]);
 const visiblePlayers=useMemo(()=>players.filter(p=>(p.name+' '+(p.club||'')+' '+(p.positions||[]).join(' ')).toLowerCase().includes(search.toLowerCase())),[players,search]);
 const ratedCount=useMemo(()=>players.filter(p=>p.ratings&&Object.values(p.ratings).some(v=>safeNumber(v)!==null)).length,[players]);
 const roleFit=useMemo(()=>selected?scoreRoleFit(selected.ratings||{},selectedRole):null,[selected,selectedRole]);
 const logicChecks=useMemo(()=>{
  const checks=[];
  Object.entries(ROLE_PROFILES).forEach(([name,profile])=>{const ratings=Object.fromEntries(Object.keys(profile.criteria).map(k=>[k,3]));const result=scoreRoleFit(ratings,name);checks.push({name:'Rollenprofil: '+name,ok:!!result&&result.fit===50&&result.coverage===100&&result.available===result.total});});
  const fieldSnapshot=buildSnapshot({player_id:1,name:'Test Feldspieler',positions:['Stürmer'],ratings:{}});const keeperSnapshot=buildSnapshot({player_id:2,name:'Test Torwart',positions:['Torwart'],ratings:{}});checks.push({name:'Positionsabhängiger Kriterienumfang: Feldspieler 34 / Torwart 46',ok:fieldSnapshot.criteria_count===34&&keeperSnapshot.criteria_count===46&&!fieldSnapshot.sections.some(s=>s.name==='Torwart')&&keeperSnapshot.sections.some(s=>s.name==='Torwart')});
  const missing=scoreRoleFit({},Object.keys(ROLE_PROFILES)[0]);checks.push({name:'Fehlende Werte werden nicht als Null gewertet',ok:missing.fit===null&&missing.coverage===0&&missing.available===0});
  const trend=analyzeLongitudinalTrend([{observed_on:'2026-10-21',ratings:{Dribbling:2}},{observed_on:'2026-11-08',ratings:{Dribbling:3}},{observed_on:'2026-11-25',ratings:{Dribbling:4}}]);checks.push({name:'Longitudinalanalyse: 3 Messpunkte / 35 Tage',ok:trend.ready&&trend.count===3&&trend.days===35&&trend.up===1});
  const short=analyzeLongitudinalTrend([{observed_on:'2026-11-01',ratings:{Dribbling:2}},{observed_on:'2026-11-10',ratings:{Dribbling:3}}]);checks.push({name:'Zu kurze Zeitreihe wird gesperrt',ok:!short.ready});
  const duplicate=analyzeLongitudinalTrend([{observed_on:'2026-10-21',ratings:{Dribbling:2}},{observed_on:'2026-10-21',ratings:{Dribbling:2}},{observed_on:'2026-11-08',ratings:{Dribbling:3}},{observed_on:'2026-11-25',ratings:{Dribbling:4}}]);checks.push({name:'Identische Tages-Snapshots werden ignoriert',ok:duplicate.ready&&duplicate.count===3&&duplicate.duplicates===1});
  return checks;
 },[]);
 async function runAccessDiagnostics(){
  if(!supabase||!profile?.id||diagnosticsBusy)return;setDiagnosticsBusy(true);setAccessDiagnostics(null);
  const checks=[];
  try{
   const {data:{user},error:userError}=await supabase.auth.getUser();
   checks.push({name:'Authentifizierte Sitzung',ok:!userError&&!!user&&user.id===profile.id,detail:userError?.message||''});
   const [obsResult,analysisResult]=await Promise.all([
    supabase.from('asi_player_observations').select('id,owner_id').eq('owner_id',profile.id).limit(20),
    supabase.from('asi_player_analyses').select('id,owner_id').eq('owner_id',profile.id).limit(20)
   ]);
   checks.push({name:'Eigene ASI-Beobachtungen lesen',ok:!obsResult.error&&Array.isArray(obsResult.data)&&obsResult.data.every(x=>x.owner_id===profile.id),detail:obsResult.error?.message||((obsResult.data||[]).length+' Datensätze')});
   checks.push({name:'Eigene ASI-Analysen lesen',ok:!analysisResult.error&&Array.isArray(analysisResult.data)&&analysisResult.data.every(x=>x.owner_id===profile.id),detail:analysisResult.error?.message||((analysisResult.data||[]).length+' Datensätze')});
   if(!admin){const foreign=await supabase.from('players').select('player_id').in('player_id',Array.from({length:24},(_,i)=>i+8));checks.push({name:'Fremde Admin-Testspieler bleiben verborgen',ok:!foreign.error&&(foreign.data||[]).length===0,detail:foreign.error?.message||((foreign.data||[]).length+' fremde Profile sichtbar')});}
   else checks.push({name:'Scout-Negativtest',ok:null,detail:'Bitte separat mit einem Scout-Konto ausführen; Adminrechte können den Scout-Zugriff nicht simulieren.'});
   setAccessDiagnostics(checks);
  }catch(e){setAccessDiagnostics([{name:'Zugriffstest',ok:false,detail:e.message||'Unbekannter Fehler'}]);}
  finally{setDiagnosticsBusy(false);}
 }
 async function loadMeta(){
   if(!supabase)return;
   setQuality(q=>({...q,loading:true}));
   const [m,s,obs,preds,outcomes,evaluations,runs,identityRows,statusRows,auditRows]=await Promise.all([
     supabase.from('asi_model_versions').select('id,model_key,version,model_family,status,metrics,created_at').order('created_at',{ascending:false}).limit(12),
     admin?supabase.from('asi_external_sources').select('id,source_name,provider,source_type,license_status,last_synced_at').order('created_at',{ascending:false}):Promise.resolve({data:[],error:null}),
     admin?supabase.from('asi_player_observations').select('player_id,observed_on,ratings,created_by,created_at'):Promise.resolve({data:[],error:null}),
     admin?supabase.from('asi_prediction_records').select('id,target_metric,predicted_value'):Promise.resolve({data:[],error:null}),
     admin?supabase.from('asi_prediction_outcomes').select('prediction_id,observed_metric,observed_value'):Promise.resolve({data:[],error:null}),
     admin?supabase.from('asi_model_evaluations').select('id,passed'):Promise.resolve({data:[],error:null}),
     admin?supabase.from('asi_training_runs').select('id,status'):Promise.resolve({data:[],error:null}),
     admin?supabase.from('asi_player_identity_links').select('player_id,identity_id,owner_id'):Promise.resolve({data:[],error:null}),
     admin?supabase.from('asi_player_identities').select('id,identity_status,updated_at'):Promise.resolve({data:[],error:null}),
     admin?supabase.from('asi_player_identity_audit').select('id,identity_id,player_id,action,reason,created_at').order('created_at',{ascending:false}).limit(30):Promise.resolve({data:[],error:null})
   ]);
   if(!m.error)setModels(m.data||[]);
   if(!s.error)setExternalSources(s.data||[]);
   if(admin&&!identityRows.error)setIdentityLinks(identityRows.data||[]);
   if(admin&&!statusRows.error)setIdentityStatuses(statusRows.data||[]);
   if(admin&&!auditRows.error)setIdentityAudit(auditRows.data||[]);
   if(admin){
     const observationRows=obs.error?[]:(obs.data||[]);
     const predictionRows=preds.error?[]:(preds.data||[]);
     const outcomeRows=outcomes.error?[]:(outcomes.data||[]);
     const matched=outcomeRows.map(o=>({outcome:o,prediction:predictionRows.find(p=>p.id===o.prediction_id)})).filter(x=>x.prediction&&x.prediction.target_metric===x.outcome.observed_metric&&x.prediction.predicted_value!==null&&x.prediction.predicted_value!==undefined&&x.outcome.observed_value!==null&&x.outcome.observed_value!==undefined&&Number.isFinite(Number(x.prediction.predicted_value))&&Number.isFinite(Number(x.outcome.observed_value)));
     const mae=matched.length?matched.reduce((sum,x)=>sum+Math.abs(Number(x.prediction.predicted_value)-Number(x.outcome.observed_value)),0)/matched.length:null;
     const byPlayer=new Map();
     observationRows.forEach(o=>{const dates=byPlayer.get(o.player_id)||[];dates.push(new Date(o.observed_on+'T00:00:00Z').getTime());byPlayer.set(o.player_id,dates);});
     const longitudinal=[...byPlayer.values()].filter(ds=>ds.length>=2&&Math.max(...ds)-Math.min(...ds)>=30*86400000).length;
     const activeIdentityIds=new Set((statusRows.error?[]:(statusRows.data||[])).filter(x=>x.identity_status==='confirmed').map(x=>String(x.id)));
     const activeLinks=(identityRows.error?[]:(identityRows.data||[])).filter(x=>activeIdentityIds.has(String(x.identity_id)));
     const scoutAgreement=analyzeScoutAgreement(observationRows,activeLinks);
     const completeRatings=observationRows.filter(o=>{
       const player=players.find(p=>String(p.player_id)===String(o.player_id));
       if(!player)return false;
       const activeCriteria=Object.entries(SECTIONS).filter(([section])=>section!=='Torwart'||isGoalkeeper(player)).flatMap(([,criteria])=>criteria);
       return activeCriteria.length>0&&activeCriteria.every(k=>safeNumber((o.ratings||{})[k])!==null);
     }).length;
     setQuality({loading:false,observations:observationRows.length,playersObserved:byPlayer.size,longitudinalPlayers:longitudinal,predictions:predictionRows.length,outcomes:outcomeRows.length,matchedOutcomes:matched.length,mae,evaluations:evaluations.error?0:(evaluations.data||[]).length,passedEvaluations:evaluations.error?0:(evaluations.data||[]).filter(x=>x.passed===true).length,trainingRuns:runs.error?0:(runs.data||[]).length,completeRatings,scoutAgreement});
   }else setQuality(q=>({...q,loading:false}));
 }
 async function confirmPlayerIdentity(){
   if(!admin||!supabase||!identitySource||!identityTarget||identityBusy)return;
   if(identityReason.trim().length<12){setError('Bitte einen nachvollziehbaren Identitätsnachweis mit mindestens 12 Zeichen dokumentieren.');return;}
   setIdentityBusy(true);setError('');
   try{
     const {error:linkError}=await supabase.rpc('asi_confirm_player_identity',{p_source_player_id:Number(identitySource),p_target_player_id:Number(identityTarget),p_reason:identityReason.trim()});
     if(linkError)throw linkError;
     setIdentitySource('');setIdentityTarget('');setIdentityReason('');
     onNotice('Spieleridentität wurde atomar bestätigt und revisionsfähig protokolliert.');
     await loadMeta();
   }catch(e){setError(e.message||'Spieleridentität konnte nicht bestätigt werden.');}
   finally{setIdentityBusy(false);}
 }
 async function setIdentityStatus(identityId,nextStatus){
   const reason=window.prompt(nextStatus==='suspended'?'Warum wird diese zentrale Identität vorübergehend gesperrt?':'Warum darf diese zentrale Identität wieder verwendet werden?');
   if(!reason||reason.trim().length<12){setError('Bitte einen nachvollziehbaren Grund mit mindestens 12 Zeichen eingeben.');return;}
   setIdentityBusy(true);setError('');
   try{
     const {error:statusError}=await supabase.rpc('asi_set_player_identity_status',{p_identity_id:identityId,p_status:nextStatus,p_reason:reason.trim()});
     if(statusError)throw statusError;
     onNotice(nextStatus==='suspended'?'Identität wurde gesperrt. Scout-Vergleiche berücksichtigen sie nicht mehr.':'Identität wurde reaktiviert und kann wieder für Scout-Vergleiche verwendet werden.');
     await loadMeta();
   }catch(e){setError(e.message||'Identitätsstatus konnte nicht geändert werden.');}
   finally{setIdentityBusy(false);}
 }
 async function correctPlayerIdentity(playerId){
   const reason=window.prompt('Warum muss diese Identitätszuordnung aufgehoben werden? Bitte mindestens 12 Zeichen eingeben.');
   if(!reason||reason.trim().length<12)return;
   setIdentityBusy(true);setError('');
   try{
     const {error:unlinkError}=await supabase.rpc('asi_unlink_player_identity',{p_player_id:Number(playerId),p_reason:reason.trim()});
     if(unlinkError)throw unlinkError;
     onNotice('Zuordnung wurde aufgehoben. Die Änderung bleibt im Audit-Protokoll erhalten.');
     await loadMeta();
   }catch(e){setError(e.message||'Zuordnung konnte nicht korrigiert werden.');}
   finally{setIdentityBusy(false);}
 }
 async function loadObservations(playerId){
   if(!supabase||!playerId)return;
   const {data,error:loadError}=await supabase.from('asi_player_observations').select('id,player_id,observed_on,ratings,observation,source_type,created_at,created_by').eq('player_id',Number(playerId)).order('observed_on',{ascending:false}).order('created_at',{ascending:false}).limit(100);
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
     const reflection=reflectOnAssessment({ratings:selected.ratings||{},expectedCriteria:Object.entries(SECTIONS).filter(([name])=>name!=='Torwart'||isGoalkeeper(selected)).flatMap(([,criteria])=>criteria),roleFits:roleFit?[roleFit]:[],metadata:{ratingScale:'1-5'}});
     snapshot.self_reflection=reflection;
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
   e.preventDefault();if(!selected||!supabase||observationSaveLock.current)return;
   if(containsPrivateContact(observation)){setError('Bitte keine E-Mail-Adressen oder Telefonnummern in Beobachtungsnotizen speichern.');return;}
   if(!observationDate||Number.isNaN(Date.parse(observationDate))||observationDate>new Date().toISOString().slice(0,10)){setError('Bitte ein gültiges Beobachtungsdatum bis einschließlich heute auswählen.');return;}
   observationSaveLock.current=true;setSavingObservation(true);setBusy(true);setError('');
   try{
     const ratings=normalizeRatings(selected.ratings||{});
     if(!Object.keys(ratings).length)throw new Error('Es sind keine gültigen Bewertungen vorhanden. Bitte zuerst mindestens ein Kriterium mit einem Wert von 1 bis 5 erfassen.');
     const {data:existing,error:lookupError}=await supabase.from('asi_player_observations').select('id,ratings').eq('player_id',Number(selected.player_id)).eq('observed_on',observationDate);
     if(lookupError)throw lookupError;
     const sameSnapshot=(existing||[]).some(row=>JSON.stringify(normalizeRatings(row.ratings||{}))===JSON.stringify(ratings));
     if(sameSnapshot){
       setError('Dieser identische Bewertungs-Snapshot ist für diesen Spieler und dieses Datum bereits gespeichert. Es wurde kein doppelter Eintrag angelegt.');
       return;
     }
     const {error:saveError}=await supabase.from('asi_player_observations').insert({
       player_id:selected.player_id,owner_id:selected.owner_id,created_by:profile.id,
       observed_on:observationDate,ratings,observation:observation.trim()||null,source_type:'internal_scout'
     });
     if(saveError)throw saveError;
     setObservation('');await loadObservations(selectedId);onNotice('Beobachtung wurde in der ASI-Zeitleiste gespeichert.');
   }catch(e){setError(e.message||'Beobachtung konnte nicht gespeichert werden.');}
   finally{observationSaveLock.current=false;setSavingObservation(false);setBusy(false);}
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
   <FunctionGuide title="Adaptive Scouting Intelligence verstehen" intro="ASI wertet vorhandene interne Spielerinformationen aus. Arbeite am besten Schritt für Schritt: Spieler auswählen, Datenabdeckung prüfen, Snapshot erstellen und Beobachtungen über die Zeit dokumentieren." items={[
    {title:"Spieler auswählen",short:"Wähle ein Profil aus deinem freigegebenen Spielerbestand.",description:"Die Liste zeigt Spieler, auf die dein Konto zugreifen darf. Über das Suchfeld kannst du nach Name, Verein oder Position filtern. Die Auswahl lädt die für ASI verfügbaren Profildaten.",steps:["Nach Name, Verein oder Position suchen.","Den richtigen Spieler anhand von Verein und Position auswählen.","Vor der Analyse prüfen, ob die hinterlegten Bewertungen aktuell sind."],purpose:"Alle folgenden Auswertungen beziehen sich auf genau diesen Spieler und seine vorhandenen internen Bewertungen."},
    {title:"Snapshot erstellen",short:"Erzeuge eine nachvollziehbare Momentaufnahme der vorhandenen Bewertungen.",description:"Ein Snapshot fasst die aktuell gespeicherten gültigen Bewertungen zu einem Zeitpunkt zusammen. Er zeigt unter anderem Abschnittswerte, Stärken, Entwicklungsfelder und Datenabdeckung. Er ist eine Bestandsanalyse und keine Vorhersage.",steps:["Spieler auswählen.","Prüfen, ob mindestens gültige Bewertungen vorhanden sind.","„Snapshot erstellen“ anklicken.","Das Analyseergebnis und die ausgewiesenen Einschränkungen lesen."],purpose:"Du erhältst einen strukturierten Überblick über den aktuellen Bewertungsstand, der später mit weiteren Beobachtungen verglichen werden kann.",note:"Fehlende Werte werden nicht als Null behandelt. Eine geringe Datenabdeckung begrenzt die Aussagekraft."},
    {title:"Analyseergebnis richtig lesen",short:"Verstehe Abschnittswerte, Datenabdeckung und Qualitätsprüfung.",description:"Die Werte fassen die vorhandenen Kriterien in Bereichen wie Technik, Taktik, Athletik und Mentalität zusammen. Stärken und Entwicklungsfelder werden aus den dokumentierten Bewertungen abgeleitet. Die Selbstprüfung kontrolliert formale Auffälligkeiten, nicht die objektive Wahrheit der Scoutbeobachtung.",steps:["Datenabdeckung beachten.","Abschnittswerte und einzelne Kriterien gemeinsam betrachten.","Stärken und Entwicklungsfelder mit konkreten Spielsituationen abgleichen.","Hinweise der Qualitätsprüfung berücksichtigen."],purpose:"Du kannst die Bewertung transparent interpretieren, statt nur eine einzelne Gesamtzahl zu betrachten."},
    {title:"Scout-Feedback abgeben",short:"Melde zurück, ob die Auswertung fachlich hilfreich und plausibel ist.",description:"Mit den Feedback-Schaltflächen kannst du eine Auswertung als zutreffend oder nicht zutreffend markieren und bei Bedarf kommentieren. Das Feedback dokumentiert deine Einschätzung; es verändert nicht automatisch die Spielerbewertung.",steps:["Analyse vollständig lesen.","„Zutreffend“ oder „Nicht zutreffend“ auswählen.","Bei Bedarf einen konkreten Kommentar ergänzen und absenden."],purpose:"Die Rückmeldung hilft, die Qualität und Verständlichkeit der Auswertungen nachvollziehbar zu beurteilen."},
    {title:"Neue Beobachtung dokumentieren",short:"Halte eine konkrete Sichtung mit Datum und Notiz fest.",description:"Eine Beobachtung ist ein zeitlich zugeordneter Eintrag zu einem Spieler. Beschreibe konkrete Spielsituationen, Gegnerniveau und Kontext statt pauschaler Urteile. Beim Speichern wird der aktuelle Bewertungsstand als Snapshot mitgeführt.",steps:["Beobachtungsdatum auswählen.","Konkrete, überprüfbare Beobachtungen notieren.","Eintrag speichern.","Später weitere Beobachtungen ergänzen."],purpose:"So entsteht eine zeitliche Dokumentation, auf deren Grundlage Veränderungen nachvollzogen werden können.",note:"Keine privaten Kontaktdaten in Beobachtungsnotizen eintragen."},
    {title:"Rollenpassung / Positionsprofil",short:"Vergleiche vorhandene Kriterien mit einem taktischen Rollenprofil.",description:"Die Rollenpassung gewichtet ausgewählte Bewertungskriterien passend zu einer Spielrolle, zum Beispiel Sechser, Achter oder Flügelspieler. Angezeigt werden Fit-Wert, Datenabdeckung, Stärken und fehlende Kriterien. Das Profil ist ein fachlicher Startstandard und muss zum Spielmodell passen.",steps:["Spieler auswählen.","Passende Spielrolle wählen.","Fit-Wert zusammen mit der Datenabdeckung lesen.","Fehlende Kriterien vor einer Entscheidung ergänzen."],purpose:"Du erkennst, welche vorhandenen Fähigkeiten zu einer bestimmten taktischen Rolle passen könnten.",note:"Ein hoher Fit-Wert ist keine automatische Transfer- oder Aufstellungsentscheidung."},
    {title:"Entwicklung zwischen Beobachtungen",short:"Vergleiche zwei unterschiedliche Bewertungsstände.",description:"Der Vergleich nutzt nur Kriterien, die in beiden Beobachtungen gültige Werte besitzen. Identische Mehrfacheinträge werden ausgeschlossen. Veränderungen beschreiben Unterschiede zwischen den Messpunkten und beweisen keine Ursache oder Trainingswirkung.",steps:["Mindestens zwei unterschiedliche Beobachtungsstände erfassen.","Verglichene Kriterien und Zeitpunkte prüfen.","Verbesserte, stabile und niedrigere Werte im Kontext interpretieren."],purpose:"Du kannst nachvollziehen, wie sich dokumentierte Bewertungen zwischen Sichtungen verändert haben."},
    {title:"Spielerentwicklung über längere Zeit",short:"Erkenne längerfristige Trends bei ausreichender Datenbasis.",description:"Die Langzeitauswertung benötigt mindestens drei unterschiedliche Bewertungsstände über mindestens 30 Tage. Sie zeigt Veränderungen gemeinsamer Kriterien vom ersten bis zum letzten Stand und kennzeichnet gleichgerichtete Zwischenschritte.",steps:["Regelmäßig Beobachtungen dokumentieren.","Auf mindestens drei unterschiedliche Messpunkte über mindestens 30 Tage achten.","Zeitraum, Anzahl der Kriterien und Datenabdeckung prüfen.","Ergebnis als rückblickende Beschreibung lesen, nicht als Prognose."],purpose:"Du erhältst eine belastbarere zeitliche Übersicht als durch den Vergleich nur zweier Einzelstände."},
    {title:"Modellqualität und Systemtests",short:"Technische Prüfungen und Modellfreigaben richtig einordnen.",description:"Systemtests prüfen technische Logik und Zugriffsrechte. Die Qualitätsübersicht zeigt, ob genügend Beobachtungen, Ergebnispaare und unabhängige Evaluationen vorliegen. Diese Bereiche sind überwiegend für Administratoren gedacht und keine tägliche Scout-Arbeitsfunktion.",steps:["Als Scout die normalen Spieler- und Beobachtungsfunktionen nutzen.","Bei technischen Fehlermeldungen den Admin informieren.","Admin-Prüfungen nicht mit einer fachlichen Spielerbewertung verwechseln."],purpose:"Die Trennung verhindert, dass technische Kennzahlen als sportliche Aussagen missverstanden werden.",note:"Eine bestandene technische Prüfung bestätigt weder die Richtigkeit aller Scoutdaten noch die Prognosefähigkeit eines Modells."}
   ]}/>
   <section className="asi-panel asi-diagnostics-panel"><div className="asi-panel-heading"><div><span className="asi-eyebrow">SYSTEM VALIDATION</span><h2>ASI-Funktions- und Zugriffstests</h2></div><ShieldCheck size={20}/></div><p className="asi-role-intro">Automatische, nicht-destruktive Prüfungen der Rollenberechnung, Zeitreihenlogik und aktuellen Sitzung. Es werden keine Spieler- oder Beobachtungsdaten verändert.</p><div className="asi-diagnostic-summary"><strong>{logicChecks.filter(x=>x.ok).length}/{logicChecks.length}</strong><span>Logiktests bestanden</span></div><div className="asi-diagnostic-list">{logicChecks.slice((logicChecksPage-1)*DIAGNOSTICS_PAGE_SIZE,logicChecksPage*DIAGNOSTICS_PAGE_SIZE).map((x,i)=><div key={(logicChecksPage-1)*DIAGNOSTICS_PAGE_SIZE+i}><span>{x.name}</span><b className={x.ok?'is-ok':'is-fail'}>{x.ok?'BESTANDEN':'FEHLER'}</b></div>)}</div>{logicChecks.length>DIAGNOSTICS_PAGE_SIZE&&<div className="asi-diagnostic-pagination"><span>{(logicChecksPage-1)*DIAGNOSTICS_PAGE_SIZE+1}–{Math.min(logicChecksPage*DIAGNOSTICS_PAGE_SIZE,logicChecks.length)} von {logicChecks.length} Tests</span><div><button type="button" onClick={()=>setLogicChecksPage(p=>Math.max(1,p-1))} disabled={logicChecksPage===1}>Zurück</button><strong>Seite {logicChecksPage} / {Math.ceil(logicChecks.length/DIAGNOSTICS_PAGE_SIZE)}</strong><button type="button" onClick={()=>setLogicChecksPage(p=>Math.min(Math.ceil(logicChecks.length/DIAGNOSTICS_PAGE_SIZE),p+1))} disabled={logicChecksPage>=Math.ceil(logicChecks.length/DIAGNOSTICS_PAGE_SIZE)}>Weiter</button></div></div>}<button type="button" className="asi-action" onClick={runAccessDiagnostics} disabled={diagnosticsBusy}>{diagnosticsBusy?'Zugriff wird geprüft…':'Sitzungs- und RLS-Test starten'}</button>{accessDiagnostics&&<><div className="asi-diagnostic-list">{accessDiagnostics.slice((accessDiagnosticsPage-1)*DIAGNOSTICS_PAGE_SIZE,accessDiagnosticsPage*DIAGNOSTICS_PAGE_SIZE).map((x,i)=><div key={(accessDiagnosticsPage-1)*DIAGNOSTICS_PAGE_SIZE+i}><span>{x.name}{x.detail?' · '+x.detail:''}</span><b className={x.ok===null?'is-skip':x.ok?'is-ok':'is-fail'}>{x.ok===null?'MANUELL':x.ok?'BESTANDEN':'FEHLER'}</b></div>)}</div>{accessDiagnostics.length>DIAGNOSTICS_PAGE_SIZE&&<div className="asi-diagnostic-pagination"><span>{(accessDiagnosticsPage-1)*DIAGNOSTICS_PAGE_SIZE+1}–{Math.min(accessDiagnosticsPage*DIAGNOSTICS_PAGE_SIZE,accessDiagnostics.length)} von {accessDiagnostics.length} Prüfungen</span><div><button type="button" onClick={()=>setAccessDiagnosticsPage(p=>Math.max(1,p-1))} disabled={accessDiagnosticsPage===1}>Zurück</button><strong>Seite {accessDiagnosticsPage} / {Math.ceil(accessDiagnostics.length/DIAGNOSTICS_PAGE_SIZE)}</strong><button type="button" onClick={()=>setAccessDiagnosticsPage(p=>Math.min(Math.ceil(accessDiagnostics.length/DIAGNOSTICS_PAGE_SIZE),p+1))} disabled={accessDiagnosticsPage>=Math.ceil(accessDiagnostics.length/DIAGNOSTICS_PAGE_SIZE)}>Weiter</button></div></div>}</>}<p className="asi-footnote">Der Scout-Negativtest muss mit einem echten Scout-Login ausgeführt werden. Ein Admin-Login kann fremde Daten absichtlich sehen und ist dafür kein gültiger Test.</p></section>
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
         <div className="asi-self-reflection"><div className="asi-result-top"><strong>Selbstkritische Qualitätsprüfung</strong><span className={'asi-status '+(analysis.analysis_json?.self_reflection?.status||'')}>{analysis.analysis_json?.self_reflection?.status==='consistent'?'KONSISTENT':analysis.analysis_json?.self_reflection?.status==='caution'?'HINWEISE':'PRÜFUNG ERFORDERLICH'}</span></div><p>{analysis.analysis_json?.self_reflection?.validRatingCount??0} von {analysis.analysis_json?.self_reflection?.expectedRatingCount??0} erwarteten Kriterien gültig bewertet · {analysis.analysis_json?.self_reflection?.missingRatingCount??0} fehlen.</p>{analysis.analysis_json?.self_reflection?.findings?.length?<ul>{analysis.analysis_json.self_reflection.findings.map((item,index)=><li key={item.code+'-'+index}><strong>{item.severity==='blocking'?'Blockierend':item.severity==='warning'?'Hinweis':'Info'}:</strong> {item.message}{item.criteria?.length?' ('+item.criteria.join(', ')+')':''}</li>)}</ul>:<small>Keine internen Widersprüche oder formalen Datenprobleme erkannt. Dies bestätigt nicht die objektive Richtigkeit der Scoutbewertung.</small>}<small>Engine {analysis.analysis_json?.self_reflection?.engineVersion||'unbekannt'} · automatische Prüfung, keine externe KI-Begutachtung.</small></div>
         <div className="asi-feedback"><strong>War diese Auswertung hilfreich und sachlich richtig?</strong><div className="asi-feedback-actions"><button type="button" className={feedback==='correct'?'active':''} onClick={()=>sendFeedback('correct')} disabled={busy}><ThumbsUp size={15}/> Zutreffend</button><button type="button" className={feedback==='partially_correct'?'active':''} onClick={()=>sendFeedback('partially_correct')} disabled={busy}><Activity size={15}/> Teilweise</button><button type="button" className={feedback==='incorrect'?'active':''} onClick={()=>sendFeedback('incorrect')} disabled={busy}><ThumbsDown size={15}/> Nicht zutreffend</button></div><textarea value={feedbackComment} onChange={e=>setFeedbackComment(e.target.value)} maxLength={2000} placeholder="Optional: Was fehlt oder ist falsch?"/>{feedback&&<small>Feedback gespeichert: {feedback}</small>}</div>
       </div>}
     </section>
   </div>
   {selected&&<section className="asi-panel asi-role-panel">
     <div className="asi-panel-heading"><div><span className="asi-eyebrow">PLAYER INTELLIGENCE 2.0</span><h2>Taktische Rollenpassung</h2></div><Activity size={20}/></div>
     <p className="asi-role-intro">Vergleicht vorhandene Scoutbewertungen mit einem transparent gewichteten Rollenprofil. Der Index beschreibt nur die Passung zu diesem Kriterienmodell – keine Einsatzgarantie und keine Leistungsprognose.</p>
     <label className="asi-role-select">Taktische Rolle<select value={selectedRole} onChange={e=>setSelectedRole(e.target.value)}>{Object.entries(ROLE_PROFILES).filter(([name])=>isGoalkeeper(selected)?name.startsWith('Torwart ·'):!name.startsWith('Torwart ·')).map(([name,p])=><option key={name} value={name}>{p.group} · {name}</option>)}</select></label>
     <div className="asi-role-result"><div className="asi-role-score"><strong>{roleFit.fit===null?'–':roleFit.fit+'%'}</strong><span>Rollen-Fit-Index</span></div><div className="asi-role-detail"><strong>{roleFit.confidence}</strong><span>{roleFit.available} von {roleFit.total} Kriterien bewertet · {roleFit.coverage}% gewichtete Abdeckung</span><div className="asi-progress"><span style={{width:roleFit.coverage+'%'}}/></div><small>Gewichteter Mittelwert: {roleFit.weighted===null?'–':roleFit.weighted+' / 5'}</small></div></div>
     <div className="asi-role-findings"><article><strong>Passende Stärken</strong>{roleFit.strengths.length?roleFit.strengths.map(x=><span key={x.label}>{x.label} · {x.value}/5 · Gewicht {x.weight}</span>):<small>Keine bewertete Stärke ≥ 4 vorhanden.</small>}</article><article><strong>Entwicklungsfelder</strong>{roleFit.gaps.length?roleFit.gaps.map(x=><span key={x.label}>{x.label} · {x.value}/5 · Gewicht {x.weight}</span>):<small>Keine bewertete Schwäche ≤ 2 vorhanden.</small>}</article></div>
     <details className="asi-role-method"><summary>Berechnung und fehlende Daten anzeigen</summary><p>Gewichteter Mittelwert der verfügbaren Kriterien; anschließend lineare Umrechnung der Skala 1–5 auf 0–100. Fehlende Kriterien werden nicht als 0 gewertet. Die Abdeckung wird separat ausgewiesen.</p><div>{roleFit.missing.length?roleFit.missing.map(x=><span key={x}>{x}</span>):<small>Alle Profilkriterien sind bewertet.</small>}</div></details>
     <p className="asi-footnote">Die Rollenprofile sind ein fachlicher Startstandard und müssen durch Trainer/Scouting-Leitung an Spielmodell, Liga und Altersklasse angepasst werden. Bei geringer Abdeckung ist der Fit-Index besonders vorsichtig zu interpretieren.</p>
   </section>}
   {selected&&isGoalkeeper(selected)&&<section className="asi-panel asi-role-panel"><div className="asi-panel-heading"><div><span className="asi-eyebrow">GOALKEEPER INTELLIGENCE</span><h2>Torwart-Spezialprofil</h2></div><ShieldCheck size={20}/></div><p className="asi-role-intro">Torwartspezifische Kriterien werden getrennt von Feldspielerbewertungen erfasst. Die Rollenpassung nutzt nur diese spezialisierten Werte.</p><div className="asi-gk-note">Die 12 Torwartkriterien werden im Spielerprofil unter „Scouting-Bewertung“ gepflegt. Bestehende Feldspielerprofile bleiben unverändert.</div></section>}
   {selected&&<ContractIntelligencePanel supabase={supabase} player={selected} profile={profile} admin={admin} onNotice={onNotice}/>}
   {selected&&<section className="asi-panel asi-observation-panel">
     <div className="asi-panel-heading"><div><span className="asi-eyebrow">TALENT EVOLUTION</span><h2>Neue Beobachtung dokumentieren</h2></div><Clock3 size={20}/></div>
     <form onSubmit={saveObservation} className="asi-observation-form"><label>Beobachtungsdatum<input type="date" value={observationDate} onChange={e=>setObservationDate(e.target.value)} required/></label><label>Beobachtungsnotiz<textarea value={observation} onChange={e=>setObservation(e.target.value)} maxLength={5000} placeholder="Beobachtbare Spielsituationen, Kontext, Gegnerniveau und konkrete Beispiele – keine privaten Kontaktdaten."/></label><button type="submit" disabled={busy||savingObservation}>{savingObservation?<><RefreshCw size={15} className="asi-saving-icon"/> Wird gespeichert…</>:<><Save size={15}/> Beobachtung speichern</>}</button></form>
     <p className="asi-footnote">Die aktuelle Spielerbewertung wird als Snapshot mitgespeichert. Künftige Bewertungen können so zeitlich miteinander verglichen werden.</p>
   </section>}
   {selected&&<section className="asi-panel asi-trend-panel"><div className="asi-panel-heading"><div><span className="asi-eyebrow">LONGITUDINAL INTELLIGENCE</span><h2>Spielerentwicklung über längere Zeit</h2></div><Activity size={20}/></div>{!longTrend.ready?<p className="asi-empty">Für eine längerfristige Auswertung benötigen wir mindestens drei unterschiedliche Bewertungsstände über mindestens 30 Tage und gemeinsame gültige Kriterien. Aktuell: {longTrend.count} unterschiedliche Stände{longTrend.days!==undefined?' über '+longTrend.days+' Tage':''}. {longTrend.duplicates>0?longTrend.duplicates+' identische Mehrfacheinträge wurden ausgeschlossen.':''}</p>:<><div className="asi-evolution-meta"><span>Zeitraum: <strong>{new Date(longTrend.first.observed_on+'T12:00:00').toLocaleDateString('de-DE')} – {new Date(longTrend.last.observed_on+'T12:00:00').toLocaleDateString('de-DE')}</strong></span><span>Beobachtungen: <strong>{longTrend.count}</strong></span><span>Zeitraum: <strong>{longTrend.days} Tage</strong></span><span>Kriterien: <strong>{longTrend.criteriaCount}</strong></span></div><div className="asi-evolution-summary"><article><small>Gestiegen</small><strong>{longTrend.up}</strong><small>Kriterien mit höherem Endwert</small></article><article><small>Gesunken</small><strong>{longTrend.down}</strong><small>Kriterien mit niedrigerem Endwert</small></article><article><small>Stabil</small><strong>{longTrend.stable}</strong><small>Gleicher Start- und Endwert</small></article><article><small>Gleichgerichtet</small><strong>{longTrend.consistent}</strong><small>Alle erfassten Zwischenschritte in Endrichtung</small></article></div><div className="asi-evolution-sections">{longTrend.sections.map(s=><article key={s.section}><div><strong>{s.section}</strong><span>Ø Endveränderung {s.average>0?'+':''}{s.average.toFixed(2)}</span></div><div className="asi-evolution-criteria">{s.metrics.map(m=><span key={m.label}>{m.label}<strong className={m.delta>0?'positive':m.delta<0?'negative':'neutral'}>{m.delta>0?'+':''}{m.delta} · {m.points} Messpunkte</strong></span>)}</div></article>)}</div><p className="asi-footnote">Die Auswertung vergleicht je Kriterium den ersten und letzten gültigen Wert im Zeitraum. „Gleichgerichtet“ bedeutet nur, dass die beobachteten Zwischenschritte dieselbe Richtung wie die Endveränderung hatten. Fehlende Werte werden ausgelassen. Dies ist eine rückblickende Beschreibung, keine Prognose und kein Nachweis für Trainingswirkung.</p></>}</section>}
   {selected&&<section className="asi-panel asi-history-panel"><div className="asi-panel-heading"><div><span className="asi-eyebrow">TALENT EVOLUTION</span><h2>Beobachtungsverlauf</h2></div><Clock3 size={20}/></div>{observations.length===0?<p className="asi-empty">Noch keine Beobachtungen gespeichert. Neue Einträge erscheinen hier chronologisch.</p>:<div className="asi-history-list">{observations.map(o=><article className="asi-observation-entry" key={o.id}><div className="asi-result-top"><strong>{new Date(o.observed_on+'T12:00:00').toLocaleDateString('de-DE')}</strong><small>{o.source_type==='internal_scout'?'Interner Scout':'Quelle: '+o.source_type}</small></div>{o.observation&&<p>{o.observation}</p>}<small>{Object.keys(o.ratings||{}).length} Bewertungsfelder im Snapshot · erfasst {new Date(o.created_at).toLocaleString('de-DE')}</small></article>)}</div>}</section>}
   {selected&&<section className="asi-panel asi-evolution-panel"><div className="asi-panel-heading"><div><span className="asi-eyebrow">TALENT EVOLUTION</span><h2>Entwicklung zwischen Beobachtungen</h2></div><TrendingUp size={20}/></div>{(!evolution||evolution.insufficient)?<p className="asi-empty">Für einen Vergleich werden mindestens zwei unterschiedliche Bewertungsstände benötigt. Identische Mehrfachspeicherungen zählen nicht als neue Entwicklung.{evolution?.ignoredDuplicates>0&&<> {evolution.ignoredDuplicates} identische Mehrfacheinträge wurden ausgeschlossen.</>}</p>:evolution.comparable===0?<p className="asi-empty">Zwischen den letzten beiden Beobachtungen gibt es keine gemeinsamen gültigen Bewertungskriterien. Ein Vergleich wäre daher nicht belastbar.</p>:<><div className="asi-evolution-meta"><span>Vorher: <strong>{new Date(evolution.previous.observed_on+'T12:00:00').toLocaleDateString('de-DE')}</strong></span><span>Zuletzt: <strong>{new Date(evolution.latest.observed_on+'T12:00:00').toLocaleDateString('de-DE')}</strong></span><span>Verglichene Kriterien: <strong>{evolution.comparable}</strong></span>{evolution.ignoredDuplicates>0&&<span>Ausgeschlossene Duplikate: <strong>{evolution.ignoredDuplicates}</strong></span>}</div><div className="asi-evolution-summary"><article><small>Mittlere Veränderung</small><strong>{evolution.average>0?'+':''}{evolution.average.toFixed(2)}</strong><small>Skalenpunkte · 1 bis 5</small></article><article><small>Verbessert</small><strong>{evolution.improved}</strong><small>Kriterien mit höherem Wert</small></article><article><small>Unverändert</small><strong>{evolution.unchanged}</strong><small>Gleicher Wert</small></article><article><small>Niedriger</small><strong>{evolution.declined}</strong><small>Kriterien mit niedrigerem Wert</small></article></div><div className="asi-evolution-sections">{evolution.changes.filter(s=>s.items.length).map(s=><article key={s.section}><div><strong>{s.section}</strong><span>Ø {s.average>0?'+':''}{s.average.toFixed(2)}</span></div><div className="asi-evolution-criteria">{s.items.map(x=><span key={x.label}>{x.label}<strong className={x.delta>0?'positive':x.delta<0?'negative':'neutral'}>{x.delta>0?'+':''}{x.delta}</strong></span>)}</div></article>)}</div><p className="asi-footnote">Verglichen werden ausschließlich Kriterien, die in beiden letzten Beobachtungen gültige ganzzahlige Werte von 1–5 besitzen. Das ist eine deskriptive Veränderung und kein Beleg für Ursache, Prognose oder objektive Leistungsentwicklung.</p></>}</section>}
   {selected&&<section className="asi-panel asi-history-panel"><div className="asi-panel-heading"><div><span className="asi-eyebrow">MODEL HISTORY</span><h2>Frühere Analysen</h2></div><TrendingUp size={20}/></div>{loading?<p className="asi-empty">Analysen werden geladen…</p>:history.length===0?<p className="asi-empty">Für diesen Spieler gibt es noch keine gespeicherten ASI-Analysen.</p>:<div className="asi-history-list">{history.map(h=><button type="button" key={h.id} className={analysis?.id===h.id?'selected':''} onClick={()=>openHistory(h)}><span><strong>{h.analysis_type}</strong><small>{new Date(h.created_at).toLocaleString('de-DE')}</small></span><span>{h.model_version}</span></button>)}</div>}</section>}
   {admin&&<section className="asi-panel asi-quality-panel">
     <div className="asi-panel-heading"><div><span className="asi-eyebrow">META INTELLIGENCE · QUALITY GATE</span><h2>Daten- und Modellqualität</h2></div><ShieldCheck size={20}/></div>
     <p className="asi-quality-intro">Admin-Übersicht auf Basis der tatsächlich gespeicherten ASI-Datensätze. Interne Mindestschwellen sind konservative Prüfkriterien, keine statistische oder regulatorische Zertifizierung.</p>
     <div className="asi-quality-grid">
       <article><span>Beobachtungen</span><strong>{quality.observations}</strong><small>{quality.playersObserved} Spieler mit mindestens einer Beobachtung</small></article>
       <article><span>Zeitlich vergleichbar</span><strong>{quality.longitudinalPlayers}</strong><small>Spieler mit mindestens 2 Beobachtungen über mindestens 30 Tage</small></article>
       <article><span>Vollständige Ratings</span><strong>{quality.completeRatings}</strong><small>Beobachtungen mit allen aktiven Kriterien (34 Feldspieler / 46 Torwart)</small></article>
       <article><span>Prognose-Ergebnisse</span><strong>{quality.matchedOutcomes}</strong><small>Passende Prognose-/Ergebnispaare von {quality.outcomes} Ergebnissen</small></article>
       <article><span>Mittlerer absoluter Fehler</span><strong>{quality.mae===null?"–":quality.mae.toFixed(2)}</strong><small>{quality.mae===null?"Noch nicht berechenbar":"MAE · nur gleiche Metriken, "+quality.matchedOutcomes+" Paare"}</small></article>
       <article><span>Modell-Evaluationen</span><strong>{quality.passedEvaluations}/{quality.evaluations}</strong><small>Bestandene dokumentierte Prüfungen</small></article>
     </div>
     <div className="asi-quality-gates">
       <div><strong>Trainingsdatenbasis</strong><span className={quality.matchedOutcomes>=30&&quality.playersObserved>=10?"ready":"blocked"}>{quality.matchedOutcomes>=30&&quality.playersObserved>=10?"Mindestschwelle erreicht":"Gesperrt · benötigt ≥30 Ergebnispaare und ≥10 Spieler"}</span></div>
       <div><strong>Zeitliche Vergleichbarkeit</strong><span className={quality.longitudinalPlayers>=5?"ready":"blocked"}>{quality.longitudinalPlayers>=5?"Mindestschwelle erreicht":"Gesperrt · benötigt ≥5 Spieler mit ≥2 Beobachtungen über ≥30 Tage"}</span></div>
       <div><strong>Modellfreigabe</strong><span className={quality.passedEvaluations>0&&quality.matchedOutcomes>=30?"ready":"blocked"}>{quality.passedEvaluations>0&&quality.matchedOutcomes>=30?"Evaluation vorhanden – Admin-Prüfung erforderlich":"Gesperrt · bestandene unabhängige Evaluation und ausreichende Ergebnisbasis fehlen"}</span></div>
     </div>
     <div className="asi-scout-agreement">
       <div className="asi-panel-heading"><div><span className="asi-eyebrow">IDENTITY RESOLUTION · ADMIN ONLY</span><h3>Eindeutige Spieleridentität bestätigen</h3></div><ShieldCheck size={18}/></div>
       <p className="asi-footnote">Keine automatische Namens- oder Ähnlichkeitssuche: Verknüpfe zwei Datensätze nur, wenn verlässliche Nachweise bestätigen, dass sie dieselbe reale Person betreffen. Die Zuordnung bleibt für Scouts unsichtbar.</p>
       <div className="asi-identity-controls">
         <label>Neuer, noch nicht zugeordneter Datensatz<select value={identitySource} onChange={e=>setIdentitySource(e.target.value)}><option value="">Spieler auswählen…</option>{players.filter(p=>!identityLinks.some(x=>String(x.player_id)===String(p.player_id))).map(p=><option key={p.player_id} value={p.player_id}>{p.name} · {p.year||"Jahrgang unbekannt"} · {p.club||"Verein unbekannt"} · ID {p.player_id}</option>)}</select></label>
         <label>Vergleichsdatensatz<select value={identityTarget} onChange={e=>setIdentityTarget(e.target.value)}><option value="">Spieler auswählen…</option>{players.filter(p=>String(p.player_id)!==String(identitySource)).map(p=><option key={p.player_id} value={p.player_id}>{p.name} · {p.year||"Jahrgang unbekannt"} · {p.club||"Verein unbekannt"} · ID {p.player_id}{identityLinks.some(x=>String(x.player_id)===String(p.player_id))?" · Identität vorhanden":""}</option>)}</select></label>
         <label>Nachweis / Prüfvermerk<textarea value={identityReason} onChange={e=>setIdentityReason(e.target.value)} maxLength={1000} placeholder="z. B. eindeutige offizielle Spieler-ID oder geprüfter Verbandsnachweis – keine Kontaktdaten."/></label><button type="button" onClick={confirmPlayerIdentity} disabled={identityBusy||!identitySource||!identityTarget||identityReason.trim().length<12}>{identityBusy?"Wird geprüft…":"Identität sicher bestätigen"}</button>
       </div>
       <div className="asi-identity-status"><strong>{identityLinks.length}</strong><span>{identityLinks.filter(x=>identityStatuses.find(y=>String(y.id)===String(x.identity_id))?.identity_status==='confirmed').length} aktive Datensatz-Zuordnungen · {identityStatuses.filter(x=>x.identity_status==='confirmed').length} aktive / {identityStatuses.filter(x=>x.identity_status==='suspended').length} gesperrte zentrale Identitäten</span></div>
       <div className="asi-identity-audit"><h4>Identitätsverwaltung</h4>{identityStatuses.length===0?<p className="asi-empty">Noch keine zentrale Identität angelegt.</p>:identityStatuses.map(item=><article key={item.id}><span><strong>{item.identity_status==='suspended'?'Gesperrte Identität':'Aktive Identität'}</strong><small>{item.id} · aktualisiert {new Date(item.updated_at).toLocaleString('de-DE')}</small></span><button type="button" onClick={()=>setIdentityStatus(item.id,item.identity_status==='suspended'?'confirmed':'suspended')} disabled={identityBusy}>{item.identity_status==='suspended'?'Identität reaktivieren':'Identität sperren'}</button></article>)}</div>
       <div className="asi-identity-audit"><h4>Letzte Identitätsänderungen</h4>{identityAudit.length===0?<p className="asi-empty">Noch keine Identitätsänderungen protokolliert.</p>:identityAudit.map(item=><article key={item.id}><span><strong>{item.action==='linked'?'Zuordnung bestätigt':item.action==='unlinked'?'Zuordnung aufgehoben':item.action==='identity_suspended'?'Zentrale Identität gesperrt':'Zentrale Identität reaktiviert'} · Spieler-ID {item.player_id}</strong><small>{new Date(item.created_at).toLocaleString('de-DE')}</small></span><p>{item.reason}</p>{item.action==='linked'&&identityLinks.some(x=>String(x.player_id)===String(item.player_id))&&<button type="button" onClick={()=>correctPlayerIdentity(item.player_id)} disabled={identityBusy}>Zuordnung korrigieren</button>}</article>)}</div>
       <div className="asi-panel-heading"><div><span className="asi-eyebrow">SCOUT CALIBRATION</span><h3>Vergleichbarkeit von Scoutbewertungen</h3></div><Activity size={18}/></div>
       <div className="asi-quality-grid">
         <article><span>Verglichene Kriterien</span><strong>{quality.scoutAgreement.comparisons}</strong><small>Gleiche bestätigte zentrale Spieleridentität, unterschiedliche Scouts, maximal 14 Tage Abstand</small></article>
         <article><span>Spieler im Vergleich</span><strong>{quality.scoutAgreement.pairedPlayers}</strong><small>Mit mindestens zwei unterschiedlichen Bewertenden</small></article>
         <article><span>Scout-Paare</span><strong>{quality.scoutAgreement.scoutPairs}</strong><small>Anzahl unterschiedlicher Bewerterpaare</small></article>
         <article><span>Mittlere Abweichung</span><strong>{quality.scoutAgreement.meanAbsoluteDifference===null?"–":quality.scoutAgreement.meanAbsoluteDifference.toFixed(2)}</strong><small>Absolute Skalenpunkte auf 1–5</small></article>
         <article><span>Abweichung höchstens 1 Punkt</span><strong>{quality.scoutAgreement.withinOne===null?"–":quality.scoutAgreement.withinOne+"%"}</strong><small>Anteil der vergleichbaren Kriterien</small></article>
       </div>
       <p className="asi-footnote">{quality.scoutAgreement.comparisons<30?"Noch keine belastbare Auswertung: mindestens 30 vergleichbare Kriterien aus zeitnahen Bewertungen unterschiedlicher Scouts sind als interne Mindestschwelle vorgesehen.":"Deskriptive Übereinstimmung erreicht die interne Mindestmenge; sie ist keine Rangliste und beweist weder Scoutqualität noch Bewertungsrichtigkeit."} Nur manuell bestätigte zentrale Spieleridentitäten werden verglichen; nicht zugeordnete Datensätze bleiben außen vor. Es werden keine einzelnen Scouts bewertet oder öffentlich verglichen. Unterschiedliche Spielsituationen, Gegnerniveau und Beobachtungsbedingungen können Abweichungen erklären.</p>
     </div>
     <p className="asi-footnote">Der MAE wird nur aus Prognosen und später erfassten Ergebnissen derselben Metrik berechnet. Ohne passende Paare bleibt er leer. Kleine Stichproben werden nicht als Leistungsnachweis gewertet. Trainingsläufe bisher: {quality.trainingRuns}. {quality.loading?"Daten werden aktualisiert.":""}</p>
   </section>}
   {admin&&<section className="asi-admin-grid"><section className="asi-panel"><div className="asi-panel-heading"><div><span className="asi-eyebrow">META INTELLIGENCE</span><h2>Modellregister</h2></div><ShieldCheck size={20}/></div>{models.length===0?<p className="asi-empty">Noch keine Modellversionen registriert.</p>:models.map(m=><div className="asi-model-row" key={m.id}><span><strong>{m.model_key} · {m.version}</strong><small>{m.model_family}</small></span><span className={'asi-model-status '+m.status}>{m.status}</span></div>)}</section><section className="asi-panel"><div className="asi-panel-heading"><div><span className="asi-eyebrow">HYBRID DATA</span><h2>Externe Datenquellen</h2></div><Database size={20}/></div>{externalSources.length===0?<p className="asi-empty">Noch keine Datenquelle registriert. Externe Quellen werden erst nach Lizenz- und Datenschutzprüfung freigeschaltet.</p>:externalSources.map(s=><div className="asi-model-row" key={s.id}><span><strong>{s.source_name}</strong><small>{s.provider||s.source_type}</small></span><span className={'asi-model-status '+s.license_status}>{s.license_status}</span></div>)}</section></section>}
 </section>;
}
