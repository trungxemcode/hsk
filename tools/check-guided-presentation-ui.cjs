const {chromium}=require('playwright'),fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=process.cwd(),server=http.createServer((q,r)=>{const f=path.resolve(root,'.'+new URL(q.url,'http://local').pathname);if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){r.writeHead(404);return r.end();}r.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'})[path.extname(f)]||'application/octet-stream');r.end(fs.readFileSync(f));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
 try{
  for(const [width,height] of [[320,568],[390,844],[430,932],[1440,900],[844,390],[568,320]]){
   const p=await browser.newPage({viewport:{width,height},serviceWorkers:'block'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
   await p.route('https://**/*',r=>r.abort());await p.route('**/account-config.json',r=>r.fulfill({body:'{"enabled":false}',contentType:'application/json'}));
   await p.addInitScript(()=>{window.__spoken=[];window.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices:()=>[{name:'Mandarin',lang:'zh-CN',localService:true}],cancel(){},speak(u){window.__spoken.push(u);}}});HTMLElement.prototype.requestFullscreen=()=>Promise.reject(Error('iPhone fallback'));});
   await p.goto('http://127.0.0.1:'+server.address().port+'/index.html');await p.waitForFunction(()=>window.HSKLessonNav&&window.HSKLessons&&document.body.dataset.studioHub==='home');
   await p.evaluate(async()=>{HSKStudio.navigate('lessons');history.replaceState(null,'','#lesson/standard-1-01');await HSKLessonNav.open();});await p.getByRole('button',{name:'Học tự động',exact:true}).click();
   const show=p.locator('.guided-presentation');await show.waitFor();assert.equal(await show.locator('[data-slide-kind]').getAttribute('data-slide-kind'),'word');assert.ok(await p.evaluate(()=>window.__spoken.length)>0,'real entry starts voice');
   await show.getByRole('button',{name:'Học từng chặng',exact:true}).click();assert.equal(await p.locator('.guided-body').isVisible(),true,'original guided mode preserved');
   // Isolate supplied long examples without network or learner-account writes.
   await p.evaluate(()=>{HSKLessonGuided.stop();window.__spoken=[];window.__writes=[];window.__evidence=0;HSKGuidedCore.slideDuration=()=>400;HSKLessons.examples=()=>[{cn:'你好。',pin:'nǐ hǎo',vi:'Xin chào.'},{cn:'你今天想去哪里学习中文？',pin:'nǐ jīn tiān xiǎng qù nǎ lǐ xué xí zhōng wén',vi:'Hôm nay bạn muốn đến đâu để học tiếng Trung?'}];if(innerWidth!==390)HSKLessons.examples=()=>[{cn:'周末'.repeat(20),pin:'zhōu mò '.repeat(12).trim(),vi:'Học tiếng Trung cuối tuần. '.repeat(4)}];const host=document.createElement('div');document.querySelector('#lessonsPanel').append(host);HSKLessonGuided.mount(host,{vi:'Kiểm thử',content:{}},[{han:'你',pin:'nǐ',mean:'bạn'},{han:'我',pin:'wǒ',mean:'tôi'}],{read:()=>({}),persist:v=>__writes.push(v),readComplete:()=>__evidence++,answer:()=>__evidence++,practice(){},exit(){}});});
   for(const theme of ['light','dark']){
    await p.evaluate(t=>document.documentElement.dataset.theme=t,theme);
    const geometry=await show.evaluate(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,scroll:n.scrollHeight,client:n.clientHeight};});assert.ok(Math.abs(geometry.w-width)<2&&Math.abs(geometry.h-height)<2&&geometry.x===0&&geometry.y===0,JSON.stringify({width,height,geometry}));assert.ok(geometry.scroll<=geometry.client+1);
   }
   if(width===390){
    const frame=await show.locator('.guided-slide').getAttribute('data-frame-id');await p.waitForTimeout(1100);assert.equal(await show.locator('.guided-slide').getAttribute('data-frame-id'),frame,'never advance before speech ends');assert.equal(await p.evaluate(()=>__spoken.length),1);
    await p.evaluate(()=>__spoken.at(-1).onend());await p.waitForFunction(()=>document.querySelector('.guided-slide-text').textContent==='bạn');await p.waitForFunction(()=>window.__spoken.length===2);assert.equal(await p.evaluate(()=>__spoken.at(-1).text),'你好。');
    await p.evaluate(()=>__spoken.at(-1).onend());await p.waitForFunction(()=>document.querySelector('.guided-slide-text').textContent==='Xin chào.');await p.waitForFunction(()=>window.__spoken.length===3);assert.equal(await p.evaluate(()=>__spoken.at(-1).text),'你今天想去哪里学习中文？');await p.screenshot({path:'/tmp/guided-presentation-390.png'});
    await show.getByRole('button',{name:'Tạm dừng',exact:true}).click();const paused=await show.locator('.guided-slide').getAttribute('data-frame-id');await p.evaluate(()=>__spoken.at(-1).onend());await p.waitForTimeout(1100);assert.equal(await show.locator('.guided-slide').getAttribute('data-frame-id'),paused,'stale audio cannot advance a paused session');
    await show.getByRole('button',{name:'Tiếp tục',exact:true}).click();assert.equal(await p.evaluate(()=>__spoken.at(-1).text),'你今天想去哪里学习中文？');await p.evaluate(()=>__spoken.at(-1).onend());await p.waitForFunction(()=>document.querySelector('.guided-slide-text').textContent.includes('Hôm nay'));await p.waitForFunction(()=>window.__spoken.at(-1).text==='我');
    // Finish all remaining frames using only speech completion, no navigation taps.
    for(let i=0;i<8&&await show.getByRole('button',{name:'Học lại',exact:true}).count()===0;i++){await p.evaluate(()=>__spoken.at(-1).onend());await p.waitForTimeout(1400);}
    await show.getByRole('button',{name:'Học lại',exact:true}).waitFor();assert.equal(await p.evaluate(()=>__evidence),0,'passive playback must not grant mastery');
   }else{
    await show.getByRole('button',{name:'Tạm dừng',exact:true}).click();
    for(let i=0;i<6;i++){
     const overflow=await show.locator('.guided-slide').evaluate(n=>{const box=n.getBoundingClientRect();return [...n.children].filter(x=>x.textContent).map(x=>{const r=x.getBoundingClientRect();return {top:r.top-box.top,bottom:box.bottom-r.bottom,left:r.left-box.left,right:box.right-r.right};});});assert.ok(overflow.every(r=>Object.values(r).every(v=>v>=-1)),JSON.stringify({width,height,overflow}));await show.getByRole('button',{name:'Tiếp →',exact:true}).click();
    }
   }
   await p.evaluate(()=>HSKStudio.navigate('home'));await show.waitFor({state:'detached'});assert.equal(await p.evaluate(()=>document.body.classList.contains('guided-presenting')),false);const spoken=await p.evaluate(()=>__spoken.length);await p.waitForTimeout(450);assert.equal(await p.evaluate(()=>__spoken.length),spoken,'navigation cancels timers and audio');assert.deepEqual(errors,[]);await p.close();
  }
  console.log('PASS hands-free presentation: real entry, word/example/meaning order, speech-end gating, pause/resume, complete playback without taps, no mastery writes, route cleanup, light/dark portrait/landscape fit.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
