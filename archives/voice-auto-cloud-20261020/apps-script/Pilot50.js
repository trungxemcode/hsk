/** One-shot 50 vocabulary entries, 4s requested silence; no automatic second master. */
function hskVocabPilot50Start(){
 var p=hskSettings_(),storage=hskCheck_(p),tables=hskVocabTables_(storage);
 var old=hskVocabRows_(tables.batches,11);
 if(p.getProperty('HSK_VOCAB_ENABLED')==='true')throw Error('vocab_already_running');
 var priorId=p.getProperty('HSK_VOCAB_PILOT_ID')||'',prior=old.find(function(b){return b[0]===priorId;});
 if(prior){
  if(prior[3]==='REJECTED'&&!prior[2]){
   var retries=Number(p.getProperty('HSK_VOCAB_PILOT50_RETRY_COUNT')||0);
   if(retries>=2)throw Error('pilot_retry_limit_reached');
   p.setProperty('HSK_VOCAB_PILOT50_RETRY_COUNT',String(retries+1));
   p.deleteProperty('HSK_VOCAB_PILOT_ID');
  }else return hskVocabPilot50Status();
 }
 if(old.some(function(b){return ['MASTER','VERIFY','RESERVED','UNCERTAIN'].indexOf(b[3])>=0;}))throw Error('unresolved_voice_batch_no_new_tts');
 p.setProperty('HSK_VOCAB_PILOT_REQUESTED','true');
 p.setProperty('HSK_VOCAB_PILOT_ONLY','true');
 p.deleteProperty('HSK_VOCAB_PILOT_ID');
 p.setProperty('HSK_VOCAB_BATCH_SIZE','50');
 p.setProperty('HSK_VOCAB_PAUSE','4');
 try{hskVocabStart();}
 finally{p.deleteProperty('HSK_VOCAB_PILOT_REQUESTED');}
 var id=p.getProperty('HSK_VOCAB_PILOT_ID')||'',list=hskVocabRows_(tables.batches,11),trial=list.find(function(b){return b[0]===id;});
 if(trial&&trial[3]==='REJECTED')hskVocabStop();
 var result={pilot:true,requested:50,pauseSeconds:4,batch:id,state:trial?trial[3]:'NOT_STARTED',master:!!(trial&&trial[2]),progress:hskVocabSummary_(storage,tables)};
 console.log('HSK_VOCAB_PILOT_50 '+JSON.stringify(result));return result;
}
function hskVocabPilot50Status(){
 var p=hskSettings_(),storage=hskCheck_(p),tables=hskVocabTables_(storage),id=p.getProperty('HSK_VOCAB_PILOT_ID');
 var trial=hskVocabRows_(tables.batches,11).find(function(b){return b[0]===id;}),jobs=trial?JSON.parse(trial[1]):[];
 return {pilot:id||null,state:trial?trial[3]:'NOT_STARTED',master:trial&&trial[2]?'https://drive.google.com/file/d/'+trial[2]+'/view':null,items:jobs.length,finished:jobs.filter(function(j){return ['READY','EXISTING','RETRY','REVIEW'].indexOf(tables.queue.getRange(j.row+2,4).getValue())>=0;}).length,progress:hskVocabSummary_(storage,tables)};
}
