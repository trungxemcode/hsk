/* Account-synced study state: independent device contributions, not a shared streak counter. */
(function(root){'use strict';
const KEY='hsk-study-sync-v1',arrays=['new','reviews','lessons'],counts=['seconds','attempts','correct','recalls','remembered'];
const clone=x=>JSON.parse(JSON.stringify(x)),empty=owner=>({version:1,owner:owner||'guest',plan:null,parts:{},activity:{}});
const hash=x=>{let h=2166136261;for(const c of JSON.stringify(x)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0).toString(16);};
function row(x={}){const r={};for(const k of counts)r[k]=Math.max(0,Number.isFinite(x[k])?x[k]:0);for(const k of arrays)r[k]=[...new Set((Array.isArray(x[k])?x[k]:[]).filter(v=>typeof v==='string'))];return r;}
function aggregate(parts){const result={};for(const p of Object.values(parts||{})){if(!p||!/^\d{4}-\d{2}-\d{2}$/.test(p.day))continue;const slot=result[p.day]||(result[p.day]={base:row(),live:row()});const target=p.legacy?slot.base:slot.live,r=row(p.row);for(const k of counts)target[k]=p.legacy?Math.max(target[k],r[k]):target[k]+r[k];for(const k of arrays)target[k]=[...new Set([...target[k],...r[k]])];}return Object.fromEntries(Object.entries(result).map(([d,{base,live}])=>{for(const k of counts)live[k]+=base[k];for(const k of arrays)live[k]=[...new Set([...live[k],...base[k]])];return [d,live];}));}
function plan(state){if(!state.plan)return null;const p=clone(state.plan);p.journal=aggregate(Object.fromEntries(Object.entries(state.parts||{}).filter(([,v])=>v.planId===p.id)));return p;}
const VALID_CUSTOM_SKILLS=['vocab','grammar','reading','listening','writing'];
const VALID_CUSTOM_FOCUS=['vocab_heavy','grammar_heavy','listening_speaking','reading_heavy','balanced'];
const VALID_CUSTOM_STYLES=['spare_time','focused_block','hands_free','bedtime_review','weekend_sprint'];
const VALID_CUSTOM_GOALS=['exam','conversation','reading_comprehension','work_travel'];
const VALID_CUSTOM_FIELDS=['version','id','hsk','focusChoice','minutes','days','style','goal','weights','summaryVi','followUpVi','sessionsDone','updatedAt','aiGenerated','aiProvider','aiModel','learnerContextVi','aiBlueprint','aiLessonDesigns'];
const VALID_AI_ACTIONS=['vocab_cards','vocab_quiz','vocab_srs','grammar_focus','reading_dialogue','passive_listen','guided_auto','practice_mini','practice_check','real_reading','ai_vocab_coach','ai_drill','ai_scenario'];
function validAiWord(word){return Boolean(word&&typeof word==='object'&&!Array.isArray(word)&&['han','pin','mean','mnemonicVi','exampleCn','examplePin','exampleVi'].every(k=>typeof word[k]==='string'&&word[k].length<=300));}
function validAiDrill(drill){return Boolean(drill&&typeof drill==='object'&&!Array.isArray(drill)&&typeof drill.promptVi==='string'&&drill.promptVi.length<=260&&typeof drill.questionCn==='string'&&drill.questionCn.length<=140&&Array.isArray(drill.options)&&drill.options.length===4&&drill.options.every(x=>typeof x==='string'&&x.length<=120)&&new Set(drill.options).size===4&&Number.isInteger(drill.answerIndex)&&drill.answerIndex>=0&&drill.answerIndex<4&&typeof drill.explanationVi==='string'&&drill.explanationVi.length<=300);}
function validAiScenario(scenario){return Boolean(scenario&&typeof scenario==='object'&&!Array.isArray(scenario)&&['contextVi','promptVi','sampleCn','samplePin','sampleVi'].every(k=>typeof scenario[k]==='string'&&scenario[k].length<=260));}
function validAiStep(step){
 if(!step||typeof step!=='object'||Array.isArray(step)||Object.keys(step).some(k=>!['id','skill','action','minutes','titleVi','detailVi','coachTipVi','wordLimit','wordOffset','grammarLimit','focusWords','drills','scenario'].includes(k)))return false;
 if(typeof step.id!=='string'||!step.id.trim()||step.id.length>40||!VALID_CUSTOM_SKILLS.includes(step.skill)||!VALID_AI_ACTIONS.includes(step.action)||!Number.isInteger(step.minutes)||step.minutes<1||step.minutes>90)return false;
 if(typeof step.titleVi!=='string'||!step.titleVi.trim()||step.titleVi.length>140||typeof step.detailVi!=='string'||!step.detailVi.trim()||step.detailVi.length>260||typeof step.coachTipVi!=='string'||!step.coachTipVi.trim()||step.coachTipVi.length>280)return false;
 if(step.wordLimit!==undefined&&(!Number.isInteger(step.wordLimit)||step.wordLimit<1||step.wordLimit>50)||step.wordOffset!==undefined&&(!Number.isInteger(step.wordOffset)||step.wordOffset<0||step.wordOffset>100)||step.grammarLimit!==undefined&&(!Number.isInteger(step.grammarLimit)||step.grammarLimit<1||step.grammarLimit>10))return false;
 if(step.focusWords!==undefined&&(!Array.isArray(step.focusWords)||step.focusWords.length>12||!step.focusWords.every(validAiWord)))return false;
 if(step.drills!==undefined&&(!Array.isArray(step.drills)||step.drills.length>4||!step.drills.every(validAiDrill)))return false;
 if(step.scenario!==undefined&&!validAiScenario(step.scenario))return false;
 if(step.action==='ai_vocab_coach'&&(!Array.isArray(step.focusWords)||!step.focusWords.length))return false;
 if(step.action==='ai_drill'&&(!Array.isArray(step.drills)||step.drills.length<2))return false;
 if(step.action==='ai_scenario'&&!validAiScenario(step.scenario))return false;
 return true;
}
function validAiSessions(sessions){return Array.isArray(sessions)&&sessions.length>=1&&sessions.length<=10&&sessions.every(session=>session&&typeof session==='object'&&!Array.isArray(session)&&typeof session.label==='string'&&session.label.length<=140&&typeof session.goalVi==='string'&&session.goalVi.length<=220&&Number.isInteger(session.minutes)&&session.minutes>=1&&session.minutes<=180&&Array.isArray(session.steps)&&session.steps.length>=1&&session.steps.length<=4&&session.steps.every(validAiStep));}
function validCustomAiFields(v){
 if(v.aiGenerated!==undefined&&typeof v.aiGenerated!=='boolean')return false;
 if(v.aiProvider!==undefined&&(typeof v.aiProvider!=='string'||v.aiProvider.length>40))return false;
 if(v.aiModel!==undefined&&(typeof v.aiModel!=='string'||v.aiModel.length>80))return false;
 if(v.learnerContextVi!==undefined&&(typeof v.learnerContextVi!=='string'||v.learnerContextVi.length>500))return false;
 if(v.aiBlueprint!==undefined&&!validAiSessions(v.aiBlueprint))return false;
 if(v.aiLessonDesigns!==undefined){
  const designs=v.aiLessonDesigns;
  if(!designs||typeof designs!=='object'||Array.isArray(designs))return false;
  const ids=Object.keys(designs);if(ids.length>12)return false;
  for(const id of ids){const design=designs[id];if(!/^[a-zA-Z0-9_-]{1,64}$/.test(id)||!design||typeof design!=='object'||Array.isArray(design)||design.lessonId!==id||typeof design.coachIntroVi!=='string'||!design.coachIntroVi.trim()||design.coachIntroVi.length>500||typeof design.customPrompt!=='string'||design.customPrompt.length>300||typeof design.aiProvider!=='string'||design.aiProvider.length>40||typeof design.aiModel!=='string'||design.aiModel.length>80||!Number.isFinite(design.updatedAt)||!validAiSessions(design.sessions))return false;}
 }
 try{return JSON.stringify(v).length<=200000;}catch{return false;}
}
function validCustom(v){
 if(!v||typeof v!=='object'||Array.isArray(v)||v.version!==1||Object.keys(v).some(k=>!VALID_CUSTOM_FIELDS.includes(k))||!validCustomAiFields(v))return false;
 if(typeof v.id!=='string'||!v.id.trim()||v.id.length>80)return false;
 if(!Number.isInteger(v.hsk)||v.hsk<1||v.hsk>6)return false;
 if(!VALID_CUSTOM_FOCUS.includes(v.focusChoice)||!VALID_CUSTOM_STYLES.includes(v.style)||!VALID_CUSTOM_GOALS.includes(v.goal))return false;
 if(!Number.isInteger(v.minutes)||v.minutes<10||v.minutes>180)return false;
 if(!Number.isInteger(v.days)||v.days<3||v.days>7)return false;
 if(!v.weights||typeof v.weights!=='object'||Array.isArray(v.weights)||Object.keys(v.weights).some(k=>!VALID_CUSTOM_SKILLS.includes(k)))return false;
 if(!VALID_CUSTOM_SKILLS.every(k=>Number.isInteger(v.weights[k])&&v.weights[k]>=5&&v.weights[k]<=70))return false;
 if(VALID_CUSTOM_SKILLS.reduce((n,k)=>n+v.weights[k],0)!==100)return false;
 if(typeof v.summaryVi!=='string'||!v.summaryVi.trim()||v.summaryVi.length>500)return false;
 if(typeof v.followUpVi!=='string'||!v.followUpVi.trim()||v.followUpVi.length>400)return false;
 if(!Number.isFinite(v.updatedAt)||!v.sessionsDone||typeof v.sessionsDone!=='object'||Array.isArray(v.sessionsDone))return false;
 const days=Object.keys(v.sessionsDone);if(days.length>14)return false;
 for(const day of days){const ids=v.sessionsDone[day];if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Array.isArray(ids)||ids.length>60||ids.some(id=>typeof id!=='string'||id.length>80)||new Set(ids).size!==ids.length)return false;}
 return true;
}
function customLesson(state){return validCustom(state?.customLesson)?clone(state.customLesson):null;}
function saveCustomLesson(state,value){const s=clone(state);if(value===null){delete s.customLesson;return s;}if(!validCustom(value))return s;s.customLesson=clone(value);return s;}
function seed(owner,oldPlan,oldActivity,current){const s=current?.owner===owner?clone(current):empty(owner);s.parts=s.parts||{};s.activity=s.activity||{};
 if(current?.owner===owner&&validCustom(current.customLesson))s.customLesson=clone(current.customLesson);else delete s.customLesson;
 if(oldPlan&&oldPlan.version===1&&Array.isArray(oldPlan.keys)&&Number.isFinite(oldPlan.end)){const p=clone(oldPlan);p.id=p.id||'legacy-'+String(p.created||hash(p.keys));const journal=p.journal||{};delete p.journal;if(!s.plan)s.plan=p;for(const [day,r]of Object.entries(journal)){const id='legacy_'+p.id+'_'+day+'_'+hash(r);if(!s.parts[id])s.parts[id]={planId:p.id,day,legacy:true,row:row(r)};}}
 if(oldActivity?.days&&Array.isArray(oldActivity.hours)){const id='legacy_'+hash(oldActivity);if(!s.activity[id])s.activity[id]={legacy:true,days:oldActivity.days,hours:oldActivity.hours};}return s;}
function savePlan(state,value,writer){const s=clone(state),p=clone(value);p.id=p.id||'legacy-'+String(p.created||hash(p.keys));const prior=s.plan?.id===p.id?plan(s)?.journal||{}:{},journal=p.journal||{};delete p.journal;s.plan=p;
 for(const [day,raw]of Object.entries(journal)){const r=row(raw),before=row(prior[day]),id=p.id+'_'+day+'_'+writer,part=s.parts[id]||{planId:p.id,day,legacy:false,row:row()};for(const k of counts)part.row[k]+=Math.max(0,r[k]-before[k]);for(const k of arrays)part.row[k]=[...new Set([...part.row[k],...r[k].filter(v=>!before[k].includes(v))])];s.parts[id]=part;}return s;}
function activity(state){const days={},hours=Array(24).fill(0),baseDays={},baseHours=Array(24).fill(0);for(const p of Object.values(state.activity||{})){if(!p)continue;for(const [d,value]of Object.entries(p.days||{})){const n=value===true?1:value;if(/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(n)&&n>0){if(p.legacy)baseDays[d]=Math.max(baseDays[d]||0,n);else days[d]=(days[d]||0)+n;}}for(let i=0;i<24;i++){const n=Number.isFinite(p.hours?.[i])?Math.max(0,p.hours[i]):0;if(p.legacy)baseHours[i]=Math.max(baseHours[i],n);else hours[i]+=n;}}for(const [d,n]of Object.entries(baseDays))days[d]=(days[d]||0)+n;for(let i=0;i<24;i++)hours[i]+=baseHours[i];return {version:1,days,hours};}
function recordActivity(state,writer,now){const s=clone(state),d=new Date(now+7*3600000).toISOString().slice(0,10),hour=new Date(now+7*3600000).getUTCHours(),id=d+'_'+writer,p=s.activity[id]||{days:{[d]:0},hours:Array(24).fill(0)};p.days[d]++;p.hours[hour]++;s.activity[id]=p;return s;}
function flatten(s){const out={};if(s.plan){const {keys=[],...config}=s.plan;out['study-plan:current']={...config,keyCount:keys.length};for(let i=0;i<keys.length;i+=200)out['study-keys:'+s.plan.id+':'+i/200]=keys.slice(i,i+200);}
 if(validCustom(s.customLesson))out['study-plan:custom-lesson']=clone(s.customLesson);
 for(const [id,p]of Object.entries(s.parts||{})){const r=row(p.row),base={...p,row:{...r}};for(const k of arrays){delete base.row[k];for(let i=0;i<r[k].length;i+=200)out['study-array:'+id+':'+k+':'+i/200]=r[k].slice(i,i+200);}out['study-journal:'+id]=base;}for(const [id,p]of Object.entries(s.activity||{}))out['study-activity:'+id]=p;return out;}
function fromRecords(records,owner){const s=empty(owner),keys=[],chunks=[];for(const [id,v]of Object.entries(records)){if(id==='study-plan:current'){if(v&&v.version===1&&typeof v.id==='string'&&v.target>=1&&v.target<=6&&Number.isFinite(v.end))s.plan=clone(v);}else if(id==='study-plan:custom-lesson'){if(validCustom(v))s.customLesson=clone(v);}else if(id.startsWith('study-keys:'))keys.push([id.slice(11),v]);else if(id.startsWith('study-journal:')){if(v&&typeof v.planId==='string'&&typeof v.day==='string'&&v.row&&typeof v.row==='object')s.parts[id.slice(14)]=clone(v);}else if(id.startsWith('study-array:'))chunks.push([id.slice(12),v]);else if(id.startsWith('study-activity:'))s.activity[id.slice(15)]=clone(v);}
 if(s.plan){s.plan.keys=keys.filter(([id])=>id.startsWith(s.plan.id+':')).sort((a,b)=>Number(a[0].split(':').at(-1))-Number(b[0].split(':').at(-1))).flatMap(([,v])=>Array.isArray(v)?v:[]);delete s.plan.keyCount;}
 for(const [id,p]of Object.entries(s.parts)){p.row=row(p.row);for(const k of arrays)p.row[k]=chunks.filter(([key])=>key.startsWith(id+':'+k+':')).sort((a,b)=>Number(a[0].split(':').at(-1))-Number(b[0].split(':').at(-1))).flatMap(([,v])=>Array.isArray(v)?v:[]);}return s;}
const api={KEY,empty,seed,plan,savePlan,validCustom,customLesson,saveCustomLesson,activity,recordActivity,flatten,fromRecords};root.HSKStudySyncCore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
