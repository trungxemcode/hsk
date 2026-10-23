/* Dedicated device-only store. Replacement and removal never touch study/music data. */
(function(root){'use strict';
const DB='hsk-chinese-voices-v1',empty=()=>({revision:0,source:'device',voiceURI:'',voiceId:'',assets:[]});
function open(indexedDB){return new Promise((resolve,reject)=>{const q=indexedDB.open(DB,1);q.onupgradeneeded=()=>{q.result.createObjectStore('assets');q.result.createObjectStore('settings');};q.onsuccess=()=>{q.result.onversionchange=()=>q.result.close();resolve(q.result);};q.onerror=()=>reject(q.error);q.onblocked=()=>reject(Error('Hãy đóng tab HSK khác rồi thử lại.'));});}
function createStore(indexedDB){let connection;
 const db=()=>connection||(connection=open(indexedDB).catch(e=>{connection=null;throw e;}));
 async function snapshot(){const d=await db();return new Promise((resolve,reject)=>{const t=d.transaction('settings'),q=t.objectStore('settings').get('selection');q.onsuccess=()=>resolve(q.result||empty());q.onerror=()=>reject(q.error);});}
 async function asset(key){const d=await db();return new Promise((resolve,reject)=>{const q=d.transaction('assets').objectStore('assets').get(key);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});}
 async function replace(expected,selection,blobs,signal){const d=await db();return new Promise((resolve,reject)=>{if(signal?.aborted){reject(new DOMException('Đã hủy.','AbortError'));return;}const t=d.transaction(['settings','assets'],'readwrite'),settings=t.objectStore('settings'),assets=t.objectStore('assets');let next,error;const cancel=()=>{error=new DOMException('Đã hủy.','AbortError');try{t.abort();}catch{}};signal?.addEventListener('abort',cancel,{once:true});const q=settings.get('selection');q.onsuccess=()=>{const old=q.result||empty();if(old.revision!==expected){error=Error('Giọng đã được đổi ở tab khác. Hãy mở lại danh sách.');t.abort();return;}next={...selection,revision:old.revision+1};for(const [key,blob] of blobs)assets.put(blob,key);const keys=assets.openKeyCursor();keys.onsuccess=()=>{const c=keys.result;if(!c)return;if(!next.assets.includes(c.key))assets.delete(c.key);c.continue();};settings.put(next,'selection');};t.oncomplete=()=>{signal?.removeEventListener('abort',cancel);resolve(next);};t.onabort=t.onerror=()=>{signal?.removeEventListener('abort',cancel);reject(error||t.error||Error('Không lưu được gói giọng.'));};});}
 return {snapshot,asset,replace};
}
const api={createStore,empty};if(typeof module==='object'&&module.exports)module.exports=api;else root.HSKVoiceStore=api;
})(typeof self==='object'?self:globalThis);
