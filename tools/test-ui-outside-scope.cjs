const {test}=require('node:test'),assert=require('node:assert/strict');
const {ROUTES,scope,pixels}=require('./ui-outside-scope-core.cjs');
test('only explicitly requested page is excluded; unknown/all-page bypass rejected',()=>{
  const protectedPages=scope({request:'Sửa A (Tài khoản)',excludedRoutes:['account']});
  assert.ok(!protectedPages.includes('account'));assert.ok(protectedPages.includes('lessons'));
  assert.equal(protectedPages.length,ROUTES.length-1);
  assert.throws(()=>scope({request:'',excludedRoutes:[]}));
  assert.throws(()=>scope({request:'test',excludedRoutes:['*']}));
  assert.throws(()=>scope({request:'test',excludedRoutes:ROUTES}));
});
test('a single altered pixel or image dimensions fails; identical image passes',()=>{
  const a={width:1,height:1,data:Buffer.from([255,255,255,255])};
  assert.equal(pixels(a,a).changed,0);
  assert.equal(pixels(a,{...a,data:Buffer.from([250,255,255,255])}).changed,1);
  assert.equal(pixels(a,{...a,width:2}).changed,Infinity);
});
