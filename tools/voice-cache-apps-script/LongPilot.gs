/** Manual one-request pilot; no trigger or queue-order changes. Secrets never logged. */
function hskLongPilotInspect(){
 var token=ScriptApp.getIdentityToken(),url='https://hsk-vietnamese-translator.trung-hsk668.workers.dev/voice-precache';
 function check(body){var r=UrlFetchApp.fetch(url,{method:'post',contentType:'application/json',headers:{Authorization:'Bearer '+token},payload:JSON.stringify(body),muteHttpExceptions:true});return {http:r.getResponseCode(),result:JSON.parse(r.getContentText())};}
 console.log(JSON.stringify({availability:check({action:'status'}),replacementSlot2:check({action:'diagnose',keySlot:2})}));
}
function hskLongPilotRun(){
 var lock=LockService.getScriptLock();if(!lock.tryLock(1000))throw Error('busy_no_generation_sent');
 var row,sheet,number;
 try{
  var p=hskSettings_(),storage=hskCheck_(p),token=ScriptApp.getIdentityToken(),url='https://hsk-vietnamese-translator.trung-hsk668.workers.dev/voice-precache';
  var health=hskParallelAvailability_(token),available=health.filter(function(s){return !Number(s.retryAfter);});
  var chosen=[2,6,9,0,3,4,5,7,8,10,11,1,12].find(function(n){return available.some(function(s){return s.slot===n;});});
  if(chosen===undefined)throw Error('tts_keys_cooling_no_generation_sent');
  var probe=UrlFetchApp.fetch(url,{method:'post',contentType:'application/json',headers:{Authorization:'Bearer '+token},payload:JSON.stringify({action:'diagnose',keySlot:chosen}),muteHttpExceptions:true});
  var info=JSON.parse(probe.getContentText());if(!info.ok)throw Error('pilot_model_check_failed');
  var model=info.model,corpus=hskWarmCorpus_(),cursor=Number(p.getProperty('HSK_WARM_CURSOR')||0),jobs=[],seen=new Set(),chars=0,book=storage.sheet.getParent();
  var old=storage.sheet.getLastRow()>1?storage.sheet.getRange(2,1,storage.sheet.getLastRow()-1,13).getValues():[];
  var ready=new Set(old.filter(function(r){return r[11]==='READY'&&r[4];}).map(function(r){return String(r[0]);}));
  for(var i=cursor;i<corpus.length&&jobs.length<180;i++){
   var text=String(corpus[i]),key=hskDigest_(JSON.stringify(['zh-CN','Kore',model,text]));
   if(seen.has(text)||[model,'gemini-2.5-flash-preview-tts','gemini-3.1-flash-tts-preview'].some(function(m){return ready.has(hskDigest_(JSON.stringify(['zh-CN','Kore',m,text])));}))continue;
   if(chars+text.length+4>4800)break;chars+=text.length+4;seen.add(text);jobs.push({index:i,text:text,key:key,model:model});
  }
  if(jobs.length<150)throw Error('insufficient_new_short_items_no_generation_sent');
  sheet=book.getSheetByName('Voice_Long_Pilots');if(!sheet){sheet=book.insertSheet('Voice_Long_Pilots');sheet.appendRow(['Batch','Jobs_JSON','Master_file','State','Error','Created','Slot']);}
  // Never resubmit an unresolved pilot after an uncertain transport or interrupted save.
  var prior=hskBatchRows_(sheet,7);prior.forEach(function(r,i){if(!r[2]&&(r[4]==='cloudflare_tts_502_tts_request_rejected'||r[6]===2&&r[4]==='cloudflare_tts_502_tts_generation_incomplete'&&/^2026-10-19T02:01:/.test(String(r[5])))){r[3]='FAILED';sheet.getRange(i+2,1,1,7).setValues([r]);}});if(prior.some(function(r){return ['RESERVED','MASTER','REVIEW'].indexOf(r[3])>=0;}))throw Error('unresolved_pilot_no_generation_sent');
  var id=hskDigest_(JSON.stringify(jobs)+':'+Date.now());row=[id,JSON.stringify(jobs),'','RESERVED','',new Date().toISOString(),chosen];sheet.appendRow(row);number=sheet.getLastRow();SpreadsheetApp.flush();
  var response=UrlFetchApp.fetch(url,{method:'post',contentType:'application/json',headers:{Authorization:'Bearer '+token},payload:JSON.stringify({items:jobs.map(function(j){return j.text;}),keySlot:chosen,language:'zh-CN',isolated:true}),muteHttpExceptions:true});
  var decoded=hskParallelDecode_(response),master=storage.folder.createFile(Utilities.newBlob(decoded.bytes,'audio/wav','LONG_PILOT_'+id+'.wav'));
  row[2]=master.getId();row[3]='MASTER';sheet.getRange(number,1,1,7).setValues([row]);SpreadsheetApp.flush();
  var duration=hskBatchPcm_(decoded.bytes).length/48000,queue=hskWarmQueue_(storage),deferred=hskBatchRows_(queue,6);
  var saved=hskBatchCommit_(storage,sheet,number,row,queue,deferred);
  console.log(JSON.stringify({ok:true,slot:chosen,model:model,requestedItems:jobs.length,durationSeconds:duration,inRequestedRange:duration>=300&&duration<=480,saved:saved,masterUrl:master.getUrl(),providerAttempts:decoded.providerAttempts}));
 }catch(e){
  if(row&&sheet&&number){row[3]=row[2]?'REVIEW':e.providerAttempts===0||(/tts_request_rejected/.test(String(e.message))||/Model tried to generate text/.test(String(e.diagnostic&&e.diagnostic.detail)))?'FAILED':'REVIEW';row[4]=String(e.message||'pilot_failed').replace(/[^a-z0-9_]/gi,'_').slice(0,120);sheet.getRange(number,1,1,7).setValues([row]);}
  console.log(JSON.stringify({ok:false,error:String(e.message||'pilot_failed').replace(/[^a-z0-9_]/gi,'_').slice(0,120),masterSaved:!!(row&&row[2]),providerAttempts:e.providerAttempts,diagnostic:e.diagnostic}));
 }finally{lock.releaseLock();}
}
