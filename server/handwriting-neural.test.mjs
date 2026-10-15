import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import core from '../handwriting-neural-core.js';

test('single glyph decoder filters supported characters, skips blank and ranks max CTC evidence',()=>{
 const out={dims:[1,2,4],data:Float32Array.from([.9,.05,.04,.01,.1,.2,.3,.4])};
 const result=core.decode(out,['','你','好','X'],new Set(['你','好']));
 assert.deepEqual(result.map(r=>r.character),['好','你']);
 assert.deepEqual(core.decode(out,['','你','龘','X'],null).map(r=>r.character),['龘','你'],'general candidates include Han outside HSK but exclude Latin labels');
 assert.throws(()=>core.decode({...out,dims:[1,2,5]},['','你','好','X'],new Set(['你'])));
});
test('confirmed exact personal recall remains first; conflicting labels cannot override model',()=>{
 const neural=[{character:'他',score:.99}],shape=[{character:'你',score:3}];
 assert.equal(core.combine(neural,shape,'bitmap',[{label:'你',bitmap:'bitmap'}])[0].character,'你');
 assert.equal(core.combine(neural,shape,'bitmap',[{label:'你',bitmap:'bitmap'},{label:'好',bitmap:'bitmap'}])[0].character,'他');
 assert.deepEqual(core.combine(neural,shape,'new',[]).map(c=>c.character),['他','你']);
});
test('render uses 48x320 RGB with neutral padding, rejects non-finite or empty drawings',()=>{
 const canvas=()=>({getContext:()=>({fillRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},drawImage(){},getImageData:()=>({data:new Uint8ClampedArray(48*48*4).fill(255)})})});
 const input=core.render([[[0,0],[1,1]]],canvas);
 assert.equal(input.length,3*48*320);assert.equal(input[0],1);assert.equal(input[48],0);
 assert.throws(()=>core.render([],canvas));assert.throws(()=>core.render([[[NaN,1]]],canvas));
});
function environment({corrupt=false,cached=false}={}){
 const bytes=new TextEncoder().encode('verified-test-asset');
 // Hash is filled from actual bytes; mocks verify the same production integrity path.
 const requests=[],items=new Map(),ctx={self:null,crypto:webcrypto,Response,Blob,URL,AbortSignal,OffscreenCanvas:function(){},importScripts(){},ort:{env:{wasm:{}},InferenceSession:{create:async()=>({})}}};
 ctx.self=ctx;ctx.caches={open:async()=>({match:async url=>items.get(url)?.clone(),put:async(url,r)=>items.set(url,r),delete:async url=>items.delete(url)})};
 ctx.setup=async()=>{
  const sha=Array.from(new Uint8Array(await webcrypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
  const config={assets:Object.fromEntries(['runtime','module','wasm','model'].map(name=>[name,{url:'https://assets.example/'+name,sha256:sha,bytes:bytes.length,type:'application/octet-stream'}]))};
  if(cached)for(const name of Object.keys(config.assets))items.set(config.assets[name].url,new Response(bytes));
  ctx.fetch=async url=>{requests.push(String(url));if(url==='./handwriting-neural-config.json')return Response.json(config);if(url==='./handwriting-neural-characters.json')return Response.json(['','你']);return new Response(corrupt?'wrong':bytes);};
  vm.createContext(ctx);vm.runInContext(fs.readFileSync(new URL('../handwriting-neural.js',import.meta.url),'utf8'),ctx);
 };
 return {ctx,requests,items};
}
test('cached model reload performs no external downloads and only requests static local metadata',async()=>{
 const e=environment({cached:true});await e.ctx.setup();await e.ctx.HSKHandwritingNeural.load({download:false});
 assert.ok(e.requests.every(url=>url.startsWith('./')));
});
test('model download refuses corruption and missing offline assets',async()=>{
 const corrupt=environment({corrupt:true});await corrupt.ctx.setup();await assert.rejects(corrupt.ctx.HSKHandwritingNeural.load({download:true}),/đúng phiên bản/);
 const missing=environment();await missing.ctx.setup();await assert.rejects(missing.ctx.HSKHandwritingNeural.load({download:false}),/Chưa tải mô hình/);
 assert.ok(missing.requests.every(url=>url.startsWith('./')));
});
test('worker uses enabled neural results and falls back safely after inference failure',async()=>{
 const messages=[];let fail=false,readyResolve;
 const ready=new Promise(resolve=>{readyResolve=resolve;});
 const ctx={self:null,onmessage:null,URL,Uint8Array,Float32Array,Float64Array,Set,Map,Array,Math,Number,Error,Buffer,
  fetch:async url=>Response.json(JSON.parse(fs.readFileSync(new URL('../'+url.slice(2),import.meta.url),'utf8'))),
  postMessage:message=>{messages.push(message);if(message.type==='ready')readyResolve();}
 };
 ctx.self=ctx;vm.createContext(ctx);
 ctx.importScripts=(...files)=>{for(const file of files){if(file==='./handwriting-neural.js'){ctx.HSKHandwritingNeural={load:async()=>true,recognize:async()=>{if(fail)throw Error('runtime failure');return [{character:'你',score:.9}];}};}else vm.runInContext(fs.readFileSync(new URL('../'+file.slice(2),import.meta.url),'utf8'),ctx);}};
 vm.runInContext(fs.readFileSync(new URL('../handwriting-worker.js',import.meta.url),'utf8'),ctx);await ready;
 await ctx.onmessage({data:{type:'neural-enable',enabled:true,download:false}});
 const query={type:'recognize',id:1,strokes:[[[0,0],[1,1]],[[1,0],[0,1]]],samples:[]};
 await ctx.onmessage({data:query});assert.equal(messages.at(-1).engine,'neural');assert.equal(messages.at(-1).candidates[0].character,'你');
 fail=true;await ctx.onmessage({data:{...query,id:2}});assert.equal(messages.at(-1).engine,'shape');assert.ok(messages.at(-1).candidates.length>0);assert.ok(messages.at(-1).warning);
});
