/** Isolated end-to-end 50-word probe; no production queue/cache writes before the probe passes. */
function hskFull50TestProperties_(p){return {getProperty:function(k){return k==='HSK_FAST_PHASE_STAGE'?'234':p.getProperty('HSK_FULL50_TEST_'+k);},setProperty:function(k,v){p.setProperty('HSK_FULL50_TEST_'+k,String(v));return this;},deleteProperty:function(k){p.deleteProperty('HSK_FULL50_TEST_'+k);}};}
/** Verify the real text model rejects wrong tones/readings, inconsistent or missing evidence, and extra speech. */
function hskFull50JudgeCanary_(p,token){
 var prior=hskStableRead_(p,'HSK_FULL50_JUDGE_CANARY',null);if(prior&&prior.version==='strict-tone-v3')return prior;
 var refs=[['学习','xuéxí'],['晴','qíng'],['还','huán'],['老师','lǎoshī'],['北京','běijīng'],['护士','hùshi'],['学生','xuésheng']];
 var heard=[['学习','学习','xuéxí','xuéxí'],['请','请','qǐng','qǐng'],['还','还','hái','hái'],['老师','老师','lǎoshī','lǎoshí'],['','北京','','běijīng'],['护士','护士','hùshī','hùshī'],['我是学生','我是学生','wǒ shì xuésheng','wǒ shì xuésheng']];
 var pick=hskStableAsrSlot_(p,Date.now());if(!pick.slot)throw Error('canary_wait_for_asr_key');
 var result;
 try{result=hskVocabCall_(token,{action:'judge-50',keySlot:pick.slot,references:refs.map(function(x,i){return {id:i+1,text:x[0],pinyin:x[1]};}),evidence:heard.map(function(x,i){return {clip:i+1,hanzi:x.slice(0,2),pinyin:x.slice(2)};})});}
 catch(e){hskStableAsrError_(p,pick.slot,e.detail||{},String(e.message||e));throw e;}
 var decisions=result.decisions||[],pass=decisions.length===7&&decisions.some(function(d){return d.clip===1&&d.target===1&&d.verdict==='PASS';})&&decisions.filter(function(d){return d.clip!==1;}).every(function(d){return d.verdict!=='PASS';});
 var report={version:'strict-tone-v3',passed:pass,decisions:decisions};p.setProperty('HSK_FULL50_JUDGE_CANARY',JSON.stringify(report));return report;
}
function hskFull50Route_(p,storage,tables,rows,batches,token,started){
 if(p.getProperty('HSK_AUTO50_ENABLED')!=='true')return false;
 var gate=p.getProperty('HSK_FULL50_SMOKE');
 if(gate==='FAIL'&&p.getProperty('HSK_FULL50_SMOKE_STATUS')==='TEXT_JUDGE_ACCURACY_CANARY_FAILED'){
  var oldCheck=hskStableRead_(hskFull50TestProperties_(p),'HSK_FULL50_JUDGE_CANARY',null);
  if(oldCheck&&oldCheck.version!=='strict-tone-v3'){gate='PASS';p.setProperty('HSK_FULL50_SMOKE','PASS');}
 }
 if(gate==='PASS'){
  try{var checked=hskFull50JudgeCanary_(hskFull50TestProperties_(p),token);if(!checked.passed){p.setProperty('HSK_FULL50_SMOKE','FAIL');p.setProperty('HSK_FULL50_SMOKE_STATUS','TEXT_JUDGE_ACCURACY_CANARY_FAILED');return false;}p.setProperty('HSK_FULL50_TEXT_CANARY','PASS');if(/CANARY/.test(p.getProperty('HSK_FULL50_SMOKE_STATUS')||''))p.setProperty('HSK_FULL50_SMOKE_STATUS','PASS_FULL50_AND_STRICT_TONE_CANARY');}
  catch(e){p.setProperty('HSK_FULL50_SMOKE_STATUS','WAIT_TEXT_JUDGE_CANARY_'+String(e.message||e).slice(0,100));return true;}
  if(p.getProperty('HSK_FULL50_REQUEUE_LEGACY')!==HSK_FULL50_VERSION_){
   rows.forEach(function(r,i){if(r[3]!=='REVIEW'||r[11]!=='fixed_input_three_masters_unverified;needs_targeted_repair')return;var before=r.slice();r[3]='RETRY';r[5]=0;r[11]='retry_full50_gemini_judge_new_pipeline';hskCongestionAudit_(storage,'FULL50_REQUEUE_OLD_MATCHER',r[1],r[6],before,r);hskVocabWrite_(tables.queue,i,r);});
   p.setProperty('HSK_FULL50_REQUEUE_LEGACY',HSK_FULL50_VERSION_);
  }
  return hskFull50Tick_(p,storage,tables,rows,batches,token,started);
 }
 if(gate==='FAIL')return false;
 // Finish an already-paid legacy master before starting the isolated probe.
 if(batches.some(function(b){return ['TTS_CHUNKS','MASTER','VERIFY','AUTO_VERIFY','RESERVED','UNCERTAIN'].indexOf(b[3])>=0;}))return false;
 var bookId=p.getProperty('HSK_FULL50_TEST_BOOK'),folderId=p.getProperty('HSK_FULL50_TEST_FOLDER');
 if(!bookId||!folderId){
  var sample=rows.filter(function(r){return [2,3,4].indexOf(Number(r[0]))>=0&&hskStableDone_(r)&&Array.from(hskCongestionSpeech_(r[1])).length>=2;}).slice(0,50);
  if(sample.length!==50){p.setProperty('HSK_FULL50_SMOKE','FAIL');p.setProperty('HSK_FULL50_SMOKE_ERROR','need_50_certified_sample_words');return false;}
  var book=SpreadsheetApp.create('TEST_HSK_Full50_GeminiJudge_20261021'),folder=DriveApp.createFolder('TEST_HSK_Full50_GeminiJudge_20261021'),cache=book.getSheets()[0];cache.setName('Kho_Voice');
  cache.getRange(1,1,1,13).setValues([['Key','Lang','Voice','Model','File','MIME','Bytes','Created','Last','Reuse','Slot','State','Proof']]);
  var testStorage={sheet:cache,folder:folder},testTables=hskVocabTables_(testStorage);
  var source=sample.map(function(r){var out=Array(17).fill('');out[0]=r[0];out[1]=r[1];out[2]=r[2];out[3]='PENDING';return out;});testTables.queue.getRange(2,1,50,17).setValues(source);
  p.setProperty('HSK_FULL50_TEST_BOOK',book.getId());p.setProperty('HSK_FULL50_TEST_FOLDER',folder.getId());p.setProperty('HSK_FULL50_SMOKE','RUNNING');p.setProperty('HSK_FULL50_SMOKE_STATUS','ISOLATED_50_WORDS_PREPARED');return true;
 }
 var testBook=SpreadsheetApp.openById(bookId),testStorage={sheet:testBook.getSheetByName('Kho_Voice'),folder:DriveApp.getFolderById(folderId)},testTables=hskVocabTables_(testStorage),testRows=hskVocabRows_(testTables.queue,17),testBatches=hskVocabRows_(testTables.batches,11),tp=hskFull50TestProperties_(p);
 function finished(){
  var b=testBatches[0];if(!b||hskFull50Active_(b))return false;
  var info=hskFull50Info_(b),done=testRows.filter(hskStableDone_).length,passed=['DONE','PARTIAL'].indexOf(b[3])>=0&&done>=30&&JSON.parse(b[1]).length===50&&info.ranges&&info.ranges.length===50&&info.gap===1.2&&!!info.judgeId;
  if(passed){try{var canary=hskFull50JudgeCanary_(tp,token);passed=canary.passed;}catch(e){p.setProperty('HSK_FULL50_SMOKE_STATUS','WAIT_TEXT_JUDGE_CANARY_'+String(e.message||e).slice(0,100));return true;}}
  p.setProperty('HSK_FULL50_SMOKE',passed?'PASS':'FAIL');p.setProperty('HSK_FULL50_SMOKE_STATUS',(passed?'PASS':'FAIL')+'_'+done+'_OF_50_'+b[4]);
  if(passed){var proven=tp.getProperty('HSK_STABLE_TTS_PIN');if(proven){p.setProperty('HSK_FULL50_PREVIOUS_TTS_PIN',p.getProperty('HSK_STABLE_TTS_PIN')||'');p.setProperty('HSK_STABLE_TTS_PIN',proven);}p.setProperty('HSK_FULL50_ENABLED','true');p.deleteProperty('HSK_VOCAB_RETRY_AT');p.deleteProperty('HSK_VOCAB_ERROR');}
  return true;
 }
 if(finished())return true;
 hskFull50Tick_(tp,testStorage,testTables,testRows,testBatches,token,started);
 var active=testBatches.find(hskFull50Active_);p.setProperty('HSK_FULL50_SMOKE_STATUS',active?active[3]+' — '+active[4]:'ISOLATED_PROBE');finished();return true;
}
function hskFull50Progress_(storage,p,rows,batches){
 var gate=p.getProperty('HSK_FULL50_SMOKE'),active=batches.find(hskFull50Active_);if(!gate&&!active)return false;
 var s=storage.sheet.getParent().getSheetByName('Tien_do');if(!s)return false;
 if(gate!=='PASS'){
  s.getRange(35,1,4,2).setValues([['Quy trình đang thử','Một master 50 từ → khoảng lặng 1,2s → băm → hai ASR → Gemini đối chiếu'],['Test bản sao',gate+' — '+(p.getProperty('HSK_FULL50_SMOKE_STATUS')||'')],['Sheet test',p.getProperty('HSK_FULL50_TEST_BOOK')?'https://docs.google.com/spreadsheets/d/'+p.getProperty('HSK_FULL50_TEST_BOOK')+'/edit':''],['Triển khai','Chỉ đổi auto sau khi test đủ 50 clip và ít nhất 30 từ kiểm đạt']]);
  if(gate==='RUNNING')s.getRange(7,2).setValue('Đang thử quy trình 50 từ trên bản sao — '+(p.getProperty('HSK_FULL50_SMOKE_STATUS')||''));
  else s.getRange(7,2).setValue('Kiểm tra trước triển khai chưa đạt — '+(p.getProperty('HSK_FULL50_SMOKE_STATUS')||''));
  s.getRange(39,1,1,2).setValues([['Kết quả kiểm chuẩn text',p.getProperty('HSK_FULL50_TEST_HSK_FULL50_JUDGE_CANARY')||'Chờ kết quả']]);
  return true;
 }
 var stages={FULL50_TTS:'Chờ tạo một master',FULL50_GENERATING:'Đang tạo một master',FULL50_UNCERTAIN:'Kiểm tra master đã gửi, tránh tạo trùng',FULL50_SEGMENT:'Chuẩn hóa khoảng lặng và băm',FULL50_ASR:'Hai lượt nhận diện độc lập',FULL50_JUDGE:'Gemini đối chiếu chữ Hán và pinyin',FULL50_SAVE:'Ghi kết quả đã được Gemini duyệt'};
 var info=active?hskFull50Info_(active):{},count=active?JSON.parse(active[1]).length:0;
 s.getRange(7,2).setValue(active?stages[active[3]]+' — '+count+' từ'+(info.tail?' (lô cuối giai đoạn)':''):'Đang chuẩn bị lô 50 từ tiếp theo');
 s.getRange(13,2,4,1).setValues([['Một master 50 từ → khoảng lặng 1,2s → băm → hai ASR → Gemini đối chiếu → lưu'],[active?active[3]:'FULL50_NEXT_BATCH'],[active?active[4]:p.getProperty('HSK_FULL50_STATUS')||''],[active?active[7]:'']]);
 s.getRange(39,1,1,2).setValues([['Kết quả kiểm chuẩn text',p.getProperty('HSK_FULL50_TEST_HSK_FULL50_JUDGE_CANARY')||'Chờ kết quả']]);
 var pin=hskStableRead_(p,'HSK_STABLE_TTS_PIN',{});s.getRange(35,1,4,2).setValues([['Quy trình',HSK_FULL50_VERSION_],['Key tạo / kiểm','TTS '+(pin.slot||'chờ')+' / ASR '+(p.getProperty('HSK_STABLE_ASR_PIN')||'chờ')],['Test 50 từ bản sao',(p.getProperty('HSK_FULL50_SMOKE_STATUS')||'')+'; kiểm chuẩn text '+(p.getProperty('HSK_FULL50_TEXT_CANARY')||'chờ')],['Lô hiện tại',active?active[0].slice(0,16)+'; '+count+' từ; khoảng lặng 1,2s':'Chờ lô tiếp theo']]);return true;
}
