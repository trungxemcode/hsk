/* Browser-to-provider only. Never sends Firebase tokens, cookies or audio through HSK servers. */
(function(root){
 'use strict';
 const cooldown=new Map(),MAX_JSON=1024*1024;
 function publicUrl(value){
  const u=new URL(value);
  if(u.protocol!=='https:'||u.username||u.password||u.port||u.hash||!u.hostname.includes('.')||/^[\d.]+$/.test(u.hostname)||u.hostname.includes(':')||/(^|\.)(localhost|local|internal|test|invalid)$/.test(u.hostname))throw Error('Địa chỉ nguồn không hợp lệ.');
  return u;
 }
 function endpoint(item){
  if(!item||!['piped','cobalt'].includes(item.type))throw Error('Loại dịch vụ chưa hỗ trợ.');
  const u=publicUrl(item.url);if(u.search)throw Error('Địa chỉ dịch vụ không hợp lệ.');
  return {...item,url:u.href.replace(/\/$/,''),origin:u.origin};
 }
 function abortCheck(signal){if(signal.aborted)throw new DOMException('Đã hủy.','AbortError');}
 function scope(parent,milliseconds){
  const controller=new AbortController(),abort=()=>controller.abort();parent.addEventListener('abort',abort,{once:true});if(parent.aborted)abort();
  const timer=setTimeout(abort,milliseconds);
  return {signal:controller.signal,close(){clearTimeout(timer);parent.removeEventListener('abort',abort);}};
 }
 async function request(url,options,instance){
  const response=await fetch(url,{...options,mode:'cors',credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store'});
  if(response.status===429){const retry=response.headers.get('Retry-After');let seconds=Number(retry);if(!Number.isFinite(seconds))seconds=(Date.parse(retry)-Date.now())/1000;cooldown.set(instance.url,Date.now()+Math.max(60,Number.isFinite(seconds)?seconds:60)*1000);}
  if(!response.ok){await response.body?.cancel().catch(()=>{});throw Error('Dịch vụ nguồn đang bận hoặc không cho tải ('+response.status+').');}
  return response;
 }
 async function json(response,signal){
  const reader=response.body.getReader(),chunks=[];let size=0;
  try{while(true){abortCheck(signal);const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>MAX_JSON)throw Error('Phản hồi nguồn vượt giới hạn.');chunks.push(value);}}
  catch(e){await reader.cancel().catch(()=>{});throw e;}
  const bytes=new Uint8Array(size);let offset=0;for(const value of chunks){bytes.set(value,offset);offset+=value.length;}
  return JSON.parse(new TextDecoder().decode(bytes));
 }
 function pipedCandidates(data,target){
  if(!(Number(data.duration)>0&&Number(data.duration)<=900)||data.livestream)throw Error('Chọn bài nhạc dài tối đa 15 phút.');
  const proxy=publicUrl(data.proxyUrl).origin;
  return (Array.isArray(data.audioStreams)?data.audioStreams:[]).flatMap(s=>{
   try{const u=publicUrl(s.url),quality=Number.parseFloat(s.quality)||Number(s.bitrate)/1000;
    if(u.origin!==proxy||s.videoOnly||!/^(audio\/(mp4|webm|mpeg|ogg)|application\/octet-stream)(;|$)/i.test(s.mimeType||'')||/\.m3u8(?:$|\?)/i.test(u.href)||!Number.isFinite(quality)||quality<=0)return [];
    return [{url:u.href,quality}];
   }catch{return [];}
  }).sort((a,b)=>{const score=s=>s.quality>=target?s.quality-target:10000-s.quality;return score(a)-score(b);}).slice(0,2);
 }
 async function resolve(source,target,item,signal){
  const options=item.type==='piped'?{headers:{Accept:'application/json'},signal}:{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify({url:source.url,downloadMode:'audio',audioFormat:'best',alwaysProxy:true,localProcessing:'forced'}),signal};
  const url=item.type==='piped'?item.url+'/streams/'+source.source.videoId:item.url+'/';
  const data=await json(await request(url,options,item),signal);
  if(item.type==='piped')return pipedCandidates(data,target);
  if(data.status==='error')throw Error('Dịch vụ chưa lấy được âm thanh từ link này.');
  let urls=[];
  if(data.status==='tunnel')urls=[data.url];
  if(data.status==='local-processing'&&!data.isHLS&&['audio','remux'].includes(data.type)&&data.tunnel?.length===1)urls=data.tunnel;
  // Do not fall back to raw Googlevideo URLs, multi-track merges, scripts or challenges.
  return urls.map(value=>publicUrl(value)).filter(u=>u.origin===item.origin).map(u=>({url:u.href}));
 }
 async function download(url,target,{instances,signal,onStatus=()=>{}}){
  abortCheck(signal);if(![32,64,96].includes(target))throw Error('Chất lượng nhạc chưa hợp lệ.');
  const source=root.HSKMusicCore.parseLink(url);
  if(source.kind==='spotify')throw Error('Spotify chưa hỗ trợ lưu trực tiếp. Chọn link YouTube hoặc SoundCloud tương ứng.');
  const list=(Array.isArray(instances)?instances:[]).slice(0,4).map(endpoint).filter(i=>i.type==='cobalt'||source.kind==='youtube');
  if(!list.length)throw Error('Chưa có dịch vụ tải trực tiếp hỗ trợ nguồn này.');
  for(const item of list){
   if((cooldown.get(item.url)||0)>Date.now())continue;
   abortCheck(signal);const lookup=scope(signal,8000);let candidates;
   try{onStatus('resolving',new URL(item.url).hostname);candidates=await resolve(source,target,item,lookup.signal);}
   catch{abortCheck(signal);continue;}
   finally{lookup.close();}
   for(const candidate of candidates){
    abortCheck(signal);const transfer=scope(signal,90000);
    try{
     onStatus('downloading',new URL(item.url).hostname);
     const response=await request(candidate.url,{signal:transfer.signal,headers:{Accept:'audio/*,application/octet-stream'}},item);
     const type=response.headers.get('Content-Type')||'';
     if(/text\/|json|mpegurl/i.test(type)){await response.body?.cancel().catch(()=>{});throw Error('Nguồn không trả file âm thanh.');}
     const bytes=await root.HSKMusicConverter.readSource(response,transfer.signal,(received,total)=>onStatus('progress',{received,total}));abortCheck(signal);return bytes;
    }catch{abortCheck(signal);if((cooldown.get(item.url)||0)>Date.now())break;}
    finally{transfer.close();}
   }
  }
  throw Error('Các dịch vụ tải trực tiếp đang bận, chặn tải hoặc không cho truy cập từ trình duyệt. Thử lại sau; các bài đã lưu vẫn được giữ.');
 }
 root.HSKMusicDirectSource={download};
})(window);
