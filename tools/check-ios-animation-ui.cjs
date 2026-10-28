/* Measures avoidable UI work, not physical-device FPS. Run with HSK_TEST_BROWSER=webkit for Safari engine coverage. */
const {chromium,webkit}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),fixture=require('./music-cloud-fixture.cjs');
(async()=>{
 const root=process.cwd(),server=http.createServer((q,r)=>{const f=path.resolve(root,'.'+new URL(q.url,'http://local').pathname);if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){r.writeHead(404);return r.end();}r.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(f)]||'application/octet-stream');r.end(fs.readFileSync(f));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  const engine=process.env.HSK_TEST_BROWSER==='webkit'?webkit:chromium;
  browser=await engine.launch({headless:true,...(engine===chromium&&process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
  const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:3,serviceWorkers:'block'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   window.__animationWork={shellUpdates:0,fullButtonScans:0};
   window.__bodyMutations={};
   const NativeObserver=MutationObserver;
   window.MutationObserver=class extends NativeObserver{
    constructor(fn){super((records,observer)=>{if(observer.__broad)for(const record of records){const n=record.target.nodeType===1?record.target:record.target.parentElement;const key=n.tagName+'#'+n.id+'.'+(record.attributeName||record.type);window.__bodyMutations[key]=(window.__bodyMutations[key]||0)+1;}fn(records,observer);});}
    observe(node,options){this.__broad=node===document.body&&options.subtree;return super.observe(node,options);}
   };
   const raf=requestAnimationFrame.bind(window);
   window.requestAnimationFrame=fn=>raf(t=>{if(fn.name==='update'&&String(fn).includes('mobile-mini-rail'))window.__animationWork.shellUpdates++;return fn(t);});
   const query=Element.prototype.querySelectorAll;
   Element.prototype.querySelectorAll=function(selector){if(this.classList.contains('workspace')&&selector.includes('button'))window.__animationWork.fullButtonScans++;return query.call(this,selector);};
  });
  await page.route('https://**/*',r=>r.abort());await page.route('**/account-config.json',r=>r.fulfill({json:{enabled:false}}));await page.route('**/push-config.json',r=>r.fulfill({json:{appId:''}}));await fixture(page);
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.waitForFunction(()=>window.HSKStudio&&window.HSKMusic&&window.HSKMobileUX);
  await page.evaluate(()=>HSKStudio.navigate('music-play'));await page.waitForFunction(()=>document.querySelectorAll('#musicCloudList button').length===3);await page.waitForTimeout(500);
  // Settle the separately tested Push UI before measuring music clock work.
  await page.waitForFunction(()=>document.getElementById('pushStatus').textContent.startsWith('Chưa kết nối OneSignal.')&&document.getElementById('updatePushStatus').textContent===document.getElementById('pushStatus').textContent);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const work=await page.evaluate(async()=>{
   window.__animationWork={shellUpdates:0,fullButtonScans:0};
   window.__bodyMutations={};
   const clock=document.getElementById('musicLinkElapsed');
   for(let i=0;i<30;i++)await new Promise(resolve=>requestAnimationFrame(()=>{clock.textContent='00:'+String(i).padStart(2,'0');resolve();}));
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   return {...window.__animationWork,mutations:Object.entries(window.__bodyMutations).sort((a,b)=>b[1]-a[1]).slice(0,12)};
  });
  console.log('UI_WORK '+JSON.stringify(work));
  assert.equal(work.shellUpdates,0,'music clock updates must not render the entire mobile shell');assert.equal(work.fullButtonScans,0,'music clock updates must not scan every app button');
  await page.evaluate(()=>{const host=document.createElement('div');host.className='panel-box';host.id='perfDynamicControl';host.innerHTML='<button>Dynamic action</button>';document.querySelector('.workspace').append(host);});
  await page.waitForFunction(()=>document.querySelector('#perfDynamicControl button').classList.contains('studio-action'));await page.locator('#perfDynamicControl').evaluate(n=>n.remove());
  await page.locator('#musicMenuBtn').click();await page.locator('#musicMenuSheet').waitFor({state:'visible'});await page.waitForTimeout(350);
  const writes=await page.evaluate(async()=>{
   const sheet=document.getElementById('musicMenuSheet'),handle=sheet.querySelector('.music-sheet-drag-area'),r=handle.getBoundingClientRect();let writes=0;
   const observer=new MutationObserver(rows=>{writes+=rows.filter(x=>x.target===sheet&&x.attributeName==='style').length;});observer.observe(sheet,{attributes:true,attributeFilter:['style']});
   const send=(type,dy)=>{const e=new Event(type,{bubbles:true,cancelable:true});Object.defineProperty(e,'touches',{value:/end|cancel/.test(type)?[]:[{clientX:r.x+r.width/2,clientY:r.y+r.height/2+dy}]});handle.dispatchEvent(e);};
   send('touchstart',0);for(let dy=8;dy<=80;dy+=8)send('touchmove',dy);
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));const count=writes;
   send('touchcancel',80);observer.disconnect();return count;
  });
  console.log('DRAG_STYLE_WRITES '+writes);assert.ok(writes<=3,'a burst of touch events must render at most once per frame');
  await page.waitForTimeout(400);assert.equal(await page.locator('#musicMenuSheet').getAttribute('aria-hidden'),'false','canceled close keeps the menu open');
  await page.locator('#musicPersonalOpen').click();await page.waitForFunction(()=>document.getElementById('musicMenuSheet').dataset.view==='personal');await page.locator('#musicMenuSubCancel').click();await page.locator('#musicMenuClose').click();
  await page.evaluate(()=>HSKStudio.navigate('practice'));assert.equal(await page.locator('body').getAttribute('data-studio-hub'),'practice');
  const idle=await page.evaluate(async()=>{window.__animationWork.shellUpdates=0;await new Promise(resolve=>{let frames=0;const tick=()=>++frames===12?resolve():requestAnimationFrame(tick);requestAnimationFrame(tick);});return window.__animationWork.shellUpdates;});
  assert.ok(idle<=2,'mobile shell must settle after navigation instead of updating continuously');
  await page.evaluate(()=>HSKLoading.flash('Kiểm tra', '', 1, document.getElementById('studioPractice')));
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.evaluate(()=>HSKLoading.flash('Kiểm tra', '', 1, document.getElementById('studioPractice')));
  assert.deepEqual(errors,[]);await page.screenshot({path:'/tmp/ios-animation-'+(process.env.HSK_TEST_BROWSER||'chromium')+'.png'});
  console.log('PASS '+(process.env.HSK_TEST_BROWSER||'chromium')+': bounded shell work, dynamic controls, frame-coalesced drag, cancel and menu routing');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
