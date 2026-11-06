import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function boot(){
 const values=new Map(),storage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};
 const context={localStorage:storage,Math,Date,console};
 vm.runInNewContext(fs.readFileSync(new URL('../src/modules/ai-coach/qa-understanding-memory.js',import.meta.url),'utf8'),context);
 return context.HSKQaMemory;
}

test('understanding memory only commits evidence quoted from the learner',()=>{
 const memory=boot();
 const audit=memory.validateAndCommitMemoryCandidates({uid:'learner-1',conversationMessages:[{id:'q1',role:'user',text:'我昨天不去学校'}],candidates:[
  {nodeKey:'grammar:bu-mei',label:'不 / 没',candidateType:'observed_mistake',evidenceMessageId:'q1',evidenceQuote:'我昨天不去学校',manifestation:'Dùng 不 cho việc quá khứ'}
 ]});
 assert.equal(audit.acceptedCandidates.length,1);
 assert.equal(memory.load('learner-1').nodes['grammar:bu-mei'].confidenceLevel,'needs_more_check');
 const rejected=memory.validateAndCommitMemoryCandidates({uid:'learner-1',conversationMessages:[{id:'q2',role:'user',text:'Khi nào dùng 没?'}],candidates:[{nodeKey:'grammar:fake',label:'Bịa',candidateType:'observed_mistake',evidenceMessageId:'q2',evidenceQuote:'他昨天没吃饭'}]});
 assert.equal(rejected.rejectedCandidates[0].reason,'fabricated_or_mismatched_quote');
});

test('lookup questions become interest only and feedback changes the next teaching state',()=>{
 const memory=boot();
 const audit=memory.validateAndCommitMemoryCandidates({uid:'learner-2',conversationMessages:[{id:'q1',role:'user',text:'没 nghĩa là gì?'}],candidates:[{nodeKey:'vocab:mei',label:'没',candidateType:'observed_mistake',evidenceMessageId:'q1',evidenceQuote:'没 nghĩa là gì?'}]});
 assert.equal(audit.acceptedCandidates[0].confidenceLevel,'interest_only');
 memory.recordQaFeedbackOrMicroCheckOutcome({uid:'learner-2',nodeKey:'vocab:mei',eventType:'not_understood',strategy:'contrast'});
 assert.equal(memory.load('learner-2').nodes['vocab:mei'].lastOutcome,'not_understood');
});
