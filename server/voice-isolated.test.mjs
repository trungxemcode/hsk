import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {createHash,webcrypto} from 'node:crypto';
import {createVoicePrecacheHandler} from './voice-tts.mjs';
globalThis.crypto ||= webcrypto;
const root=new URL('../tools/voice-cache-apps-script/',import.meta.url);
function fixture(texts=['你好','谢谢','再见','中国','老师']){
 const props=new Map([['HSK_WARM_ENABLED','true']]),tables=new Map(),files=new Map();let calls=0,verifyCalls=0,fail=false,mismatch=false,serial=0;
 const p={getProperty:k=>props.get(k)||null,setProperty:(k,v)=>props.set(k,String(v)),deleteProperty:k=>props.delete(k)};
 function table(name){if(tables.has(name))return tables.get(name);const rows=[];const s={rows,getParent:()=>book,getLastRow:()=>rows.length+1,appendRow:r=>rows.push([...r]),setFrozenRows(){},getRange:(r,c,n=1,w=13)=>({getValues:()=>rows.slice(r-2,r-2+n).map(x=>x.slice(c-1,c-1+w)),setValues:vv=>vv.forEach((v,i)=>{rows[r-2+i]||=[];v.forEach((x,j)=>rows[r-2+i][c-1+j]=x);}),createTextFinder:k=>({matchEntireCell:()=>({findNext:()=>{const i=rows.findIndex(x=>x[0]===k);return i<0?null:{getRow:()=>i+2};}})})})};tables.set(name,s);return s;}
 const book={getSheetByName:n=>tables.get(n),insertSheet:n=>{const s=table(n);s.appendRow= r=>{if(!s.header)s.header=r;else s.rows.push([...r]);};return s;}};
 const folder={getFilesByName:n=>({hasNext:()=>files.has(n),next:()=>files.get(n)}),createFile:blob=>{const f={getId:()=>blob.name,getBlob:()=>({getBytes:()=>blob.bytes})};files.set(blob.name,f);return f;}};
 const storage={sheet:table('Kho_Voice'),folder},queue=table('Voice_Retry');
 const c=vm.createContext({console,Date,Map,Set,HSK_VOICE_MAX_AUDIO_BYTES:180*48000+44,hskSettings_:()=>p,hskCheck_:()=>storage,hskWarmCorpus_:()=>texts,hskWarmQueue_:()=>queue,hskWarmProgress_(){},hskWarmStop:()=>p.setProperty('HSK_WARM_ENABLED','false'),ScriptApp:{getIdentityToken:()=> 'test'},hskParallelAvailability_:()=>[{slot:1,retryAfter:0},{slot:2,retryAfter:0}],SpreadsheetApp:{flush(){}},LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})},DriveApp:{getFileById:id=>files.get(id)},Utilities:{newBlob:(bytes,mime,name)=>({bytes,mime,name}),base64Decode:s=>[...Buffer.from(s,'base64')],base64Encode:bytes=>Buffer.from(bytes).toString('base64')},hskDigest_:s=>createHash('sha256').update(s).digest('hex'),hskGetRow_:(sheet,k)=>{const i=sheet.rows.findIndex(r=>r[0]===k);return i<0?null:{index:i+2,values:sheet.rows[i]};},UrlFetchApp:{fetch:(url,opt)=>{const body=JSON.parse(opt.payload);if(body.action==='verify'){verifyCalls++;return {getResponseCode:()=>200,getContentText:()=>JSON.stringify({ok:true,indices:[0,1,3,4],verification:'double_asr_exact'})};}calls++;serial=body.items.length;if(fail)return {getResponseCode:()=>502,getContentText:()=>JSON.stringify({ok:false,error:'tts_generation_incomplete',retryable:true,providerAttempts:1,retryAfter:60})};return {getResponseCode:()=>200,getContentText:()=>JSON.stringify({ok:true,audioBase64:Buffer.from(audio(mismatch?serial-1:serial)).toString('base64'),mimeType:'audio/wav',providerAttempts:1})};}}});
 vm.runInContext(fs.readFileSync(new URL('Code.gs',root),'utf8').match(/function hskLE_[\s\S]*?(?=function hskGemini_)/)[0],c);
 vm.runInContext(fs.readFileSync(new URL('Parallel.gs',root),'utf8'),c);
 c.hskParallelAvailability_=()=>[{slot:1,retryAfter:0},{slot:2,retryAfter:0}];
 vm.runInContext(fs.readFileSync(new URL('IsolatedBatch.gs',root),'utf8'),c);vm.runInContext(fs.readFileSync(new URL('PartialRecovery.gs',root),'utf8'),c);
 function audio(n){const raw=[];function silence(ms){for(let i=0;i<ms*24;i++)raw.push(0,0);}silence(300);for(let j=0;j<n;j++){for(let i=0;i<12000;i++){const sample=Math.round(Math.sin(i*.1)*8000);raw.push(sample&255,(sample>>8)&255);}silence(1200);}return c.hskWav_(raw,'audio/l16');}
 return {c,p,props,tables,files,storage,queue,audio,get calls(){return calls},get verifyCalls(){return verifyCalls},get sent(){return serial},fail:()=>fail=true,mismatch:()=>mismatch=true};
}
test('DSP signed PCM, WAV bounds, 120/200ms padding and 450ms internal gap protection',()=>{
 const f=fixture();const clips=f.c.hskBatchSplit_(f.audio(5),5);assert.equal(clips.length,5);for(const clip of clips){const pcm=f.c.hskBatchPcm_(clip);assert.ok(pcm.length/48000>.8);}
 assert.throws(()=>f.c.hskBatchSplit_(f.audio(4),5),/count_mismatch/);assert.throws(()=>f.c.hskBatchPcm_([1,2]),/invalid_wav/);
 const broken=f.audio(1);broken[24]=1;assert.throws(()=>f.c.hskBatchPcm_(broken),/invalid_format/);
});
test('five items use one provider request, deterministic individual cache; rerun makes no duplicate',()=>{
 const f=fixture();f.c.hskWarmIsolatedTick();assert.equal(f.calls,1);assert.equal(f.storage.sheet.rows.filter(r=>r[11]==='READY').length,5);assert.equal(f.files.size,6);f.props.delete('HSK_WARM_RETRY_AT');f.c.hskWarmIsolatedTick();assert.equal(f.calls,1);assert.equal(f.files.size,6);
});
test('old exhausted incomplete TTS is retried first instead of creating new corpus entries',()=>{
 const f=fixture();f.queue.rows.push([3,'中国',3,Date.now()+86400000,'REVIEW','cloudflare_tts_502_tts_generation_incomplete']);f.c.hskWarmIsolatedTick();assert.equal(f.sent,1);assert.equal(f.queue.rows[0][4],'DONE');assert.equal(f.storage.sheet.rows[0][0],f.c.hskDigest_(JSON.stringify(['zh-CN','Kore','gemini-2.5-flash-preview-tts','中国'])));assert.equal(f.props.get('HSK_WARM_CURSOR'),'0');
});
test('count mismatch saves four verified clips, retries only the missing word, reuses master',()=>{
 const f=fixture();f.mismatch();f.c.hskWarmIsolatedTick();assert.equal(f.calls,1);assert.equal(f.verifyCalls,1);
 assert.equal(f.files.size,5);assert.equal(f.storage.sheet.rows.filter(r=>r[11]==='READY').length,4);
 assert.equal(f.props.get('HSK_WARM_ISOLATED_SIZE'),'2');assert.equal(f.queue.rows.length,5);
 assert.equal(f.queue.rows.filter(r=>r[4]==='DONE').length,4);
 assert.equal(f.queue.rows.filter(r=>r[4]==='PENDING').length,1);assert.equal(f.queue.rows.find(r=>r[4]==='PENDING')[1],'再见');
 assert.equal(f.tables.get('Voice_Batches').rows[0][3],'PARTIAL');
 f.c.hskWarmIsolatedTick();assert.equal(f.calls,1);assert.equal(f.files.size,5);
});
test('definitive generation failure keeps every item in retry queue and advances no cursor',()=>{
 const f=fixture();f.fail();f.c.hskWarmIsolatedTick();assert.equal(f.calls,1);assert.equal(f.queue.rows.length,5);assert.ok(f.queue.rows.every(r=>r[4]==='PENDING'));assert.equal(f.files.size,0);assert.equal(f.props.get('HSK_WARM_CURSOR'),undefined);assert.equal(f.props.get('HSK_WARM_VENDOR_CALLS'),'1');
});
test('interrupted RESERVED batch without master pauses instead of rebilling',()=>{
 const f=fixture();const journal=f.c.hskBatchTable_(f.storage);journal.appendRow(['test','[]','','RESERVED','','',1]);f.c.hskWarmIsolatedTick();assert.equal(f.calls,0);assert.equal(f.props.get('HSK_WARM_LAST_ERROR'),'batch_transport_uncertain');
});
test('batch bridge preserves separate transcript lines and uses normal configured TTS model',async()=>{
 let calls=0,payload,url;const sub='123456789123456789';const hash=createHash('sha256').update(sub).digest('hex');
 const slot=(_slot,isolated)=>{assert.equal(isolated,false,'batch must share quota cooldown with its standard TTS model');return async(u,init)=>{calls++;url=u;payload=JSON.parse(init.body);return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{inlineData:{data:'AAAAAA==',mimeType:'audio/L16'}}]}}]});};};
 const h=createVoicePrecacheHandler(async()=>Response.json({iss:'https://accounts.google.com',sub,email_verified:true,exp:Date.now()/1000+3600,aud:'test'}),null,()=>Date.now(),slot);
 const env={HSK_VOICE_GOOGLE_SUB_SHA256:hash,HSK_VOICE_ISOLATED_MODEL:'gemini-3.1-flash-tts-preview'};
 const req=x=>new Request('https://x/voice-precache',{method:'POST',headers:{Authorization:'Bearer test'},body:JSON.stringify(x)});
 assert.equal((await h(req({items:['你好','谢谢'],keySlot:1,isolated:true}),env)).status,200);assert.equal(calls,1);assert.match(url,/gemini-2.5-flash-preview-tts/);assert.match(payload.contents[0].parts[0].text,/你好。 \.\.\.\n谢谢。 \.\.\./);assert.match(payload.contents[0].parts[0].text,/1.2 seconds/);
 for(const body of [{items:['你好'],keySlot:1},{items:['你好\n谢谢'],keySlot:1,isolated:true},{items:['你好'],text:'谢谢',keySlot:1,isolated:true},{items:Array(61).fill('你好'),keySlot:1,isolated:true}])assert.equal((await h(req(body),env)).status,400);assert.equal(calls,1);
});
test('300ms word-internal silence stays inside the same clip',()=>{
 const f=fixture(),raw=[];
 function tone(ms){for(let i=0;i<ms*24;i++){const n=Math.round(Math.sin(i*.1)*9000);raw.push(n&255,(n>>8)&255);}}
 function silence(ms){for(let i=0;i<ms*24;i++)raw.push(0,0);}
 silence(200);tone(300);silence(300);tone(300);silence(1200);tone(300);silence(200);
 assert.equal(f.c.hskBatchSplit_(f.c.hskWav_(raw,'audio/l16'),2).length,2);
});
test('saved master resumes after interruption without regeneration or duplicate individual files',()=>{
 const f=fixture();f.c.hskWarmIsolatedTick();const journal=f.tables.get('Voice_Batches');journal.rows[0][3]='MASTER';f.props.set('HSK_WARM_ENABLED','true');f.props.delete('HSK_WARM_RETRY_AT');f.c.hskWarmIsolatedTick();assert.equal(f.calls,1);assert.equal(f.files.size,6);assert.equal(journal.rows[0][3],'DONE');assert.equal(f.storage.sheet.rows.length,5);
});

