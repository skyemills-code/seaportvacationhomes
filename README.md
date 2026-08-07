# 🧃 THE JUICE BOARD — *Kupp Runneth Over*

A premium, **offline-first** fantasy football draft dashboard. Not a fantasy
website — your own private NFL-style war room built entirely around your JUICE
evaluations. No internet, no APIs, no AI, no login, no backend. Everything runs
locally in the browser.

Built for one job: **make a draft pick in under 10 seconds.**

---

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
```

Build a static, fully offline bundle:

```bash
npm run build    # outputs to dist/ — open dist/index.html anywhere
npm run preview  # preview the production build
```

The whole app is static. After `npm run build` you can copy `dist/` to a USB
stick, drop it on any machine, and it runs with no network.

---

## Your data

Your evaluations live in **`public/players.json`** — a plain JSON array. The app
**never calculates JUICE or any value**; it only displays what's in this file.
Edit the file and refresh to update the board.

Your draft state (who you drafted, who's gone, hearts, notes, league size,
theme) is saved automatically in the browser's `localStorage`, so a refresh
never loses your board. It is kept separately from `players.json`.

### Player schema

Each entry in the array looks like this:

```json
{
  "name": "A.J. Brown",
  "position": "WR",
  "team": "PHI",
  "bye": 10,
  "draftWindow": "R1–2",
  "role": "Stud",
  "juice": 96,
  "points2025": null,
  "trend": "Stable",
  "hearts": 3,
  "why": "Alpha WR1; top personal target",
  "notes": "",
  "status": "available"
}
```

| Field         | Type            | Notes |
|---------------|-----------------|-------|
| `name`        | string          | Unique. Used for search + the player's id. |
| `position`    | string          | `QB` `RB` `WR` `TE` `K` (FLEX = RB/WR/TE). |
| `team`        | string          | NFL abbreviation. |
| `bye`         | number \| null  | Bye week. |
| `draftWindow` | string          | See windows below. |
| `role`        | string          | See roles below. |
| `juice`       | number          | 0–100. The proprietary ranking. **Displayed, never computed.** |
| `points2025`  | number \| null  | 2025 fantasy points; `null` shows as `—`. |
| `trend`       | string          | `Rising` / `Stable` / `Falling` (⬆ ➡ ⬇). |
| `hearts`      | number          | 0–3 ❤️. Drives the **❤️ My Guys** filter. |
| `why`         | string          | One-line take shown in the table + card. |
| `notes`       | string          | Longer notes (editable in-app). |
| `status`      | string          | `available` / `mine` / `gone` (seed only). |

### JUICE color tiers

| JUICE  | Tier       |
|--------|------------|
| 95–100 | Dark Green |
| 90–94  | Green      |
| 85–89  | Lime       |
| 80–84  | Yellow     |
| 75–79  | Orange     |
| 65–74  | Gray       |
| < 65   | Muted Red  |

### Roles

⭐ Stud · 🟢 Starter · 💎 League Winner · 🚀 Breakout · 🪑 Bench · 🛡️ Handcuff ·
🩺 Injury · 👀 Watch

### Draft windows

`R1` · `R1–2` · `R2–3` · `R3–4` · `R4–6` · `R5–7` · `R6–9` · `R7–10` · `R8–11` ·
`R9–12` · `R10–14` · `Late` · `Last` · `Do not target`

---

## Using the board

- **Three columns** — My Team + roster needs + draft history (left), the sortable
  Available Players table (center), the full player card (right).
- **Quick search** — always at the top. Type any partial name; results update
  instantly. `/` focuses it, `Esc` clears it. Unknown names show
  *🚫 NOT ON THE JUICE BOARD* with an **Add to Watch List** button.
- **One-click drafting** — every row and the player card have **⭐ Draft To My
  Team** and **❌ Gone**. No confirmations. Drafted players auto-fill your
  roster; "gone" players gray out but are never deleted. Use **↩** to undo.
- **Filters** — position, upside tags (❤️ My Guys, 💎 League Winners, 🚀
  Breakouts, 🪑 Bench, 🩺 Injury, 👀 Watch) and Hide Gone / My Team / Drafted.
- **Compare** — add 2–3 players and view them side-by-side.
- **⏱ On The Clock** — pick a round + position and see only the highest-JUICE
  players available, as big cards.
- **💎 Late Round** — floats League Winners & Breakouts up top and dims Bench.
- **Dark mode** — follows your system by default; the top-right button cycles
  System → Light → Dark.
- **League size** — set your number of teams (top bar) so Round/Pick track
  correctly.

---

## Tech

React + Vite. No runtime dependencies beyond React. All state is local.
