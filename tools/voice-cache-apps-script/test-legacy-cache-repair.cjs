'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const src=fs.readFileSync(__dirname+'/LegacyCacheRepair.gs','utf8');
function setup(){
 const corpus=Array(120).fill('unused');
 corpus[27]='饭馆';corpus[30]='高兴';corpus[67]='名字';corpus[68]='哪里 (哪儿)';
 const key=(model,text)=>crypto.createHash('sha256').update(JSON.stringify(['zh-CN','Kore',model,text])).digest('hex');
 const model='gemini-2.5-flash-preview-tts';
 const rows=[27,30,67,68].map((i,j)=>[key(model,corpus[i]),'zh-CN','Kore',model,'','audio/wav',0,'time','time',0,0,j===1?'READY':'DEFERRED',j===1?'':'tts_provider_unavailable']);
 rows[1][4]='already-ready';rows[1][6]=888;
 const props=new Map();const fileMap=new Map(),retry=[];
 const saves=[], controlState={B2:'AUTO_CYCLE',B55:'ON'};
 const cache={getLastRow:()=>rows.length+1,getRange:(r,c,h,w)=>({getValues:()=>rows,getValue:()=>null,setValues:v=>{if(w===13){rows[r-2]=v[0];saves.push({at:r,values:v[0].slice()})}}})};
 const queue={getLastRow:()=>retry.length+1,getRange:(r,c,h,w)=>({getValues:()=>retry,setValues:v=>{retry[r-2]=v[0]}}),appendRow:r=>retry.push(r)};
 const control={getRange:(r,c,h,w)=>({getValue:()=>r===2?controlState.B2:r===55?controlState.B55:'',setValue:v=>{if(r===55)controlState.B55=v},setValues:v=>{}})};
 const folder={getFilesByName:name=>({hasNext:()=>fileMap.has(name),next:()=>fileMap.get(name)}),createFile:blob=>{const f={getId:()=>blob.name,getBlob:()=>({getBytes:()=>blob.bytes})};fileMap.set(blob.name,f);return f;}};
 const env={Date,Array,Number,Math,String,Object,JSON,SpreadsheetApp:{flush:()=>{}},LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})},ScriptApp:{getIdentityToken:()=>'identity'},
  hskVocabKey_:key,hskWarmCorpus_:()=>corpus,hskWarmQueue_:()=>queue,hskVocabRows_:sheet=>retry,
  hskCheck_:()=>({sheet:cache,folder}),HSK_VOCAB_URL_:'https://worker.example/voice-precache',
  hskParallelDecode_:()=>({bytes:Array(100).fill(1),providerAttempts:1}),
  hskBatchPcm_:()=>[1,2],
  hskVocabCall_:(token,body)=>body.action==='status'?{slots:[{slot:4,retryAfter:0}]}:{verification:'double_asr_exact',verified:[true],transcripts:[['饭馆'],['饭馆']],pinyin:[['fànguǎn'],['fànguǎn']]},
  hskVoiceRecHanzi_:x=>String(x).replace(/[\\s\\p{P}]/gu,''),hskVoiceRecPinyin_:x=>String(x).replace(/[\\s\\p{P}]/gu,''),
  UrlFetchApp:{fetch:()=>({getResponseCode:()=>200,getContentText:()=>'{}'})},
  Utilities:{base64Encode:()=> 'AA==',newBlob:(bytes,mime,name)=>({bytes,mime,name})},
  DriveApp:{getFileById:id=>({getId:()=>id,getBlob:()=>({getBytes:()=>fileMap.get(id).getBlob().getBytes()})})}};
 vm.runInNewContext(src,env);
 const p={getProperty:k=>props.get(k),setProperty:(k,v)=>props.set(k,v),deleteProperty:k=>props.delete(k)};
 return {env,p,rows,props,cache,queue,retry,control,controlState,folder,fileMap,saves,run:()=>env.hskLegacyCacheRepairTick_(p,null,control)};
}
test('legacy backlog discovers exact SHA-256 only; preserves existing READY',()=>{
 const w=setup();const tasks=w.env.hskLegacyCandidates_(w.rows,w.env.hskWarmCorpus_());
 assert.equal(tasks.length,3);assert.equal(tasks[0].index,27);assert.equal(tasks.some(x=>x.index===30),false);
});
test('TTS WAV is first staged VERIFY_PENDING then marked READY only after exact double-ASR',()=>{
 const w=setup();let fetches=0;w.env.UrlFetchApp.fetch=()=>{fetches++;return {getResponseCode:()=>200,getContentText:()=>'{}'};};
 w.run();assert.equal(w.rows[0][11],'VERIFY_PENDING');assert.ok(w.rows[0][4]);assert.equal(fetches,1);
 assert.notEqual(w.rows[0][11],'READY');assert.equal(w.rows[1][11],'READY');
 w.props.set('HSK_LEGACY_REPAIR_NEXT','0');w.run();
 assert.equal(w.rows[0][11],'READY');assert.equal(w.retry.find(x=>x[0]===27)[4],'DONE');
 assert.equal(fetches,1);assert.equal(w.rows[1][4],'already-ready');
});
test('ASR mismatch leaves file available for review and never marks READY',()=>{
 const w=setup();w.run();w.props.set('HSK_LEGACY_REPAIR_NEXT','0');
 w.env.hskVocabCall_=(token,body)=>({verification:'double_asr_exact',verified:[false],transcripts:[['其他'],['其他']],pinyin:[['qítā'],['qítā']]});
 w.run();assert.equal(w.rows[0][11],'REVIEW');assert.ok(w.rows[0][4]);
 assert.equal(w.retry.find(x=>x[0]===27)[4],'REVIEW');
});
test('journaled transport-uncertain request is never resent',()=>{
 const w=setup();w.rows[0][11]='REPAIR_REQUESTED';let calls=0;
 w.env.UrlFetchApp.fetch=()=>{calls++;throw Error('TTS should not repeat')};
 w.run();assert.equal(w.rows[0][11],'UNCERTAIN');assert.equal(calls,0);
});
test('feature flag OFF does no work and cannot mutate cache',()=>{
 const w=setup();w.controlState.B55='OFF';w.run();assert.equal(w.rows[0][11],'DEFERRED');assert.equal(w.retry.length,0);
});

