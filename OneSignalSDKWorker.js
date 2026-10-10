// HSK shell revision: 20261010-update-4
importScripts('./offline-worker.js?v=20261010-update-4');
try{importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');}catch(error){console.warn('Thông báo cần mạng; học offline vẫn hoạt động.',error);}
