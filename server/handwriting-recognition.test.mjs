import test from 'node:test';
import assert from 'node:assert/strict';
import core from '../src/modules/handwriting/handwriting-core.js';
import learning from '../src/modules/handwriting/handwriting-learning.js';
import fs from 'node:fs';
import fixturesModule from '../tools/handwriting-fixtures.cjs';
const {fixtures}=fixturesModule;
const base=core.prepare(JSON.parse(fs.readFileSync(new URL('../handwriting-data.json',import.meta.url))));
const sample=(label,strokes)=>core.fromBitmap(label,core.rasterize(strokes),'personal');
const rank=(strokes,extra=[])=>core.recognize(strokes,[...base,...extra]);

test('a confirmed near-identical drawing has immediate influence without duplicate confirmations',()=>{
 const strokes=fixtures['你'],saved=sample('你',strokes);
 const before=rank(strokes);
 const after=rank(strokes,[saved]);
 assert.ok(!before.some(c=>c.character==='你'),'fixture exposes baseline failure');
 assert.equal(after[0].character,'你');
 assert.deepEqual(rank(strokes,[saved,saved,saved]),after);
 assert.deepEqual(rank(strokes.map(s=>s.slice().reverse()).reverse(),[saved]),after);
});
test('contradictory labels for the same personal bitmap are ignored',()=>{
 const strokes=fixtures['你'];
 assert.deepEqual(rank(strokes,[sample('你',strokes),sample('他',strokes)]),rank(strokes));
});
test('an unrelated personal shape cannot promote its label',()=>{
 assert.deepEqual(rank(fixtures['口'],[sample('你',fixtures['火'])]),rank(fixtures['口']));
});
test('licensed external pack covers only supported labels with valid bitmaps',()=>{
 const external=JSON.parse(fs.readFileSync(new URL('../handwriting-external.json',import.meta.url)));
 const supported=new Set(base.map(t=>t.character)),seen=new Set();
 assert.equal(external.source.license,'LGPL-2.1');
 for(const row of external.samples){assert.ok(supported.has(row.label));learning.unpack(row.bitmap);const key=row.label+'|'+row.bitmap;assert.ok(!seen.has(key));seen.add(key);}
 assert.ok(external.samples.length>2500);
});
