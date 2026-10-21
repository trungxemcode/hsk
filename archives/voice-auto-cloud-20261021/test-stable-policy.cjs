const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),test=require('node:test');
function world(count=70){
 const props=new Map([['HSK_AUTO50_ENABLED','true'],['HSK_FAST_PHASE_STAGE','234']]);
 const p={getProperty:k=>props.get(k),setProperty(k,v){props.set(k,String(v));return this},deleteProperty:k=>props.delete(k)};
 const c={Date,Math,Set,Map,JSON,Object,Array,String,Number,hskDigest_:x=>x.slice(0,100),hskVNTime_:d=>d.toISOString(),hskFastPhaseLevels_:s=>s==='234'?[2,3,4]:[Number(s)]};vm.createContext(c);
 vm.runInContext(fs.readFileSync(__dirname+'/StableAutoPolicy.js','utf8'),c);
 const rows=Array.from({length:count},(_,i)=>[2,'词'+i,'ci'+i,'RETRY']);
 return {c,p,props,rows,pending:()=>rows.map((r,i)=>({r,i})).filter(x=>['PENDING','RETRY'].includes(x.r[3]))};
}
test('one or two passes cannot open another cohort; the threshold is 30 verified words',()=>{
 const w=world();w.c.hskStableCycleFilter_(w.p,w.rows,w.pending());const original=w.props.get('HSK_STABLE_CYCLE');
 for(const count of [1,2,29]){for(let i=0;i<count;i++)w.rows[i][3]='READY';const next=w.c.hskStableCycleFilter_(w.p,w.rows,w.pending());assert.ok(next.every(x=>x.i<50));assert.equal(w.props.get('HSK_STABLE_CYCLE'),original)}
 w.rows[29][3]='EXISTING';w.c.hskStableCycleObserve_(w.p,w.rows,[]);assert.equal(w.props.has('HSK_STABLE_CYCLE'),false);
 const next=w.c.hskStableCycleFilter_(w.p,w.rows,w.pending());assert.ok(next.some(x=>x.i>=50));
});
test('an active physical journal cannot be closed and adopted again at the threshold',()=>{
 const w=world();w.c.hskStableCycleFilter_(w.p,w.rows,w.pending());const original=w.props.get('HSK_STABLE_CYCLE');for(let i=0;i<30;i++)w.rows[i][3]='READY';
 w.c.hskStableCycleObserve_(w.p,w.rows,[['physical','[]','','AUTO_VERIFY']]);assert.equal(w.props.get('HSK_STABLE_CYCLE'),original);
 w.c.hskStableCycleObserve_(w.p,w.rows,[]);assert.equal(w.props.has('HSK_STABLE_CYCLE'),false);
});
test('the last 13 stage words remain one cohort until all 13 pass; next HSK stage excluded',()=>{
 const w=world(14);w.rows[13][0]=1;w.c.hskStableCycleFilter_(w.p,w.rows,w.pending());const c=JSON.parse(w.props.get('HSK_STABLE_CYCLE'));assert.equal(c.target,13);assert.equal(c.tail,true);
 w.rows[0][3]='READY';w.rows[1][3]='EXISTING';assert.equal(w.c.hskStableCycleFilter_(w.p,w.rows,w.pending()).length,11);
 w.c.hskStableCycleObserve_(w.p,w.rows,[]);assert.equal(JSON.parse(w.props.get('HSK_STABLE_CYCLE')).id,c.id);
 for(let i=0;i<13;i++)w.rows[i][3]='READY';w.c.hskStableCycleObserve_(w.p,w.rows,[]);assert.equal(w.props.has('HSK_STABLE_CYCLE'),false);assert.equal(w.rows[13][3],'RETRY');
});
test('adopts an in-flight journal without losing saved passes; changed identity and REVIEW never pass',()=>{
 const w=world(13);w.rows[0][3]='READY';w.rows[1][3]='REVIEW';w.c.hskStableCycleObserve_(w.p,w.rows,[['inflight',JSON.stringify([{row:0},{row:1}]),'','AUTO_VERIFY']]);
 w.rows[2][1]='edited';const c=JSON.parse(w.props.get('HSK_STABLE_CYCLE')),n=w.c.hskStableCycleCount_(c,w.rows);assert.equal(n.done,1);assert.equal(n.review,1);assert.equal(n.changed,1);
 const before=JSON.stringify(w.rows);w.c.hskStableCycleFilter_(w.p,w.rows,w.pending());assert.equal(JSON.stringify(w.rows),before);assert.ok(w.props.has('HSK_STABLE_CYCLE'));
});
test('TTS prefers the successful key/model, then same key on another eligible model',()=>{
 const w=world();w.c.hskStableTtsSuccess_(w.p,'tts-a',4);const other={slot:1,model:'tts-b'},same={slot:4,model:'tts-b'},exact={slot:4,model:'tts-a'};
 assert.equal(w.c.hskStablePreferTts_(w.p,[other,same,exact])[0],exact);assert.equal(w.c.hskStablePreferTts_(w.p,[other,same])[0],same);assert.equal(w.c.hskStablePreferTts_(w.p,[other])[0],other);
});
test('eligible sticky TTS pair survives legacy round-robin; cooled pair is never selected',()=>{
 const w=world();vm.runInContext(fs.readFileSync(__dirname+'/VoiceModelRotation.js','utf8'),w.c);const models=w.c.hskVoiceTtsModels_();w.c.hskStableTtsSuccess_(w.p,models[2],4);w.p.setProperty('HSK_VOCAB_NEXT_SLOT','8');
 w.c.hskVocabCall_=()=>({ok:true,modelSlots:[{slot:1,model:models[0]},{slot:4,model:models[2]}]});let r=w.c.hskVoiceRoutePairs_(w.p,'test',Date.now(),models[0]);assert.equal(r.pairs[0].slot,4);
 w.p.setProperty('HSK_VOCAB_PAIR_4_'+models[2]+'_AFTER',Date.now()+600000);r=w.c.hskVoiceRoutePairs_(w.p,'test',Date.now(),models[0]);assert.equal(r.pairs[0].slot,1);assert.ok(r.waitUntil>Date.now());
});
test('ASR successes and quality failures keep the key; quota failure alone triggers bounded failover',()=>{
 const w=world(),now=Date.now();for(let i=0;i<30;i++)assert.equal(w.c.hskStableAsrSlot_(w.p,now).slot,10);
 w.c.hskStableAsrError_(w.p,10,{upstreamStatus:422},'asr_unverified_audio');assert.equal(w.c.hskStableAsrSlot_(w.p,now).slot,10);
 w.c.hskStableAsrError_(w.p,10,{upstreamStatus:429,retryAfter:600},'rate_limited');assert.ok(Number(w.props.get('HSK_STABLE_ASR_10_AFTER'))>=now+600000);assert.equal(w.c.hskStableAsrSlot_(w.p,now).slot,12);
 for(let slot=1;slot<=12;slot++)w.p.setProperty('HSK_STABLE_ASR_'+slot+'_AFTER',now+600000);assert.equal(w.c.hskStableAsrSlot_(w.p,now).slot,0);assert.equal(w.c.hskStableAsrSlot_(w.p,now).retryAt,now+600000);
});
test('TTS format/quality failures do not classify as unavailable keys',()=>{
 const w=world();for(const e of ['invalid_tts_audio','tts_generation_incomplete','tts_request_rejected','asr_unverified_audio'])assert.equal(w.c.hskStableTtsUnavailable_(e),false);
 for(const e of ['tts_rate_limited','tts_daily_limit','tts_key_invalid','tts_provider_unavailable'])assert.equal(w.c.hskStableTtsUnavailable_(e),true);
});
test('new cache entries record the actual chunk key; existing READY stays immutable',()=>{
 const w=world();vm.runInContext(fs.readFileSync(__dirname+'/AutoCycle.js','utf8'),w.c);let entry,writes=0;w.c.hskFastPhaseKey_=(m,t)=>m+t;w.c.hskGetRow_=()=>null;w.c.Utilities={newBlob:()=>({})};
 const storage={sheet:{appendRow(r){entry=r;writes++}},folder:{getFilesByName:()=>({hasNext:()=>false}),createFile:()=>({getId:()=> 'saved'})}},job={text:'词',pinyin:'cí',level:2,model:'tts',slot:7};
 w.c.hskAuto50Cache_(storage,job,'master',[1,2],1,'batch','exact');assert.equal(entry[10],7);
 w.c.hskGetRow_=()=>({values:['','','','tts','good','','','','','','','READY']});w.c.hskAuto50Cache_(storage,job,'master',[1,2],1,'batch','exact');assert.equal(writes,1);
});
