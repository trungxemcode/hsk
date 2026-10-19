import test from 'node:test';
import assert from 'node:assert/strict';
import {configuredGeminiKeys,createGeminiKeyFetch} from './gemini-keys.mjs';
import {HSkaIControl,controlCall} from './ai-control.mjs';
import {createAiRoleFetch} from './ai-backup.mjs';
import {createHandler} from './translator-worker-bundled.mjs';

const url='https://generativelanguage.googleapis.com/v1beta/models/gemini-test:generateContent';
const keys=Array.from({length:10},(_,i)=>'fake-gemini-key-slot-'+(i+1));
const pool=Object.fromEntries(keys.map((k,i)=>['GEMINI_API_KEY_'+(i+1),k]));
const selected=init=>new Headers(init.headers).get('x-goog-api-key');
const ok=()=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:'{"answer":"Xin chào"}'}]}}]});
function central(env=pool){
 const map=new Map();let queue=Promise.resolve();
 const storage={get:async k=>structuredClone(map.get(k)),put:async(k,v)=>{if(typeof k==='object')for(const [key,value]of Object.entries(k))map.set(key,structuredClone(value));else map.set(k,structuredClone(v));},delete:async k=>map.delete(k),transaction(fn){const next=queue.then(()=>fn(storage));queue=next.catch(()=>{});return next;}};
 const instance=new HSkaIControl({storage},env);
 return {map,env:{...env,AI_CONTROL_REQUIRED:'true',AI_CONTROL:{idFromName:n=>n,get:()=>({fetch:(u,i)=>instance.fetch(new Request(u,i))})}}};
}
test('ten server-owned slots support legacy key, deduplicate, and ignore extra slots',()=>{
 assert.deepEqual(configuredGeminiKeys({GEMINI_API_KEY:keys[0]}),[keys[0]]);
 assert.deepEqual(configuredGeminiKeys({...pool,GEMINI_API_KEY:'legacy',GEMINI_API_KEY_11:'extra',GEMINI_API_KEY_12:' '}),[...keys,'extra','legacy']);
 assert.deepEqual(configuredGeminiKeys({GEMINI_API_KEY:keys[0],GEMINI_API_KEY_2:' '+keys[0]+' ',GEMINI_API_KEY_3:'  ',GEMINI_API_KEY_4:23}),[keys[0]]);
});
test('two Worker instances share atomic round robin across ten slots',async()=>{
 const {env,map}=central(),calls=[],raw=async(u,i)=>{calls.push(selected(i));return ok();};
 const workers=[createGeminiKeyFetch(raw,env),createGeminiKeyFetch(raw,env)];
 await Promise.all(Array.from({length:20},(_,i)=>workers[i%2](url,{})));
 assert.deepEqual(calls,[...keys,...keys]);assert.equal(map.size,1);
 const stored=JSON.stringify([...map]);for(const key of keys)assert.equal(stored.includes(key),false,'DO must never store raw keys');
});
test('central cooldown is visible to another Worker and respects Retry-After',async()=>{
 const {env,map}=central({...pool,GEMINI_API_KEY_3:'',GEMINI_API_KEY_4:'',GEMINI_API_KEY_5:'',GEMINI_API_KEY_6:'',GEMINI_API_KEY_7:'',GEMINI_API_KEY_8:'',GEMINI_API_KEY_9:'',GEMINI_API_KEY_10:''});
 const calls=[],raw=async(u,i)=>{const key=selected(i);calls.push(key);return key===keys[0]?Response.json({error:{details:[{retryDelay:'120s'}]}},{status:429}):ok();};
 assert.equal((await createGeminiKeyFetch(raw,env)(url,{})).status,200);
 assert.equal((await createGeminiKeyFetch(raw,env)(url,{})).status,200);
 assert.deepEqual(calls,[keys[0],keys[1],keys[1]]);assert.ok(Object.values(map.get('gemini:pool').blocked)[0]>Date.now()+110000);
});
test('local fallback rotates, skips cooling keys and recovers after the pause',async()=>{
 let time=0;const state={cursor:0,blocked:new Map()},calls=[],env={GEMINI_API_KEY:keys[0],GEMINI_API_KEY_2:keys[1]};
 const f=createGeminiKeyFetch(async(u,i)=>{calls.push(selected(i));return calls.length===1?new Response('',{status:429,headers:{'Retry-After':'90'}}):ok();},env,{now:()=>time,state});
 await f(url);await f(url);assert.deepEqual(calls,[keys[0],keys[1],keys[1]]);time=91000;await f(url);assert.equal(calls.at(-1),keys[0]);
});
test('one request makes at most two Gemini calls, without probing ten accounts',async()=>{
 const calls=[];const f=createGeminiKeyFetch(async(u,i)=>{calls.push(selected(i));return new Response('',{status:503});},pool);
 assert.equal((await f(url)).status,503);assert.deepEqual(calls,keys.slice(0,2));
});
test('all cooling keys return 429 with no additional provider call',async()=>{
 const env={GEMINI_API_KEY:keys[0],GEMINI_API_KEY_2:keys[1]};let calls=0;
 const f=createGeminiKeyFetch(async()=>{calls++;return new Response('',{status:429});},env);
 assert.equal((await f(url)).status,429);const r=await f(url);assert.equal(r.status,429);assert.ok(Number(r.headers.get('Retry-After'))>0);assert.equal(calls,2);
});
test('daily quota exhaustion pauses the key for 24h and honors longer Retry-After',async()=>{
 const state={cursor:0,blocked:new Map()};const f=createGeminiKeyFetch(async()=>Response.json({error:{details:[{violations:[{quotaId:'GenerateRequestsPerDayPerProjectPerModel-FreeTier'}]}]}},{status:429,headers:{'Retry-After':'100000'}}),pool,{state,now:()=>0});
 await f(url);assert.deepEqual([...state.blocked.values()],[100000000,100000000]);
});
test('bad input, location rejection, safety refusals and malformed success do not rotate keys',async()=>{
 for(const response of [Response.json({error:{message:'User location is not supported'}},{status:400}),new Response('',{status:404}),Response.json({promptFeedback:{blockReason:'SAFETY'}}),new Response('not JSON')]){
  let calls=0;const f=createGeminiKeyFetch(async()=>{calls++;return response;},pool);assert.equal(await f(url),response);assert.equal(calls,1);
 }
});
test('invalid credentials can move once to another key',async()=>{
 for(const status of [400,401,403]){let calls=0;const f=createGeminiKeyFetch(async()=>++calls===1?Response.json({error:{details:[{reason:'API_KEY_INVALID'}]}},{status}):ok(),pool);assert.equal((await f(url)).status,200);assert.equal(calls,2);}
});
test('caller cancellation never tries another key or another provider',async()=>{
 const controller=new AbortController();let calls=0;const f=createGeminiKeyFetch(async()=>{calls++;controller.abort();throw new DOMException('Canceled','AbortError');},pool);
 await assert.rejects(()=>f(url,{signal:controller.signal}),{name:'AbortError'});assert.equal(calls,1);
});
test('network failure is left to the existing provider fallback',async()=>{
 let calls=0;const f=createGeminiKeyFetch(async()=>{calls++;throw Error('network');},pool);await assert.rejects(()=>f(url),/network/);assert.equal(calls,1);
});
test('non-Gemini requests and their credentials are untouched',async()=>{
 const init={headers:{Authorization:'Bearer example'},body:'data'};let received;
 const f=createGeminiKeyFetch(async(u,i)=>{received=i;return ok();},pool);await f('https://identitytoolkit.googleapis.com/lookup',init);assert.equal(received,init);
});
test('missing required coordinator fails before sending any prompt',async()=>{
 let calls=0;const f=createGeminiKeyFetch(async()=>{calls++;return ok();},{...pool,AI_CONTROL_REQUIRED:'true'});await assert.rejects(()=>f(url),/binding required/);assert.equal(calls,0);
});
test('existing xKiro role still executes first and Gemini pool is only its fallback',async()=>{
 const calls=[],env={...pool,AI_TASK_ROUTING:'true',AI_BACKUP_ENABLED:'true',SECONDARY_AI_PROVIDER:'xkiro',SECONDARY_AI_API_KEY:'fake-secondary-key-123456789',SECONDARY_AI_MODEL:'test/model'};
 const f=createAiRoleFetch(createGeminiKeyFetch(async(u,i)=>{calls.push(String(u).includes('xkiro')?'xkiro':selected(i));return String(u).includes('xkiro')?new Response('',{status:503}):ok();},env),env,{route:'/translate',body:{hsk:1,text:'Xin chào'}});
 assert.equal((await f(url,{body:JSON.stringify({contents:[],generationConfig:{responseSchema:{type:'OBJECT',required:['answer']}}})})).status,200);assert.deepEqual(calls,['xkiro',keys[0]]);
});
test('new slots work through authenticated Worker, without legacy key',async()=>{
 let ai=0;const handler=createHandler(async(u,i)=>String(u).includes('identitytoolkit')?Response.json({users:[{localId:'alice'}]}):(ai++,ok()));
 const project='hsk-flashcards-44631',token='header.'+Buffer.from(JSON.stringify({aud:project,iss:'https://securetoken.google.com/'+project,sub:'alice',exp:Date.now()/1000+3600})).toString('base64url')+'.signature';
 const request=auth=>new Request('https://worker.test/lesson-ask',{method:'POST',headers:{Origin:'https://trungxemcode.github.io',...(auth?{Authorization:'Bearer '+token}:{})},body:JSON.stringify({hsk:1,question:'你好 nghĩa là gì?',lesson:{id:'one',title:'One',words:[],content:{}},history:[]})});
 const env={...pool,FIREBASE_API_KEY:'fake-firebase-key'};assert.equal((await handler(request(false),env)).status,401);assert.equal(ai,0);assert.equal((await handler(request(true),env)).status,200);assert.equal(ai,1);
});
test('coordinator rejects malformed pools and never resets cooldown after repeated reports',async()=>{
 const {env,map}=central(),ids=keys.map((_,i)=>(i+1).toString(16).padStart(64,'0'));
 assert.equal((await controlCall(env,'gemini-pick',{ids:['raw-secret'],excluded:[]})).status,400);
 assert.equal((await controlCall(env,'gemini-pick',{ids:[...ids,ids[0]],excluded:[]})).status,400);
 await controlCall(env,'gemini-pick',{ids,excluded:[]});await controlCall(env,'gemini-report',{id:ids[0],delay:120000});const until=map.get('gemini:pool').blocked[ids[0]];await controlCall(env,'gemini-report',{id:ids[0],delay:1000});assert.equal(map.get('gemini:pool').blocked[ids[0]],until);
});
test('Worker error messages redact every configured slot, not only the legacy secret',async()=>{
 const handler=createHandler(async(u)=>String(u).includes('identitytoolkit')?Response.json({users:[{localId:'alice'}]}):Response.json({error:{message:'Invalid request '+keys.join(' ')}},{status:400}));
 const project='hsk-flashcards-44631',token='header.'+Buffer.from(JSON.stringify({aud:project,iss:'https://securetoken.google.com/'+project,sub:'alice',exp:Date.now()/1000+3600})).toString('base64url')+'.signature';
 const request=new Request('https://worker.test/translate',{method:'POST',headers:{Origin:'https://trungxemcode.github.io',Authorization:'Bearer '+token},body:JSON.stringify({hsk:1,text:'Xin chào'})});
 const response=await handler(request,{...pool,FIREBASE_API_KEY:'fake-firebase'}),body=await response.text();assert.equal(response.status,502);for(const key of keys)assert.equal(body.includes(key),false);assert.match(body,/redacted/);
});
test('timing exposes original slot numbers after deduplication, never credentials or prompt data',async()=>{
 const events=[],env={GEMINI_API_KEY_2:keys[1],GEMINI_API_KEY_3:keys[1],GEMINI_API_KEY_9:keys[8]};
 const f=createGeminiKeyFetch(async()=>ok(),env,{onAttempt:e=>events.push(e)});
 await f(url);await f(url);assert.deepEqual(events.map(e=>e.slot),[2,9]);
 const single=createGeminiKeyFetch(async()=>ok(),{GEMINI_API_KEY_9:keys[8]},{onAttempt:e=>events.push(e)});await single(url);
 assert.equal(events[2].slot,9);for(const key of keys)assert.equal(JSON.stringify(events).includes(key),false);
 const brokenObserver=createGeminiKeyFetch(async()=>ok(),pool,{onAttempt:()=>{throw Error('telemetry failure')}});assert.equal((await brokenObserver(url)).status,200);
});

