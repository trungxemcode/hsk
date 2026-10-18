import { hskVoiceVerifyPartial } from './voice-partial-verify.mjs';
// Private Apps Script-to-Cloudflare TTS bridge. Google identity tokens, never browser API keys.
const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
async function sha256(value){
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
 return Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
}
export function decodeVoiceAudio(data){
 if(data?.promptFeedback?.blockReason)return {error:'tts_blocked'};
 const candidate=data?.candidates?.[0],finish=candidate?.finishReason;
 if(finish&&finish!=='STOP')return {error:['OTHER','MAX_TOKENS','FINISH_REASON_UNSPECIFIED'].includes(finish)?'tts_generation_incomplete':'tts_blocked',retryable:['OTHER','MAX_TOKENS','FINISH_REASON_UNSPECIFIED'].includes(finish)};
 const parts=candidate?.content?.parts?.filter(p=>p?.inlineData?.data)||[];
 if(!parts.length)return {error:'tts_generation_incomplete',retryable:true};
 let binary='',format;
 for(const part of parts){
  const {data:value,mimeType:mime}=part.inlineData;
  if(typeof value!=='string'||value.length>2000000||typeof mime!=='string')return {error:'invalid_tts_audio'};
  const base64=value.replace(/[\r\n\t ]/g,'');
  if(!base64||base64.length%4!==0||!/^[A-Za-z0-9+/]+={0,2}$/.test(base64))return {error:'invalid_tts_audio'};
  const type=mime.split(';')[0].trim().toLowerCase(),pcm=['audio/l16','audio/pcm','audio/x-pcm'].includes(type),wav=['audio/wav','audio/wave','audio/x-wav'].includes(type);
  if(!pcm&&!wav)return {error:'invalid_tts_audio'};
  if(pcm){for(const parameter of mime.split(';').slice(1)){const [name,val]=parameter.trim().toLowerCase().split('=');if(name==='rate'&&val!=='24000'||name==='channels'&&val!=='1'||name==='codec'&&val!=='pcm')return {error:'invalid_tts_audio'};}}
  const current=pcm?'pcm':'wav';if(format&&format!==current||current==='wav'&&parts.length!==1)return {error:'invalid_tts_audio'};format=current;
  let decoded;try{decoded=atob(base64);}catch{return {error:'invalid_tts_audio'};}
  if(!decoded.length||decoded.length%2||decoded.length+(binary.length)>1500000-44)return {error:'invalid_tts_audio'};binary+=decoded;
 }
 if(format==='wav'){
  if(binary.length<46||binary.slice(0,4)!=='RIFF'||binary.slice(8,12)!=='WAVE')return {error:'invalid_tts_audio'};
  const u32=at=>[0,1,2,3].reduce((n,i)=>n+binary.charCodeAt(at+i)*2**(8*i),0);
  const u16=at=>binary.charCodeAt(at)+binary.charCodeAt(at+1)*256;
  if(u32(4)!==binary.length-8)return {error:'invalid_tts_audio'};
  let foundFormat=false,foundData=false;
  for(let offset=12;offset<binary.length;){
   if(offset+8>binary.length)return {error:'invalid_tts_audio'};
   const name=binary.slice(offset,offset+4),size=u32(offset+4),start=offset+8;
   if(start+size>binary.length)return {error:'invalid_tts_audio'};
   if(name==='fmt '){if(foundFormat||size<16||u16(start)!==1||u16(start+2)!==1||u32(start+4)!==24000||u32(start+8)!==48000||u16(start+12)!==2||u16(start+14)!==16)return {error:'invalid_tts_audio'};foundFormat=true;}
   if(name==='data'){if(foundData||!size||size%2)return {error:'invalid_tts_audio'};foundData=true;}
   offset=start+size+(size%2);
  }
  if(!foundFormat||!foundData)return {error:'invalid_tts_audio'};
 }
 return {audioBase64:btoa(binary),mimeType:format==='pcm'?'audio/L16;codec=pcm;rate=24000':'audio/wav'};
}
export async function voiceProviderFailure(response){
 const data=await response.clone().json().catch(()=>null),details=data?.error?.details||[],message=String(data?.error?.message||'');
 const code=response.status,attempted=response.headers.get('X-HSK-Provider-Attempted')!=='0';
 const daily=details.some(d=>d.violations?.some(v=>/perday|daily/i.test(String(v.quotaId)+' '+String(v.quotaMetric))));
 const unavailable=details.some(d=>d.violations?.some(v=>String(v.quotaValue)==='0'));
 let reason='tts_provider_unavailable',retryable=true,retryAfter=Math.min(604800,Math.max(60,Number(response.headers.get('Retry-After'))||300));
 if(code===429){reason=unavailable?'tts_quota_unavailable':daily?'tts_daily_limit':'tts_rate_limited';retryAfter=Math.max(retryAfter,daily||unavailable?86400:60);retryable=!unavailable;}
 else if(code===400&&/location.*not supported|region.*not supported/i.test(message)){reason='tts_region_unavailable';retryable=false;retryAfter=86400;}
 else if(code===401||details.some(d=>d.reason==='API_KEY_INVALID')){reason='tts_key_invalid';retryable=false;retryAfter=86400;}
 else if(code===403){reason='tts_permission_denied';retryable=false;retryAfter=86400;}
 else if(code===404){reason='tts_model_unavailable';retryable=false;retryAfter=86400;}
 else if(code>=400&&code<500){reason='tts_request_rejected';retryable=false;retryAfter=86400;}
 return {ok:false,error:reason,upstreamStatus:code,providerAttempts:attempted?1:0,retryable,retryAfter};
}
export function createVoicePrecacheHandler(googleFetch,geminiFetch,now=()=>Date.now(),slotFetch){
 return async function voicePrecache(request,env){
  if(request.method!=='POST')return json({ok:false,error:'method_not_allowed'},405);
  if(!env.HSK_VOICE_GOOGLE_SUB_SHA256)return json({ok:false,error:'voice_not_configured'},503);
  const token=request.headers.get('Authorization')?.match(/^Bearer ([A-Za-z0-9._-]+)$/)?.[1];
  if(!token||token.length>6000)return json({ok:false,error:'unauthorized'},401);
  // Google authenticates the signer. Do not trust claims decoded without validation.
  let identity;
  try{
   const verify=await googleFetch('https://oauth2.googleapis.com/tokeninfo?id_token='+encodeURIComponent(token),{method:'GET',redirect:'manual'});
   if(!verify.ok)return json({ok:false,error:'unauthorized'},401);
   identity=await verify.json();
  }catch(error){
   // Log only a fixed category, never a Google ID token or the exception's URL/message.
   const detail=String(error?.message||'').toLowerCase();
   const category=detail.includes('redirect')?'redirect':detail.includes('dns')?'dns':detail.includes('network')?'network':detail.includes('fetch')?'fetch':detail.includes('timeout')?'timeout':'other';
   console.warn('hsk-voice-identity-verify-failed',category);
   return json({ok:false,error:'identity_unavailable'},503);
  }
  if(!identity||!['accounts.google.com','https://accounts.google.com'].includes(identity.iss)
   ||identity.email_verified!==true&&identity.email_verified!=='true'
   ||typeof identity.sub!=='string'||!/^[0-9]{8,32}$/.test(identity.sub)
   ||typeof identity.exp!=='string'&&typeof identity.exp!=='number'
   ||Number(identity.exp)<=now()/1000
   ||typeof identity.aud!=='string'||!identity.aud
   ||(env.HSK_VOICE_GOOGLE_AUDIENCE&&identity.aud!==env.HSK_VOICE_GOOGLE_AUDIENCE)
   ||(await sha256(identity.sub))!==env.HSK_VOICE_GOOGLE_SUB_SHA256){
   return json({ok:false,error:'unauthorized'},401);
  }
  let input;
  try{
   const data=await request.text();
   if(data.length>700000)return json({ok:false,error:'invalid_request'},400);
   input=JSON.parse(data);
   if(input?.action!=='verify'&&data.length>1500)return json({ok:false,error:'invalid_request'},400);
  }catch{return json({ok:false,error:'invalid_request'},400);}
  if(input?.action==='verify'){
   if(Object.keys(input).some(k=>!['action','items','clips'].includes(k)))return json({ok:false,error:'invalid_request'},400);
   const checked=await hskVoiceVerifyPartial(input,geminiFetch,request.signal);
   return json(checked.result,checked.status);
  }
  if(!input||typeof input!=='object'||Array.isArray(input)
   ||Object.keys(input).some(k=>!['text','language','keySlot','action','isolated','items'].includes(k))
   ||(input.keySlot!==undefined&&(!Number.isInteger(input.keySlot)||input.keySlot<1||input.keySlot>9||!slotFetch))
   ||(input.language!==undefined&&input.language!=='zh-CN')
   ||(input.isolated!==undefined&&(typeof input.isolated!=='boolean'||input.keySlot===undefined))
   ||(input.action!==undefined&&input.action!=='status')
   ||(input.items!==undefined&&(!input.isolated||!Array.isArray(input.items)||input.items.length<1||input.items.length>10||input.text!==undefined||input.items.some(t=>typeof t!=='string'||!t.trim()||/[<>\u0000-\u001f]/.test(t)||!/[\u3400-\u9fff]/u.test(t))))
   ||(input.action!=='status'&&input.items===undefined&&typeof input.text!=='string'))return json({ok:false,error:'invalid_request'},400);
  if(input.action==='status'){
   if(input.text!==undefined||input.items!==undefined||input.keySlot!==undefined||!slotFetch)return json({ok:false,error:'invalid_request'},400);
   try{return json({ok:true,slots:await slotFetch(1).availability()});}catch{return json({ok:false,error:'key_status_unavailable'},503);}
  }
  const text=(input.items?input.items.join('。 '):input.text).normalize('NFC').replace(/\s+/g,' ').trim();
  if(!text||Array.from(text).length>220||/[<>\u0000-\u001f]/.test(text)||!/[\u3400-\u9fff]/u.test(text))return json({ok:false,error:'invalid_text'},400);
  const model=(!input.items&&input.isolated&&env.HSK_VOICE_ISOLATED_MODEL)||env.HSK_VOICE_TTS_MODEL||'gemini-2.5-flash-preview-tts';
  if(!/^gemini-[a-z0-9.-]+-tts(?:-preview)?$/.test(model))return json({ok:false,error:'invalid_model'},503);
  const prompt=(input.items?'Read every Mandarin Chinese item below exactly once in order, as an independent dictionary entry in citation form. Use standard Mandarin tones and natural word-internal tone sandhi. Do not connect neighbouring entries. Finish each entry fully, then leave 1.2 seconds of silence. Do not read punctuation or instructions. Speak only these entries:\n':input.isolated?'Read each Mandarin Chinese item separated by a full stop independently and clearly. Pause silently for one full second between items. Do not connect items or read these instructions. Speak only the items:\n':input.keySlot===undefined?'Read the following Mandarin Chinese text naturally and accurately. Read only the Chinese text, with no introduction or extra words:\n':'Say in Mandarin Chinese: ')+(input.items?input.items.map(t=>t.normalize('NFC').trim()+'。 ...').join('\n'):text);
  const payload={
   contents:[{role:'user',parts:[{text:prompt}]}],
   generationConfig:{responseModalities:['AUDIO'],speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:'Kore'}}}}
  };
  const provider=input.keySlot===undefined?geminiFetch:slotFetch(input.keySlot,input.isolated===true&&!input.items);
  const controller=new AbortController(),cancel=()=>controller.abort();
  if(request.signal.aborted)controller.abort();else request.signal.addEventListener('abort',cancel,{once:true});
  const deadline=setTimeout(cancel,80000);
  try{
   for(let attempt=0;attempt<(input.keySlot===undefined?2:1);attempt++){
    let response;
    try{response=await provider('https://generativelanguage.googleapis.com/v1beta/models/'+model+':generateContent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});}catch{return json({ok:false,error:'tts_transport_uncertain',providerAttempts:1,retryable:false},503);}
    if(!response.ok)return json(await voiceProviderFailure(response),[429,503].includes(response.status)?response.status:502);
    let data;try{data=await response.json();}catch{return json({ok:false,error:'invalid_tts_response',providerAttempts:1},502);}
    const audio=decodeVoiceAudio(data);
    if(!audio.error)return json({ok:true,...audio,voice:'Kore',model,providerAttempts:attempt+1});
    // Fixed categories only: no prompts, ID tokens, API keys, vendor messages or audio in logs.
    console.warn('hsk-voice-generation-failed',{reason:audio.error,attempt:attempt+1});
    if(!audio.retryable||attempt===1||input.keySlot!==undefined)return json({ok:false,error:audio.error,providerAttempts:attempt+1,retryable:!!audio.retryable,retryAfter:600},502);
    // A short word can produce OTHER with an instructional prompt. Retry the literal transcript.
    payload.contents[0].parts[0].text=text;
   }
  }finally{clearTimeout(deadline);request.signal.removeEventListener('abort',cancel);}
 };
}
