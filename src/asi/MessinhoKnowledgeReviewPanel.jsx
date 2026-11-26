import React,{useCallback,useEffect,useMemo,useState} from 'react';
import {BookOpenCheck,RefreshCw,ShieldCheck,CheckCircle2,XCircle,GitBranch} from 'lucide-react';
import './messinho.css';

export default function MessinhoKnowledgeReviewPanel({supabase,profile}){
 const [candidates,setCandidates]=useState([]);
 const [conflicts,setConflicts]=useState([]);
 const [busy,setBusy]=useState(false);
 const [reviewing,setReviewing]=useState('');
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [candidateReasons,setCandidateReasons]=useState({});
 const [conflictReasons,setConflictReasons]=useState({});

 const request=useCallback(async(path,method='GET',body=null)=>{
  const {data:{session}}=await supabase.auth.getSession();
  if(!session?.access_token)throw new Error('Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.');
  const options={method,headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token}};
  if(body!==null)options.body=JSON.stringify(body);
  const response=await fetch(path,options);
  const payload=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(payload.error||'Wissensprüfung konnte nicht ausgeführt werden.');
  return payload;
 },[supabase]);

 const load=useCallback(async()=>{
  if(profile?.role!=='admin')return;
  setBusy(true);setError('');
  try{
   const [candidatePayload,conflictPayload]=await Promise.all([
    request('/api/messinho/knowledge-concepts?status=candidate&limit=50'),
    request('/api/messinho/knowledge-conflicts?status=open')
   ]);
   setCandidates(candidatePayload.concepts||[]);
   setConflicts(conflictPayload.conflicts||[]);
  }catch(e){setError(e.message||'Wissensprüfung konnte nicht geladen werden.');}
  finally{setBusy(false);}
 },[profile?.role,request]);

 useEffect(()=>{load();},[load]);

 const reviewCandidate=async(item,decision)=>{
  const defaultReason={
   approve:'Fachinhalt, zwei unabhängige Belege, Nutzungsrechte und Grundlagen geprüft.',
   reject:'Fachprüfung: Inhalt oder Quellenlage erfüllt die Freigabekriterien nicht.'
  }[decision];
  const reason=String(candidateReasons[item.id]||defaultReason).trim();
  if(reason.length<10){setError('Bitte eine nachvollziehbare Prüfbegründung mit mindestens 10 Zeichen eintragen.');return;}
  setReviewing(item.id);setError('');setNotice('');
  try{
   const result=await request('/api/messinho/knowledge/'+encodeURIComponent(item.id)+'/review','POST',{decision,reason});
   setNotice(result.message||'Prüfentscheidung gespeichert.');
   await load();
  }catch(e){setError(e.message||'Prüfentscheidung konnte nicht gespeichert werden.');}
  finally{setReviewing('');}
 };

 const resolveConflict=async(item,decision)=>{
  const defaultReason=decision==='keep_existing'
   ?'Bestehender, freigegebener Wissensstand nach Quellenvergleich bestätigt.'
   :'Neuer Vorschlag nach Quellen- und Fachprüfung abgelehnt.';
  const reason=String(conflictReasons[item.id]||defaultReason).trim();
  if(reason.length<10){setError('Bitte eine nachvollziehbare Konfliktbegründung mit mindestens 10 Zeichen eintragen.');return;}
  setReviewing(item.id);setError('');setNotice('');
  try{
   const result=await request('/api/messinho/knowledge-conflicts/'+encodeURIComponent(item.id)+'/review','POST',{decision,reason});
   setNotice(result.message||'Konfliktentscheidung gespeichert.');
   await load();
  }catch(e){setError(e.message||'Konfliktentscheidung konnte nicht gespeichert werden.');}
  finally{setReviewing('');}
 };

 const summary=useMemo(()=>candidates.length+' Kandidaten · '+conflicts.length+' offene Konflikte',[candidates.length,conflicts.length]);
 if(profile?.role!=='admin')return null;

 return <section className="messinho-knowledge-review">
  <details>
   <summary className="messinho-knowledge-review-summary">
    <span><strong><BookOpenCheck size={16}/> MESSINHO · Wissensprüfung</strong><small>{summary} · Nur Admin · Kandidaten bleiben bis zur Freigabe inaktiv</small></span>
    <span className="messinho-help-chevron">⌄</span>
   </summary>
   <div className="messinho-knowledge-review-body">
    <div className="messinho-knowledge-review-toolbar">
     <p>Prüfe Fachinhalt, Voraussetzungen, Belege und Nutzungsrechte. Nur freigegebene Einträge werden als vertrauenswürdiges Wissen genutzt.</p>
     <button type="button" className="secondary" onClick={load} disabled={busy||!!reviewing}><RefreshCw size={14}/>{busy?'Lädt …':'Aktualisieren'}</button>
    </div>
    {error&&<p role="alert" className="messinho-error">{error}</p>}
    {notice&&<p role="status" className="messinho-knowledge-notice">{notice}</p>}

    <div className="messinho-knowledge-queue">
     <div className="messinho-knowledge-queue-heading"><strong><ShieldCheck size={15}/> Wissenskandidaten ({candidates.length})</strong><small>Freigabe, Ablehnung oder Sperrvermerk</small></div>
     {!candidates.length&&!busy&&<small>Keine offenen Wissenskandidaten vorhanden.</small>}
     {candidates.map(item=>{
      const rights=Array.isArray(item.rights?.source_rights)?item.rights.source_rights:[];
      const rightsById=new Map(rights.map(row=>[row.source_id,row]));
      return <article key={item.id} className="messinho-knowledge-candidate">
       <div className="messinho-knowledge-candidate-heading">
        <div><strong>{item.title}</strong><small>{item.domain} · {item.topic} · {item.knowledge_level} · Version {item.version}</small></div>
        <span className="messinho-knowledge-status">{item.knowledge_status}</span>
       </div>
       <p>{item.definition}</p>
       <div className="messinho-knowledge-facts">
        <span>Typ: {item.knowledge_type}</span>
        <span>Konfidenz: {Math.round((Number(item.confidence)||0)*100)}%</span>
        <span>Beleggrad: {item.evidence_grade||'–'}</span>
       </div>
       {item.formula&&<div className="messinho-knowledge-formula"><b>Formel</b><code>{item.formula}</code></div>}
       {item.prerequisites?.length>0&&<div className="messinho-knowledge-prerequisites"><b>Voraussetzungen</b><span>{item.prerequisites.join(' · ')}</span></div>}
       {!!item.claims?.length&&<div className="messinho-knowledge-evidence"><b>Belegte Aussagen</b>{item.claims.map((claim,index)=><p key={index}>{claim.text}<small>{claim.source_urls?.length||0} Quellenbelege</small></p>)}</div>}
       <div className="messinho-knowledge-sources"><b>Quellen und Rechte</b>
        {(item.sources||[]).map((source,index)=>{
         const right=rightsById.get(source.source_id)||{};
         return <div key={source.source_id||index}>
          <a href={source.url} target="_blank" rel="noreferrer">{source.title||source.source_id||'Quelle öffnen'}</a>
          <small>{right.license||'Lizenz nicht hinterlegt'} · {right.rights_holder||'Rechteinhaber nicht hinterlegt'}</small>
          <small>{right.retrieval_method||'Abrufweg nicht hinterlegt'} · TDM-Nachweis {right.tdm_evidence_url?'vorhanden':'fehlt'}</small>
          <small>Rechteprüfung bis {right.review_due_at||'nicht festgelegt'}</small>
         </div>;
        })}
       </div>
       {item.limitations?.length>0&&<div className="messinho-knowledge-limitations"><b>Grenzen</b><ul>{item.limitations.map((limit,index)=><li key={index}>{limit}</li>)}</ul></div>}
       <label className="messinho-knowledge-reason">Prüfbegründung<textarea rows={2} maxLength={500} value={candidateReasons[item.id]||''} onChange={e=>setCandidateReasons(prev=>({...prev,[item.id]:e.target.value}))} placeholder="Begründung wird beim Freigeben oder Ablehnen gespeichert …"/></label>
       <div className="messinho-knowledge-actions">
        <button type="button" disabled={!!reviewing||busy} onClick={()=>reviewCandidate(item,'approve')}><CheckCircle2 size={14}/>{reviewing===item.id?'Prüft …':'Freigeben'}</button>
        <button type="button" className="danger" disabled={!!reviewing||busy} onClick={()=>reviewCandidate(item,'reject')}><XCircle size={14}/>Ablehnen</button>
       </div>
      </article>;
     })}
    </div>

    <div className="messinho-knowledge-queue">
     <div className="messinho-knowledge-queue-heading"><strong><GitBranch size={15}/> Offene Wissenskonflikte ({conflicts.length})</strong><small>Bestehendes Wissen bleibt bis zur Entscheidung gesperrt</small></div>
     {!conflicts.length&&!busy&&<small>Keine offenen Wissenskonflikte vorhanden.</small>}
     {conflicts.map(item=>{
      const proposal=item.proposed_concept||{};
      const proposedSources=Array.isArray(proposal.sources)?proposal.sources:[];
      return <article key={item.id} className="messinho-knowledge-conflict">
       <div className="messinho-knowledge-candidate-heading"><strong>{proposal.title||'Konkurrierender Wissensvorschlag'}</strong><span className="messinho-knowledge-status">offen</span></div>
       <small>{proposal.domain||'–'} · {proposal.topic||'–'} · Konzept {item.concept_id}</small>
       <p>{item.conflict_reason}</p>
       {proposal.definition&&<p>{proposal.definition}</p>}
       {!!proposedSources.length&&<div className="messinho-knowledge-sources"><b>Neue Quellen</b>{proposedSources.map((source,index)=><div key={source.source_id||index}><a href={source.url} target="_blank" rel="noreferrer">{source.title||source.source_id}</a><small>{source.license||'Lizenzprüfung siehe Rechte-Metadaten'}</small></div>)}</div>}
       <label className="messinho-knowledge-reason">Konfliktbegründung<textarea rows={2} maxLength={500} value={conflictReasons[item.id]||''} onChange={e=>setConflictReasons(prev=>({...prev,[item.id]:e.target.value}))} placeholder="Begründung wird beim Entscheiden gespeichert …"/></label>
       <div className="messinho-knowledge-actions">
        <button type="button" className="secondary" disabled={!!reviewing||busy} onClick={()=>resolveConflict(item,'keep_existing')}>Bestehenden Stand bestätigen</button>
        <button type="button" className="danger" disabled={!!reviewing||busy} onClick={()=>resolveConflict(item,'reject_proposal')}>Neuen Vorschlag ablehnen</button>
       </div>
      </article>;
     })}
    </div>
   </div>
  </details>
 </section>;
}
