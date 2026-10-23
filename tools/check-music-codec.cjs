/* Execute the shipped worker and WASM, rather than mocking the encoder. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto').webcrypto;
const root=path.resolve(__dirname,'..'),worker=fs.readFileSync(path.join(root,'src/modules/music/music-codec-worker.js'),'utf8');
const cache=new Map();let wasmFetches=0;
async function run(bytes,bitrate){let result;const context={onmessage:null,self:{location:{href:'https://app.test/src/modules/music/music-codec-worker.js'}},URL,ArrayBuffer,Uint8Array,Number,JSON,Error,crypto,Response,
 caches:{open:async()=>({match:async u=>cache.get(u)?.clone(),put:async(u,r)=>cache.set(u,r),keys:async()=>[...cache.keys()].map(url=>({url})),delete:async u=>cache.delete(u)})},
 fetch:async u=>{const url=new URL(u);if(url.pathname.endsWith('.wasm'))wasmFetches++;return new Response(fs.readFileSync(path.join(root,url.pathname)));},
 importScripts:()=>{context.createFFmpegCore=require(path.join(root,'vendor/music-codec/ffmpeg-core.js'));},postMessage:data=>{if(['done','error'].includes(data.status))result=data;}};
 vm.runInNewContext(worker,context);await context.onmessage({data:{bytes,bitrate}});return result;}
(async()=>{const fixture=fs.readFileSync(path.join(root,'tools/fixtures/music-heaacv2-64k.m4a'));let previous=0;
 for(const bitrate of [32,64,96]){const input=fixture.buffer.slice(fixture.byteOffset,fixture.byteOffset+fixture.length),result=await run(input,bitrate);assert.equal(result.status,'done',result.error);assert.ok(result.bytes.byteLength>previous,'higher bitrate increases output bytes');previous=result.bytes.byteLength;console.log('PASS shipped WASM HE-AACv2',bitrate,'kbps',previous,'bytes');}
 assert.equal(wasmFetches,1,'verified WASM is reused from lazy cache');assert.equal((await run(new Uint8Array([1,2,3]).buffer,64)).status,'error');assert.equal((await run(new ArrayBuffer(1),128)).status,'error');console.log('PASS lazy codec cache, invalid audio and invalid quality rejection');
})().catch(e=>{console.error(e);process.exitCode=1});
