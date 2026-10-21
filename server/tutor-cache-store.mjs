import {qaValidResponse} from './tutor-cache.mjs';

const qaPrefix='qa:v1:',qaHashRE=/^[a-f0-9]{64}$/,qaLeaseRE=/^[a-f0-9-]{36}$/;
async function qaSchedule(storage,time){if(typeof storage.setAlarm==='function'){const current=await storage.getAlarm();if(!current||current>time+3600000)await storage.setAlarm(time+3600000);}}
async function qaStat(t,key,amount=1){const k=qaPrefix+'stats',s=await t.get(k)||{};s[key]=Math.min(1e12,(Number(s[key])||0)+amount);await t.put(k,s);}
function qaStamp(time,key){return String(time).padStart(16,'0')+'_'+key;}
export async function qaCacheControl(storage,env,data,time=Date.now()){
 const response=(data,status=200)=>Response.json(data,{status});
 if(data.action==='qa-stats')return response(await storage.get(qaPrefix+'stats')||{});
 if(data.action==='qa-shadow-reserve'){
  const result=await storage.transaction(async t=>{
   const k=qaPrefix+'shadow-budget',s=await t.get(k)||{},day=new Date(time).toISOString().slice(0,10);
   if(s.day!==day){s.day=day;s.count=0;}
   const limit=Math.max(0,Math.min(20,Number(env.QA_SHADOW_DAILY_LIMIT??20)||0));
   if((s.after||0)>time||s.count>=limit)return {allowed:false};s.count++;await t.put(k,s);return {allowed:true};
  });return response(result);
 }
 if(data.action==='qa-shadow-error'){
  await storage.transaction(async t=>{const k=qaPrefix+'shadow-budget',s=await t.get(k)||{};s.after=time+3600000;await t.put(k,s);await qaStat(t,'shadowErrors');});return response({ok:true});
 }
 if(!qaHashRE.test(data.key||''))return response({error:'qa_key'},400);
 if(data.action==='qa-unlock'){
  if(!qaLeaseRE.test(data.lease||''))return response({error:'qa_lease'},400);
  await storage.transaction(async t=>{const k=qaPrefix+'lock:'+data.key,l=await t.get(k);if(l?.lease===data.lease)await t.delete(k);});return response({ok:true});
 }
 if(!qaHashRE.test(data.scope||''))return response({error:'qa_scope'},400);
 const recordKey=qaPrefix+'record:'+data.key,lockKey=qaPrefix+'lock:'+data.key;
 if(data.action==='qa-begin'){
  if(!qaLeaseRE.test(data.lease||''))return response({error:'qa_lease'},400);
  const result=await storage.transaction(async t=>{
   const saved=await t.get(recordKey);
   if(saved?.expiresAt>time&&saved.scope===data.scope){await qaStat(t,'hits');return {hit:true,value:saved.value,provider:saved.provider};}
   const prior=await t.get(lockKey);
   if(prior?.until>time){await qaStat(t,'busy');return {hit:false,acquired:false};}
   await t.put(lockKey,{lease:data.lease,scope:data.scope,until:time+60000});
   await t.put(qaPrefix+'leasegc:'+qaStamp(time+60000,data.key),true);
   await qaStat(t,'misses');return {hit:false,acquired:true};
  });await qaSchedule(storage,time);return response(result);
 }
 if(data.action==='qa-put'){
  if(!qaLeaseRE.test(data.lease||'')||!Number.isInteger(data.ttl)||data.ttl<60||data.ttl>604800||JSON.stringify(data.value||null).length>30000||!qaValidResponse(data.route,data.value))return response({error:'qa_value'},400);
  const result=await storage.transaction(async t=>{
   const lock=await t.get(lockKey);
   if(lock?.lease!==data.lease||lock.scope!==data.scope||lock.until<=time){await qaStat(t,'staleWritesRejected');return {ok:false,reason:'stale'};}
   // A hard pilot bound prevents this feature from becoming an unbounded store.
   const old=await t.get(recordKey),count=Number(await t.get(qaPrefix+'records'))||0;
   if(!old&&count>=2048)return {ok:false,reason:'capacity'};
   const expiresAt=time+data.ttl*1000;
   await t.put(recordKey,{scope:data.scope,value:data.value,provider:['gemini','xkiro'].includes(data.provider)?data.provider:'',expiresAt});
   await t.put(qaPrefix+'gc:'+qaStamp(expiresAt,data.key),true);
   if(!old)await t.put(qaPrefix+'records',count+1);await t.delete(lockKey);await qaStat(t,'writes');return {ok:true};
  });await qaSchedule(storage,time);return response(result);
 }
 if(data.action==='qa-shadow'){
  if(data.model!=='gemini-embedding-2/768'||!Array.isArray(data.vector)||data.vector.length!==768||!data.vector.every(Number.isFinite)||data.vector.every(n=>n===0))return response({error:'qa_vector'},400);
  const result=await storage.transaction(async t=>{
   const index=await t.get(qaPrefix+'shadow-index')||[],keep=[];let best=null,candidates=0;
   const norm=Math.sqrt(data.vector.reduce((n,v)=>n+v*v,0));
   if(!Number.isFinite(norm)||norm===0)return {ok:false};
   for(const row of index){
    if(row.expiresAt<=time){await t.delete(qaPrefix+'vector:'+row.key);continue;}
    if(row.key!==data.key)keep.push(row);
    if(row.scope!==data.scope||row.key===data.key)continue;
    const v=await t.get(qaPrefix+'vector:'+row.key);if(!v)continue;
    const score=data.vector.reduce((sum,x,i)=>sum+(x/norm)*v[i],0);candidates++;best=best===null?score:Math.max(best,score);
   }
   keep.push({key:data.key,scope:data.scope,expiresAt:time+86400000});
   while(keep.length>64){const old=keep.shift();await t.delete(qaPrefix+'vector:'+old.key);}
   await t.put(qaPrefix+'vector:'+data.key,data.vector.map(v=>v/norm));await t.put(qaPrefix+'shadow-index',keep);await qaStat(t,'shadowObserved');
   if(best!==null&&best>=0.92)await qaStat(t,'shadowAboveThreshold');
   return {ok:true,candidates,bestSimilarity:best,servedSemantic:false};
  });await qaSchedule(storage,time);return response(result);
 }
 return response({error:'qa_action'},400);
}
export async function qaCacheAlarm(storage,time=Date.now()){
 for(const [prefix,target,field] of [[qaPrefix+'gc:',qaPrefix+'record:','expiresAt'],[qaPrefix+'leasegc:',qaPrefix+'lock:','until']]){
  const due=await storage.list({prefix,end:prefix+String(time+1).padStart(16,'0'),limit:128});
  for(const [key] of due){const hash=key.slice(key.lastIndexOf('_')+1);await storage.transaction(async t=>{const record=await t.get(target+hash);if(record&&record[field]<=time){await t.delete(target+hash);if(field==='expiresAt'){const count=Number(await t.get(qaPrefix+'records'))||0;await t.put(qaPrefix+'records',Math.max(0,count-1));}}await t.delete(key);});}
 }
 const index=await storage.get(qaPrefix+'shadow-index')||[],keep=[];
 for(const item of index)if(item.expiresAt<=time)await storage.delete(qaPrefix+'vector:'+item.key);else keep.push(item);
 if(keep.length!==index.length)await storage.put(qaPrefix+'shadow-index',keep);
 const pending=await storage.list({prefix:qaPrefix+'gc:',limit:1}),locks=await storage.list({prefix:qaPrefix+'leasegc:',limit:1});
 if(pending.size||locks.size||keep.length)await storage.setAlarm(time+3600000);
}
