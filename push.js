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
  function show(){
    if(!sdk)return;
    const subscribed=sdk.User.PushSubscription.optedIn===true&&!!sdk.User.PushSubscription.id;
    const allowed=sdk.Notifications.permission===true;
    disable.disabled=!prefs.enabled;
    if(!allowed)status.textContent=prefs.enabled||prefs.updates?'Chưa có quyền Push. Trên iPhone, mở Cài đặt → Thông báo → HSK để cho phép rồi quay lại đăng ký.':'Chưa cấp quyền Push. Bấm Bật thông báo và đồng ý trên iPhone để nhận nhắc ôn.';
    else if(prefs.enabled&&!subscribed)status.textContent='Quyền đã cấp nhưng thiết bị chưa đăng ký OneSignal. Hãy bấm Bật thông báo lại khi có mạng.';
    else if(prefs.enabled){
      const due=Number(tags().hsk_due_at)*1000;
      const pending=due>Date.now();
      status.textContent=(config.schedulerEnabled?'Đã kết nối thông báo trên thiết bị. Nhắc khoảng '+prefs.hour+'h (giờ Việt Nam) khi có từ đến hạn.':'Đã đăng ký thiết bị; lịch gửi phía máy chủ chưa kích hoạt.')+(pending?' Hiện chưa có từ đến hạn nên sẽ không gửi nhắc ôn.':'');
    }else status.textContent=subscribed?'Thiết bị đã đăng ký. Bấm Bật thông báo nếu muốn nhận nhắc ôn.':'Nhắc ôn đang tắt. Bấm Bật thông báo để đăng ký thiết bị này.';
    if(updateStatus){
      updateStatus.textContent=prefs.updates&&subscribed?'Đã đăng ký nhận thông báo khi phát hành phiên bản mới.':prefs.updates?'Đã lưu lựa chọn nhưng chưa có đăng ký Push hợp lệ. Bấm Nhận thông báo cập nhật lại.':'Thông báo phiên bản mới đang tắt. Bấm Nhận thông báo cập nhật để bật.';
      updateDisable.disabled=!prefs.updates;
    }
  }
  async function optIn(kind){
    if(!sdk)return;
    try{
      await sdk.Notifications.requestPermission();
      if(sdk.Notifications.permission!==true)throw Error('permission');
      await sdk.User.PushSubscription.optIn();
      prefs[kind]=true;save();sync();show();
      if(!sdk.User.PushSubscription.id){
        const note='Đã cấp quyền nhưng đang chờ OneSignal hoàn tất đăng ký thiết bị. Giữ kết nối mạng, mở lại HSK và kiểm tra trạng thái.';
        status.textContent=note;if(updateStatus)updateStatus.textContent=note;
      }
    }catch(_){
      const note='Chưa đăng ký được Push. Trên iPhone phải mở HSK từ biểu tượng Màn hình chính và cho phép trong Cài đặt → Thông báo → HSK.';
      status.textContent=note;if(updateStatus)updateStatus.textContent=note;
    }
  }
  enable.onclick=()=>optIn('enabled');if(updateEnable)updateEnable.onclick=()=>optIn('updates');
  async function optOut(kind){prefs[kind]=false;save();sync();try{if(!prefs.enabled&&!prefs.updates)await sdk.User.PushSubscription.optOut();show();}catch(_){status.textContent='Đã lưu yêu cầu tắt; chưa xác nhận với dịch vụ. Hãy thử lại khi có mạng.';if(updateStatus)updateStatus.textContent=status.textContent;}}
  disable.onclick=()=>optOut('enabled');if(updateDisable)updateDisable.onclick=()=>optOut('updates');
  if(new URLSearchParams(location.search).get('mode')==='srs')switchMode('srs');
  try{const response=await fetch('./push-config.json',{cache:'no-store'});if(!response.ok)throw Error();config=await response.json();}catch(_){status.textContent='Không tải được cấu hình thông báo. Thử tải lại khi có mạng.';return;}
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(config.appId||'')){status.textContent='Chưa kết nối OneSignal. Phần nhắc ôn đã chuẩn bị; cần hoàn tất tài khoản dịch vụ trước khi bật.';return;}
  const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  if(ios&&!navigator.standalone&&!matchMedia('(display-mode: standalone)').matches){status.textContent='iPhone: mở trang HSK trong Safari → Chia sẻ → Thêm vào Màn hình chính, sau đó mở từ biểu tượng HSK (không mở trong ChatGPT hoặc tab Safari).';if(updateStatus)updateStatus.textContent=status.textContent;return;}
  if(!window.isSecureContext||!('serviceWorker' in navigator)||!('PushManager' in window)){status.textContent='Thiết bị chưa hỗ trợ thông báo web. Trên iPhone cần iOS 16.4 trở lên và mở app từ màn hình chính.';return;}
  window.OneSignalDeferred=window.OneSignalDeferred||[];
  window.OneSignalDeferred.push(async OneSignal=>{try{const scope=new URL('./',location.href).pathname;await OneSignal.init({appId:config.appId,safari_web_id:config.safariWebId,serviceWorkerPath:new URL('./OneSignalSDKWorker.js',location.href).pathname,serviceWorkerParam:{scope},notifyButton:{enable:false},promptOptions:{slidedown:{prompts:[{type:'push',autoPrompt:false}]}},welcomeNotification:{disable:true}});sdk=OneSignal;enable.disabled=false;if(updateEnable)updateEnable.disabled=false;sdk.User.PushSubscription.addEventListener('change',()=>{sync();show();});sync();show();}catch(_){status.textContent='Không khởi tạo được dịch vụ thông báo. Kiểm tra cấu hình OneSignal hoặc thử lại khi có mạng.';}});
  const script=document.createElement('script');script.src='https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';script.defer=true;script.onerror=()=>{status.textContent='Chưa tải được OneSignal. Thử lại khi có mạng.';};document.head.append(script);
  window.addEventListener('online',()=>{queueSync();show();});document.addEventListener('visibilitychange',()=>{if(!document.hidden){queueSync();show();}});window.addEventListener('pageshow',()=>{queueSync();show();});
})();
