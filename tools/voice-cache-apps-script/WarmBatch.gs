/**
 * Resumable bulk HSK TTS warm-up. Runs inside trusted Apps Script only.
 * Never place keys or token in the bundled/static corpus.
 * Start manually ONCE from the Apps Script editor after configuring Script Properties.
 */
function hskWarmStatus() {
  var p=hskSettings_(),all=hskWarmCorpus_(),done=Number(p.getProperty('HSK_WARM_CURSOR')||0);
  var configured=0;for(var i=1;i<=9;i++)if(p.getProperty('GEMINI_TTS_KEY_'+i))configured++;
  return {total:all.length,completed:Math.min(done,all.length),remaining:Math.max(0,all.length-done),
    enabled:p.getProperty('HSK_WARM_ENABLED')==='true',
    configuredKeys:configured,keyTransport:p.getProperty('HSK_VOICE_TTS_TRANSPORT')==='direct'?'direct':'cloudflare',retryAt:Number(p.getProperty('HSK_WARM_RETRY_AT')||0),lastError:p.getProperty('HSK_WARM_LAST_ERROR')||'',
    lastRun:p.getProperty('HSK_WARM_LAST_RUN')||'',mode:p.getProperty('HSK_WARM_ISOLATED')==='true'?'isolated-batch-repair-first':p.getProperty('HSK_WARM_PARALLEL')==='true'?'parallel-nine-key-slots':'background-cache-first',
    callsToday:Number(p.getProperty('HSK_WARM_CALLS')||0),runtimeMinutes:Math.round(Number(p.getProperty('HSK_WARM_RUNTIME_MS')||0)/6000)/10};
}
function hskWarmStart() {
  var p=hskSettings_(),state=hskWarmStatus();
  if(!p.getProperty('HSK_VOICE_SHEET_ID')||!p.getProperty('HSK_VOICE_FOLDER_ID'))throw Error('storage_properties_missing');
  if(!p.getProperty('HSK_VOICE_TOKEN'))throw Error('gateway_token_missing');
  if(p.getProperty('HSK_VOICE_TTS_TRANSPORT')==='direct'&&state.configuredKeys===0)throw Error('tts_keys_not_set');
  if(state.completed>=state.total)return state;
  p.setProperty('HSK_WARM_ENABLED','true');
  p.deleteProperty('HSK_WARM_LAST_ERROR');
  p.deleteProperty('HSK_WARM_RETRY_AT');p.deleteProperty('HSK_WARM_RETRY_COUNT');
  var triggers=ScriptApp.getProjectTriggers().filter(function(t){return t.getHandlerFunction()==='hskWarmTick';});
  if(!triggers.length)ScriptApp.newTrigger('hskWarmTick').timeBased().everyMinutes(5).create();
  // Start immediately, no wait for the first scheduled trigger.
  hskWarmTick();
  return hskWarmStatus();
}
function hskWarmStop() {
  var p=hskSettings_();p.setProperty('HSK_WARM_ENABLED','false');p.deleteProperty('HSK_WARM_PAUSE_REASON');
  ScriptApp.getProjectTriggers().filter(function(t){return t.getHandlerFunction()==='hskWarmTick';})
    .forEach(function(t){ScriptApp.deleteTrigger(t);});
  return hskWarmStatus();
}
/** Install once. All later work runs on Google's scheduler, without ChatGPT. */
function hskWarmConfigureBackground() {
  var p=hskSettings_();p.deleteProperty('HSK_WARM_ISOLATED');
  p.setProperty('HSK_WARM_BATCH_SIZE','4');
  p.setProperty('HSK_WARM_RUNTIME_LIMIT_MS','3600000');
  p.setProperty('HSK_WARM_ENABLED','true');
  p.deleteProperty('HSK_WARM_RETRY_AT');
  ScriptApp.getProjectTriggers().filter(function(t){return t.getHandlerFunction()==='hskWarmTick';})
    .forEach(function(t){ScriptApp.deleteTrigger(t);});
  ScriptApp.newTrigger('hskWarmTick').timeBased().everyMinutes(5).create();
  hskWarmProgress_(hskCheck_(p),p);
  return hskWarmStatus();
}
function hskWarmQueue_(storage) {
  var book=storage.sheet.getParent(),sheet=book.getSheetByName('Voice_Retry');
  if(!sheet){sheet=book.insertSheet('Voice_Retry');sheet.appendRow(['Corpus_index','Text','Attempts','Retry_after','Status','Error']);sheet.setFrozenRows(1);}
  return sheet;
}
function hskWarmProgress_(storage,p) {
  var book=storage.sheet.getParent(),sheet=book.getSheetByName('Tien_do');
  if(!sheet)sheet=book.insertSheet('Tien_do');
  var q=hskWarmQueue_(storage),rows=q.getLastRow()>1?q.getRange(2,1,q.getLastRow()-1,6).getValues():[];
  var pending=rows.filter(function(r){return r[4]==='PENDING';}).length,review=rows.filter(function(r){return r[4]==='REVIEW';}).length;
  var s=hskWarmStatus(),readyKeys=new Set();
  if(storage.sheet.getLastRow()>1)storage.sheet.getRange(2,1,storage.sheet.getLastRow()-1,13).getValues().forEach(function(r){if(r[0]&&r[4]&&r[11]==='READY')readyKeys.add(String(r[0]));});
  var ready=readyKeys.size;
  sheet.getRange(1,1,16,2).setValues([
    ['Kho voice tự động','Gemini Kore / tiếng Trung'],['Tổng câu',s.total],['Đã có audio',ready],
    ['Chưa duyệt',s.remaining],['Sẽ thử lại',pending],['Cần kiểm tra',review],
    ['Trạng thái',s.enabled?(s.retryAt>Date.now()?'Đang nghỉ, sẽ tự chạy tiếp':'Đang chạy nền'):(p.getProperty('HSK_WARM_PAUSE_REASON')==='batch-pilot'?'Tạm dừng có chủ đích để kiểm tra tạo theo lô':s.remaining?'Tạm dừng; kiểm tra cấu hình':pending||review?'Đã duyệt hết; xem Voice_Retry':'Hoàn tất')],
    ['Lần chạy gần nhất',p.getProperty('HSK_WARM_LAST_RUN')||''],['Chạy lại sau',s.retryAt?new Date(s.retryAt).toISOString():''],
    ['Lượt gọi tạo audio / chu kỳ 24h',s.callsToday],['Phút đã dùng / tối đa 60',s.runtimeMinutes],
    ['Lỗi gần nhất',s.lastError],['Cơ chế','Kiểm tra key trước; tăng/giảm tải theo kết quả; chống trùng'],
    ['Gọi Gemini thực từ bản sửa',Number(p.getProperty('HSK_WARM_VENDOR_CALLS')||0)],
    ['Audio lưu từ bản sửa',Number(p.getProperty('HSK_WARM_SAVED_SINCE_FIX')||0)],
    ['Luồng đang cho phép / tối đa 9',Number(p.getProperty('HSK_WARM_CONCURRENCY')||1)]]);
}
function hskWarmTick() {
  if(hskSettings_().getProperty('HSK_WARM_ISOLATED')==='true')return hskWarmIsolatedTick();
  if(hskSettings_().getProperty('HSK_WARM_PARALLEL')==='true')return hskWarmParallelTick();
  var p=hskSettings_(),now=Date.now();
  if(p.getProperty('HSK_WARM_ENABLED')!=='true'||p.getProperty('HSK_VOICE_PAUSED')==='true')return;
  if(Number(p.getProperty('HSK_WARM_RETRY_AT')||0)>now)return;
  var lock=LockService.getScriptLock();if(!lock.tryLock(100))return;
  var started=Date.now(),storage;
  try {
    var windowStart=Number(p.getProperty('HSK_WARM_WINDOW_START')||0);
    if(!windowStart||now>=windowStart+86400000){windowStart=now;p.setProperty('HSK_WARM_WINDOW_START',String(now));p.setProperty('HSK_WARM_RUNTIME_MS','0');p.setProperty('HSK_WARM_CALLS','0');}
    var used=Number(p.getProperty('HSK_WARM_RUNTIME_MS')||0),limit=Number(p.getProperty('HSK_WARM_RUNTIME_LIMIT_MS')||3600000);
    if(used+90000>=limit){p.setProperty('HSK_WARM_RETRY_AT',String(windowStart+86400000));storage=hskCheck_(p);return;}
    storage=hskCheck_(p);
    var texts=hskWarmCorpus_(),cursor=Number(p.getProperty('HSK_WARM_CURSOR')||0),model=p.getProperty('HSK_VOICE_MODEL')||'gemini-2.5-flash-preview-tts';
    var queue=hskWarmQueue_(storage),deferred=queue.getLastRow()>1?queue.getRange(2,1,queue.getLastRow()-1,6).getValues():[];
    // Reclassify provider outages recorded by the previous non-retryable bridge.
    deferred.forEach(function(r,i){if(r[4]==='REVIEW'&&Number(r[2])<3&&/tts_provider_unavailable/.test(String(r[5]))){r[4]='PENDING';queue.getRange(i+2,1,1,6).setValues([r]);}});
    var existing=new Set(),old=storage.sheet.getLastRow();
    if(old>1)storage.sheet.getRange(2,1,old-1,13).getValues().forEach(function(r){if(r[0]&&r[4]&&r[11]==='READY')existing.add(String(r[0]));});
    var stopAt=started+Math.min(180000,limit-used-10000),batch=Math.min(12,Math.max(1,Number(p.getProperty('HSK_WARM_BATCH_SIZE')||4)));
    for(var n=0;n<batch&&Date.now()+85000<stopAt;n++){
      if(p.getProperty('HSK_WARM_ENABLED')!=='true')break;
      var retryRow=-1,index=cursor;
      if(cursor>=texts.length){
        retryRow=deferred.findIndex(function(r){return r[4]==='PENDING'&&Number(r[3])<=Date.now();});
        if(retryRow<0)break;index=Number(deferred[retryRow][0]);
      }
      var text=texts[index],key=hskDigest_(JSON.stringify(['zh-CN','Kore',model,text]));
      try {
        if(!existing.has(key)){
          p.setProperty('HSK_WARM_CALLS',String(Number(p.getProperty('HSK_WARM_CALLS')||0)+1));
          var rendered=hskGenerate_(p,text,model),stamp=new Date().toISOString();
          var file=storage.folder.createFile(Utilities.newBlob(rendered.bytes,'audio/wav','hsk-tts-'+key.slice(0,24)+'.wav'));
          storage.sheet.appendRow([key,'zh-CN','Kore',model,file.getId(),'audio/wav',rendered.bytes.length,stamp,stamp,0,rendered.index,'READY','']);existing.add(key);
        }
        if(retryRow>=0){deferred[retryRow][4]='DONE';queue.getRange(retryRow+2,1,1,6).setValues([deferred[retryRow]]);}
        p.deleteProperty('HSK_WARM_RETRY_COUNT');p.deleteProperty('HSK_WARM_RETRY_AT');p.deleteProperty('HSK_WARM_LAST_ERROR');
      }catch(e){
        var reason=String(e.message||'generation_failed').replace(/[^a-z0-9_]/gi,'_').slice(0,80);p.setProperty('HSK_WARM_LAST_ERROR',reason);
        if(/unauthorized|identity_missing|voice_not_configured|keys_not_set|invalid_model|missing_storage/.test(reason)){p.setProperty('HSK_WARM_ENABLED','false');break;}
        if(/_(429|503|504)_|provider_(429|503|504)|all_tts_keys/.test(reason)||e.retryable&&!/generation_incomplete/.test(reason)){
          var count=Number(p.getProperty('HSK_WARM_RETRY_COUNT')||0)+1;p.setProperty('HSK_WARM_RETRY_COUNT',String(count));
          p.setProperty('HSK_WARM_RETRY_AT',String(Date.now()+Math.min(21600000,1800000*Math.pow(2,Math.min(4,count-1)))));break;
        }
        var attempts=retryRow<0?1:Number(deferred[retryRow][2])+1;
        var row=[index,text,attempts,Date.now()+86400000,e.retryable&&attempts<3?'PENDING':'REVIEW',reason];
        if(retryRow<0){queue.appendRow(row);deferred.push(row);}else{queue.getRange(retryRow+2,1,1,6).setValues([row]);deferred[retryRow]=row;}
      }
      if(retryRow<0){cursor++;p.setProperty('HSK_WARM_CURSOR',String(cursor));}
    }
    if(cursor>=texts.length&&!deferred.some(function(r){return r[4]==='PENDING';}))hskWarmStop();
  }catch(e){
    p.setProperty('HSK_WARM_LAST_ERROR','storage_or_runtime_error');
    p.setProperty('HSK_WARM_RETRY_AT',String(Date.now()+3600000));
  }finally{
    p.setProperty('HSK_WARM_RUNTIME_MS',String(Number(p.getProperty('HSK_WARM_RUNTIME_MS')||0)+Math.max(0,Date.now()-started)));
    p.setProperty('HSK_WARM_LAST_RUN',new Date().toISOString());
    try{if(storage)hskWarmProgress_(storage,p);}finally{lock.releaseLock();}
  }
}
