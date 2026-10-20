/**
 * Scheduled read-only live test. Queue stays PAUSE. Triggered by sheet B57=REQUEST.
 * Authenticates with Google identity token, reads an existing Drive WAV and
 * checks independent local/remote segmentation agreement. Never calls TTS or ASR.
 */
function hskVoiceSegmentScheduledSmoke_(p,control){
 if(String(control.getRange(57,2).getValue()||'')!=='REQUEST')return;
 var lock=LockService.getScriptLock();
 if(!lock.tryLock(1000))return;
 try{
  if(String(control.getRange(57,2).getValue()||'')!=='REQUEST')return;
  if(String(control.getRange(2,2).getValue()||'')!=='PAUSE'){
   control.getRange(57,2).setValue('BLOCKED_VOICE_NOT_PAUSED');return;
  }
  control.getRange(57,2).setValue('RUNNING');
  var report=[['Segment_smoke_time',new Date().toISOString()]], successful=false, attempts=[];
  try{
   var token=ScriptApp.getIdentityToken();
   if(!token)throw Error('identity_token_missing');
   var endpoint='https://hsk-voice-segmenter.trung-hsk668.workers.dev/segment-wav';
   function send(payload){
    var response=UrlFetchApp.fetch(endpoint,{method:'post',contentType:'application/json',
     headers:{Authorization:'Bearer '+token},payload:JSON.stringify(payload),muteHttpExceptions:true});
    var data={};try{data=JSON.parse(response.getContentText());}catch(ignore){}
    return {code:response.getResponseCode(),data:data};
   }
   var authenticated=send({action:'segment-wav',audioBase64:'',expected:1});
   report.push(['Segment_auth_http',String(authenticated.code)]);
   if(authenticated.code!==400||authenticated.data.error!=='invalid_wav')
    throw Error('worker_auth_failed_'+authenticated.code+'_'+String(authenticated.data.error||'unknown'));
   report.push(['Segment_auth_result','PASS']);
   var testMaster=String(control.getRange(17,2).getValue()||'');
   var testId=(testMaster.match(/\/d\/([a-zA-Z0-9_-]{20,})/)||[])[1]||'';
   var sourceId=String(control.getRange(4,2).getValue()||'');
   var candidates=[{name:'test_master',id:testId,expected:Number(control.getRange(21,2).getValue()||50)},
    {name:'source_master',id:sourceId,expected:50}];
   for(var j=0;j<candidates.length;j++){
    var c=candidates[j];
    if(!c.id||!Number.isInteger(c.expected)||c.expected<1||c.expected>100)continue;
    try{
     var bytes=DriveApp.getFileById(c.id).getBlob().getBytes();
     if(bytes.length>8500000)throw Error('wav_exceeds_safe_test_size');
     var local=hskAuto50Detect_(bytes,c.expected);
     var remote=send({action:'segment-wav',audioBase64:Utilities.base64Encode(bytes),expected:c.expected});
     if(remote.code!==200||remote.data.ok!==true)throw Error('worker_http_'+remote.code+'_'+String(remote.data.error||'unknown'));
     if(!Array.isArray(remote.data.ranges)||local.ranges.length!==remote.data.ranges.length)
      throw Error('ranges_count_mismatch');
     if(remote.data.ranges.length!==c.expected)throw Error('expected_count_mismatch');
     var maxSkew=0;
     for(var i=0;i<local.ranges.length;i++){
      var x=local.ranges[i],y=remote.data.ranges[i];
      if(!Array.isArray(y)||y.length!==2)throw Error('remote_invalid_range');
      maxSkew=Math.max(maxSkew,Math.abs(x[0]-y[0]),Math.abs(x[1]-y[1]));
     }
     if(maxSkew>480)throw Error('boundary_skew_'+maxSkew);
     report.push(['Segment_live_source',c.name]);
     report.push(['Segment_live_segments',String(remote.data.ranges.length)]);
     report.push(['Segment_live_max_skew_samples',String(maxSkew)]);
     successful=true;break;
    }catch(e){attempts.push(c.name+':'+String(e.message||'failed').slice(0,100));}
   }
   if(!successful)throw Error('real_wav_test_failed__'+attempts.join(' | '));
   // Route preference is enabled only after authenticated real-WAV parity passes.
   // This never unpauses the voice queue. The existing local fallback remains.
   p.setProperty('HSK_VOICE_REMOTE_SEGMENT','true');
   report.push(['Segment_remote_preferred','ENABLED_WITH_LOCAL_FALLBACK']);
   control.getRange(57,2).setValue('PASS_PAUSED');
  }catch(e){
   p.setProperty('HSK_VOICE_REMOTE_SEGMENT','false');
   report.push(['Segment_smoke_error',String(e.message||e).slice(0,245)]);
   report.push(['Segment_remote_preferred','OFF_LOCAL_ONLY']);
   control.getRange(57,2).setValue('FAILED_PAUSED');
  }
  control.getRange(58,1,report.length,2).setValues(report);
 }finally{lock.releaseLock();}
}
