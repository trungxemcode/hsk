/* Privacy-safe learning snapshot and the 99% mastery boundary for AI Q&A. */
(function(root){'use strict';
 const DAY=86400000;
 const MASTERY_BOUNDARY=Object.freeze({accuracy:.99,minAttempts:20,windowDays:30,minActiveDays:3,maxRepeatedMistakes:0});
 const read=(store,key,fallback)=>{try{const value=JSON.parse(store?.getItem(key)||'null');return value??fallback;}catch{return fallback;}};
 const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
 function aggregateAdaptiveStats(raw={},now=Date.now()){
  const rows=Object.values(raw?.stats||{}).filter(x=>x&&Number.isFinite(Number(x.attempts))&&Number(x.attempts)>=0&&Number.isFinite(Number(x.wrong))&&Number(x.wrong)>=0&&Number(x.wrong)<=Number(x.attempts));
  const recent=rows.filter(x=>!x.last||now-Number(x.last)<=MASTERY_BOUNDARY.windowDays*DAY);
  const source=recent.length?recent:rows;
  const attempts=source.reduce((n,x)=>n+Number(x.attempts),0),wrong=source.reduce((n,x)=>n+Number(x.wrong),0),correct=Math.max(0,attempts-wrong);
  const activeDays=new Set(source.map(x=>x.last?new Date(Number(x.last)+7*3600000).toISOString().slice(0,10):'').filter(Boolean)).size;
  const byKey=new Map();for(const row of source){const key=String(row.key||'').trim();if(!key)continue;const item=byKey.get(key)||{key,attempts:0,wrong:0,last:0};item.attempts+=Number(row.attempts);item.wrong+=Number(row.wrong);item.last=Math.max(item.last,Number(row.last)||0);byKey.set(key,item);}
  return {attempts,correct,wrong,accuracy:attempts?correct/attempts:null,activeDays,recentRows:source.length,weakest:[...byKey.values()].filter(x=>x.wrong>0).sort((a,b)=>b.wrong-a.wrong||b.last-a.last).slice(0,5).map(x=>({key:x.key,attempts:x.attempts,wrong:x.wrong,accuracy:x.attempts?Math.max(0,(x.attempts-x.wrong)/x.attempts):null}))};
 }
 function masteryBoundary({practice={},profile={},vocabulary={},activity={}}={}){
  const reasons=[],accuracy=Number.isFinite(practice.accuracy)?practice.accuracy:null,attempts=Number(practice.attempts)||0,activeDays=Math.max(Number(practice.activeDays)||0,Number(activity.studyDaysLast30)||0),repeatedMistakes=practice.weakest?.filter(x=>x.wrong>=3).length||0;
  if(attempts<MASTERY_BOUNDARY.minAttempts)reasons.push(`cần ít nhất ${MASTERY_BOUNDARY.minAttempts} lượt có đáp án`);
  if(accuracy===null||accuracy<MASTERY_BOUNDARY.accuracy)reasons.push('độ chính xác chưa đạt 99% trên cửa sổ gần đây');
  if(activeDays<MASTERY_BOUNDARY.minActiveDays)reasons.push(`cần dữ liệu ở ít nhất ${MASTERY_BOUNDARY.minActiveDays} ngày`);
  if(repeatedMistakes>MASTERY_BOUNDARY.maxRepeatedMistakes)reasons.push('vẫn còn lỗi lặp lại có bằng chứng');
  const reached=!reasons.length;
  const near=!reached&&attempts>=10&&accuracy!==null&&accuracy>=.95;
  return {reached,near,accuracy,attempts,activeDays,repeatedMistakes,reasons:reasons.slice(0,4),threshold:{...MASTERY_BOUNDARY},directive:reached?'Đã đủ bằng chứng để chuyển sang nội dung mới; không bới lỗi vụn vặt.':near?'Gần đạt; chỉ sửa lỗi có ảnh hưởng rõ ràng hoặc lặp lại, không giữ người học ở mức vi chỉnh.':'Tiếp tục thu thập bằng chứng trước khi kết luận.'};
 }
 function buildLearningSnapshot({store=typeof root.localStorage==='object'?root.localStorage:null,profile=null,activity=null,plan=null,dictionary=typeof root.words!=='undefined'?root.words:[],now=Date.now()}={}){
  const owner=String(profile?.uid||read(store,'hsk-account-meta-v1',{})?.uid||'guest').slice(0,150)||'guest';
  const progress=read(store,'hsk-flashcards-progress-v1',{}),words=progress?.words&&typeof progress.words==='object'?progress.words:{};
  const target=Number(plan?.target||read(store,`hsk-studio-target-v1:${owner}`,null)||profile?.targetHsk)||3,level=target>=1&&target<=6?target:3;
  const pool=Array.isArray(dictionary)?dictionary.filter(w=>Number(w?.hsk)===level):[],known=pool.filter(w=>{const key=w.learningKey||`${w.hsk}|${w.han}|${w.pin}`;return words[key]?.status==='known';}).length;
  const adaptive=aggregateAdaptiveStats(read(store,'hsk-adaptive-learning-v1',{}),now),study=activity||root.HSKStudyStore?.activity?.()||{days:{},hours:Array(24).fill(0)};
  const days=study?.days&&typeof study.days==='object'?study.days:{},cutoff=new Date(now-29*DAY+7*3600000).toISOString().slice(0,10),studyDaysLast30=Object.keys(days).filter(d=>d>=cutoff&&Number(days[d])>0).length;
  let streak=0,cursor=new Date(now+7*3600000).toISOString().slice(0,10);if(!days[cursor])cursor=new Date(now-DAY+7*3600000).toISOString().slice(0,10);while(days[cursor]){streak++;const t=Date.parse(cursor+'T00:00:00Z')-7*3600000-DAY;cursor=new Date(t+7*3600000).toISOString().slice(0,10);if(streak>370)break;}
  const boundary=masteryBoundary({practice:adaptive,profile,activity:{studyDaysLast30},vocabulary:{known,total:pool.length}});
  const mistakes=read(store,'hsk-flashcards-mistakes-v1',{}),entries=Array.isArray(mistakes?.entries)?mistakes.entries:[],open=entries.filter(x=>x&&!x.resolved),topMistakes=open.sort((a,b)=>(Number(b.wrongCount)||0)-(Number(a.wrongCount)||0)).slice(0,5).map(x=>({wrongCount:Number(x.wrongCount)||0,lastWrong:Number(x.lastWrong)||0,direction:String(x.snapshot?.direction||'')}));
  return {version:1,generatedAt:now,targetHsk:level,activity:{studyDaysLast30,streak,hours:Array.isArray(study?.hours)?study.hours.map(x=>Number(x)||0).slice(0,24):[]},vocabulary:{known,total:pool.length,percent:pool.length?Math.round(known*100/pool.length):null},practice:{attempts:adaptive.attempts,correct:adaptive.correct,wrong:adaptive.wrong,accuracy:adaptive.accuracy===null?null:Number(adaptive.accuracy.toFixed(4)),activeDays:adaptive.activeDays},mistakes:{open:open.length,total:entries.length,top:topMistakes},masteryBoundary:boundary,plan:plan?{target:Number(plan.target)||level,minutes:Number(plan.minutes)||0,days:Number(plan.days)||0,remaining:Number(plan.total||0)-Number(plan.paceLearned||0)}:null,coachMastery:root.HSKCoachProfile?.buildMasteryProfilePayload?.(profile,level)||null};
 }
 const api={MASTERY_BOUNDARY,aggregateAdaptiveStats,masteryBoundary,buildLearningSnapshot};root.HSKAIQACore=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='object'?window:globalThis);
