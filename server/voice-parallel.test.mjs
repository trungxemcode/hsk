import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash,webcrypto} from 'node:crypto';
import {createGeminiKeyFetch} from './gemini-keys.mjs';
import {createVoicePrecacheHandler} from './voice-tts.mjs';
globalThis.crypto ||= webcrypto;
const source=fs.readFileSync(new URL('../tools/voice-cache-apps-script/Parallel.gs',import.meta.url),'utf8');
function fixture(texts=['爱','八','爱','九','十','好','我','你','他','她','它','们']){
 const props=new Map([['HSK_WARM_ENABLED','true']]),rows=[],deferred=[];let calls=[],locked=false,failSlot=0,throwTransport=false;
 const p={getProperty:k=>props.get(k)||null,setProperty:(k,v)=>props.set(k,String(v)),deleteProperty:k=>props.delete(k)};
 const table=data=>({getLastRow:()=>data.length+1,appendRow:r=>data.push([...r]),getRange:(row,col,n=1,width=13)=>({getValues:()=>data.slice(row-2,row-2+n).map(r=>r.slice(col-1,col-1+width)),setValues:values=>values.forEach((v,i)=>{data[row-2+i] ||= [];v.forEach((x,j)=>data[row-2+i][col-1+j]=x);})})});
 const files=new Map(),sheet=table(rows),queue=table(deferred);
 const folder={getFilesByName:name=>({hasNext:()=>files.has(name),next:()=>files.get(name)}),createFile:blob=>{const f={getId:()=>blob.name};files.set(blob.name,f);return f;}};
 const c=vm.createContext({Date,Set,Map,hskSettings_:()=>p,hskWarmCorpus_:()=>texts,hskDigest_:s=>createHash('sha256').update(s).digest('hex'),hskCheck_:()=>({sheet,folder}),hskWarmQueue_:()=>queue,hskWarmProgress_:()=>{},hskWarmStop:()=>p.setProperty('HSK_WARM_ENABLED','false'),ScriptApp:{getIdentityToken:()=> 'test'},SpreadsheetApp:{flush(){}},LockService:{getScriptLock:()=>({tryLock:()=>!locked,releaseLock(){}})},Utilities:{base64Decode:s=>[...Buffer.from(s,'base64')],newBlob:(bytes,mime,name)=>({bytes,mime,name})},hskWav_:bytes=>bytes,
 UrlFetchApp:{fetchAll:requests=>{calls.push(requests.map(r=>JSON.parse(r.payload)));if(throwTransport)throw Error('network');return requests.map(r=>{const body=JSON.parse(r.payload),bad=body.keySlot===failSlot;return {getResponseCode:()=>bad?429:200,getContentText:()=>JSON.stringify(bad?{ok:false,error:'tts_provider_unavailable',retryAfter:600}:{ok:true,audioBase64:'AQIDBA==',mimeType:'audio/L16'})};});}}});
 vm.runInContext(source,c);
 return {c,p,props,rows,deferred,files,get calls(){return calls},lock:()=>locked=true,fail:slot=>failSlot=slot,transportFail:()=>throwTransport=true};
}
test('parallel batch sends nine distinct sentences on nine distinct key slots, caches repeats across ticks',()=>{
 const f=fixture();f.c.hskWarmParallelTick();assert.equal(f.calls[0].length,9);assert.deepEqual(Array.from(f.calls[0],r=>r.keySlot),[1,2,3,4,5,6,7,8,9]);assert.equal(new Set(f.calls[0].map(r=>r.text)).size,9);
 f.c.hskWarmParallelTick();assert.equal(f.rows.filter(r=>r[11]==='READY').length,11);assert.equal(f.files.size,11);assert.equal(new Set(f.rows.map(r=>r[0])).size,f.rows.length);
 f.c.hskWarmParallelTick();assert.equal(f.calls.length,2);assert.equal(f.props.get('HSK_WARM_ENABLED'),'false');
});
test('quota on one slot defers only its sentence and lets eight others save; later tick skips its cooldown',()=>{
 const f=fixture();f.fail(4);f.c.hskWarmParallelTick();assert.equal(f.rows.filter(r=>r[11]==='READY').length,8);assert.equal(f.deferred.length,1);assert.equal(f.deferred[0][4],'PENDING');
 f.c.hskWarmParallelTick();assert.ok(f.calls[1].every(r=>r.keySlot!==4));assert.equal(f.rows.filter(r=>r[11]==='READY').length,10);assert.notEqual(f.props.get('HSK_WARM_ENABLED'),'false');
});
test('uncertain batch transport never automatically regenerates reserved sentences',()=>{
 const f=fixture();f.transportFail();f.c.hskWarmParallelTick();assert.equal(f.deferred.length,9);assert.ok(f.deferred.every(r=>r[4]==='REVIEW'));f.c.hskWarmParallelTick();const all=f.calls.flat().map(r=>r.text);assert.equal(all.length,new Set(all).size);
});
test('interrupted reservation behind cursor recovers existing file without another paid call',()=>{
 const f=fixture(['爱']);const key=createHash('sha256').update(JSON.stringify(['zh-CN','Kore','gemini-2.5-flash-preview-tts','爱'])).digest('hex'),name='hsk-tts-'+key.slice(0,24)+'.wav';
 f.rows.push([key,'zh-CN','Kore','gemini-2.5-flash-preview-tts','','audio/wav',0,'','',0,1,'PROCESSING','']);f.props.set('HSK_WARM_CURSOR','1');f.files.set(name,{getId:()=>name});f.c.hskWarmParallelTick();assert.equal(f.rows[0][11],'READY');assert.equal(f.calls.length,0);
});
test('interrupted reservation without a saved file becomes REVIEW, never silently billed twice',()=>{
 const f=fixture(['爱']);const key=createHash('sha256').update(JSON.stringify(['zh-CN','Kore','gemini-2.5-flash-preview-tts','爱'])).digest('hex');
 f.rows.push([key,'zh-CN','Kore','gemini-2.5-flash-preview-tts','','audio/wav',0,'','',0,1,'PROCESSING','']);f.props.set('HSK_WARM_CURSOR','1');f.c.hskWarmParallelTick();assert.equal(f.rows[0][11],'REVIEW');assert.equal(f.deferred[0][4],'REVIEW');assert.equal(f.calls.length,0);
});
test('shared script lock prevents overlapping timer or on-demand generation',()=>{const f=fixture();f.lock();f.c.hskWarmParallelTick();assert.equal(f.rows.length,0);assert.equal(f.calls.length,0);});
test('runtime budget prevents a batch from starting near its daily cap',()=>{const f=fixture();f.props.set('HSK_WARM_WINDOW_START',String(Date.now()));f.props.set('HSK_WARM_RUNTIME_MS','3550000');f.c.hskWarmParallelTick();assert.equal(f.calls.length,0);assert.ok(Number(f.props.get('HSK_WARM_RETRY_AT'))>Date.now());});
test('pinned keys remain distinct for nine simultaneous authenticated requests, no cross-key fallback',async()=>{
 const env={};for(let i=1;i<=9;i++)env['GEMINI_API_KEY_'+i]='test-key-'+i;
 const seen=[];const raw=async(url,init)=>{seen.push(init.headers.get('x-goog-api-key'));return Response.json({error:'quota'},{status:429});};
 const responses=await Promise.all(Array.from({length:9},(_,i)=>createGeminiKeyFetch(raw,env,{slot:i+1})('https://generativelanguage.googleapis.com/v1beta/models/test:generateContent',{})));
 assert.equal(seen.length,9);assert.equal(new Set(seen).size,9);assert.ok(responses.every(r=>r.status===429));
 const missing=await createGeminiKeyFetch(raw,env,{slot:10})('https://generativelanguage.googleapis.com/v1beta/models/test:generateContent',{});assert.equal(missing.status,503);assert.equal(seen.length,9);
});
test('voice slot selection is validated after verified Google identity and never available to unsigned callers',async()=>{
 const sub='113615575809199186059',env={HSK_VOICE_GOOGLE_SUB_SHA256:createHash('sha256').update(sub).digest('hex')};let selected=0;
 const identity=async()=>Response.json({iss:'https://accounts.google.com',email_verified:true,sub,exp:Date.now()/1000+3600,aud:'test'});
 const provider=async()=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{inlineData:{mimeType:'audio/L16',data:'AQIDBA=='}}]}}]});
 const h=createVoicePrecacheHandler(identity,provider,()=>Date.now(),slot=>{selected=slot;return provider;});
 const req=(slot,auth=true)=>new Request('https://test/voice-precache',{method:'POST',headers:auth?{Authorization:'Bearer test'}:{},body:JSON.stringify({text:'你好',keySlot:slot})});
 assert.equal((await h(req(9),env)).status,200);assert.equal(selected,9);
 for(const slot of [0,10,'1',1.5])assert.equal((await h(req(slot),env)).status,400);
 assert.equal((await h(req(2,false),env)).status,401);assert.equal(selected,9);
});

