import test from 'node:test';
import assert from 'node:assert/strict';
import {handleCloudMusic} from './music/cloud-worker.mjs';
import {OWNER_UID} from './account-roles.mjs';
function setup(){
 const objects=new Map(),env={FIREBASE_API_KEY:'test-public-key',ALLOWED_ORIGINS:'https://hsk.example',MUSIC_BUCKET:{
  async list(){return {objects:[...objects].map(([key,o])=>({key,...o})),truncated:false};},
  async head(key){return objects.get(key)||null;},
  async get(key,options){const o=objects.get(key);if(!o)return null;const b=options?.range?o.bytes.subarray(options.range.offset,options.range.offset+options.range.length):o.bytes;return {body:new Response(b).body};},
  async delete(key){objects.delete(key);},
  async put(key,value,options){const bytes=typeof value==='string'?new TextEncoder().encode(value):new Uint8Array(value);objects.set(key,{bytes,size:bytes.length,httpEtag:'"hash"',uploaded:new Date('2026-10-25'),customMetadata:options.customMetadata});}
 }};
 const deps={fetchFn:async(_u,init)=>{const token=JSON.parse(init.body).idToken;return Response.json({users:[{localId:token==='owner'?OWNER_UID:'listener'}]});}};
 const req=(p,options={})=>new Request('https://music.example'+p,{...options,headers:{Origin:'https://hsk.example',...options.headers}});
 return {objects,env,deps,req,handle:(r)=>handleCloudMusic(r,env,{},deps)};
}
const mp3=new Uint8Array([73,68,51,0,0,0,1,2,3,4]);
function upload(t,token='owner',body=mp3){return t.req('/api/admin/upload',{method:'POST',body,headers:{Authorization:'Bearer '+token,'Content-Length':String(body.length),'X-Music-Title':encodeURIComponent('月亮'),'X-Music-Artist':encodeURIComponent('Ca sĩ'),'X-Music-Composer':encodeURIComponent('Tác giả')}});}
test('R2 upload is owner-only; published library accepts valid audio and deduplicates by hash',async()=>{
 const t=setup();assert.equal((await t.handle(t.req('/api/admin/upload',{method:'POST'}))).status,401);assert.equal((await t.handle(upload(t,'listener'))).status,403);
 assert.equal((await t.handle(upload(t,'owner',new Uint8Array([1,2,3])))).status,400);
 const r=await t.handle(upload(t));assert.equal(r.status,200);const data=await r.json();assert.match(data.track.id,/^[a-f0-9]{64}\.mp3$/);
 await t.handle(upload(t));assert.equal(t.objects.size,1);
 const library=await (await t.handle(t.req('/api/library'))).json();assert.equal(library.tracks[0].title,'月亮');assert.equal(library.tracks[0].artist,'Ca sĩ');assert.equal(library.tracks[0].composer,'Tác giả');
 t.objects.set('private/secret.mp3',{size:1,customMetadata:{published:'true'}});const filtered=await (await t.handle(t.req('/api/library'))).json();assert.equal(filtered.tracks.length,1);
});
test('Native audio supports full GET, HEAD, byte and suffix ranges, conditional requests and CORS',async()=>{
 const t=setup(),data=await (await t.handle(upload(t))).json(),path=new URL(data.track.url).pathname;
 let r=await t.handle(t.req(path,{headers:{Range:'bytes=2-5'}}));assert.equal(r.status,206);assert.equal(r.headers.get('Content-Range'),'bytes 2-5/10');assert.deepEqual(new Uint8Array(await r.arrayBuffer()),mp3.subarray(2,6));assert.equal(r.headers.get('Access-Control-Allow-Origin'),'https://hsk.example');
 r=await t.handle(t.req(path,{method:'HEAD'}));assert.equal(r.status,200);assert.equal(r.headers.get('Content-Length'),'10');assert.equal((await r.arrayBuffer()).byteLength,0);
 r=await t.handle(t.req(path,{headers:{Range:'bytes=-3'}}));assert.equal(r.status,206);assert.equal(r.headers.get('Content-Length'),'3');
 r=await t.handle(t.req(path,{headers:{Range:'bytes=99-'}}));assert.equal(r.status,416);
 r=await t.handle(t.req(path,{headers:{'If-None-Match':'"hash"'}}));assert.equal(r.status,304);
 assert.equal((await t.handle(new Request('https://music.example/api/library',{headers:{Origin:'https://evil.example'}}))).status,403);
 assert.equal((await t.handle(t.req('/audio/../../private'))).status,404);
});

