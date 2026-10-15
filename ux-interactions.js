/* Interaction layer: shortcuts, swipe, focus/scroll follow-up and status feedback.
   Every action here only clicks or focuses existing controls; learning logic and data stay in their owners. */
(function(){
'use strict';
const $=id=>document.getElementById(id),body=document.body;
const reduceMotion=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const finePointer=()=>window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;
const visible=el=>!!el&&!el.hidden&&!el.closest('[hidden]')&&el.getClientRects().length>0;
const typing=el=>!!el&&(el.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
const usable=el=>visible(el)&&!el.disabled;
function reveal(el,block='nearest'){if(!el?.scrollIntoView)return;try{el.scrollIntoView({block,inline:'nearest',behavior:reduceMotion()?'auto':'smooth'});}catch{el.scrollIntoView(false);}}
function hint(id,host,text,where='after'){if(!host||$(id))return;const p=document.createElement('p');p.id=id;p.className='ux-shortcut-hint';p.textContent=text;host[where](p);return p;}

/* Skip link: move keyboard focus past the shell without leaving a permanent tabindex on main. */
const main=document.querySelector('main.workspace');
if(main&&!document.querySelector('.skip-link')){
 main.id||=('studioMain');
 const skip=document.createElement('a');skip.className='skip-link';skip.href='#'+main.id;skip.textContent='Bỏ qua tới nội dung chính';
 skip.addEventListener('click',event=>{event.preventDefault();main.setAttribute('tabindex','-1');main.focus({preventScroll:true});main.addEventListener('blur',()=>main.removeAttribute('tabindex'),{once:true});});
 body.prepend(skip);
}

/* Network status: one short announcement on change; learning offline stays possible. */
const net=document.createElement('div');net.id='networkToast';net.className='network-toast';net.setAttribute('role','status');net.setAttribute('aria-live','polite');net.hidden=true;body.append(net);
let netTimer;
function announceNetwork(online){
 body.classList.toggle('is-offline',!online);
 net.dataset.state=online?'online':'offline';
 net.textContent=online?'Đã kết nối lại · AI, dịch và đồng bộ hoạt động trở lại.':'Đang ngoại tuyến · Bài học, thẻ từ và SRS vẫn dùng được; AI, dịch và đồng bộ cần mạng.';
 net.hidden=false;clearTimeout(netTimer);netTimer=setTimeout(()=>{net.hidden=true;},online?3500:6000);
}
window.addEventListener('offline',()=>announceNetwork(false));
window.addEventListener('online',()=>announceNetwork(true));
if(navigator.onLine===false)body.classList.add('is-offline');

/* Search: Escape clears a filled query without moving focus; never auto-focuses on navigation. */
document.addEventListener('keydown',event=>{
 const input=event.target;
 if(event.key!=='Escape'||input?.id!=='searchInput'||!input.value)return;
 event.preventDefault();event.stopPropagation();input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));
},true);

/* Flashcard: clearer example toggle state and a swipe gesture that reuses Trước / Tiếp. */
function setupFlashcard(){
 const card=$('flashcard'),example=$('example'),exampleBtn=$('exampleBtn');
 if(!card||card.dataset.uxReady)return;card.dataset.uxReady='1';
 if(example&&exampleBtn){
  exampleBtn.setAttribute('aria-controls','example');
  const label=exampleBtn.querySelector('.btn-label');
  const sync=()=>{const open=example.classList.contains('show');exampleBtn.setAttribute('aria-expanded',String(open));if(label)label.textContent=open?'Ẩn ví dụ':'Xem ví dụ';};
  sync();new MutationObserver(sync).observe(example,{attributes:true,attributeFilter:['class']});
 }
 const progress=$('progress');
 hint('flashcardShortcutHint',progress,'','after');
 const hintEl=$('flashcardShortcutHint');
 const hintText=()=>{if(hintEl)hintEl.textContent=finePointer()?'Phím tắt: ← → đổi thẻ · Space lật thẻ':'Chạm thẻ để lật · vuốt ngang để đổi thẻ';};
 hintText();window.matchMedia?.('(hover: hover) and (pointer: fine)').addEventListener?.('change',hintText);

 let pointer=null,startX=0,startY=0,dx=0,dragging=false,suppressClick=false,suppressTimer;
 const reset=()=>{pointer=null;dragging=false;dx=0;card.classList.remove('is-swiping');card.style.removeProperty('--swipe-x');};
 card.addEventListener('pointerdown',event=>{
  if(event.pointerType==='mouse'||event.isPrimary===false||event.target.closest('button,a,input,select,textarea,summary'))return;
  pointer=event.pointerId;startX=event.clientX;startY=event.clientY;dx=0;dragging=false;
 },{passive:true});
 card.addEventListener('pointermove',event=>{
  if(event.pointerId!==pointer)return;
  dx=event.clientX-startX;const dy=event.clientY-startY;
  if(!dragging&&Math.abs(dx)>14&&Math.abs(dx)>Math.abs(dy)*1.4){dragging=true;card.classList.add('is-swiping');}
  if(dragging&&!reduceMotion())card.style.setProperty('--swipe-x',Math.max(-56,Math.min(56,dx*.35)).toFixed(1)+'px');
 },{passive:true});
 card.addEventListener('pointerup',event=>{
  if(event.pointerId!==pointer)return;
  const go=dragging&&Math.abs(dx)>=56?(dx<0?$('next'):$('prev')):null;
  reset();
  if(go){suppressClick=true;clearTimeout(suppressTimer);suppressTimer=setTimeout(()=>{suppressClick=false;},450);if(!go.disabled)go.click();}
 });
 card.addEventListener('pointercancel',reset);
 card.addEventListener('click',event=>{if(suppressClick){suppressClick=false;event.preventDefault();event.stopImmediatePropagation();}},true);
}

/* Quiz: keep the result and the next step in view; return to the new question after advancing. */
function setupQuiz(){
 const next=$('quizNext'),options=$('quizOptions'),progress=$('quizProgress');
 if(!next||!options||next.dataset.uxReady)return;next.dataset.uxReady='1';
 next.setAttribute('aria-keyshortcuts','Enter');
 hint('quizShortcutHint',$('quizForm'),'Phím tắt: 1–4 hoặc A–D chọn đáp án · Enter sang câu tiếp','after');
 let answered=false;
 new MutationObserver(()=>{
  if(!visible($('quizPanel')))return;
  if(!next.hidden&&options.querySelector('button:disabled')){
   if(answered)return;answered=true;
   requestAnimationFrame(()=>{reveal(next);const active=document.activeElement;if(!active||active===body||active.disabled||options.contains(active))next.focus({preventScroll:true});});
  }else if(next.hidden&&answered&&options.querySelector('button:not(:disabled)')){answered=false;requestAnimationFrame(()=>reveal(progress||options));}
  else if(next.hidden)answered=false;
 }).observe($('quizPanel'),{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','disabled']});
}

/* SRS: bring the rating row into view after revealing, and the next card after rating. */
function setupSrs(){
 const ratings=$('srsRatings'),revealBtn=$('srsReveal'),card=$('srsCard');
 if(!ratings||!revealBtn||ratings.dataset.uxReady)return;ratings.dataset.uxReady='1';
 revealBtn.setAttribute('aria-keyshortcuts','Space Enter');
 const keys={again:'1',hard:'2',good:'3',easy:'4'};
 ratings.querySelectorAll('[data-rating]').forEach(b=>b.setAttribute('aria-keyshortcuts',keys[b.dataset.rating]||''));
 hint('srsShortcutHint',ratings,'Phím tắt: Space xem đáp án · 1 Quên · 2 Khó · 3 Nhớ · 4 Dễ','after');
 new MutationObserver(records=>{
  if(!visible($('srsPanel')))return;
  for(const r of records){
   if(r.target===ratings&&!ratings.hidden)requestAnimationFrame(()=>reveal(ratings));
   if(r.target===revealBtn&&!revealBtn.hidden&&!card.hidden)requestAnimationFrame(()=>reveal(card));
  }
 }).observe(ratings.parentElement,{subtree:true,attributes:true,attributeFilter:['hidden']});
}

/* Desktop shortcuts. They only click visible, enabled controls and stay quiet while typing or in dialogs. */
document.addEventListener('keydown',event=>{
 if(event.defaultPrevented||event.ctrlKey||event.metaKey||event.altKey||event.isComposing||typing(event.target))return;
 if(body.classList.contains('drawer-open')||document.querySelector('dialog[open]'))return;
 const key=event.key,onControl=!!event.target?.closest?.('button,a,summary,[role=button]');
 if(key==='/'){
  event.preventDefault();
  const input=$('searchInput');
  if(!visible(input))window.HSKStudio?.navigate('search');
  requestAnimationFrame(()=>{if(visible(input))input.focus();});
  return;
 }
 if(visible($('quizPanel'))){
  const buttons=[...$('quizOptions').querySelectorAll('button')];
  let index='1234'.indexOf(key);if(index<0&&key.length===1)index='abcd'.indexOf(key.toLowerCase());
  if(index>=0&&usable(buttons[index])){event.preventDefault();buttons[index].click();return;}
  if(key==='Enter'&&!onControl&&usable($('quizNext'))){event.preventDefault();$('quizNext').click();return;}
 }
 if(visible($('srsCard'))){
  if((key===' '||key==='Enter')&&!onControl&&usable($('srsReveal'))){event.preventDefault();$('srsReveal').click();return;}
  const rating={'1':'again','2':'hard','3':'good','4':'easy'}[key];
  if(rating&&visible($('srsRatings'))){const b=document.querySelector(`#srsRatings [data-rating="${rating}"]`);if(usable(b)){event.preventDefault();b.click();}return;}
 }
 if(visible($('flashcard'))&&visible($('learnPanel'))){
  if(key==='ArrowLeft'&&usable($('prev'))){event.preventDefault();$('prev').click();return;}
  if(key==='ArrowRight'&&usable($('next'))){event.preventDefault();$('next').click();return;}
  if(key===' '&&!onControl&&event.target!==$('flashcard')){event.preventDefault();$('flashcard').click();}
 }
});

function init(){setupFlashcard();setupQuiz();setupSrs();}
init();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
window.addEventListener('hsk-lessons-ready',init);
})();
