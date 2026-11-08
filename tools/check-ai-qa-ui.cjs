const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),http=require('http'),assert=require('node:assert/strict');
(async()=>{
 const root=process.cwd(),server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
 try{browser=await chromium.launch({executablePath:process.env.CHROME_EXECUTABLE});for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:844},isMobile:width<721,hasTouch:width<721,serviceWorkers:'block'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>r.abort());await page.route('**/account-config.json',r=>r.fulfill({contentType:'application/json',body:'{"enabled":false}'}));await page.route('**/translation-config.json',r=>r.fulfill({json:{enabled:true,endpoint:'https://ai.test/translate'}}));let received=null;
  await page.route('https://ai.test/lesson-ask',async r=>{received=r.request().postDataJSON();return r.fulfill({json:{answer:'Bạn đã có nền tảng tốt. Hãy chuyển sang một thử thách mới có ích.',primaryNodeKey:'grammar:contrast',nodeLabel:'So sánh',suggestedQuestions:[{kind:'context_shift',text:'Cho ví dụ với tình huống đời thường khác nhé?'}]}});});
  let chatRole='regular';
  await page.route('https://ai.test/account-role',route=>route.fulfill({json:{account:{role:chatRole}}}));
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{waitUntil:'domcontentloaded',timeout:60000});
  // Studio navigation intentionally stays gated until the real lesson/data boot
  // completes. Waiting only for the shell API races that gate and leaves the
  // route hidden on slower local or bundled-browser runs.
  await page.waitForFunction(()=>window.HSKStudio&&window.HSKAIQACore&&window.HSKLessons&&document.querySelector('#appLoadStatus')?.hidden,null,{timeout:90000});
  await page.evaluate(()=>{window.__qaWrites=[];window.__qaEmit=null;const api={db:{},collection:(_db,...path)=>({path}),doc:(ref,id)=>({path:[...(ref.path||[]),id]}),serverTimestamp:()=>({serverTimestamp:true}),setDoc:async(ref,data)=>window.__qaWrites.push({ref,data}),onSnapshot:(_ref,callback)=>{window.__qaEmit=rows=>callback({docs:rows.map(row=>({data:()=>row}))});window.__qaInitial=()=>callback({docs:[]});return ()=>{window.__qaEmit=null;}}};window.HSKAccountDashboard={user:{uid:'qa-user',getIdToken:async()=> 'test-token'},api};window.dispatchEvent(new Event('hsk-account-ready'));window.HSKStudio.navigate('ai-qa');});
  assert.equal(await page.evaluate(()=>window.__qaWrites.length),0,'do not overwrite remote conversations before first Firestore snapshot');
  await page.evaluate(()=>window.__qaInitial());
  await page.locator('#aiQaPanel').waitFor({state:'visible'});
  const thinking=page.locator('#aiQaThinking');
  assert.equal(await thinking.inputValue(),'low');
  assert.ok(await thinking.isDisabled(),'regular chat is locked to Low');
  chatRole='vip';
  await page.evaluate(()=>window.dispatchEvent(new Event('hsk-ai-qa-open')));
  await page.waitForFunction(()=>!document.getElementById('aiQaThinking').disabled);
  await thinking.selectOption('medium');
  assert.equal(await page.locator('#qaProjectThinking').inputValue(),'medium');
  if(width===390){
    for(const [mobileWidth,mobileHeight] of [[320,640],[390,844],[430,932]]){
      await page.setViewportSize({width:mobileWidth,height:mobileHeight});
      // ResizeObserver publishes the dock's BORDER-box height asynchronously.
      // Compare final geometry after that update, not an intermediate viewport
      // frame; this still times out on a real dock/composer overlap regression.
      await page.waitForFunction(()=>{
        const rect=selector=>document.querySelector(selector).getBoundingClientRect();
        const dock=rect('#mobileDock'),shell=rect('.app-shell'),
          panel=rect('#aiQaPanel'),form=rect('#aiQaForm');
        return dock.height>0&&Math.abs(shell.bottom-dock.top)<=2&&
          Math.abs(panel.bottom-dock.top)<=2&&Math.abs(dock.top-form.bottom-8)<=2;
      },null,{timeout:10000});
      const geom=await page.evaluate(()=>{
        const bounds=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right};};
        const msg=document.querySelector('#aiQaMessages');
        return {dock:bounds('#mobileDock'),shell:bounds('.app-shell'),panel:bounds('#aiQaPanel'),
          form:bounds('#aiQaForm'),empty:bounds('#aiQaEmpty'),messages:bounds('#aiQaMessages'),
          formPosition:getComputedStyle(document.querySelector('#aiQaForm')).position,
          messageOverflow:getComputedStyle(msg).overflowY,
          viewport:window.innerHeight};
      });
      assert.ok(Math.abs(geom.shell.bottom-geom.dock.top)<=2,
        'mobile app shell must end at dock top, not extend behind dock at '+mobileWidth+': '+JSON.stringify(geom));
      assert.ok(Math.abs(geom.panel.bottom-geom.dock.top)<=2,
        'mobile chat panel must fit inside shell above dock at '+mobileWidth+': '+JSON.stringify(geom));
      assert.ok(Math.abs(geom.dock.top-geom.form.bottom-8)<=2,
        'mobile input must stay 8px above dock at '+mobileWidth+': '+JSON.stringify(geom));
      assert.ok(geom.empty.bottom < geom.form.top,
        'welcome heading cannot be hidden by input: '+JSON.stringify(geom));
      assert.ok(geom.messages.bottom<=geom.form.top+1,
        'scrolling messages must not hide behind input: '+JSON.stringify(geom));
      assert.equal(geom.formPosition,'relative','iOS keyboard-safe composer stays in chat flow');
      assert.equal(geom.messageOverflow,'auto','messages scroll independently');
    }
    // Regression: the real iPhone dock can grow when safe-area padding changes.
    // Observe its border box, not only its content box, or the chat is covered.
    await page.setViewportSize({width:390,height:844});
    await page.evaluate(()=>document.getElementById('mobileDock').style.setProperty('padding-bottom','42px','important'));
    await page.waitForFunction(()=>{
      const dock=document.getElementById('mobileDock').getBoundingClientRect(),
        shell=document.querySelector('.app-shell').getBoundingClientRect(),
        form=document.getElementById('aiQaForm').getBoundingClientRect();
      return dock.height>=100&&Math.abs(shell.bottom-dock.top)<=2&&Math.abs(dock.top-form.bottom-8)<=2;
    },null,{timeout:10000});
    await page.evaluate(()=>document.getElementById('mobileDock').style.removeProperty('padding-bottom'));
    await page.waitForFunction(()=>{
      const dock=document.getElementById('mobileDock').getBoundingClientRect(),
        shell=document.querySelector('.app-shell').getBoundingClientRect();
      return Math.abs(shell.bottom-dock.top)<=2;
    },null,{timeout:10000});
    await page.setViewportSize({width,height:844});
  }

  assert.equal(await page.locator('.ai-qa-conversation').count(),0,
    'new account does not create a phantom empty chat');
  assert.equal((await page.locator('#aiQaConversationTitle').textContent()).trim(),'Hỏi đáp AI');
  assert.equal(await page.locator('#aiQaEmpty').isVisible(),true,
    'show welcome until the first submitted question');
  // The add-new-chat action must not consume an ID or write empty conversations.
  await page.evaluate(()=>document.getElementById('aiQaNewChat').click());
  assert.equal(await page.locator('.ai-qa-conversation').count(),0,
    'new chat draft remains unsaved until the learner asks a question');
  assert.equal(await page.locator('#aiQaEmpty').isVisible(),true);
  assert.equal(await page.evaluate(()=>window.__qaWrites.length),0,
    'no empty conversation written to Firestore');
  const pinnedIntent=await page.evaluate(()=>{
    const registry=new Map([['latest',{aiMessageId:'latest',nodeLabel:'Từ vựng'}]]);
    try{HSKQaIntentRouter.resolveTargetMessageAndIntent({userText:'Ví dụ khác',
      explicitAction:'another_example',explicitTargetAiMessageId:'missing',
      aiMessageRegistry:registry});return 'accepted';}catch{return 'rejected';}
  });
  assert.equal(pinnedIntent,'rejected','an unknown explicit AI feedback target must not silently choose latest');

  // The cloud Designer can still serve a legacy fixed root width and manually
  // translated send button; client CSS must preserve responsive geometry.
  await page.addStyleTag({content:`@media (min-width:721px){
    html body.studio-enabled:not(.mobile-ux)[data-studio-hub="ai-qa"] #aiQaPanel#aiQaPanel#aiQaPanel{width:1130px!important;}
  }
  html body.studio-enabled[data-studio-hub="ai-qa"] #aiQaPanel#aiQaPanel#aiQaPanel #aiQaSend{translate:-5px -5px!important;padding-top:10px!important;}`});
  if(width>=721)await page.addStyleTag({content:`html body.studio-enabled:not(.mobile-ux)[data-studio-hub="ai-qa"] #aiQaPanel#aiQaPanel#aiQaPanel #aiQaForm{
    width:708px!important;translate:163px -6px!important;left:24px!important;right:24px!important;}`});
  if(width<721)await page.addStyleTag({content:`
    html body.studio-enabled[data-studio-hub="ai-qa"] #aiQaPanel#aiQaPanel#aiQaPanel #aiQaMessages{
      height:900px!important;min-height:900px!important;
    }
    html body.studio-enabled[data-studio-hub="ai-qa"] #aiQaPanel#aiQaPanel#aiQaPanel #aiQaEmpty{
      min-height:700px!important;translate:0 80px!important;
    }
    html body.studio-enabled[data-studio-hub="ai-qa"] #aiQaPanel#aiQaPanel#aiQaPanel #aiQaForm{
      height:120px!important;translate:0 160px!important;
    }
  `});
  async function assertMobileComposerReachable(){
    const hit=await page.evaluate(()=>{
      const field=document.getElementById('aiQaInput');
      const rect=field.getBoundingClientRect();
      const top=document.getElementById('mobileDock').getBoundingClientRect().top;
      const target=document.elementFromPoint(rect.left+rect.width/2,rect.top+rect.height/2);
      return {editable:target===field&&!field.disabled,aboveDock:rect.bottom<top};
    });
    assert.deepEqual(hit,{editable:true,aboveDock:true},'the input is visible and tappable above the dock');
  }
  if(width<721)await assertMobileComposerReachable();
  const sendGeometry=await page.evaluate(()=>{
    const button=document.querySelector('#aiQaSend'),arrow=button.querySelector('svg');
    if(!arrow)throw Error('Chat AI send icon must be an SVG');
    const b=button.getBoundingClientRect(),i=arrow.getBoundingClientRect();
    return {dx:i.x+i.width/2-b.x-b.width/2,dy:i.y+i.height/2-b.y-b.height/2,padding:getComputedStyle(button).paddingTop,translate:getComputedStyle(button).translate};
  });
  assert.ok(Math.abs(sendGeometry.dx)<1&&Math.abs(sendGeometry.dy)<1,'send arrow must stay precisely centered: '+JSON.stringify(sendGeometry));
  assert.equal(sendGeometry.padding,'0px','legacy Designer padding cannot shift the send arrow');
  assert.equal(sendGeometry.translate,'none','legacy Designer offset cannot translate the send button');
  if(width>=721){
    await page.waitForTimeout(400); // panel-enter animation must settle before measuring
    for(const [screenWidth,screenHeight] of [[1440,844],[1775,900],[1280,720]]){
      await page.setViewportSize({width:screenWidth,height:screenHeight});
      const gutters=await page.evaluate(()=>{
        const frame=document.querySelector('.app-area').getBoundingClientRect();
        const topbar=document.querySelector('#studioHeader').getBoundingClientRect();
        const panel=document.querySelector('#aiQaPanel').getBoundingClientRect();
        return {top:panel.top-topbar.bottom,left:panel.left-frame.left,right:frame.right-panel.right,
          bottom:frame.bottom-panel.bottom,bodyY:getComputedStyle(document.body).overflowY,
          messageY:getComputedStyle(document.querySelector('.ai-qa-messages')).overflowY,
          historyY:getComputedStyle(document.querySelector('.ai-qa-sidebar-content')).overflowY};
      });
      for(const edge of ['top','left','right','bottom'])assert.ok(Math.abs(gutters[edge]-20)<2,
        'desktop Chat AI '+edge+' gutter at '+screenWidth+'×'+screenHeight+' must match 20px: '+JSON.stringify(gutters));
      assert.equal(gutters.bodyY,'hidden','outer page does not scroll');
      assert.equal(gutters.messageY,'auto','message content remains scrollable');
      assert.equal(gutters.historyY,'auto','conversation history remains scrollable');
      const welcome=await page.evaluate(()=>{
        const rect=selector=>document.querySelector(selector).getBoundingClientRect();
        const chat=rect('.ai-qa-chat'),header=rect('.ai-qa-chatbar');
        const intro=rect('#aiQaEmpty'),form=rect('#aiQaForm'),note=rect('.ai-qa-boundary-note');
        return {
          gap:form.top-intro.bottom,
          centerOffset:form.top+form.height/2-(header.bottom+chat.bottom)/2,
          introAlignment:intro.left-form.left,
          noteAlignment:note.left-form.left,
          noteGap:note.top-form.bottom,
        };
      });
      assert.ok(welcome.gap>=0&&welcome.gap<=24,'welcome and composer stay together: '+JSON.stringify(welcome));
      assert.ok(Math.abs(welcome.centerOffset)<50,'new chat composer sits near the center of the chat pane');
      assert.ok(Math.abs(welcome.introAlignment)<2&&Math.abs(welcome.noteAlignment)<2&&welcome.noteGap>=0,
        'welcome, composer and note share a column and do not overlap');
    }
    await page.setViewportSize({width,height:844});
  }
  const themeColors=await page.evaluate(async()=>{
    const html=document.documentElement,prior=html.getAttribute('data-theme'),panel=document.getElementById('aiQaPanel');
    // The app animates theme changes: wait for the final computed color,
    // otherwise an in-between animation frame causes nondeterministic CI failures.
    const waitForColor=async(expected)=>{
      const deadline=performance.now()+3000;
      while(performance.now()<deadline){
        const actual=getComputedStyle(panel).backgroundColor;
        if(actual===expected)return actual;
        await new Promise(resolve=>setTimeout(resolve,70));
      }
      return getComputedStyle(panel).backgroundColor;
    };
    html.setAttribute('data-theme','light');
    const light=await waitForColor('rgb(244, 244, 250)');
    html.setAttribute('data-theme','dark');
    const dark=await waitForColor('rgb(33, 33, 33)');
    if(prior===null)html.removeAttribute('data-theme');else html.setAttribute('data-theme',prior);
    return {light,dark};
  });
  assert.notEqual(themeColors.light,themeColors.dark,'AI chat needs distinct light/dark palettes');
  assert.equal(themeColors.dark,'rgb(33, 33, 33)','dark AI chat uses the neutral design token');
  const layoutMetrics=await page.evaluate(()=>Object.fromEntries(['main.workspace','#aiQaPanel','.ai-qa-shell','.ai-qa-chat','.ai-qa-messages','#aiQaForm','#aiQaStatus','.ai-qa-boundary-note'].map(selector=>{const element=document.querySelector(selector),r=element.getBoundingClientRect(),style=getComputedStyle(element);return [selector,{top:Math.round(r.top),bottom:Math.round(r.bottom),height:Math.round(r.height),clientHeight:element.clientHeight,scrollHeight:element.scrollHeight,display:style.display,overflow:style.overflowY,viewport:innerHeight}];})));
  if(width<721){assert.equal(layoutMetrics['#aiQaStatus'].display,'none','mobile chat should hide idle helper');assert.equal(layoutMetrics['.ai-qa-boundary-note'].display,'none','mobile boundary helper is hidden');await page.evaluate(()=>document.getElementById('aiQaStatus').textContent='Gia sư AI chưa trả lời được. Hãy thử lại.');assert.equal(await page.locator('#aiQaStatus').isVisible(),true,'mobile error status must be visible');assert.match(await page.locator('#aiQaStatus').innerText(),/Gia sư AI chưa trả lời được/);await page.evaluate(()=>document.getElementById('aiQaStatus').textContent='');}else{assert.notEqual(layoutMetrics['#aiQaStatus'].display,'none','AI status must remain visible on desktop');assert.notEqual(layoutMetrics['.ai-qa-boundary-note'].display,'none','desktop learning note must remain visible');}
  assert.equal(layoutMetrics['.ai-qa-messages'].overflow,'auto','messages must scroll independently');
  assert.ok(layoutMetrics['#aiQaForm'].bottom<=layoutMetrics['#aiQaForm'].viewport-12,'composer must fit inside the viewport');
  assert.ok(layoutMetrics['#aiQaPanel'].bottom<=layoutMetrics['#aiQaPanel'].viewport,'chat panel must not overflow the viewport');
  if(width===390){await page.setViewportSize({width:320,height:640});const tiny=await page.evaluate(()=>{const f=document.querySelector('#aiQaForm').getBoundingClientRect(),m=document.querySelector('.ai-qa-messages').getBoundingClientRect();return {composerTop:f.top,composerBottom:f.bottom,viewport:innerHeight,messagesHeight:m.height}});assert.ok(tiny.composerBottom<tiny.viewport-30&&tiny.messagesHeight>=40,'320px short viewport still shows a usable composer and scroll area');await page.setViewportSize({width:390,height:844});}
