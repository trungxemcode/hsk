/* Real /hsk/ URL base, compressed/fallback data paths and relocated worker imports. */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
(async()=>{
 const root=process.cwd(),server=http.createServer((q,r)=>{
  const relative=new URL(q.url,'http://local').pathname.replace(/^\/hsk\//,''),file=path.resolve(root,relative);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){r.writeHead(404);return r.end();}
  r.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'})[path.extname(file)]||'application/octet-stream');r.end(fs.readFileSync(file));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
 try{for(const mode of ['gzip','no-api','broken-gzip']){
  const context=await browser.newContext({viewport:{width:390,height:900},serviceWorkers:'block'}),page=await context.newPage(),errors=[],missing=[],scripts=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()===404)missing.push(r.url());});page.on('request',r=>{if(r.resourceType()==='script')scripts.push(new URL(r.url()).pathname);});
  await page.route('https://**/*',r=>r.abort());await page.route('**/account-config.json',r=>r.fulfill({contentType:'application/json',body:'{"enabled":false}'}));
  if(mode==='no-api')await page.addInitScript(()=>{window.DecompressionStream=undefined;});
  if(mode==='broken-gzip')await page.route('**/content/data/*.js.gz',r=>r.fulfill({contentType:'application/octet-stream',body:'invalid gzip'}));
  await page.goto('http://127.0.0.1:'+server.address().port+'/hsk/index.html');
  await page.waitForFunction(()=>window.HSKStudio&&window.HSKLessons&&document.body.dataset.studioHub==='home',null,{timeout:60000});
  const state=await page.evaluate(()=>({count:words.length,checked:!!words[0].practice,fold:fold('Đẹp'),sense:splitSenses({mean:'Học (học tập)',hv:'học'}),globals:['HSKAccountCore','HSKStudySyncCore','HSKBackupCore','HSKSpeech','HSKOpenDictionaryCore','HSKExam','HSKPlacement'].every(k=>!!window[k])}));
  assert.equal(state.count,5011);assert.equal(state.checked,true);assert.equal(state.fold,'dep');assert.deepEqual(state.sense,['học tập']);assert.equal(state.globals,true);
  assert.equal(scripts.includes('/hsk/content/data/words.js'),mode!=='gzip','Plain JS fallback must run only when gzip is unavailable/broken');
  const app=scripts.indexOf('/hsk/app.js');for(const name of ['src/utils/text.js','src/utils/format.js','src/modules/dictionary/search-core.js','src/ui/dictionary-relations.js'])assert.ok(scripts.indexOf('/hsk/'+name)>=0&&scripts.indexOf('/hsk/'+name)<app,'Helper must load before app: '+name);
  await page.evaluate(()=>window.HSKStudio.navigate('search'));await page.locator('#searchInput').fill('喜欢');await page.locator('#searchInput').press('Enter');
  await page.waitForFunction(()=>document.querySelector('#searchResults').textContent.includes('喜欢'));
  const storage=await page.evaluate(()=>localStorage.getItem('hsk-flashcards-progress-v1'));
  await page.evaluate(()=>window.HSKStudio.navigate('compare'));await page.evaluate(()=>window.HSKStudio.navigate('home'));
  assert.equal(await page.evaluate(()=>localStorage.getItem('hsk-flashcards-progress-v1')),storage,'Navigation/search must not change learning progress');
  if(mode==='gzip'){
   const ready=await page.evaluate(()=>new Promise((resolve,reject)=>{const w=new Worker('./handwriting-worker.js'),timer=setTimeout(()=>{w.terminate();reject(Error('Worker ready timed out'));},60000);w.onerror=e=>{clearTimeout(timer);w.terminate();reject(Error(e.message));};w.onmessage=e=>{clearTimeout(timer);w.terminate();e.data.type==='ready'?resolve(e.data.supported):reject(Error(e.data.message));};}));
   assert.ok(ready>1000,'Actual handwriting worker must load relocated imports and original data');
  }
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);console.log('PASS module loading '+mode+': /hsk/, helpers before app,5011 words, real search/compare, progress unchanged, no404/JS errors'+(mode==='gzip'?', handwriting worker ready':''));
  await context.close();
 }}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
