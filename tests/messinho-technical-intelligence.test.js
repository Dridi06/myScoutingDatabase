import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyMessinhoKnowledgeDomain } from '../backend/messinho-domain-knowledge.js';

test('technical languages and tools route to computer_science',()=>{
 for(const query of [
  'Wie programmiere ich in Python?',
  'Erkläre JavaScript und TypeScript',
  'Wie funktioniert SQL in PostgreSQL?',
  'Wie baue ich eine React-Komponente?',
  'Was ist Node.js?',
  'Wie debugge ich einen API-Fehler?',
  'Wie funktioniert Git und GitHub?',
  'Wie schreibe ich automatisierte Tests?',
  'Was ist CI/CD und DevOps?',
  'Wie sichere ich eine Datenbank gegen SQL Injection?',
  'Wie funktionieren RAG und Embeddings?',
  'Wie entwerfe ich eine Softwarearchitektur?'
 ]){
  assert.equal(classifyMessinhoKnowledgeDomain(query),'computer_science',query);
 }
});

test('football and sports-science questions keep their dedicated domains',()=>{
 assert.equal(classifyMessinhoKnowledgeDomain('Wie trainiere ich VO2max?'),'sports_science');
 assert.equal(classifyMessinhoKnowledgeDomain('Wie analysiere ich einen Fußballspieler?'),'football');
 assert.equal(classifyMessinhoKnowledgeDomain('Wie bewerte ich einen Innenverteidiger im Fußball-Scouting?'),'football');
});
