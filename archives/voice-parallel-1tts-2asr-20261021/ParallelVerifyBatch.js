/** Generated from the live restored verifier; only scheduler plumbing differs. */
function hskPVBatchVerify_(storage,tables,rows,batches,index,token,started,p){
 var batch=batches[index],jobs=JSON.parse(batch[1]),sheet=hskAuto50Sheet_(storage),all=hskVocabRows_(sheet,15);
 var entries=all.filter(function(r){return r[0]===batch[0];});
 var master=DriveApp.getFileById(batch[2]).getBlob().getBytes();
 if(!entries.length){
  var report;
  try{report=hskAuto50DetectRemote_(master,jobs.length,token);}
  catch(e){if(e.hskParallelFatal)throw e;
   batch[3]='REVIEW';batch[4]=String(e.message||'unreliable_master');
   tables.batches.getRange(index+2,1,1,11).setValues([batch]);
   jobs.forEach(function(j){var r=rows[j.row];if(['READY','EXISTING'].indexOf(r[3])>=0)return;
    r[3]='RETRY';r[5]=0;r[11]='needs_new_batch_after_unverified_master';hskVocabWrite_(tables.queue,j.row,r);
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
 var backoff={batch:batch[0],clips:{}};
 try{var prior=JSON.parse(p.getProperty('HSK_AUTO50_ASR_BACKOFF')||'{}');if(prior.batch===batch[0]&&prior.clips)backoff=prior;}catch(ignore){}
 var waiting=entries.filter(function(r){return ['PENDING','RECHECK'].indexOf(r[4])>=0;});
 var pending=entries.map(function(r,i){return {r:r,i:i};}).filter(function(x){return ['PENDING','RECHECK'].indexOf(x.r[4])>=0&&Number((backoff.clips[x.r[1]]||{}).after||0)<=Date.now();})
  .sort(function(a,b){return Number((backoff.clips[a.r[1]]||{}).count||0)-Number((backoff.clips[b.r[1]]||{}).count||0)||(a.r[4]==='PENDING'?0:1)-(b.r[4]==='PENDING'?0:1)||a.i-b.i;});
 if(!pending.length){
  if(waiting.length){var earliest=Math.min.apply(null,waiting.map(function(r){return Number((backoff.clips[r[1]]||{}).after||Date.now()+60000);}));p.setProperty('HSK_VOCAB_RETRY_AT',String(earliest));return;}
  p.deleteProperty('HSK_AUTO50_ASR_BACKOFF');hskPVFinalize_(p,storage,tables,rows,batches,index,entries);return;
 }
 var pcm=hskBatchPcm_(master),updates=0;
 for(var n=0;n<pending.length&&updates<5&&Date.now()-started<170000;n++){
  var item=pending[n],r=item.r,number=Number(r[1]),approx=Math.min(jobs.length-1,number-1);
  var begin=Math.max(0,Math.round((Number(r[2])-120)*24)),end=Math.min(pcm.length/2,Math.round((Number(r[3])+200)*24));
  var clip=Utilities.base64Encode(hskWav_(pcm.slice(begin*2,end*2),'audio/l16'));
  // A merged/long utterance is not a single-word verification clip. Preserve
  // its master, defer its words, and continue other clips without an API call.
  if(clip.length>350000){
   r[4]='REVIEW';r[13]='verification_clip_too_large_next_batch';
   r[14]=new Date().toISOString();
   sheet.getRange(all.indexOf(r)+2,1,1,15).setValues([r]);updates++;continue;
  }
  var slotCandidates=[10,0,2,3,4,5,6,7,8,9,11,1],rotation=Number(p.getProperty('HSK_AUTO50_ASR_NEXT')||0),slot=slotCandidates[rotation%slotCandidates.length];
  p.setProperty('HSK_AUTO50_ASR_NEXT',String(rotation+1));
  var decoded;
  try{
   p.setProperty('HSK_VOCAB_ASR_CALLS',String(Number(p.getProperty('HSK_VOCAB_ASR_CALLS')||0)+2));
   // Expected is used only in local comparison by Worker; it is excluded from provider transcription prompts.
   decoded=hskPVVerifyCall_(token,{action:'verify-words',keySlot:slot,items:[jobs[approx].text],pinyin:[jobs[approx].pinyin],clips:[clip]});
   if(!Array.isArray(decoded.transcripts)||decoded.transcripts.length!==2||!Array.isArray(decoded.pinyin)||decoded.pinyin.length!==2)
    throw Error('asr_invalid_response');
   p.deleteProperty('HSK_AUTO50_ASR_ERRORS');
   delete backoff.clips[r[1]];p.setProperty('HSK_AUTO50_ASR_BACKOFF',JSON.stringify(backoff));
   p.deleteProperty('HSK_VOCAB_ERROR');p.deleteProperty('HSK_VOCAB_RETRY_AT');
  }catch(e){if(e.hskParallelFatal)throw e;
   var reason=String(e.message||'asr_provider_error').slice(0,100),detail=e.detail||{};
   p.setProperty('HSK_AUTO50_LAST_ASR_ERROR',reason);
   if(/invalid_verification_clip_size/.test(reason)){
    r[4]='REVIEW';r[13]='verification_clip_too_large_next_batch';r[14]=new Date().toISOString();sheet.getRange(all.indexOf(r)+2,1,1,15).setValues([r]);updates++;continue;
   }
   if(/asr_invalid_response|asr_unverified_audio|verification_uncertain/.test(reason)){
    r[5]=Number(r[5]||0)+1;r[4]=r[5]>=3?'REVIEW':'RECHECK';r[13]=reason;r[14]=new Date().toISOString();sheet.getRange(all.indexOf(r)+2,1,1,15).setValues([r]);updates++;continue;
   }
   if(/unauthorized|identity_missing|permission_denied|not_configured|invalid_request|invalid_verification_model/.test(reason)){
    p.setProperty('HSK_VOCAB_ERROR',reason);p.setProperty('HSK_VOCAB_ENABLED','false');
    storage.sheet.getParent().getSheetByName('Voice_Control').getRange(2,2).setValue('PAUSE');return;
   }
   // Provider outages do not count as a wrong pronunciation or trigger new TTS.
   // Persist per-clip retries, try other clips/keys first, honor Retry-After.
   var count=Number((backoff.clips[r[1]]||{}).count||0)+1;
   var delay=Math.max(Math.min(300000,60000*Math.pow(2,Math.min(3,count-1))),Number(detail.retryAfter||0)*1000);
   backoff.clips[r[1]]={count:count,after:Date.now()+delay};
   p.setProperty('HSK_AUTO50_ASR_BACKOFF',JSON.stringify(backoff));
   p.setProperty('HSK_VOCAB_ERROR','asr_waiting_provider');
   p.setProperty('HSK_VOCAB_RETRY_AT',String(Date.now()+60000));
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
  if(indexMatched<0&&typeof hskAuto50ThirdPassMatch_==='function'){
   indexMatched=hskAuto50ThirdPassMatch_(jobs,number,r[5],p1,p2,entries.length);
   if(indexMatched>=0)console.log(JSON.stringify({stage:'third_pass_pinyin_verified',segment:number}));
  }
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
  hskPVFinalize_(p,storage,tables,rows,batches,index,entries);
 else if(updates)hskVocabSummary_(storage,tables);
}
function hskPVFinalize_(p,storage,tables,rows,batches,index,entries){
 hskPVAssert_();return hskAuto50Finalize_(p,storage,tables,rows,batches,index,entries);
}
