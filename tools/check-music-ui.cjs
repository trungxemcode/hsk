const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
function wav(){const samples=44100*11,b=Buffer.alloc(44+samples*2);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(44100,24);b.writeUInt32LE(88200,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(samples*2,40);return b;}
(async()=>{
 const root=process.cwd(),server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
 browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{}),...(process.env.HSK_CHROME_ARGS?{args:JSON.parse(process.env.HSK_CHROME_ARGS)}:{})});
 for(const width of [390,844,1440])for(const theme of ['light','dark']){
 const page=await browser.newPage({viewport:{width,height:width===844?390:900},serviceWorkers:'block'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://**/*',r=>r.abort());await page.route('**/account-config.json',r=>r.fulfill({json:{enabled:false}}));
 await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.waitForFunction(()=>window.HSKMusic&&window.HSKStudio&&window.HSKLessons);
 await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;window.HSKAccountDashboard={user:{uid:'music-test'}};window.HSKStudio.navigate('music');},theme);
 assert.equal(await page.locator('#musicPanel').isVisible(),true);await page.locator('#musicImport summary').click();
 await page.locator('#musicManifest').setInputFiles(path.join(root,'content/music/lesson-template.json'));
 await page.locator('#musicFile').setInputFiles({name:'test.wav',mimeType:'audio/wav',buffer:wav()});await page.locator('#musicImportApply').click();await page.waitForFunction(()=>document.getElementById('musicPlayer').readyState>=1);
 assert.equal(await page.locator('#musicLoop').getAttribute('aria-pressed'),'false','Loop is opt-in on every opened song');
 assert.equal(await page.locator('#musicLyrics').isVisible(),false);await page.locator('#musicHold').focus();await page.keyboard.down('Space');assert.equal(await page.locator('#musicLyrics').isVisible(),true);await page.keyboard.up('Space');assert.equal(await page.locator('#musicLyrics').isVisible(),false);
 await page.locator('#musicPlay').click();await page.waitForFunction(()=>!document.getElementById('musicPlayer').paused);
 await page.locator('#musicLoop').click();await page.evaluate(()=>document.getElementById('musicPlayer').currentTime=4.99);await page.waitForFunction(()=>document.getElementById('musicPlayer').currentTime<2);
 await page.locator('#musicNext').click();await page.waitForFunction(()=>document.getElementById('musicPlayer').paused);assert.ok(await page.locator('#musicPlayer').evaluate(e=>e.currentTime>=4.9));
 await page.locator('input[name=musicAnswer][value="0"]').check();await page.locator('#musicCheck').click();assert.match(await page.locator('#musicResult').innerText(),/Chưa đúng/);assert.equal(await page.locator('#musicLyrics').isVisible(),true);
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);assert.equal(overflow,false,'music overflow '+width+' '+theme);
 await page.evaluate(()=>window.HSKStudio.navigate('practice'));await page.waitForFunction(()=>document.getElementById('musicPlayer').paused);
 await page.evaluate(()=>{window.HSKAccountDashboard={user:{uid:'other'}};window.dispatchEvent(new Event('hsk-account-ready'));});assert.equal(await page.locator('#musicLesson').isVisible(),false);assert.equal(await page.evaluate(()=>localStorage.getItem('hsk-music-progress-v1:other')),null);
 assert.deepEqual(errors,[]);console.log('PASS music UI',width,theme,'real WAV playback, loop, seek, reveal, quiz, account isolation and layout');await page.close();
 }
 }finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
