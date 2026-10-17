import test from 'node:test';
import assert from 'node:assert/strict';
import {HSkaIControl,controlCall,readingCacheKey} from './ai-control.mjs';

function mock(overrides={}){
 const map=new Map();
 const storage={
  async get(k){return map.get(k)},
  async put(key,value){if(typeof key==='object'){for(const [k,v] of Object.entries(key))map.set(k,v)}else map.set(key,value)},
  async delete(k){map.delete(k)},
  async transaction(fn){return fn(this)}
 };
 const state={storage};
 const e={AI_GLOBAL_DAILY_LIMIT:'3',AI_GLOBAL_MINUTE_LIMIT:'3',AI_USER_DAILY_LIMIT:'3',AI_USER_READING_DAILY_LIMIT:'1',...overrides};
 const instance=new HSkaIControl(state,e);
 const environment={...e,AI_CONTROL:{idFromName:n=>n,get:id=>({fetch:(url,init)=>instance.fetch(new Request(url,init))})},AI_CONTROL_REQUIRED:'true'};
 return {instance,map,environment};
}
test('budget rejects missing binding when explicitly required',async()=>{
 await assert.rejects(()=>controlCall({AI_CONTROL_REQUIRED:'true'},'reserve',{uid:'alice',route:'reading'}),/required/);
 assert.equal(await controlCall({},'reserve',{uid:'alice',route:'reading'}),null);
});
test('atomic budget gate blocks repeated reading, global daily and other routes',async()=>{
 const {environment}=mock();
 const a=await controlCall(environment,'reserve',{uid:'a',route:'reading'});assert.equal(a.allowed,true);
 const b=await controlCall(environment,'reserve',{uid:'a',route:'reading'});assert.equal(b.allowed,false);assert.equal(b.reason,'user-reading-daily');
 assert.equal((await controlCall(environment,'reserve',{uid:'a',route:'translate'})).allowed,true);
 assert.equal((await controlCall(environment,'reserve',{uid:'b',route:'reading'})).allowed,true);
 const c=await controlCall(environment,'reserve',{uid:'c',route:'translate'});assert.equal(c.allowed,false);assert.equal(c.reason,'global-daily');
});
test('cache is shared, locked while generating and reject oversize payload',async()=>{
 const {environment}=mock(),key='v2_abcdefghi12345678';
 assert.equal((await controlCall(environment,'get',{key})).hit,false);
 assert.equal((await controlCall(environment,'lock',{key})).acquired,true);
 assert.equal((await controlCall(environment,'lock',{key})).acquired,false);
 const article={id:'some-hsk-story',hsk:3,titleZh:'今天',scriptMode:[{hanzi:'今天好'}],quiz:[]};
 assert.equal((await controlCall(environment,'put',{key,story:article})).ok,true);
 const cached=await controlCall(environment,'get',{key});
 assert.equal(cached.hit,true);assert.deepEqual(cached.story,article);
 assert.equal((await controlCall(environment,'lock',{key})).acquired,true);
 assert.equal((await controlCall(environment,'unlock',{key})).ok,true);
 assert.equal((await controlCall(environment,'put',{key,story:{text:'x'.repeat(30010)}})).status,400);
});
test('reading cache fingerprints include lesson topic and source, no ID token',async()=>{
 const body={hsk:3,lessonId:'3-01',sourceId:'ask-leave',topic:'Công việc',angle:'xin phép',lessonWords:[{han:'请假',mean:'xin nghỉ'}]};
 const k=await readingCacheKey(body);
 assert.match(k,/^v3_[a-f0-9]{64}$/);
 const dialogue=await readingCacheKey({...body,genre:'dialogue'});
 assert.notEqual(dialogue,k,'legacy results cannot bypass the new quality gate');
 for(const genre of ['story','news','email','explainer'])assert.notEqual(await readingCacheKey({...body,genre}),dialogue);
 assert.equal(await readingCacheKey({...body,uid:'someone',idToken:'secret'}),k);
 assert.notEqual(await readingCacheKey({...body,angle:'bàn kế hoạch'}),k);
 assert.notEqual(await readingCacheKey({...body,hsk:5}),k);
 assert.notEqual(await readingCacheKey({...body,lessonWords:[]}),k);
});

