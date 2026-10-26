import test from 'node:test';
import assert from 'node:assert/strict';
import {validTranscriptInput,transcribeMusic,libraryTranscriptMedia,saveGeneratedTranscript} from './music-transcript.mjs';
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
const now=Date.now(),owner='BIvUyItDYJWcLvlhhtYFyj5csBH2';
const token=uid=>'h.'+Buffer.from(JSON.stringify({aud:'hsk-flashcards-44631',iss:'https://securetoken.google.com/hsk-flashcards-44631',sub:uid,exp:now/1000+3600})).toString('base64url')+'.s';
function bucket(){
 const lyrics=new Map();let reads=0;return {lyrics,get reads(){return reads;},async head(key){reads++;return key.startsWith('audio/')?{size:43,customMetadata:{published:'true'}}:lyrics.has(key)?{etag:'revision-1'}:null;},async get(){return {body:new Response('ID3'+ 'a'.repeat(40)).body};},async put(key,data,opts){if(opts.onlyIf?.etagDoesNotMatch==='*'&&lyrics.has(key))return null;lyrics.set(key,JSON.parse(data));return {etag:'revision-1'};}};
}
test('only verified fixed admin can generate; successful result is automatically stored and publicly readable',async()=>{
 const actions=[],storage=bucket();let calls=0,actor=owner;
 const env={GEMINI_API_KEY:'fake',FIREBASE_API_KEY:'fake',ADMIN_UIDS:owner,MUSIC_BUCKET:storage,AI_CONTROL:{idFromName:x=>x,get:()=>({fetch:async(u,o)=>{const b=JSON.parse(o.body);actions.push(b.action);return Response.json(b.action==='gemini-pick'?{index:0}: {allowed:true});}})}};
 const handler=createHandler(async(u,o)=>{if(u.includes('identitytoolkit'))return Response.json({users:[{localId:actor}]});calls++;return response([cue()]);},()=>now);
 const run=(auth,b=body)=>handler(new Request('https://test/music-transcript',{method:'POST',headers:{Origin:'https://trungxemcode.github.io',...(auth?{Authorization:'Bearer '+auth}:{})},body:JSON.stringify(b)}),env);
 assert.equal((await run(null)).status,401);assert.equal((await run(token(owner),{...body,duration:900})).status,400);assert.equal(calls,0);
 actor='listener';assert.equal((await run(token(actor))).status,403);actor='vip-user';assert.equal((await run(token(actor))).status,403);assert.equal(storage.reads,0);assert.equal(calls,0);assert.equal(actions.filter(a=>a==='reserve').length,0);
 actor=owner;const r=await run(token(owner));assert.equal(r.status,200);assert.equal(calls,2);const generated=await r.json();assert.equal(generated.reviewed,false);assert.equal(generated.saved,true);assert.equal(storage.lyrics.get('lyrics/'+body.trackId+'.json').status,'draft');
 const {handleCloudMusic}=await import('./music/cloud-worker.mjs');const publicRead=await handleCloudMusic(new Request('https://music/api/tracks/'+body.trackId+'/lyrics'),{MUSIC_BUCKET:{...storage,async get(key){return {body:JSON.stringify(storage.lyrics.get(key))};}}});assert.equal(publicRead.status,200);assert.equal((await publicRead.json()).cues[0].text,'明天见');
});
test('R2 lookup rejects unpublished tracks and oversized declared/streamed audio',async()=>{
 const media=await libraryTranscriptMedia(body.trackId,{env:{MUSIC_BUCKET:bucket()}});assert.equal(media.mimeType,'audio/mpeg');
 await assert.rejects(libraryTranscriptMedia(body.trackId,{env:{MUSIC_BUCKET:{head:async()=>null}}}),/Chỉ bài/);
 await assert.rejects(libraryTranscriptMedia(body.trackId,{env:{MUSIC_BUCKET:{head:async()=>({size:6291457,customMetadata:{published:'true'}})}}}),/6 MB/);
 await assert.rejects(libraryTranscriptMedia(body.trackId,{env:{MUSIC_BUCKET:{head:async()=>({size:10,customMetadata:{published:'true'}}),get:async()=>({body:new Response(new Uint8Array(6291457)).body})}}}),/6 MB/);
});
test('deleted tracks, canceled generation or concurrent scripts do not overwrite shared lyrics',async()=>{
 const storage=bucket(),value={cues:[cue()]};await saveGeneratedTranscript(body.trackId,value,{MUSIC_BUCKET:storage},null);await assert.rejects(saveGeneratedTranscript(body.trackId,value,{MUSIC_BUCKET:storage},null),/đã thay đổi/);
 const controller=new AbortController();controller.abort();await assert.rejects(saveGeneratedTranscript(body.trackId,value,{MUSIC_BUCKET:storage},null,controller.signal),/Canceled/);
 await assert.rejects(saveGeneratedTranscript(body.trackId,value,{MUSIC_BUCKET:{head:async()=>null}},null),/đã bị gỡ/);
});
