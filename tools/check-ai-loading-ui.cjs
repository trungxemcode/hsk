// Regression: the AI overlay follows request lifetime, not a fabricated duration.
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),http=require('http'),assert=require('node:assert/strict');
(async()=>{
 const root=process.cwd();
 const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'})[path.extname(file)]||'application/octet-stream');
  res.end(fs.readFileSync(file));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:process.env.CHROME_EXECUTABLE});
 try{
  for(const width of [390,1440]){
   const page=await browser.newPage({viewport:{width,height:844},isMobile:width<721,hasTouch:width<721,serviceWorkers:'block'});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://**/*',r=>r.abort());
   await page.route('**/account-config.json',r=>r.fulfill({contentType:'application/json',body:'{"enabled":false}'}));
   await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');
   await page.waitForFunction(()=>!!window.HSKLoading?.showAI);
   // Fast requests close immediately after completion, regardless of estimated complexity.
   await page.evaluate(()=>{window.__stopFast=HSKLoading.showAI('AI dịch',{size:1800});});
   assert.match(await page.locator('#hskLoadingTitle').innerText(),/AI dịch/);
   await page.evaluate(()=>window.__stopFast());
   await page.locator('#hskLoadingScreen').waitFor({state:'hidden',timeout:1500});
   // Long requests stay open, then display truthful waiting copy.
   await page.evaluate(()=>{
    window.__slowController=new AbortController();
    window.__stopSlow=HSKLoading.showAI('AI phân tích bài làm',{size:3000,kind:'study',signal:window.__slowController.signal});
   });
   await page.waitForTimeout(2750);
   assert.match(await page.locator('#hskLoadingSub').innerText(),/nhiều dữ liệu/);
   assert.equal(await page.locator('#hskLoadingScreen').isVisible(),true);
   // Overlapping operations must not close another pending request.
   await page.evaluate(()=>{window.__stopSecond=HSKLoading.showAI('AI tạo truyện',{kind:'story'});window.__slowController.abort();});
   assert.match(await page.locator('#hskLoadingTitle').innerText(),/AI tạo truyện/);
   assert.equal(await page.locator('#hskLoadingScreen').isVisible(),true);
   await page.evaluate(()=>window.__stopSecond());
   await page.locator('#hskLoadingScreen').waitFor({state:'hidden',timeout:1500});
   await page.waitForTimeout(100);
   assert.deepEqual(errors,[]);
   console.log('PASS AI loading',width,'fast, actual pending, long-form status, abort, concurrent request');
   await page.close();
  }
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
