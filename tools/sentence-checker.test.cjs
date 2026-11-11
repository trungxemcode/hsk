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
 const source='近年来，随着城市化进程不断加快，通过有关部门的实地调研，使老旧小区改造工程得以稳步推进。这项民生工程培养了社区的文化底蕴。改造项目之所以能够获得广泛好评的原因，是因为方案尊重了群众的意愿。能否妥善解决历史遗留难题，是实现社区长远发展的必然选择。施工单位应该加强监管，以防类似安全事故不再发生。';
 const edits=checker.checkText(source);
 assert.equal(edits.length,5);
 for(const item of edits)assert.equal(source.slice(item.start,item.end),item.original);
 for(const correct of ['通过实地调研，改造工程得以推进。','政府丰富了社区的文化底蕴。','项目之所以获得好评，是因为方案合理。','能否解决难题，是项目成功与否的关键。','以防类似事故再次发生。']){
   assert.equal(checker.checkText(correct).length,0,correct);
 }
});

test('structural checks transfer across topics and leave matched correct variants clear',()=>{
  const cases=[
    ['颁布了扩大招生范围、设置实习岗位和简化申请流程。','STRUCT_POLICY_OBJECT','颁布了扩大招生范围、设置实习岗位和简化申请流程的通知。'],
    ['制定了减免摊位费用和增加公共照明。','STRUCT_POLICY_OBJECT','制定了减免摊位费用和增加公共照明的方案。'],
    ['这次培训包括安全演练、现场讲解等环节组成。','STRUCT_COMPOSITION','这次培训由安全演练、现场讲解等环节组成。'],
    ['教材包含语音练习、课文对话等部分组成。','STRUCT_COMPOSITION','教材包含语音练习、课文对话等部分。'],
    ['仪器失灵是由于供电中断所致。','STRUCT_CAUSE','仪器失灵是由于供电中断。'],
    ['供水受阻是因为施工人员误操作造成的。','STRUCT_CAUSE','供水受阻是施工人员误操作造成的。'],
    ['只有填写报名表，便能获得资格。','STRUCT_CONDITION','只有填写报名表，才能获得资格。'],
    ['除非保存好收据，便能申请退款。','STRUCT_CONDITION','除非保存好收据，否则无法申请退款。'],
    ['凭借各方的共同努力，让救援工作迅速展开。','STRUCT_MISSING_SUBJECT','凭借各方的共同努力，救援队迅速展开行动。'],
    ['经过耐心讲解，令居民逐渐了解新的分类办法。','STRUCT_MISSING_SUBJECT','经过耐心讲解，社区工作人员让居民逐渐了解新的分类办法。'],
    ['行人是否能安全过街，关键在于要完善交通设施。','STRUCT_POLARITY','行人是否能安全过街，取决于交通设施是否完善。'],
    ['这份手册对于新员工熟悉业务提供了有价值的参考。','STRUCT_BENEFICIARY','这份手册为新员工熟悉业务提供了有价值的参考。'],
    ['请加强巡查，避免类似故障不再出现。','STRUCT_PREVENTION','请加强巡查，避免类似故障再次出现。'],
    ['这里供应苹果、葡萄以及水果。','STRUCT_CATEGORY_OVERLAP','这里供应苹果、葡萄以及其他水果。'],
    ['会议围绕以节水为主题展开。','STRUCT_FOCUS','会议以节水为主题展开。'],
    ['本地游客大多是以家庭为主。','STRUCT_MAJORITY','本地游客以家庭为主。'],
    ['这项活动深受社区居民所欢迎。','STRUCT_PASSIVE','这项活动深受社区居民欢迎。'],
    ['换设备以后，能耗降低了1.5倍。','STRUCT_REDUCTION','换设备以后，能耗降到了原来的三分之二。'],
  ];
  for(const [sentence,ruleId,correct] of cases){
    const edits=checker.checkText(sentence);
    const edit=edits.find(item=>item.ruleId===ruleId);
    assert.ok(edit,sentence+' '+JSON.stringify(edits));
    assert.equal(sentence.slice(edit.start,edit.end),edit.original);
    if(!edit.reviewOnly){
      const changed=sentence.slice(0,edit.start)+edit.replacement+sentence.slice(edit.end);
      assert.ok(!checker.checkText(changed).some(item=>item.ruleId===ruleId),changed);
    }
    assert.deepEqual(Array.from(checker.checkText(correct),item=>item.ruleId),[],correct);
  }
});

test('mixed advanced paragraphs surface several different issues and preserve ordinary language',()=>{
  const paragraph='博物馆制定了延长开放时间、增设志愿者岗位和开展导览活动。课程包含阅读、讨论等环节组成。这个项目对于居民了解历史提供了新的机会。能否吸引更多观众，核心在于要改善交通。';
  const edits=checker.checkText(paragraph);
  assert.deepEqual(Array.from(edits,item=>item.ruleId),[
    'STRUCT_POLICY_OBJECT','STRUCT_COMPOSITION','STRUCT_BENEFICIARY','STRUCT_POLARITY'
  ]);
  for(const text of [
    '对于这个问题，他提供了可行的解决方案。',
    '对于是否提供了足够的信息，专家还在讨论。',
    '他朗读了“只有努力，就能成功”这句话。',
    '除非雨停，就算大家都来，我们也无法出发。',
    '我们采取措施避免工人不再参与项目。',
    '通过实际测试，使用这套程序的人给出了反馈。',
    '这套办法能否成功，关键在于员工的参与程度。',
    '报告围绕问题展开，并受到团队所提供的技术支持。',
    '用电量从每月2.4万度降低至1.8万度。',
    '只有在天气正常时，如果申请获批，就可以登山。',
  ])assert.ok(checker.checkText(text).every(edit=>!edit.ruleId?.startsWith('STRUCT_')),text);
});
