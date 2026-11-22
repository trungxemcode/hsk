import test from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import fs from 'node:fs';const require=createRequire(import.meta.url),C=require('../src/modules/lessons/lesson-guided-core.js');
test('all 146 lesson sequences cover supplied material and teach context vocabulary before it is encountered',()=>{let count=0;for(let level=1;level<=6;level++)for(const content of JSON.parse(fs.readFileSync(`lesson-content-hsk${level}.json`)).lessons){count++;const han=[...new Set((content.dialogues||[]).flatMap(d=>d.lines).concat(content.reading.lines).flatMap(x=>Array.from(x.cn).filter(c=>/\p{Script=Han}/u.test(c))))],words=han.map((h,i)=>({han:h,pin:'p'+i,mean:'Nghĩa '+i})),steps=C.plan({content},words),seen=new Set();assert.equal(steps.filter(s=>s.kind==='check').length,content.practice.length);assert.equal(steps.filter(s=>s.kind==='grammar').length,content.grammar.length);for(const s of steps){if(s.kind==='words'){assert.ok(s.words.length<=3);s.words.forEach(w=>seen.add(w.han));}if(['reading','dialogue'].includes(s.kind))for(const w of words.filter(w=>s.lines.some(x=>x.cn.includes(w.han))))assert.ok(seen.has(w.han));if(s.kind==='recall'){assert.ok(seen.has(s.word.han));assert.equal(new Set(s.options).size,s.options.length);}if(s.kind==='check'&&s.question.source==='warmup')assert.deepEqual(s.lines,content.warmupReading?.lines||[]);}assert.equal(seen.size,words.length);}assert.equal(count,146);});
test('empty/partial content is safe and speed controls bounded nonzero dwell time',()=>{assert.deepEqual(C.plan({},[]),[]);const s={kind:'words',words:[{han:'你',mean:'bạn'}]};assert.ok(C.duration(s,.75)>C.duration(s,1.5));assert.ok(C.duration(s)>0);assert.equal(C.plan({content:{}},[{han:'你',mean:'bạn'}])[0].words[0].han,'你');});

test('pacing uses visible content, not hidden dictionary metadata',()=>{const a={kind:'words',words:[{han:'你',mean:'bạn'}]};assert.equal(C.duration(a),C.duration({words:[{...a.words[0],practice:{examples:Array(1000).fill('hidden')}}]}));assert.ok(C.duration({lines:[{cn:'你',vi:'bạn'}]})<C.duration({lines:[{cn:'你'.repeat(100),vi:'bạn'.repeat(100)}]}));});

