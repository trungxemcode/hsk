/* In-app Study4 HSK 1-6 exam & listening runner verification (mobile + desktop, light + dark). */
const {chromium}=require('playwright'),fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=process.cwd(),server=http.createServer((req,res)=>{
  const f=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);
  if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.mp3':'audio/mpeg'})[path.extname(f)]||'application/octet-stream');
  res.end(fs.readFileSync(f));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
 try{
  for(const width of [390,1440]){
   const page=await browser.newPage({viewport:{width,height:844},isMobile:width<721,hasTouch:width<721,serviceWorkers:'block'}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://**/*',r=>r.abort());
   await page.route('**/account-config.json',r=>r.fulfill({contentType:'application/json',body:'{"enabled":false}'}));
   await page.addInitScript(()=>localStorage.setItem('hsk-studio-target-v1:guest','3'));
   await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');
   await page.waitForFunction(()=>!!window.HSKPracticeSelection&&!!window.HSKStudy4&&!!window.HSKStudy4.ready&&!!window.HSKStudio&&!!window.HSKLessons,{timeout:25000});

   // Verify all 351 synced tests across HSK 1-6
   const counts=await page.evaluate(()=>Object.fromEntries([1,2,3,4,5,6].map(n=>[n,window.HSKStudy4.testsByLevel[n]?.length||0])));
   const totalTests=Object.values(counts).reduce((a,b)=>a+b,0);
   assert.ok(totalTests>=350,`Expected at least 350 synced Study4 tests, got ${totalTests}`);
   for(let n=1;n<=6;n++)assert.ok(counts[n]>=40,`HSK ${n} should have at least 40 synced Study4 tests, got ${counts[n]}`);

   await page.evaluate(()=>HSKStudio.navigate('study4'));
   await page.locator('#study4PracticePanel').waitFor({state:'visible'});
   assert.equal(await page.locator('#study4Level').inputValue(),'3');
   assert.equal(await page.locator('#study4TestSelect option').count(),counts[3]);

   // Clicking primary CTA (.s4-visit) stays in-app and opens interactive test runner
   await page.locator('.s4-visit').click();
   await page.locator('.s4-runner').waitFor({state:'visible'});
   assert.equal(await page.locator('#study4PracticePanel').isVisible(),true,'user remains inside #study4PracticePanel');
   assert.equal(await page.locator('.s4-part-tab').count(),3,'HSK 3 has Listening, Reading, Writing tabs');
   const audioPlayers=page.locator('audio.s4-audio-player');
   assert.ok(await audioPlayers.count()>=1,'Listening part renders audio player(s)');
   const firstSources=await audioPlayers.first().locator('source').evaluateAll(els=>els.map(s=>s.src));
   assert.ok(firstSources.some(s=>s.includes('content/study4-audio')),'Includes local offline source');
   assert.ok(firstSources.some(s=>s.startsWith('https://')),'Includes fallback remote CDN source');

   // Answer Q1 (multiple choice in Listening)
   const q1Choice=page.locator('#s4-q-1 .s4-choice-btn').first();
   await q1Choice.click();
   assert.ok(await q1Choice.evaluate(el=>el.classList.contains('is-selected')));
   assert.match(await page.locator('#study4ProgressBadge').innerText(),/Đã làm 1\/80/);

   // Check Q1 feedback
   await page.locator('#s4-q-1 .s4-check-one').click();
   assert.equal(await page.locator('#s4-q-1 .s4-q-feedback').isVisible(),true);

   // Switch to Reading tab and test quick A-F letter matching on Q41
   await page.locator('.s4-part-tab[data-s4-part="reading"]').click();
   const q41Letter=page.locator('#s4-q-41 .s4-letter-btn').first();
   await q41Letter.click();
   assert.ok(await q41Letter.evaluate(el=>el.classList.contains('is-selected')));

   // Switch to Writing tab and test word-ordering chips
   await page.locator('.s4-part-tab[data-s4-part="writing"]').click();
   const firstToken=page.locator('.s4-order-token').first();
   await firstToken.click();
   const orderInputVal=await page.locator('.s4-text-input').first().inputValue();
   assert.ok(orderInputVal.length>0,'Tapping ordering chip populates sentence input');

   // Submit whole exam & verify score banner
   await page.locator('#study4SubmitBtn').click();
   await page.locator('#study4ScoreBanner').waitFor({state:'visible'});
   assert.match(await page.locator('#study4ScoreBanner').innerText(),/Kết quả:/);

   // Per-test section choices come from actual available question kinds, not a static HSK template.
   await page.locator('.s4-back-btn').click();
   const section=page.locator('#study4SectionSelect'),duration=page.locator('#study4DurationSelect');
   assert.equal(await section.inputValue(),'all');
   assert.equal(await duration.inputValue(),'85');
   const options=await section.locator('option').evaluateAll(nodes=>nodes.map(n=>n.value));
   assert.ok(options.includes('cloze')&&options.includes('kind:reading:input')&&options.includes('kind:writing:order'));
   assert.ok(!options.includes('kind:writing:choice'),'Unavailable type must not be offered');
   assert.equal(await duration.locator('option').count(),36,'Duration must increase by 5 from 5 to 180');

   // Cloze-only exam: preserve original question identifiers, score only its own subset.
   await section.selectOption('cloze');
   await duration.selectOption('10');
   await page.locator('.s4-visit').click();
   const clozeMeta=await page.evaluate(()=>{
    const s=HSKStudy4.activeSession;
    return {filter:s.filter,seconds:s.remainingSec,total:s.parts.reduce((n,p)=>n+p.questionCount,0),kinds:s.parts.flatMap(p=>p.groups.flatMap(g=>g.questions.map(q=>q.kind))),key:s.progressKey};
   });
   assert.equal(clozeMeta.filter,'cloze');
   assert.equal(clozeMeta.seconds,600);
   assert.ok(clozeMeta.total>0&&clozeMeta.total<80,'Only cloze questions selected');
   assert.ok(!clozeMeta.kinds.includes('order'),'Other question kinds are removed');
   assert.match(clozeMeta.key,/::test::cloze::10$/);
   assert.match(await page.locator('#study4ProgressBadge').innerText(),new RegExp('/'+clozeMeta.total+'$'));
   await page.evaluate(()=>{HSKStudy4.activeSession.deadlineAt=Date.now()-1000;});
   await page.locator('#study4ScoreBanner').waitFor({state:'visible',timeout:4000});
   assert.match(await page.locator('#study4ScoreBanner').innerText(),/Hết giờ/,'Time expiry automatically submits');
   await page.locator('.s4-back-btn').click();

   // Reading choice-only exam uses only the current paper's reading MCQs.
   await section.selectOption('kind:reading:choice');
   await duration.selectOption('5');
   await page.locator('.s4-visit').click();
   const readingMeta=await page.evaluate(()=>({minutes:HSKStudy4.activeSession.durationMinutes,skills:HSKStudy4.activeSession.parts.map(p=>p.skill),kinds:HSKStudy4.activeSession.parts.flatMap(p=>p.groups.flatMap(g=>g.questions.map(q=>q.kind)))}));
   assert.equal(readingMeta.minutes,5);
   assert.deepEqual(readingMeta.skills,['reading']);
   assert.ok(readingMeta.kinds.length>0&&readingMeta.kinds.every(k=>k==='choice'));
   await page.locator('.s4-back-btn').click();

   // Switching HSK level resets the selection and offers only types present in that paper.
   await page.locator('#study4Level').selectOption('1');
   assert.equal(await section.inputValue(),'all');
   assert.equal(await duration.inputValue(),'35');
   assert.ok(!(await section.locator('option').evaluateAll(nodes=>nodes.map(n=>n.value))).includes('kind:writing:order'));
   await page.locator('#study4Level').selectOption('3');
   assert.equal(await section.inputValue(),'all');
   assert.equal(await duration.inputValue(),'85');

   // Return to test list, pick test 4927 (HSK 3 Practice test 1) and verify Listening transcript
   await page.locator('.s4-back-btn').click();
   await page.locator('.s4-test-card').waitFor({state:'visible'});
   await page.locator('#study4TestSelect').selectOption('4927');
   await page.locator('[data-s4-skill="listening"]').click();
   await page.locator('.s4-visit').click();
   await page.locator('.s4-runner').waitFor({state:'visible'});
   assert.equal(await page.locator('audio.s4-audio-player').count(),1);
   await page.locator('#s4-q-1 .s4-check-one').click();
   assert.ok(await page.locator('.s4-transcript').count()>=1,'Transcript unlocked for checked question');

   assert.deepEqual(errors,[],'no page errors at '+width);
   await page.close();
   console.log('PASS in-app Study4 exam runner '+width+'px');
  }
 }finally{
  await browser.close();
  server.close();
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
