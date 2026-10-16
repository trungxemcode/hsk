/* UI regression for real-world reading source/AI flow, no live API/token usage. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const SAMPLE={
 id:'mock-lesson-3-01',hsk:3,lessonId:'standard-3-01',topic:'Ăn uống',status:'adapted',
 source:{id:'breakfast',site:'36Kr',url:'https://www.36kr.com/p/1470282839229576'},
 titleZh:'今天的早饭',titleVi:'Bữa sáng hôm nay',
 scriptMode:[
 {speaker:'小王',stageNote:'在公司',hanzi:'你今天早上吃饭了吗？',pinyin:'Nǐ jīntiān zǎoshang chīfàn le ma?',vi:'Sáng nay bạn đã ăn chưa?'},
 {speaker:'小李',stageNote:'在喝咖啡',hanzi:'我没有吃，今天太忙了。',pinyin:'Wǒ méiyǒu chī, jīntiān tài máng le.',vi:'Tôi chưa ăn, hôm nay bận quá.'},
 {speaker:'小王',stageNote:'给朋友东西',hanzi:'我买了两个包子。',pinyin:'Wǒ mǎi le liǎng gè bāozi.',vi:'Tôi mua hai chiếc bánh bao.'},
 {speaker:'小李',stageNote:'微笑',hanzi:'谢谢你，我们一起吃吧。',pinyin:'Xièxie nǐ, wǒmen yìqǐ chī ba.',vi:'Cảm ơn, cùng ăn nhé.'}
 ],paragraphMode:[{hanzi:'今天两个朋友在公司一起吃早餐。',pinyin:'Jīntiān liǎng gè péngyou zài gōngsī yìqǐ chī zǎocān.',vi:'Hôm nay hai người bạn cùng ăn sáng tại công ty.'}],
 quiz:[
 {question:'谁没有吃早饭？',options:['小王','小李','老师'],answerIndex:1,explanationVi:'Tiểu Lý chưa ăn sáng.'},
 {question:'小王买了什么？',options:['包子','书','衣服'],answerIndex:0,explanationVi:'Tiểu Vương đã mua bánh bao.'},
 {question:'他们在哪里？',options:['学校','机场','公司'],answerIndex:2,explanationVi:'Họ đang ở công ty.'}
 ]};
(async()=>{
 const root=process.cwd(),server=http.createServer((req,res)=>{
  const f=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);
  if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
 try{
 for(const width of [320,390,1440]){
  const page=await browser.newPage({viewport:{width,height:900},serviceWorkers:'block',isMobile:width<=720,hasTouch:width<=720}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>localStorage.setItem('hsk-studio-target-v1:guest','3'));
  await page.route('https://**/*',r=>r.abort());
  await page.route('**/translation-config.json',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({enabled:true,endpoint:'https://example-worker.test/translate'})}));
  await page.route('**/account-config.json',r=>r.fulfill({contentType:'application/json',body:'{"enabled":false}'}));
  let submissions=[];
  await page.route('https://example-worker.test/reading-next',async r=>{
   submissions.push(r.request().postDataJSON());
   await r.fulfill({contentType:'application/json',body:JSON.stringify({story:{...SAMPLE,id:'mock-generated-'+submissions.length,lessonId:null}})});
  });
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');
  await page.waitForFunction(()=>!!window.HSKRealReading&&!!window.HSKStudio&&!!window.HSKLessons,{timeout:25000});
  for(const theme of ['light','dark']){
   const baseline=submissions.length;
   await page.evaluate(()=>{localStorage.removeItem('hsk-real-reading-history-v1:guest');localStorage.removeItem('hsk-real-reading-cache-v1:guest');window.HSKAccountDashboard=null;window.dispatchEvent(new Event('hsk-account-ready'));});
   await page.evaluate(x=>{document.documentElement.dataset.theme=x;window.HSKRealReading.leaveLesson();window.HSKStudio.navigate('real-reading')},theme);
   assert.equal(await page.locator('#realReadingPanel').isVisible(),true);
   assert.equal(await page.locator('#rrHsk').inputValue(),'3');
   assert.equal(await page.locator('#rrSourceList a').count(),4);
   assert.equal(await page.locator('#rrArticle').isVisible(),false);
   await page.locator('#rrNew').click();
   assert.match(await page.locator('#rrStatus').innerText(),/Đăng nhập/,'must not call AI for guests without cached stories');
   assert.equal(submissions.length,baseline);
   await page.evaluate(()=>{window.HSKAccountDashboard={user:{getIdToken:async()=> 'mock-token'}};});
   await page.locator('#rrNew').click();
   await page.waitForFunction(id=>window.HSKRealReading.story?.id==='mock-generated-'+id,baseline+1,{timeout:12000});
   assert.equal(submissions.length>0,true);
   assert.equal(await page.locator('#rrArticle .rr-line').count(),4);
   assert.equal(await page.locator('#rrArticle .rr-pinyin').count(),0);
   assert.equal(await page.locator('#rrArticle .rr-vi').count(),0);
   assert.equal(await page.locator('#rrArticle .rr-credit a').getAttribute('href'),SAMPLE.source.url);
   await page.locator('#rrArticle .rr-reading-switches button').filter({hasText:'Pinyin'}).click();
   assert.equal(await page.locator('#rrArticle .rr-pinyin').count(),4);
   await page.locator('#rrArticle .rr-reading-switches button').filter({hasText:'Nghĩa'}).click();
   assert.equal(await page.locator('#rrArticle .rr-vi').count(),4);
   await page.locator('#rrArticle .rr-reading-switches button').filter({hasText:'Văn bản'}).click();
   assert.equal(await page.locator('#rrArticle .rr-line').count(),1);
   await page.locator('#rrArticle .rr-reading-switches button').filter({hasText:'Kịch bản'}).click();
   for(let i=0;i<3;i++)await page.locator('#rrArticle fieldset').nth(i).locator('input').nth(SAMPLE.quiz[i].answerIndex).check();
   await page.locator('#rrArticle .rr-quiz .rr-primary').click();
   assert.match(await page.locator('#rrArticle .rr-quiz-result').innerText(),/Đúng 3\/3/);
   assert.match(await page.locator('#rrStats').innerText(),/Hoàn thành 1/);
   assert.equal(await page.locator('#rrArticle .rr-quiz .rr-primary').isDisabled(),true);
   const count=await page.evaluate(()=>window.HSKRealReading.history.entries.length);assert.ok(count>=1);
   assert.equal(await page.evaluate(()=>localStorage.getItem('hsk-course-lessons-v1')===null),true,'reading must not update lesson mastery');
   // A second identical response cannot silently count as fresh reading.
   await page.locator('#rrNew').click();
   await page.waitForFunction(()=>/giống nội dung|chưa/i.test(document.querySelector('#rrStatus')?.textContent||''),null,{timeout:12000});
   assert.match(await page.locator('#rrStatus').innerText(),/giống nội dung|chưa/i);
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
   assert.equal(overflow,false);
   await page.evaluate(()=>{window.HSKRealReading.cancel();window.HSKStudio.navigate('practice')});
  }
  // From a real HSK lesson, the new reading route retains the lesson ID.
  await page.evaluate(async()=>{window.HSKRealReading.leaveLesson();window.HSKStudio.navigate('lessons');history.replaceState(null,'','#lesson/standard-3-01');await window.HSKLessonNav.open();});
  await page.locator('.lesson-reading-entry').waitFor({state:'visible',timeout:18000});
  await page.locator('.lesson-reading-entry').click();
  assert.equal(await page.locator('#realReadingPanel').isVisible(),true);
  assert.match(await page.locator('#rrContext').innerText(),/bài học/i);
  assert.deepEqual(errors,[]);
  console.log('PASS real reading '+width+'px: source attribution, auth, mocked AI, toggles, quiz, no duplicate, per-lesson routing');
  await page.close();
 }
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
