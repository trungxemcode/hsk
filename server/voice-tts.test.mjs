import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { createVoicePrecacheHandler,decodeVoiceAudio,VOICE_MAX_AUDIO_BYTES } from './voice-tts.mjs';
globalThis.crypto ||= webcrypto;
const sub='113615575809199186059';
const digest=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(b=>b.toString(16).padStart(2,'0')).join('');
const identity={iss:'https://accounts.google.com',email_verified:true,sub,exp:Math.floor(Date.now()/1000)+3600,aud:'test-oauth-client-id'};
function build({google=identity,providerStatus=200,data='AQIDBA==',mime='audio/L16;rate=24000',responses}={}){
 let identityCalls=0,modelCalls=0,payload,requestUrl;
 const googleFetch=async (url,init)=>{identityCalls++;assert.ok(url.startsWith('https://oauth2.googleapis.com/tokeninfo?id_token='));assert.equal(init.redirect,'manual','Google ID verification must never follow a redirect');return google===null?new Response('{}',{status:401}):Response.json(google);};
 const geminiFetch=async (url,init)=>{modelCalls++;requestUrl=url;payload=JSON.parse(init.body);return responses?Response.json(responses[Math.min(modelCalls-1,responses.length-1)]):providerStatus!==200?Response.json({error:'fail'},{status:providerStatus}):Response.json({candidates:[{content:{parts:[{inlineData:{mimeType:mime,data}}]}}]});};
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
 assert.match(b.stats().payload.contents[0].parts[0].text,/Mandarin Chinese/);
 assert.equal(b.stats().modelCalls,1);assert.equal(r.headers.get('Cache-Control'),'no-store');
});
test('actual HTTP200 OTHER/empty-audio regression retries once and accepts the completed PCM',async()=>{
 const empty={candidates:[{finishReason:'OTHER',content:{parts:[]}}]},complete={candidates:[{finishReason:'STOP',content:{parts:[{inlineData:{mimeType:'audio/L16;codec=pcm;rate=24000',data:'AQIDBA=='}}]}}]};
 const b=build({responses:[empty,complete]}),r=await b.handler(req(),await env());assert.equal(r.status,200);assert.equal((await r.json()).audioBase64,'AQIDBA==');assert.equal(b.stats().modelCalls,2);
 assert.equal(b.stats().payload.contents[0].parts[0].text,'你好','retry uses the literal Chinese transcript, not the failed instruction');
 const failed=build({responses:[empty]}),bad=await failed.handler(req(),await env());assert.equal(bad.status,502);assert.equal((await bad.json()).error,'tts_generation_incomplete');assert.equal(failed.stats().modelCalls,2,'no unbounded generation loop');
});
test('safety/refusal does not retry or accept partial audio',async()=>{
 const blocked={candidates:[{finishReason:'SAFETY',content:{parts:[{inlineData:{mimeType:'audio/L16',data:'AQIDBA=='}}]}}]},b=build({responses:[blocked]});assert.equal((await b.handler(req(),await env())).status,502);assert.equal(b.stats().modelCalls,1);assert.equal(decodeVoiceAudio({promptFeedback:{blockReason:'SAFETY'}}).error,'tts_blocked');
});
test('PCM parser checks decoded bytes/rate, normalizes line wrapping and joins all audio parts',()=>{
 const part=(data,mimeType='audio/L16;codec=pcm;rate=24000')=>({inlineData:{data,mimeType}}),audio=parts=>({candidates:[{finishReason:'STOP',content:{parts}}]});
 assert.equal(decodeVoiceAudio(audio([part('AQID\r\nBA==')])).audioBase64,'AQIDBA==');assert.equal(decodeVoiceAudio(audio([part('AQI='),part('AwQ=')])).audioBase64,'AQIDBA==');
 for(const p of [part('AQ=='),part('AQIDBA=evil'),part('AQIDBA==','audio/L16;rate=16000'),part('AQIDBA==','audio/L16;channels=2'),part('AQIDBA==','audio/wav'),part('AAAA'.repeat(500001))])assert.equal(decodeVoiceAudio(audio([p])).error,'invalid_tts_audio');
});
test('WAV validation rejects wrong rates, broken RIFF sizes and missing PCM/data chunks',()=>{
 const wav=Buffer.alloc(48);wav.write('RIFF');wav.writeUInt32LE(40,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(24000,24);wav.writeUInt32LE(48000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(4,40);
 const data=b=>({candidates:[{content:{parts:[{inlineData:{mimeType:'audio/wav',data:b.toString('base64')}}]}}]});assert.equal(decodeVoiceAudio(data(wav)).mimeType,'audio/wav');
 for(const corrupt of [b=>b.writeUInt32LE(16000,24),b=>b.writeUInt32LE(400,4),b=>b.write('JUNK',36),b=>b.writeUInt16LE(3,20),b=>b.writeUInt32LE(80,40)]){const bytes=Buffer.from(wav);corrupt(bytes);assert.equal(decodeVoiceAudio(data(bytes)).error,'invalid_tts_audio');}
});
test('respect upstream rate exhaustion and malformed response',async()=>{
 for(const status of [429,503,403]){
  const b=build({providerStatus:status}),r=await b.handler(req(),await env());
  assert.equal(r.status,status===403?502:status);assert.equal((await r.json()).error,status===429?'tts_rate_limited':status===403?'tts_permission_denied':'tts_provider_unavailable');
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

test('incomplete audio diagnostics expose finish metadata without transcript or payload',async()=>{
 const raw={candidates:[{finishReason:'OTHER',content:{parts:[{text:'private-transcript'}]}}]};
 const b=build({responses:[raw]}),r=await b.handler(req(),await env()),d=await r.json();
 assert.equal(d.error,'tts_generation_incomplete');assert.equal(d.diagnostic.finishReason,'OTHER');
 assert.equal(d.diagnostic.textParts,1);assert.equal(d.diagnostic.audioParts,0);
 assert.equal(JSON.stringify(d).includes('private-transcript'),false);
});

test("accepts ten-minute PCM and rejects aggregate overflow",()=>{
 const data=Buffer.alloc(600*48000).toString("base64");
 const part=data=>({inlineData:{data,mimeType:"audio/L16;rate=24000"}});
 const result=decodeVoiceAudio({candidates:[{finishReason:"STOP",content:{parts:[part(data)]}}]});
 assert.equal(Buffer.from(result.audioBase64,"base64").length,VOICE_MAX_AUDIO_BYTES-44);
 assert.equal(decodeVoiceAudio({candidates:[{content:{parts:[part(data),part("AAAAAA==")]}}]}).error,"invalid_tts_audio");
});
