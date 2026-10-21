'use strict';
importScripts('./src/modules/handwriting/handwriting-core.js','./src/modules/handwriting/handwriting-learning.js','./src/modules/handwriting/handwriting-neural-core.js','./src/modules/handwriting/handwriting-neural.js');
const core=HSKHandwritingCore,learning=HSKHandwritingLearning;
let templates=[],supported=new Set(),revision='',ready=false,neuralEnabled=false,enableGeneration=0;
(async()=>{
 try{
  const responses=await Promise.all([fetch('./handwriting-data.json'),fetch('./handwriting-learned.json')]);
  if(responses.some(r=>!r.ok))throw Error('Chưa tải đủ dữ liệu chữ. Kết nối mạng và cập nhật app rồi thử lại.');
  const [base,learned]=await Promise.all(responses.map(r=>r.json()));
  templates=core.prepare(base);supported=new Set(Array.from(base.characters));revision=learned.revision;
  if(learned.schema!==1||!Array.isArray(learned.samples))throw Error('Dữ liệu mẫu cải tiến chưa hợp lệ.');
  for(const sample of learned.samples){if(!supported.has(sample.label))continue;templates.push(core.fromBitmap(sample.label,learning.unpack(sample.bitmap),'published'));}
  // External licensed prototypes are separate from reviewed community releases.
  // A missing optional pack must not disable base recognition or personal learning.
  try{const response=await fetch('./handwriting-external.json');if(response.ok){const external=await response.json();if(external.schema!==1||!Array.isArray(external.samples))throw Error('Invalid external pack');for(const sample of external.samples.slice(0,6000)){if(!supported.has(sample.label))continue;try{templates.push(core.fromBitmap(sample.label,learning.unpack(sample.bitmap),'published'));}catch{}}}}catch{}
  templates=templates.filter(Boolean);ready=true;postMessage({type:'ready',characters:base.characters,revision,supported:supported.size,learned:learned.samples.length});
 }catch(error){postMessage({type:'error',message:error.message});}
})();
onmessage=async event=>{
 const message=event.data;
 if(message?.type==='neural-enable'){
  const generation=++enableGeneration;
  if(!message.enabled){neuralEnabled=false;postMessage({type:'neural-status',enabled:false});return;}
  try{await HSKHandwritingNeural.load({download:message.download===true,progress:asset=>postMessage({type:'neural-progress',asset})});if(generation===enableGeneration){neuralEnabled=true;postMessage({type:'neural-status',enabled:true});}}
  catch(error){if(generation===enableGeneration){neuralEnabled=false;postMessage({type:'neural-status',enabled:false,error:error.message});}}return;
 }
 if(message?.type!=='recognize')return;
 if(!ready){postMessage({type:'error',id:message.id,message:'Dữ liệu chữ đang tải. Chờ một chút rồi thử lại.'});return;}
 try{
  const strokes=message.strokes;if(!Array.isArray(strokes)||strokes.length>80||strokes.reduce((n,s)=>n+s.length,0)>12000)throw Error('Nét vẽ quá dài. Hãy vẽ lại một chữ.');
  const bitmap=core.rasterize(strokes);if(!bitmap)throw Error('Hãy vẽ một chữ trước khi nhận dạng.');
  const personal=[];for(const sample of (message.samples||[]).slice(-learning.MAX_SAMPLES)){if(supported.has(sample.label)){try{personal.push(core.fromBitmap(sample.label,learning.unpack(sample.bitmap),'personal'));}catch{}}}
  let candidates=core.recognize(strokes,[...templates,...personal.filter(Boolean)]),engine='shape',warning='';
  const packed=learning.pack(bitmap);
  if(neuralEnabled){try{const neural=await HSKHandwritingNeural.recognize(strokes,null);if(neural.length){candidates=HSKHandwritingNeuralCore.combine(neural,candidates,packed,(message.samples||[]).filter(s=>supported.has(s.label)));engine='neural';}}catch{neuralEnabled=false;warning='Nhận dạng nâng cao gặp lỗi; đang dùng bộ so hình.';postMessage({type:'neural-status',enabled:false,error:warning});}}
  postMessage({type:'result',id:message.id,candidates,bitmap:packed,revision,engine,warning});
 }catch(error){postMessage({type:'error',id:message.id,message:error.message});}
};
