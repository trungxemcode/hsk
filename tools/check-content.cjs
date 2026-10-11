const fs=require('node:fs'), vm=require('node:vm'), assert=require('node:assert/strict'), cp=require('node:child_process'), zlib=require('node:zlib'), crypto=require('node:crypto');
const ctx={};vm.createContext(ctx);
for(const name of ['words','dictionarySupplement','checkedPracticeExamples'])vm.runInContext(fs.readFileSync(name+'.js','utf8')+';globalThis.'+name+'Data='+name,ctx);
const words=ctx.wordsData,supp=ctx.dictionarySupplementData,examples=ctx.checkedPracticeExamplesData;
const old={};vm.createContext(old);vm.runInContext(cp.execFileSync('git',['show','dfdd13080d47e4e944c47950f7ed2659964cd44b:words.js'],{encoding:'utf8'})+';globalThis.data=words',old);
for(let i=0;i<old.data.length;i++)assert.equal(JSON.stringify(words[i]),JSON.stringify(old.data[i]),'Existing word changed: '+old.data[i].han);
const key=w=>`${w.hsk}|${w.han}|${w.pin}`;
assert.equal(new Set(words.map(key)).size,words.length,'Duplicate learning keys');
const added=words.slice(old.data.length);assert.equal(added.length,83);
assert.equal(added.filter(w=>w.vocabularyProvenance.kind==='hanzii-lexical-check').length,76);
for(const w of added){const x=examples.entries[key(w)];assert.equal(x.examples.length,3);for(const e of x.examples)for(const k of ['cn','pin','vi'])assert.ok(e[k]);if(w.entryKind==='vocabulary')assert.equal(x.checkedAgainst,w.vocabularyProvenance.url);else assert.equal(x.checkedAgainst,null);}
for(const name of ['words','dictionarySupplement','checkedPracticeExamples'])assert.deepEqual(zlib.gunzipSync(fs.readFileSync(name+'.js.gz')),fs.readFileSync(name+'.js'));
const catalog=JSON.parse(fs.readFileSync('lessons-data.json'));const aliases=new Map([['贏','赢'],['內容','内容'],['勺（子）','勺子']]);const hans=new Set(words.map(w=>w.han));
for(const course of catalog.courses.filter(c=>c.hsk<=2))for(const l of course.lessons)for(const han of l.words)assert.ok(hans.has(aliases.get(han)||han),'Missing entry '+han);
let long=0,dialogues=0,questions=0;
for(let hsk=1;hsk<=6;hsk++){
 const data=JSON.parse(fs.readFileSync(`lesson-content-hsk${hsk}.json`)),ids=catalog.courses.find(c=>c.hsk===hsk).lessons.map(l=>l.id);
 assert.deepEqual(data.lessons.map(l=>l.id),ids);let expanded=0;
 for(const l of data.lessons){assert.equal(new Set(l.practice.map(q=>q.id)).size,l.practice.length);for(const q of l.practice)assert.ok(q.answer>=0&&q.answer<q.options.length);
  if(l.reading.kind!=='long-form-original')continue;expanded++;long++;
  assert.ok(l.warmupReading.lines.length);assert.equal(l.reading.characterCount,l.reading.lines.reduce((s,x)=>s+(x.cn.match(/[\u3400-\u9fff]/g)||[]).length,0));
  assert.ok(l.reading.characterCount>=[120,240,300,380,500,700][hsk-1]);
  const ds=l.dialogues.filter(d=>d.kind==='long-form-original');assert.equal(ds.length,1);assert.equal(ds[0].lines.length,8);dialogues++;
  for(const line of [...l.reading.lines,...ds[0].lines])for(const k of ['cn','pin','vi'])assert.ok(line[k]);
  const qs=l.practice.filter(q=>q.source==='reading');assert.equal(qs.length,3);questions+=qs.length;assert.equal(l.practice.length,6);
 }
 assert.equal(expanded,4);
}
assert.equal(long,24);assert.equal(dialogues,24);assert.equal(questions,72);
const manifest=JSON.parse(fs.readFileSync('app-version.json'));for(const [name,asset] of Object.entries(manifest.assets)){const buf=fs.readFileSync(name);assert.equal(buf.length,asset.bytes);assert.equal(crypto.createHash('sha256').update(buf).digest('hex'),asset.sha256);}
console.log(`PASS: ${words.length} words; 83 new entries/249 examples; HSK1–2 gaps closed; 24 readings/24 dialogues/72 questions; existing learning keys and compressed/offline assets preserved.`);
