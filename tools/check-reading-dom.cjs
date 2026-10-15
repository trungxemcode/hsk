// DOM integration fallback when a Chromium executable is unavailable.
// Run with NODE_PATH pointing to a jsdom installation.
const {JSDOM,VirtualConsole}=require('jsdom'),fs=require('node:fs'),assert=require('node:assert/strict'),http=require('node:http'),path=require('node:path');
(async()=>{const errors=[],virtualConsole=new VirtualConsole();virtualConsole.on('jsdomError',e=>errors.push(e.message));let readyResolve;const ready=new Promise(r=>readyResolve=r);
 const root=process.cwd(),server=http.createServer((req,res)=>{const name=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!name.startsWith(root+path.sep)||!fs.existsSync(name)){res.writeHead(404);res.end();return;}const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'};res.setHeader('Content-Type',types[path.extname(name)]||'application/octet-stream');res.end(fs.readFileSync(name));});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const dom=await JSDOM.fromURL(`http://127.0.0.1:${server.address().port}/index.html`,{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,virtualConsole,beforeParse(w){
  w.fetch=(url,opts)=>fetch(new URL(url,w.location.href),opts);for(const name of ['Response','Request','Headers','DecompressionStream','TextDecoder','TextEncoder'])w[name]=globalThis[name];
  w.HTMLCanvasElement.prototype.getContext=()=>null;
  w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});w.speechSynthesis={getVoices:()=>[],cancel(){},speak(){}};w.scrollTo=()=>{};
  w.addEventListener('hsk-lessons-ready',()=>readyResolve());
 }});
 try{await Promise.race([ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('App initialization timeout: '+errors.join('; '))),30000))]);const w=dom.window,d=w.document;
 const button=name=>{const found=[...d.querySelectorAll('#lessonsContent button')].filter(b=>b.textContent===name&&!b.closest('[hidden]'));assert.equal(found.length,1,'Button: '+name);return found[0];};
 for(const han of ['你们','太……了','花花','贏','內容','勺（子）']){const xs=w.HSKLessons.match([han]);assert.ok(xs.length);assert.ok(xs.every(x=>w.HSKLessons.examples(x).length>=3));}
 const catalog=JSON.parse(fs.readFileSync('lessons-data.json'));
 for(const course of catalog.courses)for(const lesson of course.lessons){const id=lesson.id;w.history.replaceState(null,'','#lesson/'+id);await w.HSKLessonNav.open();button('Đọc & hội thoại').click();const body=d.querySelector('.lesson-reading-body');assert.ok(body.textContent.length>300,id+' long passage');assert.equal(body.querySelectorAll('.lesson-language-help').length,body.querySelectorAll('.lesson-language-line').length*2,id+' pinyin/meaning disclosure');for(const details of body.querySelectorAll('.lesson-language-help')){assert.equal(details.open,false,id+' assistance initially collapsed');assert.match(details.querySelector('summary').textContent,/pinyin|nghĩa|↓/);}
  const first=body.querySelector('.lesson-language-help');first.querySelector('summary').click();assert.equal(first.open,true,id+' opens on click');first.querySelector('summary').click();assert.equal(first.open,false,id+' closes on click');
  if(['03','06','09','12'].includes(id.slice(-2))){button('Đọc & hội thoại').click();assert.equal(d.querySelector('.lesson-dialogue').querySelectorAll('.lesson-language-line').length,8,id+' eight-turn dialogue');}
 }
 const id='standard-2-03',l=JSON.parse(fs.readFileSync('lesson-content-hsk2.json')).lessons.find(l=>l.id===id);w.history.replaceState(null,'','#lesson/'+id);await w.HSKLessonNav.open();button('Luyện tập').click();
 for(const [i,q] of l.practice.entries()){button(q.options[q.answer]).click();assert.ok(d.querySelector('.lesson-test-feedback').textContent.includes('Chính xác'));button(i===5?'Xem kết quả':'Câu tiếp theo').click();}
 const evidence=JSON.parse(w.localStorage.getItem('hsk-course-lessons-v1')).lessons[id].contentEvidence;assert.equal(Object.keys(evidence).length,6);assert.ok(Object.values(evidence).every(x=>x.streak===1));assert.deepEqual(errors,[]);
 console.log('PASS: actual app initialization; all 146 lesson DOM views; collapsed-by-default pinyin/meaning toggles; vocabulary/aliases; 24 eight-turn dialogues; grading and persistence for all 6 questions. Visual/browser layout is not covered.');
 }finally{dom.window.close();server.close();}
})().catch(e=>{console.error(e);process.exit(1);});
