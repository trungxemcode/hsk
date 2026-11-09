import test from 'node:test';
import assert from 'node:assert/strict';
import {OWNER_UID} from './account-roles.mjs';
import {createHandler,HSkaIControl,personalAiGenerate} from './translator-worker-bundled.mjs';

const secret='sample-master-secret-at-least-32-characters';
const origin='https://trungxemcode.github.io';
const env={AI_PERSONAL_KEY_SECRET:secret,FIREBASE_API_KEY:'fake-firebase',QA_CACHE_ENABLED:'true'};
const records=new Map();
env.AI_CONTROL={
 idFromName:name=>name,
 get(name){
  if(!records.has(name))records.set(name,new Map());
  const data=records.get(name);
  const store={get:async k=>data.get(k),put:async(k,v)=>data.set(k,v),delete:async k=>data.delete(k)};
  store.transaction=fn=>fn(store);
  const object=new HSkaIControl({storage:store},env);
  return {fetch:(url,init)=>object.fetch(new Request(url,init))};
 }
};
const calls=[];
let personalReply='{"answer":"你好"}';
const worker=createHandler(async (url,init)=>{
 if(String(url).includes('identitytoolkit')){
  const token=JSON.parse(init.body).idToken;
  const claims=JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString());
  return Response.json({users:[{localId:claims.sub}]});
 }
 calls.push({url,headers:init.headers,body:JSON.parse(init.body),redirect:init.redirect});
 if(String(url).includes('generativelanguage'))return Response.json({candidates:[{content:{parts:[{text:'{"answer":"你好"}'}]}}]});
 return Response.json({choices:[{message:{content:personalReply}}]});
});
const request=(uid,path,body,workerEnv=env)=>{
 const claims={aud:'hsk-flashcards-44631',iss:'https://securetoken.google.com/hsk-flashcards-44631',sub:uid,exp:Math.floor(Date.now()/1000)+3600};
 const token='header.'+Buffer.from(JSON.stringify(claims)).toString('base64url')+'.signature';
 return worker(new Request('https://worker.test'+path,{method:'POST',headers:{Origin:origin,Authorization:'Bearer '+token},body:JSON.stringify(body)}),workerEnv);
};
const settingsPath='/personal-ai-settings';
const question={question:'Xin chào',hsk:1,lesson:{id:'ai-qa',title:'AI',words:[],content:{mode:'ai-qa',learning_snapshot:{}}},history:[]};

test('settings are private by verified UID and FOSTA handles chat without a shared key',async()=>{
 const key='fake-provider-api-key';
 const saved=await request('alice',settingsPath,{op:'save',settings:{provider:'fosta',model:'gpt-6.1-sol',enabled:true,apiKey:key}});
 assert.equal(saved.status,200);
 assert.deepEqual(await saved.json(),{configured:true,enabled:true,provider:'fosta',model:'gpt-6.1-sol'});
 assert.doesNotMatch(JSON.stringify([...records.get('personal-ai:alice')]),new RegExp(key));
 assert.deepEqual(await (await request('bob',settingsPath,{op:'read'})).json(),{configured:false,enabled:false});
 assert.equal((await request('bob','/lesson-ask',question)).status,503);
 const response=await request('alice','/lesson-ask',question);
 assert.equal(response.status,200);
 assert.equal((await response.json()).answer,'你好');
 assert.equal(calls.length,1);
 assert.equal(calls[0].url,'https://codex.fosta.app/v1/chat/completions');
 assert.equal(calls[0].headers.Authorization,'Bearer '+key);
 assert.equal(calls[0].body.model,'gpt-6.1-sol');
 assert.equal(calls[0].body.stream,false);
 assert.equal(calls[0].redirect,'manual');
 // An enabled private key must never silently fall back to a shared provider
 // when the master encryption secret is unavailable after configuration.
 const secretBefore=env.AI_PERSONAL_KEY_SECRET,callsBefore=calls.length;
 delete env.AI_PERSONAL_KEY_SECRET;
 try{
  assert.equal((await request('alice','/lesson-ask',question)).status,503);
  assert.equal(calls.length,callsBefore);
 }finally{env.AI_PERSONAL_KEY_SECRET=secretBefore;}
 assert.equal((await request('alice',settingsPath,{op:'save',settings:{provider:'fosta',model:'gpt-6-luna',enabled:false}})).status,200);
 assert.equal((await request('alice','/lesson-ask',question)).status,503);
 assert.deepEqual(await (await request('alice',settingsPath,{op:'remove'})).json(),{configured:false,enabled:false});
});

