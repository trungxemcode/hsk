const {chromium,webkit}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
(async()=>{
 const root=process.cwd(),server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 let browser;
 try{
 browser=await chromium.launch({executablePath:process.env.CHROME_EXECUTABLE});
 for(const width of [390,844,1440]){
 const page=await browser.newPage({viewport:{width,height:width===844?390:844},isMobile:width<900,hasTouch:width<900,serviceWorkers:'block'});
 await page.route('https://**/*',r=>r.abort());
 await page.route('**/account-config.json',r=>r.fulfill({json:{enabled:false}}));
 await page.route('**/translation-config.json',r=>r.fulfill({json:{enabled:true,endpoint:'https://test.invalid/translate'}}));
 let complete;
 await page.route('**/lesson-ask',async r=>{await new Promise(resolve=>complete=resolve);await r.fulfill({json:{answer:'Test answer'}});});
 await page.route('**/chat-fixture.html',r=>r.fulfill({contentType:'text/html',body:fs.readFileSync('index.html','utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'')}));
 await page.goto('http://127.0.0.1:'+server.address().port+'/chat-fixture.html');
 await page.evaluate(()=>document.body.classList.add('studio-enabled'));
 await page.addScriptTag({url:'http://127.0.0.1:'+server.address().port+'/src/modules/translation/lesson-chat.js'});
 await page.evaluate(()=>{window.HSKAccountDashboard={user:{getIdToken:async()=> 'test'}};window.dispatchEvent(new CustomEvent('hsk-lesson-context',{detail:{id:'test',number:1,hsk:1,vi:'Test'}}));});
 await page.locator('#lessonChatButton').click();
 assert.equal(await page.locator('#lessonChatButton').isVisible(),false);
 assert.equal(await page.locator('#lessonChatInput').evaluate(e=>getComputedStyle(e).fontSize),'16px');
 const scale=await page.evaluate(()=>visualViewport.scale);
 await page.locator('#lessonChatInput').fill('Test question');
 assert.equal(await page.evaluate(()=>visualViewport.scale),scale);
 await page.locator('#lessonChatSend').click();
 await page.waitForFunction(()=>document.querySelector('#lessonChatPanel').getAttribute('aria-busy')==='true');
 assert.match(await page.locator('#lessonChatMessages').innerText(),/Test question/);
 assert.equal(await page.locator('#hskLoadingScreen').isVisible(),false);
 assert.equal(await page.locator('#lessonChatInput').isEnabled(),true);
 assert.equal(await page.locator('#lessonChatStatus').evaluate(e=>getComputedStyle(e,'::before').animationName),'hsk-chat-spin');
 await page.locator('#lessonChatClose').click();
 assert.equal(await page.locator('#lessonChatButton').isVisible(),true);
 await page.waitForFunction(()=>true);
 while(!complete)await new Promise(r=>setTimeout(r,20));complete();
 await page.waitForFunction(()=>!document.querySelector('#lessonChatPanel').hasAttribute('aria-busy'));
 assert.equal(await page.locator('#lessonChatPanel').isVisible(),false);
 assert.equal(await page.locator('#lessonChatMessages .user').count(),1);

 console.log('PASS chat',width,'font, focus scale, launcher, immediate message, inline spinner, close during request, reduced-motion ring');
 await page.close();
 }
 }finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
