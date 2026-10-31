const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {verifySuite,verifyVisual}=require('./ci-sharding-core.cjs');
function reports(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?reports(path.join(dir,e.name)):e.name==='report.json'?[JSON.parse(fs.readFileSync(path.join(dir,e.name),'utf8'))]:[]);}
const [mode,...args]=process.argv.slice(2);let count;
if(mode==='suite'){
 const [suite,total,dir,head]=args,commands=require('./ci-suites.json')[suite];
 if(!commands)throw Error('Unknown suite');count=verifySuite(reports(dir),commands,suite,Number(total),head);
}else if(mode==='visual'){
 const [dir,head,base]=args;
 const changed=execFileSync('git',['diff','--name-only',base,head],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
 const config=changed.includes('.github/ui-scope.json')?JSON.parse(fs.readFileSync('.github/ui-scope.json','utf8')):{request:'No exclusions declared in this PR',excludedRoutes:[]};
 count=verifyVisual(reports(dir),base,head,changed,config);
}else throw Error('Unknown report mode');
console.log('PASS complete coverage: '+count+' '+(mode==='visual'?'protected states':'test commands'));
