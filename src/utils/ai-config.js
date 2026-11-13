/* Shared loader and HTTPS validator for ./translation-config.json across frontend modules. */
(function(root){'use strict';
 function validateTranslationConfig(config){
  if(!config||!config.enabled||typeof config.endpoint!=='string')return null;
  try{
   const url=new URL(config.endpoint);
   return url.protocol==='https:'?config:null;
  }catch{
   return null;
  }
 }
 async function loadTranslationConfig({url='./translation-config.json',cache='no-store',signal,fetchFn}={}){
  const activeFetch=fetchFn||root.fetch;
  if(typeof activeFetch!=='function')return null;
  try{
   const init=signal?{cache,signal}:{cache};
   const response=fetchFn?await fetchFn(url,init):await root.fetch(url,init);
   if(response&&response.ok===false)return null;
   const config=await response.json();
   return validateTranslationConfig(config);
  }catch{
   return null;
  }
 }
 const api={validateTranslationConfig,loadTranslationConfig};
 root.HSKAIConfig=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
