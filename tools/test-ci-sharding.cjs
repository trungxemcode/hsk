const {test}=require('node:test'),assert=require('node:assert/strict');
const {partition,verifySuite,verifyVisual}=require('./ci-sharding-core.cjs'),suites=require('./ci-suites.json');
test('each existing suite command executes exactly once across shards',()=>{
 for(const [suite,total] of [['studio',6],['protected-browser',3]]){
  const commands=suites[suite],all=Array.from({length:total},(_,i)=>partition(commands,i+1,total)).flat();
  assert.deepEqual([...all].sort(),[...commands].sort());assert.equal(new Set(all).size,commands.length);
 }
 assert.throws(()=>partition(['a'],0,2));assert.throws(()=>partition(['a'],1,0));
});
test('required gate fails for missing, duplicated, stale, incomplete or failed tests',()=>{
 const commands=['a','b','c'];const make=()=>[1,2].map(shard=>({suite:'s',shard,shards:2,headSHA:'head',results:partition(commands,shard,2).map(command=>({command,exitCode:0}))}));
 assert.equal(verifySuite(make(),commands,'s',2,'head'),3);
 assert.throws(()=>verifySuite(make().slice(1),commands,'s',2,'head'));
 for(const change of [r=>r[0].results.pop(),r=>r[0].results[0].exitCode=1,r=>r[0].results[0].exitCode=null,r=>r[0].headSHA='old',r=>r[1]=r[0]]){const r=make();change(r);assert.throws(()=>verifySuite(r,commands,'s',2,'head'));}
});
test('visual gate requires all four scenarios and every protected route',()=>{
 const {ROUTES}=require('./ui-outside-scope-core.cjs'),scope={request:'test',excludedRoutes:['account']},changed=['style.css'];
 const make=()=>[390,1440].flatMap(width=>['light','dark'].map(theme=>({baseSHA:'b',headSHA:'h',changed,scope,selectedScenarios:[{width,theme}],result:'PASS: protected entry-page states unchanged',results:ROUTES.filter(r=>r!=='account').map(r=>({key:r+'-'+width+'-'+theme,pass:true,geometryEqual:true,imageCountEqual:true,changedPixels:0}))})));
 assert.equal(verifyVisual(make(),'b','h',changed,scope),80);
 for(const change of [r=>r.pop(),r=>r[0].results.pop(),r=>r[1]=r[0],r=>r[0].headSHA='old',r=>r[0].results[0].changedPixels=1]){const r=make();change(r);assert.throws(()=>verifyVisual(r,'b','h',changed,scope));}
});
test('scenario selection rejects incomplete and unknown matrix inputs',()=>{
 const {scenarios}=require('./ui-outside-scope-core.cjs');assert.equal(scenarios().length,4);
 assert.deepEqual(scenarios('390','dark'),[{width:390,theme:'dark'}]);
 assert.throws(()=>scenarios('390'));assert.throws(()=>scenarios('400','light'));assert.throws(()=>scenarios(undefined,'light'));
});
test('editing the visual guard itself requires real page comparisons; unrelated docs do not',()=>{
 const {needsVisualComparison}=require('./ci-sharding-core.cjs');
 assert.equal(needsVisualComparison(['.github/workflows/ui-outside-scope.yml']),true);
 assert.equal(needsVisualComparison(['tools/ci-sharding-core.cjs']),true);
 assert.equal(needsVisualComparison(['style.css']),true);
 assert.equal(needsVisualComparison(['docs/guide.md']),false);
 const config={request:'No exclusions declared in this PR',excludedRoutes:[]},changed=['docs/guide.md'];
 const reports=[390,1440].flatMap(width=>['light','dark'].map(theme=>({baseSHA:'b',headSHA:'h',changed,scope:config,selectedScenarios:[{width,theme}],result:'Not applicable: no app or visual-guard changes',results:[]})));
 assert.equal(verifyVisual(reports,'b','h',changed,config),0);
});
test('runner records a failed subprocess and still reports the remaining tests',()=>{
 const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawnSync}=require('node:child_process');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hsk-ci-runner-'));
 try{
  for(const file of ['run-ci-suite.cjs','ci-sharding-core.cjs'])fs.copyFileSync(path.join(__dirname,file),path.join(dir,file));
  const commands=['node -e "process.exit(0)"','node -e "process.exit(7)"','node -e "console.log(123)"'];
  fs.writeFileSync(path.join(dir,'ci-suites.json'),JSON.stringify({fixture:commands}));
  const result=spawnSync(process.execPath,[path.join(dir,'run-ci-suite.cjs'),'fixture','1','1',path.join(dir,'out')],{encoding:'utf8'});
  assert.equal(result.status,1,result.stderr);
  const report=JSON.parse(fs.readFileSync(path.join(dir,'out/report.json'),'utf8'));
  assert.deepEqual(report.results.map(x=>x.command),commands);assert.deepEqual(report.results.map(x=>x.exitCode),[0,7,0]);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
