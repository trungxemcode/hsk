/** Read-only dashboard: never changes queue, retries, triggers or provider settings. */
function hskVoiceProgressRefresh_(storage,p){
 p=p||hskSettings_();storage=storage||hskCheck_(p);
 var book=storage.sheet.getParent(),sheet=book.getSheetByName('Tien_do')||book.insertSheet('Tien_do');
 var cache=hskVocabRows_(storage.sheet,13),keys=new Set();
 cache.forEach(function(r){if(r[0]&&r[4]&&r[11]==='READY')keys.add(String(r[0]));});
 var queue=book.getSheetByName('Voice_Vocabulary'),words=queue?hskVocabRows_(queue,17):[];
 var journal=book.getSheetByName('Voice_Vocab_Batches'),batches=journal?hskVocabRows_(journal,11):[];
 var active=batches.find(function(b){return ['TTS_CHUNKS','MASTER','VERIFY','AUTO_VERIFY','RESERVED','UNCERTAIN'].indexOf(b[3])>=0;});
 var last=batches.filter(function(b){return ['DONE','PARTIAL'].indexOf(b[3])>=0;}).pop();
 var retry=Number(p.getProperty('HSK_VOCAB_RETRY_AT')||0),now=Date.now();
 var paused=p.getProperty('HSK_VOICE_PAUSED')==='true'||String((book.getSheetByName('Voice_Control')||sheet).getRange(2,2).getValue()).trim()==='PAUSE';
 var enabled=p.getProperty('HSK_VOCAB_ENABLED')==='true';
 var error=String(p.getProperty('HSK_VOCAB_ERROR')||'');
 var total=Number(sheet.getRange(2,2).getValue())||11281,ready=keys.size;
 var status=paused?'Tạm dừng':retry>now?'Đang chờ retry; tự chạy tiếp':!enabled?'Đang dừng':active?({
 TTS_CHUNKS:'Đang tạo audio cho lô 50',MASTER:'Đang tách audio',
 VERIFY:'Đang kiểm âm',AUTO_VERIFY:'Đang kiểm âm hai lượt',
 RESERVED:'Đang chờ kết quả tạo audio',UNCERTAIN:'Cần kiểm tra kết quả tạo audio'
 }[active[3]]):'Đang chuẩn bị lô tiếp theo';
 if(ready>=total)status='Hoàn tất';
 var step=active?String(active[4]||active[3]):'';
 var values=[
 ['Kho voice tự động','Gemini Kore / tiếng Trung'],['Tổng câu',total],
 ['Đã có audio',ready],['Chưa có audio',Math.max(0,total-ready)],
 ['Sẽ thử lại',words.filter(function(r){return r[3]==='RETRY';}).length],
 ['Cần kiểm tra',words.filter(function(r){return r[3]==='REVIEW';}).length],
 ['Trạng thái',status],['Cập nhật gần nhất',new Date(now).toISOString()],
 ['Chạy lại sau',retry>now?new Date(retry).toISOString():''],
 ['Lượt gọi tạo audio / chu kỳ 24h',Number(p.getProperty('HSK_VOCAB_WINDOW_CALLS')||0)],
 ['Phút đã dùng / chu kỳ 24h',Math.round(Number(p.getProperty('HSK_VOCAB_RUNTIME_MS')||0)/6000)/10],
 ['Lỗi hiện tại',error],['Cơ chế','Lô 50; lưu sau hai lượt ASR; từ chưa đạt chuyển lô sau'],
 ['Bước hiện tại',step],['Kết quả lô gần nhất',last?String(last[4]||last[3]):''],
 ['Model lô hiện tại',active?String(active[7]||''):'']
 ];
 sheet.getRange(1,1,values.length,2).setValues(values);
 return {ready:ready,total:total,status:status,step:step};
}
/** Keep the existing owner trigger and entry point. Refresh even on early return or failure. */
function hskVocabTick(){
 try{return hskVocabTickWork_();}
 finally{try{hskVoiceProgressRefresh_();}catch(e){console.warn('voice_progress_refresh_failed');}}
}
