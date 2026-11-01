const {chromium}=require('playwright'),fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=process.cwd(),server=http.createServer((q,r)=>{const f=path.resolve(root,'.'+new URL(q.url,'http://test').pathname);if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){r.writeHead(404);return r.end();}r.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(f)]||'application/octet-stream');r.end(fs.readFileSync(f));});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME_EXECUTABLE});let ai=0;
 const url='https://hskreading.com/fixture-reading/',sentence='小明：今天我们一起去学校。';
 try{for(const width of [320,390,1440]){
  const page=await browser.newPage({viewport:{width,height:900},serviceWorkers:'block'});const calls=[];
  await page.route('https://**/*',r=>r.abort());await page.route('**/account-config.json',r=>r.fulfill({contentType:'application/json',body:'{"enabled":false}'}));
  await page.route('**/translation-config.json',r=>r.fulfill({contentType:'application/json',body:'{"enabled":true,"endpoint":"https://worker.test/translate"}'}));
  await page.route('https://worker.test/reading-next',r=>{ai++;return r.abort();});
  await page.route('https://worker.test/reading-library',r=>{const b=r.request().postDataJSON();calls.push(b);return r.fulfill({contentType:'application/json',body:JSON.stringify(b.op==='list'?{items:[{url,title:'Bài nguồn',site:'HSK Reading',hsk:b.hsk}],unavailable:[]}:{article:{url,title:'今天',site:'HSK Reading',status:'original',paragraphs:[{hanzi:sentence,pinyin:'Xiǎo Míng: jīntiān wǒmen yìqǐ qù xuéxiào.'}]}})});});
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.waitForFunction(()=>window.HSKStudio&&window.HSKLessons&&window.HSKMobileUX&&document.body.dataset.studioHub==='home');
  for(const theme of ['light','dark']){
   await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;HSKStudio.navigate('real-reading');},theme);
   assert.equal(await page.locator('#rrContentMode').inputValue(),'original');
   await page.locator('#rrNew').click();await page.locator('.rr-original-list button').click();
   await page.waitForFunction(()=>document.querySelector('#rrOriginalReading .rr-hanzi'));
   assert.equal(await page.locator('#rrOriginalReading .rr-hanzi').innerText(),sentence);
   assert.equal(await page.locator('#rrOriginalReading a').getAttribute('href'),url);
   await page.locator('#rrOriginalReading>button').click();assert(await page.locator('.rr-original-pin').isVisible());
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
   await page.screenshot({path:'/tmp/original-reading-'+width+'-'+theme+'.png',fullPage:true});
   const stored=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>k.startsWith('hsk-original-reading-urls'))));
   assert(JSON.stringify(stored).includes(url));assert(!JSON.stringify(stored).includes(sentence),'article bodies must not persist locally');
   await page.locator('#rrOld').click();await page.waitForFunction(()=>!document.querySelector('#rrNew').disabled);
  }
  await page.reload();await page.waitForFunction(()=>window.HSKStudio&&window.HSKLessons&&window.HSKMobileUX&&document.body.dataset.studioHub==='home');await page.evaluate(()=>HSKStudio.navigate('real-reading'));await page.locator('#rrOld').click();await page.waitForFunction(()=>document.querySelector('#rrOriginalReading .rr-hanzi'));assert.equal(await page.locator('#rrOriginalReading .rr-hanzi').innerText(),sentence);
  await page.evaluate(()=>{localStorage.setItem('hsk-account-meta-v1',JSON.stringify({uid:'different-test-user'}));window.dispatchEvent(new Event('hsk-account-ready'));});await page.locator('#rrOld').click();assert.match(await page.locator('#rrStatus').innerText(),/Chưa có URL/);
  await page.locator('#rrContentMode').selectOption('ai');assert(await page.locator('#rrGenre').isVisible());assert(await page.locator('#rrSources').isVisible());
  assert.equal(ai,0);await page.close();console.log('PASS original-source UI',width,'light/dark, exact text, guest, metadata-only, replay/reload, owner isolation, legacy mode');
 }}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

