/* Read/delete legacy music only for explicit cleanup. No download/write/play API. */
(()=>{
 'use strict';
 const LIMIT=100*1024*1024,DB='hsk-music-offline-v1';
 const request=r=>new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
 function open(){return new Promise((resolve,reject)=>{
  if(!window.indexedDB){reject(Error('Trình duyệt này chưa hỗ trợ lưu nhạc ngoại tuyến.'));return;}
  const r=indexedDB.open(DB,1);
  r.onupgradeneeded=()=>{const db=r.result;db.createObjectStore('assets',{keyPath:'id'});db.createObjectStore('tracks',{keyPath:'id'});};
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('Đóng tab HSK cũ rồi thử lại.'));
 });}
 async function transaction(mode,fn){const db=await open();try{
  const tx=db.transaction(['assets','tracks'],mode),done=new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error||Error('Không thể lưu nhạc.'));tx.onerror=()=>{};});
  const stores={assets:tx.objectStore('assets'),tracks:tx.objectStore('tracks')};
  try{const result=await fn(stores);await done;return result;}catch(e){try{tx.abort();}catch{}await done.catch(()=>{});throw e;}
 }finally{db.close();}}
 const identity=(owner,url)=>{if(typeof owner!=='string'||!owner||owner.length>200||typeof url!=='string'||!url||url.length>2048)throw Error('Bài hát hoặc tài khoản không hợp lệ.');return JSON.stringify([owner,url]);};
 async function list(owner){return transaction('readonly',async s=>{
  const [tracks,assets]=await Promise.all([request(s.tracks.getAll()),request(s.assets.getAll())]);const ids=new Set(assets.filter(a=>a.blob?.size===a.size).map(a=>a.id));
  return tracks.filter(t=>t.owner===owner&&ids.has(t.asset)).sort((a,b)=>b.addedAt-a.addedAt).map(({id,owner,...row})=>row);
 });}
 async function usage(){return transaction('readonly',async s=>(await request(s.assets.getAll())).reduce((n,a)=>n+a.size,0));}
 async function remove(owner,url,expected){return transaction('readwrite',async s=>{const id=identity(owner,url),track=await request(s.tracks.get(id));if(!track)return;if(expected&&(track.asset!==expected.asset||track.addedAt!==expected.addedAt))throw Error('Bản nhạc đã thay đổi. Hãy xem lại danh sách trước khi xóa.');s.tracks.delete(id);const all=await request(s.tracks.getAll());if(!all.some(t=>t.asset===track.asset))s.assets.delete(track.asset);});}
 window.HSKLegacyMusicCleanup={list,usage,remove};
})();