test('settings save muse-cookie and route /lesson-ask to Muse AI provider',async()=>{
 const key='Bearer meta-token-secret-123';
 const saved=await request('musetester',settingsPath,{op:'save',settings:{provider:'muse-cookie',model:'muse-spark',enabled:true,apiKey:key}});
 assert.equal(saved.status,200);
 assert.deepEqual(await saved.json(),{configured:true,enabled:true,provider:'muse-cookie',model:'muse-spark'});
 const response=await request('musetester','/lesson-ask',question);
 assert.equal(response.status,200);
 const data=await response.json();
 assert.equal(data.answer,'你好');
 assert.match(calls.at(-1).url,/api\.meta\.ai\/v1\/chat\/completions/);
 assert.equal(calls.at(-1).headers.Authorization,'Bearer meta-token-secret-123');
});
test('multi-provider personal AI preserves independent credentials and routes dynamically',async()=>{
 const uid='multiprov-user';
 // 1. Save Fosta
 const fostaKey='fosta-secret-key-12345';
 const resFosta=await request(uid,settingsPath,{op:'save',settings:{provider:'fosta',model:'gpt-6.1-sol',enabled:true,apiKey:fostaKey}});
 assert.equal(resFosta.status,200);

 // 2. Save Muse without wiping Fosta
 const museKey='Bearer muse-meta-secret-999';
 const resMuse=await request(uid,settingsPath,{op:'save',settings:{provider:'muse-cookie',model:'muse-spark',enabled:true,apiKey:museKey}});
 assert.equal(resMuse.status,200);

 // 3. Read settings shows both providers in providers map
 const readRes=await request(uid,settingsPath,{op:'read'});
 assert.equal(readRes.status,200);
 const readData=await readRes.json();
 assert.equal(readData.configured,true);
 assert.ok(readData.providers);
 assert.equal(readData.providers['fosta']?.configured,true);
 assert.equal(readData.providers['fosta']?.model,'gpt-6.1-sol');
 assert.equal(readData.providers['muse-cookie']?.configured,true);
 assert.equal(readData.providers['muse-cookie']?.model,'muse-spark');

 // 4. Route with aiProvider: 'personal:fosta' uses Fosta endpoint and key
 const testEnv={...env,ADMIN_UIDS:uid};
 const fostaReply=await request(uid,'/lesson-ask',{...question,aiProvider:'personal:fosta'},testEnv);
 assert.equal(fostaReply.status,200);
 assert.equal(calls.at(-1).url,'https://codex.fosta.app/v1/chat/completions');
 assert.equal(calls.at(-1).headers.Authorization,'Bearer '+fostaKey);

 // 5. Route with aiProvider: 'personal:muse-cookie' uses Muse endpoint and token
 const museReply=await request(uid,'/lesson-ask',{...question,question:'Câu hỏi khác cho Muse',aiProvider:'personal:muse-cookie'},testEnv);
 assert.equal(museReply.status,200);
 assert.match(calls.at(-1).url,/api\.meta\.ai\/v1\/chat\/completions/);
 assert.equal(calls.at(-1).headers.Authorization,'Bearer muse-meta-secret-999');

 // 6. Scoped remove removes only Fosta, keeping Muse active
 const removeFosta=await request(uid,settingsPath,{op:'remove',settings:{provider:'fosta'}});
 assert.equal(removeFosta.status,200);
 const afterRemove=await request(uid,settingsPath,{op:'read'});
 const afterData=await afterRemove.json();
 assert.equal(afterData.configured,true);
 assert.equal(afterData.providers['fosta'],undefined);
 assert.equal(afterData.providers['muse-cookie']?.configured,true);
});

