const fs=require('node:fs'),path=require('node:path'),{createCanvas}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'..'),assetDir=path.resolve(process.argv[2]||'');if(!process.argv[2])throw Error('Usage: node tools/check-handwriting-neural.cjs ASSET_DIRECTORY [report.json]');const core=require(path.join(root,'handwriting-neural-core.js')),ort=require(path.join(assetDir,'ort.wasm.min.js'));
(async()=>{
 ort.env.wasm.numThreads=1;ort.env.logLevel='error';
 const s=await ort.InferenceSession.create(fs.readFileSync(path.join(assetDir,'inference.onnx')),{executionProviders:['wasm']});
 const chars=JSON.parse(fs.readFileSync(path.join(root,'handwriting-neural-characters.json'))),supported=new Set(JSON.parse(fs.readFileSync(path.join(root,'handwriting-data.json'))).characters),fixtures=require(path.join(root,'tools/handwriting-fixtures.cjs')).fixtures;
 const results=[],times=[];let seed=9173;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
 for(const [label,strokes] of Object.entries(fixtures)){
  const variants=[['clean',strokes]];
  for(let n=0;n<6;n++)variants.push(['rough',strokes.map(s=>s.map(([x,y])=>[x*(.85+random()*.3)+(random()-.5)*5,y+(random()-.5)*5]))]);
  if(strokes.length>1)variants.push(['missing',strokes.slice(0,-1)]);
  for(const [kind,points] of variants){const t=performance.now(),tensor=new ort.Tensor('float32',core.render(points,createCanvas),[1,3,48,320]);const out=await s.run({[s.inputNames[0]]:tensor}),candidates=core.decode(out[s.outputNames[0]],chars,supported);times.push(performance.now()-t);const index=candidates.findIndex(c=>c.character===label);results.push({label,kind,rank:index<0?null:index+1,top:candidates.map(c=>c.character)});tensor.dispose();for(const v of Object.values(out))v.dispose();}
 }
 const metrics={};for(const kind of ['clean','rough','missing']){const rows=results.filter(r=>r.kind===kind);metrics[kind]={cases:rows.length,top1:rows.filter(r=>r.rank===1).length,top5:rows.filter(r=>r.rank!==null&&r.rank<=5).length};}
 times.sort((a,b)=>a-b);const report={engine:'ONNX Runtime Web 1.22.0 WASM / native Canvas rasterizer',model:'PP-OCRv5_mobile_rec',metrics,medianMs:times[Math.floor(times.length/2)],p95Ms:times[Math.floor(times.length*.95)],results,limitation:'Geometric development fixtures with native Canvas, not browser/device validation or real writer test.'};
 fs.writeFileSync(process.argv[3]||path.join(root,'content/handwriting-neural-evaluation.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({metrics,medianMs:report.medianMs,p95Ms:report.p95Ms}));
 if(metrics.clean.top1/metrics.clean.cases<.85||metrics.rough.top1/metrics.rough.cases<.85)process.exitCode=2;
})().catch(e=>{console.error(e);process.exitCode=1});
