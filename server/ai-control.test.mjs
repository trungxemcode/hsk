import test from 'node:test';
import assert from 'node:assert/strict';
import {HSkaIControl,controlCall,readingCacheKey} from './ai-control.mjs';

function mock(){
 const map=new Map();
 const storage={
  async get(k){return map.get(k)},
  async put(key,value){if(typeof key==='object'){for(const [k,v] of Object.entries(key))map.set(k,v)}else map.set(key,value)},
  async delete(k){map.delete(k)},
  async transaction(fn){return fn(this)}
 };
 const state={storage};
 const e={AI_GLOBAL_DAILY_LIMIT:'3',AI_GLOBAL_MINUTE_LIMIT:'3',AI_USER_DAILY_LIMIT:'3',AI_USER_READING_DAILY_LIMIT:'1'};
 const instance=new HSkaIControl(state,e);
 const environment={AI_CONTROL:{idFromName:n=>n,get:id=>({fetch:(url,init)=>instance.fetch(new Request(url,init))})},AI_CONTROL_REQUIRED:'true'};
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
