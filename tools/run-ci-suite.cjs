const fs=require('node:fs'),path=require('node:path'),{spawnSync,execFileSync}=require('node:child_process');
const {partition}=require('./ci-sharding-core.cjs'),suites=require('./ci-suites.json');
const [suite,shardArg,totalArg,dir]=process.argv.slice(2),shard=Number(shardArg),shards=Number(totalArg);
if(!suites[suite]||!dir)throw Error('Usage: run-ci-suite.cjs SUITE INDEX TOTAL REPORT_DIR');
const commands=partition(suites[suite],shard,shards);
const report={suite,shard,shards,headSHA:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),results:[]};
fs.mkdirSync(dir,{recursive:true});const save=()=>fs.writeFileSync(path.join(dir,'report.json'),JSON.stringify(report,null,2));save();
for(const command of commands){
 const result={command,exitCode:null};report.results.push(result);save();
 console.log('::group::'+command);const start=performance.now();
 const p=spawnSync('bash',['-e','-o','pipefail','-c',command],{stdio:'inherit',env:process.env});
 result.exitCode=p.status===null?1:p.status;result.durationSeconds=Math.round((performance.now()-start)/100)/10;
 if(p.error)console.error(p.error);save();console.log('::endgroup::');
 console.log((result.exitCode?'FAIL ':'PASS ')+result.durationSeconds+'s '+command);
}
process.exitCode=report.results.some(x=>x.exitCode!==0)?1:0;
