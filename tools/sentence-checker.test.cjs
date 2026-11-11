const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const context={window:{addEventListener(){}},fetch:async()=>({ok:false})};vm.createContext(context);
vm.runInContext(fs.readFileSync('src/modules/translation/sentence-checker-core.js','utf8'),context);
const {UnifiedGrammarChecker,SymSpellChineseEngine,defaultConfig}=context.window.HSKSentenceCheckerCore;
const checker=new UnifiedGrammarChecker();
test('offline catalogue equals downloaded catalogue',()=>assert.equal(JSON.stringify(defaultConfig),JSON.stringify(JSON.parse(fs.readFileSync('src/modules/translation/hsk-grammar-rules.json','utf8')))));
test('reported sentence: correct only the help construction and preserve intent',()=>{
 const input='昨天他帮忙我打扫房间，我很感谢他。',items=checker.checkText(input);
 assert.equal(items.length,1);const item=items[0];assert.equal(item.original,'帮忙我');assert.equal(item.replacement,'帮我');
 const fixed=input.slice(0,item.start)+item.replacement+input.slice(item.end);assert.equal(fixed,'昨天他帮我打扫房间，我很感谢他。');assert.equal(checker.checkText(fixed).length,0);
});
test('missing 的, repeated spans and sentence offsets',()=>{
 const input='很漂亮衣服。很漂亮衣服。',items=checker.checkText(input);assert.equal(items.length,2);
 for(const item of items){assert.equal(input.slice(item.start,item.end),item.original);assert.equal(item.replacement,'很漂亮的衣服');}
 assert.equal(items[1].start,6);
});
test('does not corrupt correct numbers, vocabulary or help construction',()=>{
 for(const text of ['十二个学生。','第二个学生。','二十二本书。','这个办法不有效。','他无所不有。','我了解了。','我帮忙打扫房间。','我请他帮忙。','这件衣服很漂亮。'])assert.equal(checker.checkText(text).length,0,text);
 assert.equal(checker.checkText('二本书')[0].replacement,'两本');
});
test('context-sensitive suggestions are never presented as certain errors',()=>{
 for(const text of ['我把书看。','我没有去了。','一方面他很聪明，但是他不努力。'])assert.ok(checker.checkText(text).every(x=>x.kind==='style'),text);
});
test('local cache is bounded during continued editing',()=>{for(let i=0;i<250;i++)checker.checkText(`第${i}句。`);assert.ok(checker.metrics().cacheSize<=200);});
test('edit distance correctly handles transposed letters',()=>{const engine=new SymSpellChineseEngine();assert.equal(engine.damerauLevenshtein('abcd','abdc',1),1);});

test('advanced HSK paragraph yields independent edits across clauses',()=>{
 const text='随着科技的进步，尽管人们的生活越来越方便，所以环境污染也越来越严重。昨天，我讨论了这个话题跟同学们三个小时。大家都主张少开自己车，多骑自行车，因为骑车不但能保护环境，而且能练习身体。为了响应这个建议，我决定明天开始骑自行车去公司一个小时。虽然路有点远，但是只要坚持下去，就会习惯的。同时，政府也应该采取措施，比如多建设公园，提高人们保护环境的意识很厉害。';
 const edits=checker.checkText(text);
 const expected=['但是','跟同学们讨论了这个话题','开自己的车','锻炼身体','骑自行车去公司要花一个小时','大幅提高人们保护环境的意识'];
 assert.equal(edits.length,expected.length);
 for(let i=0;i<edits.length;i++){
  const edit=edits[i];
  assert.equal(edit.replacement.endsWith(expected[i]),true);
  assert.equal(text.slice(edit.start,edit.end),edit.original);
  if(i)assert.ok(edit.start>=edits[i-1].end);
 }
 assert.equal(edits[4].kind,'style');
});
test('advanced rules preserve valid conjunctions, collocations and compounds',()=>{
 for(const text of [
  '尽管工作很忙，但是他坚持锻炼身体。',
  '因为污染越来越严重，所以政府采取了措施。',
  '昨天我跟同学们讨论了这个话题三个小时。',
  '我们骑自己的自行车去学校。',
  '她每天练习身体协调动作。',
  '我们骑自行车去公司要花一个小时。',
  '这是提高人们保护环境的意识的有效方法。',
 ])assert.equal(checker.checkText(text).length,0,text);
});
test('linking word edits do not mask a separate problem in the same sentence',()=>{
 const edits=checker.checkText('尽管他每天都练习身体，所以他还是经常觉得累。');
 assert.deepEqual(Array.from(edits,edit=>[edit.original,edit.replacement]),[
  ['练习身体','锻炼身体'],
  ['所以','但是'],
 ]);
});
test('formal writing compound errors are distinct and corrected forms stay clear',()=>{
 const source='通过有关部门的实地调研，使老旧小区改造工程得以稳步推进。这项民生工程培养了社区的文化底蕴。改造项目之所以能够获得广泛好评的原因，是因为方案尊重了群众的意愿。能否妥善解决历史遗留难题，是实现社区长远发展的必然选择。施工单位应该加强监管，以防类似安全事故不再发生。';
 const edits=checker.checkText(source);
 assert.equal(edits.length,5);
 for(const item of edits)assert.equal(source.slice(item.start,item.end),item.original);
 for(const correct of ['通过实地调研，改造工程得以推进。','政府丰富了社区的文化底蕴。','项目之所以获得好评，是因为方案合理。','能否解决难题，是项目成功与否的关键。','以防类似事故再次发生。']){
   assert.equal(checker.checkText(correct).length,0,correct);
 }
});
