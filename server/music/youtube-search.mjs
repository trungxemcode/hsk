// Public YouTube name search. No credentials/cookies are sent to YouTube.
const cache=new Map(),limits=new Map();
export function parseYouTubeSearch(html){
 const marker=html.match(/(?:var\s+ytInitialData\s*=|window\["ytInitialData"\]\s*=)\s*/);if(!marker)throw Error('missing search data');
 const start=marker.index+marker[0].length;let depth=0,quoted=false,escape=false,end=start;
 for(;end<html.length;end++){const c=html[end];if(quoted){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')quoted=false;}else if(c==='"')quoted=true;else if(c==='{')depth++;else if(c==='}'&&--depth===0){end++;break;}}
 const data=JSON.parse(html.slice(start,end)),rows=[],seen=new Set(),text=n=>n?.simpleText||n?.runs?.map(x=>x.text||'').join('')||'';
 function walk(n){if(!n||typeof n!=='object'||rows.length>=12)return;if(n.videoRenderer){const v=n.videoRenderer,id=v.videoId,title=text(v.title);if(/^[\w-]{11}$/.test(id||'')&&title&&!seen.has(id)){seen.add(id);rows.push({id,url:'https://www.youtube.com/watch?v='+id,title:title.slice(0,180),channel:text(v.ownerText||v.longBylineText).slice(0,100),duration:text(v.lengthText).slice(0,20),thumbnail:'https://i.ytimg.com/vi/'+id+'/mqdefault.jpg'});}return;}for(const v of Object.values(n))if(Array.isArray(v))v.forEach(walk);else walk(v);}
 walk(data);return rows;
}
export async function searchRoute(request,json,fetchFn=fetch){
 const u=new URL(request.url);if(u.pathname!=='/api/search/youtube')return null;
 if(request.method!=='GET')return json({error:'Không có API này.'},405);
 const q=(u.searchParams.get('q')||'').trim().replace(/\s+/g,' ');if(q.length<2||q.length>100)return json({error:'Nhập tên bài hát từ 2 đến 100 ký tự.'},400);
 const now=Date.now(),hit=cache.get(q.toLowerCase());if(hit&&hit.until>now)return json({tracks:hit.tracks});
 const ip=request.headers.get('CF-Connecting-IP')||'unknown',rate=limits.get(ip);if(rate&&rate.until>now&&rate.n>=10)return json({error:'Bạn tìm hơi nhanh. Thử lại sau một phút.'},429);
 if(!rate||rate.until<=now)limits.set(ip,{n:1,until:now+60000});else rate.n++;if(limits.size>2000)limits.delete(limits.keys().next().value);
 try{const r=await fetchFn('https://www.youtube.com/results?search_query='+encodeURIComponent(q)+'&hl=vi',{headers:{'User-Agent':'Mozilla/5.0','Accept-Language':'vi,en;q=0.8'},signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('upstream');const html=await r.text();if(html.length>4000000)throw Error('size');const tracks=parseYouTubeSearch(html);cache.set(q.toLowerCase(),{tracks,until:now+300000});if(cache.size>100)cache.delete(cache.keys().next().value);return json({tracks});}
 catch{return json({error:'YouTube chưa trả kết quả lúc này. Thử lại hoặc dán link bài hát.'},502);}
}
