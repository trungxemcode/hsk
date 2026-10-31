/**
 * One-time salvage of two saved masters verified with two independent offline ASR models.
 * Do not run Gemini, infer ambiguous syllables, or change existing READY files.
 * The local Whisper-small and large-v3-turbo passes both confirmed:
 * first master: clip 0 打电话, clip 1 电视, clip 3 对不起.
 * Clip 2 disagreed (多 vs 都), so 读 is NOT marked READY; 的 has no clip.
 * second master: clip 0 打电话 (duplicate).
 */
function hskOfflineRecoverOnce_() {
 var p=hskSettings_(),flag='HSK_OFFLINE_3OF5_20261018_V1';
 if(p.getProperty(flag)==='done'||p.getProperty('HSK_WARM_ENABLED')==='true')return false;
 if(Number(p.getProperty(flag+'_attempts')||0)>=3)return false;
 var lock=LockService.getScriptLock();if(!lock.tryLock(100))return false;
 try {
  if(p.getProperty(flag)==='done')return true;
  p.setProperty(flag+'_attempts',String(Number(p.getProperty(flag+'_attempts')||0)+1));
  var storage=hskCheck_(p),journal=hskBatchTable_(storage),queue=hskWarmQueue_(storage);
  var batches=hskBatchRows_(journal,7),deferred=hskBatchRows_(queue,6),now=new Date().toISOString(),saved=0;
  var specs=[
   {id:'a6d4dac2b97efb8c0bdee570c0304ec934734c1f08a5c67d20ef657094d0c2cd',
    sha:'a07c6fc6760b3768603a9871298aba78262a2d311053dc464e365f0dbea7d779',
    words:['打电话','的','电视','读','对不起'],count:4,verified:[{clip:0,job:0},{clip:1,job:2},{clip:3,job:4}]},
   {id:'3209d8e4e74226b6854357f30565b82c8cfd84d628c23d71e7e3c62ec5b7161e',
    sha:'edc6f0026638c0e75513cb4cedf38cfdc2bb5357e1cc9fb17e27ba5d801413e1',
    words:['打电话','的'],count:1,verified:[{clip:0,job:0}]}
  ];
  // Validate BOTH masters completely before modifying Drive/Sheets.
  var prepared=specs.map(function(spec){
   var at=batches.findIndex(function(r){return String(r[0])===spec.id;});
   if(at<0)throw Error('offline_master_not_found');
   var row=batches[at],jobs=JSON.parse(row[1]);
   if(!row[2]||jobs.length!==spec.words.length||jobs.some(function(j,i){return j.text!==spec.words[i];}))
    throw Error('offline_master_mismatch');
   var bytes=DriveApp.getFileById(String(row[2])).getBlob().getBytes();
   var sha=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,bytes)
    .map(function(b){return ('0'+(b&255).toString(16)).slice(-2);}).join('');
   if(sha!==spec.sha)throw Error('offline_master_checksum_mismatch');
   var clips=hskBatchSplit_(bytes,spec.count);
   if(clips.length!==spec.count)throw Error('offline_master_split_mismatch');
   return {spec:spec,row:row,at:at,jobs:jobs,clips:clips};
  });
  function setRetry(job,ready){
   var k=deferred.findIndex(function(r){return Number(r[0])===job.index;});
   var newRow=[job.index,job.text,0,Date.now()+(ready?0:90000),ready?'DONE':'PENDING',ready?'offline_two_model_confirmed':'offline_audio_missing_or_ambiguous'];
   if(k<0){queue.appendRow(newRow);deferred.push(newRow);}
   else if(deferred[k][4]!=='DONE'||ready){queue.getRange(k+2,1,1,6).setValues([newRow]);deferred[k]=newRow;}
  }
  prepared.forEach(function(item){
   var verifiedJobs=new Set();
   item.spec.verified.forEach(function(v){
    var job=item.jobs[v.job],found=hskGetRow_(storage.sheet,job.key);
    var file;
    if(found&&found.values[11]==='READY'&&found.values[4]){verifiedJobs.add(v.job);setRetry(job,true);return;}
    var name='hsk-tts-'+job.key.slice(0,24)+'.wav',files=storage.folder.getFilesByName(name);
    file=files.hasNext()?files.next():storage.folder.createFile(Utilities.newBlob(item.clips[v.clip],'audio/wav',name));
    var values=[job.key,'zh-CN','Kore',job.model,file.getId(),'audio/wav',item.clips[v.clip].length,now,now,0,item.row[6],'READY','offline_two_model_confirmed:'+item.spec.id.slice(0,12)];
    if(found)storage.sheet.getRange(found.index,1,1,13).setValues([values]);else storage.sheet.appendRow(values);
    saved++;verifiedJobs.add(v.job);setRetry(job,true);
   });
   item.jobs.forEach(function(job,i){if(!verifiedJobs.has(i)){
     var old=hskGetRow_(storage.sheet,job.key);
     if(old&&old.values[11]==='READY')setRetry(job,true);else setRetry(job,false);
   }});
   item.row[3]='PARTIAL';item.row[4]='offline_verified_'+verifiedJobs.size+'_of_'+item.jobs.length+'; ambiguous_or_missing_requeued';
   journal.getRange(item.at+2,1,1,7).setValues([item.row]);
  });
  SpreadsheetApp.flush();
  p.setProperty(flag,'done');
  p.setProperty('HSK_WARM_SAVED_SINCE_FIX',String(Number(p.getProperty('HSK_WARM_SAVED_SINCE_FIX')||0)+saved));
  hskWarmProgress_(storage,p);
  console.log('HSK_OFFLINE_RECOVERY '+JSON.stringify({status:'PARTIAL',newReady:saved,batches:2,retryWords:['的','读']}));
  return true;
 }catch(e){
  p.setProperty(flag+'_lastError',String(e.message||'offline_repair_failed').slice(0,70));
  console.error('HSK_OFFLINE_RECOVERY_FAILED '+String(e.message||'offline_repair_failed').slice(0,70));
  return true;
 }finally{lock.releaseLock();}
}
