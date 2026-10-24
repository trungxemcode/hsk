const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
(async()=>{
 const root=process.cwd(),server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));});await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
 for(const width of [390,1440]){
 const page=await browser.newPage({viewport:{width,height:900},serviceWorkers:'block'}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://**/*',r=>r.abort());await page.route('**/account-config.json',r=>r.fulfill({json:{enabled:false}}));await page.route('**/music-config.json',r=>r.fulfill({json:{enabled:false}}));await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.waitForFunction(()=>window.HSKMusic&&window.HSKStudio&&window.HSKLessons);await page.evaluate(()=>HSKStudio.navigate('music'));
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
 assert.deepEqual(errors,[]);console.log('PASS music study links UI',width,'timed SoundCloud seek/loop and account isolation');await page.close();
 }
 }finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
