/* Exercise existing HSK routes on real Chromium, including phone, without live API. */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const ROOT=process.cwd();
const hub=['home','practice','notebook','match-game','sentence-game','study4','real-reading'];
const regular=['search','learn','quiz','srs','mistakes','compare','account','lessons'];
(async()=>{
 const server=http.createServer((req,res)=>{
  const target=path.resolve(ROOT,'.'+new URL(req.url,'http://localhost').pathname);
  if(!target.startsWith(ROOT+path.sep)||!fs.existsSync(target)||!fs.statSync(target).isFile()){
   res.writeHead(404);res.end();return;
  }
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(target)]||'application/octet-stream');
  res.end(fs.readFileSync(target));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
 try{
  for(const width of [390,1440]){
   const page=await browser.newPage({viewport:{width,height:900},serviceWorkers:'block'}),errors=[];
   page.on('pageerror',err=>errors.push(err.message));
   await page.route('https://**/*',route=>route.abort());
   await page.route('**/account-config.json',route=>route.fulfill({contentType:'application/json',body:'{"enabled":false}'}));
   await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');
   await page.waitForFunction(()=>!!window.HSKStudio&&!!window.HSKLessons&&document.body.dataset.studioHub==='home',{timeout:60000});
   const globals=['HSKStudio','HSKLessonNav','HSKPracticeSelection','HSKPracticeGames','HSKNotebook','HSKRealReading','HSKStudy4','HSKStudyStore','HSKExam'];
   const found=await page.evaluate(names=>Object.fromEntries(names.map(name=>[name,!!window[name]])),globals);
   assert.deepEqual(Object.values(found),globals.map(()=>true),'Existing public HSK APIs disappeared: '+JSON.stringify(found));
   for(const mode of hub){
    await page.evaluate(route=>window.HSKStudio.navigate(route),mode);
    const current=await page.evaluate(()=>({
      route:document.body.dataset.studioHub,
      heading:document.querySelector('#activeTitle')?.textContent?.trim(),
      panels:[...document.querySelectorAll('[data-studio-hub-panel]')].filter(el=>!el.hidden).map(el=>el.dataset.studioHubPanel)
    }));
    assert.equal(current.route,mode,'Hub route lost: '+mode);
    assert.ok(current.heading,'Missing header title: '+mode);
    assert.ok(current.panels.includes(mode),'Hub panel missing/invisible: '+mode+' '+JSON.stringify(current));
   }
   // Exercise visible content, not just a route name.
   await page.evaluate(()=>window.HSKStudio.navigate('practice'));
   assert.equal(await page.locator('#practiceModeDisclosure').count(),1,'Practice selector lost');
   assert.ok(await page.locator('[data-practice-option]').count()>=13,'Practice modes disappeared');
   await page.evaluate(()=>window.HSKStudio.navigate('study4'));
   assert.ok(await page.locator('#study4PracticePanel a[href^="https://"]').count()>=1,'External HSK exam sources missing');
   await page.evaluate(()=>window.HSKStudio.navigate('real-reading'));
   assert.ok(await page.locator('#realReadingPanel #rrNew').isVisible(),'AI reading generation button lost');
   assert.ok(await page.locator('#realReadingPanel #rrSources').count()===1,'Cited reading sources lost');
   for(const mode of regular){
    await page.evaluate(route=>window.HSKStudio.navigate(route),mode);
    assert.ok(await page.locator('#activeTitle').textContent(),'Navigation broken: '+mode);
   }
   assert.ok(await page.locator('#searchInput').count()===1,'Dictionary entry lost');
   await page.evaluate(()=>window.HSKStudio.navigate('account'));
   assert.ok(await page.locator('#accountForm').count()===1,'Account sign-in lost');
   assert.ok(await page.locator('#offlineCheck').count()===1,'PWA updater lost');
   assert.ok(await page.locator('#updateNotice').count()===1,'Update notice lost');
   assert.equal(errors.length,0,'Browser exceptions: '+JSON.stringify(errors));
   console.log('PASS HSK feature runtime '+width+'px: '+hub.length+' hubs, '+regular.length+' routes, 13 practice modes, account, study progress, PWA');
   await page.close();
  }
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
