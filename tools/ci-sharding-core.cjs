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
function verifyVisual(reports,base,head,changed,config){
 const {scope}=require('./ui-outside-scope-core.cjs'),routes=scope(config),keys=new Set();
 assert.equal(reports.length,4,'All four viewport/theme reports are required');let count=0;
 for(const r of reports){
  assert.equal(r.baseSHA,base,'Wrong base');assert.equal(r.headSHA,head,'Stale head');assert.ok(!r.error,r.error);
  assert.deepEqual(r.changed,changed);assert.deepEqual(r.scope,config);
  assert.equal(r.selectedScenarios.length,1,'One scenario per shard');
  const {width,theme}=r.selectedScenarios[0],key=width+'-'+theme;
  assert.ok([390,1440].includes(width)&&['light','dark'].includes(theme));assert.ok(!keys.has(key),'Duplicate scenario');keys.add(key);
  const expected=isFrontendChange(changed)?routes.map(route=>route+'-'+key):[];
  assert.deepEqual(r.results.map(x=>x.key),expected,'Missing or duplicated protected page');
  for(const result of r.results){assert.equal(result.pass,true);assert.equal(result.geometryEqual,true);assert.equal(result.imageCountEqual,true);assert.equal(result.changedPixels,0);count++;}
  assert.equal(r.result,isFrontendChange(changed)?'PASS: protected entry-page states unchanged':'Not applicable: no rendered app files changed');
 }
 return count;
}
module.exports={partition,verifySuite,isFrontendChange,verifyVisual};
