const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
(async()=>{
 const root=process.cwd(),server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));});await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
 for(const width of [390,1440]){
 const page=await browser.newPage({viewport:{width,height:900},serviceWorkers:'block'}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://**/*',r=>r.abort());await page.route('**/account-config.json',r=>r.fulfill({json:{enabled:false}}));await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.waitForFunction(()=>window.HSKMusic&&window.HSKStudio&&window.HSKLessons);
 // Reproduce cold-start auth timing with deliberately different guest history.
 await page.evaluate(()=>{
  localStorage.setItem('hsk-account-meta-v1',JSON.stringify({uid:'stable-recents'}));
  localStorage.setItem('hsk-music-links-v1:stable-recents',JSON.stringify([{url:'https://youtu.be/abcdefghijk',title:'Bài đã nghe của tôi'}]));
  localStorage.setItem('hsk-music-links-v1:guest',JSON.stringify([{url:'https://soundcloud.com/guest/track',title:'Bài của khách'}]));
  window.HSKAccountDashboard={user:null};window.HSKStudio.navigate('music-play');
 });
 const recentTitles=()=>page.locator('#musicRecentList .music-recent-title').allTextContents();
 assert.deepEqual(await recentTitles(),['Bài đã nghe của tôi'],'cold entry uses the cached account, never guest/sample songs');
 for(const user of [null,{uid:'stable-recents'},null,{uid:'stable-recents'}]){
  await page.evaluate(user=>{window.HSKAccountDashboard={user};window.dispatchEvent(new Event('hsk-account-ready'));},user);
  assert.deepEqual(await recentTitles(),['Bài đã nghe của tôi'],'history stays unchanged across account restore notifications');
 }
 await page.locator('[data-browse-filter=playlists]').click();
 await page.evaluate(()=>{window.HSKStudio.navigate('practice');window.HSKStudio.navigate('music-play');});
 assert.equal(await page.locator('#musicBrowseRecentSection').isVisible(),true);
 assert.deepEqual(await recentTitles(),['Bài đã nghe của tôi'],'route re-entry retains the same history and default view');
 await page.evaluate(()=>{localStorage.removeItem('hsk-account-meta-v1');localStorage.removeItem('hsk-music-links-v1:guest');window.HSKAccountDashboard={user:{uid:'links-user'}};window.dispatchEvent(new Event('hsk-account-ready'));window.HSKStudio.navigate('music-play');});
 assert.equal(await page.locator('#musicRecentList .music-recent-row').count(),0,'empty history never substitutes recommended songs');
 assert.match(await page.locator('#musicRecentList').innerText(),/Chưa có bài nghe gần đây/);

 for(const [url,host] of [['https://youtu.be/abcdefghijk?si=x','www.youtube-nocookie.com'],['https://open.spotify.com/track/0123456789ABCDEFGHIJKL?si=x','open.spotify.com'],['https://soundcloud.com/artist/song?si=x','w.soundcloud.com']]){
 if(!(await page.locator('#musicMenuSheet').isVisible()))await page.locator('#musicMenuBtn').click();
 if(!(await page.locator('#musicLinkImport').evaluate(d=>d.open)))await page.locator('#musicLinkImport>summary').click();
 await page.locator('#musicLinkUrl').fill(url);await page.locator('#musicLinkName').fill('Bài thử từ link');await page.locator('#musicLinkApply').click();await page.waitForFunction(()=>!document.getElementById('musicLinkApply').disabled);await page.waitForFunction(()=>getComputedStyle(document.getElementById('musicMenuSheet')).visibility==='hidden');assert.equal(await page.locator('#musicMenuSheet').isVisible(),false);assert.equal(await page.locator('#musicLinkPreview').isVisible(),true);assert.equal(new URL(await page.locator('#musicLinkPlayer iframe').getAttribute('src')).hostname,host);assert.equal(await page.locator('#musicLesson').isVisible(),false);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);
 if(url==='https://youtu.be/abcdefghijk?si=x'){const peek=page.locator('#musicChillPeekToggle'),peekBox=await peek.boundingBox();assert.ok(peekBox,'bottom sheet handle is present in the expanded player');await page.mouse.move(peekBox.x+peekBox.width/2,peekBox.y+peekBox.height/2);await page.mouse.down();await page.mouse.move(peekBox.x+peekBox.width/2,peekBox.y+peekBox.height/2-120,{steps:5});const duringDrag=await page.locator('#musicQueueSheet').boundingBox();assert.ok(duringDrag&&Math.abs(duringDrag.y-(peekBox.y-120))<4,'sheet follows the pointer before release: '+JSON.stringify(duringDrag));await page.mouse.up();await page.waitForFunction(()=>document.getElementById('musicChillPeekToggle').getAttribute('aria-expanded')==='true');assert.equal(await page.locator('#musicMenuBtn').getAttribute('aria-expanded'),'false','dragging queue never opens ellipsis menu');assert.match(await page.locator('#musicQueueSheet').evaluate(n=>getComputedStyle(n).transitionDuration),/0\.3/,'sheet has a smooth transition');await page.locator('#musicQueueSheet').evaluate(n=>Promise.all(n.getAnimations().map(a=>a.finished.catch(()=>{}))));const sheetBefore=await page.locator('#musicQueueSheet').boundingBox(),handle=await page.locator('#musicQueueClose').boundingBox(),cdp=await page.context().newCDPSession(page),tx=handle.x+handle.width/2,ty=handle.y+handle.height/2;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:tx,y:ty}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:tx,y:ty+80}]});const sheetHeld=await page.locator('#musicQueueSheet').boundingBox();assert.ok(Math.abs(sheetHeld.y-sheetBefore.y-80)<4,'touch drag moves the actual sheet 1:1 before finger release');await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await cdp.detach();await page.locator('#musicQueueClose').click();await page.waitForFunction(()=>getComputedStyle(document.getElementById('musicQueueSheet')).visibility==='hidden');const touchPeek=await peek.boundingBox(),touch=await page.context().newCDPSession(page),px=touchPeek.x+touchPeek.width/2,py=touchPeek.y+touchPeek.height/2;await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:px,y:py}]});await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:px,y:py-60}]});assert.ok(Math.abs((await page.locator('#musicQueueSheet').boundingBox()).y-(touchPeek.y-60))<4,'touch opening follows the collapsed handle 1:1');await touch.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await touch.detach();await page.waitForFunction(()=>getComputedStyle(document.getElementById('musicQueueSheet')).visibility==='hidden');await page.locator('#musicBack').click();const mini=await page.locator('#musicMiniMain').boundingBox(),miniInner=await page.locator('.music-mini-inner').boundingBox();assert.ok(Math.abs(mini.y-miniInner.y)<1&&Math.abs(mini.height-miniInner.height)<1,'mini player press surface spans the full row height without a clipped strip');await page.mouse.move(mini.x+mini.width/2,mini.y+mini.height/2);await page.mouse.down();await page.mouse.move(mini.x+mini.width/2,mini.y+mini.height/2-120,{steps:8});const stageHeld=await page.locator('.music-stage').boundingBox();assert.ok(Math.abs(stageHeld.y-780)<4,'full player follows mini-player drag before release');await page.mouse.up();await page.waitForFunction(()=>!document.getElementById('musicPanel').classList.contains('music-player-dragging'));}
 }
 await page.locator('#musicMenuBtn').click();
 assert.equal(await page.locator('#musicSavedLinks .music-saved-item').count(),3);
 // Create a named playlist from the library sub-view, save the current track via the
 // Spotify-style "Đã lưu vào" picker, add a track directly, then cycle with << / >>.
 await page.locator('#musicMenuLibraryRow').click();
 assert.equal(await page.locator('#musicPlaylistsBox').isVisible(),true,'library sub-view shows playlists');
 assert.equal(await page.locator('#musicLinkImport').isVisible(),false,'library sub-view hides main actions');
 if(await page.locator('#musicPlaylistCreateBox').count()){if(!(await page.locator('#musicPlaylistCreateBox').evaluate(d=>d.open)))await page.locator('#musicPlaylistCreateBox>summary').click();}
 await page.locator('#musicPlaylistName').fill('Nhạc Hoa chill');await page.locator('#musicPlaylistCreateBtn').click();
 assert.equal(await page.locator('#musicPlaylistList .music-playlist-card').count(),1);
 await page.locator('#musicMenuSubCancel').click();
 assert.equal(await page.locator('#musicPlaylistsBox').isVisible(),false,'main view is compact');
 await page.locator('#musicPreviewPlaylistAdd').click();
 assert.equal(await page.locator('#musicSaveView').isVisible(),true,'save picker opens as its own sheet');
 await page.locator('#musicSavePicker .music-save-row').first().click();
 assert.equal(await page.locator('#musicSavePicker .music-save-row').first().getAttribute('aria-checked'),'true');
 await page.locator('#musicSaveDone').click();
 await page.waitForFunction(()=>getComputedStyle(document.getElementById('musicMenuSheet')).visibility==='hidden');
 assert.equal(await page.locator('#musicMenuSheet').isVisible(),false,'Xong closes the sheet');
 assert.equal(await page.locator('#musicQuickSaveBtn').getAttribute('aria-pressed'),'true');
 await page.locator('#musicMenuBtn').click();
 await page.locator('#musicMenuLibraryRow').click();
 await page.locator('#musicPlaylistList .music-playlist-head').first().click();
 await page.locator('#musicPlaylistList .music-playlist-add-track input[type=url]').fill('https://youtu.be/abcdefghijk');
 await page.locator('#musicPlaylistList .music-playlist-add-track input[type=text]').fill('Bài YouTube số 1');
 await page.locator('#musicPlaylistList .music-playlist-add-track button[type=submit]').click();
 assert.equal(await page.locator('#musicPlaylistList .music-playlist-track').count(),2);
 await page.locator('#musicPlaylistList .music-playlist-actions button').first().click();
 await page.waitForFunction(()=>getComputedStyle(document.getElementById('musicMenuSheet')).visibility==='hidden');
 assert.equal(await page.locator('#musicMenuSheet').isVisible(),false);
 assert.equal(await page.locator('#musicLinkTitle').innerText(),'Bài YouTube Số 1');
 await page.locator('#musicLinkNext').click();
 assert.equal(await page.locator('#musicLinkTitle').innerText(),'Bài Thử Từ Link');
 await page.locator('#musicLinkPrev').click();
 assert.equal(await page.locator('#musicLinkTitle').innerText(),'Bài YouTube Số 1');
 // The bottom handle and queue icon open playback order, not the ellipsis menu.
 await page.locator('#musicChillPeekToggle').click();
 await page.locator('#musicQueueSheet').evaluate(n=>Promise.all(n.getAnimations().map(a=>a.finished.catch(()=>{}))));
 assert.equal(await page.locator('#musicQueueCurrent .music-queue-track strong').innerText(),'Bài YouTube Số 1');
 assert.equal(await page.locator('#musicQueueNext .music-queue-track').count(),1);
 assert.equal(await page.locator('#musicQueueNext .music-queue-track strong').innerText(),'Bài Thử Từ Link');
 assert.equal(await page.locator('#musicMenuBtn').getAttribute('aria-expanded'),'false');
 await page.locator('#musicQueueNext .music-queue-track').click();
 assert.equal(await page.locator('#musicLinkTitle').innerText(),'Bài Thử Từ Link');
 await page.waitForFunction(()=>getComputedStyle(document.getElementById('musicQueueSheet')).visibility==='hidden');
 await page.locator('#musicQuickQueue').click();
 await page.locator('#musicQueueSheet').evaluate(n=>Promise.all(n.getAnimations().map(a=>a.finished.catch(()=>{}))));
 assert.equal(await page.locator('#musicQueueNext .music-queue-track strong').innerText(),'Bài YouTube Số 1','queue wraps in the same order as Next');
 await page.keyboard.press('Escape');
 await page.waitForFunction(()=>getComputedStyle(document.getElementById('musicQueueSheet')).visibility==='hidden');
 await page.locator('#musicMenuBtn').click();
 assert.equal(await page.locator('#musicMenuSheet').getAttribute('data-view'),'main');
 assert.equal(await page.locator('#musicQueueSheet').isVisible(),false);
 await page.locator('#musicMenuClose').click();
 await page.waitForFunction(()=>getComputedStyle(document.getElementById('musicMenuSheet')).visibility==='hidden');
 // A reviewed SoundCloud lesson uses official widget events in milliseconds.
 await page.evaluate(()=>{
 window.scTest={seek:0,handlers:{},unbinds:0,ready:false,seeks:[],clicks:[],widgets:0};function Widget(){const state=window.scTest;state.widgets++;return {bind(name,fn){state.handlers[name]=fn;if(name==='READY')setTimeout(()=>{fn();state.ready=true;},0);},unbind(){state.unbinds++;},seekTo(ms){state.seek=ms;state.seeks.push({ms,stack:new Error().stack});},play(){state.handlers.PLAY?.();},pause(){state.handlers.PAUSE?.();}};}Widget.Events=Object.fromEntries(['READY','PLAY','PAUSE','FINISH','PLAY_PROGRESS','SEEK','ERROR'].map(n=>[n,n]));window.SC={Widget};
 document.addEventListener('click',event=>{const id=event.target.closest('button')?.id;if(id?.startsWith('music'))scTest.clicks.push(id);},true);
 window.scTest.pointer=[];
 for(const type of ['pointerdown','pointerup','mousedown','mouseup','click'])window.addEventListener(type,event=>{
  if(!scTest.ready)return;
  const button=event.target.closest('button'),forward=document.getElementById('musicForward10');
  scTest.pointer.push({type,target:button?.id||event.target.id||event.target.tagName,x:event.clientX,y:event.clientY,forward:forward.getBoundingClientRect().toJSON(),transform:getComputedStyle(forward).transform,scroll:document.querySelector('.music-stage').scrollTop});
 },true);
 });
 await page.locator('#musicMenuBtn').click();
 if(!(await page.locator('#musicLinkImport').evaluate(d=>d.open)))await page.locator('#musicLinkImport>summary').click();
 await page.locator('#musicLinkUrl').fill('https://soundcloud.com/artist/song');await page.locator('#musicLinkLyrics').setInputFiles(path.join(root,'content/music/lesson-template.json'));await page.locator('#musicLinkApply').click();await page.waitForFunction(()=>!document.getElementById('musicLesson').hidden);assert.equal(await page.locator('#musicRate').isDisabled(),true);assert.equal(await page.locator('#musicLoop').getAttribute('aria-pressed'),'false');
 // Selecting a lesson renders its controls before the asynchronous widget mount
 // finishes. Wait for READY before testing transport, as the real SDK requires.
 await page.waitForFunction(()=>window.scTest?.ready===true);
 const widgetBox=await page.locator('#musicYoutube iframe').boundingBox(),transportBox=await page.locator('#musicLesson .music-transport').boundingBox();
 assert.ok(widgetBox&&transportBox&&Math.abs(widgetBox.height-166)<1&&widgetBox.y+widgetBox.height<=transportBox.y,'SoundCloud embed stays bounded above real transport touch targets');
 await page.screenshot({path:'/tmp/music-soundcloud-'+width+'.png'});
 await page.locator('#musicNext').click();assert.equal(await page.evaluate(()=>scTest.seek),5000);
 await page.locator('#musicForward10').click();
 const forwardState=await page.evaluate(()=>({seek:Math.round(scTest.seek),seeks:scTest.seeks,clicks:scTest.clicks,pointer:scTest.pointer,widgets:scTest.widgets,ready:scTest.ready,scrub:document.getElementById('musicScrub').value,rect:document.getElementById('musicForward10').getBoundingClientRect().toJSON()}));
 assert.equal(forwardState.seek,9950,JSON.stringify(forwardState));
 await page.locator('#musicRewind10').click();assert.equal(await page.evaluate(()=>Math.round(scTest.seek)),4950);await page.locator('#musicRewind10').click();assert.equal(await page.evaluate(()=>Math.round(scTest.seek)),0);await page.locator('#musicPrevTrack').click();assert.equal(await page.evaluate(()=>scTest.seek),0);await page.locator('#musicNextTrack').click();assert.equal(await page.evaluate(()=>scTest.seek),5000);await page.locator('#musicLoop').click();await page.evaluate(()=>scTest.handlers.PLAY_PROGRESS({currentPosition:10020}));assert.equal(await page.evaluate(()=>scTest.seek),5000);
 await page.evaluate(()=>window.HSKStudio.navigate('practice'));await page.evaluate(()=>window.HSKStudio.navigate('music'));await page.waitForFunction(()=>window.scTest.unbinds>0);await page.locator('#musicPlay').click();await page.evaluate(()=>scTest.handlers.PLAY_PROGRESS({currentPosition:5200}));
 await page.evaluate(()=>{window.HSKAccountDashboard={user:{uid:'other'}};window.dispatchEvent(new Event('hsk-account-ready'));});assert.equal(await page.locator('#musicLinkPlayer iframe').count(),0);assert.equal(await page.locator('#musicYoutube iframe').count(),0);assert.equal(await page.locator('#musicSavedLinks .music-saved-item').count(),0);
 assert.deepEqual(errors,[]);console.log('PASS music links UI',width,'three official embeds, optional timed SoundCloud lesson, seek/loop and account cleanup; providers mocked');await page.close();
 }
 }finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
