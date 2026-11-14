const {test}=require('node:test');
const assert=require('node:assert/strict');
const {normalize,diffEdits,MAX_TEXT_LENGTH,analyzeAiLikelihood,normalizeAiDetection}=require('../src/modules/translation/sentence-review-core.js');

function apply(text,edits){
  for(const edit of [...edits].sort((a,b)=>b.start-a.start)){
    assert.equal(text.slice(edit.start,edit.end),edit.original);
    text=text.slice(0,edit.start)+edit.replacement+text.slice(edit.end);
  }
  return text;
}
test('corrected paragraph yields independently anchored cards that reproduce AI revision',()=>{
  const source='近年来，通过有关部门的实地调研，使老旧小区改造工程得以稳步推进。这项工程培养了社区的文化底蕴。改造项目之所以获得好评的原因，是因为方案尊重了群众的意愿。然而，能否妥善解决历史遗留难题，是实现社区长远发展的必然选择。以防类似安全事故不再发生。';
  const corrected='近年来，有关部门通过实地调研，推动了老旧小区改造工程稳步进行。这项工程丰富了社区的文化底蕴。改造项目之所以获得好评，是因为方案尊重了群众的意愿。然而，妥善解决历史遗留难题，是实现社区长远发展的重要前提。以防类似安全事故再次发生。';
  const review=normalize({answer:'### Bản sửa đề xuất\n'+corrected+'\n\n### Giải thích lỗi chính\n1. Dùng 丰富 thay 培养.'},source);
  assert.ok(review.suggestions.length>=3);
  assert.equal(apply(source,review.suggestions),corrected);
  assert.ok(!review.summary.includes('###'));
});
test('insertions, deletions, repeated substrings and emoji preserve UTF-16 positions',()=>{
 for(const [a,b] of [['🙂衣服。','🙂的衣服。'],['我我去。','我去。'],['好。好。','好。很好。'],['','你'],['你好','']]){
  assert.equal(apply(a,diffEdits(a,b)),b);
  if (b) assert.equal(apply(a,normalize({correctedText:b},a).suggestions),b);
  else assert.equal(normalize({correctedText:b},a),null,'reject a rewrite that erases the entire draft');
 }
});
test('structured old and new envelopes agree and invalid positions cannot be applied',()=>{
 const text='他跑的很快。';
 const expected={summary:'说明',suggestions:[{kind:'fix',original:'的',replacement:'得',reason:'补语'}]};
 for(const raw of [expected,{answer:JSON.stringify(expected)}, {sentenceReview:expected}, '~~~json\n'.replaceAll('~','`')+JSON.stringify(expected)+'\n```']){
  const review=normalize(raw,text);
  assert.equal(apply(text,review.suggestions),'他跑得很快。');
 }
 assert.equal(normalize({summary:'x',suggestions:[{kind:'fix',original:'不存在',replacement:'x',reason:'x'}]},text),null);
 assert.equal(normalize('Bài này có một lỗi.',text),null);
});
test('diff is lossless for varied text and edits stay bounded',()=>{
 let seed=55;
 const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;};
 for(let count=0;count<120;count++){
  const chars=Array.from('我喜欢学习中文。🙂的了你好');
  const source=Array.from({length:rand()%70},()=>chars[rand()%chars.length]).join('');
  let target=Array.from(source);
  for(let i=0;i<8;i++)target.splice(rand()%(target.length+1),rand()%3,chars[rand()%chars.length]);
  target=target.join('');
  const edits=diffEdits(source,target);
  assert.ok(edits.length<=12);
  assert.equal(apply(source,edits),target);
 }
});


test('a marked-up rewrite produces only Chinese edits and moves negation as one operation',()=>{
  const text='为了改善大家的工作效率，员工大约有三十人左右。他把上周布置的实践任务没有按时完成。';
  const revised='为了提高大家的工作效率，员工大约有三十人。他没有把上周布置的实践任务按时完成。';
  const response={answer:JSON.stringify({answer:'**Bản sửa tự nhiên:** '+revised+'\n**Giải thích:** Chuyển vị trí 没有.'})};
  const review=normalize(response,text);
  assert.deepEqual(review.suggestions.map(({original,replacement})=>[original,replacement]),[
    ['改善','提高'],['左右',''],['把上周布置的实践任务没有','没有把上周布置的实践任务'],
  ]);
  assert.equal(apply(text,review.suggestions),revised);
  assert.match(review.suggestions[2].reason,/Đổi vị trí 「没有」/);
  assert.equal(normalize({correctedText:'tự nhiên: **'+revised},text),null);
  assert.equal(normalize({suggestions:[{kind:'style',original:'改善',replacement:'tự nhiên: **',reason:'x'}]},text),null);
  assert.equal(normalize({answer:'Bản sửa không xác định: '+revised},text),null);
  assert.equal(normalize({answer:'**Bản sửa tự nhiên:** '+revised+'\nĐây là lời giải thích không có tiêu đề.'},text),null);
});

