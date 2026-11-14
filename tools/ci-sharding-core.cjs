const assert=require('node:assert/strict');
function partition(commands,index,total){
 assert.ok(Number.isInteger(total)&&total>0&&Number.isInteger(index)&&index>=1&&index<=total,'Invalid shard');
 assert.equal(new Set(commands).size,commands.length,'Duplicate commands');
 return commands.filter((_,i)=>i%total===index-1);
}
function verifySuite(reports,commands,suite,total,head){
 assert.equal(reports.length,total,'Missing/extra shard report');
 const ids=new Set();
 for(const r of reports){
  assert.equal(r.suite,suite);assert.equal(r.headSHA,head,'Stale report');assert.equal(r.shards,total);
  assert.ok(!ids.has(r.shard),'Duplicate shard');ids.add(r.shard);
  const expected=partition(commands,r.shard,total);
  assert.deepEqual(r.results.map(x=>x.command),expected,'Missing, duplicate or wrong test');
  for(const result of r.results)assert.equal(result.exitCode,0,'Test failed/incomplete: '+result.command);
 }
 return commands.length;
}
function isFrontendChange(files){return files.some(f=>! /^(tools\/|docs\/|server\/|\.github\/)/.test(f)&&/\.(css|js|html|json)$/.test(f));}
function needsVisualComparison(files){
 return isFrontendChange(files)||files.some(f=>['.github/workflows/ui-outside-scope.yml','.github/ui-scope.json','tools/check-ui-outside-scope.cjs','tools/ui-outside-scope-core.cjs','tools/ci-sharding-core.cjs','tools/check-ci-reports.cjs','.github/ui-global-approval.json'].includes(f));
}
function verifyVisual(reports,base,head,changed,config,approval=null){
 const {scope}=require('./ui-outside-scope-core.cjs'),routes=scope(config),keys=new Set();
 assert.equal(reports.length,4,'All four viewport/theme reports are required');let count=0;
 for(const r of reports){
  assert.equal(r.baseSHA,base,'Wrong base');assert.equal(r.headSHA,head,'Stale head');assert.ok(!r.error,r.error);
  if(approval){assert.equal(approval.baseSHA,base,'Original main baseline must remain pinned');assert.equal(r.approvedReferenceSHA,approval.approvedSHA,'Wrong design checkpoint');}else assert.equal(r.approvedReferenceSHA||null,null,'Unapproved PR must use original baseline');
  assert.deepEqual(r.changed,changed);assert.deepEqual(r.scope,config);
  assert.equal(r.selectedScenarios.length,1,'One scenario per shard');
  const {width,theme}=r.selectedScenarios[0],key=width+'-'+theme;
  assert.ok([390,1440].includes(width)&&['light','dark'].includes(theme));assert.ok(!keys.has(key),'Duplicate scenario');keys.add(key);
  const expected=needsVisualComparison(changed)?routes.map(route=>route+'-'+key):[];
  assert.deepEqual(r.results.map(x=>x.key),expected,'Missing or duplicated protected page');
  for(let i=0;i<r.results.length;i++){
    const result=r.results[i],route=routes[i];
    assert.equal(result.pass,true);
    if((config.newRoutes||[]).includes(route)){
      assert.equal(result.newRoute,true,'New page must be explicitly labelled as head-only');
      assert.equal(result.baselineAvailable,false,'New page must not pretend to have a baseline');
      assert.equal(result.headCaptured,true,'New page must be captured in the PR head');
      assert.ok(result.geometryElements>0,'New page missing DOM geometry');
      assert.ok(result.screenshotCount>0,'New page missing screenshot');
    }else{
      assert.equal(result.newRoute,undefined,'Existing protected page cannot use head-only verification');
      assert.equal(result.geometryEqual,true);
      assert.equal(result.imageCountEqual,true);
      assert.equal(result.changedPixels,0);
      if(approval){
       assert.equal(result.originalBaselineCompared,true,'Must measure original main against owner-approved design');
       assert.equal(result.originalBaselineCaptured,true,'Original baseline visual evidence missing');
       assert.ok(result.originalBaselineImageCount>0,'Original main screenshots missing');
       assert.ok(result.approvedReferenceImageCount>0,'Approved reference screenshots missing');
       assert.equal(typeof result.originalBaselineGeometryEqual,'boolean');
       assert.equal(typeof result.originalBaselineChangedPixels,'number');
       assert.equal(typeof result.originalBaselineDimensionsChanged,'boolean');
      }
    }
    count++;
  }
  assert.equal(r.result,needsVisualComparison(changed)?approval?'PASS: owner-approved global UI unchanged on all protected states':'PASS: protected entry-page states unchanged':'Not applicable: no app or visual-guard changes');
 }
 return count;
}
module.exports={partition,verifySuite,isFrontendChange,needsVisualComparison,verifyVisual};
