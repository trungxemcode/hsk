/**
 * Independent Gmail progress reporter for the HSK vocabulary TTS project.
 * Runs separately from the voice-generation Apps Script. No API keys, no public routes.
 * Google owner authorizes once by running setupHSKMailReports.
 */
var HSK_REPORT_BOOK_ID = '1QOh-dFg-Lf3Ig-9ti6zGIYffNN5hs3ITjq1RjT2xNzk';
function hskReportRecipient_(){
  var recipient=Session.getEffectiveUser().getEmail();
  if(!recipient||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(recipient))
    throw new Error('Unable to resolve owner email for private progress report');
  return recipient;
}
var HSK_REPORT_TIMEZONE = 'Asia/Ho_Chi_Minh';
var HSK_REPORT_DAILY_LIMIT = 84;
var HSK_REPORT_START_HOUR = 8;
var HSK_REPORT_END_HOUR = 22;

function hskReportBook_() { return SpreadsheetApp.openById(HSK_REPORT_BOOK_ID); }
function hskReportMeta_(book) {
  var control = book.getSheetByName('Voice_Control');
  if (!control) throw new Error('Voice_Control_missing');
  return control;
}
function hskReportSnapshot_(book) {
  var prog = book.getSheetByName('Tien_do_tu_vung');
  if (!prog) throw new Error('Tien_do_tu_vung_missing');
  var v = prog.getRange('B2:B13').getValues().map(function(r){return r[0];});
  var ctl = hskReportMeta_(book);
  var batches = book.getSheetByName('Voice_Vocab_Batches');
  var last = batches && batches.getLastRow() > 1
    ? batches.getRange(batches.getLastRow(),1,1,11).getValues()[0] : [];
  var jobs = [];
  try { jobs = JSON.parse(last[1] || '[]'); } catch(e) {}
  var batchId=String(last[0]||'');
  var counts = {READY:0, EXISTING:0, PENDING:0, RECHECK:0, REVIEW:0};
  var rec = book.getSheetByName('Voice_Auto_Clips');
  if (rec && rec.getLastRow()>1) {
    var n=Math.min(500,rec.getLastRow()-1);
    var rows=rec.getRange(rec.getLastRow()-n+1,1,n,6).getValues();
    rows.forEach(function(r){if(String(r[0])===batchId) {
      var state=String(r[4]||'PENDING');
      counts[state]=(counts[state]||0)+1;
    }});
  }
  return {
    state:String(v[0]||''),total:Number(v[1]||0),
    ready:Number(v[2]||0),existing:Number(v[3]||0),
    review:Number(v[4]||0),pending:Number(v[5]||0),
    tts:Number(v[6]||0),asr:Number(v[7]||0),
    level2:String(v[8]||''),level3:String(v[9]||''),level4:String(v[10]||''),
    error:String(v[11]||'').slice(0,120),
    command:String(ctl.getRange('B2').getValue()||''),
    worker:String(ctl.getRange('B6').getValue()||''),
    batchId:batchId,batchState:String(last[3]||''),
    batchError:String(last[4]||'').slice(0,90),
    jobs:jobs.length,masterId:String(last[2]||''),
    clips:counts
  };
}
function hskReportText_(s, now, lastReady) {
  var time=Utilities.formatDate(now,HSK_REPORT_TIMEZONE,'dd/MM/yyyy HH:mm');
  var diff=s.ready-lastReady;
  var delta=(diff>=0?'+':'')+diff;
  var clips=Object.keys(s.clips).filter(function(k){return s.clips[k]>0;})
    .map(function(k){return k+': '+s.clips[k];}).join(' | ');
  return [
    'BÁO CÁO TIẾN ĐỘ HSK VOICE — '+time+' (GMT+7)',
    '',
    'Trạng thái: '+s.state+' | Điều khiển: '+s.command+' | '+s.worker,
    'READY: '+s.ready+' / '+s.total+' ('+delta+' từ từ báo cáo trước)',
    'Cần kiểm lại: '+s.review+' | Chưa xử lý: '+s.pending,
    'Tổng lượt TTS: '+s.tts+' | ASR: '+s.asr,
    '',
    'LÔ TTS GẦN NHẤT:',
    'Mã lô: '+(s.batchId||'—').slice(0,16),
    'Số từ: '+s.jobs+' | Trạng thái: '+(s.batchState||'—'),
    'Trạng thái các đoạn: '+(clips||'đang chuẩn bị'),
    'Master: '+(s.masterId?'https://drive.google.com/file/d/'+s.masterId+'/view':'chưa có'),
    s.batchError?'Lỗi lô: '+s.batchError:'',
    s.error?'Lỗi/quota: '+s.error:'',
    '',
    'Google Sheet: https://docs.google.com/spreadsheets/d/'+HSK_REPORT_BOOK_ID+'/edit#gid=1833102820',
    'Kho voice Drive: https://drive.google.com/drive/folders/154s3taqv3dBAPEuMJwLo1Df3Gz_iq5UX',
    '',
    'Chỉ những file qua kiểm tra chữ Hán và pinyin mới được đưa vào READY.',
    'Tự động gửi trong khoảng 08:00–22:00 (giờ Việt Nam), mỗi 10 phút khi quota cho phép.',
    'Dừng báo cáo: đổi Voice_Control!B33 thành DISABLED.'
  ].filter(function(x){return x!==''||true;}).join('\n');
}
function setupHSKMailReports(){
  var lock=LockService.getScriptLock();if(!lock.tryLock(5000))return 'BUSY';
  try {
    var book=hskReportBook_(), ctl=hskReportMeta_(book);
    // Consent-required MailApp access is isolated from the production voice script.
    var available=MailApp.getRemainingDailyQuota();
    var triggers=ScriptApp.getProjectTriggers();
    if(!triggers.some(function(t){return t.getHandlerFunction()==='sendHSKProgressEmail';}))
      ScriptApp.newTrigger('sendHSKProgressEmail').timeBased().everyMinutes(10).create();
    ctl.getRange('A31:B35').setValues([
      ['Email_report','ENABLED'],
      ['Report_recipient',hskReportRecipient_()],
      ['Report_control','ENABLED'],
      ['Report_last_sent','NOT_SENT'],
      ['Report_status','TRIGGER_INSTALLED; quota='+available]
    ]);
  } finally {lock.releaseLock();}
  return sendHSKProgressEmail();
}
function sendHSKProgressEmail(){
  var lock=LockService.getScriptLock();if(!lock.tryLock(3000))return 'BUSY';
  var props=PropertiesService.getScriptProperties(),book=null,control=null;
  try {
    var now=new Date(),ts=now.getTime();
    book=hskReportBook_();control=hskReportMeta_(book);
    if(String(control.getRange('B33').getValue()||'ENABLED').toUpperCase()==='DISABLED')
      return 'DISABLED_BY_OWNER';
    var hour=Number(Utilities.formatDate(now,HSK_REPORT_TIMEZONE,'H'));
    if(hour<HSK_REPORT_START_HOUR||hour>=HSK_REPORT_END_HOUR) return 'OUTSIDE_DAYTIME_WINDOW';
    var last=Number(props.getProperty('LAST_MAIL_TIME')||0);
    if(last>0 && ts-last<9*60*1000) return 'ALREADY_SENT_RECENTLY';
    var date=Utilities.formatDate(now,HSK_REPORT_TIMEZONE,'yyyyMMdd');
    var same=date===props.getProperty('LAST_MAIL_DATE');
    var count=same?Number(props.getProperty('MAIL_SENT_TODAY')||0):0;
    if(count>=HSK_REPORT_DAILY_LIMIT) return 'DAILY_REPORT_LIMIT';
    var left=MailApp.getRemainingDailyQuota();
    if(left<=5) {control.getRange('B35').setValue('MAIL_QUOTA_LOW');return 'MAIL_QUOTA_LOW';}
    var s=hskReportSnapshot_(book);
    var previous=Number(props.getProperty('LAST_READY')||s.ready);
    var subject='[HSK Voice] '+s.ready+'/'+s.total+' READY — '+Utilities.formatDate(now,HSK_REPORT_TIMEZONE,'HH:mm');
    MailApp.sendEmail({to:hskReportRecipient_(),subject:subject,body:hskReportText_(s,now,previous),name:'HSK Voice Progress'});
    props.setProperties({
      LAST_MAIL_TIME:String(ts), LAST_MAIL_DATE:date,
      MAIL_SENT_TODAY:String(count+1), LAST_READY:String(s.ready)
    });
    control.getRange('B34:B35').setValues([[now.toISOString()],['SENT; '+(count+1)+' today']]);
    return 'SENT';
  } catch(e) {
    if(control)try{control.getRange('B35').setValue('ERROR: '+String(e.message||e).slice(0,115));}catch(ignore){}
    throw e;
  } finally{lock.releaseLock();}
}
function stopHSKMailReports(){
  ScriptApp.getProjectTriggers().filter(function(t){return t.getHandlerFunction()==='sendHSKProgressEmail';})
    .forEach(function(t){ScriptApp.deleteTrigger(t);});
  hskReportMeta_(hskReportBook_()).getRange('B33:B35')
    .setValues([['DISABLED'],[''],['STOPPED_BY_OWNER']]);
  return 'STOPPED';
}
