/* Unified mode chooser for the existing Luyện & Ôn features. */
(function(){
 'use strict';
 const MODES=[
  ['learn','Thẻ từ vựng','Lật thẻ, học chữ và phát âm.','cards'],
  ['quiz','Trắc nghiệm','Chọn đáp án, kiểm tra ghi nhớ.','check'],
  ['match-game','Đối chiếu 3 cột','Ghép Hán tự, pinyin và nghĩa.','match'],
  ['sentence-game','Sắp xếp câu','Xếp ô chữ thành câu.','order'],
  ['writing','Học viết','Xem và luyện từng nét.','pen'],
  ['compare','Từ dễ nhầm','So sánh từ gần giống nhau.','compare'],
  ['passive','Học rảnh tay','Nghe và lặp lại từ tự động.','headphones'],
  ['srs','Ôn theo lịch','Ôn từ đến hạn SRS.','repeat'],
  ['mistakes','Ôn câu sai','Làm lại những câu từng sai.','target'],
  ['exam','Bài tập HSK','Luyện Nghe, Đọc, Viết theo dạng.','clipboard'],
  ['placement','Đánh giá trình độ','Kiểm tra và gợi ý lộ trình.','chart'],
  ['study4','Luyện thi HSK','Đề thi và bài nghe từ Study4.','exam'],
  ['real-reading','Đọc thực tế','Đọc kịch bản mới từ bài báo và truyện.','cards'],
  ['music','Nghe nhạc học HSK','Nghe từng câu, đoán ý và học từ mới.','headphones']
 ];
 const paths={
  cards:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  check:'<rect x="3" y="4" width="18" height="16" rx="3"/><path d="m7 12 3 3 6-6"/>',
  match:'<rect x="2" y="3" width="5" height="6" rx="1"/><rect x="10" y="3" width="5" height="6" rx="1"/><rect x="18" y="3" width="4" height="6" rx="1"/><path d="M4.5 10v4h13.5M12.5 10v4M20 10v4M4.5 14v6M12.5 14v6M20 14v6"/>',
  order:'<path d="M4 6h4v4H4zM11 8h9M4 15h4v4H4zM11 17h9"/><path d="m5 2 2 2-2 2"/>',
  pen:'<path d="m3 21 5-1 12-12-4-4L4 16l-1 5Z"/><path d="m14 6 4 4M10 21h11"/>',
  compare:'<path d="M4 5h6v6H4zM14 13h6v6h-6zM10 8h4M14 8l-2-2M14 8l-2 2M14 16h-4M10 16l2-2M10 16l2 2"/>',
  headphones:'<path d="M4 13v-2a8 8 0 0 1 16 0v2M4 13h4v8H6a2 2 0 0 1-2-2v-6ZM20 13h-4v8h2a2 2 0 0 0 2-2v-6Z"/>',
  repeat:'<path d="M20 8a8 8 0 0 0-14-3L4 7m0-4v4h4M4 16a8 8 0 0 0 14 3l2-2m0 4v-4h-4"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  clipboard:'<rect x="5" y="5" width="14" height="17" rx="2"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="m9 15 2 2 4-5"/>',
  chart:'<path d="M3 21h18M6 18v-5M12 18V9M18 18V5"/><path d="m5 8 6-4 7 2"/>',
  exam:'<path d="M7 3h8l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M15 3v5h4M9 13h6M9 17h6"/>'
 };
 function svg(which){
  const n=document.createElementNS('http://www.w3.org/2000/svg','svg');
  n.setAttribute('viewBox','0 0 24 24');n.setAttribute('width','26');n.setAttribute('height','26');
  n.setAttribute('fill','none');n.setAttribute('stroke','currentColor');n.setAttribute('stroke-width','1.8');
  n.setAttribute('stroke-linecap','round');n.setAttribute('stroke-linejoin','round');n.setAttribute('aria-hidden','true');
  n.innerHTML=paths[which]||paths.cards;return n;
 }
 const practice=document.getElementById('studioPractice');
 if(!practice)return;
 const reviewIDs=new Set(['srs','mistakes']);
 const groups=[{prefix:'practice',name:'luyện',modes:MODES.filter(m=>!reviewIDs.has(m[0])&&!['music','study4'].includes(m[0]))},{prefix:'review',name:'ôn',modes:MODES.filter(m=>reviewIDs.has(m[0]))}];
 for(const group of groups){
  const {prefix,name}=group,picker=document.createElement('div');picker.id=prefix+'ModePicker';picker.className='ps-picker';group.picker=picker;
  picker.innerHTML=`<details id="${prefix}ModeDisclosure" class="ps-disclosure">
  <summary class="ps-disclosure-summary"><span class="ps-summary-icon" aria-hidden="true"></span><span class="ps-summary-copy"><strong>Chọn chế độ ${name}</strong><small id="${prefix}SelectedCount" aria-live="polite"></small></span><span class="ps-level" id="${prefix}ModeLevel">HSK</span></summary>
  <div class="ps-disclosure-body"><div class="ps-tools"><p>Chọn một, nhiều hoặc tất cả chế độ.</p><div><button type="button" id="${prefix}SelectAll">Chọn tất cả</button><button type="button" id="${prefix}ClearAll">Bỏ chọn</button></div></div><div id="${prefix}ModeOptions" class="ps-options" role="group" aria-label="Các chế độ ${name}"></div><div class="ps-start-row"><p id="${prefix}ModeStatus" role="status"></p><button type="button" class="ps-start" id="${prefix}StartModes">Bắt đầu ${name} →</button></div></div>
  </details>`;
  picker.querySelector('.ps-summary-icon').append(svg(prefix==='review'?'repeat':'check'));
  group.disclosure=picker.querySelector('details');group.options=picker.querySelector('.ps-options');group.counter=picker.querySelector('small');group.start=picker.querySelector('.ps-start');group.hint=picker.querySelector('[role=status]');
 }
 practice.prepend(...groups.map(g=>g.picker));
 // Independent exam entry keeps the existing Study4 route and module.
 const examEntry=document.createElement('button');examEntry.type='button';examEntry.id='practiceStudy4Entry';examEntry.className='ps-exam-entry';examEntry.dataset.studioGo='study4';
 const examIcon=document.createElement('span');examIcon.className='ps-icon';examIcon.append(svg('exam'));
 const examCopy=document.createElement('span');examCopy.className='ps-copy';const examTitle=document.createElement('strong');examTitle.textContent='Luyện thi HSK';const examNote=document.createElement('small');examNote.textContent='Đề thi và bài nghe theo cấp HSK';examCopy.append(examTitle,examNote);
 const examArrow=document.createElement('span');examArrow.textContent='→';examArrow.setAttribute('aria-hidden','true');examEntry.append(examIcon,examCopy,examArrow);groups[1].picker.after(examEntry);
 examEntry.addEventListener('click',()=>window.HSKStudio?.navigate('study4'));
 // Legacy nodes keep their feature handlers; both visible chooser groups use the same UI.
 for(const legacy of ['studioReview','practiceGroup']){const group=document.getElementById(legacy);if(group){group.hidden=true;group.open=false;}}
 const owner=()=>{try{return JSON.parse(localStorage.getItem('hsk-account-meta-v1')||'{}').uid||'guest';}catch{return 'guest';}};
 const prefKey=()=>'hsk-practice-mode-choice-v1:'+owner();
 const defaultSelection=['match-game','sentence-game','quiz','srs','mistakes'];
 function restore(){
  try{const a=JSON.parse(localStorage.getItem(prefKey())||'null');if(Array.isArray(a))return a.filter(x=>MODES.some(m=>m[0]===x));}catch{}
  return defaultSelection.slice();
 }
 let selected=new Set(restore()),session=null;
 function persist(){try{localStorage.setItem(prefKey(),JSON.stringify([...selected]));}catch{}}
 function renderCount(){
  for(const group of groups){
   const n=group.modes.filter(m=>selected.has(m[0])).length;
   group.counter.textContent=n+' / '+group.modes.length+' đã chọn';group.start.disabled=!n;
   group.start.textContent=n>1?'Bắt đầu '+n+' chế độ '+group.name+' →':'Bắt đầu '+group.name+' →';
   for(const input of group.options.querySelectorAll('input[type=checkbox]')){input.checked=selected.has(input.value);input.closest('.ps-option').classList.toggle('is-selected',input.checked);}
  }
 }
 for(const group of groups){
  for(const [id,name,detail,icon] of group.modes){
   const label=document.createElement('label');label.className='ps-option';label.dataset.practiceOption=id;
   const input=document.createElement('input');input.type='checkbox';input.value=id;input.setAttribute('aria-label','Chọn '+name);
   const pict=document.createElement('span');pict.className='ps-icon';pict.append(svg(icon));
   const copy=document.createElement('span');copy.className='ps-copy';
   const strong=document.createElement('strong');strong.textContent=name;
   const small=document.createElement('small');small.textContent=detail;
   const mark=document.createElement('span');mark.className='ps-check';mark.setAttribute('aria-hidden','true');mark.textContent='✓';
   copy.append(strong,small);label.append(input,pict,copy,mark);group.options.append(label);
   input.addEventListener('change',()=>{if(input.checked)selected.add(id);else selected.delete(id);persist();renderCount();});
  }
  group.picker.querySelector('#'+group.prefix+'SelectAll').addEventListener('click',()=>{for(const m of group.modes)selected.add(m[0]);persist();renderCount();});
  group.picker.querySelector('#'+group.prefix+'ClearAll').addEventListener('click',()=>{for(const m of group.modes)selected.delete(m[0]);persist();renderCount();});
  group.start.addEventListener('click',()=>begin(group));
  group.disclosure.addEventListener('toggle',()=>{if(group.disclosure.open)for(const other of groups)if(other!==group)other.disclosure.open=false;});
 }
 renderCount();
 function level(){
  const v=document.querySelector('.filter-btn[data-filter].active')?.dataset.filter;
  const n=Number(v)||Number(window.HSKPlanner?.plan?.target)||3;
  return n>=1&&n<=6?n:3;
 }
 function updateLevel(){for(const group of groups)group.picker.querySelector('.ps-level').textContent='HSK '+level();}
 updateLevel();window.addEventListener('hsk-plan-change',updateLevel);
 function banner(){
  const el=document.createElement('div');el.id='practiceSessionBar';el.className='ps-session-bar';el.hidden=true;
  el.innerHTML='<div class="ps-session-label"><strong id="practiceSessionStep"></strong><span id="practiceSessionName"></span></div><div class="ps-session-actions"><button type="button" id="practiceSessionStop">Kết thúc</button><button type="button" id="practiceSessionNext">Chế độ tiếp →</button></div>';
  const main=document.querySelector('main.workspace');main.prepend(el);
  el.querySelector('#practiceSessionStop').addEventListener('click',stop);
  el.querySelector('#practiceSessionNext').addEventListener('click',next);
  return el;
 }
 const bar=banner();
 function updateBar(visible=true){
  bar.hidden=!session||!visible;if(!session)return;
  const id=session.routes[session.index];
  bar.querySelector('#practiceSessionStep').textContent='Lượt '+session.group.name+' '+(session.index+1)+' / '+session.routes.length;
  bar.querySelector('#practiceSessionName').textContent=MODES.find(m=>m[0]===id)?.[1]||'Luyện tập';
  bar.querySelector('#practiceSessionNext').textContent=session.index===session.routes.length-1?'Hoàn thành ✓':'Chế độ tiếp →';
 }
 function clickCard(text){
  const card=[...document.querySelectorAll('#studioPractice .hub-card')].find(c=>c.querySelector('strong')?.textContent?.includes(text)||c.textContent.includes(text));
  if(card){card.click();return true;}return false;
 }
 function launch(id){
  if(id==='writing'){window.HSKStudio?.navigate('practice');if(window.HSKWritingPractice?.open)window.HSKWritingPractice.open();else clickCard('Học viết');}
  else if(id==='placement'){window.HSKStudio?.navigate('practice');clickCard('Đánh giá trình độ');}
  else if(id==='passive'){window.HSKStudio?.navigate('practice');clickCard('Học rảnh tay');}
  else {if(id==='real-reading')window.HSKRealReading?.leaveLesson?.();window.HSKStudio?.navigate(id);}
  updateBar();
 }
 function begin(group=groups[0]){
  const routes=group.modes.map(m=>m[0]).filter(id=>selected.has(id));
  if(!routes.length){group.hint.textContent='Hãy chọn ít nhất một chế độ.';return;}
  session={routes,index:0,group};group.hint.textContent='';group.disclosure.open=false;launch(routes[0]);
 }
 function stop(){
  session=null;updateBar();window.HSKStudio?.navigate('practice');
 }
 function next(){
  if(!session)return;
  if(session.index===session.routes.length-1){const group=session.group;stop();group.hint.textContent='Đã kết thúc lượt '+group.name+'. Bạn có thể chọn chế độ mới.';return;}
  session.index++;launch(session.routes[session.index]);
 }
 function onNavigate(route){
  updateLevel();
  if(!session)return;
  updateBar(route===session.routes[session.index]||route==='practice'||
   (session.routes[session.index]==='passive'&&route==='learn'));
 }
 window.addEventListener('hsk-account-ready',()=>{selected=new Set(restore());renderCount();stopIfNeeded();});
 function stopIfNeeded(){if(session){session=null;updateBar();}}
 function alignExistingIcons(){
  const cards=practice.querySelectorAll('.hub-card:not([data-ps-icon-ready])');
  for(const card of cards){
   card.dataset.psIconReady='true';
   let title=card.querySelector('.hub-content strong')?.textContent?.trim();
   if(!title){title=card.id==='writingPracticeOpen'?'Học viết':card.textContent.trim();}
   const kind=title.includes('rảnh tay')?'headphones':title.includes('viết')?'pen':title.includes('trình độ')?'chart':title.includes('Luyện theo')?'clipboard':title.includes('Đối chiếu')?'match':title.includes('Sắp xếp')?'order':title.includes('Flashcard')||title.includes('Thẻ từ')?'cards':title.includes('Trắc nghiệm')?'check':title.includes('nhầm')?'compare':title.includes('SRS')?'repeat':title.includes('câu sai')?'target':'clipboard';
   let holder=card.querySelector('.hub-symbol,.hub-visual');
   if(!holder){holder=document.createElement('span');holder.className='hub-symbol lilac';const content=document.createElement('span');content.className='hub-content';const strong=document.createElement('strong');strong.textContent=title;content.append(strong);card.replaceChildren(holder,content);}
   holder.replaceChildren(svg(kind));holder.classList.add('ps-hub-icon');
  }
 }
 alignExistingIcons();
 const containers=[...practice.querySelectorAll('.hub-cards')];
 for(const container of containers)new MutationObserver(alignExistingIcons).observe(container,{childList:true});
 window.HSKPracticeSelection={start:begin,next,stop,onNavigate,get selected(){return [...selected]},get active(){return session?.routes||[]}};
})();
