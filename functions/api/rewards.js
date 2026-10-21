import { PAGE_PAL_PRICES } from './page-pal-prices.js';
import { PAGE_PALS } from './page-pals.js';
import { readJSON } from './shared.js';
import { FREE_THEMES, THEME_CATALOG, THEME_PRICE } from './theme-catalog.js';
import { COSMETICS, COSMETIC_RULES } from './cosmetics.js';
import { POINT_RULES } from './point-rules.js';

export async function ownedCosmetics(env,student){
  const rows=await env.DB.prepare("SELECT value FROM settings WHERE key LIKE 'redemption_%' AND json_extract(value,'$.student')=?").bind(student).all();
  return rows.results.map(row=>readJSON(row.value).cosmetic).filter(id=>Object.hasOwn(COSMETICS,id));
}

export async function ownedThemes(env,student){
  const rows=await env.DB.prepare("SELECT value FROM settings WHERE key LIKE 'redemption_%' AND json_extract(value,'$.student')=?").bind(student).all();
  return [...FREE_THEMES,...rows.results.map(row=>readJSON(row.value).theme).filter(theme=>Object.hasOwn(THEME_CATALOG,theme))];
}
export async function restrictThemes(env,student,prefs){
  if(!['leon','logan'].includes(student))return prefs;
  const owned=await ownedThemes(env,student);
  if(!owned.includes(prefs.lightTheme))prefs.lightTheme='coastal';
  if(!owned.includes(prefs.darkTheme))prefs.darkTheme='midnight';
  const cosmetics=await ownedCosmetics(env,student);
  for(const [field,rule] of Object.entries(COSMETIC_RULES)){
    const value=['avatarImage','backgroundImage'].includes(field)?(prefs[field]?'custom':''):prefs[field];
    const item=Object.values(COSMETICS).find(item=>item.group===rule.group&&item.value===value);
    if(value!==rule.default&&(!item||!cosmetics.includes(item.id)))prefs[field]=rule.default;
  }
  return prefs;
}

// Calculate earnings from current assignment records so retries and reopening
// cannot mint extra points. Submission dates, not completion dates, earn points.
export function earnedSQL(){
  return `SELECT COALESCE(SUM(CASE WHEN a.due<>''
  AND date(json_extract(m.value,'$.submittedDate'))=json_extract(m.value,'$.submittedDate')
  AND json_extract(m.value,'$.submittedDate')<=a.due
  AND a.due<=date(json_extract(m.value,'$.submittedDate'),'+1 day')
  THEN CASE WHEN json_extract(m.value,'$.submittedDate')<a.due THEN 2 ELSE 1 END ELSE 0 END),0)
  FROM assignments a LEFT JOIN settings m ON m.key='assignment_meta_'||a.id WHERE a.student=?`;
}
export const spentSQL = `SELECT COALESCE(SUM(json_extract(value,'$.cost')),0) FROM settings
  WHERE key LIKE 'redemption_%' AND json_extract(value,'$.student')=?`;

async function clearPointDebt(env,student){
  // Record a credit rather than merely hiding debt: the next earned point
  // must be spendable, even after an older penalty or corrected assignment.
  const id=crypto.randomUUID();
  await env.DB.prepare(`INSERT INTO settings(key,value)
    SELECT ?,json_object('id',?,'student',?,'kind','balanceAdjustment','title','Balance reset to zero','points',-balance,'cost',balance,'date',?)
    FROM (SELECT (${earnedSQL()})-(${spentSQL}) AS balance) WHERE balance<0`)
    .bind('redemption_floor_'+id,id,student,new Date().toISOString(),student,student).run();
}

export async function recordOverduePenalties(env,role){
  const today=new Date().toLocaleDateString('en-CA',{timeZone:'America/New_York'});
  const students=role==='parent'?['leon','logan']:['leon','logan'].includes(role)?[role]:[];
  for(const student of students){
    await clearPointDebt(env,student);
    const rows=await env.DB.prepare("SELECT a.*,m.value AS metadata FROM assignments a LEFT JOIN settings m ON m.key='assignment_meta_'||a.id WHERE student=? AND due<>'' AND due<?").bind(student,today).all();
    const writes=[];
    for(const assignment of rows.results){
      const meta=readJSON(assignment.metadata);
      if(meta.submittedDate&&meta.submittedDate<=assignment.due)continue;
      if(assignment.done&&!(meta.submittedDate>assignment.due)&&!(meta.completedDate>assignment.due))continue;
      const id='late-'+assignment.id,key='redemption_penalty_'+student+'_'+assignment.id;
      writes.push(env.DB.prepare(`INSERT INTO settings(key,value)
        SELECT ?,json_set(?,'$.cost',CASE WHEN (${earnedSQL()})-(${spentSQL})>=1 THEN 1 ELSE 0 END)
        ON CONFLICT(key) DO NOTHING`).bind(key,JSON.stringify({id,student,kind:'penalty',title:assignment.title,cost:1,dueDate:assignment.due,date:new Date().toISOString()}),student,student));
    }
    if(writes.length)await env.DB.batch(writes);
  }
}

