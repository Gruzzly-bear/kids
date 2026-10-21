const {chromium}=require('C:/Users/Gruzz/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const {startServer}=await import('../tests/test-server.js');const {server}=await startServer(4175);let browser;try{
 browser=await chromium.launch({headless:true,channel:'chrome'});const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));let catalogRequests=0;page.on('request',r=>{if(r.url().includes('/api/page-pals-catalog')&&!r.url().includes('manifest'))catalogRequests++;});
 await page.goto('http://127.0.0.1:4175');await page.getByRole('button',{name:'Parent sign in',exact:true}).click();await page.getByLabel('Password',{exact:true}).fill('test-password');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('heading',{name:'Parent dashboard',exact:true}).waitFor();
 assert.equal(catalogRequests,0);assert.equal(await page.locator('.header-actions').getByRole('button',{name:'Page Pals',exact:true}).count(),0);assert.equal(await page.locator('.dashboard-point-rules').count(),1);
 await page.getByRole('button',{name:'⭐ Rewards Store',exact:true}).click();await page.locator('.store-departments').waitFor();await page.waitForTimeout(300);assert.equal(catalogRequests,0);
 await page.getByRole('button',{name:/Page Pals.*Try any/}).click();await page.locator('.pal-card').first().waitFor();assert.equal(catalogRequests,1);assert.equal(await page.locator('.pal-card h4').first().innerText(),'Jollyjack');
 await page.getByRole('button',{name:'Next',exact:true}).first().click();const select=page.locator('[data-pal-form="025"]');assert.equal(catalogRequests,2);assert.equal(await page.locator('.pal-card').count(),24);await select.selectOption('1');assert((await page.locator('.pal-pagination').first().innerText()).includes('Page 2'));assert.equal(await select.inputValue(),'1');
 await page.getByRole('button',{name:'Store',exact:true}).click();await page.getByRole('button',{name:/Appearance.*Themes/}).click();await page.getByRole('heading',{name:'Themes',exact:true}).waitFor();await page.getByRole('button',{name:'Store',exact:true}).click();await page.getByRole('button',{name:/Rewards.*Add and manage/}).click();await page.getByRole('heading',{name:'Rewards',exact:true}).waitFor();
 await page.getByRole('button',{name:'Store',exact:true}).click();await page.setViewportSize({width:390,height:844});await page.screenshot({path:'tmp/store-home-mobile.png'});assert(await page.locator('dialog').evaluate(el=>el.scrollWidth<=el.clientWidth));
 await page.getByRole('button',{name:'Close dialog'}).click();
 await page.evaluate(async()=>acceptAuth(await fetchAuth({role:'monitor'}),{role:'monitor'}));
 await page.getByRole('button',{name:'⭐ Rewards Store',exact:true}).click();await page.locator('.store-departments').waitFor();await page.getByRole('button',{name:/Page Pals.*Try any/}).click();await page.locator('.pal-card').first().waitFor();assert.equal(catalogRequests,2);
 await page.getByRole('button',{name:'Close dialog'}).click();await page.evaluate(async()=>acceptAuth(await fetchAuth({role:'leon',password:'test-password'}),{role:'leon',password:'test-password'}));
 assert.equal(await page.locator('.dashboard-point-rules').count(),1);await page.getByRole('button',{name:/points.*Rewards Store/}).click();await page.locator('.store-wallet').waitFor();await page.getByRole('button',{name:/Page Pals.*Find your/}).click();await page.locator('.pal-card').first().waitFor();assert.equal(await page.locator('.pal-card h4').first().innerText(),'Jollyjack');
await page.getByRole('button',{name:'Close dialog'}).click();
 await page.evaluate(async()=>{
 const post=body=>fetch('/api/assignments',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
 await post({role:'parent',password:'test-password',rewardAction:'awardPoints',id:'hop-test',student:'leon',points:50});
 const r=await (await post({role:'leon',password:'test-password',rewardAction:'buyPal',id:'001',stage:0})).json();state.rewards=r.rewards;
 await post({role:'leon',password:'test-password',rewardAction:'equipPal',id:'001'});
 acceptAuth(await fetchAuth({role:'leon',password:'test-password'}),{role:'leon',password:'test-password'});
 });
 await page.locator('#page-pal').waitFor();
 for(const roaming of ['full','reduced']){
 await page.evaluate(roaming=>{localWrite('page-pal-motion',roaming);document.getElementById('page-pal')?.remove();renderPagePal();},roaming);
 for(let i=0;i<3;i++){
 await page.locator('#page-pal').click({force:true});
 assert.equal(await page.locator('#page-pal .pal-art').evaluate(el=>getComputedStyle(el).animationName),'pal-click-hop');
 await page.waitForTimeout(150);assert(await page.locator('#page-pal .pal-art').evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).m42<0));
 await page.waitForTimeout(1450);
 assert.equal(await page.locator('#page-pal').evaluate(el=>el.classList.contains('pal-paused')),false);
 }
 }
 await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>{state.preferences.leon={...prefs(),motion:'reduced'};applyPreferences();});
 await page.locator('#page-pal').click({force:true});assert.equal(await page.locator('#page-pal .pal-art').evaluate(el=>getComputedStyle(el).animationName),'pal-click-hop');assert.equal(await page.locator('#page-pal .pal-art').evaluate(el=>getComputedStyle(el).animationDuration),'0.4s');
 assert.deepEqual(errors,[]);console.log('Child click hop always animates, including with old paused settings and device/profile reduced motion.');
 }finally{await browser?.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1});
