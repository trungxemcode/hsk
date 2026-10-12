/* Local shape matcher. Experimental suggestions; the user always confirms the character. */
(function(root){
 'use strict';
 const SIZE=32,CELLS=SIZE*SIZE,DIAGONAL=Math.SQRT2;
 function rasterize(strokes){
  const points=strokes.flat();
  if(!points.length)return null;
  let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;
  for(const [x,y] of points){if(!Number.isFinite(x)||!Number.isFinite(y))return null;left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
  const span=Math.max(right-left,bottom-top);if(span<=0)return null;
  const scaleX=(SIZE-5)/(right-left||span),scaleY=(SIZE-5)/(bottom-top||span),offsetX=(SIZE-1-(right-left)*scaleX)/2,offsetY=(SIZE-1-(bottom-top)*scaleY)/2;
  const bitmap=new Uint8Array(CELLS);
  function paint(x,y){const xx=Math.max(0,Math.min(SIZE-1,Math.round(x))),yy=Math.max(0,Math.min(SIZE-1,Math.round(y)));bitmap[yy*SIZE+xx]=1;}
  for(const stroke of strokes){
   if(!stroke.length)continue;
   let previous=null;
   for(const p of stroke){
    const next=[(p[0]-left)*scaleX+offsetX,(p[1]-top)*scaleY+offsetY];
    if(previous){const [a,b]=previous[0]<next[0]||previous[0]===next[0]&&previous[1]<=next[1]?[previous,next]:[next,previous];const steps=Math.max(1,Math.ceil(Math.max(Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1]))*3));for(let n=0;n<=steps;n++)paint(a[0]+(b[0]-a[0])*n/steps,a[1]+(b[1]-a[1])*n/steps);}
    else paint(...next);
    previous=next;
   }
  }
  return bitmap;
 }
 function distance(bitmap){
  const values=new Float32Array(CELLS);for(let i=0;i<CELLS;i++)values[i]=bitmap[i]?0:100;
  for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
   const i=y*SIZE+x;let d=values[i];
   if(x)d=Math.min(d,values[i-1]+1);
   if(y){d=Math.min(d,values[i-SIZE]+1);if(x)d=Math.min(d,values[i-SIZE-1]+DIAGONAL);if(x<SIZE-1)d=Math.min(d,values[i-SIZE+1]+DIAGONAL);}values[i]=d;
  }
  for(let y=SIZE-1;y>=0;y--)for(let x=SIZE-1;x>=0;x--){
   const i=y*SIZE+x;let d=values[i];
   if(x<SIZE-1)d=Math.min(d,values[i+1]+1);
   if(y<SIZE-1){d=Math.min(d,values[i+SIZE]+1);if(x)d=Math.min(d,values[i+SIZE-1]+DIAGONAL);if(x<SIZE-1)d=Math.min(d,values[i+SIZE+1]+DIAGONAL);}values[i]=d;
  }
  return values;
 }
 function fromBitmap(character,bitmap,source='base'){if(!bitmap||bitmap.length!==CELLS)return null;const ink=[];for(let i=0;i<CELLS;i++)if(bitmap[i])ink.push(i);if(ink.length<4)return null;return {character,source,ink,distances:distance(bitmap)};}
 function template(character,strokes){const bitmap=rasterize(strokes);return fromBitmap(character,bitmap);}
 function prepare(data){if(data.version!==1||data.characters.length!==data.samples.length)throw Error('Dữ liệu mẫu chữ không hợp lệ.');return Array.from(data.characters,(character,i)=>template(character,data.samples[i])).filter(Boolean);}
 function shapeScore(query,candidate){
  let a=0,b=0;for(const i of query.ink)a+=candidate.distances[i]**2;for(const i of candidate.ink)b+=query.distances[i]**2;
  return a/query.ink.length+b/candidate.ink.length+4*Math.abs(Math.log(query.ink.length/candidate.ink.length));
 }
 function recognize(strokes,templates,limit=10){
  const query=template('',strokes);if(!query||query.ink.length<4)return [];
  // Conflicting labels for identical personal bitmaps provide no reliable evidence.
  const labels=new Map();for(const candidate of templates)if(candidate.source==='personal'){
   const key=candidate.ink.join(','),set=labels.get(key)||new Set();set.add(candidate.character);labels.set(key,set);
  }
  const scores=new Map();for(const candidate of templates){
   const score=shapeScore(query,candidate);
   const group=scores.get(candidate.character)||{base:Infinity,personal:[]};
   if(candidate.source==='personal'){
    const key=candidate.ink.join(',');
    if(labels.get(key).size===1&&!group.personal.some(item=>item.key===key))group.personal.push({score,candidate,key});
   }else group.base=Math.min(group.base,score);
   scores.set(candidate.character,group);
  }
  const ranked=Array.from(scores,([character,group])=>{
   let score=group.base;
   if(group.personal.length&&Number.isFinite(group.base)){
    const personal=group.personal.sort((a,b)=>a.score-b.score),nearest=personal[0];
    // A saved shape can be recalled immediately when nearly identical. Generalize
    // only with a distinct nearby confirmed sample; unrelated styles are not averaged.
    const supported=personal.slice(1).some(item=>item.score<=3&&shapeScore(nearest.candidate,item.candidate)<=3);
    if(nearest.score<=.35||supported&&nearest.score<=3){
     const residual=supported?.15:.35;
     score=Math.min(score,nearest.score+group.base*residual);
    }
   }
   return {character,score};
  }).sort((a,b)=>a.score-b.score||a.character.codePointAt(0)-b.character.codePointAt(0));
  return ranked.slice(0,Math.max(0,Math.min(10,limit)));
 }
 const api={SIZE,rasterize,distance,fromBitmap,prepare,recognize};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.HSKHandwritingCore=api;
})(typeof self==='object'?self:globalThis);
