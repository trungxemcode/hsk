const {chromium}=require('playwright'),fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict'),fixture=require('./music-cloud-fixture.cjs');
(async()=>{
 const root=process.cwd(),server=http.createServer((q,r)=>{const f=path.resolve(root,'.'+new URL(q.url,'http://local').pathname);if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){r.writeHead(404);return r.end();}r.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(f)]||'application/octet-stream');r.end(fs.readFileSync(f));});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
 try{for(const width of [390,844,1440]){
  const page=await browser.newPage({viewport:{width,height:844},serviceWorkers:'block'}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://**/*',r=>r.abort());await page.route('**/account-config.json',r=>r.fulfill({json:{enabled:false}}));
  const tracks=await fixture(page);let requested=null,published=null;
  await page.route('https://music.example/api/admin/tracks/*/lyrics',r=>{published=r.request().postDataJSON();return r.fulfill({json:{saved:true}});});
  await page.route('**/translation-config.json',r=>r.fulfill({json:{enabled:true,endpoint:'https://ai.example/translate'}}));
  await page.route('https://ai.example/music-transcript',r=>{requested=r.request().postDataJSON();return r.fulfill({json:{version:1,status:'draft',reviewed:false,cues:[{start:0,end:1,text:'再见',uncertain:true,reason:'Hai lượt nhận diện khác nhau.'}]}});});
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.waitForFunction(()=>window.HSKStudio&&window.HSKMusic);
  await page.evaluate(()=>{HSKAccountDashboard={user:{uid:'listener',getIdToken:async()=> 'listener'}};HSKStudio.navigate('music-play');});await page.waitForFunction(()=>document.querySelectorAll('#musicCloudList .music-cloud-track').length===3);
  await page.locator('#musicCloudList .music-cloud-track').first().click();await page.locator('#musicMenuBtn').click();await page.locator('#musicTranscriptOpen').click();
  const dialog=page.locator('#musicTranscriptDialog');await dialog.waitFor({state:'visible'});await page.waitForFunction(()=>!document.querySelector('#musicTranscriptDialog button').disabled&&document.querySelector('#musicTranscriptDialog video').readyState>=1);
  await dialog.getByRole('button',{name:'Tạo script',exact:true}).click();await page.locator('#musicTranscriptRows fieldset').waitFor();
  assert.equal(requested.media.mimeType,'audio/mp4');assert.ok(requested.media.data.length>100);assert.equal(requested.reference,'');
  assert.equal(await dialog.getByRole('button',{name:'Xuất bản vào kho chung'}).isVisible(),false);
  await dialog.getByRole('button',{name:'Lưu script riêng'}).click();await page.waitForFunction(()=>HSKMusicTranscript.read(document.querySelector('#musicCloudList .music-cloud-track').dataset.trackId)?.value.status==='draft');
  const field=dialog.locator('fieldset');await field.locator('input[type=checkbox]').check();await field.locator('textarea').fill('明天见');assert.equal(await field.locator('input[type=checkbox]').isChecked(),false,'editing clears manual review');
  await field.locator('input[type=checkbox]').check();await dialog.getByRole('button',{name:'Lưu script riêng'}).click();
  await page.waitForFunction(()=>document.querySelector('#musicTranscriptStatus').textContent.includes('đã duyệt'));
  assert.ok(await dialog.evaluate(n=>n.scrollWidth<=n.clientWidth+1),'dialog fits viewport');
  await dialog.getByRole('button',{name:'Đóng',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#musicTimedStatus').textContent.includes('Script riêng'));
  assert.equal(await page.locator('#musicTimedLyrics').textContent(),'明天见');
  await page.evaluate(()=>{HSKAccountDashboard={user:{uid:'another-user',getIdToken:async()=> 'another'}};dispatchEvent(new Event('hsk-account-ready'));});
  assert.equal(await page.evaluate(()=>HSKMusicTranscript.read(document.querySelector('#musicCloudList .music-cloud-track').dataset.trackId)),null,'account-scoped personal drafts');
  await page.evaluate(()=>{HSKAccountDashboard={user:{uid:'BIvUyItDYJWcLvlhhtYFyj5csBH2',getIdToken:async()=> 'owner'}};HSKStudio.navigate('music-play');});
  await page.locator('#musicCloudList .music-cloud-track').first().click();await page.locator('#musicMenuBtn').click();await page.locator('#musicTranscriptOpen').click();await page.waitForFunction(()=>document.querySelector('#musicTranscriptDialog video').readyState>=1);
  await dialog.getByRole('button',{name:'Tạo script',exact:true}).click();await page.locator('#musicTranscriptRows fieldset').waitFor();
  await dialog.getByRole('button',{name:'Xuất bản vào kho chung'}).click();assert.equal(published,null,'unreviewed draft cannot publish');
  await dialog.locator('fieldset input[type=checkbox]').check();await dialog.getByRole('button',{name:'Xuất bản vào kho chung'}).click();await page.waitForFunction(()=>document.querySelector('#musicTranscriptStatus').textContent.includes('Đã xuất bản'));
  assert.equal(published.cues[0].text,'再见');await dialog.getByRole('button',{name:'Đóng',exact:true}).click();
  assert.deepEqual(errors,[]);await page.close();console.log('PASS transcript '+width+': listener creates, edits, reviews, saves, plays private script, account isolation and mobile fit');
 }}finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
