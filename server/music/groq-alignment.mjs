// Owner-only, one-off Groq alignment. Published lyrics are never overwritten here.
import Lyrics from '../../src/modules/music/music-lyrics-core.js';
import Pinyin from '../../vendor/pinyin-pro/pinyin-pro.js';
import {identity} from './worker.mjs';
const MAX_AUDIO=6*1024*1024,MODEL='whisper-large-v3-turbo';
const fail=(message,status)=>Object.assign(Error(message),{status});
const letters=s=>Array.from(s).filter(c=>!/[\s\p{P}\p{S}]/u.test(c));
const sound=c=>(Pinyin.polyphonic(c,{toneType:'none',type:'array'})[0]?.[0]||c).toLowerCase();
export function matchGroq(reference,data,duration){
 const source=Lyrics.validate(reference),units=[],sounds=new Map();source.cues=source.cues.filter(c=>letters(c.text).length);const keyOf=c=>{if(!sounds.has(c))sounds.set(c,sound(c));return sounds.get(c);};
 if(!Array.isArray(data.words)||!data.words.length||data.words.length>4000)throw fail('Groq chưa trả mốc từng từ.',502);
 let previous=-1;
 for(const w of data.words){
  if(typeof w.word!=='string'||!Number.isFinite(w.start)||!Number.isFinite(w.end)||w.start<0||w.end<=w.start||w.end>duration+.5||w.start<previous)throw fail('Mốc Groq không hợp lệ; chưa lưu.',502);
  previous=w.start;const chars=letters(w.word);for(const char of chars)units.push({text:char,key:keyOf(char),start:w.start,end:w.end,group:chars.length});
 }
 const total=source.cues.reduce((n,c)=>n+letters(c.text).length,0);
 if(!total)throw fail('Script chưa có lời để căn.',400);
 if(total>1200||units.length>2400)throw fail('Lời quá dài; hãy xử lý bài ngắn hơn.',413);
 let cursor=0,matched=0,precise=0,groups=0;
 const cues=source.cues.map(cue=>{
  const found=[];for(const char of letters(cue.text)){
   const key=keyOf(char);let index=-1;
   // Bounded monotonic matching, never stretch timestamps across missing words.
   for(let i=cursor;i<Math.min(units.length,cursor+20);i++)if(units[i].text===char||units[i].key===key){index=i;break;}
   if(index<0){found.push(null);continue;}const unit=units[index];cursor=index+1;found.push({...unit,text:char});matched++;if(unit.group===1)precise++;else groups++;
  }
  if(!found.length||found.some(x=>!x))return {...cue,uncertain:true,reason:'Chưa khớp đủ lời; giữ mốc câu gốc, cần nghe đối chiếu.'};
  const row={...cue,start:found[0].start,end:found.at(-1).end,uncertain:true,reason:found.some(x=>x.group>1)?'Groq trả mốc theo cụm; chưa có mốc riêng cho mọi chữ.':'Mốc lấy từ Groq; cần nghe kiểm tra.'};
  delete row.characters;
  if(found.every(x=>x.group===1))row.characters=found.map(({text,start,end})=>({text,start,end}));
  return row;
 });
 const diagnostics={total,matched,precise,grouped:groups,missing:total-matched};
 // Incomplete recognition can shift whole verses. Do not mix guessed original times
 // with new times or expose a partially aligned transcript as a finished karaoke.
 let value={version:1,cues:source.cues.map(c=>({...c,uncertain:true,reason:'Groq chưa khớp đủ lời; chưa thay mốc gốc.'}))};
 if(matched===total){try{value=Lyrics.validate({cues});value.cues=value.cues.map((c,i)=>({...c,uncertain:true,reason:cues[i].reason}));}catch{diagnostics.invalidTimeline=true;}}
 return {...value,status:'draft',reviewed:false,method:'groq-word-timestamps',model:MODEL,diagnostics};
}
async function bounded(body,max){const reader=body?.getReader();if(!reader)throw fail('Không đọc được dữ liệu.',502);let size=0;const chunks=[];while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw fail('Dữ liệu vượt giới hạn.',413);}chunks.push(value);}const all=new Uint8Array(size);let offset=0;for(const c of chunks){all.set(c,offset);offset+=c.length;}return all;}
export async function groqRoute(request,env,json,fetchFn=fetch){
 const route=new URL(request.url).pathname.match(/^\/api\/admin\/tracks\/([a-f0-9]{64}\.(?:mp3|m4a))\/align$/);if(!route)return null;
 if(request.method!=='POST')return json({error:'Chỉ hỗ trợ POST.'},405);
 const actor=await identity(request,env,fetchFn);if(!actor.admin)return json({error:'Chỉ chủ kho được căn lời.'},403);
 const keys=[...new Set([env.GROQ_API_KEY,env.GROQ_API_KEY_2,env.GROQ_API_KEY_3].filter(Boolean))];
 if(env.MUSIC_GROQ_ENABLED!=='true'||!keys.length)return json({error:'Chưa cấu hình Groq trên Worker kho nhạc.'},503);
 let input;try{input=JSON.parse(new TextDecoder().decode(await bounded(request.body,1024)));}catch(e){if(e.status)throw e;throw fail('Yêu cầu chưa hợp lệ.',400);}if(!input||typeof input!=='object'||Array.isArray(input))throw fail('Yêu cầu chưa hợp lệ.',400);
 if(Object.keys(input).some(k=>k!=='duration')||!Number.isFinite(input.duration)||input.duration<=0||input.duration>480)return json({error:'Chỉ hỗ trợ bài không quá 8 phút.'},400);
 const id=route[1],bucket=env.MUSIC_BUCKET,audioKey='audio/'+id,lyricsKey='lyrics/'+id+'.json',draftKey='lyrics-drafts/'+id+'/groq.json';
 const head=await bucket.head(audioKey),sourceHead=await bucket.head(lyricsKey);
 if(!head||head.customMetadata?.published!=='true'||!sourceHead)return json({error:'Cần bài đã xuất bản và script chuẩn trong kho.'},404);
 if(head.size>MAX_AUDIO)return json({error:'Groq thử nghiệm hỗ trợ audio tối đa 6 MB.'},413);
 const cached=await bucket.head(draftKey);
 if(cached?.customMetadata?.sourceEtag===sourceHead.httpEtag&&cached.customMetadata.audioEtag===head.httpEtag&&cached.customMetadata.duration===String(input.duration)){const object=await bucket.get(draftKey);return json({...JSON.parse(new TextDecoder().decode(await bounded(object.body,Lyrics.MAX_BYTES))),saved:true,cached:true});}
 const lockKey='groq-locks/'+id,oldLock=await bucket.head(lockKey);
 if(oldLock&&Date.now()-Number(oldLock.customMetadata?.createdAt||Date.now())<600000)return json({error:'Bài này đang được căn lời. Chờ xử lý xong.'},409);
 const lock=await bucket.put(lockKey,'busy',{onlyIf:oldLock?{etagMatches:oldLock.etag}:{etagDoesNotMatch:'*'},customMetadata:{createdAt:String(Date.now())}});
 if(!lock)return json({error:'Bài này đang được xử lý.'},409);
 const controller=new AbortController(),cancel=()=>controller.abort();request.signal.addEventListener('abort',cancel,{once:true});const timer=setTimeout(cancel,150000);
 try{
  const source=await bucket.get(lyricsKey),reference=Lyrics.parse(new TextDecoder().decode(await bounded(source.body,Lyrics.MAX_BYTES)),'lyrics.json');
  const object=await bucket.get(audioKey),bytes=await bounded(object.body,MAX_AUDIO),form=new FormData();
  form.set('file',new Blob([bytes],{type:id.endsWith('.m4a')?'audio/mp4':'audio/mpeg'}),id);form.set('model',MODEL);form.set('language','zh');form.set('response_format','verbose_json');form.append('timestamp_granularities[]','word');form.append('timestamp_granularities[]','segment');form.set('temperature','0');
  // Context only. Supplying lyrics is not forced phoneme alignment.
  form.set('prompt',reference.cues.map(c=>c.text).join(' ').slice(0,160));
  let response;for(const key of keys){response=await fetchFn('https://api.groq.com/openai/v1/audio/transcriptions',{method:'POST',headers:{Authorization:'Bearer '+key},body:form,signal:controller.signal});if(![401,403].includes(response.status))break;await response.body?.cancel();}
  if(!response.ok){const retryAfter=response.headers.get('Retry-After');return json({error:response.status===429?'Groq đạt hạn mức; chờ rồi thử lại.':'Groq chưa xử lý được audio.',...(retryAfter?{retryAfter}:{} )},response.status===429?429:502);}
  const data=JSON.parse(new TextDecoder().decode(await bounded(response.body,1024*1024))),value=matchGroq(reference,data,input.duration);
  if(controller.signal.aborted)throw fail('Đã hủy hoặc quá thời gian.',408);
  const nowAudio=await bucket.head(audioKey),nowSource=await bucket.head(lyricsKey);
  if(!nowAudio||nowAudio.customMetadata?.published!=='true'||nowAudio.httpEtag!==head.httpEtag||nowSource?.httpEtag!==sourceHead.httpEtag)throw fail('Audio hoặc script đã đổi; chưa lưu kết quả cũ.',409);
  await bucket.put(draftKey,JSON.stringify(value),{httpMetadata:{contentType:'application/json; charset=utf-8',cacheControl:'no-store'},customMetadata:{sourceEtag:sourceHead.httpEtag,audioEtag:head.httpEtag,duration:String(input.duration)}});
  return json({...value,saved:true});
 }catch(e){if(e.name==='AbortError')throw fail('Đã hủy hoặc quá thời gian.',408);throw e;}finally{clearTimeout(timer);request.signal.removeEventListener('abort',cancel);await bucket.delete(lockKey);}
}
