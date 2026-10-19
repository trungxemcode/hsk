import test from 'node:test';
import assert from 'node:assert/strict';
import { detectVoiceSegments } from './voice-segmentation.mjs';
function wav(seconds, intervals) {
 const n=seconds*24000, bytes=new Uint8Array(44+n*2), v=new DataView(bytes.buffer);
 for(const [offset,tag] of [[0,'RIFF'],[8,'WAVE'],[12,'fmt '],[36,'data']]) for(let j=0;j<4;j++)bytes[offset+j]=tag.charCodeAt(j);
 v.setUint32(4,bytes.length-8,true);v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);
 v.setUint32(24,24000,true);v.setUint32(28,48000,true);v.setUint16(32,2,true);v.setUint16(34,16,true);v.setUint32(40,n*2,true);
 for(const [a,b] of intervals)for(let i=Math.floor(a*24000);i<Math.floor(b*24000);i++)v.setInt16(44+i*2,Math.sin(i/10)*12000,true);
 return Buffer.from(bytes).toString('base64');
}
test('two spoken regions yield two ranges with correct units',()=>{
 const out=detectVoiceSegments(wav(4,[[.3,.9],[2,2.6]]),2);
 assert.equal(out.ranges.length,2);
 assert.ok(out.ranges[0][0]>=.25*24000&&out.ranges[0][0]<.4*24000);
 assert.equal(out.duration,4);
});
test('silence and malformed audio fail closed',()=>{
 assert.throws(()=>detectVoiceSegments(wav(2,[]),2),/silent_master/);
 assert.throws(()=>detectVoiceSegments('hello',2),/invalid_audio/);
 assert.throws(()=>detectVoiceSegments(wav(2,[[.3,.9]]),2),/unreliable_segmentation/);
});

