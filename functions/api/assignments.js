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
    if (body.subjectsOnly) {
      if (role !== 'parent') return json({ error: 'Only parents can manage subjects.' }, 403);
      const { student, catalog } = body;
      if (!['leon', 'logan'].includes(student) || !catalog || !Array.isArray(catalog.added) || !Array.isArray(catalog.hidden) || catalog.added.length > 50 || catalog.hidden.length > 50) return json({ error: 'Check the subject list.' }, 400);
      const validId = value => typeof value === 'string' && /^[a-z][a-z0-9_-]{0,39}$/.test(value);
      const added = catalog.added.map(item => ({ id: item?.id, label: typeof item?.label === 'string' ? item.label.trim() : '' }));
      if (added.some(item => !validId(item.id) || !item.label || item.label.length > 60) || new Set(added.map(item => item.id)).size !== added.length || catalog.hidden.some(id => !validId(id))) return json({ error: 'Use unique subject names up to 60 characters.' }, 400);
      const cleanCatalog = { added, hidden: [...new Set(catalog.hidden)] };
      await setting(env, `assignment_subjects_${student}`, cleanCatalog).run();
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
      const validDate = value => typeof value === 'string' && (!value || /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(`${value}T12:00:00Z`)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value);
      for (const key of ['completedDate', 'submittedDate']) {
        if ((role === 'parent' || type === 'status') && Object.hasOwn(change, key)) {
          if (!validDate(change[key])) return json({ error: 'Use a valid completion and submission date.' }, 400);
          meta[key] = change[key];
        }
      }
      if (role === 'parent' && Object.hasOwn(change, 'receiptUrl')) {
        const receiptUrl = safeURL(change.receiptUrl);
        if (receiptUrl === null) return json({ error: 'Use a complete http or https receipt link.' }, 400);
        meta.receiptUrl = receiptUrl;
      }
      if (role === 'parent' && Object.hasOwn(change, 'receiptNote')) {
        if (typeof change.receiptNote !== 'string' || change.receiptNote.length > 2000) return json({ error: 'Keep receipt notes under 2,000 characters.' }, 400);
        meta.receiptNote = change.receiptNote.trim();
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
      // Merge the single day inside SQLite so concurrent saves for different
      // dates cannot overwrite each other. Keep other schedule properties too.
      await env.DB.prepare(`
        INSERT INTO settings (key,value) VALUES (?, json_object('days', json_object(?, json(?))))
        ON CONFLICT(key) DO UPDATE SET value=json_patch(
          CASE WHEN json_valid(settings.value) THEN settings.value ELSE '{}' END,
          json_object('days', json_object(?, json(?)))
        )
      `).bind(`${student}_schedule`, date, JSON.stringify(items), date, JSON.stringify(items)).run();
      return json({ ok: true });
    }
    if (body.cardsOnly && role === 'parent') {
      await setting(env, 'dashboard_cards', body.cards || {}).run();
      return json({ ok: true });
    }
    if (body.calendarOnly) {
      if (role !== 'parent') return json({ error: 'Only parents can edit the family calendar.' }, 403);
      if (!Array.isArray(body.events) || body.events.length > 500) return json({ error: 'The calendar can hold up to 500 events.' }, 400);
      const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(`${value}T12:00:00Z`)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
      const validTime = value => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
      const events = body.events.map(item => ({
        id: typeof item?.id === 'string' ? item.id : '',
        title: typeof item?.title === 'string' ? item.title.trim() : '',
        date: item?.date,
        start: item?.start || '',
        end: item?.end || '',
        location: typeof item?.location === 'string' ? item.location.trim() : '',
        notes: typeof item?.notes === 'string' ? item.notes.trim() : ''
      }));
      if (events.some(item => !item.id || item.id.length > 120 || !item.title || item.title.length > 160 || !validDate(item.date) || (item.start && !validTime(item.start)) || (item.end && !validTime(item.end)) || (item.start && item.end && item.end <= item.start) || item.location.length > 160 || item.notes.length > 2000) || new Set(events.map(item => item.id)).size !== events.length) return json({ error: 'Check the event title, date, times, and details.' }, 400);
      await setting(env, 'family_calendar', events).run();
      return json({ ok: true });
    }
    return json({ error: 'Unsupported save request.' }, 400);
  } catch {
    return json({ error: 'Your update could not be saved. Please retry.' }, 500);
  }
}
