const {chromium}=require('playwright'),fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict'),fixture=require('./music-cloud-fixture.cjs');
(async()=>{
 const root=process.cwd(),server=http.createServer((q,r)=>{const f=path.resolve(root,'.'+new URL(q.url,'http://local').pathname);if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){r.writeHead(404);return r.end();}r.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(f)]||'application/octet-stream');r.end(fs.readFileSync(f));});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
 try{for(const width of [390,844,1440]){
  const page=await browser.newPage({viewport:{width,height:844},serviceWorkers:'block'}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://**/*',r=>r.abort());await page.route('**/account-config.json',r=>r.fulfill({json:{enabled:false}}));
  const tracks=await fixture(page);tracks[0].hasLyrics=true;tracks[0].lyricsRevision='v1';const scripts=new Map([[tracks[0].id,{cues:[{start:0,end:1,text:'你好世界',pinyin:'nǐ hǎo shì jiè',vi:'Xin chào thế giới'},{start:1,end:5,text:'我们一起学习',characters:[{start:1.2,text:'我'},{start:1.4,text:'们'},{start:2.9,text:'一'},{start:3.6,text:'起'},{start:3.7,text:'学'},{start:4.7,text:'习'}]}]}]]);let published=null,ai=null;
  await page.route('https://music.example/api/library*',r=>r.fulfill({json:{tracks,cursor:null}}));
  await page.route('https://music.example/api/tracks/*/lyrics',r=>{const id=new URL(r.request().url()).pathname.split('/')[3];return r.fulfill({status:scripts.has(id)?200:404,json:scripts.get(id)||{error:'missing'}});});
  await page.route('https://music.example/api/admin/tracks/*/lyrics',r=>{published=r.request().postDataJSON();const id=new URL(r.request().url()).pathname.split('/')[4];scripts.set(id,published);const t=tracks.find(t=>t.id===id);t.hasLyrics=true;t.lyricsRevision='v2';return r.fulfill({json:{saved:true,id,revision:'v2'}});});
  await page.route('**/translation-config.json',r=>r.fulfill({json:{enabled:true,endpoint:'https://ai.example/translate'}}));await page.route('https://ai.example/lesson-ask',r=>{ai=r.request().postDataJSON();return r.fulfill({json:{answer:'你好 nghĩa là xin chào.'}});});
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.waitForFunction(()=>window.HSKStudio&&window.HSKMusic);
  assert.equal(await page.locator('.home-music-chill').isVisible(),true);assert.equal(await page.locator('#studioHome .home-music-entry').count(),0,'one home entry; legacy lesson control moved into HSK filter');
  await page.evaluate(()=>{HSKAccountDashboard={user:{uid:'listener',getIdToken:async()=> 'listener'}};HSKStudio.navigate('music-play');});await page.waitForFunction(()=>document.querySelectorAll('#musicCloudList .music-cloud-track').length===3);
  await page.locator('[data-browse-filter=hsk]').click();assert.equal(await page.locator('#musicCloudList .music-cloud-track').count(),1);assert.equal(await page.locator('#musicLegacyLessons').isVisible(),true);
  await page.locator('#musicCloudList .music-cloud-track').first().click();await page.waitForFunction(()=>document.querySelectorAll('#musicTimedLyrics .music-timed-line').length===2);const audio=await page.locator('#musicBackgroundAudio').elementHandle();await page.waitForFunction(()=>document.getElementById('musicBackgroundAudio')?.currentTime>.1);
  await page.waitForFunction(()=>document.getElementById('musicLinkCover').classList.contains('is-script-flipped'));assert.equal(await page.locator('#musicTimedPanel').evaluate(n=>n.inert),false,'character-timed tracks automatically open karaoke');
  assert.equal(await page.locator('.music-timed-pinyin').first().textContent(),'nǐ hǎo shì jiè','supplied pronunciation wins');
  assert.match(await page.locator('.music-timed-pinyin').nth(1).textContent(),/wǒ men yì qǐ xué xí/,'missing pinyin generated locally');
  await audio.evaluate(n=>{n.pause();n.currentTime=2;n.dispatchEvent(new Event('timeupdate'));});
  assert.equal(await page.locator('.is-current .is-sung').count(),2);
  await audio.evaluate(n=>{n.currentTime=3.9;n.dispatchEvent(new Event('timeupdate'));});
  assert.equal(await page.locator('.is-current .is-sung').count(),5);
  await audio.evaluate(n=>{n.currentTime=1.05;n.dispatchEvent(new Event('timeupdate'));});
  assert.equal(await page.locator('.is-current .is-sung').count(),0,'backwards seek waits until the first actual onset');
  await audio.evaluate(n=>{n.currentTime=.5;n.dispatchEvent(new Event('timeupdate'));});
  assert.equal(await page.locator('.is-current').getAttribute('data-timing'),'line');
  assert.equal(await page.locator('.is-current .is-sung').count(),0,'line-only scripts have no synthetic sweep');
  await page.waitForFunction(()=>{const n=document.querySelector('.music-timed-line.is-current');const other=document.querySelector('.music-timed-line:not(.is-current) .music-timed-char');return getComputedStyle(n).opacity==='0.48'&&getComputedStyle(n.querySelector('.music-timed-char')).color===getComputedStyle(other).color;});
  const neutral=await page.locator('.music-timed-line.is-current .music-timed-char').first().evaluate(n=>getComputedStyle(n).color);assert.equal(neutral,await page.locator('.music-timed-line:not(.is-current) .music-timed-char').first().evaluate(n=>getComputedStyle(n).color),'missing word timestamps must not brighten a whole line');
  await audio.evaluate(n=>{n.currentTime=1.05;n.dispatchEvent(new Event('timeupdate'));});
  assert.equal(await page.locator('.music-timed-pinyin .is-sung').count(),0);
  assert.deepEqual(errors,[]);await page.close();console.log('PASS karaoke '+width+': observed word times, seek, neutral line-only text, steady pinyin');
 } }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
