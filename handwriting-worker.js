'use strict';
importScripts('./handwriting-core.js','./handwriting-learning.js');
const core=HSKHandwritingCore,learning=HSKHandwritingLearning;
let templates=[],supported=new Set(),revision='',ready=false;
(async()=>{
 try{
  const responses=await Promise.all([fetch('./handwriting-data.json'),fetch('./handwriting-learned.json')]);
  if(responses.some(r=>!r.ok))throw Error('Chưa tải đủ dữ liệu chữ. Kết nối mạng và cập nhật app rồi thử lại.');
  const [base,learned]=await Promise.all(responses.map(r=>r.json()));
  templates=core.prepare(base);supported=new Set(Array.from(base.characters));revision=learned.revision;
  if(learned.schema!==1||!Array.isArray(learned.samples))throw Error('Dữ liệu mẫu cải tiến chưa hợp lệ.');
  for(const sample of learned.samples){if(!supported.has(sample.label))continue;templates.push(core.fromBitmap(sample.label,learning.unpack(sample.bitmap),'published'));}
  templates=templates.filter(Boolean);ready=true;postMessage({type:'ready',characters:base.characters,revision,supported:supported.size,learned:learned.samples.length});
 }catch(error){postMessage({type:'error',message:error.message});}
})();
onmessage=event=>{
 const message=event.data;if(message?.type!=='recognize')return;
 if(!ready){postMessage({type:'error',id:message.id,message:'Dữ liệu chữ đang tải. Chờ một chút rồi thử lại.'});return;}
 try{
  const strokes=message.strokes;if(!Array.isArray(strokes)||strokes.length>80||strokes.reduce((n,s)=>n+s.length,0)>12000)throw Error('Nét vẽ quá dài. Hãy vẽ lại một chữ.');
  const bitmap=core.rasterize(strokes);if(!bitmap)throw Error('Hãy vẽ một chữ trước khi nhận dạng.');
  const personal=[];for(const sample of (message.samples||[]).slice(-learning.MAX_SAMPLES)){if(supported.has(sample.label)){try{personal.push(core.fromBitmap(sample.label,learning.unpack(sample.bitmap),'personal'));}catch{}}}
  const candidates=core.recognize(strokes,[...templates,...personal.filter(Boolean)]);
  postMessage({type:'result',id:message.id,candidates,bitmap:learning.pack(bitmap),revision});
 }catch(error){postMessage({type:'error',id:message.id,message:error.message});}
};
