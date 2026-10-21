const assert=require('node:assert/strict'),C=require('../src/modules/reading/real-reading-variety-core.js');
const text=(seed)=>[
  {hanzi:'小李今天下班以后要去超市买菜，他的朋友想一起做饭。'+seed},
  {hanzi:'他们准备买米饭、鸡蛋和一些新鲜的水果，然后回家。'},
  {hanzi:'小李说今天太忙，所以晚饭要做得简单一点。'},
  {hanzi:'两个朋友一起吃饭时，聊了很多关于工作和生活的事。'}
];
function item(id,sourceId,topic,lessonId=null,hsk=3,lines=text(id)){
 return {id,hsk,lessonId,topic,titleZh:'今天的生活 '+id,scriptMode:lines,source:{id:sourceId,url:'https://example.org/article/'+sourceId}};
}
const fixed=()=>0.25;
const catalog=[
 item('a','1','ăn uống','standard-3-01'),
 item('b','2','đi làm','standard-3-01',3,text('một câu mới có gì khác')),
 item('c','3','mua sắm','standard-3-01',3,[{hanzi:'张阿姨到超市以后买了两本很漂亮的书，然后给朋友打电话。'},{hanzi:'她决定周末回家看书，不准备参加其他的活动了。'}]),
 item('d','4','ăn uống','standard-3-02',3,[{hanzi:'今天下午我和妈妈坐地铁去市中心买衣服，路上人很多。'},{hanzi:'我们在新开的商店里找到了非常漂亮的礼物。'}]),
 item('e','5','ăn uống','standard-4-01',4)
];
assert.equal(C.canonicalUrl('https://www.EXAMPLE.org/foo/?utm_source=x&fbclid=xyz#abc'),'https://example.org/foo');
assert.equal(C.canonicalUrl('http://example.org/x'),'');
assert.equal(C.canonicalUrl('https://user:pass@example.org/'),'');
const scope={hsk:3,lessonId:'standard-3-01'};
let history={version:1,entries:[]};
let chosen=C.nextCached(catalog,history,scope,fixed);
assert.equal(chosen.kind,'cached');
history=C.record(history,chosen.item,{now:10});
assert.equal(C.stats(history,scope).opened,1);
assert.equal(C.stats(history,{hsk:3,lessonId:'standard-3-02'}).opened,0);
assert.equal(C.isNovel(chosen.item,history).ok,false);
assert.equal(C.isNovel(item('similar','different','đời sống',scope.lessonId,3,[...chosen.item.scriptMode]),history).reason,'near-duplicate');
const second=C.nextCached(catalog,history,scope,fixed);
assert.notEqual(second.item.id,chosen.item.id);
assert.equal(second.kind,'cached');
history=C.record(history,second.item,{now:20,completed:false});
history=C.record(history,second.item,{now:25,completed:true});
assert.equal(C.stats(history,scope).completed,1);
assert.equal(history.entries.find(x=>x.id===second.item.id).openedCount,1,'completion should not count a new opening');
assert.equal(C.nextCached(catalog,history,{hsk:4,lessonId:'standard-3-01'},fixed).kind,'needs-generation');
assert.equal(C.nextCached(catalog,history,{hsk:3,lessonId:'standard-3-02'},fixed).item.id,'d');
const seedSources=[
 {id:'src-a',source:{id:'1',url:'https://example.org/article/1'},hskMin:1,hskMax:6,active:true},
 {id:'src-b',source:{id:'2',url:'https://example.org/article/2'},hskMin:2,hskMax:4,active:true}
];
let generated=C.nextGeneration(seedSources,history,{...scope,topics:['đi làm','đi chợ']},fixed);
assert.equal(generated.kind,'generate');
assert.ok(['đi làm','đi chợ'].includes(generated.topic));
assert.equal(generated.constraints.doNotInventSource,true);
assert.ok(generated.variantKey);
let reused=C.nextGeneration(seedSources,[...history.entries,{id:'prior',sourceKey:C.sourceKey(generated.source),variantKey:generated.variantKey,topic:generated.topic,angle:generated.angle,lastOpenedAt:30}],{...scope,topics:['đi làm','đi chợ']},fixed);
assert.notEqual(reused.variantKey,generated.variantKey);
assert.equal(C.nextGeneration([],{entries:[]},scope,fixed).kind,'source-required');
assert.throws(()=>C.nextCached([],history,{hsk:7},fixed),/HSK/);
assert.ok(C.similarity('我今天去学校买东西','我今天去学校买东西')===1);
assert.ok(C.similarity('我今天去学校买东西','天气很好但是今天我要出去')<.76);
let lots={version:1,entries:[]};
for(let i=0;i<C.MAX_HISTORY+3;i++)lots=C.record(lots,item('i'+i,'source'+i,'topic',null,3,[{hanzi:'一个全新的故事段落用来测试历史数据保存'+i}]),{now:i});
assert.equal(lots.entries.length,C.MAX_HISTORY);
assert.equal(lots.entries[0].id,'i3');
// One lesson can offer many distinct stories without recycling the same source-angle combination.
let deep={version:1,entries:[]},variantKeys=new Set();
for(let i=0;i<16;i++){
 const g=C.nextGeneration(seedSources,deep,{...scope,topics:['ăn uống']},()=>0);
 assert.equal(g.kind,'generate','source+angle combinations should remain available');
 assert.equal(variantKeys.has(g.variantKey),false,'do not reoffer an old source-angle variant');
 variantKeys.add(g.variantKey);
 const generated=item('generated-'+i,C.sourceKey(g.source),g.topic,scope.lessonId,scope.hsk,
   [{hanzi:'第'+i+'次练习:今天我们讨论新的生活问题和不同的工作体验。'+i}]);
 generated.angle=g.angle;generated.variantKey=g.variantKey;
 deep=C.record(deep,generated,{now:i});
}
assert.equal(C.stats(deep,scope).opened,16);
assert.equal(variantKeys.size,16);
assert.equal(C.nextGeneration(seedSources,deep,{...scope,topics:['ăn uống']},()=>0).kind,'source-required','all source-angle combinations used');
console.log('PASS novelty scheduler: HSK/lesson scope, no repeats, near-duplicates, 16 distinct variations, source/topic rotation, completion counters, capped history');
