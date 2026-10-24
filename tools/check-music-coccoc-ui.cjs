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
   {label:'Chrome',ua:'Mozilla/5.0 Chrome/146.0.0.0 Safari/537.36',visible:false},
   {label:'Safari iOS',ua:'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 Version/26.0 Mobile/15E148 Safari/604.1',visible:false},
   {label:'CocCoc branded',ua:'Mozilla/5.0 Chrome/146.0.0.0 CocCocBrowser/146.1 Safari/537.36',visible:true},
   {label:'CocCoc exposed marker',ua:'Mozilla/5.0 Chrome/146.0.0.0 Safari/537.36',visible:true,marker:true}
  ];
  for(const data of cases){
   const context=await browser.newContext({userAgent:data.ua,viewport:{width:390,height:844},serviceWorkers:'block'});
   const page=await context.newPage(),errors=[],requests=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
   if(data.marker)await page.addInitScript(()=>{window.coccoc={browser:'native'};});
   await page.route('https://**/*',route=>route.abort());
   await page.route('**/account-config.json',route=>route.fulfill({json:{enabled:false}}));
   await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.waitForFunction(()=>window.HSKStudio&&window.HSKMusic&&window.HSKMusicOffline);
   await page.evaluate(()=>HSKStudio.navigate('music-play'));
   await page.locator('#musicMenuBtn').click();
   await page.waitForFunction(()=>getComputedStyle(document.getElementById('musicMenuSheet')).visibility==='visible');
   assert.equal(await page.locator('#musicCocCocOpen').count(),Number(data.visible),data.label);
   assert.equal(await page.locator('#musicCocCocImport').count(),Number(data.visible));
   if(data.visible){
    assert.equal(await page.locator('#musicCocCocOpen').getAttribute('aria-disabled'),'true');
    assert.equal(await page.locator('#musicCocCocOpen').getAttribute('href'),'#');
    assert.equal(await page.locator('#musicCocCocOpen').isVisible(),true,'Coc Coc action visible when menu is open');
    assert.match(await page.locator('#musicCocCocNote').textContent(),/trình duyệt Cốc Cốc/);
   }
   await page.locator('#musicLinkImport>summary').click();
   await page.locator('#musicLinkUrl').fill('https://youtu.be/abcdefghijk');
   await page.locator('#musicLinkApply').click();
   await page.locator('#musicMenuBtn').click();
   if(data.visible){
    const link=page.locator('#musicCocCocOpen');
    assert.equal(await link.getAttribute('href'),'https://www.youtube.com/watch?v=abcdefghijk');
    assert.equal(await link.getAttribute('target'),'_blank');
    assert.equal(await link.getAttribute('rel'),'noopener noreferrer');
    assert.equal(await link.getAttribute('aria-disabled'),'false');
    // Import requires a real user-selected local file; it never calls an extractor.
    const chooser=page.waitForEvent('filechooser');
    await page.locator('#musicCocCocImport').click();
    await (await chooser).setFiles(path.join(root,'tools/fixtures/music-heaacv2-64k.m4a'));
    await page.waitForFunction(()=>/file đã lưu/.test(document.getElementById('musicOfflineUsage').textContent),{},{timeout:12000});
    assert.equal(await page.evaluate(async()=>(await HSKMusicOffline.list('guest')).length),1);
    assert.ok(!requests.some(u=>/v1.jobs|invidious|piped|cobalt|source-resolver|googlevideo/.test(u)),JSON.stringify(requests));
   }else{
    assert.equal(await page.locator('#musicCocCocNote').count(),0);
   }
   assert.deepEqual(errors,[]);
   await context.close();
   console.log('PASS '+data.label+': '+(data.visible?'native Cốc Cốc handoff + manual offline file':'hidden Cốc Cốc tools'));
  }
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(err=>{console.error(err);process.exitCode=1;});
