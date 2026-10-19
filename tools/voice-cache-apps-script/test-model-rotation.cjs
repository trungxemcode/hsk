const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const current=path.dirname(__filename),log=[],now=Date.now(),props=new Map([['HSK_WARM_NEXT_SLOT','11']]);
const models=['gemini-2.5-flash-preview-tts','gemini-3.1-flash-tts-preview','gemini-3.8-flash-lite-tts','gemini-3.8-flash-tts'];
const state={requests:[],getProperty:k=>props.get(k)||null,setProperty:(k,v)=>props.set(k,String(v)),deleteProperty:k=>props.delete(k)};
const env={
 UrlFetchApp:{fetch:(url,opt)=>{
  assert.equal(url,'https://hsk-vietnamese-translator.trung-hsk668.workers.dev/voice-precache');
  const payload=JSON.parse(opt.payload);
  assert.equal(payload.action,'status');assert.ok(models.includes(payload.model));
  state.requests.push(payload);
  const retryAfter=payload.model===models[0]?86400:0;
  return {getResponseCode:()=>200,getContentText:()=>JSON.stringify({ok:true,slots:[{slot:11,retryAfter},{slot:12,retryAfter}]})};
 }},
 hskSettings_:()=>state,
 console
};
vm.createContext(env);
vm.runInContext(fs.readFileSync(path.join(current,'ModelRotation.gs'),'utf8'),env);
const first=env.hskVoicePickModel_('stub-owner-token',state,now);
assert.equal(first.chosen.model,models[1]);assert.equal(first.chosen.slot,11);
assert.equal(state.requests.length,4,'one metadata-only status probe per free model');
assert.equal(env.hskWarmEnableFreeModelRotation().enabled,true);
assert.equal(props.get('HSK_WARM_MULTI_MODEL_ENABLED'),'true');
props.set('HSK_WARM_MODEL_CURSOR','2');state.requests.length=0;
const second=env.hskVoicePickModel_('stub-owner-token',state,now);
assert.equal(second.chosen.model,models[2]);assert.equal(second.chosen.slot,11);
props.set(env.hskVoiceModelPairAfterKey_(11,models[2]),String(now+120000));
state.requests.length=0;
const next=env.hskVoicePickModel_('stub-owner-token',state,now);
assert.equal(next.chosen.model,models[2]);assert.equal(next.chosen.slot,12,'blocked slot 11 on model 3.8 Lite does not affect slot 12');
props.set('HSK_WARM_SLOT_12_AFTER',String(now+120000));
state.requests.length=0;
const following=env.hskVoicePickModel_('stub-owner-token',state,now);
assert.equal(following.chosen.model,models[3]);assert.equal(following.chosen.slot,11,'global key cooldown affects all models but pair cooldown stays scoped');
assert.equal(env.hskWarmDisableFreeModelRotation().enabled,false);
assert.equal(props.has('HSK_WARM_MULTI_MODEL_ENABLED'),false);
console.log('PASS GAS: 4 model statuses, 2.5 exhausted -> 3.1/3.8 fallback, round-robin, model/key scoped cooldown, opt-in, no TTS generation.');
