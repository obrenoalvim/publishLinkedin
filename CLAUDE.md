# publish-linkedin

LinkedIn content queue automation.

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

**Read `CONTENT_RULES.md` first. Ask the user the questions listed there before writing anything.**

### Step 1 — check current queue

```bash
node -e "const q=require('./queue.json'); const p=q.filter(x=>x.status==='pending'); console.log(q.length,'total |',p.length,'pending | last ID:',Math.max(...q.map(x=>x.id))); p.slice(-5).forEach(x=>console.log(x.id,'|',x.title))"
```

### Step 2 — ask the user (if not already defined)

Before generating, confirm:
- Topics for this batch
- Any specific angles or stories to include
- Any topics to avoid this time

### Step 3 — write posts

Generate in parallel via Agent tool. Follow `CONTENT_RULES.md` exactly.

### Step 4 — validate character count

```js
[...body].length < 4000   // Unicode chars, not bytes
```

If over limit: cut middle paragraphs. Always preserve: opening + engagement question + hashtags.

### Step 5 — write to queue.json

Use a Node.js script (copy `scripts/add-posts-example.js`). Never use shell template literals with quotes — write a `.js` file and run it.

The script must:
- Check for duplicate IDs before writing
- Validate char count before writing
- Print confirmation after writing

### Step 6 — commit and push

```bash
git add queue.json
git commit -m "feat: add N new LinkedIn posts (IDs X-Y)"
git push
```

Resolve conflicts before pushing.

---

## Critical writing rules

- No parentheses in post body — **breaks the LinkedIn API**
- No em dash (`—`) — use comma or period
- No emojis except flag emojis if using bilingual format
- No bullet lists or numbered lists
- No adverbs
- Active voice
- Specific: real dates, names, numbers
- End with engagement question
- `[...body].length < 4000`

Full rules and format in `CONTENT_RULES.md`.

---

## queue.json structure

```json
{
  "id": 1,
  "title": "Descriptive title (internal reference only)",
  "status": "pending",
  "body": "post body here"
}
```

IDs sequential. Use `Math.max(...q.map(x=>x.id)) + 1` for next ID.

Status: `pending` | `published` | `failed_truncation`

---

## Token refresh

Run `node auth.js` when LinkedIn returns 401. Copy new values to `.env`.
