import test from 'node:test';
import assert from 'node:assert/strict';
import {checkRestoration,stageImportReference,prepareBatchReference} from './music/batch-reference.mjs';
import {matchGroq} from './music/groq-alignment.mjs';
test('pinyin restoration preserves lines and rejects invented or missing syllables',()=>{
 const r=checkRestoration(['你好世界'],['nǐ hǎo shìjiè']);assert.equal(r.untimed,true);assert.equal(r.cues[0].pinyin,'nǐ hǎo shìjiè');assert.equal(r.cues[0].start,undefined);
 assert.throws(()=>checkRestoration(['你好世界'],['zài jiàn']));assert.throws(()=>checkRestoration([],['nǐ hǎo']));
});
test('untimed lyrics require observed onsets and never receive guessed original times',()=>{
 const r=matchGroq({untimed:true,cues:[{text:'你好'}]},{words:[{word:'你',start:5,end:6},{word:'好',start:8,end:10}]},12);assert.deepEqual(r.cues[0].characters.map(c=>c.start),[5,8]);
 assert.throws(()=>matchGroq({untimed:true,cues:[{text:'你好'},{text:'世界'}]},{words:[{word:'你',start:5,end:6}]},12),e=>e.status===422);
});
test('import staging is opt-in, private, and leaves ordinary imports unchanged',async()=>{
 const writes=[],calls=[],bucket={async head(){return null;},async put(...args){writes.push(args);return {};}};const env={MUSIC_BUCKET:bucket},enqueue=async(...args)=>{calls.push(args);return {queued:true};};
 assert.equal(await stageImportReference(env,{},'id',enqueue),null);assert.equal(writes.length,0);
 const job={batchId:'batch',referenceKind:'hanzi',referenceLines:['你好'],duration:10,title:'test',url:'https://www.youtube.com/watch?v=aaaaaaaaaaa'};
 assert.equal((await stageImportReference(env,job,'id',enqueue)).queued,true);assert.equal(writes[0][0],'lyrics-sources/id.json');assert.equal(JSON.parse(writes[0][1]).lines[0],'你好');assert.equal(writes[0][2].onlyIf.etagDoesNotMatch,'*');assert.equal(calls.length,1);
 assert.equal((await stageImportReference(env,{...job,referenceKind:'missing'},'other',enqueue)).queued,false);
});
test('restoration uses configured Groq keys and retains 429 without rotating keys',async()=>{
 let calls=0;await assert.rejects(prepareBatchReference({kind:'pinyin',lines:['nǐ hǎo']},{words:[]},['one','two'],async()=>{calls++;return Response.json({}, {status:429,headers:{'Retry-After':'120'}});}),e=>e.status===429&&e.retryAfter==='120');assert.equal(calls,1);
});
test('audio-only drafts use observed ASR segments and do not invent absent lyrics',async()=>{
 const r=await prepareBatchReference({kind:'asr'},{segments:[{text:'你好',start:1,end:3}]},[],()=>{throw Error('unexpected LLM call');});assert.equal(r.generatedFromAudio,true);assert.equal(r.cues[0].text,'你好');assert.equal(r.cues[0].start,undefined);
 await assert.rejects(prepareBatchReference({kind:'asr'},{segments:[]},[],()=>{}),e=>e.status===422);
});
test('strict per-line fields preserve repeated lyrics instead of merging duplicate verses',async()=>{
 const r=await prepareBatchReference({kind:'pinyin',lines:['nǐ hǎo','nǐ hǎo']},{words:[]},['key'],async(_url,init)=>{const b=JSON.parse(init.body);assert.equal(b.response_format.json_schema.strict,true);assert.deepEqual(b.response_format.json_schema.schema.required,['line0','line1']);return Response.json({choices:[{message:{content:JSON.stringify({line0:'你好',line1:'你好'})}}]});});assert.equal(r.cues.length,2);
});
test('line ends may be clipped at a real onset without changing either line onset',()=>{const r=matchGroq({untimed:true,cues:[{text:'你'},{text:'好'}]},{words:[{word:'你',start:1,end:3},{word:'好',start:2,end:4}]},5);assert.deepEqual(r.cues.map(c=>c.start),[1,2]);assert.equal(r.cues[0].end,2);});
test('missing word times can use a matching observed segment, with no character interpolation',()=>{
 const r=matchGroq({untimed:true,cues:[{text:'世界和平'}]},{words:[{word:'你',start:1,end:2}],segments:[{text:'世界和平',start:4,end:7}]},10);assert.equal(r.cues[0].start,4);assert.equal(r.cues[0].end,7);assert.equal(r.cues[0].characters,undefined);assert.equal(r.diagnostics.segmentAnchoredCharacters,4);
 assert.throws(()=>matchGroq({untimed:true,cues:[{text:'世界和平'}]},{words:[{word:'你',start:1,end:2}],segments:[{text:'完全不同',start:4,end:7}]},10),e=>e.status===422);
});
test('a segment cannot be reused for two repeated lines or assigned outside its observed gap',()=>{
 assert.throws(()=>matchGroq({untimed:true,cues:[{text:'世界和平'},{text:'世界和平'}]},{words:[{word:'你',start:1,end:2}],segments:[{text:'世界和平',start:4,end:7}]},10),e=>e.status===422);
});

