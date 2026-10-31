/* Guard the mobile and desktop spacing specifically requested for exam catalogue. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
(async()=>{
 const root=process.cwd();
 const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
   res.writeHead(404);res.end();return;
  }
  res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'})[path.extname(file)]||'application/octet-stream');
  res.end(fs.readFileSync(file));
 });
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
 try{
  for(const width of [320,390,1440]){
   const page=await browser.newPage({viewport:{width,height:900},serviceWorkers:'block'}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://**/*',route=>route.abort());
   await page.route('**/account-config.json',route=>route.fulfill({contentType:'application/json',body:'{"enabled":false}'}));
   await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);
   await page.waitForFunction(()=>window.HSKStudio&&window.HSKExam&&window.HSKLessons);
   for(const theme of ['light','dark']){
    await page.evaluate(x=>{document.documentElement.dataset.theme=x;HSKStudio.navigate('exam');},theme);
    await page.locator('#examPractice #examPool').waitFor({state:'visible'});
    await page.locator('#examLevel').selectOption('5');
    const geometry=await page.evaluate(()=>{
     const root=document.querySelector('#examPractice');
     const pool=root.querySelector('#examPool'),groups=[...root.querySelectorAll('.exam-skill-group')];
     const rect=element=>{const r=element.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height};};
     return {
      groups:groups.map(g=>{
       const title=g.querySelector(':scope > h3'),cards=[...g.querySelectorAll(':scope > .exam-type-card')];
       return {name:title.textContent,count:cards.length,titleToCard:rect(cards[0]).top-rect(title).bottom,
        cardGaps:cards.slice(1).map((c,i)=>rect(c).top-rect(cards[i]).bottom),
        bottomPaddings:cards.map(c=>rect(c).bottom-rect(c.querySelector('.exam-type-meta')).bottom),
        titleBottom:rect(title).bottom,firstCardTop:rect(cards[0]).top};
      }),
      overviewToHeading:rect(groups[0].querySelector('h3')).top-rect(pool).bottom,
      back:rect(root.querySelector('.section-row > button')),heading:rect(root.querySelector('.section-row > h2')),
      overflow:root.scrollWidth-root.clientWidth,
     };
    });
    const tolerance=2.1;
    assert.ok(geometry.groups.length>=2,`Missing exam skills ${width} ${theme}`);
    assert.ok(Math.abs(geometry.overviewToHeading-16)<=tolerance,`Overview-to-heading ${width} ${theme}: ${geometry.overviewToHeading}`);
    for(const group of geometry.groups){
     assert.ok(Math.abs(group.titleToCard-16)<=tolerance,`Heading-to-card ${width} ${theme}: ${JSON.stringify(group)}`);
     for(const gap of group.cardGaps)assert.ok(Math.abs(gap-12)<=tolerance,`Inconsistent card gap ${width} ${theme}: ${gap}`);
     if(width<=720&&group.bottomPaddings.length>1){
      assert.ok(Math.max(...group.bottomPaddings)-Math.min(...group.bottomPaddings)<=tolerance,`Card bottom padding ${width} ${theme}: ${JSON.stringify(group)}`);
     }
    }
    if(geometry.heading.bottom>geometry.back.top&&geometry.heading.top<geometry.back.bottom){
     const center=r=>r.top+r.height/2;
     assert.ok(Math.abs(center(geometry.heading)-center(geometry.back))<3,`Back button not centered ${width} ${theme}`);
    }
    assert.ok(geometry.overflow<=2,`Exam horizontal overflow ${width} ${theme}: ${geometry.overflow}`);
    if(width===390&&theme==='light')await page.screenshot({path:'/tmp/hsk-exam-spacing-390.png',fullPage:true});
   }
   assert.deepEqual(errors,[],`JS errors ${width}`);
   await page.close();
  }
  console.log('PASS HSK exam spacing: 320/390/1440 light+dark; overview/section/card gaps, card padding and back button alignment.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
