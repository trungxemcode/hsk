// HSK shell revision: hsk-offline-3-22-2
importScripts('./offline-worker.js?v=3-22-2');
try{importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');}catch(error){console.warn('Thông báo cần mạng; học offline vẫn hoạt động.',error);}
