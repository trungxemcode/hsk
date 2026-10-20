const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
function setup(){
 const props=new Map(),entries=[['b',1,120,500,'PENDING',0],['b',2,1200,1600,'PENDING',0]];
 const jobs=[{row:0,text:'甲',pinyin:'jia',model:'m'},{row:1,text:'乙',pinyin:'yi',model:'m'}];
 const rows=jobs.map(j=>{const r=Array(17).fill('');r[1]=j.text;r[3]='MASTER';return r;});
 const batch=['b',JSON.stringify(jobs),'master','AUTO_VERIFY','','',0,'m',0,2,''];let calls=0,paused=false;
 const range={setValues:()=>{},setValue:v=>paused=v==='PAUSE'},sheet={getRange:()=>range};
 const p={getProperty:k=>props.get(k),setProperty:(k,v)=>props.set(k,v),deleteProperty:k=>props.delete(k)};
 const c={Date,Math,Number,String,Set,Array,JSON,Utilities:{base64Encode:b=>Buffer.alloc(b.length).toString('base64')},DriveApp:{getFileById:()=>({getBlob:()=>({getBytes:()=>[]})})}};
 vm.runInNewContext(fs.readFileSync(__dirname+'/AutoCycle.gs','utf8'),c);
 c.hskSettings_=()=>p;c.hskAuto50Sheet_=()=>sheet;c.hskVocabRows_=()=>entries;c.hskBatchPcm_=()=>Array(96000).fill(0);c.hskWav_=pcm=>Array(pcm.length+44).fill(0);
 c.hskVoiceRecHanzi_=x=>x;c.hskVoiceRecPinyin_=x=>x;c.hskAuto50Cache_=()=>({file:'verified',model:'m'});c.hskVocabWrite_=()=>{};c.hskVocabSummary_=()=>{};
 const run=()=>c.hskAuto50VerifyTick_({sheet:{getParent:()=>({getSheetByName:()=>sheet})}},{queue:sheet,batches:sheet},rows,[batch],0,'token',Date.now());
 return {c,p,props,entries,rows,batch,run,isPaused:()=>paused};
}
{
 const x=setup();x.c.hskVocabCall_=()=>{const e=Error('asr_provider_unavailable');e.detail={retryAfter:600};throw e;};x.run();
 const b=JSON.parse(x.props.get('HSK_AUTO50_ASR_BACKOFF'));assert.ok(b.clips[1].after>=Date.now()+599000);assert.equal(x.entries[0][5],0);assert.equal(x.rows[0][3],'MASTER');assert.equal(x.batch[3],'AUTO_VERIFY');
 let item;x.c.hskVocabCall_=(token,body)=>{item=body.items[0];return {transcripts:[['乙'],['乙']],pinyin:[['yi'],['yi']]};};x.run();assert.equal(item,'乙');assert.equal(x.entries[1][4],'READY');assert.equal(x.rows[0][3],'MASTER');
 x.c.hskVocabCall_=()=>{throw Error('waiting clip must not be sent')};x.run();assert.equal(x.batch[3],'AUTO_VERIFY');assert.equal(x.rows[0][3],'MASTER');console.log('PASS outage preserves master/check count, honors Retry-After, other clip proceeds, waiting batch never falsely finalizes');
}
{
 const x=setup();x.c.hskVocabCall_=()=>{throw Error('unauthorized')};x.run();assert.equal(x.props.get('HSK_VOCAB_ENABLED'),'false');assert.equal(x.isPaused(),true);assert.equal(x.rows[0][3],'MASTER');console.log('PASS authentication fault pauses control and preserves master');
}
