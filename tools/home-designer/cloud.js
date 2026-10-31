/* Online publishing adapter. Passwords go directly to Firebase, never to the design server. */
window.HSKDesignerCloud={async create(server,callbacks={}){
 const key='hsk-design-auth-v1',api=server.firebaseApiKey;let auth=null,pending=null,timer=null,busy=false,paused=false,revision=server.revision;
 const status=document.createElement('small');status.id='cloud-status';document.querySelector('.brand small').replaceWith(status);
 const say=(message,error=false)=>{status.textContent=message;status.style.color=error?'#b42336':'';};
 const release=document.createElement('a');release.href=server.publicUrl;release.target='_blank';release.rel='noopener';release.textContent='Mở bản phát hành ↗';document.querySelector('.actions').prepend(release);
 const logout=document.createElement('button');logout.textContent='Đăng xuất';document.querySelector('.actions').prepend(logout);
 async function firebase(method,body){const response=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:'+method+'?key='+encodeURIComponent(api),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const result=await response.json();if(!response.ok)throw Error('Không đăng nhập được. Kiểm tra email/mật khẩu tài khoản HSK.');return result;}
 function store(value){auth=value;try{sessionStorage.setItem(key,JSON.stringify(auth));}catch{}}
 async function refresh(){if(auth&&auth.expires>Date.now()+60000)return auth.idToken;if(!auth?.refreshToken)throw Error('Hãy đăng nhập lại để đồng bộ.');const response=await fetch('https://securetoken.googleapis.com/v1/token?key='+encodeURIComponent(api),{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'refresh_token',refresh_token:auth.refreshToken})});const result=await response.json();if(!response.ok)throw Error('Phiên đăng nhập hết hạn. Hãy đăng nhập lại.');store({idToken:result.id_token,refreshToken:result.refresh_token,expires:Date.now()+Number(result.expires_in)*1000});return auth.idToken;}
 async function verify(){const response=await fetch('/__designer/identity',{headers:{Authorization:'Bearer '+await refresh()}});if(!response.ok)throw Error('Chỉ tài khoản chủ ứng dụng được chỉnh giao diện.');}
 try{auth=JSON.parse(sessionStorage.getItem(key)||'null');if(auth)await verify();}catch{auth=null;sessionStorage.removeItem(key);}
 async function login(){
  const dialog=document.createElement('dialog');dialog.className='cloud-login';
  const heading=document.createElement('h2');heading.textContent='Đăng nhập để chỉnh giao diện';const text=document.createElement('p');text.textContent='Dùng tài khoản chủ ứng dụng HSK. Thay đổi sẽ tự lưu sang bản phát hành.';
  const form=document.createElement('form'),email=document.createElement('input'),password=document.createElement('input'),button=document.createElement('button'),error=document.createElement('p'),reset=document.createElement('button');
  email.type='email';email.autocomplete='username';email.placeholder='Email tài khoản HSK';email.required=true;email.setAttribute('aria-label','Email tài khoản HSK');
  password.type='password';password.autocomplete='current-password';password.placeholder='Mật khẩu';password.required=true;password.setAttribute('aria-label','Mật khẩu');
  button.textContent='Đăng nhập';button.className='primary';reset.type='button';reset.textContent='Quên mật khẩu';
  reset.onclick=async()=>{if(!email.reportValidity())return;reset.disabled=true;try{await firebase('sendOobCode',{requestType:'PASSWORD_RESET',email:email.value.trim()});error.textContent='Nếu email có tài khoản, hướng dẫn đặt lại mật khẩu sẽ được gửi đến bạn.';}catch(e){error.textContent=e.message;}finally{reset.disabled=false;}};
  form.append(email,password,button,reset,error);dialog.append(heading,text,form);document.body.append(dialog);dialog.addEventListener('cancel',e=>e.preventDefault());dialog.showModal();email.focus();
  return new Promise(resolve=>{form.onsubmit=async e=>{e.preventDefault();button.disabled=true;error.textContent='Đang đăng nhập…';try{const result=await firebase('signInWithPassword',{email:email.value.trim(),password:password.value,returnSecureToken:true});password.value='';store({idToken:result.idToken,refreshToken:result.refreshToken,expires:Date.now()+Number(result.expiresIn)*1000});await verify();dialog.close();dialog.remove();resolve();}catch(e){auth=null;sessionStorage.removeItem(key);error.textContent=e.message;}finally{button.disabled=false;}};});
 }
 if(!auth)await login();say('Tự đồng bộ · Đã kết nối');
 async function flush(){
  clearTimeout(timer);if(busy||paused||!pending)return;busy=true;let retryDelay=1200;const config=pending;pending=null;say('Đang đồng bộ…');
  try{
   const token=await refresh(),response=await fetch('/__designer/apply',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({config,revision})}),result=await response.json();
   if(!response.ok){if(response.status===409||response.status===401||response.status===403)paused=true;throw Error(result.error||'Chưa đồng bộ được. Nháp vẫn ở trên máy.');}
   revision=result.revision;callbacks.saved?.(revision,config);say('Đã đồng bộ tới bản phát hành');window.dispatchEvent(new CustomEvent('hsk-design-published',{detail:{revision}}));
  }catch(e){if(!pending)pending=config;say(e.message,true);retryDelay=10000;}
  finally{busy=false;if(pending&&!paused){clearTimeout(timer);timer=setTimeout(flush,retryDelay);}}
 }
 logout.onclick=()=>{paused=true;clearTimeout(timer);auth=null;sessionStorage.removeItem(key);location.reload();};
 window.addEventListener('online',()=>{if(!paused)flush();});
 window.addEventListener('beforeunload',e=>{if(pending||busy){e.preventDefault();e.returnValue='';}});
 return {async editObject(input,signal){const response=await fetch('/__designer/chatgpt',{method:'POST',signal,headers:{'Content-Type':'application/json',Authorization:'Bearer '+await refresh()},body:JSON.stringify(input)});const result=await response.json();if(!response.ok)throw Error(result.error||'Chưa sửa được giao diện.');return result;},get revision(){return revision;},queue(config){pending=JSON.parse(JSON.stringify(config));say(paused?'Nháp chưa đồng bộ · Xuất nháp trước khi tải lại':'Đang chờ đồng bộ…',paused);clearTimeout(timer);timer=setTimeout(flush,1200);},flush};
}};
