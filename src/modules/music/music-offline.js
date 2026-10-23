/* Device-only media. IndexedDB is separate from the versioned PWA cache. */
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
 async function put(owner,track,file,isCurrent=()=>true){
  if(!file||file.size<=0||file.size>50*1024*1024)throw Error('Chọn file M4A từ 1 byte đến 50 MB.');
  if(!/\.m4a$/i.test(file.name||''))throw Error('Chọn file .m4a đã chuẩn bị để nghe ngoại tuyến.');
  const bytes=await file.arrayBuffer();const h=new Uint8Array(bytes,0,Math.min(64,bytes.byteLength));
  if(!String.fromCharCode(...h).includes('ftyp'))throw Error('File này không phải tệp M4A/MP4 hợp lệ.');
  const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
  if(!isCurrent())throw new DOMException('Đã đổi tài khoản hoặc bài hát.','AbortError');
  const url=track.url||'offline:'+hash,id=identity(owner,url),blob=new Blob([bytes],{type:'audio/mp4'});
  await transaction('readwrite',async s=>{
   const [assets,tracks]=await Promise.all([request(s.assets.getAll()),request(s.tracks.getAll())]);
   const previous=tracks.find(t=>t.id===id),other=tracks.filter(t=>t.id!==id);
   const discard=previous&&previous.asset!==hash&&!other.some(t=>t.asset===previous.asset)?previous.asset:null;
   const total=assets.filter(a=>a.id!==discard).reduce((n,a)=>n+a.size,0)+(assets.some(a=>a.id===hash)?0:blob.size);
   if(total>LIMIT)throw Error('Kho nhạc đã đủ 100 MB. Xóa một bài ngoại tuyến trước khi thêm bài mới.');
   if(!isCurrent())throw new DOMException('Đã đổi tài khoản hoặc bài hát.','AbortError');
   if(discard)s.assets.delete(discard);
   s.assets.put({id:hash,blob,size:blob.size});
   s.tracks.put({id,owner,url,asset:hash,title:String(track.title||file.name.replace(/\.m4a$/i,'')).slice(0,120),author:String(track.author||'Nhạc trên thiết bị').slice(0,120),size:blob.size,addedAt:Date.now()});
  });return url;
 }
 async function get(owner,url){return transaction('readonly',async s=>{const track=await request(s.tracks.get(identity(owner,url)));if(!track)return null;const asset=await request(s.assets.get(track.asset));return asset?.blob?.size===track.size?{...track,blob:asset.blob}:null;});}
 async function remove(owner,url){return transaction('readwrite',async s=>{const id=identity(owner,url),track=await request(s.tracks.get(id));if(!track)return;s.tracks.delete(id);const all=await request(s.tracks.getAll());if(!all.some(t=>t.asset===track.asset))s.assets.delete(track.asset);});}
 window.HSKMusicOffline={list,usage,put,get,remove,limit:LIMIT};
})();
