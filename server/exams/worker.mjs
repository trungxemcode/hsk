// Public read-only HSK examination assets. Owners publish with authenticated Wrangler, never from the browser.
const CORS={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET, HEAD, OPTIONS','Access-Control-Allow-Headers':'Range, If-None-Match, If-Range','Access-Control-Expose-Headers':'ETag, Content-Range, Content-Length, Accept-Ranges','X-Content-Type-Options':'nosniff'};
const json=(body,status=200)=>Response.json(body,{status,headers:{...CORS,'Cache-Control':'no-store'}});
const dataName=/^\/v1\/data\/([a-f0-9]{64})\.json\.gz$/;
const audioName=/^\/v1\/audio\/([a-f0-9]{64})\.(mp3|m4a)$/;
export function parseByteRange(value,size){
 if(!value)return null;
 const match=/^bytes=(\d*)-(\d*)$/.exec(value);
 if(!match||(!match[1]&&!match[2])||size<1)throw Error('invalid range');
 let start,end;
 if(!match[1]){const count=Number(match[2]);if(!Number.isSafeInteger(count)||count<1)throw Error('invalid range');start=Math.max(0,size-count);end=size-1;}
 else{start=Number(match[1]);end=match[2]?Number(match[2]):size-1;}
 if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>=size||start>end)throw Error('invalid range');
 end=Math.min(end,size-1);return {offset:start,length:end-start+1};
}
export async function handleExamBank(request,env){
 const u=new URL(request.url),method=request.method;
 if(method==='OPTIONS')return new Response(null,{status:204,headers:CORS});
 if(!['GET','HEAD'].includes(method))return json({error:'Method not allowed'},405);
 if(!env.EXAM_BUCKET)return json({error:'Exam storage unavailable'},503);
 let key,contentType,cache,allowRange=false;
 if(u.pathname==='/v1/manifest'){
  key='study4/manifest.json';contentType='application/json; charset=utf-8';cache='no-store';
 }else if(dataName.test(u.pathname)){
  key='study4/data/'+u.pathname.match(dataName)[1]+'.json.gz';contentType='application/json; charset=utf-8';cache='public, max-age=31536000, immutable';
 }else if(audioName.test(u.pathname)){
  const [,hash,ext]=u.pathname.match(audioName);key='study4/audio/'+hash+'.'+ext;contentType=ext==='mp3'?'audio/mpeg':'audio/mp4';cache='public, max-age=86400';allowRange=true;
 }else return json({error:'Not found'},404);
 try{
  const head=await env.EXAM_BUCKET.head(key);if(!head)return json({error:'Not found'},404);
  const headers=new Headers({...CORS,'Content-Type':contentType,'Cache-Control':cache,'ETag':head.httpEtag||`"${head.etag}"`});
  // R2 keeps gzip bytes; returning them as JSON without decoding breaks browser fetch().json().
  // Stream-decompress exactly once here; Cloudflare can negotiate HTTP compression itself.
  if(dataName.test(u.pathname))headers.delete('Content-Encoding');
  if(allowRange)headers.set('Accept-Ranges','bytes');
  let range=null;
  if(allowRange&&request.headers.has('Range')&&(!request.headers.has('If-Range')||request.headers.get('If-Range')===headers.get('ETag'))){
   try{range=parseByteRange(request.headers.get('Range'),head.size);}catch{return new Response(null,{status:416,headers:{...CORS,'Content-Range':`bytes */${head.size}`}});}
  }
  if(!range&&request.headers.get('If-None-Match')===headers.get('ETag'))return new Response(null,{status:304,headers});
  if(!dataName.test(u.pathname))headers.set('Content-Length',String(range?range.length:head.size));
  if(range)headers.set('Content-Range',`bytes ${range.offset}-${range.offset+range.length-1}/${head.size}`);
  if(method==='HEAD')return new Response(null,{status:range?206:200,headers});
  const asset=await env.EXAM_BUCKET.get(key,range?{range}:undefined);if(!asset)return json({error:'Not found'},404);
  return new Response(dataName.test(u.pathname)?asset.body.pipeThrough(new DecompressionStream('gzip')):asset.body,{status:range?206:200,headers});
 }catch{return json({error:'Exam storage temporarily unavailable'},503);}
}
export default {fetch:handleExamBank};
