import test from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const C=createRequire(import.meta.url)('../src/modules/reading/real-reading-variety-core.js');
test('cache, variants and history respect genre while old stories remain dialogues',()=>{
 const a={id:'a',hsk:3,lessonId:'lesson',source:{id:'s'},scriptMode:[{hanzi:'今天我们一起学习汉语然后去学校吃饭。'}]},b={id:'b',hsk:3,lessonId:'lesson',genre:'story',source:{id:'s'},scriptMode:[],paragraphMode:[{hanzi:'有一天小明走进森林发现一只迷路的小猫。'}]};
 assert.equal(C.nextCached([a,b],[],{hsk:3,genre:'story'}).item.id,'b');
 assert.equal(C.nextCached([a,b],[],{hsk:3,genre:'dialogue'}).item.id,'a');
 assert.equal(C.nextCached([a,b],[],{hsk:3,genre:'news'}).kind,'needs-generation');
 const sources=[{id:'s',hskMin:1,hskMax:6,source:{id:'s',url:'https://example.test/'}}],scope={hsk:3,lessonId:'lesson',topics:['gia đình']};
 const d=C.nextGeneration(sources,[],{...scope,genre:'dialogue'},()=>0),s=C.nextGeneration(sources,[],{...scope,genre:'story'},()=>0);assert.notEqual(d.variantKey,s.variantKey);
 let history=C.record([],a);history=C.record(history,b);assert.equal(C.stats(history,{hsk:3,genre:'story'}).opened,1);assert.equal(C.stats(history,{hsk:3,genre:'dialogue'}).opened,1);
 assert.equal(C.isNovel({...b,id:'c'},history).ok,false,'relabeling identical text never makes it novel');
});
