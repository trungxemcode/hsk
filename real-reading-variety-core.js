/* Real-reading novelty scheduler. Pure JS: no network, localStorage, AI calls, mastery writes. */
(function(root){
  'use strict';
  const VERSION=1;
  const HISTORY_KEY='hsk-real-reading-history-v1';
  const MAX_HISTORY=400;
  const TOPICS=['ăn uống','giao thông','công việc','gia đình','mua sắm','trường học','du lịch','công nghệ','sức khỏe','bạn bè'];
  const ANGLES=['hỏi đáp','giải quyết vấn đề','so sánh lựa chọn','hiểu lầm nhỏ','chia sẻ kinh nghiệm','thay đổi kế hoạch','tình huống bất ngờ','kể lại một ngày'];
  const ntext=value=>String(value??'').normalize('NFKC').trim();
  const clean=value=>ntext(value).toLowerCase().replace(/[\s\u3000，。！？；：、,.!?;:'"“”‘’()（）\[\]{}]/gu,'');
  function canonicalUrl(value){
    try{
      const u=new URL(ntext(value));
      if(u.protocol!=='https:'||u.username||u.password||u.port&&u.port!=='443')return '';
      u.hash='';
      u.hostname=u.hostname.toLowerCase().replace(/^www\./,'');
      for(const key of [...u.searchParams.keys()])if(/^utm_|^(fbclid|gclid|igshid|mkt_tok|ref_src)$/i.test(key))u.searchParams.delete(key);
      u.searchParams.sort();
      u.pathname=u.pathname.replace(/\/+$/,'')||'/';
      return u.toString();
    }catch{return ''}
  }
  function storyText(item){
    const lines=Array.isArray(item?.scriptMode)&&item.scriptMode.length?item.scriptMode: item?.paragraphMode||[];
    return clean(lines.map(x=>x.hanzi||x.cn||'').join(''));
  }
  function hash(value){
    let h=2166136261;
    for(const char of String(value)){h^=char.codePointAt(0);h=Math.imul(h,16777619);}
    return (h>>>0).toString(36);
  }
  function fingerprint(item){return hash(storyText(item));}
  function grams(value){
    const s=clean(value).slice(0,650),n=2,out=new Set();
    for(let i=0;i<s.length-n+1;i++)out.add(s.slice(i,i+n));
    return out;
  }
  function similarity(a,b){
    const A=grams(a),B=grams(b);
    if(!A.size||!B.size)return 0;
    let intersection=0;for(const x of A)if(B.has(x))intersection++;
    return intersection/(A.size+B.size-intersection);
  }
  function sourceKey(item){
    return ntext(item?.source?.id||item?.sourceId)||canonicalUrl(item?.source?.url||item?.sourceUrl||'');
  }
  function historyEntries(history){return Array.isArray(history)?history:Array.isArray(history?.entries)?history.entries:[];}
  function eligible(item,level,lessonId){
    if(!item||!Number.isInteger(item.hsk)||item.hsk!==level)return false;
    if(lessonId&&item.lessonId!==lessonId)return false;
    return Boolean(ntext(item.id)&&storyText(item).length>=6);
  }
  function randomPick(items,weight,rng){
    const weights=items.map(x=>Math.max(0.001,weight(x))),sum=weights.reduce((a,b)=>a+b,0);
    let roll=Math.max(0,Math.min(.999999999,Number(rng()))) * sum;
    for(let i=0;i<items.length;i++){roll-=weights[i];if(roll<0)return items[i];}
    return items[items.length-1];
  }
  function recent(history,count=6){return historyEntries(history).slice().sort((a,b)=>(b.lastOpenedAt||0)-(a.lastOpenedAt||0)).slice(0,count);}
  function nextCached(catalog,history,scope,rng=Math.random){
    const {hsk,lessonId=null}=scope;
    if(!Number.isInteger(hsk)||hsk<1||hsk>6)throw RangeError('HSK must be 1-6');
    const past=historyEntries(history),seenIds=new Set(past.map(x=>String(x.id)));
    const shownTexts=past.map(x=>x.sample||'').filter(Boolean);
    const seenSources=new Set(past.map(x=>x.sourceKey).filter(Boolean));
    const latest=recent(history);
    const offered=[];
    for(const item of catalog||[]){
      if(!eligible(item,hsk,lessonId)||seenIds.has(String(item.id)))continue;
      const text=storyText(item);
      if(shownTexts.some(s=>similarity(s,text)>=.76))continue;
      offered.push(item);
    }
    if(!offered.length)return {kind:'needs-generation',reason:'no-unread-article',hsk,lessonId};
    const hasUnseenSources=offered.some(x=>!seenSources.has(sourceKey(x)));
    const preferred=hasUnseenSources?offered.filter(x=>!seenSources.has(sourceKey(x))):offered;
    const choice=randomPick(preferred,item=>{
      const topic=ntext(item.topic),last=latest.filter(x=>x.topic===topic).length;
      const source=sourceKey(item),recentSameSource=latest.some(x=>x.sourceKey===source);
      return 1/(1+last*1.8+(recentSameSource?3:0));
    },rng);
    return {kind:'cached',item:choice,hsk,lessonId,unreadCount:offered.length};
  }
  function nextGeneration(sources,history,scope,rng=Math.random){
    const {hsk,lessonId=null,topics=TOPICS}=scope;
    if(!Number.isInteger(hsk)||hsk<1||hsk>6)throw RangeError('HSK must be 1-6');
    const items=(sources||[]).filter(x=>{
      const lo=Number(x.hskMin||1),hi=Number(x.hskMax||6);
      return lo<=hsk&&hsk<=hi&&Boolean(sourceKey(x))&&x.active!==false;
    });
    if(!items.length)return {kind:'source-required',hsk,lessonId,message:'Không tìm thấy nguồn phù hợp. Cần bổ sung bài báo hoặc đường dẫn thật.'};
    const past=historyEntries(history),last=recent(history,8);
    const topicsClean=[...new Set((topics||TOPICS).map(ntext).filter(Boolean))];
    const sourceWeight=src=>{
      const key=sourceKey(src),count=past.filter(x=>x.sourceKey===key).length;
      const newest=last.some(x=>x.sourceKey===key)?3:0;
      return 1/(1+count*2+newest);
    };
    const choices=items.map(src=>{
      const source=sourceKey(src),combinations=[];
      for(const t of topicsClean.length?topicsClean:TOPICS)for(const angle of ANGLES){
        const key=hash(source+'|'+hsk+'|'+(lessonId||'')+'|'+t+'|'+angle);
        if(!past.some(x=>x.variantKey===key))combinations.push({topic:t,angle,variantKey:key});
      }
      return {src,combinations};
    }).filter(x=>x.combinations.length>0);
    if(!choices.length)return {kind:'source-required',hsk,lessonId,message:'Đã hết các góc nhìn mới. Hãy bổ sung bài báo hoặc nguồn truyện khác.'};
    const {src,combinations}=randomPick(choices,x=>sourceWeight(x.src),rng);
    const pick=randomPick(combinations,x=>1/(1+last.filter(y=>y.topic===x.topic).length*2+last.filter(y=>y.angle===x.angle).length*1.5),rng);
    return {kind:'generate',source:src,hsk,lessonId,topic:pick.topic,angle:pick.angle,variantKey:pick.variantKey,
      constraints:{minScriptLines:hsk<=2?4:hsk<=4?6:8,avoidTitles:last.map(x=>x.title).filter(Boolean).slice(0,8),
        avoidRecentSourceKeys:last.map(x=>x.sourceKey).filter(Boolean).slice(0,8),doNotInventSource:true,
        distinguishAdaptationFromQuotation:true}};
  }
  function next(catalog,sources,history,scope,rng=Math.random){
    const result=nextCached(catalog,history,scope,rng);
    return result.kind==='cached'?result:nextGeneration(sources,history,scope,rng);
  }
  function isNovel(item,history){
    const past=historyEntries(history),current=storyText(item),id=ntext(item?.id);
    if(current.length<6||!id)return {ok:false,reason:'invalid-content'};
    if(past.some(x=>String(x.id)===id))return {ok:false,reason:'already-opened'};
    if(past.some(x=>x.sample&&similarity(x.sample,current)>=.76))return {ok:false,reason:'near-duplicate'};
    return {ok:true,reason:'new'};
  }
  function record(history,item,{now=Date.now(),completed=false}={}){
    const id=ntext(item?.id);
    if(!id||!storyText(item))throw Error('Cannot track a reading without content');
    const entries=historyEntries(history).map(x=>({...x})),index=entries.findIndex(x=>String(x.id)===id);
    const entry={id,hsk:item.hsk,lessonId:item.lessonId||null,title:ntext(item.titleZh||item.titleVi||'').slice(0,140),
      topic:ntext(item.topic).slice(0,80),angle:ntext(item.angle).slice(0,80),sourceKey:sourceKey(item),
      variantKey:ntext(item.variantKey),fingerprint:fingerprint(item),sample:storyText(item).slice(0,320),
      lastOpenedAt:now,openedCount:1,completedCount:completed?1:0,lastCompletedAt:completed?now:null};
    if(index>=0){
      const old=entries.splice(index,1)[0];
      entry.openedCount=(Number(old.openedCount)||0)+(completed?0:1);
      entry.completedCount=(Number(old.completedCount)||0)+(completed?1:0);
      entry.lastCompletedAt=completed?now:old.lastCompletedAt||null;
    }
    entries.push(entry);
    entries.sort((a,b)=>(a.lastOpenedAt||0)-(b.lastOpenedAt||0));
    return {version:VERSION,entries:entries.slice(-MAX_HISTORY)};
  }
  function stats(history,scope){
    const entries=historyEntries(history).filter(e=>e.hsk===scope.hsk&&(!scope.lessonId||e.lessonId===scope.lessonId));
    return {opened:entries.length,completed:entries.filter(e=>e.completedCount>0).length,
      topics:new Set(entries.map(e=>e.topic).filter(Boolean)).size,
      sources:new Set(entries.map(e=>e.sourceKey).filter(Boolean)).size};
  }
  const api={VERSION,HISTORY_KEY,MAX_HISTORY,TOPICS,ANGLES,canonicalUrl,storyText,hash,fingerprint,similarity,
    sourceKey,nextCached,nextGeneration,next,isNovel,record,stats};
  root.HSKRealReadingVariety=api;
  if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis==='object'?globalThis:this);
