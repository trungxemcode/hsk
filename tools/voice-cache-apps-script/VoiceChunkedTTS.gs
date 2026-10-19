/**
 * Recovery-first TTS strategy: one logical 50-word master, small independently saved
 * Gemini requests, inserted PCM silence AFTER generation, and no duplicate calls
 * after an interrupted checkpoint. Never promotes clips to READY; double ASR does.
 */
function hskVoiceChunkedStep_(p,storage,tables,rows,batches,index,token){
 var batch=batches[index],jobs=JSON.parse(batch[1]),id=String(batch[0]),size=10;
 var info={};try{info=JSON.parse(String(batch[10]||'{}'));}catch(ignore){}
 if(info.mode!=='chunked_v1')throw Error('invalid_tts_chunk_journal');
 var num=Math.ceil(jobs.length/size),folder=storage.folder;
 function fileNamed(name){var found=folder.getFilesByName(name);return found.hasNext()?found.next():null;}
 function write(){batch[10]=JSON.stringify(info);tables.batches.getRange(index+2,1,1,11).setValues([batch]);}
 var masterName='VOCAB_MASTER_'+id+'.wav',existing=fileNamed(masterName);
 function commitMaster(file){
  batch[2]=file.getId();batch[3]='MASTER';batch[4]='';
  batch[10]='';tables.batches.getRange(index+2,1,1,11).setValues([batch]);
  jobs.forEach(function(job){
   var row=rows[job.row];if(['READY','EXISTING'].indexOf(row[3])>=0)return;
   if(row[6]!==id){row[4]=Number(row[4]||0)+1;}
   row[3]='MASTER';row[6]=id;row[7]=batch[7];row[8]=file.getId();row[11]='';
   hskVocabWrite_(tables.queue,job.row,row);
  });
  p.setProperty('HSK_VOCAB_INITIAL_FAILURES','0');
  p.deleteProperty('HSK_VOCAB_ERROR');p.deleteProperty('HSK_VOCAB_RETRY_AT');
 }
 if(existing){commitMaster(existing);return;}
 var pieces=[];
 for(var j=0;j<num;j++)pieces.push(fileNamed('VOCAB_CHUNK_'+id+'_'+j+'.wav'));
 var missing=pieces.findIndex(function(f){return !f;});
 if(missing<0){
  // Join the successfully saved PCM segments. Explicit silence is inserted
  // only between Gemini responses, never in Gemini's requested speech text.
  var pcm=[],pauseSamples=28800,pauseBytes=new Array(pauseSamples*2).fill(0);
  for(var k=0;k<pieces.length;k++){
   var payload=hskBatchPcm_(pieces[k].getBlob().getBytes());
   if(pcm.length+payload.length+(k<num-1?pauseBytes.length:0)>HSK_VOICE_MAX_AUDIO_BYTES-44)
    throw Error('chunked_master_too_large');
   pcm=pcm.concat(payload);
   if(k<num-1)pcm=pcm.concat(pauseBytes);
  }
  var master=hskWav_(pcm,'audio/l16');
  var file=folder.createFile(Utilities.newBlob(master,'audio/wav',masterName));
  commitMaster(file);return;
 }
 var attempts=info.attempts||{},used=Number(attempts[missing]||0);
 if(used>=3){
  batch[3]='REJECTED';batch[4]='tts_chunk_failed_after_3_attempts';write();
  jobs.forEach(function(job){
   var row=rows[job.row];if(['READY','EXISTING'].indexOf(row[3])>=0)return;
   row[3]='RETRY';row[5]=Date.now()+1800000;row[11]='tts_chunk_retry_after_rejected_master';
   hskVocabWrite_(tables.queue,job.row,row);
  });
  p.setProperty('HSK_VOCAB_RETRY_AT',String(Date.now()+1800000));
  return;
 }
 var start=missing*size,subset=jobs.slice(start,start+size),now=Date.now();
 // Match the deployed shared Worker's proven short-text contract; only large pieces use items.
 var chunkText=subset.map(function(j){return j.text;}).join('?');
 var chunkPayload=Array.from(chunkText).length<=220?
  {text:chunkText,isolated:true,keySlot:batch[6],model:batch[7],language:'zh-CN'}:
  {items:subset.map(function(j){return j.text;}),isolated:true,keySlot:batch[6],model:batch[7],language:'zh-CN',pauseSeconds:1};
 // A request is journaled before the network call. Definitive provider failures
 // may be retried; ambiguous transport failures MUST be quarantined.
 attempts[missing]=used+1;info.attempts=attempts;info.lastChunk=missing;
 batch[4]='CHUNK_'+(missing+1)+'_OF_'+num+'_ATTEMPT_'+attempts[missing];write();
 var response;
 try{
  response=UrlFetchApp.fetch(HSK_VOCAB_URL_,{method:'post',contentType:'application/json',
   headers:{Authorization:'Bearer '+token},
   payload:JSON.stringify(chunkPayload),
   muteHttpExceptions:true});
 }catch(e){
  batch[3]='UNCERTAIN';batch[4]='tts_chunk_transport_uncertain_'+missing;write();
  p.setProperty('HSK_VOCAB_ERROR','tts_chunk_transport_uncertain');
  p.setProperty('HSK_VOCAB_ENABLED','false');
  return;
 }
 try{
  var decoded=hskParallelDecode_(response);
  p.setProperty('HSK_VOCAB_TTS_CALLS',String(Number(p.getProperty('HSK_VOCAB_TTS_CALLS')||0)+decoded.providerAttempts));
  p.setProperty('HSK_VOCAB_WINDOW_CALLS',String(Number(p.getProperty('HSK_VOCAB_WINDOW_CALLS')||0)+decoded.providerAttempts));
  var name='VOCAB_CHUNK_'+id+'_'+missing+'.wav';
  try{
   if(!fileNamed(name))folder.createFile(Utilities.newBlob(decoded.bytes,'audio/wav',name));
  }catch(saveError){
   // The provider already returned audio; a Drive ambiguity must not trigger another TTS call.
   batch[3]='UNCERTAIN';batch[4]='tts_chunk_drive_save_uncertain_'+missing;write();
   p.setProperty('HSK_VOCAB_ENABLED','false');p.setProperty('HSK_VOCAB_ERROR','tts_chunk_drive_save_uncertain');return;
  }
  batch[4]='CHUNK_'+(missing+1)+'_OF_'+num+'_SAVED';write();
  p.deleteProperty('HSK_VOCAB_ERROR');p.deleteProperty('HSK_VOCAB_RETRY_AT');
 }catch(e){
  var reason=String(e.message||'tts_chunk_error');
  p.setProperty('HSK_VOCAB_TTS_CALLS',String(Number(p.getProperty('HSK_VOCAB_TTS_CALLS')||0)+(e.providerAttempts||0)));
  p.setProperty('HSK_VOCAB_WINDOW_CALLS',String(Number(p.getProperty('HSK_VOCAB_WINDOW_CALLS')||0)+(e.providerAttempts||0)));
  if(/response_uncertain|transport_uncertain/.test(reason)){
   batch[3]='UNCERTAIN';batch[4]='tts_chunk_response_uncertain_'+missing;write();
   p.setProperty('HSK_VOCAB_ENABLED','false');return;
  }
  batch[4]=reason.slice(0,110);write();
  var delay=Math.max(120000,Math.min(1800000,Number(e.retryAfter||120)*1000));
  p.setProperty('HSK_VOCAB_RETRY_AT',String(now+delay));
  p.setProperty('HSK_VOCAB_ERROR',reason.slice(0,100));
  p.setProperty('HSK_VOCAB_PAIR_'+batch[6]+'_'+batch[7]+'_AFTER',String(now+delay));
 }
}
