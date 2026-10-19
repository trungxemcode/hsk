'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),test=require('node:test');
const code=fs.readFileSync('C:/Users/LENOVO/hsk-voice-mail-reports/Code.js','utf8');
function harness(quota=90){
 const sent=[], stored={}, triggers=[],sheetVals=new Map([[33,'ENABLED']]);
 let h2=0, clock=Date.UTC(2026,9,19,9,0);
 const ctl={getRange(range){return {
  getValue(){return sheetVals.get(parseInt(range.match(/\d+/)?.[0]||0))||'ENABLED';},
  setValue(x){sheetVals.set(parseInt(range.match(/\d+/)?.[0]||0),x);},
  setValues(x){const row=parseInt(range.match(/\d+/)?.[0]||0);x.forEach((a,i)=>sheetVals.set(row+i,a[0]));}
 }}};
 const prog={getRange:()=>({getValues:()=>[['Äang cháº¡y'],[1044],[87],[0],[6],[951],[23],[246],['HSK2'],['HSK3'],['HSK4'],['']]})};
 const batch={getLastRow:()=>2,getRange:()=>({getValues:()=>[['batch',JSON.stringify(Array.from({length:50},(_,i)=>({text:'t'+i}))), 'master','AUTO_VERIFY','',null,null,null,null,null,null]]})};
 const clips={getLastRow:()=>2,getRange:()=>({getValues:()=>[['batch',1,10,110,'READY',1]]})};
 const spreadsheet={getSheetByName:(n)=>({Voice_Control:ctl,Tien_do_tu_vung:prog,Voice_Vocab_Batches:batch,Voice_Auto_Clips:clips})[n]};
 const script={getProjectTriggers:()=>triggers,newTrigger:(name)=>({timeBased:()=>({everyMinutes:(n)=>({create:()=>triggers.push({getHandlerFunction:()=>name,minutes:n})})})}),deleteTrigger:t=>triggers.splice(triggers.indexOf(t),1)};
 const mock={
  Date:class extends Date{constructor(...args){super(...(args.length?args:[clock]));}},
  JSON,Number,Math,Array,Error,Set,String,Object,
  SpreadsheetApp:{openById:()=>spreadsheet},
  Session:{getEffectiveUser:()=>({getEmail:()=>('owner@example.com')})},
  ScriptApp:script,MailApp:{getRemainingDailyQuota:()=>quota,sendEmail:(m)=>sent.push(m)},
  PropertiesService:{getScriptProperties:()=>({getProperty:(k)=>stored[k],setProperties:(o)=>Object.assign(stored,o)})},
  LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})},
  Utilities:{formatDate:(now,tz,fmt)=>fmt==='H'?'16':fmt==='yyyyMMdd'?'20261019':'16:00'}
 };
 vm.runInNewContext(code,mock,{filename:'Code.js'});
 return {mock,sent,triggers,sheetVals,stored};
}
test('one setup installs exactly one every-ten-minute trigger and sends first report',()=>{
 const x=harness();
 assert.equal(x.mock.setupHSKMailReports(),'SENT');
 assert.equal(x.triggers.length,1);
 assert.equal(x.triggers[0].minutes,10);
 assert.equal(x.mock.setupHSKMailReports(),'ALREADY_SENT_RECENTLY');
 assert.equal(x.triggers.length,1);
 assert.equal(x.sent.length,1);
 assert.equal(x.sent[0].to,'owner@example.com');
 assert.match(x.sent[0].body,/87 \/ 1044/);
});
test('email automatically prevents repeated send inside ten minutes',()=>{
 const x=harness();
 assert.equal(x.mock.sendHSKProgressEmail(),'SENT');
 assert.equal(x.mock.sendHSKProgressEmail(),'ALREADY_SENT_RECENTLY');
 assert.equal(x.sent.length,1);
});
test('low quota does not send email',()=>{
 const x=harness(3);
 assert.equal(x.mock.sendHSKProgressEmail(),'MAIL_QUOTA_LOW');
 assert.equal(x.sent.length,0);
});
test('disabled owner control disables reporting',()=>{
 const x=harness();
 x.sheetVals.set(33,'DISABLED');
 assert.equal(x.mock.sendHSKProgressEmail(),'DISABLED_BY_OWNER');
 assert.equal(x.sent.length,0);
});
