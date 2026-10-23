/* Browser-direct, third-party metadata/stream requests. No HSK account tokens or media relay. */
(function(root){
 'use strict';
 const cooldown=new Map(),MAX_JSON=1024*1024,DISCOVERY='https://api.invidious.io/instances.json?sort_by=health';
 function publicUrl(value){
  const u=new URL(value);
  if(u.protocol!=='https:'||u.username||u.password||u.port||u.hash||!u.hostname.includes('.')||/^[\d.]+$/.test(u.hostname)||u.hostname.includes(':')||/(^|\.)(localhost|local|internal|test|invalid)$/.test(u.hostname))throw Error('Địa chỉ nguồn không hợp lệ.');
  return u;
 }
 function endpoint(item){
  if(!item||!['piped','cobalt','invidious'].includes(item.type))throw Error('Loại dịch vụ chưa hỗ trợ.');
  const u=publicUrl(item.url);if(u.search||u.pathname!=='/')throw Error('Địa chỉ dịch vụ không hợp lệ.');
  return {...item,url:u.origin,origin:u.origin};
 }
 function abortCheck(signal){if(signal?.aborted)throw new DOMException('Đã hủy.','AbortError');}
 function scope(parent,milliseconds){
  const controller=new AbortController(),abort=()=>controller.abort();
  parent?.addEventListener('abort',abort,{once:true});if(parent?.aborted)abort();
  const timer=setTimeout(abort,milliseconds);
  return {signal:controller.signal,close(){clearTimeout(timer);parent?.removeEventListener('abort',abort);}};
 }
 function setCooldown(url,response){
  if(response.status===429){const retry=response.headers.get('Retry-After');let seconds=Number(retry);if(!Number.isFinite(seconds))seconds=(Date.parse(retry)-Date.now())/1000;cooldown.set(url,Date.now()+Math.max(60,Number.isFinite(seconds)?seconds:60)*1000);}
  if(response.status===403)cooldown.set(url,Date.now()+120000);
 }
 async function request(url,options,item){
  const response=await fetch(url,{...options,mode:'cors',credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store'});
  setCooldown(item.url,response);
  if(!response.ok){await response.body?.cancel().catch(()=>{});throw Error('Dịch vụ nguồn từ chối yêu cầu (HTTP '+response.status+').');}
  return response;
 }
 async function json(response,signal){
  const reader=response.body?.getReader();
  if(!reader)throw Error('API không trả dữ liệu.');
  const chunks=[];let size=0;
  try{while(true){abortCheck(signal);const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>MAX_JSON)throw Error('Phản hồi nguồn vượt giới hạn.');chunks.push(value);}}
  catch(e){await reader.cancel().catch(()=>{});throw e;}
  const bytes=new Uint8Array(size);let offset=0;for(const value of chunks){bytes.set(value,offset);offset+=value.length;}
  return JSON.parse(new TextDecoder().decode(bytes));
 }
 async function discover(signal){
  // Fetched afresh per save attempt; the directory already ranks results by health.
  const lookup=scope(signal,8000),directory={url:DISCOVERY};
  try{
   const data=await json(await request(DISCOVERY,{headers:{Accept:'application/json'},signal:lookup.signal},directory),lookup.signal);
   if(!Array.isArray(data))throw Error('Danh sách máy chủ Invidious không hợp lệ.');
   const unique=new Set(),ready=[];
   for(const row of data){
    if(!Array.isArray(row)||row.length<2)continue;
    const info=row[1];if(info?.api!==true||info?.cors!==true||info?.monitor?.down===true||info?.type!=='https')continue;
    try{const item=endpoint({type:'invidious',url:info.uri});if(unique.has(item.url))continue;unique.add(item.url);ready.push(item);if(ready.length===5)break;}catch{}
   }
   return ready;
  }finally{lookup.close();}
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
 function invidiousCandidates(data,target,item,videoId){
  const duration=Number(data.lengthSeconds);
  if((duration&&duration>900)||data.isLive||data.liveNow)throw Error('Chỉ lưu bản thu âm tối đa 15 phút.');
  const supported=new Set([139,140,249,250,251]);
  const formats=Array.isArray(data.adaptiveFormats)?data.adaptiveFormats:[];
  const candidates=formats.flatMap(format=>{
   const itag=Number(format.itag);
   const mime=String(format.type||format.mimeType||'');
   if(!supported.has(itag)||(!/^audio\/(mp4|webm)/i.test(mime)&&mime!==''))return [];
   const rate=Number(format.bitrate)/1000||({139:48,140:128,249:50,250:70,251:160})[itag];
   const stream=new URL('/latest_version',item.url);
   stream.searchParams.set('id',videoId);stream.searchParams.set('itag',String(itag));stream.searchParams.set('local','true');
   return [{url:stream.href,quality:rate}];
  });
  return candidates.sort((a,b)=>{const score=s=>s.quality>=target?s.quality-target:10000-s.quality;return score(a)-score(b);}).slice(0,2);
 }
 async function resolve(source,target,item,signal){
  if(item.type==='invidious'){
   const url=new URL('/api/v1/videos/'+source.source.videoId,item.url);
   url.searchParams.set('fields','adaptiveFormats,title,author,lengthSeconds,isLive');
   const data=await json(await request(url.href,{headers:{Accept:'application/json'},signal},item),signal);
   return invidiousCandidates(data,target,item,source.source.videoId);
  }
  const options=item.type==='piped'?{headers:{Accept:'application/json'},signal}:{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify({url:source.url,downloadMode:'audio',audioFormat:'best',alwaysProxy:true,localProcessing:'forced'}),signal};
  const url=item.type==='piped'?item.url+'/streams/'+source.source.videoId:item.url+'/';
  const data=await json(await request(url,options,item),signal);
  if(item.type==='piped')return pipedCandidates(data,target);
  if(data.status==='error')throw Error('Dịch vụ chưa lấy được âm thanh từ link này.');
  let urls=[];
  if(data.status==='tunnel')urls=[data.url];
  if(data.status==='local-processing'&&!data.isHLS&&['audio','remux'].includes(data.type)&&data.tunnel?.length===1)urls=data.tunnel;
  return urls.map(value=>publicUrl(value)).filter(u=>u.origin===item.origin).map(u=>({url:u.href}));
 }
 async function download(url,target,{instances=[],signal,onStatus=()=>{}}){
  abortCheck(signal);if(![32,64,96].includes(target))throw Error('Chất lượng nhạc chưa hợp lệ.');
  const source=root.HSKMusicCore.parseLink(url);
  if(source.kind==='spotify')throw Error('Spotify chưa hỗ trợ lưu trực tiếp. Chọn link YouTube hoặc SoundCloud tương ứng.');
  let list=[];
  if(source.kind==='youtube' && !(Array.isArray(instances)&&instances.length)){
   onStatus('resolving','danh sách Invidious');
   try{list=await discover(signal);}catch(e){abortCheck(signal);onStatus('resolving','nguồn dự phòng');}
  }
  // An explicitly configured, authorized service remains a fallback; no dead Piped URLs shipped.
  list.push(...(Array.isArray(instances)?instances:[]).slice(0,4).map(endpoint).filter(i=>i.type==='cobalt'||source.kind==='youtube'));
  if(!list.length)throw Error(source.kind==='youtube'?'Chưa có Invidious hỗ trợ API và CORS tại thời điểm này. Bạn có thể gắn file M4A có sẵn hoặc thử lại sau.':'Chưa có dịch vụ SoundCloud được phép tải trực tiếp. Bạn có thể gắn file M4A có sẵn.');
  let tried=0,blocked=0;
  for(const item of list){
   if((cooldown.get(item.url)||0)>Date.now())continue;
   abortCheck(signal);const lookup=scope(signal,8000);let candidates=[];
   try{onStatus('resolving',new URL(item.url).hostname);candidates=await resolve(source,target,item,lookup.signal);}
   catch(e){abortCheck(signal);blocked++;continue;}
   finally{lookup.close();}
   for(const candidate of candidates){
    abortCheck(signal);const transfer=scope(signal,90000);
    try{
     onStatus('downloading',new URL(item.url).hostname);
     const response=await request(candidate.url,{signal:transfer.signal,headers:{Accept:'audio/*,application/octet-stream'}},item);
     const type=response.headers.get('Content-Type')||'';
     if(/text\/|json|mpegurl|html/i.test(type)){await response.body?.cancel().catch(()=>{});throw Error('Nguồn không trả file âm thanh.');}
     tried++;
     const bytes=await root.HSKMusicConverter.readSource(response,transfer.signal,(received,total)=>onStatus('progress',{received,total}));abortCheck(signal);return bytes;
    }catch(e){abortCheck(signal);blocked++;if((cooldown.get(item.url)||0)>Date.now())break;}
    finally{transfer.close();}
   }
  }
  throw Error('Các máy chủ nhạc đang chặn tải hoặc không hỗ trợ CORS ('+blocked+' lượt lỗi). Hãy thử lại sau hoặc gắn file M4A từ thiết bị; nhạc đã lưu vẫn được giữ.');
 }
 root.HSKMusicDirectSource={download,discover,invidiousCandidates};
})(window);
