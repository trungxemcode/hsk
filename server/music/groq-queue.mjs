// Durable R2 jobs, consumed by Cron. No browser, laptop, or VPS must stay online.
import {identity} from './worker.mjs';
import {alignGroq,bounded} from './groq-alignment.mjs';
const PREFIX='groq-pending/',HISTORY='groq-jobs/',COOLDOWN='groq-queue/cooldown.json',LEASE=600000;
const read=async object=>object?JSON.parse(new TextDecoder().decode(await bounded(object.body,600000))):null;
function metadata(j){return {state:j.state||'cooldown',nextAt:String(j.nextAt||0),leaseUntil:String(j.leaseUntil||0),createdAt:String(j.createdAt),jobId:j.jobId||''};}
async function save(bucket,key,j,onlyIf){return bucket.put(key,JSON.stringify(j),{httpMetadata:{contentType:'application/json; charset=utf-8',cacheControl:'no-store'},customMetadata:metadata(j),...(onlyIf?{onlyIf}:{})});}
export async function enqueueGroqJob(id,duration,env,now=Date.now()){
 if(env.MUSIC_GROQ_ENABLED!=='true')return {queued:false,error:'Groq chưa bật.'};
 const b=env.MUSIC_BUCKET,audio=await b.head('audio/'+id),source=await b.head('lyrics/'+id+'.json')||await b.head('lyrics-sources/'+id+'.json');
 if(!audio||audio.customMetadata?.published!=='true'||!source)return {queued:false,error:'Cần audio và script trong kho.'};
 if(audio.size>12*1024*1024||!Number.isFinite(duration)||duration<=0||duration>480)return {queued:false,error:'Audio/script vượt giới hạn Groq.'};
 const key=PREFIX+id+'.json',old=await b.head(key),prior=old?await read(await b.get(key)):null;
 if(prior?.sourceEtag===source.httpEtag)return {queued:true,job:prior,duplicate:true};
 const sourceKey=await b.head('lyrics/'+id+'.json')?'lyrics/'+id+'.json':'lyrics-sources/'+id+'.json';
 const job={sourceKey,jobId:crypto.randomUUID(),trackId:id,duration,sourceEtag:source.httpEtag,state:'queued',createdAt:now,nextAt:now,attempts:0};
 const written=await save(b,key,job,old?{etagMatches:old.etag}:{etagDoesNotMatch:'*'});
 if(!written)return {queued:true,duplicate:true};
 return {queued:true,job};
}
export async function groqQueueRoute(request,env,json,fetchFn=fetch){
 const m=new URL(request.url).pathname.match(/^\/api\/admin\/tracks\/([a-f0-9]{64}\.(?:mp3|m4a))\/alignment-job(\/cancel)?$/);if(!m)return null;
 if(!['GET','POST'].includes(request.method))return json({error:'Chỉ hỗ trợ GET/POST.'},405);
 const actor=await identity(request,env,fetchFn);if(!actor.admin)return json({error:'Chỉ chủ kho được xử lý hàng đợi.'},403);
 const id=m[1],b=env.MUSIC_BUCKET;
 if(m[2]){if(request.method!=='POST')return json({error:'Chỉ hỗ trợ POST.'},405);const prior=await read(await b.get(PREFIX+id+'.json'));await b.delete(PREFIX+id+'.json');if(prior)await save(b,HISTORY+id+'.json',{...prior,state:'cancelled',finishedAt:Date.now()});return json({state:'cancelled'});}
 if(request.method==='POST'){
  let input;try{input=JSON.parse(new TextDecoder().decode(await bounded(request.body,1024)));}catch{return json({error:'Yêu cầu chưa hợp lệ.'},400);}
  if(!input||Object.keys(input).some(k=>k!=='duration'))return json({error:'Yêu cầu chưa hợp lệ.'},400);
  const answer=await enqueueGroqJob(id,input.duration,env);return json(answer,answer.queued?202:400);
 }
 const job=await read(await b.get(PREFIX+id+'.json'))||await read(await b.get(HISTORY+id+'.json'));
 if(!job)return json({state:'none'});
 if(job.state==='done'){
  const source=await b.head(job.sourceKey||'lyrics/'+id+'.json');
  if(source?.httpEtag!==job.sourceEtag)return json({...job,state:'stale'});
  return json({...job,result:await read(await b.get('lyrics-drafts/'+id+'/groq.json'))});
 }
 return json(job);
}
function retryTime(value,now){const seconds=Number(value);const parsed=Number.isFinite(seconds)&&seconds>0?now+seconds*1000:Date.parse(value);return Math.max(now+60000,Number.isFinite(parsed)?parsed:now+120000);}
export async function runGroqQueue(env,{fetchFn=fetch,now=Date.now()}={}){
 const b=env.MUSIC_BUCKET;if(!b||env.MUSIC_GROQ_ENABLED!=='true')return {state:'disabled'};
 const global=await b.head('groq-locks/global');if(global&&now-Number(global.customMetadata?.createdAt||now)<LEASE)return {state:'busy'};
 const cooldown=await read(await b.get(COOLDOWN));if(cooldown?.until>now)return {state:'cooldown',until:cooldown.until};
 const listed=await b.list({prefix:PREFIX,limit:100,include:['customMetadata']});
 const ready=listed.objects.filter(o=>Number(o.customMetadata?.nextAt||0)<=now&&(o.customMetadata?.state!=='running'||Number(o.customMetadata?.leaseUntil||0)<=now)).sort((a,b)=>Number(a.customMetadata?.createdAt||0)-Number(b.customMetadata?.createdAt||0));
 if(!ready.length)return {state:'idle'};
 const item=ready[0],head=await b.head(item.key),job=await read(await b.get(item.key));if(!head||!job)return {state:'idle'};
 const claimed={...job,state:'running',attempts:job.attempts+1,leaseUntil:now+LEASE};if(!await save(b,item.key,claimed,{etagMatches:head.etag}))return {state:'busy'};
 let result,status;
 try{
  const source=await b.head(job.sourceKey||'lyrics/'+job.trackId+'.json');
  if(source?.httpEtag!==job.sourceEtag){status=410;result={error:'Script đã thay đổi; không xử lý bản cũ.'};}
  else{const response=await alignGroq(job.trackId,job.duration,env,(v,s=200)=>Response.json(v,{status:s}),fetchFn);status=response.status;result=await response.json();}
 }catch(e){status=e.status||503;result={error:e.status?e.message:'Chưa xử lý được bài; sẽ thử lại.',...(e.retryAfter?{retryAfter:e.retryAfter}:{})};}
 // A newer script can replace a pending job while this invocation is running.
 const currentHead=await b.head(item.key),current=await read(await b.get(item.key));if(current?.jobId!==job.jobId)return {state:'superseded'};
 if(status===429){const nextAt=retryTime(result.retryAfter,Date.now());await save(b,COOLDOWN,{until:nextAt,createdAt:now});await save(b,item.key,{...claimed,state:'waiting',nextAt,leaseUntil:0,error:result.error},{etagMatches:currentHead.etag});return {state:'waiting',until:nextAt};}
 if((status===409||status>=500||status===408)&&claimed.attempts<5){const nextAt=now+Math.min(900000,60000*2**(claimed.attempts-1));await save(b,item.key,{...claimed,state:'waiting',nextAt,leaseUntil:0,error:result.error},{etagMatches:currentHead.etag});return {state:'waiting'};}
 const terminal={...claimed,state:status===200?'done':'failed',finishedAt:Date.now(),leaseUntil:0,error:result.error||null,diagnostics:result.diagnostics||null};
 await save(b,HISTORY+job.trackId+'.json',terminal);const last=await read(await b.get(item.key));if(last?.jobId===job.jobId)await b.delete(item.key);
 return {state:terminal.state,trackId:job.trackId};
}
