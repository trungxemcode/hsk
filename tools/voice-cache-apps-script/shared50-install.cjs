const fs=require('fs'),path=require('path');
module.exports=function install(dir){
 const lib=fs.readFileSync(path.join(__dirname,'Shared50.gs'),'utf8');fs.writeFileSync(path.join(dir,'Shared50.js'),lib);
 let f=path.join(dir,'VoiceControl.js'),s=fs.readFileSync(f,'utf8');
 if(!s.includes('hskShared50QueuedCommand_(p,control)')){
  s=s.replace(" if(!control)return false;"," if(!control)return false;\n if(typeof hskShared50QueuedCommand_==='function')hskShared50QueuedCommand_(p,control);\n var shared=hskShared50Control_(p,book,control,String(control.getRange(15,2).getValue()||'').trim());\n if(shared!==null)return shared;");
 }
 fs.writeFileSync(f,s);
 f=path.join(dir,'Vocabulary.js');s=fs.readFileSync(f,'utf8');
 if(!s.includes('var pair=hskShared50Pair_')){
  const start=s.indexOf(' var health=hskParallelAvailability_(token)'),end=s.indexOf(' pending.forEach',start);
  if(start<0||end<0)throw Error('Unknown Vocabulary routing; review required.');
  s=s.slice(0,start)+" var pair=hskShared50Pair_(token,now);\n if(!pair){p.setProperty('HSK_VOCAB_RETRY_AT',String(now+300000));p.setProperty('HSK_VOCAB_ERROR','tts_keys_cooling');return;}\n var slot=pair.slot,model=pair.model,size=Math.max(1,Math.min(90,Number(p.getProperty('HSK_VOCAB_BATCH_SIZE')||10))),seen=new Set(),jobs=[];\n"+s.slice(end);
  s=s.replace("isolated:true,keySlot:slot,language:","isolated:true,keySlot:slot,model:model,language:");
  s=s.replace("p.setProperty('HSK_VOCAB_NEXT_SLOT',String((slot+1)%13));","p.setProperty('HSK_VOCAB_NEXT_SLOT',String((slot+1)%13));p.setProperty('HSK_VOCAB_NEXT_MODEL',String((pair.mi+1)%2));");
  s=s.replaceAll("'HSK_VOCAB_SLOT_'+slot+'_AFTER'","'HSK_VOCAB_PAIR_'+slot+'_'+model+'_AFTER'");
 }
 s=s.replace("tts_(request_rejected|","tts_(blocked|request_rejected|");
 s=s.replace("String(Math.max(3,Math.floor(jobs.length/2)))","String(p.getProperty('HSK_VOCAB_FIXED_BATCH')==='true'?50:Math.max(3,Math.floor(jobs.length/2)))");
 s=s.replace("if(batch[3]==='DONE')p.setProperty","if(batch[3]==='DONE'&&p.getProperty('HSK_VOCAB_FIXED_BATCH')!=='true')p.setProperty");
 // A literal transcript is a bounded opt-in for the one-shot pilot only.
 if(!s.includes('HSK_SHARED50_LITERAL')){
  s=s.replace("payload:JSON.stringify({items:jobs.map(function(j){return j.text;}),isolated:true,keySlot:slot,model:model,language:'zh-CN',pauseSeconds:pause})",
   "payload:JSON.stringify(p.getProperty('HSK_SHARED50_LITERAL')==='true'&&p.getProperty('HSK_VOCAB_PILOT_ONLY')==='true'&&Array.from(jobs.map(function(j){return j.text;}).join('。')).length<=220?{text:jobs.map(function(j){return j.text;}).join('。'),isolated:true,keySlot:slot,model:model,language:'zh-CN'}:{items:jobs.map(function(j){return j.text;}),isolated:true,keySlot:slot,model:model,language:'zh-CN',pauseSeconds:pause})");
 }
 fs.writeFileSync(f,s);
 for(const name of ['Shared50.js','Vocabulary.js','VoiceControl.js'])new(require('vm').Script)(fs.readFileSync(path.join(dir,name),'utf8'),{filename:name});
};
if(require.main===module){module.exports(process.argv[2]);console.log('Merged shared adapter into fresh Google source, preserving recovery changes.');}
