/**
 * MESSINHO provider-neutral model runtime.
 * Supports OpenAI-compatible chat-completions endpoints, including hosted and self-hosted models.
 * Provider errors are returned as bounded diagnostics; secrets and response bodies are never logged.
 */
export const MESSINHO_MODEL_RUNTIME_VERSION='1.0.0';

export function resolveMessinhoModelConfig(env=process.env){
  const baseUrl=String(env.MESSINHO_MODEL_BASE_URL||env.OPENAI_BASE_URL||'https://api.openai.com/v1').trim().replace(/\/+$/u,'');
  const apiKey=String(env.MESSINHO_MODEL_API_KEY||env.OPENAI_API_KEY||'').trim();
  const model=String(env.MESSINHO_MODEL_NAME||env.OPENAI_MODEL||'gpt-4.1-mini').trim();
  return {baseUrl,apiKey,model,requiresApiKey:!/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?:\/|$)/iu.test(baseUrl)};
}

function endpointFor(baseUrl){
  const base=String(baseUrl||'').trim().replace(/\/+$/u,'');
  if(!base)return null;
  return /\/chat\/completions$/iu.test(base)?base:base+'/chat/completions';
}

function extractProviderError(payload,status,headers){
  const error=payload?.error||{};
  const code=typeof error.code==='string'?error.code:
    (typeof error.type==='string'?error.type:'provider_http_'+status);
  const message=typeof error.message==='string'?error.message.slice(0,500):'The model provider rejected the request.';
  const retryAfter=Number(headers?.get?.('retry-after'));
  return {status:'provider_error',http_status:status,error_code:code,error_message:message,
    ...(Number.isFinite(retryAfter)&&retryAfter>0?{retry_after_ms:Math.min(2000,retryAfter*1000)}:{})};
}

function isSchemaModeUnsupported(result){
  if(result.http_status!==400)return false;
  const detail=(result.error_code+' '+result.error_message).toLowerCase();
  return /response_format|json_schema|structured output|unsupported_parameter|not supported|does not support/iu.test(detail);
}

export async function requestMessinhoModelCompletion({
  messages,model,apiKey,baseUrl='https://api.openai.com/v1',fetchImpl=fetch,timeoutMs=18000,
  temperature=0.2,responseFormat=null,maxTokens=null,maxTokensLimit=128
}={}){
  const endpoint=endpointFor(baseUrl);
  if(!endpoint||typeof fetchImpl!=='function')return {status:'unavailable',content:null,error_code:'model_endpoint_unavailable'};
  if(!apiKey&& !/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?:\/|$)/iu.test(String(baseUrl||''))){
    return {status:'unavailable',content:null,error_code:'model_api_key_missing'};
  }
  const tokenCap=Math.max(1,Math.min(8192,Math.floor(Number(maxTokensLimit)||128)));
  const tokenLimit=maxTokens===null||maxTokens===undefined?null:Math.max(1,Math.min(tokenCap,Math.floor(Number(maxTokens)||64)));
  const baseBody={model:String(model||'').trim(),messages,temperature,...(tokenLimit===null?{}:{max_tokens:tokenLimit})};
  if(!baseBody.model)return {status:'unavailable',content:null,error_code:'model_name_missing'};
  const perform=async(format)=>{
    try{
      const response=await fetchImpl(endpoint,{
        method:'POST',
        signal:AbortSignal.timeout(timeoutMs),
        headers:{'Content-Type':'application/json',...(apiKey?{Authorization:'Bearer '+apiKey}:{})},
        body:JSON.stringify({...baseBody,...(format?{response_format:format}:{})})
      });
      const payload=typeof response.json==='function'?await response.json().catch(()=>({})):{};
      if(!response.ok)return extractProviderError(payload,response.status,response.headers);
      const content=payload?.choices?.[0]?.message?.content;
      if(typeof content!=='string'||!content.trim())return {status:'invalid_output',content:null,error_code:'empty_model_response'};
      return {status:'completed',content:content.trim(),usage:payload.usage||null,model:payload.model||baseBody.model};
    }catch(error){
      return {status:'error',content:null,error_code:error?.name==='TimeoutError'?'timeout':'provider_request_failed'};
    }
  };
  let result=await perform(responseFormat);
  if(responseFormat?.type==='json_schema'&&isSchemaModeUnsupported(result)){
    result=await perform({type:'json_object'});
    if(result.status==='completed')result.compatibility_mode='json_object_fallback';
  }
  return result;
}
