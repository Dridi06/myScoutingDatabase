import test from 'node:test';
import assert from 'node:assert/strict';
import { validateMessinhoReasoning } from '../backend/messinho-reasoning-validation.js';

test('qualitative pace description is never converted into a fabricated speed metric',()=>{
 const result=validateMessinhoReasoning({
  intent:'conversation',userMessage:'Der Spieler ist langsam.',
  reply:'Seine Sprintgeschwindigkeit beträgt 32,4 km/h.'
 });
 assert.equal(result.ok,false);
 assert.equal(result.code,'unsupported_player_metric');
 assert.match(result.reply,/keine verifizierten Messdaten/);
});

test('tactical consequences are accepted when clearly framed as conditional hypotheses',()=>{
 const result=validateMessinhoReasoning({
  intent:'conversation',userMessage:'Der Spieler ist langsam.',
  reply:'Das könnte die Tiefensicherung und Recovery Runs beeinflussen – je nach Rolle, Positionierung und Antizipation.'
 });
 assert.equal(result.ok,true);
});

test('unqualified tactical certainty is softened instead of presented as fact',()=>{
 const result=validateMessinhoReasoning({
  intent:'conversation',userMessage:'Der Spieler ist langsam.',
  reply:'Das zerstört die Tiefensicherung der Mannschaft.'
 });
 assert.equal(result.ok,false);
 assert.equal(result.code,'unqualified_tactical_claim');
 assert.match(result.reply,/mögliche Hypothese/);
});

test('ambiguous player identity triggers one focused clarification',()=>{
 const result=validateMessinhoReasoning({
  intent:'scouting',reply:'Er spielt aktuell bei Borussia Dortmund.',
  reasoningContext:{entity_resolution:{status:'ambiguous',candidates:[{name:'Spieler A'},{name:'Spieler B'}]}}
 });
 assert.equal(result.ok,false);
 assert.equal(result.code,'ambiguous_player_reference');
 assert.match(result.reply,/Welchen Spieler/);
});

test('structured research metric is accepted only when value and unit match',()=>{
 const reasoningContext={evidence:[{research_entities:[{type:'player',name:'Spieler A',metrics:[{key:'top_speed_kmh',value:32.4,unit:'km/h'}]}]}]};
 const accepted=validateMessinhoReasoning({intent:'conversation',reply:'Die dokumentierte Höchstgeschwindigkeit beträgt 32,4 km/h.',reasoningContext});
 const rejected=validateMessinhoReasoning({intent:'conversation',reply:'Die dokumentierte Höchstgeschwindigkeit beträgt 33,1 km/h.',reasoningContext});
 assert.equal(accepted.ok,true);
 assert.equal(rejected.ok,false);
 assert.equal(rejected.code,'unsupported_player_metric');
});

test('a structured metric for another unit cannot validate a speed claim',()=>{
 const reasoningContext={evidence:[{research_entities:[{metrics:[{key:'sprint_30m_seconds',value:4.1,unit:'s'}]}]}]};
 const result=validateMessinhoReasoning({intent:'conversation',reply:'Seine Geschwindigkeit liegt bei 32,4 km/h.',reasoningContext});
 assert.equal(result.ok,false);
});
