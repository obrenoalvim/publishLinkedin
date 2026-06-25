#!/usr/bin/env node

/**
 * post.js — publishes posts to LinkedIn via REST API.
 *
 * Usage:
 *   node post.js            publish next pending post from queue
 *   node post.js --list     list all posts in queue
 *   node post.js --validate check character limits on all pending posts
 *
 * Requires .env with:
 *   LINKEDIN_ACCESS_TOKEN   Bearer token from auth.js
 *   LINKEDIN_PERSON_URN     urn:li:person:XXXXXXXX
 *   LI_AT                   (optional) session cookie for post verification
 */

require("dotenv").config();

const https = require("https");
const fs = require("fs");
const path = require("path");

const ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;
const PERSON_URN = process.env.LINKEDIN_PERSON_URN;
const LI_AT = process.env.LI_AT;

if (!ACCESS_TOKEN || !PERSON_URN) {
  console.error("Missing LINKEDIN_ACCESS_TOKEN or LINKEDIN_PERSON_URN in .env");
  process.exit(1);
}

const queuePath = path.join(__dirname, "queue.json");

function loadQueue() {
  if (!fs.existsSync(queuePath)) { console.error("queue.json not found."); process.exit(1); }
  let content = fs.readFileSync(queuePath, "utf-8");
  if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
  return JSON.parse(content);
}

function saveQueue(queue) {
  fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2) + "\n");
}

function listQueue() {
  const queue = loadQueue();
  if (queue.length === 0) { console.log("Queue empty."); return; }
  console.log(`\nLinkedIn Queue (${queue.length} total):\n`);
  for (const post of queue) {
    const icon = post.status === "published" ? "✓" : post.status === "failed_truncation" ? "✗" : "·";
    const status = post.status === "published" ? `published at ${post.published_at}`
      : post.status === "failed_truncation" ? `failed after ${post.retry_count} attempts (truncation)`
      : `pending${post.retry_count ? ` (${post.retry_count} attempt(s) failed)` : ""}`;
    console.log(`  [${post.id}] ${icon} ${post.title}`);
    console.log(`       ${status}`);
    if (post.urn) console.log(`       ${post.urn}`);
    console.log();
  }
}

const LINKEDIN_CHAR_LIMIT = 4000;
const MAX_RETRIES = 5;

function validateQueue() {
  const queue = loadQueue();
  const pending = queue.filter((p) => p.status === "pending");
  const over = pending.filter((p) => [...p.body].length > LINKEDIN_CHAR_LIMIT);
  if (over.length === 0) {
    console.log(`✓ All ${pending.length} pending posts are within the ${LINKEDIN_CHAR_LIMIT} char limit.`);
    return true;
  }
  console.error(`\n⚠️  ${over.length} pending posts exceed ${LINKEDIN_CHAR_LIMIT} chars:\n`);
  for (const p of over) {
    console.error(`  [${p.id}] ${[...p.body].length} chars — ${p.title}`);
  }
  return false;
}

function verifyPayload(body, snippets) {
  const { enSnippet, ptSnippet, hashtag } = snippets;
  const hasEN = !enSnippet || body.includes(enSnippet);
  const hasPT = !ptSnippet || body.includes(ptSnippet);
  const hasTag = !hashtag || body.includes(hashtag);
  return { hasEN, hasPT, hasTag, ok: hasEN && hasPT && hasTag };
}

async function fetchPostPage(postUrn) {
  if (!LI_AT) return { status: 0, body: "", finalUrl: "" };
  const urnId = postUrn.split(":").pop();
  let url = `https://www.linkedin.com/feed/update/${encodeURIComponent(postUrn)}/`;
  for (let i = 0; i < 5; i++) {
    const u = new URL(url);
    const result = await new Promise((resolve) => {
      const req = https.request({
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml",
          "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
          "Cookie": `li_at=${LI_AT}`,
        },
      }, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve({ status: res.statusCode, location: res.headers.location || "", body: data }));
      });
      req.setTimeout(20000, () => { req.destroy(); resolve({ status: 408, location: "", body: "" }); });
      req.on("error", () => resolve({ status: 0, location: "", body: "" }));
      req.end();
    });
    if ([301, 302, 303, 307, 308].includes(result.status) && result.location) {
      url = result.location.startsWith("http") ? result.location : `https://www.linkedin.com${result.location}`;
      continue;
    }
    const isPostPage = url.includes(urnId) || url.includes("feed/update");
    return { status: result.status, body: result.body, finalUrl: url, isPostPage };
  }
  return { status: 0, body: "", finalUrl: "", isPostPage: false };
}

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, headers: res.headers, body: data }); }
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

function getPostSnippets(body) {
  const BR_FLAG = "\u{1F1E7}\u{1F1F7}";
  const brIdx = body.indexOf(BR_FLAG);

  const enSection = brIdx !== -1 ? body.substring(0, brIdx) : body;
  const ptSection = brIdx !== -1 ? body.substring(brIdx + BR_FLAG.length) : "";

  const cleanLine = (l) => l.replace(/\p{Regional_Indicator}/gu, "").trim();

  const enLines = enSection.split("\n").map(cleanLine).filter((l) => l.length > 10);
  const ptLines = ptSection.split("\n").map(cleanLine).filter((l) => l.length > 10);

  const enSnippet = enLines[0]?.substring(0, 50) || "";
  const ptSnippet = ptLines[0]?.substring(0, 50) || "";

  const lastHashtagLine = body.split("\n").filter((l) => l.trim().startsWith("#")).pop() || "";
  const hashtag = lastHashtagLine.trim().split(" ")[0];

  return { enSnippet, ptSnippet, hashtag };
}

