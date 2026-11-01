
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync('src/modules/reading/chinese-story-catalog.js','utf8'),ctx);
const rows=ctx.window.HSKChineseStoryCatalog,C=require('../src/modules/reading/real-reading-variety-core.js');
assert.equal(rows.length,6);assert.equal(new Set(rows.map(s=>s.id)).size,6);
for(let level=1;level<=6;level++){
 const story=rows.find(s=>s.hsk===level);assert(story);assert.equal(story.genre,'story');assert.equal(story.origin,'builtin-original');assert(!story.source.url);
 assert(story.paragraphMode.length>=3);for(const p of story.paragraphMode)for(const k of ['hanzi','pinyin','vi'])assert(p[k]?.trim());
 assert.equal(story.quiz.length,3);for(const q of story.quiz){assert.equal(q.options.length,3);assert(Number.isInteger(q.answerIndex)&&q.answerIndex>=0&&q.answerIndex<3);assert(q.explanationVi);}
 const scope={hsk:level,genre:'story'};assert.equal(C.nextCached(rows,[],scope).item.id,story.id);
 const history=C.record([],story);assert.equal(C.nextCached(rows,history,scope).kind,'needs-generation');
 assert.equal(C.nextCached(rows,[],{...scope,lessonId:'unrelated'}).kind,'needs-generation');
}
console.log('PASS six original HSK catalogs, valid questions, novelty and lesson isolation');
