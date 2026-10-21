/* Real browser: moved backup scripts, preview/apply, reload and account boundary. */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
(async()=>{
 const root=process.cwd(),server=http.createServer((q,r)=>{
  const file=path.resolve(root,'.'+new URL(q.url,'http://local').pathname);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){r.writeHead(404);return r.end();}
  r.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');r.end(fs.readFileSync(file));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
 try{for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'}),page=await context.newPage(),errors=[],missing=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()===404)missing.push(r.url());});
  await page.route('https://**/*',r=>r.abort());
  await page.route('**/account-config.json',r=>r.fulfill({contentType:'application/json',body:'{"enabled":false}'}));
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');
  await page.waitForFunction(()=>window.HSKStudio&&window.HSKAccountBackup&&window.HSKBackupCore);
  await page.evaluate(()=>{localStorage.setItem('hsk-flashcards-progress-v1',JSON.stringify({words:{existing:{status:'known',due:123}}}));window.HSKStudio.navigate('account');});
  const payload={version:1,storage:{'hsk-flashcards-progress-v1':JSON.stringify({words:{existing:{status:'unknown',due:999},newword:{status:'known',due:456}}})}};
  await page.locator('#accountRestore').click();
  await page.locator('#accountRestoreFile').setInputFiles({name:'hsk-progress-backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(payload))});
  const apply=page.getByRole('button',{name:'Nhập các mục còn thiếu',exact:true});
  await assert.doesNotReject(()=>apply.waitFor({state:'visible'}));
  await page.waitForFunction(()=>!document.querySelector('#accountRestoreDialog button:last-child').disabled);
  await Promise.all([page.waitForEvent('load'),apply.click()]);
  await page.waitForFunction(()=>window.HSKAccountBackup&&window.HSKStudio);
  const progress=await page.evaluate(()=>JSON.parse(localStorage.getItem('hsk-flashcards-progress-v1')).words);
  assert.equal(progress.existing.status,'known');assert.equal(progress.existing.due,123);assert.equal(progress.newword.due,456);
  const repeat=await page.evaluate(p=>window.HSKAccountBackup.prepare(p),payload);assert.equal(repeat.added,0);assert.equal(repeat.existing,2);
  const protectedImport=await page.evaluate(p=>{
   const preview=window.HSKAccountBackup.prepare(p),before=localStorage.getItem('hsk-flashcards-progress-v1');
   localStorage.setItem('hsk-account-meta-v1',JSON.stringify({uid:'different-account'}));
   try{window.HSKAccountBackup.apply(preview);return {blocked:false};}catch(e){return {blocked:/Tài khoản đã thay đổi/.test(e.message),unchanged:before===localStorage.getItem('hsk-flashcards-progress-v1')};}
  },payload);
  assert.deepEqual(protectedImport,{blocked:true,unchanged:true});assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
  console.log('PASS backup relocation '+width+'px: no 404, actual import/reload, duplicates preserved, account switch blocked');
  await context.close();
 }}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
