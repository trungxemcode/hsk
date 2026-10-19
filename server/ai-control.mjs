// Cloudflare Durable Object: centralized, atomic AI budget and reusable reading cache.
// Never stores provider keys, Firebase ID tokens, private translation prompts or images.
export class HSkaIControl {
 constructor(state,env){this.state=state;this.env=env;}
 async fetch(request){
  if(request.method!=='POST')return Response.json({error:'method'},{status:405});
  let data;try{data=await request.json()}catch{return Response.json({error:'payload'},{status:400})}
  if(!data||typeof data!=='object'||!['reserve','get','put','lock','unlock','gemini-pick','gemini-report','gemini-status','abuse-start','abuse-finish'].includes(data.action))
   return Response.json({error:'action'},{status:400});
  const time=Date.now();
  if(data.action==='abuse-start'||data.action==='abuse-finish')return abuseControl(this.state.storage,this.env,data,time);
  if(data.action==='gemini-status'){
   if(!Array.isArray(data.ids)||data.ids.length>13||!data.ids.every(id=>typeof id==='string'&&/^[a-f0-9]{64}$/.test(id)))return Response.json({error:'keys'},{status:400});
   const pool=await this.state.storage.get('gemini:pool')||{};
   return Response.json({slots:data.ids.map((id,index)=>({index,retryAfter:Math.max(0,Math.ceil(((pool.blocked?.[id]||0)-time)/1000))}))});
  }
  if(data.action==='gemini-pick'){
   const validId=id=>typeof id==='string'&&/^[a-f0-9]{64}$/.test(id);
   if(!Array.isArray(data.ids)||data.ids.length<1||data.ids.length>13||!data.ids.every(validId)||new Set(data.ids).size!==data.ids.length||!Array.isArray(data.excluded)||data.excluded.length>13||!data.excluded.every(id=>data.ids.includes(id)))return Response.json({error:'keys'},{status:400});
   const result=await this.state.storage.transaction(async t=>{
    const previous=await t.get('gemini:pool')||{},pool={cursor:Number(previous.cursor)||0,ids:data.ids,blocked:{}};
    for(const id of data.ids)if(previous.blocked?.[id]>time)pool.blocked[id]=previous.blocked[id];
    let index=-1,retryAt=Infinity;
    for(let n=0;n<data.ids.length;n++){const i=(pool.cursor+n)%data.ids.length,id=data.ids[i];if(data.excluded.includes(id))continue;if(!pool.blocked[id]){index=i;break;}retryAt=Math.min(retryAt,pool.blocked[id]);}
    if(index>=0)pool.cursor=(index+1)%data.ids.length;
    await t.put('gemini:pool',pool);
    return {index,retryAfter:Number.isFinite(retryAt)?Math.max(1,Math.ceil((retryAt-time)/1000)):60};
   });return Response.json(result);
  }
  if(data.action==='gemini-report'){
   if(typeof data.id!=='string'||!/^[a-f0-9]{64}$/.test(data.id)||!Number.isFinite(data.delay)||data.delay<1000||data.delay>Number.MAX_SAFE_INTEGER-time)return Response.json({error:'key-report'},{status:400});
   await this.state.storage.transaction(async t=>{const pool=await t.get('gemini:pool');if(pool?.ids?.includes(data.id)){pool.blocked||={};pool.blocked[data.id]=Math.max(pool.blocked[data.id]||0,time+data.delay);await t.put('gemini:pool',pool);}});
   return Response.json({ok:true});
  }
  if(data.action==='reserve'){
   if(typeof data.uid!=='string'||!/^[-\w:]{1,150}$/.test(data.uid)||typeof data.route!=='string'||!/^[-\w:]{1,55}$/.test(data.route))return Response.json({error:'input'},{status:400});
   // UID comes only from the Worker's Firebase-verified account, never a client role flag.
   const admins=(this.env.ADMIN_UIDS||'').split(',').map(uid=>uid.trim()).filter(Boolean);
   if(admins.includes(data.uid))return Response.json({allowed:true,unlimited:true});
   const day=new Date(time).toISOString().slice(0,10),minute=Math.floor(time/60000);
   const globalDayLimit=Math.max(1,Math.min(10000,Number(this.env.AI_GLOBAL_DAILY_LIMIT)||180));
   const globalMinuteLimit=Math.max(1,Math.min(1000,Number(this.env.AI_GLOBAL_MINUTE_LIMIT)||10));
   const fresh=this.env.AI_ABUSE_ENABLED==='true'&&data.newAccount===true;
   const userDayLimit=Math.max(1,Math.min(fresh?13:500,Number(this.env.AI_USER_DAILY_LIMIT)||50));
   const readingDayLimit=Math.max(1,Math.min(fresh?3:100,Number(this.env.AI_USER_READING_DAILY_LIMIT)||15));
   const queryDayLimit=Math.max(1,Math.min(fresh?10:500,Number(this.env.AI_USER_QUERY_DAILY_LIMIT)||35));
   const userKey='u:'+day+':'+data.uid,readingKey='r:'+day+':'+data.uid;
   const dayKey='g:'+day,minuteKey='m:'+minute;
   const result=await this.state.storage.transaction(async t=>{
    const [globalDay,globalMinute,userDay,userReading]=await Promise.all([t.get(dayKey),t.get(minuteKey),t.get(userKey),t.get(readingKey)]);
    const count=[globalDay||0,globalMinute||0,userDay||0,userReading||0];
    if(count[0]>=globalDayLimit)return {allowed:false,reason:'global-daily'};
    if(count[1]>=globalMinuteLimit)return {allowed:false,reason:'global-minute'};
    if(count[2]>=userDayLimit)return {allowed:false,reason:fresh?'new-user-daily':'user-daily'};
    if(data.route!=='reading'&&Math.max(0,count[2]-count[3])>=queryDayLimit)return {allowed:false,reason:fresh?'new-user-query-daily':'user-query-daily'};
    if(data.route==='reading'&&count[3]>=readingDayLimit)return {allowed:false,reason:fresh?'new-user-reading-daily':'user-reading-daily'};
    const updates={[dayKey]:count[0]+1,[minuteKey]:count[1]+1,[userKey]:count[2]+1};
    if(data.route==='reading')updates[readingKey]=count[3]+1;
    await t.put(updates);
    return {allowed:true,remainingGlobalDay:globalDayLimit-count[0]-1,remainingUserDay:userDayLimit-count[2]-1};
   });
   return Response.json(result,{status:result.allowed?200:429});
  }
  if(typeof data.key!=='string'||!/^[-\w]{10,140}$/.test(data.key))return Response.json({error:'key'},{status:400});
  const key='story:'+data.key,lock='lock:'+data.key;
  if(data.action==='get'){
   const stored=await this.state.storage.get(key);
   if(stored?.expiresAt>time&&stored.story)return Response.json({hit:true,story:stored.story});
   return Response.json({hit:false});
  }
  if(data.action==='lock'){
   const got=await this.state.storage.transaction(async t=>{
    const curr=await t.get(lock);
    if(curr?.expiresAt>time)return false;
    await t.put(lock,{expiresAt:time+105000});
    return true;
   });
   return Response.json({acquired:got},{status:got?200:409});
  }
  if(data.action==='unlock'){await this.state.storage.delete(lock);return Response.json({ok:true})}
  if(data.action==='put'){
   if(!data.story||typeof data.story!=='object'||JSON.stringify(data.story).length>30000)return Response.json({error:'story'},{status:400});
   await this.state.storage.put(key,{story:data.story,expiresAt:time+14*86400000});
   if(data.keepLock!==true)await this.state.storage.delete(lock);
   return Response.json({ok:true});
  }
  return Response.json({error:'unknown'},{status:400});
 }
}
export async function readingCacheKey(body){
 // No UID or Firebase ID token; shared educational story across accounts with same lesson vocabulary.
 const lesson=(body.lessonWords||[]).slice(0,20).map(x=>({han:x.han,mean:x.mean}));
 const canonical=JSON.stringify({v:3,hsk:body.hsk,genre:body.genre||'legacy-dialogue',lessonId:body.lessonId||'',lesson,sourceId:body.sourceId||'',topic:body.topic||'',angle:body.angle||''});
 const bytes=new TextEncoder().encode(canonical),digest=await crypto.subtle.digest('SHA-256',bytes);
 return 'v3_'+Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,'0')).join('');
}
export async function controlCall(env,action,data={},namespace='global-hsk-budget-v1'){
 const obj=env.AI_CONTROL;
 if(!obj){if(env.AI_CONTROL_REQUIRED==='true')throw Error('AI_CONTROL binding required');return null;}
 const stub=obj.get(obj.idFromName(namespace));
 const response=await stub.fetch('https://internal.hsk/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...data})});
 const result=await response.json();
 return {status:response.status,...result};
}

// Only the authenticated Worker calls these actions. Never trust a browser admin flag.
async function abuseControl(storage,env,data,time){
 if(typeof data.uid!=='string'||!/^[-\w:]{1,150}$/.test(data.uid))return Response.json({error:'input'},{status:400});
 if((env.ADMIN_UIDS||'').split(',').map(s=>s.trim()).includes(data.uid))return Response.json({allowed:true,unlimited:true});
 if(env.AI_ABUSE_ENABLED!=='true')return Response.json({allowed:true,disabled:true});
 if(typeof data.lease!=='string'||!/^[a-f0-9-]{36}$/.test(data.lease))return Response.json({error:'lease'},{status:400});
 const owner=await abuseFingerprint('owner',data.uid),key='abuse:u:'+owner;
 if(data.action==='abuse-start'){
  if(typeof data.fingerprint!=='string'||!/^[a-f0-9]{64}$/.test(data.fingerprint)||!['reading','query'].includes(data.kind))return Response.json({error:'input'},{status:400});
  const result=await storage.transaction(async t=>{
   if(env.AI_PAUSED==='true')return {allowed:false,reason:'paused',retryAfter:60};
   const trip=await t.get('abuse:trip:'+data.kind);
   if(trip?.until>time)return {allowed:false,reason:'circuit-open',retryAfter:Math.ceil((trip.until-time)/1000)};
   const current=await t.get(key)||{};
   if(current.lease&&current.expiresAt>time)return {allowed:false,reason:current.fingerprint===data.fingerprint?'duplicate':'concurrent',retryAfter:Math.max(1,Math.ceil((current.expiresAt-time)/1000))};
   const next=Math.max(current.nextAt||0,data.kind==='reading'?current.readingAt||0:0);
   if(next>time)return {allowed:false,reason:'rate',retryAfter:Math.max(1,Math.ceil((next-time)/1000))};
   await t.put(key,{lease:data.lease,kind:data.kind,fingerprint:data.fingerprint,expiresAt:time+150000,nextAt:time+3000,readingAt:data.kind==='reading'?time+10000:current.readingAt||0});
   return {allowed:true,lease:data.lease};
  });return Response.json(result,{status:result.allowed?200:429});
 }
 if(!Number.isInteger(data.status)||data.status<200||data.status>599)return Response.json({error:'status'},{status:400});
 await storage.transaction(async t=>{
  const current=await t.get(key);
  // A stale completion must not release a replacement request or alter its circuit.
  if(current?.lease!==data.lease)return;
  await t.put(key,{nextAt:current.nextAt,readingAt:current.readingAt});
  if(data.status>=500){
   const tripKey='abuse:trip:'+current.kind,prior=await t.get(tripKey)||{},fresh=prior.windowAt>time-120000;
   const failures=fresh?(prior.failures||0)+1:1;
   await t.put(tripKey,{windowAt:fresh?prior.windowAt:time,failures,until:failures>=8?Math.max(prior.until||0,time+60000):prior.until||0});
  }
 });return Response.json({ok:true});
}
export async function abuseFingerprint(route,value){
 const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify([route,canonical(value)])));
 return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
}
