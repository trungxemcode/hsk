/* Rebuilt entertainment music streams owner-published R2 audio only. */
const fs=require('node:fs'),assert=require('node:assert/strict');
const music=fs.readFileSync('src/modules/music/music.js','utf8'),loader=fs.readFileSync('loader.js','utf8'),config=JSON.parse(fs.readFileSync('music-config.json','utf8'));
for(const name of ['musicDeviceSave','musicMenuOfflineRow','onlineResolver','yt-dlp','HSKMusicOffline','keepAliveAudio'])assert.ok(!music.includes(name),'removed music path: '+name);
assert.ok(music.includes('musicCloudSection')&&music.includes('mountCloudAudio('));
assert.ok(!loader.includes('music-offline.js')&&!loader.includes('music-converter.js'));
assert.equal(config.version,2);assert.ok(!('onlineResolver' in config));
console.log('PASS R2-only entertainment music; no offline/VPS/yt-dlp paths');
