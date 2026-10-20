const assert=require('node:assert/strict');
(async()=>{const {createVoicePrecacheHandler}=await import('../../server/voice-worker-recovery.mjs');
const sub='1234567890',now=Date.now(),digest=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(sub))).toString('hex');
let seen;const provider=async(url,init)=>{seen=JSON.parse(init.body);return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{inlineData:{data:Buffer.alloc(9600).toString('base64'),mimeType:'audio/L16;rate=24000'}}]}}]})};
const h=createVoicePrecacheHandler(async()=>Response.json({iss:'accounts.google.com',email_verified:true,sub,exp:now/1000+3600,aud:'test'}),provider,()=>now,()=>provider);
const env={HSK_VOICE_GOOGLE_SUB_SHA256:digest};
function req(extra){return new Request('https://example.test/voice-precache',{method:'POST',headers:{Authorization:'Bearer test.token'},body:JSON.stringify({items:['你好','学习'],isolated:true,keySlot:1,model:'gemini-3.1-flash-tts-preview',...extra})});}
let r=await h(req({dictionaryStyle:true}),env);assert.equal(r.status,200);const prompt=seen.contents[0].parts[0].text;assert(prompt.includes('citation'));assert(!/silence|seconds/.test(prompt));assert(prompt.includes('你好。\n学习。'));
r=await h(req({}),env);assert.equal(r.status,200);assert(seen.contents[0].parts[0].text.includes('1.2 seconds'));
r=await h(req({dictionaryStyle:'yes'}),env);assert.equal(r.status,400);
r=await h(new Request('https://example.test',{method:'POST',body:'{}'}),env);assert.equal(r.status,401);
console.log('PASS opt-in dictionary prompt, postprocess-only silence instruction, existing TTS unchanged, invalid flag/auth rejected');
})().catch(e=>{console.error(e);process.exitCode=1});
