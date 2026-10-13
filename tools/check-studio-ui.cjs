// Browser integration for the approved shell; external account/AI calls are isolated.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
(async()=>{
 const root=process.cwd(),errors=[],server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},serviceWorkers:'block'});page.on('pageerror',e=>errors.push(e.message));
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
  // Audit computed foreground/background pairs after the full CSS cascade.
  const contrast=async selectors=>{
   const failures=await page.evaluate(selectors=>{
    const rgb=s=>s.match(/[\d.]+/g).map(Number),blend=(f,b)=>f.slice(0,3).map((n,i)=>n*(f[3]??1)+b[i]*(1-(f[3]??1))),lum=c=>c.map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;}).reduce((a,n,i)=>a+n*[.2126,.7152,.0722][i],0),out=[];
    for(const el of document.querySelectorAll(selectors)){
     if(!el.getClientRects().length||getComputedStyle(el).visibility==='hidden')continue;
     const chain=[];for(let e=el;e;e=e.parentElement)chain.unshift(e);
     let bg=[255,255,255];for(const e of chain)bg=blend(rgb(getComputedStyle(e).backgroundColor),bg);
     const st=getComputedStyle(el),fg=blend(rgb(st.color),bg),ratio=(Math.max(lum(fg),lum(bg))+.05)/(Math.min(lum(fg),lum(bg))+.05),size=parseFloat(st.fontSize),minimum=size>=24||(size>=18.66&&Number(st.fontWeight)>=700)?3:4.5;
     if(ratio<minimum)out.push({text:el.textContent.trim().slice(0,65),ratio:ratio.toFixed(2),minimum,color:st.color,bg});
    }return out;
   },selectors);assert.deepEqual(failures,[],'contrast '+selectors);
  };
  for(const width of [1440,390]){
   await page.setViewportSize({width,height:900});
   for(const mode of ['home','practice','review','account','about']){
    await page.evaluate(mode=>window.HSKStudio.navigate(mode),mode);await page.waitForTimeout(350);
    await contrast('.sidebar-label,.side-nav button,.side-quick button,#activeTitle,#studioLevelText,.feature-copy h3,.feature-copy p,.hero-button,.shortcut strong,.shortcut small,.path-step>span,.path-step strong,.path-step small,.today-card p,.featured-han span,.stats-stack strong,.stats-stack small,.review-reminder strong,.review-reminder small,.hub-content strong,.hub-content small,.hub-content em,.about-hero strong,.about-hero span,.account-metric strong,.account-metric small,.metric-caption,.account-detail h3,.account-day,.account-day b,.account-progress-meta,.account-level-note,.account-version-copy strong,.account-version-copy p,.account-version button');
   }
   await page.locator('#levelPill').click();if(await page.locator('#hskFilterToggle').getAttribute('aria-expanded')!=='true')await page.locator('#hskFilterToggle').click();await page.waitForTimeout(300);
   await contrast('.drawer-head strong,.drawer-head span,.drawer-title,.drawer-hint,.di-lbl,.studio-filter-label,.studio-filter-count');
   assert.equal(await page.locator('.filter-btn[aria-pressed=true]').count(),1);
   await page.locator('.filter-btn[data-filter="5"]').click();await page.waitForTimeout(300);
   assert.equal(await page.locator('#studioLevelText').innerText(),'HSK 5');
   assert.equal(await page.locator('.filter-btn[data-filter="5"]').getAttribute('aria-pressed'),'true');
   if(!await page.locator('#drawerClose').isVisible())await page.locator('#levelPill').click();
   if(await page.locator('#hskFilterToggle').getAttribute('aria-expanded')!=='true')await page.locator('#hskFilterToggle').click();
   await page.waitForTimeout(300);await contrast('.studio-filter-label,.studio-filter-count');await page.screenshot({path:'/tmp/studio-filter-'+width+'.png',fullPage:true});
   await page.locator('#drawerClose').click();await page.evaluate(()=>window.HSKStudio.navigate('about'));await page.waitForTimeout(350);await page.screenshot({path:'/tmp/studio-about-'+width+'.png',fullPage:true});
  }
  // Menu groups and the phone text layout must retain usable widths.
  for(const width of [320,375,390,430]){
   await page.setViewportSize({width,height:900});
   for(const mode of ['home','practice','review','learn','search','quiz','mistakes','compare','srs','account','translator','lessons','about']){
    await page.evaluate(mode=>window.HSKStudio.navigate(mode),mode);await page.waitForTimeout(350);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,mode+' phone overflow '+width+' '+JSON.stringify(await page.evaluate(()=>Array.from(document.querySelectorAll('.workspace *')).filter(el=>el.getClientRects().length&&el.getBoundingClientRect().right>innerWidth+1).slice(0,8).map(el=>({tag:el.tagName,id:el.id,cls:el.className,text:el.textContent.slice(0,50),width:el.getBoundingClientRect().width})))));
   }
   await page.evaluate(()=>window.HSKStudio.navigate('account'));await page.waitForTimeout(350);
   const cramped=await page.locator('.account-metric').evaluateAll(cards=>cards.map(card=>{const value=card.querySelector('strong').getBoundingClientRect(),label=card.querySelector('.metric-caption').getBoundingClientRect(),note=card.querySelector('small').getBoundingClientRect();return {stacked:value.top>=label.bottom-1&&note.top>=value.bottom-1,noteWidth:note.width,cardWidth:card.clientWidth};}).filter(x=>!x.stacked||x.noteWidth<x.cardWidth*.65));
   assert.deepEqual(cramped,[],'account metrics must not squeeze copy beside values '+width);
   assert.ok(await page.locator('#studioTargetLevel').evaluate(el=>el.clientWidth>200));
   await page.screenshot({path:'/tmp/studio-account-'+width+'.png',fullPage:true});
   await page.locator('#levelPill').click();
   assert.equal(await page.locator('#drawer .drawer-body > .drawer-group').count(),5);
   const summaries=page.locator('#drawer .drawer-group-heading');assert.equal(await summaries.count(),4);
   for(const summary of await summaries.all()){
    if(await summary.locator('..').getAttribute('open')!==null)await summary.click();
    assert.equal(await summary.locator('..').getAttribute('open'),null);await summary.press('Enter');assert.notEqual(await summary.locator('..').getAttribute('open'),null);await summary.press('Enter');assert.equal(await summary.locator('..').getAttribute('open'),null);
   }
   if(await page.locator('#hskFilterToggle').getAttribute('aria-expanded')==='true')await page.locator('#hskFilterToggle').click();
   await page.waitForTimeout(300);await page.screenshot({path:'/tmp/studio-menu-'+width+'.png',fullPage:true});
   await summaries.filter({hasText:'Ôn luyện'}).click();await page.locator('#drawer [data-drawer-mode="quiz"]').click();assert.ok(await page.locator('#quizPanel').isVisible());
   await page.waitForTimeout(350);await page.screenshot({path:'/tmp/studio-quiz-'+width+'.png',fullPage:true});
  }
  // All known core modules and controls still exist, including protected admin UI.
  for(const id of ['accountSync','accountBackup','adminRefresh','handwritingAdvanced','handwritingAI','handwritingCorrectChar','translationAskSubmit','lessonChatSend','memoryCalendar'])assert.equal(await page.locator('#'+id).count(),1,id);
  assert.deepEqual(errors,[]);console.log('PASS: desktop/mobile layout; original feature controls; real flashcards/search/SRS/lessons; guarded updater; local activity statistics; no page errors. External AI/auth mocked.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exit(1);});
