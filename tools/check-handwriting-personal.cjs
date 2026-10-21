// Repeatable held-out perturbations of geometric fixtures; NOT real-writer accuracy.
const fs=require('node:fs'),core=require('../src/modules/handwriting/handwriting-core.js'),{fixtures}=require('./handwriting-fixtures.cjs');
const base=core.prepare(JSON.parse(fs.readFileSync('handwriting-data.json')));
const results=[];let seed=60212;
const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
for(const [label,strokes] of Object.entries(fixtures)){
 const training=[strokes,strokes.map(s=>s.map(([x,y])=>[x+(y/100)*2,y]))];
 const personal=training.map(s=>core.fromBitmap(label,core.rasterize(s),'personal'));
 for(let n=0;n<6;n++){
  const heldout=strokes.map(s=>s.map(([x,y])=>[x+(random()-.5)*2,y+(random()-.5)*2]));
  const rank=templates=>{const i=core.recognize(heldout,templates).findIndex(c=>c.character===label);return i<0?null:i+1;};
  results.push({label,before:rank(base),after:rank([...base,...personal])});
 }
}
const metric=key=>({cases:results.length,top1:results.filter(r=>r[key]===1).length,top5:results.filter(r=>r[key]!==null&&r[key]<=5).length});
const report={before:metric('before'),after:metric('after'),regressions:results.filter(r=>r.before!==null&&(r.after===null||r.after>r.before)).length,limitation:'Two training variants and six held-out perturbations per geometric glyph. No human writers; no evidence of component transfer.',results};
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2));
console.log(JSON.stringify({before:report.before,after:report.after,regressions:report.regressions}));
