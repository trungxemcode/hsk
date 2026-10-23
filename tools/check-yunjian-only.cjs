/* Explicit single voice package, pinned verified model, no eager 90MB PWA payload. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const c=JSON.parse(fs.readFileSync('src/modules/speech/voice-catalog.json','utf8'));
const assets=JSON.parse(fs.readFileSync('tools/pwa-assets.json','utf8'));
const source=fs.readFileSync('src/modules/speech/voice-settings.js','utf8');
const speech=fs.readFileSync('src/modules/speech/speech.js','utf8');
assert.equal(c.voices.length,1,'only the requested Yunjian may be offered for new installation');
assert.equal(c.voices[0].id,'zm_yunjian');
const voice=c.voices[0];assert.notEqual(voice.downloadable,false);
const model=voice.assets.find(a=>a.role==='model'),speaker=voice.assets.find(a=>a.role==='voice');
assert.ok(model&&speaker,'model + one speaker required: speaker alone cannot synthesize');
assert.match(model.url,/onnx-community\/Kokoro-82M-v1\.0-ONNX\/resolve\/[\da-f]+\/onnx\/model_quantized\.onnx$/);
assert.equal(model.bytes,92361116);
assert.equal(model.sha256,'fbae9257e1e05ffc727e951ef9b9c98418e6d79f1c9b6b13bd59f5c9028a1478');
assert.match(speaker.url,/\/voices\/zm_yunjian\.pt$/);
assert.equal(speaker.bytes,523435);
assert.equal(voice.demo.url.endsWith('zm_yunjian.mp3'),true);
const initial=JSON.stringify(assets),demolist=[...initial.matchAll(/content\/voice-demos\/[^"\s]+\.mp3/g)].map(v=>v[0]);
assert.deepEqual(demolist,['content/voice-demos/zm_yunjian.mp3']);
assert.ok(!initial.includes('model_quantized.onnx'),'large neural model must remain on-demand');
for(const a of c.shared.filter(v=>!/^https/.test(v.url))) {
 const p=path.resolve('src/modules/speech',a.url),data=fs.readFileSync(p);
 assert.equal(data.length,a.bytes,a.role);assert.equal(crypto.createHash('sha256').update(data).digest('hex'),a.sha256,a.role);
}
assert.ok(speech.includes("manager?.selection.source==='pack'"),'Chinese reading must route through selected on-device Kokoro');
assert.ok(source.includes('HSKVoiceManager')||source.includes('const manager=root.HSKVoiceManager'));
const n=c.shared.reduce((s,a)=>s+a.bytes,0)+voice.assets.reduce((s,a)=>s+a.bytes,0);
assert.ok(n<100*1048576&&n>90*1048576,'validated Yunjian install is about 94 MiB, not a misleading 0.5 MiB');
console.log('PASS single Kokoro Yunjian model, pinned 8-bit source, SHA-verified shared runtime, only one demo precached, lazy install '+(n/1048576).toFixed(1)+' MiB');
