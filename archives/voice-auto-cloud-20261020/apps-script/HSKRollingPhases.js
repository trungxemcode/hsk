/**
 * Minimal continuation after completed HSK2-4.
 * Order: HSK1 (150) -> HSK5 (1294) -> HSK6 (2440).
 * Failed Auto50 clips remain RETRY and roll into the next 50-word batch
 * while fresh vocabulary is available; after the last HSK6 fresh batch,
 * remaining failures become REVIEW for the owner, NEVER READY.
 *
 * Adds no TTS/ASR calls or new triggers and does not change provider models.
 * It is resumable across Apps Script execution limits.
 */
function hskRollingNormalize_(pin){
 return String(pin||'').normalize('NFC').toLowerCase().replace(/\s+/g,'');
}
function hskRollingCacheKey_(model,text,pinyin,level){
 // Keep exact legacy HSK2-4 identity. New-stage identity distinguishes every
 // pronunciation AND level, protecting 还(hái/huán), 长 and other polyphones.
 if([1,5,6].indexOf(Number(level))<0)return hskVocabKey_(model,text);
 return hskDigest_(JSON.stringify(['zh-CN','Kore',model,String(text),hskRollingNormalize_(pinyin),Number(level)]));
}
function hskRollingCorpus_(stage){
 var expected={'1':150,'5':1294,'6':2440},level=Number(stage);
 if(!expected[stage])throw Error('rolling_invalid_stage_'+stage);
 var all=hskTrialCorpus_(),items=all.filter(function(w){return Number(w.level)===level;});
 if(items.length!==expected[stage])throw Error('rolling_corpus_count_invalid_'+stage);
 var seen={};
 items.forEach(function(w){
  if(!w.text||!/\p{Script=Han}/u.test(w.text)||!w.pinyin)throw Error('rolling_invalid_corpus_word_'+stage);
  var key=w.text+'|'+hskRollingNormalize_(w.pinyin);
  if(seen[key])throw Error('rolling_duplicate_corpus_word_'+stage);
  seen[key]=1;
 });
 return items;
}
function hskRollingIsComplete234_(rows){
 var a=rows.filter(function(r){return [2,3,4].indexOf(Number(r[0]))>=0;});
 return a.length===1044&&a.every(function(r){return ['READY','EXISTING'].indexOf(r[3])>=0&&!!r[9];});
}
function hskRollingHasUpcoming_(p,rows){
 if(p.getProperty('HSK_ROLL_FINAL')==='true')return false;
 if(p.getProperty('HSK_ROLL_STAGE')||p.getProperty('HSK_ROLL_ENROLL'))return true;
 return hskRollingIsComplete234_(rows);
}
function hskRollingReport_(p,storage,rows,phase,status){
 p.setProperty('HSK_ROLL_STATUS',status);
 var book=storage.sheet.getParent(),sheet=book.getSheetByName('Tien_do_tu_vung');
 if(!sheet)return;
 var sets={'1':1,'5':5,'6':6};var level=sets[phase];
 var subset=rows.filter(function(r){return Number(r[0])===level;});
 var valid=subset.filter(function(r){return ['READY','EXISTING'].indexOf(r[3])>=0&&r[9];});
 var manual=rows.filter(function(r){return r[3]==='REVIEW'&&String(r[11]||'').indexOf('final_manual_review')===0;});
 sheet.getRange(15,1,6,2).setValues([
  ['Thu tu tu dong','HSK2-4 -> HSK1 -> HSK5 -> HSK6'],
  ['Giai doan',String(phase)],
  ['Muc trong giai doan',subset.length],
  ['READY / EXISTING',valid.length],
  ['Can kiem duyet thu cong',manual.length],
  ['Trang thai giai doan',status]
 ]);
}
function hskRollingEnqueue_(p,storage,tables,rows){
 var stage=String(p.getProperty('HSK_ROLL_ENROLL')||'');
 if(['1','5','6'].indexOf(stage)<0)return false;
 var corpus=hskRollingCorpus_(stage),cursor=Number(p.getProperty('HSK_ROLL_CURSOR')||0);
 if(!Number.isInteger(cursor)||cursor<0||cursor>corpus.length)throw Error('rolling_cursor_corrupt');
 var have={},cache={},append=[],at=cursor;
 rows.forEach(function(r){
  var key=r[1]+'|'+hskRollingNormalize_(r[2]);
  have[String(r[0])+'|'+key]=true;
  if(['READY','EXISTING'].indexOf(r[3])>=0&&r[9]&&
     !/^OWNER_APPROVED_NO_ASR/.test(String(r[11]||''))&&
     !(cache[key]&&cache[key][3]==='READY'))cache[key]=r;
 });
 while(at<corpus.length&&append.length<120){
  var w=corpus[at++],pin=hskRollingNormalize_(w.pinyin);
  var uid=stage+'|'+w.text+'|'+pin;
  if(have[uid])continue;
  have[uid]=true;
  var hit=cache[w.text+'|'+pin],reuse=hit&&hit[9]&&['READY','EXISTING'].indexOf(hit[3])>=0;
  append.push([Number(stage),w.text,w.pinyin,reuse?'EXISTING':'PENDING',0,0,'',
   reuse?hit[7]:'','',reuse?hit[9]:'','',reuse?'exact_hanzi_pinyin_cache_reuse':'',new Date().toISOString(),
   '','','',reuse?'https://drive.google.com/file/d/'+hit[9]+'/view':'']);
 }
 if(append.length){
  var sh=tables.queue,last=sh.getLastRow(),need=last+append.length;
  if(need>sh.getMaxRows())sh.insertRowsAfter(sh.getMaxRows(),need-sh.getMaxRows());
  sh.getRange(last+1,1,append.length,17).setValues(append);
  Array.prototype.push.apply(rows,append);
 }
 p.setProperty('HSK_ROLL_CURSOR',String(at));
 if(at===corpus.length){
  p.setProperty('HSK_ROLL_STAGE',stage);
  p.deleteProperty('HSK_ROLL_ENROLL');p.deleteProperty('HSK_ROLL_CURSOR');
  hskRollingReport_(p,storage,rows,stage,'RUNNING_HSK_'+stage);
 }else p.setProperty('HSK_ROLL_STATUS','ENROLLING_HSK_'+stage+'_'+at+'/'+corpus.length);
 return true;
}
function hskRollingFinalizeManual_(p,storage,tables,rows){
 // Bound Sheet mutations to <=80 words per invocation and persist a cursor.
 // Never lose the failed-audio evidence or silently promote a word to READY.
 var cursor=Number(p.getProperty('HSK_ROLL_FINAL_CURSOR')||0),changed=0;
 if(!Number.isInteger(cursor)||cursor<0||cursor>rows.length)throw Error('rolling_final_cursor_corrupt');
 for(var i=cursor;i<rows.length;i++){
  var r=rows[i];
  if([1,5,6].indexOf(Number(r[0]))<0||['READY','EXISTING'].indexOf(r[3])>=0)continue;
  if(String(r[11]||'').indexOf('final_manual_review_after_last_hsk6_batch|')===0)continue;
  var prior=String(r[11]||''),state=String(r[3]||'');
  r[3]='REVIEW';r[5]=0;
  r[11]='final_manual_review_after_last_hsk6_batch|'+state+'|'+prior.slice(0,110);
  hskVocabWrite_(tables.queue,i,r);
  changed++;
  if(changed>=80){
   p.setProperty('HSK_ROLL_FINAL_CURSOR',String(i+1));
   p.setProperty('HSK_ROLL_STATUS','PREPARING_MANUAL_REVIEW_'+(i+1)+'/'+rows.length);
   return true;
  }
 }
 p.deleteProperty('HSK_ROLL_FINAL_CURSOR');
 var pending=rows.filter(function(r){return r[3]==='REVIEW'&&String(r[11]||'').indexOf('final_manual_review_after_last_hsk6_batch|')===0;}).length;
 var fresh=rows.some(function(r){return [1,5,6].indexOf(Number(r[0]))>=0&&r[3]==='PENDING';});
 if(fresh)throw Error('rolling_finalize_with_fresh_words');
 p.setProperty('HSK_ROLL_FINAL','true');p.setProperty('HSK_ROLL_STAGE','DONE');
 hskRollingReport_(p,storage,rows,'6','DONE_WAIT_MANUAL_'+pending);
 hskVocabSummary_(storage,tables);
 var ctrl=storage.sheet.getParent().getSheetByName('Voice_Control');
 ctrl.getRange(2,2).setValue('PAUSE');
 ctrl.getRange(6,2).setValue(pending?'HSK1_5_6_DONE_MANUAL_REVIEW_'+pending:'HSK1_5_6_COMPLETE');
 hskVocabStop();
 return true;
}
/** Called from vocab tick only when no batch is actively recording/verifying. */
function hskRollingPhaseTick_(p,storage,tables,rows){
 if(p.getProperty('HSK_ROLL_FINAL')==='true')return true;
 if(!p.getProperty('HSK_ROLL_STAGE')&&!p.getProperty('HSK_ROLL_ENROLL')){
  if(!hskRollingIsComplete234_(rows))throw Error('HSK234_not_yet_complete_protect_ready');
  p.setProperty('HSK_ROLL_ENROLL','1');p.setProperty('HSK_ROLL_CURSOR','0');
 }
 if(p.getProperty('HSK_ROLL_ENROLL'))return hskRollingEnqueue_(p,storage,tables,rows);
 var stage=String(p.getProperty('HSK_ROLL_STAGE')||'1');
 if(!['1','5','6'].includes(stage))throw Error('rolling_invalid_active_stage_'+stage);
 var untried=rows.some(function(r){return Number(r[0])===Number(stage)&&r[3]==='PENDING';});
 if(untried)return false;
 var next={'1':'5','5':'6','6':'DONE'}[stage];
 if(next==='DONE')return hskRollingFinalizeManual_(p,storage,tables,rows);
 p.setProperty('HSK_ROLL_ENROLL',next);p.setProperty('HSK_ROLL_CURSOR','0');
 return hskRollingEnqueue_(p,storage,tables,rows);
}
