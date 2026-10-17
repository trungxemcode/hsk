// Cloudflare Durable Object: centralized, atomic AI budget and reusable reading cache.
// Never stores provider keys, Firebase ID tokens, private translation prompts or images.
export class HSkaIControl {
 constructor(state,env){this.state=state;this.env=env;}
 async fetch(request){
  if(request.method!=='POST')return Response.json({error:'method'},{status:405});
  let data;try{data=await request.json()}catch{return Response.json({error:'payload'},{status:400})}
  if(!data||typeof data!=='object'||!['reserve','get','put','lock','unlock'].includes(data.action))
   return Response.json({error:'action'},{status:400});
  const time=Date.now();
  if(data.action==='reserve'){
   if(typeof data.uid!=='string'||!/^[-\w:]{1,150}$/.test(data.uid)||typeof data.route!=='string'||!/^[-\w:]{1,55}$/.test(data.route))return Response.json({error:'input'},{status:400});
   // UID comes only from the Worker's Firebase-verified account, never a client role flag.
   const admins=(this.env.ADMIN_UIDS||'').split(',').map(uid=>uid.trim()).filter(Boolean);
   if(admins.includes(data.uid))return Response.json({allowed:true,unlimited:true});
   const day=new Date(time).toISOString().slice(0,10),minute=Math.floor(time/60000);
   const globalDayLimit=Math.max(1,Math.min(10000,Number(this.env.AI_GLOBAL_DAILY_LIMIT)||180));
   const globalMinuteLimit=Math.max(1,Math.min(1000,Number(this.env.AI_GLOBAL_MINUTE_LIMIT)||10));
   const userDayLimit=Math.max(1,Math.min(500,Number(this.env.AI_USER_DAILY_LIMIT)||50));
   const readingDayLimit=Math.max(1,Math.min(100,Number(this.env.AI_USER_READING_DAILY_LIMIT)||15));
   const queryDayLimit=Math.max(1,Math.min(500,Number(this.env.AI_USER_QUERY_DAILY_LIMIT)||35));
   const userKey='u:'+day+':'+data.uid,readingKey='r:'+day+':'+data.uid;
   const dayKey='g:'+day,minuteKey='m:'+minute;
   const result=await this.state.storage.transaction(async t=>{
    const [globalDay,globalMinute,userDay,userReading]=await Promise.all([t.get(dayKey),t.get(minuteKey),t.get(userKey),t.get(readingKey)]);
    const count=[globalDay||0,globalMinute||0,userDay||0,userReading||0];
    if(count[0]>=globalDayLimit)return {allowed:false,reason:'global-daily'};
    if(count[1]>=globalMinuteLimit)return {allowed:false,reason:'global-minute'};
    if(count[2]>=userDayLimit)return {allowed:false,reason:'user-daily'};
    if(data.route!=='reading'&&Math.max(0,count[2]-count[3])>=queryDayLimit)return {allowed:false,reason:'user-query-daily'};
    if(data.route==='reading'&&count[3]>=readingDayLimit)return {allowed:false,reason:'user-reading-daily'};
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
   await this.state.storage.delete(lock);
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
export async function controlCall(env,action,data={}){
 const obj=env.AI_CONTROL;
 if(!obj){if(env.AI_CONTROL_REQUIRED==='true')throw Error('AI_CONTROL binding required');return null;}
 const stub=obj.get(obj.idFromName('global-hsk-budget-v1'));
 const response=await stub.fetch('https://internal.hsk/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...data})});
 const result=await response.json();
 return {status:response.status,...result};
}
