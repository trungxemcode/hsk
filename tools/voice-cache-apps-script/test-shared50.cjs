const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
let state={},cells={15:'RUN_ONCE_50'},triggers=[],batches=[],claims=0;
const p={getProperty:k=>state[k],setProperty(k,v){state[k]=v;return this},deleteProperty(k){delete state[k]}};
const control={getRange(r,c){return {getValue:()=>cells[r]||'',setValue:v=>{cells[r]=v},setValues:rows=>rows.forEach((x,i)=>cells[r+i]=x[1]===undefined?x[0]:x[1])}}};
const book={},storage={},tables={batches:{}};
const g={console,Date,Math,Number,String,Array,JSON,Error,
 hskSettings_:()=>p,hskCheck_:()=>storage,hskVocabTables_:()=>tables,hskVocabRows_:()=>batches,
 hskVocabCall_:(token,body)=>({slots:[{slot:2,retryAfter:0},{slot:3,retryAfter:500}]}),
 LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})},
 SpreadsheetApp:{flush(){}},
 ScriptApp:{getProjectTriggers:()=>triggers,newTrigger:n=>({timeBased:()=>({everyMinutes:()=>({create:()=>{claims++;triggers.push({getHandlerFunction:()=>n})}})})})},
 hskVocabStop(){state.HSK_VOCAB_ENABLED='false'}
};
vm.createContext(g);vm.runInContext(fs.readFileSync(__dirname+'/Shared50.gs','utf8'),g);
state.HSK_VOCAB_PAIR_2_garbage_AFTER='9999999';
assert.equal(g.hskShared50Control_(p,book,control,'RUN_ONCE_50'),true);
assert.equal(state.HSK_VOCAB_BATCH_SIZE,'50');assert.equal(state.HSK_VOCAB_PILOT_ONLY,'true');assert.equal(cells[15],'RUNNING_ONCE_50');
assert.equal(g.hskShared50Control_(p,book,control,'RUNNING_ONCE_50'),false);assert.equal(claims,1);
assert.equal(g.hskShared50Control_(p,book,control,'RUN_ONCE_50'),true);assert.equal(claims,1);
cells[15]='RUN_ONCE_50';batches=[['x','','','UNCERTAIN']];
assert.equal(g.hskShared50Control_(p,book,control,'RUN_ONCE_50'),true);assert.equal(cells[6],'BLOCKED_UNRESOLVED_MASTER');assert.equal(claims,1);
state['HSK_VOCAB_PAIR_2_gemini-2.5-flash-preview-tts_AFTER']='2000';
let pair=g.hskShared50Pair_('not-a-token',1000);assert.equal(pair.model,'gemini-3.1-flash-tts-preview');assert.equal(pair.slot,2);
state['HSK_VOCAB_PAIR_2_gemini-3.1-flash-tts-preview_AFTER']='2000';assert.equal(g.hskShared50Pair_('not-a-token',1000),null);
console.log('PASS: shared command claims once; 50 items; unresolved request guard; model cooldown preserved; no extra TTS.');

let pcm=Buffer.alloc(50*48000*2),files=new Map(),created=0;
for(let i=0;i<50;i++)for(let j=i*96000+4800;j<i*96000+19200;j+=2)pcm.writeInt16LE(Math.round(Math.sin(j/11)*10000),j);
const folder={getId:()=> 'preview-folder',getUrl:()=> 'https://drive.google.com/drive/folders/preview-folder',
 getFilesByName:n=>({hasNext:()=>files.has(n)}),createFile(x,txt){const name=typeof x==='string'?x:x.name;if(files.has(name))throw Error('duplicate_preview');files.set(name,x);created++;}};
g.hskBatchPcm_=()=>pcm;g.hskWav_=x=>x;g.DriveApp={getFileById:()=>({getBlob:()=>({getBytes:()=>pcm})}),getFolderById:()=>folder};
g.Utilities={newBlob:(bytes,mime,name)=>({bytes,mime,name})};g.MimeType={PLAIN_TEXT:'text/plain'};
storage.folder={createFolder:()=>folder};
const batch=['test50',JSON.stringify([{text:'sample',pinyin:'sample'}]),'master'];
g.hskShared50Preview_(p,storage,batch,control);assert.equal(cells[21],20);
g.hskShared50Preview_(p,storage,batch,control);assert.equal(cells[21],40);
g.hskShared50Preview_(p,storage,batch,control);assert.equal(cells[21],50);
assert.equal(files.size,51);assert.equal(JSON.parse(files.get('manifest.json')&&'{}').verified,undefined);
const n=created;g.hskShared50Preview_(p,storage,batch,control);assert.equal(created,n);
assert.equal(state.HSK_SHARED50_PREVIEW_test50_done,'true');
console.log('PASS: 50 synthetic utterances cut as 20+20+10; resume creates no duplicate clips; previews never READY.');
