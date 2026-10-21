const $ = id => document.getElementById(id);
const DAY = 86400000, STORE_KEY = 'hsk-flashcards-progress-v1';
let records = Object.create(null);
function storageWarning() {
  $('storageNotice').hidden = false;
  $('storageNotice').textContent = 'Trình duyệt không lưu được tiến độ. Các thay đổi hiện chỉ được giữ trong phiên đang mở.';
}
try {
  const saved = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
  if (saved && saved.version === 1 && saved.words && typeof saved.words === 'object') {
    for (const [k,r] of Object.entries(saved.words)) {
      if (r && ['known','unknown'].includes(r.status) && Number.isFinite(r.due) && Number.isFinite(r.interval) && r.interval >= 0 && Number.isFinite(r.ease) && r.ease >= 1.3 && Number.isInteger(r.reps) && r.reps >= 0) records[k] = r;
    }
  }
} catch (e) { storageWarning(); }
function saveRecords() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify({version:1, words:records})); }
  catch (e) { storageWarning(); }
}
const wordKey = w => w.learningKey || `${w.hsk}|${w.han}|${w.pin}`;
for (const w of words) {
  w.learningKey=wordKey(w);
  Object.assign(w,exampleMetadata.corrections[wordKey(w)]||{});
  w.originalExampleMetadata=exampleMetadata.original[wordKey(w)]||{};
  w.practice=checkedPracticeExamples.entries[wordKey(w)]||null;
  const extra=dictionarySupplement.entries[wordKey(w)];
  w.dictionary=extra;
  let base=w.mean;
  const m=base.match(/^([^()]+)\(([^()]+)\)\s*$/);
  if(m&&m[1].trim().toLocaleLowerCase('vi')===w.hv.toLocaleLowerCase('vi'))base=m[2];
  const meanings=[base,...(extra?.meanings||[]).map(m=>m.gloss),...(w.practice?.meanings||[]),extra?.example?.meaning,w.originalExampleMetadata.meaning].filter(Boolean);
  w.mean=[...new Set(meanings)].join('; ');
}
const dictionaryReport=dictionarySupplement.report;
function pinyinLine(pin) {
  const p=document.createElement('p');p.className='example-pinyin';p.lang='zh-Latn';p.textContent=pin||'';return p;
}
$('dictionaryCoverage').textContent=`Hanzii: đã đối chiếu ${dictionaryReport.matched.toLocaleString('vi')} / ${dictionaryReport.total.toLocaleString('vi')} mục`;
$('dictionaryCoverageDetail').textContent=`Bản bổ sung ngày ${dictionaryReport.date}: mở rộng nghĩa cho ${dictionaryReport.expandedWords} từ và thêm ${dictionaryReport.addedExamples} câu ví dụ ngắn từ bộ đối chiếu trước. Có 3–4 ví dụ cho ${checkedPracticeExamples.report.covered.toLocaleString('vi')} / ${dictionaryReport.total.toLocaleString('vi')} mục; câu biên soạn được ghi rõ. Đợt 11/10 bổ sung ${dictionaryReport.addedCourseWords||0} mục theo giáo trình và 249 ví dụ tự biên soạn; cấp độ của mục bổ sung là cấp bài học, không khẳng định phân loại trong danh sách thi chính thức. Còn ${dictionaryReport.notMatched.toLocaleString('vi')} mục tên riêng/mẫu ngữ pháp chưa đối chiếu từ điển. Đây là tiến độ bổ sung dữ liệu, không phải tiến độ học.`;
function renderDictionaryExample(container,w) {
  container.replaceChildren();
  const extra=w.dictionary;
  if(!extra&&!w.practice){container.hidden=true;return;}
  container.hidden=false;
  const box=document.createElement('div');box.className='dictionary-extra';
  if(w.vocabularyProvenance){const note=document.createElement('p');note.className='hint';note.textContent='Từ bổ sung theo bài HSK '+w.hsk+' · '+w.vocabularyProvenance.label;box.append(note);}
  if(container.id==='srsDictionaryExample')box.append(wordRelationDetails(w));
  if(extra?.meanings.length) {
    const details=document.createElement('details'), summary=document.createElement('summary');
    summary.className='dictionary-source';summary.textContent=`Nghĩa bổ sung (${extra.meanings.length})`;details.append(summary);
    const groups=new Map();
    for(const m of extra.meanings) {if(!groups.has(m.pos))groups.set(m.pos,[]);groups.get(m.pos).push(m.gloss);}
    for(const [pos,glosses] of groups) {const p=document.createElement('p');p.textContent=`${pos}: ${glosses.join('; ')}`;details.append(p);}
    box.append(details);
  }
  if(w.practice) {
    const title=document.createElement('h3');title.textContent=`Ví dụ cách dùng (${w.practice.examples.length})`;box.append(title);
    for(const [i,e] of w.practice.examples.entries()) {
      const item=document.createElement('section');item.className='practice-example';
      const label=document.createElement('p');label.className='example-sense';label.textContent=`${i+1}. Nghĩa: ${e.meaning || e.sense}`;
      const cn=document.createElement('p');cn.className='dictionary-cn';cn.textContent=e.cn;
      const vi=document.createElement('p');vi.textContent=e.vi;
      const note=document.createElement('small');note.className='example-origin';note.textContent=e.origin==='hanzii'?'Câu gốc · Hanzii':e.origin==='original'?'Câu trong dữ liệu gốc':w.practice?.sourceKind&&w.practice.sourceKind!=='hanzii'?'Câu tự biên soạn · tên riêng/mẫu ngữ pháp giáo trình':'Câu biên soạn · nghĩa và phiên âm mục từ đối chiếu Hanzii';
      item.append(label,cn,pinyinLine(e.pin),vi);
      if(e.sense&&e.sense!==e.meaning){const usage=document.createElement('small');usage.className='example-origin';usage.textContent=`Cách dùng: ${e.sense}`;item.append(usage);}
      item.append(note);box.append(item);
    }
  } else if(extra?.example && extra.example.cn!==w.exCn) {
    const title=document.createElement('h3');title.textContent='Ví dụ bổ sung · Hanzii';box.append(title);
    const cn=document.createElement('p');cn.className='dictionary-cn';cn.textContent=extra.example.cn;
    const vi=document.createElement('p');vi.textContent=extra.example.vi;box.append(cn,pinyinLine(extra.example.pin),vi);
  }
  let source;
  try{source=new URL(w.practice?.checkedAgainst||extra?.url);}catch(e){source=null;}
  if(source?.protocol==='https:'&&source.hostname==='hanzii.net'&&source.pathname.startsWith('/search/word/')) {
    const a=document.createElement('a');a.className='dictionary-source';a.textContent='Nguồn đối chiếu nghĩa · Hanzii ↗';a.href=source.href;a.target='_blank';a.rel='noopener noreferrer';box.append(a);
  }
  container.append(box);
}
const recordOf = w => records[wordKey(w)];
const statusOf = w => recordOf(w)?.status || 'unknown';
const sensesMap = new Map(words.map(w => [w,splitSenses(w)]));
let activeLevel='all', mode='learn', currentWords=[], index=0;
const levelWords = () => activeLevel==='all' ? words : words.filter(w=>String(w.hsk)===activeLevel);
function matchStatus(w,scope) { return scope==='all' || (scope==='due' ? !!recordOf(w)&&recordOf(w).due<=Date.now() : statusOf(w)===scope); }
function stats() {
 const pool=levelWords(), known=pool.filter(w=>statusOf(w)==='known').length;
 $('learningStats').textContent=`Đã thuộc: ${known} · Chưa thuộc: ${pool.length-known} (gồm chưa đánh dấu)`;
 const due=pool.filter(w=>recordOf(w)&&recordOf(w).due<=Date.now()).length;
 const unseen=pool.filter(w=>!recordOf(w)).length;
 const future=pool.filter(w=>recordOf(w)&&recordOf(w).due>Date.now()).map(w=>recordOf(w).due);
 $('srsStats').textContent=`Đến hạn: ${due} · Chưa ôn: ${unseen} · Đã có lịch: ${pool.length-unseen}`+(future.length ? ` · Lần ôn kế tiếp: ${new Date(Math.min(...future)).toLocaleString('vi-VN')}`:'');
 updateQuizScopeInfo();
}
function makeMasteryTools(w) {
 const wrap=document.createElement('div'); wrap.className='mastery-tools';
 for(const [status,label,symbol] of [['known','Đã thuộc','✓'],['unknown','Chưa thuộc','×']]) {
  const b=document.createElement('button'); b.type='button'; b.className=`mastery-btn ${status}`; b.textContent=`${symbol} ${label}`; b.title=label; b.setAttribute('aria-label',`${label}: ${w.han}`); b.setAttribute('aria-pressed',String(recordOf(w)?.status===status));
  b.onclick=e=>{e.stopPropagation();markWord(w,status);}; wrap.append(b);
 }
 return wrap;
}
function markWord(w,status) {
 const old=recordOf(w);
 records[wordKey(w)]={...(old || {ease:2.5,reps:0,interval:0,lapses:0}),status,due:status==='known' ? (old?.status==='known' ? old.due : Date.now()+DAY) : Date.now(),interval:status==='known'?Math.max(old?.interval||0,1):0,lastMarked:Date.now()};
 saveRecords(); const before=currentWords[index], wasFlipped=$('flashcard').classList.contains('flipped'); rebuildDeck(before);
 if(wasFlipped && currentWords[index]===before)$('flashcard').classList.add('flipped');
 if(mode==='search')renderSearch(); stats();
}
function rebuildDeck(preserve) {
 const oldIndex=index;
 currentWords=levelWords().filter(w=>matchStatus(w,$('masteryFilter').value));
 index=preserve?currentWords.indexOf(preserve):0;
 if(index<0)index=Math.min(oldIndex,Math.max(0,currentWords.length-1));
 updateCard();
}
function updateCard() {
 window.dispatchEvent(new Event('hsk-flashcard-change'));
 window.HSKSpeech?.stop();
 document.querySelectorAll('#flashcard .speech-button').forEach(b=>b.remove());
 $('flashcard').classList.remove('flipped'); $('example').classList.remove('show'); $('jumpStatus').textContent='';
 const empty=!currentWords.length;
 for(const id of ['prev','next','shuffle','exampleBtn','jumpBtn','jumpInput'])$(id).disabled=empty;
 document.querySelectorAll('#flashcard .mastery-tools,#flashcard .status-label').forEach(e=>e.remove());
 if(empty) { renderCardRelations(null); $('han').textContent='Không có từ'; $('pin').textContent='Thử chọn HSK hoặc trạng thái khác'; $('mean').textContent=''; $('hv').textContent=''; $('hskTag').textContent=''; $('exCn').textContent='';$('exPin').textContent='';$('exVi').textContent='';$('dictionaryExamples').replaceChildren();$('dictionaryExamples').hidden=true;$('progress').textContent='Thẻ: 0 / 0'; stats(); return; }
 index=(index+currentWords.length)%currentWords.length;
 const w=currentWords[index];
 for(const id of ['han','pin','mean'])$(id).textContent=w[id]||'';
 $('hv').textContent=w.hv?`HV: ${w.hv}`:'';
 $('hskTag').textContent=`HSK ${w.hsk}`; $('hskTag').className=`hsk-tag hsk${w.hsk}-tag`;
 $('exCn').textContent=w.practice?'':w.exCn||''; $('exPin').textContent=w.practice?'':w.originalExampleMetadata.pin||''; $('exVi').textContent=w.practice?'':w.exVi||'';
 renderDictionaryExample($('dictionaryExamples'),w);
 renderCardRelations(w);
 $('exampleBtn').hidden=!(w.exCn||w.exVi||w.dictionary);
 $('progress').textContent=`Thẻ: ${index+1} / ${currentWords.length}`;
 $('jumpInput').max=currentWords.length;
 document.querySelectorAll('#flashcard .front,#flashcard .back').forEach(face=>{const b=window.HSKSpeech?.button(w.han,'Nghe phát âm '+w.han);if(b){b.classList.add('card-speech');face.append(b);}});
 $('flashcard').append(makeMasteryTools(w));
 document.querySelectorAll('#flashcard .front,#flashcard .back').forEach(face=>{
  const label=document.createElement('span'); label.className='status-label';label.textContent=recordOf(w)?(statusOf(w)==='known'?'✓ Đã thuộc':'× Chưa thuộc'):'Chưa đánh dấu';face.append(label);
 });
 stats();
}
function switchMode(next) {
 window.HSKSpeech?.stop();
 mode=next;
 if(next!=='lessons')document.body.classList.remove('show-lessons','lesson-focus');
 if(!['quiz','srs'].includes(next))$('lessonPracticeBack').hidden=true;
 for(const name of ['learn','search','quiz','srs','mistakes','compare','lessons'])$(name+'Panel').hidden=name!==mode;
 document.querySelectorAll('[data-mode]').forEach(b=>{ b.classList.toggle('active',b.dataset.mode===mode);b.setAttribute('aria-pressed',String(b.dataset.mode===mode));});
 if(mode==='lessons')window.HSKLessonNav?.open();
 if(mode==='mistakes')renderMistakes();if(mode==='compare')renderComparisons(); stats();
}
let searchMatches=[], visibleResults=40, searchTimer, searchPinyinAllowed=true, searchScope='hsk',searchExplicit=false;
function searchScore(w,q,terms) {
 if(w.han===q.trim())return 150;
 if(/^[\u3400-\u9fff]+$/.test(q.trim())&&w.han.includes(q.trim()))return 110;
 if(searchPinyinAllowed&&window.HSKOpenDictionaryCore?.fold(w.pin)===window.HSKOpenDictionaryCore?.fold(q)&&/[a-z]/i.test(q))return 120;
 const senses=sensesMap.get(w), vietnamese=senses.map(viText);
 const meanings=senses.map(s=>hasAccent(q)?viText(s):fold(s)), query=hasAccent(q)?viText(q):fold(q);
 if(meanings.some(s=>s===query))return 100;
 if(meanings.some(s=>phraseIn(s,query)))return 90;
 // Synonym expansion preserves accents (bố ≠ bỏ). A short alias must be a whole sense.
 if(vietnamese.some(s=>terms.some(t=>t.split(' ').length===1?bareSense(s)===t:phraseIn(s,t))))return 75;
 const tokens=query.split(' ');
 if(tokens.length>1 && meanings.some(s=>tokens.filter(t=>phraseIn(s,t)).length>=Math.max(2,Math.ceil(tokens.length*.75))))return 45;
 if(senses.some(s=>typoSimilar(fold(q),fold(s))))return 25;
 return 0;
}
let handwritingSearchCharacter='';
function runSearch() {
 clearTimeout(searchTimer); const q=fold($('searchInput').value); visibleResults=40;
 if(handwritingSearchCharacter){searchMatches=(searchScope==='general'?words:levelWords()).filter(w=>w.han.includes(handwritingSearchCharacter)).map((w,i)=>({w,score:110,i})).sort((a,b)=>Number(a.w.hsk)-Number(b.w.hsk)||a.i-b.i);renderSearch();return;}
 if(!q){searchMatches=[];renderSearch();return;}
 const terms=expandedTerms($('searchInput').value);
 const query=$('searchInput').value.trim(),normalized=hasAccent(query)?viText(query):fold(query);
 searchPinyinAllowed=!words.some(w=>sensesMap.get(w).some(s=>(hasAccent(query)?viText(s):fold(s))===normalized));
 const pool=searchScope==='general'?words:[...new Set([...levelWords(),...words.filter(w=>w.han===query||searchPinyinAllowed&&window.HSKOpenDictionaryCore?.fold(w.pin)===window.HSKOpenDictionaryCore?.fold(query)&&/[a-z]/i.test(query))])];
 searchMatches=pool.map((w,i)=>({w,score:searchScore(w,query,terms),i})).filter(r=>r.score>0).sort((a,b)=>Number(b.score>=120)-Number(a.score>=120)||Number(a.w.hsk)-Number(b.w.hsk)||b.score-a.score||a.i-b.i);
 renderSearch();
}
function renderSearch() {
 const general=searchScope==='general';$('searchResults').hidden=general;$('searchSummary').hidden=general;
 $('searchResults').replaceChildren(); const q=fold($('searchInput').value);
 $('searchSummary').textContent=handwritingSearchCharacter?(searchMatches.length?`Chứa chữ ${handwritingSearchCharacter} · ${searchMatches.length} kết quả`:`Chưa thấy từ chứa ${handwritingSearchCharacter}. Thử đổi bộ lọc hoặc vẽ lại.`):!q?'':searchMatches.length?`${searchMatches.length} kết quả${visibleResults<searchMatches.length?' · Đang hiện '+visibleResults:''}`:'Chưa tìm thấy. Thử từ ngắn hơn hoặc đổi cách diễn đạt.';
 for(const {w} of searchMatches.slice(0,visibleResults)) {
  const card=document.createElement('details');card.className='result-card dictionary-row';const summary=document.createElement('summary');summary.className='dictionary-row-summary';const han=document.createElement('span');han.className='result-open dictionary-row-han';han.textContent=w.han;const meaning=document.createElement('span');meaning.className='dictionary-row-meaning';meaning.textContent=w.mean.split(/[;；\n]/)[0];const pin=document.createElement('span');pin.className='dictionary-row-pinyin';pin.textContent=w.pin;summary.append(han,meaning,pin);card.append(summary);
  const body=document.createElement('div');body.className='dictionary-row-body';body.append(makeMasteryTools(w));const tag=document.createElement('span');tag.className=`hsk-tag hsk${w.hsk}-tag`;tag.textContent=`HSK ${w.hsk}`;body.append(tag);
  const open=document.createElement('button');open.type='button';open.textContent='Mở thẻ HSK';open.onclick=()=>{if(activeLevel!=='all'&&String(w.hsk)!==activeLevel)document.querySelector('[data-filter="'+w.hsk+'"]').click();$('masteryFilter').value='all';rebuildDeck(w);switchMode('learn');$('flashcard').focus();};body.append(open);const notebook=window.HSKNotebook?.button(()=>w);if(notebook)body.append(notebook);
  for(const value of [w.pin,w.mean]) {const p=document.createElement('p');p.textContent=value;body.append(p);}const speech=window.HSKSpeech?.button(w.han,'Nghe phát âm '+w.han);if(speech)body.append(speech);
  const label=document.createElement('small');label.textContent=recordOf(w)?statusOf(w)==='known'?'✓ Đã thuộc':'× Chưa thuộc':'Chưa đánh dấu';body.append(label,wordRelationDetails(w));card.append(body);$('searchResults').append(card);
 }
 $('searchMore').hidden=general||visibleResults>=searchMatches.length;
 const submitted=searchExplicit;searchExplicit=false;window.dispatchEvent(new CustomEvent('hsk-search-rendered',{detail:{submitted}}));
}
window.HSKHandwritingSearch={
 characters:()=>[...new Set(words.flatMap(w=>Array.from(w.han).filter(c=>/[\u3400-\u9fff\u3007]/.test(c))))].join(''),
 select(character){if(typeof character!=='string'||!/^\p{Script=Han}$/u.test(character)&&character!=='〇')return {supported:false,count:0};handwritingSearchCharacter=character;$('searchInput').value=character;const fallback=searchScope==='hsk'&&!levelWords().some(w=>w.han.includes(character));if(fallback)window.HSKDictionaryBridge.setScope('general');else runSearch();return {supported:true,count:searchMatches.length,scope:searchScope,fallback};},
 clear(){handwritingSearchCharacter='';runSearch();}
};
// Adaptive spaced repetition. Due dates are timestamps, so the schedule survives closing the file.
function nextSchedule(w,rating,now=Date.now()) {
 const old=recordOf(w)||{ease:2.5,reps:0,interval:0,lapses:0}; let ease=old.ease, interval,reps=old.reps,lapses=old.lapses||0;
 if(rating==='again'){interval=10/1440;ease=Math.max(1.3,ease-.2);reps=0;lapses++;}
 else if(rating==='hard'){interval=Math.max(1,old.interval*1.2);ease=Math.max(1.3,ease-.15);reps++;}
 else if(rating==='easy'){interval=old.reps===0?4:Math.max(4,old.interval*ease*1.3);ease=Math.min(3.5,ease+.15);reps++;}
 else {interval=old.reps===0?1:old.reps===1?3:Math.max(1,old.interval*ease);reps++;}
 return {...old,ease,interval,reps,lapses,due:now+Math.round(interval*DAY),lastReview:now,status:['good','easy'].includes(rating)?'known':'unknown'};
}
function review(w,rating) {records[wordKey(w)]=nextSchedule(w,rating);saveRecords();stats();}
// Both quiz directions use true senses from the source data, not invented translations.
let quizSession=null, question=null;
function quizLevelWords() {
 const selection=$('quizLevelMode').value;
 if(selection==='all')return words;
 const from=Number(selection==='single'?$('quizSingleLevel').value:$('quizLevelFrom').value);
 const to=Number(selection==='single'?$('quizSingleLevel').value:$('quizLevelTo').value);
 return words.filter(w=>Number(w.hsk)>=from && Number(w.hsk)<=to);
}
function quizLevelLabel() {
 const selection=$('quizLevelMode').value;
 if(selection==='all')return 'HSK 1–6';
 if(selection==='single')return `HSK ${$('quizSingleLevel').value}`;
 const from=$('quizLevelFrom').value, to=$('quizLevelTo').value;
 return from===to?`HSK ${from}`:`HSK ${from}–${to}`;
}
const contextQuizMap = new Map(contextQuizBank.map(item=>[item.key,item]));
const contextMode = direction => ['blank','usage'].includes(direction);
const quizTypeLabels={han:'Chữ Hán → nghĩa',mean:'Nghĩa → chữ Hán',blank:'Điền từ',usage:'Nghĩa theo ngữ cảnh',contrast:'Phân biệt từ dễ nhầm'};
function selectedQuizTypes(direction=$('quizDirection').value) {
 if(direction==='combined')return [...document.querySelectorAll('input[name="quizType"]:checked')].map(input=>input.value);
 return direction==='mixed'?['han','mean']:[direction];
}
function quizTypeSchedule(types,count) {
 const plan=[];while(plan.length<count)plan.push(...shuffled(types));return plan.slice(0,count);
}
function quizEligibleWords(pool,direction) {
 const types=selectedQuizTypes(direction);if(!types.length)return [];
 return pool.filter(w=>matchStatus(w,$('quizScope').value)&&types.every(type=>contextMode(type)?contextQuizMap.has(wordKey(w)):sensesMap.get(w).length));
}
function contextSpans(han,cn) {
 if(han==='愈……愈……') {
  const spans=[...cn.matchAll(/愈/g)].map(m=>[m.index,m.index+1]);return spans.length>=2?spans.slice(0,2):[];
 }
 const labels=han==='哪里 (哪儿)'?['哪里','哪儿']:[han.split(/[（(]/)[0].trim()];
 for(const label of labels) {
  const spans=[];let from=0,index;
  while(label && (index=cn.indexOf(label,from))!==-1){spans.push([index,index+label.length]);from=index+label.length;}
  if(spans.length)return spans;
 }
 return [];
}
function contextExampleItem(han,e) {
 const spans=contextSpans(han,e.cn);if(!spans.length)return null;
 let blank=e.cn;for(const [a,b] of [...spans].reverse())blank=blank.slice(0,a)+'＿＿＿'+blank.slice(b);
 const [a,b]=spans[0],label=e.cn.slice(a,b),sense=e.sense||e.meaning||'';
 return {cn:e.cn,blank,answer:han==='愈……愈……'?han:label,vi:e.vi,pin:e.pin,sense,origin:e.origin,explanation:`Trong câu “${e.cn}”, từ “${label}” mang nghĩa “${sense}”. Đối chiếu với bản dịch: ${e.vi}`};
}
function contextCases(w,entry=contextQuizMap.get(wordKey(w))) {
 if(!entry)return [];
 return w.practice.examples.map(e=>contextExampleItem(w.han,e)).filter(e=>e&&e.sense&&e.pin);
}
const contextRotation = new Map();
function nextContext(w,direction,cases) {
 const key=wordKey(w)+'|'+direction;
 let state=contextRotation.get(key);
 if(!state||!state.pending.length||state.count!==cases.length) {
  const order=shuffled(cases.map((_,i)=>i));
  if(state&&order.length>1&&order[0]===state.last)[order[0],order[1]]=[order[1],order[0]];
  state={pending:order,last:state?.last,count:cases.length};contextRotation.set(key,state);
 }
 const index=state.pending.shift();state.last=index;return cases[index];
}
function createContextQuestion(w,direction,candidatePool=quizLevelWords()) {
 const cases=contextCases(w);if(!cases.length)return null;
 const item=nextContext(w,direction,cases);
 if(direction==='blank') {
  const base=createQuestion(w,'mean',candidatePool);if(!base)return null;
  return {...base,direction,item,options:shuffled(base.options.map(option=>option.correct?{...option,text:item.answer||w.han}:option))};
 }
 const own=sensesMap.get(w),seen=new Set([exact(item.sense)]),wrong=[];
 for(const candidate of shuffled(candidatePool)) {
  if(candidate.han===w.han)continue;
  const other=sensesMap.get(candidate);
  if(other.some(s=>nearSenses(s,item.sense)||own.some(t=>nearSenses(s,t))))continue;
  const text=randomItem(other);if(!text||seen.has(exact(text)))continue;
  seen.add(exact(text));wrong.push({text,correct:false,w:candidate});if(wrong.length===3)break;
 }
 if(wrong.length<3)return null;
 return {w,direction,item,sense:item.sense,answered:false,options:shuffled([{text:item.sense,correct:true,w},...wrong])};
}
function updateQuizScopeInfo() {
 $('quizCombinedTypes').hidden=$('quizDirection').value!=='combined';
 $('quizSingleRow').hidden=$('quizLevelMode').value!=='single';
 $('quizRangeRow').hidden=$('quizLevelMode').value!=='range';
 const pool=quizLevelWords(), eligible=quizEligibleWords(pool,$('quizDirection').value);
 const count=Number($('quizCount').value);
 $('quizPoolPreview').textContent=`${quizLevelLabel()} · ${pool.length} từ · ${eligible.length} từ trong nhóm đã chọn`+(Number.isInteger(count)&&count>0&&count<=100?` · Lượt ôn: ${Math.min(count,eligible.length)} câu`:'')+($('quizDirection').value==='combined'?` · Trộn: ${selectedQuizTypes().map(type=>quizTypeLabels[type]).join(', ')||'chưa chọn dạng'}`:'')+(selectedQuizTypes().some(contextMode)?` · ${contextQuizMap.size.toLocaleString('vi-VN')} mục; mỗi từ có cả hai dạng câu hỏi.`:'');
}
function resetQuiz(message='Đã đổi phạm vi ôn. Bấm Bắt đầu để tạo lượt mới.') {
 quizSession=null;question=null;$('quizPrompt').textContent='';$('quizOptions').replaceChildren();$('quizNext').hidden=true;$('quizProgress').textContent='';$('quizFeedback').textContent=message;
}
function createQuestion(w,direction,candidatePool=quizLevelWords()) {
 if(contextMode(direction))return createContextQuestion(w,direction,candidatePool);
 const senses=sensesMap.get(w);if(!senses.length)return null;
 const sense=randomItem(senses), label=direction==='han'?sense:w.han;
 const distractors=[], seen=new Set([exact(label)]);
 // Keep every answer within the selected HSK range, regardless of mastery filters.
 const candidates=shuffled(candidatePool);
 for(const candidate of candidates) {
  if(candidate.han===w.han)continue;
  const cs=sensesMap.get(candidate);
  // A word sharing any sense or a known near-synonym cannot become a wrong choice.
  if(cs.some(s=>senses.some(t=>nearSenses(s,t))))continue;
  const text=direction==='han'?randomItem(cs):candidate.han;
  if(!text||seen.has(exact(text)))continue;
  seen.add(exact(text));distractors.push({text,correct:false,w:candidate});if(distractors.length===3)break;
 }
 if(distractors.length<3)return null;
 return {w,direction,sense,options:shuffled([{text:label,correct:true,w},...distractors]),answered:false};
}
function startQuiz(e) {
 e?.preventDefault(); const types=selectedQuizTypes();
 if(!types.length){resetQuiz('Chọn ít nhất một dạng câu hỏi để bắt đầu kiểm tra tổng hợp.');return;}
 const count=Number($('quizCount').value);
 if(!Number.isInteger(count)||count<1||count>100){$('quizFeedback').textContent='Nhập số câu từ 1 đến 100.';return;}
 const candidates=quizLevelWords();
 const pool=shuffled(quizEligibleWords(candidates,$('quizDirection').value));
 quizSession={pool:pool.slice(0,count),candidates,levelLabel:quizLevelLabel(),position:0,score:0,direction:$('quizDirection').value,types,plan:quizTypeSchedule(types,Math.min(count,pool.length))};
 $('quizNext').hidden=true; $('quizOptions').replaceChildren();$('quizPrompt').textContent='';
 if(!pool.length){quizSession=null;$('quizProgress').textContent='';$('quizFeedback').textContent=contextMode($('quizDirection').value)?'Chế độ này có câu hỏi cho HSK 1–6. Hãy chọn một cấp HSK từ 1 đến 6 và nhóm từ phù hợp.':'Không có từ trong nhóm đã chọn. Hãy đổi nhóm từ hoặc HSK.';return;}
 renderQuestion();
}
function renderQuestion() {
 const s=quizSession;if(!s)return;
 if(s.position>=s.pool.length){window.HSKLoading?.flash('Kết quả bài kiểm tra đang load...','Đang tổng hợp điểm số và cập nhật lịch ôn...',undefined,$('quizPanel'));$('quizProgress').textContent='Hoàn thành';$('quizPrompt').textContent=`${s.score} / ${s.pool.length} câu đúng`;$('quizOptions').replaceChildren();$('quizFeedback').textContent='Lịch ôn đã được cập nhật. Chọn Bắt đầu / Làm lại để tạo lượt mới.';$('quizNext').hidden=true;question=null;return;}
 if(s.position===0){const label=/^Ôn câu|^Ôn từ hay nhầm|^Làm lại câu|^Ôn trọng tâm/.test(s.levelLabel||'')?'Bài ôn câu sai đang load...':/^Phân biệt từ/.test(s.levelLabel||'')?'Bài luyện từ dễ nhầm đang load...':'Bài kiểm tra trắc nghiệm đang load...';window.HSKLoading?.flash(label,'Phạm vi: '+(s.levelLabel||'HSK'),undefined,$('quizPanel'));}
 const direction=s.plan?.[s.position]||(s.direction==='mixed'?randomItem(['han','mean']):s.direction);
 question=s.savedQuestions?{...s.savedQuestions[s.position],answered:false,options:shuffled(s.savedQuestions[s.position].options.map(option=>({...option})))}:createQuestion(s.pool[s.position],direction,s.candidates);
 $('quizOptions').replaceChildren();$('quizNext').hidden=true;$('quizFeedback').textContent='';
 $('quizProgress').textContent=`Câu ${s.position+1} / ${s.pool.length} · Đúng: ${s.score} · Phạm vi: ${s.levelLabel} · Từ HSK ${s.pool[s.position].hsk} · ${quizTypeLabels[direction]}`;
 if(!question){$('quizPrompt').textContent='Không đủ đáp án khác biệt để tạo câu này.';$('quizNext').hidden=false;return;}
 $('quizPrompt').style.whiteSpace='pre-line';
 if(direction==='contrast')$('quizPrompt').textContent=question.prompt+(question.prompt.includes('＿＿＿')?'':'\n'+question.item.cn);
 else if(contextMode(direction))$('quizPrompt').textContent=direction==='blank'?`Chọn từ phù hợp để điền vào chỗ trống:\n${question.item.blank}\nGợi ý nghĩa: ${question.item.vi}`:`Trong câu sau, “${question.item.answer}” mang nghĩa nào phù hợp nhất?\n${question.item.cn}\n${question.item.pin}`;
 else $('quizPrompt').textContent=(direction==='han'?'Chọn nghĩa của: ':'Chọn từ có nghĩa: ')+(direction==='han'?question.w.han:question.sense);
 question.options.forEach((option,i)=>{
  const b=document.createElement('button');b.textContent=`${String.fromCharCode(65+i)}. ${option.text}`;
  b.onclick=()=>answerQuiz(i);$('quizOptions').append(b);
 });
}
function answerQuiz(i) {
 if(!question||question.answered)return;question.answered=true;
 const chosen=question.options[i];const correct=chosen.correct;if(correct)quizSession.score++;
 [...$('quizOptions').children].forEach((b,j)=>{b.disabled=true;if(question.options[j].correct)b.classList.add('correct');else if(j===i)b.classList.add('wrong');});
 recordQuizMistake(question,chosen);
 review(question.w,correct?'good':'again');
 if(quizSession.lessonId)window.dispatchEvent(new CustomEvent('hsk-lesson-evidence',{detail:{id:quizSession.lessonId,key:wordKey(question.w),kind:'quiz',correct,time:Date.now()}}));
 const w=question.w;
 $('quizFeedback').textContent=`${correct?'✓ Chính xác!':'× Chưa đúng.'}\n${w.han} · ${w.pin}\nNghĩa: ${w.mean}\nÔn lại sau ${intervalLabel(recordOf(w).interval)}.`;
 if(question.item)$('quizFeedback').textContent+=`\n\nCâu đúng: ${question.item.cn}\n${question.item.pin}\n${question.item.vi}\n\nGiải thích: ${question.item.explanation}`;
 if(question.item && !correct && question.item.incorrectReasons?.[chosen.text])$('quizFeedback').textContent+=`\nLỗi ở đáp án bạn chọn: ${question.item.incorrectReasons[chosen.text]}`;
 $('quizNext').textContent=quizSession.position===quizSession.pool.length-1?'Xem kết quả':'Câu tiếp theo';$('quizNext').hidden=false;
}
let srsSession=null;
function startSrs() {
 const pool=levelWords(), due=pool.filter(w=>recordOf(w)&&recordOf(w).due<=Date.now()).sort((a,b)=>recordOf(a).due-recordOf(b).due);
 const fresh=shuffled(pool.filter(w=>!recordOf(w))).slice(0,10);
 srsSession={queue:[...due,...fresh],total:due.length+fresh.length,done:0};$('srsMessage').textContent='';window.HSKLoading?.flash('Phiên ôn tập SRS đang load...','Đang chuẩn bị thẻ từ cần ôn...',undefined,$('srsPanel'));renderSrs();
}
function renderSrs() {
 const s=srsSession;if(!s)return;stats();$('srsRatings').hidden=true;$('srsAnswer').hidden=true;$('srsReveal').hidden=false;
 if(!s.queue.length){$('srsCard').hidden=true;$('srsProgress').textContent=s.total?`Hoàn thành ${s.done} / ${s.total} từ`:'Chưa có từ cần ôn';
  $('srsMessage').textContent=(s.total?'Đã hoàn thành phiên ôn. ':'')+'Bấm Bắt đầu phiên ôn để kiểm tra từ đến hạn hoặc học thêm từ mới.';return;}
 const w=s.queue[0];$('srsCard').hidden=false;$('srsProgress').textContent=`Từ ${s.done+1} / ${s.total} · Đã ôn: ${s.done}`;
 $('srsHan').textContent=w.han;$('srsLevel').textContent=`HSK ${w.hsk}`;$('srsLevel').className=`hsk-tag hsk${w.hsk}-tag`;
 $('srsPin').textContent=w.pin;$('srsMean').textContent=w.mean;$('srsHv').textContent=w.hv?`HV: ${w.hv}`:'';$('srsExample').replaceChildren();if(!w.practice){const cn=document.createElement('p');cn.className='dictionary-cn';cn.textContent=w.exCn||'';const vi=document.createElement('p');vi.textContent=w.exVi||'';$('srsExample').append(cn,pinyinLine(w.originalExampleMetadata.pin),vi);}
 renderDictionaryExample($('srsDictionaryExample'),w);
 document.querySelectorAll('[data-rating]').forEach(b=>b.querySelector('small').textContent=intervalLabel(nextSchedule(w,b.dataset.rating).interval));
}
function rateSrs(rating) {
 if(!srsSession?.queue.length||$('srsAnswer').hidden)return;
 const w=srsSession.queue.shift();review(w,rating);srsSession.done++;
 if(srsSession.lessonId)window.dispatchEvent(new CustomEvent('hsk-lesson-evidence',{detail:{id:srsSession.lessonId,key:wordKey(w),kind:'srs',correct:['good','easy'].includes(rating),time:Date.now()}}));
 if(!srsSession.queue.length)window.HSKLoading?.flash('Kết quả phiên ôn SRS đang load...','Đã hoàn thành phiên ôn tập SRS...',undefined,$('srsPanel'));
 $('srsMessage').textContent=`${w.han}: ôn lại ${new Date(recordOf(w).due).toLocaleString('vi-VN')} (${intervalLabel(recordOf(w).interval)}).`;renderSrs();
}
function clearSessions() {
 resetQuiz('Đã đổi HSK. Bấm Bắt đầu để tạo lượt mới.');
 srsSession=null;$('srsCard').hidden=true;$('srsRatings').hidden=true;$('srsProgress').textContent='';$('srsMessage').textContent='Đã đổi HSK. Bấm Bắt đầu phiên ôn.';
}
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{rebuildDeck(currentWords[index]);switchMode(b.dataset.mode);});
document.querySelectorAll('.filter-btn').forEach(b=>{
 const count=b.dataset.filter==='all'?words.length:words.filter(w=>String(w.hsk)===b.dataset.filter).length;
 b.textContent=`${b.dataset.filter==='all'?'TẤT CẢ':'HSK '+b.dataset.filter} (${count})`;
 b.onclick=()=>{activeLevel=b.dataset.filter;document.querySelectorAll('.filter-btn').forEach(t=>t.classList.toggle('active',t===b));
  $('quizLevelMode').value=activeLevel==='all'?'all':'single';if(activeLevel!=='all')$('quizSingleLevel').value=activeLevel;
  rebuildDeck();runSearch();clearSessions();renderMistakes();renderComparisons();};
});
$('masteryFilter').onchange=()=>rebuildDeck();
$('flashcard').onclick=e=>{if(currentWords.length&&!e.target.closest('button'))$('flashcard').classList.toggle('flipped');};
$('flashcard').onkeydown=e=>{if(e.target===$('flashcard')&&['Enter',' '].includes(e.key)){e.preventDefault();$('flashcard').click();}};
$('next').onclick=()=>{index++;updateCard();};$('prev').onclick=()=>{index--;updateCard();};
$('shuffle').onclick=()=>{if(currentWords.length>1){index=(index+1+Math.floor(Math.random()*(currentWords.length-1)))%currentWords.length;}updateCard();};
$('exampleBtn').onclick=()=>$('example').classList.toggle('show');
$('reset').title='Trở về bộ thẻ ban đầu; giữ tiến độ học và lịch SRS';
$('reset').onclick=()=>{$('masteryFilter').value='all';document.querySelector('[data-filter="all"]').click();};
function jumpToCard(){const n=Number($('jumpInput').value);if(!Number.isInteger(n)||n<1||n>currentWords.length){$('jumpStatus').textContent=`Nhập số nguyên từ 1 đến ${currentWords.length}.`;return;}index=n-1;updateCard();$('jumpStatus').textContent=`Đã nhảy đến thẻ số ${n}.`;$('jumpInput').value='';}
$('jumpBtn').onclick=jumpToCard;$('jumpInput').onkeydown=e=>{if(e.key==='Enter')jumpToCard();};
$('searchForm').onsubmit=e=>{e.preventDefault();handwritingSearchCharacter='';searchExplicit=true;runSearch();};$('searchInput').oninput=()=>{handwritingSearchCharacter='';clearTimeout(searchTimer);searchTimer=setTimeout(runSearch,180);};
$('searchMore').onclick=()=>{visibleResults+=40;renderSearch();};
$('quizForm').onsubmit=startQuiz;$('quizNext').onclick=()=>{if(quizSession){quizSession.position++;renderQuestion();}};
 for(const id of ['quizLevelMode','quizSingleLevel','quizLevelFrom','quizLevelTo','quizScope','quizDirection'])$(id).onchange=()=>{
  if(id==='quizLevelFrom' && Number($('quizLevelFrom').value)>Number($('quizLevelTo').value))$('quizLevelTo').value=$('quizLevelFrom').value;
  if(id==='quizLevelTo' && Number($('quizLevelTo').value)<Number($('quizLevelFrom').value))$('quizLevelFrom').value=$('quizLevelTo').value;
  resetQuiz();updateQuizScopeInfo();
 };
 $('quizCount').oninput=updateQuizScopeInfo;
