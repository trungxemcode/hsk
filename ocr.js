(()=>{
'use strict';
const $=id=>document.getElementById(id),choose=$('ocrChoose'),camera=$('ocrCamera'),file=$('ocrFile'),capture=$('ocrCapture'),preview=$('ocrPreview'),run=$('ocrRead'),remove=$('ocrRemove'),status=$('ocrStatus'),output=$('ocrOutput'),text=$('ocrText'),use=$('ocrUse');
let config=null,image=null,url=null,controller=null,serial=0,busy=false,source=null,region=null,cropping=false,start=null;
const fastButton=$('ocrFast');
const stage=$('ocrStage'),box=$('ocrCropBox'),crop=$('ocrCrop'),whole=$('ocrWhole'),cancel=$('ocrCancel'),cache=new Map();
function encode(img,rect=null){const r=rect||{x:0,y:0,w:1,h:1},sw=Math.max(1,Math.round(img.naturalWidth*r.w)),sh=Math.max(1,Math.round(img.naturalHeight*r.h)),ratio=Math.min(1,(rect?2048:1600)/Math.max(sw,sh)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(sw*ratio));canvas.height=Math.max(1,Math.round(sh*ratio));const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,img.naturalWidth*r.x,img.naturalHeight*r.y,sw,sh,0,0,canvas.width,canvas.height);let data=canvas.toDataURL('image/jpeg',.88);if(data.length>2000023)data=canvas.toDataURL('image/jpeg',.72);if(data.length>2000023)throw Error('Ảnh quá lớn sau nén. Hãy chọn vùng có chữ nhỏ hơn.');return {dataUrl:data,image:{mimeType:'image/jpeg',data:data.split(',')[1]}};}
function stopCrop(){cropping=false;stage.classList.remove('selecting');crop.textContent='Chọn vùng chữ';}
function showData(data){text.value=data.text;output.hidden=false;status.textContent='Đã nhận dạng chữ Trung. Kiểm tra nét chữ trước khi dịch.'+(data.note?' '+data.note:'');}

function buttons(){run.disabled=!config||!image||busy;fastButton.disabled=run.disabled;choose.disabled=camera.disabled=crop.disabled=whole.disabled=busy;cancel.hidden=!busy||!controller;crop.hidden=whole.hidden=!image;}
function reset(){++serial;controller?.abort();controller=null;busy=false;image=null;source=null;region=null;start=null;box.hidden=true;stopCrop();if(url)URL.revokeObjectURL(url);url=null;preview.removeAttribute('src');preview.hidden=true;remove.hidden=true;output.hidden=true;text.value='';file.value=capture.value='';status.textContent='';buttons();}
async function pick(event){
 const selected=event.target.files?.[0];if(!selected)return;reset();const id=serial;
 if(selected.size>20*1024*1024){status.textContent='Ảnh quá lớn. Chọn ảnh dưới 20 MB.';return;}
 if(selected.type==='image/svg+xml'||selected.type&&!selected.type.startsWith('image/')){status.textContent='Hãy chọn ảnh JPG, PNG, WebP hoặc ảnh chụp.';return;}
 busy=true;buttons();status.textContent='Xử lý ảnh OCR đang load…';
 const stopLoading=window.HSKLoading?.show('Xử lý ảnh OCR đang load...','Đang chuẩn bị và nén ảnh để nhận dạng chữ Hán...');
 try{
  const localUrl=URL.createObjectURL(selected),img=new Image();
  try{await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('Không mở được ảnh. Hãy đổi sang JPG hoặc PNG.'));img.src=localUrl;});}finally{URL.revokeObjectURL(localUrl);}
  if(id!==serial)return;
  if(!img.naturalWidth||!img.naturalHeight||img.naturalWidth*img.naturalHeight>50000000)throw Error('Ảnh quá lớn. Hãy cắt phần chứa chữ rồi chọn lại.');
  source=img;const encoded=encode(img);image=encoded.image;preview.src=encoded.dataUrl;preview.hidden=false;remove.hidden=false;status.textContent='Ảnh đã sẵn sàng. Có thể chọn riêng vùng chữ Trung để nhận dạng nhanh và rõ hơn.';
 }catch(error){if(id===serial)status.textContent=error.message;}
 finally{stopLoading?.();if(id===serial){busy=false;buttons();}}
}
async function read(fast=false){
 const user=window.HSKAccountDashboard?.user;
 if(!user){status.textContent='Hãy đăng nhập tài khoản app để nhận dạng chữ.';return;}
 if(!config||!image||busy)return;
 let prepared;try{prepared=region?encode(source,region).image:image;}catch(error){status.textContent=error.message;return;}
 const hsk=Number($('translationLevel').value),key=user.uid+':'+(fast?'fast:'+hsk:'ocr')+':'+prepared.data;
 function show(data){showData(data);if(fast){if(data.direction!=='zh-vi'||typeof data.vietnamese!=='string'||typeof data.pinyin!=='string'||typeof data.explanation!=='string'||!Array.isArray(data.outOfVocabulary))throw Error('Máy chủ chưa có chế độ dịch ảnh một lượt. Hãy cập nhật Worker hoặc dùng Nhận dạng chữ.');window.dispatchEvent(new CustomEvent('hsk-image-translated',{detail:data}));status.textContent='Đã nhận dạng và dịch trong một lượt AI. Kiểm tra chữ Trung và bản dịch bên dưới.';}}
 if(cache.has(key)){show(cache.get(key));return;}
 const id=++serial;controller=new AbortController();const current=controller;busy=true;buttons();output.hidden=true;status.textContent=fast?'AI nhận dạng & dịch ảnh đang load…':'AI nhận dạng chữ từ ảnh đang load…';
 const stopLoading=window.HSKLoading?.showAI(fast?'AI nhận dạng & dịch ảnh đang load...':'AI nhận dạng chữ từ ảnh đang load...',{size:prepared.data.length,kind:'image',detail:'Đang gửi vùng ảnh đã chọn để AI nhận dạng...',signal:current.signal});
 const timer=setTimeout(()=>current.abort(),125000),started=Date.now(),progress=setInterval(()=>{if(id===serial)status.textContent='AI đang đọc chữ Trung… đã chờ '+Math.round((Date.now()-started)/1000)+' giây. Bạn có thể bấm Hủy.';},15000);
 try{
  const token=await user.getIdToken();if(id!==serial)return;
  const response=await fetch(config.endpoint.replace(/\/translate\/?$/,'/ocr'),{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({image:prepared,...(fast?{translate:true,hsk}:{})}),signal:current.signal});
  const data=await response.json();if(id!==serial)return;
  if(!response.ok)throw Error(response.status===404?'Máy chủ chưa hỗ trợ nhận dạng ảnh. Cần triển khai bản máy chủ mới.':data.error||'Chưa nhận dạng được ảnh. Hãy thử lại.');
  if(typeof data.text!=='string'||data.text.length>10000||typeof data.note!=='string')throw Error('Kết quả nhận dạng không hợp lệ.');
  if(!data.text.trim()){status.textContent='Không tìm thấy chữ Trung rõ trong ảnh. Hãy chọn vùng có chữ hoặc chụp gần hơn.';return;}
  show(data);cache.set(key,data);if(cache.size>3)cache.delete(cache.keys().next().value);
 }catch(error){if(id===serial)status.textContent=error.name==='AbortError'?'AI chưa trả lời sau 2 phút. Hãy chọn riêng vùng chữ Trung rồi thử lại.':error.message;}
 finally{stopLoading?.();clearTimeout(timer);clearInterval(progress);if(id===serial){controller=null;busy=false;buttons();}}
}
choose.addEventListener('click',()=>file.click());camera.addEventListener('click',()=>capture.click());file.addEventListener('change',pick);capture.addEventListener('change',pick);run.addEventListener('click',()=>read(false));fastButton.addEventListener('click',()=>read(true));remove.addEventListener('click',reset);
use.addEventListener('click',()=>{const value=text.value.trim();if(!value){status.textContent='Chưa có nội dung để dịch.';return;}if(value.length>500){status.textContent='Ô dịch nhận tối đa 500 ký tự. Hãy giữ lại câu hoặc đoạn muốn dịch trong ô nhận dạng.';text.focus();return;}const direction=$('translationDirection');direction.value='zh-vi';direction.dispatchEvent(new Event('change',{bubbles:true}));const input=$('translationInput');input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();input.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});status.textContent='Đã đưa chữ Trung vào ô dịch. Bấm Dịch câu để xem nghĩa tiếng Việt và phiên âm.';});
window.addEventListener('hsk-account-ready',()=>{cache.clear();reset();});
cancel.addEventListener('click',()=>{++serial;controller?.abort();controller=null;busy=false;buttons();status.textContent='Đã hủy nhận dạng.';});
crop.addEventListener('click',()=>{cropping=!cropping;stage.classList.toggle('selecting',cropping);crop.textContent=cropping?'Dừng chọn vùng':'Chọn vùng chữ';status.textContent=cropping?'Kéo một khung quanh vùng chữ Trung trên ảnh.':'Bấm Nhận dạng chữ để tiếp tục.';});
whole.addEventListener('click',()=>{region=null;box.hidden=true;stopCrop();status.textContent='Đã chọn toàn bộ ảnh.';});
function point(e){const r=preview.getBoundingClientRect();return {x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))};}
stage.addEventListener('pointerdown',e=>{if(!cropping||busy||!source)return;e.preventDefault();start=point(e);region=null;Object.assign(box.style,{width:'0px',height:'0px'});stage.setPointerCapture(e.pointerId);box.hidden=false;});
stage.addEventListener('pointermove',e=>{if(!start||!cropping)return;e.preventDefault();const p=point(e),r=preview.getBoundingClientRect(),s=stage.getBoundingClientRect();region={x:Math.min(start.x,p.x),y:Math.min(start.y,p.y),w:Math.abs(start.x-p.x),h:Math.abs(start.y-p.y)};Object.assign(box.style,{left:(r.left-s.left+region.x*r.width)+'px',top:(r.top-s.top+region.y*r.height)+'px',width:(region.w*r.width)+'px',height:(region.h*r.height)+'px'});});
stage.addEventListener('pointerup',()=>{if(!start)return;start=null;if(!region||region.w<.02||region.h<.02){region=null;box.hidden=true;status.textContent='Khung quá nhỏ. Hãy kéo chọn lại vùng chữ.';}else{stopCrop();status.textContent='Đã chọn vùng chữ. Bấm Nhận dạng chữ.';}});
stage.addEventListener('pointercancel',()=>{start=null;region=null;box.hidden=true;stopCrop();});
fetch('./translation-config.json',{cache:'no-store'}).then(r=>r.json()).then(c=>{if(c.enabled&&typeof c.endpoint==='string'&&new URL(c.endpoint).protocol==='https:'&&/\/translate\/?$/.test(new URL(c.endpoint).pathname)){config=c;buttons();}}).catch(()=>{status.textContent='Chưa đọc được cấu hình nhận dạng chữ.';});
})();
