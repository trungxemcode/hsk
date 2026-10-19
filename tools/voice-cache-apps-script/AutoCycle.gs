/**
 * HSK vocabulary continuous 50-item pilot scheduler.
 * Invoked only by the private Google Apps Script owner time trigger via Voice_Control!B2=AUTO_CYCLE.
 * Never certifies an audio clip from its position or count: two independent ASR transcriptions
 * MUST agree with one unique Hanzi + pinyin pair in the source jobs list.
 */
var HSK_AUTO50_CLIP_COLUMNS_=['Batch','Segment','Start_ms','End_ms','State','Checks','Hanzi_1','Hanzi_2','Pinyin_1','Pinyin_2','Vocab_row','Text','File_ID','Error','Updated'];

function hskAuto50Sheet_(storage){
 return hskVocabTable_(storage.sheet.getParent(),'Voice_Auto_Clips',HSK_AUTO50_CLIP_COLUMNS_);
}
function hskAuto50Choose_(pending){
 // Failed pronunciation from preceding master comes first, then untouched vocabulary, then older retries.
 return pending.sort(function(a,b){
  function priority(x){return /^needs_new_batch_after_unverified_master|^auto50_unverified_master/.test(String(x.r[11]||''))?0:x.r[3]==='PENDING'?1:2;}
  return priority(a)-priority(b)||Number(a.r[0])-Number(b.r[0])||
   Number(a.r[4])-Number(b.r[4])||a.i-b.i;
 });
}
function hskAuto50Detect_(master,expected){
 var pcm=hskBatchPcm_(master),levels=[],peak=0;
 for(var i=0;i<pcm.length;i+=960){
  var end=Math.min(pcm.length,i+960),sum=0;
  for(var k=i;k<end;k+=2){var v=(pcm[k]&255)+(pcm[k+1]&255)*256;if(v>=32768)v-=65536;sum+=v*v;}
  var rms=Math.sqrt(sum/((end-i)/2))/32768;levels.push(rms);peak=Math.max(peak,rms);
 }
 if(peak<0.004)throw Error('auto50_silent_master');
 var selected=null;
 [0.3,0.4,0.5,0.65,0.8,1].forEach(function(gap){[0.012,0.02,0.03,0.04,0.05].forEach(function(factor){
  var threshold=Math.max(0.002,peak*factor),ranges=[],start=-1,last=-1;
  levels.forEach(function(rms,n){
   if(rms>threshold){if(start<0)start=n;last=n;}
   else if(start>=0&&(n-last)*0.02>=gap){if(last-start>=5)ranges.push([start*480,(last+1)*480]);start=last=-1;}
  });
  if(start>=0&&last-start>=5)ranges.push([start*480,Math.min(pcm.length/2,(last+1)*480)]);
  var score=Math.abs(ranges.length-expected)*100+Math.abs(gap-0.55)*6+factor*4;
  if(!selected||score<selected.score)selected={ranges:ranges,score:score,gap:gap,ratio:factor};
 });});
 if(!selected||selected.ranges.length<Math.min(20,expected)||selected.ranges.length>expected+5)throw Error('auto50_unreliable_segmentation');
 return {ranges:selected.ranges,duration:pcm.length/48000,gap:selected.gap,ratio:selected.ratio};
}
/** Opt-in remote segmentation; fail safely back to local CPU detection. */
function hskAuto50DetectRemote_(master,expected,token){
 var p=hskSettings_();
 if(p.getProperty('HSK_VOICE_REMOTE_SEGMENT')!=='true')return hskAuto50Detect_(master,expected);
 try{
  var url='https://hsk-voice-segmenter.trung-hsk668.workers.dev/segment-wav';
  var raw=UrlFetchApp.fetch(url,{method:'post',contentType:'application/json',headers:{Authorization:'Bearer '+token},payload:JSON.stringify({action:'segment-wav',audioBase64:Utilities.base64Encode(master),expected:expected}),muteHttpExceptions:true});
  if(raw.getResponseCode()!==200)throw Error('remote_segment_http_'+raw.getResponseCode());
  var response=JSON.parse(raw.getContentText());
  if(!response||!Array.isArray(response.ranges)||response.ranges.length<Math.min(20,expected)||response.ranges.length>expected+5)throw Error('invalid_remote_ranges');
  var max=hskBatchPcm_(master).length/2,prev=0;
  response.ranges.forEach(function(range){
   if(!Array.isArray(range)||range.length!==2||!range.every(function(n){return Number.isInteger(n);})||range[0]<prev||range[1]<=range[0]||range[1]>max)throw Error('invalid_remote_ranges');
   prev=range[1];
  });
  p.setProperty('HSK_VOICE_SEGMENT_LAST','worker');
  return response;
 }catch(e){
  p.setProperty('HSK_VOICE_SEGMENT_LAST','local_fallback');
  return hskAuto50Detect_(master,expected);
 }
}
function hskAuto50Cache_(storage,job,masterId,bytes,slot,batchId){
 var duplicate=['gemini-2.5-flash-preview-tts','gemini-3.1-flash-tts-preview'].map(function(model){
  return hskGetRow_(storage.sheet,hskVocabKey_(model,job.text));
 }).find(function(hit){return hit&&hit.values[11]==='READY'&&hit.values[4];});
 if(duplicate)return {file:String(duplicate.values[4]),existing:true,model:String(duplicate.values[3])};
 var key=hskVocabKey_(job.model,job.text),old=hskGetRow_(storage.sheet,key);
 if(old&&old.values[11]==='READY'&&old.values[4])return {file:String(old.values[4]),existing:true,model:job.model};
 var filename='hsk-tts-'+key.slice(0,24)+'.wav',files=storage.folder.getFilesByName(filename);
 var file=files.hasNext()?files.next():storage.folder.createFile(Utilities.newBlob(bytes,'audio/wav',filename));
 var fileId=file.getId(),stamp=new Date().toISOString(),entry=[key,'zh-CN','Kore',job.model,fileId,'audio/wav',bytes.length,stamp,stamp,0,slot,'READY','auto50_double_asr_exact:'+batchId];
 if(old)storage.sheet.getRange(old.index,1,1,13).setValues([entry]);else storage.sheet.appendRow(entry);
 return {file:fileId,existing:false,model:job.model};
}
function hskAuto50Finalize_(p,storage,tables,rows,batches,index,clipRows){
 var batch=batches[index],jobs=JSON.parse(batch[1]);
 var proved=new Set(clipRows.filter(function(r){return ['READY','EXISTING'].indexOf(r[4])>=0;}).map(function(r){return Number(r[10]);}));
 jobs.forEach(function(job){
  var r=rows[job.row];if(proved.has(job.row+2)||['READY','EXISTING'].indexOf(r[3])>=0)return;
  if(Number(r[4]||0)>=5){r[3]='REVIEW';r[11]='auto50_max_5_generation_attempts';}
  else{r[3]='RETRY';r[5]=0;r[11]='auto50_unverified_master';}
  hskVocabWrite_(tables.queue,job.row,r);
 });
 batch[3]=proved.size===jobs.length?'DONE':'PARTIAL';
 batch[4]='auto50_saved_'+proved.size+'_of_'+jobs.length+'_double_asr_verified';
 tables.batches.getRange(index+2,1,1,11).setValues([batch]);
 p.setProperty('HSK_AUTO50_LAST_BATCH',batch[0]);
 hskVocabSummary_(storage,tables);
}
function hskAuto50VerifyTick_(storage,tables,rows,batches,index,token,started){
 var p=hskSettings_(),batch=batches[index],jobs=JSON.parse(batch[1]),sheet=hskAuto50Sheet_(storage),all=hskVocabRows_(sheet,15);
 var entries=all.filter(function(r){return r[0]===batch[0];});
 var master=DriveApp.getFileById(batch[2]).getBlob().getBytes();
 if(!entries.length){
  var report;
  try{report=hskAuto50DetectRemote_(master,jobs.length,token);}
  catch(e){
   batch[3]='REVIEW';batch[4]=String(e.message||'unreliable_master');
   tables.batches.getRange(index+2,1,1,11).setValues([batch]);
   jobs.forEach(function(j){var r=rows[j.row];if(['READY','EXISTING'].indexOf(r[3])>=0)return;
    r[3]=Number(r[4]||0)>=5?'REVIEW':'RETRY';r[5]=Date.now()+300000;r[11]='auto50_unverified_master';hskVocabWrite_(tables.queue,j.row,r);
   });
   return;
  }
  var init=report.ranges.map(function(range,i){return [batch[0],i+1,Math.round(range[0]/24),Math.round(range[1]/24),'PENDING',0,'','','','',0,'','','',new Date().toISOString()];});
  sheet.getRange(sheet.getLastRow()+1,1,init.length,15).setValues(init);
  batch[3]='AUTO_VERIFY';batch[9]=report.duration;batch[10]=JSON.stringify({segments:init.length,gap:report.gap,ratio:report.ratio});
  tables.batches.getRange(index+2,1,1,11).setValues([batch]);
  entries=init;
  all=all.concat(init);
 }
 var pending=entries.map(function(r,i){return {r:r,i:i};}).filter(function(x){return ['PENDING','RECHECK'].indexOf(x.r[4])>=0;})
  .sort(function(a,b){return (a.r[4]==='PENDING'?0:1)-(b.r[4]==='PENDING'?0:1)||a.i-b.i;});
 if(!pending.length){hskAuto50Finalize_(p,storage,tables,rows,batches,index,entries);return;}
 var pcm=hskBatchPcm_(master),updates=0;
 for(var n=0;n<pending.length&&updates<5&&Date.now()-started<170000;n++){
  var item=pending[n],r=item.r,number=Number(r[1]),approx=Math.min(jobs.length-1,number-1);
  var begin=Math.max(0,Math.round((Number(r[2])-120)*24)),end=Math.min(pcm.length/2,Math.round((Number(r[3])+200)*24));
  var clip=Utilities.base64Encode(hskWav_(pcm.slice(begin*2,end*2),'audio/l16'));
  var slotCandidates=[10,0,2,3,4,5,6,7,8,9,11,1],rotation=Number(p.getProperty('HSK_AUTO50_ASR_NEXT')||0),slot=slotCandidates[rotation%slotCandidates.length];
  p.setProperty('HSK_AUTO50_ASR_NEXT',String(rotation+1));
  var decoded;
  try{
   p.setProperty('HSK_VOCAB_ASR_CALLS',String(Number(p.getProperty('HSK_VOCAB_ASR_CALLS')||0)+2));
   // Expected is used only in local comparison by Worker; it is excluded from provider transcription prompts.
   decoded=hskVocabCall_(token,{action:'verify-words',keySlot:slot,items:[jobs[approx].text],pinyin:[jobs[approx].pinyin],clips:[clip]});
   if(!Array.isArray(decoded.transcripts)||decoded.transcripts.length!==2||!Array.isArray(decoded.pinyin)||decoded.pinyin.length!==2)
    throw Error('asr_invalid_response');
   p.deleteProperty('HSK_AUTO50_ASR_ERRORS');
  }catch(e){
   var consecutive=Number(p.getProperty('HSK_AUTO50_ASR_ERRORS')||0)+1;
   p.setProperty('HSK_AUTO50_ASR_ERRORS',String(consecutive));
   p.setProperty('HSK_VOCAB_ERROR',String(e.message||'asr_provider_error').slice(0,80));
   p.setProperty('HSK_VOCAB_RETRY_AT',String(Date.now()+(consecutive>=3?1800000:120000)));
   if(consecutive>=3)p.setProperty('HSK_AUTO50_ASR_ERRORS','0');
   return;
  }
  r[5]=Number(r[5]||0)+1;r[6]=String(decoded.transcripts[0][0]||'');r[7]=String(decoded.transcripts[1][0]||'');
  r[8]=String(decoded.pinyin[0][0]||'');r[9]=String(decoded.pinyin[1][0]||'');
  var h1=hskVoiceRecHanzi_(r[6]),h2=hskVoiceRecHanzi_(r[7]),p1=hskVoiceRecPinyin_(r[8]),p2=hskVoiceRecPinyin_(r[9]);
  var matching=[];
  if(h1&&h1===h2&&p1&&p1===p2)jobs.forEach(function(job,j){
   if(hskVoiceRecHanzi_(job.text)===h1&&hskVoiceRecPinyin_(job.pinyin)===p1&&Math.abs(j-(number-1))<=4)matching.push(j);
  });
  var indexMatched=matching.length===1?matching[0]:-1;
  var already= indexMatched<0?false:entries.some(function(other){
   return other!==r&&['READY','EXISTING'].indexOf(other[4])>=0&&Number(other[10])===jobs[indexMatched].row+2;
  });
  if(indexMatched>=0&&!already){
   var job=jobs[indexMatched],bytes=hskWav_(pcm.slice(begin*2,end*2),'audio/l16'),saved=hskAuto50Cache_(storage,job,batch[2],bytes,batch[6],batch[0]);
   var q=rows[job.row];q[3]=saved.existing?'EXISTING':'READY';q[6]=batch[0];q[7]=saved.model;q[8]=batch[2];q[9]=saved.file;
   q[10]=JSON.stringify([r[6],r[7]]);q[11]='';q[13]=JSON.stringify([r[8],r[9]]);
   q[14]=r[2];q[15]=r[3];q[16]='https://drive.google.com/file/d/'+saved.file+'/view';
   hskVocabWrite_(tables.queue,job.row,q);
   r[4]=saved.existing?'EXISTING':'READY';r[10]=job.row+2;r[11]=job.text;r[12]=saved.file;r[13]='';
  }else{
   r[4]=r[5]>=3?'REVIEW':'RECHECK';r[13]=already?'duplicate_mapping':'asr_mismatch_or_unproven_mapping';
  }
  r[14]=new Date().toISOString();
  var sheetRow=all.indexOf(r)+2;
  sheet.getRange(sheetRow,1,1,15).setValues([r]);updates++;
 }
 if(entries.every(function(r){return ['READY','EXISTING','REVIEW'].indexOf(r[4])>=0}))
  hskAuto50Finalize_(p,storage,tables,rows,batches,index,entries);
 else if(updates)hskVocabSummary_(storage,tables);
}
function hskAuto50Poll_(p,book,control){
 // Read-only heartbeat for diagnosing API cooldown and script runtime limits. No credentials.
 var retryMs=Number(p.getProperty('HSK_VOCAB_RETRY_AT')||0),windowMs=Number(p.getProperty('HSK_VOCAB_WINDOW')||0);
 control.getRange(36,1,10,2).setValues([
  ['Auto_heartbeat',new Date().toISOString()],
  ['Auto_last_error',String(p.getProperty('HSK_VOCAB_ERROR')||'').slice(0,90)],
  ['Auto_retry_at',retryMs?new Date(retryMs).toISOString():'none'],
  ['Auto_window_starts',windowMs?new Date(windowMs).toISOString():'none'],
  ['Auto_runtime_ms',p.getProperty('HSK_VOCAB_RUNTIME_MS')||'0'],
  ['Auto_window_calls',p.getProperty('HSK_VOCAB_WINDOW_CALLS')||'0'],
  ['Auto_queue_enabled',p.getProperty('HSK_VOCAB_ENABLED')||'false'],
  ['Auto_pilot_only',p.getProperty('HSK_VOCAB_PILOT_ONLY')||'false'],
  ['Auto_pause',p.getProperty('HSK_VOICE_PAUSED')||'false'],
  ['Auto_internal_daily_cap','OFF; real Google and provider quotas remain']
 ]);
 var manifest=book.getSheetByName('Voice_Recovery_50');
 var segments=manifest?manifest.getRange(2,1,49,14).getValues():[];
 if(segments.length!==49)throw Error('auto50_manifest_missing');
 var unfinished=segments.some(function(r){return ['PENDING','RECHECK'].indexOf(r[3])>=0;});
 if(unfinished){
  p.setProperty('HSK_AUTO50_ENABLED','false');
  p.setProperty('HSK_VOCAB_ENABLED','false');
  var lock=LockService.getScriptLock();if(!lock.tryLock(100))return true;
  try{
   if(Number(p.getProperty('HSK_VOICE_CONTROL_AFTER')||0)>Date.now())return true;
   var started=Date.now();
   for(var n=0;n<3&&Date.now()-started<145000;n++){
    if(Number(p.getProperty('HSK_VOICE_CONTROL_AFTER')||0)>Date.now())break;
    if(!manifest.getRange(2,4,49,1).getValues().some(function(x){return ['PENDING','RECHECK'].indexOf(x[0])>=0;}))break;
    hskVoiceRecoverTick_(p,book,control);
   }
   control.getRange(6,2).setValue('AUTO_CYCLE_RECOVERING_ORIGINAL');
  }finally{lock.releaseLock();}
  return true;
 }
 if(p.getProperty('HSK_AUTO50_INITIAL_FINALIZED')!=='true'){
  var lock=LockService.getScriptLock();if(!lock.tryLock(100))return true;
  try{
   hskVoiceRecoverTick_(p,book,control);
   p.setProperty('HSK_AUTO50_INITIAL_FINALIZED','true');
   p.setProperty('HSK_AUTO50_PREVIOUS_BATCH',String(control.getRange(3,2).getValue()));
  }finally{lock.releaseLock();}
 }
 if(p.getProperty('HSK_VOICE_PAUSED')==='true'){
  control.getRange(6,2).setValue('AUTO_CYCLE_PAUSED');return true;
 }
 // The previous internal 60/75-minute and 100-call caps are now disabled.
 // Clear only the backoff created by those obsolete caps. Never override provider cooldowns.
 if(p.getProperty('HSK_AUTO50_RUNTIME_POLICY')!=='NO_INTERNAL_DAILY_CAP_V1'){
  p.setProperty('HSK_AUTO50_RUNTIME_POLICY','NO_INTERNAL_DAILY_CAP_V1');
  if(p.getProperty('HSK_VOCAB_ERROR')==='daily_runtime_or_call_budget'){
   p.deleteProperty('HSK_VOCAB_RETRY_AT');
   p.deleteProperty('HSK_VOCAB_ERROR');
  }
 }
 var blockedUntil=Number(p.getProperty('HSK_VOCAB_RETRY_AT')||0);
 if(blockedUntil>Date.now()){
  control.getRange(6,2).setValue('AUTO_CYCLE_WAITING_UNTIL_'+new Date(blockedUntil).toISOString());
  return true;
 }
 if(typeof hskAuto50Watchdog_==='function')hskAuto50Watchdog_(p,book,control);
 var source=hskCheck_(p),tables=hskVocabTables_(source),queue=hskVocabRows_(tables.queue,17),batchRows=hskVocabRows_(tables.batches,11);
 if(!queue.some(function(r){return ['PENDING','RETRY','MASTER','CHECK_AGAIN'].indexOf(r[3])>=0;})&&
    !batchRows.some(function(b){return ['MASTER','AUTO_VERIFY','VERIFY','RESERVED','UNCERTAIN'].indexOf(b[3])>=0;})){
  control.getRange(2,2).setValue('PAUSE');control.getRange(6,2).setValue('AUTO_CYCLE_COMPLETE');
  p.setProperty('HSK_AUTO50_ENABLED','false');p.setProperty('HSK_VOCAB_ENABLED','false');return true;
 }
 p.setProperty('HSK_AUTO50_ENABLED','true');
 p.setProperty('HSK_VOCAB_PILOT_ONLY','false');
 p.setProperty('HSK_SHARED50_LITERAL','true');
 p.setProperty('HSK_VOCAB_FIXED_BATCH','true');
 p.setProperty('HSK_VOCAB_BATCH_SIZE',String(typeof hskAuto50BatchSize_==='function'?hskAuto50BatchSize_(batchRows):50));
 p.setProperty('HSK_VOCAB_PAUSE','4');
 p.setProperty('HSK_WARM_ENABLED','false');
 p.setProperty('HSK_VOCAB_ENABLED','true');
 var triggers=ScriptApp.getProjectTriggers();
 if(!triggers.some(function(t){return t.getHandlerFunction()==='hskVocabTick';}))
  ScriptApp.newTrigger('hskVocabTick').timeBased().everyMinutes(1).create();
 control.getRange(6,2).setValue('AUTO_CYCLE_RUNNING_50');
 return false;
}
