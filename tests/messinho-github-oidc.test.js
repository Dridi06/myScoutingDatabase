import test from 'node:test';
import assert from 'node:assert/strict';
import {createSign,generateKeyPairSync} from 'node:crypto';
import {verifyMessinhoGitHubActionsIdentity} from '../backend/messinho-github-oidc.js';

const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const jwk={...publicKey.export({format:'jwk'}),kid:'test-key',alg:'RS256',use:'sig'};
const baseClaims={
 iss:'https://token.actions.githubusercontent.com',aud:'myscoutingdatabase-messinho-sandbox',
 sub:'repo:Dridi06/myScoutingDatabase:ref:refs/heads/feature/messinho-unified-ai-integration',
 repository:'Dridi06/myScoutingDatabase',ref:'refs/heads/feature/messinho-unified-ai-integration',
 workflow_ref:'Dridi06/myScoutingDatabase/.github/workflows/messinho-isolated-engineering.yml@refs/heads/feature/messinho-unified-ai-integration',
 event_name:'workflow_dispatch',sha:'a'.repeat(40),run_id:'12345',run_attempt:'1',
 iat:1000,exp:2000
};
function makeToken(claims=baseClaims,key=privateKey){
 const head=Buffer.from(JSON.stringify({alg:'RS256',kid:'test-key',typ:'JWT'})).toString('base64url');
 const body=Buffer.from(JSON.stringify(claims)).toString('base64url');
 const input=head+'.'+body;
 const signer=createSign('RSA-SHA256');signer.update(input);signer.end();
 return input+'.'+signer.sign(key).toString('base64url');
}
const fetchImpl=async()=>({ok:true,json:async()=>({keys:[jwk]})});
const expected={sourceSha:'a'.repeat(40),runId:12345,runAttempt:1,nowSeconds:1500};

test('accepts only signed OIDC identity from the pinned MESSINHO feature workflow',async()=>{
 const result=await verifyMessinhoGitHubActionsIdentity({token:makeToken(),fetchImpl,...expected});
 assert.equal(result.ok,true);
 assert.equal(result.claims.source_sha,expected.sourceSha);
});

test('rejects another repository, branch, workflow or event',async()=>{
 for(const claims of [
  {...baseClaims,repository:'attacker/repo'},
  {...baseClaims,ref:'refs/heads/main'},
  {...baseClaims,workflow_ref:'Dridi06/myScoutingDatabase/.github/workflows/other.yml@refs/heads/feature/messinho-unified-ai-integration'},
  {...baseClaims,event_name:'push'}
 ]){
  const result=await verifyMessinhoGitHubActionsIdentity({token:makeToken(claims),fetchImpl,...expected});
  assert.equal(result.ok,false);
 }
});

test('rejects expired tokens and tokens bound to another commit or run',async()=>{
 const expired=await verifyMessinhoGitHubActionsIdentity({token:makeToken({...baseClaims,exp:1200}),fetchImpl,...expected});
 assert.equal(expired.code,'OIDC_TOKEN_EXPIRED_OR_NOT_YET_VALID');
 const wrongRun=await verifyMessinhoGitHubActionsIdentity({token:makeToken({...baseClaims,run_id:'999'}),fetchImpl,...expected});
 assert.equal(wrongRun.code,'OIDC_RUN_BINDING_MISMATCH');
});

test('rejects invalid signatures and missing signing keys',async()=>{
 const other=generateKeyPairSync('rsa',{modulusLength:2048});
 const badSignature=await verifyMessinhoGitHubActionsIdentity({token:makeToken(baseClaims,other.privateKey),fetchImpl,...expected});
 assert.equal(badSignature.code,'OIDC_SIGNATURE_INVALID');
 const missing=await verifyMessinhoGitHubActionsIdentity({token:makeToken(),fetchImpl:async()=>({ok:true,json:async()=>({keys:[]})}),...expected});
 assert.equal(missing.code,'OIDC_SIGNING_KEY_NOT_FOUND');
});
