(function(root){'use strict';
const normalize=s=>String(s??'').normalize('NFKC').replace(/[\s\p{P}\p{S}]/gu,'');
function normalizeChineseSentenceForGrading(value){return String(value??'').normalize('NFKC').trim().replace(/[,，]/g,'，').replace(/[;；]/g,'；').replace(/[:：]/g,'：').replace(/[.。!！?？]+$/u,'').replace(/\s+/gu,'');}
function evaluateReorderedSentence(userAnswer,acceptedAnswers){
 const user=normalizeChineseSentenceForGrading(userAnswer),accepted=(Array.isArray(acceptedAnswers)?acceptedAnswers:[acceptedAnswers]).map(normalizeChineseSentenceForGrading).filter(Boolean);
 if(accepted.includes(user))return {isCorrect:true,matchType:'exact'};
 const time='(今天|明天|昨天|现在|刚才|每天|周末|早上|晚上|上午|下午|今年|明年|去年|以前|以后|最近|常常|往往)',subject='(我|你|您|他|她|我们|你们|他们|她们|大家|妈妈|爸爸|老师|朋友|经理|小王|小李|这|那)';
 let m=user.match(new RegExp('^'+time+'，?'+subject+'(.+)$'));
 if(m&&accepted.includes(normalizeChineseSentenceForGrading(m[2]+m[1]+m[3])))return {isCorrect:true,matchType:'valid_time_permutation'};
 m=user.match(new RegExp('^'+subject+time+'(.+)$'));
 if(m&&(accepted.includes(normalizeChineseSentenceForGrading(m[2]+'，'+m[1]+m[3]))||accepted.includes(normalizeChineseSentenceForGrading(m[2]+m[1]+m[3]))))return {isCorrect:true,matchType:'valid_time_permutation'};
 return {isCorrect:false,matchType:'mismatch'};
}
const count=s=>(String(s).match(/[\p{Script=Han}]/gu)||[]).length;
function eligible(bank,level,skill='all',type='all'){const types=new Map(bank.types.map(t=>[t.id,t]));return bank.items.filter(q=>q.level===Number(level)&&(type==='all'||q.type===type)&&(skill==='all'||types.get(q.type)?.skill===skill));}
function grade(q,value){if(q.tokens){if(!Array.isArray(value)||value.length!==q.tokens.length||new Set(value).size!==q.tokens.length||value.some(i=>!Number.isInteger(i)||i<0||i>=q.tokens.length))return false;return evaluateReorderedSentence(value.map(i=>q.tokens[i]).join(''),q.accepted).isCorrect;}if(q.options)return Number.isInteger(value)&&value===q.answer;const accepted=Array.isArray(q.acceptedAnswers)&&q.acceptedAnswers.length?q.acceptedAnswers:[q.answer];return accepted.some(answer=>normalize(value)===normalize(answer));}
function writing(q,text){return {characters:count(text),keywords:(q.keywords||[]).map(word=>({word,present:normalize(text).includes(normalize(word))})),target:q.target||0};}
function shuffled(array,rng=Math.random){const out=[...array];for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
function validate(bank){const ids=new Set(),types=new Map(bank.types.map(t=>[t.id,t]));for(const q of bank.items){if(ids.has(q.id))throw Error('Duplicate question '+q.id);ids.add(q.id);const type=types.get(q.type);if(!type?.levels.includes(q.level))throw Error('Invalid level/type '+q.id);if(q.options&&(!Number.isInteger(q.answer)||q.answer<0||q.answer>=q.options.length||new Set(q.options).size!==q.options.length))throw Error('Invalid choices '+q.id);if(q.tokens&&(!q.accepted?.length||!grade(q,q.tokens.map((_,i)=>i))))throw Error('Invalid order '+q.id);if(type.format==='writing'&&(!q.model||!q.rubric?.length))throw Error('Missing writing guidance '+q.id);if(q.audio&&!q.audio.trim())throw Error('Missing audio text '+q.id);}return true;}
const api={normalize,normalizeChineseSentenceForGrading,evaluateReorderedSentence,count,eligible,grade,writing,shuffled,validate};root.HSKExamCore=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='object'?window:globalThis);
