import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {handleProfileSyncRequest} from './translator-worker-bundled.mjs';

const require=createRequire(import.meta.url);
const Practice=require('../src/modules/practice/practice-generator-core.js');
const Profile=require('../src/modules/ai-coach/coach-profile.js');
const storageMap=new Map();globalThis.localStorage={getItem:key=>storageMap.get(key)||null,setItem:(key,value)=>storageMap.set(key,String(value)),removeItem:key=>storageMap.delete(key)};

test('PR307 practice wiring returns an object and remains iterable for old exam callers',async()=>{
 const result=await Practice.synthesizeAdaptiveExercises({uid:'runtime-user',token:'firebase-token',endpoint:'https://worker.example/lesson-ask',fetchFn:async()=>new Response(JSON.stringify({items:[{type:'multiple_choice',topicId:'comparison',prompt:'今天 ___ 昨天冷得多。',options:['比','把','被','从'],correctAnswer:0,explanation:'Đáp án đúng là 比 vì đây là câu so sánh.'}]}),{status:200,headers:{'Content-Type':'application/json'}})});
 assert.equal(result.aborted,false);assert.equal(result.items.length,1);assert.equal([...result].length,1);assert.equal(result.items[0].topicId,'comparison');
});

test('PR307 delayed mastery always enforces the real 20-hour gate',()=>{
 const profile=Profile.loadUnifiedProfile('runtime-delayed-'+Date.now());
 const first=Profile.recordTutorAttempt(profile,{nodeType:'grammar',nodeId:'negation_bu_mei',isCorrect:true,hintsUsed:0,isBlindCheckAtSessionEnd:true,contextSignature:'day-1'});
 const second=Profile.recordTutorAttempt(profile,{nodeType:'grammar',nodeId:'negation_bu_mei',isCorrect:true,hintsUsed:0,isDelayedVerification:true,contextSignature:'day-2'});
 assert.equal(first.node.state,Profile.MASTERY_STATES.UNASSISTED_IMMEDIATE);assert.equal(second.node.state,Profile.MASTERY_STATES.UNASSISTED_IMMEDIATE);
});

test('PR307 profile sync responds to CORS preflight and authenticated POST',async()=>{
 const url='https://worker.example/api/profile-sync',preflight=await handleProfileSyncRequest(new Request(url,{method:'OPTIONS',headers:{Origin:'https://trungxemcode.github.io'}}),{},async()=>null);
 assert.equal(preflight.status,204);assert.equal(preflight.headers.get('Access-Control-Allow-Origin'),'https://trungxemcode.github.io');
 const map=new Map(),post=await handleProfileSyncRequest(new Request(url,{method:'POST',headers:{Origin:'https://trungxemcode.github.io',Authorization:'Bearer token','Content-Type':'application/json'},body:JSON.stringify({uid:'runtime-user',delta:{targetHsk:3,grammarNodes:[]}})}),{USER_PROFILES_KV:{get:key=>map.get(key)||null,put:(key,value)=>{map.set(key,value);}}},async token=>token==='token'?{uid:'runtime-user'}:null);
 assert.equal(post.status,200);assert.equal(post.headers.get('Access-Control-Allow-Origin'),'https://trungxemcode.github.io');assert.equal((await post.json()).synced,true);
});

test('PR307 guest weakness data is adopted after login',()=>{
 const uid='runtime-adopt-'+Date.now(),guest=Profile.loadUserWeaknessStore('guest');guest.items={mistake:{id:'mistake',title:'mistake',hsk:3,count:1,sources:['test'],updatedAt:Date.now(),lastMistakeSample:'我不去'}};localStorage.setItem('hsk-coach-unified-weaknesses-v2:guest',JSON.stringify(guest));
 Profile.loadUnifiedProfile(uid);const adopted=Profile.loadUserWeaknessStore(uid);assert.equal(adopted.items.mistake.count,1);assert.equal(localStorage.getItem('hsk-coach-unified-weaknesses-v2:guest'),null);
});
