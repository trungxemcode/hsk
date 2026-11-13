// HSK shell revision: hsk-offline-5-1-9
importScripts('./offline-worker.js?v=5-1-9');
try{importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');}catch(error){console.warn('Thông báo cần mạng; học offline vẫn hoạt động.',error);}
