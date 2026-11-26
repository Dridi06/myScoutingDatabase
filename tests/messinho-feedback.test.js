import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeMessinhoFeedback,normalizeMessinhoFeedbackReview,isMessinhoFeedbackEligibleForQualityMetrics} from '../backend/messinho-feedback.js';

const base={message_id:'assistant-123',question:'Wie ist die taktische Rolle des Spielers?',answer:'Er agiert als inverser Flügelspieler.',feedback_type:'quality_rating',rating:5};

test('accepts a bounded positive answer-quality signal',()=>{
 const result=normalizeMessinhoFeedback(base);
 assert.equal(result.ok,true);
 assert.equal(result.value.rating,5);
 assert.deepEqual(result.value.capability_ids,[]);
});

test('rejects malformed ratings and missing answer context',()=>{
 assert.equal(normalizeMessinhoFeedback({...base,rating:6}).ok,false);
 assert.equal(normalizeMessinhoFeedback({...base,answer:''}).ok,false);
 assert.equal(normalizeMessinhoFeedback({...base,message_id:'x'}).ok,false);
});

test('requires explanatory text for factual corrections, bugs and feature requests',()=>{
 assert.equal(normalizeMessinhoFeedback({...base,feedback_type:'factual_correction',rating:1,comment:'Falsch'}).ok,false);
 const invalid=normalizeMessinhoFeedback({...base,feedback_type:'factual_correction',rating:1,comment:'Die Position stimmt nicht; er spielt zentral.'});
 assert.equal(invalid.ok,false);
 const result=normalizeMessinhoFeedback({...base,feedback_type:'factual_correction',rating:null,comment:'Die Position stimmt nicht; er spielt zentral.'});
 assert.equal(result.ok,true);
 assert.equal(result.value.rating,null);
 assert.equal(result.value.feedback_type,'factual_correction');
});

test('sanitizes optional capability identifiers and bounds their count',()=>{
 const result=normalizeMessinhoFeedback({...base,capability_ids:['player_search','INVALID ID','player_search','x',...Array.from({length:20},(_,i)=>'capability_'+i)]});
 assert.equal(result.ok,true);
 assert.ok(result.value.capability_ids.length<=12);
 assert.ok(result.value.capability_ids.every(value=>/^[a-z0-9_]{2,80}$/.test(value)));
});

test('requires HTTPS evidence to verify a correction',()=>{
 assert.equal(normalizeMessinhoFeedbackReview({decision:'verified',reason:'Beleg wurde kontrolliert'}).ok,false);
 assert.equal(normalizeMessinhoFeedbackReview({decision:'verified',reason:'Beleg wurde kontrolliert',evidence_url:'http://example.org'}).ok,false);
 assert.equal(normalizeMessinhoFeedbackReview({decision:'verified',reason:'Beleg wurde kontrolliert',evidence_url:'https://example.org/source'}).ok,true);
});

test('does not treat non-outcome feedback as model-training data',()=>{
 assert.equal(isMessinhoFeedbackEligibleForQualityMetrics({feedback_type:'quality_rating',rating:5}),true);
 assert.equal(isMessinhoFeedbackEligibleForQualityMetrics({feedback_type:'factual_correction',rating:1}),false);
 assert.equal(isMessinhoFeedbackEligibleForQualityMetrics({feedback_type:'factual_correction',rating:null}),false);
});
