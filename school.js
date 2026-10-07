/* Views, interaction, and durable sync for the family school dashboard. */
const app = document.getElementById('app');
const sessionKey = 'family-assignment-session-v1';
const THEME_PALETTES = {
  coastal:['Coastal','#24637a','#f3f8fa'], material:['Lavender','#65509b','#f8f6fc'], facebook:['Blue','#235dc1','#f5f8ff'], paper:['Warm Paper','#79563a','#f5efe3'],
  forest:['Forest','#316447','#f4f8f4'], sand:['Coffee','#795337','#fbf7f2'], sunset:['Sunset','#a34732','#fff7f2'], peach:['Peach','#bd553d','#fff2eb'], meadow:['Meadow','#46754f','#f2f8ed'],
  berry:['Berry','#8d376e','#fcf5fa'], mint:['Fresh Mint','#216953','#f1faf6'], rose:['Rose','#9d3854','#fff6f8'],
  citrus:['Citrus','#79610e','#fffcef'], arctic:['Arctic','#26647d','#f3faff'], coral:['Coral','#a84942','#fff7f6'],
  midnight:['Midnight','#8db8ff','#111b2b'], dark:['Discord Dark','#a4adff','#1e1f25'], dracula:['Dracula','#c4a7ff','#24212e'], electric:['Electric','#ff6bd6','#171023'], aurora:['Aurora','#70e0c3','#122126'], 'plum-glow':['Plum Glow','#e5a4f5','#24152b'],
  'github-dark':['GitHub Dark','#83b8f9','#10151c'], nord:['Nord','#91c9d7','#252f3d'], monokai:['Monokai','#c4d88a','#24251f'],
  oled:['OLED Black','#b9c9ff','#000000'], slate:['Slate','#a9bcd5','#1e2530'], espresso:['Espresso','#e6b98e','#241b18'],
  aubergine:['Aubergine','#dfb1ec','#281e30'], 'ocean-night':['Ocean Night','#83cdda','#11272e'], 'emerald-night':['Emerald Night','#8cd5ad','#15271f'],
  contrast:['High Contrast','#173fb0','#ffffff'], 'contrast-dark':['High Contrast Dark','#ffe36b','#000000']
};
const DARK_THEME_KEYS = ['midnight','dark','dracula','electric','aurora','plum-glow','github-dark','nord','monokai','oled','slate','espresso','aubergine','ocean-night','emerald-night','contrast-dark'];
const DEFAULT_PREFS = {appearance:'system',lightTheme:'coastal',darkTheme:'midnight',visualStyle:'classic',textSize:'standard',density:'comfortable',classBrowser:false,hideCompleted:true};
state.preferences = {};
state.parentTab = 'overview';
state.pending = [];
state.syncPhase = 'saved';
state.syncError = '';
let pumping = false;
let undoAction = null;

