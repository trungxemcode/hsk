(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HSKDesignerMulti=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
 'use strict';
 function layout(items,action){
  if(items.length<(action.startsWith('distribute')?3:2))return [];
  const left=Math.min(...items.map(n=>n.x)),top=Math.min(...items.map(n=>n.y)),right=Math.max(...items.map(n=>n.x+n.width)),bottom=Math.max(...items.map(n=>n.y+n.height));
  const delta=new Map(items.map(n=>[n.key,{key:n.key,dx:0,dy:0}]));
  if(action.startsWith('distribute')){
   const horizontal=action==='distribute-x',axis=horizontal?'x':'y',size=horizontal?'width':'height',sorted=[...items].sort((a,b)=>a[axis]-b[axis]);
   const gap=((horizontal?right-left:bottom-top)-sorted.reduce((sum,n)=>sum+n[size],0))/(items.length-1);let at=horizontal?left:top;
   for(const n of sorted){delta.get(n.key)[horizontal?'dx':'dy']=at-n[axis];at+=n[size]+gap;}
  }else for(const n of items){const d=delta.get(n.key);switch(action){case 'left':d.dx=left-n.x;break;case 'center-x':d.dx=(left+right-n.width)/2-n.x;break;case 'right':d.dx=right-n.x-n.width;break;case 'top':d.dy=top-n.y;break;case 'center-y':d.dy=(top+bottom-n.height)/2-n.y;break;case 'bottom':d.dy=bottom-n.y-n.height;break;default:throw Error('Không hỗ trợ cách căn này.');}}
  return [...delta.values()];
 }
 function attach({doc,win,root,node,visible,catalog,editing,hard,choose,selected,selectMany}){
  let enabled=false,gesture=null,suppressUntil=0;
  const decorations=new Map(),box=doc.createElement('div');box.dataset.hskDesignerUi='';box.className='hd-marquee';box.hidden=true;doc.body.append(box);
  const style=doc.createElement('style');style.textContent='.hd-marquee[data-hsk-designer-ui]{background:#6850ed18;border:1px dashed #6850ed;z-index:2147483647;pointer-events:none}.hd-multi-outline[data-hsk-designer-ui]{border:1px solid #08a8c6;pointer-events:none;z-index:2147483645}.hd-marquee-mode{cursor:crosshair!important}.hd-marquee-mode *:not([data-hsk-designer-ui]){cursor:crosshair!important}';doc.head.append(style);
  const portal=n=>n?.closest('dialog[open],[popover]:popover-open')||doc.body;
  function draw(){const keys=editing()?selected():[];for(const [key,outline]of decorations)if(!keys.includes(key)||keys.length<2||!visible(node(key))){outline.remove();decorations.delete(key);}if(keys.length<2)return;for(const key of keys){const n=node(key);if(!visible(n))continue;let outline=decorations.get(key);if(!outline){outline=doc.createElement('div');outline.dataset.hskDesignerUi='';outline.className='hd-multi-outline';decorations.set(key,outline);}if(outline.parentNode!==portal(n))portal(n).append(outline);const r=n.getBoundingClientRect();outline.style.left='0px';outline.style.top='0px';const origin=outline.getBoundingClientRect();Object.assign(outline.style,{left:r.left-origin.left+'px',top:r.top-origin.top+'px',width:r.width+'px',height:r.height+'px'});}}
  function cancel(){if(gesture){try{doc.documentElement.releasePointerCapture(gesture.id);}catch{}}gesture=null;box.hidden=true;}
  function suppressClick(e){if(e.type==='click'&&win.performance.now()<suppressUntil){e.preventDefault();e.stopImmediatePropagation();return true;}return false;}
  doc.addEventListener('pointerdown',e=>{
   if(!editing()||e.button!==0||e.target.closest?.('[data-hsk-designer-ui]')||!root()?.contains(e.target))return;
   if(!enabled){if(e.ctrlKey||e.metaKey){choose(e);suppressUntil=win.performance.now()+350;}return;}
   e.preventDefault();e.stopImmediatePropagation();gesture={id:e.pointerId,x:e.clientX,y:e.clientY,add:e.shiftKey||e.ctrlKey||e.metaKey,target:e.target,moved:false};portal(e.target).append(box);try{doc.documentElement.setPointerCapture(e.pointerId);}catch{}
  },true);
  doc.addEventListener('pointermove',e=>{if(!gesture||e.pointerId!==gesture.id)return;e.preventDefault();e.stopImmediatePropagation();const g=gesture;g.endX=e.clientX;g.endY=e.clientY;if(Math.hypot(e.clientX-g.x,e.clientY-g.y)<4&&!g.moved)return;g.moved=true;box.hidden=false;box.style.left='0px';box.style.top='0px';const origin=box.getBoundingClientRect();Object.assign(box.style,{left:Math.min(g.x,e.clientX)-origin.left+'px',top:Math.min(g.y,e.clientY)-origin.top+'px',width:Math.abs(e.clientX-g.x)+'px',height:Math.abs(e.clientY-g.y)+'px'});},true);
  doc.addEventListener('pointerup',e=>{if(!gesture||e.pointerId!==gesture.id)return;e.preventDefault();e.stopImmediatePropagation();const g=gesture;cancel();suppressUntil=win.performance.now()+350;
   if(!g.moved){choose({target:g.target,clientX:g.x,clientY:g.y,type:'pointerdown',shiftKey:g.add,preventDefault(){},stopImmediatePropagation(){}});return;}
   const x=Math.min(g.x,g.endX),y=Math.min(g.y,g.endY),right=Math.max(g.x,g.endX),bottom=Math.max(g.y,g.endY),r=root(),seen=new Set();
   let entries=[...catalog().values()].map(c=>({key:c.key,n:node(c.key)})).filter(({n})=>{if(!n||n===r||seen.has(n)||!visible(n))return false;seen.add(n);const b=n.getBoundingClientRect();return b.width>0&&b.height>0&&b.left>=x&&b.top>=y&&b.right<=right&&b.bottom<=bottom;});
   entries=entries.filter(a=>!entries.some(b=>a!==b&&(hard()?a.n.contains(b.n):b.n.contains(a.n))));selectMany(entries.map(c=>c.key),g.add);
  },true);
  doc.addEventListener('pointercancel',cancel,true);win.addEventListener('blur',cancel);doc.addEventListener('keydown',e=>{if(e.key==='Escape'&&gesture){e.preventDefault();e.stopImmediatePropagation();cancel();}},true);
  return {draw,cancel,suppressClick,enable(value){cancel();suppressUntil=0;enabled=!!value;doc.documentElement.classList.toggle('hd-marquee-mode',enabled&&editing());},editing(){cancel();doc.documentElement.classList.toggle('hd-marquee-mode',enabled&&editing());draw();}};
 }
 return {layout,attach};
});
