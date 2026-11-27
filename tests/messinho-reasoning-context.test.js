import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMessinhoReasoningContext } from '../backend/messinho-reasoning-context.js';
test('reasoning context attributes statements and research references without claiming verification',()=>{
 const context=buildMessinhoReasoningContext({history:[
  {role:'user',text:'Der Spieler ist langsam.'},
  {role:'assistant',text:'Das könnte seine Tiefensicherung beeinflussen.'},
  {role:'assistant',text:'Spielerprofil',researchContext:{player:{id:42,name:'Karim Benzema'}}}
 ],dialogueState:{continuity:{follow_up_likely:true,follow_up_signal:'referential_question',prior_user_goal_candidate:'Analysiere den Spieler',pending_assistant_question:'Welche Position?'}},entityResolution:{status:'resolved',entity:{entity_type:'player',id:42,name:'Karim Benzema'},candidates:[]}});
 assert.equal(context.evidence_policy,'attributed_not_verified');
 assert.equal(context.evidence[0].role,'user');
 assert.equal(context.evidence[0].kind,'conversation_statement');
 assert.deepEqual(context.evidence[2].research_entities,[{type:'player',name:'Karim Benzema',id:42}]);
 assert.equal(context.follow_up_likely,true);
 assert.equal(context.entity_resolution.status,'resolved');
});
test('reasoning context bounds evidence and rejects unrecognized continuity values',()=>{
 const context=buildMessinhoReasoningContext({history:Array.from({length:40},(_,i)=>({role:'user',text:'Claim '+i})),dialogueState:{continuity:{follow_up_signal:'permission_granted'}}});
 assert.ok(context.evidence.length<=10);
 assert.equal(context.evidence_count,20);
 assert.equal(context.follow_up_signal,'none');
 assert.equal(context.evidence_policy,'attributed_not_verified');
});

test('reasoning context preserves only allowlisted structured player metrics',()=>{
 const context=buildMessinhoReasoningContext({history:[{role:'assistant',text:'Research result',researchContext:{
  player:{id:42,name:'Player A',metrics:{top_speed_kmh:32.4,market_value_eur:1200000,sprint_30m_seconds:'4.1'}}
 }}]});
 const metrics=context.evidence[0].research_entities[0].metrics;
 assert.deepEqual(metrics.map(item=>item.key),['top_speed_kmh','sprint_30m_seconds']);
 assert.equal(metrics[0].value,32.4);
 assert.equal(metrics[1].value,4.1);
});
