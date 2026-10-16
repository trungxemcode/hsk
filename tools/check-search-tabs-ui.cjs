// Regression for active lookup subtab: selection follows the visible panel on mobile and desktop.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
(async()=>{
 const root=process.cwd(),server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');
  res.end(fs.readFileSync(file));
 });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
 try{
  for(const width of [320,390,1440]){
   const page=await browser.newPage({viewport:{width,height:844},isMobile:width<721,hasTouch:width<721,serviceWorkers:'block'}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://**/*',r=>r.abort());
   await page.route('**/account-config.json',r=>r.fulfill({contentType:'application/json',body:'{"enabled":false}'}));
   await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');
   await page.waitForFunction(()=>!!window.HSKStudio&&!!window.HSKLessons,{timeout:25000});
   for(const theme of ['light','dark']){
    await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;window.HSKStudio.navigate('search')},theme);
    async function check(mode){
     const selected=mode==='search'?'search':'translator';
     const panel='#'+(mode==='search'?'searchPanel':'translatorPanel');
     assert.equal(await page.locator(panel).isVisible(),true,mode+' panel visible');
     for(const tab of ['search','translator']){
      const button=page.locator(panel+' .studio-search-tabs [data-studio-go="'+tab+'"]');
      assert.equal(await button.getAttribute('aria-pressed'),String(tab===selected),mode+'/'+tab+' aria-pressed');
      assert.equal(await button.evaluate(el=>el.classList.contains('active')),tab===selected,mode+'/'+tab+' active class');
     }
     const buttons=page.locator(panel+' .studio-search-tabs button');
     await page.evaluate(()=>document.activeElement?.blur?.());
     const colors=await buttons.evaluateAll(bs=>bs.map(el=>getComputedStyle(el).backgroundColor));
     assert.notEqual(colors[0],colors[1],mode+' visually distinguishes chosen tab');
     const chosen=await buttons.nth(mode==='search'?0:1).getAttribute('aria-current');
     assert.equal(chosen,'page',mode+' current');
     const nav=page.locator(width<721?'#mobileDock [data-studio-go="search"]':'.sidebar [data-studio-go="search"]');
     assert.equal(await nav.evaluate(el=>el.classList.contains('active')),true,'parent search stays selected');
    }
    await check('search');
    await page.locator('#searchPanel .studio-search-tabs [data-studio-go="translator"]').click();
    await check('translator');
    await page.locator('#translatorPanel .studio-search-tabs [data-studio-go="search"]').click();
    await check('search');
    await page.evaluate(()=>window.HSKStudio.navigate('translator'));
    await check('translator');
   }
   assert.deepEqual(errors,[], 'no page script errors');
   console.log('PASS search subtabs '+width+'px both themes and navigation');
   await page.close();
  }
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
