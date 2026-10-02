const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async()=>{
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const base='http://127.0.0.1:4173';
  const login=async role=>{
    await page.goto(base);await page.getByRole('button',{name:role==='parent'?'Parent sign in':role==='leon'?'Leon':'Logan',exact:role==='parent'}).click();
    await page.getByLabel('Password',{exact:true}).fill('test-password');await page.getByRole('button',{name:'Sign in',exact:true}).click();
    await page.getByRole('heading',{name:role==='parent'?'Parent dashboard':role==='leon'?'Leon’s school day':'Logan’s school day',exact:true}).waitFor();
  };
  const saved=async()=>await page.locator('#sync-status').filter({hasText:'All changes saved'}).waitFor();
  await login('leon');
  console.log('Signed in as Leon');
  await page.getByRole('button',{name:'I need help',exact:true}).first().click();await saved();
  assert.equal(await page.locator('.work-section.today').getByText('Needs help',{exact:true}).count(),1);
  await page.locator('.work-section.today input[type=checkbox]').click();await saved();
  await page.getByRole('button',{name:'Undo',exact:true}).click();await saved();
  assert.equal(await page.locator('.work-section.today input[type=checkbox]').isChecked(),false);
  console.log('Completion and undo verified');
  await page.getByRole('button',{name:'Settings',exact:true}).click();
  await page.getByRole('combobox',{name:'Text size',exact:true}).selectOption('large');
  await page.getByRole('combobox',{name:'Spacing',exact:true}).selectOption('compact');
  await page.getByRole('combobox',{name:'Appearance',exact:true}).selectOption('dark');
  await page.getByRole('button',{name:'High Contrast Dark',exact:true}).click();await saved();
  await page.getByRole('button',{name:'Close dialog'}).click();
  await page.reload();await page.getByRole('heading',{name:'Leon’s school day',exact:true}).waitFor();
  assert.equal(await page.locator('html').getAttribute('data-size'),'large');
  assert.equal(await page.locator('html').getAttribute('data-theme'),'contrast-dark');
  console.log('Settings reload verified');
  await page.getByRole('button',{name:'Settings',exact:true}).click();
  await page.getByRole('combobox',{name:'Text size',exact:true}).selectOption('standard');await page.getByRole('combobox',{name:'Spacing',exact:true}).selectOption('comfortable');await page.getByRole('combobox',{name:'Appearance',exact:true}).selectOption('light');
  await page.getByLabel('Show class browser on dashboard').check();await saved();await page.getByRole('button',{name:'Close dialog'}).click();
  await page.getByRole('button',{name:'Math',exact:false}).click();await page.getByLabel('Hide completed').uncheck();await saved();
  await page.getByRole('button',{name:'All work',exact:true}).click();
  assert(await page.getByText('Completed practice',{exact:true}).last().isVisible());
  await page.getByRole('button',{name:'Back to dashboard',exact:false}).click();
  console.log('Class browser verified');
  // Failure remains visible and durable across reload; later edits retain order.
  await page.route('**/api/assignments',route=>route.abort());
  await page.getByRole('button',{name:'Clear help request',exact:true}).first().click();
  await page.locator('#sync-status.failed').waitFor();
  await page.reload();await page.locator('#sync-status.failed').waitFor();
  await page.unroute('**/api/assignments');await page.locator('#sync-status').getByRole('button',{name:'Retry',exact:true}).click();await saved();
  console.log('Durable retry verified');
  await page.screenshot({path:'tmp/dashboard-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'tmp/dashboard-mobile.png',fullPage:true});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile dashboard has no horizontal overflow');
  await page.locator('.work-section.ahead').getByRole('button',{name:'I need help',exact:true}).click();await saved();
  await page.getByRole('button',{name:'Sign out',exact:true}).click();await login('logan');
  assert.equal(await page.locator('html').getAttribute('data-size'),'standard','Profiles retain separate preferences');
  await page.getByRole('button',{name:'Sign out',exact:true}).click();await login('parent');
  assert(await page.getByRole('heading',{name:'The next seven days'}).isVisible());
  assert.equal(await page.locator('.help-request').count(),1,'Parent sees the child help request');
  await page.locator('.help-request').getByRole('button',{name:'Clear request',exact:true}).click();await saved();assert.equal(await page.locator('.help-request').count(),0);
  console.log('Parent sign-in verified');
  await page.getByRole('button',{name:'Assignments',exact:true}).click();
  await page.getByRole('button',{name:'Add assignment',exact:true}).click();
  await page.getByLabel('Title',{exact:true}).fill('Browser-created task');await page.getByLabel('Assignment link', {exact:false}).fill('https://example.com/task?x=1&y=2');
  await page.getByRole('button',{name:'Add assignment',exact:true}).last().click();await saved();
  const row=page.locator('.editor-assignment').filter({hasText:'Browser-created task'});
  assert.equal(await row.getByRole('link',{name:'Open assignment',exact:false}).getAttribute('href'),'https://example.com/task?x=1&y=2');
  await row.getByRole('button',{name:'Edit',exact:true}).click();await page.getByLabel('Title',{exact:true}).fill('Edited browser task');await page.getByRole('button',{name:'Save changes',exact:true}).click();await saved();
  await page.locator('.editor-assignment').filter({hasText:'Edited browser task'}).getByRole('button',{name:'Remove',exact:true}).click();
  await page.getByRole('button',{name:'Remove assignment',exact:true}).click();await saved();await page.getByRole('button',{name:'Undo',exact:true}).click();await saved();
  await page.getByRole('button',{name:'Edit schedule',exact:true}).click();
  const scheduleCount=await page.locator('.schedule-row').count();
  await page.getByRole('button',{name:'Add class or break',exact:true}).click();await saved();assert.equal(await page.locator('.schedule-row').count(),scheduleCount+1);
  await page.locator('.schedule-row').last().getByRole('combobox',{name:'Class',exact:true}).selectOption('break');await saved();
  assert.equal(await page.locator('.schedule-row').last().getByRole('combobox',{name:'Class',exact:true}).inputValue(),'break');
  await page.getByRole('button',{name:'Close dialog'}).click();
  await page.getByRole('button',{name:'Edit reminders',exact:true}).click();
  await page.getByLabel('Reminder 1',{exact:true}).first().fill('Remember your water bottle');await page.getByLabel('Reminder 2',{exact:true}).first().click();await saved();
  await page.getByRole('button',{name:'Close dialog'}).click();
  await page.getByRole('button',{name:'Import assignments',exact:true}).click();
  await page.locator('#import-text').fill('Imported practice\nMon, Oct 5, 2026, 11:59 PM');
  await page.getByRole('button',{name:'Preview import',exact:true}).click();assert(await page.locator('#import-preview').getByText('Imported practice',{exact:true}).isVisible());
  await page.getByRole('button',{name:'Apply new items and missing dates',exact:true}).click();await saved();
  const imported=page.locator('.editor-assignment').filter({hasText:'Imported practice'});assert(await imported.getByText('Due Oct 5',{exact:true}).isVisible(),'Late-night imports stay on their written calendar date');
  await page.getByRole('button',{name:'Weekly overview',exact:true}).click();
  await page.screenshot({path:'tmp/dashboard-parent-mobile.png',fullPage:true});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Parent mobile has no overflow');
  await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'tmp/dashboard-parent-desktop.png',fullPage:true});
  await page.getByRole('button',{name:'Sign out',exact:true}).click();await page.getByRole('button',{name:'Shared school dashboard',exact:true}).click();await page.getByRole('heading',{name:'Our school day'}).waitFor();
  assert.equal(await page.getByRole('link',{name:'Support Portal',exact:false}).count(),0);assert.equal(await page.getByRole('link',{name:'Focus Parent Portal',exact:false}).count(),1);
  assert.equal(await page.locator('.completion input:not([disabled])').count(),0);
  await page.evaluate(()=>document.activeElement.blur());
  await page.screenshot({path:'tmp/dashboard-shared.png',fullPage:true});
  // Theme contrast checks use actual computed colors, including color-mix surfaces.
  const contrastIssues=await page.evaluate(()=>{
    const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});canvas.width=canvas.height=1;
    const rgb=color=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return Array.from(ctx.getImageData(0,0,1,1).data).slice(0,3);};
    const luminance=color=>rgb(color).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((sum,x,i)=>sum+x*[.2126,.7152,.0722][i],0);
    const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
    const issues=[];
    for(const [key] of Object.entries(THEME_PALETTES)){
      const dark=DARK_THEME_KEYS.includes(key);state.preferences.monitor={...DEFAULT_PREFS,appearance:dark?'dark':'light',[dark?'darkTheme':'lightTheme']:key};
      localStorage.removeItem('school-preferences-monitor');applyPreferences();
      for(const [fg,bg] of [['--ink','--surface'],['--muted','--surface'],['--muted','--surface-2'],['--accent','--surface'],['--accent','--surface-2']]){
        const sample=document.createElement('span');sample.style.color=`var(${fg})`;sample.style.backgroundColor=`var(${bg})`;document.body.append(sample);const css=getComputedStyle(sample),result=ratio(css.color,css.backgroundColor);if(result<4.5)issues.push({theme:key,fg,bg,ratio:result});sample.remove();
      }
      for(const status of ['late','today','complete','help']){const sample=document.createElement('span');sample.className='status-chip '+status;document.body.append(sample);const css=getComputedStyle(sample),result=ratio(css.color,css.backgroundColor);if(result<4.5)issues.push({theme:key,status,ratio:result});sample.remove();}
    }
    return issues;
  });
  assert.deepEqual(contrastIssues,[],'Theme text and status chips meet 4.5:1 contrast');
  await page.setViewportSize({width:320,height:760});
  await page.evaluate(()=>{state.preferences.monitor={...DEFAULT_PREFS,textSize:'large'};render();});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Large text fits a 320px shared dashboard');
  await page.getByRole('button',{name:'Settings',exact:true}).click();
  assert(await page.locator('dialog').evaluate(node=>node.scrollWidth<=node.clientWidth),'Large-text settings do not overflow');
  await page.keyboard.press('Escape');assert.equal(await page.locator('dialog').count(),0,'Escape closes native dialog');
  assert.deepEqual(errors,[],'No browser JavaScript errors');
  console.log('Browser checks passed: sign-in, complete/undo, help, profile settings, dark/high-contrast, durable retry, links, CRUD/undo, schedules, reminders, imports, weekly overview, shared read-only view, desktop and mobile layouts.');
  await browser.close();
})().catch(error=>{console.error(error);process.exit(1);});
