# School Dashboard

1. In Cloudflare D1, open `family-assignments`, choose **Console**, and run the contents of `schema.sql`.
2. Replace your GitHub repository contents with this folder's contents and push to `main`.
3. Cloudflare Pages redeploys automatically. The existing `DB` binding and three password secrets are used by the new app.

The first successful sign-in imports the assignment lists into D1.

The kids’ dashboard shows Now / Next, Due Today, the next unfinished due date in Working Ahead, and Past Due. Completed work can be reopened. Parents can attach a direct assignment link, manage help requests, import assignments and schedules, and review the next seven days for both children. The shared dashboard remains read-only.

Settings include light/dark/device appearance, theme previews and high-contrast themes, text size, spacing, and an optional class browser. Signed-in profiles sync settings through D1; shared-dashboard and signed-out settings are saved on the current device. Existing theme choices carry over.

Assignment links, help flags, and preferences use the existing `settings` table. Existing databases need no migration. Keep the current Cloudflare Pages `DB` binding and password secrets. Upload the HTML, CSS, JavaScript, and `functions` files together when deploying.

Schedules use Eastern Time. Defaults apply on weekdays; explicitly imported or edited dates can include weekends. End times are optional and retained when importing schedules. Older schedules without an end time for the last class show “Latest start” rather than claiming that class is still in session.

Unsaved changes stay queued on the device and retry when connectivity returns. A failed save stays visible with a Retry control; switching accounts waits for pending changes to save.

Run API and date/import checks with `npm test` (Node 22.13+ with built-in SQLite). For a local sample-data preview, run `node tests/test-server.js` and open `http://127.0.0.1:4173`. All three sample profiles use `test-password`; this preview uses an in-memory database, not the live school data. Browser checks run with `node tests/browser.cjs` when Playwright and Chrome are available.
