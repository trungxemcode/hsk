/** Start verified model-3.1 grouped generation for NEW corpus items. Existing retries remain intact. */
function hskStartNew31Grouped(){
 var p=hskSettings_(),model='gemini-3.1-flash-tts-preview',slots=[0,3,4,5,6,7,8,9];
 slots.forEach(function(slot){
  var key='HSK_WARM_SLOT_'+slot+'_MODEL';
  if(p.getProperty(key)!==model)p.deleteProperty('HSK_WARM_SLOT_'+slot+'_AFTER');
  p.setProperty(key,model);
 });
 p.setProperty('HSK_31_ALLOWED_SLOTS',JSON.stringify(slots));
 p.setProperty('HSK_WARM_31_GROUPED','true');
 p.setProperty('HSK_WARM_NEW_FIRST','true');
 p.setProperty('HSK_WARM_ISOLATED','true');
 p.setProperty('HSK_WARM_ISOLATED_SIZE','5');
 p.setProperty('HSK_WARM_ENABLED','true');
 p.deleteProperty('HSK_WARM_RETRY_AT');
 p.deleteProperty('HSK_WARM_LAST_ERROR');
 ScriptApp.getProjectTriggers().filter(function(t){return t.getHandlerFunction()==='hskWarmTick';}).forEach(function(t){ScriptApp.deleteTrigger(t);});
 ScriptApp.newTrigger('hskWarmTick').timeBased().everyMinutes(1).create();
 hskWarmTick();
 console.log(JSON.stringify({mode:'3.1-grouped-new-first',slots:slots,status:hskWarmStatus()}));
}


function hskInspectRotation(){
 var p=hskSettings_(),token=ScriptApp.getIdentityToken(),url='https://hsk-vietnamese-translator.trung-hsk668.workers.dev/voice-precache';
 var r=UrlFetchApp.fetch(url,{method:'post',contentType:'application/json',headers:{Authorization:'Bearer '+token},payload:JSON.stringify({action:'status'}),muteHttpExceptions:true});
 console.log(JSON.stringify({status:r.getResponseCode(),health:JSON.parse(r.getContentText()),directSlots:Array.from({length:11},function(_,i){return {slot:i,configured:!!p.getProperty('GEMINI_TTS_KEY_'+i)};}),transport:p.getProperty('HSK_VOICE_TTS_TRANSPORT')}));
}
