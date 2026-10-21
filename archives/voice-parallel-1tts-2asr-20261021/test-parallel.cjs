'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=n=>fs.readFileSync(path.join(__dirname,n),'utf8');
function table(data=[]){return {data:structuredClone(data),getLastRow(){return this.data.length+1},getRange(row,col,n=1,m=1){const self=this;return {getValues:()=>Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>self.data[row-2+i]?.[col-1+j]??'')),setValues(v){v.forEach((r,i)=>{const dest=self.data[row-2+i]||=Array(17).fill('');r.forEach((x,j)=>dest[col-1+j]=x)});return this},getValue(){return self.data[row-2]?.[col-1]??''},setValue(v){this.setValues([[v]]);return this}}},appendRow(row){this.data.push([...row])}}}
function fixture(){
 const pstore=new Map(Object.entries({HSK_PV_ENABLED:'true',HSK_AUTO50_ENABLED:'true',HSK_VOCAB_ENABLED:'true',HSK_VOCAB_PILOT_ONLY:'false',HSK_VOICE_PAUSED:'false',HSK_VOICE_SHEET_ID:'sheet'}));
 const props={getProperty:k=>pstore.get(k)||null,setProperty(k,v){pstore.set(k,String(v));return this},deleteProperty(k){pstore.delete(k);return this}};
 const words=[['你好','nǐhǎo'],['学校','xuéxiào'],['中国','zhōngguó']];
 const queue=table(words.map(([w,p],i)=>[1,w,p,'MASTER',1,0,'batch'+i,'model','master'+i,'','','','old','','','','']));
 const batches=table(words.map(([w,p],i)=>['batch'+i,JSON.stringify([{row:i,text:w,pinyin:p,level:1,model:'model'}]),'master'+i,'AUTO_VERIFY','', 'old',1,'model',1,1,'{}']));
 const clips=table(words.map((_,i)=>['batch'+i,1,0,100,'PENDING',0,'','','','',0,'','','','old']));
 const control=table([[],['','AUTO_CYCLE']]); // control.getRange(2,2) indexes data[0]
 control.data[0]=['','AUTO_CYCLE'];
 const cache=table(),tabs={queue,batches};const book={getSheetByName:n=>n==='Voice_Control'?control:n==='Voice_Auto_Clips'?clips:n==='Voice_Vocab_Batches'?batches:null};cache.getParent=()=>book;
 const storage={sheet:cache,folder:{}},shared={owner:null,next:0,events:[],transcribe:null,saved:[],triggers:[],tts:0};
 function context(name){
  const lock={tryLock(){if(shared.owner&&shared.owner!==name)return false;shared.owner=name;return true},releaseLock(){assert.equal(shared.owner,name);shared.owner=null},waitLock(){assert.equal(shared.owner,null);shared.owner=name},hasLock(){return shared.owner===name}};
  const c={Date,Math,JSON,String,Number,Set,Map,Array,console:{warn(){},log(){}},Utilities:{getUuid:()=>name+'-'+(++shared.next),formatDate:()=> '2026-10-21T14:00:00.000+07:00',base64Encode:()=> 'clip'},LockService:{getScriptLock:()=>lock},SpreadsheetApp:{openById:()=>book,flush(){}},ScriptApp:{getIdentityToken:()=> 'test-token',getProjectTriggers:()=>shared.triggers,newTrigger(handler){return {timeBased(){return this},everyMinutes(){return this},create(){shared.triggers.push({getHandlerFunction:()=>handler})}}}},DriveApp:{getFileById:()=>({getBlob:()=>({getBytes:()=> [0,0]})})},UrlFetchApp:{fetch(){assert.equal(shared.owner,null);shared.tts++;return 'tts-result'}}};
  vm.createContext(c);for(const n of ['AutoCycle.js','ParallelVerify.js','ParallelVerifyBatch.js'])vm.runInContext(read(n),c,{filename:n});
  Object.assign(c,{hskSettings_:()=>props,hskCheck_:()=>storage,hskVocabTables_:()=>tabs,hskVocabRows_:(s,n)=>s.data.map(r=>structuredClone(r.slice(0,n))),hskVocabTable_:()=>clips,hskBatchPcm_:()=>Array(48000).fill(0),hskWav_:x=>x,hskVoiceRecHanzi_:x=>String(x).replace(/\s/g,''),hskVoiceRecPinyin_:x=>String(x).replace(/\s/g,''),hskVocabWrite_:(s,i,r)=>s.getRange(i+2,1,1,17).setValues([r]),hskVocabSummary_:()=>{},hskVocabCall_:(token,body)=>{assert.equal(shared.owner,null,'ASR must not hold sheet lock');shared.events.push('ASR '+name);if(shared.transcribe)shared.transcribe(name,body);return {transcripts:[[body.items[0]],[body.items[0]]],pinyin:[[body.pinyin[0]],[body.pinyin[0]]]}}});
  c.hskAuto50Cache_=(s,job)=>{assert.equal(shared.owner,name,'cache writes require lock');let old=shared.saved.find(x=>x.text===job.text&&x.pin===job.pinyin);if(old)return {file:old.file,model:'model',existing:true};const file='file'+job.row;shared.saved.push({text:job.text,pin:job.pinyin,file});return {file,model:'model',existing:false}};
  return {c,lock};
 }
 return {props,pstore,queue,batches,clips,control,cache,storage,tabs,shared,context};
}
test('two consumers overlap their ASR with one producer; disjoint claims and serial commits',()=>{
 const f=fixture(),one=f.context('one'),two=f.context('two'),gen=f.context('gen'),extra=f.context('extra');
 f.shared.transcribe=(name)=>{
  if(name==='one')two.c.hskParallelCheck2Tick();
  if(name==='two'){
   assert.equal(f.shared.owner,null);assert.equal(one.c.hskPVLive_(JSON.parse(f.props.getProperty('HSK_PV_LANE_1'))),true);
   assert.equal(gen.lock.tryLock(),true);assert.equal(gen.c.hskPVProducerEnter_(f.props,gen.lock),true);
   assert.equal(gen.c.hskPVTtsFetch_(['new-batch'],'url',{}),'tts-result');
   assert.equal(extra.c.hskPVClaim_(f.props,1,f.batches.data),null,'same lane cannot start a second execution');
   gen.c.hskPVRelease_();gen.lock.releaseLock();
  }
 };
 one.c.hskParallelCheck1Tick();
 assert.equal(f.shared.tts,1);assert.equal(f.shared.saved.length,2);assert.deepEqual(f.queue.data.slice(0,2).map(x=>x[3]),['READY','READY']);
 assert.deepEqual(f.clips.data.slice(0,2).map(x=>x[12]),['file0','file1']);assert.deepEqual(f.batches.data.map(x=>x[3]),['DONE','DONE','AUTO_VERIFY']);
 assert.equal(f.props.getProperty('HSK_PV_LANE_1'),null);assert.equal(f.props.getProperty('HSK_PV_LANE_2'),null);
});
test('live producer lease rejects a second producer even when network lock is released',()=>{
 const f=fixture(),a=f.context('a'),b=f.context('b');a.lock.tryLock();assert.equal(a.c.hskPVProducerEnter_(f.props,a.lock),true);a.lock.releaseLock();b.lock.tryLock();assert.equal(b.c.hskPVProducerEnter_(f.props,b.lock),false);b.lock.releaseLock();
});
test('expired checker lease is recoverable; stale lease cannot commit',()=>{
 const f=fixture(),a=f.context('a');f.props.setProperty('HSK_PV_LANE_1',JSON.stringify({batch:'batch0',token:'dead',until:Date.now()-1}));a.lock.tryLock();const claim=a.c.hskPVClaim_(f.props,1,f.batches.data);assert.equal(claim.lease.batch,'batch0');
 a.c.HSK_PV_CONTEXT_={p:f.props,key:claim.key,token:'dead',lock:a.lock};assert.throws(()=>a.c.hskPVAssert_(),/lease_lost/);
});
test('per-master ASR backoff cannot stall TTS or another master',()=>{
 const f=fixture(),a=f.context('a');const p=a.c.hskPVProps_(f.props,'batch0');p.setProperty('HSK_VOCAB_RETRY_AT',Date.now()+900000);p.setProperty('HSK_VOCAB_ERROR','asr_waiting_provider');assert.equal(f.props.getProperty('HSK_VOCAB_RETRY_AT'),null);assert.equal(a.c.hskPVProps_(f.props,'batch1').getProperty('HSK_VOCAB_ERROR'),null);
 a.lock.tryLock();assert.equal(a.c.hskPVClaim_(f.props,1,f.batches.data).lease.batch,'batch1');
});
test('two provider votes remain mandatory and mismatched tones never become READY',()=>{
 const f=fixture(),a=f.context('a');a.c.hskVocabCall_=()=>({transcripts:[['你好'],['你好']],pinyin:[['nǐhǎo'],['níhào']]});for(let i=0;i<3;i++)a.c.hskParallelCheck1Tick();assert.equal(f.shared.saved.length,0);assert.equal(f.queue.data[0][3],'RETRY');assert.equal(f.clips.data[0][4],'REVIEW');
});
test('pause during ASR discards stale response and leaves existing voice intact',()=>{
 const f=fixture(),a=f.context('a');f.shared.transcribe=()=>f.control.getRange(2,2).setValue('PAUSE');a.c.hskParallelCheck1Tick();assert.equal(f.shared.saved.length,0);assert.equal(f.queue.data[0][3],'MASTER');assert.equal(f.clips.data[0][5],0);
});
test('source edit during ASR cannot overwrite a user change',()=>{
 const f=fixture(),a=f.context('a');f.shared.transcribe=()=>{f.queue.data[0][1]='改';};a.c.hskParallelCheck1Tick();assert.equal(f.shared.saved.length,0);assert.equal(f.queue.data[0][1],'改');assert.equal(f.clips.data[0][5],0);
});
test('crashed paid TTS is quarantined and never silently regenerated',()=>{
 const f=fixture(),a=f.context('a');f.batches.data[0][3]='TTS_CHUNKS';f.props.setProperty('HSK_PV_TTS_INFLIGHT',JSON.stringify({batch:'batch0',token:'dead'}));a.lock.tryLock();assert.equal(a.c.hskPVRecoverInflight_(f.props,f.tabs,f.batches.data),true);assert.equal(f.batches.data[0][3],'UNCERTAIN');assert.equal(f.shared.tts,0);assert.match(f.props.getProperty('HSK_PV_LAST_UNCERTAIN'),/dead/);
});
test('generator reservation excludes legacy pending rows belonging to an existing master',()=>{
 const f=fixture(),a=f.context('a');f.queue.data[0][3]='PENDING';a.c.hskPVReserve_(f.tabs,f.queue.data,f.batches.data);assert.equal(f.queue.data[0][3],'MASTER');assert.equal(f.queue.data[0][6],'batch0');
});
test('overlapping journals fail closed rather than checking or regenerating the same word',()=>{
 const f=fixture(),a=f.context('a');f.batches.data[1][1]=f.batches.data[0][1];assert.throws(()=>a.c.hskPVReserve_(f.tabs,f.queue.data,f.batches.data),/overlapping_batches/);
});
test('lease heartbeat installs exactly two checker timers and respects PAUSE',()=>{
 const f=fixture(),a=f.context('a');a.c.hskPVEnsure_(f.props);a.c.hskPVEnsure_(f.props);assert.equal(f.shared.triggers.length,2);f.control.getRange(2,2).setValue('PAUSE');a.c.hskParallelCheck1Tick();assert.equal(f.shared.events.length,0);
});
test('active masters block HSK stage handoff and final manual review',()=>{
 const f=fixture(),a=f.context('a');vm.runInContext(read('HSKRollingPhases.js'),a.c);assert.equal(a.c.hskRollingPhaseTick_(f.props,f.storage,f.tabs,f.queue.data),false);assert.equal(f.props.getProperty('HSK_ROLL_STAGE'),null);
});
test('existing release timezone and all original non-scheduler modules are byte-identical',()=>{
 assert.equal(JSON.parse(read('appsscript.json')).timeZone,'Asia/Ho_Chi_Minh');
 const before=path.join(__dirname,'../parallel-current');if(fs.existsSync(before)){
  const changed=new Set(['AutoCycle.js','HSKRollingPhases.js','Vocabulary.js','VoiceChunkedTTS.js','VoiceControl.js']);
  for(const n of fs.readdirSync(before).filter(n=>/\.(js|json)$/.test(n)&&!changed.has(n)))assert.equal(read(n),fs.readFileSync(path.join(before,n),'utf8'),n);
 }
});
test('lost commit lock never permits saving stale ASR evidence',()=>{
 const f=fixture(),a=f.context('a');a.lock.waitLock=()=>{throw Error('busy')};a.c.hskParallelCheck1Tick();assert.equal(f.shared.saved.length,0);assert.equal(f.queue.data[0][3],'MASTER');assert.equal(f.clips.data[0][5],0);assert.ok(f.props.getProperty('HSK_PV_LANE_1'),'lease remains until expiry after a hard lock timeout');
});
test('ASR provider outage is scoped to its batch and leaves the other consumer operational',()=>{
 const f=fixture(),a=f.context('a'),b=f.context('b');a.c.hskVocabCall_=()=>{const e=Error('asr_provider_unavailable');e.detail={retryAfter:300};throw e};a.c.hskParallelCheck1Tick();assert.equal(f.props.getProperty('HSK_VOCAB_RETRY_AT'),null);assert.equal(f.clips.data[0][5],0);b.c.hskParallelCheck2Tick();assert.equal(f.queue.data[1][3],'READY');assert.equal(f.queue.data[0][3],'MASTER');
});
test('producer advances while a master is being checked, but bounds the waiting backlog at three',()=>{
 const f=fixture(),a=f.context('a');vm.runInContext(read('Vocabulary.js'),a.c);
 Object.assign(a.c,{hskVoiceControlPoll_:()=>false,hskRollingPhaseTick_:()=>false,hskVoiceTtsModels_:()=>[],hskShared50Pair_:()=>({slot:1,model:'model',mi:0}),hskDigest_:()=> 'new-batch',hskRollingCacheKey_:(m,t)=>t});
 // Keep test storage methods after loading production definitions.
 a.c.hskVocabRows_=(s,n)=>s.data.map(r=>structuredClone(r.slice(0,n)));a.c.hskVocabTables_=()=>f.tabs;a.c.hskVocabSummary_=()=>{};
 f.props.setProperty('HSK_VOCAB_TTS_STRATEGY','chunks-v1');f.props.setProperty('HSK_VOCAB_BATCH_SIZE','50');f.queue.data.push([5,'新词','xīncí','PENDING',0,0,'','','','','','','','','','','']);f.queue.data.push([5,'学习','xuéxí','PENDING',0,0,'','','','','','','','','','','']);
 a.c.hskVocabTickWork_();assert.equal(f.batches.data.length,3,'three unverified masters apply backpressure');
 f.batches.data[2][3]='DONE';a.c.hskVocabTickWork_();assert.equal(f.batches.data.length,4);assert.equal(f.batches.data[3][3],'TTS_CHUNKS');assert.equal(JSON.parse(f.batches.data[3][1]).length,2);assert.equal(f.shared.tts,0,'reservation itself cannot call paid TTS');
});
test('producer remains enabled while checks are in flight even when no fresh words exist',()=>{
 const f=fixture(),a=f.context('a');f.batches.data[2][3]='DONE';vm.runInContext(read('Vocabulary.js'),a.c);
 Object.assign(a.c,{hskVoiceControlPoll_:()=>false,hskRollingPhaseTick_:()=>false,hskVoiceTtsModels_:()=>[],hskVocabRows_:(s,n)=>s.data.map(r=>structuredClone(r.slice(0,n))),hskVocabTables_:()=>f.tabs,hskVocabSummary_:()=>{}});
 a.c.hskVocabTickWork_();assert.equal(f.props.getProperty('HSK_VOCAB_ENABLED'),'true');assert.equal(f.shared.tts,0);
});
test('paid TTS marker survives a reply without a durable WAV checkpoint',()=>{
 const f=fixture(),a=f.context('a');a.lock.tryLock();a.c.hskPVProducerEnter_(f.props,a.lock);a.c.hskPVTtsFetch_(f.batches.data[0],'url',{});a.c.hskPVRelease_();assert.ok(f.props.getProperty('HSK_PV_TTS_INFLIGHT'));
});
test('paid TTS marker clears only after the changed durable checkpoint is flushed',()=>{
 const f=fixture(),a=f.context('a');a.lock.tryLock();a.c.hskPVProducerEnter_(f.props,a.lock);a.c.hskPVTtsFetch_(f.batches.data[0],'url',{});f.batches.data[0][4]='SAVED_1-10';a.c.hskPVRelease_();assert.equal(f.props.getProperty('HSK_PV_TTS_INFLIGHT'),null);
});
test('stale producer cleanup cannot delete its successor lease or paid-call marker',()=>{
 const f=fixture(),a=f.context('a');a.lock.tryLock();a.c.hskPVProducerEnter_(f.props,a.lock);a.c.hskPVTtsFetch_(f.batches.data[0],'url',{});f.batches.data[0][4]='SAVED';f.props.setProperty('HSK_PV_PRODUCER',JSON.stringify({token:'successor',until:Date.now()+420000}));f.props.setProperty('HSK_PV_TTS_INFLIGHT',JSON.stringify({batch:'batch1',token:'successor'}));a.c.hskPVRelease_();assert.match(f.props.getProperty('HSK_PV_PRODUCER'),/successor/);assert.match(f.props.getProperty('HSK_PV_TTS_INFLIGHT'),/successor/);
});
