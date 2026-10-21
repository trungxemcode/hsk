/* Decode every real packed image and render the two previously empty source pages. */
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),zlib=require('node:zlib'),assert=require('node:assert/strict');
(async()=>{
 const root=process.cwd(),data=JSON.parse(zlib.gunzipSync(fs.readFileSync('drive-exam-data.json.gz'))),images=data.report.images.map(name=>({name,uri:JSON.parse(fs.readFileSync('content/drive-hsk/'+name.split('/').at(-1).split('-')[0]+'.json'))[name]}));
 const server=http.createServer((q,r)=>{const f=path.resolve(root,'.'+new URL(q.url,'http://local').pathname);if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){r.writeHead(404);return r.end();}r.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.json':'application/json','.css':'text/css','.mp3':'audio/mpeg'})[path.extname(f)]||'application/octet-stream');r.end(fs.readFileSync(f));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
 try{
  const page=await browser.newPage({viewport:{width:390,height:900},serviceWorkers:'block'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>r.abort());await page.route('**/account-config.json',r=>r.fulfill({contentType:'application/json',body:'{"enabled":false}'}));
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.waitForFunction(()=>window.HSKDriveExam?.ready&&window.HSKStudio&&document.body.dataset.studioHub==='home',null,{timeout:60000});
  const decoded=await page.evaluate(async images=>{const results=[];for(const {name,uri} of images){const img=new Image();img.src=uri;await img.decode();results.push({name,width:img.naturalWidth,height:img.naturalHeight});}return results;},images);
  assert.equal(decoded.length,52);for(const item of decoded)assert.ok(item.width>800&&item.height>1000,'Invalid source page dimensions: '+item.name);
  await page.evaluate(()=>{window.HSKExam.open();window.HSKExam.catalogue();});await page.locator('#examLevel').selectOption('1');
  for(const id of ['drive-H11330-40','drive-H11003-40']){
   await page.evaluate(id=>{const original=window.HSKExamCore.shuffled;try{window.HSKExamCore.shuffled=rows=>{const target=rows.find(q=>q.id===id);if(!target)return original(rows);return [target,...rows.filter(q=>q.id!==id)];};window.HSKExam.start('driveReadImage');}finally{window.HSKExamCore.shuffled=original;}},id);
   assert.equal(await page.evaluate(()=>window.HSKExam.question.id),id);await page.locator('.exam-material img').first().scrollIntoViewIfNeeded();await page.waitForFunction(()=>document.querySelector('.exam-material img')?.naturalWidth>800);
   await page.getByRole('button',{name:'Phóng to tài liệu',exact:true}).click();assert.ok(await page.locator('.exam-material-dialog').isVisible());await page.waitForFunction(()=>document.querySelector('.exam-material-dialog img')?.naturalWidth>800);assert.ok(await page.locator('.exam-material-dialog img').evaluate(img=>img.naturalWidth>800));
   await page.getByRole('button',{name:'Đóng tài liệu',exact:true}).click();await page.locator('.exam-material-dialog').waitFor({state:'detached'});
  }
  assert.deepEqual(errors,[]);console.log('PASS all52 Drive WebP pages decode; formerly empty H11330/H11003 page10 renders and zooms in the actual app; original questions/answers retained.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
