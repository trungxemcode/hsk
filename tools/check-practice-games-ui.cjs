/* Real browser regression for two practice games. Does not mutate existing learning/SRS records. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
(async()=>{
const root=process.cwd();
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');
 res.end(fs.readFileSync(file));
});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({executablePath:process.env.CHROME_EXECUTABLE});
try{
for(const width of [320,390,1440]){
 const page=await browser.newPage({viewport:{width,height:844},isMobile:width<721,hasTouch:width<721,serviceWorkers:'block'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('hsk-studio-target-v1:guest','3'));
 await page.route('https://**/*',r=>r.abort());
 await page.route('**/account-config.json',r=>r.fulfill({contentType:'application/json',body:'{"enabled":false}'}));
 await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');
 await page.waitForFunction(()=>window.HSKLessons&&window.HSKPracticeGames&&window.HSKStudio,{timeout:25000});
 const coverage=await page.evaluate(()=>[1,2,3,4,5,6].map(level=>({level,triples:HSKPracticeGamesCore.triples(words,level,10).length,sentences:HSKPracticeGamesCore.sentences(words,level,10).length})));
 assert.ok(coverage.every(x=>x.triples>=5&&x.sentences>=5),'each HSK level should have playable rounds: '+JSON.stringify(coverage));
 if(width===390)console.log('DATA COVERAGE '+JSON.stringify(coverage));
 const before=await page.evaluate(()=>['hsk-flashcards-progress-v1','hsk-course-lessons-v1'].map(k=>localStorage.getItem(k)));
 for(const theme of ['light','dark']){
  await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;HSKStudio.navigate('practice')},theme);
  assert.equal(await page.locator('#studioPractice [data-studio-go="match-game"]').count(),1);
  assert.equal(await page.locator('#studioPractice [data-studio-go="sentence-game"]').count(),1);
  await page.locator('#studioPractice [data-studio-go="match-game"]').evaluate(el=>el.click());
  await page.waitForFunction(()=>document.querySelector('#matchGamePanel .pg-match-grid .pg-match-tile'));
  assert.equal(await page.locator('#matchGamePanel .pg-select').first().inputValue(),'3');
  assert.equal(await page.locator('#matchGamePanel .pg-match-column').count(),3);
  assert.equal(await page.locator('#matchGamePanel .pg-match-column[data-column=han] .pg-match-tile').count(),10);
  let firstId=await page.locator('#matchGamePanel .pg-match-column[data-column=han] .pg-match-tile').first().getAttribute('data-match-id');
  for(const kind of ['han','pin','mean'])await page.locator('#matchGamePanel .pg-match-column[data-column='+kind+'] .pg-match-tile[data-match-id="'+firstId+'"]').evaluate(el=>el.click());
  await page.locator('#matchGamePanel .pg-primary').click();
  assert.match(await page.locator('#matchGamePanel .pg-message').innerText(),/1\/10 bộ từ/);
  for(const kind of ['han','pin','mean'])assert.equal(await page.locator('#matchGamePanel .pg-match-column[data-column='+kind+'] .pg-match-tile[data-match-id="'+firstId+'"]').isDisabled(),true);
  await page.locator('#matchGamePanel .pg-toggle').first().click();
  assert.equal(await page.locator('#matchGamePanel .pg-toggle').first().getAttribute('aria-pressed'),'true');
  await page.locator('#matchGamePanel .pg-back').click();
  await page.locator('#studioPractice [data-studio-go="sentence-game"]').evaluate(el=>el.click());
  await page.waitForFunction(()=>document.querySelector('#sentenceGamePanel .pg-token-pool .pg-token'));
  assert.equal(await page.locator('#sentenceGamePanel .pg-select').first().inputValue(),'3');
  const pool=page.locator('#sentenceGamePanel .pg-token-pool .pg-token');
  const tiles=await pool.count();assert.ok(tiles>=4&&tiles<=15,'verified sentence length');
  await page.locator('#sentenceGamePanel .pg-visibility .pg-toggle').first().click();
  assert.equal(await page.locator('#sentenceGamePanel .pg-pinyin').count(),0);
  await page.locator('#sentenceGamePanel .pg-visibility .pg-toggle').first().click();
  for(let i=0;i<tiles;i++)await page.locator('#sentenceGamePanel .pg-token-pool .pg-token[data-token="'+i+'"]').evaluate(el=>el.click());
  assert.equal(await page.locator('#sentenceGamePanel .pg-answer-zone .pg-token').count(),tiles);
  await page.locator('#sentenceGamePanel .pg-primary').click();
  assert.match(await page.locator('#sentenceGamePanel .pg-message').innerText(),/Chính xác/);
  await page.locator('#sentenceGamePanel .pg-primary').click();
  assert.match(await page.locator('#sentenceGamePanel .pg-summary span').innerText(),/Câu 2/);
  assert.equal(await page.locator('#sentenceGamePanel .pg-answer-zone .pg-token').count(),0);
  const overflow=await page.evaluate(()=>{const panel=document.querySelector('#sentenceGamePanel');return panel.scrollWidth>panel.clientWidth+2;});
  assert.equal(overflow,false,'no horizontal overflow');
 }
 const after=await page.evaluate(()=>['hsk-flashcards-progress-v1','hsk-course-lessons-v1'].map(k=>localStorage.getItem(k)));
 assert.deepEqual(after,before);
 assert.deepEqual(errors,[]);
 console.log('PASS practice games '+width+'px both themes: choose/confirm/hide, reorder/grade/next, no SRS writes');
 await page.close();
}
}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
