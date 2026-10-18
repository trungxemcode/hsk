import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto,createHash} from 'node:crypto';
import {createGeminiKeyFetch} from './gemini-keys.mjs';
import {HSkaIControl} from './ai-control.mjs';
import {createVoicePrecacheHandler,voiceProviderFailure} from './voice-tts.mjs';
globalThis.crypto ||= webcrypto;
const url='https://generativelanguage.googleapis.com/v1beta/models/test:generateContent';
const sub='113615575809199186059';
const env={GEMINI_API_KEY_1:'fake-key-one',GEMINI_API_KEY_2:'fake-key-two',HSK_VOICE_GOOGLE_SUB_SHA256:createHash('sha256').update(sub).digest('hex')};
const identity=async()=>Response.json({iss:'https://accounts.google.com',email_verified:true,sub,exp:Date.now()/1000+3600,aud:'test'});
const req=body=>new Request('https://test/voice-precache',{method:'POST',headers:{Authorization:'Bearer test'},body:JSON.stringify(body)});
function coordinator(){
 const instances=new Map();return {...env,AI_CONTROL_REQUIRED:'true',AI_CONTROL:{idFromName:name=>name,get(name){if(!instances.has(name)){const map=new Map();let queue=Promise.resolve();const storage={get:async key=>structuredClone(map.get(key)),put:async(key,value)=>map.set(key,structuredClone(value)),transaction(fn){const next=queue.then(()=>fn(storage));queue=next.catch(()=>{});return next;}};instances.set(name,new HSkaIControl({storage},env));}return {fetch:(url,init)=>instances.get(name).fetch(new Request(url,init))};}}};
}
test('TTS pool cooldown is independent from normal AI and health reads never call Gemini',async()=>{
 const e=coordinator();let calls=0;const raw=async()=>{calls++;return Response.json({error:{details:[{violations:[{quotaId:'requestsPerDay'}]}]}},{status:429});};
 const tts=createGeminiKeyFetch(raw,e,{slot:1,namespace:'hsk-tts-pool-v1'});assert.deepEqual(await tts.availability(),[{slot:1,retryAfter:0},{slot:2,retryAfter:0}]);assert.equal(calls,0);
 const first=await tts(url);assert.equal(first.status,429);assert.equal(Number(first.headers.get('Retry-After')),86400);assert.equal(calls,1);
 const health=await tts.availability();assert.ok(health[0].retryAfter>86300);assert.equal(health[1].retryAfter,0);assert.equal(calls,1);
 const blocked=await tts(url);assert.equal(blocked.headers.get('X-HSK-Provider-Attempted'),'0');assert.equal(calls,1);
 const normal=createGeminiKeyFetch(async()=>{calls++;return Response.json({ok:true});},e,{slot:1});assert.equal((await normal(url)).status,200);assert.equal(calls,2);
});
test('safe provider categories distinguish quota zero, daily quota, credentials, region and service faults',async()=>{
 const samples=[
  [429,{details:[{violations:[{quotaValue:'0'}]}]},'tts_quota_unavailable',false,86400],
  [429,{details:[{violations:[{quotaId:'requestsPerDay'}]}]},'tts_daily_limit',true,86400],
  [429,{},'tts_rate_limited',true,60],
  [403,{message:'secret private vendor message'},'tts_permission_denied',false,86400],
  [400,{message:'User location is not supported'},'tts_region_unavailable',false,86400],
  [400,{details:[{reason:'API_KEY_INVALID'}]},'tts_key_invalid',false,86400],
  [404,{},'tts_model_unavailable',false,86400],
  [503,{},'tts_provider_unavailable',true,60]
 ];
 for(const [status,error,reason,retryable,delay]of samples){const data=await voiceProviderFailure(Response.json({error},{status}));assert.equal(data.error,reason);assert.equal(data.retryable,retryable);assert.ok(data.retryAfter>=delay);assert.equal(JSON.stringify(data).includes('secret'),false);}
});
test('bulk empty audio consumes one generation attempt with no hidden immediate retry',async()=>{
 let calls=0;const raw=async()=>{calls++;return Response.json({candidates:[{finishReason:'OTHER',content:{parts:[]}}]});};
 const h=createVoicePrecacheHandler(identity,raw,()=>Date.now(),()=>raw),res=await h(req({text:'你好',keySlot:1}),env),data=await res.json();assert.equal(calls,1);assert.equal(data.providerAttempts,1);assert.equal(data.error,'tts_generation_incomplete');assert.equal(data.retryable,true);
});
test('authenticated health endpoint exposes slot status only and never requests generation',async()=>{
 let calls=0;const raw=async()=>{calls++;return Response.json({});};raw.availability=async()=>[{slot:1,retryAfter:86400}];const h=createVoicePrecacheHandler(identity,raw,()=>Date.now(),()=>raw),res=await h(req({action:'status'}),env);assert.equal(res.status,200);assert.deepEqual((await res.json()).slots,[{slot:1,retryAfter:86400}]);assert.equal(calls,0);
});

test('isolated pilot is explicit, bounded by existing text limits and uses one provider call',async()=>{
 let calls=0,prompt='',target='';const raw=async(url,init)=>{calls++;target=url;prompt=JSON.parse(init.body).contents[0].parts[0].text;return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{inlineData:{mimeType:'audio/L16',data:'AQIDBA=='}}]}}]});};
 const h=createVoicePrecacheHandler(identity,raw,()=>Date.now(),()=>raw);assert.equal((await h(req({text:'你好。谢谢。',keySlot:1,isolated:true}),{...env,HSK_VOICE_ISOLATED_MODEL:'gemini-3.1-flash-tts-preview'})).status,200);assert.equal(calls,1);assert.match(prompt,/one full second/);assert.match(target,/gemini-3.1-flash-tts-preview:generateContent/);assert.equal((await h(req({text:'你好',isolated:true}),env)).status,400);assert.equal((await h(req({text:'你好',keySlot:1,isolated:'yes'}),env)).status,400);assert.equal(calls,1);
});
