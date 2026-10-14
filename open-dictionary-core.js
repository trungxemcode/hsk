(function(root){
 'use strict';
 const KEY='hsk-open-dictionary-srs-v1',DAY=86400000;
 const id=w=>'cedict|'+w.han+'|'+w.trad+'|'+w.pin;
 const fold=s=>String(s||'').toLowerCase().replace(/u:|ü|ǖ|ǘ|ǚ|ǜ/g,'v').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[1-5]/g,'').replace(/[^a-zv]/g,'');
 function valid(x){return !!x&&x.word&&['han','trad','pin','mean'].every(k=>typeof x.word[k]==='string'&&x.word[k].length>0&&x.word[k].length<8000)&&Number.isFinite(x.due)&&Number.isFinite(x.interval)&&x.interval>=0&&Number.isFinite(x.ease)&&x.ease>=1.3&&Number.isInteger(x.reps)&&x.reps>=0;}
 function clean(value){const items={};for(const [k,x] of Object.entries(value?.items||{}))if(valid(x)&&k===id(x.word))items[k]=x;return items;}
 function add(items,word,now=Date.now()){const key=id(word);return items[key]?items:{...items,[key]:{word:{han:word.han,trad:word.trad,pin:word.pin,mean:word.meanVi||word.mean,meanLanguage:word.meanVi||word.native?'vi':'unknown',sourceMean:word.sourceMean||word.mean},due:now,interval:0,ease:2.5,reps:0,lapses:0}};}
 function rate(old,rating,now=Date.now()){
  if(!valid(old)||!['again','hard','good','easy'].includes(rating))throw Error('Invalid review');
  let {ease,reps,interval}=old,lapses=old.lapses||0;
  if(rating==='again'){interval=10/1440;ease=Math.max(1.3,ease-.2);reps=0;lapses++;}
  else if(rating==='hard'){interval=Math.max(1,interval*1.2);ease=Math.max(1.3,ease-.15);reps++;}
  else if(rating==='easy'){interval=reps===0?4:Math.max(4,interval*ease*1.3);ease=Math.min(3.5,ease+.15);reps++;}
  else{interval=reps===0?1:reps===1?3:Math.max(1,interval*ease);reps++;}
  return {...old,ease,reps,interval,lapses,lastReview:now,due:now+Math.round(interval*DAY)};
 }
 function matches(row,q){q=q.trim();if(/^[\p{Script=Han}]+$/u.test(q))return row[0]===q||row[1]===q;return row[0]===q||row[1]===q||fold(row[2])===fold(q)&&!!fold(q)||row[3].some(s=>s.toLowerCase().includes(q.toLowerCase()));}
 function near(a,b){if(Math.abs(a.length-b.length)>1)return false;let i=0,j=0,n=0;while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue;}if(++n>1)return false;if(a.length>=b.length)i++;if(b.length>=a.length)j++;}return n+(i<a.length||j<b.length?1:0)<=1;}
 function score(row,q){q=q.trim();if(!q)return 0;const [han,trad,pin,mean]=row;
  if(han===q||trad===q)return 150;
  if(/\p{Script=Han}/u.test(q)){if(han.startsWith(q)||trad.startsWith(q))return 130;if(han.includes(q)||trad.includes(q))return 115;return q.length>=2&&(near(han,q)||near(trad,q))?60:0;}
  const p=fold(pin),f=fold(q);if(f&&p===f)return 145;
  const english=mean.join('; ').toLowerCase(),query=q.toLowerCase();if(mean.some(s=>s.toLowerCase()===query))return 140;
  if(english.includes(query))return 110;
  if(query.split(/\s+/).length>1&&query.split(/\s+/).every(t=>english.includes(t)))return 85;
  if(f.length>=2&&p.startsWith(f))return 100;if(f.length>=3&&p.includes(f))return 80;
  if(f.length>=4&&near(p,f))return 55;
  return query.length>=4&&english.split(/[^a-z]+/).some(t=>near(t,query))?45:0;
 }
 const vietnamese=q=>/[đĐ]|[\u0302\u0306\u0309\u031b\u0323]/.test(String(q).normalize('NFD'));
 function translationKey(w){let h=2166136261;for(const c of w.sourceMean||w.mean||''){h^=c.codePointAt(0);h=Math.imul(h,16777619);}return id(w)+'|'+(h>>>0).toString(16);}
 const api={KEY,id,fold,valid,clean,add,rate,matches,near,score,vietnamese,translationKey};root.HSKOpenDictionaryCore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
