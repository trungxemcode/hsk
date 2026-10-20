/**
 * One real, safe Gemini 3.8 canary while AUTO_CYCLE keeps running.
 * It reserves an actual PENDING HSK word BEFORE TTS, persists an audio file
 * BEFORE verifying, and never resends an ambiguous Gemini request.
 * Preference changes only after two independent blind ASR passes agree.
 */
function hskVoice38CanaryTick_(p,book,control){
 var command=String(control.getRange(94,4).getValue()||'');
 if(command==='CANARY38_UNCERTAIN'){
  var safeError=String(p.getProperty('HSK_VOICE_38_CANARY_LAST_ERROR')||'no_runtime_error_recorded').replace(/[^a-zA-Z0-9_:-]/g,'_').slice(0,115);
  control.getRange(95,3,1,2).setValues([['Canary38_last_error',safeError]]);
 }
 if(['RUN_38_HSK_ONCE','CANARY38_VERIFY','CANARY38_UNCERTAIN'].indexOf(command)<0&&
    command.indexOf('CANARY38_TTS_REQUESTED_')!==0)return;
 if(String(control.getRange(2,2).getValue()||'')!=='AUTO_CYCLE'||p.getProperty('HSK_VOICE_PAUSED')==='true')return;
 if(Number(p.getProperty('HSK_VOICE_38_CANARY_NEXT')||0)>Date.now())return;
 var lock=LockService.getScriptLock();if(!lock.tryLock(100))return;
 try{
  var storage=hskCheck_(p),tables=hskVocabTables_(storage),list=tables.queue;
  var token=ScriptApp.getIdentityToken();if(!token)throw Error('no_google_identity');
  var model='gemini-3.8-flash-lite-tts';
  var idx=Number(p.getProperty('HSK_VOICE_38_CANARY_QUEUE_INDEX')||-1);
  var chosen=null,now=Date.now(),row;
  if(idx>=0&&idx<list.getLastRow()-1){
   row=list.getRange(idx+2,1,1,17).getValues()[0];
   chosen={idx:idx,row:row};
  }
  if(command==='RUN_38_HSK_ONCE'){
   if(!chosen){
    var all=hskVocabRows_(list,17),preferred=['正确','正常','直接','知识','语言','友好','生活','生命','失败','世纪','适合'];
    for(var i=0;i<preferred.length&&!chosen;i++){
     var j=all.findIndex(function(r){return r[1]===preferred[i]&&r[3]==='PENDING';});
     if(j>=0)chosen={idx:j,row:all[j]};
    }
    if(!chosen){control.getRange(94,4).setValue('CANARY38_NO_FREE_PENDING_WORD');return;}
   }
   idx=chosen.idx;row=chosen.row;
   if(row[3]!=='PENDING'){
    control.getRange(94,4).setValue('CANARY38_RESERVED_OR_INVALID_'+String(row[3]));return;
   }
   var text=String(row[1]),pinyin=String(row[2]);
   var key=hskVocabKey_(model,text);
   var filename='hsk-tts-'+key.slice(0,24)+'.wav';
   var fileIterator=storage.folder.getFilesByName(filename),file=fileIterator.hasNext()?fileIterator.next():null;
   var prior=hskGetRow_(storage.sheet,key);
   if(prior&&prior.values[4]&&prior.values[11]==='READY'){
    file=DriveApp.getFileById(String(prior.values[4]));
   }
   if(!file){
    var scanned=hskVoiceRoutePairs_(p,token,now,model,null);
    var candidates=scanned.pairs.filter(function(x){return x.model===model;});
    if(!candidates.length){
     p.setProperty('HSK_VOICE_38_CANARY_NEXT',String(Math.max(now+60000,scanned.waitUntil||0)));
     control.getRange(94,4).setValue('CANARY38_KEY_COOLING');
     // Keep the requested test alive on next tick without sending TTS prematurely.
     control.getRange(94,4).setValue('RUN_38_HSK_ONCE');
     return;
    }
    var picked=candidates[0],slot=picked.slot;
    var attempts=Number(p.getProperty('HSK_VOICE_38_CANARY_ATTEMPTS')||0);
    if(attempts>=3){control.getRange(94,4).setValue('CANARY38_TTS_FAILED_3_KEYS');return;}
    p.setProperty('HSK_VOICE_38_CANARY_ATTEMPTS',String(attempts+1));
    p.setProperty('HSK_VOICE_38_CANARY_QUEUE_INDEX',String(idx));
    row[3]='CANARY38_SENT';row[6]='one_word_38_canary';row[7]=model;
    row[11]='tts_request_journaled_do_not_duplicate';
    hskVocabWrite_(list,idx,row);
    SpreadsheetApp.flush();
    control.getRange(94,4).setValue('CANARY38_TTS_REQUESTED_'+text);
    var response,decoded;
    try{
     response=UrlFetchApp.fetch(HSK_VOCAB_URL_,{method:'post',contentType:'application/json',
      headers:{Authorization:'Bearer '+token},
      payload:JSON.stringify({text:text,isolated:true,keySlot:slot,model:model,language:'zh-CN'}),
      muteHttpExceptions:true});
    }catch(e){
     row[3]='CANARY38_HOLD';row[11]='tts_transport_uncertain_do_not_resend';
     hskVocabWrite_(list,idx,row);control.getRange(94,4).setValue('CANARY38_UNCERTAIN');
     return;
    }
    try{decoded=hskParallelDecode_(response);}
    catch(e){
     var reason=String(e.message||'unknown');
     if(/response_uncertain|transport_uncertain/.test(reason)){
      row[3]='CANARY38_HOLD';row[11]='tts_response_uncertain_do_not_resend';
      hskVocabWrite_(list,idx,row);control.getRange(94,4).setValue('CANARY38_UNCERTAIN');
      return;
     }
     row[3]='PENDING';row[11]='canary38_tts_failed_'+reason.slice(0,65);
     hskVocabWrite_(list,idx,row);
     p.setProperty('HSK_VOCAB_PAIR_'+slot+'_'+model+'_AFTER',
      String(now+Math.max(60000,Number(e.retryAfter||120)*1000)));
     if(/cloudflare_tts_4(00|01|03)_invalid_model|tts_blocked|tts_permission_denied/.test(reason)||attempts>=2){
      control.getRange(94,4).setValue('CANARY38_TTS_FAILED_'+reason.slice(0,62));
     }else{
      p.setProperty('HSK_VOICE_38_CANARY_NEXT',String(Date.now()+60000));
      control.getRange(94,4).setValue('RUN_38_HSK_ONCE');
     }
     return;
    }
    var wav=decoded.bytes;
    if(wav.length<=44||wav.length>600000)throw Error('canary38_bad_audio_size');
    hskBatchPcm_(wav);
    try{file=storage.folder.createFile(Utilities.newBlob(wav,'audio/wav',filename));}
    catch(e){
     row[3]='CANARY38_HOLD';row[11]='tts_drive_save_uncertain';
     hskVocabWrite_(list,idx,row);control.getRange(94,4).setValue('CANARY38_UNCERTAIN');
     return;
    }
    p.setProperty('HSK_VOCAB_TTS_CALLS',String(Number(p.getProperty('HSK_VOCAB_TTS_CALLS')||0)+decoded.providerAttempts));
   }
   if(!file)throw Error('canary38_file_missing');
   var saved=file.getBlob().getBytes();hskBatchPcm_(saved);
   var record=[key,'zh-CN','Kore',model,file.getId(),'audio/wav',saved.length,
    new Date().toISOString(),new Date().toISOString(),0,0,'VERIFY_PENDING','canary38_tts_saved_pending_two_asr'];
   if(prior)storage.sheet.getRange(prior.index,1,1,13).setValues([record]);
   else storage.sheet.appendRow(record);
   row[3]='CANARY38_VERIFY';row[9]=file.getId();row[11]='canary38_wav_saved_pending_two_asr';
   hskVocabWrite_(list,idx,row);
   control.getRange(94,4).setValue('CANARY38_VERIFY');
   p.setProperty('HSK_VOICE_38_CANARY_NEXT',String(Date.now()+1000));
   return;
  }
  if(!chosen||['CANARY38_VERIFY','CANARY38_HOLD','CANARY38_SENT'].indexOf(chosen.row[3])<0){
   control.getRange(94,4).setValue('CANARY38_MISSING_RESERVED_WORD');return;
  }
  idx=chosen.idx;row=chosen.row;
  if(command==='CANARY38_UNCERTAIN'||command.indexOf('CANARY38_TTS_REQUESTED_')===0){
   var name='hsk-tts-'+hskVocabKey_(model,row[1]).slice(0,24)+'.wav';
   var found=storage.folder.getFilesByName(name);
   if(!found.hasNext()){
    row[3]='CANARY38_HOLD';row[11]='tts_result_uncertain_do_not_resend';
    hskVocabWrite_(list,idx,row);
    control.getRange(94,4).setValue('CANARY38_UNCERTAIN');
    return; // Never duplicate an uncertain provider request.
   }
   var recovered=found.next();row[3]='CANARY38_VERIFY';row[9]=recovered.getId();
   hskVocabWrite_(list,idx,row);
   var key2=hskVocabKey_(model,row[1]),prior2=hskGetRow_(storage.sheet,key2);
   var recovery=[key2,'zh-CN','Kore',model,recovered.getId(),'audio/wav',
    recovered.getBlob().getBytes().length,new Date().toISOString(),new Date().toISOString(),0,0,
    'VERIFY_PENDING','recovered_3_8_wav_pending_asr'];
   if(prior2)storage.sheet.getRange(prior2.index,1,1,13).setValues([recovery]);
   else storage.sheet.appendRow(recovery);
   control.getRange(94,4).setValue('CANARY38_VERIFY');return;
  }
  if(row[3]!=='CANARY38_VERIFY'||!row[9]){
   control.getRange(94,4).setValue('CANARY38_NO_WAV_FOR_ASR');return;
  }
  var bytes=DriveApp.getFileById(String(row[9])).getBlob().getBytes();hskBatchPcm_(bytes);
  var result;
  try{
   p.setProperty('HSK_VOCAB_ASR_CALLS',String(Number(p.getProperty('HSK_VOCAB_ASR_CALLS')||0)+2));
   result=hskVocabCall_(token,{action:'verify-words',keySlot:0,
    items:[row[1]],pinyin:[row[2]],clips:[Utilities.base64Encode(bytes)]});
  }catch(e){
   p.setProperty('HSK_VOICE_38_CANARY_NEXT',String(Date.now()+300000));
   control.getRange(94,4).setValue('CANARY38_VERIFY');return;
  }
  var exact=result.verification==='double_asr_exact'&&result.verified&&result.verified[0]===true&&
    Array.isArray(result.transcripts)&&result.transcripts.length===2&&
    Array.isArray(result.pinyin)&&result.pinyin.length===2&&
    result.transcripts.every(function(pass){return Array.isArray(pass)&&hskVoiceRecHanzi_(pass[0])===hskVoiceRecHanzi_(row[1]);})&&
    result.pinyin.every(function(pass){return Array.isArray(pass)&&hskVoiceRecPinyin_(pass[0])===hskVoiceRecPinyin_(row[2]);});
  var key3=hskVocabKey_(model,row[1]),prior3=hskGetRow_(storage.sheet,key3);
  if(!prior3){control.getRange(94,4).setValue('CANARY38_CACHE_ROW_MISSING');return;}
  var entry=prior3.values;
  entry[11]=exact?'READY':'REVIEW';
  entry[12]=exact?'canary38_double_asr_exact':'canary38_asr_hanzi_or_pinyin_mismatch';
  storage.sheet.getRange(prior3.index,1,1,13).setValues([entry]);
  row[3]=exact?'READY':'REVIEW';row[11]=exact?'':'canary38_asr_hanzi_or_pinyin_mismatch';
  if(exact){
   row[7]=model;row[9]=entry[4];row[16]='https://drive.google.com/file/d/'+entry[4]+'/view';
   p.setProperty('HSK_VOICE_TTS_PREFERRED_MODEL',model);
   p.setProperty('HSK_VOCAB_NEXT_MODEL','2');
   control.getRange(94,4).setValue('CANARY38_CONFIRMED_DOUBLE_ASR_PREFERRED');
  }else{
   control.getRange(94,4).setValue('CANARY38_ASR_REVIEW_NOT_PREFERRED');
  }
  hskVocabWrite_(list,idx,row);
  p.deleteProperty('HSK_VOICE_38_CANARY_QUEUE_INDEX');
 }catch(e){
  p.setProperty('HSK_VOICE_38_CANARY_LAST_ERROR',String(e.message||e).slice(0,110));
  p.setProperty('HSK_VOICE_38_CANARY_NEXT',String(Date.now()+120000));
 }finally{lock.releaseLock();}
}
