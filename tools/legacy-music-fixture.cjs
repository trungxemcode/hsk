// Test-only seed function for verifying pre-rebuild IndexedDB cleanup/migration.
module.exports=async function seedLegacy(page){await page.evaluate(()=>{
 HSKLegacyMusicCleanup.put=async(owner,track,file)=>{
  const bytes=await file.arrayBuffer(),hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join(''),url=track.url||'offline:'+hash;
  const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('hsk-music-offline-v1',1);r.onupgradeneeded=()=>{r.result.createObjectStore('assets',{keyPath:'id'});r.result.createObjectStore('tracks',{keyPath:'id'});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  try{await new Promise((resolve,reject)=>{const tx=db.transaction(['tracks','assets'],'readwrite');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.objectStore('assets').put({id:hash,blob:new Blob([bytes],{type:file.type}),size:bytes.byteLength});tx.objectStore('tracks').put({id:JSON.stringify([owner,url]),owner,url,asset:hash,title:track.title||'Legacy music',author:'Legacy',size:bytes.byteLength,addedAt:Date.now()});});}finally{db.close();}
 };
 });};
