import React,{useCallback,useEffect,useState} from 'react';
import {FileCheck2,RefreshCw,ShieldAlert,Clock3,Plus,CheckCircle2,XCircle} from 'lucide-react';
import {CONTRACT_STATE_LABELS,deriveContractHorizon,assessContractEvidence} from './contractIntelligence.js';

const statusOptions=Object.entries(CONTRACT_STATE_LABELS);
const dateLabel=value=>value?new Date(value+'T12:00:00').toLocaleDateString('de-DE'):'Nicht bekannt';

export default function ContractIntelligencePanel({supabase,player,profile,admin=false,onNotice=()=>{}}){
 const [rows,setRows]=useState([]);
 const [evidence,setEvidence]=useState([]);
 const [loading,setLoading]=useState(false);
 const [saving,setSaving]=useState(false);
 const [status,setStatus]=useState('unknown');
 const [club,setClub]=useState(player?.club||'');
 const [parentClub,setParentClub]=useState('');
 const [start,setStart]=useState('');
 const [end,setEnd]=useState('');
 const [source,setSource]=useState('');
 const [note,setNote]=useState('');
 const [verification,setVerification]=useState('unconfirmed');
 const [showForm,setShowForm]=useState(false);

 const load=useCallback(async()=>{
  if(!supabase||!player?.player_id)return;
  setLoading(true);
  const [contracts,claims]=await Promise.all([
   supabase.from('asi_contract_snapshots').select('*').eq('player_id',player.player_id).order('created_at',{ascending:false}).limit(20),
   admin?supabase.from('asi_external_evidence').select('id,player_id,claim_type,claim_title,claim_text,event_date,published_at,source_url,publisher,identity_status,verification_status,review_status,data_classification,legal_review_status,created_at').eq('player_id',player.player_id).eq('review_status','pending').order('created_at',{ascending:false}).limit(20):Promise.resolve({data:[],error:null})
  ]);
  if(contracts.error)onNotice('Vertragsdaten konnten nicht geladen werden: '+contracts.error.message);
  else setRows(contracts.data||[]);
  if(!claims.error)setEvidence(claims.data||[]);
  setLoading(false);
 },[supabase,player?.player_id,admin,onNotice]);

 useEffect(()=>{setClub(player?.club||'');load();},[player?.player_id,load]);

 async function saveContract(e){
  e.preventDefault();if(!admin||saving||!player?.owner_id)return;
  if(start&&end&&end<start){onNotice('Das Vertragsende darf nicht vor dem Vertragsbeginn liegen.');return;}
  if(!source.trim()||!/^https?:\/\//i.test(source.trim())){onNotice('Bitte eine gültige Quellen-URL eintragen.');return;}
  setSaving(true);
  const {error}=await supabase.from('asi_contract_snapshots').insert({
   player_id:player.player_id,owner_id:player.owner_id,evidence_id:null,
   contract_status:status,club_name:club.trim()||null,parent_club_name:parentClub.trim()||null,
   contract_start:start||null,contract_end:end||null,source_url:source.trim(),
   confidence:null,verification_status:verification,is_current:true,recorded_by:profile?.id||null,
   option_details:note.trim()||null
  });
  if(error)onNotice('Vertragsstatus konnte nicht gespeichert werden: '+error.message);
  else{onNotice('Vertragsinformation wurde gespeichert.');setShowForm(false);setSource('');setNote('');await load();}
  setSaving(false);
 }

 async function reviewClaim(item,decision){
  if(!admin)return;
  const reason=decision==='approve'?'Durch Admin geprüft und freigegeben.':'Durch Admin abgelehnt.';
  const {error:reviewError}=await supabase.from('asi_evidence_reviews').insert({evidence_id:item.id,reviewer_id:profile.id,decision:decision==='approve'?'approve':'reject',reason,previous_state:{review_status:item.review_status,verification_status:item.verification_status}});
  if(reviewError){onNotice('Prüfentscheidung konnte nicht protokolliert werden: '+reviewError.message);return;}
  const {error:updateError}=await supabase.from('asi_external_evidence').update({review_status:decision==='approve'?'approved':'rejected',reviewed_by:profile.id,reviewed_at:new Date().toISOString()}).eq('id',item.id);
  if(updateError)onNotice('Prüfstatus konnte nicht aktualisiert werden: '+updateError.message);
  else{onNotice(decision==='approve'?'Beleg freigegeben.':'Beleg abgelehnt.');await load();}
 }

 const current=rows.find(x=>x.is_current)||rows[0]||null;
 const horizon=deriveContractHorizon(current?.contract_end);
 return <section className="asi-panel asi-contract-panel">
  <div className="asi-panel-heading"><div><span className="asi-eyebrow">CONTRACT INTELLIGENCE</span><h2>Vertrags- und Transfersituation</h2></div><FileCheck2 size={20}/></div>
  {!current?<p className="asi-empty">Für diesen Spieler liegt noch kein bestätigter Vertragsdatensatz vor. Fehlende Angaben werden nicht geschätzt.</p>:<>
   <div className="asi-contract-summary">
    <article><small>Vertragsstatus</small><strong>{CONTRACT_STATE_LABELS[current.contract_status]||current.contract_status}</strong></article>
    <article><small>Verein</small><strong>{current.club_name||'Nicht bekannt'}</strong></article>
    <article><small>Vertragsende</small><strong>{dateLabel(current.contract_end)}</strong></article>
    <article><small>Restlaufzeit</small><strong>{horizon.daysRemaining===null?'Unbekannt':horizon.daysRemaining<0?'Abgelaufen':horizon.daysRemaining+' Tage'}</strong></article>
   </div>
   <p className="asi-footnote">{horizon.label}. Status: {current.verification_status}. Quelle: {current.source_url?<a href={current.source_url} target="_blank" rel="noreferrer">Nachweis öffnen</a>:'Keine Quellenadresse hinterlegt'}. Erfasst: {new Date(current.created_at).toLocaleString('de-DE')}.</p>
   {current.parent_club_name&&<p>Stammverein bei Leihe: <strong>{current.parent_club_name}</strong></p>}
   {current.option_details&&<p>{current.option_details}</p>}
  </>}
  {rows.length>1&&<details className="asi-contract-history"><summary>Frühere Vertragsstände ({rows.length-1})</summary>{rows.slice(1).map(r=><article key={r.id}><strong>{CONTRACT_STATE_LABELS[r.contract_status]||r.contract_status}</strong><span>{dateLabel(r.contract_end)} · {r.verification_status}</span></article>)}</details>}
  {admin&&<div className="asi-contract-admin">
   <button type="button" className="asi-action" onClick={()=>setShowForm(v=>!v)}><Plus size={15}/> Vertragsstand erfassen</button>
   {showForm&&<form className="asi-contract-form" onSubmit={saveContract}>
    <label>Vertragsstatus<select value={status} onChange={e=>setStatus(e.target.value)}>{statusOptions.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
    <label>Verein<input value={club} onChange={e=>setClub(e.target.value)} maxLength={160}/></label>
    <label>Stammverein bei Leihe<input value={parentClub} onChange={e=>setParentClub(e.target.value)} maxLength={160}/></label>
    <div className="asi-contract-dates"><label>Vertragsbeginn<input type="date" value={start} onChange={e=>setStart(e.target.value)}/></label><label>Vertragsende<input type="date" value={end} onChange={e=>setEnd(e.target.value)}/></label></div>
    <label>Quellen-URL (Pflichtfeld)<input type="url" required value={source} onChange={e=>setSource(e.target.value)} placeholder="https://…"/></label>
    <label>Quellenstatus<select value={verification} onChange={e=>setVerification(e.target.value)}><option value="unconfirmed">Nicht bestätigt</option><option value="corroborated">Mehrfach belegt</option><option value="confirmed">Offiziell bestätigt</option><option value="conflicting">Widersprüchlich</option><option value="outdated">Veraltet</option></select></label>
    <label>Zusätzliche Hinweise<textarea value={note} onChange={e=>setNote(e.target.value)} maxLength={1200}/></label>
    <button className="asi-action" disabled={saving}>{saving?'Speichert…':'Vertragsstand speichern'}</button>
   </form>}
  </div>}
  {admin&&<div className="asi-evidence-review">
   <div className="asi-panel-heading"><div><span className="asi-eyebrow">EVIDENCE REVIEW</span><h3>Offene Quellenprüfung</h3></div><ShieldAlert size={18}/></div>
   {evidence.length===0?<p className="asi-empty">Keine offenen externen Belege für diesen Spieler.</p>:evidence.map(item=>{
    const assessment=assessContractEvidence(item);
    return <article className="asi-evidence-item" key={item.id}><div><strong>{item.claim_title}</strong><p>{item.claim_text}</p><small>{item.publisher||'Unbekannte Quelle'} · {dateLabel(item.event_date)} · {item.verification_status} · {item.identity_status}</small><a href={item.source_url} target="_blank" rel="noreferrer">Quelle öffnen</a>{assessment.issues.length>0&&<small className="asi-evidence-warning">{assessment.issues.join(' · ')}</small>}</div><div className="asi-evidence-actions"><button type="button" disabled={!assessment.usable} onClick={()=>reviewClaim(item,'approve')} title="Beleg freigeben"><CheckCircle2 size={17}/></button><button type="button" onClick={()=>reviewClaim(item,'reject')} title="Beleg ablehnen"><XCircle size={17}/></button></div></article>;
   })}
  </div>}
  <div className="asi-contract-footer"><span><Clock3 size={14}/> {loading?'Aktualisiert…':'Datenstand wird bei jedem Profilaufruf geladen'}</span><button type="button" onClick={load} disabled={loading}><RefreshCw size={14}/> Aktualisieren</button></div>
  <p className="asi-footnote">Vertragsangaben sind nur so zuverlässig wie ihre Quellen. Gerüchte sind keine bestätigten Verhandlungen. Ein möglicher Einfluss auf Motivation oder Leistung wird nicht aus dem Vertragsstatus abgeleitet; dafür sind getrennte, ausreichend große Leistungszeitreihen und eine menschliche Bewertung erforderlich.</p>
 </section>;
}
