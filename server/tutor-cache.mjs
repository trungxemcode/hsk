import {TUTOR_CURRICULUM} from './tutor-curriculum.mjs';

export const QA_CACHE_REVISION='qa-20261021-v1';
const qaRoutes=new Set(['/ask','/lesson-ask','/dictionary-lookup','/dictionary-translate']);
export function qaStable(value){
 const sort=x=>Array.isArray(x)?x.map(sort):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,sort(x[k])])):x;
 return JSON.stringify(sort(value));
}
export async function qaHash(value){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(typeof value==='string'?value:qaStable(value)));return Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join('');}
export function qaNormalize(q){return String(q||'').normalize('NFC').replace(/\s+/gu,' ').trim().toLowerCase();}
function qaPublicQuestion(q){return /^(?:(?:phân biệt|so sánh) [\p{Script=Han}]{1,12} (?:và|với) [\p{Script=Han}]{1,12}|(?:cách dùng|giải thích|nghĩa của) (?:(?:chữ|từ|trợ từ|cấu trúc) )?[\p{Script=Han}]{1,12}(?: (?:ở cuối câu|sau động từ))?|[\p{Script=Han}]{1,12} (?:nghĩa là gì|dùng thế nào|dùng khi nào))[?.？。!！]*$/u.test(q);}
export function qaSensitive(x){return /(?:https?:\/\/|www\.|\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b|\d[\d\s()+.-]{6,}\d|AIza[\w-]{20,}|\b(?:password|mật khẩu|api[_ -]?key|bearer|token|địa chỉ nhà|số điện thoại)\b)/iu.test(x);}
export async function qaDescriptor(route,body,uid,env){
 if(env.QA_CACHE_ENABLED!=='true'||!qaRoutes.has(route)||!env.AI_CONTROL||!uid||body.history?.length)return null;
 if(route==='/lesson-ask'&&/^(placement-|open-dictionary)/.test(body.lesson?.id||''))return null;
 const context=route==='/lesson-ask'?body.lesson:route==='/ask'?body.translation:route==='/dictionary-translate'?body.entries:{context:body.context||'',word:body.word||null};
 const question=qaNormalize(body.question||body.query||(route==='/dictionary-translate'?'dịch nghĩa nhóm từ':''));
 // Context-bound followups without history are not independently reusable.
 if(!question||/^(giải thích lại|nói lại|tiếp tục|câu trên|đoạn trên|vì sao vậy|tại sao vậy)[?.!\s]*$/u.test(question)||qaSensitive(question))return null;
 let shared=false,trusted=false;
 if(route==='/lesson-ask'){
  const known=TUTOR_CURRICULUM.lessons[body.lesson?.id];
  trusted=!!known&&known.hsk===body.hsk&&known.hash===await qaHash(context);
  shared=trusted&&qaPublicQuestion(question);
 }else if(route==='/dictionary-lookup'&&!body.context){
  trusted=!body.word||TUTOR_CURRICULUM.dictionary[await qaHash(body.word)]===true;
  shared=/^[\p{Script=Han}]{1,20}[？?]?$/u.test(question)&&trusted;
 }
 if(!trusted&&qaSensitive(qaStable(context)))return null;
 const contextHash=await qaHash({route,hsk:body.hsk||null,context,curriculum:TUTOR_CURRICULUM.revision,prompt:QA_CACHE_REVISION,model:env.GEMINI_MODEL||'gemini-3.5-flash-lite',backup:[env.AI_BACKUP_ENABLED||'',env.AI_TASK_ROUTING||'',env.SECONDARY_AI_PROVIDER||'',env.SECONDARY_AI_MODEL||''],epoch:env.QA_CACHE_EPOCH||'1'});
 const owner=shared?'public':await qaHash('qa-owner:'+uid),scope=await qaHash({contextHash,owner}),key=await qaHash({scope,question});
 return {key,scope,route,shared,question,ttl:shared?604800:86400};
}
export async function qaCall(env,action,data={},timeout=1500){
 const obj=env.AI_CONTROL;if(!obj)throw Error('qa_binding_unavailable');
 const stub=obj.get(obj.idFromName('tutor-qa-cache-v1')),abort=new AbortController();
 let timer;const timeoutPromise=new Promise((_,reject)=>{timer=setTimeout(()=>{abort.abort();reject(Error('qa_timeout'))},timeout)});
 try{
  const response=await Promise.race([stub.fetch('https://internal.hsk/qa',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...data}),signal:abort.signal}),timeoutPromise]);
  if(!response.ok)throw Error('qa_storage_'+response.status);return await response.json();
 }finally{clearTimeout(timer);}
}
export async function qaBegin(route,body,uid,env,isAdmin=false){
 try{
  const d=await qaDescriptor(route,body,uid,env);if(!d)return {state:'bypass'};
  const lease=crypto.randomUUID(),r=await qaCall(env,'qa-begin',{key:d.key,scope:d.scope,lease});
  if(r.hit&&qaValidResponse(route,r.value))return {state:'hit',value:r.value,provider:r.provider||'',descriptor:d};
  if(r.hit)return {state:'bypass'};
  if(!r.acquired)return {state:isAdmin?'bypass':'busy'};
  return {state:'miss',descriptor:d,lease};
 }catch{return {state:'degraded'};}
}
export function qaValidResponse(route,value){
 if(!qaRoutes.has(route)||!value||typeof value!=='object'||qaSensitive(JSON.stringify(value)))return false;
 if(route==='/dictionary-translate')return value.language==='vi'&&Array.isArray(value.translations)&&value.translations.length>0&&value.translations.length<=40&&value.translations.every(t=>typeof t.id==='string'&&typeof t.meaning==='string'&&!!t.meaning.trim()&&t.meaning.length<=240);
 if(typeof value.answer!=='string'||!value.answer.trim()||value.answer.length>5000)return false;
 return route!=='/dictionary-lookup'||Array.isArray(value.terms)&&value.terms.length<=6&&value.terms.every(t=>t&&['han','pinyin','meaning'].every(k=>typeof t[k]==='string'&&!!t[k].trim()&&t[k].length<600)&&/\p{Script=Han}/u.test(t.han));
}
export async function qaRelease(env,session){if(session?.lease&&session.descriptor)await qaCall(env,'qa-unlock',{key:session.descriptor.key,lease:session.lease}).catch(()=>{});}
export async function qaFinish(env,session,value,provider,{rawFetch=fetch,ctx,signal}={}){
 if(session?.state!=='miss'||signal?.aborted||!qaValidResponse(session.descriptor.route,value))return;
 const d=session.descriptor;let result;
 try{result=await qaCall(env,'qa-put',{key:d.key,scope:d.scope,lease:session.lease,value,provider:['gemini','xkiro'].includes(provider)?provider:'',ttl:d.ttl,route:d.route});}catch{return;}
 // Semantic hits are observed only. This result can NEVER replace the newly generated answer.
 if(result.ok&&d.shared&&env.QA_SHADOW_MODE==='observe'){
  const task=qaShadowObserve(env,d,rawFetch).catch(()=>{});
  if(ctx?.waitUntil)ctx.waitUntil(task);else await task;
 }
}
export async function qaShadowObserve(env,d,rawFetch){
 const reserved=await qaCall(env,'qa-shadow-reserve');if(!reserved.allowed)return;
 const key=env.GEMINI_API_KEY_1||env.GEMINI_API_KEY;if(!key)return;
 const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),5000);
 try{
  const response=await rawFetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify({model:'models/gemini-embedding-2',content:{parts:[{text:d.question}]},outputDimensionality:768}),signal:abort.signal});
  if(!response.ok){await qaCall(env,'qa-shadow-error');return;}
  const result=await response.json(),vector=result.embedding?.values;
  if(!Array.isArray(vector)||vector.length!==768||!vector.every(Number.isFinite))return;
  const stats=await qaCall(env,'qa-shadow',{key:d.key,scope:d.scope,vector,model:'gemini-embedding-2/768'});
  console.info('hsk-qa-shadow',{mode:'observe',candidates:stats.candidates||0,bestSimilarity:stats.bestSimilarity??null,servedSemantic:false});
 }finally{clearTimeout(timer);}
}
export async function qaUsage(env,payload){
 if(env.QA_CACHE_ENABLED!=='true')return;
 const u=payload?.usageMetadata||{},safe={input:Number(u.promptTokenCount)||0,cachedInput:Number(u.cachedContentTokenCount)||0,output:Number(u.candidatesTokenCount)||0,thinking:Number(u.thoughtsTokenCount)||0};
 console.info('hsk-qa-tokens',safe);
 // No padding, PDF upload, paid TTL cache or generation-setting changes.
}
