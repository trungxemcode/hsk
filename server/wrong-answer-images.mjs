// Only exam-owned images; reject arbitrary addresses before a network request.
const MIME=new Set(['image/png','image/jpeg','image/webp']);
const MAX_ITEM=1_400_000,MAX_TOTAL=5_400_000,MAX_IMAGES=10;
export function validExamImages(images){
 if(!Array.isArray(images)||images.length>MAX_IMAGES)return false;
 let total=0;
 return images.every(im=>{
  if(!im||typeof im!=='object'||typeof im.label!=='string'||!im.label.trim()||im.label.length>90||Object.keys(im).some(k=>!['label','src','mimeType','data'].includes(k)))return false;
  if(typeof im.src==='string'&&!im.data&&!im.mimeType){
   if(im.src.length>350)return false;
   try{const u=new URL(im.src);return u.protocol==='https:'&&u.hostname==='s4-media1.study4.com'&&u.port===''&&!u.username&&!u.password&&!u.search&&!u.hash&&u.pathname.startsWith('/media/hsk_tests/images/')&&/\.(?:png|jpe?g|webp)$/i.test(u.pathname);}catch{return false;}
  }
  if(!MIME.has(im.mimeType)||typeof im.data!=='string'||im.src||im.data.length>Math.ceil(MAX_ITEM*4/3)+4||im.data.length<16||im.data.length%4!==0||!/^[a-zA-Z0-9+/]+={0,2}$/.test(im.data))return false;
  total+=im.data.length;return total<=Math.ceil(MAX_TOTAL*4/3)+4;
 });
}
function mediaType(bytes,declared){
 const png=bytes.length>8&&bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71;
 const jpg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 const webp=bytes.length>12&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
 const actual=png?'image/png':jpg?'image/jpeg':webp?'image/webp':null;
 if(!actual||declared&&actual!==declared)throw Error('Ảnh câu hỏi không đúng định dạng.');
 return actual;
}
const base64=bytes=>{let out='';for(let i=0;i<bytes.length;i+=32768)out+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(out);};
export async function resolveExamImages(images,{fetchFn=fetch,signal}={}){
 if(!validExamImages(images))throw Error('Ảnh câu hỏi không hợp lệ hoặc vượt kích thước cho phép.');
 const parts=[];let total=0;
 for(const im of images){
  let bytes,type;
  if(im.src){
   const r=await fetchFn(im.src,{method:'GET',redirect:'error',signal,headers:{Accept:'image/png, image/jpeg, image/webp'}});
   if(!r.ok)throw Error('Không tải được hình trong đề.');
   const size=Number(r.headers.get('content-length'));
   if(size>MAX_ITEM)throw Error('Hình trong đề quá lớn.');
   const reader=r.body?.getReader();if(!reader)throw Error('Không đọc được hình trong đề.');
   const chunks=[];let len=0;
   while(true){const {done,value}=await reader.read();if(done)break;len+=value.byteLength;if(len>MAX_ITEM){await reader.cancel();throw Error('Hình trong đề vượt giới hạn 1,4 MB.');}chunks.push(value);}
   bytes=new Uint8Array(len);let off=0;for(const chunk of chunks){bytes.set(chunk,off);off+=chunk.byteLength;}
   type=mediaType(bytes);
  }else{
   try{bytes=Uint8Array.from(atob(im.data),ch=>ch.charCodeAt(0));}catch{throw Error('Dữ liệu hình trong đề không đọc được.');}
   if(bytes.byteLength>MAX_ITEM)throw Error('Hình trong đề vượt giới hạn 1,4 MB.');
   type=mediaType(bytes,im.mimeType);
  }
  total+=bytes.byteLength;if(total>MAX_TOTAL)throw Error('Tổng kích thước hình trong đề quá lớn.');
  parts.push({text:'Ảnh minh họa: '+im.label},{inlineData:{mimeType:type,data:base64(bytes)}});
 }
 return parts;
}
