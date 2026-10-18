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
    lastRun:p.getProperty('HSK_WARM_LAST_RUN')||''};
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
  if(!triggers.length)ScriptApp.newTrigger('hskWarmTick').timeBased().everyMinutes(1).create();
  // Start immediately, no wait for the first scheduled trigger.
  hskWarmTick();
  return hskWarmStatus();
}
function hskWarmStop() {
  var p=hskSettings_();p.setProperty('HSK_WARM_ENABLED','false');
  ScriptApp.getProjectTriggers().filter(function(t){return t.getHandlerFunction()==='hskWarmTick';})
    .forEach(function(t){ScriptApp.deleteTrigger(t);});
  return hskWarmStatus();
}
function hskWarmTick() {
  var p=hskSettings_();
  if(p.getProperty('HSK_WARM_ENABLED')!=='true'||p.getProperty('HSK_VOICE_PAUSED')==='true')return;
  if(Number(p.getProperty('HSK_WARM_RETRY_AT')||0)>Date.now())return;
  var lock=LockService.getScriptLock();
  if(!lock.tryLock(1500))return; // Another generation is active: next tick will resume.
  try {
    var storage=hskCheck_(p),texts=hskWarmCorpus_(),cursor=Number(p.getProperty('HSK_WARM_CURSOR')||0);
    var model=p.getProperty('HSK_VOICE_MODEL')||'gemini-2.5-flash-preview-tts';
    var end=Math.min(texts.length,cursor+Math.min(60,Math.max(1,Number(p.getProperty('HSK_WARM_BATCH_SIZE')||24))));
    var stopAt=Date.now()+225000; // Apps Script 6-minute execution limit: leave headroom.
    var old=storage.sheet.getLastRow(),existing=new Set();
    if(old>1)storage.sheet.getRange(2,1,old-1,1).getValues().forEach(function(row){if(row[0])existing.add(String(row[0]));});
    for(;cursor<end&&Date.now()<stopAt;cursor++){
      if(p.getProperty('HSK_WARM_ENABLED')!=='true')break;
      var value=texts[cursor],key=hskDigest_(JSON.stringify(['zh-CN','Kore',model,value]));
      if(!existing.has(key)) {
        try {
          var rendered=hskGenerate_(p,value,model);
          var blob=Utilities.newBlob(rendered.bytes,'audio/wav','hsk-tts-'+key.slice(0,24)+'.wav');
          var file=storage.folder.createFile(blob),now=new Date().toISOString();
          storage.sheet.appendRow([key,'zh-CN','Kore',model,file.getId(),'audio/wav',
            rendered.bytes.length,now,now,0,rendered.index,'READY','']);
          existing.add(key);
        }catch(e){
          // Preserve the failed item and retry transient provider failures with bounded backoff.
          p.setProperty('HSK_WARM_CURSOR',String(cursor));
          p.setProperty('HSK_WARM_LAST_ERROR',String(e.message||'generation_failed').replace(/[^a-z0-9_]/gi,'_').slice(0,48));
          if(e.retryable){
            var retries=Number(p.getProperty('HSK_WARM_RETRY_COUNT')||0)+1;
            p.setProperty('HSK_WARM_RETRY_COUNT',String(retries));
            p.setProperty('HSK_WARM_RETRY_AT',String(Date.now()+Math.min(3600000,60000*Math.pow(2,Math.min(6,retries-1)))));
          }else p.setProperty('HSK_WARM_ENABLED','false');
          return;
        }
      }
      // Checkpoint EVERY item: kill or script timeout cannot lose completed work.
      p.deleteProperty('HSK_WARM_RETRY_AT');p.deleteProperty('HSK_WARM_RETRY_COUNT');p.deleteProperty('HSK_WARM_LAST_ERROR');
      p.setProperty('HSK_WARM_CURSOR',String(cursor+1));
    }
    p.setProperty('HSK_WARM_LAST_RUN',new Date().toISOString());
    if(cursor>=texts.length)hskWarmStop();
  }finally{lock.releaseLock();}
}
