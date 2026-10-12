/* Optional verified model/runtime cache. No drawing leaves this worker. */
(function(root){
 'use strict';
 let pending=null,session=null,characters=null,objectUrls=[];
 const CACHE='hsk-handwriting-neural-ppocrv5-ort122-v1';
 async function verifiedAsset(cache,asset,download){
  let response=await cache.match(asset.url);const cached=!!response;
  if(!response){if(!download)throw Error('Chưa tải mô hình nhận dạng.');response=await fetch(asset.url,{signal:AbortSignal.timeout(120000)});if(!response.ok||response.type==='opaque')throw Error('Không tải được mô hình nhận dạng.');}
  const bytes=await response.arrayBuffer();
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
  if(hash!==asset.sha256||bytes.byteLength!==asset.bytes){await cache.delete(asset.url);throw Error('Dữ liệu tải về chưa đúng phiên bản. Hãy thử lại.');}
  if(!cached)await cache.put(asset.url,new Response(bytes,{headers:{'Content-Type':asset.type}}));
  return bytes;
 }
 async function load({download=false,progress=()=>{}}={}){
  if(session)return true;if(pending)return pending;
  pending=(async()=>{
   if(typeof OffscreenCanvas!=='function')throw Error('Trình duyệt chưa hỗ trợ nhận dạng nâng cao.');
   const response=await fetch('./handwriting-neural-config.json');if(!response.ok)throw Error('Chưa có cấu hình mô hình.');
   const config=await response.json(),cache=await caches.open(CACHE),assets={};
   for(const [name,asset] of Object.entries(config.assets)){progress(name);assets[name]=await verifiedAsset(cache,asset,download);}
   const charsResponse=await fetch('./handwriting-neural-characters.json');if(!charsResponse.ok)throw Error('Chưa tải danh sách chữ của mô hình.');characters=await charsResponse.json();
   const blob=(bytes,type)=>{const url=URL.createObjectURL(new Blob([bytes],{type}));objectUrls.push(url);return url;};
   if(!root.ort)importScripts(blob(assets.runtime,'text/javascript'));
   root.ort.env.wasm.numThreads=1;root.ort.env.wasm.proxy=false;
   root.ort.env.wasm.wasmPaths={mjs:blob(assets.module,'text/javascript'),wasm:blob(assets.wasm,'application/wasm')};
   session=await root.ort.InferenceSession.create(assets.model,{executionProviders:['wasm'],graphOptimizationLevel:'all'});
   return true;
  })().catch(error=>{for(const url of objectUrls)URL.revokeObjectURL(url);objectUrls=[];throw error;}).finally(()=>{pending=null;});
  return pending;
 }
 async function recognize(strokes,supported){
  if(!session)return [];
  const tensor=new root.ort.Tensor('float32',root.HSKHandwritingNeuralCore.render(strokes),[1,3,48,320]);
  let output;
  try{output=await session.run({[session.inputNames[0]]:tensor});return root.HSKHandwritingNeuralCore.decode(output[session.outputNames[0]],characters,supported);}finally{tensor.dispose();if(output)for(const value of Object.values(output))value.dispose();}
 }
 root.HSKHandwritingNeural={load,recognize};
})(self);
