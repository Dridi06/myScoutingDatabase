import test from 'node:test';
import assert from 'node:assert/strict';
import {
  verifyMessinhoSourceRights,
  isMessinhoRegisteredSourceUrl,
  getMessinhoVerifiedSourceRightsForUrl,
  getMessinhoVerifiedSourceRightsCount
} from '../backend/messinho-rights-registry.js';

const openStaxClaim={
  source_id:'openstax_college_algebra_2e_2021',
  status:'verified_permitted',
  license:'CC BY 4.0',
  license_url:'https://creativecommons.org/licenses/by/4.0/',
  rights_holder:'Rice University',
  evidence_url:'https://assets.openstax.org/oscms-prodcms/media/documents/College-Algebra-2e-WEB.pdf',
  attribution:'Rice University, OpenStax, College Algebra 2e (2021), CC BY 4.0.',
  ai_tdm:true,commercial_use:true,derivative_use:true
};

test('the permanent source allowlist remains empty until all rights are verified',()=>{
  assert.equal(getMessinhoVerifiedSourceRightsCount(),0);
  assert.equal(verifyMessinhoSourceRights(openStaxClaim),false);
  assert.equal(isMessinhoRegisteredSourceUrl(openStaxClaim.source_id,openStaxClaim.evidence_url),false);
  assert.equal(getMessinhoVerifiedSourceRightsForUrl(openStaxClaim.evidence_url),null);
});

test('a CC BY label cannot override explicit OpenStax AI-ingestion restrictions',()=>{
  for(const sourceId of [
    'openstax_college_algebra_2e_2021',
    'openstax_introductory_statistics_2e_2023',
    'openstax_university_physics_volume_1_2021',
    'openstax_introductory_business_statistics_2e'
  ]){
    assert.equal(verifyMessinhoSourceRights({...openStaxClaim,source_id:sourceId}),false);
    assert.equal(isMessinhoRegisteredSourceUrl(sourceId,openStaxClaim.evidence_url),false);
  }
});

test('provider-supplied licence claims cannot promote an unreviewed source',()=>{
  const claimed={...openStaxClaim,source_id:'unapproved',license:'CC BY-NC-SA 4.0',commercial_use:true};
  assert.equal(verifyMessinhoSourceRights(claimed),false);
  assert.equal(isMessinhoRegisteredSourceUrl('unapproved',openStaxClaim.evidence_url),false);
});

test('rights verification rejects incomplete attribution and licence evidence',()=>{
  assert.equal(verifyMessinhoSourceRights({...openStaxClaim,license_url:'https://example.com/license'}),false);
  assert.equal(verifyMessinhoSourceRights({...openStaxClaim,attribution:''}),false);
  assert.equal(verifyMessinhoSourceRights({...openStaxClaim,ai_tdm:false}),false);
});

test('unregistered, non-HTTPS and lookalike URLs are never accepted',()=>{
  assert.equal(isMessinhoRegisteredSourceUrl(openStaxClaim.source_id,'http://assets.openstax.org/oscms-prodcms/media/documents/College-Algebra-2e-WEB.pdf'),false);
  assert.equal(isMessinhoRegisteredSourceUrl(openStaxClaim.source_id,'https://example.com/College-Algebra-2e-WEB.pdf'),false);
  assert.equal(isMessinhoRegisteredSourceUrl(openStaxClaim.source_id,'https://assets.openstax.org/oscms-prodcms/media/documents/College-Algebra-2e-WEB.pdf.evil'),false);
});
