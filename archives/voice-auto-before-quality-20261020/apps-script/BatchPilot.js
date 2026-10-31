// Manual, cache-protected batch experiment. Never marks split segments READY.
function hskBatchPilot(){return hskBatchProbe_();}
function hskBatchProbe_(){
 var p=hskSettings_();p.setProperty('HSK_WARM_ENABLED','false');p.setProperty('HSK_WARM_PAUSE_REASON','batch-pilot');
 var lock=LockService.getScriptLock();if(!lock.tryLock(1000))return {ok:false,error:'busy_no_generation_sent'};
 try{
  var storage=hskCheck_(p),all=hskWarmCorpus_(),cursor=Number(p.getProperty('HSK_WARM_CURSOR')||0),items=[],model=p.getProperty('HSK_VOICE_MODEL')||'gemini-2.5-flash-preview-tts',seen=new Set();
  for(var i=cursor;i<all.length&&items.length<5;i++){
   var text=hskCleanText_(all[i]),key=hskDigest_(JSON.stringify(['zh-CN','Kore',model,text]));
   if(seen.has(text)||hskGetRow_(storage.sheet,key))continue;
   if(items.join('。').length+text.length>190)continue;items.push(text);seen.add(text);
  }
  if(items.length<2)return {ok:false,error:'not_enough_uncached_items'};
  var id=hskDigest_(JSON.stringify(['gemini-3.1-flash-tts-preview',items])),property='HSK_BATCH_PROBE_'+id.slice(0,20),previous=p.getProperty(property);
  if(previous)return JSON.parse(previous);
  var token=ScriptApp.getIdentityToken(),health=hskParallelAvailability_(token);
  var slot=health.filter(function(s){return s.retryAfter===0&&Number(p.getProperty('HSK_WARM_SLOT_'+s.slot+'_AFTER')||0)<=Date.now();})[0];
  if(!slot)return {ok:false,error:'no_healthy_key_no_generation_sent'};
  p.setProperty(property,JSON.stringify({ok:false,error:'pilot_attempt_already_reserved',items:items}));
  var response=UrlFetchApp.fetch('https://hsk-vietnamese-translator.trung-hsk668.workers.dev/voice-precache',{method:'post',contentType:'application/json',headers:{Authorization:'Bearer '+token},payload:JSON.stringify({text:items.map(function(t){return t.replace(/[。！？!?]+$/,'');}).join('。 '),language:'zh-CN',keySlot:slot.slot,isolated:true}),muteHttpExceptions:true});
  var decoded;
  try{decoded=hskParallelDecode_(response);}catch(e){
   p.setProperty('HSK_WARM_VENDOR_CALLS',String(Number(p.getProperty('HSK_WARM_VENDOR_CALLS')||0)+(e.providerAttempts===undefined?1:e.providerAttempts)));
   var failure={ok:false,error:String(e.message||'pilot_failed').replace(/[^a-z0-9_]/gi,'_').slice(0,90),items:items,slot:slot.slot};p.setProperty(property,JSON.stringify(failure));return failure;
  }
  p.setProperty('HSK_WARM_VENDOR_CALLS',String(Number(p.getProperty('HSK_WARM_VENDOR_CALLS')||0)+decoded.providerAttempts));
  var bytes=decoded.bytes,name='hsk-batch-pilot-'+id.slice(0,24)+'.wav',files=storage.folder.getFilesByName(name),file=files.hasNext()?files.next():storage.folder.createFile(Utilities.newBlob(bytes,'audio/wav',name));
  function u32(at){return (bytes[at]&255)+(bytes[at+1]&255)*256+(bytes[at+2]&255)*65536+(bytes[at+3]&255)*16777216;}
  var start=44,size=bytes.length-44;for(var at=12;at+8<bytes.length;){var tag=String.fromCharCode(bytes[at]&255,bytes[at+1]&255,bytes[at+2]&255,bytes[at+3]&255),n=u32(at+4);if(tag==='data'){start=at+8;size=n;break;}at+=8+n+n%2;}
  var frame=480,levels=[],peak=0;
  for(var at=start;at+frame*2<=start+size;at+=frame*2){var sum=0;for(var n=0;n<frame;n++){var sample=(bytes[at+n*2]&255)+(bytes[at+n*2+1]&255)*256;if(sample>=32768)sample-=65536;sum+=sample*sample;}var rms=Math.sqrt(sum/frame)/32768;levels.push(rms);peak=Math.max(peak,rms);}
  var threshold=Math.max(0.003,peak*0.02),segments=[],begin=-1,lastVoiced=-1;
  levels.forEach(function(value,index){if(value>threshold){if(begin<0)begin=index;lastVoiced=index;}else if(begin>=0&&index-lastVoiced>=28){if(lastVoiced-begin>=5)segments.push([Math.round(begin*20)/1000,Math.round((lastVoiced+1)*20)/1000]);begin=-1;}});
  if(begin>=0&&lastVoiced-begin>=5)segments.push([begin*0.02,(lastVoiced+1)*0.02]);
  var result={ok:true,items:items,slot:slot.slot,providerCalls:decoded.providerAttempts,fileUrl:file.getUrl(),bytes:bytes.length,duration:Math.round(size/48000*100)/100,expectedSegments:items.length,detectedSegments:segments.length,segments:segments,verifiedForMainCache:false};
  p.setProperty(property,JSON.stringify(result));return result;
 }finally{lock.releaseLock();}
}

