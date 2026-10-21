import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {qaDescriptor,qaBegin,qaFinish,qaRelease,qaHash,qaNormalize,qaShadowObserve,qaUsage,qaValidResponse} from './tutor-cache.mjs';
import {qaCacheControl,qaCacheAlarm} from './tutor-cache-store.mjs';
import {HSkaIControl} from './ai-control.mjs';
import {createHandler} from './translator-worker-bundled.mjs';
const require=createRequire(import.meta.url),{contexts,payload}=require('../tools/build-tutor-curriculum.cjs');
const lesson=contexts['standard-1-01'];
function mock({enabled=true,...options}={}){
 const map=new Map();let alarm=null,queue=Promise.resolve();
 const storage={async get(k){return structuredClone(map.get(k))},async put(k,v){map.set(k,structuredClone(v))},async delete(k){map.delete(k)},async list({prefix='',end,limit=1000}={}){return new Map([...map].filter(([k])=>k.startsWith(prefix)&&(!end||k<end)).sort(([a],[b])=>a.localeCompare(b)).slice(0,limit))},transaction(fn){const result=queue.then(()=>fn(this));queue=result.catch(()=>{});return result},async getAlarm(){return alarm},async setAlarm(t){alarm=t}};
 const env={QA_CACHE_ENABLED:enabled?'true':'false',GEMINI_API_KEY:'fake-provider-key',FIREBASE_API_KEY:'fake-firebase-key',ADMIN_UIDS:'admin',QA_SHADOW_MODE:'off',...options};
 const instance=new HSkaIControl({storage},env);env.AI_CONTROL={idFromName:n=>n,get:()=>({fetch:(url,init)=>instance.fetch(new Request(url,init))})};
 return {env,map,storage,instance,get alarm(){return alarm}};
}
const qBody=(q='Phân biệt 买 và 卖')=>({hsk:1,lesson:structuredClone(lesson),question:q,history:[]});
const tBody=()=>({hsk:2,translation:{vietnamese:'Tôi mua sách',chinese:'我买书',pinyin:'wǒ mǎi shū',explanation:'Câu trần thuật'},question:'买 nghĩa là gì',history:[]});
const call=(f,action,data,time=100000)=>qaCacheControl(f.storage,f.env,{action,...data},time).then(r=>r.json());
const sha='a'.repeat(64),scope='b'.repeat(64),lease='00000000-0000-4000-8000-000000000001',nextLease='00000000-0000-4000-8000-000000000002';