function localRead(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function localWrite(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* UI remains usable when storage is unavailable. */ } }
function scope() { return state.view || 'home'; }
function prefs(forScope = scope()) {
  const local = localRead('school-preferences-'+forScope, {});
  const oldTheme=localStorage.getItem('family-assignment-theme'),legacy=THEME_PALETTES[oldTheme]?{appearance:DARK_THEME_KEYS.includes(oldTheme)?'dark':'light',...(DARK_THEME_KEYS.includes(oldTheme)?{darkTheme:oldTheme}:{lightTheme:oldTheme})}:{};
  const p = forScope==='monitor'||forScope==='home'?{...DEFAULT_PREFS,...legacy,...state.preferences[forScope],...local}:{...DEFAULT_PREFS,...legacy,...local,...state.preferences[forScope]};
  if (!THEME_PALETTES[p.lightTheme] || DARK_THEME_KEYS.includes(p.lightTheme)) p.lightTheme='coastal';
  if (!DARK_THEME_KEYS.includes(p.darkTheme)) p.darkTheme='midnight';
  if (!['classic','boxy','studio','playful','glass'].includes(p.visualStyle)) p.visualStyle='classic';
  return p;
}
function applyPreferences() {
  const p=prefs(), dark=p.appearance==='dark'||p.appearance==='system'&&matchMedia('(prefers-color-scheme: dark)').matches;
  const theme=dark?p.darkTheme:p.lightTheme, palette=THEME_PALETTES[theme], root=document.documentElement;
  root.dataset.theme=theme; root.dataset.mode=dark?'dark':'light'; root.dataset.style=p.visualStyle; root.dataset.size=p.textSize; root.dataset.density=p.density;
  root.dataset.contrast=theme.startsWith('contrast')?'high':'normal';
  root.style.setProperty('--accent',palette[1]); root.style.setProperty('--page',palette[2]);
  document.querySelector('meta[name="theme-color"]').content=palette[2];
}
function setPreference(field, value, forScope=scope()) {
  const p={...prefs(forScope),[field]:value};
  state.preferences[forScope]=p; localWrite('school-preferences-'+forScope,p);
  if(forScope===scope())applyPreferences();
  if(state.auth&&state.auth.role!=='monitor')queuedWrite({preferencesOnly:true,scope:forScope,preferences:p},'Preferences');
  if(field==='classBrowser'||field==='hideCompleted')render();
  document.querySelectorAll('[data-theme-choice]').forEach(button=>button.setAttribute('aria-pressed',String(p[button.dataset.themeField]===button.dataset.themeChoice)));
  document.querySelectorAll('[data-style-choice]').forEach(button=>button.setAttribute('aria-pressed',String(p.visualStyle===button.dataset.styleChoice)));
}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>applyPreferences());
function schoolDay(now=new Date()) {
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
function scheduleDay(){return schoolDay();}
function cleanScheduledDays(days){const keepFrom=schoolMinutes()>=780?scheduleDay():addDays(scheduleDay(),-1);return Object.fromEntries(Object.entries(days||{}).filter(([date])=>date>=keepFrom).map(([date,items])=>[date,copySchedule(items)]));}
function scheduleFor(student,date=scheduleDay()){
  if(Object.hasOwn(state.scheduledDays[student]||{},date))return copySchedule(state.scheduledDays[student][date]);
  return [];
}
function schoolMinutes(now=new Date()) {
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
  return +parts.hour*60 + +parts.minute;
}
function addDays(date,count){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);}
function dateLabel(date, weekday=true){return date?new Date(date+'T12:00:00Z').toLocaleDateString('en-US',{timeZone:'UTC',...(weekday?{weekday:'long'}:{}),month:'short',day:'numeric'}):'No due date';}
function nameOf(student){return student==='leon'?'Leon':student==='logan'?'Logan':'Family';}
function iconOf(student){return student==='leon'?'🚀':'⚡';}
function safeLink(value){try{const url=new URL(value);return ['https:','http:'].includes(url.protocol)?url.href:'';}catch{return '';}}
function jsArg(value){return esc(JSON.stringify(String(value)));}
function allTasks(student){return Object.entries(state.assignments?.[student]||{}).flatMap(([subject,rows])=>rows.map(x=>({...x,subject,student})));}
function findTask(id){for(const [student,subjects] of Object.entries(state.assignments||{}))for(const [subject,rows] of Object.entries(subjects)){const index=rows.findIndex(x=>x.id===id);if(index>=0)return {student,subject,index,x:rows[index]};}}
function dbData(rows){const out={leon:{},logan:{}};for(const row of rows||[])(out[row.student][row.subject]??=[]).push({id:row.id,title:row.title,due:row.due||'',done:!!row.done,url:safeLink(row.url),needsHelp:!!row.needsHelp});return out;}
function dueState(x){return x.done?'complete':!x.due?'undated':x.due<scheduleDay()?'late':x.due===scheduleDay()?'today':'future';}
function dueChip(x){const status=dueState(x);return `<span class="status-chip ${status}">${status==='complete'?'Completed':status==='late'?'Past due · '+dateLabel(x.due,false):status==='today'?'Due today':x.due?'Due '+dateLabel(x.due,false):'No due date'}</span>`;}
function nextDueDate(subjects,today=scheduleDay()){return Object.values(subjects).flat().filter(x=>!x.done&&x.due>today).map(x=>x.due).sort()[0]||'';}
function mast(){
  const student=['leon','logan'].includes(state.view);
  return `<header class="mast"><a href="#" class="brand" onclick="event.preventDefault();${student?'showHub()':state.view==='parent'?"setParentTab('overview')":'render()'}"><span class="brand-mark">${student?iconOf(state.view):'S'}</span><span><b>School Dashboard</b><small>${student?nameOf(state.view)+'’s school day':state.view==='parent'?'Parent workspace':'Your family’s school day'}</small></span></a>${student||state.view==='monitor'?displayCards(state.view):''}<div class="header-actions">${student||state.view==='monitor'||state.view==='parent'?'<button class="button light" onclick="openResources()">School Resources</button>':''}<button class="button light" onclick="openSettings()">Settings</button>${state.view?'<button class="button light" onclick="goHome()">'+(state.view==='monitor'?'Close dashboard':'Sign out')+'</button>':''}</div></header>`;
}
function dashboardClock(){return '<time class="dashboard-clock" id="dashboard-clock" aria-label="Current time"></time>';}
function updateDashboardClock(){
  const clock=document.getElementById('dashboard-clock');if(!clock)return;
  const now=new Date();clock.dateTime=now.toISOString();clock.textContent=now.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit',hour12:true});
}
const FOCUS_TIMER_SECONDS={focus:25*60,break:5*60};
const FOCUS_TIMER_PRESETS=[15,25,45];
function focusTimerDuration(timer){return timer.mode==='focus'?(FOCUS_TIMER_PRESETS.includes(timer.focusMinutes)?timer.focusMinutes:25)*60:FOCUS_TIMER_SECONDS.break;}
function focusTimerState(student=state.view){
  const value=localRead(`school-focus-timer-${student}`,null);
  if(!value||!['focus','break'].includes(value.mode))return {mode:'focus',focusMinutes:25,remaining:FOCUS_TIMER_SECONDS.focus,endsAt:0,focusTaskId:''};
  const focusMinutes=FOCUS_TIMER_PRESETS.includes(Number(value.focusMinutes))?Number(value.focusMinutes):25,duration=value.mode==='focus'?focusMinutes*60:FOCUS_TIMER_SECONDS.break;
  return {mode:value.mode,focusMinutes,remaining:Math.max(0,Math.min(duration,Number(value.remaining)||0)),endsAt:Math.max(0,Number(value.endsAt)||0),focusTaskId:String(value.focusTaskId||'')};
}
function focusTimerRemaining(timer){return timer.endsAt?Math.max(0,Math.ceil((timer.endsAt-Date.now())/1000)):timer.remaining;}
function formatFocusTimer(seconds){return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;}
function saveFocusTimer(timer,student=state.view){localWrite(`school-focus-timer-${student}`,timer);}
function selectFocusTimerMode(mode){if(!FOCUS_TIMER_SECONDS[mode])return;const timer=focusTimerState();timer.mode=mode;timer.remaining=focusTimerDuration(timer);timer.endsAt=0;saveFocusTimer(timer);updateFocusTimer();}
function setFocusTimerLength(minutes){if(!FOCUS_TIMER_PRESETS.includes(Number(minutes)))return;const timer=focusTimerState();timer.focusMinutes=Number(minutes);if(timer.mode==='focus'){timer.remaining=focusTimerDuration(timer);timer.endsAt=0;}saveFocusTimer(timer);updateFocusTimer();}
function setFocusTask(id){const timer=focusTimerState();timer.focusTaskId=id;saveFocusTimer(timer);updateFocusTimer();}
function startFocusTimer(){const timer=focusTimerState();if(!timer.remaining)timer.remaining=focusTimerDuration(timer);timer.endsAt=Date.now()+timer.remaining*1000;saveFocusTimer(timer);updateFocusTimer();}
function pauseFocusTimer(){const timer=focusTimerState();if(!timer.endsAt)return;timer.remaining=focusTimerRemaining(timer);timer.endsAt=0;saveFocusTimer(timer);updateFocusTimer();}
function resetFocusTimer(){const timer=focusTimerState();timer.remaining=focusTimerDuration(timer);timer.endsAt=0;saveFocusTimer(timer);updateFocusTimer();}
function updateFocusTimer(){
  const output=document.getElementById('focus-time');if(!output)return;
  const timer=focusTimerState(),remaining=focusTimerRemaining(timer);let running=!!timer.endsAt;
  if(running&&remaining===0){timer.remaining=0;timer.endsAt=0;running=false;saveFocusTimer(timer);showToast(timer.mode==='focus'?'Focus session complete. Nice work!':'Break complete. Ready to focus again?');}
  else if(!running)timer.remaining=remaining;
  output.textContent=formatFocusTimer(remaining);
  const selected=allTasks(state.view).find(task=>String(task.id)===timer.focusTaskId),taskLabel=document.getElementById('focus-task-current');
  if(taskLabel)taskLabel.textContent=selected?`Working on: ${selected.title}`:'Choose a task, or use the timer on its own.';
  document.getElementById('focus-status').textContent=running?'In progress':remaining===0?'Complete':`Ready · ${timer.mode==='focus'?'focus session':'break'}`;
  document.querySelectorAll('[data-focus-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.focusMode===timer.mode)));
  document.querySelectorAll('[data-focus-length]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.focusLength)===timer.focusMinutes)));
  document.getElementById('focus-start').disabled=running;document.getElementById('focus-pause').disabled=!running;
}
function focusTimerPanel(){
  const timer=focusTimerState(),remaining=focusTimerRemaining(timer);
  const openTasks=allTasks(state.view).filter(task=>!task.done).sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999'));
  const taskOptions=timer.focusTaskId&&!openTasks.some(task=>String(task.id)===timer.focusTaskId)?`<option value="${esc(timer.focusTaskId)}" selected>Previously selected task</option>`:'';
  return `<section class="focus-timer panel" aria-label="Focus timer"><div class="focus-timer-info"><div class="section-heading"><h2>Focus timer</h2><span id="focus-status" class="small">${timer.endsAt?'In progress':remaining===0?'Complete':`Ready · ${timer.mode==='focus'?'focus session':'break'}`}</span></div><div class="focus-controls"><div class="segmented" aria-label="Timer mode"><button type="button" data-focus-mode="focus" aria-pressed="${timer.mode==='focus'}" onclick="selectFocusTimerMode('focus')">Focus</button><button type="button" data-focus-mode="break" aria-pressed="${timer.mode==='break'}" onclick="selectFocusTimerMode('break')">Break · 5 min</button></div><div class="focus-presets" aria-label="Focus session length">${FOCUS_TIMER_PRESETS.map(minutes=>`<button type="button" data-focus-length="${minutes}" aria-pressed="${timer.focusMinutes===minutes}" onclick="setFocusTimerLength(${minutes})">${minutes} min</button>`).join('')}</div></div><label class="focus-task-picker">Working on<select onchange="setFocusTask(this.value)"><option value="">Choose a task (optional)</option>${taskOptions}${openTasks.map(task=>`<option value="${esc(task.id)}" ${String(task.id)===timer.focusTaskId?'selected':''}>${esc(LABELS[task.subject]||task.subject)} · ${esc(task.title)}</option>`).join('')}</select></label><span id="focus-task-current" class="small">${openTasks.find(task=>String(task.id)===timer.focusTaskId)?`Working on: ${esc(openTasks.find(task=>String(task.id)===timer.focusTaskId).title)}`:'Choose a task, or use the timer on its own.'}</span></div><output id="focus-time" class="focus-time" aria-label="Time remaining">${formatFocusTimer(remaining)}</output><div class="focus-actions"><button id="focus-start" class="button" onclick="startFocusTimer()" ${timer.endsAt?'disabled':''}>Start</button><button id="focus-pause" class="button light" onclick="pauseFocusTimer()" ${timer.endsAt?'':'disabled'}>Pause</button><button class="text-button" onclick="resetFocusTimer()">Reset</button></div></section>`;
}
function resources(student=false){
  const links=[SCHOOL_LINKS.star,SCHOOL_LINKS.horizon,student?SCHOOL_LINKS.support:SCHOOL_LINKS.focus];
  return `<section class="resources panel"><div class="section-heading"><h2>School Resources</h2><span class="small">Opens in a new tab</span></div><nav aria-label="School resources">${links.map(([label,url])=>`<a class="resource-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${label}<span aria-hidden="true">↗</span></a>`).join('')}</nav></section>`;
}
function openResources(){openDialog('school-resources',`<h2>School Resources</h2>${resources(['leon','logan'].includes(state.view))}`);}
function displayCards(forScope){return `<section class="reminders" aria-label="Reminders">${(state.displayCards[forScope]||[]).filter(Boolean).map(text=>`<article class="reminder">${esc(text)}</article>`).join('')}</section>`;}
function task(x,student=state.view,readonly=false){
  const disabled=readonly||state.auth?.role==='monitor',id=jsArg(x.id),url=safeLink(x.url);
  return `<article class="task ${x.done?'done':''}" data-task-id="${esc(x.id)}"><label class="completion"><input type="checkbox" ${x.done?'checked':''} ${disabled?'disabled':''} onchange="toggleTask(${id},this.checked,this)" aria-label="${x.done?'Reopen':'Complete'} ${esc(x.title)}"></label><div class="task-content"><span class="task-name">${esc(x.title)}</span><div class="task-meta">${dueChip(x)}${x.needsHelp&&!x.done?'<span class="status-chip help">Needs help</span>':''}</div><div class="task-actions">${url?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">Open assignment ↗</a>`:''}${!disabled&&!x.done?`<button class="text-button" aria-pressed="${!!x.needsHelp}" onclick="toggleHelp(${id})">${x.needsHelp?'Clear help request':'I need help'}</button>`:''}</div></div></article>`;
}
function taskGroups(subjects,filter,student=state.view,readonly=false){
  const groups=Object.entries(subjects).map(([subject,rows])=>[subject,rows.filter(filter).sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999'))]).filter(([,rows])=>rows.length);
  return groups.map(([subject,rows])=>`<details class="subject-group" open><summary><span class="subject-dot" style="--subject-color:var(--subject-${subject},var(--accent))"></span>${esc(LABELS[subject]||subject)}<span class="count">${rows.length}</span></summary><div class="assignment-list">${rows.map(x=>task(x,student,readonly)).join('')}</div></details>`).join('');
}
function workSection(subjects,status,student=state.view,readonly=false){
  const today=scheduleDay(),filter=x=>!x.done&&x.due&&(status==='today'?x.due===today:x.due<today),count=Object.values(subjects).flat().filter(filter).length;
  return `<details id="${student}-${status}-work" class="work-section ${status}"><summary class="section-heading"><h2>${status==='today'?'Due Today':'Past Due'} <span class="count">${count}</span></h2></summary>${count?`<div class="due-list" tabindex="0" role="region" aria-label="${nameOf(student)} ${status==='today'?'due today':'past due'} assignments">${taskGroups(subjects,filter,student,readonly)}</div>`:`<p class="empty">${status==='today'?'You’re caught up for today.':'No past-due assignments.'}</p>`}</details>`;
}
function workingAhead(subjects,student=state.view,readonly=false){
  const date=nextDueDate(subjects),count=Object.values(subjects).flat().filter(x=>!x.done&&date&&x.due===date).length;
  return `<details id="${student}-ahead-work" class="work-section ahead"><summary class="section-heading"><h2>Working Ahead <span class="count">${count}</span></h2><span class="small">${date?'Next due · '+dateLabel(date):'Next due date'}</span></summary>${date?`<div class="due-list" tabindex="0" role="region" aria-label="${nameOf(student)} working ahead assignments">${taskGroups(subjects,x=>!x.done&&x.due===date,student,readonly)}</div>`:'<p class="empty">No upcoming assignments.</p>'}</details>`;
}
function scheduleMinutes(value){const [h,m]=String(value||'').split(':').map(Number);return Number.isInteger(h)&&Number.isInteger(m)?h*60+m:-1;}
function formatScheduleTime(value){const minutes=scheduleMinutes(value);return minutes<0?'':`${Math.floor(minutes/60)%12||12}:${String(minutes%60).padStart(2,'0')} ${minutes<720?'AM':'PM'}`;}
function scheduleLabel(item){return item.subject&&!['custom','break'].includes(item.subject)?LABELS[item.subject]||item.subject:item.label||'Break';}
function scheduleItemStyle(item){return `--item-color:var(--subject-${item.subject},var(--accent))`;}
function scheduleSnapshot(student){
  const items=scheduleFor(student).filter(x=>scheduleMinutes(x.time)>=0).sort((a,b)=>scheduleMinutes(a.time)-scheduleMinutes(b.time)),minutes=schoolMinutes();
  const started=items.findLastIndex(x=>scheduleMinutes(x.time)<=minutes),next=items.findIndex(x=>scheduleMinutes(x.time)>minutes);
  const end=started<0?-1:items[started].endTime?scheduleMinutes(items[started].endTime):items[started+1]?scheduleMinutes(items[started+1].time):-1;
  const current=started>=0&&(end<0||minutes<end)?started:-1;
  // Old schedules without a final end time retain an honest last-started label.
  const visibleItems=items.flatMap((item,i)=>{
    const itemEnd=item.endTime?scheduleMinutes(item.endTime):items[i+1]?scheduleMinutes(items[i+1].time):-1;
    const elapsed=itemEnd>=0&&minutes>=itemEnd;
    return elapsed?[]:[{item,status:i===current?'current':''}];
  });
  const previous=started>=0?(current>=0?started-1:started):-1;
  return {items,visibleItems,previous,current,next,currentLabel:end<0&&started>=0?'Latest start':'Now'};
}
function classTimeline(student=state.view){
  const {items,previous,current,next,currentLabel}=scheduleSnapshot(student);
  const card=(index,label,kind)=>`<div class="class-timeline-card ${kind}"><span class="small">${label}</span>${index>=0?`<strong>${esc(scheduleLabel(items[index]))}</strong><time>${formatScheduleTime(items[index].time)}${items[index].endTime?' – '+formatScheduleTime(items[index].endTime):''}</time>`:`<strong>${kind==='previous'?'No previous class':kind==='current'?'No class right now':'No more classes'}</strong>`}</div>`;
  return `<div class="class-orbit">${card(previous,'Previous','previous')}<div class="class-orbit-center">${dashboardClock()}${card(current,'Current','current')}</div>${card(next,'Next','next')}</div>`;
}
function schedulePanel(student=state.view,showNowNext=true){
  const {items,visibleItems,current,next,currentLabel}=scheduleSnapshot(student);
  const slot=(index,label)=>`<div class="now-slot ${['Now','Latest start'].includes(label)&&index>=0?'current-now':''}"><span class="small">${label}</span>${index>=0?`<strong>${esc(scheduleLabel(items[index]))}</strong><span>${formatScheduleTime(items[index].time)}${items[index].endTime?' – '+formatScheduleTime(items[index].endTime):''}</span>`:'<strong>'+(label==='Next'?'No more classes':'No class right now')+'</strong>'}</div>`;
  const canPreview=state.view==='monitor'||['leon','logan'].includes(state.view)&&state.view===student;
  const previewButton=canPreview?`<button class="button light" onclick="previewTomorrowSchedule('${student}')">Preview tomorrow</button>`:'';
  const scheduleDetails=items.length?`<details class="daily-schedule ${showNowNext?'panel':''}"><summary>Today’s schedule <span class="count">${visibleItems.length}</span></summary>${visibleItems.length?`<div class="schedule-list">${visibleItems.map(({item,status})=>`<div class="schedule-item ${status}" style="${scheduleItemStyle(item)}"><span>${esc(scheduleLabel(item))}</span><time>${formatScheduleTime(item.time)}${item.endTime?' – '+formatScheduleTime(item.endTime):''}</time></div>`).join('')}</div>`:'<p class="empty">No upcoming schedule items today.</p>'}</details>`:'';
  if(!showNowNext)return `<div class="schedule-stack" data-schedule="${student}"><section class="schedule panel"><div class="section-heading">${previewButton}</div>${scheduleDetails||`<details class="daily-schedule"><summary>Today’s schedule <span class="count">0</span></summary><p class="empty">No schedule set for today.</p></details>`}</section></div>`;
  return `<div class="schedule-stack" data-schedule="${student}"><section class="schedule panel"><div class="section-heading">${previewButton}</div>${items.length?`<div class="now-next">${slot(current,currentLabel)}${slot(next,'Next')}</div>`:'<p class="empty">No schedule set for today.</p>'}</section>${scheduleDetails}</div>`;
}
function previewTomorrowSchedule(student=state.view){
  if(!['leon','logan'].includes(student))return;
  const date=addDays(scheduleDay(),1),items=scheduleFor(student,date).filter(x=>scheduleMinutes(x.time)>=0).sort((a,b)=>scheduleMinutes(a.time)-scheduleMinutes(b.time));
  const content=items.length?`<div class="schedule-list">${items.map(item=>`<div class="schedule-item" style="${scheduleItemStyle(item)}"><span>${esc(scheduleLabel(item))}</span><time>${formatScheduleTime(item.time)}${item.endTime?' – '+formatScheduleTime(item.endTime):''}</time></div>`).join('')}</div>`:'<p class="empty">No schedule is set for tomorrow.</p>';
  openDialog('tomorrow-schedule',`<h2>${nameOf(student)}’s schedule for tomorrow</h2><p class="small">${dateLabel(date)} · Preview only</p>${content}`);
}
function showHub(){state.subjectView=null;render();}
function openSubject(subject){state.subjectView=subject;state.subjectTaskView='all';render();}
function classBrowser(){const subjects=state.assignments[state.view];return `<section class="panel"><h2>Classes</h2><div class="class-picker">${Object.entries(subjects).map(([subject,rows])=>`<button class="button light" onclick="openSubject(${jsArg(subject)})"><span class="subject-dot" style="--subject-color:var(--subject-${subject},var(--accent))"></span><span>${esc(LABELS[subject]||subject)}<small>${rows.filter(x=>!x.done).length} to do</small></span></button>`).join('')}</div></section>`;}
function studentPage(){
  const subjects=state.assignments[state.view],today=scheduleDay(),rows=Object.values(subjects).flat(),due=rows.filter(x=>x.due===today),complete=due.filter(x=>x.done).length;
  const overdue=rows.filter(x=>!x.done&&x.due&&x.due<today).length,nextDate=nextDueDate(subjects),ahead=rows.filter(x=>!x.done&&nextDate&&x.due===nextDate).length;
  const hero=`<section class="page-heading student-page-heading"><div class="student-date"><p class="small">${dateLabel(today)}</p></div>${classTimeline(state.view)}<div class="heading-summary"><nav class="work-shortcuts" aria-label="Jump to assignments"><a class="late" href="#${state.view}-late-work">Past Due <b>${overdue}</b></a><a href="#${state.view}-today-work">Today <b>${due.length-complete}</b></a><a href="#${state.view}-ahead-work">Next <b>${ahead}</b></a></nav><span class="progress-caption">${due.length?complete+' of '+due.length+' due today completed':'A fresh day to learn'}</span></div></section>`;
  if(state.subjectView){
    const subject=state.subjectView,items=subjects[subject]||[],filter=x=>(!prefs().hideCompleted||!x.done)&&(state.subjectTaskView!=='soon'||x.due&&x.due<=addDays(today,7));
    return mast()+`<section class="page-heading"><div><button class="text-button" onclick="showHub()">← Back to dashboard</button><h1>${esc(LABELS[subject]||subject)}</h1></div></section><div class="toolbar"><label class="switch"><input type="checkbox" ${prefs().hideCompleted?'checked':''} onchange="setPreference('hideCompleted',this.checked)">Hide completed</label><div class="segmented"><button aria-pressed="${state.subjectTaskView!=='soon'}" onclick="state.subjectTaskView='all';render()">All work</button><button aria-pressed="${state.subjectTaskView==='soon'}" onclick="state.subjectTaskView='soon';render()">Due within a week</button></div></div><section class="panel assignment-list">${items.filter(filter).sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999')).map(x=>task(x)).join('')||'<p class="empty">No assignments in this view.</p>'}</section>`;
  }
  return mast()+hero+`<div class="student-dashboard-grid"><div class="work-board">${workSection(subjects,'late')}${workSection(subjects,'today')}${workingAhead(subjects)}</div>${schedulePanel(state.view,false)}</div>`/* Focus timer parked for later: +focusTimerPanel() */+(prefs().classBrowser?classBrowser():'');
}
function loginPage(){return mast()+`<section class="login"><p class="eyebrow">Your day, organized</p><h1>Ready for your school day?</h1><p class="small">Choose your profile to see classes and assignments.</p><div class="people">${['leon','logan'].map(student=>`<button class="person" onclick="signIn('${student}')"><span class="emoji">${iconOf(student)}</span><b>${nameOf(student)}</b><span class="small">Open my dashboard</span></button>`).join('')}</div><div class="home-actions"><button class="button" onclick="openMonitor()">Shared school dashboard</button><button class="button light" onclick="signIn('parent')">Parent sign in</button></div>${state.loadError?`<p class="form-error" role="alert">${esc(state.loadError)}</p><button class="button light" onclick="restoreSession()">Retry connection</button>`:''}</section>`;}
function render(){
  const expanded=new Map([...app.querySelectorAll('details.work-section')].map(node=>[node.id,node.open]));
  applyPreferences();app.className='shell'+(state.view==='parent'?' parent-workspace':state.view==='monitor'?' shared-workspace':['leon','logan'].includes(state.view)?' student-workspace':'');
  if(!state.view)app.innerHTML=loginPage();
  else if(state.view==='parent')app.innerHTML=parentPage();
  else if(state.view==='monitor')app.innerHTML=sharedPage();
  else app.innerHTML=studentPage();
  updateDashboardClock();updateFocusTimer();
  for(const node of app.querySelectorAll('details.work-section')){node.open=expanded.get(node.id)??['leon','logan'].includes(state.view);node.addEventListener('toggle',updateWorkOverflow);}
  for(const node of app.querySelectorAll('details.subject-group'))node.addEventListener('toggle',updateWorkOverflow);
  updateSyncStatus();updateWorkOverflow();
}
function updateWorkOverflow(){for(const list of document.querySelectorAll('.work-board .due-list')){const section=list.closest('.work-section'),tasks=[...list.querySelectorAll('.subject-group[open] .task')];if(!section.open||tasks.length<=2){list.style.maxHeight='';list.style.overflowY='';section.classList.remove('has-more-work');continue;}const height=Math.ceil(tasks[1].getBoundingClientRect().bottom-list.getBoundingClientRect().top+list.scrollTop);list.style.maxHeight=`${height}px`;list.style.overflowY='auto';section.classList.add('has-more-work');}}
window.addEventListener('resize',updateWorkOverflow);
document.fonts.ready.then(updateWorkOverflow);
function editor(){render();}
function monitorPage(){state.view='monitor';render();}
function acceptAuth(data,session){
  state.assignments=dbData(data.assignments);loadSchedules(data.schedules);loadCards(data.cards);
  state.preferences=data.preferences||{};state.auth=session;state.syncPhase='saved';state.syncError='';state.view=session.role==='monitor'?'monitor':session.role==='parent'?'parent':session.role;
  state.subjectView=null;state.loadError='';state.pending=localRead('school-pending-'+session.role,[]).filter(item=>item&&item.body&&typeof item.label==='string');
  // Replay unsaved edits into the fetched snapshot so a reload does not hide them.
  for(const item of state.pending){const c=item.body.change;if(c){const found=findTask(c.id);if(c.type==='add'&&!found)(state.assignments[c.student][c.subject]??=[]).push({...c});else if(c.type==='remove'&&found)state.assignments[found.student][found.subject].splice(found.index,1);else if(found){const previous=found.subject;Object.assign(found.x,c);if(c.subject&&c.subject!==previous){state.assignments[found.student][previous].splice(found.index,1);(state.assignments[found.student][c.subject]??=[]).push(found.x);}}}if(item.body.preferencesOnly)state.preferences[item.body.scope]=item.body.preferences;if(item.body.scheduleOnly){const {student,date,items}=item.body;(state.scheduledDays[student]??={})[date]=copySchedule(items);if(state.scheduleDates[student]===date)state.schedules[student]=copySchedule(items)}if(item.body.cardsOnly)loadCards(item.body.cards);}
  localWrite(sessionKey,session);render();if(state.pending.length)pumpWrites();
}
async function fetchAuth(session){const r=await fetch('/api/auth',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(session)});const data=await r.json();if(!r.ok)throw Object.assign(Error(data.error||'Sign-in failed.'),{status:r.status});return data;}
async function restoreSession(){
  const session=localRead(sessionKey,null);if(!session||!['leon','logan','parent','monitor'].includes(session.role)){render();return;}
  try{acceptAuth(await fetchAuth(session),session);}catch(error){if(error.status===401)localStorage.removeItem(sessionKey);state.loadError=error.status===401?'Please sign in again.':'Couldn’t connect. Your saved session is still available; retry when you’re online.';render();}
}
function signIn(role){
  openDialog('sign-in',`<p class="small">${role==='parent'?'Parent workspace':nameOf(role)+'’s dashboard'}</p><h2>Sign in</h2><form id="sign-in-form" onsubmit="submitSignIn(event,${jsArg(role)})"><label>Password<input name="password" type="password" autocomplete="current-password" required autofocus></label><p class="form-error" id="sign-in-error" role="alert"></p><button class="button" type="submit">Sign in</button></form>`);
}
async function submitSignIn(event,role){
  event.preventDefault();const form=event.target,button=form.querySelector('button'),session={role,password:new FormData(form).get('password')};button.disabled=true;button.textContent='Signing in…';
  try{const data=await fetchAuth(session);closeDialog();acceptAuth(data,session);}catch(error){document.getElementById('sign-in-error').textContent=error.status?error.message:'Couldn’t connect. Please try again.';button.disabled=false;button.textContent='Sign in';}
}
async function openMonitor(){try{acceptAuth(await fetchAuth({role:'monitor'}),{role:'monitor'});}catch(error){state.loadError=error.status?error.message:'Couldn’t open the dashboard. Please try again.';render();}}
function goHome(){
  if(pumping||state.pending.length){openDialog('pending-sign-out','<h2>Changes are still waiting to save</h2><p>Save or retry your changes before switching profiles. This keeps your work with the correct account.</p><button class="button" onclick="retryWrites();closeDialog()">Retry saving</button>');return;}
  closeDialog();localStorage.removeItem(sessionKey);state.view=null;state.auth=null;state.subjectView=null;state.preferences={};state.loadError='';render();
}

