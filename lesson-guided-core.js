/* A deterministic lesson sequence grounded only in this lesson's supplied content. */
(function(root){'use strict';
function plan(lesson,words){
 const c=lesson.content||{},steps=[],seen=new Set(),grammarSeen=new Set(),quizSeen=new Set();
 const unique=[...new Map(words.filter(w=>w.han&&w.mean).map(w=>[w.han,w])).values()];
 function introduce(list){for(let i=0;i<list.length;i+=3){const group=list.slice(i,i+3);group.forEach(w=>seen.add(w.han));steps.push({kind:'words',title:'Làm quen từ sắp gặp',words:group});}}
 function grammar(g){grammarSeen.add(g);steps.push({kind:'grammar',title:g.title,grammar:g});}
 function recall(){const w=unique.find(w=>seen.has(w.han)&&!quizSeen.has(w.han));if(!w)return;const alternatives=[...new Set(unique.filter(x=>x.mean!==w.mean).map(x=>x.mean))].slice(0,3);if(!alternatives.length)return;quizSeen.add(w.han);steps.push({kind:'recall',title:'Nhớ lại một chút',word:w,options:[w.mean,...alternatives],answer:0});}
 function context(kind,title,lines,index){const text=lines.map(x=>x.cn).join('');introduce(unique.filter(w=>!seen.has(w.han)&&text.includes(w.han)));steps.push({kind,title,lines});
  for(const g of c.grammar||[]){const proof=c.reading?.lessonApplication?.grammarApplied?.find(a=>a.title===g.title&&a.paragraph===index+1);if(!grammarSeen.has(g)&&((g.examples||[]).some(e=>text.includes(e.cn))||kind==='reading'&&proof))grammar(g);}
  recall();
 }
 for(const d of c.dialogues||[])for(let i=0;i<d.lines.length;i+=2)context('dialogue',d.title,d.lines.slice(i,i+2),-2);
 for(const [i,line] of (c.reading?.lines||[]).entries())context('reading',c.reading.title,[line],i);
 introduce(unique.filter(w=>!seen.has(w.han)));
 for(const g of c.grammar||[])if(!grammarSeen.has(g)){grammar(g);recall();}
 // Warm-up sources must remain available beside checks referring to those sources.
 for(const q of c.practice||[])steps.push({kind:'check',title:'Vận dụng trong bài',question:q,lines:q.source==='warmup'?c.warmupReading?.lines||[]:c.reading?.lines||[]});
 return steps;
}
function duration(step,speed=1){let ms;
 if(step.words)ms=6000+step.words.length*4500;
 else if(step.lines)ms=5000+step.lines.reduce((n,x)=>n+(x.cn||'').length*170+(x.vi||'').length*45,0);
 else {const g=step.grammar||{};ms=5000+[(g.pattern||''),(g.usage||''),(g.error||''),...(g.examples||[]).map(x=>x.cn+' '+x.vi)].join(' ').length*65;}
 return Math.max(6000,Math.min(90000,ms))/Math.max(.75,Math.min(1.5,Number(speed)||1));}

// Short, single-purpose slides keep every supplied example visible without scrolling.
function presentation(lesson,words,examples=()=>[]){
 const slides=[],unique=[...new Map(words.filter(w=>w.han&&w.mean).map(w=>[w.han,w])).values()];
 function parts(text,max){const chars=Array.from(String(text||'').trim()),out=[];while(chars.length)out.push(chars.splice(0,max).join(''));return out;}
 function text(kind,label,value,max=100){for(const [i,part] of parts(value,max).entries())slides.push({kind,label,text:part,...(kind==='meaning'?{speak:part,language:'vi-VN'}:{}),id:slides.length+':'+kind+':'+i});}
 function line(x,label){
  const cnParts=parts(x.cn,40),inlinePin=cnParts.length===1&&Array.from(x.pin||'').length<=100;
  for(const cn of cnParts){
   const value=(x.speaker?x.speaker+': ':'')+cn,pin=inlinePin?x.pin||'':'';
   slides.push({kind:'chinese',label:label+' · Nghe mẫu',text:value,pin,speak:cn,id:slides.length+':chinese'});
  }
  if(x.pin&&!inlinePin)text('pinyin',label+' · Pinyin',x.pin,100);
  if(x.vi)text('meaning',label+' · Nghĩa',x.vi,120);
  for(const cn of cnParts)slides.push({kind:'repeat',label:label+' · Bạn đọc theo',text:(x.speaker?x.speaker+': ':'')+cn,pin:inlinePin?x.pin||'':'',id:slides.length+':repeat'});
 }
 for(const [i,w] of unique.entries()){
  slides.push({kind:'word',label:`Từ ${i+1}/${unique.length} · Nghe 3 lượt`,text:w.han,pin:w.pin||'',speak:w.han,repetitions:3,id:slides.length+':word:'+w.han});
  text('meaning',w.han+' · Nghĩa',w.mean,120);
  for(const han of [...new Set(Array.from(w.han).filter(c=>/\p{Script=Han}/u.test(c)))])slides.push({kind:'strokes',label:w.han+' · Xem nét viết 3 lượt',text:han,loops:3,id:slides.length+':strokes:'+han});
  const list=examples(w)||[];for(const [j,x] of list.entries())line(x,`${w.han} · Ví dụ ${j+1}/${list.length}`);
 }
 const c=lesson.content||{};
 for(const d of c.dialogues||[])for(const x of d.lines||[])line(x,d.title||'Hội thoại');
 for(const x of c.reading?.lines||[])line(x,c.reading.title||'Bài đọc');
 for(const g of c.grammar||[]){text('grammar',g.title,g.pattern,60);text('meaning',g.title,g.usage,120);for(const x of g.examples||[])line(x,g.title+' · Ví dụ');text('meaning',g.title+' · Lưu ý',g.error,120);}
 return slides;
}
function slideDuration(slide,speed=.75){return Math.max(6500,Math.min(24000,Array.from(slide.text||'').length*(slide.kind==='meaning'?130:180)))/Math.max(.65,Math.min(1,Number(speed)||.75));}
function practiceLead(){return 2500;}
function transitionPause(){return 2200;}
function pronunciationGap(){return 1400;}
function karaokeDuration(slide,speed=.75,modelMs=0){const count=Array.from(slide.text||'').filter(c=>/\p{Script=Han}/u.test(c)).length;return Math.max(8000,count*650,modelMs*1.4)/Math.max(.65,Math.min(1,Number(speed)||.75));}
const api={plan,duration,presentation,slideDuration,practiceLead,transitionPause,pronunciationGap,karaokeDuration};root.HSKGuidedCore=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='object'?window:globalThis);
