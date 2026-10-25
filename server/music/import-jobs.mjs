import {identity} from './worker.mjs';
const repo='trungxemcode/hsk',aud='hsk-music-import',workflow=repo+'/.github/workflows/music-import.yml@refs/heads/main';
const fail=(s,m)=>{throw Object.assign(Error(m),{status:s});};
const decode=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
export async function runnerIdentity(request,fetchFn=fetch){
 const token=request.headers.get('Authorization')?.match(/^Bearer (\S+)$/)?.[1];if(!token||token.length>16000)fail(401,'Thiếu xác thực tác vụ.');
 let h,p,parts;try{parts=token.split('.');h=JSON.parse(new TextDecoder().decode(decode(parts[0])));p=JSON.parse(new TextDecoder().decode(decode(parts[1])));}catch{fail(401,'Token không hợp lệ.');}
 const now=Date.now()/1000;if(h.alg!=='RS256'||p.iss!=='https://token.actions.githubusercontent.com'||p.aud!==aud||!Number.isFinite(p.exp)||!Number.isFinite(p.nbf)||p.exp<=now||p.nbf>now+30||p.repository!==repo||p.repository_id!=='1086421828'||p.repository_owner_id!=='141910759'||p.ref!=='refs/heads/main'||p.workflow_ref!==workflow||!['schedule','workflow_dispatch','push'].includes(p.event_name)||!/^\d+$/.test(String(p.run_id)))fail(403,'Tác vụ không được phép.');
 const r=await fetchFn('https://token.actions.githubusercontent.com/.well-known/jwks',{signal:AbortSignal.timeout(10000)});if(!r.ok)fail(503,'Chưa xác minh được tác vụ.');const jwk=(await r.json()).keys?.find(k=>k.kid===h.kid);if(!jwk)fail(401,'Không tìm thấy khóa xác thực.');
 const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1])))fail(401,'Chữ ký không hợp lệ.');return {runId:String(p.run_id)};
}
export function youtubeId(raw){try{const u=new URL(raw);if(u.protocol!=='https:'||u.username||u.password)throw Error();let id;if(u.hostname==='youtu.be')id=u.pathname.slice(1);else if(['youtube.com','www.youtube.com','m.youtube.com'].includes(u.hostname))id=u.pathname==='/watch'?u.searchParams.get('v'):u.pathname.match(/^\/(?:shorts|embed)\/([^/]+)$/)?.[1];if(/^[\w-]{11}$/.test(id||''))return id;}catch{}fail(400,'Nhập link YouTube hợp lệ.');}
const path=id=>'imports/'+id+'.json';
export async function readJob(env,id){if(!/^[a-f0-9]{32}$/.test(id))fail(404,'Không có tác vụ.');const o=await env.MUSIC_BUCKET.get(path(id));if(!o)fail(404,'Không có tác vụ.');return o.json?o.json():new Response(o.body).json();}
export async function writeJob(env,j){await env.MUSIC_BUCKET.put(path(j.id),JSON.stringify(j),{httpMetadata:{contentType:'application/json'}});}
export async function importRoute(request,env,json,fetchFn=fetch){
 const u=new URL(request.url),admin=u.pathname.startsWith('/api/admin/import'),runner=u.pathname.startsWith('/api/runner/');if(!admin&&!runner)return null;
 if(admin){const actor=await identity(request,env,fetchFn);if(!actor.admin)fail(403,'Chỉ admin được thêm nhạc vào kho.');
  if(u.pathname==='/api/admin/imports'&&request.method==='POST'){
   if(Number(request.headers.get('Content-Length'))>4096)fail(413,'Yêu cầu quá lớn.');const b=await request.text();if(b.length>4096)fail(413,'Yêu cầu quá lớn.');let data;try{data=JSON.parse(b)}catch{fail(400,'Yêu cầu không hợp lệ.');}const videoId=youtubeId(data.url),id=crypto.randomUUID().replace(/-/g,'');
   const j={id,videoId,url:'https://www.youtube.com/watch?v='+videoId,title:String(data.title||'').trim().slice(0,120),artist:String(data.artist||'').trim().slice(0,80),state:'queued',createdAt:Date.now()};await writeJob(env,j);return json(j,202);
  }
  const m=u.pathname.match(/^\/api\/admin\/imports\/([a-f0-9]{32})$/);if(m&&request.method==='GET')return json(await readJob(env,m[1]));return json({error:'Không có API này.'},404);
 }
 const actor=await runnerIdentity(request,fetchFn);
 if(u.pathname==='/api/runner/claim'&&request.method==='POST'){
  const page=await env.MUSIC_BUCKET.list({prefix:'imports/',limit:1000});const jobs=[];for(const o of page.objects){const id=o.key.slice(8,-5);try{const j=await readJob(env,id);if(j.state==='running'&&j.leaseUntil<Date.now()){j.state='failed';j.error='Tác vụ hết thời gian. Hãy thử lại.';await writeJob(env,j);}if(j.state==='queued')jobs.push(j);}catch{}}
  jobs.sort((a,b)=>a.createdAt-b.createdAt);const j=jobs[0];if(!j)return json({job:null});j.state='running';j.runId=actor.runId;j.leaseUntil=Date.now()+15*60*1000;await writeJob(env,j);return json({job:j});
 }
 const m=u.pathname.match(/^\/api\/runner\/jobs\/([a-f0-9]{32})\/(upload|fail)$/);if(!m)return json({error:'Không có API này.'},404);const j=await readJob(env,m[1]);if(j.state!=='running'||j.runId!==actor.runId||j.leaseUntil<Date.now())fail(409,'Tác vụ không còn hiệu lực.');
 if(m[2]==='fail'&&request.method==='POST'){j.state='failed';j.error='YouTube chưa cho tải bài này. Cookie có thể hết hạn hoặc nguồn bị chặn.';await writeJob(env,j);return json({ok:true});}
 if(m[2]==='upload'&&request.method==='POST')return {job:j};return json({error:'Không có API này.'},404);
}