test('repair queue can use legacy slot zero and treats it as a valid selected key',()=>{
 const f=fixture();f.c.hskParallelAvailability_=()=>[{slot:0,retryAfter:0}];f.c.hskWarmIsolatedTick();
 assert.equal(f.calls,1);assert.equal(f.tables.get('Voice_Batches').rows[0][6],0);
 assert.equal(f.storage.sheet.rows.filter(r=>r[11]==='READY').length,5);
});

test('verified successful key wins over unproven key without bypassing cooldown',()=>{
 const f=fixture(),j=f.c.hskBatchTable_(f.storage);j.appendRow(['prior','[]','','DONE','',new Date().toISOString(),0]);
 f.c.hskParallelAvailability_=()=>[{slot:0,retryAfter:0},{slot:6,retryAfter:0}];f.props.set('HSK_WARM_NEXT_SLOT','6');f.c.hskWarmIsolatedTick();assert.equal(j.rows.at(-1)[6],0);
 const g=fixture(),k=g.c.hskBatchTable_(g.storage);k.appendRow(['prior','[]','','DONE','',new Date().toISOString(),0]);
 g.c.hskParallelAvailability_=()=>[{slot:0,retryAfter:900},{slot:6,retryAfter:0}];g.c.hskWarmIsolatedTick();assert.equal(k.rows.at(-1)[6],6);
});