test('distinct legacy primary remains reachable as slot zero without displacing slot one',async()=>{
 const env={GEMINI_API_KEY:'legacy-primary',GEMINI_API_KEY_1:'numbered-one',GEMINI_API_KEY_9:'numbered-nine'};
 assert.deepEqual(configuredGeminiKeys(env),['numbered-one','numbered-nine','legacy-primary']);
 const used=[],f=createGeminiKeyFetch(async(u,i)=>{used.push(selected(i));return ok();},env,{slot:0,namespace:'hsk-tts-pool-v1'});
 assert.deepEqual((await f.availability()).map(x=>x.slot),[1,9,0]);
 assert.equal((await f(url,{})).status,200);assert.deepEqual(used,['legacy-primary']);
 assert.deepEqual(configuredGeminiKeys({...env,GEMINI_API_KEY:'numbered-one'}),['numbered-one','numbered-nine']);
});

test("slot 12 blank is skipped and replacement slot 2 uses new credential",async()=>{
 const env={GEMINI_API_KEY_2:"replacement-2",GEMINI_API_KEY_11:"eleven",GEMINI_API_KEY_12:"  "};
 assert.deepEqual(configuredGeminiKeys(env),["replacement-2","eleven"]);
 const called=[];const f=createGeminiKeyFetch(async(u,i)=>{called.push(selected(i));return ok();},env,{slot:2});
 await f(url);assert.deepEqual(called,["replacement-2"]);
});

test("central coordinator supports thirteen distinct slots and availability",async()=>{
 const expanded=Object.fromEntries(Array.from({length:12},(_,i)=>["GEMINI_API_KEY_"+(i+1),"expanded-key-"+(i+1)]));
 const {env}=central({...expanded,GEMINI_API_KEY:"primary-distinct"});
 const f=createGeminiKeyFetch(async()=>ok(),env,{slot:11});
 const slots=await f.availability();assert.equal(slots.length,13);
 assert.equal((await f(url)).status,200);
});
