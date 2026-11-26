import test from 'node:test';
import assert from 'node:assert/strict';
import {
  verifyMessinhoSourceRights,
  isMessinhoRegisteredSourceUrl,
  getMessinhoVerifiedSourceRightsForUrl,
  getMessinhoVerifiedSourceRightsCount
} from '../backend/messinho-rights-registry.js';

const collegeAlgebra={
  source_id:'openstax_college_algebra_2e_2021',
  status:'verified_permitted',
  license:'CC BY 4.0',
  license_url:'https://creativecommons.org/licenses/by/4.0/',
  rights_holder:'Rice University',
  evidence_url:'https://assets.openstax.org/oscms-prodcms/media/documents/College-Algebra-2e-WEB.pdf',
  attribution:'Rice University, OpenStax, College Algebra 2e (2021), CC BY 4.0.',
  ai_tdm:true,commercial_use:true,derivative_use:true
};

test('the permanent source allowlist remains empty until AI/TDM and commercial rights are proven',()=>{
  assert.equal(getMessinhoVerifiedSourceRightsCount(),0);
  assert.equal(verifyMessinhoSourceRights(collegeAlgebra),false);
  assert.equal(isMessinhoRegisteredSourceUrl(collegeAlgebra.source_id,collegeAlgebra.evidence_url),false);
  assert.equal(getMessinhoVerifiedSourceRightsForUrl(collegeAlgebra.evidence_url),null);
});

test('OpenStax CC BY labels cannot override per-work AI-ingestion restrictions',()=>{
  for(const sourceId of [
    'openstax_college_algebra_2e_2021',
    'openstax_introductory_statistics_2e_2023',
    'openstax_university_physics_volume_1_2021',
    'openstax_introductory_business_statistics_2e'
  ]){
    assert.equal(verifyMessinhoSourceRights({...collegeAlgebra,source_id:sourceId}),false);
    assert.equal(isMessinhoRegisteredSourceUrl(sourceId,collegeAlgebra.evidence_url),false);
  }
});

test('unapproved rights claims and URL scope escalation fail closed',()=>{
  const claimed={...collegeAlgebra,source_id:'unapproved',license:'CC BY-NC-SA 4.0',commercial_use:true};
  assert.equal(verifyMessinhoSourceRights(claimed),false);
  assert.equal(isMessinhoRegisteredSourceUrl('unapproved',collegeAlgebra.evidence_url),false);
  assert.equal(isMessinhoRegisteredSourceUrl(collegeAlgebra.source_id,'http://assets.openstax.org/oscms-prodcms/media/documents/College-Algebra-2e-WEB.pdf'),false);
  assert.equal(isMessinhoRegisteredSourceUrl(collegeAlgebra.source_id,'https://example.com/College-Algebra-2e-WEB.pdf'),false);
});

test('rights verification rejects incomplete attribution and licence evidence',()=>{
  assert.equal(verifyMessinhoSourceRights({...collegeAlgebra,license_url:'https://example.com/license'}),false);
  assert.equal(verifyMessinhoSourceRights({...collegeAlgebra,attribution:''}),false);
  assert.equal(verifyMessinhoSourceRights({...collegeAlgebra,ai_tdm:false}),false);
});

test('only exact work-level CC BY 4.0 sources are allowlisted for commercial TDM',()=>{
  assert.equal(getMessinhoVerifiedSourceRightsCount(),4);
  assert.equal(verifyMessinhoSourceRights(collegeAlgebra),true);
  assert.equal(isMessinhoRegisteredSourceUrl(collegeAlgebra.source_id,collegeAlgebra.evidence_url),true);
  assert.equal(getMessinhoVerifiedSourceRightsForUrl(collegeAlgebra.evidence_url)?.source_id,collegeAlgebra.source_id);
});

test('source allowlist rejects URL scope escalation and non-HTTPS locations',()=>{
  assert.equal(isMessinhoRegisteredSourceUrl(collegeAlgebra.source_id,'https://assets.openstax.org/oscms-prodcms/media/documents/College-Algebra-2e-WEB.pdf.evil'),false);
  assert.equal(isMessinhoRegisteredSourceUrl(collegeAlgebra.source_id,'http://assets.openstax.org/oscms-prodcms/media/documents/College-Algebra-2e-WEB.pdf'),false);
  assert.equal(isMessinhoRegisteredSourceUrl(collegeAlgebra.source_id,'https://example.com/College-Algebra-2e-WEB.pdf'),false);
});

test('provider claims cannot upgrade an unapproved non-commercial source',()=>{
  const claimed={...collegeAlgebra,source_id:'unapproved',license:'CC BY-NC-SA 4.0',commercial_use:true};
  assert.equal(verifyMessinhoSourceRights(claimed),false);
  assert.equal(isMessinhoRegisteredSourceUrl('unapproved',collegeAlgebra.evidence_url),false);
});

test('rights verification requires the full attribution and licence evidence tuple',()=>{
  assert.equal(verifyMessinhoSourceRights({...collegeAlgebra,license_url:'https://example.com/license'}),false);
  assert.equal(verifyMessinhoSourceRights({...collegeAlgebra,attribution:''}),false);
  assert.equal(verifyMessinhoSourceRights({...collegeAlgebra,ai_tdm:false}),false);
});
