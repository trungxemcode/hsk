/* HSK 3.10.2 mobile fixes: independent music page, scroll banner, full touch surface and aligned music controls. */
const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=process.cwd();
 const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
 try{
  browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
  for(const width of [320,390,1440]){
   const mobile=width<721;
   const page=await browser.newPage({viewport:{width,height:820},isMobile:mobile,hasTouch:mobile,serviceWorkers:'block'});
   const errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.route('https://**/*',route=>route.abort());
   await page.route('**/account-config.json',route=>route.fulfill({json:{enabled:false}}));
   await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');
   await page.waitForFunction(()=>window.HSKStudio&&window.HSKMusic&&window.HSKPracticeSelection);
   assert.equal(await page.locator('.home-music-entry').isVisible(),true,'music has a home shortcut');
   await page.locator('.home-music-entry').click();
   assert.equal(await page.locator('#musicPanel').isVisible(),true,'home shortcut opens music');
   assert.equal(await page.locator('.topbar').isVisible(),false,'fullscreen music hides topbar');
   assert.equal(await page.locator('.bottom-nav').isVisible(),false,'fullscreen music hides bottom nav');
   assert.equal(await page.locator('.bottom-nav [data-studio-go=practice].active').count(),0,'music is not highlighted as practice');
   await page.locator('#musicBack').click();
   assert.equal(await page.locator('#studioHome').isVisible(),true,'music back returns to home');
   assert.equal(await page.locator('.topbar').isVisible(),true,'topbar returns on home');
   if(mobile)assert.equal(await page.locator('.bottom-nav').isVisible(),true,'bottom nav returns on home');
   if(mobile){
    await page.locator('#menuBtn').click();
    await page.locator('.drawer-body>.music-nav-entry').click();
    assert.equal(await page.locator('#musicPanel').isVisible(),true,'phone menu has independent music link');
   }else{
    await page.locator('.side-nav [data-studio-go=music]').click();
    assert.equal(await page.locator('#musicPanel').isVisible(),true,'desktop side nav has independent music link');
   }
   assert.equal(await page.locator('#musicMenuSheet').isVisible(),false,'menu sheet hidden by default');
   await page.locator('#musicMenuBtn').click();
   assert.equal(await page.locator('#musicMenuSheet').isVisible(),true,'menu sheet opens from top-right 3-dots');
   const geom=await page.evaluate(()=>{
    const select=document.getElementById('musicLevel').getBoundingClientRect();
    const button=document.getElementById('musicRefresh').getBoundingClientRect();
    const details=[...document.querySelectorAll('#musicPanel details')].find(item=>!item.open);
    const d=details.getBoundingClientRect(),s=details.querySelector(':scope>summary').getBoundingClientRect();
    return {selectBottom:select.bottom,buttonBottom:button.bottom,detailWidth:d.width,summaryWidth:s.width,summaryX:s.x,detailX:d.x,overflow:document.documentElement.scrollWidth>innerWidth+2};
   });
   assert.ok(Math.abs(geom.selectBottom-geom.buttonBottom)<2,'music filter and load button aligned');
   assert.ok(Math.abs(geom.detailWidth-geom.summaryWidth)<4,'purple press surface reaches card edges');
   assert.ok(Math.abs(geom.detailX-geom.summaryX)<3,'no white strip left of the active header');
   assert.equal(geom.overflow,false,'music UI has no horizontal overflow');
   await page.locator('#musicMenuClose').click();
   assert.equal(await page.locator('#musicMenuSheet').isVisible(),false,'menu close button hides sheet');
   await page.evaluate(()=>window.HSKStudio.navigate('practice'));
   const picker=page.locator('#practiceModeDisclosure');await picker.locator('summary').click();
   assert.equal(await page.locator('[data-practice-option=music]').count(),0,'music does not belong to practice');
   if(mobile){
    const scroll=await page.evaluate(()=>{
     const main=document.querySelector('main.workspace'),bar=document.getElementById('practiceSessionBar');
     bar.hidden=false;const spacer=document.createElement('div');spacer.style.height='1800px';main.append(spacer);
     main.scrollTop=0;const top=bar.getBoundingClientRect().top;
     main.scrollTop=250;const scrolled=bar.getBoundingClientRect().top;
     spacer.remove();bar.hidden=true;main.scrollTop=0;
     return {position:getComputedStyle(bar).position,delta:top-scrolled};
    });
    assert.equal(scroll.position,'static','session bar must not stick to viewport');
    assert.ok(scroll.delta>200,'session bar scrolls out with content, not floating in middle');
   }
   assert.deepEqual(errors,[],'no JS page errors');
   console.log('PASS mobile music/nav UI',width,'px: standalone entry, filter alignment, full-card feedback, nonsticky session');
   await page.close();
  }
 }finally{await browser?.close();server.close();}
})().catch(err=>{console.error(err);process.exitCode=1});
