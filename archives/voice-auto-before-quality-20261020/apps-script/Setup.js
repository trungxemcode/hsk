/**
 * Run this ONCE from the Apps Script editor to attach the existing HSK storage.
 * Does not create files, generate audio, or store any Gemini API key.
 */
function hskInitializeStorage() {
  var p=PropertiesService.getScriptProperties();
  p.setProperty('HSK_VOICE_SHEET_ID','1QOh-dFg-Lf3Ig-9ti6zGIYffNN5hs3ITjq1RjT2xNzk');
  p.setProperty('HSK_VOICE_FOLDER_ID','154s3taqv3dBAPEuMJwLo1Df3Gz_iq5UX');
  if(!p.getProperty('HSK_VOICE_TOKEN'))p.setProperty('HSK_VOICE_TOKEN',Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,''));
  if(!p.getProperty('HSK_WARM_CURSOR'))p.setProperty('HSK_WARM_CURSOR','0');
  // Cloudflare Worker already holds Gemini keys. Never duplicate them here.
  return hskWarmStatus();
}
/** Safe first live probe: one phrase, one file, then check cache on the second run. */
function hskTestOneVoice() {
  var props=hskSettings_(),token=props.getProperty('HSK_VOICE_TOKEN');
  var result=hskHandle_({action:'speech',token:token,text:'你好',language:'zh-CN'},props);
  return {ok:result.ok,cached:result.cached,bytes:result.bytes};
}