$('srsStart').onclick=startSrs;$('srsReveal').onclick=()=>{$('srsAnswer').hidden=false;$('srsReveal').hidden=true;$('srsRatings').hidden=false;};
document.querySelectorAll('[data-rating]').forEach(b=>b.onclick=()=>rateSrs(b.dataset.rating));
setInterval(stats,30000);
rebuildDeck();renderSearch();

for(const input of document.querySelectorAll('input[name="quizType"]'))input.onchange=()=>{resetQuiz('Đã đổi dạng kiểm tra tổng hợp. Bấm Bắt đầu để tạo lượt mới.');updateQuizScopeInfo();};

function relationPairGuide(w,item){return allPairExplanation(w,item);}
// Dictionary relations are facts observed in Hanzii, never inferred from matching translations.
var relationWordIndex;
function relationElement(tag,text,cls){const el=document.createElement(tag);el.textContent=text||'';if(cls)el.className=cls;return el;}
function relationIndex(){if(!relationWordIndex){relationWordIndex=new Map();for(const w of words)relationWordIndex.set(wordKey(w),w);}return relationWordIndex;}
function openRelatedWord(key){const w=relationIndex().get(key);if(!w)return;document.querySelector(`[data-filter="${w.hsk}"]`).click();$('masteryFilter').value='all';rebuildDeck(w);switchMode('learn');$('flashcard').focus();}
function wordRelationDetails(w){
 const r=wordRelationsData.entries[wordKey(w)],box=relationElement('section','','word-relations');
 const syn=r?.synonyms||[],ant=r?.antonyms||[],counter=r?.counterparts||[];
 const tabs=relationElement('div','','relation-tabs'),panel=relationElement('div','','relation-panel');panel.hidden=true;
 box.append(tabs,panel);
 let active=null;
 for(const [label,list,isSyn] of [['Đồng nghĩa',syn,true],['Trái nghĩa',ant,false]]){
  const toggle=relationElement('button',`${label} (${list.length})`,'relation-toggle');toggle.type='button';toggle.setAttribute('aria-expanded','false');
  toggle.onclick=()=>{
   const close=active===toggle;for(const t of tabs.children)t.setAttribute('aria-expanded','false');panel.replaceChildren();panel.hidden=close;active=close?null:toggle;if(close)return;
   toggle.setAttribute('aria-expanded','true');
   if(!r?.checked){panel.append(relationElement('p','Chưa có dữ liệu quan hệ từ đã đối chiếu cho mục này.','hint'));return;}
   panel.append(relationElement('p','Chọn một từ để xem giải thích.','hint'));
   if(!list.length)panel.append(relationElement('p',`Hanzii chưa liệt kê từ ${label.toLowerCase()} cho cách đọc này.`,'hint'));
   const grid=relationElement('div','','relation-list'),detail=relationElement('section','','relation-pair');detail.hidden=true;
   let selected=null,motion=null;
   function expandPair(show){
    motion?.cancel();motion=null;detail.inert=!show;
    const height=detail.getBoundingClientRect().height;
    if(show)detail.hidden=false;
    if(typeof detail.animate!=='function'||matchMedia('(prefers-reduced-motion: reduce)').matches){detail.hidden=!show;detail.style.overflow='';return;}
    detail.style.overflow='hidden';
    const animation=detail.animate([{height:show?'0px':height+'px',opacity:show?0:1},{height:show?detail.getBoundingClientRect().height+'px':'0px',opacity:show?1:0}],{duration:240,easing:'cubic-bezier(.22,1,.36,1)'});motion=animation;
    animation.onfinish=()=>{if(motion!==animation)return;motion=null;detail.hidden=!show;detail.style.overflow='';};
   }
   for(const item of list){
    const entry=relationElement('button','','relation-word');entry.type='button';entry.setAttribute('aria-expanded','false');
    entry.append(relationElement('strong',item.han),relationElement('span',item.pin||'','relation-pin'));
    entry.onclick=()=>{
     const hide=selected===entry;for(const e of grid.querySelectorAll(':scope > .relation-word'))e.setAttribute('aria-expanded','false');selected=hide?null:entry;if(hide){expandPair(false);return;}motion?.cancel();motion=null;detail.replaceChildren();detail.hidden=false;entry.after(detail);
     entry.setAttribute('aria-expanded','true');detail.append(relationElement('h5',w.han+' ↔ '+item.han));
     if(!isSyn)detail.append(relationElement('p','Đây là quan hệ trái nghĩa theo Hanzii. Đối chiếu đúng nghĩa trong câu; không mặc định mọi nghĩa của hai từ đều đối lập.','hint'));
     if(isSyn)detail.append(relationPairGuide(w,item));else{
      const known=item.key&&relationIndex().get(item.key),pin=item.pin||known?.pin||'',a=usageVariant(w.han,w.pin),b=usageVariant(item.han,pin);
      appendUsageWord(detail,w.han,w.pin,a,w.mean);appendUsageWord(detail,item.han,pin,b,item.mean);
      appendPairExamples(detail,w.han,w.pin,[]);appendPairExamples(detail,item.han,pin,[]);
     }
     const known=item.key&&relationIndex().get(item.key);if(known){const open=relationElement('button',`Mở thẻ ${item.han} · HSK ${known.hsk}`);open.type='button';open.onclick=()=>openRelatedWord(item.key);detail.append(open);}
     expandPair(true);
    };grid.append(entry);
   }
   panel.append(grid);
   if(!isSyn&&counter.length)panel.append(relationElement('p','Từ đối ứng (khác vai trò, không phải trái nghĩa): '+counter.map(i=>i.han).join(' · '),'hint'));
   const source=relationElement('a','Nguồn quan hệ từ · Hanzii ↗','dictionary-source');source.href=r.url;source.target='_blank';source.rel='noopener noreferrer';panel.append(source);
  };tabs.append(toggle);
 }
 return box;
}
function renderCardRelations(w){const root=$('wordRelations');if(!root)return;root.replaceChildren();root.hidden=!w;if(w)root.append(wordRelationDetails(w));}
// Separate history keeps previous vocabulary/SRS records compatible.
const MISTAKE_STORE_KEY='hsk-flashcards-mistakes-v1';
const wordByKey=new Map(words.map(w=>[wordKey(w),w]));
let mistakeRecords=Object.create(null),mistakesVisible=40;
function validSavedQuestion(s) {
 return s&&wordByKey.has(s.key)&&['han','mean','blank','usage','contrast'].includes(s.direction)&&Array.isArray(s.options)&&s.options.length===4&&s.options.every(o=>o&&typeof o.text==='string'&&typeof o.correct==='boolean')&&s.options.filter(o=>o.correct).length===1&&new Set(s.options.map(o=>o.text)).size===4;
}
try {
 const saved=JSON.parse(localStorage.getItem(MISTAKE_STORE_KEY)||'{}');
 if(saved.version===1&&Array.isArray(saved.entries))for(const entry of saved.entries) {
  if(entry&&typeof entry.id==='string'&&Number.isInteger(entry.wrongCount)&&entry.wrongCount>0&&Number.isFinite(entry.lastWrong)&&validSavedQuestion(entry.snapshot))mistakeRecords[entry.id]={...entry,resolved:entry.resolved===true};
 }
}catch(e){/* A corrupt optional history does not erase SRS. */}
function saveMistakes() {
 try{localStorage.setItem(MISTAKE_STORE_KEY,JSON.stringify({version:1,entries:Object.values(mistakeRecords)}));}
 catch(e){$('storageNotice').hidden=false;$('storageNotice').textContent='Không lưu được lịch sử câu sai. Lịch sử mới hiện chỉ được giữ trong phiên này; tiến độ từ vựng được lưu riêng.';}
}
function snapshotQuestion(q) {
 return {key:wordKey(q.w),direction:q.direction,sense:q.sense||'',item:q.item?{cn:q.item.cn,blank:q.item.blank,answer:q.item.answer,vi:q.item.vi,pin:q.item.pin,sense:q.item.sense,explanation:q.item.explanation}:null,prompt:q.prompt||'',customId:q.customId||'',options:q.options.map(o=>({text:o.text,correct:o.correct,key:o.w?wordKey(o.w):wordKey(q.w)}))};
}
function questionHistoryId(q) {return JSON.stringify([wordKey(q.w),q.direction,q.customId||q.item?.cn||'',q.sense||'']);}
function recordQuizMistake(q,chosen) {
 const id=questionHistoryId(q),previous=mistakeRecords[id];
 if(!chosen.correct) {
  mistakeRecords[id]={id,wrongCount:(previous?.wrongCount||0)+1,lastWrong:Date.now(),lastAnswer:Date.now(),resolved:false,chosenText:chosen.text,snapshot:snapshotQuestion(q)};
  saveMistakes();
 }else if(previous){previous.resolved=true;previous.lastAnswer=Date.now();saveMistakes();}
}
function mistakeEntries(includeSolved=$('mistakeScope').value==='all') {
 return Object.values(mistakeRecords).filter(entry=>{const w=wordByKey.get(entry.snapshot.key);return w&&(activeLevel==='all'||String(w.hsk)===activeLevel)&&(includeSolved||!entry.resolved);}).sort((a,b)=>b.wrongCount-a.wrongCount||b.lastWrong-a.lastWrong);
}
function restoreQuestion(s) {
 const w=wordByKey.get(s.key);return {w,direction:s.direction,sense:s.sense,item:s.item,prompt:s.prompt,customId:s.customId,answered:false,options:s.options.map(o=>({text:o.text,correct:o.correct,w:wordByKey.get(o.key)||w}))};
}
function startSavedQuestions(questions,label) {
 if(!questions.length){$('mistakeSummary').textContent='Không có câu phù hợp để ôn trong phạm vi này.';return;}
 quizSession={pool:questions.map(q=>q.w),savedQuestions:questions,candidates:words,levelLabel:label,position:0,score:0,direction:'saved',plan:questions.map(q=>q.direction)};
 switchMode('quiz');renderQuestion();
}
function reviewMistakeEntries(entries,label='Ôn câu đã làm sai',limit) {
 const count=limit??Number($('mistakeCount').value);
 if(!Number.isInteger(count)||count<1||count>100){$('mistakeSummary').textContent='Nhập số câu từ 1 đến 100.';return;}
 startSavedQuestions(entries.slice(0,count).map(entry=>restoreQuestion(entry.snapshot)),label);
}
function textElement(tag,text,className) {const node=document.createElement(tag);node.textContent=text;if(className)node.className=className;return node;}
function renderMistakes() {
 const all=mistakeEntries(true),pending=all.filter(e=>!e.resolved),entries=mistakeEntries();
 $('mistakeSummary').textContent=all.length?`${all.length} câu từng làm sai · ${pending.length} câu chưa ôn đúng · ${all.reduce((sum,e)=>sum+e.wrongCount,0)} lượt sai. Ưu tiên câu sai nhiều lần.`:'Chưa có câu sai được ghi lại trong HSK đang chọn. Làm một bài kiểm tra để bắt đầu lưu lịch sử.';
 $('mistakeStart').disabled=!entries.length;$('mistakeWords').replaceChildren();$('mistakeList').replaceChildren();
 const frequencies=new Map();
 for(const entry of all){const key=entry.snapshot.key,r=frequencies.get(key)||{key,count:0,pending:0};r.count+=entry.wrongCount;r.pending+=entry.resolved?0:1;frequencies.set(key,r);}
 for(const r of [...frequencies.values()].sort((a,b)=>b.count-a.count).slice(0,20)) {
  const w=wordByKey.get(r.key),box=textElement('article','', 'mistake-entry');box.append(textElement('strong',`${w.han} · ${w.pin} · HSK ${w.hsk}`),textElement('p',`Sai ${r.count} lượt · ${r.pending} câu chưa ôn đúng`));
  const button=textElement('button','Ôn từ này');button.onclick=()=>{const related=all.filter(e=>e.snapshot.key===r.key),pending=related.filter(e=>!e.resolved);reviewMistakeEntries(pending.length?pending:related,`Ôn từ hay nhầm: ${w.han}`);};box.append(button);$('mistakeWords').append(box);
 }
 for(const entry of entries.slice(0,mistakesVisible)) {
  const s=entry.snapshot,w=wordByKey.get(s.key),row=textElement('article','', 'mistake-entry');row.append(textElement('strong',`${w.han} · HSK ${w.hsk} · ${quizTypeLabels[s.direction]}`),textElement('p',s.item?.cn||s.prompt||(s.direction==='han'?w.han:s.sense)),textElement('p',`Bạn đã chọn: ${entry.chosenText}`),textElement('p',`Sai ${entry.wrongCount} lượt · ${entry.resolved?'Đã ôn đúng':'Chưa ôn đúng'} · ${new Date(entry.lastWrong).toLocaleString('vi-VN')}`,'hint'));
  const button=textElement('button','Làm lại câu này');button.onclick=()=>reviewMistakeEntries([entry],'Làm lại câu đã nhầm',1);row.append(button);$('mistakeList').append(row);
 }
 $('mistakeMore').hidden=entries.length<=mistakesVisible;
}
function shownCompareGroups() {return confusableGroups.filter(g=>($('compareCategory').value==='all'||(g.category||'near')===$('compareCategory').value)&&(activeLevel==='all'||g.members.some(m=>String(m.level)===activeLevel)));}
function comparisonQuestion(g,q) {
 const w=wordByKey.get(q.key);return {w,direction:'contrast',customId:q.id,prompt:q.prompt,sense:q.answer,answered:false,item:{cn:q.cn,pin:q.pin,vi:q.vi,explanation:q.explanation},options:shuffled([{text:q.answer,correct:true,w},...q.wrong.map(text=>({text,correct:false,w}))])};
}
function startComparison(groups) {
 const questions=shuffled(groups.flatMap(g=>g.questions.filter(q=>activeLevel==='all'||String(wordByKey.get(q.key).hsk)===activeLevel).map(q=>comparisonQuestion(g,q))));
 if(!questions.length){$('compareSummary').textContent='Chưa có bài tập của nhóm này trong HSK đang chọn.';return;}
 startSavedQuestions(questions,`Phân biệt từ: ${groups.map(g=>g.title).join(' / ')}`);
}
const visualWordIndex=new Map();
function visualSamples(char){
 if(!visualWordIndex.size){const chars=new Set(visualConfusions.flatMap(g=>g.members.map(m=>m.han)));for(const c of chars)visualWordIndex.set(c,words.filter(w=>w.han.includes(c)).sort((a,b)=>Number(a.hsk)-Number(b.hsk)||a.han.length-b.han.length));}
 return visualWordIndex.get(char)||[];
}
function visualFold(value){return value.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().trim();}
function renderVisualComparisons(){
 const query=visualFold($('visualCompareQuery').value),groups=visualConfusions.filter(g=>(activeLevel==='all'||g.members.some(m=>visualSamples(m.han).some(w=>String(w.hsk)===activeLevel)))&&(!query||visualFold(g.members.map(m=>m.han+' '+m.pin+' '+m.mean+' '+visualSamples(m.han).map(w=>w.han+' '+w.pin+' '+w.mean).join(' ')).join(' ')+' '+g.note).includes(query)));
 $('compareTitle').textContent='Chữ gần giống nhau';$('compareIntro').textContent='Nhìn hình chữ và vùng được đánh dấu, rồi so nét khác biệt. Bộ lọc HSK dựa trên từ trong app có chứa chữ đó; không gán một level cố định cho từng chữ đơn.';
 $('compareSummary').textContent=`${groups.length} / ${visualConfusions.length} nhóm · ${new Set(groups.flatMap(g=>g.members.map(m=>m.han))).size} chữ đang hiển thị. Khung màu chỉ vùng cần quan sát, không phải hướng dẫn thứ tự nét.`;$('compareGroups').replaceChildren();
 if(!groups.length){$('compareGroups').append(textElement('p','Chưa có nhóm phù hợp với từ tìm kiếm và bộ lọc HSK. Thử bỏ tìm kiếm hoặc chọn Tất cả HSK.'));return;}
 for(const [i,g] of groups.entries()){
  const details=document.createElement('details');details.className='compare-lesson visual-lesson';details.dataset.group=g.id;details.open=i===0;details.append(textElement('summary',g.members.map(m=>m.han).join(' ↔ ')));const pair=textElement('div','','visual-pair');
  for(const m of g.members){const card=textElement('div','','visual-character-card'),glyph=textElement('div',m.han,'visual-glyph'),focus=textElement('span','','visual-focus focus-'+g.region);focus.setAttribute('aria-hidden','true');glyph.append(focus);card.append(glyph,pinyinLine(m.pin),textElement('p',m.mean,'visual-char-mean'));pair.append(card);}details.append(pair,textElement('h3','Khác ở nét nào?'),textElement('p',g.note,'visual-difference'),textElement('p','Cách nhớ: '+g.tip));
  const examples=textElement('div','','visual-word-examples');for(const m of g.members){const box=textElement('section','','visual-examples-column');box.append(textElement('h4','Từ có chữ '+m.han));const all=visualSamples(m.han),matching=activeLevel==='all'?all:all.filter(w=>String(w.hsk)===activeLevel),samples=(matching.length?matching:all).slice(0,2);for(const w of samples){const entry=textElement('div','','visual-word-example');entry.append(textElement('strong',w.han+' · HSK '+w.hsk),pinyinLine(w.pin),textElement('p',w.mean));const open=textElement('button','Mở thẻ '+w.han);open.onclick=()=>openRelatedWord(wordKey(w));entry.append(open);box.append(entry);}if(!samples.length)box.append(textElement('p','Chưa có từ chứa chữ này trong bộ HSK hiện tại.'));examples.append(box);}details.append(examples,textElement('p','Nghĩa và cách đọc ở trên là nghĩa/cách đọc tiêu biểu, không phải toàn bộ nghĩa của chữ. Mẹo nét viết là hướng dẫn biên soạn; từ minh họa lấy từ bộ HSK của app. Hình dáng có thể thay đổi nhẹ theo phông chữ.','hint'));$('compareGroups').append(details);
 }
}
const confusionWords=hskConfusionIndex.keys.map(key=>wordByKey.get(key));
const confusionWordIds=new Map(hskConfusionIndex.keys.map((k,i)=>[k,i]));
const confusionCharWords=new Map();
for(const w of words)for(const c of new Set(w.han))if(hskConfusionIndex.chars[c]){if(!confusionCharWords.has(c))confusionCharWords.set(c,[]);confusionCharWords.get(c).push(w);}
let confusionVisible=40;
function confusionHanzi(w){return [...w.han.split(/[（(]/)[0]].filter(c=>hskConfusionIndex.chars[c]);}
function confusionBase(s){return s.toLowerCase().normalize('NFD').replace(/u\u0308/g,'v').replace(/\p{Diacritic}/gu,'');}
function confusionTone(s){if(/[āēīōūǖ]/.test(s))return 1;if(/[áéíóúǘ]/.test(s))return 2;if(/[ǎěǐǒǔǚ]/.test(s))return 3;if(/[àèìòùǜ]/.test(s))return 4;return 0;}
function confusionSoundParts(s){const m=confusionBase(s).match(/^(zh|ch|sh|[bpmfdtnlgkhjqxrzcs])?(.*)$/);return [m[1]||'',m[2]];}
function confusionSoundReason(a,b){
 if(a===b)return `Cùng âm và cùng thanh: ${a}. Chú ý nghĩa và chữ viết để chọn đúng.`;
 if(confusionBase(a)===confusionBase(b))return `Cùng âm ${confusionBase(a).replace(/v/g,'ü')}, khác thanh điệu: ${a} (${confusionTone(a)?'thanh '+confusionTone(a):'thanh nhẹ'}) ↔ ${b} (${confusionTone(b)?'thanh '+confusionTone(b):'thanh nhẹ'}).`;
 const [ai,af]=confusionSoundParts(a),[bi,bf]=confusionSoundParts(b);return `So cách đọc ${a} ↔ ${b}: ${ai!==bi?'âm đầu '+(ai||'(không có)')+' ↔ '+(bi||'(không có)'):'cùng âm đầu '+(ai||'(không có)')}; ${af!==bf?'vần '+af.replace(/v/g,'ü')+' ↔ '+bf.replace(/v/g,'ü'):'cùng phần vần viết trong pinyin '+af.replace(/v/g,'ü')}${confusionTone(a)!==confusionTone(b)?'; thanh '+(confusionTone(a)||'nhẹ')+' ↔ '+(confusionTone(b)||'nhẹ'):''}.`;
}
function confusionReadingsClose(a,b){const x=confusionBase(a),y=confusionBase(b);if(x===y)return true;const [ai,af]=confusionSoundParts(a),[bi,bf]=confusionSoundParts(b);const pairs=['z|zh','c|ch','s|sh','l|n','b|p','d|t','g|k','j|q','ch|zh','c|z'],finals=['an|ang','en|eng','in|ing','ian|iang','uan|uang'];return (af===bf&&pairs.includes([ai,bi].sort().join('|')))||(ai===bi&&finals.includes([af,bf].sort().join('|')));}
function confusionSource(root){const note=textElement('p','Gợi ý gần âm/nét được tạo theo quy tắc, không có nghĩa hai từ đồng nghĩa hoặc chắc chắn người học sẽ nhầm. Phiên âm và nghĩa của từ lấy từ bộ HSK hiện có. Cấu tạo chữ: Make Me a Hanzi (Unihan/CJKlib), dữ liệu đã lọc và tạo liên kết so sánh.','hint');const link=textElement('a','Nguồn và giấy phép dữ liệu');link.href='./hanzi-data-notice.html';link.target='_blank';link.rel='noopener';note.append(document.createTextNode(' '),link);root.append(note);}
function confusionWordCard(w){const card=textElement('div','','confusion-word-card');card.append(textElement('strong',w.han+' · HSK '+w.hsk),pinyinLine(w.pin),textElement('p',w.mean));const open=textElement('button','Mở thẻ '+w.han);open.onclick=()=>openRelatedWord(wordKey(w));card.append(open);return card;}
function confusionCharacterPair(a,b,reason){const box=textElement('div','','confusion-character-pair'),pair=textElement('div','','visual-pair');for(const c of [a,b]){const r=hskConfusionIndex.chars[c],card=textElement('div','','visual-character-card');card.append(textElement('div',c,'visual-glyph'),pinyinLine(r.pin.join(' / ')));const standalone=(confusionCharWords.get(c)||[]).find(w=>w.han===c);if(standalone)card.append(textElement('p',standalone.mean));pair.append(card);}box.append(pair,textElement('p',reason,'visual-difference'));return box;}
function confusionShapeReason(a,b,part){
 if(part.startsWith('community-')){const group=hskConfusionIndex.families.find(g=>g.id===part);return (group.points[a]||'')+' '+(group.points[b]||'')+' Số nét trong chữ mẫu: '+a+' '+hskConfusionIndex.chars[a].strokes+' nét; '+b+' '+hskConfusionIndex.chars[b].strokes+' nét.';}
 if(part==='glyph'){const ra=hskConfusionIndex.chars[a],rb=hskConfusionIndex.chars[b];return `Gợi ý tự động từ hình nét toàn chữ, không chỉ từ bộ thủ chung. So ${a} (${ra.strokes} nét) và ${b} (${rb.strokes} nét). Cấu tạo trong dữ liệu: ${a}: ${ra.ids.includes('？')?'chưa phân tích trọn vẹn':ra.ids}; ${b}: ${rb.ids.includes('？')?'chưa phân tích trọn vẹn':rb.ids}. Hình chữ có thể thay đổi theo phông; đây chưa phải lỗi được cộng đồng xác nhận.`;}
 if(part.startsWith('shape-')){const g=visualConfusions.find(x=>x.id===part);return g.note+' Cách nhớ: '+g.tip;}
 const ra=hskConfusionIndex.chars[a],rb=hskConfusionIndex.chars[b];const fmt=r=>r.parts.length?r.parts.join(' + '):'chữ đơn '+(r===ra?a:b);return `Chung thành phần ${part}. So phần còn lại: ${a} có cấu tạo ${fmt(ra)}; ${b} có cấu tạo ${fmt(rb)}. Đây là cách tách hình chữ để quan sát, không phải quy trình viết hay giải thích nguồn gốc chữ.`;
}
function confusionAppendBatch(root,items,make,limit=6){let count=0;const rows=textElement('div','','confusion-candidates'),more=textElement('button','');more.className='confusion-more';function add(){for(const item of items.slice(count,count+limit))rows.append(make(item));count+=Math.min(limit,items.length-count);more.textContent=`Xem thêm (${items.length-count} còn lại)`;more.hidden=count>=items.length;}root.append(rows,more);more.onclick=add;add();}
function confusionCharDetail(root,char,kind,contextPin){const record=hskConfusionIndex.chars[char];
 if(kind==='sound'){
  const apins=contextPin?[contextPin]:record.pin;const candidates=record.sound.map(c=>{const br=hskConfusionIndex.chars[c];const matches=apins.flatMap(a=>br.pin.filter(b=>confusionReadingsClose(a,b)).map(b=>[a,b]));matches.sort((x,y)=>(confusionBase(x[0])!==confusionBase(x[1]))-(confusionBase(y[0])!==confusionBase(y[1])));return {char:c,match:matches[0]};}).filter(x=>x.match).sort((a,b)=>{const xa=a.match,xb=b.match;return (confusionBase(xa[0])!==confusionBase(xa[1]))-(confusionBase(xb[0])!==confusionBase(xb[1]));});
  root.append(textElement('p',`${candidates.length} chữ có cách đọc trùng hoặc gần với ${char}${contextPin?' ('+contextPin+')':''}. Với chữ đa âm, cần theo phiên âm của từ cụ thể.`,'hint'));
  confusionAppendBatch(root,candidates,item=>{const d=document.createElement('details');d.className='confusion-candidate';d.append(textElement('summary',char+' ↔ '+item.char+' · '+item.match.join(' ↔ ')));d.addEventListener('toggle',()=>{if(!d.open||d.dataset.built)return;d.dataset.built='1';d.append(confusionCharacterPair(char,item.char,confusionSoundReason(...item.match)));const examples=(confusionCharWords.get(item.char)||[]).filter(w=>{const id=confusionWordIds.get(wordKey(w));return (hskConfusionIndex.syllables[id]||[]).some((s,n)=>confusionHanzi(w)[n]===item.char&&s===item.match[1]);}).slice(0,2);for(const w of examples)d.append(confusionWordCard(w));if(!examples.length)d.append(textElement('p','Chưa có từ minh họa trong bộ HSK dùng đúng cách đọc đối chiếu này. Các cách đọc còn lại của chữ vẫn được liệt kê để tham khảo.','hint'));});return d;});
  if(!candidates.length)root.append(textElement('p','Chưa tìm được chữ gần âm theo các quy tắc đang áp dụng.'));
 }else{
  const families=hskConfusionIndex.families.filter(g=>g.chars.includes(char));for(const g of families){const strip=textElement('p','Nhóm đối chiếu: '+g.chars.join(' · '),'confusion-family-strip');root.append(strip);}
  root.append(textElement('p',`${record.near.length} chữ có nét hoặc thành phần gần giống ${char}.`,'hint'));
  confusionAppendBatch(root,record.near,item=>{const [other,part]=item,d=document.createElement('details');d.className='confusion-candidate';d.append(textElement('summary',char+' ↔ '+other+(part.startsWith('community-')?' · nhóm dễ nhầm':part.startsWith('shape-')?' · so nét':part==='glyph'?' · gần hình nét':' · chung '+part)));d.addEventListener('toggle',()=>{if(!d.open||d.dataset.built)return;d.dataset.built='1';d.append(confusionCharacterPair(char,other,confusionShapeReason(char,other,part)));if(part.startsWith('community-')){const g=hskConfusionIndex.families.find(x=>x.id===part),cite=textElement('p','Giải thích nét được biên soạn và đối chiếu chữ mẫu. Nhóm tham khảo: ','hint');for(const id of g.sources){const src=hskConfusionIndex.familySources[id],a=textElement('a',src.name);a.href=src.url;a.target='_blank';a.rel='noopener';cite.append(a,document.createTextNode(' · '));}d.append(cite);if(g.basis)d.append(textElement('p',g.basis,'hint'));}if(!hskConfusionIndex.chars[other].hsk)d.append(textElement('p','Chữ đối chiếu ngoài bộ HSK của app; không gán level HSK cho chữ này.','hint'));for(const w of (confusionCharWords.get(other)||[]).slice(0,2))d.append(confusionWordCard(w));});return d;});
  if(!record.near.length)root.append(textElement('p','Chưa có cặp đủ gần theo dữ liệu cấu tạo và các cặp nét đã kiểm tra; không gán cặp ngẫu nhiên.'));
 }
}
function confusionWordDetail(root,w,kind){const id=confusionWordIds.get(wordKey(w));root.append(confusionWordCard(w));
 if(kind==='sound'){
  if(w.pin.includes('/'))root.append(textElement('p','Đối chiếu cả từ dưới đây theo cách đọc '+hskConfusionIndex.syllables[id].join(' ')+'. Các cách đọc khác vẫn giữ ở thẻ từ.','hint'));
  const ids=hskConfusionIndex.sound[id]||[];root.append(textElement('h3','So cách đọc cả từ'),textElement('p',`${ids.length} từ trùng âm hoặc chỉ khác một âm tiết gần âm. Các từ đối chiếu có thể thuộc HSK khác.`,'hint'));
  confusionAppendBatch(root,ids,j=>{const other=confusionWords[j],d=document.createElement('details');d.className='confusion-candidate';d.append(textElement('summary',other.han+' · '+other.pin+' · HSK '+other.hsk));d.addEventListener('toggle',()=>{if(!d.open||d.dataset.built)return;d.dataset.built='1';d.append(confusionWordCard(other));const a=hskConfusionIndex.syllables[id],b=hskConfusionIndex.syllables[j];for(let n=0;n<a.length;n++)if(a[n]!==b[n]||confusionHanzi(w)[n]!==confusionHanzi(other)[n])d.append(textElement('p',`Âm tiết ${n+1}: `+confusionSoundReason(a[n],b[n]),'visual-difference'));});return d;});
  if(!ids.length)root.append(textElement('p','Chưa có cặp cả từ đủ gần; có thể so âm của từng chữ bên dưới.'));
  if(!hskConfusionIndex.syllables[id].length)root.append(textElement('p','Chưa tách chắc chắn phiên âm từ này thành từng chữ; app giữ nguyên phiên âm gốc và không tự gán cách đọc theo vị trí.','hint'));
 }
 root.append(textElement('h3',kind==='sound'?'Gần âm ở từng chữ trong từ':'So nét / thành phần từng chữ'));
 for(const [n,c] of confusionHanzi(w).entries()){if(!hskConfusionIndex.chars[c])continue;const d=document.createElement('details');d.className='confusion-char-section';d.append(textElement('summary','Chữ '+c+(hskConfusionIndex.syllables[id][n]?' · '+hskConfusionIndex.syllables[id][n]:'')));d.addEventListener('toggle',()=>{if(!d.open||d.dataset.built)return;d.dataset.built='1';confusionCharDetail(d,c,kind,hskConfusionIndex.syllables[id][n]);});root.append(d);if(confusionHanzi(w).length===1)d.open=true;}
}
function renderIndexedConfusions(){
 const query=visualFold($('hskConfusionQuery').value),scope=$('hskConfusionScope').value,kind=$('hskConfusionKind').value;let items;
 if(scope==='word')items=words.filter(w=>(activeLevel==='all'||String(w.hsk)===activeLevel)&&(!query||visualFold(w.han+' '+w.pin+' '+w.mean+' '+w.hv).includes(query)));
 else items=Object.keys(hskConfusionIndex.chars).filter(c=>hskConfusionIndex.chars[c].hsk&&(activeLevel==='all'||(confusionCharWords.get(c)||[]).some(w=>String(w.hsk)===activeLevel))&&(!query||visualFold(c+' '+hskConfusionIndex.chars[c].pin.join(' ')+' '+(confusionCharWords.get(c)||[]).map(w=>w.han+' '+w.pin+' '+w.mean).join(' ')).includes(query)));
 if(query)items.sort((a,b)=>Number((typeof b==='string'?b:b.han)===query)-Number((typeof a==='string'?a:a.han)===query));
 $('compareTitle').textContent='Dễ nhầm về âm và nét · HSK 1–6';$('compareIntro').textContent='Tra mọi từ HSK hoặc từng chữ Hán trong từ. Chọn Gần âm để so thanh điệu, âm đầu/vần; chọn Giống nét để so chữ và thành phần chung. Bộ lọc HSK áp dụng cho mục đang tra; cặp đối chiếu có thể nằm ở level khác.';
 $('compareSummary').textContent=`Chỉ mục ${hskConfusionIndex.report.words.toLocaleString('vi')} từ · ${hskConfusionIndex.report.characters.toLocaleString('vi')} chữ Hán. Đã có gợi ý nét cho ${hskConfusionIndex.report.shapeCharacters.toLocaleString('vi')} chữ HSK; gồm nhóm tham khảo từ thảo luận/tài liệu và gợi ý tự động theo hình nét. ${items.length.toLocaleString('vi')} mục phù hợp; đang hiện ${Math.min(confusionVisible,items.length)}. Gợi ý tự động có thể chưa phải lỗi nhầm phổ biến.`;
 const root=$('compareGroups');root.replaceChildren();
 for(const item of items.slice(0,confusionVisible)){const d=document.createElement('details');d.className='compare-lesson indexed-confusion';const char=typeof item==='string';d.append(textElement('summary',char?item+' · '+hskConfusionIndex.chars[item].pin.join(' / '):item.han+' · '+item.pin+' · HSK '+item.hsk));d.addEventListener('toggle',()=>{if(!d.open||d.dataset.built)return;d.dataset.built='1';if(char){confusionCharDetail(d,item,kind);const examples=(confusionCharWords.get(item)||[]).slice(0,2);if(examples.length){d.append(textElement('h3','Từ HSK có chữ này'));for(const w of examples)d.append(confusionWordCard(w));}}else confusionWordDetail(d,item,kind);confusionSource(d);});root.append(d);}
 if(!items.length)root.append(textElement('p','Không có mục phù hợp. Thử bỏ từ tìm kiếm hoặc chọn Tất cả HSK.'));
 $('hskConfusionMore').hidden=items.length<=confusionVisible;$('hskConfusionMore').textContent=`Xem thêm (${Math.max(0,items.length-confusionVisible)} mục còn lại)`;
}

function renderComparisons() {
 const indexed=$('compareCategory').value==='indexed';$('hskConfusionControls').hidden=!indexed;$('hskConfusionMore').hidden=!indexed;
 const visual=$('compareCategory').value==='visual';$('compareStart').hidden=visual||indexed;$('visualCompareSearch').hidden=!visual;$('compareMeaningTab').setAttribute('aria-pressed',String(!visual&&!indexed));$('compareShapeTab').setAttribute('aria-pressed',String(visual||indexed));if(indexed){renderIndexedConfusions();return;}if(visual){renderVisualComparisons();return;}
 $('compareIntro').textContent='Các nhóm từ gần nghĩa nhưng khác cách dùng; giải thích đối chiếu Hanzii và ví dụ trong bộ học. Chọn Chữ gần giống để phân biệt hình dáng, nét viết.';

 const groups=shownCompareGroups(),count=groups.flatMap(g=>g.questions).filter(q=>activeLevel==='all'||String(wordByKey.get(q.key).hsk)===activeLevel).length;
 const memberCount=new Set(groups.flatMap(g=>g.members.filter(m=>activeLevel==='all'||String(m.level)===activeLevel).map(m=>m.key))).size;
 $('compareTitle').textContent=$('compareCategory').value==='other'?'Các cặp dễ lẫn khác':$('compareCategory').value==='all'?'Phân biệt cách dùng từ':'Từ gần nghĩa khác cách dùng';
 $('compareSummary').textContent=`${groups.length} nhóm · ${memberCount} từ · ${count} bài tập trong phạm vi HSK đang chọn. Giải thích được đối chiếu Hanzii. Đồng nghĩa / trái nghĩa: đã tra ${wordRelationsData.report.checked.toLocaleString('vi')} / ${words.length.toLocaleString('vi')} mục.`;$('compareStart').disabled=!count;$('compareGroups').replaceChildren();
 for(const g of groups) {
  const details=document.createElement('details');details.className='compare-lesson';details.dataset.group=g.id;details.append(textElement('summary',g.title),textElement('p',g.intro));
  for(const member of g.members){const box=textElement('div','', 'compare-member');box.append(textElement('strong',`${member.han} · ${member.pin} · HSK ${member.level}`),textElement('p',member.note));details.append(box);}
  details.append(textElement('p','Lưu ý: '+g.caution));
  for(const q of g.questions){const example=textElement('div','', 'compare-example');example.append(textElement('p',q.cn,'dictionary-cn'),pinyinLine(q.pin),textElement('p',q.vi));details.append(example);}
  details.append(textElement('p','Ví dụ từ bộ câu đã đối chiếu; câu hỏi và giải thích được biên soạn dựa trên Hanzii.','hint'));
  const links=textElement('div','', 'source-links');for(const m of g.members){const a=textElement('a','Hanzii: '+m.han);a.href=m.url;a.target='_blank';a.rel='noopener noreferrer';links.append(a);}details.append(links);
  const practice=textElement('button','Luyện nhóm này');practice.onclick=()=>startComparison([g]);details.append(practice);$('compareGroups').append(details);
 }
}
$('mistakeStart').onclick=()=>reviewMistakeEntries(mistakeEntries());$('mistakeScope').onchange=()=>{mistakesVisible=40;renderMistakes();};$('mistakeMore').onclick=()=>{mistakesVisible+=40;renderMistakes();};$('compareStart').onclick=()=>startComparison(shownCompareGroups());$('compareCategory').onchange=renderComparisons;$('compareMeaningTab').onclick=()=>{$('compareCategory').value='near';renderComparisons();};$('compareShapeTab').onclick=()=>{$('compareCategory').value='indexed';confusionVisible=40;renderComparisons();};$('visualCompareQuery').oninput=renderComparisons;
for(const id of ['hskConfusionScope','hskConfusionKind'])$(id).onchange=()=>{confusionVisible=40;renderComparisons();};$('hskConfusionQuery').oninput=()=>{confusionVisible=40;renderComparisons();};$('hskConfusionMore').onclick=()=>{confusionVisible+=40;renderComparisons();};$('wordConfusionOpen').onclick=()=>{const w=currentWords[index];if(!w)return;$('compareCategory').value='indexed';$('hskConfusionScope').value='word';$('hskConfusionQuery').value=w.han;confusionVisible=40;switchMode('compare');renderComparisons();const first=$('compareGroups').querySelector('details');if(first)first.open=true;};
renderMistakes();renderComparisons();

  // Use the existing progress record and timestamps; never replace prior progress.
const MEMORY_PREF_KEY='hsk-memory-preferences-v1';
let memoryPrefs={context:true,newWords:true};
try{const p=JSON.parse(localStorage.getItem(MEMORY_PREF_KEY)||'{}');for(const k of ['context','newWords'])if(typeof p[k]==='boolean')memoryPrefs[k]=p[k];}catch(e){}
function saveMemoryPrefs(){try{localStorage.setItem(MEMORY_PREF_KEY,JSON.stringify(memoryPrefs));}catch(e){storageWarning();}}
function memoryExamples(w){return (w.practice?.examples||[]).filter(e=>e.cn&&e.cn.includes(w.han));}
let memoryCurrentExample=null;
const baseRenderMemorySrs=renderSrs;
renderSrs=function(){
 baseRenderMemorySrs();const w=srsSession?.queue[0],root=$('memoryContext');root.replaceChildren();root.hidden=!w||!memoryPrefs.context;$('srsHan').hidden=!!w&&memoryPrefs.context;memoryCurrentExample=null;
 if(!w)return;
 const r=recordOf(w);$('memoryWordDates').textContent=`Lần ôn gần nhất: ${memoryDate(r?.lastReview)} · Hẹn ôn: ${memoryDate(r?.due)}`;
 if(!memoryPrefs.context)return;
 const examples=memoryExamples(w);
 if(!examples.length){$('srsHan').hidden=false;root.append(relationElement('p','Chưa có câu phù hợp để che từ; ôn bằng thẻ từ.'));return;}
 memoryCurrentExample=examples[(r?.contextSeen||0)%examples.length];
 root.append(relationElement('p','Nhớ lại từ phù hợp với câu, rồi bấm Xem đáp án.','hint'));
 root.append(relationElement('p',memoryCurrentExample.cn.split(w.han).join('＿＿＿'),'memory-sentence'));
 const input=document.createElement('input');input.id='memoryRecall';input.placeholder='Tự nhập từ nếu muốn';input.setAttribute('aria-label','Từ cần nhớ trong câu');input.autocomplete='off';root.append(input);
};
const baseMemoryReveal=$('srsReveal').onclick;
$('srsReveal').onclick=function(){baseMemoryReveal();if(!memoryCurrentExample)return;const w=srsSession?.queue[0];if(!w)return;const answer=relationElement('div','','memory-context-answer');answer.append(relationElement('p',memoryCurrentExample.cn,'memory-sentence'),pinyinLine(memoryCurrentExample.pin),relationElement('p',memoryCurrentExample.vi));const input=$('memoryRecall');if(input?.value.trim())answer.append(relationElement('p','Bạn đã nhập: '+input.value.trim()+'. Từ trong câu: '+w.han+'. Tự đánh giá mức nhớ bằng các nút bên dưới.','hint'));$('memoryContext').append(answer);$('srsHan').hidden=false;};
const baseMemoryReview=review;
review=function(w,rating){const old=recordOf(w),first=old?.firstLearned||old?.lastReview||old?.lastMarked||Date.now(),seen=old?.contextSeen||0;baseMemoryReview(w,rating);records[wordKey(w)].firstLearned=first;if(mode==='srs'&&memoryPrefs.context&&memoryCurrentExample)records[wordKey(w)].contextSeen=seen+1;saveRecords();refreshMemoryDashboard();};
const baseMemoryMark=markWord;
markWord=function(w,status){const old=recordOf(w),first=old?.firstLearned||old?.lastReview||old?.lastMarked||Date.now();baseMemoryMark(w,status);records[wordKey(w)].firstLearned=first;saveRecords();refreshMemoryDashboard();};
startSrs=function(){const pool=levelWords(),due=pool.filter(w=>recordOf(w)&&recordOf(w).due<=Date.now()).sort((a,b)=>recordOf(a).due-recordOf(b).due);const fresh=memoryPrefs.newWords?shuffled(pool.filter(w=>!recordOf(w))).slice(0,10):[];srsSession={queue:[...due,...fresh],total:due.length+fresh.length,done:0};$('srsMessage').textContent='';window.HSKLoading?.flash('Phiên ôn tập SRS đang load...','Đang chuẩn bị thẻ từ cần ôn...',undefined,$('srsPanel'));renderSrs();};
function refreshMemoryDashboard(){
 const now=Date.now(),tracked=words.filter(w=>recordOf(w)),due=tracked.filter(w=>recordOf(w).due<=now),future=tracked.filter(w=>recordOf(w).due>now).sort((a,b)=>recordOf(a).due-recordOf(b).due);
 $('memoryReminderText').textContent=due.length?`Có ${due.length} từ đến hạn ôn trong tất cả HSK.`:future.length?`Lần ôn tiếp theo: ${memoryDate(recordOf(future[0]).due)}.`:'Chưa có lịch ôn. Học một từ rồi chọn mức nhớ để tạo lịch.';
 $('memoryDueStart').hidden=!due.length;
 const root=$('memoryCalendar');root.replaceChildren();const pool=levelWords(),rows=pool.filter(w=>recordOf(w)).sort((a,b)=>recordOf(a).due-recordOf(b).due);const midnight=new Date(now);midnight.setHours(0,0,0,0);
 for(let i=0;i<7;i++){const begin=new Date(midnight);begin.setDate(begin.getDate()+i);const end=new Date(begin);end.setDate(end.getDate()+1);const count=rows.filter(w=>{const t=recordOf(w).due;return (i===0?t<end.getTime():t>=begin.getTime()&&t<end.getTime());}).length;root.append(relationElement('p',`${i===0?'Hôm nay (gồm quá hạn)':begin.toLocaleDateString('vi-VN')}: ${count} từ`));}
 const list=$('memoryUpcoming');list.replaceChildren();for(const w of rows.slice(0,20)){const r=recordOf(w);list.append(relationElement('p',`${w.han} · ${w.pin} · HSK ${w.hsk} — ${memoryDate(r.due)}${r.due<=now?' · Đến hạn':''}`));}if(!rows.length)list.append(relationElement('p','Chưa có từ được lên lịch trong HSK đang chọn.'));if(rows.length>20)list.append(relationElement('p',`Đang hiện 20 / ${rows.length} từ đã có lịch, theo hạn ôn gần nhất.`,'hint'));
}
$('memoryContextToggle').checked=memoryPrefs.context;$('memoryNewWords').checked=memoryPrefs.newWords;
$('memoryContextToggle').onchange=e=>{memoryPrefs.context=e.target.checked;saveMemoryPrefs();if(srsSession)renderSrs();};$('memoryNewWords').onchange=e=>{memoryPrefs.newWords=e.target.checked;saveMemoryPrefs();};
$('memoryDueStart').onclick=()=>{document.querySelector('[data-filter="all"]').click();switchMode('srs');const due=words.filter(w=>recordOf(w)&&recordOf(w).due<=Date.now()).sort((a,b)=>recordOf(a).due-recordOf(b).due);srsSession={queue:due,total:due.length,done:0};$('srsMessage').textContent='Chỉ ôn từ đến hạn trong tất cả HSK.';window.HSKLoading?.flash('Phiên ôn tập SRS đang load...','Chỉ ôn từ đến hạn trong tất cả HSK...',undefined,$('srsPanel'));renderSrs();};
$('memoryLearnCurrent').onclick=()=>{const w=currentWords[index];if(!w)return;memoryPrefs.context=true;$('memoryContextToggle').checked=true;saveMemoryPrefs();switchMode('srs');srsSession={queue:[w],total:1,done:0};window.HSKLoading?.flash('Phiên ôn tập SRS đang load...','Ôn theo ngữ cảnh: '+w.han,undefined,$('srsPanel'));renderSrs();};
const baseMemoryStats=stats;stats=function(){baseMemoryStats();refreshMemoryDashboard();};
window.addEventListener('focus',()=>{stats();});document.addEventListener('visibilitychange',()=>{if(!document.hidden)stats();});setInterval(()=>{if(!document.hidden)stats();},60000);
refreshMemoryDashboard();
$('srsStart').onclick=startSrs;

// Native phone selectors reuse existing controls and preserve all HSK/mode behavior.
$('mobileLevel').onchange=e=>document.querySelector('[data-filter="'+e.target.value+'"]').click();
$('mobileMode').onchange=e=>switchMode(e.target.value);
const baseMobileSwitch=switchMode;
switchMode=function(next){baseMobileSwitch(next);$('mobileMode').value=mode;};
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{$('mobileLevel').value=activeLevel;}));
const baseMobileReminder=refreshMemoryDashboard;
refreshMemoryDashboard=function(){baseMobileReminder();document.querySelector('.memory-reminder').classList.toggle('no-due',$('memoryDueStart').hidden);};
$('mobileLevel').value=activeLevel;$('mobileMode').value=mode;refreshMemoryDashboard();
// Select the saved study goal on startup/change, without replacing a manual filter choice on every rerender.
window.HSKLearningFilter={
 select(level){
  const target=Number(level);
  if(!Number.isInteger(target)||target<1||target>6)return false;
  const button=document.querySelector('.filter-btn[data-filter="'+target+'"]');
  if(!button)return false;
  if(activeLevel!==String(target)){button.onclick();$('mobileLevel').value=activeLevel;}
  return true;
 },
 get level(){return activeLevel;}
};

