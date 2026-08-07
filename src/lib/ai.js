import Anthropic from '@anthropic-ai/sdk'

// The app is offline-first and never computes JUICE on its own. This module is
// the ONE optional online feature: it asks Claude to produce a JUICE record for
// a player, using the same evaluation lens the board is built around. It runs
// only when the user has pasted their own API key, and only when they click
// Evaluate — it is never used during offline drafting.

const MODEL = 'claude-opus-5'

const SYSTEM = `You are the evaluation engine for a personal fantasy football draft board called THE JUICE BOARD. Scoring is full-PPR redraft.

Your job: given a player's name, produce ONE JSON record scoring their "JUICE" — a single 0-100 draft-value number — the way a sharp, upside-hunting drafter would. Weigh: projected usage/volume, ceiling/upside, injury and situation risk, positional value and where they'll actually go (reach), your conviction, and the quality of their offensive environment. Blend those into JUICE using these tiers:
95-100 elite cornerstone · 90-94 great · 85-89 strong starter · 80-84 solid starter · 75-79 flex/upside · 65-74 bench depth · below 65 deep/avoid.

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
- "notes": a short note; if you are uncertain about the team, role, or health, say so plainly here

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
