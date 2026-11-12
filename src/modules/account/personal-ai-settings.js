(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const form=$('personalAiForm');
 if(!form)return;
 const load=$('personalAiLoad'),status=$('personalAiStatus'),provider=$('personalAiProvider');
 const model=$('personalAiModel'),enabled=$('personalAiEnabled'),key=$('personalAiKey'),remove=$('personalAiRemove');
 const fostaModel=$('personalAiFostaModel'),modelLabel=$('personalAiModelLabel');
 const customEndpoint=$('personalAiCustomEndpoint'),endpointGroup=$('personalAiEndpointGroup');
 const PROVIDER_NAMES={
  'chatgpt-cookie':'ChatGPT (cookie riêng)',
  'muse-cookie':'Muse AI (token riêng)',
  fosta:'Fosta',
  custom:'Tùy chỉnh (OpenAI-compatible)',
  openai:'OpenAI',
  deepseek:'DeepSeek',
  claude:'Claude',
  gemini:'Gemini (API riêng)'
 };
 let stored=null,busy=false,owner=null,requestId=0;
 const account=()=>window.HSKAccountDashboard?.user;
 function getProvData(pId){
  return stored?.providers?.[pId]||(stored?.provider===pId?stored:null);
 }
 function describe(){
  const fosta=provider.value==='fosta',cookie=provider.value==='chatgpt-cookie',muse=provider.value==='muse-cookie',custom=provider.value==='custom';
  if(endpointGroup){endpointGroup.hidden=!custom;}
  if(customEndpoint){customEndpoint.disabled=busy||!custom;customEndpoint.required=custom;}
  const currentProv=getProvData(provider.value);
  key.maxLength=(cookie||muse)?16384:512;
  fostaModel.hidden=!fosta;fostaModel.disabled=busy||!fosta;
  model.hidden=fosta;model.disabled=busy||fosta;model.required=!fosta;
  if(cookie&&!model.value.trim())model.value=currentProv?.model||'gpt-6';
  if(muse&&!model.value.trim())model.value=currentProv?.model||'muse-spark';
  if(custom&&!model.value.trim()&&currentProv?.model)model.value=currentProv.model;
  modelLabel.htmlFor=fosta?fostaModel.id:model.id;
  $('personalAiEndpoint').textContent=fosta?'Base URL: https://codex.fosta.app/v1':cookie?'Dán giá trị cookie phiên ChatGPT. Nếu cookie tách thành .0 và .1, dán phần .0 rồi dấu | rồi phần .1, không thêm khoảng trắng.':muse?'Dán token/cookie phiên Muse AI (cookie hatch_sess từ muse.ai, hoặc Bearer token api.meta.ai).':custom?'Nhập URL endpoint tương thích OpenAI (ví dụ: https://literouter.fun/v1/chat/completions hoặc https://api.groq.com/openai/v1).':'Nhập tên model chính xác do nhà cung cấp cấp.';
  key.placeholder=currentProv?((cookie||muse)?'Để trống để giữ token/cookie đã lưu':'Để trống để giữ key đã lưu'):(cookie?'Dán __Secure-next-auth.session-token của bạn':muse?'Dán hatch_sess hoặc Bearer token Muse AI của bạn':custom?'Nhập API key của nhà cung cấp (sk-...)':'Nhập API key của bạn');
  remove.hidden=!currentProv;
 }
 function apply(data){
  stored=data.configured?data:null;
  if(stored&&data.providers&&typeof data.providers==='object'){
   stored.providers={...data.providers};
  }
  const currentProv=getProvData(provider.value)||getProvData(data.provider);
  const chosenProvider=currentProv?.provider||data.provider||'fosta';
  provider.value=chosenProvider;
  enabled.checked=currentProv?Boolean(currentProv.enabled):!!data.enabled;
  fostaModel.value=chosenProvider==='fosta'&&currentProv?.model?currentProv.model:fostaModel.options[0].value;
  model.value=chosenProvider==='fosta'?'':currentProv?.model||'';
  if(customEndpoint)customEndpoint.value=currentProv?.endpoint||'';
  key.value='';
  describe();form.hidden=false;
  status.textContent=stored?(enabled.checked?'Đang dùng API riêng cho Hỏi đáp AI.':'Đã lưu API key. Hỏi đáp AI đang dùng API mặc định.'):'Chưa lưu API key riêng.';
 }
 function lock(value){
  busy=value;load.disabled=value;
  for(const field of form.elements)field.disabled=value;
  describe();
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
   if(response.status===404)throw Error('Máy chủ Hỏi đáp AI chưa cập nhật chức năng API riêng. Hãy thử lại sau.');
   const data=await response.json();
   if(id!==requestId||account()?.uid!==user.uid)return;
   if(!response.ok)throw Error(data.error||'Chưa lưu được cài đặt API.');
   apply(data);
   if(stored&&op==='save'){
    stored.providers=stored.providers||{};
    stored.providers[data.provider]={...data};
   }
   window.HSKAiProviderPicker?.syncPersonal?.(user.uid,data,op==='remove'?{remove:true,provider:settings?.provider}:settings);
  }catch(error){if(id===requestId)status.textContent=error.message||'Chưa kết nối được máy chủ.';}
  finally{if(id===requestId)lock(false);}
 }
 provider.onchange=()=>{
  const currentProv=getProvData(provider.value);
  if(currentProv){
   enabled.checked=Boolean(currentProv.enabled);
   if(provider.value==='fosta')fostaModel.value=currentProv.model||fostaModel.options[0].value;
   else model.value=currentProv.model||'';
  }else{
   enabled.checked=true;
   if(provider.value==='fosta')fostaModel.value=fostaModel.options[0].value;
   else model.value=provider.value==='chatgpt-cookie'?'gpt-6':provider.value==='muse-cookie'?'muse-spark':'';
  }
  if(customEndpoint)customEndpoint.value=currentProv?.endpoint||'';
  key.value='';describe();
 };
 load.onclick=()=>request('read');
 form.onsubmit=event=>{
  event.preventDefault();
  const apiKey=key.value.trim();key.value='';
  const prov=provider.value;
  const currentProv=getProvData(prov);
  const modelVal=(prov==='fosta'?fostaModel:model).value.trim();
  const payload={provider:prov,model:modelVal,enabled:enabled.checked,...(apiKey?{apiKey}:{})};
  if(prov==='custom'){
   const endpointVal=customEndpoint?customEndpoint.value.trim():'';
   if(!endpointVal&&!currentProv?.endpoint){
    status.textContent='Vui lòng nhập Endpoint / Base URL cho nhà cung cấp tùy chỉnh.';
    customEndpoint?.focus();
    return;
   }
   if(endpointVal)payload.endpoint=endpointVal;
  }
  void request('save',payload);
 };
 remove.onclick=()=>{
  const provName=PROVIDER_NAMES[provider.value]||provider.value;
  if(confirm(`Xóa cấu hình ${provName} đã lưu?`)){
   void request('remove',{provider:provider.value});
  }
 };
 function reset(){
  const uid=account()?.uid||null;
  if(uid===owner)return;
  owner=uid;requestId++;stored=null;form.reset();key.value='';form.hidden=true;status.textContent='';lock(false);
 }
 window.addEventListener('hsk-account-ready',reset);
 reset();
})();