test('hands-free slides teach each word and every example in order without interactive gates',()=>{
 const words=[{han:'你',pin:'nǐ',mean:'bạn'},{han:'我',pin:'wǒ',mean:'tôi'}],examples=[{cn:'你好。',pin:'nǐ hǎo',vi:'Xin chào.'},{cn:'你好吗？',pin:'nǐ hǎo ma',vi:'Bạn khỏe không?'}];
 const slides=C.presentation({},words,()=>examples),first=slides.slice(0,10);
 assert.deepEqual(first.map(s=>s.kind),['word','meaning','meaning','meaning','chinese','meaning','repeat','chinese','meaning','repeat']);
 assert.deepEqual(first.map(s=>s.text),['你','bạn','bạn','bạn','你好。','Xin chào.','你好。','你好吗？','Bạn khỏe không?','你好吗？']);
 assert.equal(first.filter(s=>s.kind==='word').length,1);assert.ok(first[0].strokes&&first[0].loopWhileStrokes);assert.equal(first[0].loops,3);assert.ok(first.filter(s=>s.kind==='repeat').every(s=>!s.speak),'practice turn is silent');
 assert.ok(first.filter(s=>s.kind==='meaning').every(s=>s.language==='vi-VN'&&s.speak===s.text));
 assert.deepEqual(first.filter(s=>s.speak).map(s=>s.speak),['你','bạn','bạn','bạn','你好。','Xin chào.','你好吗？','Bạn khỏe không?']);assert.equal(slides[10].text,'我');
 assert.equal(new Set(slides.map(s=>s.id)).size,slides.length);assert.ok(slides.every(s=>!['recall','check'].includes(s.kind)));assert.equal(words[0].mean,'bạn');
});
test('presentation chunks long source text without dropping it, and keeps all supplied context',()=>{
 const meaning='Nghĩa dài cần đọc đủ nội dung. '.repeat(10),wordSlides=C.presentation({},[{han:'学习',pin:'xué xí',mean:meaning}]);
 assert.equal(wordSlides.filter(s=>s.kind==='word').length,1);assert.equal(wordSlides[0].loopWhileStrokes,true);assert.equal(wordSlides[0].loops,3);assert.equal(wordSlides[0].repetitions,undefined,'Mandarin count follows animation completion');assert.equal(wordSlides.filter(s=>s.kind==='meaning').map(s=>s.speak).join(''),meaning.trim().repeat(3),'three complete meaning passes, including long meanings');
 const cn='周末我们一起学习中文。'.repeat(20),pin='zhōu mò '.repeat(50),vi='Cuối tuần cùng học tiếng Trung. '.repeat(20);
 const slides=C.presentation({content:{dialogues:[{title:'Hội thoại',lines:[{cn,pin,vi}]}],grammar:[{title:'Mẫu câu',pattern:'因为…所以…',usage:'Nêu nguyên nhân.',error:'Không đảo trật tự.',examples:[]}] }},[]);
 assert.equal(slides.filter(s=>s.kind==='chinese').map(s=>s.speak).join(''),cn);
 assert.equal(slides.filter(s=>s.kind==='pinyin').map(s=>s.text).join(''),pin.trim());
 assert.equal(slides.filter(s=>s.label==='Hội thoại · Nghĩa').map(s=>s.text).join(''),vi.trim());
 assert.ok(slides.every(s=>Array.from(s.text).length<=120));assert.ok(slides.some(s=>s.text==='因为…所以…'));assert.ok(slides.some(s=>s.text==='Không đảo trật tự.'));
 assert.deepEqual(C.presentation({},[]),[]);assert.ok(C.slideDuration(slides[0],.75)>C.slideDuration(slides[0],1.5));
});
test('pacing removes idle waits while retaining silent reading time and a deliberate karaoke pace',()=>{
 assert.ok(C.slideDuration({text:'bạn',kind:'meaning'})>=2000);
 assert.ok(C.slideDuration({text:'bạn'},.65)>C.slideDuration({text:'bạn'},1));
 assert.equal(C.slideDuration({text:'bạn'},2),C.slideDuration({text:'bạn'},1));
 assert.ok(C.practiceLead()>=700&&C.practiceLead()<=1200);assert.ok(C.transitionPause()>=200&&C.transitionPause()<=500);
 assert.ok(C.karaokeDuration({text:'你好。'})>=10000);
 assert.ok(C.karaokeDuration({text:'你好。'},.75,20000)>20000);
});
test('target duration recalculates loops and pace to fit whole lesson without dropping content',()=>{
 const lessonContent=JSON.parse(fs.readFileSync('lesson-content-hsk3.json')).lessons[0];
 const words=Array.from({length:15},(_,i)=>({han:['打算','周末','北方','南方','面包','地图','搬','带','找','游戏','作业','着急','复习','准备','计划'][i],pin:'p'+i,mean:'Nghĩa mẫu '+i}));
 const ex=w=>[{cn:`我${w.han}明天去学习中文。`,pin:'wo ming tian qu xue xi zhong wen',vi:`Ví dụ với từ ${w.han}.`},{cn:`周末我们一起${w.han}吧。`,pin:'zhou mo wo men yi qi ba',vi:`Ví dụ thứ hai với ${w.han}.`}];
 const base=C.estimateLessonBaseline({content:lessonContent},words,ex);
 assert.ok(base.minMinutes>=2&&base.minMinutes<base.baselineMinutes&&base.baselineMinutes<base.maxMinutes,JSON.stringify(base));
 assert.equal(base.metrics.wordCount,15);
 const fast=C.computePacingForTarget({content:lessonContent},words,Math.max(base.minMinutes,Math.round(base.baselineMinutes*0.55)),ex);
 assert.ok(fast.wordLoops<=2||fast.speechRate>0.65,'shorter target reduces repetitions or increases pace');
 assert.ok(Math.abs(fast.estimatedMinutes-fast.targetMinutes)<=2,`estimated ${fast.estimatedMinutes}p close to target ${fast.targetMinutes}p`);
 const fastSlides=C.presentation({content:lessonContent},words,ex,{wordLoops:fast.wordLoops,meaningLoops:fast.meaningLoops});
 assert.equal(fastSlides.filter(s=>s.kind==='word').length,15,'never drops any vocabulary word');
 assert.equal(fastSlides.filter(s=>s.kind==='grammar').length,(lessonContent.grammar||[]).length,'never drops any grammar point');
 const deep=C.computePacingForTarget({content:lessonContent},words,Math.min(base.maxMinutes,Math.round(base.baselineMinutes*1.3)),ex);
 assert.ok(deep.wordLoops>=3&&deep.speechRate<=fast.speechRate,'longer target keeps full loops and calmer speed');
});
test('classifyTimeBudget and parseAiTimeEstimate grade rush (red), optimal (green) and relaxed (blue) accurately',()=>{
 const ai=C.parseAiTimeEstimate({answer:'```json\n{"recommendedMinutes":30,"minSafeMinutes":27,"maxRelaxedMinutes":35,"reasonVi":"Bài có 15 từ mới và 3 điểm ngữ pháp cần khoảng 30 phút."}\n```'},24);
 assert.equal(ai.parsedFromAi,true);assert.equal(ai.recommendedMinutes,30);assert.equal(ai.minSafeMinutes,27);assert.equal(ai.maxRelaxedMinutes,35);assert.match(ai.reasonVi,/30 phút/);
 const rush=C.classifyTimeBudget(15,ai.recommendedMinutes,ai.minSafeMinutes,ai.maxRelaxedMinutes);
 assert.equal(rush.zone,'rush');assert.equal(rush.color,'red');
 const optimal=C.classifyTimeBudget(30,ai.recommendedMinutes,ai.minSafeMinutes,ai.maxRelaxedMinutes);
 assert.equal(optimal.zone,'optimal');assert.equal(optimal.color,'green');
 const relaxed=C.classifyTimeBudget(42,ai.recommendedMinutes,ai.minSafeMinutes,ai.maxRelaxedMinutes);
 assert.equal(relaxed.zone,'relaxed');assert.equal(relaxed.color,'blue');
 const proseFallback=C.parseAiTimeEstimate({answer:'Khoảng 25 phút là hợp lý.'},20);
 assert.equal(proseFallback.parsedFromAi,true);assert.equal(proseFallback.recommendedMinutes,25);
});
