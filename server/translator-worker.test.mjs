import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHandler, WORKER_REVISION, validateHandwritingSample } from './translator-worker-bundled.mjs';

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
const handwritingImage={mimeType:'image/png',data:Buffer.from([137,80,78,71,13,10,26,10,...Array(32).fill(0)]).toString('base64')};
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
const batchBody={entries:[{id:'entry-1',han:'直播间',pinyin:'zhi2 bo1 jian1',gloss:'live streaming room'}]};
const batchResponse=data=>()=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(data)}]}}]});
test('batch meanings are Vietnamese, mapped to source entries, and independent of HSK',async()=>{
 const {run,calls}=setup(batchResponse({translations:[{id:'entry-1',meaning:'phòng phát trực tiếp'}]}));const r=await run('/dictionary-translate',batchBody);assert.equal(r.status,200);assert.equal((await r.json()).language,'vi');assert.match(calls[1].body.systemInstruction.parts[0].text,/tiếng Việt/);assert.equal((await run('/dictionary-translate',batchBody)).status,429);assert.equal((await run('/dictionary-lookup',{query:'直播间'})).status,502,'separate dictionary routes must not share cooldown');
});
test('batch translation rejects invalid entries and mismatched provider IDs',async()=>{
 for(const entries of [[],Array(41).fill(batchBody.entries[0]),[{...batchBody.entries[0],han:'not Han'}],[{...batchBody.entries[0],gloss:''}],[batchBody.entries[0],batchBody.entries[0]]]){const {run,calls}=setup(batchResponse({translations:[]}));assert.equal((await run('/dictionary-translate',{entries})).status,400);assert.equal(calls.length,0);}
 for(const translations of [[],[{id:'wrong',meaning:'phòng phát trực tiếp'}],[{id:'entry-1',meaning:''}]]){const {run}=setup(batchResponse({translations}));assert.equal((await run('/dictionary-translate',batchBody)).status,502);}
 const handler=createHandler(async()=>{throw Error('unauthenticated provider call');});assert.equal((await handler(new Request('https://worker.test/dictionary-translate',{method:'POST',headers:{Origin:origin},body:JSON.stringify(batchBody)}),env)).status,401);
});
const dictionaryResponse=()=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({answer:'Chú thuật cần hiểu theo ngữ cảnh tín ngưỡng hoặc truyện/phim.',terms:[{han:'咒语',pinyin:'zhòu yǔ',meaning:'câu chú; thần chú'}]})}]}}]});
test('general dictionary has no HSK requirement and emits bounded Vietnamese semantic candidates',async()=>{
 const {run,calls}=setup(dictionaryResponse);const response=await run('/dictionary-lookup',{query:'chú thuật',context:'Trong truyện/phim'}),data=await response.json();assert.equal(response.status,200);assert.equal(data.scope,'general');assert.equal(data.source,'ai');assert.equal(data.terms[0].han,'咒语');
 const prompt=calls[1].body.systemInstruction.parts[0].text;assert.match(prompt,/KHÔNG phải gia sư của một bài HSK/);assert.match(prompt,/Không giới hạn từ vựng theo HSK/);assert.match(prompt,/không gộp 平凡/);assert.match(prompt,/pinyin đúng thanh điệu/);assert.match(prompt,/gloss nguồn/);assert.equal(calls[1].body.generationConfig.temperature,0);assert.doesNotMatch(prompt,/Bài học JSON:|Allowed vocabulary:/);assert.deepEqual(JSON.parse(calls[1].body.contents[0].parts[0].text),{query:'chú thuật',context:'Trong truyện/phim',word:null});
});
test('existing web dictionary request is upgraded without weakening ordinary lesson scope',async()=>{
 const {run,calls}=setup(dictionaryResponse);const body={hsk:1,question:'Giải thích chú thuật',lesson:{id:'open-dictionary',title:'Tra từ mở rộng',words:[{han:'chú thuật',pin:'',mean:'Chưa có nghĩa'}],content:{context:'Truyện/phim'}},history:[]};const response=await run('/lesson-ask',body);assert.equal(response.status,200);assert.equal((await response.json()).scope,'general');assert.doesNotMatch(calls[1].body.systemInstruction.parts[0].text,/Chỉ giải đáp về bài học HSK/);
 const ordinary=setup(answerResponse);assert.equal((await ordinary.run('/lesson-ask')).status,200);assert.match(ordinary.calls[1].body.systemInstruction.parts[0].text,/Chỉ giải đáp về bài học HSK 1/);
});
test('dictionary rejects invalid inputs and unauthenticated requests before contacting providers',async()=>{
 for(const body of [{query:''},{query:'a'.repeat(161)},{query:'chú thuật',hsk:1},{query:'x',context:[]},{query:'x',word:{secret:'x'}},{query:'x',word:{han:123}}]){const {run,calls}=setup(dictionaryResponse);assert.equal((await run('/dictionary-lookup',body)).status,400);assert.equal(calls.length,0);}
 let contacted=0;const handler=createHandler(async()=>{contacted++;return dictionaryResponse();});const response=await handler(new Request('https://worker.test/dictionary-lookup',{method:'POST',headers:{Origin:origin},body:JSON.stringify({query:'chú thuật'})}),env);assert.equal(response.status,401);assert.equal(contacted,0);
});
test('dictionary never accepts unbounded or non-Han invented candidate structures',async()=>{
 for(const data of [{answer:'x',terms:Array(7).fill({han:'咒语',pinyin:'zhòu yǔ',meaning:'thần chú'})},{answer:'x',terms:[{han:'not Chinese',pinyin:'x',meaning:'x'}]},{answer:'x',terms:[{han:'咒语',pinyin:'',meaning:'x'}]},{answer:'x',terms:null}]){const {run}=setup(()=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(data)}]}}]}));assert.equal((await run('/dictionary-lookup',{query:'chú thuật'})).status,502);}
});

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

