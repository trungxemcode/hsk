// Browser integration for the approved shell; external account/AI calls are isolated.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
(async()=>{
 const root=process.cwd(),errors=[],server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/account-config.json',route=>route.fulfill({contentType:'application/json',body:'{"enabled":false}'}));
  await page.route('https://**/*',route=>route.abort());
  await page.addInitScript(()=>{window.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices:()=>[{name:'Test Mandarin',lang:'zh-CN',localService:true}],cancel(){},speak(u){window.__spoken=u.text;setTimeout(()=>u.onend?.(),10);}}});});
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);await page.waitForFunction(()=>!!window.HSKLessons&&document.body.dataset.studioHub==='home',{timeout:60000});
  const nav=async mode=>{await page.locator('.sidebar [data-studio-go="'+mode+'"]').click();};
  await nav('practice');await page.waitForTimeout(350);assert.equal(await page.locator('#activeTitle').innerText(),'Luyện tập');await page.locator('#studioPractice [data-studio-go="learn"]').click();await page.locator('#flashcard').waitFor({state:'visible'});
  await page.locator('#flashcard .front .speech-button').click();assert.ok(await page.evaluate(()=>!!window.__spoken));assert.equal(await page.locator('#flashcard').evaluate(el=>el.classList.contains('flipped')),false);
  await page.locator('#flashcard .mastery-btn.known').click();await page.waitForTimeout(180);await nav('account');assert.equal(await page.locator('#studioStreak').innerText(),'1 ngày');assert.ok(await page.locator('#offlineUpdate').isDisabled());
  await page.locator('#studioTargetLevel').selectOption('1');assert.match(await page.locator('#studioKnownCount').innerText(),/^1 \/ /);
  await page.screenshot({path:'/tmp/studio-account-desktop.png',fullPage:true});
  await nav('search');await page.locator('#searchInput').fill('bạn');await page.locator('#searchForm button[type="submit"]').click();assert.ok(await page.locator('#searchResults .result-card').count()>0);await page.locator('#handwritingOpen').click();assert.ok(await page.locator('#handwritingCanvas').isVisible());await page.locator('#handwritingClose').click();
  await page.locator('#searchPanel [data-studio-go="translator"]').click();assert.ok(await page.locator('#translationInput').isVisible());await page.locator('#ocrCapture').locator('..').locator('summary').click().catch(()=>{});assert.equal(await page.locator('#ocrFile').count(),1);
  await nav('lessons');await page.evaluate(async()=>{history.replaceState(null,'','#lesson/standard-2-03');await window.HSKLessonNav.open();});assert.equal(await page.locator('.lesson-section-nav button').count(),6);for(const name of ['Ngữ pháp','Bài đọc','Hội thoại','Từ vựng','Luyện tập']){await page.locator('.lesson-section-nav').getByRole('button',{name,exact:true}).click();}
  assert.equal(await page.locator('#lessonChatButton').count(),1);
  await nav('review');await page.locator('#studioReview [data-studio-go="srs"]').click();await page.locator('#srsStart').click();assert.ok(await page.locator('#srsCard').isVisible());await page.locator('#srsReveal').click();assert.ok(await page.locator('#srsRatings').isVisible());
  // Render each main view at desktop and phone sizes; assert it remains within the viewport.
  for(const width of [1440,390]){
   await page.setViewportSize({width,height:900});
   for(const mode of ['home','practice','review','learn','search','quiz','mistakes','compare','srs','account','translator','lessons','about']){
    await page.evaluate(mode=>window.HSKStudio.navigate(mode),mode);await page.waitForTimeout(40);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1),false,mode+' overflow at '+width);
   }
   await page.evaluate(()=>window.HSKStudio.navigate('practice'));const color=await page.locator('#studioPractice .hub-content strong').first().evaluate(el=>getComputedStyle(el).color);assert.equal(color,'rgb(32, 32, 51)');
   await page.waitForTimeout(350);if(width===390){const overlap=await page.evaluate(()=>document.querySelector('#speechStatus').getBoundingClientRect().bottom>document.querySelector('.bottom-nav').getBoundingClientRect().top);assert.equal(overlap,false,'speech status must clear phone navigation');}await page.screenshot({path:'/tmp/studio-practice-'+width+'.png',fullPage:true});
  }
  // All known core modules and controls still exist, including protected admin UI.
  for(const id of ['accountSync','accountBackup','adminRefresh','handwritingAdvanced','handwritingAI','handwritingCorrectChar','translationAskSubmit','lessonChatSend','memoryCalendar'])assert.equal(await page.locator('#'+id).count(),1,id);
  assert.deepEqual(errors,[]);console.log('PASS: desktop/mobile layout; original feature controls; real flashcards/search/SRS/lessons; guarded updater; local activity statistics; no page errors. External AI/auth mocked.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exit(1);});
