const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync(require('node:path').join(__dirname,'VoiceControl.gs'),'utf8');
let triggers=[{getHandlerFunction:()=> 'hskVocabTick'}],state={},cells={2:'PAUSE',6:'PREPARED_NOT_STARTED'};
const ctl={getRange(r,c,h,w){return {getValue(){return cells[r]||''},setValue(x){cells[r]=x},setValues(x){cells[r]=x[0][0]}}}};
const g={console,Date,String,Array,Number,Math,JSON,Set,Error,
 SpreadsheetApp:{openById(){return {getSheetByName(name){return name==='Voice_Control'?ctl:null}}}},
 LockService:{getScriptLock(){return {tryLock(){return true},releaseLock(){}}}},
 ScriptApp:{getProjectTriggers(){return triggers},newTrigger(name){return {timeBased(){return {everyMinutes(n){assert(n===1||n===5);return {create(){triggers.push({getHandlerFunction:()=>name})}}}}}}},deleteTrigger(t){triggers=triggers.filter(x=>x!==t)}}
};
vm.createContext(g);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'Shared50.gs'),'utf8'),g);vm.runInContext(code,g);
const p={getProperty(k){return k==='HSK_VOICE_SHEET_ID'?'sheet-id':state[k]},setProperty(k,v){state[k]=v}};
assert.equal(g.hskVoiceRecHanzi_(' 大 家。 '),'大家');assert.equal(g.hskVoiceRecPinyin_(' dǎ lánqiú '),'dǎlánqiú');
assert.equal(g.hskVoiceControlPoll_(p),true);assert.equal(state.HSK_VOCAB_ENABLED,'false');
assert(triggers.some(t=>t.getHandlerFunction()==='hskVoiceControlFastTick'));assert(!triggers.some(t=>t.getHandlerFunction()==='hskVocabTick'));
assert.equal(cells[6],'PAUSED_BY_SHEET');
cells[2]='RUN_VOCAB';assert.equal(g.hskVoiceControlPoll_(p),true);assert.equal(cells[2],'RUNNING');assert.equal(state.HSK_VOCAB_ENABLED,'true');
assert(triggers.some(t=>t.getHandlerFunction()==='hskVocabTick'));
console.log('OK: sheet pause, persistent control trigger, explicit resume, Hanzi/pinyin normalization; no TTS.');
