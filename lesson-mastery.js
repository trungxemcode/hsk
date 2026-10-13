(function(root){
'use strict';
const DAY=86400000;
function score(state={},keys=[],contentKeys=[],miniKeys=[]){
 const read=!!(state.read||state.completed),e=state.evidence||{};
 const quiz=keys.length?keys.reduce((s,k)=>s+Math.min(2,Math.max(0,e[k]?.quizStreak||0))/2,0)/keys.length:0;
 const srs=keys.length?keys.reduce((s,k)=>s+Math.min(3,(e[k]?.srsPasses||[]).length)/3,0)/keys.length:0;
 const content=contentKeys.length?contentKeys.reduce((s,k)=>s+Math.min(2,Math.max(0,state.contentEvidence?.[k]?.streak||0))/2,0)/contentKeys.length:1;
 const miniValue=k=>k==='mini-writing'?(state.miniEvidence?.[k]?.reviewed===true?1:0):Math.min(2,Math.max(0,state.miniEvidence?.[k]?.streak||0))/2;
 const mini=miniKeys.length?miniKeys.reduce((sum,k)=>sum+miniValue(k),0)/miniKeys.length:1;
 const weights={read:miniKeys.length?15:20,quiz:contentKeys.length?15:30,content:contentKeys.length?15:0,srs:miniKeys.length?45:50,mini:miniKeys.length?10:0};
 const mastered=read&&keys.length>0&&quiz===1&&srs===1&&content===1&&mini===1;
 return {read,quiz,srs,content,mini,weights,miniReady:miniKeys.filter(k=>miniValue(k)===1).length,mastered,percent:mastered?100:Math.min(99,Math.floor((read?weights.read:0)+weights.quiz*quiz+weights.content*content+weights.srs*srs+weights.mini*mini)),quizReady:keys.filter(k=>(e[k]?.quizStreak||0)>=2).length,srsReady:keys.filter(k=>(e[k]?.srsPasses||[]).length>=3).length};
}
function applyMini(state,event){const next=JSON.parse(JSON.stringify(state||{}));if(!event||typeof event.id!=='string'||!event.id.startsWith('mini-')||!Number.isFinite(event.time))return next;const evidence=next.miniEvidence||(next.miniEvidence={}),old=evidence[event.id]||{};
 if(event.kind==='writing'){if(event.reviewed!==true)return next;evidence[event.id]={...old,kind:'writing',reviewed:true,attempts:(old.attempts||0)+1,last:event.time};}
 else{if(event.kind!=='objective'||typeof event.correct!=='boolean')return next;evidence[event.id]={...old,kind:'objective',streak:event.correct?Math.min(2,(old.streak||0)+1):0,attempts:(old.attempts||0)+1,correct:(old.correct||0)+(event.correct?1:0),last:event.time};}next.updatedAt=event.time;return next;}
function apply(state,event){
 const next=JSON.parse(JSON.stringify(state||{})),e=next.evidence||(next.evidence={}),r=e[event.key]||(e[event.key]={quizStreak:0,srsPasses:[]});
 if(!['quiz','srs'].includes(event.kind)||typeof event.correct!=='boolean'||!Number.isFinite(event.time))return next;
 if(event.kind==='quiz'){r.quizStreak=event.correct?Math.min(2,(r.quizStreak||0)+1):0;r.quizAttempts=(r.quizAttempts||0)+1;r.quizCorrect=(r.quizCorrect||0)+(event.correct?1:0);}
 else if(!event.correct)r.srsPasses=[];
 else{const xs=r.srsPasses||[],last=xs.at(-1);if(last===undefined||event.time-last>=DAY)r.srsPasses=[...xs,event.time].slice(-3);}
 r.last=event.time;next.updatedAt=event.time;return next;
}
const api={score,apply,applyMini};root.HSKLessonMastery=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
