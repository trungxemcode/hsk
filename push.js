/* Reminder metadata only; learning history stays in the existing local storage. */
(async function () {
  const KEY='hsk-push-preferences-v1', status=$('pushStatus'), enable=$('pushEnable'), disable=$('pushDisable'), hour=$('pushHour');
  let prefs={enabled:false,hour:20}, sdk=null, config=null, timer;
  try { const value=JSON.parse(localStorage.getItem(KEY)||'null');if(value&&Number.isInteger(value.hour)&&value.hour>=0&&value.hour<=23)prefs={enabled:value.enabled===true,hour:value.hour}; } catch (_) {}
  for(let h=0;h<24;h++){const o=document.createElement('option');o.value=h;o.textContent='Khoảng '+String(h).padStart(2,'0')+':00';hour.append(o);}hour.value=prefs.hour;
  function save(){try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){status.textContent='Không lưu được thiết lập thông báo trên thiết bị này.';}}
  function tags(){let due=4102444800000;for(const [key,r] of Object.entries(records))if(wordByKey.has(key)&&Number.isFinite(r.due))due=Math.min(due,r.due);return {hsk_push_on:prefs.enabled?'1':'0',hsk_remind_hour:String(prefs.hour),hsk_due_at:String(Math.floor(due/1000))};}
  function sync(){if(!sdk)return;try{sdk.User.addTags(tags());}catch(_){status.textContent='Chưa cập nhật được lịch nhắc. Hãy mở lại app khi có mạng.';}}
  function queueSync(){clearTimeout(timer);timer=setTimeout(sync,400);}
  const previousSave=saveRecords;saveRecords=function(){previousSave();queueSync();};
  hour.onchange=()=>{prefs.hour=Number(hour.value);save();sync();show();};
  function show(){if(!sdk)return;const subscribed=sdk.User.PushSubscription.optedIn===true&&!!sdk.User.PushSubscription.id;disable.disabled=!prefs.enabled&&!subscribed;status.textContent=prefs.enabled&&subscribed?(config.schedulerEnabled?'Đã đăng ký thông báo. Nhắc khoảng '+prefs.hour+'h khi có từ đến hạn.':'Đã đăng ký thiết bị; lịch gửi phía máy chủ chưa được kích hoạt.'):'Thông báo đang tắt. Bấm Bật thông báo để đăng ký thiết bị này.';}
  enable.onclick=async()=>{if(!sdk)return;try{const request=sdk.Notifications.requestPermission();await request;await sdk.User.PushSubscription.optIn();if(!sdk.Notifications.permission){status.textContent='Chưa được cấp quyền. Kiểm tra quyền thông báo trong cài đặt của iPhone/trình duyệt.';return;}prefs.enabled=true;save();sync();show();}catch(_){status.textContent='Chưa bật được thông báo. Kiểm tra mạng và quyền thông báo rồi thử lại.';}};
  disable.onclick=async()=>{prefs.enabled=false;save();sync();try{await sdk.User.PushSubscription.optOut();show();}catch(_){status.textContent='Đã lưu yêu cầu tắt; chưa xác nhận với dịch vụ. Hãy thử lại khi có mạng.';disable.disabled=false;}};
  if(new URLSearchParams(location.search).get('mode')==='srs')switchMode('srs');
  try{const response=await fetch('./push-config.json',{cache:'no-store'});if(!response.ok)throw Error();config=await response.json();}catch(_){status.textContent='Không tải được cấu hình thông báo. Thử tải lại khi có mạng.';return;}
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(config.appId||'')){status.textContent='Chưa kết nối OneSignal. Phần nhắc ôn đã chuẩn bị; cần hoàn tất tài khoản dịch vụ trước khi bật.';return;}
  const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  if(ios&&!navigator.standalone&&!matchMedia('(display-mode: standalone)').matches){status.textContent='Hãy thêm app vào màn hình chính, rồi mở bằng biểu tượng HSK để bật thông báo.';return;}
  if(!window.isSecureContext||!('serviceWorker' in navigator)||!('PushManager' in window)){status.textContent='Thiết bị chưa hỗ trợ thông báo web. Trên iPhone cần iOS 16.4 trở lên và mở app từ màn hình chính.';return;}
  window.OneSignalDeferred=window.OneSignalDeferred||[];
  window.OneSignalDeferred.push(async OneSignal=>{try{const scope=new URL('./',location.href).pathname;await OneSignal.init({appId:config.appId,safari_web_id:config.safariWebId,serviceWorkerPath:scope.slice(1)+'OneSignalSDKWorker.js',serviceWorkerParam:{scope},notifyButton:{enable:false},promptOptions:{slidedown:{prompts:[{type:'push',autoPrompt:false}]}},welcomeNotification:{disable:true}});sdk=OneSignal;enable.disabled=false;sdk.User.PushSubscription.addEventListener('change',()=>{sync();show();});sync();show();}catch(_){status.textContent='Không khởi tạo được dịch vụ thông báo. Kiểm tra cấu hình OneSignal hoặc thử lại khi có mạng.';}});
  const script=document.createElement('script');script.src='https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';script.defer=true;script.onerror=()=>{status.textContent='Chưa tải được OneSignal. Thử lại khi có mạng.';};document.head.append(script);
  window.addEventListener('online',queueSync);document.addEventListener('visibilitychange',()=>{if(!document.hidden)queueSync();});
})();
