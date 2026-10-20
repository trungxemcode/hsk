'use strict';
const test=require('node:test'), assert=require('node:assert/strict'), fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(__dirname+'/Voice38Canary.gs','utf8');
function build(){
 const props=new Map(), state={command:'RUN_38_HSK_ONCE'};
 const rows=[[4,'别的','bié de','READY',0,0,'','','','old-file','','','', '', '', '', ''],
  [4,'生活','shēng huó','PENDING',0,0,'','','','','','','','','','',''],
  [4,'生命','shēng mìng','PENDING',0,0,'','','','','','','','','','','']];
 const cache=[],blobs=new Map();let ttsCalls=0,asrCalls=0,sheetsUpdated=0,exact=true,unknown=false;
 const folder={getFilesByName:name=>({hasNext:()=>blobs.has(name),next:()=>blobs.get(name)}),createFile:blob=>{
   if(blobs.has(blob.name))throw Error('duplicate_file');
   const f={getId:()=>blob.name,getBlob:()=>({getBytes:()=>blob.bytes})};
   blobs.set(blob.name,f);return f;}};
 const queue={getLastRow:()=>rows.length+1,
  getRange:(r,c,h,w)=>({getValues:()=>[rows[r-2].slice()]} )};
 const cacheSheet={appendRow:record=>cache.push(record),
  getRange:(r,c,h,w)=>({setValues:values=>{cache[r-2]=values[0];sheetsUpdated++;}})};
 const control={getRange:(r,c)=>({getValue:()=>r===94&&c===4?state.command:r===2&&c===2?'AUTO_CYCLE':'',
   setValue:value=>{if(r===94&&c===4)state.command=value;}})};
 const p={getProperty:k=>props.get(k),setProperty:(k,v)=>props.set(k,String(v)),deleteProperty:k=>props.delete(k)};
 const env={Date,Math,JSON,Array,Number,String,Object,Set,
  LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})},
  ScriptApp:{getIdentityToken:()=>'token-not-persisted'},
  SpreadsheetApp:{flush:()=>{}},
  hskCheck_:()=>({sheet:cacheSheet,folder}),
  hskVocabTables_:()=>({queue}),
  hskVocabRows_:()=>rows,
  hskVocabKey_:(model,text)=>'key-'+model+'-'+text,
  hskVocabWrite_:(sheet,idx,row)=>{rows[idx]=row;sheetsUpdated++;},
  hskVoiceRoutePairs_:()=>({pairs:[{model:'gemini-3.8-flash-lite-tts',slot:12}]}),
  hskGetRow_:(sheet,key)=>{let i=cache.findIndex(x=>x[0]===key);return i<0?null:{index:i+2,values:cache[i]};},
  hskBatchPcm_:bytes=>{assert.ok(bytes.length>44);},
  hskParallelDecode_:response=>unknown?(()=>{throw Error('response_uncertain');})():{
    bytes:new Array(120).fill(0),providerAttempts:1},
  hskVocabCall_:(tok,body)=>{if(body.action==='verify-words'){asrCalls++;return {
    verification:'double_asr_exact',verified:[exact],
    transcripts:exact?[['生活'],['生活']]:[['生命'],['生命']],
    pinyin:exact?[['shēng huó'],['shēng huó']]:[['shēng mìng'],['shēng mìng']]
   };}throw Error('unexpected action');},
  hskVoiceRecHanzi_:s=>String(s).replace(/\\s/g,''),
  hskVoiceRecPinyin_:s=>String(s).replace(/\\s/g,''),
  UrlFetchApp:{fetch:(url,opts)=>{ttsCalls++;const b=JSON.parse(opts.payload);
    assert.equal(b.model,'gemini-3.8-flash-lite-tts');assert.equal(b.text,'生活');
    assert.equal(b.keySlot,12);assert.equal(opts.headers.Authorization,'Bearer token-not-persisted');
    return {getResponseCode:()=>200,getContentText:()=> '{}'};}},
  HSK_VOCAB_URL_:'https://unit-test.invalid',
  Utilities:{newBlob:(bytes,mime,name)=>({bytes,name,mime}),base64Encode:()=>'base64audio',base64Decode:()=>Array(120).fill(0)},
  DriveApp:{getFileById:id=>{const f=blobs.get(id);if(!f)throw Error('missing_Drive_file');return f;}}
 };
 vm.runInNewContext(source,env);
 return {p,env,queue,rows,cache,blobs,control,state,props,run:()=>env.hskVoice38CanaryTick_(p,{},control),
  counts:()=>({ttsCalls,asrCalls,sheetsUpdated}),setExact:v=>exact=v,setUnknown:v=>unknown=v};
}
test('real 3.8 route saves WAV first, then promotes only after blind double ASR',()=>{
 const x=build();
 x.run();
 assert.equal(x.state.command,'CANARY38_VERIFY');
 assert.equal(x.rows[1][3],'CANARY38_VERIFY');
 assert.equal(x.cache[0][11],'VERIFY_PENDING');
 assert.equal(x.props.get('HSK_VOICE_TTS_PREFERRED_MODEL'),undefined);
 assert.equal(x.counts().ttsCalls,1);assert.equal(x.counts().asrCalls,0);
 x.props.set('HSK_VOICE_38_CANARY_NEXT','0');x.run();
 assert.equal(x.state.command,'CANARY38_CONFIRMED_DOUBLE_ASR_PREFERRED');
 assert.equal(x.cache[0][11],'READY');assert.equal(x.rows[1][3],'READY');
 assert.equal(x.props.get('HSK_VOICE_TTS_PREFERRED_MODEL'),'gemini-3.8-flash-lite-tts');
 assert.equal(x.counts().ttsCalls,1);assert.equal(x.counts().asrCalls,1);
 assert.equal(x.rows[0][9],'old-file');
});
test('ASR mismatch keeps audio for REVIEW but never makes 3.8 preferred',()=>{
 const x=build();x.run();x.props.set('HSK_VOICE_38_CANARY_NEXT','0');x.setExact(false);x.run();
 assert.equal(x.state.command,'CANARY38_ASR_REVIEW_NOT_PREFERRED');
 assert.equal(x.rows[1][3],'REVIEW');assert.equal(x.cache[0][11],'REVIEW');
 assert.equal(x.props.get('HSK_VOICE_TTS_PREFERRED_MODEL'),undefined);
});
test('ambiguous TTS response quarantines request; no duplicate generation',()=>{
 const x=build();x.setUnknown(true);x.run();
 assert.equal(x.state.command,'CANARY38_UNCERTAIN');
 assert.equal(x.rows[1][3],'CANARY38_HOLD');
 assert.equal(x.counts().ttsCalls,1);x.props.set('HSK_VOICE_38_CANARY_NEXT','0');x.run();
 assert.equal(x.counts().ttsCalls,1);
});
test('AUTO pause leaves canary untouched',()=>{
 const x=build();x.env.hskCheck_=()=>{throw Error('should_not_start');};
 x.control.getRange=()=>({getValue:()=> 'PAUSE'});
 x.run();assert.equal(x.counts().ttsCalls,0);
});

test('a previously sent TTS request interrupted before response is quarantined, not resent',()=>{
 const x=build();
 x.rows[1][3]='CANARY38_SENT';
 x.props.set('HSK_VOICE_38_CANARY_QUEUE_INDEX','1');
 x.state.command='CANARY38_TTS_REQUESTED_生活';
 x.run();
 assert.equal(x.state.command,'CANARY38_UNCERTAIN');
 assert.equal(x.rows[1][3],'CANARY38_HOLD');
 assert.equal(x.counts().ttsCalls,0);
 x.run();
 assert.equal(x.counts().ttsCalls,0);
});
