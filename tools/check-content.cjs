const fs=require('node:fs'), vm=require('node:vm'), assert=require('node:assert/strict'), cp=require('node:child_process'), zlib=require('node:zlib'), crypto=require('node:crypto');
const ctx={};vm.createContext(ctx);
for(const name of ['words','dictionarySupplement','checkedPracticeExamples'])vm.runInContext(fs.readFileSync('content/data/'+name+'.js','utf8')+';globalThis.'+name+'Data='+name,ctx);
const words=ctx.wordsData,supp=ctx.dictionarySupplementData,examples=ctx.checkedPracticeExamplesData;
const old={};vm.createContext(old);vm.runInContext(cp.execFileSync('git',['show','dfdd13080d47e4e944c47950f7ed2659964cd44b:words.js'],{encoding:'utf8'})+';globalThis.data=words',old);
const base={};vm.createContext(base);vm.runInContext(cp.execFileSync('git',['show','f05b6bdb21dcb84a8035c937408c095547224cb5:content/data/words.js'],{encoding:'utf8'})+';globalThis.data=words',base);
for(let i=0;i<old.data.length;i++)assert.equal(JSON.stringify(words[i]),JSON.stringify(old.data[i]),'Original learning word changed: '+old.data[i].han);
const key=w=>`${w.hsk}|${w.han}|${w.pin}`;
assert.equal(new Set(words.map(key)).size,words.length,'Duplicate learning keys');
const currentKeys=new Set(words.map(key)),baseByKey=new Map(base.data.map(w=>[key(w),w]));
assert.equal(base.data.length,5011,'Unexpected main baseline word count');
assert.equal(base.data.filter(w=>!currentKeys.has(key(w))).length,0,'A word from main was removed');
const added=words.slice(old.data.length),carried=added.filter(w=>baseByKey.has(key(w))),fresh=added.filter(w=>!baseByKey.has(key(w)));
assert.equal(added.length,709,'Expected the 83 existing supplements plus 626 new course words');
assert.equal(carried.length,83,'Existing main supplements should remain present');
assert.equal(fresh.length,626,'Expected 626 genuinely new course vocabulary entries');
for(const w of carried){const prior=baseByKey.get(key(w));const strip=x=>{const {vocabularyProvenance,...rest}=x;return rest;};assert.equal(JSON.stringify(strip(w)),JSON.stringify(strip(prior)),'Existing supplement content changed beyond provenance: '+w.han);}
assert.equal(added.filter(w=>w.vocabularyProvenance?.kind==='clean-room-authored').length,709,'All carried/new supplemental entries must use clean-room provenance');
assert.equal(fresh.filter(w=>w.courseSupplement).length,626);
let addedExamples=0;
for(const w of added){const x=examples.entries[key(w)];assert.ok(x,'Missing checked examples for '+w.han);assert.equal(x.examples.length,3);addedExamples+=x.examples.length;for(const e of x.examples)for(const k of ['cn','pin','vi'])assert.ok(e[k]);assert.equal(x.checkedAgainst,null,'Clean-room examples must not retain external-source checks');}
assert.equal(addedExamples,2127);
for(const name of ['words','dictionarySupplement','checkedPracticeExamples'])assert.deepEqual(zlib.gunzipSync(fs.readFileSync('content/data/'+name+'.js.gz')),fs.readFileSync('content/data/'+name+'.js'));
const catalog=JSON.parse(fs.readFileSync('lessons-data.json'));const aliases=new Map([['贏','赢'],['內容','内容'],['勺（子）','勺子']]);const hans=new Set(words.map(w=>w.han));
for(const course of catalog.courses.filter(c=>c.hsk<=2))for(const l of course.lessons)for(const han of l.words)assert.ok(hans.has(aliases.get(han)||han),'Missing entry '+han);
let long=0,dialogues=0,questions=0,grammar=0;
for(let hsk=1;hsk<=6;hsk++){
 const data=JSON.parse(fs.readFileSync(`lesson-content-hsk${hsk}.json`)),ids=catalog.courses.find(c=>c.hsk===hsk).lessons.map(l=>l.id);
 assert.deepEqual(data.lessons.map(l=>l.id),ids);let expanded=0;
 for(const l of data.lessons){assert.equal(new Set(l.practice.map(q=>q.id)).size,l.practice.length);for(const q of l.practice)assert.ok(q.answer>=0&&q.answer<q.options.length);
  if(l.reading.kind!=='long-form-original')continue;expanded++;long++;
  assert.ok(l.warmupReading?.lines.length || hsk>=3);assert.equal(l.reading.characterCount,l.reading.lines.reduce((s,x)=>s+(x.cn.match(/[\u3400-\u9fff]/g)||[]).length,0));
  assert.ok(l.reading.characterCount>=[120,180,200,280,320,400][hsk-1]);
  assert.ok(l.reading.lines.length>=3);
  for(const line of l.reading.lines)for(const k of ['cn','pin','vi'])assert.ok(line[k]);
  assert.ok(l.reading.lessonApplication);assert.ok(l.reading.lessonApplication.grammarApplied.length>=l.grammar.length);assert.equal(l.reading.lessonApplication.grammarMissing.length,0);grammar+=l.grammar.length;
  const ds=l.dialogues.filter(d=>d.kind==='long-form-original');if(ds.length){assert.equal(ds.length,1);assert.equal(ds[0].lines.length,8);dialogues++;}
  const qs=l.practice.filter(q=>q.source==='reading');if(qs.length){assert.equal(qs.length,3);questions+=qs.length;assert.equal(l.practice.length,6);}
 }
 assert.equal(expanded,ids.length);
}
assert.equal(long,146);assert.equal(dialogues,24);assert.equal(questions,72);assert.ok(grammar>146);
const manifest=JSON.parse(fs.readFileSync('app-version.json'));for(const [name,asset] of Object.entries(manifest.assets)){const buf=fs.readFileSync(name);assert.equal(buf.length,asset.bytes);assert.equal(crypto.createHash('sha256').update(buf).digest('hex'),asset.sha256);}
console.log(`PASS: ${words.length} words; 626 new course words/1,878 examples; 83 existing supplements retained with clean-room provenance; HSK1–2 gaps closed; ${long} readings with ${grammar} grammar examples; ${dialogues} extended dialogues/72 questions; compressed/offline assets verified.`);
