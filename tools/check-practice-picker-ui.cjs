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
   const amount=await picker.locator('.ps-option input').count();assert.equal(amount,12);
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
   await picker.locator('#practiceStartModes').click();
   assert.equal(await page.locator('#matchGamePanel').isVisible(),true);
   assert.match(await page.locator('#practiceSessionStep').innerText(),/1 \/ 2/);
   await page.locator('#practiceSessionNext').click();
   assert.equal(await page.locator('#sentenceGamePanel').isVisible(),true);
   assert.match(await page.locator('#practiceSessionStep').innerText(),/2 \/ 2/);
   await page.locator('#practiceSessionNext').click();
   assert.equal(await page.locator('#practiceModePicker').isVisible(),true);
   assert.equal(await page.locator('#practiceSessionBar').isVisible(),false);
   await picker.locator('#practiceSelectAll').click();
   assert.equal(await picker.locator('.ps-option input:checked').count(),amount);
   await picker.locator('#practiceClearAll').click();
   await picker.locator('[data-practice-option=study4] input').check();
   await picker.locator('#practiceStartModes').click();
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
   assert.equal(await page.locator('#practiceSessionBar').isVisible(),false);
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
   assert.equal(overflow,false,'no viewport overflow');
  }
  assert.deepEqual(errors,[]);
  console.log('PASS practice mode chooser '+width+'px: select all/multiple, sequence, icon centering, Study4 listening links, dark/light');
  await page.close();
 }
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
