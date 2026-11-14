import test from 'node:test';
import assert from 'node:assert/strict';
import '../src/modules/translation/sentence-review-core.js';
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
const teacherResponse=()=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({answer:JSON.stringify({lesson_plan:{scenario_description:'Bạn đang gọi món.',target_vocab:[{word:'菜单',pinyin:'càidān',meaning:'thực đơn'},{word:'推荐',pinyin:'tuījiàn',meaning:'giới thiệu'}],target_grammar:{pattern:'虽然…但是…',explanation:'Mặc dù… nhưng…',example:'虽然很贵，但是很好。'}},evaluation:null,teacher_turn:{chinese:'请看菜单，你想吃什么？',pinyin:'Qǐng kàn càidān, nǐ xiǎng chī shénme?',vietnamese_translation:'Hãy xem thực đơn, bạn muốn ăn gì?',current_mission_hint:'Dùng 菜单 và trả lời một món bạn muốn gọi.'},lesson_summary:null})})}]}}]});
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
test('smart dictionary lookup forwards phonetic hints and grounded local candidates',async()=>{
 const response=()=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({answer:'Khớp âm bồi Việt.',terms:[{han:'怎么办',pinyin:'zěn me bàn',meaning:'làm sao đây',match_type:'âm bồi Việt',match_reason:'Ứng viên cục bộ khớp gần âm',usage_note:'Khẩu ngữ'}],refinement_chips:['Dùng khi hỏi cách xử lý','Dùng trong hội thoại']})}]}}]});
 const {run,calls}=setup(response);const r=await run('/dictionary-lookup',{query:'chửng mơ pan',context:'làm sao đây',phonetic_hints:[['zheng','cheng'],['mo'],['ban']],local_candidates:[{han:'怎么办',pinyin:'zěn me bàn',meaning:'làm sao đây'}],excluded_terms:['怎么']});assert.equal(r.status,200);const data=await r.json();assert.equal(data.refinement_chips.length,2);assert.equal(data.terms[0].match_type,'âm bồi Việt');const sent=JSON.parse(calls[1].body.contents[0].parts[0].text);assert.deepEqual(sent.phonetic_hints,[['zheng','cheng'],['mo'],['ban']]);assert.equal(sent.local_candidates[0].han,'怎么办');assert.deepEqual(sent.excluded_terms,['怎么']);
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

test('AI Q&A mode carries bounded progress context and enforces the 99% boundary',async()=>{
 const qa=setup(answerResponse),snapshot={masteryBoundary:{reached:true,near:false,threshold:{minAttempts:20}},practice:{attempts:24,accuracy:.99},activity:{studyDaysLast30:5}};
 const response=await qa.run('/lesson-ask',{hsk:4,question:'Đánh giá lộ trình của tôi',lesson:{id:'ai-qa',title:'Hỏi đáp AI',words:[],content:{mode:'ai-qa',learning_snapshot:snapshot}},history:[]});
 assert.equal(response.status,200);const request=qa.calls[1].body;assert.match(request.systemInstruction.parts[0].text,/RANH GIỚI 99%/);assert.match(request.systemInstruction.parts[0].text,/không bới lỗi vụn vặt/);assert.equal(request.contents.at(-1).parts[0].text,'Đánh giá lộ trình của tôi');assert.equal(request.generationConfig.temperature,.25);assert.equal(request.generationConfig.maxOutputTokens,1800);
});
test('AI teacher mode uses a proactive HSK roleplay instruction and preserves chat history',async()=>{
 const teacher=setup(answerResponse);
 const response=await teacher.run('/lesson-ask',{hsk:3,question:'Bắt đầu buổi học',lesson:{id:'ai-teacher',title:'Giảng viên AI',words:[],content:{mode:'ai-teacher',topic:'Giao tiếp du lịch'}},history:[{role:'user',text:'Tôi muốn luyện gọi món.'},{role:'assistant',text:'我们来练习在餐厅点菜。'}]});
 assert.equal(response.status,200);
 const request=teacher.calls[1].body;
 assert.match(request.systemInstruction.parts[0].text,/roleplay/);
 assert.match(request.systemInstruction.parts[0].text,/chủ động dẫn dắt buổi học/);
 assert.match(request.systemInstruction.parts[0].text,/cấp HSK 3/);
 assert.deepEqual(request.contents.map(m=>m.role),['user','model','user']);
 assert.equal(request.contents[0].parts[0].text,'Tôi muốn luyện gọi món.');
});