assert.equal(await page.locator('[data-studio-go="ai-qa"]').count()>=1,true);assert.equal(await page.locator('#aiQaReview').count(),0);assert.equal(await page.locator('#aiQaClear').count(),0);assert.match(await page.locator('#aiQaSnapshot').innerText(),/HSK/);await page.locator('#aiQaInput').fill('Đánh giá lộ trình của tôi');await page.locator('#aiQaSend').click();await page.locator('.ai-qa-message.assistant').waitFor();
  assert.equal(await page.locator('.ai-qa-conversation').count(),1,
    'first question creates exactly one persistent conversation');
  assert.equal(await page.locator('#aiQaEmpty').isVisible(),false,'welcome hides after first question');
  const jump=page.locator('#aiQaJumpToLatest');
  await page.evaluate(()=>{
    const messages=document.getElementById('aiQaMessages');
    messages.lastElementChild.style.minHeight='1500px';
    messages.scrollTo({top:0,behavior:'instant'});
    messages.dispatchEvent(new Event('scroll'));
  });
  await jump.waitFor({state:'visible'});
  const jumpBounds=await jump.boundingBox(),composerBounds=await page.locator('#aiQaForm').boundingBox();
  assert.ok(jumpBounds.y+jumpBounds.height<=composerBounds.y,'jump button sits above the composer');
  if(width>=721){
    const distance=await page.evaluate(()=>{
      HSKStudio.navigate('home');
      HSKStudio.navigate('ai-qa');
      const messages=document.getElementById('aiQaMessages');
      return messages.scrollHeight-messages.clientHeight-messages.scrollTop;
    });
    assert.ok(distance<=2,'returning to chat immediately lands at the bottom');
    assert.equal(await jump.isVisible(),false);
    await page.locator('#aiQaMessages').evaluate(messages=>messages.scrollTo({top:0,behavior:'instant'}));
    await jump.waitFor({state:'visible'});
  }
  await jump.click();
  assert.ok(await page.locator('#aiQaMessages').evaluate(messages=>
    messages.scrollHeight-messages.clientHeight-messages.scrollTop<=2),'jump button reaches the latest message');
  assert.equal(await jump.isVisible(),false);
  await page.locator('#aiQaMessages').evaluate(messages=>messages.lastElementChild.style.removeProperty('min-height'));

  if(width===390){
    await page.waitForFunction(()=>!document.getElementById("aiQaInput").disabled);
    await assertMobileComposerReachable();
    const mobileLayout=await page.evaluate(()=>{
      const messages=document.getElementById('aiQaMessages');
      const rect=selector=>document.querySelector(selector).getBoundingClientRect();
      const chat=rect('.ai-qa-chat'),form=rect('#aiQaForm'),dock=rect('#mobileDock');
      const answer=rect('.ai-qa-message.assistant'),scrollStyle=getComputedStyle(messages);
      return {
        left:answer.left-chat.left,right:chat.right-answer.right,
        dockGap:dock.top-form.bottom,
        scrollbar:scrollStyle.scrollbarWidth,overflow:scrollStyle.overflowY,
        messagesEnd:messages.getBoundingClientRect().bottom,formTop:form.top,
      };
    });
    assert.ok(mobileLayout.left>=16&&mobileLayout.right>=16,'mobile messages leave room on both sides');
    assert.ok(mobileLayout.dockGap>=5&&mobileLayout.dockGap<=16,
      'mobile composer stays just above the dock: '+JSON.stringify(mobileLayout));
    assert.equal(mobileLayout.scrollbar,'none','hide the mobile scrollbar');
    assert.equal(mobileLayout.overflow,'auto','preserve mobile message scrolling');
    assert.ok(mobileLayout.messagesEnd<=mobileLayout.formTop+1,'composer does not cover the message area');
  }
  assert.match(await page.locator('.ai-qa-conversation-open strong').first().textContent(),/Đánh giá lộ trình/);

  if(width>=721){
    for(const viewport of [1280,1440,1775]){
      await page.setViewportSize({width:viewport,height:900});
      const rects=await page.evaluate(()=>{
        const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width};};
        const form=document.getElementById('aiQaForm'),chat=document.querySelector('.ai-qa-chat');
        return {form:rect('#aiQaForm'),assistant:rect('.ai-qa-message.assistant'),
          user:rect('.ai-qa-message.user'),userText:rect('.ai-qa-message.user p'),
          chat:rect('.ai-qa-chat'),formTranslate:getComputedStyle(form).translate,
          scrollMode:getComputedStyle(document.getElementById('aiQaMessages')).scrollBehavior,
          formContainer:getComputedStyle(chat).position};
      });
      assert.ok(Math.abs(rects.form.left-rects.assistant.left)<=2,'AI and input align on left at '+viewport+': '+JSON.stringify(rects));
      assert.ok(Math.abs(rects.form.right-rects.assistant.right)<=2,'AI and input align on right at '+viewport+': '+JSON.stringify(rects));
      assert.ok(Math.abs(rects.user.right-rects.assistant.right)<=2,'User row belongs to same centered column');
      assert.ok(Math.abs(rects.userText.right-rects.assistant.right)<=2,'User bubble right-aligns in the reading column');
      assert.ok(rects.userText.left>rects.assistant.left+30,'User bubble is not aligned to AI text at '+viewport);
      assert.equal(rects.formTranslate,'none','legacy Designer offset must not shift the composer');
      assert.ok(rects.chat.bottom-rects.form.bottom<100,'active chat composer returns to the bottom');
      assert.equal(rects.formContainer,'relative','Composer must be anchored to chat, not entire shell');
      assert.equal(rects.scrollMode,'auto','Conversation restore should not animate while rehydrating');
    }
    await page.setViewportSize({width,height:844});
  }
