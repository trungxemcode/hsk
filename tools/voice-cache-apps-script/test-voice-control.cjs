'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(__dirname+'/VoiceControl.gs','utf8');
function scenario(expected,heard,pinyin){
 const jobs=Array.from({length:50},(_,i)=>({row:i,text:i===4?'公斤':'待核实'+i,pinyin:i===4?'gōngjīn':'zàihéshí',model:'gemini-2.5-flash-preview-tts'}));
 const recovery=Array.from({length:49},(_,i)=>[i+1,i*1100+100,i*1100+700,i<4?'REVIEW':'PENDING',0,'','','','','','','','','']);
 recovery[0][3]='READY';recovery[0][9]=2;
 recovery[1][3]='READY';recovery[1][9]=4;
 const batch=['batch',JSON.stringify(jobs),'master','REVIEW','','',10,'model',4,62,''];
 let saveCount=0,asrItems=[],notes=[];
 const table=(rows)=>({getRange:()=>({getValues:()=>rows,setValues:(v)=>{if(v.length===1&&v[0].length===14)rows[v[0][0]-1]=v[0]}})});
 const batchSheet=table([batch]),recSheet=table(recovery);
 const book={getSheetByName:(name)=>name==='Voice_Vocab_Batches'?batchSheet:name==='Voice_Recovery_50'?recSheet:null};
 const control={getRange:(row,col,height,width)=>({getValue:()=>row===3?'batch':'master',setValue:(v)=>{notes.push([row,v])},setValues:(v)=>{notes.push([row,v])}})};
 const properties={map:{},getProperty(k){return this.map[k]||''},setProperty(k,v){this.map[k]=v},deleteProperty(k){delete this.map[k]}};
 const vaultSheet={appendRow:()=>saveCount++};
 const storage={sheet:vaultSheet,folder:{createFile:()=>({getId:()=>('file-'+saveCount++)})}};
 const context={
   SpreadsheetApp:{},DriveApp:{getFileById:()=>({getBlob:()=>({getBytes:()=>[0,1,2,3]})})},
   Utilities:{base64Encode:()=>('aGVsbG8='),base64Decode:()=>[1,2,3],newBlob:()=>({})},
   ScriptApp:{getIdentityToken:()=>('test')},
   hskVocabRows_:(s)=>s===batchSheet?[batch]:jobs.map(()=>Array(17).fill('')),
   hskCheck_:()=>storage,hskBatchPcm_:()=>new Array(4000000).fill(0),
   hskVocabTables_:()=>({queue:{getRange:()=>({setValues:()=>{}})}}),
   hskVocabKey_:()=>('key'),hskVocabWrite_:()=>{},hskWav_:()=>[1,2,3],
   hskGetRow_:()=>null,hskVocabSummary_:()=>{},
   hskVocabCall_:(tok,input)=>{asrItems=input.items;return {verification:'double_asr_exact',transcripts:[[heard],[heard]],pinyin:[[pinyin],[pinyin]]}},
   Date,Set,JSON,Math,Number,String,Error,Array
 };
 vm.runInNewContext(source,context,{filename:'VoiceControl.gs'});
 context.hskVoiceRecoverTick_(properties,book,control);
 return {recovery,saveCount,asrItems,notes,properties};
}
test('only one previously unseen clip sent to double-pass blind ASR',()=>{
 const r=scenario('公斤','公交','gōngjiāo');
 assert.equal(r.asrItems.length,1);
 assert.equal(r.asrItems[0],'公斤');
 assert.equal(r.recovery[4][3],'RECHECK');
 assert.equal(r.saveCount,0);
});
test('a transcript/pinyin mismatch never commits READY',()=>{
 const r=scenario('公斤','公斤','gōngjiàn');
 assert.equal(r.recovery[4][3],'RECHECK');
 assert.equal(r.saveCount,0);
});
test('two matching Hanzi+pinyin passes can save a previously unverified clip',()=>{
 const r=scenario('公斤','公斤','gōngjīn');
 assert.equal(r.recovery[4][3],'READY');
 assert.ok(r.saveCount>0);
 assert.equal(r.recovery[4][10],'公斤');
});