test('AI teacher mode returns a bounded lesson plan and advances session state',async()=>{
 const teacher=setup(teacherResponse),body={hsk:3,question:'Bắt đầu buổi học',lesson:{id:'ai-teacher',title:'Giảng viên AI',words:[],content:{mode:'ai-teacher',topic:'Gọi món',session_state:{turn:0,max_turns:6,target_vocab:[],used_vocab:[],recent_mistakes:[]}}},history:[]};
 const response=await teacher.run('/lesson-ask',body),data=await response.json();
 assert.equal(response.status,200);assert.equal(data.mode,'ai-teacher');assert.equal(data.teacher.lesson_plan.target_vocab.length,2);assert.equal(data.session_state.turn,1);assert.deepEqual(data.session_state.target_vocab,['菜单','推荐']);assert.equal(data.session_state.is_finished,false);
});
test('unified practice generation validates and returns only safe exercise shapes',async()=>{
 const provider=setup(()=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({answer:JSON.stringify({items:[
  {type:'multiple_choice',skill:'grammar',topicId:'ba_bei',prompt:'Chọn câu đúng với 把。',options:['我把书看完了。','我书把看完了。','把我书看了完。','我看把书完了。'],correctAnswer:0,explanation:'把 đưa tân ngữ lên trước động từ và kết quả。'},
  {type:'reorder',skill:'writing',topicId:'word_order',prompt:'Xếp câu。',segments:['我','昨天','去了','学校'],correctAnswer:'我昨天去了学校',acceptedAnswers:[],explanation:'Trạng ngữ thời gian đứng trước động từ。'},
  {type:'fill_in_blank',skill:'reading',topicId:'time',prompt:'我___去学校。',correctAnswer:'明天',explanation:'明天 chỉ ngày mai。'},
  {type:'multiple_choice',prompt:'Sai vì thiếu lựa chọn',options:['A'],correctAnswer:0,explanation:'x'}]})})}]}}]}));
 const body={hsk:3,question:'Tạo bài luyện',lesson:{id:'unified-practice-generator',title:'Ngân hàng bài luyện',words:[],content:{mode:'unified-practice-gen',hsk:3,count:4,focusRules:['把字句'],recentMistakeSamples:['我书把看完了'],adaptivePlan:[],lessonWords:[],requestedTypes:['multiple_choice','reorder','fill_in_blank']}},history:[]};
 const response=await provider.run('/lesson-ask',body),data=await response.json();assert.equal(response.status,200);assert.equal(data.mode,'unified-practice-gen');assert.equal(data.items.length,3);assert.equal(data.items[1].segments.join(''),data.items[1].correctAnswer);assert.match(provider.calls[1].body.systemInstruction.parts[0].text,/biên soạn viên bài luyện HSK 3/);
});
test('micro tutor pack mode enforces teach-before-practice structure and epistemic limits',async()=>{
 const pack={teachingCard:{title:'不 và 没',coreRuleVi:'不 nói thói quen hoặc ý định; 没 nói việc chưa xảy ra.',contrastPairs:[{wrong:'❌ 我不去了昨天。',right:'✅ 我昨天没去。',reasonVi:'昨天 là việc đã xảy ra hoặc chưa xảy ra trong quá khứ nên dùng 没。'},{wrong:'❌ 我没想喝茶。',right:'✅ 我不想喝茶。',reasonVi:'Ý định hoặc mong muốn dùng 不。'}]},guidedExercises:[{difficulty:'easy',type:'multiple_choice',prompt:'我昨天___去学校。',options:['不','没','很','也'],correctAnswer:1,progressiveHints:['Tìm mốc thời gian。','Việc chưa xảy ra trong quá khứ dùng gì？'],explanation:'昨天 là mốc quá khứ; câu phủ định hành động chưa xảy ra dùng 没。'},{difficulty:'medium',type:'fill_in_blank',prompt:'我___想买这个。',correctAnswer:'不',acceptedAnswers:['不'],progressiveHints:['Đây là ý muốn。','Ý định phủ định dùng 不。'],explanation:'想 biểu thị ý định nên dùng 不 để phủ định。'}],blindCheckExercise:{difficulty:'blind_check',type:'fill_in_blank',prompt:'他___吃过中国菜。',correctAnswer:'没',acceptedAnswers:['没','没有'],progressiveHints:[],explanation:'吃过 nói trải nghiệm; phủ định trải nghiệm dùng 没有 hoặc 没。'}};
 const provider=setup(()=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({answer:JSON.stringify(pack)})}]}}]}));
 const body={hsk:3,question:'Tạo gói dạy',lesson:{id:'micro-tutor',title:'Gói gia sư',words:[],content:{mode:'micro-tutor-pack',targetRuleTitle:'不 và 没',mistakeSample:'他不去过北京。',contextTheme:'travel_transport'}},history:[]};
 const response=await provider.run('/lesson-ask',body),data=await response.json();assert.equal(response.status,200);assert.equal(data.mode,'micro-tutor-pack');assert.equal(data.pack.guidedExercises.length,2);assert.equal(data.pack.blindCheckExercise.progressiveHints.length,0);assert.match(provider.calls[1].body.systemInstruction.parts[0].text,/KHÔNG chấm phát âm/);
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

