// Only the last played cloud track is cached locally; no per-track progress database.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const fixture=require('./music-cloud-fixture.cjs');
(async()=>{
 const root=process.cwd(),server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');
  res.end(fs.readFileSync(file));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
 try{
  for(const width of [390,1440]){
   const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});
   const errors=[];context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
   const origin='http://127.0.0.1:'+server.address().port;
   async function prepare(){
    const page=await context.newPage();
    await page.route('https://**/*',r=>r.abort());
    await page.route('**/account-config.json',r=>r.fulfill({json:{enabled:false}}));
    await fixture(page);
    await page.goto(origin+'/index.html');
    await page.waitForFunction(()=>window.HSKStudio&&window.HSKMusic);
    await page.evaluate(()=>HSKStudio.navigate('music-play'));
    await page.waitForFunction(()=>document.querySelectorAll('#musicCloudList button').length===3);
    return page;
   }
   let page=await prepare();
   await page.locator('#musicCloudList button').first().click();
   await page.waitForFunction(()=>document.getElementById('musicBackgroundAudio')?.duration>2);
   const initial=await page.evaluate(async()=>{
    const a=document.getElementById('musicBackgroundAudio'),target=Math.min(4,a.duration*.45);
    a.currentTime=target;
    await new Promise(resolve=>{if(a.seeking)a.addEventListener('seeked',resolve,{once:true});else resolve();});
    a.pause();
    return {target,url:a.getAttribute('src')};
   });
   await page.waitForFunction(()=>JSON.parse(localStorage.getItem('hsk-music-last-position-v1')||'null')?.time>1);
   const snapshot=await page.evaluate(()=>JSON.parse(localStorage.getItem('hsk-music-last-position-v1')));
   assert.equal(snapshot.url,initial.url);
   assert.ok(Math.abs(snapshot.time-initial.target)<.7);
   assert.equal(await page.evaluate(()=>Object.keys(localStorage).filter(x=>x==='hsk-music-last-position-v1').length),1);
   // Simulate playlist playback where account recents are in another order.
   await page.evaluate(()=>{
    const k=Object.keys(localStorage).find(x=>x.startsWith('hsk-music-links-v1:'));
    const rows=JSON.parse(localStorage.getItem(k));
    const second='https://music.example/audio/'+(2).toString(16).padStart(64,'0')+'.m4a';
    localStorage.setItem(k,JSON.stringify([{url:second,title:'Old recent'},...rows.filter(x=>x.url!==second)]));
   });
   await page.close();
   page=await prepare();
   await page.waitForFunction(()=>!document.getElementById('musicHero').hidden);
   await page.locator('#musicHeroPlay').click();
   await page.waitForFunction(()=>document.getElementById('musicBackgroundAudio')?.currentTime>1);
   const restored=await page.evaluate(()=>({time:document.getElementById('musicBackgroundAudio').currentTime,url:document.getElementById('musicBackgroundAudio').getAttribute('src')}));
   assert.equal(restored.url,initial.url,'continue must choose cached song, not older recent');
   assert.ok(Math.abs(restored.time-snapshot.time)<2,'must restore saved second');
   await page.evaluate(()=>document.getElementById('musicBackgroundAudio').pause());
   await page.evaluate(()=>document.querySelectorAll('#musicCloudList button')[1].click());
   await page.waitForFunction(()=>document.getElementById('musicBackgroundAudio')?.getAttribute('src')?.endsWith('2.m4a'));
   const latest=await page.evaluate(()=>JSON.parse(localStorage.getItem('hsk-music-last-position-v1')));
   assert.equal(latest.time,0);assert.notEqual(latest.url,initial.url);
   await page.evaluate(()=>document.querySelectorAll('#musicCloudList button')[0].click());
   await page.waitForFunction(()=>document.getElementById('musicBackgroundAudio')?.readyState>=1&&document.getElementById('musicBackgroundAudio')?.getAttribute('src')?.endsWith('1.m4a'));
   const oldTime=await page.evaluate(()=>document.getElementById('musicBackgroundAudio').currentTime);
   assert.ok(oldTime<1.5,'older track should start from beginning');
   assert.deepEqual(errors,[],JSON.stringify(errors));
   console.log('PASS device-only resume '+width+'px saved='+snapshot.time+' restored='+restored.time);
   await context.close();
  }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1});