test('recovered model has correct cache identity and existing audio is reused across models',()=>{
 const f=fixture();f.p.setProperty('HSK_WARM_SLOT_6_MODEL','gemini-3.1-flash-tts-preview');f.c.hskParallelAvailability_=()=>[{slot:6,retryAfter:0}];
 for(let i=0;i<5;i++){f.props.delete('HSK_WARM_RETRY_AT');f.props.delete('HSK_WARM_SLOT_6_AFTER');f.c.hskWarmIsolatedTick();}assert.equal(f.calls,5);assert.ok(f.storage.sheet.rows.every(r=>r[3]==='gemini-3.1-flash-tts-preview'));
 f.props.delete('HSK_WARM_RETRY_AT');f.c.hskParallelAvailability_=()=>[{slot:0,retryAfter:0}];f.c.hskWarmIsolatedTick();assert.equal(f.calls,5);assert.equal(f.files.size,10);
});

test('recovered model starts with one item matching the verified live probe',()=>{
 const f=fixture();f.p.setProperty('HSK_WARM_SLOT_6_MODEL','gemini-3.1-flash-tts-preview');f.c.hskParallelAvailability_=()=>[{slot:6,retryAfter:0}];f.c.hskWarmIsolatedTick();assert.equal(f.sent,1);assert.equal(f.storage.sheet.rows.length,1);
});

