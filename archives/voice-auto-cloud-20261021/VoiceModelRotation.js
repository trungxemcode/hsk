/**
 * Ordered TTS model/key routing: 2.5 -> 3.1 -> 3.8 Flash-Lite.
 * Each status request is non-generative. No repeated calls to a pair during its
 * provider Retry-After. A save checkpoint is always independent of provider.
 */
function hskVoiceTtsModels_(){
 return ['gemini-2.5-flash-preview-tts','gemini-3.1-flash-tts-preview','gemini-3.8-flash-tts'];
}
function hskVoiceModelTag_(name){
 return name.indexOf('3.8')>=0?'3_8':name.indexOf('3.1')>=0?'3_1':'2_5';
}
function hskVoiceRoutePairs_(p,token,at,firstModel,skip){
 var models=hskVoiceTtsModels_(),out=[],waitUntil=0,errors={};
 var begin=Math.max(0,models.indexOf(firstModel));
 var shared;try{shared=hskVocabCall_(token,{action:'status'});}catch(e){return {pairs:[],waitUntil:0,errors:{status:String(e.message||'status_unavailable').slice(0,90)}};}
 for(var shift=0;shift<models.length;shift++){
  var model=models[(begin+shift)%models.length],data;
  try{data=Array.isArray(shared.modelSlots)?{ok:true,slots:shared.modelSlots.filter(function(s){return s.model===model;})}:shift===0?shared:hskVocabCall_(token,{action:'status',model:model});}
  catch(e){errors[model]=String(e.message||'status_unavailable').slice(0,90);continue;}
  if(!data||!data.ok||!Array.isArray(data.slots))continue;
  for(var j=0;j<data.slots.length;j++){
   var s=data.slots[j],slot=Number(s.slot),seconds=Number(s.retryAfter||0);
   if(!Number.isInteger(slot)||slot<1||slot>12)continue;
   var local=Number(p.getProperty('HSK_VOCAB_PAIR_'+slot+'_'+model+'_AFTER')||0);
   var available=Math.max(local,at+Math.max(0,seconds)*1000);
   if(available>at){waitUntil=!waitUntil?available:Math.min(waitUntil,available);continue;}
   out.push({slot:slot,model:model,mi:models.indexOf(model)});
  }
 }
 // Rotate keys within each model, and prefer a fresh pair over the one
 // which just gave a definite failed TTS response.
 var nextSlot=Number(p.getProperty('HSK_VOCAB_NEXT_SLOT')||0);
 out.sort(function(a,b){
  var aa=(a.mi-begin+models.length)%models.length,bb=(b.mi-begin+models.length)%models.length;
  return aa-bb||(a.slot-nextSlot+13)%13-(b.slot-nextSlot+13)%13;
 });
 if(skip&&out.length>1){
  var alternatives=out.filter(function(x){return x.model!==skip.model||x.slot!==Number(skip.slot);});
  if(alternatives.length)out=alternatives;
 }
 return {pairs:out,waitUntil:waitUntil,errors:errors};
}
function hskVoiceNextModel_(model){
 var a=hskVoiceTtsModels_(),i=a.indexOf(model);
 return a[(i+1+a.length)%a.length];
}
function hskVoiceEarliestProviderRetry_(at,timestamp){
 // Global queue only stops when all alternative key/model combinations report
 // unavailable. Never short-circuit any provider-supplied longer cooldown.
 return Math.max(at+60000,Number(timestamp)||at+120000);
}

/** Non-secret, rate-limited production health counters for the three TTS models. */
function hskVoiceTtsHealthTick_(p,control){
 var now=Date.now();
 if(Number(p.getProperty('HSK_VOICE_MODELS_HEALTH_NEXT')||0)>now)return;
 p.setProperty('HSK_VOICE_MODELS_HEALTH_NEXT',String(now+300000));
 var models=hskVoiceTtsModels_(),rows=[['Model_scan_UTC',hskVNTime_(new Date(now))]];
 var token=ScriptApp.getIdentityToken();
 for(var i=0;i<models.length;i++){
  var model=models[i],tag=hskVoiceModelTag_(model),value='STATUS_UNAVAILABLE';
  try{
   var res=hskVocabCall_(token,{action:'status',model:model}),available=0;
   if(Array.isArray(res.slots)){
    var slots=Array.isArray(res.modelSlots)?res.modelSlots.filter(function(s){return s.model===model;}):res.slots;
    slots.forEach(function(s){
     if(Number.isInteger(s.slot)&&s.slot>=1&&s.slot<=12&&!Number(s.retryAfter||0)&&
      Number(p.getProperty('HSK_VOCAB_PAIR_'+s.slot+'_'+model+'_AFTER')||0)<=now)available++;
    });
    value=String(available)+'_READY_SLOTS_OF_'+slots.length;
   }
  }catch(e){value='STATUS_ERROR_'+String(e.message||'worker').replace(/[^a-z0-9_]/gi,'_').slice(0,42);}
  rows.push(['Model_'+tag+'_health',value]);
 }
 rows.push(['Model_rotation','2.5 -> 3.1 -> 3.8; per-key cooldown; no false READY']);
 try{control.getRange(89,3,rows.length,2).setValues(rows);}catch(e){}
}
