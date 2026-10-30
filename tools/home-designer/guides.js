/* Editor-only rulers and guides: intentionally never part of project config/CSS. */
(()=>{
 'use strict';
 const box=document.getElementById('frame-box'),frame=document.getElementById('canvas');
 const store=new Map();let active=null,selected=null;
 const scope=()=>document.getElementById('page-select').value+':'+frame.width;
 const guides=()=>{const key=scope();if(!store.has(key))store.set(key,[]);return store.get(key);};
 const scale=()=>box.clientWidth/(Number(frame.width)||1440);
 const layer=document.createElement('div');layer.id='designer-guides';
 const horizontal=document.createElement('div'),vertical=document.createElement('div');
 horizontal.className='designer-ruler horizontal';vertical.className='designer-ruler vertical';
 horizontal.title='Kéo xuống để tạo đường căn ngang';vertical.title='Kéo sang phải để tạo đường căn dọc';
 horizontal.setAttribute('aria-label',horizontal.title);vertical.setAttribute('aria-label',vertical.title);
 const clear=document.createElement('button');clear.id='clear-guides';clear.textContent='Xóa đường căn';clear.onclick=()=>{store.set(scope(),[]);selected=null;draw();};
 document.getElementById('zoom').after(clear);box.append(horizontal,vertical,layer);
 const editing=()=>document.getElementById('preview').getAttribute('aria-pressed')!=='true';
 function draw(){
  const s=scale();for(const line of [...layer.children])if(!guides().some(g=>g.element===line))line.remove();layer.hidden=!editing();horizontal.hidden=vertical.hidden=!editing();
  for(const [ruler,length] of [[horizontal,Number(frame.width)],[vertical,Number(frame.height)]]){
   ruler.replaceChildren();const step=s<.4?50:s<.75?20:10;
   for(let i=0;i<=length;i+=step){const tick=document.createElement('span');tick.className='ruler-tick';tick.style.setProperty('--at',i*s+'px');if(i%(step*5)===0){tick.classList.add('major');tick.textContent=i;}ruler.append(tick);}
  }
  for(const guide of guides()){
   const line=guide.element||(guide.element=document.createElement('button'));line.className='designer-guide '+guide.axis;line.classList.toggle('selected',guide===selected);line.style.setProperty('--at',guide.position*s+'px');line.title=Math.round(guide.position)+' px · Kéo để di chuyển · Nhấp đúp hoặc Delete để xóa';line.setAttribute('aria-label',line.title);
   line.onpointerdown=e=>begin(e,guide);line.ondblclick=e=>{e.preventDefault();remove(guide);};if(line.parentNode!==layer)layer.append(line);
  }
 }
 function remove(guide){const list=guides(),i=list.indexOf(guide);if(i>=0)list.splice(i,1);selected=null;draw();}
 function position(e,axis){const r=frame.getBoundingClientRect();return Math.round((axis==='horizontal'?e.clientY-r.top:e.clientX-r.left)/scale());}
 function begin(e,guide){if(e.button!==0||!editing())return;e.preventDefault();e.stopPropagation();selected=guide;active={guide,scope:scope(),before:guide.position};box.setPointerCapture(e.pointerId);draw();}
 horizontal.onpointerdown=e=>create(e,'horizontal');vertical.onpointerdown=e=>create(e,'vertical');
 function create(e,axis){if(e.button!==0||!editing())return;const guide={axis,position:position(e,axis)};guides().push(guide);begin(e,guide);active.fresh=true;}
 box.addEventListener('pointermove',e=>{if(!active)return;active.guide.position=position(e,active.guide.axis);draw();});
 function finish(e,cancel=false){if(!active)return;const {guide,before,fresh}=active;active=null;if(cancel){if(fresh)remove(guide);else guide.position=before;}else{const limit=guide.axis==='horizontal'?Number(frame.height):Number(frame.width);if(guide.position<0||guide.position>limit)remove(guide);}if(box.hasPointerCapture(e.pointerId))box.releasePointerCapture(e.pointerId);draw();}
 box.addEventListener('pointerup',e=>finish(e));box.addEventListener('pointercancel',e=>finish(e,true));
 document.addEventListener('keydown',e=>{if(!selected||e.target.closest('input,textarea,select,[contenteditable]'))return;if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();remove(selected);}if(e.key==='Escape'){if(active){const {guide,before,fresh}=active;active=null;if(fresh)remove(guide);else guide.position=before;}selected=null;draw();}});
 new ResizeObserver(draw).observe(box);
 new MutationObserver(draw).observe(document.getElementById('preview'),{attributes:true,attributeFilter:['aria-pressed']});
 document.getElementById('page-select').addEventListener('change',()=>{selected=null;draw();});
 draw();
})();
