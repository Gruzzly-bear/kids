/* Views, interaction, and durable sync for the family school dashboard. */
const app = document.getElementById('app');
const sessionKey = 'family-assignment-session-v1';
const THEME_PALETTES = {
  coastal:['Coastal','#005f73','#d7f5f2','#f4fffd','#bdebe5','#77bdb7','#123f46','#365e63'],
  material:['Lavender','#5b35b5','#efe5ff','#fcf9ff','#ded0ff','#b79ceb','#30204e','#62537e'],
  facebook:['Blue','#0d47a1','#e0ecff','#f7faff','#c9dcff','#8eb3f2','#17345e','#405b83'],
  paper:['Warm Paper','#7a3e00','#fff0cc','#fffaf0','#f7dda3','#d7a65b','#4a2c11','#705435'],
  forest:['Forest','#1b5e20','#e6f5d4','#f8fff0','#cdebb4','#91bc76','#213e24','#4e674b'],
  sand:['Coffee','#704214','#fae7c8','#fff9ef','#f0d5ab','#c5a16b','#412a17','#69533a'],
  sunset:['Sunset','#9c2f00','#ffe3c6','#fff8ef','#ffd1a6','#d78c54','#4f281b','#79513c'],
  peach:['Peach','#a52a2a','#ffe2d5','#fff8f5','#ffcdbb','#d28775','#4a2526','#76514f'],
  meadow:['Meadow','#3f6212','#f1f7c9','#fbffed','#e2ed9d','#a6b751','#37411c','#535d2e'],
  berry:['Berry','#9d174d','#fce0ef','#fff7fb','#f8c9de','#d487ac','#4c1f36','#75485f'],
  mint:['Fresh Mint','#00695c','#d7f8e9','#f3fff8','#b6eed1','#70b998','#173e34','#40675a'],
  rose:['Rose','#9f1239','#ffe0e9','#fff7f9','#ffc6d6','#d7869c','#4b1e2d','#744653'],
  citrus:['Citrus','#765500','#fff4a8','#fffce6','#fbe77a','#c8a33d','#493912','#6c5a2a'],
  arctic:['Arctic','#075985','#dcefff','#f4faff','#c0e2ff','#7bafd4','#18384e','#405a68'],
  coral:['Coral','#a82e23','#ffe0d8','#fff7f4','#ffc6b8','#d27f6d','#4d2521','#704740'],
  midnight:['Midnight','#8db8ff','#111b2b'], dark:['Discord Dark','#a4adff','#1e1f25'], dracula:['Dracula','#c4a7ff','#24212e'], electric:['Electric','#ff6bd6','#171023'], aurora:['Aurora','#70e0c3','#122126'], 'plum-glow':['Plum Glow','#e5a4f5','#24152b'],
  'github-dark':['GitHub Dark','#83b8f9','#10151c'], nord:['Nord','#91c9d7','#252f3d'], monokai:['Monokai','#c4d88a','#24251f'],
  oled:['OLED Black','#b9c9ff','#000000'], slate:['Slate','#a9bcd5','#1e2530'], espresso:['Espresso','#e6b98e','#241b18'],
  aubergine:['Aubergine','#dfb1ec','#281e30'], 'ocean-night':['Ocean Night','#83cdda','#11272e'], 'emerald-night':['Emerald Night','#8cd5ad','#15271f'],
  nes:['NES Classic','#c62828','#f3ead8','#fffaf1','#e9dfcb','#b7a98f','#342b24','#655a4f'],
  gameboy:['Game Boy','#536c3c','#b8c99a','#dce8b8','#aab986','#7d8e5a','#25301e','#536143'],
  snes:['Super Nintendo','#6545a5','#ded5ee','#f5f1fa','#cec2e6','#9483b7','#2f2840','#5c546d'],
  genesis:['Sega Genesis','#4ca2ff','#101928'],atari:['Atari 2600','#f2a93b','#20152b'],arcade:['Arcade Cabinet','#ff4fd8','#130c1a'],
  playstation:['PlayStation','#2e5bac','#e3e7ee','#f9fafc','#d5dce8','#a5b1c3','#202a3a','#4c5869'],
  book:['Book','#725737','#eee3cc','#f8f1e3','#e8dcc2','#cbb992','#332a20','#665846'],
  'sepia-story':['Sepia Story','#7a4d2b','#e9d7b8','#f4e8d2','#dec6a2','#b8996e','#38291c','#685542'],
  'comic-book':['Comic Book','#c62828','#fff2a8','#fffbe0','#f8df68','#d3a72c','#332514','#665533'],
  'pastel-pop':['Pastel Pop','#8b5cf6','#f1e9ff','#fcf9ff','#e5d7ff','#b9a0e8','#352450','#635478'],
  'sakura-paper':['Sakura Paper','#b83262','#f8e7e7','#fff8f5','#f1d5d8','#d7a5ac','#452a30','#76575c'],
  chalkboard:['Chalkboard','#b5e6a4','#14271f'],
  'arcade-cyan':['Arcade Cyan','#48f0e0','#101d2b'],
  'space-cadet':['Space Cadet','#87aaff','#101727'],
  contrast:['High Contrast','#173fb0','#ffffff'], 'contrast-dark':['High Contrast Dark','#ffe36b','#000000']
};
const DARK_THEME_KEYS = ['midnight','dark','dracula','electric','aurora','plum-glow','github-dark','nord','monokai','oled','slate','espresso','aubergine','ocean-night','emerald-night','genesis','atari','arcade','chalkboard','arcade-cyan','space-cadet','contrast-dark'];
const DEFAULT_PREFS = {appearance:'system',lightTheme:'coastal',darkTheme:'midnight',visualStyle:'classic',textSize:'standard',density:'comfortable',clockFormat:'12h',motion:'system',classBrowser:false,hideCompleted:true};
state.preferences = {};
state.parentTab = 'overview';
state.pending = [];
state.syncPhase = 'saved';
state.syncError = '';
state.liveSyncError = '';
let pumping = false;
let pumpPromise = null;
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
  if (!['classic','boxy','studio','playful','glass','minimal','comic','retro','pixel','book'].includes(p.visualStyle)) p.visualStyle='classic';
  if (!['system','light','dark'].includes(p.appearance)) p.appearance='system';
  if (!['standard','large','small','extra-large'].includes(p.textSize)) p.textSize='standard';
  if (!['comfortable','compact'].includes(p.density)) p.density='comfortable';
  if (!['12h','24h'].includes(p.clockFormat)) p.clockFormat='12h';
  if (!['system','reduced','full'].includes(p.motion)) p.motion='system';
  return p;
}
function activeTheme(p){const dark=p.appearance==='dark'||p.appearance==='system'&&matchMedia('(prefers-color-scheme: dark)').matches;return dark?p.darkTheme:p.lightTheme;}
function applyPreferences() {
  const p=prefs(), dark=p.appearance==='dark'||p.appearance==='system'&&matchMedia('(prefers-color-scheme: dark)').matches;
  const theme=dark?p.darkTheme:p.lightTheme, palette=THEME_PALETTES[theme], root=document.documentElement;
  root.dataset.theme=theme; root.dataset.mode=dark?'dark':'light'; root.dataset.style=p.visualStyle; root.dataset.size=p.textSize; root.dataset.density=p.density;root.dataset.motion=p.motion;
  root.dataset.contrast=theme.startsWith('contrast')?'high':'normal';
  root.style.setProperty('--accent',palette[1]); root.style.setProperty('--page',palette[2]);
  root.style.setProperty('--on-accent',dark?'var(--page)':'#ffffff');
  const lightTokens=['--surface','--surface-2','--line','--ink','--muted'];
  if(dark||theme==='contrast')lightTokens.forEach(token=>root.style.removeProperty(token));
  else ['--surface','--surface-2','--line','--ink','--muted'].forEach((token,index)=>root.style.setProperty(token,palette[index+3]));
  document.querySelector('meta[name="theme-color"]').content=palette[2];
}
function setPreference(field, value, forScope=scope()) {
  const p={...prefs(forScope),[field]:value};
  state.preferences[forScope]=p; localWrite('school-preferences-'+forScope,p);
  if(forScope===scope())applyPreferences();
  if(state.auth&&state.auth.role!=='monitor')queuedWrite({preferencesOnly:true,scope:forScope,preferences:p},'Preferences');
  if(field==='classBrowser'||field==='hideCompleted'||field==='clockFormat')render();
  updateAppearanceControls(p);
}
function selectTheme(theme,forScope=scope()){
  if(!THEME_PALETTES[theme])return;
  const dark=DARK_THEME_KEYS.includes(theme),p={...prefs(forScope),appearance:dark?'dark':'light',[dark?'darkTheme':'lightTheme']:theme};
  state.preferences[forScope]=p;localWrite('school-preferences-'+forScope,p);
  if(forScope===scope())applyPreferences();
  if(state.auth&&state.auth.role!=='monitor')queuedWrite({preferencesOnly:true,scope:forScope,preferences:p},'Preferences');
  updateAppearanceControls(p);
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
function scheduleAssignmentSubject(item){
  if(!item||item.type==='break'||item.subject==='break')return'';
  if(item.subject&&item.subject!=='custom')return item.subject;
  const label=String(item.label||'').trim(),normalized=label.toLowerCase().replace(/\s+/g,' ');
  const knownSubject=Object.entries(LABELS).find(([key,name])=>normalized===key||normalized===name.toLowerCase());
  if(knownSubject)return knownSubject[0];
  if(['english language arts','ela'].includes(normalized))return'ela';
  if(['physical ed','p.e.'].includes(normalized))return'pe';
  const slug=normalized.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,32);
  return slug?`custom-${slug}`:'custom';
}
function scheduledItems(student){return [...Object.values(state.scheduledDays?.[student]||{}).flat(),...(state.schedules?.[student]||[])];}
function subjectLabel(subject,student='leon'){
  if(LABELS[subject])return LABELS[subject];
  const added=state.assignmentSubjectCatalogs?.[student]?.added?.find(item=>item.id===subject);
  if(added)return added.label;
  const scheduled=scheduledItems(student).find(item=>scheduleAssignmentSubject(item)===subject&&item.label);
  if(scheduled)return scheduled.label;
  return String(subject||'').replace(/[-_]+/g,' ').replace(/\b\w/g,char=>char.toUpperCase());
}
function ensureAssignmentSlots(){
  if(!state.assignments)return;
  for(const student of ['leon','logan']){
    state.assignments[student]??={};
    const catalog=state.assignmentSubjectCatalogs?.[student]||{added:[],hidden:[]},hidden=new Set(catalog.hidden||[]);
    for(const item of scheduledItems(student)){
      const subject=scheduleAssignmentSubject(item);
      if(subject&&!subject.startsWith('custom-')&&!hidden.has(subject))(state.assignments[student][subject]??=[]);
    }
    for(const item of catalog.added||[])if(item?.id&&!hidden.has(item.id))(state.assignments[student][item.id]??=[]);
  }
}
function dueState(x){return x.done?'complete':!x.due?'undated':x.due<scheduleDay()?'late':x.due===scheduleDay()?'today':'future';}
function dueChip(x){const status=dueState(x);return `<span class="status-chip ${status}">${status==='complete'?'Completed':status==='late'?'Past due · '+dateLabel(x.due,false):status==='today'?'Due today':x.due?'Due '+dateLabel(x.due,false):'No due date'}</span>`;}
function nextDueDate(subjects,today=scheduleDay()){return Object.values(subjects).flat().filter(x=>!x.done&&x.due>today).map(x=>x.due).sort()[0]||'';}
function mast(){
  const student=['leon','logan'].includes(state.view);
  return `<header class="mast"><a href="#" class="brand" onclick="event.preventDefault();${student?'showHub()':state.view==='parent'?"setParentTab('overview')":'render()'}"><span class="brand-mark">${student?iconOf(state.view):'S'}</span><span><b>School Dashboard</b><small>${student?nameOf(state.view)+'’s school day':state.view==='parent'?'Parent workspace':'Your family’s school day'}</small></span></a><div class="header-actions">${student||state.view==='monitor'||state.view==='parent'?'<button class="button light" onclick="openResources()">School Resources</button>':''}<button class="button light" onclick="openSettings()">Settings</button>${state.view?'<button class="button light" onclick="'+(state.view==='monitor'?'closeMonitor()':'goHome()')+'">'+(state.view==='monitor'?(state.parentReturnSession?'Back to parent':'Close dashboard'):'Sign out')+'</button>':''}</div></header>`;
}
function dashboardClock(){return '<time class="dashboard-clock" id="dashboard-clock" aria-label="Current time"></time>';}
function updateDashboardClock(){
  const clock=document.getElementById('dashboard-clock');if(!clock)return;
  const now=new Date(),format=prefs().clockFormat;clock.dateTime=now.toISOString();clock.textContent=now.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit',hour12:format!=='24h'});
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
  return `<section class="focus-timer panel" aria-label="Focus timer"><div class="focus-timer-info"><div class="section-heading"><h2>Focus timer</h2><span id="focus-status" class="small">${timer.endsAt?'In progress':remaining===0?'Complete':`Ready · ${timer.mode==='focus'?'focus session':'break'}`}</span></div><div class="focus-controls"><div class="segmented" aria-label="Timer mode"><button type="button" data-focus-mode="focus" aria-pressed="${timer.mode==='focus'}" onclick="selectFocusTimerMode('focus')">Focus</button><button type="button" data-focus-mode="break" aria-pressed="${timer.mode==='break'}" onclick="selectFocusTimerMode('break')">Break · 5 min</button></div><div class="focus-presets" aria-label="Focus session length">${FOCUS_TIMER_PRESETS.map(minutes=>`<button type="button" data-focus-length="${minutes}" aria-pressed="${timer.focusMinutes===minutes}" onclick="setFocusTimerLength(${minutes})">${minutes} min</button>`).join('')}</div></div><label class="focus-task-picker">Working on<select onchange="setFocusTask(this.value)"><option value="">Choose a task (optional)</option>${taskOptions}${openTasks.map(task=>`<option value="${esc(task.id)}" ${String(task.id)===timer.focusTaskId?'selected':''}>${esc(subjectLabel(task.subject,task.student))} · ${esc(task.title)}</option>`).join('')}</select></label><span id="focus-task-current" class="small">${openTasks.find(task=>String(task.id)===timer.focusTaskId)?`Working on: ${esc(openTasks.find(task=>String(task.id)===timer.focusTaskId).title)}`:'Choose a task, or use the timer on its own.'}</span></div><output id="focus-time" class="focus-time" aria-label="Time remaining">${formatFocusTimer(remaining)}</output><div class="focus-actions"><button id="focus-start" class="button" onclick="startFocusTimer()" ${timer.endsAt?'disabled':''}>Start</button><button id="focus-pause" class="button light" onclick="pauseFocusTimer()" ${timer.endsAt?'':'disabled'}>Pause</button><button class="text-button" onclick="resetFocusTimer()">Reset</button></div></section>`;
}
function resources(student=false){
  const links=[SCHOOL_LINKS.star,SCHOOL_LINKS.horizon,student?SCHOOL_LINKS.support:SCHOOL_LINKS.focus];
  return `<section class="resources panel"><div class="section-heading"><h2>School Resources</h2><span class="small">Opens in a new tab</span></div><nav aria-label="School resources">${links.map(([label,url])=>`<a class="resource-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${label}<span aria-hidden="true">↗</span></a>`).join('')}</nav></section>`;
}
function openResources(){openDialog('school-resources',`<h2>School Resources</h2>${resources(['leon','logan'].includes(state.view))}`);}
function displayCards(forScope){const reminders=(state.displayCards[forScope]||[]).filter(Boolean);return reminders.length?`<section class="quick-reminders" aria-label="Quick reminders"><h2>Quick reminders</h2><div class="reminder-grid">${reminders.map((text,index)=>`<article class="reminder"><span aria-hidden="true">${['✨','📚','💧','⭐'][index%4]}</span>${esc(text.replace(/^(?:🎯|📚|💧|⭐)\s*/,''))}</article>`).join('')}</div></section>`:'';}
function easternDateTimeNow(){const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()).filter(part=>part.type!=='literal').map(part=>[part.type,part.value]));return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;}
function announcementWhen(item){if(!item.startsAt)return'Live now';const date=item.startsAt.slice(0,10),time=item.startsAt.slice(11),now=easternDateTimeNow(),today=now.slice(0,10);return date<today?'Expired':date===today?(item.startsAt<=now?'Showing today':`Today at ${formatScheduleTime(time)}`):`${dateLabel(date,false)} at ${formatScheduleTime(time)}`;}
function visibleAnnouncements(student,now=easternDateTimeNow()){const today=now.slice(0,10);return(state.announcements[student]||[]).filter(item=>item.enabled&&(!item.title&&!item.message?false:!item.startsAt||item.startsAt.slice(0,10)===today&&item.startsAt<=now));}
function announcementBanner(student){const styles={celebration:{icon:'🎉',label:'A celebration for you'},encouragement:{icon:'💪',label:'A little encouragement'},notice:{icon:'📣',label:'A note for today'}};return visibleAnnouncements(student).map(announcement=>{const style=styles[announcement.style]||styles.celebration;return `<section class="announcement ${announcement.style}" data-announcement-id="${esc(announcement.id)}" aria-label="Announcement for ${nameOf(student)}" aria-live="polite"><div class="announcement-sparkles" aria-hidden="true">${announcement.style==='celebration'?'✦　✧　✦':''}</div><div class="announcement-label"><span aria-hidden="true">${style.icon}</span>${style.label}</div>${announcement.title?`<h2>${esc(announcement.title)}</h2>`:''}${announcement.message?`<p>${esc(announcement.message)}</p>`:''}</section>`;}).join('');}
function studentAnnouncementStack(student){return `<div id="student-announcements">${announcementBanner(student)}</div>${displayCards(student)}`;}
function refreshVisibleAnnouncements(){if(!['leon','logan'].includes(state.view))return;const target=document.getElementById('student-announcements');if(!target)return;const visible=visibleAnnouncements(state.view).map(item=>item.id).join('|'),shown=[...target.querySelectorAll('[data-announcement-id]')].map(node=>node.dataset.announcementId).join('|');if(visible!==shown)target.innerHTML=announcementBanner(state.view);}
function dashboardCardsPayload(){return{leon:state.displayCards.leon,logan:state.displayCards.logan,announcements:state.announcements};}
function task(x,student=state.view,readonly=false){
  const disabled=readonly||state.auth?.role==='monitor',id=jsArg(x.id),url=safeLink(x.url);
  return `<article class="task ${x.done?'done':''}" data-task-id="${esc(x.id)}"><label class="completion"><input type="checkbox" ${x.done?'checked':''} ${disabled?'disabled':''} onchange="toggleTask(${id},this.checked,this)" aria-label="${x.done?'Reopen':'Complete'} ${esc(x.title)}"></label><div class="task-content"><span class="task-name">${esc(x.title)}</span><div class="task-meta">${dueChip(x)}${x.needsHelp&&!x.done?'<span class="status-chip help">Needs help</span>':''}</div><div class="task-actions">${url?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">Open assignment ↗</a>`:''}${!disabled&&!x.done?`<button class="text-button" aria-pressed="${!!x.needsHelp}" onclick="toggleHelp(${id})">${x.needsHelp?'Clear help request':'I need help'}</button>`:''}</div></div></article>`;
}
function taskGroups(subjects,filter,student=state.view,readonly=false){
  const groups=Object.entries(subjects).map(([subject,rows])=>[subject,rows.filter(filter).sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999'))]).filter(([,rows])=>rows.length);
  return groups.map(([subject,rows])=>`<details class="subject-group" open><summary><span class="subject-dot" style="--subject-color:var(--subject-${subject},var(--accent))"></span>${esc(subjectLabel(subject,student))}<span class="count">${rows.length}</span></summary><div class="assignment-list">${rows.map(x=>task(x,student,readonly)).join('')}</div></details>`).join('');
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
function formatScheduleTime(value){const minutes=scheduleMinutes(value);if(minutes<0)return'';const hour=Math.floor(minutes/60),minute=minutes%60;return prefs().clockFormat==='24h'?`${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`:`${hour%12||12}:${String(minute).padStart(2,'0')} ${hour<12?'AM':'PM'}`;}
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
function classBrowser(){const subjects=state.assignments[state.view];return `<section class="panel"><h2>Classes</h2><div class="class-picker">${Object.entries(subjects).map(([subject,rows])=>`<button class="button light" onclick="openSubject(${jsArg(subject)})"><span class="subject-dot" style="--subject-color:var(--subject-${subject},var(--accent))"></span><span>${esc(subjectLabel(subject,state.view))}<small>${rows.filter(x=>!x.done).length} to do</small></span></button>`).join('')}</div></section>`;}
function studentPage(){
  const subjects=state.assignments[state.view],today=scheduleDay(),rows=Object.values(subjects).flat(),due=rows.filter(x=>x.due===today),complete=due.filter(x=>x.done).length;
  const overdue=rows.filter(x=>!x.done&&x.due&&x.due<today).length,nextDate=nextDueDate(subjects),ahead=rows.filter(x=>!x.done&&nextDate&&x.due===nextDate).length;
  const hero=`<section class="page-heading student-page-heading"><div class="student-date"><p class="small">${dateLabel(today)}</p></div>${classTimeline(state.view)}<div class="heading-summary"><nav class="work-shortcuts" aria-label="Jump to assignments"><a class="late" href="#${state.view}-late-work">Past Due <b>${overdue}</b></a><a href="#${state.view}-today-work">Today <b>${due.length-complete}</b></a><a href="#${state.view}-ahead-work">Next <b>${ahead}</b></a></nav><span class="progress-caption">${due.length?complete+' of '+due.length+' due today completed':'A fresh day to learn'}</span></div></section>`;
  if(state.subjectView){
    const subject=state.subjectView,items=subjects[subject]||[],filter=x=>(!prefs().hideCompleted||!x.done)&&(state.subjectTaskView!=='soon'||x.due&&x.due<=addDays(today,7));
    return mast()+studentAnnouncementStack(state.view)+`<section class="page-heading"><div><button class="text-button" onclick="showHub()">← Back to dashboard</button><h1>${esc(subjectLabel(subject,state.view))}</h1></div></section><div class="toolbar"><label class="switch"><input type="checkbox" ${prefs().hideCompleted?'checked':''} onchange="setPreference('hideCompleted',this.checked)">Hide completed</label><div class="segmented"><button aria-pressed="${state.subjectTaskView!=='soon'}" onclick="state.subjectTaskView='all';render()">All work</button><button aria-pressed="${state.subjectTaskView==='soon'}" onclick="state.subjectTaskView='soon';render()">Due within a week</button></div></div><section class="panel assignment-list">${items.filter(filter).sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999')).map(x=>task(x)).join('')||'<p class="empty">No assignments in this view.</p>'}</section>`;
  }
  return mast()+studentAnnouncementStack(state.view)+hero+`<div class="student-dashboard-grid"><div class="work-board">${workSection(subjects,'late')}${workSection(subjects,'today')}${workingAhead(subjects)}</div>${schedulePanel(state.view,false)}</div>`/* Focus timer parked for later: +focusTimerPanel() */+(prefs().classBrowser?classBrowser():'');
}
function loginPage(){return mast()+`<section class="login"><p class="eyebrow">Your day, organized</p><h1>Ready for your school day?</h1><p class="small">Choose your profile to see classes and assignments.</p><div class="people">${['leon','logan'].map(student=>`<button class="person" onclick="signIn('${student}')"><span class="emoji">${iconOf(student)}</span><b>${nameOf(student)}</b><span class="small">Open my dashboard</span></button>`).join('')}</div><div class="home-actions"><button class="button light" onclick="signIn('parent')">Parent sign in</button></div>${state.loadError?`<p class="form-error" role="alert">${esc(state.loadError)}</p><button class="button light" onclick="restoreSession()">Retry connection</button>`:''}</section>`;}
function render(){
  const expanded=new Map([...app.querySelectorAll('details.work-section')].map(node=>[node.id,node.open]));
  ensureAssignmentSlots();
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
  const nextView=session.role==='monitor'?'monitor':session.role==='parent'?'parent':session.role,subjectView=state.view===nextView?state.subjectView:null;
  state.assignments=dbData(data.assignments);loadSchedules(data.schedules);loadCards(data.cards);
  state.preferences=data.preferences||{};state.assignmentSubjectCatalogs={leon:{added:[],hidden:[]},logan:{added:[],hidden:[]},...(data.assignmentSubjectCatalogs||{})};state.auth=session;state.syncPhase='saved';state.syncError='';state.liveSyncError='';state.view=nextView;
  state.subjectView=subjectView;state.sharedSnapshot=JSON.stringify(data);state.loadError='';state.pending=localRead('school-pending-'+session.role,[]).filter(item=>item&&item.body&&typeof item.label==='string');
  // Replay unsaved edits into the fetched snapshot so a reload does not hide them.
  for(const item of state.pending){const c=item.body.change;if(c){const found=findTask(c.id);if(c.type==='add'&&!found)(state.assignments[c.student][c.subject]??=[]).push({...c});else if(c.type==='remove'&&found)state.assignments[found.student][found.subject].splice(found.index,1);else if(found){const previous=found.subject;Object.assign(found.x,c);if(c.subject&&c.subject!==previous){state.assignments[found.student][previous].splice(found.index,1);(state.assignments[found.student][c.subject]??=[]).push(found.x);}}}if(item.body.preferencesOnly)state.preferences[item.body.scope]=item.body.preferences;if(item.body.subjectsOnly)state.assignmentSubjectCatalogs[item.body.student]=item.body.catalog;if(item.body.scheduleOnly){const {student,date,items}=item.body;(state.scheduledDays[student]??={})[date]=copySchedule(items);if(state.scheduleDates[student]===date)state.schedules[student]=copySchedule(items)}if(item.body.cardsOnly)loadCards(item.body.cards);}
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
async function openMonitor(){
  const parentSession=state.auth?.role==='parent'?{...state.auth}:null;
  try{acceptAuth(await fetchAuth({role:'monitor'}),{role:'monitor'});state.parentReturnSession=parentSession;render();}
  catch(error){state.loadError=error.status?error.message:'Couldn’t open the dashboard. Please try again.';render();}
}
async function closeMonitor(){
  const parentSession=state.parentReturnSession;state.parentReturnSession=null;
  if(!parentSession){goHome();return;}
  try{acceptAuth(await fetchAuth(parentSession),parentSession);}
  catch{state.parentReturnSession=parentSession;showToast('Couldn’t return to the parent dashboard. Please retry.');}
}
function goHome(){
  if(pumping||state.pending.length){openDialog('pending-sign-out','<h2>Changes are still waiting to save</h2><p>Save or retry your changes before switching profiles. This keeps your work with the correct account.</p><button class="button" onclick="retryWrites();closeDialog()">Retry saving</button>');return;}
  closeDialog();localStorage.removeItem(sessionKey);state.view=null;state.auth=null;state.subjectView=null;state.preferences={};state.loadError='';render();
}

function persistQueue(){if(state.auth)localWrite('school-pending-'+state.auth.role,state.pending);}
function updateSyncStatus(){
  const node=document.getElementById('sync-status');node.hidden=!state.auth||state.syncPhase!=='failed'&&!state.pending.length&&!state.liveSyncError;
  node.className=state.liveSyncError&&!state.pending.length&&state.syncPhase!=='failed'?'failed':state.syncPhase;
  node.innerHTML=state.syncPhase==='failed'?`<span>Couldn’t save · ${esc(state.syncError)}</span><button class="text-button" onclick="retryWrites()">Retry</button>`:state.pending.length?`<span>Saving ${state.pending.length>1?state.pending.length+' changes':'changes'}…</span>`:state.liveSyncError?`<span>Couldn’t check for updates</span><button class="text-button" onclick="refreshDashboard()">Retry</button>`:'';
}
function showSaveStatus(message,failed=false){if(failed){state.syncPhase='failed';state.syncError=message;updateSyncStatus();}else showToast(message);}
function queuedWrite(body,label){
  if(!state.auth||state.auth.role==='monitor')return Promise.resolve(false);
  const {role,password,view,...payload}=body;
  state.pending.push({body:JSON.parse(JSON.stringify(payload)),label});persistQueue();updateSyncStatus();
  return pumpWrites();
}
function pumpWrites(){
  if(pumping)return pumpPromise||Promise.resolve(false);
  if(state.syncPhase==='failed')return Promise.resolve(false);
  pumping=true;state.syncPhase='saving';updateSyncStatus();
  pumpPromise=(async()=>{
    try{
      while(state.pending.length){
        const item=state.pending[0];
        const r=await fetch('/api/assignments',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...item.body,role:state.auth.role,password:state.auth.password})});
        if(!r.ok){const data=await r.json().catch(()=>({}));throw Error(data.error||'Please retry when connected.');}
        state.pending.shift();persistQueue();state.liveSyncError='';updateSyncStatus();
      }
      state.syncPhase='saved';state.syncError='';return true;
    }catch(error){state.syncPhase='failed';state.syncError=error.message==='Failed to fetch'?'Connection unavailable.':error.message;return false;}
    finally{pumping=false;updateSyncStatus();pumpPromise=null;}
  })();
  return pumpPromise;
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
async function saveTaskStatus(found,done){
  const id=found.x.id;
  const previous={done:found.x.done,needsHelp:found.x.needsHelp};found.x.done=done;if(done)found.x.needsHelp=false;
  const saved=saveAssignmentChange('status',found);render();
  if(await saved)showToast(done?'Assignment completed and saved':'Assignment reopened and saved',()=>{const current=findTask(id);if(!current)return;Object.assign(current.x,previous);saveAssignmentChange('status',current);render();});
}
function toggleHelp(id){const found=findTask(id);if(!found||found.x.done)return;found.x.needsHelp=!found.x.needsHelp;saveAssignmentChange('status',found);render();showToast(found.x.needsHelp?'Help request added for your parent':'Help request cleared');}
function showToast(message,undo=null){const node=document.getElementById('toast');undoAction=undo;node.hidden=false;node.innerHTML=`<span>${esc(message)}</span>${undo?'<button class="text-button" onclick="undoToast()">Undo</button>':''}<button class="text-button" aria-label="Dismiss message" onclick="document.getElementById('toast').hidden=true">×</button>`;clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>{node.hidden=true;undoAction=null;},10000);}
function undoToast(){const action=undoAction;undoAction=null;document.getElementById('toast').hidden=true;if(action)action();}

