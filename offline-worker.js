const OFFLINE_VERSION='hsk-offline-20261010-account-1';
const OFFLINE_FILES=["./", "index.html", "style.css", "mobile-layout.css", "mobile-layout.js", "account.js", "account-core.js", "account-config.json", "loader.js", "app.js", "push.js", "offline.js", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png", "push-config.json", "ios-transfer.html", "words.js", "dictionarySupplement.js", "checkedPracticeExamples.js", "exampleMetadata.js", "wordRelationsData.js", "usageFactsData.js", "confusableGroups.js", "contextQuizBank.js", "words.js.gz", "dictionarySupplement.js.gz", "checkedPracticeExamples.js.gz", "exampleMetadata.js.gz", "wordRelationsData.js.gz", "usageFactsData.js.gz", "confusableGroups.js.gz", "contextQuizBank.js.gz"];
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(OFFLINE_VERSION);
 try{for(const file of OFFLINE_FILES){const url=new URL(file,self.registration.scope);const response=await fetch(url,{cache:'reload'});if(!response.ok)throw Error('HTTP '+response.status+' '+file);await cache.put(url,response);}}
 catch(error){await caches.delete(OFFLINE_VERSION);throw error;}
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('hsk-offline-')&&key!==OFFLINE_VERSION)await caches.delete(key);await self.clients.claim();})()));
self.addEventListener('message',event=>{if(event.data?.type==='HSK_ACTIVATE_UPDATE')self.skipWaiting();if(event.data?.type==='HSK_OFFLINE_STATUS')event.ports[0]?.postMessage({ready:true,version:OFFLINE_VERSION});});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
 const relative=url.pathname.slice(new URL(self.registration.scope).pathname.length);
 if(event.request.mode==='navigate'&&(relative===''||relative==='index.html')){event.respondWith(caches.open(OFFLINE_VERSION).then(cache=>cache.match(new URL('index.html',self.registration.scope))));return;}
 if(!OFFLINE_FILES.includes(relative))return;
 event.respondWith((async()=>{const cache=await caches.open(OFFLINE_VERSION);const hit=await cache.match(new URL(relative,self.registration.scope));return hit||fetch(event.request);})());
});
