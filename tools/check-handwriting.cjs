const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),core=require('./handwriting-shape-prototype.cjs');
const source=process.argv[2];if(!source)throw Error('Usage: node tools/check-handwriting.cjs model.json [report.json]');
const data=JSON.parse(fs.readFileSync(source)),start=performance.now(),templates=core.prepare(data),prepareMs=performance.now()-start;
// Optional licensed external release; geometric fixtures below remain independent.
if(process.argv[4]){const learning=require('../src/modules/handwriting/handwriting-learning.js'),release=JSON.parse(fs.readFileSync(process.argv[4]));for(const sample of release.samples)templates.push(core.fromBitmap(sample.label,learning.unpack(sample.bitmap),'published'));}
// Independently drawn geometric handwriting; these are not copied from model medians.
const {fixtures}=require('./handwriting-fixtures.cjs');
let seed=9173;function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
const results=[],times=[];
function check(character,kind,strokes){const t=performance.now(),candidates=core.recognize(strokes,templates);times.push(performance.now()-t);results.push({character,kind,rank:candidates.findIndex(c=>c.character===character)+1,score:candidates[0]?.score,candidates:candidates.map(c=>c.character).join('')});return candidates;}
let variantChecks=0;
for(const [character,strokes] of Object.entries(fixtures)){
 const baseline=check(character,'independent-clean',strokes);
 const permutations=[
  strokes.map(s=>s.slice().reverse()),
  strokes.filter((_,i)=>i%2===0).concat(strokes.filter((_,i)=>i%2===1)),
  strokes.flatMap(stroke=>{if(stroke.length<3)return [stroke];const middle=Math.floor(stroke.length/2);return [stroke.slice(0,middle+1),stroke.slice(middle)];}),
  strokes.flatMap(stroke=>stroke.length<3?[stroke]:[stroke.slice(0,Math.floor(stroke.length/2)+1),stroke.slice(Math.floor(stroke.length/2))]).filter(s=>s.length).reduce((joined,stroke)=>{if(joined.length&&stroke.length>1&&joined.at(-1).at(-1)[0]===stroke[0][0]&&joined.at(-1).at(-1)[1]===stroke[0][1])joined.at(-1).push(...stroke.slice(1));else joined.push(stroke);return joined;},[])
 ];
 for(const [index,variant] of permutations.entries()){assert.deepEqual(core.recognize(variant,templates),baseline,character+' order/segmentation invariant '+index);variantChecks++;}
 for(const [scale,dx,dy] of [[0.25,0,0],[0.6,20,-10],[2.5,-200,350]])check(character,'size-position',strokes.map(s=>s.map(([x,y])=>[x*scale+dx,y*scale+dy])));
 for(let n=0;n<6;n++)check(character,'independent-rough',strokes.map(s=>s.map(([x,y])=>[x*(0.85+random()*0.3)+(random()-0.5)*5,y+(random()-0.5)*5])));
 if(strokes.length>1)check(character,'missing-stroke',strokes.slice(0,-1));
}
// Check order-invariance over every supported character without generating artificial accuracy claims.
for(const strokes of data.samples)assert.deepEqual(core.rasterize(strokes),core.rasterize(strokes.map(s=>s.slice().reverse()).reverse()));
const metrics={};for(const kind of [...new Set(results.map(r=>r.kind))]){const cases=results.filter(r=>r.kind===kind);metrics[kind]={cases:cases.length,top1:cases.filter(r=>r.rank===1).length,top5:cases.filter(r=>r.rank>0&&r.rank<=5).length,top10:cases.filter(r=>r.rank>0).length,recall5:cases.filter(r=>r.rank>0&&r.rank<=5).length/cases.length,recall10:cases.filter(r=>r.rank>0).length/cases.length};}
const perCharacter=Object.fromEntries(Object.keys(fixtures).map(character=>{const cases=results.filter(r=>r.character===character);return [character,{cases:cases.length,top1:cases.filter(r=>r.rank===1).length,top5:cases.filter(r=>r.rank>0&&r.rank<=5).length,top10:cases.filter(r=>r.rank>0).length}];}));
const confusableGroups=[['你','他','休','体'],['日','目','白','自'],['未','末'],['土','士'],['人','入'],['木','本']].map(characters=>({characters:characters.join(''),results:Object.fromEntries(characters.map(character=>[character,perCharacter[character]||null]))}));
times.sort((a,b)=>a-b);
const report={date:'2026-10-12',approach:'Axis-normalized, order-independent 32x32 bitmap / symmetric squared chamfer + ink density; personal variants use near-shape recall and distinct local support',supportedCharacters:templates.length,prepareMs,recognitionMedianMs:times[Math.floor(times.length/2)],recognitionP95Ms:times[Math.floor(times.length*0.95)],orderInvariantCharacters:data.samples.length,strokeOrderAndSegmentationChecks:variantChecks,personalInfluence:{singleSample:'near-shape recall only',generalization:'two distinct nearby confirmed shapes'},metrics,perCharacter,confusableGroups,failures:results.filter(r=>!r.rank),limitation:'Component decomposition data is not shipped, so this build learns confirmed whole-glyph variants only. Geometric fixtures and controlled distortions are not a representative multi-writer real-handwriting benchmark or physical iPhone test.'};
if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(report,null,2));
console.log(JSON.stringify({...report,failures:report.failures.filter(r=>r.kind==='independent-clean')},null,2));
if(metrics['independent-clean'].recall10<0.9||metrics['independent-rough'].recall10<0.8)process.exitCode=2;
module.exports={fixtures};
