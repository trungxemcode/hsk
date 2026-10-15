/* Account storage: per-item revisions, account isolation, offline queue. */
(function(root){
 const Study=root.HSKStudySyncCore||(typeof require==='function'?require('./study-sync-core.js'):null);
 const KEYS=['hsk-flashcards-progress-v1','hsk-flashcards-mistakes-v1','hsk-adaptive-learning-v1','hsk-memory-preferences-v1','hsk-course-lessons-v1','hsk-exam-practice-v1','hsk-open-dictionary-srs-v1','hsk-vocabulary-notebook-v1','hsk-study-sync-v1','hsk-notebook-learning-v1'];
 const clone=x=>JSON.parse(JSON.stringify(x));
 function flatten(storage){const out={};for(const key of KEYS){let value;try{value=JSON.parse(storage[key]||'null');}catch(_){continue;}if(!value||typeof value!=='object')continue;
  if(key===KEYS[0]){for(const [id,v] of Object.entries(value.words||{}))out['word:'+id]=v;}
  else if(key===KEYS[1]){for(const v of value.entries||[])if(v?.id)out['mistake:'+v.id]=v;}
  else if(key===KEYS[2]){for(const [id,v] of Object.entries(value.stats||{}))out['adaptive:'+id]=v;out['adaptive:enabled']=value.enabled!==false;}
  else if(key===KEYS[3])out['memory:preferences']=value;
  else if(key===KEYS[4])for(const [id,v] of Object.entries(value.lessons||{}))out['lesson:'+id]=v;
  else if(key===KEYS[5]){for(const [id,v] of Object.entries(value.records||{}))out['exam:'+id]=v;for(const [id,v] of Object.entries(value.drafts||{}))out['exam-draft:'+id]=v;}
  else if(key===KEYS[6])for(const [id,v] of Object.entries(value.items||{}))out['open-word:'+id]=v;
  else if(key===KEYS[7])for(const [id,v] of Object.entries(value.items||{}))out['notebook:'+id]=v;
  else if(key===KEYS[8]&&Study)Object.assign(out,Study.flatten(value));
  else if(key===KEYS[9])for(const[id,v]of Object.entries(value.stories||{}))out['notebook-story:'+id]=v;
 }return out;}
 function materialize(items,owner='guest'){const study={};const words={},entries=[],stats={},lessons={},records={},drafts={},openWords={},notebook={},stories={};let enabled=true,memory={context:false,newWords:false};for(const [id,item] of Object.entries(items)){if(!valid(item)||item.deleted)continue;const v=item.value;if(id.startsWith('word:'))words[id.slice(5)]=v;else if(id.startsWith('mistake:'))entries.push(v);else if(id==='adaptive:enabled')enabled=v!==false;else if(id.startsWith('adaptive:'))stats[id.slice(9)]=v;else if(id==='memory:preferences')memory=v;else if(id.startsWith('lesson:'))lessons[id.slice(7)]=v;else if(id.startsWith('exam:'))records[id.slice(5)]=v;else if(id.startsWith('exam-draft:'))drafts[id.slice(11)]=v;else if(id.startsWith('open-word:'))openWords[id.slice(10)]=v;else if(id.startsWith('notebook:'))notebook[id.slice(9)]=v;else if(id.startsWith('notebook-story:'))stories[id.slice(15)]=v;else if(id.startsWith('study-'))study[id]=v;}
 return {[KEYS[0]]:JSON.stringify({version:1,words}),[KEYS[1]]:JSON.stringify({version:1,entries}),[KEYS[2]]:JSON.stringify({version:1,enabled,stats}),[KEYS[3]]:JSON.stringify(memory),[KEYS[4]]:JSON.stringify({version:1,lessons}),[KEYS[5]]:JSON.stringify({version:1,records,drafts}),[KEYS[6]]:JSON.stringify({version:1,items:openWords}),[KEYS[7]]:JSON.stringify({version:1,items:notebook}),[KEYS[8]]:JSON.stringify(Study?Study.fromRecords(study,owner):{}),[KEYS[9]]:JSON.stringify({version:1,stories})};}
 function valid(x){return !!x&&Number.isFinite(x.time)&&x.time>=0&&typeof x.writer==='string'&&typeof x.deleted==='boolean'&&(x.deleted||x.value!==undefined);}
 function compare(a,b){if(!a)return -1;if(!b)return 1;return a.time-b.time||a.writer.localeCompare(b.writer);}
 function revision(previous,time,writer,value,deleted=false){return {time:Math.max(time,(previous?.time||0)+1),writer,value:deleted?null:clone(value),deleted};}
 function capture(items,before,after,time,writer){const a=flatten(before),b=flatten(after),next={...items},changed=[];for(const id of new Set([...Object.keys(a),...Object.keys(b)])){if(id.startsWith('study-keys:')&&!(id in b))continue;if(JSON.stringify(a[id])===JSON.stringify(b[id]))continue;let value=b[id];if(id==='study-plan:current'&&value&&a[id]?.id===value.id&&next[id]?.value){if(next[id].value.id!==value.id)continue;value={...next[id].value};for(const field of new Set([...Object.keys(a[id]||{}),...Object.keys(b[id])]))if(JSON.stringify(a[id]?.[field])!==JSON.stringify(b[id][field])){if(field in b[id])value[field]=b[id][field];else delete value[field];}}next[id]=revision(next[id],time,writer,value,!(id in b));changed.push(id);}return {items:next,changed};}
 function merge(local,remote){const result={...local};for(const [id,item] of Object.entries(remote))if(valid(item)&&compare(item,result[id])>0)result[id]=clone(item);return result;}
 function importGuest(items,storage,time,writer){const next={...items},changed=[];for(const [id,value] of Object.entries(flatten(storage))){if(next[id]&&!next[id].deleted)continue;next[id]=revision(next[id],time,writer,value);changed.push(id);}return {items:next,changed};}
 const supportedId=id=>typeof id==='string'&&['word:','mistake:','adaptive:','memory:','lesson:','notebook:','notebook-story:','exam:','exam-draft:','open-word:','study-plan:','study-keys:','study-journal:','study-array:','study-activity:'].some(p=>id.startsWith(p));
 const api={KEYS,supportedId,flatten,materialize,valid,compare,capture,merge,importGuest};root.HSKAccountCore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
