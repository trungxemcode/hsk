/* Goal planning rules are independent of learning stores and AI availability. */
(function(root){'use strict';
const DAY=86400000,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function date(t){return new Date(t+7*3600000).toISOString().slice(0,10);}
function slots(start,end,days){let n=0;for(let t=start;t<end;t+=DAY){const d=new Date(t+7*3600000).getUTCDay();if(d!==0||days===7){if(days!==5||d!==6)n++;}}return Math.max(1,n);}
function choices({remaining,lessons=0,basis=1,target=5,budget=180,days=6},now=Date.now()){
 const work=remaining*5+lessons*35,base=[['fast','Tăng tốc',30,180,30],['balanced','Cân bằng',90,90,20],['relaxed','Thư thả',150,45,10]];
 return base.map(([id,label,floor,minutes,cap])=>{minutes=Math.min(budget,minutes);const perDay=Math.max(1,Math.min(cap,Math.floor(minutes*.35/2.5))),foundation=basis<target-1?1.4:1,needed=Math.max(Math.ceil(remaining/perDay*7/days*foundation)+14,Math.ceil(work/minutes*7/days*foundation)),duration=Math.max(floor,needed);return {id,label,minutes,perDay,duration,end:now+duration*DAY};});
}
function remaining(plan,learned){return Math.max(0,plan.total-new Set(learned).size);}
function quota(plan,learned,now){const left=remaining(plan,learned),n=slots(now,Math.max(now+DAY,plan.end-7*DAY),plan.days);return Math.min(plan.cap,Math.ceil(left/n));}
function assess(plan,now){const start=plan.paceStarted||plan.created,elapsed=(now-start)/DAY;if(elapsed<7)return {kind:'waiting',reason:'Cần ít nhất 7 ngày học để đánh giá nhịp học.'};
 const rows=Object.entries(plan.journal||{}).filter(([d])=>d>=date(now-7*DAY)).map(([,r])=>r),learned=Object.values(plan.journal||{}).flatMap(r=>r.new||[]),actualAll=new Set(learned).size,actual=Math.max(0,actualAll-(plan.paceLearned||0)),expected=Math.min(plan.total-(plan.paceLearned||0),plan.initialQuota*slots(start,now,plan.days)),ratio=expected?actual/expected:1,attempts=rows.reduce((n,r)=>n+(r.attempts||0),0),correct=rows.reduce((n,r)=>n+(r.correct||0),0),recalls=rows.reduce((n,r)=>n+(r.recalls||0),0),remembered=rows.reduce((n,r)=>n+(r.remembered||0),0),seconds=rows.reduce((n,r)=>n+(r.seconds||0),0),activeDays=rows.filter(r=>r.seconds>0).length,accuracy=attempts?correct/attempts:null,retention=recalls?remembered/recalls:null,meanMinutes=activeDays?seconds/60/activeDays:0;
 const stats={ratio,attempts,accuracy,recalls,retention,meanMinutes,actual,expected,remaining:Math.max(0,plan.total-actualAll),daysLeft:Math.max(0,Math.ceil((plan.end-now)/DAY)),minutes:plan.minutes,budget:plan.budget};
 if(expected>0&&(ratio<.8||(attempts>=20&&accuracy<.7)))return {kind:'slow',reason:'Tiến độ hoặc kết quả đang thấp hơn nhịp kế hoạch.',stats};
 if(ratio>=1.2&&attempts>=20&&accuracy>=.9&&recalls>=10&&retention>=.85&&activeDays>=3&&meanMinutes>0&&meanMinutes<=plan.minutes*.85)return {kind:'fast',reason:'Học vượt tiến độ, làm bài tốt và nhớ ở lần ôn cách ngày.',stats};
 return {kind:'steady',reason:'Giữ nhịp hiện tại; cần thêm bằng chứng trước khi tăng tốc.',stats};
}
function alternatives(plan,assessment,now){const s=assessment.stats,left=s?.remaining??plan.total,daysLeft=Math.max(7,Math.ceil((plan.end-now)/DAY)),pace=Math.max(1,(s?.actual||0)/Math.max(1,slots(plan.created,now,plan.days))),extended=Math.max(daysLeft,Math.ceil(left/pace*7/plan.days)+7),required=Math.max(plan.minutes,Math.ceil(plan.minutes*Math.max(1,1/Math.max(.1,s?.ratio||.1))));return {extendEnd:now+extended*DAY,catchupMinutes:required,catchupPossible:required<=plan.budget,fastEnd:now+Math.max(7,Math.ceil(daysLeft*.9))*DAY,fastMinutes:Math.min(plan.budget,Math.ceil(plan.minutes*1.1))};}
const api={DAY,date,slots,choices,remaining,quota,assess,alternatives,clamp};root.HSKPlannerCore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
