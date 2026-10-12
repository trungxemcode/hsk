const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),core=require('./handwriting-shape-prototype.cjs');
const source=process.argv[2];if(!source)throw Error('Usage: node tools/check-handwriting.cjs model.json [report.json]');
const data=JSON.parse(fs.readFileSync(source)),start=performance.now(),templates=core.prepare(data),prepareMs=performance.now()-start;
// Independently drawn geometric handwriting; these are not copied from model medians.
const box=(x1,y1,x2,y2)=>[[[x1,y1],[x1,y2]],[[x1,y1],[x2,y1],[x2,y2]],[[x1,y2],[x2,y2]]];
const wood=[[[15,40],[85,40]],[[50,10],[50,90]],[[50,40],[15,85]],[[50,40],[85,85]]];
const fixtures={
 '一':[[[10,50],[90,50]]],
 '二':[[[20,30],[80,30]],[[10,75],[90,75]]],
 '三':[[[15,20],[85,20]],[[25,50],[75,50]],[[10,85],[90,85]]],
 '十':[[[10,45],[90,45]],[[50,10],[50,90]]],
 '人':[[[50,10],[40,50],[10,90]],[[45,50],[85,90]]],
 '入':[[[40,10],[55,55],[90,90]],[[55,50],[40,70],[10,90]]],
 '八':[[[35,25],[30,55],[15,85]],[[65,25],[70,55],[85,85]]],
 '大':[[[10,40],[90,40]],[[50,10],[45,60],[10,90]],[[45,50],[85,90]]],
 '太':[[[10,40],[90,40]],[[50,10],[45,60],[10,90]],[[45,50],[85,90]],[[45,80],[55,90]]],
 '犬':[[[10,40],[90,40]],[[50,10],[45,60],[10,90]],[[45,50],[85,90]],[[75,15],[85,25]]],
 '天':[[[20,15],[80,15]],[[10,40],[90,40]],[[50,15],[45,60],[10,90]],[[45,50],[85,90]]],
 '木':wood,
 '本':[...wood,[[30,75],[70,75]]],
 '末':[[[10,25],[90,25]],[[20,50],[80,50]],[[50,10],[50,90]],[[50,50],[15,85]],[[50,50],[85,85]]],
 '未':[[[20,25],[80,25]],[[10,50],[90,50]],[[50,10],[50,90]],[[50,50],[15,85]],[[50,50],[85,85]]],
 '土':[[[25,40],[75,40]],[[50,10],[50,85]],[[10,85],[90,85]]],
 '士':[[[10,35],[90,35]],[[50,10],[50,85]],[[25,85],[75,85]]],
 '口':box(20,20,80,80),
 '日':[...box(25,10,75,90),[[25,50],[75,50]]],
 '目':[...box(25,10,75,90),[[25,35],[75,35]],[[25,65],[75,65]]],
 '田':[...box(20,20,80,80),[[20,50],[80,50]],[[50,20],[50,80]]],
 '由':[...box(20,35,80,80),[[20,55],[80,55]],[[50,10],[50,80]]],
 '甲':[...box(20,15,80,65),[[20,40],[80,40]],[[50,15],[50,90]]],
 '申':[...box(20,25,80,75),[[20,50],[80,50]],[[50,10],[50,90]]],
 '中':[...box(20,35,80,65),[[50,10],[50,90]]],
 '王':[[[15,20],[85,20]],[[25,50],[75,50]],[[50,20],[50,85]],[[10,85],[90,85]]],
 '玉':[[[15,20],[85,20]],[[25,50],[75,50]],[[50,20],[50,85]],[[10,85],[90,85]],[[75,65],[85,75]]],
 '主':[[[45,10],[55,20]],[[15,30],[85,30]],[[25,55],[75,55]],[[50,30],[50,90]],[[10,90],[90,90]]],
 '干':[[[20,20],[80,20]],[[10,50],[90,50]],[[50,20],[50,90]]],
 '千':[[[80,10],[25,25]],[[10,50],[90,50]],[[50,20],[50,90]]],
 '牛':[[[35,10],[20,40]],[[30,30],[80,30]],[[10,50],[90,50]],[[50,10],[50,90]]],
 '午':[[[35,10],[20,40]],[[30,30],[80,30]],[[10,55],[90,55]],[[50,30],[50,90]]],
 '山':[[[50,10],[50,85]],[[15,35],[15,85],[85,85]],[[85,35],[85,85]]],
 '小':[[[50,10],[50,90],[40,85]],[[30,45],[10,80]],[[70,45],[85,75]]],
 '少':[[[50,10],[50,60]],[[30,30],[15,60]],[[70,30],[85,55]],[[70,55],[50,80],[20,95]]],
 '水':[[[50,10],[50,90],[40,85]],[[10,40],[30,40],[20,65],[10,80]],[[80,30],[55,50]],[[55,50],[90,85]]],
 '火':[[[20,35],[30,50]],[[80,30],[65,50]],[[50,10],[45,65],[15,90]],[[50,55],[85,90]]],
 '明':[...box(10,25,40,80),[[10,52],[40,52]],[[55,15],[55,70],[45,95]],[[55,15],[85,15],[85,95],[75,90]],[[55,40],[85,40]],[[55,65],[85,65]]],
 '好':[[[25,10],[10,55],[40,75]],[[40,25],[32,65],[10,90]],[[5,45],[45,45]],[[55,20],[90,20],[75,40]],[[75,40],[75,85],[65,90]],[[50,55],[95,55]]],
 '你':[[[30,10],[10,45]],[[22,30],[22,90]],[[60,10],[45,40]],[[55,25],[90,25],[85,40]],[[65,35],[65,90],[55,85]],[[48,55],[35,80]],[[80,55],[95,80]]]
};
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
// Personal templates are evidence only after repeated, consistent confirmation and stay a bounded reranking signal.
const personalCharacter='木',personalStrokes=fixtures[personalCharacter],personalBitmap=core.rasterize(personalStrokes),baseRank=core.recognize(personalStrokes,templates),baseScore=baseRank.find(c=>c.character===personalCharacter)?.score;
assert.ok(Number.isFinite(baseScore),'baseline personal fixture is ranked');
const onePersonal=core.fromBitmap(personalCharacter,personalBitmap,'personal');
assert.deepEqual(core.recognize(personalStrokes,[...templates,onePersonal]),baseRank,'one personal sample cannot affect recognition');
const consistentPersonal=Array.from({length:3},()=>core.fromBitmap(personalCharacter,personalBitmap,'personal'));
const repeatedRank=core.recognize(personalStrokes,[...templates,...consistentPersonal]),repeatedScore=repeatedRank.find(c=>c.character===personalCharacter)?.score;
assert.ok(repeatedScore<=baseScore&&repeatedScore>=baseScore*.9,'consistent personal evidence is capped at ten percent');
// Check order-invariance over every supported character without generating artificial accuracy claims.
for(const strokes of data.samples)assert.deepEqual(core.rasterize(strokes),core.rasterize(strokes.map(s=>s.slice().reverse()).reverse()));
const metrics={};for(const kind of [...new Set(results.map(r=>r.kind))]){const cases=results.filter(r=>r.kind===kind);metrics[kind]={cases:cases.length,top1:cases.filter(r=>r.rank===1).length,top5:cases.filter(r=>r.rank>0&&r.rank<=5).length,top10:cases.filter(r=>r.rank>0).length,recall5:cases.filter(r=>r.rank>0&&r.rank<=5).length/cases.length,recall10:cases.filter(r=>r.rank>0).length/cases.length};}
const perCharacter=Object.fromEntries(Object.keys(fixtures).map(character=>{const cases=results.filter(r=>r.character===character);return [character,{cases:cases.length,top1:cases.filter(r=>r.rank===1).length,top5:cases.filter(r=>r.rank>0&&r.rank<=5).length,top10:cases.filter(r=>r.rank>0).length}];}));
const confusableGroups=[['你','他','休','体'],['日','目','白','自'],['未','末'],['土','士'],['人','入'],['木','本']].map(characters=>({characters:characters.join(''),results:Object.fromEntries(characters.map(character=>[character,perCharacter[character]||null]))}));
times.sort((a,b)=>a-b);
const report={date:'2026-10-12',approach:'Axis-normalized, order-independent 32x32 bitmap / symmetric squared chamfer + ink density; confirmed personal variants require at least three consistent samples and rerank by at most ten percent',supportedCharacters:templates.length,prepareMs,recognitionMedianMs:times[Math.floor(times.length/2)],recognitionP95Ms:times[Math.floor(times.length*0.95)],orderInvariantCharacters:data.samples.length,strokeOrderAndSegmentationChecks:variantChecks,personalInfluence:{singleSample:'no effect',consistentSamples:3,maxRerankPercent:10},metrics,perCharacter,confusableGroups,failures:results.filter(r=>!r.rank),limitation:'Component decomposition data is not shipped, so this build learns confirmed whole-glyph variants only. Geometric fixtures and controlled distortions are not a representative multi-writer real-handwriting benchmark or physical iPhone test.'};
if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(report,null,2));
console.log(JSON.stringify({...report,failures:report.failures.filter(r=>r.kind==='independent-clean')},null,2));
if(metrics['independent-clean'].recall10<0.9||metrics['independent-rough'].recall10<0.8)process.exitCode=2;
module.exports={fixtures};