test('regular accounts get independent 35-query and 15-reading daily allowances',async()=>{
 const {environment}=mock({AI_GLOBAL_DAILY_LIMIT:'10000',AI_GLOBAL_MINUTE_LIMIT:'1000',AI_USER_DAILY_LIMIT:'50',AI_USER_QUERY_DAILY_LIMIT:'35',AI_USER_READING_DAILY_LIMIT:'15'});
 for(let i=0;i<35;i++)assert.equal((await controlCall(environment,'reserve',{uid:'regular',route:'ask'})).allowed,true);
 assert.equal((await controlCall(environment,'reserve',{uid:'regular',route:'ask'})).reason,'user-query-daily');
 for(let i=0;i<15;i++)assert.equal((await controlCall(environment,'reserve',{uid:'regular',route:'reading'})).allowed,true);
 assert.equal((await controlCall(environment,'reserve',{uid:'regular',route:'reading'})).reason,'user-daily');
 for(let i=0;i<15;i++)assert.equal((await controlCall(environment,'reserve',{uid:'other',route:'reading'})).allowed,true);
 assert.equal((await controlCall(environment,'reserve',{uid:'other',route:'reading'})).reason,'user-reading-daily');
 assert.equal((await controlCall(environment,'reserve',{uid:'other',route:'translate'})).allowed,true);
});
test('configured admin bypasses all budget caps without consuming normal-user counters',async()=>{
 const {environment,map}=mock({ADMIN_UIDS:'owner',AI_GLOBAL_DAILY_LIMIT:'1',AI_GLOBAL_MINUTE_LIMIT:'1'});
 assert.equal((await controlCall(environment,'reserve',{uid:'regular',route:'ask'})).allowed,true);
 const before=JSON.stringify([...map]);
 for(let i=0;i<60;i++)assert.deepEqual(await controlCall(environment,'reserve',{uid:'owner',route:i%2?'reading':'ask'}),{status:200,allowed:true,unlimited:true});
 assert.equal(JSON.stringify([...map]),before);
 assert.equal((await controlCall(environment,'reserve',{uid:'attacker',route:'ask',admin:true})).allowed,false);
});
test('Worker admin exemption uses verified account UID, ignoring forged token roles',async()=>{
 const {createHandler}=await import('./translator-worker-bundled.mjs');
 const uid='owner',project='hsk-flashcards-44631';let verifiedUid=uid;
 const configured={...mock({ADMIN_UIDS:uid,AI_GLOBAL_DAILY_LIMIT:'1',AI_GLOBAL_MINUTE_LIMIT:'1',AI_USER_DAILY_LIMIT:'1'}).environment,GEMINI_API_KEY:'fake',FIREBASE_API_KEY:'fake'};
 const handler=createHandler(async u=>u.includes('identitytoolkit')?Response.json({users:[{localId:verifiedUid}]}):Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({answer:'Xin chào',terms:[]})}]}}]}));
 const req=sub=>{const claims={aud:project,iss:'https://securetoken.google.com/'+project,sub,admin:true,exp:Math.floor(Date.now()/1000)+3600};return new Request('https://worker.test/dictionary-lookup',{method:'POST',headers:{Origin:'https://trungxemcode.github.io',Authorization:'Bearer h.'+Buffer.from(JSON.stringify(claims)).toString('base64url')+'.s'},body:JSON.stringify({query:'xin chào'})});};
 for(let i=0;i<3;i++)assert.equal((await handler(req(uid),configured)).status,200,'admin bypasses budget and cooldown');
 verifiedUid='regular';assert.equal((await handler(req(uid),configured)).status,401,'claimed owner UID must match Firebase account');
 assert.equal((await handler(req('regular'),configured)).status,200);
 assert.equal((await handler(req('regular'),configured)).status,429,'forged admin claim does not bypass cooldown or quotas');
});
