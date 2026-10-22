import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import '../src/modules/music/music-core.js';
const C=globalThis.HSKMusicCore;
test('canonical YouTube watch, music, short, shorts, live and embeds drop tracking',()=>{
 for(const link of ['https://youtu.be/abcdefghijk?si=secret','https://www.youtube.com/watch?v=abcdefghijk&list=ignored','https://music.youtube.com/watch?v=abcdefghijk','https://m.youtube.com/shorts/abcdefghijk','https://www.youtube.com/live/abcdefghijk','https://www.youtube-nocookie.com/embed/abcdefghijk']){
  const parsed=C.parseLink(link);assert.equal(parsed.kind,'youtube');assert.equal(parsed.url,'https://www.youtube.com/watch?v=abcdefghijk');assert.equal(parsed.source.videoId,'abcdefghijk');assert.equal(new URL(parsed.embedUrl).hostname,'www.youtube-nocookie.com');
 }
});
test('Spotify track URLs incl localized/embed paths become canonical embeds',()=>{
 const id='0123456789ABCDEFGHIJKL';
 for(const url of ['https://open.spotify.com/track/'+id+'?si=secret','https://open.spotify.com/intl-vi/track/'+id,'https://open.spotify.com/embed/track/'+id]){
  const p=C.parseLink(url);assert.equal(p.url,'https://open.spotify.com/track/'+id);assert.equal(p.embedUrl,'https://open.spotify.com/embed/track/'+id);
 }
});
test('SoundCloud accepts one public track, strips tracking and encodes its widget target',()=>{
 const p=C.parseLink('https://www.soundcloud.com/artist-name/song-name?si=tracking');assert.equal(p.url,'https://soundcloud.com/artist-name/song-name');assert.equal(new URL(p.embedUrl).searchParams.get('url'),p.url);assert.equal(new URL(p.embedUrl).searchParams.get('auto_play'),'false');
 const song=JSON.parse(fs.readFileSync(new URL('../content/music/lesson-template.json',import.meta.url)));song.source=p.source;assert.equal(C.validateSong(song).source.url,p.url);
 song.source.url='https://open.spotify.com/track/0123456789ABCDEFGHIJKL';assert.throws(()=>C.validateSong(song));
});
test('rejects arbitrary domains, credentials, deceptive hosts, scripts, playlists, private tracks and short links',()=>{
 for(const url of ['https://youtube.com.evil.test/watch?v=abcdefghijk','https://youtube.com@evil.test/watch?v=abcdefghijk','https://evil.test','javascript:alert(1)','http://youtu.be/abcdefghijk','https://youtu.be:444/abcdefghijk','https://www.youtube.com/playlist?list=x','https://www.youtube.com/@channel','https://open.spotify.com/album/0123456789ABCDEFGHIJKL','https://soundcloud.com/artist/sets','https://soundcloud.com/artist/song?secret_token=s-secret','https://soundcloud.com/artist/song/s-secret','https://on.soundcloud.com/abc','https://spotify.link/abc','https://soundcloud.com/discover/song'])assert.throws(()=>C.parseLink(url),url);
});
