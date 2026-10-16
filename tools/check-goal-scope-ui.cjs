// Verify target HSK picks lesson and flashcard levels, preserving deliberate manual choices.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
(async()=>{
const root=process.cwd();const server=http.createServer((req,res)=>{const f=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));});await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
try{
for(const width of [390,1440]){
 const p=await browser.newPage({viewport:{width,height:844},isMobile:width<721,hasTouch:width<721,serviceWorkers:'block'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>localStorage.setItem('hsk-studio-target-v1:guest','3'));
 await p.route('https://**/*',r=>r.abort());await p.route('**/account-config.json',r=>r.fulfill({contentType:'application/json',body:'{"enabled":false}'}));
 await p.goto('http://127.0.0.1:'+server.address().port+'/index.html');await p.waitForFunction(()=>!!window.HSKLearningFilter&&!!window.HSKStudio&&!!window.HSKPlanner,{timeout:25000});
 await p.waitForFunction(()=>document.querySelector('.filter-btn[data-filter="3"]')?.classList.contains('active'),{timeout:5000});
 assert.equal(await p.evaluate(()=>HSKLearningFilter.level),'3');
 await p.evaluate(()=>HSKStudio.navigate('lessons'));
 await p.waitForFunction(()=>document.getElementById('lessonsPanel').dataset.lessonLevel==='3');
 await p.locator('#lessonsContent h3').filter({hasText:'HSK 3'}).waitFor({state:'visible',timeout:12000});
 await p.evaluate(()=>HSKStudio.navigate('learn'));
 assert.equal(await p.locator('#mobileLevel').inputValue(),'3');
 // Manual filter choices remain until the actual study goal changes.
 await p.locator('.filter-btn[data-filter="2"]').first().evaluate(x=>x.click());
 assert.equal(await p.evaluate(()=>HSKLearningFilter.level),'2');
 await p.evaluate(()=>window.dispatchEvent(new Event('hsk-plan-change')));
 assert.equal(await p.evaluate(()=>HSKLearningFilter.level),'2');
 assert.equal(await p.evaluate(()=>window.HSKPlanner.setTarget(4)),true);
 await p.waitForFunction(()=>window.HSKLearningFilter.level==='4');
 await p.evaluate(()=>HSKStudio.navigate('lessons'));
 await p.waitForFunction(()=>document.getElementById('lessonsPanel').dataset.lessonLevel==='4');
 await p.locator('#lessonsContent h3').filter({hasText:'HSK 4'}).waitFor({state:'visible',timeout:12000});
 await p.evaluate(()=>HSKStudio.navigate('learn'));
 assert.equal(await p.locator('#mobileLevel').inputValue(),'4');
 assert.deepEqual(errors,[]);
 console.log('PASS goal scope '+width+'px: initial HSK3; manual HSK2 retained; target HSK4 resynced');
 await p.close();
}
}finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
