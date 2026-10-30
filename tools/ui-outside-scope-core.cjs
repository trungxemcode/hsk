const assert = require('node:assert/strict');
const ROUTES = ['home','lessons','practice','search','learn','quiz','srs','mistakes','compare','notebook','match-game','sentence-game','study4','real-reading','exam','music','music-play','translator','account','about','admin'];
function scope(config) {
  assert.ok(config && typeof config.request === 'string' && config.request.trim(), 'Scope needs the owner request');
  assert.ok(Array.isArray(config.excludedRoutes), 'excludedRoutes must be an array');
  assert.equal(new Set(config.excludedRoutes).size, config.excludedRoutes.length, 'Duplicate scope');
  for (const route of config.excludedRoutes) assert.ok(ROUTES.includes(route), 'Unknown excluded route: '+route);
  assert.ok(config.excludedRoutes.length < ROUTES.length, 'Cannot exclude every page');
  return ROUTES.filter(route=>!config.excludedRoutes.includes(route));
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
  return require('pixelmatch')(a.data,b.data,null,a.width,a.height,{threshold:0.1,includeAA:false});
}
// Serializable into page.evaluate; shared with the sabotage browser regression.
function measureDOM(){
  return [...document.querySelectorAll('body *')].filter(n=>n.checkVisibility()&&!['SCRIPT','STYLE','LINK'].includes(n.tagName)).map(n=>{
    const r=n.getBoundingClientRect(),s=getComputedStyle(n);
    return {key:n.id||n.tagName+'.'+n.getAttribute('class'),x:Math.round(r.x*100)/100,y:Math.round(r.y*100)/100,w:Math.round(r.width*100)/100,h:Math.round(r.height*100)/100,font:s.fontSize,weight:s.fontWeight,align:s.textAlign,color:s.color,background:s.backgroundColor,backgroundImage:s.backgroundImage,shadow:s.boxShadow,border:s.border,borderRadius:s.borderRadius,padding:s.padding,margin:s.margin,transform:s.transform,opacity:s.opacity};
  });
}
module.exports={ROUTES,scope,pixels,visualPixels,measureDOM};
