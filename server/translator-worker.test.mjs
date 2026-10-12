import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHandler, WORKER_REVISION } from './translator-worker-bundled.mjs';

const origin='https://trungxemcode.github.io';
const env={GEMINI_API_KEY:'test-gemini-secret',FIREBASE_API_KEY:'test-firebase-secret'};
const project='hsk-flashcards-44631',now=Date.now();
const claims={aud:project,iss:'https://securetoken.google.com/'+project,sub:'test-user',exp:Math.floor(now/1000)+3600};
const token='header.'+Buffer.from(JSON.stringify(claims)).toString('base64url')+'.signature';
const lessonData=JSON.parse(await readFile(new URL('../lesson-content-hsk1.json',import.meta.url),'utf8'));
const lesson={id:lessonData.lessons[0].id,title:'你好',words:[{han:'你好',pin:'nǐ hǎo',mean:'xin chào'}],content:lessonData.lessons[0]};
const bodies={
 '/lesson-ask':{hsk:1,question:'Giải thích cách chào hỏi trong bài này',lesson,history:[{role:'user',text:'你好 nghĩa là gì?'},{role:'assistant',text:'你好 có nghĩa là xin chào.'}]},
 '/ask':{hsk:1,question:'Giải thích câu này',translation:{vietnamese:'Xin chào',chinese:'你好',pinyin:'nǐ hǎo',explanation:'Lời chào'},history:[]},
 '/translate':{hsk:1,text:'Xin chào'},
 '/ocr':{image:{mimeType:'image/png',data:Buffer.from([137,80,78,71,13,10,26,10,0,0,0,0,0,0,0,0]).toString('base64')}}
};
function setup(providerResponse,options={}){
 const calls=[];
 const handler=createHandler(async(url,request)=>{
  calls.push({url:String(url),body:JSON.parse(request.body)});
  if(String(url).includes('identitytoolkit.googleapis.com'))return Response.json({users:[{localId:'test-user'}]});
  return providerResponse();
 },()=>now);
 return {calls,run:(route,body=bodies[route])=>handler(new Request('https://worker.test'+route,{method:'POST',headers:{Origin:origin,Authorization:'Bearer '+token},body:JSON.stringify(body)}),{...env,...options})};
}
const answerResponse=()=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({answer:'你好 là lời chào.'})}]}}]});

test('lesson questions use the old Gemini 3.5 Flash Lite request settings and actual lesson context',async()=>{
 const {run,calls}=setup(answerResponse);
 const response=await run('/lesson-ask');
 assert.equal(response.status,200);
 assert.equal((await response.json()).answer,'你好 là lời chào.');
 assert.equal(response.headers.get('X-HSK-Worker-Version'),WORKER_REVISION);
 assert.match(calls[1].url,/\/gemini-3\.5-flash-lite:generateContent$/);
 assert.deepEqual(calls[1].body.generationConfig,{temperature:0.2,maxOutputTokens:900,responseMimeType:'application/json',responseSchema:{type:'OBJECT',properties:{answer:{type:'STRING'}},required:['answer']}});
 assert.deepEqual(calls[1].body.contents.map(m=>m.role),['user','model','user']);
 assert.ok(calls[1].body.systemInstruction.parts[0].text.includes(JSON.stringify(lesson)));
});

test('sentence Q&A, translation and OCR retain their previous generation settings',async()=>{
 const qa=setup(answerResponse);assert.equal((await qa.run('/ask')).status,200);
 assert.equal(qa.calls[1].body.generationConfig.temperature,0.2);
 assert.equal(qa.calls[1].body.generationConfig.maxOutputTokens,900);
 const translated={chinese:'你好',pinyin:'nǐ hǎo',explanation:'Lời chào',note:''};
 const translation=setup(()=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(translated)}]}}]}));
 assert.equal((await translation.run('/translate')).status,200);
 assert.equal(translation.calls[1].body.generationConfig.temperature,0.2);
 assert.equal(translation.calls[1].body.generationConfig.maxOutputTokens,2200);
 const ocr=setup(()=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({text:'你好',note:''})}]}}]}));
 assert.equal((await ocr.run('/ocr')).status,200);
 assert.equal(ocr.calls[1].body.generationConfig.temperature,0);
 assert.deepEqual(ocr.calls[1].body.generationConfig.thinkingConfig,{thinkingLevel:'minimal'});
});

