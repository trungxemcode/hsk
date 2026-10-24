const {chromium}=require('playwright'),fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=process.cwd(),server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.m4a':'audio/mp4'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
  for(const width of [390,1440]){
   const page=await browser.newPage({viewport:{width,height:900},serviceWorkers:'block'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>Object.defineProperty(window,'__offlineAudio',{get:()=>document.getElementById('musicBackgroundAudio')}));
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
    await page.locator('[data-quality="'+quality+'"]').click();
    await page.locator('#musicOfflineAddCurrent').click();
    await page.waitForFunction(()=>!document.getElementById('musicOfflineProgress').hidden);
    assert.match(await page.locator('#musicDownloadMessage').textContent(),/Đang/);
    assert.equal(await page.locator('[data-quality="'+quality+'"]').getAttribute('aria-pressed'),'true');
    assert.match(await page.locator('[data-quality="'+quality+'"]').textContent(),/✓/);
    const selectedColor=await page.locator('[data-quality="'+quality+'"]').evaluate(n=>getComputedStyle(n).backgroundColor);
    const otherColor=await page.locator('[data-quality="'+(quality==='32'?'64':'32')+'"]').evaluate(n=>getComputedStyle(n).backgroundColor);
    assert.notEqual(selectedColor,otherColor,'busy selected quality remains visibly highlighted');
    if(quality==='32'){
     await page.evaluate(()=>window.HSKStudio.navigate('practice'));
     await page.evaluate(()=>window.dispatchEvent(new Event('hsk-account-ready')));
     await page.waitForFunction(()=>!document.getElementById('musicBackgroundDownload').hidden);
    }
    await page.waitForFunction(()=>!document.getElementById('musicOfflineCancel').hidden);
    await page.waitForFunction(()=>document.getElementById('musicOfflineCancel').hidden,{},{timeout:120000});
    const row=await page.evaluate(async()=> (await HSKMusicOffline.list('offline-one'))[0]);
    assert.match(await page.locator('#musicOfflineUsage').innerText(),/Đã lưu thành công/,'successful save confirms the stored file');
    assert.equal(row?.bitrate,Number(quality),await page.locator('#musicOfflineUsage').innerText());assert.equal(await page.locator('#musicOfflineProgress').getAttribute('value'),'100');assert.match(await page.locator('#musicDownloadMessage').textContent(),/Đã lưu thành công/);assert.ok(row.size>lastSize);lastSize=row.size;
    if(quality==='32'){
     assert.match(await page.locator('#musicBackgroundDownload').textContent(),/Đã lưu thành công/,'save continues after leaving music');
     await page.locator('#musicBackgroundDownload').click();
     await page.waitForFunction(()=>document.getElementById('musicMenuSheet').dataset.view==='offline');
    }
   }
   // Legacy direct-source flag must be ignored: only the authenticated official yt-dlp resolver is called.
   const ytdlpConfig=r=>r.fulfill({json:{offlineSourceResolver:'https://source.test',offlineDirect:{enabled:true,instances:[{type:'cobalt',url:'https://blocked-source.example.com'}]}}});
   await page.route('**/music-config.json',ytdlpConfig);
   let thirdPartyRequests=0;
   for(const host of ['https://api.invidious.io/**','https://music-api.gdstudio.xyz/**','https://blocked-source.example.com/**'])
    await page.route(host,r=>{thirdPartyRequests++;return r.abort();});
   await page.locator('#musicOfflineAddCurrent').click();
   await page.waitForFunction(()=>document.getElementById('musicOfflineCancel').hidden,{},{timeout:120000});
   assert.equal(sourceRequests,4,'legacy flag does not bypass official yt-dlp source resolver');
   assert.equal(thirdPartyRequests,0,'no Invidious/Cobalt/NetEase lookup is triggered by saving offline');
   const beforeFailure=await page.evaluate(async()=>{const row=(await HSKMusicOffline.list('offline-one'))[0];return HSKMusicOffline.get('offline-one',row.url).then(({asset,title,size})=>({asset,title,size}));});
   const denyResolver=r=>r.fulfill({status:503,json:{detail:'yt-dlp tạm thời không lấy được link nguồn gốc; giữ file đã lưu'}});
   await page.route('https://source.test/v1/jobs',denyResolver);
   await page.locator('#musicOfflineAddCurrent').click();
   await page.waitForFunction(()=>document.getElementById('musicOfflineCancel').hidden);
   assert.match(await page.locator('#musicOfflineUsage').textContent(),/yt-dlp|nguồn gốc/i);
   const afterFailure=await page.evaluate(async()=>{const row=(await HSKMusicOffline.list('offline-one'))[0];return HSKMusicOffline.get('offline-one',row.url).then(({asset,title,size})=>({asset,title,size}));});
   assert.deepEqual(afterFailure,beforeFailure,'yt-dlp failure keeps original downloaded audio and metadata');
   await page.unroute('https://source.test/v1/jobs',denyResolver);
   const pendingJob=r=>r.fulfill({json:{id:'slow-job',status:'pending'}});
   const waitingJob=r=>r.fulfill({json:{status:'pending'}});
   await page.route('https://source.test/v1/jobs',pendingJob);
   await page.route('https://source.test/v1/jobs/slow-job',waitingJob);
   const beforeCancel=await page.evaluate(()=>HSKMusicOffline.usage());
   await page.locator('#musicOfflineAddCurrent').click();
   await page.waitForFunction(()=>!document.getElementById('musicOfflineCancel').hidden);
   await page.locator('#musicOfflineCancel').click();
   await page.waitForFunction(()=>document.getElementById('musicOfflineCancel').hidden);
   assert.equal(await page.evaluate(()=>HSKMusicOffline.usage()),beforeCancel,'cancel preserves saved tracks');
   await page.unroute('https://source.test/v1/jobs',pendingJob);
   await page.unroute('https://source.test/v1/jobs/slow-job',waitingJob);
   assert.equal(thirdPartyRequests,0);
   await page.unroute('**/music-config.json',ytdlpConfig);
   await page.locator('#musicOfflineList .music-row-del').click();await page.waitForFunction(()=>document.querySelectorAll('#musicOfflineList .music-offline-item').length===0);assert.equal(await page.evaluate(()=>HSKMusicOffline.usage()),0);
   await page.context().setOffline(false);
   await page.evaluate(()=>localStorage.setItem('hsk-music-pending-download-v1:offline-one',JSON.stringify({url:'https://youtu.be/abcdefghijk',title:'Interrupted save',author:'',bitrate:32})));
   await page.reload();await page.waitForFunction(async()=> (await window.HSKMusicOffline?.list('offline-one'))?.some(r=>r.bitrate===32),{},{timeout:120000});
   await page.waitForFunction(()=>localStorage.getItem('hsk-music-pending-download-v1:offline-one')===null);
   assert.deepEqual(errors,[]);console.log('PASS offline music UI',width,'real WASM, background route save, visible quality, interrupted task restart, direct sources, cancel, import, owner isolation, offline playback');await page.close();
  }
 }finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
