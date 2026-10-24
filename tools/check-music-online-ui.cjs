/* Real AAC via R2 routes; simulated visibility is not a physical lock-screen test. */
const {chromium}=require('playwright'),fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict'),fixture=require('./music-cloud-fixture.cjs');
(async()=>{
 const root=process.cwd(),server=http.createServer((q,r)=>{const f=path.resolve(root,'.'+new URL(q.url,'http://local').pathname);if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){r.writeHead(404);return r.end();}r.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(f)]||'application/octet-stream');r.end(fs.readFileSync(f));});await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:900},serviceWorkers:'block'}),errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://**/*',r=>{external.push(r.request().url());return r.abort();});await page.route('**/account-config.json',r=>r.fulfill({json:{enabled:false}}));const tracks=await fixture(page);let fail=true;await page.route('https://music.example/api/library*',r=>fail?r.fulfill({status:503,json:{error:"Unavailable"}}):r.fulfill({json:{tracks,cursor:null}}));
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.waitForFunction(()=>window.HSKStudio&&window.HSKMusic);await page.evaluate(()=>HSKStudio.navigate('music-play'));
  await page.waitForFunction(()=>document.getElementById('musicCloudStatus').textContent.length>0);assert.equal(await page.locator('#musicCloudList button').count(),0,'failed catalogue never invents songs');
  fail=false;await page.evaluate(()=>document.getElementById('musicCloudRefresh').click());await page.waitForFunction(()=>document.querySelectorAll('#musicCloudList button').length===3);assert.ok(!(await page.locator('#musicCloudList').innerText()).includes('bad'),'foreign URL rejected');
  await page.locator('#musicCloudList button').first().click();await page.waitForFunction(()=>document.getElementById('musicBackgroundAudio')?.currentTime>.05);
  await page.locator('#musicMenuBtn').click();await page.locator('#musicMenuLibraryRow').click();
  await page.evaluate(()=>{const d=document.getElementById('musicPlaylistCreateBox');if(d)d.open=true;});await page.locator('#musicPlaylistName').fill('Kho yêu thích');await page.locator('#musicPlaylistCreateBtn').click();
  await page.locator('#musicPlaylistList .music-playlist-head').first().click();await page.locator('.music-playlist-add-track select').selectOption(tracks[1].url);await page.locator('.music-playlist-add-track button[type=submit]').click();assert.equal(await page.locator('.music-playlist-track').count(),1);
  assert.equal(await page.locator('.music-playlist-add-track input[type=url]').count(),0,'playlist can only choose catalogue tracks');assert.deepEqual(errors,[]);await page.close();console.log('PASS R2 online library '+width+': failure/retry, source validation and catalogue-only playlists');
 }
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
