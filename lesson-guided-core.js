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

const api={plan,duration};root.HSKGuidedCore=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='object'?window:globalThis);
