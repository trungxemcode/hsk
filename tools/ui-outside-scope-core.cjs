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
module.exports={ROUTES,scope,pixels};
