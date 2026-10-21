/** Bounded same-tick handoff; saved files and uncertainty guards stay authoritative. */
function hskVoiceChunkedFastTick_(p,storage,tables,rows,batches,index,token){
 var started=Date.now(),batch=batches[index];
 for(var hop=0;hop<3;hop++){
  if(batch[3]!=='TTS_CHUNKS'||p.getProperty('HSK_VOCAB_ENABLED')!=='true'||p.getProperty('HSK_VOICE_PAUSED')==='true')break;
  if(Number(p.getProperty('HSK_VOCAB_RETRY_AT')||0)>Date.now())break;
  // A provider call may take up to80s; leave room within the Apps Script run.
  if(Date.now()-started>90000)break;
  var before=JSON.stringify(batch);
  hskVoiceChunkedStep_(p,storage,tables,rows,batches,index,token);
  if(JSON.stringify(batch)===before)break;
 }
}
