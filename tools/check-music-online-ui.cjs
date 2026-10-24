/* Metadata providers mocked; progressive audio decoding/playback and routes are real. */
const {chromium}=require('playwright'),fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=process.cwd(),server=http.createServer((q,r)=>{
  const f=path.resolve(root,'.'+new URL(q.url,'http://local').pathname);
  if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){r.writeHead(404);return r.end();}
  r.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json'})[path.extname(f)]||'application/octet-stream');r.end(fs.readFileSync(f));
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
  for(const width of [390,1440]){
   const page=await browser.newPage({viewport:{width,height:900},serviceWorkers:'block'}),errors=[];let late=false,wrongArtist=false,wasmRequests=0,mediaRequests=0;
   const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Range'};
   page.on('pageerror',e=>errors.push(e.message));await page.route('https://**/*',r=>r.abort());
   await page.route('**/account-config.json',r=>r.fulfill({json:{enabled:false}}));
   await page.route('**/music-config.json',r=>r.fulfill({json:{enabled:false,offlineDirect:{enabled:true,instances:[{type:'cobalt',url:'https://cobalt.example.com'}]}}}));
   await page.route('**/vendor/music-codec/**',r=>{wasmRequests++;return r.abort();});
   await page.route('https://cobalt.example.com/**',async r=>{
    assert.equal(r.request().headers().authorization,undefined,'no HSK credentials sent to media service');
    if(r.request().method()==='OPTIONS')return r.fulfill({status:204,headers:cors});
    if(r.request().method()==='POST'){if(late)await new Promise(resolve=>setTimeout(resolve,600));return r.fulfill({headers:cors,json:{status:'tunnel',url:'https://cobalt.example.com/tunnel'}});}
    mediaRequests++;return r.fulfill({headers:{...cors,'Content-Type':'audio/mp4'},body:fs.readFileSync(path.join(root,'tools/fixtures/music-heaacv2-64k.m4a'))});
   });
   let catalogueRequests=0;await page.route('https://music-api.gdstudio.xyz/**',r=>{catalogueRequests++;return r.abort();});
   await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.waitForFunction(()=>window.HSKMusic&&window.HSKStudio&&window.HSKMusicDirectSource);
   await page.evaluate(()=>HSKStudio.navigate('music-play'));
   const importLink=async(url,title)=>{
    await page.locator('#musicMenuBtn').click();await page.locator('#musicLinkImport>summary').click();
    await page.locator('#musicLinkUrl').fill(url);await page.locator('#musicLinkName').fill(title);await page.locator('#musicLinkApply').click();
   };
   const start=async()=>{await page.locator('#musicMenuBtn').click();await page.locator('#musicMenuBackgroundRow').click();};
   for(const [url,title] of [['https://youtu.be/abcdefghijk','YouTube trực tuyến'],['https://soundcloud.com/artist/song','SoundCloud trực tuyến']]){
    await importLink(url,title);await start();
    await page.waitForFunction(()=>document.getElementById('musicBackgroundAudio')?.currentTime>.1&&!document.getElementById('musicBackgroundAudio').paused);
    assert.match(await page.locator('#musicBackgroundAudio').getAttribute('src'),/^https:\/\//,'native player streams remote URL rather than a saved blob');
    assert.match(await page.locator('#musicLinkNotice').textContent(),/Trực tuyến.*Không lưu/);
    assert.equal(await page.locator('#musicLinkPlayer iframe').count(),0,'embedded player replaced only after playable stream found');
    assert.equal(await page.evaluate(()=>HSKMusicOffline.usage()),0,'online playback writes no offline music');
    const src=await page.locator('#musicBackgroundAudio').getAttribute('src');
    await page.evaluate(()=>HSKStudio.navigate('home'));await page.waitForFunction(()=>!document.getElementById('musicBackgroundPlayer').hidden);
    assert.equal(await page.locator('#musicBackgroundAudio').evaluate(a=>a.paused),false);
    await page.locator('#musicBackgroundPlayer [aria-label="Tạm dừng nhạc"]').click();
    await page.evaluate(()=>HSKStudio.navigate('music-play'));await page.waitForTimeout(150);
    assert.equal(await page.locator('#musicBackgroundAudio').getAttribute('src'),src,'route return keeps remote stream');
    assert.equal(await page.evaluate(()=>Object.values(localStorage).some(s=>s.includes('cobalt.example.com/tunnel'))),false,'expiring stream URL never persisted');
   }
   wrongArtist=true;await importLink('https://open.spotify.com/track/1234567890ABCDEFGHIJKM','游山恋 海伦');
   const embedded=await page.locator('#musicLinkPlayer iframe').getAttribute('src');await start();
   await page.waitForFunction(()=>document.getElementById('musicMenuBackgroundRow').getAttribute('aria-busy')==='false');
   assert.match(await page.locator('#musicOnlineStatus').textContent(),/Spotify.*toàn bài/);
   assert.equal(await page.locator('#musicLinkPlayer iframe').getAttribute('src'),embedded,'failed match preserves original player');
   await page.locator('#musicMenuClose').click();late=true;
   await importLink('https://youtu.be/lmnopqrstuv','Nguồn chậm');await start();
   await page.locator('#musicMenuBackgroundRow').click();await page.waitForTimeout(800);
   assert.equal(await page.locator('#musicLinkPlayer iframe').count(),1,'cancelled lookup cannot replace embed later');
   assert.match(await page.locator('#musicOnlineStatus').textContent(),/hủy/);
   await page.locator('#musicMenuBackgroundRow').click();
   await page.evaluate(()=>{localStorage.setItem('hsk-account-meta-v1',JSON.stringify({uid:'other-listener'}));window.HSKAccountDashboard={user:{uid:'other-listener'}};window.dispatchEvent(new Event('hsk-account-ready'));});
   await page.waitForTimeout(800);
   assert.equal(await page.locator('#musicBackgroundAudio').getAttribute('src'),null,'late source cannot play for a different account');
   assert.equal(await page.locator('#musicBackgroundPlayer').isVisible(),false);
   assert(mediaRequests>=4,'probe and actual native media requests were exercised');assert.equal(catalogueRequests,0,'never queries a similar song catalogue');assert.equal(wasmRequests,0,'no transcoder downloaded for streaming');
   assert.deepEqual(errors,[]);await page.close();console.log('PASS online background',width,'YouTube/SoundCloud streams, no cross-catalogue matching, real audio, no offline/WASM, route continuity, failure and cancellation');
  }
 }finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
