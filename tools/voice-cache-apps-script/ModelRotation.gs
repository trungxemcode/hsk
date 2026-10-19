// Status-only probes. Does NOT generate voice, mutate Google quotas or touch Drive.
function hskVoiceFreeModelIds_(){
 return ['gemini-2.5-flash-preview-tts','gemini-3.1-flash-tts-preview','gemini-3.8-flash-lite-tts','gemini-3.8-flash-tts'];
}
function hskVoiceModelPairAfterKey_(slot,model){
 return 'HSK_WARM_PAIR_'+slot+'_'+model+'_AFTER';
}
function hskVoicePickModel_(token,p,now) {
 var models=hskVoiceFreeModelIds_(),from=Number(p.getProperty('HSK_WARM_MODEL_CURSOR')||0)%models.length,
 nextSlot=Number(p.getProperty('HSK_WARM_NEXT_SLOT')||0)%13,earliest=Infinity,requests=0;
 var available=[],unavailable=[];
 for(var n=0;n<models.length;n++) {
  var rank=(from+n)%models.length,model=models[rank],res,payload;
  try {
   res=UrlFetchApp.fetch('https://hsk-vietnamese-translator.trung-hsk668.workers.dev/voice-precache',{
    method:'post',contentType:'application/json',
    headers:{Authorization:'Bearer '+token},
    payload:JSON.stringify({action:'status',model:model}),muteHttpExceptions:true
   });requests++;
   if(res.getResponseCode()!==200){unavailable.push(model+':status_'+res.getResponseCode());continue;}
   payload=JSON.parse(res.getContentText());
   if(!payload.ok||!Array.isArray(payload.slots)){unavailable.push(model+':status_invalid');continue;}
  }catch(e){unavailable.push(model+':status_unavailable');continue;}
  for(var j=0;j<payload.slots.length;j++) {
   var s=payload.slots[j],slot=Number(s.slot);
   if(!Number.isInteger(slot)||slot<0||slot>12||!Number.isFinite(Number(s.retryAfter)))continue;
   var pairAfter=Number(p.getProperty(hskVoiceModelPairAfterKey_(slot,model))||0);
   var at=Math.max(now+Math.max(0,Number(s.retryAfter))*1000,pairAfter,Number(p.getProperty('HSK_WARM_SLOT_'+slot+'_AFTER')||0));
   if(at>now){earliest=Math.min(earliest,at);continue;}
   available.push({slot:slot,model:model,rank:n,slotRank:(slot-nextSlot+13)%13});
  }
 }
 available.sort(function(a,b){return a.rank-b.rank||a.slotRank-b.slotRank;});
 return {chosen:available.length?available[0]:null,
  retryAt:earliest<Infinity?earliest:now+3600000,
  failedModels:unavailable,modelCount:models.length,statusChecks:requests};
}
function hskWarmEnableFreeModelRotation(){
 var p=hskSettings_();
 p.setProperty('HSK_WARM_MULTI_MODEL_ENABLED','true');
 return {enabled:true,models:hskVoiceFreeModelIds_(),paidModelsEnabled:false,
  note:'Does not create audio or modify existing triggers. Current TTS scheduling and preservation checks remain.'};
}
function hskWarmDisableFreeModelRotation(){
 hskSettings_().deleteProperty('HSK_WARM_MULTI_MODEL_ENABLED');
 return {enabled:false};
}
