const {JSDOM}=require('jsdom'),fs=require('fs'),assert=require('node:assert/strict');
const dom=new JSDOM('<main class="workspace"></main>',{url:'https://hsk.example/hsk/',runScripts:'outside-only'}),w=dom.window;
 w.requestAnimationFrame=callback=>setImmediate(callback);w.cancelAnimationFrame=clearImmediate;
const tick=()=>new Promise(r=>setImmediate(r));
w.HTMLMediaElement.prototype.pause=function(){};w.HTMLMediaElement.prototype.load=function(){};w.fetch=async()=>({ok:true,json:async()=>({enabled:false})});w.HSKAccountDashboard={user:{uid:'one'}};w.TextEncoder=TextEncoder;Object.defineProperty(w.crypto,'subtle',{value:crypto.subtle});
function Widget(){return {bind(n,f){if(n==='READY')setImmediate(f);},unbind(){},play(){},pause(){},seekTo(){},getDuration(f){f(6000);}};}Widget.Events=Object.fromEntries(['READY','PLAY','PAUSE','FINISH','PLAY_PROGRESS','SEEK','ERROR'].map(n=>[n,n]));w.SC={Widget};
for(const file of ['music-core.js','music-soundcloud.js','music.js'])w.eval(fs.readFileSync('src/modules/music/'+file,'utf8'));
const $=id=>w.document.getElementById(id),submit=()=>$('musicLinkForm').onsubmit({preventDefault(){}});
const links=['https://youtu.be/abcdefghijk?si=x','https://open.spotify.com/track/0123456789ABCDEFGHIJKL?si=x','https://soundcloud.com/artist/song?si=x'];
async function run(){
 $('musicPanel').hidden=false;w.HSKMusic.enter('study');await tick();
 // Entertainment URL import is gone; a timed lesson manifest is mandatory.
 $('musicLinkUrl').value=links[0];await submit();assert.match($('musicStatus').textContent,/Chọn file lời JSON/);assert.equal($('musicLinkPreview').hidden,true);
 // A late lyrics read must not mount a player in the next account.
 let done;Object.defineProperty($('musicLinkLyrics'),'files',{configurable:true,value:[{size:100,text:()=>new Promise(r=>done=r)}]});$('musicLinkUrl').value=links[0];const pending=submit();w.dispatchEvent(new w.Event('hsk-account-ready'));done(fs.readFileSync('content/music/lesson-template.json','utf8'));await pending;await tick();assert.equal($('musicLesson').hidden,true);
 // Spotify is listen-only: never fabricate HSK questions or grades from a URL.
 Object.defineProperty($('musicLinkLyrics'),'files',{value:[{size:100,text:async()=>fs.readFileSync('content/music/lesson-template.json','utf8')}]});$('musicLinkUrl').value=links[1];await submit();assert.match($('musicStatus').textContent,/Spotify hiện hỗ trợ mở nghe/);assert.equal($('musicLesson').hidden,true);
 // Official SoundCloud adapter converts milliseconds and cleans up all handlers.
 const handlers={},calls=[];function Widget(){return {bind:(n,cb)=>handlers[n]=cb,unbind:n=>delete handlers[n],seekTo:t=>calls.push(['seek',t]),play:()=>calls.push(['play']),pause:()=>calls.push(['pause'])};}Widget.Events=Object.fromEntries(['READY','PLAY','PAUSE','FINISH','PLAY_PROGRESS','SEEK','ERROR'].map(x=>[x,x]));w.SC={Widget};
 const container=w.document.createElement('div');w.document.body.append(container);let updates=0;const p=await w.HSKMusicSoundCloud.mount({url:links[2]},container,{isCurrent:()=>true,onReady:player=>player.seekTo(2),onTick:()=>updates++,onError:()=>{}});handlers.READY();handlers.PLAY();handlers.PLAY_PROGRESS({currentPosition:3500});assert.equal(p.getCurrentTime(),3.5);assert.equal(p.getPlayerState(),1);assert.equal(updates,1);assert.deepEqual(calls[0],['seek',2000]);p.pauseVideo();p.destroy();assert.equal(container.children.length,0);assert.equal(Object.keys(handlers).length,0);
 await tick();dom.window.close();console.log('PASS link imports: required lesson manifest, async account isolation and SoundCloud adapter');
}
run().catch(e=>{console.error(e);dom.window.close();process.exitCode=1});