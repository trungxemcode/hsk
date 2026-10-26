(()=>{
'use strict';
const launcher=document.getElementById('lessonChatButton'),panel=document.getElementById('lessonChatPanel'),title=document.getElementById('lessonChatTitle'),messages=document.getElementById('lessonChatMessages'),form=document.getElementById('lessonChatForm'),input=document.getElementById('lessonChatInput'),send=document.getElementById('lessonChatSend'),status=document.getElementById('lessonChatStatus'),selectionPrompt=document.getElementById('lessonSelectionPrompt'),selectionForm=document.getElementById('lessonSelectionForm'),selectionInput=document.getElementById('lessonSelectionInput');
let lesson=null,history=[],pending=null,serial=0,config=null,selectedText='',selectionTimer=0;
function syncLauncher(){launcher.hidden=!lesson||!panel.hidden;}
function fitViewport(){if(panel.hidden)return;const view=window.visualViewport;if(!view||!matchMedia('(max-width:700px), (pointer:coarse)').matches)return;panel.style.setProperty('--chat-view-top',view.offsetTop+'px');panel.style.setProperty('--chat-view-height',view.height+'px');}
function open(){panel.hidden=false;syncLauncher();launcher.setAttribute('aria-expanded','true');fitViewport();}
function close(){input.blur();panel.hidden=true;syncLauncher();launcher.setAttribute('aria-expanded','false');}
window.visualViewport?.addEventListener('resize',fitViewport);
window.visualViewport?.addEventListener('scroll',fitViewport);
window.addEventListener('resize',fitViewport);
function reset(){panel.removeAttribute('aria-busy');++serial;pending?.abort();pending=null;history=[];messages.replaceChildren();input.value='';input.disabled=false;send.disabled=false;status.textContent='Hỏi về từ vựng, ngữ pháp, bài đọc hoặc hội thoại của bài này.';}
function message(role,text){const row=document.createElement('div');row.className='lesson-chat-message '+role;const label=document.createElement('strong'),body=document.createElement('p');label.textContent=role==='user'?'Bạn':'AI';body.textContent=text;row.append(label,body);messages.append(row);messages.scrollTop=messages.scrollHeight;}
function hideSelectionPrompt(){selectionPrompt.hidden=true;selectedText='';}
function positionSelectionPrompt(rect){const width=Math.min(310,window.innerWidth-24),left=Math.max(12,Math.min(window.innerWidth-width-12,rect.left+(rect.width-width)/2));selectionPrompt.style.left=left+'px';selectionPrompt.style.top='0px';selectionPrompt.hidden=false;const height=selectionPrompt.getBoundingClientRect().height,top=rect.bottom+height+12<window.innerHeight?rect.bottom+8:Math.max(12,rect.top-height-8);selectionPrompt.style.top=top+'px';}
function inspectSelection(){clearTimeout(selectionTimer);selectionTimer=setTimeout(()=>{const selection=window.getSelection(),text=selection?.toString().replace(/\s+/g,' ').trim(),node=selection?.anchorNode,section=node?.parentElement?.closest('#lessonsContent .lesson-section');if(!text||text.length<2||!section||!lesson){if(!selectionPrompt.contains(document.activeElement))hideSelectionPrompt();return;}selectedText=text.slice(0,280);positionSelectionPrompt(selection.getRangeAt(0).getBoundingClientRect());},180);}
function ask(question){if(!question||!lesson||pending)return;open();input.value='';sendQuestion(question);}
async function sendQuestion(question){
 if(!question||!lesson||pending)return;
 if(!config){status.textContent='Chưa kết nối được dịch vụ AI. Hãy thử lại sau.';return;}
 const user=window.HSKAccountDashboard?.user;if(!user){status.textContent='Hãy đăng nhập tài khoản app để hỏi AI.';return;}
 const current=serial,context=lesson,controller=new AbortController();pending=controller;send.disabled=true;panel.setAttribute('aria-busy','true');message('user',question);input.value='';status.textContent='AI hỏi đáp bài học đang load…';
 const stopLoading=()=>{if(current===serial)panel.removeAttribute('aria-busy');};
 const timer=setTimeout(()=>controller.abort(),55000);
 try{
  const token=await user.getIdToken();if(current!==serial)return;
  const response=await fetch(config.endpoint.replace(/\/translate$/,'/lesson-ask'),{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({question,hsk:context.hsk,lesson:context,history:history.slice(-8)}),signal:controller.signal});
  const data=await response.json();if(current!==serial)return;
  if(!response.ok)throw Error(response.status===404?'Dịch vụ hỏi đáp bài học chưa được kích hoạt.':data.error||'AI chưa trả lời được. Hãy thử lại.');
  if(typeof data.answer!=='string'||!data.answer.trim()||data.answer.length>5000)throw Error('Câu trả lời chưa đầy đủ. Hãy thử lại.');
  history.push({role:'user',text:question},{role:'assistant',text:data.answer});history=history.slice(-8);message('assistant',data.answer);status.textContent='';
 }catch(error){if(current===serial)status.textContent=error.name==='AbortError'?'Hỏi đáp quá lâu. Hãy thử lại.':error.message;}
 finally{stopLoading?.();clearTimeout(timer);if(current===serial){pending=null;send.disabled=false;input.disabled=false;}}
}
window.addEventListener('hsk-lesson-context',event=>{const next=event.detail;if(next?.id!==lesson?.id){reset();close();hideSelectionPrompt();}lesson=next;syncLauncher();title.textContent=lesson?'Bài '+lesson.number+' · '+lesson.vi:'Hỏi đáp bài học';if(!lesson)close();});
window.addEventListener('hsk-music-ask',event=>{const value=event.detail;if(!value?.lesson?.id?.startsWith('music-')||!value.question)return;if(lesson?.id!==value.lesson.id){reset();hideSelectionPrompt();}lesson=value.lesson;title.textContent='Tra cứu lời · '+lesson.title;ask(value.question);});
window.addEventListener('hsk-music-context-end',()=>{if(lesson?.id?.startsWith('music-')){reset();close();hideSelectionPrompt();lesson=null;syncLauncher();}});
window.addEventListener('hsk-account-ready',()=>{reset();close();});
launcher.addEventListener('click',()=>{open();input.focus({preventScroll:true});});
document.getElementById('lessonChatClose').addEventListener('click',()=>{close();launcher.focus();});
panel.addEventListener('keydown',event=>{if(event.key==='Escape'){close();launcher.focus();}});
document.getElementById('lessonSelectionClose').addEventListener('click',hideSelectionPrompt);
selectionForm.addEventListener('submit',event=>{event.preventDefault();const request=selectionInput.value.trim();if(!request||!selectedText)return;const question=`Giải thích chi tiết đoạn nội dung này: “${selectedText}”\nYêu cầu: ${request}`.slice(0,500);hideSelectionPrompt();selectionInput.value='';ask(question);});
document.addEventListener('selectionchange',inspectSelection);window.addEventListener('resize',()=>{if(!selectionPrompt.hidden)inspectSelection();});
form.addEventListener('submit',async event=>{
 event.preventDefault();sendQuestion(input.value.trim());
});
fetch('./translation-config.json',{cache:'no-store'}).then(r=>r.json()).then(c=>{if(c.enabled&&new URL(c.endpoint).protocol==='https:')config=c;}).catch(()=>{});
})();
