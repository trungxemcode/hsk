/* Reminder metadata only; learning history stays in the existing local storage. */
(async function () {
  const KEY='hsk-push-preferences-v1', status=$('pushStatus'), enable=$('pushEnable'), disable=$('pushDisable'), hour=$('pushHour');
  const updateStatus=$('updatePushStatus'),updateEnable=$('updatePushEnable'),updateDisable=$('updatePushDisable');
  let prefs={enabled:false,updates:false,hour:20}, sdk=null, config=null, timer;
  try { const value=JSON.parse(localStorage.getItem(KEY)||'null');if(value&&Number.isInteger(value.hour)&&value.hour>=0&&value.hour<=23)prefs={enabled:value.enabled===true,updates:value.updates===true,hour:value.hour}; } catch (_) {}
  // Surface unsupported/configuration states on Home as well as in SRS.
  new MutationObserver(()=>{if(!sdk&&updateStatus)updateStatus.textContent=status.textContent;}).observe(status,{childList:true,subtree:true,characterData:true});
  for(let h=0;h<24;h++){const o=document.createElement('option');o.value=h;o.textContent='Khoảng '+String(h).padStart(2,'0')+':00';hour.append(o);}hour.value=prefs.hour;
  function save(){try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){status.textContent='Không lưu được thiết lập thông báo trên thiết bị này.';}}
  function tags(){let due=4102444800000;for(const [key,r] of Object.entries(records))if(wordByKey.has(key)&&Number.isFinite(r.due))due=Math.min(due,r.due);return {hsk_push_on:prefs.enabled?'1':'0',hsk_update_on:prefs.updates?'1':'0',hsk_remind_hour:String(prefs.hour),hsk_due_at:String(Math.floor(due/1000))};}
  function sync(){if(!sdk)return;try{sdk.User.addTags(tags());}catch(_){status.textContent='Chưa cập nhật được lịch nhắc. Hãy mở lại app khi có mạng.';}}
  function queueSync(){clearTimeout(timer);timer=setTimeout(sync,400);}
  const previousSave=saveRecords;saveRecords=function(){previousSave();queueSync();};
  hour.onchange=()=>{prefs.hour=Number(hour.value);save();sync();show();};
  function show(){if(!sdk)return;const subscribed=sdk.User.PushSubscription.optedIn===true&&!!sdk.User.PushSubscription.id;disable.disabled=!prefs.enabled;status.textContent=prefs.enabled&&subscribed?(config.schedulerEnabled?'Đã đăng ký thông báo. Nhắc khoảng '+prefs.hour+'h khi có từ đến hạn.':'Đã đăng ký thiết bị; lịch gửi phía máy chủ chưa được kích hoạt.'):'Nhắc ôn đang tắt. Bấm Bật thông báo để đăng ký thiết bị này.';if(updateStatus){updateStatus.textContent=prefs.updates&&subscribed?'Đã bật: điện thoại sẽ nhận thông báo khi có bản web mới.':'Bật một lần để nhận tin phiên bản mới, kể cả khi app đã đóng.';updateDisable.disabled=!prefs.updates;}}
  async function optIn(kind){if(!sdk)return;try{await sdk.Notifications.requestPermission();if(!sdk.Notifications.permission){throw Error('permission');}await sdk.User.PushSubscription.optIn();prefs[kind]=true;save();sync();show();}catch(_){const text='Chưa bật được thông báo. Kiểm tra mạng và quyền thông báo trong cài đặt điện thoại.';status.textContent=text;if(updateStatus)updateStatus.textContent=text;}}
  enable.onclick=()=>optIn('enabled');if(updateEnable)updateEnable.onclick=()=>optIn('updates');
  async function optOut(kind){prefs[kind]=false;save();sync();try{if(!prefs.enabled&&!prefs.updates)await sdk.User.PushSubscription.optOut();show();}catch(_){status.textContent='Đã lưu yêu cầu tắt; chưa xác nhận với dịch vụ. Hãy thử lại khi có mạng.';if(updateStatus)updateStatus.textContent=status.textContent;}}
  disable.onclick=()=>optOut('enabled');if(updateDisable)updateDisable.onclick=()=>optOut('updates');
  if(new URLSearchParams(location.search).get('mode')==='srs')switchMode('srs');
  try{const response=await fetch('./push-config.json',{cache:'no-store'});if(!response.ok)throw Error();config=await response.json();}catch(_){status.textContent='Không tải được cấu hình thông báo. Thử tải lại khi có mạng.';return;}
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(config.appId||'')){status.textContent='Chưa kết nối OneSignal. Phần nhắc ôn đã chuẩn bị; cần hoàn tất tài khoản dịch vụ trước khi bật.';return;}
  const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  if(ios&&!navigator.standalone&&!matchMedia('(display-mode: standalone)').matches){status.textContent='Hãy thêm app vào màn hình chính, rồi mở bằng biểu tượng HSK để bật thông báo.';return;}
  if(!window.isSecureContext||!('serviceWorker' in navigator)||!('PushManager' in window)){status.textContent='Thiết bị chưa hỗ trợ thông báo web. Trên iPhone cần iOS 16.4 trở lên và mở app từ màn hình chính.';return;}
  window.OneSignalDeferred=window.OneSignalDeferred||[];
  window.OneSignalDeferred.push(async OneSignal=>{try{const scope=new URL('./',location.href).pathname;await OneSignal.init({appId:config.appId,safari_web_id:config.safariWebId,serviceWorkerPath:scope.slice(1)+'OneSignalSDKWorker.js',serviceWorkerParam:{scope},notifyButton:{enable:false},promptOptions:{slidedown:{prompts:[{type:'push',autoPrompt:false}]}},welcomeNotification:{disable:true}});sdk=OneSignal;enable.disabled=false;if(updateEnable)updateEnable.disabled=false;sdk.User.PushSubscription.addEventListener('change',()=>{sync();show();});sync();show();}catch(_){status.textContent='Không khởi tạo được dịch vụ thông báo. Kiểm tra cấu hình OneSignal hoặc thử lại khi có mạng.';}});
  const script=document.createElement('script');script.src='https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';script.defer=true;script.onerror=()=>{status.textContent='Chưa tải được OneSignal. Thử lại khi có mạng.';};document.head.append(script);
  window.addEventListener('online',queueSync);document.addEventListener('visibilitychange',()=>{if(!document.hidden)queueSync();});
})();
