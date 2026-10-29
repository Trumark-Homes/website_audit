# Website Audit Tracker (Netlify)

The Trumark division website audit as a hosted web page. In one place it has the dashboard views (priority tiles, charts by community and by check area), the fix list teams tick off, a What Changed panel, progress by community, and a **Download presentation (.pptx)** button that builds the division audit deck in the browser.

## What's in the folder

| Path | What it is |
|---|---|
| `public/index.html` | The page: dashboard, fix list, What Changed, and presentation download |
| `public/audit-core.js` | Shared logic: due dates, overdue, "Still failing", scan-to-scan diff, activity |
| `public/deck.js` | Builds the PowerPoint in the Division Website Audit layout (uses PptxGenJS) |
| `public/data/results.json` | Findings from the latest scan (run 2, Oct 28, 2026) |
| `public/data/coverage.json` | What the scan checked and didn't check |
| `public/data/pages.json` | Pages scanned |
| `netlify/functions/status.mjs` | Small API at `/api/status` that saves fix statuses in Netlify Blobs |
| `netlify.toml` | Netlify settings |
| `package.json` | Lists the one dependency the function needs (`@netlify/blobs`) |

## Deploy (GitHub + Netlify, recommended)

1. Create a new **private** GitHub repository and upload everything in this folder. Keep the folder structure as it is.
2. In Netlify, choose **Add new site → Import an existing project**, then pick the repository. Leave the build command empty. The publish folder (`public`) and the functions folder are already set in `netlify.toml`.
3. In Netlify, go to **Site configuration → Environment variables** and add `EDIT_PASSCODE` with the team passcode you want editors to use.
4. Trigger a redeploy (**Deploys → Trigger deploy**) so the function picks up the passcode.
5. Open the site and sign in with your name and the passcode. Tick a test item, then untick it.

Use Git or the Netlify CLI rather than drag-and-drop. Drag-and-drop is meant for static files. The page would load, but saving statuses depends on the function and its dependency being built.

**Netlify CLI alternative:** in this folder run `npm install`, then `npx netlify login`, then `npx netlify deploy --prod`. Set `EDIT_PASSCODE` as in step 3.

**Local preview:** run `npm install`, then `npx netlify dev`. For local testing, put `EDIT_PASSCODE=anything` in a `.env` file. Don't commit that file.

## How access works

- **Anyone with the link can view.** The site asks search engines not to index it, but the address itself isn't protected. Netlify's site-wide password protection is a paid-plan feature. Turn it on if the findings shouldn't be open to anyone who has the link.
- **Editing needs a name and the team passcode.** The name is what shows up in "who changed it". The browser remembers both until the person clicks **Sign out**. To revoke access, change `EDIT_PASSCODE` and redeploy.
- Statuses are stored in Netlify Blobs, in a store named `audit-status`, with one record per Finding ID. Each record keeps its last 20 changes.
- Other people's changes show up within 30 seconds, or right away when someone returns to the tab.

## After each scan

1. Copy the current `public/data/results.json` to `public/data/previous.json`.
2. Replace `public/data/results.json`, `coverage.json` and `pages.json` with the new scan's files.
3. Commit. Netlify redeploys on its own.

Once `previous.json` exists, What Changed shows the scan-to-scan comparison. That covers new items, cleared items, carried-over items, items that came back, and items marked fixed that the scan still finds. **Finding IDs must stay the same from scan to scan** (for example `CO-BV-INC05`). The comparison and the saved statuses both match findings by ID.

## Notes

- Fix windows (High within 2 business days, Medium 14 days, Low 30 days, Heads-Up 14 days) are the **proposed** ones from the Priority Rubric and are not approved yet. They're set in `WINDOW` near the top of `public/audit-core.js`.
- The page loads d3 from cdnjs and PptxGenJS from jsDelivr (pinned versions), and fonts from Google Fonts.
- Statuses saved in the Claude version of the tracker don't carry over. The Netlify site starts with every item Open.
