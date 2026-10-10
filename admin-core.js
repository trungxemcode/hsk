(function(root){
function summarize(items,dictionary,now=Date.now()){
 const index=new Map(dictionary.map(w=>[w.learningKey||`${w.hsk}|${w.han}|${w.pin}`,w])),levels=Array.from({length:6},(_,i)=>({level:i+1,total:0,known:0,unknown:0,tracked:0})),dueDates=[],daily={},wrong=new Map();let attempts=0,errors=0,lastActivity=0;
 for(const w of dictionary)levels[Number(w.hsk)-1].total++;
 for(const [id,item] of Object.entries(items||{})){
  if(item.deleted)continue;const v=item.value;if(!v)continue;
  if(id.startsWith('word:')){const w=index.get(id.slice(5));if(!w||!['known','unknown'].includes(v.status))continue;const l=levels[Number(w.hsk)-1];l.tracked++;l[v.status]++;if(Number.isFinite(v.due))dueDates.push(v.due);lastActivity=Math.max(lastActivity,v.lastReview||0,v.lastMarked||0);if(Number.isFinite(v.firstLearned)&&v.firstLearned>0&&v.firstLearned<=now+86400000){const day=new Date(v.firstLearned+7*3600000).toISOString().slice(0,10);daily[day]=(daily[day]||0)+1;}}
  if(id.startsWith('adaptive:')&&id!=='adaptive:enabled'&&index.has(v.key)&&Number.isFinite(v.attempts)&&Number.isFinite(v.wrong)){attempts+=Math.max(0,v.attempts);errors+=Math.min(Math.max(0,v.wrong),Math.max(0,v.attempts));lastActivity=Math.max(lastActivity,v.last||0);if(v.wrong>0)wrong.set(v.key,(wrong.get(v.key)||0)+v.wrong);}
 }
 return {schema:1,levels,dueDates,attempts,errors,lastActivity,daily:Object.entries(daily).sort().slice(-90).map(([day,count])=>({day,count})),difficult:[...wrong].sort((a,b)=>b[1]-a[1]).slice(0,8).map(([key,count])=>({han:index.get(key).han,level:Number(index.get(key).hsk),count}))};
}
root.HSKAdminCore={summarize};if(typeof module!=='undefined')module.exports=root.HSKAdminCore;
})(typeof globalThis!=='undefined'?globalThis:this);