test('model rejection defers only the selected key and never stops other keys',()=>{
 const f=fixture();f.c.UrlFetchApp.fetch=()=>({getResponseCode:()=>502,getContentText:()=>JSON.stringify({ok:false,error:'tts_request_rejected',providerAttempts:1,retryable:false,retryAfter:86400,diagnostic:{status:'INVALID_ARGUMENT'}})});
 f.c.hskWarmIsolatedTick();assert.equal(f.props.get('HSK_WARM_ENABLED'),'true');assert.ok(f.queue.rows.every(r=>r[4]==='PENDING'&&r[2]===0));assert.ok(f.props.get('HSK_WARM_LAST_DIAGNOSTIC').includes('INVALID_ARGUMENT'));
});

test('legacy uncertain label is reconciled only with matching definitive rejection evidence for every job',()=>{
 const f=fixture();f.p.setProperty('HSK_BATCH_REPAIR_POLICY','isolated-v1');const j=f.c.hskBatchTable_(f.storage);j.appendRow(['prior',JSON.stringify([{index:0}]),'','REVIEW','batch_transport_uncertain','',6]);f.queue.rows.push([0,'x',0,0,'PENDING','cloudflare_tts_502_tts_request_rejected']);f.c.hskWarmIsolatedTick();assert.equal(j.rows[0][3],'FAILED');assert.equal(f.calls,1);
 const g=fixture(),k=g.c.hskBatchTable_(g.storage);k.appendRow(['prior',JSON.stringify([{index:0},{index:1}]),'','REVIEW','batch_transport_uncertain','',6]);g.queue.rows.push([0,'x',0,0,'PENDING','cloudflare_tts_502_tts_request_rejected']);g.c.hskWarmIsolatedTick();assert.equal(g.calls,0);assert.equal(g.props.get('HSK_WARM_ENABLED'),'false');
});

test("long batch saves twenty new entries in one request",()=>{
 const f=fixture(Array.from({length:20},(_,i)=>"你好"+String(i)));
 f.c.hskWarmConfigureLongBatch();f.c.hskWarmIsolatedTick();
 assert.equal(f.calls,1);assert.equal(f.sent,20);assert.equal(f.storage.sheet.rows.length,20);
});
