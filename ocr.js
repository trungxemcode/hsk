(()=>{
'use strict';
const $=id=>document.getElementById(id),choose=$('ocrChoose'),camera=$('ocrCamera'),file=$('ocrFile'),capture=$('ocrCapture'),preview=$('ocrPreview'),run=$('ocrRead'),remove=$('ocrRemove'),status=$('ocrStatus'),output=$('ocrOutput'),text=$('ocrText'),use=$('ocrUse');
let config=null,image=null,url=null,controller=null,serial=0,busy=false;
function buttons(){run.disabled=!config||!image||busy;choose.disabled=camera.disabled=busy;}
function reset(){++serial;controller?.abort();controller=null;busy=false;image=null;if(url)URL.revokeObjectURL(url);url=null;preview.removeAttribute('src');preview.hidden=true;remove.hidden=true;output.hidden=true;text.value='';file.value=capture.value='';status.textContent='';buttons();}
async function pick(event){
 const selected=event.target.files?.[0];if(!selected)return;reset();const id=serial;
 if(selected.size>20*1024*1024){status.textContent='Ảnh quá lớn. Chọn ảnh dưới 20 MB.';return;}
 if(selected.type==='image/svg+xml'||selected.type&&!selected.type.startsWith('image/')){status.textContent='Hãy chọn ảnh JPG, PNG, WebP hoặc ảnh chụp.';return;}
 busy=true;buttons();status.textContent='Đang chuẩn bị ảnh…';
 try{
  const localUrl=URL.createObjectURL(selected),img=new Image();
  try{await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('Không mở được ảnh. Hãy đổi sang JPG hoặc PNG.'));img.src=localUrl;});}finally{URL.revokeObjectURL(localUrl);}
  if(id!==serial)return;
  if(!img.naturalWidth||!img.naturalHeight||img.naturalWidth*img.naturalHeight>50000000)throw Error('Ảnh quá lớn. Hãy cắt phần chứa chữ rồi chọn lại.');
  const ratio=Math.min(1,2048/Math.max(img.naturalWidth,img.naturalHeight)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(img.naturalHeight*ratio));
  const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
  let data=canvas.toDataURL('image/jpeg',.9);if(data.length>2000023)data=canvas.toDataURL('image/jpeg',.7);if(data.length>2000023)throw Error('Ảnh vẫn quá lớn sau nén. Hãy cắt ảnh nhỏ hơn.');
  image={mimeType:'image/jpeg',data:data.split(',')[1]};preview.src=data;preview.hidden=false;remove.hidden=false;status.textContent='Ảnh đã sẵn sàng. Bấm Nhận dạng chữ để gửi ảnh tới Gemini.';
 }catch(error){if(id===serial)status.textContent=error.message;}
 finally{if(id===serial){busy=false;buttons();}}
}
async function read(){
 const user=window.HSKAccountDashboard?.user;
 if(!user){status.textContent='Hãy đăng nhập tài khoản app để nhận dạng chữ.';return;}
 if(!config||!image||busy)return;
 const id=++serial;controller=new AbortController();const current=controller;busy=true;buttons();output.hidden=true;status.textContent='Đang nhận dạng chữ…';
 const timer=setTimeout(()=>current.abort(),50000);
 try{
  const token=await user.getIdToken();if(id!==serial)return;
  const response=await fetch(config.endpoint.replace(/\/translate\/?$/,'/ocr'),{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({image}),signal:current.signal});
  const data=await response.json();if(id!==serial)return;
  if(!response.ok)throw Error(response.status===404?'Máy chủ chưa hỗ trợ nhận dạng ảnh. Cần triển khai bản máy chủ mới.':data.error||'Chưa nhận dạng được ảnh. Hãy thử lại.');
  if(typeof data.text!=='string'||data.text.length>10000||typeof data.note!=='string')throw Error('Kết quả nhận dạng không hợp lệ.');
  if(!data.text.trim()){status.textContent='Không tìm thấy chữ rõ trong ảnh. Hãy chụp gần hơn hoặc chọn ảnh khác.';return;}
  text.value=data.text;output.hidden=false;status.textContent='Đã nhận dạng. Kiểm tra dấu và chữ trước khi dịch.'+(data.note?' '+data.note:'');
 }catch(error){if(id===serial)status.textContent=error.name==='AbortError'?'Nhận dạng quá lâu. Hãy thử ảnh nhỏ hơn.':error.message;}
 finally{clearTimeout(timer);if(id===serial){controller=null;busy=false;buttons();}}
}
choose.addEventListener('click',()=>file.click());camera.addEventListener('click',()=>capture.click());file.addEventListener('change',pick);capture.addEventListener('change',pick);run.addEventListener('click',read);remove.addEventListener('click',reset);
use.addEventListener('click',()=>{const value=text.value.trim();if(!value){status.textContent='Chưa có nội dung để dịch.';return;}if(value.length>500){status.textContent='Ô dịch nhận tối đa 500 ký tự. Hãy giữ lại câu hoặc đoạn muốn dịch trong ô nhận dạng.';text.focus();return;}const input=$('translationInput');input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();input.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});status.textContent='Đã đưa vào ô dịch. Chọn HSK rồi bấm Dịch câu.';});
window.addEventListener('hsk-account-ready',reset);
fetch('./translation-config.json',{cache:'no-store'}).then(r=>r.json()).then(c=>{if(c.enabled&&typeof c.endpoint==='string'&&new URL(c.endpoint).protocol==='https:'&&/\/translate\/?$/.test(new URL(c.endpoint).pathname)){config=c;buttons();}}).catch(()=>{status.textContent='Chưa đọc được cấu hình nhận dạng chữ.';});
})();
