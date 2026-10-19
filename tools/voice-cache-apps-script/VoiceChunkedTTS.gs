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
 var fallback='gemini-3.1-flash-tts-preview';
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
  if(batch[7]!==fallback && plan.some(function(g){return g.tries>=3;})){
   plan.forEach(function(g){if(!fileNamed(g.name))g.model=fallback;});
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
  batch[10]='';tables.batches.getRange(index+2,1,1,11).setValues([batch]);
  kept.forEach(function(job){
   var row=rows[job.row];
   if(['READY','EXISTING'].indexOf(row[3])>=0)return;
   if(row[6]!==id)row[4]=Number(row[4]||0)+1;
   row[3]='MASTER';row[6]=id;row[7]=job.model;
   row[8]=file.getId();row[11]='';hskVocabWrite_(tables.queue,job.row,row);
  });
  p.deleteProperty('HSK_VOCAB_ERROR');p.deleteProperty('HSK_VOCAB_RETRY_AT');
  p.setProperty('HSK_AUTO50_LAST_RECOVERED',id+':'+kept.length+'/'+jobs.length);
 }
 var existingMaster=fileNamed(masterName);
 if(existingMaster){commitMaster(existingMaster);return;}
 var missing=plan.findIndex(function(g){return !fileNamed(g.name);});
 if(missing<0){
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
  catch(e){
   // A file may have been saved even if Google Drive returned an exception.
   file=fileNamed(masterName);
   if(!file){batch[3]='UNCERTAIN';report('adaptive_master_drive_save_uncertain');p.setProperty('HSK_VOCAB_ENABLED','false');return;}
  }
  commitMaster(file);return;
 }
 var g=plan[missing],length=g.to-g.from,maxTries=length===1?2:3;
 if(g.tries>=maxTries){
  if(length>1){
   var half=g.from+Math.floor(length/2);
   if(half<=g.from||half>=g.to)throw Error('adaptive_split_invalid');
   var pieces=[{from:g.from,to:half},{from:half,to:g.to}].map(function(x){
    return {from:x.from,to:x.to,name:'VOCAB_CHUNK_'+id+'_'+x.from+'_'+x.to+'.wav',
     model:fallback,tries:0,slot:null};
   });
   plan.splice.apply(plan,[missing,1].concat(pieces));
   report('SPLIT_FAILED_'+length+'_WORDS_INTO_'+(half-g.from)+'_AND_'+(g.to-half));
   return;
  }
  // Only the unspoken word is postponed. All previously saved groups remain.
  var excluded=jobs[g.from],row=rows[excluded.row];
  if(['READY','EXISTING'].indexOf(row[3])<0){
   row[3]='RETRY';row[5]=Date.now()+1800000;
   row[11]='tts_single_word_unavailable_next_batch';hskVocabWrite_(tables.queue,excluded.row,row);
  }
  info.omitted.push(g.from);plan.splice(missing,1);
  report('SKIPPED_ONLY_'+excluded.text+'_OTHER_AUDIO_PRESERVED');
  return;
 }
 var slot=Number(batch[6]);
 if(g.model!==batch[7]){
  // Respect live per-key quota and model cooldown, rather than blindly reusing
  // a key that just failed on Gemini 2.5.
  var status;
  try{status=hskVocabCall_(token,{action:'status',model:g.model});}
  catch(e){p.setProperty('HSK_VOCAB_ERROR','alternate_tts_status_unavailable');p.setProperty('HSK_VOCAB_RETRY_AT',String(Date.now()+300000));return;}
  var available=(status.slots||[]).filter(function(s){
   return Number.isInteger(s.slot)&&!Number(s.retryAfter||0)&&
    Number(p.getProperty('HSK_VOCAB_PAIR_'+s.slot+'_'+g.model+'_AFTER')||0)<=Date.now();
  });
  if(!available.length){
   p.setProperty('HSK_VOCAB_ERROR','alternate_tts_keys_cooling');
   p.setProperty('HSK_VOCAB_RETRY_AT',String(Date.now()+300000));return;
  }
  var hint=Number(info.slotHint||0);
  available.sort(function(a,b){return (a.slot-hint+13)%13-(b.slot-hint+13)%13;});
  slot=available[0].slot;info.slotHint=(slot+1)%13;
 }
 var selected=jobs.slice(g.from,g.to),joined=selected.map(function(job){return job.text;}).join('?');
 var payload=Array.from(joined).length<=220?
  {text:joined,isolated:true,keySlot:slot,model:g.model,language:'zh-CN'}:
  {items:selected.map(function(job){return job.text;}),isolated:true,keySlot:slot,model:g.model,language:'zh-CN',pauseSeconds:1};
 var now=Date.now();
 // Journal the attempt before sending it. Any ambiguous response is quarantined.
 g.tries++;g.slot=slot;
 if(Number.isInteger(g.from)&&g.from%10===0&&g.to-g.from===10)
  (info.attempts||(info.attempts={}))[g.from/10]=g.tries;
 report('GENERATING_'+(g.from+1)+'-'+g.to+'_TRY_'+g.tries+'_MODEL_'+(g.model===fallback?'3_1':'2_5'));
 var response;
 try{
  response=UrlFetchApp.fetch(HSK_VOCAB_URL_,{method:'post',contentType:'application/json',
   headers:{Authorization:'Bearer '+token},payload:JSON.stringify(payload),muteHttpExceptions:true});
 }catch(e){
  batch[3]='UNCERTAIN';report('tts_chunk_transport_uncertain_'+g.from+'_'+g.to);
  p.setProperty('HSK_VOCAB_ERROR','tts_chunk_transport_uncertain');
  p.setProperty('HSK_VOCAB_ENABLED','false');return;
 }
 var decoded;
 try{decoded=hskParallelDecode_(response);}
 catch(e){
  var reason=String(e.message||'tts_chunk_error'),attempts=Number(e.providerAttempts||0);
  p.setProperty('HSK_VOCAB_TTS_CALLS',String(Number(p.getProperty('HSK_VOCAB_TTS_CALLS')||0)+attempts));
  p.setProperty('HSK_VOCAB_WINDOW_CALLS',String(Number(p.getProperty('HSK_VOCAB_WINDOW_CALLS')||0)+attempts));
  if(/response_uncertain|transport_uncertain/.test(reason)){
   batch[3]='UNCERTAIN';report('tts_chunk_response_uncertain_'+g.from);
   p.setProperty('HSK_VOCAB_ENABLED','false');return;
  }
  // After a definite Gemini 2.5 failure, let 3.1 retry, then split as needed.
  if(g.model!==fallback&&/tts_generation_incomplete|tts_provider_unavailable|tts_blocked|tts_model_unavailable/.test(reason))
   g.model=fallback;
  report('FAILED_'+(g.from+1)+'-'+g.to+'_TRY_'+g.tries+'_'+reason);
  var wait=Math.max(120000,Math.min(1800000,Number(e.retryAfter||120)*1000));
  if(g.model===fallback&&batch[7]!==fallback)wait=Math.min(wait,120000);
  p.setProperty('HSK_VOCAB_RETRY_AT',String(now+wait));
  p.setProperty('HSK_VOCAB_ERROR',reason.slice(0,100));
  p.setProperty('HSK_VOCAB_PAIR_'+slot+'_'+payload.model+'_AFTER',String(now+wait));
  return;
 }
 p.setProperty('HSK_VOCAB_TTS_CALLS',String(Number(p.getProperty('HSK_VOCAB_TTS_CALLS')||0)+decoded.providerAttempts));
 p.setProperty('HSK_VOCAB_WINDOW_CALLS',String(Number(p.getProperty('HSK_VOCAB_WINDOW_CALLS')||0)+decoded.providerAttempts));
 // Saving the chunk is a separate commit point. Never repeat paid TTS when
 // Drive is ambiguous; inspect the deterministic filename on next review.
 try{
  if(!fileNamed(g.name))folder.createFile(Utilities.newBlob(decoded.bytes,'audio/wav',g.name));
 }catch(e){
  batch[3]='UNCERTAIN';report('tts_chunk_drive_save_uncertain_'+g.from+'_'+g.to);
  p.setProperty('HSK_VOCAB_ENABLED','false');return;
 }
 report('SAVED_'+(g.from+1)+'-'+g.to+'_OF_'+jobs.length);
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
