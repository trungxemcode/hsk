/** Deterministic PCM silence for ASR transport only. Stored clips remain untouched. */
function hskAsrPadClips_(clips){
 if(!Array.isArray(clips)||!clips.length)throw Error('invalid_asr_clips');
 // Existing Worker accepts <=350k base64 chars/clip and <=650k aggregate.
 var budget=Math.min(350000,Math.floor(640000/clips.length/4)*4);
 return clips.map(function(encoded){
  var bytes=Utilities.base64Decode(encoded),pcm=hskBatchPcm_(bytes),maxBytes=Math.floor(budget/4)*3;
  var perSide=Math.min(2000*48,Math.max(0,Math.floor((maxBytes-44-pcm.length)/4)*2));
  if(!perSide)return encoded;
  var silence=Array(perSide).fill(0),padded=silence.concat(pcm,silence);
  return Utilities.base64Encode(hskWav_(padded,'audio/l16'));
 });
}
function hskAsrPrepareBody_(body){
 if(!body||body.action!=='verify-words')return body;
 return Object.assign({},body,{clips:hskAsrPadClips_(body.clips)});
}
/** Once per version: audit one already-saved preview; no TTS or ASR request. */
function hskAsrPaddingAudit_(p,control){
 if(p.getProperty('HSK_ASR_SILENCE_AUDIT')==='v1')return;
 var url=String(control.getRange(20,2).getValue()||''),id=(url.match(/folders\/([A-Za-z0-9_-]+)/)||[])[1];
 if(!id)return;
 var files=DriveApp.getFolderById(id).getFiles(),file=null;
 while(files.hasNext()){var candidate=files.next();if(/\.wav$/i.test(candidate.getName())){file=candidate;break;}}
 if(!file)return;
 var bytes=file.getBlob().getBytes(),before=hskBatchPcm_(bytes),original=Utilities.base64Encode(bytes),
  encoded=hskAsrPadClips_([original])[0],after=hskBatchPcm_(Utilities.base64Decode(encoded)),
  perSide=(after.length-before.length)/2,valid=perSide>0&&perSide%2===0;
 for(var i=0;i<perSide&&valid;i++)if(after[i]!==0||after[after.length-1-i]!==0)valid=false;
 for(var j=0;j<before.length&&valid;j++)if((after[perSide+j]&255)!==(before[j]&255))valid=false;
 var result={ok:valid,sourceSeconds:before.length/48000,asrSeconds:after.length/48000,
  silenceEachSideSeconds:perSide/48000,base64Chars:encoded.length,originalSpeechUnchanged:valid,providerCalls:0};
 control.getRange(29,1,1,2).setValues([['ASR_silence_audit',JSON.stringify(result)]]);
 if(!valid)throw Error('asr_silence_audit_failed');
 p.setProperty('HSK_ASR_SILENCE_AUDIT','v1');
}
