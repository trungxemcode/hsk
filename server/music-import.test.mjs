import test from 'node:test';import assert from 'node:assert/strict';
import {handleCloudMusic} from './music/cloud-worker.mjs';import {runnerIdentity,youtubeId} from './music/import-jobs.mjs';import {OWNER_UID} from './account-roles.mjs';
const enc=s=>Buffer.from(typeof s==='string'?s:JSON.stringify(s)).toString('base64url');
async function setup(){
 const pair=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);const jwk=await crypto.subtle.exportKey('jwk',pair.publicKey);jwk.kid='test';
 const claims={iss:'https://token.actions.githubusercontent.com',aud:'hsk-music-import',repository:'trungxemcode/hsk',repository_id:'1086421828',repository_owner_id:'141910759',ref:'refs/heads/main',workflow_ref:'trungxemcode/hsk/.github/workflows/music-import.yml@refs/heads/main',event_name:'workflow_dispatch',run_id:'123',exp:Date.now()/1000+600,nbf:Date.now()/1000-5};
 async function jwt(changes={}){const s=enc({alg:'RS256',kid:'test'})+'.'+enc({...claims,...changes});return s+'.'+Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,new TextEncoder().encode(s))).toString('base64url');}
 const objects=new Map();const env={FIREBASE_API_KEY:'public',MUSIC_BUCKET:{async put(k,b,o){objects.set(k,{body:b,customMetadata:o?.customMetadata});},async get(k){const o=objects.get(k);return o?{body:new Response(o.body).body,json:async()=>JSON.parse(o.body)}:null;},async list({prefix}){return {objects:[...objects.keys()].filter(k=>k.startsWith(prefix)).map(key=>({key})),truncated:false};}}};
 const fetchFn=async(u,init)=>u.includes('jwks')?Response.json({keys:[jwk]}):Response.json({users:[{localId:JSON.parse(init.body).idToken==='admin'?OWNER_UID:'listener'}]});
 const request=(p,token,body,headers={})=>new Request('https://music.example'+p,{method:body===undefined?'GET':'POST',headers:{Authorization:'Bearer '+token,...headers},...(body!==undefined?{body:typeof body==='string'?body:JSON.stringify(body)}:{})});const handle=r=>handleCloudMusic(r,env,{}, {fetchFn});return {jwt,fetchFn,env,objects,request,handle};
}
test('admin alone can queue jobs; only signed main workflow can claim/publish',async()=>{
 const t=await setup(),body={url:'https://youtu.be/jNQXAC9IVRw',title:'Test'};
 assert.equal((await t.handle(t.request('/api/admin/imports','listener',body))).status,403);
 assert.equal((await t.handle(t.request('/api/admin/imports','admin',{url:'https://evil.example/a'}))).status,400);
 const create=await t.handle(t.request('/api/admin/imports','admin',body));assert.equal(create.status,202);const j=await create.json();
 assert.equal((await t.handle(t.request('/api/admin/imports/'+j.id,'listener'))).status,403);
 for(const changes of [{ref:'refs/heads/evil'},{repository:'attacker/hsk'},{event_name:'pull_request'},{exp:0},{workflow_ref:'trungxemcode/hsk/.github/workflows/evil.yml@refs/heads/main'}])assert.equal((await t.handle(t.request('/api/runner/claim',await t.jwt(changes),{}))).status,403);
 const good=await t.jwt();const claim=await (await t.handle(t.request('/api/runner/claim',good,{}))).json();assert.equal(claim.job.state,'running');
 assert.equal((await t.handle(t.request('/api/runner/jobs/'+j.id+'/upload',await t.jwt({run_id:'999'}),'ID3test',{'Content-Length':'7','X-Music-Title':'Test'}))).status,409);
 const result=await t.handle(t.request('/api/runner/jobs/'+j.id+'/upload',good,'ID3test',{'Content-Length':'7','X-Music-Title':'Test'}));assert.equal(result.status,200);
 const status=await (await t.handle(t.request('/api/admin/imports/'+j.id,'admin'))).json();assert.equal(status.state,'completed');assert.ok([...t.objects.keys()].some(k=>k.startsWith('audio/')));
});
test('reject forged signatures and unrelated URL hosts',async()=>{const t=await setup();const token=await t.jwt();const parts=token.split('.');parts[1]=enc({fake:true});await assert.rejects(runnerIdentity(t.request('/api/runner/claim',parts.join('.'),{}),t.fetchFn));for(const u of ['https://youtube.com.evil/watch?v=jNQXAC9IVRw','http://youtu.be/jNQXAC9IVRw','https://youtube.com/watch?v=bad'])assert.throws(()=>youtubeId(u));assert.equal(youtubeId('https://www.youtube.com/shorts/jNQXAC9IVRw'),'jNQXAC9IVRw');});
test('source metadata is owner-only and never treats channel as artist/composer',async()=>{
 const t=await setup();let sourceCalls=0;
 const fetchFn=async(url,init)=>{if(url.startsWith('https://www.youtube.com/oembed?')){sourceCalls++;assert.ok(url.includes(encodeURIComponent('https://www.youtube.com/watch?v=jNQXAC9IVRw')));return Response.json({title:'游山恋 - 海伦',author_name:'A fan channel'});}return t.fetchFn(url,init);};
 const handle=r=>handleCloudMusic(r,t.env,{}, {fetchFn});const body={url:'https://youtu.be/jNQXAC9IVRw'};
 assert.equal((await handle(t.request('/api/admin/imports/metadata','listener',body))).status,403);assert.equal(sourceCalls,0);
 const r=await handle(t.request('/api/admin/imports/metadata','admin',body));assert.equal(r.status,200);const d=await r.json();assert.equal(d.title,'游山恋 - 海伦');assert.equal(d.channel,'A fan channel');assert.equal(d.artist,'');assert.equal(d.composer,'');
 assert.equal((await handle(t.request('/api/admin/imports/metadata','admin',{url:'https://evil.example/file'}))).status,400);assert.equal(sourceCalls,1);
});
