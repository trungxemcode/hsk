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
export function createVoicePrecacheHandler(googleFetch,geminiFetch,now=()=>Date.now()){
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
   if(data.length>1500)return json({ok:false,error:'invalid_request'},400);
   input=JSON.parse(data);
  }catch{return json({ok:false,error:'invalid_request'},400);}
  if(!input||typeof input!=='object'||Array.isArray(input)
   ||Object.keys(input).some(k=>!['text','language'].includes(k))
   ||(input.language!==undefined&&input.language!=='zh-CN')
   ||typeof input.text!=='string')return json({ok:false,error:'invalid_request'},400);
  const text=input.text.normalize('NFC').replace(/\s+/g,' ').trim();
  if(!text||Array.from(text).length>220||/[<>\u0000-\u001f]/.test(text)||!/[\u3400-\u9fff]/u.test(text))return json({ok:false,error:'invalid_text'},400);
  const model=env.HSK_VOICE_TTS_MODEL||'gemini-2.5-flash-preview-tts';
  if(!/^gemini-[a-z0-9.-]+-tts$/.test(model))return json({ok:false,error:'invalid_model'},503);
  const prompt='Read the following Mandarin Chinese text naturally and accurately. Read only the Chinese text, with no introduction or extra words:\n'+text;
  const payload={
   contents:[{role:'user',parts:[{text:prompt}]}],
   generationConfig:{responseModalities:['AUDIO'],speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:'Kore'}}}}
  };
  const controller=new AbortController(),cancel=()=>controller.abort();
  if(request.signal.aborted)controller.abort();else request.signal.addEventListener('abort',cancel,{once:true});
  const deadline=setTimeout(cancel,80000);
  try{
   for(let attempt=0;attempt<2;attempt++){
    let response;
    try{response=await geminiFetch('https://generativelanguage.googleapis.com/v1beta/models/'+model+':generateContent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});}catch{return json({ok:false,error:'tts_provider_unavailable'},503);}
    if(!response.ok)return json({ok:false,error:'tts_provider_unavailable',upstreamStatus:response.status},[429,503].includes(response.status)?response.status:502);
    let data;try{data=await response.json();}catch{return json({ok:false,error:'invalid_tts_response'},502);}
    const audio=decodeVoiceAudio(data);
    if(!audio.error)return json({ok:true,...audio,voice:'Kore',model});
    // Fixed categories only: no prompts, ID tokens, API keys, vendor messages or audio in logs.
    console.warn('hsk-voice-generation-failed',{reason:audio.error,attempt:attempt+1});
    if(!audio.retryable||attempt===1)return json({ok:false,error:audio.error},502);
    // A short word can produce OTHER with an instructional prompt. Retry the literal transcript.
    payload.contents[0].parts[0].text=text;
   }
  }finally{clearTimeout(deadline);request.signal.removeEventListener('abort',cancel);}
 };
}
