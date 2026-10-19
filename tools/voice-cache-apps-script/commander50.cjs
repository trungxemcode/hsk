#!/usr/bin/env node
/** Plus and Work use this same Desktop Commander command; no browser or API key copy. */
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const action=process.argv[2]||'help';
if(!['run50','pause'].includes(action)){console.log('Usage: node commander50.cjs run50 | pause\nExecution and results: existing Voice_Control sheet.');process.exit(action==='help'?0:1);}
const lock=path.join(os.tmpdir(),'hsk-shared-voice50-command.lock'),stage=fs.mkdtempSync(path.join(os.tmpdir(),'hsk-shared50-'));
let acquired=false;
try{
 fs.mkdirSync(lock);acquired=true;
 const config=process.env.HSK_VOICE_CLASP_PROJECT||path.join(os.homedir(),'hsk-work-voice50','.clasp.json');
 fs.copyFileSync(config,path.join(stage,'.clasp.json'));
 const bin=process.platform==='win32'?'npx.cmd':'npx';
 function clasp(args){cp.execFileSync(bin,['--yes','@google/clasp',...args],{cwd:stage,stdio:'inherit',shell:process.platform==='win32'});}
 // Pull before every command; never upload a stale local copy of the live project.
 clasp(['pull']);
 require('./shared50-install.cjs')(stage);
 const id=crypto.randomUUID(),command=action==='run50'?'RUN_ONCE_50':'PAUSE';
 fs.writeFileSync(path.join(stage,'Shared50Command.js'),'/** Private one-shot control; no credentials. */\nvar HSK_SHARED50_COMMAND_ = '+JSON.stringify({id,command})+';\n');
 clasp(['push','--force']);
 console.log('Queued '+command+' / '+id+'. Existing Google trigger will acknowledge once. Check Voice_Control; do not submit another run while RUNNING_ONCE_50.');
}finally{
 if(acquired)fs.rmSync(lock,{recursive:true,force:true});
 fs.rmSync(stage,{recursive:true,force:true});
}
