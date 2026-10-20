'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync(__dirname+'/VoiceModelRotation.gs','utf8');
function world(state={}){
 const models=['gemini-2.5-flash-preview-tts','gemini-3.1-flash-tts-preview','gemini-3.8-flash-lite-tts'];
 const values=new Map(),requests=[];
 const p={getProperty:k=>values.get(k),setProperty:(k,v)=>values.set(k,String(v)),deleteProperty:k=>values.delete(k)};
 const ctx={Date,Math,Number,String,Array,JSON,
  hskVocabCall_:(tok,body)=>{requests.push(body.model);const val=state[body.model];
   if(val instanceof Error)throw val;
   return {ok:true,slots:val||[{slot:1,retryAfter:0},{slot:2,retryAfter:0}]};
  }};
 vm.runInNewContext(src,ctx);
 return {p,ctx,requests,models,values};
}
test('exact API model sequence includes officially documented Gemini 3.8 Flash Lite TTS',()=>{
 const w=world();assert.deepEqual(Array.from(w.ctx.hskVoiceTtsModels_()),w.models);
 assert.equal(w.ctx.hskVoiceNextModel_(w.models[0]),w.models[1]);
 assert.equal(w.ctx.hskVoiceNextModel_(w.models[1]),w.models[2]);
 assert.equal(w.ctx.hskVoiceNextModel_(w.models[2]),w.models[0]);
 assert.equal(w.ctx.hskVoiceModelTag_(w.models[2]),'3_8');
});
test('all models are inspected but usable 2.5 key is chosen first',()=>{
 const w=world(),now=Date.now(),found=w.ctx.hskVoiceRoutePairs_(w.p,'token',now,w.models[0],null);
 assert.deepEqual(w.requests,w.models);
 assert.equal(found.pairs[0].model,w.models[0]);
 assert.equal(found.pairs[0].slot,1);
 assert.equal(found.pairs.length,6);
});
test('when all 2.5 keys cool down, available 3.1 chosen before 3.8',()=>{
 const now=Date.now(),w=world({['gemini-2.5-flash-preview-tts']:[{slot:1,retryAfter:3600},{slot:2,retryAfter:3600}]});
 const found=w.ctx.hskVoiceRoutePairs_(w.p,'token',now,w.models[0],null);
 assert.equal(found.pairs[0].model,w.models[1]);
 assert.equal(found.pairs[0].slot,1);
 assert.ok(found.waitUntil>=now+3600000);
});
test('when 2.5 and 3.1 exhausted route to 3.8 Flash-Lite',()=>{
 const w=world({
  ['gemini-2.5-flash-preview-tts']:[{slot:1,retryAfter:600}],
  ['gemini-3.1-flash-tts-preview']:[{slot:1,retryAfter:900}],
  ['gemini-3.8-flash-lite-tts']:[{slot:12,retryAfter:0}]
 });
 const found=w.ctx.hskVoiceRoutePairs_(w.p,'token',Date.now(),w.models[0],null);
 assert.equal(found.pairs.length,1);
 assert.equal(found.pairs[0].model,w.models[2]);
 assert.equal(found.pairs[0].slot,12);
});
test('stored cooldown applies to specific model/key, not to all models',()=>{
 const w=world(),now=Date.now();w.values.set('HSK_VOCAB_PAIR_1_'+w.models[0]+'_AFTER',String(now+800000));
 const found=w.ctx.hskVoiceRoutePairs_(w.p,'token',now,w.models[0],null);
 assert.equal(found.pairs[0].model,w.models[0]);
 assert.equal(found.pairs[0].slot,2);
 assert.ok(found.waitUntil>=now+800000);
});
test('skip a failed pair if other slots/models available',()=>{
 const w=world(),now=Date.now();
 const found=w.ctx.hskVoiceRoutePairs_(w.p,'token',now,w.models[0],{model:w.models[0],slot:1});
 assert.equal(found.pairs[0].slot,2);
});
test('unsupported model status never prevents other supported models',()=>{
 const w=world({['gemini-3.8-flash-lite-tts']:new Error('model_not_supported')});
 const found=w.ctx.hskVoiceRoutePairs_(w.p,'token',Date.now(),w.models[2],null);
 assert.equal(found.pairs[0].model,w.models[0]);
 assert.ok(found.errors[w.models[2]]);
});
test('all three models exhausted means no provider call and future wait',()=>{
 const w=world({
  ['gemini-2.5-flash-preview-tts']:[{slot:2,retryAfter:7200}],
  ['gemini-3.1-flash-tts-preview']:[{slot:2,retryAfter:1800}],
  ['gemini-3.8-flash-lite-tts']:[{slot:2,retryAfter:60}]
 }),now=Date.now();
 const found=w.ctx.hskVoiceRoutePairs_(w.p,'token',now,w.models[0],null);
 assert.equal(found.pairs.length,0);
 assert.ok(found.waitUntil>=now+60000&&found.waitUntil<now+61000);
 assert.equal(w.ctx.hskVoiceEarliestProviderRetry_(now,found.waitUntil)>=now+60000,true);
});

test('scheduled production health scan reports three model slots without exposing keys',()=>{
 const w=world({
  ['gemini-2.5-flash-preview-tts']:[{slot:1,retryAfter:0}],
  ['gemini-3.1-flash-tts-preview']:[{slot:3,retryAfter:300}],
  ['gemini-3.8-flash-lite-tts']:[{slot:8,retryAfter:0},{slot:12,retryAfter:0}]
 });
 const outputs=[];
 const control={getRange:(r,c,h,wid)=>{assert.equal(r,89);assert.equal(c,3);return {setValues:rows=>outputs.push(rows)};}};
 w.ctx.ScriptApp={getIdentityToken:()=> 'mock-token'};
 w.ctx.hskVoiceTtsHealthTick_(w.p,control);
 assert.equal(outputs.length,1);
 assert.equal(outputs[0][1][1],'1_READY_SLOTS_OF_1');
 assert.equal(outputs[0][2][1],'0_READY_SLOTS_OF_1');
 assert.equal(outputs[0][3][1],'2_READY_SLOTS_OF_2');
 assert.equal(JSON.stringify(outputs).includes('mock-token'),false);
 w.ctx.hskVoiceTtsHealthTick_(w.p,control);
 assert.equal(outputs.length,1);
});
