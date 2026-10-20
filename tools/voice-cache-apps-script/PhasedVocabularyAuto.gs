
/** Owner-authorized vocabulary-only plan: HSK2-4, then HSK1, HSK5, HSK6. */
var HSK_PHASE_AUTO_ID_='HSK_PHASE_AUTO_20261020_V1';
function hskVoicePhasedActive_(p){return p.getProperty(HSK_PHASE_AUTO_ID_)==='true'&&p.getProperty('HSK_PHASE_AUTO_STAGE')!=='DONE';}
function hskVoicePhasedLevels_(stage){return stage==='234'?[2,3,4]:[Number(stage)];}
function hskVoicePhasedCandidates_(pending,p){
 if(!hskVoicePhasedActive_(p))return pending;
 var levels=hskVoicePhasedLevels_(p.getProperty('HSK_PHASE_AUTO_STAGE')||'234');
 return pending.filter(function(x){return levels.indexOf(Number(x.r[0]))>=0;});
}
function hskVoicePhasedEnroll_(p,storage,tables,rows,stage){
 var levels=hskVoicePhasedLevels_(stage),seen=new Set(),cache=new Map(),added=[];
 rows.forEach(function(r){seen.add(String(r[1])+'\0'+hskVoiceRecPinyin_(r[2]));});
 hskVocabRows_(storage.sheet,13).forEach(function(r){if(r[11]==='READY'&&r[4])cache.set(String(r[0]),r);});
 var models=hskVoiceTtsModels_().concat(['gemini-3.8-flash-tts']);
 hskTrialCorpus_().forEach(function(w){
  if(levels.indexOf(Number(w.level))<0)return;
  var identity=w.text+'\0'+hskVoiceRecPinyin_(w.pinyin);if(seen.has(identity))return;seen.add(identity);
  var hit=models.map(function(m){return cache.get(hskVocabKey_(m,w.text));}).find(Boolean);
  var row=[w.level,w.text,w.pinyin,hit?'EXISTING':'PENDING',0,0,'',hit?hit[3]:'','',hit?hit[4]:'','','',new Date().toISOString(),'','','',hit?'https://drive.google.com/file/d/'+hit[4]+'/view':''];
  added.push(row);rows.push(row);
 });
 if(added.length){var end=tables.queue.getLastRow()+added.length;if(end>tables.queue.getMaxRows())tables.queue.insertRowsAfter(tables.queue.getMaxRows(),end-tables.queue.getMaxRows());tables.queue.getRange(tables.queue.getLastRow()+1,1,added.length,17).setValues(added);}
 return added.length;
}
/** Audit only old settled requests. Reuse every saved WAV; owner now authorizes missing words to be generated again. */
function hskVoicePhasedRecoverOldHolds_(p,storage,tables,rows,batches){
 var now=Date.now(),folder=storage.folder,models=hskVoiceTtsModels_().concat(['gemini-3.8-flash-tts']);
 function named(n){var f=folder.getFilesByName(n);return f.hasNext()?f.next():null;}
 function write(i,r){hskVocabWrite_(tables.queue,i,r);}
 var recovered=0,released=0;
 batches.forEach(function(batch,index){
  if(batch[3]!=='QUARANTINED'||!Number.isFinite(Date.parse(batch[5]))||now-Date.parse(batch[5])<1800000)return;
  var jobs;try{jobs=JSON.parse(batch[1]);}catch(e){return;}
  if(!jobs.some(function(j){return rows[j.row]&&rows[j.row][3]==='HOLD_UNCERTAIN';}))return;
  var master=named('VOCAB_MASTER_'+batch[0]+'.wav'),info={};
  try{info=JSON.parse(batch[10]||'{}');}catch(ignore){}
  if(master){
   hskBatchPcm_(master.getBlob().getBytes());batch[2]=master.getId();batch[3]='MASTER';batch[4]='phased_reused_saved_master';
   jobs.forEach(function(j){var r=rows[j.row];if(r&&r[3]==='HOLD_UNCERTAIN'){r[3]='MASTER';r[8]=master.getId();write(j.row,r);recovered++;}});
  }else if(info.mode==='chunked_v1'&&Array.isArray(info.plan)){
   var saved=[],missing=[];
   info.plan.forEach(function(g){var file=named(g.name);if(file){hskBatchPcm_(file.getBlob().getBytes());saved.push(g);}else missing.push(g);});
   missing.forEach(function(g){for(var n=g.from;n<g.to;n++){var j=jobs[n],r=rows[j.row];if(r&&r[3]==='HOLD_UNCERTAIN'){r[3]='RETRY';r[5]=0;r[11]='phased_owner_resume_missing_audio_after_file_audit';write(j.row,r);released++;}}});
   if(saved.length){info.plan=saved;info.omitted=Array.isArray(info.omitted)?info.omitted:[];info.qualityProfile='';
    batch[3]='TTS_CHUNKS';batch[4]='phased_reuse_saved_chunks_only';batch[10]=JSON.stringify(info);
    saved.forEach(function(g){for(var n=g.from;n<g.to;n++){var j=jobs[n],r=rows[j.row];if(r&&r[3]==='HOLD_UNCERTAIN'){r[3]='PENDING';write(j.row,r);recovered++;}}});
   }else batch[4]=String(batch[4]||'')+';phased_missing_file_audit_released';
  }
  tables.batches.getRange(index+2,1,1,11).setValues([batch]);
 });
 rows.forEach(function(r,i){
  if(r[3]!=='CANARY38_HOLD'||!Number.isFinite(Date.parse(r[12]))||now-Date.parse(r[12])<1800000)return;
  var file=null,model='';
  models.some(function(m){file=named('hsk-tts-'+hskVocabKey_(m,r[1]).slice(0,24)+'.wav');if(file){model=m;return true;}return false;});
  if(file){
   hskBatchPcm_(file.getBlob().getBytes());var id='phased_reuse_'+hskDigest_(r[1]+':'+i),job={row:i,text:r[1],pinyin:r[2],level:r[0],model:model,key:hskVocabKey_(model,r[1])};
   tables.batches.appendRow([id,JSON.stringify([job]),file.getId(),'MASTER','phased_reused_canary_wav',new Date().toISOString(),0,model,1,0,'']);
   r[3]='MASTER';r[6]=id;r[7]=model;r[8]=file.getId();r[9]=file.getId();recovered++;
  }else{r[3]='RETRY';r[5]=0;r[11]='phased_owner_resume_missing_canary_after_file_audit';released++;}
  write(i,r);
 });
 p.setProperty('HSK_PHASE_AUTO_RECOVERY',JSON.stringify({savedAudioReused:recovered,missingReleased:released}));
}
function hskVoicePhasedProgress_(p,book,rows,stage,status){
 var levels=hskVoicePhasedLevels_(stage),group=rows.filter(function(r){return levels.indexOf(Number(r[0]))>=0;}),ready=group.filter(function(r){return ['READY','EXISTING'].indexOf(r[3])>=0;}).length;
 p.setProperty('HSK_PHASE_AUTO_STATUS',status);p.setProperty('HSK_PHASE_AUTO_UPDATED',new Date().toISOString());
 var progress=book.getSheetByName('Tien_do');if(progress)progress.getRange(19,1,6,2).setValues([
 ['Thu tu HSK','2-4 -> 1 -> 5 -> 6'],['Giai doan HSK',stage],['So tu giai doan',group.length],
 ['Da co voice giai doan',ready],['Con thieu giai doan',group.length-ready],['Trang thai giai doan',status]
 ]);
}
function hskVoicePhasedTick_(){
 var p=hskSettings_();if(p.getProperty('HSK_PHASE_AUTO_STAGE')==='DONE')return false;
 var lock=LockService.getScriptLock();if(!lock.tryLock(100))return true;
 try{
  var storage=hskCheck_(p),tables=hskVocabTables_(storage),book=storage.sheet.getParent(),control=book.getSheetByName('Voice_Control'),rows=hskVocabRows_(tables.queue,17);
  if(p.getProperty(HSK_PHASE_AUTO_ID_)!=='true'){
   // Never replace a source queue or import private trial audio/results.
   p.setProperty('HSK_PHASE_AUTO_STAGE','234');hskVoicePhasedEnroll_(p,storage,tables,rows,'234');
   rows.forEach(function(r,i){if(r[3]==='REVIEW'&&/^(polyphonic_or_conflicting_pinyin_cache_key|canary38_asr_hanzi_or_pinyin_mismatch)$/.test(String(r[11]||''))){r[3]='RETRY';r[5]=0;r[11]='phased_stage3_common_reading_retry:'+r[11];hskVocabWrite_(tables.queue,i,r);}});
   hskVoicePhasedRecoverOldHolds_(p,storage,tables,rows,hskVocabRows_(tables.batches,11));
   p.setProperty('HSK_PHASE_AUTO_PRIVATE_TRIAL','PAUSED_RESULTS_PRESERVED');
   p.setProperty('HSK_AUTO50_QUALITY_MODE','ENABLED');p.setProperty('HSK_VOICE_PAUSED','false');p.setProperty('HSK_WARM_ENABLED','false');
   p.setProperty('HSK_VOCAB_ENABLED','true');p.setProperty('HSK_AUTO50_ENABLED','true');p.setProperty('HSK_VOCAB_PILOT_ONLY','false');p.setProperty('HSK_VOCAB_TTS_STRATEGY','chunks-v1');p.setProperty('HSK_VOCAB_BATCH_SIZE','50');
   p.setProperty('HSK_AUTO_RESUME_BOTH_20261020_V1','true');
   control.getRange(2,2).setValue('AUTO_CYCLE');control.getRange(15,2).setValue('AUTO_CYCLE');
   p.setProperty(HSK_PHASE_AUTO_ID_,'true');
  }
  if(String(control.getRange(2,2).getValue())!=='AUTO_CYCLE'||p.getProperty('HSK_VOICE_PAUSED')==='true')return false;
  var stage=p.getProperty('HSK_PHASE_AUTO_STAGE')||'234',levels=hskVoicePhasedLevels_(stage),missing=rows.filter(function(r){return levels.indexOf(Number(r[0]))>=0&&['READY','EXISTING'].indexOf(r[3])<0;});
  if(!missing.length){
   var next={'234':'1','1':'5','5':'6','6':'DONE'}[stage];p.setProperty('HSK_PHASE_AUTO_STAGE',next);
   if(next==='DONE'){p.setProperty('HSK_VOCAB_ENABLED','false');p.setProperty('HSK_AUTO50_ENABLED','false');control.getRange(2,2).setValue('PAUSE');hskVoicePhasedProgress_(p,book,rows,'6','ALL_VOCABULARY_COMPLETE');return true;}
   hskVoicePhasedEnroll_(p,storage,tables,rows,next);stage=next;levels=hskVoicePhasedLevels_(stage);missing=rows.filter(function(r){return levels.indexOf(Number(r[0]))>=0&&['READY','EXISTING'].indexOf(r[3])<0;});
  }
  var blocked=missing.length&&!missing.some(function(r){return ['PENDING','RETRY','MASTER','CHECK_AGAIN'].indexOf(r[3])>=0;});
  hskVoicePhasedProgress_(p,book,rows,stage,blocked?'WAITING_HELD_AUDIO_REVIEW':'AUTO_RUNNING_QUALITY_V1');
  return !!blocked;
 }finally{lock.releaseLock();}
}