function hskBatchPilotCandidates_(){
 var result=hskBatchProbe_();
 if(!result.ok||result.expectedSegments!==result.detectedSegments)return {ok:false,error:'pilot_segmentation_not_verified',probe:result};
 var storage=hskCheck_(hskSettings_()),id=(result.fileUrl.match(/\/d\/([A-Za-z0-9_-]+)/)||[])[1];
 if(!id)throw Error('invalid_pilot_file');
 var bytes=DriveApp.getFileById(id).getBlob().getBytes(),start=44,size=bytes.length-44;
 function u32(at){return (bytes[at]&255)+(bytes[at+1]&255)*256+(bytes[at+2]&255)*65536+(bytes[at+3]&255)*16777216;}
 for(var at=12;at+8<bytes.length;){var tag=String.fromCharCode(bytes[at]&255,bytes[at+1]&255,bytes[at+2]&255,bytes[at+3]&255),n=u32(at+4);if(tag==='data'){start=at+8;size=n;break;}at+=8+n+n%2;}
 var folderName='BatchPilot_'+hskDigest_(JSON.stringify(result.items)).slice(0,16),folders=storage.folder.getFoldersByName(folderName),folder=folders.hasNext()?folders.next():storage.folder.createFolder(folderName),clips=[];
 result.segments.forEach(function(segment,index){
  if(!Array.isArray(segment)||segment[0]<0||segment[1]<=segment[0]||segment[1]>size/48000)throw Error('invalid_segment_bounds');
  var from=Math.max(0,Math.floor((segment[0]-0.12)*24000))*2,to=Math.min(size,Math.ceil((segment[1]+0.18)*24000)*2);
  var raw=bytes.slice(start+from,start+to),wav=hskWav_(raw,'audio/l16'),name=('0'+(index+1)).slice(-2)+'_'+result.items[index].replace(/[\\\/:*?"<>|]/g,'')+'.wav',files=folder.getFilesByName(name),file=files.hasNext()?files.next():folder.createFile(Utilities.newBlob(wav,'audio/wav',name));
  file.setDescription('UNVERIFIED batch pilot candidate; not registered READY in the main voice cache.');
  clips.push({text:result.items[index],url:file.getUrl(),bytes:wav.length});
 });
 hskWarmProgress_(storage,hskSettings_());
 return {ok:true,folderUrl:folder.getUrl(),sourceUrl:result.fileUrl,providerCallsForSplitting:0,clips:clips,verifiedForMainCache:false};
}
