(()=>{
'use strict';
const launcher=document.getElementById('lessonChatButton'),panel=document.getElementById('lessonChatPanel'),title=document.getElementById('lessonChatTitle'),messages=document.getElementById('lessonChatMessages'),form=document.getElementById('lessonChatForm'),input=document.getElementById('lessonChatInput'),send=document.getElementById('lessonChatSend'),status=document.getElementById('lessonChatStatus');
let lesson=null,history=[],pending=null,serial=0,config=null;
function close(){panel.hidden=true;launcher.setAttribute('aria-expanded','false');}
function reset(){++serial;pending?.abort();pending=null;history=[];messages.replaceChildren();input.value='';input.disabled=false;send.disabled=false;status.textContent='Hỏi về từ vựng, ngữ pháp, bài đọc hoặc hội thoại của bài này.';}
function message(role,text){const row=document.createElement('div');row.className='lesson-chat-message '+role;const label=document.createElement('strong'),body=document.createElement('p');label.textContent=role==='user'?'Bạn':'AI';body.textContent=text;row.append(label,body);messages.append(row);messages.scrollTop=messages.scrollHeight;}
window.addEventListener('hsk-lesson-context',event=>{const next=event.detail;if(next?.id!==lesson?.id){reset();close();}lesson=next;launcher.hidden=!lesson;title.textContent=lesson?'Bài '+lesson.number+' · '+lesson.vi:'Hỏi đáp bài học';if(!lesson)close();});
window.addEventListener('hsk-account-ready',()=>{reset();close();});
launcher.addEventListener('click',()=>{panel.hidden=!panel.hidden;launcher.setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden)input.focus();});
document.getElementById('lessonChatClose').addEventListener('click',()=>{close();launcher.focus();});
panel.addEventListener('keydown',event=>{if(event.key==='Escape'){close();launcher.focus();}});
form.addEventListener('submit',async event=>{
 event.preventDefault();const question=input.value.trim();if(!question||!lesson||pending)return;
 if(!config){status.textContent='Chưa kết nối được dịch vụ AI. Hãy thử lại sau.';return;}
 const user=window.HSKAccountDashboard?.user;if(!user){status.textContent='Hãy đăng nhập tài khoản app để hỏi AI.';return;}
 const current=serial,context=lesson,controller=new AbortController();pending=controller;send.disabled=true;input.disabled=true;status.textContent='AI đang giải thích…';
 const timer=setTimeout(()=>controller.abort(),55000);
 try{
  const token=await user.getIdToken();if(current!==serial)return;
  const response=await fetch(config.endpoint.replace(/\/translate$/,'/lesson-ask'),{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({question,hsk:context.hsk,lesson:context,history:history.slice(-8)}),signal:controller.signal});
  const data=await response.json();if(current!==serial)return;
  if(!response.ok)throw Error(response.status===404?'Dịch vụ hỏi đáp bài học chưa được kích hoạt.':data.error||'AI chưa trả lời được. Hãy thử lại.');
  if(typeof data.answer!=='string'||!data.answer.trim()||data.answer.length>5000)throw Error('Câu trả lời chưa đầy đủ. Hãy thử lại.');
  history.push({role:'user',text:question},{role:'assistant',text:data.answer});history=history.slice(-8);message('user',question);message('assistant',data.answer);input.value='';status.textContent='';
 }catch(error){if(current===serial)status.textContent=error.name==='AbortError'?'Hỏi đáp quá lâu. Hãy thử lại.':error.message;}
 finally{clearTimeout(timer);if(current===serial){pending=null;send.disabled=false;input.disabled=false;input.focus();}}
});
fetch('./translation-config.json',{cache:'no-store'}).then(r=>r.json()).then(c=>{if(c.enabled&&new URL(c.endpoint).protocol==='https:')config=c;}).catch(()=>{});
})();