test('word recovery accepts approximate readings, clarification and confirmed comparison',async()=>{
 for(const query of ['ni','ni3','nìa','So sánh 泥 và 你']){
  const {run,calls}=setup(dictionaryResponse);const context=JSON.stringify({meaningHint:'đất ướt',previousSuggestions:['你']});
  const r=await run('/dictionary-lookup',{query,context});assert.equal(r.status,200);
  const sent=calls.at(-1).body;assert.match(sent.systemInstruction.parts[0].text,/NHẬN DIỆN TỪ QUÊN CHỮ/);assert.match(sent.systemInstruction.parts[0].text,/confirmed-comparison/);assert.equal(JSON.parse(sent.contents[0].parts[0].text).context,context);
 }
});

test('sentence review normalizes structured responses and rejects unanchored prose',async()=>{
 const question='昨天，我讨论了这个话题跟同学们三个小时。大家应该多锻炼身体。';
 const body={hsk:6,question,history:[],lesson:{id:'sentence-editor',title:'Sửa câu tiếng Trung',words:[],content:{mode:'sentence-editor'}}};
 const review={summary:'Đặt cụm chỉ người trước động từ.',suggestions:[{kind:'fix',original:'讨论了这个话题跟同学们',replacement:'跟同学们讨论了这个话题',reason:'Đặt 跟同学们 trước 讨论.'}]};
 for(const content of [
  JSON.stringify(review),
  JSON.stringify({answer:JSON.stringify(review)}),
  '```json\n'+JSON.stringify(review)+'\n```'
 ]){
  const {run,calls}=setup(()=>Response.json({modelVersion:'gemini-test-version',candidates:[{finishReason:'STOP',content:{parts:[{text:content}]}}]}));
  const response=await run('/lesson-ask',body);
  assert.equal(response.status,200);
  const result=await response.json();
  assert.deepEqual(result.sentenceReview,globalThis.HSKSentenceReview.normalize(review,question));
  assert.deepEqual(JSON.parse(result.answer),result.sentenceReview);
  assert.equal(calls[1].body.contents[0].parts[0].text,question);
  assert.equal(calls[1].body.generationConfig.maxOutputTokens,1800);
  assert.deepEqual(calls[1].body.generationConfig.responseSchema.required,['summary','suggestions']);
  assert.deepEqual(calls[1].body.generationConfig.responseSchema.properties.suggestions.items.required,['kind','original','replacement','reason']);
  assert.equal(response.headers.get('X-HSK-AI-Provider'),'gemini');
  assert.deepEqual(result.aiSource,{provider:'gemini',model:'gemini-test-version'});
 }
 const prose='Cụm 跟同学们 nên đứng trước 讨论.';
 const {run}=setup(()=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:prose}]}}]}));
 const response=await run('/lesson-ask',body);
 assert.equal(response.status,502);
});

