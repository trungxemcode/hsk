/* Pure practice generators: reuse actual HSK dictionary + checked sentence examples. */
(function(root){
 'use strict';
 const shuffled=(items,rng=Math.random)=>{const a=items.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 const text=v=>String(v??'').trim();
 const compact=v=>text(v).replace(/[\s\u3000。，！？!?；;：:,、.“”‘’（）()\[\]{}]/gu,'');
 function triples(words,level=3,count=10,rng=Math.random){
  const found=[],han=new Set(),pin=new Set(),mean=new Set();
  const list=shuffled((words||[]).filter(w=>level==='all'||Number(w.hsk)===Number(level)),rng);
  for(const w of list){
   const h=text(w.han),p=text(w.pin),m=text(w.mean);
   if(!h||!p||!m||h.length>12||m.length>85||han.has(h)||pin.has(p.toLowerCase())||mean.has(m.toLowerCase()))continue;
   const id=found.length;
   found.push({id,han:h,pin:p,mean:m});
   han.add(h);pin.add(p.toLowerCase());mean.add(m.toLowerCase());
   if(found.length===count)break;
  }
  return found;
 }
 function segments(sentence){
  const input=text(sentence).replace(/[\s\u3000]+/g,'');
  if(!/\p{Script=Han}/u.test(input))return [];
  const tokenizer=typeof Intl!=='undefined'&&Intl.Segmenter?new Intl.Segmenter('zh',{granularity:'word'}):null;
   const initial=(tokenizer?[...tokenizer.segment(input)].map(x=>x.segment):Array.from(input))
     .map(x=>x.replace(/[^\p{Script=Han}0-9]/gu,'')).filter(Boolean);
   const raw=[];
   for(const token of initial){
     // Intl.Segmenter may join a subject with 把/被 ("我把"). Keep the
     // construction marker visible as its own grammatical tile.
     const marker=token.search(/[把被]/u);
     if(marker>0){raw.push(token.slice(0,marker),token.slice(marker));}
     else if(marker===0&&token.length>1)raw.push(token[0],token.slice(1));
     else raw.push(token);
   }
   // Keep aspect particles and common result/directional complements with the verb.
   // This makes a reorder task test a teachable chunk (看完了), not an isolated 了 tile.
   const attachToPrevious=new Set(['了','着','过','得','地','的','们','完','好','懂','到','见','清楚','错','上','里','中','下','前','后','边','面','起来','出来','下去','上来','过去','回来','进去','进来']);
   const merged=[];
   for(const token of raw){
     const previous=merged[merged.length-1];
     if(previous&&attachToPrevious.has(token)&&previous.length<=4)merged[merged.length-1]=previous+token;
     else merged.push(token);
   }
   return merged;
 }
 function sentences(words,level=3,count=10,rng=Math.random){
  const candidates=[],seen=new Set(),entries=shuffled((words||[]).filter(w=>level==='all'||Number(w.hsk)===Number(level)),rng);
  for(const w of entries){
   for(const e of shuffled(w.practice?.examples||[],rng)){
    const cn=text(e.cn),pin=text(e.pin),vi=text(e.vi);
    const normalized=compact(cn);
    if(!cn||!pin||!vi||!(/^[\p{Script=Han}0-9\s\u3000。，！？!?；;：:,、.“”‘’（）()]+$/u.test(cn)))continue;
    if(normalized.length<4||normalized.length>23||seen.has(normalized)||vi.length>200)continue;
    let tokens=segments(cn);
    // Segmenter sometimes joins very short phrases into only 2–3 pieces; use character tiles instead.
    if(tokens.length<4&&normalized.length>=4)tokens=Array.from(normalized);
    if(tokens.length<4||tokens.length>15||tokens.join('')!==normalized)continue;
    const question={id:candidates.length,cn,pin,vi,tokens,answer:normalized,hsk:Number(w.hsk)};
    candidates.push(question);seen.add(normalized);
    if(candidates.length>=count)return candidates;
   }
  }
  return candidates;
 }
 function gradeTriplet(items,ids){
  if(!Array.isArray(ids)||ids.length!==3||ids.some(x=>!Number.isInteger(x)))return false;
  return ids.every(x=>x===ids[0]&&items.some(item=>item.id===x));
 }
 function gradeSentence(question,indices){
  if(!question||!Array.isArray(indices)||indices.length!==question.tokens.length||new Set(indices).size!==indices.length)return false;
  if(indices.some(x=>!Number.isInteger(x)||x<0||x>=question.tokens.length))return false;
  return indices.map(i=>question.tokens[i]).join('')===question.answer;
 }
 const api={shuffled,triples,segments,sentences,gradeTriplet,gradeSentence,compact};
 root.HSKPracticeGamesCore=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis==='object'?globalThis:this);
