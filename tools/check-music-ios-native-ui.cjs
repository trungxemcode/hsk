const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict');

(async()=>{
 const root=process.cwd();
 const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
   res.writeHead(404);res.end();return;
  }
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');
  res.end(fs.readFileSync(file));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
 try{
  for(const width of [390,1440]){
   const page=await browser.newPage({viewport:{width,height:900},serviceWorkers:'block'}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://**/*',route=>route.abort());
   await page.route('**/account-config.json',route=>route.fulfill({json:{enabled:false}}));
   await page.route('**/music-config.json',route=>route.fulfill({json:{enabled:false,onlineResolver:'https://music.example'}}));
   await page.route('https://music.example/api/online/resolve',route=>{
    const id=new URL(route.request().postDataJSON().url).searchParams.get('v');
    route.fulfill({json:{
     id,title:'Native HSK',artist:'HSK',url:'https://rr-test.googlevideo.com/'+id+'.m4a',
     relayUrl:'https://music.example/api/online/stream/ticket-'+id
    }});
   });
   await page.addInitScript(()=>{
    window.nativeCalls=[];
    window.HSKNativeAudio={available:true,send(data){
     window.nativeCalls.push(data);
     if(data.action==='load'){
      setTimeout(()=>window.dispatchEvent(new CustomEvent('hsk-native-audio',{detail:{
       session:data.session,event:'state',playing:Boolean(data.autoPlay),position:4,duration:240
      }})),50);
     }
     if(data.action==='pause')window.dispatchEvent(new CustomEvent('hsk-native-audio',{detail:{
      session:data.session,event:'state',playing:false,position:4,duration:240
     }}));
    }};
   });
   await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');
   await page.waitForFunction(()=>window.HSKMusic&&window.HSKStudio);
   await page.evaluate(()=>{
    window.HSKAccountDashboard={user:{getIdToken:async()=> 'fake-test-token'}};
    HSKStudio.navigate('music-play');
   });
   await page.waitForResponse(r=>r.url().endsWith('/music-config.json'));
   await page.locator('#musicMenuBtn').click();
   await page.locator('#musicLinkImport>summary').click();
   await page.locator('#musicLinkUrl').fill('https://youtu.be/dQw4w9WgXcQ');
   await page.locator('#musicLinkApply').click();
   await page.waitForFunction(()=>window.nativeCalls.some(x=>x.action==='load'));
   assert.equal(await page.locator('#musicLinkPlayer iframe').count(),0,'native path must not mount YouTube iframe');
   assert.equal(await page.locator('#musicBackgroundAudio').count(),0,'native path must not mount WebView audio');
   let state=await page.evaluate(()=>window.nativeCalls.find(x=>x.action==='load'));
   assert.equal(state.autoPlay,true);
   assert.equal(state.url.includes('.googlevideo.com/'),true);
   assert.equal(state.relayUrl.includes('/api/online/stream/'),true);
   await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));HSKStudio.navigate('practice');});
   await page.waitForFunction(()=>!document.getElementById('musicBackgroundPlayer').hidden);
   assert.equal(await page.evaluate(()=>window.nativeCalls.filter(x=>x.action==='stop').length),0,'route/hidden must not stop native playback');
   await page.evaluate(()=>window.HSKStudio.navigate('music-play'));
   await page.evaluate(()=>document.getElementById('musicLinkPlay').click());
   assert.equal(await page.evaluate(()=>window.nativeCalls.at(-1).action),'pause');
   await page.evaluate(()=>window.dispatchEvent(new Event('hsk-account-ready')));
   assert.equal(await page.evaluate(()=>window.nativeCalls.at(-1).action),'stop','logout must stop native playback');
   assert.deepEqual(errors,[]);
   await page.close();
   console.log('PASS iOS native JS bridge '+width+': authenticated M4A, background route, media controls, logout cleanup');
  }
 }finally{
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