// On-device learner: aggregates answers, estimates weakness and adapts review selection.
const ADAPTIVE_KEY='hsk-adaptive-learning-v1';
let adaptiveState={enabled:true,stats:{}};
try{const x=JSON.parse(localStorage.getItem(ADAPTIVE_KEY)||'null');if(x?.version===1&&x.stats&&typeof x.stats==='object'){adaptiveState.enabled=x.enabled!==false;for(const [id,r] of Object.entries(x.stats))if(wordByKey.has(r.key)&&quizTypeLabels[r.type]&&['attempts','wrong','streak','last'].every(k=>Number.isFinite(r[k])&&r[k]>=0)&&r.wrong<=r.attempts)adaptiveState.stats[id]=r;}}catch(e){}
function saveAdaptive(){try{localStorage.setItem(ADAPTIVE_KEY,JSON.stringify({version:1,...adaptiveState}));}catch(e){$('storageNotice').hidden=false;$('storageNotice').textContent='Không lưu được phân tích mới; dữ liệu hiện chỉ tồn tại trong phiên này.';}}
function adaptiveRows(key){return Object.values(adaptiveState.stats).filter(r=>!key||r.key===key);}
let adaptiveScoreCache=null;
function adaptiveRisk(key,type){
 const minute=Math.floor(Date.now()/60000);if(!adaptiveScoreCache||adaptiveScoreCache.minute!==minute){const scores=new Map(),add=(key,type,value)=>{for(const id of [JSON.stringify([key,type]),JSON.stringify([key,null])])scores.set(id,(scores.get(id)||0)+value);};
 for(const r of Object.values(adaptiveState.stats)){const recency=1/(1+Math.max(0,Date.now()-r.last)/86400000/14);add(r.key,r.type,((r.wrong+1)/(r.attempts+2))*Math.log2(r.wrong+2)*recency/Math.pow(1.8,Math.min(r.streak,5)));}
 for(const e of Object.values(mistakeRecords))if(!e.resolved)add(e.snapshot.key,e.snapshot.direction,Math.log2(e.wrongCount+1));adaptiveScoreCache={minute,scores};}
 return adaptiveScoreCache.scores.get(JSON.stringify([key,type||null]))||0;
}
function weightedAdaptiveWords(pool){return pool.map(w=>({w,p:-Math.log(Math.max(Math.random(),1e-9))/(1+adaptiveRisk(wordKey(w)))})).sort((a,b)=>a.p-b.p).map(x=>x.w);}
const oldRecordMistake=recordQuizMistake;
recordQuizMistake=function(q,chosen){oldRecordMistake(q,chosen);const key=wordKey(q.w),id=JSON.stringify([key,q.direction]),r=adaptiveState.stats[id]||{key,type:q.direction,attempts:0,wrong:0,streak:0,last:0};r.attempts++;if(chosen.correct)r.streak++;else{r.wrong++;r.streak=0;}r.last=Date.now();adaptiveState.stats[id]=r;adaptiveScoreCache=null;saveAdaptive();};
const ordinaryStartQuiz=startQuiz;
startQuiz=function(e){
 if(!adaptiveState.enabled){ordinaryStartQuiz(e);return;}e?.preventDefault();const types=selectedQuizTypes(),count=Number($('quizCount').value);if(!types.length||!Number.isInteger(count)||count<1||count>100){ordinaryStartQuiz(e);return;}
 const candidates=quizLevelWords(),eligible=quizEligibleWords(candidates,$('quizDirection').value),allowed=new Set(eligible.map(wordKey));
 const pending=Object.values(mistakeRecords).filter(x=>!x.resolved&&allowed.has(x.snapshot.key)&&types.includes(x.snapshot.direction)).sort((a,b)=>adaptiveRisk(b.snapshot.key,b.snapshot.direction)-adaptiveRisk(a.snapshot.key,a.snapshot.direction)||b.lastWrong-a.lastWrong);
 const target=Math.min(count,eligible.length),repeat=pending.filter((e,i,x)=>x.findIndex(a=>a.snapshot.key===e.snapshot.key)===i).slice(0,Math.floor(target*.6)),questions=repeat.map(x=>restoreQuestion(x.snapshot)),seen=new Set(repeat.map(x=>x.snapshot.key));
 const fresh=weightedAdaptiveWords(eligible.filter(w=>!seen.has(wordKey(w))));const plan=quizTypeSchedule(types,Math.max(0,target-questions.length));
 for(const w of fresh){if(questions.length>=target)break;const i=questions.length-repeat.length,preferred=types.slice().sort((a,b)=>adaptiveRisk(wordKey(w),b)-adaptiveRisk(wordKey(w),a))[0],direction=adaptiveRisk(wordKey(w),preferred)>0&&i%2===0?preferred:plan[i%plan.length];const q=createQuestion(w,direction,candidates);if(q)questions.push(q);}
 if(!questions.length){ordinaryStartQuiz(e);return;}
 quizSession={pool:questions.map(q=>q.w),savedQuestions:questions,candidates,levelLabel:quizLevelLabel()+' · Ôn thích ứng',position:0,score:0,types,direction:'saved',plan:questions.map(q=>q.direction)};renderQuestion();
};$('quizForm').onsubmit=startQuiz;
const normalSrsStart=startSrs;startSrs=function(){normalSrsStart();if(adaptiveState.enabled&&srsSession){srsSession.queue.sort((a,b)=>Number(!!recordOf(b))-Number(!!recordOf(a))||adaptiveRisk(wordKey(b))-adaptiveRisk(wordKey(a)));renderSrs();}};$('srsStart').onclick=startSrs;
function renderAdaptiveAnalysis(){const root=$('adaptiveAnalysis');root.replaceChildren();const valid=adaptiveRows().filter(r=>activeLevel==='all'||String(wordByKey.get(r.key).hsk)===activeLevel),attempts=valid.reduce((n,r)=>n+r.attempts,0),wrong=valid.reduce((n,r)=>n+r.wrong,0);root.append(textElement('p',`${attempts} câu đã phân tích · ${wrong} lượt sai. Phân tích dựa trên lịch sử trả lời, tần suất sai, lỗi gần đây và chuỗi trả lời đúng; không phải AI tạo sinh.`,'hint'));const keys=[...new Set([...valid.map(r=>r.key),...mistakeEntries(true).map(e=>e.snapshot.key)])].filter(k=>adaptiveRisk(k)>0).sort((a,b)=>adaptiveRisk(b)-adaptiveRisk(a));if(!keys.length){root.append(textElement('p','Chưa đủ lịch sử. Làm bài kiểm tra để app nhận biết điểm cần ôn.'));return;}for(const key of keys.slice(0,8)){const w=wordByKey.get(key),rs=valid.filter(r=>r.key===key),total=rs.reduce((n,r)=>n+r.attempts,0),errors=rs.reduce((n,r)=>n+r.wrong,0),types=[...new Set([...rs.filter(r=>r.wrong>0).map(r=>r.type),...Object.values(mistakeRecords).filter(e=>e.snapshot.key===key&&!e.resolved).map(e=>e.snapshot.direction)])];if(!types.length)continue;const row=textElement('article','','mistake-entry');row.append(textElement('strong',`${w.han} · ${w.pin} · HSK ${w.hsk}`),textElement('p',total?`Sai ${errors}/${total} lượt kể từ khi bật phân tích.`:'Có câu sai trong lịch sử trước đây.'),textElement('p','Cần luyện: '+types.map(t=>quizTypeLabels[t]).join(' · ')),textElement('small','App tăng ưu tiên sau lỗi và giảm dần khi trả lời đúng liên tiếp.'));const btn=textElement('button','Ôn trọng tâm từ này');btn.onclick=()=>{const saved=Object.values(mistakeRecords).filter(e=>e.snapshot.key===key&&!e.resolved).sort((a,b)=>b.wrongCount-a.wrongCount);if(saved.length){reviewMistakeEntries(saved,'Ôn trọng tâm: '+w.han);return;}const qs=types.map(t=>createQuestion(w,t,words)).filter(Boolean);startSavedQuestions(qs,'Ôn trọng tâm: '+w.han);};row.append(btn);root.append(row);}}
const originalRenderMistakes=renderMistakes;renderMistakes=function(){originalRenderMistakes();renderAdaptiveAnalysis();};
$('adaptiveToggle').checked=adaptiveState.enabled;$('adaptiveToggle').onchange=e=>{adaptiveState.enabled=e.target.checked;saveAdaptive();};

