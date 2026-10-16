import test from 'node:test';
import assert from 'node:assert/strict';
import {buildReadingStory,checkReadingBody,chooseReadingSource,validReadingStory,READING_SOURCES} from './reading-service.mjs';
import {createHandler} from './translator-worker-bundled.mjs';
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
const valid={hsk:3,lessonId:'hsk-3-01',sourceId:'breakfast',angle:'gặp đồng nghiệp',lessonWords:[{han:'吃饭',mean:'ăn cơm'}],excludeIds:[],excludeSources:[]};
const providerResponse=()=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(story)}]}}]});
function provider({sourceOkay=true,ai=providerResponse}={}){
 const calls=[];const fetchFn=async(url,options={})=>{
  calls.push({url:String(url),options});
  if(String(url).includes('identitytoolkit.googleapis.com'))return Response.json({users:[{localId:'tester'}]});
  if(String(url).startsWith('https://r.jina.ai/'))return sourceOkay?new Response(sourceText):new Response('Unavailable',{status:503});
  if(String(url).includes('generativelanguage.googleapis.com'))return ai();
  throw Error('Unexpected external request '+url);
 };
 return {calls,fetchFn};
}
test('rejects untrusted source IDs, malicious request shape and incomplete HSK',()=>{
 assert.equal(checkReadingBody(valid),true);
 for(const changes of [{hsk:8},{sourceId:'https://internal.test/'},{url:'http://localhost:3000/'},{lessonWords:[{han:'hello',mean:'test'}]},{excludeIds:Array(50).fill('x')},{lessonId:'../private'}]){
  assert.equal(checkReadingBody({...valid,...changes}),false);
 }
 assert.equal(READING_SOURCES.every(x=>new URL(x.url).protocol==='https:'),true);
 assert.equal(chooseReadingSource({hsk:3,sourceId:'breakfast'},()=>0).id,'breakfast');
 assert.equal(chooseReadingSource({hsk:1,sourceId:'breakfast'},()=>0),null);
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
 assert.equal(x.data.story.source.url,'https://www.36kr.com/p/1470282839229576');
 assert.equal(x.data.story.status,'adapted');
 assert.match(x.data.story.attribution,/chuyển thể/);
 assert.equal(x.data.story.quiz.length,3);
 assert.equal(calls.length,2);
 assert.match(calls[0].url,/^https:\/\/r\.jina\.ai\/https:\/\/www\.36kr\.com/);
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
 assert.ok(calls.some(x=>x.url.startsWith('https://r.jina.ai/')));
 assert.equal((await handler(make(),env)).status,429);
});
