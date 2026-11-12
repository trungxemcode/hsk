import {chatgptCookieGenerate,probeChatGptCookieAccount} from './chatgpt-cookie.mjs';
import {museAiGenerate,probeMuseAiAccount,MUSE_DEFAULT_MODELS} from './muse-ai.mjs';
// Credentials are scoped to an authenticated UID and encrypted before storage.
const PERSONAL_PROVIDERS={
 openai:'https://api.openai.com/v1/chat/completions',
 fosta:'https://codex.fosta.app/v1/chat/completions',
 deepseek:'https://api.deepseek.com/chat/completions',
 claude:'https://api.anthropic.com/v1/messages',
 gemini:'https://generativelanguage.googleapis.com/v1beta/models/',
 'chatgpt-cookie':'https://chatgpt.com/backend-api/conversation',
 'muse-cookie':'https://muse.ai/api/hatch/token',
 custom:''
};
function isValidEndpointUrl(str){
 if(typeof str!=='string'||str.length<8||str.length>300)return false;
 try{
  const u=new URL(str);
  if(u.protocol!=='https:'&&u.protocol!=='http:')return false;
  const h=u.hostname.toLowerCase();
  if(h==='localhost'||h.endsWith('.localhost')||h==='127.0.0.1'||h==='0.0.0.0'||h==='::1'||h==='169.254.169.254'||h.startsWith('10.')||h.startsWith('192.168.')||/^172\.(1[6-9]|2\d|3[01])\./.test(h)||h.endsWith('.internal')||h.endsWith('.local'))return false;
  return true;
 }catch{
  return false;
 }
}
const PERSONAL_FOSTA_MODELS=new Set([
 'gpt-6.1-sol','gpt-6-astra','gpt-6-luna',
 'gpt-6-luna:low','gpt-6-luna:medium','gpt-6-luna:high','gpt-6-luna:xhigh',
 'gpt-6.1-sol:low','gpt-6.1-sol:medium','gpt-6.1-sol:high',
 'gpt-6-astra:low','gpt-6-astra:medium','gpt-6-astra:high','gpt-6-astra:xhigh'
]);
const personalEncode=value=>new TextEncoder().encode(value);
const personalB64=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes)));
const personalBytes=value=>Uint8Array.from(atob(value),char=>char.charCodeAt(0));
async function personalCipher(env){
 if(typeof env.AI_PERSONAL_KEY_SECRET!=='string'||env.AI_PERSONAL_KEY_SECRET.length<32)throw Error('Personal AI unavailable');
 return crypto.subtle.importKey('raw',await crypto.subtle.digest('SHA-256',personalEncode(env.AI_PERSONAL_KEY_SECRET)),{name:'AES-GCM'},false,['encrypt','decrypt']);
}
function personalPublic(record){
 return record?{
  configured:true,
  enabled:record.enabled,
  provider:record.provider,
  model:record.model,
  ...(record.endpoint?{endpoint:record.endpoint}:{})
 }:{configured:false,enabled:false};
}
async function loadAllPersonalProviders(store,fallbackRecord){
 let index=await store.get('personal-ai-providers-index');
 const map={};
 if(!Array.isArray(index)){
  index=fallbackRecord?.provider?[fallbackRecord.provider]:[];
 }
 for(const p of index){
  let rec=await store.get('personal-ai-prov:'+p);
  if(!rec&&fallbackRecord?.provider===p)rec=fallbackRecord;
  if(rec&&rec.provider===p){
   map[p]={
    configured:true,
    enabled:rec.enabled===true,
    provider:p,
    model:rec.model,
    ...(rec.planType?{planType:rec.planType}:{}),
    ...(rec.endpoint?{endpoint:rec.endpoint}:{})
   };
  }
 }
 if(fallbackRecord?.provider&&!map[fallbackRecord.provider]){
  map[fallbackRecord.provider]={
   configured:true,
   enabled:fallbackRecord.enabled===true,
   provider:fallbackRecord.provider,
   model:fallbackRecord.model,
   ...(fallbackRecord.planType?{planType:fallbackRecord.planType}:{}),
   ...(fallbackRecord.endpoint?{endpoint:fallbackRecord.endpoint}:{})
  };
 }
 return map;
}
export async function personalAiStorage(storage,env,{action,uid,settings}){
 if(typeof uid!=='string'||!/^[-\w:]{1,150}$/.test(uid))return Response.json({}, {status:400});
 const key='personal-ai-v1';
 if(action==='personal-ai-remove'){
  const targetProvider=typeof settings?.provider==='string'?settings.provider:null;
  if(targetProvider){
   return storage.transaction(async tx=>{
    await tx.delete('personal-ai-prov:'+targetProvider);
    let index=(await tx.get('personal-ai-providers-index'))||[];
    index=Array.isArray(index)?index.filter(p=>p!==targetProvider):[];
    await tx.put('personal-ai-providers-index',index);
    const legacy=await tx.get(key);
    if(legacy?.provider===targetProvider){
     if(index.length){
      const nextRec=await tx.get('personal-ai-prov:'+index[0]);
      if(nextRec){await tx.put(key,nextRec);const providers=await loadAllPersonalProviders(tx,nextRec);return Response.json({...personalPublic(nextRec),providers});}
     }
     await tx.delete(key);
     return Response.json(personalPublic(null));
    }
    const providers=await loadAllPersonalProviders(tx,legacy);
    return Response.json({...personalPublic(legacy),providers});
   });
  }
  return storage.transaction(async tx=>{
   const index=(await tx.get('personal-ai-providers-index'))||[];
   if(Array.isArray(index)){for(const p of index)await tx.delete('personal-ai-prov:'+p);}
   await tx.delete('personal-ai-providers-index');
   await tx.delete(key);
   return Response.json(personalPublic(null));
  });
 }
 if(action==='personal-ai-read'){
  const record=await storage.get(key);
  if(!record)return Response.json(personalPublic(null));
  const providers=await loadAllPersonalProviders(storage,record);
  return Response.json({...personalPublic(record),providers});
 }
 if(action==='personal-ai-use'){
  const targetProvider=typeof settings?.provider==='string'&&Object.hasOwn(PERSONAL_PROVIDERS,settings.provider)?settings.provider:null;
  let record=null;
  if(targetProvider){
   record=await storage.get('personal-ai-prov:'+targetProvider);
   if(!record){
    const legacy=await storage.get(key);
    if(legacy?.provider===targetProvider)record=legacy;
   }
  }else{
   record=await storage.get(key);
  }
  if(!record?.enabled)return Response.json(personalPublic(record));
  const apiKey=new TextDecoder().decode(await crypto.subtle.decrypt({
   name:'AES-GCM',iv:personalBytes(record.iv),additionalData:personalEncode(uid+':'+record.provider)
  },await personalCipher(env),personalBytes(record.ciphertext)));
  return Response.json({...personalPublic(record),apiKey});
 }
 if(action!=='personal-ai-save'||!settings||Object.keys(settings).some(k=>!['provider','model','enabled','apiKey','endpoint'].includes(k)))return Response.json({}, {status:400});
 const {provider,model,enabled,apiKey,endpoint}=settings;
 const maxKeyLen=(provider==='chatgpt-cookie'||provider==='muse-cookie')?16384:512;
 if(!Object.hasOwn(PERSONAL_PROVIDERS,provider)||typeof model!=='string'||!/^[a-z0-9][a-z0-9._/:-]{0,99}$/i.test(model)||
  typeof enabled!=='boolean'||provider==='fosta'&&!PERSONAL_FOSTA_MODELS.has(model)||
  provider==='custom'&&endpoint!==undefined&&!isValidEndpointUrl(endpoint)||
  apiKey!==undefined&&(typeof apiKey!=='string'||apiKey.length<8||apiKey.length>maxKeyLen||!(provider==='chatgpt-cookie'||provider==='muse-cookie'?/^[ -~]+$/:/^[!-~]+$/).test(apiKey)))return Response.json({}, {status:400});
 const cipher=await personalCipher(env);
 const inferredPlan=provider==='chatgpt-cookie'?((apiKey?.includes('|')||apiKey?.length>4000||['gpt-6','gpt-6-instant','gpt-6-thinking','gpt-5-6','gpt-4o','gpt-4-1','o4-mini'].includes(model))?'plus':'free'):undefined;
 return storage.transaction(async tx=>{
  const legacy=await tx.get(key);
  let previous=await tx.get('personal-ai-prov:'+provider);
  if(!previous&&legacy?.provider===provider)previous=legacy;
  if(!apiKey&&!previous?.ciphertext)return Response.json({}, {status:400});
  if(provider==='custom'&&!endpoint&&!previous?.endpoint)return Response.json({}, {status:400});
  const record={
   provider,model,enabled,
   iv:previous?.iv,
   ciphertext:previous?.ciphertext,
   ...(inferredPlan?{planType:inferredPlan}:previous?.planType?{planType:previous.planType}:{}),
   ...(provider==='custom'?{endpoint:endpoint||previous?.endpoint}:{})
  };
  if(apiKey){
   const iv=crypto.getRandomValues(new Uint8Array(12));
   const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:personalEncode(uid+':'+provider)},cipher,personalEncode(apiKey));
   record.iv=personalB64(iv);record.ciphertext=personalB64(ciphertext);
  }
  await tx.put('personal-ai-prov:'+provider,record);
  let index=(await tx.get('personal-ai-providers-index'))||[];
  if(!Array.isArray(index))index=[];
  if(!index.includes(provider))index.push(provider);
  if(legacy?.provider&&!index.includes(legacy.provider))index.push(legacy.provider);
  await tx.put('personal-ai-providers-index',index);
  await tx.put(key,record);
  return Response.json(personalPublic(record));
 });
}
export async function personalAiCall(env,uid,action,settings){
 const binding=env.AI_CONTROL;
 if(!binding)return action==='personal-ai-use'?{enabled:false}:{status:503};
 const response=await binding.get(binding.idFromName('personal-ai:'+uid)).fetch('https://internal.hsk/personal-ai',{
  method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({uid,action,settings})
 });
 if(action==='personal-ai-use'&&!response.ok)throw Error('Personal AI unavailable');
 return {status:response.status,...await response.json()};
}
export async function personalAiGenerate(config,requestBody,fetchFn,signal,options={}){
 const {provider,model,apiKey}=config;
 if(provider==='chatgpt-cookie')return chatgptCookieGenerate(config,requestBody,fetchFn,signal,options);
 if(provider==='muse-cookie')return museAiGenerate(config,requestBody,fetchFn,signal,options);
 const endpoint=provider==='custom'?config.endpoint:PERSONAL_PROVIDERS[provider];
 if(!endpoint)throw Error('Invalid provider');
 const headers={'Content-Type':'application/json'};
 let url=endpoint,body=requestBody;
 if(provider==='custom'&&!url.endsWith('/chat/completions')){
  url=url.replace(/\/+$/, '')+'/chat/completions';
 }
 if(provider==='gemini'){
  url+=encodeURIComponent(model)+':generateContent';
  headers['x-goog-api-key']=apiKey;
 }else{
  const system=requestBody.systemInstruction.parts[0].text;
  const messages=requestBody.contents.map(message=>({
   role:message.role==='model'?'assistant':'user',content:message.parts.map(part=>part.text||'').join('\n')
  }));
  if(provider==='claude'){
   headers['x-api-key']=apiKey;headers['anthropic-version']='2023-06-01';
   body={model,system,messages,max_tokens:2400};
  }else{
   headers.Authorization='Bearer '+apiKey;
   let fostaModel=model,fostaEffort=undefined;
   if(provider==='fosta'){
    if(model.includes(':')){
     const parts=model.split(':');
     fostaModel=parts[0];fostaEffort=parts[1];
    }
    }
    if(options.sentenceReview&&!fostaEffort)fostaEffort='low';
   body={model:fostaModel,messages:[{role:'system',content:system},...messages],...(requestBody.generationConfig?.temperature!==undefined?{temperature:requestBody.generationConfig.temperature}:{}),...(provider==='fosta'?{stream:false,...(fostaEffort?{reasoning_effort:fostaEffort}:{})}:{stream:false})};
  }
 }
 const response=await fetchFn(url,{method:'POST',headers,body:JSON.stringify(body),signal,redirect:'manual'});
 // Workers supports manual redirects. Never forward account-owned credentials to a redirect target.
 if(response.status>=300&&response.status<400)return new Response(null,{status:502});
 if(!response.ok||provider==='gemini')return response;
 const payload=await response.json().catch(()=>null);
 const text=provider==='claude'?payload?.content?.filter(part=>part.type==='text').map(part=>part.text).join(''):
  (payload?.choices?.[0]?.message?.content??payload?.choices?.[0]?.text);
 if(typeof text!=='string')return new Response(null,{status:502});
 return Response.json({candidates:[{content:{parts:[{text:text.trim()}]}}]});
}

