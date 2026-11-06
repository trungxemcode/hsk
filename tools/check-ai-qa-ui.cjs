const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),http=require('http'),assert=require('node:assert/strict');
(async()=>{
 const root=process.cwd(),server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
 try{browser=await chromium.launch({executablePath:process.env.CHROME_EXECUTABLE});for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:844},isMobile:width<721,hasTouch:width<721,serviceWorkers:'block'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>r.abort());await page.route('**/account-config.json',r=>r.fulfill({contentType:'application/json',body:'{"enabled":false}'}));await page.route('**/translation-config.json',r=>r.fulfill({json:{enabled:true,endpoint:'https://ai.test/translate'}}));let received=null;
  await page.route('https://ai.test/lesson-ask',async r=>{received=r.request().postDataJSON();return r.fulfill({json:{answer:'Bạn đã có nền tảng tốt. Hãy chuyển sang một thử thách mới có ích.'}});});
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{waitUntil:'domcontentloaded',timeout:60000});
  // Studio navigation intentionally stays gated until the real lesson/data boot
  // completes. Waiting only for the shell API races that gate and leaves the
  // route hidden on slower local or bundled-browser runs.
  await page.waitForFunction(()=>window.HSKStudio&&window.HSKAIQACore&&window.HSKLessons&&document.querySelector('#appLoadStatus')?.hidden,null,{timeout:90000});
  await page.evaluate(()=>{window.__qaWrites=[];window.__qaEmit=null;const api={db:{},collection:(_db,...path)=>({path}),doc:(ref,id)=>({path:[...(ref.path||[]),id]}),serverTimestamp:()=>({serverTimestamp:true}),setDoc:async(ref,data)=>window.__qaWrites.push({ref,data}),onSnapshot:(_ref,callback)=>{window.__qaEmit=rows=>callback({docs:rows.map(row=>({data:()=>row}))});window.__qaInitial=()=>callback({docs:[]});return ()=>{window.__qaEmit=null;}}};window.HSKAccountDashboard={user:{uid:'qa-user',getIdToken:async()=> 'test-token'},api};window.dispatchEvent(new Event('hsk-account-ready'));window.HSKStudio.navigate('ai-qa');});
  assert.equal(await page.evaluate(()=>window.__qaWrites.length),0,'do not overwrite remote conversations before first Firestore snapshot');
  await page.evaluate(()=>window.__qaInitial());
  await page.locator('#aiQaPanel').waitFor({state:'visible'});
  const layoutMetrics=await page.evaluate(()=>Object.fromEntries(['main.workspace','#aiQaPanel','.ai-qa-shell','.ai-qa-chat','.ai-qa-messages','#aiQaForm','#aiQaStatus','.ai-qa-boundary-note'].map(selector=>{const element=document.querySelector(selector),r=element.getBoundingClientRect(),style=getComputedStyle(element);return [selector,{top:Math.round(r.top),bottom:Math.round(r.bottom),height:Math.round(r.height),clientHeight:element.clientHeight,scrollHeight:element.scrollHeight,display:style.display,overflow:style.overflowY,viewport:innerHeight}];})));
  if(width<721){
    assert.equal(layoutMetrics['#aiQaStatus'].display,'none','mobile chat should hide idle helper');
    assert.equal(layoutMetrics['.ai-qa-boundary-note'].display,'none','mobile boundary helper is hidden');
    await page.evaluate(()=>document.getElementById('aiQaStatus').textContent='Gia sư AI chưa trả lời được. Hãy thử lại.');
    assert.equal(await page.locator('#aiQaStatus').isVisible(),true,'mobile error status must be visible');
    assert.match(await page.locator('#aiQaStatus').innerText(),/Gia sư AI chưa trả lời được/);
    await page.evaluate(()=>document.getElementById('aiQaStatus').textContent='');
  }else{
    assert.notEqual(layoutMetrics['#aiQaStatus'].display,'none','AI status must remain visible on desktop');
    assert.notEqual(layoutMetrics['.ai-qa-boundary-note'].display,'none','desktop learning note must remain visible');
  }
  assert.equal(layoutMetrics['.ai-qa-messages'].overflow,'auto','messages must scroll independently');
  assert.ok(layoutMetrics['#aiQaForm'].bottom<=layoutMetrics['#aiQaForm'].viewport-12,'composer must fit inside the viewport');
  assert.ok(layoutMetrics['#aiQaPanel'].bottom<=layoutMetrics['#aiQaPanel'].viewport,'chat panel must not overflow the viewport');
  if(width===390){await page.setViewportSize({width:320,height:640});const tiny=await page.evaluate(()=>{const f=document.querySelector('#aiQaForm').getBoundingClientRect(),m=document.querySelector('.ai-qa-messages').getBoundingClientRect();return {composerTop:f.top,composerBottom:f.bottom,viewport:innerHeight,messagesHeight:m.height}});assert.ok(tiny.composerBottom<tiny.viewport-30&&tiny.messagesHeight>=40,'320px short viewport still shows a usable composer and scroll area');await page.setViewportSize({width:390,height:844});}
