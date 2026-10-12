const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),server=path.join(root,'server'),target=path.join(server,'translator-worker-bundled.mjs');
const previous=fs.readFileSync(target,'utf8'),match=previous.match(/^export const vocabulary=(\[.*\]);\r?$/m);
if(!match)throw Error('Existing bundled vocabulary is missing');
const vocabulary=JSON.parse(match[1]);
const collector=fs.readFileSync(path.join(server,'handwriting-samples.mjs'),'utf8').replace(/\r\n/g,'\n');
const handler=fs.readFileSync(path.join(server,'translator-worker.mjs'),'utf8').replace(/\r\n/g,'\n').replace(/^import .*;\n/gm,'').trimStart();
fs.writeFileSync(target,'// Standalone Cloudflare Worker. Generated from vocabulary + translator-worker.mjs.\nexport const vocabulary='+JSON.stringify(vocabulary)+';\n\n'+collector+'\n'+handler);
console.log('Bundled worker synchronized; '+vocabulary.length+' vocabulary entries preserved.');
