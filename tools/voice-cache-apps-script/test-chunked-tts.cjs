'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync(__dirname+'/VoiceChunkedTTS.gs','utf8');
const routing=fs.readFileSync(__dirname+'/VoiceModelRotation.gs','utf8');
function world(jobsCount=12,existingChunks=[]){
 const store=new Map(),record=[];
 const fileMap=new Map(existingChunks.map(([name,bytes])=>[name,{getId:()=>name,getBlob:()=>({getBytes:()=>bytes})}]));
 const folder={getFilesByName:name=>({hasNext:()=>fileMap.has(name),next:()=>fileMap.get(name)}),
 createFile(blob){const name=blob.name;assert.ok(!fileMap.has(name));const f={getId:()=>name,getBlob:()=>({getBytes:()=>blob.bytes})};fileMap.set(name,f);return f;}};
 const jobs=Array.from({length:jobsCount},(_,i)=>({text:'word'+i,pinyin:'test',row:i}));
 const batch=['id',JSON.stringify(jobs),'','TTS_CHUNKS','','today',2,'gemini-2.5-flash-preview-tts',1,0,JSON.stringify({mode:'chunked_v1',attempts:{}})];
 const rows=jobs.map(()=>['HSK','text','pin','PENDING',0,0,'','','','','','','']);
 const tables={batches:{getRange:()=>({setValues:values=>{record.push(values[0].slice());}})},queue:{}};
 const storage={folder};
 const ctx={Date,Math,Number,String,Array,JSON,HSK_VOICE_MAX_AUDIO_BYTES:600*48000+44,
  hskBatchPcm_:bytes=>bytes,
  hskWav_:bytes=>bytes,
  hskVocabWrite_:(sheet,index,row)=>{},
  Utilities:{newBlob:(bytes,mime,name)=>({bytes,mime,name})},
  HSK_VOCAB_URL_:'https://example.invalid'};
 vm.runInNewContext(routing,ctx);
 ctx.hskVocabCall_=(token,body)=>({ok:true,slots:[{slot:2,retryAfter:0},{slot:9,retryAfter:0}]});
 vm.runInNewContext(src,ctx);
 const props={getProperty:k=>store.get(k),setProperty:(k,v)=>store.set(k,v),deleteProperty:k=>store.delete(k)};
 return {ctx,p:props,batch,rows,tables,storage,record,fileMap,call:()=>ctx.hskVoiceChunkedStep_(props,storage,tables,rows,[batch],0,'token')};
}
test('saved chunks join once without new TTS and only become MASTER pending ASR',()=>{
 const w=world(12,[['VOCAB_CHUNK_id_0.wav',[1,2,3,4]],['VOCAB_CHUNK_id_1.wav',[5,6]]]);
 w.ctx.UrlFetchApp={fetch:()=>{throw Error('provider must not be called');}};
 w.call();
 assert.equal(w.batch[3],'MASTER');
 assert.equal(w.rows.filter(r=>r[3]==='MASTER').length,12);
 assert.equal(w.rows.filter(r=>r[3]==='READY').length,0);
 assert.equal(w.fileMap.has('VOCAB_MASTER_id.wav'),true);
 const master=w.fileMap.get('VOCAB_MASTER_id.wav').getBlob().getBytes();
 assert.equal(master.length,6+28800*2);
 assert.deepEqual(Array.from(master.slice(0,4)),[1,2,3,4]);
 assert.deepEqual(Array.from(master.slice(-2)),[5,6]);
});
test('a saved first chunk is reused and next TTS request covers only remaining words',()=>{
 const w=world(12,[['VOCAB_CHUNK_id_0.wav',[1,2]]]);let body;
 w.ctx.UrlFetchApp={fetch:(url,args)=>{body=JSON.parse(args.payload);return {getResponseCode:()=>200,getContentText:()=>''};}};
 w.ctx.hskParallelDecode_=()=>({bytes:[3,4,5,6],providerAttempts:1});
 w.call();
 assert.equal(body.text,'word10?word11');
 assert.equal(body.items,undefined);
 assert.equal(w.fileMap.has('VOCAB_CHUNK_id_1.wav'),true);
 assert.equal(w.batch[3],'TTS_CHUNKS');
 assert.equal(w.p.getProperty('HSK_VOCAB_TTS_CALLS'),'1');
});
test('definitive rejected chunk stays resumable and backs off',()=>{
 const w=world(10); w.ctx.UrlFetchApp={fetch:()=>({getResponseCode:()=>502,getContentText:()=>''})};
 w.ctx.hskParallelDecode_=()=>{const e=Error('cloudflare_tts_502_tts_generation_incomplete');e.providerAttempts=1;e.retryAfter=120;throw e;};
 w.call();
 assert.equal(w.batch[3],'TTS_CHUNKS');
 assert.equal(w.batch[10].includes('"0":1'),true);
 assert.equal(w.p.getProperty('HSK_VOCAB_RETRY_AT'),undefined);
 assert.equal(w.p.getProperty('HSK_VOCAB_PAIR_2_gemini-2.5-flash-preview-tts_AFTER')>Date.now(),true);
});
test('ambiguous transport error is quarantined, never automatically resent',()=>{
 const w=world(10);w.ctx.UrlFetchApp={fetch:()=>{throw Error('network error');}};
 w.call();
 assert.equal(w.batch[3],'UNCERTAIN');
 assert.equal(w.p.getProperty('HSK_VOCAB_ENABLED'),'false');
});

