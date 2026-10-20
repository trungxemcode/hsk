/**
 * Durable adaptive TTS synthesis. One logical 50-word batch, at most one
 * provider TTS request per trigger. Previously saved WAV chunks are never
 * regenerated; failing 10-word chunks split into 5, 2/3, then single words.
 * Definitively failed single words alone are requeued, preserving the rest.
 * No synthesized WAV is READY until independent double-ASR approval.
 */
function hskVoiceChunkedStep_(p,storage,tables,rows,batches,index,token){
 var batch=batches[index],jobs=JSON.parse(batch[1]),id=String(batch[0]),folder=storage.folder;
 var info={};try{info=JSON.parse(String(batch[10]||'{}'));}catch(ignore){}
 if(info.mode!=='chunked_v1')throw Error('invalid_tts_chunk_journal');
 var fallback='gemini-3.8-flash-lite-tts';
 function fileNamed(name){var found=folder.getFilesByName(name);return found.hasNext()?found.next():null;}
 function write(){batch[10]=JSON.stringify(info);tables.batches.getRange(index+2,1,1,11).setValues([batch]);}
 function report(msg){batch[4]=msg.slice(0,110);write();}
 var masterName='VOCAB_MASTER_'+id+'.wav';
 // Decode old resumable journal without touching the saved legacy filenames.
 if(!Array.isArray(info.plan)){
  var plan=[];
  for(var base=0; base<jobs.length; base+=10){
   var k=Math.floor(base/10),savedName='VOCAB_CHUNK_'+id+'_'+k+'.wav';
   plan.push({from:base,to:Math.min(jobs.length,base+10),name:savedName,
    model:batch[7],tries:Number((info.attempts||{})[k]||0),slot:Number(batch[6])});
  }
  // Older attempts are preserved but can try the other two models before
  // deciding the recorded word group is too difficult.
  if(plan.some(function(g){return g.tries>=3;})){
   plan.forEach(function(g){if(!fileNamed(g.name)&&g.tries>0)g.model=hskVoiceNextModel_(g.model);});
  }
  info.plan=plan;info.omitted=Array.isArray(info.omitted)?info.omitted:[];
  info.version='adaptive_v2';write();
 }
 var plan=info.plan;
 function keptJobs(){
  var included=[];
  plan.forEach(function(g){
   for(var q=g.from;q<g.to;q++){
    var job=Object.assign({},jobs[q]);job.model=g.model||batch[7];
    included.push(job);
   }
  });
  return included;
 }
 function commitMaster(file){
  var kept=keptJobs();
  if(!kept.length)throw Error('adaptive_master_no_words');
  batch[1]=JSON.stringify(kept);batch[2]=file.getId();batch[3]='MASTER';
  batch[4]=info.omitted.length?'adaptive_master_kept_'+kept.length+'_omitted_'+info.omitted.length:'';
  var qualityReport=null;
  if(info.qualityProfile==='dictionary_v1'){
   var offset=0,ranges=[],proven=true;
   plan.forEach(function(g,k){
    var wav=fileNamed(g.name),bytes=hskBatchPcm_(wav.getBlob().getBytes());
    if(!Array.isArray(g.ranges)||g.ranges.length!==g.to-g.from)proven=false;
    else g.ranges.forEach(function(r){ranges.push([r[0]+offset,r[1]+offset]);});
    offset+=bytes.length/2+(k<plan.length-1?28800:0);
   });
   qualityReport={qualityProfile:'dictionary_v1',boundaryProven:proven,ranges:proven?ranges:[],duration:offset/24000};
  }
  batch[10]=qualityReport?JSON.stringify(qualityReport):'';tables.batches.getRange(index+2,1,1,11).setValues([batch]);
  kept.forEach(function(job){
   var row=rows[job.row];
   if(['READY','EXISTING'].indexOf(row[3])>=0)return;
   if(row[6]!==id)row[4]=Number(row[4]||0)+1;
   row[3]='MASTER';row[6]=id;row[7]=job.model;
   row[8]=file.getId();row[11]='';hskVocabWrite_(tables.queue,job.row,row);
  });
  p.deleteProperty('HSK_VOCAB_ERROR');p.deleteProperty('HSK_VOCAB_RETRY_AT');
  if(typeof hskVoiceFailoverMark_==='function')hskVoiceFailoverMark_(p,'master_wav_saved');
  p.setProperty('HSK_AUTO50_LAST_RECOVERED',id+':'+kept.length+'/'+jobs.length);
 }
 var existingMaster=fileNamed(masterName);
 if(existingMaster){commitMaster(existingMaster);return;}
 var missing=plan.findIndex(function(g){return !fileNamed(g.name);});
 if(missing<0){
  if(info.qualityProfile==='dictionary_v1'){
   for(var q=0;q<plan.length;q++){
    var part=plan[q];if(Array.isArray(part.ranges)&&part.ranges.length===part.to-part.from)continue;
    var found=hskVoiceQualityDetect_(fileNamed(part.name).getBlob().getBytes(),part.to-part.from);
    if(found){part.ranges=found.ranges;continue;}
    for(var word=part.from;word<part.to;word++){
     var job=jobs[word],row=rows[job.row];if(['READY','EXISTING'].indexOf(row[3])<0){row[3]='RETRY';row[5]=0;row[7]=part.model;row[11]='needs_new_batch_after_unverified_master;unproven_boundaries';hskVocabWrite_(tables.queue,job.row,row);}
     if(info.omitted.indexOf(word)<0)info.omitted.push(word);
    }
    plan.splice(q,1);report('DEFER_UNPROVEN_BOUNDARIES_KEEP_MASTER_CHUNK');return;
   }
  }
  if(!plan.length){
   batch[3]='PARTIAL';report('adaptive_zero_audio_all_words_requeued');return;
  }
  var total=0,frames=[],silence=new Array(28800*2).fill(0);
  plan.forEach(function(g,k){
   var wav=fileNamed(g.name);
   if(!wav)throw Error('adaptive_missing_saved_chunk');
   var bytes=hskBatchPcm_(wav.getBlob().getBytes());
   total+=bytes.length+(k<plan.length-1?silence.length:0);
   if(total>HSK_VOICE_MAX_AUDIO_BYTES-44)throw Error('adaptive_master_too_large');
   frames.push(bytes);
  });
  var pcm=[];
  frames.forEach(function(frame,k){pcm=pcm.concat(frame);if(k<frames.length-1)pcm=pcm.concat(silence);});
  var master=hskWav_(pcm,'audio/l16');
  var file;
  try{file=folder.createFile(Utilities.newBlob(master,'audio/wav',masterName));}
  catch(e){if(typeof hskPipelineFenceError_==='function')hskPipelineFenceError_(e);
   // A file may have been saved even if Google Drive returned an exception.
   file=fileNamed(masterName);
   if(!file){batch[3]='UNCERTAIN';report('adaptive_master_drive_save_uncertain');p.setProperty('HSK_VOCAB_ENABLED','false');return;}
  }
  commitMaster(file);return;
 }
 var g=plan[missing],length=g.to-g.from,maxTries=3;
 if(g.tries>=maxTries){
  // Never shrink a failed group. Keep the proven audio chunks and carry every
  // unsynthesized word into the next 50-word logical batch.
  for(var omitted=g.from;omitted<g.to;omitted++){
   var excluded=jobs[omitted],row=rows[excluded.row];
   if(['READY','EXISTING'].indexOf(row[3])<0){
    row[3]='RETRY';row[5]=0;
    row[11]='tts_chunk_unavailable_next_batch';hskVocabWrite_(tables.queue,excluded.row,row);
   }
   if(info.omitted.indexOf(omitted)<0)info.omitted.push(omitted);
  }
  plan.splice(missing,1);
  report('DEFERRED_'+length+'_WORDS_TO_NEXT_50_KEEP_SAVED_CHUNKS');
  return;
 }
 var route=typeof hskVoiceFailoverMode_==='function'?hskVoiceFailoverMode_(p):'WORKER';
 var direct=route==='DIRECT';
 if(direct&&typeof hskVoiceFailoverKeyCount_==='function'&&hskVoiceFailoverKeyCount_(p)<1){
  p.setProperty('HSK_VOCAB_ERROR','direct_keys_not_configured');
  p.setProperty('HSK_VOCAB_RETRY_AT',String(Date.now()+300000));return;
 }
 var slot=Number(batch[6]);
 if(!direct){
  var scan=hskVoiceRoutePairs_(p,token,Date.now(),g.model,
   g.tries>0?{model:g.model,slot:g.slot}:null);
  if(!scan.pairs.length){
   var when=hskVoiceEarliestProviderRetry_(Date.now(),scan.waitUntil);
   p.setProperty('HSK_VOCAB_ERROR','all_tts_models_or_keys_cooling');
   p.setProperty('HSK_VOCAB_RETRY_AT',String(when));
   report('WAIT_ALL_MODELS_2_5_3_1_3_8');
   return;
  }
  if(info.qualityProfile==='dictionary_v1'&&typeof hskVoiceQualityOrderPairs_==='function'){
   var selectedRows=jobs.slice(g.from,g.to).map(function(j){return rows[j.row];}),avoid={};
   selectedRows.forEach(function(r){if(/^needs_new_batch_after_unverified_master/.test(String(r[11]||''))&&r[7])avoid[r[7]]=(avoid[r[7]]||0)+1;});
   var bad=Object.keys(avoid).sort(function(a,b){return avoid[b]-avoid[a];})[0];
   scan.pairs=hskVoiceQualityOrderPairs_(p,scan.pairs,bad);
  }
  slot=scan.pairs[0].slot;g.model=scan.pairs[0].model;
  info.slotHint=(slot+1)%13;
 }
 var selected=jobs.slice(g.from,g.to),joined=selected.map(function(job){return job.text;}).join('?');
 var payload=Array.from(joined).length<=220?
  {text:joined,isolated:true,keySlot:slot,model:g.model,language:'zh-CN'}:
  {items:selected.map(function(job){return job.text;}),isolated:true,keySlot:slot,model:g.model,language:'zh-CN',pauseSeconds:1};
 if(info.qualityProfile==='dictionary_v1'&&!direct)payload={items:selected.map(function(job){return job.text;}),isolated:true,keySlot:slot,model:g.model,language:'zh-CN',dictionaryStyle:true};
 var now=Date.now();
 // Journal the attempt before sending it. Any ambiguous response is quarantined.
 g.tries++;g.slot=slot;
 if(Number.isInteger(g.from)&&g.from%10===0&&g.to-g.from===10)
  (info.attempts||(info.attempts={}))[g.from/10]=g.tries;
 report('GENERATING_'+(g.from+1)+'-'+g.to+'_TRY_'+g.tries+'_MODEL_'+hskVoiceModelTag_(g.model)+'_KEY_'+slot);
 var response,decoded;
 if(direct){
  try{decoded=hskVoiceDirectTts_(p,joined,g.model);}
  catch(e){if(typeof hskPipelineFenceError_==='function')hskPipelineFenceError_(e);
   var msg=String(e.message||'direct_tts_error');
   if(/direct_tts_keys_unavailable/.test(msg)){
    p.setProperty('HSK_VOCAB_ERROR',msg);
    p.setProperty('HSK_VOCAB_RETRY_AT',String(Date.now()+300000));return;
   }
   // HTTP responses and missing_audio explicitly contain no usable voice.
   // Quota/key errors should not penalize a word; generation failures can split.
   if(/provider_\d+|missing_audio/.test(msg)){
    if(/provider_(401|403|429)/.test(msg))g.tries=Math.max(0,g.tries-1);
    if(g.model!==fallback&&/provider_5\d\d|missing_audio/.test(msg))g.model=fallback;
    report('DIRECT_FAILED_'+(g.from+1)+'-'+g.to+'_'+msg);
    p.setProperty('HSK_VOCAB_RETRY_AT',String(Date.now()+300000));
    p.setProperty('HSK_VOCAB_ERROR',msg);return;
   }
   batch[3]='UNCERTAIN';report('direct_tts_uncertain_'+g.from);
   p.setProperty('HSK_VOCAB_ENABLED','false');return;
  }
 }else{
  try{
   response=(typeof hskPipelineFetch_==='function'?hskPipelineFetch_:UrlFetchApp.fetch)(HSK_VOCAB_URL_,{method:'post',contentType:'application/json',
    headers:{Authorization:'Bearer '+token},payload:JSON.stringify(payload),muteHttpExceptions:true});
  }catch(e){if(typeof hskPipelineFenceError_==='function')hskPipelineFenceError_(e);
   batch[3]='UNCERTAIN';report('tts_chunk_transport_uncertain_'+g.from+'_'+g.to);
   p.setProperty('HSK_VOCAB_ERROR','tts_chunk_transport_uncertain');
   p.setProperty('HSK_VOCAB_ENABLED','false');return;
  }
 }
 try{if(!decoded)decoded=hskParallelDecode_(response);}
 catch(e){if(typeof hskPipelineFenceError_==='function')hskPipelineFenceError_(e);
  var reason=String(e.message||'tts_chunk_error'),attempts=Number(e.providerAttempts||0);
  p.setProperty('HSK_VOCAB_TTS_CALLS',String(Number(p.getProperty('HSK_VOCAB_TTS_CALLS')||0)+attempts));
  p.setProperty('HSK_VOCAB_WINDOW_CALLS',String(Number(p.getProperty('HSK_VOCAB_WINDOW_CALLS')||0)+attempts));
  if(/response_uncertain|transport_uncertain/.test(reason)){
   batch[3]='UNCERTAIN';report('tts_chunk_response_uncertain_'+g.from);
   p.setProperty('HSK_VOCAB_ENABLED','false');return;
  }
  if(route==='WORKER_PROBE'&&typeof hskVoiceFailoverOutcome_==='function')
   hskVoiceFailoverOutcome_(p,route,false,reason);
  var usedModel=payload.model;
  // A safety refusal must not be treated as quota exhaustion or retried on
  // another provider identity. Isolate only the refused word/group.
  if(/tts_blocked|tts_permission_denied/.test(reason)){
   p.setProperty('HSK_VOCAB_PAIR_'+slot+'_'+usedModel+'_AFTER',String(now+3600000));
   batch[3]='REVIEW';report('TTS_BLOCKED_REQUIRES_REVIEW_'+g.from+'_'+g.to);
   jobs.slice(g.from,g.to).forEach(function(job){
    var row=rows[job.row];if(['READY','EXISTING'].indexOf(row[3])>=0)return;
    row[3]='REVIEW';row[11]='tts_provider_refused_content';hskVocabWrite_(tables.queue,job.row,row);
   });
   return;
  }
  report('FAILED_'+(g.from+1)+'-'+g.to+'_TRY_'+g.tries+'_'+reason);
  // Restrict Retry-After to the failed key+model pair, NOT the whole HSK queue.
  // The next scheduler tick scans all other eligible model/key pairs.
  var wait=Math.max(60000,Math.min(604800000,Number(e.retryAfter||120)*1000));
  p.setProperty('HSK_VOCAB_PAIR_'+slot+'_'+usedModel+'_AFTER',String(now+wait));
  g.model=hskVoiceNextModel_(usedModel);
  p.setProperty('HSK_VOCAB_ERROR',reason.slice(0,100));
  p.deleteProperty('HSK_VOCAB_RETRY_AT');
  return;
 }
 p.setProperty('HSK_VOCAB_TTS_CALLS',String(Number(p.getProperty('HSK_VOCAB_TTS_CALLS')||0)+decoded.providerAttempts));
 p.setProperty('HSK_VOCAB_WINDOW_CALLS',String(Number(p.getProperty('HSK_VOCAB_WINDOW_CALLS')||0)+decoded.providerAttempts));
 if(info.qualityProfile==='dictionary_v1'&&typeof hskVoiceQualityDetect_==='function'){
  var detected=hskVoiceQualityDetect_(decoded.bytes,length);
  g.ranges=detected?detected.ranges:null;g.boundaryReason=detected?'stable_exact_count':'unproven_boundaries';
 }
 // Saving the chunk is a separate commit point. Never repeat paid TTS when
 // Drive is ambiguous; inspect the deterministic filename on next review.
 try{
  if(!fileNamed(g.name))folder.createFile(Utilities.newBlob(decoded.bytes,'audio/wav',g.name));
 }catch(e){if(typeof hskPipelineFenceError_==='function')hskPipelineFenceError_(e);
  batch[3]='UNCERTAIN';report('tts_chunk_drive_save_uncertain_'+g.from+'_'+g.to);
  p.setProperty('HSK_VOCAB_ENABLED','false');return;
 }
 report('SAVED_'+(g.from+1)+'-'+g.to+'_OF_'+jobs.length);
 if(typeof hskVoiceFailoverMark_==='function')hskVoiceFailoverMark_(p,'saved_chunk_wav');
 if(route==='WORKER_PROBE'&&typeof hskVoiceFailoverOutcome_==='function')
  hskVoiceFailoverOutcome_(p,route,true,'chunk_wav_saved');
 p.deleteProperty('HSK_VOCAB_ERROR');p.deleteProperty('HSK_VOCAB_RETRY_AT');
}