test('HTTP 400 exposes the provider reason and model while redacting keys and keeping logs free of request text',async(t)=>{
 const log=t.mock.method(console,'warn',()=>{});
 const message='Invalid responseSchema: '+env.GEMINI_API_KEY+' '+env.FIREBASE_API_KEY+' AIza012345678901234567890123456789';
 const {run}=setup(()=>Response.json({error:{status:'INVALID_ARGUMENT',message}},{status:400}));
 const response=await run('/lesson-ask'),data=await response.json();
 assert.equal(response.status,502);
 assert.match(data.error,/Invalid responseSchema/);
 assert.equal(data.providerStatus,'INVALID_ARGUMENT');
 assert.equal(data.model,'gemini-3.5-flash-lite');
 assert.equal(data.workerRevision,WORKER_REVISION);
 for(const secret of [env.GEMINI_API_KEY,env.FIREBASE_API_KEY,'AIza012345678901234567890123456789'])assert.ok(!JSON.stringify(data).includes(secret));
 assert.ok(!JSON.stringify(log.mock.calls).includes(bodies['/lesson-ask'].question));
 assert.ok(!JSON.stringify(log.mock.calls).includes(message));
});

test('provider errors also remain actionable for translation and OCR; non-JSON errors do not crash',async(t)=>{
 t.mock.method(console,'warn',()=>{});
 for(const route of ['/translate','/ocr']){
  const {run}=setup(()=>Response.json({error:{status:'INVALID_ARGUMENT',message:'Unsupported generation setting'}},{status:400}));
  assert.match((await (await run(route)).json()).error,/Unsupported generation setting/);
 }
 const {run}=setup(()=>new Response('Bad request',{status:400}));
 assert.match((await (await run('/lesson-ask')).json()).error,/HTTP 400/);
 const limited=setup(()=>Response.json({error:{status:'RESOURCE_EXHAUSTED',message:'Quota exceeded'}},{status:429}));
 assert.equal((await limited.run('/lesson-ask')).status,429);
});

test('input validation still prevents invalid questions reaching Firebase or Gemini',async()=>{
 const {run,calls}=setup(answerResponse);
 assert.equal((await run('/lesson-ask',{...bodies['/lesson-ask'],question:'x'.repeat(501)})).status,400);
 assert.equal(calls.length,0);
});

test('bundled deployment includes exactly the same handler as the source worker',async()=>{
 const source=await readFile(new URL('./translator-worker.mjs',import.meta.url),'utf8');
 const bundled=await readFile(new URL('./translator-worker-bundled.mjs',import.meta.url),'utf8');
 assert.equal(source.slice(source.indexOf('const schema =')).replace(/\r\n/g,'\n'),bundled.slice(bundled.indexOf('const schema =')).replace(/\r\n/g,'\n'));
});


test('all AI routes identify unsupported upstream location without exposing secrets',async(t)=>{
 t.mock.method(console,'warn',()=>{});
 for(const route of ['/lesson-ask','/ask','/translate','/ocr']){
  const {run}=setup(()=>Response.json({error:{status:'FAILED_PRECONDITION',message:'User location is not supported for the API use. '+env.GEMINI_API_KEY}},{status:400}));
  const response=await run(route),data=await response.json();
  assert.equal(response.status,502);
  assert.equal(data.code,'AI_LOCATION_UNSUPPORTED');
  assert.match(data.error,/khu vực/);
  assert.equal(JSON.stringify(data).includes(env.GEMINI_API_KEY),false);
 }
});

test('deployment config targets the existing Worker and preserves dashboard variables',async()=>{
 const config=JSON.parse(await readFile(new URL('./wrangler.jsonc',import.meta.url),'utf8'));
 assert.equal(config.name,'hsk-vietnamese-translator');
 assert.equal(config.main,'translator-worker-bundled.mjs');
 assert.equal(config.placement.region,'gcp:us-east4');
 assert.equal(config.keep_vars,true);
 assert.equal(config.vars,undefined);
});
