import test from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {qaDescriptor,qaHash,qaSensitive,qaNormalize} from './tutor-cache.mjs';
const require=createRequire(import.meta.url),B=require('../src/modules/exams/exam-bank.js');require('../src/modules/exams/exam-expansion.js')(B);const C=require('../src/modules/ai-coach/ai-coach-core.js');
test('registered explanation is shared across accounts; edited question and history remain private',async()=>{
 const q=B.items.find(q=>q.type==='sourceReading'),t=B.types.find(t=>t.id===q.type),value=0;
 const p=C.buildWrongAnswerPrompt({id:q.id,hsk:q.level,title:`HSK ${q.level} · ${t.skill} · ${t.name}`,skill:t.skill,prompt:q.prompt,context:'',transcript:'',userAnswer:q.options[value],correctAnswer:q.options[q.answer],options:q.options.map((text,i)=>({value:String.fromCharCode(65+i),text,isCorrect:i===q.answer,isSelected:i===value})),explanation:q.explanation});
 const body={lesson:p.lesson,question:p.initialQuestion,hsk:p.hsk,history:[]},env={QA_CACHE_ENABLED:'true',AI_CONTROL:{}};
 const a=await qaDescriptor('/lesson-ask',body,'a',env),b=await qaDescriptor('/lesson-ask',body,'b',env);assert.equal(a.shared,true);assert.equal(a.key,b.key);
 const changed=structuredClone(body);changed.lesson.content.userWrongAnswer='Nội dung riêng';const d=await qaDescriptor('/lesson-ask',changed,'b',env);assert.equal(d,null);
 assert.equal(await qaDescriptor('/lesson-ask',{...body,history:[{role:'user',text:'Hỏi thêm'}]},'b',env),null);
});
