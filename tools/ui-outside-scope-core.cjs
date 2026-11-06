const assert = require('node:assert/strict');
const ROUTES = ['home','lessons','practice','search','ai-qa','learn','quiz','srs','mistakes','compare','notebook','match-game','sentence-game','study4','real-reading','exam','music','music-play','translator','account','profile','about','admin'];
function scope(config) {
  assert.ok(config && typeof config.request === 'string' && config.request.trim(), 'Scope needs the owner request');
  assert.ok(Array.isArray(config.excludedRoutes), 'excludedRoutes must be an array');
  assert.equal(new Set(config.excludedRoutes).size, config.excludedRoutes.length, 'Duplicate scope');
  const newRoutes=config.newRoutes||[];
  assert.ok(Array.isArray(newRoutes),'newRoutes must be an array');
  assert.equal(new Set(newRoutes).size,newRoutes.length,'Duplicate new routes');
  for(const route of newRoutes){assert.ok(ROUTES.includes(route),'Unknown new route: '+route);assert.ok(!config.excludedRoutes.includes(route),'New routes cannot be excluded');}
  for (const route of config.excludedRoutes) assert.ok(ROUTES.includes(route), 'Unknown excluded route: '+route);
  assert.ok(config.excludedRoutes.length < ROUTES.length, 'Cannot exclude every page');
  assert.ok(config.sharedHeaderOnly === undefined || typeof config.sharedHeaderOnly === 'boolean','Shared header scope must be boolean');
  if(config.sharedHeaderOnly) assert.equal(config.excludedRoutes.length,0,'A shared header edit must preserve visual checks on every route');
  assert.ok(config.sharedSidebarOnly===undefined||typeof config.sharedSidebarOnly==='boolean');
  if(config.sharedSidebarOnly)assert.equal(config.excludedRoutes.length,0,'Sidebar edit must preserve every route');
  assert.ok(config.sharedQuickNavOnly === undefined || typeof config.sharedQuickNavOnly === 'boolean','Quick nav scope must be boolean');
  if(config.sharedQuickNavOnly) {
    assert.equal(config.excludedRoutes.length,0,'A shared quick-nav edit must preserve visual checks on every route');
    assert.ok(!config.sharedHeaderOnly,'Only one shared area may be normalized in a single PR');
  }
  assert.ok(config.sharedMobileDrawerOnly===undefined||typeof config.sharedMobileDrawerOnly==='boolean','Mobile drawer scope must be boolean');
  if(config.sharedMobileDrawerOnly){
    assert.equal(config.excludedRoutes.length,0,'Mobile drawer edit must preserve every route');
    assert.ok(!config.sharedHeaderOnly&&!config.sharedSidebarOnly&&!config.sharedQuickNavOnly,'Only the mobile drawer may be scoped');
  }
  assert.ok(config.sharedNavigationOnly===undefined||typeof config.sharedNavigationOnly==='boolean','Navigation scope must be boolean');
  if(config.sharedNavigationOnly){
    assert.ok(config.excludedRoutes.length===0||(config.excludedRoutes.length===2&&config.excludedRoutes.includes('account')&&config.excludedRoutes.includes('profile')),'Navigation edit may only accompany the explicit Profile/Account split');
    assert.ok(!config.sharedHeaderOnly&&!config.sharedQuickNavOnly&&!config.sharedSidebarOnly&&!config.sharedMobileDrawerOnly,'Scope only the sidebar and closed drawer');
  }
  return ROUTES.filter(route=>!config.excludedRoutes.includes(route));
}
function addedRoutesFromNavigation(beforeHTML,afterHTML,config) {
  const links=html=>new Set([...html.matchAll(/data-studio-go="([^"]+)"/g)].map(match=>match[1]));
  const before=links(beforeHTML),after=links(afterHTML);
  const added=[...after].filter(route=>!before.has(route)&&route!=='review');
  const declared=config.newRoutes||[];
  assert.deepEqual(added.slice().sort(),declared.slice().sort(),'Every new navigation route must be explicitly declared');
  if(declared.length)assert.equal(config.sharedNavigationOnly,true,'New navigation entries require scoped sidebar/drawer comparison');
  for(const route of declared){
    assert.ok(ROUTES.includes(route),'New route missing from protected inventory: '+route);
    assert.ok(afterHTML.includes('data-studio-hub-panel="'+route+'"'),'New route must have a real app panel: '+route);
  }
  return declared;
}
function routeIsOpen(route, state) {
  if(route==='profile')return state.classes.includes('show-account')&&state.accountCurrent==='profile';
  if(route==='account')return state.classes.includes('show-account')&&state.accountCurrent==='settings';
  const alias=route==='music-play'?'music':route;
  return state.hub===alias||state.classes.includes('show-'+route)||state.active===route;
}
function pixels(a,b) {
  if(a.width!==b.width || a.height!==b.height) return {changed:Infinity, reason:'image dimensions changed'};
  let changed=0;
  for(let i=0;i<a.data.length;i+=4) if([0,1,2,3].some(k=>Math.abs(a.data[i+k]-b.data[i+k])>2)) changed++;
  return {changed};
}
// pixelmatch's documented per-pixel perceptual default, NOT a percentage budget.
// Exact computed geometry/colors/gradients/shadows are independently compared.
function visualPixels(a,b){
  if(a.width!==b.width||a.height!==b.height)return Infinity;
  const mask=new Uint8Array(a.data.length);
  let changed=require('pixelmatch')(a.data,b.data,mask,a.width,a.height,{threshold:0.1,includeAA:false,diffMask:true});
  if(!changed)return 0;
  const flags=new Uint8Array(a.width*a.height);
  for(let p=0;p<flags.length;p++)flags[p]=Number(mask[p*4]===255&&mask[p*4+1]===0&&mask[p*4+2]===0&&mask[p*4+3]===255);
  // Rounded gradient clips can evade pixelmatch's intensity-slope AA test.
  // Recognize ONLY an isolated edge sample bounded by its unchanged neighbours
  // in BOTH renders. A new solid-color pixel is not bounded and still fails.
  const edgeSample=(img,p)=>{
    const values=[];
    for(const dy of [-1,0,1])for(const dx of [-1,0,1])if(dx||dy)values.push((p+dy*a.width+dx)*4);
    let edge=false;
    for(let c=0;c<3;c++){
      const lo=Math.min(...values.map(i=>img.data[i+c])),hi=Math.max(...values.map(i=>img.data[i+c]));
      if(img.data[p*4+c]<lo||img.data[p*4+c]>hi)return false;
      if(hi-lo>16)edge=true;
    }
    return edge;
  };
  for(let y=1;y<a.height-1;y++)for(let x=1;x<a.width-1;x++){
    const p=y*a.width+x;if(!flags[p])continue;
    let isolated=true;
    for(const dy of [-1,0,1])for(const dx of [-1,0,1])if((dx||dy)&&flags[p+dy*a.width+dx])isolated=false;
    if(isolated&&edgeSample(a,p)&&edgeSample(b,p))changed--;
  }
  return changed;
}
// Serializable into page.evaluate; shared with the sabotage browser regression.
function measureDOM(options={}){
  return [...document.querySelectorAll('body *')].filter(n=>(!options.skipHeader||!n.closest('#studioHeader'))&&(!options.skipSidebar||!n.closest('.sidebar'))&&(!options.skipClosedMobileDrawerBody||!n.closest('#drawer[aria-hidden="true"] .drawer-body'))&&n.checkVisibility()&&!['SCRIPT','STYLE','LINK'].includes(n.tagName)).map(n=>{
    const r=n.getBoundingClientRect(),s=getComputedStyle(n);
    const rawText=[...n.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('');
    // New hidden panels can change only indentation in main's direct text nodes.
    // Normalize that invisible whitespace, never readable text or element geometry.
    const text=n.matches('main.workspace')&&!rawText.trim()?'':rawText;
    const paintAttributes=Object.fromEntries(['d','points','fill','stroke','src','href'].map(k=>[k,(n.getAttribute(k)||'').replace(/http:\/\/127\.0\.0\.1:\d+/g,'LOCAL')]));
    return {key:n.id||n.tagName+'.'+n.getAttribute('class'),text,paintAttributes,x:Math.round(r.x*100)/100,y:Math.round(r.y*100)/100,w:Math.round(r.width*100)/100,h:Math.round(r.height*100)/100,font:s.fontSize,fontFamily:s.fontFamily,weight:s.fontWeight,align:s.textAlign,color:s.color,background:s.backgroundColor,backgroundImage:s.backgroundImage,shadow:s.boxShadow,border:s.border,borderRadius:s.borderRadius,padding:s.padding,margin:s.margin,transform:s.transform,opacity:s.opacity};
  });
}
function scenarios(width,theme){
 if(width===undefined&&theme===undefined)return [390,1440].flatMap(width=>['light','dark'].map(theme=>({width,theme})));
 const n=Number(width);assert.ok([390,1440].includes(n)&&['light','dark'].includes(theme),'Invalid or incomplete UI scenario');
 return [{width:n,theme}];
}
function canRecaptureGeometryOnly(r){return !r.geometryEqual&&r.imageCountEqual&&r.changedPixels===0&&r.elementCountEqual;}
module.exports={ROUTES,scope,addedRoutesFromNavigation,routeIsOpen,pixels,visualPixels,measureDOM,scenarios,canRecaptureGeometryOnly};