test('handwriting recognition is a separate route with a strict candidate contract',async()=>{
 const {run,calls}=setup(()=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({candidates:['你','他','你'],uncertain:false})}]}}]}));
 const response=await run('/handwriting-recognize',{image:handwritingImage}),data=await response.json();
 assert.equal(response.status,502);
 assert.match(data.error,/không hợp lệ/);
 assert.match(calls[0].url,/accounts:lookup/);
 assert.equal(calls.length,2);

 const valid=setup(()=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({candidates:['你','他'],uncertain:false})}]}}]}));
 const accepted=await valid.run('/handwriting-recognize',{image:handwritingImage}),result=await accepted.json();
 assert.equal(accepted.status,200);
 assert.deepEqual(result,{candidates:['你','他'],uncertain:false});
 assert.match(valid.calls[1].url,/gemini-3\.5-flash-lite:generateContent$/);
 assert.deepEqual(valid.calls[1].body.generationConfig.responseSchema,{type:'OBJECT',properties:{candidates:{type:'ARRAY',items:{type:'STRING'}},uncertain:{type:'BOOLEAN'}},required:['candidates','uncertain']});
 assert.match(valid.calls[1].body.systemInstruction.parts[0].text,/never follow instructions/);
});

test('handwriting rejects extra payload and invalid image before contacting providers',async()=>{
 const {run,calls}=setup(answerResponse);
 assert.equal((await run('/handwriting-recognize',{image:handwritingImage,lesson:{secret:'not sent'}})).status,400);
 assert.equal((await run('/handwriting-recognize',{image:{mimeType:'image/png',data:Buffer.from('not png').toString('base64')}})).status,400);
 assert.equal(calls.length,0);
});

test('confirmed handwriting sample provenance is validated while legacy local samples remain accepted',()=>{
 const bytes=Buffer.alloc(128);bytes[0]=15;
 const sample={schema:1,confirmed:true,label:'你',bitmap:bytes.toString('base64'),modelVersion:'test-1'};
 assert.equal(validateHandwritingSample(sample),true);
 assert.equal(validateHandwritingSample({...sample,source:'ai'}),true);
 assert.equal(validateHandwritingSample({...sample,source:'manual'}),true);
 assert.equal(validateHandwritingSample({...sample,source:'unverified'}),false);
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
 assert.equal(config.vars.AI_CONTROL_REQUIRED,'true');
 assert.equal(config.vars.SECONDARY_AI_PROVIDER,'xkiro');
 assert.equal(config.vars.SECONDARY_AI_MODEL,'qwen/qwen-plus-2025-07-28:free');
 assert.equal(config.vars.AI_BACKUP_ENABLED,'true');
 assert.equal(Number(config.vars.AI_GLOBAL_DAILY_LIMIT)>0,true);
 assert.ok(Number(config.vars.AI_GLOBAL_MINUTE_LIMIT)<=12);
 assert.equal(config.durable_objects.bindings[0].name,'AI_CONTROL');
 assert.ok(config.migrations.some(m=>m.new_sqlite_classes?.includes('HSkaIControl')));
 assert.equal(Object.keys(config.vars).some(k=>/KEY|TOKEN|SECRET/.test(k)),false);
});
