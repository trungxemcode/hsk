const {chromium}=require('playwright'),fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=process.cwd(),server=http.createServer((q,r)=>{const f=path.resolve(root,'.'+new URL(q.url,'http://local').pathname);if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){r.writeHead(404);return r.end();}r.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'})[path.extname(f)]||'application/octet-stream');r.end(fs.readFileSync(f));});await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:process.env.CHROME_EXECUTABLE});
 try{for(const width of [390,1440]){const page=await browser.newPage({viewport:{width,height:1000},serviceWorkers:'block'});await page.route('https://**/*',r=>r.abort());await page.route('**/account-config.json',r=>r.fulfill({contentType:'application/json',body:'{"enabled":false}'}));await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.HSKStudio&&window.HSKMobileUX);await page.evaluate(()=>HSKStudio.navigate('account'));await page.locator('#accountPanel').waitFor({state:'visible'});

 for(const theme of ['light','dark'])for(const count of [0,1,12]){
 await page.evaluate(({theme,count})=>{document.documentElement.dataset.theme=theme;localStorage.setItem('hsk-study4-progress-v1',JSON.stringify(Object.fromEntries(Array.from({length:count},(_,i)=>['history-'+i,{submitted:true,updatedAt:Date.now()-i,score:{correctObj:2,totalObj:3},answers:{a:'A'}}]))));HSKStudio.navigate('account');},{theme,count});
 const details=page.locator('.account-exam-history'),summary=details.locator('summary');
 await details.evaluate(n=>n.open=false);assert.equal(await page.locator('#hskExamHistory').isVisible(),false);
 await summary.click();assert(await page.locator('#hskExamHistory').isVisible());
 assert.equal(await page.locator('.hsk-exam-history-item').count(),count);
 const bounds=await details.evaluate(n=>{const panel=document.getElementById('accountPanel').getBoundingClientRect(),box=n.getBoundingClientRect(),rows=document.getElementById('hskExamHistory').getBoundingClientRect();return {panelBottom:panel.bottom,bottom:box.bottom,rowsBottom:rows.bottom,width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth};});
 assert(bounds.rowsBottom<=bounds.bottom+1,JSON.stringify(bounds));assert(bounds.bottom<=bounds.panelBottom+1,JSON.stringify(bounds));assert(bounds.scroll<=bounds.width,JSON.stringify(bounds));
 await summary.focus();await page.keyboard.press('Enter');assert.equal(await details.getAttribute('open'),null);
 await summary.click();await page.screenshot({path:require('node:os').tmpdir()+'/account-history-'+width+'-'+theme+'-'+count+'.png',fullPage:true});
 }
 await page.close();}console.log('PASS account history disclosure: 0/1/12 results, parent containment, keyboard, mobile/desktop, light/dark.');}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
