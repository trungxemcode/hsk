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
function personalProviderSummary(provider,record){
 return {
  configured:true,
  enabled:record.enabled===true,
  provider,
  model:record.model,
  ...(record.planType?{planType:record.planType}:{}),
  ...(record.endpoint?{endpoint:record.endpoint}:{})
 };
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
   map[p]=personalProviderSummary(p,rec);
  }
 }
 if(fallbackRecord?.provider&&!map[fallbackRecord.provider]){
  map[fallbackRecord.provider]=personalProviderSummary(fallbackRecord.provider,fallbackRecord);
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
   const maxTokens=Math.max(2400,Math.min(8192,Number(requestBody.generationConfig?.maxOutputTokens)||2400));
   body={model,system,messages,max_tokens:maxTokens};
  }else{
   headers.Authorization='Bearer '+apiKey;
   let fostaModel=model,fostaEffort=undefined;
   if(provider==='fosta'){
    if(model.includes(':')){
     const parts=model.split(':');
     fostaModel=parts[0];fostaEffort=parts[1];
    }
   }
   if(options.sentenceReview&&provider==='fosta'&&!fostaEffort)fostaEffort='low';
   const isReasoningModel=/^o[134](?:-|$)/i.test(fostaModel);
   body={model:fostaModel,messages:[{role:'system',content:system},...messages],...(!isReasoningModel&&requestBody.generationConfig?.temperature!==undefined?{temperature:requestBody.generationConfig.temperature}:{}),...(provider==='fosta'?{stream:false,...(fostaEffort?{reasoning_effort:fostaEffort}:{})}:{stream:false})};
  }
 }
 const response=await fetchFn(url,{method:'POST',headers,body:JSON.stringify(body),signal,redirect:'manual'});
 // Workers supports manual redirects. Never forward account-owned credentials to a redirect target.
 if(response.status>=300&&response.status<400)return new Response(null,{status:502});
 if(!response.ok||provider==='gemini')return response;
 const payload=await response.json().catch(()=>null);
 const openAiMsg=payload?.choices?.[0]?.message?.content;
 const openAiText=typeof openAiMsg==='string'?openAiMsg:
  Array.isArray(openAiMsg)?openAiMsg.filter(p=>typeof p==='string'||p?.type==='text'||p?.type==='output_text').map(p=>typeof p==='string'?p:(p?.text||'')).join(''):
  typeof payload?.choices?.[0]?.text==='string'?payload.choices[0].text:
  typeof payload?.output_text==='string'?payload.output_text:
  Array.isArray(payload?.output)?payload.output.flatMap(o=>Array.isArray(o?.content)?o.content:[]).filter(c=>typeof c?.text==='string').map(c=>c.text).join(''):null;
 const text=provider==='claude'?payload?.content?.filter(part=>part.type==='text').map(part=>part.text).join(''):openAiText;
 if(typeof text!=='string'||!text.trim())return new Response(null,{status:502});
 return Response.json({candidates:[{content:{parts:[{text:text.trim()}]}}]});
}

