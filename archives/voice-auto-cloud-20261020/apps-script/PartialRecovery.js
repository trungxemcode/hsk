/** Recover partial voice batches only when TWO independent audio transcripts match the unique expected items. */
function hskPartialMarkQueue_(queue,deferred,index,text,status,reason) {
 var at=deferred.findIndex(function(r){return Number(r[0])===index;});
 var row=[index,text,0,Date.now()+90000,status,reason];
 if(at>=0){if(deferred[at][4]==='DONE'&&status!=='DONE')return;queue.getRange(at+2,1,1,6).setValues([row]);deferred[at]=row;}
 else {queue.appendRow(row);deferred.push(row);}
}
function hskBatchPartialRecover_(storage,journal,rowNumber,row,queue,deferred,p) {
 var jobs=JSON.parse(row[1]);
 // Recover only the narrowly scoped 5->4 / 2->1 case. Never guess missing word from segment count alone.
 if(jobs.length<2||jobs.length>6||!row[2])return {kind:'ineligible'};
 var master=DriveApp.getFileById(String(row[2])).getBlob().getBytes(),clips;
 try{clips=hskBatchSplit_(master,jobs.length-1);}
 catch(e){return {kind:'ineligible',reason:String(e.message||'split_failed')};}
 if(clips.length!==jobs.length-1)return {kind:'ineligible'};
 var token=ScriptApp.getIdentityToken();if(!token)return {kind:'review',reason:'missing_google_identity'};
 var response;
 try{
  response=UrlFetchApp.fetch('https://hsk-vietnamese-translator.trung-hsk668.workers.dev/voice-precache',{
   method:'post',contentType:'application/json',
   headers:{Authorization:'Bearer '+token},
   payload:JSON.stringify({action:'verify',items:jobs.map(function(j){return j.text;}),clips:clips.map(function(b){return Utilities.base64Encode(b);})}),
   muteHttpExceptions:true
  });
 }catch(e){return {kind:'review',reason:'batch_verification_transport_uncertain'};}
 if(response.getResponseCode()!==200)return {kind:'review',reason:'batch_verification_failed_'+response.getResponseCode()};
 var match;
 try{match=JSON.parse(response.getContentText());}catch(e){return {kind:'review',reason:'batch_verification_invalid_response'};}
 if(!match.ok||match.verification!=='double_asr_exact'||!Array.isArray(match.indices)||match.indices.length!==clips.length){
  return {kind:'review',reason:'batch_verification_uncertain'};
 }
 var seen=new Set(),prior=-1;
 for(var k=0;k<match.indices.length;k++){
  var i=match.indices[k];
  if(!Number.isInteger(i)||i<0||i>=jobs.length||i<=prior||seen.has(i))return {kind:'review',reason:'batch_verification_ambiguous'};
  prior=i;seen.add(i);
 }
 if(seen.size!==jobs.length-1)return {kind:'review',reason:'batch_verification_ambiguous'};
 // Verification succeeded for ALL surviving utterances; save each idempotently under its actual word's hash.
 var saved=0,now=hskVNTime_(new Date());
 for(var c=0;c<clips.length;c++){
  var j=jobs[match.indices[c]],found=hskGetRow_(storage.sheet,j.key);
  if(!found||found.values[11]!=='READY'){
   var name='hsk-tts-'+j.key.slice(0,24)+'.wav',files=storage.folder.getFilesByName(name);
   var file=files.hasNext()?files.next():storage.folder.createFile(Utilities.newBlob(clips[c],'audio/wav',name));
   var values=[j.key,'zh-CN','Kore',j.model,file.getId(),'audio/wav',clips[c].length,now,now,0,row[6],'READY','partial_verified:'+row[0]];
   if(found)storage.sheet.getRange(found.index,1,1,13).setValues([values]);
   else storage.sheet.appendRow(values);
   saved++;
  }
  hskPartialMarkQueue_(queue,deferred,j.index,j.text,'DONE','partial_verified');
 }
 for(var m=0;m<jobs.length;m++){
  if(!seen.has(m)){var missing=jobs[m];hskPartialMarkQueue_(queue,deferred,missing.index,missing.text,'PENDING','batch_missing_audio_verified');}
 }
 row[3]='PARTIAL';row[4]='verified_'+clips.length+'_of_'+jobs.length;
 journal.getRange(rowNumber,1,1,7).setValues([row]);SpreadsheetApp.flush();
 return {kind:'partial',saved:saved,missing:jobs.length-clips.length};
}
function hskPartialHandleMismatch_(storage,journal,rowNumber,row,queue,deferred,p){
 var result=hskBatchPartialRecover_(storage,journal,rowNumber,row,queue,deferred,p);
 if(result.kind==='partial'){
  p.setProperty('HSK_WARM_SAVED_SINCE_FIX',String(Number(p.getProperty('HSK_WARM_SAVED_SINCE_FIX')||0)+result.saved));
  // No adaptive reduction: keep five items in the next batch.
  p.setProperty('HSK_WARM_RETRY_AT',String(Date.now()+90000));
  return true;
 }
 if(result.kind==='review'){
  // Keep the original master and DO NOT requeue all the already-spoken words.
  row[3]='REJECTED';row[4]=result.reason;journal.getRange(rowNumber,1,1,7).setValues([row]);
  p.setProperty('HSK_WARM_ENABLED','false');p.setProperty('HSK_WARM_LAST_ERROR',result.reason);
  return true;
 }
 return false; // Use original safe full-retry/rejection behavior.
}
/** Log only short, safe result metadata — never audio, Gemini keys or Google tokens. */
function hskRepairReport_(result){console.log('HSK_PARTIAL_REPAIR '+JSON.stringify(result));return result;}
/** Manually invoked ONE rejected master per run. Never auto-launch on live jobs or regenerate audio. */
function hskRepairOneRejectedMaster(){
 var p=hskSettings_();p.setProperty('HSK_WARM_ENABLED','false');
 var lock=LockService.getScriptLock();if(!lock.tryLock(1000))return hskRepairReport_({ok:false,status:'BUSY',error:'busy'});
 try{
  var storage=hskCheck_(p),journal=hskBatchTable_(storage),batches=hskBatchRows_(journal,7),
    queue=hskWarmQueue_(storage),deferred=hskBatchRows_(queue,6),inspected=[];
  for(var i=0;i<batches.length;i++){
   var row=batches[i];
   if(row[3]!=='REJECTED'||!row[2]||!/^batch_segment_count_mismatch/.test(String(row[4])))continue;
   var result=hskBatchPartialRecover_(storage,journal,i+2,row,queue,deferred,p);
   if(result.kind==='partial'){
    p.setProperty('HSK_WARM_SAVED_SINCE_FIX',String(Number(p.getProperty('HSK_WARM_SAVED_SINCE_FIX')||0)+result.saved));
    hskWarmProgress_(storage,p);
    return hskRepairReport_({ok:true,status:'PARTIAL',saved:result.saved,missing:result.missing,batch:String(row[0]).slice(0,12)});
   }
   if(result.kind==='review')return hskRepairReport_({ok:false,status:'REVIEW',error:result.reason,batch:String(row[0]).slice(0,12)});
   inspected.push({batch:String(row[0]).slice(0,12),reason:result.reason||'unmatched_segment_count'});
  }
  return hskRepairReport_({ok:false,status:'NOTHING_ELIGIBLE',inspected:inspected});
 }finally{lock.releaseLock();}
}
