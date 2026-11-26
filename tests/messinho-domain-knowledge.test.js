import test from 'node:test';
import assert from 'node:assert/strict';
import {isMessinhoRegisteredSourceUrl,isMessinhoSourceUrlWithinPrefix,getMessinhoVerifiedSourceRightsForUrl} from '../backend/messinho-rights-registry.js';
import {buildMessinhoDomainKnowledgeRecord,classifyMessinhoKnowledgeDomain,fingerprintMessinhoDomainKnowledge,rankMessinhoDomainKnowledge,storeMessinhoDomainKnowledge,findMessinhoDomainKnowledge} from '../backend/messinho-domain-knowledge.js';
const good={question:'Wie funktioniert die Photosynthese in Pflanzen?',content:'Photosynthese wandelt Lichtenergie in chemische Energie um. Dabei werden Wasser und Kohlendioxid genutzt und Sauerstoff freigesetzt.',sources:[{title:'Open licensed biology reference',url:'https://example.org/bio',section:'Photosynthesis'}],claims:['Lichtenergie wird in chemische Energie umgewandelt.'],rights:{status:'verified_permitted',license:'CC BY 4.0',rights_holder:'Example Research Institute',ai_tdm:true,commercial_use:true,derivative_use:true,evidence_url:'https://example.org/license'},confidence:0.9};
test('classifies requested scientific and financial domains',()=>{assert.equal(classifyMessinhoKnowledgeDomain('Erkläre Photosynthese'), 'biology');assert.equal(classifyMessinhoKnowledgeDomain('Wie funktioniert Value at Risk im Risikomanagement?'),'risk_management');assert.equal(classifyMessinhoKnowledgeDomain('Wie funktioniert ein Orderbuch an der Börse?'),'financial_markets');assert.equal(classifyMessinhoKnowledgeDomain('Berechne eine Gleichung'),'mathematics');});
test('permanent knowledge requires explicit verified rights, provenance and compact content',()=>{assert.equal(buildMessinhoDomainKnowledgeRecord(good).eligible,false);assert.equal(buildMessinhoDomainKnowledgeRecord(good).reason,'rights_not_in_verified_registry');assert.equal(buildMessinhoDomainKnowledgeRecord({...good,sources:[]}).reason,'rights_not_in_verified_registry');});
test('uses stable content fingerprint and bounded knowledge payload',()=>{assert.equal(fingerprintMessinhoDomainKnowledge(good.content,'biology'),fingerprintMessinhoDomainKnowledge(good.content,'biology'));assert.ok(good.content.length<=1600);});
test('retrieval ranks only active relevant domain knowledge',()=>{const rows=[{id:'1',domain:'biology',question:good.question,content:good.content,knowledge_status:'active'},{id:'2',domain:'financial_markets',question:'Wie funktioniert Aktienhandel?',content:'Aktien werden an Börsen gehandelt und Preise entstehen durch Angebot und Nachfrage.',knowledge_status:'active'}];const ranked=rankMessinhoDomainKnowledge('Wie funktioniert Photosynthese in Pflanzen?',rows);assert.equal(ranked.length,1);assert.equal(ranked[0].record.id,'1');});
test('database persistence and retrieval fail closed without database',async()=>{assert.deepEqual(await storeMessinhoDomainKnowledge(null,good),{persisted:false,reason:'storage_unavailable'});assert.deepEqual(await findMessinhoDomainKnowledge(null,'Photosynthese'),{status:'unavailable',items:[]});});
test('rejects writes when any reuse permission is missing',async()=>{const result=await storeMessinhoDomainKnowledge({from(){throw Error('must not write')}},{...good,rights:{...good.rights,ai_tdm:false}});assert.equal(result.persisted,false);assert.equal(result.reason,'rights_not_in_verified_registry');});

test('provider-supplied rights flags cannot bypass the independently reviewed allowlist',()=>{assert.equal(buildMessinhoDomainKnowledgeRecord({...good,rights:{...good.rights,source_id:'unreviewed-source'}}).reason,'rights_not_in_verified_registry');});

test('licensed source URL scope rejects lookalike hosts and path-prefix confusion',()=>{
 assert.equal(isMessinhoSourceUrlWithinPrefix('https://example.org/book/chapter','https://example.org/book'),true);
 assert.equal(isMessinhoSourceUrlWithinPrefix('https://example.org/book','https://example.org/book'),true);
 assert.equal(isMessinhoSourceUrlWithinPrefix('https://example.org/bookish/chapter','https://example.org/book'),false);
 assert.equal(isMessinhoSourceUrlWithinPrefix('https://example.org.evil/book/chapter','https://example.org/book'),false);
 assert.equal(isMessinhoSourceUrlWithinPrefix('http://example.org/book/chapter','https://example.org/book'),false);
});
test('unreviewed sources never resolve to verified rights',()=>{
 assert.equal(getMessinhoVerifiedSourceRightsForUrl('https://example.org/book/chapter'),null);
});
test('source provenance URL must be inside the reviewed rights scope',()=>{assert.equal(isMessinhoRegisteredSourceUrl('unknown-source','https://example.org/book/chapter'),false);assert.equal(isMessinhoRegisteredSourceUrl('unknown-source','http://example.org/book'),false);});
