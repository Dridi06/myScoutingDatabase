import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { MESSINHO_KNOWLEDGE_DOMAINS, classifyMessinhoKnowledgeDomain } from '../backend/messinho-domain-knowledge.js';

test('canonical knowledge taxonomy includes all requested cross-domain foundations',()=>{
 for(const domain of ['mathematics','physics','chemistry','biology','medicine','ethics','financial_markets','risk_management','banking','statistics','sports_science','football','computer_science']) {
  assert.ok(MESSINHO_KNOWLEDGE_DOMAINS.includes(domain), 'missing domain: '+domain);
 }
});

test('chemistry questions classify in German and English without falling into general knowledge',()=>{
 for(const question of ['Erkläre die chemische Reaktion einer Säure mit einer Base.','Was bedeutet Stöchiometrie?','Explain molecular bonding and chemical equilibrium.','What is the periodic table?']) {
  assert.equal(classifyMessinhoKnowledgeDomain(question),'chemistry',question);
 }
});

test('ethics questions classify in German and English as a distinct knowledge domain',()=>{
 for(const question of ['Was ist der Unterschied zwischen Deontologie und Utilitarismus?','Erkläre Forschungsethik.','What is virtue ethics?','Discuss AI ethics and fairness.']) {
  assert.equal(classifyMessinhoKnowledgeDomain(question),'ethics',question);
 }
});

test('staging migration expands both legacy and canonical knowledge table constraints',async()=>{
 const sql=await readFile(new URL('../supabase/migrations/20261128042845_messinho_chemistry_ethics_domains.sql',import.meta.url),'utf8');
 assert.match(sql,/messinho_knowledge_concepts_domain_check/);
 assert.match(sql,/messinho_domain_knowledge_domain_check/);
 assert.match(sql,/'chemistry'/);
 assert.match(sql,/'ethics'/);
 assert.match(sql,/alter table public\.messinho_knowledge_concepts/);
 assert.match(sql,/alter table public\.messinho_domain_knowledge/);
});