function persistQueue(){if(state.auth)localWrite('school-pending-'+state.auth.role,state.pending);}
function updateSyncStatus(){
  const node=document.getElementById('sync-status');node.hidden=!state.auth||state.auth.role==='monitor'||state.syncPhase!=='failed'&&!state.pending.length;
  node.className=state.syncPhase;
  node.innerHTML=state.syncPhase==='failed'?`<span>Couldn’t save · ${esc(state.syncError)}</span><button class="text-button" onclick="retryWrites()">Retry</button>`:state.pending.length?`<span>Saving ${state.pending.length>1?state.pending.length+' changes':'changes'}…</span>`:'<span>✓ All changes saved</span>';
}
function showSaveStatus(message,failed=false){if(failed){state.syncPhase='failed';state.syncError=message;updateSyncStatus();}else showToast(message);}
function queuedWrite(body,label){
  if(!state.auth||state.auth.role==='monitor')return Promise.resolve(false);
  const {role,password,view,...payload}=body;
  state.pending.push({body:JSON.parse(JSON.stringify(payload)),label});persistQueue();updateSyncStatus();
  return pumpWrites();
}
async function pumpWrites(){
  if(pumping||state.syncPhase==='failed')return false;
  pumping=true;state.syncPhase='saving';updateSyncStatus();
  try{
    while(state.pending.length){
      const item=state.pending[0];
      const r=await fetch('/api/assignments',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...item.body,role:state.auth.role,password:state.auth.password})});
      if(!r.ok){const data=await r.json().catch(()=>({}));throw Error(data.error||'Please retry when connected.');}
      state.pending.shift();persistQueue();updateSyncStatus();
    }
    state.syncPhase='saved';state.syncError='';return true;
  }catch(error){state.syncPhase='failed';state.syncError=error.message==='Failed to fetch'?'Connection unavailable.':error.message;return false;}
  finally{pumping=false;updateSyncStatus();}
}
function retryWrites(){state.syncPhase='saved';return pumpWrites();}
window.addEventListener('online',()=>{if(state.pending.length)retryWrites();});
window.addEventListener('beforeunload',event=>{if(state.pending.length){event.preventDefault();event.returnValue='';}});
function saveAssignmentChange(type,found){
  const x=found.x,change={type,student:found.student,subject:found.subject,id:x.id,title:x.title,due:x.due,done:x.done,url:x.url||'',needsHelp:!!x.needsHelp};
  if(type==='status'){delete change.title;delete change.due;delete change.subject;delete change.url;}
  return queuedWrite({change},'Assignment');
}
function saveScheduleChanges(student=state.editorStudent||'leon',date=state.scheduleDates[student]||scheduleDay()){
  return queuedWrite({student,date,items:copySchedule(state.scheduledDays[student]?.[date]||[]),scheduleOnly:true},'Schedule');
}
function toggleTask(id,done,checkbox){
  const found=findTask(id);if(!found)return;
  if(done&&['leon','logan'].includes(state.auth?.role)){
    if(checkbox)checkbox.checked=false;
    openDialog('complete-assignment',`<h2>Mark this assignment complete?</h2><p>${esc(found.x.title)}</p><p class="small">Are you ready to mark this assignment as done?</p><div class="actions"><button class="button light" onclick="closeDialog()">Keep working</button><button class="button" onclick="confirmCompleteTask(${jsArg(id)})">Yes, mark complete</button></div>`);return;
  }
  saveTaskStatus(found,done);
}
function confirmCompleteTask(id){const found=findTask(id);closeDialog();if(found)saveTaskStatus(found,true);}
function saveTaskStatus(found,done){
  const id=found.x.id;
  const previous={done:found.x.done,needsHelp:found.x.needsHelp};found.x.done=done;if(done)found.x.needsHelp=false;
  saveAssignmentChange('status',found);render();
  showToast(done?'Assignment completed':'Assignment reopened',()=>{const current=findTask(id);if(!current)return;Object.assign(current.x,previous);saveAssignmentChange('status',current);render();});
}
function toggleHelp(id){const found=findTask(id);if(!found||found.x.done)return;found.x.needsHelp=!found.x.needsHelp;saveAssignmentChange('status',found);render();showToast(found.x.needsHelp?'Help request added for your parent':'Help request cleared');}
function showToast(message,undo=null){const node=document.getElementById('toast');undoAction=undo;node.hidden=false;node.innerHTML=`<span>${esc(message)}</span>${undo?'<button class="text-button" onclick="undoToast()">Undo</button>':''}<button class="text-button" aria-label="Dismiss message" onclick="document.getElementById('toast').hidden=true">×</button>`;clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>{node.hidden=true;undoAction=null;},10000);}
function undoToast(){const action=undoAction;undoAction=null;document.getElementById('toast').hidden=true;if(action)action();}

