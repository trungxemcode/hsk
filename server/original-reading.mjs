/* Exact-source reader: only two public hosts, bounded fetches, no AI calls. */
const OR_HOSTS=['mandarinbean.com','hskreading.com'];
const OR_VOID=new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
function orDecode(s){return String(s).replace(/&#(x[0-9a-f]+|[0-9]+);|&(amp|lt|gt|quot|apos|nbsp|#039);/gi,(all,n,k)=>{if(n){const v=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n);return v>0&&v<=0x10ffff&&!(v>=0xd800&&v<=0xdfff)?String.fromCodePoint(v):'';}return {amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ','#039':"'"}[k.toLowerCase()]||all;});}
function orTree(html){
 const root={tag:'root',attrs:{},children:[]},stack=[root];let nodes=0;
 for(const match of html.matchAll(/<!--[\s\S]*?-->|<![^>]*>|<\/?[a-zA-Z][^>]*>|[^<]+/g)){
  const token=match[0];if(++nodes>45000)throw Error('Trang quá phức tạp.');
  if(token.startsWith('<!--')||token.startsWith('<!'))continue;
  if(token[0]!=='<'){stack.at(-1).children.push(orDecode(token));continue;}
  const close=token.startsWith('</'),tag=token.match(/^<\/?([a-z0-9-]+)/i)?.[1].toLowerCase();if(!tag)continue;
  if(close){for(let i=stack.length-1;i>0;i--)if(stack[i].tag===tag){stack.length=i;break;}continue;}
  const attrs={};for(const a of token.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g))attrs[a[1].toLowerCase()]=orDecode(a[2]??a[3]??a[4]??'');
  const node={tag,attrs,children:[]};stack.at(-1).children.push(node);if(!OR_VOID.has(tag)&&!token.endsWith('/>'))stack.push(node);
 }return root;
}
function orAll(node,predicate){const out=[];function visit(n){if(typeof n!=='object'||['script','style','noscript'].includes(n.tag))return;if(predicate(n))out.push(n);for(const c of n.children)visit(c);}visit(node);return out;}
function orClass(n,c){return (n.attrs.class||'').split(/\s+/).includes(c);}
function orText(node,mode='hanzi'){
 if(typeof node==='string')return node;
 if(['script','style','nav','noscript','button','input'].includes(node.tag))return '';
 if(mode==='hanzi'&&(node.tag==='rt'||node.tag==='rp'||orClass(node,'tr')))return '';
 if(node.tag==='ruby'&&mode==='pinyin'){const rt=orAll(node,n=>n.tag==='rt')[0];return rt?orText(rt,'raw')+' ':'';}
 if(node.tag==='br')return '\n';
 return node.children.map(c=>orText(c,mode)).join('');
}
function orClean(n,mode='hanzi'){return orText(n,mode).replace(/\r/g,'').replace(/[ \t]+/g,' ').trim();}
export function originalReadingURL(value){
 try{const u=new URL(value);if(u.protocol!=='https:'||!OR_HOSTS.includes(u.hostname)||u.username||u.password||u.port||u.search||u.hash||!/^\/[a-z0-9][a-z0-9-]{0,180}\/$/.test(u.pathname))return null;
 if(/^\/(?:login|pricing|about|all-lessons|privacy-policy|terms-of-use|wp-admin|wp-login|feed)\/$/.test(u.pathname))return null;return u.href;}catch{return null;}
}
export function extractOriginalReading(html,url){
 const canonical=originalReadingURL(url);if(!canonical)throw Error('URL bài đọc không hợp lệ.');
 const root=orTree(html),host=new URL(url).hostname;let content,paragraphs,title;
 if(host==='mandarinbean.com'){
  const holder=orAll(root,n=>orClass(n,'elementor-widget-theme-post-content'))[0];if(!holder)throw Error('Không tìm thấy bài đọc nguyên gốc.');
  content=orAll(holder,n=>orClass(n,'elementor-widget-container'))[0];if(!content)throw Error('Cấu trúc nguồn đã thay đổi.');
  paragraphs=orAll(content,n=>n.tag==='p').map(n=>({hanzi:orClean(n),pinyin:orAll(n,x=>x.tag==='ruby').length?orClean(n,'pinyin'):''}));
  const h=orAll(root,n=>n.tag==='h2'&&orAll(n,x=>orClass(x,'si')).length)[0];title=h?orClean(h):'';
 }else{
  const article=orAll(root,n=>n.tag==='article'&&orClass(n,'type-post'))[0];
  content=article&&orAll(article,n=>orClass(n,'post-content'))[0];if(!content)throw Error('Không tìm thấy nội dung bài đọc.');
  // Current HSK Reading uses plain h2 headings; older pages used class=cjk.
  const heading=orAll(content,n=>n.tag==='h2'&&/[\u3400-\u9fff]/u.test(orClean(n)))[0];
  if(!heading||/^(?:问题|問題|练习|練習|答案|翻译|翻譯|词汇|詞彙)[：:？?。.!！\s]*$/u.test(orClean(heading)))throw Error('Cấu trúc nguồn đã thay đổi.');
  title=orClean(heading);
  // Collect only the passage after its Chinese heading and before translation/questions.
  const flat=orAll(content,n=>['h2','p','input','button'].includes(n.tag));let started=false;paragraphs=[];
  for(const n of flat){if(n===heading){started=true;continue;}if(!started)continue;if(['h2','input','button'].includes(n.tag))break;
   const text=orClean(n);if(/[\u3400-\u9fff]/u.test(text))paragraphs.push({hanzi:text,pinyin:''});
  }
 }
 paragraphs=(paragraphs||[]).filter(p=>/[\u3400-\u9fff]/u.test(p.hanzi));
 const text=paragraphs.map(p=>p.hanzi).join('\n');if(text.length<12||text.length>24000||paragraphs.length>100)throw Error('Không xác minh được bài đọc đầy đủ; chưa hiển thị nội dung.');
 const fallback=orAll(root,n=>n.tag==='h1')[0];title=title||(fallback?orClean(fallback):'Bài đọc gốc');
 return {url:canonical,title,site:host==='mandarinbean.com'?'Mandarin Bean':'HSK Reading',status:'original',paragraphs,fetchedAt:new Date().toISOString()};
}
export function extractOriginalIndex(html,host,hsk){
 const root=orTree(html),cards=orAll(root,n=>host==='mandarinbean.com'?n.attrs['data-elementor-type']==='loop-item':n.tag==='article');const found=new Map();
 for(const card of cards){
  const links=orAll(card,n=>n.tag==='a'&&n.attrs.href);
  const level=card.attrs.class?.match(/(?:tag-hsk|category-hsk-)([1-6])\b/)?.[1]||links.map(n=>n.attrs.href.match(/\/(?:tag\/hsk|category\/hsk-)([1-6])\//)?.[1]).find(Boolean);
  if(Number(level)!==hsk)continue;
  const link=links.find(n=>originalReadingURL(n.attrs.href)&&orClean(n));if(!link||new URL(link.attrs.href).hostname!==host)continue;
  const titleLinks=links.filter(n=>n.attrs.href===link.attrs.href&&orClean(n));const title=titleLinks.map(n=>orClean(n)).find(t=>/[\u3400-\u9fff]/u.test(t))||orClean(link);
  found.set(link.attrs.href,{url:link.attrs.href,title,hsk,site:host==='mandarinbean.com'?'Mandarin Bean':'HSK Reading'});
 }return [...found.values()].slice(0,30);
}
async function orBounded(response){
 if(!response.ok)throw Error('Nguồn trả lỗi '+response.status);
 if(!/text\/html/i.test(response.headers.get('content-type')||''))throw Error('Nguồn không trả trang HTML.');
 const reader=response.body.getReader(),decoder=new TextDecoder();let size=0,text='';
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>650000)throw Error('Trang nguồn vượt kích thước cho phép.');text+=decoder.decode(value,{stream:true});}return text+decoder.decode();}finally{await reader.cancel().catch(()=>{});}
}
export function createOriginalReadingService(fetchFn=fetch,{now=Date.now,cacheAPI=null}={}){
 const memory=new Map(),pending=new Map();
 async function cached(key,ttl,job){
  const saved=memory.get(key);if(saved&&saved.until>now())return saved.value;
  if(pending.has(key))return pending.get(key);
  const promise=(async()=>{const request=new Request('https://hsk-reading-cache.invalid/'+encodeURIComponent(key));
   if(cacheAPI)try{const hit=await cacheAPI.match(request);if(hit){const data=await hit.json();if(data.until>now())return data.value;}}catch{}
   const value=await job(),until=now()+ttl;if(memory.size>=80)memory.delete(memory.keys().next().value);memory.set(key,{until,value});
   if(cacheAPI)try{await cacheAPI.put(request,Response.json({until,value},{headers:{'Cache-Control':'public,max-age='+Math.floor(ttl/1000)}}));}catch{}
   return value;
  })();pending.set(key,promise);try{return await promise;}finally{pending.delete(key);}
 }
 async function download(url){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  try{return await orBounded(await fetchFn(url,{redirect:'manual',signal:controller.signal,headers:{Accept:'text/html'}}));}finally{clearTimeout(timer);}
 }
 return async body=>{
  if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(k=>!['op','hsk','url'].includes(k)))return {status:400,data:{error:'Yêu cầu bài gốc không hợp lệ.'}};
  try{
   if(body.op==='list'&&Number.isInteger(body.hsk)&&body.hsk>=1&&body.hsk<=6&&body.url==null){
    const hsk=body.hsk,results=await Promise.allSettled(OR_HOSTS.map(host=>cached('index-v1:'+host+':'+hsk,6*3600000,async()=>{
     const path=host==='mandarinbean.com'?'/tag/hsk'+hsk+'/':'/category/hsk-'+hsk+'/';
     const items=extractOriginalIndex(await download('https://'+host+path),host,hsk);if(!items.length)throw Error('Chưa đọc được danh sách từ '+host);return items;
    })));
    const items=results.flatMap(r=>r.status==='fulfilled'?r.value:[]),unavailable=OR_HOSTS.filter((_,i)=>results[i].status==='rejected');
    return {status:items.length?200:502,data:{items,unavailable,checkedAt:new Date(now()).toISOString(),...(items.length?{}:{error:'Hai nguồn chưa phản hồi hoặc đã thay đổi cấu trúc. Không tạo bài thay thế.'})}};
   }
   if(body.op==='article'&&body.hsk==null&&originalReadingURL(body.url)){
    const article=await cached('article-v1:'+body.url,12*3600000,async()=>extractOriginalReading(await download(body.url),body.url));
    return {status:200,data:{article}};
   }
   return {status:400,data:{error:'Chỉ nhận URL bài đọc từ Mandarin Bean và HSK Reading.'}};
  }catch(error){return {status:502,data:{error:'Chưa lấy được nguyên văn bài nguồn. '+(error.name==='AbortError'?'Nguồn phản hồi quá chậm.':error.message)+' Không dùng AI viết lại.'}};}
 };
}