function openDialog(id,content){
  const returnFocus=document.activeElement;closeDialog();const dialog=document.createElement('dialog');dialog.id='app-dialog';dialog.dataset.dialog=id;
  dialog.innerHTML=`<div class="dialog-top"><button class="button light" onclick="closeDialog()" aria-label="Close dialog">Close</button></div>${content}`;
  dialog.addEventListener('close',()=>{dialog.remove();if(!document.getElementById('app-dialog')){if(returnFocus?.isConnected&&!returnFocus.closest('dialog'))returnFocus.focus({preventScroll:true});else app.focus({preventScroll:true});}});document.body.append(dialog);dialog.showModal();dialog.querySelector('[autofocus],input,select')?.focus();
}
function closeDialog(){const dialog=document.getElementById('app-dialog'),refreshSlots=dialog?.dataset.dialog==='schedule';dialog?.close();if(refreshSlots){ensureAssignmentSlots();render();}}
function openSettings(){
  state.settingsScope=scope();drawSettings();
}
const LOOK_PRESETS=[
  {id:'book',label:'Book',note:'Warm paper · novel serif',theme:'book',style:'book'},
  {id:'gameboy',label:'Game Boy',note:'Handheld green · pixels',theme:'gameboy',style:'pixel'},
  {id:'nes',label:'NES Classic',note:'8-bit color · pixels',theme:'nes',style:'pixel'},
  {id:'snes',label:'Super Nintendo',note:'Soft violet · pixels',theme:'snes',style:'pixel'},
  {id:'genesis',label:'Sega Genesis',note:'Blue night · retro',theme:'genesis',style:'retro'},
  {id:'arcade',label:'Arcade',note:'Neon cabinet · pixels',theme:'arcade',style:'pixel'},
  {id:'comic',label:'Comic Book',note:'Ink outlines · bright paper',theme:'comic-book',style:'comic'},
  {id:'chalkboard',label:'Chalkboard',note:'Green board · retro type',theme:'chalkboard',style:'retro'},
  {id:'pastel',label:'Pastel Pop',note:'Lavender · playful cards',theme:'pastel-pop',style:'playful'},
  {id:'sakura',label:'Sakura Paper',note:'Blush paper · soft edges',theme:'sakura-paper',style:'studio'}
];
function lookChoices(p){return LOOK_PRESETS.map(look=>{const palette=THEME_PALETTES[look.theme],selected=activeTheme(p)===look.theme&&p.visualStyle===look.style;return `<button type="button" class="look-choice" data-look-choice="${look.id}" aria-pressed="${selected}" onclick="applyLookPreset('${look.id}',state.settingsScope)"><span class="look-swatch" style="--look-page:${palette[2]};--look-accent:${palette[1]}"><i></i><b></b><em></em></span><span><strong>${look.label}</strong><small>${look.note}</small></span></button>`;}).join('');}
function themeChoices(p,keys){const active=activeTheme(p);return keys.map(key=>{const palette=THEME_PALETTES[key],[label,accent,bg,,,line]=palette,isDark=DARK_THEME_KEYS.includes(key);return `<button type="button" class="theme-swatch" data-theme-choice="${key}" data-theme-label="${esc(label.toLowerCase())}" aria-label="Use ${esc(label)} ${isDark?'dark':'light'} palette" aria-pressed="${active===key}" onclick="selectTheme('${key}',state.settingsScope)"><span class="swatch" style="--swatch-page:${bg};--swatch-accent:${accent};--swatch-mid:${palette[4]||bg};--swatch-line:${line||accent}"><i></i><i></i><i></i></span><span>${label}<small>${isDark?'Dark':'Light'}</small></span></button>`;}).join('');}
function themeLibrary(p){const groups=[['Paper & calm',['coastal','material','facebook','paper','sand','book','sepia-story','sakura-paper','playstation','arctic']],['Nature',['forest','meadow','mint','ocean-night','emerald-night','chalkboard']],['Bright & playful',['sunset','peach','berry','rose','citrus','coral','pastel-pop','comic-book']],['Retro consoles',['nes','gameboy','snes','genesis','atari','arcade','arcade-cyan']],['Night palettes',DARK_THEME_KEYS.filter(key=>!['genesis','atari','arcade','arcade-cyan','chalkboard','contrast-dark'].includes(key))],['High contrast',['contrast','contrast-dark']]],used=new Set(groups.flatMap(([,keys])=>keys)),other=Object.keys(THEME_PALETTES).filter(key=>!used.has(key));if(other.length)groups.push(['More palettes',other]);return groups.map(([label,keys],index)=>`<details class="theme-group" data-theme-group="${index}"><summary>${label}<span class="count">${keys.length}</span></summary><div class="theme-grid">${themeChoices(p,keys)}</div></details>`).join('');}
function interfaceStyleOptions(p){return[['classic','Classic'],['boxy','Boxy'],['studio','Studio'],['playful','Playful'],['glass','Glass'],['minimal','Minimal'],['comic','Comic'],['retro','Retro'],['pixel','8-bit Console'],['book','Book · serif']].map(([key,label])=>`<option value="${key}" ${p.visualStyle===key?'selected':''}>${label}</option>`).join('');}
function applyLookPreset(id,forScope=scope()){const look=LOOK_PRESETS.find(item=>item.id===id);if(!look)return;const dark=DARK_THEME_KEYS.includes(look.theme),p={...prefs(forScope),appearance:dark?'dark':'light',visualStyle:look.style,[dark?'darkTheme':'lightTheme']:look.theme};state.preferences[forScope]=p;localWrite('school-preferences-'+forScope,p);if(forScope===scope())applyPreferences();if(state.auth&&state.auth.role!=='monitor')queuedWrite({preferencesOnly:true,scope:forScope,preferences:p},'Appearance');updateAppearanceControls(p);}
function updateAppearanceControls(p){const active=activeTheme(p);document.querySelectorAll('[data-theme-choice]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.themeChoice===active)));document.querySelectorAll('[data-style-choice]').forEach(button=>button.setAttribute('aria-pressed',String(p.visualStyle===button.dataset.styleChoice)));document.querySelectorAll('[data-look-choice]').forEach(button=>{const look=LOOK_PRESETS.find(item=>item.id===button.dataset.lookChoice);button.setAttribute('aria-pressed',String(!!look&&look.theme===active&&look.style===p.visualStyle));});document.querySelectorAll('[data-pref]').forEach(input=>{if(Object.hasOwn(p,input.dataset.pref))input.value=p[input.dataset.pref];});const mixLabel=document.querySelector('.mix-settings>summary .small');if(mixLabel)mixLabel.textContent=`${THEME_PALETTES[active][0]} · ${p.visualStyle}`;}
function filterThemeLibrary(query){const term=String(query||'').trim().toLowerCase();let matches=0;document.querySelectorAll('.theme-group').forEach(group=>{const buttons=[...group.querySelectorAll('[data-theme-choice]')],shown=buttons.filter(button=>!term||button.dataset.themeLabel.includes(term));buttons.forEach(button=>button.hidden=!!term&&!shown.includes(button));group.hidden=!!term&&!shown.length;if(term&&shown.length)group.open=true;if(!term)group.open=false;matches+=shown.length;});const empty=document.getElementById('theme-search-empty');if(empty)empty.hidden=matches>0;}
function drawSettings(){
  const forScope=state.settingsScope,p=prefs(forScope),parent=state.auth?.role==='parent',opt=(value,label,current)=>`<option value="${value}" ${value===current?'selected':''}>${label}</option>`;
  openDialog('settings',`<h2>Settings</h2><p class="small">${state.auth?.role==='monitor'||!state.auth?'Saved on this device.':'Saved for this profile and synced across devices.'}</p>${parent?`<label>Profile<select onchange="state.settingsScope=this.value;drawSettings()">${['parent','leon','logan','monitor'].map(s=>opt(s,s==='parent'?'Parent':s==='monitor'?'Shared dashboard':nameOf(s),forScope)).join('')}</select></label>`:''}<div class="settings-grid"><label>Color mode<select data-pref="appearance" onchange="setPreference('appearance',this.value,state.settingsScope)">${opt('system','Use device setting',p.appearance)+opt('light','Always light',p.appearance)+opt('dark','Always dark',p.appearance)}</select></label><label>Time display<select data-pref="clockFormat" onchange="setPreference('clockFormat',this.value,state.settingsScope)">${opt('12h','12-hour (3:30 PM)',p.clockFormat)+opt('24h','24-hour (15:30)',p.clockFormat)}</select></label><label>Text size<select data-pref="textSize" onchange="setPreference('textSize',this.value,state.settingsScope)">${opt('small','Small',p.textSize)+opt('standard','Standard',p.textSize)+opt('large','Large',p.textSize)+opt('extra-large','Extra large',p.textSize)}</select></label><label>Spacing<select data-pref="density" onchange="setPreference('density',this.value,state.settingsScope)">${opt('comfortable','Comfortable',p.density)+opt('compact','Compact',p.density)}</select></label><label>Motion<select data-pref="motion" onchange="setPreference('motion',this.value,state.settingsScope)">${opt('system','Use device setting',p.motion)+opt('reduced','Reduce motion',p.motion)+opt('full','Allow full motion',p.motion)}</select></label></div><h3>Complete looks</h3><p class="small">Pick a matched palette and interface style, or open “Mix your own” to combine them separately.</p><div class="look-grid">${lookChoices(p)}</div><details class="mix-settings"><summary>Mix your own look <span class="small">${THEME_PALETTES[activeTheme(p)][0]} · ${p.visualStyle}</span></summary><label>Interface style<select data-pref="visualStyle" onchange="setPreference('visualStyle',this.value,state.settingsScope)">${interfaceStyleOptions(p)}</select></label><label class="theme-search">Find a color theme<input type="search" placeholder="Search all themes" oninput="filterThemeLibrary(this.value)"></label><div class="theme-groups">${themeLibrary(p)}</div><p id="theme-search-empty" class="empty" hidden>No matching themes.</p><p class="small">Choose a palette independently to mix it with your selected interface style.</p></details>${['leon','logan'].includes(forScope)?`<label class="switch"><input type="checkbox" ${p.classBrowser?'checked':''} onchange="setPreference('classBrowser',this.checked,state.settingsScope)">Show class browser on dashboard</label><label class="switch"><input type="checkbox" ${p.hideCompleted?'checked':''} onchange="setPreference('hideCompleted',this.checked,state.settingsScope)">Hide completed in class lists</label>`:''}<p class="small">Themes change colors; interface styles change shapes and typography. Subject and assignment status colors stay consistent.</p>`);
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
  const helpCount=['leon','logan'].flatMap(student=>allTasks(student)).filter(x=>!x.done&&x.needsHelp).length,tabs=[['overview','Weekly overview'],['assignments','Assignments'],['help','Help inbox']];
  const editActions=`<div class="parent-tab-actions"><button class="button light" onclick="openFamilyEditorChooser('schedule')">Edit schedule</button><button class="button light" onclick="openFamilyEditorChooser('reminders')">Announcements & reminders</button></div>`;
  return mast()+`<section class="page-heading"><div><p class="small">Family workspace</p><h1>Parent dashboard</h1></div><div class="actions"><button class="button light" onclick="openMonitor()">Shared dashboard · read-only</button><button class="button light" onclick="refreshDashboard()">Refresh</button><button class="button light" onclick="downloadBackup()">Download backup</button></div></section><nav class="parent-tabs" aria-label="Parent workspace">${tabs.map(([key,label])=>`<button class="button ${state.parentTab===key?'':'light'}" aria-current="${state.parentTab===key?'page':'false'}" onclick="setParentTab('${key}')">${label}${key==='help'?` <span class="count">${helpCount}</span>`:''}</button>`).join('')}${editActions}</nav>`+(state.parentTab==='assignments'?assignmentEditor():state.parentTab==='help'?helpInbox():weeklyOverview());
}
function weeklyOverview(){
  const start=scheduleDay(),end=addDays(start,6),students=['leon','logan'];
  const summary=students.map(student=>{const rows=allTasks(student),week=rows.filter(x=>x.due>=start&&x.due<=end);return `<article class="panel summary-card"><h2>${iconOf(student)} ${nameOf(student)}</h2><div class="summary-stats"><span><b>${week.filter(x=>!x.done).length}</b>Upcoming</span><span><b>${rows.filter(x=>!x.done&&x.due&&x.due<start).length}</b>Past due</span><span><b>${rows.filter(x=>!x.done&&x.needsHelp).length}</b>Need help</span></div><button class="text-button" onclick="editStudent('${student}')">Manage ${nameOf(student)}’s assignments →</button></article>`;}).join('');
  const help=['leon','logan'].flatMap(s=>allTasks(s)).filter(x=>!x.done&&x.needsHelp),helpPreview=`<section class="panel help-panel"><div class="section-heading"><h2>Help requests <span class="count">${help.length}</span></h2><button class="text-button" onclick="setParentTab('help')">Open help inbox →</button></div>${help.length?help.map(x=>`<div class="help-request"><div><strong>${nameOf(x.student)} · ${esc(LABELS[x.subject]||x.subject)}</strong><span>${esc(x.title)}</span></div><div class="actions"><button class="button light" onclick="editStudent('${x.student}',${jsArg(x.subject)})">View assignment</button><button class="button light" onclick="toggleHelp(${jsArg(x.id)})">Clear request</button></div></div>`).join(''):'<p class="empty">No help requests right now.</p>'}</section>`;
  return `<section class="weekly"><div class="section-heading"><h2>The next seven days</h2><span class="small">${dateLabel(start,false)} – ${dateLabel(end,false)}</span></div><div class="summary-grid">${summary}</div>${helpPreview}<div class="week-list">${Array.from({length:7},(_,i)=>{const date=addDays(start,i);return `<section class="panel week-day"><h3>${dateLabel(date)}</h3><div class="week-students">${students.map(student=>{const rows=allTasks(student).filter(x=>x.due===date),schedule=scheduleFor(student,date);return `<div class="week-student ${student}"><h4 class="child-label">${iconOf(student)} ${nameOf(student)}</h4>${rows.length?rows.map(x=>`<div class="week-task ${x.done?'done':''}"><span>${esc(x.title)}</span>${dueChip(x)}</div>`).join(''):'<p class="small">No assignments due.</p>'}<details><summary>Schedule <span class="count">${schedule.length}</span></summary>${schedule.length?schedule.map(x=>`<div class="schedule-item" style="${scheduleItemStyle(x)}"><span>${esc(scheduleLabel(x))}</span><time>${formatScheduleTime(x.time)}</time></div>`).join(''):'<p class="small">No schedule set.</p>'}</details></div>`;}).join('')}</div></section>`;}).join('')}</div></section>`;
}
function helpInbox(){
  const requests=['leon','logan'].flatMap(student=>allTasks(student).filter(x=>!x.done&&x.needsHelp).map(x=>({...x,student}))).sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999'));
  return `<section class="panel help-panel"><div class="section-heading"><h2>Needs help <span class="count">${requests.length}</span></h2><span class="small">Requests from Leon and Logan</span></div>${requests.length?requests.map(x=>`<article class="help-request"><div><strong>${iconOf(x.student)} ${nameOf(x.student)} · ${esc(subjectLabel(x.subject,x.student))}</strong><span>${esc(x.title)}</span><div class="task-meta">${dueChip(x)}</div></div><div class="actions">${x.url?`<a class="button light" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">Open assignment ↗</a>`:''}<button class="button light" onclick="editStudent('${x.student}',${jsArg(x.subject)})">View assignment</button><button class="button" onclick="toggleHelp(${jsArg(x.id)})">Mark handled</button></div></article>`).join(''):'<p class="empty">No open help requests. New requests from the kids will appear here.</p>'}</section>`;
}
function editStudent(student,subject){state.editorStudent=student;state.editorSubject=subject||Object.keys(state.assignments[student])[0];state.parentTab='assignments';render();}
function subjectCatalog(student){const catalog=state.assignmentSubjectCatalogs[student]||{added:[],hidden:[]};return{added:[...(catalog.added||[])],hidden:[...(catalog.hidden||[])]};}
function saveSubjectCatalog(student){const catalog=subjectCatalog(student);state.assignmentSubjectCatalogs[student]=catalog;return queuedWrite({subjectsOnly:true,student,catalog},'Subjects');}
function openSubjectManager(){
  const student=state.editorStudent||'leon',subjects=Object.keys(state.assignments[student]||{}).sort((a,b)=>subjectLabel(a,student).localeCompare(subjectLabel(b,student)));
  const list=subjects.length?subjects.map(subject=>{const count=(state.assignments[student][subject]||[]).length;return `<div class="editor-assignment"><div><strong>${esc(subjectLabel(subject,student))}</strong><span class="small">${count?`${count} assignment${count===1?'':'s'}`:'No assignments'}</span></div><button class="button light" onclick="removeAssignmentSubject('${student}',${jsArg(subject)})" ${count?'disabled title="Remove assignments before removing this subject"':''}>Remove</button></div>`;}).join(''):'<p class="empty">No subjects yet. Add one below to create an assignment slot.</p>';
  openDialog('subject-manager',`<h2>Manage ${nameOf(student)}’s subjects</h2><p class="small">Scheduled core classes are added automatically. One-off custom schedule events are skipped. You can add other subjects here.</p><div class="editor-assignments">${list}</div><form onsubmit="addAssignmentSubject(event,'${student}')"><label>New subject<input name="subject" maxlength="60" placeholder="For example, Music" required></label><p class="form-error" id="subject-error" role="alert"></p><button class="button" type="submit">Add subject</button></form>`);
}
function addAssignmentSubject(event,student){
  event.preventDefault();const label=String(new FormData(event.target).get('subject')||'').trim(),subject=scheduleAssignmentSubject({subject:'custom',label});
  if(!label||!subject||subject==='custom'){document.getElementById('subject-error').textContent='Enter a subject name with at least one letter or number.';return;}
  const catalog=subjectCatalog(student),hidden=new Set(catalog.hidden),existing=state.assignments[student][subject];
  if(existing?.length){document.getElementById('subject-error').textContent='That subject already has assignments.';return;}
  if(hidden.has(subject))catalog.hidden=catalog.hidden.filter(id=>id!==subject);
  else if(existing){document.getElementById('subject-error').textContent='That subject is already available.';return;}
  if(!catalog.added.some(item=>item.id===subject))catalog.added.push({id:subject,label});
  state.assignmentSubjectCatalogs[student]=catalog;state.assignments[student][subject]??=[];state.editorSubject=subject;saveSubjectCatalog(student);render();openSubjectManager();
}
function removeAssignmentSubject(student,subject){
  if((state.assignments[student]?.[subject]||[]).length){showToast('Remove the subject’s assignments first.');return;}
  const catalog=subjectCatalog(student),scheduled=scheduledItems(student).some(item=>scheduleAssignmentSubject(item)===subject&&!subject.startsWith('custom-'));
  catalog.added=catalog.added.filter(item=>item.id!==subject);
  if(scheduled&&!catalog.hidden.includes(subject))catalog.hidden.push(subject);
  state.assignmentSubjectCatalogs[student]=catalog;delete state.assignments[student][subject];
  if(state.editorSubject===subject)state.editorSubject=Object.keys(state.assignments[student])[0]||'';
  saveSubjectCatalog(student);ensureAssignmentSlots();render();openSubjectManager();
}
function assignmentEditor(){
  const student=state.editorStudent||'leon',subjects=state.assignments[student],selected=subjects[state.editorSubject]?state.editorSubject:Object.keys(subjects)[0]||'';state.editorSubject=selected;
  const rows=subjects[selected]||[],shown=rows.filter(x=>!state.editorHideCompleted||!x.done).sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999'));
  return `<section class="parent-page panel"><div class="editor-toolbar"><label>Child<select onchange="editStudent(this.value)">${['leon','logan'].map(s=>`<option value="${s}" ${s===student?'selected':''}>${nameOf(s)}</option>`).join('')}</select></label><label>Subject<select onchange="state.editorSubject=this.value;render()">${Object.keys(subjects).map(s=>`<option value="${s}" ${s===selected?'selected':''}>${esc(subjectLabel(s,student))}</option>`).join('')}</select></label><label class="switch"><input type="checkbox" ${state.editorHideCompleted?'checked':''} onchange="state.editorHideCompleted=this.checked;render()">Hide completed</label></div><p class="small">Changes save automatically to your family account.</p><div class="toolbar"><button class="button" onclick="openAssignmentForm()" ${selected?'':'disabled'}>Add assignment</button><button class="button light" onclick="openImport()" ${selected?'':'disabled'}>Import assignments</button><button class="button light" onclick="openSubjectManager()">Manage subjects</button></div><h2>${esc(subjectLabel(selected,student)||'Assignments')}</h2><div class="editor-assignments">${shown.map(x=>`<article class="editor-assignment"><div>${task(x,student)}<span class="small">${x.url?'Assignment link added':'No assignment link'}</span></div><div class="editor-actions"><button class="button light" onclick="openAssignmentForm(${jsArg(x.id)})">Edit</button><button class="text-button danger" onclick="removeTask(${jsArg(x.id)})">Remove</button></div></article>`).join('')||'<p class="empty">No assignments in this view.</p>'}</div></section>`;
}
function openAssignmentForm(id=''){
  const found=id?findTask(id):null,student=found?.student||state.editorStudent||'leon',subject=found?.subject||state.editorSubject,x=found?.x||{};
  openDialog('assignment-form',`<h2>${id?'Edit':'Add'} assignment</h2><form onsubmit="submitAssignment(event,${jsArg(id)})"><label>Title<input name="title" value="${esc(x.title||'')}" required maxlength="2000" autofocus></label><div class="settings-grid"><label>Due date<input type="date" name="due" value="${esc(x.due||'')}"></label><label>Subject<select name="subject">${Object.keys(state.assignments[student]).map(s=>`<option value="${s}" ${s===subject?'selected':''}>${esc(subjectLabel(s,student))}</option>`).join('')}</select></label></div><label>Assignment link <span class="small">Optional</span><input type="url" name="url" value="${esc(x.url||'')}" placeholder="https://…"><small>Paste the direct link from the school site.</small></label><p class="form-error" id="assignment-error" role="alert"></p><button class="button" type="submit">${id?'Save changes':'Add assignment'}</button></form>`);
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
function downloadBackup(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({assignments:state.assignments,schedules:schedulePayload(),cards:dashboardCardsPayload(),preferences:state.preferences},null,2)],{type:'application/json'}));a.download='school-dashboard-backup-'+scheduleDay()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
function sharedPage(){return mast()+`<section class="page-heading"><div><p class="small">${dateLabel(scheduleDay())}</p><h1>Our school day</h1></div>${dashboardClock()}<button class="button light" onclick="refreshDashboard()">Refresh</button></section><p id="shared-refresh-status" class="small" role="status">${esc(state.refreshError||'')}</p><div class="shared-grid">${['leon','logan'].map(student=>`<article class="shared-child"><h2>${iconOf(student)} ${nameOf(student)}</h2><div class="work-board">${workSection(state.assignments[student],'late',student,true)}${workSection(state.assignments[student],'today',student,true)}${workingAhead(state.assignments[student],student,true)}</div>${schedulePanel(student)}</article>`).join('')}</div>`;}
async function refreshDashboard(silent=false){
  if(!state.auth||state.pending.length||pumping){if(!silent)showToast('Save your pending changes before refreshing.');return;}
  if(state.refreshing)return;state.refreshing=true;
  try{
    const auth=state.auth,data=await fetchAuth(auth);state.refreshError='';state.liveSyncError='';
    const snapshot=JSON.stringify(data);
    if(!silent||snapshot!==state.sharedSnapshot){acceptAuth(data,auth);state.sharedSnapshot=snapshot;}
    if(!silent)showToast('Dashboard refreshed');
  }catch{state.liveSyncError='Connection unavailable.';if(!silent)showToast('Couldn’t refresh. Please try again.');else state.refreshError='Connection unavailable. Showing the last loaded data.';}
  finally{state.refreshing=false;updateSyncStatus();const status=document.getElementById('shared-refresh-status');if(status)status.textContent=state.refreshError||'';}
}

function openFamilyEditorChooser(editor){
  const label=editor==='schedule'?'schedule':'announcements and reminders';
  openDialog('family-editor-chooser',`<h2>Choose whose ${label} to edit</h2><div class="class-picker">${['leon','logan'].map(student=>`<button class="button light" onclick="openFamilyEditor('${editor}','${student}')">${iconOf(student)} ${nameOf(student)}</button>`).join('')}</div>`);
}
function openFamilyEditor(editor,student){if(editor==='schedule')openScheduleFor(student);else openCardEditor(student);}
function openScheduleFor(student){state.editorStudent=student;state.scheduleDates[student]=scheduleDay();state.schedules[student]=scheduleFor(student);openScheduleEditor();}
function openScheduleEditor(){
  const student=state.editorStudent||'leon',items=state.schedules[student]||[],subjects=[...new Set([...Object.keys(state.assignments[student]).filter(subject=>!subject.startsWith('custom-')),...SCHEDULE_SUBJECTS])],date=state.scheduleDates[student]||scheduleDay();
  openDialog('schedule',`<h2>${nameOf(student)}’s schedule</h2><p class="small">All times use Eastern Time. Changes stay here until you select “Save this day” or import a schedule.</p><label>Schedule date<input type="date" value="${date}" min="${scheduleDay()}" onchange="selectScheduleDate(this.value)"></label><p class="small">${esc(state.scheduleMessage||'')}</p><div class="schedule-editor">${items.map((x,i)=>`<div class="schedule-row"><label>Class<select onchange="setScheduleSubject(${i},this.value)">${[...subjects,'custom','break'].map(s=>`<option value="${s}" ${x.subject===s?'selected':''}>${esc(LABELS[s]||s)}</option>`).join('')}</select></label><label>Label<input value="${esc(x.label||'')}" onchange="editScheduleEntry(${i},'label',this.value)" ${!['custom','break'].includes(x.subject)?'disabled':''}></label><label>Start<input type="time" value="${esc(x.time||'')}" onchange="editScheduleEntry(${i},'time',this.value)"></label><label>End <span class="small">Optional</span><input type="time" value="${esc(x.endTime||'')}" onchange="editScheduleEntry(${i},'endTime',this.value)"></label><button class="text-button danger" onclick="removeScheduleEntry(${i})">Remove</button></div>`).join('')}</div><div class="toolbar"><button class="button" onclick="addScheduleEntry()">Add class or break</button><button class="button light" onclick="openScheduleImport()">Import schedule</button><button class="button light" onclick="clearOpenSchedule()">Clear this day</button><button class="button" onclick="saveOpenSchedule()">Save this day</button></div>`);
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
}
function openCardEditor(student){
  const announcements=state.announcements[student]||[],items=announcements.length?`<div class="announcement-queue">${announcements.map(item=>`<article class="announcement-queue-item"><div><strong>${esc(item.title||item.message)}</strong><span class="small">${esc(announcementWhen(item))} · ${item.style==='celebration'?'🎉 Celebration':item.style==='encouragement'?'💪 Encouragement':'📣 Note'}</span>${item.title&&item.message?`<span class="small">${esc(item.message)}</span>`:''}</div><button class="button light" type="button" onclick="removeAnnouncement('${student}',${jsArg(item.id)})">Remove</button></article>`).join('')}</div>`:'<p class="empty">No announcements set.</p>',fields=`<div class="card-edit-grid">${state.displayCards[student].map((value,i)=>`<label>Quick reminder ${i+1}<input maxlength="120" value="${esc(value)}" onchange="editDisplayCard('${student}',${i},this.value)"></label>`).join('')}</div>`;
  openDialog('reminders',`<h2>Customize ${nameOf(student)}’s dashboard</h2><p class="small">Announcements appear only on this child’s dashboard. Leave the start date and time blank to show one right away. Scheduled announcements start at the chosen time and remain visible for that day.</p><h3>Announcements</h3>${items}<form class="announcement-form" onsubmit="saveAnnouncement(event,'${student}')"><h3>New announcement</h3><label>Headline<input name="title" maxlength="80" placeholder="You did it!"></label><label>Message<textarea name="message" maxlength="240" placeholder="Write a short note for ${nameOf(student)}"></textarea></label><label>Style<select name="style"><option value="celebration">🎉 Celebration with fanfare</option><option value="encouragement">💪 Encouragement</option><option value="notice">📣 Note for today</option></select></label><label>Start showing <span class="small">Optional · Eastern Time</span><input name="startsAt" type="datetime-local" min="${easternDateTimeNow()}"></label><p class="form-error" id="announcement-error" role="alert"></p><button class="button" type="submit">Save announcement</button></form><h3>Quick reminders</h3><p class="small">Changes save when you leave a field.</p>${fields}`);
}
function editDisplayCard(forScope,index,value){state.displayCards[forScope][index]=value;return queuedWrite({cards:dashboardCardsPayload(),cardsOnly:true},'Reminders');}
function saveAnnouncement(event,student){event.preventDefault();const form=event.currentTarget,title=String(form.elements.title.value||'').trim(),message=String(form.elements.message.value||'').trim(),startsAt=form.elements.startsAt.value;if(!title&&!message){document.getElementById('announcement-error').textContent='Add a headline or message.';return;}if(startsAt&&startsAt<easternDateTimeNow()){document.getElementById('announcement-error').textContent='Choose a future day and time.';return;}const list=state.announcements[student]||[];if(list.length>=30){document.getElementById('announcement-error').textContent='Remove an old announcement before adding another.';return;}list.push({id:crypto.randomUUID?.()||`announcement-${Date.now()}-${Math.random().toString(36).slice(2)}`,enabled:true,title,message,style:form.elements.style.value,startsAt});state.announcements[student]=list;queuedWrite({cards:dashboardCardsPayload(),cardsOnly:true},'Announcement');openCardEditor(student);showToast(startsAt?`${nameOf(student)}’s announcement scheduled`:`${nameOf(student)}’s announcement posted`);}
function removeAnnouncement(student,id){state.announcements[student]=(state.announcements[student]||[]).filter(item=>item.id!==id);queuedWrite({cards:dashboardCardsPayload(),cardsOnly:true},'Announcement');openCardEditor(student);showToast('Announcement removed');}

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
setInterval(refreshVisibleSchedules,60000);
setInterval(refreshVisibleAnnouncements,15000);
setInterval(()=>{if(state.auth&&!document.hidden&&!document.getElementById('app-dialog'))refreshDashboard(true);},15000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshVisibleSchedules();});
applyPreferences();restoreSession();
