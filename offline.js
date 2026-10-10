(async()=>{
 const status=document.getElementById('offlineStatus'),update=document.getElementById('offlineUpdate');
 if(!('serviceWorker' in navigator)||!window.isSecureContext){status.textContent='Offline cần mở bằng HTTPS. Nếu link CDN không hỗ trợ, hãy dùng GitHub Pages.';return;}
 let ready=false,registration;
 const show=()=>{status.textContent=ready?(navigator.onLine?'Đã sẵn sàng học offline · HSK 1–6':'Đang học offline · Tiến độ vẫn được lưu'):'Đang tải dữ liệu để học offline… Hãy giữ trang mở.';};
 function check(worker){if(!worker)return;const channel=new MessageChannel();channel.port1.onmessage=e=>{if(e.data?.ready){ready=true;show();}};worker.postMessage({type:'HSK_OFFLINE_STATUS'},[channel.port2]);}
 try{
 registration=await navigator.serviceWorker.getRegistration('./');
 if(!registration||!new URL(registration.active?.scriptURL||registration.waiting?.scriptURL||registration.installing?.scriptURL||location.href).pathname.endsWith('/OneSignalSDKWorker.js'))registration=await navigator.serviceWorker.register('./OneSignalSDKWorker.js',{scope:'./',updateViaCache:'none'});
 else if(navigator.onLine)registration.update().catch(()=>{});
 const waiting=()=>{if(registration.waiting){update.hidden=false;update.textContent='Có bản mới · Cập nhật';}};
 waiting();check(registration.active);
 registration.addEventListener('updatefound',()=>{const worker=registration.installing;worker.addEventListener('statechange',()=>{if(worker.state==='installed'){waiting();if(!registration.active)check(worker);}if(worker.state==='redundant'&&!ready)status.textContent='Chưa tải đủ dữ liệu offline. Kết nối mạng rồi tải lại trang.';});});
 navigator.serviceWorker.ready.then(r=>check(r.active));
 update.onclick=()=>{const worker=registration.waiting;if(worker){update.disabled=true;navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload(),{once:true});worker.postMessage({type:'HSK_ACTIVATE_UPDATE'});}};
 window.addEventListener('online',()=>{show();registration.update().catch(()=>{});});window.addEventListener('offline',show);
 if(navigator.storage?.persist)navigator.storage.persist().catch(()=>{});
 }catch(error){status.textContent='Chưa bật được offline. Kết nối mạng rồi tải lại; link CDN cần hỗ trợ service worker.';}
})();
