import test from 'node:test';
import assert from 'node:assert/strict';
import { QUESTION_TYPES, ATTEMPT_VERDICTS } from '../src/shared/tutor-contracts.mjs';
import { toCanonicalQuestion, gradeCanonicalSubmission } from '../src/modules/practice/question-adapter.mjs';
import { createRequire } from 'node:module';

const require=createRequire(import.meta.url);
const Profile=require('../src/modules/ai-coach/coach-profile.js');
const {TutorLoopEngine}=require('../src/modules/ai-coach/tutor-loop-engine.js');

test('PR309 canonical tutor loop blocks empty MCQ and resumes a delayed retest',()=>{
 const profile={uid:'pr309-user',targetHsk:3,vocabNodes:{},grammarNodes:{},retestQueue:[]};
 const engine=new TutorLoopEngine(profile);
 const pack={teachingCard:{title:'不 và 没',coreRuleVi:'Quá khứ dùng 没.',contrastPairs:[{wrong:'我昨天不去',right:'我昨天没去',reasonVi:'昨天 là quá khứ.'},{wrong:'我平时没去',right:'我平时不去',reasonVi:'平时 là thói quen.'}]},guidedExercises:[{id:'q-guided',type:QUESTION_TYPES.MULTIPLE_CHOICE,hsk:3,prompt:'我昨天___去。',options:['没','不','很'],correctAnswer:0,progressiveHints:['Nhìn mốc thời gian.'],explanation:'昨天 là quá khứ.'}],blindCheckExercise:{id:'q-blind',type:QUESTION_TYPES.FILL_IN_BLANK,hsk:3,prompt:'他平时___喝酒。',correctAnswer:'不',explanation:'平时 diễn tả thói quen.'}};
 const state=engine.startTutorSession({targetNodeId:'negation',targetTitle:'不 và 没',hsk:3,aiTutorPack:pack});
 assert.equal(state.stepType,'TEACHING_CARD');
 engine.proceedFromTeachingToPractice();
 const q=engine.getCurrentStepPayload().exercise;
 assert.equal(gradeCanonicalSubmission(q,'').verdict,ATTEMPT_VERDICTS.UNGRADABLE);
 assert.equal(engine.submitStepAnswer(gradeCanonicalSubmission(q,'')).outcome,'UNGRADABLE');
 assert.equal(engine.activeSession.completedAttempts.length,0);
 const correct=gradeCanonicalSubmission(q,0);
 assert.equal(engine.submitStepAnswer(correct).outcome,'ENTER_BLIND_CHECK');
 assert.equal(engine.submitStepAnswer(gradeCanonicalSubmission(engine.activeSession.blindCheckExercise,'不')).outcome,'TUTOR_LOOP_FINISHED');
 const retestEngine=new TutorLoopEngine(profile);
 const delayed=retestEngine.startTutorSession({targetNodeId:'negation',targetTitle:'不 và 没',hsk:3,delayedRetest:true,aiTutorPack:{blindCheckExercise:{id:'q-new',type:QUESTION_TYPES.FILL_IN_BLANK,hsk:3,prompt:'上周他___参加会议。',correctAnswer:'没',explanation:'上周 là quá khứ.'}}});
 assert.equal(delayed.stepType,'DELAYED_RETEST_EXERCISE');
 const restored=new TutorLoopEngine(profile);
 assert.equal(restored.getCurrentStepPayload().stepType,'DELAYED_RETEST_EXERCISE');
});

test('PR309 retest queues merge across devices and remove only mastered tickets',()=>{
 const mastered={grammarNodes:{negation:{state:Profile.MASTERY_STATES.DELAYED_MASTERED,lastAttemptAt:200}},vocabNodes:{}};
 const merged=Profile.mergeRetestQueuesAcrossDevices([
  {nodeType:'grammar',nodeId:'negation',dueAt:100,updatedAt:100},
  {nodeType:'grammar',nodeId:'ba',dueAt:150,updatedAt:150}
 ],[
  {domain:'grammar',nodeId:'negation',dueAt:100,updatedAt:110},
  {nodeType:'vocab',nodeId:'了',dueAt:120,updatedAt:120}
 ],{'grammar:negation':mastered.grammarNodes.negation});
 assert.deepEqual(merged.map(x=>`${x.nodeType}:${x.nodeId}`),['vocab:了','grammar:ba']);
});
