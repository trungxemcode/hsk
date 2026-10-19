'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync(__dirname+'/AutoCycle.gs','utf8');
const context={Date,Math,Number,String,Set,Array,JSON};
vm.runInNewContext(src,context,{filename:'AutoCycle.gs'});
test('three failed words plus 47 untouched produce exactly one 50-word batch with failed first',()=>{
 const a=Array.from({length:3},(_,i)=>({r:[2,'重试'+i,'', 'RETRY',1,0,'','','','','','needs_new_batch_after_unverified_master'],i}));
 const b=Array.from({length:47},(_,i)=>({r:[2,'新词'+i,'','PENDING',0,0],i:i+3}));
 const c=Array.from({length:4},(_,i)=>({r:[2,'旧试'+i,'','RETRY',2,0,'','','','','','provider_error'],i:i+50}));
 const selected=context.hskAuto50Choose_([...b,...c,...a]).slice(0,50);
 assert.equal(selected.length,50);
 assert.deepEqual(selected.slice(0,3).map(x=>x.r[1]),a.map(x=>x.r[1]));
 assert.equal(selected.filter(x=>x.r[3]==='PENDING').length,43);
 assert.equal(selected.filter(x=>x.r[3]==='RETRY').length,7);
});
test('detector accepts 50 independent speech clips and does not depend on requested four-second gaps',()=>{
 const frames=48000,parts=[];
 for(let i=0;i<50;i++){
  const spoken=new Uint8Array(frames*.32);
  for(let k=0;k<spoken.length;k+=2){const v=(k/2)%2===0?16000:-16000;spoken[k]=v&255;spoken[k+1]=(v>>8)&255;}
  parts.push(spoken,new Uint8Array(frames*.7));
 }
 let total=0;parts.forEach(x=>total+=x.length);
 const pcm=[];for(let x of parts)for(let y of x)pcm.push(y);
 context.hskBatchPcm_=()=>pcm;
 const result=context.hskAuto50Detect_([],50);
 assert.equal(result.ranges.length,50);
 assert.ok(result.duration>40&&result.duration<70);
});
test('detector fails closed for silent or sparse audio',()=>{
 context.hskBatchPcm_=()=>new Array(48000).fill(0);
 assert.throws(()=>context.hskAuto50Detect_([],50),/silent_master/);
});

function remoteSandbox(){
 const c={Date,Math,Number,String,Set,Array,JSON,Utilities:{base64Encode:()=> 'encodedwav'}};
 vm.runInNewContext(src,c,{filename:'AutoCycle.gs'});
 const store=new Map([['HSK_VOICE_REMOTE_SEGMENT','true']]);
 c.hskSettings_=()=>({getProperty:k=>store.get(k),setProperty:(k,v)=>store.set(k,v)});
 c.hskBatchPcm_=()=>new Array(4800).fill(0);
 return {c,store};
}
test('Worker is preferred when remote ranges pass validation',()=>{
 const {c,store}=remoteSandbox();
 let calls=0;
 c.UrlFetchApp={fetch:(url,args)=>{calls++;assert.match(url,/hsk-voice-segmenter/);assert.equal(args.headers.Authorization,'Bearer good-token');return {getResponseCode:()=>200,getContentText:()=>JSON.stringify({ok:true,ranges:[[50,500]],duration:1})};}};
 c.hskAuto50Detect_=()=>{throw Error('local path should not run');};
 const result=c.hskAuto50DetectRemote_([],1,'good-token');
 assert.equal(result.ranges.length,1);
 assert.equal(calls,1);
 assert.equal(store.get('HSK_VOICE_SEGMENT_LAST'),'worker');
});
test('Worker failure automatically falls back to Apps Script detector',()=>{
 const {c,store}=remoteSandbox();
 c.UrlFetchApp={fetch:()=>({getResponseCode:()=>503,getContentText:()=>JSON.stringify({ok:false,error:'temporarily_unavailable'})})};
 let localCalls=0;
 c.hskAuto50Detect_=()=>{localCalls++;return {ranges:[[25,400]],duration:1};};
 const result=c.hskAuto50DetectRemote_([],1,'good-token');
 assert.equal(result.ranges[0][0],25);
 assert.equal(localCalls,1);
 assert.equal(store.get('HSK_VOICE_SEGMENT_LAST'),'local_fallback');
});
test('Disabled Worker uses local detector without network request',()=>{
 const {c,store}=remoteSandbox();
 store.set('HSK_VOICE_REMOTE_SEGMENT','false');
 c.UrlFetchApp={fetch:()=>{throw Error('no remote request expected');}};
 c.hskAuto50Detect_=()=>({ranges:[[25,400]],duration:1});
 assert.equal(c.hskAuto50DetectRemote_([],1,'good-token').ranges.length,1);
});
test('Worker malformed or out-of-bounds ranges cannot bypass local fallback',()=>{
 const {c,store}=remoteSandbox();
 c.UrlFetchApp={fetch:()=>({getResponseCode:()=>200,getContentText:()=>JSON.stringify({ok:true,ranges:[[0,9999999999]]})})};
 c.hskAuto50Detect_=()=>({ranges:[[25,400]],duration:1});
 assert.equal(c.hskAuto50DetectRemote_([],1,'good-token').ranges[0][0],25);
 assert.equal(store.get('HSK_VOICE_SEGMENT_LAST'),'local_fallback');
});

test('definitive TTS errors precede ASR retries and new PENDING; 50 slots get filled',()=>{
 const tts=Array.from({length:12},(_,i)=>({r:[2,'tts'+i,'','RETRY',0,0,'','','','','','provider_refused_batch'],i:i+200}));
 const asr=Array.from({length:17},(_,i)=>({r:[2,'asr'+i,'','RETRY',1,0,'','','','','','auto50_unverified_master'],i:i+50}));
 const untouched=Array.from({length:80},(_,i)=>({r:[2,'new'+i,'','PENDING',0,0,'','','','','',''],i:i+300}));
 const chosen=context.hskAuto50Choose_([...untouched,...asr,...tts]).slice(0,50);
 assert.equal(chosen.length,50);
 assert.equal(chosen.slice(0,12).every(x=>x.r[11]==='provider_refused_batch'),true);
 assert.equal(chosen.slice(12,29).every(x=>x.r[3]==='RETRY'),true);
 assert.equal(chosen.slice(29).every(x=>x.r[3]==='PENDING'),true);
});