test('handles varied real-world LLM formats including fenced JSON with chatter, thinking tags and alternative headings',()=>{
  const text='我昨天去过了北京。';
  const expectedRevised='我昨天去了北京。';
  
  // 1. Fenced JSON with intro & outro conversational text
  const fencedWithChatter = 'Dưới đây là kết quả kiểm tra:\n```json\n{\n  "summary": "AI phát hiện lỗi dùng từ.",\n  "suggestions": [\n    {"kind": "fix", "original": "去过了", "replacement": "去了", "reason": "Dùng 了."}\n  ]\n}\n```\nChúc bạn học tốt!';
  const r1 = normalize(fencedWithChatter, text);
  assert.ok(r1 && r1.suggestions.length === 1);
  assert.equal(apply(text, r1.suggestions), expectedRevised);

  // 2. Unfenced JSON inside text
  const unfencedInText = 'JSON kết quả:\n{\n  "summary": "AI phát hiện lỗi.",\n  "suggestions": [\n    {"kind": "grammar", "original": "去过了", "replacement": "去了", "reason": "Dùng 了."}\n  ]\n}';
  const r2 = normalize(unfencedInText, text);
  assert.ok(r2 && r2.suggestions.length === 1);
  assert.equal(r2.suggestions[0].kind, 'fix');
  assert.equal(apply(text, r2.suggestions), expectedRevised);

  // 3. Output with thinking tags
  const withThinking = '<think>\nPhân tích ngữ pháp: 去过了 -> 去了\n</think>\n```json\n{\n  "summary": "AI phát hiện lỗi.",\n  "corrections": [\n    {"from": "去过了", "to": "去了", "explanation": "Dùng 了."}\n  ]\n}\n```';
  const r3 = normalize(withThinking, text);
  assert.ok(r3 && r3.suggestions.length === 1);
  assert.equal(apply(text, r3.suggestions), expectedRevised);

  // 4. Natural language with **Câu đúng:**
  const naturalHeading = '**Câu đúng:**\n我昨天去了北京。\n\n**Giải thích:**\nDùng 了 cho hành động hoàn thành.';
  const r4 = normalize(naturalHeading, text);
  assert.ok(r4 && r4.suggestions.length === 1);
  assert.equal(apply(text, r4.suggestions), expectedRevised);

  // 5. Natural language with **Gợi ý sửa:**
  const naturalSuggest = '**Gợi ý sửa:** 我昨天去了北京。\n\n**Lý do:**\nDùng 了.';
  const r5 = normalize(naturalSuggest, text);
  assert.ok(r5 && r5.suggestions.length === 1);
  assert.equal(apply(text, r5.suggestions), expectedRevised);

  // 6. Truncated / unclosed JSON stream recovered by bracket repair
  const truncatedStream = '{\n  "summary": "AI phát hiện lỗi.",\n  "suggestions": [\n    {"kind": "grammar", "original": "去过了", "replacement": "去了", "reason": "Dùng 了."}';
  const r6 = normalize(truncatedStream, text);
  assert.ok(r6 && r6.suggestions.length === 1);
  assert.equal(apply(text, r6.suggestions), expectedRevised);
});

test('resolves non-overlapping occurrences of repeated characters and falls back to corrected candidate if needed', () => {
  const text = '这是我的朋友的电脑。';
  const payload = {
    summary: 'Sửa bớt từ',
    suggestions: [
      { kind: 'style', original: '的', replacement: '', reason: 'Bỏ bớt chữ 的 cho tự nhiên.' }
    ]
  };
  const r = normalize(payload, text);
  assert.ok(r && r.suggestions.length === 1);
  assert.equal(r.suggestions[0].original, '的');
  assert.equal(r.suggestions[0].start, 3);
});

