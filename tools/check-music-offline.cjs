const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),{indexedDB}=require('fake-indexeddb'),{webcrypto}=require('node:crypto'),{File}=require('node:buffer');
const w={indexedDB};vm.runInNewContext(fs.readFileSync('src/modules/music/music-offline.js','utf8'),{window:w,indexedDB,crypto:webcrypto,Blob,DOMException});
const O=w.HSKMusicOffline,bytes=fs.readFileSync('tools/fixtures/music-heaacv2-64k.m4a'),file=new File([bytes],'song.m4a',{type:'audio/mp4'});
(async()=>{
 assert.deepEqual(await O.list('a'),[]);
 await O.put('a',{url:'https://youtu.be/abcdefghijk',title:'A'},file);
 const size=await O.usage();assert.equal(size,file.size);
 await O.put('a',{url:'https://youtu.be/123456789ab',title:'B'},file);
 await O.put('b',{url:'https://youtu.be/abcdefghijk',title:'Owner B'},file);
 assert.equal(await O.usage(),size,'same bytes stored only once across playlists/accounts');
 assert.equal((await O.list('a')).length,2);assert.equal((await O.list('b')).length,1);assert.equal(await O.get('c','https://youtu.be/abcdefghijk'),null);
 assert.equal((await O.get('b','https://youtu.be/abcdefghijk')).blob.size,size);
 await O.remove('a','https://youtu.be/abcdefghijk');await O.remove('a','https://youtu.be/123456789ab');assert.equal(await O.usage(),size,'do not delete another account shared asset');
 await O.remove('b','https://youtu.be/abcdefghijk');assert.equal(await O.usage(),0,'last reference frees actual bytes');
 await assert.rejects(O.put('a',{},new File(['not audio'],'bad.mp3')),/m4a/);
 await assert.rejects(O.put('a',{},new File(['not audio'],'bad.m4a')),/hợp lệ/);
 await assert.rejects(O.put('a',{},file,()=>false),/Đã đổi/);assert.equal(await O.usage(),0,'cancelled account/import cannot write');
 // Reserve the storage budget without allocating a 100 MB test recording.
 const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('hsk-music-offline-v1',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
 await new Promise((resolve,reject)=>{const tx=db.transaction('assets','readwrite');tx.objectStore('assets').put({id:'budget-fixture',size:O.limit,blob:new Blob()});tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);});db.close();
 await assert.rejects(O.put('a',{title:'Over budget'},file),/100 MB/);assert.equal((await O.list('a')).length,0,'quota failure never reports a saved track');assert.equal(await O.usage(),O.limit,'failed transaction leaves storage unchanged');
 console.log('PASS offline storage: real M4A blob, deduplication, owner isolation, reference deletion, format rejection, stale cancellation, atomic quota guard');
})().catch(e=>{console.error(e);process.exitCode=1;});
