/** One full TTS master -> normalized silence -> clips -> blind double ASR -> Gemini text judge -> durable save. */
var HSK_FULL50_VERSION_='full50-gemini-judge-v1';
function hskFull50Info_(b){try{return JSON.parse(b[10]||'{}');}catch(e){return {};}}
function hskFull50Active_(b){return /^FULL50_/.test(String(b[3]||''));}
function hskFull50Write_(tables,batches,i,b,info){b[10]=JSON.stringify(info);tables.batches.getRange(i+2,1,1,11).setValues([b]);batches[i]=b;}
function hskFull50File_(folder,name){var f=folder.getFilesByName(name);return f.hasNext()?f.next():null;}
function hskFull50Failed_(p,job,master,row){
 var key='HSK_FULL50_FAIL_'+hskDigest_(job.text+'|'+job.pinyin),state=hskStableRead_(p,key,{count:0});
 if(state.master!==master){state.count=Number(state.count||0)+1;state.master=master;p.setProperty(key,JSON.stringify(state));}
 row[3]=state.count>=3?'REVIEW':'RETRY';row[5]=0;
}
function hskFull50Create_(p,storage,tables,rows,batches){
 var stage=p.getProperty('HSK_FAST_PHASE_STAGE')||'234',levels=hskFastPhaseLevels_(stage);
 var group=rows.map(function(r,i){return {r:r,i:i};}).filter(function(x){return levels.indexOf(Number(x.r[0]))>=0;});
 if(storage.sheet&&typeof hskVocabRows_==='function'){
  var cached={};hskVocabRows_(storage.sheet,13).forEach(function(r){if(r[11]==='READY'&&r[4])cached[String(r[0])]=r;});
  group.forEach(function(x){var r=x.r;if(['PENDING','RETRY'].indexOf(r[3])<0)return;
   var found=hskVoiceTtsModels_().map(function(m){return cached[hskFastPhaseKey_(m,r[1],r[2],r[0])];}).find(Boolean);
   if(found){r[3]='EXISTING';r[7]=found[3];r[9]=found[4];r[16]='https://drive.google.com/file/d/'+found[4]+'/view';hskVocabWrite_(tables.queue,x.i,r);}
  });
 }
 var missing=group.filter(function(x){return !hskStableDone_(x.r);});
 var pending=hskAuto50Choose_(missing.filter(function(x){return ['PENDING','RETRY'].indexOf(x.r[3])>=0&&Number(x.r[5]||0)<=Date.now();}));
 if(!pending.length){if(!missing.length)hskFastPhaseOnEmpty_(p,storage,tables,rows);return;}
 // Never pad a short tail with already certified audio or mix HSK stages.
 var tail=missing.length<50;if(!tail&&pending.length<50){p.setProperty('HSK_FULL50_STATUS','WAIT_FOR_50_ELIGIBLE_'+pending.length);return;}
 var jobs=pending.slice(0,50).map(function(x){return {row:x.i,text:x.r[1],pinyin:x.r[2],level:x.r[0]};});
 var id=hskDigest_('full50:'+Date.now()+':'+JSON.stringify(jobs)),info={mode:'full50_v1',tail:tail,stage:stage,attempts:0,version:HSK_FULL50_VERSION_};
 var b=[id,JSON.stringify(jobs),'','FULL50_TTS','WAIT_FULL_MASTER',hskVNTime_(new Date()),0,'',1.2,0,JSON.stringify(info)];
 tables.batches.appendRow(b);batches.push(b);
 jobs.forEach(function(j){var r=rows[j.row];if(hskStableDone_(r))return;r[3]='FULL50';r[6]=id;r[11]='';hskVocabWrite_(tables.queue,j.row,r);});
 p.setProperty('HSK_FULL50_STATUS','TTS_'+jobs.length);p.setProperty('HSK_FULL50_POLICY',HSK_FULL50_VERSION_);
}
function hskFull50Fail_(p,storage,tables,rows,batches,i,b,info,reason){
 var jobs=JSON.parse(b[1]);jobs.forEach(function(j){var r=rows[j.row];if(hskStableDone_(r))return;
  if(/tts_blocked|permission_denied|invalid_request|invalid_text/.test(reason))r[3]='REVIEW';else hskFull50Failed_(p,j,b[2]||b[0],r);r[11]=String(reason).slice(0,140);hskVocabWrite_(tables.queue,j.row,r);
 });b[3]='REVIEW';b[4]=String(reason).slice(0,140);hskFull50Write_(tables,batches,i,b,info);p.setProperty('HSK_FULL50_STATUS',b[4]);
}
function hskFull50Synthesize_(p,storage,tables,rows,batches,i,b,info,token){
 var name='FULL50_RAW_'+b[0]+'.wav',saved=hskFull50File_(storage.folder,name),jobs=JSON.parse(b[1]);
 if(saved){b[2]=saved.getId();b[3]='FULL50_SEGMENT';b[4]='FULL_MASTER_SAVED_'+jobs.length;hskFull50Write_(tables,batches,i,b,info);return;}
 if(b[3]==='FULL50_GENERATING'||b[3]==='FULL50_UNCERTAIN'){
  b[3]='FULL50_UNCERTAIN';b[4]='CHECK_SAVED_MASTER_NO_DUPLICATE_TTS';hskFull50Write_(tables,batches,i,b,info);return;
 }
 if(Number(info.retryAt||0)>Date.now())return;
 var pair=hskStableTtsPair_(p,token,Date.now());if(!pair){info.retryAt=Date.now()+60000;b[4]='WAIT_PROVIDER_QUOTA';hskFull50Write_(tables,batches,i,b,info);return;}
 b[6]=pair.slot;b[7]=pair.model;
 jobs.forEach(function(j){j.slot=pair.slot;j.model=pair.model;j.key=hskFastPhaseKey_(j.model,j.text,j.pinyin,j.level);});b[1]=JSON.stringify(jobs);
 b[3]='FULL50_GENERATING';b[4]='GENERATING_ONE_MASTER_'+jobs.length+'_KEY_'+pair.slot;hskFull50Write_(tables,batches,i,b,info);SpreadsheetApp.flush();
 var started=Date.now(),decoded;
 try{
  var response=UrlFetchApp.fetch(HSK_VOCAB_URL_,{method:'post',contentType:'application/json',headers:{Authorization:'Bearer '+token},payload:JSON.stringify({items:jobs.map(function(j){return hskCongestionSpeech_(j.text);}),pronunciations:jobs.map(hskCongestionThirdPin_),isolated:true,dictionaryStyle:true,batch50:true,tail:info.tail,keySlot:pair.slot,model:pair.model,language:'zh-CN'}),muteHttpExceptions:true});
  decoded=hskParallelDecode_(response);
 }catch(e){
  var reason=String(e.message||e),uncertain=/uncertain|invalid_tts_response/.test(reason);
  p.setProperty('HSK_VOCAB_TTS_CALLS',String(Number(p.getProperty('HSK_VOCAB_TTS_CALLS')||0)+Number(e.providerAttempts||0)));
  if(typeof hskCongestionMetric_==='function')hskCongestionMetric_(p,'TTS',started,reason);
  p.setProperty('HSK_VOCAB_ERROR',reason.slice(0,140));
  if(uncertain){b[3]='FULL50_UNCERTAIN';b[4]=reason;}
  else if(hskStableTtsUnavailable_(reason)){
   p.setProperty('HSK_VOCAB_PAIR_'+pair.slot+'_'+pair.model+'_AFTER',String(Date.now()+Math.max(60000,Number(e.retryAfter||60)*1000)));
   b[3]='FULL50_TTS';b[4]='PROVIDER_UNAVAILABLE_KEEP_ALL_'+jobs.length;info.retryAt=Date.now()+10000;
  }else if(/tts_blocked|permission_denied|invalid_request|invalid_text/.test(reason)){
   return hskFull50Fail_(p,storage,tables,rows,batches,i,b,info,reason);
  }else{
   info.attempts=Number(info.attempts||0)+1;if(info.attempts>=3)return hskFull50Fail_(p,storage,tables,rows,batches,i,b,info,reason);
   b[3]='FULL50_TTS';b[4]='RETRY_SAME_FULL_MASTER_'+info.attempts;info.retryAt=Date.now()+60000;
  }
  hskFull50Write_(tables,batches,i,b,info);return;
 }
 p.setProperty('HSK_VOCAB_TTS_CALLS',String(Number(p.getProperty('HSK_VOCAB_TTS_CALLS')||0)+decoded.providerAttempts));
 if(typeof hskCongestionMetric_==='function')hskCongestionMetric_(p,'TTS',started,'ok_full50');
 try{saved=hskFull50File_(storage.folder,name)||storage.folder.createFile(Utilities.newBlob(decoded.bytes,'audio/wav',name));}
 catch(e){b[3]='FULL50_UNCERTAIN';b[4]='DRIVE_SAVE_UNCERTAIN_NO_REGEN';hskFull50Write_(tables,batches,i,b,info);return;}
 hskStableTtsSuccess_(p,pair.model,pair.slot);p.deleteProperty('HSK_VOCAB_ERROR');
 b[2]=saved.getId();info.rawId=b[2];info.rawBytes=decoded.bytes.length;info.ttsMs=Date.now()-started;b[3]='FULL50_SEGMENT';b[4]='FULL_MASTER_SAVED_'+jobs.length;hskFull50Write_(tables,batches,i,b,info);
}
/** Locate speech in the full master; normalize every inter-word gap to exactly 1.2 seconds before final slicing. */
function hskFull50Normalize_(master,count){
 var detected=hskAuto50Detect_(master,count);if(detected.ranges.length!==count)throw Error('full50_segment_count_'+detected.ranges.length+'_expected_'+count);
 var pcm=hskBatchPcm_(master),ranges=[],pieces=[],position=0,gap=Array(57600).fill(0);
 detected.ranges.forEach(function(r,i){
  var from=Math.max(0,r[0]-1920),to=Math.min(pcm.length/2,r[1]+1920);
  if(i&&from<detected.ranges[i-1][1]+1920)from=Math.max(r[0],detected.ranges[i-1][1]+1920);
  var part=pcm.slice(from*2,to*2);ranges.push([position/2,(position+part.length)/2]);pieces.push(part);position+=part.length;
  if(i<count-1){pieces.push(gap);position+=gap.length;}
 });
 if(position>12000000)throw Error('full50_normalized_master_too_large');
 var out=Array(position),at=0;pieces.forEach(function(part){for(var j=0;j<part.length;j++)out[at++]=part[j];});
 return {bytes:hskWav_(out,'audio/l16'),ranges:ranges,duration:position/48000,gap:1.2};
}
function hskFull50Segment_(p,storage,tables,rows,batches,i,b,info){
 var segmentStart=Date.now();
 var jobs=JSON.parse(b[1]),raw=DriveApp.getFileById(info.rawId||b[2]).getBlob().getBytes(),normalized;
 try{normalized=hskFull50Normalize_(raw,jobs.length);}catch(e){return hskFull50Fail_(p,storage,tables,rows,batches,i,b,info,String(e.message||e));}
 var name='FULL50_MASTER_'+b[0]+'.wav',file=hskFull50File_(storage.folder,name)||storage.folder.createFile(Utilities.newBlob(normalized.bytes,'audio/wav',name));
 b[2]=file.getId();b[9]=normalized.duration;info.ranges=normalized.ranges;info.gap=1.2;
 var sheet=hskAuto50Sheet_(storage),all=hskVocabRows_(sheet,15),existing=all.filter(function(r){return r[0]===b[0];});
 if(!existing.length){var entries=info.ranges.map(function(r,n){return [b[0],n+1,Math.round(r[0]/24),Math.round(r[1]/24),'PENDING',0,'','','','',0,'','','',hskVNTime_(new Date())];});sheet.getRange(sheet.getLastRow()+1,1,entries.length,15).setValues(entries);}
 info.segmentMs=Date.now()-segmentStart;b[3]='FULL50_ASR';b[4]='SILENCE_1_2S_AND_'+jobs.length+'_CLIPS_READY';hskFull50Write_(tables,batches,i,b,info);
}
function hskFull50ClipBytes_(pcm,r){var start=Math.max(0,Math.round(Number(r[2])*24)),end=Math.min(pcm.length/2,Math.round(Number(r[3])*24));return hskWav_(pcm.slice(start*2,end*2),'audio/l16');}
function hskFull50Asr_(p,storage,tables,rows,batches,i,b,info,token,started){
 var sheet=hskAuto50Sheet_(storage),all=hskVocabRows_(sheet,15),entries=all.filter(function(r){return r[0]===b[0];}),jobs=JSON.parse(b[1]);
 var pcm=hskBatchPcm_(DriveApp.getFileById(b[2]).getBlob().getBytes());
 for(var round=0;round<5&&Date.now()-started<90000;round++){
  var candidates=entries.filter(function(r){return ['PENDING','RECHECK'].indexOf(r[4])>=0;}),pending=[];
  candidates.forEach(function(r){if(pending.length>=5)return;var clip=Utilities.base64Encode(hskFull50ClipBytes_(pcm,r));if(clip.length>350000){r[4]='REVIEW';r[13]='clip_too_large';sheet.getRange(all.indexOf(r)+2,1,1,15).setValues([r]);}else pending.push({r:r,clip:clip});});
  if(!pending.length){if(!candidates.length||entries.every(function(r){return ['PENDING','RECHECK'].indexOf(r[4])<0;})){b[3]='FULL50_JUDGE';b[4]='BLIND_DOUBLE_ASR_COMPLETE';hskFull50Write_(tables,batches,i,b,info);}return;}
  var pick=hskStableAsrSlot_(p,Date.now());if(!pick.slot){info.retryAt=pick.retryAt;hskFull50Write_(tables,batches,i,b,info);return;}
  var decoded,asrStart=Date.now();
  try{
   decoded=hskVocabCall_(token,{action:'verify-words',keySlot:pick.slot,items:pending.map(function(x){return jobs[Number(x.r[1])-1].text;}),pinyin:pending.map(function(x){return jobs[Number(x.r[1])-1].pinyin;}),clips:pending.map(function(x){return x.clip;})});
   if(!decoded.transcripts||decoded.transcripts.length!==2||!decoded.pinyin||decoded.pinyin.length!==2||decoded.transcripts.some(function(a){return !Array.isArray(a)||a.length!==pending.length;})||decoded.pinyin.some(function(a){return !Array.isArray(a)||a.length!==pending.length;}))throw Error('asr_invalid_response');
  }catch(e){
   var reason=String(e.message||e);hskStableAsrError_(p,pick.slot,e.detail||{},reason);
   if(/asr_unverified_audio|asr_invalid_response/.test(reason))pending.forEach(function(x){x.r[5]=Number(x.r[5]||0)+1;x.r[4]=x.r[5]>=3?'REVIEW':'RECHECK';x.r[13]=reason;sheet.getRange(all.indexOf(x.r)+2,1,1,15).setValues([x.r]);});
   else{info.retryAt=Date.now()+60000;b[4]='WAIT_ASR_PROVIDER_KEY_'+pick.slot;hskFull50Write_(tables,batches,i,b,info);}
   p.setProperty('HSK_VOCAB_ERROR',reason.slice(0,140));return;
  }finally{info.asrMs=Number(info.asrMs||0)+Date.now()-asrStart;if(typeof hskCongestionMetric_==='function')hskCongestionMetric_(p,'ASR',asrStart,decoded?'ok_full50':'provider_or_response_error');}
  p.setProperty('HSK_VOCAB_ASR_CALLS',String(Number(p.getProperty('HSK_VOCAB_ASR_CALLS')||0)+2));
  pending.forEach(function(x,n){var r=x.r;r[4]='RECOGNIZED';r[5]=Number(r[5]||0)+1;r[6]=String(decoded.transcripts[0][n]||'');r[7]=String(decoded.transcripts[1][n]||'');r[8]=String(decoded.pinyin[0][n]||'');r[9]=String(decoded.pinyin[1][n]||'');r[13]='BLIND_ASR_KEY_'+pick.slot;r[14]=hskVNTime_(new Date());sheet.getRange(all.indexOf(r)+2,1,1,15).setValues([r]);});
  b[4]='RECOGNIZED_'+entries.filter(function(r){return ['PENDING','RECHECK'].indexOf(r[4])<0;}).length+'_OF_'+jobs.length;hskFull50Write_(tables,batches,i,b,info);p.deleteProperty('HSK_VOCAB_ERROR');
 }
 if(entries.every(function(r){return ['PENDING','RECHECK'].indexOf(r[4])<0;})){b[3]='FULL50_JUDGE';b[4]='BLIND_DOUBLE_ASR_COMPLETE';hskFull50Write_(tables,batches,i,b,info);}
}
/** The model judges word/reading compatibility. Code validates identity, uniqueness, evidence and I/O only. */
function hskFull50ValidateJudgment_(data,jobs,entries){
 if(!data||!Array.isArray(data.decisions)||data.decisions.length!==entries.length)throw Error('judge_invalid_count');
 var seen={},assigned={};data.decisions.forEach(function(d){
  if(!Number.isInteger(d.clip)||d.clip<1||d.clip>entries.length||seen[d.clip]||['PASS','RETRY','REVIEW'].indexOf(d.verdict)<0||typeof d.reason!=='string'||d.reason.length>240)throw Error('judge_invalid_decision');seen[d.clip]=true;
  if(d.verdict==='PASS'){
   var r=entries.find(function(x){return Number(x[1])===d.clip;});
   if(!Number.isInteger(d.target)||d.target<1||d.target>jobs.length||assigned[d.target]||!r||r[4]!=='RECOGNIZED'||![r[6],r[7],r[8],r[9]].every(function(x){return typeof x==='string'&&x.trim();}))throw Error('judge_pass_without_unique_evidence');
   assigned[d.target]=true;
  }
 });return data.decisions;
}
function hskFull50Judge_(p,storage,tables,rows,batches,i,b,info,token){
 var judgeStart=Date.now();
 var sheet=hskAuto50Sheet_(storage),entries=hskVocabRows_(sheet,15).filter(function(r){return r[0]===b[0];}),jobs=JSON.parse(b[1]),name='FULL50_JUDGE_'+b[0]+'.json',saved=hskFull50File_(storage.folder,name),decoded;
 if(saved)decoded=JSON.parse(saved.getBlob().getDataAsString());
 else{
  var pick=hskStableAsrSlot_(p,Date.now());if(!pick.slot){info.retryAt=pick.retryAt;hskFull50Write_(tables,batches,i,b,info);return;}
  try{decoded=hskVocabCall_(token,{action:'judge-50',keySlot:pick.slot,references:jobs.map(function(j,n){return {id:n+1,text:j.text,pinyin:j.pinyin};}),evidence:entries.map(function(r){return {clip:Number(r[1]),hanzi:[String(r[6]||''),String(r[7]||'')],pinyin:[String(r[8]||''),String(r[9]||'')]};})});hskFull50ValidateJudgment_(decoded,jobs,entries);}
  catch(e){var reason=String(e.message||e);hskStableAsrError_(p,pick.slot,e.detail||{},reason);
   if(/judge_invalid|judge_pass_without/.test(reason)){info.judgeFailures=Number(info.judgeFailures||0)+1;if(info.judgeFailures>=3)return hskFull50Fail_(p,storage,tables,rows,batches,i,b,info,reason);}
   info.retryAt=Date.now()+60000;b[4]='WAIT_GEMINI_TEXT_JUDGE_'+reason.slice(0,80);hskFull50Write_(tables,batches,i,b,info);return;}
  saved=storage.folder.createFile(Utilities.newBlob(JSON.stringify(decoded),'application/json',name));
 }
 hskFull50ValidateJudgment_(decoded,jobs,entries);info.judgeMs=Date.now()-judgeStart;info.judgeId=saved.getId();b[3]='FULL50_SAVE';b[4]='GEMINI_JUDGED_'+decoded.decisions.filter(function(d){return d.verdict==='PASS';}).length+'_OF_'+jobs.length;hskFull50Write_(tables,batches,i,b,info);
}
/** Read cache once, append new metadata in one bounded write; existing READY entries stay immutable. */
function hskFull50CacheWriter_(storage){
 var byKey={},pending=[];hskVocabRows_(storage.sheet,13).forEach(function(r,i){byKey[String(r[0])]={row:i+2,values:r};});
 return {save:function(job,bytes,batch){
  var hit=hskVoiceTtsModels_().map(function(m){return byKey[hskFastPhaseKey_(m,job.text,job.pinyin,job.level)];}).find(function(x){return x&&x.values[11]==='READY'&&x.values[4];});
  if(hit)return {file:String(hit.values[4]),model:String(hit.values[3]),existing:true};
  var key=hskFastPhaseKey_(job.model,job.text,job.pinyin,job.level),old=byKey[key],name='hsk-tts-'+key.slice(0,24)+'.wav';
  var file=hskFull50File_(storage.folder,name)||storage.folder.createFile(Utilities.newBlob(bytes,'audio/wav',name)),stamp=hskVNTime_(new Date());
  var entry=[key,'zh-CN','Kore',job.model,file.getId(),'audio/wav',bytes.length,stamp,stamp,0,Number(job.slot),'READY','full50_blind_asr_gemini_judge:'+batch];
  if(old&&old.row)storage.sheet.getRange(old.row,1,1,13).setValues([entry]);else pending.push(entry);
  byKey[key]={values:entry};return {file:file.getId(),model:job.model,existing:false};
 },flush:function(){if(pending.length){storage.sheet.getRange(storage.sheet.getLastRow()+1,1,pending.length,13).setValues(pending);pending=[];}}};
}
function hskFull50Save_(p,storage,tables,rows,batches,i,b,info,runtime){
 runtime=runtime||{};
 if(!runtime.save){var sheet=hskAuto50Sheet_(storage),all=hskVocabRows_(sheet,15);runtime.save={sheet:sheet,all:all,entries:all.filter(function(r){return r[0]===b[0];}),result:JSON.parse(DriveApp.getFileById(info.judgeId).getBlob().getDataAsString()),pcm:hskBatchPcm_(DriveApp.getFileById(b[2]).getBlob().getBytes()),writer:hskFull50CacheWriter_(storage)};}
 var state=runtime.save,sheet=state.sheet,all=state.all,entries=state.entries,jobs=JSON.parse(b[1]),decisions=state.result.decisions,pcm=state.pcm,updates=0;
 decisions.forEach(function(d){
  var r=entries.find(function(x){return Number(x[1])===d.clip;});if(updates>=10||['READY','EXISTING','JUDGE_RETRY','JUDGE_REVIEW'].indexOf(r[4])>=0)return;
  if(d.verdict==='PASS'){
   var j=jobs[d.target-1],q=rows[j.row];if(q[1]!==j.text||q[2]!==j.pinyin)throw Error('full50_source_identity_changed');
   var audio=hskFull50ClipBytes_(pcm,r),saved=state.writer.save(j,audio,b[0]);
   if(!hskStableDone_(q)){q[3]=saved.existing?'EXISTING':'READY';q[5]=0;q[6]=b[0];q[7]=saved.model;q[8]=b[2];q[9]=saved.file;q[10]=JSON.stringify([r[6],r[7]]);q[11]='gemini_text_judge:'+d.reason;q[13]=JSON.stringify([r[8],r[9]]);q[14]=r[2];q[15]=r[3];q[16]='https://drive.google.com/file/d/'+saved.file+'/view';hskVocabWrite_(tables.queue,j.row,q);}
   r[4]=saved.existing?'EXISTING':'READY';r[10]=j.row+2;r[11]=j.text;r[12]=saved.file;
  }else r[4]=d.verdict==='REVIEW'?'JUDGE_REVIEW':'JUDGE_RETRY';
  r[13]=d.reason;r[14]=hskVNTime_(new Date());updates++;
 });
 state.writer.flush();
 // FULL50 clip rows were appended contiguously under the same script lock.
 if(updates)sheet.getRange(all.indexOf(entries[0])+2,1,entries.length,15).setValues(entries);
 var left=entries.some(function(r){return ['READY','EXISTING','JUDGE_RETRY','JUDGE_REVIEW'].indexOf(r[4])<0;});
 b[4]='SAVED_'+entries.filter(function(r){return ['READY','EXISTING'].indexOf(r[4])>=0;}).length+'_OF_'+jobs.length;
 if(!left){jobs.forEach(function(j){var q=rows[j.row];if(hskStableDone_(q))return;hskFull50Failed_(p,j,b[2],q);q[11]='full50_gemini_judge_unverified';hskVocabWrite_(tables.queue,j.row,q);});b[3]=jobs.every(function(j){return hskStableDone_(rows[j.row]);})?'DONE':'PARTIAL';p.setProperty('HSK_FULL50_STATUS',b[4]);}
 hskFull50Write_(tables,batches,i,b,info);
}
function hskFull50Tick_(p,storage,tables,rows,batches,token,started){
 var runtime={};
 var i=batches.findIndex(hskFull50Active_);
 if(i<0){if(batches.some(function(b){return ['TTS_CHUNKS','MASTER','VERIFY','AUTO_VERIFY','RESERVED','UNCERTAIN'].indexOf(b[3])>=0;}))return false;
  if(hskFastPhaseEnrollTick_(p,storage,tables,rows))return true;
  hskFull50Create_(p,storage,tables,rows,batches);i=batches.findIndex(hskFull50Active_);if(i<0)return true;}
 // Advance checkpointed cheap stages immediately; do not add a one-minute wait at every boundary.
 for(var step=0;step<12&&Date.now()-started<150000;step++){
  var b=batches[i],before=b[3],info=hskFull50Info_(b);if(!hskFull50Active_(b)||Number(info.retryAt||0)>Date.now())break;
  if(['FULL50_TTS','FULL50_GENERATING','FULL50_UNCERTAIN'].indexOf(b[3])>=0)hskFull50Synthesize_(p,storage,tables,rows,batches,i,b,info,token);
  else if(b[3]==='FULL50_SEGMENT')hskFull50Segment_(p,storage,tables,rows,batches,i,b,info);
  else if(b[3]==='FULL50_ASR')hskFull50Asr_(p,storage,tables,rows,batches,i,b,info,token,started);
  else if(b[3]==='FULL50_JUDGE')hskFull50Judge_(p,storage,tables,rows,batches,i,b,info,token);
  else if(b[3]==='FULL50_SAVE')hskFull50Save_(p,storage,tables,rows,batches,i,b,info,runtime);
  if(b[3]===before&&before!=='FULL50_SAVE')break;
 }
 return true;
}
