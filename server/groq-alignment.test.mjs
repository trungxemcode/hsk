import test from 'node:test';
import assert from 'node:assert/strict';
import {matchGroq,groqRoute} from './music/groq-alignment.mjs';
import {OWNER_UID} from './account-roles.mjs';
const reference={cues:[{start:0,end:8,text:'你好世界',pinyin:'nǐ hǎo shì jiè'}]};
const words=[{word:'你',start:.2,end:.5},{word:'好',start:.6,end:2},{word:'世',start:4,end:4.3},{word:'界',start:6,end:7}];
test('Groq times are retained exactly, including long pauses; pinyin/script stay canonical',()=>{
 const out=matchGroq(reference,{words},8);assert.equal(out.diagnostics.precise,4);assert.equal(out.cues[0].start,.2);assert.equal(out.cues[0].end,7);assert.deepEqual(out.cues[0].characters.map(c=>c.start),[.2,.6,4,6]);assert.equal(out.cues[0].pinyin,reference.cues[0].pinyin);assert.equal(out.reviewed,false);
});
test('groups are never split evenly; missing words keep old timing, not fabricated characters',()=>{
 const grouped=matchGroq(reference,{words:[{word:'你好',start:.2,end:2},...words.slice(2)]},8);assert.equal(grouped.cues[0].characters,undefined);assert.equal(grouped.diagnostics.grouped,2);
 const missing=matchGroq(reference,{words:words.slice(0,3)},8);assert.equal(missing.diagnostics.missing,1);assert.equal(missing.cues[0].start,0);assert.equal(missing.cues[0].characters,undefined);
 assert.throws(()=>matchGroq(reference,{words:[{word:'你',start:2,end:1}]},8));
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
 f.records.get(f.audio).customMetadata.published='false';assert.equal((await f.run()).status,404);f.records.get(f.audio).customMetadata.published='true';f.records.get(f.audio).size=7*1024*1024;assert.equal((await f.run()).status,413);f.records.get(f.audio).size=3;
 assert.equal((await f.run(f.req('owner',{duration:8,url:'https://attacker.invalid'}))).status,400);
 f.records.set('groq-locks/'+f.id,{customMetadata:{createdAt:String(Date.now())}});assert.equal((await f.run()).status,409);assert.equal(f.groqCalls(),0);
});
test('429 keeps published lyrics and returns cooldown without retrying or leaking upstream body',async()=>{
 const f=fixture(429),r=await f.run(),body=await r.json();assert.equal(r.status,429);assert.equal(body.retryAfter,'30');assert.equal(JSON.stringify(body).includes('private upstream'),false);assert.equal(f.groqCalls(),1);assert.equal(f.records.has('groq-locks/'+f.id),false);assert.equal(f.records.has('lyrics-drafts/'+f.id+'/groq.json'),false);
});

test('deletion during Groq processing rejects stale result and releases lock',async()=>{const f=fixture();const custom=async(url,init)=>{const r=await f.fetchFn(url,init);if(url.includes('api.groq.com'))f.records.delete(f.audio);return r;};await assert.rejects(groqRoute(f.req(),f.env,f.json,custom),e=>e.status===409);assert.equal(f.records.has('lyrics-drafts/'+f.id+'/groq.json'),false);assert.equal(f.records.has('groq-locks/'+f.id),false);});
