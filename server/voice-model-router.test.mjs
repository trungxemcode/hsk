import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {createVoicePrecacheHandler} from './voice-tts.mjs';
import {HSK_FREE_TTS_MODELS, hskTtsModelInfo, hskTtsNamespace, hskBuildInteractionRequest,hskInteractionAsLegacyAudio} from './voice-model-router.mjs';
globalThis.crypto ||= webcrypto;
const sub='113615575809199186059',digest=async x=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(x))),b=>b.toString(16).padStart(2,'0')).join('');
const identity={iss:'https://accounts.google.com',email_verified:true,sub,exp:Math.floor(Date.now()/1000)+3600,aud:'test-oauth-client-id'};
const req=(body)=>new Request('https://hsk.example/voice-precache',{method:'POST',headers:{Authorization:'Bearer test-owner-token'},body:JSON.stringify(body)});
function setup(result){
 const calls=[],googleFetch=async()=>Response.json(identity);
 const slotFetch=(slot,isolated,model)=>{
  calls.push({type:'select',slot,isolated,model});
  const provider=async(u,init)=>{calls.push({type:'provider',url:u,payload:JSON.parse(init.body)});return Response.json(result||{output_audio:{data:'AQIDBA==',mime_type:'audio/L16;codec=pcm;rate=24000'}})};
  provider.availability=async()=>{calls.push({type:'status'});return [{slot:11,retryAfter:0},{slot:12,retryAfter:200}]};
  provider.inspect=async()=>Response.json({name:model,supportedGenerationMethods:['generateContent']});
  return provider;
 };
 const handler=createVoicePrecacheHandler(googleFetch,async()=>{throw Error('unrouted provider')},()=>Date.now(),slotFetch);
 return {handler,calls};
}
test('allowlist includes 2.5 + 3.1 + 3.8 TTS but excludes 3.5 Flash, 3.5 Transcribe and paid Pro by default',()=>{
 assert.ok(HSK_FREE_TTS_MODELS.includes('gemini-2.5-flash-preview-tts'));
 assert.ok(HSK_FREE_TTS_MODELS.includes('gemini-3.8-flash-lite-tts'));
 assert.ok(HSK_FREE_TTS_MODELS.includes('gemini-3.8-flash-tts'));
 assert.equal(hskTtsModelInfo('gemini-3.5-flash'),null);
 assert.equal(hskTtsModelInfo('gemini-3.5-transcribe'),null);
 assert.equal(hskTtsModelInfo('gemini-2.5-pro-preview-tts'),null);
 assert.equal(hskTtsModelInfo('gemini-2.5-pro-preview-tts',{allowPaid:true}).free,false);
 assert.notEqual(hskTtsNamespace('gemini-2.5-flash-preview-tts'),hskTtsNamespace('gemini-3.8-flash-lite-tts'));
});
test('3.8 Interactions use verbatim Chinese input, Kore voice, and validate returned PCM',async()=>{
 const h=setup(),env={HSK_VOICE_GOOGLE_SUB_SHA256:await digest(sub)};
 const response=await h.handler(req({model:'gemini-3.8-flash-lite-tts',keySlot:11,isolated:true,items:['帮助','报纸']}),env),result=await response.json();
 assert.equal(response.status,200);assert.equal(result.ok,true);assert.equal(result.model,'gemini-3.8-flash-lite-tts');
 assert.equal(result.audioBase64,'AQIDBA==');const p=h.calls.find(x=>x.type==='provider');
 assert.equal(p.url,'https://generativelanguage.googleapis.com/v1beta/interactions');
 assert.equal(p.payload.model,'gemini-3.8-flash-lite-tts');
 assert.equal(p.payload.input,'帮助\n\n报纸');assert.deepEqual(p.payload.generation_config.speech_config,[{voice:'Kore'}]);
 assert.deepEqual(h.calls.find(x=>x.type==='select'),{type:'select',slot:11,isolated:false,model:'gemini-3.8-flash-lite-tts'});
});
test('model-scoped status never generates TTS and paid model requires explicit server flag',async()=>{
 const h=setup(),env={HSK_VOICE_GOOGLE_SUB_SHA256:await digest(sub)};
 const response=await h.handler(req({action:'status',model:'gemini-3.8-flash-tts'}),env),result=await response.json();
 assert.equal(response.status,200);assert.equal(result.slots.length,2);assert.equal(h.calls.filter(x=>x.type==='provider').length,0);
 assert.equal(h.calls.find(x=>x.type==='select').model,'gemini-3.8-flash-tts');
 assert.equal((await h.handler(req({action:'status',model:'gemini-3.5-transcribe'}),env)).status,400);
 assert.equal((await h.handler(req({keySlot:11,isolated:true,model:'gemini-2.5-pro-preview-tts',text:'你好'}),env)).status,400);
 assert.equal(h.calls.filter(x=>x.type==='provider').length,0);
});
test('3.8 response must contain one valid audio block; refusals and malformed text never become READY',async()=>{
 const env={HSK_VOICE_GOOGLE_SUB_SHA256:await digest(sub)};
 for(const bad of [{output_text:'你好'},{output_audio:{data:'text not pcm',mime_type:'text/plain'}},{steps:[{content:[{type:'text',text:'no audio'}]}]}]){
  const h=setup(bad),res=await h.handler(req({model:'gemini-3.8-flash-tts',keySlot:12,isolated:true,text:'你好'}),env);
  assert.equal(res.status,502);assert.equal(h.calls.filter(x=>x.type==='provider').length,1);
 }
 assert.equal(hskInteractionAsLegacyAudio({output_audio:{data:'AQIDBA==',mime_type:'audio/L16;codec=pcm;rate=24000'}}).candidates.length,1);
 assert.equal(hskBuildInteractionRequest('gemini-3.8-flash-tts','你好').payload.model,'gemini-3.8-flash-tts');
});
