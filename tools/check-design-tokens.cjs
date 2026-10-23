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
 assert.ok(!/--(?:accent[\w-]*|ink[\w-]*|paper|surface|muted|sub|line[\w-]*|green|red|shadow[\w-]*|radius[\w-]*|button[\w-]*|palette[\w-]*|legacy[\w-]*)\s*:/.test(source),'no duplicated theme tokens in '+path);
 assert.ok(!/#(?:[a-f\d]{8}|[a-f\d]{6}|[a-f\d]{4}|[a-f\d]{3})\b|rgba?\(/i.test(source),'use shared color tokens in '+path);
 for(const m of source.matchAll(/(?:^|[;{])\s*([\w-]+)\s*:\s*([^;}]+)/g)){
  assert.ok(!/(^|\s)(white|black|transparent)(?=\s|!|$)/.test(m[2]),'use palette tokens in '+path+' '+m[1]);
  if(m[1]==='border-radius')assert.ok(m[2].trim().startsWith('var('),'use shared radius in '+path);
  if(m[1]==='box-shadow')assert.ok(/^(var\(|none\b)/.test(m[2].trim()),'use shared shadow in '+path);
 }
}
console.log('PASS: one token catalog; supplied light/dark palette; no feature CSS color/radius/shadow literals or theme redefinitions.');
