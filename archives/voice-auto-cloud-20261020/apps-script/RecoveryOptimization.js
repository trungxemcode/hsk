/** Conservative watchdog and batch tuning; no TTS or ASR calls from watchdog. */
function hskAuto50Watchdog_(p,book,control){
 var now=Date.now(), last=Number(p.getProperty('HSK_AUTO50_PROGRESS_AT')||0);
 var state=String(control.getRange(2,2).getValue()||'');
 if(state!=='AUTO_CYCLE')return;
 var s=book.getSheetByName('Voice_Vocabulary');if(!s)return;
 var rows=hskVocabRows_(s,17),ready=rows.filter(function(r){return r[3]==='READY'||r[3]==='EXISTING';}).length;
 var previous=Number(p.getProperty('HSK_AUTO50_PROGRESS_READY')||-1);
 if(previous!==ready||!last){p.setProperty('HSK_AUTO50_PROGRESS_READY',String(ready));p.setProperty('HSK_AUTO50_PROGRESS_AT',String(now));last=now;}
 var age=now-last;
 p.setProperty('HSK_AUTO50_STALL_MS',String(age));
 if(age<600000)return;
 var retry=Number(p.getProperty('HSK_VOCAB_RETRY_AT')||0);
 if(retry>now){p.setProperty('HSK_AUTO50_WATCHDOG','provider_backoff');return;}
 var batches=book.getSheetByName('Voice_Vocab_Batches');
 if(!batches)return;
 var b=hskVocabRows_(batches,11),active=b.find(function(r){return ['MASTER','AUTO_VERIFY','VERIFY'].indexOf(r[3])>=0;});
 if(active){
  p.setProperty('HSK_AUTO50_WATCHDOG','active_batch_preserved');
  // Do not regenerate or force READY. Restore missing trigger only.
  var triggers=ScriptApp.getProjectTriggers();
  if(p.getProperty('HSK_VOCAB_ENABLED')==='true'&&!triggers.some(function(t){return t.getHandlerFunction()==='hskVocabTick';}))
   ScriptApp.newTrigger('hskVocabTick').timeBased().everyMinutes(1).create();
  return;
 }
 if(b.some(function(r){return ['RESERVED','UNCERTAIN'].indexOf(r[3])>=0;})){
  p.setProperty('HSK_AUTO50_WATCHDOG','uncertain_requires_review');return;
 }
 if(p.getProperty('HSK_VOCAB_ENABLED')!=='true')p.setProperty('HSK_VOCAB_ENABLED','true');
 if(!ScriptApp.getProjectTriggers().some(function(t){return t.getHandlerFunction()==='hskVocabTick';}))
  ScriptApp.newTrigger('hskVocabTick').timeBased().everyMinutes(1).create();
 p.setProperty('HSK_AUTO50_WATCHDOG','scheduler_repaired');
}
/** Only adjusts the NEXT master size, never touches an in-flight batch. */
function hskAuto50BatchSize_(batches){
 var recent=batches.filter(function(r){return ['DONE','PARTIAL','REVIEW'].indexOf(r[3])>=0&&/^auto50_saved_/.test(String(r[4]||''));}).slice(-3);
 if(!recent.length)return 50;
 var ratios=recent.map(function(r){var m=String(r[4]).match(/auto50_saved_(\d+)_of_(\d+)/);return m?Number(m[1])/Math.max(1,Number(m[2])):0;});
 var avg=ratios.reduce(function(a,b){return a+b;},0)/ratios.length;
 return avg>=.88?50:avg>=.65?40:avg>=.4?30:20;
}
