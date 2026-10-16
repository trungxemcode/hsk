// Optional secondary provider. Kept OFF until the user confirms vendor/model
// and installs a newly rotated credential as a Cloudflare secret.
// Never echo secrets, provider responses, prompts or source content into logs.
export function backupConfigured(env){
 return env.AI_BACKUP_ENABLED==='true'&&env.SECONDARY_AI_PROVIDER==='xkiro'&&
  typeof env.SECONDARY_AI_API_KEY==='string'&&env.SECONDARY_AI_API_KEY.length>=20&&
  typeof env.SECONDARY_AI_MODEL==='string'&&/^[a-z0-9][a-z0-9./_:-]{1,120}$/i.test(env.SECONDARY_AI_MODEL);
}
export async function requestBackupJSON({fetchFn,env,signal,instruction,prompt}){
 if(!backupConfigured(env))return null;
 const response=await fetchFn('https://api.xkiro.com/v1/chat/completions',{
  method:'POST',signal,
  headers:{Authorization:'Bearer '+env.SECONDARY_AI_API_KEY,'Content-Type':'application/json'},
  body:JSON.stringify({model:env.SECONDARY_AI_MODEL,temperature:0.55,max_tokens:3200,
   response_format:{type:'json_object'},
   messages:[{role:'system',content:instruction},{role:'user',content:JSON.stringify(prompt)}]})
 });
 if(!response.ok)return {ok:false,status:response.status};
 const payload=await response.json();
 const content=payload?.choices?.[0]?.message?.content;
 if(typeof content!=='string'||content.length>50000)return {ok:false,status:502};
 try{return {ok:true,data:JSON.parse(content)}}catch{return {ok:false,status:502}}
}
