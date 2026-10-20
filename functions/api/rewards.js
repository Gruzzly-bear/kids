import { readJSON } from './shared.js';
import { FREE_THEMES, THEME_CATALOG, THEME_PRICE } from './theme-catalog.js';
import { COSMETICS, COSMETIC_RULES } from './cosmetics.js';

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
export const earnedSQL = `SELECT COALESCE(SUM(CASE WHEN a.done=1 AND a.due<>''
  AND date(json_extract(m.value,'$.submittedDate'))=json_extract(m.value,'$.submittedDate')
  AND json_extract(m.value,'$.submittedDate')<=a.due
  THEN CASE WHEN json_extract(m.value,'$.submittedDate')<a.due THEN 2 ELSE 1 END ELSE 0 END),0)
  FROM assignments a LEFT JOIN settings m ON m.key='assignment_meta_'||a.id WHERE a.student=?`;
export const spentSQL = `SELECT COALESCE(SUM(json_extract(value,'$.cost')),0) FROM settings
  WHERE key LIKE 'redemption_%' AND json_extract(value,'$.student')=?`;

export async function rewardsData(env, role) {
  const rows=await env.DB.prepare("SELECT key,value FROM settings WHERE key LIKE 'reward_%' OR key LIKE 'redemption_%'").all();
  const items=[],history=[];
  for(const row of rows.results){const item=readJSON(row.value,{});if(row.key.startsWith('reward_'))items.push(item);else if(role==='parent'||item.student===role)history.push(item);}
  const balances={};
  for(const student of role==='parent'?['leon','logan']:['leon','logan'].includes(role)?[role]:[]){
    const earned=await env.DB.prepare(earnedSQL).bind(student).first(),spent=await env.DB.prepare(spentSQL).bind(student).first();
    balances[student]=Number(Object.values(earned)[0])-Number(Object.values(spent)[0]);
  }
  const unlocked={};
  const cosmeticUnlocks={};
  for(const student of role==='parent'?['leon','logan']:['leon','logan'].includes(role)?[role]:[])unlocked[student]=await ownedThemes(env,student);
  for(const student of Object.keys(unlocked))cosmeticUnlocks[student]=await ownedCosmetics(env,student);
  return {items,history:history.sort((a,b)=>b.date.localeCompare(a.date)),balances,unlocked,themePrice:THEME_PRICE,cosmetics:COSMETICS,cosmeticRules:COSMETIC_RULES,cosmeticUnlocks};
}
