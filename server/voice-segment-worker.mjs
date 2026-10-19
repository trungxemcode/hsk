import { detectVoiceSegments } from './voice-segmentation.mjs';
const response=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export default {
 async fetch(request,env){
  if(request.method!=='POST')return response({ok:false,error:'method_not_allowed'},405);
  if(new URL(request.url).pathname!=='/segment-wav')return response({ok:false,error:'not_found'},404);
  const authorization=request.headers.get('Authorization')||'';
  if(!authorization.startsWith('Bearer ')||authorization.length>5000)return response({ok:false,error:'unauthorized'},401);
  if(!env.ALLOWED_GOOGLE_EMAIL||!env.ALLOWED_GOOGLE_AUDIENCE)return response({ok:false,error:'not_configured'},503);
  let token;
  try {
   const check=await fetch('https://oauth2.googleapis.com/tokeninfo?id_token='+encodeURIComponent(authorization.slice(7)),{signal:AbortSignal.timeout(4000)});
   if(!check.ok)return response({ok:false,error:'unauthorized'},401);
   token=await check.json();
  }catch{return response({ok:false,error:'identity_unavailable'},503);}
  if(token.email_verified!== 'true' && token.email_verified!==true)return response({ok:false,error:'unauthorized'},401);
  if(token.email!==env.ALLOWED_GOOGLE_EMAIL||token.aud!==env.ALLOWED_GOOGLE_AUDIENCE||token.iss!=='https://accounts.google.com'&&token.iss!=='accounts.google.com')return response({ok:false,error:'unauthorized'},401);
  if(Number(token.exp)*1000<Date.now())return response({ok:false,error:'unauthorized'},401);
  if(Number(request.headers.get('content-length')||0)>12000000)return response({ok:false,error:'payload_too_large'},413);
  let input;
  try{input=await request.json();}catch{return response({ok:false,error:'invalid_request'},400);}
  if(!input||Object.keys(input).some(k=>!['action','audioBase64','expected'].includes(k))||input.action!=='segment-wav')return response({ok:false,error:'invalid_request'},400);
  try{return response({ok:true,...detectVoiceSegments(input.audioBase64,input.expected)});}
  catch(e){return response({ok:false,error:['invalid_expected','invalid_audio','invalid_wav','unsupported_wav','silent_master','unreliable_segmentation'].includes(e.message)?e.message:'invalid_audio'},400);}
 }
};
