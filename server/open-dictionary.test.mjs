import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),C=require('../open-dictionary-core.js'),A=require('../account-core.js');
test('general search ranks exact, containing and near results without an HSK bonus',()=>{
 const exact=['直播','直播','zhi2 bo1',['live broadcast']],partial=['直播间','直播間','zhi2 bo1 jian1',['livestream room']],contains=['网络直播','網絡直播','wang3 luo4 zhi2 bo1',['webcast']];
 assert.ok(C.score(exact,'直播')>C.score(partial,'直播'));assert.ok(C.score(partial,'直播')>=C.score(contains,'直播'));assert.ok(C.score(partial,'直播間')>0);assert.ok(C.score(['学习','學習','xue2 xi2',['study']],'学刁')>0);
 assert.ok(C.score(['大学','大學','da4 xue2',['university']],'universitty')>0);assert.ok(C.score(partial,'zhi bo')>0);assert.equal(C.score(exact,'completely unrelated'),0);assert.equal(C.score(exact,''),0);
 assert.equal(C.matches(['看','看','kan4',['see also 直播']],'直播'),false);assert.equal(C.near('abcd','abXYZd'),false);
 assert.equal(C.vietnamese('chú thuật'),true);assert.equal(C.vietnamese('xinh đẹp'),true);assert.equal(C.vietnamese('zhǔ shù'),false);assert.equal(C.vietnamese('university'),false);
});
test('extended SRS requires opt-in and syncs separately from HSK with deletion revisions',()=>{
 const w={han:'直播间',trad:'直播間',pin:'zhi2 bo1 jian1',mean:'livestream room'},initial={};
 assert.deepEqual(initial,{});const added=C.add(initial,w,1000),id=C.id(w);assert.equal(initial[id],undefined);assert.equal(added[id].due,1000);assert.strictEqual(C.add(added,w),added);
 const rated=C.rate(added[id],'good',2000);assert.equal(rated.due,2000+86400000);assert.equal(C.rate(rated,'again',3000).due,603000);
 const data={[C.KEY]:JSON.stringify({version:1,items:{[id]:rated}})},captured=A.capture({}, {},data,10,'device-a');
 assert.deepEqual(Object.keys(captured.items),['open-word:'+id]);const material=A.materialize(captured.items);assert.deepEqual(JSON.parse(material[C.KEY]).items[id],rated);assert.deepEqual(JSON.parse(material[A.KEYS[0]]).words,{});
 const removed=A.capture(captured.items,data,{[C.KEY]:JSON.stringify({version:1,items:{}})},20,'device-b');assert.equal(removed.items['open-word:'+id].deleted,true);assert.deepEqual(JSON.parse(A.materialize(A.merge(captured.items,removed.items))[C.KEY]).items,{});
 assert.deepEqual(C.clean({items:{wrong:added[id],bad:{}}}),{});assert.equal(C.fold('lǜ'),'lv');assert.equal(C.fold('lu:4'),'lv');
});
test('official dictionary shards preserve original readings, meanings and traditional lookup',()=>{
 const root=new URL('../content/open-dictionary/',import.meta.url),manifest=JSON.parse(fs.readFileSync(new URL('manifest.json',root)));const seen=new Map();
 assert.equal(manifest.license,'CC BY-SA 4.0');assert.ok(manifest.entries>120000);
 for(const [name,meta] of Object.entries(manifest.files)){const bytes=fs.readFileSync(new URL(name,root));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),meta.sha256);for(const row of JSON.parse(zlib.gunzipSync(bytes))){assert.ok(row[3].length);assert.ok([row[0].codePointAt(0)%32,row[1].codePointAt(0)%32].includes(Number(name.slice(0,2))));seen.set(row.slice(0,3).join('|'),row);}}
 assert.equal(seen.size,manifest.entries);assert.ok([...seen.values()].some(r=>r[0]==='直播'));assert.ok([...seen.values()].some(r=>C.matches(r,'直播間')));
});
