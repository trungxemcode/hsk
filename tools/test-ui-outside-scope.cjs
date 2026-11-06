const {test}=require('node:test'),assert=require('node:assert/strict');
const {ROUTES,scope,pixels,visualPixels,canRecaptureGeometryOnly}=require('./ui-outside-scope-core.cjs');
test('only explicitly requested page is excluded; unknown/all-page bypass rejected',()=>{
  const protectedPages=scope({request:'Sửa A (Tài khoản)',excludedRoutes:['account']});
  assert.ok(!protectedPages.includes('account'));assert.ok(protectedPages.includes('lessons'));
  assert.equal(protectedPages.length,ROUTES.length-1);
  assert.throws(()=>scope({request:'',excludedRoutes:[]}));
  assert.throws(()=>scope({request:'test',excludedRoutes:['*']}));
  assert.throws(()=>scope({request:'test',excludedRoutes:ROUTES}));
});
test('new AI Q&A navigation is declared and its real page is captured, never silently excluded',()=>{
  const {addedRoutesFromNavigation}=require('./ui-outside-scope-core.cjs');
  const base='<button data-studio-go="search"></button>';
  const head=base+'<button data-studio-go="ai-qa"></button><section data-studio-hub-panel="ai-qa"></section>';
  const config={request:'Add AI Q&A',excludedRoutes:[],newRoutes:['ai-qa'],sharedNavigationOnly:true};
  assert.deepEqual(addedRoutesFromNavigation(base,head,config),['ai-qa']);
  assert.ok(scope(config).includes('ai-qa'),'New page must stay in CI coverage');
  assert.throws(()=>addedRoutesFromNavigation(base,head,{...config,newRoutes:[]}));
  assert.throws(()=>addedRoutesFromNavigation(base,head.replace('data-studio-hub-panel','data-nothing'),config));
  assert.throws(()=>addedRoutesFromNavigation(base,head,{...config,sharedNavigationOnly:false}));
  assert.throws(()=>scope({...config,excludedRoutes:['ai-qa']}));
});

