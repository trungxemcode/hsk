import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),C=require('../src/modules/practice/practice-generator-core.js');
test('generated exercises reject ambiguous choices and invalid reorder characters',()=>{
 const q={type:'multiple_choice',prompt:'选择正确答案',options:['甲','乙','丙','丁'],correctAnswer:2,explanation:'Bằng chứng cho đáp án đúng.'};
 assert.equal(C.validateGeneratedExercise(q,4).item.hsk,4);
 assert.equal(C.validateGeneratedExercise({...q,options:['甲','甲','丙','丁']},4).valid,false);
 assert.equal(C.validateGeneratedExercise({...q,correctAnswer:4},4).valid,false);
 assert.equal(C.validateGeneratedExercise({type:'reorder',prompt:'排列句子',segments:['我','喜欢','中文'],correctAnswer:'我喜欢英语',explanation:'Sắp xếp câu theo trật tự.'},3).valid,false);
});
test('dynamic practice bank isolates owners and excludes answered items',()=>{
 const data=new Map();globalThis.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
 try{const item={id:'q1',hsk:3,type:'multiple_choice',prompt:'选择正确答案',correctAnswer:0};
 C.saveToLocalDynamicBank('alice',[item]);assert.equal(C.getLocalDynamicBank('bob').length,0);
 assert.equal(C.selectDynamicExercises({uid:'alice',hsk:3}).length,1);
 assert.equal(C.selectDynamicExercises({uid:'alice',hsk:3,answeredQuestionIds:new Set(['q1'])}).length,0);
 }finally{delete globalThis.localStorage;}
});
