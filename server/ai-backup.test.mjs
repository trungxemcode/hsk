import test from 'node:test';
import assert from 'node:assert/strict';
import {backupConfigured,requestBackupJSON} from './ai-backup.mjs';
import {buildReadingStory} from './reading-service.mjs';
const config={AI_BACKUP_ENABLED:'true',SECONDARY_AI_PROVIDER:'xkiro',SECONDARY_AI_API_KEY:'fake-test-secret-long-enough',SECONDARY_AI_MODEL:'qwen/qwen3.5-397b-a17b:free'};
test('backup is off by default and never assumes a provider from key prefix',()=>{
 assert.equal(backupConfigured({}),false);
 assert.equal(backupConfigured({...config,AI_BACKUP_ENABLED:'false'}),false);
 assert.equal(backupConfigured({...config,SECONDARY_AI_PROVIDER:'x-token-hub'}),false);
 assert.equal(backupConfigured({...config,SECONDARY_AI_MODEL:'../api?bad'}),false);
});
test('backup calls only fixed xKiro hostname and uses OpenAI-compatible JSON chat',async()=>{
 let calls=0;
 const fetchFn=async(url,init)=>{
  calls++;assert.equal(url,'https://api.xkiro.com/v1/chat/completions');
  assert.equal(init.headers.Authorization,'Bearer '+config.SECONDARY_AI_API_KEY);
  const body=JSON.parse(init.body);assert.equal(body.response_format.type,'json_object');
  assert.equal(body.model,config.SECONDARY_AI_MODEL);
  assert.ok(body.max_tokens<=3200);
  return Response.json({choices:[{message:{content:JSON.stringify({titleZh:'测试'})}}]});
 };
 assert.equal(await requestBackupJSON({fetchFn,env:{},instruction:'safe',prompt:{},signal:undefined}),null);
 assert.equal(calls,0);
 const result=await requestBackupJSON({fetchFn,env:config,instruction:'safe',prompt:{sourceContent:'source'},signal:undefined});
 assert.equal(calls,1);assert.equal(result.ok,true);assert.equal(result.data.titleZh,'测试');
 assert.equal(JSON.stringify(result).includes(config.SECONDARY_AI_API_KEY),false);
});
test('Gemini quota error can route to configured backup, but never while disabled',async()=>{
 const transcript=[
  {speaker:'小王',stageNote:'学校',hanzi:'你今天在学校学习汉语吗？',pinyin:'Nǐ jīntiān zài xuéxiào xuéxí Hànyǔ ma?',vi:'Hôm nay bạn học tiếng Trung ở trường phải không?'},
  {speaker:'小李',stageNote:'教室',hanzi:'我每天在这里学习。',pinyin:'Wǒ měitiān zài zhèlǐ xuéxí.',vi:'Ngày nào tôi cũng học ở đây.'},
  {speaker:'小王',stageNote:'课间',hanzi:'你觉得汉语难不难？',pinyin:'Nǐ juéde Hànyǔ nán bu nán?',vi:'Bạn thấy tiếng Trung khó không?'},
  {speaker:'小李',stageNote:'微笑',hanzi:'开始的时候有点难。',pinyin:'Kāishǐ de shíhou yǒudiǎn nán.',vi:'Lúc đầu hơi khó.'}
 ];
 const content={titleZh:'学习汉语',titleVi:'Học tiếng Trung',scriptMode:transcript,
 paragraphMode:[{hanzi:'他们每天都在学校学习汉语。',pinyin:'Tāmen měitiān dōu zài xuéxiào xuéxí Hànyǔ.',vi:'Họ học tiếng Trung mỗi ngày.'}],
 quiz:[1,2,3].map((i)=>({question:'他们在哪里学习汉语？',options:['学校','家里','公司'],answerIndex:0,explanationVi:'Họ học ở trường.'}))};
 let backupCalls=0;
 const fetchFn=async(url,opts)=>{
  if(url.startsWith('https://mandarinbean.com/'))return new Response('汉语学习学校汉语学习学校学习'.repeat(12));
  if(url.includes('generativelanguage.googleapis.com'))return Response.json({error:'quota'},{status:429});
  if(url.includes('api.xkiro.com')){backupCalls++;return Response.json({choices:[{message:{content:JSON.stringify(content)}}]});}
  throw Error('unexpected '+url);
 };
 const params={hsk:2,sourceId:'life-change'},model='gemini-3.5-flash-lite';
 const no=await buildReadingStory(params,{fetchFn,env:{...config,AI_BACKUP_ENABLED:'false',GEMINI_API_KEY:'fake'},model});
 assert.equal(no.status,429);assert.equal(backupCalls,0);
 const yes=await buildReadingStory(params,{fetchFn,env:{...config,GEMINI_API_KEY:'fake'},model});
 assert.equal(yes.status,200);assert.equal(backupCalls,1);
 assert.equal(yes.data.story.scriptMode.length,4);
 assert.equal(yes.data.story.quiz.length,3);
});
