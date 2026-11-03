const assert=require('node:assert/strict');
module.exports=async function profileAccount(page,width){
 const mobile=width<721,area=mobile?'#drawer .drawer-route-nav':'.side-nav';
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const saved=await page.evaluate(()=>localStorage.getItem('hsk-flashcards-progress-v1'));
 async function entry(name){if(mobile)await page.locator('#menuBtn').click();await page.locator(area+' [data-studio-go="'+name+'"]').click();}
 for(const theme of ['light','dark']){
  await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;HSKStudio.navigate('home');},theme);
  await entry('profile');await page.waitForFunction(()=>document.getElementById('activeTitle').textContent==='Hồ sơ');
  assert(await page.locator('#accountProfileView').isVisible());assert(!await page.locator('#accountSettingsView').isVisible());
  assert.equal(await page.locator(area+' [data-studio-go="profile"]').count(),1);assert.equal(await page.locator(area+' [data-studio-go="account"]').count(),1);assert.equal(await page.locator('[data-account-section]').count(),0,'no two-option account tabs');
  assert.equal(await page.locator(area+' [data-studio-go="profile"][aria-current="page"]').count(),1);
  if(mobile){assert(await page.locator('#mobileProfileSummary').isVisible());assert(!await page.locator('#mobileAccountAuth').isVisible());}
  await page.screenshot({path:'/tmp/profile-split-'+width+'-'+theme+'.png',fullPage:true});
  await entry('account');await page.waitForFunction(()=>document.getElementById('activeTitle').textContent==='Tài khoản');
  assert(await page.locator('#accountSettingsView').isVisible());assert(!await page.locator('#accountProfileView').isVisible());
  if(mobile){assert(!await page.locator('#mobileProfileSummary').isVisible());await page.locator('#mobileAccountAuth').evaluate(n=>n.open=true);}
  await page.evaluate(()=>document.getElementById('accountStatus').textContent='Trạng thái đồng bộ kiểm thử');await page.waitForFunction(()=>document.getElementById('accountSettingsStatus').textContent==='Trạng thái đồng bộ kiểm thử');assert(await page.locator(mobile?'#accountStatus':'#accountSettingsStatus').isVisible());assert.equal(await page.locator('#accountSettingsStatus').isVisible(),!mobile,'one visible auth status per viewport');assert(await page.locator('#accountRestore').isVisible());assert.equal(await page.locator('#accountForm').count(),1);
  for(const signed of [true,false]){await page.evaluate(signed=>{document.getElementById('accountForms').hidden=signed;document.getElementById('accountSigned').hidden=!signed;},signed);assert.equal(await page.locator('#accountForms').isVisible(),!signed);assert.equal(await page.locator('#accountSigned').isVisible(),signed);}
  await page.screenshot({path:'/tmp/account-split-'+width+'-'+theme+'.png',fullPage:true});
  await page.locator('#headerInfo').click();await page.waitForFunction(()=>document.getElementById('activeTitle').textContent==='Hồ sơ');await page.locator('#headerInfo').click();await page.waitForFunction(()=>document.body.dataset.studioHub==='home');
  for(const name of ['profile','account']){await entry(name);await entry(name);await page.waitForFunction(()=>document.body.dataset.studioHub==='home');}
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 }
 assert.equal(await page.evaluate(()=>localStorage.getItem('hsk-flashcards-progress-v1')),saved);
 await page.evaluate(()=>{HSKStudio.navigate('profile');document.getElementById('accountBtn').click();});await page.waitForFunction(()=>document.getElementById('accountPanel').dataset.accountCurrent==='settings');assert(await page.locator('#accountSettingsView').isVisible(),'legacy sign-in entry still opens Account');assert.deepEqual(errors,[]);console.log('PASS independent Profile/Account '+width+': menu, avatar, repeat Home, auth/backup, no tabs, preserved progress, light/dark');
};
