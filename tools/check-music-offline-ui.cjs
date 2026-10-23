const {chromium}=require('playwright'),fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=process.cwd(),server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.m4a':'audio/mp4'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
  for(const width of [390,1440]){
   const page=await browser.newPage({viewport:{width,height:900},serviceWorkers:'block'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>{const AudioOriginal=window.Audio;window.Audio=function(...args){const audio=new AudioOriginal(...args);window.__offlineAudio=audio;return audio;};window.Audio.prototype=AudioOriginal.prototype;});
   await page.route('https://**/*',r=>r.abort());await page.route('**/account-config.json',r=>r.fulfill({json:{enabled:false}}));
   const url='http://127.0.0.1:'+server.address().port+'/index.html';
   await page.goto(url);await page.waitForFunction(()=>window.HSKMusic&&window.HSKMusicOffline&&window.HSKStudio);
   await page.evaluate(()=>{localStorage.setItem('hsk-account-meta-v1',JSON.stringify({uid:'offline-one'}));window.HSKAccountDashboard={user:{uid:'offline-one'}};window.HSKStudio.navigate('music-play');});
   await page.locator('#musicMenuBtn').click();await page.locator('#musicLinkImport>summary').click();await page.locator('#musicLinkUrl').fill('https://youtu.be/abcdefghijk');await page.locator('#musicLinkName').fill('Bài nhạc đã chọn');await page.locator('#musicLinkApply').click();
   await page.waitForFunction(()=>getComputedStyle(document.getElementById('musicMenuSheet')).visibility==='hidden');
   const openOffline=async()=>{await page.locator('#musicMenuBtn').click();await page.locator('#musicMenuOfflineRow').click();await page.waitForFunction(()=>!document.getElementById('musicOfflineUsage').textContent.includes('Đang đọc'));};
   const upload=async button=>{const chooser=page.waitForEvent('filechooser');await page.locator(button).click();await (await chooser).setFiles(path.join(root,'tools/fixtures/music-heaacv2-64k.m4a'));await page.waitForFunction(()=>!document.getElementById('musicOfflineImport').disabled);};
   await openOffline();assert.equal(await page.locator('#musicOfflineView').isVisible(),true);assert.equal(await page.locator('#musicMenuLibraryRow').isVisible(),false,'offline sub-view is separate from main actions');
   await upload('#musicOfflineAddCurrent');assert.equal(await page.locator('#musicOfflineList .music-offline-item').count(),1);
   const bytes=await page.evaluate(()=>HSKMusicOffline.usage());assert.ok(bytes>0&&bytes<100*1024*1024);
   await upload('#musicOfflineImport');assert.equal(await page.locator('#musicOfflineList .music-offline-item').count(),2);assert.equal(await page.evaluate(()=>HSKMusicOffline.usage()),bytes,'same file imported twice occupies only one asset');
   // A different account sees no personal downloads; returning owner keeps them.
   await page.evaluate(()=>{window.HSKAccountDashboard={user:{uid:'offline-two'}};window.dispatchEvent(new Event('hsk-account-ready'));});
   await openOffline();await page.waitForFunction(()=>document.getElementById('musicOfflineUsage').textContent.startsWith('0 bài'));
   assert.equal(await page.locator('#musicOfflineList .music-offline-item').count(),0);
   await page.reload();await page.waitForFunction(()=>window.HSKMusic&&window.HSKStudio);
   await page.evaluate(()=>window.HSKStudio.navigate('music-play'));await openOffline();assert.equal(await page.locator('#musicOfflineList .music-offline-item').count(),2,'downloads survive reload and cached account restoration');
   await page.context().setOffline(true);
   // Play standalone imported file without any provider or media network request.
   await page.locator('#musicOfflineList .music-offline-item').filter({hasText:'music-heaacv2-64k'}).locator('.music-row-main').click();
   await page.waitForFunction(()=>window.__offlineAudio?.currentTime>.1);
   assert.equal(await page.locator('#musicLinkPlayer iframe').count(),0);assert.match(await page.locator('#musicLinkNotice').innerText(),/ngoại tuyến/);
   await page.locator('#musicLinkScrub').evaluate(n=>{n.value='2';n.dispatchEvent(new Event('input',{bubbles:true}));});
   await page.waitForFunction(()=>window.__offlineAudio.currentTime>=1.9);assert.equal(await page.locator('#musicQuickLoop').getAttribute('aria-pressed'),'false');
   await page.locator('#musicLinkPlay').click();await page.waitForFunction(()=>window.__offlineAudio.paused);
   await page.evaluate(()=>window.HSKStudio.navigate('practice'));
   await page.waitForFunction(()=>window.__offlineAudio.getAttribute('src')===null);
   await page.evaluate(()=>window.HSKStudio.navigate('music-play'));
   await page.waitForFunction(()=>window.__offlineAudio?.src?.startsWith('blob:')&&window.__offlineAudio.readyState>=1);
   assert.equal(await page.evaluate(()=>window.__offlineAudio.paused),true,'route re-entry restores local source without autoplay');
   await openOffline();await page.locator('#musicOfflineList .music-row-del').first().click();await page.waitForFunction(()=>document.querySelectorAll('#musicOfflineList .music-offline-item').length===1);assert.equal(await page.evaluate(()=>HSKMusicOffline.usage()),bytes,'deleting one shared reference retains the file');
   await page.locator('#musicOfflineList .music-row-del').click();await page.waitForFunction(()=>document.querySelectorAll('#musicOfflineList .music-offline-item').length===0);assert.equal(await page.evaluate(()=>HSKMusicOffline.usage()),0);
   await page.context().setOffline(false);assert.deepEqual(errors,[]);console.log('PASS offline music UI',width,'M4A add-to-current/import, dedup, account isolation, reload persistence, real offline play/pause/seek, delete');await page.close();
  }
 }finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
