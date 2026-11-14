// Server-owned roles. There is exactly one owner; VIP never grants admin powers.
export const OWNER_UID='BIvUyItDYJWcLvlhhtYFyj5csBH2';
export const OWNER_EMAIL='honghiemtrung668@gmail.com';
export function accountRole(uid,record){return uid===OWNER_UID?'admin':record?.role==='vip'?'vip':'regular';}
export function roleProvider(role){return role==='admin'||role==='vip'?'gemini':'xkiro';}
const validUid=uid=>typeof uid==='string'&&/^[-\w:]{1,150}$/.test(uid);
const RESOURCES_KEY='resources:manifest:v1';
const SAFE_REL_RE=/^\.?\/[A-Za-z0-9._~:/?#[\]@!$&'()*+,;=%-]+$/;
const isSafeUrl=(v,allowEmpty,allowRel)=>{const s=String(v??'').trim();if(!s)return allowEmpty;if(allowRel&&SAFE_REL_RE.test(s)&&!s.startsWith('//'))return true;try{return new URL(s).protocol==='https:';}catch{return false;}};
export async function accountRoleControl(storage,data,time=Date.now()){
 const reply=(value,status=200)=>Response.json(value,{status});
 if(!validUid(data.actor))return reply({error:'actor'},400);
 if(data.action==='roles-resources-get'){
  const manifest=(await storage.get(RESOURCES_KEY))||null;
  return reply({manifest});
 }
 if(data.action==='roles-self'){
  const key='roles:user:'+data.actor;
  const result=await storage.transaction(async t=>{
   const prior=await t.get(key),role=accountRole(data.actor,prior);
   const email=typeof data.email==='string'?data.email.slice(0,254):'';
   const next={uid:data.actor,email,role,updatedAt:prior?.updatedAt||time};
   if(!prior||prior.email!==email||prior.role!==role)await t.put(key,next);
   return next;
  });return reply({account:result});
 }
 if(data.actor!==OWNER_UID)return reply({error:'Chỉ admin được quản lý quyền tài khoản.'},403);
 if(data.action==='roles-list'){
  if(data.cursor!==undefined&&(typeof data.cursor!=='string'||!/^roles:user:[-\w:]{1,150}$/.test(data.cursor)))return reply({error:'cursor'},400);
  const rows=await storage.list({prefix:'roles:user:',limit:100,...(data.cursor?{startAfter:data.cursor}:{})});
  const entries=[...rows.entries()];
  return reply({accounts:entries.map(([,r])=>({...r,role:accountRole(r.uid,r)})),cursor:entries.length===100?entries.at(-1)[0]:null});
 }
 if(data.action==='roles-set'){
  if(!validUid(data.uid)||!['vip','regular'].includes(data.role)||data.uid===OWNER_UID)return reply({error:'Không thể thay đổi admin cố định.'},400);
  const result=await storage.transaction(async t=>{
   const key='roles:user:'+data.uid,prior=await t.get(key);
   const record={uid:data.uid,email:prior?.email||(typeof data.email==='string'?data.email.slice(0,254):''),role:data.role,updatedAt:time,updatedBy:OWNER_UID};
   await t.put(key,record);return record;
  });return reply({account:result});
 }
 if(data.action==='roles-resources-set'){
  const m=data.manifest;
  if(!m||typeof m!=='object'||Array.isArray(m))return reply({error:'Dữ liệu cấu hình không hợp lệ.'},400);
  if(m.endpoints!==undefined&&(!m.endpoints||typeof m.endpoints!=='object'||Array.isArray(m.endpoints)||!isSafeUrl(m.endpoints.examManifestUrl,true,true)||!isSafeUrl(m.endpoints.driveExamDataUrl,true,true)||!isSafeUrl(m.endpoints.musicCloudEndpoint,true,false)))return reply({error:'Đường dẫn hệ thống không hợp lệ.'},400);
  for(const field of['exams','music','podcasts','documents']){
   if(m[field]!==undefined&&(!Array.isArray(m[field])||m[field].length>500))return reply({error:'Danh sách tài nguyên không hợp lệ.'},400);
   if(Array.isArray(m[field])){
    for(const item of m[field]){
     const rawUrl=item?.youtubeUrl||item?.url||'';
     if(!item||typeof item!=='object'||!isSafeUrl(rawUrl,field==='exams',field==='exams'))return reply({error:'Liên kết tài nguyên phải dùng HTTPS hợp lệ.'},400);
    }
   }
  }
  const next={...m,version:Number.isFinite(Number(m.version))&&Number(m.version)>0?Math.floor(Number(m.version)):1,updatedAt:time,updatedBy:OWNER_EMAIL};
  await storage.put(RESOURCES_KEY,next);
  return reply({manifest:next});
 }
 return reply({error:'action'},400);
}
export async function accountRoleCall(env,action,data,signal){
 if(!env.AI_CONTROL)throw Error('roles_unavailable');
 const stub=env.AI_CONTROL.get(env.AI_CONTROL.idFromName('account-roles-v1'));
 const controller=new AbortController(),abort=()=>controller.abort();
 if(signal?.aborted)throw new DOMException('Canceled','AbortError');
 signal?.addEventListener('abort',abort,{once:true});
 let timer;
 try{
  const response=await Promise.race([stub.fetch('https://internal.hsk/roles',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...data}),signal:controller.signal}),new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('roles_timeout'))},3000)})]);
  const result=await response.json();if(!response.ok)throw Error('roles_'+response.status);return result;
 }finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}
