import test from 'node:test';
import assert from 'node:assert/strict';
import {
 fingerprintMessinhoKnowledgeQuestion,isMessinhoKnowledgePersistable,buildMessinhoKnowledgeRecord,scoreMessinhoKnowledgeSimilarity,
 findMessinhoKnowledge,storeMessinhoKnowledge
} from '../backend/messinho-knowledge-memory.js';

const ownerA='11111111-1111-4111-8111-111111111111';
const ownerB='22222222-2222-4222-8222-222222222222';
const now=new Date('2026-11-26T12:00:00.000Z');
const research={
 status:'completed',answer:'Der Himmel erscheint blau, weil kurzwelliges Licht stärker gestreut wird.',
 answer_mode:'evidence_synthesized',claims:[{text:'Kurzwelliges Licht wird stärker gestreut.',source_urls:['https://a.example/sky','https://b.example/sky']}],
 sources:[
  {title:'Atmospheric optics',url:'https://a.example/sky',publisher:'a.example',snippet:'Blue light has a shorter wavelength and is scattered more strongly by molecules in Earth atmosphere. '.repeat(2)},
  {title:'Rayleigh scattering',url:'https://b.example/sky',publisher:'b.example',snippet:'Rayleigh scattering explains why short wavelengths are scattered more efficiently in the atmosphere. '.repeat(2)}
 ],
 evidence:{can_answer:true,limitations:[]}
};

test('normalizes equivalent German questions to the same fingerprint',()=>{
 assert.equal(fingerprintMessinhoKnowledgeQuestion('Warum ist der Himmel blau?'),fingerprintMessinhoKnowledgeQuestion('WARUM ist der Himmel blau'));
 assert.equal(fingerprintMessinhoKnowledgeQuestion('Hi'),null);
});
test('only persists completed research with substantial independent HTTPS sources',()=>{
 assert.equal(isMessinhoKnowledgePersistable('Warum ist der Himmel blau?',research),true);
 assert.equal(isMessinhoKnowledgePersistable('Warum ist der Himmel blau?',{...research,evidence:{can_answer:false}}),false);
 assert.equal(isMessinhoKnowledgePersistable('Warum ist der Himmel blau?',{...research,sources:[research.sources[0],{...research.sources[1],url:'https://a.example/other'}]}),false);
 assert.equal(isMessinhoKnowledgePersistable('Wie geht es meiner Familie?',research),false);
 assert.equal(isMessinhoKnowledgePersistable('Wie lautet meine Mail test@example.com?',research),false);
});
test('builds owner-scoped record with 14-day expiry and source provenance',()=>{
 const row=buildMessinhoKnowledgeRecord(ownerA,'Warum ist der Himmel blau?',research,now);
 assert.equal(row.owner_id,ownerA);
 assert.equal(row.verification_status,'corroborated');
 assert.equal(row.source_count,2);
 assert.equal(row.distinct_domains,2);
 assert.equal(row.answer_mode,'evidence_synthesized');
 assert.equal(Date.parse(row.expires_at)-Date.parse(row.last_verified_at),14*24*60*60*1000);
 assert.equal(row.sources.length,2);
 assert.equal(row.claims.length,1);
});
test('rejects persistence when claims cite a URL outside the retrieved source set',()=>{
 const bad={...research,claims:[{text:'An unrelated claim with three meaningful terms.',source_urls:['https://evil.example/']} ]};
 const row=buildMessinhoKnowledgeRecord(ownerA,'Warum ist der Himmel blau?',bad,now);
 assert.equal(row.claims.length,0);
 assert.equal(row.answer_mode,'source_digest');
});
test('lookup always scopes by owner and exact question fingerprint',async()=>{
 const calls=[];
 const row={id:'knowledge-id',hit_count:2,answer:'cached',sources:[],claims:[],evidence_summary:{},source_count:2,distinct_domains:2};
 class Query{
  select(v){calls.push(['select',v]);return this;}
  eq(k,v){calls.push(['eq',k,v]);return this;}
  gt(k,v){calls.push(['gt',k,v]);return this;}
  maybeSingle(){return Promise.resolve({data:row,error:null});}
  update(v){calls.push(['update',v]);return this;}
  then(resolve){resolve({error:null});}
 }
 const db={from(name){calls.push(['from',name]);return new Query();}};
 const found=await findMessinhoKnowledge(db,ownerA,'Warum ist der Himmel blau?',now);
 assert.equal(found.status,'hit');
 assert.ok(calls.some(call=>call[0]==='eq'&&call[1]==='owner_id'&&call[2]===ownerA));
 assert.ok(calls.some(call=>call[0]==='eq'&&call[1]==='question_fingerprint'));
});
test('upserts only the current owner record and confirms returned database ID',async()=>{
 const calls=[];
 class Query{
  upsert(row,options){calls.push(['upsert',row,options]);return this;}
  select(){return this;}
  maybeSingle(){return Promise.resolve({data:{id:'persisted-id',verification_status:'corroborated',expires_at:'2026-12-10T12:00:00.000Z'},error:null});}
 }
 const db={from(name){calls.push(['from',name]);return new Query();}};
 const saved=await storeMessinhoKnowledge(db,ownerB,'Warum ist der Himmel blau?',research,now);
 assert.equal(saved.persisted,true);
 assert.equal(calls[1][1].owner_id,ownerB);
 assert.equal(calls[1][2].onConflict,'owner_id,question_fingerprint');
});
test('does not claim persistence if no database is available',async()=>{
 const result=await storeMessinhoKnowledge(null,ownerA,'Warum ist der Himmel blau?',research,now);
 assert.deepEqual(result,{persisted:false,reason:'storage_unavailable'});
});

test('paraphrase retrieval requires strong shared meaningful terms',()=>{
 const good=scoreMessinhoKnowledgeSimilarity('Wie beeinflusst Schlaf die Regeneration von Fußballspielern?','Wie wirkt Schlaf auf die Regeneration bei Fußballspielern?');
 assert.equal(good.eligible,true);
 assert.ok(good.overlap>=3);
 const bad=scoreMessinhoKnowledgeSimilarity('Wie beeinflusst Schlaf die Regeneration von Fußballspielern?','Welche Verletzungsgefahr haben Fußballspieler auf Kunstrasen?');
 assert.equal(bad.eligible,false);
});
test('negation and different topic wording do not pass the lexical threshold',()=>{
 const match=scoreMessinhoKnowledgeSimilarity('Welche Faktoren verbessern die Sprintleistung eines Spielers?','Welche Faktoren verschlechtern die Sprintleistung eines Spielers?');
 assert.equal(match.eligible,false);
});
