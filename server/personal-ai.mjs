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
 'muse-cookie':'https://muse.ai/api/hatch/token'
};
const PERSONAL_FOSTA_MODELS=new Set(['gpt-6.1-sol','gpt-6-astra','gpt-6-luna']);
const personalEncode=value=>new TextEncoder().encode(value);
const personalB64=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes)));
const personalBytes=value=>Uint8Array.from(atob(value),char=>char.charCodeAt(0));
async function personalCipher(env){
 if(typeof env.AI_PERSONAL_KEY_SECRET!=='string'||env.AI_PERSONAL_KEY_SECRET.length<32)throw Error('Personal AI unavailable');
 return crypto.subtle.importKey('raw',await crypto.subtle.digest('SHA-256',personalEncode(env.AI_PERSONAL_KEY_SECRET)),{name:'AES-GCM'},false,['encrypt','decrypt']);
}
function personalPublic(record){
 return record?{configured:true,enabled:record.enabled,provider:record.provider,model:record.model}:{configured:false,enabled:false};
}
export async function personalAiStorage(storage,env,{action,uid,settings}){
 if(typeof uid!=='string'||!/^[-\w:]{1,150}$/.test(uid))return Response.json({}, {status:400});
 const key='personal-ai-v1';
 if(action==='personal-ai-remove'){
  await storage.delete(key);return Response.json(personalPublic(null));
 }
 if(action==='personal-ai-read'||action==='personal-ai-use'){
  const record=await storage.get(key);
  if(action==='personal-ai-read'||!record?.enabled)return Response.json(personalPublic(record));
  const apiKey=new TextDecoder().decode(await crypto.subtle.decrypt({
   name:'AES-GCM',iv:personalBytes(record.iv),additionalData:personalEncode(uid+':'+record.provider)
  },await personalCipher(env),personalBytes(record.ciphertext)));
  return Response.json({...personalPublic(record),apiKey});
 }
 if(action!=='personal-ai-save'||!settings||Object.keys(settings).some(k=>!['provider','model','enabled','apiKey'].includes(k)))return Response.json({}, {status:400});
 const {provider,model,enabled,apiKey}=settings;
 const maxKeyLen=(provider==='chatgpt-cookie'||provider==='muse-cookie')?8192:512;
 if(!Object.hasOwn(PERSONAL_PROVIDERS,provider)||typeof model!=='string'||!/^[a-z0-9][a-z0-9._:-]{0,99}$/i.test(model)||
  typeof enabled!=='boolean'||provider==='fosta'&&!PERSONAL_FOSTA_MODELS.has(model)||
  apiKey!==undefined&&(typeof apiKey!=='string'||apiKey.length<8||apiKey.length>maxKeyLen||!(provider==='chatgpt-cookie'||provider==='muse-cookie'?/^[ -~]+$/:/^[!-~]+$/).test(apiKey)))return Response.json({}, {status:400});
 const cipher=await personalCipher(env);
 return storage.transaction(async tx=>{
  const previous=await tx.get(key);
  if(!apiKey&&previous?.provider!==provider)return Response.json({}, {status:400});
  const record={provider,model,enabled,iv:previous?.iv,ciphertext:previous?.ciphertext};
  if(apiKey){
   const iv=crypto.getRandomValues(new Uint8Array(12));
   const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:personalEncode(uid+':'+provider)},cipher,personalEncode(apiKey));
   record.iv=personalB64(iv);record.ciphertext=personalB64(ciphertext);
  }
  await tx.put(key,record);return Response.json(personalPublic(record));
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
 const endpoint=PERSONAL_PROVIDERS[provider];
 if(!endpoint)throw Error('Invalid provider');
 const headers={'Content-Type':'application/json'};
 let url=endpoint,body=requestBody;
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
   body={model,messages:[{role:'system',content:system},...messages],...(provider==='fosta'?{stream:false}:{})};
  }
 }
 const response=await fetchFn(url,{method:'POST',headers,body:JSON.stringify(body),signal,redirect:'manual'});
 // Workers supports manual redirects. Never forward account-owned credentials to a redirect target.
 if(response.status>=300&&response.status<400)return new Response(null,{status:502});
 if(!response.ok||provider==='gemini')return response;
 const payload=await response.json().catch(()=>null);
 const text=provider==='claude'?payload?.content?.filter(part=>part.type==='text').map(part=>part.text).join(''):
  payload?.choices?.[0]?.message?.content;
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
  }else if(provider==='muse-cookie'){
   const info=await probeMuseAiAccount(apiKey,{fetchFn,signal,now});
   value={models:info?.models?.length?info.models:MUSE_DEFAULT_MODELS};
  }
 }catch{}
 providerModelsCache.set(cacheKey,{at:now(),value});
 return value;
}
