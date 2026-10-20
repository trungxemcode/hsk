const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const s=fs.readFileSync(__dirname+'/voice-worker-recovery.mjs','utf8');
const start=s.indexOf('async function hskVerifyVocabularyAudio('),end=s.indexOf('__name(hskVerifyVocabularyAudio',start);
const context=vm.createContext({Response,voiceProviderFailure:async r=>({upstreamStatus:r.status,error:'tts_rate_limited',retryAfter:60,retryable:true,providerAttempts:1})});
vm.runInContext(s.slice(start,end)+';globalThis.verify=hskVerifyVocabularyAudio;',context);
(async()=>{
const input={clips:['UklG'+'A'.repeat(80)],items:['ä½ å¥½'],pinyin:['nÇ hÇŽo']};
let calls=0;
let result=await context.verify(input,async(url,init)=>{calls++;assert(url.includes('/gemini-3.5-flash-lite:'));const body=JSON.parse(init.body);assert(!JSON.stringify(body).includes('ä½ å¥½'));return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({hanzi:['ä½ å¥½'],pinyin:['nÇ hÇŽo']})}]}}]});});
assert.equal(result.status,200);assert.equal(calls,2);assert.equal(result.result.transcripts.length,2);
result=await context.verify(input,async()=>new Response('{}',{status:429}));
assert.equal(result.status,429);assert.equal(result.result.upstreamStatus,429);assert.equal(result.result.providerReason,'asr_rate_limited');assert.equal(result.result.model,'gemini-3.5-flash-lite');
result=await context.verify({...input,clips:['UklG'+'A'.repeat(650000)]},async()=>{throw Error('must not call')});
assert.equal(result.status,400);
console.log('PASS: two blind checks, configured model, provider status/retry metadata, oversize guard');
})().catch(e=>{console.error(e);process.exitCode=1});


(async()=>{
 const {webcrypto}=require('node:crypto');globalThis.crypto ||= webcrypto;
 const {createVoicePrecacheHandler}=await import('./voice-worker-recovery.mjs');
 const sub='1234567890',now=1700000000000;
 const digest=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(sub))).toString('hex');
 const env={HSK_VOICE_GOOGLE_SUB_SHA256:digest,HSK_VOICE_GOOGLE_AUDIENCE:'test-aud',HSK_VOICE_ASR_MODEL:'gemini-3.5-flash-lite'};
 const identity=async()=>Response.json({iss:'accounts.google.com',email_verified:true,sub,exp:now/1000+3600,aud:'test-aud'});
 let calls=0,selections=[];
 const provider=async(url,init)=>{
  calls++;assert(url.includes('/gemini-3.5-flash-lite:'));
  const payload=JSON.parse(init.body);assert(!JSON.stringify(payload).includes('EXPECTED_SECRET_WORD'));
  const legacy=payload.contents[0].parts[0].text.includes('only transcripts');
  return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(legacy?{transcripts:['你好']}:{hanzi:['你好'],pinyin:['nǐ hǎo']})}]}}]});
 };
 const handler=createVoicePrecacheHandler(identity,()=>{throw Error('must use ASR-specific pool')},()=>now,(slot,isolated,model)=>{selections.push({slot,model});return provider});
 const request=body=>new Request('https://example.test/voice-precache',{method:'POST',headers:{Authorization:'Bearer test.token'},body:JSON.stringify(body)});
 let r=await handler(request({action:'verify-words',keySlot:0,clips:['UklG'+'A'.repeat(80)],items:['EXPECTED_SECRET_WORD'],pinyin:['expected']}),env);
 assert.equal(r.status,200);assert.equal(calls,2);assert.equal(selections[0].slot,undefined);
 r=await handler(request({action:'verify',items:['你好','再见'],clips:['UklG'+'A'.repeat(80)]}),env);
 assert.equal(r.status,200);assert.equal((await r.json()).verification,'double_asr_exact');assert.equal(calls,4);
 const failure=createVoicePrecacheHandler(identity,provider,()=>now,()=>async()=>Response.json({error:{message:'private details'}},{status:404}));
 r=await failure(request({action:'verify-words',keySlot:2,clips:['UklG'+'A'.repeat(80)],items:['你好'],pinyin:['nǐ hǎo']}),env);
 const body=await r.json();assert.equal(body.upstreamStatus,404);assert.equal(body.providerReason,'asr_model_unavailable');assert(!JSON.stringify(body).includes('private details'));
 r=await handler(new Request('https://example.test/voice-precache',{method:'POST',body:'{}'}),env);assert.equal(r.status,401);
 console.log('PASS: both authenticated ASR routes, model-specific pool, double transcription, safe 404 diagnostics, missing-token rejection');
})().catch(e=>{console.error(e);process.exitCode=1});