const providerModelsCache=new Map();
export async function probePersonalAiCapabilities(personal,{env={},fetchFn=fetch,signal,now=()=>Date.now()}={}){
 if(!personal?.enabled||!personal?.apiKey||!personal?.provider)return {};
 const {provider,apiKey,model}=personal;
 const cacheKey=`${provider}:${apiKey.slice(0,16)}:${apiKey.length}:${model||''}`;
 const cached=providerModelsCache.get(cacheKey);
 if(cached&&now()-cached.at<1800000)return cached.value;
 let value={};
 try{
  if(provider==='chatgpt-cookie'){
   const info=await probeChatGptCookieAccount(apiKey,{env,fetchFn,signal,now});
   const planType=info?.planType||((apiKey.includes('|')||apiKey.length>4000||['gpt-6','gpt-6-instant','gpt-6-thinking','gpt-5-6','gpt-4o','gpt-4-1','o4-mini'].includes(model))?'plus':'free');
   const models=info?.models?.length?info.models:(planType==='plus'?['gpt-6-instant','gpt-6','gpt-6-thinking','gpt-5-6']:['gpt-4o-mini','o3-mini']);
   value={planType,models};
  }else if(provider==='claude'){
   const res=await fetchFn('https://api.anthropic.com/v1/models',{method:'GET',headers:{'x-api-key':apiKey,'anthropic-version':'2023-06-01'},signal,redirect:'manual'});
   if(res.ok){
    const data=await res.json().catch(()=>null);
    const ids=(data?.data||[]).map(m=>m?.id).filter(id=>typeof id==='string'&&/^claude-/i.test(id)).slice(0,10);
    if(ids.length)value={models:ids};
   }
  }else if(provider==='deepseek'){
   const res=await fetchFn('https://api.deepseek.com/models',{method:'GET',headers:{Authorization:'Bearer '+apiKey},signal,redirect:'manual'});
   if(res.ok){
    const data=await res.json().catch(()=>null);
    const ids=(data?.data||[]).map(m=>m?.id).filter(id=>typeof id==='string'&&/^deepseek-/i.test(id)).slice(0,8);
    if(ids.length)value={models:ids};
   }
  }else if(provider==='openai'){
   const res=await fetchFn('https://api.openai.com/v1/models',{method:'GET',headers:{Authorization:'Bearer '+apiKey},signal,redirect:'manual'});
   if(res.ok){
    const data=await res.json().catch(()=>null);
    const allow=new Set(['gpt-4o-mini','gpt-4o','o3-mini','gpt-4.1','gpt-4.1-mini','o4-mini']);
    const ids=(data?.data||[]).map(m=>m?.id).filter(id=>allow.has(id));
    if(ids.length)value={models:ids};
   }
  }else if(provider==='gemini'){
   const res=await fetchFn('https://generativelanguage.googleapis.com/v1beta/models',{method:'GET',headers:{'x-goog-api-key':apiKey},signal,redirect:'manual'});
   if(res.ok){
    const data=await res.json().catch(()=>null);
    const allow=new Set(['gemini-2.5-flash-lite','gemini-2.5-flash','gemini-2.5-pro','gemini-2.0-flash']);
    const ids=(data?.models||[]).filter(m=>Array.isArray(m?.supportedGenerationMethods)&&m.supportedGenerationMethods.includes('generateContent')).map(m=>String(m?.name||'').replace(/^models\//,'')).filter(id=>allow.has(id));
    if(ids.length)value={models:ids};
   }
  }else if(provider==='fosta'){
   value={models:['gpt-6-luna','gpt-6-astra','gpt-6.1-sol']};
  }else if(provider==='custom'&&personal.endpoint){
   let modelsUrl=personal.endpoint;
   if(modelsUrl.endsWith('/chat/completions')){
    modelsUrl=modelsUrl.slice(0,-'/chat/completions'.length)+'/models';
   }else if(!modelsUrl.endsWith('/models')){
    modelsUrl=modelsUrl.replace(/\/+$/, '')+'/models';
   }
   const res=await fetchFn(modelsUrl,{method:'GET',headers:{Authorization:'Bearer '+apiKey},signal,redirect:'manual'});
   if(res.ok){
    const data=await res.json().catch(()=>null);
    const ids=(data?.data||[]).map(m=>m?.id).filter(id=>typeof id==='string'&&id.trim().length<=100).slice(0,20);
    if(ids.length)value={models:ids};
   }
  }else if(provider==='muse-cookie'){
   const info=await probeMuseAiAccount(apiKey,{fetchFn,signal,now});
   value={models:info?.models?.length?info.models:MUSE_DEFAULT_MODELS};
  }
 }catch{}
 providerModelsCache.set(cacheKey,{at:now(),value});
 return value;
}

export async function fetchPersonalAiModels(config,{fetchFn=fetch,signal}={}){
 if(!config||typeof config!=='object')throw Error('Cấu hình không hợp lệ.');
 const {provider,apiKey,endpoint}=config;
 if(!apiKey&&provider!=='fosta')throw Error('Chưa có API key.');
 if(provider==='custom'){
  if(!endpoint)throw Error('Vui lòng nhập Endpoint / Base URL.');
  let modelsUrl=endpoint.trim().replace(/\/+$/, '');
  if(modelsUrl.endsWith('/chat/completions')){
   modelsUrl=modelsUrl.slice(0,-'/chat/completions'.length)+'/models';
  }else if(!modelsUrl.endsWith('/models')){
   modelsUrl+='/models';
  }
  const res=await fetchFn(modelsUrl,{
   method:'GET',
   headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},
   signal,
   redirect:'follow'
  });
  if(!res.ok){
   const err=await res.json().catch(()=>null);
   const msg=err?.error?.message||err?.message||('HTTP '+res.status);
   throw Error('Lỗi từ nhà cung cấp: '+msg);
  }
  const data=await res.json().catch(()=>null);
  const rawList=Array.isArray(data)?data:(Array.isArray(data?.data)?data.data:(Array.isArray(data?.models)?data.models:[]));
  const models=rawList.map(m=>({
   id:String(typeof m==='string'?m:(m?.id||m?.name||'')).trim(),
   description:String(typeof m==='string'?'':(m?.description||(m?.owned_by?'Nhà phát triển: '+m.owned_by:'')))
  })).filter(m=>m.id&&m.id.length<=100);
  if(!models.length)throw Error('Không tìm thấy model nào từ endpoint này.');
  return models;
 }
 if(provider==='deepseek'){
  const res=await fetchFn('https://api.deepseek.com/models',{headers:{Authorization:'Bearer '+apiKey},signal,redirect:'follow'});
  if(!res.ok)throw Error('HTTP '+res.status);
  const data=await res.json().catch(()=>null);
  return (data?.data||[]).map(m=>({id:m.id,description:m.owned_by?'Nhà phát triển: '+m.owned_by:''})).filter(m=>m.id);
 }
 if(provider==='openai'){
  const res=await fetchFn('https://api.openai.com/v1/models',{headers:{Authorization:'Bearer '+apiKey},signal,redirect:'follow'});
  if(!res.ok)throw Error('HTTP '+res.status);
  const data=await res.json().catch(()=>null);
  const allow=new Set(['gpt-4o','gpt-4o-mini','o3-mini','gpt-4.1','gpt-4.1-mini','o4-mini']);
  return (data?.data||[]).filter(m=>allow.has(m.id)).map(m=>({id:m.id,description:''}));
 }
 if(provider==='gemini'){
  const res=await fetchFn('https://generativelanguage.googleapis.com/v1beta/models',{headers:{'x-goog-api-key':apiKey},signal,redirect:'follow'});
  if(!res.ok)throw Error('HTTP '+res.status);
  const data=await res.json().catch(()=>null);
  return (data?.models||[]).filter(m=>Array.isArray(m?.supportedGenerationMethods)&&m.supportedGenerationMethods.includes('generateContent')).map(m=>({id:String(m?.name||'').replace(/^models\//,''),description:m.displayName||''}));
 }
 if(provider==='fosta'){
  return [
   {id:'gpt-6-luna',description:'Luna (Mặc định: Nhẹ, Trung bình, Nâng cao, Chuyên sâu)'},
   {id:'gpt-6-astra',description:'Astra (Mô hình cao cấp nhất)'},
   {id:'gpt-6.1-sol',description:'Sol (Mô hình cân bằng chi phí)'}
  ];
 }
 if(provider==='chatgpt-cookie'){
  return [
   {id:'gpt-6',description:'GPT-6 (Mặc định)'},
   {id:'gpt-6-instant',description:'GPT-6 Instant'},
   {id:'gpt-6-thinking',description:'GPT-6 Thinking'},
   {id:'gpt-5-6',description:'GPT-5.6'},
   {id:'gpt-4o',description:'GPT-4o'},
   {id:'gpt-4o-mini',description:'GPT-4o Mini'}
  ];
 }
 if(provider==='muse-cookie'){
  return [
   {id:'muse-spark',description:'Muse Spark (Nhanh, nhẹ)'},
   {id:'muse-pro',description:'Muse Pro (Suy luận sâu)'}
  ];
 }
 return [];
}
