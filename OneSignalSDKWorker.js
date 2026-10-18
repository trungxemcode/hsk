// HSK shell revision: hsk-offline-3-4-3
importScripts('./offline-worker.js?v=3-4-3');
try{importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');}catch(error){console.warn('Thông báo cần mạng; học offline vẫn hoạt động.',error);}