export async function rewardsData(env, role) {
  await recordOverduePenalties(env,role);
  const rows=await env.DB.prepare("SELECT key,value FROM settings WHERE key LIKE 'reward_%' OR key LIKE 'redemption_%'").all();
  const items=[],history=[];
  for(const row of rows.results){const item=readJSON(row.value,{});if(row.key.startsWith('reward_goal_')||row.key.startsWith('reward_pal_'))continue;if(row.key.startsWith('reward_'))items.push(item);else if(role==='parent'||item.student===role)history.push(item);}
  const balances={};
  for(const student of role==='parent'?['leon','logan']:['leon','logan'].includes(role)?[role]:[]){
    const earned=await env.DB.prepare(earnedSQL()).bind(student).first(),spent=await env.DB.prepare(spentSQL).bind(student).first();
    balances[student]=Math.max(0,Number(Object.values(earned)[0])-Number(Object.values(spent)[0]));
  }
  const unlocked={};
  const cosmeticUnlocks={};
  for(const student of role==='parent'?['leon','logan']:['leon','logan'].includes(role)?[role]:[])unlocked[student]=await ownedThemes(env,student);
  for(const student of Object.keys(unlocked))cosmeticUnlocks[student]=await ownedCosmetics(env,student);
  const breakdown={},goals={},today=new Date().toLocaleDateString('en-CA',{timeZone:'America/New_York'});
  for(const student of Object.keys(balances)){
    const work=await env.DB.prepare("SELECT a.*,m.value AS metadata FROM assignments a LEFT JOIN settings m ON m.key='assignment_meta_'||a.id WHERE student=?").bind(student).all();
    let earned=0;
    for(const assignment of work.results){const submitted=readJSON(assignment.metadata).submittedDate;if(submitted&&assignment.due&&submitted<=assignment.due&&Date.parse(assignment.due+'T12:00:00Z')-Date.parse(submitted+'T12:00:00Z')<=86400000)earned+=submitted<assignment.due?2:1;}
    const purchases=history.filter(item=>item.student===student);
    breakdown[student]={earned,deductions:purchases.filter(item=>item.kind==='penalty').reduce((sum,item)=>sum+item.cost,0),behaviorDeductions:purchases.filter(item=>item.kind==='deduction').reduce((sum,item)=>sum+item.cost,0),bonuses:purchases.filter(item=>item.kind==='award').reduce((sum,item)=>sum+item.points,0),adjustments:purchases.filter(item=>item.kind==='balanceAdjustment').reduce((sum,item)=>sum+item.points,0),spent:purchases.filter(item=>!['award','penalty','deduction','balanceAdjustment'].includes(item.kind)).reduce((sum,item)=>sum+item.cost,0)};
    const row=await env.DB.prepare('SELECT value FROM settings WHERE key=?').bind('reward_goal_'+student).first();
    goals[student]=items.find(item=>item.id===readJSON(row?.value).id)||null;
  }
  let activity=[];
  if(role==='parent'){
    const events=await env.DB.prepare("SELECT value FROM settings WHERE key LIKE 'activity_%' ORDER BY json_extract(value,'$.date') DESC LIMIT 100").all();
    activity=events.results.map(row=>readJSON(row.value));
    for(const item of history){activity.push({...item,kind:item.kind==='award'?'bonus':['penalty','deduction','balanceAdjustment'].includes(item.kind)?item.kind:'purchase'});if(item.deliveredAt)activity.push({...item,kind:'delivery',date:item.deliveredAt});}
    activity.sort((a,b)=>b.date.localeCompare(a.date));activity=activity.slice(0,100);
  }
  const pals={},equippedPals={};
  for(const student of Object.keys(balances)){
    pals[student]={};for(const entry of history.filter(x=>x.student===student&&x.pal&&PAGE_PALS[x.pal]))pals[student][entry.pal]=Math.max(pals[student][entry.pal]??-1,entry.stage);
    const row=await env.DB.prepare('SELECT value FROM settings WHERE key=?').bind('reward_pal_'+student).first(),id=readJSON(row?.value).id;
    equippedPals[student]=Object.hasOwn(pals[student],id)?id:'';
  }
  return {pagePalPrices:PAGE_PAL_PRICES,pagePalCatalog:PAGE_PALS,pals,equippedPals,items,history:history.sort((a,b)=>b.date.localeCompare(a.date)),balances,unlocked,themePrice:THEME_PRICE,cosmetics:COSMETICS,cosmeticRules:COSMETIC_RULES,cosmeticUnlocks,breakdown,goals,activity,pointRules:POINT_RULES};
}
