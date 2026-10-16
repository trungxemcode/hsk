// HSK shell revision: hsk-offline-r3-3-0
importScripts('./offline-worker.js?v=r3-3-0');
try{importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');}catch(error){console.warn('Thông báo cần mạng; học offline vẫn hoạt động.',error);}
