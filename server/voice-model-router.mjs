// Explicit allowlist: stable 3.8 TTS uses Interactions, older TTS uses generateContent.
// Never route a text model or STT-only model as TTS; paid-only Pro is opt-in.
export const HSK_TTS_MODELS = Object.freeze({
 'gemini-2.5-flash-preview-tts':{api:'generateContent',free:true},
 'gemini-3.1-flash-tts-preview':{api:'generateContent',free:true},
 'gemini-3.8-flash-lite-tts':{api:'interactions',free:true},
 'gemini-3.8-flash-tts':{api:'interactions',free:true},
 'gemini-2.5-pro-preview-tts':{api:'generateContent',free:false}
});
export const HSK_FREE_TTS_MODELS = Object.freeze(Object.keys(HSK_TTS_MODELS).filter(m=>HSK_TTS_MODELS[m].free));
export const HSK_DEFAULT_FREE_TTS_MODELS=Object.freeze([
 'gemini-2.5-flash-preview-tts','gemini-3.1-flash-tts-preview',
 'gemini-3.8-flash-lite-tts','gemini-3.8-flash-tts'
]);
export function hskTtsModelInfo(model,{allowPaid=false}={}){
 const info=Object.hasOwn(HSK_TTS_MODELS,model)?HSK_TTS_MODELS[model]:null;
 return info&&(!info.free&&!allowPaid?null:info);
}
export function hskTtsNamespace(model){
 if(!Object.hasOwn(HSK_TTS_MODELS,model))throw Error('invalid_model');
 return 'hsk-tts-model-v1:'+model;
}
export function hskBuildInteractionRequest(model,transcript){
 if(hskTtsModelInfo(model)?.api!=='interactions'||typeof transcript!=='string'||!transcript.trim())
  throw Error('invalid_model');
 return {
  endpoint:'https://generativelanguage.googleapis.com/v1beta/interactions',
  payload:{model,
   input:[{type:'user_input',content:[{type:'text',text:transcript,annotations:[{type:'speech_metadata',style:'Read in clear standard Mandarin and leave a full silent pause between vocabulary entries.'}]}]}],
   response_format:{type:'audio',mime_type:'audio/l16',sample_rate:24000},
   generation_config:{speech_config:[{voice:'Kore'}]}}
 };
}
// Official non-streaming interactions REST returns output_audio.data as BASE64 PCM.
// Reject any response without the complete audio block; downstream WAV validation
// will enforce sample rate, channel count, format and duration before READY is possible.
export function hskInteractionAsLegacyAudio(result){
 const out=result?.output_audio;
 if(typeof out?.data!=='string'||!out.data) return {error:'tts_generation_incomplete'};
 const mime=out.mime_type||out.mimeType||'audio/L16;codec=pcm;rate=24000';
 if(!['audio/l16','audio/l16;codec=pcm;rate=24000','audio/pcm','audio/wav'].includes(mime.toLowerCase()))
  return {error:'invalid_tts_audio'};
 return {candidates:[{finishReason:'STOP',content:{parts:[{inlineData:{data:out.data,mimeType:mime}}]}}]};
}
