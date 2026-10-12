// Fetch exact pinned public assets; no API key, inference service or user data.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const destination=process.argv[2];if(!destination)throw Error('Usage: node tools/fetch-handwriting-neural-assets.cjs ASSET_DIRECTORY');
const config=JSON.parse(fs.readFileSync(path.join(__dirname,'..','handwriting-neural-config.json')));
(async()=>{
 fs.mkdirSync(destination,{recursive:true});
 for(const [name,asset] of Object.entries(config.assets)){
  const file=path.join(destination,new URL(asset.url).pathname.split('/').at(-1));
  let bytes=fs.existsSync(file)?fs.readFileSync(file):null;
  const valid=value=>value&&value.length===asset.bytes&&crypto.createHash('sha256').update(value).digest('hex')===asset.sha256;
  if(!valid(bytes)){const response=await fetch(asset.url,{signal:AbortSignal.timeout(120000)});if(!response.ok)throw Error('Download failed: '+name);bytes=Buffer.from(await response.arrayBuffer());if(!valid(bytes))throw Error('Integrity mismatch: '+name);fs.writeFileSync(file,bytes);}
  console.log(name+': verified '+bytes.length+' bytes');
 }
})().catch(error=>{console.error(error.message);process.exitCode=1;});
