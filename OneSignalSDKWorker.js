// HSK shell revision: hsk-offline-dark-20261013-1
importScripts('./offline-worker.js?v=dark-20261013-1');
try{importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');}catch(error){console.warn('Thông báo cần mạng; học offline vẫn hoạt động.',error);}
