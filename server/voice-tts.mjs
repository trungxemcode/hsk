// Private Apps Script-to-Cloudflare TTS bridge. Google identity tokens, never browser API keys.
const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
async function sha256(value){
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
 return Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
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
  const prompt='Đọc nguyên văn tiếng Trung phổ thông sau, chính xác, tự nhiên, không đọc thêm từ nào: '+text;
  const payload={
   contents:[{role:'user',parts:[{text:prompt}]}],
   generationConfig:{responseModalities:['AUDIO'],speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:'Kore'}}}}
  };
  let response;
  try{response=await geminiFetch('https://generativelanguage.googleapis.com/v1beta/models/'+model+':generateContent',{
   method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)
  });}catch{return json({ok:false,error:'tts_provider_unavailable'},503);}
  if(!response.ok)return json({ok:false,error:'tts_provider_unavailable',upstreamStatus:response.status},[429,503].includes(response.status)?response.status:502);
  let data;
  try{data=await response.json();}catch{return json({ok:false,error:'invalid_tts_response'},502);}
  const candidate=data?.candidates?.[0]?.content?.parts?.find(p=>p?.inlineData?.data);
  const base64=candidate?.inlineData?.data,mime=candidate?.inlineData?.mimeType;
  if(typeof base64!=='string'||base64.length<8||base64.length>2000000
   ||!/^[A-Za-z0-9+/]+={0,2}$/.test(base64)
   ||typeof mime!=='string'||!/^audio\/(?:l16|pcm|x-pcm|wav)/i.test(mime))return json({ok:false,error:'invalid_tts_audio'},502);
  // Never log the prompt, the Google bearer, a provider key, or the audio payload.
  return json({ok:true,audioBase64:base64,mimeType:mime,voice:'Kore',model});
 };
}
