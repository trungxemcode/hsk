/* Single-thread WASM SIMD; no cloud synthesis or cross-origin isolation required. */
'use strict';
importScripts('./voice-model.js','./voice-model-transport.js');
let tts;
async function unzip(blob){return new Response(blob.stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();}
function voiceData(buffer){
 // Read only stored tensor bytes from the ZIP container, never execute pickle.
 const d=new DataView(buffer),bytes=new Uint8Array(buffer);let end=bytes.length-22;
 while(end>=Math.max(0,bytes.length-65557)&&d.getUint32(end,true)!==0x06054b50)end--;
 if(end<0||d.getUint32(end,true)!==0x06054b50)throw Error('Gói giọng không hợp lệ.');
 let p=d.getUint32(end+16,true);const count=d.getUint16(end+10,true);
 for(let i=0;i<count;i++){if(d.getUint32(p,true)!==0x02014b50)break;const size=d.getUint32(p+24,true),n=d.getUint16(p+28,true),name=new TextDecoder().decode(bytes.subarray(p+46,p+46+n));if(name.endsWith('/data/0')){if(d.getUint16(p+10,true)!==0||size!==522240)break;const off=d.getUint32(p+42,true),start=off+30+d.getUint16(off+26,true)+d.getUint16(off+28,true);if(start+size>bytes.length)break;return bytes.slice(start,start+size);}p+=46+n+d.getUint16(p+30,true)+d.getUint16(p+32,true);}
 throw Error('Không đọc được dữ liệu giọng.');
}
async function initialize(assets){
 const files=Object.fromEntries(assets),wasmBinary=await unzip(files.wasm);
 await new Promise((resolve,reject)=>{
  self.Module={wasmBinary,print:()=>{},printErr:()=>{},onAbort:()=>reject(Error('Thiết bị không đủ bộ nhớ để mở giọng.')),onRuntimeInitialized:resolve};
  const url=URL.createObjectURL(files.engine);try{importScripts(url);}catch(e){reject(e);}finally{URL.revokeObjectURL(url);}
 });
 const binding=URL.createObjectURL(files.bindings);try{importScripts(binding);}finally{URL.revokeObjectURL(binding);}
 const resources=JSON.parse(new TextDecoder().decode(await unzip(files.resources))),FS=Module.FS;
 for(const [path,b64] of Object.entries(resources)){if(path==='/model-metadata.bin')continue;FS.mkdirTree(path.slice(0,path.lastIndexOf('/'))||'/');const raw=atob(b64);FS.writeFile(path,Uint8Array.from(raw,c=>c.charCodeAt(0)));}
 if(files.config){
  const config=JSON.parse(await files.config.text());if(config.type!=='piper')throw Error('Loại gói giọng chưa được hỗ trợ.');
  const varint=n=>{const b=[];do{const v=n%128;n=Math.floor(n/128);b.push(v+(n?128:0));}while(n);return b;},field=(n,b)=>[...varint(n*8+2),...varint(b.length),...b],enc=s=>Array.from(new TextEncoder().encode(s));
  const metadata=Uint8Array.from(Object.entries(config.metadata).flatMap(([k,v])=>field(14,[...field(1,enc(k)),...field(2,enc(v))])));
  FS.writeFile('/tokens.txt',config.tokens);FS.writeFile('/model.onnx',HSKVoiceModel.expand(new Uint8Array(await files.model.arrayBuffer()),metadata),{canOwn:true});
  tts=createOfflineTts(Module,{offlineTtsModelConfig:{vits:{model:'/model.onnx',tokens:'/tokens.txt',lexicon:'',dataDir:'/espeak-ng-data',noiseScale:.667,noiseScaleW:.8,lengthScale:1},numThreads:1,debug:0,provider:'cpu'},ruleFsts:'',ruleFars:'',maxNumSentences:1});
 }else{
 // Add Sherpa metadata to the unmodified web export; keep only one speaker.
 const model=await HSKVoiceModelTransport.unpackModel(files.model),raw=atob(resources['/model-metadata.bin']),metadata=Uint8Array.from(raw,c=>c.charCodeAt(0)),combined=HSKVoiceModel.expand(model,metadata);
 FS.writeFile('/model.onnx',combined,{canOwn:true});
 FS.writeFile('/voices.bin',voiceData(await files.voice.arrayBuffer()));
 tts=createOfflineTts(Module,{offlineTtsModelConfig:{kokoro:{model:'/model.onnx',voices:'/voices.bin',tokens:'/tokens.txt',dataDir:'/espeak-ng-data',lexicon:'/lexicon-zh.txt',lang:'en-us'},numThreads:1,debug:0,provider:'cpu'},ruleFsts:'/phone-zh.fst,/date-zh.fst,/number-zh.fst',ruleFars:'',maxNumSentences:1});

 }
 FS.unlink('/model.onnx');
}
function generate(text,rate){const a=tts.generate({text:String(text).replace(/〇/g,'零'),sid:0,speed:rate});if(![16000,22050,24000].includes(a.sampleRate)||a.samples.length<100||a.samples.some(v=>!Number.isFinite(v))||!a.samples.some(v=>Math.abs(v)>.0001))throw Error('Giọng chưa tạo được âm thanh hợp lệ. Hãy thử giọng khác.');return a;}
self.onmessage=async({data})=>{const {id,type}=data;try{if(type==='init'){await initialize(data.assets);generate('你好。',1);self.postMessage({id,ok:true});}else{const a=generate(data.text,data.rate);self.postMessage({id,samples:a.samples,sampleRate:a.sampleRate},[a.samples.buffer]);}}catch(e){self.postMessage({id,error:e.message||'Không mở được giọng đọc.'});}};
