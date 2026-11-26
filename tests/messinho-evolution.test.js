import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectMessinhoKnowledgeGap,
  createMessinhoEvolutionProposal,
  validateMessinhoEvolutionProposal,
  promoteMessinhoEvolutionProposal,
  matchMessinhoEvolutionExample
} from '../backend/messinho-evolution.js';

const validProposal = () => createMessinhoEvolutionProposal({
  question: 'Wie spät ist es?',
  capabilityId: 'get_current_time',
  operation: 'system_clock',
  description: 'Liefert die aktuelle Uhrzeit aus der Systemuhr.',
  examples: ['Wie viel Uhr ist es gerade?'],
  testCases: [
    { input: 'Wie spät ist es?', expected: 'Uhrzeit aus Systemuhr' },
    { input: 'Wie viel Uhr ist es gerade?', expected: 'Uhrzeit aus Systemuhr' }
  ],
  createdBy: 'messinho-agent'
});

test('unknown questions create a knowledge gap, but matched capabilities do not', () => {
  assert.equal(detectMessinhoKnowledgeGap('Warum ist der Himmel blau?').gap, true);
  assert.equal(detectMessinhoKnowledgeGap('Wie spät ist es?', { matchedCapabilityIds: ['system_clock'] }).gap, false);
  assert.equal(detectMessinhoKnowledgeGap(' ').reason, 'empty_input');
});

test('knowledge gap marks protected side-effect requests for human review', () => {
  const result = detectMessinhoKnowledgeGap('Sende dem Spieler eine Vertragszusage');
  assert.equal(result.gap, true);
  assert.equal(result.risk, 'protected_side_effect_or_sensitive_topic');
  assert.equal(result.may_generate_code, false);
});

test('valid declarative evolution proposal passes strict schema validation', () => {
  const result = validateMessinhoEvolutionProposal(validProposal());
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('arbitrary generated code and unreviewed operations are rejected', () => {
  const proposal = { ...validProposal(), python_code: 'import os; os.remove("/")' };
  const result = validateMessinhoEvolutionProposal(proposal);
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('executable_source_forbidden'));
  const unknownOperation = validateMessinhoEvolutionProposal({ ...validProposal(), operation: 'shell_exec' });
  assert.ok(unknownOperation.errors.includes('operation_not_allowlisted'));
});

test('promotion requires passing tests and explicit approval', () => {
  const proposal = validProposal();
  assert.equal(promoteMessinhoEvolutionProposal(proposal).status, 'needs_validation');
  assert.equal(promoteMessinhoEvolutionProposal(proposal, { testsPassed: true }).status, 'awaiting_approval');
  const approved = promoteMessinhoEvolutionProposal(proposal, { testsPassed: true, approvedBy: 'admin-1' });
  assert.equal(approved.promoted, true);
  assert.equal(approved.capability.status, 'approved');
});

test('approved skills are reused only for matching examples', () => {
  const proposal = validProposal();
  const approved = promoteMessinhoEvolutionProposal(proposal, { testsPassed: true, approvedBy: 'admin-1' }).capability;
  assert.equal(matchMessinhoEvolutionExample('Wie spät ist es?', [approved]).capability_id, 'get_current_time');
  assert.equal(matchMessinhoEvolutionExample('Wie ist das Wetter morgen?', [approved]), null);
  assert.equal(matchMessinhoEvolutionExample('Wie spät ist es?', [{ ...approved, status: 'candidate' }]), null);
});

test('proposals are bounded and sanitize metadata', () => {
  const proposal = createMessinhoEvolutionProposal({
    question: '  Neue Frage  ', capabilityId: '../../bad id', operation: 'system_clock',
    description: ' '.repeat(700), examples: Array.from({ length: 30 }, (_, i) => 'Beispiel ' + i),
    testCases: [], createdBy: 'user'
  });
  assert.equal(proposal.capability_id, 'bad_id');
  assert.equal(proposal.examples.length, 20);
  assert.equal(proposal.description, '');
  assert.equal(validateMessinhoEvolutionProposal(proposal).valid, false);
});
