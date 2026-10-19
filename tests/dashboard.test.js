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
test('optional sessions stay available without entering the class rotation',()=>{
  const source=readFileSync(new URL('../school.js',import.meta.url),'utf8');
  let minutes=555;
  const context=vm.createContext({state:{view:'leon'},scheduleFor:()=>[
    {subject:'math',time:'09:00'},
    {subject:'math',label:'Help session',optional:true,time:'09:10',endTime:'09:30'},
    {subject:'ela',time:'10:00',endTime:'10:45'},
    {subject:'ela',label:'Open Office',optional:true,time:'11:00',endTime:'11:30'}
  ],schoolMinutes:()=>minutes,scheduleMinutes:x=>Number(x.slice(0,2))*60+Number(x.slice(3)),scheduleItemStyle:()=>'',esc:x=>x,scheduleLabel:x=>x.label||x.subject,formatScheduleTime:x=>x});
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
  assert(html.includes('Help session')&&html.includes('Open Office'));
  assert(html.includes('09:10')&&html.includes('11:30'));
  assert(source.includes('${workingAhead(subjects)}${optionalSessions(state.view)}'));
});
test('parent dashboard shows expanded schedules for both children and optional labels',()=>{
  const source=readFileSync(new URL('../school.js',import.meta.url),'utf8');
  const context=vm.createContext({scheduleFor:()=>[{subject:'math',label:'Help session',optional:true,time:'09:00',endTime:'09:30'}],scheduleMinutes:()=>540,scheduleDay:()=> '2026-10-19',dateLabel:x=>x,profileAvatarMark:()=>'',nameOf:x=>x,esc:x=>x,subjectLabel:()=> 'Math',formatScheduleTime:x=>x,scheduleItemStyle:()=>''});
  vm.runInContext(source.slice(source.indexOf('function scheduleLabel('),source.indexOf('function scheduleSnapshot('))+source.slice(source.indexOf('function parentSchedules('),source.indexOf('function weeklyOverview(')),context);
  const html=context.parentSchedules();
  assert.equal((html.match(/<details open>/g)||[]).length,2);
  assert(html.includes('leon')&&html.includes('logan')&&html.includes('Optional · Math · Help session'));
  assert(source.includes('</nav>'+String.fromCharCode(96)+'+parentSchedules()'));
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
