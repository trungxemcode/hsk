import test from 'node:test';
import assert from 'node:assert/strict';
import {editObject} from './design/chatgpt.mjs';
import {handleDesign} from './design/worker.mjs';
const input=()=>({page:'home',mode:'desktop',key:'word-heading',styles:{fontSize:20},request:'Tăng chữ lên 28px',apiKey:'sk-test-not-a-real-api-key'});
const result=(changes)=>Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({summary:'Đã chỉnh',changes})}]}]});
test('Responses uses server key, no storage, selected-object patch only; null removes override',async()=>{
 let called=0;const patch=await editObject(input(),{OPENAI_API_KEY:'sk-server-only-test-key'},async(url,options)=>{called++;assert.equal(url,'https://api.openai.com/v1/responses');assert.equal(options.headers.Authorization,'Bearer sk-server-only-test-key');const body=JSON.parse(options.body);assert.equal(body.store,false);assert.equal(body.text.format.strict,true);assert.equal(body.model,'gpt-6-sol');assert.ok(!options.body.includes('sk-test'));return result([{property:'fontSize',value:null},{property:'borderRadius',value:16}]);});
 assert.equal(called,1);assert.deepEqual(patch.patch,{fontSize:null,borderRadius:16});
});
test('invalid target, properties, mode and missing key stop before provider',async()=>{
 for(const value of [{...input(),key:'__proto__'},{...input(),mode:'tablet'},{...input(),styles:{fontSize:9999}},{...input(),apiKey:''}])await assert.rejects(()=>editObject(value,{},()=>{throw Error('must not call provider');}));
});
test('provider cannot return arbitrary code or out-of-range styles',async()=>{
 for(const changes of [[{property:'innerHTML',value:'script'}],[{property:'fontSize',value:9999}],[{property:'color',value:'url(https://bad.test)'}]])await assert.rejects(()=>editObject(input(),{},async()=>result(changes)),e=>e.status===502);
});
test('refusal/incomplete and provider errors leave design unchanged and redact provider details',async()=>{
 for(const response of [Response.json({status:'incomplete'}),Response.json({status:'completed',output:[{content:[{type:'refusal',refusal:'no'}]}]}),new Response('secret-details',{status:401}),new Response('secret-details',{status:429})])await assert.rejects(()=>editObject(input(),{},async()=>response),e=>!e.message.includes('secret-details'));
});
test('AI endpoint denies guests/foreign origin before body/provider; owner success never publishes',async()=>{
 let calls=0;const env={DESIGN_BUCKET:{put(){throw Error('must not publish');}},OPENAI_API_KEY:'sk-test-key-long-enough'},body=JSON.stringify(input()),request=origin=>new Request('https://editor.test/__designer/chatgpt',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body});
 const deps={identity:async()=>({admin:false}),openaiFetch:async()=>{calls++;return result([{property:'fontSize',value:28}]);}};
 assert.equal((await handleDesign(request('https://editor.test'),env,{},deps)).status,403);
 assert.equal((await handleDesign(request('https://evil.test'),env,{},deps)).status,403);assert.equal(calls,0);
 const response=await handleDesign(request('https://editor.test'),env,{}, {...deps,identity:async()=>({admin:true})});assert.equal(response.status,200);assert.equal((await response.json()).patch.fontSize,28);assert.equal(calls,1);
});
