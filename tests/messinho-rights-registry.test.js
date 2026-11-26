import test from 'node:test';
import assert from 'node:assert/strict';
import {
  verifyMessinhoSourceRights,
  isMessinhoRegisteredSourceUrl,
  getMessinhoVerifiedSourceRightsForUrl,
  getMessinhoVerifiedSourceRightsCount,
  getMessinhoVerifiedSourceRightsById
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

test('only four individually rights-cleared CC BY 4.0 works are allowlisted',()=>{
  assert.equal(getMessinhoVerifiedSourceRightsCount(),4);
  for(const id of ['plos_one_vo2max_prediction_2023','pmc_cardiorespiratory_fitness_2022','libretexts_kuttler_matrix_multiplication_2023','austin_matrix_multiplication_2023']){
    const rights=getMessinhoVerifiedSourceRightsById(id);
    assert.ok(rights);
    assert.equal(verifyMessinhoSourceRights({...rights,status:'verified_permitted',ai_tdm:true,commercial_use:true,derivative_use:true}),true);
  }
  const plos=getMessinhoVerifiedSourceRightsById('plos_one_vo2max_prediction_2023');
  assert.equal(verifyMessinhoSourceRights({...plos,retrieval_url:'https://example.com/other.xml'}),false);
  assert.equal(verifyMessinhoSourceRights({...plos,retrieval_method:'pmc_bioc_json'}),false);
  assert.equal(verifyMessinhoSourceRights(openStaxClaim),false);
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

test('rights verification rejects incomplete attribution, licence and TDM evidence',()=>{
  const approved=getMessinhoVerifiedSourceRightsById('plos_one_vo2max_prediction_2023');
  assert.ok(approved);
  assert.equal(verifyMessinhoSourceRights({...approved,license_url:'https://example.com/license'}),false);
  assert.equal(verifyMessinhoSourceRights({...approved,tdm_evidence_url:''}),false);
  assert.equal(verifyMessinhoSourceRights({...approved,attribution:''}),false);
  assert.equal(verifyMessinhoSourceRights({...approved,ai_tdm:false}),false);
});

test('approved article URLs are exact, including PLOS DOI query and PMC article identity',()=>{
  const plos='https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0280897';
  const pmc='https://pmc.ncbi.nlm.nih.gov/articles/PMC11269081/';
  assert.equal(isMessinhoRegisteredSourceUrl('plos_one_vo2max_prediction_2023',plos),true);
  assert.equal(isMessinhoRegisteredSourceUrl('plos_one_vo2max_prediction_2023','https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0280897'),true);
  assert.equal(isMessinhoRegisteredSourceUrl('plos_one_vo2max_prediction_2023','https://journals.plos.org/plosone/article?id=10.1371/journal.pone.9999999'),false);
  assert.equal(isMessinhoRegisteredSourceUrl('plos_one_vo2max_prediction_2023',plos+'&download=1'),false);
  assert.equal(isMessinhoRegisteredSourceUrl('pmc_cardiorespiratory_fitness_2022',pmc),true);
  assert.equal(isMessinhoRegisteredSourceUrl('pmc_cardiorespiratory_fitness_2022',pmc+'figure/1'),false);
  assert.equal(getMessinhoVerifiedSourceRightsForUrl(plos)?.source_id,'plos_one_vo2max_prediction_2023');
  assert.equal(getMessinhoVerifiedSourceRightsForUrl(pmc)?.source_id,'pmc_cardiorespiratory_fitness_2022');
  const kuttler='https://math.libretexts.org/Bookshelves/Linear_Algebra/A_First_Course_in_Linear_Algebra_%28Kuttler%29/02%3A_Matrices/2.02%3A_Multiplication_of_Matrices';
  const austin='https://understandinglinearalgebra.org/sec-matrices-lin-combs.html';
  assert.equal(isMessinhoRegisteredSourceUrl('libretexts_kuttler_matrix_multiplication_2023',kuttler),true);
  assert.equal(isMessinhoRegisteredSourceUrl('austin_matrix_multiplication_2023',austin),true);
  assert.equal(isMessinhoRegisteredSourceUrl('austin_matrix_multiplication_2023','https://understandinglinearalgebra.org/sec-matrices-lin-combs.html.evil'),false);
});

test('unregistered, non-HTTPS and lookalike URLs are never accepted',()=>{
  assert.equal(isMessinhoRegisteredSourceUrl(openStaxClaim.source_id,'http://assets.openstax.org/oscms-prodcms/media/documents/College-Algebra-2e-WEB.pdf'),false);
  assert.equal(isMessinhoRegisteredSourceUrl(openStaxClaim.source_id,'https://example.com/College-Algebra-2e-WEB.pdf'),false);
  assert.equal(isMessinhoRegisteredSourceUrl(openStaxClaim.source_id,'https://assets.openstax.org/oscms-prodcms/media/documents/College-Algebra-2e-WEB.pdf.evil'),false);
});


test('rights verification blocks sources after their scheduled review deadline',()=>{
  const approved=getMessinhoVerifiedSourceRightsById('plos_one_vo2max_prediction_2023');
  assert.ok(approved.review_due_at);
  assert.equal(verifyMessinhoSourceRights(approved,new Date('2027-11-26T23:59:59.999Z')),true);
  assert.equal(verifyMessinhoSourceRights(approved,new Date('2027-11-27T00:00:00.000Z')),false);
  assert.equal(verifyMessinhoSourceRights({...approved,review_due_at:'2028-11-26'},new Date('2027-11-26T12:00:00.000Z')),false);
});
