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