function openDialog(id,content){
  const returnFocus=document.activeElement;closeDialog();const dialog=document.createElement('dialog');dialog.id='app-dialog';dialog.dataset.dialog=id;
  dialog.innerHTML=`<div class="dialog-top"><button class="button light" onclick="closeDialog()" aria-label="Close dialog">Close</button></div>${content}`;
  dialog.addEventListener('close',()=>{dialog.remove();if(!document.getElementById('app-dialog')){if(returnFocus?.isConnected&&!returnFocus.closest('dialog'))returnFocus.focus({preventScroll:true});else app.focus({preventScroll:true});}});document.body.append(dialog);dialog.showModal();dialog.querySelector('[autofocus],input,select')?.focus();
}
function closeDialog(){document.getElementById('app-dialog')?.close();}
function openSettings(){
  state.settingsScope=scope();drawSettings();
}
function themeChoices(dark,p){const field=dark?'darkTheme':'lightTheme';return Object.entries(THEME_PALETTES).filter(([key])=>DARK_THEME_KEYS.includes(key)===dark).map(([key,[label,accent,bg]])=>`<button type="button" class="theme-swatch" data-theme-choice="${key}" data-theme-field="${field}" aria-pressed="${p[field]===key}" onclick="setPreference('${field}','${key}',state.settingsScope)"><span class="swatch" style="background:${bg};border-color:${accent}"><i style="background:${accent}"></i></span>${label}</button>`).join('');}
function styleChoices(p){return [['classic','Classic','Keep the familiar rounded style'],['boxy','Boxy','Sharp corners and crisp edges'],['studio','Studio','Layered surfaces with a polished finish'],['playful','Playful','Bright accents and extra-round shapes'],['glass','Glass','Frosted layers with clear readable cards']].map(([key,label,description])=>`<button type="button" class="style-choice" data-style-choice="${key}" aria-pressed="${p.visualStyle===key}" onclick="setPreference('visualStyle','${key}',state.settingsScope)"><span class="style-sample" data-preview="${key}" aria-hidden="true"><i></i><b></b><em></em></span><strong>${label}</strong><span class="small">${description}</span></button>`).join('');}
function drawSettings(){
  const forScope=state.settingsScope,p=prefs(forScope),parent=state.auth?.role==='parent',opt=(value,label,current)=>`<option value="${value}" ${value===current?'selected':''}>${label}</option>`;
  openDialog('settings',`<h2>Settings</h2><p class="small">${state.auth?.role==='monitor'||!state.auth?'Saved on this device.':'Saved for this profile and synced across devices.'}</p>${parent?`<label>Profile<select onchange="state.settingsScope=this.value;drawSettings()">${['parent','leon','logan','monitor'].map(s=>opt(s,s==='parent'?'Parent':s==='monitor'?'Shared dashboard':nameOf(s),forScope)).join('')}</select></label>`:''}<div class="settings-grid"><label>Appearance<select onchange="setPreference('appearance',this.value,state.settingsScope)">${['system','light','dark'].map(v=>opt(v,v==='system'?'Follow device':v==='light'?'Light':'Dark',p.appearance)).join('')}</select></label><label>Text size<select onchange="setPreference('textSize',this.value,state.settingsScope)">${opt('standard','Standard',p.textSize)+opt('large','Large',p.textSize)}</select></label><label>Spacing<select onchange="setPreference('density',this.value,state.settingsScope)">${opt('comfortable','Comfortable',p.density)+opt('compact','Compact',p.density)}</select></label></div><h3>Interface style</h3><div class="style-grid">${styleChoices(p)}</div>${['leon','logan'].includes(forScope)?`<label class="switch"><input type="checkbox" ${p.classBrowser?'checked':''} onchange="setPreference('classBrowser',this.checked,state.settingsScope)">Show class browser on dashboard</label><label class="switch"><input type="checkbox" ${p.hideCompleted?'checked':''} onchange="setPreference('hideCompleted',this.checked,state.settingsScope)">Hide completed in class lists</label>`:''}<h3>Light theme</h3><div class="theme-grid">${themeChoices(false,p)}</div><h3>Dark theme</h3><div class="theme-grid">${themeChoices(true,p)}</div><p class="small">Subject and assignment status colors stay consistent in every theme.</p>`);
  if(parent&&forScope==='parent')document.getElementById('app-dialog').insertAdjacentHTML('beforeend','<button class="button light" onclick="openPasswordSettings()">Change parent password</button>');
}
function openPasswordSettings(){openDialog('password',`<h2>Change parent password</h2><form onsubmit="changeParentPassword(event)"><label>Current password<input name="current" type="password" autocomplete="current-password" required></label><label>New password<input name="next" type="password" autocomplete="new-password" minlength="4" required></label><label>Confirm new password<input name="confirm" type="password" autocomplete="new-password" minlength="4" required></label><p id="password-error" class="form-error" role="alert"></p><button class="button" type="submit">Save password</button></form>`);}
async function changeParentPassword(event){
  event.preventDefault();const form=event.target,data=new FormData(form),error=document.getElementById('password-error'),button=form.querySelector('button');
  if(data.get('next')!==data.get('confirm')){error.textContent='The new passwords do not match.';return;}
  if(state.pending.length||pumping){error.textContent='Save or retry your pending changes first.';return;}
  button.disabled=true;
  try{
    const response=await fetch('/api/assignments',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({role:'parent',password:data.get('current'),passwordOnly:true,nextPassword:data.get('next')})});
    if(!response.ok){const result=await response.json();throw Error(response.status===401?'Check your current password.':result.error||'Couldn’t change the password.');}
    state.auth.password=data.get('next');localWrite(sessionKey,state.auth);closeDialog();showToast('Parent password updated');
  }catch(problem){error.textContent=problem.message;button.disabled=false;}
}

