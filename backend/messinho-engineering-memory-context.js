const clean=(value,max=500)=>String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);

/** Only Admin-approved, evidence-verified engineering observations are reusable. */
export async function loadMessinhoApprovedEngineeringMemory({db,limit=8}={}) {
  if(!db)return {available:false,entries:[]};
  try{
    const {data,error}=await db.from('messinho_engineering_memory')
      .select('outcome,summary,source_sha,patch_sha256,toolchain,created_at')
      .eq('review_state','approved').eq('evidence_verified',true)
      .in('outcome',['passed','failed']).order('created_at',{ascending:false})
      .limit(Math.min(12,Math.max(1,Number(limit)||8)));
    if(error)return {available:false,entries:[],error_code:error.code||'query_failed'};
    return {available:true,entries:(data||[]).map(item=>({
      outcome:item.outcome==='passed'?'success':'failed_validation',
      summary:clean(item.summary),source_sha:clean(item.source_sha,40),
      patch_sha256:clean(item.patch_sha256,64),toolchain:item.toolchain||{},
      recorded_at:item.created_at
    }))};
  }catch{return {available:false,entries:[]};}
}