test('Profile and Account split are verified by actual account page, not only show-account CSS',()=>{
  const {routeIsOpen}=require('./ui-outside-scope-core.cjs');
  const state={hub:'',active:'learn',classes:'studio-enabled mobile-ux show-account',accountCurrent:'profile'};
  assert.equal(routeIsOpen('profile',state),true);
  assert.equal(routeIsOpen('account',state),false);
  assert.equal(routeIsOpen('profile',{...state,accountCurrent:'settings'}),false);
  assert.equal(routeIsOpen('account',{...state,accountCurrent:'settings'}),true);
  assert.equal(routeIsOpen('profile',{...state,classes:'studio-enabled show-lessons'}),false);
  assert.equal(routeIsOpen('lessons',{...state,classes:'studio-enabled show-lessons'}),true);
  assert.equal(routeIsOpen('home',{...state,hub:'home',classes:'studio-enabled'}),true);
  assert.equal(scope({request:'Only Account settings update buttons',excludedRoutes:['account']}).includes('profile'),true);
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

test('rerun replaces stale visual report artifacts rather than reusing failed snapshots',()=>{
  const workflow=require('node:fs').readFileSync('.github/workflows/ui-outside-scope.yml','utf8');
  const upload=workflow.split('    - name: Keep before, after, diff and report')[1]?.split('    strategy:')[0];
  assert.ok(upload?.includes('uses: actions/upload-artifact@v4'),'visual snapshots must be uploaded');
  assert.match(upload,/^        overwrite: true$/m,'retry uploads must replace artifacts from prior attempts');
});

test('only re-capture geometry-only mismatches; never retry true visual regressions',()=>{
  const mismatch={geometryEqual:false,imageCountEqual:true,changedPixels:0,elementCountEqual:true};
  assert.equal(canRecaptureGeometryOnly(mismatch),true);
  for(const bad of [{changedPixels:1},{geometryEqual:true},{imageCountEqual:false},{elementCountEqual:false}]){
    assert.equal(canRecaptureGeometryOnly({...mismatch,...bad}),false);
  }
});

test('shared header requests preserve ALL route visual comparisons',()=>{
 assert.deepEqual(scope({request:'Unify hamburger geometry everywhere',excludedRoutes:[],sharedHeaderOnly:true}),ROUTES);
 assert.throws(()=>scope({request:'Unify hamburger geometry everywhere',excludedRoutes:['account'],sharedHeaderOnly:true}));
 assert.throws(()=>scope({request:'Unify hamburger geometry everywhere',excludedRoutes:[],sharedHeaderOnly:'true'}));
});

test('shared header normalization leaves the route content geometry strict',()=>{
 const src=require('node:fs').readFileSync(require('node:path').join(__dirname,'check-ui-outside-scope.cjs'),'utf8');
 assert.ok(src.includes('page.evaluate(measureDOM,{skipHeader:config.sharedHeaderOnly===true,skipSidebar:config.sharedSidebarOnly===true||config.sharedNavigationOnly===true,skipClosedMobileDrawerBody:config.sharedMobileDrawerOnly===true||config.sharedNavigationOnly===true})'));
 const fn=require('./ui-outside-scope-core.cjs').measureDOM;
 assert.match(fn.toString(),/options.skipHeader/);
});

test("sidebar scope protects every route and only allows a boolean flag",()=>{assert.equal(scope({request:"Regroup sidebar",excludedRoutes:[],sharedSidebarOnly:true}).length,ROUTES.length);assert.throws(()=>scope({request:"Regroup sidebar",excludedRoutes:["home"],sharedSidebarOnly:true}));assert.throws(()=>scope({request:"Regroup sidebar",excludedRoutes:[],sharedSidebarOnly:"true"}));const fn=require("./ui-outside-scope-core.cjs").measureDOM;assert.match(fn.toString(),/options.skipSidebar/);assert.match(fn.toString(),/closest\('\.sidebar'\)/);});

test('shared quick navigation scope compares all routes and validates narrow normalization',()=>{
 assert.deepEqual(scope({request:'Enlarge desktop quick navigation',excludedRoutes:[],sharedQuickNavOnly:true}),ROUTES);
 assert.throws(()=>scope({request:'Enlarge desktop quick navigation',excludedRoutes:['home'],sharedQuickNavOnly:true}));
 assert.throws(()=>scope({request:'Enlarge desktop quick navigation',excludedRoutes:[],sharedQuickNavOnly:'true'}));
 assert.throws(()=>scope({request:'Enlarge desktop quick navigation',excludedRoutes:[],sharedQuickNavOnly:true,sharedHeaderOnly:true}));
 const source=require('node:fs').readFileSync(require('node:path').join(__dirname,'check-ui-outside-scope.cjs'),'utf8');
 assert.match(source,/config.sharedQuickNavOnly/);
 assert.match(source,/\.side-quick button svg\{width:16px!/);
 assert.match(source,/@media\(min-width:721px\)/);
});

test('mobile drawer scope preserves all routes and forbids unrelated exclusions',()=>{
 assert.deepEqual(scope({request:'Mobile drawer',excludedRoutes:[],sharedMobileDrawerOnly:true}),ROUTES);
 for(const value of ['true',1])assert.throws(()=>scope({request:'Mobile drawer',excludedRoutes:[],sharedMobileDrawerOnly:value}));
 assert.throws(()=>scope({request:'Mobile drawer',excludedRoutes:['home'],sharedMobileDrawerOnly:true}));
 assert.throws(()=>scope({request:'Mobile drawer',excludedRoutes:[],sharedMobileDrawerOnly:true,sharedSidebarOnly:true}));
});

test('combined navigation scope preserves every route and only the two navigation regions',()=>{
 assert.deepEqual(scope({request:'Simplify both menus',excludedRoutes:[],sharedNavigationOnly:true}),ROUTES);
 assert.throws(()=>scope({request:'Simplify menus',excludedRoutes:['search'],sharedNavigationOnly:true}));
 assert.throws(()=>scope({request:'Simplify menus',excludedRoutes:[],sharedNavigationOnly:'true'}));
 assert.throws(()=>scope({request:'Simplify menus',excludedRoutes:[],sharedNavigationOnly:true,sharedHeaderOnly:true}));
});

test('Profile/Account split scopes exactly the two pages plus navigation',()=>{assert.equal(scope({request:'Separate profile/account',excludedRoutes:['account','profile'],sharedNavigationOnly:true}).length,ROUTES.length-2);assert.throws(()=>scope({request:'Bad unrelated scope',excludedRoutes:['account','profile','home'],sharedNavigationOnly:true}));});
