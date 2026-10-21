/* Authorized Study4 HSK exam discovery. Public verified test pages, not copied questions/audio. */
(function(){
 'use strict';
 const catalog={
  1:{title:'HSK 1 Practice test 1',url:'https://study4.com/tests/4905/hsk-1-practice-test-1/',minutes:35,listening:20},
  2:{title:'HSK 2 Practice test 2',url:'https://study4.com/tests/4918/hsk-2-practice-test-2/',minutes:50,listening:35},
  3:{title:'HSK 3 Practice test 34',url:'https://study4.com/tests/5048/hsk-3-practice-test-34/',minutes:85,listening:40},
  4:{title:'HSK 4 Advanced test 1',url:'https://study4.com/tests/6743/hsk-4-advanced-test-1/',minutes:100,listening:45},
  5:{title:'HSK 5 Advanced test 1',url:'https://study4.com/tests/6753/hsk-5-advanced-test-1/',minutes:120,listening:45},
  6:{title:'HSK 6 Advanced test 4',url:'https://study4.com/tests/6785/hsk-6-advanced-test-4/',minutes:135,listening:50}
 };
 const host=document.querySelector('main.workspace');
 const panel=document.createElement('section');panel.id='study4PracticePanel';panel.className='panel study4-exam-panel';panel.dataset.studioHubPanel='study4';panel.hidden=true;
 panel.innerHTML='<div class="s4-head"><h2>Luyện thi HSK</h2><p>Chọn luyện đề hoặc phần nghe theo cấp HSK.</p></div><div class="s4-controls"><label for="study4Level">Cấp độ <select id="study4Level"></select></label><div class="s4-tabs" role="group" aria-label="Phần thi"><button type="button" data-s4-skill="test">Đề HSK</button><button type="button" data-s4-skill="listening">Bài nghe</button></div></div><div id="study4Results"></div><p class="s4-credit">Nguồn: <a href="https://study4.com/tests/" target="_blank" rel="noopener noreferrer">Study4.com</a></p><button type="button" class="s4-internal">Luyện theo dạng đề ngay trong HSK →</button>';
 host.append(panel);
 const level=panel.querySelector('#study4Level'),results=panel.querySelector('#study4Results');
 for(let n=1;n<=6;n++){const o=new Option('HSK '+n,String(n));level.add(o);}
 let skill='test';
 function preferred(){
  const filter=document.querySelector('.filter-btn[data-filter].active')?.dataset.filter;
  const goal=window.HSKPlanner?.plan?.target;
  return (/^[1-6]$/.test(String(filter))?Number(filter):(Number(goal)||3));
 }
 function update(){
  const item=catalog[level.value]||catalog[3];
  for(const b of panel.querySelectorAll('[data-s4-skill]')){
   const current=b.dataset.s4Skill===skill;
   b.classList.toggle('is-active',current);b.setAttribute('aria-pressed',String(current));
  }
  results.replaceChildren();
  const card=document.createElement('article');card.className='s4-test-card';
  const eyebrow=document.createElement('span');eyebrow.className='s4-brow';eyebrow.textContent='HSK '+level.value+' · '+(skill==='listening'?'Kỹ năng nghe':'Đề luyện thi');
  const title=document.createElement('h3');title.textContent=item.title;
  const meta=document.createElement('p');meta.textContent=skill==='listening'?item.listening+' câu Listening · Chọn phần Listening tại Study4':item.minutes+' phút · Nghe, Đọc'+(Number(level.value)>=3?', Viết':'');
  const details=document.createElement('p');details.className='s4-explainer';details.textContent=skill==='listening'?'Phần bài nghe và audio do Study4 phát trực tiếp khi bạn chọn phần Listening trong đề.':'Mở bài thi tại Study4 để làm đề, xem bài nghe và kết quả.';
  const link=document.createElement('a');link.className='s4-visit';link.href=item.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=skill==='listening'?'Mở phần Listening tại Study4 ↗':'Mở đề trên Study4 ↗';
  const all=document.createElement('a');all.className='s4-library';all.href='https://study4.com/tests/hsk-'+level.value+'/';all.target='_blank';all.rel='noopener noreferrer';all.textContent='Xem thư viện đề HSK '+level.value+' ↗';
  card.append(eyebrow,title,meta,details,link,all);results.append(card);
 }
 function open(options={}){
  const n=Number(options.level)||preferred();level.value=String(catalog[n]?n:3);
  skill=options.skill==='listening'?'listening':'test';update();
 }
 level.addEventListener('change',update);
 panel.querySelectorAll('[data-s4-skill]').forEach(button=>button.addEventListener('click',()=>{skill=button.dataset.s4Skill;update();}));
 panel.querySelector('.s4-internal').addEventListener('click',()=>window.HSKStudio?.navigate('exam'));
 window.HSKStudy4={open,catalog,get selectedLevel(){return Number(level.value)},get skill(){return skill}};
})();
