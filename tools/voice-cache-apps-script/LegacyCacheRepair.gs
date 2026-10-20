/**
 * Repair failed legacy Kho_Voice entries during AUTO_CYCLE without starting
 * a competing warm-up queue. One provider action per controlled interval.
 * Existing READY files are immutable; new files require independent double ASR.
 */
var HSK_LEGACY_BACKLOG_=[
 [27,'fànguǎn'],[30,'gāoxìng'],[67,'míngzi'],[68,'nǎlǐnǎr'],
 [69,'nà'],[70,'ne'],[73,'nián'],[79,'qián'],[80,'qiánmiàn'],
 [81,'qǐng'],[82,'qù'],[83,'rè'],[84,'rén'],[85,'rènshi'],
 [86,'rì'],[87,'sān'],[88,'shāngdiàn'],[89,'shàng'],
 [90,'shàngwǔ'],[93,'shénme']
];
function hskLegacyCandidates_(cacheRows,corpus){
 var model='gemini-2.5-flash-preview-tts',out=[];
 HSK_LEGACY_BACKLOG_.forEach(function(item){
  var text=corpus[item[0]],key=hskVocabKey_(model,text);
  var at=cacheRows.findIndex(function(r){return String(r[0])===key;});
  if(at<0)return;var r=cacheRows[at],state=String(r[11]||''),error=String(r[12]||'');
  if(state==='READY'&&r[4]&&Number(r[6])>44)return;
  if(['DEFERRED','VERIFY_PENDING','REPAIR_REQUESTED'].indexOf(state)>=0 ||
    state==='REVIEW'&&/tts_key_invalid/.test(error)){
   var alternativeKey=hskVocabKey_('gemini-3.1-flash-tts-preview',text);
   var alternative=cacheRows.find(function(entry){return entry[0]===alternativeKey&&entry[11]==='READY'&&entry[4]&&Number(entry[6])>44;});
   out.push({at:at,row:r,index:item[0],text:text,pinyin:item[1],key:key,state:state,
    alternative:['DEFERRED','REVIEW'].indexOf(state)>=0?alternative:null});
  }
 });
 return out.sort(function(a,b){
  function priority(x){return x.state==='VERIFY_PENDING'?0:x.state==='REPAIR_REQUESTED'?1:x.alternative?2:3;}
  return priority(a)-priority(b)||a.index-b.index;
 });
}
function hskLegacyCacheRepairTick_(p,book,control){
 if(String(control.getRange(55,2).getValue()||'')!=='ON')return;
 if(String(control.getRange(2,2).getValue()||'')!=='AUTO_CYCLE'||p.getProperty('HSK_VOICE_PAUSED')==='true')return;
 var now=Date.now();
 // Non-secret, low-cost diagnostics so every owner's timer tick shows precisely
 // why the independent legacy queue is or isn't making progress.
 try{
  var notBefore=Number(p.getProperty('HSK_LEGACY_REPAIR_NEXT')||0);
  var item68=Number(p.getProperty('HSK_LEGACY_ITEM_68_AFTER')||0);
  control.getRange(95,1,6,2).setValues([
   ['Legacy_diag_at',new Date(now).toISOString()],
   ['Legacy_diag_next',notBefore?new Date(notBefore).toISOString():'READY'],
   ['Legacy_diag_warm_enabled',String(p.getProperty('HSK_WARM_ENABLED')||'false')],
   ['Legacy_diag_last',String(p.getProperty('HSK_LEGACY_REPAIR_LAST')||'none').slice(0,120)],
   ['Legacy_diag_item68_next',item68?new Date(item68).toISOString():'READY'],
   ['Legacy_diag_voice_paused',String(p.getProperty('HSK_VOICE_PAUSED')||'false')]
  ]);
 }catch(diagError){}
 // Once, release only the former 2.5 TTS generation-error global backoff.
 // Per-item and provider-key cooldowns remain in force; cached 3.1 files can be reused now.
 if(p.getProperty('HSK_LEGACY_REPAIR_POLICY')!=='prefer_verified_alternates_v2'){
  p.setProperty('HSK_LEGACY_REPAIR_POLICY','prefer_verified_alternates_v2');
  if(/^tts_wait_/.test(p.getProperty('HSK_LEGACY_REPAIR_LAST')||''))p.deleteProperty('HSK_LEGACY_REPAIR_NEXT');
 }
 if(Number(p.getProperty('HSK_LEGACY_REPAIR_NEXT')||0)>now)return;
 var lock=LockService.getScriptLock();if(!lock.tryLock(100))return;
 try{
  // Avoid competing with the original warm queue: it must remain disabled.
  if(p.getProperty('HSK_WARM_ENABLED')==='true'){
   p.setProperty('HSK_LEGACY_REPAIR_LAST','blocked_parallel_warm_queue');
   p.setProperty('HSK_LEGACY_REPAIR_NEXT',String(now+600000));return;
  }
  var storage=hskCheck_(p),cache=storage.sheet;
  var data=cache.getLastRow()>1?cache.getRange(2,1,cache.getLastRow()-1,13).getValues():[];
  var allTasks=hskLegacyCandidates_(data,hskWarmCorpus_());
  var tasks=allTasks.filter(function(t){return Number(p.getProperty('HSK_LEGACY_ITEM_'+t.index+'_AFTER')||0)<=now;});
  var retry=hskWarmQueue_(storage),retryRows=hskVocabRows_(retry,6);
  function retryStatus(t,state,note){
   var at=retryRows.findIndex(function(r){return Number(r[0])===t.index;});
   var row=at>=0?retryRows[at]:[t.index,t.text,0,0,'PENDING',''];
   row[1]=t.text;row[4]=state;row[5]=String(note).slice(0,120);
   row[3]=state==='DONE'?0:Date.now()+300000;
   if(at>=0)retry.getRange(at+2,1,1,6).setValues([row]);
   else{retry.appendRow(row);retryRows.push(row);}
  }
  function save(t,changes){var row=t.row;Object.keys(changes).forEach(function(k){row[Number(k)]=changes[k];});
   row[8]=new Date().toISOString();cache.getRange(t.at+2,1,1,13).setValues([row]);}
  function next(ms,summary){p.setProperty('HSK_LEGACY_REPAIR_NEXT',String(Date.now()+ms));
   p.setProperty('HSK_LEGACY_REPAIR_LAST',summary);control.getRange(56,1,1,2).setValues([['Legacy_cache_progress',summary]]);}
  if(!tasks.length&&allTasks.length){
   var earliest=Math.min.apply(null,allTasks.map(function(t){return Number(p.getProperty('HSK_LEGACY_ITEM_'+t.index+'_AFTER')||now+600000);}));
   next(Math.max(60000,earliest-now),'legacy_items_in_provider_cooldown');return;
  }
  if(!tasks.length){
   var residual=data.filter(function(r){return r[11]!=='READY'&&Number(r[6])===0;}).length;
   control.getRange(55,2).setValue(residual?'REVIEW':'DONE');
   next(0,'finished_remaining_'+residual);return;
  }
  // Do not generate another clip if a previous request was journaled but
  // transport or Drive storage outcome was ambiguous.
  var t=tasks[0],name='hsk-tts-'+t.key.slice(0,24)+'.wav',matching=storage.folder.getFilesByName(name);
  if(t.state==='REPAIR_REQUESTED'){
   if(matching.hasNext()){
    var found=matching.next(),bytes=found.getBlob().getBytes();
    if(bytes.length>44){hskBatchPcm_(bytes);
     save(t,{4:found.getId(),6:bytes.length,11:'VERIFY_PENDING',12:'recovered_saved_wav_pending_asr'});
     next(30000,'recovered_wav_'+t.index);return;
    }
   }
   save(t,{11:'UNCERTAIN',12:'repair_transport_or_save_uncertain_no_duplicate_tts'});
   retryStatus(t,'REVIEW','repair_transport_or_save_uncertain');
   next(120000,'quarantined_uncertain_'+t.index);return;
  }
  if(t.alternative){
   try{
    var alternate=DriveApp.getFileById(String(t.alternative[4])),altAudio=alternate.getBlob().getBytes();
    if(altAudio.length<=44||altAudio.length>600000)throw Error('invalid_alternate_audio');
    hskBatchPcm_(altAudio);
    save(t,{4:alternate.getId(),6:altAudio.length,11:'VERIFY_PENDING',12:'reused_alternate_model_3_1_pending_double_asr'});
    retryStatus(t,'PENDING','reused_alternate_model_pending_asr');
    next(30000,'reused_alternate_model_'+t.index);return;
   }catch(e){next(300000,'alternate_file_unavailable_'+t.index+'_'+String(e.message||'unknown').slice(0,65));return;}
  }
  var token=ScriptApp.getIdentityToken();
  if(!token){next(600000,'identity_token_missing');return;}
  if(t.state==='VERIFY_PENDING'){
   try{
    if(!t.row[4])throw Error('verified_audio_file_missing');
    var audio=DriveApp.getFileById(String(t.row[4])).getBlob().getBytes();
    if(audio.length<=44||audio.length>600000)throw Error('invalid_legacy_audio_size');
    hskBatchPcm_(audio);
    var verified=hskVocabCall_(token,{action:'verify-words',keySlot:Number(t.row[10])||0,
     items:[t.text],pinyin:[t.pinyin],clips:[Utilities.base64Encode(audio)]});
    var transcript=verified.transcripts,pronunciation=verified.pinyin;
    var match=verified.verification==='double_asr_exact' &&
     Array.isArray(verified.verified)&&verified.verified[0]===true &&
     Array.isArray(transcript)&&transcript.length===2 &&
     Array.isArray(pronunciation)&&pronunciation.length===2 &&
     transcript.every(function(x){return hskVoiceRecHanzi_(x[0])===hskVoiceRecHanzi_(t.text);}) &&
     pronunciation.every(function(x){return hskVoiceRecPinyin_(x[0])===hskVoiceRecPinyin_(t.pinyin);});
    if(match){
     save(t,{11:'READY',12:('legacy_repair_double_asr_exact;'+String(t.row[12]||'')).slice(0,120)});
     retryStatus(t,'DONE','legacy_repair_double_asr_exact');
     next(30000,'ready_'+t.index+'_'+t.text);
    }else{
     save(t,{11:'REVIEW',12:'legacy_repair_asr_hanzi_or_pinyin_mismatch'});
     retryStatus(t,'REVIEW','legacy_repair_asr_mismatch');
     next(30000,'needs_review_'+t.index);
    }
   }catch(e){
    var err=String(e.message||'legacy_asr_unavailable');
    if(/invalid_legacy_audio|verified_audio_file_missing|batch_invalid/.test(err)){
     save(t,{11:'REVIEW',12:err.slice(0,120)});retryStatus(t,'REVIEW',err);
    }
    // A single verifier outage must never block all other zero-byte TTS repairs.
    // Preserve the saved WAV, defer ONLY this item's next ASR and select others.
    var strikes=Number(p.getProperty('HSK_LEGACY_ITEM_'+t.index+'_ASR_ERRORS')||0)+1;
    var itemWait=Math.min(3600000,900000*Math.min(4,strikes));
    p.setProperty('HSK_LEGACY_ITEM_'+t.index+'_ASR_ERRORS',String(strikes));
    p.setProperty('HSK_LEGACY_ITEM_'+t.index+'_AFTER',String(Date.now()+itemWait));
    next(60000,'asr_deferred_'+t.index+'_'+err.slice(0,65));
   }
   return;
  }
  // Another process might already have saved the WAV while the cache row
  // remained deferred. Reuse it before issuing any new paid provider request.
  if(matching.hasNext()){
   var file=matching.next(),existingBytes=file.getBlob().getBytes();hskBatchPcm_(existingBytes);
   save(t,{4:file.getId(),6:existingBytes.length,11:'VERIFY_PENDING',12:'existing_wav_requires_asr'});
   next(30000,'reuse_saved_wav_'+t.index);return;
  }
  // Gemini 3.1 is preferred for prior Gemini 2.5 generation_incomplete/429 failures.
  // Keep the original cache key as the requested model and record fallback provenance.
  var generationModel=null,slot=-1,route=typeof hskVoiceFailoverMode_==='function'?hskVoiceFailoverMode_(p):'WORKER',direct=route==='DIRECT';
  var preferred=['gemini-3.1-flash-tts-preview',String(t.row[3])];
  if(direct&&typeof hskVoiceFailoverKeyCount_==='function'&&hskVoiceFailoverKeyCount_(p)>0){
   generationModel=preferred[0];slot=0;
  }
  for(var mi=0;mi<preferred.length&&slot<0;mi++){
   try{
    var status=hskVocabCall_(token,{action:'status',model:preferred[mi]});
    var available=Array.isArray(status.slots)?status.slots.filter(function(s){
     return Number.isInteger(s.slot)&&Number(s.retryAfter||0)<=0&&
      Number(p.getProperty('HSK_LEGACY_SLOT_'+s.slot+'_AFTER')||0)<=Date.now();
    }):[];
    if(available.length){slot=available[0].slot;generationModel=preferred[mi];}
   }catch(ignored){}
  }
  if(slot<0){next(600000,'tts_models_or_keys_cooling');return;}
  // Reserve durably before contacting Gemini.
  save(t,{10:slot,11:'REPAIR_REQUESTED',12:'tts_request_journaled_model_'+(generationModel.indexOf('3.1')>=0?'3_1':'2_5')});
  retryStatus(t,'PENDING','legacy_tts_repair_journaled');
  SpreadsheetApp.flush();
  var response,decoded;
  if(direct){
   try{decoded=hskVoiceDirectTts_(p,t.text,generationModel);}
   catch(e){
    var message=String(e.message||'direct_tts_uncertain');
    if(/provider_\d+|missing_audio|direct_tts_keys_unavailable/.test(message)){
     save(t,{11:'DEFERRED',12:message.slice(0,120)});
     retryStatus(t,'PENDING',message);
     var delay=/provider_429/.test(message)?600000:300000;
     p.setProperty('HSK_LEGACY_ITEM_'+t.index+'_AFTER',String(Date.now()+delay));
     next(delay,'direct_tts_wait_'+t.index+'_'+message.slice(0,55));return;
    }
    save(t,{11:'UNCERTAIN',12:'direct_tts_transport_uncertain_no_duplicate'});
    retryStatus(t,'REVIEW','direct_tts_transport_uncertain_no_duplicate');
    next(600000,'direct_tts_uncertain_'+t.index);return;
   }
  }else{
   try{
    response=UrlFetchApp.fetch(HSK_VOCAB_URL_,{method:'post',contentType:'application/json',
     headers:{Authorization:'Bearer '+token},
     payload:JSON.stringify({text:t.text,isolated:true,keySlot:slot,model:generationModel,language:'zh-CN'}),
     muteHttpExceptions:true});
   }catch(e){
    save(t,{11:'UNCERTAIN',12:'tts_transport_uncertain_no_duplicate'});
    retryStatus(t,'REVIEW','tts_transport_uncertain_no_duplicate');
    next(600000,'tts_transport_uncertain_'+t.index);return;
   }
  }
  try{if(!decoded)decoded=hskParallelDecode_(response);}catch(e){
   var reason=String(e.message||'tts_response_uncertain');
   if(/response_uncertain|transport_uncertain/.test(reason)){
    save(t,{11:'UNCERTAIN',12:'tts_response_uncertain_no_duplicate'});
    retryStatus(t,'REVIEW','tts_response_uncertain_no_duplicate');
   }else{
    save(t,{11:'DEFERRED',12:reason.slice(0,120)});
    retryStatus(t,'PENDING',reason);
   }
   var wait=Math.max(180000,Math.min(1800000,Number(e.retryAfter||300)*1000));
   var attempts=Number(p.getProperty('HSK_LEGACY_ITEM_'+t.index+'_ATTEMPTS')||0)+1;
   p.setProperty('HSK_LEGACY_ITEM_'+t.index+'_ATTEMPTS',String(attempts));
   p.setProperty('HSK_LEGACY_ITEM_'+t.index+'_AFTER',String(Date.now()+wait));
   if(attempts>=3&&t.row[11]==='DEFERRED'){
    save(t,{11:'REVIEW',12:'legacy_tts_definite_failure_after_3_attempts'});
    retryStatus(t,'REVIEW','legacy_tts_definite_failure_after_3_attempts');
   }
   p.setProperty('HSK_LEGACY_SLOT_'+slot+'_AFTER',String(Date.now()+wait));
   next(wait,'tts_wait_'+t.index+'_'+reason.slice(0,55));return;
  }
  try{
   if(decoded.bytes.length<=44||decoded.bytes.length>600000)throw Error('invalid_legacy_audio_size');
   hskBatchPcm_(decoded.bytes);
   var created=storage.folder.createFile(Utilities.newBlob(decoded.bytes,'audio/wav',name));
   save(t,{4:created.getId(),6:decoded.bytes.length,10:slot,11:'VERIFY_PENDING',12:'generated_model_'+(generationModel.indexOf('3.1')>=0?'3_1':'2_5')+'_pending_double_asr'});
   p.deleteProperty('HSK_LEGACY_ITEM_'+t.index+'_ATTEMPTS');
   next(90000,'tts_saved_'+t.index+'_awaiting_double_asr');
  }catch(e){
   // A successful TTS request must never be resent because Drive failed.
   save(t,{11:'REPAIR_REQUESTED',12:'tts_save_uncertain_check_filename_before_retry'});
   next(180000,'tts_save_uncertain_'+t.index);
  }
 }catch(e){
  p.setProperty('HSK_LEGACY_REPAIR_LAST',String(e.message||e).slice(0,100));
  p.setProperty('HSK_LEGACY_REPAIR_NEXT',String(Date.now()+600000));
 }finally{lock.releaseLock();}
}