test('fosta reasoning effort splits model and passes reasoning_effort parameter',async()=>{
 const uid='fosta-effort-user';
 const key='fosta-effort-test-key';
 const saved=await request(uid,settingsPath,{op:'save',settings:{provider:'fosta',model:'gpt-6-luna:xhigh',enabled:true,apiKey:key}});
 assert.equal(saved.status,200);
 const testEnv={...env,ADMIN_UIDS:uid};
 const reply=await request(uid,'/lesson-ask',{...question,aiProvider:'personal:fosta',aiModel:'gpt-6-luna:xhigh'},testEnv);
 assert.equal(reply.status,200);
 assert.equal(calls.at(-1).url,'https://codex.fosta.app/v1/chat/completions');
 assert.equal(calls.at(-1).body.model,'gpt-6-luna');
 assert.equal(calls.at(-1).body.reasoning_effort,'xhigh');
});

test('the provider adapters use their own authentication and fixed endpoints',async()=>{
 const payload={systemInstruction:{parts:[{text:'guide'}]},contents:[{role:'user',parts:[{text:'hi'}]}]};
 for(const [provider,endpoint,header] of [
  ['openai','https://api.openai.com/v1/chat/completions','Authorization'],
  ['deepseek','https://api.deepseek.com/chat/completions','Authorization'],
  ['claude','https://api.anthropic.com/v1/messages','x-api-key'],
  ['gemini','https://generativelanguage.googleapis.com/v1beta/models/example:generateContent','x-goog-api-key']
 ]){
  const result=await personalAiGenerate({provider,model:'example',apiKey:'test-key'},payload,async(url,init)=>{
   assert.equal(url,endpoint);
   assert.match(init.headers[header],/test-key$/);
   assert.equal(init.redirect,'manual');
   return Response.json({content:[{type:'text',text:'{}'}],choices:[{message:{content:'{}'}}]});
  });
  assert.equal(result.status,200);
 }
});

test('chat model selection uses verified account roles and keeps the selected Gemini model',async()=>{
 const shared={...env,GEMINI_API_KEY:'fake-shared-gemini',AI_ACCOUNT_ROLES_ENABLED:'true',
  AI_MODEL_FAILOVER_ENABLED:'true',AI_GEMINI_FALLBACK_MODELS:'gemini-3.6-flash'};
 const owner=OWNER_UID;
 const send=(uid,thinking)=>request(uid,'/lesson-ask',{...question,thinking},shared);
 const before=calls.length;
 assert.equal((await send('regular-chat','high')).status,403);
 assert.equal((await send('regular-chat','medium')).status,403);
 assert.equal((await send('regular-chat','gemini-3.8-flash')).status,400);
 assert.equal(calls.length,before);
 assert.equal((await send('regular-chat')).status,200);
 assert.match(calls.at(-1).url,/gemini-3\.1-flash-lite:generateContent$/);
 assert.equal((await request(owner,'/admin/account-role',{uid:'vip-chat',role:'vip'},shared)).status,200);
 assert.equal((await send('vip-chat','medium')).status,200);
 assert.match(calls.at(-1).url,/gemini-3\.5-flash:generateContent$/);
 assert.equal((await send(owner,'high')).status,200);
 assert.match(calls.at(-1).url,/gemini-3\.8-flash:generateContent$/);
});

test('invalid upstream response body is handled separately from connection failures',async()=>{
 const payload={systemInstruction:{parts:[{text:'guide'}]},contents:[]};
 const result=await personalAiGenerate({provider:'fosta',model:'gpt-6-luna',apiKey:'fake'},payload,async()=>new Response('<html>error</html>'));
 assert.equal(result.status,502);
});

test('Cloudflare-compatible redirect handling never forwards the API key',async()=>{
 let requests=0;
 const payload={systemInstruction:{parts:[{text:'guide'}]},contents:[]};
 const result=await personalAiGenerate({provider:'fosta',model:'gpt-6-luna',apiKey:'fake'},payload,async(url,init)=>{
  requests++;
  assert.equal(init.redirect,'manual');
  return new Response(null,{status:307,headers:{Location:'https://elsewhere.test/'}});
 });
 assert.equal(result.status,502);
 assert.equal(requests,1);
});

