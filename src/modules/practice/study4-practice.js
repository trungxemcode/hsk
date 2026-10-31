/* Study4 HSK in-app exam & listening practice backed by synced Study4 test data. */
(function(){
 'use strict';
 const STORAGE_KEY='hsk-study4-progress-v1';
 const catalog={
  1:{id:'4905',title:'HSK 1 Practice test 1',url:'https://study4.com/tests/4905/hsk-1-practice-test-1/',minutes:35,listening:20,totalQuestions:40},
  2:{id:'4918',title:'HSK 2 Practice test 2',url:'https://study4.com/tests/4918/hsk-2-practice-test-2/',minutes:50,listening:35,totalQuestions:60},
  3:{id:'5048',title:'HSK 3 Practice test 34',url:'https://study4.com/tests/5048/hsk-3-practice-test-34/',minutes:85,listening:40,totalQuestions:80},
  4:{id:'6743',title:'HSK 4 Advanced test 1',url:'https://study4.com/tests/6743/hsk-4-advanced-test-1/',minutes:100,listening:45,totalQuestions:100},
  5:{id:'6753',title:'HSK 5 Advanced test 1',url:'https://study4.com/tests/6753/hsk-5-advanced-test-1/',minutes:120,listening:45,totalQuestions:100},
  6:{id:'6785',title:'HSK 6 Advanced test 4',url:'https://study4.com/tests/6785/hsk-6-advanced-test-4/',minutes:135,listening:50,totalQuestions:101}
 };
 const seedCatalog={...catalog};
 const CLOUD_MANIFESTS=[
  'https://hsk-exam-bank.trung-hsk668.workers.dev/v1/manifest',
  'https://pub-af2cf92bdb964826afb5fa13cb332892.r2.dev/study4/manifest.json'
 ];
 const CLOUD_REFRESH_MS=2*60*1000;
 const testsByLevel={1:[catalog[1]],2:[catalog[2]],3:[catalog[3]],4:[catalog[4]],5:[catalog[5]],6:[catalog[6]]};
 const testsById=new Map(Object.values(catalog).map(t=>[String(t.id),t]));
 let dataReady=false,dataError=null,activeSession=null,timerId=null,currentAudio=null;

 const host=document.querySelector('main.workspace');
 const panel=document.createElement('section');
 panel.id='study4PracticePanel';
 panel.className='panel study4-exam-panel';
 panel.dataset.studioHubPanel='study4';
 panel.hidden=true;
 panel.innerHTML=
  '<div class="s4-head"><h2>Luyện thi HSK</h2><p>Chọn luyện đề hoặc phần nghe theo cấp HSK.</p></div>'+
  '<div class="s4-controls">'+
   '<div class="s4-selects">'+
    '<label for="study4Level">Cấp độ <select id="study4Level"></select></label>'+
    '<select id="study4TestSelect" hidden aria-hidden="true" tabindex="-1"></select>'+
   '</div>'+
   '<div class="s4-tabs" role="group" aria-label="Phần thi">'+
    '<button type="button" data-s4-skill="test">Đề HSK</button>'+
    '<button type="button" data-s4-skill="listening">Bài nghe</button>'+
   '</div>'+
   '<div class="s4-exam-options" id="study4ExamOptions">'+
    '<div class="s4-exam-options-fields">'+
     '<label for="study4SkillSelect">Phần thi <select id="study4SkillSelect"></select></label>'+
     '<label for="study4KindSelect">Dạng bài <select id="study4KindSelect"></select></label>'+
     '<label for="study4DurationSelect">Thời gian làm bài <select id="study4DurationSelect"></select></label>'+
    '</div>'+
    '<p class="s4-exam-summary" id="study4ExamSummary" role="status"></p>'+
   '</div>'+
   '<section class="s4-test-picker" id="study4TestPicker" aria-label="Chọn bộ đề">'+
    '<div class="s4-picker-header"><strong>Chọn bộ đề</strong><span id="study4PickerCount"></span></div>'+
    '<label for="study4TestSearch" class="s4-picker-search-label">Tìm đề <input id="study4TestSearch" type="search" placeholder="Nhập số đề hoặc tên đề…" autocomplete="off" inputmode="search"></label>'+
    '<div class="s4-picker-grid" id="study4PickerGrid"></div>'+
    '<div class="s4-picker-pages"><button type="button" id="study4PickerPrev">← Trước</button><span id="study4PickerStatus" aria-live="polite"></span><button type="button" id="study4PickerNext">Tiếp →</button></div>'+
   '</section>'+
  '</div>'+
  '<div id="study4Results"></div>'+
  '<p class="s4-credit">Nguồn: <a href="https://study4.com/tests/" target="_blank" rel="noopener noreferrer">Study4.com</a></p>'+
  '<button type="button" class="s4-internal">Luyện theo dạng đề ngay trong HSK →</button>';
 host.append(panel);

 const controlsBox=panel.querySelector('.s4-controls');
 const level=panel.querySelector('#study4Level');
 const testSelect=panel.querySelector('#study4TestSelect');
 const skillSelect=panel.querySelector('#study4SkillSelect');
 const kindSelect=panel.querySelector('#study4KindSelect');
 const testSearch=panel.querySelector('#study4TestSearch');
 const pickerGrid=panel.querySelector('#study4PickerGrid');
 const pickerPrev=panel.querySelector('#study4PickerPrev');
 const pickerNext=panel.querySelector('#study4PickerNext');
 const pickerStatus=panel.querySelector('#study4PickerStatus');
 const pickerCount=panel.querySelector('#study4PickerCount');
 const durationSelect=panel.querySelector('#study4DurationSelect');
 const examSummary=panel.querySelector('#study4ExamSummary');
 const results=panel.querySelector('#study4Results');
 for(let n=1;n<=6;n++){const o=new Option('HSK '+n,String(n));level.add(o);}
 let skill='test',selectedTestId='',sectionFilter='all',durationCustomized=false,pickerPage=0;
 const PICKER_PAGE_SIZE=8;
 for(let minutes=5;minutes<=180;minutes+=5)durationSelect.add(new Option(minutes+' phút',String(minutes)));

 function el(tag,text,cls){
  const n=document.createElement(tag);
  if(text!==undefined&&text!==null)n.textContent=text;
  if(cls)n.className=cls;
  return n;
 }

 function stopMedia(){
  if(timerId){clearInterval(timerId);timerId=null;}
  if(currentAudio&&!currentAudio.paused){try{currentAudio.pause();}catch{}}
  currentAudio=null;
  try{
   document.querySelectorAll('audio.s4-audio-player').forEach(a=>{try{a.pause();}catch{}});
  }catch{}
  window.HSKSpeech?.stop?.();
 }

 function loadStore(){
  try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{};}catch{return {};}
 }
 function saveStore(data){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(data));}catch{}
 }
 function getTestProgress(testId){
  const s=loadStore();
  return s[testId]||{answers:{},checked:{},submitted:false,score:null};
 }
 function saveTestProgress(testId,prog){
  const s=loadStore();
  s[testId]={...prog,updatedAt:Date.now()};
  saveStore(s);
 }

 function normAnswer(str,kind){
  const s=String(str||'').trim();
  if(!s)return '';
  if(kind==='choice'||/^[A-Fa-f]{1,3}$/.test(s))return s.toUpperCase().replace(/\s+/g,'');
  return s.replace(/[\s。！？，、.!?,；;：:""''（）()【】\[\]]+/g,'');
 }
 function isCorrectAnswer(q,userVal){
  if(!q.answer||q.kind==='essay')return null;
  const u=normAnswer(userVal,q.kind);
  if(!u)return false;
  const candidates=String(q.answer).split(/\s*\[OR\]\s*/i).map(s=>normAnswer(s,q.kind)).filter(Boolean);
  return candidates.includes(u);
 }

 function preferred(){
  const filter=document.querySelector('.filter-btn[data-filter].active')?.dataset.filter;
  const goal=window.HSKPlanner?.plan?.target;
  return (/^[1-6]$/.test(String(filter))?Number(filter):(Number(goal)||3));
 }

 function syncTestDropdown(){
  const lvl=Number(level.value)||3;
  const list=testsByLevel[lvl]||[catalog[lvl]||catalog[3]];
  testSelect.replaceChildren();
  for(const t of list){
   const opt=new Option(t.title,String(t.id));
   testSelect.add(opt);
  }
  if(!list.some(t=>String(t.id)===String(selectedTestId))){
   selectedTestId=String(list[0].id);
  }
  testSelect.value=selectedTestId;
 }

 function currentItem(){
  const lvl=Number(level.value)||3;
  const list=testsByLevel[lvl]||[catalog[lvl]||catalog[3]];
  return list.find(t=>String(t.id)===String(selectedTestId))||list[0]||catalog[3];
 }

 const SKILL_LABELS={listening:'Nghe',reading:'Đọc',writing:'Viết'};
 const KIND_LABELS={choice:'Trắc nghiệm',input:'Điền / ghép đáp án',order:'Sắp xếp câu',essay:'Viết / điền chữ'};
 // Cloze is determined by actual blanks in the question, not just the input widget kind.
 function isClozeQuestion(q){
  const html=String(q.contextHtml||'')+' '+String(q.promptHtml||'');
  const text=html.replace(/<[^>]*>/g,'').replace(/&nbsp;|&#160;/gi,' ');
  return /\(\s*\)|（\s*）|_{2,}|＿{2,}|\[\s*\]|□|▢|…{2,}/.test(text);
 }
 function getDefaultMinutes(test,mode){
  const basic=Number(test.minutes)||60;
  const target=mode==='listening'?Math.max(15,Math.round(basic*0.45)):basic;
  return Math.min(180,Math.max(5,Math.ceil(target/5)*5));
 }
 function filteredParts(test,mode,filter){
  const base=(test.parts||[]).filter(p=>mode!=='listening'||p.skill==='listening');
  if(filter==='all')return base;
  const parts=[];
  const isKind=filter.startsWith('kind:');
  const [,targetSkill,kind]=isKind?filter.split(':'):[];
  for(const p of base){
   if(filter.startsWith('skill:')&&p.skill!==filter.slice(6))continue;
   if(isKind&&targetSkill!=='all'&&targetSkill!==p.skill)continue;
   const groups=[];
   for(const g of (p.groups||[])){
    const questions=(g.questions||[]).filter(q=>
     filter.startsWith('skill:')||(filter==='cloze'||kind==='cloze'?isClozeQuestion(q):q.kind===kind));
    if(questions.length)groups.push({...g,questions});
   }
   if(groups.length)parts.push({...p,groups,questionCount:groups.reduce((n,g)=>n+g.questions.length,0)});
  }
  return parts;
 }
 function filterFromControls(){
  const section=skillSelect.value||'all',kind=kindSelect.value||'all';
  if(kind==='all')return section==='all'?'all':'skill:'+section;
  if(kind==='cloze'&&section==='all')return 'cloze';
  return 'kind:'+section+':'+kind;
 }
 function refreshExamOptions(){
  const item=currentItem();
  const base=(item.parts||[]).filter(p=>skill!=='listening'||p.skill==='listening');
  let section='all',kind='all';
  if(sectionFilter.startsWith('skill:'))section=sectionFilter.slice(6);
  if(sectionFilter==='cloze')kind='cloze';
  if(sectionFilter.startsWith('kind:')){const [,p,k]=sectionFilter.split(':');section=p;kind=k;}
  const skillOptions=[new Option(skill==='listening'?'Toàn bộ phần nghe':'Toàn bộ đề','all')];
  for(const p of base){
   if((p.groups||[]).some(g=>(g.questions||[]).length))skillOptions.push(new Option(SKILL_LABELS[p.skill]||p.name||p.skill,p.skill));
  }
  skillSelect.replaceChildren(...skillOptions);
  if(!skillOptions.some(o=>o.value===section))section='all';
  skillSelect.value=section;
  const questions=base.filter(p=>section==='all'||p.skill===section).flatMap(p=>(p.groups||[]).flatMap(g=>g.questions||[]));
  const kinds=[{value:'all',label:'Tất cả dạng bài'}];
  if(questions.some(isClozeQuestion))kinds.push({value:'cloze',label:'Điền chỗ trống'});
  for(const k of ['choice','input','order','essay']){
   if(questions.some(q=>q.kind===k))kinds.push({value:k,label:KIND_LABELS[k]});
  }
  kindSelect.replaceChildren(...kinds.map(o=>new Option(o.label,o.value)));
  if(!kinds.some(o=>o.value===kind))kind='all';
  kindSelect.value=kind;
  sectionFilter=filterFromControls();
  const minutes=Number(durationSelect.value);
  if(!durationCustomized||!minutes)durationSelect.value=String(getDefaultMinutes(item,skill));
  const subset=filteredParts(item,skill,sectionFilter);
  const count=subset.reduce((n,p)=>n+(p.groups||[]).reduce((sum,g)=>sum+(g.questions||[]).length,0),0);
  examSummary.textContent=count?`${count} câu hỏi · ${durationSelect.value} phút · Chỉ chấm các câu trong phần đã chọn`:'Đang tải danh sách dạng bài của bộ đề…';
  skillSelect.disabled=!item.parts?.length;
  kindSelect.disabled=!item.parts?.length;
 }
 function currentTestList(){return testsByLevel[Number(level.value)]||[];}
 function matchingTests(){
  const term=testSearch.value.trim().toLocaleLowerCase('vi');
  return currentTestList().filter(t=>!term||String(t.title).toLocaleLowerCase('vi').includes(term)||String(t.id).includes(term));
 }
 function renderPicker(){
  const items=matchingTests(),pages=Math.max(1,Math.ceil(items.length/PICKER_PAGE_SIZE));
  pickerPage=Math.max(0,Math.min(pickerPage,pages-1));
  pickerCount.textContent=`${items.length} đề`;
  pickerGrid.replaceChildren();
  const subset=items.slice(pickerPage*PICKER_PAGE_SIZE,(pickerPage+1)*PICKER_PAGE_SIZE);
  for(const t of subset){
   const current=String(t.id)===String(selectedTestId),button=el('button',null,'s4-picker-choice'+(current?' is-current':''));
   button.type='button';button.dataset.testId=String(t.id);
   button.setAttribute('aria-pressed',String(current));button.title=t.title;
   const shortTitle=String(t.title).match(/(?:practice|advanced|mock)\s+test\s+(\d+)/i);
   button.append(el('strong',shortTitle?'Đề '+shortTitle[1]:t.title),el('span',(t.totalQuestions||'—')+' câu'+(current?' · Đang chọn':''),'s4-picker-meta'));
   button.addEventListener('click',()=>{
    selectedTestId=String(t.id);testSelect.value=selectedTestId;
    // Preserve selected time/type where valid when comparing papers.
    update();
   });
   pickerGrid.append(button);
  }
  if(!subset.length)pickerGrid.append(el('p','Không tìm thấy đề phù hợp.','s4-picker-empty'));
  pickerStatus.textContent=`Trang ${pickerPage+1}/${pages}`;
  pickerPrev.disabled=pickerPage===0;pickerNext.disabled=pickerPage>=pages-1;
 }


 function attachZoomableImages(container){
  for(const img of container.querySelectorAll('img')){
   img.loading='lazy';
   img.classList.add('s4-zoomable-img');
   img.addEventListener('click',()=>{
    const dialog=el('dialog',null,'exam-material-dialog s4-img-dialog');
    const close=el('button','Đóng ảnh','s4-dialog-close');
    close.type='button';
    close.addEventListener('click',()=>dialog.close());
    const view=document.createElement('img');
    view.src=img.src;
    view.alt=img.alt||'Hình minh họa câu hỏi';
    dialog.append(close,view);
    document.body.append(dialog);
    dialog.addEventListener('close',()=>dialog.remove(),{once:true});
    if(typeof dialog.showModal==='function')dialog.showModal();
   });
  }
 }

 function renderSafeHtml(target,htmlStr){
  if(!htmlStr)return;
  const tpl=document.createElement('template');
  tpl.innerHTML=htmlStr;
  for(const bad of tpl.content.querySelectorAll('script,style,iframe,object,embed'))bad.remove();
  target.append(tpl.content.cloneNode(true));
  attachZoomableImages(target);
 }

 function formatClock(sec){
  const s=Math.max(0,Math.floor(sec));
  const m=Math.floor(s/60),r=s%60;
  return String(m).padStart(2,'0')+':'+String(r).padStart(2,'0');
 }

 function startExam(item,mode){
  const full=testsById.get(String(item.id))||item;
  if(!full.parts||!full.parts.length){
   if(!dataReady&&!dataError){
    loadStudy4Data().then(()=>{
     const loaded=testsById.get(String(item.id));
     if(loaded&&loaded.parts)startExam(loaded,mode);
    });
   }
   return;
  }
  stopMedia();
  const filter=sectionFilter;
  const partsToUse=filteredParts(full,mode,filter);
  if(!partsToUse.length){sectionFilter='all';refreshExamOptions();return;}
  const defaultMinutes=getDefaultMinutes(full,mode);
  const chosenMinutes=Number(durationSelect.value);
  const mins=Number.isInteger(chosenMinutes)&&chosenMinutes>=5&&chosenMinutes<=180&&chosenMinutes%5===0?chosenMinutes:defaultMinutes;
  // Custom sessions are isolated from the original full-exam progress.
  const progressKey=filter==='all'&&mins===defaultMinutes?String(full.id):`${full.id}::${mode}::${filter}::${mins}`;
  const prog=getTestProgress(progressKey);
  activeSession={
   test:full,
   mode,
   filter,
   progressKey,
   durationMinutes:mins,
   deadlineAt:Date.now()+mins*60000,
   parts:partsToUse,
   partIndex:0,
   remainingSec:mins*60,
   paused:false,
   answers:{...(prog.answers||{})},
   checked:{...(prog.checked||{})},
   submitted:Boolean(prog.submitted)
  };
  renderActiveSession();
 }

 function persistSession(){
  if(!activeSession)return;
  saveTestProgress(activeSession.progressKey,{
   answers:activeSession.answers,
   checked:activeSession.checked,
   submitted:activeSession.submitted
  });
 }

 function allSessionQuestions(sess){
  const out=[];
  for(const p of sess.parts){
   for(const g of (p.groups||[])){
    for(const q of (g.questions||[]))out.push({q,part:p,group:g});
   }
  }
  return out;
 }

 function computeScore(sess){
  const all=allSessionQuestions(sess);
  let totalObj=0,correctObj=0,essayDone=0,answeredCount=0;
  for(const {q} of all){
   const val=sess.answers[q.qid];
   if(val&&String(val).trim())answeredCount++;
   if(q.kind==='essay'){
    if(val&&String(val).trim())essayDone++;
   }else{
    totalObj++;
    if(isCorrectAnswer(q,val))correctObj++;
   }
  }
  const percent=totalObj?Math.round((correctObj*100)/totalObj):0;
  return {totalObj,correctObj,essayDone,answeredCount,totalAll:all.length,percent};
 }

 function renderActiveSession(){
  if(!activeSession){update();return;}
  stopMedia();
  controlsBox.hidden=true;
  results.replaceChildren();

  const sess=activeSession;
  if(!sess.submitted){
   sess.remainingSec=Math.max(0,Math.ceil((sess.deadlineAt-Date.now())/1000));
   if(sess.remainingSec===0){sess.submitted=true;sess.timeExpired=true;persistSession();}
  }
  const test=sess.test;
  const activePart=sess.parts[sess.partIndex]||sess.parts[0];
  const stats=computeScore(sess);

  const wrap=el('div',null,'s4-runner');

  // Top bar
  const topBar=el('div',null,'s4-runner-top');
  const backBtn=el('button','← Đổi đề khác','s4-back-btn');
  backBtn.type='button';
  backBtn.addEventListener('click',()=>{
   stopMedia();
   activeSession=null;
   controlsBox.hidden=false;
   update();
  });

  const titleWrap=el('div',null,'s4-runner-title');
  titleWrap.append(
   el('span','HSK '+test.level+' · '+(sess.mode==='listening'?'Luyện nghe':'Làm đề trực tiếp')+(sess.filter!=='all'?' · '+(sess.filter==='cloze'?'Điền chỗ trống':sess.filter.startsWith('skill:')?(SKILL_LABELS[sess.filter.slice(6)]||'Phần tự chọn'):sess.filter.startsWith('kind:')?(KIND_LABELS[sess.filter.split(':')[2]]||'Phần tự chọn'):'Phần tự chọn'):''),'s4-brow'),
   el('h3',test.title)
  );

  const metaActions=el('div',null,'s4-runner-actions');
  const timerBadge=el('span','⏱ '+formatClock(sess.remainingSec),'s4-timer-badge');
  timerBadge.id='study4Timer';
  const progressBadge=el('span',`Đã làm ${stats.answeredCount}/${stats.totalAll}`,'s4-progress-badge');
  progressBadge.id='study4ProgressBadge';

  const submitBtn=el('button',sess.submitted?'Chấm lại':'Nộp bài & Chấm điểm','s4-submit-btn active');
  submitBtn.type='button';
  submitBtn.id='study4SubmitBtn';
  submitBtn.setAttribute('aria-pressed','true');
  submitBtn.addEventListener('click',()=>{
   sess.submitted=true;
   persistSession();
   renderActiveSession();
   panel.scrollIntoView({behavior:'smooth',block:'start'});
  });

  const resetBtn=el('button','Làm lại','s4-reset-btn');
  resetBtn.type='button';
  resetBtn.id='study4ResetBtn';
  resetBtn.addEventListener('click',()=>{
   sess.answers={};
   sess.checked={};
   sess.submitted=false;
   sess.timeExpired=false;
   sess.deadlineAt=Date.now()+sess.durationMinutes*60000;
   sess.remainingSec=sess.durationMinutes*60;
   persistSession();
   renderActiveSession();
  });

  metaActions.append(timerBadge,progressBadge,submitBtn,resetBtn);
  topBar.append(backBtn,titleWrap,metaActions);
  wrap.append(topBar);

  if(!sess.submitted){
   timerId=setInterval(()=>{
    if(activeSession!==sess||sess.paused||panel.hidden)return;
    sess.remainingSec=Math.max(0,Math.ceil((sess.deadlineAt-Date.now())/1000));
    timerBadge.textContent='⏱ '+formatClock(sess.remainingSec);
    if(sess.remainingSec===0){
     sess.submitted=true;sess.timeExpired=true;
     persistSession();renderActiveSession();
    }
   },1000);
  }

  // Score summary banner when submitted
  if(sess.submitted){
   const banner=el('div',null,'s4-score-banner');
   banner.id='study4ScoreBanner';
   banner.setAttribute('role','status');
   banner.append(
    el('strong',(sess.timeExpired?'Hết giờ · ':'')+(stats.totalObj?`Kết quả: ${stats.correctObj} / ${stats.totalObj} câu trắc nghiệm đúng (${stats.percent}%)`:`Đã làm ${stats.essayDone} / ${stats.totalAll} câu viết`)),
    el('p',stats.essayDone?`Đã lưu ${stats.essayDone} câu viết tự luận. Xem đáp án chi tiết và lời thoại (Transcript) bên dưới.`:'Xem đáp án đúng và lời thoại (Transcript) cho từng câu bên dưới.')
   );
   wrap.append(banner);
  }

  // Part tabs (Listening / Reading / Writing)
  if(sess.parts.length>1||test.parts.length>1){
   const partBar=el('div',null,'s4-part-tabs');
   partBar.setAttribute('role','tablist');
   sess.parts.forEach((p,idx)=>{
    const labelMap={listening:'Nghe (Listening)',reading:'Đọc (Reading)',writing:'Viết (Writing)'};
    const isCurrentPart=idx===sess.partIndex;
    const btn=el('button',`${labelMap[p.skill]||p.name} · ${p.questionCount} câu`,'s4-part-tab'+(isCurrentPart?' is-active active':''));
    btn.type='button';
    btn.dataset.s4Part=p.skill;
    btn.setAttribute('aria-selected',String(isCurrentPart));
    btn.setAttribute('aria-pressed',String(isCurrentPart));
    btn.addEventListener('click',()=>{
     sess.partIndex=idx;
     renderActiveSession();
    });
    partBar.append(btn);
   });
   if(sess.mode==='listening'&&test.parts.length>sess.parts.length){
    const fullBtn=el('button','Mở đủ cả đề (Nghe + Đọc'+(test.level>=3?' + Viết':'')+')','s4-part-tab s4-expand-full');
    fullBtn.type='button';
    fullBtn.addEventListener('click',()=>{
     sess.mode='test';
     sess.filter='all';
     sess.parts=test.parts;
     sess.partIndex=0;
     sess.durationMinutes=getDefaultMinutes(test,'test');
     sess.deadlineAt=Date.now()+sess.durationMinutes*60000;
     sess.remainingSec=sess.durationMinutes*60;
     sess.progressKey=String(test.id);
     renderActiveSession();
    });
    partBar.append(fullBtn);
   }
   wrap.append(partBar);
  }

  // Audio builder helper: dual sources (local offline file + remote CDN fallback)
  const createAudioBox=(audioUrl,audioFile,labelText,isInline=false)=>{
   if(!audioUrl&&!audioFile)return null;
   const box=el('div',null,'s4-audio-box'+(isInline?' s4-audio-box--inline':''));
   if(labelText){
    const head=el('div',null,'s4-audio-head');
    head.append(
     el('strong',labelText),
     el('span','Phát trực tiếp trong ứng dụng · Có thể tua hoặc tạm dừng','s4-audio-sub')
    );
    box.append(head);
   }
   const audioEl=document.createElement('audio');
   audioEl.controls=true;
   audioEl.preload=isInline?'none':'metadata';
   audioEl.className='s4-audio-player';
   if(labelText)audioEl.setAttribute('aria-label',labelText);

   if(audioFile){
    const sLocal=document.createElement('source');
    sLocal.src='./'+String(audioFile).replace(/^\.?\/+/,'');
    sLocal.type='audio/mpeg';
    audioEl.append(sLocal);
   }
   if(audioUrl){
    const sRemote=document.createElement('source');
    sRemote.src=audioUrl;
    sRemote.type='audio/mpeg';
    audioEl.append(sRemote);
   }

   audioEl.addEventListener('play',()=>{
    window.HSKSpeech?.stop?.();
    document.querySelectorAll('audio.s4-audio-player').forEach(a=>{
     if(a!==audioEl&&!a.paused)try{a.pause();}catch{}
    });
    currentAudio=audioEl;
   });

   box.append(audioEl);
   return box;
  };

  // Audio player for Listening part
  const audioUrl=activePart.audio||(activePart.skill==='listening'?test.audio:'');
  const audioFile=activePart.audioFile||(activePart.skill==='listening'?test.audioFile:'');
  if(audioUrl||audioFile){
   const audioBox=createAudioBox(audioUrl,audioFile,'🎧 Audio bài nghe chính thức ('+test.title+')');
   if(audioBox)wrap.append(audioBox);
  }

  // Question palette for current part
  const partQuestions=[];
  for(const g of (activePart.groups||[])){
   for(const q of (g.questions||[]))partQuestions.push(q);
  }
  const palette=el('div',null,'s4-palette');
  palette.setAttribute('aria-label','Danh sách câu hỏi');
  for(const q of partQuestions){
   const val=sess.answers[q.qid];
   const hasAns=Boolean(val&&String(val).trim());
   const isChecked=sess.submitted||Boolean(sess.checked[q.qid]);
   let stateCls='';
   if(isChecked){
    const ok=isCorrectAnswer(q,val);
    stateCls=ok===true?' is-correct':(ok===false?' is-wrong':(hasAns?' is-answered':''));
   }else if(hasAns){
    stateCls=' is-answered';
   }
   const chip=el('button',String(q.number),'s4-palette-chip'+stateCls);
   chip.type='button';
   chip.dataset.qnum=String(q.number);
   chip.addEventListener('click',()=>{
    const target=panel.querySelector('#s4-q-'+q.number);
    if(target)target.scrollIntoView({behavior:'smooth',block:'center'});
   });
   palette.append(chip);
  }
  wrap.append(palette);

  function refreshBadges(){
   const st=computeScore(sess);
   progressBadge.textContent=`Đã làm ${st.answeredCount}/${st.totalAll}`;
   for(const q of partQuestions){
    const chip=palette.querySelector(`[data-qnum="${q.number}"]`);
    if(!chip)continue;
    const val=sess.answers[q.qid];
    const hasAns=Boolean(val&&String(val).trim());
    const isChecked=sess.submitted||Boolean(sess.checked[q.qid]);
    chip.className='s4-palette-chip';
    if(isChecked){
     const ok=isCorrectAnswer(q,val);
     if(ok===true)chip.classList.add('is-correct');
     else if(ok===false)chip.classList.add('is-wrong');
     else if(hasAns)chip.classList.add('is-answered');
    }else if(hasAns){
     chip.classList.add('is-answered');
    }
   }
  }

  // Render groups & questions
  const groupsWrap=el('div',null,'s4-groups');
  for(const g of (activePart.groups||[])){
   const gCard=el('section',null,'s4-group-card'+(g.twoCols?' is-twocols':''));
   const gTransHolder=el('div',null,'s4-group-transcript-holder');
   const renderGroupTranscript=()=>{
    gTransHolder.replaceChildren();
    if(g.transcriptHtml&&(sess.submitted||(g.questions||[]).some(q=>sess.checked[q.qid]))){
     const trDetails=el('details',null,'s4-transcript');
     trDetails.open=true;
     trDetails.append(el('summary','Xem lời thoại nhóm câu này (Transcript)'));
     const trBody=el('div',null,'s4-transcript-body');
     renderSafeHtml(trBody,g.transcriptHtml);
     trDetails.append(trBody);
     gTransHolder.append(trDetails);
    }
   };
   if(g.contextHtml||g.transcriptHtml||g.audio||g.audioFile){
    const gCtx=el('div',null,'s4-group-context');
    const qNums=(g.questions||[]).map(x=>x.number);
    if(qNums.length>1){
     gCtx.append(el('div',`Tư liệu dùng chung cho câu ${qNums[0]}–${qNums[qNums.length-1]}`,'s4-group-badge'));
    }
    if(g.audio||g.audioFile){
     const gAudio=createAudioBox(g.audio,g.audioFile,'🎧 Audio đoạn nghe chung câu '+(qNums.length>1?`${qNums[0]}–${qNums[qNums.length-1]}`:qNums[0]),true);
     if(gAudio){
      gAudio.classList.add('s4-audio-box--group');
      gCtx.append(gAudio);
     }
    }
    if(g.contextHtml){
     const ctxInner=el('div',null,'s4-context-body');
     renderSafeHtml(ctxInner,g.contextHtml);
     gCtx.append(ctxInner);
    }
    renderGroupTranscript();
    gCtx.append(gTransHolder);
    gCard.append(gCtx);
   }

   const qList=el('div',null,'s4-group-questions');
   for(const q of (g.questions||[])){
    const qCard=el('article',null,'s4-question-card');
    qCard.id='s4-q-'+q.number;
    qCard.dataset.qid=String(q.qid);
    qCard.dataset.qnum=String(q.number);

    const qHead=el('div',null,'s4-q-head');
    const numBadge=el('strong','Câu '+q.number,'s4-q-num');
    const checkOneBtn=el('button','Kiểm tra đáp án','s4-check-one');
    checkOneBtn.type='button';
    qHead.append(numBadge,checkOneBtn);
    qCard.append(qHead);

    if(q.audio||q.audioFile){
     const qAudio=createAudioBox(q.audio,q.audioFile,null,true);
     if(qAudio){
      qAudio.classList.add('s4-audio-box--question');
      qCard.append(qAudio);
     }
    }

    if(q.contextHtml){
     const qCtx=el('div',null,'s4-q-context');
     renderSafeHtml(qCtx,q.contextHtml);
     qCard.append(qCtx);
    }
    if(q.promptHtml){
     const qPrompt=el('div',null,'s4-q-prompt');
     renderSafeHtml(qPrompt,q.promptHtml);
     qCard.append(qPrompt);
    }

    const ansArea=el('div',null,'s4-q-answers');
    const feedbackBox=el('div',null,'s4-q-feedback');

    const renderFeedback=()=>{
     feedbackBox.replaceChildren();
     const isChecked=sess.submitted||Boolean(sess.checked[q.qid]);
     if(!isChecked){
      feedbackBox.hidden=true;
      return;
     }
     feedbackBox.hidden=false;
     const userVal=sess.answers[q.qid]||'';
     const ok=isCorrectAnswer(q,userVal);
     feedbackBox.className='s4-q-feedback '+(ok===true?'is-correct':(ok===false?'is-wrong':'is-neutral'));
     if(q.kind==='essay'){
      feedbackBox.append(el('strong',userVal.trim()?'✓ Đã lưu bài viết tự luận':'Chưa nhập bài viết'));
     }else if(ok===true){
      feedbackBox.append(el('strong','✓ Chính xác ('+q.answer+')'));
     }else{
      feedbackBox.append(el('strong','✗ Chưa đúng · Đáp án đúng: '+q.answer));
     }
     if(q.transcriptHtml){
      const tr=el('details',null,'s4-transcript');
      tr.open=true;
      tr.append(el('summary','Lời thoại (Transcript)'));
      const trBody=el('div',null,'s4-transcript-body');
      renderSafeHtml(trBody,q.transcriptHtml);
      tr.append(trBody);
      feedbackBox.append(tr);
     }
     if(q.explanationHtml){
      const ex=el('div',null,'s4-explanation');
      renderSafeHtml(ex,q.explanationHtml);
      feedbackBox.append(ex);
     }
    };

    checkOneBtn.addEventListener('click',()=>{
     sess.checked[q.qid]=!sess.checked[q.qid];
     checkOneBtn.textContent=sess.checked[q.qid]?'Ẩn đáp án':'Kiểm tra đáp án';
     persistSession();
     renderFeedback();
     renderGroupTranscript();
     refreshBadges();
    });
    if(sess.submitted||sess.checked[q.qid]){
     checkOneBtn.textContent='Ẩn đáp án';
    }

    if(q.kind==='choice'&&Array.isArray(q.options)){
     const optGrid=el('div',null,'s4-choices');
     for(const opt of q.options){
      const isSel=sess.answers[q.qid]===opt.value;
      const btn=el('button',null,'s4-choice-btn'+(isSel?' is-selected active':''));
      btn.type='button';
      btn.dataset.optionValue=opt.value;
      btn.setAttribute('aria-pressed',String(isSel));
      if(opt.html)renderSafeHtml(btn,opt.html);
      else btn.textContent=opt.label||opt.value;
      btn.addEventListener('click',()=>{
       sess.answers[q.qid]=opt.value;
       for(const b of optGrid.querySelectorAll('.s4-choice-btn')){
        const match=b.dataset.optionValue===opt.value;
        b.classList.toggle('is-selected',match);
        b.classList.toggle('active',match);
        b.setAttribute('aria-pressed',String(match));
       }
       persistSession();
       refreshBadges();
       if(sess.submitted||sess.checked[q.qid])renderFeedback();
      });
      optGrid.append(btn);
     }
     ansArea.append(optGrid);
    }else if(q.kind==='order'&&Array.isArray(q.ordering)){
     const tokenPool=el('div',null,'s4-order-tokens');
     const input=document.createElement('input');
     input.type='text';
     input.className='s4-text-input';
     input.placeholder='Chạm các cụm từ bên trên để ghép câu hoặc tự nhập...';
     input.value=sess.answers[q.qid]||'';
     input.setAttribute('aria-label','Câu sắp xếp cho câu '+q.number);

     for(const word of q.ordering){
      const chip=el('button',word,'s4-order-token');
      chip.type='button';
      chip.addEventListener('click',()=>{
       const cur=input.value||'';
       input.value=cur.includes(word)?cur.replace(word,''):(cur+word);
       sess.answers[q.qid]=input.value.trim();
       chip.classList.toggle('is-used',input.value.includes(word));
       persistSession();
       refreshBadges();
       if(sess.submitted||sess.checked[q.qid])renderFeedback();
      });
      tokenPool.append(chip);
     }
     const clearBtn=el('button','Xóa câu','s4-clear-inline');
     clearBtn.type='button';
     clearBtn.addEventListener('click',()=>{
      input.value='';
      sess.answers[q.qid]='';
      for(const c of tokenPool.querySelectorAll('.s4-order-token'))c.classList.remove('is-used');
      persistSession();
      refreshBadges();
      if(sess.submitted||sess.checked[q.qid])renderFeedback();
     });
     input.addEventListener('input',()=>{
      sess.answers[q.qid]=input.value.trim();
      persistSession();
      refreshBadges();
      if(sess.submitted||sess.checked[q.qid])renderFeedback();
     });
     const row=el('div',null,'s4-input-row');
     row.append(input,clearBtn);
     ansArea.append(tokenPool,row);
    }else if(q.kind==='essay'){
     const area=document.createElement('textarea');
     area.rows=4;
     area.className='s4-essay-input';
     area.placeholder='Viết câu / đoạn văn tiếng Trung tại đây...';
     area.value=sess.answers[q.qid]||'';
     area.setAttribute('aria-label','Bài viết cho câu '+q.number);
     const counter=el('small',(area.value.replace(/\s+/g,'').length)+' ký tự','s4-char-count');
     area.addEventListener('input',()=>{
      sess.answers[q.qid]=area.value;
      counter.textContent=(area.value.replace(/\s+/g,'').length)+' ký tự';
      persistSession();
      refreshBadges();
     });
     ansArea.append(area,counter);
    }else{
     // input: letter A-F, 3-letter permutation ABC, or character input
     const expected=String(q.answer||'').trim();
     const isSingleLetter=/^[A-Fa-f]$/.test(expected);
     const isTripleOrder=/^[ABCabc]{3}$/.test(expected);
     const input=document.createElement('input');
     input.type='text';
     input.className='s4-text-input';
     input.placeholder=isSingleLetter?'Chọn hoặc nhập đáp án (A–F)...':(isTripleOrder?'Chọn thứ tự (VD: CBA)...':'Nhập chữ Hán đáp án...');
     input.value=sess.answers[q.qid]||'';
     input.setAttribute('aria-label','Đáp án câu '+q.number);

     if(isSingleLetter||isTripleOrder){
      const presets=isSingleLetter?['A','B','C','D','E','F']:['ABC','ACB','BAC','BCA','CAB','CBA'];
      const quickBar=el('div',null,'s4-quick-letters');
      for(const code of presets){
       const isSel=normAnswer(input.value,'choice')===code;
       const b=el('button',code,'s4-letter-btn'+(isSel?' is-selected active':''));
       b.type='button';
       b.dataset.letterCode=code;
       b.setAttribute('aria-pressed',String(isSel));
       b.addEventListener('click',()=>{
        input.value=code;
        sess.answers[q.qid]=code;
        for(const x of quickBar.querySelectorAll('.s4-letter-btn')){
         const match=x.dataset.letterCode===code;
         x.classList.toggle('is-selected',match);
         x.classList.toggle('active',match);
         x.setAttribute('aria-pressed',String(match));
        }
        persistSession();
        refreshBadges();
        if(sess.submitted||sess.checked[q.qid])renderFeedback();
       });
       quickBar.append(b);
      }
      input.addEventListener('input',()=>{
       const val=input.value.trim().toUpperCase();
       sess.answers[q.qid]=val;
       for(const x of quickBar.querySelectorAll('.s4-letter-btn')){
        x.classList.toggle('is-selected',x.dataset.letterCode===val);
       }
       persistSession();
       refreshBadges();
       if(sess.submitted||sess.checked[q.qid])renderFeedback();
      });
      ansArea.append(quickBar,input);
     }else{
      input.addEventListener('input',()=>{
       sess.answers[q.qid]=input.value.trim();
       persistSession();
       refreshBadges();
       if(sess.submitted||sess.checked[q.qid])renderFeedback();
      });
      ansArea.append(input);
     }
    }

    qCard.append(ansArea,feedbackBox);
    renderFeedback();
    qList.append(qCard);
   }
   gCard.append(qList);
   groupsWrap.append(gCard);
  }
  wrap.append(groupsWrap);

  // Footer navigation between parts + submit
  const foot=el('div',null,'s4-runner-foot');
  if(sess.partIndex>0){
   const prevPart=el('button','← Phần trước','s4-part-nav');
   prevPart.type='button';
   prevPart.addEventListener('click',()=>{
    sess.partIndex--;
    renderActiveSession();
    panel.scrollIntoView({behavior:'smooth',block:'start'});
   });
   foot.append(prevPart);
  }
  if(sess.partIndex<sess.parts.length-1){
   const nextPart=el('button','Phần tiếp theo →','s4-part-nav is-primary');
   nextPart.type='button';
   nextPart.addEventListener('click',()=>{
    sess.partIndex++;
    renderActiveSession();
    panel.scrollIntoView({behavior:'smooth',block:'start'});
   });
   foot.append(nextPart);
  }
  const footSubmit=el('button',sess.submitted?'Chấm lại điểm':'Nộp bài & Xem đáp án','s4-submit-btn');
  footSubmit.type='button';
  footSubmit.addEventListener('click',()=>{
   sess.submitted=true;
   persistSession();
   renderActiveSession();
   panel.scrollIntoView({behavior:'smooth',block:'start'});
  });
  foot.append(footSubmit);
  wrap.append(foot);

  results.append(wrap);
 }

 function update(){
  if(activeSession){
   renderActiveSession();
   return;
  }
  controlsBox.hidden=false;
  syncTestDropdown();
  refreshExamOptions();
  renderPicker();
  const item=currentItem();
  for(const b of panel.querySelectorAll('[data-s4-skill]')){
   const current=b.dataset.s4Skill===skill;
   b.classList.toggle('is-active',current);
   b.setAttribute('aria-pressed',String(current));
  }
  results.replaceChildren();
  const card=document.createElement('article');
  card.className='s4-test-card';
  const eyebrow=document.createElement('span');
  eyebrow.className='s4-brow';
  eyebrow.textContent='HSK '+level.value+' · '+(skill==='listening'?'Kỹ năng nghe':'Đề luyện thi');
  const title=document.createElement('h3');
  title.textContent=item.title;
  const meta=document.createElement('p');
  meta.textContent=skill==='listening'
   ?item.listening+' câu Listening · Nghe audio và làm trực tiếp trong HSK'
   :item.minutes+' phút · Nghe, Đọc'+(Number(level.value)>=3?', Viết':'')+(item.totalQuestions?' · '+item.totalQuestions+' câu':'');
  const details=document.createElement('p');
  details.className='s4-explainer';
  details.textContent=skill==='listening'
   ?'Phát audio gốc, chọn đáp án, chấm điểm và đối chiếu lời thoại (Transcript) trực tiếp ngay trong ứng dụng.'
   :'Làm đề thi, nghe audio, chọn đáp án và xem kết quả chi tiết trực tiếp ngay trong ứng dụng mà không cần rời trang.';

  const link=document.createElement('a');
  link.className='s4-visit';
  link.href=item.url;
  link.target='_blank';
  link.rel='noopener noreferrer';
  link.textContent=skill==='listening'?'Làm phần Listening ngay →':'Bắt đầu làm đề ngay →';
  link.addEventListener('click',e=>{
   e.preventDefault();
   startExam(item,skill);
  });

  card.append(eyebrow,title,meta,details,link);
  results.append(card);
 }

 function open(options={}){
  stopMedia();
  activeSession=null;
  const n=Number(options.level)||preferred();
  level.value=String(catalog[n]?n:3);
  selectedTestId=options.testId?String(options.testId):String((testsByLevel[Number(level.value)]?.[0]||catalog[Number(level.value)]||catalog[3]).id);
  skill=options.skill==='listening'?'listening':'test';
  sectionFilter='all';durationCustomized=false;pickerPage=0;testSearch.value='';
  update();
  // Show the selected paper even when it is not on the first page.
  const index=matchingTests().findIndex(t=>String(t.id)===selectedTestId);
  if(index>=0){pickerPage=Math.floor(index/PICKER_PAGE_SIZE);renderPicker();}
  if(Date.now()-lastCloudCheck>CLOUD_REFRESH_MS)loadStudy4Data({refresh:true});
  if(options.autoStart){
   startExam(currentItem(),skill);
  }
 }

 function installData(payload){
  if(!payload||!Array.isArray(payload.tests)||!payload.tests.length)throw Error('Kho đề trống hoặc sai định dạng');
  const grouped={1:[],2:[],3:[],4:[],5:[],6:[]},fresh=new Map();
  for(const t of payload.tests){
   const lvl=Number(t.level);
   if(!grouped[lvl]||!t.id||!Array.isArray(t.parts)||fresh.has(String(t.id)))throw Error('Kho đề chứa mục không hợp lệ hoặc trùng ID');
   grouped[lvl].push(t);fresh.set(String(t.id),t);
  }
  // Replace rather than append: removed exams must not survive a cloud catalog update.
  testsById.clear();
  for(const [id,t] of fresh)testsById.set(id,t);
  for(let n=1;n<=6;n++){
   testsByLevel[n]=grouped[n].length?grouped[n]:[seedCatalog[n]];
   catalog[n]=testsByLevel[n][0];
  }
  dataReady=true;dataError=null;
  if(!panel.hidden&&!activeSession)update();
  window.dispatchEvent(new Event('hsk-study4-ready'));
 }

 let loadPromise=null,lastCloudCheck=0,remoteRevision='';
 async function loadBundledStudy4(){
  const r=await fetch('./study4-tests-data.json.gz');
  if(!r.ok)throw Error('Local HTTP '+r.status);
  if(typeof DecompressionStream==='function'&&r.body)return new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).json();
  // Most supported iOS and desktop browsers provide DecompressionStream.
  return r.json();
 }
 function loadStudy4Data({refresh=false}={}){
  if(loadPromise)return loadPromise;
  if(dataReady&&!refresh)return Promise.resolve(null);
  loadPromise=(async()=>{
   try{
    let cloudError;
    for(const manifestURL of CLOUD_MANIFESTS){
     try{
      const r=await fetch(manifestURL,{cache:'no-store',signal:AbortSignal.timeout(7000)});
      if(!r.ok)throw Error('Cloud manifest HTTP '+r.status);
      const m=await r.json();
      if(m.schema!==1||!/^([a-f0-9]{64})$/.test(m.sha256)||m.version!==m.sha256||!Number.isSafeInteger(m.tests)||m.tests<1)throw Error('Cloud manifest không hợp lệ');
      if(remoteRevision===m.version&&dataReady)return null;
      // Relative path resolves correctly for both the Worker and the R2 fallback.
      const dataURL=new URL('./data/'+m.sha256+'.json.gz',manifestURL);
      const asset=await fetch(dataURL.toString(),{signal:AbortSignal.timeout(15000)});
      if(!asset.ok)throw Error('Cloud data HTTP '+asset.status);
      const payload=await asset.json();
      if(payload.tests?.length!==m.tests)throw Error('Số bộ đề trên Cloudflare không khớp manifest');
      installData(payload);remoteRevision=m.version;
      return payload;
     }catch(error){cloudError=error;}
    }
    throw cloudError||Error('Cloudflare chưa sẵn sàng');
   }catch(error){
    // Keep already loaded exams during a temporary network failure.
    if(!dataReady){
     try{const fallback=await loadBundledStudy4();installData(fallback);return fallback;}
     catch(localError){dataError=localError.message||error.message||String(error);window.dispatchEvent(new Event('hsk-study4-ready'));}
    }
    return null;
   }finally{lastCloudCheck=Date.now();loadPromise=null;}
  })();
  return loadPromise;
 }

 level.addEventListener('change',()=>{
  sectionFilter='all';durationCustomized=false;pickerPage=0;testSearch.value='';
  activeSession=null;
  selectedTestId=String((testsByLevel[Number(level.value)]?.[0]||catalog[Number(level.value)]||catalog[3]).id);
  update();
 });
 testSearch.addEventListener('input',()=>{pickerPage=0;renderPicker();});
 pickerPrev.addEventListener('click',()=>{if(pickerPage>0){pickerPage--;renderPicker();}});
 pickerNext.addEventListener('click',()=>{if(pickerPage<Math.ceil(matchingTests().length/PICKER_PAGE_SIZE)-1){pickerPage++;renderPicker();}});
 testSelect.addEventListener('change',()=>{
  sectionFilter='all';durationCustomized=false;
  activeSession=null;
  selectedTestId=String(testSelect.value);
  update();
 });
 panel.querySelectorAll('[data-s4-skill]').forEach(button=>button.addEventListener('click',()=>{
  skill=button.dataset.s4Skill;
  sectionFilter='all';durationCustomized=false;
  if(activeSession){
   startExam(activeSession.test,skill);
  }else{
   update();
  }
 }));
 skillSelect.addEventListener('change',()=>{sectionFilter='skill:'+skillSelect.value;refreshExamOptions();});
 kindSelect.addEventListener('change',()=>{sectionFilter=filterFromControls();refreshExamOptions();});
 durationSelect.addEventListener('change',()=>{durationCustomized=true;refreshExamOptions();});
 panel.querySelector('.s4-internal').addEventListener('click',()=>{
  stopMedia();
  window.HSKStudio?.navigate('exam');
 });
 window.addEventListener('pagehide',stopMedia);
 new MutationObserver(()=>{if(panel.hidden)stopMedia();}).observe(panel,{attributes:true,attributeFilter:['hidden']});

 loadStudy4Data();
 update();

 window.HSKStudy4={
  open,
  startExam,
  catalog,
  testsByLevel,
  get ready(){return dataReady;},
  get activeSession(){return activeSession;},
  get selectedLevel(){return Number(level.value);},
  get selectedTestId(){return selectedTestId;},
  get skill(){return skill;}
 };
})();
