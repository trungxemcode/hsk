/* Prove guard repairs do not hide real outside-scope changes. */
const {chromium}=require('playwright'),{PNG}=require('pngjs'),assert=require('node:assert/strict');
const {measureDOM,visualPixels}=require('./ui-outside-scope-core.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
 try{
  const page=await browser.newPage({viewport:{width:390,height:300}});
  const reset=()=>page.setContent('<style>body{background:white}#box{font:24px monospace;color:rgb(20,20,20);padding:16px;width:220px;border-radius:12px;background:linear-gradient(45deg,#fff,#eee)}</style><div id="box">ABC</div>');
  const snap=async()=>({geometry:await page.evaluate(measureDOM),image:PNG.sync.read(await page.screenshot())});
  await reset();const baseline=await snap();
  const identical=await snap();assert.deepEqual(identical.geometry,baseline.geometry);assert.equal(visualPixels(baseline.image,identical.image),0);
  for(const [name,style] of [['one pixel movement','margin-left:1px'],['subtle CSS color','color:rgb(21,20,20)'],['corner radius','border-radius:13px'],['gradient','background:linear-gradient(45deg,#fff,#eed)']]){
   await reset();await page.locator('#box').evaluate((n,style)=>n.style.cssText+=style,style);
   const changed=await snap();assert.notDeepEqual(changed.geometry,baseline.geometry,'Missed '+name);
  }
  await reset();await page.locator('#box').evaluate(n=>n.textContent='ADC');const text=await snap();
  assert.ok(visualPixels(baseline.image,text.image)>0,'Changed letter must fail the pixel gate');
  assert.notDeepEqual(text.geometry,baseline.geometry,'Visible text is also protected independently of rasterization');
  await page.setContent('<svg width="20" height="20"><path d="M0 0L10 10"/></svg>');const svg=await page.evaluate(measureDOM);
  await page.locator('path').evaluate(n=>n.setAttribute('d','M0 0L11 10'));
  assert.notDeepEqual(await page.evaluate(measureDOM),svg,'SVG path edits must be protected independently of rasterization');
  console.log('PASS guard browser control: identical stable; 1px movement, subtle CSS color, radius, gradient and text changes detected');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
