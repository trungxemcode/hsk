(function(root){'use strict';
const skills=['Nghe','Đọc','Viết','Từ vựng','Ngữ pháp'];
const scenes={book:'Người đọc sách',water:'Người uống nước',rice:'Người ăn cơm',sleep:'Người ngủ',doctor:'Bác sĩ',bike:'Người đi xe đạp'};
function optionText(q,value){return q.images?(scenes[value]||String(value||'')):String(value||'');}
function answer(q,value){if(q.tokens&&Array.isArray(value))return value.map(i=>q.tokens[i]||'').join('');if(q.options&&Number.isInteger(value))return optionText(q,q.options[value]);return typeof value==='object'?String(value?.text||''):String(value??'');}
function sample(q,value,correct,meta={}){return {id:String(meta.id||q.id),hsk:Number(meta.hsk||q.level),lesson:meta.lesson||'',learnerTitle:typeof value==='object'?String(value?.title||'').slice(0,200):'',sourceTitle:String(q.title||'').slice(0,200),skill:skills.includes(meta.skill||q.skill)?meta.skill||q.skill:'Ngữ pháp',prompt:String(q.prompt||'').slice(0,1200),source:String(q.passage||q.audio||'').slice(0,2500),answer:answer(q,value).slice(0,3000),expected:String(q.tokens?q.accepted?.[0]:q.options?q.options[q.answer]:q.answer||'').slice(0,1200),explanation:String(q.explanation||'').slice(0,1000),keywords:(q.keywords||[]).slice(0,8),pattern:q.pattern||'',rubric:(q.rubric||[]).slice(0,6),points:(q.points||[]).slice(0,8),model:String(q.model||q.models?.join(' ')||'').slice(0,2500),target:q.target||null,scene:q.scene||null,correct:typeof correct==='boolean'?correct:null,writing:q.format==='writing'||meta.writing===true,time:Date.now()};}
function stats(samples){return skills.map(skill=>{const rows=samples.filter(s=>s.skill===skill&&!s.writing&&typeof s.correct==='boolean');return {skill,attempts:rows.length,correct:rows.filter(s=>s.correct).length,distinct:new Set(rows.map(s=>s.id)).size};}).filter(x=>x.attempts);}
function parse(text,samples){
 if(typeof text!=='string'||!text.trim()||text.length>5000)throw Error('AI chưa trả nhận xét đầy đủ. Hãy thử lại.');
 const cleaned=text.trim().replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,'');let r;
 const candidates=[cleaned],fence=text.match(/```(?:json)?\s*([\s\S]*?)```/i);if(fence)candidates.push(fence[1]);const first=cleaned.indexOf('{'),last=cleaned.lastIndexOf('}');if(first>=0&&last>first)candidates.push(cleaned.slice(first,last+1));
 for(const candidate of candidates){try{r=JSON.parse(candidate);break;}catch{}}
 if(typeof r==='string')return parse(r,samples);
 if(r&&typeof r.answer==='string'&&!r.summary)return parse(r.answer,samples);
 if(r===undefined){if(/^[{\[]/.test(cleaned)||/"summary"\s*:/.test(cleaned))throw Error('AI chưa trả nhận xét đúng định dạng. Hãy thử lại.');return {summary:cleaned,score:null,weaknesses:[],corrections:[],format:'text'};}
 if(r&&typeof r==='object'&&!Array.isArray(r))r={score:null,weaknesses:[],corrections:[],...r};
const str=(v,n)=>typeof v==='string'&&v.trim()&&v.length<=n,ids=new Map(samples.map(s=>[s.id,s]));
if(!r||!str(r.summary,900)||!Array.isArray(r.weaknesses)||r.weaknesses.length>3||!Array.isArray(r.corrections)||r.corrections.length>3||!(r.score===null||Number.isFinite(r.score)&&r.score>=0&&r.score<=10))throw Error('Nhận xét AI chưa hợp lệ. Hãy thử lại.');
for(const w of r.weaknesses)if(!skills.includes(w.skill)||!ids.has(w.id)||!str(w.evidence,400)||!str(w.advice,500))throw Error('AI chưa dẫn chứng được điểm cần cải thiện. Hãy thử lại.');
for(const c of r.corrections)if(!ids.has(c.id)||!str(c.original,500)||!ids.get(c.id).answer.includes(c.original)||!str(c.corrected,700)||!str(c.why,500))throw Error('AI chưa trích đúng câu trả lời để sửa. Hãy thử lại.');
if(!samples.some(s=>s.writing))r.score=null;
return {summary:r.summary,score:r.score,weaknesses:r.weaknesses,corrections:r.corrections};}
function contextualSample(q,value,correct,meta){const row=sample(q,value,correct,meta);row.type=q.type||q.format||'';row.imageOnly=q.imageOnly===true;row.sourceRef=q.sourceRef?{code:q.sourceRef.code,number:q.sourceRef.number}:undefined;if(q.images){row.expected=optionText(q,q.options[q.answer]);row.options=q.options.map(v=>optionText(q,v));}return row;}
const api={skills,answer,sample:contextualSample,stats,parse};root.HSKAICoachCore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
