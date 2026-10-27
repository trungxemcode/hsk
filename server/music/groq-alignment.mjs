// Owner-only, one-off Groq alignment. Published lyrics are never overwritten here.
import Lyrics from '../../src/modules/music/music-lyrics-core.js';
import Pinyin from '../../vendor/pinyin-pro/pinyin-pro.js';
import {identity} from './worker.mjs';
import {prepareBatchReference} from './batch-reference.mjs';
const MAX_AUDIO=12*1024*1024,MODEL='whisper-large-v3';
const fail=(message,status)=>Object.assign(Error(message),{status});
const letters=s=>Array.from(s).filter(c=>!/[\s\p{P}\p{S}]/u.test(c));
const sound=c=>(Pinyin.polyphonic(c,{toneType:'none',type:'array'})[0]?.[0]||c).toLowerCase();
export function matchGroq(reference,data,duration){
 const source=reference.untimed?{cues:reference.cues.map(c=>({...c}))}:Lyrics.validate(reference),units=[],sounds=new Map();source.cues=source.cues.filter(c=>letters(c.text).length);const keyOf=c=>{if(!sounds.has(c))sounds.set(c,sound(c));return sounds.get(c);};
 if(!Array.isArray(data.words)||!data.words.length||data.words.length>4000)throw fail('Groq chưa trả mốc từng từ.',502);
 let previous=-1,rejected=0;
 for(const w of [...data.words].sort((a,b)=>a.start-b.start)){
  if(typeof w.word!=='string'){rejected++;continue;}const chars=letters(w.word);if(!chars.length)continue;
  if(!Number.isFinite(w.start)||!Number.isFinite(w.end)||w.start<0||w.end<=w.start||w.end>duration+.5||w.start<previous){rejected++;continue;}
  previous=w.start;for(const char of chars)units.push({text:char,key:keyOf(char),start:w.start,end:w.end,group:chars.length});
 }
 const total=source.cues.reduce((n,c)=>n+letters(c.text).length,0);
 if(!total)throw fail('Script chưa có lời để căn.',400);
 if(total>1200||units.length>2400)throw fail('Lời quá dài; hãy xử lý bài ngắn hơn.',413);
 const referenceChars=source.cues.flatMap(c=>letters(c.text)),keys=referenceChars.map(keyOf),width=units.length+1;
 if((referenceChars.length+1)*width>2500000)throw fail('Lời nhận dạng quá dài; cần chia đoạn.',413);
 const table=new Uint16Array((referenceChars.length+1)*width);
 for(let i=referenceChars.length-1;i>=0;i--)for(let j=units.length-1;j>=0;j--){const same=referenceChars[i]===units[j].text||keys[i]===units[j].key;table[i*width+j]=same?table[(i+1)*width+j+1]+1:Math.max(table[(i+1)*width+j],table[i*width+j+1]);}
 const mapping=new Array(referenceChars.length).fill(null);let ri=0,ui=0;
 while(ri<referenceChars.length&&ui<units.length){if(referenceChars[ri]===units[ui].text||keys[ri]===units[ui].key){mapping[ri++]=units[ui++];}else if(table[(ri+1)*width+ui]>=table[ri*width+ui+1])ri++;else ui++;}
 let substitutions=0;
 // Correct short one-to-one recognition substitutions between matched anchors.
 // Reuse observed syllable times verbatim; never create/divide a timestamp.
 for(let i=0;i<mapping.length;){if(mapping[i]){i++;continue;}const begin=i;while(i<mapping.length&&!mapping[i])i++;const count=i-begin;if(!begin||i>=mapping.length||count>3)continue;const left=units.indexOf(mapping[begin-1]),right=units.indexOf(mapping[i]),gap=units.slice(left+1,right);if(gap.length!==count||gap.some(u=>u.group!==1)||gap[0].start<mapping[begin-1].end||gap.at(-1).end>mapping[i].start)continue;for(let j=0;j<count;j++){mapping[begin+j]={...gap[j],substitution:true};substitutions++;}}
 let cursor=0,matched=0,precise=0,groups=0;
 const missingCues=[];
 const cues=source.cues.map((cue,cueIndex)=>{
  const found=[];for(const char of letters(cue.text)){
   const unit=mapping[cursor++];if(!unit){found.push(null);continue;}found.push({...unit,text:char});matched++;if(unit.group===1)precise++;else groups++;

  }
  const absent=letters(cue.text).filter((_,i)=>!found[i]);if(absent.length)missingCues.push({cue:cueIndex,characters:absent.join('')});
  const observed=found.filter(Boolean);if(!observed.length&&reference.untimed)throw fail('Groq chưa tìm được mốc cho dòng '+(cueIndex+1)+'.',422);
  if(!observed.length)return {...cue,uncertain:true,reason:'Chưa có mốc được nhận dạng; giữ mốc gốc.'};
  const row={...cue,start:observed[0].start,end:observed.at(-1).end,uncertain:true,reason:absent.length?'Chưa có mốc cho '+absent.join(' ')+'; câu này chỉ theo dòng.':observed.some(x=>x.group>1)?'Groq trả mốc theo cụm; chưa có mốc riêng cho mọi chữ.':'Mốc lấy từ Groq; cần nghe kiểm tra.'};
  delete row.characters;
  if(!absent.length&&found.every(x=>x.group===1))row.characters=found.map(({text,start,end},i)=>({text,start,end:Math.min(end,found[i+1]?.start??end)}));
  return row;
 });
 const diagnostics={total,matched,precise,grouped:groups,missing:total-matched,rejectedWordTimes:rejected,substitutions,missingCues};
 // Incomplete recognition can shift whole verses. Do not mix guessed original times
 // with new times or expose a partially aligned transcript as a finished karaoke.
 let value={version:1,cues:source.cues.map(c=>({...c,uncertain:true,reason:'Groq chưa khớp đủ lời; chưa thay mốc gốc.'}))};
 if(matched){try{value=Lyrics.validate({cues});value.cues=value.cues.map((c,i)=>({...c,uncertain:true,reason:cues[i].reason}));}catch(error){if(reference.untimed)throw fail('Mốc câu chưa hợp lệ; cần kiểm tra lại.',422);diagnostics.invalidTimeline=true;diagnostics.timelineError=error.message;diagnostics.overlaps=cues.flatMap((c,i)=>{const out=[];if(i&&c.start<cues[i-1].end)out.push({cue:i,previousEnd:cues[i-1].end,start:c.start});for(let j=1;j<(c.characters?.length||0);j++)if(c.characters[j-1].end>c.characters[j].start)out.push({cue:i,char:j,end:c.characters[j-1].end,start:c.characters[j].start});return out;});}}
 diagnostics.renderableCharacters=value.cues.reduce((n,c)=>n+(c.characters?.length||0),0);
 return {...value,status:'draft',reviewed:false,method:'groq-word-timestamps',model:MODEL,diagnostics};
}
export async function bounded(body,max){const reader=body?.getReader();if(!reader)throw fail('Không đọc được dữ liệu.',502);let size=0;const chunks=[];while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw fail('Dữ liệu vượt giới hạn.',413);}chunks.push(value);}const all=new Uint8Array(size);let offset=0;for(const c of chunks){all.set(c,offset);offset+=c.length;}return all;}
export async function groqRoute(request,env,json,fetchFn=fetch){
 const route=new URL(request.url).pathname.match(/^\/api\/admin\/tracks\/([a-f0-9]{64}\.(?:mp3|m4a))\/align$/);if(!route)return null;
 if(request.method!=='POST')return json({error:'Chỉ hỗ trợ POST.'},405);
 const actor=await identity(request,env,fetchFn);if(!actor.admin)return json({error:'Chỉ chủ kho được căn lời.'},403);
 let input;try{input=JSON.parse(new TextDecoder().decode(await bounded(request.body,1024)));}catch(e){if(e.status)throw e;throw fail('Yêu cầu chưa hợp lệ.',400);}if(!input||typeof input!=='object'||Array.isArray(input))throw fail('Yêu cầu chưa hợp lệ.',400);
 if(Object.keys(input).some(k=>k!=='duration')||!Number.isFinite(input.duration)||input.duration<=0||input.duration>480)return json({error:'Chỉ hỗ trợ bài không quá 8 phút.'},400);
 return alignGroq(route[1],input.duration,env,json,fetchFn,request.signal);
}
export async function alignGroq(id,duration,env,json,fetchFn=fetch,signal=new AbortController().signal){
 const input={duration};
 const keys=[...new Set([env.GROQ_API_KEY,env.GROQ_API_KEY_2,env.GROQ_API_KEY_3].filter(Boolean))];
 if(env.MUSIC_GROQ_ENABLED!=='true'||!keys.length)return json({error:'Chưa cấu hình Groq trên Worker kho nhạc.'},503);
 const bucket=env.MUSIC_BUCKET;
 const old=await bucket.head('groq-locks/global');
 if(old&&Date.now()-Number(old.customMetadata?.createdAt||Date.now())<600000)return json({error:'Đang xử lý bài khác; đã giới hạn một bài mỗi lần.'},409);
 const lock=await bucket.put('groq-locks/global','busy',{onlyIf:old?{etagMatches:old.etag}:{etagDoesNotMatch:'*'},customMetadata:{createdAt:String(Date.now())}});
 if(!lock)return json({error:'Đang xử lý bài khác.'},409);
 try{return await processGroq(id,input,env,json,fetchFn,signal);}finally{await bucket.delete('groq-locks/global');}
}
async function processGroq(id,input,env,json,fetchFn,signal){
 const keys=[...new Set([env.GROQ_API_KEY,env.GROQ_API_KEY_2,env.GROQ_API_KEY_3].filter(Boolean))];
 const bucket=env.MUSIC_BUCKET,audioKey='audio/'+id,lyricsKey='lyrics/'+id+'.json',draftKey='lyrics-drafts/'+id+'/groq.json';
 const head=await bucket.head(audioKey);let sourceKey=lyricsKey,sourceHead=await bucket.head(sourceKey);if(!sourceHead){sourceKey='lyrics-sources/'+id+'.json';sourceHead=await bucket.head(sourceKey);}const batch=sourceKey!==lyricsKey;
 if(!head||head.customMetadata?.published!=='true'||!sourceHead)return json({error:'Cần bài đã xuất bản và script chuẩn trong kho.'},404);
 if(head.size>MAX_AUDIO)return json({error:'Groq thử nghiệm hỗ trợ audio tối đa 12 MB.'},413);
 const cached=await bucket.head(draftKey);
 if(!batch&&cached?.customMetadata?.sourceEtag===sourceHead.httpEtag&&cached.customMetadata.audioEtag===head.httpEtag&&cached.customMetadata.duration===String(input.duration)&&cached.customMetadata.model===MODEL&&cached.customMetadata.matcher==='lcs-v3'){const object=await bucket.get(draftKey);return json({...JSON.parse(new TextDecoder().decode(await bounded(object.body,Lyrics.MAX_BYTES))),saved:true,cached:true});}
 const lockKey='groq-locks/'+id,oldLock=await bucket.head(lockKey);
 if(oldLock&&Date.now()-Number(oldLock.customMetadata?.createdAt||Date.now())<600000)return json({error:'Bài này đang được căn lời. Chờ xử lý xong.'},409);
 const lock=await bucket.put(lockKey,'busy',{onlyIf:oldLock?{etagMatches:oldLock.etag}:{etagDoesNotMatch:'*'},customMetadata:{createdAt:String(Date.now())}});
 if(!lock)return json({error:'Bài này đang được xử lý.'},409);
 const controller=new AbortController(),cancel=()=>controller.abort();signal.addEventListener('abort',cancel,{once:true});const timer=setTimeout(cancel,150000);
 try{
  const source=await bucket.get(sourceKey),sourceText=new TextDecoder().decode(await bounded(source.body,Lyrics.MAX_BYTES));let reference=batch?JSON.parse(sourceText):Lyrics.parse(sourceText,'lyrics.json');const batchSource=batch?reference:null;
  let data;const rawKey='lyrics-drafts/'+id+'/groq-raw.json',rawHead=await bucket.head(rawKey);
  if(rawHead?.customMetadata?.sourceEtag===sourceHead.httpEtag&&rawHead.customMetadata.audioEtag===head.httpEtag){const raw=await bucket.get(rawKey),prior=JSON.parse(new TextDecoder().decode(await bounded(raw.body,1024*1024)));if(prior.model===MODEL)data=prior;}
  if(!data){
  const object=await bucket.get(audioKey),bytes=await bounded(object.body,MAX_AUDIO),form=new FormData();
  form.set('file',new Blob([bytes],{type:id.endsWith('.m4a')?'audio/mp4':'audio/mpeg'}),id);form.set('model',MODEL);form.set('language','zh');form.set('response_format','verbose_json');form.append('timestamp_granularities[]','word');form.append('timestamp_granularities[]','segment');form.set('temperature','0');
  // Context only. Supplying lyrics is not forced phoneme alignment.
  form.set('prompt',(batch?reference.kind==='hanzi'?reference.lines.join(' '):reference.title:reference.cues.map(c=>c.text).join(' ')).slice(0,160));
  let response;for(const key of keys){response=await fetchFn('https://api.groq.com/openai/v1/audio/transcriptions',{method:'POST',headers:{Authorization:'Bearer '+key},body:form,signal:controller.signal});if(![401,403].includes(response.status))break;await response.body?.cancel();}
  if(!response.ok){const retryAfter=response.headers.get('Retry-After');return json({error:response.status===429?'Groq đạt hạn mức; chờ rồi thử lại.':'Groq chưa xử lý được audio.',...(retryAfter?{retryAfter}:{} )},response.status===429?429:502);}
  data=JSON.parse(new TextDecoder().decode(await bounded(response.body,1024*1024)));
  }
  // Cache recognition before restoration so retries do not transcribe the same audio.
  await bucket.put('lyrics-drafts/'+id+'/groq-raw.json',JSON.stringify({words:data.words,segments:data.segments,duration:data.duration,model:MODEL}),{httpMetadata:{contentType:'application/json; charset=utf-8'},customMetadata:{sourceEtag:sourceHead.httpEtag,audioEtag:head.httpEtag}});
  if(batch)reference=await prepareBatchReference(reference,data,keys,fetchFn,controller.signal);
  const value=matchGroq(reference,data,input.duration);
  if(batch){value.referenceRestored=reference.restored;value.generatedFromAudio=reference.generatedFromAudio===true;value.batchId=batchSource.batchId;value.referenceSource=batchSource.sourceUrl;}
  if(controller.signal.aborted)throw fail('Đã hủy hoặc quá thời gian.',408);
  const nowAudio=await bucket.head(audioKey),nowSource=await bucket.head(sourceKey);
  if(!nowAudio||nowAudio.customMetadata?.published!=='true'||nowAudio.httpEtag!==head.httpEtag||nowSource?.httpEtag!==sourceHead.httpEtag)throw fail('Audio hoặc script đã đổi; chưa lưu kết quả cũ.',409);

  await bucket.put(draftKey,JSON.stringify(value),{httpMetadata:{contentType:'application/json; charset=utf-8',cacheControl:'no-store'},customMetadata:{sourceEtag:sourceHead.httpEtag,audioEtag:head.httpEtag,duration:String(input.duration),model:MODEL,matcher:'lcs-v3'}});
  if(batch&&batchSource.autoPublish&&!value.diagnostics.invalidTimeline&&value.diagnostics.matched/value.diagnostics.total>=.94){const publicValue={...value,reviewed:false,publication:'automatic-draft'};await bucket.put(lyricsKey,JSON.stringify(publicValue),{onlyIf:{etagDoesNotMatch:'*'},httpMetadata:{contentType:'application/json; charset=utf-8',cacheControl:'public, max-age=60'},customMetadata:{reviewed:'false',batchId:batchSource.batchId}});}
  return json({...value,saved:true});
 }catch(e){if(e.name==='AbortError')throw fail('Đã hủy hoặc quá thời gian.',408);throw e;}finally{clearTimeout(timer);signal.removeEventListener('abort',cancel);await bucket.delete(lockKey);}
}
