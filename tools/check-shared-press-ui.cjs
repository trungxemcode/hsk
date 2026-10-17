/* Check actual disclosure geometry across routes, rather than only its CSS color. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const server=http.createServer((q,r)=>{const f=path.resolve(process.cwd(),'.'+new URL(q.url,'http://local').pathname);if(!f.startsWith(process.cwd()+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){r.writeHead(404);r.end();return;}r.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'})[path.extname(f)]||'application/octet-stream');r.end(fs.readFileSync(f));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:process.env.CHROME_EXECUTABLE});let count=0;
 try{for(const size of [{width:1440,height:900},{width:320,height:844},{width:390,height:844},{width:844,height:390}]){
  const mobile=size.width<900,p=await browser.newPage({viewport:size,isMobile:mobile,hasTouch:mobile,serviceWorkers:'block'});await p.route('https://**/*',r=>r.abort());await p.route('**/account-config.json',r=>r.fulfill({contentType:'application/json',body:'{"enabled":false}'}));await p.goto('http://127.0.0.1:'+server.address().port+'/index.html');await p.waitForFunction(()=>window.HSKMobileUX&&window.HSKLessons);
  for(const theme of ['light','dark']){await p.evaluate(t=>document.documentElement.dataset.theme=t,theme);
   for(const route of ['home','practice','lessons','search','notebook','account','learn','quiz','srs','translator','about','mistakes','compare','exam','real-reading']){
    await p.evaluate(r=>HSKStudio.navigate(r),route);await p.waitForTimeout(60);
    const headers=p.locator('summary:visible'),seen=new Set();for(let i=0;i<await headers.count();i++){
     const n=headers.nth(i),kind=await n.evaluate(n=>n.parentElement.className+'|'+n.className);if(seen.has(kind))continue;seen.add(kind); // One of each header type; repeated vocabulary rows share the same styles.
     await n.evaluate(n=>n.parentElement.open=false);await n.scrollIntoViewIfNeeded();await n.focus();await p.waitForTimeout(180);
     const info=await n.evaluate(n=>{const d=n.parentElement,a=n.getBoundingClientRect(),b=d.getBoundingClientRect(),s=getComputedStyle(n),t=getComputedStyle(d),framed=parseFloat(t.borderTopLeftRadius)>0||['Top','Right','Bottom','Left'].every(edge=>parseFloat(t['border'+edge+'Width'])>0);return {name:n.textContent.trim().slice(0,35),framed,dx:a.left-b.left,dy:a.top-b.top,right:b.right-a.right,bottom:b.bottom-a.bottom,radius:parseFloat(s.borderTopLeftRadius),frameRadius:parseFloat(t.borderTopLeftRadius),padding:[s.paddingLeft,s.paddingRight].map(parseFloat),bg:s.backgroundColor,color:s.color};});
     const persistentOpen=await n.evaluate(n=>n.parentElement.open);const label=JSON.stringify({size,route,theme,...info});assert.ok(info.padding.every(x=>x>=8),label+' text inset');assert.match(info.bg,/^rgba?\(105, 87, 231(?:, 1)?\)$/,label+' pressed color');assert.equal(info.color,'rgb(255, 255, 255)',label+' contrast');
     if(info.framed){for(const gap of [info.dx,info.dy,info.right,...(persistentOpen?[]:[info.bottom])])assert.ok(Math.abs(gap)<=2,label+' header must fill frame');assert.ok(Math.abs(info.radius-info.frameRadius)<=1,label+' matching corners');}
     if(i===0&&route==='account')await p.screenshot({path:'/tmp/press-shape-shared-account-'+size.width+'-'+theme+'.png'});
     // The existing desktop statistics policy keeps that panel expanded.
     if(!persistentOpen){await n.press('Enter');assert.equal(await n.evaluate(n=>n.parentElement.open),true);if(info.framed)assert.equal(await n.evaluate(n=>parseFloat(getComputedStyle(n).borderBottomLeftRadius)),0,label+' open corners');await n.press('Enter');assert.equal(await n.evaluate(n=>n.parentElement.open),false);}else assert.equal(await n.evaluate(n=>parseFloat(getComputedStyle(n).borderBottomLeftRadius)),0,label+' expanded header corners');await n.evaluate(n=>n.blur());count++;
    }
   }
  }await p.close();
 }console.log('PASS shared press geometry, padding, purple contrast and disclosure toggles: '+count+' headers across 15 routes, portrait/landscape/desktop, light/dark.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
