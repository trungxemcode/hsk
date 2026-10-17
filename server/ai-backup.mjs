// Configured text provider; credentials remain in server secrets.
// Never echo secrets, provider responses, prompts or source content into logs.
export function backupConfigured(env){
 return env.AI_BACKUP_ENABLED==='true'&&env.SECONDARY_AI_PROVIDER==='xkiro'&&
  typeof env.SECONDARY_AI_API_KEY==='string'&&env.SECONDARY_AI_API_KEY.length>=20&&
  typeof env.SECONDARY_AI_MODEL==='string'&&/^[a-z0-9][a-z0-9./_:-]{1,120}$/i.test(env.SECONDARY_AI_MODEL);
}
export async function requestBackupJSON({fetchFn,env,signal,instruction,prompt,maxTokens=3200}){
 if(!backupConfigured(env))return null;
 const response=await fetchFn('https://api.xkiro.com/v1/chat/completions',{
  method:'POST',signal,
  headers:{Authorization:'Bearer '+env.SECONDARY_AI_API_KEY,'Content-Type':'application/json'},
  body:JSON.stringify({model:env.SECONDARY_AI_MODEL,temperature:0.55,max_tokens:Math.max(120,Math.min(3200,Number(maxTokens)||3200)),
   response_format:{type:'json_object'},
   messages:[{role:'system',content:instruction},{role:'user',content:JSON.stringify(prompt)}]})
 });
 if(!response.ok)return {ok:false,status:response.status};
 const payload=await response.json();
 if(payload?.choices?.[0]?.message?.refusal||payload?.choices?.[0]?.finish_reason==='content_filter')return {ok:false,refusal:true};
 if(payload?.choices?.[0]?.finish_reason&&payload.choices[0].finish_reason!=='stop')return {ok:false,status:502};
 const content=payload?.choices?.[0]?.message?.content;
 if(typeof content!=='string'||content.length>50000)return {ok:false,status:502};
 try{return {ok:true,data:JSON.parse(content)}}catch{return {ok:false,status:502}}
}

