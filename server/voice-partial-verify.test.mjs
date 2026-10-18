import test from 'node:test';
import assert from 'node:assert/strict';
import {hskVoiceMapTranscripts,hskVoiceVerifyPartial} from './voice-partial-verify.mjs';
const expected=['打电话','的','电视','读','对不起'];
const blob='A'.repeat(80),req={action:'verify',items:expected,clips:[blob,blob,blob,blob]};
function fakeProvider(passes){
 let count=0,seen=[];
 return {fetch:async(_url,init)=>{
  seen.push(JSON.parse(init.body));const transcripts=passes[Math.min(count++,passes.length-1)];
  if(transcripts instanceof Error)return Response.json({error:'unavailable'},{status:503});
  return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({transcripts})}]}}]});
 },stats:()=>({count,seen})};
}
test('partial mapping supports missing FIRST, MIDDLE, LAST but never assumes which from count',()=>{
 assert.deepEqual(hskVoiceMapTranscripts(expected,expected.slice(1)),[1,2,3,4]);
 assert.deepEqual(hskVoiceMapTranscripts(expected,[expected[0],expected[1],expected[3],expected[4]]),[0,1,3,4]);
 assert.deepEqual(hskVoiceMapTranscripts(expected,expected.slice(0,4)),[0,1,2,3]);
 assert.equal(hskVoiceMapTranscripts(expected,[expected[0],expected[2]+expected[3],expected[4],expected[1]]),null);
 assert.equal(hskVoiceMapTranscripts(['的','的','电视'],['的','电视']),null);
 assert.equal(hskVoiceMapTranscripts(expected,['你好','的','电视','读']),null);
});
test('double-pass independent transcription proves missing middle, without leaking expected words into provider prompt',async()=>{
 const provider=fakeProvider([['打电话','的','读','对不起'],['打电话','的','读','对不起']]);
 const result=await hskVoiceVerifyPartial(req,provider.fetch,new AbortController().signal);
 assert.deepEqual(result,{status:200,result:{ok:true,indices:[0,1,3,4],verification:'double_asr_exact'}});
 assert.equal(provider.stats().count,2);
 const text=provider.stats().seen[0].contents[0].parts.filter(p=>p.text).map(p=>p.text).join(' ');
 assert.equal(text.includes('打电话'),false);assert.equal(text.includes('电视'),false);
 assert.equal(provider.stats().seen[0].generationConfig.responseMimeType,'application/json');
});
test('different transcriptions cannot write READY, including one ambiguous homophone',async()=>{
 const p=fakeProvider([['打电话','的','读','对不起'],['打电话','地','读','对不起']]);
 const r=await hskVoiceVerifyPartial(req,p.fetch);
 assert.equal(r.status,422);assert.equal(r.result.ok,false);
});
test('garbled content, merged phrase, duplicate or silence fail closed',async()=>{
 for(const transcripts of [['打电话','的','电视读','对不起'],['打电话','的','','对不起'],['打电话','的','的','对不起']]){
  const p=fakeProvider([transcripts]);const r=await hskVoiceVerifyPartial(req,p.fetch);assert.equal(r.status,422);
 }
});
test('provider 429/503 or malformed verification request does not return matches',async()=>{
 const p=fakeProvider([new Error('429')]);const r=await hskVoiceVerifyPartial(req,p.fetch);assert.equal(r.status,503);
 const invalid=await hskVoiceVerifyPartial({...req,clips:[blob]},p.fetch);assert.equal(invalid.status,400);
 assert.equal(p.stats().count,1);
});
test('short 2-item batch supports saving one verified clip and requeueing one',async()=>{
 const p=fakeProvider([['读'],['读']]);
 const r=await hskVoiceVerifyPartial({items:['读','对不起'],clips:[blob]},p.fetch);
 assert.deepEqual(r.result.indices,[0]);
});
