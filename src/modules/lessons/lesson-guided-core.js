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
function presentation(lesson,words,examples=()=>[],options={}){
 const slides=[],unique=[...new Map((words||[]).filter(w=>w.han&&w.mean).map(w=>[w.han,w])).values()];
 const wordPractice={repetitions:3};
 const wordLoops=Math.max(1,Math.min(5,Math.round(Number(options?.wordLoops)||wordPractice.repetitions)));
 const meaningLoops=Math.max(1,Math.min(4,Math.round(Number(options?.meaningLoops)||wordPractice.repetitions)));
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
  slides.push({kind:'word',strokes:true,loopWhileStrokes:true,loops:wordLoops,label:`Từ ${i+1}/${unique.length} · Vừa viết vừa đọc`,text:w.han,pin:w.pin||'',speak:w.han,id:slides.length+':word:'+w.han});
  for(let turn=0;turn<meaningLoops;turn++){
   text('meaning',w.han+` · Nghĩa · Lượt ${turn+1}/${meaningLoops}`,w.mean,120);
  }
  const list=examples(w)||[];for(const [j,x] of list.entries())line(x,`${w.han} · Ví dụ ${j+1}/${list.length}`);
 }
 const c=lesson?.content||{};
 for(const d of c.dialogues||[])for(const x of d.lines||[])line(x,d.title||'Hội thoại');
 for(const x of c.reading?.lines||[])line(x,c.reading.title||'Bài đọc');
 for(const g of c.grammar||[]){text('grammar',g.title,g.pattern,60);text('meaning',g.title,g.usage,120);for(const x of g.examples||[])line(x,g.title+' · Ví dụ');text('meaning',g.title+' · Lưu ý',g.error,120);}
 return slides;
}
function slideDuration(slide,speed=.75){return Math.max(1800,Math.min(18000,Array.from(slide.text||'').length*(slide.kind==='meaning'?85:150)))/Math.max(.65,Math.min(1,Number(speed)||.75));}
function practiceLead(){return 900;}
function transitionPause(){return 300;}
function pronunciationGap(){return 300;}
function karaokeDuration(slide,speed=.75,modelMs=0){const count=Array.from(slide.text||'').filter(c=>/\p{Script=Han}/u.test(c)).length;return Math.max(8000,count*650,modelMs*1.4)/Math.max(.65,Math.min(1,Number(speed)||.75));}
function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v));}
function countHan(str){return Array.from(String(str||'')).filter(c=>/\p{Script=Han}/u.test(c)).length;}
function pacingAtPace(wordLoops,meaningLoops,pace=1){
 const p=clamp(Number(pace)||1,.55,2.35);
 return {
  wordLoops:Math.max(1,Math.min(5,Math.round(wordLoops||3))),
  meaningLoops:Math.max(1,Math.min(4,Math.round(meaningLoops||3))),
  pace:Number(p.toFixed(3)),
  speechRate:Number(clamp(.6*Math.pow(p,.78),.48,1.35).toFixed(2)),
  viRate:Number(clamp(1*Math.pow(p,.55),.85,1.6).toFixed(2)),
  strokeSpeed:Number(clamp(.45*Math.pow(p,1.45),.3,2.4).toFixed(2)),
  strokeDelayMs:Math.round(clamp(240/Math.pow(p,1.35),45,340)),
  karaokeScale:Number(clamp(1/Math.pow(p,1.28),.28,1.65).toFixed(2)),
  pauseScale:Number(clamp(1/Math.pow(p,1.15),.3,1.5).toFixed(2)),
  speedValue:Number(clamp(.75*p,.65,1.5).toFixed(2))
 };
}
function estimateFrameSeconds(frame,pacing){
 const p=pacing||pacingAtPace(3,3,1);
 const pauseSec=(transitionPause()*p.pauseScale)/1000;
 const leadSec=(practiceLead()*p.pauseScale)/1000;
 if(frame.kind==='word'){
  const han=countHan(frame.text)||1;
  const estStrokes=7.5+Math.min(2.5,(han-1)*.8);
  const strokePass=estStrokes*(.38/p.strokeSpeed+p.strokeDelayMs/1000);
  const strokeTotal=strokePass*(frame.loops||p.wordLoops||1);
  const audioOne=Math.max(.85,han*.42)/p.speechRate;
  return Math.max(strokeTotal,audioOne)+pauseSec;
 }
 if(frame.kind==='meaning'){
  const len=Array.from(frame.text||'').length;
  return Math.max(1.1,len/13.5)/p.viRate+pauseSec;
 }
 if(frame.kind==='chinese'){
  const han=countHan(frame.speak||frame.text)||Math.max(1,Array.from(frame.text||'').length/2);
  return (.55+han*.32)/p.speechRate+pauseSec;
 }
 if(frame.kind==='repeat'){
  const han=countHan(frame.text)||Math.max(1,Array.from(frame.text||'').length/2);
  const modelMs=((.55+han*.32)/p.speechRate)*1000;
  const kMs=Math.max(2200,karaokeDuration(frame,p.speedValue,modelMs)*p.karaokeScale);
  return leadSec+kMs/1000+pauseSec;
 }
 return Math.max(1.2,slideDuration(frame,p.speedValue)/1000)+pauseSec;
}
function estimateTotalSeconds(frames,pacing){
 return (frames||[]).reduce((sum,f)=>sum+estimateFrameSeconds(f,pacing),0);
}
function lessonMetrics(lesson,words,examples=()=>[]){
 const unique=[...new Map((words||[]).filter(w=>w.han&&w.mean).map(w=>[w.han,w])).values()];
 const c=lesson?.content||{};
 let exampleCount=0,totalHanChars=0;
 for(const w of unique){
  totalHanChars+=countHan(w.han);
  const list=examples(w)||[];
  exampleCount+=list.length;
  for(const x of list)totalHanChars+=countHan(x.cn);
 }
 const dialogueLines=(c.dialogues||[]).reduce((n,d)=>n+(d.lines?.length||0),0);
 for(const d of c.dialogues||[])for(const x of d.lines||[])totalHanChars+=countHan(x.cn);
 const readingLines=c.reading?.lines?.length||0;
 for(const x of c.reading?.lines||[])totalHanChars+=countHan(x.cn);
 const grammar=c.grammar||[];
 const grammarExamples=grammar.reduce((n,g)=>n+(g.examples?.length||0),0);
 for(const g of grammar)for(const x of g.examples||[])totalHanChars+=countHan(x.cn);
 return {wordCount:unique.length,exampleCount,dialogueLines,readingLines,grammarCount:grammar.length,grammarExamples,totalLines:exampleCount+dialogueLines+readingLines+grammarExamples,totalHanChars};
}
function estimateLessonBaseline(lesson,words,examples=()=>[]){
 const metrics=lessonMetrics(lesson,words,examples);
 const defaultFrames=presentation(lesson,words,examples,{wordLoops:3,meaningLoops:3});
 const baselineSec=estimateTotalSeconds(defaultFrames,pacingAtPace(3,3,1));
 const fastFrames=presentation(lesson,words,examples,{wordLoops:1,meaningLoops:1});
 const minSec=estimateTotalSeconds(fastFrames,pacingAtPace(1,1,2.35));
 const deepFrames=presentation(lesson,words,examples,{wordLoops:4,meaningLoops:3});
 const deepSec=estimateTotalSeconds(deepFrames,pacingAtPace(4,3,.6));
 const baselineMinutes=Math.max(3,Math.round(baselineSec/60));
 const minMinutes=Math.max(2,Math.min(baselineMinutes-1,Math.ceil(minSec/60)));
 const maxMinutes=Math.max(baselineMinutes+15,Math.min(180,Math.ceil(deepSec/60)));
 return {baselineMinutes,baselineSeconds:Math.round(baselineSec),minMinutes,maxMinutes,slideCount:defaultFrames.length,metrics};
}
function computePacingForTarget(lesson,words,targetMinutes,examples=()=>[]){
 const baseline=estimateLessonBaseline(lesson,words,examples);
 const clampedTarget=clamp(Math.round(Number(targetMinutes)||baseline.baselineMinutes),baseline.minMinutes,Math.max(baseline.maxMinutes,180));
 const targetSec=clampedTarget*60;
 const ratio=clampedTarget/Math.max(1,baseline.baselineMinutes);
 const tiers=[
  {wordLoops:4,meaningLoops:3,bias:ratio>=1.18?.02:.24},
  {wordLoops:3,meaningLoops:3,bias:ratio<=.6?.18:ratio<=.85?.10:0},
  {wordLoops:2,meaningLoops:2,bias:ratio<=.6?.08:ratio<=.85?0:.08},
  {wordLoops:2,meaningLoops:1,bias:ratio<=.6?.03:ratio<=.85?.04:.14},
  {wordLoops:1,meaningLoops:1,bias:ratio<=.6?0:ratio<=.85?.09:.20}
 ];
 let best=null;
 for(const tier of tiers){
  if(tier.wordLoops===4&&clampedTarget<baseline.baselineMinutes*1.12)continue;
  const frames=presentation(lesson,words,examples,{wordLoops:tier.wordLoops,meaningLoops:tier.meaningLoops});
  let lo=.55,hi=2.35;
  const maxDur=estimateTotalSeconds(frames,pacingAtPace(tier.wordLoops,tier.meaningLoops,lo));
  const minDur=estimateTotalSeconds(frames,pacingAtPace(tier.wordLoops,tier.meaningLoops,hi));
  let chosenPace;
  if(targetSec>=maxDur)chosenPace=lo;
  else if(targetSec<=minDur)chosenPace=hi;
  else{
   for(let i=0;i<24;i++){
    const mid=(lo+hi)/2;
    if(estimateTotalSeconds(frames,pacingAtPace(tier.wordLoops,tier.meaningLoops,mid))>targetSec)lo=mid;
    else hi=mid;
   }
   chosenPace=(lo+hi)/2;
  }
  const pacing=pacingAtPace(tier.wordLoops,tier.meaningLoops,chosenPace);
  const estSec=estimateTotalSeconds(frames,pacing);
  const relErr=Math.abs(estSec-targetSec)/Math.max(60,targetSec);
  const pacePenalty=Math.abs(chosenPace-1)*.45;
  const score=relErr*6+pacePenalty+tier.bias;
  if(!best||score<best.score){
   best={score,pacing,estSec,slideCount:frames.length};
  }
 }
 const p=best.pacing;
 const estimatedMinutes=Math.max(1,Math.round(best.estSec/60));
 const rhythmLabel=p.karaokeScale<=.55?'Rất nhanh':p.karaokeScale<=.82?'Nhanh gọn':p.karaokeScale<=1.12?'Tiêu chuẩn':'Thư thả';
 return {
  ...p,
  targetMinutes:clampedTarget,
  estimatedMinutes,
  estimatedSeconds:Math.round(best.estSec),
  slideCount:best.slideCount,
  rhythmLabel,
  summaryVi:`${p.wordLoops} lượt viết/đọc từ · ${p.meaningLoops} lượt nghĩa · giọng Trung ${p.speechRate}x · nhịp ${rhythmLabel.toLowerCase()}`
 };
}
function classifyTimeBudget(targetMinutes,referenceMinutes,minSafeMinutes,maxRelaxedMinutes){
 const ref=Math.max(3,Math.round(Number(referenceMinutes)||20));
 const minSafe=Number.isFinite(Number(minSafeMinutes))&&Number(minSafeMinutes)>=2?Math.min(ref,Math.round(Number(minSafeMinutes))):Math.max(2,Math.round(ref*.9));
 const maxRelaxed=Number.isFinite(Number(maxRelaxedMinutes))&&Number(maxRelaxedMinutes)>ref?Math.round(Number(maxRelaxedMinutes)):Math.max(ref+2,Math.round(ref*1.2));
 const target=Math.max(1,Math.round(Number(targetMinutes)||ref));
 if(target<minSafe)return {zone:'rush',color:'red',label:'Học gấp · Dưới mức chuẩn',detail:`Rút gọn lặp & tăng nhịp để xong trong ${target}p (chuẩn ~${ref}p).`,minSafeMinutes:minSafe,maxRelaxedMinutes:maxRelaxed,referenceMinutes:ref};
 if(target<=maxRelaxed)return {zone:'optimal',color:'green',label:'Chuẩn · Phù hợp để ghi nhớ',detail:`Nằm trong khoảng chuẩn ${minSafe}–${maxRelaxed}p (ước tính ~${ref}p).`,minSafeMinutes:minSafe,maxRelaxedMinutes:maxRelaxed,referenceMinutes:ref};
 return {zone:'relaxed',color:'blue',label:'Thư thả · Luyện sâu hơn',detail:`Tăng lặp và giãn nhịp chậm rãi hơn mức chuẩn (~${ref}p).`,minSafeMinutes:minSafe,maxRelaxedMinutes:maxRelaxed,referenceMinutes:ref};
}
function parseAiTimeEstimate(raw,fallbackMinutes=20){
 const fallback=Math.max(3,Math.min(180,Math.round(Number(fallbackMinutes)||20)));
 let obj=null;
 const tryParse=text=>{
  if(!text||typeof text!=='string')return null;
  let s=text.trim().replace(/```(?:json)?\s*([\s\S]*?)\s*```/i,'$1').trim();
  try{const p=JSON.parse(s);if(p&&typeof p==='object')return p;}catch{}
  const first=s.indexOf('{'),last=s.lastIndexOf('}');
  if(first!==-1&&last>first){try{const p=JSON.parse(s.slice(first,last+1));if(p&&typeof p==='object')return p;}catch{}}
  return null;
 };
 if(raw&&typeof raw==='object'){
  obj=typeof raw.answer==='string'?(tryParse(raw.answer)||raw):raw;
 }else if(typeof raw==='string'){
  obj=tryParse(raw);
 }
 let rec=Number(obj?.recommendedMinutes??obj?.estimatedMinutes??obj?.minutes);
 if(!Number.isFinite(rec)&&typeof raw==='string'){
  const m=raw.match(/(\d{1,3})\s*(?:phút|p\b|min)/i);
  if(m)rec=Number(m[1]);
 }
 if(!Number.isFinite(rec)&&raw&&typeof raw==='object'&&typeof raw.answer==='string'){
  const m=raw.answer.match(/(\d{1,3})\s*(?:phút|p\b|min)/i);
  if(m)rec=Number(m[1]);
 }
 const recommendedMinutes=Number.isFinite(rec)?clamp(Math.round(rec),3,180):fallback;
 const rawMin=Number(obj?.minSafeMinutes);
 const minSafeMinutes=Number.isFinite(rawMin)&&rawMin>=2&&rawMin<recommendedMinutes?clamp(Math.round(rawMin),Math.max(2,Math.round(recommendedMinutes*.7)),Math.max(2,recommendedMinutes-1)):Math.max(2,Math.round(recommendedMinutes*.9));
 const rawMax=Number(obj?.maxRelaxedMinutes);
 const maxRelaxedMinutes=Number.isFinite(rawMax)&&rawMax>recommendedMinutes?clamp(Math.round(rawMax),recommendedMinutes+1,Math.min(240,Math.round(recommendedMinutes*1.45))):Math.max(recommendedMinutes+2,Math.round(recommendedMinutes*1.2));
 const reasonCandidate=typeof obj?.reasonVi==='string'&&obj.reasonVi.trim()?obj.reasonVi.trim():typeof obj?.reason==='string'&&obj.reason.trim()?obj.reason.trim():'';
 const reasonVi=reasonCandidate.slice(0,260)||`Ước tính trung bình khoảng ${recommendedMinutes} phút để học trọn từ vựng, ví dụ, hội thoại và ngữ pháp của bài.`;
 return {recommendedMinutes,minSafeMinutes,maxRelaxedMinutes,reasonVi,parsedFromAi:Number.isFinite(rec)};
}
// Display-only segmentation: retain original letters/tones; never regenerate pronunciation.
function formatPinyin(value,han=''){
 const source=String(value||'').normalize('NFC'),expected=/^[\p{Script=Han}]+$/u.test(han)?Array.from(han).length:0;
 const tokenPattern=/[\p{Script=Latin}\p{M}1-5]+/gu,whole=/^[\p{Script=Latin}\p{M}1-5]+$/u.test(source.trim());
 return source.replace(tokenPattern,token=>{
  const chars=Array.from(token),memo=new Map();
  const valid=piece=>{const tones=piece.match(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ1-5]/g)||[];if(tones.length>1)return false;const base=piece.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');return /^(?:(?:zh|ch|sh|[bpmfdtnlgkhjqxrzcswy])?(?:a|o|e|ai|ei|ao|ou|an|en|ang|eng|ong|i|ia|ie|iao|iu|ian|in|iang|ing|iong|u|ua|ue|uo|uai|ui|uan|un|uang|ueng|v|ve|van|vn)|er|ng)[1-5]?$/.test(base);};
  function solve(i){if(i===chars.length)return new Map([[0,[]]]);if(memo.has(i))return memo.get(i);const out=new Map();for(let end=Math.min(chars.length,i+7);end>i;end--){const part=chars.slice(i,end).join('');if(!valid(part))continue;for(const [count,rest]of solve(end))if(!out.has(count+1))out.set(count+1,[part,...rest]);}memo.set(i,out);return out;}
  const choices=solve(0),count=whole&&expected&&choices.has(expected)?expected:Math.min(...choices.keys());return choices.get(count)?.join(' ')||token;
 }).replace(/[’']/g,' ').replace(/\s+/g,' ').trim();
}
const api={formatPinyin,plan,duration,presentation,slideDuration,practiceLead,transitionPause,pronunciationGap,karaokeDuration,lessonMetrics,estimateFrameSeconds,estimateTotalSeconds,estimateLessonBaseline,computePacingForTarget,classifyTimeBudget,parseAiTimeEstimate};root.HSKGuidedCore=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='object'?window:globalThis);
