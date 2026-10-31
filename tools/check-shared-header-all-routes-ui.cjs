/* Cover the shared hamburger/title shell on every reachable HSK route. */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {ROUTES}=require('./ui-outside-scope-core.cjs');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
(async()=>{
 const root=process.cwd(),server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
 try{
  let total=0,excluded=[];
  for(const [width,height] of [[320,844],[390,844],[430,932],[844,390]]){
   const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true,serviceWorkers:'block'}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://**/*',r=>r.abort());
   await page.route('**/account-config.json',r=>r.fulfill({contentType:'application/json',body:'{"enabled":false}'}));
   await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);
   await page.waitForFunction(()=>window.HSKStudio&&window.HSKLessons&&window.HSKMobileUX);
   const mobile=await page.evaluate(()=>document.body.classList.contains('mobile-ux'));
   assert.ok(mobile,`mobile-ux missing at ${width}x${height}`);
   const measure=()=>page.evaluate(()=>{
    const header=document.querySelector('#studioHeader'),menu=document.querySelector('#menuBtn'),title=document.querySelector('#studioHeader .topbar-title'),label=document.querySelector('#activeTitle'),actions=document.querySelector('#studioHeader .topbar-actions'),inner=document.querySelector('#studioHeader .topbar-inner');
    const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom,center:r.y+r.height/2};};
    return {visible:header.checkVisibility()&&menu.checkVisibility(),menu:rect(menu),title:rect(title),label:rect(label),actions:rect(actions),inner:rect(inner),header:rect(header),overflow:document.documentElement.scrollWidth-innerWidth,view:innerWidth,name:document.querySelector('#activeTitle').textContent};
   });
   // Home is canonical; every subpage must use the same exact menu/text inset.
   for(const theme of ['light','dark']){
    await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;window.HSKStudio.navigate('home');},theme);
    const baseline=await measure();
    assert.ok(baseline.visible,`Home header missing ${width} ${theme}`);
    const inset=Math.max(16,await page.evaluate(()=>parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-left'))||16));
    assert.ok(Math.abs(baseline.menu.x-inset)<=1.1,`Home menu x=${baseline.menu.x} not ${inset} ${width} ${theme}`);
    for(const route of ROUTES){
     if(route==='admin'){
      await page.evaluate(()=>{const uid='BIvUyItDYJWcLvlhhtYFyj5csBH2';window.HSKAccountDashboard={adminUid:uid,adminEmail:'owner@test.invalid',user:{uid,getIdToken:async()=>'test'},api:{db:{},collection:()=>0,query:()=>0,orderBy:()=>0,limit:()=>0,getDocs:async()=>({docs:[]})}};window.dispatchEvent(new Event('hsk-account-ready'));});
     }
     await page.evaluate(route=>window.HSKStudio.navigate(route),route);
     // A few study views intentionally replace the header with a focus bar.
     const state=await measure();
     if(!state.visible){excluded.push(`${route}@${width}-${theme}: focus layout hides common header`);continue;}
     const ctx=`${route} ${width}x${height} ${theme}`;
     assert.ok(Math.abs(state.menu.x-baseline.menu.x)<=0.75,`Hamburger x differs: ${ctx} ${JSON.stringify(state)}`);
     assert.ok(Math.abs(state.menu.w-44)<=0.75,`Hamburger size differs: ${ctx}`);
     assert.ok(Math.abs(state.title.x-baseline.title.x)<=0.75,`Title x differs: ${ctx}`);
     assert.ok(Math.abs(state.inner.x-baseline.inner.x)<=0.75,`Header container shifts: ${ctx}`);
     assert.ok(Math.abs(state.menu.center-state.title.center)<=1.5,`Hamburger/title vertical centers differ: ${ctx}`);
     assert.ok(state.actions.right<=state.view+1,`Header right action outside viewport: ${ctx}`);
     assert.ok(state.menu.x>=15,`Menu too close to phone edge: ${ctx}`);
     total++;
    }
    // Check the same header after the scroll container moves on a long route.
    await page.evaluate(()=>{HSKStudio.navigate('exam');const p=document.querySelector('.workspace');p.scrollTop=1100;});
    const scrolled=await measure();
    if(scrolled.visible){assert.ok(Math.abs(scrolled.menu.x-baseline.menu.x)<=0.75,`Scrolled header shifted ${width} ${theme}`);total++;}
    await page.evaluate(()=>HSKStudio.navigate('account'));
    if(await page.locator('#menuBtn').isVisible()){
     await page.locator('#menuBtn').click();
     assert.equal(await page.locator('#menuBtn').getAttribute('aria-expanded'),'true',`Menu no longer opens ${width} ${theme}`);
     await page.locator('#drawerClose').click();
     assert.equal(await page.locator('#menuBtn').getAttribute('aria-expanded'),'false',`Menu no longer closes ${width} ${theme}`);
    }
   }
   assert.deepEqual(errors,[],`Uncaught runtime errors at ${width}x${height}`);
   await page.close();
  }
  console.log(`PASS: ${total} shared header samples, ${ROUTES.length} routes (including child pages), 320/390/430/landscape, light/dark, scrolling and interactive drawer. Focus views: ${excluded.join(', ')||'none'}`);
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
