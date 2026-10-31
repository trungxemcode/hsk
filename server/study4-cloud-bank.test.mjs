import {test} from 'node:test';
import assert from 'node:assert/strict';
import {gzipSync} from 'node:zlib';
import {handleExamBank,parseByteRange} from './exams/worker.mjs';
const hash='a'.repeat(64);
const fixture=()=>{
 const objects=new Map([['study4/manifest.json',new TextEncoder().encode('{"schema":1}')],['study4/data/'+hash+'.json.gz',gzipSync(Buffer.from('{\"schema\":1,\"tests\":[1]}'))],['study4/audio/'+hash+'.mp3',Uint8Array.of(73,68,51,4,1,2,3,4,5,6)]]);
 const bucket={head:async k=>objects.has(k)?{size:objects.get(k).length,httpEtag:'"etag"'}:null,get:async(k,o)=>objects.has(k)?{body:new Response(o?.range?objects.get(k).slice(o.range.offset,o.range.offset+o.range.length):objects.get(k)).body}:null};
 return {EXAM_BUCKET:bucket};
};
const req=(path,init={})=>new Request('https://exams.example'+path,init);
test('public manifest never caches; versioned gzip is decoded exactly once into browser-readable JSON',async()=>{
 const env=fixture();let r=await handleExamBank(req('/v1/manifest'),env);assert.equal(r.status,200);assert.equal(r.headers.get('Cache-Control'),'no-store');assert.equal(r.headers.get('Access-Control-Allow-Origin'),'*');
 r=await handleExamBank(req('/v1/data/'+hash+'.json.gz'),env);assert.equal(r.status,200);assert.equal(r.headers.get('Content-Encoding'),null);assert.equal(r.headers.get('Content-Length'),null);assert.deepEqual(await r.json(),{schema:1,tests:[1]});
});
test('audio supports 206 ranged request, HEAD, and rejects invalid ranges',async()=>{
 const env=fixture(),url='/v1/audio/'+hash+'.mp3';let r=await handleExamBank(req(url,{headers:{Range:'bytes=2-5'}}),env);assert.equal(r.status,206);assert.equal(r.headers.get('Content-Range'),'bytes 2-5/10');assert.deepEqual([...new Uint8Array(await r.arrayBuffer())],[51,4,1,2]);
 r=await handleExamBank(req(url,{method:'HEAD'}),env);assert.equal(r.headers.get('Accept-Ranges'),'bytes');assert.equal((await r.arrayBuffer()).byteLength,0);
 r=await handleExamBank(req(url,{headers:{Range:'bytes=20-30'}}),env);assert.equal(r.status,416);
 assert.deepEqual(parseByteRange('bytes=-3',10),{offset:7,length:3});
});
test('no open upload endpoints, arbitrary names, or leaked bucket listing',async()=>{
 const env=fixture();assert.equal((await handleExamBank(req('/v1/manifest',{method:'POST',body:'x'}),env)).status,405);assert.equal((await handleExamBank(req('/v1/audio/../private-key'),env)).status,404);assert.equal((await handleExamBank(req('/v1/audio/'+hash+'.mp3'),{})).status,503);
});
