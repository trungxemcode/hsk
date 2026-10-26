// Add recovery to the downloaded live Worker, without rebuilding its voice code.
// node tools/prepare-ai-resilience-live.cjs BASELINE.mjs EXISTING_DEPLOY_DIRECTORY
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const baseline=path.resolve(process.argv[2]||''),target=path.resolve(process.argv[3]||'');
if(process.argv.length!==4)throw Error('Expected baseline and existing deploy directory');
const source=fs.readFileSync(baseline,'utf8'),workerPath=path.join(target,'src/worker.mjs'),configPath=path.join(target,'wrangler.jsonc');
let worker=fs.readFileSync(workerPath,'utf8');
if(source.includes("import {aiErrorKind}"))throw Error('Baseline already has recovery; do not patch twice');
function once(value,old,fresh){if(value.split(old).length!==2)throw Error('Unexpected live source anchor: '+old.slice(0,100));return value.replace(old,fresh);}
const retry='if (!response.ok) return { response, retry: [401, 403, 404, 408, 429, 500, 502, 503, 504].includes(response.status) };';
const patched="import {aiErrorKind} from './ai-resilience.mjs';\n"+once(source,retry,retry.replace('includes(response.status)','includes(response.status) || (response.status === 400 && await aiErrorKind(response) === "region")'));
const voiceFunctions=text=>new Map([...text.matchAll(/^(?:async )?function (\w*(?:voice|Voice|Tts|tts)\w*)\(/gm)].map(m=>{const end=text.indexOf('\n}',m.index);if(end<0)throw Error('Unknown voice boundary');return [m[1],text.slice(m.index,end+2)];}));
const before=voiceFunctions(source),after=voiceFunctions(patched);
if(before.size<5||before.size!==after.size)throw Error('Voice exports missing');
for(const [name,code] of before)if(after.get(name)!==code)throw Error('Voice changed: '+name);
worker=once(worker,"import live from './live-worker.mjs';","import live, {createHandler as createLiveHandler} from './live-worker.mjs';\nimport {createGeminiModelFallback} from './ai-resilience.mjs';");
worker=once(worker,'export default createRouter(live, createTranscriptHandler());',`// Voice bypasses the recovery adapter and retains the original handler and key pools.
export function createResilientExisting(rawFetch=fetch){
 const handlers=new WeakMap();
 return {fetch(request,env,ctx){
  if(new URL(request.url).pathname==='/voice-precache')return live.fetch(request,env,ctx);
  let handler=handlers.get(env);
  if(!handler){const state=new Map();handler=createLiveHandler(createGeminiModelFallback(rawFetch,env,{state,onResult:event=>console.info('hsk-ai-provider-result',event)}));handlers.set(env,handler);}
  return handler(request,env,ctx);
 }};
}
export default createRouter(createResilientExisting(), createTranscriptHandler());`);
const config=JSON.parse(fs.readFileSync(configPath,'utf8'));
if(config.name!=='hsk-vietnamese-translator'||config.main!=='src/worker.mjs')throw Error('Wrong deployment target');
config.vars={...config.vars,AI_MODEL_FAILOVER_ENABLED:'true',AI_GEMINI_FALLBACK_MODELS:'gemini-3.1-flash-lite,gemini-3.6-flash',MUSIC_TRANSCRIPT_ENABLED:'false'};
// All anchors/voice checks complete before writing any output.
const backup=path.join(target,'src/live-worker.before-resilience.mjs');
if(fs.existsSync(backup)&&fs.readFileSync(backup,'utf8')!==source)throw Error('Refuse to overwrite a different live backup');
fs.writeFileSync(backup,source);
fs.writeFileSync(path.join(target,'src/live-worker.mjs'),patched);
fs.copyFileSync(path.join(__dirname,'../server/ai-resilience.mjs'),path.join(target,'src/ai-resilience.mjs'));
fs.writeFileSync(workerPath,worker);
fs.writeFileSync(configPath,JSON.stringify(config,null,2)+'\n');
console.log(JSON.stringify({preservedVoiceFunctions:before.size,originalSha256:crypto.createHash('sha256').update(source).digest('hex'),transcriptEnabled:false}));
