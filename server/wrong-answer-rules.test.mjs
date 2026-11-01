import test from 'node:test';
import assert from 'node:assert/strict';
import {buildWrongAnswerInstruction} from './wrong-answer-rules.mjs';
import {createHandler} from './translator-worker-bundled.mjs';
const choices=['A','B','C','D'].map((option,i)=>({option,text:'Câu '+option,status:i===2?'Đáp án đúng':'Phương án sai'}));
const question=skill=>({id:'wrong-explain-example',title:'HSK 3 - '+skill,words:[],content:{mode:'wrong-answer-explanation',skill,question:'哪个句子正确?',transcript:skill==='Nghe'?'女：你喝茶吗？男：我喝水。':'',allOptions:choices,correctAnswer:'C',userWrongAnswer:'A',imageLabels:['Hình A','Hình B','Hình C','Hình D']}});
test('one rubric explains every A-D option for listening, reading, writing and picture questions',()=>{
 for(const skill of ['Nghe','Đọc','Viết','Trắc nghiệm','Từ vựng']){
  const rule=buildWrongAnswerInstruction(question(skill));
  assert.match(rule,/TẤT CẢ CÁC ĐÁP ÁN/);
  assert.match(rule,/Kể cả phương án đúng/);
  assert.match(rule,/Áp dụng không ngoại lệ cho phần NGHE/);
  assert.match(rule,/ảnh thực tế|ảnh thật/);
  assert.match(rule,/không bịa bốn phương án/);
  assert.match(rule,/content\.allOptions/);
  const expected=['1. ','2. Nghĩa','3. Đáp án đúng','4. GIẢI THÍCH','5. Mấu chốt'].map(x=>rule.indexOf(x));
  assert.ok(expected.every((x,i)=>x>=0&&(!i||x>expected[i-1])));
 }
});
test('listening differs only by using existing transcript, never streaming audio or calling ASR',()=>{
 const instruction=buildWrongAnswerInstruction(question('Nghe'));
 assert.match(instruction,/ĐỌC NGUYÊN VĂN transcript/);
 assert.match(instruction,/không sử dụng công cụ nghe\/ASR/);
 assert.match(instruction,/女：你喝茶吗？男：我喝水。/);
 assert.match(buildWrongAnswerInstruction(question('Đọc')),/content\.question và content\.context/);
 assert.doesNotMatch(buildWrongAnswerInstruction(question('Đọc')),/1\. Transcript/);
});
test('no-option writing is taught through steps rather than invented A-D choices',()=>{
 const item=question('Viết');item.content.allOptions=[];
 const rule=buildWrongAnswerInstruction(item);
 assert.match(rule,/thay mục 4 bằng cách làm/);
 assert.match(rule,/không bịa bốn phương án/);
});
const origin='https://trungxemcode.github.io';
const project='hsk-flashcards-44631',token='header.'+Buffer.from(JSON.stringify({aud:project,iss:'https://securetoken.google.com/'+project,sub:'student',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')+'.signature';
const image={label:'Hình A',mimeType:'image/png',data:Buffer.from([137,80,78,71,13,10,26,10,0,0,0,0,0,0,0,0,4,4,4,4]).toString('base64')};
const aiAnswer=()=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({answer:'C đúng; A, B, D sai.'})}]}}]});
test('real Worker inputs for both listening and reading send images and the identical full A-D rubric',async()=>{
 for(const skill of ['Nghe','Đọc']){
  const calls=[];
  const handler=createHandler(async(url,opts)=>{
   if(String(url).includes('identitytoolkit'))return Response.json({users:[{localId:'student'}]});
   calls.push(JSON.parse(opts.body));return aiAnswer();
  });
  const request=new Request('https://worker.test/lesson-ask',{method:'POST',headers:{Origin:origin,Authorization:'Bearer '+token},body:JSON.stringify({hsk:3,question:'Giải thích từng đáp án',lesson:question(skill),history:[],images:[image]})});
  const response=await handler(request,{GEMINI_API_KEY:'test',FIREBASE_API_KEY:'test'});
  assert.equal(response.status,200,JSON.stringify(await response.clone().json()));
  assert.equal(calls.length,1);
  const data=calls[0],parts=data.contents.at(-1).parts;
  assert.equal(parts.length,3);
  assert.equal(parts[2].inlineData.data,image.data);
  assert.equal(parts[2].inlineData.mimeType,'image/png');
  assert.ok(!data.contents.some(c=>c.parts.some(p=>p.fileData||p.audio||p.audioData)));
  assert.match(data.systemInstruction.parts[0].text,/Kể cả phương án đúng/);
  assert.match(data.systemInstruction.parts[0].text,/Ảnh|HÌNH ẢNH/);
  if(skill==='Nghe')assert.match(data.systemInstruction.parts[0].text,/không sử dụng công cụ nghe\/ASR/);
 }
});
