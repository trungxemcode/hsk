import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function boot() {
  const context={};
  for(const file of ['qa-intent-router.js','ai-qa-suggestions-ui.js'])
    vm.runInNewContext(fs.readFileSync(new URL('../src/modules/ai-coach/'+file,import.meta.url),'utf8'),context);
  return {router:context.HSKQaIntentRouter,renderer:context.HSKQaSuggestionsUI};
}
const contexts=()=>new Map([
  ['ai-1',{aiMessageId:'ai-1',parentUserMessageId:'u-1',originalQuestionText:'Khi nào dùng 不?',primaryNodeKey:'grammar:bu',nodeLabel:'不',explanationStrategyUsed:'CONTRAST_PAIR',coreRuleSummary:'Không dùng sai thời điểm'}],
  ['ai-2',{aiMessageId:'ai-2',parentUserMessageId:'u-2',originalQuestionText:'Khi nào dùng 没?',primaryNodeKey:'grammar:mei',nodeLabel:'没',explanationStrategyUsed:'REAL_LIFE_SCENARIO'}]
]);
test('explicit feedback must target the selected AI message, never the newest unrelated answer',()=>{
  const {router}=boot(),registry=contexts();
  const result=router.resolveTargetMessageAndIntent({userText:'Chưa hiểu',explicitAction:'not_understood',explicitTargetAiMessageId:'ai-1',aiMessageRegistry:registry});
  assert.equal(result.targetAiMessageId,'ai-1');
  assert.equal(result.parentUserMessageId,'u-1');
  assert.equal(result.intent,'re_explain_pivot');
  assert.notEqual(result.recommendedNewStrategy,'CONTRAST_PAIR');
  assert.throws(()=>router.resolveTargetMessageAndIntent({userText:'Chưa hiểu',explicitAction:'not_understood',explicitTargetAiMessageId:'missing',aiMessageRegistry:registry}),/Không tìm thấy tin nhắn AI mục tiêu/);
});
test('a fresh lookup is not mistaken for not understanding the previous AI answer',()=>{
  const {router}=boot();
  const result=router.resolveTargetMessageAndIntent({userText:'Chưa hiểu từ 被 nghĩa là gì?',aiMessageRegistry:contexts()});
  assert.equal(result.intent,'meaning_usage');
  assert.equal(result.targetAiMessageId,null);
});
test('suggestions bind to the originating AI answer and never count as learner weakness evidence',()=>{
  const {router,renderer}=boot();
  const suggestions=router.normalizeSuggestedQuestions([
    {kind:'context_shift',text:'Cho ví dụ mới trong bối cảnh đời thường'},
    {kind:'context_shift',text:'Cho ví dụ mới trong bối cảnh đời thường'},
    {kind:'practice_request',text:'Tự thử một câu ngắn nào'},
    {kind:'decision_guide',text:'<script>alert("x")</script>'},
    {kind:'decision_guide',text:'Extra item should be capped'}
  ],'ai-1');
  assert.equal(suggestions.length,3);
  assert.ok(suggestions.every(item=>item.targetAiMessageId==='ai-1'));
  const selection=router.resolveSuggestedQuestionSelection({suggestion:suggestions[0],targetContext:contexts().get('ai-1')});
  assert.equal(selection.targetAiMessageId,'ai-1');
  assert.equal(selection.intent,'edge_case_exploration');
  assert.equal(selection.evidencePolicy,'question_only');
  const html=renderer.renderSuggestedQuestionsHtml(suggestions);
  assert.match(html,/&lt;script&gt;/);
  assert.doesNotMatch(html,/<script>/);
  assert.match(html,/data-target-ai-message-id="ai-1"/);
});
