import test from 'node:test';
import assert from 'node:assert/strict';
import {buildWrongAnswerCacheKey,getCachedWrongAnswerExplanation,setCachedWrongAnswerExplanation,getQuestionVisualSummary} from './tutor-cache.mjs';

const lesson={id:'wrong-explain-q1',content:{skill:'Đọc',question:'哪一个正确？',allOptions:[{option:'A',text:'一'},{option:'B',text:'二'}],userWrongAnswer:'A',correctAnswer:'B'}};

test('turn zero wrong-answer cache separates answers, images and follow-ups',()=>{
 const base={hsk:2,lesson,history:[],images:[{label:'Hình A',data:'a'.repeat(40),mimeType:'image/png'}]};
 const key=buildWrongAnswerCacheKey(base);
 assert.ok(key.includes('wa_turn0_v1'));
 assert.notEqual(key,buildWrongAnswerCacheKey({...base,lesson:{...lesson,content:{...lesson.content,userWrongAnswer:'B'}}}));
 assert.notEqual(key,buildWrongAnswerCacheKey({...base,images:[]}));
 assert.equal(buildWrongAnswerCacheKey({...base,history:[{role:'user',text:'hỏi thêm'}]}),null);
 setCachedWrongAnswerExplanation(base,'Bước 5\n[[KEY_POINT: grammar | Nhớ cấu trúc câu]]');
 assert.equal(getCachedWrongAnswerExplanation(base),'Bước 5\n[[KEY_POINT: grammar | Nhớ cấu trúc câu]]');
 assert.match(getQuestionVisualSummary(lesson.id),/KEY_POINT/);
});
