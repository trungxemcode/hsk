/**
 * One-click diagnostic. No TTS, no ASR, no queue mutation.
 * Saves only non-sensitive results to Voice_Control!A47:B56.
 */
function hskVoiceSegmentDiagnostic(){
 var p=hskSettings_(),sheet=SpreadsheetApp.openById(p.getProperty('HSK_VOICE_SHEET_ID')).getSheetByName('Voice_Control');
 var lines=[['Segment_diagnostic_at',hskVNTime_(new Date())]];
 try{
  var identity=ScriptApp.getIdentityToken();
  if(!identity)throw Error('identity_token_missing');
  var body=JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(identity.split('.')[1])).getDataAsString());
  lines.push(['Segment_identity_email',String(body.email||'missing')]);
  lines.push(['Segment_identity_aud',String(body.aud||'missing')]);
  lines.push(['Segment_identity_issuer',String(body.iss||'missing')]);
  var url='https://hsk-voice-segmenter.trung-hsk668.workers.dev/segment-wav';
  var response=UrlFetchApp.fetch(url,{method:'post',contentType:'application/json',headers:{Authorization:'Bearer '+identity},payload:JSON.stringify({action:'segment-wav',audioBase64:'',expected:1}),muteHttpExceptions:true});
  lines.push(['Segment_worker_http',String(response.getResponseCode())]);
  var reply={};try{reply=JSON.parse(response.getContentText());}catch(ignore){}
  lines.push(['Segment_worker_result',String(reply.error||'ok').slice(0,100)]);
  lines.push(['Segment_feature_flag',String(p.getProperty('HSK_VOICE_REMOTE_SEGMENT')||'OFF')]);
  lines.push(['Segment_voice_paused',String(p.getProperty('HSK_VOICE_PAUSED')||'unset')]);
 }catch(e){lines.push(['Segment_diagnostic_error',String(e.message||e).slice(0,160)]);}
 sheet.getRange(47,1,lines.length,2).setValues(lines);
 return 'Diagnostic written to Voice_Control A47:B'+(46+lines.length);
}