test('personal chat returns plain text and fenced JSON through the authenticated Worker route',async()=>{
 for(const [index,[content,answer]] of [
  ['Xin chào! Tôi có thể giúp bạn học tiếng Trung.','Xin chào! Tôi có thể giúp bạn học tiếng Trung.'],
  ['Kết quả:\n```json\n{"answer":"Bạn đang học HSK 1.","primaryNodeKey":"level"}\n```','Bạn đang học HSK 1.'],
  ['{"answer":','']
 ].entries()){
  const uid='reply-format-test-'+index;
  const saved=await request(uid,settingsPath,{op:'save',settings:{provider:'fosta',model:'gpt-6-luna',enabled:true,apiKey:'fake-provider-api-key'}});
  assert.equal(saved.status,200);
  personalReply=content;
  try{
   const response=await request(uid,'/lesson-ask',question);
   assert.equal(response.status,answer?200:502);
   if(answer)assert.equal((await response.json()).answer,answer);
  }finally{personalReply='{"answer":"你好"}';}
 }
});

test('personal AI synchronizes for lesson chat, coach review, and wrong answer explanation',async()=>{
 const uid='sync-ai-tester';
 const saved=await request(uid,settingsPath,{op:'save',settings:{provider:'fosta',model:'gpt-6-luna:high',enabled:true,apiKey:'fake-fosta-sync-key'}});
 assert.equal(saved.status,200);

 const callsBefore=calls.length;

 // 1. Lesson chat (giải thích từ vựng trong bài)
 const lessonChatBody={
  question:'Từ này dùng thế nào?',
  hsk:2,
  lesson:{id:'standard-2-1',title:'Bài 1',words:[],content:{context:'你好'}},
  history:[]
 };
 const lessonChatRes=await request(uid,'/lesson-ask',lessonChatBody);
 assert.equal(lessonChatRes.status,200);
 assert.equal((await lessonChatRes.json()).answer,'你好');
 assert.equal(calls.at(-1).url,'https://codex.fosta.app/v1/chat/completions');
 assert.equal(calls.at(-1).body.model,'gpt-6-luna');
 assert.equal(calls.at(-1).body.reasoning_effort,'high');

 // 2. Coach review (chấm / giải thích trắc nghiệm)
 const coachReviewBody={
  question:'Giải thích vì sao đúng sai',
  hsk:2,
  lesson:{id:'coach-review',title:'Ôn tập HSK 2',words:[],content:{observations:[]}},
  history:[]
 };
 const coachRes=await request(uid,'/lesson-ask',coachReviewBody);
 assert.equal(coachRes.status,200);
 assert.equal((await coachRes.json()).answer,'你好');
 assert.equal(calls.at(-1).url,'https://codex.fosta.app/v1/chat/completions');

 // 3. Wrong answer explanation (giải thích câu sai)
 const wrongExamBody={
  question:'Giải thích câu sai này',
  hsk:2,
  lesson:{id:'wrong-explain-q1',title:'Giải thích câu sai',words:[],content:{mode:'wrong-answer-explanation'}},
  history:[]
 };
 const wrongRes=await request(uid,'/lesson-ask',wrongExamBody);
 assert.equal(wrongRes.status,200);
 assert.equal((await wrongRes.json()).answer,'你好');
 assert.equal(calls.at(-1).url,'https://codex.fosta.app/v1/chat/completions');

 assert.equal(calls.length,callsBefore+3);
});

test('personal AI returning plain text for lesson chat is cleanly unwrapped into answer',async()=>{
 const uid='plain-text-lesson-tester';
 await request(uid,settingsPath,{op:'save',settings:{provider:'fosta',model:'gpt-6-luna',enabled:true,apiKey:'fake-fosta-key'}});
 personalReply='Từ "你好" dùng để chào hỏi trang trọng trong tiếng Trung.';
 try{
  const res=await request(uid,'/lesson-ask',{
   question:'Giải thích từ 你好',
   hsk:1,
   lesson:{id:'standard-1-1',title:'Bài 1',words:[],content:{}},
   history:[]
  });
  assert.equal(res.status,200);
  assert.equal((await res.json()).answer,'Từ "你好" dùng để chào hỏi trang trọng trong tiếng Trung.');
 }finally{personalReply='{"answer":"你好"}';}
});
