/* Run the real offline-worker lifecycle on a small synthetic /hsk/ release pair. */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const fs=require('node:fs'),http=require('node:http'),crypto=require('node:crypto');
(async()=>{
 const source=fs.readFileSync('offline-worker.js','utf8'),newCore='src/modules/backup/backup-core.js',newUI='src/modules/backup/backup-restore.js';
 const aliases={'backup-core.js':newCore,'backup-restore.js':newUI};
 const core=fs.readFileSync(newCore),ui=fs.readFileSync(newUI),requests=[];
 let stage='old';
 function fixture(which){
  const old=which==='old',version='hsk-offline-900-0-'+(old?'1':'2');
  const files={'index.html':Buffer.from('<!doctype html><meta charset="utf-8"><p>'+which+'</p><script src="./'+(old?'backup-core.js':newCore)+'"></script><script src="./'+(old?'backup-restore.js':newUI)+'"></script>'),
   'unchanged.txt':Buffer.from('same bytes'),[old?'backup-core.js':newCore]:core,[old?'backup-restore.js':newUI]:ui};
  let worker=source.replace(/const OFFLINE_VERSION='[^']+';/,"const OFFLINE_VERSION='"+version+"';")
   .replace(/const OFFLINE_FILES=\[.*?\];/,'const OFFLINE_FILES='+JSON.stringify(Object.keys(files))+';')
   .replace(/^const OFFLINE_ALIASES=.*?;$/m,'const OFFLINE_ALIASES='+JSON.stringify(old?{}:aliases)+';');
  if(old)worker=worker.replace(/ const asset=Object\.prototype[^\n]+\n if\(OFFLINE_FILES\.includes\(asset\)\)event\.respondWith\(serve\(event\.request,asset,false\)\);/,
   ' if(OFFLINE_FILES.includes(relative))event.respondWith(serve(event.request,relative,false));');
  const assets=Object.fromEntries(Object.entries(files).map(([name,data])=>[name,{bytes:data.length,sha256:crypto.createHash('sha256').update(data).digest('hex')}]));
  return {files,worker,version,manifest:{version,assets}};
 }
 const fixtures={old:fixture('old'),new:fixture('new')};
 const server=http.createServer((q,r)=>{
  const name=new URL(q.url,'http://local').pathname.replace(/^\/hsk\//,'');requests.push({stage,name});
  const f=fixtures[stage];r.setHeader('Cache-Control','no-store');
  if(name==='harness.html'){r.setHeader('Content-Type','text/html');return r.end('<!doctype html><p>Fixture harness</p>');}
  if(name==='offline-worker.js'){r.setHeader('Content-Type','text/javascript');return r.end(f.worker);}
  if(name==='app-version.json'){r.setHeader('Content-Type','application/json');return r.end(JSON.stringify(f.manifest));}
  if(f.files[name]){r.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.html')?'text/html':'text/plain');return r.end(f.files[name]);}
  r.writeHead(404);r.end();
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
 try{
  const context=await browser.newContext({serviceWorkers:'allow'}),page=await context.newPage(),origin='http://127.0.0.1:'+server.address().port;
  await page.goto(origin+'/hsk/harness.html');
  await page.evaluate(async()=>{
   localStorage.setItem('fixture-progress','keep-me');
   await navigator.serviceWorker.register('./offline-worker.js');await navigator.serviceWorker.ready;
   if(!navigator.serviceWorker.controller)await new Promise(r=>navigator.serviceWorker.addEventListener('controllerchange',r,{once:true}));
  });
  assert.match(await page.evaluate(()=>fetch('./index.html').then(r=>r.text())),/<p>old<\/p>/);
  stage='new';
  await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();});
  await page.waitForFunction(async()=>{const r=await navigator.serviceWorker.getRegistration();return r?.waiting?.state==='installed';},null,{timeout:60000});
  // Installing an update must not replace the shell underneath an existing tab.
  assert.match(await page.evaluate(()=>fetch('./index.html').then(r=>r.text())),/<p>old<\/p>/);
  await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();const changed=new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));r.waiting.postMessage({type:'HSK_ACTIVATE_UPDATE'});await changed;});
  await context.setOffline(true);
  const result=await page.evaluate(async names=>{
   const text=async name=>{const r=await fetch('./'+name);if(!r.ok)throw Error(name+' HTTP '+r.status);return r.text();};
   return {shell:await text('index.html'),oldCore:await text('backup-core.js'),newCore:await text(names[0]),oldUI:await text('backup-restore.js'),newUI:await text(names[1]),progress:localStorage.getItem('fixture-progress')};
  },[newCore,newUI]);
  assert.match(result.shell,/<p>new<\/p>/);assert.equal(result.oldCore,result.newCore);assert.equal(result.oldUI,result.newUI);assert.equal(result.progress,'keep-me');
  assert.equal(requests.filter(q=>q.stage==='new'&&q.name==='unchanged.txt').length,0,'Unchanged old cached assets must be reused');
  await page.goto(origin+'/hsk/index.html');await page.waitForFunction(()=>!!window.HSKBackupCore);
  assert.equal(await page.evaluate(()=>localStorage.getItem('fixture-progress')),'keep-me');
  const fresh=await browser.newContext({serviceWorkers:'allow'}),freshPage=await fresh.newPage();
  await freshPage.goto(origin+'/hsk/harness.html');
  await freshPage.evaluate(async()=>{await navigator.serviceWorker.register('./offline-worker.js');await navigator.serviceWorker.ready;});
  await fresh.setOffline(true);await freshPage.goto(origin+'/hsk/index.html');await freshPage.waitForFunction(()=>!!window.HSKBackupCore);
  console.log('PASS real PWA lifecycle at /hsk/: waiting update, explicit activation, cache reuse, old URL aliases, offline reload, progress retention and fresh install (synthetic assets, actual worker).');
  await fresh.close();await context.close();
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
