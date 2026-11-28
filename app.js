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
  w.primaryMean=base;
  const meanings=[base,...(extra?.meanings||[]).map(m=>m.gloss),...(w.practice?.meanings||[]),extra?.example?.meaning,w.originalExampleMetadata.meaning].filter(Boolean);
  w.mean=[...new Set(meanings)].join('; ');
}
const dictionaryReport=dictionarySupplement.report;
function pinyinLine(pin) {
  const p=document.createElement('p');p.className='example-pinyin';p.lang='zh-Latn';p.textContent=pin||'';return p;
}
$('dictionaryCoverage').textContent=`Kho học liệu HSK: ${words.length.toLocaleString('vi')} mục từ · phủ 100% 146 bài học`;
$('dictionaryCoverageDetail').textContent=`Cập nhật hệ thống học liệu ngày ${dictionaryReport.date}: toàn bộ ${words.length.toLocaleString('vi')} mục từ HSK 1–6 (bao gồm từ vựng phủ kín cả 146 bài giáo trình), ví dụ minh họa, phân biệt từ dễ nhầm và giải thích quan hệ từ đều được biên soạn độc lập theo quy trình Clean-Room của app. Có 3–4 ví dụ cho ${checkedPracticeExamples.report.covered.toLocaleString('vi')} / ${words.length.toLocaleString('vi')} mục. Đây là trạng thái kho học liệu, không phải tiến độ học của bạn.`;
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
      const note=document.createElement('small');note.className='example-origin';note.textContent=e.origin==='original'?'Ví dụ trong bộ học HSK':'Ví dụ tự biên soạn của app';
      item.append(label,cn,pinyinLine(e.pin),vi);
      if(e.sense&&e.sense!==e.meaning){const usage=document.createElement('small');usage.className='example-origin';usage.textContent=`Cách dùng: ${e.sense}`;item.append(usage);}
      item.append(note);box.append(item);
    }
  } else if(extra?.example && extra.example.cn!==w.exCn) {
    const title=document.createElement('h3');title.textContent='Ví dụ bổ sung';box.append(title);
    const cn=document.createElement('p');cn.className='dictionary-cn';cn.textContent=extra.example.cn;
    const vi=document.createElement('p');vi.textContent=extra.example.vi;box.append(cn,pinyinLine(extra.example.pin),vi);
  }
  container.append(box);
}
const recordOf = w => records[wordKey(w)];
const statusOf = w => recordOf(w)?.status || 'unknown';
const sensesMap = new Map(words.map(w => [w,splitSenses(w)]));
const primarySensesMap = new Map(words.map(w => {
 const baseSenses=splitSenses({mean:w.primaryMean||w.mean,hv:w.hv});
 const baseTokens=new Set(baseSenses.flatMap(s=>viText(s).split(' ')).filter(t=>t.length>=2));
 const uSenses=typeof usageFactsData!=='undefined'?(usageFactsData?.words?.[w.han]?.variants?.[0]?.senses||[]):[];
 const seenPos=new Set(),extraPrimary=[];
 for(const s of uSenses){
  if(!s?.mean||s.pos==='q'||s.pos==='classifier'||s.pos==='Lưu ý'||seenPos.has(s.pos))continue;
  seenPos.add(s.pos);
  const firstGloss=splitSenses({mean:s.mean,hv:''})[0];
  if(firstGloss&&viText(firstGloss).split(' ').some(t=>baseTokens.has(t)))extraPrimary.push(firstGloss);
 }
 return [w,[...new Set([...baseSenses,...extraPrimary])]];
}));
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
let extendedSearchPoolCache=null;
const BASE_EXTRA_WORDS=[
 {han:'饭',pin:'fàn',hv:'Phạn',mean:'cơm; bữa cơm; bữa ăn; thức ăn nấu chín',posSenses:[{pos:'Danh từ',mean:'cơm; bữa cơm; bữa ăn; thức ăn nấu chín'}],examples:[{cn:'晚饭已经做好了，快过来吃吧。',pin:'Wǎnfàn yǐjīng zuòhǎo le, kuài guòlái chī ba.',vi:'Cơm tối đã nấu xong rồi, mau lại ăn đi.'},{cn:'我中午在公司附近吃了一顿便饭。',pin:'Wǒ zhōngwǔ zài gōngsī fùjìn chī le yī dùn biànfàn.',vi:'Buổi trưa tôi ăn một bữa cơm bình dân gần công ty.'}]},
 {han:'讨饭',pin:'tǎofàn',hv:'Thảo phạn',mean:'xin ăn; ăn xin; đi ăn mày',posSenses:[{pos:'Động từ',mean:'xin ăn; ăn xin; đi ăn mày'}],examples:[{cn:'旧社会很多穷人不得不沿街讨饭。',pin:'Jiù shèhuì hěn duō qióngrén bùdébù yánjiē tǎofàn.',vi:'Ở xã hội cũ, nhiều người nghèo buộc phải đi xin ăn dọc đường.'}]},
 {han:'要饭',pin:'yàofàn',hv:'Yếu phạn',mean:'xin ăn; ăn xin (khẩu ngữ)',posSenses:[{pos:'Động từ',mean:'xin ăn; ăn xin (khẩu ngữ)'}],examples:[{cn:'街角坐着一个要饭的老人。',pin:'Jiējiǎo zuòzhe yī gè yàofàn de lǎorén.',vi:'Ở góc phố có một ông cụ đang ngồi xin ăn.'}]}
];
const SEARCH_POS_LABELS={n:'Danh từ',v:'Động từ',adj:'Tính từ',adv:'Phó từ',prep:'Giới từ',conj:'Liên từ',pron:'Đại từ',pro:'Đại từ',num:'Số từ',numb:'Số từ',classifier:'Lượng từ',particle:'Trợ từ',part:'Trợ từ',interj:'Thán từ',a:'Tính từ',d:'Phó từ',m:'Số từ',q:'Lượng từ',p:'Giới từ',c:'Liên từ',r:'Đại từ',u:'Trợ từ',idiom:'Thành ngữ'};
function searchPosLabel(pos){return SEARCH_POS_LABELS[pos]||pos||'Nghĩa';}
function getExtendedSearchPool(){
 if(extendedSearchPoolCache)return extendedSearchPoolCache;
 const hskHans=new Set(words.map(w=>w.han));
 const list=[];
 const extraSeeds=[...BASE_EXTRA_WORDS,...(window.HSKSearchRanking?.everydayWords||[]).map(item=>({everydayBonus:28,...item}))];
 for(const item of extraSeeds){
  if(hskHans.has(item.han))continue;
  const w={...item,primaryMean:item.mean,hsk:null,isExtended:true};
  sensesMap.set(w,splitSenses(w));
  primarySensesMap.set(w,splitSenses(w));
  list.push(w);
  hskHans.add(item.han);
 }
 if(typeof usageFactsData!=='undefined'&&usageFactsData?.words){
  for(const [han,entry] of Object.entries(usageFactsData.words)){
   if(hskHans.has(han)||!entry?.variants?.length)continue;
   const v=entry.variants[0];
   const rawSenses=(v.senses||[]).filter(s=>s&&s.mean);
   if(!rawSenses.length)continue;
   const mean=[...new Set(rawSenses.map(s=>s.mean))].join('; ');
   const primaryMean=[...new Set(rawSenses.slice(0,3).map(s=>s.mean))].join('; ');
   const w={han,pin:v.pin||'',mean,primaryMean,hv:'',hsk:null,isExtended:true,posSenses:rawSenses.map(s=>({pos:searchPosLabel(s.pos),mean:s.mean})),structures:v.structures||[]};
   sensesMap.set(w,splitSenses(w));
   primarySensesMap.set(w,splitSenses({mean:primaryMean,hv:''}));
   list.push(w);
  }
 }
 extendedSearchPoolCache=list;
 return list;
}
function sameTokenSet(senseStr,qTokens){
 const sTokens=String(senseStr||'').split(' ').filter(Boolean);
 if(sTokens.length!==qTokens.length)return false;
 const bag=new Map();
 for(const t of sTokens)bag.set(t,(bag.get(t)||0)+1);
 for(const t of qTokens){const c=bag.get(t)||0;if(!c)return false;bag.set(t,c-1);}
 return true;
}
function coreSenseText(s){
 const raw=String(s||'').trim();
 const stripped=raw.replace(/\([^)]*\)|\[[^\]]*\]/g,' ').replace(/\s+/g,' ').trim();
 return stripped||raw;
}
function noteSenseTexts(s){
 const notes=[];
 for(const m of String(s||'').matchAll(/\(([^)]+)\)/g)){
  const inner=m[1].trim();
  if(inner&&!/^(?:như|ví dụ|vd|chỉ|dùng|biểu thị|đơn vị|là một|tức là|đài loan|lượng từ)(?:\s|:|$)/iu.test(inner))notes.push(inner);
 }
 return notes;
}
function searchMatchInfo(w,q,terms) {
 const trimmed=q.trim();
 if(!trimmed)return {score:0,tier:0,band:0,kind:'',exact:false,exactTone:false,hasVi:false,hasPinyin:false};
 if(w.han===trimmed)return {score:160,tier:3,band:6,kind:'han',exact:true,exactTone:true,hasVi:false,hasPinyin:false};
 if(/^[\u3400-\u9fff]+$/.test(trimmed)){
  if(w.han.startsWith(trimmed))return {score:132,tier:1,band:4,kind:'han',exact:false,exactTone:false,hasVi:false,hasPinyin:false};
  if(w.han.includes(trimmed))return {score:118,tier:1,band:3,kind:'han',exact:false,exactTone:false,hasVi:false,hasPinyin:false};
  return {score:0,tier:0,band:0,kind:'',exact:false,exactTone:false,hasVi:false,hasPinyin:false};
 }
 const C=window.HSKOpenDictionaryCore;
 let pinScore=0,pinBand=0,pinExact=false;
 if(searchPinyinAllowed&&w.pin&&/[a-z]/i.test(trimmed)&&C){
  const p=C.fold(w.pin),f=C.fold(trimmed);
  if(f&&p===f){pinScore=145;pinBand=5;pinExact=true;}
  else if(f.length>=2&&C.pinyinQuery(trimmed)){
   const syls=window.HSKSearchRanking?.splitPinyinSyllables?window.HSKSearchRanking.splitPinyinSyllables(w.pin):String(w.pin).trim().split(/[\s,/·-]+/).filter(Boolean).map(s=>C.fold(s));
   const qToks=trimmed.split(/[\s'’]+/).map(s=>C.fold(s)).filter(Boolean);
   if(qToks.length>=1&&syls.length>qToks.length&&qToks.every((t,i)=>syls[i]===t)){pinScore=112;pinBand=4;}
   else if(qToks.length===1&&syls.includes(f)){pinScore=92;pinBand=3;}
  }
 }
 const senses=sensesMap.get(w)||splitSenses(w);
 const primarySenses=primarySensesMap.get(w)||splitSenses({mean:w.primaryMean||w.mean,hv:w.hv});
 const accented=hasAccent(trimmed),qVi=viText(trimmed),qFold=fold(trimmed),query=accented?qVi:qFold;
 const pCores=primarySenses.map(coreSenseText),allCores=senses.map(coreSenseText);
 const pVi=pCores.map(viText),pFold=pCores.map(fold);
 const allVi=allCores.map(viText),allFold=allCores.map(fold);
 const pMeanings=accented?pVi:pFold,meanings=accented?allVi:allFold;
 const pNotes=primarySenses.flatMap(noteSenseTexts).map(s=>accented?viText(s):fold(s));
 const tokens=query.split(' ').filter(Boolean);
 const concisePrimary=pMeanings.filter(s=>s.split(' ').length<=7),conciseAll=meanings.filter(s=>s.split(' ').length<=7);
 const sameSpecificityTerms=terms.filter(t=>tokens.length<=1||t.split(' ').length>=2);
 const broadRootTerms=tokens.length>=2?terms.filter(t=>t.split(' ').length===1):[];
 let viScore=0,viBand=0,viKind='vi',viExact=false,exactTone=false;
 if(pVi[0]===qVi){viScore=164;viBand=5;viExact=true;exactTone=true;}
 else if(pVi.includes(qVi)){viScore=144;viBand=5;viExact=true;exactTone=true;}
 else if(!accented&&pFold.includes(qFold)){viScore=pFold[0]===qFold?146:136;viBand=5;viExact=true;}
 else if(allVi.includes(qVi)){viScore=106;viBand=4;exactTone=true;}
 else if(tokens.length>=2&&tokens.length<=4&&concisePrimary.some(s=>sameTokenSet(s,tokens))){viScore=124;viBand=4;}
 else if(concisePrimary.some(s=>phraseIn(s,query))){viScore=concisePrimary[0]&&phraseIn(concisePrimary[0],query)?120:114;viBand=4;}
 else if(pNotes.some(s=>s===query||phraseIn(s,query))){viScore=110;viBand=4;}
 else if(tokens.length>=2&&tokens.length<=4&&conciseAll.some(s=>sameTokenSet(s,tokens))){viScore=104;viBand=4;}
 // Synonym expansion preserves accents (bố ≠ bỏ) and avoids broadening 2-word queries onto secondary senses.
 else if(pVi.some(s=>s.split(' ').length<=7&&sameSpecificityTerms.some(t=>t.split(' ').length===1?s===t:phraseIn(s,t)))){viScore=102;viBand=4;}
 else if(!accented&&allFold.includes(qFold)){viScore=92;viBand=3;}
 else if(allVi.some(s=>s.split(' ').length<=7&&sameSpecificityTerms.some(t=>t.split(' ').length===1?s===t:phraseIn(s,t)))){viScore=88;viBand=3;}
 else if(pVi[0]&&broadRootTerms.includes(pVi[0])){viScore=84;viBand=3;}
 else if(conciseAll.some(s=>phraseIn(s,query))){viScore=78;viBand=3;}
 else if(w.hv&&(accented?viText(w.hv)===query:fold(w.hv)===query)){viScore=64;viBand=3;viKind='hv';}
 else if(tokens.length>1&&conciseAll.some(s=>tokens.filter(t=>phraseIn(s,t)).length>=Math.max(2,Math.ceil(tokens.length*.75)))){viScore=45;viBand=2;}
 else if(!w.isExtended&&senses.some(s=>accented?typoSimilar(qVi,viText(coreSenseText(s))):typoSimilar(qFold,fold(coreSenseText(s))))){viScore=25;viBand=1;}
 const hasPin=pinScore>0,hasVi=viScore>0&&viKind==='vi';
 if(!pinScore&&!viScore)return {score:0,tier:0,band:0,kind:'',exact:false,exactTone:false,hasVi:false,hasPinyin:false};
 const tier=(pinExact||viExact)?2:(Math.max(pinBand,viBand)===1?0:1);
 if(pinBand>viBand||(pinBand===viBand&&pinScore>viScore))return {score:pinScore,tier,band:pinBand,kind:'pinyin',exact:pinExact,exactTone:false,hasVi,hasPinyin:hasPin};
 return {score:viScore,tier,band:viBand,kind:viKind,exact:viExact,exactTone,hasVi,hasPinyin:hasPin};
}
function searchScore(w,q,terms) { return searchMatchInfo(w,q,terms).score; }
function isSingleRootQuery(rawQuery){
 const trimmed=String(rawQuery||'').trim();
 return Boolean(trimmed)&&!handwritingSearchCharacter&&!/[\u3400-\u9fff]/.test(trimmed)&&trimmed.split(/\s+/).length===1;
}
function shouldFoldSearchCompounds(matches,rawQuery){
 if(!isSingleRootQuery(rawQuery))return false;
 const heads=matches.filter(r=>r.tier>=2).length;
 return heads>=1&&heads<matches.length;
}
function relatedCompoundsFor(match,allMatches,limit=8){
 const compounds=allMatches.filter(r=>r.tier<2&&r.w.han!==match.w.han);
 if(!compounds.length)return {title:'',items:[]};
 const w=match.w;
 // For a Pinyin/character headword (e.g. 新, 心, 信), show everyday compounds containing that character first.
 if(match.hasPinyin&&!match.hasVi){
  const containing=compounds.filter(r=>r.w.han.includes(w.han));
  if(containing.length)return {title:`Từ ghép chứa "${w.han}"`,items:containing.slice(0,limit)};
  return {title:'',items:[]};
 }
 // For a Vietnamese headword (e.g. 请/申请/求 for "xin", 饭/米饭 for "cơm"), show specific phrases (xin lỗi, xin ăn, ăn cơm...).
 const viCompounds=compounds.filter(r=>r.hasVi);
 if(!viCompounds.length)return {title:'',items:[]};
 const sameChar=viCompounds.filter(r=>r.w.han.includes(w.han));
 const others=viCompounds.filter(r=>!r.w.han.includes(w.han));
 const picked=[...sameChar,...others].slice(0,limit);
 return {title:`Từ ghép & nghĩa cụ thể liên quan`,items:picked};
}
let handwritingSearchCharacter='',searchIntentFilter='all',lastSearchQueryKey='';
function runSearch() {
 clearTimeout(searchTimer); const q=fold($('searchInput').value); visibleResults=40;
 if(q!==lastSearchQueryKey){searchIntentFilter='all';lastSearchQueryKey=q;}
 if(handwritingSearchCharacter){searchMatches=(searchScope==='general'?words:levelWords()).filter(w=>w.han.includes(handwritingSearchCharacter)).map((w,i)=>({w,score:110,tier:1,kind:'han',exact:false,hasVi:false,hasPinyin:false,rank:110+(window.HSKSearchRanking?.commonality(w)||0),i})).sort((a,b)=>Number(a.w.hsk)-Number(b.w.hsk)||b.rank-a.rank||a.i-b.i);renderSearch();return;}
 if(!q){searchMatches=[];renderSearch();return;}
 const terms=expandedTerms($('searchInput').value);
 const query=$('searchInput').value.trim(),accented=hasAccent(query),normalized=accented?viText(query):fold(query);
 const includeExtended=searchScope==='general'||activeLevel==='all';
 const extraPool=includeExtended?getExtendedSearchPool():[];
 const C=window.HSKOpenDictionaryCore,R=window.HSKSearchRanking;
 const exactViTargets=[normalized,...(accented?terms:[])];
 const exactViExists=words.some(w=>sensesMap.get(w).some(s=>exactViTargets.includes(accented?viText(s):fold(s))))||extraPool.some(w=>(sensesMap.get(w)||[]).some(s=>exactViTargets.includes(accented?viText(s):fold(s))));
 // Accented Vietnamese (e.g. "bạn", "cơm") must never be parsed as pinyin.
 // Unaccented valid pinyin syllables (e.g. "xin", "ni men") compete cleanly alongside Vietnamese meanings.
 searchPinyinAllowed=accented?(!C?.vietnamese?.(query)&&!exactViExists):(Boolean(C?.pinyinQuery?.(query))||!exactViExists);
 const hskPool=searchScope==='general'?words:[...new Set([...levelWords(),...words.filter(w=>w.han===query||searchPinyinAllowed&&C?.fold(w.pin)===C?.fold(query)&&/[a-z]/i.test(query))])];
 const pool=includeExtended?[...hskPool,...extraPool]:hskPool;
 const rawMatches=pool.map((w,i)=>{
  const info=searchMatchInfo(w,query,terms);
  if(!info.score)return null;
  const rank=info.score+(R?R.commonality(w)+R.boost(query,w):0);
  return {w,score:info.score,tier:info.tier,band:info.band,kind:info.kind,exact:info.exact,exactTone:info.exactTone,hasVi:info.hasVi,hasPinyin:info.hasPinyin,rank,i};
 }).filter(Boolean);
 // If an unaccented query matches real thanh-ngang Vietnamese words (e.g. "vui"), demote accent-colliding homographs (e.g. "vùi" -> 埋).
 if(!accented&&rawMatches.some(r=>r.kind==='vi'&&r.exactTone&&r.band>=5)){
  for(const r of rawMatches){
   if(r.kind==='vi'&&!r.exactTone&&r.band>=5){
    r.score=86;r.band=3;r.tier=1;r.exact=false;
    r.rank=r.score+(R?R.commonality(r.w)+R.boost(query,r.w):0);
   }
  }
 }
 const strongCount=rawMatches.filter(r=>r.band>=4).length;
 const hasRealMatch=rawMatches.some(r=>r.band>=2);
 const filteredMatches=strongCount>=1?rawMatches.filter(r=>r.band>=3):(hasRealMatch?rawMatches.filter(r=>r.band>=2):rawMatches);
 searchMatches=filteredMatches.sort((a,b)=>{
  const aHan=Number(a.exact&&a.kind==='han'),bHan=Number(b.exact&&b.kind==='han');
  if(bHan!==aHan)return bHan-aHan;
  if(b.tier!==a.tier)return b.tier-a.tier;
  if(b.band!==a.band)return b.band-a.band;
  const aHsk=Number(a.w.hsk)||99,bHsk=Number(b.w.hsk)||99;
  if(aHsk!==bHsk)return aHsk-bHsk;
  return b.rank-a.rank||b.score-a.score||Number(!b.w.isExtended)-Number(!a.w.isExtended)||a.w.han.length-b.w.han.length||a.i-b.i;
 });
 renderSearch();
}
const SENSE_EX_CACHE_KEY='hsk-dict-sense-examples-v1';
let senseExCache=null,corpusSentenceBank=null,senseExAbort=null;
function readSenseExCache(){
 if(senseExCache)return senseExCache;
 senseExCache=Object.create(null);
 try{
  const raw=JSON.parse(localStorage.getItem(SENSE_EX_CACHE_KEY)||'{}');
  if(raw&&typeof raw==='object'){
   for(const [k,v] of Object.entries(raw)){
    if(v&&Array.isArray(v.examples)&&Number.isFinite(v.t))senseExCache[k]=v;
   }
  }
 }catch(_){}
 return senseExCache;
}
function saveSenseExCache(key,examples){
 const cache=readSenseExCache();
 cache[key]={examples,t:Date.now()};
 const keys=Object.keys(cache).sort((a,b)=>(cache[b].t||0)-(cache[a].t||0));
 for(const old of keys.slice(450))delete cache[old];
 try{localStorage.setItem(SENSE_EX_CACHE_KEY,JSON.stringify(cache));}catch(_){}
}
function getCorpusSentenceBank(){
 if(corpusSentenceBank)return corpusSentenceBank;
 const seen=new Set(),bank=[];
 const pushEx=(cn,pin,vi,sense='',meaning='')=>{
  const c=String(cn||'').trim(),v=String(vi||'').trim();
  if(!c||!v||c.length<3||c.length>46||seen.has(c))return;
  seen.add(c);
  bank.push({cn:c,pin:String(pin||'').trim(),vi:v,sense:String(sense||''),meaning:String(meaning||'')});
 };
 for(const w of words){
  for(const e of w.practice?.examples||[])pushEx(e.cn,e.pin,e.vi,e.sense,e.meaning);
  if(w.dictionary?.example)pushEx(w.dictionary.example.cn,w.dictionary.example.pin,w.dictionary.example.vi,'',w.dictionary.example.meaning);
  if(w.exCn&&w.exVi)pushEx(w.exCn,w.originalExampleMetadata?.pin||'',w.exVi,'',w.originalExampleMetadata?.meaning||'');
 }
 for(const item of [...BASE_EXTRA_WORDS,...(window.HSKSearchRanking?.everydayWords||[])]){
  for(const e of item.examples||[])pushEx(e.cn,e.pin,e.vi,e.sense,e.meaning);
 }
 corpusSentenceBank=bank;
 return bank;
}
function collectWordExamples(w){
 if(!w||!w.han)return [];
 const fmt=s=>window.HSKOpenDictionaryCore?.formatPinyin?window.HSKOpenDictionaryCore.formatPinyin(s||''):String(s||'');
 const seen=new Set(),out=[];
 const add=(e,fromCorpus=false)=>{
  if(!e||!e.cn||!e.vi)return;
  const cn=String(e.cn).trim();
  if(!cn||cn===w.han||seen.has(cn))return;
  seen.add(cn);
  out.push({cn,pin:fmt(e.pin||''),vi:String(e.vi).trim(),sense:String(e.sense||''),meaning:String(e.meaning||''),id:e.id||'',fromCorpus});
 };
 for(const e of w.practice?.examples||[])add(e);
 for(const e of w.examples||[])add(e);
 if(w.dictionary?.example)add(w.dictionary.example);
 if(w.exCn&&w.exVi)add({cn:w.exCn,pin:w.originalExampleMetadata?.pin||'',vi:w.exVi,meaning:w.originalExampleMetadata?.meaning||''});
 const cacheKey=`${w.han}|${window.HSKOpenDictionaryCore?.reading?window.HSKOpenDictionaryCore.reading(w.pin||''):(w.pin||'')}`;
 const cached=readSenseExCache()[cacheKey];
 if(cached?.examples)for(const e of cached.examples)add(e);
 if(out.length<12){
  const candidates=[];
  for(const s of getCorpusSentenceBank()){
   if(s.cn.includes(w.han)&&!seen.has(s.cn))candidates.push(s);
   if(candidates.length>=28)break;
  }
  candidates.sort((a,b)=>Math.abs(a.cn.length-16)-Math.abs(b.cn.length-16));
  for(const c of candidates.slice(0,Math.max(0,12-out.length)))add(c,true);
 }
 return out.slice(0,12);
}
function groupedSearchSenses(w){
 const uRows=typeof usageFactsData!=='undefined'?usageFactsData.words?.[w.han]?.variants||[]:[];
 const matchedVar=uRows.find(v=>typeof usageReading==='function'&&usageReading(v.pin)===usageReading(w.pin))||uRows[0];
 const structures=Array.isArray(matchedVar?.structures)?matchedVar.structures.slice(0,3):(Array.isArray(w.structures)?w.structures.slice(0,3):[]);
 if(w.posSenses?.length){
  const merged=new Map();
  for(const g of w.posSenses){
   const label=searchPosLabel(g.pos);
   if(!merged.has(label))merged.set(label,[]);
   const bucket=merged.get(label);
   const parts=Array.isArray(g.items)&&g.items.length?g.items:splitSenses({mean:g.mean,hv:''});
   for(const p of parts){
    const norm=viText(coreSenseText(p));
    const dupIdx=bucket.findIndex(x=>viText(coreSenseText(x))===norm);
    if(dupIdx<0)bucket.push(p);
    else if(p.length>bucket[dupIdx].length)bucket[dupIdx]=p;
   }
  }
  return [...merged.entries()].map(([pos,items],idx)=>({
   pos,
   mean:items.join('; '),
   items:items.slice(0,6),
   structures:idx===0?structures:[]
  }));
 }
 const groups=new Map();
 if(matchedVar?.senses?.length){
  for(const s of matchedVar.senses){
   if(s.pos==='Lưu ý')continue;
   const label=searchPosLabel(s.pos);
   if(!groups.has(label))groups.set(label,[]);
   if(s.mean&&!groups.get(label).includes(s.mean))groups.get(label).push(s.mean);
  }
 }
 if(!groups.size&&w.dictionary?.meanings?.length){
  for(const m of w.dictionary.meanings){
   const label=searchPosLabel(m.pos)||m.pos||'Nghĩa';
   if(!groups.has(label))groups.set(label,[]);
   if(m.gloss&&!groups.get(label).includes(m.gloss))groups.get(label).push(m.gloss);
  }
 }
 if(!groups.size){
  const baseItems=splitSenses({mean:w.primaryMean||w.mean,hv:w.hv}).slice(0,5);
  return [{pos:'Nghĩa chính',mean:w.mean,items:baseItems.length?baseItems:[w.mean],structures}];
 }
 const out=[...groups.entries()].map(([pos,items],idx)=>({pos,mean:items.join('; '),items:items.slice(0,6),structures:idx===0?structures:[]}));
 if(w.primaryMean){
  const covered=out.flatMap(g=>g.items.flatMap(it=>splitSenses({mean:it,hv:''}))).map(s=>viText(coreSenseText(s)));
  const missing=splitSenses({mean:w.primaryMean,hv:w.hv}).filter(s=>!covered.includes(viText(coreSenseText(s))));
  if(missing.length)out.unshift({pos:'Nghĩa thông dụng',mean:missing.join('; '),items:missing,structures:[]});
 }
 return out;
}
function matchExamplesToPosSenses(sensesList,examples){
 const slots=[];
 sensesList.forEach((g,gIdx)=>{
  const items=Array.isArray(g.items)&&g.items.length?g.items:[g.mean];
  items.forEach((text,iIdx)=>{
   const id=`s_${gIdx}_${iIdx}`;
   const norm=viText(coreSenseText(text));
   const toks=norm.split(' ').filter(t=>t.length>=2);
   slots.push({id,gIdx,iIdx,text,norm,toks,examples:[]});
  });
 });
 if(!slots.length||!examples.length)return slots;
 const unassigned=[];
 for(const ex of examples){
  if(ex.id){
   const byId=slots.find(sl=>sl.id===ex.id);
   if(byId&&byId.examples.length<2){byId.examples.push(ex);continue;}
  }
  const tagNorm=viText(coreSenseText(ex.meaning||ex.sense||''));
  const viNorm=viText(ex.vi||'');
  let best=null,bestScore=0;
  for(const sl of slots){
   if(sl.examples.length>=2)continue;
   let sc=0;
   if(tagNorm){
    if(sl.norm===tagNorm||sl.text.split(/[;；,]/).some(p=>viText(coreSenseText(p))===tagNorm))sc=120;
    else if(phraseIn(sl.norm,tagNorm)||phraseIn(tagNorm,sl.norm))sc=90;
   }
   if(!sc&&viNorm){
    if(sl.norm.length>=2&&phraseIn(viNorm,sl.norm))sc=65;
    else{
     const hits=sl.toks.filter(t=>phraseIn(viNorm,t)).length;
     if(hits>0)sc=hits*24;
    }
   }
   if(sc>bestScore){bestScore=sc;best=sl;}
  }
  if(best&&bestScore>=24)best.examples.push(ex);
  else unassigned.push(ex);
 }
 for(const ex of unassigned){
  if(slots.length===1){
   if(slots[0].examples.length<2)slots[0].examples.push(ex);
  }else if(slots[0]&&slots[0].examples.length===0){
   slots[0].examples.push(ex);
  }
 }
 return slots;
}
function makeExampleCardNode(ex,targetHan){
 const exCard=document.createElement('div');exCard.className='search-example-item';
 const exContent=document.createElement('div');exContent.className='search-example-content';
 const exCn=document.createElement('p');exCn.className='search-example-cn';
 const cnStr=String(ex.cn||''),hanStr=String(targetHan||'').trim();
 if(hanStr&&cnStr.includes(hanStr)){
  const parts=cnStr.split(hanStr);
  parts.forEach((part,idx)=>{
   if(part)exCn.append(document.createTextNode(part));
   if(idx<parts.length-1){
    const hl=document.createElement('mark');hl.className='search-example-hl';hl.textContent=hanStr;
    exCn.append(hl);
   }
  });
 }else{
  exCn.textContent=cnStr;
 }
 exContent.append(exCn);
 if(ex.pin){
  const p=pinyinLine(window.HSKOpenDictionaryCore?.formatPinyin?window.HSKOpenDictionaryCore.formatPinyin(ex.pin):ex.pin);
  exContent.append(p);
 }
 const exVi=document.createElement('p');exVi.className='search-example-vi';exVi.textContent=ex.vi||'';
 exContent.append(exVi);
 exCard.append(exContent);
 const exSpeech=window.HSKSpeech?.button(cnStr,'Nghe câu ví dụ');if(exSpeech)exCard.append(exSpeech);
 return exCard;
}
function renderPosAccordions(accStack,w,detailsObj=null,opts={}){
 const sensesList=detailsObj?.posSenses?.length?detailsObj.posSenses:groupedSearchSenses(w);
 const examples=detailsObj?.examples?.length?detailsObj.examples:collectWordExamples(w);
 const slots=matchExamplesToPosSenses(sensesList,examples);
 sensesList.forEach((item,sIdx)=>{
  const acc=document.createElement('details');acc.className='search-acc-card is-pos';
  if(sIdx===0||sIdx===1)acc.open=true;
  const sum=document.createElement('summary');sum.className='search-acc-summary';
  const arrow=document.createElement('span');arrow.className='search-acc-arrow';arrow.setAttribute('aria-hidden','true');
  const title=document.createElement('span');title.className='search-acc-title';title.textContent=item.pos;
  const groupSlots=slots.filter(sl=>sl.gIdx===sIdx);
  const count=document.createElement('span');count.className='search-acc-count';count.textContent=String(Math.max(1,groupSlots.length));
  sum.append(arrow,title,count);acc.append(sum);
  const accBody=document.createElement('div');accBody.className='search-acc-body';
  if(sIdx===0&&opts.hiddenMeaningMeta){
   const rowMeaning=document.createElement('span');rowMeaning.className='dictionary-row-meaning';
   rowMeaning.textContent=opts.hiddenMeaningMeta.text;
   rowMeaning.dataset.viKey=opts.hiddenMeaningMeta.key;
   rowMeaning.__dictionaryWord=opts.hiddenMeaningMeta.word;
   rowMeaning.hidden=true;
   accBody.append(rowMeaning);
  }
  if(item.structures?.length){
   const st=document.createElement('p');st.className='search-structure-note';
   st.textContent='Cấu trúc: '+item.structures.join(' · ');
   accBody.append(st);
  }
  const senseListEl=document.createElement('div');senseListEl.className='search-sense-blocks';
  groupSlots.forEach((sl,idx)=>{
   const block=document.createElement('div');block.className='search-sense-block';
   const head=document.createElement('p');head.className='search-sense-heading search-acc-senses-inline';
   const num=document.createElement('span');num.className='search-sense-num';num.setAttribute('aria-hidden','true');num.textContent=`${idx+1}.`;
   const txt=document.createElement('span');txt.className='search-sense-label';txt.textContent=sl.text;
   head.append(num,txt);
   block.append(head);
   const exHost=document.createElement('div');exHost.className='search-example-list search-sense-examples';
   exHost.dataset.senseSlot=sl.id;
   exHost.dataset.sensePos=item.pos;
   exHost.dataset.senseMean=sl.text;
   for(const ex of sl.examples)exHost.append(makeExampleCardNode(ex,w.han));
   if(!sl.examples.length)exHost.hidden=true;
   block.append(exHost);
   senseListEl.append(block);
  });
  accBody.append(senseListEl);
  acc.append(accBody);
  accStack.append(acc);
 });
}
async function ensureWordSenseExamples(w,cardRoot){
 if(!w||!w.han||!cardRoot)return;
 const user=window.HSKAccountDashboard?.user;
 if(!user)return;
 const emptySlots=[...cardRoot.querySelectorAll('[data-sense-slot]')].filter(el=>!el.children.length&&el.dataset.senseMean&&!el.dataset.senseMean.includes('Chưa có nghĩa Việt')&&!el.dataset.senseMean.includes('Đang tải nghĩa Việt'));
 if(!emptySlots.length)return;
 const senses=emptySlots.slice(0,5).map(el=>({id:el.dataset.senseSlot,pos:String(el.dataset.sensePos||'Nghĩa').slice(0,40),mean:String(el.dataset.senseMean||'').slice(0,220)}));
 let cfg=null;try{cfg=await window.HSKAIConfig?.loadTranslationConfig?.();}catch(_){}
 if(!cfg?.endpoint)return;
 senseExAbort?.abort();
 const ac=new AbortController();senseExAbort=ac;
 const timer=setTimeout(()=>ac.abort(),20000);
 try{
  const token=await user.getIdToken();
  if(ac.signal.aborted||!cardRoot.isConnected)return;
  const r=await fetch(cfg.endpoint.replace(/\/translate$/,'/dictionary-examples'),{
   method:'POST',
   headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},
   body:JSON.stringify({han:w.han,pinyin:w.pin||'',senses}),
   signal:ac.signal
  });
  if(!r.ok||ac.signal.aborted||!cardRoot.isConnected)return;
  const data=await r.json();
  if(!Array.isArray(data?.examples)||!data.examples.length)return;
  const valid=data.examples.filter(e=>e&&typeof e.id==='string'&&typeof e.cn==='string'&&e.cn.includes(w.han)&&typeof e.vi==='string'&&e.vi.trim());
  if(!valid.length)return;
  const cacheKey=`${w.han}|${window.HSKOpenDictionaryCore?.reading?window.HSKOpenDictionaryCore.reading(w.pin||''):(w.pin||'')}`;
  const existing=readSenseExCache()[cacheKey]?.examples||[];
  const merged=[...existing];
  for(const e of valid)if(!merged.some(x=>x.cn===e.cn))merged.push(e);
  saveSenseExCache(cacheKey,merged.slice(0,8));
  if(!cardRoot.isConnected)return;
  for(const e of valid){
   const slot=cardRoot.querySelector(`[data-sense-slot="${e.id}"]`);
   if(slot&&!slot.children.length){
    slot.hidden=false;
    slot.append(makeExampleCardNode(e,w.han));
   }
  }
 }catch(_){}finally{
  clearTimeout(timer);
  if(senseExAbort===ac)senseExAbort=null;
 }
}
function filterSearchMatches(matches,rawQuery,foldCompounds){
 const base=foldCompounds?matches.filter(r=>r.tier>=2):matches;
 if(searchIntentFilter==='all')return base;
 const R=window.HSKSearchRanking;
 if(searchIntentFilter==='compounds')return matches.filter(r=>r.tier<2);
 if(searchIntentFilter==='hsk')return base.filter(r=>!r.w.isExtended);
 if(searchIntentFilter==='vi')return base.filter(r=>r.hasVi);
 if(searchIntentFilter==='pinyin')return base.filter(r=>r.hasPinyin);
 if(searchIntentFilter==='frequent')return matches.filter(r=>(R?.hitCount(rawQuery,r.w)?.total||0)>0);
 return base;
}
const charCompoundCache=new Map();
function compoundsContainingHan(han,limit=12){
 const key=String(han||'').trim();
 if(!key||!/[\u3400-\u9fff]/.test(key))return [];
 if(charCompoundCache.has(key))return charCompoundCache.get(key).slice(0,limit);
 const R=window.HSKSearchRanking,seen=new Set([key]),found=[];
 for(const w of words){
  if(w.han.length>key.length&&w.han.includes(key)&&!seen.has(w.han)){
   seen.add(w.han);found.push({w,rank:R?R.commonality(w):0});
  }
 }
 if(typeof usageFactsData!=='undefined'&&usageFactsData?.words){
  for(const [h,entry] of Object.entries(usageFactsData.words)){
   if(h.length>key.length&&h.includes(key)&&!seen.has(h)&&entry?.variants?.[0]?.senses?.[0]?.mean){
    seen.add(h);
    const v=entry.variants[0];
    const w={han:h,pin:v.pin||'',mean:v.senses.map(s=>s.mean).filter(Boolean).join('; '),hsk:null,isExtended:true};
    found.push({w,rank:R?R.commonality(w):0});
   }
  }
 }
 found.sort((a,b)=>b.rank-a.rank||a.w.han.length-b.w.han.length);
 const top=found.slice(0,24);
 if(charCompoundCache.size>60)charCompoundCache.delete(charCompoundCache.keys().next().value);
 charCompoundCache.set(key,top);
 return top.slice(0,limit);
}
function lookupSingleCharMeta(ch,w=null){
 const exactHsk=words.find(x=>x.han===ch);
 const uEntry=typeof usageFactsData!=='undefined'?usageFactsData.words?.[ch]?.variants||[]:[];
 const pins=[...new Set([exactHsk?.pin,...uEntry.map(v=>v.pin)].filter(Boolean))].slice(0,3);
 if(!pins.length&&w?.han&&w?.pin){
  const hanChars=Array.from(String(w.han)).filter(c=>/[\u3400-\u9fff]/.test(c));
  const pinParts=String(w.pinDisplay||w.pin).trim().split(/\s+/).filter(Boolean);
  const pos=hanChars.indexOf(ch);
  if(pos>=0&&pinParts.length===hanChars.length)pins.push(pinParts[pos]);
 }
 const mean=exactHsk?.primaryMean||exactHsk?.mean||uEntry[0]?.senses?.[0]?.mean||'';
 return {pin:pins.join(', '),hv:exactHsk?.hv||'',mean:String(mean).split(/[;；\n]/)[0].trim()};
}
let searchCharRenderSerial=0;
function renderSearchCharPanel(panel,w){
 panel.replaceChildren();
 const chars=[...new Set(Array.from(String(w?.han||'')).filter(c=>/[\u3400-\u9fff]/.test(c)))];
 if(!chars.length){panel.hidden=true;return;}
 panel.hidden=false;
 const tabs=document.createElement('div');tabs.className='search-char-tabs';tabs.setAttribute('role','tablist');
 const stageWrap=document.createElement('div');stageWrap.className='search-char-stage-wrap';
 const stage=document.createElement('div');stage.className='search-char-stage';stage.setAttribute('aria-label','Khung nét chữ Hán');
 const replayBtn=document.createElement('button');replayBtn.type='button';replayBtn.className='search-char-replay';replayBtn.textContent='↻';replayBtn.title='Xem lại thứ tự nét';replayBtn.setAttribute('aria-label','Xem lại thứ tự nét');
 stageWrap.append(stage,replayBtn);
 const metaBox=document.createElement('div');metaBox.className='search-char-meta';
 const practiceBtn=document.createElement('button');practiceBtn.type='button';practiceBtn.className='search-char-practice-btn';practiceBtn.textContent='Tập viết';
 practiceBtn.onclick=()=>window.HSKWritingPractice?.open?.(w.han);
 panel.append(tabs,stageWrap,metaBox,practiceBtn);

 let activeWriter=null;
 const selectChar=async ch=>{
  const token=++searchCharRenderSerial;
  activeWriter?.pauseAnimation?.();activeWriter=null;
  for(const b of tabs.children){const on=b.dataset.char===ch;b.classList.toggle('is-active',on);b.setAttribute('aria-selected',on?'true':'false');}
  stage.replaceChildren();
  const fallback=document.createElement('span');fallback.className='search-char-fallback';fallback.textContent=ch;
  stage.append(fallback);
  const info=lookupSingleCharMeta(ch,w);
  metaBox.replaceChildren();
  const pinRow=document.createElement('div');pinRow.className='search-char-row';
  const pinLabel=document.createElement('span');pinLabel.className='search-char-label';pinLabel.textContent='Bính âm:';
  const pinVal=document.createElement('strong');pinVal.textContent=info.pin||'—';
  pinRow.append(pinLabel,pinVal);
  const chSpeech=window.HSKSpeech?.button(ch,'Nghe phát âm '+ch);
  if(chSpeech){chSpeech.classList.add('search-char-speech');pinRow.append(chSpeech);}
  metaBox.append(pinRow);
  if(info.hv){
   const hvRow=document.createElement('div');hvRow.className='search-char-row';
   const hvL=document.createElement('span');hvL.className='search-char-label';hvL.textContent='Hán-Việt:';
   const hvV=document.createElement('strong');hvV.textContent=info.hv.toUpperCase();
   hvRow.append(hvL,hvV);metaBox.append(hvRow);
  }
  const strokeRow=document.createElement('div');strokeRow.className='search-char-row';
  const stL=document.createElement('span');stL.className='search-char-label';stL.textContent='Số nét:';
  const stV=document.createElement('strong');stV.textContent='…';
  strokeRow.append(stL,stV);metaBox.append(strokeRow);
  if(info.mean){
   const mRow=document.createElement('div');mRow.className='search-char-row is-mean';
   const mL=document.createElement('span');mL.className='search-char-label';mL.textContent='Nghĩa chữ:';
   const mV=document.createElement('span');mV.textContent=info.mean;
   mRow.append(mL,mV);metaBox.append(mRow);
  }
  replayBtn.hidden=true;
  if(typeof window.HanziWriter==='undefined'||typeof window.HSKWritingPractice?.characterData!=='function'){stV.textContent='—';return;}
  try{
   const data=await window.HSKWritingPractice.characterData(ch);
   if(token!==searchCharRenderSerial)return;
   stV.textContent=`${data.strokes.length} nét`;
   stage.replaceChildren();
   const rootCss=getComputedStyle(document.documentElement);
   const isDark=document.documentElement.dataset.theme==='dark';
   const hexOr=(v,fb)=>/^#[0-9a-f]{3,8}$/i.test(String(v||'').trim())?String(v).trim():fb;
   const strokeColor=hexOr(rootCss.getPropertyValue('--ink'),isDark?'#c9c9de':'#3a3a57');
   const radicalColor=hexOr(rootCss.getPropertyValue('--accent'),isDark?'#a78bfa':'#5b4ef0');
   const outlineColor=hexOr(rootCss.getPropertyValue('--line-dark'),isDark?'#334155':'#cbd5e1');
   activeWriter=window.HanziWriter.create(stage,ch,{width:176,height:176,padding:12,showCharacter:true,showOutline:true,strokeColor,radicalColor,outlineColor,strokeAnimationSpeed:1.15,delayBetweenStrokes:180,charDataLoader:()=>data});
   replayBtn.hidden=false;
   replayBtn.onclick=()=>{activeWriter?.animateCharacter?.();};
  }catch(_){
   if(token===searchCharRenderSerial)stV.textContent='—';
  }
 };
 for(const ch of chars){
  const tab=document.createElement('button');tab.type='button';tab.className='search-char-tab';tab.dataset.char=ch;tab.setAttribute('role','tab');tab.textContent=ch;
  tab.onclick=()=>selectChar(ch);
  tabs.append(tab);
 }
 selectChar(chars[0]);
}
function buildRelationAccordion(w,title,list,cls){
 if(!list?.length)return null;
 const acc=document.createElement('details');acc.className=`search-acc-card ${cls}`;
 const sum=document.createElement('summary');sum.className='search-acc-summary';
 const arrow=document.createElement('span');arrow.className='search-acc-arrow';arrow.setAttribute('aria-hidden','true');
 const label=document.createElement('span');label.className='search-acc-title';label.textContent=title;
 const count=document.createElement('span');count.className='search-acc-count';count.textContent=String(list.length);
 sum.append(arrow,label,count);acc.append(sum);
 const body=document.createElement('div');body.className='search-acc-body';
 const grid=document.createElement('div');grid.className='relation-list search-rel-chips';
 const detail=document.createElement('section');detail.className='relation-pair';detail.hidden=true;
 let selected=null;
 for(const item of list){
  const entry=document.createElement('button');entry.type='button';entry.className='relation-word search-compound-chip';entry.setAttribute('aria-expanded','false');
  const h=document.createElement('strong');h.textContent=item.han;
  const p=document.createElement('span');p.textContent=item.pin||item.mean||'';
  entry.append(h,p);
  entry.onclick=()=>{
   const hide=selected===entry;
   for(const b of grid.querySelectorAll('.relation-word'))b.setAttribute('aria-expanded','false');
   selected=hide?null:entry;
   detail.replaceChildren();detail.hidden=hide;
   if(hide)return;
   entry.setAttribute('aria-expanded','true');
   const h5=document.createElement('h5');h5.textContent=`${w.han} ↔ ${item.han}`;
   detail.append(h5,allPairExplanation(w,item));
  };
  grid.append(entry);
 }
 body.append(grid,detail);acc.append(body);
 return acc;
}
function renderSearch() {
 const general=searchScope==='general';$('searchResults').hidden=general;$('searchSummary').hidden=general;
 $('searchResults').replaceChildren(); const rawQuery=$('searchInput').value.trim(),q=fold(rawQuery);
 const R=window.HSKSearchRanking;
 const foldCompounds=shouldFoldSearchCompounds(searchMatches,rawQuery);
 const headMatches=foldCompounds?searchMatches.filter(r=>r.tier>=2):searchMatches;
 const compoundCount=foldCompounds?searchMatches.length-headMatches.length:0;
 const hskCount=headMatches.filter(r=>!r.w.isExtended).length, extCount=headMatches.length-hskCount;
 const viCount=headMatches.filter(r=>r.hasVi).length, pinCount=headMatches.filter(r=>r.hasPinyin).length;
 const freqCount=R?searchMatches.filter(r=>(R.hitCount(rawQuery,r.w)?.total||0)>0).length:0;
 const filteredMatches=filterSearchMatches(searchMatches,rawQuery,foldCompounds);
 if(searchIntentFilter!=='all'&&!filteredMatches.length){searchIntentFilter='all';}
 const activeMatches=filterSearchMatches(searchMatches,rawQuery,foldCompounds);
 const summaryEl=$('searchSummary');summaryEl.replaceChildren();
 if(handwritingSearchCharacter){
  summaryEl.textContent=searchMatches.length?`Chứa chữ ${handwritingSearchCharacter} · ${searchMatches.length} kết quả`:`Chưa thấy từ chứa ${handwritingSearchCharacter}. Thử đổi bộ lọc hoặc vẽ lại.`;
 }else if(q){
  const summaryText=document.createElement('span');
  summaryText.textContent=activeMatches.length?`${activeMatches.length} ${foldCompounds&&searchIntentFilter==='all'?'từ gốc':'kết quả'}${searchIntentFilter==='all'&&!foldCompounds&&extCount?` (${hskCount} HSK · ${extCount} mở rộng)`:''}${visibleResults<activeMatches.length?' · Đang hiện '+visibleResults:''}${!general&&activeLevel!=='all'?` trong HSK ${activeLevel}`:''}`:(activeLevel!=='all'&&!general?`Chưa tìm thấy trong HSK ${activeLevel}.`:'Chưa tìm thấy. Thử từ ngắn hơn hoặc đổi cách diễn đạt.');
  summaryEl.append(summaryText);
  if(!general&&searchMatches.length>1){
   const chips=[];
   if(foldCompounds&&compoundCount>0)chips.push(['compounds',`Từ ghép cụ thể (${compoundCount})`]);
   if(hskCount>0&&extCount>0)chips.push(['hsk',`HSK (${hskCount})`]);
   if(viCount>0&&viCount<headMatches.length)chips.push(['vi',`Nghĩa Việt (${viCount})`]);
   if(pinCount>0&&pinCount<headMatches.length)chips.push(['pinyin',`Pinyin (${pinCount})`]);
   if(freqCount>0)chips.push(['frequent',`Hay tra (${freqCount})`]);
   if(chips.length){
    const bar=document.createElement('div');bar.className='search-intent-filters';bar.setAttribute('role','group');bar.setAttribute('aria-label','Lọc kết quả theo ý định tra cứu');
    const firstLabel=foldCompounds?`Từ gốc (${headMatches.length})`:`Tất cả (${searchMatches.length})`;
    for(const [id,label] of [['all',firstLabel],...chips]){
     const chip=document.createElement('button');chip.type='button';chip.className='search-intent-chip';chip.dataset.searchIntent=id;
     chip.setAttribute('aria-pressed',String(searchIntentFilter===id));chip.textContent=label;
     chip.onclick=()=>{searchIntentFilter=id;visibleResults=40;renderSearch();};
     bar.append(chip);
    }
    summaryEl.append(bar);
   }
  }
  if(!general&&activeLevel!=='all'){
   const widen=document.createElement('button');widen.type='button';widen.className='search-scope-reset';widen.textContent='Tìm tất cả HSK 1–6';
   widen.onclick=()=>document.querySelector('[data-filter="all"]')?.click();
   summaryEl.append(widen);
  }
 }
 const shown=activeMatches.slice(0,visibleResults), multi=shown.length>1;
 $('searchResults').classList.toggle('has-master-detail',shown.length>0);
 if(!shown.length){
  $('searchMore').hidden=true;
  const submitted=searchExplicit;searchExplicit=false;window.dispatchEvent(new CustomEvent('hsk-search-rendered',{detail:{submitted}}));
  return;
 }
 const mainCol=document.createElement('div');mainCol.className='search-main-col';
 const charPanel=document.createElement('aside');charPanel.className='search-char-panel';charPanel.setAttribute('aria-label','Phân tích chữ Hán và nét viết');
 const candidateStrip=multi?document.createElement('div'):null;
 if(candidateStrip){candidateStrip.className='search-master-list search-candidate-strip';candidateStrip.setAttribute('role','listbox');candidateStrip.setAttribute('aria-label','Danh sách từ khớp');}
 const cardsCol=document.createElement('div');cardsCol.className='search-cards-col';
 const cards=[], masterItems=[];
 const selectIndex=(idx,record=false)=>{
  const activeMatch=shown[idx];
  if(!activeMatch)return;
  if(record&&rawQuery)R?.record(rawQuery,activeMatch.w);
  masterItems.forEach((b,bi)=>{const on=bi===idx;b.classList.toggle('is-active',on);b.setAttribute('aria-selected',on?'true':'false');});
  cards.forEach((c,ci)=>{const on=ci===idx;c.classList.toggle('is-selected',on);c.open=on;});
  renderSearchCharPanel(charPanel,activeMatch.w);
  if(cards[idx])ensureWordSenseExamples(activeMatch.w,cards[idx]);
 };
 shown.forEach((match,idx)=>{
  const {w}=match;
  const formattedPin=window.HSKOpenDictionaryCore?.formatPinyin?window.HSKOpenDictionaryCore.formatPinyin(w.pinDisplay||w.pin||''):(w.pinDisplay||w.pin||'');
  if(candidateStrip){
   const item=document.createElement('button');item.type='button';item.className='search-master-item'+(idx===0?' is-active':'');
   item.setAttribute('role','option');item.setAttribute('aria-selected',idx===0?'true':'false');
   const mHan=document.createElement('strong');mHan.className='search-master-han';mHan.textContent=w.han;
   const mPin=document.createElement('span');mPin.className='search-master-pin';mPin.textContent=formattedPin;
   item.append(mHan,mPin);
   item.onclick=()=>selectIndex(idx,true);
   masterItems.push(item);candidateStrip.append(item);
  }
  const card=document.createElement('details');card.className='result-card dictionary-row search-hanzii-card'+(w.isExtended?' is-extended-result':'')+(idx===0?' is-selected':'');
  if(idx===0)card.open=true;
  const summary=document.createElement('summary');summary.className='dictionary-row-summary search-hero-summary';
  const heroHead=document.createElement('div');heroHead.className='search-hero-head';
  const han=document.createElement('span');han.className='result-open dictionary-row-han';han.textContent=w.han;
  heroHead.append(han);
  if(!w.isExtended){
   const verified=document.createElement('span');verified.className='search-hero-verified';verified.title='Từ vựng chuẩn HSK';verified.textContent='✓';
   heroHead.append(verified);
  }
  const phonetic=document.createElement('div');phonetic.className='search-hero-phonetic';
  const pin=document.createElement('span');pin.className='dictionary-row-pinyin';pin.textContent=formattedPin?`[${formattedPin}]`:'';
  phonetic.append(pin);
  if(w.hv){
   const hvSpan=document.createElement('span');hvSpan.className='search-detail-hv';hvSpan.textContent=`[${w.hv.toUpperCase()}]`;
   phonetic.append(hvSpan);
  }
  summary.append(heroHead,phonetic);card.append(summary);

  const body=document.createElement('div');body.className='dictionary-row-body search-detail-body';
  const heroMeta=document.createElement('div');heroMeta.className='search-detail-toolbar search-hero-meta';
  const leftMeta=document.createElement('div');leftMeta.className='search-detail-left';
  const lvlLabel=document.createElement('span');lvlLabel.className='search-level-label';lvlLabel.textContent='Cấp độ:';
  const badge=document.createElement('span');badge.className=w.hsk?`hsk-tag hsk${w.hsk}-tag search-row-badge`:'hsk-tag search-row-badge is-extended';badge.textContent=w.hsk?`HSK ${w.hsk}`:'Mở rộng';
  leftMeta.append(lvlLabel,badge);
  if(!w.isExtended)leftMeta.append(makeMasteryTools(w));

  const actions=document.createElement('div');actions.className='search-detail-actions';
  const speech=window.HSKSpeech?.button(w.han,'Nghe phát âm '+w.han);if(speech)actions.append(speech);
  if(!w.isExtended){
   const open=document.createElement('button');open.type='button';open.textContent='Mở thẻ HSK';open.onclick=()=>{if(rawQuery)R?.record(rawQuery,w);if(activeLevel!=='all'&&String(w.hsk)!==activeLevel)document.querySelector('[data-filter="'+w.hsk+'"]').click();$('masteryFilter').value='all';rebuildDeck(w);switchMode('learn');$('flashcard').focus();};actions.append(open);
  }
  const notebook=window.HSKNotebook?.button(()=>w);if(notebook)actions.append(notebook);
  heroMeta.append(leftMeta,actions);
  body.append(heroMeta);

  const accStack=document.createElement('div');accStack.className='search-acc-stack';
  renderPosAccordions(accStack,w);
  if(idx===0)setTimeout(()=>ensureWordSenseExamples(w,card),0);

  // Compounds accordion ("▸ Từ ghép (N)") — merges folded query compounds + words containing this Hanzi.
  const mergedCompounds=[], compSeen=new Set([w.han]);
  if(foldCompounds&&match.tier>=2){
   const relComp=relatedCompoundsFor(match,searchMatches,10);
   for(const c of relComp.items){if(!compSeen.has(c.w.han)){compSeen.add(c.w.han);mergedCompounds.push(c.w);}}
  }
  for(const c of compoundsContainingHan(w.han,12)){if(!compSeen.has(c.w.han)){compSeen.add(c.w.han);mergedCompounds.push(c.w);}}
  if(mergedCompounds.length){
   const compAcc=document.createElement('details');compAcc.className='search-acc-card is-compounds';
   const sum=document.createElement('summary');sum.className='search-acc-summary';
   const arrow=document.createElement('span');arrow.className='search-acc-arrow';arrow.setAttribute('aria-hidden','true');
   const title=document.createElement('span');title.className='search-acc-title';title.textContent='Từ ghép';
   const count=document.createElement('span');count.className='search-acc-count';count.textContent=String(foldCompounds&&compoundCount>mergedCompounds.length?compoundCount:mergedCompounds.length);
   sum.append(arrow,title,count);compAcc.append(sum);
   const compBody=document.createElement('div');compBody.className='search-acc-body';
   const compList=document.createElement('div');compList.className='search-compound-list';
   for(const cw of mergedCompounds.slice(0,12)){
    const chip=document.createElement('button');chip.type='button';chip.className='search-compound-chip';
    const cHan=document.createElement('strong');cHan.textContent=cw.han;
    const cMean=document.createElement('span');cMean.textContent=cw.mean.split(/[;；\n]/)[0].trim();
    chip.append(cHan,cMean);
    chip.onclick=()=>{if(rawQuery)R?.record(rawQuery,cw);$('searchInput').value=cw.han;searchExplicit=true;runSearch();};
    compList.append(chip);
   }
   compBody.append(compList);
   if(foldCompounds&&compoundCount>mergedCompounds.length){
    const moreBtn=document.createElement('button');moreBtn.type='button';moreBtn.className='search-related-all';moreBtn.textContent=`Xem tất cả từ ghép (${compoundCount})`;
    moreBtn.onclick=()=>{searchIntentFilter='compounds';visibleResults=40;renderSearch();};
    compBody.append(moreBtn);
   }
   compAcc.append(compBody);
   accStack.append(compAcc);
  }

  const relEntry=!w.isExtended?wordRelationsData?.entries?.[wordKey(w)]:null;
  const synAcc=buildRelationAccordion(w,'Từ cận nghĩa',relEntry?.synonyms,'is-synonyms');
  if(synAcc)accStack.append(synAcc);
  const antAcc=buildRelationAccordion(w,'Từ trái nghĩa',relEntry?.antonyms,'is-antonyms');
  if(antAcc)accStack.append(antAcc);

  body.append(accStack);
  card.append(body);
  card.addEventListener('toggle',()=>{
   if(card.classList.contains('is-selected')&&!card.open)card.open=true;
  });
  cards.push(card);
  cardsCol.append(card);
 });
 if(candidateStrip)mainCol.append(candidateStrip);
 mainCol.append(cardsCol);
 $('searchResults').append(mainCol,charPanel);
 renderSearchCharPanel(charPanel,shown[0].w);
 $('searchMore').hidden=general||visibleResults>=activeMatches.length;
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
 quizSession=null;question=null;$('quizWrongAI')?.remove();window.HSKWrongAnswerAI?.clearAll?.();$('quizPrompt').textContent='';$('quizOptions').replaceChildren();$('quizNext').hidden=true;$('quizProgress').textContent='';$('quizFeedback').textContent=message;
}
function createQuestion(w,direction,candidatePool=quizLevelWords()) {
 if(contextMode(direction))return createContextQuestion(w,direction,candidatePool);
 const senses=sensesMap.get(w);if(!senses.length)return null;
 const sense=randomItem(senses), label=direction==='han'?sense:w.han;
 const distractors=[], seen=new Set([exact(label)]);
 // Keep every answer within the selected HSK range, regardless of mastery filters.
 // Tier 1: the current filtered pool; tier 2: the same pool without length/status
 // assumptions; tier 3: the complete HSK level. This prevents a small lesson or
 // mastery filter from silently dropping a quiz item.
 const targetLevel=Number(w.hsk);
 const sameLevel=words.filter(candidate=>Number(candidate?.hsk)===targetLevel);
 const sameLength=pool=>pool.filter(candidate=>candidate?.han?.length===w.han.length);
 const pools=[sameLength(candidatePool),candidatePool,sameLength(sameLevel),sameLevel];
 for(const pool of pools)for(const candidate of shuffled(pool)) {
  if(distractors.length>=3)break;
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
 if(s.position>=s.pool.length){$('quizWrongAI')?.remove();window.HSKWrongAnswerAI?.clearAll?.();window.HSKLoading?.flash('Kết quả bài kiểm tra đang load...','Đang tổng hợp điểm số và cập nhật lịch ôn...',undefined,$('quizPanel'));$('quizProgress').textContent='Hoàn thành';$('quizPrompt').textContent=`${s.score} / ${s.pool.length} câu đúng`;$('quizOptions').replaceChildren();$('quizFeedback').textContent='Lịch ôn đã được cập nhật. Chọn Bắt đầu / Làm lại để tạo lượt mới.';$('quizNext').hidden=true;question=null;return;}
 if(s.position===0){const label=/^Ôn câu|^Ôn từ hay nhầm|^Làm lại câu|^Ôn trọng tâm/.test(s.levelLabel||'')?'Bài ôn câu sai đang load...':/^Phân biệt từ/.test(s.levelLabel||'')?'Bài luyện từ dễ nhầm đang load...':'Bài kiểm tra trắc nghiệm đang load...';window.HSKLoading?.flash(label,'Phạm vi: '+(s.levelLabel||'HSK'),undefined,$('quizPanel'));}
 const direction=s.plan?.[s.position]||(s.direction==='mixed'?randomItem(['han','mean']):s.direction);
 question=s.savedQuestions?{...s.savedQuestions[s.position],answered:false,options:shuffled(s.savedQuestions[s.position].options.map(option=>({...option})))}:createQuestion(s.pool[s.position],direction,s.candidates);
 $('quizWrongAI')?.remove();window.HSKWrongAnswerAI?.clearAll?.();$('quizOptions').replaceChildren();$('quizNext').hidden=true;$('quizFeedback').textContent='';
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
 if(!correct)window.HSKPracticeContext?.recordMistake?.({word:question.w,rule:question.item?.sense||question.direction,sampleSentence:question.item?.cn});
 review(question.w,correct?'good':'again');
 if(quizSession.lessonId)window.dispatchEvent(new CustomEvent('hsk-lesson-evidence',{detail:{id:quizSession.lessonId,key:wordKey(question.w),kind:'quiz',correct,time:Date.now()}}));
 const w=question.w;
 $('quizFeedback').textContent=`${correct?'✓ Chính xác!':'× Chưa đúng.'}\n${w.han} · ${w.pin}\nNghĩa: ${w.mean}\nÔn lại sau ${intervalLabel(recordOf(w).interval)}.`;
 if(question.item)$('quizFeedback').textContent+=`\n\nCâu đúng: ${question.item.cn}\n${question.item.pin}\n${question.item.vi}\n\nGiải thích: ${question.item.explanation}`;
 if(question.item && !correct && question.item.incorrectReasons?.[chosen.text])$('quizFeedback').textContent+=`\nLỗi ở đáp án bạn chọn: ${question.item.incorrectReasons[chosen.text]}`;
 $('quizWrongAI')?.remove();if(!correct&&window.HSKWrongAnswerAI){const aiHost=document.createElement('div');aiHost.id='quizWrongAI';aiHost.className='quiz-wrong-ai-host';$('quizNext').before(aiHost);const ci=question.options.findIndex(o=>o.correct);window.HSKWrongAnswerAI.mount(aiHost,()=>({id:'quiz-'+(w.id||w.han)+'-'+quizSession.position,hsk:w.hsk||1,title:(quizSession.levelLabel||'Trắc nghiệm từ vựng')+' · HSK '+(w.hsk||1),skill:'Từ vựng',prompt:$('quizPrompt').textContent||'',context:question.item?(question.item.cn+' ('+question.item.pin+') — '+question.item.vi):(w.han+' ('+w.pin+'): '+w.mean),userAnswer:String.fromCharCode(65+i)+'. '+chosen.text,correctAnswer:(ci>=0?String.fromCharCode(65+ci)+'. ':'')+(question.options[ci]?.text||''),options:question.options.map((opt,idx)=>({value:String.fromCharCode(65+idx),text:opt.text,isCorrect:Boolean(opt.correct),isSelected:idx===i,note:opt.w?(opt.w.han+' ('+opt.w.pin+'): '+opt.w.mean):(question.item?.incorrectReasons?.[opt.text]||'')})),explanation:$('quizFeedback').textContent||'',words:question.options.map(o=>o.w).filter(Boolean).map(ow=>({han:ow.han,pin:ow.pin,mean:ow.mean}))}));}
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
// Dictionary relations are maintained in the app's structured lexical graph.
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
   if(!r?.checked){panel.append(relationElement('p','Chưa có dữ liệu quan hệ từ cho mục này.','hint'));return;}
   panel.append(relationElement('p','Chọn một từ để xem giải thích.','hint'));
   if(!list.length)panel.append(relationElement('p',`Chưa có từ ${label.toLowerCase()} ghi nhận cho cách đọc này.`,'hint'));
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
     if(!isSyn)detail.append(relationElement('p','Đây là cặp quan hệ trái nghĩa theo từng sắc thái cụ thể. Đối chiếu đúng nghĩa trong câu; không mặc định mọi nghĩa của hai từ đều đối lập.','hint'));
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
 $('compareIntro').textContent='Các nhóm từ gần nghĩa nhưng khác cách dùng với phần giải thích và ví dụ tự biên soạn trong bộ học. Chọn Chữ gần giống để phân biệt hình dáng, nét viết.';

 const groups=shownCompareGroups(),count=groups.flatMap(g=>g.questions).filter(q=>activeLevel==='all'||String(wordByKey.get(q.key).hsk)===activeLevel).length;
 const memberCount=new Set(groups.flatMap(g=>g.members.filter(m=>activeLevel==='all'||String(m.level)===activeLevel).map(m=>m.key))).size;
 $('compareTitle').textContent=$('compareCategory').value==='other'?'Các cặp dễ lẫn khác':$('compareCategory').value==='all'?'Phân biệt cách dùng từ':'Từ gần nghĩa khác cách dùng';
 $('compareSummary').textContent=`${groups.length} nhóm · ${memberCount} từ · ${count} bài tập trong phạm vi HSK đang chọn. Giải thích biên soạn riêng cho người học Việt. Quan hệ đồng nghĩa / trái nghĩa: ${wordRelationsData.report.checked.toLocaleString('vi')} / ${words.length.toLocaleString('vi')} mục.`;$('compareStart').disabled=!count;$('compareGroups').replaceChildren();
 for(const g of groups) {
  const details=document.createElement('details');details.className='compare-lesson';details.dataset.group=g.id;details.append(textElement('summary',g.title),textElement('p',g.intro));
  for(const member of g.members){const box=textElement('div','', 'compare-member');box.append(textElement('strong',`${member.han} · ${member.pin} · HSK ${member.level}`),textElement('p',member.note));details.append(box);}
  details.append(textElement('p','Lưu ý: '+g.caution));
  for(const q of g.questions){const example=textElement('div','', 'compare-example');example.append(textElement('p',q.cn,'dictionary-cn'),pinyinLine(q.pin),textElement('p',q.vi));details.append(example);}
  details.append(textElement('p','Ví dụ, câu hỏi và giải thích được biên soạn riêng cho bộ học HSK.','hint'));
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
window.HSKDictionaryBridge={query:()=>handwritingSearchCharacter||$('searchInput').value,exact:q=>words.some(w=>w.han===q),lookupExact(han){const matches=words.filter(word=>word.han===han);const entries=new Map(matches.filter(word=>word.mean).map(word=>[word.pin+'|'+word.mean,word]));if(entries.size!==1)return null;const word=entries.values().next().value;return {han:word.han,pin:word.pin,mean:word.mean};},hsk:(han,trad)=>words.find(w=>w.han===han||w.han===trad)?.hsk||null,details(han,pin){const C=window.HSKOpenDictionaryCore,pool=[...words,...getExtendedSearchPool()];const w=pool.find(x=>x.han===han&&(!pin||!C?.sameReading||C.sameReading(x.pin,pin)))||pool.find(x=>x.han===han);if(!w)return null;return {hv:w.hv||'',posSenses:groupedSearchSenses(w),examples:collectWordExamples(w)};},examplesFor:(w)=>collectWordExamples(w),makeExampleCard:(ex,han)=>makeExampleCardNode(ex,han),renderPosAccordions:(accStack,w,detailsObj,opts)=>renderPosAccordions(accStack,w,detailsObj,opts),ensureSenseExamples:(w,root)=>ensureWordSenseExamples(w,root),relations(han,pin){const C=window.HSKOpenDictionaryCore;const w=words.find(x=>x.han===han&&(!pin||!C?.sameReading||C.sameReading(x.pin,pin)))||words.find(x=>x.han===han);if(!w)return null;const rel=typeof wordRelationsData!=='undefined'?wordRelationsData?.entries?.[wordKey(w)]:null;return rel&&(rel.synonyms?.length||rel.antonyms?.length)?{word:w,synonyms:rel.synonyms||[],antonyms:rel.antonyms||[]}:null;},relationAccordion:(w,title,list,cls)=>buildRelationAccordion(w,title,list,cls),compounds:(han,limit=12)=>compoundsContainingHan(han,limit),renderCharPanel:(panel,w)=>renderSearchCharPanel(panel,w),open(han,pin){const w=words.find(x=>x.han===han&&x.pin===pin)||words.find(x=>x.han===han);if(!w)return;if(activeLevel!=='all'&&String(w.hsk)!==activeLevel)document.querySelector('[data-filter="'+w.hsk+'"]').click();$('masteryFilter').value='all';rebuildDeck(w);switchMode('learn');},scope:()=>searchScope,results:()=>searchMatches.slice(),setScope(value){if(!['hsk','general'].includes(value))return;searchScope=value;document.querySelectorAll('[data-search-scope]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.searchScope===value)));$('dictionaryModeHint').textContent=value==='hsk'?'Ưu tiên từ vựng HSK.':'Tìm cả từ ngoài HSK.';runSearch();}};
document.querySelectorAll('[data-search-scope]').forEach(b=>b.onclick=()=>window.HSKDictionaryBridge.setScope(b.dataset.searchScope));
window.HSKFlashcardBridge={snapshot(){return {index,words:currentWords.map(w=>window.HSKPassiveCore?.word(w)).filter(Boolean)};},show(key){if(mode!=='learn')return false;const n=currentWords.findIndex(w=>wordKey(w)===key);if(n<0)return false;index=n;updateCard();return true;},reveal(){$('flashcard').classList.add('flipped');}};
// Shared read-only data bridge for zero-token client modules.  Keep this
// projection small so the sentence checker can rebuild its index whenever a
// newer vocabulary/usage bundle is loaded without coupling to app internals.
window.HSKVocabularyBridge={
 snapshot(){return words.map(w=>({han:w.han,pin:w.pin,hsk:w.hsk,mean:w.mean,exCn:w.exCn,exVi:w.exVi,entryKind:w.entryKind}));},
 facts(){return typeof usageFactsData!=='undefined'?usageFactsData:null;},
 relations(){return typeof wordRelationsData!=='undefined'?wordRelationsData:null;},
 version(){const report=typeof usageFactsData!=='undefined'?usageFactsData.report||{}:{};return `${words.length}:${report.checkedWords||0}:${report.targetedNotes||0}`;}
};
window.dispatchEvent(new Event('hsk-lessons-ready'));
// Mobile exit ends only the current quiz session; saved answers/SRS remain intact.
window.HSKMobileQuiz={exit(){resetQuiz('Đã thoát phiên. Các câu đã làm vẫn được giữ; chọn Bắt đầu để luyện lượt mới.');}};
