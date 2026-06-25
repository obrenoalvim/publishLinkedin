# publish-linkedin

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Automates LinkedIn post publishing via the LinkedIn REST API. Maintains a JSON queue of posts and publishes one per invocation — designed to run on a cron schedule.

**[🇧🇷 Leia em Português](README.pt.md)**

---

## How it works

1. Posts are stored in `queue.json`
2. A cron job (or manual trigger) calls `node post.js`
3. The script picks the next `pending` post, publishes it via the LinkedIn API, and marks it `published`
4. New posts are added to the queue manually or by AI agents following `CONTENT_RULES.md`

---

## Step-by-step setup

### 1. Create a LinkedIn Developer app

1. Go to [https://developer.linkedin.com/](https://developer.linkedin.com/)
2. Click **Create app**
3. Fill in:
   - **App name** — any name (e.g. "My LinkedIn Publisher")
   - **LinkedIn Page** — your personal or company page (required by LinkedIn)
   - **App logo** — any image
4. Click **Create app**

### 2. Add required products

In your app dashboard, click the **Products** tab and request access to:

- **Share on LinkedIn** — allows posting content
- **Sign In with LinkedIn using OpenID Connect** — allows fetching your person URN

> Products may take a few minutes to activate. Both must show **Added** before proceeding.

### 3. Configure OAuth redirect URI

1. In your app dashboard, go to the **Auth** tab
2. Under **OAuth 2.0 settings**, click the pencil icon next to **Authorized redirect URLs**
3. Add: `http://localhost:3000/callback`
4. Save

### 4. Copy credentials

Still in the **Auth** tab, copy:
- **Client ID**
- **Client Secret**

### 5. Install and configure

```bash
git clone https://github.com/your-username/publish-linkedin.git
cd publish-linkedin
npm install
cp .env.example .env
```

Open `.env` and fill in:

```env
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
```

### 6. Generate access token

```bash
node auth.js
```

This will:
1. Open your browser at the LinkedIn authorization page
2. Ask you to log in and authorize the app
3. Print your `LINKEDIN_ACCESS_TOKEN` and `LINKEDIN_PERSON_URN`

Copy both values into `.env`.

### 7. (Optional) Add session cookie for post verification

After publishing, the script can verify the post appeared on LinkedIn by scraping the post page. To enable this:

1. Open LinkedIn in your browser
2. Open DevTools → Application → Cookies → `www.linkedin.com`
3. Copy the value of the `li_at` cookie
4. Add to `.env`: `LI_AT=your_cookie_value`

### 8. Validate setup

```bash
node scripts/setup-check.js
```

This checks that all required env vars are set and that the LinkedIn API is reachable with your token.

---

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

---

## Adding posts to the queue

Check current queue status:

```bash
node -e "const q=require('./queue.json'); const p=q.filter(x=>x.status==='pending'); console.log(q.length,'total |',p.length,'pending | last ID:',Math.max(...q.map(x=>x.id)))"
```

Copy `scripts/add-posts-example.js`, fill in your posts, and run:

```bash
node scripts/your-new-posts.js
git add queue.json && git commit -m "feat: add N posts (IDs X-Y)"
```

See `CONTENT_RULES.md` for the full format and style guide.

---

## Token expiry

LinkedIn access tokens expire after **60 days**. When you get a 401 error:

```bash
node auth.js
```

Copy the new `LINKEDIN_ACCESS_TOKEN` into `.env`.

---

## Project structure

```
publish-linkedin/
├── post.js                    main publisher
├── auth.js                    OAuth 2.0 token flow
├── queue.json                 content queue
├── .env.example               env template
├── CONTENT_RULES.md           format and style guide
├── CLAUDE.md                  AI agent instructions
├── README.md                  this file (English)
├── README.pt.md               this file (Portuguese)
└── scripts/
    ├── setup-check.js         validates credentials and API connection
    └── add-posts-example.js   template for adding posts to queue
```

---

## License

[MIT](LICENSE)
