const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
let requests=[],mode=200;
const ctx={
 ScriptApp:{getIdentityToken:()=>'mock-google-identity'},
 UrlFetchApp:{fetch:(url,options)=>{
  requests.push({url,options});
  return {getResponseCode:()=>mode,getContentText:()=>JSON.stringify({ok:true,audioBase64:Buffer.from([0,0,1,0]).toString('base64'),mimeType:'audio/L16;codec=pcm;rate=24000'})};
 }},
 Utilities:{base64Decode:s=>[...Buffer.from(s,'base64')]},
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname+'/Code.gs','utf8'),ctx);
const props={getProperty:()=>null};
const result=ctx.hskGenerate_(props,'你好','gemini-2.5-flash-preview-tts');
assert.equal(result.index,0);
assert.equal(result.bytes.length,48);
assert.equal(String.fromCharCode(...result.bytes.slice(0,4)),'RIFF');
assert.equal(requests.length,1);
assert.equal(requests[0].options.headers.Authorization,'Bearer mock-google-identity');
assert.equal(JSON.parse(requests[0].options.payload).text,'你好');
assert.equal(requests[0].url,'https://hsk-vietnamese-translator.trung-hsk668.workers.dev/voice-precache');
mode=429;
assert.throws(()=>ctx.hskGenerate_(props,'谢谢','gemini-2.5-flash-preview-tts'),/cloudflare_tts_429/);
console.log('PASS: no copied keys, authenticated Cloudflare route, WAV conversion and provider error safety.');
