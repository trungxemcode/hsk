
const fs=require('fs'),vm=require('vm'),test=require('node:test'),assert=require('node:assert/strict');
const src=fs.readFileSync(__dirname+'/PhasedVocabularyAuto.gs','utf8');
function world(rows=[],files=new Map(),batches=[]){
 const values=new Map([['HSK_QUALITY_TRIAL_20261020_V3','private-trial-folder'],['HSK_VOCAB_PAIR_2_m_AFTER','9999999999999']]),cells=new Map([['2:2','AUTO_CYCLE']]);
 const p={getProperty:k=>values.get(k),setProperty:(k,v)=>values.set(k,String(v)),deleteProperty:k=>values.delete(k)};
 const control={getRange:(r,c)=>({getValue:()=>cells.get(r+':'+c),setValue:v=>cells.set(r+':'+c,v)})};
 const progress={getRange:()=>({setValues:()=>{}})},book={getSheetByName:n=>n==='Voice_Control'?control:progress};
 let stored=rows.length;const cache={getParent:()=>book},queue={getLastRow:()=>stored+1,getMaxRows:()=>5000,insertRowsAfter:()=>{},getRange:(r,c,n)=>({setValues:added=>added.forEach((x,i)=>{rows[r-2+i]=x;stored=Math.max(stored,r-1+i);})})};
 const journal={getRange:(r)=>({setValues:x=>batches[r-2]=x[0]}),appendRow:r=>batches.push(r)};
 const storage={sheet:cache,folder:{getFilesByName:n=>({hasNext:()=>files.has(n),next:()=>files.get(n)})}};
 const c={ScriptApp:{getProjectTriggers:()=>[{getHandlerFunction:()=> 'hskVocabTick'}]},Date,JSON,Math,Map,Set,Array,Object,String,Number,hskSettings_:()=>p,LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})},
 hskCheck_:()=>storage,hskVocabTables_:()=>({queue,batches:journal}),hskVocabRows_:s=>s===queue?rows:s===journal?batches:[],
 hskVoiceRecPinyin_:x=>String(x||'').replace(/\s/g,''),hskVoiceTtsModels_:()=>['m'],hskVocabKey_:(m,t)=>m+':'+t,
 hskTrialCorpus_:()=>[1,2,3,4,5,6].map(level=>({level,text:'word'+level,pinyin:'pin'+level})),
 hskVocabWrite_:(s,i,r)=>rows[i]=r,hskDigest_:s=>s,hskBatchPcm_:x=>x};
 vm.runInNewContext(src,c);
 return {c,p,values,cells,rows,batches,storage,tables:{queue,batches:journal}};
}
function row(level,state='PENDING'){return [level,'word'+level,'pin'+level,state,0,0,'','','','','','',new Date(Date.now()-3600000).toISOString(),'','','',''];}
test('bootstrap starts quality auto, pauses private trial without changing it, keeps provider cooldowns',()=>{
 const w=world([row(2),row(3),row(4)]);
 assert.equal(w.c.hskVoicePhasedTick_(),false);assert.equal(w.values.get('HSK_PHASE_AUTO_STAGE'),'234');
 assert.equal(w.values.get('HSK_QUALITY_TRIAL_20261020_V3'),'private-trial-folder');assert.equal(w.values.get('HSK_VOCAB_PAIR_2_m_AFTER'),'9999999999999');
 assert.equal(w.values.get('HSK_WARM_ENABLED'),'false');assert.equal(w.values.get('HSK_AUTO50_QUALITY_MODE'),'ENABLED');
 assert.equal(w.rows.some(r=>r[0]===5),false);
 w.cells.set('2:2','PAUSE');w.c.hskVoicePhasedTick_();assert.equal(w.cells.get('2:2'),'PAUSE');
});
test('uncompleted or held 2-4 cannot admit 1/5/6; complete phases advance in exact order with no duplicate enrollment',()=>{
 const w=world([row(2,'READY'),row(3,'READY'),row(4,'HOLD_UNCERTAIN')]);
 assert.equal(w.c.hskVoicePhasedTick_(),true);assert.equal(w.values.get('HSK_PHASE_AUTO_STAGE'),'234');assert.equal(w.rows.length,3);
 w.rows[2][3]='READY';w.c.hskVoicePhasedTick_();assert.equal(w.values.get('HSK_PHASE_AUTO_STAGE'),'1');assert.equal(w.rows.at(-1)[0],1);
 w.c.hskVoicePhasedTick_();assert.equal(w.rows.length,4);
 for(const [level,next]of [[1,'5'],[5,'6'],[6,'DONE']]){w.rows.find(r=>r[0]===level)[3]='READY';w.c.hskVoicePhasedTick_();assert.equal(w.values.get('HSK_PHASE_AUTO_STAGE'),next);}
 assert.equal(w.cells.get('2:2'),'PAUSE');assert.equal(w.rows.length,6);
});
test('candidate filter never mixes later HSK levels into an unfinished early phase',()=>{
 const w=world();w.values.set('HSK_PHASE_AUTO_20261020_V1','true');w.values.set('HSK_PHASE_AUTO_STAGE','234');
 const pending=[1,2,3,4,5,6].map(level=>({r:row(level)}));assert.deepEqual(Array.from(w.c.hskVoicePhasedCandidates_(pending,w.p),x=>x.r[0]),[2,3,4]);
});
test('stale uncertain batches reuse saved chunks and release only absent audio for owner-authorized regeneration',()=>{
 const rows=[row(2,'HOLD_UNCERTAIN'),row(4,'HOLD_UNCERTAIN')],jobs=rows.map((r,i)=>({row:i,text:r[1],pinyin:r[2],model:'m'}));
 const info={mode:'chunked_v1',plan:[{from:0,to:1,name:'saved.wav'},{from:1,to:2,name:'missing.wav'}]};
 const b=['old',JSON.stringify(jobs),'','QUARANTINED','ambiguous',new Date(Date.now()-3600000).toISOString(),0,'m',1,0,JSON.stringify(info)];
 const saved={getId:()=> 'original-wav',getBlob:()=>({getBytes:()=>[1,2]})},w=world(rows,new Map([['saved.wav',saved]]),[b]);
 w.c.hskVoicePhasedRecoverOldHolds_(w.p,w.storage,w.tables,w.rows,w.batches);
 assert.equal(w.rows[0][3],'PENDING');assert.equal(w.rows[1][3],'RETRY');assert.equal(w.batches[0][3],'TTS_CHUNKS');
 assert.equal(JSON.parse(w.batches[0][10]).plan[0].name,'saved.wav');assert.equal(JSON.parse(w.batches[0][10]).plan.length,1);
 assert.equal(JSON.parse(w.values.get('HSK_PHASE_AUTO_RECOVERY')).missingReleased,1);
});
