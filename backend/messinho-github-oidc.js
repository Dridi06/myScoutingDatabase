import {createPublicKey,verify as verifySignature} from 'node:crypto';

const ISSUER='https://token.actions.githubusercontent.com';
const AUDIENCE='myscoutingdatabase-messinho-sandbox';
const REPOSITORY='Dridi06/myScoutingDatabase';
const REF='refs/heads/feature/messinho-unified-ai-integration';
const WORKFLOW_REF='Dridi06/myScoutingDatabase/.github/workflows/messinho-isolated-engineering.yml@refs/heads/feature/messinho-unified-ai-integration';

const decodePart=value=>JSON.parse(Buffer.from(value,'base64url').toString('utf8'));

export async function verifyMessinhoGitHubActionsIdentity({token,sourceSha,runId,runAttempt,fetchImpl=fetch,nowSeconds=Math.floor(Date.now()/1000)}={}) {
  if(typeof token!=='string'||token.length<100||token.length>12000)return {ok:false,code:'OIDC_TOKEN_INVALID'};
  const parts=token.split('.');
  if(parts.length!==3)return {ok:false,code:'OIDC_TOKEN_FORMAT_INVALID'};
  let header,claims,signature;
  try{header=decodePart(parts[0]);claims=decodePart(parts[1]);signature=Buffer.from(parts[2],'base64url');}
  catch{return {ok:false,code:'OIDC_TOKEN_DECODE_FAILED'};}
  if(header.alg!=='RS256'||typeof header.kid!=='string'||!signature.length)return {ok:false,code:'OIDC_TOKEN_HEADER_REJECTED'};
  try{
    const response=await fetchImpl('https://token.actions.githubusercontent.com/.well-known/jwks',{
      headers:{Accept:'application/json'},signal:AbortSignal.timeout(10000)
    });
    if(!response.ok)return {ok:false,code:'OIDC_KEYS_UNAVAILABLE'};
    const jwks=await response.json();
    const jwk=(jwks.keys||[]).find(key=>key.kid===header.kid&&key.kty==='RSA'&&key.use==='sig'&&(!key.alg||key.alg==='RS256'));
    if(!jwk)return {ok:false,code:'OIDC_SIGNING_KEY_NOT_FOUND'};
    const publicKey=createPublicKey({key:jwk,format:'jwk'});
    const valid=verifySignature('RSA-SHA256',Buffer.from(parts[0]+'.'+parts[1]),publicKey,signature);
    if(!valid)return {ok:false,code:'OIDC_SIGNATURE_INVALID'};
  }catch{return {ok:false,code:'OIDC_SIGNATURE_CHECK_FAILED'};}
  const audiences=Array.isArray(claims.aud)?claims.aud:[claims.aud];
  const expectedSub='repo:'+REPOSITORY+':ref:'+REF;
  if(claims.iss!==ISSUER||!audiences.includes(AUDIENCE)||claims.repository!==REPOSITORY||
     claims.ref!==REF||claims.sub!==expectedSub||claims.workflow_ref!==WORKFLOW_REF||
     claims.event_name!=='workflow_dispatch')return {ok:false,code:'OIDC_WORKFLOW_IDENTITY_REJECTED'};
  if(!Number.isFinite(claims.exp)||claims.exp<=nowSeconds||
     !Number.isFinite(claims.iat)||claims.iat>nowSeconds+30||nowSeconds-claims.iat>900||
     (claims.nbf!==undefined&&(!Number.isFinite(claims.nbf)||claims.nbf>nowSeconds+30)))
    return {ok:false,code:'OIDC_TOKEN_EXPIRED_OR_NOT_YET_VALID'};
  if(claims.sha!==sourceSha||String(claims.run_id)!==String(runId)||
     String(claims.run_attempt)!==String(runAttempt))return {ok:false,code:'OIDC_RUN_BINDING_MISMATCH'};
  return {ok:true,claims:{repository:claims.repository,ref:claims.ref,workflow_ref:claims.workflow_ref,
    source_sha:claims.sha,run_id:String(claims.run_id),run_attempt:String(claims.run_attempt)}};
}
