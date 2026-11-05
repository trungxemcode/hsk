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

  function escapeRegExp(value){return String(value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
  function verifyAnswerExplanationConsistency(rawItem){
    const type=text(rawItem?.type),prompt=text(rawItem?.prompt),explanation=text(rawItem?.explanation);let correctText='',distractors=[];
    if(type==='multiple_choice'&&Array.isArray(rawItem.options)){const index=Number(rawItem.correctAnswer);correctText=text(rawItem.options[index]);distractors=rawItem.options.filter((_,i)=>i!==index).map(text).filter(Boolean);}else correctText=text(rawItem?.correctAnswer);
    if(!correctText)return {passed:false,reason:'empty_correct_answer'};
    for(const distractor of distractors){const pattern=new RegExp(`(đáp án đúng là|chọn đáp án|nên chọn|phải điền|kết quả là|bằng)\\s*["“'‘(\\[]?${escapeRegExp(distractor)}["”'’)\\]]?`,'i');if(pattern.test(explanation))return {passed:false,reason:`explanation_contradicts_answer_key_affirms_${distractor}`};}
    if((type==='multiple_choice'||type==='fill_in_blank')&&!explanation.includes(correctText))return {passed:false,reason:'explanation_missing_correct_answer_reference'};
    if(prompt.includes('___')){const filled=prompt.replace('___',correctText).replace(/\s+/g,'');if(/(不不|没没|了了|着着|过过|把把|被被|的得|得的)/.test(filled))return {passed:false,reason:'filled_sentence_has_duplicate_particles'};}
    return {passed:true};
  }
  function validateGeneratedExercise(rawItem, expectedHsk=3){
    const config=expectedHsk&&typeof expectedHsk==='object'?expectedHsk:{expectedHsk};const learnerHsk=Math.max(1,Math.min(6,Number(config.expectedHsk)||3)),expectedTopicId=text(config.expectedTopicId),localDictMap=config.localDictMap||null;
    if(!rawItem||typeof rawItem!=='object')return {valid:false,reason:'invalid_item_object'};
    const type=text(rawItem.type),prompt=text(rawItem.prompt),explanation=text(rawItem.explanation),topicId=expectedTopicId||text(rawItem.topicId)||'general';
    if(expectedTopicId&&rawItem.topicId&&text(rawItem.topicId)!==expectedTopicId)return {valid:false,reason:`topic_mismatch_expected_${expectedTopicId}_got_${text(rawItem.topicId)}`};
    if(!prompt||explanation.length<10)return {valid:false,reason:'missing_prompt_or_explanation'};
    const ceiling=validateHskLevelCeiling(prompt,learnerHsk,localDictMap);if(!ceiling.valid)return ceiling;
    const ambiguity=validateUnambiguousAnswer(rawItem,localDictMap);if(!ambiguity.valid)return ambiguity;
    const consistency=verifyAnswerExplanationConsistency(rawItem);if(!consistency.passed)return {valid:false,reason:consistency.reason};
    const base={source:'ai_verified',validationStatus:'consistency_checked',hsk:learnerHsk,skill:text(rawItem.skill)||'grammar',topicId,createdAt:Date.now()};
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
      return {valid:true,item:{...base,id:id('fill'),type,skill:'reading',inputMode:answer.length===1?'single_char':'multi_char',maxLength:Math.max(8,answer.length+2),topicId:topicId==='general'?'fill_in_blank':topicId,prompt,pinyin:text(rawItem.pinyin),correctAnswer:answer,acceptedAnswers:unique([answer,...(Array.isArray(rawItem.acceptedAnswers)?rawItem.acceptedAnswers:[])]).slice(0,5),explanation}};
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
  const chineseWords=value=>{const raw=text(value),segments=[];if(typeof Intl!=='undefined'&&Intl.Segmenter){for(const part of new Intl.Segmenter('zh-CN',{granularity:'word'}).segment(raw))if(/[\u3400-\u9fff]/u.test(part.segment))segments.push(part.segment);}else segments.push(...(raw.match(/[\u3400-\u9fff]+/gu)||[]));return segments;};
  function dictEntry(map,key){return map?.get?map.get(key):map?.[key];}
  function validateHskLevelCeiling(chineseSentence,learnerHsk=3,localDictMap=null){if(!localDictMap)return {valid:true};const words=chineseWords(chineseSentence),maxAllowed=Number(learnerHsk)||3,over=words.map(w=>({w,e:dictEntry(localDictMap,w)})).filter(x=>x.e?.hsk&&Number(x.e.hsk)>maxAllowed+1);return over.length>=2||words.length&&over.length/words.length>.15?{valid:false,reason:`Câu vượt trần từ vựng HSK ${maxAllowed}: ${over.map(x=>`${x.w}(HSK${x.e.hsk})`).join(', ')}`}:{valid:true};}
  function validateUnambiguousAnswer(exercise,localDictMap=null){
   if(!exercise||!text(exercise.prompt))return {valid:false,reason:'empty_prompt'};const prompt=text(exercise.prompt),options=Array.isArray(exercise.options)?exercise.options.map(text):[];
   const negation=options.includes('不')&&(options.includes('没')||options.includes('没有'));if(negation&&!/(昨天|今天|明天|刚才|以前|以后|平时|常常|往往|总是|从不|已经|曾经|过|了|还没|要是|如果|想|愿意|敢|肯)/u.test(prompt))return {valid:false,reason:'ambiguous_bu_mei'};
   if(exercise.type==='multiple_choice'&&localDictMap){if(new Set(options).size!==options.length)return {valid:false,reason:'duplicate_options'};const meanings=[];for(const option of options){const meaning=text(dictEntry(localDictMap,option)?.meaning).toLowerCase();if(meaning&&meanings.includes(meaning))return {valid:false,reason:'duplicate_option_meaning'};if(meaning)meanings.push(meaning);}}
   if(exercise.type==='reorder'){const exam=root.HSKExamCore,target=exam?.normalizeChineseSentenceForGrading?exam.normalizeChineseSentenceForGrading(exercise.correctAnswer):compact(exercise.correctAnswer),joined=exam?.normalizeChineseSentenceForGrading?exam.normalizeChineseSentenceForGrading((exercise.segments||[]).join('')):compact((exercise.segments||[]).join(''));if(Array.from(target).sort().join('')!==Array.from(joined).sort().join(''))return {valid:false,reason:'reorder_character_mismatch'};}
   return {valid:true};
  }
  function sanitizeGeneratedPinyin(item,localDictMap=null){if(!item||!localDictMap)return item;const word=text(item.han||item.word),entry=dictEntry(localDictMap,word),normalize=root.HSKOpenDictionaryCore?.normalizePinyinWithoutTone||((v)=>text(v).toLowerCase().replace(/[1-5]/g,''));if(entry?.pinyin&&(!item.pinyin||normalize(item.pinyin)===normalize(entry.pinyin)))item.pinyin=entry.pinyin;return item;}
  function verifyTutorPackQuality(pack,learnerHsk=3,localDictMap=null){if(!pack?.teachingCard||!Array.isArray(pack.guidedExercises)||!pack.blindCheckExercise)return {valid:false,reason:'missing_tutor_pack_parts'};const exercises=[...pack.guidedExercises,pack.blindCheckExercise];for(const ex of exercises){const ceiling=validateHskLevelCeiling(ex.prompt,learnerHsk,localDictMap);if(!ceiling.valid)return ceiling;const answer=validateUnambiguousAnswer(ex,localDictMap);if(!answer.valid)return answer;if(text(ex.explanation).length<10)return {valid:false,reason:'missing_explanation'};}return {valid:true};}
  async function synthesizeAdaptiveExercises({uid='guest',getCurrentUid=()=>uid,sessionId=null,isSessionActive=()=>true,hsk=3,count=5,targetTopicId=null,focusRules=[],recentMistakeSamples=[],adaptivePlan=null,lessonWords=[],requestedTypes,endpoint,token,fetchFn=root.fetch?.bind(root),signal,localDictMap=null}={}){
    if(typeof fetchFn!=='function')throw Error('AI practice fetch is unavailable');
    const user=root.HSKAccountDashboard?.user;
    const authToken=token||await user?.getIdToken?.();
    if(!authToken)throw Error('Hãy đăng nhập để tạo bài luyện AI.');
    let url=endpoint||root.__hskTeacherConfig?.endpoint;
    if(!url){try{const config=await fetch('./translation-config.json',{cache:'no-store'}).then(r=>r.json());url=config.endpoint;}catch{}}
    if(!url)throw Error('Chưa cấu hình dịch vụ AI.');
    url=String(url).replace(/\/translate\/?$/,'/lesson-ask');
    const expectedUid=resolveSafeUid(uid),response=await fetchFn(url,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+authToken},body:JSON.stringify(buildGenerationPayload({uid,hsk,count,focusRules,recentMistakeSamples,adaptivePlan,lessonWords,requestedTypes})),signal});
    if(signal?.aborted||resolveSafeUid(getCurrentUid())!==expectedUid||!isSessionActive(sessionId))return {aborted:true,reason:'context_invalidated_before_response',items:[]};
    const payload=await response.json().catch(()=>({}));
    if(!response.ok)throw Error(payload.error||`Unified Practice Generator HTTP ${response.status}`);
    let rawItems=Array.isArray(payload.items)?payload.items:[];
    if(!rawItems.length&&typeof payload.answer==='string'){try{rawItems=JSON.parse(payload.answer)?.items||[];}catch{}}
    if(signal?.aborted||resolveSafeUid(getCurrentUid())!==expectedUid||!isSessionActive(sessionId))return {aborted:true,reason:'context_invalidated_after_json',items:[]};
    const verified=[];for(const item of rawItems){const result=validateGeneratedExercise(item,{expectedHsk:hsk,expectedTopicId:targetTopicId,localDictMap});if(result.valid)verified.push(result.item);}
    saveToLocalDynamicBank(expectedUid,verified);return {aborted:false,items:verified};
  }
  const api={validateGeneratedExercise,verifyAnswerExplanationConsistency,getLocalDynamicBank,saveToLocalDynamicBank,selectDynamicExercises,buildGenerationPayload,synthesizeAdaptiveExercises,validateHskLevelCeiling,validateUnambiguousAnswer,sanitizeGeneratedPinyin,verifyTutorPackQuality};
  root.HSKPracticeGenerator=api;
  if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis==='object'?globalThis:this);
