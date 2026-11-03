import {createRequire} from 'node:module';import test from 'node:test';import assert from 'node:assert/strict';const require=createRequire(import.meta.url),C=require('../src/modules/ai-coach/ai-coach-core.js');
const sample=C.sample({id:'q1',level:4,prompt:'Viết về việc học',format:'writing'},'我昨天去学校了。',null,{skill:'Viết'});
test('native tutor prose is displayed without fabricating scores or error tags',()=>{const r=C.parse('Bạn chọn đúng.\n只喝水 nghĩa là chỉ uống nước. Hãy chú ý từ 只.',[sample]);assert.equal(r.format,'text');assert.equal(r.score,null);assert.deepEqual(r.weaknesses,[]);assert.match(r.summary,/只喝水/);assert.equal(C.answer({images:true,options:['sleep','water']},1),'Người uống nước');assert.throws(()=>C.parse('{"summary":"truncated',[sample]));assert.throws(()=>C.parse('',[sample]));});
test('JSON inside a tutor preface or answer wrapper still follows strict grading checks',()=>{const r={summary:'Giải thích câu.',score:null,weaknesses:[],corrections:[]};assert.equal(C.parse('Nhận xét:\n```json\n'+JSON.stringify(r)+'\n```',[sample]).summary,r.summary);assert.equal(C.parse(JSON.stringify({answer:'Bạn dùng 昨天 đúng.'}),[sample]).format,'text');assert.equal(C.parse(JSON.stringify({summary:'Câu đúng.'}),[sample]).score,null);});
test('coach stores actual answers and isolates writing from objective accuracy',()=>{assert.equal(C.answer({tokens:['我','去','学校']},[0,2,1]),'我学校去');assert.equal(C.answer({options:['a','b']},1),'b');assert.deepEqual(C.stats([sample]),[]);assert.equal(sample.correct,null);});
test('normalized quote alignment accepts CJK punctuation changes',()=>{assert.equal(C.verifyAndExtractOriginalQuote('我昨天, 去学校。','我昨天，去学校。'),'我昨天, 去学校。');assert.equal(C.verifyAndExtractOriginalQuote('我昨天去学校','他昨天去学校'),null);});

test('coach feedback needs bounded scores, supported ids and verbatim learner quotes',()=>{const r={summary:'Cần luyện trật tự câu.',score:7,weaknesses:[{skill:'Ngữ pháp',id:'q1',evidence:'Câu đã viết.',advice:'Viết lại câu.'}],corrections:[{id:'q1',original:'我昨天',corrected:'昨天我',why:'Đây là một cách diễn đạt khác.'}]};assert.equal(C.parse(JSON.stringify(r),[sample]).score,7);assert.throws(()=>C.parse(JSON.stringify({...r,score:11}),[sample]));assert.throws(()=>C.parse(JSON.stringify({...r,corrections:[{...r.corrections[0],original:'他今天'}]}),[sample]));assert.throws(()=>C.parse(JSON.stringify({...r,weaknesses:[{...r.weaknesses[0],id:'invented'}]}),[sample]));assert.equal(C.parse(JSON.stringify({...r,corrections:[]}),[{...sample,writing:false}]).score,null);});
test('listening uses the very same instructions as reading, and keeps its supplied transcript verbatim',()=>{
 const transcript='女：都九点零五分了，儿子还在睡觉？男：他早起床了，正在刷牙洗脸呢。';
 const options=['A','B','C','D','E','F'].map(label=>({label,text:'Phương án '+label,isCorrect:label==='B'}));
 const listening=C.buildWrongAnswerPrompt({skill:'Nghe',transcript,correctAnswer:'B',options});
 const reading=C.buildWrongAnswerPrompt({skill:'Đọc',prompt:'谁在刷牙？',correctAnswer:'B',options});
 assert.equal(listening.lesson.content.transcript,transcript);
 assert.equal(listening.lesson.content.correctAnswer,'B');
 assert.equal(listening.lesson.content.allOptions.length,6);
 assert.equal(listening.initialQuestion,reading.initialQuestion);
 assert.ok(listening.initialQuestion.length<=500);
 assert.match(listening.initialQuestion,/từng phương án/i);
 assert.match(listening.initialQuestion,/không tự nghe lại audio/i);
 const missing=C.buildWrongAnswerPrompt({skill:'Nghe'});
 assert.equal(missing.lesson.content.transcript,'');
});
test('reading and writing wrong-answer explanations cover every supplied A-D option and preserve image loading references',()=>{
 const load=()=>Promise.resolve('data:image/png;base64,test');
 const p=C.buildWrongAnswerPrompt({id:'q4',hsk:5,skill:'Đọc',questionPrompt:'哪一项是正确的？',correctAnswer:'C',userAnswer:'A',options:['A','B','C','D'].map(label=>({label,text:'Câu '+label,isSelected:label==='A',isCorrect:label==='C'})),images:[{label:'Ảnh đáp án C',load}]});
 assert.deepEqual(p.lesson.content.allOptions.map(o=>o.option),['A','B','C','D']);
 assert.equal(p.lesson.content.allOptions[2].status,'Đáp án đúng');
 assert.match(p.initialQuestion,/A, B, C, D/);
 assert.match(p.initialQuestion,/từng phương án/i);
 assert.equal(p.images[0].load,load);
 const writing=C.buildWrongAnswerPrompt({skill:'Viết',options:[],correctAnswer:'我去学校。'});
 assert.equal(writing.lesson.content.allOptions.length,0);
 assert.match(writing.initialQuestion,/mọi phương án thực tế/);
});
