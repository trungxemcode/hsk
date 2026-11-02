(()=>{
 // Some iOS Home Screen sessions report a zero inset while drawing the status bar over content.
 const iosDevice=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1),standalone=window.matchMedia('(display-mode: standalone)');
 function updateSafeArea(){document.body.classList.toggle('ios-standalone',iosDevice&&(navigator.standalone===true||standalone.matches));}
 updateSafeArea();standalone.addEventListener?.('change',updateSafeArea);window.addEventListener('pageshow',updateSafeArea);

 const $=id=>document.getElementById(id),body=document.body,drawer=$('drawer'),menu=$('menuBtn'),about=$('aboutPanel'),workspace=document.querySelector('.workspace');
 const filterToggle=$('hskFilterToggle'),filterContent=$('hskFilterContent');
 filterToggle.addEventListener('click',()=>{const expanded=filterToggle.getAttribute('aria-expanded')!=='true';filterToggle.setAttribute('aria-expanded',String(expanded));filterContent.inert=!expanded;});
 function hideAbout(){about.hidden=true;body.classList.remove('show-about');}
 function closeDrawer(restore=true){if(!body.classList.contains('drawer-open'))return;body.classList.remove('drawer-open');drawer.inert=true;drawer.setAttribute('aria-hidden','true');menu.setAttribute('aria-expanded','false');if(restore)menu.focus();}
 function openDrawer(){body.classList.add('drawer-open');drawer.inert=false;drawer.setAttribute('aria-hidden','false');menu.setAttribute('aria-expanded','true');$('drawerClose').focus();}

 const phone=matchMedia('(max-width:720px), (orientation:landscape) and (max-height:500px) and (pointer:coarse)'),pill=$('levelPill'),filterButtons=drawer.querySelector('.filter-buttons'),filterHome=document.createComment('HSK filter original');
 filterButtons.before(filterHome);
 const filterDialog=document.createElement('dialog');filterDialog.id='mobileHSKFilter';filterDialog.className='mobile-ux-sheet mobile-hsk-filter';filterDialog.setAttribute('aria-labelledby','mobileHSKFilterTitle');
 const filterHead=document.createElement('header');filterHead.className='mobile-sheet-head';const filterTitle=document.createElement('h2');filterTitle.id='mobileHSKFilterTitle';filterTitle.textContent='Bộ lọc HSK';filterTitle.tabIndex=-1;
 const filterClose=document.createElement('button');filterClose.type='button';filterClose.id='mobileHSKFilterClose';filterClose.textContent='Đóng';filterClose.addEventListener('click',()=>filterDialog.close());filterHead.append(filterTitle,filterClose);
 const filterHint=document.createElement('p');filterHint.className='hint';filterHint.textContent='Áp dụng cho thẻ từ vựng, tra cứu, trắc nghiệm và ôn tập.';filterDialog.append(filterHead,filterHint);body.append(filterDialog);
 function openFilter(){closeDrawer(false);filterDialog.append(filterButtons);pill.setAttribute('aria-expanded','true');filterDialog.showModal();filterTitle.focus({preventScroll:true});}
 filterDialog.addEventListener('close',()=>{filterHome.after(filterButtons);pill.setAttribute('aria-expanded','false');if(phone.matches)pill.focus({preventScroll:true});});
 filterButtons.addEventListener('click',e=>{if(e.target.closest('[data-filter]')&&filterDialog.open)filterDialog.close();});
 filterDialog.addEventListener('click',e=>{const r=filterDialog.getBoundingClientRect();if(e.target===filterDialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))filterDialog.close();});
 const aboutButton=$('aboutBtn'),aboutGroup=aboutButton.closest('.drawer-group'),aboutHome=document.createComment('About menu original');aboutButton.before(aboutHome);aboutGroup.classList.add('drawer-about-group');
 function syncMobileMenu(){if(phone.matches){$('accountBtn').parentElement.append(aboutButton);pill.setAttribute('aria-haspopup','dialog');pill.setAttribute('aria-controls',filterDialog.id);pill.setAttribute('aria-expanded',String(filterDialog.open));}else{if(filterDialog.open)filterDialog.close();aboutHome.after(aboutButton);pill.removeAttribute('aria-haspopup');pill.removeAttribute('aria-controls');pill.removeAttribute('aria-expanded');}}
 phone.addEventListener('change',syncMobileMenu);syncMobileMenu();


 menu.addEventListener('click',openDrawer);$('levelPill').addEventListener('click',()=>phone.matches?openFilter():openDrawer());$('drawerClose').addEventListener('click',()=>closeDrawer());$('drawerScrim').addEventListener('click',()=>closeDrawer());
 $('aboutBtn').addEventListener('click',()=>{about.hidden=false;body.classList.add('show-about');closeDrawer(false);workspace.scrollTop=0;});
 document.querySelector('.app-tabs').addEventListener('click',()=>{hideAbout();workspace.scrollTop=0;});
 drawer.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{hideAbout();closeDrawer();workspace.scrollTop=0;}));
 drawer.querySelectorAll('[data-drawer-mode]').forEach(button=>button.addEventListener('click',()=>{
  hideAbout();closeDrawer();document.querySelector(`.app-tabs [data-mode="${button.dataset.drawerMode}"]`)?.click();workspace.scrollTop=0;
 }));
 document.addEventListener('keydown',event=>{if(event.key==='Escape')closeDrawer();if(event.key==='Tab'&&body.classList.contains('drawer-open')){const focusable=Array.from(drawer.querySelectorAll('button,a,input,select')).filter(el=>!el.disabled&&!el.closest('[inert]')&&el.getClientRects().length),first=focusable[0],last=focusable.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}});
 // Programmatic navigation (reviewing mistakes, SRS, opening related words).
 const sync=()=>{if(!about.hidden&&document.querySelector('.app-tabs [data-mode].active')?.dataset.mode!==previousMode)hideAbout();previousMode=document.querySelector('.app-tabs [data-mode].active')?.dataset.mode;};
 let previousMode=document.querySelector('.app-tabs [data-mode].active')?.dataset.mode;new MutationObserver(sync).observe(document.querySelector('.app-tabs'),{subtree:true,attributes:true,attributeFilter:['class']});
})();
