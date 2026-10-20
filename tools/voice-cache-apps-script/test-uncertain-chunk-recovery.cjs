'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync(__dirname+'/UncertainChunkRecovery.gs','utf8');
function world({attempts=[1,0,0,0,0],saved=[],master=false}={}){
 const jobs=Array.from({length:50},(_,i)=>({row:i,text:'word'+i,model:'model'}));
 const id='test-ambiguous-batch';
 const plan=attempts.map((tries,i)=>({from:i*10,to:(i+1)*10,name:'VOCAB_CHUNK_'+id+'_'+i+'.wav',tries,model:'model'}));
 const batch=[id,JSON.stringify(jobs),'','UNCERTAIN','tts_chunk_response_uncertain_0',
  new Date().toISOString(),0,'model',1,0,JSON.stringify({mode:'chunked_v1',plan,attempts:{0:1}})];
 const rows=jobs.map((_,i)=>[4,'word'+i,'pinyin',i<13?'RETRY':'PENDING',0,0,'','','','','',i<13?'retry_earlier':'',new Date().toISOString(),'','','','']);
 rows[0][3]='READY';rows[0][9]='ready-file';
 const props=new Map([['HSK_VOCAB_ERROR','uncertain_batch_requires_review'],['HSK_VOCAB_ENABLED','false']]);
 let storeWrites=0,batchWrites=0;
 const fileMap=new Map(saved.map(i=>[plan[i].name,{getId:()=>plan[i].name,getBlob:()=>({getBytes:()=>Array(100).fill(1)})}]));
 if(master)fileMap.set('VOCAB_MASTER_'+id+'.wav',{getId:()=> 'master-id',getBlob:()=>({getBytes:()=>Array(100).fill(1)})});
 const folder={getFilesByName:name=>({hasNext:()=>fileMap.has(name),next:()=>fileMap.get(name)})};
 const tables={queue:{},batches:{getRange:()=>({setValues:vs=>{batchWrites++;}})}};
 const env={Date,JSON,Array,Set,Number,String,Object,
  hskBatchPcm_:bytes=>bytes,
  hskVocabWrite_:(sheet,index,row)=>{assert.equal(sheet,tables.queue);storeWrites++;}};
 vm.runInNewContext(src,env,{filename:'UncertainChunkRecovery.gs'});
 const p={getProperty:key=>props.get(key),setProperty:(key,val)=>props.set(key,String(val)),deleteProperty:key=>props.delete(key)};
 return {env,p,batch,rows,tables,folder,fileMap,props,counts:()=>({storeWrites,batchWrites}),
  run:()=>env.hskVoiceQuarantineUncertainChunks_(p,{folder},tables,rows,[batch])};
}
test('ambiguous ten are isolated while unsent forty stay eligible, without WAV regeneration',()=>{
 const w=world();assert.equal(w.run(),true);
 assert.equal(w.batch[3],'QUARANTINED');
 assert.match(w.batch[4],/hold_10_words;unsent_40/);
 assert.equal(w.rows.filter(r=>r[3]==='HOLD_UNCERTAIN').length,9); // one was READY
 assert.equal(w.rows.filter(r=>r[3]==='READY').length,1);
 assert.equal(w.rows.slice(10).every(r=>r[3]==='RETRY'||r[3]==='PENDING'),true);
 assert.equal(w.props.get('HSK_VOCAB_ENABLED'),'true');
 assert.equal(w.props.get('HSK_AUTO50_UNCERTAIN_HELD'),'10');
 assert.equal(w.props.has('HSK_VOCAB_ERROR'),false);
 assert.equal(w.run(),false); // idempotent and never calls Gemini
});
test('saved attempted WAVs are reused and do not get frozen when no ambiguity remains',()=>{
 const w=world({saved:[0]});assert.equal(w.run(),true);
 assert.equal(w.batch[3],'TTS_CHUNKS');
 assert.equal(w.rows.filter(r=>r[3]==='HOLD_UNCERTAIN').length,0);
 assert.equal(w.fileMap.size,1);
});
test('saved master is promoted only to MASTER and never READY',()=>{
 const w=world({master:true});assert.equal(w.run(),true);
 assert.equal(w.batch[3],'MASTER');
 assert.equal(w.batch[2],'master-id');
 assert.equal(w.rows.filter(r=>r[3]==='READY').length,1);
});
test('attempted unsaved chunk plus saved chunk are preserved, untouched words released',()=>{
 const w=world({attempts:[1,1,0,0,0],saved:[0]});
 assert.equal(w.run(),true);
 assert.equal(w.batch[3],'QUARANTINED');
 assert.match(w.batch[4],/hold_20_words;unsent_30/);
 assert.equal(w.rows.filter(r=>r[3]==='HOLD_UNCERTAIN').length,19);
 assert.equal(w.rows.slice(20).every(r=>r[3]==='RETRY'||r[3]==='PENDING'),true);
 assert.equal(w.fileMap.has('VOCAB_CHUNK_test-ambiguous-batch_0.wav'),true);
});
test('malformed plan cannot silently discard or repeat words',()=>{
 const w=world();
 const journal=JSON.parse(w.batch[10]);journal.plan[0].to=1000;w.batch[10]=JSON.stringify(journal);
 assert.throws(()=>w.run(),/invalid_uncertain_chunk_plan/);
 assert.equal(w.batch[3],'UNCERTAIN');assert.equal(w.rows.filter(r=>r[3]==='HOLD_UNCERTAIN').length,0);
});
test('unrelated UNCERTAIN status not touched by chunk-only repair',()=>{
 const w=world();w.batch[4]='voice_master_drive_uncertain';
 assert.equal(w.run(),false);assert.equal(w.batch[3],'UNCERTAIN');
});
