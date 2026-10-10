(async()=>{
 const status=document.getElementById('offlineStatus'),update=document.getElementById('offlineUpdate'),manual=document.getElementById('offlineCheck');
 if(!('serviceWorker' in navigator)||!window.isSecureContext){status.textContent='Offline cần mở bằng HTTPS. Nếu link CDN không hỗ trợ, hãy dùng GitHub Pages.';if(manual)manual.disabled=true;return;}
 let ready=false,registration,checking=false,lastCheck=0;const watched=new WeakSet();
 const show=()=>{status.textContent=ready?(navigator.onLine?'Đã sẵn sàng học offline · HSK 1–6':'Đang học offline · Tiến độ vẫn được lưu'):'Đang tải dữ liệu để học offline… Hãy giữ trang mở.';};
 function check(worker){if(!worker)return;const channel=new MessageChannel();channel.port1.onmessage=e=>{channel.port1.close();if(e.data?.ready){ready=true;show();}};worker.postMessage({type:'HSK_OFFLINE_STATUS'},[channel.port2]);}
 function waiting(){if(registration.waiting){update.hidden=false;update.disabled=false;update.textContent='Có bản mới · Cập nhật';return true;}return false;}
 function watch(worker){if(!worker||watched.has(worker))return;watched.add(worker);const changed=()=>{if(worker.state==='installed'){waiting();setTimeout(waiting,0);if(!registration.active)check(worker);}if(worker.state==='redundant'&&!ready)status.textContent='Chưa tải đủ dữ liệu offline. Kết nối mạng rồi kiểm tra lại.';};worker.addEventListener('statechange',changed);changed();}
 async function refresh(explicit=false){if(!registration||checking)return;if(!navigator.onLine){if(explicit)status.textContent='Cần mạng để kiểm tra bản mới. Bạn vẫn học offline được.';return;}waiting();if(registration.installing){watch(registration.installing);if(explicit)status.textContent='Đang tải bản mới… Hãy giữ app mở.';return;}if(!explicit&&Date.now()-lastCheck<60000)return;checking=true;lastCheck=Date.now();if(manual)manual.disabled=true;if(explicit)status.textContent='Đang kiểm tra cập nhật…';try{await registration.update();watch(registration.installing);if(!waiting()&&explicit)status.textContent=registration.installing?'Đang tải bản mới… Hãy giữ app mở.':'Chưa có bản mới được cung cấp. Nếu vừa cập nhật GitHub, hãy kiểm tra lại sau ít phút.';}catch(_){if(explicit)status.textContent='Chưa kiểm tra được bản mới. Tiến độ vẫn được giữ; hãy thử lại khi mạng ổn định.';}finally{checking=false;if(manual)manual.disabled=false;}}
 try{
 registration=await navigator.serviceWorker.getRegistration('./');
 if(!registration||!new URL(registration.active?.scriptURL||registration.waiting?.scriptURL||registration.installing?.scriptURL||location.href).pathname.endsWith('/OneSignalSDKWorker.js'))registration=await navigator.serviceWorker.register('./OneSignalSDKWorker.js',{scope:'./',updateViaCache:'none'});
 // Observe an already-installing worker as well as future updatefound events.
 registration.addEventListener('updatefound',()=>watch(registration.installing));watch(registration.installing);waiting();check(registration.active);
 navigator.serviceWorker.ready.then(r=>check(r.active));
 update.onclick=()=>{const worker=registration.waiting;if(worker){update.disabled=true;navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload(),{once:true});worker.postMessage({type:'HSK_ACTIVATE_UPDATE'});}else refresh(true);};
 if(manual)manual.onclick=()=>refresh(true);
 window.addEventListener('online',()=>{show();lastCheck=0;refresh();});window.addEventListener('offline',show);
 window.addEventListener('pageshow',()=>{waiting();refresh();});document.addEventListener('visibilitychange',()=>{if(!document.hidden){waiting();refresh();}});
 setInterval(()=>{if(!document.hidden){waiting();refresh();}},60000);refresh();
 if(navigator.storage?.persist)navigator.storage.persist().catch(()=>{});
 }catch(_){status.textContent='Chưa bật được offline. Kết nối mạng rồi tải lại; link CDN cần hỗ trợ service worker.';if(manual)manual.onclick=()=>location.reload();}
})();
