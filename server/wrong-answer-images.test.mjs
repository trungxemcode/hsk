import test from 'node:test';
import assert from 'node:assert/strict';
import {validExamImages,resolveExamImages} from './wrong-answer-images.mjs';
import {createHandler} from './translator-worker-bundled.mjs';
import {createAiRoleFetch} from './ai-backup.mjs';
const img=new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0,0,0,0,0,1,2,3,4]);
const inline={label:'Đáp án A',mimeType:'image/png',data:Buffer.from(img).toString('base64')};
const url='https://s4-media1.study4.com/media/hsk_tests/images/HSK3Test/images/image1.png';
const remote={label:'Đáp án B',src:url};
const gemini={GEMINI_API_KEY:'fake-gemini',FIREBASE_API_KEY:'fake-firebase'};
const project='hsk-flashcards-44631',claims={aud:project,iss:'https://securetoken.google.com/'+project,sub:'student-one',exp:Math.floor(Date.now()/1000)+3600};
const token='header.'+Buffer.from(JSON.stringify(claims)).toString('base64url')+'.signature';
const lesson={id:'wrong-explain-test',title:'Bài kiểm tra HSK',words:[],content:{mode:'wrong-answer-explanation',skill:'Đọc',question:'哪一个是正确的？',allOptions:['A','B','C','D'].map((option,i)=>({option,text:'Nội dung '+option,status:i===2?'Đáp án đúng':'Sai'})),correctAnswer:'C'}};
const body=images=>({hsk:3,question:'Giải thích từng lựa chọn A, B, C, D',lesson,history:[],images});
const req=images=>new Request('https://worker.test/lesson-ask',{method:'POST',headers:{Origin:'https://trungxemcode.github.io',Authorization:'Bearer '+token},body:JSON.stringify(body(images))});
const answer=()=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({answer:'Đề hỏi chọn đáp án đúng. A sai, B sai, C đúng, D sai.'})}]}}]});
test('input only accepts actual exam CDN or signed inline image bytes; arbitrary servers are not fetched',()=>{
 assert.equal(validExamImages([inline,remote]),true);
 for(const src of ['https://evil.example/steal.png','http://s4-media1.study4.com/media/hsk_tests/images/a.png','https://s4-media1.study4.com.evil.example/media/hsk_tests/images/a.png','https://s4-media1.study4.com/admin/secrets.png','https://s4-media1.study4.com/media/hsk_tests/images/foo.png?url=x','https://s4-media1.study4.com:444/media/hsk_tests/images/ok.png'])assert.equal(validExamImages([{label:'A',src}]),false,src);
 assert.equal(validExamImages(Array(11).fill(inline)),false);
 assert.equal(validExamImages([{...inline,data:'AA'}]),false);
});
test('all real exam image bytes arrive as multimodal parts with correct labels',async()=>{
 const calls=[];
 const parts=await resolveExamImages([inline,remote],{fetchFn:async(u,options)=>{calls.push([u,options.redirect]);return new Response(img,{status:200,headers:{'content-type':'image/png','content-length':String(img.byteLength)}});}});
 assert.deepEqual(calls,[[url,'error']]);
 assert.deepEqual(parts.map(p=>p.text||p.inlineData?.mimeType),['Ảnh minh họa: Đáp án A','image/png','Ảnh minh họa: Đáp án B','image/png']);
 assert.equal(Buffer.from(parts[1].inlineData.data,'base64').toString('hex'),Buffer.from(img).toString('hex'));
});
test('oversized, wrong-signature, changed-type and malformed media fail closed',async()=>{
 await assert.rejects(resolveExamImages([{...inline,mimeType:'image/jpeg'}]),/định dạng/);
 await assert.rejects(resolveExamImages([remote],{fetchFn:async()=>new Response('not an image')}),/định dạng/);
 await assert.rejects(resolveExamImages([remote],{fetchFn:async()=>new Response(img,{headers:{'content-length':'1500000'}})}),/quá lớn/);
});
test('authenticated wrong-answer lesson puts actual image in Gemini request, never just image label',async()=>{
 const calls=[],handler=createHandler(async(url,init)=>{
  calls.push([String(url),init]);
  if(String(url).includes('identitytoolkit'))return Response.json({users:[{localId:'student-one'}]});
  return answer();
 });
 const response=await handler(req([inline]),gemini),d=await response.json();
 assert.equal(response.status,200,JSON.stringify(d));
 const payload=JSON.parse(calls[1][1].body),parts=payload.contents.at(-1).parts;
 assert.equal(parts.length,3);
 assert.equal(parts[2].inlineData.mimeType,'image/png');
 assert.equal(parts[2].inlineData.data,inline.data);
 assert.match(payload.systemInstruction.parts[0].text,/từng.*phương án/i);
 assert.match(payload.systemInstruction.parts[0].text,/allOptions/);
 assert.equal(payload.generationConfig.maxOutputTokens,1900);
});
test('malicious image inputs rejected before account verification and no external fetch',async()=>{
 let calls=0;const handler=createHandler(async()=>{calls++;throw Error('should not fetch')});
 const response=await handler(req([{label:'A',src:'https://127.0.0.1/internal.png'}]),gemini);
 assert.equal(response.status,400);assert.equal(calls,0);
});
test('regular-user image explanation is routed to Gemini, not text-only xKiro',async()=>{
 const calls=[];
 const provider=createAiRoleFetch(async(url)=>{calls.push(url);return answer();},{AI_TASK_ROUTING:'true',AI_BACKUP_ENABLED:'true',SECONDARY_AI_PROVIDER:'xkiro',SECONDARY_AI_API_KEY:'fake-very-long-test-key-1234567',SECONDARY_AI_MODEL:'fake-xkiro'}, {route:'/lesson-ask',body:body([inline]),accountRole:'regular'});
 await provider('https://generativelanguage.googleapis.com/v1beta/models/ai:generateContent',{body:JSON.stringify({contents:[{role:'user',parts:[{inlineData:{mimeType:inline.mimeType,data:inline.data}}]}]})});
 assert.equal(calls.length,1);assert.match(calls[0],/generativelanguage/);
});
