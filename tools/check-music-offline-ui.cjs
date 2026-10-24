/* Local-file-only offline playback; no external download service or codec required. */
const {chromium}=require('playwright'),fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=process.cwd(),server=http.createServer((req,res)=>{
  const f=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);
  if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.m4a':'audio/mp4'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
 try{
  browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
  for(const width of [390,1440]){
   const page=await browser.newPage({viewport:{width,height:900},serviceWorkers:'block'}),errors=[],blocked=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>Object.defineProperty(window,'__offlineAudio',{get:()=>document.getElementById('musicBackgroundAudio')}));
   await page.route('https://**/*',route=>{blocked.push(route.request().url());return route.abort();});
   await page.route('**/account-config.json',route=>route.fulfill({json:{enabled:false}}));
   const address='http://127.0.0.1:'+server.address().port+'/index.html';
   await page.goto(address);await page.waitForFunction(()=>window.HSKMusic&&window.HSKMusicOffline&&window.HSKStudio);
   await page.evaluate(()=>{localStorage.setItem('hsk-account-meta-v1',JSON.stringify({uid:'offline-one'}));window.HSKAccountDashboard={user:{uid:'offline-one'}};window.HSKStudio.navigate('music-play');});
   const openOffline=async()=>{await page.locator('#musicMenuBtn').click();await page.locator('#musicMenuOfflineRow').click();await page.waitForFunction(()=>!document.getElementById('musicOfflineUsage').textContent.includes('Đang đọc'));};
   const upload=async id=>{
    const choose=page.waitForEvent('filechooser');await page.locator(id).click();
    await (await choose).setFiles(path.join(root,'tools/fixtures/music-heaacv2-64k.m4a'));
    await page.waitForFunction(()=>!document.getElementById('musicOfflineImport').disabled);
   };
   await openOffline();
   assert.equal(await page.locator('#musicOfflineView').isVisible(),true);
   assert.equal(await page.locator('#musicOfflineAddCurrent').count(),0,'link download button is removed');
   assert.equal(await page.locator('#musicOfflineLinkUrl').count(),0,'link-to-file download form is removed');
   assert.equal(await page.locator('#musicOfflineQuality').isVisible(),false,'unused link transcoding quality selector is hidden');
   assert.equal(await page.locator('#musicOfflineAttachFile').isDisabled(),true,'no current song to attach file to');
   await upload('#musicOfflineImport');
   assert.equal(await page.locator('#musicOfflineList .music-offline-item').count(),1);
   assert.equal((await page.evaluate(()=>HSKMusicOffline.list('offline-one'))).length,1);
   const initialSize=await page.evaluate(()=>HSKMusicOffline.usage());
   assert.ok(initialSize>0&&initialSize<100*1024*1024);
   const original=await page.evaluate(async()=>{const row=(await HSKMusicOffline.list('offline-one'))[0];return HSKMusicOffline.get('offline-one',row.url).then(x=>({url:x.url,size:x.size,asset:x.asset}));});
   await page.locator('#musicMenuClose').click();
   await page.locator('#musicMenuBtn').click();await page.locator('#musicLinkImport>summary').click();
   await page.locator('#musicLinkUrl').fill('https://youtu.be/abcdefghijk');
   await page.locator('#musicLinkName').fill('Bài nhạc đã chọn');
   await page.locator('#musicLinkApply').click();
   await page.waitForFunction(()=>getComputedStyle(document.getElementById('musicMenuSheet')).visibility==='hidden');
   await openOffline();
   assert.equal(await page.locator('#musicOfflineAttachFile').isDisabled(),false);
   await upload('#musicOfflineAttachFile');
   assert.equal(await page.locator('#musicOfflineList .music-offline-item').count(),2);
   assert.equal(await page.evaluate(()=>HSKMusicOffline.usage()),initialSize,'identical uploaded content stores only one blob');
   assert.equal(await page.evaluate(async()=>HSKMusicOffline.get('offline-one','https://youtu.be/abcdefghijk')!==null),true);
   await page.evaluate(()=>{window.HSKAccountDashboard={user:{uid:'offline-two'}};window.dispatchEvent(new Event('hsk-account-ready'));});
   await openOffline();
   assert.equal(await page.locator('#musicOfflineList .music-offline-item').count(),0,'other account cannot see uploads');
   await page.evaluate(()=>localStorage.setItem('hsk-account-meta-v1',JSON.stringify({uid:'offline-two'})));
   await page.reload();await page.waitForFunction(()=>window.HSKMusic&&window.HSKStudio);
   await page.evaluate(()=>window.HSKStudio.navigate('music-play'));await openOffline();
   assert.equal(await page.locator('#musicOfflineList .music-offline-item').count(),0);
   await page.evaluate(()=>{window.HSKAccountDashboard={user:{uid:'offline-one'}};window.dispatchEvent(new Event('hsk-account-ready'));});
   await openOffline();
   assert.equal(await page.locator('#musicOfflineList .music-offline-item').count(),2,'saved local uploads survive browser refresh');
   await page.context().setOffline(true);
   await page.locator('#musicOfflineList .music-offline-item').filter({hasText:'music-heaacv2-64k'}).locator('.music-row-main').click();
   await page.waitForFunction(()=>window.__offlineAudio?.currentTime>.1,{},{timeout:30000});
   assert.equal(await page.locator('#musicLinkPlayer iframe').count(),0,'offline uploaded file never requires external iframe');
   assert.match(await page.locator('#musicLinkNotice').innerText(),/ngoại tuyến/i);
   await page.locator('#musicLinkPlay').click();await page.waitForFunction(()=>window.__offlineAudio.paused);
   const priorSrc=await page.evaluate(()=>window.__offlineAudio.src);
   await page.evaluate(()=>window.HSKStudio.navigate('practice'));
   assert.equal(await page.evaluate(()=>window.__offlineAudio.src),priorSrc,'navigation preserves native audio');
   await page.evaluate(()=>window.HSKStudio.navigate('music-play'));
   await page.waitForFunction(()=>window.__offlineAudio?.src?.startsWith('blob:'));
   await page.context().setOffline(false);
   await openOffline();
   await page.locator('#musicOfflineList .music-row-del').first().click();
   assert.equal(await page.evaluate(()=>HSKMusicOffline.usage()),initialSize,'shared blob survives deleting first reference');
   await page.locator('#musicOfflineList .music-row-del').click();
   await page.waitForFunction(()=>document.querySelectorAll('#musicOfflineList .music-offline-item').length===0);
   assert.equal(await page.evaluate(()=>HSKMusicOffline.usage()),0,'last reference frees local storage');
   assert.deepEqual(errors,[],'no uncaught browser errors');
   assert(!blocked.some(url=>/source\\.test|invidious|piped|cobalt|source-resolver|music-codec/i.test(url)),JSON.stringify(blocked));
   console.log('PASS upload-only offline UI',width,'M4A source, ownership, deduplication, online link attachment, reload, native offline playback, no backend');
   await page.close();
  }
 }finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
