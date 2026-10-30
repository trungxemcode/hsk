/* Direct object manipulation stays in the editor iframe; exported changes remain validated CSS. */
window.HSKDesignerObjects={attach({doc,win,overlay,schema,editable,choose,node,selected,callbacks}){
 let gesture=null,queued=0,pending=null,suppressUntil=0,replayCleanup=null,replayTimer=0;
 const bar=overlay.querySelector('.hd-bar'),badge=doc.createElement('output');badge.className='hd-position';badge.hidden=true;bar.append(badge);
 function restoreStyles(n,snapshot){for(const [key,value,priority] of snapshot.props){if(value)n.style.setProperty(key,value,priority);else n.style.removeProperty(key);}if(snapshot.attribute===null&&!n.getAttribute('style'))n.removeAttribute('style');}
 function freeze(n){const props=['transition','animation-play-state'].map(key=>[key,n.style.getPropertyValue(key),n.style.getPropertyPriority(key)]),attribute=n.getAttribute('style');n.style.setProperty('transition','none','important');n.style.setProperty('animation-play-state','paused','important');return {props,attribute};}
 function flush(){if(queued)win.cancelAnimationFrame(queued);queued=0;if(pending&&gesture?.started){callbacks.preview(gesture.key,pending);pending=null;}}
 function cancel(){replayCleanup?.();if(!gesture)return;const g=gesture;gesture=null;if(queued)win.cancelAnimationFrame(queued);queued=0;pending=null;badge.hidden=true;doc.documentElement.classList.remove('hsk-object-dragging');if(g.started){callbacks.cancel();restoreStyles(g.n,g.frozen);callbacks.settled?.();}try{doc.documentElement.releasePointerCapture(g.pointerId);}catch{}}
 function begin(e,key,kind='move',axis='both'){
  if(!editable()||e.button!==0||!key)return;cancel();const n=node(key);if(!n)return;e.preventDefault();e.stopImmediatePropagation();
  if(doc.activeElement?.matches('input,textarea,select'))doc.activeElement.blur();win.focus();const computed=win.getComputedStyle(n),pose=callbacks.pose(key);gesture={key,n,pointerId:e.pointerId,kind,axis,x:e.clientX,y:e.clientY,pose,inline:computed.display==='inline',width:parseFloat(computed.width)||n.offsetWidth,height:parseFloat(computed.height)||n.offsetHeight,started:false,patch:null};
  try{doc.documentElement.setPointerCapture(e.pointerId);}catch{}
 }
 function move(e){
  const g=gesture;if(!g||e.pointerId!==g.pointerId)return;e.preventDefault();e.stopImmediatePropagation();if(!g.n.isConnected){cancel();return;}
  let dx=e.clientX-g.x,dy=e.clientY-g.y;if(!g.started&&Math.hypot(dx,dy)<4)return;
  if(!g.started){if(callbacks.begin(g.key)===false){cancel();return;}g.started=true;g.frozen=freeze(g.n);doc.documentElement.classList.add('hsk-object-dragging');}
  if(e.shiftKey&&g.kind==='move'){if(Math.abs(dx)>=Math.abs(dy))dy=0;else dx=0;}
  const clamp=(value,key)=>Math.max(schema.properties[key].min,Math.min(schema.properties[key].max,Math.round(value))),patch={};
  if(g.kind==='move'){patch.moveX=clamp(g.pose.moveX+dx,'moveX');patch.moveY=clamp(g.pose.moveY+dy,'moveY');badge.textContent='X '+patch.moveX+' · Y '+patch.moveY;}
  else{if(g.axis!=='y')patch.width=Math.max(8,clamp(g.width+dx,'width'));if(g.axis!=='x')patch.height=Math.max(8,clamp(g.height+dy,'height'));badge.textContent=(patch.width===undefined?'':Math.round(patch.width)+' W')+(patch.height===undefined?'':' · '+Math.round(patch.height)+' H');}
  if(g.inline)patch.display='inline-block';g.patch=patch;pending=patch;badge.hidden=false;if(!queued)queued=win.requestAnimationFrame(()=>{queued=0;flush();});
 }
 function finish(e){const g=gesture;if(!g||e.pointerId!==g.pointerId)return;e.preventDefault();e.stopImmediatePropagation();flush();gesture=null;badge.hidden=true;doc.documentElement.classList.remove('hsk-object-dragging');if(g.started){callbacks.commit(g.key,g.patch);restoreStyles(g.n,g.frozen);callbacks.settled?.();suppressUntil=win.performance.now()+250;}try{doc.documentElement.releasePointerCapture(g.pointerId);}catch{}}
 doc.addEventListener('pointerdown',e=>{if(!editable()||e.target.closest?.('[data-hsk-designer-ui]')||e.button!==0)return;const c=choose(e);if(c)begin(e,c.key);},true);
 doc.addEventListener('pointermove',move,true);doc.addEventListener('pointerup',finish,true);doc.addEventListener('pointercancel',cancel,true);win.addEventListener('blur',cancel);doc.addEventListener('visibilitychange',()=>{if(doc.hidden)cancel();});
 doc.addEventListener('dragstart',e=>{if(editable()&&!e.target.closest?.('[data-hsk-designer-ui]'))e.preventDefault();},true);
 doc.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&gesture){e.preventDefault();e.stopImmediatePropagation();cancel();return;}
  if(!editable()||!selected()||e.ctrlKey||e.metaKey||e.altKey||e.target.closest?.('input,select,textarea,[contenteditable=true],[data-hsk-designer-ui]'))return;
  const step=e.shiftKey?10:1,deltas={ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,-step],ArrowDown:[0,step]};
  if(deltas[e.key]){e.preventDefault();e.stopImmediatePropagation();callbacks.nudge(...deltas[e.key]);}
 },true);
 const moveButton=doc.createElement('button');moveButton.type='button';moveButton.dataset.objectMove='';moveButton.textContent='✥';moveButton.title='Kéo object · Shift khóa trục';moveButton.onpointerdown=e=>begin(e,selected());bar.insertBefore(moveButton,badge);
 for(const [kind,axis,title] of [['e','x','Kéo đổi chiều rộng'],['s','y','Kéo đổi chiều cao'],['se','both','Kéo đổi kích thước']]){
  const handle=doc.createElement('button');handle.type='button';handle.className='hd-resize hd-resize-'+kind;handle.dataset.resize=axis;handle.title=title;handle.setAttribute('aria-label',title);handle.onpointerdown=e=>begin(e,selected(),'resize',axis);overlay.append(handle);
 }
 const css=doc.createElement('style');css.textContent='[data-hsk-designer-ui] .hd-bar>span:first-child{min-width:0;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}[data-hsk-designer-ui] .hd-bar button{flex-shrink:0}.hsk-designer-editing{touch-action:none}.hsk-object-dragging,.hsk-object-dragging *{cursor:move!important;user-select:none!important}[data-hsk-designer-ui] .hd-position{font:600 11px/1.4 system-ui;padding:1px 5px;white-space:nowrap}[data-hsk-designer-ui] .hd-resize{all:unset;box-sizing:border-box;position:absolute;width:10px;height:10px;border:2px solid #6850ed;border-radius:3px;background:white;pointer-events:auto;touch-action:none}[data-hsk-designer-ui] .hd-resize-e{right:-6px;top:calc(50% - 5px);cursor:ew-resize}[data-hsk-designer-ui] .hd-resize-s{bottom:-6px;left:calc(50% - 5px);cursor:ns-resize}[data-hsk-designer-ui] .hd-resize-se{right:-6px;bottom:-6px;cursor:nwse-resize}[data-hsk-designer-ui] [data-object-move]{cursor:move;touch-action:none}';doc.head.append(css);doc.documentElement.classList.add('hsk-designer-editing');
 function replay(name){replayCleanup?.();const n=node(selected());if(!n||!name||name==='none')return;const snapshot={attribute:n.getAttribute('style'),props:['animation-name','animation-play-state'].map(key=>[key,n.style.getPropertyValue(key),n.style.getPropertyPriority(key)])};n.style.setProperty('animation-name','none','important');void n.offsetWidth;n.style.setProperty('animation-name',name,'important');n.style.setProperty('animation-play-state','running','important');replayCleanup=()=>{clearTimeout(replayTimer);restoreStyles(n,snapshot);replayCleanup=null;};const c=win.getComputedStyle(n),duration=parseFloat(c.animationDuration)*1000,delay=parseFloat(c.animationDelay)*1000,count=Number(c.animationIterationCount)||1;replayTimer=win.setTimeout(()=>replayCleanup?.(),Math.min(10000,Math.max(600,duration*count+delay+100)));}
 return {cancel,suppressClick(e){if(e.type==='click'&&win.performance.now()<suppressUntil){e.preventDefault();e.stopImmediatePropagation();return true;}return false;},editing(value){cancel();replayCleanup?.();suppressUntil=0;doc.documentElement.classList.toggle('hsk-designer-editing',value);},replay};
}};
