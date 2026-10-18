import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const dir=new URL('../tools/voice-cache-apps-script/',import.meta.url),core=fs.readFileSync(new URL('Code.gs',dir),'utf8'),warm=fs.readFileSync(new URL('WarmBatch.gs',dir),'utf8');
test('Apps Script distinguishes transient generation errors from permanent failures without exposing vendor messages',()=>{
 for(const [status,error,retryable] of [[502,'tts_generation_incomplete',true],[502,'tts_blocked',false],[429,'tts_provider_unavailable',true],[401,'unauthorized',false]]){
  const context=vm.createContext({ScriptApp:{getIdentityToken:()=> 'test-id-token'},Utilities:{},UrlFetchApp:{fetch:()=>({getResponseCode:()=>status,getContentText:()=>JSON.stringify({error,extra:'Never echo arbitrary provider secrets'})})}});vm.runInContext(core,context);
  assert.throws(()=>context.hskWorkerTts_('你好'),e=>{assert.equal(!!e.retryable,retryable);assert.equal(e.message,'cloudflare_tts_'+status+'_'+error);return true;});
 }
});
test('Apps Script WAV header uses signed bytes and correct little-endian RIFF/data sizes',()=>{
 const c=vm.createContext({});vm.runInContext(core,c);const pcm=Array(42602).fill(0),signed=c.hskWav_(pcm,'audio/L16;codec=pcm;rate=24000'),b=Buffer.from(signed);assert.ok(signed.every(n=>n>=-128&&n<=127));assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.readUInt32LE(4),b.length-8);assert.equal(b.readUInt32LE(24),24000);assert.equal(b.readUInt32LE(40),pcm.length);
});
function batchContext(retryable){
 let time=1000,calls=0;const rows=[],props=new Map([['HSK_WARM_ENABLED','true'],['HSK_WARM_CURSOR','4']]),properties={getProperty:k=>props.get(k)||null,setProperty:(k,v)=>props.set(k,v),deleteProperty:k=>props.delete(k)};
 const c=vm.createContext({Date:class extends Date{static now(){return time;}},hskSettings_:()=>properties,hskWarmCorpus_:()=>['爱','八','爸爸','杯子','北京'],hskDigest_:s=>s,ScriptApp:{getProjectTriggers:()=>[]},LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})},Utilities:{newBlob:bytes=>({bytes})},hskCheck_:()=>({sheet:{getLastRow:()=>1,appendRow:row=>rows.push(row)},folder:{createFile:()=>({getId:()=> 'file-test'})}}),hskGenerate_:()=>{calls++;if(calls===1){const e=Error('cloudflare_tts_502_tts_generation_incomplete');e.retryable=retryable;throw e;}return {bytes:[1,2,3,4],index:0};}});vm.runInContext(warm,c);return {c,props,rows,get calls(){return calls;},advance:()=>time=Number(props.get('HSK_WARM_RETRY_AT'))+1};
}
test('bulk warm-up keeps cursor, waits through backoff and resumes the same item without recreating completed items',()=>{
 const f=batchContext(true);f.c.hskWarmTick();assert.equal(f.props.get('HSK_WARM_CURSOR'),'4');assert.equal(f.props.get('HSK_WARM_ENABLED'),'true');assert.ok(Number(f.props.get('HSK_WARM_RETRY_AT'))>1000);assert.equal(f.rows.length,0);f.c.hskWarmTick();assert.equal(f.calls,1,'no generation before retry time');f.advance();f.c.hskWarmTick();assert.equal(f.calls,2);assert.equal(f.rows.length,1);assert.equal(f.props.get('HSK_WARM_CURSOR'),'5');assert.equal(f.props.has('HSK_WARM_LAST_ERROR'),false);assert.equal(f.props.get('HSK_WARM_ENABLED'),'false','stop after all phrases finish');
});
test('permanent refusal pauses warm-up without skipping the failed phrase',()=>{const f=batchContext(false);f.c.hskWarmTick();assert.equal(f.props.get('HSK_WARM_CURSOR'),'4');assert.equal(f.props.get('HSK_WARM_ENABLED'),'false');assert.equal(f.rows.length,0);assert.equal(f.props.has('HSK_WARM_RETRY_AT'),false);});
