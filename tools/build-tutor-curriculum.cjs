// Reproduce the published lesson payload, then pin it without shipping learner data.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),read=n=>fs.readFileSync(path.join(root,n),'utf8');
const c={};vm.createContext(c);for(const n of ['words','exampleMetadata','checkedPracticeExamples','dictionarySupplement'])vm.runInContext(read('content/data/'+n+'.js')+'\nglobalThis.'+n+'='+n+';',c);
for(const w of c.words){const key=`${w.hsk}|${w.han}|${w.pin}`;w.learningKey=key;Object.assign(w,c.exampleMetadata.corrections[key]||{});let base=w.mean;const m=base.match(/^([^()]+)\(([^()]+)\)\s*$/);if(m&&m[1].trim().toLocaleLowerCase('vi')===w.hv.toLocaleLowerCase('vi'))base=m[2];w.mean=[...new Set([base,...(c.dictionarySupplement.entries[key]?.meanings||[]).map(x=>x.gloss),...(c.checkedPracticeExamples.entries[key]?.meanings||[]),c.dictionarySupplement.entries[key]?.example?.meaning,c.exampleMetadata.original[key]?.meaning].filter(Boolean))].join('; ');}
const index=new Map();for(const w of c.words)for(const han of new Set([w.han,...w.han.split(/[()（）]/).map(s=>s.trim()).filter(Boolean)])){const xs=index.get(han)||[];xs.push(w);index.set(han,xs);}
const aliases=new Map([['贏','赢'],['內容','内容'],['勺（子）','勺子']]);
const stable=x=>JSON.stringify(sort(x));function sort(x){return Array.isArray(x)?x.map(sort):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,sort(x[k])])):x;}
const hash=x=>crypto.createHash('sha256').update(stable(x)).digest('hex'),courses=JSON.parse(read('lessons-data.json')).courses,mini=JSON.parse(read('lesson-mini-data.json')).lessons,lessons={},contexts={};
for(const course of courses){const contents=new Map(JSON.parse(read('lesson-content-hsk'+course.hsk+'.json')).lessons.map(l=>[l.id,l]));for(const l of course.lessons){const words=[],seen=new Set();for(const han of l.words)for(const w of index.get(aliases.get(han)||han)||[]){if(!seen.has(w.learningKey)){words.push({han:w.han,pin:w.pin,mean:w.mean});seen.add(w.learningKey);}}const context={id:l.id,hsk:course.hsk,title:l.title,vi:l.vi,number:l.number,words,content:{...contents.get(l.id),miniReview:mini[l.id]}};lessons[l.id]={hsk:course.hsk,hash:hash(context)};contexts[l.id]=context;}}
if(Object.keys(lessons).length!==146)throw Error('Expected all 146 public lessons');
const dictionary={};for(const w of c.words){const word={han:w.han,trad:w.han,pin:w.pin||'',mean:w.mean.slice(0,4000)};dictionary[hash(word)]=true;}
const payload={revision:hash({lessons,dictionary,prompt:read('server/translator-worker.mjs'),provider:read('server/ai-backup.mjs')}),lessons,dictionary};
module.exports={payload,contexts};
if(require.main===module){
fs.writeFileSync(path.join(root,'server/tutor-curriculum.mjs'),'// Generated public curriculum fingerprints. No learner content.\nexport const TUTOR_CURRICULUM='+JSON.stringify(payload)+';\n');console.log('Pinned146 lessons and '+Object.keys(dictionary).length+' dictionary entries');

}
