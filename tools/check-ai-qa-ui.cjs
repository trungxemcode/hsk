const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),http=require('http'),assert=require('node:assert/strict');
(async()=>{
 const root=process.cwd(),server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
 try{browser=await chromium.launch({executablePath:process.env.CHROME_EXECUTABLE});for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:844},isMobile:width<721,hasTouch:width<721,serviceWorkers:'block'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>r.abort());await page.route('**/account-config.json',r=>r.fulfill({contentType:'application/json',body:'{"enabled":false}'}));await page.route('**/translation-config.json',r=>r.fulfill({json:{enabled:true,endpoint:'https://ai.test/translate'}}));let received=null;
  await page.route('https://ai.test/lesson-ask',async r=>{received=r.request().postDataJSON();return r.fulfill({json:{answer:'Bạn đã có nền tảng tốt. Hãy chuyển sang một thử thách mới có ích.'}});});
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');
  // Studio navigation intentionally stays gated until the real lesson/data boot
  // completes. Waiting only for the shell API races that gate and leaves the
  // route hidden on slower local or bundled-browser runs.
  await page.waitForFunction(()=>window.HSKStudio&&window.HSKAIQACore&&window.HSKLessons&&document.querySelector('#appLoadStatus')?.hidden,{timeout:60000});
  await page.evaluate(()=>{window.HSKAccountDashboard={user:{uid:'qa-user',getIdToken:async()=> 'test-token'}};window.HSKStudio.navigate('ai-qa');});
  await page.locator('#aiQaPanel').waitFor({state:'visible'});assert.equal(await page.locator('[data-studio-go="ai-qa"]').count()>=1,true);assert.match(await page.locator('#aiQaSnapshot').innerText(),/HSK/);await page.locator('#aiQaInput').fill('Đánh giá lộ trình của tôi');await page.locator('#aiQaSend').click();await page.locator('.ai-qa-message.assistant').waitFor();assert.equal(received.lesson.content.mode,'ai-qa');assert.ok(received.lesson.content.learning_snapshot.masteryBoundary);assert.match(await page.locator('#aiQaMessages').innerText(),/Bạn đã có nền tảng tốt/);assert.deepEqual(errors,[]);console.log('PASS AI Q&A',width,'navigation, bounded snapshot, request, response');await page.close();
 }}finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
