(()=>{
'use strict';
const panel=document.getElementById('translatorPanel'),form=document.getElementById('translationForm'),input=document.getElementById('translationInput'),level=document.getElementById('translationLevel'),button=document.getElementById('translationSubmit'),status=document.getElementById('translationStatus'),result=document.getElementById('translationResult');
let config=null,pending=null,serial=0,lastText='';
const cache=new Map();
function close(){document.body.classList.remove('show-translator');panel.hidden=true;}
document.getElementById('translatorBtn').addEventListener('click',()=>{
 document.body.classList.remove('drawer-open','show-about','show-account','show-admin');document.body.classList.add('show-translator');
 for(const id of ['aboutPanel','accountPanel','adminPanel'])document.getElementById(id).hidden=true;
 const drawer=document.querySelector('.drawer');if(drawer){drawer.inert=true;drawer.setAttribute('aria-hidden','true');}
 document.getElementById('menuBtn')?.setAttribute('aria-expanded','false');panel.hidden=false;document.querySelector('.workspace').scrollTop=0;
});
for(const el of document.querySelectorAll('.app-tabs button,#accountBtn,#adminBtn,#aboutBtn,[data-filter]'))el.addEventListener('click',close);
function render(data){
 for(const key of ['chinese','pinyin','explanation','note'])document.getElementById('translation-'+key).textContent=data[key];
 document.getElementById('translation-note').hidden=!data.note;
 document.getElementById('translation-heading').textContent='Bản dịch theo HSK '+data.hsk;
 const outside=document.getElementById('translation-outside');outside.textContent=data.outOfVocabulary.length?'Chữ/cụm chưa khớp danh sách HSK đã chọn: '+data.outOfVocabulary.join('、'):'';outside.hidden=!outside.textContent;
 result.hidden=false;
}
async function translate(event){
 event?.preventDefault();const text=input.value.trim(),hsk=Number(level.value);
 if(!config){status.textContent='Chưa kết nối dịch vụ dịch. Cần kích hoạt máy chủ miễn phí trước.';return;}
 if(!text){status.textContent='Nhập câu tiếng Việt cần dịch.';input.focus();return;}
 const user=window.HSKAccountDashboard?.user;if(!user){status.textContent='Hãy đăng nhập tài khoản app trước khi dịch.';return;}
 pending?.abort();const current=++serial;pending=new AbortController();const controller=pending;
 const key=JSON.stringify([user.uid,text,hsk]);lastText=text;
 if(cache.has(key)){render(cache.get(key));status.textContent='Đã hiển thị bản dịch trước đó.';button.disabled=false;return;}
 button.disabled=true;status.textContent='Đang dịch theo HSK '+hsk+'…';result.hidden=true;
 const timer=setTimeout(()=>controller.abort(),50000);
 try{
  const token=await user.getIdToken();if(current!==serial)return;
  const response=await fetch(config.endpoint,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({text,hsk}),signal:controller.signal});
  const data=await response.json();if(current!==serial)return;if(!response.ok)throw Error(typeof data.error==='string'?data.error:'Dịch chưa thành công. Hãy thử lại.');
  if(data.hsk!==hsk||!['chinese','pinyin','explanation','note'].every(k=>typeof data[k]==='string')||!Array.isArray(data.outOfVocabulary)||!data.outOfVocabulary.every(v=>typeof v==='string'))throw Error('Kết quả chưa đúng định dạng.');
  cache.set(key,data);if(cache.size>30)cache.delete(cache.keys().next().value);render(data);status.textContent='Đã dịch. Bạn có thể đổi HSK để xem cách diễn đạt khác.';
 }catch(error){if(current===serial)status.textContent=error.name==='AbortError'?'Dịch quá lâu hoặc đã bị hủy. Hãy thử lại.':error.message;}
 finally{clearTimeout(timer);if(current===serial){button.disabled=false;pending=null;}}
}
form.addEventListener('submit',translate);
level.addEventListener('change',()=>{if(lastText&&input.value.trim()===lastText)translate();});
input.addEventListener('input',()=>{++serial;pending?.abort();pending=null;button.disabled=!config;result.hidden=true;lastText='';});
window.addEventListener('hsk-account-ready',()=>{++serial;pending?.abort();cache.clear();result.hidden=true;lastText='';button.disabled=!config;});
fetch('./translation-config.json',{cache:'no-store'}).then(r=>r.json()).then(c=>{
 if(c.enabled&&typeof c.endpoint==='string'&&new URL(c.endpoint).protocol==='https:'){config=c;button.disabled=false;status.textContent='Sẵn sàng dịch. Cần mạng và đăng nhập.';}
 else status.textContent='Dịch câu đang chờ kích hoạt kết nối miễn phí.';
}).catch(()=>{status.textContent='Không đọc được cấu hình kết nối dịch.';});
})();
