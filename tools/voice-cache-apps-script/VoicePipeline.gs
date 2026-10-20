/** Opt-in 1 producer / 2 verifiers. No activation, trigger or data mutation at load. */
var HSK_PIPELINE_VERSION_='pipeline-v1';
var HSK_PIPELINE_CONTEXT_=null;
var HSK_PIPELINE_PRODUCER_=null;
function hskPipelineEnabled_(){var p=hskSettings_();return p.getProperty('HSK_VOICE_PIPELINE')===HSK_PIPELINE_VERSION_&&Number(p.getProperty('HSK_PIPE_START_AFTER')||0)<=Date.now();}
function hskPipelineDraining_(){var p=hskSettings_();return p.getProperty('HSK_VOICE_PIPELINE')===HSK_PIPELINE_VERSION_&&Number(p.getProperty('HSK_PIPE_START_AFTER')||0)>Date.now();}
function hskPipelineLeaseRead_(p,key){try{return JSON.parse(p.getProperty(key)||'null');}catch(e){throw Error('pipeline_corrupt_lease');}}
function hskPipelineClaim_(p,key,owner,version,now){
 var old=hskPipelineLeaseRead_(p,key);if(old&&old.until>now)return null;
 var lease={key:key,owner:owner,version:version,token:Utilities.getUuid(),until:now+540000};
 p.setProperty(key,JSON.stringify(lease));return lease;
}
function hskPipelineOwns_(p,lease,now){
 var current=lease&&hskPipelineLeaseRead_(p,lease.key);
 return !!(current&&current.token===lease.token&&current.version===lease.version&&current.until>now);
}
function hskPipelineRelease_(p,lease){
 if(hskPipelineOwns_(p,lease,Date.now()))p.deleteProperty(lease.key);
}
function hskPipelineFenceError_(e){if(/^pipeline_/.test(String(e&&e.message||'')))throw e;}
function hskPipelineVerifierProps_(p,batch){
 function key(k){return ['HSK_AUTO50_ASR_BACKOFF','HSK_VOCAB_RETRY_AT','HSK_VOCAB_ERROR','HSK_AUTO50_ASR_ERRORS'].indexOf(k)>=0?'HSK_PIPE_'+batch+'_'+k:k;}
 return {getProperty:function(k){return p.getProperty(key(k));},setProperty:function(k,v){p.setProperty(key(k),v);return this;},deleteProperty:function(k){p.deleteProperty(key(k));return this;}};
}
function hskPipelineRunning_(p,book){
 return hskPipelineEnabled_()&&p.getProperty('HSK_VOCAB_ENABLED')==='true'&&p.getProperty('HSK_VOICE_PAUSED')!=='true'&&
  String(book.getSheetByName('Voice_Control').getRange(2,2).getValue()).trim()==='AUTO_CYCLE';
}
function hskPipelineVerifyBatches_(batches){return batches.filter(function(b){return ['MASTER','VERIFY','AUTO_VERIFY'].indexOf(b[3])>=0;});}
function hskPipelineReservedRows_(batches){
 var rows={};batches.forEach(function(b){if(['TTS_CHUNKS','RESERVED','UNCERTAIN','MASTER','VERIFY','AUTO_VERIFY'].indexOf(b[3])>=0)
  JSON.parse(b[1]).forEach(function(j){rows[j.row]=true;rows['text:'+j.text]=true;});});return rows;
}
/** Release only the currently-held mutation lock; reacquire and fence BEFORE writes. */
function hskPipelineFetch_(url,options){
 var c=HSK_PIPELINE_CONTEXT_;if(!c)return UrlFetchApp.fetch(url,options);
 if(!c.held)throw Error('pipeline_lock_not_held');
 c.lock.releaseLock();c.held=false;
 try{return UrlFetchApp.fetch(url,options);}
 finally{
  try{c.lock.waitLock(30000);c.held=true;}catch(e){throw Error('pipeline_lock_reacquire_failed');}
  if(!hskPipelineOwns_(hskSettings_(),c.lease,Date.now()))throw Error('pipeline_stale_lease');
  if(c.book&&!hskPipelineRunning_(hskSettings_(),c.book))throw Error('pipeline_paused');
 }
}
function hskPipelineAssertBatch_(tables,batch){
 var c=HSK_PIPELINE_CONTEXT_;if(!c)return;
 if(!c.held||!hskPipelineOwns_(hskSettings_(),c.lease,Date.now()))throw Error('pipeline_stale_lease');
 var current=hskVocabRows_(tables.batches,11).find(function(b){return b[0]===batch[0];});
 if(!current||current[2]!==batch[2]||['MASTER','VERIFY','AUTO_VERIFY'].indexOf(current[3])<0)throw Error('pipeline_stale_audio_version');
 if(!hskPipelineRunning_(hskSettings_(),tables.queue.getParent()))throw Error('pipeline_paused');
}
function hskPipelineBackoffKey_(batchId){return 'HSK_PIPE_ASR_BACKOFF_'+batchId;}
function hskPipelineInstallTriggers_(){
 var names=ScriptApp.getProjectTriggers().map(function(t){return t.getHandlerFunction();});
 ['hskPipelineVerify1','hskPipelineVerify2'].forEach(function(name){if(names.indexOf(name)<0)ScriptApp.newTrigger(name).timeBased().everyMinutes(1).create();});
}
function hskPipelineProducerTick_(){
 var p=hskSettings_(),storage=hskCheck_(p),book=storage.sheet.getParent();
 if(!hskPipelineRunning_(p,book))return;
 var lock=LockService.getScriptLock();if(!lock.tryLock(100))return;
 var lease;
 try{
  lease=hskPipelineClaim_(p,'HSK_PIPE_PRODUCER','TTS','single-producer',Date.now());
  if(lease)hskPipelineInstallTriggers_();
 }finally{lock.releaseLock();}
 if(!lease)return;
 HSK_PIPELINE_PRODUCER_=lease;
 try{return hskVocabTickWork_();}
 finally{
  HSK_PIPELINE_PRODUCER_=null;
  if(lock.tryLock(1000)){try{hskPipelineRelease_(p,lease);}finally{lock.releaseLock();}}
 }
}
function hskPipelineVerify1(){return hskPipelineVerifier_(1);}
function hskPipelineVerify2(){return hskPipelineVerifier_(2);}
function hskPipelineVerifier_(lane){
 var p=hskSettings_();if(!hskPipelineEnabled_())return;
 var storage=hskCheck_(p),book=storage.sheet.getParent();if(!hskPipelineRunning_(p,book))return;
 var lock=LockService.getScriptLock();if(!lock.tryLock(100))return;
 var lease,laneLease,started=Date.now(),c;
 try{
  laneLease=hskPipelineClaim_(p,'HSK_PIPE_LANE_'+lane,String(lane),'verifier',Date.now());if(!laneLease)return;
  var tables=hskVocabTables_(storage),batches=hskVocabRows_(tables.batches,11),eligible=hskPipelineVerifyBatches_(batches);
  for(var i=0;i<eligible.length;i++){
   var batch=eligible[i];lease=hskPipelineClaim_(p,'HSK_PIPE_BATCH_'+batch[0],String(lane),batch[2],Date.now());
   if(lease)break;
  }
  if(!lease)return;
  c={lock:lock,held:true,lease:lease,lane:lane,book:book};HSK_PIPELINE_CONTEXT_=c;
  var rows=hskVocabRows_(tables.queue,17),index=batches.indexOf(batch);
  hskAuto50VerifyTick_(storage,tables,rows,batches,index,ScriptApp.getIdentityToken(),started);
  p.setProperty('HSK_PIPE_LANE_'+lane+'_STATUS',JSON.stringify({batch:batch[0],at:hskVNTime_(new Date()),status:'CHECKED'}));
 }catch(e){
  if(c&&c.held)p.setProperty('HSK_PIPE_LANE_'+lane+'_STATUS',JSON.stringify({at:hskVNTime_(new Date()),status:String(e.message||'pipeline_error').slice(0,120)}));
 }finally{
  if(!c||c.held){if(lease)hskPipelineRelease_(p,lease);if(laneLease)hskPipelineRelease_(p,laneLease);lock.releaseLock();}
  HSK_PIPELINE_CONTEXT_=null;
 }
}
/** Guarded owner activation; only run after sandbox and integration tests pass. */
function hskPipelineActivate(){
 var p=hskSettings_(),lock=LockService.getScriptLock();lock.waitLock(30000);
 try{
  if(p.getProperty('HSK_PIPELINE_TESTED_VERSION')!==HSK_PIPELINE_VERSION_)throw Error('pipeline_tests_not_confirmed');
  // Existing GAS executions keep their old code snapshot. Drain beyond the
  // six-minute execution ceiling before leases become authoritative.
  p.setProperty('HSK_PIPE_START_AFTER',String(Date.now()+540000));
  p.setProperty('HSK_VOICE_PIPELINE',HSK_PIPELINE_VERSION_);hskPipelineInstallTriggers_();
 }finally{lock.releaseLock();}
}
function hskPipelineDisable(){
 var p=hskSettings_(),lock=LockService.getScriptLock();lock.waitLock(30000);
 try{
  // Do not resume legacy while a new worker can still be in flight.
  if(Object.keys(p.getProperties()).some(function(k){if(!/^HSK_PIPE_(PRODUCER$|BATCH_|LANE_[12]$)/.test(k))return false;var l=hskPipelineLeaseRead_(p,k);return l&&l.until>Date.now();}))throw Error('pipeline_workers_still_running');
  p.deleteProperty('HSK_VOICE_PIPELINE');p.deleteProperty('HSK_PIPE_START_AFTER');
  ScriptApp.getProjectTriggers().filter(function(t){return /^hskPipelineVerify[12]$/.test(t.getHandlerFunction());}).forEach(function(t){ScriptApp.deleteTrigger(t);});
 }finally{lock.releaseLock();}
}
