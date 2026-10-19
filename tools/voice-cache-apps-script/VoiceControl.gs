/**
 * Private Sheet-controlled voice coordinator. No anonymous web endpoint.
 * Only time triggers executing as script owner can run this; Drive/Sheet entries are the queue.
 * All recoveries reuse an existing WAV and issue ASR only. Never call TTS from this module.
 */
function hskVoiceControlPoll_(p){
 var book=SpreadsheetApp.openById(p.getProperty('HSK_VOICE_SHEET_ID'));
 var control=book.getSheetByName('Voice_Control');
 if(!control)return false;
 var command=String(control.getRange(2,2).getValue()||'').trim();
 if(['PAUSE','RECOVER_50','RUN_VOCAB'].indexOf(command)<0)return false;
 var lock=LockService.getScriptLock();
 if(!lock.tryLock(100))return true;
 try{
  var triggers=ScriptApp.getProjectTriggers();
  if(!triggers.some(function(t){return t.getHandlerFunction()==='hskVoiceControlTick';})){
   ScriptApp.newTrigger('hskVoiceControlTick').timeBased().everyMinutes(5).create();
  }
  if(command==='RUN_VOCAB'){
   control.getRange(2,2).setValue('RUNNING');
   p.setProperty('HSK_VOCAB_ENABLED','true');
   if(!triggers.some(function(t){return t.getHandlerFunction()==='hskVocabTick';})){
    ScriptApp.newTrigger('hskVocabTick').timeBased().everyMinutes(1).create();
   }
   control.getRange(6,2).setValue('VOCAB_SCHEDULER_RESUMED');
   return true;
  }
  p.setProperty('HSK_VOCAB_ENABLED','false');
  p.setProperty('HSK_WARM_ENABLED','false');
  triggers.filter(function(t){return t.getHandlerFunction()==='hskVocabTick';})
   .forEach(function(t){ScriptApp.deleteTrigger(t);});
  if(command==='PAUSE'){
   if(String(control.getRange(6,2).getValue())==='PREPARED_NOT_STARTED')
    control.getRange(6,2).setValue('PAUSED_BY_SHEET');
   return true;
  }
  if(Number(p.getProperty('HSK_VOICE_CONTROL_AFTER')||0)>Date.now())return true;
  control.getRange(7,2).setValue(new Date().toISOString());
  hskVoiceRecoverTick_(p,book,control);
  var progress=book.getSheetByName('Tien_do_tu_vung');
  if(progress)progress.getRange(2,2).setValue(String(control.getRange(2,2).getValue())==='RECOVER_50'?'Đang xác minh master (không tạo TTS)':'Đang dừng');
  return true;
 }catch(error){
  control.getRange(6,2).setValue('CONTROL_ERROR');
  control.getRange(13,2).setValue(String(error.message||'control_error').replace(/[^a-z0-9_]/gi,'_').slice(0,90));
  p.setProperty('HSK_VOCAB_ENABLED','false');
  return true;
 }finally{lock.releaseLock();}
}
function hskVoiceControlTick(){return hskVoiceControlPoll_(hskSettings_());}
function hskVoiceRecHanzi_(x){return String(x||'').normalize('NFKC').replace(/[\s\p{P}\p{S}]/gu,'').trim();}
function hskVoiceRecPinyin_(x){return String(x||'').normalize('NFC').toLowerCase().replace(/[\s\p{P}]/gu,'');}
function hskVoiceRecoverTick_(p,book,control){
 var id=String(control.getRange(3,2).getValue()||''),masterId=String(control.getRange(4,2).getValue()||'');
 var batches=book.getSheetByName('Voice_Vocab_Batches'),saved=hskVocabRows_(batches,11),batchIndex=saved.findIndex(function(r){return r[0]===id;});
 if(batchIndex<0)throw Error('recovery_batch_missing');
 var batch=saved[batchIndex],jobs=JSON.parse(batch[1]);
 if(jobs.length!==50||batch[2]!==masterId)throw Error('recovery_source_mismatch');
 var rec=book.getSheetByName('Voice_Recovery_50'),all=rec.getRange(2,1,49,14).getValues();
 if(all.length!==49||all.some(function(r,i){return Number(r[0])!==i+1||!(Number(r[2])>Number(r[1]));}))throw Error('invalid_segment_manifest');
 var candidates=all.map(function(r,i){return {i:i,row:r};}).filter(function(x){return ['PENDING','RECHECK'].indexOf(x.row[3])>=0;}).slice(0,4);
 var passed=all.filter(function(r){return r[3]==='READY'||r[3]==='EXISTING';}).length;
 var rejected=all.filter(function(r){return r[3]==='REVIEW';}).length;
 if(!candidates.length){
  control.getRange(2,2).setValue('PAUSE');
  control.getRange(6,2).setValue('RECOVERED_'+passed+'_CONFIRMED_'+rejected+'_REVIEW');
  control.getRange(8,2,2,1).setValues([[passed],[rejected]]);
  batch[3]='RECOVERED_PARTIAL';batch[4]='only_blind_double_asr_verified_segments_saved';
  batches.getRange(batchIndex+2,1,1,11).setValues([batch]);
  // Provider rejection alone is not a pronunciation failure: keep missing words in the next TTS queue.
  var stored=hskCheck_(p),tables=hskVocabTables_(stored),vocab=hskVocabRows_(tables.queue,17);
  jobs.forEach(function(j){var r=vocab[j.row];if(r[3]==='REVIEW'&&r[11]==='provider_refused_batch'){
   r[3]='RETRY';r[5]=0;r[11]='pending_next_batch_after_unverified_master';hskVocabWrite_(tables.queue,j.row,r);
  }});
  hskVocabSummary_(stored,tables);
  return;
 }
 var storage=hskCheck_(p),pcm=hskBatchPcm_(DriveApp.getFileById(masterId).getBlob().getBytes());
 var clips=candidates.map(function(x){
  var start=Math.max(0,Math.round((Number(x.row[1])-120)*24)),end=Math.min(pcm.length/2,Math.round((Number(x.row[2])+200)*24));
  return Utilities.base64Encode(hskWav_(pcm.slice(start*2,end*2),'audio/l16'));
 });
 var selected=candidates.map(function(x){return jobs[x.i];});
 var result;
 try{
  p.setProperty('HSK_VOCAB_ASR_CALLS',String(Number(p.getProperty('HSK_VOCAB_ASR_CALLS')||0)+2));
  result=hskVocabCall_(ScriptApp.getIdentityToken(),{action:'verify-words',keySlot:batch[6],items:selected.map(function(j){return j.text;}),pinyin:selected.map(function(j){return j.pinyin;}),clips:clips});
 }catch(error){
  p.setProperty('HSK_VOICE_CONTROL_AFTER',String(Date.now()+900000));
  control.getRange(6,2).setValue('WAITING_ASR_RETRY');
  control.getRange(13,2).setValue(String(error.message||'asr_unavailable').replace(/[^a-z0-9_]/gi,'_').slice(0,90));
  return;
 }
 if(!Array.isArray(result.transcripts)||result.transcripts.length!==2||!Array.isArray(result.pinyin)||result.pinyin.length!==2)
  throw Error('invalid_asr_response');
 candidates.forEach(function(candidate,k){
  var i=candidate.i,r=candidate.row,heard1=String(result.transcripts[0][k]||''),heard2=String(result.transcripts[1][k]||''),
   pin1=String(result.pinyin[0][k]||''),pin2=String(result.pinyin[1][k]||'');
  r[4]=Number(r[4]||0)+1;r[5]=heard1;r[6]=heard2;r[7]=pin1;r[8]=pin2;
  var h1=hskVoiceRecHanzi_(heard1),h2=hskVoiceRecHanzi_(heard2),p1=hskVoiceRecPinyin_(pin1),p2=hskVoiceRecPinyin_(pin2);
  var matches=[];
  if(h1&&h1===h2&&p1&&p1===p2){
   jobs.forEach(function(j,index){if(hskVoiceRecHanzi_(j.text)===h1&&hskVoiceRecPinyin_(j.pinyin)===p1)matches.push(index);});
  }
  // One omitted utterance out of 50 can shift later indices by one. Never align merely by sequence count.
  var match=matches.length===1&&[i,i+1].indexOf(matches[0])>=0?matches[0]:-1;
  var already=match<0?false:all.some(function(other,otherIndex){return otherIndex!==i&&
   ['READY','EXISTING'].indexOf(other[3])>=0&&Number(other[9])===jobs[match].row+2;});
  if(match>=0&&!already){
   var job=jobs[match],q=hskVocabRows_(hskVocabTables_(storage).queue,17)[job.row],key=hskVocabKey_(job.model,job.text);
   var duplicate=['gemini-2.5-flash-preview-tts','gemini-3.1-flash-tts-preview'].map(function(m){return hskGetRow_(storage.sheet,hskVocabKey_(m,job.text));})
     .find(function(hit){return hit&&hit.values[11]==='READY'&&hit.values[4];});
   var old=hskGetRow_(storage.sheet,key),fileId=duplicate&&duplicate.values[4];
   if(!fileId){
    if(old&&old.values[11]==='READY')fileId=old.values[4];
    else{
     var bytes=Utilities.base64Decode(clips[k]),name='hsk-tts-'+key.slice(0,24)+'.wav',
      f=storage.folder.createFile(Utilities.newBlob(bytes,'audio/wav',name));fileId=f.getId();
     var stamp=new Date().toISOString(),entry=[key,'zh-CN','Kore',job.model,fileId,'audio/wav',bytes.length,stamp,stamp,0,batch[6],'READY','salvaged_double_asr_exact:'+id];
     if(old)storage.sheet.getRange(old.index,1,1,13).setValues([entry]);else storage.sheet.appendRow(entry);
    }
   }
   q[3]=duplicate?'EXISTING':'READY';q[6]=id;q[7]=job.model;q[8]=masterId;q[9]=fileId;
   q[10]=JSON.stringify([heard1,heard2]);q[11]='';q[13]=JSON.stringify([pin1,pin2]);
   q[14]=r[1];q[15]=r[2];q[16]='https://drive.google.com/file/d/'+fileId+'/view';
   hskVocabWrite_(hskVocabTables_(storage).queue,job.row,q);
   r[3]=duplicate?'EXISTING':'READY';r[9]=job.row+2;r[10]=job.text;r[11]=fileId;r[12]='';
  }else{
   r[3]=r[4]<3?'RECHECK':'REVIEW';
   r[12]=match<0?'asr_mismatch_or_unproven_mapping':'duplicate_mapping';
  }
  r[13]=new Date().toISOString();
  rec.getRange(i+2,1,1,14).setValues([r]);all[i]=r;
 });
 control.getRange(6,2).setValue('VERIFYING_SEGMENTS');
 control.getRange(8,2,2,1).setValues([[all.filter(function(r){return ['READY','EXISTING'].indexOf(r[3])>=0;}).length],[all.filter(function(r){return r[3]==='REVIEW';}).length]]);
 hskVocabSummary_(storage,hskVocabTables_(storage));
}
