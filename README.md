# publish-linkedin

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Automates LinkedIn post publishing via the LinkedIn REST API. Maintains a JSON queue of bilingual (EN + PT-BR) posts and publishes one per invocation — designed to run on a cron schedule.

## How it works

1. Posts are stored in `queue.json` as bilingual text (English + Portuguese)
2. A cron job calls `node post.js` on schedule
3. The script picks the next `pending` post, publishes it, and marks it `published`
4. New posts are added to the queue by AI agents following rules in `CONTENT_RULES.md`

## Setup

```bash
npm install
cp .env.example .env
```

Fill in `.env`:

```env
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
LINKEDIN_ACCESS_TOKEN=...    # from auth.js
LINKEDIN_PERSON_URN=...      # from auth.js
LI_AT=                       # optional, for post verification
```

Generate token:

```bash
node auth.js
```

## Usage

```bash
node post.js             # publish next pending post
node post.js --list      # list all posts in queue
node post.js --validate  # check all pending posts fit within 4000 chars
```

Or via npm scripts:

```bash
npm run post
npm run list
npm run validate
npm run auth
```

## Adding posts

See `CONTENT_RULES.md` for the full content guide and format spec.

Copy `scripts/add-posts-example.js`, fill in your posts, and run:

```bash
node scripts/add-posts-example.js
git add queue.json && git commit -m "feat: add N posts (IDs X-Y)"
```

## Project structure

```
publish-linkedin/
├── post.js              main publisher
├── auth.js              OAuth 2.0 token flow
├── queue.json           content queue (one post per entry)
├── .env.example         env template
├── CONTENT_RULES.md     format and style guide for posts
├── CLAUDE.md            AI agent instructions
└── scripts/
    └── add-posts-example.js   template for bulk-adding posts
```

## Post format

Every post follows this exact structure:

```
🇺🇸 English body (3-4 paragraphs, ends with engagement question)

---

🇧🇷 Portuguese body (same message in natural PT-BR)

#PTHashtag1 #PTHashtag2 #Brasil
#ENHashtag1 #ENHashtag2 #Software
```

Character limit: `[...body].length < 4000` (Unicode chars)

## License

[MIT](LICENSE)
