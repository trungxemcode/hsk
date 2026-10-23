const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const core=require('../src/modules/music/music-core.js');
const source=fs.readFileSync(require.resolve('../src/modules/music/music-direct-source.js'),'utf8');
const directory='https://api.invidious.io/instances.json?sort_by=health';
const rows=[
 ['https://old.test',{api:true,cors:true,type:'https',uri:'https://old.test'}],
 ['inv-off.example',{api:false,cors:true,type:'https',uri:'https://inv-off.example'}],
 ['inv-cors.example',{api:true,cors:false,type:'https',uri:'https://inv-cors.example'}],
 ...Array.from({length:6},(_,i)=>['inv'+i+'.example',{api:true,cors:true,type:'https',uri:'https://inv'+i+'.example',monitor:{down:false}}])
];
const formats=[139,140,249,250,251].map(itag=>({itag,type:itag>=249?'audio/webm':'audio/mp4',bitrate:itag===140?128000:itag===250?70000:itag===251?160000:48000}));
const j=d=>new Response(JSON.stringify(d),{headers:{'Content-Type':'application/json'}});
const bin=()=>new Response(new Uint8Array([7,8,9]),{headers:{'Content-Type':'audio/mp4'}});
function env(handler){
 const calls=[],root={HSKMusicCore:core,HSKMusicConverter:{readSource:async r=>r.arrayBuffer()}};
 vm.runInNewContext(source,{window:root,URL,Map,Set,Number,Date,JSON,Array,Error,TextDecoder,Uint8Array,DOMException,AbortController,setTimeout,clearTimeout,fetch:async(url,opts)=>{calls.push({url,opts});assert.equal(opts.credentials,'omit');assert.equal(opts.referrerPolicy,'no-referrer');return handler(url,opts)}});
 return {calls,root,run:()=>root.HSKMusicDirectSource.download('https://youtu.be/abcdefghijk',64,{instances:[],signal:new AbortController().signal})};
}
(async()=>{
 let a=env(url=>url===directory?j(rows):url.includes('/api/v1/videos/')?j({lengthSeconds:200,adaptiveFormats:formats}):bin());
 assert.equal((await a.run()).byteLength,3);
 assert.equal(a.calls.length,3,'directory, metadata, stream');
 assert.equal(a.calls[1].url.includes('fields=adaptiveFormats'),true);
 assert.equal(a.calls[2].url,'https://inv0.example/latest_version?id=abcdefghijk&itag=250&local=true');
 const eligible=await a.root.HSKMusicDirectSource.discover(new AbortController().signal);
 assert.equal(eligible.length,5,'only five healthy CORS+API instances selected');
 assert.equal(eligible[0].url,'https://inv0.example');
 a=env(url=>url===directory?j(rows.slice(0,3)):bin());
 await assert.rejects(a.run(),/Chưa có Invidious hỗ trợ API và CORS/);
 assert.equal(a.calls.length,1,'no invalid fallback host');
 a=env(url=>url===directory?new Response('',{status:403}):bin());
 await assert.rejects(a.run(),/Chưa có Invidious hỗ trợ API và CORS/);
 assert.equal(a.calls.length,1,'blocked discovery returns actionable failure');
 a=env(url=>url===directory?j(rows):url.includes('/api/v1/videos/')?j({lengthSeconds:901,adaptiveFormats:formats}):bin());
 await assert.rejects(a.run(),/Các máy chủ nhạc/);
 assert.equal(a.calls.every(x=>!x.url.includes('/latest_version')),true,'15 minute limit blocks all audio');
 console.log('PASS dynamic discovery: health/API/CORS, top 5, metadata formats, local=true audio proxy, blocked/empty directory, duration, no credentials');
})().catch(e=>{console.error(e);process.exitCode=1});
