// Credentials are scoped to an authenticated UID and encrypted before storage.
const PERSONAL_PROVIDERS={
 openai:'https://api.openai.com/v1/chat/completions',
 fosta:'https://codex.fosta.app/v1/chat/completions',
 deepseek:'https://api.deepseek.com/chat/completions',
 claude:'https://api.anthropic.com/v1/messages',
 gemini:'https://generativelanguage.googleapis.com/v1beta/models/'
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
 if(!Object.hasOwn(PERSONAL_PROVIDERS,provider)||typeof model!=='string'||!/^[a-z0-9][a-z0-9._:-]{0,99}$/i.test(model)||
  typeof enabled!=='boolean'||provider==='fosta'&&!PERSONAL_FOSTA_MODELS.has(model)||
  apiKey!==undefined&&(typeof apiKey!=='string'||!/^[!-~]{8,512}$/.test(apiKey)))return Response.json({}, {status:400});
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
export async function personalAiGenerate(config,requestBody,fetchFn,signal){
 const {provider,model,apiKey}=config;
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
