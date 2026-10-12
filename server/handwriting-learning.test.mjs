import test from 'node:test';
import assert from 'node:assert/strict';
import learning from '../handwriting-learning.js';

const bitmap=(()=>{const data=new Uint8Array(1024);data.set([1,1,1,1]);return learning.pack(data);})();
function makeStore(owner){
 const values=new Map();
 return learning.createStore({storage:{getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)},owner,characters:'你',modelVersion:'test-1'});
}

test('AI suggestions stay local unless sharing is separately enabled and confirmed',async()=>{
 const localOnly=makeStore('user-local');
 const privateResult=localOnly.record('你',bitmap,{confirmed:true,share:false,source:'ai'});
 assert.equal(privateResult.queued,0);
 assert.equal(localOnly.snapshot().samples[0].source,'ai');

 const shared=makeStore('user-shared');
 shared.record('你',bitmap,{confirmed:true,share:true,source:'ai'});
 let uploaded;
 const result=await shared.flush({user:{uid:'user-shared',getIdToken:async()=>'token'},endpoint:'https://worker.example/handwriting-samples',online:true,fetchFn:async(_url,request)=>{uploaded=JSON.parse(request.body);return Response.json({accepted:true});}});
 assert.equal(result.sent,1);
 assert.equal(uploaded.source,'ai');
 assert.equal(uploaded.label,'你');
 assert.equal(uploaded.confirmed,true);
});
