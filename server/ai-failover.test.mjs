import test from 'node:test';import assert from 'node:assert/strict';
import {createAiFailoverFetch} from './ai-backup.mjs';
import {createHandler} from './translator-worker-bundled.mjs';
const env={AI_BACKUP_ENABLED:'true',SECONDARY_AI_PROVIDER:'xkiro',SECONDARY_AI_API_KEY:'test-only-not-a-real-key-12345',SECONDARY_AI_MODEL:'text-model'};
const url='https://generativelanguage.googleapis.com/v1beta/models/test:generateContent';
const init={body:JSON.stringify({systemInstruction:{parts:[{text:'Answer in Vietnamese'}]},contents:[{role:'user',parts:[{text:'question'}]}],generationConfig:{responseSchema:{type:'OBJECT',properties:{answer:{type:'STRING'}},required:['answer']}}})};
const good=()=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:'{"answer":"Đúng"}'}]}}]});
const backup=()=>Response.json({choices:[{message:{content:'{"answer":"Dự phòng"}'}}]});
test('transient/provider errors fail over once, successful Gemini never calls backup',async()=>{
 for(const status of [401,403,404,408,429,500,502,503,504]){
  const calls=[];const f=createAiFailoverFetch(async u=>{calls.push(u);return u===url?new Response('',{status}):backup()},env);
  assert.equal((await (await f(url,init)).json()).candidates[0].content.parts[0].text,'{"answer":"Dự phòng"}');assert.equal(calls.length,2);
 }
 let calls=0;const f=createAiFailoverFetch(async()=>{calls++;return good()},env);await f(url,init);assert.equal(calls,1);
});
test('network, invalid JSON, empty candidates, missing schema fields and truncation fail over',async()=>{
 for(const primary of [()=>{throw TypeError('network')},()=>new Response('bad'),()=>Response.json({candidates:[]}),()=>Response.json({candidates:[{content:{parts:[{text:'{}'}]}}]}),()=>Response.json({candidates:[{finishReason:'MAX_TOKENS',content:{parts:[{text:'{}'}]}}]})]){
  let calls=0;const f=createAiFailoverFetch(async u=>{calls++;return u===url?primary():backup()},env);assert.equal((await f(url,init)).status,200);assert.equal(calls,2);
 }
});
test('primary deadline includes stalled response body, aborts it and bounds backup wait',async()=>{
 let aborted=false,calls=0;const f=createAiFailoverFetch(async(u,o)=>{calls++;if(u!==url)return backup();o.signal.addEventListener('abort',()=>aborted=true);return new Response(new ReadableStream({start(){}}));},env,{timeoutMs:10,backupTimeoutMs:50});
 assert.equal((await f(url,init)).status,200);assert.equal(aborted,true);assert.equal(calls,2);
 const g=createAiFailoverFetch(async()=>new Promise(()=>{}),env,{timeoutMs:10,backupTimeoutMs:10});assert.equal((await g(url,init)).status,503);
});
test('caller cancel does not trigger backup, and never retries backup failure',async()=>{
 const c=new AbortController();let calls=0;const f=createAiFailoverFetch(async()=>{calls++;c.abort();throw new DOMException('Canceled','AbortError')},env);
 await assert.rejects(f(url,{...init,signal:c.signal}),{name:'AbortError'});assert.equal(calls,1);
 calls=0;const g=createAiFailoverFetch(async()=>{calls++;return new Response('',{status:503})},env);assert.equal((await g(url,init)).status,503);assert.equal(calls,2);
});
test('safety refusal, invalid request, auth/source fetch and image input never cross to text backup',async()=>{
 for(const primary of [()=>Response.json({promptFeedback:{blockReason:'SAFETY'}}),()=>Response.json({candidates:[{finishReason:'PROHIBITED_CONTENT'}]}),()=>new Response('',{status:400})]){let calls=0;const f=createAiFailoverFetch(async()=>{calls++;return primary()},env);await f(url,init);assert.equal(calls,1);}
 let calls=0;const f=createAiFailoverFetch(async()=>{calls++;return new Response('',{status:503})},env);
 await f('https://identitytoolkit.googleapis.com/v1/accounts:lookup',init);assert.equal(calls,1);
 await f(url,{body:JSON.stringify({contents:[{parts:[{inlineData:{data:'image'}}]}]})});assert.equal(calls,2);
 const off=createAiFailoverFetch(async()=>{calls++;return new Response('',{status:503})},{...env,AI_BACKUP_ENABLED:'false'});await off(url,init);assert.equal(calls,3);
 assert.equal(createAiFailoverFetch(f,env),f,'nested reading call cannot double-fallback');
});
test('authenticated dictionary route reaches backup through bundled handler; invalid auth never does',async()=>{
 const project='hsk-flashcards-44631',claims={aud:project,iss:'https://securetoken.google.com/'+project,sub:'test-user',exp:Math.floor(Date.now()/1000)+3600};
 const token='header.'+Buffer.from(JSON.stringify(claims)).toString('base64url')+'.signature',calls=[];
 const handler=createHandler(async(u,o)=>{calls.push(u);if(u.includes('identitytoolkit'))return Response.json({users:[{localId:'test-user'}]});if(u.includes('generativelanguage'))return new Response('',{status:503});const sent=JSON.parse(o.body);assert.equal(sent.max_tokens,900);assert.match(sent.messages[0].content,/tiếng Việt/);return Response.json({choices:[{message:{content:JSON.stringify({answer:'你好 nghĩa là xin chào.',terms:[{han:'你好',pinyin:'nǐ hǎo',meaning:'xin chào'}]})}}]});});
 const request=auth=>new Request('https://worker.test/dictionary-lookup',{method:'POST',headers:{Origin:'https://trungxemcode.github.io',...(auth?{Authorization:'Bearer '+token}:{})},body:JSON.stringify({query:'xin chào'})});
 const configured={...env,GEMINI_API_KEY:'fake',FIREBASE_API_KEY:'fake'};
 assert.equal((await handler(request(false),configured)).status,401);assert.equal(calls.length,0);
 const r=await handler(request(true),configured);assert.equal(r.status,200);assert.equal((await r.json()).terms[0].han,'你好');assert.equal(calls.length,3);
});
