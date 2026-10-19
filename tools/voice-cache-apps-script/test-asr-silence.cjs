const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const dir=__dirname,ctx={console};
vm.createContext(ctx);
for(const n of ['Code.gs','IsolatedBatch.gs','AsrSilence.gs'])vm.runInContext(fs.readFileSync(path.join(dir,n),'utf8'),ctx);
ctx.Utilities={base64Decode:s=>Array.from(Buffer.from(s,'base64'),n=>n>127?n-256:n),base64Encode:a=>Buffer.from(a.map(n=>n&255)).toString('base64')};
const raw=Array.from({length:48000},(_,i)=>i%255-127),wav=ctx.hskWav_(raw,'audio/l16'),clip=ctx.Utilities.base64Encode(wav);
let body={action:'verify-words',items:['sample'],clips:[clip]},out=ctx.hskAsrPrepareBody_(body);
assert.equal(body.clips[0],clip);assert.notEqual(out.clips[0],clip);
const padded=ctx.hskBatchPcm_(ctx.Utilities.base64Decode(out.clips[0]));
assert.equal(padded.length,raw.length+192000);
assert(padded.slice(0,96000).every(n=>n===0));assert(padded.slice(-96000).every(n=>n===0));
assert.deepEqual(Array.from(padded.slice(96000,-96000)),raw);
for(const count of [1,2,5,8]){
 const enc=ctx.hskAsrPadClips_(Array(count).fill(clip));
 assert(enc.every(s=>s.length<=350000));assert(enc.reduce((n,s)=>n+s.length,0)<=650000);
 enc.forEach(s=>{const pcm=ctx.hskBatchPcm_(ctx.Utilities.base64Decode(s)),n=(pcm.length-raw.length)/2;assert.deepEqual(Array.from(pcm.slice(n,n+raw.length)),raw);});
}
const tts={items:['sample']};assert.equal(ctx.hskAsrPrepareBody_(tts),tts);
assert.throws(()=>ctx.hskAsrPadClips_(['AAAA']),/batch_invalid_wav/);
console.log('PASS: 2s zero PCM on each side; original speech and caller unchanged; valid WAV; 1/2/5/8-clip budgets; TTS unaffected; invalid WAV rejected.');
