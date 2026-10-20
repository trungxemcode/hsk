/**
 * HSK voice circuit breaker — genuine output, never trigger timestamps.
 * 15 min without a saved WAV/master or newly verified READY/EXISTING =>
 * DIRECT Gemini only when Apps Script owns a key, otherwise LOCAL segmenter.
 * Cloudflare re-enters after two health probes and a real WAV parity check.
 * LOCAL still needs the authenticated gateway for TTS/ASR; never claim otherwise.
 * Do not persist or log keys, audio or Google identity tokens in Sheets.
 */
function hskVoiceFailoverKeyCount_(p){
 // Keys configured as Cloudflare Worker secrets cannot be read by Apps Script.
 // Count local-only keys, including all 12 slots and either legacy property name.
 var n=0;for(var i=1;i<=12;i++){
  if(p.getProperty('GEMINI_TTS_KEY_'+i)||p.getProperty('GEMINI_API_KEY_'+i))n++;
 }
 return n;
}
/** Read non-secret Cloudflare slot availability, never fetch secret values. */
function hskVoiceFailoverCloudflareKeys_(p){
 var now=Date.now(),until=Number(p.getProperty('HSK_VOICE_CF_KEY_COUNT_CHECK_AT')||0);
 if(until>now)return p.getProperty('HSK_VOICE_CF_KEY_COUNT')||'unknown';
 p.setProperty('HSK_VOICE_CF_KEY_COUNT_CHECK_AT',String(now+300000));
 try{
  var token=ScriptApp.getIdentityToken();
  if(!token)return p.getProperty('HSK_VOICE_CF_KEY_COUNT')||'unknown';
  var response=UrlFetchApp.fetch(HSK_VOCAB_URL_,{method:'post',
   contentType:'application/json',headers:{Authorization:'Bearer '+token},
   payload:JSON.stringify({action:'status',model:'gemini-3.1-flash-tts-preview'}),
   muteHttpExceptions:true});
  if(response.getResponseCode()!==200)return p.getProperty('HSK_VOICE_CF_KEY_COUNT')||'unknown';
  var data=JSON.parse(response.getContentText());
  if(!data.ok||!Array.isArray(data.slots))return p.getProperty('HSK_VOICE_CF_KEY_COUNT')||'unknown';
  var distinct=new Set();
  data.slots.forEach(function(s){
   if(Number.isInteger(s.slot)&&s.slot>=1&&s.slot<=12)distinct.add(s.slot);
  });
  p.setProperty('HSK_VOICE_CF_KEY_COUNT',String(distinct.size));
 }catch(e){}
 return p.getProperty('HSK_VOICE_CF_KEY_COUNT')||'unknown';
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
/**
 * Probe Cloudflare's dedicated segmentation Worker using a SAVED master.
 * Local and remote segment boundaries must agree before the remote path
 * can be restored. No new audio is created and no ASR credits are spent.
 */
function hskVoiceFailoverLocalCanary_(p,book){
 try{
  var sheet=book.getSheetByName('Voice_Vocab_Batches');
  if(!sheet||sheet.getLastRow()<2)return false;
  var total=sheet.getLastRow(),from=Math.max(2,total-19);
  var sample=sheet.getRange(from,1,total-from+1,3).getValues();
  var master=null,expected=0;
  for(var i=sample.length-1;i>=0;i--){
   if(!sample[i][2])continue;
   var jobs=JSON.parse(String(sample[i][1]||'[]'));
   if(!Array.isArray(jobs)||jobs.length<1||jobs.length>100)continue;
   master=String(sample[i][2]);expected=jobs.length;break;
  }
  if(!master)return false;
  var bytes=DriveApp.getFileById(master).getBlob().getBytes();
  if(bytes.length<44||bytes.length>8500000)return false;
  var local=hskAuto50Detect_(bytes,expected);
  if(!local||!Array.isArray(local.ranges)||local.ranges.length!==expected)return false;
  var token=ScriptApp.getIdentityToken();if(!token)return false;
  var response=UrlFetchApp.fetch('https://hsk-voice-segmenter.trung-hsk668.workers.dev/segment-wav',{
   method:'post',contentType:'application/json',headers:{Authorization:'Bearer '+token},
   payload:JSON.stringify({action:'segment-wav',audioBase64:Utilities.base64Encode(bytes),expected:expected}),
   muteHttpExceptions:true
  });
  if(response.getResponseCode()!==200)return false;
  var remote=JSON.parse(response.getContentText());
  if(!remote.ok||!Array.isArray(remote.ranges)||remote.ranges.length!==expected)return false;
  var lastEnd=0;
  for(var j=0;j<expected;j++){
   var a=local.ranges[j],b=remote.ranges[j];
   if(!Array.isArray(a)||!Array.isArray(b)||b.length!==2)return false;
   if(!Number.isInteger(b[0])||!Number.isInteger(b[1])||b[0]<lastEnd||b[1]<=b[0])return false;
   if(Math.abs(a[0]-b[0])>480||Math.abs(a[1]-b[1])>480)return false;
   lastEnd=b[1];
  }
  return true;
 }catch(e){return false;}
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
  }else{
   // A valid fallback still exists without Gemini keys: CPU-local WAV segmentation.
   // TTS/ASR continue via the existing gateway with safe provider backoff.
   mode='LOCAL';reason='15m_gas_local_segment;tts_asr_still_worker_gateway';
   p.setProperty('HSK_VOICE_FAILOVER_MODE',mode);
   p.setProperty('HSK_VOICE_REMOTE_SEGMENT','false');
   p.setProperty('HSK_VOICE_FAILOVER_CHANGED_AT',String(now));
   p.setProperty('HSK_VOICE_FAILOVER_REASON',reason);
   p.setProperty('HSK_VOICE_WORKER_NEXT_PROBE',String(now+300000));
   p.setProperty('HSK_VOICE_WORKER_HEALTHY_POLLS','0');
  }
 }
 if((mode==='DIRECT'&&keys||mode==='LOCAL')&&Number(p.getProperty('HSK_VOICE_WORKER_NEXT_PROBE')||0)<=now){
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
   if(mode==='LOCAL'){
    if(hskVoiceFailoverLocalCanary_(p,book)){
     mode='WORKER';reason='worker_restored_after_real_wav_segment_parity';
     p.setProperty('HSK_VOICE_FAILOVER_MODE',mode);
     p.setProperty('HSK_VOICE_REMOTE_SEGMENT','true');
     p.setProperty('HSK_VOICE_FAILOVER_CHANGED_AT',String(now));
     p.setProperty('HSK_VOICE_FAILOVER_REASON',reason);
     p.setProperty('HSK_VOICE_WORKER_HEALTHY_POLLS','0');
    }else{
     reason='worker_health_ok_but_wav_canary_failed';
     p.setProperty('HSK_VOICE_FAILOVER_REASON',reason);
     p.setProperty('HSK_VOICE_WORKER_HEALTHY_POLLS','0');
    }
   }else{
    mode='WORKER_PROBE';reason='two_health_probes_waiting_for_real_canary';
    p.setProperty('HSK_VOICE_WORKER_PROBE_AT',String(now));
    p.setProperty('HSK_VOICE_FAILOVER_MODE',mode);
    p.setProperty('HSK_VOICE_FAILOVER_REASON',reason);
   }
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
  var cloudflareKeySlots=hskVoiceFailoverCloudflareKeys_(p);
  control.getRange(80,1,9,2).setValues([
   ['Failover_route',mode],['Failover_last_real_progress',new Date(last).toISOString()],
   ['Failover_idle_minutes',Math.floor((now-last)/60000)],
   ['Failover_direct_key_count',keys],
   ['Failover_worker_probe_count',Number(p.getProperty('HSK_VOICE_WORKER_HEALTHY_POLLS')||0)],
   ['Failover_reason',reason],
   ['Failover_current_job',mode==='LOCAL'?
    'Apps Script local WAV segmentation; TTS/ASR still require Gemini gateway':
    'Worker and Apps Script serialized; READY requires double ASR'],
   ['Cloudflare_numbered_key_slots',cloudflareKeySlots],
   ['Key_locations','Cloudflare GEMINI_API_KEY_1..12 / Apps Script GEMINI_TTS_KEY_1..12 (separate secrets)']
  ]);
 }catch(e){p.setProperty('HSK_VOICE_FAILOVER_LOG_ERROR',String(e.message||e).slice(0,100));}
}
