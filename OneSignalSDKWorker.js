// HSK shell revision: hsk-offline-4-1-1-r5
importScripts('./offline-worker.js?v=4-1-1-r5');
try{importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');}catch(error){console.warn('Thông báo cần mạng; học offline vẫn hoạt động.',error);}