test('all146 published lessons are fingerprinted, exact legitimate FAQ can share across accounts',async()=>{
 assert.equal(Object.keys(payload.lessons).length,146);const {env}=mock();const a=await qaDescriptor('/lesson-ask',qBody(),'alice',env),b=await qaDescriptor('/lesson-ask',qBody(),'bob',env);assert.equal(a.shared,true);assert.equal(a.key,b.key);assert.ok(!JSON.stringify(a).includes('alice'));
});
test('altered source, different question, grade, prompt epoch, provider or corpus cannot reuse the same key',async()=>{
 const {env}=mock(),original=await qaDescriptor('/lesson-ask',qBody(),'alice',env);
 for(const [body,settings] of [[qBody('Phân biệt 买 và 买了'),env],[{...qBody(),hsk:2},env],[{...qBody(),lesson:{...lesson,title:'Private version'}},env],[qBody(),{...env,QA_CACHE_EPOCH:'2'}],[qBody(),{...env,SECONDARY_AI_MODEL:'another-model'}]])assert.notEqual((await qaDescriptor('/lesson-ask',body,'alice',settings))?.key,original.key);
});
test('sentence contexts and untrusted lesson payloads are isolated by verified account',async()=>{
 const {env}=mock();for(const [route,body] of [['/ask',tBody()],['/lesson-ask',{...qBody(),lesson:{...lesson,title:'Custom',content:{text:'Bài thử'}}}]]){const a=await qaDescriptor(route,body,'alice',env),b=await qaDescriptor(route,body,'bob',env);assert.equal(a.shared,false);assert.notEqual(a.key,b.key);}
});
test('dictionary requests cache query plus context, reading and gloss; batch IDs remain part of key',async()=>{
 const {env}=mock(),body={query:'买'};const a=await qaDescriptor('/dictionary-lookup',body,'alice',env),b=await qaDescriptor('/dictionary-lookup',body,'bob',env);assert.equal(a.shared,true);assert.equal(a.key,b.key);
 for(const change of [{context:'truyện'},{word:{han:'买',trad:'買',pin:'mǎi',mean:'buy'}}]){const x=await qaDescriptor('/dictionary-lookup',{...body,...change},'alice',env);assert.equal(x.shared,false);assert.notEqual(x.key,a.key);}
 const entries=[{id:'one',han:'买',pinyin:'mǎi',gloss:'buy'}];assert.notEqual((await qaDescriptor('/dictionary-translate',{entries},'alice',env)).key,(await qaDescriptor('/dictionary-translate',{entries:[{...entries[0],id:'two'}]},'alice',env)).key);
});
test('history, followup-only question, placement reports, PII and other routes bypass caches',async()=>{
 const {env}=mock();for(const [route,body] of [['/lesson-ask',{...qBody(),history:[{role:'user',text:'previous'}]}],['/lesson-ask',qBody('giải thích lại')],['/lesson-ask',{...qBody(),lesson:{...lesson,id:'placement-feedback'}}],['/ask',{...tBody(),question:'Email me@example.com'}],['/ask',{...tBody(),question:'Gọi số 0901234567'}],['/translate',{text:'hi'}]])assert.equal(await qaDescriptor(route,body,'alice',env),null);
 assert.equal(await qaDescriptor('/lesson-ask',qBody(),'alice',{...env,QA_CACHE_ENABLED:'false'}),null);
});
test('normalization retains Hanzi, tone distinctions, negation and grammatical position',()=>{
 assert.notEqual(qaNormalize('了 ở cuối câu'),qaNormalize('了 sau động từ'));assert.notEqual(qaNormalize('买 mǎi'),qaNormalize('卖 mài'));assert.notEqual(qaNormalize('không dùng 了'),qaNormalize('dùng 了'));assert.equal(qaNormalize('  PHÂN BIỆT 买  và 卖 '),'phân biệt 买 và 卖');
});
test('concurrent cache miss has only one lease, and shared hit avoids all generation work',async()=>{
 const f=mock(),[a,b]=await Promise.all([qaBegin('/lesson-ask',qBody(),'alice',f.env),qaBegin('/lesson-ask',qBody(),'bob',f.env)]);assert.deepEqual([a.state,b.state].sort(),['busy','miss']);const owner=[a,b].find(x=>x.state==='miss');await qaFinish(f.env,owner,{answer:'买 là mua; 卖 là bán.'},'gemini');const c=await qaBegin('/lesson-ask',qBody(),'bob',f.env);assert.equal(c.state,'hit');assert.equal(c.value.answer,'买 là mua; 卖 là bán.');assert.equal(c.provider,'gemini');
});
test('expired producer cannot save over or unlock a successor',async()=>{
 const f=mock();await call(f,'qa-begin',{key:sha,scope,lease});await call(f,'qa-begin',{key:sha,scope,lease:nextLease},161000);
 const put=await call(f,'qa-put',{key:sha,scope,lease,route:'/ask',value:{answer:'stale'},provider:'gemini',ttl:60},162000);assert.equal(put.ok,false);await call(f,'qa-unlock',{key:sha,lease},162000);assert.equal(f.map.get('qa:v1:lock:'+sha).lease,nextLease);
});
test('TTL expiration misses, physical cleanup deletes old answers without deleting a renewed answer',async()=>{
 const f=mock();await call(f,'qa-begin',{key:sha,scope,lease});await call(f,'qa-put',{key:sha,scope,lease,route:'/ask',value:{answer:'old'},ttl:60},100001);
 assert.equal((await call(f,'qa-begin',{key:sha,scope,lease:nextLease},120000)).hit,true);assert.equal((await call(f,'qa-begin',{key:sha,scope,lease:nextLease},160002)).acquired,true);
 await call(f,'qa-put',{key:sha,scope,lease:nextLease,route:'/ask',value:{answer:'new'},ttl:60},160003);await qaCacheAlarm(f.storage,160010);assert.equal(f.map.get('qa:v1:record:'+sha).value.answer,'new');await qaCacheAlarm(f.storage,230000);assert.equal(f.map.has('qa:v1:record:'+sha),false);assert.equal(f.map.get('qa:v1:records'),0);
});
test('malformed, empty, sensitive and unsuccessful results never enter the reusable cache',async()=>{
 const f=mock(),s=await qaBegin('/ask',tBody(),'alice',f.env);for(const value of [{answer:''},{error:'provider_error'},{answer:'contact me@example.com'}])await qaFinish(f.env,s,value,'gemini');assert.equal([...f.map.keys()].some(k=>k.startsWith('qa:v1:record:')),false);await qaRelease(f.env,s);assert.equal(f.map.has('qa:v1:lock:'+s.descriptor.key),false);
});
test('cache outage degrades to original provider flow and no prompts/UID/token are persisted',async()=>{
 const f=mock();f.env.AI_CONTROL.get=()=>({fetch:()=>{throw Error('offline')}});assert.equal((await qaBegin('/ask',tBody(),'private-user',f.env)).state,'degraded');
 const good=mock(),s=await qaBegin('/ask',tBody(),'private-user',good.env);await qaFinish(good.env,s,{answer:'Giải thích từ vựng.'},'gemini');const raw=JSON.stringify([...good.map]);assert.ok(!raw.includes('private-user'));assert.ok(!raw.includes('Tôi mua sách'));assert.ok(!raw.includes('fake-provider-key'));
});
test('observer records cosine scores but never provides a cached answer, and filters scope/model',async()=>{
 const f=mock(),v=Array(768).fill(0);v[0]=1;
 await call(f,'qa-shadow',{key:sha,scope,vector:v,model:'gemini-embedding-2/768'});
 const r=await call(f,'qa-shadow',{key:'c'.repeat(64),scope,vector:v,model:'gemini-embedding-2/768'});assert.equal(r.bestSimilarity,1);assert.equal(r.servedSemantic,false);assert.equal('answer' in r,false);
 const different=await call(f,'qa-shadow',{key:'d'.repeat(64),scope:'e'.repeat(64),vector:v,model:'gemini-embedding-2/768'});assert.equal(different.candidates,0);assert.equal((await call(f,'qa-shadow',{key:sha,scope,vector:v,model:'old-model'})).error,'qa_vector');
});
test('semantic pilot caps at20 calls/day, respects outage backoff and never uses TTS credentials',async()=>{
 const f=mock();for(let i=0;i<20;i++)assert.equal((await call(f,'qa-shadow-reserve')).allowed,true);assert.equal((await call(f,'qa-shadow-reserve')).allowed,false);
 const g=mock();await call(g,'qa-shadow-error');assert.equal((await call(g,'qa-shadow-reserve')).allowed,false);
 const d=await qaDescriptor('/dictionary-lookup',{query:'买'},'alice',g.env);let calls=0;const h=mock({GEMINI_API_KEY:'',GEMINI_TTS_KEY_1:'must-not-use'});await qaShadowObserve(h.env,d,()=>{calls++;});assert.equal(calls,0);
});
test('cancelled request cannot populate a cache; admin remains exempt from cache contention',async()=>{
 const f=mock(),s=await qaBegin('/ask',tBody(),'alice',f.env),abort=new AbortController();abort.abort();await qaFinish(f.env,s,{answer:'answer'},'gemini',{signal:abort.signal});assert.equal([...f.map.keys()].some(k=>k.startsWith('qa:v1:record:')),false);
 const a=await qaBegin('/dictionary-lookup',{query:'买'},'alice',f.env),admin=await qaBegin('/dictionary-lookup',{query:'买'},'admin',f.env,true);assert.equal(a.state,'miss');assert.equal(admin.state,'bypass');
});

