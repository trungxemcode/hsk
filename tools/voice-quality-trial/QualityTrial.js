/**
 * Finite private experiment. Reads live inventory, never writes a spreadsheet or main cache.
 * Existing owner timer drives checkpoints. Completion automatically releases the normal queue.
 */
var HSK_QUALITY_TRIAL_ID_='HSK_QUALITY_TRIAL_20261020_V3';
function hskTrialNorm_(x){return hskVoiceRecPinyin_(x);}
function hskTrialMatch_(job,check,h1,h2,p1,p2){
 var a=hskTrialNorm_(p1),b=hskTrialNorm_(p2),source=hskTrialNorm_(job.pinyin);
 if(!a||a!==b)return '';
 if(hskAuto50NormalizedHanzi_(h1)===hskAuto50NormalizedHanzi_(job.text)&&hskAuto50NormalizedHanzi_(h2)===hskAuto50NormalizedHanzi_(job.text)&&a===source)return 'strict_hanzi_pinyin';
 if(check!==3)return '';
 var common={'厉害':'lìhai','麻烦':'máfan','咳嗽':'késou','母亲':'mǔqīn','护士':'hùshi'};
 var expected=common[job.text]||hskAuto50ExpectedPinyin_(job.text,job.pinyin);
 return a===hskTrialNorm_(expected)?'third_exact_common_pinyin':'';
}
function hskTrialDetect_(bytes,expected){
 var pcm=hskBatchPcm_(bytes),levels=[],peak=0;
 for(var i=0;i<pcm.length;i+=960){var sum=0,end=Math.min(pcm.length,i+960);for(var j=i;j<end;j+=2){var x=(pcm[j]&255)+(pcm[j+1]&255)*256;if(x>=32768)x-=65536;sum+=x*x;}var rms=Math.sqrt(sum/((end-i)/2))/32768;levels.push(rms);peak=Math.max(peak,rms);}
 if(peak<0.004)return null;
 var candidates=[];
 [0.7,0.6,0.5,0.4,0.3,0.24,0.18,0.12].forEach(function(gap){[0.012,0.02,0.03,0.04,0.05].forEach(function(ratio){
 var ranges=[],start=-1,last=-1,threshold=Math.max(0.002,peak*ratio);
 levels.forEach(function(v,n){if(v>threshold){if(start<0)start=n;last=n;}else if(start>=0&&(n-last)*0.02>=gap){ranges.push([start*480,(last+1)*480]);start=last=-1;}});
 if(start>=0)ranges.push([start*480,Math.min(pcm.length/2,(last+1)*480)]);
 if(ranges.length===expected&&ranges.every(function(r){return r[1]-r[0]>=3600&&r[1]-r[0]<=120000;}))candidates.push({ranges:ranges,gap:gap,ratio:ratio});
 });});
 for(var c=0;c<candidates.length;c++){
  var best=candidates[c],support=candidates.filter(function(other){return other.gap===best.gap&&other.ranges.every(function(r,k){return Math.abs(r[0]-best.ranges[k][0])<=2400&&Math.abs(r[1]-best.ranges[k][1])<=2400;});}).length;
  if(support>=2)return best;
 }
 return null;
}
function hskTrialModelRanking_(batches){
 var models=['gemini-3.1-flash-tts-preview','gemini-2.5-flash-preview-tts'],score={};
 models.forEach(function(m){var kept=batches.filter(function(b){return b[7]===m;}).slice(-6),pass=0,total=0;
 kept.forEach(function(b){var match=String(b[4]).match(/saved_(\d+)_of_(\d+)/);if(match){pass+=Number(match[1]);total+=Number(match[2]);}else if(b[3]==='QUARANTINED')total+=50;});
 score[m]=(pass+7)/(total+10);
 });return models.sort(function(a,b){return score[b]-score[a];});
}
function hskTrialSave_(folder,state){state.updatedAt=new Date().toISOString();var name=HSK_QUALITY_TRIAL_ID_+'.json',files=folder.getFilesByName(name);if(files.hasNext())files.next().setContent(JSON.stringify(state));else folder.createFile(name,JSON.stringify(state),MimeType.PLAIN_TEXT);}
function hskQualityTrialTick_(){
 var p=hskSettings_(),marker=p.getProperty(HSK_QUALITY_TRIAL_ID_);
 if(marker==='DONE'||marker==='ERROR')return false;
 var lock=LockService.getScriptLock();if(!lock.tryLock(100))return true;
 var folder,state;
 try{
  var storage=hskCheck_(p),book=storage.sheet.getParent(),batches=hskVocabRows_(book.getSheetByName('Voice_Vocab_Batches'),11);
  if(!marker){
   var cache=hskVocabRows_(storage.sheet,13),keys=new Set(cache.filter(function(r){return r[0]&&r[4];}).map(function(r){return String(r[0]);}));
   var used=new Set();
   ['HSK_QUALITY_TRIAL_20261020_V1','HSK_QUALITY_TRIAL_20261020_V2'].forEach(function(id){
    var prior=p.getProperty(id);if(!prior||prior==='DONE'||prior==='ERROR')return;
    var files=DriveApp.getFolderById(prior).getFilesByName(id+'.json');if(files.hasNext()){
     var old=JSON.parse(files.next().getBlob().getDataAsString());(old.batches||[]).forEach(function(b){b.words.forEach(function(w){used.add(w.text);});});
    }
   });
   batches.forEach(function(b){try{JSON.parse(b[1]).forEach(function(j){used.add(j.text);});}catch(ignore){}});
   hskVocabRows_(book.getSheetByName('Voice_Vocabulary'),17).forEach(function(r){if(r[3]!=='PENDING'||Number(r[4])>0)used.add(r[1]);});
   var models=Array.from(new Set(cache.map(function(r){return r[3];}).filter(Boolean).concat(hskVoiceTtsModels_())));
   var seen=new Set(),fresh=hskTrialCorpus_().filter(function(w){if(used.has(w.text)||seen.has(w.text)||!w.pinyin||Array.from(w.text).length>4)return false;
    if(models.some(function(m){return keys.has(hskVocabKey_(m,w.text));}))return false;seen.add(w.text);return true;});
   fresh.sort(function(a,b){return a.level-b.level||Array.from(a.text).length-Array.from(b.text).length||a.text.localeCompare(b.text);});
   if(fresh.length<150)throw Error('fewer_than_150_never_generated_words:'+fresh.length);
   var level5=fresh.filter(function(w){return w.level===5;}).slice(0,75),level6=fresh.filter(function(w){return w.level===6;}).slice(0,75);
   if(level5.length<75||level6.length<75)throw Error('insufficient_unseen_HSK5_or_6');
   var chosen=level5.concat(level6),rank=hskTrialModelRanking_(batches),groups=[[],[],[]];chosen.forEach(function(w,i){groups[i%3].push({text:w.text,pinyin:w.pinyin,level:w.level,state:'NEW',checks:0,history:[]});});
   folder=DriveApp.createFolder(HSK_QUALITY_TRIAL_ID_+'_PRIVATE');
   state={id:HSK_QUALITY_TRIAL_ID_,startedAt:new Date().toISOString(),status:'RUNNING',sheetWrites:0,neverGenerated:true,modelRanking:rank,ttsCalls:0,asrCalls:0,cooldowns:{},events:[],batches:groups.map(function(words,i){return {number:i+1,preferred:rank[i%2],words:words,chunks:[],phase:'TTS',ttsCalls:0,asrCalls:0};})};
   for(var b=0;b<3;b++)for(var k=0;k<5;k++)state.batches[b].chunks.push({from:k*10,to:k*10+10,tries:0,state:'NEW'});
   p.setProperty(HSK_QUALITY_TRIAL_ID_,folder.getId());hskTrialSave_(folder,state);return true;
  }
  folder=DriveApp.getFolderById(marker);state=JSON.parse(folder.getFilesByName(HSK_QUALITY_TRIAL_ID_+'.json').next().getBlob().getDataAsString());
  if(state.status!=='RUNNING'){p.setProperty(HSK_QUALITY_TRIAL_ID_,state.status==='DONE'?'DONE':'ERROR');return false;}
  var started=Date.now(),token=ScriptApp.getIdentityToken(),budget=100000,operations=0;
  while(Date.now()-started<budget&&operations<5){
   var batch=state.batches.find(function(b){return b.phase!=='DONE';});if(!batch){state.status='DONE';break;}
   if(batch.phase==='TTS'||batch.phase==='RECOVERY_TTS'){
    var chunk=(batch.phase==='RECOVERY_TTS'?batch.recovery:batch.chunks).find(function(c){return c.state==='NEW';});
    if(!chunk){batch.phase='ASR';continue;}
    var rawStatus=UrlFetchApp.fetch(HSK_VOCAB_URL_,{method:'post',contentType:'application/json',headers:{Authorization:'Bearer '+token},payload:JSON.stringify({action:'status'}),muteHttpExceptions:true});
    if(rawStatus.getResponseCode()!==200){state.events.push('status_http_'+rawStatus.getResponseCode());break;}
    var status=JSON.parse(rawStatus.getContentText()),rank=[batch.preferred].concat(state.modelRanking.filter(function(m){return m!==batch.preferred;}));
    if(batch.number===3&&state.batches[0].phase==='DONE'&&state.batches[1].phase==='DONE'){
     rank=state.batches.slice(0,2).sort(function(a,b){return b.summary.passed-a.summary.passed;}).map(function(b){return b.preferred;});
    }
    if(chunk.generation===2||chunk.reason==='unproven_boundaries')rank=rank.slice().reverse();
    var pairs=(status.modelSlots||[]).filter(function(s){return rank.indexOf(s.model)>=0&&!Number(s.retryAfter||0)&&Number(state.cooldowns[s.model+':'+s.slot]||0)<=Date.now();});
    pairs.sort(function(a,b){return rank.indexOf(a.model)-rank.indexOf(b.model)||a.slot-b.slot;});
    if(!pairs.length){state.events.push('waiting_eligible_pair');break;}
    var pair=pairs[0],words=chunk.indices?chunk.indices.map(function(i){return batch.words[i];}):batch.words.slice(chunk.from,chunk.to),payload={items:words.map(function(w){return w.text;}),isolated:true,keySlot:pair.slot,model:pair.model,language:'zh-CN',dictionaryStyle:true};
    chunk.state='IN_FLIGHT';chunk.tries++;chunk.model=pair.model;chunk.slot=pair.slot;hskTrialSave_(folder,state);
    var res;
    try{res=UrlFetchApp.fetch(HSK_VOCAB_URL_,{method:'post',contentType:'application/json',headers:{Authorization:'Bearer '+token},payload:JSON.stringify(payload),muteHttpExceptions:true});}
    catch(e){chunk.state='UNCERTAIN';chunk.reason='transport_uncertain';words.forEach(function(w){w.state='UNCERTAIN';});hskTrialSave_(folder,state);operations++;continue;}
    var data=JSON.parse(res.getContentText()),attempts=Number(data.providerAttempts||1);state.ttsCalls+=attempts;batch.ttsCalls+=attempts;operations++;
    if(res.getResponseCode()!==200||!data.ok){
     chunk.reason=String(data.error||'tts_http_'+res.getResponseCode());
     state.cooldowns[pair.model+':'+pair.slot]=Date.now()+Math.max(60000,Number(data.retryAfter||120)*1000);
     chunk.state=data.error==='tts_transport_uncertain'?'UNCERTAIN':chunk.tries>=2?'FAILED':'NEW';
     if(/tts_blocked|tts_permission_denied/.test(chunk.reason)){chunk.state='FAILED';state.status='BLOCKED';}
     if(chunk.state!=='NEW')words.forEach(function(w){w.state=chunk.state;});
     state.events.push(chunk.reason);hskTrialSave_(folder,state);if(state.status!=='RUNNING')break;continue;
    }
    var bytes=hskWav_(Utilities.base64Decode(data.audioBase64),data.mimeType),master=folder.createFile(Utilities.newBlob(bytes,'audio/wav','batch_'+batch.number+'_chunk_'+chunk.from+'_try_'+chunk.tries+'.wav'));
    chunk.master=master.getId();var found=hskTrialDetect_(bytes,words.length);
    if(!found){chunk.state=chunk.tries>=2?'FAILED':'NEW';chunk.reason='unproven_boundaries';if(chunk.state==='FAILED')words.forEach(function(w){w.state='SEGMENTATION_FAILED';});hskTrialSave_(folder,state);continue;}
    var pcm=hskBatchPcm_(bytes);chunk.state='SAVED';chunk.gap=found.gap;chunk.ranges=found.ranges;
    found.ranges.forEach(function(range,n){
     var begin=Math.max(0,range[0]-2400),end=Math.min(pcm.length/2,range[1]+3600),speech=pcm.slice(begin*2,end*2);
     var padded=new Array(7200).fill(0).concat(speech,new Array(12000).fill(0));
     var file=folder.createFile(Utilities.newBlob(hskWav_(padded,'audio/l16'),'audio/wav','batch_'+batch.number+'_word_'+(chunk.from+n+1)+'.wav'));
     var word=words[n];if(word.file)(word.previousFiles||(word.previousFiles=[])).push(word.file);word.file=file.getId();word.state='PENDING';word.boundaryProven=true;word.model=pair.model;
    });
    hskTrialSave_(folder,state);continue;
   }
   var pending=batch.words.filter(function(w){return w.state==='PENDING'||w.state==='RECHECK';}).sort(function(a,b){return a.checks-b.checks;}).slice(0,5);
   if(!pending.length){
    var ready=batch.words.filter(function(w){return w.state==='PASS';}),counts={};
    if(!batch.recoveryStarted){
     batch.initialPassed=ready.length;batch.recoveryStarted=true;
     var failed=[];batch.words.forEach(function(w,i){if(w.state==='REVIEW'){failed.push(i);w.checks=0;w.generation=2;w.state='NEW';}});
     if(failed.length){batch.recovery=[];for(var k=0;k<failed.length;k+=10)batch.recovery.push({from:failed[k],to:failed[k]+Math.min(10,failed.length-k),indices:failed.slice(k,k+10),generation:2,tries:0,state:'NEW'});
      batch.phase='RECOVERY_TTS';hskTrialSave_(folder,state);continue;}
    }
    batch.words.forEach(function(w){counts[w.state]=(counts[w.state]||0)+1;});
    batch.summary={passed:ready.length,initialPassed:batch.initialPassed,of:50,byCheck:[1,2,3].map(function(n){return ready.filter(function(w){return w.checks===n;}).length;}),states:counts,ttsCalls:batch.ttsCalls,asrCalls:batch.asrCalls};batch.phase='DONE';hskTrialSave_(folder,state);continue;
   }
   var payload={action:'verify-words',keySlot:0,items:pending.map(function(w){return w.text;}),pinyin:pending.map(function(w){return w.pinyin;}),clips:pending.map(function(w){return Utilities.base64Encode(DriveApp.getFileById(w.file).getBlob().getBytes());})};
   var checked=UrlFetchApp.fetch(HSK_VOCAB_URL_,{method:'post',contentType:'application/json',headers:{Authorization:'Bearer '+token},payload:JSON.stringify(payload),muteHttpExceptions:true});
   state.asrCalls+=2;batch.asrCalls+=2;operations++;
   var out=JSON.parse(checked.getContentText());
   if(checked.getResponseCode()!==200||!out.ok){state.providerFailures=Number(state.providerFailures||0)+1;state.events.push('asr_'+String(out.error||checked.getResponseCode()));if(state.providerFailures>=8)state.status='ERROR';hskTrialSave_(folder,state);break;}
   if(!Array.isArray(out.transcripts)||out.transcripts.length!==2||!Array.isArray(out.pinyin)||out.pinyin.length!==2)throw Error('invalid_asr_result');
   pending.forEach(function(w,n){w.checks++;var h1=out.transcripts[0][n]||'',h2=out.transcripts[1][n]||'',p1=out.pinyin[0][n]||'',p2=out.pinyin[1][n]||'';
    var method=hskTrialMatch_(w,w.checks,h1,h2,p1,p2);w.history.push({generation:w.generation||1,check:w.checks,hanzi:[h1,h2],pinyin:[p1,p2],method:method});
    w.method=method;w.state=method?'PASS':w.checks>=3?'REVIEW':'RECHECK';
   });hskTrialSave_(folder,state);
  }
  if(state.batches.every(function(b){return b.phase==='DONE';})){state.status='DONE';state.finishedAt=new Date().toISOString();}
  state.events=state.events.slice(-40);hskTrialSave_(folder,state);
  if(state.status!=='RUNNING')p.setProperty(HSK_QUALITY_TRIAL_ID_,state.status==='DONE'?'DONE':'ERROR');
  return true;
 }catch(e){
  if(!folder)folder=DriveApp.createFolder(HSK_QUALITY_TRIAL_ID_+'_DIAGNOSTIC');
  if(!state)state={id:HSK_QUALITY_TRIAL_ID_};
  state.status='ERROR';state.error=String(e.message||e).slice(0,200);hskTrialSave_(folder,state);
  p.setProperty(HSK_QUALITY_TRIAL_ID_,'ERROR');console.warn('quality_trial_error');return true;
 }finally{lock.releaseLock();}
}
