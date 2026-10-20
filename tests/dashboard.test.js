import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from './test-server.js';
import { onRequestPost as auth } from '../functions/api/auth.js';
import { onRequestPost as save } from '../functions/api/assignments.js';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

async function post(handler,env,body){return handler({env,request:new Request('https://local.test/api',{method:'POST',body:JSON.stringify(body)})});}
const parent={role:'parent',password:'test-password'},leon={role:'leon',password:'test-password'};
test('assignment links and help requests persist, with student ownership enforced',async()=>{
  const env=await fixture();
  const change={type:'update',id:'leon-0',student:'leon',subject:'math',title:'Linked assignment',due:'2026-10-05',url:'https://school.example/assignment?x=1&y=2',needsHelp:false,done:false};
  assert.equal((await post(save,env,{...parent,change})).status,200);
  assert.equal((await post(save,env,{...parent,change})).status,200,'Retrying an add is idempotent');
  assert.equal((await post(save,env,{...leon,change:{type:'status',id:'leon-0',student:'leon',needsHelp:true}})).status,200);
  let data=await (await post(auth,env,leon)).json();
  const row=data.assignments.find(x=>x.id==='leon-0');assert.equal(row.url,change.url);assert.equal(row.needsHelp,true);
  assert(data.assignments.every(x=>x.student==='leon'));
  assert.equal((await post(save,env,{...leon,change:{type:'status',id:'logan-0',student:'logan',done:true}})).status,403);
  assert.equal((await post(save,env,{...leon,change})).status,403);
  assert.equal((await post(save,env,{...parent,change:{...change,url:'javascript:alert(1)'}})).status,400);
  await post(save,env,{...leon,change:{type:'status',id:'leon-0',student:'leon',done:true}});
  data=await (await post(auth,env,leon)).json();assert.equal(data.assignments.find(x=>x.id==='leon-0').needsHelp,false);
  await post(save,env,{...leon,change:{type:'status',id:'leon-0',student:'leon',done:false}});
  data=await (await post(auth,env,leon)).json();assert.equal(data.assignments.find(x=>x.id==='leon-0').done,0);
});
test('preferences sync per profile and retain existing schedules and cards',async()=>{
  const env=await fixture(),preferences={appearance:'dark',lightTheme:'forest',darkTheme:'midnight',textSize:'large',density:'compact',classBrowser:true};
  assert.equal((await post(save,env,{...leon,preferencesOnly:true,scope:'leon',preferences})).status,200);
  assert.equal((await post(save,env,{...leon,preferencesOnly:true,scope:'logan',preferences})).status,403);
  const data=await (await post(auth,env,leon)).json();assert.equal(data.preferences.leon.textSize,'large');assert.equal(data.preferences.leon.classBrowser,true);assert.deepEqual(data.schedules.leon.days,{});
  assert.equal((await post(save,env,{...parent,cardsOnly:true,cards:{leon:['Hello']}})).status,200);
  assert.equal((await (await post(auth,env,parent)).json()).cards.leon[0],'Hello');
  assert.equal((await post(save,env,{role:'monitor',change:{type:'status',id:'leon-0',student:'leon',done:true}})).status,401);
});
test('only parents can enable decorative fonts and student saves preserve that choice',async()=>{
  const env=await fixture();
  const write=(credentials,decorativeFonts)=>post(save,env,{...credentials,preferencesOnly:true,scope:'leon',preferences:{decorativeFonts}});
  const enabled=async()=> (await (await post(auth,env,leon)).json()).preferences.leon.decorativeFonts;
  await write(leon,true);assert.equal(await enabled(),false);
  await write(parent,true);assert.equal(await enabled(),true);
  await write(leon,false);assert.equal(await enabled(),true);
  await write(parent,false);assert.equal(await enabled(),false);
  await post(save,env,{...parent,preferencesOnly:true,scope:'leon',preferences:{allowedFonts:['montserrat','pokemon-gb']}});
  await post(save,env,{...leon,preferencesOnly:true,scope:'leon',preferences:{allowedFonts:['soffie']}});
  const data=await (await post(auth,env,leon)).json();
  assert.deepEqual(data.preferences.leon.allowedFonts,['montserrat','pokemon-gb'],'Students cannot change the parent font list');
});
test('parents control dashboard expansion and student settings preserve it',async()=>{
  const env=await fixture();
  const write=(credentials,dashboardExpanded)=>post(save,env,{...credentials,preferencesOnly:true,scope:'leon',preferences:{dashboardExpanded}});
  const expanded=async()=> (await (await post(auth,env,leon)).json()).preferences.leon.dashboardExpanded;
  await write(leon,true);assert.equal(await expanded(),false);
  await write(parent,true);assert.equal(await expanded(),true);
  await write(leon,false);assert.equal(await expanded(),true);
  await write(parent,false);assert.equal(await expanded(),false);
});
test('add, edit, remove, and undo retain metadata without a schema migration',async()=>{
  const env=await fixture(),change={type:'add',id:'new-task',student:'leon',subject:'math',title:'New task',due:'',url:'https://example.com',done:false};
  assert.equal((await post(save,env,{...parent,change})).status,200);
  assert.equal((await post(save,env,{...parent,change:{...change,type:'update',subject:'ela',needsHelp:true}})).status,200);
  assert.equal((await post(save,env,{...parent,change:{...change,type:'remove'}})).status,200);
  assert.equal((await post(save,env,{...parent,change:{...change,type:'remove'}})).status,200,'Retrying removal is idempotent');
  assert.equal(await env.DB.prepare('SELECT value FROM settings WHERE key=?').bind('assignment_meta_new-task').first(),null);
  assert.equal((await post(save,env,{...parent,change})).status,200);
});
test('saving separate schedule days concurrently preserves every day and adding assignments preserves existing data',async()=>{
  const env=await fixture();
  const original=JSON.parse((await env.DB.prepare('SELECT value FROM settings WHERE key=?').bind('leon_schedule').first()).value);
  original.days['2026-10-20']=[{subject:'math',time:'09:00'}];
  await env.DB.prepare('UPDATE settings SET value=? WHERE key=?').bind(JSON.stringify(original),'leon_schedule').run();

  const saveDay=(date,subject)=>post(save,env,{...parent,scheduleOnly:true,student:'leon',date,items:[{subject,time:'10:00'}]});
  const responses=await Promise.all([saveDay('2026-10-21','ela'),saveDay('2026-10-22','science')]);
  assert(responses.every(response=>response.status===200));

  const add=(id,title)=>post(save,env,{...parent,change:{type:'add',id,student:'leon',subject:'math',title,due:'2026-10-21'}});
  const added=await Promise.all([add('extra-math-1','Extra math 1'),add('extra-math-2','Extra math 2')]);
  assert(added.every(response=>response.status===200));

  const savedSchedule=JSON.parse((await env.DB.prepare('SELECT value FROM settings WHERE key=?').bind('leon_schedule').first()).value);
  assert.deepEqual(savedSchedule.days['2026-10-20'],[{subject:'math',time:'09:00'}]);
  assert.deepEqual(savedSchedule.days['2026-10-21'],[{subject:'ela',time:'10:00'}]);
  assert.deepEqual(savedSchedule.days['2026-10-22'],[{subject:'science',time:'10:00'}]);

  const assignments=await env.DB.prepare('SELECT id,title FROM assignments WHERE student=?').bind('leon').all();
  assert(assignments.results.some(row=>row.id==='leon-0'));
  assert(assignments.results.some(row=>row.id==='extra-math-1'&&row.title==='Extra math 1'));
  assert(assignments.results.some(row=>row.id==='extra-math-2'&&row.title==='Extra math 2'));
});
test('parent password changes require current credentials and preserve access',async()=>{
  const env=await fixture();
  assert.equal((await post(save,env,{...parent,password:'wrong',passwordOnly:true,nextPassword:'new-password'})).status,401);
  assert.equal((await post(save,env,{...parent,passwordOnly:true,nextPassword:'new-password'})).status,200);
  assert.equal((await post(auth,env,parent)).status,401);
  assert.equal((await post(auth,env,{...parent,password:'new-password'})).status,200);
});
test('imports preserve the written due date and capture schedule end times',()=>{
  const source=readFileSync(new URL('../school-core.js',import.meta.url),'utf8');
  const context=vm.createContext({Date,Intl,crypto});vm.runInContext(source,context);
  const rows=context.parsePastedAssignments('Practice quiz\nMon, Oct 5, 2026, 11:59 PM');assert.equal(rows[0].due,'2026-10-05');
  const schedule=context.parseSchedulePaste('Monday, October 5, 2026\nTrimble Math\nMath lesson\n9:00 AM to 9:45 AM','leon');
  assert(schedule.days['2026-10-05'].some(x=>x.time==='09:00'&&x.endTime==='09:45'));
});
test('Working Ahead chooses only the next unfinished due date across weekends',()=>{
  const source=readFileSync(new URL('../school.js',import.meta.url),'utf8');
  const fn=source.match(/function nextDueDate\([^\n]+/)[0];
  const context=vm.createContext({scheduleDay:()=> '2026-10-02'});vm.runInContext(fn,context);
  assert.equal(context.nextDueDate({math:[{due:'2026-10-02'},{due:'2026-10-03',done:true},{due:'2026-10-05'},{due:'2026-10-06'}],ela:[{due:'2026-10-05'},{due:''}]}),'2026-10-05');
  assert.equal(context.nextDueDate({math:[{due:'2026-10-12'}]}),'2026-10-12');
  assert.equal(context.nextDueDate({math:[{due:'2026-10-01'},{due:'',done:false}]}),'');
});
test('saved dates, explicit weekend days, and class end times determine Now / Next',()=>{
  const source=readFileSync(new URL('../school.js',import.meta.url),'utf8');
  const forFunction=source.slice(source.indexOf('function scheduleFor('),source.indexOf('function schoolMinutes('));
  const snapshotFunction=source.slice(source.indexOf('function scheduleSnapshot('),source.indexOf('function schedulePanel('));
  const context=vm.createContext({state:{scheduledDays:{leon:{'2026-10-03':[{time:'09:00',subject:'math'}],'2026-10-05':[{time:'09:00',endTime:'09:45',subject:'math'},{time:'10:00',endTime:'10:45',subject:'ela'}]}}},copySchedule:x=>JSON.parse(JSON.stringify(x)),scheduleDay:()=> '2026-10-05',schoolMinutes:()=> 570,scheduleMinutes:x=>x?Number(x.slice(0,2))*60+Number(x.slice(3)):-1});
  vm.runInContext(forFunction+snapshotFunction,context);
  assert.equal(context.scheduleFor('leon','2026-10-04').length,0);
  assert.equal(context.scheduleFor('leon','2026-10-03').length,1);
  assert.equal(context.scheduleFor('leon','2026-10-05').length,2);
  let result=context.scheduleSnapshot('leon');assert.equal(result.current,0);assert.equal(result.next,1);assert.equal(result.currentLabel,'Now');
  context.schoolMinutes=()=> 590;result=context.scheduleSnapshot('leon');assert.equal(result.current,-1);assert.equal(result.next,1);
  context.schoolMinutes=()=> 700;result=context.scheduleSnapshot('leon');assert.equal(result.current,-1);assert.equal(result.next,-1);
  context.schoolMinutes=()=> 710;result=context.scheduleSnapshot('leon');
  assert.equal(result.visibleItems.length,0,'Ended classes are hidden');
  context.schoolMinutes=()=> 705;result=context.scheduleSnapshot('leon');assert.equal(result.visibleItems.length,0);
  context.schoolMinutes=()=> 630;result=context.scheduleSnapshot('leon');assert.equal(result.visibleItems.length,1);assert.equal(result.visibleItems[0].status,'current');
  context.state.scheduledDays.leon['2026-10-05'][0].endTime='';
  context.state.scheduledDays.leon['2026-10-05'][1].endTime='';
  context.schoolMinutes=()=> 720;result=context.scheduleSnapshot('leon');assert.equal(result.visibleItems.length,1,'Missing end uses next start, retaining unknown final end');
  context.schoolMinutes=()=> 721;result=context.scheduleSnapshot('leon');assert.equal(result.visibleItems.length,1);
  assert.equal(result.currentLabel,'Latest start');
});

test('schedule imports retain overlapping optional support sessions and their titles',()=>{
  const context=vm.createContext({Date,Intl,crypto});vm.runInContext(readFileSync(new URL('../school-core.js',import.meta.url),'utf8'),context);
  const text=['Monday, October 5, 2026','Trimble Math','Math lesson','9:00 AM to 9:45 AM','Math help session','9:15 AM to 9:30 AM','Open Office','10:00 AM to 10:30 AM','Small-Group practice','10:00 AM to 10:30 AM'].join('\n');
  const items=context.parseSchedulePaste(text,'leon').days['2026-10-05'];
  assert.equal(items.filter(x=>x.optional).length,3);
  assert(items.some(x=>!x.optional&&x.time==='09:00'&&x.subject==='math'));
  assert(items.some(x=>x.optional&&x.label==='Open Office'));
  assert.equal(context.parseSchedulePaste(text,'leon').skipped.length,0);
});
test('optional sessions omit regular subjects and duplicates without entering the class rotation',()=>{
  const source=readFileSync(new URL('../school.js',import.meta.url),'utf8');
  let minutes=555;
  const context=vm.createContext({state:{view:'leon'},scheduleFor:()=>[
    {subject:'math',time:'09:00'},
    {subject:'math',label:'Help session',optional:true,time:'09:10',endTime:'09:30'},
    {subject:'ela',time:'10:00',endTime:'10:45'},
    {subject:'ela',label:'Open Office',optional:true,time:'11:00',endTime:'11:30'},
    {subject:'science',label:'Science help',optional:true,time:'11:00',endTime:'11:30'},
    {subject:'science',label:'Science help',optional:true,time:'11:00',endTime:'11:30'}
  ],scheduleAssignmentSubject:x=>x.subject,schoolMinutes:()=>minutes,scheduleMinutes:x=>Number(x.slice(0,2))*60+Number(x.slice(3)),scheduleItemStyle:()=>'',esc:x=>x,scheduleLabel:x=>x.label||x.subject,formatScheduleTime:x=>x});
  vm.runInContext(source.slice(source.indexOf('function scheduleSnapshot('),source.indexOf('function classTimeline('))+source.slice(source.indexOf('function optionalSessions('),source.indexOf('function openSubject(')),context);
  let snapshot=context.scheduleSnapshot('leon');
  assert.equal(snapshot.items.length,2);
  assert.equal(snapshot.items[snapshot.current].subject,'math','Optional start does not end a required class');
  assert.equal(snapshot.items[snapshot.next].subject,'ela');
  minutes=665;
  snapshot=context.scheduleSnapshot('leon');
  assert.equal(snapshot.current,-1,'Optional-only time has no current class');
  assert.equal(snapshot.next,-1);
  const html=context.optionalSessions('leon');
  assert(!html.includes('Help session')&&!html.includes('Open Office'));
  assert.equal((html.match(/Science help/g)||[]).length,1,'Unscheduled subject remains once');
  assert(html.includes('11:00')&&html.includes('11:30'));
  assert(source.includes('${workingAhead(subjects)}${optionalSessions(state.view)}'));
});
test('parent dashboard separates regular schedules from collapsed optional sessions for both children',()=>{
  const source=readFileSync(new URL('../school.js',import.meta.url),'utf8');
  const context=vm.createContext({state:{view:'parent'},scheduleAssignmentSubject:x=>x.subject,childDashboardBar:student=>student,scheduleFor:()=>[{subject:'ela',time:'08:00',endTime:'08:45'},{subject:'math',label:'Help session',optional:true,time:'09:00',endTime:'09:30'}],scheduleMinutes:()=>540,scheduleDay:()=> '2026-10-19',dateLabel:x=>x,profileAvatarMark:()=>'',nameOf:x=>x,esc:x=>x,subjectLabel:()=> 'Math',formatScheduleTime:x=>x,scheduleItemStyle:()=>''});
  vm.runInContext(source.slice(source.indexOf('function scheduleLabel('),source.indexOf('function scheduleSnapshot('))+source.slice(source.indexOf('function optionalSessions('),source.indexOf('function openSubject('))+source.slice(source.indexOf('function parentSchedules('),source.indexOf('function openChildHelp(')),context);
  const html=context.parentSchedules();
  assert.equal((html.match(/<details open>/g)||[]).length,2);
  assert.equal((html.match(/class="panel optional-sessions/g)||[]).length,2);
  const regular=[...html.matchAll(/<details open>([\s\S]*?)<\/details>/g)];for(const section of regular)assert(!section[1].includes('Help session'));
  assert(!/<details[^>]*class="panel optional-sessions[^>]*\bopen\b/.test(html));
  assert(html.includes('leon')&&html.includes('logan')&&html.includes('Optional · Math · Help session'));
  assert(source.includes('parent-dashboard-layout'));
  assert(html.includes('parent-side-schedule leon'));assert(html.includes('parent-side-schedule logan'));
});
test('schedule summaries hide routine clutter and preserve special sessions',()=>{
  const source=readFileSync(new URL('../school.js',import.meta.url),'utf8');
  const context=vm.createContext({subjectLabel:subject=>({ela:'Language Arts',math:'Math',stem:'STEM'})[subject],esc:x=>x});
  vm.runInContext(source.slice(source.indexOf('function scheduleLabel('),source.indexOf('function scheduleItemStyle(')),context);
  for(const [subject,label,expected] of [
    ['ela','ELA Live Lesson with Mrs. Brady','Language Arts'],
    ['ela','English Language Arts 4 A-Kochkodin','Language Arts'],
    ['stem','STEM 5-Morgan Drake','STEM'],
    ['math','Math Mania with Mrs. Trimble','Math'],
    ['math','Math Small Group Pod B','Math · Small Group Pod B'],
    ['math',"OPTIONAL - Mrs. Trimble's Help Session",'Math · Help Session']
  ]){
    const item={subject,label};
    assert.equal(context.scheduleLabel(item),expected);
    assert.equal(item.label,label,'Saved information is unchanged');
  }
});
test('help inbox uses an accessible icon and highlights only waiting requests',()=>{
  const source=readFileSync(new URL('../school.js',import.meta.url),'utf8');
  const context=vm.createContext({});
  vm.runInContext(source.slice(source.indexOf('function helpInboxButton('),source.indexOf('function openPasswordSettings(')),context);
  const empty=context.helpInboxButton(0,false),waiting=context.helpInboxButton(3,true);
  assert(empty.includes('<svg')&&empty.includes('0 pending requests'));
  assert(!empty.includes('inbox-count has-requests'));
  assert(waiting.includes('inbox-count has-requests')&&waiting.includes('aria-current="page"'));
});

test('points use submission dates and rewards enforce prices, ownership and retry safety',async()=>{
  const env=await fixture();
  await env.DB.prepare("UPDATE assignments SET done=1 WHERE id='leon-3'").run();
  const update=async(id,due,submittedDate,done=true)=>post(save,env,{...parent,change:{id,student:'leon',subject:'math',type:'update',title:id,due,submittedDate,done}});
  await update('leon-0','2026-10-20','2026-10-20');
  await update('leon-1','2026-10-21','2026-10-20');
  await update('leon-2','2026-10-20','2026-10-21');
  await update('leon-3','','2026-10-20');
  await update('leon-4','2026-10-21','');
  const data=async(credentials=leon)=>(await (await post(auth,env,credentials)).json()).rewards;
  assert.equal((await data()).balances.leon,3);
  const reward={rewardAction:'save',id:'screen-time',title:'Extra screen time',cost:3};
  assert.equal((await post(save,env,{...leon,...reward})).status,403);
  assert.equal((await post(save,env,{...parent,...reward,cost:-1})).status,400);
  assert.equal((await post(save,env,{...parent,...reward})).status,200);
  const purchase={...leon,rewardAction:'redeem',id:reward.id,requestId:'purchase-1',cost:0,student:'logan'};
  assert.equal((await post(save,env,purchase)).status,200);
  assert.equal((await post(save,env,purchase)).status,200);
  assert.equal((await data()).balances.leon,0);
  assert.equal((await data()).history.length,1);
  assert.equal((await post(save,env,{...purchase,requestId:'purchase-2'})).status,409);
  assert(!(await data({role:'logan',password:'test-password'})).history.some(x=>x.kind==='award'));
  await update('leon-1','2026-10-21','2026-10-20',false);
  assert.equal((await data()).balances.leon,0,'Reopening submitted work preserves its original earnings without debt');
  await update('leon-1','2026-10-21','2026-10-20');
  assert.equal((await data()).balances.leon,0);
  assert.equal((await post(save,env,{...leon,change:{type:'status',id:'leon-0',student:'leon',submittedDate:'2020-01-01'}})).status,403);
  await post(save,env,{...parent,rewardAction:'remove',id:reward.id});
  assert.equal((await data()).items.length,0);
  assert.equal((await data(parent)).history[0].title,reward.title);
});

test('theme unlocks cost five points once per child and locked palettes cannot be saved',async()=>{
  const env=await fixture();
  await env.DB.prepare("UPDATE assignments SET done=1 WHERE id='leon-3'").run();
  const {THEME_CATALOG,FREE_THEMES}=await import('../functions/api/theme-catalog.js');
  const source=readFileSync(new URL('../school.js',import.meta.url),'utf8');
  const palettes=vm.runInNewContext('('+source.match(/const THEME_PALETTES = (\{[\s\S]*?\n\});/)[1]+')');
  assert.deepEqual(Object.keys(THEME_CATALOG).sort(),Object.keys(palettes).sort());
  assert.deepEqual(FREE_THEMES,['coastal','midnight']);
  const data=async(credentials=leon)=>(await (await post(auth,env,credentials)).json());
  await post(save,env,{...leon,preferencesOnly:true,preferences:{lightTheme:'forest',darkTheme:'dracula'}});
  assert.equal((await data()).preferences.leon.lightTheme,'coastal');
  assert.equal((await data()).preferences.leon.darkTheme,'midnight');
  const buy={...leon,rewardAction:'unlockTheme',id:'forest',cost:0};
  assert.equal((await post(save,env,buy)).status,409);
  for(let i=0;i<3;i++)await post(save,env,{...parent,change:{type:'update',id:'leon-'+i,student:'leon',subject:'math',title:'Early work',due:'2026-10-21',submittedDate:'2026-10-20',done:true}});
  assert.equal((await post(save,env,buy)).status,200);
  assert.equal((await post(save,env,buy)).status,200);
  let result=await data();assert.equal(result.rewards.balances.leon,1);assert(result.rewards.unlocked.leon.includes('forest'));
  await post(save,env,{...leon,preferencesOnly:true,preferences:{lightTheme:'forest'}});
  assert.equal((await data()).preferences.leon.lightTheme,'forest');
  assert.equal((await post(save,env,{...buy,id:'dracula'})).status,409);
  assert.equal((await post(save,env,{...buy,id:'nonexistent'})).status,400);
  assert.equal((await post(save,env,{...buy,id:'coastal'})).status,400);
  assert.equal((await post(save,env,{...buy,role:'parent'})).status,403);
  assert(!(await data({role:'logan',password:'test-password'})).rewards.unlocked.logan.includes('forest'));
  await post(save,env,{...parent,change:{type:'status',id:'leon-0',student:'leon',done:false}});
  result=await data();assert(result.rewards.unlocked.leon.includes('forest'),'Unlock stays owned even if earnings change');
  assert.equal(result.preferences.leon.lightTheme,'forest');
});

test('cosmetic purchases gate all appearance fields and share permanent font ownership',async()=>{
  const env=await fixture();
  await env.DB.prepare("UPDATE assignments SET done=1 WHERE id='leon-3'").run();
  const {COSMETICS,COSMETIC_RULES}=await import('../functions/api/cosmetics.js');
  const image='data:image/webp;base64,AAAA';
  const premium={fontStyle:'montserrat',clockFont:'montserrat',visualStyle:'glass',cornerStyle:'pill',edgeStyle:'glow',surfaceTexture:'paper',backgroundEffect:'scanlines',avatar:'🐱',avatarFrame:'glow',avatarImage:image,backgroundImage:image,textSize:'large',motion:'reduced'};
  const data=async(credentials=leon)=>(await (await post(auth,env,credentials)).json());
  await post(save,env,{...parent,preferencesOnly:true,scope:'leon',preferences:premium});
  let prefs=(await data()).preferences.leon;
  for(const [field,rule] of Object.entries(COSMETIC_RULES))assert.equal(prefs[field],rule.default,field+' is locked');
  assert.equal(prefs.textSize,'large');assert.equal(prefs.motion,'reduced');
  await post(save,env,{...parent,preferencesOnly:true,scope:'parent',preferences:premium});
  assert.equal((await data(parent)).preferences.parent.visualStyle,'glass');
  const buy=id=>post(save,env,{...leon,rewardAction:'unlockCosmetic',id,cost:0,student:'logan'});
  assert.equal((await buy('font-montserrat')).status,409);
  assert.equal((await buy('constructor')).status,400);
  assert.equal((await post(save,env,{...parent,rewardAction:'unlockCosmetic',id:'style-glass'})).status,403);
  // Enough real assignment earnings to exercise every cosmetic category.
  for(let i=0;i<30;i++)await post(save,env,{...parent,change:{type:'add',id:'cosmetic-work-'+i,student:'leon',subject:'math',title:'Early work',due:'2026-10-21',submittedDate:'2026-10-20',done:true}});
  const ids=new Set(Object.entries(premium).map(([field,value])=>{
    const rule=COSMETIC_RULES[field];if(!rule)return null;
    return Object.values(COSMETICS).find(item=>item.group===rule.group&&item.value===(field.endsWith('Image')?'custom':value))?.id;
  }).filter(Boolean));
  for(const id of ids){assert.equal((await buy(id)).status,200,id);assert.equal((await buy(id)).status,200,'Retry '+id);}
  const spent=[...ids].reduce((sum,id)=>sum+COSMETICS[id].cost,0);
  let result=await data();assert.equal(result.rewards.balances.leon,60-spent);
  assert.equal(result.rewards.history.length,ids.size);
  await post(save,env,{...leon,preferencesOnly:true,preferences:premium});
  result=await data();for(const field of Object.keys(COSMETIC_RULES))assert.equal(result.preferences.leon[field],premium[field],field+' unlocked');
  assert.equal(result.rewards.cosmeticUnlocks.leon.filter(id=>id==='font-montserrat').length,1,'One purchase covers text and clock');
  const logan=await data({role:'logan',password:'test-password'});assert.deepEqual(logan.rewards.cosmeticUnlocks.logan,[]);
  await post(save,env,{...parent,change:{type:'status',id:'cosmetic-work-0',student:'leon',done:false}});
  assert((await data()).rewards.cosmeticUnlocks.leon.includes('style-glass'),'Purchases survive earnings corrections');
});

test('parent navigation exposes tools directly and assignments open in a dialog',()=>{
  const source=readFileSync(new URL('../school.js',import.meta.url),'utf8');
  const context=vm.createContext({state:{auth:{role:'parent'},parentTab:'overview'},allTasks:()=>[],mast:()=>'<header></header>',parentSchedules:()=>'<schedules/>',pendingRewardDeliveries:()=>'<deliveries/>',parentActivityFeed:()=>'<activity/>',helpInbox:()=>'<help/>',helpInboxButton:()=>'<inbox/>',assignmentEditor:()=>'<editor/>',openDialog:(id,html)=>{context.opened={id,html};}});
  vm.runInContext(source.slice(source.indexOf('function setParentTab('),source.indexOf('function parentSchedules(')),context);
  const html=context.parentPage();
  for(const label of ['Edit schedule','Announcements &amp; reminders','Shared dashboard','Assignments'])assert(html.includes(label));
  assert(!html.includes('Weekly overview'));assert(!html.includes('<editor/>'));assert(!html.includes('<overview/>'));assert(html.includes('<schedules/>'));
  context.setParentTab('assignments');assert.equal(context.opened.id,'assignments');assert(context.opened.html.includes('<editor/>'));assert.equal(context.state.parentTab,'overview');
});

test('assignment pop-out returns from child dialogs and closes cleanly',()=>{
  const source=readFileSync(new URL('../school.js',import.meta.url),'utf8');
  let id='assignment-form',opens=0,closed=0;
  const context=vm.createContext({state:{assignmentPopup:true,view:'parent'},document:{getElementById:key=>key==='app-dialog'?{dataset:{dialog:id},close:()=>closed++,remove:()=>{}}:null},openAssignmentEditor:()=>opens++,ensureAssignmentSlots:()=>{},render:()=>{}});
  vm.runInContext(source.slice(source.indexOf('function closeDialog('),source.indexOf('\nfunction ',source.indexOf('function closeDialog(')+1)),context);
  context.closeDialog();assert.equal(opens,1);assert.equal(closed,1);
  id='assignments';context.closeDialog(true);assert.equal(context.state.assignmentPopup,true,'Replacing editor keeps its return route');
  context.closeDialog();assert.equal(context.state.assignmentPopup,false);assert.equal(opens,1);
});

test('kids see per-assignment point previews and totals for the exact work shown',()=>{
  const source=readFileSync(new URL('../school.js',import.meta.url),'utf8'),today='2026-10-19';
  const context=vm.createContext({state:{view:'leon',auth:{role:'leon'}},scheduleDay:()=>today,addDays:()=> '2026-10-20',jsArg:JSON.stringify,safeLink:()=>'',esc:x=>x,dueChip:()=>'',dateLabel:x=>x,nameOf:x=>x,subjectLabel:x=>x,nextDueDate:subjects=>Object.values(subjects).flat().filter(x=>!x.done&&x.due>today).map(x=>x.due).sort()[0]||''});
  vm.runInContext(source.slice(source.indexOf('function workingAheadDate('),source.indexOf('function scheduleMinutes(')),context);
  const task=(id,due,extra={})=>({id,title:id,due,done:false,...extra});
  const subjects={math:[task('due-one',today),task('tomorrow-one','2026-10-20'),task('later','2026-10-22')],ela:[task('due-two',today),task('tomorrow-two','2026-10-20'),task('complete',today,{done:true,submittedDate:today}),task('late','2026-10-18')]};
  let html=context.workSection(subjects,'today');
  assert(!html.includes('points available'));assert(context.potentialPointsTotal(subjects.math.concat(subjects.ela).filter(x=>x.due===today),'leon').includes('⭐ 2 points available'));assert.equal((html.match(/1 point if submitted today/g)||[]).length,2);
  assert(context.potentialPointsTotal(context.availableTodayWork(subjects),'leon').includes('⭐ 6 points available'));
  const laterAhead={math:[task('today',today),task('next','2026-10-22'),task('beyond','2026-10-25')]};
  assert(context.potentialPointsTotal(context.availableTodayWork(laterAhead),'leon').includes('⭐ 1 point available'),'Work beyond tomorrow earns no early points');
  html=context.workingAhead(subjects);assert(!html.includes('points available'));assert.equal((html.match(/2 points if submitted today/g)||[]).length,2);assert(!html.includes('data-task-id="later"'));
  assert.equal(context.potentialTaskPoints(task('no-date','')),0);assert.equal(context.potentialTaskPoints(task('late','2026-10-18')),0);assert.equal(context.potentialTaskPoints(task('done',today,{done:true})),0);
  subjects.math[0].done=true;assert(context.potentialPointsTotal(subjects.math.concat(subjects.ela).filter(x=>x.due===today),'leon').includes('⭐ 1 point available'));
  assert(!context.workingAhead({}).includes('points available'));
  context.state.view='monitor';context.state.auth.role='monitor';assert(!context.workingAhead(subjects,'leon',true).includes('points available'));
  context.state.view='parent';context.state.auth.role='parent';assert(!context.workSection(subjects,'today','leon').includes('potential-points'));
});

test('store catalog supports in-store browsing, confirming, buying and applying an unlock',async()=>{
  const source=readFileSync(new URL('../school.js',import.meta.url),'utf8');
  let owned=false,html='',applied='',toast='';
  const context=vm.createContext({state:{view:'leon',auth:{role:'leon'},rewards:{balances:{leon:6},themePrice:5,cosmetics:{},items:[],history:[]}},THEME_PALETTES:{coastal:['Coastal','#000','#fff'],midnight:['Midnight','#fff','#000'],forest:['Forest','#080','#efe']},activeTheme:()=> 'coastal',themeOwned:id=>['coastal','midnight'].includes(id)||owned,cosmeticOwned:()=>false,prefs:()=>({allowedFonts:[]}),esc:x=>x,jsArg:JSON.stringify,openDialog:(id,content)=>{html=content;},selectTheme:id=>applied=id,setPreference:()=>{},render:()=>{},updatePointBalances:()=>{},showToast:message=>toast=message,fetch:async()=>{owned=true;return{ok:true,json:async()=>({rewards:{...context.state.rewards,balances:{leon:1}}})};},document:{getElementById:()=>null}});
  vm.runInContext(source.slice(source.indexOf('function storeNavigation('),source.indexOf('function editReward(')),context);
  vm.runInContext('let storeBusy=false;'+source.slice(source.indexOf('async function storeAction('),source.indexOf('function dashboardClock(')),context);
  context.drawUnlockCatalog('themes');assert(html.includes('Rewards Store categories'));assert(html.includes('Find themes'));assert(html.includes('Unlock · 5 points'));assert(!html.includes('openSettings()'));
  context.confirmStoreUnlock('forest',true);assert(html.includes('Unlock Forest?'));assert(html.includes('Back to store'));
  await context.storeAction({rewardAction:'unlockTheme',id:'forest'});
  assert.equal(context.state.rewardCatalog,'themes');assert(html.includes('1 point to spend'));assert(html.includes('Unlocked'));assert(html.includes('>Use</button>'));assert(toast.includes('Unlocked'));
  context.useStoreUnlock('forest',true);assert.equal(applied,'forest');assert.equal(context.state.rewardCatalog,'themes');
});

test('student announcements stay visible without the four reminder bars',()=>{
  const source=readFileSync(new URL('../school.js',import.meta.url),'utf8');
  const context=vm.createContext({state:{displayCards:{leon:['Drink water']}},announcementBanner:()=>'<announcement/>',displayCards:()=>'<reminders/>',visibleAnnouncements:()=>[{}]});
  vm.runInContext(source.slice(source.indexOf('function studentAnnouncementStack('),source.indexOf('function refreshVisibleAnnouncements(')),context);
  const html=context.studentAnnouncementStack('leon');assert(html.startsWith('<section'));assert(!html.includes('<details'));assert(!html.includes('<summary'));assert(html.includes('<announcement/>'));assert(!html.includes('<reminders/>'));assert(html.includes('id="student-announcements"'));
});

test('past-due deductions stop at zero and never become future debt',async()=>{
  const env=await fixture(),data=async()=>(await (await post(auth,env,leon)).json()).rewards;
  assert.equal((await data()).balances.leon,0);
  assert.equal((await data()).history.find(x=>x.kind==='penalty').cost,0,'Late at zero is recorded but not charged');
  await post(save,env,{...parent,rewardAction:'awardPoints',id:'late-bonus',student:'leon',points:1});
  assert.equal((await data()).balances.leon,1,'New earnings do not pay old debt');
  const today=new Date().toLocaleDateString('en-CA',{timeZone:'America/New_York'}),date=new Date(today+'T12:00:00Z');date.setUTCDate(date.getUTCDate()-1);const yesterday=date.toISOString().slice(0,10);
  for(const id of ['leon-0','leon-1'])await post(save,env,{...parent,change:{type:'update',id,student:'leon',subject:'math',title:'Late work',due:yesterday,done:false}});
  let result=await data();assert.equal(result.balances.leon,0);assert.equal(result.history.filter(x=>x.kind==='penalty').reduce((sum,x)=>sum+x.cost,0),1);
  await post(save,env,{...leon,change:{type:'status',id:'leon-0',student:'leon',done:true,completedDate:today,submittedDate:today}});
  assert.equal((await data()).balances.leon,0,'Late completion does not refund a charged penalty');
  await post(save,env,{...parent,rewardAction:'awardPoints',id:'later-bonus',student:'leon',points:2});
  assert.equal((await data()).balances.leon,2,'Zero-cost late entries never charge later');
});

test('parents can award spendable bonus points per child with retry-safe history',async()=>{
  const env=await fixture(),award={rewardAction:'awardPoints',id:'award-1',student:'leon',points:7,reason:'Great effort'};
  const data=async(credentials=parent)=>(await (await post(auth,env,credentials)).json()).rewards;
  const before=await data();
  assert.equal((await post(save,env,{...leon,...award})).status,403);
  for(const points of [0,-2,1.5,100001])assert.equal((await post(save,env,{...parent,...award,points})).status,400);
  assert.equal((await post(save,env,{...parent,...award,student:'other'})).status,400);
  assert.equal((await post(save,env,{...parent,...award})).status,200);
  assert.equal((await post(save,env,{...parent,...award})).status,200);
  let result=await data();assert.equal(result.balances.leon,before.balances.leon+7);assert.equal(result.balances.logan,before.balances.logan);
  assert.equal(result.history.filter(x=>x.kind==='award').length,1);assert.equal(result.history.find(x=>x.kind==='award').title,award.reason);
  assert(!(await data({role:'logan',password:'test-password'})).history.some(x=>x.kind==='award'));
  assert.equal((await post(save,env,{...leon,rewardAction:'unlockTheme',id:'forest'})).status,200,'Bonus points can buy unlocks');
  const response=await post(save,env,{...leon,change:{type:'status',student:'leon',id:'leon-0',done:true}});
  const saved=await response.json();assert.equal(saved.rewards.balances.leon,(await data(leon)).balances.leon,'Assignment saves return current balance');
});

test('student dashboard balance floors stale negative values at zero and links to the store',()=>{
  const source=readFileSync(new URL('../school.js',import.meta.url),'utf8');
  const node={dataset:{pointBalance:'leon'},textContent:''},context=vm.createContext({state:{rewards:{balances:{leon:-2}}},document:{querySelectorAll:()=>[node]}});
  vm.runInContext(source.slice(source.indexOf('function studentBalanceButton('),source.indexOf('function openPointAward(')),context);
  assert(context.studentBalanceButton('leon').includes('>0</span> points'));assert(context.studentBalanceButton('leon').includes('onclick="openRewards()"'));
  context.state.rewards.balances.leon=0;context.updatePointBalances();assert.equal(node.textContent,0);
});

test('child schedule headers show individual counts and route actions to that child',()=>{
  const source=readFileSync(new URL('../school.js',import.meta.url),'utf8');
  const context=vm.createContext({state:{rewards:{balances:{leon:4,logan:9}}},scheduleDay:()=> '2026-10-20',allTasks:student=>student==='leon'?[{due:'2026-10-20',done:false},{due:'2026-10-19',done:false,needsHelp:true},{due:'2026-10-20',done:true,needsHelp:true}]:[],profileAvatarMark:()=>'',nameOf:x=>x});
  vm.runInContext(source.slice(source.indexOf('function childDashboardBar('),source.indexOf('function parentSchedules(')),context);
  const leon=context.childDashboardBar('leon'),logan=context.childDashboardBar('logan');
  assert(leon.includes('Due today <b>1</b>'));assert(leon.includes('Past due <b>1</b>'));assert(leon.includes('leon help requests, 1 pending'));
  for(const action of ['editStudent','openScheduleFor','openPointAward','openChildHelp'])assert(leon.includes(action+"('leon')"));
  assert(logan.includes('Due today <b>0</b>'));assert(logan.includes('logan help requests, 0 pending'));assert(!logan.includes('has-requests'));
  assert(!source.includes('function weeklyOverview('));
});

test('both children retain purchased profile icons after signing in and changing other settings',async()=>{
  const env=await fixture();
  for(const [student,avatar,id] of [['leon','🐱','avatar-1'],['logan','🐶','avatar-2']]){
    const credentials={role:student,password:'test-password'};
    await post(save,env,{...parent,rewardAction:'awardPoints',id:'icon-award-'+student,student,points:10});
    assert.equal((await post(save,env,{...credentials,rewardAction:'unlockCosmetic',id})).status,200);
    assert.equal((await post(save,env,{...credentials,preferencesOnly:true,preferences:{avatar}})).status,200);
    let data=await (await post(auth,env,credentials)).json();assert.equal(data.preferences[student].avatar,avatar);
    await post(save,env,{...credentials,preferencesOnly:true,preferences:{...data.preferences[student],textSize:'large'}});
    data=await (await post(auth,env,credentials)).json();assert.equal(data.preferences[student].avatar,avatar);
    assert.equal((await (await post(auth,env,parent)).json()).preferences[student].avatar,avatar);
    await post(save,env,{...credentials,rewardAction:'unlockCosmetic',id:'upload-custom'});
    await post(save,env,{...credentials,preferencesOnly:true,preferences:{...data.preferences[student],avatarImage:'data:image/webp;base64,AAAA'}});
    data=await (await post(auth,env,credentials)).json();assert.equal(data.preferences[student].avatarImage,'data:image/webp;base64,AAAA');
  }
});

test('appearance refresh preserves profile images rather than replacing them with emoji',()=>{
  const source=readFileSync(new URL('../school.js',import.meta.url),'utf8');
  const avatar={dataset:{profileAvatar:'logan',profileAvatarFrame:''},innerHTML:'',className:''};
  const context=vm.createContext({document:{querySelectorAll:()=>[avatar]},prefs:()=>({avatarFrame:'glow',avatarImage:'saved-image'}),profileAvatarContents:()=>'<img src="saved-image">'});
  const start=source.indexOf("document.querySelectorAll('[data-profile-avatar]').forEach",source.indexOf('function updateAppearanceControls('));
  vm.runInContext(source.slice(start,source.indexOf("document.querySelectorAll('.avatar-summary')",start)),context);
  assert.equal(avatar.innerHTML,'<img src="saved-image">');assert.equal(avatar.className,'profile-avatar avatar-frame-glow');
});

test('goals, reward delivery, breakdowns and parent activity persist with ownership checks',async()=>{
  const env=await fixture(),logan={role:'logan',password:'test-password'};
  const data=async(credentials=parent)=>(await (await post(auth,env,credentials)).json()).rewards;
  await post(save,env,{...parent,rewardAction:'save',id:'movie',title:'Movie night',cost:3});
  assert.equal((await post(save,env,{...leon,rewardAction:'setGoal',id:'missing'})).status,404);
  assert.equal((await post(save,env,{...parent,rewardAction:'setGoal',id:'movie'})).status,403);
  await post(save,env,{...leon,rewardAction:'setGoal',id:'movie'});
  assert.equal((await data(leon)).goals.leon.title,'Movie night');assert.equal((await data(logan)).goals.logan,null);
  await post(save,env,{...parent,rewardAction:'awardPoints',id:'goal-award',student:'leon',points:10});
  await post(save,env,{...leon,rewardAction:'redeem',id:'movie',requestId:'movie-purchase'});
  assert.equal((await post(save,env,{...leon,rewardAction:'deliver',id:'movie-purchase',student:'leon'})).status,403);
  assert.equal((await post(save,env,{...parent,rewardAction:'deliver',id:'movie-purchase',student:'logan'})).status,404);
  assert.equal((await post(save,env,{...parent,rewardAction:'deliver',id:'movie-purchase',student:'leon'})).status,200);
  const delivered=(await data()).history.find(x=>x.id==='movie-purchase').deliveredAt;
  await post(save,env,{...parent,rewardAction:'deliver',id:'movie-purchase',student:'leon'});
  assert.equal((await data()).history.find(x=>x.id==='movie-purchase').deliveredAt,delivered);
  const today=new Date().toLocaleDateString('en-CA',{timeZone:'America/New_York'});
  const change={type:'status',id:'leon-0',student:'leon',done:true,completedDate:today,submittedDate:today,needsHelp:false};
  await post(save,env,{...leon,change});await post(save,env,{...leon,change});
  await post(save,env,{...leon,change:{type:'status',id:'leon-1',student:'leon',needsHelp:true}});
  const result=await data(),b=result.breakdown.leon;
  assert.equal(b.earned,1);assert.equal(b.bonuses,10);assert.equal(b.deductions,0);assert.equal(b.spent,3);
  assert.equal(result.balances.leon,b.earned+b.bonuses-b.deductions-b.spent);
  assert.equal(result.activity.filter(x=>x.kind==='submission').length,1,'Retry does not duplicate activity');
  for(const kind of ['purchase','delivery','bonus','help','completion'])assert(result.activity.some(x=>x.kind===kind),kind);
  assert.deepEqual((await data(leon)).activity,[],'Parent feed stays private');
  await post(save,env,{...leon,rewardAction:'setGoal',id:'clear'});assert.equal((await data(leon)).goals.leon,null);
});

test('next action ignores historical completions and done-and-submitted saves both dates together',async()=>{
  const source=readFileSync(new URL('../school.js',import.meta.url),'utf8');
  const task={id:'next-task',title:'Read today',subject:'ela',student:'leon',due:'2026-10-20',done:false},found={student:'leon',subject:'ela',x:task};let saved=0;
  const context=vm.createContext({state:{auth:{role:'leon'}},allTasks:()=>[{id:'old',title:'Old complete',done:true,due:'2020-01-01'},task],scheduleDay:()=> '2026-10-20',addDays:()=> '2026-10-21',safeLink:()=>'',esc:x=>x,subjectLabel:()=> 'Language Arts',dateLabel:x=>x,potentialTaskPoints:()=>1,jsArg:JSON.stringify,findTask:()=>found,closeDialog:()=>{},render:()=>{},saveAssignmentChange:async()=>{saved++;assert.equal(task.done,true);assert.equal(task.completedDate,'2026-10-20');assert.equal(task.submittedDate,'2026-10-20');return true;},showToast:()=>{}});
  vm.runInContext(source.slice(source.indexOf('function nextAssignmentCard('),source.indexOf('function savingsGoal(')),context);
  const html=context.nextAssignmentCard('leon');assert(html.includes('Read today'));assert(!html.includes('Old complete'));assert(!html.includes('Done and submitted'));assert(html.includes('Mark complete'));
  await context.completeAndSubmit(task.id);assert.equal(saved,1);assert.equal(task.needsHelp,false);
});

test('shop preview is isolated and using state follows the selected appearance',()=>{
  const source=readFileSync(new URL('../school.js',import.meta.url),'utf8');let html='';
  const profile={visualStyle:'classic',appearance:'light',lightTheme:'coastal',fontStyle:'theme',cornerStyle:'theme',edgeStyle:'theme',surfaceTexture:'none'},item={id:'forest',title:'Forest',theme:true,cost:5,owned:false};
  const context=vm.createContext({state:{auth:{role:'leon'},rewardCatalog:'themes',rewards:{balances:{leon:8}}},prefs:()=>profile,activeTheme:p=>p.lightTheme,THEME_PALETTES:{forest:['Forest','#080','#efe']},DARK_THEME_KEYS:[],storeUnlockItems:()=>[item],esc:x=>String(x).replace(/"/g,'&quot;'),jsArg:JSON.stringify,URL,location:{href:'https://school.example/'},openDialog:(id,content)=>html=content});
  vm.runInContext(source.slice(source.indexOf('function storeUnlockUsing('),source.indexOf('function drawUnlockCatalog(')),context);
  assert.equal(context.storeUnlockUsing(item),false);context.previewStoreUnlock('forest',true);assert(html.includes('sandbox'));assert(html.includes('srcdoc='));assert.equal(profile.lightTheme,'coastal','Preview never mutates saved preferences');
  profile.lightTheme='forest';assert.equal(context.storeUnlockUsing(item),true);
});

test('old negative balances are cleared once and all purchase types enforce spendable funds',async()=>{
  const env=await fixture();
  await env.DB.prepare('INSERT INTO settings(key,value) VALUES (?,?)').bind('redemption_old-debt',JSON.stringify({id:'old-debt',student:'leon',kind:'penalty',cost:8,title:'Old overdue work',date:new Date().toISOString()})).run();
  const data=async()=>(await (await post(auth,env,leon)).json()).rewards;
  let result=await data();assert.equal(result.balances.leon,0);assert.equal(result.breakdown.leon.adjustments,8);
  assert.equal((await data()).history.filter(x=>x.kind==='balanceAdjustment').length,1);
  for(const request of [{rewardAction:'unlockTheme',id:'forest'},{rewardAction:'unlockCosmetic',id:'style-glass'}])assert.equal((await post(save,env,{...leon,...request})).status,409);
  await post(save,env,{...parent,rewardAction:'save',id:'one-point',title:'Small reward',cost:1});
  assert.equal((await post(save,env,{...leon,rewardAction:'redeem',id:'one-point',requestId:'no-money'})).status,409);
  await post(save,env,{...parent,rewardAction:'awardPoints',id:'fresh-point',student:'leon',points:1});
  assert.equal((await data()).balances.leon,1,'No hidden debt consumes the new point');
  assert.equal((await post(save,env,{...leon,rewardAction:'redeem',id:'one-point',requestId:'fresh-purchase'})).status,200);
  assert.equal((await data()).balances.leon,0);
});

test('simultaneous reward, theme and cosmetic purchases cannot overspend',async()=>{
  const env=await fixture();
  await env.DB.prepare('UPDATE assignments SET done=1').run();
  await post(save,env,{...parent,rewardAction:'awardPoints',id:'spend-budget',student:'leon',points:5});
  await post(save,env,{...parent,rewardAction:'save',id:'four-points',title:'Reward',cost:4});
  const responses=await Promise.all([
    {rewardAction:'redeem',id:'four-points',requestId:'racing-purchase'},
    {rewardAction:'unlockTheme',id:'forest'},
    {rewardAction:'unlockCosmetic',id:'corners-pill'}
  ].map(request=>post(save,env,{...leon,...request})));
  assert(responses.every(response=>[200,409].includes(response.status)));
  assert(responses.some(response=>response.status===409));
  const result=(await (await post(auth,env,leon)).json()).rewards;
  assert(result.balances.leon>=0);assert(result.breakdown.leon.spent<=5);assert.equal(result.balances.leon,5-result.breakdown.leon.spent);
});

test('Working Ahead advances across subjects and opens each newly populated date for kids',()=>{
  const source=readFileSync(new URL('../school.js',import.meta.url),'utf8');
  const context=vm.createContext({state:{view:'leon'},prefs:()=>({dashboardExpanded:false}),scheduleDay:()=> '2026-10-20'});
  vm.runInContext(source.slice(source.indexOf('function nextDueDate('),source.indexOf('function mast('))+source.slice(source.indexOf('function workSectionStartsOpen('),source.indexOf('function render(')),context);
  const work={math:[{due:'2026-10-22',done:false},{due:'2026-10-26',done:false}],ela:[{due:'2026-10-22',done:false},{due:'2026-10-23',done:false}]};
  const node=date=>({dataset:{dueDate:date},classList:{contains:key=>['work-section','ahead'].includes(key)},querySelector:()=>({textContent:'1'})});
  assert.equal(context.nextDueDate(work),'2026-10-22');
  work.math[0].done=true;assert.equal(context.nextDueDate(work),'2026-10-22','Waits until every assignment on the date is complete');
  work.ela[0].done=true;const date=context.nextDueDate(work);assert.equal(date,'2026-10-23');
  assert.equal(context.workSectionStartsOpen(node(date),{open:false,dueDate:'2026-10-22'}),true,'Next date is visibly populated even if previous date was collapsed');
  assert.equal(context.workSectionStartsOpen(node(date),{open:false,dueDate:date}),false,'Manual collapse persists for unchanged date');
  assert.equal(context.workSectionStartsOpen(node(date)),true,'Upcoming work opens on initial load');
  work.ela[1].done=true;assert.equal(context.nextDueDate(work),'2026-10-26','Skips weekends and empty dates');
  work.math[1].done=true;assert.equal(context.nextDueDate(work),'');
});

test('only next-day early submissions earn points and children cannot rewrite a submission',async()=>{
  const env=await fixture(),today=new Date().toLocaleDateString('en-CA',{timeZone:'America/New_York'});
  const shift=n=>{const date=new Date(today+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+n);return date.toISOString().slice(0,10);};
  for(const days of [0,1,2,3,7]){
    const id='window-'+days;
    await post(save,env,{...parent,change:{type:'add',id,student:'leon',subject:'math',title:'Due in '+days,due:shift(days),done:false}});
    assert.equal((await post(save,env,{...leon,change:{type:'status',id,student:'leon',done:true,submittedDate:today,completedDate:today}})).status,days<=1?200:403);
    if(days>1)await post(save,env,{...parent,change:{type:'status',id,student:'leon',done:true,submittedDate:today,completedDate:today}});
  }
  let data=(await (await post(auth,env,leon)).json()).rewards;
  assert.equal(data.breakdown.leon.earned,3,'1 today plus 2 tomorrow, zero for every later day');assert.equal(data.balances.leon,3);
  assert.equal((await post(save,env,{...leon,change:{type:'status',id:'window-2',student:'leon',submittedDate:''}})).status,403);
  assert.equal((await post(save,env,{...leon,change:{type:'status',id:'window-2',student:'leon',submittedDate:shift(1)}})).status,403);
  await post(save,env,{...parent,rewardAction:'save',id:'too-expensive',title:'Four point reward',cost:4});
  assert.equal((await post(save,env,{...leon,rewardAction:'redeem',id:'too-expensive',requestId:'window-spend'})).status,409,'Client cannot spend imaginary early points');
});

test('parent-only behavior rules enforce fixed costs, both-child fighting deductions and zero floor',async()=>{
  const env=await fixture();
  for(const student of ['leon','logan'])await post(save,env,{...parent,rewardAction:'awardPoints',id:'behavior-budget-'+student,student,points:10});
  const deduct=(rule,id,extra={})=>post(save,env,{...parent,rewardAction:'deductPoints',rule,id,student:'leon',points:999,...extra});
  assert.equal((await post(save,env,{...leon,rewardAction:'deductPoints',rule:'refusal',id:'unauthorized',student:'logan'})).status,403);
  assert.equal((await deduct('unknown','bad-rule')).status,400);
  assert.equal((await deduct('other','missing-reason',{points:2})).status,400);
  for(const rule of ['quizAttempts','refusal','listening','chores','fighting']){
    assert.equal((await deduct(rule,'deduct-'+rule)).status,200);
    assert.equal((await deduct(rule,'deduct-'+rule)).status,200,'Retries never deduct again');
  }
  let data=(await (await post(auth,env,parent)).json()).rewards;
  assert.equal(data.balances.leon,4);assert.equal(data.balances.logan,9,'Fighting takes exactly one from both');
  assert.equal(data.breakdown.leon.behaviorDeductions,6);assert.equal(data.breakdown.leon.spent,0,'Behavior is not store spending');
  assert(data.activity.some(x=>x.kind==='deduction'));
  assert.equal((await deduct('other','custom-deduction',{points:20,notes:'Parent explanation'})).status,200);
  data=(await (await post(auth,env,leon)).json()).rewards;assert.equal(data.balances.leon,0);assert.equal(data.history.find(x=>x.id==='custom-deduction').cost,4,'Only available points are deducted');
  assert.equal(data.pointRules.quizAttempts.points,2);assert.equal(data.pointRules.fighting.both,true);
});

test('Working Ahead displays tomorrow only and does not skip to later work',()=>{
  const source=readFileSync(new URL('../school.js',import.meta.url),'utf8');
  const context=vm.createContext({state:{view:'leon',auth:{role:'leon'}},scheduleDay:()=> '2026-10-20',addDays:()=> '2026-10-21',dateLabel:x=>x,nameOf:x=>x,taskGroups:(subjects,filter)=>Object.values(subjects).flat().filter(filter).map(x=>x.title).join('|')});
  vm.runInContext(source.slice(source.indexOf('function workingAheadDate('),source.indexOf('function task('))+source.slice(source.indexOf('function workingAhead('),source.indexOf('function scheduleMinutes(')),context);
  const work={math:[{title:'Tomorrow work',due:'2026-10-21',done:false},{title:'Too far work',due:'2026-10-22',done:false}]};
  let html=context.workingAhead(work);assert(html.includes('Tomorrow work'));assert(!html.includes('Too far work'));
  work.math[0].done=true;html=context.workingAhead(work);assert(!html.includes('Too far work'));assert(html.includes('No assignments due tomorrow'));
});

test('recent submission undo resolves stable assignment IDs and reopens the correct child assignment',async()=>{
  const source=readFileSync(new URL('../school.js',import.meta.url),'utf8');
  const x={id:'leon-task',student:'leon',title:'Same title',done:true,completedDate:'2026-10-20',submittedDate:'2026-10-20'},found={student:'leon',subject:'math',x};let saves=0;
  const context=vm.createContext({state:{auth:{role:'parent'}},allTasks:()=>[x,{...x,id:'another-task'}],jsArg:JSON.stringify,findTask:()=>found,render:()=>{},showToast:()=>{},saveAssignmentChange:async()=>{saves++;return true;}});
  vm.runInContext(source.slice(source.indexOf('function activityAssignment('),source.indexOf('function parentActivityFeed(')),context);
  assert(context.submissionUndoAction({kind:'submission',assignmentId:x.id,student:'leon'}).includes('Undo submission'));
  assert(context.submissionUndoAction({kind:'submission',title:x.title,student:'leon'}).includes('unavailable'),'Ambiguous older entries never target the wrong task');
  await context.undoSubmittedAssignment(x.id,'logan');assert.equal(saves,0);
  await context.undoSubmittedAssignment(x.id,'leon');assert.equal(saves,1);assert.equal(x.done,false);assert.equal(x.submittedDate,'');assert.equal(x.completedDate,'');
  assert(context.submissionUndoAction({kind:'submission',assignmentId:x.id,student:'leon'}).includes('Submission undone'));
});

test('parent submission undo persists, recalculates points, and logs a reopened event',async()=>{
  const env=await fixture(),today=new Date().toLocaleDateString('en-CA',{timeZone:'America/New_York'});
  await post(save,env,{...leon,change:{type:'status',id:'leon-0',student:'leon',done:true,completedDate:today,submittedDate:today}});
  let data=await (await post(auth,env,parent)).json();assert(data.rewards.activity.some(x=>x.kind==='submission'&&x.assignmentId==='leon-0'));
  assert.equal((await post(save,env,{...parent,change:{type:'status',id:'leon-0',student:'leon',done:false,submittedDate:'',completedDate:''}})).status,200);
  data=await (await post(auth,env,parent)).json();const x=data.assignments.find(x=>x.id==='leon-0');assert.equal(x.done,0);assert.equal(x.submittedDate,'');assert(data.rewards.activity.some(x=>x.kind==='reopened'&&x.assignmentId==='leon-0'));assert(data.rewards.balances.leon>=0);
});
