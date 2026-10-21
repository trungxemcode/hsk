/** One leased TTS producer and two leased batch consumers. No acceptance-policy changes. */
var HSK_PV_CONTEXT_=null;
var HSK_PV_LEASE_MS_=420000; // Greater than the Apps Script six-minute execution limit.
function hskPVNow_(){return Utilities.formatDate(new Date(),'Asia/Ho_Chi_Minh',"yyyy-MM-dd'T'HH:mm:ss.SSSXXX");}
function hskPVRead_(p,key){try{return JSON.parse(p.getProperty(key)||'null');}catch(e){throw Error('parallel_lease_corrupt');}}
function hskPVLive_(lease){return !!lease&&Number(lease.until)>Date.now();}
function hskPVKey_(lane){return 'HSK_PV_LANE_'+lane;}
function hskPVVerifyState_(state){return ['MASTER','VERIFY','AUTO_VERIFY'].indexOf(state)>=0;}
function hskPVEnabled_(p){return p.getProperty('HSK_PV_ENABLED')==='true'&&p.getProperty('HSK_AUTO50_ENABLED')==='true'&&p.getProperty('HSK_VOCAB_PILOT_ONLY')!=='true';}
function hskPVControl_(p){var b=SpreadsheetApp.openById(p.getProperty('HSK_VOICE_SHEET_ID'));return b.getSheetByName('Voice_Control');}
function hskPVAllowed_(p){return hskPVEnabled_(p)&&p.getProperty('HSK_VOCAB_ENABLED')==='true'&&p.getProperty('HSK_VOICE_PAUSED')!=='true'&&String(hskPVControl_(p).getRange(2,2).getValue())==='AUTO_CYCLE';}
function hskPVFatal_(message){var e=Error(message);e.hskParallelFatal=true;return e;}
function hskPVAssert_(){
 var c=HSK_PV_CONTEXT_;if(!c)return;
 var own=hskPVRead_(c.p,c.key);
 if(!hskPVLive_(own)||own.token!==c.token)throw hskPVFatal_('parallel_lease_lost');
 if(!hskPVAllowed_(c.p))throw hskPVFatal_('parallel_paused');
 if(c.rows&&c.jobs){
  var fresh=hskVocabRows_(c.tables.queue,17);
  c.jobs.forEach(function(j){
   var r=fresh[j.row],expected=c.rows[j.row];
   if(!r||String(r[1])!==String(j.text)||String(r[2])!==String(j.pinyin)||
     r[3]!==expected[3]||r[6]!==expected[6]||r[9]!==expected[9])throw hskPVFatal_('parallel_source_changed');
  });
 }
}
/** Flush durable ownership before releasing only the short-lived sheet lock. */
function hskPVOutside_(run){
 var c=HSK_PV_CONTEXT_;if(!c)return run();
 hskPVAssert_();SpreadsheetApp.flush();c.lock.releaseLock();
 var result,error;
 try{result=run();}catch(e){error=e;}
 // No caller may checkpoint if lock acquisition or the ownership check fails.
 try{c.lock.waitLock(180000);}catch(e){throw hskPVFatal_('parallel_commit_lock_timeout');}
 hskPVAssert_();if(error)throw error;return result;
}
/** A timed-out producer cannot silently resubmit a paid request with no saved reply. */
function hskPVTts_(batch,run){
 var c=HSK_PV_CONTEXT_;if(!c)return run();
 c.ttsBatch=String(batch[0]);c.ttsBefore=JSON.stringify(batch);
 c.p.setProperty('HSK_PV_TTS_INFLIGHT',JSON.stringify({batch:batch[0],token:c.token,at:Date.now()}));
 return hskPVOutside_(run);
}
function hskPVTtsFetch_(batch,url,options){return hskPVTts_(batch,function(){return UrlFetchApp.fetch(url,options);});}
function hskPVTtsDirect_(batch,p,text,model){return hskPVTts_(batch,function(){return hskVoiceDirectTts_(p,text,model);});}
function hskPVRecoverInflight_(p,tables,batches){
 if(!hskPVEnabled_(p))return false;
 var prior=hskPVRead_(p,'HSK_PV_TTS_INFLIGHT');if(!prior)return false;
 var index=batches.findIndex(function(b){return b[0]===prior.batch;});
 if(index<0)throw Error('parallel_uncertain_journal_missing');
 if(['TTS_CHUNKS','RESERVED'].indexOf(batches[index][3])>=0){
  batches[index][3]='UNCERTAIN';batches[index][4]='parallel_producer_interrupted_paid_call_uncertain';
  tables.batches.getRange(index+2,1,1,11).setValues([batches[index]]);
 }
 p.setProperty('HSK_PV_LAST_UNCERTAIN',JSON.stringify(prior));p.deleteProperty('HSK_PV_TTS_INFLIGHT');
 p.setProperty('HSK_VOCAB_ERROR','parallel_producer_interrupted_paid_call_uncertain');
 return true;
}
function hskPVVerifyCall_(token,body){return hskPVOutside_(function(){return hskVocabCall_(token,body);});}
/** Separate ASR backoff/error state from TTS, and separate each master from the other. */
function hskPVProps_(p,id){
 function key(k){return ['HSK_AUTO50_ASR_BACKOFF','HSK_AUTO50_ASR_ERRORS','HSK_AUTO50_LAST_ASR_ERROR','HSK_VOCAB_RETRY_AT','HSK_VOCAB_ERROR'].indexOf(k)>=0?'HSK_PV_BATCH_'+id+'_'+k:k;}
 return {getProperty:function(k){return p.getProperty(key(k));},setProperty:function(k,v){p.setProperty(key(k),v);return this;},deleteProperty:function(k){p.deleteProperty(key(k));return this;}};
}
function hskPVClaim_(p,lane,batches){
 if(lane!==1&&lane!==2)throw Error('parallel_invalid_lane');
 var key=hskPVKey_(lane),own=hskPVRead_(p,key);if(hskPVLive_(own))return null;
 var other=hskPVRead_(p,hskPVKey_(lane===1?2:1));
 var index=batches.findIndex(function(b){
  if(!hskPVVerifyState_(b[3])||!b[2]||hskPVLive_(other)&&other.batch===b[0])return false;
  var q=hskPVProps_(p,b[0]);return Number(q.getProperty('HSK_VOCAB_RETRY_AT')||0)<=Date.now();
 });
 if(index<0)return null;
 var lease={token:Utilities.getUuid(),batch:String(batches[index][0]),until:Date.now()+HSK_PV_LEASE_MS_};
 p.setProperty(key,JSON.stringify(lease));return {key:key,lease:lease,index:index};
}
/** Reserve existing master jobs after a legacy crash, before producer selection. */
function hskPVReserve_(tables,rows,batches){
 var occupied={};
 batches.filter(function(b){return hskPVVerifyState_(b[3])||b[3]==='TTS_CHUNKS';}).forEach(function(b){
  JSON.parse(b[1]).forEach(function(j){
   var r=rows[j.row];if(!r||String(r[1])!==String(j.text)||String(r[2])!==String(j.pinyin))throw Error('parallel_source_changed');
   if(occupied[j.row]&&occupied[j.row]!==b[0])throw Error('parallel_overlapping_batches');occupied[j.row]=b[0];
   if(!hskPVVerifyState_(b[3])||['READY','EXISTING'].indexOf(r[3])>=0)return;
   if(['PENDING','RETRY'].indexOf(r[3])>=0){r[3]='MASTER';r[6]=b[0];r[7]=j.model;r[8]=b[2];hskVocabWrite_(tables.queue,j.row,r);}
  });
 });
 return occupied;
}
function hskPVBusy_(batches){return batches.some(function(b){return hskPVVerifyState_(b[3])||['TTS_CHUNKS','RESERVED','UNCERTAIN'].indexOf(b[3])>=0;});}
function hskPVEnsure_(p){
 if(p.getProperty('HSK_PV_ENABLED')==='false')return;
 if(p.getProperty('HSK_PV_ENABLED')!=='true')p.setProperty('HSK_PV_ENABLED','true');
 var lock=LockService.getScriptLock();if(!lock.tryLock(100))return;
 try{
  var triggers=ScriptApp.getProjectTriggers();
  ['hskParallelCheck1Tick','hskParallelCheck2Tick'].forEach(function(name){
   if(!triggers.some(function(t){return t.getHandlerFunction()===name;}))ScriptApp.newTrigger(name).timeBased().everyMinutes(1).create();
  });
 }finally{lock.releaseLock();}
}
/** Called only inside the existing producer's script lock. */
function hskPVProducerEnter_(p,lock){
 if(!hskPVEnabled_(p))return true;
 var key='HSK_PV_PRODUCER',prior=hskPVRead_(p,key);if(hskPVLive_(prior))return false;
 var token=Utilities.getUuid();p.setProperty(key,JSON.stringify({token:token,until:Date.now()+HSK_PV_LEASE_MS_}));
 HSK_PV_CONTEXT_={p:p,key:key,token:token,lock:lock};return true;
}
function hskPVRelease_(){
 var c=HSK_PV_CONTEXT_;if(!c)return;
 if(c.lock.hasLock()){
  var prior=hskPVRead_(c.p,c.key);
  if(prior&&prior.token===c.token){
  if(c.ttsBatch){
   // A provider reply is not a durable audio save. Clear the paid-call marker
   // only after the existing writer has flushed a changed batch checkpoint.
   SpreadsheetApp.flush();
   var book=SpreadsheetApp.openById(c.p.getProperty('HSK_VOICE_SHEET_ID'));
   var journal=hskVocabRows_(book.getSheetByName('Voice_Vocab_Batches'),11);
   var saved=journal.find(function(b){return String(b[0])===c.ttsBatch;});
   var inflight=hskPVRead_(c.p,'HSK_PV_TTS_INFLIGHT');
   if(saved&&JSON.stringify(saved)!==c.ttsBefore&&inflight&&inflight.token===c.token)c.p.deleteProperty('HSK_PV_TTS_INFLIGHT');
  }
  c.p.deleteProperty(c.key);
  }
 }
 HSK_PV_CONTEXT_=null;
}
function hskParallelCheck1Tick(){return hskPVCheck_(1);}
function hskParallelCheck2Tick(){return hskPVCheck_(2);}
function hskPVCheck_(lane){
 var p=hskSettings_();if(!hskPVAllowed_(p))return;
 var lock=LockService.getScriptLock();if(!lock.tryLock(100))return;
 var started=Date.now(),claim;
 try{
  if(!hskPVAllowed_(p))return;
  var storage=hskCheck_(p),tables=hskVocabTables_(storage),rows=hskVocabRows_(tables.queue,17),batches=hskVocabRows_(tables.batches,11);
  hskPVReserve_(tables,rows,batches);
  claim=hskPVClaim_(p,lane,batches);if(!claim)return;
  HSK_PV_CONTEXT_={p:p,key:claim.key,token:claim.lease.token,lock:lock};
  p.setProperty('HSK_PV_STATUS_'+lane,'CHECKING '+claim.lease.batch+' '+hskPVNow_());
  var jobs=JSON.parse(batches[claim.index][1]);
  if(!jobs.length||jobs.some(function(j){return !rows[j.row]||String(rows[j.row][1])!==String(j.text)||String(rows[j.row][2])!==String(j.pinyin);}))throw Error('parallel_source_changed');
  HSK_PV_CONTEXT_.jobs=jobs;HSK_PV_CONTEXT_.rows=rows;HSK_PV_CONTEXT_.tables=tables;
  // Adopt an outstanding legacy ASR delay without clearing provider Retry-After.
  var scoped=hskPVProps_(p,claim.lease.batch),priorBackoff=hskPVRead_(p,'HSK_AUTO50_ASR_BACKOFF');
  if(priorBackoff&&priorBackoff.batch===claim.lease.batch&&!scoped.getProperty('HSK_AUTO50_ASR_BACKOFF'))
   scoped.setProperty('HSK_AUTO50_ASR_BACKOFF',JSON.stringify(priorBackoff));
  hskPVBatchVerify_(storage,tables,rows,batches,claim.index,ScriptApp.getIdentityToken(),started,scoped);
  var terminal=!hskPVVerifyState_(batches[claim.index][3]);
  if(terminal){
   ['HSK_AUTO50_ASR_BACKOFF','HSK_AUTO50_ASR_ERRORS','HSK_AUTO50_LAST_ASR_ERROR','HSK_VOCAB_RETRY_AT','HSK_VOCAB_ERROR'].forEach(function(k){hskPVProps_(p,claim.lease.batch).deleteProperty(k);});
  }
  p.setProperty('HSK_PV_STATUS_'+lane,(terminal?'FINISHED ':'CHECKPOINT ')+claim.lease.batch+' '+hskPVNow_());
 }catch(e){
  if(lock.hasLock())p.setProperty('HSK_PV_STATUS_'+lane,'ERROR '+String(e.message||e).slice(0,120)+' '+hskPVNow_());
  console.warn('parallel_checker_'+lane+':'+String(e.message||e).slice(0,120));
 }finally{
  if(lock.hasLock()){
   hskPVRelease_();
   // Owner-visible state, outside reserved release/progress cells.
   try{var status=hskVocabTable_(hskPVControl_(p).getParent(),'Voice_Parallel_Status',['Key','Value']);status.getRange(2,1,3,2).setValues([
    ['Parallel_pipeline','1 TTS / 2 ASR; max 3 masters waiting'],
    ['Parallel_check_1',p.getProperty('HSK_PV_STATUS_1')||'IDLE'],
    ['Parallel_check_2',p.getProperty('HSK_PV_STATUS_2')||'IDLE']
   ]);}catch(ignore){}
   lock.releaseLock();
  }
 }
}