async function main() {
  if (process.argv.includes("--list")) { listQueue(); return; }
  if (process.argv.includes("--validate")) { process.exit(validateQueue() ? 0 : 1); }

  const queue = loadQueue();
  const pending = queue.filter((p) => p.status === "pending");

  if (pending.length === 0) { console.log("No pending posts in queue."); return; }

  for (const post of pending) {
    const snippets = getPostSnippets(post.body);
    const preCheck = verifyPayload(post.body, snippets);

    if (!preCheck.ok) {
      const missing = [!preCheck.hasEN && "EN", !preCheck.hasPT && "PT", !preCheck.hasTag && "hashtag"].filter(Boolean).join(", ");
      console.error(`\n❌ INVALID CONTENT in "${post.title}": missing ${missing}. Skipping.`);
      continue;
    }

    console.log(`\nPayload check OK:`);
    console.log(`  EN: "${snippets.enSnippet?.substring(0, 40)}"`);
    console.log(`  PT: "${snippets.ptSnippet?.substring(0, 40)}"`);
    console.log(`  hashtag: "${snippets.hashtag}"`);

    let succeeded = false;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      console.log(`\nPublishing "${post.title}"${attempt > 1 ? ` (attempt ${attempt}/${MAX_RETRIES})` : ""}...`);

      const payload = JSON.stringify({
        author: PERSON_URN,
        lifecycleState: "PUBLISHED",
        visibility: "PUBLIC",
        commentary: post.body,
        distribution: {
          feedDistribution: "MAIN_FEED",
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
      });

      const res = await request({
        hostname: "api.linkedin.com",
        path: "/rest/posts",
        method: "POST",
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
          "LinkedIn-Version": "202503",
          "X-Restli-Protocol-Version": "2.0.0",
        },
      }, payload);

      if (res.status !== 201) {
        console.error(`Error publishing "${post.title}" (HTTP ${res.status}):`);
        console.error(JSON.stringify(res.body, null, 2));
        const isTooLong = res.status === 400 &&
          JSON.stringify(res.body).includes("FIELD_ARRAY_SIZE_TOO_HIGH");
        if (isTooLong) {
          console.error(`Post exceeds LinkedIn ${LINKEDIN_CHAR_LIMIT} char limit. Edit and retry.`);
          post.status = "failed_truncation";
          post.retry_count = (post.retry_count || 0) + 1;
          saveQueue(queue);
          break;
        }
        if (attempt < MAX_RETRIES) {
          console.log(`Retrying in 5s...`);
          await new Promise((r) => setTimeout(r, 5000));
          continue;
        }
        break;
      }

      const postUrn = res.headers["x-restli-id"] || "";
      if (postUrn) post.urn = postUrn;

      if (LI_AT && postUrn) {
        console.log("Waiting for LinkedIn to index post (60s)...");
        await new Promise((r) => setTimeout(r, 60000));
        console.log(`Verifying published post via scraping...`);

        const page = await fetchPostPage(postUrn);
        console.log(`  Final URL: ${page.finalUrl?.substring(0, 100)} | status: ${page.status} | len: ${page.body.length}`);

        if (page.status === 200 && page.body.length > 1000 && page.isPostPage) {
          const hasEN = !snippets.enSnippet || page.body.includes(snippets.enSnippet);
          const hasPT = !snippets.ptSnippet || page.body.includes(snippets.ptSnippet);
          const hasTag = !snippets.hashtag || page.body.includes(snippets.hashtag);

          if (hasEN && hasPT && hasTag) {
            console.log(`✅ Post-publish verification OK: EN, PT and hashtag found on page.`);
          } else {
            const missing = [!hasEN && "EN", !hasPT && "PT", !hasTag && "hashtag"].filter(Boolean).join(", ");
            console.warn(`⚠️  Content not found on page: missing ${missing}. Keeping post (API 201 guarantees correct content).`);
          }
        } else {
          console.warn(`Verification: page not available (status ${page.status}). Keeping post.`);
        }
      } else if (!LI_AT) {
        console.log(`ℹ️  LI_AT not set — skipping post-publish verification.`);
      }

      post.status = "published";
      post.published_at = new Date().toISOString();
      post.retry_count = attempt > 1 ? attempt - 1 : undefined;
      saveQueue(queue);

      console.log(`✅ Published successfully!`);
      if (postUrn) console.log(`URN: ${postUrn}`);
      console.log(`Pending posts remaining: ${queue.filter((p) => p.status === "pending").length}`);
      succeeded = true;
      break;
    }

    if (succeeded) return;

    console.error(`"${post.title}" failed after ${MAX_RETRIES} attempts. Waiting for next trigger.`);
    process.exit(1);
  }

  console.log("No posts published in this run.");
  process.exit(0);
}

main().catch((err) => { console.error("Unexpected error:", err); process.exit(1); });