const OPENAI_ALLOW_MODELS=new Set(['gpt-4o-mini','gpt-4o','o3-mini','gpt-4.1','gpt-4.1-mini','o4-mini']);
const GEMINI_PROBE_ALLOW_MODELS=new Set(['gemini-2.5-flash-lite','gemini-2.5-flash','gemini-2.5-pro','gemini-2.0-flash']);
const STATIC_PROVIDER_MODELS={
 fosta:[
  {id:'gpt-6-luna',description:'Luna (Mặc định: Nhẹ, Trung bình, Nâng cao, Chuyên sâu)'},
  {id:'gpt-6-astra',description:'Astra (Mô hình cao cấp nhất)'},
  {id:'gpt-6.1-sol',description:'Sol (Mô hình cân bằng chi phí)'}
 ],
 'chatgpt-cookie':[
  {id:'gpt-6',description:'GPT-6 (Mặc định)'},
  {id:'gpt-6-instant',description:'GPT-6 Instant'},
  {id:'gpt-6-thinking',description:'GPT-6 Thinking'},
  {id:'gpt-5-6',description:'GPT-5.6'},
  {id:'gpt-4o',description:'GPT-4o'},
  {id:'gpt-4o-mini',description:'GPT-4o Mini'}
 ],
 'muse-cookie':[
  {id:'muse-spark',description:'Muse Spark (Nhanh, nhẹ)'},
  {id:'muse-pro',description:'Muse Pro (Suy luận sâu)'}
 ]
};
const PROVIDER_MODEL_SPECS={
 claude:{
  url:()=>'https://api.anthropic.com/v1/models',
  headers:apiKey=>({'x-api-key':apiKey,'anthropic-version':'2023-06-01'}),
  parse:data=>(data?.data||[]).filter(m=>typeof m?.id==='string'&&/^claude-/i.test(m.id)).map(m=>({id:m.id,description:m?.display_name||''})),
  probeSlice:10
 },
 deepseek:{
  url:()=>'https://api.deepseek.com/models',
  headers:apiKey=>({Authorization:'Bearer '+apiKey}),
  parse:data=>(data?.data||[]).map(m=>({id:m?.id,description:m?.owned_by?'Nhà phát triển: '+m.owned_by:''})).filter(m=>typeof m.id==='string'&&m.id),
  probeFilter:m=>/^deepseek-/i.test(m.id),
  probeSlice:8
 },
 openai:{
  url:()=>'https://api.openai.com/v1/models',
  headers:apiKey=>({Authorization:'Bearer '+apiKey}),
  parse:data=>(data?.data||[]).filter(m=>m&&OPENAI_ALLOW_MODELS.has(m.id)).map(m=>({id:m.id,description:''}))
 },
 gemini:{
  url:()=>'https://generativelanguage.googleapis.com/v1beta/models',
  headers:apiKey=>({'x-goog-api-key':apiKey}),
  parse:data=>(data?.models||[]).filter(m=>Array.isArray(m?.supportedGenerationMethods)&&m.supportedGenerationMethods.includes('generateContent')).map(m=>({id:String(m?.name||'').replace(/^models\//,''),description:m?.displayName||''})).filter(m=>m.id),
  probeFilter:m=>GEMINI_PROBE_ALLOW_MODELS.has(m.id)
 },
 custom:{
  url:endpoint=>resolveCustomModelsUrl(endpoint),
  headers:apiKey=>({Authorization:'Bearer '+apiKey}),
  parse:data=>parseOpenAiModelsList(data),
  probeSlice:20
 }
};

async function fetchProviderModels(provider,{apiKey,endpoint},{fetchFn=fetch,signal,redirect='follow',throwOnError=false,forProbe=false}={}){
 const spec=PROVIDER_MODEL_SPECS[provider];
 if(!spec)return [];
 const url=spec.url(endpoint);
 if(!url){
  if(throwOnError&&provider==='custom')throw Error('Vui lòng nhập Endpoint / Base URL.');
  return [];
 }
 const headers={
  ...spec.headers(apiKey),
  ...(!forProbe&&provider==='custom'?{'Content-Type':'application/json'}:{})
 };
 const res=await fetchFn(url,{method:'GET',headers,signal,redirect});
 if(!res.ok){
  if(!throwOnError)return [];
  if(provider==='custom'){
   const err=await res.json().catch(()=>null);
   const msg=err?.error?.message||err?.message||('HTTP '+res.status);
   throw Error('Lỗi từ nhà cung cấp: '+msg);
  }
  throw Error('HTTP '+res.status);
 }
 const data=await res.json().catch(()=>null);
 let items=spec.parse(data);
 if(forProbe){
  if(spec.probeFilter)items=items.filter(spec.probeFilter);
  if(spec.probeSlice)items=items.slice(0,spec.probeSlice);
  return items.map(m=>m.id);
 }
 if(throwOnError&&provider==='custom'&&!items.length)throw Error('Không tìm thấy model nào từ endpoint này.');
 return items;
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
  }else if(provider==='muse-cookie'){
   const info=await probeMuseAiAccount(apiKey,{fetchFn,signal,now});
   value={models:info?.models?.length?info.models:MUSE_DEFAULT_MODELS};
  }else if(provider==='fosta'){
   value={models:STATIC_PROVIDER_MODELS.fosta.map(m=>m.id)};
  }else if(Object.hasOwn(PROVIDER_MODEL_SPECS,provider)){
   const ids=await fetchProviderModels(provider,personal,{fetchFn,signal,redirect:'manual',throwOnError:false,forProbe:true});
   if(ids.length)value={models:ids};
  }
 }catch{}
 providerModelsCache.set(cacheKey,{at:now(),value});
 return value;
}

export function resolveCustomModelsUrl(endpoint){
 const u=String(endpoint||'').trim().replace(/\/+$/, '');
 if(!u)return '';
 if(u.endsWith('/chat/completions'))return u.slice(0,-'/chat/completions'.length)+'/models';
 if(u.endsWith('/models'))return u;
 return u+'/models';
}
function parseOpenAiModelsList(data){
 const rawList=Array.isArray(data)?data:(Array.isArray(data?.data)?data.data:(Array.isArray(data?.models)?data.models:[]));
 return rawList.map(m=>({
  id:String(typeof m==='string'?m:(m?.id||m?.name||'')).trim(),
  description:String(typeof m==='string'?'':(m?.description||(m?.owned_by?'Nhà phát triển: '+m.owned_by:'')))
 })).filter(m=>m.id&&m.id.length<=100);
}

export async function fetchPersonalAiModels(config,{fetchFn=fetch,signal}={}){
 if(!config||typeof config!=='object')throw Error('Cấu hình không hợp lệ.');
 const {provider,apiKey,endpoint}=config;
 if(!apiKey&&provider!=='fosta')throw Error('Chưa có API key.');
 if(Object.hasOwn(STATIC_PROVIDER_MODELS,provider)){
  return STATIC_PROVIDER_MODELS[provider].map(m=>({...m}));
 }
 if(Object.hasOwn(PROVIDER_MODEL_SPECS,provider)){
  return fetchProviderModels(provider,{apiKey,endpoint},{fetchFn,signal,redirect:'follow',throwOnError:true,forProbe:false});
 }
 return [];
}
