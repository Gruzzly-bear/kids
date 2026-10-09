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
  const avatars = ['default', '🐱', '🐶', '🦊', '🐼', '🐸', '🦄', '🐉', '🐢', '🦋', '🐙', '🦖', '🐧', '🐨', '🐺', '🦁', '🐯', '🐰', '🐹', '🐝', '🦉', '🚀', '⚡', '🤖', '👾', '🎮', '🎨', '🦈', '🐬', '🦕', '🧙', '🥷'];
  const fontStyles = ['theme', 'charger', 'cosmic-fantasy', 'dalelands', 'dragoon-bold', 'emotion-engine', 'gamecuben', 'gbboot', 'isaacsans', 'kroegbainder', 'modern-fantasy', 'pokemon-gb', 'warioland4', 'baby-angel', 'ballkids-game', 'bravyka', 'ci-gamedev', 'fokuz', 'gamepixies', 'midnight', 'money-game', 'montserrat', 'queensides', 'retro-viber', 'rushford-clean', 'simple-people', 'soffie', 'spenbeb-game', 'super-joyful', 'tbj-margin', 'wah-iki'];
  return {
    appearance: ['light', 'dark', 'system'].includes(value.appearance) ? value.appearance : 'system',
    lightTheme: typeof value.lightTheme === 'string' ? value.lightTheme.slice(0, 40) : 'coastal',
    darkTheme: typeof value.darkTheme === 'string' ? value.darkTheme.slice(0, 40) : 'midnight',
    visualStyle: ['classic', 'boxy', 'studio', 'playful', 'glass', 'minimal', 'comic', 'retro', 'pixel', 'book', 'stardew', 'dragoon', 'wow-ui', 'isaac', 'swtor', 'ps2-ui', 'ps4-ui', 'pipboy'].includes(value.visualStyle) ? value.visualStyle : 'classic',
    fontStyle: fontStyles.includes(value.fontStyle) ? value.fontStyle : 'theme',
    clockFont: ['system', ...fontStyles].includes(value.clockFont) ? value.clockFont : 'theme',
    cornerStyle: ['theme', 'soft', 'square', 'pill'].includes(value.cornerStyle) ? value.cornerStyle : 'theme',
    edgeStyle: ['theme', 'plain', 'outlined', 'bold', 'dashed', 'glow'].includes(value.edgeStyle) ? value.edgeStyle : 'theme',
    surfaceTexture: ['none', 'paper', 'grid', 'scanlines', 'halftone'].includes(value.surfaceTexture) ? value.surfaceTexture : 'none',
    backgroundImage: typeof value.backgroundImage === 'string' && value.backgroundImage.length <= 450000 && /^data:image\/webp;base64,[A-Za-z0-9+/]+=*$/.test(value.backgroundImage) ? value.backgroundImage : '',
    backgroundOpacity: Number.isFinite(Number(value.backgroundOpacity)) ? Math.max(0, Math.min(35, Math.round(Number(value.backgroundOpacity)))) : 16,
    backgroundEffect: ['none', 'scanlines', 'grid', 'paper', 'halftone'].includes(value.backgroundEffect) ? value.backgroundEffect : 'none',
    textSize: ['small', 'standard', 'large', 'extra-large'].includes(value.textSize) ? value.textSize : 'standard',
    density: value.density === 'compact' ? 'compact' : 'comfortable',
    clockFormat: value.clockFormat === '24h' ? '24h' : '12h',
    motion: ['system', 'reduced', 'full'].includes(value.motion) ? value.motion : 'system',
    classBrowser: !!value.classBrowser,
    hideCompleted: value.hideCompleted !== false,
    avatar: avatars.includes(value.avatar) ? value.avatar : 'default',
    avatarImage: typeof value.avatarImage === 'string' && value.avatarImage.length <= 120000 && /^data:image\/webp;base64,[A-Za-z0-9+/]+=*$/.test(value.avatarImage) ? value.avatarImage : '',
    avatarFrame: ['circle', 'rounded', 'double', 'glow', 'sticker', 'none'].includes(value.avatarFrame) ? value.avatarFrame : 'circle'
  };
}
export function readJSON(value, fallback = {}) {
  try { return JSON.parse(value) || fallback; } catch { return fallback; }
}
export function setting(env, key, value) {
  return env.DB.prepare('INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(key, JSON.stringify(value));
}
