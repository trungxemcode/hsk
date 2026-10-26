/* Overview composes existing actions; it never awards learning credit. */
document.addEventListener('DOMContentLoaded',()=>{'use strict';
const $=id=>document.getElementById(id),home=$('studioHome'),hero=$('mobileTodayHero');
if(!home||!hero)return;
const make=(tag,label,cls)=>{const n=document.createElement(tag);if(label)n.textContent=label;if(cls)n.className=cls;return n;},write=(n,v)=>{if(n.textContent!==v)n.textContent=v;},button=(label,fn)=>{const b=make('button',label);b.type='button';b.onclick=fn;return b;};
home.classList.add('overview-v216');
const meter=make('div',null,'overview-time'),time=make('span'),progress=make('progress');progress.max=1;progress.value=0;progress.setAttribute('aria-label','Thời gian học hôm nay');meter.append(time,progress);
const lesson=make('p',null,'overview-lesson');hero.querySelector('.mobile-hero-cta').before(meter,lesson);
const planAnchor=document.createComment('overview plan original');$('planToday').before(planAnchor);
const tasks=make('details',null,'overview-tasks');tasks.append(make('summary','Nhiệm vụ hôm nay'));hero.append(tasks);
const desktopHero=home.querySelector('.feature-hero .hero-button');if(desktopHero)desktopHero.addEventListener('click',e=>{if(!window.HSKPlanner?.plan||!$('planContinue'))return;e.preventDefault();e.stopImmediatePropagation();$('planContinue').click();},true);
const notice=$('updateNotice'),noticeAnchor=document.createComment('overview update original');notice.before(noticeAnchor);
const extras=make('details',null,'overview-extras');extras.append(make('summary','Lộ trình & đánh giá'),$('homeAssessment'),$('mobileHeroResult'));hero.append(extras);
const quick=$('homeQuickSearch'),searchDetails=make('details',null,'overview-search');quick.before(searchDetails);searchDetails.append(make('summary','Tra cứu nhanh · Vẽ chữ · Dịch'),quick);
const grid=home.querySelector('.shortcut-grid'),srs=grid.querySelector('[data-studio-go=srs]'),flash=grid.querySelector('[data-studio-go=learn]'),quiz=grid.querySelector('[data-studio-go=quiz]');
const saved=grid.querySelector('[data-studio-go=search]');saved.dataset.studioGo='notebook';saved.onclick=e=>{e.stopImmediatePropagation();window.HSKStudio?.navigate('notebook');};saved.addEventListener('click',saved.onclick,true);write(saved.querySelector('strong'),'Sổ từ vựng');
const bookIcon=document.querySelector('#mobileDock [data-studio-go=notebook] svg');if(bookIcon){saved.querySelector('.shortcut-icon').removeAttribute('data-icon');saved.querySelector('.shortcut-icon').replaceChildren(bookIcon.cloneNode(true));}
grid.replaceChildren(srs,quiz,flash,saved);write(home.querySelector('.dashboard-primary>.section-row h3'),'Học & ôn nhanh');
const badge=make('span',null,'overview-due');badge.id='homeDueBadge';srs.append(badge);
const streak=button('',()=>window.HSKStudio?.navigate('account'));streak.id='homeStreak';streak.setAttribute('aria-label','Chuỗi ngày học');$('headerInfo').before(streak);
const wordBox=make('section',null,'overview-word'),wordHead=make('div',null,'overview-word-head'),wordDetails=make('details'),summary=make('summary'),han=make('strong'),pin=make('span'),meaning=make('span'),wordBody=make('div',null,'overview-word-body'),wordRow=make('div',null,'overview-word-row'),sound=make('div',null,'overview-word-sound');
let offset=0,current=null,signature='',frame=0,lastMobile=null;
wordBox.id='homeDailyWord';wordHead.append(make('h3','Từ vựng hôm nay'),button('Đổi từ ↻',()=>{offset++;render();}));summary.append(han,pin,meaning);wordDetails.append(summary,wordBody);wordRow.append(wordDetails,sound);wordBox.append(wordHead,wordRow);home.querySelector('.dashboard-grid').after(wordBox);wordBox.after(searchDetails);
const wordHome=document.createComment('daily word desktop position');wordBox.before(wordHome);
function pool(){try{return typeof words!=='undefined'?words:[];}catch{return [];}}
function render(){frame=0;const p=window.HSKPlanner?.plan,key=new Date(Date.now()+7*3600000).toISOString().slice(0,10),seconds=Math.max(0,Number(p?.journal?.[key]?.seconds)||0),minutes=Math.floor(seconds/60);
const mobile=document.body.classList.contains('mobile-ux');if(mobile&&hero.previousElementSibling!==wordBox)hero.before(wordBox);else if(!mobile&&wordHome.nextSibling!==wordBox)wordHome.after(wordBox);if(mobile&&$('planToday').parentElement!==tasks)tasks.append($('planToday'));else if(!mobile&&$('planToday').parentElement===tasks)planAnchor.after($('planToday'));
if(mobile!==lastMobile){searchDetails.open=!mobile;lastMobile=mobile;}
if(document.body.dataset.studioHub==='home'){if(notice.parentElement!==home)home.prepend(notice);}else if(notice.parentElement===home)noticeAnchor.after(notice);
meter.hidden=!p;tasks.hidden=!p;if(p){write(time,`${minutes} / ${p.minutes} phút hôm nay`);const value=Math.min(1,seconds/(Math.max(1,p.minutes)*60));if(progress.value!==value)progress.value=value;}
const task=$('planTasks')?.children[2]?.querySelector('p');write(lesson,p?(task?.textContent||'Chọn bài tiếp theo trong lộ trình'):'Từ vựng, hội thoại và bài tập theo từng bài.');
if(desktopHero){const match=task?.textContent.match(/^Bài\s+(\d+)/),label=p?(match?'Học tiếp · Bài '+match[1]+' ':'Học tiếp · HSK '+p.target+' '):'Khám phá bài học ';if(desktopHero.firstChild?.nodeType===Node.TEXT_NODE&&desktopHero.firstChild.nodeValue!==label)desktopHero.firstChild.nodeValue=label;const heading=home.querySelector('.feature-copy h3');if(heading)write(heading,p?'Hôm nay · HSK '+p.target:'Bài học HSK 1–6');}
const title=hero.querySelector('h2');if(p)title.setAttribute('aria-label','Mục tiêu hôm nay · HSK '+p.target);
const due=Number($('studioHomeDue').textContent)||0;write(badge,String(due));badge.hidden=!due;write(srs.querySelector('small'),due?`${due} từ đến hạn`:'Chưa có từ đến hạn');
write(flash.querySelector('small'),$('studioProgressLabel').textContent+' · '+$('studioKnownCount').textContent.split(' · ')[0]);const count=Object.values(window.HSKNotebook?.items||{}).filter(w=>w&&typeof w.han==='string'&&typeof w.mean==='string').length;write(saved.querySelector('small'),`${count} từ đã lưu`);
const days=$('studioStreak').textContent.match(/\d+/)?.[0]||'0';write(streak,'🔥 '+days);streak.setAttribute('aria-label',`Chuỗi học tập: ${days} ngày. Mở tài khoản`);
extras.hidden=$('homeAssessment').hidden&&$('mobileHeroResult').hidden;
const all=pool(),level=document.querySelector('[data-filter].active')?.dataset.filter||'all',list=all.filter(w=>level==='all'||String(w.hsk)===level),seed=Math.floor(Date.now()/86400000),w=list.length?list[(seed+offset)%list.length]:null;
const sig=JSON.stringify([w?.han,w?.pin,w?.mean,level]);if(sig!==signature){signature=sig;current=w;wordDetails.open=false;wordBody.replaceChildren();sound.replaceChildren();if(w){write(han,w.han);write(pin,w.pin||'');write(meaning,String(w.practice?.meanings?.[0]||w.mean).split(/[;；\n]/)[0]);const example=window.HSKLessons?.examples(w)?.[0];if(example){wordBody.append(make('p',example.cn),make('p',example.vi));}else wordBody.append(make('p',w.mean));wordBody.append(button('Học từ này →',()=>{window.HSKStudio?.navigate('learn');window.HSKDictionaryBridge?.open(current.han,current.pin);}));if(window.HSKNotebook)wordBody.append(HSKNotebook.button(()=>current));if(window.HSKSpeech)sound.append(HSKSpeech.button(w.han,'Nghe '+w.han));}else{write(han,'Đang tải từ vựng…');write(pin,'');write(meaning,'');}}}
function schedule(){if(!frame)frame=requestAnimationFrame(render);}
new MutationObserver(schedule).observe(home,{subtree:true,childList:true,characterData:true});
new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['class','data-studio-hub']});
for(const id of ['studioKnownCount','studioHomeDue','studioStreak'])new MutationObserver(schedule).observe($(id),{childList:true,characterData:true,subtree:true});
for(const event of ['hsk-plan-change','hsk-account-ready','hsk-notebook-change','hsk-lessons-ready','storage'])window.addEventListener(event,schedule);
document.addEventListener('click',e=>{if(e.target.closest('[data-filter]'))schedule();});
const timer=setInterval(schedule,30000);window.addEventListener('pagehide',()=>clearInterval(timer));render();
});
