/**
 * Fail-closed recovery for a chunked TTS request whose response was ambiguous.
 *
 * Do not retry any attempted chunk without confirmed WAV on Drive: provider may
 * already have generated the voice. Quarantine only those attempted words.
 * Never quarantine words that were never sent to TTS; they remain actionable
 * in the normal 50-word AUTO queue.
 */
function hskVoiceQuarantineUncertainChunks_(p,storage,tables,rows,batches){
 var folder=storage.folder,changed=false;
 function fileNamed(name){var it=folder.getFilesByName(name);return it.hasNext()?it.next():null;}
 for(var i=0;i<batches.length;i++){
  var batch=batches[i];
  if(batch[3]!=='UNCERTAIN'||!/^tts_chunk_(response|transport)_uncertain_/.test(String(batch[4]||'')))continue;
  var journal={};try{journal=JSON.parse(String(batch[10]||'{}'));}catch(ignore){}
  if(journal.mode!=='chunked_v1'||!Array.isArray(journal.plan)||!journal.plan.length)continue;
  var batchId=String(batch[0]),jobs=JSON.parse(String(batch[1]||'[]'));
  var master=fileNamed('VOCAB_MASTER_'+batchId+'.wav');
  if(master){
   // Existing full master is safe to verify, never regenerate.
   hskBatchPcm_(master.getBlob().getBytes());
   batch[2]=master.getId();batch[3]='MASTER';batch[4]='recovered_saved_master';
   tables.batches.getRange(i+2,1,1,11).setValues([batch]);
   p.setProperty('HSK_VOCAB_ENABLED','true');changed=true;continue;
  }
  var ambiguous=[],saved=[],unsent=0;
  journal.plan.forEach(function(g){
   if(!Number.isInteger(g.from)||!Number.isInteger(g.to)||g.from<0||g.to<=g.from||g.to>jobs.length)
    throw Error('invalid_uncertain_chunk_plan');
   var file=fileNamed(String(g.name||''));
   if(file){hskBatchPcm_(file.getBlob().getBytes());saved.push(g);return;}
   if(Number(g.tries||0)>0)ambiguous.push(g);
   else unsent+=g.to-g.from;
  });
  // If all previously attempted TTS has a saved file, resume journal safely.
  if(!ambiguous.length){
   batch[3]='TTS_CHUNKS';batch[4]='resumed_only_saved_attempts';
   tables.batches.getRange(i+2,1,1,11).setValues([batch]);
   p.setProperty('HSK_VOCAB_ENABLED','true');changed=true;continue;
  }
  // Preserve any confirmed saved chunk together with the ambiguous one for
  // later review. Do not resubmit any of those words, or mark them READY.
  var frozen=new Set();
  ambiguous.concat(saved).forEach(function(g){
   for(var n=g.from;n<g.to;n++)frozen.add(n);
  });
  frozen.forEach(function(n){
   var job=jobs[n],row=rows[job.row];
   if(!row||['READY','EXISTING'].indexOf(row[3])>=0)return;
   // Current retry/pending rows were selected for this batch, but only the
   // attempted/saved subset is frozen. Remaining words stay in normal queue.
   row[3]='HOLD_UNCERTAIN';row[6]=batchId;
   row[11]='tts_response_uncertain_preserved_no_regeneration';
   hskVocabWrite_(tables.queue,job.row,row);
  });
  batch[3]='QUARANTINED';
  batch[4]='ambiguous_'+ambiguous.length+'_chunks;hold_'+frozen.size+'_words;unsent_'+unsent;
  tables.batches.getRange(i+2,1,1,11).setValues([batch]);
  p.setProperty('HSK_VOCAB_ENABLED','true');
  p.setProperty('HSK_AUTO50_UNCERTAIN_HELD',String(frozen.size));
  p.setProperty('HSK_AUTO50_UNCERTAIN_BATCH',batchId);
  if(p.getProperty('HSK_VOCAB_ERROR')==='uncertain_batch_requires_review')
   p.deleteProperty('HSK_VOCAB_ERROR');
  changed=true;
 }
 return changed;
}
