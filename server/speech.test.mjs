import test from 'node:test';
import assert from 'node:assert/strict';
import speech from '../speech.js';
const zh={lang:'zh-CN',name:'Mandarin',localService:true};
const button=()=>({dataset:{speechLabel:'Nghe phát âm'},classList:{add(){},remove(){}},setAttribute(){}});
function setup(voices=[zh]){const spoken=[],messages=[];let cancellations=0;const player=speech.createPlayer({synth:{getVoices:()=>voices,cancel:()=>{cancellations++;},speak:u=>spoken.push(u)},Utterance:class{constructor(text){this.text=text;}},notify:m=>messages.push(m)});return {player,spoken,messages,cancellations:()=>cancellations};}
test('prefers local Mainland Mandarin and does not use English or Cantonese',()=>{
 assert.equal(speech.chooseVoice([{lang:'en-US'},{lang:'zh-HK',name:'Cantonese'},zh]),zh);
 assert.equal(speech.chooseVoice([{lang:'zh-HK',name:'Cantonese'}]),null);
 const e=setup([{lang:'en-US',name:'English'}]);e.player.play('你好',button());assert.equal(e.spoken.length,0);assert.match(e.messages.at(-1),/giọng tiếng Trung/);
});
test('word pronunciation sets Mandarin and repeated click stops instead of overlapping',()=>{
 const e=setup(),b=button();e.player.play('你好',b);assert.equal(e.spoken[0].text,'你好');assert.equal(e.spoken[0].voice,zh);assert.equal(e.spoken[0].lang,'zh-CN');
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
