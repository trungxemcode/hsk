import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const storage=new Map();
globalThis.localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,String(value))};
const P=require('../src/modules/ai-coach/coach-profile.js');

test('remedial teacher plan prioritizes repeated due weaknesses and schedules the next review',()=>{
 const now=Date.now();
 storage.set('hsk-coach-unified-weaknesses-v1',JSON.stringify({items:{
  grammar:{title:'Trật tự từ',hsk:3,count:5,lastMistakeSample:'我明天去北京',updatedAt:now-8*86400000},
  vocab:{title:'Từ chỉ số lượng',hsk:3,count:1,lastMistakeSample:'三个学生',updatedAt:now-2*86400000}
 }}));
 const result=P.buildRemedialTopicForAiTeacher(3);
 assert.equal(result.focusRules[0],'Trật tự từ');
 assert.equal(result.adaptivePlan[0].due,true);
 assert.equal(result.adaptivePlan[0].priority>result.adaptivePlan[1].priority,true);
 assert.match(result.adaptivePlan[0].nextReviewAt,/T/);
});
