/** Enable only the slot/model pairs verified by real audio probes on 2026-10-19. */
function hskConfigureRecoveredVoiceKeys(){
 var p=hskSettings_(),flag='HSK_SLOT_MODEL_RECOVERY_V1';
 if(p.getProperty(flag)!=='done'){
  [6,9].forEach(function(slot){p.setProperty('HSK_WARM_SLOT_'+slot+'_MODEL','gemini-3.1-flash-tts-preview');p.deleteProperty('HSK_WARM_SLOT_'+slot+'_AFTER');});
  p.setProperty(flag,'done');
 }
 p.setProperty('HSK_WARM_ISOLATED','true');
 return hskWarmStart();
}
