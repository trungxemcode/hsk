import test from 'node:test';
import assert from 'node:assert/strict';
import speech from '../src/modules/speech/speech.js';
const zh={lang:'zh-CN',name:'Mandarin',localService:true};
test('Vietnamese prefers a natural voice, honors saved choices and isolates Mandarin',()=>{
 const basic={lang:'vi-VN',name:'Vietnamese',localService:true,voiceURI:'basic'},natural={lang:'vi-VN',name:'Vietnamese Natural',localService:false,voiceURI:'natural'},online={lang:'vi-VN',name:'Vietnamese online',localService:false,voiceURI:'online'},voices=[basic,online,natural,zh];
 assert.equal(speech.chooseVoice(voices,'vi-VN'),natural);assert.equal(speech.chooseVoice(voices,'vi-VN','basic'),basic);assert.equal(speech.chooseVoice(voices,'vi-VN','missing'),natural);assert.equal(speech.chooseVoice(voices,'zh-CN','basic'),zh);
 let selected='basic';const spoken=[],player=speech.createPlayer({synth:{getVoices:()=>voices,cancel(){},speak:u=>spoken.push(u)},Utterance:class{},voiceURI:()=>selected});player.play('bạn',undefined,'vi-VN');assert.equal(spoken.at(-1).voice,basic);selected='natural';player.play('xin chào',undefined,'vi-VN');assert.equal(spoken.at(-1).voice,natural);player.play('你');assert.equal(spoken.at(-1).voice,zh);
});
const button=()=>({dataset:{speechLabel:'Nghe phát âm'},classList:{add(){},remove(){}},setAttribute(){}});
function setup(voices=[zh]){const spoken=[],messages=[];let cancellations=0;const player=speech.createPlayer({synth:{getVoices:()=>voices,cancel:()=>{cancellations++;},speak:u=>spoken.push(u)},Utterance:class{constructor(text){this.text=text;}},notify:m=>messages.push(m)});return {player,spoken,messages,cancellations:()=>cancellations};}
test('prefers local Mainland Mandarin and does not use English or Cantonese',()=>{
 assert.equal(speech.chooseVoice([{lang:'en-US'},{lang:'zh-HK',name:'Cantonese'},zh]),zh);
 assert.equal(speech.chooseVoice([{lang:'zh-HK',name:'Cantonese'}]),null);
 const e=setup([{lang:'en-US',name:'English'}]);e.player.play('你好',button());assert.equal(e.spoken.length,0);assert.match(e.messages.at(-1),/giọng tiếng Trung/);
});
test('word pronunciation sets Mandarin and repeated click stops instead of overlapping',()=>{
 const e=setup(),b=button();e.player.play('你好',b);assert.equal(e.spoken[0].text,'你好');assert.equal(e.spoken[0].voice,zh);assert.equal(e.spoken[0].lang,'zh-CN');assert.equal(e.spoken[0].rate,.85);
 e.player.play('你好',b);assert.equal(e.spoken.length,1);e.spoken[0].onend();assert.equal(e.spoken.length,1);
});
test('reads passage chunks in order and prevents stale callbacks replaying after a new request',()=>{
 const e=setup();e.player.play(['你好。再见！','明天见。'],button());assert.equal(e.spoken[0].text,'你好。');e.spoken[0].onend();assert.equal(e.spoken[1].text,'再见！');
 const old=e.spoken[1];e.player.play('谢谢',button());old.onend();assert.deepEqual(e.spoken.map(u=>u.text),['你好。','再见！','谢谢']);
});
test('long passages are split without dropping text and errors reset playback',()=>{
 const text='学'.repeat(351)+'。';assert.equal(speech.chunks(text).join(''),text);assert.ok(speech.chunks(text).every(x=>Array.from(x).length<=100));
 const e=setup();e.player.play('你好',button());e.spoken[0].onerror({error:'network'});assert.match(e.messages.at(-1),/kết nối/);assert.ok(e.cancellations()>0);
});
test('guided playback can select a slower live rate without changing the shared default',()=>{
 const spoken=[];let rate=.6;const player=speech.createPlayer({synth:{getVoices:()=>[zh],cancel(){},speak:u=>spoken.push(u)},Utterance:class{constructor(text){this.text=text;}},rate:()=>rate});
 player.play('你好');assert.equal(spoken[0].rate,.6);rate=.7;player.play('再见');assert.equal(spoken[1].rate,.7);
});
test('Vietnamese meanings use a Vietnamese voice and never fall back to Mandarin',()=>{
 const vi={lang:'vi-VN',name:'Vietnamese',localService:true},e=setup([zh,vi]),text='Bạn là người tôi thường gặp ở trường. '.repeat(4);
 e.player.play(text,undefined,'vi-VN');assert.equal(e.spoken[0].voice,vi);assert.equal(e.spoken[0].lang,'vi-VN');assert.equal(e.spoken[0].text,text.trim());
 e.player.stop();e.player.play('你好');assert.equal(e.spoken.at(-1).voice,zh);
 const missing=setup([zh]);missing.player.play('bạn',undefined,'vi-VN');assert.equal(missing.spoken.length,0);assert.match(missing.messages.at(-1),/giọng tiếng Việt/);
});
test('repeated word audio has a gap, ignores duplicate endings and cancels pending repeats',async()=>{
 const spoken=[],messages=[],player=speech.createPlayer({synth:{getVoices:()=>[zh],cancel(){},speak:u=>spoken.push(u)},Utterance:class{constructor(text){this.text=text;}},gapMs:25,notify:m=>messages.push(m)});
 player.play(['你','你','你']);spoken[0].onend();spoken[0].onend();assert.equal(spoken.length,1);await new Promise(r=>setTimeout(r,40));assert.equal(spoken.length,2);
 spoken[1].onend();await new Promise(r=>setTimeout(r,40));assert.equal(spoken.length,3);spoken[2].onend();assert.equal(messages.at(-1),'Đã nghe xong.');
 player.play(['我','我','我']);spoken.at(-1).onend();player.stop();const count=spoken.length;await new Promise(r=>setTimeout(r,40));assert.equal(spoken.length,count);
});
test('saved Mandarin voice is honored across locales without affecting Vietnamese',()=>{
 const tw={lang:'zh-TW',name:'Taiwan Mandarin',voiceURI:'tw',localService:true},cn={...zh,voiceURI:'cn'},hk={lang:'zh-HK',name:'Cantonese',voiceURI:'hk'};
 assert.equal(speech.chooseVoice([cn,tw,hk],'zh-CN','tw'),tw);assert.equal(speech.chooseVoice([cn,tw,hk],'zh-CN','hk'),cn);
});
test('downloaded Chinese voice uses central choice, preserves chunk order, and cancels stale playback',async()=>{
 const calls=[],messages=[];globalThis.HSKVoiceManager={selection:{source:'pack'},unlock(){},stop(){},speak(text,rate,signal){return new Promise((resolve,reject)=>{calls.push({text,rate,resolve});signal.addEventListener('abort',()=>reject(Object.assign(Error('cancel'),{name:'AbortError'})),{once:true});});}};
 try{const player=speech.createPlayer({notify:m=>messages.push(m),rate:.7});player.play(['你好。','再见。']);assert.equal(calls[0].text,'你好。');assert.equal(calls[0].rate,.7);calls[0].resolve();await new Promise(r=>setImmediate(r));assert.equal(calls[1].text,'再见。');player.stop();calls[1].resolve();await new Promise(r=>setImmediate(r));assert.ok(!messages.includes('Đã nghe xong.'));
 }finally{delete globalThis.HSKVoiceManager;}
});
test('resumes paused speechSynthesis and waits for async voiceschanged before speaking Mandarin',()=>{
 const spoken=[];let resumed=0,readyVoices=[],handler=null;
 const synth={paused:true,resume(){resumed++;this.paused=false;},cancel(){},getVoices:()=>readyVoices,addEventListener(type,fn){if(type==='voiceschanged')handler=fn;},removeEventListener(type,fn){if(type==='voiceschanged'&&handler===fn)handler=null;},speak(u){spoken.push(u);}};
 const player=speech.createPlayer({synth,Utterance:class{constructor(t){this.text=t;}}});
 player.play('北方');
 assert.equal(spoken.length,0,'waits when initial voice list is empty');
 assert.ok(handler,'registers voiceschanged listener');
 readyVoices=[zh];handler();
 assert.equal(resumed,1,'resumes paused synth before speaking');
 assert.equal(spoken.length,1);assert.equal(spoken[0].text,'北方');assert.equal(spoken[0].voice,zh);
});
test('offline Vietnamese pack plays meanings when installed even without system vi-VN voices',async()=>{
 const calls=[],messages=[];
 globalThis.HSKViVoiceManager={selection:{source:'pack'},unlock(){},stop(){},speak(text,rate,signal){return new Promise(resolve=>{calls.push({text,rate});resolve(true);});}};
 try{
  const player=speech.createPlayer({synth:{getVoices:()=>[zh],cancel(){},speak(){throw Error('must not use Mandarin');}},Utterance:class{},notify:m=>messages.push(m),rate:1});
  player.play('Xin chào.',undefined,'vi-VN');
  await new Promise(r=>setImmediate(r));
  assert.equal(calls.length,1);assert.equal(calls[0].text,'Xin chào.');
  assert.equal(messages.at(-1),'Đã nghe xong.');
 }finally{delete globalThis.HSKViVoiceManager;}
});
test('Kokoro worker normalizes short words, clamps slow speed, stretches smoothly with WSOLA and trims leading vocoder murmur',async()=>{
 const fs=await import('node:fs'),vm=await import('node:vm');
 const src=fs.readFileSync(new URL('../src/modules/speech/voice-pack-worker.js',import.meta.url),'utf8');
 const ctx={self:{},importScripts(){},Float32Array,Math,Number,String,Promise,URL,Object,TextDecoder,TextEncoder,Uint8Array,DataView,DecompressionStream:class{},Response:class{}};
 vm.runInNewContext(src+'\nglobalThis.__exp={normalizeTtsText,effectiveSpeed,targetAcousticSpeed,timeStretchWSOLA,cleanAudioEdges};',ctx);
 const {normalizeTtsText,effectiveSpeed,targetAcousticSpeed,timeStretchWSOLA,cleanAudioEdges}=ctx.__exp;
 assert.equal(normalizeTtsText('打算',true),'打算。','appends period to bare Han words for clean Kokoro prosody');
 assert.equal(normalizeTtsText('你好。',true),'你好。','does not double-punctuate');
 assert.equal(normalizeTtsText('miền Bắc; phương bắc / phía bắc',false,true),'miền Bắc, phương bắc, phía bắc.','normalizes Vietnamese dictionary punctuation for natural Piper phrasing');
 assert.equal(effectiveSpeed(.6,true),.88,'synthesizes Kokoro cleanly at >= 0.88x');
 assert.equal(targetAcousticSpeed(.6),.7,'maps Chậm learner rate to genuinely slow 0.70x acoustic speed');
 assert.equal(effectiveSpeed(.6,false),.6,'preserves raw speed for non-Kokoro engines');
 // WSOLA stretches a 150Hz male vocal sine cleanly by ~1.25x without NaN or clipping.
 const sr=24000,tone=new Float32Array(Math.round(sr*.5));
 for(let i=0;i<tone.length;i++)tone[i]=.6*Math.sin(2*Math.PI*150*i/sr);
 const stretched=timeStretchWSOLA(tone,sr,.7/.88);
 assert.ok(stretched.length>tone.length*1.18&&stretched.length<tone.length*1.32,`expected ~1.26x stretch, got ${(stretched.length/tone.length).toFixed(2)}x`);
 assert.ok(stretched.every(v=>Number.isFinite(v)&&Math.abs(v)<=1.05),'WSOLA output stays bounded and finite');
 // Synthetic 24kHz buffer: 40ms silence + 60ms low "ừm" murmur (0.08 amp) + 30ms dip + 250ms main speech (0.7 amp)
 const buf=new Float32Array(Math.round(sr*.45));
 for(let i=Math.round(sr*.04);i<Math.round(sr*.10);i++)buf[i]=.08*Math.sin(2*Math.PI*130*i/sr);
 for(let i=Math.round(sr*.13);i<Math.round(sr*.38);i++)buf[i]=.7*Math.sin(2*Math.PI*220*i/sr);
 const cleaned=cleanAudioEdges(buf,sr);
 assert.ok(cleaned.length<buf.length-Math.round(sr*.09),'strips leading silence and disconnected murmur blip');
 assert.equal(cleaned[0],0,'applies click-free fade-in at sample 0');
});
