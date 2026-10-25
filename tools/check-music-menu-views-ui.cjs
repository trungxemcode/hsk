// Regression: match every ZIP bottom-sheet view while retaining real app handlers.
const {chromium}=require('playwright'),fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict'),fixture=require('./music-cloud-fixture.cjs');
(async()=>{
 const root=process.cwd(),server=http.createServer((q,r)=>{
  const f=path.resolve(root,'.'+new URL(q.url,'http://local').pathname);
  if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){r.writeHead(404);return r.end();}
  r.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(f)]||'application/octet-stream');r.end(fs.readFileSync(f));
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
 try{
  for(const width of [390,820,1440]){
   const page=await browser.newPage({viewport:{width,height:844},serviceWorkers:'block'}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://**/*',r=>r.abort());
   await page.route('**/account-config.json',r=>r.fulfill({json:{enabled:false}}));
   await fixture(page);
   await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');
   await page.waitForFunction(()=>window.HSKStudio&&window.HSKMusic);
   await page.evaluate(()=>{HSKAccountDashboard={user:{uid:'BIvUyItDYJWcLvlhhtYFyj5csBH2',getIdToken:async()=> 'owner'}};HSKStudio.navigate('music-play');});
   await page.waitForFunction(()=>document.querySelectorAll('#musicCloudList button').length===3&&document.getElementById('musicPanel').dataset.musicMode==='chill');
   const visible=id=>page.locator(id).isVisible();
   const view=()=>page.locator('#musicMenuSheet').getAttribute('data-view');
   if(!(await visible('#musicMenuSheet')))await page.locator('#musicMenuBtn').click();
   await page.locator('#musicMenuSheet').waitFor({state:'visible'});
   assert.equal(await view(),'main');
   await page.locator('#musicMenuClose').focus();await page.keyboard.press('Escape');
   assert.equal(await page.locator('#musicMenuSheet').getAttribute('aria-hidden'),'true');
   await page.waitForFunction(()=>document.activeElement?.id==='musicMenuBtn');
   await page.locator('#musicMenuBtn').click();await page.locator('#musicMenuSheet').waitFor({state:'visible'});
   assert.equal(await visible('#musicMenuLibraryRow'),true);
   assert.equal(await visible('#musicPlaylistCreateBox'),false);
   await page.locator('#musicMenuLibraryRow').click();
   assert.equal(await view(),'library');
   for(const id of ['#musicMenuLibraryRow','#musicCloudRefresh','#musicPersonalOpen','#musicAdminOpen','#musicLinkExtraActions','#musicMenuTrackHead','#musicMenuShareRow']){
    assert.equal(await visible(id),false,'library must hide '+id);
   }
   for(const id of ['#musicMenuSubHead','#musicPlaylistCreateBox','#musicPlaylistsBox','#musicSavedLinksBox']){
    assert.equal(await visible(id),true,'library must show '+id);
   }
   assert.equal(await page.locator('#musicMenuSubTitle').innerText(),'Thư viện của bạn');
   await page.locator('#musicPlaylistCreateBox summary').click();
   await page.locator('#musicPlaylistName').fill('Playlist UI check');
   await page.locator('#musicPlaylistCreateBtn').click();
   await page.waitForFunction(()=>document.getElementById('musicPlaylistList').textContent.includes('Playlist UI check'));
   await page.screenshot({path:'/tmp/music-menu-fixed-library-'+width+'.png'});
   await page.locator('#musicMenuSubCancel').click();
   assert.equal(await view(),'main');
   assert.equal(await visible('#musicMenuLibraryRow'),true);
   assert.equal(await visible('#musicPlaylistCreateBox'),false);
   await page.locator('#musicPersonalOpen').click();
   assert.equal(await view(),'personal');
   assert.equal(await visible('#musicPersonalForm'),true);
   assert.equal(await visible('#musicMenuLibraryRow'),false);
   assert.equal(await visible('#musicCloudRefresh'),false);
   await page.locator('#musicMenuSubCancel').click();
   await page.locator('#musicAdminOpen').click();
   assert.equal(await view(),'admin');
   assert.equal(await visible('#musicAdminImportForm'),true);
   assert.equal(await visible('#musicMenuLibraryRow'),false);
   await page.locator('#musicImportTab-file').click();
   assert.equal(await visible('#musicCloudUploadForm'),true);
   await page.locator('#musicMenuSubCancel').click();
   await page.locator('#musicMenuClose').click();
   await page.locator('#musicCloudList button').first().click();
   await page.waitForFunction(()=>document.getElementById('musicBackgroundAudio')?.currentTime>.1);
   const audio=await page.locator('#musicBackgroundAudio').elementHandle();
   await page.locator('#musicBack').click();
   await page.waitForFunction(()=>!document.getElementById('musicPanel').classList.contains('music-player-expanded'));
   await page.waitForTimeout(400);
   if(!(await visible('#musicMenuSheet')))await page.locator('#musicMenuBtn').click();
   await page.locator('#musicMenuSheet').waitFor({state:'visible'});
   await page.waitForTimeout(450);
   assert.equal(await visible('#musicPreviewPlaylistAdd'),true);
   assert.equal(await visible('#musicQuickPlaylistPanel'),false);
   await page.locator('#musicPreviewPlaylistAdd').click();
   assert.equal(await visible('#musicQuickPlaylistPanel'),true);
   assert.equal(await page.locator('#musicPreviewPlaylistAdd').getAttribute('aria-expanded'),'true');
   assert.equal(await page.locator('.music-quick-pick').count(),1);
   await page.locator('.music-quick-pick').click();
   assert.equal(await page.locator('.music-quick-pick').getAttribute('aria-pressed'),'true');
   assert.equal(await page.evaluate(()=>JSON.stringify(localStorage).includes('Playlist UI check')),true);
   await page.locator('.music-quick-select-more').click();
   assert.equal(await view(),'save');
   assert.equal(await visible('#musicQuickPlaylistPanel'),false);
   assert.equal(await visible('#musicSavePicker'),true);
   assert.equal(await visible('#musicMenuLibraryRow'),false);
   assert.equal(await visible('#musicCloudRefresh'),false);
   assert.equal(await visible('#musicMenuSubDone'),true);
   await page.locator('#musicMenuSubCancel').click();
   assert.equal(await visible('#musicQuickPlaylistPanel'),false);
   assert.equal(await page.locator('#musicPreviewPlaylistAdd').getAttribute('aria-expanded'),'false');
   await page.locator('#musicMenuClose').click();
   assert.equal(await audio.evaluate(n=>n.isConnected&&!n.paused),true,'audio playback must outlive sheet views');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'no horizontal overflow');
   assert.deepEqual(errors,[]);
   console.log('PASS music menu ZIP views '+width+': exclusive subviews, playlist create/assign/save, admin import, persistent real AAC');
   await page.close();
  }
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});