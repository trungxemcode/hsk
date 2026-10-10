const OFFLINE_VERSION='hsk-offline-20261010-reliable-1';
const OFFLINE_FILES=["index.html","style.css","mobile-layout.css","mobile-layout.js","account.js","account-core.js","account-config.json","loader.js","app.js","push.js","offline.js","manifest.webmanifest","icon-180.png","icon-192.png","icon-512.png","push-config.json","ios-transfer.html","words.js","dictionarySupplement.js","checkedPracticeExamples.js","exampleMetadata.js","wordRelationsData.js","usageFactsData.js","confusableGroups.js","contextQuizBank.js","words.js.gz","dictionarySupplement.js.gz","checkedPracticeExamples.js.gz","exampleMetadata.js.gz","wordRelationsData.js.gz","usageFactsData.js.gz","confusableGroups.js.gz","contextQuizBank.js.gz"];
let download={type:'HSK_DOWNLOAD_PROGRESS',done:0,total:OFFLINE_FILES.length,reused:0};
async function announce(value){download={...download,...value};for(const client of await self.clients.matchAll({includeUncontrolled:true,type:'window'}))client.postMessage(download);}
async function network(url,timeout=25000){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);try{const response=await fetch(url,{cache:'no-store',signal:controller.signal});if(!response.ok)throw Error('HTTP '+response.status);const bytes=await response.arrayBuffer();return {response,bytes};}finally{clearTimeout(timer);}}
async function digest(bytes){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');}
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(OFFLINE_VERSION);let cancelled=false;
 try{
  await announce({done:0,reused:0,phase:'manifest'});
  const raw=await network(new URL('app-version.json',self.registration.scope),12000),manifest=JSON.parse(new TextDecoder().decode(raw.bytes));
  if(manifest.version!==OFFLINE_VERSION)throw Error('Phiên bản trên máy chủ đã thay đổi; hãy kiểm tra lại.');
  const oldNames=(await caches.keys()).filter(k=>k.startsWith('hsk-offline-')&&k!==OFFLINE_VERSION),oldCaches=await Promise.all(oldNames.reverse().map(k=>caches.open(k)));let cursor=0;
  async function task(){while(cursor<OFFLINE_FILES.length&&!cancelled){const file=OFFLINE_FILES[cursor++],asset=manifest.assets[file],url=new URL(file,self.registration.scope);if(!asset?.sha256)throw Error('Thiếu thông tin '+file);let response=null;
   for(const previous of oldCaches){const hit=await previous.match(url);if(!hit)continue;const hash=hit.headers.get('X-HSK-Asset-Hash')||await digest(await hit.clone().arrayBuffer());if(hash===asset.sha256){response=hit;break;}}
   const reused=!!response;
   if(!response){const result=await network(url);if(await digest(result.bytes)!==asset.sha256)throw Error('Tệp '+file+' chưa khớp phiên bản. Hãy thử lại.');response=new Response(result.bytes,{status:result.response.status,headers:result.response.headers});}
   const headers=new Headers(response.headers);headers.delete('content-encoding');headers.delete('content-length');headers.delete('transfer-encoding');headers.set('X-HSK-Asset-Hash',asset.sha256);await cache.put(url,new Response(response.body,{status:response.status,headers}));
   await announce({phase:'files',done:download.done+1,reused:download.reused+(reused?1:0)});
  }}
  const jobs=Array.from({length:4},()=>task().catch(error=>{cancelled=true;throw error;})),results=await Promise.allSettled(jobs),failed=results.find(x=>x.status==='rejected');if(failed)throw failed.reason;
  await announce({phase:'ready'});
 }catch(error){await caches.delete(OFFLINE_VERSION);await announce({phase:'error',error:error.name==='AbortError'?'Tải quá lâu; hãy bấm kiểm tra lại.':error.message});throw error;}
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('hsk-offline-')&&key!==OFFLINE_VERSION)await caches.delete(key);await self.clients.claim();})()));
self.addEventListener('message',event=>{if(event.data?.type==='HSK_ACTIVATE_UPDATE')self.skipWaiting();if(event.data?.type==='HSK_OFFLINE_STATUS')event.ports[0]?.postMessage({ready:true,version:OFFLINE_VERSION});if(event.data?.type==='HSK_DOWNLOAD_STATUS')event.source?.postMessage(download);});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
 const relative=url.pathname.slice(new URL(self.registration.scope).pathname.length);
 if(event.request.mode==='navigate'&&(relative===''||relative==='index.html')){event.respondWith(caches.open(OFFLINE_VERSION).then(async cache=>await cache.match(new URL('index.html',self.registration.scope))||fetch(event.request)));return;}
 // Version metadata always goes to the network, never the offline cache.
 if(!OFFLINE_FILES.includes(relative))return;
 event.respondWith((async()=>{const cache=await caches.open(OFFLINE_VERSION),hit=await cache.match(new URL(relative,self.registration.scope));return hit||fetch(event.request);})());
});