function setParentTab(tab){state.parentTab=tab;render();}
function parentPage(){
  const tabs=[['overview','Weekly overview'],['assignments','Assignments']];
  const editActions=`<div class="parent-tab-actions"><button class="button light" onclick="openFamilyEditorChooser('schedule')">Edit schedule</button><button class="button light" onclick="openFamilyEditorChooser('reminders')">Edit reminders</button></div>`;
  return mast()+`<section class="page-heading"><div><p class="small">Family workspace</p><h1>Parent dashboard</h1></div><div class="actions"><button class="button light" onclick="refreshDashboard()">Refresh</button><button class="button light" onclick="downloadBackup()">Download backup</button></div></section><nav class="parent-tabs" aria-label="Parent workspace">${tabs.map(([key,label])=>`<button class="button ${state.parentTab===key?'':'light'}" aria-current="${state.parentTab===key?'page':'false'}" onclick="setParentTab('${key}')">${label}</button>`).join('')}${editActions}</nav>`+(state.parentTab==='assignments'?assignmentEditor():weeklyOverview());
}
function weeklyOverview(){
  const start=scheduleDay(),end=addDays(start,6),students=['leon','logan'];
  const summary=students.map(student=>{const rows=allTasks(student),week=rows.filter(x=>x.due>=start&&x.due<=end);return `<article class="panel summary-card"><h2>${iconOf(student)} ${nameOf(student)}</h2><div class="summary-stats"><span><b>${week.filter(x=>!x.done).length}</b>Upcoming</span><span><b>${rows.filter(x=>!x.done&&x.due&&x.due<start).length}</b>Past due</span><span><b>${rows.filter(x=>!x.done&&x.needsHelp).length}</b>Need help</span></div><button class="text-button" onclick="editStudent('${student}')">Manage ${nameOf(student)}’s assignments →</button></article>`;}).join('');
  const help=students.flatMap(s=>allTasks(s)).filter(x=>!x.done&&x.needsHelp);
  return `<section class="weekly"><div class="section-heading"><h2>The next seven days</h2><span class="small">${dateLabel(start,false)} – ${dateLabel(end,false)}</span></div><div class="summary-grid">${summary}</div><section class="panel help-panel"><h2>Help requests <span class="count">${help.length}</span></h2>${help.length?help.map(x=>`<div class="help-request"><div><strong>${nameOf(x.student)} · ${esc(LABELS[x.subject]||x.subject)}</strong><span>${esc(x.title)}</span></div><div class="actions"><button class="button light" onclick="editStudent('${x.student}',${jsArg(x.subject)})">View assignment</button><button class="button light" onclick="toggleHelp(${jsArg(x.id)})">Clear request</button></div></div>`).join(''):'<p class="empty">No help requests right now.</p>'}</section><div class="week-list">${Array.from({length:7},(_,i)=>{const date=addDays(start,i);return `<section class="panel week-day"><h3>${dateLabel(date)}</h3><div class="week-students">${students.map(student=>{const rows=allTasks(student).filter(x=>x.due===date),schedule=scheduleFor(student,date);return `<div class="week-student ${student}"><h4 class="child-label">${iconOf(student)} ${nameOf(student)}</h4>${rows.length?rows.map(x=>`<div class="week-task ${x.done?'done':''}"><span>${esc(x.title)}</span>${dueChip(x)}</div>`).join(''):'<p class="small">No assignments due.</p>'}<details><summary>Schedule <span class="count">${schedule.length}</span></summary>${schedule.length?schedule.map(x=>`<div class="schedule-item" style="${scheduleItemStyle(x)}"><span>${esc(scheduleLabel(x))}</span><time>${formatScheduleTime(x.time)}</time></div>`).join(''):'<p class="small">No schedule set.</p>'}</details></div>`;}).join('')}</div></section>`;}).join('')}</div></section>`;
}
function editStudent(student,subject){state.editorStudent=student;state.editorSubject=subject||Object.keys(state.assignments[student])[0];state.parentTab='assignments';render();}
function assignmentEditor(){
  const student=state.editorStudent||'leon',subjects=state.assignments[student],selected=subjects[state.editorSubject]?state.editorSubject:Object.keys(subjects)[0];state.editorSubject=selected;
  const rows=subjects[selected]||[],shown=rows.filter(x=>!state.editorHideCompleted||!x.done).sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999'));
  return `<section class="parent-page panel"><div class="editor-toolbar"><label>Child<select onchange="editStudent(this.value)">${['leon','logan'].map(s=>`<option value="${s}" ${s===student?'selected':''}>${nameOf(s)}</option>`).join('')}</select></label><label>Subject<select onchange="state.editorSubject=this.value;render()">${Object.keys(subjects).map(s=>`<option value="${s}" ${s===selected?'selected':''}>${esc(LABELS[s]||s)}</option>`).join('')}</select></label><label class="switch"><input type="checkbox" ${state.editorHideCompleted?'checked':''} onchange="state.editorHideCompleted=this.checked;render()">Hide completed</label></div><p class="small">Changes save automatically to your family account.</p><div class="toolbar"><button class="button" onclick="openAssignmentForm()">Add assignment</button><button class="button light" onclick="openImport()">Import assignments</button></div><h2>${esc(LABELS[selected]||selected||'Assignments')}</h2><div class="editor-assignments">${shown.map(x=>`<article class="editor-assignment"><div>${task(x,student)}<span class="small">${x.url?'Assignment link added':'No assignment link'}</span></div><div class="editor-actions"><button class="button light" onclick="openAssignmentForm(${jsArg(x.id)})">Edit</button><button class="text-button danger" onclick="removeTask(${jsArg(x.id)})">Remove</button></div></article>`).join('')||'<p class="empty">No assignments in this view.</p>'}</div></section>`;
}
function openAssignmentForm(id=''){
  const found=id?findTask(id):null,student=found?.student||state.editorStudent||'leon',subject=found?.subject||state.editorSubject,x=found?.x||{};
  openDialog('assignment-form',`<h2>${id?'Edit':'Add'} assignment</h2><form onsubmit="submitAssignment(event,${jsArg(id)})"><label>Title<input name="title" value="${esc(x.title||'')}" required maxlength="2000" autofocus></label><div class="settings-grid"><label>Due date<input type="date" name="due" value="${esc(x.due||'')}"></label><label>Subject<select name="subject">${Object.keys(state.assignments[student]).map(s=>`<option value="${s}" ${s===subject?'selected':''}>${esc(LABELS[s]||s)}</option>`).join('')}</select></label></div><label>Assignment link <span class="small">Optional</span><input type="url" name="url" value="${esc(x.url||'')}" placeholder="https://…"><small>Paste the direct link from the school site.</small></label><p class="form-error" id="assignment-error" role="alert"></p><button class="button" type="submit">${id?'Save changes':'Add assignment'}</button></form>`);
}
function submitAssignment(event,id){
  event.preventDefault();const data=new FormData(event.target),url=String(data.get('url')||'').trim(),title=String(data.get('title')).trim();
  if(!title||url&&!safeLink(url)){document.getElementById('assignment-error').textContent='Enter a title and a complete http or https link.';return;}
  const found=id?findTask(id):null,student=found?.student||state.editorStudent||'leon',subject=data.get('subject');
  const x={...(found?.x||{id:crypto.randomUUID(),done:false,needsHelp:false}),title,due:data.get('due')||'',url:safeLink(url)};
  if(found)state.assignments[student][found.subject].splice(found.index,1);
  (state.assignments[student][subject]??=[]).push(x);state.editorSubject=subject;
  saveAssignmentChange(id?'update':'add',{student,subject,x});closeDialog();render();
}
function removeTask(id){
  const found=findTask(id);if(!found)return;
  openDialog('remove-assignment',`<h2>Remove assignment?</h2><p>${esc(found.x.title)}</p><p class="small">You can undo the removal immediately afterward.</p><button class="button danger" onclick="confirmRemove(${jsArg(id)})">Remove assignment</button>`);
}
function confirmRemove(id){const found=findTask(id);if(!found)return;state.assignments[found.student][found.subject].splice(found.index,1);saveAssignmentChange('remove',found);closeDialog();render();showToast('Assignment removed',()=>{state.assignments[found.student][found.subject].push(found.x);saveAssignmentChange('add',found);render();});}
function downloadBackup(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({assignments:state.assignments,schedules:schedulePayload(),cards:state.displayCards,preferences:state.preferences},null,2)],{type:'application/json'}));a.download='school-dashboard-backup-'+scheduleDay()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
function sharedPage(){return mast()+`<section class="page-heading"><div><p class="small">${dateLabel(scheduleDay())}</p><h1>Our school day</h1></div>${dashboardClock()}<button class="button light" onclick="refreshDashboard()">Refresh</button></section><p id="shared-refresh-status" class="small" role="status">${esc(state.refreshError||'')}</p><div class="shared-grid">${['leon','logan'].map(student=>`<article class="shared-child"><h2>${iconOf(student)} ${nameOf(student)}</h2><div class="work-board">${workSection(state.assignments[student],'late',student,true)}${workSection(state.assignments[student],'today',student,true)}${workingAhead(state.assignments[student],student,true)}</div>${schedulePanel(student)}</article>`).join('')}</div>`;}
async function refreshDashboard(silent=false){
  if(!state.auth||state.pending.length||pumping){if(!silent)showToast('Save your pending changes before refreshing.');return;}
  if(state.refreshing)return;state.refreshing=true;
  try{
    const auth=state.auth,data=await fetchAuth(auth);state.refreshError='';
    const snapshot=JSON.stringify(data);
    if(!silent||snapshot!==state.sharedSnapshot){acceptAuth(data,auth);state.sharedSnapshot=snapshot;}
    if(!silent)showToast('Dashboard refreshed');
  }catch{if(!silent)showToast('Couldn’t refresh. Please try again.');else state.refreshError='Connection unavailable. Showing the last loaded data.';}
  finally{state.refreshing=false;const status=document.getElementById('shared-refresh-status');if(status)status.textContent=state.refreshError||'';}
}

