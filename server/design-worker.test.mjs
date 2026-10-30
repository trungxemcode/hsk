import test from 'node:test';
import assert from 'node:assert/strict';
import {handleDesign} from './design/worker.mjs';
import Core from '../tools/home-designer/core.js';
import schema from '../tools/home-designer/schema.json' with {type:'json'};
class Bucket{
 value=null;etag=0;lose=false;
 async get(key){assert.equal(key,'ui-design/current-v2.json');const value=this.value;return value?{etag:String(this.etag),json:async()=>JSON.parse(value)}:null;}
 async put(key,value,options){assert.equal(key,'ui-design/current-v2.json');if(this.lose)return null;assert.deepEqual(options.onlyIf,this.value?{etagMatches:String(this.etag)}:{etagDoesNotMatch:'*'});this.value=value;this.etag++;return {etag:String(this.etag)};}
}
function fixture(){const bucket=new Bucket(),env={DESIGN_BUCKET:bucket,FIREBASE_API_KEY:'public-test-key',ASSETS:{fetch:async()=>new Response('<html>preview</html>',{headers:{'Content-Type':'text/html'}})}};return {bucket,env};}
const base='https://editor.example';
const request=(path,config,revision='0',extra={})=>new Request(base+path,config?{method:'POST',headers:{Origin:base,'Content-Type':'application/json',Authorization:'Bearer real-test-token',...extra},body:JSON.stringify({config,revision})}:extra);
const ownerFetch=async()=>Response.json({users:[{localId:'BIvUyItDYJWcLvlhhtYFyj5csBH2'}]});
test('owner edits publish validated CSS, public reader gets revisions and unchanged requests return 304',async()=>{
 const {bucket,env}=fixture(),config=Core.emptyProject(schema);config.pages.home.styles.desktop['word-heading']={fontSize:31};
 const response=await handleDesign(request('/__designer/apply',config),env,{}, {fetchFn:ownerFetch});assert.equal(response.status,200);const saved=await response.json();assert.ok(saved.revision);
 const read=await handleDesign(request('/api/design'),env);const value=await read.json();assert.match(value.css,/font-size:31px/);assert.equal(value.revision,saved.revision);assert.equal(value.config,undefined);assert.ok(!bucket.value.includes('real-test-token'));
 assert.equal((await handleDesign(request('/api/design',null,'0',{headers:{'If-None-Match':read.headers.get('ETag')}}),env)).status,304);
 assert.equal((await handleDesign(request('/__designer/apply',config,'0'),env,{}, {fetchFn:ownerFetch})).status,409);
});
test('server verifies Firebase identity, rejects guests, non-owner, wrong origins and malformed styles without publishing',async()=>{
 const {bucket,env}=fixture(),config=Core.emptyProject(schema);
 for(const [req,deps,status] of [
 [request('/__designer/apply',config,'0',{Authorization:''}),{fetchFn:ownerFetch},401],
 [request('/__designer/apply',config),{fetchFn:async()=>new Response('',{status:400})},401],
 [request('/__designer/apply',config),{fetchFn:async()=>Response.json({users:[{localId:'another-account'}]})},403],
 [request('/__designer/apply',config,'0',{Origin:'https://evil.example'}),{fetchFn:ownerFetch},403],
 [request('/__designer/apply',config,'0',{Origin:'https://trungxemcode.github.io'}),{fetchFn:ownerFetch},403]
 ])assert.equal((await handleDesign(req,env,{},deps)).status,status);
 config.pages.home.styles.desktop['word-heading']={color:'url(https://evil.example)'};
 assert.equal((await handleDesign(request('/__designer/apply',config),env,{}, {fetchFn:ownerFetch})).status,400);assert.equal(bucket.value,null);
});
test('atomic write conflicts and oversized streams preserve last good config',async()=>{
 const {bucket,env}=fixture();bucket.lose=true;assert.equal((await handleDesign(request('/__designer/apply',Core.emptyProject(schema)),env,{}, {fetchFn:ownerFetch})).status,409);
 const oversized=new Request(base+'/__designer/apply',{method:'POST',headers:{Origin:base,Authorization:'Bearer real-test-token'},body:' '.repeat(2000001)});
 assert.equal((await handleDesign(oversized,env,{}, {fetchFn:ownerFetch})).status,413);assert.equal(bucket.value,null);
});
test('preview disables account/push/SW; only owner can open editing session; ordinary public origins can read design',async()=>{
 const {env}=fixture();
 assert.equal((await handleDesign(request('/__designer/identity',null,'0',{headers:{Authorization:'Bearer real-test-token'}}),env,{}, {fetchFn:ownerFetch})).status,200);
 for(const p of ['/account-config.json','/push-config.json'])assert.deepEqual(await(await handleDesign(request(p),env)).json(),{enabled:false});
 assert.equal((await handleDesign(request('/offline-worker.js',null,'0',{headers:{'Service-Worker':'script'}}),env)).status,404);
 const preview=await handleDesign(request('/index.html'),env);assert.match(preview.headers.get('Content-Security-Policy'),/connect-src 'self' data: blob:/);
 const publicRead=await handleDesign(request('/api/design',null,'0',{headers:{Origin:'https://trungxemcode.github.io'}}),env);assert.equal(publicRead.headers.get('Access-Control-Allow-Origin'),'https://trungxemcode.github.io');
});
