/* Chinese voice choices are local to this device, never synced with study progress. */
(function(root){'use strict';
const base=new URL('./',document.currentScript.src),key='hsk-chinese-voice-selection-v1',aborted=()=>new DOMException('Đã hủy.','AbortError');
let selection={source:'device',voiceURI:'',voiceId:'',revision:0,assets:[]};try{const v=JSON.parse(localStorage.getItem(key));if(v&&['device','pack'].includes(v.source))selection={...selection,...v};}catch{}
const store=root.indexedDB?root.HSKVoiceStore.createStore(root.indexedDB):null;
let catalogPromise,installController,workerClient,workerRevision=-1,operation=0,speechRun=0,context,source,playReject,idleTimer;
const emit=()=>root.dispatchEvent(new CustomEvent('hsk-chinese-voice-change',{detail:{...selection}}));
function persist(v){if(v.revision<selection.revision)return;selection=v;try{localStorage.setItem(key,JSON.stringify(v));}catch{}emit();}
const ready=store?store.snapshot().then(v=>{selection=v;persist(v);}).catch(()=>{}):Promise.resolve();
const catalog=()=>catalogPromise||(catalogPromise=fetch(new URL('voice-catalog.json',base),{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Không tải được danh sách giọng.');return r.json();}).catch(e=>{catalogPromise=null;throw e;}));
function support(){return !!(root.WebAssembly?.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,10,1,8,0,65,0,253,15,253,98,11]))&&root.indexedDB&&root.Worker&&root.WebAssembly&&root.crypto?.subtle&&root.DecompressionStream&&(root.AudioContext||root.webkitAudioContext));}
function audioContext(){if(!context){const C=root.AudioContext||root.webkitAudioContext;if(!C)throw Error('Thiết bị chưa hỗ trợ âm thanh của gói giọng.');context=new C();}return context;}
function unlock(){try{audioContext().resume().catch(()=>{});}catch{}}
function stopAudio(){if(source){source.onended=null;try{source.stop();}catch{}source.disconnect();source=null;}if(playReject){const reject=playReject;playReject=null;reject(aborted());}}
function dispose(){clearTimeout(idleTimer);workerClient?.close();workerClient=null;workerRevision=-1;}
function client(){const worker=new Worker(new URL('voice-pack-worker.js',base)),pending=new Map();let sequence=0,closed=false;
 const close=(error=aborted())=>{if(closed)return;closed=true;worker.terminate();for(const p of pending.values()){clearTimeout(p.timer);p.reject(error);}pending.clear();};
 worker.onmessage=({data})=>{const p=pending.get(data.id);if(!p)return;pending.delete(data.id);clearTimeout(p.timer);if(data.error){const e=Error(data.error);p.reject(e);close(e);}else p.resolve(data);};worker.onerror=()=>close(Error('Không mở được bộ giọng trên thiết bị này.'));
 return {close,get closed(){return closed;},get busy(){return pending.size>0;},call(type,data={}){if(closed)return Promise.reject(aborted());return new Promise((resolve,reject)=>{const id=++sequence,timer=setTimeout(()=>{close(Error('Xử lý giọng quá lâu. Hãy thử giọng thiết bị.'));},180000);pending.set(id,{resolve,reject,timer});worker.postMessage({id,type,...data});});}};
}
async function bytes(asset,signal,onProgress){
 const response=await fetch(new URL(asset.url,base),{signal,cache:'no-store',credentials:'omit'});if(!response.ok)throw Error('Nguồn tải giọng tạm thời không khả dụng.');
 const reader=response.body?.getReader();let size=0;const parts=[];
 if(reader){try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>asset.bytes)throw Error('Dung lượng gói giọng không hợp lệ.');parts.push(value);onProgress(value.byteLength);}}catch(e){await reader.cancel().catch(()=>{});throw e;}finally{reader.releaseLock();}}
 else{const b=await response.arrayBuffer();parts.push(b);size=b.byteLength;onProgress(size);}
 if(size!==asset.bytes)throw Error('Tải giọng chưa đầy đủ. Hãy thử lại.');
 const blob=new Blob(parts,{type:asset.type||'application/octet-stream'}),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer())),n=>n.toString(16).padStart(2,'0')).join('');
 if(hash!==asset.sha256)throw Error('Gói giọng không vượt qua kiểm tra dữ liệu.');if(signal.aborted)throw aborted();return blob;
}
async function getAssets(v){const assets=[];for(const pair of v.files){const blob=await store.asset(pair[1]);if(!blob)throw Error('Gói giọng trên máy đã bị dọn. Hãy tải lại trong Giọng tiếng Trung.');assets.push([pair[0],blob]);}return assets;}
async function engine(){await ready;if(selection.source!=='pack')throw aborted();if(workerClient&&!workerClient.closed&&workerRevision===selection.revision){await workerClient.ready;return workerClient;}dispose();const revision=selection.revision,c=client();workerClient=c;workerRevision=revision;try{c.ready=getAssets(selection).then(assets=>c.call('init',{assets}));await c.ready;if(selection.revision!==revision)throw aborted();return c;}catch(e){if(workerClient===c)dispose();throw e;}}
async function install(voiceId,onProgress=()=>{}){
 if(!support())throw Error('Thiết bị chưa hỗ trợ gói giọng mở rộng. Bạn vẫn có thể chọn giọng thiết bị.');
 installController?.abort();const controller=new AbortController(),signal=controller.signal,run=++operation;installController=controller;let candidate;
 try{await ready;const before=await store.snapshot(),c=await catalog(),voice=c.voices.find(v=>v.id===voiceId);if(!voice)throw Error('Không tìm thấy giọng.');if(voice.downloadable===false)throw Error(voice.unavailableReason||'Giọng này hiện chỉ có demo.');
 const specs=[...c.shared,...(voice.assets||[{...voice.asset,role:'voice'}])],blobs=new Map(),files=[];let total=0,loaded=0;
 for(const spec of specs){const saved=await store.asset(spec.sha256);if(saved&&saved.size===spec.bytes)blobs.set(spec.sha256,saved);else total+=spec.bytes;files.push([spec.role,spec.sha256]);}
 const quota=await navigator.storage?.estimate?.().catch(()=>null);if(quota?.quota&&quota.quota-quota.usage<total*1.2)throw Error('Máy chưa đủ dung lượng trống để đổi giọng. Giọng cũ vẫn được giữ.');
 onProgress({phase:'download',loaded,total});
 for(const spec of specs){if(signal.aborted||run!==operation)throw aborted();if(!blobs.has(spec.sha256))blobs.set(spec.sha256,await bytes(spec,signal,n=>{loaded+=n;onProgress({phase:'download',loaded,total});}));}
 if(signal.aborted||run!==operation)throw aborted();stopAudio();dispose();onProgress({phase:'verify',loaded,total});candidate=client();const cancel=()=>candidate?.close();signal.addEventListener('abort',cancel,{once:true});
 try{await candidate.call('init',{assets:files.map(([role,hash])=>[role,blobs.get(hash)])});}finally{signal.removeEventListener('abort',cancel);}
 if(signal.aborted||run!==operation)throw aborted();
 const next=await store.replace(before.revision,{source:'pack',voiceURI:'',voiceId,engine:c.engine,assets:specs.map(v=>v.sha256),files},blobs,signal);
 persist(next);workerClient=candidate;workerRevision=next.revision;candidate=null;onProgress({phase:'done',loaded,total});scheduleIdle();return next;
 }finally{candidate?.close();if(installController===controller)installController=null;}
}
function cancelInstall(){operation++;installController?.abort();}
async function chooseDevice(voiceURI=''){cancelInstall();await ready;if(!store){persist({source:'device',voiceURI,voiceId:'',assets:[],revision:selection.revision+1});return;}const before=await store.snapshot(),next=await store.replace(before.revision,{source:'device',voiceURI,voiceId:'',assets:[],files:[]},new Map());stopAudio();dispose();persist(next);}
function scheduleIdle(){clearTimeout(idleTimer);idleTimer=setTimeout(()=>{if(workerClient?.busy||playReject)scheduleIdle();else dispose();},45000);}
async function speak(text,rate=.85,signal){
 const run=++speechRun;
 if(signal?.aborted)throw aborted();unlock();stopAudio();clearTimeout(idleTimer);const revision=selection.revision;
 const abort=()=>{speechRun++;stopAudio();if(workerClient?.busy)dispose();else scheduleIdle();};signal?.addEventListener('abort',abort,{once:true});
 try{const c=await engine();if(signal?.aborted||revision!==selection.revision||run!==speechRun)throw aborted();const result=await c.call('speak',{text:String(text),rate:Math.max(.5,Math.min(1.5,Number(rate)||.85))});if(signal?.aborted||revision!==selection.revision||run!==speechRun)throw aborted();
 const ac=audioContext();await ac.resume();if(signal?.aborted)throw aborted();const buffer=ac.createBuffer(1,result.samples.length,result.sampleRate);buffer.copyToChannel(result.samples,0);
 await new Promise((resolve,reject)=>{source=ac.createBufferSource();source.buffer=buffer;source.connect(ac.destination);playReject=reject;source.onended=()=>{source?.disconnect();source=null;playReject=null;resolve(true);};source.start();});
 }finally{signal?.removeEventListener('abort',abort);scheduleIdle();}
}
root.HSKVoiceManager={ready,catalog,support,install,cancelInstall,chooseDevice,speak,unlock,stop(){speechRun++;stopAudio();if(workerClient?.busy)dispose();else scheduleIdle();},get selection(){return {...selection};}};
root.addEventListener('storage',event=>{if(event.key===key&&store)store.snapshot().then(v=>{stopAudio();dispose();selection=v;emit();}).catch(()=>{});});
root.addEventListener('pagehide',()=>{cancelInstall();stopAudio();dispose();context?.close().catch(()=>{});context=null;});
})(window);