function openFamilyEditorChooser(editor){
  const label=editor==='schedule'?'schedule':'reminders';
  openDialog('family-editor-chooser',`<h2>Choose whose ${label} to edit</h2><div class="class-picker">${['leon','logan'].map(student=>`<button class="button light" onclick="openFamilyEditor('${editor}','${student}')">${iconOf(student)} ${nameOf(student)}</button>`).join('')}</div>`);
}
function openFamilyEditor(editor,student){if(editor==='schedule')openScheduleFor(student);else openCardEditor(student);}
function openScheduleFor(student){state.editorStudent=student;state.scheduleDates[student]=scheduleDay();state.schedules[student]=scheduleFor(student);openScheduleEditor();}
function openScheduleEditor(){
  const student=state.editorStudent||'leon',items=state.schedules[student]||[],subjects=Object.keys(state.assignments[student]),date=state.scheduleDates[student]||scheduleDay();
  openDialog('schedule',`<h2>${nameOf(student)}’s schedule</h2><p class="small">All times use Eastern Time. Time changes save as soon as you choose them. Save this day for other edits.</p><label>Schedule date<input type="date" value="${date}" min="${scheduleDay()}" onchange="selectScheduleDate(this.value)"></label><p class="small">${esc(state.scheduleMessage||'')}</p><div class="schedule-editor">${items.map((x,i)=>`<div class="schedule-row"><label>Class<select onchange="setScheduleSubject(${i},this.value)">${[...subjects,'custom','break'].map(s=>`<option value="${s}" ${x.subject===s?'selected':''}>${esc(LABELS[s]||s)}</option>`).join('')}</select></label><label>Label<input value="${esc(x.label||'')}" onchange="editScheduleEntry(${i},'label',this.value)" ${!['custom','break'].includes(x.subject)?'disabled':''}></label><label>Start<input type="time" value="${esc(x.time||'')}" onchange="editScheduleEntry(${i},'time',this.value)"></label><label>End <span class="small">Optional</span><input type="time" value="${esc(x.endTime||'')}" onchange="editScheduleEntry(${i},'endTime',this.value)"></label><button class="text-button danger" onclick="removeScheduleEntry(${i})">Remove</button></div>`).join('')}</div><div class="toolbar"><button class="button" onclick="addScheduleEntry()">Add class or break</button><button class="button light" onclick="openScheduleImport()">Import schedule</button><button class="button light" onclick="clearOpenSchedule()">Clear this day</button><button class="button" onclick="saveOpenSchedule()">Save this day</button></div>`);
}
function closeScheduleEditor(){closeDialog();}
function refreshScheduleEditor(){render();openScheduleEditor();}
function addScheduleEntry(){
  const student=state.editorStudent||'leon';
  (state.schedules[student]??=[]).push({type:'class',subject:Object.keys(state.assignments[student])[0]||'custom',label:'Custom event',time:'09:00',endTime:''});
  state.scheduleMessage='Unsaved changes';refreshScheduleEditor();
}
function setScheduleSubject(index,subject){
  const student=state.editorStudent||'leon',item=state.schedules[student][index];
  item.subject=subject;item.type=subject==='break'?'break':'class';
  if(subject!=='custom')item.label=subject==='break'?'Break':LABELS[subject]||subject;
  state.scheduleMessage='Unsaved changes';refreshScheduleEditor();
}
function editScheduleEntry(index,field,value){
  const student=state.editorStudent||'leon',item=state.schedules[student][index];
  item[field]=value;state.scheduleMessage='Unsaved changes';
  if(field==='time'||field==='endTime'){
    commitOpenSchedule();state.scheduleMessage='Time changes save automatically';saveScheduleChanges(student);
  }
}
function openCardEditor(student){
  const fields=forScope=>`<div class="card-edit-grid">${state.displayCards[forScope].map((value,i)=>`<label>Reminder ${i+1}<input maxlength="120" value="${esc(value)}" onchange="editDisplayCard('${forScope}',${i},this.value)"></label>`).join('')}</div>`;
  openDialog('reminders',`<h2>Edit reminders</h2><p class="small">Changes save when you leave a field.</p><h3>${nameOf(student)}’s reminders</h3>${fields(student)}<h3>Shared dashboard reminders</h3>${fields('monitor')}`);
}
function editDisplayCard(forScope,index,value){state.displayCards[forScope][index]=value;return queuedWrite({cards:state.displayCards,cardsOnly:true},'Reminders');}

