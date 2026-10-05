import { authorized, hash, json, metadata, preferences, readJSON, safeURL, setting } from './shared.js';

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { role, password, change } = body;
    if (!await authorized(env, role, password)) return json({ error: 'Please sign in again.' }, 401);
    if (body.preferencesOnly) {
      const scope = body.scope || role;
      if (!['parent', 'leon', 'logan', 'monitor'].includes(scope) || (role !== 'parent' && scope !== role)) return json({ error: 'Not allowed.' }, 403);
      await setting(env, `preferences_${scope}`, preferences(body.preferences)).run();
      return json({ ok: true });
    }
    if (body.passwordOnly && role === 'parent') {
      if (typeof body.nextPassword !== 'string' || body.nextPassword.length < 4) return json({ error: 'Use at least four characters.' }, 400);
      await env.DB.prepare('UPDATE settings SET value=? WHERE key=?').bind(await hash(body.nextPassword), 'parent_password').run();
      return json({ ok: true });
    }
    if (change) {
      const { id, student, type } = change;
      if (!['leon', 'logan'].includes(student) || typeof id !== 'string' || !id || id.length > 200 || (role !== 'parent' && student !== role)) return json({ error: 'Not allowed.' }, 403);
      const byId = await env.DB.prepare('SELECT * FROM assignments WHERE id=?').bind(id).first();
      if (byId && byId.student !== student) return json({ error: 'Assignment belongs to another profile.' }, 403);
      const existing = byId;
      if (type !== 'add' && type !== 'remove' && !existing) return json({ error: 'This assignment no longer exists. Refresh your dashboard.' }, 404);
      if (role !== 'parent' && type !== 'status') return json({ error: 'Only parents can edit assignments.' }, 403);
      if (type === 'remove') {
        await env.DB.batch([
          env.DB.prepare('DELETE FROM assignments WHERE id=? AND student=?').bind(id, student),
          env.DB.prepare('DELETE FROM settings WHERE key=?').bind(`assignment_meta_${id}`)
        ]);
        return json({ ok: true });
      }
      if (!['add', 'update', 'status'].includes(type)) return json({ error: 'Invalid update.' }, 400);
      let title = existing?.title, due = existing?.due, subject = existing?.subject;
      if (type !== 'status') {
        title = typeof change.title === 'string' ? change.title.trim() : '';
        due = change.due || '';
        subject = change.subject;
        if (!title || title.length > 2000 || typeof subject !== 'string' || !/^[a-z][a-z0-9_-]{0,39}$/.test(subject) || typeof due !== 'string' || (due && (!/^\d{4}-\d{2}-\d{2}$/.test(due) || isNaN(Date.parse(due))))) return json({ error: 'Check the assignment title, subject, and due date.' }, 400);
      }
      const metaRow = await env.DB.prepare('SELECT value FROM settings WHERE key=?').bind(`assignment_meta_${id}`).first();
      const meta = metadata(readJSON(metaRow?.value));
      if (role === 'parent' && Object.hasOwn(change, 'url')) {
        const url = safeURL(change.url);
        if (url === null) return json({ error: 'Use a complete http or https assignment link.' }, 400);
        meta.url = url;
      }
      if (Object.hasOwn(change, 'needsHelp')) meta.needsHelp = !!change.needsHelp;
      const done = Object.hasOwn(change, 'done') ? !!change.done : !!existing?.done;
      if (done) meta.needsHelp = false;
      const statement = type === 'add'
        ? env.DB.prepare('INSERT INTO assignments (id,student,subject,title,due,done) VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET subject=excluded.subject,title=excluded.title,due=excluded.due,done=excluded.done').bind(id, student, subject, title, due, done ? 1 : 0)
        : env.DB.prepare('UPDATE assignments SET title=?,due=?,subject=?,done=? WHERE id=? AND student=?').bind(title, due, subject, done ? 1 : 0, id, student);
      await env.DB.batch([statement, setting(env, `assignment_meta_${id}`, meta)]);
      return json({ ok: true });
    }
    if (body.scheduleOnly && role === 'parent') {
      const { student, date, items } = body;
      if (!['leon', 'logan'].includes(student) || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(Date.parse(`${date}T12:00:00Z`)) || !Array.isArray(items)) return json({ error: 'Choose a valid student, date, and schedule.' }, 400);
      const currentRow = await env.DB.prepare('SELECT value FROM settings WHERE key=?').bind(`${student}_schedule`).first();
      let current = {};
      try { current = JSON.parse(currentRow?.value || '{}') || {}; } catch {}
      const days = { ...(Array.isArray(current) ? {} : current.days || {}) };
      days[date] = items;
      await setting(env, `${student}_schedule`, { days }).run();
      return json({ ok: true });
    }
    if (body.cardsOnly && role === 'parent') {
      await setting(env, 'dashboard_cards', body.cards || {}).run();
      return json({ ok: true });
    }
    return json({ error: 'Unsupported save request.' }, 400);
  } catch {
    return json({ error: 'Your update could not be saved. Please retry.' }, 500);
  }
}