test('only owner may delete published audio; private keys and malformed IDs remain protected',async()=>{
 const t=setup(),track=(await (await t.handle(upload(t))).json()).track;
 const route='/api/admin/tracks/'+track.id+'/delete';
 const remove=token=>t.handle(t.req(route,{method:'POST',headers:token?{Authorization:'Bearer '+token}:{}}));
 assert.equal((await remove()).status,401);assert.equal((await remove('listener')).status,403);assert.equal(t.objects.size,1);
 assert.equal((await t.handle(t.req('/api/admin/tracks/private.json/delete',{method:'POST',headers:{Authorization:'Bearer owner'}}))).status,400);assert.equal(t.objects.size,1);
 const r=await remove('owner');assert.equal(r.status,200);assert.equal((await r.json()).deleted,true);assert.equal(t.objects.size,0);
 assert.equal((await (await t.handle(t.req('/api/library'))).json()).tracks.length,0);assert.equal((await t.handle(t.req('/audio/'+track.id))).status,404);assert.equal((await remove('owner')).status,404);
});

test('published lyrics sidecar is public-read, owner-write, bounded and deleted with audio',async()=>{
 const t=setup(),track=(await (await t.handle(upload(t))).json()).track;
 const path='/api/admin/tracks/'+track.id+'/lyrics',publicPath='/api/tracks/'+track.id+'/lyrics';
 const body=JSON.stringify({cues:[{start:0,end:2,text:'你好',pinyin:'nǐ hǎo',vi:'Xin chào',characters:[{start:.2,text:'你'},{start:1.7,text:'好'}]}]});
 const publish=(token,content=body)=>t.handle(t.req(path,{method:'POST',body:content,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'}}));
 assert.equal((await publish('listener')).status,403);assert.equal((await t.handle(t.req(publicPath))).status,404);
 assert.equal((await publish('owner','x'.repeat(500001))).status,413);
 assert.equal((await publish('owner','{"cues":[]}')).status,400);
 assert.equal((await publish('owner')).status,200);const value=await (await t.handle(t.req(publicPath))).json();assert.equal(value.cues[0].text,'你好');assert.deepEqual(value.cues[0].characters,[{start:.2,end:null,text:'你'},{start:1.7,end:null,text:'好'}],'publication retains real character timestamps');
 const reviewed=JSON.stringify({...JSON.parse(body),status:'reviewed',reviewed:true});assert.equal((await publish('owner',reviewed)).status,200);assert.equal((await (await t.handle(t.req(publicPath))).json()).reviewed,true);
 const list=await (await t.handle(t.req('/api/library'))).json();assert.equal(list.tracks[0].hasLyrics,true);
 const key='audio/'+track.id,original=t.objects.get(key).bytes;assert.deepEqual(original,mp3,'script publication never rewrites audio');
 t.objects.get(key).customMetadata.published='false';assert.equal((await t.handle(t.req(publicPath))).status,404);t.objects.get(key).customMetadata.published='true';
 await t.handle(t.req('/api/admin/tracks/'+track.id+'/delete',{method:'POST',headers:{Authorization:'Bearer owner'}}));assert.equal(t.objects.size,0);assert.equal((await t.handle(t.req(publicPath))).status,404);
});
