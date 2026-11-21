import test from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';const require=createRequire(import.meta.url),S=require('../src/modules/account/study-sync-core.js'),A=require('../src/modules/account/account-core.js');
const day='2026-10-15',plan={version:1,id:'goal',target:5,created:1,end:100000000,keys:['a','b'],journal:{}};const capture=s=>A.capture({}, {},{[S.KEY]:JSON.stringify(s)},100,'migration').items;
test('two devices merge study time, distinct learned words and activity without overwriting each other',()=>{
 let one=S.savePlan(S.empty('u'),plan,'phone'),two=S.savePlan(S.empty('u'),plan,'desktop');let p=S.plan(one);p.journal[day]={seconds:60,new:['a'],attempts:2,correct:1};one=S.savePlan(one,p,'phone');p=S.plan(two);p.journal[day]={seconds:90,new:['a','b'],attempts:3,correct:2};two=S.savePlan(two,p,'desktop');one=S.recordActivity(one,'phone',Date.UTC(2026,9,15));two=S.recordActivity(two,'desktop',Date.UTC(2026,9,15,1));
 const merged=A.merge(capture(one),capture(two)),state=JSON.parse(A.materialize(merged,'u')[S.KEY]),r=S.plan(state).journal[day];assert.equal(r.seconds,150);assert.equal(r.attempts,5);assert.deepEqual(r.new.sort(),['a','b']);assert.equal(Object.keys(S.activity(state).days).length,1);assert.equal(S.activity(state).hours.reduce((a,b)=>a+b),2);assert.deepEqual(A.merge(merged,merged),merged);
 const again=S.savePlan(state,S.plan(state),'third');assert.equal(S.plan(again).journal[day].seconds,150,'saving unchanged totals must add no time');
});
test('legacy migration keeps old evidence, deduplicates baseline snapshots and isolates account owners',()=>{
 const old={...plan,journal:{[day]:{seconds:120,new:['a'],attempts:2}}},activity={days:{[day]:4},hours:Array(24).fill(1)};let s=S.seed('u',old,activity,null);s=S.seed('u',old,activity,s);assert.equal(S.plan(s).journal[day].seconds,120);assert.equal(S.activity(s).days[day],4);assert.equal(S.plan(S.seed('different',null,null,s)),null);
 const changed={...old,journal:{[day]:{seconds:150,new:['a','b'],attempts:3}}};s=S.seed('u',changed,activity,s);assert.equal(S.plan(s).journal[day].seconds,150,'overlapping old snapshots use max, not a sum');assert.equal(S.plan(s).journal[day].new.length,2);
 const p=S.plan(s);p.journal[day].seconds+=10;s=S.savePlan(s,p,'new-device');assert.equal(S.plan(s).journal[day].seconds,160);
});
test('plans split large word lists below Firestore payload limit and preserve old data stores',()=>{
 const p={...plan,keys:Array.from({length:10000},(_,i)=>'5|测试词语'+i+'|ce shi ci yu'),journal:{[day]:{new:Array.from({length:10000},(_,i)=>'word'+i)}}};const s=S.savePlan(S.empty('u'),p,'device'),records=capture(s);for(const item of Object.values(records))assert.ok(JSON.stringify(item.value).length<100000);const storage=A.materialize(records,'u');assert.deepEqual(S.plan(JSON.parse(storage[S.KEY])).keys,p.keys);assert.equal(S.plan(JSON.parse(storage[S.KEY])).journal[day].new.length,10000);
 const legacy=A.importGuest({}, {'hsk-flashcards-progress-v1':JSON.stringify({words:{one:{status:'known'}}})},10,'old').items;assert.equal(JSON.parse(A.materialize(A.merge(legacy,records),'u')['hsk-flashcards-progress-v1']).words.one.status,'known');assert.equal(S.plan(JSON.parse(A.materialize({},'other')[S.KEY])),null);
});
test('journal saves cannot revive an older goal or overwrite unrelated remote schedule fields',()=>{
 const first=S.savePlan(S.empty('u'),plan,'one'),before={[S.KEY]:JSON.stringify(first)};let records=capture(first);records['study-plan:current'].value.end=200000000;const next={...first,plan:{...first.plan,lastAttempt:200}};const result=A.capture(records,before,{[S.KEY]:JSON.stringify(next)},300,'phone');assert.equal(result.items['study-plan:current'].value.end,200000000);assert.equal(result.items['study-plan:current'].value.lastAttempt,200);
 records['study-plan:current'].value.id='new-goal';const stale=A.capture(records,before,{[S.KEY]:JSON.stringify(next)},400,'phone');assert.equal(stale.items['study-plan:current'].value.id,'new-goal');
 for(const id of ['exam:q','exam-draft:q','open-word:q','study-plan:current','study-custom-design:standard-3-01','study-activity:day'])assert.equal(A.supportedId(id),true);assert.equal(A.supportedId('secret:unknown'),false);
});
test('customLesson splits each aiLessonDesign into its own Firestore item below 100 KB and reassembles cleanly',()=>{
 const C=require('../src/modules/lessons/lesson-custom-core.js');
 const makeDesign=(lessonId,idx)=>({
  lessonId,
  coachIntroVi:'Giáo án AI chi tiết bài '+idx+' · '+'tối ưu lộ trình '.repeat(20),
  customPrompt:'Chia phiên ngắn 5-10p cho bài '+idx,
  aiProvider:'gemini',
  aiModel:'gemini-3.5-flash',
  updatedAt:1000+idx,
  sessions:Array.from({length:4},(_,sIdx)=>({
   label:`Phiên ${sIdx+1}`,
   minutes:15,
   goalVi:'Mục tiêu phiên '+(sIdx+1)+' · '+'luyện tập '.repeat(12),
   steps:[
    {id:`v_${sIdx}`,skill:'vocab',action:'vocab_cards',minutes:8,titleVi:'Từ vựng trọng tâm',detailVi:'Học nhanh '.repeat(15),coachTipVi:'Đọc to '.repeat(15)},
    {id:`g_${sIdx}`,skill:'grammar',action:'grammar_focus',minutes:7,titleVi:'Ngữ pháp bài',detailVi:'Luyện câu '.repeat(15),coachTipVi:'Chú ý cấu trúc '.repeat(15)}
   ]
  }))
 });
 let prof=C.createProfile({hsk:3,minutes:60,days:5,style:'spare_time',goal:'exam',aiGenerated:true},1000);
 const designs={};
 for(let i=1;i<=10;i++){const id=`standard-3-0${i}`;designs[id]=makeDesign(id,i);}
 const state=S.saveCustomLesson(S.empty('u'),{...prof,aiLessonDesigns:designs});
 const flat=S.flatten(state);
 assert.ok(flat['study-plan:custom-lesson'],'base profile record exists');
 assert.equal(flat['study-plan:custom-lesson'].aiLessonDesigns,undefined,'heavy aiLessonDesigns must not be embedded in base sync item');
 assert.ok(JSON.stringify(flat['study-plan:custom-lesson']).length<100000,'base custom lesson stays well under 100 KB Firestore rule');
 for(let i=1;i<=10;i++){
  const key=`study-custom-design:standard-3-0${i}`;
  assert.ok(flat[key],`independent sync document exists for ${key}`);
  assert.ok(JSON.stringify(flat[key]).length<100000,`${key} stays under 100 KB Firestore rule`);
 }
 const records=capture(state);
 for(const item of Object.values(records))assert.ok(JSON.stringify(item.value).length<100000);
 const restored=JSON.parse(A.materialize(records,'u')[S.KEY]);
 assert.equal(Object.keys(restored.customLesson.aiLessonDesigns||{}).length,10,'all 10 independent designs reassemble cleanly');
 // Rotating an old design out of localStorage must not delete it on cloud while customLesson still exists
 const trimmedLocal=S.saveCustomLesson(state,{...prof,aiLessonDesigns:{'standard-3-010':designs['standard-3-010']}});
 const afterTrim=A.capture(records,{[S.KEY]:JSON.stringify(state)},{[S.KEY]:JSON.stringify(trimmedLocal)},2000,'phone');
 assert.equal(afterTrim.items['study-custom-design:standard-3-01'].deleted,false,'LRU local trim preserves remote design');
});
