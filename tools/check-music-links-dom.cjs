const {JSDOM}=require('jsdom'),fs=require('fs'),assert=require('node:assert/strict');
const dom=new JSDOM('<main class="workspace"></main>',{url:'https://hsk.example/hsk/',runScripts:'outside-only'}),w=dom.window;
const tick=()=>new Promise(r=>setImmediate(r));
w.HTMLMediaElement.prototype.pause=function(){};w.HTMLMediaElement.prototype.load=function(){};w.fetch=async()=>({ok:true,json:async()=>({enabled:false})});w.HSKAccountDashboard={user:{uid:'one'}};w.TextEncoder=TextEncoder;Object.defineProperty(w.crypto,'subtle',{value:crypto.subtle});
for(const file of ['music-core.js','music-soundcloud.js','music.js'])w.eval(fs.readFileSync('src/modules/music/'+file,'utf8'));
const $=id=>w.document.getElementById(id),submit=()=>$('musicLinkForm').onsubmit({preventDefault(){}});
const links=['https://youtu.be/abcdefghijk?si=x','https://open.spotify.com/track/0123456789ABCDEFGHIJKL?si=x','https://soundcloud.com/artist/song?si=x'];
async function run(){
 $('musicPanel').hidden=false;w.HSKMusic.enter();await tick();
 for(const link of links){$('musicLinkUrl').value=link;$('musicLinkName').value='<img src=x onerror=alert(1)>';await submit();assert.equal($('musicLinkPreview').hidden,false);assert.equal($('musicLesson').hidden,true);assert.equal($('musicLinkPlayer').children.length,1);assert.equal($('musicLinkTitle').querySelector('img'),null);assert.equal($('musicLoop').getAttribute('aria-pressed'),'false');}
 assert.match($('musicSourceLink').href,/^https:\/\/soundcloud.com/);assert.equal(JSON.parse(w.localStorage.getItem('hsk-music-links-v1:one')).length,3);
 assert.equal(w.localStorage.getItem('hsk-music-history-v1:one'),null);
 const old=$('musicLinkPlayer').firstChild;$('musicLinkUrl').value='https://evil.test/watch';await submit();assert.equal($('musicLinkPlayer').firstChild,old);assert.match($('musicStatus').textContent,/hỗ trợ/);
 // Route exit removes the cross-origin iframe so it cannot continue audio in the background.
 $('musicPanel').hidden=true;await tick();assert.equal($('musicLinkPlayer').children.length,0);
 $('musicPanel').hidden=false;w.HSKMusic.enter();await tick();assert.equal($('musicSavedLinks').querySelectorAll('.music-saved-item').length,3);
 w.HSKAccountDashboard={user:{uid:'two'}};w.dispatchEvent(new w.Event('hsk-account-ready'));await tick();assert.match($('musicSavedLinks').textContent,/Chưa có/);assert.equal($('musicLinkUrl').value,'');assert.equal($('musicLinkPlayer').children.length,0);
 // A late lyrics read must not mount a player in the next account.
 let done;Object.defineProperty($('musicLinkLyrics'),'files',{configurable:true,value:[{size:100,text:()=>new Promise(r=>done=r)}]});$('musicLinkUrl').value=links[0];const pending=submit();w.dispatchEvent(new w.Event('hsk-account-ready'));done(fs.readFileSync('content/music/lesson-template.json','utf8'));await pending;await tick();assert.equal($('musicLesson').hidden,true);
 // Spotify is listen-only: never fabricate HSK questions or grades from a URL.
 Object.defineProperty($('musicLinkLyrics'),'files',{value:[{size:100,text:async()=>fs.readFileSync('content/music/lesson-template.json','utf8')}]});$('musicLinkUrl').value=links[1];await submit();assert.match($('musicStatus').textContent,/Spotify hiện hỗ trợ mở nghe/);assert.equal($('musicLesson').hidden,true);
 // Official SoundCloud adapter converts milliseconds and cleans up all handlers.
 const handlers={},calls=[];function Widget(){return {bind:(n,cb)=>handlers[n]=cb,unbind:n=>delete handlers[n],seekTo:t=>calls.push(['seek',t]),play:()=>calls.push(['play']),pause:()=>calls.push(['pause'])};}Widget.Events=Object.fromEntries(['READY','PLAY','PAUSE','FINISH','PLAY_PROGRESS','SEEK','ERROR'].map(x=>[x,x]));w.SC={Widget};
 const container=w.document.createElement('div');w.document.body.append(container);let updates=0;const p=await w.HSKMusicSoundCloud.mount({url:links[2]},container,{isCurrent:()=>true,onReady:player=>player.seekTo(2),onTick:()=>updates++,onError:()=>{}});handlers.READY();handlers.PLAY();handlers.PLAY_PROGRESS({currentPosition:3500});assert.equal(p.getCurrentTime(),3.5);assert.equal(p.getPlayerState(),1);assert.equal(updates,1);assert.deepEqual(calls[0],['seek',2000]);p.pauseVideo();p.destroy();assert.equal(container.children.length,0);assert.equal(Object.keys(handlers).length,0);
 // Late YouTube events from a destroyed player cannot overwrite a newly opened source.
 w.YT={Player:function(mount,options){const frame=w.document.createElement('iframe');mount.replaceWith(frame);w.oldYoutubeEvents=options.events;this.seekTo=()=>{};this.getCurrentTime=()=>0;this.getPlayerState=()=>2;this.pauseVideo=()=>{};this.destroy=()=>frame.remove();}};
 $('musicLinkUrl').value=links[0];await submit();const stale=w.oldYoutubeEvents;Object.defineProperty($('musicLinkLyrics'),'files',{value:[]});$('musicLinkUrl').value=links[1];await submit();const latestStatus=$('musicStatus').textContent;stale.onError();stale.onAutoplayBlocked();assert.equal($('musicStatus').textContent,latestStatus);
 await tick();dom.window.close();console.log('PASS link imports: three providers, no fake lessons, canonical saved links, route/account cleanup, async isolation and SoundCloud adapter');
}
run().catch(e=>{console.error(e);dom.window.close();process.exitCode=1});
