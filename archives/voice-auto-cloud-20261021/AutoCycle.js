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
 // Definitive TTS/provider failures first, then all other retries; only then untouched words.
 // Never queue an already READY/EXISTING word and never reset REVIEW safety limits.
 var sorted=pending.sort(function(a,b){
  function priority(x){var error=String(x.r[11]||'');return x.r[3]==='RETRY'&&/provider_refused_batch|cloudflare_tts_|^tts_/.test(error)?0:
   x.r[3]==='RETRY'&&/^needs_new_batch_after_unverified_master|^auto50_unverified_master/.test(error)?1:
   x.r[3]==='RETRY'?2:3;}
  return priority(a)-priority(b)||Number(a.r[4]||0)-Number(b.r[4]||0)||
   Number(a.r[0])-Number(b.r[0])||a.i-b.i;
 });
 // Failed words are carried into the next 50-word batch, but leave room for
 // fresh words when the backlog is large. Never duplicate any queue item.
 var retry=sorted.filter(function(x){return x.r[3]==='RETRY';});
 var fresh=sorted.filter(function(x){return x.r[3]==='PENDING';});
 if(retry.length<=30||!fresh.length)return sorted;
 var first=retry.slice(0,30).concat(fresh.slice(0,20));
 if(first.length<50)first=first.concat(sorted.filter(function(x){return first.indexOf(x)<0;}).slice(0,50-first.length));
 return first.concat(sorted.filter(function(x){return first.indexOf(x)<0;}));
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
function hskAuto50Cache_(storage,job,masterId,bytes,slot,batchId,method){
 if(Number(job.slot)>=1&&Number(job.slot)<=12)slot=Number(job.slot);
 var duplicate=['gemini-2.5-flash-preview-tts','gemini-3.1-flash-tts-preview'].map(function(model){
  return hskGetRow_(storage.sheet,hskFastPhaseKey_(model,job.text,job.pinyin,job.level));
 }).find(function(hit){return hit&&hit.values[11]==='READY'&&hit.values[4];});
 if(duplicate)return {file:String(duplicate.values[4]),existing:true,model:String(duplicate.values[3])};
 var key=hskFastPhaseKey_(job.model,job.text,job.pinyin,job.level),old=hskGetRow_(storage.sheet,key);
 if(old&&old.values[11]==='READY'&&old.values[4])return {file:String(old.values[4]),existing:true,model:job.model};
 var filename='hsk-tts-'+key.slice(0,24)+'.wav',files=storage.folder.getFilesByName(filename);
 var file=files.hasNext()?files.next():storage.folder.createFile(Utilities.newBlob(bytes,'audio/wav',filename));
 var proofPrefix=method==='gemini_text_judge'?'full50_blind_asr_gemini_judge:':method==='pinyin_third_check'?'auto50_double_asr_pinyin_round3:':'auto50_double_asr_exact:';
 var fileId=file.getId(),stamp=hskVNTime_(new Date()),entry=[key,'zh-CN','Kore',job.model,fileId,'audio/wav',bytes.length,stamp,stamp,0,slot,'READY',proofPrefix+batchId];
 if(old)storage.sheet.getRange(old.index,1,1,13).setValues([entry]);else storage.sheet.appendRow(entry);
 return {file:fileId,existing:false,model:job.model};
}
function hskAuto50Finalize_(p,storage,tables,rows,batches,index,clipRows){
 var batch=batches[index],jobs=JSON.parse(batch[1]);
 var proved=new Set(clipRows.filter(function(r){return ['READY','EXISTING'].indexOf(r[4])>=0;}).map(function(r){return Number(r[10]);}));
 jobs.forEach(function(job){
  var r=rows[job.row];if(proved.has(job.row+2)||['READY','EXISTING'].indexOf(r[3])>=0)return;
  // Every unverified word is eligible for the NEXT logical 50-word batch.
  // Prior generation attempts remain auditable; a failed ASR is not a final pronunciation verdict.
  if(typeof hskCongestionFailed_==='function')hskCongestionFailed_(p,job,batch[0],r);
  else {r[3]='RETRY';r[5]=0;r[11]='needs_new_batch_after_unverified_master';}
  hskVocabWrite_(tables.queue,job.row,r);
 });
 batch[3]=proved.size===jobs.length?'DONE':'PARTIAL';
 batch[4]='auto50_saved_'+proved.size+'_of_'+jobs.length+'_double_asr_verified'+(jobs.length===50&&proved.size<35?';quality_below_35_retry_unverified':'');
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
  try{
   // Compatibility for WAV masters safely generated by the newer dictionary pipeline.
   // Reuse proven boundaries instead of calling the remote segmenter again.
   var cached={};try{cached=JSON.parse(batch[10]||'{}');}catch(ignore){}
   if(cached.qualityProfile==='dictionary_v1'&&cached.boundaryProven===true&&Array.isArray(cached.ranges)&&cached.ranges.length===jobs.length)report=cached;
   else report=hskAuto50DetectRemote_(master,jobs.length,token);
  }
  catch(e){
   batch[3]='REVIEW';batch[4]=String(e.message||'unreliable_master');
   tables.batches.getRange(index+2,1,1,11).setValues([batch]);
   jobs.forEach(function(j){var r=rows[j.row];if(['READY','EXISTING'].indexOf(r[3])>=0)return;
    if(typeof hskCongestionFailed_==='function')hskCongestionFailed_(p,j,batch[0]+':segment',r);
    else {r[3]='RETRY';r[5]=0;r[11]='needs_new_batch_after_unverified_master';}
    hskVocabWrite_(tables.queue,j.row,r);
   });
   return;
  }
  var init=report.ranges.map(function(range,i){return [batch[0],i+1,Math.round(range[0]/24),Math.round(range[1]/24),'PENDING',0,'','','','',0,'','','',hskVNTime_(new Date())];});
  sheet.getRange(sheet.getLastRow()+1,1,init.length,15).setValues(init);
  batch[3]='AUTO_VERIFY';batch[9]=report.duration;batch[10]=JSON.stringify({segments:init.length,gap:report.gap,ratio:report.ratio,qualityProfile:report.qualityProfile||'',boundaryProven:report.boundaryProven===true});
  tables.batches.getRange(index+2,1,1,11).setValues([batch]);
  entries=init;
  all=all.concat(init);
 }
 // Keep the saved master and retry only the clip whose provider call failed.
 var backoff={batch:batch[0],clips:{}};
 try{var prior=JSON.parse(p.getProperty('HSK_AUTO50_ASR_BACKOFF')||'{}');if(prior.batch===batch[0]&&prior.clips)backoff=prior;}catch(ignore){}
 var waiting=entries.filter(function(r){return ['PENDING','RECHECK'].indexOf(r[4])>=0;});
 var pending=entries.map(function(r,i){return {r:r,i:i};}).filter(function(x){return ['PENDING','RECHECK'].indexOf(x.r[4])>=0&&Number((backoff.clips[x.r[1]]||{}).after||0)<=Date.now();})
  .sort(function(a,b){return Number((backoff.clips[a.r[1]]||{}).count||0)-Number((backoff.clips[b.r[1]]||{}).count||0)||(a.r[4]==='PENDING'?0:1)-(b.r[4]==='PENDING'?0:1)||a.i-b.i;});
 if(!pending.length){
  if(waiting.length){var earliest=Math.min.apply(null,waiting.map(function(r){return Number((backoff.clips[r[1]]||{}).after||Date.now()+60000);}));p.setProperty('HSK_VOCAB_RETRY_AT',String(earliest));return;}
  p.deleteProperty('HSK_AUTO50_ASR_BACKOFF');hskAuto50Finalize_(p,storage,tables,rows,batches,index,entries);return;
 }
 var pcm=hskBatchPcm_(master),updates=0,attemptedCalls=0;
 for(var n=0;n<pending.length&&updates<10&&attemptedCalls<10&&Date.now()-started<170000;n++){
  var item=pending[n],r=item.r,number=Number(r[1]),approx=Math.min(jobs.length-1,number-1);
  var begin=Math.max(0,Math.round((Number(r[2])-120)*24)),end=Math.min(pcm.length/2,Math.round((Number(r[3])+200)*24));
  var dictionary=JSON.parse(batch[10]||'{}').qualityProfile==='dictionary_v1';
  var speech=pcm.slice(begin*2,end*2),clipBytes=hskWav_(dictionary?new Array(7200).fill(0).concat(speech,new Array(12000).fill(0)):speech,'audio/l16');
  var clip=Utilities.base64Encode(clipBytes);
  if(clip.length>350000){r[4]='REVIEW';r[13]='verification_clip_too_large_next_batch';r[14]=hskVNTime_(new Date());sheet.getRange(all.indexOf(r)+2,1,1,15).setValues([r]);updates++;continue;}
  var slot;
  if(typeof hskStableAsrSlot_==='function'){
   var picked=hskStableAsrSlot_(p,Date.now());
   if(!picked.slot){p.setProperty('HSK_VOCAB_RETRY_AT',String(picked.retryAt));break;}
   slot=picked.slot;
  }else{
   var slotCandidates=[10,12,1,2,3,4,5,6,7,8,9,11],rotation=Number(p.getProperty('HSK_AUTO50_ASR_NEXT')||0);slot=slotCandidates[rotation%slotCandidates.length];
   p.setProperty('HSK_AUTO50_ASR_NEXT',String(rotation+1));
  }
  var decoded,asrStarted=Date.now(),asrStatus='ok';
  try{
   attemptedCalls++;
   p.setProperty('HSK_VOCAB_ASR_CALLS',String(Number(p.getProperty('HSK_VOCAB_ASR_CALLS')||0)+2));
   // Expected is used only in local comparison by Worker; it is excluded from provider transcription prompts.
   decoded=hskVocabCall_(token,{action:'verify-words',keySlot:slot,items:[jobs[approx].text],pinyin:[jobs[approx].pinyin],clips:[clip]});
   if(!Array.isArray(decoded.transcripts)||decoded.transcripts.length!==2||!Array.isArray(decoded.pinyin)||decoded.pinyin.length!==2)
    throw Error('asr_invalid_response');
   delete backoff.clips[r[1]];p.setProperty('HSK_AUTO50_ASR_BACKOFF',JSON.stringify(backoff));
   p.deleteProperty('HSK_VOCAB_ERROR');p.deleteProperty('HSK_VOCAB_RETRY_AT');
  }catch(e){
   asrStatus=String(e.message||'asr_provider_error');
   var reason=String(e.message||'asr_provider_error').slice(0,100),detail=e.detail||{};
   if(typeof hskStableAsrError_==='function')hskStableAsrError_(p,slot,detail,reason);
   if(/invalid_verification_clip_size/.test(reason)){
    r[4]='REVIEW';r[13]='verification_clip_too_large_next_batch';r[14]=hskVNTime_(new Date());sheet.getRange(all.indexOf(r)+2,1,1,15).setValues([r]);updates++;continue;
   }
   if(/asr_invalid_response|asr_unverified_audio|verification_uncertain/.test(reason)){
    r[5]=Number(r[5]||0)+1;r[4]=r[5]>=3?'REVIEW':'RECHECK';r[13]=reason;r[14]=hskVNTime_(new Date());sheet.getRange(all.indexOf(r)+2,1,1,15).setValues([r]);updates++;continue;
   }
   if(/unauthorized|identity_missing|permission_denied|not_configured|invalid_request|invalid_verification_model/.test(reason)){
    p.setProperty('HSK_VOCAB_ERROR',reason);p.setProperty('HSK_VOCAB_ENABLED','false');
    storage.sheet.getParent().getSheetByName('Voice_Control').getRange(2,2).setValue('PAUSE');return;
   }
   // Provider failure is not a pronunciation failure. Switch key and clip.
   var count=Number((backoff.clips[r[1]]||{}).count||0)+1;
   var delay=Math.max(Math.min(300000,60000*Math.pow(2,Math.min(3,count-1))),Number(detail.retryAfter||0)*1000);
   backoff.clips[r[1]]={count:count,after:Date.now()+delay};
   p.setProperty('HSK_AUTO50_ASR_BACKOFF',JSON.stringify(backoff));
   p.setProperty('HSK_VOCAB_ERROR','asr_slot_'+slot+'_'+reason.replace(/[^a-z0-9_]/gi,'_').slice(0,64));
   p.deleteProperty('HSK_VOCAB_RETRY_AT');
   continue;
  }finally{if(typeof hskCongestionMetric_==='function')hskCongestionMetric_(p,'ASR',asrStarted,asrStatus);}
  r[5]=Number(r[5]||0)+1;r[6]=String(decoded.transcripts[0][0]||'');r[7]=String(decoded.transcripts[1][0]||'');
  r[8]=String(decoded.pinyin[0][0]||'');r[9]=String(decoded.pinyin[1][0]||'');
  // First two checks require both Hanzi and pinyin; the third may use uniquely
  // confirmed phonetics at the exact position if boundaries are 1:1.
  var proof=hskAuto50QualityMatch_(jobs,number,entries.length,r[5],r[6],r[7],r[8],r[9]);
  var indexMatched=proof.index;
  var already= indexMatched<0?false:entries.some(function(other){
   return other!==r&&['READY','EXISTING'].indexOf(other[4])>=0&&Number(other[10])===jobs[indexMatched].row+2;
  });
  if(indexMatched>=0&&!already){
   var job=jobs[indexMatched],bytes=clipBytes,saved=hskAuto50Cache_(storage,job,batch[2],bytes,batch[6],batch[0],proof.method);
   var q=rows[job.row];q[3]=saved.existing?'EXISTING':'READY';q[6]=batch[0];q[7]=saved.model;q[8]=batch[2];q[9]=saved.file;
   q[10]=JSON.stringify([r[6],r[7]]);q[11]='';q[13]=JSON.stringify([r[8],r[9]]);
   q[14]=r[2];q[15]=r[3];q[16]='https://drive.google.com/file/d/'+saved.file+'/view';
   hskVocabWrite_(tables.queue,job.row,q);
   r[4]=saved.existing?'EXISTING':'READY';r[10]=job.row+2;r[11]=job.text;r[12]=saved.file;r[13]=proof.method==='pinyin_third_check'?'pinyin_third_check':'';
  }else{
   r[4]=r[5]>=3?'REVIEW':'RECHECK';r[13]=already?'duplicate_mapping':'asr_mismatch_or_unproven_mapping';
  }
  r[14]=hskVNTime_(new Date());
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
  ['Auto_heartbeat',hskVNTime_(new Date())],
  ['Auto_last_error',String(p.getProperty('HSK_VOCAB_ERROR')||'').slice(0,90)],
  ['Auto_retry_at',retryMs?hskVNTime_(new Date(retryMs)):'none'],
  ['Auto_window_starts',windowMs?hskVNTime_(new Date(windowMs)):'none'],
  ['Auto_runtime_ms',p.getProperty('HSK_VOCAB_RUNTIME_MS')||'0'],
  ['Auto_window_calls',p.getProperty('HSK_VOCAB_WINDOW_CALLS')||'0'],
  ['Auto_queue_enabled',p.getProperty('HSK_VOCAB_ENABLED')||'false'],
  ['Auto_pilot_only',p.getProperty('HSK_VOCAB_PILOT_ONLY')||'false'],
  ['Auto_pause',p.getProperty('HSK_VOICE_PAUSED')||'false'],
  ['Auto_internal_daily_cap','OFF; real Google and provider quotas remain']
 ]);
 if(typeof hskVoiceTtsHealthTick_==='function')hskVoiceTtsHealthTick_(p,control);
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
 // One-time recovery of verified ASR failures which an old five-attempt limit parked.
 // Leave polyphonic conflicts, policy refusals and uncertain provider calls untouched.
 if(p.getProperty('HSK_AUTO50_REQUEUE_EXHAUSTED_V1')!=='true'){
  var recoveryStorage=hskCheck_(p),recoveryTables=hskVocabTables_(recoveryStorage);
  var oldWords=hskVocabRows_(recoveryTables.queue,17),restored=0;
  oldWords.forEach(function(r,i){
   if(r[3]!=='REVIEW'||r[11]!=='auto50_max_5_generation_attempts')return;
   r[3]='RETRY';r[5]=0;r[11]='needs_new_batch_after_unverified_master';
   hskVocabWrite_(recoveryTables.queue,i,r);restored++;
  });
  p.setProperty('HSK_AUTO50_REQUEUE_EXHAUSTED_V1','true');
  p.setProperty('HSK_AUTO50_REQUEUED_FAILED',String(restored));
  if(restored)hskVocabSummary_(recoveryStorage,recoveryTables);
 }
 if(p.getProperty('HSK_VOICE_PAUSED')==='true'){
  control.getRange(6,2).setValue('AUTO_CYCLE_PAUSED');return true;
 }
 // One-time migration of a definitively invalid chunk request payload (HTTP 400).
 // Do not clear unrelated provider cooldowns, ASR backoffs or ambiguous failures.
 if(p.getProperty('HSK_VOCAB_CHUNK_SCHEMA')!=='short_text_v2'){
  p.setProperty('HSK_VOCAB_CHUNK_SCHEMA','short_text_v2');
  if(p.getProperty('HSK_VOCAB_ERROR')==='cloudflare_tts_400_request_failed'){
   p.deleteProperty('HSK_VOCAB_RETRY_AT');p.deleteProperty('HSK_VOCAB_ERROR');
  }
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
 // The old Worker rejected the ASR request schema before reaching Gemini.
 // Its obsolete cooldown is safe to clear once now that verify-words is supported.
 if(p.getProperty('HSK_AUTO50_ASR_BRIDGE_RESUMED_V1')!=='true'&&p.getProperty('HSK_VOCAB_ERROR')==='invalid_request'){
  p.setProperty('HSK_AUTO50_ASR_BRIDGE_RESUMED_V1','true');
  p.deleteProperty('HSK_VOCAB_RETRY_AT');p.deleteProperty('HSK_VOCAB_ERROR');
  p.deleteProperty('HSK_AUTO50_ASR_ERRORS');
 }
 var blockedUntil=Number(p.getProperty('HSK_VOCAB_RETRY_AT')||0);
 // A failed 502 for one key/model must not stall the entire queue when
 // another eligible 2.5 / 3.1 / 3.8 combination is available. This only probes
 // status (no generation). HTTP 429 Retry-After is never forcibly cleared.
 if(blockedUntil>Date.now()&&/^cloudflare_tts_502_/.test(String(p.getProperty('HSK_VOCAB_ERROR')||''))){
  try{
   var scan=hskVoiceRoutePairs_(p,ScriptApp.getIdentityToken(),Date.now(),
     hskVoiceTtsModels_()[Math.max(0,Math.min(2,Number(p.getProperty('HSK_VOCAB_NEXT_MODEL')||0)))]);
   if(scan.pairs.length){
    p.deleteProperty('HSK_VOCAB_RETRY_AT');blockedUntil=0;
    control.getRange(87,4).setValue('AUTO_RETRY_'+hskVoiceModelTag_(scan.pairs[0].model)+'_KEY_'+scan.pairs[0].slot);
   }else control.getRange(87,4).setValue('ALL_MODELS_COOLING');
  }catch(e){control.getRange(87,4).setValue('MODEL_STATUS_UNAVAILABLE_KEEP_WAIT');}
 }
 if(blockedUntil>Date.now()){
  control.getRange(6,2).setValue('AUTO_CYCLE_WAITING_UNTIL_'+hskVNTime_(new Date(blockedUntil)));
  return true;
 }
 if(typeof hskAuto50Watchdog_==='function')hskAuto50Watchdog_(p,book,control);
 var source=hskCheck_(p),tables=hskVocabTables_(source),queue=hskVocabRows_(tables.queue,17),batchRows=hskVocabRows_(tables.batches,11);
 // The owner scheduler always reaches this poll, including when vocabulary
 // triggers are delayed. Initialize lightweight stages here once, not in
 // any TTS, ASR or provider path.
 if(typeof hskFastPhaseInit_==='function'&&p.getProperty('HSK_VOCAB_PILOT_ONLY')!=='true')hskFastPhaseInit_(p,source,queue);
 if(!queue.some(function(r){return ['PENDING','RETRY','MASTER','CHECK_AGAIN','HOLD_UNCERTAIN','REVIEW'].indexOf(r[3])>=0;})&&
    !batchRows.some(function(b){return ['MASTER','AUTO_VERIFY','VERIFY','RESERVED','UNCERTAIN'].indexOf(b[3])>=0;})){
  // Keep the fast scheduler alive so the vocabulary tick can safely enqueue
  // HSK1, then HSK5 and HSK6 under its existing script lock.
  if(typeof hskFastPhaseOnEmpty_==='function'&&p.getProperty('HSK_FAST_PHASE_STAGE')!=='DONE'){
   control.getRange(6,2).setValue('AUTO_CYCLE_PHASE_HANDOFF');
   return false;
  }
  control.getRange(2,2).setValue('PAUSE');control.getRange(6,2).setValue('AUTO_CYCLE_COMPLETE');
  p.setProperty('HSK_AUTO50_ENABLED','false');p.setProperty('HSK_VOCAB_ENABLED','false');return true;
 }
 p.setProperty('HSK_AUTO50_ENABLED','true');
 p.setProperty('HSK_VOCAB_PILOT_ONLY','false');
 p.setProperty('HSK_SHARED50_LITERAL','true');
 p.setProperty('HSK_VOCAB_FIXED_BATCH','true');
 // Keep 50 distinct queued words even when Gemini TTS is produced in smaller requests.
 p.setProperty('HSK_VOCAB_BATCH_SIZE','50');
 p.setProperty('HSK_VOCAB_TTS_STRATEGY','chunks-v1');
 p.setProperty('HSK_VOCAB_PAUSE','1');
 // The independent Kho_Voice warm-up may run alongside 50-word vocabulary batches.
 // Shared script locking protects commits without globally disabling the other queue.
 p.setProperty('HSK_VOCAB_ENABLED','true');
 var triggers=ScriptApp.getProjectTriggers();
 if(!triggers.some(function(t){return t.getHandlerFunction()==='hskVocabTick';}))
  ScriptApp.newTrigger('hskVocabTick').timeBased().everyMinutes(1).create();
 control.getRange(6,2).setValue('AUTO_CYCLE_RUNNING_50');
 return false;
}
