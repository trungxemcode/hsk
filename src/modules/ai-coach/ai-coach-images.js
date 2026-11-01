// Resolve owner-provided Drive pages and in-app vector scenes into Gemini image bytes.
(function(root){'use strict';
 const MAX_IMAGES=10;
 const decode=src=>{const m=String(src).match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/);if(!m||m[2].length>1900000)throw Error('Ảnh bài thi không hợp lệ hoặc quá lớn.');return {mimeType:m[1],data:m[2]};};
 async function svgData(svg){
  const original=svg.cloneNode(true);original.setAttribute('xmlns','http://www.w3.org/2000/svg');original.setAttribute('width','320');original.setAttribute('height','240');original.setAttribute('fill','none');original.setAttribute('stroke',getComputedStyle(svg).color||'#4435aa');original.setAttribute('stroke-width','3');
  const text=new XMLSerializer().serializeToString(original);
  if(text.length>200000)throw Error('Hình lựa chọn quá phức tạp.');
  const blob=new Blob([text],{type:'image/svg+xml'}),url=URL.createObjectURL(blob);
  try{
   const img=new Image();img.src=url;await img.decode();
   const canvas=document.createElement('canvas');canvas.width=320;canvas.height=240;
   const context=canvas.getContext('2d');context.fillStyle='#ffffff';context.fillRect(0,0,320,240);context.drawImage(img,0,0,320,240);
   return decode(canvas.toDataURL('image/png'));
  }finally{URL.revokeObjectURL(url);}
 }
 async function prepare(images){
  const result=[];
  for(const im of (images||[]).slice(0,MAX_IMAGES)){
   const label=String(im.label||'Hình bài thi').slice(0,90);
   if(im.load){const data=await im.load();result.push({label,...decode(data)});}
   else if(im.svg){result.push({label,...await svgData(im.svg)});}
   else if(im.src?.startsWith('data:')){result.push({label,...decode(im.src)});}
   else if(im.src){result.push({label,src:im.src});}
   else if(im.mimeType&&im.data){result.push({label,mimeType:im.mimeType,data:im.data});}
  }
  if(images?.length>MAX_IMAGES)throw Error('Câu hỏi có quá nhiều hình; chưa gửi đủ dữ liệu cho AI.');
  return result;
 }
 root.HSKWrongAnswerImages={prepare};
})(typeof window!=='undefined'?window:globalThis);
