(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const form=$('personalAiForm');
 if(!form)return;
 const load=$('personalAiLoad'),status=$('personalAiStatus'),provider=$('personalAiProvider');
 const model=$('personalAiModel'),enabled=$('personalAiEnabled'),key=$('personalAiKey'),remove=$('personalAiRemove');
 const models={fosta:['gpt-6.1-sol','gpt-6-astra','gpt-6-luna'],openai:[],claude:[],deepseek:[],gemini:[]};
 let stored=null,busy=false,owner=null,requestId=0;
 const account=()=>window.HSKAccountDashboard?.user;
 function describe(){
  $('personalAiEndpoint').textContent=provider.value==='fosta'?'Base URL: https://codex.fosta.app/v1':'Nhập tên model chính xác do nhà cung cấp cấp.';
  $('personalAiModels').replaceChildren(...models[provider.value].map(value=>{
   const option=document.createElement('option');option.value=value;return option;
  }));
  key.placeholder=stored?.provider===provider.value?'Để trống để giữ key đã lưu':'Nhập API key của bạn';
 }
 function apply(data){
  stored=data.configured?data:null;
  enabled.checked=!!data.enabled;
  provider.value=data.provider||'fosta';
  model.value=data.model||models[provider.value][0]||'';
  key.value='';remove.hidden=!stored;
  describe();form.hidden=false;
  status.textContent=stored?(enabled.checked?'Đang dùng API riêng cho Hỏi đáp AI.':'Đã lưu API key. Hỏi đáp AI đang dùng API mặc định.'):'Chưa lưu API key riêng.';
 }
 function lock(value){
  busy=value;load.disabled=value;
  for(const field of form.elements)field.disabled=value;
 }
 async function request(op,settings){
  if(busy)return;
  const user=account();
  if(!user?.uid){status.textContent='Hãy đăng nhập để cài đặt API riêng.';return;}
  const id=++requestId;
  lock(true);status.textContent='Đang xử lý…';
  try{
   const config=await fetch('./translation-config.json',{cache:'no-store'}).then(r=>r.json());
   const token=await user.getIdToken();
   if(id!==requestId||account()?.uid!==user.uid)return;
   const endpoint=new URL('/personal-ai-settings',config.endpoint);
   if(endpoint.protocol!=='https:')throw Error('Máy chủ API chưa được cấu hình.');
   const response=await fetch(endpoint,{
    method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
    body:JSON.stringify({op,settings}),cache:'no-store'
   });
   const data=await response.json();
   if(id!==requestId||account()?.uid!==user.uid)return;
   if(!response.ok)throw Error(data.error||'Chưa lưu được cài đặt API.');
   apply(data);
  }catch(error){if(id===requestId)status.textContent=error.message||'Chưa kết nối được máy chủ.';}
  finally{if(id===requestId)lock(false);}
 }
 provider.onchange=()=>{model.value=models[provider.value][0]||'';key.value='';describe();};
 load.onclick=()=>request('read');
 form.onsubmit=event=>{
  event.preventDefault();
  const apiKey=key.value.trim();key.value='';
  void request('save',{provider:provider.value,model:model.value.trim(),enabled:enabled.checked,...(apiKey?{apiKey}:{})});
 };
 remove.onclick=()=>{if(confirm('Xóa API key riêng đã lưu?'))void request('remove');};
 function reset(){
  const uid=account()?.uid||null;
  if(uid===owner)return;
  owner=uid;requestId++;stored=null;form.reset();key.value='';form.hidden=true;status.textContent='';lock(false);
 }
 window.addEventListener('hsk-account-ready',reset);
 reset();
})();
