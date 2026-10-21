import test from 'node:test';
import assert from 'node:assert/strict';
import {buildReadingStory,checkReadingBody,chooseReadingSource,validReadingStory,READING_SOURCES,extractReadingText} from './reading-service.mjs';
import {createHandler} from './translator-worker-bundled.mjs';
import {createRequire} from 'node:module';
const Client=createRequire(import.meta.url)('../src/modules/reading/real-reading-variety-core.js');
test('client bounds lesson vocabulary before sending without weakening server validation',()=>{
 const raw=[{han:'普通',mean:'Nghĩa rất dài '.repeat(40)},{han:'长'.repeat(13),mean:'quá dài'},{han:'abc',mean:'không phải chữ Hán'},{han:'普通',mean:'trùng'},{han:'学习',mean:'học'}];
 assert.equal(checkReadingBody({hsk:3,lessonWords:raw}),false);
 const normalized=Client.requestWords(raw);assert.equal(normalized.length,2);assert.equal(normalized[0].mean.length,80);
 assert.equal(checkReadingBody({hsk:3,lessonWords:normalized}),true);
 assert.equal(raw[0].mean.length>80,true);assert.equal(Client.requestWords(Array(40).fill(null)).length,0);
});
const sourceText='年轻人今天早上在办公室讨论买早饭和日常工作。有些人很忙，不会每天在家里吃早餐。'.repeat(8);
const story={
 titleZh:'今天早上的早餐',titleVi:'Bữa sáng hôm nay',
 scriptMode:[
  {speaker:'小明',stageNote:'在办公室',hanzi:'你今天早上吃饭了吗？',pinyin:'Nǐ jīntiān zǎoshang chīfàn le ma?',vi:'Sáng nay bạn đã ăn chưa?'},
  {speaker:'小红',stageNote:'拿着咖啡',hanzi:'我没有吃，我今天很忙。',pinyin:'Wǒ méiyǒu chī, wǒ jīntiān hěn máng.',vi:'Tôi chưa ăn, hôm nay tôi bận.'},
  {speaker:'小明',stageNote:'打开袋子',hanzi:'我买了两个包子，你要吃吗？',pinyin:'Wǒ mǎi le liǎng gè bāozi, nǐ yào chī ma?',vi:'Tôi mua hai bánh bao, bạn ăn không?'},
  {speaker:'小红',stageNote:'笑了',hanzi:'谢谢你，我们一起吃吧！',pinyin:'Xièxie nǐ, wǒmen yìqǐ chī ba!',vi:'Cảm ơn bạn, chúng ta cùng ăn nhé!'}
 ],
 paragraphMode:[{hanzi:'今天早上他们在办公室一起吃了早餐。',pinyin:'Jīntiān zǎoshang tāmen zài bàngōngshì yìqǐ chī le zǎocān.',vi:'Sáng nay họ ăn sáng cùng nhau ở văn phòng.'}],
 quiz:[
  {question:'小红今天早上怎么了？',options:['她很忙','她去旅行','她在医院'],answerIndex:0,explanationVi:'Cô ấy nói hôm nay rất bận.'},
  {question:'小明买了什么？',options:['两本书','两个包子','一张票'],answerIndex:1,explanationVi:'Anh ấy mua hai chiếc bánh bao.'},
  {question:'他们最后做什么？',options:['一起吃饭','去看电影','坐火车'],answerIndex:0,explanationVi:'Cuối cùng họ ăn sáng cùng nhau.'}
 ]
};
const origin='https://trungxemcode.github.io',env={GEMINI_API_KEY:'test-gemini',FIREBASE_API_KEY:'test-firebase'};
const jwt='head.'+Buffer.from(JSON.stringify({aud:'hsk-flashcards-44631',iss:'https://securetoken.google.com/hsk-flashcards-44631',sub:'tester',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')+'.sig';
const valid={hsk:3,lessonId:'hsk-3-01',sourceId:'ask-leave',angle:'gặp đồng nghiệp',lessonWords:[{han:'吃饭',mean:'ăn cơm'}],excludeIds:[],excludeSources:[]};
const providerResponse=()=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(story)}]}}]});
function provider({sourceOkay=true,ai=providerResponse}={}){
 const calls=[];const fetchFn=async(url,options={})=>{
  calls.push({url:String(url),options});
  if(String(url).includes('identitytoolkit.googleapis.com'))return Response.json({users:[{localId:'tester'}]});
  if(String(url)==='https://mandarinbean.com/ask-for-leave/')return sourceOkay?new Response(sourceText):new Response('Unavailable',{status:503});
  if(String(url).includes('generativelanguage.googleapis.com'))return ai();
  throw Error('Unexpected external request '+url);
 };
 return {calls,fetchFn};
}
test('extracts only the simplified Chinese post, not the menu or pinyin',()=>{
 const ruby=(han,trad,pin)=>'<ruby class="mb-tooltip"><span class="si">'+han+'</span><span class="tr">'+trad+'</span><rt>'+pin+'</rt></ruby>';
 const html='<html><nav>FAKE MENU: injected</nav><div class="elementor-widget-theme-post-content"><div class="elementor-widget-container"><p>'+ruby('今天','今天','jīntiān')+ruby('吃饭','吃飯','chīfàn')+'。</p><p>'+ruby('我喜欢','我喜歡','wǒ xǐhuan')+'喝茶。</p></div></div><footer>fake answer</footer></html>';
 const out=extractReadingText(html);
 assert.match(out,/今天吃饭。/);assert.match(out,/我喜欢喝茶/);
 assert.doesNotMatch(out,/吃飯|jīntiān|FAKE MENU|fake answer/);
 assert.equal(extractReadingText('<html><script>evil()</script></html>'),'');
});
test('rejects untrusted source IDs, malicious request shape and incomplete HSK',()=>{
 assert.equal(checkReadingBody(valid),true);
 for(const changes of [{hsk:8},{sourceId:'https://internal.test/'},{url:'http://localhost:3000/'},{lessonWords:[{han:'hello',mean:'test'}]},{excludeIds:Array(50).fill('x')},{lessonId:'../private'}]){
  assert.equal(checkReadingBody({...valid,...changes}),false);
 }
 assert.equal(READING_SOURCES.every(x=>new URL(x.url).protocol==='https:'),true);
 assert.equal(chooseReadingSource({hsk:3,sourceId:'ask-leave'},()=>0).id,'ask-leave');
 assert.equal(chooseReadingSource({hsk:1,sourceId:'ask-leave'},()=>0),null);
});
test('validates completeness of script/paragraph/questions',()=>{
 assert.equal(validReadingStory(story),true);
 assert.equal(validReadingStory({...story,scriptMode:story.scriptMode.slice(0,2)}),false);
 assert.equal(validReadingStory({...story,quiz:story.quiz.slice(0,2)}),false);
 assert.equal(validReadingStory({...story,scriptMode:[{...story.scriptMode[0],hanzi:'nothing'},...story.scriptMode.slice(1)]}),false);
});
test('extracts only verified public source and generates a labeled educational adaptation',async()=>{
 const {calls,fetchFn}=provider();
 const x=await buildReadingStory(valid,{fetchFn,env,model:'gemini-3.5-flash-lite',random:()=>0});
 assert.equal(x.status,200);
 assert.equal(x.data.story.hsk,3);
 assert.equal(x.data.story.source.url,'https://mandarinbean.com/ask-for-leave/');
 assert.equal(x.data.story.status,'adapted');
 assert.match(x.data.story.attribution,/biên soạn|chuyển thể/);
 assert.equal(x.data.story.quiz.length,3);
 assert.equal(calls.length,2);
 assert.equal(calls[0].url,'https://mandarinbean.com/ask-for-leave/');
 const body=JSON.parse(calls[1].options.body);
 assert.ok(body.contents[0].parts[0].text.includes('吃饭'));
 assert.ok(body.generationConfig.maxOutputTokens<=5000);
});
test('unreachable source fails without AI hallucination',async()=>{
 const {calls,fetchFn}=provider({sourceOkay:false});
 const r=await buildReadingStory(valid,{fetchFn,env,model:'gemini-3.5-flash-lite'});
 assert.equal(r.status,502);assert.equal(calls.length,1);assert.match(r.data.error,/nguồn/i);
});
test('malformed AI output is rejected',async()=>{
 const {fetchFn}=provider({ai:()=>Response.json({candidates:[{content:{parts:[{text:'{"titleZh":"wrong"}'}]},finishReason:'STOP'}]})});
 const r=await buildReadingStory(valid,{fetchFn,env,model:'gemini-3.5-flash-lite'});
 assert.equal(r.status,502);
});
test('worker enforces Firebase authentication before fetching a source',async()=>{
 let count=0;const handler=createHandler(async()=>{count++;throw Error('Must not fetch')});
 const r=await handler(new Request('https://worker.test/reading-next',{method:'POST',headers:{Origin:origin},body:JSON.stringify(valid)}),env);
 assert.equal(r.status,401);assert.equal(count,0);
});
test('worker enables authenticated reading and applies per-user cooldown',async()=>{
 const {fetchFn,calls}=provider(),handler=createHandler(fetchFn);
 const make=()=>new Request('https://worker.test/reading-next',{method:'POST',headers:{Origin:origin,Authorization:'Bearer '+jwt,'Content-Type':'application/json'},body:JSON.stringify(valid)});
 const first=await handler(make(),env);assert.equal(first.status,200,JSON.stringify(await first.clone().json()));
 const answer=await first.json();assert.equal(answer.story.scriptMode.length,4);
 assert.ok(calls.some(x=>x.url==='https://mandarinbean.com/ask-for-leave/'));
 assert.equal((await handler(make(),env)).status,429);
});