// Server-owned routing: callers cannot select providers or bypass budget/auth gates.
export const AI_TIMEOUTS=Object.freeze({text:6000,reading:12000,backup:25000});
export const AI_ROLE_TIMEOUTS=Object.freeze({text:10000,reading:18000,gemini:25000,complex:15000,heavyReading:25000});
export function aiTaskRole(route,body={}){
 if(['/ocr','/handwriting-recognize','/study-plan-review'].includes(route))return 'gemini';
 if(route==='/reading-next')return body.hsk>=5||['news','explainer'].includes(body.genre)?'gemini':'xkiro';
 if(route==='/dictionary-translate')return body.entries?.length>15?'gemini':'xkiro';
 const question=String(body.question||body.query||'');
 const complex=/phân tích|phan tich|chuyên sâu|chuyen sau|sắc thái|sac thai|ngữ dụng|ngu dung|nhiều nghĩa|nhieu nghia|ẩn dụ|an du|thành ngữ|thanh ngu|分析|语用|隐喻|细微|nuance|in.depth/i.test(question);
 if(complex||(['/ask','/lesson-ask'].includes(route)&&body.hsk>=5)||question.length>250||(body.history?.length||0)>=6)return 'gemini';
 if(route==='/translate'&&(String(body.text||'').length>180||body.hsk>=5))return 'gemini';
 return ['/translate','/dictionary-lookup','/dictionary-translate','/ask','/lesson-ask'].includes(route)?'xkiro':'gemini';
}
function aiSchemaMatches(value,s){
 if(!s)return !!value&&typeof value==='object';
 const type=String(s.type||'').toUpperCase();
 if(type==='OBJECT')return !!value&&typeof value==='object'&&!Array.isArray(value)&&(s.required||[]).every(k=>Object.hasOwn(value,k))&&Object.entries(s.properties||{}).every(([k,v])=>!Object.hasOwn(value,k)||aiSchemaMatches(value[k],v));
 if(type==='ARRAY')return Array.isArray(value)&&(s.minItems==null||value.length>=s.minItems)&&(s.maxItems==null||value.length<=s.maxItems)&&value.every(v=>aiSchemaMatches(v,s.items));
 if(type==='STRING')return typeof value==='string'&&(!s.enum||s.enum.includes(value));
 if(type==='INTEGER')return Number.isInteger(value)&&(s.minimum==null||value>=s.minimum)&&(s.maximum==null||value<=s.maximum);
 if(type==='NUMBER')return Number.isFinite(value);
 if(type==='BOOLEAN')return typeof value==='boolean';
 return true;
}
// At most two sequential provider attempts. Never retry refusals or caller cancellation.
export function createAiFailoverFetch(fetchFn,env,{
 timeoutMs=AI_TIMEOUTS.text,backupTimeoutMs=AI_TIMEOUTS.backup,
 preferSecondary=false,validateData=()=>true,onProvider=()=>{}
}={}){
 if(fetchFn.hskFailover)return fetchFn;
 const wrapped=async(url,init={})=>{
  if(!String(url).startsWith('https://generativelanguage.googleapis.com/v1beta/models/'))return fetchFn(url,init);
  if(!backupConfigured(env)){const response=await fetchFn(url,init);if(response.ok)onProvider('gemini');return response;}
  let body;try{body=JSON.parse(init.body)}catch{return fetchFn(url,init)}
  const contents=body.contents||[];
  if(contents.some(c=>c.parts?.some(p=>p.inlineData||p.fileData))){const response=await fetchFn(url,init);if(response.ok)onProvider('gemini');return response;}
  const parent=init.signal;
  const stage=async(fn,ms)=>{
   const controller=new AbortController(),abort=()=>controller.abort();
   if(parent?.aborted)throw new DOMException('Canceled','AbortError');
   parent?.addEventListener('abort',abort,{once:true});
   let timer,listener;
   try{return await Promise.race([
    Promise.resolve().then(()=>fn(controller.signal)),
    new Promise((_,reject)=>{listener=()=>reject(new DOMException('Canceled','AbortError'));controller.signal.addEventListener('abort',listener,{once:true});timer=setTimeout(()=>controller.abort(),ms);})
   ])}finally{clearTimeout(timer);controller.signal.removeEventListener('abort',listener);parent?.removeEventListener('abort',abort);}
  };
  const valid=data=>aiSchemaMatches(data,body.generationConfig?.responseSchema)&&validateData(data);
  const instruction=(body.systemInstruction?.parts||[]).map(p=>p.text||'').join('\n')+'\nReturn JSON only matching this response schema: '+JSON.stringify(body.generationConfig?.responseSchema||{});
  const gemini=async signal=>{
   const response=await fetchFn(url,{...init,signal});
   if(!response.ok)return {response,retry:[401,403,404,408,429,500,502,503,504].includes(response.status)};
   let json;try{json=await response.clone().json()}catch{return {response,retry:true}}
   const candidate=json.candidates?.[0];
   if(json.promptFeedback?.blockReason||candidate?.finishReason&&!['STOP','MAX_TOKENS'].includes(candidate.finishReason))return {response,retry:false};
   try{
    const text=(candidate?.content?.parts||[]).filter(p=>!p.thought&&typeof p.text==='string').map(p=>p.text).join('');
    return {response,retry:!valid(JSON.parse(text))||(candidate?.finishReason&&candidate.finishReason!=='STOP'),success:!candidate?.finishReason||candidate.finishReason==='STOP'};
   }catch{return {response,retry:true}}
  };
  const xkiro=async signal=>{
   const result=await requestBackupJSON({fetchFn,env,signal,instruction,prompt:{contents},maxTokens:body.generationConfig?.maxOutputTokens});
   if(result?.refusal)return {response:Response.json({error:{status:'SAFETY'}},{status:422}),retry:false};
   if(result?.ok&&valid(result.data))return {response:Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(result.data)}]}}]}),retry:false,success:true};
   return {response:Response.json({error:{status:'UNAVAILABLE'}},{status:result?.status===429?429:503}),retry:result?.status!==400};
  };
  let original;
  const order=preferSecondary?[['xkiro',xkiro,timeoutMs],['gemini',gemini,backupTimeoutMs]]:[['gemini',gemini,timeoutMs],['xkiro',xkiro,backupTimeoutMs]];
  for(let i=0;i<order.length;i++){
   const [provider,call,ms]=order[i];
   try{
    const result=await stage(call,ms);original=result.response;
    if(!result.retry){if(result.success)onProvider(provider);return result.response;}
   }catch(error){if(parent?.aborted)throw error;}
   if(parent?.aborted)throw new DOMException('Canceled','AbortError');
  }
  // Never let malformed final output escape as a successful response.
  return original&&!original.ok?original:Response.json({error:{status:'UNAVAILABLE'}},{status:503});
 };
 wrapped.hskFailover=true;return wrapped;
}
export function createAiRoleFetch(fetchFn,env,{route,body,validateData,onProvider}={}){
 const reading=route==='/reading-next',enabled=env.AI_TASK_ROUTING==='true',role=aiTaskRole(route,body);
 return createAiFailoverFetch(fetchFn,env,{
  preferSecondary:enabled&&role==='xkiro',
  timeoutMs:enabled&&role==='xkiro'?(reading?AI_ROLE_TIMEOUTS.reading:AI_ROLE_TIMEOUTS.text):enabled?(reading?AI_ROLE_TIMEOUTS.heavyReading:AI_ROLE_TIMEOUTS.complex):(reading?AI_TIMEOUTS.reading:AI_TIMEOUTS.text),
  backupTimeoutMs:enabled&&role==='xkiro'?AI_ROLE_TIMEOUTS.gemini:AI_TIMEOUTS.backup,
  validateData,onProvider
 });
}
