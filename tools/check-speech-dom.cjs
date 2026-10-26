// App DOM integration with a mocked speech engine; this cannot verify audible sound.
const {JSDOM,VirtualConsole}=require('jsdom'),fs=require('node:fs'),assert=require('node:assert/strict'),http=require('node:http'),path=require('node:path');
(async()=>{
 const root=process.cwd(),spoken=[],errors=[];let resolveReady;const ready=new Promise(r=>resolveReady=r),console=new VirtualConsole();console.on('jsdomError',e=>errors.push(e.message));
 const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let timeout;
 const dom=await JSDOM.fromURL(`http://127.0.0.1:${server.address().port}/index.html`,{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,virtualConsole:console,beforeParse(w){/* Use cancellable frame timers in jsdom 26: native RAF may fire after window.close(). */w.requestAnimationFrame=cb=>w.setTimeout(()=>cb(w.performance.now()),16);w.cancelAnimationFrame=id=>w.clearTimeout(id);
  w.fetch=(url,options)=>fetch(new URL(url,w.location.href),options);for(const name of ['Response','Request','Headers','DecompressionStream','TextDecoder','TextEncoder'])w[name]=globalThis[name];
  w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});w.scrollTo=()=>{};
  w.HTMLCanvasElement.prototype.getContext=()=>({});
  w.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
  w.speechSynthesis={getVoices:()=>[{lang:'zh-CN',name:'Mandarin',localService:true}],cancel(){},speak:u=>spoken.push(u)};
  w.addEventListener('hsk-lessons-ready',resolveReady);
 }});
 try{
  await Promise.race([ready,new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('App init timeout: '+errors.join('; '))),30000);})]);clearTimeout(timeout);
  const w=dom.window,d=w.document,card=d.getElementById('flashcard'),word=d.getElementById('han').textContent;
  assert.equal(card.querySelectorAll('.speech-button').length,2);card.querySelector('.speech-button').click();assert.equal(spoken.at(-1).text,word);assert.equal(card.classList.contains('flipped'),false,'speaker does not flip card');
  d.getElementById('next').click();card.querySelector('.speech-button').click();assert.equal(spoken.at(-1).text,d.getElementById('han').textContent,'new card reads new word');
  w.history.replaceState(null,'','#lesson/standard-2-03');await w.HSKLessonNav.open();
  const nav=label=>[...d.querySelectorAll('.lesson-section-nav button')].find(b=>b.textContent===label);
  nav('Từ vựng').click();d.querySelector('.lesson-card .speech-button').click();assert.equal(spoken.at(-1).text,d.querySelector('.lesson-han').textContent);
  nav('Đọc & hội thoại').click();const line=d.querySelector('.lesson-reading-body .lesson-language-line');line.querySelector('.speech-button').click();const expected=w.HSKSpeech.chunks(line.querySelector('.lesson-cn').textContent)[0];assert.equal(spoken.at(-1).text,expected);
  const fullReading=d.querySelector('.speech-button-full[aria-label="Nghe toàn bài đọc"]');assert.ok(fullReading);assert.equal(fullReading.textContent,'Nghe toàn bài đọc');fullReading.click();assert.equal(spoken.at(-1).text,expected);
  nav('Đọc & hội thoại').click();const dialogue=d.querySelector('.lesson-dialogue'),speechButton=dialogue.querySelector('.lesson-language-line .speech-button');speechButton.click();assert.ok(!/^[AB][:：]/.test(spoken.at(-1).text),'speaker labels not spoken');assert.equal(dialogue.querySelector('.speech-button-full').textContent,'Nghe toàn hội thoại');
  assert.deepEqual(errors,[]);process.stdout.write('PASS: actual app load, front/back card speaker, next card, lesson vocabulary, sentence reading, full passage and dialogue; mocked audio only.\n');
 }finally{clearTimeout(timeout);dom.window.close();server.close();}
})().catch(e=>{console.error(e);process.exit(1);});
