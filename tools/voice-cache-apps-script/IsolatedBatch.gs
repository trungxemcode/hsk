/** Durable master -> DSP -> individual cache. One generation request per tick. */
function hskBatchTable_(storage) {
  var book=storage.sheet.getParent(),sheet=book.getSheetByName('Voice_Batches');
  if(!sheet){sheet=book.insertSheet('Voice_Batches');sheet.appendRow(['Batch','Jobs_JSON','Master_file','State','Error','Created','Slot']);sheet.setFrozenRows(1);}
  return sheet;
}
function hskBatchRows_(sheet,width){return sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,width).getValues():[];}
function hskBatchPcm_(bytes){
  function u16(i){return (bytes[i]&255)+(bytes[i+1]&255)*256;}
  function u32(i){return u16(i)+u16(i+2)*65536;}
  function tag(i){return String.fromCharCode.apply(null,bytes.slice(i,i+4).map(function(v){return v&255;}));}
  if(bytes.length<44||tag(0)!=='RIFF'||tag(8)!=='WAVE'||u32(4)!==bytes.length-8)throw Error('batch_invalid_wav');
  var pcm=null,format=false;
  for(var i=12;i<bytes.length;){
    if(i+8>bytes.length)throw Error('batch_invalid_wav');
    var n=u32(i+4),start=i+8;if(start+n>bytes.length)throw Error('batch_invalid_wav');
    if(tag(i)==='fmt '){if(format||n<16||u16(start)!==1||u16(start+2)!==1||u32(start+4)!==24000||u16(start+12)!==2||u16(start+14)!==16)throw Error('batch_invalid_format');format=true;}
    if(tag(i)==='data'){if(pcm||!n||n%2)throw Error('batch_invalid_wav');pcm=bytes.slice(start,start+n);}
    i=start+n+n%2;
  }
  if(!format||!pcm)throw Error('batch_invalid_wav');return pcm;
}
function hskBatchSplit_(bytes,expected){
  var pcm=hskBatchPcm_(bytes),frame=480,levels=[],peak=0;
  for(var i=0;i<pcm.length;i+=frame*2){
    var end=Math.min(pcm.length,i+frame*2),sum=0;
    for(var j=i;j<end;j+=2){var sample=(pcm[j]&255)+(pcm[j+1]&255)*256;if(sample>=32768)sample-=65536;sum+=sample*sample;}
    var rms=Math.sqrt(sum/((end-i)/2))/32768;levels.push(rms);peak=Math.max(peak,rms);
  }
  if(peak<0.004)throw Error('batch_silent_audio');
  // Reanalyse the SAME master at conservative thresholds; never regenerate to tune DSP.
  var matches=[];
  [0.012,0.02,0.03].forEach(function(ratio){
    var threshold=Math.max(0.002,peak*ratio),segments=[],begin=-1,last=-1;
    levels.forEach(function(rms,k){
      if(rms>threshold){if(begin<0)begin=k;last=k;}
      else if(begin>=0&&(k-last)*20>=460){segments.push([begin*480,(last+1)*480]);begin=-1;}
    });
    if(begin>=0)segments.push([begin*480,Math.min(pcm.length/2,(last+1)*480)]);
    if(segments.length===expected&&segments.every(function(s){return s[1]-s[0]>=2400;}))matches.push(segments);
  });
  if(matches.length<2)throw Error('batch_segment_count_mismatch');
  var segments=matches[0];
  if(matches.some(function(candidate){return candidate.some(function(s,i){return Math.abs(s[0]-segments[i][0])>2400||Math.abs(s[1]-segments[i][1])>2400;});}))throw Error('batch_unstable_boundaries');
  return segments.map(function(s,i){
    var from=Math.max(0,s[0]-2880),to=Math.min(pcm.length/2,s[1]+4800);
    if(i&&from<segments[i-1][1]||i+1<segments.length&&to>segments[i+1][0])throw Error('batch_overlapping_padding');
    return hskWav_(pcm.slice(from*2,to*2),'audio/l16');
  });
}
function hskBatchCommit_(storage,journal,rowNumber,row,queue,deferred){
  var jobs=JSON.parse(row[1]),master=DriveApp.getFileById(row[2]).getBlob().getBytes(),clips=hskBatchSplit_(master,jobs.length),saved=0;
  // No individual file or READY row is written before the ENTIRE master passes validation.
  jobs.forEach(function(job,i){
    var found=hskGetRow_(storage.sheet,job.key),old=found&&found.values;
    if(!old||old[11]!=='READY'){
      var name='hsk-tts-'+job.key.slice(0,24)+'.wav',files=storage.folder.getFilesByName(name),file=files.hasNext()?files.next():storage.folder.createFile(Utilities.newBlob(clips[i],'audio/wav',name));
      var stamp=new Date().toISOString(),values=[job.key,'zh-CN','Kore',job.model,file.getId(),'audio/wav',clips[i].length,stamp,stamp,0,row[6],'READY','isolated_batch:'+row[0]];
      if(found)storage.sheet.getRange(found.index,1,1,13).setValues([values]);else storage.sheet.appendRow(values);saved++;
    }
    deferred.forEach(function(r,k){if(Number(r[0])===job.index&&r[4]!=='DONE'){r[4]='DONE';queue.getRange(k+2,1,1,6).setValues([r]);}});
  });
  row[3]='DONE';row[4]='';journal.getRange(rowNumber,1,1,7).setValues([row]);return saved;
}
function hskBatchReject_(journal,rowNumber,row,queue,deferred,p,reason){
  row[3]='REJECTED';row[4]=reason;journal.getRange(rowNumber,1,1,7).setValues([row]);
  JSON.parse(row[1]).forEach(function(j){hskParallelQueue_(queue,deferred,j.index,j.text,reason,true,90000,1);});
  p.setProperty('HSK_WARM_ISOLATED_SIZE',String(Math.max(1,Math.floor(Number(p.getProperty('HSK_WARM_ISOLATED_SIZE')||5)/2))));
  p.setProperty('HSK_WARM_LAST_ERROR',reason);p.setProperty('HSK_WARM_RETRY_AT',String(Date.now()+90000));
}
function hskWarmConfigureIsolated(){
  var p=hskSettings_();p.setProperty('HSK_WARM_ISOLATED','true');p.setProperty('HSK_WARM_ISOLATED_SIZE','5');p.setProperty('HSK_WARM_ENABLED','true');
  p.deleteProperty('HSK_WARM_RETRY_AT');p.deleteProperty('HSK_WARM_PAUSE_REASON');
  ScriptApp.getProjectTriggers().filter(function(t){return t.getHandlerFunction()==='hskWarmTick';}).forEach(function(t){ScriptApp.deleteTrigger(t);});
  ScriptApp.newTrigger('hskWarmTick').timeBased().everyMinutes(1).create();
  return hskWarmStatus();
}
function hskWarmIsolatedTick(){
  var p=hskSettings_(),now=Date.now();
  if(p.getProperty('HSK_WARM_ENABLED')!=='true'||p.getProperty('HSK_VOICE_PAUSED')==='true'||Number(p.getProperty('HSK_WARM_RETRY_AT')||0)>now)return;
  var lock=LockService.getScriptLock();if(!lock.tryLock(100))return;
  var started=Date.now(),storage;
  try{
    var windowStart=Number(p.getProperty('HSK_WARM_WINDOW_START')||0);
    if(!windowStart||now>=windowStart+86400000){windowStart=now;p.setProperty('HSK_WARM_WINDOW_START',String(now));p.setProperty('HSK_WARM_RUNTIME_MS','0');p.setProperty('HSK_WARM_CALLS','0');}
    if(Number(p.getProperty('HSK_WARM_RUNTIME_MS')||0)+100000>=Number(p.getProperty('HSK_WARM_RUNTIME_LIMIT_MS')||3600000)){p.setProperty('HSK_WARM_RETRY_AT',String(windowStart+86400000));return;}
    storage=hskCheck_(p);
    var journal=hskBatchTable_(storage),batches=hskBatchRows_(journal,7),queue=hskWarmQueue_(storage),deferred=hskBatchRows_(queue,6);
    // Recover saved masters FIRST. An interrupted save/cut never calls Gemini again.
    for(var b=0;b<batches.length;b++){
      var prior=batches[b];if(prior[3]==='DONE'||prior[3]==='REJECTED'||prior[3]==='PARTIAL')continue;
      if(!prior[2]){var files=storage.folder.getFilesByName('MASTER_BATCH_'+prior[0]+'.wav');if(files.hasNext())prior[2]=files.next().getId();}
      if(prior[2]){
        try{var recovered=hskBatchCommit_(storage,journal,b+2,prior,queue,deferred);p.setProperty('HSK_WARM_SAVED_SINCE_FIX',String(Number(p.getProperty('HSK_WARM_SAVED_SINCE_FIX')||0)+recovered));}
        catch(e){if(/^batch_segment_count_mismatch$|^batch_unstable_boundaries$|^batch_silent_audio$/.test(String(e.message))){if(e.message==='batch_segment_count_mismatch'&&hskPartialHandleMismatch_(storage,journal,b+2,prior,queue,deferred,p))return;hskBatchReject_(journal,b+2,prior,queue,deferred,p,e.message);return;}prior[3]='REVIEW';prior[4]=/^batch_/.test(String(e.message))?e.message:'batch_save_failed';journal.getRange(b+2,1,1,7).setValues([prior]);p.setProperty('HSK_WARM_LAST_ERROR',prior[4]);p.setProperty('HSK_WARM_ENABLED','false');return;}
      }else if(prior[3]!=='FAILED'){
        prior[3]='REVIEW';prior[4]='batch_transport_uncertain';journal.getRange(b+2,1,1,7).setValues([prior]);p.setProperty('HSK_WARM_LAST_ERROR',prior[4]);p.setProperty('HSK_WARM_ENABLED','false');return;
      }
    }
    var token=ScriptApp.getIdentityToken(),health=hskParallelAvailability_(token),earliest=Infinity,slot=null;
    var next=Number(p.getProperty('HSK_WARM_NEXT_SLOT')||1);
    // Prefer keys with verified completed batches; inspect unhealthy keys separately.
    var scores={},candidates=[];
    batches.forEach(function(r){var n=Number(r[6]);if(r[6]===''||!Number.isInteger(n)||n<0||n>9)return;var delta=r[3]==='DONE'?1:r[3]==='FAILED'?-1:0;scores[n]=(scores[n]||0)+delta;});
    for(var lane=0;lane<10;lane++){var n=(next+lane)%10,item=health.filter(function(s){return s.slot===n;})[0];if(!item)continue;var until=Math.max(now+Number(item.retryAfter||0)*1000,Number(p.getProperty('HSK_WARM_SLOT_'+n+'_AFTER')||0));if(until<=now)candidates.push({slot:n,score:scores[n]||0,order:lane});else earliest=Math.min(earliest,until);}
    candidates.sort(function(a,b){return b.score-a.score||a.order-b.order;});
    if(candidates.length)slot=candidates[0].slot;
    if(slot===null){p.setProperty('HSK_WARM_RETRY_AT',String(earliest<Infinity?earliest:now+3600000));p.setProperty('HSK_WARM_LAST_ERROR','tts_keys_cooling');return;}
    var texts=hskWarmCorpus_(),model=p.getProperty('HSK_WARM_SLOT_'+slot+'_MODEL')||p.getProperty('HSK_VOICE_MODEL')||'gemini-2.5-flash-preview-tts',records=hskBatchRows_(storage.sheet,13),ready=new Set();
    records.forEach(function(r){if(r[11]==='READY'&&r[4])ready.add(String(r[0]));});
    function isReady(text){return [model,p.getProperty('HSK_VOICE_MODEL')||'gemini-2.5-flash-preview-tts','gemini-3.1-flash-tts-preview'].some(function(m){return ready.has(hskDigest_(JSON.stringify(['zh-CN','Kore',m,text])));});}
    // Repair known failed TTS outputs, including old REVIEW/attempt-exhausted errors, once under this new strategy.
    if(p.getProperty('HSK_BATCH_REPAIR_POLICY')!=='isolated-v1'){
      deferred.forEach(function(r,i){if(r[4]!=='DONE'&&/tts_generation_incomplete|invalid_tts_audio|tts_provider_unavailable|tts_daily_limit|tts_rate_limited|tts_key_invalid|tts_permission_denied|tts_quota_unavailable/.test(String(r[5]))){r[2]=0;r[3]=now;r[4]='PENDING';queue.getRange(i+2,1,1,6).setValues([r]);}});
      p.setProperty('HSK_BATCH_REPAIR_POLICY','isolated-v1');
    }
    var jobs=[],seen=new Set(),characters=0,max=Math.max(1,Math.min(10,Number(p.getProperty('HSK_WARM_ISOLATED_SIZE')||5)));
    if(model==='gemini-3.1-flash-tts-preview')max=1;
    function choose(index){
      var text=texts[index];if(typeof text!=='string')return false;
      var key=hskDigest_(JSON.stringify(['zh-CN','Kore',model,text]));if(isReady(text)||seen.has(key))return true;
      // Existing bridge has a 31-second PCM bound. Keep short batches; long sentences use one request.
      if(jobs.length>=max||characters+text.length+4>220||jobs.length&&characters+text.length+4>55)return false;
      seen.add(key);characters+=text.length+4;jobs.push({index:index,text:text,key:key,model:model});return true;
    }
    deferred.forEach(function(r){if(r[4]==='PENDING'&&Number(r[3])<=now){var index=Number(r[0]),text=texts[index],key=hskDigest_(JSON.stringify(['zh-CN','Kore',model,text]));if(isReady(text)){r[4]='DONE';queue.getRange(deferred.indexOf(r)+2,1,1,6).setValues([r]);}else choose(index);}});
    var pending=deferred.filter(function(r){return r[4]==='PENDING';});
    if(!jobs.length&&pending.length){p.setProperty('HSK_WARM_RETRY_AT',String(Math.max(now+60000,Math.min.apply(null,pending.map(function(r){return Number(r[3])||now;})))));return;}
    if(!jobs.length&&deferred.some(function(r){return r[4]==='REVIEW';})){p.setProperty('HSK_WARM_ENABLED','false');p.setProperty('HSK_WARM_LAST_ERROR','tts_review_required');return;}
    var cursor=Number(p.getProperty('HSK_WARM_CURSOR')||0);
    if(!pending.length)while(cursor<texts.length){if(!choose(cursor))break;cursor++;}
    if(!jobs.length){if(cursor>=texts.length)hskWarmStop();return;}
    var id=hskDigest_(JSON.stringify(jobs.map(function(j){return j.key;}))+':'+now),stamp=new Date().toISOString(),row=[id,JSON.stringify(jobs),'','RESERVED','',stamp,slot];
    journal.appendRow(row);var rowNumber=journal.getLastRow();SpreadsheetApp.flush();
    var response,decoded;
    p.setProperty('HSK_WARM_NEXT_SLOT',String((slot+1)%10));
    try{
      response=UrlFetchApp.fetch('https://hsk-vietnamese-translator.trung-hsk668.workers.dev/voice-precache',{method:'post',contentType:'application/json',headers:{Authorization:'Bearer '+token},payload:JSON.stringify({items:jobs.map(function(j){return j.text;}),language:'zh-CN',keySlot:slot,isolated:true}),muteHttpExceptions:true});
      decoded=hskParallelDecode_(response);
    }catch(e){
      var reason=String(e.message||'batch_transport_uncertain').replace(/[^a-z0-9_]/gi,'_').slice(0,90),attempts=e.providerAttempts===undefined?1:e.providerAttempts,delay=Math.max(60000,Number(e.retryAfter||600)*1000);
      ['HSK_WARM_VENDOR_CALLS','HSK_WARM_CALLS'].forEach(function(k){p.setProperty(k,String(Number(p.getProperty(k)||0)+attempts));});
      var keyOnly=/_429_|tts_daily_limit|tts_rate_limited|tts_key_invalid|tts_permission_denied|tts_quota_unavailable|tts_request_rejected|tts_model_unavailable|tts_region_unavailable/.test(reason);
      var retryable=keyOnly||e.retryable===true;
      if(e.diagnostic)p.setProperty('HSK_WARM_LAST_DIAGNOSTIC',JSON.stringify(e.diagnostic));
      row[3]=retryable?'FAILED':'REVIEW';row[4]=reason;journal.getRange(rowNumber,1,1,7).setValues([row]);
      jobs.forEach(function(j){hskParallelQueue_(queue,deferred,j.index,j.text,reason,retryable,delay,keyOnly?0:attempts);});
      p.setProperty('HSK_WARM_SLOT_'+slot+'_AFTER',String(now+delay));p.setProperty('HSK_WARM_LAST_ERROR',reason);p.setProperty('HSK_WARM_RETRY_AT',String(now+60000));
      if(!retryable)p.setProperty('HSK_WARM_ENABLED','false');return;
    }
    ['HSK_WARM_VENDOR_CALLS','HSK_WARM_CALLS'].forEach(function(k){p.setProperty(k,String(Number(p.getProperty(k)||0)+decoded.providerAttempts));});
    var name='MASTER_BATCH_'+id+'.wav',master=storage.folder.createFile(Utilities.newBlob(decoded.bytes,'audio/wav',name));
    row[2]=master.getId();row[3]='MASTER';journal.getRange(rowNumber,1,1,7).setValues([row]);SpreadsheetApp.flush();
    var saved;try{saved=hskBatchCommit_(storage,journal,rowNumber,row,queue,deferred);}catch(e){if(/^batch_segment_count_mismatch$|^batch_unstable_boundaries$|^batch_silent_audio$/.test(String(e.message))){if(e.message==='batch_segment_count_mismatch'&&hskPartialHandleMismatch_(storage,journal,rowNumber,row,queue,deferred,p))return;hskBatchReject_(journal,rowNumber,row,queue,deferred,p,e.message);return;}throw e;}
    p.setProperty('HSK_WARM_CURSOR',String(cursor));p.setProperty('HSK_WARM_SAVED_SINCE_FIX',String(Number(p.getProperty('HSK_WARM_SAVED_SINCE_FIX')||0)+saved));
    p.setProperty('HSK_WARM_SLOT_'+slot+'_AFTER',String(Date.now()+90000));p.deleteProperty('HSK_WARM_LAST_ERROR');p.setProperty('HSK_WARM_RETRY_AT',String(Date.now()+90000));
  }catch(e){p.setProperty('HSK_WARM_LAST_ERROR',/^batch_/.test(String(e.message))?e.message:'batch_storage_or_runtime_error');p.setProperty('HSK_WARM_ENABLED','false');}
  finally{p.setProperty('HSK_WARM_RUNTIME_MS',String(Number(p.getProperty('HSK_WARM_RUNTIME_MS')||0)+Date.now()-started));p.setProperty('HSK_WARM_LAST_RUN',new Date().toISOString());try{if(storage)hskWarmProgress_(storage,p);}finally{lock.releaseLock();}}
}
