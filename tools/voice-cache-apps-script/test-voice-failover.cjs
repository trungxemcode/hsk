'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync(__dirname+'/VoiceFailover.gs','utf8');
const directSrc=fs.readFileSync(__dirname+'/VoiceDirectFallback.gs','utf8');
function world(){
 let now=2_000_000_000_000,count=0;
 const props=new Map([['GEMINI_TTS_KEY_1','redacted-test-key'],['HSK_VOICE_FAILOVER_ENABLED','true'],
  ['HSK_VOICE_FAILOVER_MODE','WORKER'],['HSK_VOCAB_ERROR','cloudflare_tts_502_tts_generation_incomplete'],
  ['HSK_VOCAB_RETRY_AT',String(now+2_000_000)]]);
 const p={getProperty:k=>props.get(k)||null,setProperty:(k,v)=>props.set(k,String(v)),deleteProperty:k=>props.delete(k)};
 const map={2:'AUTO_CYCLE'},writes=[],batch=['batch','jobs','', 'TTS_CHUNKS','FAILED'];
 let ready=10,existing=2,replyOk=true;
 const control={getRange:(r,c,h,w)=>({getValue:()=>map[r],setValues:rows=>writes.push({r,rows})})};
 const progress={getRange:()=>({getValues:()=>[[ready],[existing]]})};
 const batches={getLastRow:()=>2,getRange:()=>({getValues:()=>[batch]})};
 const book={getSheetByName:name=>name==='Tien_do_tu_vung'?progress:name==='Voice_Vocab_Batches'?batches:null};
 const context={Date:class Date extends global.Date {static now(){return now;}},Math,JSON,Number,String,Array,Object,
 ScriptApp:{getIdentityToken:()=>'fake-token'},HSK_VOCAB_URL_:'https://test-worker.invalid',
 UrlFetchApp:{fetch:()=>{count++;return {getResponseCode:()=>replyOk?200:503,getContentText:()=>replyOk?JSON.stringify({ok:true,slots:[{slot:1,retryAfter:0}]}):'{}'};}}};
 vm.runInNewContext(src,context);
 return {p,props,ctx:context,control,book,batch,writes,
 advance:ms=>{now+=ms;},setReady:n=>ready=n,setExisting:n=>existing=n,setReply:v=>replyOk=v,
 setCommand:v=>map[2]=v,polls:()=>count,run:()=>context.hskVoiceFailoverPoll_(p,book,control)};
}
test('15 min stall switches to Apps Script direct and clears only stale Worker cooldown',()=>{
 const w=world();w.run();w.advance(14*60000);w.run();
 assert.equal(w.props.get('HSK_VOICE_FAILOVER_MODE'),'WORKER');
 w.advance(60001);w.run();
 assert.equal(w.props.get('HSK_VOICE_FAILOVER_MODE'),'DIRECT');
 assert.equal(w.props.has('HSK_VOCAB_RETRY_AT'),false);
 assert.equal(w.writes.at(-1).rows[0][1],'DIRECT');
});
test('missing direct key cannot be mistaken for a working failover',()=>{
 const w=world();w.props.delete('GEMINI_TTS_KEY_1');w.run();w.advance(901000);w.run();
 assert.equal(w.props.get('HSK_VOICE_FAILOVER_MODE'),'WORKER');
 assert.equal(w.props.get('HSK_VOICE_FAILOVER_REASON'),'stalled_direct_keys_not_configured');
});
test('new READY progress resets 15-minute window and heartbeat alone does not',()=>{
 const w=world();w.run();w.advance(700000);w.setReady(11);w.run();
 w.advance(800000);w.run();
 assert.equal(w.props.get('HSK_VOICE_FAILOVER_MODE'),'WORKER');
 w.advance(120000);w.run();assert.equal(w.props.get('HSK_VOICE_FAILOVER_MODE'),'DIRECT');
});
test('confirmed WAV chunk saved is durable progress, FAILED and GENERATING are not',()=>{
 const w=world();w.run();w.batch[4]='SAVED_11-20_OF_50';w.advance(500000);w.run();
 w.advance(850000);w.batch[4]='FAILED_21-30_502';w.run();
 assert.equal(w.props.get('HSK_VOICE_FAILOVER_MODE'),'WORKER');
 w.advance(60000);w.run();assert.equal(w.props.get('HSK_VOICE_FAILOVER_MODE'),'DIRECT');
});
test('requires two healthy Worker polls then an actual successful canary before return',()=>{
 const w=world();w.run();w.advance(901000);w.run();
 assert.equal(w.props.get('HSK_VOICE_FAILOVER_MODE'),'DIRECT');
 w.advance(300001);w.run();assert.equal(w.props.get('HSK_VOICE_FAILOVER_MODE'),'DIRECT');
 w.advance(300001);w.run();assert.equal(w.props.get('HSK_VOICE_FAILOVER_MODE'),'WORKER_PROBE');
 assert.ok(w.polls()>=2); // Dashboard separately polls Worker slot availability.
 assert.equal(w.props.get('HSK_VOICE_WORKER_HEALTHY_POLLS'),'2');
 w.ctx.hskVoiceFailoverOutcome_(w.p,'WORKER_PROBE',true);
 assert.equal(w.props.get('HSK_VOICE_FAILOVER_MODE'),'WORKER');
});
test('failed canary goes DIRECT again with a new Worker cooldown, repeated flaps supported',()=>{
 const w=world();w.run();w.advance(901000);w.run();
 w.advance(300001);w.run();w.advance(300001);w.run();
 w.ctx.hskVoiceFailoverOutcome_(w.p,'WORKER_PROBE',false,'cloudflare_tts_502');
 assert.equal(w.props.get('HSK_VOICE_FAILOVER_MODE'),'DIRECT');
 w.advance(300001);w.run();assert.equal(w.props.get('HSK_VOICE_FAILOVER_MODE'),'DIRECT');
 w.advance(300001);w.run();assert.equal(w.props.get('HSK_VOICE_FAILOVER_MODE'),'WORKER_PROBE');
});
test('PAUSE never toggles mode, disabled policy does nothing',()=>{
 const w=world();w.run();w.advance(901000);w.setCommand('PAUSE');w.run();
 assert.equal(w.props.get('HSK_VOICE_FAILOVER_MODE'),'WORKER');
 w.setCommand('AUTO_CYCLE');w.props.set('HSK_VOICE_FAILOVER_ENABLED','false');w.run();
 assert.equal(w.props.get('HSK_VOICE_FAILOVER_MODE'),'WORKER');
});
test('direct fallback uses existing local TTS keys and blind independent ASR calls',()=>{
 let calls=[],key='test',pcm=true;
 const props=new Map([['GEMINI_TTS_KEY_1',key]]);
 const p={getProperty:k=>props.get(k),setProperty:(k,v)=>props.set(k,String(v)),deleteProperty:k=>props.delete(k)};
 const ctx={Date,Array,Number,String,JSON,Math,
  hskGemini_:(k,words,m)=>{assert.equal(k,key);calls.push({type:'tts',words,m});return new Array(100).fill(0);},
  hskBatchPcm_:()=>[1,2],
  UrlFetchApp:{fetch:(url,opts)=>{
   calls.push({type:'asr',url,model:url.includes('lite')?'lite':'flash',payload:JSON.parse(opts.payload)});
   const value=JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify({hanzi:'你好',pinyin:'nǐhǎo'})}]}}]});
   return {getResponseCode:()=>200,getContentText:()=>value};
  }}
 };
 vm.runInNewContext(directSrc,ctx);
 const tts=ctx.hskVoiceDirectTts_(p,'你好','gemini-3.1-flash-tts-preview');
 assert.equal(tts.bytes.length,100);
 const verified=ctx.hskVoiceDirectVerify_(p,{action:'verify-words',items:['告别'],pinyin:['gàobié'],clips:['AA==']});
 assert.equal(verified.verified[0],true); // same transcript does not mean matches expected; caller checks.
 assert.deepEqual(calls.map(x=>x.type),['tts','asr','asr']);
 assert.notEqual(calls[1].url,calls[2].url);
 assert.equal(JSON.stringify(calls[1].payload).includes('告别'),false);
 assert.equal(JSON.stringify(calls[2].payload).includes('gàobié'),false);
});

test('dashboard distinguishes twelve Cloudflare slots from local direct keys',()=>{
 const w=world();w.run();
 assert.equal(w.props.get('HSK_VOICE_CF_KEY_COUNT'),'1'); // Mock status has one numbered slot.
 assert.equal(w.writes.at(-1).rows[3][0],'Failover_direct_key_count');
 assert.equal(w.writes.at(-1).rows[7][0],'Cloudflare_numbered_key_slots');
 assert.equal(w.writes.at(-1).rows[8][0],'Key_locations');
 for(let n=1;n<=12;n++)w.props.set('GEMINI_API_KEY_'+n,'local-key-'+n);
 assert.equal(w.ctx.hskVoiceFailoverKeyCount_(w.p),12);
});
