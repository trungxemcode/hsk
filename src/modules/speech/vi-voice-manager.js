/* Device-local offline Vietnamese Piper VITS voice pack for browsers lacking vi-VN voices (e.g. Windows Chrome). */
(function(root){'use strict';
const base=new URL('./',document.currentScript.src),DB='hsk-vietnamese-voices-v1',key='hsk-vi-voice-selection-v1',aborted=()=>new DOMException('Đã hủy.','AbortError');
const empty=()=>({revision:0,source:'device',voiceId:'',assets:[],files:[]});
let selection=empty();try{const v=JSON.parse(localStorage.getItem(key));if(v&&['device','pack'].includes(v.source))selection={...selection,...v};}catch{}
function openDb(onReset){return new Promise((resolve,reject)=>{const q=root.indexedDB.open(DB,1);q.onupgradeneeded=()=>{if(!q.result.objectStoreNames.contains('assets'))q.result.createObjectStore('assets');if(!q.result.objectStoreNames.contains('settings'))q.result.createObjectStore('settings');};q.onsuccess=()=>{const d=q.result;d.onversionchange=()=>{onReset();d.close();};d.onclose=()=>onReset();resolve(d);};q.onerror=()=>reject(q.error);q.onblocked=()=>reject(Error('Hãy đóng tab HSK khác rồi thử lại.'));});}
const store=root.indexedDB?(()=>{let connection;const reset=()=>{connection=null;};const db=()=>connection||(connection=openDb(reset).catch(e=>{connection=null;throw e;}));
 async function snapshot(){const d=await db();return new Promise((resolve,reject)=>{const q=d.transaction('settings').objectStore('settings').get('selection');q.onsuccess=()=>resolve(q.result||empty());q.onerror=()=>reject(q.error);});}
 async function asset(k){const d=await db();return new Promise((resolve,reject)=>{const q=d.transaction('assets').objectStore('assets').get(k);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});}
 async function replace(expected,sel,blobs,signal){const d=await db();return new Promise((resolve,reject)=>{if(signal?.aborted){reject(aborted());return;}const t=d.transaction(['settings','assets'],'readwrite'),settings=t.objectStore('settings'),assets=t.objectStore('assets');let next,error;const cancel=()=>{error=aborted();try{t.abort();}catch{}};signal?.addEventListener('abort',cancel,{once:true});const q=settings.get('selection');q.onsuccess=()=>{const old=q.result||empty();if(old.revision!==expected){error=Error('Giọng Việt đã thay đổi ở tab khác.');t.abort();return;}next={...sel,revision:old.revision+1};for(const [k,blob] of blobs)assets.put(blob,k);const keys=assets.openKeyCursor();keys.onsuccess=()=>{const c=keys.result;if(!c)return;if(!next.assets.includes(c.key))assets.delete(c.key);c.continue();};settings.put(next,'selection');};t.oncomplete=()=>{signal?.removeEventListener('abort',cancel);resolve(next);};t.onabort=t.onerror=()=>{signal?.removeEventListener('abort',cancel);reject(error||t.error||Error('Không lưu được gói giọng Việt.'));};});}
 async function usage(){const d=await db();return new Promise((resolve,reject)=>{let total=0;const t=d.transaction('assets'),q=t.objectStore('assets').openCursor();q.onsuccess=()=>{const c=q.result;if(c){total+=c.value?.size||0;c.continue();}};t.oncomplete=()=>resolve(total);t.onabort=t.onerror=()=>reject(t.error||Error('Không đọc được dung lượng giọng Việt.'));});}
 return {snapshot,asset,replace,usage};
})():null;

let catalogPromise,installController,workerClient,workerRevision=-1,operation=0,speechRun=0,context,source,playReject,idleTimer,synthQueue=Promise.resolve();
const pcmCache=new Map(),inflightSynth=new Map(),MAX_PCM_CACHE=32;
const clearSynthCache=()=>{for(const entry of inflightSynth.values())entry.cancelled=true;pcmCache.clear();inflightSynth.clear();};
const cancelQueuedPrefetches=(keepKey='')=>{for(const [k,entry] of inflightSynth)if(entry.isPrefetch&&k!==keepKey)entry.cancelled=true;};
const emit=()=>root.dispatchEvent(new CustomEvent('hsk-vi-voice-change',{detail:{...selection}}));
function persist(v){if(v.revision<selection.revision)return;selection=v;try{localStorage.setItem(key,JSON.stringify(v));}catch{}emit();}
const ready=store?store.snapshot().then(v=>{selection=v;persist(v);}).catch(()=>{}):Promise.resolve();
const catalog=()=>catalogPromise||(catalogPromise=fetch(new URL('vi-voice-catalog.json',base),{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Không tải được danh sách giọng Việt offline.');return r.json();}).catch(e=>{catalogPromise=null;throw e;}));
function support(){return !!(root.WebAssembly?.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,10,1,8,0,65,0,253,15,253,98,11]))&&root.indexedDB&&root.Worker&&root.WebAssembly&&root.crypto?.subtle&&root.DecompressionStream&&(root.AudioContext||root.webkitAudioContext));}
function audioContext(){if(!context||context.state==='closed'){const C=root.AudioContext||root.webkitAudioContext;if(!C)throw Error('Thiết bị chưa hỗ trợ âm thanh của gói giọng Việt.');context=new C();}return context;}
function unlock(){try{if(root.navigator?.audioSession&&root.navigator.audioSession.type!=='play-and-record')root.navigator.audioSession.type='playback';}catch{}try{audioContext().resume().catch(()=>{});}catch{}}
function stopAudio(){if(source){source.onended=null;try{source.stop();}catch{}source.disconnect();source=null;}if(playReject){const reject=playReject;playReject=null;reject(aborted());}}
function dispose(){clearTimeout(idleTimer);clearSynthCache();workerClient?.close();workerClient=null;workerRevision=-1;}
async function isReadableBlob(blob,expectedBytes){if(!blob||typeof blob.size!=='number')return false;if(expectedBytes!==undefined&&blob.size!==expectedBytes)return false;if(typeof blob.slice==='function'){try{await blob.slice(0,1).arrayBuffer();}catch{return false;}}return true;}
function client(){const worker=new Worker(new URL('voice-pack-worker.js',base)),pending=new Map();let sequence=0,closed=false;
 const close=(error=aborted())=>{if(closed)return;closed=true;worker.terminate();for(const p of pending.values()){clearTimeout(p.timer);p.reject(error);}pending.clear();};
 worker.onmessage=({data})=>{const p=pending.get(data.id);if(!p)return;pending.delete(data.id);clearTimeout(p.timer);if(data.error){const e=Error(data.error);p.reject(e);close(e);}else p.resolve(data);};worker.onerror=()=>close(Error('Không mở được bộ giọng Việt trên thiết bị này.'));
 return {close,get closed(){return closed;},get busy(){return pending.size>0;},call(type,data={}){if(closed)return Promise.reject(aborted());return new Promise((resolve,reject)=>{const id=++sequence,timer=setTimeout(()=>{close(Error('Xử lý giọng Việt quá lâu. Hãy thử lại.'));},180000);pending.set(id,{resolve,reject,timer});worker.postMessage({id,type,...data});});}};
}
async function fetchAssetBytes(asset,signal,onProgress){
 const isLocalText=!/^https?:\/\//i.test(asset.url)&&asset.type==='text/javascript';
 const maxBytes=isLocalText?Math.ceil(asset.bytes*1.15):asset.bytes;
 const response=await fetch(new URL(asset.url,base),{signal,cache:'no-store',credentials:'omit'});if(!response.ok)throw Error('Nguồn tải giọng Việt tạm thời không khả dụng.');
 const reader=response.body?.getReader();let size=0;const parts=[];
 if(reader){try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>maxBytes)throw Error('Dung lượng gói giọng Việt không hợp lệ.');parts.push(value);onProgress(value.byteLength);}}catch(e){await reader.cancel().catch(()=>{});throw e;}finally{reader.releaseLock();}}
 else{const b=await response.arrayBuffer();parts.push(b);size=b.byteLength;onProgress(size);}
 if(!isLocalText&&size!==asset.bytes)throw Error('Tải giọng Việt chưa đầy đủ. Hãy thử lại.');
 const blob=new Blob(parts,{type:asset.type||'application/octet-stream'});
 if(!isLocalText){
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer())),n=>n.toString(16).padStart(2,'0')).join('');
  if(hash!==asset.sha256)throw Error('Gói giọng Việt không vượt qua kiểm tra dữ liệu.');
 }
 if(signal.aborted)throw aborted();return blob;
}
async function getAssets(v){const assets=[];for(const pair of v.files){let blob=null;try{blob=await store.asset(pair[1]);}catch{blob=null;}if(!(await isReadableBlob(blob)))throw Error('Gói giọng Việt trên máy đã bị dọn. Hãy tải lại trong Giọng Việt.');assets.push([pair[0],blob]);}return assets;}
async function engine(){await ready;if(selection.source!=='pack')throw aborted();if(workerClient&&!workerClient.closed&&workerRevision===selection.revision){await workerClient.ready;return workerClient;}dispose();const revision=selection.revision,c=client();workerClient=c;workerRevision=revision;try{c.ready=getAssets(selection).then(assets=>c.call('init',{assets,verify:false}));await c.ready;if(selection.revision!==revision)throw aborted();return c;}catch(e){if(workerClient===c)dispose();throw e;}}
function warmUp(){if(selection.source!=='pack')return;engine().then(()=>scheduleIdle()).catch(()=>{});}
async function install(voiceIdOrProgress,maybeProgress){
 const voiceId=typeof voiceIdOrProgress==='string'?voiceIdOrProgress:'';
 const onProgress=typeof voiceIdOrProgress==='function'?voiceIdOrProgress:(typeof maybeProgress==='function'?maybeProgress:()=>{});
 if(!support())throw Error('Trình duyệt này chưa hỗ trợ gói giọng Việt offline.');
 installController?.abort();const controller=new AbortController(),signal=controller.signal,run=++operation;installController=controller;let candidate;
 try{await ready;const before=await store.snapshot(),c=await catalog(),voice=(voiceId&&c.voices.find(v=>v.id===voiceId))||c.voices[0];
 const specs=[...c.shared,...voice.assets],blobs=new Map(),newBlobs=new Map(),files=[];let total=0,loaded=0;
 for(const spec of specs){let saved=null;try{saved=await store.asset(spec.sha256);}catch{saved=null;}if(await isReadableBlob(saved,spec.bytes))blobs.set(spec.sha256,saved);else total+=spec.bytes;files.push([spec.role,spec.sha256]);}
 const quota=await navigator.storage?.estimate?.().catch(()=>null);if(quota?.quota&&quota.quota-quota.usage<total*1.2)throw Error('Máy chưa đủ dung lượng trống để tải giọng Việt offline.');
 onProgress({phase:'download',loaded,total});
 for(const spec of specs){if(signal.aborted||run!==operation)throw aborted();if(!blobs.has(spec.sha256)){const fetched=await fetchAssetBytes(spec,signal,n=>{loaded+=n;onProgress({phase:'download',loaded,total});});blobs.set(spec.sha256,fetched);newBlobs.set(spec.sha256,fetched);}}
 if(signal.aborted||run!==operation)throw aborted();stopAudio();dispose();onProgress({phase:'verify',loaded,total});candidate=client();const cancel=()=>candidate?.close();signal.addEventListener('abort',cancel,{once:true});
 try{await candidate.call('init',{assets:files.map(([role,hash])=>[role,blobs.get(hash)]),verify:true,verifyText:'Xin chào, chúng ta cùng học tiếng Trung nhé.'});}finally{signal.removeEventListener('abort',cancel);}
 if(signal.aborted||run!==operation)throw aborted();
 const next=await store.replace(before.revision,{source:'pack',voiceId:voice.id,voiceLabel:voice.label,engine:c.engine,assets:specs.map(v=>v.sha256),files},newBlobs,signal);
 persist(next);workerClient=candidate;workerRevision=next.revision;candidate=null;onProgress({phase:'done',loaded,total});scheduleIdle();return next;
 }finally{candidate?.close();if(installController===controller)installController=null;}
}
function cancelInstall(){operation++;installController?.abort();}
async function remove(){cancelInstall();await ready;if(!store){persist({...empty(),revision:selection.revision+1});return;}const before=await store.snapshot();const next=await store.replace(before.revision,{source:'device',voiceId:'',assets:[],files:[]},new Map());stopAudio();dispose();persist(next);}
function scheduleIdle(){clearTimeout(idleTimer);idleTimer=setTimeout(()=>{if(workerClient?.busy||playReject||inflightSynth.size)scheduleIdle();else dispose();},300000);}
function cachePut(cacheKey,value){if(pcmCache.has(cacheKey))pcmCache.delete(cacheKey);pcmCache.set(cacheKey,value);while(pcmCache.size>MAX_PCM_CACHE)pcmCache.delete(pcmCache.keys().next().value);}
function synthesize(text,rate=1,{isPrefetch=false}={}){
 const clean=String(text||'').trim();if(!clean)return Promise.reject(aborted());
 const r=Math.max(.6,Math.min(1.6,Number(rate)||1));
 const rev=selection.revision,cacheKey=`${rev}|${r.toFixed(2)}|${clean}`;
 if(pcmCache.has(cacheKey)){const hit=pcmCache.get(cacheKey);cachePut(cacheKey,hit);return Promise.resolve(hit);}
 const existing=inflightSynth.get(cacheKey);
 if(existing){if(!isPrefetch){if(!existing.cancelled){existing.isPrefetch=false;cancelQueuedPrefetches(cacheKey);return existing.promise;}inflightSynth.delete(cacheKey);}else if(!existing.cancelled){return existing.promise;}}
 if(!isPrefetch)cancelQueuedPrefetches(cacheKey);
 const entry={isPrefetch,cancelled:false,promise:null};
 const task=synthQueue.catch(()=>{}).then(async()=>{
  if(entry.isPrefetch&&entry.cancelled)throw aborted();
  if(pcmCache.has(cacheKey))return pcmCache.get(cacheKey);
  const c=await engine();
  if(selection.source!=='pack'||selection.revision!==rev)throw aborted();
  clearTimeout(idleTimer);
  const result=await c.call('speak',{text:clean,rate:r});
  if(selection.revision===rev&&result?.samples)cachePut(cacheKey,result);
  return result;
 });
 entry.promise=task;
 synthQueue=task.catch(()=>{});
 inflightSynth.set(cacheKey,entry);
 task.finally(()=>{if(inflightSynth.get(cacheKey)===entry)inflightSynth.delete(cacheKey);scheduleIdle();}).catch(()=>{});
 return task;
}
function prefetch(text,rate=1){if(selection.source!=='pack')return;const clean=String(text||'').trim();if(!clean)return;synthesize(clean,rate,{isPrefetch:true}).catch(()=>{});}
async function speak(text,rate=1,signal){
 const run=++speechRun;
 if(signal?.aborted)throw aborted();unlock();stopAudio();clearTimeout(idleTimer);const revision=selection.revision;
 const abort=()=>{speechRun++;stopAudio();scheduleIdle();};signal?.addEventListener('abort',abort,{once:true});
 try{const result=await synthesize(text,rate,{isPrefetch:false});if(signal?.aborted||revision!==selection.revision||run!==speechRun)throw aborted();
 const ac=audioContext();await ac.resume();if(signal?.aborted||run!==speechRun)throw aborted();const buffer=ac.createBuffer(1,result.samples.length,result.sampleRate);buffer.copyToChannel(result.samples,0);
 await new Promise((resolve,reject)=>{source=ac.createBufferSource();source.buffer=buffer;source.connect(ac.destination);playReject=reject;source.onended=()=>{source?.disconnect();source=null;playReject=null;resolve(true);};source.start();});
 }finally{signal?.removeEventListener('abort',abort);scheduleIdle();}
}
root.HSKViVoiceManager={ready,catalog,support,install,cancelInstall,remove,speak,prefetch,warmUp,unlock,async downloaded(){await ready;const snap=store?await store.snapshot():{...selection};return {installed:snap.source==='pack',selection:snap,bytes:store?await store.usage():0};},get installing(){return !!installController;},stop(){speechRun++;stopAudio();scheduleIdle();},get selection(){return {...selection};}};
root.addEventListener('storage',event=>{if(event.key===key&&store)store.snapshot().then(v=>{stopAudio();dispose();selection=v;emit();}).catch(()=>{});});
root.addEventListener('pagehide',()=>{cancelInstall();stopAudio();dispose();context?.close().catch(()=>{});context=null;});
})(window);
