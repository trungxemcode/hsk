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
 assert.equal(selected.filter(x=>x.r[3]==='PENDING').length,47);
 assert.equal(selected.filter(x=>/^旧试/.test(x.r[1])).length,0);
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
