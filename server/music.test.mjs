import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import '../src/modules/music/music-core.js';
import {handleMusic,byteRange} from './music/worker.mjs';
import {OWNER_UID} from './account-roles.mjs';
const C=globalThis.HSKMusicCore,template=JSON.parse(fs.readFileSync(new URL('../content/music/lesson-template.json',import.meta.url)));
function db(){
 const sqlite=new DatabaseSync(':memory:');
 sqlite.exec(fs.readFileSync(new URL('./music/schema.sql',import.meta.url),'utf8'));
 return {sqlite,prepare(sql){return {all:async()=>({results:sqlite.prepare(sql).all()}),bind(...args){
  const stmt=sqlite.prepare(sql);
  return {first:async()=>stmt.get(...args)||null,all:async()=>({results:stmt.all(...args)}),run:async()=>({meta:{changes:Number(stmt.run(...args).changes)}})};
 }}}};
}
function setup(){const DB=db(),data=new Uint8Array([1,2,3,4,5,6,7,8]),key='music/'+'a'.repeat(64)+'.mp3';const env={DB,FIREBASE_API_KEY:'fake',MUSIC_BUCKET:{head:async k=>k===key?{size:data.length,httpEtag:'"hash"'}:null,get:async(k,opt)=>({body:opt?.range?data.slice(opt.range.offset,opt.range.offset+opt.range.length):data})}};const fetchFn=async(_url,init)=>{const token=JSON.parse(init.body).idToken;return Response.json({users:[{localId:token==='owner'?OWNER_UID:'regular'}]});};const req=(path,method='GET',body,token='regular',headers={})=>new Request('https://music.example'+path,{method,headers:{Authorization:'Bearer '+token,...headers},...(body?{body:JSON.stringify(body)}:{})});return {env,fetchFn,req,key,close:()=>DB.sqlite.close()};}
test('music HSK uses token proportions, unknowns stay new, ties favor higher; no max-word classification',()=>{
 const dict=C.dictionary([{han:'我',hsk:1},{han:'爱',hsk:1},{han:'遗憾',hsk:4},{han:'唱歌',hsk:2}]);
 const a=C.classify({hanzi:'我爱我遗憾星河',tokens:['我','爱','我','遗憾','星河']},dict);
 assert.equal(a.level,1);assert.deepEqual(a.counts,[3,0,0,1,0,0]);assert.equal(a.unknownRatio,.2);assert.deepEqual(a.newWords,['星河']);
 assert.equal(C.classify({hanzi:'唱歌遗憾',tokens:['唱歌','遗憾']},dict).level,4);
 assert.equal(C.classify({hanzi:'星河',tokens:['星河']},dict).level,null);
});
test('manifest rejects overlapping times, missing pinyin, invalid answer, token gaps, unsafe source',()=>{
 assert.equal(C.validateSong(template).segments.length,2);
 for(const mutate of [s=>s.segments[1].start=1,s=>s.segments[0].pinyin='',s=>s.segments[0].quiz.answer=99,s=>s.segments[0].tokens=['我'],s=>s.source={kind:'r2',key:'https://evil.test/a.mp4'},s=>s.source={kind:'youtube',videoId:'<script>'}]){const s=structuredClone(template);mutate(s);assert.throws(()=>C.validateSong(s));}
});
test('grading and bounded revision-specific history do not grant SRS mastery',()=>{
 const song=C.validateSong(template),s=song.segments[0];assert.equal(C.grade(s,1),false);assert.equal(C.grade(s,0),true);assert.equal(C.grade(s,20),null);
 let history=C.record([],song,s,1,100);history=C.record(history,song,s,0,200);assert.equal(history.length,1);assert.equal(history[0].correct,true);
 history=C.record(history,{...song,revision:'2'},s,0,300);assert.equal(history.length,2);assert.equal(C.activeSegment(song.segments,5),1);assert.equal(C.activeSegment(song.segments,10),-1);
 assert.deepEqual(C.renderedRect(400,400,1920,1080),{width:400,height:225,x:0,y:87.5});
});
test('catalog requires actual Firebase auth; body user flags cannot publish; owner can publish valid asset',async()=>{
 const t=setup();try{
  let r=await handleMusic(new Request('https://music.example/api/songs'),t.env,{},t);assert.equal(r.status,401);
  const song={...template,credit:'Original authorized pilot',source:{kind:'r2',key:t.key}};
  r=await handleMusic(t.req('/api/admin/song','POST',{...song,admin:true,uid:OWNER_UID}),t.env,{},t);assert.equal(r.status,403);
  r=await handleMusic(t.req('/api/admin/song','POST',song,'owner'),t.env,{},t);assert.equal(r.status,200);
  r=await handleMusic(t.req('/api/songs'),t.env,{},t);assert.equal((await r.json()).songs.length,1);
  r=await handleMusic(t.req('/api/admin/song','POST',{...song,source:{kind:'r2',key:'music/'+'b'.repeat(64)+'.mp3'}},'owner'),t.env,{},t);assert.equal(r.status,400);
  t.env.MAX_PILOT_SONGS='1';r=await handleMusic(t.req('/api/admin/song','POST',{...song,id:'second',source:{kind:'youtube',videoId:'abcdefghijk'}},'owner'),t.env,{},t);assert.equal(r.status,409);
  r=await handleMusic(t.req('/api/admin/song','POST',{...song,revision:'2'},'owner'),t.env,{},t);assert.equal(r.status,200);
 }finally{t.close();}
});
test('R2 playback supports byte ranges, suffix, invalid range, conditional GET, HEAD, unpublished protection and CORS',async()=>{
 const t=setup();try{
  const path='/media/'+t.key;let r=await handleMusic(t.req(path),t.env,{},t);assert.equal(r.status,404);
  await handleMusic(t.req('/api/admin/song','POST',{...template,credit:'Authorized',source:{kind:'r2',key:t.key}},'owner'),t.env,{},t);
  r=await handleMusic(t.req(path,'GET',null,'regular',{Range:'bytes=2-4'}),t.env,{},t);assert.equal(r.status,206);assert.equal(r.headers.get('Content-Range'),'bytes 2-4/8');assert.deepEqual([...new Uint8Array(await r.arrayBuffer())],[3,4,5]);
  r=await handleMusic(t.req(path,'GET',null,'regular',{Range:'bytes=-2'}),t.env,{},t);assert.deepEqual([...new Uint8Array(await r.arrayBuffer())],[7,8]);
  r=await handleMusic(t.req(path,'GET',null,'regular',{Range:'bytes=99-'}),t.env,{},t);assert.equal(r.status,416);assert.equal(r.headers.get('Content-Range'),'bytes */8');
  r=await handleMusic(t.req(path,'HEAD'),t.env,{},t);assert.equal(r.headers.get('Content-Length'),'8');assert.equal((await r.arrayBuffer()).byteLength,0);
  r=await handleMusic(t.req(path,'GET',null,'regular',{'If-None-Match':'"hash"'}),t.env,{},t);assert.equal(r.status,304);
  r=await handleMusic(t.req(path,'GET',null,'regular',{Origin:'https://evil.example'}),t.env,{},t);assert.equal(r.status,403);
  r=await handleMusic(t.req(path,'GET',null,'regular',{Range:'bytes=2-4','If-Range':'"old"',Origin:'https://trungxemcode.github.io'}),t.env,{},t);assert.equal(r.status,200);assert.equal(r.headers.get('Access-Control-Allow-Origin'),'https://trungxemcode.github.io');
 }finally{t.close();}
});
test('range parser rejects multipart, zero suffix and overflow',()=>{for(const r of ['bytes=0-1,3-5','bytes=-0','bytes=6-2','bad','bytes=999999999999999999999999-'])assert.throws(()=>byteRange(r,8));});
