import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
function helpers(){
 const context=vm.createContext({usageFactsData:{words:{'行':{variants:[{pin:'xíng',senses:[{mean:'đi'}]},{pin:'háng',senses:[{mean:'hàng'}]}]}}}});context.window=context;
 for(const name of ['content/data/wordFrequency.js','src/utils/text.js','src/utils/format.js','src/modules/dictionary/open-dictionary-core.js','src/modules/dictionary/search-core.js','src/ui/dictionary-relations.js'])vm.runInContext(fs.readFileSync(new URL(name,root),'utf8'),context);
 return code=>JSON.parse(vm.runInContext('JSON.stringify('+code+')',context));
}
test('search normalization preserves Vietnamese meanings while allowing accent-free lookup',()=>{
 const run=helpers();assert.equal(run("fold('Đặng Nǐ Hǎo')"),'dang ni hao');
 assert.equal(run("exact(' Á   Bạn ')"),'á bạn');assert.equal(run("viText(' Đẹp, XINH! ')"),'đẹp xinh');
 assert.equal(run("hasAccent('mǎ')"),true);assert.equal(run("hasAccent('ma')"),false);
 assert.equal(run("phraseIn('học sinh','sinh')"),true);assert.equal(run("phraseIn('sinhvien','sinh')"),false);
});
test('sense splitting retains nested punctuation and removes duplicated Sino-Vietnamese wrapper',()=>{
 const run=helpers();assert.deepEqual(run("splitSenses({mean:'Học (học tập, học hành); học hỏi / tìm hiểu',hv:'Học'})"),['Học (học tập, học hành)','học hỏi','tìm hiểu']);
 assert.deepEqual(run("splitSenses({mean:'Học (học tập)',hv:'học'})"),['học tập']);
});
test('synonym lookup retains ambiguous-query exclusions and whole-sense matching',()=>{
 const run=helpers();assert.ok(run("expandedTerms('dep')").includes('xinh'));
 assert.ok(!run("expandedTerms('ba')").includes('ba'));assert.ok(!run("expandedTerms('u')").includes('u'));
 assert.equal(run("nearSenses('xinh','đẹp')"),true);assert.equal(run("nearSenses('đẹp','ăn')"),false);
});
test('typo matching remains bounded and does not guess short words',()=>{
 const run=helpers();assert.equal(run("typoSimilar('studying','studing')"),true);
 assert.equal(run("typoSimilar('studying','running')"),false);assert.equal(run("typoSimilar('mua','mưa')"),false);
 assert.equal(run("typoSimilar('xin an','in an')"),false,'short multi-word phrases must not cross-match xin an vs in an');
 assert.equal(run("typoSimilar('xin ăn','in ấn')"),false,'accented Vietnamese phrases must not cross-match different tones');
 assert.equal(run("typoSimilar('kiểm tra','kiếm tra')"),true,'genuine 1-char typo on 4+ letter word remains allowed');
 assert.ok(run("expandedTerms('xin ăn')").includes('ăn xin'));
 assert.ok(run("expandedTerms('xin ăn')").includes('ăn mày'));
});
test('phonetic recovery expands Vietnamese approximations and ranks grounded candidates',()=>{
 const run=helpers();const hints=run("HSKOpenDictionaryCore.expandVietnamesePhonetic('chửng mơ pan')");assert.ok(hints[0].some(x=>['cheng','chen','zung'].includes(x)));assert.equal(run("HSKOpenDictionaryCore.normalizePhoneticKey('nìa ni3')"),'nia ni');assert.ok(run("HSKOpenDictionaryCore.phoneticCandidateScore('zěnmebàn',HSKOpenDictionaryCore.expandVietnamesePhonetic('chửng mơ pan'))")>0);
});
test('shuffle returns all original entries without mutating the source',()=>{
 const run=helpers();assert.deepEqual(run("(()=>{const a=[1,2,3,4],b=shuffled(a);return {a,b:b.sort()};})()"),{a:[1,2,3,4],b:[1,2,3,4]});
});
test('review interval/date formatting keeps minute rounding and unavailable-date fallback',()=>{
 const run=helpers();assert.equal(run('intervalLabel(10/1440)'),'10 phút');assert.equal(run('intervalLabel(1.25)'),'1.3 ngày');
 assert.equal(run('memoryDate(NaN)'),'Chưa có');assert.equal(run('memoryDate(null)'),'Chưa có');
});
test('dictionary reading selection does not merge different pronunciations of one Hanzi',()=>{
 const run=helpers();assert.equal(run("usageReading(' Nǐ’ hǎo · ')"),'nǐhǎo');
 assert.equal(run("usageVariant('行','xíng').rows[0].senses[0].mean"),'đi');
 assert.equal(run("usageVariant('行','háng').rows[0].senses[0].mean"),'hàng');
 assert.equal(run("usageVariant('行','wrong').rows.length"),0);
});
test('search commonality prior favors everyday HSK words over archaic/variant/proper-noun entries',()=>{
 const run=helpers();
 const hskNew=run("HSKSearchRanking.commonality({han:'新',pin:'xīn',hsk:2,practice:{examples:[{},{},{}]}})");
 const hskNews=run("HSKSearchRanking.commonality({han:'新闻',pin:'xīnwén',hsk:3,practice:{examples:[{},{}]}})");
 const surname=run("HSKSearchRanking.commonality({han:'新',pin:'Xin1',mean:'surname Xin'})");
 const archaic=run("HSKSearchRanking.commonality({han:'伈',pin:'xin3',mean:'variant of 心; (literary) timid'})");
 assert.ok(hskNew>surname&&hskNews>archaic,'HSK everyday words must rank well above surname/archaic entries');
 assert.equal(run("HSKSearchRanking.isArchaicGloss('variant of 心; timid')"),true);
 assert.equal(run("HSKSearchRanking.isArchaicGloss('new; fresh')"),false);
 assert.deepEqual(run("HSKSearchRanking.splitPinyinSyllables('xīnnián')"),['xin','nian']);
 assert.deepEqual(run("HSKSearchRanking.splitPinyinSyllables('xìngfú')"),['xing','fu']);
 assert.deepEqual(run("HSKSearchRanking.splitPinyinSyllables('kāixīn')"),['kai','xin']);
 assert.ok(run("HSKSearchRanking.corpusFrequency('心')")>=25,'everyday non-HSK character 心 must carry high corpus frequency');
 assert.ok(run("HSKSearchRanking.corpusFrequency('微信')")>=20,'modern everyday term 微信 must carry high corpus frequency');
 assert.ok(run("HSKSearchRanking.corpusFrequency('新') > HSKSearchRanking.corpusFrequency('馨')"),'common 新 must outrank rare 馨 in corpus frequency');
 assert.ok(run("HSKSearchRanking.commonality({han:'心',pin:'xīn',mean:'tim'}) > HSKSearchRanking.commonality({han:'馨',pin:'xīn',mean:'thơm'})"),'corpus frequency must elevate 心 well above rare 馨');
});
test('search frequency store normalizes pinyin keys, applies bounded recency boost, and tracks hit counts',()=>{
 const run=helpers();
 const res=run(`(()=>{
  const bag=new Map();
  const store={getItem:k=>bag.get(k)||null,setItem:(k,v)=>bag.set(k,String(v))};
  const t0=1730000000000;
  recordSearchHit('kiem',{han:'赚',pin:'zhuan4'},t0,store);
  recordSearchHit('kiem',{han:'赚',pin:'zhuàn'},t0+1000,store);
  const data=loadSearchFrequency(store);
  return {
   sameKey:searchWordKey({han:'赚',pin:'zhuan4'})===searchWordKey({han:'赚',pin:'zhuàn'}),
   counts:searchHitCount('kiem',{han:'赚',pin:'zhuàn'},data),
   freshBoost:searchFrequencyBoost('kiem',{han:'赚',pin:'zhuàn'},t0+2000,data),
   staleBoost:searchFrequencyBoost('kiem',{han:'赚',pin:'zhuàn'},t0+60*86400000,data),
   otherWordBoost:searchFrequencyBoost('kiem',{han:'找',pin:'zhǎo'},t0+2000,data)
  };
 })()`);
 assert.equal(res.sameKey,true);
 assert.deepEqual(res.counts,{total:2,queryCount:2});
 assert.ok(res.freshBoost>0&&res.freshBoost<=36);
 assert.ok(res.staleBoost<res.freshBoost,'older clicks must decay cleanly');
 assert.equal(res.otherWordBoost,0);
});
