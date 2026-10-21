/**
 * Owner-authorized manual acceptance of exactly eight HSK2-4 audio clips.
 * Approval waives the ASR quality gate for these eight ONLY. It does NOT
 * claim that the recording has correct tones; the independent ASR evidence
 * remains on Voice_Auto_Clips. All other READY audio stays untouched.
 * Resumable and idempotent if Apps Script times out between Sheet writes.
 */
function hskOwnerApprove8_20261021_(p,storage,tables,rows,batches){
 var done='HSK_OWNER_APPROVAL_8_20261021_COMPLETED';
 if(p.getProperty(done)==='true')return false;
 var id='3caa4deab244fcf08902ce4b5dcc490354594aceb5349704a089379b88dc1be4';
 var target=[['\u8fd8','hu\u00e1n'],['\u7531','y\u00f3u'],['\u8282','ji\u00e9'],['\u65e0','w\u00fa'],['\u6674','q\u00edng'],['\u7740','zhe'],['\u5730','de'],['\u6781','j\u00ed']];
 var pos=batches.findIndex(function(b){return b[0]===id;});
 if(pos<0)throw Error('owner8_source_batch_not_found');
 var batch=batches[pos],jobs=JSON.parse(batch[1]||'[]');
 if(jobs.length!==8||!batch[2]||['PARTIAL','OWNER_APPROVED'].indexOf(batch[3])<0)throw Error('owner8_invalid_source');
 var clipsSheet=hskAuto50Sheet_(storage),all=hskVocabRows_(clipsSheet,15);
 var plans=[],used={};
 for(var i=0;i<8;i++){
  var j=jobs[i],targetEntry=target[i],r=rows[j.row];
  if(!j||j.text!==targetEntry[0]||j.pinyin!==targetEntry[1]||!r||
     String(r[1])!==j.text||String(r[2])!==j.pinyin||Number(r[0])!==Number(j.level))throw Error('owner8_vocab_mapping_mismatch_'+i);
  var found=all.map(function(c,n){return {clip:c,n:n};}).filter(function(x){
   return x.clip[0]===id&&Number(x.clip[1])===i+1;
  });
  if(found.length!==1)throw Error('owner8_invalid_clip_count_'+i);
  var item=found[0],clip=item.clip,start=Number(clip[2]),end=Number(clip[3]);
  if(!(start>=0&&end>start&&end-start>=200&&end-start<=5000)||used[i+1])throw Error('owner8_invalid_clip_bounds_'+i);
  if(['REVIEW','OWNER_APPROVED'].indexOf(String(clip[4]))<0)throw Error('owner8_invalid_clip_state_'+i);
  if(['READY','EXISTING'].indexOf(String(r[3]))>=0){
   if(!r[9])throw Error('owner8_ready_without_file_'+i);
  }else if(r[9])throw Error('owner8_missing_ready_with_file_'+i);
  plans.push({j:j,i:i,clip:clip,clipIndex:item.n,start:start,end:end,row:r});
  used[i+1]=true;
 }
 var pcm=hskBatchPcm_(DriveApp.getFileById(batch[2]).getBlob().getBytes());
 plans.forEach(function(o){
  var a=Math.max(0,Math.round((o.start-120)*24)),b=Math.min(pcm.length/2,Math.round((o.end+200)*24));
  if(b-a<5000||b-a>200000)throw Error('owner8_clip_too_short_or_long_'+o.i);
  o.wav=hskWav_(pcm.slice(a*2,b*2),'audio/l16');
  if(o.wav.length<10000||o.wav.length>400000)throw Error('owner8_clip_size_invalid_'+o.i);
 });
 for(var i=0;i<plans.length;i++){
  var o=plans[i],job=o.j,r=o.row,clip=o.clip;
  if(['READY','EXISTING'].indexOf(String(r[3]))>=0)continue;
  // Add pinyin to the cache identity to avoid overwriting 还 (hái) with 还 (huán).
  var key=hskDigest_(JSON.stringify(['zh-CN','Kore',job.model,job.text,job.pinyin,'owner-approved-20261021']));
  var filename='hsk-owner-accepted-'+key.slice(0,24)+'.wav';
  var old=hskGetRow_(storage.sheet,key),driveFile;
  if(old&&old.values[11]==='READY'&&old.values[4]){
   driveFile=DriveApp.getFileById(String(old.values[4]));
  }else{
   var cursor=storage.folder.getFilesByName(filename);
   driveFile=cursor.hasNext()?cursor.next():storage.folder.createFile(Utilities.newBlob(o.wav,'audio/wav',filename));
   var stamp=new Date().toISOString();
   var entry=[key,'zh-CN','Kore',job.model,driveFile.getId(),'audio/wav',o.wav.length,stamp,stamp,0,batch[6],'READY','OWNER_APPROVED_NO_ASR:2026-10-21;word='+job.text+';pinyin='+job.pinyin+';source='+id];
   if(old)storage.sheet.getRange(old.index,1,1,13).setValues([entry]);else storage.sheet.appendRow(entry);
  }
  var fileId=driveFile.getId();
  r[3]='READY';r[6]=id;r[7]=job.model;r[8]=batch[2];r[9]=fileId;
  r[10]=JSON.stringify([clip[6],clip[7]]);r[11]='OWNER_APPROVED_NO_ASR_20261021';
  r[13]=JSON.stringify([clip[8],clip[9]]);r[14]=o.start;r[15]=o.end;
  r[16]='https://drive.google.com/file/d/'+fileId+'/view';
  hskVocabWrite_(tables.queue,job.row,r);
  clip[4]='OWNER_APPROVED';clip[10]=job.row+2;clip[11]=job.text;clip[12]=fileId;
  clip[13]='OWNER_APPROVED_NO_ASR_20261021';clip[14]=new Date().toISOString();
  clipsSheet.getRange(o.clipIndex+2,1,1,15).setValues([clip]);
 }
 // Only commit the one-time checkpoint after all eight have individual files.
 var confirmed=plans.every(function(o){return ['READY','EXISTING'].indexOf(o.row[3])>=0&&o.row[9]&&['OWNER_APPROVED','REVIEW'].indexOf(o.clip[4])>=0;});
 if(!confirmed)throw Error('owner8_incomplete');
 // Preserve any later unfinished synthesis master but never retry it after
 // these exact eight words have been manually accepted.
 batches.forEach(function(other,n){
  if(n===pos||['TTS_CHUNKS','RESERVED','MASTER','VERIFY','AUTO_VERIFY'].indexOf(other[3])<0)return;
  var otherJobs;try{otherJobs=JSON.parse(other[1]);}catch(ignore){return;}
  if(!otherJobs.length||!otherJobs.every(function(j){return target.some(function(t){return t[0]===j.text&&t[1]===j.pinyin;});}))return;
  other[3]='OWNER_SUPERSEDED';other[4]='preserved_audio_owner_approved_from_source_'+id;
  tables.batches.getRange(n+2,1,1,11).setValues([other]);
 });
 batch[3]='OWNER_APPROVED';batch[4]='owner_accepted_8_unverified_ASR_waived_20261021';
 tables.batches.getRange(pos+2,1,1,11).setValues([batch]);
 p.setProperty(done,'true');
 p.deleteProperty('HSK_VOCAB_ERROR');p.deleteProperty('HSK_VOCAB_RETRY_AT');
 hskVocabSummary_(storage,tables);
 var progress=storage.sheet.getParent().getSheetByName('Tien_do_tu_vung');
 if(progress)progress.getRange(4,1).setValue('READY (bao gồm 8 từ chủ sở hữu duyệt, không đạt ASR)');
 var control=storage.sheet.getParent().getSheetByName('Voice_Control');
 control.getRange(2,2).setValue('PAUSE');
 control.getRange(6,2).setValue('AUTO_CYCLE_COMPLETE_OWNER_APPROVED_8');
 hskVocabStop();
 return true;
}
