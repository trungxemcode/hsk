import test from 'node:test';
import assert from 'node:assert/strict';
import C from '../src/modules/music/music-lyrics-core.js';
test('LRC handles metadata, offsets, repeated timestamps, bilingual duplicate timestamps and blank cue',()=>{
 const d=C.parse('[ti:测试]\n[offset:500]\n[00:01.25][00:03.5]你好\n[00:01.25]Xin chào\n[00:05.00]','a.lrc');
 assert.equal(d.cues.length,3);assert.equal(d.cues[0].start,1.75);assert.equal(d.cues[0].end,4);assert.equal(d.cues[0].text,'你好\nXin chào');assert.equal(d.cues[2].text,'');
 assert.equal(C.active(d.cues,1),-1);assert.equal(C.active(d.cues,4),1);
});
test('SRT and JSON preserve exact cue times, gaps, pinyin and meaning without executable markup',()=>{
 const d=C.parse('1\n00:00:01,250 --> 00:00:02,500\n<b>你好</b>\n世界\n\n2\n00:00:04,000 --> 00:00:06,000\n再见','a.srt');
 assert.equal(d.cues[0].text,'你好\n世界');assert.equal(C.active(d.cues,3),-1);assert.equal(C.active(d.cues,6),-1);
 const j=C.parse(JSON.stringify({segments:[{start:0,end:5,hanzi:'你好',pinyin:'nǐ hǎo',vi:'Xin chào'}]}),'a.json');assert.equal(j.cues[0].pinyin,'nǐ hǎo');assert.equal(j.cues[0].vi,'Xin chào');
});
test('malformed/oversized/overlapping scripts rejected; no synthetic alignment',()=>{
 for(const s of ['lời không có mốc','[00:99]sai','[offset:-99999]\n[00:01]sai'])assert.throws(()=>C.parse(s,'a.lrc'));
 assert.throws(()=>C.parse('x'.repeat(500001)));
 assert.throws(()=>C.validate({cues:[{start:2,end:1,text:'x'}]}));
 assert.throws(()=>C.validate({cues:[{start:0,end:3,text:'a'},{start:2,end:4,text:'b'}]}));
 assert.throws(()=>C.validate({cues:[{start:NaN,text:'x'}]}));
 assert.equal(C.active([{start:1,end:null,text:'a'}],5,10),0);assert.equal(C.active([{start:1,end:null,text:'a'}],10,10),-1);
});
test('character sweep uses uneven explicit audio times, not line interpolation',()=>{
 const cue=C.validate({cues:[{start:10,end:18,text:'你，好世界！',characters:[{start:10.4,text:'你'},{start:10.6,text:'好'},{start:14,text:'世'},{start:17.1,text:'界'}]}]}).cues[0];
 const snapshot=JSON.stringify(cue);
 assert.equal(C.characterCount(cue,10),0);
 assert.equal(C.characterCount(cue,10.4),1);
 assert.equal(C.characterCount(cue,12),2);
 assert.equal(C.characterCount(cue,16),3);
 assert.equal(C.characterCount(cue,17.2),4);
 assert.equal(C.characterCount(cue,10.1),0);
 assert.equal(C.characterCount({start:10,end:18,text:'你好世界'},17),0,'plain cues never simulate syllables');
 assert.equal(JSON.stringify(cue),snapshot);
});
test('enhanced LRC preserves literal single-character markers, offset, and end',()=>{
 const result=C.parse('[offset:500]\n[00:10]<00:10.10>你，<00:12.30>好<00:15.00>','a.lrc');
 assert.equal(result.cues[0].text,'你，好');assert.equal(result.cues[0].end,15.5);
 assert.deepEqual(result.cues[0].characters,[{start:10.6,end:null,text:'你'},{start:12.8,end:null,text:'好'}]);
 for(const text of ['[00:10]<00:10.10>你好','[00:10]<00:09>你','[00:10]<00:12>你<00:11>好'])assert.throws(()=>C.parse(text,'a.lrc'));
});
test('character metadata must match text, be finite, ordered, bounded and round-trip',()=>{
 const base={start:1,end:4,text:'你好',characters:[{start:1.4,text:'你'},{start:3,end:3.8,text:'好'}]};
 assert.deepEqual(C.parse(JSON.stringify(C.validate({cues:[base]})),'a.json'),C.validate({cues:[base]}));
 for(const chars of [[{start:1,text:'他'}],[{start:NaN,text:'你'},{start:2,text:'好'}],[{start:2,text:'你'},{start:2,text:'好'}],[{start:1,end:3,text:'你'},{start:2,text:'好'}],[{start:1,text:'你'},{start:4,text:'好'}],[{start:1,text:'你'},{start:3,end:5,text:'好'}]])assert.throws(()=>C.validate({cues:[{...base,characters:chars}]}));
 assert.throws(()=>C.validate({cues:[{...base,end:null,characters:[{start:1,text:'你'},{start:3.5,text:'好'}]},{start:3,text:'再见'}]}));
});
