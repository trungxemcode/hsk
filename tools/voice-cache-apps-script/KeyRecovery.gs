/** Enable only the slot/model pairs verified by real audio probes on 2026-10-19. */
function hskConfigureRecoveredVoiceKeys(){
 var p=hskSettings_(),flag='HSK_SLOT_MODEL_RECOVERY_V2';
 if(p.getProperty(flag)!=='done'){
  [6,9].forEach(function(slot){p.setProperty('HSK_WARM_SLOT_'+slot+'_MODEL','gemini-3.1-flash-tts-preview');p.deleteProperty('HSK_WARM_SLOT_'+slot+'_AFTER');});
  var storage=hskCheck_(p),q=hskWarmQueue_(storage),rows=hskBatchRows_(q,6);
  rows.forEach(function(r,i){if(r[4]!=='DONE'&&/tts_request_rejected|tts_generation_incomplete/.test(String(r[5]))){r[2]=0;r[3]=Date.now();r[4]='PENDING';q.getRange(i+2,1,1,6).setValues([r]);}});
  p.setProperty(flag,'done');
 }
 p.setProperty('HSK_WARM_ISOLATED','true');
 return hskWarmStart();
}
