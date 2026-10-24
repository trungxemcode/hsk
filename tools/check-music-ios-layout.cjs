const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),http=require('http'),assert=require('node:assert/strict');
(async()=>{
 const root=process.cwd(),server=http.createServer((req,res)=>{const f=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f))});await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
  for(const [width,height] of [[320,667],[390,844],[430,932]]){
   const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,serviceWorkers:'block'}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://**/*',r=>r.abort());await page.route('**/account-config.json',r=>r.fulfill({json:{enabled:false}}));
   await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.waitForFunction(()=>window.HSKStudio&&window.HSKMusic);
   await page.evaluate(()=>HSKStudio.navigate('music-play'));
   await page.locator('#musicMenuBtn').click();await page.locator('#musicLinkImport>summary').click();
   await page.locator('#musicLinkUrl').fill('https://youtu.be/abcdefghijk');
   await page.locator('#musicLinkName').fill('[Vietsub] Bích Thượng Quan - Đặng Ngụ Quan | 壁上观 - 邓寓君');
   await page.locator('#musicLinkApply').click();
   await page.evaluate(()=>{if(!document.querySelector('#musicPanel').classList.contains('music-player-expanded'))document.getElementById('musicMiniMain').click();});
   await page.waitForFunction(()=>document.querySelector('#musicPanel').classList.contains('music-player-expanded'));
   const metrics=await page.evaluate(()=>{
    const ids=['musicPanel','musicLinkPreview','musicQuickSaveBtn','musicLinkTitle','musicBottomDock','musicChillPeekToggle','musicQuickLoop','musicQuickRate','musicQuickQueue','musicQueueSheet'];
    const rect=e=>{const r=e.getBoundingClientRect();return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),bottom:Math.round(r.bottom),right:Math.round(r.right)};};
    return Object.fromEntries(ids.map(id=>[id,rect(document.getElementById(id))]));
   });
   const {musicQuickSaveBtn:plus,musicChillPeekToggle:peek,musicBottomDock:dock,musicPanel:panel,musicLinkPreview:preview,musicQuickLoop:loop,musicQuickRate:rate,musicQuickQueue:queue}=metrics;
   assert(plus.w===44&&plus.h===44,'plus 44x44 '+JSON.stringify(metrics));
   assert(dock.bottom<=height+1&&peek.bottom<=height+1,'queue panel not clipped: '+JSON.stringify(metrics));
   assert(preview.bottom<=height+1&&preview.y>=0,'preview fits '+JSON.stringify(metrics));
   assert(Math.max(loop.y,rate.y,queue.y)-Math.min(loop.y,rate.y,queue.y)<=2,'aux icons y misaligned '+JSON.stringify(metrics));
   assert(plus.right<=width&&panel.right<=width,'UI must fit viewport');
   await page.screenshot({path:'_hsktest-player-'+width+'.png',fullPage:true});
   await page.locator('#musicChillPeekToggle').click();
   await page.waitForFunction(()=>document.getElementById('musicQueueSheet').getAttribute('aria-hidden')==='false');
   await page.locator('#musicQueueClose').click();
   await page.evaluate(()=>HSKStudio.navigate('home'));
   await page.waitForFunction(()=>!document.getElementById('musicBackgroundPlayer').hidden);
   const mini=await page.evaluate(()=>{const p=document.getElementById('musicBackgroundPlayer'),b=[...p.querySelectorAll('button')];return {rect:p.getBoundingClientRect().toJSON(),children:b.map(x=>({id:x.className,rect:x.getBoundingClientRect().toJSON()}))};});
   const centers=mini.children.map(c=>c.rect.top+c.rect.height/2);
   assert(Math.max(...centers)-Math.min(...centers)<=2,'outside mini-player buttons misaligned '+JSON.stringify(mini));
   assert(mini.children[1].rect.width>=40&&mini.children[2].rect.width>=40,'mini actions touch size');
   await page.screenshot({path:'_hsktest-mini-'+width+'.png',fullPage:true});
   await page.evaluate(()=>HSKStudio.navigate('music-play'));
   await page.locator('#musicMenuBtn').click();await page.locator('#musicCocCocModeToggle').click();
   assert.equal(await page.locator('#musicCocCocOffline').isVisible(),true);
   assert.equal(await page.locator('#musicCocCocOffline').getAttribute('href'),'https://www.youtube.com/watch?v=abcdefghijk');
   assert.equal(await page.locator('#musicCocCocImport').count(),0,'no misleading MP3 import button');
   assert.match(await page.locator('#musicCocCocNote').textContent(),/Danh sách nghe/);
   assert.deepEqual(errors,[],'no browser JS errors');
   console.log('PASS Music iOS layout '+width+'x'+height,JSON.stringify({plus,peek,dock,auxY:[loop.y,rate.y,queue.y],miniCenters:centers}));
   await page.close();
  }
 }finally{await browser?.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
