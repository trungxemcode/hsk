/* Mobile + desktop integration: choose multiple/all practice modes; source links + picture icons. */
const {chromium}=require('playwright'),fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=process.cwd(),server=http.createServer((req,res)=>{
  const f=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);
  if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
 try{
 for(const width of [320,390,1440]){
  const page=await browser.newPage({viewport:{width,height:900},isMobile:width<721,hasTouch:width<721,serviceWorkers:'block'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route('https://**/*',r=>r.abort());
  await page.route('**/account-config.json',r=>r.fulfill({contentType:'application/json',body:'{"enabled":false}'}));
  await page.addInitScript(()=>localStorage.setItem('hsk-studio-target-v1:guest','3'));
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');
  await page.waitForFunction(()=>!!window.HSKPracticeSelection&&!!window.HSKStudy4&&!!window.HSKStudio&&!!window.HSKLessons,{timeout:25000});
  for(const theme of ['light','dark']){
   await page.evaluate(x=>{document.documentElement.dataset.theme=x;HSKStudio.navigate('practice')},theme);
   const picker=page.locator('#practiceModePicker');
   await picker.waitFor({state:'visible'});
   const disclosure=picker.locator('#practiceModeDisclosure');
   if(theme==='light'){
    assert.equal(await disclosure.evaluate(el=>el.open),false,'default mode list must be collapsed');
   }
   assert.equal(await page.locator('#studioReview').isVisible(),false,'legacy SRS mode list removed from view');
   assert.equal(await page.locator('#practiceGroup').isVisible(),false,'legacy practice list removed from view');
   assert.equal(await page.locator('.ps-extras').count(),0,'no redundant direct-mode section');
   await disclosure.locator('summary').click();
   assert.equal(await disclosure.evaluate(el=>el.open),true);
   const amount=await picker.locator('.ps-option input').count();assert.equal(amount,12);
   if(width<721){
    const layout=await picker.locator('.ps-options').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);
    assert.equal(layout,2,'mobile mode choices form a compact two-column grid');
   }
   assert.match(await page.locator('#practiceModeLevel').innerText(),/HSK 3/);
   assert.equal(await picker.locator('.ps-icon svg').count(),amount);
   for(const card of await page.locator('#studioPractice .hub-card').all()){
    if(!(await card.locator('.hub-content').count()))continue;
    assert.equal(await card.locator('.ps-hub-icon svg').count(),1,'picture icon in card');
    const centers=await card.locator('.ps-hub-icon').first().evaluate(el=>{
     const a=el.getBoundingClientRect(),b=el.querySelector('svg').getBoundingClientRect();
     return {dx:Math.abs(a.x+a.width/2-b.x-b.width/2),dy:Math.abs(a.y+a.height/2-b.y-b.height/2)};
    });
    assert.ok(centers.dx<1&&centers.dy<1,'centered pictogram');
   }
   await picker.locator('#practiceClearAll').click();
   assert.equal(await picker.locator('.ps-option input:checked').count(),0);
   assert.equal(await picker.locator('#practiceStartModes').isDisabled(),true);
   await picker.locator('[data-practice-option=match-game] input').check();
   await picker.locator('[data-practice-option=sentence-game] input').check();
   assert.match(await picker.locator('#practiceSelectedCount').innerText(),/2 \/ 12/);
   await disclosure.locator('summary').click();
   assert.equal(await disclosure.evaluate(el=>el.open),false,'can collapse after choosing');
   assert.equal(await picker.locator('#practiceStartModes').isVisible(),false,'start hidden with its collapsed group');await disclosure.locator('summary').click();
   await picker.locator('#practiceStartModes').click();
   assert.equal(await page.locator('#matchGamePanel').isVisible(),true);
   assert.match(await page.locator('#practiceSessionStep').innerText(),/1 \/ 2/);
   await page.locator('#practiceSessionNext').click();
   assert.equal(await page.locator('#sentenceGamePanel').isVisible(),true);
   assert.match(await page.locator('#practiceSessionStep').innerText(),/2 \/ 2/);
   await page.locator('#practiceSessionNext').click();
   assert.equal(await page.locator('#practiceModePicker').isVisible(),true);
   assert.equal(await page.locator('#practiceSessionBar').isVisible(),false);
   await disclosure.locator('summary').click();
   await picker.locator('#practiceSelectAll').click();
   assert.equal(await picker.locator('.ps-option input:checked').count(),amount);
   await picker.locator('#practiceClearAll').click();
   await picker.locator('[data-practice-option=study4] input').check();
   assert.equal(await picker.locator('.ps-option input:checked').count(),1);
   await disclosure.locator('summary').click();
   assert.equal(await disclosure.evaluate(el=>el.open),false);
   await disclosure.locator('summary').click();await picker.locator('#practiceStartModes').click();
   assert.equal(await page.locator('#study4PracticePanel').isVisible(),true);
   assert.equal(await page.locator('#study4Level').inputValue(),'3');
   const url=await page.locator('.s4-visit').getAttribute('href');
   assert.equal(url,'https://study4.com/tests/5048/hsk-3-practice-test-34/');
   assert.equal(await page.locator('.s4-visit').getAttribute('target'),'_blank');
   await page.locator('[data-s4-skill=listening]').click();
   assert.match(await page.locator('.s4-test-card').innerText(),/40 câu Listening/);
   assert.match(await page.locator('.s4-credit').innerText(),/Nguồn: Study4.com/);
   for(let level=1;level<=6;level++){
    await page.locator('#study4Level').selectOption(String(level));
    const link=await page.locator('.s4-visit').getAttribute('href');
    assert.ok(link.startsWith('https://study4.com/tests/'),'valid source URL');
   }
   await page.locator('#practiceSessionStop').click();
   await page.evaluate(()=>HSKStudio.navigate('practice'));
   assert.equal(await disclosure.evaluate(el=>el.open),false,'single mode starts from collapsed picker');
   assert.equal(await picker.locator('#practiceStartModes').isVisible(),false);
   assert.equal(await page.locator('#studioReview').isVisible(),false);
   assert.equal(await page.locator('#practiceGroup').isVisible(),false);
   assert.equal(await page.locator('#practiceSessionBar').isVisible(),false);
   // Ôn has identical scoped selection; expanding either group closes its sibling.
   const review=page.locator('#reviewModeDisclosure');assert.equal(await review.evaluate(d=>d.open),false);
   assert.equal(await page.locator('#reviewStartModes').isVisible(),false);
   await disclosure.locator('summary').click();await review.locator('summary').click();
   await page.waitForFunction(()=>!document.querySelector('#practiceModeDisclosure').open);
   assert.equal(await page.locator('#reviewModeOptions input').count(),2);
   const storedPractice=await picker.locator('input:checked').count();
   await page.locator('#reviewClearAll').click();assert.equal(await page.locator('#reviewStartModes').isDisabled(),true);
   await page.locator('#reviewSelectAll').click();assert.equal(await page.locator('#reviewModeOptions input:checked').count(),2);
   assert.equal(await picker.locator('input:checked').count(),storedPractice,'review selection must not alter practice');
   const records=await page.evaluate(()=>localStorage.getItem('hsk-flashcards-progress-v1'));
   await page.locator('#reviewStartModes').click();assert.equal(await page.locator('#srsPanel').isVisible(),true);
   assert.match(await page.locator('#practiceSessionStep').innerText(),/Lượt ôn 1 \/ 2/);
   await page.locator('#practiceSessionNext').click();assert.equal(await page.locator('#mistakesPanel').isVisible(),true);
   await page.locator('#practiceSessionNext').click();
   assert.equal(await page.evaluate(()=>localStorage.getItem('hsk-flashcards-progress-v1')),records,'opening review does not write progress');
   assert.equal(await review.evaluate(d=>d.open),false);assert.equal(await disclosure.evaluate(d=>d.open),false);
   // The start action belongs after its options and scrolls with content, not over tiles.
   await disclosure.locator('summary').click();
   const geometry=await picker.evaluate(n=>{const row=n.querySelector('.ps-start-row'),options=n.querySelector('.ps-options'),r=row.getBoundingClientRect();return {position:getComputedStyle(row).position,top:r.top,optionsBottom:options.getBoundingClientRect().bottom};});
   assert.equal(geometry.position,'static');assert.ok(geometry.top>=geometry.optionsBottom);
   if(width<721)await page.setViewportSize({width,height:560});
   await page.locator('#practiceStartModes').scrollIntoViewIfNeeded();
   const beforeY=(await page.locator('#practiceStartModes').boundingBox()).y;
   await page.evaluate(()=>{const n=document.querySelector('.workspace');n.scrollTo({top:n.scrollTop-80,behavior:'instant'});});
   const afterY=(await page.locator('#practiceStartModes').boundingBox()).y;
   if(width<721)assert.ok(afterY>beforeY+30,'start button must move with content scroll');
   await page.screenshot({path:'/tmp/practice-picker-'+width+'-'+theme+'.png'});
   if(width<721)await page.setViewportSize({width,height:900});
   await disclosure.locator('summary').click();
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
   assert.equal(overflow,false,'no viewport overflow');
  }
  assert.deepEqual(errors,[]);
  console.log('PASS practice mode chooser '+width+'px: select all/multiple, sequence, icon centering, Study4 listening links, dark/light');
  await page.close();
 }
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
