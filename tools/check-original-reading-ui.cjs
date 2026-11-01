const {chromium}=require('playwright'),fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=process.cwd(),server=http.createServer((q,r)=>{const f=path.resolve(root,'.'+new URL(q.url,'http://test').pathname);if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){r.writeHead(404);return r.end();}r.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(f)]||'application/octet-stream');r.end(fs.readFileSync(f));});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME_EXECUTABLE});let ai=0;
 const url='https://hskreading.com/fixture-reading/',sentence='小明：今天我们一起去学校。';
 try{for(const width of [320,390,1440]){
  const page=await browser.newPage({viewport:{width,height:900},serviceWorkers:'block'});const calls=[];
  await page.route('https://**/*',r=>r.abort());await page.route('**/account-config.json',r=>r.fulfill({contentType:'application/json',body:'{"enabled":false,"firebase":{"projectId":"hsk-test"}}'}));
  await page.route('**/translation-config.json',r=>r.fulfill({contentType:'application/json',body:'{"enabled":true,"endpoint":"https://worker.test/translate"}'}));
  const cloud=new Map();await page.route('https://firestore.googleapis.com/**',r=>{const req=r.request();if(req.method()==='POST'){const write=req.postDataJSON().writes[0];assert.equal(write.updateTransforms[0].setToServerValue,'REQUEST_TIME');assert(!JSON.stringify(write).includes(sentence));cloud.set(write.update.name,write.update.fields);return r.fulfill({contentType:'application/json',body:'{"writeResults":[{}]}'});}const name=new URL(req.url()).pathname.replace('/v1/','');return r.fulfill({status:cloud.has(name)?200:404,contentType:'application/json',body:JSON.stringify({fields:cloud.get(name)})});});
  await page.route('https://worker.test/reading-next',r=>{ai++;return r.abort();});
  await page.route('https://worker.test/reading-library',r=>{const b=r.request().postDataJSON();calls.push(b);return r.fulfill({contentType:'application/json',body:JSON.stringify(b.op==='list'?{items:[{url,title:'Bài nguồn',site:'HSK Reading',hsk:b.hsk}],unavailable:[]}:{article:{url,title:'今天',site:'HSK Reading',status:'original',paragraphs:[{hanzi:sentence,pinyin:'Xiǎo Míng: jīntiān wǒmen yìqǐ qù xuéxiào.'}]}})});});
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.waitForFunction(()=>window.HSKStudio&&window.HSKLessons&&window.HSKMobileUX&&document.body.dataset.studioHub==='home');
  await page.evaluate(()=>{HSKStudio.navigate('real-reading');});
  await page.locator('#rrNew').click();await page.locator('.rr-original-list button').click();await page.waitForFunction(()=>document.querySelector('#rrOriginalReading .rr-hanzi'));
  assert.equal(cloud.size,0,'guest reading must not create history');
  await page.evaluate(()=>{window.HSKAccountDashboard={user:{uid:'cloud-test',getIdToken:async()=> 'test-token'}};window.dispatchEvent(new Event('hsk-account-ready'));});
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
   assert.equal(Object.keys(stored).length,0,'no URLs or history on device');await page.waitForFunction(()=>document.getElementById('rrStatus').textContent.includes('lịch sử lưu trên cloud'));assert(cloud.size>0);assert(JSON.stringify([...cloud.values()]).includes(url));
   await page.locator('#rrOld').click();await page.waitForFunction(()=>!document.querySelector('#rrNew').disabled);
  }
  await page.reload();await page.waitForFunction(()=>window.HSKStudio&&window.HSKLessons&&window.HSKMobileUX&&document.body.dataset.studioHub==='home');await page.evaluate(()=>{window.HSKAccountDashboard={user:{uid:'cloud-test',getIdToken:async()=> 'test-token'}};window.dispatchEvent(new Event('hsk-account-ready'));HSKStudio.navigate('real-reading');});await page.locator('#rrOld').click();await page.waitForFunction(()=>document.querySelector('#rrOriginalReading .rr-hanzi'));assert.equal(await page.locator('#rrOriginalReading .rr-hanzi').innerText(),sentence);
  await page.evaluate(()=>{window.HSKAccountDashboard={user:{uid:'different-test-user',getIdToken:async()=> 'other-token'}};window.dispatchEvent(new Event('hsk-account-ready'));});await page.locator('#rrOld').click();await page.waitForFunction(()=>document.getElementById('rrStatus').textContent.includes('Chưa có URL'));
  await page.context().setOffline(true);await page.waitForFunction(()=>!navigator.onLine);assert.equal(await page.locator('#rrOriginalReading').innerText(),'');assert(await page.locator('#rrNew').isDisabled());assert(await page.locator('#rrOld').isDisabled());assert.match(await page.locator('#rrStatus').innerText(),/chỉ hoạt động khi có mạng/);await page.context().setOffline(false);await page.waitForFunction(()=>navigator.onLine&&!document.getElementById('rrNew').disabled);
  await page.locator('#rrContentMode').selectOption('ai');assert(await page.locator('#rrGenre').isVisible());assert(await page.locator('#rrSources').isVisible());
  assert.equal(ai,0);await page.close();console.log('PASS original-source UI',width,'light/dark, exact text, guest, cloud-only, no local history, online-only, cloud replay/reload, owner isolation, legacy mode');
 }}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