test('lesson-ask AI QA cleanly unwraps XML/JSX wrapper and unquoted JSON.stringify response',async()=>{
 const payloadText=`<text preserveWhitespace>{JSON.stringify({primaryNodeKey:"topic:m-mw7zah08-1w4fm2z",nodeLabel:"Các cách chào hỏi tiếng Trung",coreRulesSummary:"你好 (nǐ hǎo) là cách chào hỏi thông dụng trong tiếng Trung.",answer:"你好! (Nǐ hǎo!) — Xin chào! 😊\\n\\nRất vui được gặp bạn!",explanationStrategyUsed:"Chào hỏi tự nhiên",optionalMicroCheck:null,suggestedQuestions:[{type:"decision_guide",text:"Khi nào dùng 你好 và 您好?"},{type:"context_shift",text:"Buổi chiều chào bằng tiếng Trung thế nào?"}],memoryCandidates:[]})}</text>`;
 const {run}=setup(()=>Response.json({modelVersion:'gemini-test-version',candidates:[{finishReason:'STOP',content:{parts:[{text:payloadText}]}}]}));
 const snapshot={masteryBoundary:{reached:true,near:false,threshold:{minAttempts:20}},practice:{attempts:24,accuracy:.99},activity:{studyDaysLast30:5}};
 const body={...bodies['/lesson-ask'],lesson:{id:'lesson-1',title:'Bài 1',words:[],content:{mode:'ai-qa',learning_snapshot:snapshot}}};
 const response=await run('/lesson-ask',body);
 assert.equal(response.status,200);
 const data=await response.json();
 assert.match(data.answer,/^你好! \(Nǐ hǎo!\) — Xin chào!/);
 assert.equal(data.answer.includes('<text'),false);
 assert.equal(data.answer.includes('JSON.stringify'),false);
 assert.equal(data.primaryNodeKey,'topic:m-mw7zah08-1w4fm2z');
 assert.equal(data.nodeLabel,'Các cách chào hỏi tiếng Trung');
 assert.equal(data.suggestedQuestions.length,2);
 assert.equal(data.suggestedQuestions[0].kind,'decision_guide');
});

test('sentence-editor supports 5000 chars and rejects >5000 chars; sentence-ai-detect returns normalized analysis',async()=>{
 const longBase='昨天，我讨论了这个话题跟同学们三个小时。'.repeat(55);
 assert.ok(longBase.length>1000&&longBase.length<=5000);
 const longReview={summary:'Đặt cụm chỉ người trước động từ.',suggestions:[{kind:'fix',original:'讨论了这个话题跟同学们',replacement:'跟同学们讨论了这个话题',reason:'Đặt 跟同学们 trước 讨论.'}]};
 const {run,calls}=setup(()=>Response.json({modelVersion:'gemini-test-version',candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(longReview)}]}}]}));
 const okLong=await run('/lesson-ask',{hsk:6,question:longBase,history:[],lesson:{id:'sentence-editor',title:'Sửa câu tiếng Trung',words:[],content:{mode:'sentence-editor'}}});
 assert.equal(okLong.status,200);
 const okData=await okLong.json();
 assert.equal(okData.sentenceReview.suggestions.length,1);
 assert.equal(calls.at(-1).body.generationConfig.maxOutputTokens,4096);

 const tooLong=await run('/lesson-ask',{hsk:6,question:'我'.repeat(5001),history:[],lesson:{id:'sentence-editor',title:'Sửa câu tiếng Trung',words:[],content:{mode:'sentence-editor'}}});
 assert.equal(tooLong.status,400);

 const aiSample='综上所述，随着科技的发展，人工智能在日常生活中发挥着重要作用，因此我们需要理性看待。';
 const detectPayload={aiProbability:79,verdict:'ai',confidence:'Cao',summary:'Có mật độ cụm chuyển đoạn chuẩn hóa kiểu AI cao.',metrics:{naturalness:24,templateDensity:84,burstiness:31},signals:['Xuất hiện cụm 综上所述 và 发挥着重要作用.'],flaggedSpans:[{text:'综上所述',reason:'Từ chuyển đoạn kiểu bài luận AI.',humanizeTip:'Đổi sang cách nói tự nhiên hơn.'}]};
 const detectSetup=setup(()=>Response.json({modelVersion:'gemini-test-version',candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(detectPayload)}]}}]}));
 const detectRes=await detectSetup.run('/lesson-ask',{hsk:6,question:aiSample,history:[],lesson:{id:'sentence-editor',title:'Kiểm tra dấu hiệu AI tiếng Trung',words:[],content:{mode:'sentence-ai-detect'}}});
 assert.equal(detectRes.status,200);
 const detectData=await detectRes.json();
 assert.equal(detectData.aiDetection.aiProbability,79);
 assert.equal(detectData.aiDetection.verdict,'ai');
 assert.equal(detectData.aiDetection.flaggedSpans[0].text,'综上所述');
});

