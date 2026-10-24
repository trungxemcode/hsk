const {chromium}=require('playwright'),fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=process.cwd(),server=http.createServer((req,res)=>{
  const f=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);
  if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));
 });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
  const cases=[
   {label:'Chrome',ua:'Mozilla/5.0 Chrome/146.0.0.0 Safari/537.36',auto:false},
   {label:'Safari iOS',ua:'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 Version/26.0 Mobile/15E148 Safari/604.1',auto:false},
   {label:'CocCoc branded',ua:'Mozilla/5.0 Chrome/146.0.0.0 CocCocBrowser/146.1 Safari/537.36',auto:true},
   {label:'CocCoc Chrome-like UA (manual)',ua:'Mozilla/5.0 Chrome/146.0.0.0 Safari/537.36',auto:false}
  ];
  for(const data of cases){
   const context=await browser.newContext({userAgent:data.ua,viewport:{width:390,height:844},serviceWorkers:'block'});
   const page=await context.newPage(),errors=[],requests=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
   await page.route('https://**/*',route=>route.abort());
   await page.route('**/account-config.json',route=>route.fulfill({json:{enabled:false}}));
   const base='http://127.0.0.1:'+server.address().port+'/index.html';
   async function openMenu(){
    await page.evaluate(()=>HSKStudio.navigate('music-play'));
    await page.locator('#musicMenuBtn').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('musicMenuSheet')).visibility==='visible');
   }
   await page.goto(base);await page.waitForFunction(()=>window.HSKStudio&&window.HSKMusic&&window.HSKMusicOffline);
   await openMenu();
   const mode=page.locator('#musicCocCocModeToggle'),link=page.locator('#musicCocCocOpen');
   assert.equal(await mode.isVisible(),true,'declaration is always accessible');
   assert.equal(await page.locator('#musicCocCocOffline,#musicCocCocNote').count(),0,'removed Coc Coc offline handoff/help per owner request; no download action remains');
   assert.equal(await mode.getAttribute('aria-pressed'),String(data.auto));
   assert.equal(await link.isVisible(),data.auto,'source link hidden until verified or declared');
   if(!data.auto){
    await mode.click();
    assert.equal(await mode.getAttribute('aria-pressed'),'true');
    assert.equal(await link.isVisible(),true);
    assert.equal(await page.evaluate(()=>localStorage.getItem('hsk-music-coccoc-mode-v1')),'on');
   }
   assert.equal(await link.getAttribute('aria-disabled'),'true','no provider chosen');
   assert.equal(await link.getAttribute('href'),'#');
   await page.locator('#musicLinkImport>summary').click();
   await page.locator('#musicLinkUrl').fill('https://youtu.be/abcdefghijk');
   await page.locator('#musicLinkApply').click();
   await openMenu();
   assert.equal(await link.getAttribute('href'),'https://www.youtube.com/watch?v=abcdefghijk');
   assert.equal(await link.getAttribute('target'),'_blank');
   assert.equal(await link.getAttribute('rel'),'noopener noreferrer');
   assert.equal(await link.getAttribute('aria-disabled'),'false');
    assert.equal(await page.locator('#musicCocCocImport').count(),0,'Cốc Cốc option must not impersonate the device file import');
    assert.equal(await page.evaluate(async()=>(await HSKMusicOffline.list('guest')).length),0,'Saving a link in the Coc Coc browser must not pretend a file is available offline in HSK');
   assert.ok(!requests.some(u=>/v1.jobs|invidious|piped|cobalt|source-resolver|googlevideo/.test(u)),JSON.stringify(requests));
   await page.reload();await page.waitForFunction(()=>window.HSKStudio&&window.HSKMusic&&window.HSKMusicOffline);
   await openMenu();
   assert.equal(await page.locator('#musicCocCocModeToggle').getAttribute('aria-pressed'),'true','mode retained after reload in the same PWA origin');
   assert.equal(await page.locator('#musicCocCocOpen').isVisible(),true);
   assert.equal(await page.evaluate(async()=>(await HSKMusicOffline.list('guest')).length),0,'no fake offline file after reload');
   await page.locator('#musicCocCocModeToggle').click();
   assert.equal(await page.locator('#musicCocCocOpen').isVisible(),false,'off switch hides optional actions');
   assert.equal(await page.evaluate(()=>localStorage.getItem('hsk-music-coccoc-mode-v1')),'off');
   await page.reload();await page.waitForFunction(()=>window.HSKStudio&&window.HSKMusic);
   await openMenu();
   assert.equal(await page.locator('#musicCocCocOpen').isVisible(),false,'explicit off persists, including positive UA');
   assert.equal(await page.locator('#musicCocCocModeToggle').getAttribute('aria-pressed'),'false');
   assert.deepEqual(errors,[],'no browser exceptions');
   await context.close();
   console.log('PASS '+data.label+': manual switch/auto, conditional visibility, validated source, removed Coc Coc offline action, persistence and reversible off');
  }
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(err=>{console.error(err);process.exitCode=1;});
