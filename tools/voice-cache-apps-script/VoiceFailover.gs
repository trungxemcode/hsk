/**
 * HSK voice circuit breaker — genuine output, never trigger timestamps.
 * 15 min without a saved WAV/master or newly verified READY/EXISTING => GAS
 * direct Gemini provider if (and only if) keys already exist in Script Properties.
 * Cloudflare re-enters via 2 health probes + a real unsent-work canary.
 * Do not persist or log keys, audio or Google identity tokens in Sheets.
 */
function hskVoiceFailoverKeyCount_(p){
 var n=0;for(var i=1;i<=9;i++)if(p.getProperty('GEMINI_TTS_KEY_'+i))n++;
 return n;
}
function hskVoiceFailoverMode_(p){return p.getProperty('HSK_VOICE_FAILOVER_MODE')||'WORKER';}
function hskVoiceFailoverMark_(p,reason){
 var now=Date.now();
 p.setProperty('HSK_VOICE_LAST_DURABLE_PROGRESS',String(now));
 p.setProperty('HSK_VOICE_PROGRESS_REASON',String(reason||'saved').slice(0,90));
}
function hskVoiceFailoverOutcome_(p,route,ok,reason){
 // Only a real unsent audio/ASR request is a safe Cloudflare re-entry canary.
 if(route!=='WORKER_PROBE'||hskVoiceFailoverMode_(p)!=='WORKER_PROBE')return;
 if(ok){
  p.setProperty('HSK_VOICE_FAILOVER_MODE','WORKER');
  p.setProperty('HSK_VOICE_FAILOVER_CHANGED_AT',String(Date.now()));
  p.setProperty('HSK_VOICE_FAILOVER_REASON','worker_canary_succeeded');
  p.setProperty('HSK_VOICE_WORKER_HEALTHY_POLLS','0');
 }else{
  p.setProperty('HSK_VOICE_FAILOVER_MODE','DIRECT');
  p.setProperty('HSK_VOICE_FAILOVER_CHANGED_AT',String(Date.now()));
  p.setProperty('HSK_VOICE_FAILOVER_REASON',String(reason||'worker_canary_failed').slice(0,90));
  p.setProperty('HSK_VOICE_WORKER_HEALTHY_POLLS','0');
  p.setProperty('HSK_VOICE_WORKER_NEXT_PROBE',String(Date.now()+300000));
 }
}
function hskVoiceFailoverPoll_(p,book,control){
 if(p.getProperty('HSK_VOICE_FAILOVER_ENABLED')==='false')return;
 if(String(control.getRange(2,2).getValue())!=='AUTO_CYCLE'||p.getProperty('HSK_VOICE_PAUSED')==='true')return;
 var now=Date.now(),keys=hskVoiceFailoverKeyCount_(p),mode=hskVoiceFailoverMode_(p);
 var last=Number(p.getProperty('HSK_VOICE_LAST_DURABLE_PROGRESS')||0);
 var previous=String(p.getProperty('HSK_VOICE_LAST_VERIFIED_SIGNATURE')||'');
 var progress=book.getSheetByName('Tien_do_tu_vung'),ready=0,existing=0;
 if(progress){
  // B4/B5 are committed READY/EXISTING counts, NOT heartbeat or TTS attempts.
  var counts=progress.getRange(4,2,2,1).getValues();
  ready=Number(counts[0][0]||0);existing=Number(counts[1][0]||0);
 }
 var signature=ready+'|'+existing;
 if(!last){
  last=now;p.setProperty('HSK_VOICE_LAST_DURABLE_PROGRESS',String(now));
  p.setProperty('HSK_VOICE_PROGRESS_REASON','monitor_initialized');
 }
 if(signature!==previous){
  p.setProperty('HSK_VOICE_LAST_VERIFIED_SIGNATURE',signature);
  if(previous){
   var old=previous.split('|').map(Number);
   if(ready>Number(old[0]||0)||existing>Number(old[1]||0)){
    hskVoiceFailoverMark_(p,'sheet_ready_existing_increment');last=now;
   }
  }
 }
 // Detect saved master of last batch even if the control progress sheet is stale.
 var batches=book.getSheetByName('Voice_Vocab_Batches');
 if(batches&&batches.getLastRow()>1){
  var lastBatch=batches.getRange(batches.getLastRow(),1,1,5).getValues()[0];
  // Only a *saved* chunk is progress; GENERATING/FAILED/heartbeats do not count.
  var savedMarker=/^SAVED_\d+-\d+_OF_/.test(String(lastBatch[4]||''))?
    String(lastBatch[0])+'|'+String(lastBatch[4]):'';
  if(savedMarker){
   var previousSaved=String(p.getProperty('HSK_VOICE_LAST_SAVED_CHUNK')||'');
   if(savedMarker!==previousSaved){
    p.setProperty('HSK_VOICE_LAST_SAVED_CHUNK',savedMarker);
    hskVoiceFailoverMark_(p,'sheet_wav_chunk_saved');last=now;
   }
  }
  if(lastBatch[2]){
   var seen=String(p.getProperty('HSK_VOICE_LAST_SAVED_MASTER')||'');
   if(seen!==String(lastBatch[2])){
    p.setProperty('HSK_VOICE_LAST_SAVED_MASTER',String(lastBatch[2]));
    if(seen){hskVoiceFailoverMark_(p,'sheet_master_saved');last=now;}
   }
  }
 }
 last=Number(p.getProperty('HSK_VOICE_LAST_DURABLE_PROGRESS')||last);
 var idle=now-last,reason=String(p.getProperty('HSK_VOICE_FAILOVER_REASON')||'');
 if(mode==='WORKER'&&idle>=900000){
  if(keys){
   mode='DIRECT';reason='15m_without_verified_or_saved_audio';
   p.setProperty('HSK_VOICE_FAILOVER_MODE',mode);
   p.setProperty('HSK_VOICE_FAILOVER_CHANGED_AT',String(now));
   p.setProperty('HSK_VOICE_FAILOVER_REASON',reason);
   p.setProperty('HSK_VOICE_WORKER_NEXT_PROBE',String(now+300000));
   p.setProperty('HSK_VOICE_WORKER_HEALTHY_POLLS','0');
   // The old Worker cooldown must not block a *different*, direct route.
   var oldError=String(p.getProperty('HSK_VOCAB_ERROR')||'');
   if(/^cloudflare_tts_|^asr_provider_error|^vocabulary_verification_uncertain|^tts_keys_cooling/.test(oldError)){
    p.deleteProperty('HSK_VOCAB_RETRY_AT');
   }
  }else{reason='stalled_direct_keys_not_configured';p.setProperty('HSK_VOICE_FAILOVER_REASON',reason);}
 }
 if(mode==='DIRECT'&&keys&&Number(p.getProperty('HSK_VOICE_WORKER_NEXT_PROBE')||0)<=now){
  var healthy=false;
  try{
   var identity=ScriptApp.getIdentityToken();
   if(identity){
    var reply=UrlFetchApp.fetch(HSK_VOCAB_URL_,{method:'post',contentType:'application/json',
     headers:{Authorization:'Bearer '+identity},payload:JSON.stringify({action:'status',model:'gemini-3.1-flash-tts-preview'}),
     muteHttpExceptions:true});
    if(reply.getResponseCode()===200){
     var result=JSON.parse(reply.getContentText());
     healthy=result.ok===true&&Array.isArray(result.slots)&&result.slots.some(function(s){return Number(s.retryAfter||0)===0;});
    }
   }
  }catch(ignore){}
  var count=healthy?Number(p.getProperty('HSK_VOICE_WORKER_HEALTHY_POLLS')||0)+1:0;
  p.setProperty('HSK_VOICE_WORKER_HEALTHY_POLLS',String(count));
  p.setProperty('HSK_VOICE_WORKER_NEXT_PROBE',String(now+300000));
  // Status alone never restores Cloudflare. A real next-work canary must succeed.
  if(count>=2&&now-Number(p.getProperty('HSK_VOICE_FAILOVER_CHANGED_AT')||now)>=300000){
   mode='WORKER_PROBE';reason='two_health_probes_waiting_for_real_canary';
   p.setProperty('HSK_VOICE_WORKER_PROBE_AT',String(now));
   p.setProperty('HSK_VOICE_FAILOVER_MODE',mode);
   p.setProperty('HSK_VOICE_FAILOVER_REASON',reason);
  }
 }
 if(mode==='WORKER_PROBE'&&now-Number(p.getProperty('HSK_VOICE_WORKER_PROBE_AT')||now)>=900000&&idle>=900000){
  mode='DIRECT';reason='worker_canary_no_progress';
  p.setProperty('HSK_VOICE_FAILOVER_MODE',mode);
  p.setProperty('HSK_VOICE_FAILOVER_REASON',reason);
  p.setProperty('HSK_VOICE_FAILOVER_CHANGED_AT',String(now));
  p.setProperty('HSK_VOICE_WORKER_NEXT_PROBE',String(now+300000));
  p.setProperty('HSK_VOICE_WORKER_HEALTHY_POLLS','0');
 }
 try{
  // Independent dashboard. Does not modify AUTO_CYCLE, queue or existing fields.
  control.getRange(80,1,7,2).setValues([
   ['Failover_route',mode],['Failover_last_real_progress',new Date(last).toISOString()],
   ['Failover_idle_minutes',Math.floor((now-last)/60000)],
   ['Failover_direct_key_count',keys],['Failover_worker_probe_count',Number(p.getProperty('HSK_VOICE_WORKER_HEALTHY_POLLS')||0)],
   ['Failover_reason',reason],['Failover_current_job','Worker/GAS serialized; READY requires double ASR']
  ]);
 }catch(e){p.setProperty('HSK_VOICE_FAILOVER_LOG_ERROR',String(e.message||e).slice(0,100));}
}
