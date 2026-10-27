import test from 'node:test';
import assert from 'node:assert/strict';
import {matchGroq,groqRoute} from './music/groq-alignment.mjs';
import {OWNER_UID} from './account-roles.mjs';
const reference={cues:[{start:0,end:8,text:'你好世界',pinyin:'nǐ hǎo shì jiè'}]};
const words=[{word:'你',start:.2,end:.5},{word:'好',start:.6,end:2},{word:'世',start:4,end:4.3},{word:'界',start:6,end:7}];
test('Groq times are retained exactly, including long pauses; pinyin/script stay canonical',()=>{
 const out=matchGroq(reference,{words},8);assert.equal(out.diagnostics.precise,4);assert.equal(out.cues[0].start,.2);assert.equal(out.cues[0].end,7);assert.deepEqual(out.cues[0].characters.map(c=>c.start),[.2,.6,4,6]);assert.equal(out.cues[0].pinyin,reference.cues[0].pinyin);assert.equal(out.reviewed,false);
});
test('groups are never split evenly; incomplete lines use observed anchors, not fabricated character times',()=>{
 const grouped=matchGroq(reference,{words:[{word:'你好',start:.2,end:2},...words.slice(2)]},8);assert.equal(grouped.cues[0].characters,undefined);assert.equal(grouped.diagnostics.grouped,2);
 const missing=matchGroq(reference,{words:words.slice(0,3)},8);assert.equal(missing.diagnostics.missing,1);assert.equal(missing.cues[0].start,.2);assert.equal(missing.cues[0].characters,undefined);
 assert.equal(matchGroq(reference,{words:[{word:'你',start:2,end:1}]},8).diagnostics.rejectedWordTimes,1);
 const repeat=matchGroq({cues:[{start:0,end:3,text:'你好'},{start:4,end:8,text:'你好'}]},{words:[...words.slice(0,2),{word:'你',start:4,end:5},{word:'好',start:6,end:7}]},8);assert.deepEqual(repeat.cues.map(c=>c.start),[.2,4]);
});
function fixture(status=200){
 const records=new Map(),id='a'.repeat(64)+'.m4a',audio='audio/'+id,lyrics='lyrics/'+id+'.json';let groqCalls=0;const calls=[];
 function set(key,bytes,metadata={}){const encoded=typeof bytes==='string'?new TextEncoder().encode(bytes):bytes;const old=records.get(key);const etag=String(Number(old?.etag||0)+1);records.set(key,{bytes:encoded,size:encoded.length,etag,httpEtag:'"'+etag+'"',customMetadata:metadata});}
 set(audio,new Uint8Array([1,2,3]),{published:'true'});set(lyrics,JSON.stringify(reference));
 const bucket={async head(k){return records.get(k)||null;},async get(k){const v=records.get(k);return v?{body:new Response(v.bytes).body}:null;},async put(k,value,options={}){const old=records.get(k);if(options.onlyIf?.etagDoesNotMatch==='*'&&old)return null;if(options.onlyIf?.etagMatches&&options.onlyIf.etagMatches!==old?.etag)return null;set(k,value,options.customMetadata);return records.get(k);},async delete(k){records.delete(k);}};
 const env={MUSIC_BUCKET:bucket,FIREBASE_API_KEY:'public',GROQ_API_KEY:'test-secret',MUSIC_GROQ_ENABLED:'true'};
 const fetchFn=async(url,init)=>{calls.push(url);if(url.includes('accounts:lookup'))return Response.json({users:[{localId:JSON.parse(init.body).idToken==='owner'?OWNER_UID:'listener'}]});groqCalls++;assert.equal(url,'https://api.groq.com/openai/v1/audio/transcriptions');assert.equal(init.headers.Authorization,'Bearer test-secret');assert.equal(init.body.get('language'),'zh');assert.equal(init.body.get('response_format'),'verbose_json');assert.deepEqual(init.body.getAll('timestamp_granularities[]'),['word','segment']);assert.equal(init.body.get('file').size,3);return Response.json(status===200?{words}:{error:{message:'private upstream detail'}},{status,headers:{'Retry-After':'30'}});};
 const req=(token='owner',body={duration:8})=>new Request('https://music.example/api/admin/tracks/'+id+'/align',{method:'POST',headers:{Authorization:'Bearer '+token},body:JSON.stringify(body)});
 const json=(data,status=200)=>Response.json(data,{status});return {env,req,json,fetchFn,records,id,audio,lyrics,calls,groqCalls:()=>groqCalls,run:(r=req())=>groqRoute(r,env,json,fetchFn)};
}
test('only owner sends published R2 audio; draft cache never changes live lyrics',async()=>{
 const f=fixture();assert.equal((await f.run(f.req('listener'))).status,403);assert.equal(f.groqCalls(),0);
 const original=f.records.get(f.lyrics).bytes.slice();const response=await f.run(),body=await response.json();assert.equal(response.status,200);assert.equal(body.saved,true);assert.equal(body.diagnostics.precise,4);assert.deepEqual(f.records.get(f.lyrics).bytes,original);assert.ok(f.records.has('lyrics-drafts/'+f.id+'/groq.json'));assert.equal(f.records.has('groq-locks/'+f.id),false);
 assert.equal((await (await f.run()).json()).cached,true);assert.equal(f.groqCalls(),1);
});
test('missing key, private audio, oversized audio, arbitrary URLs and concurrency cannot trigger Groq',async()=>{
 const f=fixture();delete f.env.GROQ_API_KEY;assert.equal((await f.run()).status,503);f.env.GROQ_API_KEY='test-secret';
 f.records.get(f.audio).customMetadata.published='false';assert.equal((await f.run()).status,404);f.records.get(f.audio).customMetadata.published='true';f.records.get(f.audio).size=13*1024*1024;assert.equal((await f.run()).status,413);f.records.get(f.audio).size=3;
 assert.equal((await f.run(f.req('owner',{duration:8,url:'https://attacker.invalid'}))).status,400);
 f.records.set('groq-locks/'+f.id,{customMetadata:{createdAt:String(Date.now())}});assert.equal((await f.run()).status,409);assert.equal(f.groqCalls(),0);
});
test('429 keeps published lyrics and returns cooldown without retrying or leaking upstream body',async()=>{
 const f=fixture(429),r=await f.run(),body=await r.json();assert.equal(r.status,429);assert.equal(body.retryAfter,'30');assert.equal(JSON.stringify(body).includes('private upstream'),false);assert.equal(f.groqCalls(),1);assert.equal(f.records.has('groq-locks/'+f.id),false);assert.equal(f.records.has('lyrics-drafts/'+f.id+'/groq.json'),false);
});

