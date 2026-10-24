const {chromium}=require('playwright'),fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=process.cwd(),server=http.createServer((req,res)=>{const f=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:900},serviceWorkers:'block'}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://**/*',r=>r.abort());await page.route('**/account-config.json',r=>r.fulfill({json:{enabled:false}}));
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.waitForFunction(()=>window.HSKStudio&&window.HSKLegacyMusicCleanup&&window.HSKVoiceManager);await require('./legacy-music-fixture.cjs')(page);
  await page.evaluate(async bytes=>{
   localStorage.setItem('hsk-account-meta-v1',JSON.stringify({uid:'cleanup-one'}));window.HSKAccountDashboard={user:{uid:'cleanup-one'}};localStorage.setItem('cleanup-progress-sentinel','keep');
   const file=new File([new Uint8Array(bytes)],'track.m4a',{type:'audio/mp4'});
   await HSKLegacyMusicCleanup.put('cleanup-one',{url:'offline:one',title:'Bài giữ lại'},file);
   await HSKLegacyMusicCleanup.put('cleanup-one',{url:'offline:two',title:'Bài muốn xóa'},file);
   await HSKLegacyMusicCleanup.put('cleanup-other',{url:'offline:other',title:'Nhạc riêng tài khoản khác'},file);
   const store=HSKVoiceStore.createStore(indexedDB),before=await store.snapshot();await store.replace(before.revision,{source:'pack',voiceId:'zm_yunjian',voiceURI:'',assets:['fixture'],files:[['model','fixture']]},new Map([['fixture',new Blob([new Uint8Array(8192)])]]));
   for(const [name,n] of [['hsk-offline-sentinel',77],['hsk-music-codec-v1',4096],['hsk-writing-data-2',2048],['hsk-handwriting-neural-ppocrv5-ort122-v1',1024],['hsk-open-dictionary-cedict-v1',512],['unrelated-cache',99]]){const c=await caches.open(name);await c.put('/'+name,new Response(new Uint8Array(n)));}
   window.HSKStudio.navigate('account');
  },[...fs.readFileSync('tools/fixtures/music-heaacv2-64k.m4a')]);
  await page.locator('#storageCleanupOpen').click();await page.waitForFunction(()=>!document.querySelector('#storageCleanupStatus').textContent.includes('Đang tính'));
  assert.equal(await page.locator('.storage-cleanup-row').count(),7);assert.equal(await page.getByText('Nhạc riêng tài khoản khác',{exact:true}).count(),0);assert.equal(await page.locator('#storageCleanupDelete').isDisabled(),true);
  assert.match(await page.locator('#storageCleanupTotal').innerText(),/KiB|MiB/);
  // Opening/scanning does not delete anything. Nothing is selected by default.
  assert.equal(await page.locator('.storage-cleanup-row input:checked').count(),0);
  await page.getByRole('checkbox',{name:'Dữ liệu nét chữ đã xem',exact:true}).check();
  const colors=await page.locator('.storage-cleanup-row').evaluateAll(ns=>ns.map(n=>({checked:n.querySelector('input').checked,bg:getComputedStyle(n).backgroundColor})));assert.notEqual(colors.find(x=>x.checked).bg,colors.find(x=>!x.checked).bg);
  await page.locator('#storageCleanupDelete').click();await page.waitForFunction(()=>document.querySelector('#storageCleanupStatus').textContent.includes('Đã xóa 1 / 1'));
  assert.equal(await page.evaluate(async()=>(await caches.open('hsk-writing-data-2')).keys().then(k=>k.length)),0);
  assert.equal(await page.evaluate(async()=>(await caches.open('hsk-music-codec-v1')).keys().then(k=>k.length)),1,'unselected codec stays');
  // A voice replaced in another tab must not be removed from a stale selection.
  await page.getByRole('checkbox',{name:/Giọng tiếng Trung/ }).check();
  await page.evaluate(async()=>{const s=HSKVoiceStore.createStore(indexedDB),v=await s.snapshot();await s.replace(v.revision,{...v},new Map());});
  await page.locator('#storageCleanupDelete').click();await page.waitForFunction(()=>document.querySelector('#storageCleanupStatus').textContent.includes('Đã xóa 0 / 1'));
  assert.match(await page.locator('#storageCleanupStatus').innerText(),/Giọng đã thay đổi/);assert.equal(await page.evaluate(async()=>(await HSKVoiceManager.downloaded()).bytes),8192);
  await page.getByRole('checkbox',{name:/Giọng tiếng Trung/ }).check();
  await page.getByRole('checkbox',{name:'Bài muốn xóa',exact:true}).check();await page.locator('#storageCleanupDelete').click();await page.waitForFunction(()=>document.querySelector('#storageCleanupStatus').textContent.includes('Đã xóa 2 / 2'));
  const state=await page.evaluate(async()=>({voice:await HSKVoiceManager.downloaded(),mine:await HSKLegacyMusicCleanup.list('cleanup-one'),other:await HSKLegacyMusicCleanup.list('cleanup-other'),usage:await HSKLegacyMusicCleanup.usage(),progress:localStorage.getItem('cleanup-progress-sentinel'),core:(await (await caches.open('hsk-offline-sentinel')).match('/hsk-offline-sentinel')).status}));
  assert.equal(state.voice.bytes,0);assert.equal(state.voice.selection.source,'device');assert.equal(state.mine.length,1);assert.equal(state.mine[0].title,'Bài giữ lại');assert.equal(state.other.length,1);assert(state.usage>0,'shared bytes retained');assert.equal(state.progress,'keep');assert.equal(state.core,200);
  // Account switch cannot delete the previous account's listed downloads.
  await page.getByRole('checkbox',{name:'Bài giữ lại',exact:true}).check();await page.evaluate(()=>{localStorage.setItem('hsk-account-meta-v1',JSON.stringify({uid:'cleanup-other'}));HSKAccountDashboard.user={uid:'cleanup-other'};});await page.locator('#storageCleanupDelete').click();assert.equal(await page.evaluate(async()=>(await HSKLegacyMusicCleanup.list('cleanup-one')).length),1);
  await page.locator('#storageCleanupRefresh').click();await page.waitForFunction(()=>document.querySelector('#storageCleanupList').textContent.includes('Nhạc riêng tài khoản khác'));
  await page.locator('#storageCleanupAll').click();await page.locator('#storageCleanupDelete').click();await page.waitForFunction(()=>document.querySelector('#storageCleanupStatus').textContent.includes('Đã xóa'));
  assert.equal(await page.evaluate(async()=>(await HSKLegacyMusicCleanup.list('cleanup-other')).length),0);assert.equal(await page.evaluate(async()=>(await HSKLegacyMusicCleanup.list('cleanup-one')).length),1);
  for(const theme of ['light','dark']){await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);assert(await page.locator('#storageCleanupClose').isVisible());const bounds=await page.locator('#storageCleanupDialog').boundingBox();assert(bounds.width<=width&&bounds.x>=0);}
  await page.locator('#storageCleanupClose').click();await page.locator('#storageCleanupOpen').click();await page.waitForFunction(()=>!document.querySelector('#storageCleanupStatus').textContent.includes('Đang tính'));assert.equal(await page.locator('.storage-cleanup-row').count(),0);assert.match(await page.locator('#storageCleanupTotal').innerText(),/0 B/);assert.deepEqual(errors,[]);await page.close();console.log('PASS cleanup '+width+': real CacheStorage/IndexedDB, selected deletion, voice fallback, shared music/owner isolation, protected app/progress, persistence and themes');
 }
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
