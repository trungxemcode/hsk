(function(root){
'use strict';
const DAY=86400000;
function score(state={},keys=[]){
 const read=!!(state.read||state.completed),e=state.evidence||{};
 const quiz=keys.length?keys.reduce((s,k)=>s+Math.min(2,Math.max(0,e[k]?.quizStreak||0))/2,0)/keys.length:0;
 const srs=keys.length?keys.reduce((s,k)=>s+Math.min(3,(e[k]?.srsPasses||[]).length)/3,0)/keys.length:0;
 const mastered=read&&keys.length>0&&quiz===1&&srs===1;
 return {read,quiz,srs,mastered,percent:mastered?100:Math.min(99,Math.floor((read?20:0)+30*quiz+50*srs)),quizReady:keys.filter(k=>(e[k]?.quizStreak||0)>=2).length,srsReady:keys.filter(k=>(e[k]?.srsPasses||[]).length>=3).length};
}
function apply(state,event){
 const next=JSON.parse(JSON.stringify(state||{})),e=next.evidence||(next.evidence={}),r=e[event.key]||(e[event.key]={quizStreak:0,srsPasses:[]});
 if(!['quiz','srs'].includes(event.kind)||typeof event.correct!=='boolean'||!Number.isFinite(event.time))return next;
 if(event.kind==='quiz'){r.quizStreak=event.correct?Math.min(2,(r.quizStreak||0)+1):0;r.quizAttempts=(r.quizAttempts||0)+1;r.quizCorrect=(r.quizCorrect||0)+(event.correct?1:0);}
 else if(!event.correct)r.srsPasses=[];
 else{const xs=r.srsPasses||[],last=xs.at(-1);if(last===undefined||event.time-last>=DAY)r.srsPasses=[...xs,event.time].slice(-3);}
 r.last=event.time;next.updatedAt=event.time;return next;
}
const api={score,apply};root.HSKLessonMastery=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
