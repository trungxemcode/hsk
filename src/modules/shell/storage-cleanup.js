/* Only explicitly allowlisted optional downloads. Never enumerate/delete app caches or progress. */
(function(root){'use strict';
const packages=[
 ['hsk-music-codec-v1','Bộ nén nhạc cũ','Không cần cho cách lưu file MP3/M4A hiện tại.'],
 ['hsk-handwriting-neural-ppocrv5-ort122-v1','Nhận dạng viết tay nâng cao','Cần tải lại để dùng nhận dạng nâng cao.'],
 ['hsk-writing-data-2','Dữ liệu nét chữ đã xem','Tải lại khi mở chữ tương ứng.'],
 ['hsk-open-dictionary-cedict-v1','Từ điển mở rộng đã tra','Cần mạng để tải lại các phần đã xóa.']
];
const owner=()=>root.HSKAccountDashboard?.user?.uid||(()=>{try{return JSON.parse(localStorage.getItem('hsk-account-meta-v1'))?.uid||'guest';}catch{return 'guest';}})();
const size=n=>n<1024?n+' B':(n<1048576?n/1024:n/1048576).toLocaleString('vi-VN',{maximumFractionDigits:2})+(n<1048576?' KiB':' MiB');
const dialog=document.createElement('dialog');dialog.id='storageCleanupDialog';dialog.className='storage-cleanup';dialog.setAttribute('aria-labelledby','storageCleanupTitle');
dialog.innerHTML='<h2 id="storageCleanupTitle">Dọn dẹp dung lượng</h2><p class="hint">Chỉ hiển thị dữ liệu tải thêm trên thiết bị này. Gói chạy app, demo đi kèm và tiến độ học được giữ nguyên. Giọng có sẵn của máy không nằm trong danh sách.</p><p id="storageCleanupTotal"></p><section class="storage-transfer-panel" aria-label="Chuyển sang trình duyệt mới"><strong>Chuẩn bị cài HSK trong Cốc Cốc hoặc trình duyệt khác</strong><p>Gói học HSK cơ bản được bản cài mới tự tải. Gói tải thêm ở Safari KHÔNG được chia sẻ với Cốc Cốc; các file riêng và tiến độ học vẫn nằm trong Safari.</p><p>Chỉ dọn dữ liệu tải thêm (gói giọng, mô hình và cache mở rộng). Không xóa nhạc cá nhân, tài khoản, tiến độ học, hay dữ liệu ứng dụng cốt lõi.</p><div class="storage-transfer-controls"><button id="storageCleanupResetExtras" type="button">Xóa tất cả gói tải thêm</button><button id="storageCleanupInstallExtras" type="button">Tải lại gói mở rộng tại đây</button></div><p id="storageTransferStatus" role="status" aria-live="polite"></p></section><div id="storageCleanupList" class="storage-cleanup-list"></div><p id="storageCleanupStatus" role="status" aria-live="polite"></p><div class="storage-cleanup-actions"><button id="storageCleanupAll" type="button">Chọn tất cả</button><button id="storageCleanupDelete" type="button" disabled>Xóa mục đã chọn</button><button id="storageCleanupRefresh" type="button">Làm mới</button><button id="storageCleanupClose" type="button">Xong</button></div>';
document.body.append(dialog);
const q=id=>document.getElementById(id),list=q('storageCleanupList'),status=q('storageCleanupStatus'),transferStatus=q('storageTransferStatus');
let rows=[],busy=false,scan=0,scanOwner='',focus,confirmExtras=false,installBusy=false,installAbort=null;
function stopConfirm(){confirmExtras=false;q('storageCleanupResetExtras').textContent='Xóa tất cả gói tải thêm';}
function transferControls(){q('storageCleanupResetExtras').disabled=busy||installBusy;q('storageCleanupInstallExtras').disabled=busy||installBusy;}
function controls(){const selected=rows.filter(r=>r.input.checked);q('storageCleanupDelete').disabled=busy||!selected.length;q('storageCleanupDelete').textContent=selected.length?'Xóa '+selected.length+' mục đã chọn':'Xóa mục đã chọn';q('storageCleanupAll').disabled=busy||!rows.length;q('storageCleanupRefresh').disabled=busy;for(const r of rows)r.input.disabled=busy;transferControls();}
function add(row){const label=document.createElement('label');label.className='storage-cleanup-row';const input=document.createElement('input');input.type='checkbox';input.dataset.package=row.id;input.setAttribute('aria-label',row.name);const copy=document.createElement('span');copy.className='storage-cleanup-copy';const title=document.createElement('strong'),detail=document.createElement('small');title.textContent=row.name;detail.textContent=size(row.bytes)+' · '+row.note;copy.append(title,detail);label.append(input,copy);input.onchange=controls;list.append(label);rows.push({...row,input});}
async function refresh(message=''){
 stopConfirm();
 const token=++scan,uid=owner();q('storageCleanupAll').textContent='Chọn tất cả';scanOwner=uid;busy=true;rows=[];list.replaceChildren();status.textContent='Đang tính dung lượng tải thêm…';controls();const found=[],errors=[];
 try{
  if(root.HSKVoiceManager){try{const v=await root.HSKVoiceManager.downloaded();if(v.bytes>0){let name=v.selection.voiceId||'Gói giọng đã tải';try{const c=await root.HSKVoiceManager.catalog();name=c.voices.find(x=>x.id===v.selection.voiceId)?.label||name;}catch{}found.push({id:'voice',name:'Giọng tiếng Trung · '+name,bytes:v.bytes,revision:v.selection.revision,voiceURI:v.selection.source==='device'?v.selection.voiceURI:'',note:'Xóa gói giọng và bộ chạy tải thêm; trở về giọng thiết bị.'});}}catch{errors.push('gói giọng');}}
  if(root.HSKLegacyMusicCleanup){try{for(const t of await root.HSKLegacyMusicCleanup.list(uid))found.push({id:'music:'+t.url,name:t.title,bytes:t.size,asset:t.asset,addedAt:t.addedAt,url:t.url,note:'Nhạc đã lưu từ bản cũ · '+(t.author||'Trên thiết bị')});}catch{errors.push('nhạc ngoại tuyến');}}
  if(root.caches){let names;try{names=await caches.keys();}catch{errors.push('gói bổ sung');names=[];}for(const [id,name,note] of packages){if(!names.includes(id))continue;try{const cache=await caches.open(id),keys=await cache.keys();let bytes=0;for(const key of keys){const r=await cache.match(key);if(r){if(r.type==='opaque')throw Error('Không đo được');bytes+=(await r.blob()).size;}}if(keys.length)found.push({id,name,note,bytes,keys});}catch{errors.push(name);}}}
  if(token!==scan)return;if(uid!==owner())return refresh('Tài khoản đã thay đổi.');
  for(const row of found)add(row);
  const assets=new Set();let total=0;for(const r of rows){if(r.asset&&assets.has(r.asset))continue;if(r.asset)assets.add(r.asset);total+=r.bytes;}
  q('storageCleanupTotal').textContent='Dữ liệu tải thêm: '+size(total)+(rows.some(r=>r.asset)?' · nhạc của tài khoản hiện tại':'');
  status.textContent=[message,rows.length?'Chọn những mục bạn muốn xóa. Các gói có thể tải lại khi cần.':'Chưa có dữ liệu tải thêm để dọn.',errors.length?'Chưa đọc được '+errors.join(', ')+'. Bấm Làm mới để thử lại.':''].filter(Boolean).join(' ');
 }finally{if(token===scan){busy=false;controls();}}
}

// Bulk migration cleanup is explicitly limited to already-allowlisted optional
// caches plus the downloadable voice pack. User-owned offline music remains.
q('storageCleanupResetExtras').onclick=async()=>{
 if(busy||installBusy||scanOwner!==owner())return;
 const selected=rows.filter(r=>r.id==='voice'||packages.some(p=>p[0]===r.id));
 if(!selected.length){transferStatus.textContent='Chưa có gói tải thêm để xóa. Các file cá nhân không bị ảnh hưởng.';return;}
 if(!confirmExtras){
  confirmExtras=true;
  q('storageCleanupResetExtras').textContent='Xác nhận xóa '+selected.length+' gói';
  transferStatus.textContent='Chạm thêm lần nữa để xóa '+selected.length+' gói tải thêm. Không xóa nhạc người dùng, tiến độ học, dữ liệu cốt lõi. Nếu cài từ Cốc Cốc, bạn vẫn phải tải gói mở rộng vào vùng lưu trữ riêng của bản cài mới.';
  return;
 }
 stopConfirm();
 if((selected.some(r=>r.id==='voice')&&root.HSKVoiceManager?.installing)||(selected.some(r=>r.id==='hsk-handwriting-neural-ppocrv5-ort122-v1')&&root.HSKHandwritingDownloads?.busy)){
  transferStatus.textContent='Một gói đang chạy. Hãy dừng tác vụ tải trước khi xóa.';return;
 }
 const uid=owner();busy=true;controls();let count=0;const failures=[],cleared=[];
 try{
  for(const row of selected){
   if(uid!==owner()){failures.push('Tài khoản đã đổi');break;}
   try{
    if(row.id==='voice')await root.HSKVoiceManager.chooseDevice(row.voiceURI,row.revision);
    else{
     const cache=await caches.open(row.id);
     // Do not erase unrelated new entries or other cache namespaces.
     for(const request of row.keys)await cache.delete(request);
     cleared.push(row.id);
    }
    count++;
   }catch(e){failures.push(row.name+': '+e.message);}
  }
  root.dispatchEvent(new CustomEvent('hsk-storage-cleaned',{detail:{musicUrls:[],packages:cleared}}));
 }finally{busy=false;await refresh('Đã dọn '+count+' / '+selected.length+' gói tải thêm.');}
 transferStatus.textContent=failures.length?'Có mục chưa xóa: '+failures.join('; '):'Đã dọn xong gói tải thêm. Bản HSK trên trình duyệt khác cần tải lại từ Internet; dữ liệu Safari không được tự chuyển sang đó.';
};
async function fetchVerifiedNeural(signal,onStep){
 if(!root.caches||!root.crypto?.subtle)throw Error('Trình duyệt không hỗ trợ kho mô hình.');
 const configResponse=await fetch('./handwriting-neural-config.json',{signal,cache:'no-store'});
 if(!configResponse.ok)throw Error('Không đọc được cấu hình mô hình.');
 const config=await configResponse.json();
 const cache=await caches.open('hsk-handwriting-neural-ppocrv5-ort122-v1');
 for(const [name,asset] of Object.entries(config.assets||{})){
  if(signal.aborted)throw new DOMException('Đã hủy.','AbortError');
  if(!asset||typeof asset.url!=='string'||!/^[a-f0-9]{64}$/.test(asset.sha256)||!Number.isSafeInteger(asset.bytes)||asset.bytes>40*1024*1024)throw Error('Cấu hình mô hình không an toàn.');
  const parsed=new URL(asset.url,location.href);
  if(parsed.protocol!=='https:'||!['huggingface.co','cdn.jsdelivr.net'].includes(parsed.hostname)||parsed.username||parsed.password||parsed.hash||parsed.port)throw Error('Nguồn tải mô hình không được phép.');
  const hit=await cache.match(asset.url);
  if(hit&&Number(hit.headers.get('Content-Length'))===asset.bytes){/* Verify anyway below; stale model must not be trusted. */}
  if(hit){
   const data=await hit.arrayBuffer();
   const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),x=>x.toString(16).padStart(2,'0')).join('');
   if(hash===asset.sha256&&data.byteLength===asset.bytes){onStep('Mô hình '+name+' đã có sẵn.');continue;}
   await cache.delete(asset.url);
  }
  onStep('Đang tải mô hình '+name+'…');
  const response=await fetch(asset.url,{signal,cache:'no-store'});
  if(!response.ok||response.type==='opaque')throw Error('Không tải được mô hình '+name+'.');
  if(Number(response.headers.get('Content-Length')||0)>asset.bytes)throw Error('Tệp mô hình vượt giới hạn.');
  const data=await response.arrayBuffer();
  if(data.byteLength!==asset.bytes)throw Error('Dung lượng mô hình không khớp.');
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),x=>x.toString(16).padStart(2,'0')).join('');
  if(hash!==asset.sha256)throw Error('Checksum mô hình không chính xác.');
  await cache.put(asset.url,new Response(data,{headers:{'Content-Type':asset.type||'application/octet-stream'}}));
 }
}
q('storageCleanupInstallExtras').onclick=async()=>{
 if(busy||installBusy)return;
 if(!navigator.onLine){transferStatus.textContent='Cần mạng để tải các gói mở rộng.';return;}
 const agreement=await new Promise(resolve=>{
  // Browser-native confirmation is only used for the potentially >100 MB payload.
  resolve(root.confirm('Tải lại gói giọng YunJian (~99 MB) và mô hình viết tay nâng cao (~28 MB) trên CHÍNH trình duyệt đang mở? Cần kết nối mạng ổn định, bộ nhớ trống và giữ ứng dụng ở tiền cảnh. Các gói từ Safari không thể sao chép qua Cốc Cốc.'))
 });
 if(!agreement)return;
 installBusy=true;installAbort=new AbortController();transferControls();
 const failures=[];
 try{
  if(!root.HSKVoiceManager)failures.push('Không có quản lý giọng.');
  else{
   transferStatus.textContent='Đang kiểm tra và tải giọng YunJian…';
   try{await root.HSKVoiceManager.install('zm_yunjian',progress=>{
    if(installAbort?.signal.aborted)return;
    if(progress.total)transferStatus.textContent='Giọng YunJian: '+Math.round(progress.loaded/progress.total*100)+'%';
   });}catch(e){failures.push('Giọng YunJian: '+e.message);}
  }
  if(!installAbort.signal.aborted){
   try{await fetchVerifiedNeural(installAbort.signal,message=>transferStatus.textContent=message);}catch(e){failures.push('Nhận dạng viết tay: '+e.message);}
  }
 }finally{installBusy=false;installAbort=null;transferControls();await refresh('Gói đã tải sẽ xuất hiện ở đây.');}
 transferStatus.textContent=failures.length?'Có gói chưa hoàn tất: '+failures.join('; ')+'. Có thể bấm Tải lại để thử lại.':'Đã tải gói giọng và nhận dạng viết tay vào trình duyệt đang mở. Từ điển và dữ liệu nét chữ tải thêm khi bạn dùng đến.';
};

