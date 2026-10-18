/**
 * One locked batch, up to nine distinct key slots in parallel.
 * Persistent PROCESSING rows survive crashes; uncertain calls are never regenerated automatically.
 */
function hskWarmConfigureParallel() {
  var p=hskSettings_();
  p.setProperty('HSK_WARM_PARALLEL','true');
  p.setProperty('HSK_WARM_BATCH_SIZE','9');
  p.setProperty('HSK_WARM_ENABLED','true');
  p.deleteProperty('HSK_WARM_RETRY_AT');
  ScriptApp.getProjectTriggers().filter(function(t){return t.getHandlerFunction()==='hskWarmTick';}).forEach(function(t){ScriptApp.deleteTrigger(t);});
  ScriptApp.newTrigger('hskWarmTick').timeBased().everyMinutes(1).create();
  hskWarmProgress_(hskCheck_(p),p);
  return hskWarmStatus();
}
function hskParallelDecode_(response) {
  var status=response.getResponseCode(),data;
  try{data=JSON.parse(response.getContentText());}catch(e){throw Error('response_uncertain');}
  if(status!==200||!data.ok){
    var known=/^(identity_unavailable|unauthorized|voice_not_configured|tts_provider_unavailable|invalid_model|invalid_tts_audio|invalid_tts_response|tts_generation_incomplete|tts_blocked)$/.test(String(data.error||''))?data.error:'request_failed';
    var error=Error('cloudflare_tts_'+status+'_'+known);
    error.status=status;error.retryable=[429,503,504].indexOf(status)>=0||known==='tts_generation_incomplete'||known==='tts_provider_unavailable';
    error.retryAfter=Math.min(86400,Math.max(60,Number(data.retryAfter)||600));
    throw error;
  }
  if(!data.audioBase64||!data.mimeType)throw Error('response_uncertain');
  return hskWav_(Utilities.base64Decode(data.audioBase64),data.mimeType);
}
function hskParallelQueue_(queue,rows,index,text,reason,retryable,delay) {
  var at=rows.findIndex(function(r){return Number(r[0])===index&&r[4]!=='DONE';});
  var attempts=at<0?1:Number(rows[at][2])+1;
  var row=[index,text,attempts,Date.now()+delay,retryable&&attempts<3?'PENDING':'REVIEW',reason];
  if(at<0){queue.appendRow(row);rows.push(row);}else{queue.getRange(at+2,1,1,6).setValues([row]);rows[at]=row;}
}
function hskWarmParallelTick() {
  var p=hskSettings_(),now=Date.now();
  if(p.getProperty('HSK_WARM_ENABLED')!=='true'||p.getProperty('HSK_VOICE_PAUSED')==='true'||Number(p.getProperty('HSK_WARM_RETRY_AT')||0)>now)return;
  var lock=LockService.getScriptLock();if(!lock.tryLock(100))return;
  var started=Date.now(),storage;
  try {
    var windowStart=Number(p.getProperty('HSK_WARM_WINDOW_START')||0);
    if(!windowStart||now>=windowStart+86400000){windowStart=now;p.setProperty('HSK_WARM_WINDOW_START',String(now));p.setProperty('HSK_WARM_RUNTIME_MS','0');p.setProperty('HSK_WARM_CALLS','0');}
    var used=Number(p.getProperty('HSK_WARM_RUNTIME_MS')||0),limit=Number(p.getProperty('HSK_WARM_RUNTIME_LIMIT_MS')||3600000);
    storage=hskCheck_(p);
    if(used+100000>=limit){p.setProperty('HSK_WARM_RETRY_AT',String(windowStart+86400000));return;}
    var token=ScriptApp.getIdentityToken();if(!token)throw Error('google_identity_missing');
    var texts=hskWarmCorpus_(),cursor=Number(p.getProperty('HSK_WARM_CURSOR')||0),model=p.getProperty('HSK_VOICE_MODEL')||'gemini-2.5-flash-preview-tts';
    var sheet=storage.sheet,records=sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,13).getValues():[],byKey=new Map();
    records.forEach(function(r,i){byKey.set(String(r[0]),{row:i+2,values:r});});
    var queue=hskWarmQueue_(storage),deferred=queue.getLastRow()>1?queue.getRange(2,1,queue.getLastRow()-1,6).getValues():[];
    // Older sequential runs mislabeled transient provider outages as REVIEW; safely return those with fewer than three attempts to the retry queue.
    deferred.forEach(function(r,i){if(r[4]==='REVIEW'&&Number(r[2])<3&&/tts_provider_unavailable/.test(String(r[5]))){r[3]=Math.min(Number(r[3])||Date.now(),Date.now());r[4]='PENDING';queue.getRange(i+2,1,1,6).setValues([r]);}});
    // Reconcile all interrupted reservations, including those behind the saved cursor.
    byKey.forEach(function(entry,key){
      if(entry.values[11]!=='PROCESSING')return;
      var files=storage.folder.getFilesByName('hsk-tts-'+key.slice(0,24)+'.wav');
      if(files.hasNext()){entry.values[4]=files.next().getId();entry.values[11]='READY';entry.values[12]='recovered_after_interruption';}
      else{
        entry.values[11]='REVIEW';entry.values[12]='uncertain_previous_call';
        var index=texts.findIndex(function(text){return hskDigest_(JSON.stringify(['zh-CN','Kore',model,text]))===key;});
        if(index>=0)hskParallelQueue_(queue,deferred,index,texts[index],'uncertain_previous_call',false,86400000);
      }
      sheet.getRange(entry.row,1,1,13).setValues([entry.values]);
    });
    var jobs=[],requests=[],chosen=new Set(),earliest=Infinity;
    for(var slot=1;slot<=9;slot++){
      var until=Number(p.getProperty('HSK_WARM_SLOT_'+slot+'_AFTER')||0);
      if(until>now){earliest=Math.min(earliest,until);continue;}
      var index=-1,retryAt=-1,key,entry,text;
      while(cursor<texts.length){
        index=cursor++;text=texts[index];key=hskDigest_(JSON.stringify(['zh-CN','Kore',model,text]));entry=byKey.get(key);
        if(chosen.has(key))continue;
        if(entry&&entry.values[11]==='READY')continue;
        if(entry&&entry.values[11]==='PROCESSING'){
          var files=storage.folder.getFilesByName('hsk-tts-'+key.slice(0,24)+'.wav');
          if(files.hasNext()){
            var recovered=files.next();entry.values[4]=recovered.getId();entry.values[11]='READY';entry.values[12]='recovered_after_interruption';
            sheet.getRange(entry.row,1,1,13).setValues([entry.values]);
          }else{
            entry.values[11]='REVIEW';entry.values[12]='uncertain_previous_call';
            sheet.getRange(entry.row,1,1,13).setValues([entry.values]);
            hskParallelQueue_(queue,deferred,index,text,'uncertain_previous_call',false,86400000);
          }
          continue;
        }
        // A prior definitive failure belongs to Voice_Retry, never a duplicate initial job.
        if(entry)continue;
        if(chosen.has(key))continue;
        break;
      }
      if(index<0||entry||chosen.has(key)){
        retryAt=deferred.findIndex(function(r){return r[4]==='PENDING'&&Number(r[3])<=now&&!chosen.has(hskDigest_(JSON.stringify(['zh-CN','Kore',model,texts[Number(r[0])]])));});
        if(retryAt<0)continue;
        index=Number(deferred[retryAt][0]);text=texts[index];key=hskDigest_(JSON.stringify(['zh-CN','Kore',model,text]));entry=byKey.get(key);
        if(entry&&entry.values[11]==='READY'){deferred[retryAt][4]='DONE';queue.getRange(retryAt+2,1,1,6).setValues([deferred[retryAt]]);slot--;continue;}
        if(entry&&entry.values[11]==='PROCESSING'){hskParallelQueue_(queue,deferred,index,text,'uncertain_previous_call',false,86400000);continue;}
      }
      if(typeof text!=='string'||chosen.has(key))continue;
      chosen.add(key);
      var stamp=new Date().toISOString(),row=[key,'zh-CN','Kore',model,'','audio/wav',0,stamp,stamp,0,slot,'PROCESSING','parallel_reserved'];
      var rowNumber=entry?entry.row:sheet.getLastRow()+1;
      if(entry)sheet.getRange(rowNumber,1,1,13).setValues([row]);else sheet.appendRow(row);
      byKey.set(key,{row:rowNumber,values:row});
      jobs.push({index:index,text:text,key:key,slot:slot,row:rowNumber,values:row,retryAt:retryAt});
      requests.push({url:'https://hsk-vietnamese-translator.trung-hsk668.workers.dev/voice-precache',method:'post',contentType:'application/json',headers:{Authorization:'Bearer '+token},payload:JSON.stringify({text:text,language:'zh-CN',keySlot:slot}),muteHttpExceptions:true});
    }
    p.setProperty('HSK_WARM_CURSOR',String(cursor));
    if(!jobs.length){
      if(cursor>=texts.length&&!deferred.some(function(r){return r[4]==='PENDING';}))hskWarmStop();
      else if(earliest<Infinity)p.setProperty('HSK_WARM_RETRY_AT',String(earliest));
      return;
    }
    SpreadsheetApp.flush(); // Persist reservations before any paid provider request.
    p.setProperty('HSK_WARM_CALLS',String(Number(p.getProperty('HSK_WARM_CALLS')||0)+jobs.length));
    var responses;
    try{responses=UrlFetchApp.fetchAll(requests);}catch(e){
      // Transport failure is ambiguous: a request may already have generated audio.
      jobs.forEach(function(job){job.values[11]='REVIEW';job.values[12]='batch_transport_uncertain';sheet.getRange(job.row,1,1,13).setValues([job.values]);hskParallelQueue_(queue,deferred,job.index,job.text,'batch_transport_uncertain',false,86400000);});
      p.setProperty('HSK_WARM_LAST_ERROR','batch_transport_uncertain');return;
    }
    responses.forEach(function(response,i){
      var job=jobs[i];
      try{
        var bytes=hskParallelDecode_(response),name='hsk-tts-'+job.key.slice(0,24)+'.wav',files=storage.folder.getFilesByName(name);
        var file=files.hasNext()?files.next():storage.folder.createFile(Utilities.newBlob(bytes,'audio/wav',name));
        job.values[4]=file.getId();job.values[6]=bytes.length;job.values[11]='READY';job.values[12]='';
        sheet.getRange(job.row,1,1,13).setValues([job.values]);
        if(job.retryAt>=0){deferred[job.retryAt][4]='DONE';queue.getRange(job.retryAt+2,1,1,6).setValues([deferred[job.retryAt]]);}
        p.deleteProperty('HSK_WARM_SLOT_'+job.slot+'_AFTER');
      }catch(error){
        var reason=String(error.message||'save_uncertain').replace(/[^a-z0-9_]/gi,'_').slice(0,80);
        var transient=!!error.retryable,delay=error.status===429?(error.retryAfter||600)*1000:86400000;
        if(error.status===429||error.status===503||error.status===504)p.setProperty('HSK_WARM_SLOT_'+job.slot+'_AFTER',String(Date.now()+(error.retryAfter||600)*1000));
        job.values[11]=transient?'DEFERRED':'REVIEW';job.values[12]=reason;
        sheet.getRange(job.row,1,1,13).setValues([job.values]);
        hskParallelQueue_(queue,deferred,job.index,job.text,reason,transient,delay);
        p.setProperty('HSK_WARM_LAST_ERROR',reason);
        if(/unauthorized|identity_missing|voice_not_configured|invalid_model/.test(reason))p.setProperty('HSK_WARM_ENABLED','false');
      }
    });
    if(cursor>=texts.length&&!deferred.some(function(r){return r[4]==='PENDING';}))hskWarmStop();
  }catch(e){
    p.setProperty('HSK_WARM_LAST_ERROR',/identity_missing/.test(String(e.message))?'google_identity_missing':'parallel_storage_or_runtime_error');
    p.setProperty('HSK_WARM_RETRY_AT',String(Date.now()+3600000));
  }finally{
    p.setProperty('HSK_WARM_RUNTIME_MS',String(Number(p.getProperty('HSK_WARM_RUNTIME_MS')||0)+Math.max(0,Date.now()-started)));
    p.setProperty('HSK_WARM_LAST_RUN',new Date().toISOString());
    try{if(storage)hskWarmProgress_(storage,p);}finally{lock.releaseLock();}
  }
}
