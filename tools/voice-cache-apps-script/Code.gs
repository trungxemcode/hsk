/**
 * HSK Gemini TTS cache service (Apps Script V8).
 * This runs server-side ONLY. Never embed keys, token or Drive IDs in browser JS.
 * Script Properties required:
 *   HSK_VOICE_TOKEN   - strong random gateway secret
 *   HSK_VOICE_SHEET_ID, HSK_VOICE_FOLDER_ID
 *   GEMINI_TTS_KEY_1 ... GEMINI_TTS_KEY_9
 * Optional:
 *   HSK_VOICE_MODEL  - default gemini-2.5-flash-preview-tts
 *   HSK_VOICE_PAUSED - set true for kill switch
 *   HSK_VOICE_NEXT_KEY
 */
var HSK_VOICE_MAX_CHARS = 220;
var HSK_VOICE_MAX_AUDIO_BYTES = 1500000;
var HSK_VOICE_COLUMNS = 13;
function hskResult_(value) {return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);}
function hskSettings_() {return PropertiesService.getScriptProperties();}
function hskDigest_(text) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,text,Utilities.Charset.UTF_8)
    .map(function(x){return ('0'+(x&255).toString(16)).slice(-2);}).join('');
}
function hskCleanText_(value) {
  var t = String(value || '').normalize('NFC').replace(/\s+/g,' ').trim();
  if (!t || Array.from(t).length > HSK_VOICE_MAX_CHARS) throw new Error('invalid_text');
  if (/[<>]/.test(t)) throw new Error('invalid_text');
  return t;
}
function hskCheck_(p) {
  if (p.getProperty('HSK_VOICE_PAUSED') === 'true') throw new Error('paused');
  var id=p.getProperty('HSK_VOICE_SHEET_ID'),folder=p.getProperty('HSK_VOICE_FOLDER_ID');
  if(!id||!folder)throw new Error('missing_storage_config');
  return {sheet:SpreadsheetApp.openById(id).getSheetByName('Kho_Voice'),folder:DriveApp.getFolderById(folder)};
}
function hskResponse_(file,fromCache,keyIndex) {
  var bytes=file.getBlob().getBytes();
  if(bytes.length>HSK_VOICE_MAX_AUDIO_BYTES)throw new Error('audio_too_large');
  return {ok:true,cached:fromCache,mime:'audio/wav',audioBase64:Utilities.base64Encode(bytes),bytes:bytes.length,keyIndex:keyIndex||0};
}
function hskGetRow_(sheet,cacheKey) {
  var last=sheet.getLastRow();
  if(last<2)return null;
  var matches=sheet.getRange(2,1,last-1,1).createTextFinder(cacheKey).matchEntireCell(true).findNext();
  if(!matches)return null;
  return {index:matches.getRow(), values:sheet.getRange(matches.getRow(),1,1,HSK_VOICE_COLUMNS).getValues()[0]};
}
function hskCached_(storage,cacheKey) {
  var found=hskGetRow_(storage.sheet,cacheKey);
  if(!found||found.values[11]!=='READY'||!found.values[4])return null;
  try {
    var f=DriveApp.getFileById(String(found.values[4])),result=hskResponse_(f,true,0);
    storage.sheet.getRange(found.index,9,1,2).setValues([[new Date().toISOString(),Number(found.values[9]||0)+1]]);
    return result;
  } catch(error) {
    // Missing/corrupt Drive objects are rebuilt; don't mistake them for a cache hit.
    return null;
  }
}
function hskLE_(arr,n,bytes){for(var i=0;i<bytes;i++){arr.push(n&255);n=Math.floor(n/256);}}
function hskWav_(raw,mime) {
  if(!raw.length||raw.length>HSK_VOICE_MAX_AUDIO_BYTES-44||raw.length%2)throw new Error('invalid_audio');
  if(raw.length>12&&(raw[0]&255)===82&&(raw[1]&255)===73&&(raw[2]&255)===70&&(raw[3]&255)===70)return raw;
  if(!/audio\/(?:l16|pcm|x-pcm)/i.test(mime))throw new Error('unsupported_audio_format');
  var header=[];
  function str(s){for(var i=0;i<s.length;i++)header.push(s.charCodeAt(i));}
  str('RIFF');hskLE_(header,36+raw.length,4);str('WAVEfmt ');hskLE_(header,16,4);
  hskLE_(header,1,2);hskLE_(header,1,2);hskLE_(header,24000,4);hskLE_(header,48000,4);
  hskLE_(header,2,2);hskLE_(header,16,2);str('data');hskLE_(header,raw.length,4);
  return header.map(function(b){return b>127?b-256:b;}).concat(raw);
}
function hskGemini_(key,text,model) {
  var prompt='Đọc nguyên văn tiếng Trung phổ thông sau, rõ ràng và tự nhiên. Không thêm hoặc thay chữ: '+text;
  var body={contents:[{role:'user',parts:[{text:prompt}]}],
    generationConfig:{responseModalities:['AUDIO'],speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:'Kore'}}}}};
  var res=UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent',{
    method:'post',contentType:'application/json',headers:{'x-goog-api-key':key},
    payload:JSON.stringify(body),muteHttpExceptions:true});
  var code=res.getResponseCode();
  if(code!==200){var err=new Error('provider_'+code);err.retryable=(code===429||code===408||code>=500);throw err;}
  var json=JSON.parse(res.getContentText());
  var parts=(json.candidates&&json.candidates[0]&&json.candidates[0].content&&json.candidates[0].content.parts)||[];
  var audio=parts.filter(function(p){return p.inlineData&&p.inlineData.data;})[0];
  if(!audio)throw new Error('missing_audio');
  return hskWav_(Utilities.base64Decode(audio.inlineData.data),audio.inlineData.mimeType||'audio/l16');
}
function hskWorkerTts_(text) {
  var idToken=ScriptApp.getIdentityToken();
  if(!idToken)throw new Error('google_identity_missing');
  var url='https://hsk-vietnamese-translator.trung-hsk668.workers.dev/voice-precache';
  var response=UrlFetchApp.fetch(url,{method:'post',contentType:'application/json',
    headers:{Authorization:'Bearer '+idToken},payload:JSON.stringify({text:text,language:'zh-CN'}),muteHttpExceptions:true});
  if(response.getResponseCode()!==200){
    // Only include predefined safe backend error codes; never echo credentials or a provider body.
    var reason='request_failed';
    try{var result=JSON.parse(response.getContentText());if(/^(identity_unavailable|unauthorized|voice_not_configured|tts_provider_unavailable|invalid_model|invalid_tts_audio|invalid_tts_response|tts_generation_incomplete|tts_blocked|tts_rate_limited|tts_daily_limit|tts_quota_unavailable|tts_key_invalid|tts_permission_denied|tts_region_unavailable|tts_model_unavailable|tts_request_rejected|tts_transport_uncertain)$/.test(String(result.error||'')))reason=result.error;}catch(ignored){}
    var failure=new Error('cloudflare_tts_'+response.getResponseCode()+'_'+reason);
    failure.retryable=typeof result==='object'&&typeof result.retryable==='boolean'?result.retryable:[429,503,504].indexOf(response.getResponseCode())>=0||reason==='tts_generation_incomplete'||reason==='tts_provider_unavailable';
    throw failure;
  }
  var json=JSON.parse(response.getContentText());
  if(!json.ok||!json.audioBase64||!json.mimeType)throw new Error('cloudflare_audio_invalid');
  return {bytes:hskWav_(Utilities.base64Decode(json.audioBase64),json.mimeType),index:0};
}
function hskGenerate_(p,text,model) {
  if(p.getProperty('HSK_VOICE_TTS_TRANSPORT')!=='direct')return hskWorkerTts_(text);
  var keys=[];
  for(var i=1;i<=9;i++){var v=p.getProperty('GEMINI_TTS_KEY_'+i);if(v)keys.push({index:i,key:v});}
  if(!keys.length)throw new Error('tts_keys_not_set');
  var cursor=Number(p.getProperty('HSK_VOICE_NEXT_KEY')||'0')||0;
  var start=cursor%keys.length;
  p.setProperty('HSK_VOICE_NEXT_KEY',String((start+1)%keys.length));
  var cache=CacheService.getScriptCache();
  for(var attempt=0;attempt<keys.length;attempt++){
    var item=keys[(start+attempt)%keys.length],mark='HSK_TTS_COOLDOWN_'+item.index;
    if(cache.get(mark))continue;
    try{return {bytes:hskGemini_(item.key,text,model),index:item.index};}
    catch(error){
      if(!error.retryable)throw error;
      cache.put(mark,'1',error.message==='provider_429'?600:60);
    }
  }
  throw new Error('all_tts_keys_unavailable');
}
function hskHandle_(req,p) {
  if(!req||typeof req!=='object')throw new Error('invalid_request');
  var configured=p.getProperty('HSK_VOICE_TOKEN');
  if(!configured||!req.token||String(req.token)!==configured)throw new Error('unauthorized');
  if(req.action==='ping')return {ok:true,ready:!!(p.getProperty('HSK_VOICE_SHEET_ID')&&p.getProperty('HSK_VOICE_FOLDER_ID')),keyCount:(function(){var n=0;for(var i=1;i<=9;i++)if(p.getProperty('GEMINI_TTS_KEY_'+i))n++;return n;})()};
  if(req.action!=='speech')throw new Error('invalid_action');
  var text=hskCleanText_(req.text);
  if(req.language&&req.language!=='zh-CN')throw new Error('unsupported_language');
  var model=p.getProperty('HSK_VOICE_MODEL')||'gemini-2.5-flash-preview-tts';
  if(!/^gemini-[\w.-]+-tts$/.test(model))throw new Error('invalid_model');
  var cacheKey=hskDigest_(JSON.stringify(['zh-CN','Kore',model,text]));
  // Lock spans lookup/generation/write to avoid duplicate paid requests for the same phrase.
  // Safe initial implementation: callers serialize; consider per-key singleflight for scale.
  var lock=LockService.getScriptLock();if(!lock.tryLock(25000))throw new Error('busy_retry');
  try {
    var storage=hskCheck_(p),hit=hskCached_(storage,cacheKey);
    if(hit)return hit;
    var generated=hskGenerate_(p,text,model);
    var filename='hsk-tts-'+cacheKey.slice(0,24)+'.wav';
    var file=storage.folder.createFile(Utilities.newBlob(generated.bytes,'audio/wav',filename));
    var stamp=new Date().toISOString();
    storage.sheet.appendRow([cacheKey,'zh-CN','Kore',model,file.getId(),'audio/wav',
      generated.bytes.length,stamp,stamp,0,generated.index,'READY','']);
    return {ok:true,cached:false,mime:'audio/wav',audioBase64:Utilities.base64Encode(generated.bytes),bytes:generated.bytes.length,keyIndex:generated.index};
  } finally {lock.releaseLock();}
}
function doPost(e) {
  // Error responses deliberately omit text, tokens, API keys, stack traces and vendor bodies.
  try {
    if(!e||!e.postData||!e.postData.contents||e.postData.contents.length>8192)throw new Error('invalid_request');
    return hskResult_(hskHandle_(JSON.parse(e.postData.contents),hskSettings_()));
  } catch(error) {
    return hskResult_({ok:false,error:String(error.message||'internal_error').replace(/[^a-z0-9_]/gi,'_').slice(0,48)});
  }
}
