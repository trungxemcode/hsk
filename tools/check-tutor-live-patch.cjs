const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{pathToFileURL}=require('url');
(async()=>{
 const before=await import(pathToFileURL(path.resolve(process.argv[2]))),after=await import(pathToFileURL(path.resolve(process.argv[3])));
 let providerCalls=0,seen=[];const fetcher=async(url,init)=>{if(url.includes('identitytoolkit'))return Response.json({users:[{localId:'qa-test',emailVerified:true}]});providerCalls++;seen.push(JSON.parse(init.body));return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({answer:'买 (mǎi) là mua.',terms:[{han:'买',pinyin:'mǎi',meaning:'mua'}]})}]}}]});};
 const map=new Map();let alarm=null;const storage={async get(k){return structuredClone(map.get(k))},async put(k,v){map.set(k,structuredClone(v))},async delete(k){map.delete(k)},async transaction(fn){return fn(this)},async getAlarm(){return alarm},async setAlarm(t){alarm=t}};
 const env={GEMINI_API_KEY:'fake-key',FIREBASE_API_KEY:'fake-key',ADMIN_UIDS:'qa-test',QA_CACHE_ENABLED:'true',QA_SHADOW_MODE:'off'};
 const control=new after.HSkaIControl({storage},env);env.AI_CONTROL={idFromName:n=>n,get:()=>({fetch:(u,i)=>control.fetch(new Request(u,i))})};
 const claims={aud:'hsk-flashcards-44631',iss:'https://securetoken.google.com/hsk-flashcards-44631',sub:'qa-test',exp:Math.floor(Date.now()/1000)+600};
 const request=()=>new Request('https://worker.test/dictionary-lookup',{method:'POST',headers:{Origin:'https://trungxemcode.github.io',Authorization:'Bearer h.'+Buffer.from(JSON.stringify(claims)).toString('base64url')+'.s'},body:JSON.stringify({query:'买'})});
 const oldHandler=before.createHandler(fetcher),newHandler=after.createHandler(fetcher);
 const a=await oldHandler(request(),env);assert.equal(a.status,200);const oldPayload=await a.json(),oldRequest=seen[0];providerCalls=0;seen=[];
 const miss=await newHandler(request(),env);assert.equal(miss.status,200);assert.equal(miss.headers.get('X-HSK-AI-Cache'),'miss');assert.deepEqual(await miss.json(),oldPayload);assert.deepEqual(seen[0],oldRequest,'Existing prompt and generation settings changed');
 const hit=await newHandler(request(),env);assert.equal(hit.status,200);assert.equal(hit.headers.get('X-HSK-AI-Cache'),'hit');assert.deepEqual(await hit.json(),oldPayload);assert.equal(providerCalls,1);
 for(const module of [before,after]){let calls=0;const handler=module.createHandler(async()=>{calls++;throw Error('No upstream access allowed')});const req=new Request('https://worker.test/voice-precache',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:'你好'})});const r=await handler(req,{HSK_VOICE_GOOGLE_SUB_SHA256:'a'.repeat(64)});assert.equal(r.status,401);assert.deepEqual(await r.json(),{ok:false,error:'unauthorized'});assert.equal(calls,0);}
 console.log('PASS actual deployed-source patch: original prompt/schema preserved; exact miss/hit makes1 provider call; authenticated voice boundary unchanged');
})().catch(e=>{console.error(e);process.exitCode=1});
