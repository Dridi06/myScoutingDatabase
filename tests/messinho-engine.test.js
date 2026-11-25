import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreMessinhoPlayer, rankMessinhoPlayers, sanitizeMessinhoHistory, resolveMessinhoPlayerFollowUp, MESSINHO_ENGINE_VERSION } from '../backend/messinho-engine.js';

test('scores a centre-back using only supplied position-relevant dimensions',()=>{
 const result=scoreMessinhoPlayer({positions:['Innenverteidiger'],analysis:{ratings:{technical:{score:.8},tactical:{score:.9},athletic:{score:.7},mental:{score:.8}}}});
 assert.equal(result.engine_version,MESSINHO_ENGINE_VERSION);
 assert.equal(result.position_group,'centreBack');
 assert.equal(result.score,81);
 assert.equal(result.evidence_coverage,100);
 assert.equal(result.confidence,'high');
});
test('does not invent a score when evidence is insufficient',()=>{
 const result=scoreMessinhoPlayer({positions:['Stürmer'],analysis:{strengths:['schnell']}});
 assert.equal(result.score,null);
 assert.equal(result.confidence,'insufficient');
});
test('normalizes percentage and 0..1 inputs',()=>{
 const result=scoreMessinhoPlayer({positions:['Flügel links'],analysis:{ratings:{technical:80,tactical:.7,athletic:90,mental:60}}});
 assert.equal(result.score,78);
});
test('ranking places scored players before unscored players',()=>{
 const ranked=rankMessinhoPlayers([{name:'A',positions:['Torwart'],analysis:{ratings:{goalkeeping:90,technical:80}}},{name:'B',positions:['Stürmer'],analysis:{}}]);
 assert.equal(ranked[0].name,'A');assert.equal(ranked[1].messinho_rating.score,null);
});
test('history sanitizer limits, validates roles and truncates text',()=>{
 const history=[{role:'system',text:'no'},...Array.from({length:12},(_,i)=>({role:i%2?'assistant':'user',text:String(i)})),{role:'user',text:'x'.repeat(1300)}];
 const safe=sanitizeMessinhoHistory(history);
 assert.equal(safe.length,10);assert.equal(safe.at(-1).text.length,1200);assert.ok(safe.every(x=>['user','assistant'].includes(x.role)));
 assert.deepEqual(sanitizeMessinhoHistory({bad:true}),[]);
});

test('uses only an approved position profile when one is supplied',()=>{
 const candidate={positions:['Innenverteidiger'],analysis:{ratings:{technical:100,tactical:0,athletic:0,mental:0}}};
 const base=scoreMessinhoPlayer(candidate);
 const learned=scoreMessinhoPlayer(candidate,{centreBack:{technical:.7,tactical:.1,athletic:.1,mental:.1}});
 assert.equal(base.score,20);
 assert.equal(learned.score,70);
});

test('normalizes the legacy scout 1-to-5 rating scale to 20-to-100',()=>{
 const result=scoreMessinhoPlayer({positions:['Stürmer'],ratings:{Technik:4,Taktik:4,Athletik:3,Mental:4}});
 assert.equal(result.score,75);
 assert.equal(result.evidence_coverage,100);
});


test('routes a pronoun follow-up to the most recent player name',()=>{
 const history=[{role:'user',text:'Cristiano Ronaldo'},{role:'assistant',text:'Ich habe externe Quellen gefunden.'}];
 assert.equal(resolveMessinhoPlayerFollowUp('Was kannst du mir über ihn sagen?',history),'Cristiano Ronaldo');
});
test('does not treat a general help question as a player follow-up',()=>{
 const history=[{role:'user',text:'Hallo Messinho'},{role:'assistant',text:'Hallo!'}];
 assert.equal(resolveMessinhoPlayerFollowUp('Was kannst du?',history),null);
});
test('supports a previous explicit player search phrase',()=>{
 const history=[{role:'user',text:'Suche Spieler Kylian Mbappé'},{role:'assistant',text:'Recherche abgeschlossen.'}];
 assert.equal(resolveMessinhoPlayerFollowUp('Erzähl mir mehr über ihn.',history),'Kylian Mbappé');
});
