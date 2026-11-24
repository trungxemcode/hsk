/* Keep theme roles centralized and prevent new feature CSS from bypassing them. */
const fs=require('node:fs'),assert=require('node:assert/strict');
const base=fs.readFileSync('style.css','utf8');
assert.equal((base.match(/:root\s*\{/g)||[]).length,1,'one root token catalog');
const light=base.match(/:root\s*\{([^{}]*)\}/)[1],dark=base.match(/html\[data-theme="dark"\]\s*\{([^{}]*)\}/)[1];
const read=s=>Object.fromEntries([...s.matchAll(/--([\w-]+):([^;]+)/g)].map(m=>[m[1],m[2].trim()]));
const defaults=read(light),night=read(dark);
for(const name of ['accent','accent-dark','paper','surface','ink','sub','line','line-dark','button-bg','button-active-bg','button-disabled-bg','radius-btn','radius-card','radius-dialog','shadow','focus-ring'])assert.ok(defaults[name],name);
const resolve=(name,theme)=>{const value=({...defaults,...(theme==='dark'?night:{})})[name];assert.ok(value,'defined token '+name);return value.replace(/var\(--([\w-]+)\)/g,(_,key)=>resolve(key,theme));};
// Exact palette from the owner-supplied redesign, in the canonical catalog.
assert.equal(resolve('paper','light'),'#f4f4fa');assert.equal(resolve('paper','dark'),'#0f0f18');
assert.equal(resolve('surface','dark'),'#181826');assert.equal(resolve('ink','dark'),'#c9c9de');
assert.equal(resolve('button-active-bg','light'),'#5b4be8');assert.equal(resolve('button-active-bg','dark'),'#6957e7');
assert.equal(resolve('radius-btn','light'),'12px');assert.equal(resolve('radius-card','light'),'24px');
for(const path of fs.readdirSync('.').filter(p=>p.endsWith('.css'))){
 let source=fs.readFileSync(path,'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
 if(path==='style.css')source=source.replace(/:root\s*\{[^{}]*\}/,'').replace(/html\[data-theme="dark"\]\s*\{[^{}]*\}/,'');
 if(path==='seo-landing.css'){
  // Standalone SEO pages do not load the app shell stylesheet. Keep their
  // isolated palette in one namespaced catalog and require every page rule
  // to consume those tokens rather than declaring literal colors.
  const seoLightBlock=source.match(/:root\s*\{([^{}]*)\}/);
  const seoDarkBlock=source.match(/html\[data-theme="dark"\]\s*\{([^{}]*)\}/);
  assert.equal((source.match(/:root\s*\{/g)||[]).length,1,'SEO pages have exactly one light token catalog');
  assert.equal((source.match(/html\[data-theme="dark"\]\s*\{/g)||[]).length,1,'SEO pages have exactly one dark token catalog');
  assert.ok(seoLightBlock&&seoDarkBlock,'SEO pages have one light and one dark token catalog');
  const seoLight=read(seoLightBlock[1]),seoDark=read(seoDarkBlock[1]);
  assert.ok(Object.keys(seoLight).length>0&&Object.keys(seoLight).every(name=>name.startsWith('seo-')),'SEO tokens use isolated seo-* namespace');
  assert.ok(Object.keys(seoDark).every(name=>name.startsWith('seo-')),'dark SEO overrides use isolated seo-* namespace');
  for(const name of Object.keys(seoDark))assert.ok(name in seoLight,'dark SEO token has light default '+name);
  const seoRefs=[...source.matchAll(/var\(--(seo-[\w-]+)/g)].map(m=>m[1]);
  for(const name of seoRefs)assert.ok(name in seoLight,'SEO token is defined in its standalone catalog: '+name);
  for(const [name,value] of Object.entries({...seoLight,...seoDark})){
   for(const ref of [...value.matchAll(/var\(--(seo-[\w-]+)/g)].map(m=>m[1]))assert.ok(ref in seoLight,'SEO token reference resolves: '+name+' -> '+ref);
  }
  source=source.replace(/:root\s*\{[^{}]*\}/,'').replace(/html\[data-theme="dark"\]\s*\{[^{}]*\}/,'');
  assert.ok(!/--[\w-]+\s*:/.test(source),'SEO custom properties stay inside the isolated token catalog');
 }
 assert.ok(!/--(?:accent[\w-]*|ink[\w-]*|paper|surface|muted|sub|line[\w-]*|green|red|shadow[\w-]*|radius[\w-]*|button[\w-]*|palette[\w-]*|legacy[\w-]*)\s*:/.test(source),'no duplicated theme tokens in '+path);
 assert.ok(!/#(?:[a-f\d]{8}|[a-f\d]{6}|[a-f\d]{4}|[a-f\d]{3})\b|rgba?\(/i.test(source),'use shared color tokens in '+path);
 for(const m of source.matchAll(/(?:^|[;{])\s*([\w-]+)\s*:\s*([^;}]+)/g)){
  assert.ok(!/(^|\s)(white|black|transparent)(?=\s|!|$)/.test(m[2]),'use palette tokens in '+path+' '+m[1]);
  if(m[1]==='border-radius')assert.ok(m[2].trim().startsWith('var('),'use shared radius in '+path);
  if(m[1]==='box-shadow')assert.ok(/^(var\(|none\b)/.test(m[2].trim()),'use shared shadow in '+path);
 }
}
console.log('PASS: one token catalog; supplied light/dark palette; no feature CSS color/radius/shadow literals or theme redefinitions.');
