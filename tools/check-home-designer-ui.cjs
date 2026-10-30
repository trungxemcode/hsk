/* Real app, real local writer, temporary checkout. No user project/data is modified. */
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict'),{spawn,execFileSync}=require('node:child_process'),{chromium}=require('playwright');
(async()=>{
 const root=process.cwd(),temp=fs.mkdtempSync(path.join(os.tmpdir(),'hsk-designer-')),fixture=path.join(temp,'project');let server,browser,editorPage;
 try{
  execFileSync('python3',['-c',"import shutil,os,sys;shutil.copytree(sys.argv[1],sys.argv[2],copy_function=os.link,ignore=shutil.ignore_patterns('.git','__pycache__','node_modules'))",root,fixture]);
  const originalIndex=fs.readFileSync(path.join(fixture,'index.html'),'utf8');
  server=spawn('python3',[path.join(root,'tools/serve-home-designer.py'),'--root',fixture,'--port','0'],{stdio:['ignore','pipe','pipe']});
  const url=await new Promise((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(Error('Local designer did not start')),15000);server.stdout.on('data',b=>{output+=b;const m=output.match(/http:\/\/127\.0\.0\.1:\d+/);if(m){clearTimeout(timer);resolve(m[0]);}});server.once('exit',code=>{clearTimeout(timer);reject(Error('Local server exited '+code));});server.stderr.on('data',b=>{output+=b;});});
  browser=await chromium.launch({executablePath:process.env.CHROME_EXECUTABLE});
  const page=await browser.newPage({viewport:{width:1440,height:1000},serviceWorkers:'block'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  editorPage=page;
  const ordinary=await browser.newPage({viewport:{width:1440,height:900},serviceWorkers:'block'});
  await ordinary.goto(url+'/index.html',{waitUntil:'domcontentloaded'});await ordinary.waitForFunction(()=>window.HSKLessons&&document.querySelector('#homeDailyWord h3'));
  const font=()=>ordinary.locator('#homeDailyWord h3').evaluate(n=>getComputedStyle(n).fontSize);
  const baseline=await font();
  await page.goto(url+'/tools/home-designer/editor.html',{waitUntil:'domcontentloaded'});
  let frame=await (await page.locator('#canvas').elementHandle()).contentFrame();
  await frame.locator('#hsk-designer-preview-styles').waitFor({state:'attached'});
  await page.waitForFunction(()=>document.getElementById('status').textContent.includes('Sẵn sàng'));
  await page.locator('#zoom-toggle').click();assert.equal(await page.locator('#canvas').evaluate(n=>Math.round(n.getBoundingClientRect().width)),1440);await page.locator('#zoom-toggle').click();
  // Selecting a live button must not execute its existing handler.
  const wasOpen=await frame.locator('#planSetup').evaluate(n=>n.open);
  await frame.locator('#planGoSetup').click();
  assert.equal(await page.locator('#selected-name').textContent(),'Nút Lập kế hoạch học');
  assert.equal(await frame.locator('#planSetup').evaluate(n=>n.open),wasOpen);
  assert.equal(await frame.locator('body').getAttribute('data-studio-hub'),'home');
  await page.locator('#find').fill('Tiêu đề từ vựng');await page.locator('.part[data-key="word-heading"]').click();
  await page.locator('#field-fontSize').fill('28');await page.locator('#field-fontSize').press('Tab');
  await frame.waitForFunction(()=>getComputedStyle(document.querySelector('#homeDailyWord h3')).fontSize==='28px');
  await page.locator('#undo').click();assert.equal(await frame.locator('#homeDailyWord h3').evaluate(n=>getComputedStyle(n).fontSize),baseline);
  await page.locator('#redo').click();assert.equal(await frame.locator('#homeDailyWord h3').evaluate(n=>getComputedStyle(n).fontSize),'28px');
  await ordinary.reload({waitUntil:'domcontentloaded'});await ordinary.waitForFunction(()=>document.querySelector('#homeDailyWord h3'));assert.equal(await font(),baseline,'draft must not change ordinary app');
  await page.locator('#mobile').click();await frame.waitForFunction(()=>innerWidth===390&&document.body.classList.contains('mobile-ux'));
  assert.equal(await page.locator('#field-fontSize').inputValue(),'');
  await page.locator('#field-fontSize').fill('20');await page.waitForTimeout(250);assert.equal(await page.locator('#field-fontSize').inputValue(),'20','viewport refresh must not overwrite an active edit');await page.locator('#field-fontSize').press('Tab');
  await frame.waitForFunction(()=>getComputedStyle(document.querySelector('#homeDailyWord h3')).fontSize==='20px');
  await page.locator('#desktop').click();await frame.waitForFunction(()=>innerWidth===1440&&!document.body.classList.contains('mobile-ux'));
  assert.equal(await frame.locator('#homeDailyWord h3').evaluate(n=>getComputedStyle(n).fontSize),'28px');
  const beforeOrder=await frame.locator('#studioHome').evaluate(n=>[...n.children].map(c=>c.id||c.className));
  await page.locator('.layer[data-key="assessment"] button').click();await page.locator('#move-up').click();
  await frame.waitForFunction(()=>document.querySelector('#placementEntry').getBoundingClientRect().y<document.querySelector('#homeDailyWord').getBoundingClientRect().y);
  assert.deepEqual(await frame.locator('#studioHome').evaluate(n=>[...n.children].map(c=>c.id||c.className)),beforeOrder,'reordering must not remount live app controls');
  await page.reload({waitUntil:'domcontentloaded'});frame=await (await page.locator('#canvas').elementHandle()).contentFrame();await page.waitForFunction(()=>document.getElementById('status').textContent.includes('Sẵn sàng'));
  assert.equal(await frame.locator('#homeDailyWord h3').evaluate(n=>getComputedStyle(n).fontSize),'28px','draft reload');
  await frame.waitForFunction(()=>document.querySelector('#placementEntry').getBoundingClientRect().y<document.querySelector('#homeDailyWord').getBoundingClientRect().y);
  // Actual drag on the named layer restores word above assessment.
  await page.locator('.layer[data-key="daily-word"]').dragTo(page.locator('.layer[data-key="assessment"]'));
  await frame.waitForFunction(()=>document.querySelector('#homeDailyWord').getBoundingClientRect().y<document.querySelector('#placementEntry').getBoundingClientRect().y);
  await page.locator('#demo').click();await frame.locator('#planToday').waitFor({state:'visible'});
  await page.locator('#preview').click();await frame.locator('.hero-button').click();await frame.locator('#lessonsPanel').waitFor({state:'visible'});
  await page.locator('#preview').click();await page.waitForFunction(()=>document.getElementById('page-select').value==='lesson-detail'&&document.getElementById('status').textContent.includes('Sẵn sàng'));await frame.locator('#lessonsPanel').waitFor({state:'visible'});await page.locator('#page-select').selectOption('home');await frame.locator('#studioHome').waitFor({state:'visible'});
  await page.locator('#find').fill('Tiêu đề từ vựng');await page.locator('.part[data-key="word-heading"]').click();
  await page.screenshot({path:'/tmp/home-designer-desktop.png',fullPage:true});
  const download=await Promise.all([page.waitForEvent('download'),page.locator('#export').click()]).then(r=>r[0]);const file=path.join(temp,'draft.json');await download.saveAs(file);const exported=JSON.parse(fs.readFileSync(file,'utf8'));assert.equal(exported.pages.home.styles.desktop['word-heading'].fontSize,28);assert.equal(exported.pages.home.styles.mobile['word-heading'].fontSize,20);
  await page.locator('#file').setInputFiles({name:'broken.json',mimeType:'application/json',buffer:Buffer.from('{"schema":1,"scripts":"bad"}')});await page.waitForFunction(()=>document.getElementById('status').textContent.includes('Không nhập được'));assert.equal(await frame.locator('#homeDailyWord h3').evaluate(n=>getComputedStyle(n).fontSize),'28px');
  await page.locator('#file').setInputFiles(file);
  await page.locator('#apply').click();await page.locator('#confirm button[value="ok"]').click();await page.waitForFunction(()=>document.getElementById('status').textContent.includes('Đã lưu vào dự án'));
  const appliedIndex=fs.readFileSync(path.join(fixture,'index.html'),'utf8');assert.equal((appliedIndex.match(/href="\.\/home-design\.css"/g)||[]).length,1);assert.equal(appliedIndex.replace(/\n?<!-- HSK HOME DESIGN START -->[\s\S]*?<!-- HSK HOME DESIGN END -->\n?/,''),originalIndex);
  await ordinary.reload({waitUntil:'domcontentloaded'});await ordinary.waitForFunction(()=>document.querySelector('#homeDailyWord h3'));assert.equal(await font(),'28px','applied CSS must work in the ordinary app');
  await ordinary.setViewportSize({width:390,height:844});await ordinary.waitForFunction(()=>document.body.classList.contains('mobile-ux'));assert.equal(await font(),'20px','mobile export');
  const landscape=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true,serviceWorkers:'block'});await landscape.goto(url+'/index.html',{waitUntil:'domcontentloaded'});await landscape.waitForFunction(()=>document.body.classList.contains('mobile-ux')&&document.querySelector('#homeDailyWord h3'));assert.equal(await landscape.locator('#homeDailyWord h3').evaluate(n=>getComputedStyle(n).fontSize),'20px','phone landscape follows app mobile rules');await landscape.close();
  await page.locator('#reset').click();await page.locator('#confirm button[value="ok"]').click();await frame.waitForFunction(()=>getComputedStyle(document.querySelector('#homeDailyWord h3')).fontSize!=='28px');assert.equal(await frame.locator('#homeDailyWord h3').evaluate(n=>getComputedStyle(n).fontSize),baseline,'reset preview ignores previously applied CSS');
  await page.locator('#undo').click();assert.equal(await frame.locator('#homeDailyWord h3').evaluate(n=>getComputedStyle(n).fontSize),'28px');
  await page.locator('#mobile').click();await frame.waitForFunction(()=>innerWidth===390);await page.screenshot({path:'/tmp/home-designer-mobile.png',fullPage:true});
  assert.deepEqual(errors,[]);console.log('PASS Home Designer: live selection without activation, independent PC/mobile edits, undo/redo, reload, real drag, stable DOM, preview navigation, export/import validation, actual apply and reset; ordinary app unchanged until apply.');
 }catch(e){try{await editorPage?.screenshot({path:'/tmp/home-designer-failure.png',fullPage:true});}catch{}throw e;}finally{await browser?.close();server?.kill('SIGTERM');fs.rmSync(temp,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1});
