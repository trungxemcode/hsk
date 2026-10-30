import Core from '../../tools/home-designer/core.js';
import schema from '../../tools/home-designer/schema.json' with {type:'json'};
import {identity} from '../music/worker.mjs';
const KEY='ui-design/current-v2.json',MAX=2000000;
const fail=(message,status)=>Object.assign(Error(message),{status});
async function boundedJSON(request){
 const reader=request.body?.getReader();if(!reader)throw fail('Thiếu bản chỉnh.',400);
 const chunks=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX){await reader.cancel();throw fail('Bản chỉnh vượt 2 MB.',413);}chunks.push(value);}
 const bytes=new Uint8Array(size);let at=0;for(const c of chunks){bytes.set(c,at);at+=c.length;}
 try{return JSON.parse(new TextDecoder().decode(bytes));}catch{throw fail('Bản chỉnh không đọc được.',400);}
}
export async function handleDesign(request,env,ctx={},deps={}){
 const url=new URL(request.url),origin=request.headers.get('Origin'),self=url.origin;
 const allowed=[self,...(env.PUBLIC_ORIGINS||'https://trungxemcode.github.io').split(',')];
 const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Origin'};
 if(origin&&!allowed.includes(origin))return new Response('Origin not allowed',{status:403,headers});
 if(origin)headers['Access-Control-Allow-Origin']=origin;
 headers['Access-Control-Allow-Methods']='GET, POST, OPTIONS';
 headers['Access-Control-Allow-Headers']='Authorization, Content-Type, If-None-Match';
 headers['Access-Control-Expose-Headers']='ETag';
 const json=(value,status=200,extra={})=>Response.json(value,{status,headers:{...headers,...extra}});
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 try{
  if(url.pathname==='/__designer/identity'&&request.method==='GET'){const actor=await (deps.identity||identity)(request,env,deps.fetchFn||fetch);return actor.admin?json({owner:true}):json({error:'Chỉ chủ ứng dụng được chỉnh giao diện.'},403);}
  if(['/__designer/state','/api/design'].includes(url.pathname)&&request.method==='GET'){
   const object=await env.DESIGN_BUCKET.get(KEY),saved=object?await object.json():null;
   const revision=saved?.revision||'0',etag='"'+revision+'"';
   if(url.pathname==='/api/design'){
    if(request.headers.get('If-None-Match')===etag)return new Response(null,{status:304,headers:{...headers,ETag:etag}});
    return json({revision,css:saved?.css||'',updatedAt:saved?.updatedAt||null},200,{ETag:etag});
   }
   return json({mode:'cloud',projectId:'hsk-online-design-v2',release:env.APP_RELEASE||'cloud',revision,applied:saved?.config||null,publicUrl:env.PUBLIC_URL||'https://trungxemcode.github.io/hsk/',firebaseApiKey:env.FIREBASE_API_KEY});
  }
  if(url.pathname==='/__designer/apply'&&request.method==='POST'){
   if(origin!==self)return json({error:'Chỉ lưu từ trang chỉnh sửa.'},403);
   const actor=await (deps.identity||identity)(request,env,deps.fetchFn||fetch);
   if(!actor.admin)return json({error:'Chỉ tài khoản chủ ứng dụng được chỉnh giao diện.'},403);
   const input=await boundedJSON(request);
   if(!input||typeof input.revision!=='string'||!input.config)throw fail('Thiếu phiên bản bản chỉnh.',400);
   let config,css;try{config=Core.upgrade(schema,input.config);css=Core.generateCSS(schema,config);}catch(e){throw fail(e.message,400);}
   const previous=await env.DESIGN_BUCKET.get(KEY),old=previous?await previous.json():null;
   if(input.revision!==(old?.revision||'0'))return json({error:'Giao diện đã được chỉnh ở cửa sổ khác. Nháp này còn trên máy; xuất nháp trước khi tải lại để đối chiếu.',conflict:true},409);
   const revision=crypto.randomUUID(),updatedAt=new Date().toISOString(),saved={revision,updatedAt,config,css};
   const result=await env.DESIGN_BUCKET.put(KEY,JSON.stringify(saved),{onlyIf:previous?{etagMatches:previous.etag}:{etagDoesNotMatch:'*'},httpMetadata:{contentType:'application/json'}});
   if(!result)return json({error:'Có một bản chỉnh khác vừa được lưu. Xuất nháp trước khi tải lại.',conflict:true},409);
   return json({ok:true,revision,updatedAt});
  }
  if(url.pathname.startsWith('/__designer/')||url.pathname.startsWith('/api/'))return json({error:'Không có đường dẫn này.'},404);
  if(!['GET','HEAD'].includes(request.method))return json({error:'Không hỗ trợ thao tác này.'},405);
  if(request.headers.get('Service-Worker')==='script')return json({error:'Bản xem thử không cài service worker.'},404);
  if(url.pathname==='/')return Response.redirect(self+'/tools/home-designer/editor.html',302);
  if(url.pathname==='/account-config.json'||url.pathname==='/push-config.json')return json({enabled:false});
  let response=await env.ASSETS.fetch(request);
  const h=new Headers(response.headers);h.set('Cache-Control','no-store');h.set('X-Content-Type-Options','nosniff');h.set('X-Frame-Options','SAMEORIGIN');h.set('Referrer-Policy','same-origin');
  if(url.pathname==='/index.html')h.set('Content-Security-Policy',"default-src 'self' data: blob:; script-src 'self' 'unsafe-inline' blob:; style-src 'self' 'unsafe-inline'; connect-src 'self' data: blob:; frame-ancestors 'self'; form-action 'self'");
  return new Response(response.body,{status:response.status,headers:h});
 }catch(e){return json({error:e.status?e.message:'Không lưu được giao diện. Bản đã phát hành vẫn được giữ.'},e.status||503);}
}
export default {fetch:handleDesign};
