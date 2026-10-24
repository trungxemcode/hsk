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
 assert.equal(a.calls[2].url,'https://inv-off.example/latest_version?id=abcdefghijk&itag=250&local=true');
 const eligible=await a.root.HSKMusicDirectSource.discover(new AbortController().signal);
 assert.equal(eligible.length,5,'at most five HTTPS candidates selected');
 assert.equal(eligible[0].url,'https://inv-off.example','API flag is not proof of actual availability');
 assert.equal(eligible[1].url,'https://inv-cors.example','false CORS flag still permits an actual attempt');
 assert.equal(a.calls.filter(x=>x.url===directory).length,1,'directory reused within the five-minute cache window');
 const unknown=[['unknown',{type:'https',uri:'https://unknown.example',api:null,cors:null}]];
 a=env(url=>url===directory?j(unknown):url.includes('/api/v1/videos/')?j({lengthSeconds:200,adaptiveFormats:formats}):bin());
 await a.run();assert(a.calls.some(x=>x.url.startsWith('https://unknown.example/latest_version')),'unknown flags are probed');
 const unsafe=[
  ['private',{type:'https',uri:'https://127.0.0.1'}],
  ['local',{type:'https',uri:'https://localhost'}],
  ['http',{type:'http',uri:'http://plain.example'}],
  ['down',{type:'https',uri:'https://down.example',monitor:{down:true}}],
  ...unknown,...unknown
 ];
 a=env(url=>url===directory?j(unsafe):url.includes('/api/v1/videos/')?j({lengthSeconds:200,adaptiveFormats:formats}):bin());
 const safe=await a.root.HSKMusicDirectSource.discover(new AbortController().signal);
 assert.equal(safe.filter(x=>x.url==='https://unknown.example').length,1,'duplicate hosts removed');
 assert(safe.every(x=>!/(127\.0\.0\.1|localhost|plain\.example|down\.example)/.test(x.url)),'private/non-HTTPS/down hosts excluded');
 for(const response of [()=>j([]),()=>new Response('',{status:403})]){
  a=env(url=>url===directory?response():url.includes('/api/v1/videos/')?j({lengthSeconds:200,adaptiveFormats:formats}):bin());
  await a.run();assert(a.calls.some(x=>x.url.startsWith('https://inv.nadeko.net/api/v1/videos/')),'empty/blocked directory tries bounded seed fallback');
 }
 a=env(url=>url===directory?j(rows):url.startsWith('https://inv-off.example')?new Response('',{status:503}):url.includes('/api/v1/videos/')?j({lengthSeconds:200,adaptiveFormats:formats}):bin());
 await a.run();assert(a.calls.at(-1).url.startsWith('https://inv-cors.example/latest_version'),'failed candidate advances to next source');
 a=env(url=>url===directory?j(rows):url.includes('/api/v1/videos/')?j({lengthSeconds:901,adaptiveFormats:formats}):bin());
 await assert.rejects(a.run(),/Chưa lấy được âm thanh từ đúng link đã chọn \(5 lượt lỗi\)/);
 assert.equal(a.calls.every(x=>!x.url.includes('/latest_version')),true,'15 minute limit blocks all audio');
 assert.equal(a.calls.filter(x=>x.url.includes('/api/v1/videos/')).length,5,'failed metadata probes remain capped at five');
 console.log('PASS dynamic discovery: false/null flags probed, top 5, private/down/duplicate rejection, local=true, seed fallback, failover, duration, no credentials');
})().catch(e=>{console.error(e);process.exitCode=1});
