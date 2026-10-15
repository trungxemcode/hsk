// HSK shell revision: hsk-offline-r2-02
importScripts('./offline-worker.js?v=r2-02');
try{importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');}catch(error){console.warn('Thông báo cần mạng; học offline vẫn hoạt động.',error);}
