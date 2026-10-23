/* Lossless ONNX transport. Compressed blobs remain compressed in IndexedDB,
   are inflated only in the worker, and must hash to the original Kokoro model. */
(function(root){
 'use strict';
 const rawBytes=92361116,rawSha='fbae9257e1e05ffc727e951ef9b9c98418e6d79f1c9b6b13bd59f5c9028a1478';
 async function unpackModel(blob){
  if(!blob || typeof blob.slice!=='function')throw Error('Missing ONNX model.');
  const header=new Uint8Array(await blob.slice(0,3).arrayBuffer());
  if(header[0]!==0x1f||header[1]!==0x8b||header[2]!==0x08)return new Uint8Array(await blob.arrayBuffer());
  const data=new Uint8Array(await new Response(blob.stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
  if(data.byteLength!==rawBytes)throw Error('Invalid decompressed Kokoro model size.');
  const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',data));
  const hash=Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');
  if(hash!==rawSha)throw Error('Kokoro model SHA-256 mismatch after decompression.');
  return data;
 }
 const api={unpackModel,rawBytes,rawSha};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.HSKVoiceModelTransport=api;
})(typeof self==='object'?self:globalThis);
