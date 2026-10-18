import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { createVoicePrecacheHandler } from './voice-tts.mjs';
globalThis.crypto ||= webcrypto;
const sub='113615575809199186059';
const digest=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(b=>b.toString(16).padStart(2,'0')).join('');
const identity={iss:'https://accounts.google.com',email_verified:true,sub,exp:Math.floor(Date.now()/1000)+3600,aud:'test-oauth-client-id'};
function build({google=identity,providerStatus=200,data='AQIDBA==',mime='audio/L16;rate=24000'}={}){
 let identityCalls=0,modelCalls=0,payload,requestUrl;
 const googleFetch=async (url,init)=>{identityCalls++;assert.ok(url.startsWith('https://oauth2.googleapis.com/tokeninfo?id_token='));assert.equal(init.redirect,'manual','Google ID verification must never follow a redirect');return google===null?new Response('{}',{status:401}):Response.json(google);};
 const geminiFetch=async (url,init)=>{modelCalls++;requestUrl=url;payload=JSON.parse(init.body);return providerStatus!==200?Response.json({error:'fail'},{status:providerStatus}):Response.json({candidates:[{content:{parts:[{inlineData:{mimeType:mime,data}}]}}]});};
 return {handler:createVoicePrecacheHandler(googleFetch,geminiFetch),stats:()=>({identityCalls,modelCalls,payload,requestUrl})};
}
const env=async()=>({HSK_VOICE_GOOGLE_SUB_SHA256:await digest(sub)});
const req=(body={text:'你好'},token='google-id-token')=>new Request('https://hsk.example/voice-precache',{method:'POST',headers:token?{Authorization:'Bearer '+token}:{},body:JSON.stringify(body)});
test('rejects missing auth and disallows requests without server allowlist',async()=>{
 const b=build();assert.equal((await b.handler(req({},''),await env())).status,401);assert.equal(b.stats().identityCalls,0);
 assert.equal((await b.handler(req(),{})).status,503);assert.equal(b.stats().modelCalls,0);
});
test('rejects Google tokens with wrong sub, unverified email, expired or missing aud',async()=>{
 const pairs=[{...identity,sub:'123456789999999999999'}, {...identity,email_verified:false},{...identity,exp:1},{...identity,aud:''}];
 for(const p of pairs){const b=build({google:p}),r=await b.handler(req(),await env());assert.equal(r.status,401);assert.equal(b.stats().modelCalls,0);}
});
test('rejects invalid text and method before invoking provider',async()=>{
 const b=build();const e=await env();
 for(const text of ['','test only','你'.repeat(221),'<你好>'])assert.equal((await b.handler(req({text}),e)).status,400);
 assert.equal((await b.handler(req({text:'你好',model:'bad'}),e)).status,400);
 assert.equal(b.stats().modelCalls,0);
});
test('successful Kore TTS request uses fixed model and valid audio, no key in response',async()=>{
 const b=build(),r=await b.handler(req(),await env()),v=await r.json();
 assert.equal(r.status,200);assert.equal(v.ok,true);assert.equal(v.audioBase64,'AQIDBA==');assert.equal(v.voice,'Kore');
 assert.match(b.stats().requestUrl,/gemini-2\.5-flash-preview-tts:generateContent/);
 assert.equal(b.stats().payload.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName,'Kore');
 assert.equal(b.stats().modelCalls,1);assert.equal(r.headers.get('Cache-Control'),'no-store');
});
test('respect upstream rate exhaustion and malformed response',async()=>{
 for(const status of [429,503,403]){
  const b=build({providerStatus:status}),r=await b.handler(req(),await env());
  assert.equal(r.status,status===403?502:status);assert.equal((await r.json()).error,'tts_provider_unavailable');
 }
 for(const bad of [{data:'!!!'},{mime:'text/plain'}]){
  const b=build(bad),r=await b.handler(req(),await env());assert.equal(r.status,502);assert.equal(b.stats().modelCalls,1);
 }
});
test('matches configured OAuth client audience when provided',async()=>{
 const b=build(),e={...(await env()),HSK_VOICE_GOOGLE_AUDIENCE:'another-client-id'};
 assert.equal((await b.handler(req(),e)).status,401);
 assert.equal(b.stats().modelCalls,0);
});
