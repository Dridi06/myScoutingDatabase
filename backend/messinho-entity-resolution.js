/**
 * MESSINHO Entity Reference Resolution — evidence-bounded and non-persistent.
 * Only resolves entities already grounded in owner-scoped conversation metadata
 * or owner-scoped active agent memory. It never guesses an identity from a name-like
 * phrase and never grants permissions or triggers an action.
 */
export const MESSINHO_ENTITY_RESOLUTION_VERSION='1.0.0';

const MAX_HISTORY=12;
const MAX_ENTITIES=16;
const MAX_NAME=120;

function clean(value,max=MAX_NAME){
  return String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
}
function normalize(value){
  return clean(value,300).normalize('NFKC').toLocaleLowerCase()
    .replace(/[’']/gu,'').normalize('NFD').replace(/[\u0300-\u036f]/gu,'')
    .replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
}
function makeCandidate(raw,type,source,recency=0){
  if(!raw||typeof raw!=='object')return null;
  const name=clean(raw.name||raw.player_name||raw.club_name||raw.team_name||raw.label);
  if(!name)return null;
  const entityType=['player','club','team'].includes(type)?type:null;
  if(!entityType)return null;
  const idValue=raw.id??raw.player_id??raw.club_id??raw.team_id??null;
  const id=idValue===null||idValue===undefined?'':String(idValue).slice(0,80);
  return {
    entity_type:entityType,id:id||null,name,
    source,recency,
    current_club:entityType==='player'?clean(raw.current_club||raw.club?.name||raw.club,MAX_NAME)||null:null,
    current_team:entityType==='player'?clean(raw.current_team||raw.team?.name||raw.team,MAX_NAME)||null:null
  };
}
function addCandidate(list,candidate){
  if(!candidate)return;
  const key=candidate.entity_type+':'+(candidate.id||normalize(candidate.name));
  const existing=list.find(item=>(item.entity_type+':'+(item.id||normalize(item.name)))===key);
  if(existing){
    existing.recency=Math.max(existing.recency,candidate.recency);
    if(!existing.sources.includes(candidate.source))existing.sources.push(candidate.source);
    existing.current_club=existing.current_club||candidate.current_club;
    existing.current_team=existing.current_team||candidate.current_team;
    return;
  }
  list.push({...candidate,sources:[candidate.source]});
}
function collectCandidates(history,activeEntities){
  const found=[];
  const active=activeEntities&&typeof activeEntities==='object'?activeEntities:{};
  addCandidate(found,makeCandidate({id:active.player_id,name:active.player_name,current_club:active.current_club||active.club_name,current_team:active.current_team||active.team_name},'player','owner_scoped_active_memory',MAX_HISTORY+1));
  addCandidate(found,makeCandidate({id:active.club_id,name:active.club_name||active.club?.name},'club','owner_scoped_active_memory',MAX_HISTORY+1));
  addCandidate(found,makeCandidate({id:active.team_id,name:active.team_name||active.team?.name},'team','owner_scoped_active_memory',MAX_HISTORY+1));
  for(const item of Array.isArray(active.entities)?active.entities.slice(0,MAX_ENTITIES):[]){
    addCandidate(found,makeCandidate(item,item?.entity_type,'owner_scoped_active_memory',MAX_HISTORY+1));
  }
  const turns=(Array.isArray(history)?history:[]).slice(-MAX_HISTORY);
  turns.forEach((turn,index)=>{
    const context=turn?.researchContext&&typeof turn.researchContext==='object'?turn.researchContext:{};
    const recency=index+1;
    addCandidate(found,makeCandidate(context.player,'player','recent_research_context',recency));
    addCandidate(found,makeCandidate(context.club,'club','recent_research_context',recency));
    addCandidate(found,makeCandidate(context.team,'team','recent_research_context',recency));
    for(const entity of Array.isArray(context.entities)?context.entities.slice(0,MAX_ENTITIES):[]){
      addCandidate(found,makeCandidate(entity,entity?.entity_type,'recent_research_context',recency));
    }
  });
  const related=[];
  for(const candidate of found.filter(item=>item.entity_type==='player')){
    if(candidate.current_club)addCandidate(related,makeCandidate({name:candidate.current_club},'club','player_current_club_relation',candidate.recency));
    if(candidate.current_team)addCandidate(related,makeCandidate({name:candidate.current_team},'team','player_current_team_relation',candidate.recency));
  }
  for(const candidate of related)addCandidate(found,candidate);
  return found.sort((a,b)=>b.recency-a.recency).slice(0,MAX_ENTITIES);
}

const PLAYER_REFERENCE=/(?:\b(?:er|ihn|ihm|sein(?:e|en|er|es)?|he|him|his|il|lui|son|sa|él|lo|le|su)\b|هو|هي|هذا اللاعب|ذلك اللاعب|متاعو|متاعها|عمرو|عمره|عمرها|houwa|howa|hedha)/iu;
const PLAYER_NOUN_REFERENCE=/\b(?:dieser spieler|der spieler|the player|that player|this player|ce joueur|el jugador|ese jugador)\b/iu;
const CLUB_REFERENCE=/(?:\b(?:sein verein|seine mannschaft|sein team|der verein|die mannschaft|das team|his club|his team|the club|the team|son club|son equipe|son équipe|el club|su equipo|la squadra)\b|الفريق|النادي|فريقو|ناديه)/iu;
const GENERIC_REFERENCE=/(?:\b(?:das von vorhin|der von vorhin|die von vorhin|dazu|davon|darauf|that one|the one from before|what about that|ça|cela|celui la|celui-là|eso|aquello)\b|هذا من قبل|اللي قبل|الحاجة هذي)/iu;
const CONTRAST_REFERENCE=/(?:\b(?:der andere|die andere|das andere|den anderen|dem anderen|the other one|the other player|l autre|l'autre|el otro|la otra)\b|الآخر|الاخر|اللاعب الآخر)/iu;

function hasPattern(pattern,text){return pattern.test(text);}
function containsName(message,name){
  const hay=' '+normalize(message)+' ',needle=' '+normalize(name)+' ';
  return needle.trim().length>1&&hay.includes(needle);
}
function result({status,referenceType=null,candidate=null,candidates=[],evidence=[],confidence=0,reason}) {
  return {
    version:MESSINHO_ENTITY_RESOLUTION_VERSION,
    status,reference_detected:referenceType!==null,
    reference_type:referenceType,
    entity:candidate?{entity_type:candidate.entity_type,id:candidate.id,name:candidate.name}:null,
    candidates:candidates.slice(0,5).map(item=>({entity_type:item.entity_type,id:item.id,name:item.name})),
    confidence,
    evidence:[...new Set(evidence)].slice(0,6),
    reason
  };
}
export function resolveMessinhoEntityReferences({message,history=[],activeEntities={}}={}){
  const text=clean(message,1200);
  if(!text)return result({status:'not_applicable',reason:'empty_message'});
  const entities=collectCandidates(history,activeEntities);
  const playerRef=hasPattern(PLAYER_REFERENCE,text);
  const clubRef=hasPattern(CLUB_REFERENCE,text);
  const genericRef=hasPattern(GENERIC_REFERENCE,text);
  const contrastRef=hasPattern(CONTRAST_REFERENCE,text);
  const playerNounRef=hasPattern(PLAYER_NOUN_REFERENCE,text);
  const hasReferentialSignal=playerRef||clubRef||genericRef||contrastRef;
  const hasReferenceSignal=hasReferentialSignal||playerNounRef;
  const direct=entities.filter(item=>containsName(text,item.name));
  if(direct.length===1&&!hasReferentialSignal)return result({status:'resolved',referenceType:direct[0].entity_type,candidate:direct[0],evidence:direct[0].sources,confidence:0.99,reason:'explicit_known_entity_mention'});
  if(direct.length>1&&!hasReferentialSignal)return result({status:'not_applicable',reason:'multiple_entities_explicitly_named'});
  if(direct.length>1&&hasReferentialSignal)return result({status:'ambiguous',referenceType:'multiple',candidates:direct,evidence:direct.flatMap(item=>item.sources),reason:'multiple_known_entities_with_pronoun'});
  if(direct.length===1&&playerRef&&direct[0].entity_type==='player'){
    const players=entities.filter(item=>item.entity_type==='player');
    return result({status:'ambiguous',referenceType:'player',candidates:players,evidence:players.flatMap(item=>item.sources),reason:'pronoun_and_explicit_player_name_need_disambiguation'});
  }
  if(direct.length===1&&clubRef&&(direct[0].entity_type==='club'||direct[0].entity_type==='team'))return result({status:'resolved',referenceType:direct[0].entity_type,candidate:direct[0],evidence:direct[0].sources,confidence:0.99,reason:'explicit_known_club_or_team_mention'});
  if(direct.length===1&&hasReferentialSignal)return result({status:'ambiguous',referenceType:direct[0].entity_type,candidates:[direct[0]],evidence:direct[0].sources,reason:'explicit_name_does_not_uniquely_resolve_pronoun'});
  if(!hasReferenceSignal)return result({status:'not_applicable',reason:'no_reference_signal'});
  if(clubRef){
    const clubs=entities.filter(item=>item.entity_type==='club'||item.entity_type==='team');
    if(clubs.length===1)return result({status:'resolved',referenceType:clubs[0].entity_type,candidate:clubs[0],evidence:clubs[0].sources,confidence:0.93,reason:'unique_club_or_team_reference'});
    return result({status:clubs.length?'ambiguous':'unresolved',referenceType:'club_or_team',candidates:clubs,evidence:clubs.flatMap(item=>item.sources),reason:clubs.length?'multiple_club_or_team_candidates':'no_grounded_club_or_team'});
  }
  if(contrastRef){
    const players=entities.filter(item=>item.entity_type==='player');
    const active=players.filter(item=>item.sources.includes('owner_scoped_active_memory'));
    if(players.length===2&&active.length===1){
      const other=players.find(item=>item!==active[0]);
      return result({status:'resolved',referenceType:'player',candidate:other,evidence:[...other.sources,'contrast_to_active_entity'],confidence:0.9,reason:'other_player_relative_to_active_entity'});
    }
    return result({status:players.length?'ambiguous':'unresolved',referenceType:'player',candidates:players,evidence:players.flatMap(item=>item.sources),reason:players.length?'contrast_target_not_unique':'no_grounded_player_for_contrast'});
  }
  if(playerRef||playerNounRef){
    const players=entities.filter(item=>item.entity_type==='player');
    if(players.length===1)return result({status:'resolved',referenceType:'player',candidate:players[0],evidence:players[0].sources,confidence:0.94,reason:'unique_player_reference'});
    return result({status:players.length?'ambiguous':'unresolved',referenceType:'player',candidates:players,evidence:players.flatMap(item=>item.sources),reason:players.length?'multiple_player_candidates':'no_grounded_player_candidate'});
  }
  const all=entities;
  if(all.length===1)return result({status:'resolved',referenceType:all[0].entity_type,candidate:all[0],evidence:all[0].sources,confidence:0.86,reason:'unique_recent_entity_for_generic_reference'});
  return result({status:all.length?'ambiguous':'unresolved',referenceType:'unknown',candidates:all,evidence:all.flatMap(item=>item.sources),reason:all.length?'multiple_entity_candidates':'no_grounded_entity_candidate'});
}
