import test from 'node:test';
import assert from 'node:assert/strict';
import {validTranscriptInput,transcribeMusic} from './music-transcript.mjs';
import {createHandler} from './translator-worker-bundled.mjs';
const media={mimeType:'audio/mpeg',data:Buffer.from('ID3'+ 'a'.repeat(40)).toString('base64')},body={media,duration:30,reference:''};
const cue=(text='明天见',uncertain=false)=>({start:1,end:4,text,uncertain,reason:''});
function response(cues,finishReason='STOP'){return Response.json({candidates:[{finishReason,content:{parts:[{text:JSON.stringify({cues})}]}}]});}
test('limits, actual signature and duration validated before processing',()=>{
 assert.equal(validTranscriptInput(body),true);
 for(const b of [{...body,duration:481},{...body,duration:0},{...body,reference:'x'.repeat(12001)},{...body,media:{...media,mimeType:'video/mp4'}},{...body,media:{...media,data:'a'.repeat(8388612)}},{...body,url:'https://internal'}])assert.equal(validTranscriptInput(b),false);
});
test('two audio passes flag homophone substitutions; never auto-confirm matching output',async()=>{
 let calls=0,reservations=0;const r=await transcribeMusic(body,{env:{},fetchFn:async(u,o)=>{const p=JSON.parse(o.body);assert.equal(p.contents[0].parts[0].inlineData.data,media.data);assert.match(p.systemInstruction.parts[0].text,/Homophones are NOT interchangeable/);return response([cue(++calls===1?'在见':'再见')]);},reserve:async()=>reservations++});
 assert.equal(calls,2);assert.equal(reservations,1);assert.equal(r.cues[0].text,'再见');assert.equal(r.cues[0].uncertain,true);assert.equal(r.reviewed,false);assert.equal(r.status,'draft');
});
test('invalid times, truncated and empty output fail closed',async()=>{
 for(const result of [()=>response([]),()=>response([{...cue(),end:99}]),()=>response([cue()],'MAX_TOKENS')])await assert.rejects(transcribeMusic(body,{env:{},fetchFn:async()=>result(),reserve:async()=>{}}));
});
test('second pass budget denial never exposes a partial transcript',async()=>{let calls=0;await assert.rejects(transcribeMusic(body,{env:{},fetchFn:async()=>{calls++;return response([cue()]);},reserve:async()=>{throw Error('quota');}}),/quota/);assert.equal(calls,1);});
const now=Date.now(),uid='listener',token='h.'+Buffer.from(JSON.stringify({aud:'hsk-flashcards-44631',iss:'https://securetoken.google.com/hsk-flashcards-44631',sub:uid,exp:now/1000+3600})).toString('base64url')+'.s';
test('public-account route requires Firebase auth, charges two query slots and uses Gemini media',async()=>{
 const actions=[];let calls=0;
 const env={GEMINI_API_KEY:'fake',FIREBASE_API_KEY:'fake',AI_CONTROL:{idFromName:x=>x,get:()=>({fetch:async(u,o)=>{const b=JSON.parse(o.body);actions.push(b.action);return Response.json(b.action==='gemini-pick'?{index:0}: {allowed:true});}})}};
 const handler=createHandler(async(u,o)=>{if(u.includes('identitytoolkit'))return Response.json({users:[{localId:uid}]});calls++;return response([cue()]);},()=>now);
 const run=(auth,b=body)=>handler(new Request('https://test/music-transcript',{method:'POST',headers:{Origin:'https://trungxemcode.github.io',...(auth?{Authorization:'Bearer '+auth}:{})},body:JSON.stringify(b)}),env);
 assert.equal((await run(null)).status,401);assert.equal((await run(token,{...body,duration:900})).status,400);assert.equal(calls,0);
 const r=await run(token);assert.equal(r.status,200);assert.equal(calls,2);assert.equal(actions.filter(a=>a==='reserve').length,2);assert.equal((await r.json()).reviewed,false);
});
