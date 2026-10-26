import test from 'node:test';
import assert from 'node:assert/strict';
import {validTranscriptInput,transcribeMusic,libraryTranscriptMedia} from './music-transcript.mjs';
import {createHandler} from './translator-worker-bundled.mjs';
const media={mimeType:'audio/mpeg',data:Buffer.from('ID3'+ 'a'.repeat(40)).toString('base64')},body={trackId:'a'.repeat(64)+'.mp3',duration:30,reference:''};
const cue=(text='明天见',uncertain=false)=>({start:1,end:4,text,uncertain,reason:''});
function response(cues,finishReason='STOP'){return Response.json({candidates:[{finishReason,content:{parts:[{text:JSON.stringify({cues})}]}}]});}
test('library track ID, duration and absence of browser media validated before processing',()=>{
 assert.equal(validTranscriptInput(body),true);
 for(const b of [{...body,trackId:'https://youtube.com/watch?v=test'},{...body,media},{...body,duration:481},{...body,duration:0},{...body,reference:'x'.repeat(12001)},{...body,media:{...media,mimeType:'video/mp4'}},{...body,media:{...media,data:'a'.repeat(8388612)}},{...body,url:'https://internal'}])assert.equal(validTranscriptInput(b),false);
});
test('two audio passes flag homophone substitutions; never auto-confirm matching output',async()=>{
 let calls=0,reservations=0;const r=await transcribeMusic({...body,media},{env:{},fetchFn:async(u,o)=>{const p=JSON.parse(o.body);assert.equal(p.contents[0].parts[0].inlineData.data,media.data);assert.match(p.systemInstruction.parts[0].text,/Homophones are NOT interchangeable/);return response([cue(++calls===1?'在见':'再见')]);},reserve:async()=>reservations++});
 assert.equal(calls,2);assert.equal(reservations,1);assert.equal(r.cues[0].text,'再见');assert.equal(r.cues[0].uncertain,true);assert.equal(r.reviewed,false);assert.equal(r.status,'draft');
});
test('invalid times, truncated and empty output fail closed',async()=>{
 for(const result of [()=>response([]),()=>response([{...cue(),end:99}]),()=>response([cue()],'MAX_TOKENS')])await assert.rejects(transcribeMusic({...body,media},{env:{},fetchFn:async()=>result(),reserve:async()=>{}}));
});
test('second pass budget denial never exposes a partial transcript',async()=>{let calls=0;await assert.rejects(transcribeMusic({...body,media},{env:{},fetchFn:async()=>{calls++;return response([cue()]);},reserve:async()=>{throw Error('quota');}}),/quota/);assert.equal(calls,1);});
const now=Date.now(),uid='listener',token='h.'+Buffer.from(JSON.stringify({aud:'hsk-flashcards-44631',iss:'https://securetoken.google.com/hsk-flashcards-44631',sub:uid,exp:now/1000+3600})).toString('base64url')+'.s';
test('public-account route requires Firebase auth, charges two query slots and uses Gemini media',async()=>{
 const actions=[];let calls=0;
 const env={GEMINI_API_KEY:'fake',FIREBASE_API_KEY:'fake',AI_CONTROL:{idFromName:x=>x,get:()=>({fetch:async(u,o)=>{const b=JSON.parse(o.body);actions.push(b.action);return Response.json(b.action==='gemini-pick'?{index:0}: {allowed:true});}})}};
 const handler=createHandler(async(u,o)=>{if(u.includes('hsk-music-library'))return new Response(Buffer.from('ID3'+ 'a'.repeat(40)));if(u.includes('identitytoolkit'))return Response.json({users:[{localId:uid}]});calls++;return response([cue()]);},()=>now);
 const run=(auth,b=body)=>handler(new Request('https://test/music-transcript',{method:'POST',headers:{Origin:'https://trungxemcode.github.io',...(auth?{Authorization:'Bearer '+auth}:{})},body:JSON.stringify(b)}),env);
 assert.equal((await run(null)).status,401);assert.equal((await run(token,{...body,duration:900})).status,400);assert.equal(calls,0);
 const r=await run(token);assert.equal(r.status,200);assert.equal(calls,2);assert.equal(actions.filter(a=>a==='reserve').length,2);assert.equal((await r.json()).reviewed,false);
});

test('library-only lookup rejects unpublished tracks, redirects and oversized streamed audio',async()=>{
 let called='';const media=await libraryTranscriptMedia(body.trackId,{env:{},fetchFn:async(u,o)=>{called=u;assert.equal(o.redirect,'error');return new Response('ID3sample');}});assert.match(called,/^https:\/\/hsk-music-library\.trung-hsk668\.workers\.dev\/audio\/a{64}\.mp3$/);assert.equal(media.mimeType,'audio/mpeg');
 await assert.rejects(libraryTranscriptMedia(body.trackId,{env:{},fetchFn:async()=>new Response('',{status:404})}),/Chỉ bài/);
 await assert.rejects(libraryTranscriptMedia(body.trackId,{env:{},fetchFn:async()=>new Response('x',{headers:{'Content-Length':'6291457'}})}),/6 MB/);
 await assert.rejects(libraryTranscriptMedia(body.trackId,{env:{},fetchFn:async()=>new Response(new Uint8Array(6291457))}),/6 MB/);
});
