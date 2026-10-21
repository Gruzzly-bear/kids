const {chromium}=require('C:/Users/Gruzz/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const {startServer}=await import('../tests/test-server.js');const {server}=await startServer(4175);let browser;try{
 browser=await chromium.launch({headless:true,channel:'chrome'});const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));let catalogRequests=0;page.on('request',r=>{if(r.url().includes('/api/page-pals-catalog')&&!r.url().includes('manifest'))catalogRequests++;});
 await page.goto('http://127.0.0.1:4175');await page.getByRole('button',{name:'Parent sign in',exact:true}).click();await page.getByLabel('Password',{exact:true}).fill('test-password');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('heading',{name:'Parent dashboard',exact:true}).waitFor();
 assert.equal(catalogRequests,0);assert.equal(await page.locator('.header-actions').getByRole('button',{name:'Page Pals',exact:true}).count(),0);assert.equal(await page.locator('.dashboard-point-rules').count(),1);
 await page.getByRole('button',{name:'⭐ Rewards Store',exact:true}).click();await page.locator('.store-departments').waitFor();await page.waitForTimeout(300);assert.equal(catalogRequests,0);
 await page.getByRole('button',{name:/Page Pals.*Try any/}).click();await page.locator('.pal-card').first().waitFor();assert.equal(catalogRequests,1);assert.equal(await page.locator('.pal-card h4').first().innerText(),'Jollyjack');
 for(let n=1;n<26;n++){
  await page.getByRole('button',{name:'Next',exact:true}).first().click();
  await page.waitForFunction(n=>state.palBrowse.page===n&&document.querySelector('.pal-card'),n);
  const ids=await page.locator('[data-pal-form]').evaluateAll(es=>es.filter(e=>e.options.length>1).map(e=>e.dataset.palForm));
  for(const id of ids){
   const select=page.locator('[data-pal-form="'+id+'"]');await select.selectOption('1');
   const card=page.locator('.pal-card').filter({has:select});
   assert.equal(await card.locator('option:checked').getAttribute('value'),'1');
   assert((await card.locator('.pal-preview image').getAttribute('href')).includes(id+'-'));
  }
  if(ids.length){const card=page.locator('.pal-card').filter({has:page.locator('[data-pal-form="'+ids[0]+'"]')});await card.getByRole('button',{name:'Equip free',exact:true}).click();assert.equal(await card.getByRole('button',{name:'Equipped',exact:true}).count(),1);assert.equal(await page.locator('#page-pal').count(),1);}
  assert.equal(await page.locator('.pal-pagination [aria-current="page"]').count(),2);
  if(n===3){await page.locator('.pal-pagination').first().getByRole('button',{name:'Page 4',exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:'tmp/pal-pages-desktop.png'});}
 }
 assert(await page.getByRole('button',{name:'Next',exact:true}).first().isDisabled());
 await page.locator('.pal-pagination').last().getByRole('button',{name:'Page 1',exact:true}).click();await page.waitForFunction(()=>state.palBrowse.page===0);
 await page.setViewportSize({width:390,height:844});
 await page.locator('.pal-pagination').first().getByRole('button',{name:'Page 3',exact:true}).click();await page.waitForFunction(()=>state.palBrowse.page===2&&document.querySelector('.pal-card'));
 assert(await page.locator('dialog').evaluate(el=>el.scrollWidth<=el.clientWidth));
 await page.locator('.pal-pagination').first().scrollIntoViewIfNeeded();await page.screenshot({path:'tmp/pal-pages-mobile.png'});
 assert.deepEqual(errors,[]);console.log('All 26 pages, available alternate forms, free equip on every page, top/bottom numbered navigation and mobile layout passed.'); }finally{await browser?.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1});
