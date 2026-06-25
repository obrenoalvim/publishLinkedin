# publish-linkedin

LinkedIn content queue automation for Breno Alvim's profile.

## Setup

```bash
npm install
cp .env.example .env   # fill in credentials
node auth.js           # generate token
```

## Daily workflow

```bash
node post.js --list       # see queue
node post.js --validate   # check char limits
node post.js              # publish next pending post
```

---

## Generating new posts (MANDATORY FLOW)

Read `CONTENT_RULES.md` before writing a single word.

### Step 1 — check current queue

```bash
node -e "const q=require('./queue.json'); const p=q.filter(x=>x.status==='pending'); console.log(q.length,'total |',p.length,'pending | last ID:',Math.max(...q.map(x=>x.id))); p.slice(-5).forEach(x=>console.log(x.id,'|',x.title))"
```

### Step 2 — define topics

Check recent titles above. Discard duplicates unless the angle is clearly different.

### Step 3 — dispatch parallel agents (MANDATORY even if execute fails)

```
ToolSearch → mcp__ruflo__swarm_init, mcp__ruflo__agent_spawn
swarm_init topology=star, maxAgents=N
agent_spawn one per post (parallel)
```

> `agent_execute` requires `ANTHROPIC_API_KEY` in env. If it fails, generate posts directly — the swarm registration is what matters.

### Step 4 — write posts

Follow `CONTENT_RULES.md` exactly. One agent per post in parallel.

### Step 5 — apply `/stop-slop`

Run `/stop-slop` on every post. Minimum score: **35/50**. Fix and recheck until passing.

### Step 6 — validate character count

```js
[...body].length < 4000   // Unicode chars, not bytes
```

If over limit: cut middle paragraphs. Always preserve opening + engagement question + hashtags.

### Step 7 — write to queue.json

Use a Node.js script (copy pattern from `scripts/add-posts-example.js`). Never use shell template literals with quotes — write a `.js` file and run it.

The script must:
- Check for duplicate IDs before writing
- Validate char count before writing
- Print confirmation after writing

### Step 8 — commit and push

```bash
git add queue.json
git commit -m "feat: add N new LinkedIn posts (IDs X-Y)"
git push
```

Resolve conflicts before pushing.

---

## Post format (follow exactly)

```
🇺🇸 [EN body — 3-4 paragraphs, ends with engagement question]

---

🇧🇷 [PT body — same message in natural Brazilian Portuguese]

#PTHashtag1 #PTHashtag2 #PTHashtag3 #PTHashtag4 #Brasil
#ENHashtag1 #ENHashtag2 #ENHashtag3 #ENHashtag4 #Software
```

Each entry: `[...body].length < 4000`

---

## Content rules (summary — full rules in CONTENT_RULES.md)

**Voice**
- No emojis except flags 🇺🇸 🇧🇷
- No em dash (`—`). Use comma or period.
- No bullet lists or numbered lists
- No adverbs
- Active voice — human subject doing something
- Specific: real dates, names, numbers. No vague declarations.
- End every post with an engagement question to the reader
- Tone: dinner conversation, not press release

**Allowed topics**
- History of technology, software engineering, product decisions, dev culture
- B2C — speak to the end user/professional, not sales teams

**Banned topics**
- Cold calls, phone calls, video calls, active prospecting

**Stop-slop patterns to eliminate**
- Unnecessary openers ("Pois bem", "Na verdade", "Actually")
- Binary contrasts ("It's not X, it's Y" — just say Y)
- Dramatic fragmentation (one-word sentences for impact)
- Pull-quote sentences — rewrite them
- Passive voice — find the actor, make it the subject

---

## queue.json structure

```json
{
  "id": 482,
  "title": "Descriptive title in PT",
  "status": "pending",
  "body": "🇺🇸 ...\n\n---\n\n🇧🇷 ...\n\n#hashtags"
}
```

IDs are sequential. Always use `Math.max(...q.map(x=>x.id)) + 1` for next ID.

Status values: `pending` | `published` | `failed_truncation`

---

## Token refresh

Run `node auth.js` when LinkedIn returns 401. Copy new values to `.env`.

## Schedule (reference)

- Mon/Thu/Sat: 8 posts/day (every 2h, 8h–22h BRT)
- Tue/Wed/Fri/Sun: 2 posts/day (times TBD)
