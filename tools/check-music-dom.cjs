const {JSDOM}=require('jsdom'),fs=require('fs'),assert=require('node:assert/strict');
const root=process.cwd();
const dom=new JSDOM('<main class="workspace"></main>',{url:'https://hsk.example/hsk/',runScripts:'outside-only'}),w=dom.window;
w.requestAnimationFrame=callback=>setImmediate(callback);w.cancelAnimationFrame=clearImmediate;
let idleMediaCalls=0;
w.HTMLMediaElement.prototype.pause=function(){idleMediaCalls++;};w.HTMLMediaElement.prototype.load=function(){idleMediaCalls++;};
w.HTMLMediaElement.prototype.play=function(){return Promise.resolve();};
w.URL.createObjectURL=()=> 'blob:test';w.URL.revokeObjectURL=()=>{};
w.HSKAccountDashboard={user:{uid:'first',getIdToken:async()=> 'fake'}};
w.fetch=async()=>({ok:true,json:async()=>({enabled:false})});
w.eval(fs.readFileSync('src/modules/music/music-core.js','utf8'));
w.eval('var words=[{han:"今天",hsk:"1"},{han:"我们",hsk:"1"},{han:"一起",hsk:"2"},{han:"唱歌",hsk:"2"}];');
w.eval(fs.readFileSync('src/modules/music/music.js','utf8'));
const $=id=>w.document.getElementById(id),song=JSON.parse(fs.readFileSync('content/music/lesson-template.json'));
async function run(){
 w.dispatchEvent(new w.Event('hsk-account-ready'));assert.equal(idleMediaCalls,0,'Pristine account initialization must not pause/load an unused media element');
 $('musicPanel').hidden=false;w.HSKMusic.enter();await new Promise(r=>setImmediate(r));
 assert.match($('musicStatus').textContent,/chưa được kết nối/);
 Object.defineProperty($('musicManifest'),'files',{configurable:true,value:[{size:500,text:async()=>JSON.stringify(song)}]});
 Object.defineProperty($('musicFile'),'files',{configurable:true,value:[{size:100,type:'audio/wav',name:'song.wav'}]});
 await $('musicImportApply').onclick();
 assert.equal($('musicLesson').hidden,false);assert.equal($('musicLyrics').hidden,true);
 assert.match($('musicDistribution').textContent,/HSK 2/);
 $('musicLevel').value='6';$('musicLevel').onchange();assert.equal($('musicLesson').hidden,true);$('musicLevel').value='all';$('musicLevel').onchange();assert.equal($('musicLesson').hidden,false);
 $('musicHold').onkeydown(new w.KeyboardEvent('keydown',{key:' '}));assert.equal($('musicLyrics').hidden,false);$('musicHold').onkeyup();assert.equal($('musicLyrics').hidden,true);
 $('musicQuiz').dispatchEvent(new w.Event('submit',{cancelable:true}));assert.match($('musicResult').textContent,/Chọn một/);
 w.document.querySelector('input[name=musicAnswer][value="1"]').checked=true;$('musicQuiz').dispatchEvent(new w.Event('submit',{cancelable:true}));
 assert.match($('musicResult').textContent,/Chưa đúng/);assert.equal($('musicLyrics').hidden,false);assert.equal(JSON.parse(w.localStorage.getItem('hsk-music-history-v1:first'))[0].correct,false);
 $('musicNext').click();assert.equal($('musicLine').value,'1');assert.match($('musicNewWords').textContent,/星河/);
 $('musicPlayer').currentTime=7;
 w.HSKAccountDashboard={user:{uid:'second'}};w.dispatchEvent(new w.Event('hsk-account-ready'));await new Promise(r=>setImmediate(r));
 assert.equal($('musicLesson').hidden,true);assert.equal(w.localStorage.getItem('hsk-music-progress-v1:second'),null);assert.equal(w.localStorage.getItem('hsk-music-history-v1:second'),null,'A second account must not inherit the first account history');
 assert.equal(w.localStorage.getItem('hsk-flashcards-progress-v1'),null);
 // Malformed late import must not open a lesson under a different account.
 let resolve;Object.defineProperty($('musicManifest'),'files',{value:[{size:500,text:()=>new Promise(r=>resolve=r)}]});const pending=$('musicImportApply').onclick();w.dispatchEvent(new w.Event('hsk-account-ready'));resolve(JSON.stringify(song));await pending;assert.equal($('musicLesson').hidden,true);
 await new Promise(r=>setImmediate(r));dom.window.close();console.log('PASS music DOM: import, ratios, reveal, grading, account isolation, late response and no SRS writes');
}
run().catch(e=>{console.error(e);dom.window.close();process.exitCode=1});