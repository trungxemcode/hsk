const {chromium}=require('playwright'),fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=process.cwd(),server=http.createServer((q,r)=>{const f=path.resolve(root,'.'+new URL(q.url,'http://local').pathname);if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){r.writeHead(404);return r.end();}r.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'})[path.extname(f)]||'application/octet-stream');r.end(fs.readFileSync(f));});await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:process.env.CHROME_EXECUTABLE});

 try{for(const width of [320,390,1440]){
 const page=await browser.newPage({viewport:{width,height:900},serviceWorkers:'block'});await page.route('https://**/*',r=>r.abort());await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.HSKStudio&&window.HSKMobileUX&&window.HSKPracticeSelection&&window.HSKLessons);
 const read=await page.evaluate(()=>{const mapping=root=>[...root.querySelectorAll('.nav-group')].map(g=>({name:g.querySelector('summary').textContent.trim(),routes:[...g.querySelectorAll('[data-studio-go]')].map(b=>b.dataset.studioGo)}));return {pc:mapping(document.querySelector('.side-nav')),phone:mapping(document.querySelector('.drawer-route-nav'))};});
 assert.deepEqual(read.phone,read.pc);assert.deepEqual(read.pc.map(x=>x.routes),[['lessons','learn'],['practice','notebook'],['real-reading','music-play'],['search','ai-qa','sentence-editor'],['exam','study4']]);
 const root=width<721?'#drawer .drawer-route-nav':'.side-nav';
 async function enter(route){
  await page.evaluate(()=>HSKStudio.navigate('home'));if(width<721)await page.locator('#menuBtn').click();
  const b=page.locator(root+' [data-studio-go="'+route+'"]');const d=b.locator('xpath=ancestor::details[1]');
  if(width<721){if(await d.getAttribute('open')===null)await d.locator('summary').click();await b.click();}
  else{await d.locator('summary').click();const fly=page.locator('.nav-flyout-side:not([hidden])');await fly.waitFor({state:'visible'});await fly.locator('[data-studio-go="'+route+'"]').click();}
  assert.equal(await b.getAttribute('aria-current'),'page',route+' parent selected');if(width<721)assert.equal(await page.locator('#drawer').getAttribute('aria-hidden'),'true');
 }
 for(const [route,id] of [['lessons','lessonsPanel'],['learn','learnPanel'],['practice','studioPractice'],['notebook','notebookPanel'],['real-reading','realReadingPanel'],['search','searchPanel'],['exam','examPractice'],['study4','study4PracticePanel']]){
  await enter(route);if(route==='exam')assert.equal(await page.locator('[data-studio-hub-panel=exam]').isVisible(),true);else assert.equal(await page.locator('#'+id).isVisible(),true,route);
 }
 for(const [mode,prefix,selector] of [['quiz','practice','#quizPanel'],['srs','review','#srsPanel'],['writing','practice','#writingPractice'],['placement','practice','#placementDialog']]){
  await enter('practice');const d=page.locator('#'+prefix+'ModeDisclosure');if(await d.getAttribute('open')===null)await d.locator('summary').click();await page.locator('#'+prefix+'ClearAll').click();await page.locator('#'+prefix+'ModeOptions input[value="'+mode+'"]').check();await page.locator('#'+prefix+'StartModes').click();assert.equal(await page.locator(selector).isVisible(),true,mode+' reachable through chooser');assert.equal(await page.locator(root+' [data-studio-go=practice]').getAttribute('aria-current'),'page');if(['writing','placement'].includes(mode))await page.locator(selector).evaluate(n=>n.close());
 }
 await enter('search');assert.equal(await page.locator('#searchPanel .studio-search-tabs button').count(),4);await page.locator('#searchPanel [data-search-tool=image]').click();assert.equal(await page.locator('#ocrChoose').isVisible(),true);assert.equal(await page.locator(root+' [data-studio-go=search]').getAttribute('aria-current'),'page');
 await enter('practice');assert.equal(await page.locator('#practiceModeOptions input').count(),10);assert.equal(await page.locator('#reviewModeOptions input').count(),2);
 if(width<721){await page.locator('#menuBtn').click();assert.equal(await page.locator('#drawer [data-lesson-level]').count(),6);}
 console.log('PASS major navigation, chooser modes and tools '+width);await page.close();
 }}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
