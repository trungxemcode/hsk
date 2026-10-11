(()=>{
'use strict';
const panel=document.getElementById('translatorPanel'),form=document.getElementById('translationForm'),input=document.getElementById('translationInput'),level=document.getElementById('translationLevel'),button=document.getElementById('translationSubmit'),status=document.getElementById('translationStatus'),result=document.getElementById('translationResult'),askForm=document.getElementById('translationAskForm'),askInput=document.getElementById('translationQuestion'),askButton=document.getElementById('translationAskSubmit'),askStatus=document.getElementById('translationAskStatus'),chat=document.getElementById('translationChat');
let config=null,pending=null,askPending=null,serial=0,lastText='',currentTranslation=null,conversation=[];
const cache=new Map(),direction=document.getElementById('translationDirection');
function syncDirection(){document.getElementById('translationLevelLabel').textContent=direction.value==='zh-vi'?'Trình độ giải thích':'Trình độ đích';document.getElementById('translationInputLabel').textContent=direction.value==='zh-vi'?'Câu tiếng Trung':'Câu tiếng Việt';input.placeholder=direction.value==='zh-vi'?'Nhập hoặc lấy chữ tiếng Trung từ ảnh…':'Nhập câu tiếng Việt cần dịch…';}
syncDirection();
direction.addEventListener('change',()=>{syncDirection();input.dispatchEvent(new Event('input',{bubbles:true}));});
function close(){document.body.classList.remove('show-translator');panel.hidden=true;}
document.getElementById('translatorBtn').addEventListener('click',()=>{
 document.body.classList.remove('drawer-open','show-about','show-account','show-admin');document.body.classList.add('show-translator');
 for(const id of ['aboutPanel','accountPanel','adminPanel'])document.getElementById(id).hidden=true;
 const drawer=document.querySelector('.drawer');if(drawer){drawer.inert=true;drawer.setAttribute('aria-hidden','true');}
 document.getElementById('menuBtn')?.setAttribute('aria-expanded','false');panel.hidden=false;document.querySelector('.workspace').scrollTop=0;
});
for(const el of document.querySelectorAll('.app-tabs button,#accountBtn,#adminBtn,#aboutBtn,[data-filter]'))el.addEventListener('click',close);
function clearConversation(){conversation=[];chat.replaceChildren();askInput.value='';askStatus.textContent='';askForm.hidden=true;askButton.disabled=false;askPending?.abort();askPending=null;}
function addMessage(role,text){const item=document.createElement('p');item.className='translation-chat-message '+(role==='model'?'assistant':'user');const label=document.createElement('strong');label.textContent=role==='model'?'AI':'Bạn';const body=document.createElement('span');body.textContent=text;item.append(label,body);chat.append(item);chat.scrollTop=chat.scrollHeight;}
function render(data){
 currentTranslation=data;
 for(const key of ['chinese','pinyin','explanation','note'])document.getElementById('translation-'+key).textContent=data[key];
 document.getElementById('translation-note').hidden=!data.note;
 const viet=document.getElementById('translation-vietnamese');viet.textContent=data.vietnamese||'';viet.hidden=!data.vietnamese;
 document.getElementById('translation-heading').textContent=data.direction==='zh-vi'?'Bản dịch tiếng Việt':'Bản dịch theo HSK '+data.hsk;
 const outside=document.getElementById('translation-outside');outside.textContent=data.outOfVocabulary.length?'Chữ/cụm chưa khớp danh sách HSK đã chọn: '+data.outOfVocabulary.join('、'):'';outside.hidden=!outside.textContent;
 askForm.hidden=false;result.hidden=false;
}
window.addEventListener('hsk-image-translated',event=>{const data=event.detail;if(!data||data.direction!=='zh-vi')return;direction.value='zh-vi';syncDirection();input.value=data.chinese;input.dispatchEvent(new Event('input',{bubbles:true}));lastText=data.chinese;render(data);status.textContent='Đã dịch trực tiếp từ ảnh. Bạn có thể hỏi AI về câu này.';});
async function translate(event){
 event?.preventDefault();const text=input.value.trim(),hsk=Number(level.value),translationDirection=direction.value;
 if(!config){status.textContent='Chưa kết nối dịch vụ dịch. Cần kích hoạt máy chủ miễn phí trước.';return;}
 if(!text){status.textContent='Nhập câu cần dịch.';input.focus();return;}
 const user=window.HSKAccountDashboard?.user;if(!user){status.textContent='Hãy đăng nhập tài khoản app trước khi dịch.';return;}
 clearConversation();currentTranslation=null;pending?.abort();const current=++serial;pending=new AbortController();const controller=pending;
 const key=JSON.stringify([user.uid,text,hsk,translationDirection]);lastText=text;
 if(cache.has(key)){render(cache.get(key));status.textContent='Đã hiển thị bản dịch trước đó.';button.disabled=false;return;}
 button.disabled=true;status.textContent=translationDirection==='zh-vi'?'Đang dịch tiếng Trung sang tiếng Việt…':'Đang dịch theo HSK '+hsk+'…';result.hidden=true;
 const timer=setTimeout(()=>controller.abort(),70000);
 try{
  const token=await user.getIdToken();if(current!==serial)return;
  const response=await fetch(config.endpoint,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({text,hsk,direction:translationDirection}),signal:controller.signal});
  const data=await response.json();if(current!==serial)return;if(!response.ok)throw Error(typeof data.error==='string'?data.error:'Dịch chưa thành công. Hãy thử lại.');
  if(data.hsk!==hsk||!['chinese','pinyin','explanation','note'].every(k=>typeof data[k]==='string')||!Array.isArray(data.outOfVocabulary)||!data.outOfVocabulary.every(v=>typeof v==='string'))throw Error('Kết quả chưa đúng định dạng.');
  if(translationDirection==='zh-vi'&&(data.direction!=='zh-vi'||typeof data.vietnamese!=='string'||!data.vietnamese.trim()))throw Error('Máy chủ chưa hỗ trợ Trung → Việt. Cần cập nhật mã Cloudflare mới.');
  cache.set(key,data);if(cache.size>30)cache.delete(cache.keys().next().value);render(data);status.textContent='Đã dịch. Bạn có thể hỏi AI về từ, ngữ pháp và cách dùng trong câu này.';
 }catch(error){if(current===serial)status.textContent=error.name==='AbortError'?'Dịch quá lâu hoặc đã bị hủy. Hãy thử lại.':error.message;}
 finally{clearTimeout(timer);if(current===serial){button.disabled=false;pending=null;}}
}
async function ask(event){
 event.preventDefault();const question=askInput.value.trim();if(!question||!currentTranslation)return;
 const user=window.HSKAccountDashboard?.user;if(!user){askStatus.textContent='Hãy đăng nhập tài khoản app trước khi hỏi AI.';return;}
 askPending?.abort();askPending=new AbortController();const controller=askPending;askButton.disabled=true;askInput.disabled=true;askStatus.textContent='AI đang trả lời…';
 const timer=setTimeout(()=>controller.abort(),50000);
 try{
  const token=await user.getIdToken();const endpoint=config.endpoint.replace(/\/translate$/,'/ask');
  const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({question,hsk:currentTranslation.hsk,translation:{vietnamese:currentTranslation.direction==='zh-vi'?currentTranslation.vietnamese:lastText,chinese:currentTranslation.chinese,pinyin:currentTranslation.pinyin,explanation:currentTranslation.explanation},history:conversation.slice(-8)}),signal:controller.signal});
  const data=await response.json();if(!response.ok)throw Error(typeof data.error==='string'?data.error:'AI chưa trả lời được. Hãy thử lại.');if(typeof data.answer!=='string'||!data.answer.trim())throw Error('Câu trả lời chưa đúng định dạng.');
  conversation.push({role:'user',text:question},{role:'assistant',text:data.answer});addMessage('user',question);addMessage('model',data.answer);askInput.value='';askStatus.textContent='';
 }catch(error){askStatus.textContent=error.name==='AbortError'?'Hỏi đáp quá lâu. Hãy thử lại.':error.message;}
 finally{clearTimeout(timer);askButton.disabled=false;askInput.disabled=false;askPending=null;}
}
form.addEventListener('submit',translate);askForm.addEventListener('submit',ask);
level.addEventListener('change',()=>{if(lastText&&input.value.trim()===lastText)translate();});
input.addEventListener('input',()=>{++serial;pending?.abort();pending=null;button.disabled=!config;result.hidden=true;lastText='';currentTranslation=null;clearConversation();});
window.addEventListener('hsk-account-ready',()=>{++serial;pending?.abort();cache.clear();result.hidden=true;lastText='';currentTranslation=null;clearConversation();button.disabled=!config;});
fetch('./translation-config.json',{cache:'no-store'}).then(r=>r.json()).then(c=>{
 if(c.enabled&&typeof c.endpoint==='string'&&new URL(c.endpoint).protocol==='https:'){config=c;button.disabled=false;status.textContent='Sẵn sàng dịch. Cần mạng và đăng nhập.';}
 else status.textContent='Dịch câu đang chờ kích hoạt kết nối miễn phí.';
}).catch(()=>{status.textContent='Không đọc được cấu hình kết nối dịch.';});
})();
