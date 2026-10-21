/** Focused recovery for FAST Auto50. Existing READY audio is never replaced. */
var HSK_CONGESTION_VERSION_='fast-recovery-20261021-v1';
function hskCongestionSpeech_(value){return String(value||'').normalize('NFC').replace(/[\uff08(][^\uff09)]*[\uff09)]/g,'').trim();}
function hskCongestionSourcePin_(value){return hskVoiceRecPinyin_(hskCongestionSpeech_(value));}
function hskCongestionThirdPin_(job){
 // CC-CEDICT/MDBG dictionary readings; only called by the THIRD-check gate.
 var common={'着急':'zháojí','护士':'hùshi','知识':'zhīshi','凉快':'liángkuai','要是':'yàoshi','来不及':'láibují','差不多':'chàbuduō','不过':'búguò','一直':'yìzhí','葡萄':'pútao'};
 var word=hskCongestionSpeech_(job.text);
 if(word==='得'&&/助动词/.test(job.text))return hskVoiceRecPinyin_('děi');
 return hskVoiceRecPinyin_(common[word]||hskAuto50ExpectedPinyin_(word,hskCongestionSpeech_(job.pinyin)));
}
function hskCongestionMatch_(jobs,segment,count,checks,h1,h2,p1,p2){
 var fail={index:-1,method:'unverified'},a=hskVoiceRecPinyin_(p1),b=hskVoiceRecPinyin_(p2),at=Number(segment)-1;
 if(!a||a!==b)return fail;
 var first=hskAuto50NormalizedHanzi_(h1),second=hskAuto50NormalizedHanzi_(h2),matches=[];
 if(first&&first===second)jobs.forEach(function(j,i){
  var invalidAux=hskCongestionSpeech_(j.text)==='得'&&/助动词/.test(j.text)&&hskCongestionSourcePin_(j.pinyin)!==hskVoiceRecPinyin_('děi');
  if(!invalidAux&&Math.abs(i-at)<=4&&hskAuto50NormalizedHanzi_(hskCongestionSpeech_(j.text))===first&&hskCongestionSourcePin_(j.pinyin)===a)matches.push(i);
 });
 if(matches.length===1)return {index:matches[0],method:'hanzi_pinyin_double_asr'};
 if(Number(checks)<3||Number(count)!==jobs.length||at<0||at>=jobs.length)return fail;
 // At the exact 1:1 clip position, homophones do not make the SOUND ambiguous.
 if(a!==hskCongestionThirdPin_(jobs[at]))return fail;
 return {index:at,method:'pinyin_third_check'};
}
function hskCongestionKeyNeeded_(text){return hskFastPhasePolyphonic_(text)||hskCongestionSpeech_(text)!==text||text==='葡萄';}
function hskCongestionAudit_(storage,type,word,batch,before,after){
 var s=hskVocabTable_(storage.sheet.getParent(),'Voice_Repair_Audit',['Time_VN','Type','Word','Batch','Before','After']);
 s.appendRow([hskVNTime_(new Date()),type,word,batch,JSON.stringify(before),JSON.stringify(after)]);
}
function hskCongestionActive_(batches){var used={};batches.forEach(function(b){if(['TTS_CHUNKS','MASTER','VERIFY','AUTO_VERIFY','RESERVED','UNCERTAIN'].indexOf(b[3])>=0)JSON.parse(b[1]).forEach(function(j){used[j.row]=true;});});return used;}
/** Resubmit ambiguous requests only after TWO separated absence audits, preserving saved WAVs. */
function hskCongestionHeld_(p,storage,tables,rows,batches){
 var active=hskCongestionActive_(batches),now=Date.now(),done=0;
 function file(name){var f=storage.folder.getFilesByName(name);return f.hasNext()?f.next():null;}
 for(var i=0;i<batches.length&&done<1;i++){
  var batch=batches[i];if(batch[3]!=='QUARANTINED')continue;
  var jobs=JSON.parse(batch[1]),held=jobs.filter(function(j){var r=rows[j.row];return r&&r[3]==='HOLD_UNCERTAIN'&&r[6]===batch[0]&&!active[j.row];});
  if(!held.length)continue;
  var info;try{info=JSON.parse(batch[10]||'{}');}catch(e){continue;}
  if(!Array.isArray(info.plan))continue;
  var full=file('VOCAB_MASTER_'+batch[0]+'.wav');
  if(full){hskBatchPcm_(full.getBlob().getBytes());batch[2]=full.getId();batch[3]='MASTER';batch[4]='recovered_saved_master_before_resubmit';tables.batches.getRange(i+2,1,1,11).setValues([batch]);done++;continue;}
  var saved=[],missing=[],covered={};
  info.plan.forEach(function(g){var f=file(String(g.name||''));if(f){hskBatchPcm_(f.getBlob().getBytes());saved.push(g);for(var n=g.from;n<g.to;n++)covered[n]=true;}else if(Number(g.tries||0)>0)missing.push(g.name);});
  var reusable=saved.filter(function(g){return held.some(function(j){var at=jobs.indexOf(j);return at>=g.from&&at<g.to;});});
  if(reusable.length){
   // Keep the original quarantine intact so its missing subset remains recoverable.
   var recoveryId=hskDigest_(batch[0]+':saved_recovery_v1'),already=batches.some(function(b){return b[0]===recoveryId;});
   if(already)continue;
   var kept=[],plan=[];reusable.forEach(function(g){var from=kept.length;for(var n=g.from;n<g.to;n++)kept.push(jobs[n]);plan.push(Object.assign({},g,{from:from,to:kept.length}));});
   var recovered=[recoveryId,JSON.stringify(kept),'','TTS_CHUNKS','recover_saved_chunks_without_new_tts',hskVNTime_(new Date()),batch[6],batch[7],batch[8],0,JSON.stringify({mode:'chunked_v1',version:'adaptive_v2',plan:plan,omitted:[]})];
   hskCongestionAudit_(storage,'RECOVER_SAVED_CHUNKS','',batch[0],{source:batch[0]},{recovery:recoveryId,jobs:kept.length});
   tables.batches.appendRow(recovered);batches.push(recovered);kept.forEach(function(j){var r=rows[j.row];if(['READY','EXISTING'].indexOf(r[3])>=0)return;r[3]='MASTER';r[6]=recoveryId;r[11]='recover_saved_chunk_no_new_tts';hskVocabWrite_(tables.queue,j.row,r);});done++;continue;
  }
  if(!missing.length)continue;
  var key='HSK_MISSING_WAV_'+batch[0],audit={};try{audit=JSON.parse(p.getProperty(key)||'{}');}catch(e){}
  var fingerprint=missing.slice().sort().join('|');
  if(audit.fingerprint!==fingerprint||!audit.first){p.setProperty(key,JSON.stringify({first:now,last:now,fingerprint:fingerprint}));continue;}
  if(now-Number(audit.last||0)<60000||now-Number(audit.first)<60000||now-Date.parse(batch[5])<120000)continue;
  held.forEach(function(j){var r=rows[j.row],before=r.slice();r[3]='RETRY';r[5]=0;r[8]='';r[9]='';r[11]='missing_wav_confirmed_twice;retry_clean_dictionary_input';hskCongestionAudit_(storage,'RELEASE_MISSING_WAV',r[1],batch[0],before,r);hskVocabWrite_(tables.queue,j.row,r);});
  p.deleteProperty(key);done++;
 }
 return done;
}
/** Auto replay of SAVED double-ASR evidence under the same third-check rule. No model calls. */
function hskCongestionReuse_(p,storage,tables,rows,batches){
 var sheet=hskAuto50Sheet_(storage),clips=hskVocabRows_(sheet,15),by={},counts={},active=hskCongestionActive_(batches),saved=0,loaded='',pcm;
 batches.forEach(function(b){by[b[0]]=b;});clips.forEach(function(c){counts[c[0]]=(counts[c[0]]||0)+1;});
 for(var k=clips.length-1;k>=0&&saved<2;k--){
  var c=clips[k];if(c[4]!=='REVIEW'||Number(c[5])<3)continue;
  var b=by[c[0]];if(!b||!b[2])continue;
  var jobs=JSON.parse(b[1]),proof=hskAuto50QualityMatch_(jobs,c[1],counts[c[0]],c[5],c[6],c[7],c[8],c[9]);
  if(proof.index<0)continue;
  var job=jobs[proof.index],r=rows[job.row];
  if(!r||active[job.row]||['READY','EXISTING'].indexOf(r[3])>=0||r[1]!==job.text||hskCongestionSourcePin_(r[2])!==hskCongestionSourcePin_(job.pinyin))continue;
  if(loaded&&loaded!==b[2])continue;
  try{
   if(!loaded){pcm=hskBatchPcm_(DriveApp.getFileById(b[2]).getBlob().getBytes());loaded=b[2];}
   var start=Math.max(0,Math.round((Number(c[2])-120)*24)),end=Math.min(pcm.length/2,Math.round((Number(c[3])+200)*24));
   if(end<=start)continue;
   var bytes=hskWav_(pcm.slice(start*2,end*2),'audio/l16'),hit=hskAuto50Cache_(storage,job,b[2],bytes,b[6],b[0],proof.method),before=r.slice();
   r[3]=hit.existing?'EXISTING':'READY';r[6]=b[0];r[7]=hit.model;r[8]=b[2];r[9]=hit.file;r[10]=JSON.stringify([c[6],c[7]]);r[11]='';r[13]=JSON.stringify([c[8],c[9]]);r[14]=c[2];r[15]=c[3];r[16]='https://drive.google.com/file/d/'+hit.file+'/view';
   hskCongestionAudit_(storage,'REUSE_SAVED_DOUBLE_ASR',job.text,b[0],before,{row:r,method:proof.method,clip:k+2});hskVocabWrite_(tables.queue,job.row,r);
   c[4]=r[3];c[10]=job.row+2;c[11]=job.text;c[12]=hit.file;c[13]='recovered_saved_double_asr_round3';c[14]=hskVNTime_(new Date());sheet.getRange(k+2,1,1,15).setValues([c]);saved++;
  }catch(e){p.setProperty('HSK_CONGESTION_REUSE_ERROR',String(e.message||e).slice(0,100));}
 }
 return saved;
}
function hskCongestionGroupSize_(jobs,start){
 if(jobs[start].repairProfile)return 1;
 var n=1;while(n<10&&start+n<jobs.length&&!jobs[start+n].repairProfile)n++;return n;
}
function hskCongestionRepairProfile_(row){return Number(row[4]||0)>=2||hskCongestionSpeech_(row[1])!==row[1]||hskCongestionKeyNeeded_(row[1]);}
function hskCongestionFailed_(p,job,batchId,row){
 var key='HSK_FIXED_PROFILE_FAIL_'+hskDigest_(job.text+'|'+hskCongestionSourcePin_(job.pinyin)),state={};
 try{state=JSON.parse(p.getProperty(key)||'{}');}catch(e){}
 if(state.version!==HSK_CONGESTION_VERSION_)state={version:HSK_CONGESTION_VERSION_,count:0};
 if(state.batch!==batchId){state.count=Number(state.count||0)+1;state.batch=batchId;p.setProperty(key,JSON.stringify(state));}
 row[3]=state.count>=3?'REVIEW':'RETRY';row[5]=0;
 row[11]=state.count>=3?'fixed_input_three_masters_unverified;needs_targeted_repair':'retry_clean_dictionary_input_'+state.count;
}
function hskCongestionTick_(p,storage,tables,rows,batches){
 var started=Date.now();
 hskCongestionRepair400_(p,storage,tables,rows,batches);
 rows.forEach(function(r,i){if(r[3]==='REVIEW'&&/^polyphonic_pinyin_cache_collision_requires_new_verified_audio/.test(r[11]||'')){var before=r.slice();r[3]='RETRY';r[5]=0;r[11]='retry_with_pronunciation_specific_cache_key';hskCongestionAudit_(storage,'REPAIR_CACHE_COLLISION',r[1],'',before,r);hskVocabWrite_(tables.queue,i,r);}});
 hskCongestionHeld_(p,storage,tables,rows,batches);
 if(Date.now()-started<12000)hskCongestionReuse_(p,storage,tables,rows,batches);
 p.setProperty('HSK_CONGESTION_FIX',HSK_CONGESTION_VERSION_);
}
/** A client validation error never reached the model; repair its journal once. */
function hskCongestionRepair400_(p,storage,tables,rows,batches){
 batches.forEach(function(b,i){
  var affected=b[0]==='62e638a697a7eed616bd44de91eadd063f02c3e8034037af3ce565942af92831';
  if(b[3]!=='TTS_CHUNKS'||(!affected&&!/cloudflare_tts_400_|CLIENT_REQUEST_INVALID/.test(b[4]||'')))return;
  var info=JSON.parse(b[10]||'{}'),jobs=JSON.parse(b[1]);if(info.client400Fixed||!Array.isArray(info.plan))return;
  var before=JSON.parse(JSON.stringify(info));
  info.plan.forEach(function(g){if(!storage.folder.getFilesByName(g.name).hasNext())g.tries=0;});
  (info.omitted||[]).forEach(function(n){var j=jobs[n],r=j&&rows[j.row];if(!r||['READY','EXISTING'].indexOf(r[3])>=0||batches.some(function(other){return other!==b&&['TTS_CHUNKS','MASTER','VERIFY','AUTO_VERIFY','RESERVED','UNCERTAIN'].indexOf(other[3])>=0&&JSON.parse(other[1]).some(function(x){return x.row===j.row;});}))return;
   info.plan.push({from:n,to:n+1,name:'VOCAB_CHUNK_'+b[0]+'_clientfix_'+n+'.wav',model:b[7],slot:b[6],tries:0});
  });
  info.plan.sort(function(a,b){return a.from-b.from;});info.omitted=(info.omitted||[]).filter(function(n){return !info.plan.some(function(g){return n>=g.from&&n<g.to;});});info.client400Fixed=true;
  hskCongestionAudit_(storage,'FIX_CLIENT_400_JOURNAL','',b[0],before,info);b[10]=JSON.stringify(info);b[4]='CLIENT_PAYLOAD_FIXED_NO_PROVIDER_RETRY_PENALTY';tables.batches.getRange(i+2,1,1,11).setValues([b]);
  if(/cloudflare_tts_400_|invalid_request/.test(p.getProperty('HSK_VOCAB_ERROR')||'')){p.deleteProperty('HSK_VOCAB_ERROR');p.deleteProperty('HSK_VOCAB_RETRY_AT');}
 });
}
function hskCongestionMetric_(p,stage,started,status){
 var key='HSK_METRIC_'+stage,m={};try{m=JSON.parse(p.getProperty(key)||'{}');}catch(e){}
 var ms=Math.max(0,Date.now()-started);m.count=Number(m.count||0)+1;m.totalMs=Number(m.totalMs||0)+ms;m.lastMs=ms;m.maxMs=Math.max(Number(m.maxMs||0),ms);m.status=String(status||'ok').slice(0,90);m.time=hskVNTime_(new Date());p.setProperty(key,JSON.stringify(m));
}
/** One generator under the existing script lock; checkpoint each success, stop on any error. */
function hskCongestionSynthesizeTick_(p,storage,tables,rows,batches,index,token,started){
 for(var n=0;n<3&&(n===0||Date.now()-started<75000);n++){
  hskVoiceChunkedStep_(p,storage,tables,rows,batches,index,token);
  var b=batches[index];if(b[3]!=='TTS_CHUNKS'||!/^SAVED_/.test(b[4]||''))break;
 }
}
function hskCongestionControl_(p){
 if(p.getProperty('HSK_VOICE_PAUSED')==='true'||p.getProperty('HSK_VOCAB_PILOT_ONLY')==='true')return;
 var now=Date.now();if(now-Number(p.getProperty('HSK_CONGESTION_LAST_TICK')||0)<60000)return;
 var lock=LockService.getScriptLock();if(!lock.tryLock(100))return;
 try{
  if(now-Number(p.getProperty('HSK_CONGESTION_LAST_TICK')||0)<60000)return;
  var storage=hskCheck_(p),book=storage.sheet.getParent(),control=book.getSheetByName('Voice_Control');
  if(!control||String(control.getRange(2,2).getValue()).trim()!=='AUTO_CYCLE')return;
  p.setProperty('HSK_CONGESTION_LAST_TICK',String(now));
  var tables=hskVocabTables_(storage),rows=hskVocabRows_(tables.queue,17),batches=hskVocabRows_(tables.batches,11);
  hskCongestionTick_(p,storage,tables,rows,batches);hskVocabSummary_(storage,tables);p.deleteProperty('HSK_CONGESTION_ERROR');hskCongestionProgress_(storage,p);
 }catch(e){var message=String(e.message||e).slice(0,140);p.setProperty('HSK_CONGESTION_ERROR',message);try{var dashboard=storage.sheet.getParent().getSheetByName('Tien_do');if(dashboard)dashboard.getRange(29,1,1,2).setValues([['Loi sua hang doi',message]]);}catch(ignored){}}
 finally{lock.releaseLock();}
}
/** Called with the script lock already held. Small fixed dashboard range, no whole-sheet rewrite. */
function hskCongestionProgress_(storage,p){
 var book=storage.sheet.getParent(),s=book.getSheetByName('Tien_do');if(!s)return;
 var cache=hskVocabRows_(storage.sheet,13),queue=hskVocabRows_(hskVocabTables_(storage).queue,17),keys={},states={};
 cache.forEach(function(r){if(r[0]&&r[4]&&r[11]==='READY')keys[r[0]]=true;});queue.forEach(function(r){states[r[3]]=(states[r[3]]||0)+1;});
 var n=Object.keys(keys).length,total=Number(s.getRange(2,2).getValue())||11281,retry=Number(p.getProperty('HSK_VOCAB_RETRY_AT')||0),now=Date.now();
 s.getRange(3,2,10,1).setValues([[n],[Math.max(0,total-n)],[(states.RETRY||0)+(states.HOLD_UNCERTAIN||0)],[(states.REVIEW||0)],
  [p.getProperty('HSK_VOICE_PAUSED')==='true'?'Tam dung':retry>now?'Dang cho retry; tu chay tiep':'Auto dang xu ly hang doi'],[hskVNTime_(new Date(now))],[retry>now?hskVNTime_(new Date(retry)):''],[Number(p.getProperty('HSK_VOCAB_WINDOW_CALLS')||0)],[Math.round(Number(p.getProperty('HSK_VOCAB_RUNTIME_MS')||0)/6000)/10],[p.getProperty('HSK_VOCAB_ERROR')||'']]);
 s.getRange(26,1,3,2).setValues([['Ban sua nghen',HSK_CONGESTION_VERSION_],['Trang thai hang doi',JSON.stringify(states)],['Xu ly tu kho','giu voice dat; tai su dung master; lan 3 xet cach doc pho bien']]);
 s.getRange(29,1,1,2).setValues([['Loi sua hang doi',p.getProperty('HSK_CONGESTION_ERROR')||'']]);
 ['TTS','ASR'].forEach(function(stage,i){s.getRange(30+i,1,1,2).setValues([['Do thoi gian '+stage,p.getProperty('HSK_METRIC_'+stage)||'cho luot moi']]);});
 s.getRange(32,1,1,2).setValues([['Chi tiet TTS',p.getProperty('HSK_TTS_LAST_DIAG')||'']]);
 var stage=p.getProperty('HSK_FAST_PHASE_STAGE')||'234',levels=hskFastPhaseLevels_(stage),group=queue.filter(function(r){return levels.indexOf(Number(r[0]))>=0;}),complete=group.filter(function(r){return ['READY','EXISTING'].indexOf(r[3])>=0;}).length;
 var phaseStates={};group.forEach(function(r){if(['READY','EXISTING'].indexOf(r[3])<0)phaseStates[r[3]]=(phaseStates[r[3]]||0)+1;});
 var phaseStatus=group.length===complete?'PHASE_COMPLETE':p.getProperty('HSK_VOICE_PAUSED')==='true'?'PAUSED':phaseStates.REVIEW?'WAITING_REVIEW_'+phaseStates.REVIEW:'AUTO_RUNNING_'+JSON.stringify(phaseStates);
 s.getRange(20,2,5,1).setValues([[stage],[group.length],[complete],[group.length-complete],[phaseStatus]]);
}
