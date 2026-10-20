/**
 * Direct GAS -> Gemini fallback, no Cloudflare gateway used. Only reads
 * optional GEMINI_TTS_KEY_1..12 Script Properties, only when DIRECT is explicitly selected. Worker mode always uses its own GEMINI_API_KEY_1..12 secrets; no secret is logged or copied.
 * ASR runs twice, with two different Gemini models and independent requests.
 * Expected Hanzi/pinyin are NEVER included in the ASR prompts.
 */
function hskVoiceDirectKey_(p){
 var keys=[];
 for(var i=1;i<=12;i++){
  var k=p.getProperty('GEMINI_TTS_KEY_'+i)||p.getProperty('GEMINI_API_KEY_'+i);
  if(k&&Number(p.getProperty('HSK_VOICE_DIRECT_KEY_'+i+'_AFTER')||0)<=Date.now())keys.push({slot:i,key:k});
 }
 if(!keys.length)throw Error('direct_tts_keys_unavailable');
 var offset=Number(p.getProperty('HSK_VOICE_DIRECT_KEY_CURSOR')||0),chosen=keys[offset%keys.length];
 p.setProperty('HSK_VOICE_DIRECT_KEY_CURSOR',String(offset+1));
 return chosen;
}
function hskVoiceDirectCooldown_(p,slot,error){
 var reason=String(error&&error.message||error||'direct_provider_failure');
 var duration=/429|quota|rate|limit/i.test(reason)?600000:/403|401|permission|key_invalid/i.test(reason)?3600000:120000;
 p.setProperty('HSK_VOICE_DIRECT_KEY_'+slot+'_AFTER',String(Date.now()+duration));
}
function hskVoiceDirectTts_(p,text,model){
 var chosen=hskVoiceDirectKey_(p),bytes;
 try{bytes=hskGemini_(chosen.key,text,model);}
 catch(error){hskVoiceDirectCooldown_(p,chosen.slot,error);throw error;}
 if(!Array.isArray(bytes)||bytes.length<=44)throw Error('direct_tts_empty_audio');
 // Generation is not acceptance: ASR will separately check every clip.
 hskBatchPcm_(bytes);
 return {bytes:bytes,providerAttempts:1,keySlot:chosen.slot,model:model};
}
function hskVoiceDirectTranscribe_(key,clip,model){
 var instructions='Listen to the attached audio once. Transcribe ONLY Mandarin Chinese actually spoken. '
  +'Return JSON exactly {"hanzi":"Chinese characters","pinyin":"pinyin with tone marks"}. '
  +'Do not translate, infer from vocabulary lists, add extra words, or guess inaudible syllables. '
  +'Use empty strings if unclear. No explanation.';
 var payload={contents:[{role:'user',parts:[
  {text:instructions},{inlineData:{mimeType:'audio/wav',data:clip}}
 ]}],generationConfig:{temperature:0,responseMimeType:'application/json'}};
 var url='https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent';
 var r=UrlFetchApp.fetch(url,{method:'post',contentType:'application/json',
  headers:{'x-goog-api-key':key},payload:JSON.stringify(payload),muteHttpExceptions:true});
 if(r.getResponseCode()!==200)throw Error('direct_asr_http_'+r.getResponseCode());
 var result;
 try{
  result=JSON.parse(r.getContentText());
  var parts=result.candidates&&result.candidates[0]&&result.candidates[0].content&&result.candidates[0].content.parts||[];
  var raw=parts.map(function(part){return part.text||'';}).join('').trim();
  if(raw.length>3000)throw Error('direct_asr_long_response');
  result=JSON.parse(raw);
 }catch(e){throw Error('direct_asr_invalid_json');}
 if(typeof result.hanzi!=='string'||typeof result.pinyin!=='string'||
    result.hanzi.length>100||result.pinyin.length>200)throw Error('direct_asr_invalid_transcript');
 return {hanzi:result.hanzi,pinyin:result.pinyin};
}
function hskVoiceDirectVerify_(p,body){
 if(body.action!=='verify-words'||!Array.isArray(body.clips)||body.clips.length!==1||
    typeof body.clips[0]!=='string'||body.clips[0].length>650000)
  throw Error('direct_asr_single_clip_required');
 // Model outputs are independent and blind to target words in body.items/pinyin.
 // Use different transcription models; never generate two votes from one response.
 var models=['gemini-2.5-flash','gemini-2.5-flash-lite'];
 var passes=[];
 for(var i=0;i<2;i++){
  var key=hskVoiceDirectKey_(p);
  try{passes.push(hskVoiceDirectTranscribe_(key.key,body.clips[0],models[i]));}
  catch(error){hskVoiceDirectCooldown_(p,key.slot,error);throw error;}
 }
 var a=passes[0],b=passes[1];
 var normalizeHanzi=function(s){return String(s||'').normalize('NFKC').replace(/[\s\p{P}\p{S}]/gu,'').trim();};
 var normalizePinyin=function(s){return String(s||'').normalize('NFC').toLowerCase().replace(/[\s\p{P}]/gu,'');};
 var agree=!!normalizeHanzi(a.hanzi)&&normalizeHanzi(a.hanzi)===normalizeHanzi(b.hanzi)&&
  !!normalizePinyin(a.pinyin)&&normalizePinyin(a.pinyin)===normalizePinyin(b.pinyin);
 return {ok:true,verification:'double_asr_exact',verified:[agree],
  transcripts:[[a.hanzi],[b.hanzi]],pinyin:[[a.pinyin],[b.pinyin]],
  verifiedBy:'two_independent_direct_gemini_audio_requests'};
}
