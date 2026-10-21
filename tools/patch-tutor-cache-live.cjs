// Add QA hooks to the exact downloaded Worker without rebuilding deployed voice modules.
// Usage: node tools/patch-tutor-cache-live.cjs BASELINE OUTPUT
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..');let source=fs.readFileSync(process.argv[2],'utf8');
if(source.includes('QA_CACHE_REVISION'))throw Error('This Worker already has QA hooks; use its canonical source');
const before=source;
function replace(a,b){if(source.split(a).length!==2)throw Error('Live anchor must match exactly once: '+a.slice(0,100));source=source.replace(a,b);}
replace('  async fetch(request) {\n    if (request.method !== "POST")', '  async alarm() { return qaCacheAlarm(this.state.storage); }\n  async fetch(request) {\n    if (request.method !== "POST")');
replace('    if (!data || typeof data !== "object" || !["reserve",', '    if (data && typeof data.action === "string" && data.action.startsWith("qa-")) return qaCacheControl(this.state.storage, this.env, data);\n    if (!data || typeof data !== "object" || !["reserve",');
replace('  return async (request, env) => {\n    const timings = [];', '  return async (request, env, ctx) => {\n    const timings = [];');
replace('    let abuseLease = null, abuseUid = "", responseStatus = 500;', '    let abuseLease = null, abuseUid = "", responseStatus = 500, qaSession = null;');
replace('"Access-Control-Expose-Headers": "X-HSK-Worker-Version, X-HSK-AI-Provider"', '"Access-Control-Expose-Headers": "X-HSK-Worker-Version, X-HSK-AI-Provider, X-HSK-AI-Cache"');
replace('      let readingKey = null, readingLocked = false;', `      if(env.QA_CACHE_ENABLED==='true'&&['/ask','/lesson-ask','/dictionary-lookup','/dictionary-translate'].includes(route)){
        qaSession=await qaBegin(route,body,account.localId,env,isAdmin);
        headers2['X-HSK-AI-Cache']=qaSession.state;
        if(controller.signal.aborted)throw new DOMException('Canceled','AbortError');
        if(qaSession.state==='hit'){if(qaSession.provider)headers2['X-HSK-AI-Provider']=qaSession.provider;return reply(qaSession.value);}
        if(qaSession.state==='busy'){headers2['Retry-After']='2';return reply({error:'Nội dung này đang được tra cứu. Hãy thử lại sau ít giây.',code:'AI_CACHE_IN_FLIGHT'},429);}
      }
      let readingKey = null, readingLocked = false;`);
for(const value of ['{ translations: data.translations, source: "ai", language: "vi" }','{ answer: data.answer, terms: data.terms, source: "ai", scope: "general" }','{ answer }'])replace('        return reply('+value+');', `        await qaUsage(env,payload2);
        await qaFinish(env,qaSession,${value},headers2['X-HSK-AI-Provider'],{rawFetch:rawFetchFn,ctx,signal:controller.signal});
        return reply(${value});`);
replace('      request.signal.removeEventListener("abort", abortRequest);\n      if (abuseLease)', '      request.signal.removeEventListener("abort", abortRequest);\n      await qaRelease(env,qaSession);\n      if (abuseLease)');
replace('var WORKER_REVISION = "hsk-tts-efficient-3-5-5";', 'var WORKER_REVISION = "hsk-ai-cache-3-6-1";');
// Every live function related to voice must remain byte-for-byte unchanged.
function voiceFunctions(text){const found=new Map(),pattern=/^(?:async )?function (\w*(?:voice|Voice|Tts|tts)\w*)\(/gm;for(const match of text.matchAll(pattern)){const start=match.index,next=text.indexOf('\n}',start);if(next<0)throw Error('Voice function boundary');found.set(match[1],text.slice(start,next+2));}return found;}
const old=voiceFunctions(before),fresh=voiceFunctions(source);if(old.size<5||old.size!==fresh.size)throw Error('Missing live voice functions');for(const [name,code] of old)if(fresh.get(name)!==code)throw Error('Voice changed: '+name);
const modules=['tutor-curriculum.mjs','tutor-cache.mjs','tutor-cache-store.mjs'].map(n=>fs.readFileSync(path.join(root,'server',n),'utf8').replace(/^import .*;\r?\n/gm,'').replace(/^export /gm,''));
source='// Additive tutor QA cache; deployed voice code below is preserved.\n'+modules.join('\n')+'\n'+source;
fs.writeFileSync(process.argv[3],source);
console.log('Patched app QA only; preserved '+old.size+' voice functions. SHA256 '+crypto.createHash('sha256').update(source).digest('hex'));
