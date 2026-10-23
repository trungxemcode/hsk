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
   await page.evaluate(()=>{localStorage.setItem('hsk-account-meta-v1',JSON.stringify({uid:'offline-one'}));window.HSKAccountDashboard={user:{uid:'offline-one',getIdToken:async()=> 'test-token'}};window.HSKStudio.navigate('music-play');});
   // Users may open offline without selecting a currently playing track.
   await page.locator('#musicMenuBtn').click();await page.locator('#musicMenuOfflineRow').click();
   assert.equal(await page.locator('#musicOfflineAddCurrent').isDisabled(),false,'save action must not look dead with no track');
   await page.locator('#musicOfflineAddCurrent').click();
   assert.match(await page.locator('#musicOfflineUsage').innerText(),/dán link/i,'empty selection shows feedback');
   await page.locator('#musicOfflineLinkUrl').fill('not-a-link');
   await page.locator('#musicOfflineAddCurrent').click();
   assert.match(await page.locator('#musicOfflineUsage').innerText(),/link|HTTPS/i,'invalid link shows feedback');
   await page.locator('#musicMenuClose').click();
   await page.locator('#musicMenuBtn').click();await page.locator('#musicLinkImport>summary').click();await page.locator('#musicLinkUrl').fill('https://youtu.be/abcdefghijk');await page.locator('#musicLinkName').fill('Bài nhạc đã chọn');await page.locator('#musicLinkApply').click();
   await page.waitForFunction(()=>getComputedStyle(document.getElementById('musicMenuSheet')).visibility==='hidden');
   const openOffline=async()=>{await page.locator('#musicMenuBtn').click();await page.locator('#musicMenuOfflineRow').click();await page.waitForFunction(()=>!document.getElementById('musicOfflineUsage').textContent.includes('Đang đọc'));};
   const upload=async button=>{const chooser=page.waitForEvent('filechooser');await page.locator(button).click();await (await chooser).setFiles(path.join(root,'tools/fixtures/music-heaacv2-64k.m4a'));await page.waitForFunction(()=>!document.getElementById('musicOfflineImport').disabled);};
   await openOffline();assert.equal(await page.locator('#musicOfflineView').isVisible(),true);assert.equal(await page.locator('#musicMenuLibraryRow').isVisible(),false,'offline sub-view is separate from main actions');
   // Original bytes come from a mocked resolver; the browser runs the real WASM encoder.
   await page.route('**/music-config.json',r=>r.fulfill({json:{offlineSourceResolver:'https://source.test'}}));
   let sourceRequests=0;
   await page.route('https://source.test/**',async r=>{const request=r.request(),pathname=new URL(request.url()).pathname;if(request.method()==='DELETE')return r.fulfill({json:{cancelled:true}});if(pathname.endsWith('/file')){await new Promise(resolve=>setTimeout(resolve,350));sourceRequests++;return r.fulfill({headers:{'X-Audio-Source':'original','Access-Control-Allow-Origin':'*','Access-Control-Expose-Headers':'X-Audio-Source'},body:fs.readFileSync(path.join(root,'tools/fixtures/music-heaacv2-64k.m4a'))});}return r.fulfill({json:{id:'test-job',status:'ready'}});});
   let lastSize=0;
   for(const quality of ['32','64','96']){
    await page.locator('#musicOfflineQuality').selectOption(quality);
    await page.locator('#musicOfflineAddCurrent').click();
    await page.waitForFunction(()=>!document.getElementById('musicOfflineProgress').hidden);
    assert.match(await page.locator('#musicDownloadMessage').textContent(),/Đang/);
    await page.waitForFunction(()=>!document.getElementById('musicOfflineCancel').hidden);
    await page.waitForFunction(()=>document.getElementById('musicOfflineCancel').hidden,{},{timeout:120000});
    const row=await page.evaluate(async()=> (await HSKMusicOffline.list('offline-one'))[0]);
    assert.match(await page.locator('#musicOfflineUsage').innerText(),/Đã lưu thành công/,'successful save confirms the stored file');
    assert.equal(row?.bitrate,Number(quality),await page.locator('#musicOfflineUsage').innerText());assert.equal(await page.locator('#musicOfflineProgress').getAttribute('value'),'100');assert.match(await page.locator('#musicDownloadMessage').textContent(),/Đã lưu thành công/);assert.ok(row.size>lastSize);lastSize=row.size;
   }
   // Direct mode fetches API + proxy bytes from the browser, never the HSK resolver.
   let directMode='piped',cancelProbe=false,directFetches=0;
   const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};
   await page.route('**/music-config.json',r=>r.fulfill({json:{offlineDirect:{enabled:true,instances:directMode==='piped'?[{type:'piped',url:'https://unavailable.example.com'},{type:'piped',url:'https://piped.example.com'}]:[{type:'cobalt',url:'https://cobalt.example.com'}]}}}));
   await page.route('https://unavailable.example.com/**',r=>r.fulfill({status:503,headers:cors,body:'unavailable'}));
   const directHandler=async r=>{
    assert.equal(r.request().headers().authorization,undefined,'HSK account token never reaches a third-party API');
    if(r.request().method()==='OPTIONS')return r.fulfill({status:204,headers:cors});
    if(cancelProbe)await new Promise(resolve=>setTimeout(resolve,1000));
    const pathname=new URL(r.request().url()).pathname;
    if(pathname.startsWith('/streams/'))return r.fulfill({headers:cors,json:{duration:6,proxyUrl:'https://media.example.com',audioStreams:[{quality:'128 kbps',mimeType:'audio/mp4',url:'https://media.example.com/audio'}]}});
    if(pathname==='/')return r.fulfill({headers:cors,json:{status:'tunnel',url:'https://cobalt.example.com/tunnel?id=test'}});
    directFetches++;return r.fulfill({headers:{...cors,'Content-Type':'audio/mp4'},body:fs.readFileSync(path.join(root,'tools/fixtures/music-heaacv2-64k.m4a'))});
   };
   await page.route('https://piped.example.com/**',directHandler);await page.route('https://media.example.com/**',directHandler);await page.route('https://cobalt.example.com/**',directHandler);
   for(const mode of ['piped','cobalt']){
    directMode=mode;await page.locator('#musicOfflineQuality').selectOption('64');await page.locator('#musicOfflineAddCurrent').click();
    await page.waitForFunction(()=>document.getElementById('musicOfflineCancel').hidden,{},{timeout:120000});
    assert.equal((await page.evaluate(async()=> (await HSKMusicOffline.list('offline-one'))[0])).bitrate,64,await page.locator('#musicOfflineUsage').innerText());
   }
   assert.equal(directFetches,2);assert.equal(sourceRequests,3,'direct mode never contacts HSK source resolver');
   const beforeCancel=await page.evaluate(()=>HSKMusicOffline.usage());cancelProbe=true;await page.locator('#musicOfflineAddCurrent').click();await page.locator('#musicOfflineCancel').click();await page.waitForFunction(()=>document.getElementById('musicOfflineCancel').hidden);
   assert.equal(await page.evaluate(()=>HSKMusicOffline.usage()),beforeCancel,'cancel preserves the prior offline audio');cancelProbe=false;
   assert.equal(sourceRequests,3);await page.locator('#musicOfflineList .music-row-del').click();await page.waitForFunction(()=>!document.querySelector('#musicOfflineList .music-offline-item'));
   await upload('#musicOfflineAttachFile');assert.equal(await page.locator('#musicOfflineList .music-offline-item').count(),1);
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
   await page.context().setOffline(false);assert.deepEqual(errors,[]);console.log('PASS offline music UI',width,'real WASM 32/64/96, browser-direct Piped/Cobalt, cancel, M4A import, dedup, account isolation, reload persistence, real offline play/pause/seek, delete');await page.close();
  }
 }finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
