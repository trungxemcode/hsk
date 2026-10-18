const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const settings=new Map([['HSK_VOICE_TOKEN','unit-test-secret'],['HSK_VOICE_TTS_TRANSPORT','direct'],['HSK_VOICE_SHEET_ID','sheet-for-tests'],['HSK_VOICE_FOLDER_ID','folder-for-tests'],['GEMINI_TTS_KEY_1','mock-key-1'],['GEMINI_TTS_KEY_2','mock-key-2']]);
const rows=[],files=new Map(),requests=[],cooldown=new Map();let locks=0;
const provider=()=>{
 const prop={getProperty:k=>settings.get(k)||null,setProperty:(k,v)=>settings.set(k,v)};
 const sheet={getLastRow:()=>rows.length+1,
  getRange:(row,col,n,m)=>({
   createTextFinder:(needle)=>({matchEntireCell:()=>({findNext:()=>{let idx=rows.findIndex(x=>x[0]===needle);return idx<0?null:{getRow:()=>idx+2};}})}),
   getValues:()=>[rows[row-2].slice(col-1,col-1+m)],
   setValues:values=>{for(let i=0;i<values[0].length;i++)rows[row-2][col-1+i]=values[0][i];}
  }),
  appendRow:values=>{rows.push(values);}
 };
 const drive={getFolderById:()=>({createFile:blob=>{const id='f'+(files.size+1);const f={getId:()=>id,getBlob:()=>({getBytes:()=>blob.bytes})};files.set(id,f);return f;}}),getFileById:id=>{if(!files.has(id))throw Error('missing_file');return files.get(id);}};
 const utilities={DigestAlgorithm:{SHA_256:'SHA_256'},Charset:{UTF_8:'UTF_8'},
  computeDigest:(_alg,text)=>[...require('node:crypto').createHash('sha256').update(text).digest()].map(x=>x>127?x-256:x),
  base64Decode:s=>[...Buffer.from(s,'base64')],base64Encode:b=>Buffer.from(b.map(x=>x&255)).toString('base64'),
  newBlob:(b,mime,name)=>({bytes:b,mime,name})};
 const ctx={console,Date,JSON,Array,String,Number,Error,encodeURIComponent,
  PropertiesService:{getScriptProperties:()=>prop},
  SpreadsheetApp:{openById:()=>({getSheetByName:()=>sheet})},DriveApp:drive,Utilities:utilities,
  CacheService:{getScriptCache:()=>({get:k=>cooldown.get(k)||null,put:(k,v)=>cooldown.set(k,v)})},
  LockService:{getScriptLock:()=>({tryLock:()=>{locks++;return true;},releaseLock:()=>{locks--;}})},
  UrlFetchApp:{fetch:(url,opt)=>{
   assert.match(url,/generativelanguage.googleapis.com/);
   const k=opt.headers['x-goog-api-key'];requests.push(k);
   if(k==='mock-key-1')return {getResponseCode:()=>429,getContentText:()=>JSON.stringify({error:'rate'})};
   assert.equal(k,'mock-key-2');
   return {getResponseCode:()=>200,getContentText:()=>JSON.stringify({candidates:[{content:{parts:[{inlineData:{data:Buffer.from([0,0,1,0]).toString('base64'),mimeType:'audio/L16;codec=pcm;rate=24000'}}]}}]})};
  }},
  ContentService:{MimeType:{JSON:'application/json'},createTextOutput:x=>({value:x,setMimeType(){return this;}})}
 };
 vm.createContext(ctx);
 vm.runInContext(fs.readFileSync(path.join(__dirname,'Code.gs'),'utf8'),ctx,{filename:'Code.gs'});
 return ctx;
};
const s=provider();
const call=(text)=>s.hskHandle_({token:'unit-test-secret',action:'speech',text,language:'zh-CN'},s.hskSettings_());
assert.throws(()=>s.hskHandle_({action:'ping',token:'wrong'},s.hskSettings_()),/unauthorized/);
assert.equal(s.hskHandle_({action:'ping',token:'unit-test-secret'},s.hskSettings_()).keyCount,2);
assert.throws(()=>call(''),/invalid_text/);
assert.throws(()=>call('你'.repeat(221)),/invalid_text/);
const a=call('你好');
assert.equal(a.cached,false);
assert.equal(a.mime,'audio/wav');
assert.equal(Buffer.from(a.audioBase64,'base64').toString('ascii',0,4),'RIFF');
assert.deepEqual(requests,['mock-key-1','mock-key-2']);
assert.equal(rows.length,1);
assert.equal(rows[0].includes('你好'),false);
const b=call('你好');assert.equal(b.cached,true);assert.deepEqual(requests,['mock-key-1','mock-key-2']);assert.equal(rows[0][9],1);
const c=call('谢谢');assert.equal(c.cached,false);assert.equal(rows.length,2);assert.equal(requests.length,3);
assert.equal(locks,0);
settings.set('HSK_VOICE_PAUSED','true');
assert.throws(()=>call('再见'),/paused/);
console.log('PASS: secret gate, quotas-safe bounded text, Gemini retry/failover, WAV header, hashed cache, reuse without API, metadata only, pause kill-switch, lock cleanup.');
