# Content Rules — LinkedIn Queue

## Before generating posts: ask the user

If any of the following are not already defined in this session, **ask before writing a single post**:

1. **Topics** — What subjects do you want to cover? (Examples: tech history, product decisions, dev culture, leadership, your industry)
2. **Audience** — Who are you writing for? (developers, managers, founders, general professionals?)
3. **Languages** — Do you want bilingual posts (EN + PT-BR)? Or single language? Which?
4. **Tone** — Formal or conversational? Personal stories or educational content?
5. **Banned topics** — Anything you never want to post about?

Do not assume defaults. Ask. Only proceed once the user answers.

---

## Flow (mandatory order)

### 1. Check current queue

```bash
node -e "const q=require('./queue.json'); const p=q.filter(x=>x.status==='pending'); console.log(q.length,'total |',p.length,'pending | last ID:',Math.max(...q.map(x=>x.id))); p.slice(-5).forEach(x=>console.log(x.id,'|',x.title))"
```

### 2. Define topics

Check recent titles above for duplicates. Discard a topic if it already exists in the queue — unless the angle is clearly different.

### 3. Generate posts

Generate one post at a time or in parallel via the Agent tool. Follow the format below exactly.

### 4. Validate character count

```js
[...body].length < 4000   // Unicode chars, not bytes
```

If over limit: cut middle paragraphs. Always preserve: opening + engagement question + hashtags.

### 5. Write to queue.json

Use a Node.js script (copy `scripts/add-posts-example.js`). Never use shell template literals with quotes — write a `.js` file and run it.

The script must:
- Check for duplicate IDs before writing
- Validate char count before writing
- Print confirmation after writing

### 6. Commit and push

```bash
git add queue.json
git commit -m "feat: add N new LinkedIn posts (IDs X-Y)"
git push
```

Resolve conflicts before pushing.

---

## Post format

### Bilingual (EN + PT-BR)

```
🇺🇸 [EN body — 3-4 paragraphs, ends with engagement question]

---

🇧🇷 [PT body — same message in natural Brazilian Portuguese]

#PTHashtag1 #PTHashtag2 #PTHashtag3 #Brasil
#ENHashtag1 #ENHashtag2 #ENHashtag3 #Software
```

### Single language

```
[body — 3-4 paragraphs, ends with engagement question]

#Hashtag1 #Hashtag2 #Hashtag3
```

Use 4-6 hashtags. Mix topic-specific tags with 2 high-volume general tags relevant to the post's universe.

---

## Writing rules (always apply)

**Structure**
- 3-4 paragraphs
- End with an engagement question to the reader
- No bullet lists or numbered lists
- No headers inside the post body

**Style**
- No emojis — except the flag emojis 🇺🇸 🇧🇷 if using bilingual format
- No em dash (`—`). Use comma or period instead.
- No parentheses — **breaks the LinkedIn API**
- No adverbs
- Active voice — human subject doing something
- Specific: real dates, names, real numbers. No vague statements.
- Tone: dinner conversation, not press release

**Stop-slop patterns to eliminate**
- Unnecessary openers ("Well,", "Actually,", "Basically,")
- Binary contrasts ("It's not X, it's Y" — just say Y directly)
- Dramatic one-sentence fragments for impact — rewrite as full sentences
- Pull-quote-style sentences — rewrite them
- Passive voice — find the actor, make it the subject

---

## queue.json structure

```json
{
  "id": 1,
  "title": "Descriptive title (used for internal reference only)",
  "status": "pending",
  "body": "post body here"
}
```

IDs are sequential. Always use `Math.max(...q.map(x=>x.id)) + 1` for the next ID.

Status values: `pending` | `published` | `failed_truncation`
