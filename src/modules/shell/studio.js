(function(){
'use strict';
const iconPaths={
'house':'<path d="m3 10 9-7 9 7"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-7h6v7"/>',
'book-open':'<path d="M12 7v14"/><path d="M3 18V5a2 2 0 0 1 2-2h3a4 4 0 0 1 4 4 4 4 0 0 1 4-4h3a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2h-3a4 4 0 0 0-4 4 4 4 0 0 0-4-4H5a2 2 0 0 0-2 2Z"/>',
'pencil-ruler':'<path d="m15 5 4 4M3 21l4.8-1.2L20.1 7.5a2.2 2.2 0 0 0-3.1-3.1L4.7 16.7 3 21Z"/><path d="m11 7 6 6M10 17l-3-3"/>',
'x':'<path d="m6 6 12 12M18 6 6 18"/>',
'languages':'<path d="M3 5h12M9 3v2M5 5c0 6 6 10 9 11M13 5c0 6-6 10-10 11M14 21l4-10 4 10M15.5 17h5"/>',
'refresh-cw':'<path d="M20 11a8 8 0 0 0-14-5L4 8"/><path d="M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14 5l2-2"/><path d="M20 20v-4h-4"/>',
'search':'<circle cx="11" cy="11" r="7.3"/><path d="m16.4 16.4 4 4"/>',
'layers':'<path d="m12 3 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5"/>',
'list-checks':'<path d="m3 6 1.5 1.5L7 5M10 6h11M3 12l1.5 1.5L7 11M10 12h11M3 18l1.5 1.5L7 17M10 18h11"/>',
'calendar-clock':'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/><circle cx="14" cy="16" r="3"/><path d="M14 14.5V16l1 1"/>',
'target':'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
'split':'<path d="m3 5 5 5M8 10H3M8 10V5M21 19l-5-5M16 14h5M16 14v5M14 3l7 7M3 14l7 7"/>',
'sparkles':'<path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3ZM19 17l.7 2.3L22 20l-2.3.7L19 23l-.7-2.3L16 20l2.3-.7L19 17Z"/>',
'menu':'<path d="M4 6h16M4 12h16M4 18h16"/>',
'graduation-cap':'<path d="m2 9 10-5 10 5-10 5-10-5Z"/><path d="M6 11v5a6 6 0 0 0 12 0v-5M22 9v8"/>',
'chevron-down':'<path d="m6 9 6 6 6-6"/>',
'arrow-up-right':'<path d="M7 17 17 7M8 7h9v9"/>',
'arrow-right':'<path d="M5 12h14m-7-7 7 7-7 7"/>',
'volume-2':'<path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>',
'headphones':'<path d="M4 13v-2a8 8 0 0 1 16 0v2M4 13h4v8H6a2 2 0 0 1-2-2v-6ZM20 13h-4v8h2a2 2 0 0 0 2-2v-6Z"/>',
'layout-grid':'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
'circle-help':'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 1c0 2-2.5 2.1-2.5 4"/><path d="M12 17h.01"/>',
'mouse-pointer-click':'<path d="m5 3 12 8-6 1-2.5 6L5 3ZM16 2v3M19 5l2-2M19 12h3"/>',
'sliders-horizontal':'<path d="M3 7h8M15 7h6M3 17h3M10 17h11"/><circle cx="13" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
'lightbulb':'<path d="M9 18h6M10 21h4M9 15c-1.5-1.2-3-2.4-3-5a6 6 0 1 1 12 0c0 2.6-1.5 3.8-3 5l-.5 1H9.5L9 15Z"/>',
'arrow-left-right':'<path d="M3 7h18m-5-4 5 4-5 4M21 17H3m5-4-5 4 5 4"/>',
'network':'<rect x="9" y="3" width="6" height="5" rx="1"/><rect x="2" y="16" width="6" height="5" rx="1"/><rect x="16" y="16" width="6" height="5" rx="1"/><path d="M12 8v4M5 16v-4h14v4"/>',
'shuffle':'<path d="m18 14 4 4-4 4M2 18h3a4 4 0 0 0 3.2-1.6l7.6-9.8A4 4 0 0 1 19 5h3m-4-3 4 3-4 3M2 6h3a4 4 0 0 1 3.2 1.6l1.4 1.8M14.5 16.4l1.3 1.7A4 4 0 0 0 19 20h3"/>',
'rotate-ccw':'<path d="M3 11a9 9 0 1 1 3 7M3 4v7h7"/>',
'pen-line':'<path d="M18 4a3 3 0 0 1 2 5L9 20l-6 1 1-6L15 4a3 3 0 0 1 3 0Z"/>',
'user':'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
'mail':'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
'lock':'<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
'eye':'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
'eye-off':'<path d="M3 3l18 18M10.6 5.1A9.8 9.8 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.5 6.6A16.7 16.7 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 4.4-1M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
'log-out':'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
'repeat-2':'<path d="m17 2 4 4-4 4M3 11V8a2 2 0 0 1 2-2h16M7 22l-4-4 4-4M21 13v3a2 2 0 0 1-2 2H3"/>',
};
function renderIcons(){document.querySelectorAll('[data-icon]').forEach(el=>{const key=el.getAttribute('data-icon');if(iconPaths[key]){el.innerHTML=`<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${iconPaths[key]}</svg>`}})}
renderIcons();
 const themeButton=document.createElement('button');themeButton.type='button';themeButton.id='themeToggle';themeButton.className='theme-button';document.querySelector('.topbar-actions').prepend(themeButton);
 function setTheme(mode){document.documentElement.dataset.theme=mode;const dark=mode==='dark';themeButton.setAttribute('aria-pressed',String(dark));themeButton.setAttribute('aria-label',dark?'Bật chế độ sáng':'Bật chế độ tối');themeButton.title=dark?'Chế độ sáng':'Chế độ tối';themeButton.innerHTML=dark?'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/></svg>';const surface=getComputedStyle(document.documentElement).getPropertyValue('--paper').trim();if(surface)document.querySelectorAll('meta[name="theme-color"]').forEach(m=>m.content=surface);}
 setTheme(document.documentElement.dataset.theme==='dark'?'dark':'light');themeButton.addEventListener('click',()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';setTheme(next);try{localStorage.setItem('hsk-theme-v1',next);}catch{}});window.addEventListener('storage',e=>{if(e.key==='hsk-theme-v1')setTheme(e.newValue==='dark'?'dark':'light');});
 const $=id=>document.getElementById(id),main=document.querySelector('.workspace');
 function decorateControls(){main.querySelectorAll('.panel-box button:not(.speech-button):not(.mastery-btn)').forEach(b=>b.classList.add('studio-action'));}
 decorateControls();new MutationObserver(decorateControls).observe(main,{subtree:true,childList:true});
 const labels={'real-reading':'Đọc thực tế','study4':'Luyện thi HSK','match-game':'Đối chiếu 3 cột','sentence-game':'Sắp xếp câu',home:'Trang chủ',notebook:'Sổ từ vựng',lessons:'Bài học',practice:'Luyện & Ôn',exam:'Bài tập HSK',review:'Luyện & Ôn',search:'Tra cứu',learn:'Thẻ từ vựng',quiz:'Trắc nghiệm',mistakes:'Ôn câu sai',compare:'Từ dễ nhầm',srs:'Ôn theo lịch',account:'Tài khoản',translator:'Dịch câu / Đọc ảnh',admin:'Dashboard học viên',about:'Giới thiệu'};
 const parents={'real-reading':'lessons','study4':'practice','match-game':'practice','sentence-game':'practice',learn:'practice',quiz:'practice',compare:'practice',exam:'practice',srs:'practice',mistakes:'practice',translator:'search',about:'home'};
 labels.music='Nghe nhạc học HSK';labels['music-play']='Nghe nhạc giải trí';
 let ready=false,route='home',lastOwner='',fingerprint='',activityTimer,refreshTimer,lastGoalScope='';
 function read(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'null')||fallback;}catch{return fallback;}}
 function owner(){return read('hsk-account-meta-v1',{}).uid||'guest';}
 function dictionary(){try{return typeof words!=='undefined'?words:[];}catch{return [];}}
 function key(w){return w.learningKey||`${w.hsk}|${w.han}|${w.pin}`;}
 function progress(){return read('hsk-flashcards-progress-v1',{}).words||{};}
 function studyGoal(){
  const value=window.HSKPlanner?.plan?.target??read('hsk-studio-target-v1:'+owner(),null);
  const level=Number(value);
  return Number.isInteger(level)&&level>=1&&level<=6?level:null;
 }
 function syncGoalScope(){
  const level=studyGoal(),signature=owner()+':'+level;
  if(!level||!window.HSKLearningFilter||signature===lastGoalScope)return;
  if(!window.HSKLearningFilter.select(level))return;
  lastGoalScope=signature;
  window.HSKLessonNav?.setPreferredLevel?.(level);
  refresh();
 }
 function clearHub(){delete document.body.dataset.studioHub;document.querySelectorAll('[data-studio-hub-panel]').forEach(p=>p.hidden=true);}
 function closeDrawer(){document.body.classList.remove('drawer-open');$('drawer').inert=true;$('drawer').setAttribute('aria-hidden','true');$('menuBtn').setAttribute('aria-expanded','false');}
 function title(name){
  route=name;
  $('activeTitle').textContent=(['search','translator'].includes(name)&&searchNames[document.body.dataset.searchTool])||labels[name]||'HSK Flashcards';
  document.querySelectorAll('[data-studio-go],[data-search-tool]').forEach(b=>{
   // "translator" belongs to the global Search section, but is a distinct local tab.
   const localTab=!!b.closest('.studio-search-tabs');
   const selected=localTab?b.dataset.searchTool===(document.body.dataset.searchTool||(name==='translator'?'translate':'vocabulary')):b.dataset.studioGo===(parents[name]||name);
   b.classList.toggle('active',selected);
   if(localTab)b.setAttribute('aria-pressed',String(selected));
   if(selected)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
  });
 }
 function coreView(){for(const [cls,name] of [['show-account','account'],['show-admin','admin'],['show-translator','translator'],['show-about','about'],['show-lessons','lessons']])if(document.body.classList.contains(cls))return name;return document.querySelector('.app-tabs [data-mode].active')?.dataset.mode||'learn';}
 const searchNames={vocabulary:'Tra cứu',handwriting:'Vẽ chữ',translate:'Dịch câu',image:'Đọc ảnh'};
 function chooseSearchTool(tool){
  if(!searchNames[tool])return;
  const target=tool==='translate'||tool==='image'?'translator':'search';if(coreView()!==target)navigate(target);
  document.body.dataset.searchTool=tool;
  if(tool==='handwriting'&&$('handwritingPanel').hidden&&!$('handwritingOpen').disabled)$('handwritingOpen').onclick?.();
  if(tool==='vocabulary'&&!$('handwritingPanel').hidden)$('handwritingClose').click();
  if(tool==='image')document.querySelector('.ocr-panel').open=true;
  title(tool==='translate'||tool==='image'?'translator':'search');
 }
 let pendingMusic='',musicWaitTimer=0,musicWaitControls=[];
 function clearMusicWait(failed=false){clearTimeout(musicWaitTimer);pendingMusic='';for(const [node,small,label] of musicWaitControls){node.removeAttribute('aria-busy');node.classList.remove('music-entry-pending');if(small)small.textContent=failed?'Chưa mở được. Chạm để thử lại.':label;}musicWaitControls=[];}
 function earlyMusicHome(){if(!ready&&!pendingMusic&&!['account','translator','about','admin'].includes(route)&&(!document.body.dataset.studioHub||document.body.dataset.studioHub==='home')){document.body.dataset.studioHub='home';$('studioHome').hidden=false;title('home');refresh();}}
 window.addEventListener('hsk-music-ready',()=>{const next=pendingMusic;clearMusicWait();if(next)navigate(next);else earlyMusicHome();});
 window.addEventListener('hsk-music-load-error',()=>clearMusicWait(true));
 function navigate(name){
  const musicRoute=name==='music'||name==='music-play';
  if(musicRoute&&!window.HSKMusic){clearMusicWait();pendingMusic=name;document.querySelectorAll('[data-studio-go="'+name+'"]').forEach(node=>{const small=node.querySelector('small');musicWaitControls.push([node,small,small?.textContent||'']);node.setAttribute('aria-busy','true');node.classList.add('music-entry-pending');if(small)small.textContent='Đang mở trình phát…';});musicWaitTimer=setTimeout(()=>clearMusicWait(true),20000);window.HSKMusicLoad?.start();return;}
  clearMusicWait();
  if(name==='review')name='practice';
  if(!ready&&!['account','translator','about','admin','music','music-play'].includes(name))return;
  if(name==='search'&&!$('handwritingPanel').hidden)$('handwritingClose').click();
  if(name==='search'||name==='translator')document.body.dataset.searchTool=name==='search'?'vocabulary':'translate';
  clearHub();
  if(['home','practice','review','exam','notebook','match-game','sentence-game','study4','real-reading','music','music-play'].includes(name)){
   const hub=name==='music-play'?'music':name;
   document.querySelector('.app-tabs [data-mode="learn"]').click();document.body.classList.remove('show-lessons','lesson-focus');document.body.dataset.studioHub=hub;document.querySelector(`[data-studio-hub-panel="${hub}"]`).hidden=false;title(name);
  }else{const special={account:'accountBtn',translator:'translatorBtn',admin:'adminBtn',about:'aboutBtn'};const trigger=special[name]?$(special[name]):document.querySelector(`.app-tabs [data-mode="${name}"]`);if(!trigger||trigger.hidden)return;trigger.click();title(name);}
  closeDrawer();if(musicRoute)main.scrollTo({top:0,behavior:'instant'});else main.scrollTop=0;window.scrollTo({top:0,behavior:musicRoute?'instant':window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});refresh();if(name==='exam')window.dispatchEvent(new Event('hsk-exam-open'));if(name==='match-game'||name==='sentence-game')window.HSKPracticeGames?.start(name);if(name==='study4')window.HSKStudy4?.open();if(name==='real-reading')window.HSKRealReading?.enter();if(name==='music'||name==='music-play'){window.HSKMusic?.enter(name==='music-play'?'chill':'study');$('musicPanel')?.querySelector('.music-stage')?.scrollTo({top:0,behavior:'instant'});}window.HSKPracticeSelection?.onNavigate?.(name);
 }
 window.addEventListener('hsk-lesson-context',()=>refresh());
 function snapshot(){return ['hsk-flashcards-progress-v1','hsk-flashcards-mistakes-v1','hsk-course-lessons-v1','hsk-adaptive-learning-v1','hsk-exam-practice-v1'].map(k=>localStorage.getItem(k)||'').join('|');}
 function day(timestamp){return new Date(timestamp+7*3600000).toISOString().slice(0,10);}
 function activity(){const a=window.HSKStudyStore.activity();return {version:1,days:a.days&&typeof a.days==='object'&&!Array.isArray(a.days)?a.days:{},hours:Array.isArray(a.hours)&&a.hours.length===24?a.hours.map(n=>Number.isFinite(n)&&n>=0?n:0):Array(24).fill(0)};}
 function recordActivity(){
  const who=owner(),next=snapshot();if(who!==lastOwner){lastOwner=who;fingerprint=next;return;}if(next===fingerprint)return;fingerprint=next;
  const a=activity(),now=Date.now(),date=day(now),hour=new Date(now+7*3600000).getUTCHours();
  const sorted=Object.keys(a.days).sort();for(const old of sorted.slice(0,Math.max(0,sorted.length-370)))delete a.days[old];
  try{window.HSKStudyStore.recordActivity(now);}catch{}refresh();
 }
 function refresh(){
  document.querySelectorAll('.filter-btn[data-filter]').forEach(b=>{
   const match=b.textContent.match(/\((\d+)\)$/);
   if(match&&!b.querySelector('.studio-filter-label')){const label=document.createElement('span'),count=document.createElement('small');label.className='studio-filter-label';label.textContent=b.dataset.filter==='all'?'Tất cả HSK':'HSK '+b.dataset.filter;count.className='studio-filter-count';count.textContent=Number(match[1]).toLocaleString('vi-VN')+' từ';b.replaceChildren(label,count);}
   b.setAttribute('aria-pressed',String(b.classList.contains('active')));
  });
  const who=owner();if(lastOwner!==who){lastOwner=who;fingerprint=snapshot();}
  const selected=Number(window.HSKPlanner?.plan?.target??read('hsk-studio-target-v1:'+who,5));const level=Number.isInteger(selected)&&selected>=1&&selected<=6?selected:5;
  $('studioTargetLevel').value=String(level);$('studioTarget').textContent='HSK '+level;$('studioProgressLabel').textContent='HSK '+level;
  const all=dictionary(),r=progress(),pool=all.filter(w=>Number(w.hsk)===level),known=pool.filter(w=>r[key(w)]?.status==='known').length,percent=pool.length?Math.round(known*100/pool.length):0;
  $('studioProgressPercent').textContent=percent+'% / 100%';$('studioProgressFill').style.width=percent+'%';$('studioProgress').setAttribute('aria-valuenow',String(percent));$('studioKnownCount').textContent=pool.length?`${known} / ${pool.length} mục từ đã thuộc · theo dữ liệu của app`:'Đang tải bộ từ vựng…';
  const a=activity(),now=Date.now(),today=day(now),yesterday=day(now-86400000);let cursor=a.days[today]?today:a.days[yesterday]?yesterday:null,streak=0;
  while(cursor&&a.days[cursor]){streak++;cursor=day(Date.parse(cursor+'T00:00:00Z')-7*3600000-86400000);}
  $('studioStreak').textContent=streak+' ngày';$('studioStreakNote').textContent=owner()==='guest'?'Hoạt động học trên thiết bị · chưa đăng nhập':'Tính từ các ngày học đã ghi và dữ liệu tài khoản đã áp dụng';
  const hours=Array.isArray(a.hours)&&a.hours.length===24?a.hours:Array(24).fill(0),peak=Math.max(...hours),hour=hours.indexOf(peak);
  $('studioHour').textContent=peak?String(hour).padStart(2,'0')+':00':'—';$('studioHourNote').textContent=peak?'Khung giờ có nhiều thao tác học · UTC+7':'Chưa có dữ liệu giờ học';
  const week=$('studioWeek');week.replaceChildren();for(let i=6;i>=0;i--){const date=day(now-i*86400000),cell=document.createElement('div');cell.className='account-day'+(a.days[date]?' is-studied':'');const b=document.createElement('b');b.textContent=a.days[date]?'✓':'·';cell.append(b,document.createTextNode(new Date(date+'T00:00:00Z').toLocaleDateString('vi-VN',{weekday:'short',timeZone:'UTC'})));week.append(cell);}
  $('studioHomeWords').textContent=all.length.toLocaleString('vi-VN');$('studioHomeDue').textContent=String(Object.values(r).filter(x=>Number.isFinite(x.due)&&x.due<=now).length);
  const admin=$('adminBtn');$('studioAdminLink').hidden=admin.hidden;
  const filter=document.body.classList.contains('show-lessons')?$('lessonsPanel').dataset.lessonLevel||'1':document.querySelector('[data-filter].active')?.dataset.filter||'all';$('studioLevelText').textContent=filter==='all'?'Tất cả HSK':'HSK '+filter;
 }
 document.querySelectorAll('[data-studio-go]').forEach(b=>b.addEventListener('click',()=>b.dataset.searchTool?chooseSearchTool(b.dataset.searchTool):navigate(b.dataset.studioGo)));
 document.querySelectorAll('[data-search-tool]:not([data-studio-go])').forEach(b=>b.addEventListener('click',()=>chooseSearchTool(b.dataset.searchTool)));
 const syncHandwritingTools=()=>document.querySelectorAll('[data-search-tool="handwriting"]').forEach(b=>{if(b!==$('handwritingOpen'))b.disabled=$('handwritingOpen').disabled;});
 new MutationObserver(syncHandwritingTools).observe($('handwritingOpen'),{attributes:true,attributeFilter:['disabled']});syncHandwritingTools();
 $('handwritingClose').addEventListener('click',()=>{document.body.dataset.searchTool='vocabulary';title('search');document.querySelector('#searchPanel [data-search-tool="vocabulary"]').focus({preventScroll:true});});
 $('handwritingMeaningSearch').addEventListener('click',()=>chooseSearchTool('vocabulary'));
 $('ocrUse').addEventListener('click',()=>{const text=$('ocrText').value.trim();if(text&&text.length<=500)chooseSearchTool('translate');},true);
 window.HSKSearchTools={open:chooseSearchTool};
 window.addEventListener('hsk-image-translated',()=>{document.body.dataset.searchTool='image';title('translator');});
 $('levelPill').replaceChildren();const levelText=document.createElement('span');levelText.id='studioLevelText';levelText.textContent='Tất cả HSK';$('levelPill').append(levelText);
 document.querySelectorAll('.app-tabs button,#accountBtn,#translatorBtn,#adminBtn,#aboutBtn,[data-filter]').forEach(b=>b.addEventListener('click',()=>{clearHub();queueMicrotask(()=>{if(!document.body.dataset.studioHub)title(coreView());refresh();});},true));
 new MutationObserver(()=>{if(!document.body.dataset.studioHub)title(coreView());}).observe(document.body,{attributes:true,attributeFilter:['class']});
 new MutationObserver(()=>{if(!document.body.dataset.studioHub)title(coreView());}).observe(document.querySelector('.app-tabs'),{subtree:true,attributes:true,attributeFilter:['class']});
 new MutationObserver(refresh).observe(document.querySelector('.filter-buttons'),{subtree:true,attributes:true,attributeFilter:['class']});
 new MutationObserver(refresh).observe($('adminBtn'),{attributes:true,attributeFilter:['hidden']});
 $('studioTargetLevel').addEventListener('change',()=>{const target=Number($('studioTargetLevel').value);if(window.HSKPlanner?.setTarget){if(!window.HSKPlanner.setTarget(target))$('accountStatus').textContent='Chưa lưu được mục tiêu. Kế hoạch cũ vẫn được giữ.';}else try{localStorage.setItem('hsk-studio-target-v1:'+owner(),JSON.stringify(target));}catch{}refresh();});
 window.addEventListener('hsk-plan-change',()=>{syncGoalScope();refresh();});
 window.addEventListener('hsk-lessons-ready',syncGoalScope);
 window.addEventListener('hsk-account-ready',()=>{lastGoalScope='';queueMicrotask(syncGoalScope);});
 document.addEventListener('click',event=>{if(!ready)return;const panel=event.target.closest('#learnPanel,#quizPanel,#srsPanel,#lessonsPanel,#mistakesPanel,#examPractice');if(panel&&event.target.closest('button')){clearTimeout(activityTimer);activityTimer=setTimeout(recordActivity,120);}},true);
 window.addEventListener('storage',()=>{refresh();});window.addEventListener('hsk-account-ready',()=>{lastOwner=owner();fingerprint=snapshot();refresh();});
 // The existing updater owns activation and download readiness; hidden means disabled here.
 const update=$('offlineUpdate');function updateAvailability(){if(update.hidden)update.disabled=true;}
 updateAvailability();new MutationObserver(updateAvailability).observe(update,{attributes:true,attributeFilter:['hidden']});
 fetch('./app-version.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(m=>{$('studioVersion').textContent=m.label||m.version;}).catch(()=>{$('studioVersion').textContent='Chưa đọc được phiên bản · kiểm tra kết nối';});
 fetch('./lessons-data.json').then(r=>r.json()).then(data=>{const count=(data.courses||[]).reduce((sum,c)=>sum+(c.lessons||[]).length,0);$('studioHomeLessons').textContent=count?String(count):'—';}).catch(()=>{$('studioHomeLessons').textContent='—';});
 function init(){if(ready)return;ready=true;lastOwner=owner();fingerprint=snapshot();if(!pendingMusic&&!['music','music-play'].includes(route))navigate(location.hash.startsWith('#lesson/')?'lessons':'home');if(location.hash.startsWith('#lesson/'))window.HSKLessonNav?.open();refreshTimer=setInterval(()=>{if(!document.hidden)refresh();},30000);}
 window.addEventListener('hsk-lessons-ready',init);if(window.HSKLessons)init();
 window.addEventListener('pagehide',()=>{clearInterval(refreshTimer);clearTimeout(activityTimer);});
 window.HSKStudio={navigate,refresh};if(window.HSKMusic)earlyMusicHome();
})();
