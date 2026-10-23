const assert=require('node:assert/strict'),zlib=require('node:zlib'),crypto=require('node:crypto'),api=require('../src/modules/speech/voice-model-transport.js');
(async()=>{
 const original=Uint8Array.from([11,12,13,14]);
 const raw=await api.unpackModel(new Blob([original]));
 assert.deepEqual(Array.from(raw),Array.from(original),'legacy uncompressed models must still work');
 const wrongZip=zlib.gzipSync(Buffer.from('not the pinned model'),{mtime:0});
 await assert.rejects(api.unpackModel(new Blob([wrongZip])),/Invalid decompressed Kokoro model size/,'reject mismatched gzip, do not silently use another model');
 const truncated=wrongZip.subarray(0,wrongZip.length-5);
 await assert.rejects(api.unpackModel(new Blob([truncated])),'reject broken gzip stream');
 assert.equal(api.rawBytes,92361116);assert.equal(api.rawSha,'fbae9257e1e05ffc727e951ef9b9c98418e6d79f1c9b6b13bd59f5c9028a1478');
 console.log('PASS lossless ONNX transport: legacy raw unchanged, mismatched/corrupt gzip rejected, pinned original size/hash');
})().catch(e=>{console.error(e);process.exitCode=1});
