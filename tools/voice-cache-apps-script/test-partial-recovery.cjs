const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const words=['打电话','的','电视','读','对不起'];
function scenario(indices,status=200){
 const jobs=words.map((text,index)=>({text,index,key:'hash'+index,model:'gemini-2.5-flash-preview-tts'}));
 const records=[],retry=words.map((text,i)=>[i,text,1,0,'PENDING','batch_segment_count_mismatch']);
 const batch=['id001',JSON.stringify(jobs),'old_master_id','REJECTED','batch_segment_count_mismatch','2026-10-18',1];
 const props=new Map(),store=new Map(),network=[];
 const sheet={appendRow(r){records.push(r);},getRange(row,col,count,width){return {setValues(rows){records[row-2]=rows[0];},getValues(){return [records[row-2]];}}}};
 const queue={appendRow(r){retry.push(r)},getRange(row){return {setValues(x){retry[row-2]=x[0];}}}};
 const journal={getRange(row){return {setValues(x){batch.splice(0,7,...x[0]);}}}};
 const propsApi={getProperty:k=>props.get(k)||null,setProperty:(k,v)=>props.set(k,v)};
 const files=new Map();
 const storage={sheet,folder:{getFilesByName:name=>({hasNext:()=>files.has(name),next:()=>files.get(name)}),createFile:blob=>{
  const file={getId:()=>String(files.size+1)};files.set(blob.name,file);return file;}}};
 const context={console,Date,JSON,Array,Number,String,Error,Set,Math,
  hskBatchSplit_:(bytes,expected)=>{assert.equal(expected,4);return [1,2,3,4].map(i=>Array(64).fill(i))},
  DriveApp:{getFileById:id=>{assert.equal(id,'old_master_id');return {getBlob:()=>({getBytes:()=>Array(80).fill(0)})}}},
  UrlFetchApp:{fetch:(url,opt)=>{network.push({url,body:JSON.parse(opt.payload)});return {getResponseCode:()=>status,getContentText:()=>JSON.stringify({ok:true,verification:'double_asr_exact',indices})};}},
  ScriptApp:{getIdentityToken:()=>'test-identity'},
  Utilities:{base64Encode:bytes=>Buffer.from(bytes).toString('base64'),newBlob:(bytes,mime,name)=>({bytes,mime,name})},
  hskGetRow_:(s,key)=>{const idx=records.findIndex(r=>r[0]===key);return idx<0?null:{index:idx+2,values:records[idx]};},
  hskWarmProgress_:()=>{},hskBatchTable_:()=>journal,hskBatchRows_:(s,w)=>s===journal?[batch]:retry,
  hskWarmQueue_:()=>queue,hskCheck_:()=>storage,
  hskSettings_:()=>propsApi,
  LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})},
  SpreadsheetApp:{flush:()=>{}},
 };
 vm.createContext(context);
 vm.runInContext(fs.readFileSync(path.join(__dirname,'PartialRecovery.gs'),'utf8'),context);
 return {context,jobs,records,retry,batch,propsApi,storage,journal,queue,network,files};
}
const good=scenario([0,1,3,4]);
const result=good.context.hskBatchPartialRecover_(good.storage,good.journal,2,good.batch,good.queue,good.retry,good.propsApi);
assert.equal(result.kind,'partial');assert.equal(result.saved,4);assert.equal(good.batch[3],'PARTIAL');
assert.equal(good.records.length,4);assert.deepEqual(good.records.map(r=>r[0]),['hash0','hash1','hash3','hash4']);
assert.ok(good.records.every(r=>r[11]==='READY'&&r[12]==='partial_verified:id001'));
assert.equal(good.retry[2][4],'PENDING');assert.equal(good.retry[2][2],0);assert.equal(good.retry[2][5],'batch_missing_audio_verified');
assert.equal(good.retry.filter(r=>r[4]==='DONE').length,4);
assert.equal(good.network[0].body.action,'verify');assert.equal(good.network[0].body.clips.length,4);
const again=good.context.hskBatchPartialRecover_(good.storage,good.journal,2,good.batch,good.queue,good.retry,good.propsApi);
assert.equal(again.saved,0);assert.equal(good.records.length,4);assert.equal(good.files.size,4);
const uncertain=scenario([0,1,1,4]);
const u=uncertain.context.hskBatchPartialRecover_(uncertain.storage,uncertain.journal,2,uncertain.batch,uncertain.queue,uncertain.retry,uncertain.propsApi);
assert.equal(u.kind,'review');assert.equal(uncertain.records.length,0);
const offline=scenario(null,422);
assert.equal(offline.context.hskPartialHandleMismatch_(offline.storage,offline.journal,2,offline.batch,offline.queue,offline.retry,offline.propsApi),true);
assert.equal(offline.records.length,0);assert.equal(offline.propsApi.getProperty('HSK_WARM_ENABLED'),'false');
assert.equal(offline.batch[3],'REJECTED');
console.log('PASS: 4 verified WAVs saved and indexed READY; only missing #3 PENDING; rerun idempotent; invalid mapping and failed verifier never save.');
