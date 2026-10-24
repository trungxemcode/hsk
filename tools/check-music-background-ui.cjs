/* Real local audio survives app-route and visibility changes. OS lock is a device check. */
const {chromium}=require('playwright'),fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=process.cwd(),server=http.createServer((q,r)=>{
  const f=path.resolve(root,'.'+new URL(q.url,'http://local').pathname);
  if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){r.writeHead(404);return r.end();}
  r.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.m4a':'audio/mp4'})[path.extname(f)]||'application/octet-stream');r.end(fs.readFileSync(f));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
  for(const width of [390,1440]){
   const page=await browser.newPage({viewport:{width,height:900},serviceWorkers:'block'}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));await page.route('https://**/*',r=>r.abort());
   await page.route('**/account-config.json',r=>r.fulfill({json:{enabled:false}}));
   await page.addInitScript(()=>{
    window.__musicActions={};window.__musicSession={playbackState:'none',setActionHandler:(a,f)=>window.__musicActions[a]=f,setPositionState:p=>window.__musicPosition=p};
    Object.defineProperty(navigator,'mediaSession',{value:window.__musicSession});
    Object.defineProperty(navigator,'audioSession',{value:{type:'auto'}});
   });
   await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');
   await page.waitForFunction(()=>window.HSKMusic&&window.HSKMusicOffline&&window.HSKStudio);
   await page.evaluate(async()=>{
    localStorage.setItem('hsk-account-meta-v1',JSON.stringify({uid:'background-one'}));window.HSKAccountDashboard={user:{uid:'background-one'}};
    const bytes=await (await fetch('./tools/fixtures/music-heaacv2-64k.m4a')).arrayBuffer();
    for(const [url,title] of [['https://www.youtube.com/watch?v=abcdefghijk','Bài thứ nhất'],['https://www.youtube.com/watch?v=lmnopqrstuv','Bài thứ hai']]){
     await HSKMusicOffline.put('background-one',{url,title,author:'Nghệ sĩ thử'},new File([bytes],'test.m4a',{type:'audio/mp4'}));
    }
    HSKStudio.navigate('music-play');
   });
   await page.locator('#musicMenuBtn').click();await page.locator('#musicMenuOfflineRow').click();
   await page.locator('#musicOfflineList .music-row-main').filter({hasText:'Bài thứ hai'}).click();
   await page.waitForFunction(()=>document.getElementById('musicBackgroundAudio')?.currentTime>.1);
   await page.evaluate(()=>window.__audioBefore=document.getElementById('musicBackgroundAudio'));
   assert.equal(await page.evaluate(()=>__audioBefore.loop),false,'loop is opt-in');
   await page.locator('#musicQuickLoop').click();assert.equal(await page.evaluate(()=>__audioBefore.loop),true);
   await page.locator('#musicQuickLoop').click();assert.equal(await page.evaluate(()=>__audioBefore.loop),false);
   const source=await page.locator('#musicBackgroundAudio').getAttribute('src');
   await page.evaluate(()=>HSKStudio.navigate('home'));
   await page.waitForFunction(()=>!document.getElementById('musicBackgroundPlayer').hidden);
   assert.equal(await page.locator('#musicBackgroundAudio').getAttribute('src'),source);
   assert.equal(await page.evaluate(()=>__audioBefore.paused),false,'route exit does not pause music');
   const bar=await page.locator('#musicBackgroundPlayer').boundingBox();assert(bar.x>=0&&bar.x+bar.width<=width&&bar.y>=0&&bar.y+bar.height<=900,'background controls fit viewport');
   await page.locator('#musicBackgroundPlayer [aria-label="Tạm dừng nhạc"]').click();
   await page.waitForFunction(()=>__audioBefore.paused);
   await page.locator('#musicBackgroundPlayer [aria-label="Phát nhạc"]').click();
   await page.waitForFunction(()=>!__audioBefore.paused);
   await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('pagehide'));});
   const before=await page.evaluate(()=>__audioBefore.currentTime);await page.waitForTimeout(350);
   assert(await page.evaluate(t=>__audioBefore.currentTime>t,before),'real audio advances after simulated background and pagehide');
   assert.equal(await page.evaluate(()=>navigator.audioSession.type),'playback');
   await page.evaluate(()=>__musicActions.pause());await page.waitForFunction(()=>__audioBefore.paused);
   assert.equal(await page.evaluate(()=>__musicSession.playbackState),'paused');
   await page.evaluate(()=>__musicActions.play());await page.waitForFunction(()=>!__audioBefore.paused);
   await page.evaluate(()=>__musicActions.seekto({seekTime:1}));
   await page.waitForFunction(()=>__audioBefore.currentTime>=.9);
   assert.equal(await page.evaluate(()=>__musicSession.metadata.title),'Bài thứ hai');
   await page.evaluate(()=>{__audioBefore.currentTime=__audioBefore.duration-.15;});
   await page.waitForFunction(()=>__musicSession.metadata.title==='Bài thứ nhất'&&!__audioBefore.paused);
   assert.equal(await page.evaluate(()=>document.getElementById('musicBackgroundAudio')===__audioBefore),true,'next offline track reuses the user-activated audio element');
   const nextSource=await page.evaluate(()=>__audioBefore.getAttribute('src'));
   await page.evaluate(()=>HSKStudio.navigate('music-play'));
   await page.waitForTimeout(300);
   assert.equal(await page.locator('#musicBackgroundAudio').getAttribute('src'),nextSource,'returning to collapsed browse does not reload an active offline source');
   assert.equal(await page.evaluate(()=>__audioBefore.paused),false,'return to music does not restart or pause playback');
   await page.evaluate(()=>HSKStudio.navigate('practice'));await page.waitForFunction(()=>!document.getElementById('musicBackgroundPlayer').hidden);
   await page.evaluate(()=>{localStorage.setItem('hsk-account-meta-v1',JSON.stringify({uid:'background-two'}));HSKAccountDashboard.user={uid:'background-two'};window.dispatchEvent(new Event('hsk-account-ready'));});
   await page.waitForFunction(()=>__audioBefore.paused&&!__audioBefore.hasAttribute('src')&&document.getElementById('musicBackgroundPlayer').hidden);
   assert.equal(await page.evaluate(()=>navigator.audioSession.type),'auto');
   assert.equal(await page.evaluate(()=>__musicSession.playbackState),'none');
   assert.deepEqual(errors,[]);await page.close();console.log('PASS background music',width,'real audio, route/visibility, mini controls, media session, next track reuse, account cleanup');
  }
 }finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
