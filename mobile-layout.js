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
 menu.addEventListener('click',openDrawer);$('levelPill').addEventListener('click',openDrawer);$('drawerClose').addEventListener('click',()=>closeDrawer());$('drawerScrim').addEventListener('click',()=>closeDrawer());
 $('aboutBtn').addEventListener('click',()=>{about.hidden=false;body.classList.add('show-about');closeDrawer(false);workspace.scrollTop=0;});
 document.querySelector('.app-tabs').addEventListener('click',()=>{hideAbout();workspace.scrollTop=0;});
 drawer.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{hideAbout();closeDrawer();workspace.scrollTop=0;}));
 document.addEventListener('keydown',event=>{if(event.key==='Escape')closeDrawer();if(event.key==='Tab'&&body.classList.contains('drawer-open')){const focusable=Array.from(drawer.querySelectorAll('button,a,input,select')).filter(el=>!el.disabled&&!el.closest('[inert]')&&el.getClientRects().length),first=focusable[0],last=focusable.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}});
 // Programmatic navigation (reviewing mistakes, SRS, opening related words).
 const sync=()=>{if(!about.hidden&&document.querySelector('.app-tabs [data-mode].active')?.dataset.mode!==previousMode)hideAbout();previousMode=document.querySelector('.app-tabs [data-mode].active')?.dataset.mode;};
 let previousMode=document.querySelector('.app-tabs [data-mode].active')?.dataset.mode;new MutationObserver(sync).observe(document.querySelector('.app-tabs'),{subtree:true,attributes:true,attributeFilter:['class']});
})();
