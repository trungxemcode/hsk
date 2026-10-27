import test from 'node:test';
import assert from 'node:assert/strict';
import {enqueueGroqJob,groqQueueRoute,runGroqQueue} from './music/groq-queue.mjs';
import {OWNER_UID} from './account-roles.mjs';
function fixture(count=1){
 const objects=new Map();let revision=0,calls=0,active=0,maximum=0,status=200,hold=null;
 function set(key,value,meta={}){const bytes=typeof value==='string'?new TextEncoder().encode(value):value,etag=String(++revision);const object={bytes,size:bytes.length,etag,httpEtag:'"'+etag+'"',customMetadata:meta};objects.set(key,object);return object;}
 const bucket={async head(k){return objects.get(k)||null;},async get(k){const o=objects.get(k);return o?{body:new Response(o.bytes).body}:null;},async list({prefix,limit=100}){return {objects:[...objects].filter(([k])=>k.startsWith(prefix)).slice(0,limit).map(([key,o])=>({key,...o})),truncated:false};},async put(k,v,o={}){const old=objects.get(k);if(o.onlyIf?.etagDoesNotMatch==='*'&&old)return null;if(o.onlyIf?.etagMatches&&o.onlyIf.etagMatches!==old?.etag)return null;return set(k,v,o.customMetadata);},async delete(k){objects.delete(k);}};
 const env={MUSIC_BUCKET:bucket,FIREBASE_API_KEY:'public',MUSIC_GROQ_ENABLED:'true',GROQ_API_KEY:'fake'};
 const ids=Array.from({length:count},(_,i)=>(i+1).toString(16).padStart(64,'0')+'.m4a');for(const id of ids){set('audio/'+id,new Uint8Array([1,2,3]),{published:'true'});set('lyrics/'+id+'.json',JSON.stringify({cues:[{start:0,end:4,text:'你好'}]}));}
 const fetchFn=async(url,init)=>{if(url.includes('accounts:lookup'))return Response.json({users:[{localId:JSON.parse(init.body).idToken==='owner'?OWNER_UID:'listener'}]});calls++;active++;maximum=Math.max(maximum,active);if(hold)await hold;active--;return Response.json(status===200?{words:[{word:'你',start:.5,end:1},{word:'好',start:2,end:3}]}:{error:'limited'},{status,headers:{'Retry-After':'120'}});};
 const req=(id,method='POST',token='owner',suffix='',signal)=>new Request('https://music.example/api/admin/tracks/'+id+'/alignment-job'+suffix,{method,headers:{Authorization:'Bearer '+token},...(method==='POST'?{body:JSON.stringify(suffix?{}:{duration:4})}:{}),signal});
 return {ids,env,objects,fetchFn,req,set,stats:()=>({calls,active,maximum}),status:s=>status=s,hold:p=>hold=p,json:(v,s=200)=>Response.json(v,{status:s}),read:k=>JSON.parse(new TextDecoder().decode(objects.get(k).bytes))};
}
test('10 durable jobs complete sequentially with no browser left open and no publication',async()=>{
 const f=fixture(10),original=f.ids.map(id=>f.objects.get('lyrics/'+id+'.json').bytes.slice()),now=Date.now();
 const controller=new AbortController();const r=await groqQueueRoute(f.req(f.ids[0],'POST','owner','',controller.signal),f.env,f.json,f.fetchFn);assert.equal(r.status,202);controller.abort();
 for(const id of f.ids.slice(1))assert.equal((await enqueueGroqJob(id,4,f.env,now)).queued,true);
 for(let i=0;i<10;i++)assert.equal((await runGroqQueue(f.env,{fetchFn:f.fetchFn,now:now+i*60000})).state,'done');
 assert.deepEqual(f.stats(),{calls:10,active:0,maximum:1});assert.equal((await runGroqQueue(f.env)).state,'idle');
 for(const [i,id]of f.ids.entries()){assert.equal(f.read('groq-jobs/'+id+'.json').state,'done');assert.deepEqual(f.objects.get('lyrics/'+id+'.json').bytes,original[i]);}
 const result=await (await groqQueueRoute(f.req(f.ids[0],'GET'),f.env,f.json,f.fetchFn)).json();assert.equal(result.result.status,'draft');
});
test('overlapping Cron invocations never start a second Groq request',async()=>{
 const f=fixture(2);for(const id of f.ids)await enqueueGroqJob(id,4,f.env);let release;f.hold(new Promise(r=>release=r));
 const first=runGroqQueue(f.env,{fetchFn:f.fetchFn});while(!f.stats().active)await new Promise(r=>setImmediate(r));
 const second=await runGroqQueue(f.env,{fetchFn:f.fetchFn});assert.equal(second.state,'busy');assert.equal(f.stats().maximum,1);release();await first;
});
test('429 pauses the whole queue and honors Retry-After before another song',async()=>{
 const f=fixture(2);for(const id of f.ids)await enqueueGroqJob(id,4,f.env);f.status(429);assert.equal((await runGroqQueue(f.env,{fetchFn:f.fetchFn})).state,'waiting');
 const until=f.read('groq-queue/cooldown.json').until;assert.ok(until>Date.now()+110000);assert.equal((await runGroqQueue(f.env,{fetchFn:f.fetchFn})).state,'cooldown');assert.equal(f.stats().calls,1);
 f.status(200);assert.equal((await runGroqQueue(f.env,{fetchFn:f.fetchFn,now:until+1})).state,'done');assert.equal(f.stats().calls,2);
});
test('only owner can enqueue/cancel; duplicate submissions do not create more jobs',async()=>{
 const f=fixture(),id=f.ids[0];assert.equal((await groqQueueRoute(f.req(id,'POST','listener'),f.env,f.json,f.fetchFn)).status,403);
 const a=await enqueueGroqJob(id,4,f.env),b=await enqueueGroqJob(id,4,f.env);assert.equal(a.job.jobId,b.job.jobId);assert.equal(b.duplicate,true);
 const cancel=await groqQueueRoute(f.req(id,'POST','owner','/cancel'),f.env,f.json,f.fetchFn);assert.equal(cancel.status,200);assert.equal((await runGroqQueue(f.env)).state,'idle');assert.equal(f.read('groq-jobs/'+id+'.json').state,'cancelled');assert.equal(f.stats().calls,0);
});
test('a replacement script supersedes old pending work, while reviewed publication never loops',async()=>{
 const f=fixture(),id=f.ids[0];const first=await enqueueGroqJob(id,4,f.env);f.set('lyrics/'+id+'.json',JSON.stringify({cues:[{start:0,end:4,text:'你好'}]}));const next=await enqueueGroqJob(id,4,f.env);assert.notEqual(first.job.jobId,next.job.jobId);assert.equal((await runGroqQueue(f.env,{fetchFn:f.fetchFn})).state,'done');
});
test('saving a plain script auto-enqueues; reviewed publication stops pending work',async()=>{
 const {handleCloudMusic}=await import('./music/cloud-worker.mjs');const f=fixture(),id=f.ids[0];
 const post=body=>new Request('https://music.example/api/admin/tracks/'+id+'/lyrics',{method:'POST',headers:{Authorization:'Bearer owner'},body:JSON.stringify(body)});
 const data={cues:[{start:0,end:4,text:'你好'}]};const saved=await (await handleCloudMusic(post(data),f.env,{}, {fetchFn:f.fetchFn})).json();assert.equal(saved.alignmentQueued,true);assert.ok(f.objects.has('groq-pending/'+id+'.json'));
 const reviewed=await (await handleCloudMusic(post({...data,status:'reviewed',reviewed:true}),f.env,{}, {fetchFn:f.fetchFn})).json();assert.equal(reviewed.alignmentQueued,false);assert.equal(f.objects.has('groq-pending/'+id+'.json'),false);assert.equal(f.stats().calls,0);
});
