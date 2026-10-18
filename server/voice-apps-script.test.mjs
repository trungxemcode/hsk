import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const dir=new URL('../tools/voice-cache-apps-script/',import.meta.url),core=fs.readFileSync(new URL('Code.gs',dir),'utf8'),warm=fs.readFileSync(new URL('WarmBatch.gs',dir),'utf8');
test('Apps Script distinguishes transient generation errors from permanent failures without exposing vendor messages',()=>{
 for(const [status,error,retryable] of [[502,'tts_generation_incomplete',true],[502,'tts_blocked',false],[502,'tts_provider_unavailable',true],[429,'tts_provider_unavailable',true],[401,'unauthorized',false]]){
  const context=vm.createContext({ScriptApp:{getIdentityToken:()=> 'test-id-token'},Utilities:{},UrlFetchApp:{fetch:()=>({getResponseCode:()=>status,getContentText:()=>JSON.stringify({error,extra:'Never echo arbitrary provider secrets'})})}});vm.runInContext(core,context);
  assert.throws(()=>context.hskWorkerTts_('你好'),e=>{assert.equal(!!e.retryable,retryable);assert.equal(e.message,'cloudflare_tts_'+status+'_'+error);return true;});
 }
});
test('Apps Script WAV header uses signed bytes and correct little-endian RIFF/data sizes',()=>{
 const c=vm.createContext({});vm.runInContext(core,c);const pcm=Array(42602).fill(0),signed=c.hskWav_(pcm,'audio/L16;codec=pcm;rate=24000'),b=Buffer.from(signed);assert.ok(signed.every(n=>n>=-128&&n<=127));assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.readUInt32LE(4),b.length-8);assert.equal(b.readUInt32LE(24),24000);assert.equal(b.readUInt32LE(40),pcm.length);
});
function batchContext(error){
 let time=100000,calls=0;const rows=[],queued=[],props=new Map([['HSK_WARM_ENABLED','true'],['HSK_WARM_CURSOR','0']]);
 const properties={getProperty:k=>props.get(k)||null,setProperty:(k,v)=>props.set(k,v),deleteProperty:k=>props.delete(k)};
 const queue={getLastRow:()=>queued.length+1,appendRow:r=>queued.push(r),getRange:(row)=>({getValues:()=>queued,setValues:v=>queued[row-2]=v[0]})};
 const c=vm.createContext({Date:class extends Date{static now(){return time;}},hskSettings_:()=>properties,hskWarmCorpus_:()=>['爱','八'],hskDigest_:s=>s,ScriptApp:{getProjectTriggers:()=>[]},LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})},Utilities:{newBlob:bytes=>({bytes})},hskCheck_:()=>({sheet:{getLastRow:()=>rows.length+1,getRange:()=>({getValues:()=>rows}),appendRow:r=>rows.push(r)},folder:{createFile:()=>({getId:()=> 'file-test'})}}),hskGenerate_:()=>{calls++;if(calls===1&&error)throw error;return {bytes:[1,2,3,4],index:0};}});
 vm.runInContext(warm,c);c.hskWarmQueue_=()=>queue;c.hskWarmProgress_=()=>{};
 return {c,props,rows,queued,get calls(){return calls;},advance:ms=>time+=ms};
}
test('incomplete audio is deferred while later phrases complete; retries run after 24h',()=>{
 const f=batchContext(Object.assign(Error('cloudflare_tts_502_tts_generation_incomplete'),{retryable:true}));f.c.hskWarmTick();assert.equal(f.props.get('HSK_WARM_CURSOR'),'2');assert.equal(f.rows.length,1);assert.equal(f.queued[0][4],'PENDING');f.c.hskWarmTick();assert.equal(f.calls,2);f.advance(86400001);f.c.hskWarmTick();assert.equal(f.queued[0][4],'DONE');assert.equal(f.rows.length,2);assert.equal(f.props.get('HSK_WARM_ENABLED'),'false');
});
test('refusals become review items without blocking other phrases',()=>{
 const f=batchContext(Error('cloudflare_tts_502_tts_blocked'));f.c.hskWarmTick();assert.equal(f.queued[0][4],'REVIEW');assert.equal(f.rows.length,1);assert.equal(f.props.get('HSK_WARM_CURSOR'),'2');
});
test('quota exhaustion pauses the queue, retains cursor and makes no call before backoff',()=>{
 const f=batchContext(Object.assign(Error('cloudflare_tts_429_tts_provider_unavailable'),{retryable:true}));f.c.hskWarmTick();assert.equal(f.props.get('HSK_WARM_CURSOR'),'0');assert.equal(f.queued.length,0);assert.equal(Number(f.props.get('HSK_WARM_RETRY_AT')),1900000);f.c.hskWarmTick();assert.equal(f.calls,1);f.advance(1800001);f.c.hskWarmTick();assert.equal(f.rows.length,2);
});
test('existing ready files consume no generation calls',()=>{const f=batchContext();f.rows.push([JSON.stringify(['zh-CN','Kore','gemini-2.5-flash-preview-tts','爱']),'','','','file','','','','','','','READY']);f.c.hskWarmTick();assert.equal(f.calls,1);assert.equal(f.rows.length,2);});
test('daily runtime budget pauses and automatically resets after its rolling 24h window',()=>{
 const f=batchContext();f.props.set('HSK_WARM_WINDOW_START','99999');f.props.set('HSK_WARM_RUNTIME_MS','3550000');f.c.hskWarmTick();assert.equal(f.calls,0);f.advance(86400001);f.c.hskWarmTick();assert.equal(f.rows.length,2);
});
test('authentication errors stop without discarding the current phrase',()=>{const f=batchContext(Error('cloudflare_tts_401_unauthorized'));f.c.hskWarmTick();assert.equal(f.props.get('HSK_WARM_ENABLED'),'false');assert.equal(f.props.get('HSK_WARM_CURSOR'),'0');assert.equal(f.queued.length,0);});
