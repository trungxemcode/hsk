import test from 'node:test';
import assert from 'node:assert/strict';
import { QUESTION_TYPES, ATTEMPT_VERDICTS, ContractValidationError, computeQuestionContentFingerprint } from '../src/shared/tutor-contracts.mjs';
import { toCanonicalQuestion, gradeCanonicalSubmission } from '../src/modules/practice/question-adapter.mjs';
import { createRequire } from 'node:module';

const require=createRequire(import.meta.url);
const Profile=require('../src/modules/ai-coach/coach-profile.js');

test('canonical question adapter rejects empty MCQ submissions and accepts alternative answers',()=>{
 const mcq=toCanonicalQuestion({id:'contract-mcq',type:QUESTION_TYPES.MULTIPLE_CHOICE,hsk:3,topicId:'negation',prompt:'他昨天___去。',options:['没','不','别'],correctAnswer:0,explanation:'昨天表示过去，用没。'});
 assert.equal(gradeCanonicalSubmission(mcq,'').verdict,ATTEMPT_VERDICTS.UNGRADABLE);
 const fill=toCanonicalQuestion({id:'contract-fill',type:QUESTION_TYPES.FILL_IN_BLANK,hsk:3,topicId:'complement',prompt:'来不及了，___。',correctAnswer:'赶不上',acceptedAnswers:['来不及'],explanation:'两个答案都表示来不及。'});
 assert.equal(gradeCanonicalSubmission(fill,' 来不及 ').verdict,ATTEMPT_VERDICTS.CORRECT);
 assert.match(computeQuestionContentFingerprint(fill.prompt,fill.acceptedAnswers),/^cfp_/);
});

test('evidence profile enforces 20-hour gate, new content and event idempotency',()=>{
 const profile={uid:'contract-user',targetHsk:3,vocabNodes:{},grammarNodes:{},retestQueue:[]},base=1_710_000_000_000;
 const question=(eventId,questionId,time,fp,delayed=false)=>({eventId,uid:profile.uid,questionId,knowledgeNode:{domain:'grammar',nodeId:'negation',label:'不/没'},verdict:ATTEMPT_VERDICTS.CORRECT,assistance:{hintsOpened:0,viewedExplanationBeforeAttempt:false,isDelayedRetestAttempt:delayed},timestamp:time,contextDescriptor:{contentFingerprint:fp}});
 assert.equal(Profile.applyAttemptEvidenceToProfile(profile,question('e1','q1',base,'cfp-one')).node.state,Profile.MASTERY_STATES.UNASSISTED_IMMEDIATE);
 assert.equal(Profile.applyAttemptEvidenceToProfile(profile,question('e2','q2',base+2*3600*1000,'cfp-two',true)).node.state,Profile.MASTERY_STATES.UNASSISTED_IMMEDIATE);
 assert.equal(Profile.applyAttemptEvidenceToProfile(profile,question('e3','q3',base+Profile.DELAYED_MEMORY_GATE_MS+1000,'cfp-three',true)).node.state,Profile.MASTERY_STATES.DELAYED_MASTERED);
 assert.equal(Profile.applyAttemptEvidenceToProfile(profile,question('e3','q3',base+Profile.DELAYED_MEMORY_GATE_MS+1000,'cfp-three',true)).reason,'duplicate_event_id');
 const next=base+Profile.DELAYED_MEMORY_GATE_MS+1000+4*24*60*60*1000;
 assert.equal(Profile.applyAttemptEvidenceToProfile(profile,question('e4','q4',next,'cfp-four',true)).transition,'PROMOTED_TO_DELAYED_MASTERED');
 assert.equal(profile.grammarNodes.negation.srsStage,2);
});

test('contract errors are explicit instead of silently becoming empty data',()=>{
 assert.throws(()=>toCanonicalQuestion({id:'bad',type:'unknown',hsk:3,prompt:'x',explanation:'ok'}),ContractValidationError);
});