// Keep legacy school-site imports, but present them in accessible native dialogs.
const assignmentImportContent=openImport;
openImport=()=>{assignmentImportContent();const legacy=document.getElementById('import-modal');const content=legacy.querySelector('.import-box');content.querySelector('button')?.remove();const markup=content.innerHTML;legacy.remove();openDialog('assignment-import',`<div id="import-modal">${markup}</div>`);};
closeImport=()=>closeDialog();
const scheduleImportContent=openScheduleImport;
openScheduleImport=()=>{scheduleImportContent();const legacy=document.getElementById('schedule-import-modal');const content=legacy.querySelector('.import-box');content.querySelector('button')?.remove();const markup=content.innerHTML;legacy.remove();openDialog('schedule-import',`<div id="schedule-import-modal">${markup}</div>`);};
closeScheduleImport=()=>closeDialog();

function refreshVisibleSchedules(){
  const orbit=document.querySelector('.student-page-heading .class-orbit');
  if(orbit){const replacement=document.createElement('div');replacement.innerHTML=classTimeline(state.view);const next=replacement.firstElementChild,oldClock=orbit.querySelector('#dashboard-clock'),nextClock=next.querySelector('#dashboard-clock');if(oldClock&&nextClock){nextClock.dateTime=oldClock.dateTime;nextClock.textContent=oldClock.textContent;}if(orbit.innerHTML!==next.innerHTML)orbit.replaceWith(next);}
  for(const node of document.querySelectorAll('[data-schedule]')){
    const details=node.querySelector('details'),open=details?.open,student=node.dataset.schedule;
    const replacement=document.createElement('div');replacement.innerHTML=schedulePanel(student,state.view==='monitor');const next=replacement.firstElementChild;if(open)next.querySelector('details')?.setAttribute('open','');if(node.innerHTML!==next.innerHTML)node.replaceWith(next);
  }
}
setInterval(updateDashboardClock,15000);
setInterval(updateFocusTimer,1000);
setInterval(()=>{refreshVisibleSchedules();if(state.view==='monitor'&&!document.hidden&&!document.getElementById('app-dialog'))refreshDashboard(true);},60000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshVisibleSchedules();});
applyPreferences();restoreSession();
