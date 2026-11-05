import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const storage=new Map();
globalThis.localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,String(value))};
const P=require('../src/modules/ai-coach/coach-profile.js');
const {TutorLoopEngine}=require('../src/modules/ai-coach/tutor-loop-engine.js');
const G=require('../src/modules/practice/practice-generator-core.js');
const Planner=require('../src/modules/planner/planner-core.js');

test('mastery profile separates assisted, immediate and delayed mastery',()=>{
 const profile=P.loadUnifiedProfile('mastery-test');
 let result=P.recordTutorAttempt(profile,{nodeId:'negation_bu_mei',title:'不 và 没',isCorrect:true,hintsUsed:1,justViewedExplanation:true,contextSignature:'dining'});
 assert.equal(result.node.state,P.MASTERY_STATES.ASSISTED_CORRECT);assert.ok(result.node.masteryScore<=.45);
 result=P.recordTutorAttempt(profile,{nodeId:'negation_bu_mei',title:'不 và 没',isCorrect:true,isBlindCheckAtSessionEnd:true,contextSignature:'dining'});
 assert.equal(result.node.state,P.MASTERY_STATES.UNASSISTED_IMMEDIATE);assert.equal(profile.retestQueue.length,1);
 result=P.recordTutorAttempt(profile,{nodeId:'negation_bu_mei',isCorrect:true,isDelayedVerification:true,nowOverride:Date.now()+P.DELAYED_RETEST_INTERVAL_MS,contextSignature:'travel'});
 assert.equal(result.node.state,P.MASTERY_STATES.DELAYED_MASTERED);assert.equal(result.node.masteryScore,1);assert.equal(profile.retestQueue.length,0);
});

test('tutor loop diagnoses unknown vocabulary before assigning grammar blame and blocks hints at blind check',()=>{
 const profile=P.loadUnifiedProfile('loop-test'),engine=new TutorLoopEngine(profile);
 const diagnosis=engine.diagnoseMistake({skill:'listening',topicId:'negation_bu_mei',prompt:'他还没去学校。',words:['还没','学校']},'不');
 assert.equal(diagnosis.diagnosisStatus,'NEEDS_DIAGNOSTIC_PROBE');
 const first=engine.startTutorSession({targetNodeId:'negation_bu_mei',targetTitle:'不 và 没',aiTutorPack:{teachingCard:{coreRuleVi:'Dùng 不 cho thói quen, 没 cho việc chưa xảy ra.'},guidedExercises:[{progressiveHints:['Tìm mốc thời gian','Nhớ công thức 不/没'] }],blindCheckExercise:{prompt:'他___去过北京。',type:'fill_in_blank',correctAnswer:'没'}}});
 assert.equal(first.stepType,'TEACHING_CARD');engine.proceedFromTeachingToPractice();assert.equal(engine.unlockNextHint().hintsUsed,1);assert.equal(engine.submitStepAnswer(false).outcome,'SCAFFOLD_RETRY');engine.activeSession.phase='BLIND_CHECK';assert.equal(engine.unlockNextHint().allowed,false);
});

test('content gate rejects ambiguous negation and planner changes the next context',()=>{
 assert.equal(G.validateUnambiguousAnswer({type:'multiple_choice',prompt:'他___去学校。',options:['不','没','很','也']}).valid,false);
 assert.equal(G.validateUnambiguousAnswer({type:'multiple_choice',prompt:'他昨天___去学校。',options:['不','没','很','也']}).valid,true);
 const profile={grammarNodes:{g:{id:'g',title:'不 và 没',state:P.MASTERY_STATES.EXPOSED,lastContextSignature:'daily_life'}}};
 const next=Planner.adjustNextLearningStepAfterRetest(profile,'g',false);assert.equal(next.action,'FALLBACK_CONSOLIDATE');assert.notEqual(next.nextContextTheme,'daily_life');
});