assert.equal(await page.locator('[data-studio-go="ai-qa"]').count()>=1,true);assert.equal(await page.locator('#aiQaReview').count(),0);assert.equal(await page.locator('#aiQaClear').count(),0);assert.match(await page.locator('#aiQaSnapshot').innerText(),/HSK/);await page.locator('#aiQaInput').fill('Đánh giá lộ trình của tôi');await page.locator('#aiQaSend').click();await page.locator('.ai-qa-message.assistant').waitFor();assert.ok(await page.evaluate(()=>window.__qaWrites.length>=1),'chat is written to realtime storage');assert.equal(received.lesson.content.mode,'ai-qa');assert.ok(received.lesson.content.learning_snapshot.masteryBoundary);assert.match(await page.locator('#aiQaMessages').innerText(),/Bạn đã có nền tảng tốt/);await page.evaluate(()=>window.__qaEmit([{id:'chat-remote',title:'Chat từ điện thoại',messages:[{id:'remote-1',role:'user',text:'Tin nhắn từ điện thoại',createdAt:Date.now()}],createdAt:Date.now(),updatedAt:Date.now(),deleted:false}]));await page.locator('#aiQaHistoryToggle').click();await page.locator('#aiQaHistory').waitFor({state:'visible'});assert.ok(await page.locator('.ai-qa-conversation').count()>=2,'realtime listener merges the other device');assert.ok((await page.locator('.ai-qa-conversation').allTextContents()).some(text=>text.includes('Chat từ điện thoại')));await page.locator('.ai-qa-conversation-more').first().click();assert.equal(await page.locator('.ai-qa-conversation-menu').first().isVisible(),true);await page.locator('#aiQaHistoryClose').click();  // Regression: changing chats during a stalled request must abort the stale request,
  // unlock the composer, and prevent the earlier response from overwriting new chat.
  await page.evaluate(()=>{
    const original=window.fetch;
    window.__qaWaiting=false;window.__qaAborted=false;
    window.fetch=(url,opts)=>String(url).includes('/lesson-ask')?new Promise((_,reject)=>{
      window.__qaWaiting=true;
      opts.signal.addEventListener('abort',()=>{
        window.__qaAborted=true;
        reject(new DOMException('Canceled','AbortError'));
      },{once:true});
    }):original(url,opts);
  });
  await page.locator('#aiQaInput').fill('Câu hỏi đang xử lý');
  await page.locator('#aiQaSend').click();
  await page.waitForFunction(()=>window.__qaWaiting&&document.getElementById('aiQaSend').disabled);
  await page.locator('#aiQaHistoryToggle').click();
  await page.locator('#aiQaNewChat').click();
  assert.equal(await page.evaluate(()=>window.__qaAborted),true,'stale request must abort');
  assert.equal(await page.locator('#aiQaSend').isEnabled(),true,'send restored after chat switch');
  assert.equal(await page.locator('#aiQaInput').isEnabled(),true,'composer restored after chat switch');
assert.deepEqual(errors,[]);console.log('PASS AI Q&A',width,'realtime sync, chat layout, history menu, bounded snapshot, request, response');await page.close();
 }}finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
