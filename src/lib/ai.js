import Anthropic from '@anthropic-ai/sdk'

// The app is offline-first and never computes JUICE on its own. This module is
// the ONE optional online feature: it asks Claude to produce a JUICE record for
// a player, using the same evaluation lens the board is built around. It runs
// only when the user has pasted their own API key, and only when they click
// Evaluate — it is never used during offline drafting.

const MODEL = 'claude-opus-5'

const SYSTEM = `You are the evaluation engine for a personal fantasy football draft board called THE JUICE BOARD. Scoring is full-PPR redraft.

Your job: given a player's name, produce ONE JSON record scoring their "JUICE" — a single 0-100 draft-value number. Build it with an explicit "Scout Grade":

1) TALENT (0-100): the player's raw ability and profile.
2) OPPORTUNITY: projected usage/volume, role, and target/touch share.
3) OFFENSE modifier: how much the team's offense helps or hurts fantasy production (objective tiers below).
4) RISK modifier: injury, situation, and situation-uncertainty (a small deduction).

Blend TALENT and OPPORTUNITY into a raw score, then apply the OFFENSE and RISK modifiers to get FINAL JUICE, using these tiers:
95-100 elite cornerstone · 90-94 great · 85-89 strong starter · 80-84 solid starter · 75-79 flex/upside · 65-74 bench depth · below 65 deep/avoid.

OFFENSE ENVIRONMENT (objective — this is about the offense, not team preference):
- Tier 1 Elite (+2): Eagles, Bills, Lions, Ravens, Bengals, Chiefs.
- Tier 2 Very Good (+1): Packers, Buccaneers, Rams, 49ers, Texans.
- Tier 3 Neutral (0): everyone not listed elsewhere (Seahawks, Bears, Jaguars, Cowboys, Broncos, Colts, Vikings, Dolphins, Commanders, Chargers, Cardinals, etc.). Arizona is explicitly 0 — do not auto-penalize it; let the individual player's talent/opportunity carry.
- Tier 4 Below Average (-2): Panthers, Patriots, Titans, Saints, Jets.
- Tier 5 Major Penalty (-4): Browns, Giants, Raiders.

OFFENSE CAP RULE — offense is a modifier, never a dominator:
- The offense modifier's positive side is capped at +2.
- Tier 5's -4 applies in full ONLY to ordinary players. If a player has BOTH elite talent AND elite opportunity (their pre-offense raw score is ~90+), cap the offense hit at -2 so a genuine stud never craters purely because of team quality. Example: an elite talent with elite opportunity on a great offense stays ~95-96; the same profile on a bottom-tier offense only slides to ~93-94, not into the 80s.

Never let the offense modifier alone move an elite (raw 90+) player's score by more than 2 points.

Return ONLY a raw JSON object (no markdown, no code fences, no prose) with EXACTLY these keys:
- "name": string (correct, properly capitalized full name)
- "position": one of "QB" "RB" "WR" "TE" "K"
- "team": current NFL team abbreviation (e.g. "SEA"), or "TBD" if you are not confident
- "bye": the team's bye week as a number, or "TBD" if unknown
- "draftWindow": one of "R1" "R1-2" "R2-3" "R3-4" "R4-6" "R5-7" "R6-9" "R7-10" "R8-11" "R9-12" "R10-14" "Late" "Last" "Do not target"
- "role": one of "Stud" "Starter" "League Winner" "Breakout" "Bench" "Handcuff" "Injury" "Watch"
- "juice": integer 0-100
- "points2025": if the player had no NFL production in the 2025 season (rookies, etc.), use "Rookie". Otherwise leave it as an empty string "" — do NOT invent or estimate a fantasy point total. Only put a number here if you are certain of the actual 2025 full-PPR total.
- "trend": one of "Rising" "Stable" "Falling"
- "hearts": 0
- "why": one short sentence (max ~8 words) — the core reason
- "notes": START with the Scout Grade on one line in exactly this format: "Scout — Talent {n} / Opp {n} / Offense {+/-n} / Risk {+/-n} → {final juice}". Then add a short plain-language note; if you are uncertain about the team, role, health, or the 2025 total, say so here.

Rules: never fabricate 2025 point totals. If the name is ambiguous or not a real NFL player, still return valid JSON with your best guess and flag the uncertainty in "notes". Output the JSON object and nothing else.`

function extractJson(text) {
  let t = String(text || '').trim()
  // Strip markdown fences if the model added them despite instructions.
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  const start = t.indexOf('{')
  const end = t.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) t = t.slice(start, end + 1)
  return JSON.parse(t)
}

// Evaluate a player by name. `context` can carry the existing record (for a
// refresh) so the model corrects facts rather than starting blind.
export async function evaluatePlayer(apiKey, name, context = {}) {
  if (!apiKey) throw new Error('No API key set.')
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  let userText = `Evaluate this player and return the JSON record: "${name}".`
  if (context.existing) {
    userText +=
      `\n\nThe board currently has this record for them (correct any wrong facts like team/bye/position, and re-score if warranted):\n` +
      JSON.stringify(
        {
          position: context.existing.position,
          team: context.existing.team,
          bye: context.existing.bye,
          role: context.existing.role,
          juice: context.existing.juice,
          draftWindow: context.existing.draftWindow,
        },
        null,
        2
      )
  }

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 1400,
    system: SYSTEM,
    messages: [{ role: 'user', content: userText }],
  })

  const text = (res.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')

  const record = extractJson(text)
  // Force a clean name if the model echoed something odd.
  if (!record.name) record.name = name
  record.status = 'available'
  return record
}

// Turn SDK/network errors into a short, user-friendly message.
export function describeAiError(err) {
  const msg = String(err?.message || err || 'Something went wrong')
  if (/401|authentication|invalid x-api-key|api key/i.test(msg))
    return 'That API key was rejected. Double-check it and try again.'
  if (/403|permission|not_found_error|model/i.test(msg))
    return "Your key doesn't have access to the model. Check your Anthropic plan."
  if (/429|rate/i.test(msg)) return 'Rate limited — wait a moment and try again.'
  if (/JSON|Unexpected token|parse/i.test(msg))
    return "Couldn't read the AI response. Try Re-run."
  if (/Failed to fetch|Network|ENOTFOUND|CORS/i.test(msg))
    return 'Network error — you need to be online to use AI evaluation.'
  return msg
}
