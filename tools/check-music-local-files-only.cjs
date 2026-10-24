/* Link-to-audio download retired. Device-owned files still persist offline. */
const fs=require('node:fs'),assert=require('node:assert/strict');
const music=fs.readFileSync('src/modules/music/music.js','utf8'),
 offline=fs.readFileSync('src/modules/music/music-offline.js','utf8'),
 loader=fs.readFileSync('loader.js','utf8'),
 assets=JSON.parse(fs.readFileSync('tools/pwa-assets.json','utf8')).files,
 config=JSON.parse(fs.readFileSync('music-config.json','utf8'));
for(const forbidden of ['downloadOfflineLink','HSKMusicConverter','offlineSourceResolver','musicOfflineLinkUrl','musicOfflineAddCurrent','musicOfflineCancel','resumePendingDownload','musicBackgroundDownload']){
 assert.ok(!music.includes(forbidden),'retired link download path remains '+forbidden);
}
assert.ok(music.includes('id="musicMenuOfflineRow"')&&music.includes('id="musicOfflineView"'));
assert.ok(music.includes('id="musicOfflineImport"')&&music.includes('id="musicOfflineFile"'));
assert.ok(music.includes('id="musicOfflineAttachFile"')&&music.includes('playOffline('),'local file upload and playback remain');
assert.ok(offline.includes("DB='hsk-music-offline-v1'")&&offline.includes("s.tracks.put("),'existing IndexedDB kept');
assert.ok(offline.includes("ext==='mp3'")&&offline.includes("ext==='m4a'"),'supports uploaded MP3 + M4A');
assert.ok(loader.includes('music-offline.js')&&!loader.includes('music-converter.js'),'no codec loaded, local device store loaded');
assert.ok(!assets.some(x=>/music-(?:converter|codec-worker)|vendor\/music-codec/.test(x)),'link converter not pre-cached');
assert.equal(config.offlineSourceResolver,'','no VPS endpoint');
assert.equal(config.offlineDirect.enabled,false,'no experimental link audio downloading');
console.log('PASS local music file offline only: uploaded MP3/M4A stay; no link downloader, server, codec pre-cache');
