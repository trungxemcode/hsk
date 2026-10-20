
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),test=require('node:test');
const root=__dirname;
function context(){
 const c={Date,Math,Number,String,Array,JSON,Set,Object,console};
 c.hskVoiceRecPinyin_=x=>String(x||'').normalize('NFC').toLowerCase().replace(/[\s\p{P}]/gu,'');
 c.hskVoiceRecHanzi_=x=>String(x||'').normalize('NFKC').replace(/[\s\p{P}\p{S}]/gu,'');
 for(const f of ['AsrQualityGate','QualityEnhancements'])vm.runInNewContext(fs.readFileSync(root+'/'+f+'.gs','utf8'),c);
 return c;
}
function world(n,files=[]){
 const harness=fs.readFileSync(root+'/test-chunked-tts.cjs','utf8').split("\ntest(")[0],c={require,__dirname:root};
 vm.runInNewContext(harness,c);const w=c.world(n,files),quality=context();
 for(const key of Object.keys(quality).filter(k=>k.startsWith('hsk')))w.ctx[key]=quality[key];
 return w;
}
test('first two strict; common-reading and duplicate homophones only third with proven order; wrong tone rejected',()=>{
 const c=context(),jobs=[{text:'\u5b8c',pinyin:'w\u00e1n'},{text:'\u73a9',pinyin:'w\u00e1n'}];
 for(const check of [1,2])assert.equal(c.hskAuto50QualityMatch_(jobs,1,2,check,'\u73a9','\u73a9','w\u00e1n','w\u00e1n',true).index,-1);
 assert.equal(c.hskAuto50QualityMatch_([jobs[0]],1,1,2,'\u73a9','\u73a9','w\u00e1n','w\u00e1n',true).index,-1);
 assert.equal(c.hskAuto50QualityMatch_([jobs[0]],1,1,3,'\u73a9','\u73a9','w\u00e1n','w\u00e1n',true).index,0);
 assert.equal(c.hskAuto50QualityMatch_(jobs,1,2,3,'\u4e38','\u4e38','w\u00e1n','w\u00e1n',true).index,0);
 assert.equal(c.hskAuto50QualityMatch_(jobs,1,2,3,'\u4e38','\u4e38','w\u00e1n','w\u00e1n',false).index,-1);
 assert.equal(c.hskAuto50QualityMatch_([jobs[0]],1,1,3,'\u73a9','\u73a9','w\u01cen','w\u01cen',true).index,-1);
 const common=[{text:'\u5389\u5bb3',pinyin:'l\u00ec h\u00e0i'}];
 for(const n of [1,2])assert.equal(c.hskAuto50QualityMatch_(common,1,1,n,'\u5389\u5bb3','\u5389\u5bb3','l\u00echai','l\u00echai',true).index,-1);
 assert.equal(c.hskAuto50QualityMatch_(common,1,1,3,'\u5389\u5bb3','\u5389\u5bb3','l\u00echai','l\u00echai',true).index,0);
});
test('new dictionary profile saves once, uses exact stable boundaries and remains MASTER awaiting blind ASR',()=>{
 const w=world(2);w.batch[10]=JSON.stringify({mode:'chunked_v1',qualityProfile:'dictionary_v1',attempts:{}});
 let calls=0;
 w.ctx.UrlFetchApp={fetch:(url,args)=>{calls++;const body=JSON.parse(args.payload);assert.equal(body.dictionaryStyle,true);assert.equal(body.items.length,2);assert.equal(body.text,undefined);return {};}};
 const pcm=[];for(let n=0;n<2;n++){pcm.push(...Array(4800).fill(0));for(let k=0;k<6000;k++)pcm.push(100,30);pcm.push(...Array(48000).fill(0));}
 w.ctx.hskParallelDecode_=()=>({bytes:pcm,providerAttempts:1});
 w.ctx.hskVoiceQualityDetect_=bytes=>{const c=context();c.hskBatchPcm_=x=>x;return c.hskVoiceQualityDetect_(bytes,2);};
 w.call();assert.equal(calls,1);w.call();assert.equal(calls,1);assert.equal(w.batch[3],'MASTER');
 const report=JSON.parse(w.batch[10]);assert.equal(report.boundaryProven,true);assert.equal(report.ranges.length,2);assert(w.rows.every(r=>r[3]==='MASTER'));
});
test('unsegmentable saved chunk alone requeues; other saved audio survives with no TTS',()=>{
 const w=world(12,[['VOCAB_CHUNK_id_0.wav',[10,0]],['VOCAB_CHUNK_id_1.wav',[0,0]]]);
 w.batch[10]=JSON.stringify({mode:'chunked_v1',qualityProfile:'dictionary_v1',attempts:{}});
 w.ctx.hskVoiceQualityDetect_=(bytes,count)=>bytes[0]===10?{ranges:Array.from({length:count},()=>[0,1])}:null;
 w.ctx.UrlFetchApp={fetch:()=>{throw Error('must reuse audio');}};
 w.call();assert.equal(w.rows[10][3],'RETRY');assert.equal(w.rows[11][3],'RETRY');assert.match(w.rows[10][11],/unproven_boundaries/);
 w.call();assert.equal(w.batch[3],'MASTER');assert.equal(JSON.parse(w.batch[1]).length,10);assert.equal(w.fileMap.has('VOCAB_CHUNK_id_0.wav'),true);
});
test('model learning counts actual generated clips, excludes cache hits, idempotent, bounded and preserves eligible keys',()=>{
 const c=context(),map=new Map(),p={getProperty:k=>map.get(k),setProperty:(k,v)=>map.set(k,v)};
 const models=['gemini-3.1-flash-tts-preview','gemini-2.5-flash-preview-tts','gemini-3.8-flash-lite-tts'];
 const jobs=Array.from({length:50},(_,i)=>({row:i,model:models[i<25?0:1]}));
 const clips=jobs.map((j,i)=>{const r=Array(15).fill('');r[4]=i<5?'READY':i<25?'REVIEW':'READY';r[10]=i+2;return r;});
 c.hskVoiceQualityRecord_(p,['batch'],jobs,clips);c.hskVoiceQualityRecord_(p,['batch'],jobs,clips);
 assert.equal(c.hskVoiceQualitySamples_(p).length,1);
 const pairs=models.map((model,i)=>({model,slot:i+1}));
 assert.equal(c.hskVoiceQualityOrderPairs_(p,pairs)[0].model,models[1]);
 assert.equal(c.hskVoiceQualityOrderPairs_(p,pairs,models[1])[0].model,models[0]);
 assert.equal(c.hskVoiceQualityOrderPairs_(p,[pairs[2]])[0].slot,3);
 map.set('HSK_AUTO50_QUALITY_MODE','DISABLED');assert.equal(c.hskVoiceQualityOrderPairs_(p,pairs),pairs);
});
