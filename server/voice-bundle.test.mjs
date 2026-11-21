import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHandler } from './translator-worker-bundled.mjs';

const require = createRequire(import.meta.url);
const { generateBundledWorker } = require('../tools/build-worker-bundle.cjs');

test('deployed standalone Worker bundles Google-authenticated voice route',async()=>{
 let externalCalls=0;
 const worker=createHandler(async()=>{externalCalls++;throw Error('No upstream calls expected without Google ID token');});
 const req=new Request('https://hsk.example/voice-precache',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:'你好'})});
 const response=await worker(req,{HSK_VOICE_GOOGLE_SUB_SHA256:'a'.repeat(64)});
 assert.equal(response.status,401);
 assert.deepEqual(await response.json(),{ok:false,error:'unauthorized'});
 assert.equal(externalCalls,0);
});

test('translator-worker-bundled.mjs matches generated source modules 100%',()=>{
 const {output,previous}=generateBundledWorker();
 assert.equal(previous,output,'Run `node tools/build-worker-bundle.cjs` to resync server/translator-worker-bundled.mjs with source modules');
});
