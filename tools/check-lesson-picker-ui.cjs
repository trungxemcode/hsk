// Regression: mobile lesson sections remain discoverable and never overlay expanding content.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
(async()=>{
 const root=process.cwd(),server=http.createServer((q,r)=>{const f=path.resolve(root,'.'+new URL(q.url,'http://local').pathname);if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){r.writeHead(404);return r.end();}r.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'})[path.extname(f)]||'application/octet-stream');r.end(fs.readFileSync(f));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const b=await chromium.launch({executablePath:process.env.CHROME_EXECUTABLE});
 try{for(const width of [320,390,430,1440])for(const theme of ['light','dark']){
  const p=await b.newPage({viewport:{width,height:844},hasTouch:width<721,isMobile:width<721,serviceWorkers:'block'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.route('https://**/*',r=>r.abort());await p.route('**/account-config.json',r=>r.fulfill({contentType:'application/json',body:'{"enabled":false}'}));
  await p.goto('http://127.0.0.1:'+server.address().port+'/index.html');await p.waitForFunction(()=>window.HSKMobileUX&&window.HSKLessonNav);
  await p.evaluate(async theme=>{document.documentElement.dataset.theme=theme;HSKStudio.navigate('lessons');history.replaceState(null,'','#lesson/standard-3-01');await HSKLessonNav.open();},theme);
  const picker=p.getByLabel('Chọn mục bài học',{exact:true});await p.locator('.lesson-section-nav').waitFor();
  assert.equal(await picker.isVisible(),width<721);assert.deepEqual(await picker.locator('option').evaluateAll(ns=>ns.map(n=>n.value)),['overview','reading','grammar','practice']);
  const before=await p.evaluate(()=>localStorage.getItem('hsk-course-lessons-v1'));
  for(const [id,label] of [['overview','Từ vựng'],['reading','Đọc & hội thoại'],['grammar','Ngữ pháp'],['practice','Luyện tập']]){
   if(width<721)await picker.selectOption(id);else await p.locator('.lesson-section-nav').getByRole('button',{name:label,exact:true}).click();
   assert.equal(await p.locator('.lesson-section:not([hidden])').getAttribute('data-lesson-section'),id);assert.equal(await picker.inputValue(),id);
   assert.equal(await p.locator('.workspace').evaluate(n=>n.scrollWidth>n.clientWidth+1),false);
  }
  assert.equal(await p.evaluate(()=>localStorage.getItem('hsk-course-lessons-v1')),before,'section navigation must not award mastery');
  if(width<721){
   await picker.selectOption('overview');await p.locator('.workspace').evaluate(n=>n.scrollTop=0);
   const details=p.locator('.mobile-mastery-details');await details.evaluate(n=>n.open=false);const closed=await p.locator('.lesson-section-nav').boundingBox();
   await details.locator('summary').click();const opened=await p.locator('.lesson-section-nav').boundingBox();assert.ok(opened.y>closed.y+10,'expansion must push navigation down');
   assert.equal(await p.locator('.lesson-section-nav').evaluate(n=>getComputedStyle(n).position),'static');
   await p.locator('.workspace').evaluate(n=>n.scrollTop=0);const a=await p.locator('.lesson-section-nav').boundingBox();await p.locator('.workspace').evaluate(n=>n.scrollTop=250);const z=await p.locator('.lesson-section-nav').boundingBox();assert.ok(z.y<a.y-100,'picker must scroll with content');
   await picker.selectOption('reading');await p.locator('.workspace').evaluate(n=>n.scrollTop=0);await p.screenshot({path:'/tmp/lesson-picker-'+width+'-'+theme+'.png'});
  }
  assert.deepEqual(errors,[]);await p.close();
 }console.log('PASS lesson picker: 4 reachable sections, native phone dropdown, expanding mastery/scroll flow, unchanged progress, desktop buttons and 320/390/430/1440 light/dark.');}finally{await b.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