// Bridge for textbook lesson practice. All words keep their existing keys and SRS records.
const lessonWordsByHan=new Map();
for(const w of words)for(const han of new Set([w.han,...w.han.split(/[()（）]/).map(s=>s.trim()).filter(Boolean)])){const xs=lessonWordsByHan.get(han)||[];xs.push(w);lessonWordsByHan.set(han,xs);}
// Exact orthographic equivalents only; keep the existing card and SRS key.
const lessonWordAliases=new Map([['贏','赢'],['內容','内容'],['勺（子）','勺子']]);
window.HSKLessons={
 show(){switchMode('lessons');},
 key(w){return wordKey(w);},
 match(hans){const out=[],seen=new Set();for(const han of hans)for(const w of lessonWordsByHan.get(lessonWordAliases.get(han)||han)||[]){if(!seen.has(wordKey(w))){out.push(w);seen.add(wordKey(w));}}return out;},
 record(w){return recordOf(w);},
 mark(w,status){markWord(w,status);},
 examples(w){return (w.practice?.examples||[]).filter(e=>e.cn&&e.pin&&e.vi);},
 quiz(ws,label,id){let state={};try{state=JSON.parse(localStorage.getItem('hsk-course-lessons-v1')||'{}').lessons?.[id]||{};}catch{};const pool=shuffled(ws).sort((a,b)=>(state.evidence?.[wordKey(a)]?.quizStreak||0)-(state.evidence?.[wordKey(b)]?.quizStreak||0));const qs=pool.slice(0,20).map((w,i)=>createQuestion(w,i%2?'mean':'han',words)).filter(Boolean);startSavedQuestions(qs,label);if(qs.length){quizSession.lessonId=id;$('lessonPracticeBack').hidden=!id;}},
 srs(ws,id){switchMode('srs');const due=ws.filter(w=>!recordOf(w)||recordOf(w).due<=Date.now()).sort((a,b)=>(recordOf(a)?.due||0)-(recordOf(b)?.due||0));srsSession={queue:due,total:due.length,done:0,lessonId:id};$('lessonPracticeBack').hidden=!id;$('srsMessage').textContent=due.length?'Ôn từ đến hạn và từ mới của bài học.':'Tất cả từ trong bài đã có lịch ôn và chưa đến hạn.';window.HSKLoading?.flash('Phiên ôn tập SRS đang load...','Ôn từ đến hạn và từ mới của bài học...',undefined,$('srsPanel'));renderSrs();}
};
window.HSKDictionaryBridge={query:()=>handwritingSearchCharacter||$('searchInput').value,exact:q=>words.some(w=>w.han===q),hsk:(han,trad)=>words.find(w=>w.han===han||w.han===trad)?.hsk||null,open(han,pin){const w=words.find(w=>w.han===han&&w.pin===pin);if(!w)return;if(activeLevel!=='all'&&String(w.hsk)!==activeLevel)document.querySelector('[data-filter="'+w.hsk+'"]').click();$('masteryFilter').value='all';rebuildDeck(w);switchMode('learn');},scope:()=>searchScope,results:()=>searchMatches.slice(),setScope(value){if(!['hsk','general'].includes(value))return;searchScope=value;document.querySelectorAll('[data-search-scope]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.searchScope===value)));$('dictionaryModeHint').textContent=value==='hsk'?'Ưu tiên từ vựng HSK.':'Tìm cả từ ngoài HSK.';runSearch();}};
document.querySelectorAll('[data-search-scope]').forEach(b=>b.onclick=()=>window.HSKDictionaryBridge.setScope(b.dataset.searchScope));
window.HSKFlashcardBridge={snapshot(){return {index,words:currentWords.map(w=>window.HSKPassiveCore?.word(w)).filter(Boolean)};},show(key){if(mode!=='learn')return false;const n=currentWords.findIndex(w=>wordKey(w)===key);if(n<0)return false;index=n;updateCard();return true;},reveal(){$('flashcard').classList.add('flipped');}};
window.dispatchEvent(new Event('hsk-lessons-ready'));
// Mobile exit ends only the current quiz session; saved answers/SRS remain intact.
window.HSKMobileQuiz={exit(){resetQuiz('Đã thoát phiên. Các câu đã làm vẫn được giữ; chọn Bắt đầu để luyện lượt mới.');}};
