import test from 'node:test';
import assert from 'node:assert/strict';
import {aiTaskRole,createAiRoleFetch,createAiFailoverFetch} from './ai-backup.mjs';
import {createHandler} from './translator-worker-bundled.mjs';
const env={AI_TASK_ROUTING:'true',AI_BACKUP_ENABLED:'true',SECONDARY_AI_PROVIDER:'xkiro',SECONDARY_AI_API_KEY:'test-only-not-a-real-key-12345',SECONDARY_AI_MODEL:'text-model'};
const url='https://generativelanguage.googleapis.com/v1beta/models/test:generateContent';
const init={body:JSON.stringify({contents:[{role:'user',parts:[{text:'hello'}]}],generationConfig:{maxOutputTokens:900,responseSchema:{type:'OBJECT',properties:{answer:{type:'STRING'}},required:['answer']}}})};
const gem=(data={answer:'Gemini'})=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(data)}]}}]});
const x=(data={answer:'xKiro'},finish='stop')=>Response.json({choices:[{finish_reason:finish,message:{content:JSON.stringify(data)}}]});
test('server routes ordinary tasks to xKiro and complex/multimodal tasks to Gemini',()=>{
 for(const route of ['/dictionary-lookup','/ask','/lesson-ask','/translate','/dictionary-translate'])assert.equal(aiTaskRole(route,{hsk:3,text:'xin chào'}),'xkiro');
 for(const route of ['/ocr','/handwriting-recognize','/study-plan-review'])assert.equal(aiTaskRole(route,{}),'gemini');
 assert.equal(aiTaskRole('/ask',{question:'Phân tích sắc thái của hai từ'}),'gemini');
 assert.equal(aiTaskRole('/ask',{question:'分析语用'}),'gemini');
 assert.equal(aiTaskRole('/translate',{text:'a'.repeat(181),hsk:3}),'gemini');
 assert.equal(aiTaskRole('/translate',{text:'xin chào',hsk:5}),'gemini');
 assert.equal(aiTaskRole('/reading-next',{hsk:3,genre:'story'}),'xkiro');
 for(const genre of ['news','explainer'])assert.equal(aiTaskRole('/reading-next',{hsk:3,genre}),'gemini');
 assert.equal(aiTaskRole('/reading-next',{hsk:5,genre:'story'}),'gemini');
});
test('ordinary success uses xKiro only and reports its actual provider',async()=>{
 const calls=[],seen=[];const f=createAiRoleFetch(async u=>{calls.push(u);return x()},env,{route:'/dictionary-lookup',body:{},onProvider:p=>seen.push(p)});
 assert.equal((await (await f(url,init)).json()).candidates[0].content.parts[0].text,'{"answer":"xKiro"}');
 assert.equal(calls.length,1);assert.match(calls[0],/api.xkiro.com/);assert.deepEqual(seen,['xkiro']);
});
test('xKiro error, truncation, schema and semantic failures use Gemini exactly once',async()=>{
 for(const first of [()=>new Response('',{status:503}),()=>x({},'stop'),()=>x({answer:'short'}),()=>x({answer:'long enough'},'length'),()=>{throw TypeError('network')}]){
 const calls=[];const f=createAiRoleFetch(async u=>{calls.push(u);return u===url?gem({answer:'long enough'}):first()},env,{route:'/reading-next',body:{hsk:3,genre:'story'},validateData:d=>d.answer.length>6});
 assert.equal((await f(url,init)).status,200);assert.equal(calls.length,2);assert.equal(calls[1],url);
 }
});
test('heavy task stays Gemini-first and can fall back once',async()=>{
 for(const failed of [false,true]){const calls=[];const f=createAiRoleFetch(async u=>{calls.push(u);return u===url?(failed?new Response('',{status:503}):gem()):x()},env,{route:'/study-plan-review',body:{}});
 assert.equal((await f(url,init)).status,200);assert.equal(calls[0],url);assert.equal(calls.length,failed?2:1);}
});
test('disabled routing retains legacy order; missing xKiro credentials uses Gemini',async()=>{
 for(const configured of [{...env,AI_TASK_ROUTING:'false'},{...env,SECONDARY_AI_API_KEY:undefined}]){const calls=[];const f=createAiRoleFetch(async u=>{calls.push(u);return gem()},configured,{route:'/ask',body:{}});await f(url,init);assert.deepEqual(calls,[url]);}
});
test('xKiro refusal and caller cancellation never cross providers',async()=>{
 let calls=0;const f=createAiRoleFetch(async()=>{calls++;return Response.json({choices:[{message:{refusal:'No'},finish_reason:'stop'}]})},env,{route:'/ask',body:{}});
 assert.equal((await f(url,init)).status,422);assert.equal(calls,1);
 const c=new AbortController();calls=0;const g=createAiRoleFetch(async()=>{calls++;c.abort();throw new DOMException('Canceled','AbortError')},env,{route:'/ask',body:{}});
 await assert.rejects(g(url,{...init,signal:c.signal}),{name:'AbortError'});assert.equal(calls,1);
});
test('xKiro stalled body is canceled before Gemini; two failures terminate',async()=>{
 let aborted=false,calls=0;const f=createAiFailoverFetch(async(u,o)=>{calls++;if(u===url)return gem();o.signal.addEventListener('abort',()=>aborted=true);return new Response(new ReadableStream({start(){}}));},env,{preferSecondary:true,timeoutMs:10,backupTimeoutMs:100});
 assert.equal((await f(url,init)).status,200);assert.equal(aborted,true);assert.equal(calls,2);
 calls=0;const g=createAiRoleFetch(async()=>{calls++;return new Response('',{status:503})},env,{route:'/ask',body:{}});assert.equal((await g(url,init)).status,503);assert.equal(calls,2);
});
test('invalid final Gemini output cannot escape as successful JSON',async()=>{
 const f=createAiRoleFetch(async u=>u===url?gem({}):new Response('',{status:503}),env,{route:'/ask',body:{}});
 assert.equal((await f(url,init)).status,503);
});
test('image input never goes to text-only xKiro',async()=>{
 const calls=[];const f=createAiRoleFetch(async u=>{calls.push(u);return gem()},env,{route:'/ocr',body:{}});
 await f(url,{body:JSON.stringify({contents:[{parts:[{inlineData:{data:'image'}}]}]})});assert.deepEqual(calls,[url]);
});
test('bundled auth gate and actual provider response header work with routing enabled',async()=>{
 const project='hsk-flashcards-44631',claims={aud:project,iss:'https://securetoken.google.com/'+project,sub:'test-user',exp:Math.floor(Date.now()/1000)+3600};
 const token='header.'+Buffer.from(JSON.stringify(claims)).toString('base64url')+'.signature',calls=[];
 const handler=createHandler(async u=>{calls.push(u);if(u.includes('identitytoolkit'))return Response.json({users:[{localId:'test-user'}]});if(u.includes('generativelanguage'))throw Error('ordinary route must not spend Gemini quota');return x({answer:'Xin chào',terms:[{han:'你好',pinyin:'nǐ hǎo',meaning:'xin chào'}]});});
 const req=auth=>new Request('https://worker.test/dictionary-lookup',{method:'POST',headers:{Origin:'https://trungxemcode.github.io',...(auth?{Authorization:'Bearer '+token}:{})},body:JSON.stringify({query:'xin chào'})});
 assert.equal((await handler(req(false),{...env,GEMINI_API_KEY:'fake',FIREBASE_API_KEY:'fake'})).status,401);assert.equal(calls.length,0);
 const r=await handler(req(true),{...env,GEMINI_API_KEY:'fake',FIREBASE_API_KEY:'fake'});assert.equal(r.status,200);assert.equal(r.headers.get('X-HSK-AI-Provider'),'xkiro');assert.equal(calls.length,2);
});