/**
 * Once-only resurrection of an interrupted rejected chunk batch. Earlier
 * successfully saved files remain the source of truth and MUST NOT be resent.
 * Never reopens a legacy batch without an identifiable chunk journal.
 */
function hskVoiceChunkedResumeRejected_(p,storage,tables,batches){
 if(p.getProperty('HSK_AUTO50_ENABLED')!=='true')return false;
 if(batches.some(function(b){return ['TTS_CHUNKS','MASTER','VERIFY','AUTO_VERIFY','RESERVED','UNCERTAIN'].indexOf(b[3])>=0;}))return false;
 var found=-1;
 for(var i=batches.length-1;i>=0;i--){
  var b=batches[i];if(b[3]!=='REJECTED'||b[4]!=='tts_chunk_failed_after_3_attempts')continue;
  var journal={};try{journal=JSON.parse(String(b[10]||'{}'));}catch(ignore){}
  if(journal.mode!=='chunked_v1')continue;
  var saved=storage.folder.getFilesByName('VOCAB_CHUNK_'+b[0]+'_0.wav');
  if(!saved.hasNext())continue;
  found=i;break;
 }
 if(found<0)return false;
 var target=batches[found];
 target[3]='TTS_CHUNKS';target[4]='SALVAGING_SAVED_CHUNKS_ADAPTIVE_V2';
 tables.batches.getRange(found+2,1,1,11).setValues([target]);
 p.setProperty('HSK_AUTO50_SALVAGE_BATCH',String(target[0]));
 // Respect the existing quota/cooldown; re-opening a journal requires no TTS.
 return true;
}
