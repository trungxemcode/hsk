// Visible timestamps in the HSK workbook use Vietnam local time.
// Preserve their ISO-8601 offset so Date.parse and existing worker logic stay correct.
function hskVNTime_(date){
 var d=date instanceof Date?date:new Date(date||Date.now());
 if(!isFinite(d.getTime()))return '';
 return Utilities.formatDate(d,'Asia/Ho_Chi_Minh',"yyyy-MM-dd'T'HH:mm:ss.SSS'+07:00'");
}
function hskVNText_(value){
 if(typeof value!=='string'||value.indexOf('Z')<0)return value;
 return value.replace(/\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z\b/g,function(t){return hskVNTime_(new Date(t));});
}
function hskVNColumn_(sheet,col,quiet){
 var n=sheet.getLastRow()-1;if(n<1)return 0;
 var rg=sheet.getRange(2,col,n,1),v=rg.getValues(),formulas=rg.getFormulas(),modified=0,hasFormula=false;
 for(var i=0;i<n;i++){
  if(formulas[i][0]){hasFormula=true;continue;}
  var newer=hskVNText_(v[i][0]);if(newer!==v[i][0]){v[i][0]=newer;modified++;}
 }
 if(!modified)return 0;
 if(hasFormula){for(var j=0;j<n;j++)if(!formulas[j][0]&&typeof v[j][0]==='string'&&v[j][0].indexOf('+07:00')>=0)rg.getCell(j+1,1).setValue(v[j][0]);}
 else rg.setValues(v);
 return modified;
}
function hskVNApplySheetTimes_(book){
 if(book.getSpreadsheetTimeZone()!=='Asia/Ho_Chi_Minh')book.setSpreadsheetTimeZone('Asia/Ho_Chi_Minh');
 var targets={
  'Kho_Voice':[8,9],
  'Voice_Auto_Clips':[15],
  'Voice_Vocabulary':[13],
  'Voice_Vocab_Batches':[6],
  'Voice_Long_Pilots':[6],
  'Voice_Batches':[6],
  'Tien_do':[2],
  'Tien_do_tu_vung':[2],
  'Voice_Control':[2],
  'Voice_Recovery_50':[14],
  'Hướng_dẫn':[2]
 };
 var changes=0;
 Object.keys(targets).forEach(function(name){
  var sheet=book.getSheetByName(name);if(!sheet)return;
  targets[name].forEach(function(c){changes+=hskVNColumn_(sheet,c);});
 });
 var kho=book.getSheetByName('Kho_Voice');
 if(kho){kho.getRange(1,8,1,2).setValues([['Ngày tạo (giờ VN, UTC+7)','Lần dùng cuối (giờ VN, UTC+7)']]);}
 var vocab=book.getSheetByName('Voice_Vocabulary');
 if(vocab){
  vocab.getRange('R1').setValue('Lịch thử lại (giờ VN)');
  hskVNRetryDisplay_(vocab,6,18);
 }
 var retry=book.getSheetByName('Voice_Retry');
 if(retry){
  retry.getRange('G1').setValue('Lịch thử lại (giờ VN)');
  hskVNRetryDisplay_(retry,4,7);
 }
 return changes;
}
// Write concrete values only for rows with queue records. Whole-column ARRAYFORMULA
// previously made getLastRow() count 1000 empty rows as vocabulary entries.
function hskVNRetryDisplay_(sheet,sourceCol,outputCol){
 var count=sheet.getLastRow()-1;if(count<1)return;
 var source=sheet.getRange(2,sourceCol,count,1).getValues();
 var display=source.map(function(r){
  var timestamp=Number(r[0]);
  return [timestamp>0&&isFinite(timestamp)?Utilities.formatDate(new Date(timestamp),'Asia/Ho_Chi_Minh','dd/MM/yyyy HH:mm:ss'):''];
 });
 sheet.getRange(2,outputCol,count,1).setValues(display);
}
function hskVNPausedMigration_(p,book){
 if(p.getProperty('HSK_VN_TIME_MIGRATED_V1')==='true')return;
 var lock=LockService.getScriptLock();
 if(!lock.tryLock(1000))return;
 try{
  var changed=hskVNApplySheetTimes_(book);
  p.setProperty('HSK_VN_TIME_MIGRATED_V1','true');
  p.setProperty('HSK_VN_TIME_CHANGED',String(changed));
  var control=book.getSheetByName('Voice_Control');
  if(control){
   control.getRange('A51:B52').setValues([
    ['Múi giờ dữ liệu','Việt Nam (UTC+7)'],
    ['Đã đổi thời gian',changed+' ô; '+hskVNTime_(new Date())]
   ]);
  }
  SpreadsheetApp.flush();
 }finally{lock.releaseLock();}
}

function hskVNPeriodicNormalize_(p,book){
 if(p.getProperty('HSK_VN_TIME_MIGRATED_V1')!=='true')return;
 var now=Date.now(),previous=Number(p.getProperty('HSK_VN_LAST_SYNC_AT')||0);
 if(now-previous<300000)return;
 var lock=LockService.getScriptLock();
 if(!lock.tryLock(100))return;
 try{
  hskVNApplySheetTimes_(book);
  p.setProperty('HSK_VN_LAST_SYNC_AT',String(now));
 }catch(e){
  p.setProperty('HSK_VN_LAST_SYNC_ERROR',String(e&&e.message||'time_sync_error').slice(0,85));
 }finally{lock.releaseLock();}
}
