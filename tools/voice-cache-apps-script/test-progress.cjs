const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const props=new Map([['HSK_VOCAB_ENABLED','true']]);let written,command='AUTO_CYCLE';
const progress={getRange:(r,c)=>({getValue:()=>11281,setValues:v=>written=v})};
const control={getRange:()=>({getValue:()=>command})},queue={},journal={},cache={};
const book={getSheetByName:n=>({Tien_do:progress,Voice_Control:control,Voice_Vocabulary:queue,Voice_Vocab_Batches:journal}[n])};
cache.getParent=()=>book;
function cacheRow(key,file,state){const r=Array(13).fill('');r[0]=key;r[4]=file;r[11]=state;return r;}
const data=new Map([[cache,[cacheRow('a','file','READY'),cacheRow('a','file','READY'),cacheRow('b','','READY'),cacheRow('c','file','TTS')]],[queue,[['','','','RETRY'],['','','','REVIEW']]],[journal,[['b','','','TTS_CHUNKS','SAVED_31-40_OF_50','','','tts-model']]]]);
const p={getProperty:k=>props.get(k)};
const ctx={Set,Date,Math,Number,String,console,hskSettings_:()=>p,hskCheck_:()=>({sheet:cache}),hskVocabRows_:s=>data.get(s)};
vm.runInNewContext(fs.readFileSync(__dirname+'/VoiceProgress.gs','utf8'),ctx);
const before=JSON.stringify([...props]);ctx.hskVoiceProgressRefresh_();assert.equal(written[2][1],1);assert.equal(written[3][1],11280);assert.equal(written[4][1],1);assert.equal(written[5][1],1);assert.equal(written[11][1],'');assert(written[6][1].includes('tạo audio'));assert.equal(before,JSON.stringify([...props]));
props.set('HSK_VOCAB_RETRY_AT',String(Date.now()+60000));ctx.hskVoiceProgressRefresh_();assert(written[6][1].includes('chờ retry'));assert(written[8][1]);
command='PAUSE';ctx.hskVoiceProgressRefresh_();assert.equal(written[6][1],'Tạm dừng');
let refresh=0;ctx.hskVoiceProgressRefresh_=()=>refresh++;ctx.hskVocabTickWork_=()=>{};ctx.hskVocabTick();assert.equal(refresh,1);
ctx.hskVocabTickWork_=()=>{throw Error('provider failure')};assert.throws(()=>ctx.hskVocabTick(),/provider failure/);assert.equal(refresh,2);
console.log('PASS committed READY dedup/count, current error clear, active/wait/pause states, read-only properties, finally refresh on early return/error');
