// Regression for active lookup subtab: selection follows the visible panel on mobile and desktop.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
(async()=>{
 const root=process.cwd(),server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');
  res.end(fs.readFileSync(file));
 });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
 try{
  for(const width of [320,390,1440]){
   const page=await browser.newPage({viewport:{width,height:844},isMobile:width<721,hasTouch:width<721,serviceWorkers:'block'}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://**/*',r=>r.abort());
   await page.route('**/account-config.json',r=>r.fulfill({contentType:'application/json',body:'{"enabled":false}'}));
   await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');
   await page.waitForFunction(()=>!!window.HSKStudio&&!!window.HSKLessons,{timeout:25000});
   for(const theme of ['light','dark']){
    await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;window.HSKStudio.navigate('search')},theme);
    async function check(mode){
     const selected=mode==='search'?'search':'translator';
     const panel='#'+(mode==='search'?'searchPanel':'translatorPanel');
     assert.equal(await page.locator(panel).isVisible(),true,mode+' panel visible');
     for(const tab of ['vocabulary','handwriting','translate','image']){
      const button=page.locator(panel+' .studio-search-tabs [data-search-tool="'+tab+'"]');
      assert.equal(await button.getAttribute('aria-pressed'),String(tab===(selected==='search'?'vocabulary':'translate')),mode+'/'+tab+' aria-pressed');
      assert.equal(await button.evaluate(el=>el.classList.contains('active')),tab===(selected==='search'?'vocabulary':'translate'),mode+'/'+tab+' active class');
     }
     const buttons=page.locator(panel+' .studio-search-tabs button');
     await page.evaluate(()=>document.activeElement?.blur?.());
     // CSS color transitions may not settle at the same speed on headless Chrome/CI.
     // Wait for actual visual contrast rather than asserting in the first animation frame.
     await page.waitForFunction(selector=>{
      const buttons=[...document.querySelectorAll(selector)];
      const active=buttons.find(b=>b.getAttribute('aria-pressed')==='true'),idle=buttons.find(b=>b.getAttribute('aria-pressed')==='false');return buttons.length===4&&active&&idle&&getComputedStyle(active).backgroundColor!==getComputedStyle(idle).backgroundColor;
     },panel+' .studio-search-tabs button',{timeout:4000});
     const colors=await buttons.evaluateAll(bs=>bs.map(el=>getComputedStyle(el).backgroundColor));
     assert.notEqual(colors[mode==='search'?0:2],colors[mode==='search'?2:0],mode+' visually distinguishes chosen tab');
     const chosen=await buttons.nth(mode==='search'?0:2).getAttribute('aria-current');
     assert.equal(chosen,'page',mode+' current');
     const nav=page.locator(width<721?'#mobileDock [data-studio-go="search"]':'.sidebar [data-studio-go="search"]');
     assert.equal(await nav.evaluate(el=>el.classList.contains('active')),true,'parent search stays selected');
    }
    await check('search');
    const tabs=page.locator('#searchPanel .studio-search-tabs button'),boxes=await tabs.evaluateAll(bs=>bs.map(b=>{const r=b.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};}));
    assert.equal(boxes.length,4);assert(boxes.every(b=>Math.abs(b.y-boxes[0].y)<1&&b.h>=44),'four compact buttons on one row');
    assert(boxes[3].x+boxes[3].w<=width,'tools fit the viewport');
    await page.locator('#handwritingOpen').click();await page.waitForFunction(()=>document.body.dataset.searchTool==='handwriting');
    assert.equal(await page.locator('#handwritingOptions').getAttribute('open'),null,'secondary controls collapsed');
    assert.equal(await page.locator('#handwritingCandidates').isVisible(),false,'empty results do not reserve a blank toolbar');
    if(width<721){assert.equal(await page.locator('.mobile-focus-bar progress').isVisible(),false,'drawing has no fake session progress');assert.equal(await page.locator('.handwriting-head').isVisible(),true,'drawing keeps its own compact close/title bar');assert.equal(await page.locator('.mobile-focus-bar').isVisible(),false,'no duplicate focus header');}
    assert.equal(await page.locator('#handwritingCanvas').isVisible(),true);assert.equal(await page.locator('.dictionary-modes').isVisible(),false);assert.equal(await page.locator('#searchForm').isVisible(),false);
    assert.equal(await page.locator('#handwritingOpen').getAttribute('aria-pressed'),'true');
    if(process.env.HSK_SCREENSHOT_DIR&&width===390&&theme==='light'){fs.mkdirSync(process.env.HSK_SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.HSK_SCREENSHOT_DIR,'search-four-tools.png')});}
    const canvas=await page.locator('#handwritingCanvas').boundingBox();assert(canvas.width<=300&&canvas.height<=300,'drawing canvas stays compact');
    await page.mouse.move(canvas.x+canvas.width*.25,canvas.y+canvas.height*.25);await page.mouse.down();await page.mouse.move(canvas.x+canvas.width*.7,canvas.y+canvas.height*.7,{steps:8});await page.mouse.up();
    assert.equal(await page.locator('#handwritingUndo').isDisabled(),false,'real stroke enables undo');await page.waitForFunction(()=>!document.getElementById('handwritingRecognize').disabled);assert.equal(await page.locator('#handwritingRecognize').isDisabled(),false);
    await page.locator('#handwritingClear').click();assert.equal(await page.locator('#handwritingUndo').isDisabled(),true,'clear resets drawing state');
    await page.locator('#handwritingOptions>summary').click();assert.equal(await page.locator('#handwritingForget').isVisible(),true,'sample controls remain reachable');await page.locator('#handwritingOptions>summary').click();
    await page.locator('#handwritingClose').click();await check('search');
    await page.locator('#searchPanel [data-search-tool="image"]').click();await page.waitForFunction(()=>document.body.dataset.searchTool==='image');
    assert.equal(await page.locator('#ocrChoose').isVisible(),true);assert.equal(await page.locator('#translationForm').isVisible(),false);
    assert.equal(await page.locator('#translatorPanel [data-search-tool="image"]').getAttribute('aria-pressed'),'true');
    const picker=page.waitForEvent('filechooser');await page.locator('#ocrChoose').click();await (await picker).setFiles([]);
    await page.evaluate(()=>{document.getElementById('ocrOutput').hidden=false;document.getElementById('ocrText').value='你好';});
    await page.locator('#ocrUse').click();await check('translator');
    assert.equal(await page.locator('#translationInput').inputValue(),'你好','OCR text still transfers into translation');

    assert.equal(await page.locator('#translationForm').isVisible(),true);assert.equal(await page.locator('.ocr-panel').isVisible(),false);
    await page.locator('#translatorPanel [data-search-tool="vocabulary"]').click();await check('search');
    await page.locator('#searchPanel .studio-search-tabs [data-studio-go="translator"]').click();
    await check('translator');
    await page.locator('#translatorPanel .studio-search-tabs [data-studio-go="search"]').click();
    await check('search');
    await page.evaluate(()=>window.HSKStudio.navigate('translator'));
    await check('translator');
   }
   assert.deepEqual(errors,[], 'no page script errors');
   console.log('PASS search subtabs '+width+'px both themes and navigation');
   await page.close();
  }
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
