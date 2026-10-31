/* Compare two actual builds; no baseline writes, no snapshot auto-approval. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {execFileSync}=require('node:child_process');
const assert=require('node:assert/strict');
const {ROUTES,scope,pixels,visualPixels,measureDOM,scenarios}=require('./ui-outside-scope-core.cjs');
const {needsVisualComparison}=require('./ci-sharding-core.cjs');
const [before,after,out]=process.argv.slice(2).map(x=>path.resolve(x));
assert.ok(before&&after&&out,'Usage: node tools/check-ui-outside-scope.cjs BASE_DIR HEAD_DIR OUTPUT_DIR');
fs.mkdirSync(out,{recursive:true});
const git=(...args)=>execFileSync('git',['-C',after,...args],{encoding:'utf8'}).trim();
const baseSHA=execFileSync('git',['-C',before,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
const headSHA=git('rev-parse','HEAD');
const changed=git('diff','--name-only',baseSHA,headSHA).split('\n').filter(Boolean);
const compareUI=needsVisualComparison(changed),selectedScenarios=scenarios(process.env.UI_SCOPE_WIDTH,process.env.UI_SCOPE_THEME);
const report={baseSHA,headSHA,changed,selectedScenarios,results:[],coverage:'Guest entry pages plus admin with local mocked owner/role API. Authenticated learner dashboards and modal/learning substates require separate fixtures/review.'};
const save=()=>fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
// An old scope declaration cannot silently exempt a page in the next PR.
const config=changed.includes('.github/ui-scope.json')?JSON.parse(fs.readFileSync(path.join(after,'.github/ui-scope.json'),'utf8')):{request:'No exclusions declared in this PR',excludedRoutes:[]};
const protectedRoutes=scope(config);report.scope=config;
if(!compareUI){report.result='Not applicable: no app or visual-guard changes';save();console.log(report.result);process.exit(0);}
// New routes must be added to the capture inventory, not silently skipped.
for(const root of [before,after]){
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 for(const match of html.matchAll(/data-studio-go="([^"]+)"/g)) assert.ok(ROUTES.includes(match[1])||match[1]==='review','Uncovered navigation route: '+match[1]);
}
function serve(root){
 const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
 });
 return new Promise(resolve=>server.listen(0,'127.0.0.1',()=>resolve(server)));
}
(async()=>{
 const {chromium}=require('playwright'),{PNG}=require('pngjs');
 const servers=await Promise.all([serve(before),serve(after)]);
 const browser=await chromium.launch({headless:true,args:['--disable-gpu','--force-color-profile=srgb'],...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
 let failures=0;
 async function capture(server,route,width,theme,prefix){
  const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1,locale:'vi-VN',timezoneId:'Asia/Ho_Chi_Minh',reducedMotion:'reduce',serviceWorkers:'block'});
  try{
   await page.clock.setFixedTime(new Date('2026-10-30T03:00:00Z'));
   await page.addInitScript(()=>{let seed=142857;Math.random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};});
   await page.route('https://**/*',r=>r.abort());
   await page.route('**/account-config.json',r=>r.fulfill({contentType:'application/json',body:'{"enabled":false}'}));
   if(route==='admin'){
    await page.route('**/translation-config.json',r=>r.fulfill({json:{enabled:true,endpoint:'https://roles.invalid/translate'}}));
    await page.route('https://roles.invalid/**',r=>r.fulfill({json:new URL(r.request().url()).pathname==='/account-role'?{account:{uid:'BIvUyItDYJWcLvlhhtYFyj5csBH2',email:'owner@test.invalid',role:'admin'}}:{accounts:[{uid:'BIvUyItDYJWcLvlhhtYFyj5csBH2',email:'owner@test.invalid',role:'admin'}],cursor:null}}));
   }
   await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.HSKStudio&&window.HSKMobileUX&&window.HSKLessons&&document.body.dataset.studioHub==='home',null,{timeout:60000});
   if(route.startsWith('music')){await page.evaluate(()=>window.HSKMusicLoad?.start());await page.waitForFunction(()=>!!window.HSKMusic,null,{timeout:60000});}
   if(route==='admin'){
    await page.evaluate(()=>{const owner='BIvUyItDYJWcLvlhhtYFyj5csBH2';window.HSKAccountDashboard={adminUid:owner,adminEmail:'owner@test.invalid',user:{uid:owner,getIdToken:async()=>'test'},api:{db:{},collection:()=>0,query:()=>0,orderBy:()=>0,limit:()=>0,getDocs:async()=>({docs:[]})}};window.dispatchEvent(new Event('hsk-account-ready'));});
    await page.waitForFunction(()=>!document.getElementById('adminBtn').hidden);
   }
   await page.evaluate(({route,theme})=>{document.documentElement.dataset.theme=theme;window.HSKStudio.navigate(route);},{route,theme});
   // Lazy music UI can first measure its tab marker while its panel is hidden.
   // Exercise the same real viewport-resize lifecycle on both builds after entry.
   if(route.startsWith('music')){
    await page.setViewportSize({width:width+1,height:900});
    await page.setViewportSize({width,height:900});
   }
   await page.evaluate(()=>document.fonts.ready);
   await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;scroll-behavior:auto!important}'});
   await page.waitForTimeout(1200);
   const title=await page.locator('#activeTitle').innerText();
   assert.ok(title.trim(),'Missing route title: '+route);
   // Confirm routes really opened, rather than comparing the previous page twice.
   {
    const state=await page.evaluate(()=>({hub:document.body.dataset.studioHub||'',classes:document.body.className,active:document.querySelector('.app-tabs [data-mode].active')?.dataset.mode}));
    const alias=route==='music-play'?'music':route;
    assert.ok(state.hub===alias||state.classes.includes('show-'+route)||state.active===route,'Route did not open '+route+': '+JSON.stringify(state));
   }
   const measure=()=>page.evaluate(measureDOM);
   let geometry=await measure(),settled=false;
   for(let attempt=0;attempt<12;attempt++){
    await page.waitForTimeout(250);const next=await measure();
    if(JSON.stringify(geometry)===JSON.stringify(next)){settled=true;break;}geometry=next;
   }
   assert.ok(settled,'Unstable layout before capture: '+route);
   fs.writeFileSync(prefix+'-geometry.json',JSON.stringify(geometry,null,2));
   const images=[];
   // Capture both the document and each vertical slice of the main scrolling pane.
   const scroll=await page.evaluate(()=>{const n=document.querySelector('.workspace');return n?{height:n.clientHeight,total:n.scrollHeight}:null;});
   const slices=scroll?Math.max(1,Math.ceil(scroll.total/Math.max(1,scroll.height))):1;
   assert.ok(slices<=40,'Unexpected unbounded scroll content: '+route);
   for(let i=0;i<slices;i++){
    await page.evaluate(i=>{const n=document.querySelector('.workspace');if(n)n.scrollTop=i*n.clientHeight;},i);
    await page.waitForTimeout(50);
    const file=prefix+'-'+i+'.png';await page.screenshot({path:file,fullPage:true,animations:'disabled'});images.push(file);
   }
   return {title,geometry,images};
  }finally{await page.close();}
 }
 try{
  for(const {width,theme} of selectedScenarios)for(const route of protectedRoutes){
   const key=route+'-'+width+'-'+theme;
   const a=await capture(servers[0],route,width,theme,path.join(out,key+'-before'));
   const b=await capture(servers[1],route,width,theme,path.join(out,key+'-after'));
   const result={key,title:a.title,geometryEqual:JSON.stringify(a.geometry)===JSON.stringify(b.geometry),imageCountEqual:a.images.length===b.images.length,rawChangedPixels:0,changedPixels:0};
   for(let i=0;i<Math.min(a.images.length,b.images.length);i++){
    const x=PNG.sync.read(fs.readFileSync(a.images[i])),y=PNG.sync.read(fs.readFileSync(b.images[i]));
    const delta=pixels(x,y);result.rawChangedPixels+=delta.changed;
    result.changedPixels+=visualPixels(x,y);
    if(delta.changed&&x.width===y.width&&x.height===y.height){
     const diff=new PNG({width:x.width,height:x.height});
     for(let p=0;p<x.data.length;p+=4){const changed=[0,1,2,3].some(k=>Math.abs(x.data[p+k]-y.data[p+k])>2);diff.data[p]=changed?255:Math.round(y.data[p]*.25);diff.data[p+1]=changed?0:Math.round(y.data[p+1]*.25);diff.data[p+2]=changed?128:Math.round(y.data[p+2]*.25);diff.data[p+3]=255;}
     fs.writeFileSync(path.join(out,key+'-diff-'+i+'.png'),PNG.sync.write(diff));
    }
   }
   result.pass=result.geometryEqual&&result.imageCountEqual&&result.changedPixels===0;
   if(!result.pass)failures++;report.results.push(result);save();console.log((result.pass?'PASS ':'FAIL ')+key+' pixels='+result.changedPixels+' geometry='+result.geometryEqual);
  }
  report.result=failures?'FAIL: '+failures+' outside-scope states changed':'PASS: protected entry-page states unchanged';save();assert.equal(failures,0,report.result);
 }finally{await browser.close();for(const s of servers)s.close();}
})().catch(e=>{report.error=e.stack;save();console.error(e);process.exitCode=1;});
