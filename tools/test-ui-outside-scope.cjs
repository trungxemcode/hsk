const {test}=require('node:test'),assert=require('node:assert/strict');
const {ROUTES,scope,pixels,visualPixels}=require('./ui-outside-scope-core.cjs');
test('only explicitly requested page is excluded; unknown/all-page bypass rejected',()=>{
  const protectedPages=scope({request:'Sửa A (Tài khoản)',excludedRoutes:['account']});
  assert.ok(!protectedPages.includes('account'));assert.ok(protectedPages.includes('lessons'));
  assert.equal(protectedPages.length,ROUTES.length-1);
  assert.throws(()=>scope({request:'',excludedRoutes:[]}));
  assert.throws(()=>scope({request:'test',excludedRoutes:['*']}));
  assert.throws(()=>scope({request:'test',excludedRoutes:ROUTES}));
});
test('perceptual comparison rejects one real pixel change and dimensions; ignores raster rounding',()=>{
  const a={width:1,height:1,data:Buffer.from([255,255,255,255])};
  assert.equal(visualPixels(a,a),0);
  assert.equal(visualPixels(a,{...a,data:Buffer.from([254,254,255,255])}),0);
  assert.equal(visualPixels(a,{...a,data:Buffer.from([0,0,0,255])}),1);
  assert.equal(visualPixels(a,{...a,width:2}),Infinity);
});
test('a single altered pixel or image dimensions fails; identical image passes',()=>{
  const a={width:1,height:1,data:Buffer.from([255,255,255,255])};
  assert.equal(pixels(a,a).changed,0);
  assert.equal(pixels(a,{...a,data:Buffer.from([250,255,255,255])}).changed,1);
  assert.equal(pixels(a,{...a,width:2}).changed,Infinity);
});
test('rounded-edge raster sample differs from a real isolated pixel edit',()=>{
  const img=()=>({width:3,height:3,data:Buffer.from(Array.from({length:9},(_,i)=>[i%2?0:255,i%2?0:255,i%2?0:255,255]).flat())});
  const a=img(),b=img();a.data.set([85,85,85,255],16);b.data.set([120,120,120,255],16);
  assert.equal(visualPixels(a,b),0,'isolated mixed edge sample');
  const white={width:3,height:3,data:Buffer.alloc(36,255)},dot={...white,data:Buffer.from(white.data)};
  dot.data.set([0,0,0,255],16);assert.equal(visualPixels(white,dot),1,'real one-pixel edit must fail');
});
