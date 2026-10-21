import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
function helpers(){
 const context=vm.createContext({usageFactsData:{words:{'行':{variants:[{pin:'xíng',senses:[{mean:'đi'}]},{pin:'háng',senses:[{mean:'hàng'}]}]}}}});
 for(const name of ['src/utils/text.js','src/utils/format.js','src/modules/dictionary/search-core.js','src/ui/dictionary-relations.js'])vm.runInContext(fs.readFileSync(new URL(name,root),'utf8'),context);
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
