'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync(__dirname+'/VoiceChunkedTTS.gs','utf8');
function world(jobsCount=12,existingChunks=[]){
 const store=new Map(),record=[];
 const fileMap=new Map(existingChunks.map(([name,bytes])=>[name,{getId:()=>name,getBlob:()=>({getBytes:()=>bytes})}]));
 const folder={getFilesByName:name=>({hasNext:()=>fileMap.has(name),next:()=>fileMap.get(name)}),
 createFile(blob){const name=blob.name;assert.ok(!fileMap.has(name));const f={getId:()=>name,getBlob:()=>({getBytes:()=>blob.bytes})};fileMap.set(name,f);return f;}};
 const jobs=Array.from({length:jobsCount},(_,i)=>({text:'word'+i,pinyin:'test',row:i}));
 const batch=['id',JSON.stringify(jobs),'','TTS_CHUNKS','','today',2,'model',1,0,JSON.stringify({mode:'chunked_v1',attempts:{}})];
 const rows=jobs.map(()=>['HSK','text','pin','PENDING',0,0,'','','','','','','']);
 const tables={batches:{getRange:()=>({setValues:values=>{record.push(values[0].slice());}})},queue:{}};
 const storage={folder};
 const ctx={Date,Math,Number,String,Array,JSON,HSK_VOICE_MAX_AUDIO_BYTES:600*48000+44,
  hskBatchPcm_:bytes=>bytes,
  hskWav_:bytes=>bytes,
  hskVocabWrite_:(sheet,index,row)=>{},
  Utilities:{newBlob:(bytes,mime,name)=>({bytes,mime,name})},
  HSK_VOCAB_URL_:'https://example.invalid'};
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
 assert.ok(Number(w.p.getProperty('HSK_VOCAB_RETRY_AT'))>Date.now());
});
test('ambiguous transport error is quarantined, never automatically resent',()=>{
 const w=world(10);w.ctx.UrlFetchApp={fetch:()=>{throw Error('network error');}};
 w.call();
 assert.equal(w.batch[3],'UNCERTAIN');
 assert.equal(w.p.getProperty('HSK_VOCAB_ENABLED'),'false');
});
