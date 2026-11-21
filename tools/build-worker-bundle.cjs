const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),server=path.join(root,'server'),target=path.join(server,'translator-worker-bundled.mjs');
const norm=text=>String(text||'').replace(/\r\n/g,'\n');

function generateBundledWorker(){
 const previous=norm(fs.readFileSync(target,'utf8')),match=previous.match(/^export const vocabulary=(\[.*\]);$/m);
 if(!match)throw Error('Existing bundled vocabulary is missing');
 const vocabulary=JSON.parse(match[1]);
 const readServer=(name,stripImports=false)=>{
  const raw=norm(fs.readFileSync(path.join(server,name),'utf8'));
  return stripImports?raw.replace(/^import .*;\n/gm,''):raw;
 };
 const collector=readServer('handwriting-samples.mjs');
 const originalReading=readServer('original-reading.mjs');
 const reading=readServer('reading-service.mjs',true);
 const tutorCurriculum=readServer('tutor-curriculum.mjs');
 const examSharedRegistry=readServer('exam-shared-registry.mjs');
 const tutorCache=readServer('tutor-cache.mjs',true);
 const tutorStore=readServer('tutor-cache-store.mjs',true);
 const accountRoles=readServer('account-roles.mjs');
 const chatgptCookie=readServer('chatgpt-cookie.mjs',true);
 const museAi=readServer('muse-ai.mjs',true);
 const aiProviderChoice=readServer('ai-provider-choice.mjs',true);
 const personalAi=readServer('personal-ai.mjs',true);
 const aiControl=readServer('ai-control.mjs',true);
 const aiResilience=readServer('ai-resilience.mjs');
 const aiBackup=readServer('ai-backup.mjs',true);
 const geminiKeys=readServer('gemini-keys.mjs',true);
 const voiceVerify=readServer('voice-partial-verify.mjs',true);
 const voiceTts=readServer('voice-tts.mjs',true);
 const lyricsCore=norm(fs.readFileSync(path.join(root,'src/modules/music/music-lyrics-core.js'),'utf8')).replace("typeof window!=='undefined'?window:globalThis",'holder');
 const transcript="const MusicTranscript=(()=>{const holder={};\n"+lyricsCore+"\nconst Lyrics=holder.HSKMusicLyricsCore;\n"+readServer('music-transcript.mjs',true).replace(/^export /gm,'')+"\nreturn {validTranscriptInput,transcribeMusic,libraryTranscriptMedia,saveGeneratedTranscript};})();\nconst {validTranscriptInput,transcribeMusic,libraryTranscriptMedia,saveGeneratedTranscript}=MusicTranscript;\n";
 const wrongImages=readServer('wrong-answer-images.mjs').replace(/^export /gm,'');
 const wrongRules=readServer('wrong-answer-rules.mjs').replace(/^export /gm,'');
 const sentenceReview=norm(fs.readFileSync(path.join(root,'src/modules/translation/sentence-review-core.js'),'utf8'));
 const handler=readServer('translator-worker.mjs',true).trimStart();
 const output='// Standalone Cloudflare Worker. Generated from vocabulary + translator-worker.mjs.\nexport const vocabulary='+JSON.stringify(vocabulary)+';\n\n'+collector+'\n'+tutorCurriculum+'\n'+examSharedRegistry+'\n'+tutorCache+'\n'+tutorStore+'\n'+accountRoles+'\n'+chatgptCookie+'\n'+museAi+'\n'+aiProviderChoice+'\n'+personalAi+'\n'+aiControl+'\n'+aiResilience+'\n'+aiBackup+'\n'+geminiKeys+'\n'+originalReading+'\n'+reading+'\n'+voiceVerify+'\n'+voiceTts+'\n'+transcript+'\n'+wrongImages+'\n'+wrongRules+'\n'+sentenceReview+'\n'+handler;
 return {output,previous,vocabularyCount:vocabulary.length};
}

if(require.main===module){
 const checkOnly=process.argv.includes('--check');
 const {output,previous,vocabularyCount}=generateBundledWorker();
 if(checkOnly){
  if(output!==previous){
   console.error('FAIL: server/translator-worker-bundled.mjs is out of sync with source modules. Run: node tools/build-worker-bundle.cjs');
   process.exit(1);
  }
  console.log('PASS: server/translator-worker-bundled.mjs matches source modules 100% ('+vocabularyCount+' vocabulary entries).');
 }else{
  fs.writeFileSync(target,output);
  console.log('Bundled worker synchronized; '+vocabularyCount+' vocabulary entries preserved.');
 }
}

module.exports={generateBundledWorker};
