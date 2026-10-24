const {chromium}=require('playwright'),fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
(async()=>{
 const root=process.cwd(),resource=Buffer.from('verified-neural-migration-test'),sha256=crypto.createHash('sha256').update(resource).digest('hex');
 const server=http.createServer((req,res)=>{const f=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 let browser;
 try{
  browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
  for(const width of [390,1440]){
   const page=await browser.newPage({viewport:{width,height:900},serviceWorkers:'block'}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('dialog',dialog=>dialog.accept());
   await page.route('https://**/*',route=>route.abort());
   await page.route('**/account-config.json',route=>route.fulfill({json:{enabled:false}}));
   await page.route('**/handwriting-neural-config.json',route=>route.fulfill({json:{assets:{runtime:{url:'https://cdn.jsdelivr.net/npm/hsk-migration-fixture.js',sha256,bytes:resource.length,type:'text/javascript'}}}}));
   await page.route('https://cdn.jsdelivr.net/npm/hsk-migration-fixture.js',route=>route.fulfill({status:200,headers:{'Access-Control-Allow-Origin':'*','Content-Type':'text/javascript'},body:resource}));
   await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');
   await page.waitForFunction(()=>window.HSKStudio&&window.HSKMusicOffline&&window.HSKVoiceManager);
   await page.evaluate(async bytes=>{
    localStorage.setItem('hsk-account-meta-v1',JSON.stringify({uid:'migration-owner'}));window.HSKAccountDashboard={user:{uid:'migration-owner'}};localStorage.setItem('hsk-user-progress-test','untouched');
    const music=new File([new Uint8Array(bytes)],'owner.m4a',{type:'audio/mp4'});
    await HSKMusicOffline.put('migration-owner',{},music);
    const voice=HSKVoiceStore.createStore(indexedDB),v=await voice.snapshot();
    await voice.replace(v.revision,{source:'pack',voiceId:'zm_yunjian',assets:['fixture'],files:[['model','fixture']]},new Map([['fixture',new Blob([new Uint8Array(1024)])]]));
    for(const cacheName of ['hsk-open-dictionary-cedict-v1','hsk-writing-data-2','hsk-handwriting-neural-ppocrv5-ort122-v1','hsk-offline-sentinel','unrelated-cache']){
      const c=await caches.open(cacheName);await c.put('/'+cacheName,new Response(new Uint8Array(1024)));
    }
    window.HSKStudio.navigate('account');
   },[...fs.readFileSync('tools/fixtures/music-heaacv2-64k.m4a')]);
   await page.locator('#storageCleanupOpen').click();
   await page.waitForFunction(()=>document.querySelector('#storageCleanupResetExtras')?.disabled===false);
   assert.match(await page.locator('.storage-transfer-panel').innerText(),/Cốc Cốc/);
   await page.locator('#storageCleanupResetExtras').click();
   assert.match(await page.locator('#storageTransferStatus').innerText(),/Chạm thêm lần nữa/);
   assert.equal(await page.evaluate(async()=>(await (await caches.open('hsk-open-dictionary-cedict-v1')).keys()).length),1,'first press only confirms');
   await page.locator('#storageCleanupResetExtras').click();
   await page.waitForFunction(()=>document.querySelector('#storageTransferStatus').textContent.includes('Đã dọn xong'));
   const before=await page.evaluate(async()=>({
    voice:(await HSKVoiceManager.downloaded()).bytes,
    music:(await HSKMusicOffline.list('migration-owner')).length,
    progress:localStorage.getItem('hsk-user-progress-test'),
    core:!!(await (await caches.open('hsk-offline-sentinel')).match('/hsk-offline-sentinel')),
    other:!!(await (await caches.open('unrelated-cache')).match('/unrelated-cache')),
    optional:await Promise.all(['hsk-open-dictionary-cedict-v1','hsk-writing-data-2','hsk-handwriting-neural-ppocrv5-ort122-v1'].map(async name=>(await (await caches.open(name)).keys()).length))
   }));
   assert.equal(before.voice,0);assert.equal(before.music,1);assert.equal(before.progress,'untouched');
   assert.equal(before.core,true);assert.equal(before.other,true);assert.deepEqual(before.optional,[0,0,0]);
   await page.evaluate(()=>{
    window.__voiceInstallCalls=0;
    HSKVoiceManager.install=async(id,progress)=>{window.__voiceInstallCalls++;if(id!=='zm_yunjian')throw Error('Bad model');progress({loaded:20,total:20});return true;};
   });
   await page.locator('#storageCleanupInstallExtras').click();
   await page.waitForFunction(()=>document.querySelector('#storageTransferStatus')?.textContent?.includes('Đã tải gói giọng'),{},{timeout:15000});
   const after=await page.evaluate(async()=>({
    calls:window.__voiceInstallCalls,
    neural:(await (await caches.open('hsk-handwriting-neural-ppocrv5-ort122-v1')).keys()).length,
    music:(await HSKMusicOffline.list('migration-owner')).length,
    progress:localStorage.getItem('hsk-user-progress-test')
   }));
   assert.equal(after.calls,1);assert.equal(after.neural,1);assert.equal(after.music,1);assert.equal(after.progress,'untouched');
   await page.locator('#storageCleanupClose').click();
   assert.deepEqual(errors,[]);
   console.log('PASS migration '+width+': two-step extras reset, user progress/music safe, SHA256 neural prefetch, voice download opt-in');
   await page.close();
  }
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
