// Contrast regression for real dark screens; external services stay mocked.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
(async()=>{
 const root=process.cwd(),server=http.createServer((q,r)=>{
  const f=path.resolve(root,'.'+new URL(q.url,'http://local').pathname);
  if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){r.writeHead(404);return r.end();}
  r.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json'})[path.extname(f)]||'application/octet-stream');r.end(fs.readFileSync(f));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
 try{for(const width of [320,390,1440]){
  const page=await browser.newPage({viewport:{width,height:900},serviceWorkers:'block'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>r.abort());await page.route('**/account-config.json',r=>r.fulfill({body:'{"enabled":false}',contentType:'application/json'}));
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.waitForFunction(()=>window.HSKStudio&&window.HSKLessons);
  await page.evaluate(()=>document.documentElement.dataset.theme='dark');
  const check=async label=>{
   await page.mouse.move(0,0);await page.waitForTimeout(400);
   const failures=await page.evaluate(()=>{
    const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number),blend=(f,b)=>f.slice(0,3).map((v,i)=>v*(f[3]??1)+b[i]*(1-(f[3]??1))),lum=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0),out=[];
    for(const el of document.querySelectorAll('body *')){
     if(!el.getClientRects().length||getComputedStyle(el).visibility==='hidden'||!Array.from(el.childNodes).some(n=>n.nodeType===3&&n.textContent.trim())||el.closest('button:disabled,[aria-hidden=true]'))continue;
     // An unchecked custom checkbox deliberately has no visible tick.
     if(el.matches('.ps-option:not(.is-selected) .ps-check'))continue;
     const chain=[];for(let n=el;n;n=n.parentElement)chain.unshift(n);
     let bg=[255,255,255];for(const n of chain)bg=blend(rgb(getComputedStyle(n).backgroundColor),bg);
     const st=getComputedStyle(el),fg=blend(rgb(st.color),bg),ratio=(Math.max(lum(fg),lum(bg))+.05)/(Math.min(lum(fg),lum(bg))+.05),size=parseFloat(st.fontSize),minimum=size>=24||(size>=18.66&&Number(st.fontWeight)>=700)?3:4.5;
     if(ratio<minimum)out.push({selector:el.tagName+'.'+el.className,parent:el.parentElement.className,text:el.textContent.trim().slice(0,50),color:st.color,bg,ratio:+ratio.toFixed(2),minimum});
    }return out;
   });assert.deepEqual(failures,[],label+' '+width);
  };
  for(const route of ['home','lessons','practice','learn','quiz','srs','mistakes','compare','search','translator','account','about','notebook','real-reading','study4','match-game','sentence-game']){
   await page.evaluate(r=>HSKStudio.navigate(r),route);await check(route);
   if(route==='practice'){await page.locator('#practiceModeDisclosure').evaluate(n=>n.open=true);await check('practice expanded');}
   if(route==='lessons'){
    assert.ok(await page.locator('.lesson-number').count()>0);
    await page.locator('.lesson-row').first().evaluate(n=>n.classList.add('is-mastered'));await check('mastered lesson badge');
    if(width===390)await page.screenshot({path:'/tmp/hsk-dark-contrast-lessons.png',fullPage:true});
   }
  }
  await page.evaluate(async()=>{HSKStudio.navigate('lessons');history.replaceState(null,'','#lesson/standard-3-01');await HSKLessonNav.open();});
  for(const section of ['overview','reading','grammar','practice']){
   const picker=page.getByLabel('Chọn mục bài học',{exact:true});
   if(await picker.isVisible())await picker.selectOption(section);else await page.locator('.lesson-section-nav button').nth(['overview','reading','grammar','practice'].indexOf(section)).click();
   await check('lesson '+section);
  }
  assert.deepEqual(errors,[]);await page.close();
 }console.log('PASS dark contrast: 17 routes, expanded practice, lesson badge states and 4 lesson sections at 320/390/1440; text >=4.5:1 (large >=3:1).');}
 finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