test('supports 5000-character drafts and large lossless bounded diffs', () => {
  assert.equal(MAX_TEXT_LENGTH, 5000);
  const block = '近年来，随着城市化进程的不断加快，人们的生活方式发生了很大的变化，我们在日常生活中也要注重保持健康作息。';
  const base = Array.from({length: 30}, (_, idx) => (idx === 5 ? '今天我讨论了这个话题跟同学们三个小时。' : block)).join('');
  assert.ok(base.length > 1400 && base.length <= 5000);
  const corrected = base.replace('讨论了这个话题跟同学们', '跟同学们讨论了这个话题');
  const edits = diffEdits(base, corrected);
  assert.ok(edits.length >= 1 && edits.length <= 12);
  assert.equal(apply(base, edits), corrected);
  const review = normalize({correctedText: corrected}, base);
  assert.ok(review && review.suggestions.length >= 1);
  assert.equal(apply(base, review.suggestions), corrected);
});

test('analyzeAiLikelihood distinguishes formulaic AI Chinese text from natural learner prose', () => {
  const aiText = '在当今社会，随着科技的不断发展，人工智能在日常生活中的应用具有重要意义。首先，它能够提升工作效率。其次，它为学习提供了有力支撑。此外，它也在医疗领域发挥着重要作用。综上所述，人工智能的发展可以说是利大于弊，成为现代社会不可或缺的一部分。';
  const humanText = '其实我昨天去市场买菜的时候有点儿迷路了，哎呀！后来旁边一位阿姨告诉我怎么走，我觉得挺暖心的。顺便说一句，他昨天帮忙我搬了很重的箱子呢！';
  const aiRes = analyzeAiLikelihood(aiText);
  const humanRes = analyzeAiLikelihood(humanText);
  assert.ok(aiRes.aiProbability > humanRes.aiProbability);
  assert.ok(aiRes.aiProbability >= 55);
  assert.ok(humanRes.aiProbability <= 40);
  assert.ok(aiRes.flaggedSpans.length >= 2);
  assert.equal(aiRes.aiProbability + aiRes.humanProbability, 100);
});

test('normalizeAiDetection validates structured JSON and anchors flaggedSpans cleanly', () => {
  const text = '综上所述，随着科技的发展，这项技术在日常生活中发挥着重要作用，我个人觉得还需要多观察。';
  const normalized = normalizeAiDetection({
    answer: '```json\n' + JSON.stringify({
      aiProbability: 74,
      verdict: 'ai',
      confidence: 'Cao',
      summary: 'Đoạn văn dùng nhiều cụm chuyển ý khuôn mẫu.',
      metrics: {naturalness: 30, templateDensity: 82, burstiness: 28},
      signals: ['Dùng cụm 综上所述 và 发挥着重要作用.'],
      flaggedSpans: [
        {text: '综上所述', reason: 'Cụm kết luận khuôn mẫu của AI.', humanizeTip: 'Đổi sang cách nói cá nhân.'},
        {text: 'nonexistent-span', reason: 'Không có trong văn bản.'}
      ]
    }) + '\n```'
  }, text);
  assert.ok(normalized);
  assert.equal(normalized.aiProbability, 74);
  assert.equal(normalized.humanProbability, 26);
  assert.equal(normalized.verdict, 'ai');
  assert.equal(normalized.confidence, 'Cao');
  assert.equal(normalized.flaggedSpans.length, 1);
  assert.equal(text.slice(normalized.flaggedSpans[0].start, normalized.flaggedSpans[0].end), '综上所述');

  const uniformMixed = '我每天早上七点起床学习中文。然后我八点半去学校参加课程。中午十二点我在食堂吃午饭。下午两点我和同学一起复习课文。晚上七点我在图书馆练习写汉字。十点半我回到宿舍准备休息。';
  const uniformOut = analyzeAiLikelihood(uniformMixed);
  assert.ok(uniformOut.aiProbability >= 38);
  assert.ok(uniformOut.signals.some(s => /đồng đều|sách giáo khoa|biên tập/i.test(s)), 'must explain WHY uniform textbook prose resembles AI');
  assert.ok(uniformOut.flaggedSpans.length >= 1, 'mixed/AI detection should highlight representative uniform sentence even without cliché keywords');

  const sparseAi = normalizeAiDetection(JSON.stringify({aiProbability: 44, signals: ['Một dấu hiệu ngắn.']}), uniformMixed);
  assert.ok(sparseAi.signals.length >= 2, 'sparse worker signals should be enriched with baseline AI reasons');
});
