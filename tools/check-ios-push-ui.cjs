// iOS Push enrollment regression with mocked OneSignal (no real notifications sent).
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
(async()=>{
const root=process.cwd(),server=http.createServer((req,res)=>{const f=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));});await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
const userAgent='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
try{
 for(const installed of [false,true]){
  const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block',userAgent}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(installed=>{
   Object.defineProperty(navigator,'standalone',{configurable:true,value:installed});
   Object.defineProperty(window,'PushManager',{configurable:true,value:function(){}});
   const subscription={optedIn:false,id:null,addEventListener(){},async optIn(){this.optedIn=true;this.id='mock-subscription';},async optOut(){this.optedIn=false;this.id=null;}};
   window.__pushMock={settings:null,tags:null,subscription};
   const sdk={Notifications:{permission:false,async requestPermission(){this.permission=true;}},User:{PushSubscription:subscription,addTags(t){window.__pushMock.tags=t;}},async init(opts){window.__pushMock.settings=opts;}};
   window.OneSignalDeferred={push(callback){Promise.resolve().then(()=>callback(sdk));}};
  },installed);
  await p.route('https://**/*',r=>r.abort());await p.route('**/account-config.json',r=>r.fulfill({contentType:'application/json',body:'{"enabled":false}'}));
  await p.goto('http://127.0.0.1:'+server.address().port+'/index.html');
  await p.waitForFunction(()=>!!window.HSKLessons&&document.querySelector('#pushStatus')?.textContent&&!document.querySelector('#pushStatus').textContent.includes('Đang kiểm tra'),{timeout:25000});
  if(!installed){
   assert.match(await p.locator('#pushStatus').innerText(),/Safari.*Màn hình chính/);
   assert.equal(await p.locator('#pushEnable').isDisabled(),true);
  }else{
   await p.waitForFunction(()=>!!window.__pushMock.settings,{timeout:10000});
   const worker=await p.evaluate(()=>window.__pushMock.settings.serviceWorkerPath);
   assert.equal(worker,'/OneSignalSDKWorker.js','registered worker must be absolute under current base');
   await p.locator('#pushEnable').evaluate(n=>n.click());
   await p.waitForFunction(()=>window.__pushMock.subscription.id==='mock-subscription');
   await p.waitForFunction(()=>JSON.parse(localStorage.getItem('hsk-push-preferences-v1')||'{}').enabled===true);
   assert.match(await p.locator('#pushStatus').innerText(),/Đã kết nối thông báo/);
   assert.equal(await p.evaluate(()=>window.__pushMock.tags.hsk_push_on),'1');
  }
  assert.deepEqual(errors,[]);
  console.log('PASS iPhone push: '+(installed?'standalone subscription and worker path':'Safari prompts Home Screen installation'));
  await p.close();
 }
}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
