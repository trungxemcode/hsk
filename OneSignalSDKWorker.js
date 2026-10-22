// HSK shell revision: hsk-offline-3-10-12
importScripts('./offline-worker.js?v=3-10-12');
try{importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');}catch(error){console.warn('Thông báo cần mạng; học offline vẫn hoạt động.',error);}