test('oversized 429 does not freeze other songs or rotate keys',async()=>{let calls=0;await assert.rejects(prepareBatchReference({kind:'pinyin',lines:['nǐ hǎo']},{words:[]},['one','two'],async(_url,init)=>{calls++;assert.equal(JSON.parse(init.body).max_completion_tokens,2000);return Response.json({error:{message:'Request too large for model: token limit exceeded'}},{status:429});}),e=>e.status===413);assert.equal(calls,1);});
test('one reference repair corrects only failed pinyin lines and preserves the others',async()=>{
 let calls=0;const candidates=[];const out=await prepareBatchReference({kind:'pinyin',lines:['nǐ hǎo','shì jiè']},{words:[]},['key'],async(_url,init)=>{calls++;const b=JSON.parse(init.body);if(calls===1)return Response.json({choices:[{message:{content:JSON.stringify({line0:'再见',line1:'世界'})}}]});assert.deepEqual(b.response_format.json_schema.schema.required,['line0']);assert.equal(JSON.parse(b.messages[1].content).asr,undefined);return Response.json({choices:[{message:{content:JSON.stringify({line0:'你好'})}}]});},undefined,c=>candidates.push(c));assert.equal(calls,2);assert.deepEqual(out.cues.map(c=>c.text),['你好','世界']);assert.equal(candidates.at(-1).referenceRepairAttempted,true);
});
test('cached bad candidate resumes only its short repair after a quota wait',async()=>{
 const cached={model:'qwen/qwen3.8-27b',lines:['再见','世界'],referenceRepairAttempted:false};let calls=0;const fetchFn=async(_url,init)=>{calls++;assert.deepEqual(JSON.parse(init.body).response_format.json_schema.schema.required,['line0']);if(calls===1)return Response.json({}, {status:429,headers:{'Retry-After':'60'}});return Response.json({choices:[{message:{content:JSON.stringify({line0:'你好'})}}]});};const args=[{kind:'pinyin',lines:['nǐ hǎo','shì jiè']},{words:[]},['key'],fetchFn,undefined,async()=>{},cached];await assert.rejects(prepareBatchReference(...args),e=>e.status===429);const out=await prepareBatchReference(...args);assert.equal(out.cues[0].text,'你好');assert.equal(calls,2);
});
test('umlaut pinyin is distinguished correctly and literal English lyrics stay literal',()=>{
 const out=checkRestoration(['绿灯','铃铃铃'],['lǜ dēng','Ring Ring Ring']);assert.equal(out.cues[0].text,'绿灯');assert.equal(out.cues[1].text,'Ring Ring Ring');assert.throws(()=>checkRestoration(['路灯'],['lǜ dēng']));
});

test('long references resume after quota without regenerating completed line batches',async()=>{
 const source={kind:'pinyin',lines:Array(25).fill('ni hao')};let saved=null,calls=0;const fetchFn=async(_url,init)=>{const ids=JSON.parse(init.body).response_format.json_schema.schema.required;assert.ok(ids.length<=12);calls++;if(calls===2)return Response.json({}, {status:429,headers:{'Retry-After':'60'}});if(calls===3)assert.equal(ids[0],'line12');return Response.json({choices:[{message:{content:JSON.stringify(Object.fromEntries(ids.map(id=>[id,'\u4f60\u597d'])))}}]});};const save=c=>{saved=JSON.parse(JSON.stringify(c));};await assert.rejects(prepareBatchReference(source,{words:[]},['key'],fetchFn,undefined,save),e=>e.status===429);assert.equal(saved.lines.filter(x=>typeof x==='string').length,12);const out=await prepareBatchReference(source,{words:[]},['key'],fetchFn,undefined,save,saved);assert.equal(out.cues.length,25);assert.equal(calls,4);
});

test('description credits before a Lyrics marker are not sung verses',async()=>{const out=await prepareBatchReference({kind:'pinyin',lines:['J.Wu','Composer: Example','Lyrics:','ni hao']},{words:[]},['key'],async(_url,init)=>{assert.deepEqual(JSON.parse(init.body).response_format.json_schema.schema.required,['line0']);return Response.json({choices:[{message:{content:JSON.stringify({line0:'\u4f60\u597d'})}}]});});assert.equal(out.cues.length,1);});
test('English refrain and vocalization spelling preserve actual sung content',()=>{const out=checkRestoration(['I let u go','Plz never show','It’s 21℃','\u545c\u66ae\u4e91\u8fb9'],['I let u go','Plz never show','It’s 21℃','wooh mu yun bian']);assert.equal(out.cues.length,4);assert.equal(out.cues[0].text,'I let u go');});
