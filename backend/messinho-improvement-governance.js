const ACTIONS=new Set(['create','accept','reject','create_test','validate','rollback']);
const clean=(value,max)=>String(value??'').replace(/[\\u0000-\\u001f\\u007f]/g,' ').replace(/\\s+/g,' ').trim().slice(0,max);
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const transitions={
  proposed:new Set(['accept','reject']),
  accepted:new Set(['create_test','rollback']),
  test_created:new Set(['validate','rollback']),
  validated:new Set(['rollback']),
  rejected:new Set(),
  rolled_back:new Set()
};
export function normalizeMessinhoHypothesisCreate(input={}){
  const value=input.hypothesis||input;
  if(!isObject(value))return {ok:false,error:'Verbesserungshypothese fehlt.'};
  const hypothesis={
    id:clean(value.id,180),type:clean(value.type,80),group_by:clean(value.group_by,80),
    group:clean(value.group,120),sample_size:Number(value.sample_size),priority:clean(value.priority,10),
    proposal:clean(value.proposal,1200)
  };
  if(hypothesis.id.length<3||hypothesis.type.length<3||hypothesis.group_by.length<2||!hypothesis.group
    ||!Number.isInteger(hypothesis.sample_size)||hypothesis.sample_size<1||hypothesis.sample_size>1000000
    ||!['low','medium','high'].includes(hypothesis.priority)||hypothesis.proposal.length<8){
    return {ok:false,error:'Die Hypothese enthält unvollständige oder ungültige Angaben.'};
  }
  const reason=clean(input.reason||'Administrativ zur Prüfung übernommen.',1200);
  if(reason.length<8)return {ok:false,error:'Ein nachvollziehbarer Prüfgrund ist erforderlich.'};
  return {ok:true,value:{hypothesis,reason}};
}
export function normalizeMessinhoHypothesisTransition(input={}){
  const action=clean(input.action,24),reason=clean(input.reason,1200);
  if(!ACTIONS.has(action)||action==='create')return {ok:false,error:'Ungültige Hypothesen-Aktion.'};
  if(reason.length<8)return {ok:false,error:'Ein nachvollziehbarer Prüfgrund ist erforderlich.'};
  const test_plan=clean(input.test_plan,3000);
  const evidence_url=clean(input.evidence_url,2048);
  const evaluation=isObject(input.evaluation)?input.evaluation:{};
  if(action==='create_test'&&test_plan.length<20)return {ok:false,error:'Vor dem Test muss ein konkreter Testplan hinterlegt werden.'};
  if(action==='validate'&&(!/^https:\\/\\//i.test(evidence_url)||input.evaluation?.passed!==true||clean(input.evaluation?.summary,1200).length<12)){
    return {ok:false,error:'Zur Validierung sind ein HTTPS-Beleg und ein bestandenes, erläutertes Testergebnis erforderlich.'};
  }
  if(evidence_url&&!/^https:\\/\\//i.test(evidence_url))return {ok:false,error:'Belege müssen über HTTPS erreichbar sein.'};
  return {ok:true,value:{action,reason,test_plan:test_plan||null,evidence_url:evidence_url||null,evaluation}};
}
export function canTransitionMessinhoHypothesis(status,action){
  return Boolean(transitions[status]?.has(action));
}
export function getMessinhoHypothesisNextStatus(action){
  return ({accept:'accepted',reject:'rejected',create_test:'test_created',validate:'validated',rollback:'rolled_back'})[action]||null;
}
