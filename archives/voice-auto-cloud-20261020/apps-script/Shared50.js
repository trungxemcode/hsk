/** Shared one-shot command for Plus/Work. Existing Google owner executes; no public endpoint. */
function hskShared50Pair_(token,now){
 var p=hskSettings_(),models=hskVoiceTtsModels_();
 if(typeof hskVoiceFailoverMode_==='function'&&hskVoiceFailoverMode_(p)==='DIRECT'){
  if(typeof hskVoiceFailoverKeyCount_==='function'&&hskVoiceFailoverKeyCount_(p)>0)
   return {slot:0,model:'gemini-3.8-flash-lite-tts',mi:2};
  return null;
 }
 var preferred=String(p.getProperty('HSK_VOICE_TTS_PREFERRED_MODEL')||'');
 var next=Math.max(0,Math.min(2,Number(p.getProperty('HSK_VOCAB_NEXT_MODEL')||0)));
 if(models.indexOf(preferred)>=0)next=models.indexOf(preferred);
 var available=hskVoiceRoutePairs_(p,token,now,models[next]);
 p.setProperty('HSK_VOICE_LAST_MODEL_SCAN',available.pairs.map(function(x){
  return hskVoiceModelTag_(x.model)+':'+x.slot;
 }).slice(0,20).join(',')||'none');
 // Quality control for NEW vocabulary batches only. Historical replay shows that
 // 2.5/3.1 verify more consistently; 3.8 stays as fallback if neither is available.
 // Never change the global model list or an already RESERVED batch.
 if(p.getProperty('HSK_AUTO50_ENABLED')==='true'&&p.getProperty('HSK_AUTO50_QUALITY_MODE')!=='DISABLED'){
  available.pairs.sort(function(a,b){
   return Number(a.model.indexOf('3.8')>=0)-Number(b.model.indexOf('3.8')>=0);
  });
 }
 return available.pairs[0]||null;
}
function hskShared50Control_(p,book,control,command){
 if(command!=='RUN_ONCE_50'&&command!=='RUNNING_ONCE_50')return null;
 if(command==='RUNNING_ONCE_50'){
  var monitorLock=LockService.getScriptLock();if(!monitorLock.tryLock(100))return true;
  try{
  var id=p.getProperty('HSK_VOCAB_PILOT_ID')||'',storage=hskCheck_(p),tables=hskVocabTables_(storage);
  var batch=hskVocabRows_(tables.batches,11).find(function(b){return b[0]===id;});
  if(batch){
   if(batch[2]){hskShared50Preview_(p,storage,batch,control);if(p.getProperty('HSK_SHARED50_PREVIEW_'+batch[0]+'_done')!=='true')return true;}
   control.getRange(16,2).setValue(id);control.getRange(17,2).setValue(batch[2]?'https://drive.google.com/file/d/'+batch[2]+'/view':'');
   control.getRange(18,2).setValue(batch[3]);control.getRange(19,2).setValue(batch[4]||'');
   if(['DONE','PARTIAL','REVIEW','REJECTED','UNCERTAIN'].indexOf(batch[3])>=0){
    hskVocabStop();control.getRange(15,2).setValue('PAUSE');control.getRange(6,2).setValue('ONE_SHOT_'+batch[3]);return true;
   }
  }
  if(!batch){p.setProperty('HSK_VOCAB_ENABLED','true');if(!ScriptApp.getProjectTriggers().some(function(t){return t.getHandlerFunction()==='hskVocabTick';}))ScriptApp.newTrigger('hskVocabTick').timeBased().everyMinutes(1).create();control.getRange(18,2).setValue(p.getProperty('HSK_VOCAB_ERROR')?'WAITING':'QUEUED');control.getRange(19,2).setValue(p.getProperty('HSK_VOCAB_ERROR')||'');}
  return false;
  }finally{monitorLock.releaseLock();}
 }
 var lock=LockService.getScriptLock();if(!lock.tryLock(100))return true;
 try{
  // A second caller must not restart an already claimed command.
  if(String(control.getRange(15,2).getValue())!=='RUN_ONCE_50')return true;
  // Authorised one-off bypasses the global PAUSE only for this vocabulary trial.
  p.setProperty('HSK_VOICE_PAUSED','false');
  p.setProperty('HSK_WARM_ENABLED','false');
  var storage=hskCheck_(p),tables=hskVocabTables_(storage),batches=hskVocabRows_(tables.batches,11);
  if(batches.some(function(b){return ['MASTER','VERIFY','RESERVED','UNCERTAIN'].indexOf(b[3])>=0;})){
   control.getRange(15,2).setValue('PAUSE');control.getRange(6,2).setValue('BLOCKED_UNRESOLVED_MASTER');return true;
  }
  p.setProperty('HSK_VOCAB_BATCH_SIZE','50');p.setProperty('HSK_VOCAB_FIXED_BATCH','true');
  p.setProperty('HSK_VOCAB_PAUSE','1');p.setProperty('HSK_SHARED50_LITERAL','true');p.setProperty('HSK_VOCAB_PILOT_ONLY','true');
  p.setProperty('HSK_AUTO50_ENABLED','true');p.setProperty('HSK_VOCAB_TTS_STRATEGY','chunks-v1');
  p.deleteProperty('HSK_VOCAB_PILOT_ID');p.setProperty('HSK_VOICE_PAUSED','false');
  p.setProperty('HSK_WARM_ENABLED','false');p.setProperty('HSK_VOCAB_ENABLED','true');
  // Per-key/model cooldown and daily counters remain untouched.
  p.deleteProperty('HSK_VOCAB_RETRY_AT');p.deleteProperty('HSK_VOCAB_ERROR');
  if(!ScriptApp.getProjectTriggers().some(function(t){return t.getHandlerFunction()==='hskVocabTick';}))
   ScriptApp.newTrigger('hskVocabTick').timeBased().everyMinutes(1).create();
  control.getRange(15,2).setValue('RUNNING_ONCE_50');control.getRange(6,2).setValue('ONE_SHOT_50_QUEUED');
  control.getRange(15,1,12,2).setValues([
   ['Shared_command','RUNNING_ONCE_50'],['Test_batch',''],['Test_master',''],['Test_state','QUEUED'],['Test_error',''],
   ['Preview_folder',''],['Preview_segments',0],['Actual_seconds',0],['Preview_state','NOT_CREATED'],
   ['Batch_size',50],['Requested_pause_seconds',1],['Protocol','shared50-v2; separate recovery command; single master; no automatic regeneration']]);
  SpreadsheetApp.flush();return true;
 }finally{lock.releaseLock();}
}
/** Save cut previews with neutral numbering. Never promote count-only cuts to READY. */
function hskShared50Preview_(p,storage,batch,control){
 var key='HSK_SHARED50_PREVIEW_'+batch[0],folderId=p.getProperty(key),pcm;
 if(p.getProperty(key+'_done')==='true')return;
 pcm=hskBatchPcm_(DriveApp.getFileById(batch[2]).getBlob().getBytes());
 var levels=[],peak=0;
 for(var i=0;i<pcm.length;i+=960){
  var end=Math.min(pcm.length,i+960),sum=0;
  for(var j=i;j<end;j+=2){var v=(pcm[j]&255)+(pcm[j+1]&255)*256;if(v>=32768)v-=65536;sum+=v*v;}
  var rms=Math.sqrt(sum/((end-i)/2))/32768;levels.push(rms);peak=Math.max(peak,rms);
 }
 var candidates=[];
 [1200,800,500,300].forEach(function(gap){[0.02,0.035,0.05].forEach(function(ratio){
  var out=[],begin=-1,last=-1,threshold=Math.max(0.002,peak*ratio);
  levels.forEach(function(rms,k){if(rms>threshold){if(begin<0)begin=k;last=k;}else if(begin>=0&&(k-last)*20>=gap){out.push([begin*480,(last+1)*480]);begin=-1;}});
  if(begin>=0)out.push([begin*480,Math.min(pcm.length/2,(last+1)*480)]);
  candidates.push({ranges:out,gap:gap,ratio:ratio});
 });});
 candidates.sort(function(a,b){return Math.abs(a.ranges.length-50)-Math.abs(b.ranges.length-50)||b.gap-a.gap;});
 var best=candidates[0];if(!best||!best.ranges.length)throw Error('shared50_silent_master');
 var folder=folderId?DriveApp.getFolderById(folderId):storage.folder.createFolder('UNVERIFIED_SHARED50_'+batch[0].slice(0,12));
 if(!folderId)p.setProperty(key,folder.getId());
 var cursor=Number(p.getProperty(key+'_cursor')||0),limit=Math.min(cursor+20,best.ranges.length);
 for(var k=cursor;k<limit;k++){
  var name='UNVERIFIED_segment_'+('000'+(k+1)).slice(-3)+'.wav',s=best.ranges[k];
  if(!folder.getFilesByName(name).hasNext())folder.createFile(Utilities.newBlob(hskWav_(pcm.slice(Math.max(0,s[0]-2880)*2,Math.min(pcm.length/2,s[1]+4800)*2),'audio/l16'),'audio/wav',name));
  p.setProperty(key+'_cursor',String(k+1));
 }
 control.getRange(20,2,4,1).setValues([[folder.getUrl()],[limit],[pcm.length/48000],['UNVERIFIED '+limit+'/'+best.ranges.length]]);
 if(limit===best.ranges.length){
  if(!folder.getFilesByName('manifest.json').hasNext())folder.createFile('manifest.json',JSON.stringify({batch:batch[0],master:batch[2],expected:50,segments:best.ranges.length,duration:pcm.length/48000,verified:false,selection:{gapMs:best.gap,thresholdRatio:best.ratio},thresholdCounts:candidates.map(function(c){return {gap:c.gap,ratio:c.ratio,count:c.ranges.length};}),rangesSamples:best.ranges,expectedWords:JSON.parse(batch[1]).map(function(j){return {text:j.text,pinyin:j.pinyin};})}),MimeType.PLAIN_TEXT);
  p.setProperty(key+'_done','true');
 }
}

/** A private source command is consumed once by the existing owner trigger. */
function hskShared50QueuedCommand_(p,control){
 if(typeof HSK_SHARED50_COMMAND_==='undefined')return;
 var q=HSK_SHARED50_COMMAND_;if(!q||!q.id||['RUN_ONCE_50','PAUSE'].indexOf(q.command)<0)return;
 var lock=LockService.getScriptLock();if(!lock.tryLock(100))return;
 try{
  if(p.getProperty('HSK_SHARED50_LAST_COMMAND')===q.id)return;
  var current=String(control.getRange(15,2).getValue()||'');
  // Run commands from another chat join the in-flight one; they never restart it.
  if(q.command==='PAUSE'){hskVocabStop();p.setProperty('HSK_WARM_ENABLED','false');}
  if(q.command==='PAUSE'||['RUN_ONCE_50','RUNNING_ONCE_50'].indexOf(current)<0)
   control.getRange(15,2).setValue(q.command);
  p.setProperty('HSK_SHARED50_LAST_COMMAND',q.id);
 }finally{lock.releaseLock();}
}
