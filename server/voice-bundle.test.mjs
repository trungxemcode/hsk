import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from './translator-worker-bundled.mjs';

test('deployed standalone Worker bundles Google-authenticated voice route',async()=>{
 let externalCalls=0;
 const worker=createHandler(async()=>{externalCalls++;throw Error('No upstream calls expected without Google ID token');});
 const req=new Request('https://hsk.example/voice-precache',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:'你好'})});
 const response=await worker(req,{HSK_VOICE_GOOGLE_SUB_SHA256:'a'.repeat(64)});
 assert.equal(response.status,401);
 assert.deepEqual(await response.json(),{ok:false,error:'unauthorized'});
 assert.equal(externalCalls,0);
});
