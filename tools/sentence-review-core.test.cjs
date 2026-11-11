const {test}=require('node:test');
const assert=require('node:assert/strict');
const {normalize,diffEdits}=require('../src/modules/translation/sentence-review-core.js');

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
  assert.equal(apply(a,normalize({correctedText:b},a).suggestions),b);
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
