const {chromium}=require('playwright'),fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=process.cwd(),server=http.createServer((q,r)=>{const f=path.resolve(root,'.'+new URL(q.url,'http://local').pathname);if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){r.writeHead(404);return r.end();}r.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(f)]||'application/octet-stream');r.end(fs.readFileSync(f));});await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:900},serviceWorkers:'block'}),errors=[],requests=[];let mismatch=false,failed=false;
  page.on('pageerror',e=>errors.push(e.message));await page.route('https://**/*',r=>r.abort());await page.route('**/account-config.json',r=>r.fulfill({json:{enabled:false}}));
  await page.route('**/music-config.json',r=>r.fulfill({json:{enabled:false,onlineResolver:'https://music.example'}}));
  const media=fs.readFileSync('tools/fixtures/music-heaacv2-64k.m4a');
  await page.route('https://rr-test.googlevideo.com/**',async r=>{if(r.request().resourceType()==='fetch')await new Promise(done=>setTimeout(done,400));assert.equal(r.request().headers().authorization,undefined,'account token never sent to audio provider');const range=r.request().headers().range?.match(/^bytes=(\d+)-(\d*)$/);const start=range?Number(range[1]):0,end=range&&range[2]?Number(range[2]):media.length-1;return r.fulfill({status:range?206:200,body:media.subarray(start,end+1),contentType:'audio/mp4',headers:{'Access-Control-Allow-Origin':'*','Accept-Ranges':'bytes',...(range?{'Content-Range':`bytes ${start}-${end}/${media.length}`}:{})}});});
  await page.route('https://music.example/api/online/stream/**',r=>r.fulfill({body:media,contentType:'audio/mp4',headers:{'Access-Control-Allow-Origin':'*'}}));
  await page.route('https://music.example/api/online/resolve',async r=>{
   const body=r.request().postDataJSON();requests.push(body);assert.equal(r.request().headers().authorization,'Bearer fake-test-token');
   if(failed)return r.fulfill({status:502,json:{error:'Nguồn tạm thời không có audio'}});
   await new Promise(done=>setTimeout(done,600));const id=new URL(body.url).searchParams.get('v');
   return r.fulfill({json:{id:mismatch?'differentID':id,url:'https://rr-test.googlevideo.com/'+id+'.m4a',relayUrl:'https://music.example/api/online/stream/ticket-'+id,title:'Bài '+id,artist:'Nghệ sĩ'}});
  });
  await page.addInitScript(()=>{
   window.musicActions={};Object.defineProperty(navigator,'mediaSession',{value:{setActionHandler:(n,f)=>window.musicActions[n]=f,setPositionState:p=>window.musicPosition=p}});
   Object.defineProperty(navigator,'audioSession',{value:{type:'auto'}});
   const play=HTMLMediaElement.prototype.play;window.gestureStarts=[];HTMLMediaElement.prototype.play=function(){if(this.id==='musicBackgroundAudio'){window.gestureStarts.push(navigator.userActivation.isActive);this.loop=true;}return play.call(this);};
  });
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.waitForFunction(()=>window.HSKMusic&&window.HSKStudio);
  await page.evaluate(()=>{window.HSKAccountDashboard={user:{getIdToken:async()=> 'fake-test-token'}};HSKStudio.navigate('music-play');});
  await page.waitForResponse(r=>r.url().endsWith('/music-config.json'));
  const add=async (id,playlist='')=>{await page.locator('#musicMenuBtn').click();await page.locator('#musicLinkImport>summary').click();await page.locator('#musicLinkUrl').fill('https://youtu.be/'+id);if(playlist)await page.locator('#musicLinkPlaylist').selectOption(playlist);await page.locator('#musicLinkApply').click();};
  await add('dQw4w9WgXcQ');assert.equal(await page.evaluate(()=>Boolean(document.getElementById('musicBackgroundAudio')?.getAttribute('src')?.startsWith('data:'))),false,'never pre-play fake silent WAV while VPS resolves');assert.equal(await page.evaluate(()=>window.gestureStarts[0]),true,'native audio primed in original trusted click');
  await page.evaluate(()=>HSKStudio.navigate('practice'));
  await page.waitForFunction(()=>document.getElementById('musicBackgroundAudio')?.src.includes('rr-test.googlevideo.com')&&!document.getElementById('musicBackgroundAudio').paused&&document.getElementById('musicBackgroundAudio').currentTime>.1);
  assert.equal(await page.locator('#musicLinkPlayer iframe').count(),0,'YouTube resolver uses native audio, no iframe');
  await page.evaluate(()=>{window.savedAudio=document.getElementById('musicBackgroundAudio');Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>window.savedAudio.paused),false,'hidden event does not pause native audio');
  await page.evaluate(()=>window.musicActions.pause());assert.equal(await page.evaluate(()=>window.savedAudio.paused),true);await page.evaluate(()=>window.musicActions.play());await page.waitForFunction(()=>!window.savedAudio.paused);
  await page.evaluate(()=>{window.musicActions.pause();window.savedAudio.currentTime=0;window.musicActions.seekforward();});assert.ok(await page.evaluate(()=>window.savedAudio.currentTime)>=4.9);await page.evaluate(()=>window.musicActions.play());
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));HSKStudio.navigate('music-play');});await page.locator('#musicMiniMain').click();
  assert.equal(await page.evaluate(()=>document.getElementById('musicBackgroundAudio')===window.savedAudio),true);
  await add('abcdefghijk');await page.locator('#musicLinkPlay').click();await page.waitForFunction(()=>document.getElementById('musicBackgroundAudio').src.includes('rr-test.googlevideo.com/abcdefghijk'));assert.equal(await page.evaluate(()=>window.savedAudio.paused),true,'pause during resolve is preserved');
  await page.locator('#musicLinkPlay').click();await page.waitForFunction(()=>!window.savedAudio.paused);await page.evaluate(()=>window.savedAudio.dispatchEvent(new Event('error')));
  await page.waitForFunction(()=>window.savedAudio.src.includes('/api/online/stream/'));await page.waitForFunction(()=>!window.savedAudio.paused);
  await page.evaluate(()=>window.savedAudio.dispatchEvent(new Event('error')));await page.waitForFunction(()=>window.savedAudio.src.includes('rr-test.googlevideo.com/abcdefghijk'));assert.equal(requests.at(-1).refresh,true,'expired/broken relay re-resolves exact link');
  mismatch=true;await add('zyxwvutsrqp');await page.waitForFunction(()=>document.getElementById('musicStatus').textContent.includes('không khớp'));assert.equal(await page.evaluate(()=>window.savedAudio.paused),true,'wrong source never plays');
  mismatch=false;failed=true;await page.locator('#musicLinkPlay').click();await page.waitForFunction(()=>document.getElementById('musicStatus').textContent.includes('Nguồn tạm'));assert.equal(await page.evaluate(()=>window.savedAudio.paused),true,'failed resolve stops temporary silent audio');
  failed=false;await page.locator('#musicLinkPlay').click();await page.waitForFunction(()=>window.savedAudio.src.includes('rr-test.googlevideo.com/zyxwvutsrqp')&&!window.savedAudio.paused);
  await page.evaluate(()=>{localStorage.setItem('hsk-music-playlists-v1:guest',JSON.stringify([{id:'aws-queue',name:'AWS queue',items:[{url:'https://www.youtube.com/watch?v=zyxwvutsrqp',title:'Bài một'},{url:'https://www.youtube.com/watch?v=lmnopqrstuv',title:'Bài hai'}]}]));HSKStudio.navigate('music-play');});await add('zyxwvutsrqp','aws-queue');
  await page.waitForFunction(()=>document.getElementById('musicBackgroundAudio').src.includes('zyxwvutsrqp')&&!document.getElementById('musicBackgroundAudio').paused);await page.waitForTimeout(1200);
  const nextCount=requests.filter(r=>r.url.includes('lmnopqrstuv')).length;assert.equal(nextCount,1,'next original YouTube link prefetched once while current audio plays');
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));window.savedAudio.dispatchEvent(new Event('ended'));});
  await page.waitForFunction(()=>window.savedAudio.src.includes('rr-test.googlevideo.com/lmnopqrstuv')&&!window.savedAudio.paused);assert.equal(await page.evaluate(()=>navigator.mediaSession.metadata.album),'HSK Music');assert.equal(requests.at(-1).url,'https://www.youtube.com/watch?v=lmnopqrstuv','hidden auto-next resolves exact next track');assert.equal(requests.filter(r=>r.url.includes('lmnopqrstuv')).length,nextCount,'auto-next consumes prefetched source without another HTTP resolve');const saved=await page.evaluate(()=>localStorage.getItem('hsk-music-links-v1:guest')+localStorage.getItem('hsk-music-playlists-v1:guest'));assert.ok(saved.includes('youtube.com'));assert.ok(!saved.includes('googlevideo.com')&&!saved.includes('/api/online/stream/'),'only original links persist');
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));HSKStudio.navigate('music-play');});
  await page.locator('#musicMenuBtn').click();await page.locator('#musicMenuOfflineRow').click();await page.locator('#musicDeviceSave').click();assert.equal(await page.evaluate(()=>HSKMusic.downloadingOffline),true);
  await page.evaluate(()=>HSKStudio.navigate('practice'));await page.waitForFunction(()=>document.getElementById('musicDeviceSaveBanner').textContent.includes('Đã lưu ngoại tuyến'));
  assert.equal(await page.locator('#musicDeviceSaveBanner progress').getAttribute('value'),'100');assert.equal(await page.evaluate(()=>HSKMusic.downloadingOffline),false);
  const stored=await page.evaluate(async()=>(await HSKMusicOffline.list('guest')).map(r=>({url:r.url,size:r.size})));assert.equal(stored.length,1);assert.equal(stored[0].url,'https://www.youtube.com/watch?v=lmnopqrstuv');assert.equal(stored[0].size,media.length);
  await page.evaluate(()=>{Object.defineProperty(navigator,'onLine',{configurable:true,value:false});HSKStudio.navigate('music-play');});await page.locator('#musicMenuBtn').click();await page.locator('#musicMenuOfflineRow').click();await page.locator('#musicOfflineList .music-row-main').click();await page.waitForFunction(()=>window.savedAudio.src.startsWith('blob:')&&!window.savedAudio.paused);assert.equal(await page.evaluate(()=>window.savedAudio===document.getElementById('musicBackgroundAudio')),true,'saved audio uses persistent player without network');
  await page.evaluate(async()=>{Object.defineProperty(navigator,'onLine',{configurable:true,value:true});await HSKMusicOffline.remove('guest','https://www.youtube.com/watch?v=lmnopqrstuv');});
  await page.locator('#musicMenuBtn').click();await page.locator('#musicMenuOfflineRow').click();await page.locator('#musicDeviceSave').click();await page.locator('#musicDeviceSaveBanner button').click();await page.waitForFunction(()=>!HSKMusic.downloadingOffline);assert.match(await page.locator('#musicDeviceSaveBanner').textContent(),/Đã hủy/);assert.equal(await page.evaluate(async()=>(await HSKMusicOffline.list('guest')).length),0,'cancel never writes a partial offline file');

  await page.evaluate(()=>window.dispatchEvent(new Event('hsk-account-ready')));assert.equal(await page.evaluate(()=>window.savedAudio.hasAttribute('src')),false,'account switch releases native audio');
  assert.equal(await page.evaluate(async()=>(await HSKMusicOffline.list('guest')).length),0,'no offline files written');assert.deepEqual(errors,[]);await page.close();console.log('PASS AWS online '+width+': gesture, direct native audio, routes/hidden, media controls, pending pause, relay/refresh, source mismatch, retry and account cleanup');
 }
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
