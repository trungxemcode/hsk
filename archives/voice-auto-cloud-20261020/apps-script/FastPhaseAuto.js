/**
 * Minimal phase transition for the restored FAST 50-word scheduler.
 * The existing TTS, ASR, quality gate, Drive cache, model/key routing and
 * historic batches are untouched. This module never calls a provider.
 * Sequence: existing HSK2/3/4 -> HSK1 -> HSK5 -> HSK6.
 */
function hskFastPhaseLevels_(stage) {
 return stage==='234'?[2,3,4]:[Number(stage)];
}
function hskFastPhaseReport_(p,storage,rows,stage,status) {
 p.setProperty('HSK_FAST_PHASE_STATUS',status);
 var levels=hskFastPhaseLevels_(stage);
 var group=rows.filter(function(r){return levels.indexOf(Number(r[0]))>=0;});
 var complete=group.filter(function(r){return r[3]==='READY'||r[3]==='EXISTING';}).length;
 var sheet=storage.sheet.getParent().getSheetByName('Tien_do_tu_vung');
 if(sheet)sheet.getRange(15,1,6,2).setValues([
  ['Thứ tự tự động','HSK2–4 → HSK1 → HSK5 → HSK6'],
  ['Giai đoạn hiện tại',stage],
  ['Tổng mục giai đoạn',group.length],
  ['Đã đạt / có sẵn',complete],
  ['Chưa hoàn tất',group.length-complete],
  ['Tiến trình giai đoạn',status]
 ]);
}
function hskFastPhaseInit_(p,storage,rows) {
 if(p.getProperty('HSK_FAST_PHASE_STAGE'))return;
 p.setProperty('HSK_FAST_PHASE_STAGE','234');
 p.setProperty('HSK_FAST_PHASE_STATUS','AUTO_HSK_234');
 hskFastPhaseReport_(p,storage,rows,'234','AUTO_HSK_234');
}
/** Called early in vocab tick, only acts when enrolling a future phase. */
function hskFastPhaseEnrollTick_(p,storage,tables,rows) {
 var stage=p.getProperty('HSK_FAST_PHASE_ENROLL');
 if(!stage)return false;
 // Stage marker is durable: an interrupted append is rechecked against rows
 // before writing and never overwrites an existing READY/EXISTING clip.
 if(['1','5','6'].indexOf(stage)<0)throw Error('invalid_phase_enrollment');
 var corpus=hskTrialCorpus_().filter(function(w){return Number(w.level)===Number(stage);});
 var start=Math.max(0,Number(p.getProperty('HSK_FAST_PHASE_CURSOR')||0));
 if(start>corpus.length)throw Error('invalid_phase_cursor');
 var normalized=function(w){return String(w.text||'')+'\u0000'+hskVoiceRecPinyin_(w.pinyin);};
 var byStage=new Set(),cached=new Map(),count=0,add=[];
 rows.forEach(function(r){
  var key=normalized({text:r[1],pinyin:r[2]});
  if(Number(r[0])===Number(stage))byStage.add(key);
  if((r[3]==='READY'||r[3]==='EXISTING')&&r[9]&&!cached.has(key))cached.set(key,r);
 });
 // Add at most 160 new rows in one tick. The cursor records source positions;
 // if a trigger was interrupted after Sheets writes, rechecking rows prevents duplicates.
 var at=start;
 while(at<corpus.length&&add.length<160){
  var w=corpus[at++],key=normalized(w);
  if(byStage.has(key))continue;
  byStage.add(key);
  var existing=cached.get(key);
  add.push([w.level,w.text,w.pinyin,existing?'EXISTING':'PENDING',
   0,0,'',existing?existing[7]:'','',existing?existing[9]:'','','',
   hskVNTime_(new Date()),'','','',existing?'https://drive.google.com/file/d/'+existing[9]+'/view':'']);
 }
 if(add.length){
  var sheet=tables.queue,last=sheet.getLastRow(),required=last+add.length;
  if(required>sheet.getMaxRows())sheet.insertRowsAfter(sheet.getMaxRows(),required-sheet.getMaxRows());
  sheet.getRange(last+1,1,add.length,17).setValues(add);
  Array.prototype.push.apply(rows,add);
 }
 p.setProperty('HSK_FAST_PHASE_CURSOR',String(at));
 if(at===corpus.length){
  p.setProperty('HSK_FAST_PHASE_STAGE',stage);
  p.deleteProperty('HSK_FAST_PHASE_ENROLL');
  p.deleteProperty('HSK_FAST_PHASE_CURSOR');
  hskFastPhaseReport_(p,storage,rows,stage,'AUTO_HSK_'+stage);
 }else {
  p.setProperty('HSK_FAST_PHASE_STATUS','ENROLLING_HSK_'+stage+'_'+at+'_OF_'+corpus.length);
 }
 return true;
}
/** Invoked only when the existing 50-word pipeline has no work to send. */
function hskFastPhaseOnEmpty_(p,storage,tables,rows) {
 var stage=p.getProperty('HSK_FAST_PHASE_STAGE')||'234';
 if(stage==='DONE')return true;
 var levels=hskFastPhaseLevels_(stage);
 var missing=rows.filter(function(r){
  return levels.indexOf(Number(r[0]))>=0&&r[3]!=='READY'&&r[3]!=='EXISTING';
 });
 if(missing.length){
  // Hold / REVIEW / unknown state is never silently approved or regenerated.
  var states={};missing.forEach(function(r){states[r[3]]=(states[r[3]]||0)+1;});
  hskFastPhaseReport_(p,storage,rows,stage,'WAITING_UNRESOLVED_'+JSON.stringify(states).slice(0,140));
  return true;
 }
 var next=({'234':'1','1':'5','5':'6','6':'DONE'})[stage];
 if(!next)throw Error('unknown_phase_'+stage);
 if(next==='DONE'){
  p.setProperty('HSK_FAST_PHASE_STAGE','DONE');
  hskFastPhaseReport_(p,storage,rows,'6','ALL_HSK_1_TO_6_COMPLETE');
  hskVocabStop();return true;
 }
 p.setProperty('HSK_FAST_PHASE_ENROLL',next);
 p.setProperty('HSK_FAST_PHASE_CURSOR','0');
 return hskFastPhaseEnrollTick_(p,storage,tables,rows);
}
