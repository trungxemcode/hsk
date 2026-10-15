const {chromium}=require('playwright');const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/index.html');await page.waitForFunction(()=>!!window.HSKLessons,{timeout:60000});
 const match=await page.evaluate(()=>['你们','太……了','花花','贏','內容','勺（子）'].map(h=>({han:h,count:window.HSKLessons.match([h]).length,examples:window.HSKLessons.match([h]).map(w=>window.HSKLessons.examples(w).length)})));
 assert.ok(match.every(x=>x.count>0&&x.examples.every(n=>n>=3)));
 for(let n=1;n<=6;n++)for(const num of ['03','06','09','12']){
  const id=`standard-${n}-${num}`;await page.evaluate(async id=>{history.replaceState(null,'','#lesson/'+id);await window.HSKLessonNav.open();},id);
  await page.getByRole('button',{name:'Đọc & hội thoại',exact:true}).click();const body=page.locator('.lesson-reading-body');assert.ok((await body.innerText()).length>400);
  const pins=body.locator('.lesson-pinyin');assert.ok(await pins.first().isVisible());await page.getByRole('button',{name:'Ẩn/hiện pinyin',exact:true}).click();assert.equal(await pins.first().isVisible(),false);
  await page.getByRole('button',{name:'Ẩn/hiện bản dịch',exact:true}).click();assert.equal(await body.locator('.lesson-language-line>p:last-child').first().isVisible(),false);
  await page.getByRole('button',{name:'Đọc & hội thoại',exact:true}).click();assert.equal(await page.locator('.lesson-dialogue').first().locator('.lesson-language-line').count(),8);
 }
 // Complete all six questions in one expanded lesson and check persisted evidence.
 const id='standard-2-03',lesson=JSON.parse(fs.readFileSync('lesson-content-hsk2.json')).lessons.find(x=>x.id===id);
 await page.evaluate(async id=>{history.replaceState(null,'','#lesson/'+id);await window.HSKLessonNav.open();},id);await page.getByRole('button',{name:'Luyện tập',exact:true}).click();
 for(const [i,q] of lesson.practice.entries()){await page.getByRole('button',{name:q.options[q.answer],exact:true}).click();assert.ok((await page.locator('.lesson-test-feedback').innerText()).includes('Chính xác'));await page.getByRole('button',{name:i===5?'Xem kết quả':'Câu tiếp theo',exact:true}).click();}
 const evidence=await page.evaluate(id=>JSON.parse(localStorage.getItem('hsk-course-lessons-v1')).lessons[id].contentEvidence,id);assert.equal(Object.keys(evidence).length,6);assert.ok(Object.values(evidence).every(e=>e.streak===1));
 assert.deepEqual(errors,[]);await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Đọc & hội thoại',exact:true}).click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 console.log('PASS: 24 lesson views; vocabulary and aliases; reading controls; eight-turn dialogues; six-question grading/persistence; narrow-screen layout; no runtime errors.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
