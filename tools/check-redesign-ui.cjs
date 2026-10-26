/* Owner-supplied visual layer must preserve real routes and keyboard operation. */
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const root=process.cwd(),server=http.createServer((q,r)=>{
  const f=path.resolve(root,'.'+new URL(q.url,'http://local').pathname);
  if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){r.writeHead(404);return r.end();}
  r.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.woff2':'font/woff2'})[path.extname(f)]||'application/octet-stream');r.end(fs.readFileSync(f));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
  for(const width of [320,390,1440]){
   const page=await browser.newPage({viewport:{width,height:900},serviceWorkers:'block'}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));await page.route('https://**/*',r=>r.abort());
   await page.route('**/account-config.json',r=>r.fulfill({json:{enabled:false}}));
   await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');
   await page.waitForFunction(()=>window.HSKStudio&&window.HSKLessons&&document.querySelectorAll('.path-step[data-rd-enhanced="1"]').length===3);
   await page.evaluate(()=>document.fonts.ready);
   assert(await page.evaluate(()=>Array.from(document.fonts).filter(f=>f.family==='Inter'&&f.status==='loaded').length>=2),'local Latin and Vietnamese font subsets load');
   for(const theme of ['light','dark']){
    await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
    for(const [i,action] of [[0,'click'],[1,'Enter'],[2,'Space']]){
     await page.evaluate(()=>HSKStudio.navigate('home'));const step=page.locator('.path-step').nth(i);
     assert.equal(await step.getAttribute('role'),'button');
     if(action==='click')await step.click();else await step.press(action);
     if(i===0)assert(await page.locator('#lessonsPanel').isVisible());
     if(i===1)assert.equal(await page.locator('body').getAttribute('data-studio-hub'),'practice');
     if(i===2)assert(await page.locator('.app-tabs [data-mode=srs]').evaluate(n=>n.classList.contains('active')));
    }
    await page.evaluate(()=>HSKStudio.navigate('home'));await page.mouse.move(0,0);
    const steps=await page.locator('.path-step').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width};}));
    assert(steps.every(r=>Math.abs(r.y-steps[0].y)<2),'three pathway cards share one horizontal row');
    assert(steps[1].x>=steps[0].x+steps[0].width&&steps[2].x>=steps[1].x+steps[1].width,'pathway cards do not overlap');
    if(width<=720){
     const gaps=await page.evaluate(()=>{
      const rect=s=>document.querySelector(s).getBoundingClientRect(),gap=(a,b)=>rect(b).top-rect(a).bottom;
      return [gap('.shortcut-grid','.home-music-grid'),gap('.home-music-grid','.pathway'),gap('.pathway','.overview-search')];
     });
     assert.equal(await page.locator('#mobileTodayHero').evaluate(n=>n.firstElementChild.id),'homeDailyWord','daily word leads mobile hero');
     assert.equal(await page.locator('#homeDailyWord').count(),1,'one daily word with original controls');
     assert(gaps.every(g=>Math.abs(g-12)<2),'mobile home uses consistent 12px card spacing: '+gaps.join(','));
    }
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,'no horizontal overflow');
    await page.screenshot({path:'/tmp/hsk-redesign-'+width+'-'+theme+'.png',fullPage:true});
   }
   await page.emulateMedia({reducedMotion:'reduce'});
   assert.equal(await page.locator('.feature-hero').evaluate(n=>getComputedStyle(n).animationName),'none','hero animation respects reduced motion');
   assert.deepEqual(errors,[]);await page.close();console.log('PASS supplied redesign',width,'light/dark routes, click/Enter/Space, local fonts, overflow, reduced motion');
  }
 }finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
