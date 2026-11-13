(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const form=$('personalAiForm');
 if(!form)return;
 const load=$('personalAiLoad'),status=$('personalAiStatus'),provider=$('personalAiProvider');
 const model=$('personalAiModel'),enabled=$('personalAiEnabled'),key=$('personalAiKey'),remove=$('personalAiRemove');
 const fostaModel=$('personalAiFostaModel'),modelLabel=$('personalAiModelLabel');
 const customEndpoint=$('personalAiCustomEndpoint'),endpointGroup=$('personalAiEndpointGroup');
 const fetchModelsBtn=$('personalAiFetchModels');
 const modelListContainer=$('personalAiModelListContainer');
 const modelList=$('personalAiModelList');
 const modelCount=$('personalAiModelCount');
 const modelListClose=$('personalAiModelListClose');
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
  updateFetchBtnState();
  if(fosta&&modelListContainer){
   modelListContainer.hidden=true;
  }
 }
 function updateFetchBtnState(){
  if(!fetchModelsBtn)return;
  const prov=provider.value;
  const custom=prov==='custom';
  const canFetch=custom||['openai','deepseek','gemini','claude'].includes(prov);
  fetchModelsBtn.hidden=!canFetch;
  if(!canFetch){
   fetchModelsBtn.disabled=true;
   fetchModelsBtn.classList.remove('is-ready');
   return;
  }
  const currentProv=getProvData(prov);
  const hasEndpoint=!custom||Boolean(customEndpoint?.value?.trim()||currentProv?.endpoint);
  const hasKey=Boolean(key.value.trim()||currentProv?.configured);
  const readyToFetch=!busy&&hasEndpoint&&hasKey;
  fetchModelsBtn.disabled=!readyToFetch;
  fetchModelsBtn.classList.toggle('is-ready',readyToFetch);
 }
 function renderModelList(models){
  if(!modelList||!modelListContainer)return;
  modelList.innerHTML='';
  if(modelCount)modelCount.textContent=String(models.length);
  modelListContainer.hidden=false;

  for(const item of models){
   const card=document.createElement('div');
   card.className='personal-ai-model-card';
   card.setAttribute('role','button');
   card.tabIndex=0;
   const isCurrent=model.value===item.id;
   if(isCurrent)card.classList.add('is-selected');

   const info=document.createElement('div');
   info.className='personal-ai-model-card-info';

   const titleRow=document.createElement('div');
   titleRow.className='personal-ai-model-card-title';
   const code=document.createElement('strong');
   code.textContent=item.id;
   titleRow.appendChild(code);

   if(isCurrent){
    const badge=document.createElement('span');
    badge.className='personal-ai-model-badge';
    badge.textContent='Đang dùng';
    titleRow.appendChild(badge);
   }
   info.appendChild(titleRow);

   if(item.description){
    const desc=document.createElement('div');
    desc.className='personal-ai-model-card-desc';
    desc.textContent=item.description;
    info.appendChild(desc);
   }
   card.appendChild(info);

   const applyBtn=document.createElement('button');
   applyBtn.type='button';
   applyBtn.className='secondary-btn personal-ai-model-apply-btn'+(isCurrent?' applied':'');
   applyBtn.textContent=isCurrent?'Đã áp dụng':'Áp dụng';

   const onApply=e=>{
    if(e)e.stopPropagation();
    model.value=item.id;
    renderModelList(models);
    status.textContent=`Đã chọn model: ${item.id}. Bấm "Lưu cài đặt API" để áp dụng.`;
    model.focus();
   };

   applyBtn.onclick=onApply;
   card.onclick=onApply;
   card.onkeydown=e=>{
    if(e.key==='Enter'||e.key===' '){
     e.preventDefault();
     onApply(e);
    }
   };

   card.appendChild(applyBtn);
   modelList.appendChild(card);
  }
 }
 async function fetchSupportedModels(options={}){
  const prov=provider.value;
  if(prov==='fosta')return;
  const currentProv=getProvData(prov);
  const endpointVal=prov==='custom'?(customEndpoint?.value?.trim()||currentProv?.endpoint||''):'';
  const keyVal=key.value.trim();

  if(prov==='custom'&&!endpointVal){
   if(!options.silent)status.textContent='Vui lòng nhập Endpoint / Base URL trước để lấy danh sách model.';
   customEndpoint?.focus();
   return;
  }
  if(!keyVal&&!currentProv){
   if(!options.silent)status.textContent='Vui lòng nhập API key hoặc lưu cấu hình trước khi lấy model.';
   key.focus();
   return;
  }

  if(fetchModelsBtn){
   fetchModelsBtn.disabled=true;
   fetchModelsBtn.textContent='Đang kiểm tra…';
  }
  if(!options.silent)status.textContent='Đang kiểm tra API key và lấy danh sách model…';

  try{
   let models=null;
   if(prov==='custom'&&endpointVal&&keyVal){
    try{
     let mUrl=endpointVal.replace(/\/+$/, '');
     if(mUrl.endsWith('/chat/completions'))mUrl=mUrl.slice(0,-'/chat/completions'.length)+'/models';
     else if(!mUrl.endsWith('/models'))mUrl+='/models';
     const r=await fetch(mUrl,{
      headers:{Authorization:'Bearer '+keyVal},
      signal:AbortSignal.timeout(4000)
     });
     if(r.ok){
      const d=await r.json().catch(()=>null);
      const raw=Array.isArray(d)?d:(Array.isArray(d?.data)?d.data:(Array.isArray(d?.models)?d.models:[]));
      if(raw.length){
       models=raw.map(m=>({
        id:String(typeof m==='string'?m:(m?.id||m?.name||'')).trim(),
        description:String(typeof m==='string'?'':(m?.description||(m?.owned_by?'Nhà phát triển: '+m.owned_by:'')))
       })).filter(m=>m.id&&m.id.length<=100);
      }
     }
    }catch{}
   }

   if(!models){
    const user=account();
    if(!user?.uid)throw Error('Hãy đăng nhập để tải danh sách model.');
    const data=await callPersonalAiSettings('models',{
     provider:prov,
     ...(endpointVal?{endpoint:endpointVal}:{}),
     ...(keyVal?{apiKey:keyVal}:{})
    },user);
    if(Array.isArray(data?.models))models=data.models;
   }

   if(!models||!models.length){
    throw Error('Không tìm thấy model nào từ nhà cung cấp.');
   }

   renderModelList(models);
   status.textContent=`Kết nối thành công! Tìm thấy ${models.length} model. Bấm "Áp dụng" để chọn.`;
  }catch(err){
   if(!options.silent){
    status.textContent=err.message||'Chưa kết nối được với key/endpoint này.';
   }
  }finally{
   if(fetchModelsBtn){
    fetchModelsBtn.textContent='Kiểm tra & Lấy model';
    updateFetchBtnState();
   }
  }
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
  if(chosenProvider==='custom'&&currentProv?.endpoint){
   setTimeout(()=>fetchSupportedModels({silent:true}),100);
  }
 }
 function lock(value){
  busy=value;load.disabled=value;
  for(const field of form.elements)field.disabled=value;
  describe();
 }
 async function callPersonalAiSettings(op,settings,user,{checkAbort}={}){
  const config=await fetch('./translation-config.json',{cache:'no-store'}).then(r=>r.json());
  const token=await user.getIdToken();
  checkAbort?.();
  const endpoint=new URL('/personal-ai-settings',config.endpoint);
  if(endpoint.protocol!=='https:')throw Error('Máy chủ API chưa được cấu hình.');
  const response=await fetch(endpoint,{
   method:'POST',
   headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
   body:JSON.stringify({op,settings}),
   cache:'no-store'
  });
  if(response.status===404)throw Error('Máy chủ Hỏi đáp AI chưa cập nhật chức năng API riêng. Hãy thử lại sau.');
  const data=await response.json().catch(()=>null);
  checkAbort?.();
  if(!response.ok)throw Error(data?.error||(op==='models'?'Chưa lấy được danh sách model.':'Chưa lưu được cài đặt API.'));
  return data;
 }
 async function request(op,settings){
  if(busy)return;
  const user=account();
  if(!user?.uid){status.textContent='Hãy đăng nhập để cài đặt API riêng.';return;}
  const id=++requestId;
  lock(true);status.textContent='Đang xử lý…';
  try{
   const data=await callPersonalAiSettings(op,settings,user,{
    checkAbort:()=>{
     if(id!==requestId||account()?.uid!==user.uid){
      const err=new Error('aborted');
      err.isAborted=true;
      throw err;
     }
    }
   });
   apply(data);
   if(stored&&op==='save'){
    stored.providers=stored.providers||{};
    stored.providers[data.provider]={...data};
   }
   window.HSKAiProviderPicker?.syncPersonal?.(user.uid,data,op==='remove'?{remove:true,provider:settings?.provider}:settings);
  }catch(error){
   if(!error?.isAborted&&id===requestId)status.textContent=error.message||'Chưa kết nối được máy chủ.';
  }finally{if(id===requestId)lock(false);}
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
  if(provider.value==='custom'&&currentProv?.endpoint){
   setTimeout(()=>fetchSupportedModels({silent:true}),100);
  }else if(modelListContainer){
   modelListContainer.hidden=true;
  }
 };
 if(fetchModelsBtn)fetchModelsBtn.onclick=()=>fetchSupportedModels({silent:false});
 if(key)key.addEventListener('input',updateFetchBtnState);
 if(customEndpoint)customEndpoint.addEventListener('input',updateFetchBtnState);
 if(modelListClose)modelListClose.onclick=()=>{if(modelListContainer)modelListContainer.hidden=true;};
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
  if(modelListContainer)modelListContainer.hidden=true;
  if(modelList)modelList.innerHTML='';
 }
 window.addEventListener('hsk-account-ready',reset);
 reset();
})();