const origin='https://trungxemcode.github.io',project='hsk-flashcards-44631';
function request(route,body,uid='admin',extra={}){const token={aud:project,iss:'https://securetoken.google.com/'+project,sub:uid,exp:Math.floor(Date.now()/1000)+3600};return new Request('https://worker.test'+route,{method:'POST',headers:{Origin:origin,Authorization:'Bearer h.'+Buffer.from(JSON.stringify(token)).toString('base64url')+'.s'},body:JSON.stringify(body),...extra});}
function integration(){const f=mock();let modelCalls=0,authCalls=0,providerError=false,block;const fetchFn=async(url,init)=>{if(url.includes('identitytoolkit')){authCalls++;const token=JSON.parse(Buffer.from(JSON.parse(init.body).idToken.split('.')[1],'base64url'));return Response.json({users:[{localId:token.sub,emailVerified:true,createdAt:'0'}]});}modelCalls++;if(block)await block;if(providerError)return Response.json({error:'bad'},{status:502});const p=JSON.parse(init.body),isBatch=!!p.generationConfig?.responseSchema?.properties?.translations;return Response.json({usageMetadata:{promptTokenCount:100,cachedContentTokenCount:25,candidatesTokenCount:30},candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(isBatch?{translations:[{id:'buy',meaning:'mua'}]}:{answer:'买 (mǎi): mua; 卖 (mài): bán.',terms:[{han:'买',pinyin:'mǎi',meaning:'mua'}]})}]}}]});};return {...f,handler:createHandler(fetchFn),get modelCalls(){return modelCalls},get authCalls(){return authCalls},set providerError(v){providerError=v},set block(v){block=v}};}
test('authenticated dictionary miss then exact hit uses one provider call while verifying auth twice',async()=>{
 const f=integration();let r=await f.handler(request('/dictionary-lookup',{query:'买'}),f.env);assert.equal(r.status,200);assert.equal(r.headers.get('X-HSK-AI-Cache'),'miss');r=await f.handler(request('/dictionary-lookup',{query:'买'}),f.env);assert.equal(r.status,200);assert.equal(r.headers.get('X-HSK-AI-Cache'),'hit');assert.equal(f.modelCalls,1);assert.equal(f.authCalls,2);
});
test('lesson and sentence API schemas are preserved; repeated lookup and batch translation cache correctly',async()=>{
 for(const [route,body] of [['/lesson-ask',qBody()],['/ask',tBody()],['/dictionary-translate',{entries:[{id:'buy',han:'买',pinyin:'mǎi',gloss:'buy'}]}]]){const f=integration(),r=await f.handler(request(route,body),f.env),value=await r.json();assert.equal(r.status,200);const hit=await f.handler(request(route,body),f.env);assert.equal(hit.headers.get('X-HSK-AI-Cache'),'hit');assert.deepEqual(await hit.json(),value);assert.equal(f.modelCalls,1);}
});
test('cross-account shared FAQ avoids a second provider request, private sentence never crosses account',async()=>{
 const f=integration();f.env.ADMIN_UIDS='alice,bob';for(const uid of ['alice','bob'])assert.equal((await f.handler(request('/lesson-ask',qBody(),uid),f.env)).status,200);assert.equal(f.modelCalls,1);for(const uid of ['alice','bob'])assert.equal((await f.handler(request('/ask',tBody(),uid),f.env)).status,200);assert.equal(f.modelCalls,3);
});
test('provider failure leaves no cached answer or orphan lease; next attempt can succeed',async()=>{
 const f=integration();f.providerError=true;assert.equal((await f.handler(request('/dictionary-lookup',{query:'买'}),f.env)).status,502);f.providerError=false;assert.equal((await f.handler(request('/dictionary-lookup',{query:'买'}),f.env)).status,200);assert.equal(f.modelCalls,2);
});
test('cache hits never bypass expired, forged or revoked authentication',async()=>{
 const f=integration();await f.handler(request('/dictionary-lookup',{query:'买'}),f.env);const r=await f.handler(new Request('https://worker.test/dictionary-lookup',{method:'POST',headers:{Origin:origin},body:'{"query":"买"}'}),f.env);assert.equal(r.status,401);assert.equal(f.modelCalls,1);
});
test('semantic pilot evicts old vectors at64 and never scans another context',async()=>{
 const f=mock(),v=Array(768).fill(0);v[0]=1;for(let i=0;i<66;i++)await call(f,'qa-shadow',{key:String(i).padStart(64,'0'),scope,vector:v,model:'gemini-embedding-2/768'},100000+i);assert.equal(f.map.get('qa:v1:shadow-index').length,64);assert.equal([...f.map.keys()].filter(k=>k.startsWith('qa:v1:vector:')).length,64);
});
test('hard2048 answer bound and schema guards fail safely without replacing a live owner',async()=>{
 const f=mock();f.map.set('qa:v1:records',2048);await call(f,'qa-begin',{key:sha,scope,lease});assert.equal((await call(f,'qa-put',{key:sha,scope,lease,route:'/ask',value:{answer:'x'},ttl:60})).reason,'capacity');assert.equal(f.map.get('qa:v1:lock:'+sha).lease,lease);
 assert.equal((await call(f,'qa-put',{key:sha,scope,lease,route:'/ask',value:{answer:'x'},ttl:604801})).error,'qa_value');
});
test('budget resets by day while genuine embedding outages remain backed off',async()=>{
 const f=mock({QA_SHADOW_DAILY_LIMIT:'1'});assert.equal((await call(f,'qa-shadow-reserve',{},100000)).allowed,true);assert.equal((await call(f,'qa-shadow-reserve',{},100001)).allowed,false);assert.equal((await call(f,'qa-shadow-reserve',{},86400001)).allowed,true);
});
test('real observer request uses768-dimensional text embedding only; failure cannot fail an answer',async()=>{
 const f=mock(),d=await qaDescriptor('/dictionary-lookup',{query:'买'},'alice',f.env);let called=0;await qaShadowObserve(f.env,d,async(url,init)=>{called++;assert.match(url,/gemini-embedding-2:embedContent$/);const body=JSON.parse(init.body);assert.equal(body.outputDimensionality,768);assert.equal(body.content.parts[0].text,'买');return Response.json({embedding:{values:[1,...Array(767).fill(0)]}})});assert.equal(called,1);assert.equal(f.map.get('qa:v1:stats').shadowObserved,1);
});
test('a revoked account cannot read an otherwise valid cached answer',async()=>{
 const f=integration();await f.handler(request('/dictionary-lookup',{query:'买'}),f.env);const revoked=createHandler(async()=>Response.json({users:[{localId:'admin',disabled:true}]}));assert.equal((await revoked(request('/dictionary-lookup',{query:'买'}),f.env)).status,401);
});
test('same-scope ordinary students coalesce requests; admin exemption is retained',async()=>{
 const f=integration();f.env.AI_ABUSE_ENABLED='true';f.env.AI_REQUIRE_VERIFIED_EMAIL='true';let finish;f.block=new Promise(r=>finish=r);
 const first=f.handler(request('/dictionary-lookup',{query:'买'},'alice'),f.env);
 for(let i=0;i<50&&f.modelCalls===0;i++)await new Promise(r=>setTimeout(r,5));assert.equal(f.modelCalls,1);
 const second=await f.handler(request('/dictionary-lookup',{query:'买'},'bob'),f.env);assert.equal(second.status,429);assert.equal((await second.json()).code,'AI_CACHE_IN_FLIGHT');assert.equal(f.modelCalls,1);finish();assert.equal((await first).status,200);
});
