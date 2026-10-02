export const json = (body, status = 200) => Response.json(body, { status });
export async function hash(value) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2, '0')).join('');
}
export async function authorized(env, role, password) {
  if (!['parent', 'leon', 'logan'].includes(role) || typeof password !== 'string') return false;
  const saved = await env.DB.prepare('SELECT value FROM settings WHERE key=?').bind(`${role}_password`).first();
  return !!saved && await hash(password) === saved.value;
}
export function safeURL(value) {
  if (!value) return '';
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : null; }
  catch { return null; }
}
export function metadata(value = {}) {
  return { url: safeURL(value.url) || '', needsHelp: !!value.needsHelp };
}
export function preferences(value = {}) {
  return {
    appearance: ['light', 'dark', 'system'].includes(value.appearance) ? value.appearance : 'system',
    lightTheme: typeof value.lightTheme === 'string' ? value.lightTheme.slice(0, 40) : 'coastal',
    darkTheme: typeof value.darkTheme === 'string' ? value.darkTheme.slice(0, 40) : 'midnight',
    textSize: value.textSize === 'large' ? 'large' : 'standard',
    density: value.density === 'compact' ? 'compact' : 'comfortable',
    classBrowser: !!value.classBrowser,
    hideCompleted: value.hideCompleted !== false
  };
}
export function readJSON(value, fallback = {}) {
  try { return JSON.parse(value) || fallback; } catch { return fallback; }
}
export function setting(env, key, value) {
  return env.DB.prepare('INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(key, JSON.stringify(value));
}