assert.ok(await page.evaluate(()=>window.__qaWrites.length>=1),'chat is written to realtime storage');assert.equal(received.lesson.content.mode,'ai-qa');assert.equal(received.thinking,'medium');assert.ok(received.lesson.content.learning_snapshot.masteryBoundary);assert.match(await page.locator('#aiQaMessages').innerText(),/Bạn đã có nền tảng tốt/);
   const targetAiId=await page.locator('.ai-qa-message.assistant').first().getAttribute('data-ai-message-id');
   assert.ok(targetAiId,'assistant message has a stable target id');
   assert.equal(await page.locator('.qa-suggestions-group').count(),1,
     'only one fresh answer shows follow-up suggestions');
   await page.locator('.qa-suggestion-row-btn').first().click();
   await page.waitForFunction(()=>document.querySelectorAll('.ai-qa-message.assistant').length===2);
   assert.equal(received.lesson.content.intentInfo.targetAiMessageId,targetAiId,'suggestion must reference the correct AI response');
   assert.equal(received.lesson.content.intentInfo.intent,'edge_case_exploration','context shift suggestion routes to the intended pedagogical branch');
   assert.equal(received.lesson.content.intentInfo.evidencePolicy,'question_only','suggestions must not count as proof of weakness');
   assert.equal(await page.locator('.ai-qa-message.assistant').first().locator('.qa-suggestions-group').count(),0,
     'clicked suggestions disappear from the previous answer');
   assert.equal(await page.locator('.ai-qa-message.assistant').last().locator('.qa-suggestions-group').count(),1,
     'only the newly arrived AI answer gets fresh suggestions');
   await page.locator('#aiQaInput').fill('Tôi đang tự nhập câu hỏi khác');
   assert.equal(await page.locator('.qa-suggestions-group').count(),0,
     'typing immediately dismisses follow-up suggestions on PC and mobile');
   assert.ok(await page.locator('.ai-qa-feedback button').count()>=2,
     'dismissal must retain targeted feedback controls and prior messages');
   await page.locator('#aiQaInput').fill('');
   assert.equal(await page.locator('.qa-suggestions-group').count(),0,
     'clearing the draft must not resurrect old suggestions');
   await page.evaluate(()=>window.__qaEmit([{id:'chat-remote',title:'Chat từ điện thoại',messages:[{id:'remote-1',role:'user',text:'Tin nhắn từ điện thoại',createdAt:Date.now()}],createdAt:Date.now(),updatedAt:Date.now(),deleted:false}]));await page.locator('#aiQaHistoryToggle').click();await page.locator('#aiQaHistory').waitFor({state:'visible'});assert.ok(await page.locator('.ai-qa-conversation').count()>=2,'realtime listener merges the other device');assert.ok((await page.locator('.ai-qa-conversation').allTextContents()).some(text=>text.includes('Chat từ điện thoại')));
  for(const row of [0,1]){
    const more=page.locator('.ai-qa-conversation-more').nth(row);
    await more.click();
    const menu=page.locator('.ai-qa-conversation-menu').nth(row);
    await menu.waitFor({state:'visible'});
    const borders=await menu.locator('button').evaluateAll(buttons=>buttons.map(button=>getComputedStyle(button).borderWidth));
    assert.deepEqual(borders,['0px','0px'],'history menu actions are borderless on every row');
    await more.click();
  }
  await page.locator('#aiQaHistoryClose').click();
  await page.locator('#aiQaHistoryToggle').click();
  await page.locator('.ai-qa-conversation-open').filter({hasText:'Chat từ điện thoại'}).click();
  assert.equal(await page.locator('.qa-suggestions-group').count(),0,
    'opening a synced conversation must not show historical suggestions');
  await page.locator('#aiQaHistoryToggle').click();
  await page.locator('.ai-qa-conversation-open').filter({hasText:'Đánh giá lộ trình'}).click();
  assert.equal(await page.locator('.qa-suggestions-group').count(),0,
    'reopening the original chat must not restore dismissed suggestions');
  // Regression: changing chats during a stalled request must abort the stale request,
  // unlock the composer, and prevent the earlier response from overwriting new chat.
  await page.evaluate(()=>{
    const original=window.fetch;
    window.__qaWaiting=false;window.__qaAborted=false;
    window.fetch=(url,opts)=>String(url).includes('/lesson-ask')&&
      JSON.parse(opts.body).question==='Câu hỏi đang xử lý'?new Promise((_,reject)=>{
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
  assert.equal(await page.locator('#aiQaEmpty').isVisible(),true,'new draft restores welcome after aborting old request');
  assert.equal((await page.locator('#aiQaConversationTitle').textContent()).trim(),'Hỏi đáp AI');
  assert.ok((await page.locator('.ai-qa-conversation').count())>=2,'old conversations are preserved without a new placeholder');

  assert.equal(await page.evaluate(()=>window.__qaAborted),true,'stale request must abort');
  assert.equal(await page.locator('#aiQaSend').isEnabled(),true,'send restored after chat switch');
  assert.equal(await page.locator('#aiQaInput').isEnabled(),true,'composer restored after chat switch');
  if(width<721)await page.locator('#aiQaHistoryToggle').click();
  const createProject=page.getByRole('button',{name:'Tạo dự án',exact:true});
  const sectionToggle=page.locator('#qaProjectSectionToggle');
  const createBounds=await createProject.boundingBox();
  const headingBounds=await sectionToggle.boundingBox();
  assert.ok(Math.abs(createBounds.y-headingBounds.y)<=1,'create icon sits on the Dự án heading row');
  await sectionToggle.click();
  assert.equal(await sectionToggle.getAttribute('aria-expanded'),'false');
  await createProject.click();
  await page.locator('#qaProjectName').fill('Ôn tiếng Trung');
  await page.locator('#qaProjectPrivate').check();
  await page.locator('#qaProjectCreateForm button[type=submit]').click();
  await page.locator('#qaProjectHome').waitFor({state:'visible'});
  await page.locator('#qaProjectSourcesTab').click();
  await page.locator('#qaProjectSourceEmpty').waitFor({state:'visible'});
  assert.equal(await page.locator('#qaProjectLink').isVisible(),false);
  assert.equal(await page.locator('#qaProjectFile').isVisible(),false);
  await page.getByRole('button',{name:'Thêm nguồn',exact:true}).click();
  await page.locator('#qaProjectLink').waitFor({state:'visible'});
  await page.getByRole('button',{name:'Đóng thêm nguồn',exact:true}).click();
  assert.equal(await page.locator('#qaProjectLink').isVisible(),false);
  await page.getByRole('button',{name:'Thêm nguồn',exact:true}).click();
  await page.locator('#qaProjectFile').setInputFiles({
    name:'tu-vung.txt',mimeType:'text/plain',buffer:Buffer.from('生词 dùng để nói về từ mới.')
  });
  await page.getByText('Đã thêm nguồn.',{exact:true}).waitFor();
  assert.equal(await page.locator('#qaProjectSourceEmpty').isVisible(),false);
  await page.route('https://example.test/lesson',route=>route.fulfill({
    contentType:'text/html',headers:{'Access-Control-Allow-Origin':'*'},
    body:'<title>Nguồn tiếng Trung</title><article>生词是新学的词语。</article>'
  }));
  await page.locator('#qaProjectLink').fill('https://example.test/lesson');
  await page.locator('#qaProjectLinkForm button').click();
  await page.getByText('Nguồn tiếng Trung',{exact:true}).waitFor();
  const projectComposer=page.locator('#qaProjectChatForm');
  await projectComposer.getByRole('button',{name:'Đính kèm tệp'}).click();
  await projectComposer.locator('input[type=file]').setInputFiles({
    name:'ghi-chu.txt',mimeType:'text/plain',buffer:Buffer.from('Ghi chú đính kèm dự án')
  });
  await projectComposer.getByText('ghi-chu.txt',{exact:true}).waitFor();
  await page.locator('#qaProjectQuestion').fill('Giải thích từ 生词');
  await page.locator('#qaProjectChatForm button[type=submit]').click();
  await page.locator('.ai-qa-message.assistant').waitFor();
  assert.deepEqual(received.lesson.content.learning_snapshot,{},'private project does not send global study memory');
  const directive=received.lesson.content.intentInfo.directiveVi;
  assert.match(directive,/Ghi chú đính kèm dự án/);
  assert.match(directive,/生词 dùng để nói về từ mới/);
  assert.match(directive,/生词是新学的词语/);
  assert.ok(directive.indexOf('example.test')<directive.indexOf('tu-vung.txt'),'web excerpts precede files');
  await page.locator('#qaProjectBack').click();
  assert.match(await page.locator('#qaProjectChats').innerText(),/Giải thích từ 生词/);
  if(width<721)await page.locator('#qaProjectHistory').click();
  const recent=page.locator('#aiQaConversationList');
  const folder=page.locator('#qaProjectFolders');
  const child=folder.getByRole('button',{name:'Mở Giải thích từ 生词',exact:true});
  const toggle=folder.getByRole('button',{name:'Cuộc trò chuyện trong Ôn tiếng Trung'});
  assert.match(await recent.innerText(),/Chat từ điện thoại/);
  assert.doesNotMatch(await recent.innerText(),/Giải thích từ 生词/);
  await toggle.click();
  await child.waitFor({state:'hidden'});
  await toggle.click();
  const projectCompose=folder.getByRole('button',{name:'Trò chuyện mới trong Ôn tiếng Trung'});
  await projectCompose.click();
  assert.equal(await page.locator('#qaProjectHome').isVisible(),true);
  assert.equal(await page.locator('#qaProjectQuestion').evaluate(input=>document.activeElement===input),true);
  if(width<721)await page.locator('#qaProjectHistory').click();
  await child.click();
  await page.locator('#qaProjectBack').waitFor({state:'visible'});
  if(width<721)await page.locator('#aiQaHistoryToggle').click();
  await recent.getByRole('button',{name:'Mở Chat từ điện thoại',exact:true}).click();
  assert.equal(await page.locator('#qaProjectBack').isVisible(),false);
  if(width<721)await page.locator('#aiQaHistoryToggle').click();
  await child.click();
  if(width<721)await page.locator('#aiQaHistoryToggle').click();
  await page.locator('#aiQaNewChat').click();
  assert.equal(await page.locator('#qaProjectHome').isVisible(),false);
  assert.equal(await page.locator('#aiQaEmpty').isVisible(),true);

  assert.ok(await page.evaluate(()=>!window.__qaWrites.some(({data})=>
    data.title?.includes('Giải thích từ 生词'))),'project chats stay separate from cloud conversations');
  await page.evaluate(()=>localStorage.setItem('hsk-account-meta-v1',JSON.stringify({uid:'qa-user'})));
  const command=async text=>{
    await page.locator('#aiQaInput').fill(text);
    await page.locator('#aiQaSend').click();
  };
  const lastReply=page.locator('#aiQaMessages .assistant').last();
  const composer=page.locator('#aiQaForm');
  const picker=composer.locator('input[type=file]');
  await picker.setInputFiles({name:'bo-qua.txt',mimeType:'text/plain',buffer:Buffer.from('Không gửi đoạn này')});
  await composer.getByText('bo-qua.txt',{exact:true}).waitFor();
  await composer.getByRole('button',{name:'Bỏ tệp đính kèm'}).click();
  assert.equal(await composer.getByText('bo-qua.txt',{exact:true}).isVisible(),false);
  await picker.setInputFiles({name:'bai-hoc.txt',mimeType:'text/plain',buffer:Buffer.from('Nội dung tệp thường')});
  await composer.getByText('bai-hoc.txt',{exact:true}).waitFor();
  await page.locator('#aiQaInput').focus();
  assert.equal(await page.locator('#aiQaInput').evaluate(input=>getComputedStyle(input).outlineStyle),'none');
  await page.locator('#aiQaSend').click();
  await page.getByText('Tệp: bai-hoc.txt',{exact:true}).waitFor();
  await page.waitForFunction(()=>!document.getElementById('aiQaSend').disabled);
  assert.match(received.lesson.content.intentInfo.directiveVi,/Nội dung tệp thường/);
  assert.doesNotMatch(received.lesson.content.intentInfo.directiveVi,/Không gửi đoạn này/);
  const lastRequest=received;
  const knownWord=await page.evaluate(()=>['你','我','学习'].find(han=>HSKDictionaryBridge.lookupExact(han)));
  assert.ok(knownWord,'test requires a word from the offline dictionary');
  await command(`Thêm từ ${knownWord} vào sổ`);
  assert.match(await lastReply.innerText(),/Đã thêm/);
  await command(`Thêm từ ${knownWord} vào sổ`);
  assert.match(await lastReply.innerText(),/đã có/);
  assert.equal(await page.evaluate(han=>Object.values(HSKNotebook.items).filter(item=>item.han===han).length,knownWord),1);
  await page.evaluate(()=>localStorage.setItem('hsk-account-meta-v1',JSON.stringify({uid:'other-user'})));
  await command('Thêm từ 测试词 vào sổ, nghĩa là từ thử nghiệm');
  assert.match(await lastReply.innerText(),/Tài khoản chưa sẵn sàng/);
  assert.equal(await page.evaluate(()=>Object.values(HSKNotebook.items).some(item=>item.han==='测试词')),false);
  await page.evaluate(()=>localStorage.setItem('hsk-account-meta-v1',JSON.stringify({uid:'qa-user'})));
  await command('Mở admin');
  assert.match(await lastReply.innerText(),/chỉ có thể mở công cụ học tập/);
  assert.equal(await page.locator('#aiQaPanel').isVisible(),true);
  await command('Mở sổ từ vựng');
  await page.locator('#notebookPanel').waitFor({state:'visible'});
  assert.equal(received,lastRequest,'app commands never use the model endpoint');
  let savedSettings,settingsAvailable=false;
  await page.route('https://ai.test/personal-ai-settings',route=>{
    if(!settingsAvailable)return route.fulfill({status:404,json:{error:'Không tìm thấy dịch vụ.'}});
    const body=route.request().postDataJSON();
    if(body.op==='save'){
      savedSettings=body.settings;
      return route.fulfill({json:{configured:true,enabled:true,provider:'fosta',model:'gpt-6.1-sol'}});
    }
    return route.fulfill({json:{configured:false,enabled:false}});
  });
  await page.evaluate(()=>HSKStudio.navigate('account'));
  await page.locator('#accountPanel').waitFor({state:'visible'});
  assert.equal(await page.locator('#accountPageTitle').textContent(),'Cài đặt');
  await page.locator('#personalAiLoad').click();
  await page.getByText('Máy chủ Hỏi đáp AI chưa cập nhật chức năng API riêng. Hãy thử lại sau.',{exact:true}).waitFor();
  settingsAvailable=true;
  await page.locator('#personalAiLoad').click();
  await page.locator('#personalAiForm').waitFor({state:'visible'});
  await page.locator('#personalAiEnabled').check();
  await page.locator('#personalAiKey').fill('fake-test-key-only');
  await page.locator('#personalAiForm button[type=submit]').click();
  await page.getByText('Đang dùng API riêng cho Hỏi đáp AI.',{exact:true}).waitFor();
  assert.deepEqual(savedSettings,{provider:'fosta',model:'gpt-6.1-sol',enabled:true,apiKey:'fake-test-key-only'});
  assert.equal(await page.locator('#personalAiKey').inputValue(),'');
  assert.equal(await page.evaluate(()=>JSON.stringify(localStorage).includes('fake-test-key-only')),false);
assert.deepEqual(errors,[]);console.log('PASS AI Q&A',width,'realtime sync, chat layout, history menu, bounded snapshot, request, response');await page.close();
 }}finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
