'use strict';
// Desktop tools share the workspace; phone retains its original native modal.
window.HSKFeaturePage=(id,route)=>{
 const page=document.createElement('dialog');page.id=id;
 const modalOpen=page.showModal,close=page.close,show=page.show;
 const nativeOpen=()=>modalOpen.call(page),nativeClose=()=>close.call(page),nativeShow=()=>show.call(page);
 let desktop=false,transition=false;
 function presentation(){
  desktop=window.matchMedia('(min-width:721px)').matches;
  page.className=desktop?'panel hub-panel feature-page':'';if(desktop)page.setAttribute('role','region');else page.removeAttribute('role');
  if(desktop){page.dataset.studioHubPanel=route;document.querySelector('main.workspace').append(page);}else{delete page.dataset.studioHubPanel;document.body.append(page);}
  const back=page.querySelector(':scope>button');if(back)back.textContent=desktop?'Quay lại Luyện & Ôn':'Đóng';
 }
 page.showModal=()=>{presentation();page.hidden=false;if(desktop){if(!page.open)nativeShow();window.HSKStudio?.navigate(route);}else if(!page.open)nativeOpen();};
 page.close=()=>{nativeClose();if(desktop&&document.body.dataset.studioHub===route)window.HSKStudio?.navigate('practice');};
 new MutationObserver(()=>{if(desktop&&page.hidden&&page.open)nativeClose();}).observe(page,{attributes:true,attributeFilter:['hidden']});
 window.matchMedia('(min-width:721px)').addEventListener('change',()=>{if(!page.open)return;transition=true;nativeClose();if(desktop&&document.body.dataset.studioHub===route)window.HSKStudio?.navigate('practice');page.showModal();queueMicrotask(()=>{transition=false;});});
 // A responsive presentation change must not end an in-progress tool session.
 page.addEventListener('close',e=>{if(transition||page.open)e.stopImmediatePropagation();},true);
 presentation();if(desktop)page.hidden=true;return page;
};
