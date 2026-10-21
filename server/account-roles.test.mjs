import test from 'node:test';
import assert from 'node:assert/strict';
import {OWNER_UID,accountRole,accountRoleControl} from './account-roles.mjs';
import {createAiRoleFetch} from './ai-backup.mjs';
import {createHandler} from './translator-worker-bundled.mjs';
import {qaDescriptor} from './tutor-cache.mjs';
function storage(){const m=new Map();return {m,get:async k=>m.get(k),put:async(k,v)=>m.set(k,v),list:async({prefix,limit,startAfter})=>new Map([...m].filter(([k])=>k.startsWith(prefix)&&(!startAfter||k>startAfter)).sort(([a],[b])=>a.localeCompare(b)).slice(0,limit))};}
function store(){const s=storage();s.transaction=async fn=>fn(s);return s;}
const env={AI_ACCOUNT_ROLES_ENABLED:'true',GEMINI_API_KEY:'fake',FIREBASE_API_KEY:'fake',ADMIN_UIDS:OWNER_UID,AI_BACKUP_ENABLED:'true',SECONDARY_AI_PROVIDER:'xkiro',SECONDARY_AI_API_KEY:'test-only-1234567890123456789',SECONDARY_AI_MODEL:'test'};
const gem=data=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(data)}]}}]});
const x=data=>Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(data)}}]});
const init={body:JSON.stringify({contents:[{parts:[{text:'test'}]}],generationConfig:{responseSchema:{type:'OBJECT',properties:{answer:{type:'STRING'}},required:['answer']}}})},url='https://generativelanguage.googleapis.com/v1beta/models/test:generateContent';
test('single immutable owner, only owner can grant/revoke VIP; self registration cannot promote',async()=>{
 const s=store();assert.equal(accountRole(OWNER_UID,{role:'regular'}),'admin');assert.equal(accountRole('u',{role:'admin'}),'regular');
 let r=await accountRoleControl(s,{action:'roles-self',actor:'u',email:'u@test.invalid',role:'admin'});assert.equal((await r.json()).account.role,'regular');
 for(const actor of ['u','vip'])assert.equal((await accountRoleControl(s,{action:'roles-set',actor,uid:'u',role:'vip'})).status,403);
 assert.equal((await accountRoleControl(s,{action:'roles-set',actor:OWNER_UID,uid:OWNER_UID,role:'regular'})).status,400);
 assert.equal((await accountRoleControl(s,{action:'roles-set',actor:OWNER_UID,uid:'u',role:'admin'})).status,400);
 await accountRoleControl(s,{action:'roles-set',actor:OWNER_UID,uid:'u',role:'vip'});
 assert.equal((await (await accountRoleControl(s,{action:'roles-self',actor:'u'})).json()).account.role,'vip');
 await accountRoleControl(s,{action:'roles-set',actor:OWNER_UID,uid:'u',role:'regular'});
 assert.equal((await (await accountRoleControl(s,{action:'roles-self',actor:'u'})).json()).account.role,'regular');
 assert.equal((await accountRoleControl(s,{action:'roles-list',actor:'u'})).status,403);
});
test('role listing uses bounded pagination without duplicate rows',async()=>{const s=store();for(let i=0;i<101;i++)await accountRoleControl(s,{action:'roles-self',actor:'user'+String(i).padStart(3,'0')});const a=await (await accountRoleControl(s,{action:'roles-list',actor:OWNER_UID})).json(),b=await (await accountRoleControl(s,{action:'roles-list',actor:OWNER_UID,cursor:a.cursor})).json();assert.equal(a.accounts.length,100);assert.equal(b.accounts.length,1);assert.equal(new Set([...a.accounts,...b.accounts].map(x=>x.uid)).size,101);});
test('verified account provider is exclusive for text, reading and complex tasks; failures never cross',async()=>{
 for(const role of ['admin','vip','regular'])for(const route of ['/ask','/reading-next','/study-plan-review'])for(const fails of [false,true]){
 const calls=[],f=createAiRoleFetch(async u=>{calls.push(u);return fails?new Response('',{status:503}):u===url?gem({answer:'ok'}):x({answer:'ok'});},env,{route,body:{hsk:6},accountRole:role});
 const r=await f(url,init);assert.equal(r.status,fails?503:200);assert.equal(calls.length,1);assert.equal(calls[0]===url,role!=='regular');
 }
 const calls=[],f=createAiRoleFetch(async u=>{calls.push(u);return gem({answer:'ok'})},{...env,SECONDARY_AI_API_KEY:undefined},{accountRole:'regular'});assert.equal((await f(url,init)).status,503);assert.equal(calls.length,0);
});
test('regular image input cannot silently call Gemini',async()=>{let n=0;const f=createAiRoleFetch(async()=>{n++;return gem({})},env,{accountRole:'regular'});assert.equal((await f(url,{body:JSON.stringify({contents:[{parts:[{inlineData:{data:'image'}}]}]})})).status,403);assert.equal(n,0);});
function binding(s){return {idFromName:n=>n,get:()=>({fetch:async(u,o)=>JSON.parse(o.body).action.startsWith('roles-')?accountRoleControl(s,JSON.parse(o.body)):Response.json({allowed:true})})};}
function token(uid){const project='hsk-flashcards-44631';return 'h.'+Buffer.from(JSON.stringify({aud:project,iss:'https://securetoken.google.com/'+project,sub:uid,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')+'.s';}
function req(path,uid,body={}){return new Request('https://worker.test'+path,{method:'POST',headers:{Origin:'https://trungxemcode.github.io',Authorization:'Bearer '+token(uid)},body:JSON.stringify(body)});}
test('bundled Worker enforces verified actor, prevents admin creation and rechecks revoked VIP',async()=>{
 const s=store(),e={...env,AI_CONTROL:binding(s)},answer={answer:'Xin chào',terms:[{han:'你好',pinyin:'ni hao',meaning:'xin chào'}]};let authUid='u',providers=[];
 const handler=()=>createHandler(async u=>{if(u.includes('identitytoolkit'))return Response.json({users:[{localId:authUid,email:authUid+'@test.invalid'}]});providers.push(u);return u.includes('generativelanguage')?gem(answer):x(answer);});
 assert.equal((await handler()(req('/admin/account-role','u',{uid:'u',role:'vip'}),e)).status,403);
 assert.equal((await handler()(req('/admin/accounts',OWNER_UID),e)).status,401);
 authUid=OWNER_UID;
 assert.equal((await handler()(req('/admin/account-role',OWNER_UID,{uid:'u',role:'admin'}),e)).status,400);
 assert.equal((await handler()(req('/admin/account-role',OWNER_UID,{uid:OWNER_UID,role:'regular'}),e)).status,400);
 assert.equal((await handler()(req('/admin/account-role',OWNER_UID,{uid:'u',role:'vip'}),e)).status,200);
 authUid='u';providers=[];let r=await handler()(req('/dictionary-lookup','u',{query:'你好',role:'admin'}),e);assert.equal(r.status,400);assert.equal(providers.length,0);
 r=await handler()(req('/dictionary-lookup','u',{query:'你好'}),e);assert.equal(r.status,200);assert.equal(r.headers.get('X-HSK-AI-Provider'),'gemini');assert.equal(providers.length,1);
 authUid=OWNER_UID;await handler()(req('/admin/account-role',OWNER_UID,{uid:'u',role:'regular'}),e);
 authUid='u';providers=[];r=await handler()(req('/dictionary-lookup','u',{query:'你好'}),e);assert.equal(r.status,200);assert.equal(r.headers.get('X-HSK-AI-Provider'),'xkiro');assert.equal(providers.length,1);
});
test('unavailable role service fails closed before provider generation',async()=>{let calls=0;const h=createHandler(async()=>{calls++;return Response.json({users:[{localId:'u'}]})});assert.equal((await h(req('/dictionary-lookup','u',{query:'你好'}),env)).status,503);assert.equal(calls,1);});
test('tutor cache keys separate providers, including after promotion/revocation',async()=>{const b={query:'你好'},base={...env,QA_CACHE_ENABLED:'true',AI_CONTROL:{}};const g=await qaDescriptor('/dictionary-lookup',b,'u',{...base,QA_ACCOUNT_PROVIDER:'gemini'}),x=await qaDescriptor('/dictionary-lookup',b,'u',{...base,QA_ACCOUNT_PROVIDER:'xkiro'});assert.notEqual(g.key,x.key);});