q('storageCleanupAll').onclick=()=>{const checked=!rows.every(r=>r.input.checked);for(const r of rows)r.input.checked=checked;q('storageCleanupAll').textContent=checked?'Bỏ chọn tất cả':'Chọn tất cả';controls();};
q('storageCleanupDelete').onclick=async()=>{
 if(busy||scanOwner!==owner())return;const selected=rows.filter(r=>r.input.checked);if(!selected.length)return;
 if((selected.some(r=>r.id==='hsk-handwriting-neural-ppocrv5-ort122-v1')&&root.HSKHandwritingDownloads?.busy)||(selected.some(r=>r.url||r.id==='hsk-music-codec-v1')&&root.HSKMusic?.downloadingOffline)||(selected.some(r=>r.id==='voice')&&root.HSKVoiceManager?.installing)){status.textContent='Đang tải gói mới. Hãy đợi hoàn tất hoặc hủy tải rồi dọn dẹp.';return;}
 busy=true;controls();status.textContent='Đang xóa '+selected.length+' mục…';let deleted=0;const errors=[],musicUrls=[],cleanedPackages=[],uid=scanOwner;
 for(const row of selected){if(uid!==owner()){errors.push('Tài khoản đã thay đổi');break;}try{
  if(row.id==='voice')await root.HSKVoiceManager.chooseDevice(row.voiceURI,row.revision);
  else if(row.url){await root.HSKLegacyMusicCleanup.remove(uid,row.url,row);musicUrls.push(row.url);}
  else{if(!packages.some(p=>p[0]===row.id))throw Error('Gói không được phép dọn');const cache=await caches.open(row.id);for(const key of row.keys)await cache.delete(key);cleanedPackages.push(row.id);}
  deleted++;
 }catch(e){errors.push(row.name+': '+e.message);}}
 root.dispatchEvent(new CustomEvent('hsk-storage-cleaned',{detail:{musicUrls,packages:cleanedPackages}}));
 await refresh('Đã xóa '+deleted+' / '+selected.length+' mục.'+(musicUrls.length?' File nhạc dùng chung với tài khoản khác chỉ được giải phóng khi không còn ai lưu.':'')+(errors.length?' Chưa xóa được: '+errors.join('; '):''));
};
function close(){if(installBusy){transferStatus.textContent='Đang tải gói mở rộng. Giữ ứng dụng mở đến khi hoàn tất.';return;}if(busy){status.textContent='Đang xử lý, vui lòng đợi hoàn tất.';return;}dialog.close();focus?.focus();}
q('storageCleanupClose').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});q('storageCleanupRefresh').onclick=()=>refresh();
q('storageCleanupOpen')?.addEventListener('click',()=>{focus=document.activeElement;dialog.showModal();q('storageCleanupAll').textContent='Chọn tất cả';void refresh();});
root.addEventListener('hsk-account-ready',()=>{if(dialog.open&&!busy)void refresh();});
})(window);