test('previously REJECTED 50-word batch restores only when a checkpointed chunk exists',()=>{
 const w=world(50,[['VOCAB_CHUNK_id_0.wav',[1,2,3,4]]]);
 w.batch[3]='REJECTED';w.batch[4]='tts_chunk_failed_after_3_attempts';
 w.p.setProperty('HSK_AUTO50_ENABLED','true');
 const resumed=w.ctx.hskVoiceChunkedResumeRejected_(w.p,w.storage,w.tables,[w.batch]);
 assert.equal(resumed,true);assert.equal(w.batch[3],'TTS_CHUNKS');
 assert.match(w.batch[4],/SALVAGING/);
 assert.equal(w.fileMap.has('VOCAB_CHUNK_id_0.wav'),true);
 const later=w.ctx.hskVoiceChunkedResumeRejected_(w.p,w.storage,w.tables,[w.batch]);
 assert.equal(later,false);
});
test('failed ten return to next logical batch; original twenty WAVs survive without paid repeat',()=>{
 const w=world(50,[['VOCAB_CHUNK_id_0.wav',[1,2,3,4]],['VOCAB_CHUNK_id_1.wav',[5,6,7,8]]]);
 w.batch[10]=JSON.stringify({mode:'chunked_v1',attempts:{0:1,1:2,2:12}});
 let called=0;w.ctx.UrlFetchApp={fetch:()=>{called++;return {};}};w.ctx.hskParallelDecode_=()=>({bytes:[10,11,12,13],providerAttempts:1});
 w.call();const plan=JSON.parse(w.batch[10]).plan;assert.equal(plan.length,4);assert.equal(called,0);
 assert.equal(plan[0].name,'VOCAB_CHUNK_id_0.wav');assert.equal(plan[1].name,'VOCAB_CHUNK_id_1.wav');
 assert.equal(w.rows.slice(20,30).every(r=>r[3]==='RETRY'),true);
 w.call();w.call();w.call();assert.equal(called,2);assert.equal(w.batch[3],'MASTER');
 assert.equal(JSON.parse(w.batch[1]).length,40);assert.equal(w.rows.slice(20,30).every(r=>r[3]==='RETRY'),true);
 assert.equal(w.fileMap.get('VOCAB_CHUNK_id_0.wav').getBlob().getBytes().length,4);
 assert.equal(w.rows.some(r=>r[3]==='READY'),false);
});

test('one repeatedly unspoken word is excluded, original successful four preserved and ready awaits ASR',()=>{
 const w=world(5,[['VOCAB_CHUNK_id_0_4.wav',[1,2,3,4]]]);
 w.batch[10]=JSON.stringify({mode:'chunked_v1',version:'adaptive_v2',attempts:{},
  plan:[{from:0,to:4,name:'VOCAB_CHUNK_id_0_4.wav',model:'gemini-2.5-flash-preview-tts',tries:1,slot:2},
   {from:4,to:5,name:'VOCAB_CHUNK_id_4_5.wav',model:'gemini-3.8-flash-lite-tts',tries:36,slot:9}],
  omitted:[]});
 w.ctx.UrlFetchApp={fetch:()=>{throw Error('no further provider calls');}};
 w.call();
 assert.equal(w.rows[4][3],'RETRY');assert.match(w.rows[4][11],/tts_chunk_unavailable_next_batch/);
 const saved=JSON.parse(w.batch[10]);assert.deepEqual(Array.from(saved.omitted),[4]);
 assert.equal(saved.plan.length,1);
 w.call();
 assert.equal(w.batch[3],'MASTER');
 assert.equal(JSON.parse(w.batch[1]).length,4);
 assert.equal(w.rows.slice(0,4).every(r=>r[3]==='MASTER'),true);
 assert.equal(w.rows[4][3],'RETRY');
 assert.equal(w.rows.some(r=>r[3]==='READY'),false);
});