test('existing READY 3.1 audio is reused and ASR-verified without additional TTS',()=>{
 const w=setup(),sha=crypto.createHash('sha256').update(JSON.stringify(['zh-CN','Kore','gemini-3.1-flash-tts-preview','饭馆'])).digest('hex');
 w.rows.push([sha,'zh-CN','Kore','gemini-3.1-flash-tts-preview','cached-3.1.wav','audio/wav',100,'time','time',0,4,'READY','']);
 w.fileMap.set('cached-3.1.wav',{getId:()=> 'cached-3.1.wav',getBlob:()=>({getBytes:()=>Array(100).fill(1)})});
 let calls=0;w.env.UrlFetchApp.fetch=()=>{calls++;throw Error('TTS should not be called');};
 w.run();assert.equal(w.rows[0][11],'VERIFY_PENDING','repair_state='+w.props.get('HSK_LEGACY_REPAIR_LAST'));assert.equal(w.rows[0][4],'cached-3.1.wav');
 assert.equal(calls,0);
 w.props.set('HSK_LEGACY_REPAIR_NEXT','0');w.run();assert.equal(w.rows[0][11],'READY');
 assert.match(w.rows[0][12],/reused_alternate_model/);
});
test('new legacy TTS requests prefer available 3.1 rather than failing original 2.5',()=>{
 const w=setup();let body;
 w.env.UrlFetchApp.fetch=(url,args)=>{body=JSON.parse(args.payload);return {getResponseCode:()=>200,getContentText:()=>'{}'};};
 w.run();assert.equal(body.model,'gemini-3.1-flash-tts-preview');
 assert.equal(w.rows[0][11],'VERIFY_PENDING');
});

test('ASR provider outage defers only one VERIFY_PENDING item and creates next missing WAV',()=>{
 const w=setup();
 w.rows[0][11]='VERIFY_PENDING';w.rows[0][4]='existing-asr.wav';w.rows[0][6]=100;
 w.fileMap.set('existing-asr.wav',{getId:()=> 'existing-asr.wav',getBlob:()=>({getBytes:()=>Array(100).fill(1)})});
 const original=w.env.hskVocabCall_;
 w.env.hskVocabCall_=(token,body)=>{
  if(body.action==='verify-words')throw Error('vocabulary_verification_uncertain');
  return original(token,body);
 };
 let tts=0;w.env.UrlFetchApp.fetch=()=>{tts++;return {getResponseCode:()=>200,getContentText:()=>''};};
 w.run();
 assert.equal(w.rows[0][11],'VERIFY_PENDING');
 assert.equal(tts,0);
 assert.ok(Number(w.props.get('HSK_LEGACY_ITEM_27_AFTER'))>Date.now());
 assert.match(w.props.get('HSK_LEGACY_REPAIR_LAST'),/asr_deferred_27/);
 w.props.set('HSK_LEGACY_REPAIR_NEXT','0');
 w.run();
 assert.equal(w.rows[2][11],'VERIFY_PENDING');
 assert.equal(tts,1);
 assert.equal(w.rows[0][11],'VERIFY_PENDING');
 assert.equal(w.rows[1][4],'already-ready');
});
