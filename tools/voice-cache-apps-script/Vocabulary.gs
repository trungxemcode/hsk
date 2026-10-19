/** Vocabulary-only HSK 2 -> 3 -> 4 queue. A saved master is reused; only blind-ASR-approved clips become READY. */
var HSK_VOCAB_URL_='https://hsk-vietnamese-translator.trung-hsk668.workers.dev/voice-precache';
function hskVocabTable_(book,name,columns){var s=book.getSheetByName(name);if(!s){s=book.insertSheet(name);s.appendRow(columns);s.setFrozenRows(1);}return s;}
function hskVocabRows_(s,n){return s.getLastRow()>1?s.getRange(2,1,s.getLastRow()-1,n).getValues():[];}
function hskVocabWrite_(sheet,index,row){row[12]=new Date().toISOString();sheet.getRange(index+2,1,1,17).setValues([row]);}
function hskVocabKey_(model,text){return hskDigest_(JSON.stringify(['zh-CN','Kore',model,text]));}
function hskVocabTables_(storage){var book=storage.sheet.getParent();return {queue:hskVocabTable_(book,'Voice_Vocabulary',['HSK','Text','Pinyin','State','Attempts','Retry_after','Batch','Model','Master','File','Heard','Error','Updated','Heard_pinyin','Clip_start_ms','Clip_end_ms','Audio_URL']),batches:hskVocabTable_(book,'Voice_Vocab_Batches',['Batch','Jobs_JSON','Master','State','Error','Created','Slot','Model','Pause_seconds','Duration_seconds','Ranges_JSON'])};}
function hskVocabSummary_(storage,tables){
 var rows=hskVocabRows_(tables.queue,17),p=hskSettings_(),out={enabled:p.getProperty('HSK_VOCAB_ENABLED')==='true',total:rows.length,ready:0,existing:0,review:0,pending:0,levels:{},lastError:p.getProperty('HSK_VOCAB_ERROR')||'',retryAt:Number(p.getProperty('HSK_VOCAB_RETRY_AT')||0),ttsCalls:Number(p.getProperty('HSK_VOCAB_TTS_CALLS')||0),asrCalls:Number(p.getProperty('HSK_VOCAB_ASR_CALLS')||0)};
 [2,3,4].forEach(function(level){var group=rows.filter(function(r){return Number(r[0])===level;});out.levels[level]={total:group.length,ready:group.filter(function(r){return r[3]==='READY';}).length,existing:group.filter(function(r){return r[3]==='EXISTING';}).length,review:group.filter(function(r){return r[3]==='REVIEW';}).length};});
 rows.forEach(function(r){if(r[3]==='READY')out.ready++;else if(r[3]==='EXISTING')out.existing++;else if(r[3]==='REVIEW')out.review++;else out.pending++;});
 var progress=hskVocabTable_(storage.sheet.getParent(),'Tien_do_tu_vung',['Mục','Giá trị']);
 progress.getRange(1,1,13,2).setValues([['Từ vựng HSK 2 → 3 → 4','Kiểm tra âm thanh + hai lượt ASR không có đáp án'],['Trạng thái',out.enabled?'Đang chạy':'Đang dừng'],['Tổng mục',out.total],['Mới tạo và đạt kiểm tra',out.ready],['Đã có sẵn trong kho',out.existing],['Cần kiểm tra',out.review],['Đang chờ',out.pending],['Lượt TTS',out.ttsCalls],['Lượt ASR',out.asrCalls],['HSK 2',JSON.stringify(out.levels[2])],['HSK 3',JSON.stringify(out.levels[3])],['HSK 4',JSON.stringify(out.levels[4])],['Lỗi / chờ',out.lastError+(out.retryAt?' | '+new Date(out.retryAt).toISOString():'')]]);
 return out;
}
function hskVocabStatus(){var storage=hskCheck_(hskSettings_()),tables=hskVocabTables_(storage);console.log(JSON.stringify(hskVocabSummary_(storage,tables)));}
function hskVocabPrepare(){
 var p=hskSettings_(),storage=hskCheck_(p),tables=hskVocabTables_(storage),corpus=hskVocabularyCorpus_();
 if(tables.queue.getLastRow()===1){
 var variants={};corpus.forEach(function(w){var pin=w.pinyin.normalize('NFC').replace(/\s+/g,'').toLowerCase();if(!variants[w.text])variants[w.text]=new Set();variants[w.text].add(pin);});
 var rows=corpus.map(function(w){return [w.level,w.text,w.pinyin,variants[w.text].size>1?'REVIEW':'PENDING',0,0,'','','','','',variants[w.text].size>1?'polyphonic_or_conflicting_pinyin_cache_key':'',new Date().toISOString(),'','','',''];});
 tables.queue.getRange(2,1,rows.length,17).setValues(rows);
 }
 if(!p.getProperty('HSK_VOCAB_BATCH_SIZE'))p.setProperty('HSK_VOCAB_BATCH_SIZE','10');
 if(!p.getProperty('HSK_VOCAB_PAUSE'))p.setProperty('HSK_VOCAB_PAUSE','3');
 console.log(JSON.stringify(hskVocabSummary_(storage,tables)));
}
function hskVocabStart(){
 hskVocabPrepare();var p=hskSettings_();
 if(p.getProperty('HSK_VOCAB_PILOT_REQUESTED')!=='true'){p.deleteProperty('HSK_VOCAB_PILOT_ONLY');p.deleteProperty('HSK_VOCAB_PILOT_ID');}
 p.setProperty('HSK_VOCAB_PREVIOUS_WARM_ENABLED',p.getProperty('HSK_WARM_ENABLED')||'false');p.setProperty('HSK_WARM_ENABLED','false');
 p.setProperty('HSK_VOCAB_ENABLED','true');p.setProperty('HSK_VOCAB_INITIAL_FAILURES','0');[2,10,11].forEach(function(slot){p.deleteProperty('HSK_VOCAB_PAIR_'+slot+'_'+model+'_AFTER');});p.deleteProperty('HSK_VOCAB_RETRY_AT');p.deleteProperty('HSK_VOCAB_ERROR');
 if(!ScriptApp.getProjectTriggers().some(function(t){return t.getHandlerFunction()==='hskVocabTick';}))ScriptApp.newTrigger('hskVocabTick').timeBased().everyMinutes(1).create();
 hskVocabTick();
}
function hskVocabStop(){hskSettings_().setProperty('HSK_VOCAB_ENABLED','false');ScriptApp.getProjectTriggers().filter(function(t){return t.getHandlerFunction()==='hskVocabTick';}).forEach(function(t){ScriptApp.deleteTrigger(t);});}
function hskVocabCall_(token,body){
 body=hskAsrPrepareBody_(body);
 var response=UrlFetchApp.fetch(HSK_VOCAB_URL_,{method:'post',contentType:'application/json',headers:{Authorization:'Bearer '+token},payload:JSON.stringify(body),muteHttpExceptions:true});
 var data;try{data=JSON.parse(response.getContentText());}catch(e){throw Error('response_uncertain');}
 if(response.getResponseCode()!==200||!data.ok){var error=Error(String(data.error||'provider_failure'));error.detail=data;throw error;}return data;
}
/** Require >=1.2s silence and agreement at multiple noise thresholds; pauses are measured, never presumed. */
function hskVocabRanges_(bytes,expected){
 var pcm=hskBatchPcm_(bytes),levels=[],peak=0;
 for(var i=0;i<pcm.length;i+=960){var end=Math.min(pcm.length,i+960),sum=0;for(var j=i;j<end;j+=2){var v=(pcm[j]&255)+(pcm[j+1]&255)*256;if(v>=32768)v-=65536;sum+=v*v;}var rms=Math.sqrt(sum/((end-i)/2))/32768;levels.push(rms);peak=Math.max(peak,rms);}
 if(peak<0.004)throw Error('vocab_silent_master');
 var matches=[];[0.012,0.02,0.03,0.035,0.04,0.045,0.05].forEach(function(ratio){var threshold=Math.max(0.002,peak*ratio),segments=[],begin=-1,last=-1;levels.forEach(function(rms,k){if(rms>threshold){if(begin<0)begin=k;last=k;}else if(begin>=0&&(k-last)*20>=1200){segments.push([begin*480,(last+1)*480]);begin=-1;}});if(begin>=0)segments.push([begin*480,Math.min(pcm.length/2,(last+1)*480)]);if(segments.length===expected&&segments.every(function(s){return s[1]-s[0]>=3600&&s[1]-s[0]<=192000;}))matches.push(segments);});
 if(matches.length<2)throw Error('vocab_pause_or_count_mismatch');
 var ranges=matches[0];if(matches.some(function(c){return c.some(function(s,i){return Math.abs(s[0]-ranges[i][0])>2400||Math.abs(s[1]-ranges[i][1])>2400;});}))throw Error('vocab_unstable_boundaries');
 var gaps=ranges.slice(1).map(function(s,i){return (s[0]-ranges[i][1])/24000;});
 return {ranges:ranges,duration:pcm.length/48000,minGap:gaps.length?Math.min.apply(null,gaps):null,maxGap:gaps.length?Math.max.apply(null,gaps):null};
}
function hskVocabTick(){
 var p=hskSettings_(),now=Date.now();
 if(typeof hskVoiceControlPoll_==='function'&&hskVoiceControlPoll_(p))return;
 if(p.getProperty('HSK_VOCAB_ENABLED')!=='true'||p.getProperty('HSK_VOICE_PAUSED')==='true'||Number(p.getProperty('HSK_VOCAB_RETRY_AT')||0)>now)return;
 var lock=LockService.getScriptLock();if(!lock.tryLock(100))return;var started=Date.now(),storage,tables;
 try{
 var win=Number(p.getProperty('HSK_VOCAB_WINDOW')||0);if(!win||now>=win+86400000){p.setProperty('HSK_VOCAB_WINDOW',String(now));p.setProperty('HSK_VOCAB_RUNTIME_MS','0');p.setProperty('HSK_VOCAB_WINDOW_CALLS','0');win=now;}
 if(Number(p.getProperty('HSK_VOCAB_RUNTIME_MS')||0)+300000>4500000||Number(p.getProperty('HSK_VOCAB_WINDOW_CALLS')||0)>=100){p.setProperty('HSK_VOCAB_RETRY_AT',String(win+86400000));p.setProperty('HSK_VOCAB_ERROR','daily_runtime_or_call_budget');return;}
 storage=hskCheck_(p);tables=hskVocabTables_(storage);var rows=hskVocabRows_(tables.queue,17),batches=hskVocabRows_(tables.batches,11),token=ScriptApp.getIdentityToken();
 if(p.getProperty('HSK_VOCAB_PILOT_ONLY')==='true'&&p.getProperty('HSK_VOCAB_PILOT_ID')){
  var trial=batches.find(function(b){return b[0]===p.getProperty('HSK_VOCAB_PILOT_ID');});
  if(trial&&['DONE','PARTIAL','REVIEW','REJECTED','UNCERTAIN'].indexOf(trial[3])>=0){hskVocabStop();return;}
 }
 var active=batches.findIndex(function(b){return ['MASTER','VERIFY','AUTO_VERIFY'].indexOf(b[3])>=0;});
 if(active>=0){
  if(p.getProperty('HSK_AUTO50_ENABLED')==='true'&&typeof hskAuto50VerifyTick_==='function')hskAuto50VerifyTick_(storage,tables,rows,batches,active,token,started);
  else hskVocabProcess_(storage,tables,rows,batches,active,token,started);
  return;
 }
 // A RESERVED request may already have produced audio: recover a named master, never resubmit blindly.
 var unresolved=batches.findIndex(function(b){return b[3]==='RESERVED'||b[3]==='UNCERTAIN';});
 if(unresolved>=0){var prior=batches[unresolved],files=storage.folder.getFilesByName('VOCAB_MASTER_'+prior[0]+'.wav');if(files.hasNext()){prior[2]=files.next().getId();prior[3]='MASTER';tables.batches.getRange(unresolved+2,1,1,11).setValues([prior]);return;}p.setProperty('HSK_VOCAB_ERROR','uncertain_batch_requires_review');hskVocabStop();return;}
 var existing=hskVocabRows_(storage.sheet,13),ready=new Map();existing.forEach(function(r){if(r[11]==='READY'&&r[4])ready.set(String(r[0]),r);});
 rows.forEach(function(r,i){if(['PENDING','RETRY'].indexOf(r[3])<0)return;var found=['gemini-2.5-flash-preview-tts','gemini-3.1-flash-tts-preview'].map(function(m){return ready.get(hskVocabKey_(m,r[1]));}).find(Boolean);if(found){r[3]='EXISTING';r[7]=found[3];r[9]=found[4];r[16]='https://drive.google.com/file/d/'+found[4]+'/view';hskVocabWrite_(tables.queue,i,r);}});
 var pending=rows.map(function(r,i){return {r:r,i:i};}).filter(function(x){return ['PENDING','RETRY'].indexOf(x.r[3])>=0&&Number(x.r[5]||0)<=now;});
 if(p.getProperty('HSK_AUTO50_ENABLED')==='true')pending=hskAuto50Choose_(pending);
 else pending.sort(function(a,b){return Number(a.r[0])-Number(b.r[0])||(String(a.r[1]).length<2?1:0)-(String(b.r[1]).length<2?1:0)||Number(a.r[4])-Number(b.r[4])||a.i-b.i;});
 if(!pending.length){var waiting=rows.some(function(r){return ['PENDING','RETRY'].indexOf(r[3])>=0;});if(!waiting)hskVocabStop();return;}
 var pair=hskShared50Pair_(token,now);
 if(!pair){p.setProperty('HSK_VOCAB_RETRY_AT',String(now+300000));p.setProperty('HSK_VOCAB_ERROR','tts_keys_cooling');return;}
 var slot=pair.slot,model=pair.model,size=Math.max(1,Math.min(90,Number(p.getProperty('HSK_VOCAB_BATCH_SIZE')||10))),seen=new Set(),jobs=[];
 pending.forEach(function(x){if(jobs.length>=size||seen.has(x.r[1]))return;seen.add(x.r[1]);jobs.push({row:x.i,text:x.r[1],pinyin:x.r[2],level:x.r[0],model:model,key:hskVocabKey_(model,x.r[1])});});
 var id=hskDigest_(JSON.stringify(jobs)+':'+now),pause=Number(p.getProperty('HSK_VOCAB_PAUSE')||3),batch=[id,JSON.stringify(jobs),'','RESERVED','',new Date().toISOString(),slot,model,pause,0,''];tables.batches.appendRow(batch);var number=tables.batches.getLastRow();
 if(p.getProperty('HSK_VOCAB_PILOT_ONLY')==='true')p.setProperty('HSK_VOCAB_PILOT_ID',id);
 SpreadsheetApp.flush();
 p.setProperty('HSK_VOCAB_NEXT_SLOT',String((slot+1)%13));p.setProperty('HSK_VOCAB_NEXT_MODEL',String((pair.mi+1)%2));
 try{
 var response=UrlFetchApp.fetch(HSK_VOCAB_URL_,{method:'post',contentType:'application/json',headers:{Authorization:'Bearer '+token},payload:JSON.stringify(p.getProperty('HSK_SHARED50_LITERAL')==='true'&&(p.getProperty('HSK_VOCAB_PILOT_ONLY')==='true'||p.getProperty('HSK_AUTO50_ENABLED')==='true')&&Array.from(jobs.map(function(j){return j.text;}).join('。')).length<=220?{text:jobs.map(function(j){return j.text;}).join('。'),isolated:true,keySlot:slot,model:model,language:'zh-CN'}:{items:jobs.map(function(j){return j.text;}),isolated:true,keySlot:slot,model:model,language:'zh-CN',pauseSeconds:pause}),muteHttpExceptions:true});
 var decoded=hskParallelDecode_(response);p.setProperty('HSK_VOCAB_TTS_CALLS',String(Number(p.getProperty('HSK_VOCAB_TTS_CALLS')||0)+decoded.providerAttempts));p.setProperty('HSK_VOCAB_WINDOW_CALLS',String(Number(p.getProperty('HSK_VOCAB_WINDOW_CALLS')||0)+decoded.providerAttempts));
 var file=storage.folder.createFile(Utilities.newBlob(decoded.bytes,'audio/wav','VOCAB_MASTER_'+id+'.wav'));batch[2]=file.getId();batch[3]='MASTER';tables.batches.getRange(number,1,1,11).setValues([batch]);
 jobs.forEach(function(j){var r=rows[j.row];r[3]='MASTER';r[4]=Number(r[4])+1;r[6]=id;r[7]=model;r[8]=file.getId();r[11]='';hskVocabWrite_(tables.queue,j.row,r);});
 p.setProperty('HSK_VOCAB_INITIAL_FAILURES','0');p.deleteProperty('HSK_VOCAB_ERROR');p.deleteProperty('HSK_VOCAB_RETRY_AT');console.log(JSON.stringify({stage:'master_saved',items:jobs.length,slot:slot,model:model,pauseSeconds:pause,bytes:decoded.bytes.length}));
 }catch(e){if(e.diagnostic)p.setProperty('HSK_VOCAB_LAST_DIAGNOSTIC',JSON.stringify(e.diagnostic));var reason=String(e.message||'transport_uncertain'),definite=/tts_(blocked|request_rejected|generation_incomplete|key_invalid|permission_denied|daily_limit|rate_limited|quota_unavailable|model_unavailable|region_unavailable)/.test(reason);batch[3]=definite?'REJECTED':'UNCERTAIN';batch[4]=reason;tables.batches.getRange(number,1,1,11).setValues([batch]);p.setProperty('HSK_VOCAB_TTS_CALLS',String(Number(p.getProperty('HSK_VOCAB_TTS_CALLS')||0)+(e.providerAttempts||0)));p.setProperty('HSK_VOCAB_WINDOW_CALLS',String(Number(p.getProperty('HSK_VOCAB_WINDOW_CALLS')||0)+(e.providerAttempts||0)));p.setProperty('HSK_VOCAB_PAIR_'+slot+'_'+model+'_AFTER',String(now+Math.max(300,Number(e.retryAfter)||300)*1000));p.setProperty('HSK_VOCAB_ERROR',reason);var failures=Number(p.getProperty('HSK_VOCAB_INITIAL_FAILURES')||0)+1;p.setProperty('HSK_VOCAB_INITIAL_FAILURES',String(failures));if(p.getProperty('HSK_AUTO50_ENABLED')==='true'){
 if(!definite)hskVocabStop();
 else if(failures>=3){p.setProperty('HSK_VOCAB_RETRY_AT',String(now+1800000));p.setProperty('HSK_VOCAB_INITIAL_FAILURES','0');}
}else if(!definite||failures>=3&&p.getProperty('HSK_VOCAB_PILOT_PASSED')!=='true')hskVocabStop();}
 }catch(e){p.setProperty('HSK_VOCAB_ERROR',String(e.message||'vocab_error').replace(/[^a-z0-9_]/gi,'_').slice(0,120));p.setProperty('HSK_VOCAB_RETRY_AT',String(Date.now()+90000));}
 finally{p.setProperty('HSK_VOCAB_RUNTIME_MS',String(Number(p.getProperty('HSK_VOCAB_RUNTIME_MS')||0)+Date.now()-started));if(storage&&tables)console.log(JSON.stringify(hskVocabSummary_(storage,tables)));lock.releaseLock();}
}
function hskVocabProcess_(storage,tables,rows,batches,index,token,started){
 var p=hskSettings_(),batch=batches[index],jobs=JSON.parse(batch[1]),master=DriveApp.getFileById(batch[2]).getBlob().getBytes(),report;
 try{report=batch[10]?JSON.parse(batch[10]):hskVocabRanges_(master,jobs.length);}catch(e){batch[3]='REVIEW';batch[4]=String(e.message);tables.batches.getRange(index+2,1,1,11).setValues([batch]);jobs.forEach(function(j){var r=rows[j.row];r[3]=Number(r[4])<3?'RETRY':'REVIEW';r[5]=Date.now()+300000;r[11]=String(e.message);hskVocabWrite_(tables.queue,j.row,r);});p.setProperty('HSK_VOCAB_BATCH_SIZE',String(p.getProperty('HSK_VOCAB_FIXED_BATCH')==='true'?50:Math.max(3,Math.floor(jobs.length/2))));p.setProperty('HSK_VOCAB_ERROR',String(e.message));if(p.getProperty('HSK_VOCAB_PILOT_PASSED')!=='true')hskVocabStop();return;}
 batch[3]='VERIFY';batch[9]=report.duration;batch[10]=JSON.stringify(report);tables.batches.getRange(index+2,1,1,11).setValues([batch]);
 // Recover interruptions between saving the master journal and checkpointing its queue rows.
 jobs.forEach(function(j){var r=rows[j.row];if(['READY','EXISTING'].indexOf(r[3])<0&&r[6]!==batch[0]){r[3]='MASTER';r[4]=Number(r[4])+1;r[6]=batch[0];r[7]=j.model;r[8]=batch[2];hskVocabWrite_(tables.queue,j.row,r);}});
 var pcm=hskBatchPcm_(master),done=0,passed=0,failed=0;
 while(Date.now()-started<210000&&done<20){
 var part=jobs.map(function(j,i){return {job:j,clipIndex:i};}).filter(function(x){return ['MASTER','CHECK_AGAIN'].indexOf(rows[x.job.row][3])>=0;}).slice(0,5);if(!part.length)break;
 var clips=part.map(function(x){var s=report.ranges[x.clipIndex];return Utilities.base64Encode(hskWav_(pcm.slice(Math.max(0,s[0]-2880)*2,Math.min(pcm.length/2,s[1]+4800)*2),'audio/l16'));});
 // Keep the private verifier body within its byte budget; fewer clips do not regenerate TTS.
 while(clips.reduce(function(n,c){return n+c.length;},0)>640000&&part.length>1){part.pop();clips.pop();}
 var verified;try{p.setProperty('HSK_VOCAB_ASR_CALLS',String(Number(p.getProperty('HSK_VOCAB_ASR_CALLS')||0)+2));verified=hskVocabCall_(token,{action:'verify-words',keySlot:batch[6],items:part.map(function(x){return x.job.text;}),pinyin:part.map(function(x){return x.job.pinyin;}),clips:clips});}catch(e){p.setProperty('HSK_VOCAB_LAST_ASR_DIAGNOSTIC',JSON.stringify(e.detail||{error:String(e.message)}));console.log(JSON.stringify({stage:'asr_error',detail:e.detail||{error:String(e.message)}}));p.setProperty('HSK_VOCAB_ERROR',String(e.message));p.setProperty('HSK_VOCAB_RETRY_AT',String(Date.now()+300000));return;}
 if(verified.verification!=='double_asr_exact'||!Array.isArray(verified.verified)||verified.verified.length!==part.length)throw Error('invalid_verifier_result');
 part.forEach(function(x,i){var j=x.job,r=rows[j.row],s=report.ranges[x.clipIndex];r[10]=JSON.stringify(verified.transcripts.map(function(pass){return pass[i];}));r[13]=JSON.stringify(verified.pinyin.map(function(pass){return pass[i];}));r[14]=Math.round(s[0]/24);r[15]=Math.round(s[1]/24);
 if(verified.verified[i]===true){
 var duplicate=['gemini-2.5-flash-preview-tts','gemini-3.1-flash-tts-preview'].map(function(m){return hskGetRow_(storage.sheet,hskVocabKey_(m,j.text));}).find(function(x){return x&&x.values[11]==='READY'&&x.values[4];});
 var found=duplicate||hskGetRow_(storage.sheet,j.key),old=found&&found.values,fileId=old&&old[11]==='READY'?old[4]:null;
 if(!fileId){var name='hsk-tts-'+j.key.slice(0,24)+'.wav',files=storage.folder.getFilesByName(name),file=files.hasNext()?files.next():storage.folder.createFile(Utilities.newBlob(Utilities.base64Decode(clips[i]),'audio/wav',name));fileId=file.getId();var stamp=new Date().toISOString(),entry=[j.key,'zh-CN','Kore',j.model,fileId,'audio/wav',Utilities.base64Decode(clips[i]).length,stamp,stamp,0,batch[6],'READY','vocabulary_double_asr_exact:'+batch[0]];if(found)storage.sheet.getRange(found.index,1,1,13).setValues([entry]);else storage.sheet.appendRow(entry);}
 r[3]=duplicate?'EXISTING':'READY';if(duplicate)r[7]=old[3];r[9]=fileId;r[16]='https://drive.google.com/file/d/'+fileId+'/view';r[11]='';passed++;
 }else{var previous=Number((String(r[11]).match(/^asr_check_(\d+)$/)||[])[1]||0),checks=previous+1;
  if(checks<3){r[3]='CHECK_AGAIN';r[11]='asr_check_'+checks;}
  else{r[3]=Number(r[4])<3?'RETRY':'REVIEW';r[5]=Date.now()+900000;r[11]='asr_no_consensus_after_3_checks';failed++;}
 }
 hskVocabWrite_(tables.queue,j.row,r);done++;
 });
 }
 if(!jobs.some(function(j){return ['MASTER','CHECK_AGAIN'].indexOf(rows[j.row][3])>=0;})){
 batch[3]=jobs.every(function(j){return ['READY','EXISTING'].indexOf(rows[j.row][3])>=0;})?'DONE':'PARTIAL';tables.batches.getRange(index+2,1,1,11).setValues([batch]);
 if(batch[3]==='DONE'&&p.getProperty('HSK_VOCAB_FIXED_BATCH')!=='true')p.setProperty('HSK_VOCAB_BATCH_SIZE',String(Math.min(90,jobs.length<20?30:jobs.length<60?60:90,Math.max(3,Math.floor(360/(report.duration/jobs.length))))));
 }
 if(passed)p.setProperty('HSK_VOCAB_PILOT_PASSED','true');p.deleteProperty('HSK_VOCAB_RETRY_AT');p.deleteProperty('HSK_VOCAB_ERROR');console.log(JSON.stringify({stage:'checked_and_saved',checked:done,passed:passed,retry:failed,masterSeconds:report.duration,minGap:report.minGap,maxGap:report.maxGap,batchState:batch[3]}));
}

function hskVocabInspect(){var p=hskSettings_(),storage=hskCheck_(p),tables=hskVocabTables_(storage);console.log(JSON.stringify({status:hskVocabSummary_(storage,tables),diagnostic:p.getProperty("HSK_VOCAB_LAST_DIAGNOSTIC")||"",asrDiagnostic:p.getProperty("HSK_VOCAB_LAST_ASR_DIAGNOSTIC")||"",batches:hskVocabRows_(tables.batches,11).slice(-4).map(function(b){return {state:b[3],error:b[4],slot:b[6],model:b[7],duration:b[9],gaps:b[10]?JSON.parse(b[10]).minGap:null,items:JSON.parse(b[1]).length};}),sheetUrl:storage.sheet.getParent().getUrl(),folderUrl:storage.folder.getUrl()}));}

function hskVocabRetryCheck(){hskSettings_().deleteProperty("HSK_VOCAB_RETRY_AT");hskVocabTick();}
