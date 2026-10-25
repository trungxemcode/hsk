(async()=>{
 const BUILD='hsk-offline-3-18-3',status=document.getElementById('offlineStatus'),update=document.getElementById('offlineUpdate'),manual=document.getElementById('offlineCheck');
 let registration,ready=false,checking=false,lastCheck=0,phase='',lastProgress=0,latest=null,activating=false,activeVersion=null;const watched=new WeakSet();
 const notice=document.getElementById('updateNotice'),noticeText=document.getElementById('updateNoticeText'),noticeApply=document.getElementById('updateNoticeApply');let dismissed='',latestLabel='';
 function announce(downloaded=false){if(!notice||!latest||latest===BUILD||dismissed===latest)return;notice.hidden=false;noticeText.textContent=(latestLabel||'Bản mới')+(downloaded?' đã sẵn sàng. Cập nhật khi bạn học xong; tiến độ được giữ.':' đang được tải. Bạn vẫn có thể tiếp tục học.');noticeApply.disabled=!downloaded;noticeApply.textContent=downloaded?'Cập nhật ngay':'Đang tải…';}
 document.getElementById('updateNoticeLater')?.addEventListener('click',()=>{dismissed=latest;notice.hidden=true;});
 noticeApply?.addEventListener('click',()=>activate());
 const set=text=>status.textContent=text;
 const idle=()=>{if(!checking&&!activating&&!['files','manifest','error'].includes(phase))set(ready?(navigator.onLine?'Đã sẵn sàng học offline · HSK 1–6':'Đang học offline · Tiến độ vẫn được lưu'):'Đang chuẩn bị học offline…');};
 const timeout=(promise,ms)=>{let timer;return Promise.race([promise,new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('timeout')),ms))]).finally(()=>clearTimeout(timer));};
 function ask(worker){if(!worker)return Promise.resolve(null);return new Promise(resolve=>{const channel=new MessageChannel(),timer=setTimeout(()=>{channel.port1.close();resolve(null);},3000);channel.port1.onmessage=e=>{clearTimeout(timer);channel.port1.close();resolve(e.data);};worker.postMessage({type:'HSK_OFFLINE_STATUS'},[channel.port2]);});}
 function waiting(){if(registration?.waiting){phase='ready';update.hidden=false;update.disabled=false;update.textContent='Cập nhật ngay';set('Bản mới đã tải xong. Bấm Cập nhật ngay để áp dụng; tiến độ được giữ.');announce(true);return true;}if(!activating)update.hidden=true;return false;}
 function watch(worker){if(!worker||watched.has(worker))return;watched.add(worker);lastProgress=Date.now();const changed=()=>{if(worker.state==='installed'){waiting();setTimeout(waiting,0);if(!registration.active)ask(worker).then(x=>{if(x?.ready){ready=true;activeVersion=x.version;phase='';idle();}});}if(worker.state==='redundant'&&phase!=='error'){phase='error';set('Không cài được bản mới. Bản cũ và tiến độ vẫn được giữ. Bấm Kiểm tra cập nhật để thử lại.');}};worker.addEventListener('statechange',changed);worker.postMessage({type:'HSK_DOWNLOAD_STATUS'});changed();}
 navigator.serviceWorker?.addEventListener('message',event=>{const x=event.data;if(x?.type!=='HSK_DOWNLOAD_PROGRESS')return;phase=x.phase;lastProgress=Date.now();if(x.phase==='error')set('Cập nhật chưa hoàn tất: '+x.error+' Tiến độ vẫn được giữ.');else if(x.phase==='ready')waiting();else set(x.phase==='manifest'?'Đang xác nhận phiên bản mới…':`Đang chuẩn bị bản mới: ${x.done}/${x.total} tệp · ${Math.round(100*x.done/x.total)}%`);});
 async function refresh(explicit=false){
  if(checking){if(explicit)set('Đang kiểm tra phiên bản trên máy chủ…');return;}
  if(!navigator.onLine){if(explicit)set('Cần mạng để kiểm tra bản mới. Bạn vẫn học offline được.');return;}
  if(!explicit&&Date.now()-lastCheck<60000)return;checking=true;lastCheck=Date.now();if(manual)manual.textContent='Đang kiểm tra…';set('Đang kiểm tra phiên bản trên máy chủ…');
  try{
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);let manifest;
   try{const r=await fetch('./app-version.json?t='+Date.now(),{cache:'no-store',signal:controller.signal});if(!r.ok)throw Error('manifest');manifest=await r.json();if(typeof manifest.version!=='string')throw Error('manifest');}finally{clearTimeout(timer);}
   latest=manifest.version;latestLabel=manifest.label||'Bản mới';announce();if(waiting())return;
   if(registration.installing){watch(registration.installing);set('Bản mới đang được chuẩn bị. Tiến độ tải sẽ hiện ở đây.');return;}
   if(latest===BUILD&&ready&&activeVersion===BUILD){phase='';set('Bạn đang dùng bản mới nhất · '+manifest.label);return;}
   set('Đã tìm thấy bản mới · Đang tải cập nhật…');await timeout(registration.update(),20000);watch(registration.installing);
   if(!waiting()&&!registration.installing){phase='error';set('Máy chủ có bản mới nhưng trình duyệt chưa nhận được. Bấm Kiểm tra cập nhật để thử lại; tiến độ vẫn giữ nguyên.');}
  }catch(error){phase='error';set(error.message==='timeout'||error.name==='AbortError'?'Máy chủ không phản hồi trong thời hạn chờ. Bấm Kiểm tra cập nhật để thử lại; tiến độ vẫn được giữ.':'Không đọc được phiên bản mới từ đường dẫn này. Hãy thử lại; Wi-Fi có mạng không bảo đảm máy chủ tải được.');}
  finally{checking=false;if(manual)manual.textContent='Kiểm tra cập nhật';}
 }
 async function activate(){const worker=registration?.waiting;if(!worker){set('Đang kiểm tra xem bản mới đã tải xong chưa…');return refresh(true);}if(activating)return;activating=true;update.disabled=true;update.textContent='Đang áp dụng…';set('Đang áp dụng bản mới… Tiến độ vẫn được giữ.');let finished=false,timer;
  const done=()=>{if(finished)return;finished=true;clearTimeout(timer);navigator.serviceWorker.removeEventListener('controllerchange',done);worker.removeEventListener('statechange',state);location.reload();},state=()=>{if(worker.state==='activated')done();};
  navigator.serviceWorker.addEventListener('controllerchange',done);worker.addEventListener('statechange',state);worker.postMessage({type:'HSK_ACTIVATE_UPDATE'});
  timer=setTimeout(async()=>{if(finished)return;const active=(await navigator.serviceWorker.getRegistration('./'))?.active,info=await ask(active);if(info?.version===latest||active===worker)return done();finished=true;navigator.serviceWorker.removeEventListener('controllerchange',done);worker.removeEventListener('statechange',state);activating=false;update.disabled=false;update.textContent='Thử áp dụng lại';set('Trình duyệt chưa áp dụng bản mới sau 20 giây. Hãy bấm thử lại; tiến độ vẫn được giữ.');},20000);
 }
 if(manual)manual.onclick=()=>registration?refresh(true):set('App đang khởi tạo bộ cập nhật. Hãy thử lại sau vài giây.');update.onclick=activate;
 if(!('serviceWorker' in navigator)||!window.isSecureContext){set('Đường dẫn này không hỗ trợ cập nhật offline. Cần mở app qua HTTPS có hỗ trợ service worker.');return;}
 try{
  registration=await timeout(navigator.serviceWorker.getRegistration('./'),10000);
  if(!registration||!new URL(registration.active?.scriptURL||registration.waiting?.scriptURL||registration.installing?.scriptURL||location.href).pathname.endsWith('/OneSignalSDKWorker.js'))registration=await timeout(navigator.serviceWorker.register('./OneSignalSDKWorker.js',{scope:'./',updateViaCache:'none'}),20000);
  else if(registration.updateViaCache!=='none'){const existing=registration.active||registration.waiting||registration.installing;if(existing)registration=await timeout(navigator.serviceWorker.register(existing.scriptURL,{scope:registration.scope,updateViaCache:'none'}),20000);}
  registration.addEventListener('updatefound',()=>watch(registration.installing));watch(registration.installing);const info=await ask(registration.active);ready=!!info?.ready;activeVersion=info?.version;if(!waiting())idle();refresh();
  navigator.serviceWorker.ready.then(r=>ask(r.active)).then(x=>{if(x?.ready){ready=true;activeVersion=x.version;idle();}});
  window.addEventListener('online',()=>{lastCheck=0;refresh();});window.addEventListener('offline',idle);
  window.addEventListener('pageshow',()=>{if(!waiting())refresh();});document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!waiting())refresh();});
  setInterval(()=>{if(document.hidden)return;if(registration.installing&&Date.now()-lastProgress>30000){phase='error';set('Quá trình chuẩn bị đã chờ hơn 30 giây. Bấm Kiểm tra cập nhật để kiểm tra lại; bạn vẫn học bằng bản cũ.');}else if(!waiting())refresh();},10000);
  if(navigator.storage?.persist)navigator.storage.persist().catch(()=>{});
 }catch(_){set('Bộ cập nhật không khởi tạo được trong thời hạn chờ. Bấm Kiểm tra cập nhật để tải lại trang; tiến độ vẫn được giữ.');if(manual)manual.onclick=()=>location.reload();}
})();
