/* Verified AI practice generation and the per-account dynamic practice bank. */
(function(root){
  'use strict';
  const BANK_PREFIX='hsk-dynamic-practice-bank-v1', MAX_BANK=150;
  const text=value=>String(value??'').normalize('NFKC').trim();
  const compact=value=>text(value).replace(/[\s\u3000。，！？!?；;：:,、.“”‘’（）()\[\]{}]/gu,'');
  const hanzi=value=>(text(value).match(/[\u3400-\u9fff]/gu)||[]).join('');
  const storage=()=>typeof root.localStorage==='object'?root.localStorage:null;
  const ownerKey=uid=>`${BANK_PREFIX}:${text(uid)||'guest'}`;
  const unique=items=>Array.from(new Set((Array.isArray(items)?items:[]).map(text).filter(Boolean)));
  const id=(prefix)=>`ai_${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;

  function validateGeneratedExercise(rawItem, expectedHsk=3){
    if(!rawItem||typeof rawItem!=='object')return {valid:false,reason:'invalid_item_object'};
    const type=text(rawItem.type),prompt=text(rawItem.prompt),explanation=text(rawItem.explanation),topicId=text(rawItem.topicId)||'general';
    if(!prompt||explanation.length<8)return {valid:false,reason:'missing_prompt_or_explanation'};
    const base={source:'ai_verified',hsk:Math.max(1,Math.min(6,Number(expectedHsk)||3)),skill:text(rawItem.skill)||'grammar',topicId,createdAt:Date.now()};
    if(type==='multiple_choice'){
      const options=Array.isArray(rawItem.options)?rawItem.options.map(text):[];
      const answer=Number(rawItem.correctAnswer);
      if(options.length!==4||options.some(x=>!x)||new Set(options).size!==4)return {valid:false,reason:'mcq_requires_4_unique_options'};
      if(!Number.isInteger(answer)||answer<0||answer>=options.length)return {valid:false,reason:'invalid_mcq_answer_index'};
      return {valid:true,item:{...base,id:id('mcq'),type,prompt,options,correctAnswer:answer,explanation}};
    }
    if(type==='reorder'){
      const correct=text(rawItem.correctAnswer),segments=Array.isArray(rawItem.segments)?rawItem.segments.map(text).filter(Boolean):[];
      if(!correct||segments.length<3||segments.length>10)return {valid:false,reason:'reorder_segments_out_of_range'};
      const sorted=value=>Array.from(compact(value)).sort().join('');
      if(sorted(segments.join(''))!==sorted(correct))return {valid:false,reason:'reorder_segments_character_mismatch'};
      const accepted=unique([correct,...(Array.isArray(rawItem.acceptedAnswers)?rawItem.acceptedAnswers:[])]).slice(0,5);
      if(!accepted.length)return {valid:false,reason:'reorder_missing_answer'};
      return {valid:true,item:{...base,id:id('reorder'),type,skill:'writing',topicId:topicId==='general'?'word_order':topicId,prompt,segments,correctAnswer:correct,acceptedAnswers:accepted,explanation}};
    }
    if(type==='fill_in_blank'){
      const answer=text(rawItem.correctAnswer),hasBlank=/___|（\s*）|\(\s*\)/u.test(prompt);
      if(!hasBlank||!answer||answer.length>20)return {valid:false,reason:'invalid_fill_in_blank_format'};
      return {valid:true,item:{...base,id:id('fill'),type,skill:'reading',topicId:topicId==='general'?'fill_in_blank':topicId,prompt,correctAnswer:answer,acceptedAnswers:unique([answer,...(Array.isArray(rawItem.acceptedAnswers)?rawItem.acceptedAnswers:[])]).slice(0,5),explanation}};
    }
    return {valid:false,reason:'unsupported_exercise_type'};
  }

  function getLocalDynamicBank(uid='guest'){
    const store=storage();if(!store)return [];
    try{const parsed=JSON.parse(store.getItem(ownerKey(uid))||'[]');return Array.isArray(parsed)?parsed.filter(x=>x&&typeof x==='object'):[];}catch{return [];}
  }
  function saveToLocalDynamicBank(uid='guest',items=[]){
    const store=storage();if(!store||!Array.isArray(items)||!items.length)return getLocalDynamicBank(uid);
    try{
      const old=getLocalDynamicBank(uid),seen=new Set(old.map(x=>`${x.type}|${compact(x.prompt)}|${compact(x.correctAnswer)}`));
      const fresh=items.filter(x=>x&&x.prompt&&!seen.has(`${x.type}|${compact(x.prompt)}|${compact(x.correctAnswer)}`));
      const merged=[...fresh,...old].slice(0,MAX_BANK);store.setItem(ownerKey(uid),JSON.stringify(merged));return merged;
    }catch{return getLocalDynamicBank(uid);}
  }
  function selectDynamicExercises({uid='guest',hsk=3,answeredQuestionIds=new Set(),count=5,match=()=>true}={}){
    const answered=answeredQuestionIds instanceof Set?answeredQuestionIds:new Set(answeredQuestionIds||[]);
    return getLocalDynamicBank(uid).filter(x=>Number(x.hsk)===Number(hsk)&&!answered.has(x.id)&&match(x)).slice(0,Math.max(0,Number(count)||5));
  }
  function buildGenerationPayload({uid='guest',hsk=3,count=5,focusRules=[],recentMistakeSamples=[],adaptivePlan=null,lessonWords=[],requestedTypes=['multiple_choice','reorder','fill_in_blank']}={}){
    return {question:'Tạo bài luyện thích ứng theo hồ sơ lỗi.',hsk:Number(hsk)||3,lesson:{id:'unified-practice-generator',title:'Ngân hàng bài luyện thích ứng',words:(Array.isArray(lessonWords)?lessonWords:[]).slice(0,20),content:{mode:'unified-practice-gen',hsk:Number(hsk)||3,count:Math.min(8,Math.max(1,Number(count)||5)),focusRules:(Array.isArray(focusRules)?focusRules:[]).slice(0,6),recentMistakeSamples:(Array.isArray(recentMistakeSamples)?recentMistakeSamples:[]).slice(0,6),adaptivePlan,lessonWords:(Array.isArray(lessonWords)?lessonWords:[]).slice(0,20),requestedTypes}},history:[]};
  }
  async function synthesizeAdaptiveExercises({uid='guest',hsk=3,count=5,focusRules=[],recentMistakeSamples=[],adaptivePlan=null,lessonWords=[],requestedTypes,endpoint,token,fetchFn=root.fetch?.bind(root),signal}={}){
    if(typeof fetchFn!=='function')throw Error('AI practice fetch is unavailable');
    const user=root.HSKAccountDashboard?.user;
    const authToken=token||await user?.getIdToken?.();
    if(!authToken)throw Error('Hãy đăng nhập để tạo bài luyện AI.');
    let url=endpoint||root.__hskTeacherConfig?.endpoint;
    if(!url){try{const config=await fetch('./translation-config.json',{cache:'no-store'}).then(r=>r.json());url=config.endpoint;}catch{}}
    if(!url)throw Error('Chưa cấu hình dịch vụ AI.');
    url=String(url).replace(/\/translate\/?$/,'/lesson-ask');
    const response=await fetchFn(url,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+authToken},body:JSON.stringify(buildGenerationPayload({uid,hsk,count,focusRules,recentMistakeSamples,adaptivePlan,lessonWords,requestedTypes})),signal});
    const payload=await response.json().catch(()=>({}));
    if(!response.ok)throw Error(payload.error||`Unified Practice Generator HTTP ${response.status}`);
    let rawItems=Array.isArray(payload.items)?payload.items:[];
    if(!rawItems.length&&typeof payload.answer==='string'){try{rawItems=JSON.parse(payload.answer)?.items||[];}catch{}}
    const verified=[];for(const item of rawItems){const result=validateGeneratedExercise(item,hsk);if(result.valid)verified.push(result.item);}
    saveToLocalDynamicBank(uid,verified);return verified;
  }
  const api={validateGeneratedExercise,getLocalDynamicBank,saveToLocalDynamicBank,selectDynamicExercises,buildGenerationPayload,synthesizeAdaptiveExercises};
  root.HSKPracticeGenerator=api;
  if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis==='object'?globalThis:this);
