import test from 'node:test';
import assert from 'node:assert/strict';
import {MESSINHO_CORE_KNOWLEDGE_VERSION,getMessinhoCoreKnowledgeManifest,getMessinhoCoreKnowledgeContext} from '../backend/messinho-core-knowledge.js';

test('core knowledge is loaded and versioned at runtime',()=>{
 const manifest=getMessinhoCoreKnowledgeManifest();
 assert.equal(manifest.loaded,true);
 assert.equal(manifest.version,MESSINHO_CORE_KNOWLEDGE_VERSION);
 assert.ok(manifest.entry_count>=20);
 assert.ok(manifest.domains.includes('medicine'));
 assert.ok(manifest.domains.includes('banking'));
 assert.ok(manifest.domains.includes('chemistry'));
});

test('retrieves foundational ACL knowledge without database or external research',()=>{
 const result=getMessinhoCoreKnowledgeContext('Wie lange dauert die Genesung nach einem Kreuzbandriss?');
 assert.equal(result.status,'hit');
 assert.ok(result.items.some(item=>item.key==='medicine.acl'));
 assert.ok(result.items.find(item=>item.key==='medicine.acl').limitations.some(text=>text.includes('pauschale Genesungsdauer')));
});

test('retrieves mathematical, scientific, financial and football foundations',()=>{
 assert.ok(getMessinhoCoreKnowledgeContext('Wie berechne ich Prozent?').items.some(item=>item.key==='math.percentage'));
 assert.ok(getMessinhoCoreKnowledgeContext('Was bedeutet pH-Wert?').items.some(item=>item.key==='chemistry.ph'));
 assert.ok(getMessinhoCoreKnowledgeContext('Wie funktioniert Zinseszins?').items.some(item=>item.key==='finance.compounding'));
 assert.ok(getMessinhoCoreKnowledgeContext('Was bedeutet Liquidität bei einer Bank?').items.some(item=>item.key==='banking.liquidity'));
 assert.ok(getMessinhoCoreKnowledgeContext('Wie bewerte ich einen Fußballspieler?').items.some(item=>item.key==='football.scouting-context'));
});

test('does not fabricate a hit for unrelated empty input',()=>{
 assert.deepEqual(getMessinhoCoreKnowledgeContext(''),{status:'miss',version:MESSINHO_CORE_KNOWLEDGE_VERSION,items:[]});
});

test('knowledge is explicitly marked as foundational and not exhaustive expert coverage',()=>{
 const manifest=getMessinhoCoreKnowledgeManifest();
 assert.equal(manifest.source_type,'first_party_curated');
 assert.equal(manifest.external_research_required_for_current_or_specialist_facts,true);
 assert.ok(getMessinhoCoreKnowledgeContext('Kreuzbandriss').items.every(item=>item.level==='foundational'));
});
