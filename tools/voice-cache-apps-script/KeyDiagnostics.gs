// Read-only diagnostic: no audio generation, retries, or trigger changes.
function hskVoiceKeyDiagnostics() {
 var token=ScriptApp.getIdentityToken();
 for(var slot=1;slot<=9;slot++){
 var response=UrlFetchApp.fetch('https://hsk-vietnamese-translator.trung-hsk668.workers.dev/voice-precache',{method:'post',contentType:'application/json',headers:{Authorization:'Bearer '+token},payload:JSON.stringify({action:'diagnose',keySlot:slot}),muteHttpExceptions:true});
 console.log(JSON.stringify({slot:slot,result:JSON.parse(response.getContentText())}));
 }
}
