import test from 'node:test';
import assert from 'node:assert/strict';
import {deriveContractHorizon,assessContractEvidence,compareContractAndPerformance,CONTRACT_STATES} from '../src/asi/contractIntelligence.js';

test('contract states cover the planned transfer lifecycle',()=>{
 assert.ok(CONTRACT_STATES.includes('loan_active'));
 assert.ok(CONTRACT_STATES.includes('free_agent_confirmed'));
 assert.ok(CONTRACT_STATES.includes('transfer_agreed'));
 assert.ok(CONTRACT_STATES.includes('conflicting'));
});

test('contract horizon distinguishes unknown, near expiry and expired',()=>{
 assert.equal(deriveContractHorizon(null).horizon,'unknown');
 assert.equal(deriveContractHorizon('2026-12-01',new Date('2026-11-25')).horizon,'within_6_months');
 assert.equal(deriveContractHorizon('2026-01-01',new Date('2026-11-25')).horizon,'past');
});

test('evidence is unusable until identity, source, verification and review are complete',()=>{
 const base={source_url:'https://club.example/player',event_date:'2026-10-01',identity_status:'matched',verification_status:'confirmed',review_status:'approved'};
 assert.equal(assessContractEvidence(base).usable,true);
 assert.equal(assessContractEvidence({...base,identity_status:'ambiguous'}).usable,false);
 assert.equal(assessContractEvidence({...base,data_classification:'health_sensitive',legal_review_status:'not_approved'}).usable,false);
});

test('contract/performance comparison refuses low sample sizes and avoids causal language',()=>{
 const result=compareContractAndPerformance([{event_date:'2026-06-01',claim_type:'contract_negotiation'}],[{match_date:'2026-05-01',minutes:90,metric_value:1},{match_date:'2026-06-10',minutes:90,metric_value:2}]);
 assert.equal(result[0].adequate,false);
 assert.equal(result[0].delta,null);
 assert.match(result[0].interpretation,/kein Kausalitätsnachweis|Zu geringe/);
});
