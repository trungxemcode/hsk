import test from 'node:test';
import assert from 'node:assert/strict';
import {aiErrorKind,createGeminiModelFallback} from './ai-resilience.mjs';
import {createAiFailoverFetch} from './ai-backup.mjs';
const config={AI_MODEL_FAILOVER_ENABLED:'true',AI_GEMINI_FALLBACK_MODELS:'gemini-3.1-flash-lite,gemini-3.6-flash'};
const url='https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent';
const init=(key='private-key')=>({method:'POST',headers:{'x-goog-api-key':key},body:JSON.stringify({
 contents:[{role:'user',parts:[{text:'private prompt'}]}],
 generationConfig:{responseMimeType:'application/json',responseSchema:{type:'OBJECT',required:['answer'],properties:{answer:{type:'STRING'}}}}
})});
const bad=(status,message)=>Response.json({error:{message}},{status});
const success=()=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:'{"answer":"好"}'}]}}]});
test('classifies region, model access, caller errors and overload independently',async()=>{
 for(const [status,message,kind] of [[400,'User location is not supported for the API use.','region'],[400,'Bad schema','input'],[404,'This model is no longer available to new users','model'],[404,'File not found','input'],[503,'High demand','temporary'],[429,'Quota','quota'],[403,'Forbidden','key']])assert.equal(await aiErrorKind(bad(status,message)),kind);
});
test('unavailable model retries a compatible model with identical payload and key',async()=>{
 const seen=[],events=[],options=init();
 const call=createGeminiModelFallback(async(u,i)=>{seen.push([u,i]);return seen.length===1?bad(404,'Model not available to new users'):success();},config,{onResult:e=>events.push(e)});
 assert.equal((await call(url,options)).status,200);assert.equal(seen.length,2);
 assert.match(seen[1][0],/gemini-3.1-flash-lite:generateContent$/);assert.equal(seen[1][1].body,options.body);assert.equal(seen[1][1].headers,options.headers);
 assert.equal(events[0].effectiveModel,'gemini-3.1-flash-lite');assert.ok(!JSON.stringify(events).includes('private'));
});
test('temporary failure has a short abortable delay and at most two provider calls',async()=>{
 const seen=[],waits=[];
 const call=createGeminiModelFallback(async u=>{seen.push(u);return bad(503,'High demand');},config,{wait:async ms=>waits.push(ms)});
 assert.equal((await call(url,init())).status,503);assert.equal(seen.length,2);assert.deepEqual(waits,[200]);
});
test('model circuit is specific to key/model and expires after five minutes',async()=>{
 let time=0;const state=new Map(),seen=[];
 const call=createGeminiModelFallback(async(u,i)=>{seen.push([u,new Headers(i.headers).get('x-goog-api-key')]);return u===url?bad(404,'Model unavailable, no longer available'):success();},config,{state,now:()=>time});
 await call(url,init('key-a'));await call(url,init('key-a'));await call(url,init('key-b'));
 assert.equal(seen.filter(([u,k])=>u===url&&k==='key-a').length,1);assert.equal(seen.filter(([u,k])=>u===url&&k==='key-b').length,1);
 time=300001;await call(url,init('key-a'));assert.equal(seen.filter(([u,k])=>u===url&&k==='key-a').length,2);
 assert.ok(!JSON.stringify([...state]).includes('key-a'));
});
test('region failure does not fan out across models and skips the known failure briefly',async()=>{
 let calls=0,time=0;const events=[];
 const call=createGeminiModelFallback(async()=>{calls++;return bad(400,'User location is not supported for the API use.');},config,{now:()=>time,onResult:e=>events.push(e)});
 await call(url,init());await call(url,init());assert.equal(calls,1);assert.equal(events[1].attempts,0);
 time=30001;await call(url,init());assert.equal(calls,2);
});
test('429, invalid input and invalid key responses are never retried or rewritten',async()=>{
 for(const [status,message] of [[429,'Quota exceeded'],[400,'Bad request syntax'],[401,'Invalid key'],[403,'Forbidden']]){
  const response=bad(status,message);response.headers.set('Retry-After','120');let calls=0;
  const call=createGeminiModelFallback(async()=>{calls++;return response;},config);
  assert.equal(await call(url,init()),response);assert.equal(response.headers.get('Retry-After'),'120');assert.equal(calls,1);
 }
});
test('refusal and malformed successful output remain the responsibility of existing validation',async()=>{
 const response=Response.json({promptFeedback:{blockReason:'SAFETY'}});let calls=0;
 const call=createGeminiModelFallback(async()=>{calls++;return response;},config);
 assert.equal(await call(url,init()),response);assert.equal(calls,1);
});
test('feature flag, media generation, audio and unrelated services retain the original fetch',async()=>{
 const cases=[['https://identitytoolkit.googleapis.com/v1/accounts:lookup',init(),config],[url,init(),{}],['https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent',init(),config],[url,{...init(),body:JSON.stringify({generationConfig:{responseModalities:['AUDIO']}})},config],[url,{...init(),body:JSON.stringify({contents:[{parts:[{inlineData:{mimeType:'audio/mp4',data:'AAAA'}}]}]})},config]];
 for(const [u,i,c] of cases){let calls=0;const call=createGeminiModelFallback(async(actual,args)=>{calls++;assert.equal(actual,u);assert.equal(args,i);return bad(503,'High demand');},c);await call(u,i);assert.equal(calls,1);}
});
test('caller cancellation aborts fallback without a second provider call',async()=>{
 const controller=new AbortController();let calls=0;
 const call=createGeminiModelFallback(async()=>{calls++;controller.abort();return bad(503,'High demand');},config);
 await assert.rejects(call(url,{...init(),signal:controller.signal}),{name:'AbortError'});assert.equal(calls,1);
});
test('text region failure reaches configured backup, normal bad input does not',async()=>{
 const env={AI_BACKUP_ENABLED:'true',SECONDARY_AI_PROVIDER:'xkiro',SECONDARY_AI_API_KEY:'test-secret-long-enough',SECONDARY_AI_MODEL:'qwen/test'};
 for(const [message,expectedCalls,status] of [['User location is not supported for the API use.',1,200],['Bad schema',0,400]]){
  let backupCalls=0;
  const call=createAiFailoverFetch(async u=>{if(u.startsWith('https://api.xkiro.com/')){backupCalls++;return Response.json({choices:[{finish_reason:'stop',message:{content:'{"answer":"好"}'}}]});}return bad(400,message);},env);
  assert.equal((await call(url,init())).status,status);assert.equal(backupCalls,expectedCalls);
 }
});
test('multimodal and Gemini-only policy never sends an image or region error to text backup',async()=>{
 const env={AI_BACKUP_ENABLED:'true',SECONDARY_AI_PROVIDER:'xkiro',SECONDARY_AI_API_KEY:'test-secret-long-enough',SECONDARY_AI_MODEL:'qwen/test'};
 for(const [opts,input] of [[{providerOnly:'gemini'},init()],[{}, {...init(),body:JSON.stringify({contents:[{parts:[{inlineData:{mimeType:'image/png',data:'AAAA'}}]}]})}]]){
  let calls=0;const call=createAiFailoverFetch(async u=>{calls++;assert.ok(!u.includes('xkiro'));return bad(400,'User location is not supported for the API use.');},env,opts);
  assert.equal((await call(url,input)).status,400);assert.equal(calls,1);
 }
});
