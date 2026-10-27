import {runStagedImport} from './staged-imports.mjs';
import {stageImportReference} from './batch-reference.mjs';
// Owner-uploaded R2 audio library. Independent of AI, voice and study services.
import Lyrics from '../../src/modules/music/music-lyrics-core.js';
import {groqQueueRoute,enqueueGroqJob,runGroqQueue} from './groq-queue.mjs';
import {groqRoute} from './groq-alignment.mjs';
import {searchRoute} from './youtube-search.mjs';
import {importRoute,writeJob} from './import-jobs.mjs';
import {identity,byteRange} from './worker.mjs';
const keyPattern=/^[a-f0-9]{64}\.(mp3|m4a)$/;
const MAX=50*1024*1024;
function titleHeader(r,name,max){let s;try{s=decodeURIComponent(r.headers.get(name)||'');}catch{throw Object.assign(Error('Thông tin bài hát chưa hợp lệ.'),{status:400});}return s.trim().slice(0,max);}
export async function handleCloudMusic(request,env,ctx={},deps={}){
 const u=new URL(request.url),origin=request.headers.get('Origin'),allowed=(env.ALLOWED_ORIGINS||'https://trungxemcode.github.io').split(',').map(s=>s.trim());
 const cors={'Vary':'Origin','Access-Control-Allow-Methods':'GET, HEAD, POST, OPTIONS','Access-Control-Allow-Headers':'Authorization, Content-Type, Range, If-Range, X-Music-Title, X-Music-Artist','Access-Control-Expose-Headers':'Content-Length, Content-Range, Accept-Ranges, ETag','X-Content-Type-Options':'nosniff'};
 if(origin&&!allowed.includes(origin))return new Response('Origin not allowed',{status:403});if(origin)cors['Access-Control-Allow-Origin']=origin;
 const json=(body,status=200)=>Response.json(body,{status,headers:{...cors,'Cache-Control':'no-store'}});
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 try{
  const search=await searchRoute(request,json,deps.fetchFn||fetch);if(search)return search;
  if(!env.MUSIC_BUCKET)return json({error:'Kho R2 chưa được kết nối.'},503);
  const queued=await groqQueueRoute(request,env,json,deps.fetchFn||fetch);if(queued)return queued;
  const alignment=await groqRoute(request,env,json,deps.fetchFn||fetch);if(alignment)return alignment;
  const imported=await importRoute(request,env,json,deps.fetchFn||fetch);if(imported instanceof Response)return imported;
  if(u.pathname==='/api/library'&&request.method==='GET'){
   const cursor=u.searchParams.get('cursor')||undefined;if(cursor&&cursor.length>2048)return json({error:'Trang chưa hợp lệ.'},400);
   const page=await env.MUSIC_BUCKET.list({prefix:'audio/',limit:100,include:['customMetadata'],cursor});
   const tracks=page.objects.filter(o=>keyPattern.test(o.key.slice(6))&&o.customMetadata?.published==='true').map(o=>({id:o.key.slice(6),title:o.customMetadata.title||'Bài hát',artist:o.customMetadata.artist||'HSK Music',composer:o.customMetadata.composer||'',sourceUrl:o.customMetadata.sourceUrl||'',bytes:o.size,url:u.origin+'/audio/'+o.key.slice(6),addedAt:o.uploaded?.toISOString?.()||''}));
   await Promise.all(tracks.map(async track=>{const lyrics=await env.MUSIC_BUCKET.head('lyrics/'+track.id+'.json');track.hasLyrics=Boolean(lyrics);track.lyricsRevision=lyrics?.httpEtag||'';}));
   tracks.sort((a,b)=>b.addedAt.localeCompare(a.addedAt));return json({tracks,cursor:page.truncated?page.cursor:null});
  }
  const lyricsRoute=u.pathname.match(/^\/api\/(admin\/)?tracks\/([a-f0-9]{64}\.(?:mp3|m4a))\/lyrics$/);
  if(lyricsRoute){
   const admin=Boolean(lyricsRoute[1]),id=lyricsRoute[2],key='lyrics/'+id+'.json';
   if(admin){if(request.method!=='POST')return json({error:'Không có API này.'},405);const actor=await identity(request,env,deps.fetchFn||fetch);if(!actor.admin)return json({error:'Chỉ chủ kho được cập nhật script.'},403);}
   else if(request.method!=='GET')return json({error:'Không có API này.'},405);
   const track=await env.MUSIC_BUCKET.head('audio/'+id);if(!track||track.customMetadata?.published!=='true')return json({error:'Bài hát không còn trong kho.'},404);
   if(admin){
    const declared=Number(request.headers.get('Content-Length'));if(declared>Lyrics.MAX_BYTES)return json({error:'Script tối đa 500 KB.'},413);
    // Bound actual bytes even for chunked requests without Content-Length.
    const reader=request.body?.getReader();if(!reader)return json({error:'Chưa có script.'},400);let size=0;const chunks=[];
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>Lyrics.MAX_BYTES){await reader.cancel();return json({error:'Script tối đa 500 KB.'},413);}chunks.push(value);}
    const bytes=new Uint8Array(size);let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.length;}
    let value;try{const input=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));value=Lyrics.validate(input);if(input.reviewed===true&&input.status==='reviewed')value={...value,status:'reviewed',reviewed:true};}catch(error){return json({error:error.message||'Script chưa hợp lệ.'},400);}
    const revision=crypto.randomUUID();await env.MUSIC_BUCKET.put(key,JSON.stringify(value),{httpMetadata:{contentType:'application/json; charset=utf-8',cacheControl:'no-store'},customMetadata:{revision}});
    if(value.reviewed===true)await env.MUSIC_BUCKET.delete('groq-pending/'+id+'.json');
    let alignmentQueued=false,alignmentError;
    if(env.MUSIC_GROQ_ENABLED==='true'&&value.reviewed!==true&&!value.cues.some(c=>c.characters?.length)){try{const duration=value.cues.some(c=>c.end===null)?480:Math.max(...value.cues.map(c=>c.end));const q=await enqueueGroqJob(id,duration,env);alignmentQueued=q.queued;alignmentError=q.error;}catch{alignmentError='Script đã lưu; chưa xếp được hàng Groq.';}}
    return json({saved:true,id,revision,cues:value.cues.length,alignmentQueued,...(alignmentError?{alignmentError}:{})});
   }
   const object=await env.MUSIC_BUCKET.get(key);if(!object)return json({error:'Bài này chưa có script.'},404);
   return new Response(object.body,{headers:{...cors,'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
  }
  if(u.pathname.startsWith('/api/admin/tracks/')&&request.method==='POST'){
   const actor=await identity(request,env,deps.fetchFn||fetch);if(!actor.admin)return json({error:'Chỉ chủ kho được xóa nhạc.'},403);
   const match=u.pathname.match(/^\/api\/admin\/tracks\/([a-f0-9]{64}\.(?:mp3|m4a))\/delete$/);if(!match)return json({error:'Bài hát chưa hợp lệ.'},400);
   const id=match[1],key='audio/'+id,head=await env.MUSIC_BUCKET.head(key);if(!head||head.customMetadata?.published!=='true')return json({error:'Bài hát không còn trong kho.'},404);
   await env.MUSIC_BUCKET.delete(key);await env.MUSIC_BUCKET.delete('lyrics/'+id+'.json');await env.MUSIC_BUCKET.delete('lyrics-drafts/'+id+'/groq.json');await env.MUSIC_BUCKET.delete('lyrics-drafts/'+id+'/groq-raw.json');await env.MUSIC_BUCKET.delete('lyrics-drafts/'+id+'/groq-reference.json');await env.MUSIC_BUCKET.delete('lyrics-sources/'+id+'.json');await env.MUSIC_BUCKET.delete('audio-chunks/'+id+'.bin');await env.MUSIC_BUCKET.delete('groq-pending/'+id+'.json');await env.MUSIC_BUCKET.delete('groq-jobs/'+id+'.json');return json({deleted:true,id});
  }
  if((u.pathname==='/api/admin/upload'||imported?.job)&&request.method==='POST'){
   const actor=imported?.job?{admin:true}:await identity(request,env,deps.fetchFn||fetch);if(!actor.admin)return json({error:'Chỉ chủ kho được tải nhạc lên.'},403);
   const size=Number(request.headers.get('Content-Length'));if(!Number.isSafeInteger(size)||size<=0||size>MAX)return json({error:'Chọn file MP3/M4A tối đa 50 MB.'},413);
   const title=titleHeader(request,'X-Music-Title',120),artist=titleHeader(request,'X-Music-Artist',80)||'HSK Music';if(!title)return json({error:'Nhập tên bài hát.'},400);
   const composer=titleHeader(request,'X-Music-Composer',120);const sourceUrl=imported?.job?.url||'';
   const bytes=await request.arrayBuffer();if(bytes.byteLength!==size||bytes.byteLength>MAX)return json({error:'File chưa tải đủ hoặc quá lớn.'},413);
   const h=new Uint8Array(bytes,0,Math.min(bytes.byteLength,64));
   const m4a=String.fromCharCode(...h).includes('ftyp'),mp3=(h[0]===73&&h[1]===68&&h[2]===51)||(h[0]===255&&(h[1]&0xe0)===0xe0);
   if(!m4a&&!mp3)return json({error:'File không phải MP3/M4A hợp lệ.'},400);
   const ext=m4a?'m4a':'mp3',hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join(''),id=hash+'.'+ext;
   await env.MUSIC_BUCKET.put('audio/'+id,bytes,{httpMetadata:{contentType:m4a?'audio/mp4':'audio/mpeg',cacheControl:'public, max-age=86400'},customMetadata:{title,artist,composer,sourceUrl,published:'true'}});
   if(imported?.job){try{imported.job.alignment=await stageImportReference(env,imported.job,id,enqueueGroqJob);}catch{imported.job.alignment={queued:false,error:'Chưa xếp được lời vào hàng đợi.'};}imported.job.state='completed';imported.job.trackId=id;await writeJob(env,imported.job);}
   return json({uploaded:true,track:{id,title,artist,bytes:size,url:u.origin+'/audio/'+id}});
  }
  if(u.pathname.startsWith('/audio/')&&['GET','HEAD'].includes(request.method)){
   const id=u.pathname.slice(7);if(!keyPattern.test(id))return json({error:'Không tìm thấy bài hát.'},404);
   const key='audio/'+id,head=await env.MUSIC_BUCKET.head(key);if(!head||head.customMetadata?.published!=='true')return json({error:'Bài hát không còn trong kho.'},404);
   const h=new Headers({...cors,'Content-Type':id.endsWith('.m4a')?'audio/mp4':'audio/mpeg','Accept-Ranges':'bytes','ETag':head.httpEtag,'Cache-Control':'public, max-age=86400'});
   let range;try{range=(!request.headers.has('If-Range')||request.headers.get('If-Range')===head.httpEtag)?byteRange(request.headers.get('Range'),head.size):null;}catch{h.set('Content-Range','bytes */'+head.size);return new Response(null,{status:416,headers:h});}
   if(!range&&request.headers.get('If-None-Match')===head.httpEtag)return new Response(null,{status:304,headers:h});
   h.set('Content-Length',String(range?.length??head.size));if(range)h.set('Content-Range',`bytes ${range.offset}-${range.offset+range.length-1}/${head.size}`);
   if(request.method==='HEAD')return new Response(null,{status:range?206:200,headers:h});
   const asset=await env.MUSIC_BUCKET.get(key,range?{range}:undefined);if(!asset)return json({error:'Bài hát không còn trong kho.'},404);
   return new Response(asset.body,{status:range?206:200,headers:h});
  }
  return json({error:'Không có API này.'},404);
 }catch(e){return json({error:e.status?e.message:'Kho nhạc tạm thời chưa sẵn sàng.'},e.status||503);}
}
export default {fetch:handleCloudMusic,async scheduled(_controller,env){try{await runStagedImport(env);}catch{}return runGroqQueue(env);}};
