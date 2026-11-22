/* Single-thread WASM SIMD; no cloud synthesis or cross-origin isolation required. */
'use strict';
importScripts('./voice-model.js','./voice-model-transport.js');
let tts,isKokoro=false;
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
 const files=Object.fromEntries(assets);
 const [wasmBinary,resourcesBuf,viResBuf,voiceBuf]=await Promise.all([
  unzip(files.wasm),
  unzip(files.resources),
  files.viResources?unzip(files.viResources):Promise.resolve(null),
  files.voice?files.voice.arrayBuffer():Promise.resolve(null)
 ]);
 await new Promise((resolve,reject)=>{
  self.Module={wasmBinary,print:()=>{},printErr:()=>{},onAbort:()=>reject(Error('Thiết bị không đủ bộ nhớ để mở giọng.')),onRuntimeInitialized:resolve};
  const url=URL.createObjectURL(files.engine);try{importScripts(url);}catch(e){reject(e);}finally{URL.revokeObjectURL(url);}
 });
 const binding=URL.createObjectURL(files.bindings);try{importScripts(binding);}finally{URL.revokeObjectURL(binding);}
 const resources=JSON.parse(new TextDecoder().decode(resourcesBuf)),FS=Module.FS;
 for(const [path,b64] of Object.entries(resources)){if(path==='/model-metadata.bin')continue;FS.mkdirTree(path.slice(0,path.lastIndexOf('/'))||'/');const raw=atob(b64);FS.writeFile(path,Uint8Array.from(raw,c=>c.charCodeAt(0)));}
 if(viResBuf){
  isKokoro=false;
  const viRes=JSON.parse(new TextDecoder().decode(viResBuf));
  for(const [path,b64] of Object.entries(viRes)){FS.mkdirTree(path.slice(0,path.lastIndexOf('/'))||'/');const raw=atob(b64);FS.writeFile(path,Uint8Array.from(raw,c=>c.charCodeAt(0)));}
  FS.writeFile('/model.onnx',new Uint8Array(await files.model.arrayBuffer()),{canOwn:true});
  tts=createOfflineTts(Module,{offlineTtsModelConfig:{vits:{model:'/model.onnx',tokens:'/vi-tokens.txt',lexicon:'',dataDir:'/espeak-ng-data',noiseScale:.667,noiseScaleW:.8,lengthScale:1},numThreads:1,debug:0,provider:'cpu'},ruleFsts:'',ruleFars:'',maxNumSentences:1});
 }else if(files.config){
  isKokoro=false;
  const config=JSON.parse(await files.config.text());if(config.type!=='piper')throw Error('Loại gói giọng chưa được hỗ trợ.');
  const varint=n=>{const b=[];do{const v=n%128;n=Math.floor(n/128);b.push(v+(n?128:0));}while(n);return b;},field=(n,b)=>[...varint(n*8+2),...varint(b.length),...b],enc=s=>Array.from(new TextEncoder().encode(s));
  const metadata=Uint8Array.from(Object.entries(config.metadata).flatMap(([k,v])=>field(14,[...field(1,enc(k)),...field(2,enc(v))])));
  FS.writeFile('/tokens.txt',config.tokens);FS.writeFile('/model.onnx',HSKVoiceModel.expand(new Uint8Array(await files.model.arrayBuffer()),metadata),{canOwn:true});
  tts=createOfflineTts(Module,{offlineTtsModelConfig:{vits:{model:'/model.onnx',tokens:'/tokens.txt',lexicon:'',dataDir:'/espeak-ng-data',noiseScale:.667,noiseScaleW:.8,lengthScale:1},numThreads:1,debug:0,provider:'cpu'},ruleFsts:'',ruleFars:'',maxNumSentences:1});
 }else{
  isKokoro=true;
  // Add Sherpa metadata to the unmodified web export; keep only one speaker.
  const model=await HSKVoiceModelTransport.unpackModel(files.model),raw=atob(resources['/model-metadata.bin']),metadata=Uint8Array.from(raw,c=>c.charCodeAt(0)),combined=HSKVoiceModel.expand(model,metadata);
  FS.writeFile('/model.onnx',combined,{canOwn:true});
  FS.writeFile('/voices.bin',voiceData(voiceBuf));
  tts=createOfflineTts(Module,{offlineTtsModelConfig:{kokoro:{model:'/model.onnx',voices:'/voices.bin',tokens:'/tokens.txt',dataDir:'/espeak-ng-data',lexicon:'/lexicon-zh.txt',lang:'en-us'},numThreads:1,debug:0,provider:'cpu'},ruleFsts:'/phone-zh.fst,/date-zh.fst,/number-zh.fst',ruleFars:'',maxNumSentences:1});
 }
 FS.unlink('/model.onnx');
}
function normalizeTtsText(text,kokoro){
 let s=String(text||'').replace(/〇/g,'零').trim();
 // Anchor short/bare Chinese words with terminal punctuation so Kokoro's neural prosody
 // does not hallucinate a leading murmur ("ừm...") before the first syllable.
 if(kokoro&&s&&/\p{Script=Han}/u.test(s)&&!/[。！？!?…；;.]+$/.test(s))s+='。';
 return s;
}
function effectiveSpeed(rate,kokoro){
 const r=Math.max(.5,Math.min(1.5,Number(rate)||.85));
 // Synthesize inside Kokoro at >= 0.88x (clean prosody, zero BOS "ừm" hum, fast CPU)
 // and use pitch-preserving WSOLA below 0.88x for genuinely slow learner speeds.
 return kokoro?Number(Math.max(.88,Math.min(1.35,r)).toFixed(2)):r;
}
function targetAcousticSpeed(rate){
 const r=Math.max(.5,Math.min(1.5,Number(rate)||.85));
 if(r>=.8)return Math.max(.88,Math.min(1.35,r));
 // Map learner rates: 0.52 (Rất chậm) -> 0.63x, 0.60 (Chậm) -> 0.70x, 0.70 -> 0.79x, 0.80 (Vừa) -> 0.88x
 return Number(Math.max(.58,Math.min(.88,.7+(r-.6)*.9)).toFixed(2));
}
function timeStretchWSOLA(samples,sampleRate,ratio){
 if(!samples||ratio>=.98||ratio<=.45)return samples;
 const winLen=Math.max(256,(Math.round(sampleRate*.032)&~1));
 const synHop=winLen>>1;
 const anaHop=Math.max(32,Math.round(synHop*ratio));
 const searchRad=Math.round(sampleRate*.008);
 const n=samples.length;
 if(n<=winLen+searchRad)return samples;
 const hann=new Float32Array(winLen);
 for(let i=0;i<winLen;i++)hann[i]=.5*(1-Math.cos(2*Math.PI*i/winLen));
 const numFrames=Math.max(1,Math.floor((n-winLen)/anaHop)+1);
 const outLen=(numFrames-1)*synHop+winLen;
 const out=new Float32Array(outLen);
 // First grain starts at sample 0 with flat leading half so onset is untouched.
 for(let i=0;i<synHop;i++)out[i]=samples[i];
 for(let i=synHop;i<winLen;i++)out[i]=samples[i]*hann[i];
 let prevSrc=0;
 const corrStep=4;
 for(let k=1;k<numFrames;k++){
  const ideal=Math.min(n-winLen,k*anaHop);
  const refStart=Math.min(n-synHop,prevSrc+synHop);
  const lo=Math.max(0,ideal-searchRad),hi=Math.min(n-winLen,ideal+searchRad);
  let bestPos=ideal,bestScore=-Infinity;
  for(let cand=lo;cand<=hi;cand+=2){
   let dot=0,eA=0,eB=0;
   for(let j=0;j<synHop;j+=corrStep){
    const a=samples[refStart+j],b=samples[cand+j];
    dot+=a*b;eA+=a*a;eB+=b*b;
   }
   const denom=Math.sqrt(eA*eB)+1e-9;
   const score=dot/denom;
   if(score>bestScore){bestScore=score;bestPos=cand;}
  }
  const refLo=Math.max(lo,bestPos-1),refHi=Math.min(hi,bestPos+1);
  for(let cand=refLo;cand<=refHi;cand++){
   let dot=0,eA=0,eB=0;
   for(let j=0;j<synHop;j+=2){
    const a=samples[refStart+j],b=samples[cand+j];
    dot+=a*b;eA+=a*a;eB+=b*b;
   }
   const score=dot/(Math.sqrt(eA*eB)+1e-9);
   if(score>bestScore){bestScore=score;bestPos=cand;}
  }
  const outStart=k*synHop;
  for(let i=0;i<winLen;i++)out[outStart+i]+=samples[bestPos+i]*hann[i];
  prevSrc=bestPos;
 }
 return out;
}
function cleanAudioEdges(samples,sampleRate){
 const n=samples.length;if(n<Math.round(sampleRate*.08))return samples;
 let peak=0;for(let i=0;i<n;i++){const v=Math.abs(samples[i]);if(v>peak)peak=v;}
 if(peak<=.0001)return samples;
 const win=Math.max(120,Math.round(sampleRate*.01));
 const count=Math.floor(n/win);
 const rms=new Float32Array(count);
 for(let f=0;f<count;f++){
  let sq=0,s0=f*win;
  for(let i=0;i<win;i++){const v=samples[s0+i];sq+=v*v;}
  rms[f]=Math.sqrt(sq/win);
 }
 let maxRms=0;for(let f=0;f<count;f++)if(rms[f]>maxRms)maxRms=rms[f];
 const silenceGate=maxRms*.035;
 let firstFrame=0;
 while(firstFrame<count-1&&rms[firstFrame]<silenceGate)firstFrame++;
 // Trim any short disconnected low-energy vocoder murmur ("ừm" blip) in the first 300ms
 // separated by a clear dip before the main syllable onset.
 const scanLimit=Math.min(count-2,firstFrame+32);
 let prePeak=0,dipAt=-1;
 for(let f=firstFrame;f<scanLimit;f++){
  if(rms[f]>prePeak)prePeak=rms[f];
  if(prePeak>silenceGate&&prePeak<maxRms*.24&&rms[f]<maxRms*.06){dipAt=f;continue;}
  if(dipAt!==-1&&rms[f]>=maxRms*.22){firstFrame=f;break;}
  if(rms[f]>=maxRms*.28)break;
 }
 let lastFrame=count-1;
 while(lastFrame>firstFrame+4&&rms[lastFrame]<maxRms*.02)lastFrame--;
 const start=Math.max(0,firstFrame*win-Math.round(sampleRate*.012));
 const end=Math.min(n,(lastFrame+1)*win+Math.round(sampleRate*.035));
 if(end-start<Math.round(sampleRate*.06))return samples;
 const out=samples.slice(start,end);
 const fadeIn=Math.min(Math.round(sampleRate*.008),Math.floor(out.length/4));
 const fadeOut=Math.min(Math.round(sampleRate*.010),Math.floor(out.length/4));
 for(let i=0;i<fadeIn;i++)out[i]*=.5*(1-Math.cos(Math.PI*i/fadeIn));
 for(let i=0;i<fadeOut;i++)out[out.length-1-i]*=.5*(1-Math.cos(Math.PI*i/fadeOut));
 return out;
}
function generate(text,rate){
 const input=normalizeTtsText(text,isKokoro),speed=effectiveSpeed(rate,isKokoro);
 const a=tts.generate({text:input,sid:0,speed});
 if(![16000,22050,24000].includes(a.sampleRate)||a.samples.length<100||a.samples.some(v=>!Number.isFinite(v))||!a.samples.some(v=>Math.abs(v)>.0001))throw Error('Giọng chưa tạo được âm thanh hợp lệ. Hãy thử giọng khác.');
 let samples=isKokoro?cleanAudioEdges(a.samples,a.sampleRate):a.samples;
 if(isKokoro){
  const desired=targetAcousticSpeed(rate);
  if(desired<speed-.02)samples=timeStretchWSOLA(samples,a.sampleRate,desired/speed);
 }
 return {samples,sampleRate:a.sampleRate};
}
self.onmessage=async({data})=>{const {id,type}=data;try{if(type==='init'){await initialize(data.assets);if(data.verify!==false)generate(data.verifyText||'你好。',1);self.postMessage({id,ok:true});}else{const a=generate(data.text,data.rate);self.postMessage({id,samples:a.samples,sampleRate:a.sampleRate},[a.samples.buffer]);}}catch(e){self.postMessage({id,error:e.message||'Không mở được giọng đọc.'});}};
