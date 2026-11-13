const {chromium}=require('playwright'),fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=process.cwd(),server=http.createServer((q,r)=>{const f=path.resolve(root,'.'+new URL(q.url,'http://local').pathname);if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){r.writeHead(404);return r.end();}r.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'})[path.extname(f)]||'application/octet-stream');r.end(fs.readFileSync(f));});await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:process.env.CHROME_EXECUTABLE});
 try{for(const width of [390,1440]){const page=await browser.newPage({viewport:{width,height:1000},serviceWorkers:'block'});await page.route('https://**/*',r=>r.abort());await page.route('**/account-config.json',r=>r.fulfill({contentType:'application/json',body:'{"enabled":false}'}));await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.HSKStudio&&window.HSKMobileUX);await page.evaluate(()=>HSKStudio.navigate('account'));await page.locator('#accountPanel').waitFor({state:'visible'});


 if(width>720){
 const navAlignment=await page.evaluate(()=>{
   const buttons=[...document.querySelectorAll('.side-nav .nav-group-items > button')];
   return buttons.map(b=>{
    const svg=b.querySelector('i[data-icon] > svg'),label=b.querySelector('span');
    if(!svg||!label)return null;
    const i=svg.getBoundingClientRect(),t=label.getBoundingClientRect();
    return {route:b.dataset.studioGo,difference:Math.abs(i.y+i.height/2-t.y-t.height/2)};
   }).filter(Boolean);
 });
 assert.ok(navAlignment.length>=2,'submenu SVG icons and text are present');
 for(const sample of navAlignment)assert.ok(sample.difference<1.25,
   'navigation '+sample.route+' icon/label misaligned by '+sample.difference+'px');
 const groups=page.locator('.side-nav .nav-group');
 assert.deepEqual(await groups.nth(3).locator('[data-studio-go]').evaluateAll(ns=>ns.map(n=>n.dataset.studioGo)),['search','ai-qa','sentence-editor'],'tools group contains dictionary and AI tutor');assert.equal(await groups.nth(1).locator('[data-studio-go]').count(),2,'mode choices belong inside Luyện & Ôn');
 assert.deepEqual(await groups.locator(':scope>summary').allTextContents(),['Học tập HSK','Ôn luyện','Giải trí','Công cụ','Luyện thi HSK']);
 await groups.evaluateAll(ns=>ns.forEach(n=>n.open=false));await groups.nth(0).locator('summary').click();
 await groups.nth(0).locator('[data-studio-go="learn"]').click();assert(await page.locator('#learnPanel').isVisible());
 for(const [route,selector] of [['lessons','#lessonsPanel'],['notebook','#notebookPanel'],['practice','#studioPractice'],['exam','[data-studio-hub-panel=exam]'],['study4','#study4PracticePanel'],['real-reading','#realReadingPanel']]){
 const btn=page.locator('.side-nav [data-studio-go="'+route+'"]').first();await btn.evaluate(n=>n.closest('details').open=true);await btn.click();assert(await page.locator(selector).isVisible(),route);assert.equal(await btn.getAttribute('aria-current'),'page');
 }
 await page.locator('.side-nav [data-studio-go="home"]').click();
 for(const theme of ['light','dark']){await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;document.querySelectorAll('.side-nav details').forEach(n=>n.open=true);},theme);assert.equal(await page.locator('.nav-group-items button').evaluateAll(ns=>ns.some(n=>n.scrollWidth>n.clientWidth+1)),false);await page.screenshot({path:'/tmp/grouped-nav-'+width+'-'+theme+'.png',fullPage:true});}
 await groups.nth(0).locator('summary').focus();await page.keyboard.press('Enter');assert.equal(await groups.nth(0).getAttribute('open'),null);
 const sidebarToggle=page.locator('#sidebarToggle'),sidebar=page.locator('aside.sidebar');
 await sidebarToggle.click();
 assert.equal(await sidebarToggle.getAttribute('aria-expanded'),'false');
 await page.waitForFunction(()=>Math.round(document.querySelector('aside.sidebar').getBoundingClientRect().width)===60);
 await sidebarToggle.click();
 assert.equal(await sidebarToggle.getAttribute('aria-expanded'),'true');
 await page.waitForFunction(()=>Math.round(document.querySelector('aside.sidebar').getBoundingClientRect().width)>=220);
 }else assert(await page.locator('#menuBtn').isVisible());
 await require('./profile-account-fixture.cjs')(page,width);await page.close();}console.log('PASS grouped navigation: five disclosures, direct routes, flashcards, keyboard, mobile unchanged');}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
