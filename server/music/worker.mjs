// Independent media worker. Never replace the existing AI/voice worker with this.
import '../../src/modules/music/music-core.js';
import {OWNER_UID} from '../account-roles.mjs';
const C=globalThis.HSKMusicCore;
const assetPattern=/^music\/[a-f0-9]{64}\.(mp4|mp3|m4a|wav)$/;
const types={mp4:'video/mp4',mp3:'audio/mpeg',m4a:'audio/mp4',wav:'audio/wav'};
export function byteRange(header,size){
 if(!header)return null;
 const match=/^bytes=(\d*)-(\d*)$/.exec(header);if(!match||(!match[1]&&!match[2]))throw Error('range');
 let start,end;
 if(!match[1]){const suffix=Number(match[2]);if(!Number.isSafeInteger(suffix)||suffix<=0)throw Error('range');start=Math.max(0,size-suffix);end=size-1;}
 else{start=Number(match[1]);end=match[2]?Math.min(size-1,Number(match[2])):size-1;}
 if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=size||end<start)throw Error('range');
 return {offset:start,length:end-start+1};
}
export async function identity(request,env,fetchFn=fetch){
 const token=request.headers.get('Authorization')?.match(/^Bearer ([^\s]+)$/)?.[1];
 if(!token||token.length>10000||!env.FIREBASE_API_KEY)throw Object.assign(Error('Đăng nhập tài khoản HSK để tải kho nhạc.'),{status:401});
 const r=await fetchFn('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key='+encodeURIComponent(env.FIREBASE_API_KEY),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({idToken:token}),signal:AbortSignal.timeout(5000)});
 if(!r.ok)throw Object.assign(Error('Phiên đăng nhập không hợp lệ.'),{status:401});
 const account=(await r.json()).users?.[0];
 if(!account?.localId||account.disabled)throw Object.assign(Error('Tài khoản không hợp lệ.'),{status:401});
 return {uid:account.localId,admin:account.localId===OWNER_UID};
}
export async function handleMusic(request,env,ctx,{fetchFn=fetch}={}){
 const url=new URL(request.url),origin=request.headers.get('Origin'),allowed=(env.ALLOWED_ORIGINS||'https://trungxemcode.github.io').split(',').map(x=>x.trim());
 const cors=new Headers({'Vary':'Origin','Access-Control-Allow-Methods':'GET, HEAD, POST, OPTIONS','Access-Control-Allow-Headers':'Authorization, Content-Type, Range, If-Range','Access-Control-Expose-Headers':'Content-Length, Content-Range, Accept-Ranges, ETag','X-Content-Type-Options':'nosniff'});
 if(origin&&!allowed.includes(origin))return new Response('Origin not allowed',{status:403});if(origin)cors.set('Access-Control-Allow-Origin',origin);
 const json=(value,status=200)=>{const headers=new Headers(cors);headers.set('Cache-Control','no-store');return Response.json(value,{status,headers});};
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 try{
  if(url.pathname.startsWith('/media/')&&['GET','HEAD'].includes(request.method)){
   const key=url.pathname.slice(7);if(!assetPattern.test(key))return json({error:'Không tìm thấy tệp.'},404);
   // Only published immutable objects can be served publicly to native media elements.
   const published=await env.DB.prepare('SELECT asset_key FROM music_songs WHERE asset_key = ?').bind(key).first();if(!published)return json({error:'Không tìm thấy tệp.'},404);
   const head=await env.MUSIC_BUCKET.head(key);if(!head)return json({error:'Không tìm thấy tệp.'},404);
   const headers=new Headers(cors);headers.set('Content-Type',types[key.split('.').at(-1)]);headers.set('Accept-Ranges','bytes');headers.set('ETag',head.httpEtag);headers.set('Cache-Control','public, max-age=86400');
   if(request.headers.get('If-None-Match')===head.httpEtag&&!request.headers.has('Range'))return new Response(null,{status:304,headers});
   let range=null;try{if(!request.headers.has('If-Range')||request.headers.get('If-Range')===head.httpEtag)range=byteRange(request.headers.get('Range'),head.size);}catch{headers.set('Content-Range','bytes */'+head.size);return new Response(null,{status:416,headers});}
   const size=range?.length??head.size;headers.set('Content-Length',String(size));if(range)headers.set('Content-Range',`bytes ${range.offset}-${range.offset+range.length-1}/${head.size}`);
   if(request.method==='HEAD')return new Response(null,{status:range?206:200,headers});
   const object=await env.MUSIC_BUCKET.get(key,range?{range}:undefined);if(!object)return json({error:'Không tìm thấy tệp.'},404);
   return new Response(object.body,{status:range?206:200,headers});
  }
  if(url.pathname==='/api/songs'&&request.method==='GET'){
   await identity(request,env,fetchFn);
   const result=await env.DB.prepare('SELECT payload FROM music_songs ORDER BY published_at DESC LIMIT 20').all();
   return json({songs:(result.results||[]).map(r=>JSON.parse(r.payload))});
  }
  if(url.pathname==='/api/admin/song'&&request.method==='POST'){
   const actor=await identity(request,env,fetchFn);if(!actor.admin)return json({error:'Chỉ admin được xuất bản bài hát.'},403);
   const size=Number(request.headers.get('Content-Length'));if(size>500000)return json({error:'File lời quá lớn.'},413);
   const bytes=await request.arrayBuffer();if(bytes.byteLength>500000)return json({error:'File lời quá lớn.'},413);
   let song;try{song=C.validateSong(JSON.parse(new TextDecoder().decode(bytes)));}catch(e){return json({error:e.message},400);}
   if(song.source.kind==='local')return json({error:'Kho chung nhận R2, YouTube hoặc SoundCloud kèm dữ liệu bài học.'},400);
   if(!song.credit)return json({error:'Cần ghi nguồn và quyền sử dụng trong credit.'},400);
   let fileSize=0;
   if(song.source.kind==='r2'){const asset=await env.MUSIC_BUCKET.head(song.source.key);if(!asset||asset.size>52428800)return json({error:'Tệp R2 chưa có hoặc vượt 50 MB của bản thử.'},400);fileSize=asset.size;}
   // One conditional statement atomically caps new catalogue entries at the pilot size.
   const limit=Math.min(20,Math.max(1,Number(env.MAX_PILOT_SONGS)||20));
   const result=await env.DB.prepare(`INSERT INTO music_songs (id, revision, title, payload, asset_key, file_size_bytes)
    SELECT ?, ?, ?, ?, ?, ? WHERE EXISTS(SELECT 1 FROM music_songs WHERE id = ?) OR (SELECT count(*) FROM music_songs) < ?
    ON CONFLICT(id) DO UPDATE SET revision=excluded.revision,title=excluded.title,payload=excluded.payload,asset_key=excluded.asset_key,file_size_bytes=excluded.file_size_bytes,published_at=CURRENT_TIMESTAMP`).bind(song.id,song.revision,song.title,JSON.stringify(song),song.source.key||null,fileSize,song.id,limit).run();
   if(!result.meta?.changes)return json({error:'Kho thử đã đủ số bài. Chưa thêm bài mới.'},409);
   return json({published:true,id:song.id});
  }
  return json({error:'Không có API này.'},404);
 }catch(e){return json({error:e.status?e.message:'Kho nhạc tạm thời chưa sẵn sàng.'},e.status||503);}
}
export default {fetch:handleMusic};
