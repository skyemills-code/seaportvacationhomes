# Wine Bar on the River — "Let's Keep in Touch" page

A simple, easy-to-read landing page where guests join your list to get
**event invitations** and **news about new wines**. Submissions are captured
by **Netlify Forms** and copied automatically into a **Google Sheet**.

**No tracking:** there are no analytics, no cookies, and no third-party
trackers anywhere on this page.

### What's in this folder

| File | What it is |
| --- | --- |
| `index.html` | The landing page with the sign-up form |
| `success.html` | The "Thank You" page shown after someone signs up |
| `menu.pdf` | Your wine menu (opens from the "View Our Wine Menu" button) |
| `netlify.toml` | Netlify settings (no build step needed) |
| `google-apps-script.gs` | The small script that sends sign-ups to Google Sheets |
| `SETUP.md` | This guide |

To update the menu later, just replace `menu.pdf` with a new file of the
same name.

---

## Part 1 — Put the page online with Netlify

You only need to do this once. Everything is a static page, so there is no
build step.

**Easiest option — drag and drop**

1. Go to <https://app.netlify.com> and sign in (a free account is fine).
2. Click **Add new site → Deploy manually**.
3. Drag this whole folder onto the upload area.
4. Netlify gives you a web address like `https://your-site.netlify.app`.
   That is your live page. You can rename it under **Site settings →
   Change site name**, or connect your own domain later.

**Or — deploy from GitHub** (recommended so future edits go live
automatically)

1. In Netlify, click **Add new site → Import an existing project**.
2. Choose GitHub and pick this repository.
3. Leave the build command empty and set **Publish directory** to `.`
   (these are already set in `netlify.toml`).
4. Click **Deploy**.

### Check that the form works

- Open your live page and submit a test sign-up.
- In Netlify, go to **Forms** — you should see a form named
  **`keep-in-touch`** with your test submission inside.

> Netlify finds the form automatically because `index.html` includes
> `data-netlify="true"`. If the form doesn't appear after the first deploy,
> deploy once more so Netlify can scan the page.

You can also have Netlify **email you** on every sign-up: **Forms → Settings
and usage → Form notifications → Add notification → Email notification**.

---

## Part 2 — Send every sign-up into a Google Sheet

This makes every submission appear on its own row in a Google Sheet,
automatically.

### Step A — Create the sheet and add the script

1. Go to <https://sheets.google.com> and create a **new blank spreadsheet**.
   Name it something like **"Wine Bar — Keep in Touch"**.
2. In that sheet, open the menu **Extensions → Apps Script**.
3. Delete any sample code in the editor.
4. Open `google-apps-script.gs` from this folder, copy **all** of it, and
   paste it into the Apps Script editor.
5. Click the **Save** icon.

### Step B — Publish the script as a web app

1. In the Apps Script editor, click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Set:
   - **Description:** `Wine Bar sign-ups`
   - **Execute as:** **Me**
   - **Who has access:** **Anyone**
4. Click **Deploy**. Google will ask you to **Authorize access** — approve
   it with your Google account. (If you see an "unverified app" screen,
   click **Advanced → Go to (project) → Allow**. This is normal for your
   own scripts.)
5. Copy the **Web app URL** it gives you. It ends in `/exec`.
   You'll paste it into Netlify in the next step.

> Tip: paste that URL into a browser. You should see
> `{"result":"ok",...}`. That confirms it's live.

### Step C — Tell Netlify to send submissions to that URL

1. In Netlify, open your site and go to **Forms → Settings and usage →
   Form notifications**.
2. Click **Add notification → Outgoing webhook**.
3. Set:
   - **Event to listen for:** **New form submission**
   - **URL to notify:** paste the **Web app URL** from Step B (the `/exec`
     one).
   - **Form:** choose **`keep-in-touch`** (or leave as "any form").
4. Save.

### Step D — Test it end to end

1. Open your live page and submit another test sign-up.
2. Open your Google Sheet — a new row should appear on a tab named
   **Contacts**, with columns: **Date, Name, Email, Phone, Interested In**.

That's it. From now on, every person who signs up lands in that sheet
automatically. 🍷

---

## Making changes later

- **New menu:** replace `menu.pdf` with your updated file (same name), then
  redeploy (drag-and-drop again, or push to GitHub).
- **Change the wording, colors, or fields:** edit `index.html`. The form
  fields are near the middle of the file and clearly labeled.
- **Add a form field** (for example, a birthday): add the input in
  `index.html`, then add a matching column in `HEADERS` and a line in the
  `row` array inside `google-apps-script.gs`.

## Troubleshooting

- **Form submissions show in Netlify but not in the Sheet:** re-check the
  webhook URL in Netlify (Step C) — it must be the `/exec` URL. If you
  changed the script, use **Deploy → Manage deployments → Edit → New
  version** so the update goes live.
- **Nothing shows in Netlify Forms:** deploy the site one more time so
  Netlify re-scans `index.html` for the form.
