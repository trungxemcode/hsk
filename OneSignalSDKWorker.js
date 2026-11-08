// HSK shell revision: hsk-offline-4-4-10-r4
importScripts('./offline-worker.js?v=4-4-10-r4');
try{importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');}catch(error){console.warn('Thông báo cần mạng; học offline vẫn hoạt động.',error);}