test('deletion during Groq processing rejects stale result and releases lock',async()=>{const f=fixture();const custom=async(url,init)=>{const r=await f.fetchFn(url,init);if(url.includes('api.groq.com'))f.records.delete(f.audio);return r;};await assert.rejects(groqRoute(f.req(),f.env,f.json,custom),e=>e.status===409);assert.equal(f.records.has('lyrics-drafts/'+f.id+'/groq.json'),false);assert.equal(f.records.has('groq-locks/'+f.id),false);});

test('authentication failure uses backup key, while 429 does not rotate',async()=>{const f=fixture();f.env.GROQ_API_KEY_2='backup';let tries=0;const call=async(url,init)=>{if(!url.includes('api.groq.com'))return f.fetchFn(url,init);tries++;if(tries===1)return Response.json({error:'bad key'},{status:401});assert.equal(init.headers.Authorization,'Bearer backup');return Response.json({words});};assert.equal((await groqRoute(f.req(),f.env,f.json,call)).status,200);assert.equal(tries,2);const limited=fixture(429);limited.env.GROQ_API_KEY_2='backup';assert.equal((await limited.run()).status,429);assert.equal(limited.groqCalls(),1);});

test('punctuation and zero-length provider words do not erase valid timestamps',()=>{const r=matchGroq(reference,{words:[{word:'。',start:0,end:0},{word:'呀',start:0,end:0},...words]},8);assert.equal(r.diagnostics.rejectedWordTimes,1);assert.equal(r.diagnostics.precise,4);assert.deepEqual(r.cues[0].characters.map(c=>c.start),[.2,.6,4,6]);});

test('matching recovers across long extra recognition text without shifting the reference',()=>{const noise=Array.from({length:25},(_,i)=>({word:'呀',start:.01+i*.004,end:.014+i*.004}));const r=matchGroq(reference,{words:[...noise,...words]},8);assert.equal(r.diagnostics.matched,4);assert.deepEqual(r.cues[0].characters.map(c=>c.start),[.2,.6,4,6]);});

test('reprocessing raw timestamps does not call Groq again after matcher changes',async()=>{const f=fixture();await f.run();f.records.get('lyrics-drafts/'+f.id+'/groq.json').customMetadata.matcher='old';await f.run();assert.equal(f.groqCalls(),1);});

test('short anchored recognition substitutions reuse observed onsets without interpolation',()=>{const r=matchGroq(reference,{words:[words[0],words[1],{word:'某',start:4,end:4.3},words[3]]},8);assert.equal(r.diagnostics.substitutions,1);assert.deepEqual(r.cues[0].characters.map(c=>c.start),[.2,.6,4,6]);});
test('overlapping provider ends are bounded by next onset, without changing any onset',()=>{const r=matchGroq(reference,{words:words.map((w,i)=>i===1?{...w,end:4.02}:w)},8);assert.equal(r.cues[0].characters[1].start,.6);assert.equal(r.cues[0].characters[1].end,4);assert.equal(r.cues[0].characters[2].start,4);});

test('a private untimed batch reference can publish a validated automatic draft without invented timings',async()=>{
 const f=fixture();f.records.delete(f.lyrics);await f.env.MUSIC_BUCKET.put('lyrics-sources/'+f.id+'.json',JSON.stringify({kind:'hanzi',lines:['你好世界'],autoPublish:true,batchId:'test',sourceUrl:'https://www.youtube.com/watch?v=aaaaaaaaaaa'}));
 const r=await f.run();assert.equal(r.status,200);const published=JSON.parse(new TextDecoder().decode(f.records.get(f.lyrics).bytes));assert.equal(published.reviewed,false);assert.equal(published.publication,'automatic-draft');assert.deepEqual(published.cues[0].characters.map(c=>c.start),[.2,.6,4,6]);
});
