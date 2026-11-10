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
