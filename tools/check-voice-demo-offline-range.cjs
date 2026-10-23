/* Offline shell caches demos during version updates and serves Safari byte ranges. */
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),vm=require('node:vm'),crypto=require('crypto');
const root=process.cwd(),catalog=JSON.parse(fs.readFileSync('src/modules/speech/voice-catalog.json')),release=JSON.parse(fs.readFileSync('app-version.json'));
const sw=fs.readFileSync('offline-worker.js','utf8');
const listeners={};
const demoPaths=catalog.voices.map(v=>path.posix.normalize('src/modules/speech/'+v.demo.url));
for(const asset of demoPaths){
 const buf=fs.readFileSync(asset);
 assert.ok(sw.includes(JSON.stringify(asset)),'Demo must install automatically with PWA: '+asset);
 assert.equal(release.assets[asset]?.sha256,crypto.createHash('sha256').update(buf).digest('hex'),'Demo must match update checksum: '+asset);
}
const sample=demoPaths[0],body=fs.readFileSync(sample),site='https://example.org/hsk/';
const fake={self:{location:{origin:'https://example.org'},registration:{scope:site},addEventListener:(name,fn)=>listeners[name]=fn},caches:{open:async()=>({match:async url=>url===site+sample?new Response(body,{headers:{'Content-Type':'audio/mpeg'}}):undefined})},Request,Response,Headers,URL,AbortController,TextDecoder,crypto:crypto.webcrypto,setTimeout,clearTimeout,console};
vm.runInNewContext(sw,fake);
async function fetchCached(range){
 const url=site+sample,headers=range?{Range:range}:{};
 let promise;
 listeners.fetch({request:new Request(url,{headers}),respondWith:p=>promise=p});
 assert.ok(promise,'cache controlled request');
 return promise;
}
(async()=>{
 const all=await fetchCached();assert.equal(all.status,200);assert.deepEqual(Buffer.from(await all.arrayBuffer()),body);
 const range=await fetchCached('bytes=0-31');assert.equal(range.status,206);assert.equal(range.headers.get('Content-Range'),'bytes 0-31/'+body.length);assert.equal(range.headers.get('Content-Length'),'32');assert.deepEqual(Buffer.from(await range.arrayBuffer()),body.subarray(0,32));
 const suffix=await fetchCached('bytes=-31');assert.equal(suffix.status,206);assert.equal((await suffix.arrayBuffer()).byteLength,31);
 const invalid=await fetchCached('bytes=999999-');assert.equal(invalid.status,416);assert.equal(invalid.headers.get('Content-Range'),'bytes */'+body.length);
 console.log('PASS demo update cache: all',demoPaths.length,'MP3 verified in PWA; Safari 200/206/416 from cached audio at /hsk/');
})().catch(e=>{console.error(e);process.exitCode=1});
