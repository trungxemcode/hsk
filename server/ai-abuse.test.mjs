import test from 'node:test';
import assert from 'node:assert/strict';
import {HSkaIControl,controlCall,abuseFingerprint} from './ai-control.mjs';
import {createHandler} from './translator-worker-bundled.mjs';
function setup(extra={}){
 const map=new Map();let queue=Promise.resolve();
 const storage={get:async k=>structuredClone(map.get(k)),put:async(k,v)=>{if(typeof k==='object')for(const [a,b]of Object.entries(k))map.set(a,structuredClone(b));else map.set(k,structuredClone(v));},delete:async k=>map.delete(k),transaction(fn){const p=queue.then(()=>fn(storage));queue=p.catch(()=>{});return p;}};
 const config={AI_ABUSE_ENABLED:'true',AI_REQUIRE_VERIFIED_EMAIL:'true',AI_GLOBAL_DAILY_LIMIT:'10000',AI_GLOBAL_MINUTE_LIMIT:'1000',ADMIN_UIDS:'owner',...extra};
 const instance=new HSkaIControl({storage},config);
 const env={...config,AI_CONTROL_REQUIRED:'true',AI_CONTROL:{idFromName:n=>n,get:()=>({fetch:(u,i)=>instance.fetch(new Request(u,i))})},FIREBASE_API_KEY:'fake',GEMINI_API_KEY:'fake'};
 return {env,map};
}
const fingerprint='a'.repeat(64),start=(env,uid='alice',changes={})=>controlCall(env,'abuse-start',{uid,lease:crypto.randomUUID(),kind:'query',fingerprint,...changes});
const finish=(env,uid,lease,status=200)=>controlCall(env,'abuse-finish',{uid,lease,status});
const request=(uid='alice',query='xin chào',signal)=>new Request('https://worker.test/dictionary-lookup',{method:'POST',signal,headers:{Origin:'https://trungxemcode.github.io',Authorization:'Bearer h.'+Buffer.from(JSON.stringify({aud:'hsk-flashcards-44631',iss:'https://securetoken.google.com/hsk-flashcards-44631',sub:uid,admin:true,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')+'.s'},body:JSON.stringify({query})});
const answer=()=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({answer:'Xin chào',terms:[]})}]}}]});
test('atomic gate admits one of concurrent requests across shared Workers; duplicate rejected without provider spend',async()=>{
 const {env}=setup();
 const results=await Promise.all(Array.from({length:12},()=>start(env)));
 assert.equal(results.filter(r=>r.allowed).length,1);assert.ok(results.filter(r=>!r.allowed).every(r=>r.reason==='duplicate'));
 assert.equal((await start(env,'alice',{fingerprint:'b'.repeat(64)})).reason,'concurrent');
 assert.equal((await start(env,'bob')).allowed,true);
});
test('central rate windows survive release and an expired lease can be recovered safely',async()=>{
 const original=Date.now;let time=Date.now();Date.now=()=>time;
 try{
  const {env}=setup(),a=await start(env);await finish(env,'alice',a.lease);
  assert.equal((await start(env)).reason,'rate');time+=3000;
  const b=await start(env,'alice',{kind:'reading'});assert.equal(b.allowed,true);await finish(env,'alice',b.lease);
  time+=3000;assert.equal((await start(env,'alice',{kind:'reading'})).reason,'rate');
  const c=await start(env);assert.equal(c.allowed,true);time+=150001;
  const d=await start(env);assert.equal(d.allowed,true);await finish(env,'alice',c.lease);
  assert.equal((await start(env)).reason,'duplicate','old lease must not release a new request');
 }finally{Date.now=original;}
});
test('admin has no new restrictions or shared-counter writes even while ordinary AI is paused',async()=>{
 const {env,map}=setup({AI_PAUSED:'true'});assert.equal((await start(env)).reason,'paused');
 const before=JSON.stringify([...map]);
 const results=await Promise.all(Array.from({length:50},()=>start(env,'owner')));
 assert.ok(results.every(r=>r.allowed&&r.unlimited));assert.equal(JSON.stringify([...map]),before);
 for(let i=0;i<50;i++)assert.equal((await controlCall(env,'reserve',{uid:'owner',route:'reading',newAccount:true})).unlimited,true);
 assert.equal(JSON.stringify([...map]),before);
});
test('repeated provider failures trip temporarily; admin failures cannot trip or extend it',async()=>{
 const original=Date.now;let time=Date.now();Date.now=()=>time;
 try{
  const {env}=setup();for(let i=0;i<8;i++){const uid='user'+i,a=await start(env,uid);await finish(env,uid,a.lease,503);}
  assert.equal((await start(env,'other')).reason,'circuit-open');
  assert.equal((await start(env,'reader',{kind:'reading'})).allowed,true,'query outage does not disable reading');
  for(let i=0;i<20;i++)await finish(env,'owner',crypto.randomUUID(),503);
  time+=60001;assert.equal((await start(env,'other')).allowed,true);
 }finally{Date.now=original;}
});
test('new-account budgets are independent, existing accounts retain 35+15 and admin bypasses both',async()=>{
 const {env}=setup();for(let i=0;i<10;i++)assert.equal((await controlCall(env,'reserve',{uid:'new',route:'ask',newAccount:true})).allowed,true);
 assert.equal((await controlCall(env,'reserve',{uid:'new',route:'ask',newAccount:true})).reason,'new-user-query-daily');
 for(let i=0;i<3;i++)assert.equal((await controlCall(env,'reserve',{uid:'new',route:'reading',newAccount:true})).allowed,true);
 assert.equal((await controlCall(env,'reserve',{uid:'new',route:'reading',newAccount:true})).reason,'new-user-daily');
 assert.equal((await controlCall(env,'reserve',{uid:'new',route:'reading',newAccount:false})).allowed,true,'existing account caps do not inherit starter caps');
});
test('fingerprints canonicalize JSON without storing prompts, images, tokens or raw UID',async()=>{
 assert.equal(await abuseFingerprint('/ask',{b:2,a:'private'}),await abuseFingerprint('/ask',{a:'private',b:2}));
 assert.notEqual(await abuseFingerprint('/ask',{}),await abuseFingerprint('/translate',{}));
 const {env,map}=setup();await start(env);const stored=JSON.stringify([...map]);assert.ok(!stored.includes('alice'));assert.ok(!stored.includes('private'));
});
test('Worker requires real email verification and ignores forged admin claims; real admin bypasses pause and verification',async()=>{
 const {env}=setup({AI_PAUSED:'true'});let verifiedUid='alice',emailVerified=false,calls=0;
 const handler=createHandler(async u=>u.includes('identitytoolkit')?Response.json({users:[{localId:verifiedUid,emailVerified,createdAt:String(Date.now())}]}):(calls++,answer()));
 assert.equal((await handler(request(),env)).status,403);assert.equal(calls,0);
 emailVerified=true;assert.equal((await handler(request(),env)).status,503);assert.equal(calls,0);
 assert.equal((await handler(request('owner'),env)).status,401,'forged sub must match Firebase');
 verifiedUid='owner';emailVerified=false;
 const results=await Promise.all(Array.from({length:12},()=>handler(request('owner'),env)));
 assert.ok(results.every(r=>r.status===200));assert.equal(calls,12,'admin can run concurrent requests even while regular service is paused');
});
test('in-flight duplicate never calls provider twice; all query responses release the central lease',async()=>{
 const {env}=setup();let release,calls=0;
 const raw=async u=>u.includes('identitytoolkit')?Response.json({users:[{localId:'alice',emailVerified:true}]}):(calls++,await new Promise(r=>release=()=>r(answer())));
 const one=createHandler(raw),two=createHandler(raw);const pending=one(request(),env);
 while(!release)await new Promise(r=>setImmediate(r));
 const repeated=await two(request(),env);assert.equal(repeated.status,429);assert.equal((await repeated.json()).reason,'duplicate');assert.equal(calls,1);
 release();assert.equal((await pending).status,200);
 const next=await two(request('alice','khác'),env);assert.equal(next.status,429);assert.equal((await next.json()).reason,'rate','must release instead of leaving an active lease');
});
test('cancellation and provider failure release the active lease; guard fails closed without coordinator',async()=>{
 const {env,map}=setup();const controller=new AbortController();let started;
 const handler=createHandler(async(u,init)=>{
  if(u.includes('identitytoolkit'))return Response.json({users:[{localId:'alice',emailVerified:true}]});
  started=true;return new Promise((_,reject)=>{if(init.signal.aborted)reject(new DOMException('Canceled','AbortError'));else init.signal.addEventListener('abort',()=>reject(new DOMException('Canceled','AbortError')),{once:true});});
 });
 const pending=handler(request('alice','xin chào',controller.signal),env);while(!started)await new Promise(r=>setImmediate(r));controller.abort();assert.equal((await pending).status,504);
 assert.equal((await start(env)).reason,'rate');assert.equal(map.has('abuse:trip:query'),false,'client cancel must not open the provider circuit');
 const noBinding={...env,AI_CONTROL:undefined};const safe=createHandler(async()=>Response.json({users:[{localId:'alice',emailVerified:true}]}));
 assert.equal((await safe(request(),noBinding)).status,503);
});
test('admin reading is not limited by another generation lock or exhausted ordinary budgets',async()=>{
 const {env}=setup({AI_GLOBAL_DAILY_LIMIT:'1',AI_GLOBAL_MINUTE_LIMIT:'1'}),real=env.AI_CONTROL;
 env.AI_CONTROL={idFromName:real.idFromName,get:id=>({fetch:async(u,i)=>JSON.parse(i.body).action==='lock'?Response.json({acquired:false},{status:409}):real.get(id).fetch(u,i)})};
 const line={hanzi:'今天我们一起学习汉语。',pinyin:'Jīntiān wǒmen yìqǐ xuéxí Hànyǔ.',vi:'Hôm nay chúng tôi cùng học tiếng Trung.'};
 const story={titleZh:'今天学习',titleVi:'Bài học hôm nay',scriptMode:Array.from({length:4},(_,i)=>({...line,speaker:'小王',stageNote:'教室'})),paragraphMode:[line],quiz:Array.from({length:3},(_,i)=>({question:'第'+i+'题今天做什么？',options:['学习','休息','工作'],answerIndex:0,explanationVi:'Trong bài các bạn học tiếng Trung.'}))};
 const handler=createHandler(async u=>u.includes('identitytoolkit')?Response.json({users:[{localId:'owner',emailVerified:false,createdAt:String(Date.now())}]}):u.includes('mandarinbean')?new Response('今天我们一起学习汉语，然后一起吃饭。'.repeat(5)):Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(story)}]}}]}));
 const reading=()=>{const r=request('owner');return new Request('https://worker.test/reading-next',{method:'POST',headers:r.headers,body:JSON.stringify({hsk:3})});};
 const results=await Promise.all(Array.from({length:4},()=>handler(reading(),env)));assert.ok(results.every(r=>r.status===200));
});
test('server failure releases the lease and records a scoped failure; admin cache writes keep another request lock',async()=>{
 const {env,map}=setup();
 const handler=createHandler(async u=>u.includes('identitytoolkit')?Response.json({users:[{localId:'alice',emailVerified:true}]}):new Response('',{status:503}));
 assert.equal((await handler(request(),env)).status,502);assert.equal((await start(env)).reason,'rate');assert.equal(map.get('abuse:trip:query').failures,1);
 const key='v3_test_admin_locked_reading';assert.equal((await controlCall(env,'lock',{key})).acquired,true);
 await controlCall(env,'put',{key,story:{id:'educational-story'},keepLock:true});
 assert.equal((await controlCall(env,'lock',{key})).acquired,false,'admin did not own the outstanding source lock');
});
