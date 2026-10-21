/* Single-glyph adaptation of PaddleOCR's 48x320 recognition input. */
(function(root){
 'use strict';
 function render(strokes,createCanvas=(w,h)=>new OffscreenCanvas(w,h)){
  const points=strokes.flat();if(!points.length)throw Error('Hãy vẽ một chữ.');
  let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;
  for(const [x,y] of points){if(!Number.isFinite(x)||!Number.isFinite(y))throw Error('Tọa độ không hợp lệ.');left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
  const span=Math.max(right-left,bottom-top);if(span<=0)throw Error('Nét vẽ quá ngắn.');
  const high=createCanvas(192,192),ctx=high.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,192,192);ctx.strokeStyle='black';ctx.lineWidth=8;ctx.lineCap='round';ctx.lineJoin='round';
  const scale=160/span;
  for(const stroke of strokes){if(!stroke.length)continue;ctx.beginPath();ctx.moveTo((stroke[0][0]-left)*scale+16,(stroke[0][1]-top)*scale+16);for(const [x,y] of stroke.slice(1))ctx.lineTo((x-left)*scale+16,(y-top)*scale+16);if(stroke.length===1)ctx.lineTo((stroke[0][0]-left)*scale+16.1,(stroke[0][1]-top)*scale+16);ctx.stroke();}
  const small=createCanvas(48,48),s=small.getContext('2d');s.imageSmoothingEnabled=true;s.imageSmoothingQuality='high';s.drawImage(high,0,0,48,48);
  const pixels=s.getImageData(0,0,48,48).data,tensor=new Float32Array(3*48*320);
  // Padding stays zero in normalized space, following RecResizeImg.
  for(let y=0;y<48;y++)for(let x=0;x<48;x++)for(let c=0;c<3;c++)tensor[c*48*320+y*320+x]=pixels[(y*48+x)*4+c]/127.5-1;
  return tensor;
 }
 function decode(output,characters,supported,limit=10){
  const [batch,steps,classes]=output.dims;
  if(batch!==1||classes!==characters.length||output.data.length!==steps*classes)throw Error('Đầu ra mô hình không hợp lệ.');
  const scores=new Map();
  // Max over timesteps adapts the text-line CTC output to ranked single glyphs.
  // These scores are not calibrated probabilities of a whole drawing.
  for(let i=1;i<classes;i++)if((!supported||supported.has(characters[i]))&&/^[\u3400-\u9fff\u3007]$/u.test(characters[i])){
   let score=0;for(let t=0;t<steps;t++)score=Math.max(score,output.data[t*classes+i]);
   if(Number.isFinite(score)&&score>0)scores.set(characters[i],Math.max(score,scores.get(characters[i])||0));
  }
  return [...scores].map(([character,score])=>({character,score})).sort((a,b)=>b.score-a.score||a.character.codePointAt(0)-b.character.codePointAt(0)).slice(0,limit);
 }
 function combine(neural,shape,bitmap,samples){
  const confirmed=new Set(samples.filter(s=>s.bitmap===bitmap).map(s=>s.label));
  const priority=confirmed.size===1?[...confirmed]:[],seen=new Set(),candidates=[];
  for(const item of [...priority.map(character=>({character,score:1})),...neural,...shape])if(!seen.has(item.character)){seen.add(item.character);candidates.push(item);if(candidates.length===10)break;}
  return candidates;
 }
 const api={render,decode,combine};if(typeof module==='object'&&module.exports)module.exports=api;else root.HSKHandwritingNeuralCore=api;
})(typeof self==='object'?self:globalThis);