const prose={...story,scriptMode:[],paragraphMode:[
 {hanzi:'今天早上，小王来到学校。他先复习昨天学习的汉字，然后和朋友一起讨论新的课程。上课前，他把不明白的问题写在本子上。',pinyin:'Jīntiān zǎoshang, Xiǎo Wáng láidào xuéxiào. Tā xiān fùxí zuótiān xuéxí de Hànzì, ránhòu hé péngyou yìqǐ tǎolùn xīn de kèchéng. Shàngkè qián, tā bǎ bù míngbai de wèntí xiě zài běnzi shàng.',vi:'Sáng nay Tiểu Vương đến trường, ôn chữ Hán rồi trao đổi với bạn về bài học mới. Trước giờ học, cậu ghi những điều chưa hiểu vào vở.'},
 {hanzi:'老师让大家先读课文，再回答问题。小王发现，昨天不懂的几个词今天已经能看懂了。下课后，他决定每天用十分钟复习，不再只在考试前学习。',pinyin:'Lǎoshī ràng dàjiā xiān dú kèwén, zài huídá wèntí. Xiǎo Wáng fāxiàn, zuótiān bù dǒng de jǐ ge cí jīntiān yǐjīng néng kàndǒng le. Xiàkè hòu, tā juédìng měitiān yòng shí fēnzhōng fùxí, bú zài zhǐ zài kǎoshì qián xuéxí.',vi:'Thầy yêu cầu đọc trước rồi trả lời. Tiểu Vương đã hiểu vài từ hôm qua chưa hiểu. Cậu quyết định ôn mười phút mỗi ngày thay vì chỉ học trước kỳ thi.'}
]};
test('genres are validated and prose is not forced into a dialogue',async()=>{
 for(const genre of ['dialogue','story','news','email','explainer'])assert.ok(checkReadingBody({...valid,genre}));
 for(const genre of ['__proto__','toString','fake',{},42])assert.equal(checkReadingBody({...valid,genre}),false);
 for(const genre of ['story','news','email','explainer']){
  const {fetchFn,calls}=provider({ai:()=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(prose)}]}}]})});
  const r=await buildReadingStory({...valid,genre},{fetchFn,env,model:'test'});assert.equal(r.status,200);assert.equal(r.data.story.genre,genre);assert.equal(r.data.story.scriptMode.length,0);
  const body=JSON.parse(calls[1].options.body),prompt=JSON.parse(body.contents[0].parts[0].text);assert.equal(prompt.genre,genre);assert.match(body.systemInstruction.parts[0].text,/pinyin|Vietnamese/);assert.ok(prompt.targetChineseCharacters[0]<prompt.targetChineseCharacters[1]);
 }
 assert.equal(validReadingStory(prose,{genre:'dialogue',quality:true}),false);
 assert.equal(validReadingStory({...prose,quiz:[story.quiz[0],story.quiz[0],story.quiz[0]]},{genre:'news',quality:true}),false);
 assert.equal(validReadingStory({...prose,paragraphMode:[prose.paragraphMode[0],prose.paragraphMode[0]]},{genre:'news',quality:true}),false);
 assert.equal(validReadingStory({...prose,quiz:[{...story.quiz[0],options:['trùng','trùng','khác']},...story.quiz.slice(1)]},{genre:'news',quality:true}),false);
 assert.equal(validReadingStory({...prose,paragraphMode:prose.paragraphMode.map(x=>({...x,hanzi:'我读书。'}))},{genre:'news',hsk:6,quality:true}),false);
 assert.equal(validReadingStory(prose,{genre:'news',hsk:8,quality:true}),false);
});
test('only verified source text is reused; each call still generates a complete new story',async()=>{
 const {fetchFn,calls}=provider(),sourceCache=new Map(),timings=[];
 const run=()=>buildReadingStory(valid,{fetchFn,env,model:'gemini-3.5-flash-lite',sourceCache,onTiming:e=>timings.push(e)});
 const first=await run(),second=await run();
 assert.equal(first.status,200);assert.equal(second.status,200);assert.notEqual(first.data.story.id,second.data.story.id);
 assert.equal(calls.filter(c=>c.url.includes('mandarinbean')).length,1);
 assert.equal(calls.filter(c=>c.url.includes('generativelanguage')).length,2);
 assert.deepEqual(timings.map(e=>e.cached),[false,true]);
 const config=JSON.parse(calls[1].options.body).generationConfig;
 assert.equal(config.maxOutputTokens,3200);assert.equal(second.data.story.quiz.length,3);
 sourceCache.get('ask-leave').expiresAt=0;await run();assert.equal(calls.filter(c=>c.url.includes('mandarinbean')).length,2);
 const failed=provider({sourceOkay:false}),badCache=new Map();
 assert.equal((await buildReadingStory(valid,{fetchFn:failed.fetchFn,env,model:'test',sourceCache:badCache})).status,502);assert.equal(badCache.size,0);
});
