/* Only explicitly allowlisted optional downloads. Never enumerate/delete app caches or progress. */
(function(root){'use strict';
const packages=[
 ['hsk-music-codec-v1','Bộ nén nhạc ngoại tuyến','Tải lại khi lưu link nhạc.'],
 ['hsk-handwriting-neural-ppocrv5-ort122-v1','Nhận dạng viết tay nâng cao','Cần tải lại để dùng nhận dạng nâng cao.'],
 ['hsk-writing-data-2','Dữ liệu nét chữ đã xem','Tải lại khi mở chữ tương ứng.'],
 ['hsk-open-dictionary-cedict-v1','Từ điển mở rộng đã tra','Cần mạng để tải lại các phần đã xóa.']
];
const owner=()=>root.HSKAccountDashboard?.user?.uid||(()=>{try{return JSON.parse(localStorage.getItem('hsk-account-meta-v1'))?.uid||'guest';}catch{return 'guest';}})();
const size=n=>n<1024?n+' B':(n<1048576?n/1024:n/1048576).toLocaleString('vi-VN',{maximumFractionDigits:2})+(n<1048576?' KiB':' MiB');
const dialog=document.createElement('dialog');dialog.id='storageCleanupDialog';dialog.className='storage-cleanup';dialog.setAttribute('aria-labelledby','storageCleanupTitle');
dialog.innerHTML='<h2 id="storageCleanupTitle">Dọn dẹp dung lượng</h2><p class="hint">Chỉ hiển thị dữ liệu tải thêm trên thiết bị này. Gói chạy app, demo đi kèm và tiến độ học được giữ nguyên. Giọng có sẵn của máy không nằm trong danh sách.</p><p id="storageCleanupTotal"></p><div id="storageCleanupList" class="storage-cleanup-list"></div><p id="storageCleanupStatus" role="status" aria-live="polite"></p><div class="storage-cleanup-actions"><button id="storageCleanupAll" type="button">Chọn tất cả</button><button id="storageCleanupDelete" type="button" disabled>Xóa mục đã chọn</button><button id="storageCleanupRefresh" type="button">Làm mới</button><button id="storageCleanupClose" type="button">Xong</button></div>';
document.body.append(dialog);
const q=id=>document.getElementById(id),list=q('storageCleanupList'),status=q('storageCleanupStatus');let rows=[],busy=false,scan=0,scanOwner='',focus;
function controls(){const selected=rows.filter(r=>r.input.checked);q('storageCleanupDelete').disabled=busy||!selected.length;q('storageCleanupDelete').textContent=selected.length?'Xóa '+selected.length+' mục đã chọn':'Xóa mục đã chọn';q('storageCleanupAll').disabled=busy||!rows.length;q('storageCleanupRefresh').disabled=busy;for(const r of rows)r.input.disabled=busy;}
function add(row){const label=document.createElement('label');label.className='storage-cleanup-row';const input=document.createElement('input');input.type='checkbox';input.dataset.package=row.id;input.setAttribute('aria-label',row.name);const copy=document.createElement('span');copy.className='storage-cleanup-copy';const title=document.createElement('strong'),detail=document.createElement('small');title.textContent=row.name;detail.textContent=size(row.bytes)+' · '+row.note;copy.append(title,detail);label.append(input,copy);input.onchange=controls;list.append(label);rows.push({...row,input});}
async function refresh(message=''){
 const token=++scan,uid=owner();q('storageCleanupAll').textContent='Chọn tất cả';scanOwner=uid;busy=true;rows=[];list.replaceChildren();status.textContent='Đang tính dung lượng tải thêm…';controls();const found=[],errors=[];
 try{
  if(root.HSKVoiceManager){try{const v=await root.HSKVoiceManager.downloaded();if(v.bytes>0){let name=v.selection.voiceId||'Gói giọng đã tải';try{const c=await root.HSKVoiceManager.catalog();name=c.voices.find(x=>x.id===v.selection.voiceId)?.label||name;}catch{}found.push({id:'voice',name:'Giọng tiếng Trung · '+name,bytes:v.bytes,revision:v.selection.revision,voiceURI:v.selection.source==='device'?v.selection.voiceURI:'',note:'Xóa gói giọng và bộ chạy tải thêm; trở về giọng thiết bị.'});}}catch{errors.push('gói giọng');}}
  if(root.HSKMusicOffline){try{for(const t of await root.HSKMusicOffline.list(uid))found.push({id:'music:'+t.url,name:t.title,bytes:t.size,asset:t.asset,addedAt:t.addedAt,url:t.url,note:'Nhạc ngoại tuyến · '+(t.author||'Trên thiết bị')});}catch{errors.push('nhạc ngoại tuyến');}}
  if(root.caches){let names;try{names=await caches.keys();}catch{errors.push('gói bổ sung');names=[];}for(const [id,name,note] of packages){if(!names.includes(id))continue;try{const cache=await caches.open(id),keys=await cache.keys();let bytes=0;for(const key of keys){const r=await cache.match(key);if(r){if(r.type==='opaque')throw Error('Không đo được');bytes+=(await r.blob()).size;}}if(keys.length)found.push({id,name,note,bytes,keys});}catch{errors.push(name);}}}
  if(token!==scan)return;if(uid!==owner())return refresh('Tài khoản đã thay đổi.');
  for(const row of found)add(row);
  const assets=new Set();let total=0;for(const r of rows){if(r.asset&&assets.has(r.asset))continue;if(r.asset)assets.add(r.asset);total+=r.bytes;}
  q('storageCleanupTotal').textContent='Dữ liệu tải thêm: '+size(total)+(rows.some(r=>r.asset)?' · nhạc của tài khoản hiện tại':'');
  status.textContent=[message,rows.length?'Chọn những mục bạn muốn xóa. Các gói có thể tải lại khi cần.':'Chưa có dữ liệu tải thêm để dọn.',errors.length?'Chưa đọc được '+errors.join(', ')+'. Bấm Làm mới để thử lại.':''].filter(Boolean).join(' ');
 }finally{if(token===scan){busy=false;controls();}}
}
q('storageCleanupAll').onclick=()=>{const checked=!rows.every(r=>r.input.checked);for(const r of rows)r.input.checked=checked;q('storageCleanupAll').textContent=checked?'Bỏ chọn tất cả':'Chọn tất cả';controls();};
q('storageCleanupDelete').onclick=async()=>{
 if(busy||scanOwner!==owner())return;const selected=rows.filter(r=>r.input.checked);if(!selected.length)return;
 if((selected.some(r=>r.id==='hsk-handwriting-neural-ppocrv5-ort122-v1')&&root.HSKHandwritingDownloads?.busy)||(selected.some(r=>r.url||r.id==='hsk-music-codec-v1')&&root.HSKMusic?.downloadingOffline)||(selected.some(r=>r.id==='voice')&&root.HSKVoiceManager?.installing)){status.textContent='Đang tải gói mới. Hãy đợi hoàn tất hoặc hủy tải rồi dọn dẹp.';return;}
 busy=true;controls();status.textContent='Đang xóa '+selected.length+' mục…';let deleted=0;const errors=[],musicUrls=[],cleanedPackages=[],uid=scanOwner;
 for(const row of selected){if(uid!==owner()){errors.push('Tài khoản đã thay đổi');break;}try{
  if(row.id==='voice')await root.HSKVoiceManager.chooseDevice(row.voiceURI,row.revision);
  else if(row.url){await root.HSKMusicOffline.remove(uid,row.url,row);musicUrls.push(row.url);}
  else{if(!packages.some(p=>p[0]===row.id))throw Error('Gói không được phép dọn');const cache=await caches.open(row.id);for(const key of row.keys)await cache.delete(key);cleanedPackages.push(row.id);}
  deleted++;
 }catch(e){errors.push(row.name+': '+e.message);}}
 root.dispatchEvent(new CustomEvent('hsk-storage-cleaned',{detail:{musicUrls,packages:cleanedPackages}}));
 await refresh('Đã xóa '+deleted+' / '+selected.length+' mục.'+(musicUrls.length?' File nhạc dùng chung với tài khoản khác chỉ được giải phóng khi không còn ai lưu.':'')+(errors.length?' Chưa xóa được: '+errors.join('; '):''));
};
function close(){if(busy){status.textContent='Đang xử lý, vui lòng đợi hoàn tất.';return;}dialog.close();focus?.focus();}
q('storageCleanupClose').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});q('storageCleanupRefresh').onclick=()=>refresh();
q('storageCleanupOpen')?.addEventListener('click',()=>{focus=document.activeElement;dialog.showModal();q('storageCleanupAll').textContent='Chọn tất cả';void refresh();});
root.addEventListener('hsk-account-ready',()=>{if(dialog.open&&!busy)void refresh();});
})(window);
